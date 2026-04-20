import { describe, expect, it } from "vitest";
import {
  PORK_PARTS,
  PORK_PROJECT_BLUEPRINT,
  calculateAgeDepreciationCoefficient,
  calculateCostOfCarryFairPrice,
  calculatePartFullCost,
  calculateRiskAdjustedHoldingReturn,
  getPorkPartByCode,
} from "./porkIndustryModel";

describe("pork industry domain model", () => {
  it("locks the document-defined 23 pork-part decision units", () => {
    expect(PORK_PARTS).toHaveLength(23);
    expect(PORK_PARTS.map(part => part.name)).toEqual([
      "五花",
      "大排",
      "小排",
      "前腿肉",
      "后腿肉",
      "里脊",
      "通脊",
      "前排",
      "筒骨",
      "肋排",
      "梅肉",
      "臀尖",
      "中方",
      "带皮五花",
      "去皮五花",
      "排骨段",
      "腿肉丁",
      "里脊丝",
      "五花肉块",
      "大排片",
      "小排块",
      "前腿肉丝",
      "后腿肉块",
    ]);
  });

  it("calculates document-style part full cost with all cost buckets", () => {
    const cost = calculatePartFullCost({
      breedingCostPerKg: 14.5,
      slaughterCostPerKg: 0.65,
      splitCostPerKg: 0.42,
      freezeCostPerKg: 0.18,
      storageCostPerTonDay: 7.5,
      transportCostPerTonKm: 0.85,
      annualCapitalRate: 4.2,
      stockDays: 30,
      transportDistanceKm: 180,
      partInventoryValuePerKg: 24,
      partDailyLossRate: 0.0007,
      yieldRate: 0.08,
    });

    expect(cost.totalCostPerKg).toBeGreaterThan(2);
    expect(cost.components.storage).toBeCloseTo(0.225, 3);
    expect(cost.components.transport).toBeCloseTo(0.153, 3);
    expect(cost.components.capital).toBeCloseTo(0.083, 2);
    expect(cost.components.loss).toBeCloseTo(0.504, 3);
  });

  it("applies FEFO age depreciation coefficients from the requirement document", () => {
    expect(calculateAgeDepreciationCoefficient(10)).toBe(1);
    expect(calculateAgeDepreciationCoefficient(45)).toBe(0.98);
    expect(calculateAgeDepreciationCoefficient(75)).toBe(0.95);
    expect(calculateAgeDepreciationCoefficient(110)).toBe(0.9);
    expect(calculateAgeDepreciationCoefficient(150)).toBe(0.8);
  });

  it("calculates cost-of-carry fair price and risk-adjusted holding return", () => {
    const fairPrice = calculateCostOfCarryFairPrice({
      spotPrice: 22,
      annualCapitalRate: 4.2,
      dailyStorageRate: 0.00035,
      dailyLossRate: 0.0007,
      holdingDays: 90,
      convenienceYieldPerKg: 0.15,
    });
    const holding = calculateRiskAdjustedHoldingReturn({
      expectedFuturePrice: fairPrice,
      breakEvenPrice: 22.7,
      inventoryKg: 50000,
      inventoryCostPerKg: 22,
      holdingDays: 90,
      riskFreeAnnualRate: 2.1,
      volatility: 0.18,
    });

    expect(fairPrice).toBeGreaterThan(22);
    expect(holding.totalProfit).toBeGreaterThan(0);
    expect(Number.isFinite(holding.sharpeRatio)).toBe(true);
  });

  it("captures project understanding, required modules, and acceptance standards", () => {
    expect(PORK_PROJECT_BLUEPRINT.dataModules).toHaveLength(8);
    expect(PORK_PROJECT_BLUEPRINT.deepArbitrageCategories).toHaveLength(14);
    expect(PORK_PROJECT_BLUEPRINT.acceptanceStandards.some(item => item.metric.includes("价格预测准确率"))).toBe(true);
    expect(getPorkPartByCode("pork_belly")?.name).toBe("五花");
  });
});
