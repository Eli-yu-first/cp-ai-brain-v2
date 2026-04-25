import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Bell,
  Bot,
  BrainCircuit,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  Factory,
  FlaskConical,
  MapPin,
  Package,
  RefreshCcw,
  ScanSearch,
  ScrollText,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  UserCircle2,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ChatTurn = {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

type EvidenceTab = "data" | "model" | "audit";

type CollaborationAgent = {
  agentId: string;
  agentName: string;
  objective: string;
  recommendation: string;
  rationale: string;
  riskLevel: "低" | "中" | "高";
  nextAction: string;
};

const panelClassName =
  "rounded-[18px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(7,22,44,0.96),rgba(4,14,30,0.9))] shadow-[0_0_0_1px_rgba(56,189,248,0.04),0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur";

const queueStatusLabel = {
  approved: "已批准",
  rejected: "已驳回",
} as const;

function formatDateTime(value: number | string | Date) {
  const date = value instanceof Date ? value : new Date(value);
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

function formatTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatCurrencyWan(value: number) {
  return `${value >= 0 ? "+" : ""}${(value / 10000).toFixed(Math.abs(value) >= 100000 ? 0 : 1)} 万元`;
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

function getAlertTone(status: "red" | "yellow" | "green") {
  if (status === "red") {
    return {
      border: "border-red-500/35",
      bg: "bg-red-500/[0.08]",
      text: "text-red-200",
      badge: "高风险",
    };
  }
  if (status === "yellow") {
    return {
      border: "border-amber-500/35",
      bg: "bg-amber-500/[0.08]",
      text: "text-amber-200",
      badge: "中风险",
    };
  }
  return {
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/[0.08]",
    text: "text-emerald-200",
    badge: "低风险",
  };
}

function getRiskLevelTone(riskLevel: "低" | "中" | "高") {
  if (riskLevel === "高") return "text-red-300";
  if (riskLevel === "中") return "text-amber-300";
  return "text-emerald-300";
}

function buildRadarPolygon(values: number[]) {
  const centerX = 110;
  const centerY = 110;
  const radius = 74;
  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
      const currentRadius = radius * clamp(value, 0.1, 1);
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;
      return `${x},${y}`;
    })
    .join(" ");
}

function Panel({
  title,
  eyebrow,
  action,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(panelClassName, className)}>
      <div className="flex items-center justify-between border-b border-cyan-400/10 px-4 py-3">
        <div>
          {eyebrow ? (
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/60">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-[22px] font-semibold tracking-[0.06em] text-slate-50">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export default function AiDecisionPage() {
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  const [regionCode, setRegionCode] = useState("510000");
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [targetPrice, setTargetPrice] = useState<number>(29.4);
  const [capacityAdjustment, setCapacityAdjustment] = useState(12);
  const [demandAdjustment, setDemandAdjustment] = useState(10);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null
  );
  const [evidenceTab, setEvidenceTab] = useState<EvidenceTab>("data");
  const [chatInput, setChatInput] = useState("");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [queueState, setQueueState] = useState<
    Record<string, "approved" | "rejected">
  >({});

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
  const { data: auditLogs } = trpc.platform.auditLogs.useQuery();

  const workspaceInput = useMemo(
    () => ({
      batchCode,
      forecastMonth: selectedMonth,
      scenarioMonth: selectedMonth,
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

  const agentInput = useMemo(
    () => ({
      batchCode,
      selectedMonth,
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

  const { data: workspace, isLoading } =
    trpc.platform.aiDecisionWorkspace.useQuery(workspaceInput, {
      enabled: Boolean(batchCode && targetPrice > 0),
    });

  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      toast.success("执行工单已生成并写入派单链路。");
    },
    onError: error => {
      toast.error(error.message || "工单生成失败，请稍后重试。");
    },
  });

  const confirmDecision = trpc.platform.confirmDecision.useMutation({
    onSuccess: async (_result, variables) => {
      setQueueState(prev => ({ ...prev, [variables.scenarioId]: "approved" }));
      await utils.platform.auditLogs.invalidate();
      toast.success("策略已写入审计日志并进入审批状态。");
    },
    onError: error => {
      toast.error(error.message || "审批提交失败。");
    },
  });

  const aiAgents = trpc.platform.aiAgents.useMutation({
    onSuccess: () => {
      toast.success("多 Agent 协同建议已刷新。");
    },
    onError: error => {
      toast.error(error.message || "多 Agent 刷新失败。");
    },
  });

  const aiChat = trpc.platform.aiChat.useMutation({
    onSuccess: result => {
      const content =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);
      setChatTurns(prev => [
        ...prev,
        {
          role: "assistant",
          content,
          timestamp: formatTime(new Date()),
        },
      ]);
    },
    onError: error => {
      toast.error(error.message || "AI 助理暂时无法响应。");
    },
  });

  const selectedBatch =
    snapshot?.inventoryBatches.find(item => item.batchCode === batchCode) ??
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
  const bestScenario =
    batchScenarios.length > 0
      ? [...batchScenarios].sort(
          (a, b) => b.netProfitPerKg - a.netProfitPerKg
        )[0]
      : null;

  useEffect(() => {
    if (!snapshot?.inventoryBatches.length) return;
    if (!snapshot.inventoryBatches.some(item => item.batchCode === batchCode)) {
      setBatchCode(snapshot.inventoryBatches[0]!.batchCode);
    }
  }, [snapshot?.inventoryBatches, batchCode]);

  useEffect(() => {
    if (!selectedBatch) return;
    setTargetPrice(Number((selectedBatch.futuresMappedPrice - 0.2).toFixed(1)));
  }, [batchCode, selectedBatch?.futuresMappedPrice]);

  useEffect(() => {
    if (!bestScenario) return;
    setSelectedScenarioId(current =>
      current && batchScenarios.some(item => item.scenarioId === current)
        ? current
        : bestScenario.scenarioId
    );
  }, [bestScenario, batchScenarios]);

  useEffect(() => {
    if (!workspace || !selectedBatch) return;
    setChatTurns([
      {
        role: "assistant",
        content: `您好，我是 AI Copilot。当前批次 ${selectedBatch.batchCode} 的建议窗口为 ${selectedMonth} 个月，系统已读取库存、行情、量化公式和调度链路。`,
        timestamp: formatTime(new Date()),
      },
      {
        role: "user",
        content: "当前利润改善空间来自哪里？是否值得立刻执行？",
        timestamp: formatTime(new Date()),
      },
      {
        role: "assistant",
        content: `当前模拟收益 ${formatCurrencyWan(workspace.simulation.summary.simulatedProfit)}，相对基线变化 ${formatCurrencyWan(workspace.simulation.summary.incrementalProfit)}。主要影响项是 ${workspace.alertBoard.items[0]?.title ?? "利润偏差"} 和 ${workspace.alertBoard.items[1]?.title ?? "价格目标可达性"}。`,
        timestamp: formatTime(new Date()),
      },
    ]);
  }, [batchCode, selectedBatch, selectedMonth, workspace]);

  const selectedScenario =
    batchScenarios.find(item => item.scenarioId === selectedScenarioId) ??
    batchScenarios[0] ??
    null;
  const selectedScenarioIndex = selectedScenario
    ? batchScenarios.findIndex(
        item => item.scenarioId === selectedScenario.scenarioId
      )
    : 0;
  const selectedPlanLabel = `方案${String.fromCharCode(65 + Math.max(0, selectedScenarioIndex))}`;

  const effectiveAgentDecision = aiAgents.data ?? workspace?.agentDecision;
  const effectiveDispatch = persistDispatch.data ?? workspace?.dispatchBoard;

  const syntheticAgents = useMemo<CollaborationAgent[]>(() => {
    const currentAgents = effectiveAgentDecision?.agents ?? [];
    if (currentAgents.length >= 4) return currentAgents;
    if (!workspace) return currentAgents;

    const dispatchConfidence = clamp(
      92 -
        workspace.executionSummary.escalatedCount * 10 -
        Math.max(0, workspace.simulation.summary.utilizationRate - 100) * 0.3,
      62,
      95
    );

    return [
      ...currentAgents,
      {
        agentId: "dispatch",
        agentName: "调度执行 Agent",
        objective: "保障工单闭环与现场节拍一致",
        recommendation:
          effectiveDispatch?.summary ?? "按派单链路推进现场协同。",
        rationale: `当前共 ${workspace.executionSummary.totalOrders} 条工单，闭环率 ${workspace.executionSummary.closureRate.toFixed(1)}%。`,
        riskLevel:
          workspace.executionSummary.escalatedCount > 0
            ? "高"
            : workspace.executionSummary.inProgressCount > 0
              ? "中"
              : "低",
        nextAction: `${dispatchConfidence.toFixed(0)}%`,
      },
    ];
  }, [effectiveAgentDecision?.agents, effectiveDispatch?.summary, workspace]);

  const planCards = batchScenarios.map((scenario, index) => {
    const projectedProfit =
      scenario.netProfitPerKg * (selectedBatch?.weightKg ?? 0);
    const roi =
      scenario.breakEvenPrice > 0
        ? (scenario.expectedSellPrice - scenario.breakEvenPrice) /
          scenario.breakEvenPrice
        : 0;
    const confidence = clamp(
      96 - scenario.riskScore * 0.45 - scenario.holdMonths * 3,
      58,
      95
    );
    return {
      ...scenario,
      id: scenario.scenarioId,
      planLabel: `方案${String.fromCharCode(65 + index)}`,
      projectedProfit,
      roi,
      confidence,
      tag: index === 0 ? "推荐" : index === 1 ? "稳进" : "观察",
    };
  });

  const selectedPlanCard =
    planCards.find(item => item.id === selectedScenario?.scenarioId) ??
    planCards[0];
  const radarValues = useMemo(() => {
    if (!workspace || !selectedPlanCard) return [0.7, 0.64, 0.52, 0.8];
    return [
      clamp((selectedPlanCard.projectedProfit / 300000 + 1) / 2, 0.28, 0.96),
      clamp(
        (workspace.simulation.summary.expectedRevenue / 600000 + 0.2) / 1.5,
        0.26,
        0.94
      ),
      clamp(1 - selectedPlanCard.riskScore / 110, 0.2, 0.9),
      clamp(
        1 -
          Math.max(0, workspace.simulation.summary.utilizationRate - 100) / 35,
        0.22,
        0.92
      ),
    ];
  }, [selectedPlanCard, workspace]);

  const queueItems = useMemo(() => {
    if (!workspace || !selectedBatch) return [];
    const scenarioQueue = planCards.map((plan, index) => ({
      id: plan.id,
      type: "scenario" as const,
      order: index + 1,
      title: `${selectedBatch.partName}${selectedMonth}个月利润提升方案（${plan.planLabel}）`,
      sender: syntheticAgents[index]?.agentName ?? "经营 Agent",
      confidence: `${plan.confidence.toFixed(0)}%`,
      impact: formatCurrencyWan(plan.projectedProfit),
      timestamp: formatTime(new Date(now.getTime() - index * 60 * 1000)),
      riskLevel: plan.riskLevel,
      status: queueState[plan.id],
    }));

    const dispatchQueue = {
      id: `dispatch-${batchCode}-${selectedMonth}`,
      type: "dispatch" as const,
      order: scenarioQueue.length + 1,
      title: `${effectiveDispatch?.escalation ? "紧急" : "标准"}派单执行方案`,
      sender:
        syntheticAgents[syntheticAgents.length - 1]?.agentName ??
        "调度执行 Agent",
      confidence: `${clamp(95 - workspace.executionSummary.blockingExceptions * 12, 58, 93).toFixed(0)}%`,
      impact: formatCurrencyWan(
        workspace.optimizationSnapshot.spatialOptimization.totalNetProfit
      ),
      timestamp: formatTime(new Date(now.getTime() - 3 * 60 * 1000)),
      riskLevel: workspace.lifecycle.hasEscalation ? "高" : "中",
      status: queueState[`dispatch-${batchCode}-${selectedMonth}`],
    };

    return [...scenarioQueue, dispatchQueue];
  }, [
    batchCode,
    effectiveDispatch?.escalation,
    now,
    planCards,
    queueState,
    selectedBatch,
    selectedMonth,
    syntheticAgents,
    workspace,
  ]);

  const evidenceRows = useMemo(() => {
    if (!workspace || !selectedBatch) return [];
    const generatedAt =
      market?.generatedAt ?? snapshot?.generatedAt ?? Date.now();
    return [
      {
        name: "库存批次主数据",
        scope: `${selectedBatch.batchCode} / ${selectedBatch.warehouse}`,
        freshness: formatDateTime(generatedAt),
        contribution: `${Math.round(selectedBatch.weightKg / 1000)} 吨`,
      },
      {
        name: "现货与期货映射",
        scope: `现货 ${selectedBatch.currentSpotPrice} / 期货映射 ${selectedBatch.futuresMappedPrice}`,
        freshness: formatDateTime(generatedAt),
        contribution: `${Math.round(((selectedBatch.futuresMappedPrice - selectedBatch.currentSpotPrice) / selectedBatch.currentSpotPrice) * 100)}%`,
      },
      {
        name: "量化决策公式",
        scope: `${selectedPlanCard?.holdMonths ?? 1} 个月持有`,
        freshness: formatDateTime(generatedAt),
        contribution: selectedPlanCard
          ? formatCurrencyWan(selectedPlanCard.projectedProfit)
          : "--",
      },
      {
        name: "What-if 资源仿真",
        scope: `${workspace.simulation.resources[0]?.slaughterHeads ?? 0} 头屠宰 / ${workspace.simulation.resources[0]?.coldChainTrips ?? 0} 车次`,
        freshness: formatDateTime(generatedAt),
        contribution: `${workspace.simulation.summary.utilizationRate.toFixed(1)}%`,
      },
      {
        name: "派单与审计闭环",
        scope: `${workspace.executionSummary.totalOrders} 条工单 / ${workspace.executionSummary.completedCount} 已完成`,
        freshness: formatDateTime(Date.now()),
        contribution: `${workspace.executionSummary.blockingExceptions} 个阻塞异常`,
      },
    ];
  }, [
    market?.generatedAt,
    selectedBatch,
    selectedPlanCard,
    snapshot?.generatedAt,
    workspace,
  ]);

  const realismChecks = useMemo(() => {
    if (!workspace || !selectedBatch || !selectedScenario) return [];
    const storageAge = selectedBatch.ageDays + selectedScenario.holdMonths * 30;
    const targetGap = workspace.forecast.summary.projectedPrice - targetPrice;
    return [
      {
        label: "目标价可达性",
        value: targetGap >= -0.5 ? "可执行" : "需下调预期",
        tone: targetGap >= -0.5 ? "emerald" : "amber",
        detail: `预测价与目标价偏差 ${targetGap.toFixed(2)} 元/公斤`,
      },
      {
        label: "库龄与持有期",
        value: storageAge <= 90 ? "可控" : "偏高",
        tone: storageAge <= 90 ? "emerald" : "red",
        detail: `当前库龄 ${selectedBatch.ageDays} 天，执行后约 ${storageAge} 天`,
      },
      {
        label: "产能可行性",
        value:
          workspace.simulation.summary.utilizationRate <= 110
            ? "可排产"
            : "需扩容",
        tone:
          workspace.simulation.summary.utilizationRate <= 110
            ? "emerald"
            : "red",
        detail: `资源利用率 ${workspace.simulation.summary.utilizationRate.toFixed(1)}%`,
      },
      {
        label: "执行闭环风险",
        value:
          workspace.executionSummary.blockingExceptions === 0
            ? "可控"
            : "需人工盯防",
        tone:
          workspace.executionSummary.blockingExceptions === 0
            ? "emerald"
            : "amber",
        detail: `${workspace.executionSummary.blockingExceptions} 个阻塞异常`,
      },
    ];
  }, [selectedBatch, selectedScenario, targetPrice, workspace]);

  const scenarioCompareRows = useMemo(() => {
    if (!selectedPlanCard) return [];
    return [
      {
        label: "基准场景",
        profit: selectedPlanCard.projectedProfit,
        roi: selectedPlanCard.roi,
        grossMargin:
          selectedPlanCard.expectedSellPrice > 0
            ? selectedPlanCard.netProfitPerKg /
              selectedPlanCard.expectedSellPrice
            : 0,
        probability: 0.6,
      },
      {
        label: "乐观场景",
        profit: selectedPlanCard.projectedProfit * 1.28,
        roi: selectedPlanCard.roi * 1.22,
        grossMargin:
          selectedPlanCard.expectedSellPrice > 0
            ? (selectedPlanCard.netProfitPerKg + 0.6) /
              (selectedPlanCard.expectedSellPrice + 0.6)
            : 0,
        probability: 0.25,
      },
      {
        label: "压力场景",
        profit: selectedPlanCard.projectedProfit * 0.56,
        roi: selectedPlanCard.roi * 0.62,
        grossMargin:
          selectedPlanCard.expectedSellPrice > 0
            ? Math.max(0, selectedPlanCard.netProfitPerKg - 0.8) /
              selectedPlanCard.expectedSellPrice
            : 0,
        probability: 0.15,
      },
    ];
  }, [selectedPlanCard]);

  const timelineItems = useMemo(() => {
    const logs = (auditLogs ?? []).slice(0, 5).map(item => ({
      id: item.id,
      time: formatDateTime(item.createdAt),
      title: item.actionType,
      subtitle: item.decision,
      status: item.status,
      metric: item.afterValue,
      risk: item.riskLevel,
    }));

    if (logs.length >= 4) return logs;

    const dispatchItems =
      effectiveDispatch?.workOrders.map(order => ({
        id: order.orderId,
        time: order.scheduledTime,
        title: `${order.factory}${order.role}执行单`,
        subtitle: `${order.quantity.toLocaleString()} ${order.role === "司机" ? "车次" : order.role === "仓储管理员" ? "托盘" : "头"}`,
        status: order.priority,
        metric: order.operationRequirement,
        risk:
          order.priority === "P1"
            ? "高"
            : order.priority === "P2"
              ? "中"
              : "低",
      })) ?? [];

    return [...logs, ...dispatchItems].slice(0, 5);
  }, [auditLogs, effectiveDispatch?.workOrders]);

  const quickPrompts = [
    "优化当前利润最好的执行方案",
    "评估原料成本再下降 10% 的影响",
    "下一步应该优先审批哪一项？",
  ];

  const selectedRegionName =
    market?.regionOptions.find(option => option.code === regionCode)?.name ??
    market?.selectedRegionName ??
    "四川";
  const refreshLabel = formatDateTime(
    market?.generatedAt ?? snapshot?.generatedAt ?? Date.now()
  );

  const sendChat = () => {
    const content = chatInput.trim();
    if (!content) return;

    const nextTurns = [
      ...chatTurns,
      {
        role: "user" as const,
        content,
        timestamp: formatTime(new Date()),
      },
    ];

    setChatTurns(nextTurns);
    setChatInput("");
    aiChat.mutate({
      messages: nextTurns.map(item => ({
        role: item.role,
        content: item.content,
      })),
      context: {
        batchCode,
        timeframe: "month",
        regionCode,
      },
    });
  };

  const runQueueApprove = (scenarioId: string) => {
    confirmDecision.mutate({
      batchCode,
      scenarioId,
      operatorRole: "strategist",
      operatorName: "AI 决策工作台",
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#020814] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_50%_35%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,#03101f_0%,#020814_55%,#041427_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.28),transparent)] opacity-40 blur-3xl" />

      <div className="relative z-10">
        <header className="border-b border-cyan-400/10 px-4 py-3">
          <div className="grid items-center gap-4 xl:grid-cols-[1fr,auto,1fr]">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[18px] font-semibold tracking-[0.05em] text-white">
                  <span>四川眉山</span>
                  <ChevronDown className="h-4 w-4 text-cyan-300/70" />
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  AI 决策工作台 &nbsp;&gt;&nbsp; 决策协同空间 &nbsp;&nbsp;
                  省级行情映射：{selectedRegionName}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[42px] font-semibold tracking-[0.12em] text-white">
                AI 决策工作台
              </div>
              <div className="mt-1 text-xs tracking-[0.42em] text-cyan-300/55">
                人机共创 · 智能决策 · 价值闭环
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">数据刷新</div>
                <div className="text-sm font-medium text-cyan-100">
                  {refreshLabel}
                </div>
              </div>
              <div className="rounded-full border border-cyan-400/15 p-2 text-slate-300">
                <RefreshCcw className="h-4 w-4" />
              </div>
              <div className="relative rounded-full border border-cyan-400/15 p-2 text-slate-300">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {(workspace?.alertBoard.items.filter(
                    item => item.status === "red"
                  ).length ?? 0) + 8}
                </span>
              </div>
              <div className="rounded-full border border-cyan-400/15 p-2 text-slate-300">
                <Settings2 className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-3 rounded-full border border-cyan-400/15 bg-white/[0.04] px-3 py-1.5">
                <UserCircle2 className="h-8 w-8 text-cyan-200" />
                <div>
                  <div className="text-sm font-semibold text-white">潘猛</div>
                  <div className="text-xs text-slate-400">公司决策主管</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-3 pt-3">
          <div className={cn(panelClassName, "px-4 py-3")}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr,1.2fr,0.7fr,0.9fr,1fr,1fr]">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  Region
                </div>
                <Select value={regionCode} onValueChange={setRegionCode}>
                  <SelectTrigger className="h-11 rounded-xl border-cyan-400/15 bg-[#071628] text-white">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      market?.regionOptions ?? [
                        { code: "510000", name: "四川" },
                      ]
                    ).map(option => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  Batch
                </div>
                <Select value={batchCode} onValueChange={setBatchCode}>
                  <SelectTrigger className="h-11 rounded-xl border-cyan-400/15 bg-[#071628] text-white">
                    <SelectValue placeholder="选择批次" />
                  </SelectTrigger>
                  <SelectContent>
                    {(snapshot?.inventoryBatches ?? []).map(batch => (
                      <SelectItem key={batch.batchCode} value={batch.batchCode}>
                        {batch.batchCode} · {batch.partName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  Window
                </div>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={value => setSelectedMonth(Number(value))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-cyan-400/15 bg-[#071628] text-white">
                    <SelectValue placeholder="决策周期" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {month} 个月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  Target
                </div>
                <Input
                  type="number"
                  step="0.1"
                  value={targetPrice}
                  onChange={event => setTargetPrice(Number(event.target.value))}
                  className="h-11 rounded-xl border-cyan-400/15 bg-[#071628] text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  <span>Capacity</span>
                  <span>{capacityAdjustment}%</span>
                </div>
                <Slider
                  value={[capacityAdjustment]}
                  min={-20}
                  max={40}
                  step={1}
                  onValueChange={value => setCapacityAdjustment(value[0] ?? 0)}
                  className="[&_[data-slot=slider-range]]:bg-cyan-400 [&_[data-slot=slider-thumb]]:border-cyan-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-cyan-300/55">
                  <span>Demand</span>
                  <span>{demandAdjustment}%</span>
                </div>
                <Slider
                  value={[demandAdjustment]}
                  min={-20}
                  max={40}
                  step={1}
                  onValueChange={value => setDemandAdjustment(value[0] ?? 0)}
                  className="[&_[data-slot=slider-range]]:bg-violet-400 [&_[data-slot=slider-thumb]]:border-violet-300"
                />
              </div>
            </div>
          </div>
        </div>

        <main className="grid gap-3 px-3 py-3 xl:grid-cols-[360px,minmax(0,1fr),390px]">
          <div className="flex min-h-0 flex-col gap-3">
            <Panel
              title="AI Copilot"
              eyebrow="GPT-4o 企业版"
              className="min-h-[720px]"
              action={
                <div className="flex items-center gap-2 text-slate-400">
                  <Bot className="h-4 w-4 text-cyan-200" />
                  <Sparkles className="h-4 w-4 text-cyan-200" />
                </div>
              }
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        您好，潘猛
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        当前批次 {selectedBatch?.batchCode ?? "--"}{" "}
                        已联通库存、行情、量化公式、审计日志与执行回执。
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    <li>解析库存与行情耦合，识别真实利润改善空间。</li>
                    <li>根据 What-if 参数推演产能、冷链与仓储可行性。</li>
                    <li>协调多 Agent，生成审批建议与执行工单。</li>
                  </ul>
                </div>

                <ScrollArea className="h-[360px] rounded-2xl border border-cyan-400/10 bg-[#061223]/70 p-3">
                  <div className="space-y-4 pr-3">
                    {chatTurns.map((turn, index) => (
                      <div
                        key={`${turn.timestamp}-${index}`}
                        className={cn(
                          "flex",
                          turn.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-7",
                            turn.role === "user"
                              ? "border-cyan-400/25 bg-cyan-500/[0.14] text-cyan-50"
                              : "border-white/8 bg-white/[0.04] text-slate-200"
                          )}
                        >
                          <div>{turn.content}</div>
                          <div className="mt-2 text-right text-[11px] text-slate-500">
                            {turn.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                    {aiChat.isPending ? (
                      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 text-sm text-cyan-100">
                        AI 正在结合当前库存、行情和审批链路生成建议...
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-200">
                    您可以继续追问：
                  </div>
                  <div className="grid gap-2">
                    {quickPrompts.map(prompt => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setChatInput(prompt)}
                        className="rounded-xl border border-cyan-400/12 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-400/[0.08]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/12 bg-[#061223]/80 p-2">
                  <Input
                    value={chatInput}
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder="请输入您的问题，或发起新的协同指令"
                    className="h-12 border-0 bg-transparent text-white shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    onClick={sendChat}
                    disabled={aiChat.isPending}
                    className="h-11 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    发送
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="真实性与可行性校验" eyebrow="Decision Audit">
              <div className="space-y-3">
                {realismChecks.map(item => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      item.tone === "emerald"
                        ? "border-emerald-500/25 bg-emerald-500/[0.08]"
                        : item.tone === "amber"
                          ? "border-amber-500/25 bg-amber-500/[0.08]"
                          : "border-red-500/25 bg-red-500/[0.08]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white">
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          item.tone === "emerald"
                            ? "text-emerald-300"
                            : item.tone === "amber"
                              ? "text-amber-300"
                              : "text-red-300"
                        )}
                      >
                        {item.value}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <Panel
              title="多 Agent 协同空间"
              eyebrow="Human + Machine Collaboration"
              action={
                <Button
                  type="button"
                  onClick={() => aiAgents.mutate(agentInput)}
                  disabled={aiAgents.isPending}
                  className="h-10 rounded-xl border border-cyan-400/18 bg-cyan-400/[0.08] text-cyan-100 hover:bg-cyan-400/[0.14]"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  刷新协同建议
                </Button>
              }
            >
              <div className="grid gap-3 xl:grid-cols-4">
                {syntheticAgents.map(
                  (agent: CollaborationAgent, index: number) => {
                    const confidenceLabel =
                      index === syntheticAgents.length - 1 &&
                      agent.agentId === "dispatch"
                        ? agent.nextAction
                        : `${clamp(95 - (agent.riskLevel === "高" ? 12 : agent.riskLevel === "中" ? 7 : 3) - index * 2, 62, 96)}%`;
                    const accent =
                      index === 0
                        ? "from-cyan-500/20 to-blue-500/10"
                        : index === 1
                          ? "from-emerald-500/20 to-teal-500/10"
                          : index === 2
                            ? "from-violet-500/20 to-indigo-500/10"
                            : "from-amber-500/20 to-orange-500/10";
                    return (
                      <div
                        key={`${agent.agentId}-${index}`}
                        className={cn(
                          "rounded-2xl border border-cyan-400/15 bg-gradient-to-br p-4",
                          accent
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-lg font-semibold text-white">
                              {agent.agentName}
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              置信度{" "}
                              <span className="font-semibold text-cyan-200">
                                {confidenceLabel}
                              </span>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "text-sm font-semibold",
                              getRiskLevelTone(agent.riskLevel)
                            )}
                          >
                            {agent.riskLevel}
                          </div>
                        </div>
                        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                          <div>
                            <div className="text-xs tracking-[0.24em] text-cyan-300/55">
                              建议
                            </div>
                            <div className="mt-1">{agent.recommendation}</div>
                          </div>
                          <div>
                            <div className="text-xs tracking-[0.24em] text-cyan-300/55">
                              依据
                            </div>
                            <div className="mt-1 text-slate-300">
                              {agent.rationale}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </Panel>

            <Panel
              title="策略画布（人机共创）"
              eyebrow="Strategy Canvas"
              className="min-h-[520px]"
            >
              <div className="grid gap-4 xl:grid-cols-[0.92fr,1.18fr,0.76fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-cyan-200">
                      <Target className="h-4 w-4" />
                      <div className="text-lg font-semibold text-white">
                        当前目标
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-semibold text-white">
                        提升 {selectedBatch?.partName ?? "--"} 业务利润
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {new Date().getFullYear()} Q2 决策窗口
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] p-3">
                        <div className="text-xs tracking-[0.24em] text-cyan-300/55">
                          目标利润增量
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-emerald-300">
                          {workspace
                            ? formatCurrencyWan(
                                workspace.simulation.summary.incrementalProfit
                              )
                            : "--"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                        <div className="text-xs tracking-[0.24em] text-cyan-300/55">
                          目标毛利提升
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-cyan-100">
                          {selectedPlanCard
                            ? `${((selectedPlanCard.netProfitPerKg / Math.max(selectedPlanCard.expectedSellPrice, 1)) * 100).toFixed(1)}%`
                            : "--"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-7 text-slate-300">
                      当前选中{" "}
                      <span className="font-semibold text-cyan-100">
                        {selectedPlanLabel}
                      </span>
                      ，以
                      <span className="font-semibold text-cyan-100">
                        {" "}
                        {selectedScenario?.holdMonths ?? "--"} 个月
                      </span>
                      持有窗口， 结合现货、期货映射与库存成本完成测算。
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-white">
                      约束条件
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <div className="rounded-full border border-cyan-400/12 bg-cyan-400/[0.06] px-3 py-2 text-slate-200">
                        预算占用：
                        {selectedBatch
                          ? formatCurrencyWan(
                              selectedBatch.weightKg * selectedBatch.unitCost
                            )
                          : "--"}
                      </div>
                      <div className="rounded-full border border-cyan-400/12 bg-white/[0.04] px-3 py-2 text-slate-200">
                        库龄上限：
                        {selectedBatch
                          ? `${selectedBatch.ageDays + (selectedScenario?.holdMonths ?? 0) * 30} 天`
                          : "--"}
                      </div>
                      <div className="rounded-full border border-cyan-400/12 bg-white/[0.04] px-3 py-2 text-slate-200">
                        冷链服务水平：
                        {workspace
                          ? `${workspace.optimizationSnapshot.timeOptimization.serviceLevel.toFixed(1)}%`
                          : "--"}
                      </div>
                      <div className="rounded-full border border-cyan-400/12 bg-white/[0.04] px-3 py-2 text-slate-200">
                        合规风险：{selectedScenario?.riskLevel ?? "--"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          决策选项
                        </div>
                        <div className="text-sm text-slate-400">
                          可多维组合，但当前以单方案主批示为主
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        基于当前系统真实批次与行情自动生成
                      </div>
                    </div>
                    <div className="grid gap-3 xl:grid-cols-3">
                      {planCards.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedScenarioId(plan.id)}
                          className={cn(
                            "rounded-2xl border p-4 text-left transition",
                            selectedScenarioId === plan.id
                              ? "border-cyan-300/45 bg-cyan-400/[0.08] shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                              : "border-cyan-400/12 bg-white/[0.03] hover:border-cyan-300/28 hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold text-white">
                              {plan.planLabel}
                              {plan.tag === "推荐" ? "（推荐）" : ""}
                            </div>
                            <div className="rounded-full border border-cyan-400/12 px-2 py-1 text-xs text-cyan-200">
                              {plan.tag}
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-slate-300">
                            {plan.reason}
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-xs tracking-[0.2em] text-slate-500">
                                预估增利
                              </div>
                              <div className="mt-1 font-semibold text-emerald-300">
                                {formatCurrencyWan(plan.projectedProfit)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs tracking-[0.2em] text-slate-500">
                                预估 ROI
                              </div>
                              <div className="mt-1 font-semibold text-cyan-100">
                                {plan.roi.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs tracking-[0.2em] text-slate-500">
                                置信度
                              </div>
                              <div className="mt-1 font-semibold text-white">
                                {plan.confidence.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <FlaskConical className="h-4 w-4 text-cyan-200" />
                      假设与场景（What-if）
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1fr,0.96fr]">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                            <span>目标价</span>
                            <span>{targetPrice.toFixed(1)} 元/公斤</span>
                          </div>
                          <Slider
                            value={[targetPrice]}
                            min={Math.max(
                              1,
                              (selectedBatch?.currentSpotPrice ?? 10) - 2
                            )}
                            max={(selectedBatch?.futuresMappedPrice ?? 35) + 3}
                            step={0.1}
                            onValueChange={value =>
                              setTargetPrice(
                                Number((value[0] ?? targetPrice).toFixed(1))
                              )
                            }
                            className="[&_[data-slot=slider-range]]:bg-cyan-400 [&_[data-slot=slider-thumb]]:border-cyan-300"
                          />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                            <span>产能变化</span>
                            <span>{capacityAdjustment}%</span>
                          </div>
                          <Slider
                            value={[capacityAdjustment]}
                            min={-20}
                            max={40}
                            step={1}
                            onValueChange={value =>
                              setCapacityAdjustment(value[0] ?? 0)
                            }
                            className="[&_[data-slot=slider-range]]:bg-sky-400 [&_[data-slot=slider-thumb]]:border-sky-300"
                          />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                            <span>需求变化</span>
                            <span>{demandAdjustment}%</span>
                          </div>
                          <Slider
                            value={[demandAdjustment]}
                            min={-20}
                            max={40}
                            step={1}
                            onValueChange={value =>
                              setDemandAdjustment(value[0] ?? 0)
                            }
                            className="[&_[data-slot=slider-range]]:bg-violet-400 [&_[data-slot=slider-thumb]]:border-violet-300"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-cyan-400/12 bg-[#061223]/80 p-4">
                        <div className="mb-4 text-lg font-semibold text-white">
                          场景对比（{selectedPlanLabel}）
                        </div>
                        <div className="space-y-3">
                          {scenarioCompareRows.map(row => (
                            <div
                              key={row.label}
                              className="grid grid-cols-[0.9fr,0.9fr,0.7fr,0.7fr] gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-sm"
                            >
                              <div className="font-semibold text-white">
                                {row.label}
                              </div>
                              <div
                                className={cn(
                                  "font-semibold",
                                  row.label === "压力场景"
                                    ? "text-red-300"
                                    : "text-emerald-300"
                                )}
                              >
                                {formatCurrencyWan(row.profit)}
                              </div>
                              <div className="text-cyan-100">
                                {row.roi.toFixed(2)}
                              </div>
                              <div className="text-slate-300">
                                {Math.round(row.probability * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                      <Workflow className="h-4 w-4 text-cyan-200" />
                      影响分析（{selectedPlanLabel}）
                    </div>
                    <div className="flex items-center justify-center">
                      <svg
                        width="220"
                        height="220"
                        viewBox="0 0 220 220"
                        className="overflow-visible"
                      >
                        {[1, 0.75, 0.5, 0.25].map(level => (
                          <polygon
                            key={level}
                            points={buildRadarPolygon([
                              level,
                              level,
                              level,
                              level,
                            ])}
                            fill="none"
                            stroke="rgba(148,163,184,0.18)"
                            strokeWidth="1"
                          />
                        ))}
                        <line
                          x1="110"
                          y1="18"
                          x2="110"
                          y2="202"
                          stroke="rgba(148,163,184,0.18)"
                        />
                        <line
                          x1="18"
                          y1="110"
                          x2="202"
                          y2="110"
                          stroke="rgba(148,163,184,0.18)"
                        />
                        <polygon
                          points={buildRadarPolygon(radarValues)}
                          fill="rgba(56,189,248,0.26)"
                          stroke="rgba(96,165,250,0.92)"
                          strokeWidth="2"
                        />
                        <circle cx="110" cy="110" r="3" fill="#7dd3fc" />
                        <text
                          x="110"
                          y="10"
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize="12"
                        >
                          财务影响
                        </text>
                        <text
                          x="206"
                          y="114"
                          textAnchor="start"
                          fill="#cbd5e1"
                          fontSize="12"
                        >
                          客户影响
                        </text>
                        <text
                          x="110"
                          y="216"
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize="12"
                        >
                          运营可行性
                        </text>
                        <text
                          x="12"
                          y="114"
                          textAnchor="end"
                          fill="#cbd5e1"
                          fontSize="12"
                        >
                          风险水平
                        </text>
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">财务影响</div>
                        <div className="mt-1 text-lg font-semibold text-cyan-100">
                          {(radarValues[0] * 10).toFixed(1)}/10
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">客户影响</div>
                        <div className="mt-1 text-lg font-semibold text-cyan-100">
                          {(radarValues[1] * 10).toFixed(1)}/10
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">风险水平</div>
                        <div className="mt-1 text-lg font-semibold text-cyan-100">
                          {(radarValues[2] * 10).toFixed(1)}/10
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">运营可行性</div>
                        <div className="mt-1 text-lg font-semibold text-cyan-100">
                          {(radarValues[3] * 10).toFixed(1)}/10
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                    <div className="mb-3 text-lg font-semibold text-white">
                      资源测算快照
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">屠宰头数</div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {workspace
                            ? formatNumber(
                                workspace.simulation.resources[0]
                                  ?.slaughterHeads ?? 0
                              )
                            : "--"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">冷链车次</div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {workspace
                            ? formatNumber(
                                workspace.simulation.resources[0]
                                  ?.coldChainTrips ?? 0
                              )
                            : "--"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">仓储吨位</div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {workspace
                            ? `${workspace.simulation.resources[0]?.storageTons.toFixed(2) ?? "--"} 吨`
                            : "--"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="text-slate-400">服务水平</div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {workspace
                            ? `${workspace.optimizationSnapshot.timeOptimization.serviceLevel.toFixed(1)}%`
                            : "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="决策历史与行动跟踪" eyebrow="Timeline & Closure">
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-3">
                  {timelineItems.map(item => (
                    <div
                      key={item.id}
                      className="w-[240px] rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4"
                    >
                      <div className="text-sm text-slate-400">{item.time}</div>
                      <div className="mt-3 text-lg font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {item.subtitle}
                      </div>
                      <div className="mt-4 text-sm text-slate-400">
                        {item.metric}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="rounded-full border border-cyan-400/12 px-2 py-1 text-xs text-cyan-200">
                          {item.status}
                        </div>
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            getRiskLevelTone(item.risk as "低" | "中" | "高")
                          )}
                        >
                          {item.risk}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <Panel
              title={`决策审核队列（${queueItems.length}）`}
              eyebrow="Approval Queue"
            >
              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-3">
                  {queueItems.map(item => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                            {item.order}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm text-slate-400">
                              发起人：{item.sender} &nbsp;&nbsp; 置信度：
                              <span className="text-cyan-200">
                                {item.confidence}
                              </span>
                              &nbsp;&nbsp; 预估影响：
                              <span className="text-emerald-300">
                                {item.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {item.timestamp}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if (item.type === "scenario") {
                              runQueueApprove(item.id);
                            } else {
                              persistDispatch.mutate(agentInput);
                              setQueueState(prev => ({
                                ...prev,
                                [item.id]: "approved",
                              }));
                            }
                          }}
                          disabled={
                            confirmDecision.isPending ||
                            persistDispatch.isPending
                          }
                          className="h-9 rounded-xl bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                        >
                          批准
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setQueueState(prev => ({
                              ...prev,
                              [item.id]: "rejected",
                            }));
                            toast.success("该项已标记为驳回，等待调整。");
                          }}
                          className="h-9 rounded-xl border border-cyan-400/16 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                        >
                          驳回
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (item.type === "scenario") {
                              setSelectedScenarioId(item.id);
                              setEvidenceTab("model");
                            }
                            toast.success("已切换到对应方案，可继续修改参数。");
                          }}
                          className="h-9 rounded-xl border border-cyan-400/16 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                        >
                          修改
                        </Button>
                        <Button
                          type="button"
                          onClick={() => persistDispatch.mutate(agentInput)}
                          disabled={persistDispatch.isPending}
                          className="h-9 rounded-xl border border-amber-400/18 bg-amber-400/[0.08] text-amber-100 hover:bg-amber-400/[0.14]"
                        >
                          生成工单
                        </Button>
                        {item.status ? (
                          <div className="ml-auto rounded-full border border-cyan-400/12 px-3 py-1 text-xs text-cyan-100">
                            {queueStatusLabel[item.status]}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Panel>

            <Panel
              title={`证据与数据溯源（${selectedPlanLabel}）`}
              eyebrow="Evidence & Traceability"
            >
              <div className="flex gap-2">
                {[
                  { key: "data" as const, label: "数据来源" },
                  { key: "model" as const, label: "模型与算法" },
                  { key: "audit" as const, label: "分析过程" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEvidenceTab(tab.key)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition",
                      evidenceTab === tab.key
                        ? "border-cyan-300/35 bg-cyan-400/[0.08] text-cyan-100"
                        : "border-cyan-400/12 bg-white/[0.03] text-slate-300 hover:border-cyan-300/22"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-400/12 bg-[#061223]/70">
                {evidenceTab === "data" ? (
                  <div className="divide-y divide-cyan-400/8">
                    <div className="grid grid-cols-[1.1fr,1fr,0.9fr,0.6fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <div>数据源</div>
                      <div>范围</div>
                      <div>时效性</div>
                      <div>贡献度</div>
                    </div>
                    {evidenceRows.map(row => (
                      <div
                        key={row.name}
                        className="grid grid-cols-[1.1fr,1fr,0.9fr,0.6fr] gap-3 px-4 py-3 text-sm"
                      >
                        <div className="font-medium text-white">{row.name}</div>
                        <div className="text-slate-300">{row.scope}</div>
                        <div className="text-slate-400">{row.freshness}</div>
                        <div className="font-semibold text-cyan-200">
                          {row.contribution}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {evidenceTab === "model" ? (
                  <div className="space-y-4 p-4 text-sm leading-7 text-slate-300">
                    <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2 text-white">
                        <Database className="h-4 w-4 text-cyan-200" />
                        量化决策核心逻辑
                      </div>
                      <div>
                        方案收益 = 预计售价 - 保本价；保本价 = 当前单位成本 +
                        未来持有成本；预计售价 = 现货价 + 期货映射价修正 +
                        季节性修正 + 供给修正。
                      </div>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2 text-white">
                        <ScanSearch className="h-4 w-4 text-cyan-200" />
                        当前方案真实性审查
                      </div>
                      <div className="space-y-3">
                        {realismChecks.map(item => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">
                                {item.label}
                              </span>
                              <span
                                className={cn(
                                  "font-semibold",
                                  item.tone === "emerald"
                                    ? "text-emerald-300"
                                    : item.tone === "amber"
                                      ? "text-amber-300"
                                      : "text-red-300"
                                )}
                              >
                                {item.value}
                              </span>
                            </div>
                            <div className="mt-1 text-slate-400">
                              {item.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {evidenceTab === "audit" ? (
                  <div className="space-y-3 p-4">
                    {(auditLogs ?? []).slice(0, 5).map(log => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-cyan-400/12 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-white">
                            {log.actionType}
                          </div>
                          <div className="text-sm text-slate-500">
                            {formatDateTime(log.createdAt)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          {log.decision}
                        </div>
                        <div className="mt-3 text-sm text-slate-400">
                          {log.afterValue}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel title="下一步建议动作" eyebrow="Next Actions">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/12 bg-white/[0.03] px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      审核并确认当前首选方案
                    </div>
                    <div className="text-sm text-slate-400">
                      基于 {selectedPlanLabel} 与实时证据链完成批示
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      selectedScenario &&
                      runQueueApprove(selectedScenario.scenarioId)
                    }
                    disabled={!selectedScenario || confirmDecision.isPending}
                    className="rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    去处理
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/12 bg-white/[0.03] px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      生成执行工单并分配责任人
                    </div>
                    <div className="text-sm text-slate-400">
                      将策略结果落到厂长、司机、仓储管理员链路
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => persistDispatch.mutate(agentInput)}
                    disabled={persistDispatch.isPending}
                    className="rounded-xl border border-cyan-400/16 bg-white/[0.05] text-cyan-100 hover:bg-white/[0.08]"
                  >
                    去生成
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/12 bg-white/[0.03] px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      设置监控指标与预警规则
                    </div>
                    <div className="text-sm text-slate-400">
                      围绕利润偏差、库龄、产能负荷和异常升级持续盯盘
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setEvidenceTab("model");
                      toast.success("已切换到模型与校验视图，可继续审查规则。");
                    }}
                    className="rounded-xl border border-cyan-400/16 bg-white/[0.05] text-cyan-100 hover:bg-white/[0.08]"
                  >
                    去设置
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </main>

        <div className="px-3 pb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className={cn(panelClassName, "px-4 py-3")}>
              <div className="flex items-center gap-2 text-slate-400">
                <Package className="h-4 w-4 text-cyan-200" />
                <span>库存批次</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {selectedBatch?.weightKg
                  ? `${formatNumber(selectedBatch.weightKg)} kg`
                  : "--"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                库龄 {selectedBatch?.ageDays ?? "--"} 天
              </div>
            </div>

            <div className={cn(panelClassName, "px-4 py-3")}>
              <div className="flex items-center gap-2 text-slate-400">
                <Factory className="h-4 w-4 text-cyan-200" />
                <span>行情基线</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {liveHogQuote ? `${liveHogQuote.price} 元/公斤` : "--"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                玉米 {cornQuote?.price ?? "--"} / 豆粕{" "}
                {soymealQuote?.price ?? "--"}
              </div>
            </div>

            <div className={cn(panelClassName, "px-4 py-3")}>
              <div className="flex items-center gap-2 text-slate-400">
                <Truck className="h-4 w-4 text-cyan-200" />
                <span>执行闭环</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {workspace
                  ? `${workspace.executionSummary.completedCount}/${workspace.executionSummary.totalOrders}`
                  : "--"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                闭环率{" "}
                {workspace
                  ? `${workspace.executionSummary.closureRate.toFixed(1)}%`
                  : "--"}
              </div>
            </div>

            <div className={cn(panelClassName, "px-4 py-3")}>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock3 className="h-4 w-4 text-cyan-200" />
                <span>系统时钟</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {formatTime(now)}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {isLoading
                  ? "正在加载..."
                  : `当前日期 ${formatDateTime(now).slice(0, 10)}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
