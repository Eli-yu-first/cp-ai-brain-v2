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

export type WhatIfResourcePoint = {
  month: 1 | 2 | 3;
  slaughterHeads: number;
  freezingTons: number;
  storageTons: number;
  warehousePallets: number;
  coldChainTrips: number;
};

export type AiWhatIfResult = {
  batch: InventoryBatch;
  selectedMonth: 1 | 2 | 3;
  assumptions: {
    targetPrice: number;
    capacityAdjustment: number;
    demandAdjustment: number;
  };
  summary: {
    baselineProfit: number;
    simulatedProfit: number;
    incrementalProfit: number;
    utilizationRate: number;
    expectedRevenue: number;
  };
  resources: WhatIfResourcePoint[];
};

function clampMonth(month: number) {
  return Math.max(1, Math.min(8, Math.round(month)));
}

function clampScenarioMonth(month: number) {
  return Math.max(1, Math.min(3, Math.round(month))) as 1 | 2 | 3;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function getBatch(batchCode: string) {
  return inventoryBatches.find(item => item.batchCode === batchCode) ?? inventoryBatches[0]!;
}

export function buildAiForecast(batchCode: string, selectedMonth: number, targetPrice?: number): AiForecastResult {
  const batch = getBatch(batchCode);
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
    const decisionBase = calculateDecision(batch, Math.min(horizon, 3) as 1 | 2 | 3);
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

export function buildWhatIfSimulation(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
): AiWhatIfResult {
  const batch = getBatch(batchCode);
  const month = clampScenarioMonth(selectedMonth);
  const baseline = buildAiForecast(batchCode, month, targetPrice);
  const baselineProfit = baseline.summary.totalProfit;
  const normalizedCapacity = capacityAdjustment / 100;
  const normalizedDemand = demandAdjustment / 100;
  const utilizationRate = round(100 + capacityAdjustment * 0.68 + demandAdjustment * 0.32);
  const priceSignal = (targetPrice - 14) * batch.weightKg * 0.42;
  const demandSignal = batch.weightKg * normalizedDemand * 0.65;
  const capacitySignal = batch.weightKg * normalizedCapacity * 0.18;
  const overloadPenalty = Math.max(0, utilizationRate - 118) * 320;
  const simulatedProfit = round(baselineProfit + priceSignal + demandSignal + capacitySignal - overloadPenalty);
  const expectedRevenue = round(batch.weightKg * targetPrice * (1 + normalizedDemand * 0.08));
  const baseHeads = Math.max(900, Math.round(batch.weightKg / 6.1));

  const resources: WhatIfResourcePoint[] = [1, 2, 3].map(currentMonth => {
    const monthFactor = 0.88 + currentMonth * 0.12;
    const demandFactor = 1 + normalizedDemand * (0.8 + currentMonth * 0.06);
    const capacityFactor = 1 + normalizedCapacity * (0.7 + currentMonth * 0.08);
    const slaughterHeads = Math.round(baseHeads * monthFactor * demandFactor * capacityFactor);
    const freezingTons = round((slaughterHeads * 0.098) / 1000);
    const storageTons = round(freezingTons * (0.72 + currentMonth * 0.11));
    const warehousePallets = Math.round(storageTons * 22.5);
    const coldChainTrips = Math.max(1, Math.round(storageTons / 18));

    return {
      month: currentMonth as 1 | 2 | 3,
      slaughterHeads,
      freezingTons,
      storageTons,
      warehousePallets,
      coldChainTrips,
    };
  });

  return {
    batch,
    selectedMonth: month,
    assumptions: {
      targetPrice: round(targetPrice),
      capacityAdjustment: round(capacityAdjustment),
      demandAdjustment: round(demandAdjustment),
    },
    summary: {
      baselineProfit,
      simulatedProfit,
      incrementalProfit: round(simulatedProfit - baselineProfit),
      utilizationRate,
      expectedRevenue,
    },
    resources,
  };
}
