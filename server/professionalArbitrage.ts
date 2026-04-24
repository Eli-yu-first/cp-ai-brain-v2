import {
  buildConstraintCheck,
  buildPenaltyConfig,
  calculatePenaltyBreakdown,
  calculateScoreCard,
  type RiskProfile,
} from "./arbitrageShared";
import { simulateFinancialArbitrage } from "./financialArbitrage";
import { calculateSpatialArbitrage } from "./spatialArbitrage";
import { calculateArbitrage } from "./timeArbitrage";
import {
  PORK_PARTS,
  calculateAgeDepreciationCoefficient,
  calculateCostOfCarryFairPrice,
  calculatePartFullCost,
  calculateRiskAdjustedHoldingReturn,
} from "./porkIndustryModel";
import { benchmarkQuotes, inventoryBatches, partQuotes, type InventoryBatch, type PartQuote } from "./platformData";

export type ProfessionalArbitrageInput = {
  partCode?: string;
  batchCode?: string;
  spotPrice?: number;
  futuresPrice?: number;
  expectedFutureSpotPrice?: number;
  expectedFutureFuturesPrice?: number;
  holdingCostPerMonth?: number;
  socialBreakevenCost?: number;
  storageTons?: number;
  startMonth?: number;
  storageDurationMonths?: number;
  originFilter?: string;
  transportCostPerKmPerTon?: number;
  minProfitThreshold?: number;
  targetShipmentTon?: number;
  physicalExposureTons?: number;
  hedgeRatio?: number;
  marginRate?: number;
  contractSize?: number;
  maxCapital?: number;
  maxMarginUsage?: number;
  riskProfile?: RiskProfile;
};

export type PartArbitrageLane = "fresh_sell" | "freeze_store" | "deep_process" | "hedge_only" | "hold";
export type RiskLevel = "低" | "中" | "高";

export type PartArbitrageResult = {
  partCode: string;
  partName: string;
  category: string;
  batchCode: string;
  inventoryKg: number;
  ageDays: number;
  ageDepreciationCoefficient: number;
  fullCostPerKg: number;
  freshBreakEvenPrice: number;
  frozenBreakEvenPrice: number;
  processingBreakEvenPrice: number;
  freshSpreadPerKg: number;
  frozenSpreadPerKg: number;
  processingSpreadPerKg: number;
  costOfCarryFairPrice: number;
  riskAdjustedHoldingReturnPct: number;
  sharpeRatio: number;
  recommendedLane: PartArbitrageLane;
  recommendedAction: string;
  expectedProfitPerKg: number;
  expectedTotalProfit: number;
  riskScore: number;
  riskLevel: RiskLevel;
  drivers: string[];
  formulaTrace: Array<{
    name: string;
    formula: string;
    value: number | string;
    unit: string;
  }>;
};

export type ProfessionalArbitrageResult = {
  inputSummary: {
    partCode: string;
    batchCode: string;
    riskProfile: RiskProfile;
    strategyHorizonDays: number;
    exposureTons: number;
  };
  timeArbitrage: ReturnType<typeof calculateArbitrage>;
  spatialArbitrage: ReturnType<typeof calculateSpatialArbitrage>;
  partArbitrage: PartArbitrageResult;
  financialArbitrage: ReturnType<typeof simulateFinancialArbitrage>;
  portfolio: {
    recommendedMode: "offensive_combo" | "balanced_combo" | "defensive_hedge" | "wait";
    standaloneOpportunitySum: number;
    adjustedPortfolioObjective: number;
    diversificationBenefit: number;
    capitalRequired: number;
    riskBudgetUsedPct: number;
    weights: Record<"time" | "spatial" | "part" | "financialHedge", number>;
    scoreCard: ReturnType<typeof calculateScoreCard>;
    constraints: ReturnType<typeof buildConstraintCheck>[];
  };
  hedgeDecision: {
    action: "short_futures" | "reduce_exposure" | "cash_only" | "wait";
    exposureTons: number;
    hedgeRatio: number;
    contractsNeeded: number;
    marginRequired: number;
    hedgeEffectivenessPct: number;
    basisNow: number;
    breakEvenBasis: number;
    stopLossRule: string;
    rebalanceRule: string;
  };
  operationPlaybook: Array<{
    step: number;
    owner: "strategy" | "procurement" | "logistics" | "warehouse" | "sales" | "risk" | "finance";
    action: string;
    trigger: string;
    output: string;
  }>;
  riskControlMatrix: Array<{
    risk: string;
    metric: string;
    threshold: string;
    action: string;
  }>;
  auditTrail: Array<{
    module: string;
    formula: string;
    result: string;
  }>;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sumPositive(values: number[]) {
  return values.reduce((sum, value) => sum + Math.max(0, value), 0);
}

function pickRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "高";
  if (score >= 38) return "中";
  return "低";
}

function defaultHedgeRatio(profile: RiskProfile) {
  if (profile === "conservative") return 0.88;
  if (profile === "aggressive") return 0.62;
  return 0.76;
}

function liveHogBenchmarkPrice() {
  return benchmarkQuotes.find((quote) => quote.code === "live_hog")?.price ?? 9.6;
}

function resolveBatchAndPart(input: ProfessionalArbitrageInput): { batch: InventoryBatch; part: PartQuote } {
  const batch =
    inventoryBatches.find((item) => item.batchCode === input.batchCode) ??
    inventoryBatches.find((item) => item.partCode === input.partCode) ??
    inventoryBatches[0]!;
  const part =
    partQuotes.find((item) => item.code === input.partCode) ??
    partQuotes.find((item) => item.code === batch.partCode) ??
    partQuotes[0]!;
  return { batch, part };
}

function buildPartArbitrage(input: ProfessionalArbitrageInput): PartArbitrageResult {
  const { batch, part } = resolveBatchAndPart(input);
  const partDefinition = PORK_PARTS.find((item) => item.code === part.code) ?? PORK_PARTS[0]!;
  const horizonMonths = clamp(Math.round(input.storageDurationMonths ?? 4), 1, 10);
  const horizonDays = horizonMonths * 30;
  const holdingCostPerMonth =
    input.holdingCostPerMonth ?? batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth;
  const storageCostPerTonDay = (holdingCostPerMonth * 1000) / 30;
  const inventoryKg = batch.weightKg;
  const inventoryCost = batch.unitCost;
  const ageCoefficient = calculateAgeDepreciationCoefficient(batch.ageDays);
  const ageAdjustedSpotPrice = round(part.spotPrice * ageCoefficient, 3);

  const domainFullCost = calculatePartFullCost({
    breedingCostPerKg: input.socialBreakevenCost ?? 12,
    slaughterCostPerKg: 0.65,
    splitCostPerKg: 0.42,
    freezeCostPerKg: 0.18,
    storageCostPerTonDay,
    transportCostPerTonKm: input.transportCostPerKmPerTon ?? 0.85,
    annualCapitalRate: 4.2,
    stockDays: horizonDays,
    transportDistanceKm: 180,
    partInventoryValuePerKg: inventoryCost,
    partDailyLossRate: 0.0007,
    yieldRate: partDefinition.yieldRate,
  });

  const accruedHoldingCost = holdingCostPerMonth * horizonMonths;
  const fullCostPerKg = round(Math.max(domainFullCost.totalCostPerKg, inventoryCost + accruedHoldingCost), 3);
  const freshBreakEvenPrice = round(inventoryCost + batch.lossCostPerMonth * Math.max(1, horizonMonths / 2), 3);
  const frozenBreakEvenPrice = round(inventoryCost + accruedHoldingCost + domainFullCost.components.transport, 3);
  const processingCostPerKg = part.category === "A" ? 0.72 : 0.56;
  const processingPremium = part.category === "A" ? 0.55 : 0.85;
  const processingBreakEvenPrice = round(inventoryCost + accruedHoldingCost + processingCostPerKg, 3);

  const frozenExitPrice = round(Math.max(part.frozenPrice, part.futuresMappedPrice), 3);
  const processedExitPrice = round(part.predictedPrice + processingPremium + batch.seasonalAdjustment * 0.35, 3);
  const freshSpreadPerKg = round(ageAdjustedSpotPrice - freshBreakEvenPrice, 3);
  const frozenSpreadPerKg = round(frozenExitPrice - frozenBreakEvenPrice, 3);
  const processingSpreadPerKg = round(processedExitPrice - processingBreakEvenPrice, 3);
  const bestSpread = Math.max(freshSpreadPerKg, frozenSpreadPerKg, processingSpreadPerKg);

  let recommendedLane: PartArbitrageLane = "hold";
  if (bestSpread <= 0.08 && input.hedgeRatio && input.hedgeRatio >= 0.75) recommendedLane = "hedge_only";
  else if (bestSpread === freshSpreadPerKg) recommendedLane = "fresh_sell";
  else if (bestSpread === frozenSpreadPerKg) recommendedLane = "freeze_store";
  else recommendedLane = "deep_process";

  const expectedProfitPerKg = round(Math.max(0, bestSpread), 3);
  const expectedTotalProfit = round(expectedProfitPerKg * inventoryKg, 2);
  const costOfCarryFairPrice = calculateCostOfCarryFairPrice({
    spotPrice: part.spotPrice,
    annualCapitalRate: 4.2,
    dailyStorageRate: holdingCostPerMonth / Math.max(part.spotPrice, 1) / 30,
    dailyLossRate: 0.0007,
    holdingDays: horizonDays,
    convenienceYieldPerKg: part.category === "A" ? 0.12 : 0.05,
  });
  const holdingReturn = calculateRiskAdjustedHoldingReturn({
    expectedFuturePrice: Math.max(frozenExitPrice, processedExitPrice),
    breakEvenPrice: Math.min(frozenBreakEvenPrice, processingBreakEvenPrice),
    inventoryKg,
    inventoryCostPerKg: inventoryCost,
    holdingDays: horizonDays,
    riskFreeAnnualRate: 2.1,
    volatility: Math.abs(part.changeRate) / 100 + 0.16,
  });

  const ageRisk = clamp((batch.ageDays - 45) / 90, 0, 1) * 28;
  const concentrationRisk = clamp((batch.concentration - 55) / 45, 0, 1) * 24;
  const spreadRisk = clamp((0.6 - bestSpread) / 0.6, 0, 1) * 22;
  const volatilityRisk = clamp(Math.abs(part.changeRate) / 8, 0, 1) * 16;
  const durationRisk = clamp((horizonDays - 90) / 180, 0, 1) * 10;
  const riskScore = round(ageRisk + concentrationRisk + spreadRisk + volatilityRisk + durationRisk, 1);
  const riskLevel = pickRiskLevel(riskScore);

  const laneText: Record<PartArbitrageLane, string> = {
    fresh_sell: "鲜销优先：锁定当前高价渠道，快速出清并减少库龄折价。",
    freeze_store: "冻储套利：入库/续储至远月价格或冻品价覆盖全持有成本后释放。",
    deep_process: "深加工套利：将该部位投向加工线，用产品溢价覆盖库存与加工成本。",
    hedge_only: "仅保留套保：现货路径收益不足，保留库存但用期货降低价格暴露。",
    hold: "暂缓操作：价差不足，等待现货、冻品或加工价差重新打开。",
  };

  return {
    partCode: part.code,
    partName: part.name,
    category: part.category,
    batchCode: batch.batchCode,
    inventoryKg,
    ageDays: batch.ageDays,
    ageDepreciationCoefficient: ageCoefficient,
    fullCostPerKg,
    freshBreakEvenPrice,
    frozenBreakEvenPrice,
    processingBreakEvenPrice,
    freshSpreadPerKg,
    frozenSpreadPerKg,
    processingSpreadPerKg,
    costOfCarryFairPrice,
    riskAdjustedHoldingReturnPct: holdingReturn.annualizedReturnPct,
    sharpeRatio: holdingReturn.sharpeRatio,
    recommendedLane,
    recommendedAction: laneText[recommendedLane],
    expectedProfitPerKg,
    expectedTotalProfit,
    riskScore,
    riskLevel,
    drivers: [
      `库龄 ${batch.ageDays} 天，FEFO 折价系数 ${ageCoefficient}`,
      `鲜销/冻储/加工价差分别为 ${freshSpreadPerKg}/${frozenSpreadPerKg}/${processingSpreadPerKg} 元/kg`,
      `部位集中度 ${batch.concentration}%，类别 ${part.category} 决定加工与渠道优先级`,
      `CoC 公允价 ${costOfCarryFairPrice} 元/kg，风险调整年化 ${holdingReturn.annualizedReturnPct}%`,
    ],
    formulaTrace: [
      {
        name: "部位全成本",
        formula: "max(产业链全成本, 库存单位成本 + 月持有成本 × 持有月数)",
        value: fullCostPerKg,
        unit: "元/kg",
      },
      {
        name: "鲜销价差",
        formula: "现货价 × 库龄折价系数 - 鲜销保本价",
        value: freshSpreadPerKg,
        unit: "元/kg",
      },
      {
        name: "冻储价差",
        formula: "max(冻品价, 期货映射价) - 冻储保本价",
        value: frozenSpreadPerKg,
        unit: "元/kg",
      },
      {
        name: "深加工价差",
        formula: "预测价 + 加工溢价 + 季节修正 - 加工保本价",
        value: processingSpreadPerKg,
        unit: "元/kg",
      },
      {
        name: "CoC 公允价",
        formula: "S × exp((资金日费率 + 仓储日费率 + 损耗日费率) × T) - 便利收益",
        value: costOfCarryFairPrice,
        unit: "元/kg",
      },
      {
        name: "风险调整持有收益",
        formula: "(预期售价 - 保本价) / 库存成本 / (T / 365)",
        value: holdingReturn.annualizedReturnPct,
        unit: "%",
      },
    ],
  };
}

function buildPortfolio(params: {
  timeObjective: number;
  spatialObjective: number;
  partObjective: number;
  hedgeObjective: number;
  timeStressLoss: number;
  spatialStressLoss: number;
  partRiskScore: number;
  hedgeStressLoss: number;
  capitalRequired: number;
  maxCapital: number;
  hedgeEffectivenessPct: number;
  riskProfile: RiskProfile;
}) {
  const rawOpportunities = [
    params.timeObjective,
    params.spatialObjective,
    params.partObjective,
    Math.max(0, params.hedgeObjective),
  ];
  const positiveTotal = sumPositive(rawOpportunities);
  const weights = {
    time: positiveTotal > 0 ? round(Math.max(0, params.timeObjective) / positiveTotal, 4) : 0.25,
    spatial: positiveTotal > 0 ? round(Math.max(0, params.spatialObjective) / positiveTotal, 4) : 0.25,
    part: positiveTotal > 0 ? round(Math.max(0, params.partObjective) / positiveTotal, 4) : 0.25,
    financialHedge: positiveTotal > 0 ? round(Math.max(0, params.hedgeObjective) / positiveTotal, 4) : 0.25,
  };
  const diversificationBenefit = round(
    Math.min(
      positiveTotal * 0.08,
      Math.max(0, params.timeStressLoss + params.spatialStressLoss + params.hedgeStressLoss) * 0.18,
    ),
  );
  const stressLoss =
    params.timeStressLoss * 0.55 +
    params.spatialStressLoss * 0.6 +
    params.hedgeStressLoss * 0.45 +
    params.partRiskScore * 80;
  const penaltyConfig = buildPenaltyConfig(params.riskProfile);
  const penalty = calculatePenaltyBreakdown({
    volatilityRisk: stressLoss * 0.16,
    basisRisk: Math.abs(params.hedgeObjective) * 0.04,
    spreadRisk: Math.abs(params.spatialObjective) * 0.03,
    maxDrawdownProxy: stressLoss * 0.35,
    stressLoss,
    marginUsed: params.capitalRequired * 0.12,
    peakCapitalOccupied: params.capitalRequired,
    leverageRatio: params.capitalRequired / Math.max(params.maxCapital, 1),
    liquidityRisk: params.partRiskScore * 4,
    executionComplexity: 32 + params.partRiskScore / 5,
    config: penaltyConfig,
  });
  const standaloneOpportunitySum = round(params.timeObjective + params.spatialObjective + params.partObjective + params.hedgeObjective);
  const adjustedPortfolioObjective = round(
    standaloneOpportunitySum +
      diversificationBenefit -
      penalty.riskPenalty -
      penalty.capitalPenalty -
      penalty.executionPenalty,
  );
  const returnOnCapital = (adjustedPortfolioObjective / Math.max(params.capitalRequired, 1)) * 100;
  const returnOnMargin = (params.hedgeObjective / Math.max(params.capitalRequired * 0.12, 1)) * 100;
  const scoreCard = calculateScoreCard({
    netPnL: standaloneOpportunitySum,
    adjustedObjective: adjustedPortfolioObjective,
    stressLoss,
    hedgeEffectiveness: params.hedgeEffectivenessPct / 100,
    returnOnCapital,
    returnOnMargin,
    executionPenalty: penalty.executionPenalty,
    riskPenalty: penalty.riskPenalty,
  });
  const constraints = [
    buildConstraintCheck("portfolio_capital_budget", params.capitalRequired, params.maxCapital, penaltyConfig.capitalOccupancyPenaltyWeight),
    buildConstraintCheck("risk_budget_score", params.partRiskScore, params.riskProfile === "conservative" ? 55 : 72, penaltyConfig.riskPenaltyWeight),
    buildConstraintCheck("hedge_effectiveness_floor", 65, params.hedgeEffectivenessPct, penaltyConfig.basisPenaltyWeight),
  ];
  const riskBudgetUsedPct = round((stressLoss / Math.max(Math.abs(standaloneOpportunitySum) + stressLoss, 1)) * 100, 1);
  let recommendedMode: ProfessionalArbitrageResult["portfolio"]["recommendedMode"] = "wait";
  if (adjustedPortfolioObjective > 0 && scoreCard.overallScore >= 70) recommendedMode = "offensive_combo";
  else if (adjustedPortfolioObjective > 0 && scoreCard.overallScore >= 48) recommendedMode = "balanced_combo";
  else if (params.hedgeEffectivenessPct >= 55) recommendedMode = "defensive_hedge";

  return {
    recommendedMode,
    standaloneOpportunitySum,
    adjustedPortfolioObjective,
    diversificationBenefit,
    capitalRequired: round(params.capitalRequired),
    riskBudgetUsedPct,
    weights,
    scoreCard,
    constraints,
  };
}

export function simulateProfessionalArbitrage(input: ProfessionalArbitrageInput = {}): ProfessionalArbitrageResult {
  const riskProfile = input.riskProfile ?? "balanced";
  const storageTons = input.storageTons ?? input.physicalExposureTons ?? 1000;
  const spotPrice = input.spotPrice ?? Math.min(liveHogBenchmarkPrice(), 9.6);
  const socialBreakevenCost = input.socialBreakevenCost ?? 12;
  const holdingCostPerMonth = input.holdingCostPerMonth ?? 0.2;
  const storageDurationMonths = clamp(Math.round(input.storageDurationMonths ?? 6), 1, 10);
  const startMonth = clamp(Math.round(input.startMonth ?? 4), 1, 12);
  const hedgeRatio = clamp(input.hedgeRatio ?? defaultHedgeRatio(riskProfile), 0, 1);

  const part = buildPartArbitrage({
    ...input,
    socialBreakevenCost,
    holdingCostPerMonth,
    storageDurationMonths,
  });

  const timeArbitrage = calculateArbitrage(
    spotPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
    storageDurationMonths,
  );

  const spatialArbitrage = calculateSpatialArbitrage({
    transportCostPerKmPerTon: input.transportCostPerKmPerTon ?? 0.85,
    minProfitThreshold: input.minProfitThreshold ?? 0.35,
    batchSizeTon: Math.min(Math.max(input.targetShipmentTon ?? storageTons * 0.35, 50), 5000),
    originFilter: input.originFilter ?? "all",
    partCode: part.partCode,
    vehiclePreference: "auto",
    targetShipmentTon: input.targetShipmentTon ?? Math.min(storageTons, 8000),
    strategyMode: part.recommendedLane === "deep_process" ? "deep_processing" : part.recommendedLane === "fresh_sell" ? "fresh_first" : "balanced",
    timeStoragePolicy: timeArbitrage.maxProfit > 0 ? "auto" : "off",
    planningDays: 7,
    holdingCostPerMonth,
    socialBreakevenCost,
    startMonth,
    storageDurationMonths,
  });

  const exposureTons = input.physicalExposureTons ?? Math.max(storageTons, part.inventoryKg / 1000);
  const expectedFutureSpotPrice =
    input.expectedFutureSpotPrice ??
    timeArbitrage.futurePriceCurve[Math.max(0, timeArbitrage.months.indexOf(timeArbitrage.maxProfitMonth))] ??
    spotPrice + 1.2;
  const futuresPrice = input.futuresPrice ?? Math.max(spotPrice + 0.75, expectedFutureSpotPrice - 0.35);
  const expectedFutureFuturesPrice = input.expectedFutureFuturesPrice ?? expectedFutureSpotPrice - 0.18;
  const marginRate = input.marginRate ?? 0.12;
  const contractSize = input.contractSize ?? 16;
  const maxCapital =
    input.maxCapital ??
    Math.max(exposureTons * spotPrice * 1000 * 1.35, storageTons * socialBreakevenCost * 1000 * 0.95, 1);
  const financialArbitrage = simulateFinancialArbitrage({
    spotPrice,
    futuresPrice,
    expectedFutureSpotPrice,
    expectedFutureFuturesPrice,
    physicalExposureTons: exposureTons,
    hedgeRatio,
    marginRate,
    contractSize,
    holdingDays: storageDurationMonths * 30,
    storageCostPerTonDay: (holdingCostPerMonth * 1000) / 30,
    financingRatePct: 4.2,
    transactionCostPerTon: 18,
    slippagePerKg: 0.03,
    deliveryCostPerTon: 35,
    expectedBasisConvergence: 0,
    maxCapital,
    maxMarginUsage: input.maxMarginUsage ?? maxCapital * 0.22,
    riskProfile,
  });

  const timeObjective = timeArbitrage.analytics.adjustedNetProfit;
  const spatialObjective = spatialArbitrage.analytics.adjustedObjective;
  const partObjective = part.expectedTotalProfit;
  const hedgeObjective = financialArbitrage.adjustedObjective;
  const capitalRequired =
    financialArbitrage.capitalUsage +
    storageTons * spotPrice * 1000 * 0.18 +
    spatialArbitrage.scheduleSummary.totalFreight +
    part.inventoryKg * part.fullCostPerKg * 0.12;
  const portfolio = buildPortfolio({
    timeObjective,
    spatialObjective,
    partObjective,
    hedgeObjective,
    timeStressLoss: timeArbitrage.analytics.stressLoss,
    spatialStressLoss: spatialArbitrage.analytics.riskPenalty,
    partRiskScore: part.riskScore,
    hedgeStressLoss: financialArbitrage.worstCaseLoss,
    capitalRequired,
    maxCapital,
    hedgeEffectivenessPct: financialArbitrage.hedgeEffectiveness,
    riskProfile,
  });

  const hedgeAction =
    portfolio.recommendedMode === "wait"
      ? "wait"
      : part.riskLevel === "高" || financialArbitrage.adjustedObjective < 0
        ? "reduce_exposure"
        : hedgeRatio > 0.05
          ? "short_futures"
          : "cash_only";

  return {
    inputSummary: {
      partCode: part.partCode,
      batchCode: part.batchCode,
      riskProfile,
      strategyHorizonDays: storageDurationMonths * 30,
      exposureTons: round(exposureTons, 1),
    },
    timeArbitrage,
    spatialArbitrage,
    partArbitrage: part,
    financialArbitrage,
    portfolio,
    hedgeDecision: {
      action: hedgeAction,
      exposureTons: round(exposureTons, 1),
      hedgeRatio: round(hedgeRatio, 3),
      contractsNeeded: financialArbitrage.contractsNeeded,
      marginRequired: financialArbitrage.totalMargin,
      hedgeEffectivenessPct: financialArbitrage.hedgeEffectiveness,
      basisNow: financialArbitrage.basisNow,
      breakEvenBasis: financialArbitrage.breakEvenBasis,
      stopLossRule: "当基差较入场扩大 0.45 元/kg、保证金占用超过预算 85% 或组合分数跌破 45 时，减仓 30%-50%。",
      rebalanceRule: "每日收盘后按现货库存、期货 Delta、库龄和路线执行量重算；套保偏离目标 ±8pct 时再平衡。",
    },
    operationPlaybook: [
      {
        step: 1,
        owner: "strategy",
        action: "生成四类套利联合评分，确认组合模式与风险预算。",
        trigger: `组合分数 ${portfolio.scoreCard.overallScore}，目标值 ${portfolio.adjustedPortfolioObjective} 元`,
        output: "组合权重、风险限额和审批等级",
      },
      {
        step: 2,
        owner: "procurement",
        action: "按时间套利窗口锁定低价货源和可冻储批次。",
        trigger: `最大时间价差 ${timeArbitrage.maxProfit} 元/kg，最佳释放月 ${timeArbitrage.maxProfitMonth}`,
        output: "采购锁量单、入库计划和价格保护条款",
      },
      {
        step: 3,
        owner: "logistics",
        action: "执行空间套利路线调拨，优先使用正价差且有需求约束的线路。",
        trigger: `最优路线 ${spatialArbitrage.bestRouteName}，均值净利 ${spatialArbitrage.scheduleSummary.averageNetProfitPerKg} 元/kg`,
        output: "冷链车次、线路派车单和在途温控要求",
      },
      {
        step: 4,
        owner: "warehouse",
        action: "按 FEFO 和库龄折价管理库存，分配鲜销、冻储、深加工通道。",
        trigger: part.recommendedAction,
        output: "批次出入库、库龄预警和加工投料单",
      },
      {
        step: 5,
        owner: "risk",
        action: "同步执行期货卖出套保或减仓，监控基差、保证金和压力损失。",
        trigger: `套保比例 ${round(hedgeRatio * 100, 1)}%，合约 ${financialArbitrage.contractsNeeded} 手`,
        output: "套保指令、止损线和追加保证金预案",
      },
      {
        step: 6,
        owner: "finance",
        action: "对资金占用、毛利、费用和保证金进行日清日结。",
        trigger: `资金占用 ${round(capitalRequired)} 元，风险预算使用 ${portfolio.riskBudgetUsedPct}%`,
        output: "利润归因、资金日报和异常审批记录",
      },
    ],
    riskControlMatrix: [
      {
        risk: "价格曲线走平",
        metric: "远月升水 - CoC 持有成本",
        threshold: "< 0.25 元/kg",
        action: "暂停新增冻储，优先鲜销或降低采购节奏。",
      },
      {
        risk: "基差恶化",
        metric: "现货价 - 期货价",
        threshold: "较入场扩大 0.45 元/kg",
        action: "减仓期货 30%-50%，同步锁定现货销售合同。",
      },
      {
        risk: "库龄与品质折价",
        metric: "批次库龄 / FEFO 系数",
        threshold: "库龄 > 90 天或折价系数 < 0.95",
        action: "强制进入销售或深加工通道，不再新增持有周期。",
      },
      {
        risk: "物流价差收敛",
        metric: "目的地价差 - 冷链全成本",
        threshold: "< 最低利润阈值",
        action: "停止发车，改为区域内销售或等待销地价格恢复。",
      },
      {
        risk: "资金与保证金压力",
        metric: "保证金占预算、组合资金占用",
        threshold: "> 85%",
        action: "触发 CFO/风控审批，降低套保手数或释放库存回款。",
      },
    ],
    auditTrail: [
      {
        module: "时间套利",
        formula: "价差 = 远月预测价 - (现货价 + 月持有成本 × 持有月数)",
        result: `最大价差 ${timeArbitrage.maxProfit} 元/kg，风险调整收益 ${timeArbitrage.analytics.adjustedNetProfit} 元`,
      },
      {
        module: "空间套利",
        formula: "路线净利 = 目的地价格 - 产地价格 - 冷链运费 - 执行/风险惩罚",
        result: `最优路线 ${spatialArbitrage.bestRouteName}，调度净利 ${spatialArbitrage.scheduleSummary.totalNetProfit} 万元`,
      },
      {
        module: "部位套利",
        formula: "最优通道 = argmax(鲜销价差, 冻储价差, 深加工价差)",
        result: `${part.partName} 推荐 ${part.recommendedLane}，预期利润 ${part.expectedTotalProfit} 元`,
      },
      {
        module: "金融套利与对冲",
        formula: "套保 PnL = 现货 PnL + 期货 PnL + 基差收敛 PnL - 持有/交易/交割成本",
        result: `套保 ${financialArbitrage.contractsNeeded} 手，目标值 ${financialArbitrage.adjustedObjective} 元`,
      },
      {
        module: "组合决策",
        formula: "组合目标 = 单项机会和 + 分散化收益 - 风险惩罚 - 资金惩罚 - 执行惩罚",
        result: `${portfolio.recommendedMode}，组合目标值 ${portfolio.adjustedPortfolioObjective} 元`,
      },
    ],
  };
}
