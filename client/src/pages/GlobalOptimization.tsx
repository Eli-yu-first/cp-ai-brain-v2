import { TechPanel } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptimizationChat } from "@/components/OptimizationChatLauncher";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Factory,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Package,
  PiggyBank,
  Play,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GlobalOptimizationTuningInput } from "@shared/globalOptimization";

const MONTH_LABELS: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

const ROLE_CONFIG: Record<string, { icon: typeof Users; color: string; label: string; badgeColor: string }> = {
  purchasing: { icon: PiggyBank, color: "text-amber-400", label: "采购负责人", badgeColor: "bg-amber-500" },
  production: { icon: Factory, color: "text-cyan-400", label: "生产调度组", badgeColor: "bg-cyan-500" },
  sales: { icon: TrendingUp, color: "text-emerald-400", label: "深加工组", badgeColor: "bg-emerald-500" },
  warehouse: { icon: Truck, color: "text-blue-400", label: "物流车队", badgeColor: "bg-blue-500" },
};

const PART_COLORS: Record<string, string> = {
  "白条": "#06b6d4", "五花肉": "#f59e0b", "前腿肉": "#10b981", "后腿肉": "#6366f1",
  "排骨": "#ef4444", "里脊": "#ec4899", "肘子": "#8b5cf6", "猪蹄": "#14b8a6",
  "猪头": "#f97316", "内脏": "#84cc16", "板油": "#a855f7", "肥膘": "#78716c",
};

type TaskStatus = "pending" | "thinking" | "analyzing" | "dispatching" | "completed" | "error";

type ThinkingStep = {
  id: number;
  phase: string;
  title: string;
  detail: string;
  status: TaskStatus;
  progress: number;
};

const THINKING_STEPS: Omit<ThinkingStep, "status" | "progress">[] = [
  { id: 0, phase: "init", title: "初始化求解引擎", detail: "加载输入参数，构建约束矩阵..." },
  { id: 1, phase: "slaughter", title: "屠宰产能分配计算", detail: "按省份匹配养殖场出栏与屠宰厂能力上限..." },
  { id: 2, phase: "split", title: "分割产出率映射", detail: "根据出品率BOM树计算各部位产出量..." },
  { id: 3, phase: "split", title: "分割能力约束检查", detail: "对比分割上限/冷冻上限/库容上限..." },
  { id: 4, phase: "sales", title: "销售需求优先级排序", detail: "按利润率从高到低排列订单需求..." },
  { id: 5, phase: "sales", title: "贪心分配执行", detail: "逐条满足高利润订单，剩余转入冷冻..." },
  { id: 6, phase: "cost", title: "全成本分摊计算", detail: "毛猪成本按部位权重分摊，叠加仓储和运输成本..." },
  { id: 7, phase: "cost", title: "汇总统计生成", detail: "计算总收入、总成本、净利润、产能利用率..." },
  { id: 8, phase: "ai", title: "AI决策引擎分析", detail: "分析关键发现、识别瓶颈、评估风险..." },
  { id: 9, phase: "ai", title: "角色任务分配生成", detail: "为采购/生产/销售/仓储四角色生成执行工单..." },
  { id: 10, phase: "dispatch", title: "工单派发完成", detail: "所有决策已生成，等待确认执行..." },
];

const DEFAULT_TUNING: GlobalOptimizationTuningInput = {
  slaughterCountMultiplier: 1,
  avgWeightAdjustmentKg: 0,
  livePigPriceAdjustment: 0,
  slaughterCapacityMultiplier: 1,
  splitCapacityMultiplier: 1,
  freezeCapacityMultiplier: 1,
  storageCostMultiplier: 1,
  transportCostMultiplier: 1,
  partPriceAdjustments: {},
};

const SLIDER_CONFIG: Array<{
  key: keyof GlobalOptimizationTuningInput;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: typeof Sliders;
  color: string;
}> = [
  { key: "slaughterCountMultiplier", label: "出栏量倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: PiggyBank, color: "text-amber-400" },
  { key: "avgWeightAdjustmentKg", label: "均重调整", min: -20, max: 20, step: 1, unit: "kg", icon: Package, color: "text-blue-400" },
  { key: "livePigPriceAdjustment", label: "毛猪价格调整", min: -5, max: 5, step: 0.2, unit: "元/kg", icon: TrendingDown, color: "text-red-400" },
  { key: "slaughterCapacityMultiplier", label: "屠宰产能倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: Factory, color: "text-cyan-400" },
  { key: "splitCapacityMultiplier", label: "分割能力倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: LayoutDashboard, color: "text-violet-400" },
  { key: "freezeCapacityMultiplier", label: "冷冻能力倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: Warehouse, color: "text-indigo-400" },
  { key: "storageCostMultiplier", label: "仓储成本倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: Warehouse, color: "text-orange-400" },
  { key: "transportCostMultiplier", label: "运输成本倍率", min: 0.5, max: 1.5, step: 0.05, unit: "x", icon: Truck, color: "text-emerald-400" },
];

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(1)}万`;
  return val.toFixed(0);
}

function SummaryCard({ label, value, unit, icon: Icon, color, delta }: {
  label: string; value: string; unit?: string; icon: typeof Target; color: string; delta?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative">
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}{unit ? ` (${unit})` : ""}</p>
      {delta !== undefined && delta !== 0 && (
        <span className={`absolute top-2 right-2 text-[10px] font-mono font-bold ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
          {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function DataTable({ title, icon: Icon, headers, rows, maxH = 300 }: {
  title: string; icon: typeof LayoutDashboard; headers: string[];
  rows: React.ReactNode[][]; maxH?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayRows = expanded ? rows : rows.slice(0, 15);
  return (
    <TechPanel className="p-0 overflow-hidden rounded-[20px]">
      <div className="p-4 border-b border-white/[0.08] bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-400" />
          {title}
          <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-slate-400">{rows.length} 条</Badge>
        </h3>
        {rows.length > 15 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "收起" : `展开全部 (${rows.length})`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto" style={{ maxHeight: maxH, overflowY: expanded ? "auto" : "hidden" }}>
        <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
          <thead className="bg-[#0b1426] sticky top-0 z-10 text-slate-400">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {displayRows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5">{cell}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </TechPanel>
  );
}

function StatusDot({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { bg: string; pulse?: boolean }> = {
    pending: { bg: "bg-slate-600" },
    thinking: { bg: "bg-indigo-500", pulse: true },
    analyzing: { bg: "bg-cyan-500", pulse: true },
    dispatching: { bg: "bg-amber-500", pulse: true },
    completed: { bg: "bg-emerald-500" },
    error: { bg: "bg-red-500" },
  };
  const c = config[status]!;
  return (
    <span className={`relative flex h-2 w-2 shrink-0 rounded-full ${c.bg}`}>
      {c.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />}
    </span>
  );
}

function ThinkingPanel({ steps, currentStep }: { steps: ThinkingStep[]; currentStep: number }) {
  return (
    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStep;
        const isPast = idx < currentStep && step.status === "completed";
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors duration-300 ${
              isCurrent ? "bg-indigo-500/15 border border-indigo-500/30"
              : isPast ? "bg-emerald-500/[0.04]"
              : "bg-white/[0.02]"
            }`}
          >
            <StatusDot status={step.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-[11px] font-medium leading-tight ${
                  isCurrent ? "text-indigo-200" : isPast ? "text-slate-400" : "text-slate-500"
                }`}>
                  {step.title}
                </p>
                {isCurrent && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-indigo-500/20 text-indigo-300 border-0 shrink-0">进行中</Badge>
                )}
                {isPast && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              </div>
              {(isCurrent || isPast) && (
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{step.detail}</p>
              )}
              {isCurrent && (
                <div className="mt-1.5 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${steps[currentStep]?.progress ?? 0}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function DispatchCard({ target, role, action, status, index }: {
  target: string; role: string; action: string; status: TaskStatus; index: number;
}) {
  const roleConf = ROLE_CONFIG[role];
  const RoleIcon = roleConf?.icon ?? Users;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.18, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative p-4 rounded-xl border transition-all duration-500 ${
        status === "completed"
          ? "bg-emerald-500/8 border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : status === "dispatching"
          ? "bg-orange-500/10 border-orange-500/35 shadow-[0_0_24px_rgba(249,115,22,0.15)]"
          : "bg-slate-800/40 border-slate-700/50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider text-white ${
            status === "completed" ? "bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
            : status === "dispatching" ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse"
            : "bg-slate-700"
          }`}>
            {target}
          </span>
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${roleConf?.color ?? "text-slate-200"}`}>
            <RoleIcon className="h-3.5 w-3.5" />
            {roleConf?.label ?? role}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {status === "dispatching" && (
            <><span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" /><span className="text-[10px] text-orange-400 font-medium">派发中</span></>
          )}
          {status === "completed" && (
            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-medium">已确认</span></>
          )}
          {status === "pending" && (
            <><Clock className="h-3 w-3.5 text-slate-500" /><span className="text-[10px] text-slate-500">待派发</span></>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 font-mono leading-relaxed">{action}</p>
      {status === "dispatching" && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "linear" }}
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-b-xl"
        />
      )}
    </motion.div>
  );
}

function TuningSlider({ config, value, onChange }: {
  config: typeof SLIDER_CONFIG[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const Icon = config.icon;
  const isDefault = value === (config.key === "avgWeightAdjustmentKg" || config.key === "livePigPriceAdjustment" ? 0 : 1);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          {config.label}
        </span>
        <span className={`text-[11px] font-mono ${isDefault ? "text-slate-500" : "text-indigo-300"}`}>
          {value}{config.unit}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.08] accent-indigo-500
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.5)]
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-slate-600">
        <span>{config.min}{config.unit}</span>
        <span>{config.max}{config.unit}</span>
      </div>
    </div>
  );
}

export default function GlobalOptimizationPage() {
  const { t } = useLanguage();
  const { setController } = useOptimizationChat();
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "input" | "decision">("output");
  const [tuning, setTuning] = useState<GlobalOptimizationTuningInput>(DEFAULT_TUNING);
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>(
    THINKING_STEPS.map(s => ({ ...s, status: "pending" as TaskStatus, progress: 0 }))
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [dispatchTasks, setDispatchTasks] = useState<Array<{
    target: string; role: string; action: string; status: TaskStatus;
  }>>([]);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: result, isLoading, refetch } = trpc.platform.globalOptimizationSimulate.useQuery(
    { tuning: { ...tuning, partPriceAdjustments: tuning.partPriceAdjustments as Record<string, number> | undefined } },
    { refetchOnWindowFocus: false }
  );

  const chatMutation = trpc.platform.globalOptimizationChat.useMutation();

  const summary = result?.output?.summary;
  const baselineSummary = result?.baseline?.output?.summary;

  const handleRunOptimization = useCallback(() => {
    setIsRunning(true);
    setShowThinking(true);
    setShowResult(false);
    setThinkingSteps(THINKING_STEPS.map(s => ({ ...s, status: "pending" as TaskStatus, progress: 0 })));
    setCurrentStep(-1);
    setDispatchTasks([]);

    let stepIdx = -1;
    timerRef.current = setInterval(() => {
      stepIdx++;
      if (stepIdx >= THINKING_STEPS.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setThinkingSteps(prev => prev.map((s) => ({ ...s, status: "completed" as TaskStatus, progress: 100 })));
        refetch().then(() => {
          setTimeout(() => {
            const decision = result?.decision ?? refetch().then(r => r.data?.decision);
            if (decision) generateDispatchTasks(decision);
            setShowResult(true);
            setIsRunning(false);
          }, 400);
        });
        return;
      }
      setCurrentStep(stepIdx);
      setThinkingSteps(prev => prev.map((s, i) => {
        if (i < stepIdx) return { ...s, status: "completed" as TaskStatus, progress: 100 };
        if (i === stepIdx) return { ...s, status: "thinking" as TaskStatus, progress: 0 };
        return s;
      }));
      let prog = 0;
      const progTimer = setInterval(() => {
        prog += Math.random() * 25 + 10;
        if (prog >= 100) {
          prog = 100;
          clearInterval(progTimer);
          setThinkingSteps(prev => prev.map((s, i) =>
            i === stepIdx ? { ...s, status: "completed" as TaskStatus, progress: 100 } : s
          ));
        } else {
          setThinkingSteps(prev => prev.map((s, i) =>
            i === stepIdx ? { ...s, progress: Math.min(prog, 99) } : s
          ));
        }
      }, 150);
    }, 700);
  }, [refetch, result]);

  const generateDispatchTasks = useCallback((decision: any) => {
    const tasks: Array<{ target: string; role: string; action: string; status: TaskStatus }> = [];
    const roleMap: Array<{ roleId: string; targetPrefix: string }> = [
      { roleId: "production", targetPrefix: "FAC-SH-" },
      { roleId: "sales", targetPrefix: "FAC-SH-" },
      { roleId: "warehouse", targetPrefix: "TRA-" },
    ];
    let taskIdx = 0;
    roleMap.forEach(({ roleId, targetPrefix }) => {
      const actions = decision?.roleActions?.[roleId] ?? [];
      actions.slice(0, 2).forEach((action: string) => {
        tasks.push({ target: `${targetPrefix}${String(taskIdx + 1).padStart(2, "0")}`, role: roleId, action, status: "pending" as TaskStatus });
        taskIdx++;
      });
    });
    setDispatchTasks(tasks);
    let idx = 0;
    const dispatchNext = () => {
      if (idx >= tasks.length) return;
      setDispatchTasks(prev => prev.map((t, i) => i === idx ? { ...t, status: "dispatching" as TaskStatus } : t));
      const currentIdx = idx;
      setTimeout(() => {
        setDispatchTasks(prev => prev.map((t, i) => i === currentIdx ? { ...t, status: "completed" as TaskStatus } : t));
        idx++;
        dispatchNext();
      }, 1200 + Math.random() * 800);
    };
    dispatchNext();
  }, []);

  const handleTuningChange = useCallback((key: keyof GlobalOptimizationTuningInput, value: number) => {
    setTuning(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResetTuning = useCallback(() => {
    setTuning(DEFAULT_TUNING);
  }, []);

  useEffect(() => {
    setController({
      isLoading: chatMutation.isPending,
      onSendMessage: async (content: string) => {
        const chatResult = await chatMutation.mutateAsync({
          messages: [{ role: "user" as const, content }],
          tuning: { ...tuning, partPriceAdjustments: tuning.partPriceAdjustments as Record<string, number> | undefined },
        });
        if (chatResult.suggestion.parameterSuggestions) {
          setTuning(prev => ({
            ...prev,
            ...chatResult.suggestion.parameterSuggestions,
            partPriceAdjustments: {
              ...(prev.partPriceAdjustments ?? {}),
              ...(chatResult.suggestion.parameterSuggestions.partPriceAdjustments ?? {}),
            },
          }));
        }
        await refetch();
        return {
          userMessage: content,
          assistantMessage: chatResult.suggestion.reasoningSummary,
          suggestion: chatResult.suggestion,
          appliedParameters: chatResult.appliedParameters,
          sensitivity: chatResult.sensitivity,
        };
      },
    });
    return () => setController(null);
  }, [chatMutation, tuning, refetch, setController]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const profitByMonth = useMemo(() => {
    if (!result?.output?.profitTable) return [];
    const map = new Map<number, { revenue: number; profit: number; pigCost: number; storageCost: number; transportCost: number }>();
    for (const p of result.output.profitTable) {
      const existing = map.get(p.month) ?? { revenue: 0, profit: 0, pigCost: 0, storageCost: 0, transportCost: 0 };
      existing.revenue += p.revenue;
      existing.profit += p.profit;
      existing.pigCost += p.pigCost;
      existing.storageCost += p.storageCost;
      existing.transportCost += p.transportCost;
      map.set(p.month, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, data]) => ({ month: MONTH_LABELS[month] ?? `${month}月`, ...data }));
  }, [result]);

  const profitByPart = useMemo(() => {
    if (!result?.output?.profitTable) return [];
    const map = new Map<string, { profit: number; revenue: number; salesKg: number }>();
    for (const p of result.output.profitTable) {
      const existing = map.get(p.part) ?? { profit: 0, revenue: 0, salesKg: 0 };
      existing.profit += p.profit;
      existing.revenue += p.revenue;
      existing.salesKg += p.salesKg;
      map.set(p.part, existing);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.profit - a.profit)
      .map(([part, data]) => ({ part, ...data, fill: PART_COLORS[part] ?? "#64748b" }));
  }, [result]);

  const salesByChannel = useMemo(() => {
    if (!result?.output?.salesTable) return [];
    const map = new Map<string, number>();
    for (const s of result.output.salesTable) {
      map.set(s.customerType, (map.get(s.customerType) ?? 0) + s.orderQty * s.salesPrice);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [result]);

  const hasTuningChanges = useMemo(() => {
    return JSON.stringify(tuning) !== JSON.stringify(DEFAULT_TUNING);
  }, [tuning]);

  return (
    <PlatformShell title="全链最优化调度" eyebrow="Optimization Scheduling 2" pageId="optimization-scheduling2">
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <Target className="h-7 w-7 text-indigo-400" />
              全链最优化调度 — 全链利润最大化求解
            </h1>
            <p className="text-slate-500 text-xs">
              基于多约束条件的最优排产算法 · AI智能决策引擎 · 四角色工单自动派发 · 可交互调参预测
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              onClick={handleResetTuning}
              disabled={!hasTuningChanges || isRunning}
              variant="outline"
              size="sm"
              className="border-white/[0.1] text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              重置参数
            </Button>
            <Button
              onClick={handleRunOptimization}
              disabled={isRunning || isLoading}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_18px_rgba(79,70,229,0.45)] transition-all hover:shadow-[0_0_24px_rgba(79,70,229,0.6)]"
            >
              {isRunning ? (
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" />求解中...</span>
              ) : (
                <span className="flex items-center gap-2"><Play className="h-4 w-4" />执行最优化求解</span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            {(["output", "input", "decision"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600/30 text-indigo-200 border-b-2 border-indigo-400"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {tab === "output" ? "输出结果" : tab === "input" ? "输入参数" : "AI决策"}
              </button>
            ))}
          </div>
          {hasTuningChanges && (
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/25 text-[10px]">
              参数已调整 · 结果已更新
            </Badge>
          )}
        </div>

        {activeTab === "input" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <TechPanel className="p-6 rounded-[20px]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    交互式参数调节面板
                  </h3>
                  <p className="text-[10px] text-slate-500">调整参数后自动重新求解，实时预览利润变化</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
                  {SLIDER_CONFIG.map(cfg => (
                    <TuningSlider
                      key={cfg.key}
                      config={cfg}
                      value={(tuning[cfg.key] as number) ?? (cfg.key === "avgWeightAdjustmentKg" || cfg.key === "livePigPriceAdjustment" ? 0 : 1)}
                      onChange={(v) => handleTuningChange(cfg.key, v)}
                    />
                  ))}
                </div>
                {hasTuningChanges && result?.appliedParameters && result.appliedParameters.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/[0.06]">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">已应用参数变更</p>
                    <div className="flex flex-wrap gap-2">
                      {result.appliedParameters.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                          {p.label}: {p.previousValue} → {p.nextValue} {p.unit ?? ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TechPanel>

              {result?.sensitivity && hasTuningChanges && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">利润变化</p>
                    <p className={`text-lg font-mono font-bold ${result.sensitivity.totalProfitDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.sensitivity.totalProfitDelta >= 0 ? "+" : ""}{formatCurrency(result.sensitivity.totalProfitDelta)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">利润率变化</p>
                    <p className={`text-lg font-mono font-bold ${result.sensitivity.profitMarginDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.sensitivity.profitMarginDelta >= 0 ? "+" : ""}{result.sensitivity.profitMarginDelta.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">产能利用率变化</p>
                    <p className={`text-lg font-mono font-bold ${result.sensitivity.capacityUtilizationDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.sensitivity.capacityUtilizationDelta >= 0 ? "+" : ""}{result.sensitivity.capacityUtilizationDelta.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">瓶颈变化</p>
                    <p className={`text-lg font-mono font-bold ${result.sensitivity.bottleneckDelta <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.sensitivity.bottleneckDelta <= 0 ? "" : "+"}{result.sensitivity.bottleneckDelta}
                    </p>
                  </div>
                </div>
              )}

              {result?.input && (
                <>
                  <DataTable
                    title="出栏表"
                    icon={PiggyBank}
                    headers={["养殖场ID", "省份", "月份", "出栏量(头)", "均重(kg)", "毛猪价格", "网站价格", "期货价格"]}
                    rows={(result.input.slaughterSchedule ?? []).map((r) => [
                      <span className="font-mono text-cyan-200/80">{r.farmId}</span>,
                      <span>{r.province}</span>,
                      <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                      <span className="font-mono">{r.count.toLocaleString()}</span>,
                      <span className="font-mono">{r.avgWeightKg}</span>,
                      <span className="font-mono text-amber-300">¥{r.livePigPrice.toFixed(2)}</span>,
                      <span className="font-mono text-blue-300">{r.websitePrice ? `¥${r.websitePrice.toFixed(2)}` : "-"}</span>,
                      <span className="font-mono text-violet-300">{r.futuresPrice ? `¥${r.futuresPrice.toFixed(2)}` : "-"}</span>,
                    ])}
                    maxH={300}
                  />
                  <DataTable
                    title="出品率表"
                    icon={Factory}
                    headers={["父物料", "子物料", "产出率", "工艺", "加工成本(元/头)", "是否储备"]}
                    rows={(result.input.yieldRates ?? []).map((r) => [
                      <span>{r.parentMaterial}</span>,
                      <span className="font-medium">{r.childMaterial}</span>,
                      <span className="font-mono">{(r.yieldRate * 100).toFixed(0)}%</span>,
                      <span>工艺{r.process}</span>,
                      <span className="font-mono text-amber-300/80">{r.slaughterCostPerHead ?? "-"}</span>,
                      <span>{r.isReserve ? <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">储备</Badge> : <Badge variant="secondary" className="text-[9px] bg-white/[0.04] text-slate-500">否</Badge>}</span>,
                    ])}
                    maxH={250}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <DataTable
                      title="屠宰厂能力表"
                      icon={Factory}
                      headers={["屠宰厂ID", "省份", "月份", "屠宰上限(头)"]}
                      rows={(result.input.slaughterCapacity ?? []).map((r) => [
                        <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                        <span>{r.province}</span>,
                        <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                        <span className="font-mono">{r.maxSlaughter.toLocaleString()}</span>,
                      ])}
                      maxH={250}
                    />
                    <DataTable
                      title="分割能力表"
                      icon={LayoutDashboard}
                      headers={["工厂ID", "分割部位", "分割上限(kg)", "冷冻上限(kg)", "库容上限(kg)", "库存成本系数", "月份"]}
                      rows={(result.input.splitCapacity ?? []).slice(0, 30).map((r) => [
                        <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                        <span className="font-medium">{r.part}</span>,
                        <span className="font-mono">{r.maxSplitKg.toLocaleString()}</span>,
                        <span className="font-mono">{r.maxFreezeKg.toLocaleString()}</span>,
                        <span className="font-mono">{r.maxStorageKg.toLocaleString()}</span>,
                        <span className="font-mono">{r.storageCostRate}</span>,
                        <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                      ])}
                      maxH={250}
                    />
                  </div>
                  <DataTable
                    title="运输费用表"
                    icon={Truck}
                    headers={["输出省份", "订单售达省份", "运输成本(元/kg/公里)", "距离(公里)"]}
                    rows={(result.input.transportCosts ?? []).map((r) => [
                      <span>{r.originProvince}</span>,
                      <span>{r.destinationProvince}</span>,
                      <span className="font-mono">{r.costPerKmPerKg.toFixed(4)}</span>,
                      <span className="font-mono">{r.distanceKm}</span>,
                    ])}
                    maxH={300}
                  />
                  {(result.input.splitCosts ?? []).length > 0 && (
                    <DataTable
                      title="分割成本表"
                      icon={LayoutDashboard}
                      headers={["工厂ID", "分割部位", "分割费用(元/kg)", "速冻包装费用(元/kg)"]}
                      rows={(result.input.splitCosts ?? []).map((r) => [
                        <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                        <span className="font-medium">{r.part}</span>,
                        <span className="font-mono text-amber-300/80">¥{r.splitCostPerKg.toFixed(2)}</span>,
                        <span className="font-mono text-blue-300/80">¥{r.freezePackCostPerKg.toFixed(2)}</span>,
                      ])}
                      maxH={250}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {summary && activeTab === "output" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <SummaryCard
                  icon={PiggyBank} label="总利润" value={formatCurrency(summary.totalProfit)} unit="元" color="text-emerald-400"
                  delta={baselineSummary && baselineSummary.totalProfit !== summary.totalProfit
                    ? ((summary.totalProfit - baselineSummary.totalProfit) / Math.abs(baselineSummary.totalProfit || 1)) * 100 : undefined}
                />
                <SummaryCard
                  icon={TrendingUp} label="总收入" value={formatCurrency(summary.totalRevenue)} unit="元" color="text-cyan-400"
                  delta={baselineSummary && baselineSummary.totalRevenue !== summary.totalRevenue
                    ? ((summary.totalRevenue - baselineSummary.totalRevenue) / Math.abs(baselineSummary.totalRevenue || 1)) * 100 : undefined}
                />
                <SummaryCard icon={Target} label="利润率" value={`${summary.profitMargin}%`} color="text-amber-400" />
                <SummaryCard icon={Factory} label="屠宰量" value={`${summary.totalSlaughterCount.toLocaleString()}`} unit="头" color="text-violet-400" />
                <SummaryCard icon={Package} label="销量" value={`${(summary.totalSalesKg / 1000).toFixed(0)}`} unit="吨" color="text-blue-400" />
                <SummaryCard icon={Zap} label="产能利用率" value={`${summary.capacityUtilization}%`} color="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-cyan-400" />
                    月度利润与收入趋势
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={profitByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="收入" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="profit" name="利润" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                      <Line type="monotone" dataKey="pigCost" name="毛猪成本" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </TechPanel>

                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-amber-400" />
                    部位利润排名
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={profitByPart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                      <YAxis dataKey="part" type="category" tick={{ fill: "#cbd5e1", fontSize: 11 }} width={60} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="profit" name="利润" radius={[0, 4, 4, 0]}>
                        {profitByPart.map((entry, index) => (<Cell key={index} fill={entry.fill} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TechPanel>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-400" />
                    渠道收入分布
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={salesByChannel} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {salesByChannel.map((_, index) => (<Cell key={index} fill={["#06b6d4", "#f59e0b", "#10b981", "#6366f1", "#ef4444"][index % 5]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </TechPanel>

                <div className="xl:col-span-2">
                  <DataTable
                    title="利润表"
                    icon={PiggyBank}
                    headers={["工厂ID", "月份", "部位", "销量(kg)", "单价", "收入", "毛猪成本", "仓储成本", "运输成本", "利润"]}
                    rows={(result?.output?.profitTable ?? []).map((p) => [
                      <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
                      <span>{MONTH_LABELS[p.month] ?? `${p.month}月`}</span>,
                      <span className="font-medium">{p.part}</span>,
                      <span className="font-mono text-right">{p.salesKg.toLocaleString()}</span>,
                      <span className="font-mono">¥{p.price.toFixed(1)}</span>,
                      <span className="font-mono text-slate-200">{formatCurrency(p.revenue)}</span>,
                      <span className="font-mono text-amber-300/80">{formatCurrency(p.pigCost)}</span>,
                      <span className="font-mono text-violet-300/80">{formatCurrency(p.storageCost)}</span>,
                      <span className="font-mono text-blue-300/80">{formatCurrency(p.transportCost)}</span>,
                      <span className={`font-mono font-bold ${p.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(p.profit)}</span>,
                    ])}
                    maxH={350}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DataTable
                  title="毛猪销售表"
                  icon={PiggyBank}
                  headers={["工厂ID", "月份", "销售量(头)", "所属省份"]}
                  rows={(result?.output?.pigSalesTable ?? []).map((p) => [
                    <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
                    <span>{MONTH_LABELS[p.month] ?? `${p.month}月`}</span>,
                    <span className="font-mono">{p.salesQty.toLocaleString()}</span>,
                    <span>{p.province}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="销售表"
                  icon={TrendingUp}
                  headers={["工厂ID", "月份", "部位", "客户类别", "订单量(kg)", "销售价格", "省份"]}
                  rows={(result?.output?.salesTable ?? []).map((s) => [
                    <span className="font-mono text-cyan-200/80">{s.factoryId}</span>,
                    <span>{MONTH_LABELS[s.month] ?? `${s.month}月`}</span>,
                    <span className="font-medium">{s.part}</span>,
                    <span><Badge variant="secondary" className="text-[10px] bg-white/[0.06]">{s.customerType}</Badge></span>,
                    <span className="font-mono">{s.orderQty.toLocaleString()}</span>,
                    <span className="font-mono">¥{s.salesPrice.toFixed(1)}</span>,
                    <span>{s.province}</span>,
                  ])}
                  maxH={250}
                />
              </div>

              <DataTable
                title="分割表"
                icon={Factory}
                headers={["工厂ID", "月份", "分割部位", "分割量(kg)", "冷冻量(kg)"]}
                rows={(result?.output?.splittingTable ?? []).map((s) => [
                  <span className="font-mono text-cyan-200/80">{s.factoryId}</span>,
                  <span>{MONTH_LABELS[s.month] ?? `${s.month}月`}</span>,
                  <span className="font-medium">{s.part}</span>,
                  <span className="font-mono">{s.splitKg.toLocaleString()}</span>,
                  <span className="font-mono text-blue-300/80">{s.freezeKg.toLocaleString()}</span>,
                ])}
                maxH={300}
              />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <DataTable
                  title="生产表"
                  icon={Factory}
                  headers={["工厂ID", "月份", "部位", "产量(kg)", "销量(kg)", "存量(kg)"]}
                  rows={(result?.output?.productionTable ?? []).map((p) => [
                    <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
                    <span>{MONTH_LABELS[p.month] ?? `${p.month}月`}</span>,
                    <span className="font-medium">{p.part}</span>,
                    <span className="font-mono">{p.productionKg.toLocaleString()}</span>,
                    <span className="font-mono text-emerald-300/80">{p.salesKg.toLocaleString()}</span>,
                    <span className="font-mono text-amber-300/80">{p.inventoryKg.toLocaleString()}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="库存表"
                  icon={Warehouse}
                  headers={["工厂ID", "月份", "部位", "库存(kg)"]}
                  rows={(result?.output?.inventoryTable ?? []).map((inv) => [
                    <span className="font-mono text-cyan-200/80">{inv.factoryId}</span>,
                    <span>{MONTH_LABELS[inv.month] ?? `${inv.month}月`}</span>,
                    <span className="font-medium">{inv.part}</span>,
                    <span className="font-mono text-amber-300">{inv.inventoryKg.toLocaleString()}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="运输表"
                  icon={Truck}
                  headers={["工厂ID", "月份", "部位", "售达省份", "运输量(kg)"]}
                  rows={(result?.output?.transportTable ?? []).map((t) => [
                    <span className="font-mono text-cyan-200/80">{t.factoryId}</span>,
                    <span>{MONTH_LABELS[t.month] ?? `${t.month}月`}</span>,
                    <span className="font-medium">{t.part}</span>,
                    <span>{t.destProvince}</span>,
                    <span className="font-mono">{t.transportKg.toLocaleString()}</span>,
                  ])}
                  maxH={250}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {result?.decision && activeTab === "decision" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-indigo-400" />
                    AI运筹洞察总结
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.decision.overview}</p>
                </TechPanel>

                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    瓶颈识别
                  </h3>
                  <ul className="space-y-2">
                    {result.decision.bottlenecks.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-red-300">
                        <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </TechPanel>
              </div>

              <TechPanel className="p-6 rounded-[20px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  智能协同工单派发路线
                </h3>
                {showThinking && (
                  <ThinkingPanel steps={thinkingSteps} currentStep={currentStep} />
                )}
                {dispatchTasks.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {dispatchTasks.map((task, i) => (
                      <DispatchCard key={i} {...task} index={i} />
                    ))}
                  </div>
                )}
              </TechPanel>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    利润优化建议
                  </h3>
                  <ul className="space-y-2">
                    {result.decision.profitOptimization.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </TechPanel>

                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    风险预警
                  </h3>
                  <ul className="space-y-2">
                    {result.decision.riskWarnings.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </TechPanel>
              </div>

              <TechPanel className="p-6 rounded-[20px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  角色执行分配
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, conf]) => {
                    const RoleIcon = conf.icon;
                    const actions = result.decision.roleActions[roleKey as keyof typeof result.decision.roleActions] ?? [];
                    return (
                      <div key={roleKey} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <RoleIcon className={`h-4 w-4 ${conf.color}`} />
                          <span className={`text-xs font-semibold ${conf.color}`}>{conf.label}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {actions.map((a, i) => (
                            <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-1.5">
                              <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-slate-500" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </TechPanel>

              <TechPanel className="p-6 rounded-[20px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  推荐行动
                </h3>
                <ul className="space-y-2">
                  {result.decision.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </TechPanel>
            </motion.div>
          </AnimatePresence>
        )}

        {isLoading && !result && (
          <div className="flex items-center justify-center py-20">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-spin mr-3" />
            <span className="text-slate-400">正在加载最优化调度数据...</span>
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
