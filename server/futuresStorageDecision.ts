export type StorageDecisionMode = "base" | "cost_up" | "price_down" | "window_extend";

export interface FuturesStorageDecisionInput {
  currentHogPrice?: number;
  industryAverageCost?: number;
  monthlyStorageFee?: number;
  storageMonths?: number;
  decisionDate?: string;
  mode?: StorageDecisionMode;
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
}

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
        "期货曲线为基于主力合约、成本线和季节性升水的内部预测曲线。",
        "该结果为经营决策依据，不构成期货投资建议；高风险动作需要人工确认。",
      ],
    },
  };
}
