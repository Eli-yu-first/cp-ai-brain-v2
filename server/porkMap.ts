import { buildPorkMarketSnapshot, type RegionQuote } from "./marketData";
import { inventoryBatches } from "./platformData";

export type PorkMapMetric = "hogPrice" | "cornPrice" | "soymealPrice";
export type PorkMapScenario = "margin" | "logistics" | "balanced";

export type PorkMapNode = {
  regionCode: string;
  regionName: string;
  coordinates: [number, number];
  liveHogPrice: number;
  cornPrice: number;
  soymealPrice: number;
  liveHogChange: number;
  marginIndex: number;
  supplyPressure: number;
  demandHeat: number;
  coldStorageLoad: number;
  slaughterCapacity: number;
  arbitrageSignal: "观察" | "关注" | "机会";
};

export type PorkWarehouseMarker = {
  batchCode: string;
  warehouse: string;
  partName: string;
  coordinates: [number, number];
  weightKg: number;
  unitCost: number;
  currentSpotPrice: number;
  futuresMappedPrice: number;
};

export type PorkArbitrageOpportunity = {
  routeId: string;
  sourceRegionCode: string;
  sourceRegionName: string;
  targetRegionCode: string;
  targetRegionName: string;
  spread: number;
  estimatedFreight: number;
  netArbitrage: number;
  confidence: "低" | "中" | "高";
  reason: string;
};

export type PorkBusinessMapResult = {
  generatedAt: number;
  selectedMetric: PorkMapMetric;
  selectedScenario: PorkMapScenario;
  nationalAverage: {
    hogPrice: number;
    cornPrice: number;
    soymealPrice: number;
  };
  summary: {
    visibleRegions: number;
    opportunityCount: number;
    highOpportunityCount: number;
    avgMarginIndex: number;
    maxSpread: number;
  };
  nodes: PorkMapNode[];
  warehouses: PorkWarehouseMarker[];
  opportunities: PorkArbitrageOpportunity[];
};

type ProvinceCoordinateMap = Record<string, [number, number]>;

const provinceCoordinates: ProvinceCoordinateMap = {
  北京: [116.4074, 39.9042],
  天津: [117.2008, 39.0842],
  河北: [114.5149, 38.0428],
  山西: [112.5492, 37.857],
  内蒙古: [111.7652, 40.8175],
  辽宁: [123.4315, 41.8057],
  吉林: [125.3235, 43.8171],
  黑龙江: [126.6424, 45.7567],
  上海: [121.4737, 31.2304],
  江苏: [118.7969, 32.0603],
  浙江: [120.1551, 30.2741],
  安徽: [117.2272, 31.8206],
  福建: [119.2965, 26.0745],
  江西: [115.8582, 28.6829],
  山东: [117.1201, 36.6512],
  河南: [113.6254, 34.7466],
  湖北: [114.3054, 30.5931],
  湖南: [112.9388, 28.2282],
  广东: [113.2644, 23.1291],
  广西: [108.3669, 22.817],
  海南: [110.3486, 20.02],
  重庆: [106.5516, 29.563],
  四川: [104.0665, 30.5728],
  贵州: [106.7074, 26.5982],
  云南: [102.8329, 24.8801],
  西藏: [91.1721, 29.6525],
  陕西: [108.9398, 34.3416],
  甘肃: [103.8343, 36.0611],
  青海: [101.7782, 36.6171],
  宁夏: [106.2309, 38.4872],
  新疆: [87.6177, 43.7928],
};

const warehouseCoordinates: Record<string, [number, number]> = {
  武汉一号冷库: [114.3054, 30.5931],
  上海二号冷库: [121.4737, 31.2304],
  合肥联储中心: [117.2272, 31.8206],
};

function round(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getMetricValue(region: RegionQuote, metric: PorkMapMetric) {
  if (metric === "cornPrice") return region.cornPrice;
  if (metric === "soymealPrice") return region.soymealPrice;
  return region.liveHogPrice;
}

function getScenarioFactor(scenario: PorkMapScenario) {
  if (scenario === "margin") return { spread: 1.18, freight: 0.9, storage: 0.92 };
  if (scenario === "logistics") return { spread: 0.94, freight: 0.72, storage: 1.08 };
  return { spread: 1, freight: 0.82, storage: 1 };
}

function estimateDistancePenalty(source: [number, number], target: [number, number]) {
  const dx = source[0] - target[0];
  const dy = source[1] - target[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return round(distance * 0.16);
}

function toSignal(netArbitrage: number): "观察" | "关注" | "机会" {
  if (netArbitrage >= 1.6) return "机会";
  if (netArbitrage >= 0.8) return "关注";
  return "观察";
}

function toConfidence(netArbitrage: number, spread: number): "低" | "中" | "高" {
  if (netArbitrage >= 1.6 && spread >= 2.3) return "高";
  if (netArbitrage >= 0.8) return "中";
  return "低";
}

export async function buildPorkBusinessMap(
  metric: PorkMapMetric = "hogPrice",
  scenario: PorkMapScenario = "balanced",
): Promise<PorkBusinessMapResult> {
  const snapshot = await buildPorkMarketSnapshot("month", "national", "hogPrice");
  const factors = getScenarioFactor(scenario);
  const nationalAverage = {
    hogPrice: average(snapshot.regionQuotes.map(item => item.liveHogPrice)),
    cornPrice: average(snapshot.regionQuotes.map(item => item.cornPrice)),
    soymealPrice: average(snapshot.regionQuotes.map(item => item.soymealPrice)),
  };

  const nodes = snapshot.regionQuotes
    .filter(item => provinceCoordinates[item.regionName])
    .map(item => {
      const priceSpread = item.liveHogPrice - nationalAverage.hogPrice;
      const feedPressure = ((item.cornPrice - nationalAverage.cornPrice) / Math.max(nationalAverage.cornPrice, 1)) * 100;
      const mealPressure = ((item.soymealPrice - nationalAverage.soymealPrice) / Math.max(nationalAverage.soymealPrice, 1)) * 100;
      const marginIndex = round(priceSpread * 18 - feedPressure * 0.8 - mealPressure * 0.35);
      const supplyPressure = round(Math.max(0, 50 + feedPressure * 0.9 - item.liveHogChange * 2.4));
      const demandHeat = round(Math.max(0, 50 + priceSpread * 8 + item.liveHogChange * 3.1));
      const coldStorageLoad = round(Math.max(22, 48 + priceSpread * 4.8 - item.liveHogChange * 1.6));
      const slaughterCapacity = round(Math.max(20, 56 + demandHeat * 0.22 - supplyPressure * 0.14));
      const arbitrageSignal = toSignal(round((marginIndex / 28) * factors.spread - coldStorageLoad * 0.008));

      return {
        regionCode: item.regionCode,
        regionName: item.regionName,
        coordinates: provinceCoordinates[item.regionName]!,
        liveHogPrice: round(item.liveHogPrice),
        cornPrice: round(item.cornPrice),
        soymealPrice: round(item.soymealPrice),
        liveHogChange: round(item.liveHogChange),
        marginIndex,
        supplyPressure,
        demandHeat,
        coldStorageLoad,
        slaughterCapacity,
        arbitrageSignal,
      } satisfies PorkMapNode;
    });

  const sortedByMetric = [...snapshot.regionQuotes]
    .filter(item => provinceCoordinates[item.regionName])
    .sort((a, b) => getMetricValue(a, metric) - getMetricValue(b, metric));

  const sourceCandidates = sortedByMetric.slice(0, Math.min(5, sortedByMetric.length));
  const targetCandidates = [...sortedByMetric].reverse().slice(0, Math.min(5, sortedByMetric.length));

  const opportunities = sourceCandidates
    .flatMap(source =>
      targetCandidates
        .filter(target => target.regionCode !== source.regionCode)
        .map(target => {
          const spread = round((target.liveHogPrice - source.liveHogPrice) * factors.spread);
          const sourceCoord = provinceCoordinates[source.regionName]!;
          const targetCoord = provinceCoordinates[target.regionName]!;
          const freight = round(estimateDistancePenalty(sourceCoord, targetCoord) * factors.freight);
          const storageHedge = round((nationalAverage.cornPrice - source.cornPrice) / 380 * factors.storage);
          const netArbitrage = round(spread - freight + storageHedge);
          return {
            routeId: `${source.regionCode}-${target.regionCode}`,
            sourceRegionCode: source.regionCode,
            sourceRegionName: source.regionName,
            targetRegionCode: target.regionCode,
            targetRegionName: target.regionName,
            spread,
            estimatedFreight: freight,
            netArbitrage,
            confidence: toConfidence(netArbitrage, spread),
            reason: `${source.regionName} 生猪价格相对偏低，${target.regionName} 销区溢价更高，叠加${scenario === "logistics" ? "物流效率" : scenario === "margin" ? "利润优先" : "平衡调度"}策略后形成跨区调拨窗口。`,
          } satisfies PorkArbitrageOpportunity;
        }),
    )
    .filter(item => item.netArbitrage > 0)
    .sort((a, b) => b.netArbitrage - a.netArbitrage)
    .slice(0, 6);

  const warehouses = inventoryBatches
    .filter(batch => warehouseCoordinates[batch.warehouse])
    .map(batch => ({
      batchCode: batch.batchCode,
      warehouse: batch.warehouse,
      partName: batch.partName,
      coordinates: warehouseCoordinates[batch.warehouse]!,
      weightKg: batch.weightKg,
      unitCost: round(batch.unitCost),
      currentSpotPrice: round(batch.currentSpotPrice),
      futuresMappedPrice: round(batch.futuresMappedPrice),
    } satisfies PorkWarehouseMarker));

  return {
    generatedAt: Date.now(),
    selectedMetric: metric,
    selectedScenario: scenario,
    nationalAverage,
    summary: {
      visibleRegions: nodes.length,
      opportunityCount: opportunities.length,
      highOpportunityCount: opportunities.filter(item => item.confidence === "高").length,
      avgMarginIndex: average(nodes.map(item => item.marginIndex)),
      maxSpread: opportunities[0]?.spread ?? 0,
    },
    nodes,
    warehouses,
    opportunities,
  };
}
