import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  CalendarDays,
  LayersIcon,
  LineChart as LineChartIcon,
  PiggyBank,
  Save,
  SlidersHorizontal,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Package,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Bar,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

type PlanSnapshot = {
  id: string;
  label: string;
  color: string;
  params: {
    spotPrice: number;
    holdingCost: number;
    socialCost: number;
    storageTons: number;
    startMonth: number;
    storageDuration: number;
  };
};

const PLAN_COLORS = ["#06b6d4", "#a78bfa", "#f59e0b"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl min-w-[220px]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: entry.color }}>
              {String(entry.dataKey).startsWith("profitSpace")
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
  const [socialCost, setSocialCost] = useState(12.0);
  const [holdingCost, setHoldingCost] = useState(0.20);
  const [storageTons, setStorageTons] = useState(1000);
  const [startMonth, setStartMonth] = useState(4);
  const [storageDuration, setStorageDuration] = useState(6);

  // 多方案对比
  const [savedPlans, setSavedPlans] = useState<PlanSnapshot[]>([]);

  const endMonth = ((startMonth - 1 + storageDuration - 1) % 12) + 1;

  const { data: simulation, isLoading: simulationLoading } = trpc.platform.arbitrageSimulate.useQuery(
    {
      spotPrice,
      holdingCostPerMonth: holdingCost,
      socialBreakevenCost: socialCost,
      storageTons,
      startMonth,
      storageDurationMonths: storageDuration,
    },
    { placeholderData: (prev: any) => prev }
  );

  const {
    mutate: fetchDecision,
    data: aiDecision,
    isPending: isPredicting,
  } = trpc.platform.arbitrageAiDecision.useMutation();

  const { mutate: saveRecord, isPending: isSavingRecord } =
    trpc.platform.saveArbitrageRecord.useMutation({
      onSuccess: () => toast.success("方案已保存到审计日志"),
      onError: (e) => toast.error(`保存失败：${e.message}`),
    });

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDecision({
        spotPrice,
        holdingCostPerMonth: holdingCost,
        socialBreakevenCost: socialCost,
        storageTons,
        startMonth,
        storageDurationMonths: storageDuration,
      });
    }, 600);
    return () => clearTimeout(handler);
  }, [spotPrice, holdingCost, socialCost, storageTons, startMonth, storageDuration, fetchDecision]);

  // 查询其他已保存方案的曲线数据
  const planQueries = savedPlans.map((plan) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.platform.arbitrageSimulate.useQuery(
      {
        spotPrice: plan.params.spotPrice,
        holdingCostPerMonth: plan.params.holdingCost,
        socialBreakevenCost: plan.params.socialCost,
        storageTons: plan.params.storageTons,
        startMonth: plan.params.startMonth,
        storageDurationMonths: plan.params.storageDuration,
      },
      { placeholderData: (prev: any) => prev }
    )
  );

  // 主图表数据
  const chartData = useMemo(() => {
    if (!simulation) return [];
    return simulation.months.map((month, index) => {
      const row: any = {
        month: MONTH_NAMES[month] ?? `${month}月`,
        costLine: simulation.costCurve[index],
        futurePriceLine: simulation.futurePriceCurve[index],
        socialCostLine: simulation.socialCostLine[index],
        profitSpace: simulation.profitSpace[index],
      };
      savedPlans.forEach((plan, idx) => {
        const planSim = planQueries[idx]?.data;
        if (planSim) {
          const alignIdx = planSim.months.findIndex(m => m === month);
          if (alignIdx >= 0) {
            row[`plan${idx}Cost`] = planSim.costCurve[alignIdx];
          }
        }
      });
      return row;
    });
  }, [simulation, savedPlans, planQueries]);

  const profitCards = useMemo(() => simulation?.profits ?? [], [simulation]);

  const stats = useMemo(() => {
    if (!simulation || profitCards.length === 0) return null;
    const arbitrageMonths = profitCards.filter(p => p.shouldArbitrage);
    return {
      arbitrageCount: arbitrageMonths.length,
      maxProfitMonth: simulation.maxProfitMonth,
      maxProfit: simulation.maxProfit,
      maxTotalProfit: simulation.maxTotalProfit,
      capitalRequired: parseFloat((spotPrice * storageTons * 1000 / 10000).toFixed(0)),
    };
  }, [simulation, profitCards, spotPrice, storageTons]);

  // 收储期高亮
  const arbitrageWindow = simulation?.arbitrageWindow;
  const windowStartLabel = arbitrageWindow ? MONTH_NAMES[arbitrageWindow.startMonth] : null;
  const windowEndLabel = arbitrageWindow ? MONTH_NAMES[arbitrageWindow.endMonth] : null;

  // 保存当前方案为对比方案
  const handleSavePlan = () => {
    if (savedPlans.length >= 3) {
      toast.warning("最多保存 3 组对比方案");
      return;
    }
    const newPlan: PlanSnapshot = {
      id: `plan-${Date.now()}`,
      label: `方案${String.fromCharCode(65 + savedPlans.length)}`,
      color: PLAN_COLORS[savedPlans.length]!,
      params: { spotPrice, holdingCost, socialCost, storageTons, startMonth, storageDuration },
    };
    setSavedPlans([...savedPlans, newPlan]);
    toast.success(`已保存为${newPlan.label}作对比`);
  };

  const handleRemovePlan = (id: string) => {
    setSavedPlans(savedPlans.filter(p => p.id !== id));
  };

  // 持久化保存到数据库
  const handlePersist = () => {
    if (!simulation || !stats) return;
    saveRecord({
      recordType: "time",
      scenarioLabel: `${startMonth}月起${storageDuration}个月 | ${storageTons}吨`,
      params: { spotPrice, holdingCost, socialCost, storageTons, startMonth, storageDuration },
      result: {
        maxProfit: stats.maxProfit,
        maxProfitMonth: stats.maxProfitMonth,
        maxTotalProfit: stats.maxTotalProfit,
        arbitrageWindow: simulation.arbitrageWindow,
        arbitrageCount: stats.arbitrageCount,
      },
      summaryProfit: `${stats.maxTotalProfit > 0 ? "+" : ""}${stats.maxTotalProfit}万元`,
      summaryMetric: `${stats.maxProfitMonth}月出货 / +${stats.maxProfit.toFixed(2)}元·kg`,
    });
  };

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
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
              onClick={handleSavePlan}
            >
              <LayersIcon className="mr-1.5 h-3.5 w-3.5" />
              存为对比方案
            </Button>
            <Button
              size="sm"
              className="h-8 bg-emerald-500/90 text-white hover:bg-emerald-500"
              onClick={handlePersist}
              disabled={isSavingRecord}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSavingRecord ? "保存中…" : "保存决策记录"}
            </Button>
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
              sub: arbitrageWindow ? `${windowStartLabel} → ${windowEndLabel}` : "无有效窗口",
              color: "text-cyan-400",
              icon: <CalendarDays className="h-4 w-4 text-cyan-400" />,
            },
            {
              label: "最佳出货月",
              value: `${stats.maxProfitMonth} 月`,
              sub: `价差 +${stats.maxProfit.toFixed(2)} 元/kg`,
              color: "text-emerald-400",
              icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "最大总利润",
              value: `${stats.maxTotalProfit > 0 ? "+" : ""}${stats.maxTotalProfit} 万元`,
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

      {/* 已保存方案标签栏 */}
      {savedPlans.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider mr-2">
            <LayersIcon className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            多方案对比
          </span>
          {savedPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium"
              style={{
                borderColor: `${plan.color}55`,
                backgroundColor: `${plan.color}15`,
                color: plan.color,
              }}
            >
              <span className="font-semibold">{plan.label}</span>
              <span className="font-mono text-slate-400">
                现价¥{plan.params.spotPrice.toFixed(1)} / {plan.params.storageDuration}月
              </span>
              <button
                onClick={() => handleRemovePlan(plan.id)}
                className="text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
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
                <p className="text-[10.5px] text-slate-500">生猪期货预测价会自动以此为保本点生成曲线</p>
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

              {/* 收储时长 - 改为滑块 1-10 月 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    <TimerReset className="h-3.5 w-3.5 text-slate-500" />
                    收储时长（月）
                  </label>
                  <span className="font-mono text-violet-300 font-bold bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20 text-[13px]">
                    {storageDuration} 个月
                  </span>
                </div>
                <Slider min={1} max={10} step={1} value={[storageDuration]}
                  onValueChange={(val) => setStorageDuration(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
                <p className="text-[11px] text-slate-500">
                  {MONTH_NAMES[startMonth]} → {MONTH_NAMES[endMonth]}（共 {storageDuration} 个月）
                </p>
              </div>
            </div>
          </TechPanel>
        </div>

        {/* 多指标价格曲线图 */}
        <div className="lg:col-span-8 space-y-4">
          <TechPanel className="p-6 flex flex-col relative rounded-[24px] h-[560px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold tracking-wide text-white">价格曲线 — 持有成本 VS 未来价格</h4>
                <p className="mt-1 text-[12px] text-slate-400">
                  生猪期货预测价线（紫色）自下而上穿越社会养殖成本线（橙色虚线）→ 形成有效套利窗口（绿色高亮区）。
                </p>
              </div>
            </div>

            {/* 图例 */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-medium">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block w-5 h-0.5 bg-cyan-400 rounded-full" />
                持有成本线（毛猪价+储存费×月数）
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block w-5 h-0.5 bg-violet-400 rounded-full" />
                生猪期货预测价
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block w-5 border-t-2 border-dashed border-orange-400" />
                社会养殖成本 ¥{socialCost.toFixed(1)}/kg
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/60" />
                利润空间 / 收储窗口
              </div>
              {savedPlans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="inline-block w-5 h-0.5 rounded-full"
                    style={{ background: plan.color, opacity: 0.5 }}
                  />
                  {plan.label}持有成本
                </div>
              ))}
            </div>

            <div className="w-full relative" style={{ height: 420 }}>
              {simulationLoading && !chartData.length ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  暂无数据（请先登录以载入模拟数据）
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
                    <YAxis
                      yAxisId="price"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => `¥${v}`}
                      width={52}
                    />
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

                    {/* 有效套利窗口高亮 */}
                    {windowStartLabel && windowEndLabel && (
                      <ReferenceArea
                        yAxisId="price"
                        x1={windowStartLabel}
                        x2={windowEndLabel}
                        fill="rgba(16,185,129,0.08)"
                        stroke="rgba(16,185,129,0.3)"
                        strokeDasharray="3 3"
                        label={{
                          value: "收储窗口",
                          position: "insideTop",
                          fill: "rgba(16,185,129,0.9)",
                          fontSize: 11,
                        }}
                      />
                    )}

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

                    {/* 社会养殖成本水平线 */}
                    <ReferenceLine
                      yAxisId="price"
                      y={socialCost}
                      stroke="#fb923c"
                      strokeDasharray="5 4"
                      strokeWidth={1.5}
                      label={{
                        value: `社会养殖成本 ¥${socialCost.toFixed(1)}`,
                        position: "insideTopRight",
                        fill: "#fb923c",
                        fontSize: 10,
                      }}
                    />

                    {/* 持有成本线（主方案） */}
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

                    {/* 生猪期货预测价 */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="futurePriceLine"
                      name="生猪期货预测价"
                      stroke="#a78bfa"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#0a1628", stroke: "#a78bfa", strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />

                    {/* 对比方案持有成本线 */}
                    {savedPlans.map((plan, idx) => (
                      <Line
                        key={plan.id}
                        yAxisId="price"
                        type="monotone"
                        dataKey={`plan${idx}Cost`}
                        name={`${plan.label} 持有成本`}
                        stroke={plan.color}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={{ r: 2 }}
                        strokeOpacity={0.65}
                      />
                    ))}
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
            <span className="ml-auto text-[11px] text-slate-500 font-normal">价差（元/kg）/ 总利润（万元）</span>
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
                <p className="font-mono text-[11px] text-slate-400">
                  成本 ¥{card.holdingCost.toFixed(2)}
                </p>
                <p className="font-mono text-[11px] text-violet-300 mb-1">
                  预期 ¥{card.futurePrice.toFixed(2)}
                </p>
                <p className={`font-mono text-base font-bold tracking-tight ${card.shouldArbitrage ? "text-emerald-400" : "text-slate-500"}`}>
                  {card.priceGap > 0 ? "+" : ""}{card.priceGap.toFixed(2)}
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
