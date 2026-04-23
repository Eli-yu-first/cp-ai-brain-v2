export type FinancialArbitrageInput = {
  spotPrice: number;
  futuresPrice: number;
  expectedFutureSpotPrice: number;
  expectedFutureFuturesPrice: number;
  physicalExposureTons: number;
  hedgeRatio: number;
  marginRate: number;
  contractSize: number;
};

export type FinancialArbitrageOutput = {
  basisNow: number;
  basisFuture: number;
  spotPnL: number;
  futuresPnL: number;
  netPnL: number;
  totalMargin: number;
  contractsNeeded: number;
  effectivePrice: number;
  sensitivity: Array<{ priceDropPercent: number; spotPnL: number; futuresPnL: number; netPnL: number; effectivePrice: number }>;
  aiInsight: string;
};

export function simulateFinancialArbitrage(input: FinancialArbitrageInput): FinancialArbitrageOutput {
  const { spotPrice, futuresPrice, expectedFutureSpotPrice, expectedFutureFuturesPrice, physicalExposureTons, hedgeRatio, marginRate, contractSize } = input;
  
  const basisNow = spotPrice - futuresPrice;
  const basisFuture = expectedFutureSpotPrice - expectedFutureFuturesPrice;
  
  const spotPnL = (expectedFutureSpotPrice - spotPrice) * physicalExposureTons * 1000;
  
  const hedgedTons = physicalExposureTons * hedgeRatio;
  const contractsNeeded = Math.ceil(hedgedTons / contractSize);
  const actualHedgedTons = contractsNeeded * contractSize;
  
  const futuresPnL = (futuresPrice - expectedFutureFuturesPrice) * actualHedgedTons * 1000;
  
  const netPnL = spotPnL + futuresPnL;
  const totalMargin = futuresPrice * 1000 * actualHedgedTons * marginRate;
  
  const effectivePrice = expectedFutureSpotPrice + (futuresPnL / (physicalExposureTons * 1000));
  
  const sensitivity = [-30, -20, -10, -5, 0, 5, 10, 20, 30].map(pct => {
    const shift = 1 + pct / 100;
    const simSpot = expectedFutureSpotPrice * shift;
    // Assume basis reverts to expected basis future
    const simFuture = simSpot - basisFuture;
    
    const sPnL = (simSpot - spotPrice) * physicalExposureTons * 1000;
    const fPnL = (futuresPrice - simFuture) * actualHedgedTons * 1000;
    const nPnL = sPnL + fPnL;
    const effP = simSpot + (fPnL / (physicalExposureTons * 1000));
    
    return {
      priceDropPercent: pct,
      spotPnL: sPnL,
      futuresPnL: fPnL,
      netPnL: nPnL,
      effectivePrice: effP
    };
  });
  
  let insight = "在当前基差和价格预期下，";
  if (hedgeRatio === 0) insight += "您选择了完全未套保暴露敞口。现货价格风险高达 100%。";
  else if (hedgeRatio > 0.8) insight += "您选择了高比例套保。虽然有效规避了价格下跌风险，但也锁死了价格上涨的潜在收益。";
  else insight += "中位套保比例有效平滑了现货波动风险。";
  
  if (basisNow > 0 && basisFuture < basisNow) insight += " 基差处于历史高位且预期回归，卖出套期保值（反向套利）是非常有利的安全边际策略。";
  
  return {
    basisNow,
    basisFuture,
    spotPnL,
    futuresPnL,
    netPnL,
    totalMargin,
    contractsNeeded,
    effectivePrice,
    sensitivity,
    aiInsight: insight
  };
}
