import { describe, it, expect } from "vitest";
import { solveOptimization, generateAIDecision } from "./optimizationScheduling2";
import { sampleOptimizationInput } from "../shared/optimizationScheduling2";

describe("solveOptimization", () => {
  it("should return valid output structure with sample data", () => {
    const result = solveOptimization(sampleOptimizationInput);

    expect(result).toHaveProperty("profitTable");
    expect(result).toHaveProperty("pigSalesTable");
    expect(result).toHaveProperty("salesTable");
    expect(result).toHaveProperty("splittingTable");
    expect(result).toHaveProperty("summary");
  });

  it("should produce non-empty profit table", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.profitTable.length).toBeGreaterThan(0);
  });

  it("should produce non-empty pig sales table", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.pigSalesTable.length).toBeGreaterThan(0);
  });

  it("should produce non-empty sales table", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.salesTable.length).toBeGreaterThan(0);
  });

  it("should produce non-empty splitting table", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.splittingTable.length).toBeGreaterThan(0);
  });

  it("should have valid summary with positive total revenue", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.summary.totalRevenue).toBeGreaterThan(0);
  });

  it("should have valid summary with positive total slaughter count", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.summary.totalSlaughterCount).toBeGreaterThan(0);
  });

  it("should have capacity utilization between 0 and 100", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.summary.capacityUtilization).toBeGreaterThanOrEqual(0);
    expect(result.summary.capacityUtilization).toBeLessThanOrEqual(100);
  });

  it("should have profit margin as a valid number", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(typeof result.summary.profitMargin).toBe("number");
    expect(isFinite(result.summary.profitMargin)).toBe(true);
  });

  it("should have consistent profit calculation in profit table", () => {
    const result = solveOptimization(sampleOptimizationInput);
    for (const row of result.profitTable) {
      const expectedProfit = row.revenue - row.pigCost - row.storageCost - row.transportCost;
      expect(Math.abs(row.profit - expectedProfit)).toBeLessThan(0.02);
    }
  });

  it("should have positive total sales kg", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.summary.totalSalesKg).toBeGreaterThan(0);
  });

  it("should have non-negative freeze kg", () => {
    const result = solveOptimization(sampleOptimizationInput);
    expect(result.summary.totalFreezeKg).toBeGreaterThanOrEqual(0);
  });

  it("should handle empty input gracefully", () => {
    const emptyInput = {
      slaughterSchedule: [],
      yieldRates: [],
      slaughterCapacity: [],
      splitCapacity: [],
      warehouses: [],
      pigOrders: [],
      partOrders: [],
      deepProcessDemand: [],
      transportCosts: [],
    };
    const result = solveOptimization(emptyInput);
    expect(result.profitTable).toEqual([]);
    expect(result.pigSalesTable).toEqual([]);
    expect(result.salesTable).toEqual([]);
    expect(result.splittingTable).toEqual([]);
    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.totalProfit).toBe(0);
  });
});

describe("generateAIDecision", () => {
  it("should return valid decision structure", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);

    expect(decision).toHaveProperty("overview");
    expect(decision).toHaveProperty("keyFindings");
    expect(decision).toHaveProperty("bottlenecks");
    expect(decision).toHaveProperty("recommendations");
    expect(decision).toHaveProperty("roleActions");
    expect(decision).toHaveProperty("riskWarnings");
    expect(decision).toHaveProperty("profitOptimization");
  });

  it("should have non-empty overview", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);
    expect(decision.overview.length).toBeGreaterThan(0);
  });

  it("should have key findings with profit and capacity info", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);
    expect(decision.keyFindings.length).toBeGreaterThan(0);
  });

  it("should have role actions for all four roles", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);
    expect(decision.roleActions).toHaveProperty("purchasing");
    expect(decision.roleActions).toHaveProperty("production");
    expect(decision.roleActions).toHaveProperty("sales");
    expect(decision.roleActions).toHaveProperty("warehouse");
  });

  it("should have non-empty recommendations", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);
    expect(decision.recommendations.length).toBeGreaterThan(0);
  });

  it("should have non-empty profit optimization suggestions", () => {
    const output = solveOptimization(sampleOptimizationInput);
    const decision = generateAIDecision(sampleOptimizationInput, output);
    expect(decision.profitOptimization.length).toBeGreaterThan(0);
  });
});
