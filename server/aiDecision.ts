import { calculateDecision, inventoryBatches, type InventoryBatch } from "./platformData";

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

export type AiForecastResult = {
  batch: InventoryBatch;
  selectedMonth: number;
  targetPrice: number;
  monthlyHoldingCost: number;
  summary: {
    projectedPrice: number;
    breakEvenPrice: number;
    averageSellPrice: number;
    profitPerKg: number;
    totalProfit: number;
  };
  curve: ForecastPoint[];
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

function toRiskLevelByIncrement(incrementalProfit: number, utilizationRate: number): "低" | "中" | "高" {
  if (incrementalProfit < -50000 || utilizationRate > 118) return "高";
  if (incrementalProfit < 0 || utilizationRate > 108) return "中";
  return "低";
}

export function buildAiForecast(batchCode: string, selectedMonth: number, targetPrice?: number): AiForecastResult {
  const batch = getBatch(batchCode);
  const month = clampMonth(selectedMonth);
  const monthlyHoldingCost = round(
    batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth,
  );
  const anchoredTargetPrice = targetPrice ?? round(batch.currentSpotPrice + month * 0.38 + batch.seasonalAdjustment);

  const curve = Array.from({ length: 8 }, (_, index) => {
    const horizon = index + 1;
    const ratio = horizon / month;
    const seasonalDrift = Math.sin((horizon / 8) * Math.PI) * 0.22;
    const projectedPrice = round(
      batch.currentSpotPrice + (anchoredTargetPrice - batch.currentSpotPrice) * ratio + seasonalDrift,
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

  const current = curve[month - 1]!;

  return {
    batch,
    selectedMonth: month,
    targetPrice: anchoredTargetPrice,
    monthlyHoldingCost,
    summary: {
      projectedPrice: current.projectedPrice,
      breakEvenPrice: current.breakEvenPrice,
      averageSellPrice: current.averageSellPrice,
      profitPerKg: current.profitPerKg,
      totalProfit: current.totalProfit,
    },
    curve,
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

  const maxStorage = Math.max(...simulation.resources.map(item => item.storageTons));
  const maxTrips = Math.max(...simulation.resources.map(item => item.coldChainTrips));
  const incrementalLoss = Math.max(0, -simulation.summary.incrementalProfit);

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
      alertId: "utilization",
      title: "产能利用率",
      status: simulation.summary.utilizationRate > 114 ? "red" : simulation.summary.utilizationRate > 105 ? "yellow" : "green",
      summary: `当前资源利用率 ${simulation.summary.utilizationRate.toFixed(2)}%。`,
      impactScope: "工厂班次 / 产线节拍",
      estimatedLoss: round(Math.max(0, simulation.summary.utilizationRate - 100) * 1600),
      aiRecommendation: draft.agents[1]?.recommendation ?? "优化排产并平衡班次。",
      rootCause: simulation.summary.utilizationRate > 110 ? "产能调整幅度过大，导致生产峰值集中。" : "当前产能处于安全区间。",
      actionOwner: "生产编排 Agent",
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
      alertId: "execution-rhythm",
      title: "执行节奏",
      status: forecast.summary.profitPerKg < -8 ? "red" : forecast.summary.profitPerKg < -3 ? "yellow" : "green",
      summary: `当前预测窗口每公斤利润 ${forecast.summary.profitPerKg.toFixed(2)} 元。`,
      impactScope: "现场执行 / 经营兑现",
      estimatedLoss: round(Math.max(0, -forecast.summary.profitPerKg) * 1200),
      aiRecommendation: draft.agents[2]?.nextAction ?? "强化班前会和异常回传。",
      rootCause: forecast.summary.profitPerKg < 0 ? "价格恢复速度慢于持有成本累积速度。" : "执行节奏与利润目标基本一致。",
      actionOwner: "现场执行 Agent",
    },
  ];

  return {
    overview: `已生成 ${items.length} 个动态预警点，覆盖利润、产能、仓储、冷链、需求和执行节奏。`,
    items,
  };
}
