import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { simulateFuturesStorageDecision } from "./futuresStorageDecision";

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "futures-storage-test",
      email: "storage@example.com",
      name: "Storage Desk",
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

describe("simulateFuturesStorageDecision", () => {
  it("computes the storage threshold from cost, storage fee and suggested months", () => {
    const result = simulateFuturesStorageDecision({
      currentHogPrice: 9.57,
      industryAverageCost: 12,
      monthlyStorageFee: 0.22075,
      storageMonths: 3,
    });

    expect(result.metrics.storageThreshold).toBe(11.33775);
    expect(result.metrics.recommendation).toBe("收储窗口开启");
    expect(result.metrics.suggestedMonths).toBe(3);
    expect(result.futuresCurve.filter(item => item.isStorageWindow)).toHaveLength(3);
  });

  it("moves to a safer mode when cost pressure rises", () => {
    const base = simulateFuturesStorageDecision({ mode: "base" });
    const costUp = simulateFuturesStorageDecision({ mode: "cost_up" });

    expect(costUp.inputs.industryAverageCost).toBeGreaterThan(base.inputs.industryAverageCost);
    expect(costUp.warning.lines).toHaveLength(3);
    expect(costUp.ai.auditNotes.length).toBeGreaterThanOrEqual(3);
  });

  it("builds batch-level battle plans from inventory economics", () => {
    const result = simulateFuturesStorageDecision({
      batchCode: "CP-PK-240418-A1",
      customHoldDays: 45,
    });

    expect(result.batch.batchCode).toBe("CP-PK-240418-A1");
    expect(result.plans.map(plan => plan.key)).toEqual([
      "sell_now",
      "hold_1m",
      "hold_2m",
      "hold_3m",
      "custom",
    ]);
    expect(result.selectedPlan.netIncome).toEqual(
      Math.round(result.selectedPlan.netProfitPerKg * result.batch.weightKg),
    );
    expect(result.pricePrediction).toHaveLength(7);
    expect(result.workflow.at(-1)?.stage).toBe("待操作");
  });

  it("exposes the decision model through the protected platform tRPC router", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.platform.futuresStorageDecisionSimulate({
      currentHogPrice: 9.57,
      storageMonths: 3,
    });

    expect(result.algorithm.formula).toContain("行业平均成本");
    expect(result.chartData.length).toBeGreaterThanOrEqual(10);
    expect(result.ai.feasibility).toBe("可执行");
  });
});
