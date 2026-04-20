import { calculateDecision, inventoryBatches, type InventoryBatch } from "./platformData";

export type ForecastStrategy = "steady" | "balanced" | "aggressive";

export type ForecastPoint = {
  month: number;
  label: string;
  projectedPrice: number;
  breakEvenPrice: number;
  averageSellPrice: number;
  totalCostPerKg: number;
  profitPerKg: number;
  totalProfit: number;
};

export type ForecastTimelinePoint = {
  step: number;
  label: string;
  phase: "actual" | "forecast";
  actualPrice: number | null;
  projectedPrice: number | null;
  breakEvenPrice: number | null;
  averageSellPrice: number | null;
  profitPerKg: number | null;
};

export type AiForecastResult = {
  batch: InventoryBatch;
  selectedMonth: number;
  strategy: ForecastStrategy;
  basisAdjustment: number;
  targetPrice: number;
  monthlyHoldingCost: number;
  summary: {
    currentSpotPrice: number;
    projectedPrice: number;
    breakEvenPrice: number;
    averageSellPrice: number;
    profitPerKg: number;
    totalProfit: number;
  };
  curve: ForecastPoint[];
  timeline: ForecastTimelinePoint[];
};

export type WhatIfResourcePoint = {
  month: 1 | 2 | 3;
  slaughterHeads: number;
  freezingTons: number;
  storageTons: number;
  warehousePallets: number;
  coldChainTrips: number;
};

export type AiWhatIfResult = {
  batch: InventoryBatch;
  selectedMonth: 1 | 2 | 3;
  assumptions: {
    targetPrice: number;
    capacityAdjustment: number;
    demandAdjustment: number;
  };
  summary: {
    baselineProfit: number;
    simulatedProfit: number;
    incrementalProfit: number;
    utilizationRate: number;
    expectedRevenue: number;
  };
  resources: WhatIfResourcePoint[];
};

export type AgentDecisionCard = {
  agentId: "global" | "business" | "field";
  agentName: string;
  objective: string;
  recommendation: string;
  rationale: string;
  riskLevel: "低" | "中" | "高";
  nextAction: string;
};

export type AiAgentDecisionResult = {
  overview: string;
  coordinationSignal: string;
  dispatchSummary: string;
  agents: AgentDecisionCard[];
};

export type AlertLevel = "red" | "yellow" | "green";

export type AiAlertItem = {
  alertId: string;
  title: string;
  status: AlertLevel;
  summary: string;
  impactScope: string;
  estimatedLoss: number;
  aiRecommendation: string;
  rootCause: string;
  actionOwner: string;
};

export type AiAlertBoardResult = {
  overview: string;
  items: AiAlertItem[];
};

export type DispatchWorkOrder = {
  orderId: string;
  role: "厂长" | "司机" | "仓储管理员";
  stage: "slaughter" | "cold-chain" | "warehouse";
  factory: string;
  quantity: number;
  scheduledTime: string;
  acceptanceStandard: string;
  priority: "P1" | "P2" | "P3";
  operationRequirement: string;
  escalationCondition: string;
  payload: Record<string, string | number>;
};

export type DispatchFeedbackItem = {
  role: "厂长" | "司机" | "仓储管理员";
  status: "待确认" | "已接单" | "执行中" | "已完成" | "超时升级";
  etaMinutes: number;
  note: string;
};

export type DispatchBoardResult = {
  summary: string;
  escalation: boolean;
  workOrders: DispatchWorkOrder[];
  feedback: DispatchFeedbackItem[];
};

export type DispatchExecutionSummary = {
  totalOrders: number;
  pendingCount: number;
  acknowledgedCount: number;
  inProgressCount: number;
  completedCount: number;
  escalatedCount: number;
  closureRate: number;
  blockingExceptions: number;
};

export type DispatchHistoryOrder = {
  orderId: string;
  batchCode: string;
  currentStatus: string;
  priority: string;
  receipts: Array<{
    role: DispatchFeedbackItem["role"];
    status: DispatchFeedbackItem["status"];
    etaMinutes: number;
    note: string;
    acknowledgedBy: string | null;
    receiptBy: string | null;
  }>;
};

export type AiDecisionWorkspaceResult = {
  forecast: AiForecastResult;
  simulation: AiWhatIfResult;
  agentDecision: AiAgentDecisionResult;
  alertBoard: AiAlertBoardResult;
  dispatchBoard: DispatchBoardResult;
  executionSummary: DispatchExecutionSummary;
  dispatchHistory: DispatchHistoryOrder[];
  lifecycle: {
    stage:
      | "forecast"
      | "simulation"
      | "decision"
      | "dispatch_preview"
      | "dispatch_persisted"
      | "execution_in_progress"
      | "execution_completed"
      | "escalated";
    hasPersistedDispatch: boolean;
    hasEscalation: boolean;
  };
};

function clampMonth(month: number) {
  return Math.max(1, Math.min(8, Math.round(month)));
}

function clampScenarioMonth(month: number) {
  return Math.max(1, Math.min(3, Math.round(month))) as 1 | 2 | 3;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function getBatch(batchCode: string) {
  return inventoryBatches.find(item => item.batchCode === batchCode) ?? inventoryBatches[0]!;
}

function getStrategyFactor(strategy: ForecastStrategy) {
  if (strategy === "steady") return 0.84;
  if (strategy === "aggressive") return 1.18;
  return 1;
}

function buildActualTimeline(batch: InventoryBatch, basisAdjustment: number): ForecastTimelinePoint[] {
  const historyDepth = 6;
  return Array.from({ length: historyDepth }, (_, index) => {
    const stepsFromCurrent = historyDepth - 1 - index;
    const trend = stepsFromCurrent * (0.22 + batch.supplyAdjustment * 0.18);
    const oscillation = Math.sin((index + 1) * 0.9) * 0.18 + Math.cos((index + 1) * 0.45) * 0.07;
    const actualPrice = round(batch.currentSpotPrice - trend + oscillation - basisAdjustment * 0.08);

    return {
      step: index - historyDepth + 1,
      label: stepsFromCurrent === 0 ? "当前" : `T-${stepsFromCurrent}`,
      phase: "actual",
      actualPrice,
      projectedPrice: stepsFromCurrent === 0 ? actualPrice : null,
      breakEvenPrice: null,
      averageSellPrice: null,
      profitPerKg: stepsFromCurrent === 0 ? round(actualPrice - batch.unitCost) : null,
    } satisfies ForecastTimelinePoint;
  });
}

function toRiskLevelByIncrement(incrementalProfit: number, utilizationRate: number): "低" | "中" | "高" {
  if (incrementalProfit < -50000 || utilizationRate > 118) return "高";
  if (incrementalProfit < 0 || utilizationRate > 108) return "中";
  return "低";
}

export function buildAiForecast(
  batchCode: string,
  selectedMonth: number,
  targetPrice?: number,
  strategy: ForecastStrategy = "balanced",
  basisAdjustment = 0,
): AiForecastResult {
  const batch = getBatch(batchCode);
  const month = clampMonth(selectedMonth);
  const monthlyHoldingCost = round(
    batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth,
  );
  const strategyFactor = getStrategyFactor(strategy);
  const anchoredTargetPrice = targetPrice ?? round(batch.currentSpotPrice + month * 0.38 + batch.seasonalAdjustment);
  const effectiveTargetPrice = round(anchoredTargetPrice + basisAdjustment * 0.45 + (strategyFactor - 1) * 0.9);

  const curve = Array.from({ length: 8 }, (_, index) => {
    const horizon = index + 1;
    const ratio = horizon / month;
    const controlledRatio = Math.min(1.45, ratio * (0.92 + strategyFactor * 0.08));
    const seasonalDrift = Math.sin((horizon / 8) * Math.PI) * 0.22 + basisAdjustment * 0.04 * horizon;
    const projectedPrice = round(
      batch.currentSpotPrice + (effectiveTargetPrice - batch.currentSpotPrice) * controlledRatio + seasonalDrift + (strategyFactor - 1) * horizon * 0.08,
    );
    const decisionBase = calculateDecision(batch, Math.min(horizon, 3) as 1 | 2 | 3);
    const totalCostPerKg = round(batch.unitCost + monthlyHoldingCost * horizon);
    const averageSellPrice = round((batch.currentSpotPrice + projectedPrice) / 2);
    const profitPerKg = round(projectedPrice - totalCostPerKg);
    const totalProfit = round(profitPerKg * batch.weightKg);

    return {
      month: horizon,
      label: `${horizon}M`,
      projectedPrice,
      breakEvenPrice: horizon <= 3 ? decisionBase.breakEvenPrice : totalCostPerKg,
      averageSellPrice,
      totalCostPerKg,
      profitPerKg,
      totalProfit,
    } satisfies ForecastPoint;
  });

  const actualTimeline = buildActualTimeline(batch, basisAdjustment);
  const forecastTimeline = curve.map(point => ({
    step: point.month,
    label: point.label,
    phase: "forecast",
    actualPrice: null,
    projectedPrice: point.projectedPrice,
    breakEvenPrice: point.breakEvenPrice,
    averageSellPrice: point.averageSellPrice,
    profitPerKg: point.profitPerKg,
  } satisfies ForecastTimelinePoint));

  const current = curve[month - 1]!;

  return {
    batch,
    selectedMonth: month,
    strategy,
    basisAdjustment: round(basisAdjustment),
    targetPrice: effectiveTargetPrice,
    monthlyHoldingCost,
    summary: {
      currentSpotPrice: batch.currentSpotPrice,
      projectedPrice: current.projectedPrice,
      breakEvenPrice: current.breakEvenPrice,
      averageSellPrice: current.averageSellPrice,
      profitPerKg: current.profitPerKg,
      totalProfit: current.totalProfit,
    },
    curve,
    timeline: [...actualTimeline, ...forecastTimeline],
  };
}

export function buildWhatIfSimulation(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
): AiWhatIfResult {
  const batch = getBatch(batchCode);
  const month = clampScenarioMonth(selectedMonth);
  const baseline = buildAiForecast(batchCode, month, targetPrice);
  const baselineProfit = baseline.summary.totalProfit;
  const normalizedCapacity = capacityAdjustment / 100;
  const normalizedDemand = demandAdjustment / 100;
  const utilizationRate = round(100 + capacityAdjustment * 0.68 + demandAdjustment * 0.32);
  const priceSignal = (targetPrice - 14) * batch.weightKg * 0.42;
  const demandSignal = batch.weightKg * normalizedDemand * 0.65;
  const capacitySignal = batch.weightKg * normalizedCapacity * 0.18;
  const overloadPenalty = Math.max(0, utilizationRate - 118) * 320;
  const simulatedProfit = round(baselineProfit + priceSignal + demandSignal + capacitySignal - overloadPenalty);
  const expectedRevenue = round(batch.weightKg * targetPrice * (1 + normalizedDemand * 0.08));
  const baseHeads = Math.max(900, Math.round(batch.weightKg / 6.1));

  const resources: WhatIfResourcePoint[] = [1, 2, 3].map(currentMonth => {
    const monthFactor = 0.88 + currentMonth * 0.12;
    const demandFactor = 1 + normalizedDemand * (0.8 + currentMonth * 0.06);
    const capacityFactor = 1 + normalizedCapacity * (0.7 + currentMonth * 0.08);
    const slaughterHeads = Math.round(baseHeads * monthFactor * demandFactor * capacityFactor);
    const freezingTons = round((slaughterHeads * 0.098) / 1000);
    const storageTons = round(freezingTons * (0.72 + currentMonth * 0.11));
    const warehousePallets = Math.round(storageTons * 22.5);
    const coldChainTrips = Math.max(1, Math.round(storageTons / 18));

    return {
      month: currentMonth as 1 | 2 | 3,
      slaughterHeads,
      freezingTons,
      storageTons,
      warehousePallets,
      coldChainTrips,
    };
  });

  return {
    batch,
    selectedMonth: month,
    assumptions: {
      targetPrice: round(targetPrice),
      capacityAdjustment: round(capacityAdjustment),
      demandAdjustment: round(demandAdjustment),
    },
    summary: {
      baselineProfit,
      simulatedProfit,
      incrementalProfit: round(simulatedProfit - baselineProfit),
      utilizationRate,
      expectedRevenue,
    },
    resources,
  };
}

export function buildAgentDecisionDraft(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
): AiAgentDecisionResult {
  const forecast = buildAiForecast(batchCode, selectedMonth, targetPrice);
  const simulation = buildWhatIfSimulation(
    batchCode,
    Math.max(1, Math.min(3, selectedMonth)),
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const riskLevel = toRiskLevelByIncrement(
    simulation.summary.incrementalProfit,
    simulation.summary.utilizationRate,
  );
  const coreResource = simulation.resources[simulation.selectedMonth - 1] ?? simulation.resources[0]!;

  return {
    overview: `围绕批次 ${forecast.batch.batchCode}，系统识别当前 ${simulation.selectedMonth} 个月窗口下的模拟收益为 ¥${simulation.summary.simulatedProfit.toLocaleString()}，相较基线变化 ¥${simulation.summary.incrementalProfit.toLocaleString()}。`,
    coordinationSignal:
      riskLevel === "高"
        ? "总部、业务和现场三层 Agent 需要同步进入强协同状态，并保留人工复核。"
        : riskLevel === "中"
          ? "总部与业务调度层保持主导，现场执行层按预案跟进并持续回传。"
          : "多 Agent 可以按照标准作业流协同执行，当前以利润兑现和资源平衡为主。",
    dispatchSummary: `建议围绕 ${coreResource.slaughterHeads.toLocaleString()} 头屠宰计划、${coreResource.storageTons.toFixed(2)} 吨仓储计划和 ${coreResource.coldChainTrips} 趟冷链运输组织执行。`,
    agents: [
      {
        agentId: "global",
        agentName: "CEO经营 Agent / 事业部利润 Agent",
        objective: "最大化总部利润与库存周转效率",
        recommendation:
          simulation.summary.incrementalProfit >= 0
            ? `建议维持 ${simulation.selectedMonth} 个月窗口并锁定目标价 ¥${simulation.assumptions.targetPrice}。`
            : `建议收缩持有窗口并重新评估目标价 ¥${simulation.assumptions.targetPrice} 的可达性。`,
        rationale: `当前收益增量为 ¥${simulation.summary.incrementalProfit.toLocaleString()}，资源利用率为 ${simulation.summary.utilizationRate.toFixed(2)}%。`,
        riskLevel,
        nextAction: "确认利润目标、库存节奏与跨区域资源配置边界。",
      },
      {
        agentId: "business",
        agentName: "生产编排 Agent / 物流调度 Agent",
        objective: "把总部目标拆解为屠宰、速冻、入库和运输计划",
        recommendation: `建议按 ${simulation.resources.map(item => `${item.month}月:${item.slaughterHeads.toLocaleString()}头`).join("，")} 的节奏编排生产。`,
        rationale: `资源测算显示峰值托盘需求 ${Math.max(...simulation.resources.map(item => item.warehousePallets))} 个，峰值冷链 ${Math.max(...simulation.resources.map(item => item.coldChainTrips))} 趟。`,
        riskLevel: simulation.summary.utilizationRate > 112 ? "高" : simulation.summary.utilizationRate > 105 ? "中" : "低",
        nextAction: "锁定班次、车辆与冷库窗口，并按月度需求调整排产。",
      },
      {
        agentId: "field",
        agentName: "场长运营 Agent / 环控生物安全 Agent",
        objective: "确保现场执行达标并快速反馈异常",
        recommendation:
          simulation.summary.utilizationRate > 110
            ? "建议提前增配分割工、装卸工与库管人员，避免高峰时段失衡。"
            : "建议按照标准班次推进执行，并对关键节点做时效回传。",
        rationale: `当前窗口下核心现场任务为 ${coreResource.slaughterHeads.toLocaleString()} 头屠宰、${coreResource.freezingTons.toFixed(2)} 吨速冻和 ${coreResource.storageTons.toFixed(2)} 吨入库。`,
        riskLevel,
        nextAction: "现场负责人在班前会确认班组、设备与温控标准，并准备异常升级通道。",
      },
    ],
  };
}

export function buildAgentDecisionContext(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
) {
  const forecast = buildAiForecast(batchCode, selectedMonth, targetPrice);
  const simulation = buildWhatIfSimulation(
    batchCode,
    Math.max(1, Math.min(3, selectedMonth)),
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );

  return {
    forecast,
    simulation,
    draft: buildAgentDecisionDraft(
      batchCode,
      selectedMonth,
      targetPrice,
      capacityAdjustment,
      demandAdjustment,
    ),
  };
}

export function buildAlertBoard(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
): AiAlertBoardResult {
  const forecast = buildAiForecast(batchCode, selectedMonth, targetPrice);
  const simulation = buildWhatIfSimulation(
    batchCode,
    Math.max(1, Math.min(3, selectedMonth)),
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const draft = buildAgentDecisionDraft(
    batchCode,
    selectedMonth,
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );

  const selectedResource = simulation.resources[simulation.selectedMonth - 1] ?? simulation.resources[0]!;
  const maxStorage = Math.max(...simulation.resources.map(item => item.storageTons));
  const maxTrips = Math.max(...simulation.resources.map(item => item.coldChainTrips));
  const incrementalLoss = Math.max(0, -simulation.summary.incrementalProfit);
  const priceGap = round(forecast.summary.projectedPrice - forecast.targetPrice);
  const closurePressure = simulation.summary.utilizationRate > 112 || forecast.summary.profitPerKg < 0;
  const exceptionExposure = Math.max(0, Math.round((incrementalLoss + maxTrips * 1200 + maxStorage * 2500) / 6000));

  const items: AiAlertItem[] = [
    {
      alertId: "profit-gap",
      title: "利润偏差",
      status: simulation.summary.incrementalProfit < -20000 ? "red" : simulation.summary.incrementalProfit < 10000 ? "yellow" : "green",
      summary: `相对基线收益变化 ${simulation.summary.incrementalProfit.toLocaleString()} 元。`,
      impactScope: "总部利润池 / 批次经营计划",
      estimatedLoss: round(incrementalLoss),
      aiRecommendation: draft.agents[0]?.recommendation ?? "重新校准利润目标。",
      rootCause: simulation.summary.incrementalProfit < 0 ? "目标价格与需求变化不足以覆盖持有与执行成本。" : "价格与需求改善已覆盖持有成本。",
      actionOwner: "CEO经营 Agent",
    },
    {
      alertId: "price-reachability",
      title: "价格目标可达性",
      status: priceGap < -1.2 ? "red" : priceGap < -0.3 ? "yellow" : "green",
      summary: `预测价格较目标价偏差 ${priceGap.toFixed(2)} 元/公斤。`,
      impactScope: "价格策略 / 销售兑现节奏",
      estimatedLoss: round(Math.max(0, -priceGap) * forecast.batch.weightKg * 0.18),
      aiRecommendation: priceGap < 0 ? "缩短持有窗口并重新设定目标价，优先锁定可兑现渠道。" : "维持当前价格目标并按窗口推进兑现。",
      rootCause: priceGap < 0 ? "预测价格恢复速度低于目标价格要求。" : "目标价格仍在当前预测区间内可达。",
      actionOwner: "事业部利润 Agent",
    },
    {
      alertId: "demand-volatility",
      title: "需求波动",
      status: demandAdjustment < -10 ? "red" : demandAdjustment < 0 || demandAdjustment > 20 ? "yellow" : "green",
      summary: `当前需求调整 ${demandAdjustment.toFixed(2)}%。`,
      impactScope: "销售兑现 / 区域去化节奏",
      estimatedLoss: round(Math.abs(demandAdjustment) * 900),
      aiRecommendation: "按区域节奏调整投放顺序，优先保障高周转渠道。",
      rootCause: demandAdjustment < 0 ? "终端去化偏弱，回款与库存消化速度下降。" : "需求拉升需同步校准供给节奏。",
      actionOwner: "事业部利润 Agent",
    },
    {
      alertId: "capacity-load",
      title: "产能负荷",
      status: simulation.summary.utilizationRate > 114 ? "red" : simulation.summary.utilizationRate > 105 ? "yellow" : "green",
      summary: `当前资源利用率 ${simulation.summary.utilizationRate.toFixed(2)}%。`,
      impactScope: "工厂班次 / 产线节拍",
      estimatedLoss: round(Math.max(0, simulation.summary.utilizationRate - 100) * 1600),
      aiRecommendation: draft.agents[1]?.recommendation ?? "优化排产并平衡班次。",
      rootCause: simulation.summary.utilizationRate > 110 ? "产能调整幅度过大，导致生产峰值集中。" : "当前产能处于安全区间。",
      actionOwner: "生产编排 Agent",
    },
    {
      alertId: "slaughter-rhythm",
      title: "屠宰节奏",
      status: selectedResource.slaughterHeads > 1900 ? "red" : selectedResource.slaughterHeads > 1500 ? "yellow" : "green",
      summary: `当前窗口屠宰计划 ${selectedResource.slaughterHeads.toLocaleString()} 头。`,
      impactScope: "屠宰产线 / 分割排班",
      estimatedLoss: round(selectedResource.slaughterHeads * 4.5),
      aiRecommendation: selectedResource.slaughterHeads > 1500 ? "提前锁定熟练工与分割班次，避免屠宰与分割脱节。" : "按标准节奏推进屠宰和分割。",
      rootCause: selectedResource.slaughterHeads > 1500 ? "当前月需求与产能叠加导致屠宰高峰过于集中。" : "当前屠宰任务仍处于班次可吸收范围。",
      actionOwner: "场长运营 Agent",
    },
    {
      alertId: "storage-pressure",
      title: "仓储压力",
      status: maxStorage > 0.44 ? "red" : maxStorage > 0.34 ? "yellow" : "green",
      summary: `峰值仓储吨位 ${maxStorage.toFixed(2)} 吨。`,
      impactScope: "冷库库容 / 托盘位",
      estimatedLoss: round(maxStorage * 3800),
      aiRecommendation: "锁定跨库调拨和托盘位，避免单库拥堵。",
      rootCause: maxStorage > 0.4 ? "需求提升叠加库存持有期拉长，仓储堆压上升。" : "库容压力仍可被当前计划吸收。",
      actionOwner: "仓储调度 Agent",
    },
    {
      alertId: "cold-chain",
      title: "冷链时效",
      status: maxTrips > 2 ? "red" : maxTrips > 1 ? "yellow" : "green",
      summary: `当前冷链车次峰值 ${maxTrips} 趟。`,
      impactScope: "运输时效 / 在途温控",
      estimatedLoss: round(maxTrips * 2200),
      aiRecommendation: "提前锁定司机和车辆窗口，优先保障高峰月份。",
      rootCause: maxTrips > 1 ? "峰值月份运输需求上升，需要额外车辆协调。" : "运输需求处在标准能力内。",
      actionOwner: "物流调度 Agent",
    },
    {
      alertId: "execution-closure",
      title: "执行闭环率",
      status: closurePressure ? "red" : simulation.summary.incrementalProfit < 5000 ? "yellow" : "green",
      summary: `当前窗口每公斤利润 ${forecast.summary.profitPerKg.toFixed(2)} 元，执行闭环依赖高强度协同。`,
      impactScope: "现场执行 / 回执闭环",
      estimatedLoss: round(Math.max(0, -forecast.summary.profitPerKg) * 1200 + (closurePressure ? 5000 : 0)),
      aiRecommendation: draft.agents[2]?.nextAction ?? "强化班前会和异常回传。",
      rootCause: closurePressure ? "利润空间偏薄或产能超负荷，执行链路容错率下降。" : "当前执行节奏与利润目标基本一致。",
      actionOwner: "现场执行 Agent",
    },
    {
      alertId: "exception-backlog",
      title: "升级异常积压",
      status: exceptionExposure >= 3 ? "red" : exceptionExposure >= 1 ? "yellow" : "green",
      summary: `当前异常暴露指数 ${exceptionExposure}。`,
      impactScope: "升级队列 / 管理干预频次",
      estimatedLoss: round(exceptionExposure * 6800),
      aiRecommendation: exceptionExposure >= 1 ? "建立升级分流机制，并将高损失任务优先重定向到周边产能。" : "当前异常积压可控，维持标准升级流程。",
      rootCause: exceptionExposure >= 1 ? "利润缺口、运力峰值和仓储压力叠加，导致异常处理队列上升。" : "暂无明显异常积压。",
      actionOwner: "AI 战房协调 Agent",
    },
  ];

  return {
    overview: `已生成 ${items.length} 个动态预警点，覆盖利润、价格、需求、产能、屠宰、仓储、冷链、执行闭环和升级异常。`,
    items,
  };
}

export function buildDispatchBoard(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
): DispatchBoardResult {
  const simulation = buildWhatIfSimulation(
    batchCode,
    Math.max(1, Math.min(3, selectedMonth)),
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const alerts = buildAlertBoard(
    batchCode,
    selectedMonth,
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const highRiskCount = alerts.items.filter(item => item.status === "red").length;
  const primaryResource = simulation.resources[0];
  const escalation = highRiskCount >= 2 || simulation.summary.utilizationRate > 112;

  const workOrders: DispatchWorkOrder[] = [
    {
      orderId: `${batchCode}-F-${selectedMonth}`,
      role: "厂长",
      stage: "slaughter",
      factory: "华东一厂",
      quantity: primaryResource?.slaughterHeads ?? 0,
      scheduledTime: `T+${selectedMonth} 06:30`,
      acceptanceStandard: "屠宰完成率≥98%，批次温控记录完整",
      priority: escalation ? "P1" : "P2",
      operationRequirement: "根据套利模型执行屠宰与分割排班，并在班前会确认熟练工与设备窗口。",
      escalationCondition: "若屠宰产能低于计划 90% 或分割班次未锁定，则立即升级。",
      payload: {
        batchCode,
        scenarioMonth: selectedMonth,
        slaughterHeads: primaryResource?.slaughterHeads ?? 0,
      },
    },
    {
      orderId: `${batchCode}-C-${selectedMonth}`,
      role: "司机",
      stage: "cold-chain",
      factory: "冷链调度中心",
      quantity: primaryResource?.coldChainTrips ?? 0,
      scheduledTime: `T+${selectedMonth} 09:20`,
      acceptanceStandard: "车辆准点率≥95%，在途温控异常为0",
      priority: escalation ? "P1" : "P2",
      operationRequirement: "按指定冷链路线完成装车、运输与签收，维持全程温控。",
      escalationCondition: "若车辆未按时到厂或温控异常，则立即升级。",
      payload: {
        batchCode,
        coldChainTrips: primaryResource?.coldChainTrips ?? 0,
        warehousePallets: primaryResource?.warehousePallets ?? 0,
      },
    },
    {
      orderId: `${batchCode}-W-${selectedMonth}`,
      role: "仓储管理员",
      stage: "warehouse",
      factory: "华东冷库",
      quantity: primaryResource?.warehousePallets ?? 0,
      scheduledTime: `T+${selectedMonth} 11:00`,
      acceptanceStandard: "托盘位预留完成，入库扫码准确率100%",
      priority: highRiskCount > 0 ? "P1" : "P3",
      operationRequirement: "提前预留 A 级库位，完成批次绑定、库龄标签和 FEFO 入库校验。",
      escalationCondition: "若库位不足或入库超过计划时点，则立即升级。",
      payload: {
        batchCode,
        storageTons: primaryResource?.storageTons ?? 0,
        warehousePallets: primaryResource?.warehousePallets ?? 0,
      },
    },
  ];

  const feedback: DispatchFeedbackItem[] = [
    {
      role: "厂长",
      status: escalation ? "执行中" : "已接单",
      etaMinutes: escalation ? 25 : 45,
      note: escalation ? "已锁定加班班次，等待现场确认。" : "已确认产线窗口，按标准节奏执行。",
    },
    {
      role: "司机",
      status: primaryResource && primaryResource.coldChainTrips > 1 ? "执行中" : "待确认",
      etaMinutes: primaryResource && primaryResource.coldChainTrips > 1 ? 35 : 60,
      note: primaryResource && primaryResource.coldChainTrips > 1 ? "车辆已编组，等待装车口令。" : "待冷链高峰车次确认后出车。",
    },
    {
      role: "仓储管理员",
      status: escalation ? "超时升级" : "已接单",
      etaMinutes: escalation ? 80 : 30,
      note: escalation ? "库容峰值偏高，已触发库位扩容升级。" : "库位与托盘位已按计划预留。",
    },
  ];

  return {
    summary: `已生成 ${workOrders.length} 条标准化派单，覆盖工厂、冷链与仓储执行链路。`,
    escalation,
    workOrders,
    feedback,
  };
}

export function buildDispatchExecutionSummary(
  dispatchBoard: DispatchBoardResult,
  dispatchHistory: DispatchHistoryOrder[] = [],
): DispatchExecutionSummary {
  const statuses =
    dispatchHistory.length > 0
      ? dispatchHistory.flatMap(order => {
          const latest = order.receipts[0];
          return latest ? [latest.status] : [order.currentStatus as DispatchFeedbackItem["status"]];
        })
      : dispatchBoard.feedback.map(item => item.status);

  const totalOrders = Math.max(dispatchBoard.workOrders.length, statuses.length);
  const pendingCount = statuses.filter(status => status === "待确认").length;
  const acknowledgedCount = statuses.filter(status => status === "已接单").length;
  const inProgressCount = statuses.filter(status => status === "执行中").length;
  const completedCount = statuses.filter(status => status === "已完成").length;
  const escalatedCount = statuses.filter(status => status === "超时升级").length;
  const closureRate = totalOrders === 0 ? 0 : round((completedCount / totalOrders) * 100);

  return {
    totalOrders,
    pendingCount,
    acknowledgedCount,
    inProgressCount,
    completedCount,
    escalatedCount,
    closureRate,
    blockingExceptions: escalatedCount,
  };
}

export function buildAiDecisionWorkspace(
  batchCode: string,
  selectedMonth: number,
  targetPrice: number,
  capacityAdjustment: number,
  demandAdjustment: number,
  dispatchHistory: DispatchHistoryOrder[] = [],
): AiDecisionWorkspaceResult {
  const forecast = buildAiForecast(batchCode, selectedMonth, targetPrice);
  const simulation = buildWhatIfSimulation(
    batchCode,
    Math.max(1, Math.min(3, selectedMonth)),
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const agentDecision = buildAgentDecisionDraft(
    batchCode,
    selectedMonth,
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const alertBoard = buildAlertBoard(
    batchCode,
    selectedMonth,
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const dispatchBoard = buildDispatchBoard(
    batchCode,
    selectedMonth,
    targetPrice,
    capacityAdjustment,
    demandAdjustment,
  );
  const executionSummary = buildDispatchExecutionSummary(dispatchBoard, dispatchHistory);
  const hasPersistedDispatch = dispatchHistory.length > 0;
  const hasEscalation = dispatchBoard.escalation || executionSummary.escalatedCount > 0 || alertBoard.items.some(item => item.status === "red");

  let stage: AiDecisionWorkspaceResult["lifecycle"]["stage"] = "dispatch_preview";
  if (!hasPersistedDispatch && executionSummary.completedCount === 0 && executionSummary.inProgressCount === 0) {
    stage = "decision";
  }
  if (hasPersistedDispatch) {
    stage = "dispatch_persisted";
  }
  if (executionSummary.inProgressCount > 0 || executionSummary.acknowledgedCount > 0) {
    stage = "execution_in_progress";
  }
  if (executionSummary.completedCount === executionSummary.totalOrders && executionSummary.totalOrders > 0) {
    stage = "execution_completed";
  }
  if (hasEscalation) {
    stage = "escalated";
  }

  return {
    forecast,
    simulation,
    agentDecision,
    alertBoard,
    dispatchBoard,
    executionSummary,
    dispatchHistory,
    lifecycle: {
      stage,
      hasPersistedDispatch,
      hasEscalation,
    },
  };
}
