import {
  buildConstraintCheck,
  buildPenaltyConfig,
  calculatePenaltyBreakdown,
  calculateScoreCard,
  type PenaltyConfig,
  type RiskProfile,
  type UnifiedStrategyResult,
} from "./arbitrageShared";
import {
  calculateCostOfCarryFairPrice,
  calculateRiskAdjustedHoldingReturn,
} from "./porkIndustryModel";

/**
 * 时间套利计算引擎 v2（按 CP 集团业务图示规则实现）
 *
 * 核心公式：
 *   持有成本(m) = 毛猪价 + 储存费 × (m - startMonth)
 *   价差(m)    = 未来生猪期货预测价(m) - 持有成本(m)
 *   收储信号    = 持有成本(m) < 未来生猪期货预测价(m)  且  持有成本(m) < 社会养殖成本
 *
 * 预期未来价不再由用户输入，而是由生猪期货价格预测模型自动生成：
 * 从 startMonth 的现货价出发，逐月自然上扬，最终在年末接近/突破社会养殖成本 12 元/kg，
 * 在图示中对应 4月9.0、5月9.1、6月9.7、7月10.3、8月11.0、9月11.7、10月11.9、11月12.2、12月12.6。
 */

export type MonthProfit = {
  month: number;
  /** 该月持有成本（毛猪价 + 累计储存费） */
  holdingCost: number;
  /** 该月未来预期售价（期货预测） */
  futurePrice: number;
  /** 价差（元/kg） = futurePrice - holdingCost */
  priceGap: number;
  /** 若该月出货总利润（万元） */
  totalProfit: number;
  /** 当月是否触发收储信号 */
  shouldArbitrage: boolean;
};

export type TimeArbitrageResult = {
  currentSpotPrice: number;
  socialBreakevenCost: number;
  monthlyStorageFee: number;
  storageTons: number;
  startMonth: number;
  storageDurationMonths: number;
  /** 月份列表（收储起始月到起始月+storageDurationMonths-1） */
  months: number[];
  /** 持有成本曲线（毛猪价 + 储存费×月数） */
  costCurve: number[];
  /** 生猪期货预测价曲线 */
  futurePriceCurve: number[];
  /** 社会养殖成本水平线 */
  socialCostLine: number[];
  /** 每月价差（元/kg） */
  profitSpace: number[];
  /** CoC 持有成本模型公允价（部位级期货隐含价的简化曲线） */
  costOfCarryFairPriceCurve: number[];
  /** 风险调整后年化收益率（%） */
  riskAdjustedReturnCurve: number[];
  profits: MonthProfit[];
  /** 有效套利窗口的起止月 */
  arbitrageWindow: { startMonth: number; endMonth: number } | null;
  /** 最佳出货月 */
  maxProfitMonth: number;
  maxProfit: number;
  maxTotalProfit: number;
  /** 保本点预计月（future ≈ social） */
  breakEvenMonth: number | null;
  /** 历史月份列表（收储开始前 3 个月） */
  historyMonths: number[];
  /** 历史持有成本线（实际上是当月现货价，尚无储存费） */
  historyCostCurve: number[];
  /** 历史期货预测价曲线 */
  historyFuturePriceCurve: number[];
  /** 历史社会养殖成本 */
  historySocialCostLine: number[];
  /** 历史利润空间（用 null 标记，前端不画柱子） */
  historyProfitSpace: (number | null)[];
  optimizationPlan: {
    stages: CapacityStageInput[];
    monthlyAllocations: TimeOptimizationAllocation[];
    summary: TimeOptimizationSummary;
  };
  analytics: {
    grossProfit: number;
    financingCost: number;
    rollCost: number;
    capitalOccupancyCost: number;
    adjustedNetProfit: number;
    annualizedReturnPct: number;
    unitCapitalReturnPct: number;
    carryCoverageRatio: number;
    stressLoss: number;
    penalties: {
      riskPenalty: number;
      capitalPenalty: number;
      executionPenalty: number;
    };
    scoreCard: UnifiedStrategyResult["scoreCard"];
    constraints: UnifiedStrategyResult["constraints"];
    unifiedResult: UnifiedStrategyResult;
  };
};


export type ArbitrageContext = {
  result: TimeArbitrageResult;
  assumptions: {
    spotPrice: number;
    socialBreakevenCost: number;
    holdingCostPerMonth: number;
    storageTons: number;
    startMonth: number;
    storageDurationMonths: number;
  };
};

export type CapacityStageInput = {
  stage: "breeding" | "slaughter" | "cutting" | "freezing" | "storage" | "deepProcessing" | "sales";
  actualCapacity: number;
  targetCapacity: number;
  unit: "head/day" | "ton/day" | "ton/month";
  unitCost: number;
  enabled: boolean;
};

export type TimeArbitrageOptimizationInput = {
  breedingHeadsPerDay?: number;
  slaughterHeadsPerDay?: number;
  cuttingHeadsPerDay?: number;
  freezingTonsPerDay?: number;
  storageTonsCapacity?: number;
  deepProcessingTonsPerDay?: number;
  salesTonsPerDay?: number;
  breedingCostPerHead?: number;
  slaughterCostPerHead?: number;
  cuttingCostPerHead?: number;
  freezingCostPerTon?: number;
  storageCostPerTonMonth?: number;
  deepProcessingCostPerTon?: number;
  salesCostPerTon?: number;
};

export type TimeOptimizationAllocation = {
  month: number;
  breedingHeads: number;
  slaughterHeads: number;
  cuttingHeads: number;
  freezingTons: number;
  storageTons: number;
  deepProcessingTons: number;
  salesTons: number;
  releasedTons: number;
  utilization: Record<string, number>;
};

export type TimeOptimizationSummary = {
  recommendedStorageTons: number;
  recommendedReleaseMonth: number;
  constrainedBy: string[];
  averageUtilization: number;
  serviceLevel: number;
  totalOperatingCost: number;
  throughputScore: number;
};


function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function roundInt(value: number) {
  return Math.max(0, Math.round(value));
}

function buildDefaultCapacityStages(storageTons: number, optimization?: TimeArbitrageOptimizationInput): CapacityStageInput[] {
  const monthlyStorageCapacity = optimization?.storageTonsCapacity ?? Math.max(storageTons * 1.35, 1200);
  const dailySalesCapacity = optimization?.salesTonsPerDay ?? Math.max(storageTons / 6, 180);
  return [
    { stage: "breeding", actualCapacity: optimization?.breedingHeadsPerDay ?? 40000, targetCapacity: 40000, unit: "head/day", unitCost: optimization?.breedingCostPerHead ?? 0.18, enabled: true },
    { stage: "slaughter", actualCapacity: optimization?.slaughterHeadsPerDay ?? 22000, targetCapacity: 40000, unit: "head/day", unitCost: optimization?.slaughterCostPerHead ?? 0.42, enabled: true },
    { stage: "cutting", actualCapacity: optimization?.cuttingHeadsPerDay ?? 9000, targetCapacity: 40000, unit: "head/day", unitCost: optimization?.cuttingCostPerHead ?? 0.33, enabled: true },
    { stage: "freezing", actualCapacity: optimization?.freezingTonsPerDay ?? 520, targetCapacity: 760, unit: "ton/day", unitCost: optimization?.freezingCostPerTon ?? 86, enabled: true },
    { stage: "storage", actualCapacity: monthlyStorageCapacity, targetCapacity: Math.max(monthlyStorageCapacity, storageTons), unit: "ton/month", unitCost: optimization?.storageCostPerTonMonth ?? 42, enabled: true },
    { stage: "deepProcessing", actualCapacity: optimization?.deepProcessingTonsPerDay ?? 210, targetCapacity: 320, unit: "ton/day", unitCost: optimization?.deepProcessingCostPerTon ?? 120, enabled: true },
    { stage: "sales", actualCapacity: dailySalesCapacity, targetCapacity: Math.max(dailySalesCapacity, storageTons / 4), unit: "ton/day", unitCost: optimization?.salesCostPerTon ?? 35, enabled: true },
  ];
}

function buildTimeOptimizationPlan(params: {
  storageTons: number;
  months: number[];
  profits: MonthProfit[];
  storageDurationMonths: number;
  optimization?: TimeArbitrageOptimizationInput;
}): TimeArbitrageResult["optimizationPlan"] {
  const { storageTons, months, profits, storageDurationMonths, optimization } = params;
  const stages = buildDefaultCapacityStages(storageTons, optimization);
  const breeding = stages.find(stage => stage.stage === "breeding")!;
  const slaughter = stages.find(stage => stage.stage === "slaughter")!;
  const cutting = stages.find(stage => stage.stage === "cutting")!;
  const freezing = stages.find(stage => stage.stage === "freezing")!;
  const storage = stages.find(stage => stage.stage === "storage")!;
  const deepProcessing = stages.find(stage => stage.stage === "deepProcessing")!;
  const sales = stages.find(stage => stage.stage === "sales")!;

  const breedingCapM = breeding.actualCapacity * 30;
  const slaughterCapM = slaughter.actualCapacity * 30;
  const cuttingCapM = cutting.actualCapacity * 30;
  const freezingCapM = freezing.actualCapacity * 30;
  const salesCapM = sales.actualCapacity * 30;
  const deepProcCapM = deepProcessing.actualCapacity * 30;

  const numMonths = months.length;
  // 找到最佳释储月份（最大利润月）
  let bestMonthIndex = 0;
  let maxTotalProfit = -Infinity;
  profits.forEach((p, idx) => {
    if (p.totalProfit > maxTotalProfit) {
      maxTotalProfit = p.totalProfit;
      bestMonthIndex = idx;
    }
  });

  const allocations = Array.from({ length: numMonths }, (_, idx) => ({
    month: months[idx]!,
    breedingHeads: 0,
    slaughterHeads: 0,
    cuttingHeads: 0,
    freezingTons: 0,
    storageTons: 0,
    deepProcessingTons: 0,
    salesTons: 0,
    releasedTons: 0,
    utilization: {
      breeding: 0, slaughter: 0, cutting: 0, freezing: 0, storage: 0, deepProcessing: 0, sales: 0
    }
  }));

  // 拉动式出库阶段：从最佳出货月开始，尽可能将目标 storageTons 释放
  let toRelease = storageTons;
  for (let i = bestMonthIndex; i < numMonths && toRelease > 0; i++) {
    let releaseHere = Math.min(toRelease, salesCapM + deepProcCapM);
    let dps = Math.min(releaseHere * 0.35, deepProcCapM);
    let sls = Math.min(releaseHere - dps, salesCapM);
    
    // 如果因比例导致销售额度溢出，重平衡
    if (releaseHere - sls > deepProcCapM) {
        dps = deepProcCapM;
        sls = Math.min(releaseHere - dps, salesCapM);
    } else {
        dps = releaseHere - sls;
    }

    allocations[i]!.salesTons = sls;
    allocations[i]!.deepProcessingTons = dps;
    allocations[i]!.releasedTons = sls + dps;
    toRelease -= (sls + dps);
  }

  // 拉动式生产阶段：为满足释放，通过逆向（从利润峰值月向前推）尽晚生产以降低持仓费用
  let toProduce = storageTons - toRelease; // 只能生产即将被释放出来的量（真实贯通）
  const actualTarget = toProduce;
  for (let i = bestMonthIndex; i >= 0 && toProduce > 0; i--) {
     // 78公斤 = 0.078吨 / 每头猪的产能转换率
     const maxHeads = Math.min(breedingCapM, slaughterCapM, cuttingCapM);
     const maxTonsFromHeads = maxHeads * 0.078;
     const maxTonsCanProduce = Math.min(maxTonsFromHeads, freezingCapM);

     let prodHere = Math.min(toProduce, maxTonsCanProduce);
     
     allocations[i]!.freezingTons = prodHere;
     let headsNeeded = Math.ceil(prodHere / 0.078);
     allocations[i]!.breedingHeads = headsNeeded;
     allocations[i]!.slaughterHeads = headsNeeded;
     allocations[i]!.cuttingHeads = headsNeeded;

     toProduce -= prodHere;
  }

  // 结算库存及报表与成本
  let currentInventory = 0;
  let totalOperatingCost = 0;
  let utilizationAccumulator = 0;
  let throughputAccumulator = 0;

  allocations.forEach(alloc => {
     currentInventory += alloc.freezingTons;
     currentInventory -= alloc.releasedTons;
     alloc.storageTons = Math.max(0, currentInventory);

     alloc.utilization.breeding = round((alloc.breedingHeads / Math.max(1, breedingCapM)) * 100);
     alloc.utilization.slaughter = round((alloc.slaughterHeads / Math.max(1, slaughterCapM)) * 100);
     alloc.utilization.cutting = round((alloc.cuttingHeads / Math.max(1, cuttingCapM)) * 100);
     alloc.utilization.freezing = round((alloc.freezingTons / Math.max(1, freezingCapM)) * 100);
     alloc.utilization.storage = round((alloc.storageTons / Math.max(1, storage.actualCapacity)) * 100);
     alloc.utilization.deepProcessing = round((alloc.deepProcessingTons / Math.max(1, deepProcCapM)) * 100);
     alloc.utilization.sales = round((alloc.salesTons / Math.max(1, salesCapM)) * 100);

     utilizationAccumulator += Object.values(alloc.utilization).reduce((sum, value) => sum + value, 0) / 7;
     throughputAccumulator += alloc.releasedTons;

     totalOperatingCost +=
      alloc.breedingHeads * breeding.unitCost +
      alloc.slaughterHeads * slaughter.unitCost +
      alloc.cuttingHeads * cutting.unitCost +
      alloc.freezingTons * freezing.unitCost +
      alloc.storageTons * storage.unitCost +
      alloc.deepProcessingTons * deepProcessing.unitCost +
      alloc.salesTons * sales.unitCost;
  });

  const constrainedBy = stages
    .filter(stage => {
      const key = stage.stage === "deepProcessing" ? "deepProcessing" : stage.stage;
      return allocations.some(item => (item.utilization[key as keyof typeof item.utilization] ?? 0) >= 92);
    })
    .map(stage => stage.stage);

  return {
    stages,
    monthlyAllocations: allocations,
    summary: {
      recommendedStorageTons: round(actualTarget),
      recommendedReleaseMonth: months[bestMonthIndex]!,
      constrainedBy,
      averageUtilization: round(utilizationAccumulator / Math.max(1, allocations.length)),
      serviceLevel: round((throughputAccumulator / Math.max(storageTons, 1)) * 100),
      totalOperatingCost: round(totalOperatingCost, 0),
      throughputScore: round((throughputAccumulator / Math.max(1, storageTons)) * 100),
    },
  };
}

/**
 * 生猪期货预测价曲线（按图示规则，使用分段线性拟合）。
 *
 * 与用户选择的 startMonth 无关：生猪期货曲线是市场客观预测，年度内走势固定形状，
 * 仅用 spotPrice 作为起点、socialBreakevenCost 作为收敛点对图示模板进行缩放。
 *
 * 图示参考点（起点9.0，保本点12.0，末点12.6）：
 * offset 0:  1.000 * spot        (9.0)
 * offset 1:  spot + 0.11 * gap
 * offset 2:  spot + 0.23 * gap
 * offset 3:  spot + 0.43 * gap
 * offset 4:  spot + 0.67 * gap
 * offset 5:  spot + 0.90 * gap   (≈保本)
 * offset 6:  spot + gap + 0.05   (刚超保本)
 * offset 7:  spot + gap + 0.20
 * offset 8:  spot + gap + 0.60
 * offset 9:  spot + gap + 1.00
 */
function futuresPriceAtOffset(spot: number, social: number, offset: number): number {
  const gap = social - spot;

  // 负 offset：历史价格逆推（低位震荡，确定性模式）
  // offset -3 → 现货价的 92%，offset -2 → 94%，offset -1 → 97%
  if (offset < 0) {
    const historyRatios: Record<number, number> = {
      [-3]: 0.92,
      [-2]: 0.94,
      [-1]: 0.97,
    };
    const ratio = historyRatios[offset] ?? 0.95;
    return parseFloat((spot * ratio).toFixed(2));
  }

  // 正 offset：分段线性拟合图示
  const anchors: Record<number, number> = {
    0: spot,
    1: spot + 0.1 * gap,
    2: spot + 0.23 * gap,
    3: spot + 0.43 * gap,
    4: spot + 0.67 * gap,
    5: spot + 0.9 * gap,
    6: social,
    7: social + 0.2,
    8: social + 0.4,
    9: social + 0.6,
    10: social + 0.8,
    11: social + 1.0,
  };
  const o = Math.max(0, Math.min(11, Math.round(offset)));
  return parseFloat((anchors[o] ?? spot).toFixed(2));
}

/**
 * 计算时间套利结果
 *
 * @param spotPrice 当前毛猪价（元/kg）
 * @param socialBreakevenCost 社会养殖成本（元/kg，默认 12）
 * @param holdingCostPerMonth 储存费（元/kg/月，默认 0.2）
 * @param storageTons 收储量（吨，默认 1000）
 * @param startMonth 收储起始月（1-12，默认 4）
 * @param storageDurationMonths 收储时长（1-10 月，默认 6）
 */
export function calculateArbitrage(
  spotPrice: number,
  holdingCostPerMonth: number = 0.2,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
  storageDurationMonths: number = 6,
  optimization?: TimeArbitrageOptimizationInput,
): TimeArbitrageResult {
  const duration = Math.max(1, Math.min(10, Math.round(storageDurationMonths)));

  // ── 历史数据（收储前 3 个月） ──
  const HISTORY_MONTHS = 3;
  const historyMonths: number[] = [];
  const historyCostCurve: number[] = [];
  const historyFuturePriceCurve: number[] = [];
  const historySocialCostLine: number[] = [];
  const historyProfitSpace: (number | null)[] = [];

  for (let h = -HISTORY_MONTHS; h < 0; h++) {
    // 月份回退（支持跨年，如 startMonth=1 时 h=-1 → 12月）
    const displayMonth = ((startMonth - 1 + h + 120) % 12) + 1;
    historyMonths.push(displayMonth);

    // 历史的现货价（低位震荡）
    const historySpot = futuresPriceAtOffset(spotPrice, socialBreakevenCost, h);
    historyCostCurve.push(historySpot);

    // 历史期货预测价：比历史现货稍高（市场升水），但仍低于社会养殖成本
    const histFutureSpread = 0.15 + Math.abs(h) * 0.08;
    const histFuture = parseFloat((historySpot + histFutureSpread).toFixed(2));
    historyFuturePriceCurve.push(histFuture);

    historySocialCostLine.push(socialBreakevenCost);
    // 历史月无收储操作，利润空间标记为 null（前端不画柱子）
    historyProfitSpace.push(null);
  }

  // ── 收储期数据（原有逻辑） ──
  const months: number[] = [];
  const costCurve: number[] = [];
  const futurePriceCurve: number[] = [];
  const socialCostLine: number[] = [];
  const profitSpace: number[] = [];
  const costOfCarryFairPriceCurve: number[] = [];
  const riskAdjustedReturnCurve: number[] = [];
  const profits: MonthProfit[] = [];

  let maxProfit = -Infinity;
  let maxProfitMonth = startMonth;
  let maxTotalProfit = 0;
  let arbitrageWindowStart: number | null = null;
  let arbitrageWindowEnd: number | null = null;
  let breakEvenMonth: number | null = null;

  for (let i = 0; i < duration; i++) {
    const displayMonth = ((startMonth - 1 + i) % 12) + 1;
    months.push(displayMonth);

    const holdingCost = parseFloat((spotPrice + holdingCostPerMonth * i).toFixed(2));
    costCurve.push(holdingCost);

    const futurePrice = futuresPriceAtOffset(spotPrice, socialBreakevenCost, i);
    futurePriceCurve.push(futurePrice);
    const holdingDays = i * 30;
    const dailyStorageRate = holdingCostPerMonth / Math.max(spotPrice, 1) / 30;
    const fairPrice = calculateCostOfCarryFairPrice({
      spotPrice,
      annualCapitalRate: 4.2,
      dailyStorageRate,
      dailyLossRate: 0.0007,
      holdingDays,
      convenienceYieldPerKg: 0,
    });
    costOfCarryFairPriceCurve.push(fairPrice);

    socialCostLine.push(socialBreakevenCost);

    const priceGap = parseFloat((futurePrice - holdingCost).toFixed(2));
    profitSpace.push(priceGap);

    const shouldArbitrage = priceGap > 0 && holdingCost < socialBreakevenCost;
    const totalProfit = parseFloat(((priceGap * storageTons * 1000) / 10000).toFixed(1));
    const riskAdjusted = calculateRiskAdjustedHoldingReturn({
      expectedFuturePrice: futurePrice,
      breakEvenPrice: holdingCost,
      inventoryKg: storageTons * 1000,
      inventoryCostPerKg: Math.max(spotPrice, 1),
      holdingDays: Math.max(1, holdingDays),
      riskFreeAnnualRate: 2.1,
      volatility: 0.18,
    });
    riskAdjustedReturnCurve.push(riskAdjusted.annualizedReturnPct);

    if (priceGap > maxProfit) {
      maxProfit = priceGap;
      maxProfitMonth = displayMonth;
      maxTotalProfit = totalProfit;
    }

    if (shouldArbitrage) {
      if (arbitrageWindowStart === null) arbitrageWindowStart = displayMonth;
      arbitrageWindowEnd = displayMonth;
    }

    if (breakEvenMonth === null && futurePrice >= socialBreakevenCost) {
      breakEvenMonth = displayMonth;
    }

    profits.push({
      month: displayMonth,
      holdingCost,
      futurePrice,
      priceGap,
      totalProfit,
      shouldArbitrage,
    });
  }

  const optimizationPlan = buildTimeOptimizationPlan({
    storageTons,
    months,
    profits,
    storageDurationMonths: duration,
    optimization,
  });

  const financingCost = round(spotPrice * storageTons * 1000 * 0.042 * (duration * 30 / 365), 0);
  const rollCost = round(storageTons * 18 * Math.max(0, duration - 1), 0);
  const capitalOccupancyCost = round(storageTons * spotPrice * 1000 * 0.006 * duration, 0);
  const grossProfit = round(maxTotalProfit * 10000, 0);
  const peakInventory = Math.max(...optimizationPlan.monthlyAllocations.map((item) => item.storageTons), 0);
  const penaltyConfig = buildPenaltyConfig("balanced");
  const stressLoss = round(Math.max(0, grossProfit * 0.18 + financingCost * 0.4 + capitalOccupancyCost * 0.35), 0);
  const penaltyBreakdown = calculatePenaltyBreakdown({
    volatilityRisk: Math.abs(maxProfit) * storageTons * 90,
    basisRisk: Math.abs((futurePriceCurve[futurePriceCurve.length - 1] ?? spotPrice) - socialBreakevenCost) * storageTons * 55,
    spreadRisk: Math.abs((futurePriceCurve[0] ?? spotPrice) - (futurePriceCurve[futurePriceCurve.length - 1] ?? spotPrice)) * storageTons * 45,
    maxDrawdownProxy: Math.abs(maxTotalProfit * 10000) * 0.2,
    stressLoss,
    marginUsed: 0,
    peakCapitalOccupied: spotPrice * storageTons * 1000 + capitalOccupancyCost,
    leverageRatio: (spotPrice * storageTons * 1000 + capitalOccupancyCost) / Math.max(spotPrice * storageTons * 1000, 1),
    liquidityRisk: storageTons * 4,
    executionComplexity: optimizationPlan.summary.constrainedBy.length * 8 + duration * 2,
    config: penaltyConfig,
  });

  const constraints = [
    buildConstraintCheck("storage_capacity", peakInventory, optimizationPlan.summary.recommendedStorageTons * 1.05 || storageTons, penaltyConfig.executionPenaltyWeight),
    buildConstraintCheck("service_level", 100 - optimizationPlan.summary.serviceLevel, 15, penaltyConfig.executionPenaltyWeight),
    buildConstraintCheck("average_utilization", optimizationPlan.summary.averageUtilization, 92, penaltyConfig.executionPenaltyWeight * 1.2),
  ];

  const adjustedNetProfit = round(
    grossProfit - financingCost - rollCost - capitalOccupancyCost - penaltyBreakdown.riskPenalty - penaltyBreakdown.capitalPenalty - penaltyBreakdown.executionPenalty,
    0,
  );
  const annualizedReturnPct = round((adjustedNetProfit / Math.max(spotPrice * storageTons * 1000, 1)) * (365 / Math.max(duration * 30, 1)) * 100, 2);
  const unitCapitalReturnPct = round((adjustedNetProfit / Math.max(spotPrice * storageTons * 1000, 1)) * 100, 2);
  const carryCoverageRatio = round(grossProfit / Math.max(financingCost + capitalOccupancyCost + rollCost, 1), 2);
  const scoreCard = calculateScoreCard({
    netPnL: grossProfit - financingCost - rollCost - capitalOccupancyCost,
    adjustedObjective: adjustedNetProfit,
    stressLoss,
    hedgeEffectiveness: Math.max(0, Math.min(1, (optimizationPlan.summary.serviceLevel / 100) * 0.65 + (carryCoverageRatio > 1 ? 0.25 : 0.1))),
    returnOnCapital: unitCapitalReturnPct,
    returnOnMargin: annualizedReturnPct,
    executionPenalty: penaltyBreakdown.executionPenalty + constraints.reduce((sum, item) => sum + item.penaltyContribution, 0),
    riskPenalty: penaltyBreakdown.riskPenalty,
  });

  const unifiedResult: UnifiedStrategyResult = {
    strategyType: "time_arbitrage",
    strategyName: "时间（跨期）套利",
    summary: {
      recommendedAction: maxProfit > 0 ? `在 ${maxProfitMonth} 月择机释放库存` : "暂缓入储并等待更优期限结构",
      headline: maxProfit > 0 ? "跨期窗口存在正向持有收益" : "当前持有成本不足以支撑跨期套利",
      keyDriver: maxProfit > 0 ? "期限结构抬升与窗口释放" : "持有成本偏高",
    },
    pnl: {
      grossPnL: grossProfit,
      spotPnL: grossProfit,
      futuresPnL: 0,
      basisPnL: 0,
      spreadPnL: round(maxProfit * storageTons * 1000, 0),
      transportPnL: 0,
      processingPnL: 0,
      marginCost: 0,
      financingCost,
      storageCost: optimizationPlan.summary.totalOperatingCost,
      slippageCost: 0,
      transactionCost: rollCost,
      otherCost: capitalOccupancyCost,
      netPnL: round(grossProfit - financingCost - rollCost - capitalOccupancyCost, 0),
      riskPenalty: penaltyBreakdown.riskPenalty,
      capitalPenalty: penaltyBreakdown.capitalPenalty,
      executionPenalty: penaltyBreakdown.executionPenalty,
      adjustedObjective: adjustedNetProfit,
    },
    riskMetrics: {
      priceRisk: round(Math.abs(maxProfit) * storageTons * 90, 0),
      basisRisk: round(Math.abs((futurePriceCurve[futurePriceCurve.length - 1] ?? spotPrice) - socialBreakevenCost) * storageTons * 55, 0),
      spreadRisk: round(Math.abs((futurePriceCurve[0] ?? spotPrice) - (futurePriceCurve[futurePriceCurve.length - 1] ?? spotPrice)) * storageTons * 45, 0),
      volatilityRisk: round(Math.abs(maxProfit) * storageTons * 90, 0),
      var95: round(stressLoss * 0.75, 0),
      cvar95: round(stressLoss, 0),
      maxDrawdownProxy: round(grossProfit * 0.2, 0),
      stressLoss,
      hedgeEffectiveness: round(Math.max(0, Math.min(100, optimizationPlan.summary.serviceLevel * 0.9)), 2),
      confidenceScore: round(Math.max(0, 100 - optimizationPlan.summary.averageUtilization * 0.4), 2),
    },
    capitalMetrics: {
      initialCapitalUsed: round(spotPrice * storageTons * 1000, 0),
      marginUsed: 0,
      peakCapitalOccupied: round(spotPrice * storageTons * 1000 + capitalOccupancyCost, 0),
      capitalTurnoverDays: duration * 30,
      returnOnCapital: unitCapitalReturnPct,
      returnOnMargin: annualizedReturnPct,
      leverageRatio: 1,
    },
    constraints,
    sensitivities: profits.map((item) => ({
      scenario: `${item.month}月`,
      netPnL: round(item.totalProfit * 10000, 0),
      adjustedObjective: round(item.totalProfit * 10000 - financingCost / Math.max(duration, 1), 0),
      metricA: item.priceGap,
      metricB: item.holdingCost,
    })),
    stressTests: [
      {
        name: "carry_up",
        description: "持有成本上调 15%",
        netPnL: round(grossProfit - financingCost * 1.15 - capitalOccupancyCost - rollCost, 0),
        adjustedObjective: round(adjustedNetProfit - financingCost * 0.15, 0),
        stressLoss: round(financingCost * 0.15, 0),
        pass: grossProfit - financingCost * 1.15 - capitalOccupancyCost - rollCost > 0,
      },
      {
        name: "curve_flattening",
        description: "远月价格曲线下移 0.4 元/kg",
        netPnL: round(grossProfit - storageTons * 400 - financingCost - capitalOccupancyCost - rollCost, 0),
        adjustedObjective: round(adjustedNetProfit - storageTons * 220, 0),
        stressLoss: round(storageTons * 400, 0),
        pass: grossProfit - storageTons * 400 - financingCost - capitalOccupancyCost - rollCost > 0,
      },
    ],
    scoreCard,
    recommendations: [
      {
        headline: "控制持有周期",
        action: "优先围绕利润峰值月前后 1-2 个月动态释放",
        rationale: "当前策略对持有成本和曲线走平较敏感。",
      },
      {
        headline: "缓解瓶颈环节",
        action: `优先优化 ${optimizationPlan.summary.constrainedBy[0] ?? "storage"} 相关能力`,
        rationale: "平均利用率和服务水平已成为风险调整收益的重要约束。",
      },
    ],
    aiInsight: maxProfit > 0
      ? `当前跨期结构支持入储至 ${maxProfitMonth} 月附近释放，风险调整后目标值 ${adjustedNetProfit.toLocaleString()} 元。`
      : "当前期限结构不足以覆盖持有与执行成本，建议等待远月升水扩大。",
  };

  return {
    currentSpotPrice: spotPrice,
    socialBreakevenCost,
    monthlyStorageFee: holdingCostPerMonth,
    storageTons,
    startMonth,
    storageDurationMonths: duration,
    months,
    costCurve,
    futurePriceCurve,
    socialCostLine,
    profitSpace,
    costOfCarryFairPriceCurve,
    riskAdjustedReturnCurve,
    profits,
    arbitrageWindow:
      arbitrageWindowStart !== null && arbitrageWindowEnd !== null
        ? { startMonth: arbitrageWindowStart, endMonth: arbitrageWindowEnd }
        : null,
    maxProfitMonth,
    maxProfit: maxProfit === -Infinity ? 0 : parseFloat(maxProfit.toFixed(2)),
    maxTotalProfit,
    breakEvenMonth,
    historyMonths,
    historyCostCurve,
    historyFuturePriceCurve,
    historySocialCostLine,
    historyProfitSpace,
    optimizationPlan,
    analytics: {
      grossProfit,
      financingCost,
      rollCost,
      capitalOccupancyCost,
      adjustedNetProfit,
      annualizedReturnPct,
      unitCapitalReturnPct,
      carryCoverageRatio,
      stressLoss,
      penalties: penaltyBreakdown,
      scoreCard,
      constraints,
      unifiedResult,
    },
  };
}

export function buildArbitrageDecisionContext(
  spotPrice: number,
  holdingCostPerMonth: number = 0.2,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
  storageDurationMonths: number = 6,
  optimization?: TimeArbitrageOptimizationInput,
): ArbitrageContext {
  const result = calculateArbitrage(
    spotPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
    storageDurationMonths,
    optimization,
  );
  return {
    result,
    assumptions: {
      spotPrice,
      socialBreakevenCost,
      holdingCostPerMonth,
      storageTons,
      startMonth,
      storageDurationMonths,
    },
  };
}

export function buildArbitrageAgentDraft(
  spotPrice: number,
  holdingCostPerMonth: number = 0.2,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
  storageDurationMonths: number = 6,
  optimization?: TimeArbitrageOptimizationInput,
) {
  const { result } = buildArbitrageDecisionContext(
    spotPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
    storageDurationMonths,
    optimization,
  );

  const buyMonths = result.profits.filter((p: MonthProfit) => p.shouldArbitrage).map((p: MonthProfit) => p.month);
  const costGap = parseFloat((socialBreakevenCost - spotPrice).toFixed(2));
  const marketStatus =
    costGap > 0
      ? `当前毛猪价 ${spotPrice.toFixed(2)} 元/kg，低于社会养殖成本 ${socialBreakevenCost.toFixed(2)} 元/kg，价差 ${costGap.toFixed(2)} 元/kg，行业普遍亏损，价格存在自然修复动能。`
      : `当前毛猪价 ${spotPrice.toFixed(2)} 元/kg，高于社会养殖成本 ${socialBreakevenCost.toFixed(2)} 元/kg，盈利空间 ${(-costGap).toFixed(2)} 元/kg，需警惕产能释放。`;

  const windowStr =
    result.arbitrageWindow
      ? `${result.arbitrageWindow.startMonth}月至${result.arbitrageWindow.endMonth}月为有效收储窗口`
      : `当前参数下未出现有效收储窗口`;

  return {
    marketAnalysis: marketStatus,
    costRecommendation:
      buyMonths.length > 0
        ? `建议从 ${startMonth} 月起锁定 ${storageTons} 吨收储，储存费 ${holdingCostPerMonth.toFixed(2)} 元/kg/月。${windowStr}，在 ${result.maxProfitMonth} 月出货价差最大（+${result.maxProfit} 元/kg，约 ${result.maxTotalProfit} 万元总利润）。${result.breakEvenMonth ? `生猪期货预测价预计在 ${result.breakEvenMonth} 月达到社会养殖成本保本点。` : ""}`
        : `当前参数下持有成本已接近或超过未来预测价，无有效套利窗口，建议延后收储或降低储存费。`,
    decision: buyMonths.map((m: number) => `${m}月持仓`),
    riskWarning: `生猪期货价格预测存在不确定性，建议以 ${storageTons / 3} 吨为单位分 3 批入库降低集中风险。预计资金占用 ${(spotPrice * storageTons * 1000 / 10000).toFixed(0)} 万元，请评估资金成本与流动性。`,
  };
}
