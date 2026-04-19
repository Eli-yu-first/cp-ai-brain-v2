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
  SlidersHorizontal,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Package,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
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

// 月份名称映射
const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

// 收储时长选项（月数）
const DURATION_OPTIONS = [
  { label: "1个月", value: 1 },
  { label: "2个月", value: 2 },
  { label: "3个月", value: 3 },
  { label: "4个月", value: 4 },
  { label: "5个月", value: 5 },
  { label: "6个月", value: 6 },
  { label: "7个月", value: 7 },
  { label: "8个月", value: 8 },
  { label: "9个月", value: 9 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl min-w-[200px]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: entry.color }}>
              {entry.dataKey === "profitSpace"
                ? `${entry.value >= 0 ? "+" : ""}${Number(entry.value).toFixed(2)} 元/kg`
                : `¥${Number(entry.value).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimeArbitragePage() {
  const { t } = useLanguage();

  // 参数状态
  const [spotPrice, setSpotPrice] = useState(9.0);
  const [futuresPrice, setFuturesPrice] = useState(12.0);
  const [socialCost, setSocialCost] = useState(12.0);
  const [holdingCost, setHoldingCost] = useState(0.20);
  const [storageTons, setStorageTons] = useState(1000);
  const [startMonth, setStartMonth] = useState(4);
  const [storageDuration, setStorageDuration] = useState(6); // 收储时长（月）

  // 计算收储结束月（用于显示，但实际后端固定返回9个月数据）
  const endMonth = ((startMonth - 1 + storageDuration - 1) % 12) + 1;

  const { data: simulation, isLoading: simulationLoading } = trpc.platform.arbitrageSimulate.useQuery(
    {
      spotPrice,
      futuresPrice,
      holdingCostPerMonth: holdingCost,
      socialBreakevenCost: socialCost,
      storageTons,
      startMonth,
    },
    { placeholderData: (prev: any) => prev }
  );

  const {
    mutate: fetchDecision,
    data: aiDecision,
    isPending: isPredicting,
  } = trpc.platform.arbitrageAiDecision.useMutation();

  // 参数变化时自动触发 AI 决策（防抖 600ms）
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDecision({
        spotPrice,
        futuresPrice,
        holdingCostPerMonth: holdingCost,
        socialBreakevenCost: socialCost,
        storageTons,
        startMonth,
      });
    }, 600);
    return () => clearTimeout(handler);
  }, [spotPrice, futuresPrice, holdingCost, socialCost, storageTons, startMonth, fetchDecision]);

  // 根据收储时长截取数据
  const chartData = useMemo(() => {
    if (!simulation) return [];
    return simulation.months.slice(0, storageDuration).map((month, index) => ({
      month: MONTH_NAMES[month] ?? `${month}月`,
      costLine: simulation.costCurve[index],
      futurePriceLine: simulation.futurePriceCurve[index],
      socialCostLine: simulation.socialCostLine[index],
      profitSpace: simulation.profitSpace[index],
    }));
  }, [simulation, storageDuration]);

  const profitCards = useMemo(() => {
    if (!simulation) return [];
    return simulation.profits.slice(0, storageDuration);
  }, [simulation, storageDuration]);

  // 统计指标
  const stats = useMemo(() => {
    if (!simulation || profitCards.length === 0) return null;
    const arbitrageMonths = profitCards.filter(p => p.shouldArbitrage);
    const maxCard = profitCards.reduce((a, b) => (a.profit > b.profit ? a : b), profitCards[0]!);
    return {
      arbitrageCount: arbitrageMonths.length,
      maxProfitMonth: maxCard.month,
      maxProfit: maxCard.profit,
      maxTotalProfit: maxCard.totalProfit,
      capitalRequired: parseFloat((spotPrice * storageTons * 1000 / 10000).toFixed(0)),
    };
  }, [simulation, profitCards, spotPrice, storageTons]);

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

      {/* 顶部统计卡片 */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "套利窗口月数",
              value: `${stats.arbitrageCount} 个月`,
              sub: `共 ${storageDuration} 个月中`,
              color: "text-cyan-400",
              icon: <CalendarDays className="h-4 w-4 text-cyan-400" />,
            },
            {
              label: "最佳出货月",
              value: `${stats.maxProfitMonth} 月`,
              sub: `利润 +${stats.maxProfit.toFixed(2)} 元/kg`,
              color: "text-emerald-400",
              icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "最大总利润",
              value: `${stats.maxTotalProfit} 万元`,
              sub: `按 ${storageTons} 吨计算`,
              color: stats.maxTotalProfit > 0 ? "text-emerald-400" : "text-rose-400",
              icon: <LineChartIcon className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "预估资金占用",
              value: `${stats.capitalRequired} 万元`,
              sub: `现货价 ¥${spotPrice.toFixed(2)}/kg`,
              color: "text-amber-400",
              icon: <Package className="h-4 w-4 text-amber-400" />,
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TechPanel className="p-4 rounded-[16px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">{item.label}</span>
                  {item.icon}
                </div>
                <p className={`font-mono text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.sub}</p>
              </TechPanel>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 参数控制面板 */}
        <div className="lg:col-span-4 space-y-4">
          <TechPanel className="relative overflow-hidden p-6 rounded-[24px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600 rounded-l-[24px]" />
            <h4 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase opacity-90">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              {t("timeArbitrage.paramSetting")}
            </h4>

            <div className="space-y-6">
              {/* 当前毛猪价 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <PiggyBank className="h-3.5 w-3.5 text-slate-500" />
                    当前毛猪价 (元/kg)
                  </label>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 text-[13px]">
                    ¥{spotPrice.toFixed(1)}
                  </span>
                </div>
                <Slider min={6} max={25} step={0.1} value={[spotPrice]}
                  onValueChange={(val) => setSpotPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 预期未来价 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <LineChartIcon className="h-3.5 w-3.5 text-slate-500" />
                    预期未来价 (元/kg)
                  </label>
                  <span className="font-mono text-violet-300 font-bold bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20 text-[13px]">
                    ¥{futuresPrice.toFixed(1)}
                  </span>
                </div>
                <Slider min={6} max={25} step={0.1} value={[futuresPrice]}
                  onValueChange={(val) => setFuturesPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 社会养殖成本 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-slate-500" />
                    社会养殖成本 (元/kg)
                  </label>
                  <span className="font-mono text-orange-300 font-bold bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20 text-[13px]">
                    ¥{socialCost.toFixed(1)}
                  </span>
                </div>
                <Slider min={8} max={20} step={0.1} value={[socialCost]}
                  onValueChange={(val) => setSocialCost(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 仓储费 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <TimerReset className="h-3.5 w-3.5 text-slate-500" />
                    仓储费 (元/kg/月)
                  </label>
                  <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[13px]">
                    ¥{holdingCost.toFixed(2)}
                  </span>
                </div>
                <Slider min={0.05} max={1.5} step={0.01} value={[holdingCost]}
                  onValueChange={(val) => setHoldingCost(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 收储量 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-slate-500" />
                    收储量 (吨)
                  </label>
                  <span className="font-mono text-sky-300 font-bold bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20 text-[13px]">
                    {storageTons.toLocaleString()} 吨
                  </span>
                </div>
                <Slider min={100} max={10000} step={100} value={[storageTons]}
                  onValueChange={(val) => setStorageTons(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 收储起始月 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                    收储起始月
                  </label>
                  <span className="font-mono text-rose-300 font-bold bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20 text-[13px]">
                    {startMonth} 月
                  </span>
                </div>
                <Slider min={1} max={12} step={1} value={[startMonth]}
                  onValueChange={(val) => setStartMonth(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              {/* 收储时长选择器 */}
              <div className="space-y-3">
                <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-slate-500" />
                  收储时长（月）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStorageDuration(opt.value)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
                        storageDuration === opt.value
                          ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300"
                          : "bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  {startMonth} 月 → {endMonth} 月（共 {storageDuration} 个月）
                </p>
              </div>
            </div>
          </TechPanel>
        </div>

        {/* 多指标价格曲线图 */}
        <div className="lg:col-span-8 space-y-4">
          <TechPanel className="p-6 flex flex-col relative rounded-[24px] h-[520px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold tracking-wide text-white">价格曲线 — 持有成本 VS 未来价格</h4>
                <p className="mt-1 text-[12px] text-slate-400">
                  当预期售价线高于持有成本线时，即存在有效套利区间（绿色柱）。
                </p>
              </div>
            </div>

            {/* 图例 */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-medium">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-0.5 bg-cyan-400 rounded-full inline-block" />
                持有成本线
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-0.5 bg-violet-400 rounded-full inline-block" />
                预期售价线
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-0.5 bg-orange-400 rounded-full inline-block border-dashed" style={{ borderTop: '2px dashed #fb923c', height: 0 }} />
                社会养殖成本
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60 inline-block" />
                利润空间
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
              {simulationLoading && !chartData.length ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      dy={8}
                    />
                    {/* 左轴：价格 */}
                    <YAxis
                      yAxisId="price"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => `¥${v}`}
                      width={52}
                    />
                    {/* 右轴：利润空间 */}
                    <YAxis
                      yAxisId="profit"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
                      tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}`}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                      content={<CustomTooltip />}
                    />

                    {/* 利润空间柱（背景层） */}
                    <Bar
                      yAxisId="profit"
                      dataKey="profitSpace"
                      name="利润空间 (元/kg)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            (entry.profitSpace ?? 0) >= 0
                              ? "rgba(16,185,129,0.35)"
                              : "rgba(239,68,68,0.25)"
                          }
                          stroke={
                            (entry.profitSpace ?? 0) >= 0
                              ? "rgba(16,185,129,0.6)"
                              : "rgba(239,68,68,0.5)"
                          }
                          strokeWidth={1}
                        />
                      ))}
                    </Bar>

                    {/* 社会养殖成本线（虚线） */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="socialCostLine"
                      name="社会养殖成本"
                      stroke="#fb923c"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={{ r: 3, fill: "#fb923c" }}
                    />

                    {/* 持有成本线 */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="costLine"
                      name="持有成本线"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#0a1628", stroke: "#38bdf8", strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: "#0a1628", stroke: "#38bdf8", strokeWidth: 2 }}
                    />

                    {/* 预期售价线 */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="futurePriceLine"
                      name="预期售价线"
                      stroke="#a78bfa"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#0a1628", stroke: "#a78bfa", strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </TechPanel>
        </div>
      </div>

      {/* 利润预测卡片 + AI 决策 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-8">
        {/* 月度利润预测卡片 */}
        <TechPanel className="lg:col-span-8 p-6 flex flex-col rounded-[24px]">
          <h4 className="text-sm font-semibold tracking-wide text-white mb-5 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-cyan-400" />
            {t("timeArbitrage.adviceTitle")}
            <span className="ml-auto text-[11px] text-slate-500 font-normal">元/kg（右侧为万元总利润）</span>
          </h4>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {profitCards.map((card, idx) => (
              <motion.div
                key={`${card.month}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-[14px] border p-3 text-center transition-all ${
                  card.shouldArbitrage
                    ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                    : "border-white/5 bg-white/5"
                }`}
              >
                <p className="text-[11px] font-medium text-slate-400 mb-1.5">{card.month}月</p>
                <p className={`font-mono text-base font-bold tracking-tight ${card.shouldArbitrage ? "text-emerald-400" : "text-slate-500"}`}>
                  {card.profit > 0 ? "+" : ""}{card.profit.toFixed(2)}
                </p>
                {card.shouldArbitrage && (
                  <p className="text-[10px] text-emerald-500/80 mt-1 font-mono">
                    +{card.totalProfit}万元
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </TechPanel>

        {/* AI 决策推理 */}
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
                className="space-y-4 text-[13px] leading-relaxed"
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
                      aiDecision.decision.map((d: string) => (
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

                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[12px]">
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
