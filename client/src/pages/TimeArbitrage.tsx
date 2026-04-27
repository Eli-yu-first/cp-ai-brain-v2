import { TechPanel, SectionHeader, NumberTicker } from "@/components/platform/PlatformPrimitives";
import { ArbitrageControlSlider } from "@/components/platform/ArbitrageControlSlider";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayersIcon,
  LineChart as LineChartIcon,
  PiggyBank,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Trash2,
  Zap,
  Sparkles,
  Package,
  AlertTriangle,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Bar,
  Brush,
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

type OptimizationConfig = {
  breedingHeadsPerDay: number;
  slaughterHeadsPerDay: number;
  cuttingHeadsPerDay: number;
  freezingTonsPerDay: number;
  storageTonsCapacity: number;
  deepProcessingTonsPerDay: number;
  salesTonsPerDay: number;
  breedingCostPerHead: number;
  slaughterCostPerHead: number;
  cuttingCostPerHead: number;
  freezingCostPerTon: number;
  storageCostPerTonMonth: number;
  deepProcessingCostPerTon: number;
  salesCostPerTon: number;
};

const DEFAULT_OPTIMIZATION: OptimizationConfig = {
  breedingHeadsPerDay: 40000,
  slaughterHeadsPerDay: 22000,
  cuttingHeadsPerDay: 9000,
  freezingTonsPerDay: 520,
  storageTonsCapacity: 2400,
  deepProcessingTonsPerDay: 210,
  salesTonsPerDay: 180,
  breedingCostPerHead: 0.18,
  slaughterCostPerHead: 0.42,
  cuttingCostPerHead: 0.33,
  freezingCostPerTon: 86,
  storageCostPerTonMonth: 42,
  deepProcessingCostPerTon: 120,
  salesCostPerTon: 35,
};

const PLAN_COLORS = ["#06b6d4", "#a78bfa", "#f59e0b"];

const RISK_TONES = {
  emerald: {
    panel: "border-emerald-500/20 bg-emerald-500/[0.05]",
    iconWrap: "bg-emerald-500/15",
    icon: "text-emerald-300",
    badge: "bg-emerald-500/15 text-emerald-300",
    bar: "bg-emerald-400",
    value: "text-emerald-300",
  },
  rose: {
    panel: "border-rose-500/20 bg-rose-500/[0.05]",
    iconWrap: "bg-rose-500/15",
    icon: "text-rose-300",
    badge: "bg-rose-500/15 text-rose-300",
    bar: "bg-rose-400",
    value: "text-rose-300",
  },
  amber: {
    panel: "border-amber-500/20 bg-amber-500/[0.05]",
    iconWrap: "bg-amber-500/15",
    icon: "text-amber-300",
    badge: "bg-amber-500/15 text-amber-300",
    bar: "bg-amber-400",
    value: "text-amber-300",
  },
} as const;

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
  const [optimization, setOptimization] = useState<OptimizationConfig>(DEFAULT_OPTIMIZATION);
  const [activeDuration, setActiveDuration] = useState(3);
  const [strategyName, setStrategyName] = useState("2025-07 时间套利策略方案");
  const [strategyNote, setStrategyNote] = useState("");
  const [approvalRoute, setApprovalRoute] = useState("运营总监审批 → 执行排程");
  const [approvalStatus, setApprovalStatus] = useState<"草稿" | "已保存" | "待审批" | "已生成任务">("草稿");

  const endMonth = ((startMonth - 1 + storageDuration - 1) % 12) + 1;

  const { data: simulation, isLoading: simulationLoading } = trpc.platform.arbitrageSimulate.useQuery(
    {
      spotPrice,
      holdingCostPerMonth: holdingCost,
      socialBreakevenCost: socialCost,
      storageTons,
      startMonth,
      storageDurationMonths: storageDuration,
      optimization,
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
        optimization,
      });
    }, 600);
    return () => clearTimeout(handler);
  }, [spotPrice, holdingCost, socialCost, storageTons, startMonth, storageDuration, optimization, fetchDecision]);

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

  // 主图表数据（包含历史 3 个月 + 收储期）
  const chartData = useMemo(() => {
    if (!simulation) return [];
    const rows: any[] = [];

    // 历史月份
    simulation.historyMonths.forEach((month, index) => {
      rows.push({
        month: MONTH_NAMES[month] ?? `${month}月`,
        costLine: simulation.historyCostCurve[index],
        futurePriceLine: simulation.historyFuturePriceCurve[index],
        socialCostLine: simulation.historySocialCostLine[index],
        profitSpace: simulation.historyProfitSpace[index], // null → 不画柱子
        isHistory: true,
      });
    });

    // 收储期月份
    simulation.months.forEach((month, index) => {
      const row: any = {
        month: MONTH_NAMES[month] ?? `${month}月`,
        costLine: simulation.costCurve[index],
        futurePriceLine: simulation.futurePriceCurve[index],
        socialCostLine: simulation.socialCostLine[index],
        profitSpace: simulation.profitSpace[index],
        isHistory: false,
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
      rows.push(row);
    });

    return rows;
  }, [simulation, savedPlans, planQueries]);

  const stats = useMemo(() => {
    const profits = simulation?.profits ?? [];
    if (!simulation || profits.length === 0) return null;
    const arbitrageMonths = profits.filter(p => p.shouldArbitrage);
    return {
      arbitrageCount: arbitrageMonths.length,
      maxProfitMonth: simulation.maxProfitMonth,
      maxProfit: simulation.maxProfit,
      maxTotalProfit: simulation.maxTotalProfit,
      capitalRequired: parseFloat((spotPrice * storageTons * 1000 / 10000).toFixed(0)),
    };
  }, [simulation, spotPrice, storageTons]);

  const warRoom = useMemo(() => {
    if (!simulation) return null;
    const durations = [1, 2, 3, 4].map(duration => {
      const idx = Math.min(duration, simulation.futurePriceCurve.length - 1);
      const predictedPrice = simulation.futurePriceCurve[idx] ?? spotPrice;
      const holdingCostPerTon = Math.round(holdingCost * duration * 1000);
      const breakevenPerTon = Math.round((spotPrice + holdingCost * duration) * 1000);
      const expectedProfitPerTon = Math.round((predictedPrice - spotPrice - holdingCost * duration) * 1000);
      const profitRate = Number(((expectedProfitPerTon / Math.max(breakevenPerTon, 1)) * 100).toFixed(1));
      const winRate = Math.max(42, Math.min(92, Math.round(54 + duration * 6 + Math.max(expectedProfitPerTon, 0) / 80)));
      const irr = Number((profitRate * (12 / Math.max(duration, 1))).toFixed(1));
      const score = Math.max(0, Math.min(100, Math.round(winRate * 0.55 + Math.max(0, profitRate) * 2.4 + (duration === 3 ? 8 : 0))));
      return {
        duration,
        month: MONTH_NAMES[((startMonth - 1 + duration) % 12) + 1] ?? `${duration}月`,
        predictedPrice: Math.round(predictedPrice * 1000),
        holdingCostPerTon,
        breakevenPerTon,
        expectedProfitPerTon,
        profitRate,
        winRate,
        irr,
        score,
      };
    });
    const best = [...durations].sort((a, b) => b.score - a.score)[0] ?? durations[0]!;
    const batches = [
      { id: "BATCH-250601-01", category: "品牌全装猪", inDate: "2025-06-01", age: 30, tons: 4280, cost: 3720, grade: "A", status: "良好", action: "建议收储（3个月）" },
      { id: "BATCH-250528-02", category: "品牌鲜装重", inDate: "2025-05-28", age: 34, tons: 3880, cost: 3650, grade: "A-", status: "良好", action: "分批释放（2个月）" },
      { id: "BATCH-250515-03", category: "冻薄", inDate: "2025-05-15", age: 47, tons: 2150, cost: 3980, grade: "B+", status: "良好", action: "建议出售（1个月）" },
      { id: "BATCH-250425-04", category: "散重", inDate: "2025-04-25", age: 67, tons: 6120, cost: 3410, grade: "B", status: "良好", action: "建议出售（立即）" },
      { id: "BATCH-250418-05", category: "深加工品", inDate: "2025-04-18", age: 74, tons: 3760, cost: 3320, grade: "A-", status: "良好", action: "分批释放（2个月）" },
    ];
    const totalTons = batches.reduce((sum, batch) => sum + batch.tons, 0);
    const weightedCost = Math.round(batches.reduce((sum, batch) => sum + batch.tons * batch.cost, 0) / Math.max(totalTons, 1));
    return {
      durations,
      best,
      batches,
      totalTons,
      weightedCost,
      currentCostPerTon: Math.round(spotPrice * 1000),
      futurePeakPerTon: Math.round(Math.max(...simulation.futurePriceCurve) * 1000),
      riskAdjustedReturnTon: Math.max(0, best.expectedProfitPerTon - Math.round((simulation.analytics?.stressLoss ?? 0) / Math.max(storageTons, 1))),
      fundUsed: Math.round((spotPrice * storageTons * 1000) / 10000),
    };
  }, [holdingCost, simulation, spotPrice, startMonth, storageTons]);

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

  const handleApprovalAction = (next: "已保存" | "待审批" | "已生成任务") => {
    setApprovalStatus(next);
    if (next === "已保存") {
      handleSavePlan();
      toast.success("策略已保存到方案管理");
    } else if (next === "待审批") {
      handlePersist();
      toast.success("已提交审批流");
    } else {
      toast.success("已生成执行任务：仓储、资金、销售同步接收");
    }
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
              value: stats.arbitrageCount,
              suffix: " 个月",
              sub: arbitrageWindow ? `${windowStartLabel} → ${windowEndLabel}` : "无有效窗口",
              color: "text-cyan-400",
              icon: <CalendarDays className="h-4 w-4 text-cyan-400" />,
              pulse: stats.arbitrageCount > 0,
            },
            {
              label: "最佳出货月",
              value: stats.maxProfitMonth,
              suffix: " 月",
              sub: `价差 +${stats.maxProfit.toFixed(2)} 元/kg`,
              color: "text-emerald-400",
              icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
              pulse: false,
            },
            {
              label: "最大总利润",
              value: stats.maxTotalProfit,
              suffix: " 万元",
              prefix: stats.maxTotalProfit > 0 ? "+" : "",
              sub: `按 ${storageTons} 吨计算`,
              color: stats.maxTotalProfit > 0 ? "text-emerald-400" : "text-rose-400",
              icon: <LineChartIcon className="h-4 w-4 text-emerald-400" />,
              pulse: stats.maxTotalProfit > 0,
            },
            {
              label: "预估资金占用",
              value: stats.capitalRequired,
              suffix: " 万元",
              sub: `现货价 ¥${spotPrice.toFixed(2)}/kg`,
              color: "text-amber-400",
              icon: <Package className="h-4 w-4 text-amber-400" />,
              pulse: false,
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <TechPanel className="p-4 rounded-[16px] relative overflow-hidden">
                {item.pulse && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 16px rgba(16,185,129,0.06)", "0 0 0px rgba(16,185,129,0)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <motion.div
                    animate={item.pulse ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {item.icon}
                  </motion.div>
                </div>
                <p className={`font-mono text-xl font-bold ${item.color}`}>
                  {item.prefix ?? ""}<NumberTicker value={item.value} decimals={0} />{item.suffix}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{item.sub}</p>
              </TechPanel>
            </motion.div>
          ))}
        </div>
      )}

      {warRoom && (
        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <TechPanel className="rounded-[24px] p-5 xl:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-400/80">Operational War Room</p>
                <h3 className="mt-1 text-xl font-bold text-white">时间套利作战中心</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["全部品类", "全部批次", `${startMonth}月起`, "1-4个月"].map(item => (
                  <span key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                { label: "当前成本（吨）", value: warRoom.currentCostPerTon, suffix: "元", icon: PiggyBank, tone: "text-blue-300" },
                { label: "未来售价预测（吨）", value: warRoom.futurePeakPerTon, suffix: "元", icon: TrendingUp, tone: "text-emerald-300" },
                { label: "持有成本（吨/月）", value: Math.round(holdingCost * 1000), suffix: "元", icon: TimerReset, tone: "text-violet-300" },
                { label: "风险调整收益（吨）", value: warRoom.riskAdjustedReturnTon, suffix: "元", icon: ShieldAlert, tone: "text-amber-300" },
                { label: "最佳出货月", value: `${warRoom.best.month}`, suffix: "", icon: CalendarDays, tone: "text-emerald-300" },
                { label: "年化收益（预期）", value: warRoom.best.irr, suffix: "%", icon: LineChartIcon, tone: "text-indigo-300" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-white/10 bg-[#071b31]/80 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${item.tone}`} />
                      <span className="text-[10px] text-slate-500">i</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <p className={`mt-1 font-mono text-2xl font-black ${item.tone}`}>
                      {typeof item.value === "number" ? <NumberTicker value={item.value} decimals={item.suffix === "%" ? 1 : 0} /> : item.value}
                      <span className="ml-1 text-xs text-slate-500">{item.suffix}</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">持有时长方案对比</h4>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                    最优：{warRoom.best.duration}个月
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-center text-xs">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="px-2 py-2 text-left">持有方案</th>
                        {warRoom.durations.map(item => (
                          <th key={item.duration} className={cn("px-2 py-2", activeDuration === item.duration && "text-cyan-300")}>
                            {item.duration}个月<br />({item.month})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["预测售价（元/吨）", "predictedPrice"],
                        ["持有成本（元/吨）", "holdingCostPerTon"],
                        ["盈亏平衡线（元/吨）", "breakevenPerTon"],
                        ["预期利润（元/吨）", "expectedProfitPerTon"],
                        ["利润率（相对成本）", "profitRate"],
                        ["胜率（概率）", "winRate"],
                        ["年化收益（IRR）", "irr"],
                        ["综合评分（满分100）", "score"],
                      ].map(([label, key]) => (
                        <tr key={label} className="border-t border-white/8">
                          <td className="px-2 py-2 text-left text-slate-400">{label}</td>
                          {warRoom.durations.map(item => {
                            const value = item[key as keyof typeof item] as number;
                            const isBest = item.duration === warRoom.best.duration;
                            return (
                              <td
                                key={`${label}-${item.duration}`}
                                className={cn(
                                  "cursor-pointer px-2 py-2 font-mono",
                                  isBest ? "bg-cyan-500/10 text-emerald-300" : "text-slate-300",
                                  activeDuration === item.duration && "outline outline-1 outline-cyan-400/30"
                                )}
                                onClick={() => setActiveDuration(item.duration)}
                              >
                                {key === "profitRate" || key === "irr" || key === "winRate"
                                  ? `${Number(value).toFixed(1)}%`
                                  : Number(value).toLocaleString()}
                                {isBest && key === "score" ? <span className="ml-1 rounded bg-amber-500/20 px-1 text-[10px] text-amber-300">最优</span> : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  AI 策略建议
                </h4>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-5 text-center">
                  <p className="text-[12px] text-emerald-200">最优策略</p>
                  <p className="mt-1 text-3xl font-black tracking-wide text-emerald-300">建议收储（{warRoom.best.duration}个月）</p>
                  <p className="mt-2 text-sm text-slate-300">置信度 {warRoom.best.score}% · 综合评分 {warRoom.best.score}/100</p>
                </div>
                <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-slate-300">
                  <li><CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" />预计 {warRoom.best.month} 售价达到 {warRoom.best.predictedPrice.toLocaleString()} 元/吨。</li>
                  <li><CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" />收储 {warRoom.best.duration} 个月预期利润 {warRoom.best.expectedProfitPerTon.toLocaleString()} 元/吨。</li>
                  <li><CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" />仓储与资金占用仍在风险预算之内。</li>
                  <li><CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" />库存质量良好，储存风险可控。</li>
                </ul>
              </div>
            </div>
          </TechPanel>

          <div className="space-y-4 xl:col-span-5">
            <TechPanel className="rounded-[24px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">风险评估</h3>
                <span className="text-[11px] text-slate-500">更新时间：10:30</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "价格波动风险", value: 28.7, sub: "未来30天波动率", icon: TrendingDown, level: "中等", tone: "orange" },
                  { label: "亏损风险", value: 27.3, sub: "跌破盈亏平衡概率", icon: AlertTriangle, level: "中等", tone: "red" },
                  { label: "资金占用风险", value: Math.min(99, warRoom.fundUsed / 1000), sub: `占用资金 ${warRoom.fundUsed.toLocaleString()} 万元`, icon: WalletCards, level: "中等", tone: "orange" },
                  { label: "仓储与产能约束", value: simulation?.optimizationPlan.summary.averageUtilization ?? 68.2, sub: "库容利用率", icon: Warehouse, level: "低", tone: "green" },
                ].map(item => {
                  const Icon = item.icon;
                  const tone = item.tone === "green" ? RISK_TONES.emerald : item.tone === "red" ? RISK_TONES.rose : RISK_TONES.amber;
                  return (
                    <div key={item.label} className={cn("rounded-2xl border p-3", tone.panel)}>
                      <div className="flex items-center gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-full", tone.iconWrap)}>
                          <Icon className={cn("h-5 w-5", tone.icon)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-200">{item.label}</p>
                            <span className={cn("rounded px-2 py-0.5 text-xs", tone.badge)}>{item.level}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(item.value, 100)}%` }} className={cn("h-full", tone.bar)} />
                            </div>
                            <span className={cn("font-mono text-lg font-black", tone.value)}>{item.value.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TechPanel>

            <TechPanel className="rounded-[24px] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <ClipboardCheck className="h-4 w-4 text-cyan-300" />
                策略审批与执行
                <span className="ml-auto rounded-full bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">{approvalStatus}</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">策略名称</label>
                  <input value={strategyName} onChange={e => setStrategyName(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">策略备注</label>
                  <textarea value={strategyNote} onChange={e => setStrategyNote(e.target.value)} maxLength={200} placeholder="请输入策略备注（非必填）" className="h-20 w-full resize-none rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50" />
                  <p className="mt-1 text-right text-[10px] text-slate-600">{strategyNote.length}/200</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">审批流程</label>
                  <select value={approvalRoute} onChange={e => setApprovalRoute(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-200 outline-none">
                    <option>运营总监审批 → 执行排程</option>
                    <option>财务负责人审批 → 总经理审批</option>
                    <option>风控复核 → 仓储执行</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button onClick={() => handleApprovalAction("已保存")} variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20">
                    <Save className="mr-2 h-4 w-4" />保存策略
                  </Button>
                  <Button onClick={() => handleApprovalAction("已生成任务")} className="bg-blue-600 text-white hover:bg-blue-500">
                    <FileText className="mr-2 h-4 w-4" />生成执行任务
                  </Button>
                  <Button onClick={() => handleApprovalAction("待审批")} className="col-span-2 bg-amber-500 text-slate-950 hover:bg-amber-400">
                    <ClipboardCheck className="mr-2 h-4 w-4" />提交审批
                  </Button>
                </div>
              </div>
            </TechPanel>
          </div>

          <TechPanel className="rounded-[24px] p-5 xl:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">库存批次明细</h3>
              <span className="text-xs text-slate-500">批次数：{warRoom.batches.length} · 总数量：{warRoom.totalTons.toLocaleString()} 吨 · 加权平均成本：{warRoom.weightedCost.toLocaleString()} 元/吨</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-center text-xs">
                <thead className="bg-slate-900/60 text-slate-500">
                  <tr>
                    {["批次号", "品类", "入库日期", "库龄(天)", "数量(吨)", "仓库", "加权成本", "质量等级", "当前状态", "建议动作"].map(head => (
                      <th key={head} className="border border-white/8 px-3 py-2">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warRoom.batches.map((batch, index) => (
                    <tr key={batch.id} className="border-t border-white/8 text-slate-300">
                      <td className="px-3 py-2 font-mono">{batch.id}</td>
                      <td className="px-3 py-2">{batch.category}</td>
                      <td className="px-3 py-2">{batch.inDate}</td>
                      <td className="px-3 py-2">{batch.age}</td>
                      <td className="px-3 py-2 font-mono">{batch.tons.toLocaleString()}</td>
                      <td className="px-3 py-2">{["成都仓", "重庆仓", "西安仓", "郑州仓", "南京仓"][index]}</td>
                      <td className="px-3 py-2 font-mono">{batch.cost.toLocaleString()}</td>
                      <td className="px-3 py-2">{batch.grade}</td>
                      <td className="px-3 py-2 text-emerald-300">{batch.status}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            setActiveDuration(batch.action.includes("3") ? 3 : batch.action.includes("2") ? 2 : 1);
                            toast.success(`已聚焦 ${batch.id} 的${batch.action}`);
                          }}
                          className={cn(
                            "rounded-md border px-2 py-1",
                            batch.action.includes("收储")
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          )}
                        >
                          {batch.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TechPanel>

          <TechPanel className="rounded-[24px] p-5 xl:col-span-4">
            <h3 className="mb-4 text-sm font-semibold text-white">审批流程（需审批）</h3>
            <div className="flex items-center justify-between gap-2">
              {[
                ["提交申请", approvalStatus === "待审批" || approvalStatus === "已生成任务" ? "已提交" : "待提交"],
                ["部门负责人", approvalStatus === "已生成任务" ? "已处理" : "未处理"],
                ["财务负责人", approvalStatus === "已生成任务" ? "已处理" : "未处理"],
                ["总经理", approvalStatus === "已生成任务" ? "已处理" : "未处理"],
              ].map(([label, status], index) => (
                <div key={label} className="flex flex-1 items-center">
                  <div className="min-w-0 text-center">
                    <div className={cn("mx-auto grid h-9 w-9 place-items-center rounded-full border", status === "已处理" || status === "已提交" ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200" : "border-slate-600 bg-slate-900 text-slate-500")}>
                      {index + 1}
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-300">{label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{status}</p>
                  </div>
                  {index < 3 ? <div className="mx-2 h-px flex-1 bg-cyan-400/30" /> : null}
                </div>
              ))}
            </div>
          </TechPanel>
        </div>
      )}

      {/* 已保存方案标签栏 */}
      {savedPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <span className="text-[11px] text-slate-500 uppercase tracking-wider mr-2">
            <LayersIcon className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            多方案对比
          </span>
          <AnimatePresence>
            {savedPlans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -1, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-default"
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
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemovePlan(plan.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 参数控制面板 */}
        <div className="lg:col-span-4 space-y-4">
            <TechPanel className="relative overflow-hidden p-6 rounded-[24px]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600 rounded-l-[24px]" />
              <motion.div
                className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600 rounded-l-[24px]"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <h4 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase opacity-90">
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                </motion.div>
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

              <div className="mt-8 pt-6 border-t border-white/10">
                <h5 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-400" /> 七环节产能优化参数
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  <ArbitrageControlSlider label="养殖能力" value={optimization.breedingHeadsPerDay} suffix="头/天" min={10000} max={120000} step={1000} onChange={value => setOptimization(prev => ({ ...prev, breedingHeadsPerDay: value }))} />
                  <ArbitrageControlSlider label="屠宰能力" value={optimization.slaughterHeadsPerDay} suffix="头/天" min={5000} max={80000} step={1000} onChange={value => setOptimization(prev => ({ ...prev, slaughterHeadsPerDay: value }))} />
                  <ArbitrageControlSlider label="分割能力" value={optimization.cuttingHeadsPerDay} suffix="头/天" min={3000} max={60000} step={1000} onChange={value => setOptimization(prev => ({ ...prev, cuttingHeadsPerDay: value }))} />
                  <ArbitrageControlSlider label="速冻能力" value={optimization.freezingTonsPerDay} suffix="吨/天" min={50} max={3000} step={10} onChange={value => setOptimization(prev => ({ ...prev, freezingTonsPerDay: value }))} />
                  <ArbitrageControlSlider label="冷藏容量" value={optimization.storageTonsCapacity} suffix="吨" min={500} max={50000} step={100} onChange={value => setOptimization(prev => ({ ...prev, storageTonsCapacity: value }))} />
                  <ArbitrageControlSlider label="深加工能力" value={optimization.deepProcessingTonsPerDay} suffix="吨/天" min={0} max={2000} step={10} onChange={value => setOptimization(prev => ({ ...prev, deepProcessingTonsPerDay: value }))} />
                  <ArbitrageControlSlider label="销售能力" value={optimization.salesTonsPerDay} suffix="吨/天" min={50} max={3000} step={10} onChange={value => setOptimization(prev => ({ ...prev, salesTonsPerDay: value }))} />
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
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
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
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

                    <Brush
                      dataKey="month"
                      height={28}
                      stroke="#475569"
                      fill="#0f172a"
                      className="recharts-brush-custom"
                      travellerWidth={8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 1. AI 最优存储期公式解析 */}
            {stats && simulation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-[16px] border border-cyan-500/20 bg-cyan-950/40 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-cyan-500/20 p-1.5 flex flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <h5 className="text-[14px] font-semibold text-cyan-300">AI 分析建议：最优存期公式测算</h5>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">
                      <strong className="text-slate-200">核心决策公式：</strong> <code className="bg-slate-900/60 px-1 py-0.5 rounded font-mono">预期当月出货利润 = (预期生猪期货价 - (当前现货价 ¥{spotPrice.toFixed(2)} + 储存费 ¥{holdingCost.toFixed(2)} × 持有月数)) × 规模吨数</code>。
                      <br/>
                      {stats.arbitrageCount > 0 ? (
                        <span className="mt-2 inline-block space-y-2">
                          <p>测算表明，本批次从 <strong className="text-white">{startMonth}月</strong> 启动收储最合理。在此存期路径下，于 <strong className="text-white">{stats.maxProfitMonth}月</strong> 出货将达到利润波峰，此时每公斤价差 
                          <span className="text-emerald-400 font-mono font-bold mx-1.5">+{stats.maxProfit.toFixed(2)} 元</span>。最优释放持有期时长为 <strong className="text-white">{(stats.maxProfitMonth - startMonth + 12) % 12 || 12} 个月</strong>。</p>
                          
                          <p className="border-l-2 border-violet-500/50 pl-3 py-0.5 text-violet-200 bg-violet-500/10 rounded-r-md">
                            <strong>排产与发货约束推演：</strong> 考虑到系统下达的七环节产能硬约束，向前提拉生产并向后推平释放后，在最佳盈利窗口实际能有效达成的可出货量为 <strong className="font-mono text-cyan-300">{simulation.optimizationPlan.summary.recommendedStorageTons.toLocaleString()} 吨</strong> 
                            （规划收储需求 {storageTons.toLocaleString()} 吨）。超出的部分将作为溢出受限无法达成最优释放。
                          </p>
                        </span>
                      ) : (
                        <span className="text-rose-400 mt-2 inline-block">基于当前输入的持有成本与预期自然回升斜率测算，未来 10 个月内所有周期的增值均无法覆盖高昂的仓储及资金占用成本。模型判定公式无正向利润区间解，<strong className="tracking-wide">不推荐强行建立库存</strong>。</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </TechPanel>
        </div>
      </div>

      {/* 2. 智能最优化调度墙 (根据最优出货月反推各环节) */}
      {simulation?.optimizationPlan && (
        <div className="mb-8 max-w-[100vw] overflow-hidden">
          <SectionHeader
            eyebrow="Capacity Allocation & AI Dispatch"
            title="七环节产能智能最优化调度"
            description="基于求得的最优套利出货窗口，反向运用拉动式算法，最优化分配全产线协同资源的调度，寻找产能最拥堵节点并下发人工智能调度决策指令。"
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-2">
            {/* 左侧：产能最优化分配仪表盘 */}
            <TechPanel className="p-6 rounded-[24px]">
              <h5 className="mb-5 text-[14px] font-semibold text-slate-200 flex items-center gap-2">
                <LayersIcon className="h-4 w-4 text-cyan-400" />
                最优释储月 ({stats?.maxProfitMonth}月) 环节满载率评测
                <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                  计算目标: 出货 {simulation.optimizationPlan.summary.recommendedStorageTons} 吨
                </span>
              </h5>
              <div className="space-y-4">
                {simulation.optimizationPlan.stages.map((stage) => {
                  const key = stage.stage === "deepProcessing" ? "deepProcessing" : stage.stage;
                  const maxUtil = Math.max(...simulation.optimizationPlan.monthlyAllocations.map(a => a.utilization[key] ?? 0));
                  const isBottleneck = maxUtil > 90;
                  const labelMap: Record<string, string> = { breeding: "养殖负荷", slaughter: "屠宰负荷", cutting: "分割负荷", freezing: "速冻负荷", storage: "库容占用", deepProcessing: "加工量配置", sales: "销售运力" };
                  return (
                    <div key={stage.stage} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-slate-300 font-medium">{labelMap[stage.stage]}</span>
                        <span className={`font-mono tracking-wider ${isBottleneck ? "text-rose-400 font-bold" : "text-emerald-400"}`}>{maxUtil.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          className={`h-full ${isBottleneck ? "bg-rose-500" : "bg-emerald-500"}`} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min(maxUtil, 100)}%` }} 
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-slate-400">
                  <span>总执行成本预估: <strong className="text-amber-400 font-mono">¥{simulation.optimizationPlan.summary.totalOperatingCost.toLocaleString()}</strong></span>
                  <span>协同服务履约率: <strong className="text-cyan-400 font-mono">{simulation.optimizationPlan.summary.serviceLevel.toFixed(1)}%</strong></span>
                </div>
              </div>
            </TechPanel>

            {/* 右侧：部门AI自动化任务分配 */}
            <TechPanel className="p-6 rounded-[24px] bg-gradient-to-br from-violet-900/10 to-transparent flex flex-col h-[400px]">
              <h5 className="mb-4 text-[14px] font-semibold text-slate-200 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-violet-400" />
                各部门联动指派 (AI 驱动自动派发)
              </h5>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                
                {simulation.optimizationPlan.summary.constrainedBy.length > 0 ? (
                  simulation.optimizationPlan.summary.constrainedBy.map((bottleneckStage, idx) => {
                    const RoleMap: Record<string, string> = { slaughter: "屠宰厂长", freezing: "冷库运营经理", storage: "仓储管理员", cutting: "分割车间班长", breeding: "养殖场长", deepProcessing: "深加工主管", sales: "销售总监" };
                    return (
                       <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.15 }} className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-rose-500 hover:bg-rose-600 text-[10px] px-1.5 py-0">分发至: {RoleMap[bottleneckStage] || "调度中心"}</Badge>
                          <span className="text-[13px] text-rose-300 font-semibold tracking-wide">产能过载黄色预警单</span>
                        </div>
                        <p className="text-[12px] text-slate-300 leading-relaxed">
                          侦测到在核心套利释放期间，由您负责的 <strong>{RoleMap[bottleneckStage]}</strong> 管辖范围负荷率将突破 90% 红线边界。请立即提前规划临时三班倒加班计划，或上报总部申请调拨外部兄弟大区外协产能，防范生产停滞带来的利润锁死风险。
                        </p>
                      </motion.div>
                    )
                  })
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] px-1.5 py-0">分发至: 事业部全员</Badge>
                      <span className="text-[13px] text-emerald-300 font-semibold tracking-wide">排产放飞指令</span>
                    </div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">
                      智能算法判定：当前参数下的最优化收储与出库资源排布处于健康带宽之内。生产全链路未触及短板瓶颈，请各部门严格按照 AI 生产排期计划表稳定推进流转即可，无需额外排位干预。
                    </p>
                  </motion.div>
                )}

                {/* 固定的销售确认单据 */}
                {stats && stats.maxProfit > 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-indigo-500 hover:bg-indigo-600 text-[10px] px-1.5 py-0">分发至: 销售总监</Badge>
                      <span className="text-[13px] text-indigo-300 font-semibold tracking-wide">利润对冲锁定指令</span>
                    </div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">
                      最优策略要求全盘倾泻出货重心落在 <strong>{stats.maxProfitMonth} 月份</strong>。系统计算出需消化战略级仓储库存总量 <strong className="text-white">{simulation.optimizationPlan.summary.recommendedStorageTons}</strong> 吨。为了兑现 {stats.maxTotalProfit} 万总利润预期，请即刻根据预期差向 B 端核心终端释放对冲锁定合同。
                    </p>
                  </motion.div>
                )}

              </div>
            </TechPanel>
          </div>
        </div>
      )}

      {/* AI 决策推理（格式化四宫格展示） */}
      <div className="mb-8">
        <TechPanel className="p-6 rounded-[24px] relative overflow-hidden">
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.03), transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(139,92,246,0.03), transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.03), transparent 50%)",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <h4 className="text-sm font-semibold tracking-wide text-white mb-5 flex items-center gap-2 relative">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrainCircuit className="h-4 w-4 text-violet-400" />
            </motion.div>
            {t("timeArbitrage.aiReasoning")}
          </h4>

          <div className="relative">
            {isPredicting ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.p
                  className="text-xs text-slate-400"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Running quantitative arbitrage model...
                </motion.p>
              </div>
            ) : aiDecision ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-[16px] border border-cyan-500/20 bg-cyan-500/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20">
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-[13px] font-semibold text-cyan-300">{t("timeArbitrage.marketAnalysis")}</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-slate-300">{aiDecision.marketAnalysis}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-[16px] border border-amber-500/20 bg-amber-500/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
                      <Target className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-[13px] font-semibold text-amber-300">{t("timeArbitrage.costRecommendation")}</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-slate-300">{aiDecision.costRecommendation}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                      <BrainCircuit className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-[13px] font-semibold text-emerald-300">{t("timeArbitrage.decision")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiDecision.decision && aiDecision.decision.length > 0 ? (
                      aiDecision.decision.map((d: string, di: number) => (
                        <motion.span
                          key={d}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + di * 0.06, duration: 0.3 }}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium"
                        >
                          {d}
                        </motion.span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full text-xs font-medium">
                        无套利空间 (观望)
                      </span>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-[16px] border border-rose-500/20 bg-rose-500/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20">
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                    </div>
                    <span className="text-[13px] font-semibold text-rose-300">{t("timeArbitrage.riskWarning")}</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-rose-200/80">{aiDecision.riskWarning}</p>
                </motion.div>
              </motion.div>
            ) : null}
          </div>
        </TechPanel>
      </div>
    </PlatformShell>
  );
}

function ControlSlider({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const display = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[12px] text-slate-400 font-medium">{label}</label>
        <span className="font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded text-[11px]">
          {display} {suffix}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={v => onChange(v[0] ?? value)} />
    </div>
  );
}
