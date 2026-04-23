import type {
  OptimizationInput,
  OptimizationOutput,
  OptimizationSummary,
  ProfitRow,
  PigSalesRow,
  SalesRow,
  SplittingRow,
  ProductionRow,
  InventoryRow,
  TransportRow,
  SplitCostRow,
  AIOptimizationDecision,
  SlaughterScheduleRow,
  YieldRateRow,
  SlaughterCapacityRow,
  SplitCapacityRow,
  TransportCostRow,
  PartOrderRow,
  DeepProcessDemandRow,
  OptimizationScheduling2AppliedParameter,
  OptimizationScheduling2SensitivityResult,
  OptimizationScheduling2TuningInput,
} from "../shared/optimizationScheduling2";

type FactoryMonthKey = `${string}_${number}`;
type PartMonthKey = `${string}_${string}_${number}`;

function fmKey(factoryId: string, month: number): FactoryMonthKey {
  return `${factoryId}_${month}`;
}

function fpmKey(factoryId: string, part: string, month: number): PartMonthKey {
  return `${factoryId}_${part}_${month}`;
}

function getTransportCost(
  transportCosts: TransportCostRow[],
  origin: string,
  destination: string,
): number {
  const row = transportCosts.find(
    (t) => t.originProvince === origin && t.destinationProvince === destination,
  );
  if (!row) return 0;
  return row.costPerKmPerKg * row.distanceKm;
}

function buildYieldTree(yieldRates: YieldRateRow[]): Map<string, Array<{ child: string; rate: number; process: number }>> {
  const tree = new Map<string, Array<{ child: string; rate: number; process: number }>>();
  for (const row of yieldRates) {
    const children = tree.get(row.parentMaterial) ?? [];
    children.push({ child: row.childMaterial, rate: row.yieldRate, process: row.process });
    tree.set(row.parentMaterial, children);
  }
  return tree;
}

function computePartYields(
  yieldTree: Map<string, Array<{ child: string; rate: number; process: number }>>,
): Map<string, number> {
  const partYields = new Map<string, number>();
  const process1Children = yieldTree.get("毛猪") ?? [];
  for (const p1 of process1Children) {
    partYields.set(p1.child, p1.rate);
    const process2Children = yieldTree.get(p1.child) ?? [];
    for (const p2 of process2Children) {
      const combinedRate = p1.rate * p2.rate;
      partYields.set(p2.child, (partYields.get(p2.child) ?? 0) + combinedRate);
    }
  }
  return partYields;
}

function allocateSlaughterToFactories(
  schedule: SlaughterScheduleRow[],
  capacity: SlaughterCapacityRow[],
): Map<FactoryMonthKey, { province: string; allocatedCount: number; totalWeightKg: number }> {
  const capMap = new Map<FactoryMonthKey, { province: string; maxSlaughter: number; used: number }>();
  for (const c of capacity) {
    capMap.set(fmKey(c.factoryId, c.month), {
      province: c.province,
      maxSlaughter: c.maxSlaughter,
      used: 0,
    });
  }

  const provinceFactories = new Map<string, string[]>();
  for (const c of capacity) {
    const existing = provinceFactories.get(c.province) ?? [];
    if (!existing.includes(c.factoryId)) existing.push(c.factoryId);
    provinceFactories.set(c.province, existing);
  }

  const allocation = new Map<FactoryMonthKey, { province: string; allocatedCount: number; totalWeightKg: number }>();

  for (const row of schedule) {
    const factories = provinceFactories.get(row.province) ?? [];
    let remaining = row.count;
    const avgWeight = row.avgWeightKg;

    const sortedFactories = [...factories].sort((a, b) => {
      const capA = capMap.get(fmKey(a, row.month));
      const capB = capMap.get(fmKey(b, row.month));
      const remainA = capA ? capA.maxSlaughter - capA.used : 0;
      const remainB = capB ? capB.maxSlaughter - capB.used : 0;
      return remainB - remainA;
    });

    for (const factoryId of sortedFactories) {
      if (remaining <= 0) break;
      const key = fmKey(factoryId, row.month);
      const cap = capMap.get(key);
      if (!cap) continue;
      const available = cap.maxSlaughter - cap.used;
      if (available <= 0) continue;
      const allocated = Math.min(remaining, available);
      cap.used += allocated;
      remaining -= allocated;
      const existing = allocation.get(key);
      if (existing) {
        existing.allocatedCount += allocated;
        existing.totalWeightKg += allocated * avgWeight;
      } else {
        allocation.set(key, {
          province: cap.province,
          allocatedCount: allocated,
          totalWeightKg: allocated * avgWeight,
        });
      }
    }
  }

  return allocation;
}

function optimizeSalesAllocation(
  partAvailability: Map<PartMonthKey, { factoryId: string; part: string; month: number; province: string; availableKg: number }>,
  partOrders: PartOrderRow[],
  deepProcessDemand: DeepProcessDemandRow[],
  transportCosts: TransportCostRow[],
  splitCapMap: Map<PartMonthKey, SplitCapacityRow>,
): {
  salesResults: SalesRow[];
  profitResults: ProfitRow[];
  splittingResults: SplittingRow[];
  pigSalesResults: PigSalesRow[];
  remainingInventory: Map<PartMonthKey, number>;
} {
  const salesResults: SalesRow[] = [];
  const profitResults: ProfitRow[] = [];
  const splittingResults: SplittingRow[] = [];
  const pigSalesResults: PigSalesRow[] = [];
  const remainingInventory = new Map<PartMonthKey, number>();

  const demandByPartMonth = new Map<PartMonthKey, Array<{
    factoryId: string;
    part: string;
    month: number;
    customerType: string;
    orderQty: number;
    salesPrice: number;
    destinationProvince: string;
    isDeepProcess: boolean;
    profitPerKg: number;
  }>>();

  for (const order of partOrders) {
    const key = fpmKey(order.factoryId, order.part, order.month);
    const avail = partAvailability.get(key);
    if (!avail) continue;
    const transportCost = getTransportCost(transportCosts, avail.province, order.destinationProvince);
    const profitPerKg = order.salesPrice - transportCost;
    const items = demandByPartMonth.get(key) ?? [];
    items.push({
      ...order,
      isDeepProcess: false,
      profitPerKg,
    });
    demandByPartMonth.set(key, items);
  }

  for (const demand of deepProcessDemand) {
    const key = fpmKey(demand.factoryId, demand.part, demand.month);
    const avail = partAvailability.get(key);
    if (!avail) continue;
    const transportCost = getTransportCost(transportCosts, avail.province, demand.destinationProvince);
    const profitPerKg = demand.salesPrice - transportCost;
    const items = demandByPartMonth.get(key) ?? [];
    items.push({
      factoryId: demand.factoryId,
      part: demand.part,
      month: demand.month,
      customerType: demand.factoryType,
      orderQty: demand.rawMaterialDemand,
      salesPrice: demand.salesPrice,
      destinationProvince: demand.destinationProvince,
      isDeepProcess: true,
      profitPerKg,
    });
    demandByPartMonth.set(key, items);
  }

  Array.from(demandByPartMonth.entries()).forEach(([key, items]) => {
    items.sort((a: typeof items[0], b: typeof items[0]) => b.profitPerKg - a.profitPerKg);
    demandByPartMonth.set(key, items);
  });

  Array.from(partAvailability.entries()).forEach(([key, avail]) => {
    let remaining = avail.availableKg;
    const demands = demandByPartMonth.get(key) ?? [];
    const splitCap = splitCapMap.get(key);
    let totalSplitKg = 0;
    let totalFreezeKg = 0;

    for (const demand of demands) {
      if (remaining <= 0) break;
      const fulfilledQty = Math.min(remaining, demand.orderQty);
      if (fulfilledQty <= 0) continue;

      const transportCost = getTransportCost(transportCosts, avail.province, demand.destinationProvince);
      const revenue = fulfilledQty * demand.salesPrice;
      const tCost = fulfilledQty * transportCost;

      salesResults.push({
        factoryId: demand.factoryId,
        month: demand.month,
        part: demand.part,
        customerType: demand.customerType,
        orderQty: fulfilledQty,
        salesPrice: demand.salesPrice,
        province: demand.destinationProvince,
      });

      profitResults.push({
        factoryId: demand.factoryId,
        month: demand.month,
        part: demand.part,
        inventoryKg: 0,
        salesKg: fulfilledQty,
        price: demand.salesPrice,
        revenue: Math.round(revenue * 100) / 100,
        salesProvince: demand.destinationProvince,
        pigCost: 0,
        storageCost: 0,
        transportCost: Math.round(tCost * 100) / 100,
        profit: 0,
      });

      totalSplitKg += fulfilledQty;
      remaining -= fulfilledQty;
    }

    if (remaining > 0) {
      const maxFreeze = splitCap?.maxFreezeKg ?? 0;
      const freezeQty = Math.min(remaining, maxFreeze);
      totalFreezeKg = freezeQty;
      remaining -= freezeQty;
    }

    splittingResults.push({
      factoryId: avail.factoryId,
      month: avail.month,
      part: avail.part,
      splitKg: totalSplitKg,
      freezeKg: totalFreezeKg,
    });

    remainingInventory.set(key, Math.max(0, remaining));
  });

  return { salesResults, profitResults, splittingResults, pigSalesResults, remainingInventory };
}

function computePigCostAllocation(
  profitResults: ProfitRow[],
  allocation: Map<FactoryMonthKey, { province: string; allocatedCount: number; totalWeightKg: number }>,
  schedule: SlaughterScheduleRow[],
  yieldTree: Map<string, Array<{ child: string; rate: number; process: number }>>,
  partYields: Map<string, number>,
  splitCapMap: Map<PartMonthKey, SplitCapacityRow>,
): ProfitRow[] {
  const factoryMonthPigCost = new Map<FactoryMonthKey, number>();

  Array.from(allocation.entries()).forEach(([key, alloc]) => {
    const [factoryId, monthStr] = key.split("_");
    const month = parseInt(monthStr, 10);
    const scheduleRows = schedule.filter(
      (s) => s.province === alloc.province && s.month === month,
    );
    const avgPigPrice = scheduleRows.length > 0
      ? scheduleRows.reduce((sum, s) => sum + s.livePigPrice * s.count, 0) /
        scheduleRows.reduce((sum, s) => sum + s.count, 0)
      : 0;
    const totalPigCost = alloc.totalWeightKg * avgPigPrice;
    factoryMonthPigCost.set(key, totalPigCost);
  });

  const partWeightByFM = new Map<FactoryMonthKey, Map<string, number>>();
  Array.from(allocation.entries()).forEach(([key, alloc]) => {
    const [factoryId, monthStr] = key.split("_");
    const month = parseInt(monthStr, 10);
    const partWeights = new Map<string, number>();
    Array.from(partYields.entries()).forEach(([part, yieldRate]) => {
      partWeights.set(part, alloc.totalWeightKg * yieldRate);
    });
    partWeightByFM.set(key, partWeights);
  });

  const totalPartWeightByFM = new Map<FactoryMonthKey, number>();
  Array.from(partWeightByFM.entries()).forEach(([key, partWeights]) => {
    let total = 0;
    Array.from(partWeights.values()).forEach(weight => { total += weight; });
    totalPartWeightByFM.set(key, total);
  });

  for (const profit of profitResults) {
    const fmK = fmKey(profit.factoryId, profit.month);
    const pigCostTotal = factoryMonthPigCost.get(fmK) ?? 0;
    const totalPartW = totalPartWeightByFM.get(fmK) ?? 1;
    const partW = partWeightByFM.get(fmK)?.get(profit.part) ?? 0;
    const pigCostShare = totalPartW > 0 ? (partW / totalPartW) * pigCostTotal : 0;
    const pigCostPerKg = profit.salesKg > 0 ? pigCostShare / profit.salesKg : 0;

    const scKey = fpmKey(profit.factoryId, profit.part, profit.month);
    const splitCap = splitCapMap.get(scKey);
    const storageCostRate = splitCap?.storageCostRate ?? 0.5;
    const storageCost = profit.salesKg * storageCostRate;

    profit.pigCost = Math.round(pigCostPerKg * profit.salesKg * 100) / 100;
    profit.storageCost = Math.round(storageCost * 100) / 100;
    profit.profit = Math.round((profit.revenue - profit.pigCost - profit.storageCost - profit.transportCost) * 100) / 100;
  }

  return profitResults;
}

function generatePigSales(
  allocation: Map<FactoryMonthKey, { province: string; allocatedCount: number; totalWeightKg: number }>,
): PigSalesRow[] {
  const results: PigSalesRow[] = [];
  Array.from(allocation.entries()).forEach(([key, alloc]) => {
    const [factoryId, monthStr] = key.split("_");
    const month = parseInt(monthStr, 10);
    if (alloc.allocatedCount > 0) {
      results.push({
        factoryId,
        month,
        salesQty: alloc.allocatedCount,
        province: alloc.province,
      });
    }
  });
  return results;
}

function computeSummary(
  profitResults: ProfitRow[],
  pigSalesResults: PigSalesRow[],
  splittingResults: SplittingRow[],
  allocation: Map<FactoryMonthKey, { province: string; allocatedCount: number; totalWeightKg: number }>,
  capacity: SlaughterCapacityRow[],
): OptimizationSummary {
  let totalRevenue = 0;
  let totalPigCost = 0;
  let totalStorageCost = 0;
  let totalTransportCost = 0;
  let totalProfit = 0;
  let totalSalesKg = 0;
  let totalFreezeKg = 0;

  for (const p of profitResults) {
    totalRevenue += p.revenue;
    totalPigCost += p.pigCost;
    totalStorageCost += p.storageCost;
    totalTransportCost += p.transportCost;
    totalProfit += p.profit;
    totalSalesKg += p.salesKg;
  }

  for (const s of splittingResults) {
    totalFreezeKg += s.freezeKg;
  }

  const totalSlaughterCount = pigSalesResults.reduce((sum, p) => sum + p.salesQty, 0);
  const totalMaxCapacity = capacity.reduce((sum, c) => sum + c.maxSlaughter, 0);
  const totalAllocated = Array.from(allocation.values()).reduce((sum, a) => sum + a.allocatedCount, 0);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalPigCost: Math.round(totalPigCost * 100) / 100,
    totalStorageCost: Math.round(totalStorageCost * 100) / 100,
    totalTransportCost: Math.round(totalTransportCost * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
    totalSlaughterCount,
    totalSalesKg: Math.round(totalSalesKg),
    totalFreezeKg: Math.round(totalFreezeKg),
    avgProfitPerPig: totalSlaughterCount > 0 ? Math.round((totalProfit / totalSlaughterCount) * 100) / 100 : 0,
    capacityUtilization: totalMaxCapacity > 0 ? Math.round((totalAllocated / totalMaxCapacity) * 10000) / 100 : 0,
  };
}

export function buildTunedOptimizationInput(
  baseInput: OptimizationInput,
  tuning: OptimizationScheduling2TuningInput = {},
): {
  input: OptimizationInput;
  appliedParameters: OptimizationScheduling2AppliedParameter[];
} {
  const appliedParameters: OptimizationScheduling2AppliedParameter[] = [];
  const slaughterCountMultiplier = tuning.slaughterCountMultiplier ?? 1;
  const avgWeightAdjustmentKg = tuning.avgWeightAdjustmentKg ?? 0;
  const livePigPriceAdjustment = tuning.livePigPriceAdjustment ?? 0;
  const slaughterCapacityMultiplier = tuning.slaughterCapacityMultiplier ?? 1;
  const splitCapacityMultiplier = tuning.splitCapacityMultiplier ?? 1;
  const freezeCapacityMultiplier = tuning.freezeCapacityMultiplier ?? 1;
  const storageCostMultiplier = tuning.storageCostMultiplier ?? 1;
  const transportCostMultiplier = tuning.transportCostMultiplier ?? 1;
  const partPriceAdjustments = tuning.partPriceAdjustments ?? {};

  const partPriceAverages = new Map<string, number>();
  Object.entries(partPriceAdjustments).forEach(([part, delta]) => {
    if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return;
    const matchingOrders = baseInput.partOrders.filter((row) => row.part === part);
    if (matchingOrders.length === 0) return;
    const average = matchingOrders.reduce((sum, row) => sum + row.salesPrice, 0) / matchingOrders.length;
    partPriceAverages.set(part, average);
    appliedParameters.push({
      key: `part-price-${part}`,
      label: `${part}售价`,
      previousValue: Math.round(average * 100) / 100,
      nextValue: Math.round((average + delta) * 100) / 100,
      unit: "元/kg",
    });
  });

  if (slaughterCountMultiplier !== 1) {
    appliedParameters.push({
      key: "slaughter-count-multiplier",
      label: "出栏量",
      previousValue: 100,
      nextValue: Math.round(slaughterCountMultiplier * 1000) / 10,
      unit: "%",
    });
  }
  if (avgWeightAdjustmentKg !== 0) {
    appliedParameters.push({
      key: "avg-weight-adjustment",
      label: "均重",
      previousValue: 0,
      nextValue: avgWeightAdjustmentKg,
      unit: "kg",
    });
  }
  if (livePigPriceAdjustment !== 0) {
    appliedParameters.push({
      key: "live-pig-price-adjustment",
      label: "活猪成本",
      previousValue: 0,
      nextValue: livePigPriceAdjustment,
      unit: "元/kg",
    });
  }
  if (slaughterCapacityMultiplier !== 1) {
    appliedParameters.push({
      key: "slaughter-capacity-multiplier",
      label: "屠宰产能",
      previousValue: 100,
      nextValue: Math.round(slaughterCapacityMultiplier * 1000) / 10,
      unit: "%",
    });
  }
  if (splitCapacityMultiplier !== 1) {
    appliedParameters.push({
      key: "split-capacity-multiplier",
      label: "分割能力",
      previousValue: 100,
      nextValue: Math.round(splitCapacityMultiplier * 1000) / 10,
      unit: "%",
    });
  }
  if (freezeCapacityMultiplier !== 1) {
    appliedParameters.push({
      key: "freeze-capacity-multiplier",
      label: "冷冻能力",
      previousValue: 100,
      nextValue: Math.round(freezeCapacityMultiplier * 1000) / 10,
      unit: "%",
    });
  }
  if (storageCostMultiplier !== 1) {
    appliedParameters.push({
      key: "storage-cost-multiplier",
      label: "仓储成本",
      previousValue: 100,
      nextValue: Math.round(storageCostMultiplier * 1000) / 10,
      unit: "%",
    });
  }
  if (transportCostMultiplier !== 1) {
    appliedParameters.push({
      key: "transport-cost-multiplier",
      label: "运输成本",
      previousValue: 100,
      nextValue: Math.round(transportCostMultiplier * 1000) / 10,
      unit: "%",
    });
  }

  return {
    input: {
      ...baseInput,
      slaughterSchedule: baseInput.slaughterSchedule.map((row) => ({
        ...row,
        count: Math.max(0, Math.round(row.count * slaughterCountMultiplier)),
        avgWeightKg: Math.max(1, Math.round((row.avgWeightKg + avgWeightAdjustmentKg) * 100) / 100),
        livePigPrice: Math.max(0, Math.round((row.livePigPrice + livePigPriceAdjustment) * 100) / 100),
      })),
      slaughterCapacity: baseInput.slaughterCapacity.map((row) => ({
        ...row,
        maxSlaughter: Math.max(0, Math.round(row.maxSlaughter * slaughterCapacityMultiplier)),
      })),
      splitCapacity: baseInput.splitCapacity.map((row) => ({
        ...row,
        maxSplitKg: Math.max(0, Math.round(row.maxSplitKg * splitCapacityMultiplier)),
        maxFreezeKg: Math.max(0, Math.round(row.maxFreezeKg * freezeCapacityMultiplier)),
        maxStorageKg: Math.max(0, Math.round(row.maxStorageKg * freezeCapacityMultiplier)),
        storageCostRate: Math.max(0, Math.round(row.storageCostRate * storageCostMultiplier * 100) / 100),
      })),
      warehouses: baseInput.warehouses.map((row) => ({
        ...row,
        storageCostRate: Math.max(0, Math.round(row.storageCostRate * storageCostMultiplier * 100) / 100),
      })),
      partOrders: baseInput.partOrders.map((row) => ({
        ...row,
        salesPrice: Math.max(0, Math.round((row.salesPrice + (partPriceAdjustments[row.part] ?? 0)) * 100) / 100),
      })),
      deepProcessDemand: baseInput.deepProcessDemand.map((row) => ({
        ...row,
        salesPrice: Math.max(0, Math.round((row.salesPrice + (partPriceAdjustments[row.part] ?? 0)) * 100) / 100),
      })),
      transportCosts: baseInput.transportCosts.map((row) => ({
        ...row,
        costPerKmPerKg: Math.max(0, Math.round(row.costPerKmPerKg * transportCostMultiplier * 1000000) / 1000000),
      })),
    },
    appliedParameters,
  };
}

export function buildOptimizationSensitivity(
  baseOutput: OptimizationOutput,
  nextOutput: OptimizationOutput,
  baseDecision: AIOptimizationDecision,
  nextDecision: AIOptimizationDecision,
): OptimizationScheduling2SensitivityResult {
  return {
    totalProfitDelta: Math.round((nextOutput.summary.totalProfit - baseOutput.summary.totalProfit) * 100) / 100,
    profitMarginDelta: Math.round((nextOutput.summary.profitMargin - baseOutput.summary.profitMargin) * 100) / 100,
    capacityUtilizationDelta: Math.round((nextOutput.summary.capacityUtilization - baseOutput.summary.capacityUtilization) * 100) / 100,
    bottleneckDelta: nextDecision.bottlenecks.length - baseDecision.bottlenecks.length,
  };
}

export function buildOptimizationChatFallback(message: string): OptimizationScheduling2TuningInput {
  const content = message.toLowerCase();
  const tuning: OptimizationScheduling2TuningInput = {};

  if (content.includes("提高") || content.includes("增加") || content.includes("上调")) {
    tuning.slaughterCapacityMultiplier = 1.1;
  }
  if (content.includes("降低") || content.includes("减少") || content.includes("下调")) {
    tuning.transportCostMultiplier = 0.9;
  }
  if (content.includes("价格") || content.includes("售价")) {
    tuning.partPriceAdjustments = { 白条: 0.8, 五花肉: 1.2 };
  }
  if (content.includes("产能")) {
    tuning.slaughterCapacityMultiplier = tuning.slaughterCapacityMultiplier ?? 0.9;
  }
  if (content.includes("仓储") || content.includes("冷冻")) {
    tuning.storageCostMultiplier = 0.9;
    tuning.freezeCapacityMultiplier = 1.1;
  }

  return tuning;
}

export function solveOptimization(input: OptimizationInput): OptimizationOutput {
  const yieldTree = buildYieldTree(input.yieldRates);
  const partYields = computePartYields(yieldTree);

  const allocation = allocateSlaughterToFactories(input.slaughterSchedule, input.slaughterCapacity);

  const partAvailability = new Map<PartMonthKey, {
    factoryId: string;
    part: string;
    month: number;
    province: string;
    availableKg: number;
  }>();

  const splitCapMap = new Map<PartMonthKey, SplitCapacityRow>();
  for (const sc of input.splitCapacity) {
    splitCapMap.set(fpmKey(sc.factoryId, sc.part, sc.month), sc);
  }

  Array.from(allocation.entries()).forEach(([key, alloc]) => {
    const [factoryId, monthStr] = key.split("_");
    const month = parseInt(monthStr, 10);
    Array.from(partYields.entries()).forEach(([part, yieldRate]) => {
      const pKey = fpmKey(factoryId, part, month);
      const existing = partAvailability.get(pKey);
      const producedKg = alloc.totalWeightKg * yieldRate;
      const sc = splitCapMap.get(pKey);
      const cappedKg = sc ? Math.min(producedKg, sc.maxSplitKg) : producedKg;
      if (existing) {
        existing.availableKg += cappedKg;
      } else {
        partAvailability.set(pKey, {
          factoryId,
          part,
          month,
          province: alloc.province,
          availableKg: cappedKg,
        });
      }
    });
  });

  const {
    salesResults,
    profitResults,
    splittingResults,
    pigSalesResults: _pigSales,
    remainingInventory,
  } = optimizeSalesAllocation(
    partAvailability,
    input.partOrders,
    input.deepProcessDemand,
    input.transportCosts,
    splitCapMap,
  );

  const pigSalesResults = generatePigSales(allocation);

  const finalProfitResults = computePigCostAllocation(
    profitResults,
    allocation,
    input.slaughterSchedule,
    yieldTree,
    partYields,
    splitCapMap,
  );

  // 新增：生成生产表、库存表、运输表
  const productionTable: ProductionRow[] = [];
  const inventoryTable: InventoryRow[] = [];
  const transportTable: TransportRow[] = [];

  // 根据分割表生成生产表
  for (const s of splittingResults) {
    const matchingSales = finalProfitResults
      .filter(p => p.factoryId === s.factoryId && p.month === s.month && p.part === s.part)
      .reduce((sum, p) => sum + p.salesKg, 0);
    const inv = Math.max(0, s.splitKg + s.freezeKg - matchingSales);
    productionTable.push({
      factoryId: s.factoryId,
      month: s.month,
      part: s.part,
      productionKg: Math.round(s.splitKg),
      salesKg: Math.round(matchingSales),
      inventoryKg: Math.round(inv),
    });
    if (inv > 0) {
      inventoryTable.push({
        factoryId: s.factoryId,
        month: s.month,
        part: s.part,
        inventoryKg: Math.round(inv),
      });
    }
  }

  // 根据利润表生成运输表
  for (const p of finalProfitResults) {
    if (p.salesKg > 0) {
      transportTable.push({
        factoryId: p.factoryId,
        month: p.month,
        part: p.part,
        destProvince: p.salesProvince,
        transportKg: Math.round(p.salesKg),
      });
    }
  }

  const summary = computeSummary(
    finalProfitResults,
    pigSalesResults,
    splittingResults,
    allocation,
    input.slaughterCapacity,
  );

  return {
    profitTable: finalProfitResults,
    pigSalesTable: pigSalesResults,
    salesTable: salesResults,
    splittingTable: splittingResults,
    productionTable,
    inventoryTable,
    transportTable,
    summary,
  };
}

export function generateAIDecision(
  input: OptimizationInput,
  output: OptimizationOutput,
): AIOptimizationDecision {
  const { summary } = output;
  const keyFindings: string[] = [];
  const bottlenecks: string[] = [];
  const recommendations: string[] = [];
  const roleActions: AIOptimizationDecision["roleActions"] = {
    purchasing: [],
    production: [],
    sales: [],
    warehouse: [],
  };
  const riskWarnings: string[] = [];
  const profitOptimization: string[] = [];

  if (summary.profitMargin > 15) {
    keyFindings.push(`整体利润率 ${summary.profitMargin}% 表现优秀，当前策略盈利能力强`);
  } else if (summary.profitMargin > 5) {
    keyFindings.push(`整体利润率 ${summary.profitMargin}% 处于中等水平，存在优化空间`);
  } else if (summary.profitMargin > 0) {
    keyFindings.push(`整体利润率仅 ${summary.profitMargin}%，利润微薄，需重点关注成本控制`);
    riskWarnings.push("利润率过低，市场波动可能导致亏损");
  } else {
    keyFindings.push(`整体利润率 ${summary.profitMargin}%，当前方案处于亏损状态，需紧急调整`);
    riskWarnings.push("当前方案亏损，需立即启动应急预案");
  }

  keyFindings.push(`总屠宰量 ${summary.totalSlaughterCount.toLocaleString()} 头，产能利用率 ${summary.capacityUtilization}%`);
  keyFindings.push(`总销售收入 ${(summary.totalRevenue / 10000).toFixed(1)} 万元，总利润 ${(summary.totalProfit / 10000).toFixed(1)} 万元`);
  keyFindings.push(`头均利润 ${summary.avgProfitPerPig.toFixed(2)} 元/头`);

  if (summary.capacityUtilization < 70) {
    bottlenecks.push(`产能利用率仅 ${summary.capacityUtilization}%，存在大量闲置产能`);
    recommendations.push("建议增加屠宰量或优化产能分配，提高利用率");
    roleActions.production.push("评估各工厂产能利用率，制定产能提升方案");
  } else if (summary.capacityUtilization > 95) {
    bottlenecks.push(`产能利用率高达 ${summary.capacityUtilization}%，接近满产，扩展空间有限`);
    recommendations.push("建议评估扩产可能性或优化排产计划");
    roleActions.production.push("制定产能扩展计划，评估新增产线投资回报");
  }

  const profitByPart = new Map<string, { totalProfit: number; totalSales: number }>();
  for (const p of output.profitTable) {
    const existing = profitByPart.get(p.part) ?? { totalProfit: 0, totalSales: 0 };
    existing.totalProfit += p.profit;
    existing.totalSales += p.salesKg;
    profitByPart.set(p.part, existing);
  }

  let bestPart = "";
  let worstPart = "";
  let bestMargin = -Infinity;
  let worstMargin = Infinity;
  Array.from(profitByPart.entries()).forEach(([part, data]) => {
    if (data.totalSales === 0) return;
    const margin = data.totalProfit / data.totalSales;
    if (margin > bestMargin) {
      bestMargin = margin;
      bestPart = part;
    }
    if (margin < worstMargin) {
      worstMargin = margin;
      worstPart = part;
    }
  });

  if (bestPart) {
    keyFindings.push(`最高利润部位: ${bestPart}，单位利润 ${(bestMargin * 100).toFixed(1)} 元/kg`);
    profitOptimization.push(`加大${bestPart}的生产和销售比重，优先保障高利润部位产能`);
  }
  if (worstPart && worstPart !== bestPart) {
    keyFindings.push(`最低利润部位: ${worstPart}，单位利润 ${(worstMargin * 100).toFixed(1)} 元/kg`);
    profitOptimization.push(`评估${worstPart}的亏损原因，考虑减少产量或调整销售策略`);
    if (worstMargin < 0) {
      riskWarnings.push(`${worstPart}处于亏损状态，单位亏损 ${Math.abs(worstMargin * 100).toFixed(1)} 元/kg`);
      roleActions.sales.push(`紧急评估${worstPart}的销售渠道和定价策略，考虑转向深加工渠道`);
    }
  }

  const profitByMonth = new Map<number, number>();
  for (const p of output.profitTable) {
    profitByMonth.set(p.month, (profitByMonth.get(p.month) ?? 0) + p.profit);
  }
  let bestMonth = 0;
  let worstMonth = 0;
  let bestMonthProfit = -Infinity;
  let worstMonthProfit = Infinity;
  Array.from(profitByMonth.entries()).forEach(([month, profit]) => {
    if (profit > bestMonthProfit) {
      bestMonthProfit = profit;
      bestMonth = month;
    }
    if (profit < worstMonthProfit) {
      worstMonthProfit = profit;
      worstMonth = month;
    }
  });
  if (bestMonth > 0) {
    keyFindings.push(`最佳月份: ${bestMonth}月，利润 ${(bestMonthProfit / 10000).toFixed(1)} 万元`);
  }
  if (worstMonth > 0 && worstMonth !== bestMonth) {
    keyFindings.push(`最差月份: ${worstMonth}月，利润 ${(worstMonthProfit / 10000).toFixed(1)} 万元`);
    if (worstMonthProfit < 0) {
      riskWarnings.push(`${worstMonth}月预计亏损，需提前制定应对策略`);
    }
  }

  const costRatio = summary.totalRevenue > 0
    ? {
      pig: (summary.totalPigCost / summary.totalRevenue * 100).toFixed(1),
      storage: (summary.totalStorageCost / summary.totalRevenue * 100).toFixed(1),
      transport: (summary.totalTransportCost / summary.totalRevenue * 100).toFixed(1),
    }
    : { pig: "0", storage: "0", transport: "0" };

  keyFindings.push(`成本结构: 毛猪成本占 ${costRatio.pig}%，仓储成本占 ${costRatio.storage}%，运输成本占 ${costRatio.transport}%`);

  if (parseFloat(costRatio.pig) > 80) {
    bottlenecks.push("毛猪成本占比过高，是利润的主要压缩因素");
    roleActions.purchasing.push("优化采购策略，锁定低价毛猪货源，考虑期货套保");
    profitOptimization.push("通过集中采购和长期合同降低毛猪采购成本");
  }

  if (parseFloat(costRatio.transport) > 5) {
    bottlenecks.push("运输成本占比偏高，需优化物流路线");
    roleActions.warehouse.push("优化仓储布局，减少跨省运输，优先就近销售");
    profitOptimization.push("优化运输路线，考虑区域化销售策略降低物流成本");
  }

  const salesByCustomerType = new Map<string, { qty: number; revenue: number }>();
  for (const s of output.salesTable) {
    const existing = salesByCustomerType.get(s.customerType) ?? { qty: 0, revenue: 0 };
    existing.qty += s.orderQty;
    existing.revenue += s.orderQty * s.salesPrice;
    salesByCustomerType.set(s.customerType, existing);
  }

  let bestChannel = "";
  let bestChannelRevenue = 0;
  Array.from(salesByCustomerType.entries()).forEach(([channel, data]) => {
    if (data.revenue > bestChannelRevenue) {
      bestChannelRevenue = data.revenue;
      bestChannel = channel;
    }
  });
  if (bestChannel) {
    keyFindings.push(`最大销售渠道: ${bestChannel}，贡献收入 ${(bestChannelRevenue / 10000).toFixed(1)} 万元`);
  }

  const deepProcessSales = salesByCustomerType.get("自有深加工");
  const oemSales = salesByCustomerType.get("OEM深加工");
  if (!deepProcessSales || deepProcessSales.revenue < (oemSales?.revenue ?? 0)) {
    recommendations.push("自有深加工渠道收入较低，建议提升深加工产能利用率");
    roleActions.production.push("评估自有深加工产线利用率，制定满产计划");
  }

  const freezeRatio = summary.totalSalesKg > 0
    ? (summary.totalFreezeKg / (summary.totalSalesKg + summary.totalFreezeKg) * 100).toFixed(1)
    : "0";
  if (parseFloat(freezeRatio) > 30) {
    bottlenecks.push(`冷冻比例 ${freezeRatio}% 偏高，仓储压力大`);
    roleActions.warehouse.push("加快冷冻品出库速度，制定促销方案消化库存");
    riskWarnings.push("高冷冻比例增加仓储成本和损耗风险");
  }

  recommendations.push("持续监控毛猪价格波动，及时调整屠宰和销售计划");
  recommendations.push("优化分割方案，提高高价值部位出品率");
  recommendations.push("建立区域化销售网络，减少长距离运输");

  roleActions.purchasing.push("根据月度利润预测，在低价月份增加采购量");
  roleActions.purchasing.push("与主要养殖场建立长期合作关系，稳定供应");
  roleActions.production.push("优化屠宰排产计划，确保高价值部位优先分割");
  roleActions.production.push("定期维护设备，减少非计划停机时间");
  roleActions.sales.push("拓展商超和餐饮连锁等高价值渠道");
  roleActions.sales.push("根据部位利润排名，优先销售高利润部位");
  roleActions.warehouse.push("实施FEFO（先入先出）管理，降低库存损耗");
  roleActions.warehouse.push("优化冷库布局，提高库容利用率");

  if (summary.totalProfit > 0) {
    profitOptimization.push(`当前方案总利润 ${(summary.totalProfit / 10000).toFixed(1)} 万元，可通过以上措施进一步提升`);
  } else {
    profitOptimization.push("当前方案亏损，建议重新评估整体策略，考虑减产或调整产品结构");
  }

  profitOptimization.push("利用期货工具对冲毛猪价格波动风险");
  profitOptimization.push("开发高附加值深加工产品，提升整体利润率");

  const overview = summary.totalProfit > 0
    ? `最优化调度方案已完成，预计总利润 ${(summary.totalProfit / 10000).toFixed(1)} 万元，利润率 ${summary.profitMargin}%。屠宰 ${summary.totalSlaughterCount.toLocaleString()} 头，产能利用率 ${summary.capacityUtilization}%。头均利润 ${summary.avgProfitPerPig.toFixed(2)} 元。`
    : `最优化调度方案显示当前条件下预计亏损 ${Math.abs(summary.totalProfit / 10000).toFixed(1)} 万元，利润率 ${summary.profitMargin}%。需要紧急调整策略。`;

  return {
    overview,
    keyFindings,
    bottlenecks,
    recommendations,
    roleActions,
    riskWarnings,
    profitOptimization,
  };
}
