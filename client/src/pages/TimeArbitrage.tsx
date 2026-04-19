import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Calculator,
  CalendarDays,
  LineChart as LineChartIcon,
  PiggyBank,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{label} 月</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="font-mono font-semibold text-white">¥{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimeArbitragePage() {
  const { t } = useLanguage();
  const [spotPrice, setSpotPrice] = useState(9.0);
  const [futuresPrice, setFuturesPrice] = useState(12.0);
  const [holdingCost, setHoldingCost] = useState(0.2);

  const { data: simulation, isLoading: simulationLoading } = trpc.platform.arbitrageSimulate.useQuery(
    { spotPrice, futuresPrice, holdingCostPerMonth: holdingCost },
    { keepPreviousData: true }
  );

  const {
    mutate: fetchDecision,
    data: aiDecision,
    isPending: isPredicting,
  } = trpc.platform.arbitrageAiDecision.useMutation();

  // Re-trigger AI decision when sliders settle (using a simple debounce effect)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDecision({ spotPrice, futuresPrice, holdingCostPerMonth: holdingCost });
    }, 600);
    return () => clearTimeout(handler);
  }, [spotPrice, futuresPrice, holdingCost, fetchDecision]);

  const chartData = useMemo(() => {
    if (!simulation) return [];
    return simulation.months.map((month, index) => ({
      month,
      costLine: simulation.costCurve[index],
      profitLine: simulation.futurePriceCurve[index],
      profitSpace: parseFloat((simulation.futurePriceCurve[index]! - simulation.costCurve[index]!).toFixed(2)),
    }));
  }, [simulation]);

  const profitCards = useMemo(() => {
    if (!simulation) return [];
    return simulation.profits;
  }, [simulation]);

  return (
    <PlatformShell
      title={t("timeArbitrage.pageTitle")}
      eyebrow="Time Arbitrage"
      pageId="time-arbitrage"
    >
      <SectionHeader
        eyebrow="Arbitrage Simulation"
        title={t("timeArbitrage.pageTitle")}
        description={t("timeArbitrage.pageDesc")}
        aside={
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="mr-1 h-3 w-3" /> 模型已启用
            </Badge>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Parameters Control */}
        <div className="lg:col-span-4 space-y-6">
          <TechPanel className="relative overflow-hidden p-6 rounded-[24px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600 rounded-l-[24px]" />
            <h4 className="mb-6 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase opacity-90">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              {t("timeArbitrage.paramSetting")}
            </h4>

            <div className="space-y-8">
              {/* Spot Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-slate-500" />
                    {t("timeArbitrage.spotPrice")}
                  </label>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    ¥{spotPrice.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={6}
                  max={25}
                  step={0.1}
                  value={[spotPrice]}
                  onValueChange={(val) => setSpotPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              {/* Expected Futures Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-slate-500" />
                    {t("timeArbitrage.futuresPrice")}
                  </label>
                  <span className="font-mono text-violet-300 font-bold bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20">
                    ¥{futuresPrice.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={6}
                  max={25}
                  step={0.1}
                  value={[futuresPrice]}
                  onValueChange={(val) => setFuturesPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              {/* Holding Cost */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                    <TimerReset className="h-4 w-4 text-slate-500" />
                    {t("timeArbitrage.holdingCost")}
                  </label>
                  <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    ¥{holdingCost.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0.05}
                  max={1.5}
                  step={0.01}
                  value={[holdingCost]}
                  onValueChange={(val) => setHoldingCost(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-start gap-4">
                <div className="bg-white/5 rounded-lg p-2.5 shrink-0">
                  <Calculator className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[12px] text-slate-400 leading-relaxed">
                    调整上述核心参数，模型将实时测算持有成本保本线与未来月度售价差值，并于右侧呈现最佳收储或抛售时机。
                  </p>
                </div>
              </div>
            </div>
          </TechPanel>
        </div>

        {/* Dynamic Chart */}
        <div className="lg:col-span-8 space-y-6">
          <TechPanel className="h-[460px] p-6 flex flex-col relative rounded-[24px]">
             {/* Chart Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold tracking-wide text-white">价格曲线 — 持有成本 VS 未来价格</h4>
                <p className="mt-1 text-[12px] text-slate-400">若未来价格线穿透并高于保本线，即视为有效套利区间。</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium">
                 <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-4 h-1 bg-cyan-400 rounded-full" />
                    {t("timeArbitrage.costLine")}
                 </div>
                 <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-4 h-1 bg-violet-400 rounded-full" />
                    {t("timeArbitrage.profitLine")}
                 </div>
              </div>
            </div>
            
            {/* Recharts Area */}
            <div className="flex-1 w-full min-h-0 relative">
              {simulationLoading && !chartData.length ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(v) => `${v}月`}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontFamily: "monospace" }}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `¥${v}`}
                    />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} content={<CustomTooltip />} />
                    
                    <Line
                      type="monotone"
                      dataKey="costLine"
                      name={t("timeArbitrage.costLine")}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#0a1628", stroke: "#38bdf8", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profitLine"
                      name={t("timeArbitrage.profitLine")}
                      stroke="#a78bfa"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#a78bfa", stroke: "#a78bfa" }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </TechPanel>
        </div>
      </div>

      {/* Logic Results & AI Output */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-8">
        
        {/* Month grid cards */}
        <TechPanel className="lg:col-span-8 p-6 flex flex-col rounded-[24px]">
          <h4 className="text-sm font-semibold tracking-wide text-white mb-6 flex items-center gap-2">
             <CalendarDays className="h-4 w-4 text-cyan-400" />
             {t("timeArbitrage.adviceTitle")}
          </h4>
          
          <div className="grid grid-cols-4 gap-4">
             {profitCards.map((card, idx) => (
               <motion.div
                 key={card.month}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className={`rounded-[16px] border p-4 text-center transition-all ${
                   card.shouldArbitrage
                     ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                     : "border-white/5 bg-white/5"
                 }`}
               >
                 <p className="text-[13px] font-medium text-slate-400 mb-2">{card.month}月</p>
                 <p className={`font-mono text-lg font-bold tracking-tight ${card.shouldArbitrage ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {card.profit > 0 ? "+" : ""}{card.profit.toFixed(2)}
                 </p>
               </motion.div>
             ))}
          </div>
        </TechPanel>

        {/* AI Action Panel */}
        <TechPanel className="lg:col-span-4 p-6 flex flex-col rounded-[24px]">
          <h4 className="text-sm font-semibold tracking-wide text-white mb-5 flex items-center gap-2">
             <BrainCircuit className="h-4 w-4 text-violet-400" />
             {t("timeArbitrage.aiReasoning")}
          </h4>
          
          <div className="flex-1 relative">
            {isPredicting ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <p className="text-xs text-slate-400 animate-pulse">Running quantitative arbitrage model...</p>
              </div>
            ) : aiDecision ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5 text-[13px] leading-relaxed relative"
              >
                 <div>
                    <span className="font-semibold text-white block mb-1">{t("timeArbitrage.marketAnalysis")}</span>
                    <span className="text-slate-300">{aiDecision.marketAnalysis}</span>
                 </div>
                 
                 <div className="h-px bg-white/5 w-full" />
                 
                 <div>
                    <span className="font-semibold text-white block mb-1">{t("timeArbitrage.costRecommendation")}</span>
                    <span className="text-slate-300">{aiDecision.costRecommendation}</span>
                 </div>
                 
                 <div className="h-px bg-white/5 w-full" />
                 
                 <div>
                    <span className="font-semibold text-white block mb-2">{t("timeArbitrage.decision")}</span>
                    <div className="flex flex-wrap gap-2">
                      {aiDecision.decision && aiDecision.decision.length > 0 ? (
                        aiDecision.decision.map(d => (
                          <span key={d} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full text-xs font-medium">
                          无套利空间 (观望)
                        </span>
                      )}
                    </div>
                 </div>

                 <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[12px] mt-4">
                    <span className="font-semibold text-rose-300 block mb-1">{t("timeArbitrage.riskWarning")}</span>
                    <span className="text-rose-200/80 text-[12px]">{aiDecision.riskWarning}</span>
                 </div>
              </motion.div>
            ) : null}
          </div>
        </TechPanel>
      </div>

    </PlatformShell>
  );
}
