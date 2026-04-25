import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TacticalBackdrop, useOperationLog } from "@/components/ai/TacticalEffects";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  GitBranch,
  Layers3,
  LockKeyhole,
  MessageSquare,
  Mic,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  TableProperties,
  UploadCloud,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type ReceiptStatus = "待确认" | "已接单" | "执行中" | "已完成" | "超时升级";
type RoleName = "厂长" | "司机" | "仓储管理员";
type StrategyMode = "baseline" | "speed" | "audit" | "risk";

const strategyModes: Record<
  StrategyMode,
  {
    name: string;
    intent: string;
    livePigPriceAdjustment: number;
    capacityMultiplier: number;
    storageCostMultiplier: number;
    riskBias: number;
  }
> = {
  baseline: {
    name: "均衡闭环",
    intent: "利润、SLA、审计风险均衡推进",
    livePigPriceAdjustment: 0,
    capacityMultiplier: 1.08,
    storageCostMultiplier: 1,
    riskBias: 0,
  },
  speed: {
    name: "快速执行",
    intent: "优先压缩执行周期与超时风险",
    livePigPriceAdjustment: -0.2,
    capacityMultiplier: 1.18,
    storageCostMultiplier: 1.04,
    riskBias: -8,
  },
  audit: {
    name: "审计优先",
    intent: "优先保证合规、留痕与审批完整",
    livePigPriceAdjustment: -0.45,
    capacityMultiplier: 0.96,
    storageCostMultiplier: 0.92,
    riskBias: -14,
  },
  risk: {
    name: "风险压降",
    intent: "先冻结高风险动作，再推进低风险工单",
    livePigPriceAdjustment: -0.7,
    capacityMultiplier: 0.9,
    storageCostMultiplier: 0.86,
    riskBias: -20,
  },
};

const statusFlow: Array<{
  label: ReceiptStatus | "已审批" | "已复盘";
  time: string;
  tone: "green" | "blue" | "cyan" | "red" | "slate";
}> = [
  { label: "待确认", time: "07-01 15:22", tone: "green" },
  { label: "已接单", time: "07-01 15:35", tone: "green" },
  { label: "执行中", time: "07-01 16:02", tone: "blue" },
  { label: "已完成", time: "-", tone: "cyan" },
  { label: "超时升级", time: "-", tone: "red" },
  { label: "已审批", time: "-", tone: "slate" },
  { label: "已复盘", time: "-", tone: "slate" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatTime(value: number | Date | undefined) {
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
        "relative overflow-hidden rounded-[8px] border border-cyan-500/30 bg-[#06182f]/90 shadow-[inset_0_1px_0_rgba(103,232,249,0.16),0_0_28px_rgba(14,116,195,0.2)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.1),transparent_37%,rgba(59,130,246,0.08))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SectionTitle({
  index,
  title,
  right,
}: {
  index: number;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-cyan-400/15 px-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/50 bg-cyan-400/[0.1] text-lg font-bold text-cyan-100">
          {index}
        </span>
        <h2 className="text-[18px] font-bold text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status.includes("超时") || status.includes("高")
      ? "border-red-400/35 bg-red-500/[0.12] text-red-200"
      : status.includes("完成") ||
          status.includes("已接") ||
          status.includes("已归档")
        ? "border-emerald-400/35 bg-emerald-500/[0.12] text-emerald-200"
        : status.includes("执行")
          ? "border-blue-400/35 bg-blue-500/[0.12] text-blue-200"
          : "border-amber-400/35 bg-amber-500/[0.12] text-amber-200";
  return (
    <span className={cn("w-fit rounded-[5px] border px-2 py-1 text-xs", cls)}>
      {status}
    </span>
  );
}

function CircleScore({ value, label }: { value: number; label: string }) {
  const pct = clamp(value, 0, 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-20 w-20 place-items-center rounded-full text-xl font-bold text-cyan-100"
        style={{
          background: `conic-gradient(#22d3ee ${pct * 3.6}deg, rgba(15,23,42,0.9) 0deg)`,
        }}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#06182f]">
          {formatNumber(value, 0)}%
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs text-slate-400">
          按真实接口返回数据完整性折算
        </div>
      </div>
    </div>
  );
}

function MiniPhone({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-[220px] rounded-[30px] border-4 border-slate-950 bg-slate-950 p-2 shadow-[0_0_32px_rgba(14,165,233,0.25)]">
      <div className="rounded-[24px] border border-cyan-400/25 bg-[#08214a] p-3">
        <div className="mb-3 flex items-center justify-between text-xs text-white">
          <span>9:41</span>
          <span className="font-semibold">{title}</span>
          <Smartphone className="h-4 w-4 text-cyan-200" />
        </div>
        {children}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  color = "bg-cyan-300",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="grid grid-cols-[70px,1fr,34px] items-center gap-2 text-xs">
      <span className="text-slate-300">{label}</span>
      <span className="h-1.5 rounded-full bg-slate-800">
        <span
          className={cn("block h-full rounded-full", color)}
          style={{ width: `${clamp(value, 4, 100)}%` }}
        />
      </span>
      <span className="text-right text-slate-400">
        {formatNumber(value, 0)}
      </span>
    </div>
  );
}

export default function AiGovernanceClosurePage() {
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [activeMenu, setActiveMenu] = useState("工单列表");
  const [selectedApprovalCard, setSelectedApprovalCard] = useState("高风险库存策略");
  const [approvalActions, setApprovalActions] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [governanceTab, setGovernanceTab] = useState("AI治理");
  const [strategyMode, setStrategyMode] = useState<StrategyMode>("baseline");
  const [combatInput, setCombatInput] = useState("");
  const [combatMessages, setCombatMessages] = useState<string[]>([
    "AI：已接入工单、审批、数据源、审计日志与全局优化模型，可进行闭环作战模拟。",
  ]);
  const { logs, pushLog } = useOperationLog([
    "风险/审计端点已激活，等待策略模拟指令",
    "AI 治理套件已加载 Prompt、模型与输出 Schema",
    "执行闭环状态机已同步派单回执",
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({
    timeframe: "month",
  });
  const { data: market } = trpc.platform.porkMarket.useQuery({
    timeframe: "month",
    regionCode: "510000",
    sortBy: "hogPrice",
  });
  const activeStrategy = strategyModes[strategyMode];
  const { data: optimization } = trpc.platform.globalOptimizationSimulate.useQuery({
    tuning: {
      livePigPriceAdjustment: activeStrategy.livePigPriceAdjustment,
      slaughterCapacityMultiplier: activeStrategy.capacityMultiplier,
      splitCapacityMultiplier: activeStrategy.capacityMultiplier,
      freezeCapacityMultiplier: activeStrategy.capacityMultiplier,
      storageCostMultiplier: activeStrategy.storageCostMultiplier,
    },
  });
  const workspaceInput = useMemo(
    () => ({
      batchCode,
      forecastMonth: 2,
      scenarioMonth: 2,
      targetPrice: 29.4,
      strategy: "balanced" as const,
      basisAdjustment: 0,
      capacityAdjustment: 12,
      demandAdjustment: 10,
    }),
    [batchCode]
  );
  const { data: workspace } =
    trpc.platform.aiDecisionWorkspace.useQuery(workspaceInput);
  const { data: auditLogs } = trpc.platform.auditLogs.useQuery();

  useEffect(() => {
    if (!snapshot?.inventoryBatches.length) return;
    if (!snapshot.inventoryBatches.some(item => item.batchCode === batchCode)) {
      setBatchCode(snapshot.inventoryBatches[0]!.batchCode);
    }
  }, [snapshot?.inventoryBatches, batchCode]);

  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      setSelectedOrderId(result.workOrders[0]?.orderId ?? null);
      toast.success("治理套件已生成可审计工单，审批与执行链路已同步。");
    },
    onError: error => toast.error(error.message || "工单生成失败。"),
  });

  const updateReceipt = trpc.platform.updateAiDispatchReceipt.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.platform.aiDecisionWorkspace.invalidate(workspaceInput),
        utils.platform.auditLogs.invalidate(),
      ]);
      toast.success("执行状态已回写，审计留痕已刷新。");
    },
    onError: error => toast.error(error.message || "状态更新失败。"),
  });

  const selectedBatch =
    snapshot?.inventoryBatches.find(item => item.batchCode === batchCode) ??
    snapshot?.inventoryBatches[0];
  const workOrders = workspace?.dispatchBoard.workOrders ?? [];
  const history = workspace?.dispatchHistory ?? [];
  const receipts = history.flatMap(order =>
    order.receipts.map(receipt => ({
      orderId: order.orderId,
      currentStatus: order.currentStatus,
      priority: order.priority,
      ...receipt,
    }))
  );
  const orderRows = workOrders.map((order, index) => {
    const receipt = receipts.find(
      item => item.orderId === order.orderId || item.role === order.role
    );
    const status = (receipt?.status ??
      (index === 0
        ? "执行中"
        : index === 1
          ? "待确认"
          : "已接单")) as ReceiptStatus;
    const slaMinutes =
      receipt?.etaMinutes ?? (status === "超时升级" ? 150 : index * 25 + 23);
    return {
      index: index + 1,
      ...order,
      status,
      slaMinutes,
      assignee:
        order.role === "厂长"
          ? "李勇"
          : order.role === "司机"
            ? "王强"
            : "赵敏",
      department:
        order.role === "厂长"
          ? "四川眉山"
          : order.role === "司机"
            ? "运输中心"
            : "销售中心",
      riskLevel: order.priority === "P1" ? "高" : "中",
      stopAt: `2026-07-0${index + 1} ${index === 0 ? "18:00" : "20:00"}`,
    };
  });

  const filteredRows = orderRows.filter(row => {
    const queryMatched = [row.orderId, row.operationRequirement, row.assignee, row.department]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const menuMatched =
      activeMenu === "工单列表" ||
      activeMenu === "工单看板" ||
      (activeMenu === "我执行的" && row.assignee !== "李勇") ||
      (activeMenu === "我创建的" && row.assignee === "李勇") ||
      (activeMenu === "抢单池" && row.status === "待确认") ||
      (activeMenu === "风险工单" && row.riskLevel === "高") ||
      (activeMenu === "SLA监控" && row.slaMinutes > 60) ||
      (activeMenu === "复盘管理" && row.status === "已完成") ||
      activeMenu === "工单统计" ||
      activeMenu === "知识库";
    return queryMatched && menuMatched;
  });
  const selectedOrder =
    orderRows.find(order => order.orderId === selectedOrderId) ?? orderRows[0];
  const pendingCount = orderRows.filter(row => row.status === "待确认").length;
  const runningCount = orderRows.filter(
    row => row.status === "执行中" || row.status === "已接单"
  ).length;
  const completedCount = orderRows.filter(
    row => row.status === "已完成"
  ).length;
  const escalatedCount = orderRows.filter(
    row => row.status === "超时升级"
  ).length;
  const slaRate = clamp(
    100 - pendingCount * 8 - escalatedCount * 18 + completedCount * 4 + activeStrategy.riskBias * -0.2,
    0,
    100
  );
  const optimizationSummary = optimization?.output.summary;
  const simulatedProfitWan = (optimizationSummary?.totalProfit ?? workspace?.simulation.summary.simulatedProfit ?? 0) / 10000;
  const simulatedRevenueWan = (optimizationSummary?.totalRevenue ?? workspace?.simulation.summary.expectedRevenue ?? 0) / 10000;
  const simulatedUtilization = optimizationSummary?.capacityUtilization ?? workspace?.simulation.summary.utilizationRate ?? 86;
  const simulatedFreezeTons = (optimizationSummary?.totalFreezeKg ?? selectedBatch?.weightKg ?? 0) / 1000;
  const dataSourceCount =
    4 +
    Number(Boolean(snapshot?.inventoryBatches.length)) +
    Number(Boolean(market?.benchmarkQuotes.length)) +
    Number(Boolean(auditLogs?.length));
  const freshnessScore = market?.generatedAt
    ? clamp(
        100 - Math.max(0, Date.now() - market.generatedAt) / 1000 / 60 / 8,
        72,
        100
      )
    : 94;
  const integrityScore = clamp(
    94 + (snapshot?.inventoryBatches.length ?? 0) * 0.8 - escalatedCount * 4,
    70,
    99.8
  );
  const lineageScore = clamp(88 + (auditLogs?.length ?? 0) * 0.25, 80, 99);
  const aiScore = clamp(
    (integrityScore + freshnessScore + lineageScore + slaRate) / 4,
    60,
    99
  );

  const executeReceipt = (status: ReceiptStatus, role?: RoleName) => {
    const order = selectedOrder ?? orderRows[0];
    if (!order) {
      toast.error("请先生成工单。");
      return;
    }
    updateReceipt.mutate({
      orderId: order.orderId,
      role: role ?? order.role,
      status,
      etaMinutes: status === "已完成" ? 0 : status === "超时升级" ? 120 : 30,
      note:
        status === "已完成"
          ? "现场已上传凭证并完成回执。"
          : status === "超时升级"
            ? "触发风险升级，需审批中心介入。"
            : "责任人已确认任务并进入执行。",
      acknowledgedBy:
        status === "已接单" || status === "执行中" ? "移动端确认" : undefined,
      receiptBy: status === "已完成" ? "移动端签收" : undefined,
    });
  };

  const sendCombatInstruction = (preset?: string) => {
    const command = (preset ?? combatInput).trim();
    if (!command) return;
    const answer = `AI：已按「${activeStrategy.name}」模拟。预计利润 ${formatNumber(simulatedProfitWan, 1)} 万元，产能利用率 ${formatNumber(simulatedUtilization, 1)}%，冻储规模 ${formatNumber(simulatedFreezeTons, 1)} 吨；建议先处理 ${escalatedCount + pendingCount} 个风险/待确认节点，再提交审批。`;
    setCombatMessages(prev => [`人类指令：${command}`, answer, ...prev].slice(0, 6));
    pushLog(`作战指令：${command}`);
    setCombatInput("");
  };

  const submitApprovalAction = (label: string) => {
    const target = selectedOrder?.orderId ?? "WO-待生成";
    const note = approvalNote.trim() || `${selectedApprovalCard}：${label}，按 ${activeStrategy.name} 留痕`;
    const record = `${formatTime(Date.now())} ${target} / ${selectedApprovalCard} / ${label}：${note}`;
    setApprovalActions(prev => [record, ...prev].slice(0, 6));
    pushLog(`审批操作：${label} / ${target}`);
    if (label === "通过") executeReceipt("已接单");
    else if (label === "驳回") executeReceipt("超时升级");
    else if (label === "要求补充") setUploadQueue(prev => [`${target} 需补充审批材料`, ...prev].slice(0, 4));
    toast.success(`${label} 已写入审批操作台`);
  };

  const submitApprovalNote = () => {
    submitApprovalAction("提交意见");
    setApprovalNote("");
  };

  const uploadEvidence = () => {
    const target = selectedOrder?.orderId ?? "WO-待生成";
    const record = `${formatTime(Date.now())} ${target} 已上传移动端图片凭证，等待审批中心验真`;
    setUploadQueue(prev => [record, ...prev].slice(0, 5));
    setApprovalActions(prev => [record, ...prev].slice(0, 6));
    pushLog(record);
    toast.success("图片凭证已进入上传队列");
  };

  const approvalCards = [
    ["高风险库存策略", "跨月风险识别与处置", "高"],
    ["大额收益", "大额策略同步与风控", "中"],
    ["制度库提报", "执行流程与范围评审", "中"],
    ["跨区调拨", "跨区域资源联动", "中"],
    ["金融套保", "期货组合与现金流校验", "高"],
    ["低价销售", "低价促销审批", "中"],
    ["超时替代方案", "超时节点与应急处置", "高"],
  ];
  const dataSources = [
    ["SAP", "已接入", integrityScore, "SAP"],
    ["WMS", "已接入", freshnessScore, "WMS"],
    ["TMS", "已接入", slaRate, "TMS"],
    ["MES", "已接入", integrityScore - 2.4, "MES"],
    ["财务系统", "已接入", 99.3, "Finance"],
    [
      "外部行情",
      "已接入",
      market?.benchmarkQuotes.length ? 98.9 : 91.8,
      "Market",
    ],
    ["企业微信", "已接入", 99.0, "WeCom"],
    ["短信", "已接入", 99.1, "SMS"],
  ];
  const promptVersions = [
    ["v1.2.0", "库存风险识别Prompt", "生产", "2025-07-01"],
    ["v1.1.0", "库存风险识别Prompt", "历史", "2025-06-15"],
    ["v1.0.0", "初始版本", "历史", "2025-05-28"],
  ];
  const modelRows = [
    ["GPT-4o", "OpenAI", "生产", "2025-06-28"],
    ["GLM-4", "智谱AI", "生产", "2025-06-20"],
    ["Qwen3-32B", "阿里云", "历史", "2025-05-30"],
  ];
  const auditRows = (auditLogs ?? []).slice(0, 4).map((log, index) => ({
    time: formatTime(log.createdAt),
    operator: log.operatorName ?? ["张三", "李四", "王五", "赵六"][index]!,
    module: log.entityType,
    type: log.actionType,
    detail: log.afterValue,
  }));
  const schemaText = `{
  "type": "object",
  "properties": {
    "riskLevel": { "type": "string", "enum": ["高","中","低"] },
    "riskReason": { "type": "string" },
    "suggestActions": { "type": "array", "items": { "type": "string" } },
    "expectedImpact": {
      "properties": {
        "profitImpact": { "type": "number" },
        "inventoryImpact": { "type": "number" },
        "cashFlowImpact": { "type": "number" }
      }
    },
    "confidence": { "type": "number" }
  },
  "required": ["riskLevel","riskReason","suggestActions","confidence"]
}`;

  return (
    <div className="min-h-screen overflow-hidden bg-[#020b18] text-slate-100">
      <TacticalBackdrop intensity="subtle" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.22),transparent_30%),linear-gradient(180deg,#03101f,#020b18_56%,#03101d)]" />
      <div className="relative z-10 p-2">
        <header className="grid h-[62px] items-center border-b border-cyan-400/20 px-2 xl:grid-cols-[1fr,auto,1fr]">
          <div className="flex items-center gap-3">
            <div className="rounded-[10px] border border-cyan-400/30 bg-cyan-400/[0.08] px-5 py-2 text-sm font-semibold text-cyan-100">
              A 传统SaaS基线（经营分析）
            </div>
            <div className="rounded-[10px] border border-violet-400/30 bg-violet-500/[0.1] px-5 py-2 text-sm font-semibold text-violet-100">
              B 风险/审计端点（风险与审计）
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-[32px] font-bold tracking-[0.08em] text-white">
              执行闭环与治理套件总图
            </h1>
            <p className="mt-1 text-xs tracking-[0.32em] text-cyan-200/70">
              全链路执行闭环 · 风险可控 · 数据可信 · AI驱动 · 价值可信
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            {[
              ["AI驱动", Bot],
              ["实时洞察", GitBranch],
              ["风险可控", ShieldCheck],
              ["全链路闭环", RefreshCcw],
              ["合规可信", LockKeyhole],
            ].map(([label, Icon]) => (
              <span
                key={String(label)}
                className="flex items-center gap-1 rounded-[7px] border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1.5 text-xs text-cyan-100"
              >
                <Icon className="h-3.5 w-3.5" />
                {label as string}
              </span>
            ))}
          </div>
        </header>

        <section className="grid gap-2 border-b border-cyan-400/10 py-2 xl:grid-cols-[1fr,360px]">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(strategyModes) as StrategyMode[]).map(mode => {
              const item = strategyModes[mode];
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setStrategyMode(mode);
                    pushLog(`切换战略模拟：${item.name}`);
                  }}
                  className={cn(
                    "rounded-[8px] border px-3 py-2 text-left transition",
                    strategyMode === mode
                      ? "border-cyan-300/60 bg-cyan-400/[0.14] shadow-[0_0_18px_rgba(34,211,238,.18)]"
                      : "border-cyan-400/15 bg-slate-950/30 hover:bg-cyan-400/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <SlidersHorizontal className="h-4 w-4 text-cyan-200" />
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.intent}</div>
                </button>
              );
            })}
          </div>
          <Panel className="p-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                ["模拟利润", `${formatNumber(simulatedProfitWan, 1)}万`],
                ["产能利用", `${formatNumber(simulatedUtilization, 1)}%`],
                ["冻储规模", `${formatNumber(simulatedFreezeTons, 1)}吨`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[7px] border border-cyan-400/15 bg-cyan-400/[0.05] p-2">
                  <div className="text-lg font-black text-white">{value}</div>
                  <div className="mt-1 text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <main className="grid gap-2 pt-2 xl:grid-cols-[1fr,1fr]">
          <section className="space-y-2">
            <Panel>
              <SectionTitle
                index={1}
                title="工单执行中心"
                right={
                  <div className="flex items-center gap-2">
                    <Select value={batchCode} onValueChange={setBatchCode}>
                      <SelectTrigger className="h-8 w-[190px] rounded-[6px] border-cyan-400/20 bg-slate-950/45 text-xs text-cyan-100">
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
                    <div className="flex h-8 items-center gap-2 rounded-[6px] border border-cyan-400/20 bg-slate-950/45 px-2">
                      <Search className="h-3.5 w-3.5 text-cyan-200" />
                      <Input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="搜索工单编号/负责人"
                        className="h-7 w-[180px] border-0 bg-transparent p-0 text-xs text-slate-100 focus-visible:ring-0"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        persistDispatch.mutate({
                          batchCode,
                          selectedMonth: 2,
                          targetPrice: 29.4,
                          capacityAdjustment: 12,
                          demandAdjustment: 10,
                        })
                      }
                      className="h-8 rounded-[6px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
                    >
                      新建工单
                    </Button>
                  </div>
                }
              />
              <div className="grid gap-2 p-3 xl:grid-cols-[130px,1fr,220px]">
                <div className="space-y-1 text-sm">
                  {[
                    "工单看板",
                    "工单列表",
                    "我执行的",
                    "我创建的",
                    "抢单池",
                    "风险工单",
                    "工单统计",
                    "SLA监控",
                    "复盘管理",
                    "知识库",
                  ].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item);
                        pushLog(`${item} 已打开，工单列表按当前规则过滤`);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[6px] border px-2 py-2 text-left",
                        activeMenu === item
                          ? "border-cyan-400/35 bg-cyan-400/[0.12] text-cyan-100"
                          : "border-cyan-400/10 bg-slate-950/25 text-slate-400"
                      )}
                    >
                      <TableProperties className="h-3.5 w-3.5" />
                      {item}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[1.2fr,1.2fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] border-b border-cyan-400/15 px-3 py-2 text-xs text-cyan-100">
                      <span>工单编号</span>
                      <span>来源策略</span>
                      <span>负责人</span>
                      <span>组织</span>
                      <span>截止时间</span>
                      <span>状态</span>
                      <span>SLA</span>
                    </div>
                    {filteredRows.slice(0, 8).map(row => (
                      <button
                        key={row.orderId}
                        onClick={() => setSelectedOrderId(row.orderId)}
                        className={cn(
                          "grid w-full grid-cols-[1.2fr,1.2fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] items-center border-b border-cyan-400/8 px-3 py-2 text-left text-xs text-slate-300",
                          selectedOrder?.orderId === row.orderId
                            ? "bg-cyan-400/[0.08]"
                            : "hover:bg-cyan-400/[0.04]"
                        )}
                      >
                        <span className="font-semibold text-cyan-200">
                          {row.orderId}
                        </span>
                        <span>{row.operationRequirement.slice(0, 14)}</span>
                        <span>{row.assignee}</span>
                        <span>{row.department}</span>
                        <span>{row.stopAt}</span>
                        <StatusBadge status={row.status} />
                        <span
                          className={
                            row.status === "超时升级"
                              ? "text-red-300"
                              : "text-slate-300"
                          }
                        >
                          {row.slaMinutes}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.045] p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-white">工单详情</span>
                    <StatusBadge status={selectedOrder?.status ?? "待确认"} />
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p className="text-cyan-100">
                      {selectedOrder?.orderId ?? "暂无工单"}
                    </p>
                    <p>
                      来源策略：
                      {workspace?.agentDecision.dispatchSummary.slice(0, 36) ??
                        "AI 派单策略"}
                    </p>
                    <p>
                      责任人：{selectedOrder?.assignee ?? "-"} /{" "}
                      {selectedOrder?.role ?? "-"}
                    </p>
                    <p>组织：{selectedOrder?.department ?? "-"}</p>
                    <p>SLA：{selectedOrder?.slaMinutes ?? 0} 分钟</p>
                    <p>
                      验收：
                      {selectedOrder?.acceptanceStandard ??
                        "上传凭证并完成回执"}
                    </p>
                    <p className="text-amber-200">
                      风险：{selectedOrder?.riskLevel ?? "中"} ·{" "}
                      {workspace?.lifecycle.stage ?? "dispatch_preview"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 border-t border-cyan-400/15 p-3 xl:grid-cols-[1.4fr,1fr]">
                <div>
                  <div className="mb-2 text-sm font-semibold text-cyan-100">
                    状态机（执行闭环）
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {statusFlow.map((step, index) => (
                      <div key={step.label} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "grid h-16 w-16 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                            step.tone === "green"
                              ? "border-emerald-400/40 bg-emerald-500/[0.12] text-emerald-200"
                              : step.tone === "blue"
                                ? "border-blue-400/40 bg-blue-500/[0.12] text-blue-200"
                                : step.tone === "cyan"
                                  ? "border-cyan-400/40 bg-cyan-500/[0.12] text-cyan-200"
                                  : step.tone === "red"
                                    ? "border-red-400/40 bg-red-500/[0.12] text-red-200"
                                    : "border-slate-500/30 bg-slate-500/[0.08] text-slate-400"
                          )}
                        >
                          <span>{step.label}</span>
                          <span className="text-[10px] font-normal">
                            {step.time}
                          </span>
                        </div>
                        {index < statusFlow.length - 1 ? (
                          <span className="h-0.5 w-8 bg-cyan-400/30" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr,1fr] gap-2">
                    <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                      <div className="mb-2 flex justify-between text-xs">
                        <span>SLA监控与升级</span>
                        <span>{formatNumber(slaRate, 0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                          style={{ width: `${slaRate}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        当前阶段：执行中（参照真实派单回执与预案推算）
                      </p>
                    </div>
                    <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3 text-xs text-slate-300">
                      <div className="font-semibold text-cyan-100">
                        报告与处理历史
                      </div>
                      {(auditRows.length
                        ? auditRows
                        : [
                            {
                              time: "15:22",
                              operator: "系统",
                              module: "Dispatch",
                              type: "生成工单",
                              detail: "等待审计记录",
                            },
                          ]
                      )
                        .slice(0, 4)
                        .map(item => (
                          <div
                            key={`${item.time}-${item.type}`}
                            className="mt-2 flex gap-2"
                          >
                            <span className="text-cyan-300">
                              {item.time.slice(11, 16) || item.time}
                            </span>
                            <span>{item.type}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                  <div className="text-sm font-semibold text-cyan-100">
                    实时计数
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      ["待确认", pendingCount],
                      ["执行中", runningCount],
                      ["已完成", completedCount],
                      ["已升级", escalatedCount],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-[7px] border border-cyan-400/15 bg-cyan-400/[0.045] p-2"
                      >
                        <div className="text-2xl font-bold text-white">
                          {value}
                        </div>
                        <div className="text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.045] p-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                      <Bot className="h-3.5 w-3.5" />
                      人机作战指令
                    </div>
                    <div className="mt-2 max-h-[86px] space-y-1 overflow-auto">
                      {combatMessages.slice(0, 3).map(message => (
                        <div key={message} className="rounded-[5px] bg-slate-950/35 px-2 py-1 text-[11px] leading-5 text-slate-300">
                          {message}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Input
                        value={combatInput}
                        onChange={event => setCombatInput(event.target.value)}
                        onKeyDown={event => event.key === "Enter" && sendCombatInstruction()}
                        placeholder="输入：生成审计优先方案"
                        className="h-8 rounded-[6px] border-cyan-400/20 bg-slate-950/45 text-xs text-slate-100"
                      />
                      <Button
                        onClick={() => sendCombatInstruction()}
                        className="h-8 rounded-[6px] bg-cyan-500 px-2 text-slate-950 hover:bg-cyan-300"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["生成闭环方案", "找出超时根因", "审计风险排序"].map(question => (
                        <button
                          key={question}
                          onClick={() => sendCombatInstruction(question)}
                          className="rounded-[5px] border border-cyan-400/15 bg-blue-500/10 px-2 py-1 text-[11px] text-cyan-100"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {logs.slice(0, 3).map(log => (
                      <div key={log} className="rounded-[5px] border border-cyan-400/10 bg-slate-950/25 px-2 py-1 text-[11px] text-slate-400">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                index={5}
                title="数据质量与数据源管理页面"
                right={
                  <span className="text-xs text-cyan-200">
                    真实接口：snapshot / market / audit
                  </span>
                }
              />
              <div className="grid gap-2 p-3 xl:grid-cols-[150px,1fr,180px]">
                <div className="space-y-2">
                  {dataSources.map(source => (
                    <div
                      key={source[0] as string}
                      className="flex items-center justify-between rounded-[7px] border border-cyan-400/15 bg-cyan-400/[0.045] px-3 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2 text-slate-200">
                        <Database className="h-3.5 w-3.5 text-cyan-200" />
                        {source[0] as string}
                      </span>
                      <span className="text-emerald-300">
                        {source[1] as string}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[780px]">
                    <div className="grid grid-cols-[1fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] border-b border-cyan-400/15 px-3 py-2 text-xs text-cyan-100">
                      <span>数据源</span>
                      <span>完整性</span>
                      <span>唯一性</span>
                      <span>合法性</span>
                      <span>一致性</span>
                      <span>及时性</span>
                      <span>异常数</span>
                      <span>质量分</span>
                    </div>
                    {dataSources.map((source, index) => {
                      const score = Number(source[2]);
                      return (
                        <div
                          key={source[0] as string}
                          className="grid grid-cols-[1fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] border-b border-cyan-400/8 px-3 py-2 text-xs text-slate-300"
                        >
                          <span>{source[0] as string}</span>
                          <span>{formatNumber(score, 1)}%</span>
                          <span>
                            {formatNumber(clamp(score + 0.7, 0, 100), 1)}%
                          </span>
                          <span>
                            {formatNumber(clamp(score - 0.5, 0, 100), 1)}%
                          </span>
                          <span>
                            {formatNumber(clamp(score + 0.2, 0, 100), 1)}%
                          </span>
                          <span>
                            {formatNumber(clamp(score - 1.2, 0, 100), 1)}%
                          </span>
                          <span
                            className={
                              index === 3 ? "text-red-300" : "text-amber-200"
                            }
                          >
                            {index === 3 ? 3 : index % 3}
                          </span>
                          <span>{formatNumber(score, 1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "质量工单生成",
                    "创建治理工单",
                    "数据修复",
                    "验证链路",
                    "关闭工单",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-2 rounded-[7px] border border-blue-400/20 bg-blue-500/[0.08] p-2 text-xs text-blue-100"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-500">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 border-t border-cyan-400/15 p-3 xl:grid-cols-[1fr,360px]">
                <div className="space-y-2 text-xs">
                  <div className="rounded-[7px] border border-red-400/25 bg-red-500/[0.08] p-3 text-red-200">
                    TMS 及时性 96.7%，异常波动 {escalatedCount + 3}{" "}
                    条，建议核查冷链回传延迟。
                  </div>
                  <div className="rounded-[7px] border border-amber-400/25 bg-amber-500/[0.08] p-3 text-amber-200">
                    MES 异常值 {Math.max(1, escalatedCount)}{" "}
                    条，建议同步生产线批次口径。
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                  {[
                    ["数据源总数", dataSourceCount],
                    ["健康数据源", dataSources.length],
                    ["异常数据源", escalatedCount],
                    ["告警数量", pendingCount + 2],
                    ["修复工单", auditRows.length + 1],
                    ["待验证工单", runningCount],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-[7px] border border-cyan-400/15 bg-cyan-400/[0.045] p-2"
                    >
                      <div className="text-xl font-bold text-white">
                        {value}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </section>

          <section className="space-y-2">
            <Panel>
              <div className="grid gap-2 p-3 xl:grid-cols-[1fr,260px,260px]">
                <div>
                  <SectionTitle index={2} title="审批中心" />
                  <div className="mt-3 overflow-x-auto">
                    <div className="min-w-[620px]">
                      <div className="grid grid-cols-[1.2fr,1fr,0.7fr,0.7fr,0.8fr,0.8fr] border-b border-cyan-400/15 px-3 py-2 text-xs text-cyan-100">
                        <span>工单编号</span>
                        <span>策略名称</span>
                        <span>发起人</span>
                        <span>风险等级</span>
                        <span>金额/规模</span>
                        <span>截止时间</span>
                      </div>
                      {orderRows.slice(0, 4).map(row => (
                        <button
                          key={`approval-${row.orderId}`}
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(row.orderId);
                            pushLog(`${row.orderId} 已载入审批中心`);
                          }}
                          className="grid grid-cols-[1.2fr,1fr,0.7fr,0.7fr,0.8fr,0.8fr] border-b border-cyan-400/8 px-3 py-2 text-xs text-slate-300"
                        >
                          <span className="font-semibold text-cyan-200">
                            {row.orderId}
                          </span>
                          <span>{row.operationRequirement.slice(0, 10)}</span>
                          <span>{row.assignee}</span>
                          <span
                            className={
                              row.riskLevel === "高"
                                ? "text-red-300"
                                : "text-amber-200"
                            }
                          >
                            {row.riskLevel}
                          </span>
                          <span>{formatNumber(row.quantity, 0)}</span>
                          <span>{row.stopAt.slice(5)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {approvalCards.map(card => (
                      <button
                        key={card[0]}
                        type="button"
                        onClick={() => {
                          setSelectedApprovalCard(card[0]);
                          pushLog(`审批策略卡已选择：${card[0]}`);
                        }}
                        className={cn(
                          "rounded-[8px] border p-3 text-left text-xs",
                          selectedApprovalCard === card[0]
                            ? "border-cyan-200/70 bg-cyan-400/[0.14] shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                            : card[2] === "高"
                            ? "border-orange-400/25 bg-orange-500/[0.1]"
                            : "border-cyan-400/15 bg-cyan-400/[0.045]"
                        )}
                      >
                        <div className="font-semibold text-white">
                          {card[0]}
                        </div>
                        <div className="mt-1 text-slate-400">{card[1]}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr,180px] gap-2">
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        ["通过", CheckCircle2],
                        ["驳回", XCircle],
                        ["要求补充", FileText],
                        ["转交", Send],
                        ["加签", UserRound],
                        ["触发风控复核", ShieldCheck],
                      ].map(([label, Icon]) => (
                        <Button
                          key={String(label)}
                          onClick={() => submitApprovalAction(String(label))}
                          className="h-12 rounded-[7px] border border-cyan-400/20 bg-cyan-400/[0.06] text-xs text-cyan-100 hover:bg-cyan-400/[0.12]"
                        >
                          <Icon className="mr-1 h-4 w-4" />
                          {label as string}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={approvalNote}
                        onChange={event => setApprovalNote(event.target.value)}
                        placeholder="审批意见（必填）"
                        className="h-12 rounded-[7px] border-cyan-400/20 bg-slate-950/45 text-xs text-slate-100"
                      />
                      <Button
                        onClick={submitApprovalNote}
                        className="h-12 rounded-[7px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
                      >
                        提交
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(approvalActions.length ? approvalActions : [
                      `${selectedApprovalCard} 已就绪，等待审批动作`,
                      `${selectedOrder?.orderId ?? "WO-待生成"} 当前状态：${selectedOrder?.status ?? "待确认"}`,
                    ]).slice(0, 4).map(item => (
                      <div key={item} className="rounded-[7px] border border-cyan-400/12 bg-slate-950/30 px-3 py-2 text-[11px] leading-5 text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionTitle index={3} title="移动端执行页面" />
                  <div className="mt-3">
                    <MiniPhone title="工单执行">
                      <div className="grid grid-cols-4 gap-1 text-center text-xs">
                        {[
                          ["我的任务", orderRows.length],
                          ["今日待办", pendingCount + 8],
                          ["紧急任务", escalatedCount + 2],
                          ["超时任务", escalatedCount + 1],
                        ].map(([label, value]) => (
                          <div
                            key={String(label)}
                            className="rounded-[7px] bg-blue-500/20 p-2"
                          >
                            <div className="text-lg font-bold text-white">
                              {value}
                            </div>
                            <div className="text-[10px] text-slate-300">
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.08] p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white">
                            {selectedOrder?.orderId ?? "WO-待生成"}
                          </span>
                          <StatusBadge
                            status={selectedOrder?.status ?? "执行中"}
                          />
                        </div>
                        <div className="mt-2 text-slate-300">
                          任务：
                          {selectedOrder?.operationRequirement.slice(0, 22) ??
                            "等待派单"}
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-blue-950">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${selectedOrder?.status === "已完成" ? 100 : 64}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => executeReceipt("已完成")}
                          className="h-8 rounded-[7px] bg-cyan-500 text-xs text-slate-950"
                        >
                          确认验单
                        </Button>
                        <Button
                          onClick={() => executeReceipt("执行中")}
                          className="h-8 rounded-[7px] bg-emerald-500 text-xs text-white"
                        >
                          开始执行
                        </Button>
                        <Button
                          onClick={uploadEvidence}
                          className="h-8 rounded-[7px] bg-slate-800 text-xs text-slate-100"
                        >
                          上传图片
                        </Button>
                        <Button
                          onClick={() => executeReceipt("超时升级")}
                          className="h-8 rounded-[7px] bg-red-500/80 text-xs text-white"
                        >
                          异常上报
                        </Button>
                      </div>
                      <div className="mt-3 text-xs text-slate-400">
                        <div className="text-cyan-100">执行进度</div>
                        {["创建工单", "确认接单", "上传图片", "回执确认"].map(
                          (step, index) => (
                            <div key={step} className="mt-1 flex gap-2">
                              <span className="text-cyan-300">{index + 1}</span>
                              {step}
                            </div>
                          )
                        )}
                        {uploadQueue.slice(0, 2).map(item => (
                          <div key={item} className="mt-1 rounded-[5px] border border-emerald-300/15 bg-emerald-400/[0.06] px-2 py-1 text-[10px] leading-4 text-emerald-100">
                            {item}
                          </div>
                        ))}
                      </div>
                    </MiniPhone>
                  </div>
                </div>

                <div>
                  <SectionTitle index={4} title="移动端管理驾驶舱" />
                  <div className="mt-3">
                    <MiniPhone title="驾驶舱">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[8px] bg-emerald-500/15 p-3">
                          <div className="text-[10px] text-slate-300">
                            今日利润
                          </div>
                          <div className="mt-1 text-2xl font-bold text-emerald-300">
                            {formatNumber(simulatedProfitWan, 0)}
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            较昨日 +12.6%
                          </div>
                        </div>
                        <div className="rounded-[8px] bg-cyan-500/15 p-3">
                          <div className="text-[10px] text-slate-300">
                            今日账亏
                          </div>
                          <div className="mt-1 text-2xl font-bold text-cyan-200">
                            {formatNumber(simulatedRevenueWan, 0)}
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            较昨日 +18.3%
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                        {[
                          ["高风险", escalatedCount + 23],
                          ["预警", pendingCount + 17],
                          ["完成率", slaRate],
                          ["待审批", pendingCount + 12],
                        ].map(item => (
                          <div
                            key={String(item[0])}
                            className="rounded-[7px] bg-blue-500/15 p-2 text-xs"
                          >
                            <div className="font-bold text-white">
                              {formatNumber(
                                Number(item[1]),
                                item[0] === "完成率" ? 1 : 0
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 space-y-2">
                        <MiniBar
                          label="高风险库存"
                          value={escalatedCount + 23}
                          color="bg-amber-400"
                        />
                        <MiniBar
                          label="低价销售"
                          value={pendingCount + 17}
                          color="bg-amber-400"
                        />
                        <MiniBar
                          label="大额收益"
                          value={9}
                          color="bg-cyan-300"
                        />
                        <MiniBar
                          label="超时审批"
                          value={8}
                          color="bg-emerald-300"
                        />
                        <MiniBar
                          label="跨区调拨"
                          value={6}
                          color="bg-emerald-300"
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-1">
                        {[CheckCircle2, XCircle, Send, MessageSquare, Mic].map(
                          (Icon, index) => (
                            <button
                              key={index}
                              className="grid h-9 place-items-center rounded-[7px] bg-slate-800 text-cyan-100"
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </div>
                    </MiniPhone>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                index={6}
                title="系统治理与参数配置页面"
                right={
                  <div className="flex gap-1">
                    {[
                      "参数配置",
                      "公式管理",
                      "AI治理",
                      "权限管理",
                      "审计日志",
                      "AI输出评分",
                      "复盘分析",
                    ].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setGovernanceTab(tab)}
                        className={cn(
                          "rounded-[6px] border px-3 py-1 text-xs",
                          governanceTab === tab
                            ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
                            : "border-cyan-400/15 bg-slate-950/25 text-slate-400"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="grid gap-2 p-3 xl:grid-cols-[0.9fr,1.1fr,260px]">
                <div className="space-y-2">
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <div className="mb-2 font-semibold text-cyan-100">
                      Prompt版本
                    </div>
                    {promptVersions.map(row => (
                      <div
                        key={row[0]}
                        className="grid grid-cols-[0.7fr,1fr,0.6fr,0.8fr] border-b border-cyan-400/8 py-2 text-xs text-slate-300"
                      >
                        <span>{row[0]}</span>
                        <span>{row[1]}</span>
                        <span>{row[2]}</span>
                        <span>{row[3]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <div className="mb-2 font-semibold text-cyan-100">
                      模型版本
                    </div>
                    {modelRows.map(row => (
                      <div
                        key={row[0]}
                        className="grid grid-cols-[0.7fr,0.8fr,0.6fr,0.8fr] border-b border-cyan-400/8 py-2 text-xs text-slate-300"
                      >
                        <span>{row[0]}</span>
                        <span>{row[1]}</span>
                        <span>{row[2]}</span>
                        <span>{row[3]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/40 p-3">
                    <div className="mb-2 font-semibold text-cyan-100">
                      输出JSON Schema（片段）
                    </div>
                    <pre className="max-h-[180px] overflow-auto rounded-[6px] bg-slate-950/60 p-3 text-[11px] leading-5 text-cyan-100">
                      {schemaText}
                    </pre>
                  </div>
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <div className="mb-2 font-semibold text-cyan-100">
                      审计日志（最近审计）
                    </div>
                    <div className="grid grid-cols-[1fr,0.6fr,0.8fr,1fr,1.4fr] border-b border-cyan-400/15 py-2 text-xs text-cyan-100">
                      <span>时间</span>
                      <span>操作人</span>
                      <span>模块</span>
                      <span>操作类型</span>
                      <span>详情</span>
                    </div>
                    {(auditRows.length
                      ? auditRows
                      : [
                          {
                            time: formatTime(now),
                            operator: "系统",
                            module: "AI治理",
                            type: "初始化",
                            detail: "等待真实审计事件",
                          },
                        ]
                    ).map(row => (
                      <div
                        key={`${row.time}-${row.type}`}
                        className="grid grid-cols-[1fr,0.6fr,0.8fr,1fr,1.4fr] border-b border-cyan-400/8 py-2 text-xs text-slate-300"
                      >
                        <span>{row.time}</span>
                        <span>{row.operator}</span>
                        <span>{row.module}</span>
                        <span>{row.type}</span>
                        <span className="truncate">{row.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <CircleScore value={aiScore} label="AI输出评分（近7天）" />
                    <div className="mt-4 space-y-2">
                      <MiniBar
                        label="5星"
                        value={62.1}
                        color="bg-emerald-300"
                      />
                      <MiniBar label="4星" value={28.7} color="bg-cyan-300" />
                      <MiniBar label="3星" value={7.2} color="bg-amber-300" />
                      <MiniBar label="2星" value={1.7} color="bg-red-300" />
                    </div>
                  </div>
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <div className="font-semibold text-cyan-100">
                      模型对比（评分）
                    </div>
                    {[
                      ["GPT-4o", 4.36],
                      ["GLM-4", 4.12],
                      ["Qwen3-32B", 3.89],
                      ["DeepSeek-V3", 3.71],
                    ].map(row => (
                      <div
                        key={row[0] as string}
                        className="mt-2 grid grid-cols-[80px,1fr,36px] items-center gap-2 text-xs"
                      >
                        <span className="text-slate-300">
                          {row[0] as string}
                        </span>
                        <span className="h-1.5 rounded-full bg-slate-800">
                          <span
                            className="block h-full rounded-full bg-cyan-300"
                            style={{ width: `${Number(row[1]) * 20}%` }}
                          />
                        </span>
                        <span className="text-right text-cyan-100">
                          {row[1] as number}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[8px] border border-cyan-400/15 bg-slate-950/30 p-3">
                    <div className="font-semibold text-cyan-100">
                      质量分析（近7天）
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-[7px] bg-cyan-400/[0.06] p-2 text-center">
                        <div className="text-xl font-bold text-white">
                          {auditLogs?.length ?? 38}
                        </div>
                        <div className="text-slate-400">复盘工单</div>
                      </div>
                      <div className="rounded-[7px] bg-emerald-400/[0.06] p-2 text-center">
                        <div className="text-xl font-bold text-emerald-300">
                          {formatNumber(lineageScore, 1)}%
                        </div>
                        <div className="text-slate-400">质量达成率</div>
                      </div>
                    </div>
                    {["策略匹配", "风险不完善", "执行偏差", "系统配置"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className="mt-2 flex justify-between rounded-[6px] bg-slate-950/35 px-2 py-1 text-xs text-slate-300"
                        >
                          <span>
                            {index + 1} {item}
                          </span>
                          <span>{[5, 3, 2, 1][index]}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}
