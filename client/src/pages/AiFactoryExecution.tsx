import { TacticalBackdrop, LiveSignal, useOperationLog } from "@/components/ai/TacticalEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Factory,
  Gauge,
  Layers3,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UsersRound,
  Warehouse,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type FactoryStatus = "正常" | "预警" | "滞后";
type TaskStatus = "待执行" | "执行中" | "待确认" | "已完成";
type TaskFilter = "全部" | "待执行" | "执行中" | "待确认" | "已完成";
type ShiftMode = "day" | "night";
type StrategyMode = "balanced" | "reserve" | "storage" | "oem";

const strategyConfig: Record<
  StrategyMode,
  {
    label: string;
    slaughterMultiplier: number;
    freezeMultiplier: number;
    storageMultiplier: number;
    transportMultiplier: number;
  }
> = {
  balanced: {
    label: "均衡执行",
    slaughterMultiplier: 1.02,
    freezeMultiplier: 1.04,
    storageMultiplier: 0.98,
    transportMultiplier: 1,
  },
  reserve: {
    label: "屠宰补强",
    slaughterMultiplier: 1.12,
    freezeMultiplier: 1.06,
    storageMultiplier: 1,
    transportMultiplier: 1.03,
  },
  storage: {
    label: "冻品储备优先",
    slaughterMultiplier: 0.98,
    freezeMultiplier: 1.18,
    storageMultiplier: 0.92,
    transportMultiplier: 0.96,
  },
  oem: {
    label: "OEM 协同",
    slaughterMultiplier: 0.96,
    freezeMultiplier: 1.08,
    storageMultiplier: 0.95,
    transportMultiplier: 0.94,
  },
};

const namedFactories = [
  { id: "factory-cd", name: "襄阳工厂", short: "襄阳", province: "湖北" },
  { id: "factory-zz", name: "洛阳工厂", short: "洛阳", province: "河南" },
  { id: "factory-jn", name: "徐州工厂", short: "徐州", province: "江苏" },
  { id: "factory-nmg", name: "内蒙古工厂", short: "内蒙古", province: "内蒙古" },
  { id: "factory-sx", name: "山西工厂", short: "山西", province: "山西" },
  { id: "factory-qy", name: "庆阳工厂", short: "庆阳", province: "甘肃" },
  { id: "factory-oem-cd", name: "成都OEM", short: "成都OEM", province: "四川" },
  { id: "factory-oem-cs", name: "长沙OEM", short: "长沙OEM", province: "湖南" },
];

const metricRows = [
  { key: "slaughter", label: "屠宰量（头）", icon: Gauge },
  { key: "split", label: "分割量（头）", icon: PackageCheck },
  { key: "freeze", label: "速冻量（吨）", icon: Warehouse },
  { key: "storage", label: "储备量（吨）", icon: Layers3 },
  { key: "part", label: "部位结构（%）", icon: ClipboardCheck },
  { key: "inventory", label: "库存量（吨）", icon: Warehouse },
  { key: "capacity", label: "库容量（吨）", icon: Factory },
  { key: "storageRate", label: "库容率（%）", icon: ShieldCheck },
] as const;

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPct(value: number, digits = 0) {
  return `${formatNumber(value, digits)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function timeText(value?: number | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value instanceof Date ? value : new Date(value ?? Date.now()));
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-400/30 bg-[#06182f]/92 shadow-[inset_0_1px_0_rgba(125,211,252,0.16),0_0_24px_rgba(14,116,195,0.18)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent_36%,rgba(37,99,235,0.08))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-300/15 px-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        <h2 className="text-[16px] font-semibold tracking-[0.08em] text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "blue",
  suffix,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Factory;
  tone?: "blue" | "green" | "red";
  suffix?: ReactNode;
}) {
  const toneClass =
    tone === "red"
      ? "border-red-400/35 bg-red-500/[0.12] text-red-200"
      : tone === "green"
        ? "border-emerald-400/35 bg-emerald-500/[0.1] text-emerald-200"
        : "border-blue-400/35 bg-blue-500/[0.1] text-blue-200";
  return (
    <Panel className="h-[82px]">
      <div className="flex h-full items-center gap-4 px-4">
        <span className={cn("grid h-12 w-12 place-items-center rounded-full border", toneClass)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-300">{label}</div>
          <div className="mt-1 flex items-end gap-1">
            <span className="font-mono text-[32px] font-black leading-none text-white">{value}</span>
            {unit ? <span className="pb-1 text-sm font-bold text-slate-300">{unit}</span> : null}
          </div>
        </div>
        {suffix ? <div className="ml-auto">{suffix}</div> : null}
      </div>
    </Panel>
  );
}

function MiniSpark({ values, tone }: { values: number[]; tone: FactoryStatus }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => `${index * 10},${34 - (value / max) * 26}`)
    .join(" ");
  const color = tone === "滞后" ? "#f87171" : tone === "预警" ? "#fbbf24" : "#34d399";
  return (
    <svg viewBox="0 0 70 38" className="h-9 w-full overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      <path d={`M0 36 L${points} L70 36Z`} fill={color} opacity="0.12" />
    </svg>
  );
}

function statusTone(status: FactoryStatus) {
  if (status === "滞后") return "border-red-400/45 bg-red-500/[0.12] text-red-200";
  if (status === "预警") return "border-amber-400/45 bg-amber-500/[0.12] text-amber-200";
  return "border-emerald-400/40 bg-emerald-500/[0.1] text-emerald-200";
}

export default function AiFactoryExecutionPage() {
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  const [strategy, setStrategy] = useState<StrategyMode>("balanced");
  const [factoryScope, setFactoryScope] = useState("all");
  const [selectedDate, setSelectedDate] = useState("2026-04-23");
  const [shift, setShift] = useState<ShiftMode>("night");
  const [aiAssistant, setAiAssistant] = useState(true);
  const [selectedFactoryId, setSelectedFactoryId] = useState(namedFactories[0]!.id);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("全部");
  const [command, setCommand] = useState("");
  const [taskOverrides, setTaskOverrides] = useState<Record<string, TaskStatus>>({});
  const [factoryBoosts, setFactoryBoosts] = useState<Record<string, number>>({});
  const [collabNotes, setCollabNotes] = useState<string[]>([]);
  const { logs, pushLog } = useOperationLog([
    "AI 工厂协同引擎已接入排产、速冻、库存、OEM 与派单回执。",
    "执行矩阵按真实优化模型输出折算，等待作战指令。",
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStrategy = strategyConfig[strategy];
  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data: optimization, isLoading } = trpc.platform.globalOptimizationSimulate.useQuery({
    tuning: {
      slaughterCapacityMultiplier: activeStrategy.slaughterMultiplier,
      splitCapacityMultiplier: activeStrategy.slaughterMultiplier,
      freezeCapacityMultiplier: activeStrategy.freezeMultiplier,
      storageCostMultiplier: activeStrategy.storageMultiplier,
      transportCostMultiplier: activeStrategy.transportMultiplier,
    },
  });
  const selectedBatch = snapshot?.inventoryBatches?.[0];
  const workspaceInput = useMemo(
    () => ({
      batchCode: selectedBatch?.batchCode ?? "CP-PK-240418-A1",
      forecastMonth: 2,
      scenarioMonth: 2,
      targetPrice: 29.4,
      strategy: "balanced" as const,
      basisAdjustment: 0,
      capacityAdjustment: 12,
      demandAdjustment: 10,
    }),
    [selectedBatch?.batchCode],
  );
  const { data: workspace } = trpc.platform.aiDecisionWorkspace.useQuery(workspaceInput);

  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async () => {
      await utils.platform.aiDecisionWorkspace.invalidate(workspaceInput);
      pushLog("工厂执行协同任务已同步到派单工作台");
      toast.success("协同执行单已生成");
    },
    onError: error => toast.error(error.message || "协同执行单生成失败"),
  });

  const output = optimization?.output;
  const input = optimization?.input;
  const summary = output?.summary;

  const factories = useMemo(() => {
    const slaughterByFactory = new Map<string, number>();
    const splitByFactory = new Map<string, number>();
    const freezeByFactory = new Map<string, number>();
    const inventoryByFactory = new Map<string, number>();
    const capacityByFactory = new Map<string, number>();
    const storageCostByFactory = new Map<string, number>();

    output?.pigSalesTable.forEach(row => {
      slaughterByFactory.set(row.factoryId, (slaughterByFactory.get(row.factoryId) ?? 0) + row.salesQty);
    });
    output?.splittingTable.forEach(row => {
      splitByFactory.set(row.factoryId, (splitByFactory.get(row.factoryId) ?? 0) + row.splitKg / 110);
      freezeByFactory.set(row.factoryId, (freezeByFactory.get(row.factoryId) ?? 0) + row.freezeKg / 1000);
    });
    output?.inventoryTable.forEach(row => {
      inventoryByFactory.set(row.factoryId, (inventoryByFactory.get(row.factoryId) ?? 0) + row.inventoryKg / 1000);
    });
    input?.warehouses.forEach(row => {
      if (!row.factoryId) return;
      capacityByFactory.set(row.factoryId, (capacityByFactory.get(row.factoryId) ?? 0) + row.maxStorageKg / 1000);
      storageCostByFactory.set(row.factoryId, row.storageCostRatePerKgDay ?? row.storageCostRate ?? 0);
    });

    const baseSlaughter = Math.max(1, sum(Array.from(slaughterByFactory.values())) / namedFactories.length);
    const baseSplit = Math.max(1, sum(Array.from(splitByFactory.values())) / namedFactories.length);
    const baseFreeze = Math.max(1, sum(Array.from(freezeByFactory.values())) / namedFactories.length);
    const baseInventory = Math.max(1, sum(Array.from(inventoryByFactory.values())) / namedFactories.length);
    const baseCapacity = Math.max(1, sum(Array.from(capacityByFactory.values())) / namedFactories.length);

    return namedFactories.map((factory, index) => {
      const boost = factoryBoosts[factory.id] ?? 0;
      const ownFactor = index < 3 ? 1 : index < 6 ? 0.74 : 0.42;
      const targetSlaughter = Math.round(baseSlaughter * ownFactor * (1 + index * 0.035));
      const actualSlaughter = Math.round((slaughterByFactory.get(factory.id) ?? targetSlaughter * (0.9 - index * 0.015)) * (1 + boost));
      const targetSplit = Math.round(baseSplit * ownFactor * (1 + index * 0.02));
      const actualSplit = Math.round((splitByFactory.get(factory.id) ?? targetSplit * (0.88 - index * 0.012)) * (1 + boost * 0.7));
      const targetFreeze = Math.round(baseFreeze * ownFactor * (1 + index * 0.02));
      const actualFreeze = Math.round((freezeByFactory.get(factory.id) ?? targetFreeze * (0.86 - index * 0.01)) * (1 + boost * 0.7));
      const targetStorage = Math.round(targetFreeze * 0.82);
      const actualStorage = Math.round(actualFreeze * (0.76 + index * 0.015));
      const inventory = Math.round(inventoryByFactory.get(factory.id) ?? baseInventory * ownFactor * (1 + index * 0.04));
      const capacity = Math.round(capacityByFactory.get(factory.id) ?? baseCapacity * ownFactor * (1 + index * 0.035));
      const storageRate = clamp((inventory / Math.max(capacity, 1)) * 100, 38, 98);
      const executionRate = clamp((actualSlaughter / Math.max(targetSlaughter, 1)) * 100, 45, 108);
      const status: FactoryStatus = executionRate < 70 ? "滞后" : executionRate < 90 || storageRate > 85 ? "预警" : "正常";
      const spark = [72, 76, 70, 83, 79, 88, executionRate].map((value, sparkIndex) =>
        clamp(value + index * 2 - sparkIndex + boost * 40, 35, 108),
      );

      return {
        ...factory,
        status,
        executionRate,
        storageRate,
        spark,
        metrics: {
          slaughter: { target: targetSlaughter, actual: actualSlaughter, rate: executionRate },
          split: { target: targetSplit, actual: actualSplit, rate: clamp((actualSplit / Math.max(targetSplit, 1)) * 100, 45, 108) },
          freeze: { target: targetFreeze, actual: actualFreeze, rate: clamp((actualFreeze / Math.max(targetFreeze, 1)) * 100, 45, 108) },
          storage: { target: targetStorage, actual: actualStorage, rate: clamp((actualStorage / Math.max(targetStorage, 1)) * 100, 45, 108) },
          part: { target: 23, actual: 18 + index, rate: clamp(78 + index * 2, 64, 103) },
          inventory: { target: inventory, actual: Math.round(inventory * (0.92 + index * 0.015)), rate: clamp(storageRate + 8, 64, 106) },
          capacity: { target: capacity, actual: inventory, rate: storageRate },
          storageRate: { target: 85, actual: storageRate, rate: storageRate },
        },
      };
    });
  }, [factoryBoosts, input?.warehouses, output?.inventoryTable, output?.pigSalesTable, output?.splittingTable]);

  const visibleFactories =
    factoryScope === "all"
      ? factories
      : factories.filter(factory => factory.id === factoryScope || factory.name.includes(factoryScope));
  const selectedFactory = factories.find(factory => factory.id === selectedFactoryId) ?? factories[0];
  const highestStorageFactory = [...factories].sort((a, b) => b.storageRate - a.storageRate)[0];
  const abnormalFactories = factories.filter(factory => factory.status === "滞后").length;
  const warningFactories = factories.filter(factory => factory.status === "预警").length;
  const avgExecutionRate = factories.length ? sum(factories.map(factory => factory.executionRate)) / factories.length : 0;
  const daySlaughterTarget = Math.round((summary?.totalSlaughterCount ?? 145620) / 30);
  const dayStorageTarget = Math.round((summary?.totalFreezeKg ?? 11_070_000) / 30 / 1000);
  const totalStorageTarget = (summary?.totalFreezeKg ?? 31_000_000) / 10_000_000;

  const baseTasks = useMemo(() => {
    const lagging = [...factories].sort((a, b) => a.executionRate - b.executionRate);
    const highStorage = [...factories].sort((a, b) => b.storageRate - a.storageRate);
    return [
      {
        id: "task-1",
        priority: "高",
        title: `提升${highStorage[0]?.short ?? "内蒙古"}工厂储备占比`,
        factory: highStorage[0]?.name ?? "内蒙古工厂",
        target: `储备量提升 ${Math.max(8, Math.round(dayStorageTarget * 0.03))} 吨/天，达成率 > 95%`,
        deadline: "04-24 08:00",
        owner: "王经理",
        status: "待执行" as TaskStatus,
      },
      {
        id: "task-2",
        priority: "高",
        title: `${lagging[0]?.short ?? "山西"}工厂出库加速与调拨`,
        factory: lagging[0]?.name ?? "山西工厂",
        target: "库容率降至 <= 45%，调拨 > 15 吨",
        deadline: "04-24 06:00",
        owner: "李经理",
        status: "执行中" as TaskStatus,
      },
      {
        id: "task-3",
        priority: "中",
        title: "成都OEM 产能补位协同",
        factory: "成都OEM / 长沙OEM",
        target: "补位产能 > 10 吨/天",
        deadline: "04-24 06:00",
        owner: "张经理",
        status: "待确认" as TaskStatus,
      },
      {
        id: "task-4",
        priority: "中",
        title: "徐州工厂速冻产能提升",
        factory: "徐州工厂",
        target: "速冻量 > 62 吨/天",
        deadline: "04-24 07:00",
        owner: "赵经理",
        status: "执行中" as TaskStatus,
      },
      {
        id: "task-5",
        priority: "低",
        title: "庆阳工厂班次优化",
        factory: "庆阳工厂",
        target: "夜班效率提升 > 8%",
        deadline: "04-24 06:00",
        owner: "刘经理",
        status: "待执行" as TaskStatus,
      },
    ].map(task => ({ ...task, status: taskOverrides[task.id] ?? task.status }));
  }, [dayStorageTarget, factories, taskOverrides]);

  const taskCounts = {
    全部: baseTasks.length,
    待执行: baseTasks.filter(task => task.status === "待执行").length,
    执行中: baseTasks.filter(task => task.status === "执行中").length,
    待确认: baseTasks.filter(task => task.status === "待确认").length,
    已完成: baseTasks.filter(task => task.status === "已完成").length,
  };
  const filteredTasks = baseTasks.filter(task => taskFilter === "全部" || task.status === taskFilter);

  const applyStrategy = (next: StrategyMode, note: string) => {
    setStrategy(next);
    pushLog(note);
    toast.success(note);
  };

  const changeTaskStatus = (taskId: string, status: TaskStatus) => {
    setTaskOverrides(prev => ({ ...prev, [taskId]: status }));
    const task = baseTasks.find(item => item.id === taskId);
    pushLog(`${task?.title ?? "任务"} 状态更新为 ${status}`);
    toast.success("任务状态已更新");
  };

  const boostFactory = (factoryId: string, amount = 0.08) => {
    const factory = factories.find(item => item.id === factoryId);
    setFactoryBoosts(prev => ({
      ...prev,
      [factoryId]: clamp((prev[factoryId] ?? 0) + amount, 0, 0.24),
    }));
    setSelectedFactoryId(factoryId);
    pushLog(`${factory?.name ?? "工厂"} 已加入产能提升模拟`);
    toast.success("工厂执行参数已调整");
  };

  const createDispatchPlan = () => {
    persistDispatch.mutate({
      batchCode: selectedBatch?.batchCode ?? "CP-PK-240418-A1",
      selectedMonth: 2,
      targetPrice: 29.4,
      capacityAdjustment: Math.round((activeStrategy.freezeMultiplier - 1) * 100),
      demandAdjustment: Math.round((activeStrategy.slaughterMultiplier - 1) * 100),
    });
  };

  const runCollabAction = (title: string) => {
    const note = `${timeText()} ${title}：${selectedFactory?.name ?? "当前工厂"} / ${activeStrategy.label}`;
    setCollabNotes(prev => [note, ...prev].slice(0, 6));
    if (title.includes("跨工厂")) boostFactory(selectedFactory?.id ?? factories[0]!.id, 0.06);
    if (title.includes("班次")) setShift(value => (value === "night" ? "day" : "night"));
    if (title.includes("利润")) applyStrategy("storage", "AI 已切换为冻品储备优先策略");
    if (title.includes("冷库")) applyStrategy("oem", "AI 已切换为 OEM + 外部冷库协同策略");
    toast.success("协同动作已执行");
  };

  const sendCommand = (preset?: string) => {
    const text = (preset ?? command).trim();
    if (!text) return;
    if (text.includes("内蒙古")) boostFactory("factory-nmg", 0.1);
    else if (text.includes("山西")) boostFactory("factory-sx", 0.08);
    else if (text.toUpperCase().includes("OEM")) applyStrategy("oem", "AI 已下发 OEM 补位协同模拟");
    else if (text.includes("储备")) applyStrategy("storage", "AI 已提高冻品储备与库容优化权重");
    else if (text.includes("执行计划")) createDispatchPlan();
    const reply = `AI：已解析「${text}」。当前执行达成率 ${formatPct(avgExecutionRate, 1)}，异常工厂 ${abnormalFactories} 家，建议优先处理 ${selectedFactory?.name ?? "滞后工厂"} 并同步 OEM/冷库协同。`;
    setCollabNotes(prev => [`${timeText()} ${reply}`, ...prev].slice(0, 6));
    pushLog(`作战指令：${text}`);
    setCommand("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020b18] text-slate-100">
      <TacticalBackdrop intensity="normal" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.26),transparent_30%),linear-gradient(180deg,#03101f,#020b18_60%,#020814)]" />
      <div className="relative z-10 mx-auto flex min-h-screen min-w-[1440px] max-w-[1920px] flex-col p-1.5">
        <header className="grid h-[64px] grid-cols-[1fr,auto,1fr] items-center rounded-[8px] border border-cyan-400/15 bg-[#031123]/92 px-3">
          <div className="flex items-center gap-4">
            <button className="flex h-10 items-center gap-2 rounded-[6px] border border-cyan-400/25 bg-slate-950/35 px-3 text-sm text-slate-200">
              <MapPin className="h-4 w-4" />
              四川眉山
              <ChevronDown className="h-4 w-4 text-amber-300" />
            </button>
            <LiveSignal label="正常运行" />
          </div>
          <div className="text-center">
            <h1 className="text-[30px] font-black tracking-[0.16em] text-white drop-shadow-[0_0_16px_rgba(125,211,252,.35)]">
              工厂执行与协同页面
            </h1>
            <p className="mt-1 text-xs tracking-[0.38em] text-cyan-100/70">
              冻品储备AI作战系统 / 决策建议 / 工厂执行
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Select value={factoryScope} onValueChange={setFactoryScope}>
              <SelectTrigger className="h-9 w-[142px] rounded-[6px] border-cyan-400/20 bg-slate-950/35 text-xs text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部工厂（8家）</SelectItem>
                {factories.map(factory => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="h-9 w-[142px] rounded-[6px] border-cyan-400/20 bg-slate-950/35 text-xs text-slate-200">
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-04-23">2026-04-23</SelectItem>
                <SelectItem value="2026-04-24">2026-04-24</SelectItem>
                <SelectItem value="2026-04-25">2026-04-25</SelectItem>
              </SelectContent>
            </Select>
            <Select value={shift} onValueChange={value => setShift(value as ShiftMode)}>
              <SelectTrigger className="h-9 w-[156px] rounded-[6px] border-cyan-400/20 bg-slate-950/35 text-xs text-slate-200">
                <Clock3 className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">白班（08:00-20:00）</SelectItem>
                <SelectItem value="night">夜班（22:00-06:00）</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setAiAssistant(value => !value)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-[6px] border px-3 text-xs font-semibold",
                aiAssistant ? "border-blue-300/35 bg-blue-600/30 text-blue-100" : "border-slate-600/35 bg-slate-900/50 text-slate-400",
              )}
            >
              AI协同指挥
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">{aiAssistant ? "ON" : "OFF"}</span>
            </button>
          </div>
        </header>

        <section className="grid grid-cols-6 gap-2 py-2">
          <KpiCard label="覆盖工厂" value={String(factories.length)} unit="家" icon={Factory} />
          <KpiCard label="当日屠宰目标" value={formatNumber(daySlaughterTarget)} unit="头/天" icon={PackageCheck} />
          <KpiCard label="当日储备目标" value={formatNumber(dayStorageTarget)} unit="吨/天" icon={Warehouse} />
          <KpiCard label="累计总储备目标" value={formatNumber(totalStorageTarget, 1)} unit="万吨" icon={Layers3} />
          <KpiCard
            label="当前执行达成率"
            value={formatNumber(avgExecutionRate, 0)}
            unit="%"
            icon={Gauge}
            tone="green"
            suffix={<div className="h-12 w-12 rounded-full border-4 border-emerald-400/80 border-l-emerald-400/10" />}
          />
          <KpiCard label="异常工厂" value={String(abnormalFactories)} unit="家" icon={AlertTriangle} tone="red" />
        </section>

        <main className="grid flex-1 grid-cols-[1fr,0.39fr] gap-2 overflow-hidden">
          <section className="grid min-h-0 grid-rows-[1fr,124px,216px] gap-2">
            <Panel className="min-h-0">
              <PanelTitle
                title="工厂执行矩阵"
                right={
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-200" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                    <button onClick={() => pushLog("执行矩阵已按最新优化结果刷新")} className="text-cyan-200">
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                }
              />
              <div className="h-[calc(100%-40px)] overflow-auto p-2">
                <div
                  className="grid min-w-[1100px] border-b border-cyan-400/18 text-xs text-cyan-100"
                  style={{ gridTemplateColumns: `132px 150px repeat(${visibleFactories.length}, minmax(118px, 1fr))` }}
                >
                  <div className="border-r border-cyan-400/12 px-3 py-2">指标</div>
                  <div className="border-r border-cyan-400/12 px-3 py-2">工厂</div>
                  {visibleFactories.map(factory => (
                    <button
                      key={factory.id}
                      onClick={() => setSelectedFactoryId(factory.id)}
                      className={cn(
                        "border-r border-cyan-400/12 px-3 py-2 text-center font-semibold",
                        selectedFactoryId === factory.id && "bg-cyan-400/[0.12] text-white",
                      )}
                    >
                      {factory.name}
                    </button>
                  ))}
                </div>
                {metricRows.map(row => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.key}
                      className="grid min-w-[1100px] border-b border-cyan-400/10 text-xs"
                      style={{ gridTemplateColumns: `132px 150px repeat(${visibleFactories.length}, minmax(118px, 1fr))` }}
                    >
                      <div className="flex items-center gap-2 border-r border-cyan-400/12 px-3 py-2 text-slate-200">
                        <Icon className="h-4 w-4 text-cyan-200" />
                        {row.label}
                      </div>
                      <div className="border-r border-cyan-400/12 px-3 py-2 text-slate-400">
                        当日目标 / 实际 / 达成率
                      </div>
                      {visibleFactories.map(factory => {
                        const metric = factory.metrics[row.key];
                        const rateTone =
                          metric.rate < 70
                            ? "text-red-300"
                            : metric.rate < 90
                              ? "text-amber-300"
                              : "text-emerald-300";
                        return (
                          <button
                            key={`${factory.id}-${row.key}`}
                            onClick={() => {
                              setSelectedFactoryId(factory.id);
                              pushLog(`${factory.name} ${row.label} 已载入详情`);
                            }}
                            className="grid grid-cols-[1fr,42px] items-center gap-1 border-r border-cyan-400/8 px-2 py-2 text-left hover:bg-cyan-400/[0.05]"
                          >
                            <span className="font-mono text-slate-300">
                              {formatNumber(metric.target)} / {formatNumber(metric.actual)}
                            </span>
                            <span className={cn("text-right font-mono font-bold", rateTone)}>
                              {formatPct(metric.rate)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                <div className="mt-2 flex justify-center gap-8 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> 达成率 &gt;=90%</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> 70%≤达成率&lt;90%</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> 达成率&lt;70%</span>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-8 gap-2">
              {factories.map(factory => (
                <button
                  key={factory.id}
                  onClick={() => setSelectedFactoryId(factory.id)}
                  className={cn(
                    "rounded-[8px] border bg-[#06182f]/92 p-2 text-left transition hover:bg-cyan-400/[0.08]",
                    statusTone(factory.status),
                    selectedFactoryId === factory.id && "ring-1 ring-cyan-200/70",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{factory.name}</span>
                    <span className="rounded-[5px] bg-black/20 px-2 text-[11px]">{factory.status}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-2 text-[11px] text-slate-300">
                    <span>屠宰 {formatNumber(factory.metrics.slaughter.actual)} 头/天</span>
                    <span>达成 {formatPct(factory.executionRate)}</span>
                    <span>储备 {formatNumber(factory.metrics.storage.actual)} 吨/天</span>
                    <span>库容 {formatPct(factory.storageRate, 1)}</span>
                  </div>
                  <MiniSpark values={factory.spark} tone={factory.status} />
                </button>
              ))}
            </div>

            <Panel>
              <PanelTitle
                title={`今日执行任务（${baseTasks.length}）`}
                right={
                  <div className="flex gap-1">
                    {(Object.keys(taskCounts) as TaskFilter[]).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setTaskFilter(filter)}
                        className={cn(
                          "h-7 rounded-[5px] border px-3 text-xs",
                          taskFilter === filter ? "border-blue-300/60 bg-blue-600 text-white" : "border-cyan-300/15 bg-cyan-400/[0.055] text-cyan-100",
                        )}
                      >
                        {filter} {taskCounts[filter]}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="h-[calc(100%-40px)] overflow-auto p-2">
                <div className="grid grid-cols-[62px,1.3fr,0.8fr,1.15fr,92px,82px,82px,96px] border-b border-cyan-400/15 px-3 py-2 text-xs text-cyan-100">
                  <span>优先级</span><span>任务内容</span><span>涉及工厂</span><span>目标/要求</span><span>截止时间</span><span>责任人</span><span>状态</span><span>操作</span>
                </div>
                {filteredTasks.map(task => (
                  <div key={task.id} className="grid grid-cols-[62px,1.3fr,0.8fr,1.15fr,92px,82px,82px,96px] items-center border-b border-cyan-400/8 px-3 py-2 text-xs text-slate-300">
                    <span className={cn("w-fit rounded-[5px] px-2 py-1 font-bold", task.priority === "高" ? "bg-red-500/20 text-red-200" : task.priority === "中" ? "bg-amber-500/20 text-amber-200" : "bg-slate-500/20 text-slate-300")}>
                      {task.priority}
                    </span>
                    <span className="font-semibold text-white">{task.title}</span>
                    <span>{task.factory}</span>
                    <span>{task.target}</span>
                    <span>{task.deadline}</span>
                    <span>{task.owner}</span>
                    <span className={cn("w-fit rounded-[5px] px-2 py-1", task.status === "执行中" ? "bg-amber-500/20 text-amber-200" : task.status === "已完成" ? "bg-emerald-500/20 text-emerald-200" : "bg-blue-500/20 text-blue-200")}>
                      {task.status}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => changeTaskStatus(task.id, "执行中")} className="rounded bg-blue-600 px-2 py-1 text-white">执行</button>
                      <button onClick={() => changeTaskStatus(task.id, "已完成")} className="rounded bg-cyan-700 px-2 py-1 text-white">确认</button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <aside className="grid min-h-0 grid-rows-[244px,196px,1fr] gap-2">
            <Panel>
              <PanelTitle
                title="AI 协同建议"
                right={<span className="flex items-center gap-2 text-xs text-slate-400">更新时间：{timeText(now)} <button onClick={() => pushLog("AI 协同建议已刷新")}><RefreshCcw className="h-3.5 w-3.5 text-cyan-200" /></button></span>}
              />
              <div className="space-y-2 p-3 text-sm">
                {[
                  {
                    title: `${selectedFactory?.short ?? "内蒙古"}提升建议`,
                    body: `${selectedFactory?.name ?? "当前工厂"} 达成率 ${formatPct(selectedFactory?.executionRate ?? 0, 1)}，建议增加储备量 +80~120 头/天。`,
                    tone: "green",
                    action: () => selectedFactory && boostFactory(selectedFactory.id, 0.08),
                    label: "立即调整",
                  },
                  {
                    title: "库容压力预警",
                    body: `${highestStorageFactory?.name ?? "山西工厂"} 库容率偏高，建议加快出库或调拨至其它工厂。`,
                    tone: "amber",
                    action: () => applyStrategy("storage", "AI 已切换为冻品储备优先并压降库容风险"),
                    label: "查看方案",
                  },
                  {
                    title: "OEM 补位建议",
                    body: `成都OEM 达成率 ${formatPct(factories.find(f => f.id === "factory-oem-cd")?.executionRate ?? 80)}，建议由长沙OEM补位支援 10-15 吨/天。`,
                    tone: "blue",
                    action: () => applyStrategy("oem", "OEM 补位策略已应用"),
                    label: "一键协同",
                  },
                ].map(item => (
                  <div key={item.title} className={cn("grid grid-cols-[32px,1fr,88px] items-center gap-2 rounded-[8px] border p-3", item.tone === "green" ? "border-emerald-400/20 bg-emerald-500/[0.07]" : item.tone === "amber" ? "border-amber-400/25 bg-amber-500/[0.08]" : "border-blue-400/25 bg-blue-500/[0.08]")}>
                    {item.tone === "green" ? <Sparkles className="h-5 w-5 text-emerald-300" /> : item.tone === "amber" ? <AlertTriangle className="h-5 w-5 text-amber-300" /> : <Bot className="h-5 w-5 text-blue-300" />}
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-300">{item.body}</div>
                    </div>
                    <Button onClick={item.action} className="h-8 rounded-[5px] bg-blue-600 text-xs text-white hover:bg-blue-500">{item.label}</Button>
                  </div>
                ))}
                <button onClick={() => setCollabNotes(prev => ["完整建议报告已生成：工厂执行、OEM补位、冷库协同、任务闭环已联动。", ...prev])} className="w-full rounded-[6px] border border-cyan-300/15 bg-slate-950/20 py-2 text-xs text-cyan-100">
                  查看完整建议报告
                </button>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="协同动作" right={<span className="text-xs text-slate-400">跨工厂协同与资源调度</span>} />
              <div className="grid grid-cols-2 gap-2 p-3">
                {[
                  ["跨工厂支援", "调拨产品/释放人力支援", UsersRound],
                  ["班次调整", "弹性调班与夜班排产", Clock3],
                  ["产线利润度", "平均利润率校验", Zap],
                  ["冷库可用率", "全网平均库容率", Warehouse],
                ].map(([title, desc, Icon]) => (
                  <button
                    key={String(title)}
                    onClick={() => runCollabAction(String(title))}
                    className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/[0.1]"
                  >
                    <Icon className="mb-2 h-5 w-5 text-cyan-200" />
                    <div className="font-semibold text-white">{title as string}</div>
                    <div className="mt-1 text-xs text-slate-400">{desc as string}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 pb-3 text-xs">
                <div className="rounded-[7px] border border-amber-300/15 bg-amber-400/[0.06] p-2">
                  平均利润率 <span className="font-mono text-amber-200">{formatPct(summary?.profitMargin ?? 0, 1)}</span>
                  <div className="mt-2 h-1.5 rounded bg-slate-900"><span className="block h-full rounded bg-amber-300" style={{ width: `${clamp((summary?.profitMargin ?? 18) * 4, 6, 100)}%` }} /></div>
                </div>
                <div className="rounded-[7px] border border-blue-300/15 bg-blue-400/[0.06] p-2">
                  全网平均库容率 <span className="font-mono text-blue-200">{formatPct(sum(factories.map(f => f.storageRate)) / factories.length, 1)}</span>
                  <div className="mt-2 h-1.5 rounded bg-slate-900"><span className="block h-full rounded bg-blue-300" style={{ width: `${clamp(sum(factories.map(f => f.storageRate)) / factories.length, 6, 100)}%` }} /></div>
                </div>
              </div>
            </Panel>

            <Panel className="min-h-0">
              <PanelTitle title="给 AI 下达协同指令" right={<span className="text-xs text-slate-400">AI 将生成执行方案并联动执行</span>} />
              <div className="flex h-[calc(100%-40px)] flex-col p-3">
                <Input
                  value={command}
                  onChange={event => setCommand(event.target.value)}
                  onKeyDown={event => event.key === "Enter" && sendCommand()}
                  placeholder="请输入您的协同指令，例如：提升内蒙古工厂储备占比 10%"
                  className="h-12 rounded-[7px] border-cyan-400/20 bg-slate-950/35 text-slate-100"
                />
                <div className="mt-2 flex justify-end">
                  <Button onClick={() => sendCommand()} className="h-10 w-36 rounded-[6px] bg-blue-600 text-white hover:bg-blue-500">
                    <Send className="mr-2 h-4 w-4" />
                    发送指令
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    "提升内蒙古工厂储备占比",
                    "让成都OEM补足产能缺口",
                    "查看襄阳工厂滞后原因",
                    "山西工厂出库加速方案",
                    "优化全网储备结构",
                    "生成协同执行计划",
                  ].map(item => (
                    <button key={item} onClick={() => sendCommand(item)} className="rounded-[6px] border border-cyan-300/15 bg-cyan-400/[0.055] px-2 py-2 text-xs text-cyan-100 hover:bg-cyan-400/[0.1]">
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex-1 space-y-2 overflow-auto">
                  {(collabNotes.length ? collabNotes : logs).slice(0, 7).map(item => (
                    <div key={item} className="rounded-[7px] border border-cyan-300/12 bg-slate-950/26 px-3 py-2 text-xs leading-5 text-slate-300">
                      {item}
                    </div>
                  ))}
                  {workspace?.dispatchBoard.workOrders.slice(0, 2).map(order => (
                    <div key={order.orderId} className="rounded-[7px] border border-emerald-300/12 bg-emerald-400/[0.055] px-3 py-2 text-xs leading-5 text-emerald-100">
                      已连接派单：{order.orderId} / {order.operationRequirement}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </aside>
        </main>

        <footer className="mt-2 flex h-7 items-center justify-between rounded-[6px] border border-cyan-400/15 bg-slate-950/30 px-3 text-xs text-slate-400">
          <span>数据来源：全局优化模型 / 库存快照 / AI决策工作台 / 派单回执</span>
          <span>当前策略：{activeStrategy.label} / 预警 {warningFactories} 家 / 异常 {abnormalFactories} 家</span>
        </footer>
      </div>
    </div>
  );
}
