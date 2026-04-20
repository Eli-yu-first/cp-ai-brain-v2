import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  dispatchOrders,
  dispatchReceipts,
  InsertAuditLog,
  InsertDispatchOrder,
  InsertPorkInventorySnapshotRow,
  InsertPorkMarketSnapshotRow,
  InsertPorkPartQuoteSnapshotRow,
  InsertPorkPriceTickRow,
  InsertUser,
  notificationDeliveries,
  porkInventorySnapshotsTable,
  porkMarketSnapshotsTable,
  porkPartQuoteSnapshotsTable,
  porkPriceTicksTable,
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

type PersistableBenchmarkQuote = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  unit: string;
};

type PersistableFuturesQuote = {
  commodityCode: "live_hog_futures" | "corn_futures" | "soymeal_futures";
  contractCode: string;
  name: string;
  price: number;
  changeRate: number;
  unit: string;
};

type PersistableSpotQuote = PersistableBenchmarkQuote;

type PersistableRegionQuote = {
  regionCode: string;
  regionName: string;
  liveHogPrice: number;
  liveHogChange: number;
  cornPrice: number;
  cornChange: number;
  soymealPrice: number;
  soymealChange: number;
};

type PersistablePartQuote = {
  code: string;
  name: string;
  category: "A" | "B" | "C";
  spotPrice: number;
  frozenPrice: number;
  futuresMappedPrice: number;
  predictedPrice: number;
  basis: number;
  changeRate: number;
};

type PersistableInventoryBatch = {
  batchCode: string;
  partCode: string;
  partName: string;
  warehouse: string;
  weightKg: number;
  unitCost: number;
  ageDays: number;
  currentSpotPrice: number;
  futuresMappedPrice: number;
};

export type PorkMarketSnapshotPersistenceInput = {
  snapshotId: string;
  timeframe: string;
  selectedRegionCode: string;
  selectedRegionName: string;
  sourceStatus: "live" | "partial_fallback" | "fallback";
  sourceSummary: string;
  benchmarkQuotes: PersistableBenchmarkQuote[];
  commodityQuotes: {
    spot: PersistableSpotQuote[];
    futures: PersistableFuturesQuote[];
  };
  regionQuotes: PersistableRegionQuote[];
  allPartQuotes: PersistablePartQuote[];
  inventoryBatches: PersistableInventoryBatch[];
  generatedAt: number;
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

function scalePrice(value: number) {
  return Number.isFinite(value) ? Math.round(value * 1000) : 0;
}

function observedMinuteFrom(timestampMs: number) {
  return new Date(timestampMs).toISOString().slice(0, 16);
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "null";
  }
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
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

export async function persistPorkMarketSnapshot(input: PorkMarketSnapshotPersistenceInput) {
  const db = await getDb();
  if (!db) {
    return {
      persisted: false,
      snapshotId: input.snapshotId,
      priceTickCount: input.benchmarkQuotes.length + input.commodityQuotes.spot.length + input.commodityQuotes.futures.length + input.regionQuotes.length * 3 + input.allPartQuotes.length,
      partQuoteCount: input.allPartQuotes.length,
      inventoryCount: input.inventoryBatches.length,
    };
  }

  const observedMinute = observedMinuteFrom(input.generatedAt);
  const snapshotValues: InsertPorkMarketSnapshotRow = {
    snapshotId: truncate(input.snapshotId, 96),
    timeframe: truncate(input.timeframe, 32),
    regionCode: truncate(input.selectedRegionCode, 64),
    regionName: truncate(input.selectedRegionName, 128),
    sourceStatus: input.sourceStatus,
    sourceSummary: input.sourceSummary,
    benchmarkQuotesJson: safeJson(input.benchmarkQuotes),
    commodityQuotesJson: safeJson(input.commodityQuotes),
    regionQuotesJson: safeJson(input.regionQuotes),
    partQuotesJson: safeJson(input.allPartQuotes),
    inventoryBatchesJson: safeJson(input.inventoryBatches),
    generatedAtMs: String(input.generatedAt),
  };

  await db.insert(porkMarketSnapshotsTable).values(snapshotValues).onDuplicateKeyUpdate({
    set: {
      sourceStatus: snapshotValues.sourceStatus,
      sourceSummary: snapshotValues.sourceSummary,
      benchmarkQuotesJson: snapshotValues.benchmarkQuotesJson,
      commodityQuotesJson: snapshotValues.commodityQuotesJson,
      regionQuotesJson: snapshotValues.regionQuotesJson,
      partQuotesJson: snapshotValues.partQuotesJson,
      inventoryBatchesJson: snapshotValues.inventoryBatchesJson,
      generatedAtMs: snapshotValues.generatedAtMs,
    },
  });

  const priceTicks: InsertPorkPriceTickRow[] = [
    ...input.benchmarkQuotes.map(quote => ({
      tickKey: `${observedMinute}:benchmark:${quote.code}`,
      snapshotId: input.snapshotId,
      quoteType: "benchmark" as const,
      code: quote.code,
      name: quote.name,
      regionCode: input.selectedRegionCode,
      regionName: input.selectedRegionName,
      priceScaled: scalePrice(quote.price),
      changeScaled: scalePrice(quote.changeRate),
      unit: quote.unit,
      source: input.sourceSummary,
      observedMinute,
    })),
    ...input.commodityQuotes.spot.map(quote => ({
      tickKey: `${observedMinute}:spot:${quote.code}:${input.selectedRegionCode}`,
      snapshotId: input.snapshotId,
      quoteType: "spot" as const,
      code: quote.code,
      name: quote.name,
      regionCode: input.selectedRegionCode,
      regionName: input.selectedRegionName,
      priceScaled: scalePrice(quote.price),
      changeScaled: scalePrice(quote.changeRate),
      unit: quote.unit,
      source: input.sourceSummary,
      observedMinute,
    })),
    ...input.commodityQuotes.futures.map(quote => ({
      tickKey: `${observedMinute}:futures:${quote.commodityCode}:${quote.contractCode}`,
      snapshotId: input.snapshotId,
      quoteType: "futures" as const,
      code: quote.commodityCode,
      name: `${quote.name} ${quote.contractCode}`,
      regionCode: null,
      regionName: null,
      priceScaled: scalePrice(quote.price),
      changeScaled: scalePrice(quote.changeRate),
      unit: quote.unit,
      source: "Eastmoney futures",
      observedMinute,
    })),
    ...input.regionQuotes.flatMap(region => [
      {
        tickKey: `${observedMinute}:region:live_hog:${region.regionCode}`,
        snapshotId: input.snapshotId,
        quoteType: "region" as const,
        code: "live_hog",
        name: "区域生猪现货",
        regionCode: region.regionCode,
        regionName: region.regionName,
        priceScaled: scalePrice(region.liveHogPrice),
        changeScaled: scalePrice(region.liveHogChange),
        unit: "¥/kg",
        source: input.sourceSummary,
        observedMinute,
      },
      {
        tickKey: `${observedMinute}:region:corn:${region.regionCode}`,
        snapshotId: input.snapshotId,
        quoteType: "region" as const,
        code: "corn",
        name: "区域玉米现货",
        regionCode: region.regionCode,
        regionName: region.regionName,
        priceScaled: scalePrice(region.cornPrice),
        changeScaled: scalePrice(region.cornChange),
        unit: "¥/ton",
        source: input.sourceSummary,
        observedMinute,
      },
      {
        tickKey: `${observedMinute}:region:soymeal:${region.regionCode}`,
        snapshotId: input.snapshotId,
        quoteType: "region" as const,
        code: "soymeal",
        name: "区域豆粕现货",
        regionCode: region.regionCode,
        regionName: region.regionName,
        priceScaled: scalePrice(region.soymealPrice),
        changeScaled: scalePrice(region.soymealChange),
        unit: "¥/ton",
        source: input.sourceSummary,
        observedMinute,
      },
    ]),
    ...input.allPartQuotes.map(part => ({
      tickKey: `${observedMinute}:part:${part.code}:${input.selectedRegionCode}`,
      snapshotId: input.snapshotId,
      quoteType: "part" as const,
      code: part.code,
      name: part.name,
      regionCode: input.selectedRegionCode,
      regionName: input.selectedRegionName,
      priceScaled: scalePrice(part.spotPrice),
      changeScaled: scalePrice(part.changeRate),
      unit: "¥/kg",
      source: input.sourceSummary,
      observedMinute,
    })),
  ];

  for (const tick of priceTicks) {
    await db.insert(porkPriceTicksTable).values(tick).onDuplicateKeyUpdate({
      set: {
        snapshotId: tick.snapshotId,
        priceScaled: tick.priceScaled,
        changeScaled: tick.changeScaled,
        source: tick.source,
      },
    });
  }

  for (const part of input.allPartQuotes) {
    const values: InsertPorkPartQuoteSnapshotRow = {
      rowKey: `${input.snapshotId}:${part.code}`,
      snapshotId: input.snapshotId,
      partCode: part.code,
      partName: part.name,
      category: part.category,
      spotPriceScaled: scalePrice(part.spotPrice),
      frozenPriceScaled: scalePrice(part.frozenPrice),
      futuresMappedPriceScaled: scalePrice(part.futuresMappedPrice),
      predictedPriceScaled: scalePrice(part.predictedPrice),
      basisScaled: scalePrice(part.basis),
      changeScaled: scalePrice(part.changeRate),
    };
    await db.insert(porkPartQuoteSnapshotsTable).values(values).onDuplicateKeyUpdate({
      set: {
        spotPriceScaled: values.spotPriceScaled,
        frozenPriceScaled: values.frozenPriceScaled,
        futuresMappedPriceScaled: values.futuresMappedPriceScaled,
        predictedPriceScaled: values.predictedPriceScaled,
        basisScaled: values.basisScaled,
        changeScaled: values.changeScaled,
      },
    });
  }

  for (const batch of input.inventoryBatches) {
    const values: InsertPorkInventorySnapshotRow = {
      rowKey: `${input.snapshotId}:${batch.batchCode}`,
      snapshotId: input.snapshotId,
      batchCode: batch.batchCode,
      partCode: batch.partCode,
      partName: batch.partName,
      warehouse: batch.warehouse,
      weightKg: Math.round(batch.weightKg),
      unitCostScaled: scalePrice(batch.unitCost),
      ageDays: batch.ageDays,
      currentSpotPriceScaled: scalePrice(batch.currentSpotPrice),
      futuresMappedPriceScaled: scalePrice(batch.futuresMappedPrice),
    };
    await db.insert(porkInventorySnapshotsTable).values(values).onDuplicateKeyUpdate({
      set: {
        unitCostScaled: values.unitCostScaled,
        ageDays: values.ageDays,
        currentSpotPriceScaled: values.currentSpotPriceScaled,
        futuresMappedPriceScaled: values.futuresMappedPriceScaled,
      },
    });
  }

  return {
    persisted: true,
    snapshotId: input.snapshotId,
    priceTickCount: priceTicks.length,
    partQuoteCount: input.allPartQuotes.length,
    inventoryCount: input.inventoryBatches.length,
  };
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
