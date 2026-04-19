/**
 * 时间套利计算引擎
 * 支持：当前毛猪价、预期未来价、社会养殖成本、仓储费、收储量、收储时长
 * 返回多条曲线：持有成本线、预期售价线、社会养殖成本线、利润空间
 */

export type MonthProfit = {
  month: number;
  profit: number;
  totalProfit: number; // 万元，按收储量计算
  shouldArbitrage: boolean;
};

export type TimeArbitrageResult = {
  currentSpotPrice: number;
  expectedFuturesPrice: number;
  socialBreakevenCost: number;
  monthlyStorageFee: number;
  storageTons: number;
  startMonth: number; // 收储起始月
  months: number[];
  // 多条曲线数据（每个月一个点）
  costCurve: number[];           // 持有成本线（现货价 + 累计仓储费）
  futurePriceCurve: number[];    // 预期售价线（从现货价向预期价渐进）
  socialCostLine: number[];      // 社会养殖成本线（水平线）
  profitSpace: number[];         // 利润空间 = 预期售价 - 持有成本
  profits: MonthProfit[];
  maxProfitMonth: number;
  maxProfit: number;             // 元/kg
  maxTotalProfit: number;        // 万元
};

export type ArbitrageContext = {
  result: TimeArbitrageResult;
  assumptions: {
    spotPrice: number;
    futuresPrice: number;
    socialBreakevenCost: number;
    holdingCostPerMonth: number;
    storageTons: number;
    startMonth: number;
  };
};

/**
 * 计算时间套利结果
 * @param spotPrice 当前毛猪价（元/kg）
 * @param futuresPrice 预期未来价（元/kg）
 * @param socialBreakevenCost 社会养殖成本（元/kg）
 * @param holdingCostPerMonth 仓储费（元/kg/月）
 * @param storageTons 收储量（吨）
 * @param startMonth 收储起始月（1-12，默认4月）
 */
export function calculateArbitrage(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
): TimeArbitrageResult {
  // 生成从 startMonth 到 startMonth+8 的月份序列（最多9个月）
  const targetMonths: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1;
    targetMonths.push(m);
  }

  let maxProfit = -Infinity;
  let maxProfitMonth = 0;
  let maxTotalProfit = 0;

  const costCurve: number[] = [];
  const futurePriceCurve: number[] = [];
  const socialCostLine: number[] = [];
  const profitSpace: number[] = [];
  const profits: MonthProfit[] = [];

  // 预期售价曲线：从现货价出发，在第6个月附近到达预期价，之后略微上扬
  // 使用 S 型曲线（sigmoid-like）使趋势更自然
  const totalSteps = targetMonths.length - 1; // 8步

  for (let i = 0; i < targetMonths.length; i++) {
    const month = targetMonths[i]!;
    const diffMonths = i; // 距收储起始月的月数

    // 持有成本线：现货价 + 累计仓储费
    const costAtMonth = parseFloat((spotPrice + holdingCostPerMonth * diffMonths).toFixed(2));
    costCurve.push(costAtMonth);

    // 社会养殖成本线（水平线）
    socialCostLine.push(socialBreakevenCost);

    // 预期售价曲线：使用平滑插值
    // 前半段缓慢上升，后半段加速到达预期价，之后轻微超越
    let simulatedFuturePrice: number;
    if (i <= totalSteps) {
      // 使用 ease-in-out 插值：t^2 * (3 - 2t)
      const t = i / totalSteps;
      const eased = t * t * (3 - 2 * t);
      // 价格从现货价向预期价插值，并在后期允许小幅超越
      const overshoot = i > totalSteps * 0.7 ? (i - totalSteps * 0.7) * 0.15 : 0;
      simulatedFuturePrice = parseFloat(
        (spotPrice + (futuresPrice - spotPrice) * eased + overshoot).toFixed(2)
      );
    } else {
      simulatedFuturePrice = parseFloat((futuresPrice + (i - totalSteps) * 0.2).toFixed(2));
    }
    futurePriceCurve.push(simulatedFuturePrice);

    // 利润空间（元/kg）
    const profit = parseFloat((simulatedFuturePrice - costAtMonth).toFixed(2));
    profitSpace.push(profit);

    const shouldArbitrage = profit > 0;

    // 总利润（万元）= 利润(元/kg) * 收储量(吨) * 1000(kg/吨) / 10000
    const totalProfit = parseFloat(((profit * storageTons * 1000) / 10000).toFixed(1));

    if (profit > maxProfit) {
      maxProfit = profit;
      maxProfitMonth = month;
      maxTotalProfit = totalProfit;
    }

    profits.push({
      month,
      profit,
      totalProfit,
      shouldArbitrage,
    });
  }

  return {
    currentSpotPrice: spotPrice,
    expectedFuturesPrice: futuresPrice,
    socialBreakevenCost,
    monthlyStorageFee: holdingCostPerMonth,
    storageTons,
    startMonth,
    months: targetMonths,
    costCurve,
    futurePriceCurve,
    socialCostLine,
    profitSpace,
    profits,
    maxProfitMonth,
    maxProfit,
    maxTotalProfit,
  };
}

export function buildArbitrageDecisionContext(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
): ArbitrageContext {
  const result = calculateArbitrage(
    spotPrice,
    futuresPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
  );

  return {
    result,
    assumptions: {
      spotPrice,
      futuresPrice,
      socialBreakevenCost,
      holdingCostPerMonth,
      storageTons,
      startMonth,
    },
  };
}

export function buildArbitrageAgentDraft(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
  socialBreakevenCost: number = 12.0,
  storageTons: number = 1000,
  startMonth: number = 4,
) {
  const { result } = buildArbitrageDecisionContext(
    spotPrice,
    futuresPrice,
    holdingCostPerMonth,
    socialBreakevenCost,
    storageTons,
    startMonth,
  );

  const buyMonths = result.profits.filter((p) => p.shouldArbitrage).map((p) => p.month);
  const costGap = parseFloat((socialBreakevenCost - spotPrice).toFixed(2));
  const marketStatus = costGap > 0
    ? `当前毛猪价 ${spotPrice.toFixed(2)} 元/kg，低于社会养殖成本 ${socialBreakevenCost} 元/kg，亏损 ${costGap.toFixed(2)} 元/kg，市场处于亏损养殖区间，价格存在修复动力。`
    : `当前毛猪价 ${spotPrice.toFixed(2)} 元/kg，高于社会养殖成本 ${socialBreakevenCost} 元/kg，市场盈利空间 ${(-costGap).toFixed(2)} 元/kg。`;

  return {
    marketAnalysis: marketStatus,
    costRecommendation: buyMonths.length > 0
      ? `从第 ${startMonth} 月起收储 ${storageTons} 吨，仓储费 ${holdingCostPerMonth.toFixed(2)} 元/kg/月。在 ${result.maxProfitMonth} 月出货时利润空间最大（+${result.maxProfit} 元/kg，合计约 ${result.maxTotalProfit} 万元）。`
      : `当前参数下全周期保本线皆高于预期售价，未出现有效套利窗口，建议观望或调整收储参数。`,
    decision: buyMonths.map((m) => `${m}月买入`),
    riskWarning: `未来价格预测存在不确定性，当前预期价格较高，需关注需求端是否支撑，建议分批入库降低集中风险。收储量 ${storageTons} 吨，资金占用约 ${(spotPrice * storageTons * 1000 / 10000).toFixed(0)} 万元，请评估资金流动性。`,
  };
}
