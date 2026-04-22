import { TechPanel } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Calculator,
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
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MONTH_LABELS: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

const ROLE_CONFIG: Record<string, { icon: typeof Users; color: string; label: string; badgeColor: string }> = {
  purchasing: { icon: PiggyBank, color: "text-amber-400", label: "采购负责人", badgeColor: "bg-amber-500" },
  production: { icon: Factory, color: "text-cyan-400", label: "生产调度组", badgeColor: "bg-cyan-500" },
  sales: { icon: TrendingUp, color: "text-emerald-400", label: "添加加工组", badgeColor: "bg-emerald-500" },
  warehouse: { icon: Truck, color: "text-blue-400", label: "物流车队", badgeColor: "bg-blue-500" },
};

type TaskStatus = "pending" | "thinking" | "analyzing" | "dispatching" | "completed" | "error";

type ThinkingStep = {
  id: number;
  phase: "init" | "slaughter" | "split" | "sales" | "cost" | "ai" | "dispatch";
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

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(1)}万`;
  return val.toFixed(0);
}

function StatusDot({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { bg: string; pulse?: boolean; icon?: React.ReactNode }> = {
    pending: { bg: "bg-slate-600" },
    thinking: { bg: "bg-indigo-500", pulse: true },
    analyzing: { bg: "bg-cyan-500", pulse: true },
    dispatching: { bg: "bg-amber-500", pulse: true },
    completed: { bg: "bg-emerald-500", icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    error: { bg: "bg-red-500" },
  };
  const c = config[status]!;
  return (
    <span className={`relative flex h-2 w-2 shrink-0 rounded-full ${c.bg}`}>
      {c.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />}
      {c.icon}
    </span>
  );
}

function ThinkingPanel({ steps, currentStep }: { steps: ThinkingStep[]; currentStep: number }) {
  return (
    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStep;
        const isPast = idx < currentStep && step.status === "completed";
        const isActive = step.status === "thinking" || step.status === "analyzing" || step.status === "dispatching";
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
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-indigo-500/20 text-indigo-300 border-0 shrink-0">
                    进行中
                  </Badge>
                )}
                {isPast && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
              </div>
              {(isCurrent || isPast) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-slate-500 mt-0.5 leading-relaxed"
                >
                  {step.detail}
                </motion.p>
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
  const isHighPriority = status === "dispatching" || status === "completed";

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
          : status === "error"
          ? "bg-red-500/10 border-red-500/30"
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
            <>
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[10px] text-orange-400 font-medium">派发中</span>
            </>
          )}
          {status === "completed" && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">已确认</span>
            </>
          )}
          {status === "pending" && (
            <>
              <Clock className="h-3 w-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500">待派发</span>
            </>
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

      {status === "completed" && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 + index * 0.18 + 0.3 }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function DashboardTable({ title, icon: Icon, headers, rows, accent }: {
  title: string; icon: typeof LayoutDashboard; headers: string[];
  rows: React.ReactNode[][]; accent?: string;
}) {
  return (
    <TechPanel className="p-0 overflow-hidden rounded-[20px]">
      <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent ?? "text-cyan-400"}`} />
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
        <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
          <thead className="bg-[#0b1426] sticky top-0 z-10 text-slate-400">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.map((row, i) => (
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

export default function OptimizationScheduling2Page() {
  const [isRunning, setIsRunning] = useState(false);
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

  const { data: result, isLoading, refetch } = trpc.platform.optimizationScheduling2Simulate.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const summary = result?.output?.summary;

  const profitRows = useMemo(() => {
    return (result?.output?.profitTable ?? []).slice(0, 8).map(p => [
      <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
      <span>{p.salesProvince}</span>,
      <span className="font-medium">{p.part}</span>,
      <span className="font-mono">{p.salesKg.toLocaleString()}</span>,
      <span className="font-mono">¥{p.price.toFixed(2)}</span>,
      <span className="font-mono text-slate-200">{formatCurrency(p.revenue)}</span>,
      <span className={`font-mono font-bold ${p.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(p.profit)}</span>,
    ]);
  }, [result]);

  const bottleneckRows = useMemo(() => {
    const bn = result?.decision?.bottlenecks ?? [];
    return bn.slice(0, 5).map((b, i) => [
      <span className="text-red-400 font-medium">{`FAC-SH-${String(i + 1).padStart(2, "0")}`}</span>,
      <span className="text-red-400 font-medium text-xs">{b.substring(0, 20)}</span>,
      <Badge variant="secondary" className="text-[9px] bg-red-500/15 text-red-300 border border-red-500/30">Utilized 100%</Badge>,
      <span className="text-slate-500 text-xs">第 {Math.min((i + 1) * 2, 12)} 月</span>,
    ]);
  }, [result]);

  const salesRows = useMemo(() => {
    const st = result?.output?.salesTable ?? [];
    const grouped = new Map<string, { part: string; totalKg: number; factoryId: string; price: number }>();
    for (const s of st.slice(0, 20)) {
      const key = `${s.part}_${s.factoryId}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.totalKg += s.orderQty;
      } else {
        grouped.set(key, { part: s.part, totalKg: s.orderQty, factoryId: s.factoryId, price: s.salesPrice });
      }
    }
    return Array.from(grouped.values()).map(g => [
      <span className="font-medium text-sm">{g.part} ({g.factoryId})</span>,
      <span className="font-mono text-cyan-300">{g.totalKg.toLocaleString()} kg</span>,
      <span className="font-mono text-slate-500 text-xs">¥{g.price.toFixed(2)}/kg</span>,
    ]);
  }, [result]);

  const runThinkingProcess = useCallback(() => {
    setThinkingSteps(THINKING_STEPS.map(s => ({ ...s, status: "pending" as TaskStatus, progress: 0 })));
    setCurrentStep(-1);
    setDispatchTasks([]);
    setShowResult(false);
    setShowThinking(true);
    setIsRunning(true);

    let stepIdx = -1;
    timerRef.current = setInterval(() => {
      stepIdx++;
      if (stepIdx >= THINKING_STEPS.length) {
        if (timerRef.current) clearInterval(timerRef.current);

        setThinkingSteps(prev => prev.map((s, i) =>
          i < THINKING_STEPS.length ? { ...s, status: "completed" as TaskStatus, progress: 100 } : s
        ));

        refetch().then(() => {
          setTimeout(() => generateDispatchTasks(), 400);
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
            i === stepIdx ? { ...s, status: i === THINKING_STEPS.length - 1 ? "dispatching" as TaskStatus : "completed" as TaskStatus, progress: 100 } : s
          ));
        } else {
          setThinkingSteps(prev => prev.map((s, i) =>
            i === stepIdx ? { ...s, progress: Math.min(prog, 99) } : s
          ));
        }
      }, 150);
    }, 700);
  }, [refetch]);

  const generateDispatchTasks = useCallback(() => {
    const decision = result?.decision;
    if (!decision) return;

    const tasks: Array<{ target: string; role: string; action: string; status: TaskStatus }> = [];

    const roleMap: Array<{ roleId: string; targetPrefix: string }> = [
      { roleId: "production", targetPrefix: "FAC-SH-" },
      { roleId: "sales", targetPrefix: "FAC-SH-" },
      { roleId: "warehouse", targetPrefix: "TRA-" },
    ];

    let taskIdx = 0;
    roleMap.forEach(({ roleId, targetPrefix }) => {
      const actions = decision.roleActions[roleId as keyof typeof decision.roleActions] ?? [];
      actions.slice(0, 2).forEach(action => {
        tasks.push({
          target: `${targetPrefix}${String(taskIdx + 1).padStart(2, "0")}`,
          role: roleId,
          action,
          status: "pending" as TaskStatus,
        });
        taskIdx++;
      });
    });

    setDispatchTasks(tasks);
    dispatchTasksSequential(tasks, 0);
  }, [result]);

  const dispatchTasksSequential = useCallback((tasks: Array<{ target: string; role: string; action: string; status: TaskStatus }>, startIdx: number) => {
    if (startIdx >= tasks.length) {
      setShowResult(true);
      setIsRunning(false);
      return;
    }

    setDispatchTasks(prev => prev.map((t, i) =>
      i === startIdx ? { ...t, status: "dispatching" as TaskStatus } : t
    ));

    dispatchTimerRef.current = setTimeout(() => {
      setDispatchTasks(prev => prev.map((t, i) =>
        i === startIdx ? { ...t, status: "completed" as TaskStatus } : t
      ));
      dispatchTasksSequential(tasks, startIdx + 1);
    }, 1200 + Math.random() * 800);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current);
    };
  }, []);

  const insightText = result?.decision?.overview ?? "";

  return (
    <PlatformShell title="最优化调度2" eyebrow="Optimization Scheduling 2" pageId="optimization-scheduling2">
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <Target className="h-7 w-7 text-indigo-400" />
              最优化调度2 — 全链利润最大化求解
            </h1>
            <p className="text-slate-500 text-xs">
              基于多约束条件的最优排产算法 · AI智能决策引擎 · 四角色工单自动派发
            </p>
          </div>
          <Button
            onClick={runThinkingProcess}
            disabled={isRunning || isLoading}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_18px_rgba(79,70,229,0.45)] transition-all hover:shadow-[0_0_24px_rgba(79,70,229,0.6)]"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                求解中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                执行最优化求解
              </span>
            )}
          </Button>
        </div>

        {!showThinking && !showResult && !isLoading && (
          <div className="flex flex-col items-center justify-center py-28">
            <div className="relative mb-6">
              <BrainCircuit className="h-16 w-16 text-indigo-400/30" />
              <div className="absolute inset-0 rounded-full bg-indigo-400/10 blur-2xl" />
            </div>
            <p className="text-slate-500 text-sm mb-2">点击「执行最优化求解」启动AI运筹引擎</p>
            <p className="text-slate-600 text-xs">将依次执行：参数加载 → 屠宰分配 → 分割约束 → 销售排序 → 成本分摊 → AI决策 → 工单派发</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showThinking && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-6"
            >
              <div className="space-y-5">
                <TechPanel className="p-6 rounded-[24px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  <div className="flex items-center gap-2.5 mb-4">
                    <BrainCircuit className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-base font-bold text-slate-200">AI 运筹大语言模型解析</h2>
                    <Badge variant="secondary" className="text-[9px] bg-indigo-500/15 text-indigo-300 border-indigo-500/25 ml-auto">
                      实时推理中
                    </Badge>
                  </div>

                  <div className="mb-4 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">运筹洞察总结 (Insight)</span>
                    </div>
                    <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
                      {currentStep >= 8 ? insightText : "正在分析数据，请稍候..."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">智能协同工单派发路线</span>
                  </div>

                  <ThinkingPanel steps={thinkingSteps} currentStep={currentStep} />

                  {dispatchTasks.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {dispatchTasks.map((task, i) => (
                        <DispatchCard key={i} {...task} index={i} />
                      ))}
                    </div>
                  )}
                </TechPanel>

                <TechPanel className="p-6 rounded-[24px] bg-emerald-950/20 border-emerald-500/15 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    多目标综合利润计分卡
                  </h3>
                  <div className="flex flex-col items-center py-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      全局预期净利润（剔除折旧、人工、物流后）
                    </p>
                    {showResult && summary ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 120 }}
                      >
                        <p className="text-4xl font-mono tracking-tighter text-emerald-300 drop-shadow-lg">
                          <span className="text-lg mr-1 text-emerald-500/60">¥</span>
                          {summary.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-4xl font-mono tracking-tighter text-slate-600">—</p>
                        {isRunning && <Timer className="h-4 w-4 text-slate-600 animate-pulse" />}
                      </div>
                    )}
                  </div>
                </TechPanel>
              </div>

              <div className="space-y-5">
                <DashboardTable
                  title="利润表 (核心财务分配明细)"
                  icon={LayoutDashboard}
                  accent="text-cyan-400"
                  headers={["工厂ID", "目标省份", "部位", "销量(kg)", "单价", "收入", "净利润"]}
                  rows={profitRows}
                />

                <div className="grid grid-cols-2 gap-5">
                  <TechPanel className="p-0 overflow-hidden rounded-[20px]">
                    <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                        发现的短板 (瓶颈) 记录
                      </h3>
                    </div>
                    <ul className="divide-y divide-white/[0.04] p-2 max-h-[220px] overflow-y-auto">
                      {bottleneckRows.length > 0 ? bottleneckRows.map((row, i) => (
                        <li key={i} className="p-2.5 space-y-1">
                          <div className="flex items-center gap-2">
                            {row[0]}
                            {row[2]}
                          </div>
                          <p className="text-[11px] text-slate-500 pl-0.5">{row[1]}</p>
                          <div className="flex justify-end"><span className="text-[10px] text-slate-600">{row[3]}</span></div>
                        </li>
                      )) : (
                        <li className="p-4 text-center text-slate-600 text-xs">暂无瓶颈记录</li>
                      )}
                    </ul>
                  </TechPanel>

                  <TechPanel className="p-0 overflow-hidden rounded-[20px]">
                    <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        销售工单表 (白条/部件)
                      </h3>
                    </div>
                    <ul className="divide-y divide-white/[0.04] p-2 max-h-[220px] overflow-y-auto">
                      {salesRows.length > 0 ? salesRows.map((row, i) => (
                        <li key={i} className="p-2.5 hover:bg-white/[0.02] flex justify-between items-center gap-3">
                          <span className="text-xs text-slate-300 font-medium whitespace-nowrap">{row[0] as React.ReactNode}</span>
                          <span className="font-mono text-cyan-300 text-xs shrink-0">{row[1]}</span>
                          <span className="text-[10px] text-slate-600 shrink-0">{row[2]}</span>
                        </li>
                      )) : (
                        <li className="p-4 text-center text-slate-600 text-xs">暂无销售记录</li>
                      )}
                    </ul>
                  </TechPanel>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PlatformShell>
  );
}
