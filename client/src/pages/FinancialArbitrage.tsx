import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { ArbitrageControlSlider } from "@/components/platform/ArbitrageControlSlider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  CandlestickChart,
  LineChart as LineChartIcon,
  PiggyBank,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(2)}万`;
  return val.toFixed(0);
}

function SummaryCard({ label, value, unit, icon: Icon, color, subtext, highlight = false }: any) {
  return (
    <div className={`flex flex-col p-4 rounded-2xl relative ${highlight ? 'bg-indigo-900/40 border border-indigo-500/50' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[11px] text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${highlight ? 'text-indigo-100' : 'text-slate-100'}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {subtext && <p className="text-[10px] text-slate-500 mt-1.5">{subtext}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl min-w-[220px]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">价格涨跌幅 {label}%</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: entry.color }}>
              {entry.name === "折合售价" ? `¥${Number(entry.value).toFixed(2)}` : `${entry.value >= 0 ? "+" : ""}${formatCurrency(entry.value)}元`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinancialArbitragePage() {
  const { t } = useLanguage();

  const [spotPrice, setSpotPrice] = useState(15.2);
  const [futuresPrice, setFuturesPrice] = useState(15.8);
  const [expectedFutureSpotPrice, setExpectedFutureSpotPrice] = useState(14.5);
  const [expectedFutureFuturesPrice, setExpectedFutureFuturesPrice] = useState(14.6);
  const [physicalExposureTons, setPhysicalExposureTons] = useState(1600);
  const [hedgeRatio, setHedgeRatio] = useState(0.8);

  const { data: result, isLoading } = trpc.platform.financialArbitrageSimulate.useQuery(
    {
      spotPrice,
      futuresPrice,
      expectedFutureSpotPrice,
      expectedFutureFuturesPrice,
      physicalExposureTons,
      hedgeRatio,
      marginRate: 0.08,
      contractSize: 16,
    },
    { refetchOnWindowFocus: false, staleTime: 1000 }
  );

  return (
    <PlatformShell title="金融套利与对冲" eyebrow="Financial Hedging" pageId="financial-arbitrage">
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <CandlestickChart className="h-7 w-7 text-indigo-400" />
              期货套期保值与基差套利
            </h1>
            <p className="text-slate-500 text-xs">
              基于大商所生猪期货(LH)的风险对冲模型 · 动态基差试算 · 压力测试
            </p>
          </div>
          <div className="flex gap-3">
             <Button
                onClick={() => {
                  setSpotPrice(15.2);
                  setFuturesPrice(15.8);
                  setExpectedFutureSpotPrice(14.5);
                  setExpectedFutureFuturesPrice(14.6);
                  setHedgeRatio(0.8);
                }}
                variant="outline"
                size="sm"
                className="border-white/[0.1] text-slate-400 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                重置防守策略
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* 左侧参数控制 */}
          <div className="xl:col-span-4 space-y-6">
            <TechPanel className="p-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                市场挂牌与敞口配置
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">风险敞口</label>
                  <p className="text-[10px] text-slate-500 mb-3">当前存储或即将出栏的未定价现货规模</p>
                  <ArbitrageControlSlider
                    label="风险敞口"
                    value={physicalExposureTons}
                    onChange={setPhysicalExposureTons}
                    min={160} max={16000} step={16}
                    suffix="吨"
                  />
                  {result && (
                     <div className="mt-2 text-right">
                       <span className="text-[10px] text-indigo-300/80 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                         ≈ {result.contractsNeeded} 手 生猪期货 (16吨/手)
                       </span>
                     </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <label className="text-xs text-slate-400 mb-1 block">现货单价 vs 期货价格 (当前)</label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <ArbitrageControlSlider
                      label="现货单价"
                      value={spotPrice} onChange={setSpotPrice}
                      min={10} max={25} step={0.1} suffix="元/kg"
                    />
                    <ArbitrageControlSlider
                      label="主力期货"
                      value={futuresPrice} onChange={setFuturesPrice}
                      min={10} max={25} step={0.1} suffix="元/kg"
                    />
                  </div>
                  {result && (
                     <div className="mt-3 flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                       <span className="text-[11px] text-slate-400">当前基差 (现货-期货)</span>
                       <span className={`font-mono text-sm font-bold ${result.basisNow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         {result.basisNow >= 0 ? '+' : ''}{result.basisNow.toFixed(2)}
                       </span>
                     </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5">
                   <label className="text-xs text-slate-400 mb-1 block text-amber-400/80">预估未来结平价格</label>
                   <p className="text-[10px] text-slate-500 mb-3">对未来数月后现货与期货价格的研判</p>
                   <div className="grid grid-cols-2 gap-4 mt-3">
                    <ArbitrageControlSlider
                      label="未来现货"
                      value={expectedFutureSpotPrice} onChange={setExpectedFutureSpotPrice}
                      min={10} max={25} step={0.1} suffix="元/kg"
                    />
                    <ArbitrageControlSlider
                      label="未来期货"
                      value={expectedFutureFuturesPrice} onChange={setExpectedFutureFuturesPrice}
                      min={10} max={25} step={0.1} suffix="元/kg"
                    />
                  </div>
                  {result && (
                     <div className="mt-3 flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                       <span className="text-[11px] text-slate-400">预期期末基差</span>
                       <span className={`font-mono text-sm font-bold ${result.basisFuture >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         {result.basisFuture >= 0 ? '+' : ''}{result.basisFuture.toFixed(2)}
                       </span>
                     </div>
                  )}
                </div>

                <div className="pt-4 border-t border-indigo-500/20">
                  <div className="flex justify-between items-end mb-3">
                     <label className="text-xs text-indigo-300 font-semibold block">套期保值比例 (Hedge Ratio)</label>
                     <span className="text-2xl font-mono text-indigo-400">{(hedgeRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.05} value={hedgeRatio} onChange={(e) => setHedgeRatio(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-indigo-900/50 accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                    <span>纯现货暴露 (0%)</span>
                    <span>完全套保对冲 (100%)</span>
                  </div>
                </div>

              </div>
            </TechPanel>
          </div>

          {/* 右侧核心分析 */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* 顶栏卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard 
                label="预期现货盈亏" value={result ? formatCurrency(result.spotPnL) : "-"} unit="元" 
                icon={TrendingDown} color="text-red-400" 
                subtext={`按单价 ${expectedFutureSpotPrice.toFixed(1)} 元核算`}
              />
              <SummaryCard 
                label="期货套保盈亏" value={result ? formatCurrency(result.futuresPnL) : "-"} unit="元" 
                icon={TrendingUp} color="text-emerald-400" 
                subtext={`按 ${result?.contractsNeeded ?? 0} 手空单卖出计算`}
              />
              <SummaryCard 
                label="组合净盈亏" value={result ? formatCurrency(result.netPnL) : "-"} unit="元" 
                icon={Scale} color="text-indigo-400" 
                subtext="现货亏损与期货盈利对冲"
                highlight={true}
              />
              <SummaryCard 
                label="套保资金占用" value={result ? formatCurrency(result.totalMargin) : "-"} unit="元" 
                icon={PiggyBank} color="text-amber-400" 
                subtext="按8%保证金比例测算"
              />
            </div>

            {/* AI 洞察 */}
            <TechPanel className="p-5 flex gap-4 items-start bg-indigo-500/5 border-indigo-500/20">
              <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center mt-1">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  AI 量化金融洞察
                  {result && result.netPnL > 0 && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">正向阿尔法</Badge>}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {result ? result.aiInsight : "分析中..."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                     <p className="text-[10px] text-slate-500 uppercase">现货无对冲预期售价</p>
                     <p className="text-lg font-mono text-red-300 mt-1">¥{expectedFutureSpotPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20">
                     <p className="text-[10px] text-indigo-300 uppercase">加持套保后折合每公斤售价</p>
                     <p className="text-lg font-mono text-indigo-300 mt-1 font-bold">¥{result?.effectivePrice.toFixed(2) ?? "-"}</p>
                  </div>
                </div>
              </div>
            </TechPanel>

            {/* 情景压测图表 */}
            <TechPanel className="p-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-400" />
                抗风险压力测试图 (防弹衣效应)
                <span className="text-[10px] text-slate-500 font-normal ml-2">横轴: 现货价格极端跌幅(%)，纵轴: 盈亏绝对值(元)</span>
              </h3>
              <div className="h-[340px] w-full">
                {result && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.sensitivity} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="priceDropPercent" tickFormatter={(v) => `${v}%`} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => `¥${v.toFixed(1)}`} tick={{ fill: "#818cf8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      
                      <ReferenceLine y={0} yAxisId="left" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                      
                      <Bar yAxisId="left" dataKey="spotPnL" name="现货盈亏" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar yAxisId="left" dataKey="futuresPnL" name="期货套保回血" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Line yAxisId="left" type="monotone" dataKey="netPnL" name="防守后总净值" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b" }} />
                      <Line yAxisId="right" type="monotone" dataKey="effectivePrice" name="折合售价" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TechPanel>

          </div>
        </div>
      </div>
    </PlatformShell>
  );
}

