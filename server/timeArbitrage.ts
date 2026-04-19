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

    socialCostLine.push(socialBreakevenCost);

    const priceGap = parseFloat((futurePrice - holdingCost).toFixed(2));
    profitSpace.push(priceGap);

    const shouldArbitrage = priceGap > 0 && holdingCost < socialBreakevenCost;
    const totalProfit = parseFloat(((priceGap * storageTons * 1000) / 10000).toFixed(1));

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
  };
}

export function buildArbitrageDecisionContext(
  spotPrice: number,
  holdingCostPerMonth: number = 0.2,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
  storageDurationMonths: number = 6,
): ArbitrageContext {
  const result = calculateArbitrage(
    spotPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
    storageDurationMonths,
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
) {
  const { result } = buildArbitrageDecisionContext(
    spotPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
    storageDurationMonths,
  );

  const buyMonths = result.profits.filter((p) => p.shouldArbitrage).map((p) => p.month);
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
    decision: buyMonths.map((m) => `${m}月持仓`),
    riskWarning: `生猪期货价格预测存在不确定性，建议以 ${storageTons / 3} 吨为单位分 3 批入库降低集中风险。预计资金占用 ${(spotPrice * storageTons * 1000 / 10000).toFixed(0)} 万元，请评估资金成本与流动性。`,
  };
}
