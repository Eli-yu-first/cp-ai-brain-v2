export type TimeArbitrageResult = {
  currentSpotPrice: number;
  expectedFuturesPrice: number;
  monthlyStorageFee: number;
  months: number[];
  costCurve: number[];
  futurePriceCurve: number[];
  profits: { month: number; profit: number; shouldArbitrage: boolean }[];
  maxProfitMonth: number;
  maxProfit: number;
};

export type ArbitrageContext = {
  result: TimeArbitrageResult;
  assumptions: {
    spotPrice: number;
    futuresPrice: number;
    holdingCostPerMonth: number;
  };
};

export function calculateArbitrage(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
): TimeArbitrageResult {
  const targetMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  let maxProfit = -Infinity;
  let maxProfitMonth = 0;

  const costCurve: number[] = [];
  const futurePriceCurve: number[] = [];
  const profits: { month: number; profit: number; shouldArbitrage: boolean }[] = [];

  const baseLineMonth = 4; // Use April as base 0 representation internally for simplified diff scaling (0..8)

  for (const month of targetMonths) {
    const diffMonths = month - baseLineMonth;
    // Holding cost accumulates starting from current/selected purchasing month. Assuming we purchase now (April)
    const costAtMonth = spotPrice + holdingCostPerMonth * (diffMonths > 0 ? diffMonths : 0);
    costCurve.push(parseFloat(costAtMonth.toFixed(2)));

    // Simulating future price curve gradually trending toward expected Futures price (reached around Oct/Nov maybe)
    // We make a linear or slightly curved interpolation to reach `futuresPrice` by month 10, then plateau slightly.
    let simulatedFuturePrice = futuresPrice;
    if (month < 10) {
      // Very simple simulated curve starting lower and climbing to expected futures price
      const climbFactor = (month - baseLineMonth) / 6.0; // 0 to 1 scaling roughly
      simulatedFuturePrice = spotPrice + (futuresPrice - spotPrice) * Math.max(0, climbFactor - 0.1); 
    } else {
      // continue pushing slightly above to mimic the given image slope
      simulatedFuturePrice = futuresPrice + (month - 10) * 0.2; 
    }
    
    simulatedFuturePrice = parseFloat(simulatedFuturePrice.toFixed(2));
    futurePriceCurve.push(simulatedFuturePrice);

    const profit = parseFloat((simulatedFuturePrice - costAtMonth).toFixed(2));
    const shouldArbitrage = profit > 0;
    
    if (profit > maxProfit) {
      maxProfit = profit;
      maxProfitMonth = month;
    }

    profits.push({
      month,
      profit,
      shouldArbitrage,
    });
  }

  return {
    currentSpotPrice: spotPrice,
    expectedFuturesPrice: futuresPrice,
    monthlyStorageFee: holdingCostPerMonth,
    months: targetMonths,
    costCurve,
    futurePriceCurve,
    profits,
    maxProfitMonth,
    maxProfit,
  };
}

export function buildArbitrageDecisionContext(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
): ArbitrageContext {
  const result = calculateArbitrage(spotPrice, futuresPrice, holdingCostPerMonth);

  return {
    result,
    assumptions: {
      spotPrice,
      futuresPrice,
      holdingCostPerMonth,
    },
  };
}

export function buildArbitrageAgentDraft(
  spotPrice: number,
  futuresPrice: number,
  holdingCostPerMonth: number,
) {
  const { result } = buildArbitrageDecisionContext(spotPrice, futuresPrice, holdingCostPerMonth);

  const buyMonths = result.profits.filter((p) => p.shouldArbitrage).map((p) => p.month);
  
  const advice = buyMonths.length > 0 
    ? `当前毛猪价 ${spotPrice} 元/kg，仓储及利息费 ${holdingCostPerMonth} 元/kg/月。测算在 ${buyMonths.join(", ")} 月份对应的预计售价明显高于保本点成本。尤其是 ${result.maxProfitMonth} 月份，具备最大利润空间 (+${result.maxProfit} 元/kg)。`
    : `当前市场测算全周期保本线皆高于评估售价，未出现有效的套利窗口，建议观望。`;

  return {
    marketAnalysis: `当前毛猪价 ${spotPrice.toFixed(2)} 元/kg，较社会平均养殖成本 12.0 元/kg 低 ${(12.0 - spotPrice).toFixed(2)} 元。说明市场处于亏损养殖区间，价格存在修复动力。`,
    costRecommendation: `从 6 月起收储，仓储费 ${holdingCostPerMonth.toFixed(2)} 元/kg/月。在 ${result.maxProfitMonth} 月出货时利润空间最大。`,
    decision: buyMonths.map((m) => `${m}月买入`),
    riskWarning: `未来价格预测存在不确定性，当前预期价格较高，需关注需求端是否支撑，建议分批入库降低集中风险。`
  };
}
