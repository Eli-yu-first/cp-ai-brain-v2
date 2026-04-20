import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TrpcContext } from "./_core/context";

const updateDispatchReceiptMock = vi.fn();
const getDispatchOrderByOrderIdMock = vi.fn();
const createAuditLogMock = vi.fn();
const sendEscalationNotificationsMock = vi.fn();

vi.mock("./db", () => ({
  createAuditLog: createAuditLogMock,
  getDispatchOrderByOrderId: getDispatchOrderByOrderIdMock,
  listDispatchReceiptsByBatch: vi.fn(async () => []),
  listPersistedAuditLogs: vi.fn(async () => []),
  persistDispatchPlan: vi.fn(async () => ({
    persisted: true,
    batchCode: "CP-PK-240418-A1",
    orderCount: 3,
  })),
  updateDispatchReceipt: updateDispatchReceiptMock,
}));

vi.mock("./escalationNotifier", () => ({
  sendEscalationNotifications: sendEscalationNotificationsMock,
}));

const { appRouter } = await import("./routers");

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "mobile-role-open-id",
      email: "mobile-role@example.com",
      name: "现场值班员",
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

describe("dispatch receipt workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDispatchReceiptMock.mockResolvedValue({ success: true });
    createAuditLogMock.mockImplementation(async (input: Record<string, unknown>) => ({
      id: "audit-1",
      ...input,
    }));
    getDispatchOrderByOrderIdMock.mockResolvedValue({
      orderId: "dispatch-001",
      batchCode: "CP-PK-240418-A1",
      factory: "华东冷库",
      quantity: 6,
      priority: "P1",
      scheduledLabel: "T+2 11:00",
      acceptanceStandard: "托盘位预留完成，入库扫码准确率100%",
      payloadJson: JSON.stringify({ storageTons: 0.28, warehousePallets: 6 }),
    });
    sendEscalationNotificationsMock.mockResolvedValue({
      wecom: "sent",
      sms: "sent",
      owner: "sent",
    });
  });

  it("records plant manager acknowledgement before execution progresses", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.platform.updateAiDispatchReceipt({
      orderId: "dispatch-001",
      role: "厂长",
      status: "已接单",
      etaMinutes: 25,
      note: "厂长已确认接单并锁定排班。",
      acknowledgedBy: "厂长-现场确认",
    });

    expect(updateDispatchReceiptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "dispatch-001",
        role: "厂长",
        status: "已接单",
      }),
    );
    expect(result.notifications).toEqual({ wecom: "skipped", sms: "skipped", owner: "skipped" });
  });

  it("records driver receipt completion without escalation notifications", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.platform.updateAiDispatchReceipt({
      orderId: "dispatch-001",
      role: "司机",
      status: "已完成",
      etaMinutes: 0,
      note: "司机已完成签收回执并留痕。",
      receiptBy: "司机-签收回执",
    });

    expect(updateDispatchReceiptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "dispatch-001",
        role: "司机",
        status: "已完成",
        receiptBy: "司机-签收回执",
      }),
    );
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "工单回执更新",
        decision: "司机 -> 已完成",
        status: "已执行",
      }),
    );
    expect(sendEscalationNotificationsMock).not.toHaveBeenCalled();
    expect(result.notifications).toEqual({ wecom: "skipped", sms: "skipped", owner: "skipped" });
  });

  it("escalates warehouse delay and triggers notification chain", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.platform.updateAiDispatchReceipt({
      orderId: "dispatch-001",
      role: "仓储管理员",
      status: "超时升级",
      etaMinutes: 90,
      note: "仓储管理员工单超时，已触发升级通知。",
      acknowledgedBy: "仓储管理员-现场确认",
    });

    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "工单超时升级",
        decision: "仓储管理员 -> 超时升级",
        riskLevel: "高",
        status: "待审批",
      }),
    );
    expect(sendEscalationNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        batchCode: "CP-PK-240418-A1",
        overview: expect.stringContaining("dispatch-001"),
      }),
    );
    expect(result.notifications).toEqual({ wecom: "sent", sms: "sent", owner: "sent" });
  });
});
