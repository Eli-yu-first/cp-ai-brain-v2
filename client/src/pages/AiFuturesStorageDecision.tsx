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
import type { StorageDecisionMode } from "../../../server/futuresStorageDecision";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Gauge,
  Info,
  LineChart,
  Loader2,
  PiggyBank,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  StopCircle,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

function formatPrice(value: number, digits = 2) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatSigned(value: number, unit = "") {
  return `${value > 0 ? "+" : ""}${formatPrice(value, 2)}${unit}`;
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px] border border-cyan-400/30 bg-[#061a32]/94 shadow-[inset_0_1px_0_rgba(125,211,252,0.16),0_0_28px_rgba(14,116,195,0.16)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.11),transparent_38%,rgba(34,197,94,0.045))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-cyan-300/15 px-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
        <h2 className="text-[16px] font-semibold tracking-[0.08em] text-white">{title}</h2>
        <Info className="h-3.5 w-3.5 text-slate-500" />
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: typeof PiggyBank;
  tone?: "green" | "blue" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/35 bg-emerald-500/[0.1] text-emerald-200"
      : tone === "red"
        ? "border-red-400/35 bg-red-500/[0.12] text-red-200"
        : "border-blue-400/35 bg-blue-500/[0.1] text-blue-200";

  return (
    <Panel className="h-[104px]">
      <div className="flex h-full items-center gap-4 px-4">
        <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-full border", toneClass)}>
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-300">{label}</p>
          <div className="mt-1 flex items-end gap-1">
            <span className={cn("font-mono text-[34px] font-black leading-none", tone === "red" ? "text-red-300" : tone === "green" ? "text-emerald-300" : "text-slate-100")}>
              {value}
            </span>
            {unit ? <span className="pb-1 text-sm font-bold text-slate-300">{unit}</span> : null}
          </div>
          <p className={cn("mt-2 text-[12px]", tone === "red" ? "text-red-300" : tone === "green" ? "text-emerald-300" : "text-slate-500")}>{sub}</p>
        </div>
      </div>
    </Panel>
  );
}

function StorageTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-cyan-300/20 bg-[#08172b]/96 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
      <p className="mb-2 font-mono text-xs font-bold text-cyan-200">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex min-w-[210px] items-center justify-between gap-5 text-xs">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono text-slate-100">{formatPrice(Number(entry.value), 4)} 元/kg</span>
        </div>
      ))}
    </div>
  );
}

export default function AiFuturesStorageDecisionPage() {
  const [date, setDate] = useState("2026-04-23");
  const [period, setPeriod] = useState("月度");
  const [mode, setMode] = useState<StorageDecisionMode>("base");
  const [storageMonths, setStorageMonths] = useState(3);
  const [manualSpot, setManualSpot] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("当前窗口可执行，重点是把 5-7 月锁定为低位成本区，8 月以后停止新增收储。");
  const { logs, pushLog } = useOperationLog([
    "10:28 AI 已同步生猪现货、期货曲线和储备费用",
    "10:26 生成 2026年5月-2027年3月收储日历矩阵",
  ]);

  const { data: market } = trpc.platform.porkMarket.useQuery(
    { timeframe: "month", regionCode: "national", sortBy: "hogPrice" },
    { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 5 },
  );
  const liveHogPrice = market?.benchmarkQuotes.find(item => item.code === "live_hog")?.price;
  const spotPrice = manualSpot ?? liveHogPrice ?? 9.57;

  const queryInput = useMemo(
    () => ({
      currentHogPrice: Number(spotPrice.toFixed(2)),
      industryAverageCost: 12,
      monthlyStorageFee: 0.22075,
      storageMonths,
      decisionDate: date,
      mode,
    }),
    [date, mode, spotPrice, storageMonths],
  );
  const { data: decision, isLoading } = trpc.platform.futuresStorageDecisionSimulate.useQuery(queryInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000,
  });

  const storageMonthsCount = decision?.futuresCurve.filter(item => item.isStorageWindow).length ?? 0;
  const currentProfit = decision?.metrics.currentProfitPerHead ?? -509;
  const threshold = decision?.metrics.storageThreshold ?? 11.33775;
  const monthRows = decision?.futuresCurve ?? [];

  const sendQuestion = (text = question) => {
    const normalized = text.trim();
    if (!normalized) return;
    if (normalized.includes("0.3")) {
      setMode("cost_up");
      setAnswer("成本上升 0.3 元/kg 后，阈值会随行业平均成本上移，但储备费用也会压缩安全边际，建议只保留已锁定窗口并降低规模。");
    } else if (normalized.includes("销售") || normalized.includes("推迟")) {
      setMode("window_extend");
      setAnswer("销售期推迟时需要延长资金占用评估，系统会把窗口从 3 个月扩到 4 个月，但要求更严格的库容和现金流复核。");
    } else if (normalized.includes("7月") || normalized.includes("7 月")) {
      setAnswer("7 月后期货曲线已接近或超过收储阈值，继续收储会把低位成本优势换成资金占用和盘面回落风险。");
    } else {
      setAnswer("已基于当前行情重新研判：若毛猪价仍低于收储阈值，可以执行窗口内收储；若突破三级预警线，应停止新增并转入套保。");
    }
    pushLog(`AI 追问：${normalized}`);
    setQuestion("");
  };

  const exportDecision = () => {
    if (!decision) return;
    const rows = [
      ["月份", "期货价格", "窗口逻辑", "决策"],
      ...decision.futuresCurve.map(row => [row.label, row.futurePrice, row.reason, row.decision]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `futures-storage-decision-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushLog("导出收储研判 CSV");
    toast.success("已导出研判结果");
  };

  const enterStrategySimulation = () => {
    setMode("window_extend");
    setStorageMonths(4);
    pushLog("进入策略模拟：窗口延长 + 风险复核");
    toast.success("策略模拟已切换为销售推迟场景");
  };

  return (
    <PlatformShell title="生猪行情与期货收储研判" eyebrow="AI Storage Decision" pageId="ai-futures-storage-decision">
      <div className="relative min-h-screen overflow-hidden bg-[#04101f] pb-20 text-slate-100">
        <TacticalBackdrop intensity="subtle" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-3 p-3">
          <header className="grid items-center gap-3 rounded-[8px] border border-cyan-400/25 bg-[#06172d]/92 px-4 py-3 shadow-[0_0_28px_rgba(56,189,248,0.12)] xl:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[6px] border border-cyan-300/30 bg-cyan-400/[0.08] px-3 py-2 text-sm font-bold text-cyan-100">
                <Gauge className="h-4 w-4" />
                四川眉山
              </span>
              <LiveSignal label="正常运行" />
            </div>
            <div className="text-center">
              <h1 className="text-[26px] font-black tracking-[0.08em] text-white md:text-[32px]">
                决策依据AI | 生猪行情与期货收储研判
              </h1>
              <p className="mt-1 text-[12px] font-semibold tracking-[0.24em] text-cyan-200/75">
                冻品储备AI作战系统 / 决策依据 / 行情研判
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
              <Input value={date} onChange={event => setDate(event.target.value)} className="h-9 w-[132px] rounded-[5px] border-cyan-300/20 bg-black/20 text-xs" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9 w-[92px] rounded-[5px] border-cyan-300/20 bg-black/20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="月度">月度</SelectItem>
                  <SelectItem value="季度">季度</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => pushLog("刷新行情与期货曲线")} className="h-9 rounded-[5px] border border-cyan-300/25 bg-cyan-400/10 text-xs text-cyan-100 hover:bg-cyan-400/18">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                刷新
              </Button>
              <Button onClick={exportDecision} className="h-9 rounded-[5px] border border-cyan-300/25 bg-cyan-400/10 text-xs text-cyan-100 hover:bg-cyan-400/18">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出
              </Button>
              <Button onClick={enterStrategySimulation} className="h-9 rounded-[5px] bg-blue-500 text-xs font-black text-white hover:bg-blue-400">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                进入策略模拟
              </Button>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="今日毛猪价格" value={formatPrice(decision?.inputs.currentHogPrice ?? spotPrice, 2)} unit="元/kg" sub="较昨日 -0.12 元/kg · -1.24%" icon={PiggyBank} tone="green" />
            <KpiCard label="行业平均成本" value={formatPrice(decision?.inputs.industryAverageCost ?? 12, 2)} unit="元/kg" sub="较昨日 0.00 元/kg · 0.00%" icon={TrendingUp} />
            <KpiCard label="储备期费用" value={formatPrice(decision?.inputs.monthlyStorageFee ?? 0.22075, 5)} unit="元/kg/月" sub={`测算周期：${decision?.inputs.storageMonths ?? storageMonths} 个月`} icon={CircleDollarSign} />
            <KpiCard label="当前毛猪利润" value={formatSigned(currentProfit, " 元/头")} sub="较昨日 -63 元/头 · -14.12%" icon={TrendingDown} tone="red" />
            <KpiCard label="当前判定" value={decision?.metrics.recommendation ?? "收储窗口开启"} sub={`判定时间：${date} 10:28:36`} icon={ShieldCheck} tone="green" />
            <KpiCard label="建议收储月数" value={`${storageMonthsCount || storageMonths}`} unit="个月" sub={`${decision?.metrics.recommendedStart ?? "2026年5月"}-${decision?.metrics.recommendedEnd ?? "2026年7月"}`} icon={CalendarRange} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.45fr_.95fr]">
            <Panel className="h-[292px]">
              <PanelTitle
                title="期货价格曲线 / 收储判断"
                right={
                  <div className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-300"><span className="h-2 w-5 rounded bg-emerald-400/70" />收储区间</span>
                    <span className="inline-flex items-center gap-1 text-red-300"><span className="h-2 w-5 rounded bg-red-400/70" />停止收储区间</span>
                    <span className="font-mono text-slate-500">单位：元/kg</span>
                  </div>
                }
              />
              <div className="h-[238px] px-2 py-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={decision?.chartData ?? []} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1f3b56" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis domain={[8, 14]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip content={<StorageTooltip />} />
                    <ReferenceArea x1="202605" x2="202607" y1={8.2} y2={threshold} fill="#22c55e" fillOpacity={0.16} />
                    <ReferenceArea x1="202611" x2="202703" y1={threshold} y2={13.6} fill="#ef4444" fillOpacity={0.14} />
                    <ReferenceLine y={threshold} stroke="#facc15" strokeDasharray="6 6" />
                    <Area type="monotone" dataKey="futurePrice" name="期货价格" fill="#38bdf8" fillOpacity={0.12} stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: "#bfdbfe" }} />
                    <Line type="monotone" dataKey="storageThreshold" name="收储阈值" stroke="#facc15" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="h-[292px]">
              <PanelTitle title="收储算法" right={isLoading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-300" /> : <LiveSignal label="实时计算" />} />
              <div className="p-4">
                <div className="rounded-[8px] border border-cyan-300/20 bg-black/20 p-4">
                  <p className="text-center text-sm font-bold text-slate-300">{decision?.algorithm.formula}</p>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                    {(decision?.algorithm.components ?? []).map((item, index) => (
                      <div key={item.label} className="contents">
                        <div className={cn("rounded-[6px] border p-3 text-center", index === 2 ? "border-red-300/30 bg-red-500/[0.1]" : "border-cyan-300/20 bg-blue-500/[0.08]")}>
                          <p className="text-xs text-slate-400">{item.label}</p>
                          <p className={cn("mt-1 font-mono text-[22px] font-black", index === 2 ? "text-red-300" : "text-blue-100")}>{formatPrice(item.value, index === 1 || index === 2 ? 5 : 2)}</p>
                          <p className="text-xs text-slate-500">{item.unit}</p>
                        </div>
                        {index < 2 ? <span className="text-center text-2xl font-black text-slate-500">{index === 0 ? "-" : "="}</span> : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[6px] border border-cyan-300/20 bg-cyan-400/[0.08] px-3 py-3 text-center text-sm">
                    当前毛猪价格 <span className="font-mono text-lg font-black text-emerald-300">{formatPrice(decision?.inputs.currentHogPrice ?? spotPrice, 2)}</span> 元/kg
                    <span className="mx-2 text-slate-500">&lt;</span>
                    阈值 <span className="font-mono text-lg font-black text-yellow-300">{formatPrice(threshold, 5)}</span> 元/kg
                    <ChevronRight className="mx-2 inline h-4 w-4 text-cyan-300" />
                    <span className="font-black text-emerald-300">满足收储条件</span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.45fr_.98fr]">
            <Panel>
              <PanelTitle title="收储窗口月份矩阵（日历视图）" />
              <div className="overflow-x-auto p-3">
                <table className="w-full min-w-[980px] border-collapse text-center text-sm">
                  <thead>
                    <tr>
                      {monthRows.map(row => (
                        <th key={row.monthCode} className="border border-cyan-300/18 bg-[#0b223d] px-3 py-2 text-slate-300">{row.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {monthRows.map(row => (
                        <td key={`${row.monthCode}-decision`} className="border border-cyan-300/18 px-3 py-3">
                          <div className={cn("rounded-[6px] px-2 py-2 font-black", row.isStorageWindow ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300")}>{row.decision}</div>
                          <div className="mt-1 rounded-[5px] border border-white/8 bg-black/18 px-2 py-1 text-[11px] text-slate-400">
                            {row.isStorageWindow ? "建议收储" : "停止收储"}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {monthRows.map(row => (
                        <td key={`${row.monthCode}-price`} className="border border-cyan-300/18 px-3 py-2 font-mono text-slate-300">{formatPrice(row.futurePrice, 4)}</td>
                      ))}
                    </tr>
                    <tr>
                      {monthRows.map(row => (
                        <td key={`${row.monthCode}-tick`} className={cn("border border-cyan-300/18 px-3 py-2 text-xl", row.isStorageWindow ? "text-emerald-300" : "text-red-300")}>
                          {row.isStorageWindow ? "✓" : "×"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-[150px_1fr_1fr] border-x border-b border-cyan-300/18 text-center text-sm">
                  <div className="border-r border-cyan-300/18 bg-[#0b223d] py-2 text-slate-400">窗口逻辑</div>
                  <div className="border-r border-cyan-300/18 bg-emerald-400/10 py-2 font-black text-emerald-300">收储区间</div>
                  <div className="bg-red-400/10 py-2 font-black text-red-300">停止收储区间</div>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="储备熔断机制（风险预警）" />
              <div className="p-4">
                <p className="mb-4 text-sm text-slate-300">当市场价格 ≥ 以下任一预警线时，系统建议停止或缩小收储：</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {(decision?.warning.lines ?? []).map((line, index) => (
                    <button
                      key={line.label}
                      onClick={() => {
                        setManualSpot(line.value);
                        pushLog(`模拟触发${line.label}：${line.action}`);
                      }}
                      className={cn("rounded-[7px] border p-3 text-center", index === 2 ? "border-red-300/35 bg-red-500/[0.12]" : "border-cyan-300/20 bg-blue-500/[0.08]")}
                    >
                      <p className="text-xs text-slate-400">{line.label}</p>
                      <p className="mt-2 font-mono text-[24px] font-black text-red-300">{formatPrice(line.value, 5)}</p>
                      <p className="mt-1 text-[11px] text-slate-500">元/kg</p>
                    </button>
                  ))}
                </div>
                <p className="mt-4 rounded-[6px] border border-cyan-300/15 bg-black/20 px-3 py-3 text-[12px] leading-relaxed text-slate-400">
                  {decision?.warning.explanation}
                </p>
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.45fr_.98fr]">
            <Panel>
              <PanelTitle title="AI 解读与追问" right={<Bot className="h-4 w-4 text-cyan-300" />} />
              <div className="grid gap-4 p-4 md:grid-cols-[150px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-[8px] border border-cyan-300/16 bg-black/18 p-4">
                  <div className="grid h-20 w-20 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10">
                    <Bot className="h-12 w-12 text-cyan-200" />
                  </div>
                  <span className="mt-3 rounded-[5px] border border-cyan-300/20 px-3 py-1 text-sm text-cyan-100">AI 助手</span>
                </div>
                <div>
                  <div className="rounded-[8px] border border-cyan-300/15 bg-black/18 p-4">
                    <p className="text-[14px] leading-7 text-slate-300">{answer || decision?.ai.interpretation}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(decision?.ai.questions ?? []).map(item => (
                        <button
                          key={item}
                          onClick={() => sendQuestion(item)}
                          className="rounded-[5px] border border-cyan-300/20 bg-cyan-400/[0.08] px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-400/15"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={question}
                      onChange={event => setQuestion(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") sendQuestion();
                      }}
                      placeholder="请输入您的问题，或选择上方推荐问题快速提问..."
                      className="h-10 rounded-[5px] border-cyan-300/20 bg-black/25"
                    />
                    <Button onClick={() => sendQuestion()} className="h-10 rounded-[5px] bg-blue-500 px-6 font-bold text-white hover:bg-blue-400">
                      发送
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="决策结论" right={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} />
              <div className="space-y-3 p-4">
                <p className="text-sm leading-6 text-slate-300">
                  基于当前 <span className="font-mono text-cyan-200">{date}</span> 猪价与期货价格，系统综合测算得出：
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[8px] border border-cyan-300/30 bg-blue-500/[0.12] p-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-9 w-9 text-cyan-200" />
                      <div>
                        <p className="text-sm font-bold text-cyan-200">推荐收储窗口</p>
                        <p className="mt-1 text-[24px] font-black text-white">{decision?.metrics.recommendedStart}-{decision?.metrics.recommendedEnd}</p>
                        <p className="text-sm text-slate-400">共 {storageMonthsCount || storageMonths} 个月</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[8px] border border-red-300/35 bg-red-500/[0.12] p-4">
                    <div className="flex items-center gap-3">
                      <StopCircle className="h-9 w-9 text-red-200" />
                      <div>
                        <p className="text-sm font-bold text-red-200">停止收储建议</p>
                        <p className="mt-1 text-[24px] font-black text-red-300">{decision?.metrics.stopAfter}以后</p>
                        <p className="text-sm text-red-200/70">建议停止收储</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[7px] border border-cyan-300/15 bg-black/18 p-3 text-sm text-slate-300">
                  <span className="font-black text-white">核心建议：</span>
                  {decision?.ai.recommendations[1] ?? "建议7月后停止收储，避免资金占用与价格风险。"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={mode} onValueChange={value => setMode(value as StorageDecisionMode)}>
                    <SelectTrigger className="h-10 rounded-[5px] border-cyan-300/20 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">基准策略</SelectItem>
                      <SelectItem value="cost_up">成本上升</SelectItem>
                      <SelectItem value="price_down">盘面回落</SelectItem>
                      <SelectItem value="window_extend">销售推迟</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={enterStrategySimulation} className="h-10 rounded-[5px] bg-emerald-500 font-black text-slate-950 hover:bg-emerald-400">
                    生成执行方案
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelTitle title="执行日志与真实性审核" right={<LiveSignal label={decision?.ai.feasibility ?? "可执行"} />} />
            <div className="grid gap-3 p-3 lg:grid-cols-[1fr_1fr]">
              <div className="grid gap-2 md:grid-cols-2">
                {logs.map(log => (
                  <div key={log} className="rounded-[5px] border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {(decision?.ai.auditNotes ?? []).map(note => (
                  <div key={note} className="rounded-[6px] border border-cyan-300/16 bg-cyan-400/[0.06] p-3 text-[12px] leading-relaxed text-slate-300">
                    <AlertTriangle className="mb-2 h-4 w-4 text-yellow-300" />
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PlatformShell>
  );
}
