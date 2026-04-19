import { describe, expect, it } from "vitest";
import { buildAgentDecisionDraft, buildAiForecast, buildAlertBoard, buildDispatchBoard, buildWhatIfSimulation } from "./aiDecision";

describe("buildAiForecast", () => {
  it("returns eight forecast points and clamps selected month into range", () => {
    const result = buildAiForecast("CP-PK-240418-A1", 20, 15);

    expect(result.selectedMonth).toBe(8);
    expect(result.curve).toHaveLength(8);
    expect(result.curve[0]?.month).toBe(1);
    expect(result.curve[7]?.month).toBe(8);
  });

  it("uses the selected month summary from the generated curve", () => {
    const result = buildAiForecast("CP-PK-240418-A1", 3, 15.2);
    const selectedPoint = result.curve[2]!;

    expect(result.summary.projectedPrice).toBe(selectedPoint.projectedPrice);
    expect(result.summary.breakEvenPrice).toBe(selectedPoint.breakEvenPrice);
    expect(result.summary.totalProfit).toBe(selectedPoint.totalProfit);
  });

  it("changes projected outcome when target price changes", () => {
    const base = buildAiForecast("CP-PK-240418-A1", 4, 14.2);
    const optimistic = buildAiForecast("CP-PK-240418-A1", 4, 16.8);

    expect(optimistic.summary.projectedPrice).toBeGreaterThan(base.summary.projectedPrice);
    expect(optimistic.summary.totalProfit).toBeGreaterThan(base.summary.totalProfit);
  });
});

describe("buildWhatIfSimulation", () => {
  it("returns three resource windows and clamps scenario month", () => {
    const result = buildWhatIfSimulation("CP-PK-240418-A1", 9, 15, 12, 8);

    expect(result.selectedMonth).toBe(3);
    expect(result.resources).toHaveLength(3);
    expect(result.resources[0]?.month).toBe(1);
    expect(result.resources[2]?.month).toBe(3);
  });

  it("increases simulated profit when price and demand assumptions become more optimistic", () => {
    const conservative = buildWhatIfSimulation("CP-PK-240418-A1", 2, 14.4, 0, -5);
    const optimistic = buildWhatIfSimulation("CP-PK-240418-A1", 2, 16.2, 15, 12);

    expect(optimistic.summary.simulatedProfit).toBeGreaterThan(conservative.summary.simulatedProfit);
    expect(optimistic.summary.incrementalProfit).toBeGreaterThan(conservative.summary.incrementalProfit);
  });

  it("keeps resource plan outputs positive for all execution windows", () => {
    const result = buildWhatIfSimulation("CP-PK-240418-A1", 1, 15.8, 10, 10);

    result.resources.forEach(resource => {
      expect(resource.slaughterHeads).toBeGreaterThan(0);
      expect(resource.storageTons).toBeGreaterThan(0);
      expect(resource.warehousePallets).toBeGreaterThan(0);
      expect(resource.coldChainTrips).toBeGreaterThan(0);
    });
  });
});

describe("buildAgentDecisionDraft", () => {
  it("returns three layered agents with overview and dispatch summary", () => {
    const result = buildAgentDecisionDraft("CP-PK-240418-A1", 2, 15.5, 12, 8);

    expect(result.agents).toHaveLength(3);
    expect(result.overview).toContain("CP-PK-240418-A1");
    expect(result.dispatchSummary.length).toBeGreaterThan(10);
    expect(result.agents.map(agent => agent.agentId)).toEqual(["global", "business", "field"]);
  });

  it("escalates risk when utilization is too high or profit delta is strongly negative", () => {
    const result = buildAgentDecisionDraft("CP-PK-240418-A1", 3, 12.5, 80, -20);

    expect(["中", "高"]).toContain(result.agents[0]?.riskLevel);
  });
});

describe("buildAlertBoard", () => {
  it("returns six dynamic alerts with detail fields for root-cause dialogs", () => {
    const result = buildAlertBoard("CP-PK-240418-A1", 2, 15.5, 12, 8);

    expect(result.items).toHaveLength(6);
    expect(result.overview).toContain("6");
    expect(result.items[0]).toMatchObject({
      alertId: expect.any(String),
      title: expect.any(String),
      status: expect.any(String),
      summary: expect.any(String),
      impactScope: expect.any(String),
      estimatedLoss: expect.any(Number),
      aiRecommendation: expect.any(String),
      rootCause: expect.any(String),
      actionOwner: expect.any(String),
    });
  });

  it("raises more severe warning levels under stressed assumptions", () => {
    const stable = buildAlertBoard("CP-PK-240418-A1", 1, 16.5, 0, 5);
    const stressed = buildAlertBoard("CP-PK-240418-A1", 3, 12.5, 80, -20);

    const stableRedCount = stable.items.filter(item => item.status === "red").length;
    const stressedRedCount = stressed.items.filter(item => item.status === "red").length;

    expect(stressedRedCount).toBeGreaterThanOrEqual(stableRedCount);
  });
});

describe("buildDispatchBoard", () => {
  it("returns standardized work orders and role feedback states", () => {
    const result = buildDispatchBoard("CP-PK-240418-A1", 2, 15.5, 12, 8);

    expect(result.workOrders).toHaveLength(3);
    expect(result.feedback.map(item => item.role)).toEqual(["厂长", "司机", "仓储管理员"]);
    expect(result.workOrders[0]).toMatchObject({
      orderId: expect.any(String),
      factory: expect.any(String),
      quantity: expect.any(Number),
      scheduledTime: expect.any(String),
      acceptanceStandard: expect.any(String),
      priority: expect.any(String),
    });
  });

  it("marks escalation when risk is high enough", () => {
    const stable = buildDispatchBoard("CP-PK-240418-A1", 1, 16.5, 0, 5);
    const stressed = buildDispatchBoard("CP-PK-240418-A1", 3, 12.5, 80, -20);

    expect(stressed.escalation || stressed.feedback.some(item => item.status === "超时升级")).toBe(true);
    expect(stable.workOrders.length).toBe(3);
  });
});
