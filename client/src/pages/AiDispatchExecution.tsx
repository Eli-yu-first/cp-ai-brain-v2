import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TacticalBackdrop, useOperationLog } from "@/components/ai/TacticalEffects";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  DatabaseZap,
  FileText,
  Headphones,
  LineChart,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  Mic,
  PackageCheck,
  PhoneCall,
  Radar,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Target,
  Truck,
  UserRound,
  UsersRound,
  Vault,
  Warehouse,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type DispatchStatus = "待确认" | "已接单" | "执行中" | "已完成" | "超时升级";
type RoleName = "厂长" | "司机" | "仓储管理员";
type ScenarioKey = "baseline" | "speed" | "capital" | "risk";
type ChatTab = "全部" | "仓储协同" | "资金协同" | "系统通知";

const scenarioMeta: Record<
  ScenarioKey,
  {
    name: string;
    label: string;
    targetDelta: number;
    capacityDelta: number;
    demandDelta: number;
    capitalFactor: number;
  }
> = {
  baseline: {
    name: "均衡协同",
    label: "仓储与资金并行",
    targetDelta: 0,
    capacityDelta: 12,
    demandDelta: 10,
    capitalFactor: 1,
  },
  speed: {
    name: "优先补库",
    label: "48小时锁库",
    targetDelta: -0.3,
    capacityDelta: 22,
    demandDelta: 6,
    capitalFactor: 0.92,
  },
  capital: {
    name: "资金优先",
    label: "分批融资压降缺口",
    targetDelta: -0.6,
    capacityDelta: 7,
    demandDelta: 4,
    capitalFactor: 0.82,
  },
  risk: {
    name: "风险压降",
    label: "先锁定高确定性节点",
    targetDelta: -0.15,
    capacityDelta: 4,
    demandDelta: -3,
    capitalFactor: 0.74,
  },
};

const regionRows = [
  { name: "成都区域", ratio: 1, x: 26, y: 58 },
  { name: "华东区域", ratio: 0.7, x: 73, y: 51 },
  { name: "华南区域", ratio: 0.53, x: 61, y: 75 },
  { name: "华中区域", ratio: 0.29, x: 55, y: 61 },
  { name: "西南区域", ratio: 0.13, x: 38, y: 72 },
];

function formatTime(value: number | Date | undefined) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function moneyYi(value: number) {
  return value / 100_000_000;
}

function tons(valueKg: number) {
  return valueKg / 1000;
}

function Panel({
  children,
  className,
  tone = "blue",
}: {
  children: ReactNode;
  className?: string;
  tone?: "blue" | "red" | "green";
}) {
  const border =
    tone === "red"
      ? "border-red-400/45 shadow-[inset_0_1px_0_rgba(248,113,113,0.18),0_0_26px_rgba(127,29,29,0.26)]"
      : tone === "green"
        ? "border-emerald-400/35 shadow-[inset_0_1px_0_rgba(52,211,153,0.18),0_0_26px_rgba(6,95,70,0.22)]"
        : "border-cyan-400/30 shadow-[inset_0_1px_0_rgba(103,232,249,0.18),0_0_26px_rgba(14,116,195,0.22)]";
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border bg-[#06182f]/90",
        border,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.08),transparent_38%,rgba(37,99,235,0.08))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-200/40" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({
  title,
  icon: Icon = Workflow,
  right,
}: {
  title: string;
  icon?: typeof Workflow;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-400/15 px-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-200" />
        <h2 className="text-[17px] font-bold tracking-wide text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  icon: typeof Warehouse;
  tone: "red" | "blue" | "green";
}) {
  const colors =
    tone === "red"
      ? "border-red-400/45 bg-red-500/[0.12] text-red-200"
      : tone === "green"
        ? "border-emerald-400/40 bg-emerald-500/[0.12] text-emerald-200"
        : "border-blue-400/40 bg-blue-500/[0.12] text-blue-200";
  return (
    <Panel tone={tone} className="h-[82px]">
      <div className="flex h-full items-center gap-4 px-4">
        <span className={cn("grid h-12 w-12 place-items-center rounded-full border", colors)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-300">{label}</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[34px] font-black leading-none tracking-wide text-white">{value}</span>
            {unit ? <span className="pb-1 text-sm font-bold text-slate-200">{unit}</span> : null}
          </div>
        </div>
        {delta ? <div className="ml-auto self-end pb-3 text-xs text-slate-400">{delta}</div> : null}
      </div>
    </Panel>
  );
}

function RingGauge({
  value,
  center,
  label,
}: {
  value: number;
  center: string;
  label: string;
}) {
  return (
    <div className="grid place-items-center">
      <div
        className="grid h-[112px] w-[112px] place-items-center rounded-full"
        style={{
          background: `conic-gradient(#1d4ed8 0 ${value}%, #22d3ee ${value}% ${Math.min(100, value + 9)}%, rgba(15,23,42,.82) ${Math.min(100, value + 9)}% 100%)`,
        }}
      >
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-cyan-300/20 bg-[#06182f] text-center">
          <div>
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className="text-lg font-black text-white">{center}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="grid grid-cols-[74px,1fr,42px] items-center gap-2 text-xs">
      <span className="truncate text-slate-300">{label}</span>
      <span className="h-2 rounded-full bg-blue-950">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
          style={{ width: `${clamp((value / max) * 100, 4, 100)}%` }}
        />
      </span>
      <span className="text-right font-mono text-cyan-100">{formatNumber(value)}</span>
    </div>
  );
}

function ChinaSignalMap({
  points,
}: {
  points: Array<{ name: string; x: number; y: number; tone: "red" | "green" | "blue"; value: number }>;
}) {
  return (
    <div className="relative h-[216px] overflow-hidden rounded-[8px] border border-cyan-400/15 bg-[#071f3d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_45%,rgba(34,211,238,.22),transparent_22%),linear-gradient(135deg,rgba(14,165,233,.16),transparent_42%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 62" preserveAspectRatio="none">
        <path
          d="M10 24 L21 14 L36 11 L48 18 L58 12 L71 19 L82 30 L77 44 L61 51 L49 47 L36 55 L24 47 L13 42 Z"
          fill="rgba(14,116,195,.24)"
          stroke="rgba(125,211,252,.34)"
          strokeWidth=".7"
        />
        <path d="M25 23 C38 30, 48 25, 61 34 S76 45, 86 39" fill="none" stroke="rgba(34,211,238,.28)" strokeWidth=".45" />
        <path d="M18 41 C35 34, 48 38, 69 24" fill="none" stroke="rgba(59,130,246,.38)" strokeWidth=".55" />
      </svg>
      {points.map(point => (
        <button
          key={point.name}
          title={`${point.name} ${formatNumber(point.value)}吨`}
          className={cn(
            "absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[11px] font-black shadow-[0_0_18px_currentColor]",
            point.tone === "red"
              ? "border-red-200 bg-red-500 text-white"
              : point.tone === "green"
                ? "border-emerald-200 bg-emerald-500 text-white"
                : "border-cyan-200 bg-blue-500 text-white"
          )}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          onClick={() => toast.info(`${point.name} 缺口 ${formatNumber(point.value)} 吨，已载入仓储协同列表。`)}
        >
          {point.tone === "red" ? "!" : "✓"}
        </button>
      ))}
      <div className="absolute bottom-2 left-2 rounded-[6px] border border-cyan-400/15 bg-slate-950/50 px-2 py-1 text-[11px] text-cyan-100">
        实时仓储缺口热力 / 基于库存批次与优化模型推导
      </div>
    </div>
  );
}

function FundingLine({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = 10 + index * 38;
      const y = 82 - (value / max) * 58;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="h-[142px] w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {[20, 40, 60, 80].map(y => (
        <line key={y} x1="8" x2="96" y1={y} y2={y} stroke="rgba(125,211,252,.12)" strokeWidth=".5" />
      ))}
      <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.8" />
      {values.map((value, index) => {
        const x = 10 + index * 38;
        const y = 82 - (value / max) * 58;
        return (
          <g key={`${value}-${index}`}>
            <circle cx={x} cy={y} r="2.3" fill="#22d3ee" />
            <text x={x} y={y - 7} fill="#e0f2fe" fontSize="6" textAnchor="middle">
              {formatNumber(value, 1)}
            </text>
            <text x={x} y="96" fill="#94a3b8" fontSize="5.5" textAnchor="middle">
              2026-0{5 + index}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AiDispatchExecutionPage() {
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [scenario, setScenario] = useState<ScenarioKey>("baseline");
  const [targetPrice, setTargetPrice] = useState(29.4);
  const [scenarioMonth, setScenarioMonth] = useState(2);
  const [chatInput, setChatInput] = useState("");
  const [regionFilter, setRegionFilter] = useState("全国");
  const [warehouseType, setWarehouseType] = useState("冷库");
  const [fundWindow, setFundWindow] = useState("2026年5月-7月");
  const [selectedColdStoreId, setSelectedColdStoreId] = useState("A");
  const [activeChatTab, setActiveChatTab] = useState<ChatTab>("全部");
  const [appliedPlan, setAppliedPlan] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [assistRequests, setAssistRequests] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState([
    "王学斌：资金这边的银行授信进度如何？A、B 库在库时间已经布满。",
    "冯鑫：我行资料已补齐，预计明天出初审结果；我会同步跟进 A、B 库锁定进度。",
    "李娜：我已发起对 B 库的询价，请尽快确认价格和可用周期。",
  ]);
  const { logs, pushLog } = useOperationLog([
    "14:25 眉山临山冷链中心 已发送询价",
    "11:08 成都新希望冷链园 已发送询价",
    "10:12 郑州中冷冷库 锁定库位进行中",
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data: optimization, isLoading: optimizationLoading } =
    trpc.platform.globalOptimizationSimulate.useQuery({
      tuning: {
        slaughterCapacityMultiplier: 1 + scenarioMeta[scenario].capacityDelta / 100,
        splitCapacityMultiplier: 1 + scenarioMeta[scenario].capacityDelta / 120,
        freezeCapacityMultiplier: 1 + scenarioMeta[scenario].capacityDelta / 100,
        livePigPriceAdjustment: scenarioMeta[scenario].targetDelta,
        storageCostMultiplier: scenarioMeta[scenario].capitalFactor,
      },
    });
  const scenarioConfig = scenarioMeta[scenario];
  const capacityAdjustment = scenarioConfig.capacityDelta;
  const demandAdjustment = scenarioConfig.demandDelta;

  useEffect(() => {
    if (!snapshot?.inventoryBatches.length) return;
    if (!snapshot.inventoryBatches.some(item => item.batchCode === batchCode)) {
      setBatchCode(snapshot.inventoryBatches[0]!.batchCode);
    }
  }, [snapshot?.inventoryBatches, batchCode]);

  const workspaceInput = useMemo(
    () => ({
      batchCode,
      forecastMonth: Math.max(1, scenarioMonth),
      scenarioMonth,
      targetPrice: targetPrice + scenarioConfig.targetDelta,
      strategy: "balanced" as const,
      basisAdjustment: 0,
      capacityAdjustment,
      demandAdjustment,
    }),
    [batchCode, capacityAdjustment, demandAdjustment, scenarioConfig.targetDelta, scenarioMonth, targetPrice]
  );
  const dispatchInput = useMemo(
    () => ({
      batchCode,
      selectedMonth: scenarioMonth,
      targetPrice: targetPrice + scenarioConfig.targetDelta,
      capacityAdjustment,
      demandAdjustment,
    }),
    [batchCode, capacityAdjustment, demandAdjustment, scenarioConfig.targetDelta, scenarioMonth, targetPrice]
  );

  const { data: workspace } = trpc.platform.aiDecisionWorkspace.useQuery(workspaceInput);
  const { data: auditLogs } = trpc.platform.auditLogs.useQuery();

  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      pushLog("AI 已生成仓储与资金协同工单，审计链路已同步");
      toast.success("协同工单已生成，仓储与资金责任链已同步。");
    },
    onError: error => toast.error(error.message || "工单创建失败。"),
  });

  const updateReceipt = trpc.platform.updateAiDispatchReceipt.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      const sent = result.notifications.wecom === "sent" || result.notifications.sms === "sent";
      pushLog(sent ? "异常回执触发升级通知" : "现场回执已写入执行链路");
      toast.success(sent ? "回执已更新，升级通知已发出。" : "执行回执已更新。");
    },
    onError: error => toast.error(error.message || "回执更新失败。"),
  });

  const selectedBatch =
    snapshot?.inventoryBatches.find(item => item.batchCode === batchCode) ?? snapshot?.inventoryBatches[0];
  const inventoryBatches = snapshot?.inventoryBatches ?? [];
  const totalInventoryTons = tons(inventoryBatches.reduce((sum, batch) => sum + batch.weightKg, 0));
  const optSummary = optimization?.output.summary;
  const freezeTons = tons(optSummary?.totalFreezeKg ?? totalInventoryTons * 1000);
  const utilization = optSummary?.capacityUtilization ?? workspace?.simulation.summary.utilizationRate ?? 88;
  const selfCapacityTons = Math.max(Math.round(freezeTons * 0.884), Math.round(totalInventoryTons));
  const currentNeedTons = Math.max(Math.round(freezeTons * (1 + Math.max(0, demandAdjustment) / 100)), selfCapacityTons + 1);
  const warehouseGapTons = Math.max(0, currentNeedTons - selfCapacityTons);
  const externalWarehouseCount = Math.max(3, Math.min(12, Math.ceil(warehouseGapTons / 55)));
  const fundingNeedYi = Math.max(
    0.4,
    moneyYi((optSummary?.totalStorageCost ?? 0) + (optSummary?.totalTransportCost ?? 0) + Math.max(warehouseGapTons, 1) * 480_000)
  );
  const availableFundingYi = Number((fundingNeedYi * clamp(0.62 + (scenario === "capital" ? 0.16 : 0), 0.45, 0.86)).toFixed(2));
  const fundingGapYi = Math.max(0.1, Number((fundingNeedYi - availableFundingYi).toFixed(2)));
  const arrivalRate = clamp(Math.round((availableFundingYi / fundingNeedYi) * 100), 1, 100);
  const aiPriority = warehouseGapTons > 0 && fundingGapYi > 0.2 ? 1 : 2;
  const riskLevel = warehouseGapTons > selfCapacityTons * 0.09 || fundingGapYi > fundingNeedYi * 0.3 ? "高" : "中";

  const effectiveDispatch = persistDispatch.data ?? workspace?.dispatchBoard;
  const workOrders = effectiveDispatch?.workOrders ?? [];
  const dispatchHistory =
    workspace?.dispatchHistory.flatMap(order =>
      order.receipts.map(receipt => ({
        orderId: order.orderId,
        role: receipt.role,
        status: receipt.status,
        etaMinutes: receipt.etaMinutes,
        note: receipt.note,
        priority: order.priority,
      }))
    ) ?? [];
  const feedbackRows =
    dispatchHistory.length > 0
      ? dispatchHistory
      : (effectiveDispatch?.feedback ?? []).map(item => ({
          orderId: workOrders.find(order => order.role === item.role)?.orderId ?? `preview-${item.role}`,
          role: item.role,
          status: item.status,
          etaMinutes: item.etaMinutes,
          note: item.note,
          priority: workOrders.find(order => order.role === item.role)?.priority ?? "P2",
        }));
  const escalatedCount = feedbackRows.filter(row => row.status === "超时升级").length;
  const completedCount = feedbackRows.filter(row => row.status === "已完成").length;

  const gapRows = regionRows.map((row, index) => ({
    ...row,
    value: Math.max(1, Math.round(warehouseGapTons * row.ratio)),
    tone: index === 0 ? ("red" as const) : index < 3 ? ("blue" as const) : ("green" as const),
  }));
  const maxGap = Math.max(...gapRows.map(row => row.value), 1);
  const coldStores = gapRows.slice(0, 6).map((row, index) => ({
    id: String.fromCharCode(65 + index),
    name:
      index === 0
        ? "眉山临山冷链中心"
        : index === 1
          ? "成都新希望冷链园"
          : index === 2
            ? "武汉江夏冷链港"
            : index === 3
              ? "郑州中冷冷库"
              : index === 4
                ? "南京六合冷链基地"
                : "广州南沙冷链仓",
    region: row.name,
    available: Math.max(40, Math.round(row.value * (0.7 + index * 0.06))),
    temp: "-18℃以下",
    rent: Number((1.18 + index * 0.07).toFixed(2)),
    progress: clamp(60 - index * 10, 0, 80),
    level: index < 2 ? "A" : index < 4 ? "B" : "C",
  }));
  const selectedColdStore =
    coldStores.find(store => store.id === selectedColdStoreId) ?? coldStores[0];
  const fundingTimeline = [
    Number((fundingNeedYi * 0.32).toFixed(1)),
    Number((fundingNeedYi * 0.66).toFixed(1)),
    Number(fundingNeedYi.toFixed(1)),
  ];
  const fundingChannels = [
    ["银行授信", fundingNeedYi * 0.4, fundingNeedYi * 0.27, "洽谈中", "王学斌"],
    ["保理融资", fundingNeedYi * 0.26, fundingNeedYi * 0.18, "审批中", "冯鑫"],
    ["供应链金融", fundingNeedYi * 0.21, fundingNeedYi * 0.13, "沟通中", "李娜"],
    ["战略股权/股权", fundingNeedYi * 0.13, fundingNeedYi * 0.04, "初步接触", "陈明"],
  ] as const;
  const people = [
    ["仓储负责人", "王学斌", "仓储中心总监", "在线"],
    ["资金负责人", "冯鑫", "资金管理总监", "在线"],
    ["采购负责人", "李娜", "采购总经理", "在线"],
    ["审批人", "陈明", "运营总经理", riskLevel === "高" ? "离线" : "在线"],
  ];

  const executeReceipt = (role: RoleName, status: Exclude<DispatchStatus, "待确认">) => {
    const order = workOrders.find(item => item.role === role) ?? workOrders[0];
    if (!order) {
      persistDispatch.mutate(dispatchInput);
      toast.info("正在先生成协同工单，再推进执行回执。");
      return;
    }
    updateReceipt.mutate({
      orderId: order.orderId,
      role,
      status,
      etaMinutes: status === "已完成" ? 0 : status === "超时升级" ? 90 : 25,
      note:
        status === "已完成"
          ? `${role} 已完成节点回执，执行闭环已留痕。`
          : status === "超时升级"
            ? `${role} 节点出现延迟，触发异常升级。`
            : `${role} 已确认任务并进入执行。`,
      acknowledgedBy: status === "已接单" || status === "执行中" ? `${role}-现场确认` : undefined,
      receiptBy: status === "已完成" ? `${role}-签收回执` : undefined,
    });
  };

  const runAction = (message: string) => {
    pushLog(message);
    toast.success(message);
  };

  const applyAiRecommendation = () => {
    const nextScenario: ScenarioKey = riskLevel === "高" ? "risk" : "capital";
    setScenario(nextScenario);
    setAppliedPlan(
      `已应用 ${scenarioMeta[nextScenario].name}：优先锁定 ${selectedColdStore?.name ?? "A库"}，资金窗口 ${fundWindow}，缺口 ${formatNumber(warehouseGapTons)} 吨 / ${formatNumber(fundingGapYi, 2)} 亿元。`
    );
    persistDispatch.mutate(dispatchInput);
    pushLog(`AI 建议已应用：${scenarioMeta[nextScenario].label}`);
  };

  const sendAssistRequest = (title: string, owner: string) => {
    const message = `${formatTime(Date.now())} ${title} 已发送给 ${owner} 协办，等待移动端确认`;
    setAssistRequests(prev => [message, ...prev].slice(0, 5));
    setChatMessages(prev => [`系统通知：${message}`, ...prev].slice(0, 8));
    pushLog(message);
    toast.success("协办请求已进入协同链路");
  };

  const toggleVoiceInput = () => {
    setVoiceListening(value => !value);
    const message = voiceListening
      ? "语音输入已结束，听写内容已同步到 AI 助手。"
      : "语音输入已启动：正在监听现场口令，自动识别仓储/资金/风险关键词。";
    if (!voiceListening) {
      setChatInput("生成仓储与资金协同执行计划");
    }
    pushLog(message);
    toast.success(message);
  };

  const sendAiInstruction = (preset?: string) => {
    const command = (preset ?? chatInput).trim();
    if (!command) return;
    const answer =
      riskLevel === "高"
        ? `AI：已读取 ${warehouseGapTons} 吨仓储缺口与 ${formatNumber(fundingGapYi, 2)} 亿元资金缺口。建议先锁定 A/B 库，再按 ${fundWindow} 分两批释放资金。`
        : `AI：当前资金到位率 ${arrivalRate}%，可执行 ${scenarioConfig.name} 方案，并保持仓储与资金并行推进。`;
    setChatMessages(prev => [`我：${command}`, answer, ...prev].slice(0, 6));
    pushLog(`AI 助手处理指令：${command}`);
    setChatInput("");
  };

  const displayedChatMessages = chatMessages.filter(message => {
    if (activeChatTab === "全部") return true;
    if (activeChatTab === "仓储协同") return /库|仓储|冷链|询价/.test(message);
    if (activeChatTab === "资金协同") return /资金|授信|融资|银行|回款/.test(message);
    return /系统|通知|AI/.test(message);
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020813] text-slate-100">
      <TacticalBackdrop intensity="subtle" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.24),transparent_28%),linear-gradient(180deg,#030c18,#041426_46%,#020813)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1920px] flex-col p-1.5">
        <header className="relative grid h-[64px] grid-cols-[1fr,auto,1fr] items-center rounded-[8px] border border-cyan-400/15 bg-[#031123]/92 px-3 shadow-[0_0_34px_rgba(14,165,233,.16)]">
          <div className="flex items-center gap-4">
            <button className="flex h-10 items-center gap-2 rounded-[6px] border border-cyan-400/25 bg-slate-950/35 px-3 text-sm text-slate-200">
              <MapPin className="h-4 w-4 text-slate-300" />
              四川眉山
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
              正常运行
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-[30px] font-black tracking-[0.16em] text-white drop-shadow-[0_0_16px_rgba(125,211,252,.35)]">
              仓储与资金协同工作台
            </h1>
            <p className="mt-1 text-xs tracking-[0.36em] text-cyan-100/70">
              冻品储备AI作战系统 / 工作系统 / 仓储与资金
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            {(
              [
                ["区域", regionFilter, setRegionFilter, ["全国", "西南", "华东", "华中"]],
                ["仓库类型", warehouseType, setWarehouseType, ["冷库", "外租库", "自有库"]],
                ["资金计划", fundWindow, setFundWindow, ["2026年5月-7月", "2026年6月", "2026年Q3"]],
              ] satisfies Array<[string, string, (value: string) => void, string[]]>
            ).map(([label, value, setter, options]) => (
              <Select key={String(label)} value={String(value)} onValueChange={setter as (value: string) => void}>
                <SelectTrigger className="h-9 w-[148px] rounded-[6px] border-cyan-400/20 bg-slate-950/35 text-xs text-slate-200">
                  <SelectValue placeholder={`${label}：${value}`} />
                </SelectTrigger>
                <SelectContent>
                  {(options as string[]).map(option => (
                    <SelectItem key={option} value={option}>
                      {label}：{option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <button className="relative grid h-9 w-9 place-items-center rounded-[6px] border border-cyan-400/20 bg-slate-950/35">
              <Bell className="h-4 w-4 text-slate-200" />
              <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {12 + escalatedCount}
              </span>
            </button>
            <div className="flex h-10 items-center gap-2 rounded-[6px] border border-cyan-400/20 bg-slate-950/35 px-2">
              <UserRound className="h-7 w-7 text-cyan-100" />
              <div className="text-xs">
                <div className="font-bold text-white">王学斌</div>
                <div className="text-slate-400">仓储中心总监</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-6 gap-2 py-2">
          <MetricCard label="仓储缺口" value={formatNumber(warehouseGapTons)} unit="吨" delta="较上期 动态计算" icon={Warehouse} tone="red" />
          <MetricCard label="外租库候选" value={String(externalWarehouseCount)} unit="家" delta="按推荐优先级" icon={Snowflake} tone="blue" />
          <MetricCard label="资金缺口" value={formatNumber(fundingGapYi, 2)} unit="亿元" delta="由成本与锁库推导" icon={Vault} tone="red" />
          <MetricCard label="资金到位率" value={String(arrivalRate)} unit="%" delta={`已到位 ${formatNumber(availableFundingYi, 2)}亿`} icon={DatabaseZap} tone="green" />
          <MetricCard label="风险等级" value={riskLevel} delta={riskLevel === "高" ? "需升级" : "可控"} icon={AlertTriangle} tone="red" />
          <MetricCard label="AI 推荐优先级" value={String(aiPriority)} unit="级" delta={scenarioConfig.label} icon={LineChart} tone="blue" />
        </section>

        <main className="grid flex-1 grid-cols-[1.08fr,0.86fr,0.6fr] gap-2 overflow-hidden">
          <section className="grid min-h-0 grid-rows-[1fr,184px] gap-2">
            <Panel className="min-h-0">
              <PanelTitle title="仓储协同" icon={Warehouse} />
              <div className="grid h-[calc(100%-40px)] grid-cols-[0.42fr,0.58fr] gap-2 p-2">
                <div className="space-y-2">
                  <Panel className="p-3">
                    <div className="text-sm font-bold text-white">自有仓储能力概览</div>
                    <div className="mt-3 grid grid-cols-[124px,1fr] items-center gap-3">
                      <RingGauge value={clamp(utilization, 0, 100)} center={`${formatNumber(selfCapacityTons)}`} label="自有总容量" />
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">已用容量</span>
                          <span className="font-mono text-cyan-100">{formatNumber(Math.round(selfCapacityTons * utilization / 100))} 吨</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">可用容量</span>
                          <span className="font-mono text-emerald-200">{formatNumber(Math.max(0, selfCapacityTons - Math.round(selfCapacityTons * utilization / 100)))} 吨</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">利用率</span>
                          <span className="font-mono text-white">{formatNumber(utilization, 1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-bold text-white">缺口分布（单位：吨）</div>
                      {gapRows.map(row => (
                        <BarRow key={row.name} label={row.name} value={row.value} max={maxGap} />
                      ))}
                    </div>
                  </Panel>
                  <ChinaSignalMap points={gapRows} />
                </div>

                <div className="grid min-h-0 grid-rows-[1fr,0.76fr] gap-2">
                  <Panel className="min-h-0">
                    <PanelTitle
                      title="外租冷库候选清单"
                      icon={Snowflake}
                      right={<span className="text-xs text-slate-400">按推荐优先级</span>}
                    />
                    <div className="h-[calc(100%-40px)] overflow-auto p-2">
                      <div className="grid min-w-[660px] grid-cols-[30px,1.4fr,0.75fr,0.75fr,0.75fr,0.85fr,0.6fr,0.7fr] border-b border-cyan-400/15 px-2 py-2 text-xs text-cyan-100">
                        <span>#</span>
                        <span>仓库名称</span>
                        <span>地区</span>
                        <span>可用容量</span>
                        <span>冷温条件</span>
                        <span>租用单价</span>
                        <span>等级</span>
                        <span>操作</span>
                      </div>
                      {coldStores.map(store => (
                        <div
                          key={store.name}
                          className="grid min-w-[660px] grid-cols-[30px,1.4fr,0.75fr,0.75fr,0.75fr,0.85fr,0.6fr,0.7fr] items-center border-b border-cyan-400/8 px-2 py-2 text-xs text-slate-300"
                        >
                          <span className="text-amber-300">{store.id}</span>
                          <span className="font-semibold text-white">{store.name}</span>
                          <span>{store.region}</span>
                          <span>{store.available} 吨</span>
                          <span>{store.temp}</span>
                          <span>{store.rent} 元/吨·天</span>
                          <span className={cn("w-fit rounded-[4px] px-2 py-0.5", store.level === "A" ? "bg-amber-400/20 text-amber-200" : store.level === "B" ? "bg-blue-400/20 text-blue-200" : "bg-slate-400/15 text-slate-300")}>
                            {store.level}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedColdStoreId(store.id);
                              runAction(`${store.name} 查看详情并载入询价池`);
                            }}
                            className="h-7 rounded-[5px] bg-blue-600 px-2 text-xs text-white hover:bg-blue-500"
                          >
                            查看
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-3">
                    <div className="grid h-full grid-cols-[0.9fr,1fr] gap-3">
                      <ChinaSignalMap points={gapRows.slice(0, 4)} />
                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">缺口覆盖建议</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            当前载入 <span className="font-bold text-emerald-300">{selectedColdStore?.name ?? "A库"}</span>，
                            可用 {formatNumber(selectedColdStore?.available ?? 0)} 吨、租金 {selectedColdStore?.rent ?? 0} 元/吨·天。
                            优先对接 <span className="font-bold text-emerald-300">A、B 库</span>，可补足{" "}
                            <span className="font-bold text-emerald-300">
                              {formatNumber(coldStores[0]!.available + coldStores[1]!.available)}
                            </span>{" "}
                            吨，覆盖{" "}
                            <span className="font-bold text-cyan-200">
                              {formatNumber(((coldStores[0]!.available + coldStores[1]!.available) / Math.max(1, warehouseGapTons)) * 100, 1)}%
                            </span>{" "}
                            缺口。
                          </p>
                        </div>
                        <div>
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="text-slate-400">缺口覆盖率（按已确认意向）</span>
                            <span className="font-mono text-cyan-100">
                              {formatNumber(((coldStores[0]!.available + coldStores[1]!.available) / Math.max(1, warehouseGapTons)) * 100, 1)}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-blue-950">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                              style={{
                                width: `${clamp(((coldStores[0]!.available + coldStores[1]!.available) / Math.max(1, warehouseGapTons)) * 100, 2, 100)}%`,
                              }}
                            />
                          </div>
                          <Button
                            onClick={() => persistDispatch.mutate(dispatchInput)}
                            className="mt-4 h-9 w-full rounded-[6px] bg-blue-600 text-white hover:bg-blue-500"
                          >
                            生成仓储对接计划
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-[0.46fr,0.54fr] gap-2">
              <Panel>
                <PanelTitle title="协作人员" icon={UsersRound} />
                <div className="grid grid-cols-2 gap-2 p-2">
                  {people.slice(0, 2).map(person => (
                    <PersonCard key={person[1]} person={person} onCall={() => runAction(`已呼叫 ${person[1]}，等待确认`)} />
                  ))}
                </div>
              </Panel>
              <Panel>
                <PanelTitle title="上游审批人（需协同）" icon={ClipboardCheck} />
                <div className="grid grid-cols-2 gap-2 p-2">
                  {people.slice(2).map(person => (
                    <PersonCard key={person[1]} person={person} onCall={() => runAction(`已向 ${person[1]} 发起审批协同`)} />
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="grid min-h-0 grid-rows-[1fr,184px] gap-2">
            <Panel className="min-h-0">
              <PanelTitle
                title="资金协同"
                icon={Vault}
                right={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">战略模拟</span>
                    <Select value={scenario} onValueChange={value => setScenario(value as ScenarioKey)}>
                      <SelectTrigger className="h-7 w-[132px] rounded-[5px] border-cyan-400/20 bg-slate-950/45 text-xs text-cyan-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(scenarioMeta) as ScenarioKey[]).map(key => (
                          <SelectItem key={key} value={key}>
                            {scenarioMeta[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
              <div className="grid h-[calc(100%-40px)] grid-rows-[170px,74px,1fr,154px] gap-2 p-2">
                <Panel className="grid grid-cols-[1fr,156px] p-3">
                      <div>
                        <div className="text-sm font-bold text-white">资金需求时间轴（单位：亿元）</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                          当前模拟：{scenarioConfig.name} / {scenarioConfig.label}
                        </div>
                        <FundingLine values={fundingTimeline} />
                      </div>
                  <div className="rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.06] p-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">总资金需求</span><span className="font-bold text-emerald-300">{formatNumber(fundingNeedYi, 2)}亿元</span></div>
                    <div className="mt-3 flex justify-between"><span className="text-slate-400">已到位资金</span><span className="font-bold text-emerald-300">{formatNumber(availableFundingYi, 2)}亿元</span></div>
                    <div className="mt-3 flex justify-between"><span className="text-slate-400">资金缺口</span><span className="font-bold text-red-300">{formatNumber(fundingGapYi, 2)}亿元</span></div>
                    <div className="mt-3 flex justify-between"><span className="text-slate-400">到位率</span><span className="font-bold text-white">{arrivalRate}%</span></div>
                  </div>
                </Panel>
                <Panel className="p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-white">
                    <span>资金缺口结构（单位：亿元）</span>
                    <span className="text-xl">{formatNumber(fundingNeedYi, 2)}</span>
                  </div>
                  <div className="flex h-6 overflow-hidden rounded-[4px] border border-cyan-400/15 text-xs font-bold">
                    {[
                      ["采购支出", 0.62, "bg-blue-600"],
                      ["仓储费用", 0.16, "bg-blue-500"],
                      ["物流费用", 0.13, "bg-sky-500"],
                      ["其他费用", 0.09, "bg-slate-500"],
                    ].map(([label, ratio, color]) => (
                      <div key={String(label)} className={cn("grid place-items-center", color as string)} style={{ width: `${Number(ratio) * 100}%` }}>
                        {formatNumber(fundingNeedYi * Number(ratio), 2)}
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel className="min-h-0">
                  <PanelTitle title="融资渠道与执行计划" icon={Route} />
                  <div className="h-[calc(100%-40px)] overflow-auto p-2">
                    <div className="grid grid-cols-[1fr,0.86fr,0.86fr,0.72fr,0.92fr,0.62fr] border-b border-cyan-400/15 px-2 py-2 text-xs text-cyan-100">
                      <span>渠道类型</span><span>目标金额</span><span>已落实</span><span>缺口</span><span>对接进度</span><span>负责人</span>
                    </div>
                    {fundingChannels.map(([name, target, done, status, owner]) => (
                      <div key={name} className="grid grid-cols-[1fr,0.86fr,0.86fr,0.72fr,0.92fr,0.62fr] border-b border-cyan-400/8 px-2 py-2 text-xs text-slate-300">
                        <span className="font-semibold text-white">{name}</span>
                        <span>{formatNumber(target, 2)}</span>
                        <span className="text-emerald-300">{formatNumber(done, 2)}</span>
                        <span className="text-red-300">{formatNumber(Math.max(0, target - done), 2)}</span>
                        <span className="text-cyan-200">{status}</span>
                        <span>{owner}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <PanelTitle title="资金协调工作流" icon={Workflow} />
                  <div className="grid h-[calc(100%-40px)] grid-cols-[1fr,1fr,1fr,0.8fr] gap-2 p-2">
                    {[
                      ["财务负责人", "冯鑫", "拆解融资方案", "进行中"],
                      ["采购负责人", "李娜", "确认采购计划", "已通过"],
                      ["审批人", "陈明", "最终审批", riskLevel === "高" ? "待审批" : "已确认"],
                    ].map(item => (
                      <div key={item[0]} className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.06] p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-8 w-8 text-cyan-100" />
                          <div><div className="font-bold text-white">{item[0]}</div><div className="text-slate-400">{item[1]}</div></div>
                        </div>
                        <div className="mt-2 text-slate-300">{item[2]}</div>
                        <div className={cn("mt-2 font-bold", item[3] === "待审批" ? "text-amber-300" : "text-emerald-300")}>{item[3]}</div>
                      </div>
                    ))}
                    <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.06] p-3 text-xs">
                      <div className="font-bold text-white">流程进度</div>
                      {["提交方案", "部门审核", "总经理审批", "执行与反馈"].map((step, index) => (
                        <div key={step} className="mt-2 flex justify-between text-slate-300">
                          <span>{index + 1}. {step}</span>
                          <span className={index < 2 ? "text-emerald-300" : index === 2 ? "text-blue-300" : "text-slate-500"}>{index < 2 ? "已完成" : index === 2 ? "进行中" : "待处理"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="关键协作动态（实时）" icon={Radar} right={<span className="text-xs text-cyan-200">查看更多</span>} />
              <div className="space-y-2 p-3">
                {logs.slice(0, 4).map((log, index) => (
                  <div key={log} className="flex items-center gap-3 text-sm">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-cyan-400/25 bg-blue-500/20 text-[10px] text-cyan-100">{index + 1}</span>
                    <span className="text-slate-300">{log}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <aside className="grid min-h-0 grid-rows-[244px,146px,146px,1fr] gap-2">
            <Panel>
              <PanelTitle title="AI 协同建议" icon={Bot} />
              <div className="space-y-3 p-3 text-sm">
                {[
                  `优先对接 A 库、B 库补足 ${formatNumber(warehouseGapTons)} 吨库容，预计 3 天内可锁定库位。`,
                  `建议分两批完成 ${formatNumber(fundingNeedYi, 2)} 亿元资金协调：第一批覆盖锁库，第二批覆盖采购与物流。`,
                  `仓储先行、资金并行，降低断供风险；先锁定库容，再分批划拨资金。`,
                ].map((text, index) => (
                  <div key={text} className="grid grid-cols-[28px,1fr] gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-cyan-400/30 bg-blue-500/20 font-bold text-cyan-100">{index + 1}</span>
                    <span className="leading-5 text-slate-200">{text}</span>
                  </div>
                ))}
                {appliedPlan ? (
                  <div className="rounded-[7px] border border-emerald-400/20 bg-emerald-400/[0.07] p-2 text-xs leading-5 text-emerald-100">
                    {appliedPlan}
                  </div>
                ) : null}
                <Button onClick={applyAiRecommendation} className="h-9 w-full rounded-[6px] bg-blue-600 text-white hover:bg-blue-500">
                  应用建议方案
                </Button>
              </div>
            </Panel>

            <RiskCard
              title="仓储缺口（根因）"
              body={`自有仓储不足，区域分布不均；当前 ${selectedBatch?.warehouse ?? "核心仓"} 批次 ${selectedBatch?.partName ?? "冻品"} 库龄 ${selectedBatch?.ageDays ?? 0} 天，旺季需求集中。`}
              owner="王学斌"
              date="2026-05-25"
              onCreate={() => persistDispatch.mutate(dispatchInput)}
              onAssist={() => sendAssistRequest("仓储缺口协办", "王学斌")}
              onEscalate={() => executeReceipt("仓储管理员", "超时升级")}
            />
            <RiskCard
              title="资金缺口（根因）"
              body={`资金到位节奏滞后，授信额度未完全释放；当前到位率 ${arrivalRate}%，存在回款与支付错配风险。`}
              owner="冯鑫"
              date="2026-05-28"
              onCreate={() => persistDispatch.mutate(dispatchInput)}
              onAssist={() => sendAssistRequest("资金缺口协办", "冯鑫")}
              onEscalate={() => executeReceipt("司机", "超时升级")}
            />

            <Panel className="min-h-0">
              <PanelTitle
                title="协同聊天与批注"
                icon={MessageSquareText}
                right={<span className="flex gap-2 text-slate-400"><Cpu className="h-4 w-4" /><Search className="h-4 w-4" /></span>}
              />
              <div className="flex h-[calc(100%-40px)] flex-col p-3">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {(["全部", "仓储协同", "资金协同", "系统通知"] as ChatTab[]).map(item => (
                    <button
                      key={item}
                      onClick={() => setActiveChatTab(item)}
                      className={cn(
                        "rounded-[5px] border py-1 text-cyan-100",
                        activeChatTab === item
                          ? "border-cyan-300/45 bg-blue-500/20"
                          : "border-cyan-400/15 bg-cyan-400/[0.06]"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex-1 space-y-2 overflow-auto">
                  {assistRequests.length ? (
                    <div className="rounded-[8px] border border-amber-300/18 bg-amber-400/[0.06] p-2 text-xs leading-5 text-amber-100">
                      最新协办：{assistRequests[0]}
                    </div>
                  ) : null}
                  {displayedChatMessages.map(message => (
                    <div key={message} className="rounded-[8px] border border-cyan-400/12 bg-cyan-400/[0.045] p-2 text-xs leading-5 text-slate-200">
                      {message}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event => event.key === "Enter" && sendAiInstruction()}
                    placeholder="输入消息..."
                    className="h-9 rounded-[6px] border-cyan-400/20 bg-slate-950/45 text-slate-100"
                  />
                  <Button onClick={() => sendAiInstruction()} className="h-9 rounded-[6px] bg-blue-600 px-3 text-white hover:bg-blue-500">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Panel>
          </aside>
        </main>

        <footer className="mt-2 grid h-[92px] grid-cols-[190px,1fr,760px,166px] gap-2">
          <Panel className="flex items-center gap-3 px-4">
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-cyan-300/25 bg-blue-500/10">
              <Bot className="h-9 w-9 text-cyan-100" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-300" />
            </div>
            <div>
              <div className="text-xl font-black text-white">AI 协调助手</div>
              <div className="text-xs text-slate-400">人机协同 / 战略模拟 / 工单闭环</div>
            </div>
          </Panel>
          <Panel className="p-3">
            <div className="mb-2 text-sm font-bold text-white">智能推荐问题</div>
            <div className="flex flex-wrap gap-2">
              {[
                `如何快速补足${formatNumber(warehouseGapTons)}吨仓储缺口？`,
                "资金缺口的最优融资方案是什么？",
                "哪些外租冷库性价比最高？",
                "如何降低资金到位风险？",
                "生成仓储与资金协同执行计划",
              ].map(question => (
                <button
                  key={question}
                  onClick={() => sendAiInstruction(question)}
                  className="rounded-[6px] border border-cyan-400/20 bg-blue-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-blue-500/20"
                >
                  {question}
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="flex items-center gap-3 px-4">
            <Input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              onKeyDown={event => event.key === "Enter" && sendAiInstruction()}
              placeholder="请输入您的问题或指令，AI 助手将为您提供协同建议..."
              className="h-12 rounded-[8px] border-cyan-400/25 bg-slate-950/45 text-slate-100"
            />
            <Button onClick={() => sendAiInstruction()} className="h-12 w-14 rounded-[8px] bg-blue-600 text-white hover:bg-blue-500">
              <Send className="h-5 w-5" />
            </Button>
          </Panel>
          <Panel className="grid place-items-center">
            <Button onClick={toggleVoiceInput} className={cn("h-12 w-[136px] rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.12]", voiceListening && "border-emerald-300/45 bg-emerald-400/[0.12] text-emerald-100")}>
              <Mic className="mr-2 h-5 w-5" />
              {voiceListening ? "听写中" : "语音输入"}
            </Button>
          </Panel>
        </footer>

        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-[8px] border border-cyan-400/15 bg-slate-950/40 px-3 py-1.5 text-xs text-cyan-100">
          {optimizationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
          数据来源：库存批次、AI 决策工作台、全局优化模型、审计与工单回执
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person, onCall }: { person: string[]; onCall: () => void }) {
  const online = person[3] === "在线";
  return (
    <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full border border-cyan-400/20 bg-slate-950/45">
          <UserRound className="h-6 w-6 text-cyan-100" />
        </div>
        <div>
          <div className="text-xs font-bold text-cyan-200">{person[0]}</div>
          <div className="text-base font-black text-white">{person[1]}</div>
          <div className="text-xs text-slate-400">{person[2]}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("rounded-[5px] px-2 py-1 text-xs", online ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-500/15 text-slate-400")}>
          {online ? "● 在线" : "● 离线"}
        </span>
        <button onClick={onCall} className="grid h-7 w-7 place-items-center rounded-full border border-blue-400/25 bg-blue-500/15 text-blue-200">
          <PhoneCall className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RiskCard({
  title,
  body,
  owner,
  date,
  onCreate,
  onAssist,
  onEscalate,
}: {
  title: string;
  body: string;
  owner: string;
  date: string;
  onCreate: () => void;
  onAssist: () => void;
  onEscalate: () => void;
}) {
  return (
    <Panel tone="red" className="p-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-black text-red-100">{title}</div>
        <span className="rounded-[5px] border border-red-400/25 px-2 py-1 text-xs font-bold text-red-200">高风险</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">{body}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-300">
        <span>责任人：<b className="text-white">{owner}</b></span>
        <span>目标完成：{date}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button onClick={onCreate} className="h-8 rounded-[6px] bg-blue-600 text-xs text-white hover:bg-blue-500">
          生成工单
        </Button>
        <Button onClick={onAssist} className="h-8 rounded-[6px] bg-blue-600 text-xs text-white hover:bg-blue-500">
          发送协办
        </Button>
        <Button onClick={onEscalate} className="h-8 rounded-[6px] bg-blue-600 text-xs text-white hover:bg-blue-500">
          升级风险
        </Button>
      </div>
    </Panel>
  );
}
