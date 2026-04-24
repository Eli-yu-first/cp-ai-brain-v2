import {
  buildConstraintCheck,
  buildPenaltyConfig,
  calculatePenaltyBreakdown,
  calculateScoreCard,
  type PenaltyConfig,
  type RiskProfile,
  type UnifiedStrategyResult,
} from "./arbitrageShared";

export type FinancialArbitrageInput = {
  spotPrice: number;
  futuresPrice: number;
  expectedFutureSpotPrice: number;
  expectedFutureFuturesPrice: number;
  physicalExposureTons: number;
  hedgeRatio: number;
  marginRate: number;
  contractSize: number;
  holdingDays?: number;
  storageCostPerTonDay?: number;
  financingRatePct?: number;
  transactionCostPerTon?: number;
  slippagePerKg?: number;
  deliveryCostPerTon?: number;
  expectedBasisConvergence?: number;
  maxCapital?: number;
  maxMarginUsage?: number;
  optimizationTarget?: "net_profit_max" | "risk_adjusted_return_max" | "capital_efficiency_max";
  riskProfile?: RiskProfile;
  customPenaltyConfig?: Partial<PenaltyConfig>;
};

export type FinancialArbitrageOutput = {
  basisNow: number;
  basisFuture: number;
  basisConvergence: number;
  breakEvenBasis: number;
  spotPnL: number;
  futuresPnL: number;
  basisPnL: number;
  carryCost: number;
  financingCost: number;
  storageCost: number;
  transactionCost: number;
  slippageCost: number;
  deliveryCost: number;
  netPnL: number;
  adjustedObjective: number;
  totalMargin: number;
  contractsNeeded: number;
  effectivePrice: number;
  annualizedReturnPct: number;
  capitalUsage: number;
  marginCallRisk: number;
  hedgeEffectiveness: number;
  worstCaseLoss: number;
  sensitivity: Array<{
    priceDropPercent: number;
    spotPnL: number;
    futuresPnL: number;
    basisPnL: number;
    netPnL: number;
    adjustedObjective: number;
    effectivePrice: number;
  }>;
  stressTests: Array<{
    name: string;
    description: string;
    netPnL: number;
    adjustedObjective: number;
    stressLoss: number;
    pass: boolean;
  }>;
  scoreCard: UnifiedStrategyResult["scoreCard"];
  constraints: UnifiedStrategyResult["constraints"];
  unifiedResult: UnifiedStrategyResult;
  aiInsight: string;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export function simulateFinancialArbitrage(input: FinancialArbitrageInput): FinancialArbitrageOutput {
  const {
    spotPrice,
    futuresPrice,
    expectedFutureSpotPrice,
    expectedFutureFuturesPrice,
    physicalExposureTons,
    hedgeRatio,
    marginRate,
    contractSize,
    holdingDays = 90,
    storageCostPerTonDay = 1.1,
    financingRatePct = 4.2,
    transactionCostPerTon = 18,
    slippagePerKg = 0.03,
    deliveryCostPerTon = 35,
    expectedBasisConvergence = 0,
    maxCapital = Math.max(physicalExposureTons * spotPrice * 1000 * 1.15, 1),
    maxMarginUsage = Math.max(physicalExposureTons * futuresPrice * 1000 * marginRate * 1.2, 1),
    riskProfile = "balanced",
    customPenaltyConfig,
  } = input;

  const penaltyConfig = buildPenaltyConfig(riskProfile, customPenaltyConfig);

  const basisNow = spotPrice - futuresPrice;
  const basisFuture = expectedFutureSpotPrice - expectedFutureFuturesPrice;
  const basisConvergence = basisFuture - basisNow;

  const spotPnL = (expectedFutureSpotPrice - spotPrice) * physicalExposureTons * 1000;
  const hedgedTons = physicalExposureTons * hedgeRatio;
  const contractsNeeded = Math.ceil(hedgedTons / contractSize);
  const actualHedgedTons = contractsNeeded * contractSize;
  const futuresPnL = (futuresPrice - expectedFutureFuturesPrice) * actualHedgedTons * 1000;
  const basisPnL = (expectedBasisConvergence - basisConvergence) * actualHedgedTons * 1000;

  const storageCost = storageCostPerTonDay * holdingDays * physicalExposureTons;
  const financingCost = spotPrice * physicalExposureTons * 1000 * (financingRatePct / 100) * (holdingDays / 365);
  const transactionCost = transactionCostPerTon * actualHedgedTons;
  const slippageCost = slippagePerKg * actualHedgedTons * 1000;
  const deliveryCost = deliveryCostPerTon * actualHedgedTons;
  const carryCost = storageCost + financingCost;
  const grossPnL = spotPnL + futuresPnL + basisPnL;
  const totalMargin = futuresPrice * 1000 * actualHedgedTons * marginRate;
  const peakCapitalOccupied = spotPrice * physicalExposureTons * 1000 + totalMargin + carryCost;

  const volatilityRisk = Math.abs(grossPnL) * (1 - hedgeRatio) * 0.08;
  const basisRisk = Math.abs(basisConvergence) * actualHedgedTons * 280;
  const spreadRisk = Math.abs(expectedFutureFuturesPrice - futuresPrice) * actualHedgedTons * 110;
  const marginCallRisk = round(totalMargin * Math.max(0, 0.18 - hedgeRatio * 0.09) / Math.max(1, peakCapitalOccupied), 4);
  const maxDrawdownProxy = Math.abs(spotPnL) * 0.16 + Math.abs(futuresPnL) * 0.05;
  const hedgeEffectiveness = Math.max(0, Math.min(1, 1 - Math.abs(spotPnL + futuresPnL) / Math.max(Math.abs(spotPnL), 1)));

  const stressBaseLoss =
    Math.abs(spotPnL) * 0.22 * (1 - hedgeRatio * 0.7) +
    Math.abs(basisPnL) * 0.55 +
    totalMargin * 0.06;

  const penaltyBreakdown = calculatePenaltyBreakdown({
    volatilityRisk,
    basisRisk,
    spreadRisk,
    maxDrawdownProxy,
    stressLoss: stressBaseLoss,
    marginUsed: totalMargin,
    peakCapitalOccupied,
    leverageRatio: peakCapitalOccupied / Math.max(maxCapital, 1),
    liquidityRisk: slippageCost + transactionCost * 0.4,
    executionComplexity: contractsNeeded * 0.9,
    config: penaltyConfig,
  });

  const netPnL = grossPnL - carryCost - transactionCost - slippageCost - deliveryCost;
  const adjustedObjective =
    netPnL - penaltyBreakdown.riskPenalty - penaltyBreakdown.capitalPenalty - penaltyBreakdown.executionPenalty;

  const effectivePrice = expectedFutureSpotPrice + (futuresPnL + basisPnL - carryCost) / (physicalExposureTons * 1000);
  const capitalUsage = peakCapitalOccupied;
  const returnOnCapital = (netPnL / Math.max(capitalUsage, 1)) * 100;
  const returnOnMargin = (netPnL / Math.max(totalMargin, 1)) * 100;
  const annualizedReturnPct = returnOnCapital * (365 / Math.max(holdingDays, 1));
  const breakEvenBasis = basisNow + (carryCost + transactionCost + slippageCost + deliveryCost) / Math.max(actualHedgedTons * 1000, 1);

  const sensitivity = [-30, -20, -10, -5, 0, 5, 10, 20, 30].map((pct) => {
    const shift = 1 + pct / 100;
    const simSpot = expectedFutureSpotPrice * shift;
    const simFuture = simSpot - basisFuture;
    const sPnL = (simSpot - spotPrice) * physicalExposureTons * 1000;
    const fPnL = (futuresPrice - simFuture) * actualHedgedTons * 1000;
    const bPnL = (expectedBasisConvergence - (simSpot - simFuture - basisNow)) * actualHedgedTons * 1000;
    const nPnL = sPnL + fPnL + bPnL - carryCost - transactionCost - slippageCost - deliveryCost;
    const stressLoss = Math.abs(sPnL) * 0.16 + Math.abs(bPnL) * 0.4;
    const simAdjusted = nPnL - stressLoss * 0.08 - penaltyBreakdown.capitalPenalty - penaltyBreakdown.executionPenalty;
    return {
      priceDropPercent: pct,
      spotPnL: round(sPnL),
      futuresPnL: round(fPnL),
      basisPnL: round(bPnL),
      netPnL: round(nPnL),
      adjustedObjective: round(simAdjusted),
      effectivePrice: round(simSpot + (fPnL + bPnL - carryCost) / Math.max(physicalExposureTons * 1000, 1), 2),
    };
  });

  const stressTests = [
    {
      name: "basis_widening",
      description: "基差恶化 0.5 元/kg 且保证金比例提升 2pct",
      netPnL: round(netPnL - actualHedgedTons * 500 - totalMargin * 0.25),
      adjustedObjective: round(adjustedObjective - actualHedgedTons * 120 - totalMargin * 0.02),
      stressLoss: round(actualHedgedTons * 500 + totalMargin * 0.25),
      pass: netPnL - actualHedgedTons * 500 - totalMargin * 0.25 > -peakCapitalOccupied * 0.12,
    },
    {
      name: "spot_selloff",
      description: "现货下跌 10%，期货仅回落 6%",
      netPnL: round(netPnL - Math.abs(spotPnL) * 0.1 + Math.abs(futuresPnL) * 0.04),
      adjustedObjective: round(adjustedObjective - Math.abs(spotPnL) * 0.08),
      stressLoss: round(Math.abs(spotPnL) * 0.1 - Math.abs(futuresPnL) * 0.04),
      pass: netPnL - Math.abs(spotPnL) * 0.1 + Math.abs(futuresPnL) * 0.04 > -peakCapitalOccupied * 0.1,
    },
    {
      name: "funding_shock",
      description: "融资成本上行 150bp 且仓储成本上调 12%",
      netPnL: round(netPnL - financingCost * 0.36 - storageCost * 0.12),
      adjustedObjective: round(adjustedObjective - financingCost * 0.2 - storageCost * 0.08),
      stressLoss: round(financingCost * 0.36 + storageCost * 0.12),
      pass: netPnL - financingCost * 0.36 - storageCost * 0.12 > -peakCapitalOccupied * 0.08,
    },
  ];

  const worstCaseLoss = Math.max(...stressTests.map((item) => item.stressLoss));
  const constraints = [
    buildConstraintCheck("capital_budget", peakCapitalOccupied, maxCapital, penaltyConfig.capitalOccupancyPenaltyWeight),
    buildConstraintCheck("margin_budget", totalMargin, maxMarginUsage, penaltyConfig.marginPenaltyWeight),
    buildConstraintCheck("hedge_ratio_cap", hedgeRatio, 1, penaltyConfig.executionPenaltyWeight * 10),
  ];

  const scoreCard = calculateScoreCard({
    netPnL,
    adjustedObjective,
    stressLoss: worstCaseLoss,
    hedgeEffectiveness,
    returnOnCapital,
    returnOnMargin,
    executionPenalty: penaltyBreakdown.executionPenalty + constraints.reduce((sum, item) => sum + item.penaltyContribution, 0),
    riskPenalty: penaltyBreakdown.riskPenalty,
  });

  let insight = "在当前基差、持有成本与资金约束下，";
  if (hedgeRatio === 0) insight += "您选择了完全未套保暴露敞口，价格波动与基差风险将全部暴露。";
  else if (hedgeRatio > 0.8) insight += "您选择了高比例套保，回撤显著收敛，但上行弹性和保证金压力需要同步管理。";
  else insight += "当前套保比例在收益保留与回撤缓释之间更均衡。";
  if (basisNow > 0 && basisFuture < basisNow) insight += " 当前基差高位回归，卖出套保与正向期现套利安全边际更强。";
  if (adjustedObjective < netPnL) insight += ` 风险与资金惩罚合计压缩目标值 ${round(netPnL - adjustedObjective, 0)} 元，说明方案执行质量比账面净利更关键。`;

  const unifiedResult: UnifiedStrategyResult = {
    strategyType: "cash_futures_arbitrage",
    strategyName: "期现套利与套期保值",
    summary: {
      recommendedAction: adjustedObjective >= 0 ? "维持卖出套保并控制保证金占用" : "缩减套保规模并优化持仓成本",
      headline: adjustedObjective >= 0 ? "风险调整后仍具正向期现收益" : "账面盈利不足以覆盖风险与资金惩罚",
      keyDriver: Math.abs(basisPnL) > Math.abs(futuresPnL) ? "基差收敛" : "期货对冲",
    },
    pnl: {
      grossPnL: round(grossPnL),
      spotPnL: round(spotPnL),
      futuresPnL: round(futuresPnL),
      basisPnL: round(basisPnL),
      spreadPnL: 0,
      transportPnL: -round(deliveryCost),
      processingPnL: 0,
      marginCost: round(totalMargin * 0.01),
      financingCost: round(financingCost),
      storageCost: round(storageCost),
      slippageCost: round(slippageCost),
      transactionCost: round(transactionCost),
      otherCost: round(deliveryCost),
      netPnL: round(netPnL),
      riskPenalty: penaltyBreakdown.riskPenalty,
      capitalPenalty: penaltyBreakdown.capitalPenalty,
      executionPenalty: penaltyBreakdown.executionPenalty,
      adjustedObjective: round(adjustedObjective),
    },
    riskMetrics: {
      priceRisk: round(volatilityRisk),
      basisRisk: round(basisRisk),
      spreadRisk: round(spreadRisk),
      volatilityRisk: round(volatilityRisk),
      var95: round(volatilityRisk * 1.35),
      cvar95: round(volatilityRisk * 1.7),
      maxDrawdownProxy: round(maxDrawdownProxy),
      stressLoss: round(worstCaseLoss),
      hedgeEffectiveness: round(hedgeEffectiveness * 100, 2),
      confidenceScore: round(Math.max(0, 100 - marginCallRisk * 100 - Math.abs(basisConvergence) * 12), 2),
    },
    capitalMetrics: {
      initialCapitalUsed: round(spotPrice * physicalExposureTons * 1000),
      marginUsed: round(totalMargin),
      peakCapitalOccupied: round(peakCapitalOccupied),
      capitalTurnoverDays: holdingDays,
      returnOnCapital: round(returnOnCapital, 2),
      returnOnMargin: round(returnOnMargin, 2),
      leverageRatio: round(peakCapitalOccupied / Math.max(maxCapital, 1), 4),
    },
    constraints,
    sensitivities: sensitivity.map((item) => ({
      scenario: `${item.priceDropPercent}%`,
      netPnL: item.netPnL,
      adjustedObjective: item.adjustedObjective,
      effectivePrice: item.effectivePrice,
      priceShockPct: item.priceDropPercent,
    })),
    stressTests,
    scoreCard,
    recommendations: [
      {
        headline: adjustedObjective >= 0 ? "保持套保主线" : "压缩头寸规模",
        action: adjustedObjective >= 0 ? "锁定现货暴露的 70%-90%" : "先将套保比例降至 50%-65%",
        rationale: "在风险惩罚和资金惩罚后，该区间通常更接近稳健最优。",
      },
      {
        headline: "降低占资成本",
        action: "优先优化持有天数、仓储费与追加保证金预案",
        rationale: "当前方案的主要惩罚来自资金占用与压力场景损失。",
      },
    ],
    aiInsight: insight,
  };

  return {
    basisNow,
    basisFuture,
    basisConvergence: round(basisConvergence),
    breakEvenBasis: round(breakEvenBasis),
    spotPnL: round(spotPnL),
    futuresPnL: round(futuresPnL),
    basisPnL: round(basisPnL),
    carryCost: round(carryCost),
    financingCost: round(financingCost),
    storageCost: round(storageCost),
    transactionCost: round(transactionCost),
    slippageCost: round(slippageCost),
    deliveryCost: round(deliveryCost),
    netPnL: round(netPnL),
    adjustedObjective: round(adjustedObjective),
    totalMargin: round(totalMargin),
    contractsNeeded,
    effectivePrice: round(effectivePrice),
    annualizedReturnPct: round(annualizedReturnPct),
    capitalUsage: round(capitalUsage),
    marginCallRisk,
    hedgeEffectiveness: round(hedgeEffectiveness * 100, 2),
    worstCaseLoss: round(worstCaseLoss),
    sensitivity,
    stressTests,
    scoreCard,
    constraints,
    unifiedResult,
    aiInsight: insight,
  };
}
