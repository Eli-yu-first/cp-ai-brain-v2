import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  dispatchOrders,
  dispatchReceipts,
  InsertAuditLog,
  InsertDispatchOrder,
  InsertUser,
  notificationDeliveries,
  users,
} from "../drizzle/schema";
import type { AuditEntry } from "./platformData";
import type { DispatchFeedbackItem, DispatchWorkOrder } from "./aiDecision";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type DispatchPlanPersistenceInput = {
  batchCode: string;
  scenarioMonth: number;
  escalation: boolean;
  summary: string;
  workOrders: DispatchWorkOrder[];
  feedback: DispatchFeedbackItem[];
  operatorName: string;
  operatorRole: AuditEntry["operatorRole"];
};

export type DispatchReceiptUpdateInput = {
  orderId: string;
  role: DispatchFeedbackItem["role"];
  status: DispatchFeedbackItem["status"];
  etaMinutes: number;
  note: string;
  acknowledgedBy?: string;
  receiptBy?: string;
};

export type NotificationDeliveryInput = {
  channel: "wecom" | "sms" | "owner";
  relatedAlertId?: string;
  relatedOrderId?: string;
  targetLabel: string;
  payloadSummary: string;
  deliveryStatus: "pending" | "sent" | "failed" | "skipped";
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
};

function formatAuditId(id: number) {
  return `AUD-${String(id).padStart(3, "0")}`;
}

function toAuditEntry(row: typeof auditLogs.$inferSelect): AuditEntry {
  return {
    id: formatAuditId(row.id),
    actionType: row.actionType,
    entityType: row.entityType,
    entityId: row.entityId,
    operatorRole: row.operatorRole,
    operatorName: row.operatorName,
    riskLevel: row.riskLevel,
    decision: row.decision,
    beforeValue: row.beforeValue,
    afterValue: row.afterValue,
    createdAt: row.createdAt.getTime(),
    status: row.status,
  };
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listPersistedAuditLogs() {
  const db = await getDb();
  if (!db) {
    return [] as AuditEntry[];
  }

  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  return rows.map(toAuditEntry);
}

export async function createAuditLog(entry: Omit<InsertAuditLog, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.insert(auditLogs).values(entry);
  const insertedId = Number(result[0].insertId);
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.id, insertedId)).limit(1);
  return rows[0] ? toAuditEntry(rows[0]) : undefined;
}

export async function persistDispatchPlan(input: DispatchPlanPersistenceInput) {
  const db = await getDb();
  if (!db) {
    return {
      persisted: false,
      orderCount: input.workOrders.length,
      receiptCount: input.feedback.length,
    };
  }

  for (const workOrder of input.workOrders) {
    const currentStatus = mapRoleStatusByOrder(workOrder.orderId, input.feedback);
    const values: InsertDispatchOrder = {
      orderId: workOrder.orderId,
      batchCode: input.batchCode,
      scenarioMonth: input.scenarioMonth,
      factory: workOrder.factory,
      quantity: workOrder.quantity,
      scheduledLabel: workOrder.scheduledTime,
      acceptanceStandard: workOrder.acceptanceStandard,
      priority: workOrder.priority,
      payloadJson: JSON.stringify(workOrder.payload),
      currentStatus,
      isEscalated: input.escalation ? 1 : 0,
    };

    await db.insert(dispatchOrders).values(values).onDuplicateKeyUpdate({
      set: {
        batchCode: values.batchCode,
        scenarioMonth: values.scenarioMonth,
        factory: values.factory,
        quantity: values.quantity,
        scheduledLabel: values.scheduledLabel,
        acceptanceStandard: values.acceptanceStandard,
        priority: values.priority,
        payloadJson: values.payloadJson,
        currentStatus: values.currentStatus,
        isEscalated: values.isEscalated,
      },
    });
  }

  for (const workOrder of input.workOrders) {
    await db.delete(dispatchReceipts).where(eq(dispatchReceipts.orderId, workOrder.orderId));
  }

  for (const feedback of input.feedback) {
    const orderId = mapOrderIdByRole(feedback.role, input.workOrders);
    if (!orderId) continue;

    await db.insert(dispatchReceipts).values({
      orderId,
      role: feedback.role,
      status: feedback.status,
      etaMinutes: feedback.etaMinutes,
      note: feedback.note,
      acknowledgedBy: feedback.status === "待确认" ? null : input.operatorName,
      acknowledgedAt: feedback.status === "待确认" ? null : new Date(),
      receiptBy: feedback.status === "已完成" ? input.operatorName : null,
      receiptAt: feedback.status === "已完成" ? new Date() : null,
    });
  }

  await createAuditLog({
    actionType: input.escalation ? "AI派单升级" : "AI派单生成",
    entityType: "DispatchPlan",
    entityId: `${input.batchCode}-${input.scenarioMonth}`,
    relatedOrderId: input.workOrders[0]?.orderId ?? null,
    operatorRole: input.operatorRole,
    operatorName: input.operatorName,
    riskLevel: input.escalation ? "高" : "中",
    decision: input.summary,
    beforeValue: "状态=系统推演完成; 派单=未落库",
    afterValue: `状态=已落库; 工单数=${input.workOrders.length}; 回执数=${input.feedback.length}`,
    status: input.escalation ? "待审批" : "已确认",
  });

  return {
    persisted: true,
    orderCount: input.workOrders.length,
    receiptCount: input.feedback.length,
  };
}

export async function updateDispatchReceipt(input: DispatchReceiptUpdateInput) {
  const db = await getDb();
  if (!db) {
    return { updated: false };
  }

  const existing = await db
    .select()
    .from(dispatchReceipts)
    .where(and(eq(dispatchReceipts.orderId, input.orderId), eq(dispatchReceipts.role, input.role)))
    .limit(1);

  const now = new Date();

  if (existing.length === 0) {
    await db.insert(dispatchReceipts).values({
      orderId: input.orderId,
      role: input.role,
      status: input.status,
      etaMinutes: input.etaMinutes,
      note: input.note,
      acknowledgedBy: input.acknowledgedBy ?? null,
      acknowledgedAt: input.acknowledgedBy ? now : null,
      receiptBy: input.receiptBy ?? null,
      receiptAt: input.receiptBy ? now : null,
    });
  } else {
    await db
      .update(dispatchReceipts)
      .set({
        status: input.status,
        etaMinutes: input.etaMinutes,
        note: input.note,
        acknowledgedBy: input.acknowledgedBy ?? existing[0].acknowledgedBy,
        acknowledgedAt: input.acknowledgedBy ? now : existing[0].acknowledgedAt,
        receiptBy: input.receiptBy ?? existing[0].receiptBy,
        receiptAt: input.receiptBy ? now : existing[0].receiptAt,
      })
      .where(eq(dispatchReceipts.id, existing[0].id));
  }

  await db
    .update(dispatchOrders)
    .set({
      currentStatus: input.status,
      isEscalated: input.status === "超时升级" ? 1 : undefined,
    })
    .where(eq(dispatchOrders.orderId, input.orderId));

  return { updated: true };
}

export async function listDispatchReceiptsByBatch(batchCode: string) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const orders = await db.select().from(dispatchOrders).where(eq(dispatchOrders.batchCode, batchCode));
  const result: Array<{
    orderId: string;
    batchCode: string;
    currentStatus: string;
    priority: string;
    receipts: Array<typeof dispatchReceipts.$inferSelect>;
  }> = [];

  for (const order of orders) {
    const receipts = await db
      .select()
      .from(dispatchReceipts)
      .where(eq(dispatchReceipts.orderId, order.orderId))
      .orderBy(desc(dispatchReceipts.updatedAt));

    result.push({
      orderId: order.orderId,
      batchCode: order.batchCode,
      currentStatus: order.currentStatus,
      priority: order.priority,
      receipts,
    });
  }

  return result;
}

export async function recordNotificationDelivery(input: NotificationDeliveryInput) {
  const db = await getDb();
  if (!db) {
    return { recorded: false };
  }

  await db.insert(notificationDeliveries).values({
    channel: input.channel,
    relatedAlertId: input.relatedAlertId ?? null,
    relatedOrderId: input.relatedOrderId ?? null,
    targetLabel: input.targetLabel,
    payloadSummary: input.payloadSummary,
    deliveryStatus: input.deliveryStatus,
    providerMessageId: input.providerMessageId ?? null,
    errorMessage: input.errorMessage ?? null,
    sentAt: input.sentAt ?? null,
  });

  return { recorded: true };
}

export async function getDispatchOrderByOrderId(orderId: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const rows = await db.select().from(dispatchOrders).where(eq(dispatchOrders.orderId, orderId)).limit(1);
  return rows[0];
}

function mapOrderIdByRole(role: DispatchFeedbackItem["role"], workOrders: DispatchWorkOrder[]) {
  if (role === "厂长") return workOrders[0]?.orderId;
  if (role === "司机") return workOrders[1]?.orderId;
  return workOrders[2]?.orderId;
}

function mapRoleStatusByOrder(orderId: string, feedback: DispatchFeedbackItem[]) {
  if (orderId.includes("-F-")) return feedback.find(item => item.role === "厂长")?.status ?? "待确认";
  if (orderId.includes("-C-")) return feedback.find(item => item.role === "司机")?.status ?? "待确认";
  return feedback.find(item => item.role === "仓储管理员")?.status ?? "待确认";
}


// ========== Arbitrage Records (Time/Spatial) ==========
import { arbitrageRecords, type ArbitrageRecord, type InsertArbitrageRecord } from "../drizzle/schema";

export type ArbitrageRecordInput = {
  recordType: "time" | "spatial";
  scenarioLabel: string;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
  summaryProfit: string;
  summaryMetric: string;
  operatorOpenId?: string;
  operatorName?: string;
};

export async function createArbitrageRecord(input: ArbitrageRecordInput): Promise<ArbitrageRecord | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const values: InsertArbitrageRecord = {
      recordType: input.recordType,
      scenarioLabel: input.scenarioLabel.slice(0, 128),
      paramsJson: JSON.stringify(input.params),
      resultJson: JSON.stringify(input.result),
      summaryProfit: input.summaryProfit.slice(0, 64),
      summaryMetric: input.summaryMetric.slice(0, 128),
      operatorOpenId: input.operatorOpenId?.slice(0, 64),
      operatorName: input.operatorName?.slice(0, 128),
    };
    const [res] = await db.insert(arbitrageRecords).values(values);
    const insertedId = (res as { insertId?: number }).insertId;
    if (!insertedId) return null;
    const rows = await db.select().from(arbitrageRecords).where(eq(arbitrageRecords.id, insertedId)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to create arbitrage record:", error);
    return null;
  }
}

export async function listArbitrageRecords(options?: {
  recordType?: "time" | "spatial";
  limit?: number;
}): Promise<ArbitrageRecord[]> {
  const db = await getDb();
  if (!db) return [];
  const limit = Math.max(1, Math.min(200, options?.limit ?? 50));
  try {
    if (options?.recordType) {
      return await db.select().from(arbitrageRecords)
        .where(eq(arbitrageRecords.recordType, options.recordType))
        .orderBy(desc(arbitrageRecords.createdAt))
        .limit(limit);
    }
    return await db.select().from(arbitrageRecords)
      .orderBy(desc(arbitrageRecords.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to list arbitrage records:", error);
    return [];
  }
}
