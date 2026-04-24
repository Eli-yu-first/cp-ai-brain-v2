import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Coins,
  Factory,
  Flame,
  Gauge,
  Handshake,
  Layers3,
  LineChart,
  Mail,
  MapPin,
  PackageCheck,
  Radar,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  Truck,
  UserRound,
  Warehouse,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StrategyId = "A" | "B" | "C";
type AlertLevel = "red" | "yellow" | "green";
type AgentTone = "green" | "blue" | "purple" | "amber" | "teal";

const metricCards = [
  {
    label: "今日核心风险",
    value: "12",
    delta: "较昨日 ↑ 3",
    tone: "rose",
    icon: Flame,
  },
  {
    label: "今日核心机会",
    value: "18",
    delta: "较昨日 ↑ 5",
    tone: "blue",
    icon: Target,
  },
  {
    label: "AI 推荐动作",
    value: "27",
    delta: "较昨日 ↑ 8",
    tone: "violet",
    icon: BrainCircuit,
  },
  {
    label: "待审批策略",
    value: "14",
    delta: "较昨日 ↑ 2",
    tone: "amber",
    icon: ClipboardCheck,
  },
  {
    label: "执行中工单",
    value: "93",
    delta: "较昨日 ↑ 11",
    tone: "cyan",
    icon: Workflow,
  },
  {
    label: "预计收益(万元)",
    value: "+2,384",
    delta: "较昨日 ↑18%",
    tone: "emerald",
    icon: CircleDollarSign,
  },
  {
    label: "减亏金额(万元)",
    value: "+1,257",
    delta: "较昨日 ↑16%",
    tone: "sky",
    icon: Coins,
  },
];

const agents: Array<{
  name: string;
  role: string;
  confidence: number;
  advice: string;
  tags: string[];
  tone: AgentTone;
}> = [
  {
    name: "经营决策 Agent",
    role: "利润与区域策略",
    confidence: 92,
    advice: "建议收缩华东机会，优化区域结构，优先处理中单亏损压力。",
    tags: ["利润", "全局优化", "收益最大化"],
    tone: "green",
  },
  {
    name: "产能调度 Agent",
    role: "工厂与班次协同",
    confidence: 88,
    advice: "建议华中工厂降配产能10%，华东工厂增开15%匹配需求。",
    tags: ["产能", "排产优化", "成本控制"],
    tone: "blue",
  },
  {
    name: "物流销售 Agent",
    role: "冷链与销售节奏",
    confidence: 90,
    advice: "建议从华南向华东调拨2,500吨，优先保障高毛利区域。",
    tags: ["物流", "调拨优化", "时效优先"],
    tone: "purple",
  },
  {
    name: "风控合规 Agent",
    role: "风险识别与合规",
    confidence: 85,
    advice: "建议关注资金占用与省际配比，规避价格波动风险。",
    tags: ["风控", "合规", "风险限额"],
    tone: "amber",
  },
  {
    name: "现场执行 Agent",
    role: "现场工单与回执",
    confidence: 83,
    advice: "建议优先处理超时工单，提升现场执行效率。",
    tags: ["执行", "工单管控", "SLA保障"],
    tone: "teal",
  },
];

const regions = [
  {
    name: "西北",
    x: 29,
    y: 33,
    risk: "中",
    chance: 2,
    profit: "+180万",
    level: "yellow",
  },
  {
    name: "华北",
    x: 55,
    y: 24,
    risk: "低",
    chance: 3,
    profit: "+210万",
    level: "green",
  },
  {
    name: "华东",
    x: 72,
    y: 41,
    risk: "低",
    chance: 6,
    profit: "+680万",
    level: "green",
  },
  {
    name: "华中",
    x: 59,
    y: 56,
    risk: "高",
    chance: 2,
    profit: "-320万",
    level: "red",
  },
  {
    name: "西南",
    x: 32,
    y: 61,
    risk: "中",
    chance: 5,
    profit: "+430万",
    level: "cyan",
  },
  {
    name: "华南",
    x: 50,
    y: 72,
    risk: "中",
    chance: 4,
    profit: "+210万",
    level: "yellow",
  },
];

const businessAlerts = [
  ["华东低温冻品上升", "机会", "10:21"],
  ["西南区域高毛利锁价", "机会", "10:15"],
  ["华北屠宰调拨机会", "机会", "09:58"],
  ["云贵工厂毛猪升贴水", "机会", "09:42"],
  ["豫鲁低价收储窗口", "机会", "09:55"],
  ["金融锁价区间套利", "机会", "09:18"],
];

const riskAlerts = [
  ["华中仓储压力偏高", "风险", "10:25"],
  ["华南利润偏差扩大", "风险", "10:17"],
  ["冷链时效异常", "风险", "10:10"],
  ["工单超时趋势上升", "风险", "09:42"],
  ["资金占用偏高", "风险", "09:35"],
  ["到期批次出库慢", "风险", "09:25"],
];

const warningTiles = [
  {
    label: "利润偏差",
    level: "红色",
    value: "+18.6%",
    note: "实际利润低于预算",
    icon: LineChart,
  },
  {
    label: "产能利用",
    level: "黄色",
    value: "78%",
    note: "产能利用率偏低",
    icon: Factory,
  },
  {
    label: "仓储压力",
    level: "红色",
    value: "92%",
    note: "仓储使用率过高",
    icon: Warehouse,
  },
  {
    label: "冷链时效",
    level: "黄色",
    value: "85%",
    note: "冷链达成率下降",
    icon: Truck,
  },
  {
    label: "需求波动",
    level: "红色",
    value: "+35%",
    note: "需求波动异常",
    icon: Radar,
  },
  {
    label: "工单超时",
    level: "红色",
    value: "23%",
    note: "工单超时率上升",
    icon: Clock3,
  },
  {
    label: "资金占用",
    level: "黄色",
    value: "75%",
    note: "资金占用偏高",
    icon: Coins,
  },
  {
    label: "数据延迟",
    level: "绿色",
    value: "2分钟",
    note: "数据延迟正常",
    icon: CheckCircle2,
  },
];

const strategyRecommendations = [
  {
    id: "s1",
    title: "推荐收储",
    profit: "+620万",
    priority: "高",
    confidence: 92,
    icon: PackageCheck,
  },
  {
    id: "s2",
    title: "推荐出售",
    profit: "+480万",
    priority: "高",
    confidence: 89,
    icon: Route,
  },
  {
    id: "s3",
    title: "推荐跨区调拨",
    profit: "+350万",
    priority: "高",
    confidence: 91,
    icon: Truck,
  },
  {
    id: "s4",
    title: "推荐深加工",
    profit: "+560万",
    priority: "中",
    confidence: 88,
    icon: Factory,
  },
  {
    id: "s5",
    title: "推荐金融套保",
    profit: "+210万",
    priority: "中",
    confidence: 85,
    icon: ShieldCheck,
  },
  {
    id: "s6",
    title: "推荐减少生产",
    profit: "-320万",
    priority: "中",
    confidence: 86,
    icon: Gauge,
  },
  {
    id: "s7",
    title: "推荐释放库存",
    profit: "+180万",
    priority: "低",
    confidence: 83,
    icon: Warehouse,
  },
];

const dispatchRoles = [
  { label: "派给厂长", desc: "负责库存管理与现场入库", icon: Factory },
  { label: "派给仓储", desc: "负责库容管理与入库", icon: Warehouse },
  { label: "派给司机", desc: "负责运输执行与时效", icon: Truck },
  { label: "派给销售", desc: "负责市场开拓与客户执行", icon: Handshake },
  { label: "派给财务", desc: "负责资金与结算管理", icon: Coins },
  { label: "派给风控", desc: "负责风险识别与合规", icon: ShieldAlert },
];

const strategies = {
  A: {
    name: "方案 A（基准方案）",
    income: "+2,380万",
    saved: "+1,250万",
    risk: "中等",
    execution: "中等",
    capital: "中等",
    color: "cyan",
    radar: [72, 65, 78, 68, 82],
    suggestion: 4,
  },
  B: {
    name: "方案 B（激进方案）",
    income: "+3,120万",
    saved: "+1,680万",
    risk: "较高",
    execution: "较高",
    capital: "较高",
    color: "violet",
    radar: [88, 82, 58, 52, 74],
    suggestion: 3,
  },
  C: {
    name: "方案 C（稳健方案）",
    income: "+1,860万",
    saved: "+980万",
    risk: "较低",
    execution: "较低",
    capital: "较低",
    color: "teal",
    radar: [62, 58, 88, 86, 79],
    suggestion: 5,
  },
} satisfies Record<
  StrategyId,
  {
    name: string;
    income: string;
    saved: string;
    risk: string;
    execution: string;
    capital: string;
    color: string;
    radar: number[];
    suggestion: number;
  }
>;

const workOrders = [
  [
    "WO-20250701-0012",
    "华中仓储压力处理方案执行",
    "仓储",
    "李强",
    "执行中",
    "1小时12分",
    65,
    92,
  ],
  [
    "WO-20250701-0011",
    "跨区调拨-华南→华东",
    "司机",
    "王师傅",
    "执行中",
    "2小时35分",
    40,
    88,
  ],
  [
    "WO-20250701-0010",
    "低价活动执行-华中区域",
    "销售",
    "陈丽",
    "待确认",
    "1小时50分",
    0,
    0,
  ],
  [
    "WO-20250630-0099",
    "资金占用优化方案执行",
    "财务",
    "周凯",
    "已完成",
    "-",
    100,
    100,
  ],
  [
    "WO-20250630-0098",
    "冷链时效提升专项执行",
    "现场执行",
    "赵强",
    "超时",
    "超时45分",
    70,
    85,
  ],
];

const rootCause = {
  title: "华中仓储压力过高",
  affected: "华中区域 · 3个仓库 · 12个品类",
  loss: "+320万元",
  reason:
    "近期需求波动导致入库计划与销售节奏不匹配，部分批次滞留；同时华南活动不足，库存周转变慢，导致仓储使用率持续上升。",
  data: ["当前库存 12,850t", "库龄 28天", "仓储使用率 92%", "滞留品类 12个"],
  owner: "张伟 / 华中区域负责人",
};

function getToneClasses(tone: string) {
  const map: Record<string, string> = {
    rose: "border-rose-400/25 bg-rose-500/[0.08] text-rose-200",
    blue: "border-blue-400/25 bg-blue-500/[0.08] text-blue-200",
    violet: "border-violet-400/25 bg-violet-500/[0.08] text-violet-200",
    amber: "border-amber-400/25 bg-amber-500/[0.08] text-amber-200",
    cyan: "border-cyan-400/25 bg-cyan-500/[0.08] text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200",
    sky: "border-sky-400/25 bg-sky-500/[0.08] text-sky-200",
  };
  return map[tone] ?? map.cyan;
}

function getStatusClass(level: AlertLevel | string) {
  if (level === "red" || level === "红色" || level === "高") {
    return "border-rose-400/30 bg-rose-500/[0.1] text-rose-200";
  }
  if (level === "yellow" || level === "黄色" || level === "中") {
    return "border-amber-400/30 bg-amber-500/[0.1] text-amber-100";
  }
  if (level === "green" || level === "绿色" || level === "低") {
    return "border-emerald-400/30 bg-emerald-500/[0.1] text-emerald-100";
  }
  return "border-cyan-400/30 bg-cyan-500/[0.1] text-cyan-100";
}

function CommandPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-[#15579d]/70 bg-[#061733]/86 shadow-[inset_0_1px_0_rgba(109,190,255,0.18),0_0_24px_rgba(18,92,168,0.24)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(42,139,255,0.12),transparent_28%,transparent_70%,rgba(54,231,255,0.07))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(72,167,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(72,167,255,0.035)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PanelTitle({
  title,
  extra,
}: {
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-cyan-400/15 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <h3 className="text-[14px] font-semibold tracking-wide text-slate-50">
          {title}
        </h3>
      </div>
      {extra}
    </div>
  );
}

function MetricCard({ item }: { item: (typeof metricCards)[number] }) {
  const Icon = item.icon;
  return (
    <CommandPanel className="min-h-[72px]">
      <div className="flex h-full items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border",
              getToneClasses(item.tone)
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] text-slate-200">{item.label}</p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-bold leading-none text-white">
                {item.value}
              </p>
              <span className="pb-1 text-[11px] text-slate-500">
                {item.delta}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CommandPanel>
  );
}

function AiAssistant({
  messages,
  input,
  onInput,
  onSend,
}: {
  messages: string[];
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <CommandPanel>
      <PanelTitle title="AI 作战助手" />
      <div className="p-3">
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
          <div className="relative flex h-[142px] items-center justify-center rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.06]">
            <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_68%)] blur-md" />
            <Bot className="relative h-16 w-16 text-cyan-100" />
          </div>
          <div className="rounded-[8px] border border-cyan-400/20 bg-slate-950/45 p-3">
            <p className="text-[12px] font-semibold text-cyan-100">
              经营态势摘要
            </p>
            <p className="mt-2 text-[12px] leading-5 text-slate-300">
              今日整体机会多于风险，华东区域机会上升但华中仓储压力偏高。建议先处理高风险工单，再开启跨区调拨模拟。
            </p>
            <p className="mt-2 text-right text-[11px] text-slate-500">10:28</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-slate-400">你可以问我：</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            "哪些区域风险最高？",
            "推荐优先批准哪条？",
            "推演收益最高的方案？",
            "资金占用异常原因？",
          ].map(item => (
            <button
              key={item}
              type="button"
              onClick={() => onInput(item)}
              className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-1.5 text-[11px] text-cyan-100 transition hover:bg-cyan-400/15"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 max-h-20 space-y-1 overflow-y-auto text-[12px] text-slate-300">
          {messages.map((message, index) => (
            <p
              key={`${message}-${index}`}
              className="rounded-[6px] bg-white/[0.04] px-2 py-1.5"
            >
              {message}
            </p>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={event => onInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") onSend();
            }}
            placeholder="请输入问题，或直接@参谋"
            className="h-9 rounded-[8px] border-cyan-400/20 bg-slate-950/60 text-xs text-slate-100"
          />
          <Button
            type="button"
            onClick={onSend}
            className="h-9 rounded-[8px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CommandPanel>
  );
}

function AgentCard({ agent }: { agent: (typeof agents)[number] }) {
  const toneClasses: Record<AgentTone, string> = {
    green: "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-100",
    blue: "border-blue-400/25 bg-blue-500/[0.08] text-blue-100",
    purple: "border-violet-400/25 bg-violet-500/[0.08] text-violet-100",
    amber: "border-amber-400/25 bg-amber-500/[0.08] text-amber-100",
    teal: "border-teal-400/25 bg-teal-500/[0.08] text-teal-100",
  };
  return (
    <div className={cn("rounded-[8px] border p-3", toneClasses[agent.tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-white">{agent.name}</p>
          <p className="mt-1 text-[11px] text-slate-400">{agent.role}</p>
        </div>
        <Badge className="border border-white/10 bg-white/10 text-[11px] text-slate-100">
          {agent.confidence}%
        </Badge>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-slate-300">
        {agent.advice}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.tags.map(tag => (
          <span
            key={tag}
            className="rounded-[6px] border border-white/10 bg-slate-950/35 px-2 py-1 text-[10px]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function MapBoard({ onOpenRootCause }: { onOpenRootCause: () => void }) {
  return (
    <CommandPanel className="min-h-[420px]">
      <PanelTitle
        title="作战态势地图（全国经营态势）"
        extra={
          <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            实时推演
          </Badge>
        }
      />
      <div className="relative h-[360px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(31,111,235,0.42),transparent_42%),linear-gradient(180deg,rgba(8,25,58,0.3),rgba(2,8,23,0.7))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55" />
        <div className="absolute left-[16%] top-[14%] rounded-[8px] border border-cyan-400/20 bg-slate-950/70 p-3 text-[12px]">
          <p className="mb-2 text-slate-200">图例</p>
          {[
            ["高风险", "bg-rose-400"],
            ["中风险", "bg-amber-300"],
            ["低风险", "bg-emerald-300"],
            ["机会区域", "bg-cyan-300"],
          ].map(([label, color]) => (
            <div
              key={label}
              className="mt-1.5 flex items-center gap-2 text-slate-400"
            >
              <span className={cn("h-2 w-2 rounded-full", color)} />
              {label}
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/45 bg-cyan-400/10 shadow-[0_0_50px_rgba(34,211,238,0.4)]">
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(165,243,252,0.95)]" />
        </div>
        {regions.map(region => (
          <button
            key={region.name}
            type="button"
            onClick={region.level === "red" ? onOpenRootCause : undefined}
            className="absolute text-left"
            style={{ left: `${region.x}%`, top: `${region.y}%` }}
          >
            <motion.span
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className={cn(
                "mb-2 block h-4 w-4 rounded-full border-2 border-white/50",
                region.level === "red"
                  ? "bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.8)]"
                  : region.level === "yellow"
                    ? "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.65)]"
                    : region.level === "green"
                      ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.7)]"
                      : "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.7)]"
              )}
            />
            <div className="min-w-[118px] rounded-[8px] border border-cyan-400/20 bg-slate-950/75 p-2 text-[11px] text-slate-300 shadow-xl">
              <p className="font-semibold text-white">{region.name}</p>
              <p>风险：{region.risk}</p>
              <p>机会：{region.chance}</p>
              <p
                className={
                  region.profit.startsWith("-")
                    ? "text-rose-200"
                    : "text-emerald-200"
                }
              >
                今日收益：{region.profit}
              </p>
            </div>
          </button>
        ))}
      </div>
    </CommandPanel>
  );
}

function AlertList({ title, items }: { title: string; items: string[][] }) {
  return (
    <CommandPanel>
      <PanelTitle
        title={title}
        extra={<span className="text-[11px] text-cyan-200">更多 &gt;</span>}
      />
      <div className="space-y-2 p-3">
        {items.map(([label, type, time]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-2 text-[12px]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  type === "机会" ? "bg-emerald-300" : "bg-rose-400"
                )}
              />
              <span className="truncate text-slate-300">{label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                className={
                  type === "机会"
                    ? getStatusClass("green")
                    : getStatusClass("red")
                }
              >
                {type}
              </Badge>
              <span className="text-slate-500">{time}</span>
            </div>
          </div>
        ))}
      </div>
    </CommandPanel>
  );
}

function WarningTile({ item }: { item: (typeof warningTiles)[number] }) {
  const Icon = item.icon;
  const isRed = item.level === "红色";
  const isYellow = item.level === "黄色";
  return (
    <div
      className={cn(
        "rounded-[8px] border p-3",
        isRed
          ? "border-rose-400/25 bg-rose-500/[0.09]"
          : isYellow
            ? "border-amber-400/25 bg-amber-500/[0.09]"
            : "border-emerald-400/25 bg-emerald-500/[0.09]"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">{item.label}</p>
        <Icon
          className={cn(
            "h-4 w-4",
            isRed
              ? "text-rose-200"
              : isYellow
                ? "text-amber-100"
                : "text-emerald-100"
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold",
          isRed
            ? "text-rose-200"
            : isYellow
              ? "text-amber-100"
              : "text-emerald-100"
        )}
      >
        {item.level}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
      <p className="mt-2 text-[11px] text-slate-400">{item.note}</p>
    </div>
  );
}

function RecommendationPanel({
  statuses,
  onAction,
}: {
  statuses: Record<string, string>;
  onAction: (id: string, action: string) => void;
}) {
  return (
    <CommandPanel>
      <PanelTitle
        title="AI 策略推荐（7类动作）"
        extra={<span className="text-[11px] text-cyan-200">全局筛选 &gt;</span>}
      />
      <div className="space-y-2 p-3">
        {strategyRecommendations.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1.3fr)_0.7fr_0.55fr_0.65fr_1.65fr] items-center gap-2 rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] px-3 py-2 text-[12px]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate font-semibold text-white">
                  {item.title}
                </span>
              </div>
              <span
                className={
                  item.profit.startsWith("-")
                    ? "font-semibold text-rose-200"
                    : "font-semibold text-emerald-200"
                }
              >
                预计收益 {item.profit}
              </span>
              <Badge className={getStatusClass(item.priority)}>
                优先级 {item.priority}
              </Badge>
              <span className="text-slate-300">置信度 {item.confidence}%</span>
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-[6px] border-blue-400/30 bg-blue-500/10 px-3 text-[11px] text-blue-100"
                  onClick={() => onAction(item.id, "模拟")}
                >
                  模拟
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-[6px] border-violet-400/30 bg-violet-500/10 px-3 text-[11px] text-violet-100"
                  onClick={() => onAction(item.id, "审批")}
                >
                  审批
                </Button>
                <Button
                  size="sm"
                  className="h-7 rounded-[6px] bg-cyan-500 px-3 text-[11px] text-slate-950 hover:bg-cyan-300"
                  onClick={() => onAction(item.id, "执行")}
                >
                  {statuses[item.id] ?? "立即执行"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </CommandPanel>
  );
}

function DispatchPanel({
  generated,
  onGenerate,
}: {
  generated: boolean;
  onGenerate: () => void;
}) {
  const steps = ["选择任务", "选择执行对象", "填写要求", "确认派单"];
  return (
    <CommandPanel>
      <PanelTitle title="一键派单（快速触达执行）" />
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 text-[12px] text-slate-300"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {dispatchRoles.map(role => {
            const Icon = role.icon;
            return (
              <button
                key={role.label}
                type="button"
                className={cn(
                  "rounded-[8px] border p-3 text-center transition",
                  generated
                    ? "border-emerald-400/25 bg-emerald-400/[0.08]"
                    : "border-cyan-400/20 bg-cyan-400/[0.06] hover:bg-cyan-400/[0.12]"
                )}
              >
                <Icon className="mx-auto h-6 w-6 text-cyan-100" />
                <p className="mt-2 text-[12px] font-semibold text-white">
                  {role.label}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  {role.desc}
                </p>
              </button>
            );
          })}
        </div>
        <Button
          onClick={onGenerate}
          className="mt-3 h-9 w-full rounded-[8px] bg-blue-600 text-white hover:bg-blue-500"
        >
          + {generated ? "已生成派单，可继续新增" : "新建派单"}
        </Button>
      </div>
    </CommandPanel>
  );
}

function StrategyCard({
  id,
  active,
  onClick,
}: {
  id: StrategyId;
  active: boolean;
  onClick: () => void;
}) {
  const item = strategies[id];
  const polygon = item.radar
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / item.radar.length - Math.PI / 2;
      const radius = value * 0.46;
      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    })
    .join(" ");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[8px] border p-3 text-left transition",
        active
          ? "border-violet-400/60 bg-violet-500/[0.16] shadow-[0_0_28px_rgba(139,92,246,0.22)]"
          : "border-cyan-400/20 bg-cyan-500/[0.06] hover:bg-cyan-500/[0.1]"
      )}
    >
      <p className="text-[14px] font-semibold text-white">{item.name}</p>
      <p className="mt-2 text-[12px] text-slate-400">预计收益</p>
      <p className="text-2xl font-bold text-emerald-200">{item.income}</p>
      <div className="mt-2 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28">
          {[18, 34, 50].map(size => (
            <polygon
              key={size}
              points={Array.from({ length: 5 })
                .map((_, index) => {
                  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
                  return `${50 + Math.cos(angle) * size},${50 + Math.sin(angle) * size}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(125,211,252,0.2)"
              strokeWidth="1"
            />
          ))}
          <polygon
            points={polygon}
            fill={active ? "rgba(139,92,246,0.38)" : "rgba(34,211,238,0.28)"}
            stroke={active ? "#c4b5fd" : "#67e8f9"}
            strokeWidth="2"
          />
        </svg>
      </div>
    </button>
  );
}

function WorkOrderTable() {
  return (
    <CommandPanel>
      <PanelTitle
        title="执行反馈（闭环管理）"
        extra={
          <div className="flex gap-2 text-[11px]">
            {["待确认 18", "执行中 47", "已完成 128", "超时 9"].map(item => (
              <Badge
                key={item}
                className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
              >
                {item}
              </Badge>
            ))}
          </div>
        }
      />
      <div className="overflow-hidden p-2">
        <table className="w-full table-fixed text-left text-[12px]">
          <thead className="text-slate-400">
            <tr className="border-b border-cyan-400/15">
              {[
                "工单编号",
                "任务描述",
                "负责人",
                "状态",
                "剩余时间",
                "进度",
                "SLA",
              ].map(header => (
                <th key={header} className="px-2 py-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workOrders.map(row => (
              <tr
                key={row[0] as string}
                className="border-b border-cyan-400/10 text-slate-300"
              >
                <td className="px-2 py-2 text-cyan-100">{row[0]}</td>
                <td className="truncate px-2 py-2">{row[1]}</td>
                <td className="px-2 py-2">{row[3]}</td>
                <td className="px-2 py-2">
                  <span
                    className={cn(
                      "font-semibold",
                      row[4] === "超时"
                        ? "text-rose-300"
                        : row[4] === "已完成"
                          ? "text-emerald-300"
                          : row[4] === "待确认"
                            ? "text-amber-200"
                            : "text-cyan-200"
                    )}
                  >
                    {row[4]}
                  </span>
                </td>
                <td
                  className={cn(
                    "px-2 py-2",
                    String(row[5]).includes("超时")
                      ? "text-rose-300"
                      : "text-slate-300"
                  )}
                >
                  {row[5]}
                </td>
                <td className="px-2 py-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${row[6]}%` }}
                    />
                  </div>
                </td>
                <td className="px-2 py-2 text-cyan-100">{row[7]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CommandPanel>
  );
}

export default function AiWarRoomPage() {
  const [activeStrategy, setActiveStrategy] = useState<StrategyId>("B");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<string[]>([
    "AI：当前最优先处理华中仓储压力，预计可减亏 320 万元。",
  ]);
  const [recommendationStatus, setRecommendationStatus] = useState<
    Record<string, string>
  >({});
  const [dispatchGenerated, setDispatchGenerated] = useState(false);
  const [rootCauseOpen, setRootCauseOpen] = useState(true);

  const summary = useMemo(() => {
    const current = strategies[activeStrategy];
    return [
      ["核心风险", "12"],
      ["核心机会", "18"],
      ["AI推荐动作", "27"],
      ["预计收益", current.income],
      ["减亏金额", current.saved],
      ["待审批策略", "14"],
      ["执行中工单", "93"],
    ];
  }, [activeStrategy]);

  const sendAssistantMessage = () => {
    const text = assistantInput.trim();
    if (!text) return;
    setAssistantMessages(prev => [
      ...prev,
      `你：${text}`,
      "AI：已基于当前态势重算，建议先模拟方案 B，同时把华中仓储压力派给仓储与风控联合处理。",
    ]);
    setAssistantInput("");
  };

  const handleRecommendationAction = (id: string, action: string) => {
    const next =
      action === "执行" ? "执行中" : action === "审批" ? "已提交" : "已模拟";
    setRecommendationStatus(prev => ({ ...prev, [id]: next }));
    toast.success(
      `${strategyRecommendations.find(item => item.id === id)?.title ?? "策略"}：${next}`
    );
  };

  const generateDispatch = () => {
    setDispatchGenerated(true);
    toast.success("已生成 6 个角色工单，并进入执行追踪队列。");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#020714] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(30,90,180,0.34),transparent_34%),radial-gradient(circle_at_82%_40%,rgba(20,184,166,0.11),transparent_28%),linear-gradient(180deg,#04112a,#020714_62%,#01040b)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(54,134,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(54,134,255,0.045)_1px,transparent_1px)] bg-[size:36px_36px] opacity-60" />

      <div className="relative z-10 p-2">
        <header className="grid h-[58px] grid-cols-[360px_minmax(0,1fr)_480px] items-center gap-3">
          <CommandPanel className="h-full">
            <div className="flex h-full items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-amber-300/50 bg-amber-400/10 text-amber-200">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-bold text-white">四川眉山</p>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[12px] text-slate-400">
                    作战状态：
                    <span className="font-semibold text-emerald-300">
                      正常运行
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CommandPanel>

          <CommandPanel className="h-full">
            <div className="flex h-full flex-col items-center justify-center">
              <h1 className="text-3xl font-black tracking-[0.12em] text-white">
                AI 作战指挥中心
              </h1>
              <p className="mt-1 text-[13px] tracking-[0.2em] text-cyan-100">
                态势感知 / 策略模拟 / AI建议 / 派单执行 / 执行闭环
              </p>
            </div>
          </CommandPanel>

          <CommandPanel className="h-full">
            <div className="flex h-full items-center gap-3 px-4">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/55 px-3 py-2">
                <Search className="h-4 w-4 text-cyan-100" />
                <span className="truncate text-[12px] text-slate-400">
                  搜索区域、指标、策略、工单...
                </span>
              </div>
              <span className="text-[12px] text-slate-300">
                2025-07-01 10:28:36
              </span>
              <Bell className="h-5 w-5 text-cyan-100" />
              <Mail className="h-5 w-5 text-cyan-100" />
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10">
                  <UserRound className="h-5 w-5 text-cyan-100" />
                </div>
                <div className="text-[12px]">
                  <p className="font-semibold text-white">潘猛</p>
                  <p className="text-slate-500">总指挥</p>
                </div>
              </div>
            </div>
          </CommandPanel>
        </header>

        <section className="mt-2 grid grid-cols-[repeat(7,minmax(0,1fr))_150px] gap-2">
          {metricCards.map(item => (
            <MetricCard key={item.label} item={item} />
          ))}
          <CommandPanel>
            <div className="flex h-full items-center justify-center gap-3 px-3 py-2">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-violet-500/75 bg-violet-500/10">
                <span className="text-lg font-bold text-white">86%</span>
              </div>
              <div>
                <p className="text-[13px] text-slate-300">AI信心值</p>
                <p className="mt-1 text-[11px] text-emerald-300">较昨日 ↑ 5%</p>
              </div>
            </div>
          </CommandPanel>
        </section>

        <main className="mt-2 grid grid-cols-[370px_minmax(0,1fr)_690px] gap-2">
          <section className="space-y-2">
            <AiAssistant
              messages={assistantMessages}
              input={assistantInput}
              onInput={setAssistantInput}
              onSend={sendAssistantMessage}
            />

            <div className="grid grid-cols-2 gap-2">
              <AlertList title="业务机会提醒（6）" items={businessAlerts} />
              <AlertList title="风险预警提醒（7）" items={riskAlerts} />
            </div>

            <CommandPanel>
              <PanelTitle title="红黄绿预警（实时监控）" />
              <div className="grid grid-cols-4 gap-2 p-3">
                {warningTiles.map(item => (
                  <WarningTile key={item.label} item={item} />
                ))}
              </div>
            </CommandPanel>
          </section>

          <section className="space-y-2">
            <CommandPanel>
              <PanelTitle
                title="多 Agent 协同决策"
                extra={
                  <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                    协同记录
                  </Badge>
                }
              />
              <div className="grid grid-cols-5 gap-2 p-3">
                {agents.map(agent => (
                  <AgentCard key={agent.name} agent={agent} />
                ))}
              </div>
            </CommandPanel>

            <MapBoard onOpenRootCause={() => setRootCauseOpen(true)} />

            <CommandPanel>
              <PanelTitle title="整体经营状态摘要（今日）" />
              <div className="grid grid-cols-7 gap-2 p-3">
                {summary.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.05] p-3 text-center"
                  >
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </CommandPanel>

            <WorkOrderTable />
          </section>

          <section className="space-y-2">
            <RecommendationPanel
              statuses={recommendationStatus}
              onAction={handleRecommendationAction}
            />
            <DispatchPanel
              generated={dispatchGenerated}
              onGenerate={generateDispatch}
            />

            <CommandPanel>
              <PanelTitle
                title="策略模拟 / What-if 分析"
                extra={
                  <Button
                    size="sm"
                    className="h-7 rounded-[6px] bg-blue-600 text-[11px] text-white hover:bg-blue-500"
                  >
                    新建模拟
                  </Button>
                }
              />
              <div className="grid grid-cols-3 gap-3 p-3">
                {(["A", "B", "C"] as StrategyId[]).map(id => (
                  <StrategyCard
                    key={id}
                    id={id}
                    active={activeStrategy === id}
                    onClick={() => setActiveStrategy(id)}
                  />
                ))}
              </div>
              <div className="px-3 pb-3">
                <table className="w-full table-fixed text-left text-[12px]">
                  <thead className="text-slate-400">
                    <tr className="border-b border-cyan-400/15">
                      {[
                        "方案",
                        "预计收益",
                        "减亏金额",
                        "风险指数",
                        "执行难度",
                        "资金占用",
                        "推荐指数",
                      ].map(header => (
                        <th key={header} className="px-2 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["A", "B", "C"] as StrategyId[]).map(id => {
                      const item = strategies[id];
                      return (
                        <tr
                          key={id}
                          className={cn(
                            "border-b border-cyan-400/10",
                            activeStrategy === id ? "bg-violet-500/[0.08]" : ""
                          )}
                        >
                          <td className="px-2 py-2 text-white">{item.name}</td>
                          <td className="px-2 py-2 text-emerald-300">
                            {item.income}
                          </td>
                          <td className="px-2 py-2 text-emerald-300">
                            {item.saved}
                          </td>
                          <td
                            className={cn(
                              "px-2 py-2",
                              item.risk === "较高"
                                ? "text-rose-300"
                                : item.risk === "中等"
                                  ? "text-amber-200"
                                  : "text-cyan-200"
                            )}
                          >
                            {item.risk}
                          </td>
                          <td className="px-2 py-2 text-slate-300">
                            {item.execution}
                          </td>
                          <td className="px-2 py-2 text-slate-300">
                            {item.capital}
                          </td>
                          <td className="px-2 py-2 text-amber-200">
                            {"★".repeat(item.suggestion)}
                            {"☆".repeat(5 - item.suggestion)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CommandPanel>
          </section>
        </main>
      </div>

      <Dialog open={rootCauseOpen} onOpenChange={setRootCauseOpen}>
        <DialogContent className="max-w-3xl rounded-[8px] border-cyan-400/25 bg-[#06142d] text-white shadow-[0_0_48px_rgba(14,165,233,0.22)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Siren className="h-5 w-5 text-rose-300" />
              根因分析（风险事件分析）
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              点击地图红色风险区域或风险提醒可进入此分析面板。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[8px] border border-rose-400/25 bg-rose-500/[0.08] p-4">
              <AlertTriangle className="h-9 w-9 text-rose-200" />
              <p className="mt-4 text-lg font-semibold text-rose-100">
                {rootCause.title}
              </p>
              <p className="mt-2 text-[12px] text-slate-400">
                触发时间：2025-07-01 10:25
              </p>
              <div className="mt-4 space-y-3 text-[13px]">
                <p>
                  <span className="text-slate-400">影响范围：</span>
                  {rootCause.affected}
                </p>
                <p>
                  <span className="text-slate-400">预计损失：</span>
                  <span className="text-rose-200">{rootCause.loss}</span>
                </p>
                <p>
                  <span className="text-slate-400">AI 建议：</span>
                  优先释放周转慢品类，发起跨库调拨，并限制非核心入库。
                </p>
                <p>
                  <span className="text-slate-400">置信度：</span>
                  <span className="text-emerald-200">91%</span>
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                <p className="text-sm font-semibold text-cyan-100">根因解释</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-300">
                  {rootCause.reason}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rootCause.data.map(item => (
                  <div
                    key={item}
                    className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3 text-[13px] text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">责任人</p>
                <p className="mt-2 text-[13px] text-slate-300">
                  {rootCause.owner}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-[6px] border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
              onClick={() => setRootCauseOpen(false)}
            >
              关闭
            </Button>
            <Button
              className="rounded-[6px] bg-blue-600 text-white hover:bg-blue-500"
              onClick={generateDispatch}
            >
              立即派单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
