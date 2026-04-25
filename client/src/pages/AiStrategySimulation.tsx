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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  LineChart,
  Play,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type StrategyKey = "conservative" | "baseline" | "aggressive" | "hedge";
type RiskLevel = "低" | "低-中" | "中" | "中高" | "高";

type ScenarioRecord = {
  id: string;
  name: string;
  savedAt: string;
  profit: number;
  roi: number;
  risk: RiskLevel;
};

const strategyMeta: Record<
  StrategyKey,
  {
    name: string;
    short: string;
    badge: string;
    tone: "blue" | "green" | "purple" | "cyan";
    storageDelta: number;
    priceDelta: number;
    capacityDelta: number;
    demandDelta: number;
    cashFactor: number;
    execution: number;
  }
> = {
  conservative: {
    name: "保守方案A",
    short: "稳健优先",
    badge: "稳健优先",
    tone: "blue",
    storageDelta: -0.15,
    priceDelta: -0.35,
    capacityDelta: -8,
    demandDelta: -4,
    cashFactor: 0.72,
    execution: 72,
  },
  baseline: {
    name: "基准方案B",
    short: "均衡最优",
    badge: "推荐",
    tone: "green",
    storageDelta: 0,
    priceDelta: 0,
    capacityDelta: 0,
    demandDelta: 0,
    cashFactor: 1,
    execution: 86,
  },
  aggressive: {
    name: "激进方案C",
    short: "收益优先",
    badge: "收益优先",
    tone: "purple",
    storageDelta: 0.18,
    priceDelta: 0.82,
    capacityDelta: 16,
    demandDelta: 12,
    cashFactor: 1.2,
    execution: 68,
  },
  hedge: {
    name: "风险对冲方案D",
    short: "风险对冲",
    badge: "风险对冲",
    tone: "cyan",
    storageDelta: 0,
    priceDelta: -0.18,
    capacityDelta: -5,
    demandDelta: 3,
    cashFactor: 0.95,
    execution: 78,
  },
};

const toneClass = {
  blue: "border-blue-400/35 bg-blue-500/[0.08] text-blue-100",
  green: "border-emerald-400/45 bg-emerald-500/[0.1] text-emerald-100",
  purple: "border-violet-400/35 bg-violet-500/[0.1] text-violet-100",
  cyan: "border-cyan-400/35 bg-cyan-500/[0.08] text-cyan-100",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function moneyWan(value: number) {
  return value / 10000;
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDateTime(value: number | Date | undefined) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function riskFromPressure(warehousePressure: number, roi: number): RiskLevel {
  if (warehousePressure >= 82 || roi < 5) return "高";
  if (warehousePressure >= 74) return "中高";
  if (warehousePressure >= 62) return "中";
  if (warehousePressure >= 50) return "低-中";
  return "低";
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-500/30 bg-[#06182f]/88 shadow-[inset_0_1px_0_rgba(103,232,249,0.18),0_0_28px_rgba(14,116,195,0.22)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.09),transparent_36%,rgba(59,130,246,0.08))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PanelHeader({
  title,
  icon: Icon,
  right,
}: {
  title: string;
  icon?: typeof Bot;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-cyan-400/15 px-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-cyan-200" /> : null}
        <h2 className="text-[16px] font-semibold text-white">{title}</h2>
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
  tone = "cyan",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Bot;
  tone?: keyof typeof toneClass | "amber";
}) {
  const color =
    tone === "amber"
      ? "border-amber-400/35 bg-amber-500/[0.1] text-amber-100"
      : toneClass[tone];
  return (
    <Panel>
      <div className="flex h-[76px] items-center gap-3 px-4">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full border",
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs text-slate-400">{label}</div>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-[28px] font-bold leading-none text-white">
              {value}
            </span>
            {unit ? (
              <span className="text-xs text-slate-400">{unit}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ParameterSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[8px] border border-cyan-400/12 bg-slate-950/28 p-3">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="rounded-[6px] border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 font-semibold text-cyan-100">
          {value > 0 ? "+" : ""}
          {formatNumber(value, step < 1 ? 1 : 0)}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={next => onChange(next[0] ?? value)}
      />
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function RadarMini({
  values,
  tone,
}: {
  values: number[];
  tone: keyof typeof toneClass;
}) {
  const points = values
    .map((value, index) => {
      const angle = -Math.PI / 2 + (index / values.length) * Math.PI * 2;
      const radius = clamp(value, 0, 100) * 0.42;
      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    })
    .join(" ");
  const stroke =
    tone === "green"
      ? "#34d399"
      : tone === "purple"
        ? "#a78bfa"
        : tone === "blue"
          ? "#60a5fa"
          : "#22d3ee";
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-full">
      {[18, 30, 42].map(radius => (
        <polygon
          key={radius}
          points={[0, 1, 2, 3, 4]
            .map(index => {
              const angle = -Math.PI / 2 + (index / 5) * Math.PI * 2;
              return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={points}
        fill={`${stroke}40`}
        stroke={stroke}
        strokeWidth="2"
      />
      {["收益", "风险", "执行", "仓储", "资金"].map((label, index) => {
        const angle = -Math.PI / 2 + (index / 5) * Math.PI * 2;
        return (
          <text
            key={label}
            x={50 + Math.cos(angle) * 48}
            y={53 + Math.sin(angle) * 48}
            textAnchor="middle"
            className="fill-slate-400 text-[8px]"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function SvgCurve({
  points,
  width = 760,
  height = 220,
}: {
  points: Array<{
    label: string;
    actual?: number | null;
    projected?: number | null;
    breakeven?: number | null;
    profit?: number | null;
  }>;
  width?: number;
  height?: number;
}) {
  const priceValues = points
    .flatMap(point => [point.actual, point.projected, point.breakeven])
    .filter((v): v is number => typeof v === "number");
  const profitValues = points
    .map(point => point.profit)
    .filter((v): v is number => typeof v === "number");
  const minPrice = Math.min(...priceValues, 16);
  const maxPrice = Math.max(...priceValues, 36);
  const minProfit = Math.min(...profitValues, -8);
  const maxProfit = Math.max(...profitValues, 12);
  const x = (index: number) =>
    46 + (index / Math.max(1, points.length - 1)) * (width - 80);
  const yPrice = (value: number) =>
    24 +
    ((maxPrice - value) / Math.max(1, maxPrice - minPrice)) * (height - 64);
  const yProfit = (value: number) =>
    24 +
    ((maxProfit - value) / Math.max(1, maxProfit - minProfit)) * (height - 64);
  const linePath = (
    key: "actual" | "projected" | "breakeven",
    y: (value: number) => number
  ) =>
    points
      .map((point, index) => {
        const value = point[key];
        if (typeof value !== "number") return "";
        return `${index === 0 || points.slice(0, index).every(prev => typeof prev[key] !== "number") ? "M" : "L"} ${x(index)} ${y(value)}`;
      })
      .filter(Boolean)
      .join(" ");
  const profitPath = points
    .map((point, index) => {
      const value = point.profit;
      if (typeof value !== "number") return "";
      return `${index === 0 || points.slice(0, index).every(prev => typeof prev.profit !== "number") ? "M" : "L"} ${x(index)} ${yProfit(value)}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(row => (
        <line
          key={row}
          x1="42"
          x2={width - 28}
          y1={24 + row * ((height - 64) / 4)}
          y2={24 + row * ((height - 64) / 4)}
          stroke="rgba(125,211,252,0.12)"
        />
      ))}
      <path
        d={linePath("actual", yPrice)}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.4"
      />
      <path
        d={linePath("projected", yPrice)}
        fill="none"
        stroke="#22d3ee"
        strokeDasharray="6 5"
        strokeWidth="2.4"
      />
      <path
        d={linePath("breakeven", yPrice)}
        fill="none"
        stroke="#f59e0b"
        strokeDasharray="4 5"
        strokeWidth="1.8"
      />
      <path d={profitPath} fill="none" stroke="#a855f7" strokeWidth="2.2" />
      <rect
        x={x(6) - 8}
        y="24"
        width={width - x(6) - 20}
        height={height - 64}
        fill="url(#forecastArea)"
        stroke="rgba(34,211,238,0.18)"
      />
      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <line
            x1={x(index)}
            x2={x(index)}
            y1={height - 38}
            y2={height - 33}
            stroke="rgba(148,163,184,0.45)"
          />
          <text
            x={x(index)}
            y={height - 18}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {point.label}
          </text>
          {typeof point.projected === "number" ? (
            <circle
              cx={x(index)}
              cy={yPrice(point.projected)}
              r="4"
              fill="#22d3ee"
              stroke="#06182f"
              strokeWidth="2"
            />
          ) : null}
        </g>
      ))}
      <text x="8" y="28" className="fill-slate-400 text-[10px]">
        价格
      </text>
      <text x={width - 42} y="28" className="fill-slate-400 text-[10px]">
        利润
      </text>
    </svg>
  );
}

export default function AiStrategySimulationPage() {
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [regionCode, setRegionCode] = useState("510000");
  const [selectedMonth, setSelectedMonth] = useState(2);
  const [targetStorageTons, setTargetStorageTons] = useState(12);
  const [dailyReserveTons, setDailyReserveTons] = useState(2500);
  const [targetPrice, setTargetPrice] = useState(29.4);
  const [capitalLimit, setCapitalLimit] = useState(3.2);
  const [outsourcedCapacityTons, setOutsourcedCapacityTons] = useState(3);
  const [capacityAdjustment, setCapacityAdjustment] = useState(12);
  const [demandAdjustment, setDemandAdjustment] = useState(10);
  const [costAdjustment, setCostAdjustment] = useState(5);
  const [selectedPlan, setSelectedPlan] = useState<StrategyKey>("baseline");
  const [chatInput, setChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState<string[]>([
    "AI 调参助手已载入市场、库存、成本与派单约束。你可以调整变量后运行模拟，系统会重新评估收益、风险和执行难度。",
  ]);
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRecord[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({
    timeframe: "month",
  });
  const { data: market } = trpc.platform.porkMarket.useQuery({
    timeframe: "month",
    regionCode,
    sortBy: "hogPrice",
  });
  const { data: scenarioData } = trpc.platform.scenarios.useQuery({
    batchCode,
    regionCode,
  });

  useEffect(() => {
    if (!snapshot?.inventoryBatches.length) return;
    if (!snapshot.inventoryBatches.some(item => item.batchCode === batchCode)) {
      setBatchCode(snapshot.inventoryBatches[0]!.batchCode);
    }
  }, [snapshot?.inventoryBatches, batchCode]);

  const forecastInput = useMemo(
    () => ({
      batchCode,
      selectedMonth: Math.min(8, Math.max(1, selectedMonth)),
      targetPrice,
      strategy: "balanced" as const,
      basisAdjustment: 0,
    }),
    [batchCode, selectedMonth, targetPrice]
  );
  const whatIfInput = useMemo(
    () => ({
      batchCode,
      selectedMonth: Math.min(3, Math.max(1, selectedMonth)),
      targetPrice,
      capacityAdjustment,
      demandAdjustment,
    }),
    [
      batchCode,
      selectedMonth,
      targetPrice,
      capacityAdjustment,
      demandAdjustment,
    ]
  );
  const workspaceInput = useMemo(
    () => ({
      batchCode,
      forecastMonth: Math.min(8, Math.max(1, selectedMonth)),
      scenarioMonth: Math.min(3, Math.max(1, selectedMonth)),
      targetPrice,
      strategy: "balanced" as const,
      basisAdjustment: 0,
      capacityAdjustment,
      demandAdjustment,
    }),
    [
      batchCode,
      selectedMonth,
      targetPrice,
      capacityAdjustment,
      demandAdjustment,
    ]
  );

  const { data: forecast, refetch: refetchForecast } =
    trpc.platform.aiForecast.useQuery(forecastInput);
  const { data: whatIf, refetch: refetchWhatIf } =
    trpc.platform.aiWhatIf.useQuery(whatIfInput);
  const { data: workspace, refetch: refetchWorkspace } =
    trpc.platform.aiDecisionWorkspace.useQuery(workspaceInput);

  const selectedBatch =
    snapshot?.inventoryBatches.find(item => item.batchCode === batchCode) ??
    forecast?.batch ??
    snapshot?.inventoryBatches[0];
  const liveHogQuote = market?.benchmarkQuotes.find(
    item => item.code === "live_hog"
  );
  const cornQuote = market?.benchmarkQuotes.find(
    item => item.code === "corn_spot"
  );
  const soymealQuote = market?.benchmarkQuotes.find(
    item => item.code === "soymeal_spot"
  );
  const batchScenarios = scenarioData?.scenarios ?? [];
  const recommendedLiveScenario =
    batchScenarios.find(
      item => item.holdMonths === Math.min(3, selectedMonth)
    ) ??
    [...batchScenarios].sort((a, b) => b.netProfitPerKg - a.netProfitPerKg)[0];

  const baseProfit =
    whatIf?.summary.simulatedProfit ?? forecast?.summary.totalProfit ?? 0;
  const baseStorageTons = targetStorageTons;
  const schemeRows = (Object.keys(strategyMeta) as StrategyKey[]).map(key => {
    const meta = strategyMeta[key];
    const reserveTons = Math.max(1, baseStorageTons * (1 + meta.storageDelta));
    const planTargetPrice = targetPrice + meta.priceDelta;
    const planCapacity = capacityAdjustment + meta.capacityDelta;
    const planDemand = demandAdjustment + meta.demandDelta;
    const utilization = clamp(
      (whatIf?.summary.utilizationRate ?? 100) +
        meta.capacityDelta * 0.42 +
        meta.demandDelta * 0.18,
      40,
      140
    );
    const profit =
      baseProfit +
      (planTargetPrice - targetPrice) * (selectedBatch?.weightKg ?? 0) * 0.55 +
      planDemand * 1680 -
      Math.max(0, utilization - 118) * 1800 -
      costAdjustment * 3200;
    const cashNeed = Math.max(
      0.3,
      capitalLimit * meta.cashFactor +
        reserveTons * 0.012 +
        outsourcedCapacityTons * 0.04
    );
    const roi =
      cashNeed > 0 ? (moneyWan(profit) / (cashNeed * 10000)) * 10000 : 0;
    const warehousePressure = clamp(
      45 + reserveTons * 1.9 + outsourcedCapacityTons * 2.8 - planDemand * 0.22,
      18,
      95
    );
    const risk = riskFromPressure(warehousePressure, roi);
    return {
      key,
      meta,
      reserveTons,
      netProfit: profit,
      roi,
      cashNeed,
      warehousePressure,
      execution: clamp(
        meta.execution - Math.max(0, utilization - 105) * 0.22,
        45,
        96
      ),
      risk,
      targetPrice: planTargetPrice,
      capacityAdjustment: planCapacity,
      demandAdjustment: planDemand,
      stars: Math.max(
        1,
        Math.min(
          5,
          Math.round(roi / 3 + meta.execution / 36 - warehousePressure / 40)
        )
      ),
    };
  });
  const currentPlan =
    schemeRows.find(item => item.key === selectedPlan) ?? schemeRows[1]!;
  const recommendedPlan =
    [...schemeRows]
      .filter(item => item.risk !== "高")
      .sort((a, b) => b.roi - a.roi || b.execution - a.execution)[0] ??
    currentPlan;

  useEffect(() => {
    setSelectedPlan(recommendedPlan.key);
  }, [recommendedPlan.key]);

  const curvePoints =
    forecast?.timeline.map(point => ({
      label: point.label,
      actual: point.actualPrice,
      projected: point.projectedPrice,
      breakeven: point.breakEvenPrice,
      profit: point.profitPerKg,
    })) ?? [];

  const sensitivityPoints = [
    {
      label: "价格 -20%",
      x: -20,
      y: moneyWan(baseProfit) * -0.18,
      tone: "blue",
    },
    {
      label: "价格 -10%",
      x: -10,
      y: moneyWan(baseProfit) * -0.08,
      tone: "blue",
    },
    { label: "价格 +10%", x: 10, y: moneyWan(baseProfit) * 0.1, tone: "blue" },
    { label: "价格 +20%", x: 20, y: moneyWan(baseProfit) * 0.18, tone: "blue" },
    { label: "成本 -5%", x: -5, y: moneyWan(baseProfit) * 0.05, tone: "green" },
    { label: "成本 +5%", x: 5, y: moneyWan(baseProfit) * -0.05, tone: "green" },
    { label: "仓储 +10%", x: 10, y: -0.32, tone: "purple" },
    { label: "销售 +20%", x: 20, y: 0.38, tone: "purple" },
  ];

  const dispatchInput = {
    batchCode,
    selectedMonth: Math.min(3, Math.max(1, selectedMonth)),
    targetPrice: currentPlan.targetPrice,
    capacityAdjustment: clamp(currentPlan.capacityAdjustment, -60, 120),
    demandAdjustment: clamp(currentPlan.demandAdjustment, -60, 120),
  };

  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      toast.success("策略已转入派单执行中心，工单与通知链路已生成。");
    },
    onError: error => toast.error(error.message || "进入派单失败。"),
  });

  const confirmDecision = trpc.platform.confirmDecision.useMutation({
    onSuccess: async () => {
      await utils.platform.auditLogs.invalidate();
      toast.success("策略已提交审批，并写入审计日志。");
    },
    onError: error => toast.error(error.message || "策略提交失败。"),
  });

  const runSimulation = async () => {
    await Promise.all([refetchForecast(), refetchWhatIf(), refetchWorkspace()]);
    setSelectedPlan(recommendedPlan.key);
    toast.success("模拟完成，方案收益、风险与执行约束已刷新。");
  };

  const saveScenario = () => {
    const record: ScenarioRecord = {
      id: `${currentPlan.key}-${Date.now()}`,
      name: `${currentPlan.meta.name} · ${selectedBatch?.partName ?? "批次"}`,
      savedAt: formatDateTime(Date.now()).slice(5, 16),
      profit: currentPlan.netProfit,
      roi: currentPlan.roi,
      risk: currentPlan.risk,
    };
    setSavedScenarios(prev => [record, ...prev].slice(0, 5));
    toast.success("当前模拟方案已保存到场景管理。");
  };

  const submitStrategy = () => {
    if (!recommendedLiveScenario) {
      toast.error("当前批次暂无可提交的真实决策场景。");
      return;
    }
    confirmDecision.mutate({
      batchCode,
      scenarioId: recommendedLiveScenario.scenarioId,
      operatorRole: "strategist",
      operatorName: "张经理",
    });
  };

  const sendAiMessage = () => {
    const command = chatInput.trim();
    if (!command) return;
    const riskText =
      currentPlan.risk === "高" || currentPlan.risk === "中高"
        ? "当前风险偏高，建议降低储备量或增加外租库缓冲后再提交。"
        : "当前方案处于可执行区间，可进入审批或派单执行。";
    setAiMessages(prev => [
      `指令：${command}`,
      `AI 调参助手：${riskText} 当前推荐 ${recommendedPlan.meta.name}，预计净利润 ${formatNumber(moneyWan(recommendedPlan.netProfit), 1)} 万元。`,
      ...prev.slice(0, 2),
    ]);
    setChatInput("");
  };

  const aiConfidence = clamp(
    92 -
      (currentPlan.risk === "高" ? 18 : currentPlan.risk === "中高" ? 10 : 0) -
      Math.max(0, currentPlan.warehousePressure - 70) * 0.18,
    62,
    96
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#020b18] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.26),transparent_31%),linear-gradient(180deg,#03101f,#020b18_56%,#03101d)]" />
      <div className="relative z-10">
        <header className="grid h-[64px] items-center border-b border-cyan-400/20 px-4 xl:grid-cols-[1fr,auto,1fr]">
          <div className="flex items-center gap-4">
            <button className="flex h-10 items-center gap-2 rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.06] px-4 text-white">
              <Target className="h-4 w-4" />
              四川眉山
              <ChevronDown className="h-4 w-4 text-cyan-200" />
            </button>
            <span className="flex items-center gap-2 text-sm text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              正常运行
            </span>
            <span className="hidden text-sm text-slate-400 xl:inline">
              经营决策平台
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-[30px] font-bold tracking-[0.08em] text-white">
              战略模拟 | What-if 方案模拟中心
            </h1>
            <p className="mt-1 text-xs tracking-[0.32em] text-cyan-200/70">
              冻品储备 AI 作战系统 / 战略模拟
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="hidden text-sm text-slate-300 xl:inline">
              {formatDateTime(now)}
            </span>
            <Button
              onClick={saveScenario}
              className="h-9 rounded-[7px] border border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.12]"
            >
              <Save className="mr-2 h-4 w-4" />
              保存方案
            </Button>
            <Button
              onClick={runSimulation}
              className="h-9 rounded-[7px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
            >
              <Play className="mr-2 h-4 w-4" />
              运行模拟
            </Button>
            <button className="relative rounded-[8px] border border-cyan-400/20 p-2 text-cyan-100">
              <AlertTriangle className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[10px]">
                12
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5">
              <UserRound className="h-7 w-7 text-cyan-100" />
              <div>
                <div className="text-sm font-semibold text-white">张经理</div>
                <div className="text-[11px] text-slate-400">总指挥</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 p-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="当前基准方案"
            value={currentPlan.meta.name.replace("方案", "方案 ")}
            icon={ClipboardCheck}
            tone="purple"
          />
          <KpiCard
            label="可模拟变量"
            value="12"
            unit="项"
            icon={SlidersHorizontal}
            tone="cyan"
          />
          <KpiCard
            label="推荐方案"
            value={recommendedPlan.meta.name.replace("方案", "方案 ")}
            unit={recommendedPlan.meta.badge}
            icon={Sparkles}
            tone="green"
          />
          <KpiCard
            label="预计净利润"
            value={formatNumber(moneyWan(recommendedPlan.netProfit), 2)}
            unit="万元"
            icon={TrendingUp}
            tone="blue"
          />
          <KpiCard
            label="资金需求"
            value={formatNumber(recommendedPlan.cashNeed, 2)}
            unit="亿元"
            icon={WalletCards}
            tone="purple"
          />
          <KpiCard
            label="风险等级"
            value={recommendedPlan.risk}
            icon={ShieldCheck}
            tone="amber"
          />
        </section>

        <main className="grid gap-3 px-3 pb-3 xl:grid-cols-[390px,minmax(0,1fr),410px]">
          <aside className="space-y-3">
            <Panel>
              <PanelHeader
                title="模拟参数"
                icon={SlidersHorizontal}
                right={
                  <button
                    onClick={() => {
                      setTargetStorageTons(12);
                      setDailyReserveTons(2500);
                      setCapitalLimit(3.2);
                      setOutsourcedCapacityTons(3);
                      setCapacityAdjustment(12);
                      setDemandAdjustment(10);
                      setCostAdjustment(5);
                      setTargetPrice(29.4);
                    }}
                    className="text-xs text-cyan-200"
                  >
                    重置
                  </button>
                }
              />
              <div className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={batchCode} onValueChange={setBatchCode}>
                    <SelectTrigger className="h-9 rounded-[7px] border-cyan-400/20 bg-slate-950/45 text-xs text-cyan-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(snapshot?.inventoryBatches ?? []).map(batch => (
                        <SelectItem
                          key={batch.batchCode}
                          value={batch.batchCode}
                        >
                          {batch.batchCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={regionCode} onValueChange={setRegionCode}>
                    <SelectTrigger className="h-9 rounded-[7px] border-cyan-400/20 bg-slate-950/45 text-xs text-cyan-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        market?.regionOptions ?? [
                          { code: "510000", name: "四川" },
                        ]
                      ).map(region => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={value => setSelectedMonth(Number(value))}
                  >
                    <SelectTrigger className="h-9 rounded-[7px] border-cyan-400/20 bg-slate-950/45 text-xs text-cyan-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 6].map(month => (
                        <SelectItem key={month} value={String(month)}>
                          {month} 个月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex h-9 items-center gap-2 rounded-[7px] border border-cyan-400/20 bg-slate-950/45 px-3 text-xs text-cyan-100">
                    <CalendarDays className="h-4 w-4" />
                    2026-05 至 2026-09
                  </div>
                </div>
                <ParameterSlider
                  label="目标储备量"
                  value={targetStorageTons}
                  min={8}
                  max={18}
                  step={0.5}
                  suffix="万吨"
                  onChange={setTargetStorageTons}
                />
                <ParameterSlider
                  label="日储备量"
                  value={dailyReserveTons}
                  min={1000}
                  max={4000}
                  step={100}
                  suffix="吨/天"
                  onChange={setDailyReserveTons}
                />
                <div className="rounded-[8px] border border-cyan-400/12 bg-slate-950/28 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-300">目标价格</span>
                    <span className="text-cyan-100">
                      {formatNumber(targetPrice, 1)} 元/kg
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={targetPrice}
                    onChange={event =>
                      setTargetPrice(
                        clamp(Number(event.target.value) || 1, 1, 40)
                      )
                    }
                    className="h-9 rounded-[6px] border-cyan-400/20 bg-slate-950/45 text-cyan-100"
                  />
                </div>
                <ParameterSlider
                  label="资金上限"
                  value={capitalLimit}
                  min={2}
                  max={4}
                  step={0.1}
                  suffix="亿元"
                  onChange={setCapitalLimit}
                />
                <ParameterSlider
                  label="外租库容量"
                  value={outsourcedCapacityTons}
                  min={0}
                  max={8}
                  step={0.5}
                  suffix="万吨"
                  onChange={setOutsourcedCapacityTons}
                />
                <ParameterSlider
                  label="产能变化"
                  value={capacityAdjustment}
                  min={-20}
                  max={40}
                  suffix="%"
                  onChange={setCapacityAdjustment}
                />
                <ParameterSlider
                  label="需求变化"
                  value={demandAdjustment}
                  min={-20}
                  max={40}
                  suffix="%"
                  onChange={setDemandAdjustment}
                />
                <ParameterSlider
                  label="成本上升压力"
                  value={costAdjustment}
                  min={-10}
                  max={20}
                  suffix="%"
                  onChange={setCostAdjustment}
                />
                <Button
                  onClick={runSimulation}
                  className="mt-2 h-14 w-full rounded-[8px] bg-gradient-to-r from-violet-500 to-cyan-500 text-lg font-bold text-white hover:from-violet-400 hover:to-cyan-300"
                >
                  运行模拟
                </Button>
                <p className="text-center text-xs text-slate-500">
                  预计耗时：约 30 秒
                </p>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="AI 调参助手"
                icon={Bot}
                right={<span className="text-xs text-cyan-200">智能建议</span>}
              />
              <div className="space-y-3 p-3">
                <div className="h-[128px] space-y-2 overflow-y-auto">
                  {aiMessages.map(message => (
                    <p
                      key={message}
                      className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.06] p-2 text-xs leading-5 text-slate-200"
                    >
                      {message}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event =>
                      event.key === "Enter" && sendAiMessage()
                    }
                    placeholder="请输入指令，例如：降低风险并提高ROI"
                    className="h-10 rounded-[8px] border-cyan-400/20 bg-slate-950/45 text-slate-100"
                  />
                  <Button
                    onClick={sendAiMessage}
                    className="h-10 rounded-[8px] bg-blue-500 text-white hover:bg-blue-400"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Panel>
          </aside>

          <section className="space-y-3">
            <Panel>
              <PanelHeader
                title="价格预测与模拟曲线"
                icon={LineChart}
                right={
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    历史价格
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    预测价格
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    保本线
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    公斤利润
                  </div>
                }
              />
              <div className="h-[300px] p-4">
                <SvgCurve points={curvePoints} />
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              {[
                [
                  "平均售价",
                  forecast?.summary.averageSellPrice ?? targetPrice,
                  "元/kg",
                  "+2.41%",
                ],
                [
                  "保本线",
                  forecast?.summary.breakEvenPrice ??
                    selectedBatch?.unitCost ??
                    0,
                  "元/kg",
                  "+1.02%",
                ],
                [
                  "公斤利润",
                  forecast?.summary.profitPerKg ?? 0,
                  "元/kg",
                  "+0.79",
                ],
                [
                  "价格波动率",
                  Math.abs(liveHogQuote?.changeRate ?? 18.6),
                  "%",
                  "较昨日",
                ],
                [
                  "异常波动次数",
                  workspace?.alertBoard.items.filter(
                    item => item.status === "red"
                  ).length ?? 3,
                  "次",
                  "较历史 +2",
                ],
                [
                  "置信区间",
                  `${formatNumber((forecast?.summary.breakEvenPrice ?? 20) * 0.94, 2)} ~ ${formatNumber((forecast?.summary.projectedPrice ?? 28) * 1.06, 2)}`,
                  "元/kg",
                  "80%",
                ],
              ].map(([label, value, unit, sub]) => (
                <Panel key={String(label)}>
                  <div className="p-4">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="mt-2 text-[25px] font-bold text-white">
                      {typeof value === "number"
                        ? formatNumber(value, 2)
                        : value}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {unit}{" "}
                      <span className="ml-2 text-emerald-300">{sub}</span>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-4">
              {schemeRows.map(row => (
                <Panel
                  key={row.key}
                  className={cn(
                    "cursor-pointer transition",
                    selectedPlan === row.key
                      ? "border-emerald-300/70 shadow-[0_0_28px_rgba(16,185,129,0.22)]"
                      : ""
                  )}
                >
                  <button
                    onClick={() => setSelectedPlan(row.key)}
                    className="block w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[17px] font-bold text-white">
                          {row.meta.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {row.meta.short}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-[6px] border px-2 py-1 text-xs",
                          toneClass[row.meta.tone]
                        )}
                      >
                        {row.meta.badge}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <span>预计储备量</span>
                      <span className="text-right text-white">
                        {formatNumber(row.reserveTons, 1)} 万吨
                      </span>
                      <span>预计净利润</span>
                      <span className="text-right text-emerald-300">
                        {formatNumber(moneyWan(row.netProfit), 2)} 万
                      </span>
                      <span>ROI</span>
                      <span className="text-right text-cyan-200">
                        {formatNumber(row.roi, 1)}%
                      </span>
                      <span>资金使用</span>
                      <span className="text-right text-white">
                        {formatNumber(row.cashNeed, 2)} 亿
                      </span>
                      <span>仓储压力</span>
                      <span
                        className={cn(
                          "text-right",
                          row.warehousePressure > 78
                            ? "text-red-300"
                            : "text-white"
                        )}
                      >
                        {formatNumber(row.warehousePressure, 0)}%
                      </span>
                    </div>
                    <RadarMini
                      values={[
                        clamp(row.roi * 6, 10, 100),
                        100 - row.warehousePressure,
                        row.execution,
                        row.warehousePressure,
                        clamp(100 - row.cashNeed * 16, 10, 100),
                      ]}
                      tone={row.meta.tone}
                    />
                    <div className="flex items-center justify-between border-t border-cyan-400/15 pt-2 text-xs">
                      <span className="text-slate-400">风险等级</span>
                      <span
                        className={cn(
                          "rounded-[6px] border px-2 py-1",
                          row.risk.includes("高")
                            ? "border-red-400/30 bg-red-500/10 text-red-200"
                            : row.risk === "中"
                              ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        )}
                      >
                        {row.risk}
                      </span>
                    </div>
                  </button>
                </Panel>
              ))}
            </div>

            <Panel>
              <PanelHeader title="方案对比" icon={BarChart3} />
              <div className="overflow-x-auto p-3">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[1.4fr,0.9fr,0.9fr,0.9fr,0.8fr,0.8fr,0.8fr,1fr] border-b border-cyan-400/15 px-3 py-2 text-xs text-cyan-100">
                    <span>方案</span>
                    <span>储备量</span>
                    <span>净利润</span>
                    <span>资金需求</span>
                    <span>ROI</span>
                    <span>风险等级</span>
                    <span>仓储压力</span>
                    <span>推荐动作</span>
                  </div>
                  {schemeRows.map(row => (
                    <button
                      key={row.key}
                      onClick={() => setSelectedPlan(row.key)}
                      className={cn(
                        "grid w-full grid-cols-[1.4fr,0.9fr,0.9fr,0.9fr,0.8fr,0.8fr,0.8fr,1fr] items-center border-b border-cyan-400/8 px-3 py-3 text-left text-xs text-slate-300",
                        selectedPlan === row.key
                          ? "bg-emerald-400/[0.08]"
                          : "hover:bg-cyan-400/[0.04]"
                      )}
                    >
                      <span className="font-semibold text-white">
                        {row.meta.name}
                      </span>
                      <span>{formatNumber(row.reserveTons, 1)} 万吨</span>
                      <span
                        className={
                          row.netProfit >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {formatNumber(moneyWan(row.netProfit), 2)} 万
                      </span>
                      <span>{formatNumber(row.cashNeed, 2)} 亿</span>
                      <span className="text-cyan-200">
                        {formatNumber(row.roi, 1)}%
                      </span>
                      <span>{row.risk}</span>
                      <span
                        className={
                          row.warehousePressure > 78
                            ? "text-red-300"
                            : "text-emerald-300"
                        }
                      >
                        {formatNumber(row.warehousePressure, 0)}%
                      </span>
                      <span>
                        {row.key === recommendedPlan.key ? "当前推荐" : "选择"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="敏感性分析"
                icon={Gauge}
                right={
                  <span className="text-xs text-slate-400">对净利润影响</span>
                }
              />
              <div className="grid gap-3 p-4 xl:grid-cols-[180px,1fr]">
                <div className="space-y-2">
                  {["价格波动", "成本变化", "仓储费用", "销售时间"].map(
                    item => (
                      <label
                        key={item}
                        className="flex items-center gap-2 rounded-[7px] border border-cyan-400/12 bg-slate-950/30 px-3 py-2 text-xs text-slate-300"
                      >
                        <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-blue-500 text-[10px] text-white">
                          ✓
                        </span>
                        {item}
                      </label>
                    )
                  )}
                </div>
                <div className="relative h-[220px] rounded-[8px] border border-cyan-400/12 bg-slate-950/30">
                  {[0, 1, 2, 3].map(index => (
                    <div
                      key={index}
                      className="absolute left-8 right-4 border-t border-cyan-400/10"
                      style={{ top: `${20 + index * 25}%` }}
                    />
                  ))}
                  <div className="absolute bottom-8 left-8 right-4 border-t border-cyan-400/15" />
                  <div className="absolute bottom-8 left-1/2 top-4 border-l border-cyan-400/15" />
                  {sensitivityPoints.map(point => (
                    <div
                      key={point.label}
                      className={cn(
                        "absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] shadow-[0_0_18px_rgba(56,189,248,0.2)]",
                        point.tone === "blue"
                          ? "border-blue-300 bg-blue-500/70"
                          : point.tone === "green"
                            ? "border-emerald-300 bg-emerald-500/70"
                            : "border-violet-300 bg-violet-500/70"
                      )}
                      style={{
                        left: `${clamp(50 + point.x * 1.45, 8, 92)}%`,
                        top: `${clamp(50 - point.y * 18, 12, 86)}%`,
                      }}
                    >
                      <span className="sr-only">{point.label}</span>
                    </div>
                  ))}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500">
                    变量幅度
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          <aside className="space-y-3">
            <Panel>
              <PanelHeader
                title="AI 推荐结论"
                icon={Bot}
                right={
                  <span className="text-xs text-cyan-200">AI 深度分析中</span>
                }
              />
              <div className="space-y-3 p-4">
                <div className="rounded-[8px] border border-emerald-400/25 bg-emerald-500/[0.08] p-3">
                  <div className="flex items-center gap-2 text-[16px] font-bold text-emerald-200">
                    <Sparkles className="h-5 w-5" />
                    推荐方案：{recommendedPlan.meta.name}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {workspace?.agentDecision.overview ??
                      `基于当前市场价格、资金约束、仓储压力和执行难度，${recommendedPlan.meta.name} 在收益与风险之间取得较好平衡。`}
                  </p>
                </div>
                {[
                  `ROI 达到 ${formatNumber(recommendedPlan.roi, 1)}%，高于资金成本假设。`,
                  `仓储压力 ${formatNumber(recommendedPlan.warehousePressure, 0)}%，仍可通过外租库与节奏控制缓冲。`,
                  `资金使用 ${formatNumber(recommendedPlan.cashNeed, 2)} 亿元，未超过资金上限 ${formatNumber(capitalLimit, 2)} 亿元。`,
                  `执行难度 ${formatNumber(recommendedPlan.execution, 0)} 分，符合现有工厂与冷链能力边界。`,
                ].map(item => (
                  <div
                    key={item}
                    className="flex gap-2 text-xs leading-5 text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    {item}
                  </div>
                ))}
                <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                  <div className="font-semibold text-cyan-100">关键假设</div>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
                    <li>
                      价格目标基于当前批次现货价、期货映射价与季节性调整。
                    </li>
                    <li>仓储压力按储备量、外租库容量和销售节奏估算。</li>
                    <li>资金需求按储备规模、资金上限和方案风险偏好折算。</li>
                    <li>执行计划将沿用 AI 派单系统的工单与回执链路。</li>
                  </ul>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      AI 置信度：{formatNumber(aiConfidence, 0)}%
                    </span>
                    <span className="text-cyan-200">
                      数据源：市场 + 库存 + 决策模型
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                      style={{ width: `${aiConfidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="AI 智能解读" icon={Sparkles} />
              <div className="space-y-3 p-3">
                {[
                  [
                    "哪个变量影响最大？",
                    `目标价与需求变化对利润最敏感，当前目标价每提升 1 元/kg 约影响 ${formatNumber(((selectedBatch?.weightKg ?? 0) * 0.55) / 10000, 1)} 万元。`,
                  ],
                  [
                    "为什么利润变动？",
                    `玉米 ${formatNumber(cornQuote?.price ?? 0, 0)}、豆粕 ${formatNumber(soymealQuote?.price ?? 0, 0)} 与生猪 ${formatNumber(liveHogQuote?.price ?? 0, 2)} 的同步变化会推动单位成本和销售毛利变动。`,
                  ],
                  [
                    "哪个约束最关键？",
                    currentPlan.warehousePressure > 75
                      ? "仓储压力已接近上限，需要先锁定外租库或降低目标储备量。"
                      : "当前主要约束是资金占用与销售节奏，仓储仍有缓冲。",
                  ],
                  [
                    "推荐优先动作",
                    "优先锁定采购与仓储窗口，再将确认后的方案推送到 AI 派单执行中心。",
                  ],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.045] p-3"
                  >
                    <div className="font-semibold text-cyan-100">{title}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="场景管理与操作" icon={FileText} />
              <div className="space-y-3 p-4">
                <div className="rounded-[8px] border border-amber-400/25 bg-amber-500/[0.1] p-3">
                  <div className="text-xs text-slate-400">当前场景</div>
                  <div className="mt-1 text-[16px] font-bold text-amber-100">
                    {currentPlan.meta.name} /{" "}
                    {selectedBatch?.partName ?? "冻品批次"}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Button
                      onClick={saveScenario}
                      className="h-9 rounded-[7px] border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.12]"
                    >
                      <Save className="mr-1 h-4 w-4" />
                      保存
                    </Button>
                    <Button
                      onClick={() => toast.success("已生成当前方案对比快照。")}
                      className="h-9 rounded-[7px] border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.12]"
                    >
                      <BarChart3 className="mr-1 h-4 w-4" />
                      对比
                    </Button>
                    <Button
                      onClick={() =>
                        toast.success("报告已生成，可在审计记录中查看摘要。")
                      }
                      className="h-9 rounded-[7px] border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.12]"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      报告
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(savedScenarios.length
                    ? savedScenarios
                    : [
                        {
                          id: "empty",
                          name: "暂无保存方案",
                          savedAt: "-",
                          profit: currentPlan.netProfit,
                          roi: currentPlan.roi,
                          risk: currentPlan.risk,
                        },
                      ]
                  ).map(item => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr,70px,48px] items-center rounded-[7px] border border-cyan-400/12 bg-slate-950/28 px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">
                          {item.name}
                        </div>
                        <div className="mt-1 text-slate-500">
                          {item.savedAt}
                        </div>
                      </div>
                      <span className="text-emerald-300">
                        {formatNumber(moneyWan(item.profit), 1)} 万
                      </span>
                      <span className="text-cyan-200">{item.risk}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={submitStrategy}
                  disabled={confirmDecision.isPending}
                  className="h-12 w-full rounded-[8px] bg-gradient-to-r from-violet-500 to-blue-500 text-base font-bold text-white hover:from-violet-400 hover:to-blue-400"
                >
                  <ClipboardCheck className="mr-2 h-5 w-5" />
                  提交策略
                </Button>
                <Button
                  onClick={() => persistDispatch.mutate(dispatchInput)}
                  disabled={persistDispatch.isPending}
                  className="h-12 w-full rounded-[8px] bg-gradient-to-r from-blue-500 to-cyan-400 text-base font-bold text-white hover:from-blue-400 hover:to-cyan-300"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  进入派单
                </Button>
                <p className="text-center text-xs text-slate-500">
                  上次保存：
                  {savedScenarios[0]?.savedAt ??
                    formatDateTime(market?.generatedAt ?? Date.now()).slice(
                      5,
                      16
                    )}
                </p>
              </div>
            </Panel>
          </aside>
        </main>
      </div>
    </div>
  );
}
