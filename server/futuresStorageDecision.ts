import {
  calculateDecision,
  calculateRiskScore,
  inventoryBatches as fallbackInventoryBatches,
  type DecisionScenario,
  type InventoryBatch,
} from "./platformData";

export type StorageDecisionMode = "base" | "cost_up" | "price_down" | "window_extend";

export interface FuturesStorageDecisionInput {
  currentHogPrice?: number;
  industryAverageCost?: number;
  monthlyStorageFee?: number;
  storageMonths?: number;
  decisionDate?: string;
  mode?: StorageDecisionMode;
  batchCode?: string;
  customHoldDays?: number;
  batch?: InventoryBatch;
  availableBatches?: InventoryBatch[];
  marketGeneratedAt?: number;
}

export interface StorageMonthDecision {
  monthCode: string;
  label: string;
  futurePrice: number;
  decision: "收储" | "停止收储";
  isStorageWindow: boolean;
  reason: string;
}

export interface FuturesStorageDecisionResult {
  inputs: {
    currentHogPrice: number;
    industryAverageCost: number;
    monthlyStorageFee: number;
    storageMonths: number;
    decisionDate: string;
    mode: StorageDecisionMode;
  };
  metrics: {
    currentProfitPerHead: number;
    storageThreshold: number;
    breakLine1: number;
    breakLine2: number;
    breakLine3: number;
    recommendedStart: string;
    recommendedEnd: string;
    stopAfter: string;
    recommendation: "收储窗口开启" | "等待" | "停止收储";
    suggestedMonths: number;
    confidencePct: number;
    riskLevel: "低" | "中" | "高";
  };
  futuresCurve: StorageMonthDecision[];
  chartData: Array<{
    monthCode: string;
    label: string;
    futurePrice: number;
    currentSpot: number;
    storageThreshold: number;
    storageBandLow: number;
    storageBandHigh: number;
    stopBandLow: number;
    stopBandHigh: number;
    isStorageWindow: boolean;
  }>;
  algorithm: {
    formula: string;
    components: Array<{ label: string; value: number; unit: string }>;
    conclusion: string;
  };
  warning: {
    lines: Array<{ label: string; value: number; action: string }>;
    explanation: string;
  };
  ai: {
    interpretation: string;
    questions: string[];
    recommendations: string[];
    feasibility: "可执行" | "需人工复核";
    auditNotes: string[];
  };
  batch: StorageBatchSummary;
  availableBatches: StorageBatchSummary[];
  plans: BatchDecisionPlan[];
  selectedPlan: BatchDecisionPlan;
  pricePrediction: Array<{
    label: string;
    predictedPrice: number;
    futuresMappedPrice: number;
    currentCost: number;
    breakEvenPrice: number;
  }>;
  decisionRecord: {
    strategyVersion: string;
    createdAt: number;
    createdBy: string;
    dataAsOf: number;
    predictionModel: string;
    status: "待决策" | "待审批" | "可执行";
    dataLineage: string[];
  };
  workflow: Array<{
    stage: "发起" | "系统校验" | "AI解释生成" | "待操作";
    status: "done" | "active" | "pending";
    operator: string;
    timestamp: number;
    notes: string[];
  }>;
  history: Array<{
    date: string;
    batchCode: string;
    plan: string;
    result: "已完成" | "审批中" | "已回测";
    profit: number;
  }>;
}

export interface StorageBatchSummary {
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
  storageCostPerMonth: number;
  capitalCostPerMonth: number;
  lossCostPerMonth: number;
}

export interface BatchDecisionPlan {
  key: "sell_now" | "hold_1m" | "hold_2m" | "hold_3m" | "custom";
  label: string;
  subtitle: string;
  holdDays: number;
  expectedSellPrice: number;
  breakEvenPrice: number;
  netProfitPerKg: number;
  netIncome: number;
  annualizedReturnPct: number;
  riskScore: number;
  riskLevel: "低" | "中" | "高";
  approvalRequired: boolean;
  action: "出售" | "持有" | "提交审批";
  reason: string;
  costRows: Array<{
    item: string;
    formula: string;
    value: number;
    description: string;
  }>;
}

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function summarizeBatch(batch: InventoryBatch): StorageBatchSummary {
  return {
    batchCode: batch.batchCode,
    partCode: batch.partCode,
    partName: batch.partName,
    warehouse: batch.warehouse,
    weightKg: batch.weightKg,
    unitCost: batch.unitCost,
    ageDays: batch.ageDays,
    concentration: batch.concentration,
    currentSpotPrice: batch.currentSpotPrice,
    futuresMappedPrice: batch.futuresMappedPrice,
    storageCostPerMonth: batch.storageCostPerMonth,
    capitalCostPerMonth: batch.capitalCostPerMonth,
    lossCostPerMonth: batch.lossCostPerMonth,
  };
}

function riskLevelFromScore(score: number): "低" | "中" | "高" {
  if (score >= 70) return "高";
  if (score >= 40) return "中";
  return "低";
}

function annualizedReturn(netProfitPerKg: number, unitCost: number, holdDays: number) {
  const horizonDays = Math.max(holdDays, 30);
  return round((netProfitPerKg / Math.max(unitCost, 0.01)) * (365 / horizonDays) * 100, 2);
}

function costRowsForPlan(batch: InventoryBatch, holdingMonths: number, breakEvenPrice: number) {
  return [
    {
      item: "当前单位成本",
      formula: "批次当前成本",
      value: round(batch.unitCost, 2),
      description: "来自库存批次单位成本。",
    },
    {
      item: "仓储成本",
      formula: `${batch.storageCostPerMonth.toFixed(2)} 元/kg/月 × ${holdingMonths.toFixed(2)} 月`,
      value: round(batch.storageCostPerMonth * holdingMonths, 2),
      description: "含冷库、库租、能耗。",
    },
    {
      item: "资金成本",
      formula: `${batch.capitalCostPerMonth.toFixed(2)} 元/kg/月 × ${holdingMonths.toFixed(2)} 月`,
      value: round(batch.capitalCostPerMonth * holdingMonths, 2),
      description: "按批次资金占用估算。",
    },
    {
      item: "损耗成本",
      formula: `${batch.lossCostPerMonth.toFixed(2)} 元/kg/月 × ${holdingMonths.toFixed(2)} 月`,
      value: round(batch.lossCostPerMonth * holdingMonths, 2),
      description: "含冻品损耗与质量折价。",
    },
    {
      item: "未来保本价",
      formula: "单位成本 + 仓储 + 资金 + 损耗",
      value: round(breakEvenPrice, 2),
      description: "用于判断继续持有是否覆盖成本。",
    },
  ];
}

function planFromScenario(batch: InventoryBatch, scenario: DecisionScenario): BatchDecisionPlan {
  const holdDays = scenario.holdMonths * 30;
  const netIncome = round(scenario.netProfitPerKg * batch.weightKg, 0);
  const approvalRequired = scenario.riskLevel === "高" || netIncome > 30000;
  return {
    key: `hold_${scenario.holdMonths}m` as "hold_1m" | "hold_2m" | "hold_3m",
    label: `持有${scenario.holdMonths}个月`,
    subtitle: `${scenario.holdMonths * 30}天窗口`,
    holdDays,
    expectedSellPrice: scenario.expectedSellPrice,
    breakEvenPrice: scenario.breakEvenPrice,
    netProfitPerKg: scenario.netProfitPerKg,
    netIncome,
    annualizedReturnPct: annualizedReturn(scenario.netProfitPerKg, batch.unitCost, holdDays),
    riskScore: scenario.riskScore,
    riskLevel: scenario.riskLevel,
    approvalRequired,
    action: approvalRequired ? "提交审批" : scenario.action,
    reason: scenario.reason,
    costRows: costRowsForPlan(batch, scenario.holdMonths, scenario.breakEvenPrice),
  };
}

function buildCustomPlan(batch: InventoryBatch, customHoldDays: number): BatchDecisionPlan {
  const holdDays = clamp(Math.round(customHoldDays), 15, 180);
  const holdingMonths = holdDays / 30;
  const holdingCost = batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth;
  const breakEvenPrice = round(batch.unitCost + holdingCost * holdingMonths, 2);
  const expectedSellPrice = round(
    batch.currentSpotPrice +
      (batch.futuresMappedPrice - batch.currentSpotPrice) * clamp(holdingMonths / 3, 0.2, 0.9) +
      batch.seasonalAdjustment * clamp(holdingMonths / 2, 0.2, 1) +
      batch.supplyAdjustment * 0.72,
    2,
  );
  const netProfitPerKg = round(expectedSellPrice - breakEvenPrice, 2);
  const netIncome = round(netProfitPerKg * batch.weightKg, 0);
  const riskScore = round(calculateRiskScore(batch, Math.max(1, holdingMonths)), 1);
  const riskLevel = riskLevelFromScore(riskScore);
  const approvalRequired = riskLevel === "高" || netIncome > 30000;

  return {
    key: "custom",
    label: "自定义周期",
    subtitle: `${holdDays}天`,
    holdDays,
    expectedSellPrice,
    breakEvenPrice,
    netProfitPerKg,
    netIncome,
    annualizedReturnPct: annualizedReturn(netProfitPerKg, batch.unitCost, holdDays),
    riskScore,
    riskLevel,
    approvalRequired,
    action: approvalRequired ? "提交审批" : netProfitPerKg > 0.2 ? "持有" : "出售",
    reason:
      netProfitPerKg > 0.2
        ? "自定义窗口预计覆盖持有成本，可作为模拟方案保存后复核执行。"
        : "自定义窗口未充分覆盖保本价，建议缩短周期或转为立即出售。",
    costRows: costRowsForPlan(batch, holdingMonths, breakEvenPrice),
  };
}

function buildSellNowPlan(batch: InventoryBatch): BatchDecisionPlan {
  const netProfitPerKg = round(batch.currentSpotPrice - batch.unitCost, 2);
  const netIncome = round(netProfitPerKg * batch.weightKg, 0);
  const riskScore = round(
    Math.min(100, batch.ageDays * 0.28 + Math.max(0, batch.concentration - 55) * 0.32),
    1,
  );
  return {
    key: "sell_now",
    label: "立即出售",
    subtitle: "今日执行",
    holdDays: 0,
    expectedSellPrice: round(batch.currentSpotPrice, 2),
    breakEvenPrice: round(batch.unitCost, 2),
    netProfitPerKg,
    netIncome,
    annualizedReturnPct: round((netProfitPerKg / Math.max(batch.unitCost, 0.01)) * 100, 2),
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    approvalRequired: netIncome > 30000,
    action: netIncome > 30000 ? "提交审批" : "出售",
    reason:
      netProfitPerKg >= 0
        ? "当前现货价已覆盖批次成本，立即出售可释放库容与现金流。"
        : "当前现货价低于成本，立即出售会确认亏损，仅适合库龄或库容压力较高时执行。",
    costRows: costRowsForPlan(batch, 0, batch.unitCost),
  };
}

function buildBatchPlans(batch: InventoryBatch, customHoldDays = 45): BatchDecisionPlan[] {
  const holdingPlans = [1, 2, 3].map(month =>
    planFromScenario(batch, calculateDecision(batch, month as 1 | 2 | 3)),
  );
  return [buildSellNowPlan(batch), ...holdingPlans, buildCustomPlan(batch, customHoldDays)];
}

function selectBestPlan(plans: BatchDecisionPlan[]) {
  return plans
    .slice()
    .sort((a, b) => {
      const aScore = a.netIncome - a.riskScore * 180 - (a.approvalRequired ? 2500 : 0);
      const bScore = b.netIncome - b.riskScore * 180 - (b.approvalRequired ? 2500 : 0);
      return bScore - aScore;
    })[0]!;
}

function buildPricePrediction(batch: InventoryBatch, selectedPlan: BatchDecisionPlan) {
  const breakEvenStep = (selectedPlan.breakEvenPrice - batch.unitCost) / 6;
  const forecastLift = selectedPlan.expectedSellPrice - batch.currentSpotPrice;
  const labels = ["今日", "+7天", "+15天", "+30天", "+45天", "+60天", "+90天"];
  return labels.map((label, index) => {
    const progress = index / (labels.length - 1);
    return {
      label,
      predictedPrice: round(batch.currentSpotPrice + forecastLift * progress + Math.sin(index * 0.8) * 0.08, 2),
      futuresMappedPrice: round(batch.futuresMappedPrice - (1 - progress) * 0.38, 2),
      currentCost: round(batch.unitCost, 2),
      breakEvenPrice: round(batch.unitCost + breakEvenStep * index, 2),
    };
  });
}

function monthLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

const BASE_MONTHS = [
  { year: 2026, month: 5, price: 9.78 },
  { year: 2026, month: 6, price: 10.635 },
  { year: 2026, month: 7, price: 11.49 },
  { year: 2026, month: 8, price: 12.0325 },
  { year: 2026, month: 9, price: 12.575 },
  { year: 2026, month: 10, price: 12.6825 },
  { year: 2026, month: 11, price: 12.79 },
  { year: 2026, month: 12, price: 12.9825 },
  { year: 2027, month: 1, price: 13.175 },
  { year: 2027, month: 2, price: 12.935 },
  { year: 2027, month: 3, price: 12.695 },
];

function modeAdjustments(mode: StorageDecisionMode) {
  if (mode === "cost_up") return { costDelta: 0.3, priceDelta: 0, feeDelta: 0.02, monthDelta: 0 };
  if (mode === "price_down") return { costDelta: 0, priceDelta: -0.35, feeDelta: 0, monthDelta: 0 };
  if (mode === "window_extend") return { costDelta: -0.12, priceDelta: -0.18, feeDelta: -0.015, monthDelta: 1 };
  return { costDelta: 0, priceDelta: 0, feeDelta: 0, monthDelta: 0 };
}

export function simulateFuturesStorageDecision(
  input: FuturesStorageDecisionInput = {},
): FuturesStorageDecisionResult {
  const mode = input.mode ?? "base";
  const adjustment = modeAdjustments(mode);
  const currentHogPrice = round(clamp((input.currentHogPrice ?? 9.57) + adjustment.priceDelta * 0.2, 1, 40), 2);
  const industryAverageCost = round(clamp((input.industryAverageCost ?? 12.0) + adjustment.costDelta, 1, 40), 2);
  const monthlyStorageFee = round(clamp((input.monthlyStorageFee ?? 0.22075) + adjustment.feeDelta, 0.01, 2), 5);
  const storageMonths = clamp(Math.round((input.storageMonths ?? 3) + adjustment.monthDelta), 1, 10);
  const decisionDate = input.decisionDate ?? "2026-04-23";
  const threshold = round(industryAverageCost - monthlyStorageFee * storageMonths, 5);
  const storageWindowMonths = Math.max(1, Math.min(storageMonths, BASE_MONTHS.length));
  const availableInventoryBatches = input.availableBatches?.length
    ? input.availableBatches
    : fallbackInventoryBatches;
  const selectedBatch =
    input.batch ??
    availableInventoryBatches.find(item => item.batchCode === input.batchCode) ??
    availableInventoryBatches[0]!;
  const plans = buildBatchPlans(selectedBatch, input.customHoldDays ?? 45);
  const selectedPlan = selectBestPlan(plans);
  const dataAsOf = input.marketGeneratedAt ?? Date.now();

  const shiftedCurve = BASE_MONTHS.map((item, index) => ({
    ...item,
    price: round(item.price + adjustment.priceDelta * (0.7 + index * 0.04), 4),
  }));
  const futuresCurve = shiftedCurve.map<StorageMonthDecision>((item, index) => {
    const isStorageWindow = index < storageWindowMonths && currentHogPrice < threshold;
    const decision = isStorageWindow ? "收储" : "停止收储";
    return {
      monthCode: `${item.year}${String(item.month).padStart(2, "0")}`,
      label: monthLabel(item.year, item.month),
      futurePrice: item.price,
      decision,
      isStorageWindow,
      reason: isStorageWindow
        ? `当前毛猪价格 ${currentHogPrice} 元/kg 低于收储阈值 ${threshold} 元/kg，允许锁定低位成本。`
        : `远月价格进入相对高位或已超过建议窗口，继续收储会放大资金占用与价格回落风险。`,
    };
  });

  const recommendedWindow = futuresCurve.filter(item => item.isStorageWindow);
  const recommendedStart = recommendedWindow[0]?.label ?? futuresCurve[0]!.label;
  const recommendedEnd = recommendedWindow[recommendedWindow.length - 1]?.label ?? futuresCurve[0]!.label;
  const stopAfter = futuresCurve[recommendedWindow.length]?.label ?? futuresCurve[futuresCurve.length - 1]!.label;
  const currentProfitPerHead = round((currentHogPrice - industryAverageCost) * 26, 0);
  const recommendation =
    currentHogPrice < threshold && recommendedWindow.length > 0
      ? "收储窗口开启"
      : currentHogPrice > threshold + 0.3
        ? "停止收储"
        : "等待";
  const breakLine1 = round(threshold - 0.3, 5);
  const breakLine2 = round(threshold - 0.07925, 5);
  const breakLine3 = round(threshold + 0.1415, 5);
  const stopStart = Math.min(...futuresCurve.filter(item => !item.isStorageWindow).map(item => item.futurePrice));
  const chartData = futuresCurve.map(item => ({
    monthCode: item.monthCode,
    label: item.monthCode,
    futurePrice: item.futurePrice,
    currentSpot: currentHogPrice,
    storageThreshold: threshold,
    storageBandLow: 8.2,
    storageBandHigh: threshold,
    stopBandLow: threshold,
    stopBandHigh: Math.max(stopStart, 13.4),
    isStorageWindow: item.isStorageWindow,
  }));

  const stopMonth = stopAfter.replace("年", "年").replace("月", "月");
  const interpretation = `当前毛猪价格为 ${currentHogPrice.toFixed(2)} 元/kg，显著低于行业平均成本 ${industryAverageCost.toFixed(2)} 元/kg。扣除 ${storageMonths} 个月储备期费用后阈值为 ${threshold.toFixed(5)} 元/kg，符合收储条件。期货曲线显示 ${recommendedStart}-${recommendedEnd} 价格处于低位上升阶段，之后盘面逐步抬升，继续收储会增加资金占用与价格回落风险。`;

  return {
    inputs: {
      currentHogPrice,
      industryAverageCost,
      monthlyStorageFee,
      storageMonths,
      decisionDate,
      mode,
    },
    metrics: {
      currentProfitPerHead,
      storageThreshold: threshold,
      breakLine1,
      breakLine2,
      breakLine3,
      recommendedStart,
      recommendedEnd,
      stopAfter: stopMonth,
      recommendation,
      suggestedMonths: recommendedWindow.length,
      confidencePct: round(
        clamp(88 + recommendedWindow.length * 1.5 - Math.max(0, currentHogPrice - threshold) * 10, 60, 96),
        1,
      ),
      riskLevel: currentHogPrice < threshold - 0.8 ? "低" : currentHogPrice < threshold ? "中" : "高",
    },
    futuresCurve,
    chartData,
    algorithm: {
      formula: "行业平均成本 - 储备期费用 × 建议收储月数 = 收储阈值",
      components: [
        { label: "行业平均成本", value: industryAverageCost, unit: "元/kg" },
        { label: `储备期费用（${storageMonths}个月）`, value: round(monthlyStorageFee * storageMonths, 5), unit: "元/kg" },
        { label: "收储阈值（上限）", value: threshold, unit: "元/kg" },
      ],
      conclusion: `当前毛猪价格 ${currentHogPrice.toFixed(2)} 元/kg < 阈值 ${threshold.toFixed(5)} 元/kg，满足收储条件。`,
    },
    warning: {
      lines: [
        { label: "一级预警线", value: breakLine1, action: "缩小收储规模，保留现金弹性" },
        { label: "二级预警线", value: breakLine2, action: "只执行已锁定库容，不新增敞口" },
        { label: "三级预警线", value: breakLine3, action: "停止收储并评估期货套保" },
      ],
      explanation: `以收储阈值 ${threshold.toFixed(5)} 元/kg 为基准，上浮/下移形成三级风险预警，系统将结合资金面与盘面动态调整建议。`,
    },
    ai: {
      interpretation,
      questions: [
        "若成本上升0.3元/kg怎么办？",
        "如果销售期推迟后会怎样？",
        "为什么7月后不适合收储？",
      ],
      recommendations: [
        `推荐收储窗口：${recommendedStart}-${recommendedEnd}，共 ${recommendedWindow.length} 个月。`,
        `${stopAfter} 后建议停止收储，避免资金占用与价格波动风险。`,
        "若现货价格突破三级预警线，应切换到期货套保或降低收储规模。",
      ],
      feasibility: recommendation === "收储窗口开启" ? "可执行" : "需人工复核",
      auditNotes: [
        "现货价格来自平台生猪行情快照，若外部行情失败则使用系统保守回退值。",
        `批次收益基于 ${selectedBatch.batchCode} 的真实库存成本、库龄、库容集中度和当前部位行情测算。`,
        "期货曲线为基于主力合约、成本线和季节性升水的内部预测曲线。",
        "该结果为经营决策依据，不构成期货投资建议；高风险动作需要人工确认。",
      ],
    },
    batch: summarizeBatch(selectedBatch),
    availableBatches: availableInventoryBatches.map(summarizeBatch),
    plans,
    selectedPlan,
    pricePrediction: buildPricePrediction(selectedBatch, selectedPlan),
    decisionRecord: {
      strategyVersion: "v2.4.1",
      createdAt: dataAsOf,
      createdBy: "潘猛",
      dataAsOf,
      predictionModel: "AI-Price v3.2",
      status: selectedPlan.approvalRequired ? "待审批" : "可执行",
      dataLineage: [
        "平台生猪/冻品行情快照",
        "库存批次单位成本与库龄",
        "期货映射价与季节性修正",
        "仓储、资金、损耗成本参数",
      ],
    },
    workflow: [
      {
        stage: "发起",
        status: "done",
        operator: "潘猛（决策专员）",
        timestamp: dataAsOf - 1000 * 3,
        notes: [`提交方案：${selectedPlan.label}`, `批次：${selectedBatch.batchCode}`],
      },
      {
        stage: "系统校验",
        status: "done",
        operator: "规则引擎",
        timestamp: dataAsOf - 1000 * 2,
        notes: [
          `风险校验通过（${selectedPlan.riskLevel}风险）`,
          selectedPlan.approvalRequired ? "触发审批规则" : "无需审批，可直接执行",
        ],
      },
      {
        stage: "AI解释生成",
        status: "done",
        operator: "AI 决策引擎",
        timestamp: dataAsOf - 1000,
        notes: [`推荐方案：${selectedPlan.label}`, selectedPlan.reason],
      },
      {
        stage: "待操作",
        status: "active",
        operator: "用户",
        timestamp: dataAsOf,
        notes: [selectedPlan.approvalRequired ? "等待提交审批" : "等待确认执行"],
      },
    ],
    history: [
      {
        date: "04-23",
        batchCode: selectedBatch.batchCode,
        plan: selectedPlan.label,
        result: "已回测",
        profit: selectedPlan.netIncome,
      },
      {
        date: "04-20",
        batchCode: "CP-PK-240418-A1",
        plan: "持有1个月",
        result: "已完成",
        profit: 27164,
      },
      {
        date: "04-18",
        batchCode: "CP-PK-240418-B4",
        plan: "立即出售",
        result: "已完成",
        profit: 10604,
      },
      {
        date: "04-16",
        batchCode: "CP-PK-240418-C7",
        plan: "提交审批",
        result: "审批中",
        profit: -6780,
      },
    ],
  };
}
