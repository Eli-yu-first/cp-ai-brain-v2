import { describe, expect, it } from "vitest";
import {
  calculateArbitrage,
  buildArbitrageDecisionContext,
  buildArbitrageAgentDraft,
} from "./timeArbitrage";

/**
 * 新签名（按图示规则重构后）：
 *   calculateArbitrage(spotPrice, holdingCostPerMonth, socialBreakevenCost, storageTons, startMonth, storageDurationMonths)
 *
 * 特点：
 *   - 未再接受 futuresPrice 作为独立参数（由生猪期货预测模型自动生成）
 *   - 时长改为显式传入 storageDurationMonths（1-10）
 *   - 持有成本 = spot + holdingCostPerMonth * i（线性递增）
 *   - socialCostLine 恒等于 socialBreakevenCost
 */

describe("calculateArbitrage - extended parameters", () => {
  it("returns correct number of months based on storageDurationMonths", () => {
    const result = calculateArbitrage(9.0, 0.2, 12.0, 1000, 4, 9);
    expect(result.months).toHaveLength(9);
    expect(result.months[0]).toBe(4);
    expect(result.months[5]).toBe(9);
  });

  it("returns all required multi-line curve data", () => {
    const result = calculateArbitrage(9.0, 0.2, 12.0, 1000, 4, 6);
    expect(result.costCurve).toHaveLength(result.months.length);
    expect(result.futurePriceCurve).toHaveLength(result.months.length);
    expect(result.socialCostLine).toHaveLength(result.months.length);
    expect(result.profitSpace).toHaveLength(result.months.length);
  });

  it("costCurve increases by holdingCostPerMonth each step", () => {
    const spotPrice = 9.0;
    const holdingCost = 0.2;
    const result = calculateArbitrage(spotPrice, holdingCost, 12.0, 1000, 4, 6);
    for (let i = 0; i < result.costCurve.length; i++) {
      const expected = parseFloat((spotPrice + holdingCost * i).toFixed(2));
      expect(result.costCurve[i]).toBeCloseTo(expected, 1);
    }
  });

  it("socialCostLine is a flat horizontal line at socialBreakevenCost", () => {
    const socialCost = 13.5;
    const result = calculateArbitrage(9.0, 0.2, socialCost, 1000, 4, 6);
    result.socialCostLine.forEach((v) => {
      expect(v).toBe(socialCost);
    });
  });

  it("profitSpace = futurePriceCurve - costCurve", () => {
    const result = calculateArbitrage(9.0, 0.2, 12.0, 1000, 4, 6);
    for (let i = 0; i < result.profitSpace.length; i++) {
      const expected = parseFloat(
        (result.futurePriceCurve[i]! - result.costCurve[i]!).toFixed(2),
      );
      expect(result.profitSpace[i]).toBeCloseTo(expected, 1);
    }
  });

  it("totalProfit in profits is calculated from storageTons", () => {
    const storageTons = 2000;
    const result = calculateArbitrage(9.0, 0.2, 12.0, storageTons, 4, 6);
    const peak = result.profits.find((p) => p.month === result.maxProfitMonth);
    expect(peak).toBeDefined();
    // totalProfit (万元) = priceGap (元/kg) * storageTons * 1000 / 10000
    const expected = parseFloat(
      ((peak!.priceGap * storageTons * 1000) / 10000).toFixed(1),
    );
    expect(peak!.totalProfit).toBeCloseTo(expected, 0);
  });

  it("startMonth wraps around December correctly", () => {
    const result = calculateArbitrage(9.0, 0.2, 12.0, 1000, 11, 9);
    // Starting from November: 11, 12, 1, 2, 3, 4, 5, 6, 7
    expect(result.months[0]).toBe(11);
    expect(result.months[1]).toBe(12);
    expect(result.months[2]).toBe(1);
    expect(result.months[3]).toBe(2);
  });

  it("futurePriceCurve starts near spotPrice and rises over time", () => {
    const spotPrice = 9.0;
    const socialCost = 12.0;
    const result = calculateArbitrage(spotPrice, 0.2, socialCost, 1000, 4, 9);
    expect(result.futurePriceCurve[0]).toBeCloseTo(spotPrice, 0);
    const lastPoint = result.futurePriceCurve[result.futurePriceCurve.length - 1]!;
    expect(lastPoint).toBeGreaterThan(spotPrice);
  });

  it("shouldArbitrage matches profitSpace > 0 AND holdingCost < socialCost", () => {
    const result = calculateArbitrage(9.0, 0.2, 12.0, 1000, 4, 9);
    result.profits.forEach((p, i) => {
      const expected =
        result.profitSpace[i]! > 0 && result.costCurve[i]! < result.socialBreakevenCost;
      expect(p.shouldArbitrage).toBe(expected);
    });
  });

  it("storageTons affects totalProfit proportionally", () => {
    const a = calculateArbitrage(9.0, 0.2, 12.0, 1000, 4, 9);
    const b = calculateArbitrage(9.0, 0.2, 12.0, 2000, 4, 9);
    expect(b.maxTotalProfit).toBeCloseTo(a.maxTotalProfit * 2, 0);
  });

  it("buildArbitrageDecisionContext includes all new fields", () => {
    const ctx = buildArbitrageDecisionContext(9.0, 0.2, 12.0, 1000, 4, 6);
    expect(ctx.assumptions.socialBreakevenCost).toBe(12.0);
    expect(ctx.assumptions.storageTons).toBe(1000);
    expect(ctx.assumptions.startMonth).toBe(4);
    expect(ctx.assumptions.storageDurationMonths).toBe(6);
    expect(ctx.result.socialCostLine).toBeDefined();
    expect(ctx.result.profitSpace).toBeDefined();
  });

  it("buildArbitrageAgentDraft generates market analysis mentioning socialCost", () => {
    const draft = buildArbitrageAgentDraft(9.0, 0.2, 12.0, 1000, 4, 6);
    expect(draft.marketAnalysis).toContain("12");
    expect(draft.costRecommendation).toContain("1000");
    expect(Array.isArray(draft.decision)).toBe(true);
    expect(typeof draft.riskWarning).toBe("string");
  });

  it("capitalRequired is correctly reflected in riskWarning", () => {
    const storageTons = 500;
    const spotPrice = 10.0;
    const draft = buildArbitrageAgentDraft(spotPrice, 0.2, 12.0, storageTons, 4, 6);
    // Capital = 10 * 500 * 1000 / 10000 = 500 万元
    expect(draft.riskWarning).toContain("500");
  });
});
