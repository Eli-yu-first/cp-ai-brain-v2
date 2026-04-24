import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Banknote,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CircleGauge,
  ClipboardCheck,
  Expand,
  Factory,
  Fish,
  Gauge,
  HandCoins,
  Landmark,
  LineChart,
  LockKeyhole,
  Mail,
  Map,
  Package,
  PackageCheck,
  PiggyBank,
  Radar,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Truck,
  UserRound,
  Warehouse,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type FlowMode = "physical" | "capital" | "information";
type StageKey =
  | "breed"
  | "slaughter"
  | "cut"
  | "freeze"
  | "storage"
  | "logistics"
  | "process"
  | "sales"
  | "finance";
type StrategyKey = "base" | "aggressive" | "safe";

const kpis = [
  {
    label: "今日出栏量",
    value: "126,890",
    unit: "头",
    growth: "+6.8%",
    icon: Fish,
    tone: "violet",
  },
  {
    label: "屠宰量",
    value: "118,560",
    unit: "头",
    growth: "+5.2%",
    icon: Factory,
    tone: "blue",
  },
  {
    label: "分割量",
    value: "116,230",
    unit: "吨",
    growth: "+5.2%",
    icon: Package,
    tone: "rose",
  },
  {
    label: "速冻量",
    value: "82,340",
    unit: "吨",
    growth: "+3.9%",
    icon: Snowflake,
    tone: "cyan",
  },
  {
    label: "库存吨数",
    value: "45,678",
    unit: "吨",
    growth: "+2.1%",
    icon: Warehouse,
    tone: "blue",
  },
  {
    label: "销售额",
    value: "¥ 78,560",
    unit: "万元",
    growth: "+8.7%",
    icon: ShoppingCart,
    tone: "amber",
  },
  {
    label: "毛利率",
    value: "18.6",
    unit: "%",
    growth: "+1.6pct",
    icon: Gauge,
    tone: "green",
  },
  {
    label: "资金占用",
    value: "¥ 98,240",
    unit: "万元",
    growth: "+3.2%",
    icon: Banknote,
    tone: "amber",
  },
  {
    label: "订单满足率",
    value: "92.6",
    unit: "%",
    growth: "+2.4pct",
    icon: CheckCircle2,
    tone: "teal",
  },
  {
    label: "产能利用率",
    value: "78.3",
    unit: "%",
    growth: "+4.1pct",
    icon: CircleGauge,
    tone: "blue",
  },
];

const stages: Array<{
  key: StageKey;
  title: string;
  icon: typeof Factory;
  primary: string;
  metrics: string[];
  visual: string;
}> = [
  {
    key: "breed",
    title: "养殖",
    icon: Fish,
    primary: "存栏 2,478,560 头",
    metrics: ["出栏率 92.3%", "料肉比 2.68", "完全成本 12.36 元/斤"],
    visual: "from-pink-300/25 via-slate-700/40 to-emerald-900/35",
  },
  {
    key: "slaughter",
    title: "屠宰",
    icon: Factory,
    primary: "今日屠宰 118,560 头",
    metrics: ["产能利用率 82.1%", "良品率 96.4%", "单头成本 72.6 元"],
    visual: "from-amber-200/25 via-rose-900/30 to-slate-800/60",
  },
  {
    key: "cut",
    title: "分割",
    icon: Boxes,
    primary: "今日分割 116,230 吨",
    metrics: ["产能利用率 79.6%", "出品率 78.3%", "单位成本 1,352 元"],
    visual: "from-red-300/25 via-orange-900/30 to-slate-800/60",
  },
  {
    key: "freeze",
    title: "速冻",
    icon: Snowflake,
    primary: "今日速冻 82,340 吨",
    metrics: ["产能利用率 76.8%", "合格率 98.7%", "单位成本 1,025 元"],
    visual: "from-cyan-200/35 via-sky-900/35 to-slate-900",
  },
  {
    key: "storage",
    title: "冷库",
    icon: Warehouse,
    primary: "库存吨数 45,678 吨",
    metrics: ["库容利用率 72.3%", "周转天数 18.6 天", "冷库成本 182 元/吨/月"],
    visual: "from-sky-200/25 via-slate-700/40 to-blue-950",
  },
  {
    key: "logistics",
    title: "物流",
    icon: Truck,
    primary: "在途车辆 1,286 辆",
    metrics: [
      "准时到达率 91.2%",
      "冷链达成率 88.6%",
      "运输成本 0.38 元/吨公里",
    ],
    visual: "from-blue-200/25 via-cyan-900/30 to-slate-900",
  },
  {
    key: "process",
    title: "深加工",
    icon: Building2,
    primary: "今日产量 12,560 吨",
    metrics: ["产能利用率 68.9%", "产品良率 93.2%", "单位成本 2,180 元"],
    visual: "from-slate-300/20 via-cyan-900/25 to-slate-950",
  },
  {
    key: "sales",
    title: "销售",
    icon: ShoppingCart,
    primary: "今日销售额 78,560 万元",
    metrics: ["毛利率 18.6%", "订单满足率 92.6%", "客户数 12,560 家"],
    visual: "from-amber-200/25 via-orange-900/30 to-slate-900",
  },
  {
    key: "finance",
    title: "财务资金",
    icon: Landmark,
    primary: "资金占用 98,240 万元",
    metrics: [
      "资金周转天数 34.6 天",
      "资产负债率 48.7%",
      "现金流净额 6,580 万元",
    ],
    visual: "from-blue-300/25 via-indigo-900/35 to-slate-950",
  },
];

const aiEntries = [
  { title: "进入AI决策工作台", desc: "全局智能决策与推演", icon: Zap },
  { title: "进入量化决策", desc: "基于数据模型量化决策", icon: Radar },
  { title: "进入时间套利", desc: "把握时机，低买高卖", icon: CircleDollarSign },
  { title: "进入空间套利", desc: "区域调配，最优运输", icon: Map },
  { title: "进入全局优化", desc: "全链路协同，最优解", icon: Sparkles },
];

const riskCards = [
  {
    title: "价格跌破成本",
    level: "高风险",
    value: "11.60 元/斤",
    detail: "已跌破完全成本 12.36 元/斤",
    loss: "-320 万元/日",
    tone: "red",
  },
  {
    title: "库存超龄",
    level: "中风险",
    value: "货品占比 12.6%",
    detail: "冷库库存中 >90 天",
    loss: "-180 万元",
    tone: "amber",
  },
  {
    title: "产能瓶颈",
    level: "中风险",
    value: "92.3%",
    detail: "分割线华东基地产能利用率",
    loss: "2,560 吨/日",
    tone: "blue",
  },
  {
    title: "订单缺口",
    level: "高风险",
    value: "8,560 吨",
    detail: "未来 7 天订单缺口",
    loss: "-1,260 万元",
    tone: "red",
  },
  {
    title: "资金占用过高",
    level: "中风险",
    value: "98,240 万元",
    detail: "超出阈值 15.2%",
    loss: "+320 万元/月",
    tone: "amber",
  },
  {
    title: "冷链时效异常",
    level: "中风险",
    value: "88.6% < 95%",
    detail: "部分线路时效未达标",
    loss: "1,250 单",
    tone: "amber",
  },
  {
    title: "外部行情异常",
    level: "低风险",
    value: "12.6%",
    detail: "玉米价格大幅上涨",
    loss: "+0.18 元/斤",
    tone: "green",
  },
];

const regions = [
  ["东北", "18,560", "+2.3%", "12.68", "12.3%", "高"],
  ["华北", "17,890", "+4.1%", "12.28", "15.6%", "中"],
  ["华东", "32,560", "+6.8%", "11.98", "19.8%", "中"],
  ["华中", "15,320", "+3.2%", "12.36", "16.2%", "低"],
  ["华南", "22,680", "+7.5%", "12.18", "20.1%", "低"],
  ["西南", "13,560", "+1.8%", "12.48", "14.3%", "中"],
  ["西北", "6,320", "-0.6%", "12.78", "10.2%", "高"],
];

const strategies = {
  base: {
    name: "基准方案",
    profit: "+2,380万",
    risk: "中",
    cycle: "72h",
    capital: "中",
    score: 84,
  },
  aggressive: {
    name: "激进方案",
    profit: "+3,120万",
    risk: "高",
    cycle: "48h",
    capital: "高",
    score: 77,
  },
  safe: {
    name: "稳健方案",
    profit: "+1,860万",
    risk: "低",
    cycle: "96h",
    capital: "低",
    score: 91,
  },
};

function ShellPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-500/30 bg-[#06182f]/90 shadow-[inset_0_1px_0_rgba(103,232,249,0.18),0_0_26px_rgba(14,116,195,0.2)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.1),transparent_32%,rgba(59,130,246,0.08))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PanelTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-400/15 px-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function KpiCard({ item }: { item: (typeof kpis)[number] }) {
  const Icon = item.icon;
  return (
    <ShellPanel>
      <div className="flex h-[78px] items-center gap-3 px-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-100">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-[13px] text-slate-300">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-cyan-200">
            {item.value}{" "}
            <span className="text-[12px] text-slate-400">{item.unit}</span>
          </p>
          <p className="text-[11px] text-emerald-300">环比 {item.growth}</p>
        </div>
      </div>
    </ShellPanel>
  );
}

function StageCard({
  stage,
  active,
  onClick,
}: {
  stage: (typeof stages)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = stage.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-0 rounded-[8px] border p-2 text-left transition",
        active
          ? "border-cyan-300/70 bg-cyan-400/[0.13] shadow-[0_0_24px_rgba(34,211,238,0.22)]"
          : "border-cyan-400/20 bg-cyan-400/[0.055] hover:bg-cyan-400/[0.1]"
      )}
    >
      <div className="mb-2 flex h-8 items-center justify-center gap-2 rounded-[6px] border border-cyan-400/20 bg-blue-500/15 text-cyan-100">
        <Icon className="h-4 w-4" />
        <span className="text-[15px] font-bold">{stage.title}</span>
      </div>
      <div
        className={cn(
          "h-74 min-h-[74px] rounded-[6px] border border-white/10 bg-gradient-to-br",
          stage.visual
        )}
      >
        <div className="h-full rounded-[6px] bg-[radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.22),transparent_16%),radial-gradient(circle_at_72%_64%,rgba(125,211,252,0.18),transparent_18%)]" />
      </div>
      <p className="mt-2 text-[12px] font-semibold text-cyan-100">
        {stage.primary}
      </p>
      <div className="mt-2 space-y-1">
        {stage.metrics.map(metric => (
          <p
            key={metric}
            className="flex justify-between text-[11px] text-slate-300"
          >
            <span>{metric.split(" ")[0]}</span>
            <span className="font-semibold text-emerald-300">
              {metric.replace(metric.split(" ")[0], "")}
            </span>
          </p>
        ))}
      </div>
    </button>
  );
}

function AiLeftRail({
  input,
  setInput,
  messages,
  send,
}: {
  input: string;
  setInput: (value: string) => void;
  messages: string[];
  send: () => void;
}) {
  return (
    <div className="space-y-2">
      <ShellPanel>
        <PanelTitle
          title="AI 作战入口"
          right={<span className="text-[11px] text-cyan-200">收起 &gt;</span>}
        />
        <div className="space-y-2 p-3">
          {aiEntries.map(entry => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.title}
                type="button"
                className="flex w-full items-center gap-3 rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.055] p-3 text-left transition hover:bg-cyan-400/[0.12]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-white">
                    {entry.title}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {entry.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </ShellPanel>

      <ShellPanel>
        <PanelTitle
          title="AI 助理 · 今日摘要"
          right={<span className="text-[11px] text-cyan-200">查看详情</span>}
        />
        <div className="p-3">
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
            <div className="flex h-28 items-center justify-center rounded-[8px] border border-cyan-400/20 bg-cyan-400/[0.08]">
              <Bot className="h-14 w-14 text-cyan-100" />
            </div>
            <div className="space-y-2">
              {messages.map(message => (
                <p
                  key={message}
                  className="rounded-[8px] border border-cyan-400/15 bg-slate-950/45 p-2 text-[12px] leading-5 text-slate-300"
                >
                  {message}
                </p>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => event.key === "Enter" && send()}
              placeholder="询问全链异常、机会或策略"
              className="h-9 rounded-[8px] border-cyan-400/20 bg-slate-950/55 text-xs text-slate-100"
            />
            <Button
              onClick={send}
              className="h-9 rounded-[8px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel>
        <PanelTitle
          title="数据可信度"
          right={<span className="text-[11px] text-cyan-200">收起⌃</span>}
        />
        <div className="space-y-2 p-3 text-[12px]">
          {[
            ["数据来源", "ERP + IoT + 第三方行情"],
            ["更新时间", "2025-07-01 10:25:00"],
            ["责任部门", "集团数字化中心"],
            ["可信度评分", "★★★★★ 94分"],
            ["是否模拟数据", "否"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] px-3 py-2"
            >
              <span className="text-slate-400">{label}</span>
              <span
                className={
                  label === "可信度评分" ? "text-amber-200" : "text-slate-200"
                }
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </ShellPanel>
    </div>
  );
}

function RiskRadar() {
  const points = [90, 68, 78, 86, 58, 72, 65].map((value, index) => {
    const angle = (Math.PI * 2 * index) / 7 - Math.PI / 2;
    const radius = value * 0.42;
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  });
  return (
    <ShellPanel>
      <PanelTitle title="风险雷达" />
      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-3 p-3">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-64 w-64">
            {[14, 25, 36, 47].map(r => (
              <polygon
                key={r}
                points={Array.from({ length: 7 })
                  .map((_, index) => {
                    const angle = (Math.PI * 2 * index) / 7 - Math.PI / 2;
                    return `${50 + Math.cos(angle) * r},${50 + Math.sin(angle) * r}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="rgba(125,211,252,0.18)"
              />
            ))}
            <polygon
              points={points.join(" ")}
              fill="rgba(244,63,94,0.22)"
              stroke="#fb7185"
              strokeWidth="1.5"
            />
            <text x="50" y="49" textAnchor="middle" fill="#bfdbfe" fontSize="8">
              风险指数
            </text>
            <text
              x="50"
              y="60"
              textAnchor="middle"
              fill="#67e8f9"
              fontSize="16"
              fontWeight="800"
            >
              62
            </text>
          </svg>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {riskCards.map(card => (
            <div
              key={card.title}
              className={cn(
                "rounded-[8px] border p-3",
                card.tone === "red"
                  ? "border-rose-400/25 bg-rose-500/[0.08]"
                  : card.tone === "amber"
                    ? "border-amber-400/25 bg-amber-500/[0.08]"
                    : card.tone === "blue"
                      ? "border-blue-400/25 bg-blue-500/[0.08]"
                      : "border-emerald-400/25 bg-emerald-500/[0.08]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-white">
                  {card.title}
                </p>
                <Badge
                  className={
                    card.tone === "red"
                      ? "bg-rose-500/20 text-rose-100"
                      : card.tone === "amber"
                        ? "bg-amber-500/20 text-amber-100"
                        : "bg-cyan-500/20 text-cyan-100"
                  }
                >
                  {card.level}
                </Badge>
              </div>
              <p
                className={cn(
                  "mt-3 text-xl font-bold",
                  card.tone === "red"
                    ? "text-rose-200"
                    : card.tone === "amber"
                      ? "text-amber-100"
                      : "text-cyan-100"
                )}
              >
                {card.value}
              </p>
              <p className="mt-2 text-[12px] text-slate-400">{card.detail}</p>
              <p className="mt-2 text-[12px] font-semibold text-amber-200">
                影响 {card.loss}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 w-full rounded-[6px] border-cyan-400/25 bg-cyan-400/10 text-[11px] text-cyan-100"
              >
                查看详情
              </Button>
            </div>
          ))}
        </div>
      </div>
    </ShellPanel>
  );
}

function TrendChart() {
  const bars = [82, 72, 75, 81, 71, 76, 63, 78, 66];
  return (
    <ShellPanel>
      <PanelTitle title="关键指标趋势" />
      <div className="p-3">
        <div className="flex h-48 items-end gap-4 border-b border-l border-cyan-400/20 px-4 pb-4">
          {bars.map((bar, index) => (
            <div
              key={`${bar}-${index}`}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-200"
                style={{ height: `${bar}%` }}
              />
              <span className="text-[10px] text-slate-500">
                06-{24 + index}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ShellPanel>
  );
}

function StrategySim({
  active,
  setActive,
}: {
  active: StrategyKey;
  setActive: (key: StrategyKey) => void;
}) {
  return (
    <ShellPanel>
      <PanelTitle title="AI 战略模拟 / What-if" />
      <div className="grid grid-cols-3 gap-2 p-3">
        {(
          Object.entries(strategies) as Array<
            [StrategyKey, (typeof strategies)[StrategyKey]]
          >
        ).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            type="button"
            className={cn(
              "rounded-[8px] border p-3 text-left transition",
              active === key
                ? "border-violet-400/60 bg-violet-500/[0.16]"
                : "border-cyan-400/20 bg-cyan-400/[0.06]"
            )}
          >
            <p className="text-sm font-semibold text-white">{item.name}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-200">
              {item.profit}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
              <span>风险 {item.risk}</span>
              <span>周期 {item.cycle}</span>
              <span>资金 {item.capital}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${item.score}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </ShellPanel>
  );
}

export default function AiValueChainPage() {
  const [flow, setFlow] = useState<FlowMode>("physical");
  const [activeStage, setActiveStage] = useState<StageKey>("storage");
  const [strategy, setStrategy] = useState<StrategyKey>("base");
  const [assistantInput, setAssistantInput] = useState("");
  const [messages, setMessages] = useState([
    "今日最重要的问题：东北区域猪价已跌破完全成本 6.2%，建议立即启动同库周转与询价策略。",
    "今日最大机会：华东-华南价差扩大至 0.8 元/斤，存在跨区调运套利空间。",
  ]);

  const activeStageData = useMemo(
    () => stages.find(stage => stage.key === activeStage) ?? stages[0],
    [activeStage]
  );

  const sendMessage = () => {
    if (!assistantInput.trim()) return;
    setMessages(prev => [
      ...prev.slice(-1),
      `你：${assistantInput}`,
      `AI：已围绕${activeStageData.title}重算，建议先模拟${strategies[strategy].name}并校准资金占用阈值。`,
    ]);
    setAssistantInput("");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#020813] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.35),transparent_28%),linear-gradient(180deg,#04142d,#020813_60%,#01040a)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(56,189,248,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 p-3">
        <header className="grid h-[58px] grid-cols-[320px_minmax(0,1fr)_470px] items-center gap-3">
          <ShellPanel className="h-full">
            <div className="flex h-full items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Boxes className="h-7 w-7 text-cyan-100" />
                <p className="text-xl font-bold text-white">智链农牧</p>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-[8px] border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
              >
                全球视图 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </ShellPanel>
          <ShellPanel className="h-full">
            <div className="flex h-full flex-col items-center justify-center">
              <h1 className="text-3xl font-black tracking-[0.12em] text-white">
                全链经营态势大屏 · 猪产业价值链{" "}
                <span className="rounded-[6px] border border-cyan-400/25 px-2 text-xl text-cyan-100">
                  AI
                </span>
              </h1>
            </div>
          </ShellPanel>
          <ShellPanel className="h-full">
            <div className="flex h-full items-center gap-3 px-4 text-[12px] text-slate-300">
              <span>2025-07-01 10:28:36</span>
              <span>星期二</span>
              <Expand className="h-5 w-5 text-cyan-100" />
              <Mail className="h-5 w-5 text-cyan-100" />
              <Bell className="h-5 w-5 text-cyan-100" />
              <UserRound className="h-8 w-8 rounded-full border border-cyan-400/25 bg-cyan-400/10 p-1.5 text-cyan-100" />
              <div>
                <p className="font-semibold text-white">潘猛</p>
                <p className="text-slate-500">集团董事长</p>
              </div>
            </div>
          </ShellPanel>
        </header>

        <section className="mt-3 grid grid-cols-10 gap-2">
          {kpis.map(item => (
            <KpiCard key={item.label} item={item} />
          ))}
        </section>

        <main className="mt-3 grid grid-cols-[300px_minmax(0,1fr)] gap-3">
          <AiLeftRail
            input={assistantInput}
            setInput={setAssistantInput}
            messages={messages}
            send={sendMessage}
          />

          <section className="space-y-3">
            <ShellPanel>
              <PanelTitle
                title="全链经营地图"
                right={
                  <div className="flex gap-2">
                    {[
                      ["physical", "实物流"],
                      ["capital", "资金流"],
                      ["information", "信息流"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFlow(key as FlowMode)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px]",
                          flow === key
                            ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
                            : "border-cyan-400/20 bg-cyan-400/[0.06] text-slate-400"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="grid grid-cols-9 gap-2 p-3">
                {stages.map((stage, index) => (
                  <div key={stage.key} className="relative">
                    <StageCard
                      stage={stage}
                      active={activeStage === stage.key}
                      onClick={() => setActiveStage(stage.key)}
                    />
                    {index < stages.length - 1 ? (
                      <span className="absolute -right-4 top-14 z-20 text-3xl font-black text-blue-400">
                        »
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 px-3 pb-3">
                <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3">
                  <p className="text-[11px] text-slate-400">当前关注环节</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {activeStageData.title}
                  </p>
                </div>
                <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3">
                  <p className="text-[11px] text-slate-400">当前流向</p>
                  <p className="mt-1 text-lg font-bold text-cyan-100">
                    {flow === "physical"
                      ? "实物流"
                      : flow === "capital"
                        ? "资金流"
                        : "信息流"}
                  </p>
                </div>
                <div className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3">
                  <p className="text-[11px] text-slate-400">AI建议</p>
                  <p className="mt-1 text-lg font-bold text-emerald-200">
                    先处理瓶颈
                  </p>
                </div>
                <Button
                  onClick={() =>
                    toast.success(
                      `${activeStageData.title} 作战方案已进入模拟队列`
                    )
                  }
                  className="h-full rounded-[8px] bg-cyan-500 text-slate-950 hover:bg-cyan-300"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成作战方案
                </Button>
              </div>
            </ShellPanel>

            <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
              <RiskRadar />
              <div className="space-y-3">
                <StrategySim active={strategy} setActive={setStrategy} />
                <ShellPanel>
                  <PanelTitle title="外部行情" />
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {[
                      ["生猪(元/斤)", "16.82", "+8.6%"],
                      ["玉米(元/吨)", "2,560", "-2.6%"],
                      ["豆粕(元/吨)", "3,280", "+1.8%"],
                    ].map(([name, price, change]) => (
                      <div
                        key={name}
                        className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3"
                      >
                        <p className="text-[12px] text-slate-400">{name}</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          {price}
                        </p>
                        <p
                          className={
                            change.startsWith("+")
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }
                        >
                          {change}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 px-3 pb-3 text-[12px] text-slate-300">
                    {[
                      "07-01 农业农村部：6月份生猪产能环比下降 1.2%",
                      "06-30 国家发改委：即将启动中央储备冻猪肉收储",
                      "06-29 玉米期货主力合约上涨 1.2%，创一月新高",
                    ].map(news => (
                      <p
                        key={news}
                        className="rounded-[8px] border border-cyan-400/15 bg-slate-950/35 px-3 py-2"
                      >
                        {news}
                      </p>
                    ))}
                  </div>
                </ShellPanel>
              </div>
            </div>

            <div className="grid grid-cols-[0.95fr_1.05fr_0.9fr] gap-3">
              <TrendChart />
              <ShellPanel>
                <PanelTitle title="区域经营对比" />
                <div className="p-3">
                  <table className="w-full table-fixed text-left text-[12px]">
                    <thead className="text-slate-400">
                      <tr>
                        {[
                          "区域",
                          "出栏量",
                          "环比",
                          "养殖成本",
                          "毛利率",
                          "风险",
                        ].map(h => (
                          <th
                            key={h}
                            className="border-b border-cyan-400/15 px-2 py-2"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {regions.map(row => (
                        <tr
                          key={row[0]}
                          className="border-b border-cyan-400/10"
                        >
                          {row.map((cell, index) => (
                            <td
                              key={`${row[0]}-${index}`}
                              className={cn(
                                "px-2 py-1.5",
                                index === 2 &&
                                  (cell.startsWith("+")
                                    ? "text-emerald-300"
                                    : "text-rose-300"),
                                index === 5 &&
                                  (cell === "高"
                                    ? "text-rose-300"
                                    : cell === "中"
                                      ? "text-amber-200"
                                      : "text-cyan-200")
                              )}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ShellPanel>
              <ShellPanel>
                <PanelTitle title="人机协同执行" />
                <div className="grid grid-cols-2 gap-2 p-3">
                  {[
                    ["AI识别", "7个异常"],
                    ["人工审批", "14条策略"],
                    ["自动派单", "93个工单"],
                    ["闭环回传", "92.6%"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.055] p-3"
                    >
                      <p className="text-[12px] text-slate-400">{label}</p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-3 pb-3">
                  <Button
                    className="h-9 w-full rounded-[8px] bg-blue-600 hover:bg-blue-500"
                    onClick={() => toast.success("已生成跨部门作战工单")}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    一键生成跨部门工单
                  </Button>
                </div>
              </ShellPanel>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
