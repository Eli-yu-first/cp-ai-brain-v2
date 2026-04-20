import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  BrainCircuit,
  Activity,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type DeepArbitrageCategory =
  | "transmission"
  | "breeding_structure"
  | "zero_waste"
  | "channel_scene"
  | "capacity_mismatch"
  | "supply_chain_cash"
  | "policy_bonus"
  | "quality_brand"
  | "info_arbitrage"
  | "counter_cyclical"
  | "cross_border"
  | "compliance_optimization"
  | "light_asset_joint"
  | "green_circular";

type DeepArbitrageResult = {
  category: DeepArbitrageCategory;
  name: string;
  description: string;
  triggerCondition: string;
  triggerStatus: "active" | "watch" | "inactive";
  expectedReturnPerHead: number;
  riskLevel: "低" | "中" | "高";
  implementation: string[];
  metrics: Record<string, number>;
};

type IntegratedArbitrageResult = {
  timeArbitrage: {
    active: boolean;
    currentSpotPrice: number;
    futuresPrice: number;
    carryCost: number;
    basis: number;
    holdingDays: number;
    expectedReturnPerTon: number;
    SharpeRatio: number;
  };
  spaceArbitrage: {
    active: boolean;
    originPrice: number;
    destPrice: number;
    transportCost: number;
    netProfitPerKg: number;
    bestRoute: string;
    totalCapacity: number;
  };
  entityArbitrage: {
    active: boolean;
    freshProfitPerKg: number;
    frozenProfitPerKg: number;
    processingProfitPerKg: number;
    bestChannel: string;
    premiumRate: number;
  };
  financialArbitrage: {
    active: boolean;
    spotPrice: number;
    futuresPrice: number;
    basisSpread: number;
    hedgeRatio: number;
    fundingCostSaving: number;
  };
  deepArbitrages: DeepArbitrageResult[];
  totalExpectedReturn: number;
  optimalStrategy: string;
  riskDistribution: Record<string, number>;
};

type CoreMetric = {
  code: string;
  name: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  lastUpdated: number;
};

type MetricCategory = {
  module: string;
  name: string;
  metrics: CoreMetric[];
};

const ARBITRAGE_CATEGORY_LABELS: Record<DeepArbitrageCategory, string> = {
  transmission: "产业链传导",
  breeding_structure: "繁育结构",
  zero_waste: "全价值零废弃",
  channel_scene: "渠道场景",
  capacity_mismatch: "产能错配",
  supply_chain_cash: "供应链现金流",
  policy_bonus: "政策红利",
  quality_brand: "品质品牌",
  info_arbitrage: "信息差",
  counter_cyclical: "逆向周期",
  cross_border: "跨境内外盘",
  compliance_optimization: "合规优化",
  light_asset_joint: "轻资产联营",
  green_circular: "绿色循环",
};

const RISK_COLORS = {
  低: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  中: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  高: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
};

const STATUS_ICONS = {
  active: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  watch: <Clock className="h-4 w-4 text-amber-400" />,
  inactive: <Info className="h-4 w-4 text-slate-500" />,
};

const STATUS_COLORS = {
  active: { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "active" },
  watch: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "watch" },
  inactive: { badge: "bg-slate-500/20 text-slate-400 border-slate-500/40", label: "inactive" },
};

function MetricCard({ metric }: { metric: CoreMetric }) {
  const statusColors = {
    normal: "text-slate-300",
    warning: "text-amber-400",
    critical: "text-rose-400",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    stable: "→",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-slate-400">{metric.name}</span>
        <span className={`text-[11px] ${statusColors[metric.status]}`}>
          {trendIcons[metric.trend]}
        </span>
      </div>
      <span className={`font-mono text-[13px] font-semibold ${statusColors[metric.status]}`}>
        {metric.value.toLocaleString()} {metric.unit}
      </span>
    </div>
  );
}

function ArbitrageCard({ arbitrage, index }: { arbitrage: DeepArbitrageResult; index: number }) {
  const riskStyle = RISK_COLORS[arbitrage.riskLevel];
  const statusStyle = STATUS_COLORS[arbitrage.triggerStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <TechPanel className={`p-5 rounded-[20px] border ${arbitrage.triggerStatus === "active" ? "border-emerald-500/40" : "border-white/10"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${arbitrage.triggerStatus === "active" ? "bg-emerald-500/20" : "bg-slate-500/20"}`}>
              <Zap className={`h-5 w-5 ${arbitrage.triggerStatus === "active" ? "text-emerald-400" : "text-slate-400"}`} />
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white">{arbitrage.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{ARBITRAGE_CATEGORY_LABELS[arbitrage.category]}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={statusStyle.badge}>
              {STATUS_ICONS[arbitrage.triggerStatus]}
              <span className="ml-1">{arbitrage.triggerStatus === "active" ? "触发" : arbitrage.triggerStatus === "watch" ? "观察" : "未触发"}</span>
            </Badge>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${riskStyle.bg} ${riskStyle.border} ${riskStyle.text}`}>
              风险: {arbitrage.riskLevel}
            </span>
          </div>
        </div>

        <p className="text-[12px] text-slate-400 leading-relaxed mb-3">{arbitrage.description}</p>

        <div className="bg-slate-900/50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] text-cyan-300 font-medium">触发条件</span>
          </div>
          <p className="text-[12px] text-slate-300">{arbitrage.triggerCondition}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400">预期收益</span>
            </div>
            <p className={`font-mono text-[14px] font-bold ${arbitrage.expectedReturnPerHead > 0 ? "text-emerald-400" : "text-slate-400"}`}>
              {arbitrage.expectedReturnPerHead > 0 ? "+" : ""}{arbitrage.expectedReturnPerHead.toFixed(0)} 元/头
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">风险等级</span>
            </div>
            <p className={`font-mono text-[14px] font-bold ${riskStyle.text}`}>
              {arbitrage.riskLevel}
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] text-violet-300 font-medium">实施方案</span>
          </div>
          <ul className="space-y-1.5">
            {arbitrage.implementation.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                <ArrowRight className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {Object.keys(arbitrage.metrics).length > 0 && (
          <div className="border-t border-white/5 pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] text-cyan-300 font-medium">关键指标</span>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2">
              {Object.entries(arbitrage.metrics).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[11px] text-slate-500">{key}</span>
                  <span className="text-[12px] text-slate-300 font-mono">
                    {typeof value === "number" ? (value < 100 ? value.toFixed(2) : value.toLocaleString()) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </TechPanel>
    </motion.div>
  );
}

export default function DeepArbitragePage() {
  const { t } = useLanguage();

  const [cornPrice, setCornPrice] = useState(2386);
  const [soybeanMealPrice, setSoybeanMealPrice] = useState(3115);
  const [liveHogPrice, setLiveHogPrice] = useState(14.5);
  const [sowStock, setSowStock] = useState(4200);
  const [capacityUtilization, setCapacityUtilization] = useState(72);

  const { data: integratedResult, isLoading: isLoadingIntegrated } = trpc.platform.deepArbitrageAnalysis.useQuery(
    {
      cornPrice,
      soybeanMealPrice,
      liveHogPrice,
      sowStock,
      capacityUtilization,
      inventoryAge90Plus: 8,
      coldChainCost: 1.2,
      storageCost: 225,
      capitalCost: 3.8,
      liveHogSpot: liveHogPrice,
      futuresPrice: liveHogPrice * 1.12,
      cornSpot: cornPrice,
      soymealSpot: soybeanMealPrice,
      inventoryTurnover: 85,
      executionRate: 92,
      lossRate: 0.9,
    },
    { placeholderData: (prev) => prev }
  );

  const { data: coreMetrics, isLoading: isLoadingMetrics } = trpc.platform.coreMetrics.useQuery(
    {
      cornPrice,
      soybeanMealPrice,
      liveHogPrice,
      liveHogSpot: liveHogPrice,
      futuresPrice: liveHogPrice * 1.12,
      cornSpot: cornPrice,
      soymealSpot: soybeanMealPrice,
      sowStock,
      capacityUtilization,
      inventoryTurnover: 85,
      executionRate: 92,
      lossRate: 0.9,
    },
    { placeholderData: (prev) => prev }
  );

  const { data: arbitrageList } = trpc.platform.deepArbitrageList.useQuery(
    {
      cornPrice,
      soybeanMealPrice,
      liveHogPrice,
      sowStock,
      capacityUtilization,
    }
  );

  const stats = useMemo(() => {
    if (!integratedResult) return null;
    const activeCount = integratedResult.deepArbitrages.filter(a => a.triggerStatus === "active").length;
    const watchCount = integratedResult.deepArbitrages.filter(a => a.triggerStatus === "watch").length;
    return {
      activeCount,
      watchCount,
      totalExpectedReturn: integratedResult.totalExpectedReturn,
      optimalStrategy: integratedResult.optimalStrategy,
    };
  }, [integratedResult]);

  return (
    <PlatformShell
      title={t("deepArbitrage.pageTitle")}
      eyebrow="Deep Arbitrage"
      pageId="deep-arbitrage"
    >
      <SectionHeader
        eyebrow="Advanced Arbitrage Engine"
        title={t("deepArbitrage.pageTitle")}
        description="14类深度套利策略全覆盖，AI驱动的智能决策"
        aside={
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <BrainCircuit className="mr-1 h-3 w-3" /> 模型已启用
            </Badge>
          </div>
        }
      />

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "触发套利数",
              value: `${stats.activeCount} 类`,
              sub: `${stats.watchCount}类观察中`,
              color: "text-emerald-400",
              icon: <Zap className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "综合预期收益",
              value: `${stats.totalExpectedReturn > 0 ? "+" : ""}${stats.totalExpectedReturn.toFixed(0)}万`,
              sub: "年化预估",
              color: stats.totalExpectedReturn > 0 ? "text-emerald-400" : "text-rose-400",
              icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "最优策略数",
              value: `${integratedResult?.deepArbitrages.filter(a => a.triggerStatus === "active").length || 0}`,
              sub: "主动触发",
              color: "text-cyan-400",
              icon: <Target className="h-4 w-4 text-cyan-400" />,
            },
            {
              label: "套利引擎状态",
              value: "运行中",
              sub: "14类策略已加载",
              color: "text-violet-400",
              icon: <Activity className="h-4 w-4 text-violet-400" />,
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TechPanel className="p-4 rounded-[16px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">{item.label}</span>
                  {item.icon}
                </div>
                <p className={`font-mono text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.sub}</p>
              </TechPanel>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-4">
          <TechPanel className="relative overflow-hidden p-6 rounded-[24px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-400 to-purple-600 rounded-l-[24px]" />
            <h4 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase opacity-90">
              <Activity className="h-4 w-4 text-violet-400" />
              市场参数设置
            </h4>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    玉米价格 (元/吨)
                  </label>
                  <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[13px]">
                    ¥{cornPrice.toLocaleString()}
                  </span>
                </div>
                <Slider min={1500} max={3500} step={10} value={[cornPrice]}
                  onValueChange={(val) => setCornPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    豆粕价格 (元/吨)
                  </label>
                  <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[13px]">
                    ¥{soybeanMealPrice.toLocaleString()}
                  </span>
                </div>
                <Slider min={2500} max={4500} step={10} value={[soybeanMealPrice]}
                  onValueChange={(val) => setSoybeanMealPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    生猪价格 (元/kg)
                  </label>
                  <span className="font-mono text-rose-300 font-bold bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20 text-[13px]">
                    ¥{liveHogPrice.toFixed(2)}
                  </span>
                </div>
                <Slider min={10} max={25} step={0.1} value={[liveHogPrice]}
                  onValueChange={(val) => setLiveHogPrice(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    能繁母猪存栏 (万头)
                  </label>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 text-[13px]">
                    {sowStock.toLocaleString()}
                  </span>
                </div>
                <Slider min={3000} max={6000} step={50} value={[sowStock]}
                  onValueChange={(val) => setSowStock(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                    产能利用率 (%)
                  </label>
                  <span className="font-mono text-emerald-300 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 text-[13px]">
                    {capacityUtilization}%
                  </span>
                </div>
                <Slider min={30} max={120} step={1} value={[capacityUtilization]}
                  onValueChange={(val) => setCapacityUtilization(val[0]!)}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
              </div>
            </div>
          </TechPanel>

          {integratedResult && (
            <TechPanel className="p-5 rounded-[20px]">
              <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                最优策略组合
              </h4>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-[12px] text-slate-300 leading-relaxed">
                  {integratedResult.optimalStrategy}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <h5 className="text-[11px] text-slate-400 uppercase tracking-wider mb-3">风险分布</h5>
                <div className="space-y-2">
                  {Object.entries(integratedResult.riskDistribution).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-400">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-300 font-mono">{value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TechPanel>
          )}
        </div>

        <div className="lg:col-span-8">
          {isLoadingIntegrated ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {arbitrageList?.map((arbitrage, index) => (
                <ArbitrageCard key={arbitrage.category} arbitrage={arbitrage} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      {coreMetrics && (
        <div className="mb-6">
          <TechPanel className="p-5 rounded-[20px]">
            <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              核心运营指标
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {coreMetrics.slice(0, 4).map((category: MetricCategory) => (
                <div key={category.module} className="bg-slate-900/50 rounded-xl p-3">
                  <h5 className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wider mb-2">
                    {category.name}
                  </h5>
                  <div className="divide-y divide-white/5">
                    {category.metrics.slice(0, 4).map((metric: CoreMetric) => (
                      <MetricCard key={metric.code} metric={metric} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TechPanel>
        </div>
      )}

      {integratedResult && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TechPanel className="p-5 rounded-[20px]">
            <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              时间套利状态
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">当前状态</span>
                <Badge className={integratedResult.timeArbitrage.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}>
                  {integratedResult.timeArbitrage.active ? "有效" : "无效"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">现货价格</span>
                <span className="text-[13px] text-white font-mono">¥{integratedResult.timeArbitrage.currentSpotPrice.toFixed(2)}/kg</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">期货价格</span>
                <span className="text-[13px] text-violet-300 font-mono">¥{integratedResult.timeArbitrage.futuresPrice.toFixed(2)}/kg</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">持有天数</span>
                <span className="text-[13px] text-white font-mono">{integratedResult.timeArbitrage.holdingDays}天</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-slate-400">预期收益</span>
                <span className={`text-[13px] font-mono font-bold ${integratedResult.timeArbitrage.expectedReturnPerTon > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                  ¥{integratedResult.timeArbitrage.expectedReturnPerTon.toLocaleString()}/吨
                </span>
              </div>
            </div>
          </TechPanel>

          <TechPanel className="p-5 rounded-[20px]">
            <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              空间套利状态
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">当前状态</span>
                <Badge className={integratedResult.spaceArbitrage.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}>
                  {integratedResult.spaceArbitrage.active ? "有效" : "无效"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">最优路线</span>
                <span className="text-[13px] text-white">{integratedResult.spaceArbitrage.bestRoute}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">价差</span>
                <span className="text-[13px] text-emerald-300 font-mono">
                  ¥{(integratedResult.spaceArbitrage.destPrice - integratedResult.spaceArbitrage.originPrice).toFixed(2)}/kg
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">物流成本</span>
                <span className="text-[13px] text-rose-300 font-mono">¥{integratedResult.spaceArbitrage.transportCost.toFixed(2)}/kg</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-slate-400">净利</span>
                <span className={`text-[13px] font-mono font-bold ${integratedResult.spaceArbitrage.netProfitPerKg > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {integratedResult.spaceArbitrage.netProfitPerKg > 0 ? "+" : ""}¥{integratedResult.spaceArbitrage.netProfitPerKg.toFixed(2)}/kg
                </span>
              </div>
            </div>
          </TechPanel>

          <TechPanel className="p-5 rounded-[20px]">
            <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              实体套利状态
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">当前状态</span>
                <Badge className={integratedResult.entityArbitrage.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}>
                  {integratedResult.entityArbitrage.active ? "有效" : "无效"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">最优渠道</span>
                <span className="text-[13px] text-white">{integratedResult.entityArbitrage.bestChannel}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">溢价率</span>
                <span className="text-[13px] text-emerald-300 font-mono">{(integratedResult.entityArbitrage.premiumRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">鲜销收益</span>
                <span className="text-[13px] text-white font-mono">¥{integratedResult.entityArbitrage.freshProfitPerKg.toFixed(2)}/kg</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-slate-400">冻储收益</span>
                <span className="text-[13px] text-white font-mono">¥{integratedResult.entityArbitrage.frozenProfitPerKg.toFixed(2)}/kg</span>
              </div>
            </div>
          </TechPanel>

          <TechPanel className="p-5 rounded-[20px]">
            <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              金融套利状态
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">当前状态</span>
                <Badge className={integratedResult.financialArbitrage.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}>
                  {integratedResult.financialArbitrage.active ? "有效" : "无效"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">期现基差</span>
                <span className={`text-[13px] font-mono ${integratedResult.financialArbitrage.basisSpread > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  ¥{integratedResult.financialArbitrage.basisSpread.toFixed(2)}/kg
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">对冲比例</span>
                <span className="text-[13px] text-white font-mono">{(integratedResult.financialArbitrage.hedgeRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[12px] text-slate-400">资金成本节省</span>
                <span className="text-[13px] text-emerald-300 font-mono">¥{integratedResult.financialArbitrage.fundingCostSaving.toFixed(2)}/kg</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-slate-400">套利类型</span>
                <span className="text-[13px] text-violet-300">期现套利</span>
              </div>
            </div>
          </TechPanel>
        </div>
      )}
    </PlatformShell>
  );
}
