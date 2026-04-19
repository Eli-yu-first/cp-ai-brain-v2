import { calculateDecision, inventoryBatches, type InventoryBatch } from "./platformData";

export type ForecastPoint = {
  month: number;
  label: string;
  projectedPrice: number;
  breakEvenPrice: number;
  averageSellPrice: number;
  totalCostPerKg: number;
  profitPerKg: number;
  totalProfit: number;
};

export type AiForecastResult = {
  batch: InventoryBatch;
  selectedMonth: number;
  targetPrice: number;
  monthlyHoldingCost: number;
  summary: {
    projectedPrice: number;
    breakEvenPrice: number;
    averageSellPrice: number;
    profitPerKg: number;
    totalProfit: number;
  };
  curve: ForecastPoint[];
};

function clampMonth(month: number) {
  return Math.max(1, Math.min(8, Math.round(month)));
}

function round(value: number) {
  return Number(value.toFixed(2));
}

export function buildAiForecast(batchCode: string, selectedMonth: number, targetPrice?: number): AiForecastResult {
  const batch = inventoryBatches.find(item => item.batchCode === batchCode) ?? inventoryBatches[0]!;
  const month = clampMonth(selectedMonth);
  const monthlyHoldingCost = round(
    batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth,
  );
  const anchoredTargetPrice = targetPrice ?? round(batch.currentSpotPrice + month * 0.38 + batch.seasonalAdjustment);

  const curve = Array.from({ length: 8 }, (_, index) => {
    const horizon = index + 1;
    const ratio = horizon / month;
    const seasonalDrift = Math.sin((horizon / 8) * Math.PI) * 0.22;
    const projectedPrice = round(
      batch.currentSpotPrice + (anchoredTargetPrice - batch.currentSpotPrice) * ratio + seasonalDrift,
    );
    const decisionBase = calculateDecision(batch, (Math.min(horizon, 3) as 1 | 2 | 3));
    const totalCostPerKg = round(batch.unitCost + monthlyHoldingCost * horizon);
    const averageSellPrice = round((batch.currentSpotPrice + projectedPrice) / 2);
    const profitPerKg = round(projectedPrice - totalCostPerKg);
    const totalProfit = round(profitPerKg * batch.weightKg);

    return {
      month: horizon,
      label: `${horizon}M`,
      projectedPrice,
      breakEvenPrice: horizon <= 3 ? decisionBase.breakEvenPrice : totalCostPerKg,
      averageSellPrice,
      totalCostPerKg,
      profitPerKg,
      totalProfit,
    } satisfies ForecastPoint;
  });

  const current = curve[month - 1]!;

  return {
    batch,
    selectedMonth: month,
    targetPrice: anchoredTargetPrice,
    monthlyHoldingCost,
    summary: {
      projectedPrice: current.projectedPrice,
      breakEvenPrice: current.breakEvenPrice,
      averageSellPrice: current.averageSellPrice,
      profitPerKg: current.profitPerKg,
      totalProfit: current.totalProfit,
    },
    curve,
  };
}
