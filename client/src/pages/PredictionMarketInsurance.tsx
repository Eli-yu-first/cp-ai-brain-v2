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
  InsuranceRiskAppetite,
  PredictionMarketPosition,
} from "../../../server/predictionMarketInsurance";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Binary,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CloudLightning,
  FileUp,
  Gauge,
  Globe2,
  Layers3,
  LockKeyhole,
  Plane,
  Radar,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldCheck,
  Ship,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Umbrella,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

type ClaimState = "待触发" | "核验中" | "已赔付";

const categoryTone: Record<PredictionMarketPosition["category"], string> = {
  chokepoint: "border-orange-400/40 bg-orange-400/[0.11] text-orange-200",
  weather: "border-cyan-400/35 bg-cyan-400/[0.1] text-cyan-200",
  macro: "border-violet-400/35 bg-violet-400/[0.1] text-violet-200",
  freight: "border-amber-400/35 bg-amber-400/[0.1] text-amber-200",
  execution: "border-emerald-400/35 bg-emerald-400/[0.1] text-emerald-200",
  capital: "border-blue-400/35 bg-blue-400/[0.1] text-blue-200",
};

const categoryLabel: Record<PredictionMarketPosition["category"], string> = {
  chokepoint: "航道",
  weather: "天气",
  macro: "宏观",
  freight: "运价",
  execution: "履约",
  capital: "资本",
};

function formatGbp(value: number) {
  if (Math.abs(value) >= 1_000_000) return `£${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `£${(value / 1_000).toFixed(0)}K`;
  return `£${value.toFixed(0)}`;
}

function formatPct(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[7px] border border-orange-300/24 bg-[#10131b]/92 shadow-[inset_0_1px_0_rgba(251,191,36,0.12),0_0_28px_rgba(251,146,60,0.08)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.09),transparent_34%,rgba(56,189,248,0.045))]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function PanelTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-orange-300/14 px-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
        <h2 className="text-[15px] font-semibold tracking-[0.08em] text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof ShieldCheck;
  tone?: "amber" | "green" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/30 bg-emerald-400/[0.1] text-emerald-200"
      : tone === "red"
        ? "border-red-300/35 bg-red-400/[0.12] text-red-200"
        : tone === "blue"
          ? "border-cyan-300/30 bg-cyan-400/[0.1] text-cyan-200"
          : "border-orange-300/35 bg-orange-400/[0.12] text-orange-200";

  return (
    <Panel className="h-[86px]">
      <div className="flex h-full items-center gap-3 px-4">
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[7px] border", toneClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-400">{label}</p>
          <div className="mt-1 font-mono text-[28px] font-black leading-none text-white">{value}</div>
          <p className="mt-1 truncate text-[11px] text-slate-500">{sub}</p>
        </div>
      </div>
    </Panel>
  );
}

function MiniBar({ value, tone = "orange" }: { value: number; tone?: "orange" | "green" | "blue" | "red" }) {
  const color =
    tone === "green" ? "bg-emerald-300" : tone === "blue" ? "bg-cyan-300" : tone === "red" ? "bg-red-300" : "bg-orange-300";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className={cn("h-full rounded-full shadow-[0_0_12px_currentColor]", color)}
      />
    </div>
  );
}

function PositionCard({
  position,
  selected,
  executed,
  onToggle,
  onExecute,
}: {
  position: PredictionMarketPosition;
  selected: boolean;
  executed: boolean;
  onToggle: () => void;
  onExecute: () => void;
}) {
  const critical = position.status === "live-critical";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "rounded-[7px] border bg-[#151a24]/90 p-3 transition-all",
        selected ? "border-orange-300/46 shadow-[0_0_22px_rgba(251,146,60,0.13)]" : "border-white/10",
        critical && "bg-orange-500/[0.08]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 text-left" onClick={onToggle}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold", categoryTone[position.category])}>
              {categoryLabel[position.category]}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">{position.market}</span>
            <span
              className={cn(
                "rounded-[3px] px-1.5 py-0.5 text-[10px] font-black",
                position.side === "NO" ? "bg-red-400/18 text-red-200" : "bg-emerald-400/18 text-emerald-200",
              )}
            >
              {position.side}
            </span>
            {executed ? <span className="text-[11px] font-semibold text-emerald-300">已建仓</span> : null}
          </div>
          <h3 className="mt-2 truncate text-[15px] font-black tracking-[0.02em] text-white">{position.title}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">{position.ticker}</p>
        </button>
        <div className="text-right">
          <p className={cn("font-mono text-[24px] font-black", critical ? "text-orange-300" : "text-emerald-300")}>
            {formatPct(position.probabilityPct)}
          </p>
          <p className="text-[10px] text-slate-500">live prob</p>
        </div>
      </div>

      <div className="mt-3">
        <MiniBar value={position.probabilityPct} tone={critical ? "orange" : "green"} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[5px] border border-white/8 bg-black/20 p-2">
          <p className="text-[10px] text-slate-500">买入</p>
          <p className="font-mono text-sm font-bold text-orange-200">{formatGbp(position.stakeGbp)}</p>
        </div>
        <div className="rounded-[5px] border border-white/8 bg-black/20 p-2">
          <p className="text-[10px] text-slate-500">赔付能力</p>
          <p className="font-mono text-sm font-bold text-emerald-200">{formatGbp(position.payoutPowerGbp)}</p>
        </div>
        <div className="rounded-[5px] border border-white/8 bg-black/20 p-2">
          <p className="text-[10px] text-slate-500">置信度</p>
          <p className="font-mono text-sm font-bold text-cyan-200">{formatPct(position.confidencePct, 0)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3 text-[12px] leading-relaxed">
        <p className="text-slate-300">
          <span className="font-semibold text-slate-500">触发条件：</span>
          {position.trigger}
        </p>
        <p className="text-orange-200/90">
          <span className="font-semibold text-orange-300">对冲合成：</span>
          {position.hedgeInstruction}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 flex-1 rounded-[5px] border text-xs",
            selected
              ? "border-orange-300/40 bg-orange-400/15 text-orange-100 hover:bg-orange-400/20"
              : "border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-800",
          )}
        >
          {selected ? "纳入保单" : "移出保单"}
        </Button>
        <Button
          size="sm"
          onClick={onExecute}
          className="h-8 rounded-[5px] bg-emerald-500/85 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          {executed ? "再平衡" : "下注"}
        </Button>
      </div>
    </motion.article>
  );
}

export default function PredictionMarketInsurancePage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [shipmentValue, setShipmentValue] = useState(482_000);
  const [delayDays, setDelayDays] = useState(17);
  const [promoLoss, setPromoLoss] = useState(40_000);
  const [riskAppetite, setRiskAppetite] = useState<InsuranceRiskAppetite>("balanced");
  const [activeFactorIds, setActiveFactorIds] = useState<string[]>([]);
  const [executedIds, setExecutedIds] = useState<string[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState("suez-closure");
  const [query, setQuery] = useState("");
  const [claimState, setClaimState] = useState<ClaimState>("待触发");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(["CIF 合同", "采购 PO", "促销排期"]);
  const [command, setCommand] = useState("");
  const { logs, pushLog } = useOperationLog([
    "15:00 系统接入 Polymarket / Kalshi / Baltic 指标",
    "14:55 已解析青岛啤酒 CIF Felixstowe 合同 LD 条款",
  ]);

  const baseInput = useMemo(
    () => ({
      shipmentValueGbp: shipmentValue,
      delayDays,
      promoLossGbp: promoLoss,
      riskAppetite,
    }),
    [delayDays, promoLoss, riskAppetite, shipmentValue],
  );

  const selectedInput = useMemo(
    () => ({
      ...baseInput,
      selectedFactorIds: activeFactorIds.length ? activeFactorIds : undefined,
    }),
    [activeFactorIds, baseInput],
  );

  const { data: catalog } = trpc.platform.predictionMarketInsuranceSimulate.useQuery(baseInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000,
  });
  const { data: result, isLoading } = trpc.platform.predictionMarketInsuranceSimulate.useQuery(selectedInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000,
  });

  const allPositions = catalog?.positions ?? result?.positions ?? [];
  const selectedSet = useMemo(() => {
    if (!allPositions.length) return new Set<string>();
    return new Set(activeFactorIds.length ? activeFactorIds : allPositions.map(position => position.id));
  }, [activeFactorIds, allPositions]);
  const visiblePositions = useMemo(() => {
    const source = result?.positions ?? [];
    const keyword = query.trim().toLowerCase();
    if (!keyword) return source;
    return source.filter(position =>
      [
        position.title,
        position.market,
        position.ticker,
        position.trigger,
        position.hedgeInstruction,
        categoryLabel[position.category],
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, result?.positions]);
  const selectedPosition =
    allPositions.find(position => position.id === selectedPositionId) ?? allPositions[0] ?? result?.positions[0];
  const executedSet = new Set(executedIds);
  const triggeredPayout = result?.payoutLadder.filter(item => item.triggered).at(-1);

  const toggleFactor = (id: string) => {
    const allIds = allPositions.map(position => position.id);
    const next = new Set(activeFactorIds.length ? activeFactorIds : allIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveFactorIds(next.size === allIds.length ? [] : Array.from(next));
    setSelectedPositionId(id);
    pushLog(`更新保单因子池：${next.size}/${allIds.length} 个头寸纳入`);
  };

  const executePosition = (id: string) => {
    setExecutedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedPositionId(id);
    const position = allPositions.find(item => item.id === id);
    pushLog(`执行下注：${position?.market ?? "市场"} / ${position?.ticker ?? id}`);
    toast.success("头寸已写入对冲篮子");
  };

  const executeAll = () => {
    const ids = visiblePositions.map(position => position.id);
    setExecutedIds(prev => Array.from(new Set([...prev, ...ids])));
    pushLog(`一键投保：并行下单 ${ids.length} 个预测市场/资本池头寸`);
    toast.success("保单已拆解并完成模拟建仓");
  };

  const simulateDelay = (days: number) => {
    setDelayDays(days);
    setClaimState(days >= 10 ? "核验中" : "待触发");
    pushLog(`模拟 ETA 延误 ${days} 天，重新计算参数化赔付`);
  };

  const triggerPayout = () => {
    if (!triggeredPayout) {
      toast.info("当前延误尚未达到 10 天触发阈值");
      pushLog("赔付检查：未触发任何参数化阈值");
      return;
    }
    setClaimState("已赔付");
    pushLog(`自动赔付 ${formatGbp(triggeredPayout.payoutGbp)}，预计 ${triggeredPayout.settlementHours} 小时到账`);
    toast.success("参数化赔付已进入自动到账流程");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const names = Array.from(files).map(file => file.name);
    setUploadedFiles(prev => [...names, ...prev].slice(0, 6));
    pushLog(`上传承保材料：${names.join(" / ")}`);
    toast.success("材料已加入 AI 风险识别队列");
  };

  const runCommand = (rawCommand = command) => {
    const text = rawCommand.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    if (text.includes("苏伊士") || lower.includes("suez")) {
      setActiveFactorIds(["suez-closure", "cape-reroute", "bab-el-mandeb", "freight-index"]);
      setSelectedPositionId("suez-closure");
    }
    if (text.includes("保守") || lower.includes("conservative")) setRiskAppetite("conservative");
    if (text.includes("激进") || lower.includes("aggressive")) setRiskAppetite("aggressive");
    if (text.includes("30")) simulateDelay(30);
    if (text.includes("20")) simulateDelay(20);
    if (text.includes("10")) simulateDelay(10);
    if (text.includes("赔付")) {
      if (text.includes("30") || text.includes("20") || text.includes("10")) {
        setClaimState("已赔付");
        pushLog("AI 指令触发：按模拟延误阈值进入自动赔付");
        toast.success("参数化赔付已进入自动到账流程");
      } else {
        triggerPayout();
      }
    }
    if (text.includes("下注") || text.includes("投保") || lower.includes("execute")) executeAll();
    pushLog(`AI 指令解析：${text}`);
    setCommand("");
  };

  return (
    <PlatformShell title="预测市场保险平台" eyebrow="Prediction Market Insurance" pageId="prediction-market-insurance">
      <div className="relative min-h-screen overflow-hidden bg-[#070910] pb-20 text-slate-100">
        <TacticalBackdrop intensity="subtle" />
        <style>{`
          @keyframes risk-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes route-pulse { 0%, 100% { transform: scale(1); opacity: .65; } 50% { transform: scale(1.18); opacity: 1; } }
          @keyframes ship-run { from { offset-distance: 0%; } to { offset-distance: 100%; } }
        `}</style>
        <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-3 p-3">
          <header className="rounded-[8px] border border-orange-300/20 bg-[#0d1119]/92 px-4 py-3 shadow-[0_0_28px_rgba(251,146,60,0.08)]">
            <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-[6px] border border-orange-300/25 bg-orange-400/[0.08] px-3 py-2 text-sm font-bold text-orange-100">
                  <Globe2 className="h-4 w-4" />
                  Qingdao → Felixstowe
                </span>
                <LiveSignal label="预测市场 live" />
                <span className="rounded-[6px] border border-red-400/30 bg-red-500/[0.12] px-3 py-2 font-mono text-xs font-black text-red-200">
                  风险 / 临界 · CRITICAL · 10/10
                </span>
              </div>
              <div className="text-center">
                <h1 className="text-[28px] font-black tracking-[0.12em] text-white md:text-[34px]">
                  预测市场重构保险新生态
                </h1>
                <p className="mt-1 text-[12px] font-semibold tracking-[0.28em] text-orange-200/80">
                  参数化保单 / AI 对冲 / 多市场下注 / 72 小时自动赔付
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                <Select value={riskAppetite} onValueChange={value => setRiskAppetite(value as InsuranceRiskAppetite)}>
                  <SelectTrigger className="h-9 w-[132px] rounded-[5px] border-orange-300/25 bg-black/20 text-xs text-orange-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">保守承保</SelectItem>
                    <SelectItem value="balanced">平衡对冲</SelectItem>
                    <SelectItem value="aggressive">价差优先</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setActiveFactorIds([]);
                    setExecutedIds([]);
                    setDelayDays(17);
                    setClaimState("待触发");
                    pushLog("重置青岛啤酒运输保单模拟");
                  }}
                  className="h-9 rounded-[5px] border border-orange-300/25 bg-orange-400/10 text-xs text-orange-100 hover:bg-orange-400/18"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  重置
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="货值 / CIF Felixstowe"
              value={formatGbp(result?.caseSummary.shipmentValueGbp ?? shipmentValue)}
              sub="青岛啤酒英国促销批次"
              icon={Ship}
              tone="amber"
            />
            <KpiCard
              label="参数化保费"
              value={formatGbp(result?.premium.parametricPremiumGbp ?? 0)}
              sub={`较传统降 ${formatPct(result?.premium.premiumReductionPct ?? 0)}`}
              icon={Umbrella}
              tone="green"
            />
            <KpiCard
              label="市场保证金"
              value={formatGbp(result?.premium.marketHedgeBudgetGbp ?? 0)}
              sub="约 $10K 对冲篮子"
              icon={CircleDollarSign}
              tone="blue"
            />
            <KpiCard
              label="独立头寸"
              value={`${result?.portfolio.independentPositions ?? 0}`}
              sub="自动拆解到预测市场"
              icon={Binary}
              tone="amber"
            />
            <KpiCard
              label="赔付能力"
              value={formatGbp(result?.portfolio.coveredPayoutPowerGbp ?? 0)}
              sub={`${formatPct(result?.portfolio.hedgeCoveragePct ?? 0)} 覆盖率`}
              icon={ShieldCheck}
              tone="green"
            />
            <KpiCard
              label="自动到账"
              value={`${result?.portfolio.settlementHours ?? 72}h`}
              sub={`当前状态：${claimState}`}
              icon={Timer}
              tone={claimState === "已赔付" ? "green" : triggeredPayout ? "red" : "blue"}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.02fr_1.45fr_.9fr]">
            <div className="space-y-3">
              <Panel>
                <PanelTitle
                  title="保单录入与 AI 风险识别"
                  right={<span className="font-mono text-[11px] text-slate-500">CIF Felixstowe</span>}
                />
                <div className="p-3">
                  <div
                    className="cursor-pointer rounded-[7px] border border-dashed border-orange-300/30 bg-black/18 p-4 text-center"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileUp className="mx-auto h-6 w-6 text-orange-300" />
                    <p className="mt-2 text-sm font-black text-orange-100">添加文件 · PDF / JPG / PNG</p>
                    <p className="mt-1 text-xs text-slate-500">AI 自动解析合同、PO、财务罚则与到港要求</p>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={event => handleFiles(event.target.files)}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {uploadedFiles.map(file => (
                      <div key={file} className="rounded-[5px] border border-white/8 bg-white/[0.03] px-2 py-2 text-[11px] text-slate-300">
                        <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />
                        {file}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[7px] border border-orange-300/25 bg-orange-400/[0.07] p-3">
                    <p className="text-[12px] font-bold text-orange-200">AI 提取的下注主题</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-slate-300">
                      <span>① 路线：{result?.caseSummary.route ?? "--"}</span>
                      <span>② 货品：青岛啤酒</span>
                      <span>③ 货值：{formatGbp(shipmentValue)}</span>
                      <span>④ 晚 1 天：赔多少</span>
                      <span>⑤ LD：{formatGbp(8_000)} / {formatGbp(20_000)} / {formatGbp(40_000)}</span>
                      <span>⑥ 目标 ETA：{result?.caseSummary.eta ?? "--"}</span>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="航线与相关盘口" right={<LiveSignal label="AIS 追踪" />} />
                <div className="relative h-[330px] p-3">
                  <div className="absolute inset-3 rounded-[7px] border border-cyan-300/10 bg-[radial-gradient(circle_at_30%_55%,rgba(59,130,246,0.35),transparent_24%),radial-gradient(circle_at_62%_42%,rgba(251,146,60,0.18),transparent_20%),#08111d]" />
                  <svg className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)]" viewBox="0 0 600 300">
                    <defs>
                      <linearGradient id="routeGlow" x1="0" x2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <path d="M70 190 C150 135, 230 130, 292 178 S408 210, 520 94" fill="none" stroke="#334155" strokeWidth="10" opacity=".42" />
                    <path d="M70 190 C150 135, 230 130, 292 178 S408 210, 520 94" fill="none" stroke="url(#routeGlow)" strokeWidth="3" strokeDasharray="8 8" />
                    <circle r="6" fill="#f59e0b" style={{ offsetPath: "path('M70 190 C150 135, 230 130, 292 178 S408 210, 520 94')", animation: "ship-run 7s linear infinite" }} />
                  </svg>
                  {[
                    { x: "8%", y: "59%", label: "Qingdao", value: "出港", tone: "green" },
                    { x: "33%", y: "40%", label: "Malacca", value: "10.7%", tone: "green" },
                    { x: "49%", y: "56%", label: "SUEZ", value: "98.7%", tone: "orange" },
                    { x: "60%", y: "70%", label: "CAPE", value: "82.3%", tone: "orange" },
                    { x: "77%", y: "35%", label: "Atlantic", value: "18.4%", tone: "blue" },
                    { x: "86%", y: "22%", label: "Felixstowe", value: "ETA +17d", tone: "red" },
                  ].map(node => (
                    <button
                      key={node.label}
                      className={cn(
                        "absolute rounded-[6px] border bg-[#101827]/92 px-2 py-1 text-left shadow-[0_0_18px_rgba(0,0,0,0.35)]",
                        node.tone === "red"
                          ? "border-red-300/50 text-red-200"
                          : node.tone === "orange"
                            ? "border-orange-300/50 text-orange-200"
                            : node.tone === "blue"
                              ? "border-cyan-300/50 text-cyan-200"
                              : "border-emerald-300/50 text-emerald-200",
                      )}
                      style={{ left: node.x, top: node.y, animation: "route-pulse 2.8s ease-in-out infinite" }}
                      onClick={() => {
                        setQuery(node.label);
                        pushLog(`聚焦航线盘口：${node.label}`);
                      }}
                    >
                      <p className="font-mono text-[10px] text-slate-400">{node.label}</p>
                      <p className="font-mono text-sm font-black">{node.value}</p>
                    </button>
                  ))}
                  <div className="absolute bottom-5 left-5 right-5 rounded-[6px] border border-white/10 bg-black/45 p-3">
                    <p className="text-[12px] text-slate-300">
                      综合延误概率 <span className="font-mono text-[24px] font-black text-orange-300">{formatPct(result?.portfolio.aggregateProbabilityPct ?? 0)}</span>
                      <span className="ml-3 text-slate-500">P50 6d · P90 17d · P99 25d</span>
                    </p>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel>
                <PanelTitle
                  title="风险识别 → AI 分析 → 多市场下注 → 自动赔付"
                  right={isLoading ? <span className="text-xs text-slate-500">计算中</span> : <LiveSignal label="策略已同步" />}
                />
                <div className="grid gap-2 p-3 md:grid-cols-4">
                  {(result?.riskPipeline ?? []).map((stage, index) => (
                    <button
                      key={stage.stage}
                      className={cn(
                        "relative min-h-[92px] rounded-[7px] border p-3 text-left",
                        stage.status === "active"
                          ? "border-orange-300/45 bg-orange-400/[0.1]"
                          : stage.status === "done"
                            ? "border-emerald-300/30 bg-emerald-400/[0.08]"
                            : "border-slate-600 bg-slate-900/60",
                      )}
                      onClick={() => {
                        pushLog(`打开流程节点：${stage.stage}`);
                        if (index === 2) executeAll();
                        if (index === 3) triggerPayout();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-500">0{index + 1}</span>
                        {stage.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <ChevronRight className="h-4 w-4 text-orange-300" />}
                      </div>
                      <p className="mt-2 text-sm font-black text-white">{stage.stage}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{stage.detail}</p>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel>
                <PanelTitle
                  title="活跃预测市场头寸"
                  right={
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                        <Input
                          value={query}
                          onChange={event => setQuery(event.target.value)}
                          placeholder="搜索 Suez / Houthi / BOE..."
                          className="h-8 w-[220px] rounded-[5px] border-white/10 bg-black/20 pl-8 text-xs"
                        />
                      </div>
                      <Button
                        onClick={executeAll}
                        className="h-8 rounded-[5px] bg-orange-400 text-xs font-black text-slate-950 hover:bg-orange-300"
                      >
                        一键投保
                      </Button>
                    </div>
                  }
                />
                <div className="max-h-[664px] overflow-y-auto p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {allPositions.map(position => (
                      <button
                        key={position.id}
                        onClick={() => toggleFactor(position.id)}
                        className={cn(
                          "rounded-[5px] border px-2 py-1 text-[11px] font-semibold",
                          selectedSet.has(position.id)
                            ? "border-orange-300/35 bg-orange-400/12 text-orange-100"
                            : "border-slate-700 bg-slate-900 text-slate-500",
                        )}
                      >
                        {position.title.split("或")[0]}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <AnimatePresence>
                      {visiblePositions.map(position => (
                        <PositionCard
                          key={position.id}
                          position={position}
                          selected={selectedSet.has(position.id)}
                          executed={executedSet.has(position.id)}
                          onToggle={() => toggleFactor(position.id)}
                          onExecute={() => executePosition(position.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel>
                <PanelTitle title="动态报价与承保参数" right={<span className="font-mono text-xs text-orange-200">报价锁定 15 min</span>} />
                <div className="space-y-4 p-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-400">货值</span>
                      <span className="font-mono text-orange-200">{formatGbp(shipmentValue)}</span>
                    </div>
                    <input
                      type="range"
                      min={50_000}
                      max={1_500_000}
                      step={10_000}
                      value={shipmentValue}
                      onChange={event => setShipmentValue(Number(event.target.value))}
                      className="w-full accent-orange-400"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-400">当前延误模拟</span>
                      <span className="font-mono text-orange-200">{delayDays} 天</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={45}
                      step={1}
                      value={delayDays}
                      onChange={event => simulateDelay(Number(event.target.value))}
                      className="w-full accent-orange-400"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-400">促销档期损失</span>
                      <span className="font-mono text-orange-200">{formatGbp(promoLoss)}</span>
                    </div>
                    <input
                      type="range"
                      min={5_000}
                      max={160_000}
                      step={5_000}
                      value={promoLoss}
                      onChange={event => setPromoLoss(Number(event.target.value))}
                      className="w-full accent-orange-400"
                    />
                  </div>

                  <div className="rounded-[7px] border border-orange-300/25 bg-orange-400/[0.08] p-3">
                    <p className="text-[12px] font-bold text-orange-200">报价锁定</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-slate-500">保费</p>
                        <p className="font-mono text-[26px] font-black text-white">{formatGbp(result?.premium.parametricPremiumGbp ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">保额层</p>
                        <p className="font-mono text-[26px] font-black text-orange-300">{formatGbp(40_000)}</p>
                      </div>
                    </div>
                    <Button
                      onClick={executeAll}
                      className="mt-3 h-10 w-full rounded-[5px] bg-orange-400 font-black text-slate-950 hover:bg-orange-300"
                    >
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      一键投保 · 看钱花在哪
                    </Button>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="参数化赔付机制" right={<span className="text-xs text-slate-500">无需人工查勘</span>} />
                <div className="space-y-2 p-3">
                  {(result?.payoutLadder ?? []).map(item => (
                    <button
                      key={item.delayDays}
                      onClick={() => simulateDelay(item.delayDays)}
                      className={cn(
                        "w-full rounded-[6px] border p-3 text-left transition",
                        item.triggered
                          ? "border-orange-300/45 bg-orange-400/[0.12]"
                          : "border-white/10 bg-white/[0.03] hover:border-orange-300/25",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">晚 {item.delayDays} 天 → 赔多少</span>
                        <span className="font-mono text-xl font-black text-orange-300">{formatGbp(item.payoutGbp)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{item.evidence}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className={item.triggered ? "text-emerald-300" : "text-slate-500"}>
                          {item.triggered ? "已触发" : "未触发"}
                        </span>
                        <span className="text-slate-500">{item.settlementHours}h 自动到账</span>
                      </div>
                    </button>
                  ))}
                  <Button
                    onClick={triggerPayout}
                    className="h-10 w-full rounded-[5px] bg-emerald-400 font-black text-slate-950 hover:bg-emerald-300"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    触发自动赔付
                  </Button>
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="选中头寸详情" right={<Radar className="h-4 w-4 text-orange-300" />} />
                <div className="p-3">
                  {selectedPosition ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-[5px] border px-2 py-1 text-xs font-black", categoryTone[selectedPosition.category])}>
                          {selectedPosition.market}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{selectedPosition.ticker}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-black text-white">{selectedPosition.title}</h3>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-[5px] border border-white/8 bg-black/20 p-2">
                          <p className="text-[10px] text-slate-500">市场概率</p>
                          <p className="font-mono text-2xl font-black text-orange-300">{formatPct(selectedPosition.probabilityPct)}</p>
                        </div>
                        <div className="rounded-[5px] border border-white/8 bg-black/20 p-2">
                          <p className="text-[10px] text-slate-500">赔率</p>
                          <p className="font-mono text-2xl font-black text-emerald-300">
                            {(100 / selectedPosition.entryPricePct).toFixed(1)}x
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-[12px] leading-relaxed text-slate-300">{selectedPosition.trigger}</p>
                      <p className="mt-2 text-[12px] leading-relaxed text-orange-200">{selectedPosition.hedgeInstruction}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">等待市场数据...</p>
                  )}
                </div>
              </Panel>

              <Panel>
                <PanelTitle title="AI 承保副驾" right={<Bot className="h-4 w-4 text-cyan-300" />} />
                <div className="p-3">
                  <div className="space-y-2">
                    {[
                      "只保苏伊士和好望角风险",
                      "模拟延误 30 天并触发赔付",
                      "用保守承保重新报价",
                    ].map(text => (
                      <button
                        key={text}
                        onClick={() => {
                          setCommand(text);
                          runCommand(text);
                        }}
                        className="w-full rounded-[5px] border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan-300/30"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={command}
                      onChange={event => setCommand(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") runCommand();
                      }}
                      placeholder="输入：执行下注 / 触发赔付 / 保守承保..."
                      className="h-10 rounded-[5px] border-cyan-300/20 bg-black/25 text-xs"
                    />
                    <Button onClick={() => runCommand()} className="h-10 rounded-[5px] bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
            <Panel>
              <PanelTitle title="传统保险 VS Just In Case" right={<TrendingUp className="h-4 w-4 text-emerald-300" />} />
              <div className="overflow-x-auto p-3">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2">维度</th>
                      <th className="px-3 py-2">传统保险</th>
                      <th className="px-3 py-2">Just In Case 方案</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result?.comparison ?? []).map(row => (
                      <tr key={row.dimension} className="border-t border-white/8">
                        <td className="px-3 py-3 font-bold text-white">{row.dimension}</td>
                        <td className="px-3 py-3 text-slate-400">{row.traditional}</td>
                        <td className="px-3 py-3 text-emerald-200">{row.justInCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelTitle title="执行日志与真实性审核" right={<Activity className="h-4 w-4 text-orange-300" />} />
              <div className="grid gap-3 p-3 md:grid-cols-2">
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log} className="rounded-[5px] border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-slate-300">
                      {log}
                    </div>
                  ))}
                </div>
                <div className="rounded-[7px] border border-red-300/24 bg-red-500/[0.08] p-3">
                  <div className="flex items-center gap-2 text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-black">合规边界</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-red-100/80">{result?.audit.warning}</p>
                  <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                    {(result?.audit.assumptions ?? []).map(item => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="overflow-hidden rounded-[7px] border border-orange-300/15 bg-black/35 py-2">
            <div className="flex w-[200%] gap-8 whitespace-nowrap text-[12px] font-semibold text-slate-400" style={{ animation: "risk-marquee 28s linear infinite" }}>
              {[...(result?.positions ?? []), ...(result?.positions ?? [])].map((position, index) => (
                <span key={`${position.id}-${index}`} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                  {position.market} · {position.title} · {formatPct(position.probabilityPct)}
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
