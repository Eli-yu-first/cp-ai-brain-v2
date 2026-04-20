import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

export const arbitrageRecords = mysqlTable("arbitrage_records", {
  id: int("id").autoincrement().primaryKey(),
  recordType: mysqlEnum("recordType", ["time", "spatial"]).notNull(),
  scenarioLabel: varchar("scenarioLabel", { length: 128 }).notNull(),
  paramsJson: text("paramsJson").notNull(),
  resultJson: text("resultJson").notNull(),
  summaryProfit: varchar("summaryProfit", { length: 64 }).notNull(),
  summaryMetric: varchar("summaryMetric", { length: 128 }).notNull(),
  operatorOpenId: varchar("operatorOpenId", { length: 64 }),
  operatorName: varchar("operatorName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cpVentureCompaniesTable = mysqlTable("cp_venture_companies", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  englishName: varchar("englishName", { length: 160 }).notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  stage: varchar("stage", { length: 64 }).notNull(),
  depth: int("depth").notNull(),
  x: int("x").notNull(),
  y: int("y").notNull(),
  relation: varchar("relation", { length: 160 }).notNull(),
  logoDomain: varchar("logoDomain", { length: 160 }),
  ownershipSummary: text("ownershipSummary"),
  boardRole: text("boardRole"),
  cpRole: text("cpRole").notNull(),
  participation: text("participation").notNull(),
  business: text("business").notNull(),
  synergy: text("synergy").notNull(),
  geography: varchar("geography", { length: 160 }).notNull(),
  evidence: text("evidence").notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cpVentureLinksTable = mysqlTable("cp_venture_links", {
  id: int("id").autoincrement().primaryKey(),
  linkId: varchar("linkId", { length: 192 }).notNull().unique(),
  source: varchar("source", { length: 96 }).notNull(),
  target: varchar("target", { length: 96 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  strength: int("strength").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const porkMarketSnapshotsTable = mysqlTable("pork_market_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotId: varchar("snapshotId", { length: 96 }).notNull().unique(),
  timeframe: varchar("timeframe", { length: 32 }).notNull(),
  regionCode: varchar("regionCode", { length: 64 }).notNull(),
  regionName: varchar("regionName", { length: 128 }).notNull(),
  sourceStatus: varchar("sourceStatus", { length: 64 }).notNull(),
  sourceSummary: text("sourceSummary").notNull(),
  benchmarkQuotesJson: text("benchmarkQuotesJson").notNull(),
  commodityQuotesJson: text("commodityQuotesJson").notNull(),
  regionQuotesJson: text("regionQuotesJson").notNull(),
  partQuotesJson: text("partQuotesJson").notNull(),
  inventoryBatchesJson: text("inventoryBatchesJson").notNull(),
  generatedAtMs: varchar("generatedAtMs", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const porkPriceTicksTable = mysqlTable("pork_price_ticks", {
  id: int("id").autoincrement().primaryKey(),
  tickKey: varchar("tickKey", { length: 192 }).notNull().unique(),
  snapshotId: varchar("snapshotId", { length: 96 }).notNull(),
  quoteType: mysqlEnum("quoteType", ["spot", "futures", "benchmark", "region", "part"]).notNull(),
  code: varchar("code", { length: 96 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  regionCode: varchar("regionCode", { length: 64 }),
  regionName: varchar("regionName", { length: 128 }),
  priceScaled: int("priceScaled").notNull(),
  changeScaled: int("changeScaled").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  observedMinute: varchar("observedMinute", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const porkPartQuoteSnapshotsTable = mysqlTable("pork_part_quote_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  rowKey: varchar("rowKey", { length: 192 }).notNull().unique(),
  snapshotId: varchar("snapshotId", { length: 96 }).notNull(),
  partCode: varchar("partCode", { length: 96 }).notNull(),
  partName: varchar("partName", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["A", "B", "C"]).notNull(),
  spotPriceScaled: int("spotPriceScaled").notNull(),
  frozenPriceScaled: int("frozenPriceScaled").notNull(),
  futuresMappedPriceScaled: int("futuresMappedPriceScaled").notNull(),
  predictedPriceScaled: int("predictedPriceScaled").notNull(),
  basisScaled: int("basisScaled").notNull(),
  changeScaled: int("changeScaled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const porkInventorySnapshotsTable = mysqlTable("pork_inventory_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  rowKey: varchar("rowKey", { length: 192 }).notNull().unique(),
  snapshotId: varchar("snapshotId", { length: 96 }).notNull(),
  batchCode: varchar("batchCode", { length: 96 }).notNull(),
  partCode: varchar("partCode", { length: 96 }).notNull(),
  partName: varchar("partName", { length: 128 }).notNull(),
  warehouse: varchar("warehouse", { length: 128 }).notNull(),
  weightKg: int("weightKg").notNull(),
  unitCostScaled: int("unitCostScaled").notNull(),
  ageDays: int("ageDays").notNull(),
  currentSpotPriceScaled: int("currentSpotPriceScaled").notNull(),
  futuresMappedPriceScaled: int("futuresMappedPriceScaled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const porkHogPriceDailyTable = mysqlTable("pork_hog_price_daily", {
  id: int("id").autoincrement().primaryKey(),
  priceDate: varchar("priceDate", { length: 32 }).notNull(),
  regionCode: varchar("regionCode", { length: 64 }).notNull(),
  regionName: varchar("regionName", { length: 128 }).notNull(),
  hogPriceScaled: int("hogPriceScaled").notNull(),
  hogChangeScaled: int("hogChangeScaled").notNull(),
  cornPriceScaled: int("cornPriceScaled").notNull(),
  cornChangeScaled: int("cornChangeScaled").notNull(),
  soymealPriceScaled: int("soymealPriceScaled").notNull(),
  soymealChangeScaled: int("soymealChangeScaled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const porkFuturesPriceTable = mysqlTable("pork_futures_price", {
  id: int("id").autoincrement().primaryKey(),
  contractMonth: varchar("contractMonth", { length: 32 }).notNull(),
  futuresPriceScaled: int("futuresPriceScaled").notNull(),
  settlementPriceScaled: int("settlementPriceScaled").notNull(),
  volume: int("volume").notNull(),
  openInterest: int("openInterest").notNull(),
  observedMinute: varchar("observedMinute", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryBatchesTable = mysqlTable("inventory_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchCode: varchar("batchCode", { length: 96 }).notNull().unique(),
  partCode: varchar("partCode", { length: 96 }).notNull(),
  partName: varchar("partName", { length: 128 }).notNull(),
  warehouseCode: varchar("warehouseCode", { length: 64 }).notNull(),
  warehouseName: varchar("warehouseName", { length: 128 }).notNull(),
  weightKg: int("weightKg").notNull(),
  unitCostScaled: int("unitCostScaled").notNull(),
  currentPriceScaled: int("currentPriceScaled").notNull(),
  storageEntryDate: varchar("storageEntryDate", { length: 32 }).notNull(),
  ageDays: int("ageDays").notNull(),
  expiryDate: varchar("expiryDate", { length: 32 }).notNull(),
  status: mysqlEnum("batchStatus", ["frozen", "selling", "expired", "cleared"]).notNull(),
  fifoPriority: int("fifoPriority").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const warehouseCapacityTable = mysqlTable("warehouse_capacity", {
  id: int("id").autoincrement().primaryKey(),
  warehouseCode: varchar("warehouseCode", { length: 64 }).notNull().unique(),
  warehouseName: varchar("warehouseName", { length: 128 }).notNull(),
  regionCode: varchar("regionCode", { length: 64 }).notNull(),
  regionName: varchar("regionName", { length: 128 }).notNull(),
  totalCapacityKg: int("totalCapacityKg").notNull(),
  currentOccupancyKg: int("currentOccupancyKg").notNull(),
  utilizationRate: int("utilizationRate").notNull(),
  temperatureZone: mysqlEnum("tempZone", ["cold", "frozen", "deep_frozen"]).notNull(),
  facilityType: mysqlEnum("facilityType", ["owned", "leased", "shared"]).notNull(),
  fixedCostMonthly: int("fixedCostMonthly").notNull(),
  variableCostPerKg: int("variableCostPerKg").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productionScheduleTable = mysqlTable("production_schedule", {
  id: int("id").autoincrement().primaryKey(),
  scheduleCode: varchar("scheduleCode", { length: 96 }).notNull().unique(),
  scenarioMonth: int("scenarioMonth").notNull(),
  factoryCode: varchar("factoryCode", { length: 64 }).notNull(),
  factoryName: varchar("factoryName", { length: 128 }).notNull(),
  productLine: mysqlEnum("productLine", ["slaughter", "cutting", "processing", "cold_storage"]).notNull(),
  scheduledQuantity: int("scheduledQuantity").notNull(),
  completedQuantity: int("completedQuantity").notNull(),
  executionRate: int("executionRate").notNull(),
  scheduledDate: varchar("scheduledDate", { length: 32 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: mysqlEnum("scheduleStatus", ["planned", "in_progress", "completed", "cancelled"]).notNull(),
  bottleneckStage: varchar("bottleneckStage", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supplyChainCostTable = mysqlTable("supply_chain_cost", {
  id: int("id").autoincrement().primaryKey(),
  costCode: varchar("costCode", { length: 96 }).notNull().unique(),
  costCategory: mysqlEnum("costCategory", [
    "breeding", "feed", "logistics", "storage", "processing",
    "capital", "inspection", "insurance", "tax", "other"
  ]).notNull(),
  costItem: varchar("costItem", { length: 128 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitCostScaled: int("unitCostScaled").notNull(),
  quantity: int("quantity").notNull(),
  totalCostScaled: int("totalCostScaled").notNull(),
  effectiveDate: varchar("effectiveDate", { length: 32 }).notNull(),
  expiryDate: varchar("expiryDate", { length: 32 }),
  regionCode: varchar("regionCode", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const priceForecastTable = mysqlTable("price_forecast", {
  id: int("id").autoincrement().primaryKey(),
  forecastCode: varchar("forecastCode", { length: 96 }).notNull().unique(),
  commodityCode: varchar("commodityCode", { length: 64 }).notNull(),
  commodityName: varchar("commodityName", { length: 128 }).notNull(),
  forecastDate: varchar("forecastDate", { length: 32 }).notNull(),
  forecastPeriod: mysqlEnum("forecastPeriod", ["1w", "2w", "1m", "3m", "6m"]).notNull(),
  predictedPriceScaled: int("predictedPriceScaled").notNull(),
  confidenceLevel: int("confidenceLevel").notNull(),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
  featureImportanceJson: text("featureImportanceJson"),
  actualPriceScaled: int("actualPriceScaled"),
  predictionErrorScaled: int("predictionErrorScaled"),
  accuracyScore: int("accuracyScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const arbitrageExecutionTable = mysqlTable("arbitrage_execution", {
  id: int("id").autoincrement().primaryKey(),
  executionCode: varchar("executionCode", { length: 96 }).notNull().unique(),
  arbitrageType: mysqlEnum("arbitrageType", [
    "time", "spatial", "entity", "financial",
    "transmission", "breeding", "zero_waste", "channel",
    "capacity", "cash_flow", "policy", "brand",
    "info", "counter_cyclical", "cross_border", "compliance",
    "joint", "green"
  ]).notNull(),
  scenarioLabel: varchar("scenarioLabel", { length: 128 }).notNull(),
  triggerStatus: mysqlEnum("triggerStatus", ["active", "watch", "inactive"]).notNull(),
  expectedReturnScaled: int("expectedReturnScaled").notNull(),
  actualReturnScaled: int("actualReturnScaled"),
  executionQuantity: int("executionQuantity").notNull(),
  executionPriceScaled: int("executionPriceScaled").notNull(),
  executionDate: varchar("executionDate", { length: 32 }).notNull(),
  closeDate: varchar("closeDate", { length: 32 }),
  status: mysqlEnum("executionStatus", ["opened", "closed", "cancelled"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["低", "中", "高"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const riskMetricsTable = mysqlTable("risk_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricCode: varchar("metricCode", { length: 96 }).notNull().unique(),
  metricName: varchar("metricName", { length: 128 }).notNull(),
  metricCategory: mysqlEnum("metricCategory", [
    "market", "credit", "operational", "compliance", "liquidity"
  ]).notNull(),
  metricValue: int("metricValue").notNull(),
  threshold: int("threshold").notNull(),
  status: mysqlEnum("metricStatus", ["normal", "warning", "critical"]).notNull(),
  trend: mysqlEnum("trend", ["up", "down", "stable"]).notNull(),
  observedDate: varchar("observedDate", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const salesOrdersTable = mysqlTable("sales_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderCode: varchar("orderCode", { length: 96 }).notNull().unique(),
  customerCode: varchar("customerCode", { length: 64 }).notNull(),
  customerName: varchar("customerName", { length: 128 }).notNull(),
  channel: mysqlEnum("channel", ["restaurant", "supermarket", "wholesale", "e_commerce", "processing"]).notNull(),
  partCode: varchar("partCode", { length: 64 }).notNull(),
  partName: varchar("partName", { length: 128 }).notNull(),
  quantityKg: int("quantityKg").notNull(),
  unitPriceScaled: int("unitPriceScaled").notNull(),
  totalAmountScaled: int("totalAmountScaled").notNull(),
  orderDate: varchar("orderDate", { length: 32 }).notNull(),
  deliveryDate: varchar("deliveryDate", { length: 32 }).notNull(),
  status: mysqlEnum("orderStatus", ["pending", "confirmed", "delivering", "delivered", "cancelled"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).notNull(),
  deliveryAddress: text("deliveryAddress"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const procurementOrdersTable = mysqlTable("procurement_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderCode: varchar("orderCode", { length: 96 }).notNull().unique(),
  supplierCode: varchar("supplierCode", { length: 64 }).notNull(),
  supplierName: varchar("supplierName", { length: 128 }).notNull(),
  commodityCode: varchar("commodityCode", { length: 64 }).notNull(),
  commodityName: varchar("commodityName", { length: 128 }).notNull(),
  quantityKg: int("quantityKg").notNull(),
  unitPriceScaled: int("unitPriceScaled").notNull(),
  totalAmountScaled: int("totalAmountScaled").notNull(),
  orderDate: varchar("orderDate", { length: 32 }).notNull(),
  expectedDeliveryDate: varchar("expectedDeliveryDate", { length: 32 }).notNull(),
  actualDeliveryDate: varchar("actualDeliveryDate", { length: 32 }),
  qualityCheckStatus: mysqlEnum("qualityStatus", ["pending", "passed", "rejected"]).notNull(),
  status: mysqlEnum("procurementStatus", ["pending", "confirmed", "delivered", "cancelled"]).notNull(),
  warehouseCode: varchar("warehouseCode", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const financialStatementsTable = mysqlTable("financial_statements", {
  id: int("id").autoincrement().primaryKey(),
  statementCode: varchar("statementCode", { length: 96 }).notNull().unique(),
  statementType: mysqlEnum("statementType", ["income", "balance", "cash_flow"]).notNull(),
  periodCode: varchar("periodCode", { length: 32 }).notNull(),
  periodName: varchar("periodName", { length: 128 }).notNull(),
  revenueScaled: int("revenueScaled").notNull(),
  costOfGoodsScaled: int("costOfGoodsScaled").notNull(),
  grossProfitScaled: int("grossProfitScaled").notNull(),
  operatingExpenseScaled: int("operatingExpenseScaled").notNull(),
  netProfitScaled: int("netProfitScaled").notNull(),
  totalAssetsScaled: int("totalAssetsScaled").notNull(),
  totalLiabilitiesScaled: int("totalLiabilitiesScaled").notNull(),
  totalEquityScaled: int("totalEquityScaled").notNull(),
  cashFlowFromOperationsScaled: int("cashFlowFromOperationsScaled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cashFlowForecastTable = mysqlTable("cash_flow_forecast", {
  id: int("id").autoincrement().primaryKey(),
  forecastCode: varchar("forecastCode", { length: 96 }).notNull().unique(),
  forecastDate: varchar("forecastDate", { length: 32 }).notNull(),
  cashInflowScaled: int("cashInflowScaled").notNull(),
  cashOutflowScaled: int("cashOutflowScaled").notNull(),
  netCashFlowScaled: int("netCashFlowScaled").notNull(),
  openingBalanceScaled: int("openingBalanceScaled").notNull(),
  closingBalanceScaled: int("closingBalanceScaled").notNull(),
  fundingGapScaled: int("fundingGapScaled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const policyIncentivesTable = mysqlTable("policy_incentives", {
  id: int("id").autoincrement().primaryKey(),
  policyCode: varchar("policyCode", { length: 96 }).notNull().unique(),
  policyName: varchar("policyName", { length: 256 }).notNull(),
  policyType: mysqlEnum("policyType", [
    "subsidy", "tax_reduction", "storage_support",
    "breeding_support", "insurance", "loan_support"
  ]).notNull(),
  applicableRegion: varchar("applicableRegion", { length: 128 }).notNull(),
  eligibleCriteria: text("eligibleCriteria").notNull(),
  subsidyAmountScaled: int("subsidyAmountScaled").notNull(),
  applicationDeadline: varchar("applicationDeadline", { length: 32 }),
  effectiveDate: varchar("effectiveDate", { length: 32 }).notNull(),
  expiryDate: varchar("expiryDate", { length: 32 }),
  status: mysqlEnum("policyStatus", ["active", "expired", "pending"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qualityInspectionTable = mysqlTable("quality_inspection", {
  id: int("id").autoincrement().primaryKey(),
  inspectionCode: varchar("inspectionCode", { length: 96 }).notNull().unique(),
  batchCode: varchar("batchCode", { length: 96 }).notNull(),
  inspectionType: mysqlEnum("inspectionType", [
    "entry", "process", "exit", "random"
  ]).notNull(),
  inspectionDate: varchar("inspectionDate", { length: 32 }).notNull(),
  inspectorName: varchar("inspectorName", { length: 128 }).notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  moisture: decimal("moisture", { precision: 5, scale: 2 }),
  bacteriaCount: int("bacteriaCount"),
  foreignMatter: decimal("foreignMatter", { precision: 5, scale: 2 }),
  colorScore: int("colorScore"),
  smellScore: int("smellScore"),
  overallResult: mysqlEnum("inspectionResult", ["passed", "rejected", "conditional"]).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const coldChainLogisticsTable = mysqlTable("cold_chain_logistics", {
  id: int("id").autoincrement().primaryKey(),
  logisticsCode: varchar("logisticsCode", { length: 96 }).notNull().unique(),
  orderCode: varchar("orderCode", { length: 96 }).notNull(),
  vehicleCode: varchar("vehicleCode", { length: 64 }).notNull(),
  driverName: varchar("driverName", { length: 128 }).notNull(),
  driverPhone: varchar("driverPhone", { length: 32 }).notNull(),
  originWarehouse: varchar("originWarehouse", { length: 128 }).notNull(),
  destination: varchar("destination", { length: 128 }).notNull(),
  cargoType: varchar("cargoType", { length: 64 }).notNull(),
  cargoWeightKg: int("cargoWeightKg").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  departureTime: timestamp("departureTime").notNull(),
  estimatedArrivalTime: timestamp("estimatedArrivalTime").notNull(),
  actualArrivalTime: timestamp("actualArrivalTime"),
  transportCostScaled: int("transportCostScaled").notNull(),
  lossRate: decimal("lossRate", { precision: 5, scale: 2 }),
  status: mysqlEnum("logisticsStatus", ["in_transit", "delivered", "delayed", "exception"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const brandCertificationTable = mysqlTable("brand_certification", {
  id: int("id").autoincrement().primaryKey(),
  certificationCode: varchar("certificationCode", { length: 96 }).notNull().unique(),
  certificationType: mysqlEnum("certificationType", [
    "green_food", "organic", "geographic_indication",
    "traceability", "quality_standard", "haccp"
  ]).notNull(),
  certificationName: varchar("certificationName", { length: 256 }).notNull(),
  issuingAuthority: varchar("issuingAuthority", { length: 128 }).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 128 }).notNull(),
  issueDate: varchar("issueDate", { length: 32 }).notNull(),
  expiryDate: varchar("expiryDate", { length: 32 }).notNull(),
  applicableProducts: text("applicableProducts").notNull(),
  premiumRate: int("premiumRate").notNull(),
  status: mysqlEnum("certStatus", ["active", "expired", "suspended"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supplierManagementTable = mysqlTable("supplier_management", {
  id: int("id").autoincrement().primaryKey(),
  supplierCode: varchar("supplierCode", { length: 64 }).notNull().unique(),
  supplierName: varchar("supplierName", { length: 256 }).notNull(),
  supplierType: mysqlEnum("supplierType", [
    "hog_breeding", "feed", "logistics", "storage",
    "processing", "equipment", "service"
  ]).notNull(),
  contactPerson: varchar("contactPerson", { length: 128 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  creditRating: mysqlEnum("creditRating", ["A", "B", "C", "D"]).notNull(),
  cooperationStartDate: varchar("cooperationStartDate", { length: 32 }).notNull(),
  annualTransactionAmountScaled: int("annualTransactionAmountScaled").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 64 }).notNull(),
  status: mysqlEnum("supplierStatus", ["active", "inactive", "blacklisted"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerManagementTable = mysqlTable("customer_management", {
  id: int("id").autoincrement().primaryKey(),
  customerCode: varchar("customerCode", { length: 64 }).notNull().unique(),
  customerName: varchar("customerName", { length: 256 }).notNull(),
  customerType: mysqlEnum("customerType", [
    "restaurant", "supermarket", "wholesale",
    "e_commerce", "processing", "retail"
  ]).notNull(),
  channel: mysqlEnum("channel", ["ho_re_ca", "retail", "e_commerce", "wholesale"]).notNull(),
  contactPerson: varchar("contactPerson", { length: 128 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }).notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  creditLimitScaled: int("creditLimitScaled").notNull(),
  currentCreditUsedScaled: int("currentCreditUsedScaled").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 64 }).notNull(),
  annualVolumeKg: int("annualVolumeKg").notNull(),
  lastOrderDate: varchar("lastOrderDate", { length: 32 }),
  status: mysqlEnum("customerStatus", ["active", "inactive", "blacklisted"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const capacityAllocationTable = mysqlTable("capacity_allocation", {
  id: int("id").autoincrement().primaryKey(),
  allocationCode: varchar("allocationCode", { length: 96 }).notNull().unique(),
  factoryCode: varchar("factoryCode", { length: 64 }).notNull(),
  factoryName: varchar("factoryName", { length: 128 }).notNull(),
  productLine: mysqlEnum("productLine", [
    "slaughter", "cutting", "processing", "cold_storage"
  ]).notNull(),
  allocatedCapacityKg: int("allocatedCapacityKg").notNull(),
  utilizedCapacityKg: int("utilizedCapacityKg").notNull(),
  utilizationRate: int("utilizationRate").notNull(),
  idleCapacityKg: int("idleCapacityKg").notNull(),
  idleCostSavingPotentialScaled: int("idleCostSavingPotentialScaled").notNull(),
  sharingEnabled: boolean("sharingEnabled").default(false).notNull(),
  allocationDate: varchar("allocationDate", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const environmentalMetricsTable = mysqlTable("environmental_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricCode: varchar("metricCode", { length: 96 }).notNull().unique(),
  facilityCode: varchar("facilityCode", { length: 64 }).notNull(),
  facilityName: varchar("facilityName", { length: 128 }).notNull(),
  metricType: mysqlEnum("metricType", [
    "energy", "water", "waste", "emission", "carbon"
  ]).notNull(),
  metricValue: int("metricValue").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  targetValue: int("targetValue").notNull(),
  complianceStatus: mysqlEnum("complianceStatus", ["compliant", "warning", "violation"]).notNull(),
  observedDate: varchar("observedDate", { length: 32 }).notNull(),
  costSavingScaled: int("costSavingScaled"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export type ArbitrageRecord = typeof arbitrageRecords.$inferSelect;
export type InsertArbitrageRecord = typeof arbitrageRecords.$inferInsert;
export type CpVentureCompanyRow = typeof cpVentureCompaniesTable.$inferSelect;
export type InsertCpVentureCompanyRow = typeof cpVentureCompaniesTable.$inferInsert;
export type CpVentureLinkRow = typeof cpVentureLinksTable.$inferSelect;
export type InsertCpVentureLinkRow = typeof cpVentureLinksTable.$inferInsert;
export type PorkMarketSnapshotRow = typeof porkMarketSnapshotsTable.$inferSelect;
export type InsertPorkMarketSnapshotRow = typeof porkMarketSnapshotsTable.$inferInsert;
export type InsertPorkPriceTickRow = typeof porkPriceTicksTable.$inferInsert;
export type InsertPorkPartQuoteSnapshotRow = typeof porkPartQuoteSnapshotsTable.$inferInsert;
export type InsertPorkInventorySnapshotRow = typeof porkInventorySnapshotsTable.$inferInsert;
export type InsertPorkHogPriceDailyRow = typeof porkHogPriceDailyTable.$inferInsert;
export type InsertPorkFuturesPriceRow = typeof porkFuturesPriceTable.$inferInsert;
export type InsertInventoryBatchRow = typeof inventoryBatchesTable.$inferInsert;
export type InsertWarehouseCapacityRow = typeof warehouseCapacityTable.$inferInsert;
export type InsertProductionScheduleRow = typeof productionScheduleTable.$inferInsert;
export type InsertSupplyChainCostRow = typeof supplyChainCostTable.$inferInsert;
export type InsertPriceForecastRow = typeof priceForecastTable.$inferInsert;
export type InsertArbitrageExecutionRow = typeof arbitrageExecutionTable.$inferInsert;
export type InsertRiskMetricRow = typeof riskMetricsTable.$inferInsert;
export type InsertSalesOrderRow = typeof salesOrdersTable.$inferInsert;
export type InsertProcurementOrderRow = typeof procurementOrdersTable.$inferInsert;
export type InsertFinancialStatementRow = typeof financialStatementsTable.$inferInsert;
export type InsertCashFlowForecastRow = typeof cashFlowForecastTable.$inferInsert;
export type InsertPolicyIncentiveRow = typeof policyIncentivesTable.$inferInsert;
export type InsertQualityInspectionRow = typeof qualityInspectionTable.$inferInsert;
export type InsertColdChainLogisticsRow = typeof coldChainLogisticsTable.$inferInsert;
export type InsertBrandCertificationRow = typeof brandCertificationTable.$inferInsert;
export type InsertSupplierManagementRow = typeof supplierManagementTable.$inferInsert;
export type InsertCustomerManagementRow = typeof customerManagementTable.$inferInsert;
export type InsertCapacityAllocationRow = typeof capacityAllocationTable.$inferInsert;
export type InsertEnvironmentalMetricRow = typeof environmentalMetricsTable.$inferInsert;
