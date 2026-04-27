import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { simulatePredictionMarketInsurance } from "./predictionMarketInsurance";

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "prediction-insurance-test",
      email: "risk@example.com",
      name: "Risk Desk",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("simulatePredictionMarketInsurance", () => {
  it("decomposes a trade insurance policy into independent prediction-market positions", () => {
    const result = simulatePredictionMarketInsurance({
      shipmentValueGbp: 482_000,
      riskAppetite: "balanced",
    });

    expect(result.caseSummary.route).toContain("Qingdao");
    expect(result.positions).toHaveLength(13);
    expect(result.portfolio.independentPositions).toBe(13);
    expect(result.positions.some(position => position.market === "Polymarket")).toBe(true);
    expect(result.positions.some(position => position.market === "Kalshi")).toBe(true);
    expect(result.positions.some(position => position.market === "Self")).toBe(true);
    expect(result.premium.premiumReductionPct).toBeGreaterThanOrEqual(40);
  });

  it("triggers parameterized payouts according to verified delay thresholds", () => {
    const result = simulatePredictionMarketInsurance({ delayDays: 22 });

    expect(result.payoutLadder.find(item => item.delayDays === 10)?.triggered).toBe(true);
    expect(result.payoutLadder.find(item => item.delayDays === 20)?.triggered).toBe(true);
    expect(result.payoutLadder.find(item => item.delayDays === 30)?.triggered).toBe(false);
    expect(result.portfolio.settlementHours).toBe(72);
  });

  it("supports scoped hedging when an operator selects only a subset of factors", () => {
    const result = simulatePredictionMarketInsurance({
      selectedFactorIds: ["suez-closure", "cape-reroute", "boe-rate"],
      riskAppetite: "conservative",
    });

    expect(result.positions.map(position => position.id)).toEqual([
      "suez-closure",
      "cape-reroute",
      "boe-rate",
    ]);
    expect(result.portfolio.independentPositions).toBe(3);
    expect(result.audit.feasibility).toBeDefined();
  });

  it("exposes the simulation through the protected platform tRPC router", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.platform.predictionMarketInsuranceSimulate({
      shipmentValueGbp: 482_000,
      delayDays: 30,
      riskAppetite: "balanced",
    });

    expect(result.caseSummary.insuredName).toContain("青岛啤酒");
    expect(result.payoutLadder.find(item => item.delayDays === 30)?.triggered).toBe(true);
    expect(result.portfolio.settlementHours).toBe(72);
  });
});
