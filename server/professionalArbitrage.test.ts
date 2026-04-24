import { describe, expect, it } from "vitest";
import { simulateProfessionalArbitrage } from "./professionalArbitrage";

describe("simulateProfessionalArbitrage", () => {
  it("returns a complete professional result across time, spatial, part and financial arbitrage", () => {
    const result = simulateProfessionalArbitrage({
      partCode: "pork_belly",
      batchCode: "CP-PK-240418-A1",
      spotPrice: 9.6,
      futuresPrice: 11.1,
      storageTons: 1200,
      storageDurationMonths: 6,
      riskProfile: "balanced",
    });

    expect(result.timeArbitrage.months).toHaveLength(6);
    expect(result.spatialArbitrage.scheduleSummary.totalShippedTon).toBeGreaterThan(0);
    expect(result.partArbitrage.partCode).toBe("pork_belly");
    expect(result.financialArbitrage.contractsNeeded).toBeGreaterThan(0);
    expect(result.portfolio.scoreCard.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.portfolio.scoreCard.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces professional part-lane formulas and finite economics", () => {
    const result = simulateProfessionalArbitrage({
      partCode: "rib",
      batchCode: "CP-PK-240418-B4",
      storageDurationMonths: 4,
      hedgeRatio: 0.82,
      riskProfile: "conservative",
    });

    expect(result.partArbitrage.formulaTrace.length).toBeGreaterThanOrEqual(6);
    expect(result.partArbitrage.drivers.length).toBeGreaterThanOrEqual(4);
    expect(Number.isFinite(result.partArbitrage.expectedProfitPerKg)).toBe(true);
    expect(Number.isFinite(result.partArbitrage.expectedTotalProfit)).toBe(true);
    expect(["fresh_sell", "freeze_store", "deep_process", "hedge_only", "hold"]).toContain(
      result.partArbitrage.recommendedLane,
    );
  });

  it("links hedge instructions to contract count, margin and rebalance controls", () => {
    const result = simulateProfessionalArbitrage({
      physicalExposureTons: 900,
      hedgeRatio: 0.7,
      marginRate: 0.12,
      contractSize: 16,
      maxCapital: 20_000_000,
      maxMarginUsage: 4_000_000,
    });

    expect(result.hedgeDecision.contractsNeeded).toBe(result.financialArbitrage.contractsNeeded);
    expect(result.hedgeDecision.marginRequired).toBe(result.financialArbitrage.totalMargin);
    expect(result.hedgeDecision.stopLossRule).toContain("基差");
    expect(result.hedgeDecision.rebalanceRule).toContain("再平衡");
  });

  it("keeps operation and audit outputs ready for system execution", () => {
    const result = simulateProfessionalArbitrage({ riskProfile: "aggressive" });

    expect(result.operationPlaybook).toHaveLength(6);
    expect(result.riskControlMatrix.length).toBeGreaterThanOrEqual(5);
    expect(result.auditTrail.map((item) => item.module)).toEqual([
      "时间套利",
      "空间套利",
      "部位套利",
      "金融套利与对冲",
      "组合决策",
    ]);
  });
});
