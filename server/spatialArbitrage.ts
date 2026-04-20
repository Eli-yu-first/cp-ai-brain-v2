import { partQuotes } from "./platformData";
import { calculateArbitrage } from "./timeArbitrage";

export type NetworkOptimizationInput = {
  breedingHeadsPerDay?: number;
  slaughterHeadsPerDay?: number;
  cuttingHeadsPerDay?: number;
  freezingTonsPerDay?: number;
  storageTonsCapacity?: number;
  deepProcessingTonsPerDay?: number;
  salesFreshTonsPerDay?: number;
  salesFrozenTonsPerMonth?: number;
  salesProcessedTonsPerDay?: number;
  breedingCostPerHead?: number;
  slaughterCostPerHead?: number;
  cuttingCostPerHead?: number;
  freezingCostPerTon?: number;
  storageCostPerTonMonth?: number;
  deepProcessingCostPerTon?: number;
  salesCostPerTon?: number;
};

export type GeoNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "origin" | "destination";
  basePrice: number;
  capacity?: number;
  demand?: number;
};

const GEO_NODES: GeoNode[] = [
  { id: "node_bj", name: "北京", lat: 39.9042, lng: 116.4074, type: "destination", basePrice: 13.2, demand: 3200 },
  { id: "node_tj", name: "天津", lat: 39.0842, lng: 117.2008, type: "destination", basePrice: 12.8, demand: 1800 },
  { id: "node_he", name: "河北", lat: 38.0428, lng: 114.5149, type: "origin", basePrice: 9.8, capacity: 4800 },
  { id: "node_sx", name: "山西", lat: 37.857, lng: 112.5492, type: "origin", basePrice: 10.1, capacity: 3200 },
  { id: "node_nm", name: "内蒙古", lat: 40.8175, lng: 111.7652, type: "origin", basePrice: 9.2, capacity: 5000 },
  { id: "node_ln", name: "辽宁", lat: 41.8057, lng: 123.4315, type: "origin", basePrice: 9.7, capacity: 4500 },
  { id: "node_jl", name: "吉林", lat: 43.8171, lng: 125.3235, type: "origin", basePrice: 9.6, capacity: 3800 },
  { id: "node_hlj", name: "黑龙江", lat: 45.7567, lng: 126.6424, type: "origin", basePrice: 9.4, capacity: 4000 },
  { id: "node_sh", name: "上海", lat: 31.2304, lng: 121.4737, type: "destination", basePrice: 13.8, demand: 2800 },
  { id: "node_js", name: "江苏", lat: 32.0603, lng: 118.7969, type: "destination", basePrice: 12.6, demand: 2500 },
  { id: "node_zj", name: "浙江", lat: 30.2741, lng: 120.1551, type: "destination", basePrice: 13.5, demand: 2600 },
  { id: "node_ah", name: "安徽", lat: 31.8206, lng: 117.2272, type: "origin", basePrice: 11.2, capacity: 5500 },
  { id: "node_fj", name: "福建", lat: 26.0745, lng: 119.2965, type: "destination", basePrice: 13.1, demand: 1900 },
  { id: "node_jx", name: "江西", lat: 28.6829, lng: 115.8582, type: "origin", basePrice: 10.5, capacity: 4800 },
  { id: "node_sd", name: "山东", lat: 36.6512, lng: 117.1201, type: "origin", basePrice: 10.0, capacity: 8000 },
  { id: "node_ha", name: "河南", lat: 34.7466, lng: 113.6254, type: "origin", basePrice: 9.7, capacity: 9000 },
  { id: "node_hb", name: "湖北", lat: 30.5931, lng: 114.3054, type: "destination", basePrice: 12.1, demand: 1800 },
  { id: "node_hn", name: "湖南", lat: 28.2282, lng: 112.9388, type: "origin", basePrice: 9.5, capacity: 5500 },
  { id: "node_gd", name: "广东", lat: 23.1291, lng: 113.2644, type: "destination", basePrice: 14.1, demand: 3600 },
  { id: "node_gx", name: "广西", lat: 22.817, lng: 108.3669, type: "origin", basePrice: 9.3, capacity: 6000 },
  { id: "node_hi", name: "海南", lat: 20.02, lng: 110.3486, type: "destination", basePrice: 14.5, demand: 900 },
  { id: "node_cq", name: "重庆", lat: 29.563, lng: 106.5516, type: "destination", basePrice: 11.8, demand: 1600 },
  { id: "node_sc", name: "四川", lat: 30.5728, lng: 104.0665, type: "origin", basePrice: 9.2, capacity: 7000 },
  { id: "node_gz", name: "贵州", lat: 26.5982, lng: 106.7074, type: "origin", basePrice: 10.3, capacity: 3000 },
  { id: "node_yn", name: "云南", lat: 24.8801, lng: 102.8329, type: "origin", basePrice: 9.6, capacity: 3500 },
  { id: "node_xz", name: "西藏", lat: 29.6525, lng: 91.1721, type: "destination", basePrice: 15.0, demand: 400 },
  { id: "node_sn", name: "陕西", lat: 34.3416, lng: 108.9398, type: "origin", basePrice: 10.4, capacity: 4000 },
  { id: "node_gs", name: "甘肃", lat: 36.0611, lng: 103.8343, type: "origin", basePrice: 10.6, capacity: 2500 },
  { id: "node_qh", name: "青海", lat: 36.6171, lng: 101.7782, type: "origin", basePrice: 11.0, capacity: 1500 },
  { id: "node_nx", name: "宁夏", lat: 38.4872, lng: 106.2309, type: "origin", basePrice: 10.2, capacity: 1800 },
  { id: "node_xj", name: "新疆", lat: 43.7928, lng: 87.6177, type: "origin", basePrice: 9.5, capacity: 2000 },
];

/**
 * 真实物流调度：车型参数
 *
 * 小型冷链：5 吨 / 1.8 元/km·吨（高单吨成本但批次灵活）
 * 中型冷链：15 吨 / 1.4 元/km·吨（平衡选择）
 * 大型干线：25 吨 / 1.1 元/km·吨（规模化干线最优）
 *
 * 选型规则：按批量自动选择最合适的车型（贪心），
 * 批次余量 < 5 吨退化为小型冷链单票补车。
 */
export type VehicleType = {
  code: "small" | "medium" | "large";
  name: string;
  payloadTon: number;
  costPerKmPerTon: number;
};

export const VEHICLE_TYPES: VehicleType[] = [
  { code: "small", name: "小型冷链(5吨)", payloadTon: 5, costPerKmPerTon: 1.8 },
  { code: "medium", name: "中型冷链(15吨)", payloadTon: 15, costPerKmPerTon: 1.4 },
  { code: "large", name: "大型干线(25吨)", payloadTon: 25, costPerKmPerTon: 1.1 },
];

export type ChainStrategyMode = "balanced" | "fresh_first" | "storage_first" | "deep_processing";
export type TimeStoragePolicy = "auto" | "force" | "off";

export const PORK_CHAIN_FACTORS = {
  farm: {
    stage: "肥猪出栏",
    output: "肥猪",
    timeNode: "T / 24h",
    adjustable: true,
    targetHeadsPerDay: 40000,
    actualHeadsPerDay: 40000,
    optimization: "毛猪调配",
  },
  slaughter: {
    stage: "屠宰",
    output: "白条副产",
    timeNode: "T+1 / 24h",
    targetHeadsPerDay: 40000,
    actualHeadsPerDay: 20000,
    constraint: "非储备部位的鲜销能力，通过鲜销价格解决",
    optimization: "寻找屠宰分割速冻一体产能",
  },
  cutting: {
    stage: "分割",
    output: "皮膘骨肉",
    timeNode: "T+2 / 24h",
    targetHeadsPerDay: 40000,
    actualHeadsPerDay: 8000,
    optimization: "补充分割小刀手",
  },
  freezing: {
    stage: "速冻",
    output: "-28℃产品",
    timeNode: "T+4 / 48h",
    yieldKgPerHead: 78,
    targetKgPerDay: 78 * 40000,
    actualKgPerDay: 400000,
    optimization: "匹配屠宰分割速冻一体节点",
  },
  storage: {
    stage: "仓储",
    output: "-18℃产品",
    timeNode: "长期 / 累计4个月",
    targetReserveTon: (78 * 40000 * 30 * 4) / 10000,
    actualStorageTon: 5000,
    constraint: "储备冻品原料销售能力",
    reverseConstraint: "冻品目标储备量",
    optimization: "就近标准外租库",
  },
  sales: {
    freshConstraint: "非储备部位鲜销能力",
    reserveConstraint: "储备冻品原料未来销售能力",
    deepProcessingConstraint: "深加工品未来销售能力",
  },
} as const;

export type ChainStageFactor = {
  code: keyof typeof PORK_CHAIN_FACTORS;
  stage: string;
  target: number;
  actual: number;
  gap: number;
  unit: string;
  timeNode: string;
  utilization: number;
  constraint?: string;
  optimization?: string;
};

function pickVehicleFor(remainingTon: number, preference: "auto" | VehicleType["code"]): VehicleType {
  if (preference !== "auto") {
    const fixed = VEHICLE_TYPES.find((v) => v.code === preference);
    if (fixed) return fixed;
  }
  // auto 模式：批量越大越倾向大车；尾批次（<5 吨）退化小车
  if (remainingTon >= 22) return VEHICLE_TYPES[2]!; // large
  if (remainingTon >= 10) return VEHICLE_TYPES[1]!; // medium
  return VEHICLE_TYPES[0]!; // small
}

export type ArbitrageRoute = {
  originId: string;
  destId: string;
  originName: string;
  destName: string;
  originPrice: number;
  destPrice: number;
  distanceKm: number;
  /** 按默认车型核算的单位运费（元/kg），仅用于兼容现有 UI 列 */
  transportCost: number;
  /** 纯价差扣除默认车型运费后的单位净利（元/kg） */
  netProfit: number;
  /** 按 batchSizeTon 估算的批次总利润（万元，兼容字段） */
  batchProfit: number;
  decision: string;
  originCoords: [number, number];
  destCoords: [number, number];
};

/** 调度计划单条明细 */
export type SchedulePlanItem = {
  originId: string;
  destId: string;
  originName: string;
  destName: string;
  distanceKm: number;
  /** 实际发运量（吨） */
  shippedTon: number;
  /** 车型 */
  vehicleCode: VehicleType["code"];
  vehicleName: string;
  /** 车次数（整车 + 尾票） */
  trips: number;
  /** 该条线的总运费（元） */
  freightTotal: number;
  /** 该条线单位运费（元/kg） */
  freightPerKg: number;
  /** 该条线单位净利（元/kg） */
  netProfitPerKg: number;
  /** 该条线总净利（万元） */
  netProfitTotal: number;
  breedingHeads: number;
  slaughterHeads: number;
  cuttingHeads: number;
  freezingTons: number;
  storageManagedTons: number;
  freshSalesTon: number;
  storageTon: number;
  deepProcessingTon: number;
  timeArbitrageTriggered: boolean;
  storageOpened: boolean;
  timeProfitPerKg: number;
  bestStorageMonth: number | null;
  arbitrageWindow: { startMonth: number; endMonth: number } | null;
  chainUtilization: {
    dailyInputTon: number;
    hogHeadsPerDay: number;
    breeding: number;
    slaughter: number;
    cutting: number;
    freezing: number;
    storage: number;
    deepProcessing: number;
    sales: number;
  };
  optimizationScore: number;
  /** 车型明细（便于前端展示） */
  tripBreakdown: Array<{ vehicleCode: VehicleType["code"]; vehicleName: string; count: number; tonPerTrip: number }>;
};

export type SpatialArbitrageResult = {
  aiStrategyReport: DetailedStrategyReport;

  routes: ArbitrageRoute[];
  /** 真实调度算法的分配计划 */
  schedulePlan: SchedulePlanItem[];
  /** 调度汇总 */
  scheduleSummary: {
    totalShippedTon: number;
    totalFreight: number;
    totalNetProfit: number; // 万元
    averageFreightPerKg: number;
    averageNetProfitPerKg: number;
    usedCapacityByOrigin: Record<string, number>;
    usedDemandByDest: Record<string, number>;
    vehicleMix: Record<VehicleType["code"], number>;
    freshSalesTon: number;
    storageTon: number;
    deepProcessingTon: number;
    storageOpenedRoutes: number;
    averageChainUtilization: number;
    bottleneckStage: string;
  };
  chainFactors: ChainStageFactor[];
  chainAnalysis: {
    strategyMode: ChainStrategyMode;
    timeStoragePolicy: TimeStoragePolicy;
    planningDays: number;
    storageCapacityTon: number;
    rentedStorageTon: number;
    constraints: string[];
    optimizationLevers: string[];
  };
  totalOpportunities: number;
  bestRouteProfit: number;
  bestRouteName: string;
  top5TotalProfit: number;
  averageSpread: number;
  nodes: GeoNode[];
  aiDecisionOverview: string;
};

// 工具函数：计算两点简易球面距离 (简化公式)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a =
    0.5 - c((lat2 - lat1) * p) / 2 +
    (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export type DetailedStrategyReport = {
  marketAnalysis: string;
  corePathways: string[];
  profitPrediction: string;
  recommendedAction: string;
  estimatedReturn: string;
};

export function generateDetailedStrategyReport(
  routes: ArbitrageRoute[],
  partName: string,
  scheduleSummary?: SpatialArbitrageResult["scheduleSummary"],
): DetailedStrategyReport {
  if (routes.length === 0) {
    return {
      marketAnalysis: "当前全国各地供需相对平衡，或受巨额运费壁垒阻挡，未能发现具有明显操作空间的价格洼地。",
      corePathways: [],
      profitPrediction: "暂无显著盈利空间，盲目跨区可能导致运费亏损。",
      recommendedAction: "保持现有区域内产销平衡，持续监控中原-华南、东北-长三角的核心价差。",
      estimatedReturn: "0 万元",
    };
  }

  const top = routes[0]!;
  const totalProfit =
    scheduleSummary?.totalNetProfit !== undefined
      ? scheduleSummary.totalNetProfit.toFixed(1)
      : routes.slice(0, 5).reduce((sum, r) => sum + r.batchProfit, 0).toFixed(1);

  const shippedStr = scheduleSummary
    ? `按真实调度算法可发运 ${scheduleSummary.totalShippedTon.toFixed(0)} 吨，鲜销 ${scheduleSummary.freshSalesTon.toFixed(0)} 吨、入储 ${scheduleSummary.storageTon.toFixed(0)} 吨、深加工 ${scheduleSummary.deepProcessingTon.toFixed(0)} 吨，平均单吨运费 ${(scheduleSummary.averageFreightPerKg * 1000).toFixed(0)} 元`
    : `按基准车次发运`;

  return {
    marketAnalysis: `针对【${partName}】部位的实时测算显示，${top.originName}及周边产区存在显著的价格低谷（¥${top.originPrice.toFixed(2)}/kg），而${top.destName}等销区终端消费依然旺盛或因供给收缩形成价格高地（¥${top.destPrice.toFixed(2)}/kg）。当前时空维度的极差已突破运费壁垒。`,
    corePathways: routes.slice(0, 3).map(
      (r) => `${r.originName} 调往 ${r.destName}：净利预期 +${r.netProfit.toFixed(2)}元/kg`,
    ),
    profitPrediction: `${shippedStr}，跨区溢价足以覆盖 ${top.distanceKm} 公里的运输磨耗与保险。预计全线净利合计 ${totalProfit} 万元。`,
    recommendedAction: `立即启动【${top.originName}】产区紧急冷链收货，锁定【${top.destName}】大宗批发渠道及餐饮供应链；若时间套利窗口为正，同步开启就近外租库和冻品储备链路，避免屠宰、分割、速冻产能被单一鲜销能力反向制约。`,
    estimatedReturn: `${totalProfit} 万元 (${scheduleSummary ? "调度算法合计" : "前五条路径合计"})`,
  };
}

export type SpatialArbitrageOptions = {
  transportCostPerKmPerTon: number;
  minProfitThreshold: number;
  batchSizeTon: number;
  originFilter: string;
  partCode?: string;
  /** 偏好车型（auto 为自动选型） */
  vehiclePreference?: "auto" | VehicleType["code"];
  /** 目标发运总量（吨）；留空则按产能/需求最小值自动铺满 */
  targetShipmentTon?: number;
  strategyMode?: ChainStrategyMode;
  timeStoragePolicy?: TimeStoragePolicy;
  planningDays?: number;
  holdingCostPerMonth?: number;
  socialBreakevenCost?: number;
  startMonth?: number;
  storageDurationMonths?: number;
  freshSalesTonPerDay?: number;
  reserveSalesTonPerMonth?: number;
  deepProcessingTonPerDay?: number;
  rentedStorageTon?: number;
  optimization?: NetworkOptimizationInput;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function buildChainFactors(rentedStorageTon = 0): ChainStageFactor[] {
  const storageActual = PORK_CHAIN_FACTORS.storage.actualStorageTon + Math.max(0, rentedStorageTon);
  const factors: ChainStageFactor[] = [
    {
      code: "farm",
      stage: PORK_CHAIN_FACTORS.farm.stage,
      target: PORK_CHAIN_FACTORS.farm.targetHeadsPerDay,
      actual: PORK_CHAIN_FACTORS.farm.actualHeadsPerDay,
      gap: PORK_CHAIN_FACTORS.farm.targetHeadsPerDay - PORK_CHAIN_FACTORS.farm.actualHeadsPerDay,
      unit: "头/天",
      timeNode: PORK_CHAIN_FACTORS.farm.timeNode,
      utilization: 100,
      optimization: PORK_CHAIN_FACTORS.farm.optimization,
    },
    {
      code: "slaughter",
      stage: PORK_CHAIN_FACTORS.slaughter.stage,
      target: PORK_CHAIN_FACTORS.slaughter.targetHeadsPerDay,
      actual: PORK_CHAIN_FACTORS.slaughter.actualHeadsPerDay,
      gap: PORK_CHAIN_FACTORS.slaughter.targetHeadsPerDay - PORK_CHAIN_FACTORS.slaughter.actualHeadsPerDay,
      unit: "头/天",
      timeNode: PORK_CHAIN_FACTORS.slaughter.timeNode,
      utilization: round((PORK_CHAIN_FACTORS.slaughter.actualHeadsPerDay / PORK_CHAIN_FACTORS.slaughter.targetHeadsPerDay) * 100),
      constraint: PORK_CHAIN_FACTORS.slaughter.constraint,
      optimization: PORK_CHAIN_FACTORS.slaughter.optimization,
    },
    {
      code: "cutting",
      stage: PORK_CHAIN_FACTORS.cutting.stage,
      target: PORK_CHAIN_FACTORS.cutting.targetHeadsPerDay,
      actual: PORK_CHAIN_FACTORS.cutting.actualHeadsPerDay,
      gap: PORK_CHAIN_FACTORS.cutting.targetHeadsPerDay - PORK_CHAIN_FACTORS.cutting.actualHeadsPerDay,
      unit: "头/天",
      timeNode: PORK_CHAIN_FACTORS.cutting.timeNode,
      utilization: round((PORK_CHAIN_FACTORS.cutting.actualHeadsPerDay / PORK_CHAIN_FACTORS.cutting.targetHeadsPerDay) * 100),
      optimization: PORK_CHAIN_FACTORS.cutting.optimization,
    },
    {
      code: "freezing",
      stage: PORK_CHAIN_FACTORS.freezing.stage,
      target: PORK_CHAIN_FACTORS.freezing.targetKgPerDay / 1000,
      actual: PORK_CHAIN_FACTORS.freezing.actualKgPerDay / 1000,
      gap: (PORK_CHAIN_FACTORS.freezing.targetKgPerDay - PORK_CHAIN_FACTORS.freezing.actualKgPerDay) / 1000,
      unit: "吨/天",
      timeNode: PORK_CHAIN_FACTORS.freezing.timeNode,
      utilization: round((PORK_CHAIN_FACTORS.freezing.actualKgPerDay / PORK_CHAIN_FACTORS.freezing.targetKgPerDay) * 100),
      optimization: PORK_CHAIN_FACTORS.freezing.optimization,
    },
    {
      code: "storage",
      stage: PORK_CHAIN_FACTORS.storage.stage,
      target: PORK_CHAIN_FACTORS.storage.targetReserveTon,
      actual: storageActual,
      gap: PORK_CHAIN_FACTORS.storage.targetReserveTon - storageActual,
      unit: "吨",
      timeNode: PORK_CHAIN_FACTORS.storage.timeNode,
      utilization: round((storageActual / PORK_CHAIN_FACTORS.storage.targetReserveTon) * 100),
      constraint: PORK_CHAIN_FACTORS.storage.constraint,
      optimization: PORK_CHAIN_FACTORS.storage.optimization,
    },
  ];
  return factors;
}

function getModeBias(mode: ChainStrategyMode, lane: "fresh" | "storage" | "deep") {
  if (mode === "fresh_first") return lane === "fresh" ? 1.2 : lane === "storage" ? 0.88 : 0.95;
  if (mode === "storage_first") return lane === "storage" ? 1.25 : lane === "deep" ? 1.05 : 0.9;
  if (mode === "deep_processing") return lane === "deep" ? 1.25 : lane === "storage" ? 1.05 : 0.9;
  return lane === "fresh" ? 1 : lane === "storage" ? 1.04 : 1.02;
}

function allocateProfitLanes({
  ship,
  freshProfitPerKg,
  storageProfitPerKg,
  deepProfitPerKg,
  freshCapLeft,
  storageCapLeft,
  deepCapLeft,
  strategyMode,
  storageAllowed,
}: {
  ship: number;
  freshProfitPerKg: number;
  storageProfitPerKg: number;
  deepProfitPerKg: number;
  freshCapLeft: number;
  storageCapLeft: number;
  deepCapLeft: number;
  strategyMode: ChainStrategyMode;
  storageAllowed: boolean;
}) {
  const lanes = [
    { key: "fresh" as const, cap: freshCapLeft, profit: freshProfitPerKg },
    { key: "storage" as const, cap: storageAllowed ? storageCapLeft : 0, profit: storageProfitPerKg },
    { key: "deep" as const, cap: storageAllowed ? deepCapLeft : 0, profit: deepProfitPerKg },
  ]
    .filter(lane => lane.cap > 0 && lane.profit > 0)
    .sort((a, b) => b.profit * getModeBias(strategyMode, b.key) - a.profit * getModeBias(strategyMode, a.key));

  let left = ship;
  const allocation = { fresh: 0, storage: 0, deep: 0 };
  let weightedProfit = 0;

  for (const lane of lanes) {
    if (left <= 0) break;
    const ton = Math.min(left, lane.cap);
    allocation[lane.key] += ton;
    weightedProfit += ton * 1000 * lane.profit;
    left -= ton;
  }

  return {
    freshSalesTon: round(allocation.fresh),
    storageTon: round(allocation.storage),
    deepProcessingTon: round(allocation.deep),
    allocatedTon: round(ship - left),
    weightedProfit,
  };
}

/**
 * 真实物流调度算法：
 * 1) 枚举所有产地-销地价差候选路线，按单位净利降序。
 * 2) 贪心分配：每条路线按剩余产能、剩余需求、剩余目标发运量选择实际发运量。
 * 3) 根据发运量自动选择车型（或用用户偏好车型），计算车次数与真实运费。
 * 4) 输出调度明细、车型混合、产能/需求占用、总净利。
 */
export function calculateSpatialArbitrage(
  optionsOrTransportCost: SpatialArbitrageOptions | number,
  minProfitThreshold?: number,
  batchSizeTon?: number,
  originFilter?: string,
  partCode: string = "all",
): SpatialArbitrageResult {
  // 向后兼容：支持旧版 (trans, min, batch, origin, part) 入参
  const options: SpatialArbitrageOptions =
    typeof optionsOrTransportCost === "number"
      ? {
          transportCostPerKmPerTon: optionsOrTransportCost,
          minProfitThreshold: minProfitThreshold ?? 0,
          batchSizeTon: batchSizeTon ?? 500,
          originFilter: originFilter ?? "all",
          partCode,
          vehiclePreference: "auto",
          strategyMode: "balanced",
          timeStoragePolicy: "auto",
        }
      : optionsOrTransportCost;

  const {
    transportCostPerKmPerTon,
    minProfitThreshold: minProfit = 0,
    batchSizeTon: batchSize = 500,
    originFilter: originFilterVal = "all",
    partCode: partCodeVal = "all",
    vehiclePreference = "auto",
    targetShipmentTon,
    strategyMode = "balanced",
    timeStoragePolicy = "auto",
    planningDays = 7,
    holdingCostPerMonth = 0.2,
    socialBreakevenCost = 12,
    startMonth = 4,
    storageDurationMonths = 6,
    freshSalesTonPerDay = 900,
    reserveSalesTonPerMonth = 5000,
    deepProcessingTonPerDay = 260,
    rentedStorageTon = 0,
    optimization,
  } = options;

  // 获取部位溢价系数
  const part = partQuotes.find((p) => p.code === partCodeVal);
  const premiumRatio = part ? part.spotPrice / 23.4 : 1;
  const partName = part ? part.name : "生猪/白条通货";

  const origins = GEO_NODES.filter(
    (n) =>
      n.type === "origin" &&
      (originFilterVal === "all" || n.id === originFilterVal || n.name.includes(originFilterVal)),
  );
  const destinations = GEO_NODES.filter((n) => n.type === "destination");

  // 第一步：枚举候选路线（按单公斤净利排序，基于用户 transportCostPerKmPerTon 基准 + 默认中型车修正）
  const routes: ArbitrageRoute[] = [];
  for (const origin of origins) {
    for (const dest of destinations) {
      const distance = Math.round(getDistance(origin.lat, origin.lng, dest.lat, dest.lng) * 1.3);
      const transportCost = parseFloat((distance * transportCostPerKmPerTon / 1000).toFixed(2));
      const oPrice = parseFloat((origin.basePrice * premiumRatio).toFixed(2));
      const dPrice = parseFloat((dest.basePrice * premiumRatio).toFixed(2));
      const netProfit = parseFloat((dPrice - oPrice - transportCost).toFixed(2));
      if (netProfit >= minProfit) {
        const batchProfit = parseFloat(((netProfit * 1000 * batchSize) / 10000).toFixed(1));
        let decisionText = "观望";
        if (netProfit > 2.5) decisionText = "强烈推荐";
        else if (netProfit > 1.5) decisionText = "建议开通";
        else decisionText = "备选池";
        routes.push({
          originId: origin.id,
          destId: dest.id,
          originName: origin.name,
          destName: dest.name,
          originPrice: oPrice,
          destPrice: dPrice,
          distanceKm: distance,
          transportCost,
          netProfit,
          batchProfit,
          decision: decisionText,
          originCoords: [origin.lng, origin.lat],
          destCoords: [dest.lng, dest.lat],
        });
      }
    }
  }
  routes.sort((a, b) => b.netProfit - a.netProfit);

  // 第二步：贪心调度（产能/需求/目标量约束 + 车型自动选择）
  const remainingCapacity: Record<string, number> = {};
  const remainingDemand: Record<string, number> = {};
  for (const o of origins) remainingCapacity[o.id] = o.capacity ?? 0;
  for (const d of destinations) remainingDemand[d.id] = d.demand ?? Number.POSITIVE_INFINITY;

  // 总目标量：用户指定则用；否则取产地总产能与销地总需求的最小值
  const totalCapacity = origins.reduce((s, o) => s + (o.capacity ?? 0), 0);
  const totalDemand = destinations.reduce((s, d) => s + (d.demand ?? 0), 0);
  let remainingTarget =
    typeof targetShipmentTon === "number" && targetShipmentTon > 0
      ? targetShipmentTon
      : Math.min(totalCapacity, totalDemand);
  const effectivePlanningDays = Math.max(1, Math.min(30, Math.round(planningDays)));
  const chainFactors = buildChainFactors(rentedStorageTon);
  const breedingHeadsPerDay = optimization?.breedingHeadsPerDay ?? PORK_CHAIN_FACTORS.farm.actualHeadsPerDay;
  const slaughterHeadsPerDay = optimization?.slaughterHeadsPerDay ?? PORK_CHAIN_FACTORS.slaughter.actualHeadsPerDay;
  const cuttingHeadsPerDay = optimization?.cuttingHeadsPerDay ?? PORK_CHAIN_FACTORS.cutting.actualHeadsPerDay;
  const freezingTonsPerDay = optimization?.freezingTonsPerDay ?? PORK_CHAIN_FACTORS.freezing.actualKgPerDay / 1000;
  const storageCapacityTon = optimization?.storageTonsCapacity ?? PORK_CHAIN_FACTORS.storage.actualStorageTon + rentedStorageTon;
  const deepProcessingTonsCapacity = optimization?.deepProcessingTonsPerDay ?? deepProcessingTonPerDay;
  const freshSalesTonsCapacity = optimization?.salesFreshTonsPerDay ?? freshSalesTonPerDay;
  const processedSalesTonsCapacity = optimization?.salesProcessedTonsPerDay ?? deepProcessingTonPerDay;
  let remainingFreshSales = Math.max(0, freshSalesTonsCapacity) * effectivePlanningDays;
  let remainingStorage = Math.max(0, storageCapacityTon);
  let remainingDeepProcessing = Math.max(0, deepProcessingTonsCapacity) * effectivePlanningDays;
  const remainingReserveSales = Math.max(0, optimization?.salesFrozenTonsPerMonth ?? reserveSalesTonPerMonth) * Math.max(1, Math.round(storageDurationMonths));
  remainingStorage = Math.min(remainingStorage, remainingReserveSales);

  const schedulePlan: SchedulePlanItem[] = [];
  const vehicleMix: Record<VehicleType["code"], number> = { small: 0, medium: 0, large: 0 };

  for (const r of routes) {
    if (remainingTarget <= 0) break;
    const capLeft = remainingCapacity[r.originId] ?? 0;
    const demLeft = remainingDemand[r.destId] ?? 0;
    const ship = Math.min(capLeft, demLeft, remainingTarget);
    if (ship <= 0) continue;

    // 车型拆分：余量每次按 pickVehicleFor 递归拆分
    let left = ship;
    let trips = 0;
    let freightTotal = 0;
    const tripBreakdownMap: Record<string, { vehicleCode: VehicleType["code"]; vehicleName: string; count: number; tonPerTrip: number }> = {};
    while (left > 0.001) {
      const v = pickVehicleFor(left, vehiclePreference);
      const tripLoad = Math.min(left, v.payloadTon);
      // 一次车次运费 = 距离 * costPerKmPerTon * tripLoad（吨）
      freightTotal += r.distanceKm * v.costPerKmPerTon * tripLoad;
      trips += 1;
      vehicleMix[v.code] += 1;
      const key = `${v.code}-${tripLoad.toFixed(2)}`;
      if (!tripBreakdownMap[key]) {
        tripBreakdownMap[key] = { vehicleCode: v.code, vehicleName: v.name, count: 0, tonPerTrip: tripLoad };
      }
      tripBreakdownMap[key]!.count += 1;
      left -= tripLoad;
      // 固定车型时也要防止死循环（tripLoad 下限 0.01）
      if (tripLoad < 0.01) break;
    }

    const freightPerKg = parseFloat((freightTotal / (ship * 1000)).toFixed(3));
    const spreadPerKg = r.destPrice - r.originPrice;
    const freshProfitPerKg = parseFloat((spreadPerKg - freightPerKg).toFixed(2));
    const timeArbitrage = calculateArbitrage(
      r.originPrice,
      holdingCostPerMonth,
      socialBreakevenCost,
      ship,
      startMonth,
      storageDurationMonths,
      {
        breedingHeadsPerDay,
        slaughterHeadsPerDay,
        cuttingHeadsPerDay,
        freezingTonsPerDay,
        storageTonsCapacity: storageCapacityTon,
        deepProcessingTonsPerDay: deepProcessingTonsCapacity,
        salesTonsPerDay: freshSalesTonsCapacity,
      },
    );
    const timeArbitrageTriggered =
      timeStoragePolicy === "force" ||
      (timeStoragePolicy === "auto" && timeArbitrage.profits.some(item => item.shouldArbitrage) && timeArbitrage.maxProfit > 0);
    const storageHandlingCostPerKg = 0.18 + freightPerKg * 0.55;
    const storageProfitPerKg = parseFloat((timeArbitrage.maxProfit - storageHandlingCostPerKg).toFixed(2));
    const deepProfitPerKg = parseFloat((storageProfitPerKg + 0.42).toFixed(2));
    const storageAllowed = timeStoragePolicy !== "off" && timeArbitrageTriggered;
    const laneAllocation = allocateProfitLanes({
      ship,
      freshProfitPerKg,
      storageProfitPerKg,
      deepProfitPerKg,
      freshCapLeft: remainingFreshSales,
      storageCapLeft: remainingStorage,
      deepCapLeft: remainingDeepProcessing,
      strategyMode,
      storageAllowed,
    });
    const netProfitPerKg =
      laneAllocation.allocatedTon > 0
        ? parseFloat((laneAllocation.weightedProfit / (laneAllocation.allocatedTon * 1000)).toFixed(2))
        : freshProfitPerKg;
    const netProfitTotal = parseFloat((laneAllocation.weightedProfit / 10000).toFixed(1));

    // 仅在调度后仍为正净利才记入计划（避免小车拉高尾批次运费导致亏损）
    if (netProfitPerKg > 0 && laneAllocation.allocatedTon > 0) {
      const shippedTon = laneAllocation.allocatedTon;
      remainingCapacity[r.originId] = (remainingCapacity[r.originId] ?? 0) - shippedTon;
      remainingDemand[r.destId] = (remainingDemand[r.destId] ?? 0) - shippedTon;
      remainingTarget -= shippedTon;
      remainingFreshSales -= laneAllocation.freshSalesTon;
      remainingStorage -= laneAllocation.storageTon;
      remainingDeepProcessing -= laneAllocation.deepProcessingTon;
      const dailyInputTon = shippedTon / effectivePlanningDays;
      const hogHeadsPerDay = (dailyInputTon * 1000) / PORK_CHAIN_FACTORS.freezing.yieldKgPerHead;
      const breedingHeads = round((laneAllocation.allocatedTon * 1000) / PORK_CHAIN_FACTORS.freezing.yieldKgPerHead);
      const slaughterHeads = breedingHeads;
      const cuttingHeads = Math.min(breedingHeads, cuttingHeadsPerDay * effectivePlanningDays);
      const freezingTons = round(Math.min(laneAllocation.allocatedTon, freezingTonsPerDay * effectivePlanningDays));
      const storageUsed = laneAllocation.storageTon + laneAllocation.deepProcessingTon;
      const optimizationScore = round(
        netProfitPerKg * 14 +
        timeArbitrage.optimizationPlan.summary.serviceLevel * 0.15 -
        Math.max(0, timeArbitrage.optimizationPlan.summary.averageUtilization - 88) * 0.18,
      );
      schedulePlan.push({
        originId: r.originId,
        destId: r.destId,
        originName: r.originName,
        destName: r.destName,
        distanceKm: r.distanceKm,
        shippedTon: parseFloat(shippedTon.toFixed(2)),
        vehicleCode: vehiclePreference === "auto" ? (shippedTon >= 22 ? "large" : shippedTon >= 10 ? "medium" : "small") : vehiclePreference,
        vehicleName:
          vehiclePreference === "auto"
            ? shippedTon >= 22
              ? VEHICLE_TYPES[2]!.name
              : shippedTon >= 10
                ? VEHICLE_TYPES[1]!.name
                : VEHICLE_TYPES[0]!.name
            : (VEHICLE_TYPES.find((v) => v.code === vehiclePreference)?.name ?? "自动"),
        trips,
        freightTotal: parseFloat(freightTotal.toFixed(0)),
        freightPerKg,
        netProfitPerKg,
        netProfitTotal,
        breedingHeads,
        slaughterHeads,
        cuttingHeads,
        freezingTons,
        storageManagedTons: storageUsed,
        freshSalesTon: laneAllocation.freshSalesTon,
        storageTon: laneAllocation.storageTon,
        deepProcessingTon: laneAllocation.deepProcessingTon,
        timeArbitrageTriggered,
        storageOpened: storageAllowed && (laneAllocation.storageTon > 0 || laneAllocation.deepProcessingTon > 0),
        timeProfitPerKg: timeArbitrage.maxProfit,
        bestStorageMonth: timeArbitrage.maxProfit > 0 ? timeArbitrage.maxProfitMonth : null,
        arbitrageWindow: timeArbitrage.arbitrageWindow,
        chainUtilization: {
          dailyInputTon: round(dailyInputTon),
          hogHeadsPerDay: round(hogHeadsPerDay),
          breeding: round((hogHeadsPerDay / breedingHeadsPerDay) * 100),
          slaughter: round((hogHeadsPerDay / slaughterHeadsPerDay) * 100),
          cutting: round((hogHeadsPerDay / cuttingHeadsPerDay) * 100),
          freezing: round((dailyInputTon / freezingTonsPerDay) * 100),
          storage: round((storageUsed / Math.max(1, storageCapacityTon)) * 100),
          deepProcessing: round((laneAllocation.deepProcessingTon / Math.max(1, deepProcessingTonsCapacity * effectivePlanningDays)) * 100),
          sales: round((laneAllocation.freshSalesTon / Math.max(1, freshSalesTonsCapacity * effectivePlanningDays)) * 100),
        },
        optimizationScore,
        tripBreakdown: Object.values(tripBreakdownMap),
      });
    } else {
      // 回滚车次计数
      for (const tb of Object.values(tripBreakdownMap)) {
        vehicleMix[tb.vehicleCode] -= tb.count;
      }
    }
  }

  // 汇总
  const totalShippedTon = schedulePlan.reduce((s, p) => s + p.shippedTon, 0);
  const totalFreight = schedulePlan.reduce((s, p) => s + p.freightTotal, 0);
  const totalNetProfit = parseFloat(schedulePlan.reduce((s, p) => s + p.netProfitTotal, 0).toFixed(1));
  const freshSalesTon = parseFloat(schedulePlan.reduce((s, p) => s + p.freshSalesTon, 0).toFixed(1));
  const storageTon = parseFloat(schedulePlan.reduce((s, p) => s + p.storageTon, 0).toFixed(1));
  const deepProcessingTon = parseFloat(schedulePlan.reduce((s, p) => s + p.deepProcessingTon, 0).toFixed(1));
  const storageOpenedRoutes = schedulePlan.filter(p => p.storageOpened).length;
  const averageChainUtilization =
    schedulePlan.length > 0
      ? parseFloat(
          (
            schedulePlan.reduce(
              (sum, p) =>
                sum +
                Math.max(
                  p.chainUtilization.breeding,
                  p.chainUtilization.slaughter,
                  p.chainUtilization.cutting,
                  p.chainUtilization.freezing,
                  p.chainUtilization.storage,
                  p.chainUtilization.deepProcessing,
                  p.chainUtilization.sales,
                ),
              0,
            ) / schedulePlan.length
          ).toFixed(1),
        )
      : 0;
  const bottleneckStage =
    [...chainFactors].sort((a, b) => b.gap - a.gap)[0]?.stage ?? "无";
  const averageFreightPerKg =
    totalShippedTon > 0 ? parseFloat((totalFreight / (totalShippedTon * 1000)).toFixed(3)) : 0;
  const averageNetProfitPerKg =
    totalShippedTon > 0
      ? parseFloat(((totalNetProfit * 10000) / (totalShippedTon * 1000)).toFixed(2))
      : 0;

  const usedCapacityByOrigin: Record<string, number> = {};
  const usedDemandByDest: Record<string, number> = {};
  for (const o of origins) {
    const used = (o.capacity ?? 0) - (remainingCapacity[o.id] ?? 0);
    if (used > 0) usedCapacityByOrigin[o.name] = parseFloat(used.toFixed(1));
  }
  for (const d of destinations) {
    const used = (d.demand ?? 0) - (remainingDemand[d.id] ?? 0);
    if (used > 0) usedDemandByDest[d.name] = parseFloat(used.toFixed(1));
  }

  const scheduleSummary = {
    totalShippedTon: parseFloat(totalShippedTon.toFixed(1)),
    totalFreight: parseFloat(totalFreight.toFixed(0)),
    totalNetProfit,
    averageFreightPerKg,
    averageNetProfitPerKg,
    usedCapacityByOrigin,
    usedDemandByDest,
    vehicleMix,
    freshSalesTon,
    storageTon,
    deepProcessingTon,
    storageOpenedRoutes,
    averageChainUtilization,
    bottleneckStage,
  };

  // 顶层汇总（兼容现有前端字段）
  let bestRouteProfit = 0;
  let bestRouteName = "-";
  let top5TotalProfit = 0;
  let avSpread = 0;

  if (routes.length > 0) {
    bestRouteProfit = routes[0]!.netProfit;
    bestRouteName = `${routes[0]!.originName}→${routes[0]!.destName}`;
    const top5 = routes.slice(0, 5);
    top5TotalProfit = parseFloat(top5.reduce((sum, r) => sum + r.batchProfit, 0).toFixed(1));
    const allSpread = routes.reduce((sum, r) => sum + (r.destPrice - r.originPrice), 0);
    avSpread = parseFloat((allSpread / routes.length).toFixed(2));
  }

  const topStr = routes
    .slice(0, 3)
    .map((r) => `${r.originName}→${r.destName}(+${r.netProfit.toFixed(2)}元/kg)`)
    .join("，");

  const decisionOverview =
    schedulePlan.length > 0
      ? `AI决策：基于产能/需求/车型约束，生成 ${schedulePlan.length} 条可执行调度（合计 ${scheduleSummary.totalShippedTon} 吨 / 预期净利 ${scheduleSummary.totalNetProfit} 万元）。时间套利触发 ${scheduleSummary.storageOpenedRoutes} 条储备链路，鲜销 ${scheduleSummary.freshSalesTon} 吨、入储 ${scheduleSummary.storageTon} 吨、深加工 ${scheduleSummary.deepProcessingTon} 吨，优先路由：${topStr}`
      : routes.length > 0
        ? `AI决策：发现 ${routes.length} 条套利窗口，但产能/需求已耗尽或单位运费超阈值，建议放宽车型或分批执行。`
        : "AI决策：目前市场供需与运费不匹配，无最优套利路线。";

  return {
    routes,
    schedulePlan,
    scheduleSummary,
    chainFactors,
    chainAnalysis: {
      strategyMode,
      timeStoragePolicy,
      planningDays: effectivePlanningDays,
      storageCapacityTon: PORK_CHAIN_FACTORS.storage.actualStorageTon + Math.max(0, rentedStorageTon),
      rentedStorageTon: Math.max(0, rentedStorageTon),
      constraints: [
        PORK_CHAIN_FACTORS.slaughter.constraint,
        PORK_CHAIN_FACTORS.storage.constraint,
        PORK_CHAIN_FACTORS.sales.freshConstraint,
        PORK_CHAIN_FACTORS.sales.reserveConstraint,
        PORK_CHAIN_FACTORS.sales.deepProcessingConstraint,
      ],
      optimizationLevers: [
        PORK_CHAIN_FACTORS.farm.optimization,
        PORK_CHAIN_FACTORS.slaughter.optimization,
        PORK_CHAIN_FACTORS.cutting.optimization,
        PORK_CHAIN_FACTORS.storage.optimization,
      ],
    },
    aiStrategyReport: generateDetailedStrategyReport(routes, partName, scheduleSummary),
    totalOpportunities: routes.length,
    bestRouteProfit,
    bestRouteName,
    top5TotalProfit,
    averageSpread: avSpread,
    nodes: GEO_NODES,
    aiDecisionOverview: decisionOverview,
  };
}

export type RoleTasks = {
  purchasing: string[];
  logistics: string[];
  sales: string[];
  risk: string[];
};

export function generateRoleTasksDraft(routes: ArbitrageRoute[]): RoleTasks {
  if (routes.length === 0) {
    return {
      purchasing: ["暂缓跨区大规模采购计划", "保持与核心供应商的基础联系", "继续挖掘可能的低价货源地"],
      logistics: ["维持现有的常规网络调拨", "定期更新各个专线的最新物流标价"],
      sales: ["以消化本地既有区位库存为主", "收集目的地的溢价市场情报并上报"],
      risk: ["继续跟踪各地猪价价差表征时间序列", "暂不签发大规模调拨资金申请"],
    };
  }

  const best = routes[0]!;
  const orgNames = Array.from(new Set(routes.slice(0, 3).map((r) => r.originName))).join("、");
  const destNames = Array.from(new Set(routes.slice(0, 3).map((r) => r.destName))).join("、");

  return {
    purchasing: [
      `立即赴 ${orgNames} 产地锁量，本期主攻目标`,
      `与养殖场签订框架协议，尝试锁定于基准现货价`,
      `优先收购 ${best.originName} 货源，由于价差最大化`,
    ],
    logistics: [
      `申请开通 ${best.originName}→${best.destName} 干线，距离约 ${best.distanceKm}km`,
      `按车型组合协调车辆（大型干线优先、末端小车补尾批），争取 48 小时内完成首批发运`,
      `实时追踪运输成本波动，如超出理论运费发生偏离及时干预`,
    ],
    sales: [
      `锁定 ${destNames} 等周边高价渠道并与大客户对接`,
      `首批目标售价区间应卡紧 ${best.destPrice - 0.2} 左右尽快出清`,
      `对接商超和餐饮网点大客户源，保障到库后的极速分销运转`,
    ],
    risk: [
      `必须严防目的地市场异动，波动超过当前测算阈值建议触发回写熔断`,
      `注意运费成本是否存在隐性抬高并对净利进行摊薄预警`,
      `记录实际发生的结算利润 vs 系统预测偏差`,
    ],
  };
}
