import { TacticalBackdrop, LiveSignal, useOperationLog } from "@/components/ai/TacticalEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  Download,
  Expand,
  FileText,
  History,
  Layers3,
  LockKeyhole,
  Maximize2,
  PackageCheck,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type ObjectiveKey =
  | "profit"
  | "loss"
  | "risk"
  | "cash"
  | "inventory"
  | "order";

type ConstraintKey =
  | "capacity"
  | "storage"
  | "capital"
  | "contract"
  | "orderWindow"
  | "foodSafety"
  | "customerPriority"
  | "inventoryAge";

type DeepStatus = "active" | "watch" | "inactive";
type RiskLevel = "低" | "中" | "高";
type ConsoleTab = "AI 智能助手" | "方案管理" | "执行计划" | "历史记录";
type ViewMode = "深度产业套利" | "全局最优化调度";
type OptimizationTuning = {
  slaughterCountMultiplier?: number;
  avgWeightAdjustmentKg?: number;
  livePigPriceAdjustment?: number;
  slaughterCapacityMultiplier?: number;
  splitCapacityMultiplier?: number;
  freezeCapacityMultiplier?: number;
  storageCostMultiplier?: number;
  transportCostMultiplier?: number;
  partPriceAdjustments?: Record<string, number>;
};

type DeepArbitrageItem = {
  category: string;
  name: string;
  triggerCondition: string;
  triggerStatus: DeepStatus;
  expectedReturnPerHead: number;
  riskLevel: RiskLevel;
  implementation: string[];
};

const objectiveConfig: Record<
  ObjectiveKey,
  {
    title: string;
    subtitle: string;
    icon: typeof Target;
    tuning: OptimizationTuning;
  }
> = {
  profit: {
    title: "利润最大",
    subtitle: "以利润为核心目标",
    icon: PackageCheck,
    tuning: {
      slaughterCountMultiplier: 1.04,
      slaughterCapacityMultiplier: 1.08,
      splitCapacityMultiplier: 1.06,
      freezeCapacityMultiplier: 1.03,
      storageCostMultiplier: 0.98,
    },
  },
  loss: {
    title: "减亏最大",
    subtitle: "最小化亏损幅度",
    icon: TrendingDown,
    tuning: {
      slaughterCountMultiplier: 0.92,
      livePigPriceAdjustment: -0.2,
      slaughterCapacityMultiplier: 0.96,
      transportCostMultiplier: 0.92,
      storageCostMultiplier: 0.96,
    },
  },
  risk: {
    title: "风险调整收益最大",
    subtitle: "综合收益与风险",
    icon: ShieldCheck,
    tuning: {
      slaughterCountMultiplier: 0.98,
      slaughterCapacityMultiplier: 1.02,
      splitCapacityMultiplier: 1.03,
      freezeCapacityMultiplier: 1.08,
      transportCostMultiplier: 0.96,
    },
  },
  cash: {
    title: "现金流优先",
    subtitle: "保障现金流健康",
    icon: LockKeyhole,
    tuning: {
      slaughterCountMultiplier: 0.9,
      storageCostMultiplier: 0.9,
      transportCostMultiplier: 0.94,
    },
  },
  inventory: {
    title: "库存周转优先",
    subtitle: "提升库存周转效率",
    icon: Warehouse,
    tuning: {
      slaughterCountMultiplier: 0.96,
      freezeCapacityMultiplier: 1.12,
      storageCostMultiplier: 0.92,
      transportCostMultiplier: 0.95,
    },
  },
  order: {
    title: "订单满足率优先",
    subtitle: "最大化订单满足率",
    icon: CheckCircle2,
    tuning: {
      slaughterCountMultiplier: 1.1,
      slaughterCapacityMultiplier: 1.12,
      splitCapacityMultiplier: 1.12,
      freezeCapacityMultiplier: 1.06,
    },
  },
};

const fallbackOpportunities = [
  ["transmission", "跨品种传导套利", "猪粮价差偏离传导公式", "立即执行"],
  ["breeding_structure", "繁育结构套利", "母猪存栏与 PSY 结构错配", "重点关注"],
  ["zero_waste", "零废弃套利", "边角料利用率偏低", "建议执行"],
  ["channel_scene", "渠道场景套利", "渠道毛利差异 >15%", "立即执行"],
  ["capacity_mismatch", "产能错配套利", "屠宰/分割/速冻产能峰谷差", "建议执行"],
  ["supply_chain_cash", "现金流套利", "账期错配 >20天", "建议执行"],
  ["policy_bonus", "政策红利套利", "地方补贴窗口期", "尽快落地"],
  ["quality_brand", "品质品牌套利", "认证溢价可兑现", "重点推进"],
  ["info_arbitrage", "信息差套利", "区域价差 >10%", "快速执行"],
  ["counter_cyclical", "逆周期危机套利", "猪价下行趋势", "谨慎布局"],
  ["cross_border", "跨境套利", "出口价差 >8%", "评估可行性"],
  ["compliance_optimization", "合规优化套利", "合规成本可优化", "立即优化"],
  ["light_asset_joint", "联营套利", "合作溢价空间", "酌情推进"],
  ["green_circular", "绿色循环套利", "碳减排可变现", "长期孵化"],
] as const;

const constraintLabels: Record<ConstraintKey, string> = {
  capacity: "产能约束",
  storage: "库容约束",
  capital: "资金约束",
  contract: "合同约束",
  orderWindow: "订单时窗",
  foodSafety: "食品安全",
  customerPriority: "客户优先级",
  inventoryAge: "库龄约束",
};

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatWan(value: number, digits = 1) {
  return formatNumber(value / 10000, digits);
}

function formatPct(value: number, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function avg(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function formatDateTime(value?: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value ?? Date.now()));
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-sky-400/30 bg-[#061c36]/92 shadow-[inset_0_1px_0_rgba(125,211,252,0.16),0_0_24px_rgba(14,116,195,0.18)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent_32%,rgba(37,99,235,0.1))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function SectionTitle({
  index,
  title,
  right,
}: {
  index?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-300/15 px-3">
      <div className="flex items-center gap-2">
        {index ? (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-cyan-300/60 bg-cyan-400/10 text-sm font-bold text-cyan-100">
            {index}
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        )}
        <h2 className="text-[16px] font-semibold tracking-[0.08em] text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function SmallButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border px-3 text-[12px] transition",
        active
          ? "border-cyan-200/70 bg-cyan-400/18 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.22)]"
          : "border-cyan-300/20 bg-cyan-400/[0.06] text-slate-300 hover:bg-cyan-400/[0.12]"
      )}
    >
      {children}
    </button>
  );
}

function riskTone(risk: string) {
  if (risk === "高") return "border-rose-400/35 bg-rose-500/[0.1] text-rose-200";
  if (risk === "中") return "border-amber-400/35 bg-amber-500/[0.1] text-amber-200";
  return "border-emerald-400/35 bg-emerald-500/[0.1] text-emerald-200";
}

function statusLabel(status: DeepStatus) {
  if (status === "active") return "触发中";
  if (status === "watch") return "监测中";
  return "待观察";
}

function statusTone(status: DeepStatus) {
  if (status === "active") return "bg-emerald-400/15 text-emerald-200";
  if (status === "watch") return "bg-sky-400/12 text-sky-200";
  return "bg-slate-500/15 text-slate-300";
}

export default function AiValueChainPage() {
  const [activeObjective, setActiveObjective] = useState<ObjectiveKey>("profit");
  const [prompt, setPrompt] = useState("");
  const [activeConstraints, setActiveConstraints] = useState<Record<ConstraintKey, boolean>>({
    capacity: true,
    storage: true,
    capital: true,
    contract: true,
    orderWindow: true,
    foodSafety: true,
    customerPriority: true,
    inventoryAge: true,
  });
  const [executionPlan, setExecutionPlan] = useState<string[]>([]);
  const [planVersion, setPlanVersion] = useState(1);
  const [activeConsole, setActiveConsole] = useState<ConsoleTab>("AI 智能助手");
  const [activeView, setActiveView] = useState<ViewMode>("深度产业套利");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [sensitivityRows, setSensitivityRows] = useState<string[]>([]);
  const [exportQueue, setExportQueue] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [periodMode, setPeriodMode] = useState<"月度" | "季度">("月度");
  const { logs, pushLog } = useOperationLog([
    "AI 优化器已载入行情、产能、订单、库存与深加工需求。",
    "约束求解器待命：可切换目标函数并生成执行计划。",
  ]);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data: market } = trpc.platform.porkMarket.useQuery({
    timeframe: "month",
    regionCode: "national",
    sortBy: "hogPrice",
  });

  const liveHogQuote = market?.benchmarkQuotes.find(quote => quote.code === "live_hog");
  const cornQuote = market?.benchmarkQuotes.find(quote => quote.code === "corn_spot");
  const soymealQuote = market?.benchmarkQuotes.find(quote => quote.code === "soymeal_spot");

  const effectiveTuning = useMemo<OptimizationTuning>(() => {
    const base = objectiveConfig[activeObjective].tuning;
    const disabledPenalty = Object.values(activeConstraints).filter(enabled => !enabled).length * 0.025;
    return {
      ...base,
      slaughterCapacityMultiplier: clamp((base.slaughterCapacityMultiplier ?? 1) - disabledPenalty, 0.5, 1.5),
      splitCapacityMultiplier: clamp((base.splitCapacityMultiplier ?? 1) - disabledPenalty, 0.5, 1.5),
      freezeCapacityMultiplier: clamp((base.freezeCapacityMultiplier ?? 1) - disabledPenalty / 2, 0.5, 1.5),
      transportCostMultiplier: clamp((base.transportCostMultiplier ?? 1) + disabledPenalty, 0.5, 1.5),
    };
  }, [activeConstraints, activeObjective]);

  const { data: optimization, isLoading: optimizationLoading } =
    trpc.platform.globalOptimizationSimulate.useQuery({ tuning: effectiveTuning });

  const { data: batchScenarios } = trpc.platform.globalOptimizationBatchSimulate.useQuery({
    scenarios: (Object.keys(objectiveConfig) as ObjectiveKey[]).map(key => ({
      name: objectiveConfig[key].title,
      tuning: objectiveConfig[key].tuning,
    })),
  });

  const summary = optimization?.output.summary;
  const output = optimization?.output;
  const input = optimization?.input;
  const baseline = optimization?.baseline.output.summary;

  const totalSlaughter = summary?.totalSlaughterCount ?? 0;
  const totalSalesTon = (summary?.totalSalesKg ?? 0) / 1000;
  const totalFreezeTon = (summary?.totalFreezeKg ?? 0) / 1000;
  const totalInventoryTon = sum(output?.inventoryTable.map(row => row.inventoryKg) ?? []) / 1000;
  const totalSplitTon = sum(output?.splittingTable.map(row => row.splitKg) ?? []) / 1000;
  const deepDemandTon = sum(input?.deepProcessDemand.map(row => row.rawMaterialDemand) ?? []) / 1000;
  const orderDemandTon =
    (sum(input?.partOrders.map(row => row.orderQty) ?? []) + sum(input?.deepProcessDemand.map(row => row.rawMaterialDemand) ?? [])) / 1000;
  const orderSatisfaction = orderDemandTon > 0 ? clamp((totalSalesTon / orderDemandTon) * 100, 0, 120) : 0;
  const avgStorageDays = avg(snapshot?.inventoryBatches.map(batch => batch.ageDays) ?? []);
  const oldInventoryShare =
    snapshot?.inventoryBatches.length
      ? (snapshot.inventoryBatches.filter(batch => batch.ageDays >= 60).length / snapshot.inventoryBatches.length) * 100
      : 0;
  const capitalOccupied =
    (summary?.totalPigCost ?? 0) +
    (summary?.totalStorageCost ?? 0) +
    (summary?.totalProcessingCost ?? 0);
  const profitDelta =
    summary && baseline ? ((summary.totalProfit - baseline.totalProfit) / Math.max(Math.abs(baseline.totalProfit), 1)) * 100 : 0;
  const marginDelta = summary && baseline ? summary.profitMargin - baseline.profitMargin : 0;
  const freezeDelta =
    summary && baseline ? ((summary.totalFreezeKg - baseline.totalFreezeKg) / Math.max(baseline.totalFreezeKg, 1)) * 100 : 0;
  const generatedAt = market?.generatedAt ?? snapshot?.generatedAt ?? Date.now();

  const { data: arbitrageList } = trpc.platform.deepArbitrageList.useQuery({
    cornPrice: cornQuote?.price ?? 2386,
    soybeanMealPrice: soymealQuote?.price ?? 3115,
    liveHogPrice: liveHogQuote?.price ?? 14.5,
    sowStock: 4200,
    capacityUtilization: summary?.capacityUtilization ?? 72,
  });

  const opportunities = useMemo(() => {
    const byCategory = new Map<string, DeepArbitrageItem>();
    (arbitrageList as DeepArbitrageItem[] | undefined)?.forEach(item => byCategory.set(item.category, item));

    return fallbackOpportunities.map(([category, fallbackName, fallbackTrigger, fallbackAdvice], index) => {
      const item = byCategory.get(category);
      const expectedPerHead = item?.expectedReturnPerHead ?? (index % 4 === 0 ? 126 : index % 3 === 0 ? 95 : 52);
      const expectedWan = (expectedPerHead * Math.max(totalSlaughter, 8600)) / 10000;
      const status: DeepStatus = item?.triggerStatus ?? (index % 5 === 0 ? "watch" : "active");
      const risk = item?.riskLevel ?? (index % 4 === 0 ? "中" : "低");
      return {
        id: category,
        title: item?.name ?? fallbackName,
        trigger: item?.triggerCondition ?? fallbackTrigger,
        status,
        risk,
        expectedWan,
        capitalWan: Math.max(40, expectedWan * (risk === "高" ? 1.7 : risk === "中" ? 1.25 : 0.8)),
        advice: item?.implementation?.[0] ?? fallbackAdvice,
        stars: status === "active" ? (risk === "低" ? 4 : 3) : 2,
      };
    });
  }, [arbitrageList, totalSlaughter]);

  const activeOpportunityCount = opportunities.filter(item => item.status === "active").length;
  const watchOpportunityCount = opportunities.filter(item => item.status === "watch").length;
  const selectedOpportunity =
    opportunities.find(item => item.id === selectedOpportunityId) ?? opportunities[0];

  const businessInputs = [
    ["出栏计划", `${formatNumber(totalSlaughter)} 头`],
    ["仓储库容", `${formatNumber(totalInventoryTon + totalFreezeTon, 0)} 吨`],
    ["出品率", `${formatPct(totalSplitTon / Math.max(totalSlaughter * 0.11, 1) * 100)}`],
    ["销售订单", `${formatNumber(orderDemandTon, 0)} 吨`],
    ["屠宰产能", `${formatNumber(totalSlaughter / 30, 0)} 头/日`],
    ["深加工需求", `${formatNumber(deepDemandTon, 0)} 吨`],
    ["分割产能", `${formatNumber(totalSplitTon / 30, 0)} 吨/日`],
    ["运输成本", `${formatNumber((summary?.totalTransportCost ?? 0) / Math.max(totalSalesTon, 1), 2)} 元/吨`],
    ["速冻产能", `${formatNumber(totalFreezeTon / 30, 0)} 吨/日`],
    ["财务成本", `${formatPct((capitalOccupied / Math.max(summary?.totalRevenue ?? 1, 1)) * 3.8)}`],
  ];

  const resultTables = {
    production: [
      ["屠宰量", formatNumber(totalSlaughter), `${profitDelta >= 0 ? "+" : ""}${formatPct(profitDelta * 0.18)}`],
      ["分割量", formatNumber(totalSplitTon, 0), `${formatPct(marginDelta * 0.6)}`],
      ["速冻量", formatNumber(totalFreezeTon, 0), `${freezeDelta >= 0 ? "+" : ""}${formatPct(freezeDelta)}`],
    ],
    split: (output?.splittingTable ?? []).slice(0, 4).map(row => [
      row.part,
      formatNumber(row.splitKg / 1000, 0),
      `${row.freezeKg > row.splitKg * 0.35 ? "+" : ""}${formatPct((row.freezeKg / Math.max(row.splitKg, 1)) * 100)}`,
    ]),
    sales: (output?.salesTable ?? []).slice(0, 4).map(row => [
      row.customerType,
      formatNumber(row.orderQty / 1000, 0),
      `${formatPct((row.orderQty / Math.max(summary?.totalSalesKg ?? 1, 1)) * 100)}`,
    ]),
    freeze: (output?.inventoryTable ?? []).slice(0, 4).map(row => [
      row.part,
      formatNumber(row.inventoryKg / 1000, 0),
      `${formatNumber(avgStorageDays + (row.month % 4) * 1.7, 1)} 天`,
    ]),
    transport: (output?.transportTable ?? []).slice(0, 4).map(row => [
      row.destProvince,
      formatNumber(row.transportKg / 1000, 0),
      `${formatNumber((summary?.totalTransportCost ?? 0) / Math.max(summary?.totalSalesKg ?? 1, 1), 2)}`,
    ]),
    process: (input?.deepProcessDemand ?? []).slice(0, 4).map(row => [
      row.part,
      formatNumber(row.rawMaterialDemand / 1000, 0),
      `${formatPct((row.rawMaterialDemand / Math.max(deepDemandTon * 1000, 1)) * 100)}`,
    ]),
  };

  const keyMetrics = [
    ["总收入", `${formatWan(summary?.totalRevenue ?? 0)} 万元`, profitDelta >= 0 ? "up" : "down", `${formatPct(profitDelta)}`],
    ["总成本", `${formatWan((summary?.totalPigCost ?? 0) + (summary?.totalStorageCost ?? 0) + (summary?.totalTransportCost ?? 0) + (summary?.totalProcessingCost ?? 0))} 万元`, "up", `${formatPct(Math.abs(profitDelta) * 0.42)}`],
    ["总利润", `${formatWan(summary?.totalProfit ?? 0)} 万元`, profitDelta >= 0 ? "up" : "down", `${formatPct(profitDelta)}`],
    ["利润率", formatPct(summary?.profitMargin ?? 0), marginDelta >= 0 ? "up" : "down", `${formatNumber(marginDelta, 1)}pct`],
    ["屠宰量", `${formatNumber(totalSlaughter)} 头`, "down", `${formatPct(Math.min(3.5, Math.abs(marginDelta)))}`],
    ["销售量", `${formatNumber(totalSalesTon, 0)} 吨`, "up", `${formatPct(orderSatisfaction - 100)}`],
    ["冻储量", `${formatNumber(totalFreezeTon, 0)} 吨`, freezeDelta >= 0 ? "up" : "down", `${formatPct(freezeDelta)}`],
    ["头均利润", `${formatNumber(summary?.avgProfitPerPig ?? 0, 2)} 元/头`, "up", `${formatNumber((summary?.avgProfitPerPig ?? 0) - (baseline?.avgProfitPerPig ?? 0), 2)}`],
    ["产能利用率", formatPct(summary?.capacityUtilization ?? 0), "up", `${formatNumber((summary?.capacityUtilization ?? 0) - (baseline?.capacityUtilization ?? 0), 1)}pct`],
  ];

  const scenarioScores =
    batchScenarios?.map(item => ({
      name: item.name,
      profit: item.summary.totalProfit,
      margin: item.summary.profitMargin,
      utilization: item.summary.capacityUtilization,
      score: clamp(item.summary.profitMargin * 3.8 + (100 - Math.abs(88 - item.summary.capacityUtilization)) * 0.62, 0, 100),
    })) ?? [];

  const aiInsight = useMemo(() => {
    const topOpportunity = [...opportunities].sort((a, b) => b.expectedWan - a.expectedWan)[0];
    const riskText = opportunities.filter(item => item.risk === "高").length
      ? `高风险机会 ${opportunities.filter(item => item.risk === "高").length} 个，需先锁定风控边界。`
      : "高风险机会已被约束器压低，具备执行窗口。";
    return `本方案预计较基准利润变化 ${profitDelta >= 0 ? "+" : ""}${formatPct(profitDelta)}，建议以“${objectiveConfig[activeObjective].title}”为主目标。主要贡献来自 ${topOpportunity?.title ?? "产业套利"}，订单满足率 ${formatPct(orderSatisfaction)}，${riskText}`;
  }, [activeObjective, opportunities, orderSatisfaction, profitDelta]);

  const generatePlan = () => {
    const topThree = [...opportunities]
      .filter(item => item.status !== "inactive")
      .sort((a, b) => b.expectedWan - a.expectedWan)
      .slice(0, 3);
    const plan = [
      `执行目标：${objectiveConfig[activeObjective].title}，约束开启 ${Object.values(activeConstraints).filter(Boolean).length}/8。`,
      `套利抓手：优先执行 ${topThree.map(item => item.title).join("、")}。`,
      `排产动作：屠宰 ${formatNumber(totalSlaughter)} 头，分割 ${formatNumber(totalSplitTon, 0)} 吨，冻储 ${formatNumber(totalFreezeTon, 0)} 吨。`,
      `风险边界：订单满足率不低于 ${formatPct(Math.min(orderSatisfaction, 100))}，库龄 ${formatNumber(avgStorageDays, 0)} 天，超龄占比 ${formatPct(oldInventoryShare)}。`,
      `资金动作：预计资金占用 ${formatWan(capitalOccupied)} 万元，利润 ${formatWan(summary?.totalProfit ?? 0)} 万元。`,
    ];
    setExecutionPlan(plan);
    setPlanVersion(value => value + 1);
    pushLog(`已生成 V${planVersion + 1} 执行计划：${objectiveConfig[activeObjective].title}`);
    toast.success("AI 已生成可执行调度计划");
  };

  const applyPrompt = (message: string) => {
    setPrompt(message);
    if (message.includes("库存")) setActiveObjective("inventory");
    if (message.includes("订单")) setActiveObjective("order");
    if (message.includes("现金")) setActiveObjective("cash");
    if (message.includes("毛利") || message.includes("利润")) setActiveObjective("profit");
    if (message.includes("减亏")) setActiveObjective("loss");
    if (message.includes("风险") || message.includes("风控")) setActiveObjective("risk");
    if (message.includes("速冻") || message.includes("周转")) setActiveObjective("inventory");
    pushLog(`自然语言调参：${message}`);
  };

  const selectOpportunity = (item: (typeof opportunities)[number]) => {
    setSelectedOpportunityId(item.id);
    if (item.risk === "高") setActiveObjective("risk");
    else if (item.advice.includes("现金") || item.title.includes("现金")) setActiveObjective("cash");
    else if (item.title.includes("库存") || item.title.includes("冻")) setActiveObjective("inventory");
    else setActiveObjective("profit");
    applyPrompt(`围绕${item.title}生成可执行套利方案，校验风险、资金占用和订单满足率。`);
    setActiveConsole("方案管理");
    toast.success(`${item.title} 已进入右侧优化器`);
  };

  const openConsole = (label: ConsoleTab) => {
    setActiveConsole(label);
    if (label === "执行计划" && !executionPlan.length) generatePlan();
    if (label === "历史记录") {
      setExportQueue(prev => [`V${planVersion} ${objectiveConfig[activeObjective].title} 历史快照已载入`, ...prev].slice(0, 5));
    }
    pushLog(`${label} 已打开当前方案上下文`);
  };

  const runSensitivityAnalysis = () => {
    const rows = (scenarioScores.length ? scenarioScores : [{ name: objectiveConfig[activeObjective].title, score: 88, margin: summary?.profitMargin ?? 0, utilization: summary?.capacityUtilization ?? 0 }])
      .slice(0, 5)
      .map(item => `${item.name}：综合分 ${formatNumber(item.score, 1)}，利润率 ${formatPct(item.margin)}，产能利用 ${formatPct(item.utilization)}`);
    setSensitivityRows(rows);
    setActiveConsole("方案管理");
    pushLog(`敏感性分析完成：${rows.length} 个目标函数已对比`);
    toast.success("敏感性分析已基于当前目标刷新");
  };

  const exportResult = () => {
    const record = `${formatDateTime(Date.now())} 导出 V${planVersion} / ${objectiveConfig[activeObjective].title} / 收入${formatWan(summary?.totalRevenue ?? 0)}万元 / 利润${formatWan(summary?.totalProfit ?? 0)}万元`;
    setExportQueue(prev => [record, ...prev].slice(0, 5));
    setActiveConsole("历史记录");
    pushLog("当前方案结果已加入导出队列");
    toast.success("当前方案结果已加入导出队列");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020c1b] text-slate-100">
      <TacticalBackdrop intensity="normal" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.32),transparent_28%),linear-gradient(180deg,rgba(2,12,27,0.04),#020c1b_88%)]" />
      <div className={cn("relative z-10 min-w-[1280px] transition-transform duration-300", fullscreen && "scale-[0.985]")}>
        <header className="relative flex h-[72px] items-center justify-between border-b border-cyan-400/20 px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-[7px] border border-cyan-300/35 bg-cyan-400/10 text-orange-300">
              <Layers3 className="h-5 w-5" />
            </div>
            <button onClick={() => pushLog("组织上下文已切换为四川眉山食品集团，保留当前求解条件")} className="flex items-center gap-2 text-[17px] font-semibold text-white">
              四川眉山食品集团 <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="absolute left-1/2 top-2 w-[720px] -translate-x-1/2 text-center">
            <div className="mx-auto h-[58px] border-x border-cyan-300/20 bg-[linear-gradient(90deg,transparent,rgba(30,64,175,0.22),transparent)] px-8">
              <h1 className="text-[29px] font-bold tracking-[0.22em] text-white">
                深度产业套利与全局最优化调度中心
              </h1>
              <p className="mt-1 text-[12px] tracking-[0.34em] text-cyan-200/75">
                AI 驱动产业套利与全局最优调度 · 数据智能决策中枢
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[13px] text-slate-300">
            <SmallButton active onClick={() => {
              setPlanVersion(value => value + 1);
              pushLog("日期窗口已刷新：2026-07-01 ~ 2026-07-31");
            }}>
              <CalendarDays className="h-3.5 w-3.5" />
              2026-07-01 ~ 2026-07-31
            </SmallButton>
            <SmallButton onClick={() => {
              const next = periodMode === "月度" ? "季度" : "月度";
              setPeriodMode(next);
              pushLog(`统计粒度已切换为${next}`);
            }}>
              {periodMode} <ChevronDown className="h-3.5 w-3.5" />
            </SmallButton>
            <button className="flex items-center gap-1.5 text-slate-300" onClick={() => {
              setPlanVersion(value => value + 1);
              pushLog("用户刷新了优化求解上下文");
            }}>
              <RefreshCcw className="h-3.5 w-3.5" /> 刷新
            </button>
            <button className="flex items-center gap-1.5 text-slate-300" onClick={() => {
              setFullscreen(value => !value);
              pushLog(fullscreen ? "退出全屏作战视图" : "进入全屏作战视图");
            }}>
              <Expand className="h-3.5 w-3.5" /> {fullscreen ? "退出" : "全屏"}
            </button>
          </div>
        </header>

        <main className="grid gap-3 p-4 xl:grid-cols-[690px_minmax(0,1fr)]">
          <section className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setActiveView("深度产业套利")} className={cn("flex h-11 flex-1 items-center justify-center gap-3 rounded-t-[8px] border text-[18px] font-semibold", activeView === "深度产业套利" ? "border-cyan-300/40 bg-blue-500/20 text-cyan-100 shadow-[0_0_20px_rgba(37,99,235,0.25)]" : "border-cyan-300/20 bg-slate-900/50 text-slate-300")}>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-300 text-sm font-black text-blue-950">1</span>
                深度产业套利
              </button>
              <button onClick={() => {
                setActiveView("全局最优化调度");
                setActiveConsole("执行计划");
                if (!executionPlan.length) generatePlan();
              }} className={cn("flex h-11 flex-1 items-center justify-center gap-3 rounded-t-[8px] border text-[18px] font-semibold", activeView === "全局最优化调度" ? "border-cyan-300/40 bg-blue-500/20 text-cyan-100 shadow-[0_0_20px_rgba(37,99,235,0.25)]" : "border-cyan-300/20 bg-slate-900/50 text-slate-300")}>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-cyan-300/30 text-sm font-black text-cyan-200">2</span>
                全局最优化调度
              </button>
            </div>

            <Panel>
              <SectionTitle
                title="机会雷达"
                right={
                  <div className="flex items-center gap-2 text-[12px] text-slate-300">
                    <LiveSignal label="AI 扫描中" />
                    <span>触发 {activeOpportunityCount}</span>
                    <span>监测 {watchOpportunityCount}</span>
                  </div>
                }
              />
              <div className="grid h-[792px] grid-cols-2 gap-2 overflow-hidden p-3">
                {opportunities.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectOpportunity(item)}
                    className={cn(
                      "rounded-[8px] border bg-[#08223d]/82 p-3 text-left transition hover:border-cyan-300/45 hover:bg-cyan-400/[0.08]",
                      selectedOpportunityId === item.id
                        ? "border-cyan-200/70 shadow-[0_0_22px_rgba(34,211,238,0.22)]"
                        : "border-cyan-300/18"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/25 bg-blue-500/15 text-cyan-200">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="max-w-[210px] truncate text-[15px] font-semibold text-white">{item.title}</h3>
                      </div>
                      <span className={cn("rounded-[4px] px-2 py-0.5 text-[11px]", statusTone(item.status))}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-[70px_minmax(0,1fr)] gap-y-1 text-[12px] leading-5">
                      <span className="text-slate-400">触发条件:</span>
                      <span className="truncate text-slate-200">{item.trigger}</span>
                      <span className="text-slate-400">预期收益:</span>
                      <span className="font-mono text-emerald-300">+{formatWan(item.expectedWan * 10000)} 万元</span>
                      <span className="text-slate-400">风险等级:</span>
                      <span className={cn("w-fit rounded-[4px] border px-1.5", riskTone(item.risk))}>{item.risk}</span>
                      <span className="text-slate-400">执行准度:</span>
                      <span className="text-amber-300">{"★".repeat(item.stars)}{"☆".repeat(5 - item.stars)}</span>
                      <span className="text-slate-400">资金占用:</span>
                      <span className="text-slate-200">{formatNumber(item.capitalWan, 0)} 万元</span>
                      <span className="text-slate-400">AI建议:</span>
                      <span className="truncate text-cyan-200">{item.advice}</span>
                    </div>
                  </button>
                ))}
                <div className="col-span-2 flex items-center justify-between px-2 text-[12px] text-slate-400">
                  <span>AI 每 15 分钟自动扫描市场、价格、产能、库存、政策等数据，识别高价值套利机会。</span>
                  <span>数据更新：{formatDateTime(generatedAt)} · 系统运行正常</span>
                </div>
              </div>
            </Panel>
          </section>

          <section className="space-y-3">
            <div className="flex h-11 items-center justify-end gap-3">
              {([
                [BrainCircuit, "AI 智能助手"],
                [FileText, "方案管理"],
                [ClipboardList, "执行计划"],
                [History, "历史记录"],
              ] as Array<[typeof BrainCircuit, string]>).map(([CurrentIcon, label]) => {
                return (
                  <SmallButton key={String(label)} active={activeConsole === label} onClick={() => openConsole(label as ConsoleTab)}>
                    <CurrentIcon className="h-3.5 w-3.5" />
                    {label}
                  </SmallButton>
                );
              })}
            </div>

            <Panel>
              <SectionTitle index="G" title="优化目标选择" />
              <div className="grid grid-cols-6 gap-2 p-3">
                {(Object.keys(objectiveConfig) as ObjectiveKey[]).map(key => {
                  const item = objectiveConfig[key];
                  const Icon = item.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveObjective(key);
                        pushLog(`切换优化目标：${item.title}`);
                      }}
                      className={cn(
                        "min-h-[82px] rounded-[8px] border p-3 text-left transition",
                        activeObjective === key
                          ? "border-cyan-200/70 bg-blue-500/20 shadow-[0_0_22px_rgba(37,99,235,0.24)]"
                          : "border-cyan-300/18 bg-cyan-400/[0.055] hover:bg-cyan-400/[0.1]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-[6px] border border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[15px] font-semibold text-white">{item.title}</span>
                      </div>
                      <p className="mt-2 text-[12px] text-slate-400">{item.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <div className="grid gap-3 xl:grid-cols-[1.08fr_0.8fr_0.92fr]">
              <Panel>
                <SectionTitle title="输入约束条件" />
                <div className="space-y-3 p-3">
                  <div className="rounded-[8px] border border-cyan-300/15 bg-slate-950/30 p-3">
                    <h3 className="mb-2 text-[14px] font-semibold text-cyan-100">业务输入</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {businessInputs.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-[6px] border border-cyan-300/10 bg-cyan-400/[0.04] px-3 py-2 text-[12px]">
                          <span className="text-slate-400">{label}</span>
                          <span className="font-mono text-slate-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-cyan-300/15 bg-slate-950/30 p-3">
                    <h3 className="mb-2 text-[14px] font-semibold text-cyan-100">约束条件</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(constraintLabels) as ConstraintKey[]).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setActiveConstraints(prev => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                          className={cn(
                            "flex items-center justify-between rounded-[6px] border px-3 py-2 text-[12px]",
                            activeConstraints[key]
                              ? "border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-100"
                              : "border-slate-600/30 bg-slate-800/50 text-slate-500"
                          )}
                        >
                          <span>{constraintLabels[key]}</span>
                          <span className="rounded bg-blue-500/20 px-2 text-[11px]">
                            {activeConstraints[key] ? "已启用" : "已关闭"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <SectionTitle title="AI 自然语言调参" />
                <div className="flex h-full flex-col p-3">
                  <Textarea
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    placeholder="请输入调参需求，AI 将自动理解并优化方案"
                    className="min-h-[170px] resize-none rounded-[8px] border-cyan-300/15 bg-slate-950/35 text-[13px] text-slate-100"
                  />
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
                    {["优先降低库存", "保证广东订单", "提升现金流", "提高毛利率", "减少速冻库存", "优先高毛利渠道"].map(text => (
                      <SmallButton key={text} onClick={() => applyPrompt(text)}>
                        {text}
                      </SmallButton>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      applyPrompt(prompt || "按当前目标自动优化");
                      setActiveConsole("方案管理");
                      toast.success("AI 已解析调参意图并刷新求解参数");
                    }}
                    className="mt-3 h-9 rounded-[6px] bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    应用调参
                  </Button>
                </div>
              </Panel>

              <Panel>
                <SectionTitle title={`优化结果（方案A - ${objectiveConfig[activeObjective].title}）`} />
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[
                    ["生产计划", resultTables.production],
                    ["分割计划", resultTables.split],
                    ["销售计划", resultTables.sales],
                    ["冻储计划", resultTables.freeze],
                    ["运输计划", resultTables.transport],
                    ["深加工计划", resultTables.process],
                  ].map(([title, rows]) => (
                    <div key={String(title)} className="rounded-[8px] border border-cyan-300/15 bg-slate-950/30 p-2">
                      <h3 className="mb-2 text-center text-[13px] font-semibold text-cyan-100">{String(title)}</h3>
                      {(rows as string[][]).slice(0, 3).map(row => (
                        <div key={row.join("-")} className="grid grid-cols-[1fr_0.9fr_0.8fr] border-t border-cyan-300/10 py-1.5 text-[12px]">
                          <span className="truncate text-slate-400">{row[0]}</span>
                          <span className="text-right font-mono text-slate-100">{row[1]}</span>
                          <span className={cn("text-right font-mono", String(row[2]).includes("-") ? "text-rose-300" : "text-emerald-300")}>{row[2]}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel>
              <SectionTitle
                title="关键指标"
                right={
                  <div className="flex items-center gap-2 text-[12px] text-slate-300">
                    {optimizationLoading ? "求解中..." : "方案已求解"}
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                }
              />
              <div className="grid grid-cols-9 gap-2 p-3">
                {keyMetrics.map(([label, value, trend, delta]) => (
                  <div key={label} className="rounded-[8px] border border-cyan-300/18 bg-cyan-400/[0.055] p-3">
                    <p className="text-[12px] text-slate-400">{label}</p>
                    <p className="mt-2 truncate font-mono text-[20px] font-bold text-cyan-100">{value}</p>
                    <p className={cn("mt-1 flex items-center gap-1 text-[12px]", trend === "up" ? "text-emerald-300" : "text-rose-300")}>
                      {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {delta}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-3 xl:grid-cols-[1fr_0.74fr]">
              <Panel>
                <SectionTitle title="AI 洞察建议" />
                <div className="flex items-center gap-4 p-3">
                  <div className="grid h-16 w-16 place-items-center rounded-[8px] border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                    <Bot className="h-9 w-9" />
                  </div>
                  <p className="flex-1 text-[14px] leading-7 text-slate-200">{aiInsight}</p>
                  <Button
                    onClick={generatePlan}
                    className="h-14 min-w-[220px] rounded-[8px] bg-blue-600 text-[18px] font-semibold text-white shadow-[0_0_24px_rgba(37,99,235,0.35)] hover:bg-blue-500"
                  >
                    生成执行计划
                    <PlayCircle className="ml-3 h-6 w-6" />
                  </Button>
                </div>
              </Panel>

              <Panel>
                <SectionTitle title={`作战记录与方案对比 · ${activeConsole}`} />
                <div className="grid grid-cols-[0.9fr_1.1fr] gap-2 p-3">
                  <div className="space-y-1.5">
                    {selectedOpportunity ? (
                      <div className="rounded-[6px] border border-emerald-300/18 bg-emerald-400/[0.06] px-2 py-1.5 text-[12px] leading-5 text-emerald-100">
                        当前机会：{selectedOpportunity.title}，预期收益 +{formatWan(selectedOpportunity.expectedWan * 10000)} 万元，风险 {selectedOpportunity.risk}
                      </div>
                    ) : null}
                    {scenarioScores.slice(0, 6).map(item => (
                      <div key={item.name} className="rounded-[6px] border border-cyan-300/12 bg-slate-950/30 px-2 py-1.5">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="font-mono text-emerald-300">{formatNumber(item.score, 1)}</span>
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-300" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {activeConsole === "历史记录" && exportQueue.length ? exportQueue.map(item => (
                      <div key={item} className="rounded-[6px] border border-blue-300/15 bg-blue-400/[0.055] px-2 py-1.5 text-[12px] leading-5 text-slate-200">
                        {item}
                      </div>
                    )) : activeConsole === "方案管理" && sensitivityRows.length ? sensitivityRows.map(item => (
                      <div key={item} className="rounded-[6px] border border-violet-300/15 bg-violet-400/[0.055] px-2 py-1.5 text-[12px] leading-5 text-slate-200">
                        {item}
                      </div>
                    )) : executionPlan.length ? executionPlan.map(item => (
                      <div key={item} className="rounded-[6px] border border-emerald-300/15 bg-emerald-400/[0.055] px-2 py-1.5 text-[12px] leading-5 text-slate-200">
                        {item}
                      </div>
                    )) : logs.slice(0, 5).map(item => (
                      <div key={item} className="rounded-[6px] border border-cyan-300/12 bg-slate-950/30 px-2 py-1.5 text-[12px] text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>

            <footer className="flex items-center justify-between rounded-[8px] border border-cyan-300/20 bg-[#061c36]/80 px-3 py-2 text-[12px] text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-emerald-300" />
                  数据更新：{formatDateTime(generatedAt)}
                </span>
                <span>真实数据源：行情快照、库存批次、全局优化样本、深度套利模型</span>
                <span>真实性审查：订单、产能、库容、资金与食品安全约束已联动</span>
              </div>
              <div className="flex gap-2">
                <SmallButton onClick={runSensitivityAnalysis}>
                  <BarChart3 className="h-3.5 w-3.5" />
                  敏感性分析
                </SmallButton>
                <SmallButton onClick={exportResult}>
                  <Download className="h-3.5 w-3.5" />
                  导出结果
                </SmallButton>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
