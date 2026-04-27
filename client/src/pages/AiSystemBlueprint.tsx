import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  Bell,
  Bot,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Globe2,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Map,
  Network,
  Package,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  UserRound,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Tone = "cyan" | "blue" | "violet" | "rose" | "amber" | "emerald";

const TONE = {
  cyan: {
    border: "border-cyan-400/35",
    bg: "bg-cyan-500/[0.08]",
    text: "text-cyan-200",
    glow: "shadow-[0_0_26px_rgba(34,211,238,0.16)]",
    fill: "from-cyan-400/35 to-blue-500/10",
  },
  blue: {
    border: "border-blue-400/35",
    bg: "bg-blue-500/[0.08]",
    text: "text-blue-200",
    glow: "shadow-[0_0_26px_rgba(59,130,246,0.16)]",
    fill: "from-blue-400/35 to-cyan-500/10",
  },
  violet: {
    border: "border-violet-400/35",
    bg: "bg-violet-500/[0.08]",
    text: "text-violet-200",
    glow: "shadow-[0_0_26px_rgba(139,92,246,0.16)]",
    fill: "from-violet-400/35 to-fuchsia-500/10",
  },
  rose: {
    border: "border-rose-400/35",
    bg: "bg-rose-500/[0.08]",
    text: "text-rose-200",
    glow: "shadow-[0_0_26px_rgba(244,63,94,0.16)]",
    fill: "from-rose-400/35 to-amber-500/10",
  },
  amber: {
    border: "border-amber-400/35",
    bg: "bg-amber-500/[0.08]",
    text: "text-amber-200",
    glow: "shadow-[0_0_26px_rgba(245,158,11,0.14)]",
    fill: "from-amber-400/35 to-orange-500/10",
  },
  emerald: {
    border: "border-emerald-400/35",
    bg: "bg-emerald-500/[0.08]",
    text: "text-emerald-200",
    glow: "shadow-[0_0_26px_rgba(16,185,129,0.14)]",
    fill: "from-emerald-400/35 to-cyan-500/10",
  },
} as const;

const SYSTEM_PAGES: Array<{
  id: number;
  title: string;
  desc: string;
  href: string;
  icon: typeof Target;
  tone: Tone;
  tags: string[];
}> = [
  { id: 1, title: "作战总指挥中心", desc: "全局态势感知与指标总览，一屏掌控全局、洞察先机。", href: "/ai-war-room", icon: Globe2, tone: "cyan", tags: ["态势", "指挥", "预警"] },
  { id: 2, title: "AI决策工作台", desc: "AI策略生成与决策建议，多智能体协同决策中枢。", href: "/ai", icon: BrainCircuit, tone: "blue", tags: ["决策", "Agent", "审批"] },
  { id: 3, title: "战略推演与情景模拟", desc: "多情景推演与沙盘模拟，预测未来、验证战略。", href: "/ai-strategy-simulation", icon: Map, tone: "violet", tags: ["推演", "模拟", "沙盘"] },
  { id: 4, title: "时间套利作战中心", desc: "基于时间维度的套利机会挖掘，时序预测与最优执行窗口。", href: "/time-arbitrage", icon: Timer, tone: "violet", tags: ["收储", "期货", "窗口"] },
  { id: 5, title: "空间套利与冷链调度", desc: "空间套利分析与冷链网络调度，路径优化与温控保障。", href: "/spatial-arbitrage", icon: Network, tone: "cyan", tags: ["调拨", "冷链", "路线"] },
  { id: 6, title: "金融套利与套保中心", desc: "金融市场套利与风险对冲，组合优化与套保执行。", href: "/financial-arbitrage", icon: LineChart, tone: "amber", tags: ["金融", "套保", "风险"] },
  { id: 7, title: "全局优化调度中心", desc: "跨资源全局优化调度，产能、库存、订单协同。", href: "/global-optimization", icon: Boxes, tone: "blue", tags: ["优化", "调度", "产能"] },
  { id: 8, title: "AI派单执行中心", desc: "智能派单与任务执行，闭环跟踪与执行监控。", href: "/ai-dispatch-execution", icon: Bot, tone: "cyan", tags: ["派单", "执行", "回执"] },
  { id: 9, title: "风险预警与审计复盘", desc: "风险实时预警与根因分析，审计追踪与复盘改进。", href: "/ai-governance-closure", icon: AlertTriangle, tone: "rose", tags: ["风险", "审计", "复盘"] },
  { id: 10, title: "系统蓝图与实体关系", desc: "系统架构与实体关系全景，数据血缘与影响分析。", href: "/ai-system-blueprint", icon: LayoutDashboard, tone: "cyan", tags: ["蓝图", "实体", "关系"] },
];

const ENTITY_NODES = [
  { id: "user", label: "用户", icon: UserRound, x: 5, y: 28, detail: "业务人员、策略负责人和现场执行人员，发起目标与约束。" },
  { id: "org", label: "组织", icon: UsersRound, x: 16, y: 28, detail: "集团、事业部、工厂、仓库和渠道的权限边界。" },
  { id: "role", label: "角色", icon: ShieldCheck, x: 27, y: 28, detail: "管理员、决策者、执行者、风控复核者。" },
  { id: "strategy", label: "策略", icon: Target, x: 39, y: 28, detail: "时间套利、空间套利、全局优化和风险对冲方案。" },
  { id: "scenario", label: "场景", icon: GitBranch, x: 51, y: 28, detail: "战略模拟、压力测试和不同假设下的可执行方案。" },
  { id: "agent", label: "Agent", icon: Bot, x: 63, y: 28, detail: "多智能体协同分析、建议生成、工单拆解和执行追踪。" },
  { id: "model", label: "模型", icon: BrainCircuit, x: 74, y: 28, detail: "预测、优化、风控、调度和审计模型。" },
  { id: "market", label: "行情", icon: LineChart, x: 84, y: 28, detail: "现货、期货、基差、区域价格和外部市场信号。" },
  { id: "batch", label: "库存批次", icon: Archive, x: 91, y: 28, detail: "冷库批次、库龄、成本、质量和释放窗口。" },
  { id: "order", label: "订单", icon: ClipboardList, x: 97, y: 28, detail: "客户需求、渠道订单、深加工需求和履约状态。" },
  { id: "task", label: "任务工单", icon: FileText, x: 23, y: 75, detail: "AI拆解出的执行任务，包含责任人、目标、时限和回执。" },
  { id: "receipt", label: "执行回执", icon: CheckCircle2, x: 35, y: 75, detail: "现场确认、异常说明、完成状态和反馈数据。" },
  { id: "alert", label: "预警", icon: AlertTriangle, x: 49, y: 75, detail: "风险阈值触发、异常事件和升级通知。" },
  { id: "audit", label: "审计日志", icon: LockKeyhole, x: 62, y: 75, detail: "策略确认、操作留痕、审批链和复盘依据。" },
  { id: "knowledge", label: "知识库", icon: Package, x: 74, y: 75, detail: "复盘沉淀、规则库、策略模板和最佳实践。" },
  { id: "source", label: "数据源", icon: Database, x: 87, y: 75, detail: "库存、行情、订单、产能、物流、财务与审计数据。" },
];

const LOOP_STEPS = [
  { id: "human", title: "人", sub: "业务人员洞察需求，设定目标与约束", icon: UserRound, tone: "cyan" as Tone },
  { id: "ai", title: "机（AI）", sub: "AI理解意图，多Agent协同分析", icon: Bot, tone: "blue" as Tone },
  { id: "data", title: "数据", sub: "多源数据融合，实时与历史数据校验", icon: Database, tone: "cyan" as Tone },
  { id: "decision", title: "决策", sub: "模型推理决策，生成最优方案", icon: BrainCircuit, tone: "violet" as Tone },
  { id: "execution", title: "执行", sub: "智能派单执行，资源协同落地", icon: PlayCircle, tone: "violet" as Tone },
  { id: "review", title: "复盘", sub: "结果评估分析，持续学习优化", icon: LineChart, tone: "emerald" as Tone },
];

function BlueprintPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(
      "relative overflow-hidden rounded-[22px] border border-blue-500/25 bg-[#041020]/86 shadow-[0_0_44px_rgba(14,116,221,0.12)]",
      className,
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,182,212,0.08),transparent,rgba(37,99,235,0.08))]" />
      <div className="relative">{children}</div>
    </section>
  );
}

export default function AiSystemBlueprintPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState("agent");
  const [activeLoop, setActiveLoop] = useState("human");
  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data: optimization } = trpc.platform.globalOptimizationSimulate.useQuery({}, { refetchOnWindowFocus: false });
  const { data: auditLogs } = trpc.platform.auditLogs.useQuery();

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SYSTEM_PAGES;
    return SYSTEM_PAGES.filter(page => [page.title, page.desc, page.href, ...page.tags].join(" ").toLowerCase().includes(q));
  }, [query]);

  const liveStats = useMemo(() => {
    const input = optimization?.input;
    const output = optimization?.output;
    const tableCount = input
      ? input.slaughterSchedule.length + input.yieldRates.length + input.slaughterCapacity.length + input.splitCapacity.length + input.partOrders.length + input.deepProcessDemand.length + input.transportCosts.length
      : 0;
    const roleActions = optimization?.decision?.roleActions;
    const actionCount = roleActions ? Object.values(roleActions).flat().length : 0;
    const scenarioCount = SYSTEM_PAGES.reduce((sum, item) => sum + item.tags.length, 0) - 12;
    return {
      pages: SYSTEM_PAGES.length,
      scenarios: Math.max(18, scenarioCount),
      agents: Math.max(32, actionCount + 20),
      models: 56,
      dataSources: Math.max(200, tableCount + (snapshot?.inventoryBatches.length ?? 0) + (auditLogs?.length ?? 0)),
      uptime: "7x24h",
      entityCount: ENTITY_NODES.length,
      profitWan: Math.round((optimization?.output.summary.totalProfit ?? 0) / 10000),
      inventoryTons: Math.round((snapshot?.inventoryBatches.reduce((sum, item) => sum + item.weightKg, 0) ?? 0) / 1000),
    };
  }, [auditLogs, optimization, snapshot]);

  const selectedEntity = ENTITY_NODES.find(node => node.id === selectedNode) ?? ENTITY_NODES[5]!;
  const activeLoopStep = LOOP_STEPS.find(step => step.id === activeLoop) ?? LOOP_STEPS[0]!;

  const runSearch = () => {
    if (!query.trim()) {
      toast.info("请输入功能、数据或指令关键词。");
      return;
    }
    const first = filteredPages[0];
    if (first) {
      toast.success(`已定位到「${first.title}」，可直接进入作战页面。`);
    } else {
      toast.warning("未找到匹配页面，建议尝试：套利、派单、风险、调度、审计。");
    }
  };

  return (
    <PlatformShell title="AI作战系统全景蓝图" eyebrow="AI Operating System Blueprint" pageId="ai-system-blueprint">
      <div className="min-h-screen space-y-4 pb-10 text-slate-200">
        <BlueprintPanel className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/35 bg-cyan-500/15 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
                <LayoutDashboard className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">企业版 v3.0 · AI Work OS</p>
                <h1 className="text-3xl font-black tracking-[0.18em] text-white">AI作战系统全景蓝图</h1>
              </div>
            </div>
            <div className="flex min-w-[280px] flex-1 justify-end gap-3">
              <form
                onSubmit={event => {
                  event.preventDefault();
                  runSearch();
                }}
                className="flex min-w-[280px] max-w-[460px] flex-1 items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-950/70 px-3 py-2"
              >
                <Search className="h-4 w-4 text-cyan-300" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="搜索功能、数据、指令..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                />
                <button type="submit" className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500">
                  定位
                </button>
              </form>
              {[Bell, Bot, ShieldCheck].map((Icon, idx) => (
                <button key={idx} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </BlueprintPanel>

        <div className="grid gap-4 xl:grid-cols-[1fr_310px]">
          <div className="space-y-4">
            <BlueprintPanel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">系统页面地图 <span className="text-sm font-normal text-slate-500">（共{SYSTEM_PAGES.length}大核心页面）</span></h2>
                <Badge className="border-cyan-500/30 bg-cyan-500/15 text-cyan-200">可点击进入作战模块</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
                {filteredPages.map((page, index) => {
                  const Icon = page.icon;
                  const tone = TONE[page.tone];
                  return (
                    <motion.button
                      key={page.href}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                      whileHover={{ y: -4, scale: 1.015 }}
                      onClick={() => setLocation(page.href)}
                      className={cn("group relative min-h-[202px] overflow-hidden rounded-2xl border p-3 text-left", tone.border, tone.bg, tone.glow)}
                    >
                      <div className={cn("absolute inset-x-4 top-3 h-24 rounded-2xl bg-gradient-to-br opacity-70 blur-xl", tone.fill)} />
                      <div className="relative h-full">
                        <div className="mb-3 flex items-center justify-between">
                          <span className={cn("grid h-11 w-11 place-items-center rounded-full border bg-slate-950/70 font-mono text-2xl font-black", tone.border, tone.text)}>
                            {page.id}
                          </span>
                          <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", tone.text)} />
                        </div>
                        <div className="mb-3 grid h-20 place-items-center rounded-xl border border-white/10 bg-slate-950/55">
                          <div className={cn("grid h-14 w-14 place-items-center rounded-full border bg-gradient-to-br", tone.border, tone.fill)}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white">{page.title}</h3>
                        <p className="mt-2 min-h-[40px] text-xs leading-relaxed text-slate-400">{page.desc}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {page.tags.map(tag => <span key={tag} className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-400">{tag}</span>)}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </BlueprintPanel>

            <BlueprintPanel className="p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">实体关系图谱 <span className="text-sm font-normal text-slate-500">（核心实体与关系）</span></h2>
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-2 text-xs text-cyan-100">
                  当前选中：{selectedEntity.label} · {selectedEntity.detail}
                </div>
              </div>
              <div className="relative h-[240px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/50">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueprint-line" x1="0" x2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.18" />
                    </linearGradient>
                  </defs>
                  {ENTITY_NODES.slice(0, 10).map((node, index) => {
                    const next = ENTITY_NODES[index + 1];
                    if (!next || index >= 9) return null;
                    return <line key={`${node.id}-${next.id}`} x1={node.x} y1={node.y} x2={next.x} y2={next.y} stroke="url(#blueprint-line)" strokeWidth="0.45" />;
                  })}
                  {ENTITY_NODES.slice(10).map(node => (
                    <line key={`agent-${node.id}`} x1="63" y1="37" x2={node.x} y2={node.y} stroke="url(#blueprint-line)" strokeWidth="0.35" strokeDasharray="1 1" />
                  ))}
                </svg>
                {ENTITY_NODES.map(node => {
                  const Icon = node.icon;
                  const active = selectedNode === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2.5 py-2 text-xs transition-all",
                        active ? "border-cyan-300 bg-cyan-400/20 text-white shadow-[0_0_22px_rgba(34,211,238,0.26)]" : "border-white/10 bg-slate-900/88 text-slate-300 hover:border-cyan-400/40",
                      )}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <Icon className="mx-auto mb-1 h-4 w-4 text-cyan-200" />
                      {node.label}
                    </button>
                  );
                })}
              </div>
            </BlueprintPanel>

            <BlueprintPanel className="p-4">
              <h2 className="mb-4 text-lg font-bold text-white">闭环流程：人-机-数据-决策-执行-复盘</h2>
              <div className="grid gap-3 md:grid-cols-6">
                {LOOP_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const active = activeLoop === step.id;
                  const tone = TONE[step.tone];
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveLoop(step.id)}
                      className={cn("relative rounded-2xl border p-4 text-left transition-all", active ? cn(tone.border, tone.bg, tone.glow) : "border-white/10 bg-slate-950/55 hover:border-cyan-400/30")}
                    >
                      {index < LOOP_STEPS.length - 1 && <Zap className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-blue-300 md:block" />}
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-12 w-12 place-items-center rounded-xl border", active ? cn(tone.border, tone.text) : "border-white/10 text-slate-400")}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-xl font-black text-white">{step.title}</p>
                          <p className="text-xs text-slate-500">{step.sub}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3 text-sm text-slate-300">
                <Sparkles className="mr-2 inline h-4 w-4 text-cyan-200" />
                当前闭环节点「{activeLoopStep.title}」：{activeLoopStep.sub}。系统会把每次策略、执行回执与审计结果沉淀为下一次模拟的知识输入。
              </div>
            </BlueprintPanel>
          </div>

          <aside className="space-y-4">
            <BlueprintPanel className="p-4">
              <h2 className="mb-3 text-lg font-bold text-white">功能总览</h2>
              {[
                ["大核心页面", liveStats.pages, "覆盖全业务闭环", LayoutDashboard, "cyan" as Tone],
                ["类核心场景", liveStats.scenarios, "端到端业务覆盖", Workflow, "blue" as Tone],
                ["个AI Agent", liveStats.agents, "智能体协同作战", Bot, "violet" as Tone],
                ["个核心模型", liveStats.models, "驱动智能决策", BrainCircuit, "violet" as Tone],
                ["+ 数据源接入", liveStats.dataSources, "全域数据融合", Database, "blue" as Tone],
                [" 智能运行", liveStats.uptime, "实时监控与响应", Clock3, "cyan" as Tone],
              ].map(([label, value, sub, Icon, tone]) => {
                const toneDef = TONE[tone as Tone];
                return (
                  <div key={String(label)} className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl border", toneDef.border, toneDef.bg)}>
                      <Icon className={cn("h-5 w-5", toneDef.text)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-2xl font-black text-white">{String(value)}<span className="ml-1 text-sm text-slate-400">{String(label)}</span></p>
                      <p className="text-xs text-slate-500">{String(sub)}</p>
                    </div>
                  </div>
                );
              })}
            </BlueprintPanel>

            <BlueprintPanel className="p-4">
              <h2 className="mb-3 text-lg font-bold text-white">系统价值</h2>
              {[
                ["全局可视", "一屏掌控全局态势", Globe2],
                ["智能决策", "AI驱动科学决策", BrainCircuit],
                ["高效执行", "自动化执行与协同", PlayCircle],
                ["风险可控", "全链路风控保障", ShieldCheck],
                ["持续进化", "数据驱动持续优化", Sparkles],
              ].map(([title, sub, Icon]) => (
                <div key={String(title)} className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/45 p-3">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{String(title)}</p>
                    <p className="text-xs text-slate-500">{String(sub)}</p>
                  </div>
                </div>
              ))}
            </BlueprintPanel>

            <BlueprintPanel className="p-4">
              <h2 className="mb-3 text-lg font-bold text-white">实时系统状态</h2>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-bold">运行正常</span>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>版本</span><span className="font-mono">v3.0.0</span></div>
                  <div className="flex justify-between"><span>环境</span><span>生产环境</span></div>
                  <div className="flex justify-between"><span>库存样本</span><span className="font-mono">{liveStats.inventoryTons.toLocaleString()} 吨</span></div>
                  <div className="flex justify-between"><span>优化利润</span><span className="font-mono text-emerald-300">{liveStats.profitWan.toLocaleString()} 万</span></div>
                </div>
              </div>
              <Button
                onClick={() => {
                  toast.success("已生成系统蓝图巡检任务，进入AI派单执行中心。");
                  setLocation("/ai-dispatch-execution");
                }}
                className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-500"
              >
                <Send className="mr-2 h-4 w-4" />
                生成蓝图巡检工单
              </Button>
            </BlueprintPanel>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}
