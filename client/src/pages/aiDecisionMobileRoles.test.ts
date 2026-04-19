import { describe, expect, it } from "vitest";

import { buildMobileRoleView, getRoleStatusBadgeClass, type MobileRoleFeedback } from "./aiDecisionMobileRoles";

const baseFeedback: MobileRoleFeedback = {
  orderId: "dispatch-001",
  role: "厂长",
  status: "待确认",
  etaMinutes: 30,
  note: "等待确认执行。",
  priority: "P1",
};

describe("aiDecisionMobileRoles", () => {
  it("builds plant manager view with confirm and escalate actions", () => {
    const view = buildMobileRoleView({
      language: "zh",
      role: "厂长",
      feedback: baseFeedback,
      alertsCount: 3,
      projectedPrice: 15800,
      incrementalProfit: 42000,
      workOrderCount: 4,
    });

    expect(view.modeTitle).toBe("厂长模式");
    expect(view.summaryValue).toContain("3 条预警");
    expect(view.actions.map(action => action.status)).toEqual(["已接单", "超时升级"]);
  });

  it("builds driver view with delivery close-out action", () => {
    const view = buildMobileRoleView({
      language: "zh",
      role: "司机",
      feedback: {
        ...baseFeedback,
        role: "司机",
        status: "执行中",
        etaMinutes: 55,
      },
      alertsCount: 1,
      projectedPrice: 15600,
      incrementalProfit: 18000,
      workOrderCount: 2,
    });

    expect(view.modeTitle).toBe("司机模式");
    expect(view.summaryValue).toContain("55 分钟");
    expect(view.actions.map(action => action.label)).toContain("签收完成");
  });

  it("builds warehouse view with receipt action and note metric", () => {
    const view = buildMobileRoleView({
      language: "en",
      role: "仓储管理员",
      feedback: {
        ...baseFeedback,
        role: "仓储管理员",
        note: "Inbound pallet pending receipt.",
        priority: "P2",
      },
      alertsCount: 2,
      projectedPrice: 15000,
      incrementalProfit: 12000,
      workOrderCount: 3,
    });

    expect(view.modeTitle).toBe("Warehouse mode");
    expect(view.secondaryMetricValue).toBe("Inbound pallet pending receipt.");
    expect(view.actions.map(action => action.label)).toContain("Submit receipt");
  });

  it("returns badge classes by status severity", () => {
    expect(getRoleStatusBadgeClass("超时升级")).toContain("rose");
    expect(getRoleStatusBadgeClass("执行中")).toContain("amber");
    expect(getRoleStatusBadgeClass("已完成")).toContain("emerald");
  });
});
