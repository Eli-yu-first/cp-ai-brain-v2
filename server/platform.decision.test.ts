import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { calculateDecision, inventoryBatches } from "./platformData";

vi.mock("./marketData", () => ({
  buildPorkMarketSnapshot: vi.fn(async () => ({
    allPartQuotes: [],
    benchmarkQuotes: [],
    inventoryBatches,
    basisHistory: [],
    freshFrozenSpreadHistory: [],
    regionOptions: [{ code: "national", name: "全国" }],
    regionQuotes: [],
    commodityQuotes: { spot: [], futures: [] },
    timelineLabels: [],
    selectedRegionCode: "national",
    selectedRegionName: "全国",
    timeframe: "month",
    chainMetrics: [],
    businessCards: [],
    spotlightParts: [],
    tenantOptions: [],
    roleProfiles: [],
    generatedAt: Date.now(),
  })),
  buildLiveDecisionScenarios: vi.fn(async (batchCode: string) => {
    const batch = inventoryBatches.find(item => item.batchCode === batchCode) ?? inventoryBatches[0]!;
    return {
      batch,
      scenarios: [1, 2, 3].map(month => calculateDecision(batch, month as 1 | 2 | 3)),
      snapshot: null,
    };
  }),
}));

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("platform quant engine", () => {
  it("returns an explicit hold or sell action from formulas", () => {
    const scenario = calculateDecision(inventoryBatches[0]!, 1);

    expect(["持有", "出售"]).toContain(scenario.action);
    expect(typeof scenario.netProfitPerKg).toBe("number");
    expect(scenario.formula).toContain("净收益");
  });

  it("marks high-risk confirmations as pending approval in audit logs", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const scenarios = await caller.platform.scenarios({ batchCode: "CP-PK-240418-C7" });
    const highRiskScenario = scenarios.scenarios[2]!;

    expect(highRiskScenario.riskLevel).toBe("高");

    const result = await caller.platform.confirmDecision({
      batchCode: "CP-PK-240418-C7",
      scenarioId: highRiskScenario.scenarioId,
      operatorRole: "strategist",
      operatorName: "量化决策官",
    });

    expect(result.success).toBe(true);
    expect(result.audit.status).toBe("待审批");
    expect(result.audit.riskLevel).toBe("高");
  });
});
