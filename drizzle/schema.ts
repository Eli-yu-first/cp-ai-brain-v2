import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 128 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  relatedOrderId: varchar("relatedOrderId", { length: 64 }),
  operatorRole: mysqlEnum("operatorRole", ["admin", "strategist", "executor"]).notNull(),
  operatorName: varchar("operatorName", { length: 128 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["低", "中", "高"]).notNull(),
  decision: text("decision").notNull(),
  beforeValue: text("beforeValue").notNull(),
  afterValue: text("afterValue").notNull(),
  status: mysqlEnum("status", ["已确认", "待审批", "已执行"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dispatchOrders = mysqlTable("dispatch_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().unique(),
  batchCode: varchar("batchCode", { length: 64 }).notNull(),
  scenarioMonth: int("scenarioMonth").notNull(),
  factory: varchar("factory", { length: 128 }).notNull(),
  quantity: int("quantity").notNull(),
  scheduledLabel: varchar("scheduledLabel", { length: 64 }).notNull(),
  acceptanceStandard: text("acceptanceStandard").notNull(),
  priority: mysqlEnum("priority", ["P1", "P2", "P3"]).notNull(),
  payloadJson: text("payloadJson").notNull(),
  currentStatus: mysqlEnum("currentStatus", ["待确认", "已接单", "执行中", "已完成", "超时升级"]).notNull(),
  isEscalated: int("isEscalated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dispatchReceipts = mysqlTable("dispatch_receipts", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["厂长", "司机", "仓储管理员"]).notNull(),
  status: mysqlEnum("status", ["待确认", "已接单", "执行中", "已完成", "超时升级"]).notNull(),
  etaMinutes: int("etaMinutes").notNull(),
  note: text("note").notNull(),
  acknowledgedBy: varchar("acknowledgedBy", { length: 128 }),
  acknowledgedAt: timestamp("acknowledgedAt"),
  receiptBy: varchar("receiptBy", { length: 128 }),
  receiptAt: timestamp("receiptAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notificationDeliveries = mysqlTable("notification_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", ["wecom", "sms", "owner"]).notNull(),
  relatedAlertId: varchar("relatedAlertId", { length: 64 }),
  relatedOrderId: varchar("relatedOrderId", { length: 64 }),
  targetLabel: varchar("targetLabel", { length: 128 }).notNull(),
  payloadSummary: text("payloadSummary").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "failed", "skipped"]).notNull(),
  providerMessageId: varchar("providerMessageId", { length: 128 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type DispatchOrder = typeof dispatchOrders.$inferSelect;
export type InsertDispatchOrder = typeof dispatchOrders.$inferInsert;
export type DispatchReceipt = typeof dispatchReceipts.$inferSelect;
export type InsertDispatchReceipt = typeof dispatchReceipts.$inferInsert;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type InsertNotificationDelivery = typeof notificationDeliveries.$inferInsert;
