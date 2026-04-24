export type ArbitrageStrategyType =
  | "time_arbitrage"
  | "cash_futures_arbitrage"
  | "regional_basis_arbitrage"
  | "crush_margin_arbitrage"
  | "portfolio_combo";

export type OptimizationTarget =
  | "net_profit_max"
  | "risk_adjusted_return_max"
  | "capital_efficiency_max";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type PenaltyConfig = {
  riskPenaltyWeight: number;
  capitalPenaltyWeight: number;
  executionPenaltyWeight: number;
  volatilityPenaltyWeight: number;
  basisPenaltyWeight: number;
  spreadPenaltyWeight: number;
  drawdownPenaltyWeight: number;
  stressPenaltyWeight: number;
  marginPenaltyWeight: number;
  capitalOccupancyPenaltyWeight: number;
  leveragePenaltyWeight: number;
  liquidityPenaltyWeight: number;
};

export type ConstraintCheck = {
  name: string;
  passed: boolean;
  actual: number;
  limit: number;
  violation: number;
  penaltyContribution: number;
};

export type ScoreCard = {
  profitScore: number;
  riskScore: number;
  capitalEfficiencyScore: number;
  executionScore: number;
  robustnessScore: number;
  overallScore: number;
};

export type StrategyPnLBreakdown = {
  grossPnL: number;
  spotPnL: number;
  futuresPnL: number;
  basisPnL: number;
  spreadPnL: number;
  transportPnL: number;
  processingPnL: number;
  marginCost: number;
  financingCost: number;
  storageCost: number;
  slippageCost: number;
  transactionCost: number;
  otherCost: number;
  netPnL: number;
  riskPenalty: number;
  capitalPenalty: number;
  executionPenalty: number;
  adjustedObjective: number;
};

export type StrategyRiskMetrics = {
  priceRisk: number;
  basisRisk: number;
  spreadRisk: number;
  volatilityRisk: number;
  var95: number;
  cvar95: number;
  maxDrawdownProxy: number;
  stressLoss: number;
  hedgeEffectiveness: number;
  confidenceScore: number;
};

export type StrategyCapitalMetrics = {
  initialCapitalUsed: number;
  marginUsed: number;
  peakCapitalOccupied: number;
  capitalTurnoverDays: number;
  returnOnCapital: number;
  returnOnMargin: number;
  leverageRatio: number;
};

export type StrategySensitivityPoint = {
  scenario: string;
  netPnL: number;
  adjustedObjective: number;
  effectivePrice?: number;
  priceShockPct?: number;
  basisShock?: number;
  fundingRateShockPct?: number;
  metricA?: number;
  metricB?: number;
};

export type StrategyStressScenario = {
  name: string;
  description: string;
  netPnL: number;
  adjustedObjective: number;
  stressLoss: number;
  pass: boolean;
};

export type StrategyRecommendation = {
  headline: string;
  action: string;
  rationale: string;
};

export type UnifiedStrategyResult = {
  strategyType: ArbitrageStrategyType;
  strategyName: string;
  summary: {
    recommendedAction: string;
    headline: string;
    keyDriver: string;
  };
  pnl: StrategyPnLBreakdown;
  riskMetrics: StrategyRiskMetrics;
  capitalMetrics: StrategyCapitalMetrics;
  constraints: ConstraintCheck[];
  sensitivities: StrategySensitivityPoint[];
  stressTests: StrategyStressScenario[];
  scoreCard: ScoreCard;
  recommendations: StrategyRecommendation[];
  aiInsight: string;
};

export type ComparePlanSnapshot = {
  planId: string;
  planName: string;
  strategyType: ArbitrageStrategyType;
  result: UnifiedStrategyResult;
};

export type CompareDelta = {
  fromPlanId: string;
  toPlanId: string;
  netPnLDelta: number;
  adjustedObjectiveDelta: number;
  riskDelta: number;
  capitalDelta: number;
};

export type CompareResult = {
  plans: ComparePlanSnapshot[];
  ranking: Array<{
    planId: string;
    overallScore: number;
    adjustedObjective: number;
    netPnL: number;
  }>;
  deltas: CompareDelta[];
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  riskPenaltyWeight: 1,
  capitalPenaltyWeight: 1,
  executionPenaltyWeight: 1,
  volatilityPenaltyWeight: 0.9,
  basisPenaltyWeight: 0.85,
  spreadPenaltyWeight: 0.8,
  drawdownPenaltyWeight: 0.75,
  stressPenaltyWeight: 1,
  marginPenaltyWeight: 0.8,
  capitalOccupancyPenaltyWeight: 0.7,
  leveragePenaltyWeight: 0.75,
  liquidityPenaltyWeight: 0.65,
};

export const PENALTY_CONFIG_BY_PROFILE: Record<RiskProfile, PenaltyConfig> = {
  conservative: {
    ...DEFAULT_PENALTY_CONFIG,
    riskPenaltyWeight: 1.25,
    capitalPenaltyWeight: 1.1,
    executionPenaltyWeight: 1.05,
    drawdownPenaltyWeight: 1,
    stressPenaltyWeight: 1.15,
    marginPenaltyWeight: 1,
  },
  balanced: DEFAULT_PENALTY_CONFIG,
  aggressive: {
    ...DEFAULT_PENALTY_CONFIG,
    riskPenaltyWeight: 0.8,
    capitalPenaltyWeight: 0.9,
    executionPenaltyWeight: 0.9,
    drawdownPenaltyWeight: 0.6,
    stressPenaltyWeight: 0.7,
    marginPenaltyWeight: 0.65,
  },
};

export function buildPenaltyConfig(profile: RiskProfile, overrides?: Partial<PenaltyConfig>): PenaltyConfig {
  return {
    ...PENALTY_CONFIG_BY_PROFILE[profile],
    ...overrides,
  };
}

export function buildConstraintCheck(name: string, actual: number, limit: number, penaltyWeight: number): ConstraintCheck {
  const violation = Math.max(0, actual - limit);
  return {
    name,
    passed: violation <= 0,
    actual: round(actual, 4),
    limit: round(limit, 4),
    violation: round(violation, 4),
    penaltyContribution: round(violation * penaltyWeight, 4),
  };
}

export function calculatePenaltyBreakdown(params: {
  volatilityRisk: number;
  basisRisk: number;
  spreadRisk: number;
  maxDrawdownProxy: number;
  stressLoss: number;
  marginUsed: number;
  peakCapitalOccupied: number;
  leverageRatio: number;
  liquidityRisk: number;
  executionComplexity: number;
  config: PenaltyConfig;
}) {
  const { config } = params;
  const riskPenalty =
    params.volatilityRisk * config.volatilityPenaltyWeight +
    params.basisRisk * config.basisPenaltyWeight +
    params.spreadRisk * config.spreadPenaltyWeight +
    params.maxDrawdownProxy * config.drawdownPenaltyWeight +
    params.stressLoss * config.stressPenaltyWeight;

  const capitalPenalty =
    params.marginUsed * 0.0001 * config.marginPenaltyWeight +
    params.peakCapitalOccupied * 0.00005 * config.capitalOccupancyPenaltyWeight +
    Math.max(0, params.leverageRatio - 1) * 100 * config.leveragePenaltyWeight;

  const executionPenalty =
    params.liquidityRisk * config.liquidityPenaltyWeight +
    params.executionComplexity * config.executionPenaltyWeight;

  return {
    riskPenalty: round(riskPenalty),
    capitalPenalty: round(capitalPenalty),
    executionPenalty: round(executionPenalty),
  };
}

export function calculateScoreCard(params: {
  netPnL: number;
  adjustedObjective: number;
  stressLoss: number;
  hedgeEffectiveness: number;
  returnOnCapital: number;
  returnOnMargin: number;
  executionPenalty: number;
  riskPenalty: number;
}) : ScoreCard {
  const profitScore = clamp01((params.adjustedObjective + Math.max(params.netPnL, 0) * 0.35) / Math.max(1, Math.abs(params.netPnL) + 500)) * 100;
  const riskScore = clamp01((params.hedgeEffectiveness - params.riskPenalty / 600) ) * 100;
  const capitalEfficiencyScore = clamp01((params.returnOnCapital / 25 + params.returnOnMargin / 35) / 2) * 100;
  const executionScore = clamp01(1 - params.executionPenalty / 120) * 100;
  const robustnessScore = clamp01(1 - params.stressLoss / Math.max(1, Math.abs(params.netPnL) + 200)) * 100;
  const overallScore = round(
    profitScore * 0.28 +
    riskScore * 0.22 +
    capitalEfficiencyScore * 0.18 +
    executionScore * 0.15 +
    robustnessScore * 0.17,
  );

  return {
    profitScore: round(profitScore),
    riskScore: round(riskScore),
    capitalEfficiencyScore: round(capitalEfficiencyScore),
    executionScore: round(executionScore),
    robustnessScore: round(robustnessScore),
    overallScore,
  };
}

export function buildCompareResult(plans: ComparePlanSnapshot[]): CompareResult {
  const ranking = [...plans]
    .sort((a, b) => b.result.scoreCard.overallScore - a.result.scoreCard.overallScore)
    .map((plan) => ({
      planId: plan.planId,
      overallScore: plan.result.scoreCard.overallScore,
      adjustedObjective: plan.result.pnl.adjustedObjective,
      netPnL: plan.result.pnl.netPnL,
    }));

  const deltas: CompareDelta[] = [];
  for (let i = 0; i < plans.length; i++) {
    for (let j = i + 1; j < plans.length; j++) {
      const from = plans[i]!;
      const to = plans[j]!;
      deltas.push({
        fromPlanId: from.planId,
        toPlanId: to.planId,
        netPnLDelta: round(to.result.pnl.netPnL - from.result.pnl.netPnL),
        adjustedObjectiveDelta: round(to.result.pnl.adjustedObjective - from.result.pnl.adjustedObjective),
        riskDelta: round(to.result.riskMetrics.stressLoss - from.result.riskMetrics.stressLoss),
        capitalDelta: round(to.result.capitalMetrics.peakCapitalOccupied - from.result.capitalMetrics.peakCapitalOccupied),
      });
    }
  }

  return { plans, ranking, deltas };
}
