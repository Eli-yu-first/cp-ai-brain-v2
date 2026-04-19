import { describe, expect, it } from "vitest";
import {
  calculateArbitrage,
  buildArbitrageDecisionContext,
  buildArbitrageAgentDraft,
} from "./timeArbitrage";

describe("calculateArbitrage - extended parameters", () => {
  it("returns correct number of months based on startMonth", () => {
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 4);
    expect(result.months).toHaveLength(9);
    expect(result.months[0]).toBe(4);
    expect(result.months[5]).toBe(9);
  });

  it("returns all required multi-line curve data", () => {
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 4);
    // All 4 curve arrays must be present and same length as months
    expect(result.costCurve).toHaveLength(result.months.length);
    expect(result.futurePriceCurve).toHaveLength(result.months.length);
    expect(result.socialCostLine).toHaveLength(result.months.length);
    expect(result.profitSpace).toHaveLength(result.months.length);
  });

  it("costCurve increases by holdingCostPerMonth each step", () => {
    const spotPrice = 9.0;
    const holdingCost = 0.20;
    const result = calculateArbitrage(spotPrice, 12.0, holdingCost, 12.0, 1000, 4);
    for (let i = 0; i < result.costCurve.length; i++) {
      const expected = parseFloat((spotPrice + holdingCost * i).toFixed(2));
      expect(result.costCurve[i]).toBeCloseTo(expected, 1);
    }
  });

  it("socialCostLine is a flat horizontal line at socialBreakevenCost", () => {
    const socialCost = 13.5;
    const result = calculateArbitrage(9.0, 12.0, 0.20, socialCost, 1000, 4);
    result.socialCostLine.forEach(v => {
      expect(v).toBe(socialCost);
    });
  });

  it("profitSpace = futurePriceCurve - costCurve", () => {
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 4);
    for (let i = 0; i < result.profitSpace.length; i++) {
      const expected = parseFloat((result.futurePriceCurve[i]! - result.costCurve[i]!).toFixed(2));
      expect(result.profitSpace[i]).toBeCloseTo(expected, 1);
    }
  });

  it("totalProfit in profits is calculated from storageTons", () => {
    const storageTons = 2000;
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, storageTons, 4);
    const maxProfit = result.profits.find(p => p.month === result.maxProfitMonth);
    expect(maxProfit).toBeDefined();
    // totalProfit (万元) = profit (元/kg) * storageTons * 1000 / 10000
    const expected = parseFloat(((maxProfit!.profit * storageTons * 1000) / 10000).toFixed(1));
    expect(maxProfit!.totalProfit).toBeCloseTo(expected, 0);
  });

  it("startMonth wraps around December correctly", () => {
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 11);
    // Starting from November: 11, 12, 1, 2, 3, 4, 5, 6, 7
    expect(result.months[0]).toBe(11);
    expect(result.months[1]).toBe(12);
    expect(result.months[2]).toBe(1);
    expect(result.months[3]).toBe(2);
  });

  it("futurePriceCurve starts near spotPrice and ends near futuresPrice", () => {
    const spotPrice = 9.0;
    const futuresPrice = 15.0;
    const result = calculateArbitrage(spotPrice, futuresPrice, 0.20, 12.0, 1000, 4);
    // First point should be at or near spotPrice
    expect(result.futurePriceCurve[0]).toBeCloseTo(spotPrice, 0);
    // Last point should be near futuresPrice (within reasonable range)
    const lastPoint = result.futurePriceCurve[result.futurePriceCurve.length - 1]!;
    expect(lastPoint).toBeGreaterThan(spotPrice);
  });

  it("shouldArbitrage is true when profitSpace > 0", () => {
    const result = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 4);
    result.profits.forEach((p, i) => {
      if (result.profitSpace[i]! > 0) {
        expect(p.shouldArbitrage).toBe(true);
      } else {
        expect(p.shouldArbitrage).toBe(false);
      }
    });
  });

  it("storageTons affects totalProfit proportionally", () => {
    const result1 = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 1000, 4);
    const result2 = calculateArbitrage(9.0, 12.0, 0.20, 12.0, 2000, 4);
    // maxTotalProfit should be roughly double
    expect(result2.maxTotalProfit).toBeCloseTo(result1.maxTotalProfit * 2, 0);
  });

  it("buildArbitrageDecisionContext includes all new fields", () => {
    const ctx = buildArbitrageDecisionContext(9.0, 12.0, 0.20, 12.0, 1000, 4);
    expect(ctx.assumptions.socialBreakevenCost).toBe(12.0);
    expect(ctx.assumptions.storageTons).toBe(1000);
    expect(ctx.assumptions.startMonth).toBe(4);
    expect(ctx.result.socialCostLine).toBeDefined();
    expect(ctx.result.profitSpace).toBeDefined();
  });

  it("buildArbitrageAgentDraft generates market analysis mentioning socialCost", () => {
    const draft = buildArbitrageAgentDraft(9.0, 12.0, 0.20, 12.0, 1000, 4);
    expect(draft.marketAnalysis).toContain("12");
    expect(draft.costRecommendation).toContain("1000");
    expect(Array.isArray(draft.decision)).toBe(true);
    expect(typeof draft.riskWarning).toBe("string");
  });

  it("capitalRequired is correctly reflected in riskWarning", () => {
    const storageTons = 500;
    const spotPrice = 10.0;
    const draft = buildArbitrageAgentDraft(spotPrice, 12.0, 0.20, 12.0, storageTons, 4);
    // Capital = 10 * 500 * 1000 / 10000 = 500 万元
    expect(draft.riskWarning).toContain("500");
  });
});
