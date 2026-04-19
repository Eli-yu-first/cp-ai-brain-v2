export type Locale = "zh" | "en" | "ja" | "th";
export type Timeframe = "day" | "week" | "month" | "quarter" | "halfYear" | "year";
export type RoleCode = "admin" | "strategist" | "executor";

export type ChainMetric = {
  code: string;
  label: string;
  value: number;
  unit: string;
  delta: number;
  trend: "up" | "down";
  description: string;
};

export type BusinessCard = {
  id: string;
  name: string;
  highlight: string;
  unit: string;
  delta: number;
  accent: string;
  detail: string;
};

export type PartQuote = {
  code: string;
  name: string;
  englishName: string;
  category: "A" | "B" | "C";
  spotPrice: number;
  frozenPrice: number;
  futuresMappedPrice: number;
  predictedPrice: number;
  basis: number;
  changeRate: number;
  sparkline: number[];
  histories: Record<Timeframe, number[]>;
};

export type BenchmarkQuote = {
  code: string;
  name: string;
  englishName: string;
  price: number;
  changeRate: number;
  unit: string;
};

export type InventoryBatch = {
  batchCode: string;
  partCode: string;
  partName: string;
  warehouse: string;
  weightKg: number;
  unitCost: number;
  ageDays: number;
  concentration: number;
  currentSpotPrice: number;
  futuresMappedPrice: number;
  seasonalAdjustment: number;
  supplyAdjustment: number;
  storageCostPerMonth: number;
  capitalCostPerMonth: number;
  lossCostPerMonth: number;
};

export type DecisionScenario = {
  scenarioId: string;
  batchCode: string;
  partCode: string;
  holdMonths: 1 | 2 | 3;
  currentUnitCost: number;
  futureHoldingCost: number;
  breakEvenPrice: number;
  expectedSellPrice: number;
  netProfitPerKg: number;
  decisionThreshold: number;
  action: "持有" | "出售";
  riskScore: number;
  riskLevel: "低" | "中" | "高";
  formula: string;
  reason: string;
};

export type AuditEntry = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  operatorRole: RoleCode;
  operatorName: string;
  riskLevel: "低" | "中" | "高";
  decision: string;
  beforeValue: string;
  afterValue: string;
  createdAt: number;
  status: "已确认" | "待审批" | "已执行";
};

const seedMetrics: ChainMetric[] = [
  {
    code: "seed_coverage",
    label: "种子与种植覆盖",
    value: 50,
    unit: "万亩",
    delta: 4.2,
    trend: "up",
    description: "自有种植与订单农业协同面积",
  },
  {
    code: "feed_capacity",
    label: "饲料产能",
    value: 1000,
    unit: "万吨/年",
    delta: 5.8,
    trend: "up",
    description: "全国饲料产线综合产能",
  },
  {
    code: "hog_output",
    label: "生猪年出栏",
    value: 500,
    unit: "万头",
    delta: 3.1,
    trend: "up",
    description: "猪事业部年度出栏规模",
  },
  {
    code: "broiler_output",
    label: "白羽肉鸡屠宰量",
    value: 300,
    unit: "百万只",
    delta: 2.4,
    trend: "up",
    description: "鸡事业部白羽肉鸡处理规模",
  },
  {
    code: "layer_inventory",
    label: "蛋鸡存栏",
    value: 2580,
    unit: "万只",
    delta: 1.2,
    trend: "up",
    description: "蛋鸡业务在栏规模",
  },
  {
    code: "deep_processing_sku",
    label: "深加工 SKU",
    value: 1200,
    unit: "个",
    delta: 6.5,
    trend: "up",
    description: "深加工产品矩阵规模",
  },
  {
    code: "cold_storage",
    label: "仓储冷冻容量",
    value: 86,
    unit: "万吨",
    delta: -1.8,
    trend: "down",
    description: "当前冷库可调配总容量",
  },
  {
    code: "cold_chain_otif",
    label: "冷链履约率",
    value: 98.2,
    unit: "%",
    delta: 0.9,
    trend: "up",
    description: "准时完整交付率",
  },
  {
    code: "sales_index",
    label: "销售动销指数",
    value: 112.6,
    unit: "pts",
    delta: 3.7,
    trend: "up",
    description: "零售与渠道综合动销表现",
  },
];

export const businessCards: BusinessCard[] = [
  {
    id: "pork",
    name: "猪事业部",
    highlight: "500",
    unit: "万头年出栏",
    delta: 3.1,
    accent: "from-cyan-500/20 to-blue-500/10",
    detail: "23 部位经营、库存与套利决策中枢",
  },
  {
    id: "poultry",
    name: "鸡事业部",
    highlight: "300",
    unit: "百万只屠宰量",
    delta: 2.4,
    accent: "from-violet-500/20 to-fuchsia-500/10",
    detail: "白羽肉鸡、蛋鸡存栏与渠道履约管理",
  },
  {
    id: "feed",
    name: "饲料事业部",
    highlight: "1000",
    unit: "万吨/年产能",
    delta: 5.8,
    accent: "from-emerald-500/20 to-teal-500/10",
    detail: "产能利用率、原料库存和成本波动联动",
  },
];

const partDefinitions = [
  ["live_hog", "毛猪", "Live Hog", "A", 15.2, 15.8, 16.2, 16.8, 1.2, 2.1],
  ["carcass", "白条", "Carcass", "A", 19.8, 20.3, 20.8, 21.6, 1.4, 2.5],
  ["frozen_whole", "冷冻", "Frozen", "A", 17.5, 18.0, 18.6, 19.0, 1.0, 1.8],
  ["pork_belly", "五花", "Pork Belly", "A", 27.8, 28.9, 29.6, 30.4, 1.8, 2.6],
  ["spare_ribs", "排骨", "Spare Ribs", "A", 34.2, 35.1, 35.7, 36.8, 1.5, 1.9],
  ["loin", "里脊", "Loin", "A", 31.6, 32.2, 33.1, 34.1, 1.4, 2.2],
  ["ham", "后腿", "Ham", "A", 24.6, 25.4, 26.2, 27.1, 1.3, 1.4],
  ["shoulder", "前腿", "Shoulder", "A", 23.8, 24.6, 25.4, 26.4, 1.6, 1.8],
  ["collar", "梅花肉", "Collar", "A", 28.7, 29.4, 30.3, 31.1, 1.2, 1.7],
  ["hind_hock", "肘子", "Hock", "B", 21.4, 22.1, 22.9, 23.4, 0.9, 1.2],
  ["fore_hock", "蹄膀", "Shank", "B", 20.6, 21.3, 22.0, 22.7, 1.0, 1.1],
  ["big_chop", "大排", "Big Chop", "B", 25.2, 25.9, 26.7, 27.6, 1.1, 1.5],
  ["small_chop", "小排", "Small Chop", "B", 29.3, 30.2, 31.0, 31.8, 1.0, 1.6],
  ["neck", "颈肉", "Neck", "B", 22.8, 23.2, 24.1, 24.8, 1.3, 1.0],
  ["sandwich", "夹心", "Sandwich Cut", "B", 21.1, 21.9, 22.6, 23.2, 1.2, 0.9],
  ["fatback", "肥膘", "Fatback", "B", 18.9, 19.7, 20.5, 21.0, 0.8, 0.7],
  ["ear", "猪耳", "Ear", "B", 35.4, 36.0, 36.6, 37.2, 0.6, 0.8],
  ["tail", "猪尾", "Tail", "B", 31.2, 32.0, 32.8, 33.5, 0.9, 0.9],
  ["trotter", "猪蹄", "Trotter", "B", 24.5, 25.1, 25.9, 26.7, 1.0, 1.1],
  ["heart", "猪心", "Heart", "C", 19.4, 20.0, 20.6, 21.1, 0.7, 0.5],
  ["liver", "猪肝", "Liver", "C", 13.8, 14.2, 14.9, 15.3, 0.5, 0.6],
  ["kidney", "猪腰", "Kidney", "C", 22.3, 22.8, 23.2, 23.7, 0.6, 0.5],
  ["intestine", "猪肠", "Intestine", "C", 16.1, 16.7, 17.4, 17.9, 0.8, 0.4],
  ["head_meat", "头肉", "Head Meat", "C", 18.5, 19.1, 19.6, 20.2, 0.7, 0.5],
  ["trimmings", "碎肉", "Trimmings", "C", 15.7, 16.2, 16.9, 17.4, 0.9, 0.6],
  ["byproduct_mix", "副产拼配", "Byproduct Mix", "C", 12.9, 13.5, 14.1, 14.6, 1.0, 0.4],
] as const;

function generateSeries(base: number, wave: number, points: number, growth = 0.18) {
  return Array.from({ length: points }, (_, index) => {
    const seasonal = Math.sin(index / 1.8) * wave;
    const trend = index * growth;
    const pulse = (index % 4 === 0 ? 0.45 : -0.12) * wave;
    return Number((base + seasonal + trend + pulse).toFixed(2));
  });
}

export const partQuotes: PartQuote[] = partDefinitions.map(
  ([code, name, englishName, category, spotPrice, frozenPrice, futuresMappedPrice, predictedPrice, basis, changeRate]) => ({
    code,
    name,
    englishName,
    category,
    spotPrice,
    frozenPrice,
    futuresMappedPrice,
    predictedPrice,
    basis,
    changeRate,
    sparkline: generateSeries(spotPrice - 1.1, 0.8, 12),
    histories: {
      day: generateSeries(spotPrice - 1.3, 0.6, 12, 0.08),
      week: generateSeries(spotPrice - 1.8, 0.9, 14, 0.1),
      month: generateSeries(spotPrice - 2.4, 1.1, 18, 0.12),
      quarter: generateSeries(spotPrice - 3.1, 1.3, 20, 0.14),
      halfYear: generateSeries(spotPrice - 3.8, 1.7, 24, 0.16),
      year: generateSeries(spotPrice - 4.2, 2.1, 28, 0.18),
    },
  }),
);

export const benchmarkQuotes: BenchmarkQuote[] = [
  { code: "live_hog", name: "毛猪", englishName: "Live Hog", price: 18.6, changeRate: 1.2, unit: "¥/kg" },
  { code: "carcass", name: "白条", englishName: "Carcass", price: 23.4, changeRate: 0.8, unit: "¥/kg" },
  { code: "frozen_stock", name: "冷冻", englishName: "Frozen Stock", price: 26.1, changeRate: -0.4, unit: "¥/kg" },
  { code: "frozen_delivery", name: "冻品出库", englishName: "Frozen Delivery", price: 27.3, changeRate: 0.6, unit: "¥/kg" },
];

export const basisHistory: Record<Timeframe, number[]> = {
  day: generateSeries(1.2, 0.4, 12, 0.02),
  week: generateSeries(1.1, 0.5, 14, 0.03),
  month: generateSeries(0.9, 0.7, 18, 0.04),
  quarter: generateSeries(0.8, 0.9, 20, 0.05),
  halfYear: generateSeries(0.6, 1.0, 24, 0.06),
  year: generateSeries(0.4, 1.1, 28, 0.06),
};

export const freshFrozenSpreadHistory: Record<Timeframe, number[]> = {
  day: generateSeries(1.6, 0.35, 12, 0.03),
  week: generateSeries(1.5, 0.42, 14, 0.04),
  month: generateSeries(1.4, 0.5, 18, 0.04),
  quarter: generateSeries(1.3, 0.55, 20, 0.05),
  halfYear: generateSeries(1.2, 0.62, 24, 0.05),
  year: generateSeries(1.1, 0.7, 28, 0.06),
};

export const inventoryBatches: InventoryBatch[] = [
  {
    batchCode: "CP-PK-240418-A1",
    partCode: "pork_belly",
    partName: "五花",
    warehouse: "武汉一号冷库",
    weightKg: 18240,
    unitCost: 26.8,
    ageDays: 21,
    concentration: 58,
    currentSpotPrice: 27.8,
    futuresMappedPrice: 29.6,
    seasonalAdjustment: 0.72,
    supplyAdjustment: 0.48,
    storageCostPerMonth: 0.18,
    capitalCostPerMonth: 0.12,
    lossCostPerMonth: 0.08,
  },
  {
    batchCode: "CP-PK-240418-B4",
    partCode: "spare_ribs",
    partName: "排骨",
    warehouse: "上海二号冷库",
    weightKg: 9640,
    unitCost: 33.1,
    ageDays: 46,
    concentration: 71,
    currentSpotPrice: 34.2,
    futuresMappedPrice: 35.7,
    seasonalAdjustment: 0.56,
    supplyAdjustment: 0.31,
    storageCostPerMonth: 0.22,
    capitalCostPerMonth: 0.14,
    lossCostPerMonth: 0.11,
  },
  {
    batchCode: "CP-PK-240418-C7",
    partCode: "ham",
    partName: "后腿",
    warehouse: "合肥联储中心",
    weightKg: 22600,
    unitCost: 24.9,
    ageDays: 63,
    concentration: 83,
    currentSpotPrice: 24.6,
    futuresMappedPrice: 26.2,
    seasonalAdjustment: 0.44,
    supplyAdjustment: 0.26,
    storageCostPerMonth: 0.17,
    capitalCostPerMonth: 0.12,
    lossCostPerMonth: 0.09,
  },
];

export const tenantOptions = [
  {
    id: "tenant-cp-cn",
    name: "CP China Integrated Foods",
    region: "China North & Central",
    environment: "Production-like Demo",
    rolePreview: ["管理员", "决策者", "执行者"],
  },
  {
    id: "tenant-cp-sea",
    name: "CP Southeast Asia Operations",
    region: "Thailand / Vietnam / Laos",
    environment: "Regional Rollout",
    rolePreview: ["管理员", "决策者", "执行者"],
  },
  {
    id: "tenant-cp-global",
    name: "CP Global Agri Brain",
    region: "Global HQ Simulation",
    environment: "Strategic Board View",
    rolePreview: ["管理员", "决策者", "执行者"],
  },
];

export const roleProfiles = [
  {
    code: "admin" as const,
    name: "管理员",
    decisionLimit: "可维护规则、租户和参数配置",
    approvalRule: "策略修改、阈值修改均强制入审计",
  },
  {
    code: "strategist" as const,
    name: "决策者",
    decisionLimit: "可审批高风险策略与库存动作",
    approvalRule: "风险等级为高时必须审批",
  },
  {
    code: "executor" as const,
    name: "执行者",
    decisionLimit: "仅可执行已审批指令并反馈结果",
    approvalRule: "不能修改公式与风险阈值",
  },
];

function toRiskLevel(score: number): "低" | "中" | "高" {
  if (score >= 70) return "高";
  if (score >= 40) return "中";
  return "低";
}

export function calculateRiskScore(batch: InventoryBatch, holdMonths: number) {
  const ageRisk = Math.min(40, batch.ageDays * 0.62);
  const priceRisk = Math.min(25, Math.abs(batch.futuresMappedPrice - batch.currentSpotPrice) * 6.2);
  const concentrationRisk = Math.min(20, batch.concentration * 0.22);
  const horizonRisk = holdMonths * 5;
  return Number((ageRisk + priceRisk + concentrationRisk + horizonRisk).toFixed(1));
}

export function calculateDecision(batch: InventoryBatch, holdMonths: 1 | 2 | 3): DecisionScenario {
  const futureHoldingCost = Number(
    ((batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth) * holdMonths).toFixed(2),
  );
  const breakEvenPrice = Number((batch.unitCost + futureHoldingCost).toFixed(2));
  const expectedSellPrice = Number(
    (
      batch.currentSpotPrice +
      (batch.futuresMappedPrice - batch.currentSpotPrice) * 0.62 +
      batch.seasonalAdjustment +
      batch.supplyAdjustment +
      holdMonths * 0.28
    ).toFixed(2),
  );
  const decisionThreshold = 0.2;
  const netProfitPerKg = Number((expectedSellPrice - breakEvenPrice).toFixed(2));
  const riskScore = calculateRiskScore(batch, holdMonths);
  const riskLevel = toRiskLevel(riskScore);
  const action = netProfitPerKg > decisionThreshold ? "持有" : "出售";

  return {
    scenarioId: `${batch.batchCode}-${holdMonths}`,
    batchCode: batch.batchCode,
    partCode: batch.partCode,
    holdMonths,
    currentUnitCost: batch.unitCost,
    futureHoldingCost,
    breakEvenPrice,
    expectedSellPrice,
    netProfitPerKg,
    decisionThreshold,
    action,
    riskScore,
    riskLevel,
    formula:
      "净收益 = [现货价格 + (期货映射价 - 现货价格)×0.62 + 季节性修正 + 供给修正 + 持有期激励] - [当前成本 + (仓储+资金+损耗)×月数]",
    reason:
      action === "持有"
        ? "预测售价高于保本价且超过决策阈值，继续持有更优。"
        : "预测售价未有效覆盖持有后的保本线，立即出售更优。",
  };
}

export function getDecisionScenarios(batchCode: string) {
  const batch = inventoryBatches.find(item => item.batchCode === batchCode) ?? inventoryBatches[0]!;
  return [1, 2, 3].map(month => calculateDecision(batch, month as 1 | 2 | 3));
}

let auditEntries: AuditEntry[] = [
  {
    id: "AUD-001",
    actionType: "库存策略确认",
    entityType: "InventoryBatch",
    entityId: "CP-PK-240418-A1",
    operatorRole: "strategist",
    operatorName: "李明",
    riskLevel: "中",
    decision: "持有 1 个月",
    beforeValue: "状态=待确认; 建议=持有",
    afterValue: "状态=已确认; 路径=进入月度持有计划",
    createdAt: Date.now() - 1000 * 60 * 46,
    status: "已确认",
  },
  {
    id: "AUD-002",
    actionType: "高风险审批",
    entityType: "InventoryBatch",
    entityId: "CP-PK-240418-C7",
    operatorRole: "admin",
    operatorName: "陈总",
    riskLevel: "高",
    decision: "出售",
    beforeValue: "风险分=78.2; 库龄=63天",
    afterValue: "状态=已执行; 指令=优先出售",
    createdAt: Date.now() - 1000 * 60 * 17,
    status: "已执行",
  },
];

export function listAuditEntries() {
  return auditEntries.sort((a, b) => b.createdAt - a.createdAt);
}

export function appendAuditEntry(entry: Omit<AuditEntry, "id" | "createdAt">) {
  const audit: AuditEntry = {
    id: `AUD-${String(auditEntries.length + 1).padStart(3, "0")}`,
    createdAt: Date.now(),
    ...entry,
  };
  auditEntries = [audit, ...auditEntries];
  return audit;
}

export function getPlatformSnapshot(timeframe: Timeframe = "month") {
  const spotlight = partQuotes.slice(0, 8);
  return {
    timeframe,
    chainMetrics: seedMetrics,
    businessCards,
    spotlightParts: spotlight,
    allPartQuotes: partQuotes,
    benchmarkQuotes,
    basisHistory: basisHistory[timeframe],
    freshFrozenSpreadHistory: freshFrozenSpreadHistory[timeframe],
    inventoryBatches,
    tenantOptions,
    roleProfiles,
    generatedAt: Date.now(),
  };
}
