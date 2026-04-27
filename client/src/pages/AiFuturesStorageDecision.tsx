import { TacticalBackdrop, LiveSignal, useOperationLog } from "@/components/ai/TacticalEffects";
import { PlatformShell } from "@/components/platform/PlatformShell";
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
import type {
  BatchDecisionPlan,
  StorageBatchSummary,
  StorageDecisionMode,
} from "../../../server/futuresStorageDecision";
import {
  AlertTriangle,
  Archive,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileCheck2,
  FileSpreadsheet,
  HelpCircle,
  Info,
  LineChart as LineChartIcon,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  UserRound,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const strategyLabels: Record<StorageDecisionMode, string> = {
  base: "基准策略",
  cost_up: "成本上升",
  price_down: "盘面回落",
  window_extend: "销售推迟",
};

const planTone: Record<BatchDecisionPlan["key"], string> = {
  sell_now: "border-emerald-300/65 bg-emerald-400/[0.13] shadow-[0_0_28px_rgba(16,185,129,0.24)]",
  hold_1m: "border-blue-300/45 bg-blue-500/[0.11]",
  hold_2m: "border-blue-300/45 bg-blue-500/[0.11]",
  hold_3m: "border-blue-300/45 bg-blue-500/[0.11]",
  custom: "border-cyan-300/45 bg-cyan-500/[0.1]",
};

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function money(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}¥${formatNumber(value, 0)}`;
}

function price(value: number, digits = 2) {
  return `¥${formatNumber(value, digits)}`;
}

function formatTime(value: number | undefined) {
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

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-400/28 bg-[#061b34]/94 shadow-[inset_0_1px_0_rgba(125,211,252,0.16),0_0_26px_rgba(14,116,195,0.18)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),transparent_34%,rgba(16,185,129,0.045))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-300/15 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
        <h2 className="truncate text-[15px] font-bold text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid grid-cols-[72px_1fr] items-center gap-2 text-[13px] text-slate-300">
      <span className="text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.055] py-2 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className={cn("text-right text-slate-300", strong && "font-mono font-bold text-cyan-100")}>{value}</span>
    </div>
  );
}

function PlanCard({
  plan,
  index,
  selected,
  recommended,
  onClick,
}: {
  plan: BatchDecisionPlan;
  index: number;
  selected: boolean;
  recommended: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative min-h-[126px] rounded-[8px] border p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/75",
        planTone[plan.key],
        selected && "border-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.55),0_0_34px_rgba(20,184,166,0.26)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("rounded-[4px] px-2 py-0.5 text-[12px] font-black", selected ? "bg-emerald-300 text-slate-950" : "bg-blue-500/28 text-blue-100")}>
          方案{index + 1}
        </span>
        {recommended ? <Sparkles className="h-4 w-4 text-emerald-200" /> : null}
      </div>
      <div className="mt-2 text-[19px] font-black text-white">{plan.label}</div>
      <div className="mt-1 text-[12px] text-slate-400">{plan.subtitle}</div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <p className="text-slate-500">净收益</p>
          <p className={cn("font-mono text-[16px] font-bold", plan.netIncome >= 0 ? "text-emerald-300" : "text-red-300")}>{money(plan.netIncome)}</p>
        </div>
        <div>
          <p className="text-slate-500">年化收益</p>
          <p className="font-mono text-[16px] font-bold text-cyan-200">{formatNumber(plan.annualizedReturnPct, 2)}%</p>
        </div>
      </div>
    </button>
  );
}

function RiskBadge({ level }: { level: "低" | "中" | "高" }) {
  return (
    <span
      className={cn(
        "rounded-[5px] border px-2 py-0.5 text-[12px] font-bold",
        level === "低" && "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
        level === "中" && "border-amber-300/35 bg-amber-400/10 text-amber-200",
        level === "高" && "border-red-300/35 bg-red-400/10 text-red-200",
      )}
    >
      {level}风险
    </span>
  );
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-cyan-300/20 bg-[#07172a]/96 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
      <p className="mb-2 font-mono text-xs font-bold text-cyan-200">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex min-w-[210px] items-center justify-between gap-5 text-xs">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono text-slate-100">{price(Number(entry.value), 2)}/kg</span>
        </div>
      ))}
    </div>
  );
}

function BatchOption({ batch }: { batch: StorageBatchSummary }) {
  return (
    <SelectItem value={batch.batchCode}>
      {batch.batchCode} · {batch.partName}
    </SelectItem>
  );
}

export default function AiFuturesStorageDecisionPage() {
  const [batchCode, setBatchCode] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [mode, setMode] = useState<StorageDecisionMode>("base");
  const [customHoldDays, setCustomHoldDays] = useState(45);
  const [selectedPlanKey, setSelectedPlanKey] = useState<BatchDecisionPlan["key"] | "">("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("AI 已等待人类确认。选择方案后，系统会重新解释收益、风险、审批规则和执行动作。");
  const [actionStatus, setActionStatus] = useState("待操作");
  const [scenarioNote, setScenarioNote] = useState("基准盘面，按当前库存成本、库龄、库容集中度模拟。");
  const { logs, pushLog } = useOperationLog([
    "10:28 AI 已同步库存批次、部位行情、期货映射价",
    "10:26 系统完成规则校验与风险阈值加载",
  ]);

  const queryInput = useMemo(
    () => ({
      batchCode: batchCode || undefined,
      customHoldDays,
      mode,
    }),
    [batchCode, customHoldDays, mode],
  );

  const {
    data: decision,
    isLoading,
    refetch,
  } = trpc.platform.futuresStorageDecisionSimulate.useQuery(queryInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const availableBatches = decision?.availableBatches ?? [];
  const warehouses = useMemo(
    () => Array.from(new Set(availableBatches.map(batch => batch.warehouse))),
    [availableBatches],
  );
  const filteredBatches = useMemo(
    () => availableBatches.filter(batch => warehouse === "all" || batch.warehouse === warehouse),
    [availableBatches, warehouse],
  );

  useEffect(() => {
    if (!batchCode && decision?.batch.batchCode) {
      setBatchCode(decision.batch.batchCode);
    }
  }, [batchCode, decision?.batch.batchCode]);

  useEffect(() => {
    if (filteredBatches.length && batchCode && !filteredBatches.some(batch => batch.batchCode === batchCode)) {
      setBatchCode(filteredBatches[0]!.batchCode);
    }
  }, [batchCode, filteredBatches]);

  useEffect(() => {
    if (decision?.selectedPlan.key) {
      setSelectedPlanKey(prev => prev || decision.selectedPlan.key);
    }
  }, [decision?.selectedPlan.key]);

  const selectedPlan =
    decision?.plans.find(plan => plan.key === selectedPlanKey) ?? decision?.selectedPlan;
  const batch = decision?.batch;
  const costRows = selectedPlan?.costRows ?? [];
  const riskCards = batch && selectedPlan
    ? [
        { label: "库龄风险", value: Math.min(100, batch.ageDays * 0.82), sub: `库龄 ${batch.ageDays} 天` },
        { label: "价格风险", value: Math.min(100, Math.abs(batch.futuresMappedPrice - batch.currentSpotPrice) * 18), sub: `价差 ${formatNumber(batch.futuresMappedPrice - batch.currentSpotPrice, 2)}` },
        { label: "集中度风险", value: batch.concentration, sub: `占比 ${batch.concentration}%` },
        { label: "方案风险", value: selectedPlan.riskScore, sub: `${selectedPlan.holdDays || 0} 天窗口` },
      ]
    : [];

  const selectedPlanIndex = decision?.plans.findIndex(plan => plan.key === selectedPlan?.key) ?? -1;

  const runRefresh = async () => {
    pushLog("人工刷新行情、库存批次与预测曲线");
    await refetch();
    toast.success("已刷新真实数据与决策模型");
  };

  const runScenario = (nextMode: StorageDecisionMode, note: string) => {
    setMode(nextMode);
    setScenarioNote(note);
    pushLog(`战略模拟切换：${strategyLabels[nextMode]}`);
    toast.success(`已进入${strategyLabels[nextMode]}场景`);
  };

  const choosePlan = (plan: BatchDecisionPlan) => {
    setSelectedPlanKey(plan.key);
    setAiAnswer(`推荐动作：${plan.action}。预计净收益 ${money(plan.netIncome)}，保本价 ${price(plan.breakEvenPrice, 2)}/kg，风险评分 ${formatNumber(plan.riskScore, 1)}/100。${plan.reason}`);
    pushLog(`人类选择方案：${plan.label}`);
  };

  const askAI = (question = aiQuestion) => {
    const text = question.trim();
    if (!text || !selectedPlan || !batch) return;
    if (text.includes("审批") || selectedPlan.approvalRequired) {
      setAiAnswer(`审批判断：${selectedPlan.approvalRequired ? "需要审批" : "无需审批"}。规则依据为风险等级、预期收益金额和当前批次库龄；该批次 ${batch.batchCode} 当前风险为 ${selectedPlan.riskLevel}。`);
    } else if (text.includes("风险")) {
      setAiAnswer(`风险拆解：主要来自库龄 ${batch.ageDays} 天、库容集中度 ${batch.concentration}%、期货映射价与现货价差 ${formatNumber(batch.futuresMappedPrice - batch.currentSpotPrice, 2)} 元/kg。`);
    } else if (text.includes("收益") || text.includes("为什么")) {
      setAiAnswer(`收益逻辑：预测售价 ${price(selectedPlan.expectedSellPrice, 2)}/kg - 保本价 ${price(selectedPlan.breakEvenPrice, 2)}/kg = 单吨口径前的单位净收益 ${price(selectedPlan.netProfitPerKg, 2)}/kg，再乘以库存 ${formatNumber(batch.weightKg / 1000, 1)} 吨。`);
    } else {
      setAiAnswer(`已重新解释：${selectedPlan.reason} 当前方案适合在“${strategyLabels[mode]}”场景下作为作战指令草案，执行前需要确认库容、销售渠道和审批状态。`);
    }
    pushLog(`AI 追问：${text}`);
    setAiQuestion("");
  };

  const exportDecision = () => {
    if (!decision || !selectedPlan) return;
    const rows = [
      ["批次", "方案", "预计售价", "保本价", "单kg净收益", "净收益", "风险", "审批"],
      ...decision.plans.map(plan => [
        decision.batch.batchCode,
        plan.label,
        plan.expectedSellPrice,
        plan.breakEvenPrice,
        plan.netProfitPerKg,
        plan.netIncome,
        `${plan.riskScore}/${plan.riskLevel}`,
        plan.approvalRequired ? "需要" : "不需要",
      ]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch-decision-${decision.batch.batchCode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushLog("导出批次决策 CSV");
    toast.success("已导出批次决策记录");
  };

  const operate = (label: string, status: string) => {
    if (!selectedPlan) return;
    setActionStatus(status);
    pushLog(`${label}：${selectedPlan.label}`);
    toast.success(`${label}已生成`);
  };

  return (
    <PlatformShell title="库存批次量化决策页面" eyebrow="AI Batch Decision" pageId="ai-futures-storage-decision">
      <div className="relative min-h-screen overflow-hidden bg-[#03101f] pb-16 text-slate-100">
        <TacticalBackdrop intensity="normal" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-2 p-2">
          <header className="grid h-auto min-h-[58px] items-center gap-3 rounded-[8px] border border-cyan-400/22 bg-[#04172d]/96 px-3 shadow-[0_0_30px_rgba(14,116,195,0.22)] xl:grid-cols-[1fr_680px_1fr]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center border border-amber-300 bg-amber-400/12">
                  <Archive className="h-4 w-4 text-amber-200" />
                </span>
                <span className="text-[18px] font-black text-white">四川眉山</span>
                <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
              </div>
              <div className="hidden h-6 w-px bg-cyan-300/22 md:block" />
              <div className="hidden text-[13px] font-bold text-slate-500 md:block">
                库存管理 / <span className="text-emerald-300">库存批次量化决策</span>
              </div>
            </div>
            <div className="relative text-center">
              <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-[92%] bg-gradient-to-r from-transparent via-cyan-300/75 to-transparent" />
              <h1 className="text-[24px] font-black tracking-[0.04em] text-white md:text-[30px]">
                库存批次量化决策页面
                <span className="ml-3 inline-flex items-center rounded-full border border-cyan-300/22 bg-cyan-400/10 px-3 py-1 align-middle text-[13px] text-cyan-100">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  AI 决策引擎
                </span>
              </h1>
            </div>
            <div className="flex items-center justify-start gap-2 xl:justify-end">
              <Select value={mode} onValueChange={value => runScenario(value as StorageDecisionMode, `已加载${strategyLabels[value as StorageDecisionMode]}场景。`)}>
                <SelectTrigger className="h-9 w-[184px] rounded-[5px] border-cyan-300/20 bg-black/20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">策略版本：v2.4.1（最新）</SelectItem>
                  <SelectItem value="cost_up">成本上升压力</SelectItem>
                  <SelectItem value="price_down">盘面回落压力</SelectItem>
                  <SelectItem value="window_extend">销售周期推迟</SelectItem>
                </SelectContent>
              </Select>
              <button className="relative grid h-9 w-9 place-items-center rounded-full border border-cyan-300/18 bg-black/20">
                <Bell className="h-4 w-4 text-slate-300" />
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">12</span>
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/18 bg-black/20">
                <HelpCircle className="h-4 w-4 text-slate-300" />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-cyan-300/18 bg-black/20 px-3 py-1.5">
                <UserRound className="h-5 w-5 text-cyan-100" />
                <div className="text-[12px] leading-tight">
                  <div className="font-bold text-white">潘猛</div>
                  <div className="text-slate-500">决策专员</div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-2 xl:grid-cols-[370px_minmax(760px,1fr)_470px]">
            <div className="flex flex-col gap-2">
              <Panel>
                <PanelTitle title="批次信息查询" />
                <div className="space-y-3 p-3">
                  <Field label="批次号">
                    <div className="relative">
                      <Select value={batchCode} onValueChange={value => {
                        setBatchCode(value);
                        setSelectedPlanKey("");
                        pushLog(`切换批次：${value}`);
                      }}>
                        <SelectTrigger className="h-9 rounded-[5px] border-cyan-300/20 bg-black/25 pr-8">
                          <SelectValue placeholder="选择批次" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBatches.map(item => <BatchOption key={item.batchCode} batch={item} />)}
                        </SelectContent>
                      </Select>
                      <Search className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </Field>
                  <Field label="部位">
                    <Input value={batch?.partName ?? ""} readOnly className="h-9 rounded-[5px] border-cyan-300/20 bg-black/20" />
                  </Field>
                  <Field label="仓库">
                    <Select value={warehouse} onValueChange={setWarehouse}>
                      <SelectTrigger className="h-9 rounded-[5px] border-cyan-300/20 bg-black/25">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部仓库</SelectItem>
                        {warehouses.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="入库日期">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <Input value="2026-04-18" readOnly className="h-9 rounded-[5px] border-cyan-300/20 bg-black/20 text-xs" />
                      <span className="text-slate-500">~</span>
                      <Input value="2026-04-27" readOnly className="h-9 rounded-[5px] border-cyan-300/20 bg-black/20 text-xs" />
                    </div>
                  </Field>
                  <Field label="自定义">
                    <div className="grid grid-cols-[1fr_44px] gap-2">
                      <Input
                        type="number"
                        min={15}
                        max={180}
                        value={customHoldDays}
                        onChange={event => setCustomHoldDays(Number(event.target.value || 45))}
                        className="h-9 rounded-[5px] border-cyan-300/20 bg-black/20"
                      />
                      <span className="grid place-items-center rounded-[5px] border border-cyan-300/15 bg-black/20 text-xs text-slate-400">天</span>
                    </div>
                  </Field>
                  <Button onClick={runRefresh} className="h-9 w-full rounded-[5px] border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/18">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    刷新真实数据
                  </Button>
                </div>
              </Panel>

              <Panel className="min-h-[430px]">
                <PanelTitle title="批次详情" right={<Database className="h-4 w-4 text-cyan-200" />} />
                <div className="p-3">
                  <DetailRow label="批次号" value={batch?.batchCode ?? "-"} strong />
                  <DetailRow label="产品名称" value={batch?.partName ?? "-"} />
                  <DetailRow label="规格" value="系统库存批次" />
                  <DetailRow label="生产日期" value="2026-04-18" />
                  <DetailRow label="入库日期" value="2026-04-18 09:15" />
                  <DetailRow label="仓库" value={batch?.warehouse ?? "-"} />
                  <DetailRow label="数量" value={`${formatNumber((batch?.weightKg ?? 0) / 1000, 1)} 吨`} strong />
                  <DetailRow label="单位成本" value={batch ? `${price(batch.unitCost, 2)} /kg` : "-"} strong />
                  <DetailRow label="当前市价" value={batch ? `${price(batch.currentSpotPrice, 2)} /kg` : "-"} />
                  <DetailRow label="期货映射价" value={batch ? `${price(batch.futuresMappedPrice, 2)} /kg` : "-"} />
                  <DetailRow label="库龄" value={`${batch?.ageDays ?? "-"} 天`} />
                  <DetailRow label="批次状态" value={<span className="text-emerald-300">可用</span>} />
                  <DetailRow label="质检等级" value="合格（A）" />
                  <DetailRow label="备注" value={scenarioNote} />
                </div>
              </Panel>
            </div>

            <main className="flex flex-col gap-2">
              <Panel>
                <PanelTitle
                  title="方案对比分析（基于当前数据与AI预测）"
                  right={
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-slate-400">预测模型：AI-Price v3.2</span>
                      <Button onClick={runRefresh} className="h-7 rounded-[5px] bg-blue-500 px-3 text-xs text-white hover:bg-blue-400">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        重新预测
                      </Button>
                    </div>
                  }
                />
                <div className="grid gap-2 p-2 md:grid-cols-2 2xl:grid-cols-5">
                  {(decision?.plans ?? []).map((plan, index) => (
                    <PlanCard
                      key={plan.key}
                      plan={plan}
                      index={index}
                      selected={selectedPlan?.key === plan.key}
                      recommended={decision?.selectedPlan.key === plan.key}
                      onClick={() => choosePlan(plan)}
                    />
                  ))}
                </div>
              </Panel>

              <div className="grid gap-2 2xl:grid-cols-[1.08fr_.92fr]">
                <Panel className="min-h-[354px]">
                  <PanelTitle
                    title={selectedPlan ? `方案${selectedPlanIndex + 1} · ${selectedPlan.label}` : "方案测算"}
                    right={<span className="text-[12px] text-slate-500">预计出库日期：{selectedPlan?.holdDays ? `+${selectedPlan.holdDays}天` : "今日"}</span>}
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-[#09223e] text-left text-slate-400">
                          <th className="border border-cyan-300/12 px-3 py-2">项目</th>
                          <th className="border border-cyan-300/12 px-3 py-2">计算方式</th>
                          <th className="border border-cyan-300/12 px-3 py-2 text-right">数值（元/kg）</th>
                          <th className="border border-cyan-300/12 px-3 py-2">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costRows.map(row => (
                          <tr key={row.item} className="text-slate-300">
                            <td className="border border-cyan-300/10 px-3 py-2 font-bold">{row.item}</td>
                            <td className="border border-cyan-300/10 px-3 py-2 text-slate-500">{row.formula}</td>
                            <td className="border border-cyan-300/10 px-3 py-2 text-right font-mono text-cyan-100">{formatNumber(row.value, 2)}</td>
                            <td className="border border-cyan-300/10 px-3 py-2 text-slate-500">{row.description}</td>
                          </tr>
                        ))}
                        {selectedPlan ? (
                          <tr className="bg-emerald-400/[0.08] text-emerald-200">
                            <td className="border border-cyan-300/10 px-3 py-2 font-black">单kg净收益</td>
                            <td className="border border-cyan-300/10 px-3 py-2">预计售价 - 未来保本价</td>
                            <td className="border border-cyan-300/10 px-3 py-2 text-right font-mono text-[16px] font-black">{formatNumber(selectedPlan.netProfitPerKg, 2)}</td>
                            <td className="border border-cyan-300/10 px-3 py-2">乘以库存数量后得到总收益</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel className="min-h-[354px]">
                  <PanelTitle title="未来价格预测趋势（元/kg）" right={<LineChartIcon className="h-4 w-4 text-cyan-200" />} />
                  <div className="h-[304px] p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={decision?.pricePrediction ?? []} margin={{ top: 12, right: 22, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke="#1f3b56" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip content={<TrendTooltip />} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                        {selectedPlan ? <ReferenceLine y={selectedPlan.breakEvenPrice} stroke="#f59e0b" strokeDasharray="6 5" /> : null}
                        <Line type="monotone" dataKey="predictedPrice" name="预测售价" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="futuresMappedPrice" name="期货映射价" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="currentCost" name="当前成本" stroke="#facc15" strokeWidth={2} strokeDasharray="3 4" dot={false} />
                        <Line type="monotone" dataKey="breakEvenPrice" name="保本价" stroke="#fb923c" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <div className="grid gap-2 2xl:grid-cols-[.82fr_1.18fr]">
                <Panel>
                  <PanelTitle title="风险评分" right={selectedPlan ? <RiskBadge level={selectedPlan.riskLevel} /> : null} />
                  <div className="grid gap-2 p-3 md:grid-cols-2">
                    {riskCards.map(card => (
                      <div key={card.label} className="rounded-[8px] border border-cyan-300/14 bg-black/20 p-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 font-mono text-[18px] font-black text-cyan-200">
                            {formatNumber(card.value, 0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{card.label}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{card.sub}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="col-span-full rounded-[8px] border border-emerald-300/20 bg-emerald-400/[0.08] p-4">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[38px] font-black text-emerald-300">{formatNumber(selectedPlan?.riskScore ?? 0, 0)}</span>
                        <div>
                          <p className="font-black text-emerald-200">/100　综合风险可控，建议执行</p>
                          <p className="mt-1 text-[12px] text-slate-500">风险评分由库龄、价差、集中度、持有周期共同决定。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <PanelTitle title="AI 决策解释" right={<Bot className="h-4 w-4 text-cyan-200" />} />
                  <div className="grid gap-3 p-3 md:grid-cols-[96px_1fr]">
                    <div className="flex flex-col items-center justify-center rounded-[8px] border border-cyan-300/16 bg-black/18 p-3">
                      <div className="grid h-16 w-16 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10">
                        <Bot className="h-10 w-10 text-cyan-100" />
                      </div>
                      <span className="mt-3 rounded-[5px] border border-cyan-300/20 px-2 py-1 text-[12px] text-cyan-100">AI</span>
                    </div>
                    <div>
                      <div className="rounded-[8px] border border-cyan-300/15 bg-black/18 p-3 text-[13px] leading-7 text-slate-300">
                        <p><span className="font-black text-emerald-300">结论：</span>{selectedPlan ? `推荐执行 ${selectedPlan.label}，动作：${selectedPlan.action}。` : "等待数据加载。"}</p>
                        <p className="mt-2"><span className="font-black text-cyan-200">原因分析：</span>{selectedPlan?.reason ?? decision?.ai.interpretation}</p>
                        <p className="mt-2"><span className="font-black text-cyan-200">是否需要审批：</span>{selectedPlan?.approvalRequired ? "需要，因收益金额或风险规则触发审批。" : "不需要，可直接进入执行确认。"}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["为什么推荐这个方案？", "审批规则是什么？", "主要风险在哪里？"].map(item => (
                          <button key={item} onClick={() => askAI(item)} className="rounded-[5px] border border-cyan-300/18 bg-cyan-400/[0.08] px-3 py-1.5 text-[12px] text-cyan-100 hover:bg-cyan-400/15">
                            {item}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                        <Input
                          value={aiQuestion}
                          onChange={event => setAiQuestion(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === "Enter") askAI();
                          }}
                          placeholder="向 AI 追问收益、风险、审批、执行动作..."
                          className="h-9 rounded-[5px] border-cyan-300/20 bg-black/25"
                        />
                        <Button onClick={() => askAI()} className="h-9 rounded-[5px] bg-blue-500 px-5 text-white hover:bg-blue-400">
                          <Send className="mr-1.5 h-4 w-4" />
                          发送
                        </Button>
                      </div>
                      <div className="mt-2 rounded-[6px] border border-cyan-300/12 bg-cyan-400/[0.06] px-3 py-2 text-[12px] leading-6 text-cyan-50/80">
                        {aiAnswer}
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <Button onClick={() => operate("确认出售", "已生成出售执行单")} className="h-11 min-w-[160px] rounded-[5px] bg-emerald-500 text-[15px] font-black text-slate-950 hover:bg-emerald-400">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    确认出售（方案1）
                  </Button>
                  <Button onClick={() => operate("确认持有", "已锁定持有计划")} className="h-11 min-w-[160px] rounded-[5px] bg-blue-500 text-[15px] font-black text-white hover:bg-blue-400">
                    <Warehouse className="mr-2 h-4 w-4" />
                    确认持有
                  </Button>
                  <Button onClick={() => operate("提交审批", "待审批")} className="h-11 min-w-[150px] rounded-[5px] bg-violet-500 text-[15px] font-black text-white hover:bg-violet-400">
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    提交审批
                  </Button>
                  <Button onClick={() => operate("保存模拟方案", "已保存模拟方案")} className="h-11 rounded-[5px] border border-cyan-300/20 bg-cyan-400/10 px-5 font-bold text-cyan-100 hover:bg-cyan-400/18">
                    <Save className="mr-2 h-4 w-4" />
                    保存模拟方案
                  </Button>
                  <Button onClick={() => operate("生成工单", "已生成作战工单")} className="h-11 rounded-[5px] border border-cyan-300/20 bg-cyan-400/10 px-5 font-bold text-cyan-100 hover:bg-cyan-400/18">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    生成工单
                  </Button>
                  <Button onClick={() => operate("写入审计", "审计已记录")} className="h-11 rounded-[5px] border border-cyan-300/20 bg-cyan-400/10 px-5 font-bold text-cyan-100 hover:bg-cyan-400/18">
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    写入审计
                  </Button>
                  <Button onClick={exportDecision} className="h-11 rounded-[5px] border border-cyan-300/20 bg-cyan-400/10 px-5 font-bold text-cyan-100 hover:bg-cyan-400/18">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    导出
                  </Button>
                </div>
                <div className="border-t border-cyan-300/12 px-4 py-2 text-[12px] text-slate-500">
                  温馨提示：确认后将生成执行工单并锁定当前策略数据，用于后续审计与复盘。当前状态：<span className="text-cyan-200">{actionStatus}</span>
                </div>
              </Panel>
            </main>

            <aside className="flex flex-col gap-2">
              <Panel>
                <PanelTitle title="决策记录" right={<Button onClick={runRefresh} className="h-7 rounded-[5px] border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs text-cyan-100 hover:bg-cyan-400/18"><RefreshCw className="mr-1 h-3.5 w-3.5" />刷新</Button>} />
                <div className="p-3">
                  <DetailRow label="策略版本" value={<span>v2.4.1 <span className="ml-2 rounded bg-emerald-400/12 px-2 py-0.5 text-[11px] text-emerald-300">当前</span></span>} />
                  <DetailRow label="创建时间" value={formatTime(decision?.decisionRecord.createdAt)} />
                  <DetailRow label="创建人" value={decision?.decisionRecord.createdBy ?? "潘猛"} />
                  <DetailRow label="数据快照" value={formatTime(decision?.decisionRecord.dataAsOf)} />
                  <DetailRow label="预测模型" value={decision?.decisionRecord.predictionModel ?? "AI-Price v3.2"} />
                  <DetailRow label="方案状态" value={<span className="text-amber-200">{decision?.decisionRecord.status ?? "待决策"}</span>} />
                  <button className="mt-3 flex h-9 w-full items-center justify-center rounded-[5px] border border-blue-300/25 bg-blue-500/12 text-[13px] text-blue-100">
                    <Info className="mr-2 h-4 w-4" />
                    查看版本对比
                  </button>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="审批流与操作记录" right={<ClipboardCheck className="h-4 w-4 text-cyan-200" />} />
                <div className="space-y-3 p-3">
                  {(decision?.workflow ?? []).map((item, index) => (
                    <div key={item.stage} className="grid grid-cols-[82px_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-full border",
                            item.status === "done" && "border-emerald-300/35 bg-emerald-400/12 text-emerald-200",
                            item.status === "active" && "border-amber-300/35 bg-amber-400/12 text-amber-200",
                            item.status === "pending" && "border-slate-400/25 bg-slate-400/8 text-slate-400",
                          )}
                        >
                          {index + 1}
                        </span>
                        {index < (decision?.workflow.length ?? 0) - 1 ? <span className="h-12 w-px bg-cyan-300/18" /> : null}
                      </div>
                      <div className="rounded-[7px] border border-cyan-300/14 bg-black/18 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-cyan-100">{item.stage}</span>
                          <span className="font-mono text-[11px] text-slate-500">{formatTime(item.timestamp).slice(11)}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-slate-500">{item.operator}</p>
                        <div className="mt-2 space-y-1">
                          {item.notes.map(note => (
                            <p key={note} className="text-[12px] text-slate-300">
                              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-300" />
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="战略模拟系统" right={<Sparkles className="h-4 w-4 text-amber-200" />} />
                <div className="grid gap-2 p-3">
                  <button onClick={() => runScenario("base", "恢复基准经营场景。")} className="rounded-[6px] border border-cyan-300/16 bg-cyan-400/[0.06] px-3 py-2 text-left text-[13px] text-slate-300 hover:bg-cyan-400/[0.12]">
                    基准盘面：使用当前行情与库存数据
                  </button>
                  <button onClick={() => runScenario("cost_up", "模拟仓储、资金和损耗成本上升。")} className="rounded-[6px] border border-amber-300/18 bg-amber-400/[0.06] px-3 py-2 text-left text-[13px] text-slate-300 hover:bg-amber-400/[0.12]">
                    成本上升：检验保本价抬升后的可执行性
                  </button>
                  <button onClick={() => runScenario("price_down", "模拟盘面回落与销售价格承压。")} className="rounded-[6px] border border-red-300/18 bg-red-400/[0.06] px-3 py-2 text-left text-[13px] text-slate-300 hover:bg-red-400/[0.12]">
                    盘面回落：压测收益和库存处置风险
                  </button>
                  <button onClick={() => runScenario("window_extend", "模拟销售周期推迟与持有窗口延长。")} className="rounded-[6px] border border-blue-300/18 bg-blue-400/[0.06] px-3 py-2 text-left text-[13px] text-slate-300 hover:bg-blue-400/[0.12]">
                    销售推迟：拉长周期并重新评估审批规则
                  </button>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="历史决策记录（近30天）" />
                <div className="p-3">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#09223e] text-slate-500">
                      <tr>
                        <th className="px-2 py-2">时间</th>
                        <th className="px-2 py-2">批次号</th>
                        <th className="px-2 py-2">方案</th>
                        <th className="px-2 py-2">收益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(decision?.history ?? []).map(row => (
                        <tr key={`${row.date}-${row.batchCode}`} className="border-b border-white/[0.06] text-slate-300">
                          <td className="px-2 py-2 text-slate-500">{row.date}</td>
                          <td className="px-2 py-2 font-mono">{row.batchCode}</td>
                          <td className="px-2 py-2">{row.plan}</td>
                          <td className={cn("px-2 py-2 font-mono", row.profit >= 0 ? "text-emerald-300" : "text-red-300")}>{money(row.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="执行日志与数据真实性审核" right={<LiveSignal label="已校验" />} />
                <div className="space-y-2 p-3">
                  {logs.map(log => (
                    <div key={log} className="rounded-[5px] border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-slate-300">
                      {log}
                    </div>
                  ))}
                  {(decision?.ai.auditNotes ?? []).map(note => (
                    <div key={note} className="rounded-[6px] border border-cyan-300/14 bg-cyan-400/[0.055] p-3 text-[12px] leading-6 text-slate-300">
                      <AlertTriangle className="mr-2 inline h-4 w-4 text-yellow-300" />
                      {note}
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
