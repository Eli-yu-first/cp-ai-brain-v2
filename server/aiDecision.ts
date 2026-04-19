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
