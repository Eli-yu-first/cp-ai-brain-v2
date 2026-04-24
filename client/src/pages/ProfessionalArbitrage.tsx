import { PlatformShell } from "@/components/platform/PlatformShell";
import { TechPanel } from "@/components/platform/PlatformPrimitives";
import { ArbitrageControlSlider } from "@/components/platform/ArbitrageControlSlider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Boxes,
  CandlestickChart,
  Factory,
  GitBranch,
  RefreshCw,
  Route,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

const partOptions = [
  { code: "pork_belly", name: "五花" },
  { code: "rib", name: "肋排" },
  { code: "ham", name: "后腿肉" },
  { code: "shoulder", name: "前腿肉" },
  { code: "loin", name: "里脊" },
];

const riskProfiles = [
  { code: "conservative", name: "稳健" },
  { code: "balanced", name: "平衡" },
  { code: "aggressive", name: "进取" },
] as const;

function money(value: number) {
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toFixed(0);
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function MetricTile({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-500">{subtext}</div>
    </div>
  );
}

export default function ProfessionalArbitragePage() {
  const [partCode, setPartCode] = useState("pork_belly");
  const [storageTons, setStorageTons] = useState(1200);
  const [storageDurationMonths, setStorageDurationMonths] = useState(6);
  const [hedgeRatio, setHedgeRatio] = useState(0.76);
  const [riskProfile, setRiskProfile] = useState<(typeof riskProfiles)[number]["code"]>("balanced");

  const queryInput = useMemo(
    () => ({
      partCode,
      storageTons,
      physicalExposureTons: storageTons,
      storageDurationMonths,
      hedgeRatio,
      riskProfile,
      spotPrice: 9.6,
      futuresPrice: 11.1,
      targetShipmentTon: Math.min(storageTons, 5000),
    }),
    [hedgeRatio, partCode, riskProfile, storageDurationMonths, storageTons],
  );

  const { data: result, isFetching, refetch } = trpc.platform.professionalArbitrageSimulate.useQuery(queryInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000,
  });

  return (
    <PlatformShell title="专业组合套利" eyebrow="Professional Arbitrage" pageId="professional-arbitrage">
      <div className="space-y-6 pb-24">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <Sigma className="h-3.5 w-3.5" />
              Quant + Hedge
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">时间 / 空间 / 部位 / 金融套利组合决策</h1>
          </div>
          <Button
            onClick={() => void refetch()}
            variant="outline"
            size="sm"
            className="w-fit border-white/[0.1] text-slate-300 hover:text-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            重新计算
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-4">
            <TechPanel className="p-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
                组合参数
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs text-slate-400">部位</label>
                  <select
                    value={partCode}
                    onChange={(event) => setPartCode(event.target.value)}
                    className="h-10 w-full rounded-md border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
                  >
                    {partOptions.map((part) => (
                      <option key={part.code} value={part.code}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs text-slate-400">风险偏好</label>
                  <div className="grid grid-cols-3 gap-2">
                    {riskProfiles.map((profile) => (
                      <button
                        key={profile.code}
                        type="button"
                        onClick={() => setRiskProfile(profile.code)}
                        className={`h-9 rounded-md border text-xs ${
                          riskProfile === profile.code
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                            : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                        }`}
                      >
                        {profile.name}
                      </button>
                    ))}
                  </div>
                </div>
                <ArbitrageControlSlider
                  label="现货敞口"
                  value={storageTons}
                  onChange={setStorageTons}
                  min={100}
                  max={8000}
                  step={100}
                  suffix="吨"
                />
                <ArbitrageControlSlider
                  label="持有周期"
                  value={storageDurationMonths}
                  onChange={setStorageDurationMonths}
                  min={1}
                  max={10}
                  step={1}
                  suffix="月"
                />
                <ArbitrageControlSlider
                  label="套保比例"
                  value={hedgeRatio}
                  onChange={setHedgeRatio}
                  min={0}
                  max={1}
                  step={0.02}
                  suffix=""
                />
              </div>
            </TechPanel>

            {result && (
              <TechPanel className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    对冲决策
                  </div>
                  <Badge className="rounded-md border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                    {result.hedgeDecision.action}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/[0.035] p-3">
                    <div className="text-xs text-slate-500">合约手数</div>
                    <div className="mt-1 font-mono text-xl text-white">{result.hedgeDecision.contractsNeeded}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.035] p-3">
                    <div className="text-xs text-slate-500">保证金</div>
                    <div className="mt-1 font-mono text-xl text-white">{money(result.hedgeDecision.marginRequired)}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-xs leading-6 text-slate-400">
                  <p>{result.hedgeDecision.stopLossRule}</p>
                  <p>{result.hedgeDecision.rebalanceRule}</p>
                </div>
              </TechPanel>
            )}
          </div>

          <div className="space-y-6 xl:col-span-8">
            {result && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="组合目标"
                    value={money(result.portfolio.adjustedPortfolioObjective)}
                    subtext={result.portfolio.recommendedMode}
                    icon={GitBranch}
                    tone="text-cyan-300"
                  />
                  <MetricTile
                    label="组合分数"
                    value={result.portfolio.scoreCard.overallScore.toFixed(1)}
                    subtext={`风险预算 ${result.portfolio.riskBudgetUsedPct}%`}
                    icon={Activity}
                    tone="text-emerald-300"
                  />
                  <MetricTile
                    label="部位通道"
                    value={result.partArbitrage.recommendedLane}
                    subtext={`${result.partArbitrage.partName} · ${result.partArbitrage.riskLevel}风险`}
                    icon={Boxes}
                    tone="text-amber-300"
                  />
                  <MetricTile
                    label="空间路线"
                    value={result.spatialArbitrage.bestRouteName}
                    subtext={`${result.spatialArbitrage.scheduleSummary.averageNetProfitPerKg} 元/kg`}
                    icon={Route}
                    tone="text-indigo-300"
                  />
                </div>

                <TechPanel className="p-6">
                  <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <GitBranch className="h-4 w-4 text-cyan-300" />
                    组合权重
                  </div>
                  <div className="space-y-4">
                    {[
                      ["时间套利", result.portfolio.weights.time],
                      ["空间套利", result.portfolio.weights.spatial],
                      ["部位套利", result.portfolio.weights.part],
                      ["金融对冲", result.portfolio.weights.financialHedge],
                    ].map(([label, weight]) => (
                      <div key={label as string}>
                        <div className="mb-1 flex justify-between text-xs text-slate-400">
                          <span>{label as string}</span>
                          <span className="font-mono">{pct(weight as number)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: pct(weight as number) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </TechPanel>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <TechPanel className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Factory className="h-4 w-4 text-amber-300" />
                      部位公式追踪
                    </div>
                    <div className="space-y-3">
                      {result.partArbitrage.formulaTrace.map((item) => (
                        <div key={item.name} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                            <span className="font-mono text-sm text-cyan-200">
                              {item.value} {item.unit}
                            </span>
                          </div>
                          <div className="text-[11px] leading-5 text-slate-500">{item.formula}</div>
                        </div>
                      ))}
                    </div>
                  </TechPanel>

                  <TechPanel className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <CandlestickChart className="h-4 w-4 text-indigo-300" />
                      关键套利输出
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/[0.035] p-3">
                        <div className="text-xs text-slate-500">时间最大价差</div>
                        <div className="mt-1 font-mono text-lg text-white">{result.timeArbitrage.maxProfit} 元/kg</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.035] p-3">
                        <div className="text-xs text-slate-500">空间调度净利</div>
                        <div className="mt-1 font-mono text-lg text-white">{result.spatialArbitrage.scheduleSummary.totalNetProfit} 万</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.035] p-3">
                        <div className="text-xs text-slate-500">部位预期利润</div>
                        <div className="mt-1 font-mono text-lg text-white">{money(result.partArbitrage.expectedTotalProfit)}</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.035] p-3">
                        <div className="text-xs text-slate-500">金融目标值</div>
                        <div className="mt-1 font-mono text-lg text-white">{money(result.financialArbitrage.adjustedObjective)}</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4 text-xs leading-6 text-slate-400">
                      {result.partArbitrage.recommendedAction}
                    </div>
                  </TechPanel>
                </div>

                <TechPanel className="p-6">
                  <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    操作手册
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {result.operationPlaybook.map((step) => (
                      <div key={step.step} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-xs text-cyan-200">STEP {step.step}</span>
                          <Badge variant="outline" className="border-white/[0.08] text-slate-400">
                            {step.owner}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-slate-100">{step.action}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{step.trigger}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-400">{step.output}</div>
                      </div>
                    ))}
                  </div>
                </TechPanel>
              </>
            )}
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
