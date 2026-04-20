export type PorkPartCategory = "A" | "B" | "C";

export type PorkPartDefinition = {
  code: string;
  name: string;
  englishName: string;
  category: PorkPartCategory;
  yieldRate: number;
  storagePriority: number;
  processingPriority: number;
  channelPriority: number;
};

export type CostComponentBreakdown = {
  breeding: number;
  slaughter: number;
  split: number;
  freeze: number;
  storage: number;
  transport: number;
  capital: number;
  loss: number;
};

export type FullCostInput = {
  breedingCostPerKg: number;
  slaughterCostPerKg: number;
  splitCostPerKg: number;
  freezeCostPerKg: number;
  storageCostPerTonDay: number;
  transportCostPerTonKm: number;
  annualCapitalRate: number;
  stockDays: number;
  transportDistanceKm: number;
  partInventoryValuePerKg: number;
  partDailyLossRate: number;
  yieldRate: number;
};

export type FullCostResult = {
  components: CostComponentBreakdown;
  totalCostPerKg: number;
};

export type CostOfCarryInput = {
  spotPrice: number;
  annualCapitalRate: number;
  dailyStorageRate: number;
  dailyLossRate: number;
  holdingDays: number;
  convenienceYieldPerKg?: number;
};

export type RiskAdjustedHoldingInput = {
  expectedFuturePrice: number;
  breakEvenPrice: number;
  inventoryKg: number;
  inventoryCostPerKg: number;
  holdingDays: number;
  riskFreeAnnualRate: number;
  volatility: number;
};

export type RiskAdjustedHoldingReturn = {
  profitPerKg: number;
  totalProfit: number;
  annualizedReturnPct: number;
  sharpeRatio: number;
};

export type ProjectBlueprint = {
  background: string[];
  goals: string[];
  businessScenarios: string[];
  coreFunctions: string[];
  dataModules: Array<{ name: string; tableCount: number; cadence: string; purpose: string }>;
  deepArbitrageCategories: string[];
  acceptanceStandards: Array<{ metric: string; target: string; evidence: string }>;
};

export const PORK_PARTS: PorkPartDefinition[] = [
  { code: "pork_belly", name: "五花", englishName: "Pork Belly", category: "A", yieldRate: 0.08, storagePriority: 95, processingPriority: 72, channelPriority: 90 },
  { code: "big_chop", name: "大排", englishName: "Big Chop", category: "A", yieldRate: 0.055, storagePriority: 88, processingPriority: 70, channelPriority: 86 },
  { code: "small_chop", name: "小排", englishName: "Small Chop", category: "A", yieldRate: 0.038, storagePriority: 92, processingPriority: 68, channelPriority: 88 },
  { code: "shoulder", name: "前腿肉", englishName: "Shoulder", category: "A", yieldRate: 0.075, storagePriority: 78, processingPriority: 86, channelPriority: 76 },
  { code: "ham", name: "后腿肉", englishName: "Ham", category: "A", yieldRate: 0.09, storagePriority: 76, processingPriority: 88, channelPriority: 75 },
  { code: "loin", name: "里脊", englishName: "Loin", category: "A", yieldRate: 0.018, storagePriority: 84, processingPriority: 80, channelPriority: 92 },
  { code: "striploin", name: "通脊", englishName: "Striploin", category: "A", yieldRate: 0.026, storagePriority: 82, processingPriority: 78, channelPriority: 86 },
  { code: "front_rib", name: "前排", englishName: "Front Rib", category: "A", yieldRate: 0.032, storagePriority: 84, processingPriority: 74, channelPriority: 84 },
  { code: "tube_bone", name: "筒骨", englishName: "Tube Bone", category: "B", yieldRate: 0.036, storagePriority: 62, processingPriority: 76, channelPriority: 65 },
  { code: "rib", name: "肋排", englishName: "Rib", category: "A", yieldRate: 0.03, storagePriority: 93, processingPriority: 70, channelPriority: 91 },
  { code: "collar", name: "梅肉", englishName: "Collar", category: "A", yieldRate: 0.028, storagePriority: 86, processingPriority: 82, channelPriority: 88 },
  { code: "rump_tip", name: "臀尖", englishName: "Rump Tip", category: "B", yieldRate: 0.04, storagePriority: 70, processingPriority: 82, channelPriority: 70 },
  { code: "middle_cut", name: "中方", englishName: "Middle Cut", category: "B", yieldRate: 0.052, storagePriority: 74, processingPriority: 80, channelPriority: 72 },
  { code: "skin_on_belly", name: "带皮五花", englishName: "Skin-on Belly", category: "A", yieldRate: 0.045, storagePriority: 90, processingPriority: 74, channelPriority: 89 },
  { code: "skinless_belly", name: "去皮五花", englishName: "Skinless Belly", category: "A", yieldRate: 0.04, storagePriority: 91, processingPriority: 76, channelPriority: 90 },
  { code: "rib_segment", name: "排骨段", englishName: "Rib Segment", category: "A", yieldRate: 0.035, storagePriority: 90, processingPriority: 72, channelPriority: 88 },
  { code: "diced_leg", name: "腿肉丁", englishName: "Diced Leg", category: "B", yieldRate: 0.045, storagePriority: 68, processingPriority: 90, channelPriority: 72 },
  { code: "loin_shreds", name: "里脊丝", englishName: "Loin Shreds", category: "B", yieldRate: 0.018, storagePriority: 72, processingPriority: 88, channelPriority: 82 },
  { code: "belly_cubes", name: "五花肉块", englishName: "Belly Cubes", category: "B", yieldRate: 0.04, storagePriority: 78, processingPriority: 84, channelPriority: 80 },
  { code: "big_chop_slices", name: "大排片", englishName: "Big Chop Slices", category: "B", yieldRate: 0.036, storagePriority: 72, processingPriority: 86, channelPriority: 78 },
  { code: "small_chop_cubes", name: "小排块", englishName: "Small Chop Cubes", category: "B", yieldRate: 0.03, storagePriority: 76, processingPriority: 82, channelPriority: 77 },
  { code: "shoulder_shreds", name: "前腿肉丝", englishName: "Shoulder Shreds", category: "B", yieldRate: 0.034, storagePriority: 66, processingPriority: 90, channelPriority: 72 },
  { code: "ham_cubes", name: "后腿肉块", englishName: "Ham Cubes", category: "B", yieldRate: 0.048, storagePriority: 68, processingPriority: 88, channelPriority: 73 },
];

const porkPartByCode = new Map(PORK_PARTS.map(part => [part.code, part]));

export const PORK_PROJECT_BLUEPRINT: ProjectBlueprint = {
  background: [
    "毛猪价格低于社会平均成本与公司成本，直接销售造成大额亏损，必须把猪周期底部转化为减亏窗口。",
    "历史储备肉项目验证了时间套利可行性，但暴露目标不强制、执行不可控、数据孤岛和产能瓶颈问题。",
    "战房需要从参观型大屏升级为数据、算法、决策、执行闭环的工具型 AI 决策系统。",
  ],
  goals: [
    "以 23 个分割部位为最小决策单元，统一分割、冻储、调拨、深加工、出货与风控。",
    "通过时间、空间、实体、金融和深度产业套利实现全局风险调整后收益最大化。",
    "分钟级监控核心价格、库存、产能和调度信号，自动生成工单并沉淀执行反馈。",
  ],
  businessScenarios: [
    "猪价低于启动阈值时自动计算全面储备量、最优持有周期与保本价。",
    "产地与销地价差覆盖冷链、损耗和机会成本时生成跨区调拨路线。",
    "深加工原料缺口高于阈值时优先保障中高价值部位投料。",
    "库龄、价格跌破保本线、资金占用或合同违规触发红黄绿预警与审批。",
    "复合套利策略同步评估时空、实体、金融对冲和深度产业机会。",
  ],
  coreFunctions: [
    "统一数据中台与质量校验",
    "部位级全成本、保本价、CoC 公允价和风险收益计算",
    "时间套利、空间套利、实体套利、金融套利与 14 类深度套利机会识别",
    "MILP/贪心调度式产能、仓储、物流、销售和深加工分配",
    "价格预测、What-If 情景模拟、红黄绿预警、根因分析和自动派单闭环",
    "审计留痕、权限分级、人工审批和执行反馈复盘",
  ],
  dataModules: [
    { name: "养殖端基础与业务数据", tableCount: 5, cadence: "分钟/小时/日", purpose: "出栏、存栏、猪场约束与周期预测" },
    { name: "屠宰分割端数据", tableCount: 6, cadence: "分钟/日/月", purpose: "屠宰、分割、23 部位出品与产能缺口" },
    { name: "速冻仓储端数据", tableCount: 6, cadence: "分钟/小时/月", purpose: "库容、库龄、出入库、速冻瓶颈与 FEFO" },
    { name: "物流冷链数据", tableCount: 5, cadence: "分钟/日/月", purpose: "运力、路线成本、在途损耗与调度执行" },
    { name: "食品深加工数据", tableCount: 4, cadence: "小时/日/月", purpose: "产线、投料、产出和深加工增值" },
    { name: "销售渠道与价格数据", tableCount: 6, cadence: "分钟/日/月", purpose: "客户、订单、23 部位鲜冻价和竞品价" },
    { name: "外部市场数据", tableCount: 4, cadence: "分钟/周", purpose: "生猪期货、行业供需、能繁母猪与季节因子" },
    { name: "财务成本与资金数据", tableCount: 6, cadence: "日/月", purpose: "全成本、资金利率和部位利润测算" },
  ],
  deepArbitrageCategories: [
    "产业链跨品种传导套利",
    "养殖端繁育结构套利",
    "全价值零废弃套利",
    "渠道场景流量套利",
    "产能错配协同套利",
    "供应链现金流套利",
    "政策红利精准套利",
    "品质标准品牌套利",
    "信息差量化套利",
    "逆向周期危机套利",
    "跨境内外盘联动套利",
    "合规优化隐性套利",
    "轻资产联营套利",
    "绿色循环生态套利",
  ],
  acceptanceStandards: [
    { metric: "价格预测准确率", target: "≥85%", evidence: "3 年历史回测与每日偏差复盘" },
    { metric: "套利收益覆盖率", target: "≥90%", evidence: "理论收益与实际执行收益对账" },
    { metric: "执行自动化率", target: "≥95%", evidence: "自动派单数 / 总工单数" },
    { metric: "决策响应延迟", target: "≤5 分钟", evidence: "数据输入到方案输出链路日志" },
    { metric: "大屏与核心数据刷新", target: "≤1 分钟", evidence: "行情、库存、产能更新监控" },
    { metric: "库存损耗率", target: "≤1.2%", evidence: "WMS 出入库、温控与损耗台账" },
    { metric: "数据质量", target: "误差≤0.1%、23 部位无遗漏", evidence: "每日自动校验与异常告警" },
    { metric: "库存库龄约束", target: "库龄≤120 天，90 天以上预警", evidence: "FEFO 批次明细与预警记录" },
    { metric: "硬约束满足率", target: "100%", evidence: "产能、库容、资金、合同、半径规则校验" },
    { metric: "系统可用性", target: "≥99.9%", evidence: "生产监控、熔断降级和故障恢复记录" },
  ],
};

function assertFinite(value: number, field: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

function normalizeRate(rate: number) {
  assertFinite(rate, "rate");
  return Math.abs(rate) > 1 ? rate / 100 : rate;
}

function nonNegative(value: number, field: string) {
  assertFinite(value, field);
  return Math.max(0, value);
}

function round(value: number, digits = 3) {
  assertFinite(value, "value");
  return Number(value.toFixed(digits));
}

export function getPorkPartByCode(code: string) {
  return porkPartByCode.get(code);
}

export function calculateAgeDepreciationCoefficient(ageDays: number) {
  const days = nonNegative(ageDays, "ageDays");
  if (days <= 30) return 1;
  if (days <= 60) return 0.98;
  if (days <= 90) return 0.95;
  if (days <= 120) return 0.9;
  return 0.8;
}

export function calculatePartFullCost(input: FullCostInput): FullCostResult {
  const yieldRate = Math.min(1, nonNegative(input.yieldRate, "yieldRate"));
  const stockDays = nonNegative(input.stockDays, "stockDays");
  const partValue = nonNegative(input.partInventoryValuePerKg, "partInventoryValuePerKg");
  const annualCapitalRate = normalizeRate(input.annualCapitalRate);
  const dailyLossRate = normalizeRate(input.partDailyLossRate);
  const components: CostComponentBreakdown = {
    breeding: round(nonNegative(input.breedingCostPerKg, "breedingCostPerKg") * yieldRate),
    slaughter: round(nonNegative(input.slaughterCostPerKg, "slaughterCostPerKg") * yieldRate),
    split: round(nonNegative(input.splitCostPerKg, "splitCostPerKg")),
    freeze: round(nonNegative(input.freezeCostPerKg, "freezeCostPerKg")),
    storage: round((nonNegative(input.storageCostPerTonDay, "storageCostPerTonDay") / 1000) * stockDays),
    transport: round((nonNegative(input.transportCostPerTonKm, "transportCostPerTonKm") / 1000) * nonNegative(input.transportDistanceKm, "transportDistanceKm")),
    capital: round(partValue * (annualCapitalRate / 365) * stockDays),
    loss: round(partValue * dailyLossRate * stockDays),
  };
  const totalCostPerKg = round(Object.values(components).reduce((sum, value) => sum + value, 0));
  return { components, totalCostPerKg };
}

export function calculateCostOfCarryFairPrice(input: CostOfCarryInput) {
  const spotPrice = nonNegative(input.spotPrice, "spotPrice");
  const capitalDailyRate = normalizeRate(input.annualCapitalRate) / 365;
  const dailyStorageRate = normalizeRate(input.dailyStorageRate);
  const dailyLossRate = normalizeRate(input.dailyLossRate);
  const holdingDays = nonNegative(input.holdingDays, "holdingDays");
  const convenienceYield = nonNegative(input.convenienceYieldPerKg ?? 0, "convenienceYieldPerKg");
  return round(spotPrice * Math.exp((capitalDailyRate + dailyStorageRate + dailyLossRate) * holdingDays) - convenienceYield);
}

export function calculateRiskAdjustedHoldingReturn(input: RiskAdjustedHoldingInput): RiskAdjustedHoldingReturn {
  const holdingDays = Math.max(1, nonNegative(input.holdingDays, "holdingDays"));
  const inventoryKg = nonNegative(input.inventoryKg, "inventoryKg");
  const inventoryCostPerKg = Math.max(0.01, nonNegative(input.inventoryCostPerKg, "inventoryCostPerKg"));
  const profitPerKg = round(nonNegative(input.expectedFuturePrice, "expectedFuturePrice") - nonNegative(input.breakEvenPrice, "breakEvenPrice"));
  const totalProfit = round(profitPerKg * inventoryKg, 2);
  const annualizedReturnPct = round((profitPerKg / inventoryCostPerKg / (holdingDays / 365)) * 100, 2);
  const riskFreeAnnualRate = normalizeRate(input.riskFreeAnnualRate) * 100;
  const volatilityPct = Math.max(0.01, normalizeRate(input.volatility) * 100);
  const sharpeRatio = round((annualizedReturnPct - riskFreeAnnualRate) / volatilityPct, 3);
  return {
    profitPerKg,
    totalProfit,
    annualizedReturnPct,
    sharpeRatio,
  };
}
