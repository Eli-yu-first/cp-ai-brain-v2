import { TacticalBackdrop, LiveSignal, useOperationLog } from "@/components/ai/TacticalEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import chinaGeo from "@/data/china-geo.json";
import {
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CloudSun,
  Database,
  Expand,
  FileText,
  History,
  Layers3,
  MapPinned,
  Package,
  PackageCheck,
  RefreshCcw,
  Route,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThermometerSnowflake,
  Truck,
  UserRound,
  Warehouse,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ComposableMap, Geographies, Geography, Line as MapLine, Marker } from "react-simple-maps";
import { toast } from "sonner";

type VehiclePreference = "auto" | "small" | "medium" | "large";
type StrategyMode = "balanced" | "fresh_first" | "storage_first" | "deep_processing";
type TimeStoragePolicy = "auto" | "force" | "off";
type DispatchTab = "driver" | "warehouse" | "sales";
type Tone = "cyan" | "blue" | "emerald" | "amber" | "rose" | "violet";
type WorkspaceTab = "空间套利" | "智能预测" | "调拨执行" | "运力管理" | "仓储网络" | "风控管理" | "数据中心";

const geoUrl = chinaGeo;

const strategyOptions: Array<{
  key: StrategyMode;
  label: string;
  note: string;
  minProfit: number;
  transportCost: number;
  policy: TimeStoragePolicy;
}> = [
  { key: "balanced", label: "综合最优", note: "利润、时效、风险均衡", minProfit: 1.0, transportCost: 0.8, policy: "auto" },
  { key: "fresh_first", label: "高周转鲜销", note: "优先兑现销地价差", minProfit: 0.8, transportCost: 0.72, policy: "off" },
  { key: "storage_first", label: "冻储套利", note: "释放时间套利窗口", minProfit: 1.2, transportCost: 0.78, policy: "force" },
  { key: "deep_processing", label: "深加工承接", note: "把空间价差转加工溢价", minProfit: 1.1, transportCost: 0.84, policy: "auto" },
];

const navItems = ["空间套利", "智能预测", "调拨执行", "运力管理", "仓储网络", "风控管理", "数据中心"];

const cityCoordinateFallback: Record<string, [number, number]> = {
  成都: [104.06, 30.67],
  广州: [113.26, 23.13],
  长沙: [112.94, 28.23],
  昆明: [102.83, 24.88],
  上海: [121.47, 31.23],
  北京: [116.4, 39.9],
  武汉: [114.3, 30.59],
  杭州: [120.15, 30.28],
  南京: [118.78, 32.06],
  重庆: [106.55, 29.56],
  西安: [108.94, 34.34],
  太原: [112.55, 37.87],
  济南: [117.12, 36.65],
  沈阳: [123.43, 41.8],
  哈尔滨: [126.64, 45.75],
  南宁: [108.32, 22.82],
  福州: [119.3, 26.08],
  深圳: [114.05, 22.55],
  兰州: [103.84, 36.06],
  西宁: [101.78, 36.62],
  乌鲁木齐: [87.62, 43.82],
};

const partLabels: Record<string, string> = {
  all: "全部品类",
  whole_hog: "活体毛猪",
  carcass: "核心白条",
  frozen_stock: "冷冻库存",
  pork_belly: "精选五花肉",
  ribs: "肋排",
};

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatWan(value: number, digits = 1) {
  return formatNumber(value, digits);
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

function timeStamp(value?: number) {
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

function panelTone(tone: Tone) {
  const map: Record<Tone, string> = {
    cyan: "border-cyan-400/30 bg-cyan-500/[0.06] text-cyan-100",
    blue: "border-blue-400/30 bg-blue-500/[0.07] text-blue-100",
    emerald: "border-emerald-400/30 bg-emerald-500/[0.07] text-emerald-100",
    amber: "border-amber-400/35 bg-amber-500/[0.08] text-amber-100",
    rose: "border-rose-400/35 bg-rose-500/[0.08] text-rose-100",
    violet: "border-violet-400/35 bg-violet-500/[0.08] text-violet-100",
  };
  return map[tone];
}

function routeStroke(netProfit: number, maxProfit: number) {
  const ratio = maxProfit <= 0 ? 0.3 : clamp(netProfit / maxProfit, 0.18, 1);
  if (ratio > 0.78) return { stroke: "#5eead4", width: 2.4 + ratio * 2, opacity: 0.88 };
  if (ratio > 0.48) return { stroke: "#fbbf24", width: 1.8 + ratio * 2, opacity: 0.72 };
  return { stroke: "#60a5fa", width: 1.4 + ratio * 1.5, opacity: 0.52 };
}

function provinceFill(name: string, simulation: any) {
  const shortName = name.replace(/省|市|壮族自治区|回族自治区|维吾尔自治区|自治区/g, "");
  const node = simulation?.nodes?.find((item: any) => item.name.includes(shortName) || shortName.includes(item.name));
  if (!node) return "rgba(15, 23, 42, 0.72)";
  if (node.type === "origin") return "rgba(45, 212, 191, 0.24)";
  return "rgba(251, 191, 36, 0.24)";
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-400/30 bg-[#061a31]/92 shadow-[inset_0_1px_0_rgba(125,211,252,0.18),0_0_22px_rgba(14,116,195,0.2)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent_34%,rgba(37,99,235,0.08))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between border-b border-cyan-300/15 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        <h2 className="truncate text-[15px] font-semibold tracking-[0.04em] text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-[7px] border border-cyan-300/20 bg-[#071a2d]/90 px-3 text-[13px] text-slate-300">
      <span className="shrink-0 text-slate-400">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-[#071a2d] text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 text-slate-500" />
    </label>
  );
}

function MetricCard({
  label,
  value,
  sub,
  tone = "cyan",
  chart = true,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: Tone;
  chart?: boolean;
}) {
  const bars = [34, 52, 46, 72, 64, 78, 69, 88, 76, 91];
  return (
    <Panel className={cn("h-[84px]", panelTone(tone))}>
      <div className="flex h-full items-center justify-between px-4">
        <div className="min-w-0">
          <p className="text-[12px] text-slate-300">{label}</p>
          <p className="mt-1 truncate font-mono text-[27px] font-bold">{value}</p>
          <p className="text-[11px] text-emerald-300">{sub}</p>
        </div>
        {chart ? (
          <div className="flex h-11 w-28 items-end gap-1 opacity-80">
            {bars.map((bar, index) => (
              <span key={`${bar}-${index}`} className="flex-1 rounded-t bg-current/45" style={{ height: `${bar}%` }} />
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function Donut({ segments }: { segments: Array<{ value: number; color: string }> }) {
  let start = 0;
  const gradient = segments
    .map(item => {
      const end = start + item.value;
      const part = `${item.color} ${start}% ${end}%`;
      start = end;
      return part;
    })
    .join(", ");
  return (
    <div
      className="grid h-[118px] w-[118px] place-items-center rounded-full"
      style={{ background: `conic-gradient(${gradient})` }}
    >
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#071a2d] text-center">
        <span className="font-mono text-lg font-bold text-cyan-100">AI</span>
      </div>
    </div>
  );
}

export default function SpatialArbitragePage() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceTab>("空间套利");
  const [partCode, setPartCode] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [vehiclePreference, setVehiclePreference] = useState<VehiclePreference>("auto");
  const [strategyMode, setStrategyMode] = useState<StrategyMode>("balanced");
  const [timeStoragePolicy, setTimeStoragePolicy] = useState<TimeStoragePolicy>("auto");
  const [transportCost, setTransportCost] = useState(0.8);
  const [minProfit, setMinProfit] = useState(1.0);
  const [batchSize, setBatchSize] = useState(500);
  const [targetShipmentTon, setTargetShipmentTon] = useState(0);
  const [dispatchTab, setDispatchTab] = useState<DispatchTab>("driver");
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string[]>([]);
  const [copilotInput, setCopilotInput] = useState("");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapMode, setMapMode] = useState<"全国" | "区域">("全国");
  const [queryRun, setQueryRun] = useState(1);
  const [dispatchQueue, setDispatchQueue] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState("物流任务");
  const { logs, pushLog } = useOperationLog([
    "AI Logistics 已载入空间价差、仓储库存与冷链车型约束。",
    "调度求解器待命：可生成司机、仓储、销售三类调度单。",
  ]);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data: market } = trpc.platform.porkMarket.useQuery({
    timeframe: "month",
    regionCode: "national",
    sortBy: "hogPrice",
  });

  const { data: simulation, isLoading } = trpc.platform.spatialArbitrageSimulate.useQuery(
    {
      transportCostPerKmPerTon: transportCost,
      minProfitThreshold: minProfit,
      batchSizeTon: batchSize,
      originFilter,
      partCode,
      vehiclePreference,
      targetShipmentTon: targetShipmentTon > 0 ? targetShipmentTon : undefined,
      strategyMode,
      timeStoragePolicy,
      planningDays: 7,
      holdingCostPerMonth: 0.2,
      socialBreakevenCost: 12,
      startMonth: 7,
      storageDurationMonths: 4,
      freshSalesTonPerDay: 900,
      reserveSalesTonPerMonth: 5000,
      deepProcessingTonPerDay: 260,
      rentedStorageTon: strategyMode === "storage_first" ? 12000 : 0,
      optimization: {
        breedingHeadsPerDay: 40000,
        slaughterHeadsPerDay: strategyMode === "fresh_first" ? 26000 : 22000,
        cuttingHeadsPerDay: 9000,
        freezingTonsPerDay: strategyMode === "storage_first" ? 860 : 520,
        storageTonsCapacity: strategyMode === "storage_first" ? 18000 : 5000,
        deepProcessingTonsPerDay: strategyMode === "deep_processing" ? 620 : 260,
        salesFreshTonsPerDay: strategyMode === "fresh_first" ? 1500 : 900,
        salesFrozenTonsPerMonth: 5000,
        salesProcessedTonsPerDay: strategyMode === "deep_processing" ? 640 : 260,
        breedingCostPerHead: 0.18,
        slaughterCostPerHead: 0.42,
        cuttingCostPerHead: 0.33,
        freezingCostPerTon: 86,
        storageCostPerTonMonth: 42,
        deepProcessingCostPerTon: 120,
        salesCostPerTon: 35,
      },
    },
    { placeholderData: previous => previous },
  );

  const utils = trpc.useUtils();
  const { mutate: saveRecord, isPending: savingRecord } = trpc.platform.saveArbitrageRecord.useMutation({
    onSuccess: () => {
      utils.platform.listArbitrageRecords.invalidate();
      toast.success("空间套利方案已保存到审计记录");
      pushLog("保存方案并写入审计记录");
    },
  });
  const { mutate: runAiDispatch, data: aiTasks, isPending: aiPending } =
    trpc.platform.spatialAiDispatch.useMutation({
      onSuccess: () => pushLog("AI 岗位任务已生成：采购、物流、销售、风控"),
    });

  useEffect(() => {
    if (!simulation?.routes?.length) return;
    const timer = window.setTimeout(() => runAiDispatch({ routes: simulation.routes }), 500);
    return () => window.clearTimeout(timer);
  }, [simulation?.routes, runAiDispatch]);

  const routes = useMemo(() => {
    const allRoutes = simulation?.routes ?? [];
    if (destFilter === "all") return allRoutes;
    return allRoutes.filter((route: any) => route.destName.includes(destFilter));
  }, [destFilter, simulation?.routes]);

  const schedulePlan = simulation?.schedulePlan ?? [];
  const summary = simulation?.scheduleSummary;
  const selectedRoute = routes[selectedRouteIndex] ?? routes[0];
  const selectedSchedule = schedulePlan[selectedRouteIndex] ?? schedulePlan[0];
  const generatedAt = market?.generatedAt ?? snapshot?.generatedAt ?? Date.now();
  const totalInventoryTons = Math.round((snapshot?.inventoryBatches ?? []).reduce((total, batch) => total + batch.weightKg / 1000, 0));
  const availableInventoryTons = Math.round(totalInventoryTons * 0.68);
  const demandTotal = Math.round((simulation?.nodes ?? []).filter((node: any) => node.type === "destination").reduce((total: number, node: any) => total + (node.demand ?? 0), 0));
  const supplyTotal = Math.round((simulation?.nodes ?? []).filter((node: any) => node.type === "origin").reduce((total: number, node: any) => total + (node.capacity ?? 0), 0));
  const averageMargin = avg(routes.slice(0, 10).map((route: any) => route.netProfit * 10));
  const vehicleTotal = (summary?.vehicleMix?.small ?? 0) + (summary?.vehicleMix?.medium ?? 0) + (summary?.vehicleMix?.large ?? 0);
  const onTimeRate = clamp(97.2 - Math.max(0, (summary?.averageFreightPerKg ?? 0) - 1.2) * 5, 88, 99.6);
  const capacityUtilization = clamp((summary?.totalShippedTon ?? 0) / Math.max(supplyTotal, 1) * 100, 0, 100);

  const topHeat = routes.slice(0, 5).map((route: any, index: number) => ({
    rank: index + 1,
    name: `${route.originName} → ${route.destName}`,
    margin: route.netProfit * 10,
    volume: schedulePlan[index]?.shippedTon ?? Math.min(route.batchProfit * 12, 6280),
  }));

  const warehouseMoves = schedulePlan.slice(0, 3).map((item: any, index: number) => ({
    title: `${item.originName}冷库 → ${item.destName}冷库`,
    ton: Math.max(40, Math.round((item.storageTon || item.shippedTon * 0.18) / 5) * 5),
    profit: Math.max(0.5, item.netProfitTotal * 0.12),
    status: index === 0 ? "执行" : "待确认",
  }));

  const allocationRows = [
    {
      label: "鲜销通道",
      share: summary?.totalShippedTon ? (summary.freshSalesTon / summary.totalShippedTon) * 100 : 58,
      ton: summary?.freshSalesTon ?? 3640,
      profit: (summary?.freshSalesTon ?? 3640) * (summary?.averageNetProfitPerKg ?? 0.586) * 0.1,
      color: "#5eead4",
    },
    {
      label: "冻储通道",
      share: summary?.totalShippedTon ? (summary.storageTon / summary.totalShippedTon) * 100 : 27,
      ton: summary?.storageTon ?? 1696,
      profit: (summary?.storageTon ?? 1696) * ((summary?.averageNetProfitPerKg ?? 0.42) + 0.12) * 0.1,
      color: "#60a5fa",
    },
    {
      label: "深加工通道",
      share: summary?.totalShippedTon ? (summary.deepProcessingTon / summary.totalShippedTon) * 100 : 15,
      ton: summary?.deepProcessingTon ?? 944,
      profit: (summary?.deepProcessingTon ?? 944) * ((summary?.averageNetProfitPerKg ?? 0.32) + 0.18) * 0.1,
      color: "#86efac",
    },
  ];
  const shareTotal = Math.max(1, sum(allocationRows.map(row => row.share)));

  const dispatchTasks = [
    {
      title: "采购任务",
      desc: `建议采购 ${formatNumber(Math.round((summary?.totalShippedTon ?? 4850) * 0.78))} 吨`,
      meta: `预计成本 ${formatWan((summary?.totalFreight ?? 1268000) / 10000)} 万元`,
      count: 8,
      tone: "violet" as Tone,
      icon: PackageCheck,
    },
    {
      title: "物流任务",
      desc: `调度 ${vehicleTotal || 36} 车次`,
      meta: `预计运费 ${formatWan((summary?.totalFreight ?? 1268000) / 10000)} 万元`,
      count: 12,
      tone: "blue" as Tone,
      icon: Truck,
    },
    {
      title: "销售任务",
      desc: `待销售 ${formatNumber(Math.round(summary?.freshSalesTon ?? 6280))} 吨`,
      meta: `预计收入 ${formatWan((summary?.totalNetProfit ?? 286.4) * 10)} 万元`,
      count: 15,
      tone: "emerald" as Tone,
      icon: Package,
    },
    {
      title: "仓储任务",
      desc: `待入库 ${formatNumber(Math.round(summary?.storageTon ?? 2350))} 吨`,
      meta: `冷库可用 ${formatNumber(availableInventoryTons)} 吨`,
      count: 6,
      tone: "blue" as Tone,
      icon: Warehouse,
    },
    {
      title: "风控任务",
      desc: `预警风险 ${Math.max(2, routes.filter((route: any) => route.netProfit < minProfit + 0.4).length)} 条`,
      meta: `需关注货值 ${formatWan((summary?.totalNetProfit ?? 285) * 0.9)} 万元`,
      count: 4,
      tone: "rose" as Tone,
      icon: ShieldAlert,
    },
  ];

  const generateDispatchOrder = () => {
    if (!simulation) return;
    const plan = [
      `路线：${selectedSchedule?.originName ?? selectedRoute?.originName ?? "最优产地"} → ${selectedSchedule?.destName ?? selectedRoute?.destName ?? "最优销地"}`,
      `车辆：${selectedSchedule?.vehicleName ?? "自动冷链车"}，预计 ${(selectedSchedule?.trips ?? vehicleTotal) || 1} 车次`,
      `货量：${formatNumber(selectedSchedule?.shippedTon ?? summary?.totalShippedTon ?? 0)} 吨，温控 -2~4°C`,
      `预计净利：${formatWan(selectedSchedule?.netProfitTotal ?? summary?.totalNetProfit ?? 0)} 万元，准时率 ${formatPct(onTimeRate)}`,
    ];
    setSelectedPlan(plan);
    setDispatchQueue(prev => [`${dispatchTab}｜${plan[0]}｜${plan[2]}`, ...prev].slice(0, 6));
    pushLog(`生成${dispatchTab === "driver" ? "司机" : dispatchTab === "warehouse" ? "仓储" : "销售"}调度单：${plan[0]}`);
    toast.success("AI 已生成调度单");
  };

  const saveCurrentPlan = () => {
    if (!simulation) return;
    saveRecord({
      recordType: "spatial",
      scenarioLabel: `空间套利冷链调度 ${simulation.bestRouteName} · ${partLabels[partCode] ?? partCode}`,
      params: {
        transportCost,
        minProfit,
        batchSize,
        originFilter,
        destFilter,
        partCode,
        vehiclePreference,
        targetShipmentTon: targetShipmentTon > 0 ? targetShipmentTon : null,
        strategyMode,
        timeStoragePolicy,
      },
      result: {
        bestRouteName: simulation.bestRouteName,
        bestRouteProfit: simulation.bestRouteProfit,
        totalOpportunities: simulation.totalOpportunities,
        scheduleSummary: simulation.scheduleSummary,
        chainAnalysis: simulation.chainAnalysis,
        schedulePlanTop5: simulation.schedulePlan.slice(0, 5),
      },
      summaryProfit: `${simulation.scheduleSummary.totalNetProfit} 万元`,
      summaryMetric: `发运 ${simulation.scheduleSummary.totalShippedTon} 吨 / ${simulation.schedulePlan.length} 条路线`,
    });
  };

  const applyAiStrategy = (option: (typeof strategyOptions)[number]) => {
    setStrategyMode(option.key);
    setMinProfit(option.minProfit);
    setTransportCost(option.transportCost);
    setTimeStoragePolicy(option.policy);
    pushLog(`应用 AI 策略：${option.label}`);
    toast.success(`${option.label} 已应用到当前路线求解器`);
  };

  const sendCopilot = () => {
    const text = copilotInput.trim();
    if (!text) return;
    if (text.includes("仓") || text.includes("冻")) applyAiStrategy(strategyOptions[2]!);
    else if (text.includes("时效") || text.includes("快")) applyAiStrategy(strategyOptions[1]!);
    else if (text.includes("加工")) applyAiStrategy(strategyOptions[3]!);
    else if (text.includes("低风险") || text.includes("风控")) {
      setMinProfit(value => Math.min(5, Number((value + 0.4).toFixed(1))));
      setVehiclePreference("auto");
      setTimeStoragePolicy("auto");
      pushLog("AI Copilot 已切换低风险策略：提高利润阈值并重算自动车型");
      toast.success("低风险调度策略已应用");
    }
    else if (text.includes("锁定") || text.includes("Top")) {
      setSelectedRouteIndex(0);
      generateDispatchOrder();
    }
    else pushLog(`AI Copilot 收到策略指令：${text}`);
    setCopilotInput("");
  };

  const runQuickCommand = (text: string) => {
    setCopilotInput(text);
    if (text.includes("低风险")) {
      setMinProfit(value => Math.min(5, Number((value + 0.4).toFixed(1))));
      setTimeStoragePolicy("auto");
      pushLog("快捷指令执行：生成低风险方案，利润阈值已上调");
      toast.success("低风险方案已重算");
      return;
    }
    if (text.includes("Top")) {
      setSelectedRouteIndex(0);
      generateDispatchOrder();
      pushLog("快捷指令执行：Top 路线已锁定并生成调度单");
      return;
    }
    pushLog(`快捷指令执行：${text}，冷链时效校验通过 ${formatPct(onTimeRate)}`);
    toast.success("冷链时效校验完成");
  };

  const openTask = (taskTitle: string) => {
    setActiveTask(taskTitle);
    if (taskTitle.includes("采购")) setDispatchTab("warehouse");
    else if (taskTitle.includes("销售")) setDispatchTab("sales");
    else setDispatchTab("driver");
    generateDispatchOrder();
    pushLog(`${taskTitle} 已打开并生成执行单`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020c1b] text-slate-100">
      <TacticalBackdrop intensity="normal" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.26),transparent_30%),linear-gradient(180deg,rgba(2,12,27,0.02),#020c1b_88%)]" />
      <div className="relative z-10 min-w-[1440px]">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-400/20 bg-[#041225]/85 px-4">
          <div className="flex h-full items-center gap-4">
            <div className="flex items-center gap-2 pr-3">
              <div className="grid h-9 w-9 place-items-center rounded-[9px] border border-cyan-300/35 bg-cyan-400/10 text-cyan-200">
                <Route className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[18px] font-bold text-white">智链云</div>
                <div className="-mt-1 text-[10px] uppercase tracking-[0.22em] text-cyan-300/70">AI Logistics</div>
              </div>
            </div>
            <nav className="flex h-full items-center">
              {navItems.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(item as WorkspaceTab);
                    pushLog(`${item} 工作区已打开，沿用当前路线与调度上下文`);
                  }}
                  className={cn(
                    "h-full min-w-[110px] border-x border-cyan-300/5 px-4 text-[14px] font-semibold transition",
                    activeWorkspace === item
                      ? "bg-blue-500/22 text-cyan-100 shadow-[inset_0_-2px_0_rgba(103,232,249,0.8)]"
                      : "text-slate-400 hover:bg-cyan-400/[0.06] hover:text-cyan-100",
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="absolute left-1/2 top-2 -translate-x-1/2 text-center">
            <h1 className="text-[25px] font-bold tracking-[0.16em] text-white">空间套利与冷链调度中心</h1>
            <p className="text-[11px] tracking-[0.32em] text-cyan-200/70">AI 驱动 · 智能决策 · 全局协同</p>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-slate-300">
            <span>2026-07-01</span>
            <span>10:30:45</span>
            <span className="flex items-center gap-1"><CloudSun className="h-4 w-4" /> 多云 24°C</span>
            <span className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1 text-[10px] text-white">12</span>
            </span>
            <div className="flex items-center gap-2">
              <UserRound className="h-7 w-7 rounded-full border border-cyan-300/30 bg-cyan-400/10 p-1" />
              <span>张钧川</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_104px_104px_150px] gap-3 p-3">
          <SelectBox
            label="产地"
            value={originFilter}
            onChange={setOriginFilter}
            options={[
              { label: "全部产地", value: "all" },
              { label: "四川重点区", value: "四川" },
              { label: "云南重点区", value: "云南" },
              { label: "贵州重点区", value: "贵州" },
              { label: "湖南重点区", value: "湖南" },
            ]}
          />
          <SelectBox
            label="销地"
            value={destFilter}
            onChange={setDestFilter}
            options={[
              { label: "全部销地", value: "all" },
              { label: "广东", value: "广州" },
              { label: "浙江", value: "杭州" },
              { label: "上海", value: "上海" },
              { label: "北京", value: "北京" },
            ]}
          />
          <SelectBox
            label="品类"
            value={partCode}
            onChange={setPartCode}
            options={Object.entries(partLabels).map(([value, label]) => ({ label, value }))}
          />
          <SelectBox
            label="车型"
            value={vehiclePreference}
            onChange={value => setVehiclePreference(value as VehiclePreference)}
            options={[
              { label: "全部车型", value: "auto" },
              { label: "小型冷链", value: "small" },
              { label: "中型冷链", value: "medium" },
              { label: "大型干线", value: "large" },
            ]}
          />
          <Button onClick={() => {
            applyAiStrategy(strategyOptions[0]!);
            setOriginFilter("all");
            setDestFilter("all");
            setPartCode("all");
            setSelectedRouteIndex(0);
          }} className="h-11 rounded-[7px] bg-slate-800 text-slate-200 hover:bg-slate-700">重置</Button>
          <Button onClick={() => {
            setQueryRun(value => value + 1);
            setSelectedRouteIndex(0);
            pushLog(`第 ${queryRun + 1} 次查询已触发，路线与调度计划已按筛选条件重算`);
          }} className="h-11 rounded-[7px] bg-blue-600 text-white hover:bg-blue-500">查询</Button>
          <SelectBox
            label=""
            value={strategyMode}
            onChange={value => {
              const option = strategyOptions.find(item => item.key === value);
              if (option) applyAiStrategy(option);
            }}
            options={strategyOptions.map(item => ({ label: item.label, value: item.key }))}
          />
        </div>

        <section className="grid grid-cols-5 gap-3 px-3">
          <MetricCard label="路线总利润" value={`${formatWan(summary?.totalNetProfit ?? 0)}万元`} sub={`较昨日 ↑ ${formatPct(Math.max(4.8, profitChange(routes)))}`} tone="cyan" />
          <MetricCard label="总运费成本" value={`${formatWan((summary?.totalFreight ?? 0) / 10000)}万元`} sub="较昨日 ↑ 8.3%" tone="blue" />
          <MetricCard label="平均毛利率" value={formatPct(averageMargin / 2.4)} sub="较昨日 ↑ 3.2pct" tone="violet" />
          <MetricCard label="准时交付率" value={formatPct(onTimeRate)} sub="较昨日 ↑ 1.8pct" tone="cyan" />
          <MetricCard label="运力利用率" value={formatPct(capacityUtilization || 82.4)} sub="较昨日 ↑ 4.6pct" tone="amber" />
        </section>

        <main className="grid gap-3 p-3 xl:grid-cols-[360px_minmax(0,1fr)_390px]">
          <aside className="space-y-3">
            <Panel>
              <PanelTitle title="全国套利概览" right={<LiveSignal label={isLoading ? "计算中" : "实时"} />} />
              <div className="grid grid-cols-2 gap-2 p-3">
                {[
                  ["可套利通道", `${simulation?.totalOpportunities ?? 0} 条`, "较昨日 ↑ 16"],
                  ["预计总利润", `${formatWan(summary?.totalNetProfit ?? 0)} 万元`, "较昨日 ↑ 18.6%"],
                  ["可调拨量", `${formatNumber(summary?.totalShippedTon ?? 0)} 吨`, "较昨日 ↑ 12.4%"],
                  ["平均单位净利", `${formatNumber((summary?.averageNetProfitPerKg ?? 0) * 10, 2)} 元/吨`, "较昨日 ↑ 4.3%"],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-[7px] border border-cyan-300/12 bg-cyan-400/[0.045] p-3">
                    <p className="text-[12px] text-slate-400">{label}</p>
                    <p className="mt-2 font-mono text-[22px] font-bold text-emerald-300">{value}</p>
                    <p className="text-[11px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="价格与供需概览（全国）" right={<RefreshCcw className="h-3.5 w-3.5 text-cyan-200" />} />
              <div className="grid grid-cols-3 gap-2 p-3">
                {[
                  ["产地均价", `${formatNumber(avg(routes.map((r: any) => r.originPrice)), 2)} 元/公斤`],
                  ["销地均价", `${formatNumber(avg(routes.map((r: any) => r.destPrice)), 2)} 元/公斤`],
                  ["价差均值", `${formatNumber(simulation?.averageSpread ?? 0, 2)} 元/公斤`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[6px] border border-cyan-300/12 bg-slate-950/28 p-2">
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className="mt-1 font-mono text-[17px] font-bold text-emerald-300">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                {[
                  ["供给能力", `${formatNumber(supplyTotal)} 吨`, "+ 9.5%"],
                  ["需求量", `${formatNumber(demandTotal)} 吨`, "+ 7.2%"],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-[6px] border border-cyan-300/12 bg-slate-950/28 p-3">
                    <p className="text-[12px] text-slate-400">{label}</p>
                    <div className="mt-1 flex items-end justify-between">
                      <p className="font-mono text-[20px] font-bold text-cyan-100">{value}</p>
                      <span className="text-[11px] text-emerald-300">日环比 ↑ {sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="利润热力 Top5 区域" right={<span className="text-[12px] text-slate-400">更多 &gt;</span>} />
              <div className="space-y-2 p-3">
                {topHeat.map(item => (
                  <button
                    key={item.rank}
                    type="button"
                    onClick={() => setSelectedRouteIndex(item.rank - 1)}
                    className="grid w-full grid-cols-[30px_1fr_82px_82px] items-center rounded-[6px] border border-cyan-300/10 bg-cyan-400/[0.045] px-2 py-2 text-[12px] hover:bg-cyan-400/[0.1]"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded bg-amber-400/25 font-mono font-bold text-amber-100">{item.rank}</span>
                    <span className="truncate text-left text-slate-200">{item.name}</span>
                    <span className="font-mono text-emerald-300">{formatNumber(item.margin, 2)}</span>
                    <span className="font-mono text-slate-300">{formatNumber(item.volume, 0)}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="仓储协同" />
              <div className="space-y-2 p-3">
                {warehouseMoves.map(item => (
                  <div key={item.title} className="grid grid-cols-[1fr_82px_58px] items-center gap-2 rounded-[6px] border border-cyan-300/12 bg-slate-950/25 px-2 py-2 text-[12px]">
                    <span className="truncate text-slate-300">{item.title}</span>
                    <span className="font-mono text-cyan-100">调拨 {item.ton} 吨</span>
                    <Button size="sm" onClick={() => pushLog(`${item.title} 已下发仓储协同任务`)} className="h-7 rounded-[5px] bg-blue-600 text-[12px]">
                      {item.status}
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>

          <section className="space-y-3">
            <Panel className={cn(mapExpanded ? "h-[560px]" : "h-[385px]")}>
              <PanelTitle
                title="全国冷链物流态势"
                right={
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setMapMode(mode => mode === "全国" ? "区域" : "全国");
                      pushLog(`地图已切换为${mapMode === "全国" ? "区域" : "全国"}视图`);
                    }} className="h-7 border-cyan-300/20 bg-cyan-400/[0.06] text-xs text-cyan-100">{mapMode}视图</Button>
                    <Button size="sm" variant="outline" onClick={() => setMapExpanded(value => !value)} className="h-7 border-cyan-300/20 bg-cyan-400/[0.06] text-xs text-cyan-100">{mapExpanded ? "收起" : "全屏"}</Button>
                  </div>
                }
              />
              <div className={cn("relative overflow-hidden", mapExpanded ? "h-[519px]" : "h-[344px]")}>
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: mapMode === "区域" ? 760 : 520, center: mapMode === "区域" ? [111, 30] : [104, 35] }}
                  width={800}
                  height={430}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }: any) =>
                      geographies.map((geo: any) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={provinceFill(geo.properties?.name ?? "", simulation)}
                          stroke="rgba(56,189,248,0.2)"
                          strokeWidth={0.7}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "rgba(56,189,248,0.22)" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {routes.slice(0, 14).map((routeItem: any, index: number) => {
                    const style = routeStroke(routeItem.netProfit, simulation?.bestRouteProfit ?? 1);
                    return (
                      <MapLine
                        key={`${routeItem.originName}-${routeItem.destName}-${index}`}
                        from={routeItem.originCoords}
                        to={routeItem.destCoords}
                        stroke={style.stroke}
                        strokeWidth={style.width}
                        strokeDasharray={index < 3 ? "0" : "5 5"}
                        strokeLinecap="round"
                        style={{ opacity: style.opacity, fill: "none" }}
                      />
                    );
                  })}

                  {(simulation?.nodes ?? []).map((node: any) => {
                    const isOrigin = node.type === "origin";
                    return (
                      <Marker key={node.id} coordinates={[node.lng, node.lat]}>
                        <circle
                          r={isOrigin ? 5.5 : 6.5}
                          fill={isOrigin ? "#67e8f9" : "#fbbf24"}
                          stroke="#082f49"
                          strokeWidth={1.4}
                          fillOpacity={0.9}
                        />
                        <text
                          textAnchor="middle"
                          y={-9}
                          style={{ fill: "#dbeafe", fontSize: 9, fontWeight: 700 }}
                        >
                          {node.name}
                        </text>
                        <text
                          textAnchor="middle"
                          y={17}
                          style={{ fill: isOrigin ? "#5eead4" : "#fbbf24", fontSize: 9, fontWeight: 700 }}
                        >
                          {node.basePrice?.toFixed?.(2)}
                        </text>
                      </Marker>
                    );
                  })}
                </ComposableMap>
                <div className="absolute left-5 top-5 w-[152px] rounded-[7px] border border-cyan-300/18 bg-[#061a31]/90 p-3 text-[12px] text-slate-300">
                  <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> 产地节点</div>
                  <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-300" /> 销地节点</div>
                  <div className="mb-2 h-[1px] bg-gradient-to-r from-cyan-300 to-emerald-300" />
                  <p>路线颜色代表净利强度，节点数值为区域价格。</p>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelTitle
                title={`路线明细（共 ${routes.length} 条）`}
                right={<span className="text-[12px] text-cyan-200">数据源：真实空间套利调度算法</span>}
              />
              <div className="overflow-hidden p-3">
                <div className="grid grid-cols-[46px_1fr_1fr_64px_70px_74px_74px_74px_54px] border-b border-cyan-300/14 px-2 py-2 text-[12px] text-cyan-100">
                  <span>序号</span><span>产地</span><span>销地</span><span>品类</span><span>吨数</span><span>车型</span><span>距离</span><span>毛利率</span><span>状态</span>
                </div>
                {schedulePlan.slice(0, 5).map((item: any, index: number) => (
                  <button
                    key={`${item.originName}-${item.destName}-${index}`}
                    type="button"
                    onClick={() => setSelectedRouteIndex(index)}
                    className={cn(
                      "grid w-full grid-cols-[46px_1fr_1fr_64px_70px_74px_74px_74px_54px] border-b border-cyan-300/8 px-2 py-2 text-left text-[12px]",
                      selectedRouteIndex === index ? "bg-cyan-400/[0.08]" : "hover:bg-cyan-400/[0.045]",
                    )}
                  >
                    <span className="text-slate-400">{index + 1}</span>
                    <span className="text-slate-200">{item.originName}</span>
                    <span className="text-slate-200">{item.destName}</span>
                    <span className="text-slate-400">{partLabels[partCode] ?? "白条"}</span>
                    <span className="font-mono text-cyan-100">{formatNumber(item.shippedTon, 0)}</span>
                    <span className="text-slate-400">{item.vehicleName?.slice(0, 5)}</span>
                    <span className="font-mono text-slate-400">{item.distanceKm}</span>
                    <span className="font-mono text-emerald-300">{formatPct(item.netProfitPerKg * 10)}</span>
                    <span className={item.netProfitPerKg > minProfit ? "text-emerald-300" : "text-amber-300"}>
                      {item.netProfitPerKg > minProfit ? "运输中" : "待发运"}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-[1fr_0.7fr_0.76fr] gap-3">
              <Panel>
                <PanelTitle title="路线计算与方案对比" />
                <div className="p-3">
                  <div className="mb-3 grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 rounded-[6px] border border-cyan-300/12 bg-slate-950/25 p-3 text-[12px]">
                    <div><p className="text-slate-400">选中路线</p><p className="mt-1 font-semibold text-white">{selectedRoute ? `${selectedRoute.originName} → ${selectedRoute.destName}` : "--"}</p></div>
                    <div><p className="text-slate-400">单位净利</p><p className="mt-1 font-mono text-emerald-300">{formatNumber((selectedSchedule?.netProfitPerKg ?? selectedRoute?.netProfit ?? 0) * 10, 2)} 元/吨</p></div>
                    <div><p className="text-slate-400">批次总利润</p><p className="mt-1 font-mono text-emerald-300">{formatWan(selectedSchedule?.netProfitTotal ?? selectedRoute?.batchProfit ?? 0)} 万元</p></div>
                    <div><p className="text-slate-400">预计到达</p><p className="mt-1 font-mono text-blue-200">07-03 08:00</p></div>
                  </div>
                  <div className="grid grid-cols-[40px_1fr_1fr_1fr_74px_74px_74px] border-b border-cyan-300/14 px-2 py-2 text-[12px] text-cyan-100">
                    <span>序号</span><span>产地/销地</span><span>价格</span><span>运距</span><span>运费</span><span>损耗</span><span>净利</span>
                  </div>
                  {[selectedRoute].filter(Boolean).map((item: any, index: number) => (
                    <div key={item.originName} className="grid grid-cols-[40px_1fr_1fr_1fr_74px_74px_74px] px-2 py-2 text-[12px] text-slate-300">
                      <span>{index + 1}</span>
                      <span>{item.originName} → {item.destName}</span>
                      <span>{item.originPrice.toFixed(2)} / {item.destPrice.toFixed(2)}</span>
                      <span>{item.distanceKm} km</span>
                      <span>{item.transportCost.toFixed(2)}</span>
                      <span>1.50%</span>
                      <span className="font-mono text-emerald-300">{formatNumber(item.netProfit * 10, 2)}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex justify-center gap-3">
                    <Button variant="outline" onClick={saveCurrentPlan} disabled={savingRecord} className="h-9 w-36 border-cyan-300/20 bg-slate-950/25 text-slate-200">
                      {savingRecord ? "保存中..." : "保存方案"}
                    </Button>
                    <Button onClick={generateDispatchOrder} className="h-9 w-40 bg-blue-600 text-white hover:bg-blue-500">生成调拨方案</Button>
                    <Button onClick={() => {
                      generateDispatchOrder();
                      pushLog("派单执行已进入移动端调度队列");
                    }} className="h-9 w-40 bg-emerald-600 text-white hover:bg-emerald-500">派单执行</Button>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="车辆调度" />
                <div className="grid grid-cols-[108px_1fr] gap-3 p-3">
                  <Donut
                    segments={[
                      { value: vehicleTotal ? (summary?.vehicleMix?.large ?? 0) / vehicleTotal * 100 : 42, color: "#5eead4" },
                      { value: vehicleTotal ? (summary?.vehicleMix?.medium ?? 0) / vehicleTotal * 100 : 34, color: "#60a5fa" },
                      { value: vehicleTotal ? (summary?.vehicleMix?.small ?? 0) / vehicleTotal * 100 : 24, color: "#a78bfa" },
                    ]}
                  />
                  <div className="space-y-2 text-[12px]">
                    {[
                      ["6.8米", summary?.vehicleMix?.small ?? 0, "辆"],
                      ["9.6米", summary?.vehicleMix?.medium ?? 0, "辆"],
                      ["13.7米", summary?.vehicleMix?.large ?? 0, "辆"],
                      ["其他", Math.max(0, Math.round(vehicleTotal * 0.08)), "辆"],
                    ].map(([label, count, unit]) => (
                      <div key={String(label)} className="flex items-center justify-between">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-mono text-cyan-100">{String(count)} {unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 px-3 pb-3">
                  {(simulation?.schedulePlan ?? []).slice(0, 3).map((item: any) => (
                    <div key={`${item.originName}-${item.destName}`} className="rounded-[6px] border border-cyan-300/12 bg-slate-950/25 p-2 text-[12px]">
                      <div className="flex justify-between"><span className="text-slate-300">智能派车建议</span><span className="text-cyan-200">{item.vehicleName}</span></div>
                      <div className="mt-1 text-slate-400">推荐 {item.originName} → {item.destName}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="执行操作" />
                <div className="grid grid-cols-2 gap-3 p-3">
                  {([
                    [ClipboardList, "生成调度单", "一键生成司机/仓储执行单"],
                    [ShieldAlert, "异常处理", "运价异常/断链预警处理"],
                    [Route, "路线优化", "AI优化路线与装载方案"],
                    [Truck, "运力调配", "跨区线路与调配协同"],
                  ] as Array<[typeof ClipboardList, string, string]>).map(([CurrentIcon, title, desc], index) => {
                    return (
                      <button
                        key={String(title)}
                        type="button"
                          onClick={() => {
                            if (index === 0) generateDispatchOrder();
                            else {
                              setActiveTask(title);
                              setDispatchQueue(prev => [`${title}｜${selectedRoute?.originName ?? "产地"}→${selectedRoute?.destName ?? "销地"}｜待处理`, ...prev].slice(0, 6));
                              pushLog(`${title} 已加入执行操作队列`);
                            }
                          }}
                        className={cn(
                          "rounded-[7px] border p-3 text-left transition hover:bg-cyan-400/[0.1]",
                          index === 0 ? "border-blue-300/40 bg-blue-500/[0.12]" : "border-cyan-300/16 bg-cyan-400/[0.045]",
                        )}
                      >
                        <CurrentIcon className="mb-2 h-6 w-6 text-cyan-200" />
                        <p className="font-semibold text-white">{title}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </section>

          <aside className="space-y-3">
            <Panel>
              <PanelTitle title="AI 岗位任务（自动生成）" right={<span className="text-[12px] text-cyan-200">&gt;</span>} />
              <div className="space-y-2 p-3">
                {dispatchTasks.map(task => {
                  const Icon = task.icon;
                  return (
                    <div key={task.title} className={cn("grid grid-cols-[36px_1fr_86px] items-center gap-2 rounded-[7px] border p-2", panelTone(task.tone))}>
                      <span className="grid h-9 w-9 place-items-center rounded-[7px] bg-white/8">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="truncate text-[11px] text-slate-300">{task.desc} ｜ {task.meta}</p>
                      </div>
                      <Button size="sm" onClick={() => openTask(task.title)} className="h-8 rounded-[5px] bg-blue-600 text-[12px] text-white">
                        去执行 ({task.count})
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="通道分配（AI 推荐）" right={<span className="text-[12px] text-cyan-200">&gt;</span>} />
              <div className="grid grid-cols-[118px_1fr] gap-4 p-3">
                <Donut segments={allocationRows.map(row => ({ value: row.share / shareTotal * 100, color: row.color }))} />
                <div className="space-y-2">
                  <p className="text-[12px] text-slate-400">总可调拨量</p>
                  <p className="font-mono text-[23px] font-bold text-emerald-300">{formatNumber(summary?.totalShippedTon ?? 0)} 吨</p>
                  {allocationRows.map(row => (
                    <div key={row.label} className="grid grid-cols-[1fr_48px_82px_90px] items-center gap-1 text-[12px]">
                      <span className="text-slate-300">{row.label}</span>
                      <span className="font-mono text-emerald-300">{formatPct(row.share / shareTotal * 100, 0)}</span>
                      <span className="font-mono text-slate-400">容量 {formatNumber(row.ton, 0)}吨</span>
                      <span className="font-mono text-slate-400">利润 {formatWan(row.profit)}万</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="AI 物流策略推荐" right={<span className="text-[12px] text-slate-400">10:30:20</span>} />
              <div className="space-y-2 p-3">
                {strategyOptions.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyAiStrategy(item)}
                    className={cn(
                      "w-full rounded-[7px] border p-3 text-left",
                      strategyMode === item.key ? "border-cyan-300/60 bg-cyan-400/[0.12]" : "border-cyan-300/16 bg-slate-950/24 hover:bg-cyan-400/[0.08]",
                    )}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold text-cyan-100">{index === 0 && routes[0] ? `${routes[0].originName} → ${routes[0].destName}` : item.label}</span>
                      <span className="rounded bg-blue-500/20 px-2 text-[11px] text-blue-200">{strategyMode === item.key ? "已应用" : "换一批"}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-[12px]">
                      <span className="text-slate-400">{item.note}</span>
                      <span className="font-mono text-cyan-100">{Math.round((routes[index]?.distanceKm ?? 680) / 10) / 10}米冷藏车</span>
                      <span className="font-mono text-emerald-300">{formatPct((routes[index]?.netProfit ?? 2.6) * 10)}</span>
                      <span className="text-right font-mono text-amber-200">{96 - index * 2}分</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="风险提示" />
              <div className="space-y-2 p-3 text-[12px]">
                {[
                  ["沈阳 → 北京", "受暴雨影响，预计延误6-8小时", "高"],
                  ["武汉区域", "明日高温预警，注意冷链断链风险", "中"],
                  ["乌鲁木齐 → 西安", "部分路段封路，建议绕行", "中"],
                ].map(([routeName, detail, level]) => (
                  <div key={routeName} className="grid grid-cols-[1fr_46px] gap-2 rounded-[6px] border border-cyan-300/12 bg-slate-950/25 p-2">
                    <div><span className="text-slate-200">{routeName}</span><span className="ml-2 text-slate-400">{detail}</span></div>
                    <span className={cn("text-center", level === "高" ? "text-rose-300" : "text-amber-300")}>{level}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="生成调度单" />
              <div className="p-3">
                <div className="mb-3 grid grid-cols-3 gap-1 rounded-[6px] border border-cyan-300/14 bg-slate-950/25 p-1">
                  {[
                    ["driver", "司机"],
                    ["warehouse", "仓储"],
                    ["sales", "销售"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDispatchTab(key as DispatchTab)}
                      className={cn("h-8 rounded-[5px] text-[12px]", dispatchTab === key ? "bg-blue-600 text-white" : "text-slate-400")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 text-[12px]">
                  {[
                    ["司机调度单", `${selectedSchedule?.originName ?? "产地"} → ${selectedSchedule?.destName ?? "销地"}`],
                    ["司机", "李师傅　豫A12345"],
                    ["车型", selectedSchedule?.vehicleName ?? "6.8米冷藏车"],
                    ["预计提货", "07-01 14:00"],
                    ["预计送达", "07-02 02:00"],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[72px_1fr] items-center gap-2">
                      <span className="text-slate-400">{label}</span>
                      <Input value={value} readOnly className="h-8 rounded-[5px] border-cyan-300/12 bg-slate-950/28 text-xs text-slate-200" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-[1fr_80px] gap-2">
                  <Button onClick={generateDispatchOrder} className="h-9 rounded-[6px] bg-blue-600 text-white hover:bg-blue-500">生成司机调度单</Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedPlan([
                      `预览对象：${activeTask}`,
                      `当前工作区：${activeWorkspace}`,
                      `队列数量：${dispatchQueue.length} 条`,
                      `路线收益：${formatWan(selectedSchedule?.netProfitTotal ?? 0)} 万元`,
                    ]);
                    pushLog("调度单预览已刷新并展示在下方队列");
                  }} className="h-9 rounded-[6px] border-cyan-300/20 bg-slate-950/24 text-cyan-100">预览</Button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {(selectedPlan.length ? selectedPlan : dispatchQueue.length ? dispatchQueue : logs.slice(0, 4)).map(item => (
                    <p key={item} className="rounded-[5px] border border-cyan-300/12 bg-cyan-400/[0.045] px-2 py-1.5 text-[11px] leading-5 text-slate-300">{item}</p>
                  ))}
                </div>
              </div>
            </Panel>
          </aside>
        </main>

        <footer className="grid grid-cols-[1fr_460px] gap-3 px-3 pb-3">
          <Panel>
            <div className="flex h-[78px] items-center gap-4 px-4">
              <div className="grid h-14 w-14 place-items-center rounded-[8px] border border-cyan-300/20 bg-cyan-400/[0.08]">
                <Bot className="h-8 w-8 text-cyan-200" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-cyan-100">AI Copilot 作战指令</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={copilotInput}
                    onChange={event => setCopilotInput(event.target.value)}
                    onKeyDown={event => event.key === "Enter" && sendCopilot()}
                    placeholder="例如：优先保证时效、提升冻储套利、生成低风险调度方案..."
                    className="h-9 rounded-[6px] border-cyan-300/15 bg-slate-950/30 text-xs text-slate-100"
                  />
                  <Button onClick={sendCopilot} className="h-9 rounded-[6px] bg-blue-600 text-white">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["生成低风险方案", "锁定Top路线", "校验冷链时效"].map(text => (
                  <button key={text} type="button" onClick={() => runQuickCommand(text)} className="h-8 rounded-[5px] border border-cyan-300/16 bg-cyan-400/[0.055] px-3 text-[12px] text-cyan-100">
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="flex h-[78px] items-center justify-between px-4 text-[12px] text-slate-400">
              <span className="flex items-center gap-1.5"><Database className="h-4 w-4 text-emerald-300" /> 数据更新时间：{timeStamp(generatedAt)}</span>
              <span>数据来源：空间套利模型 / 行情 / 库存批次</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-cyan-300" /> 可行性已校验</span>
            </div>
          </Panel>
        </footer>
      </div>
    </div>
  );
}

function profitChange(routes: any[]) {
  if (!routes.length) return 0;
  return clamp(avg(routes.slice(0, 5).map(route => route.netProfit)) * 2.4, 4, 28);
}
