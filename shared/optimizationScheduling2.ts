export type Province = string;
export type PartCode = string;
export type CustomerType = string;
export type FactoryId = string;
export type FarmId = string;
export type WarehouseId = string;

export type SlaughterScheduleRow = {
  farmId: FarmId;
  province: Province;
  month: number;
  count: number;
  avgWeightKg: number;
  livePigPrice: number;
  websitePrice?: number;   // 网站价格-用于计算决策
  futuresPrice?: number;   // 未来期货价格-元/kg
};

export type YieldRateRow = {
  parentMaterial: string;
  childMaterial: string;
  yieldRate: number;
  process: number;
  slaughterCostPerHead?: number;  // 屠宰/分割/冷冻成本-元/头或元/kg
  isReserve?: boolean;            // 是否储备（Y/N）
};

export type SlaughterCapacityRow = {
  factoryId: FactoryId;
  province: Province;
  month: number;
  maxSlaughter: number;
};

export type SplitCapacityRow = {
  factoryId: FactoryId;
  part: PartCode;
  maxSplitKg: number;
  maxFreezeKg: number;
  maxStorageKg: number;
  storageCostRate: number;
  month: number;
};

export type WarehouseRow = {
  warehouseId: WarehouseId;
  factoryId?: FactoryId;          // 关联的工厂ID
  province: Province;
  maxStorageKg: number;
  storageCostRate: number;
  month: number;
  part?: PartCode;                // 部位维度的库容
  currentInventoryKg?: number;    // 当期库存-kg
};

// 分割成本表（新增）
export type SplitCostRow = {
  factoryId: FactoryId;
  part: PartCode;
  splitCostPerKg: number;         // 分割费用-元/kg
  freezePackCostPerKg: number;    // 速冻包装费用-元/kg
};

export type PigOrderRow = {
  factoryId: FactoryId;
  month: number;
  orderQty: number;
  livePigPrice: number;
  destinationProvince: Province;
};

export type PartOrderRow = {
  factoryId: FactoryId;
  part: PartCode;
  month: number;
  customerType: CustomerType;
  orderQty: number;
  salesPrice: number;
  destinationProvince: Province;
};

export type DeepProcessDemandRow = {
  factoryId: FactoryId;
  part: PartCode;
  month: number;
  factoryType: string;
  rawMaterialDemand: number;
  salesPrice: number;
  destinationProvince: Province;
};

export type TransportCostRow = {
  originProvince: Province;
  destinationProvince: Province;
  costPerKmPerKg: number;
  distanceKm: number;
};

export type ProfitRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  inventoryKg: number;
  salesKg: number;
  price: number;
  revenue: number;
  salesProvince: Province;
  pigCost: number;
  storageCost: number;
  transportCost: number;
  profit: number;
};

export type PigSalesRow = {
  factoryId: FactoryId;
  month: number;
  salesQty: number;
  province: Province;
};

export type SalesRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  customerType: CustomerType;
  orderQty: number;
  salesPrice: number;
  province: Province;
};

export type SplittingRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  splitKg: number;
  freezeKg: number;
};

// 输出-生产表（新增）
export type ProductionRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  productionKg: number;           // 产量
  salesKg: number;                // 销量
  inventoryKg: number;            // 存量
};

// 输出-库存表（新增）
export type InventoryRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  inventoryKg: number;            // 库存-kg
};

// 输出-运输表（新增）
export type TransportRow = {
  factoryId: FactoryId;
  month: number;
  part: PartCode;
  destProvince: Province;
  transportKg: number;            // 运输量
};

export type OptimizationInput = {
  slaughterSchedule: SlaughterScheduleRow[];
  yieldRates: YieldRateRow[];
  slaughterCapacity: SlaughterCapacityRow[];
  splitCapacity: SplitCapacityRow[];
  splitCosts: SplitCostRow[];             // 新增：分割成本表
  warehouses: WarehouseRow[];
  pigOrders: PigOrderRow[];
  partOrders: PartOrderRow[];
  deepProcessDemand: DeepProcessDemandRow[];
  transportCosts: TransportCostRow[];
};

export type OptimizationSummary = {
  totalRevenue: number;
  totalPigCost: number;
  totalStorageCost: number;
  totalTransportCost: number;
  totalProfit: number;
  profitMargin: number;
  totalSlaughterCount: number;
  totalSalesKg: number;
  totalFreezeKg: number;
  avgProfitPerPig: number;
  capacityUtilization: number;
};

export type OptimizationOutput = {
  profitTable: ProfitRow[];
  pigSalesTable: PigSalesRow[];
  salesTable: SalesRow[];
  splittingTable: SplittingRow[];
  productionTable: ProductionRow[];       // 新增：生产表
  inventoryTable: InventoryRow[];         // 新增：库存表
  transportTable: TransportRow[];         // 新增：运输表
  summary: OptimizationSummary;
};

export type OptimizationScheduling2TuningInput = {
  slaughterCountMultiplier?: number;
  avgWeightAdjustmentKg?: number;
  livePigPriceAdjustment?: number;
  slaughterCapacityMultiplier?: number;
  splitCapacityMultiplier?: number;
  freezeCapacityMultiplier?: number;
  storageCostMultiplier?: number;
  transportCostMultiplier?: number;
  partPriceAdjustments?: Partial<Record<PartCode, number>>;
};

export type OptimizationScheduling2SensitivityResult = {
  totalProfitDelta: number;
  profitMarginDelta: number;
  capacityUtilizationDelta: number;
  bottleneckDelta: number;
};

export type OptimizationScheduling2AppliedParameter = {
  key: string;
  label: string;
  previousValue: number;
  nextValue: number;
  unit?: string;
};

export type OptimizationScheduling2ChatSuggestion = {
  structuredPrompt: string;
  reasoningSummary: string;
  decisionFocus: string[];
  recommendedActions: string[];
  parameterSuggestions: OptimizationScheduling2TuningInput;
  appliedParameters: OptimizationScheduling2AppliedParameter[];
};

export type OptimizationScheduling2ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIOptimizationDecision = {
  overview: string;
  keyFindings: string[];
  bottlenecks: string[];
  recommendations: string[];
  roleActions: {
    purchasing: string[];
    production: string[];
    sales: string[];
    warehouse: string[];
  };
  riskWarnings: string[];
  profitOptimization: string[];
};

const PROVINCES = ["四川", "河南", "山东", "湖南", "广东", "江苏"] as const;

const FARMS: FarmId[] = ["farm-sc", "farm-hn", "farm-sd", "farm-hu", "farm-gd"];
const FACTORIES: FactoryId[] = ["factory-cd", "factory-zz", "factory-jn"];
const WAREHOUSES: WarehouseId[] = ["wh-cd", "wh-zz", "wh-jn"];

const PART_CODES: PartCode[] = [
  "白条", "五花肉", "前腿肉", "后腿肉", "排骨", "里脊",
  "肘子", "猪蹄", "猪头", "内脏", "板油", "肥膘",
];

const CUSTOMER_TYPES: CustomerType[] = [
  "批发市场", "商超零售", "OEM深加工", "自有深加工", "餐饮连锁",
];

const LIVE_PIG_PRICES: Record<number, number> = {
  1: 14.2, 2: 13.8, 3: 13.5, 4: 14.0, 5: 14.8, 6: 15.5,
  7: 16.2, 8: 16.8, 9: 16.0, 10: 15.2, 11: 14.6, 12: 14.9,
};

// 网站参考价格（用于判断当前市场趋势）
const WEBSITE_PRICES: Record<number, number> = {
  1: 14.5, 2: 14.0, 3: 13.8, 4: 14.3, 5: 15.0, 6: 15.8,
  7: 16.5, 8: 17.0, 9: 16.3, 10: 15.5, 11: 14.8, 12: 15.2,
};

// 未来期货价格（用于冷冻套利决策）
const FUTURES_PRICES: Record<number, number> = {
  1: 15.0, 2: 14.5, 3: 14.2, 4: 14.8, 5: 15.5, 6: 16.2,
  7: 17.0, 8: 17.5, 9: 16.8, 10: 16.0, 11: 15.3, 12: 15.8,
};

const PART_PRICES: Record<PartCode, Record<CustomerType, number>> = {
  "白条": { "批发市场": 20.5, "商超零售": 23.0, "OEM深加工": 19.5, "自有深加工": 19.0, "餐饮连锁": 21.5 },
  "五花肉": { "批发市场": 28.0, "商超零售": 33.5, "OEM深加工": 26.5, "自有深加工": 25.0, "餐饮连锁": 30.0 },
  "前腿肉": { "批发市场": 21.0, "商超零售": 24.5, "OEM深加工": 20.0, "自有深加工": 19.5, "餐饮连锁": 22.5 },
  "后腿肉": { "批发市场": 23.5, "商超零售": 27.0, "OEM深加工": 22.5, "自有深加工": 21.0, "餐饮连锁": 25.0 },
  "排骨": { "批发市场": 32.0, "商超零售": 38.0, "OEM深加工": 30.0, "自有深加工": 28.5, "餐饮连锁": 35.0 },
  "里脊": { "批发市场": 34.0, "商超零售": 40.0, "OEM深加工": 32.0, "自有深加工": 30.0, "餐饮连锁": 37.0 },
  "肘子": { "批发市场": 20.0, "商超零售": 23.5, "OEM深加工": 19.0, "自有深加工": 18.5, "餐饮连锁": 21.5 },
  "猪蹄": { "批发市场": 18.0, "商超零售": 21.0, "OEM深加工": 17.0, "自有深加工": 16.5, "餐饮连锁": 19.5 },
  "猪头": { "批发市场": 10.5, "商超零售": 12.0, "OEM深加工": 9.5, "自有深加工": 9.0, "餐饮连锁": 11.0 },
  "内脏": { "批发市场": 9.0, "商超零售": 11.0, "OEM深加工": 8.0, "自有深加工": 7.5, "餐饮连锁": 10.0 },
  "板油": { "批发市场": 13.0, "商超零售": 15.5, "OEM深加工": 12.0, "自有深加工": 11.5, "餐饮连锁": 14.0 },
  "肥膘": { "批发市场": 8.5, "商超零售": 10.0, "OEM深加工": 7.5, "自有深加工": 7.0, "餐饮连锁": 9.0 },
};

function generateSlaughterSchedule(): SlaughterScheduleRow[] {
  const farmConfigs: Array<{ id: FarmId; province: Province; baseCount: number; avgWeight: number }> = [
    { id: "farm-sc", province: "四川", baseCount: 5200, avgWeight: 112 },
    { id: "farm-hn", province: "河南", baseCount: 8500, avgWeight: 108 },
    { id: "farm-sd", province: "山东", baseCount: 6800, avgWeight: 110 },
    { id: "farm-hu", province: "湖南", baseCount: 4500, avgWeight: 106 },
    { id: "farm-gd", province: "广东", baseCount: 3200, avgWeight: 104 },
  ];
  const rows: SlaughterScheduleRow[] = [];
  for (const farm of farmConfigs) {
    for (let month = 1; month <= 12; month++) {
      const seasonalFactor = 1 + 0.08 * Math.sin((month - 3) * Math.PI / 6);
      const count = Math.round(farm.baseCount * seasonalFactor);
      rows.push({
        farmId: farm.id,
        province: farm.province,
        month,
        count,
        avgWeightKg: farm.avgWeight + Math.round((Math.random() - 0.5) * 4),
        livePigPrice: LIVE_PIG_PRICES[month]! + (Math.random() - 0.5) * 0.6,
        websitePrice: WEBSITE_PRICES[month]! + (Math.random() - 0.5) * 0.4,
        futuresPrice: FUTURES_PRICES[month]! + (Math.random() - 0.5) * 0.5,
      });
    }
  }
  return rows;
}

function generateYieldRates(): YieldRateRow[] {
  return [
    { parentMaterial: "毛猪", childMaterial: "白条", yieldRate: 0.75, process: 1, slaughterCostPerHead: 40, isReserve: false },
    { parentMaterial: "毛猪", childMaterial: "内脏", yieldRate: 0.05, process: 1, slaughterCostPerHead: 40, isReserve: false },
    { parentMaterial: "毛猪", childMaterial: "猪头", yieldRate: 0.05, process: 1, slaughterCostPerHead: 40, isReserve: true },
    { parentMaterial: "毛猪", childMaterial: "猪蹄", yieldRate: 0.02, process: 1, slaughterCostPerHead: 40, isReserve: false },
    { parentMaterial: "毛猪", childMaterial: "板油", yieldRate: 0.03, process: 1, slaughterCostPerHead: 40, isReserve: false },
    { parentMaterial: "毛猪", childMaterial: "肥膘", yieldRate: 0.05, process: 1, slaughterCostPerHead: 40, isReserve: false },
    { parentMaterial: "白条", childMaterial: "五花肉", yieldRate: 0.15, process: 2, slaughterCostPerHead: 80, isReserve: true },
    { parentMaterial: "白条", childMaterial: "前腿肉", yieldRate: 0.18, process: 2, slaughterCostPerHead: 80, isReserve: true },
    { parentMaterial: "白条", childMaterial: "后腿肉", yieldRate: 0.25, process: 2, slaughterCostPerHead: 80, isReserve: true },
    { parentMaterial: "白条", childMaterial: "排骨", yieldRate: 0.12, process: 2, slaughterCostPerHead: 80, isReserve: true },
    { parentMaterial: "白条", childMaterial: "里脊", yieldRate: 0.08, process: 2, slaughterCostPerHead: 80, isReserve: true },
    { parentMaterial: "白条", childMaterial: "肘子", yieldRate: 0.10, process: 2, slaughterCostPerHead: 80, isReserve: false },
    { parentMaterial: "白条", childMaterial: "肥膘", yieldRate: 0.12, process: 2, slaughterCostPerHead: 80, isReserve: false },
  ];
}

function generateSlaughterCapacity(): SlaughterCapacityRow[] {
  const factoryConfigs: Array<{ id: FactoryId; province: Province; baseCapacity: number }> = [
    { id: "factory-cd", province: "四川", baseCapacity: 3500 },
    { id: "factory-zz", province: "河南", baseCapacity: 5500 },
    { id: "factory-jn", province: "山东", baseCapacity: 4200 },
  ];
  const rows: SlaughterCapacityRow[] = [];
  for (const fc of factoryConfigs) {
    for (let month = 1; month <= 12; month++) {
      const maintenanceFactor = (month === 2 || month === 8) ? 0.85 : 1.0;
      rows.push({
        factoryId: fc.id,
        province: fc.province,
        month,
        maxSlaughter: Math.round(fc.baseCapacity * maintenanceFactor),
      });
    }
  }
  return rows;
}

function generateSplitCapacity(): SplitCapacityRow[] {
  const rows: SplitCapacityRow[] = [];
  for (const factoryId of FACTORIES) {
    for (const part of PART_CODES) {
      for (let month = 1; month <= 12; month++) {
        const baseSplit = part === "白条" ? 320000 : 60000 + Math.round(Math.random() * 20000);
        const baseFreeze = part === "白条" ? 80000 : 20000 + Math.round(Math.random() * 10000);
        const baseStorage = part === "白条" ? 200000 : 40000 + Math.round(Math.random() * 15000);
        const storageCost = part === "白条" ? 0.8 : 1.2 + Math.random() * 0.4;
        rows.push({
          factoryId,
          part,
          maxSplitKg: baseSplit,
          maxFreezeKg: baseFreeze,
          maxStorageKg: baseStorage,
          storageCostRate: Math.round(storageCost * 100) / 100,
          month,
        });
      }
    }
  }
  return rows;
}

function generateWarehouses(): WarehouseRow[] {
  const whConfigs: Array<{ id: WarehouseId; factoryId: FactoryId; province: Province; baseCapacity: number }> = [
    { id: "wh-cd", factoryId: "factory-cd", province: "四川", baseCapacity: 500000 },
    { id: "wh-zz", factoryId: "factory-zz", province: "河南", baseCapacity: 800000 },
    { id: "wh-jn", factoryId: "factory-jn", province: "山东", baseCapacity: 650000 },
  ];
  const rows: WarehouseRow[] = [];
  for (const wh of whConfigs) {
    for (let month = 1; month <= 12; month++) {
      rows.push({
        warehouseId: wh.id,
        factoryId: wh.factoryId,
        province: wh.province,
        maxStorageKg: wh.baseCapacity,
        storageCostRate: 0.6 + Math.random() * 0.3,
        month,
        currentInventoryKg: Math.round(wh.baseCapacity * (0.2 + Math.random() * 0.3)),
      });
    }
  }
  return rows;
}

function generateSplitCosts(): SplitCostRow[] {
  const rows: SplitCostRow[] = [];
  const splitCostMap: Record<string, { splitCost: number; freezePackCost: number }> = {
    "白条": { splitCost: 0, freezePackCost: 0 },
    "五花肉": { splitCost: 1.2, freezePackCost: 0.8 },
    "前腿肉": { splitCost: 1.0, freezePackCost: 0.8 },
    "后腿肉": { splitCost: 1.1, freezePackCost: 0.8 },
    "排骨": { splitCost: 1.5, freezePackCost: 1.0 },
    "里脊": { splitCost: 1.8, freezePackCost: 1.2 },
    "肘子": { splitCost: 0.8, freezePackCost: 0.6 },
    "猪蹄": { splitCost: 0.6, freezePackCost: 0.5 },
    "猪头": { splitCost: 0.5, freezePackCost: 0.4 },
    "内脏": { splitCost: 0.4, freezePackCost: 0.3 },
    "板油": { splitCost: 0.3, freezePackCost: 0.2 },
    "肥膘": { splitCost: 0.3, freezePackCost: 0.2 },
  };
  for (const factoryId of FACTORIES) {
    for (const part of PART_CODES) {
      const costs = splitCostMap[part] ?? { splitCost: 1.0, freezePackCost: 0.7 };
      rows.push({
        factoryId,
        part,
        splitCostPerKg: costs.splitCost,
        freezePackCostPerKg: costs.freezePackCost,
      });
    }
  }
  return rows;
}

function generatePigOrders(): PigOrderRow[] {
  const rows: PigOrderRow[] = [];
  for (const factoryId of FACTORIES) {
    for (let month = 1; month <= 12; month++) {
      const orderCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < orderCount; i++) {
        const destProvince = PROVINCES[Math.floor(Math.random() * PROVINCES.length)]!;
        rows.push({
          factoryId,
          month,
          orderQty: 200 + Math.round(Math.random() * 800),
          livePigPrice: LIVE_PIG_PRICES[month]! + (Math.random() - 0.5) * 1.0,
          destinationProvince: destProvince,
        });
      }
    }
  }
  return rows;
}

function generatePartOrders(): PartOrderRow[] {
  const rows: PartOrderRow[] = [];
  const keyParts: PartCode[] = ["白条", "五花肉", "前腿肉", "后腿肉", "排骨", "里脊"];
  for (const factoryId of FACTORIES) {
    for (const part of keyParts) {
      for (let month = 1; month <= 12; month++) {
        for (const ctype of CUSTOMER_TYPES) {
          if (Math.random() > 0.6) continue;
          const destProvince = PROVINCES[Math.floor(Math.random() * PROVINCES.length)]!;
          const basePrice = PART_PRICES[part]?.[ctype] ?? 15;
          rows.push({
            factoryId,
            part,
            month,
            customerType: ctype,
            orderQty: Math.round(500 + Math.random() * 3000),
            salesPrice: Math.round((basePrice + (Math.random() - 0.5) * 2) * 10) / 10,
            destinationProvince: destProvince,
          });
        }
      }
    }
  }
  return rows;
}

function generateDeepProcessDemand(): DeepProcessDemandRow[] {
  const rows: DeepProcessDemandRow[] = [];
  const processParts: PartCode[] = ["前腿肉", "后腿肉", "五花肉", "肥膘"];
  for (const factoryId of FACTORIES) {
    for (const part of processParts) {
      for (let month = 1; month <= 12; month++) {
        const isOwn = Math.random() > 0.4;
        const basePrice = PART_PRICES[part]?.["OEM深加工"] ?? 15;
        rows.push({
          factoryId,
          part,
          month,
          factoryType: isOwn ? "自有深加工" : "OEM深加工",
          rawMaterialDemand: Math.round(1000 + Math.random() * 4000),
          salesPrice: Math.round((basePrice + 3 + Math.random() * 2) * 10) / 10,
          destinationProvince: PROVINCES[Math.floor(Math.random() * PROVINCES.length)]!,
        });
      }
    }
  }
  return rows;
}

function generateTransportCosts(): TransportCostRow[] {
  const rows: TransportCostRow[] = [];
  const distances: Record<string, Record<string, number>> = {
    "四川": { "四川": 0, "河南": 1200, "山东": 1500, "湖南": 800, "广东": 1600, "江苏": 1400 },
    "河南": { "四川": 1200, "河南": 0, "山东": 400, "湖南": 700, "广东": 1300, "江苏": 500 },
    "山东": { "四川": 1500, "河南": 400, "山东": 0, "湖南": 1000, "广东": 1700, "江苏": 400 },
    "湖南": { "四川": 800, "河南": 700, "山东": 1000, "湖南": 0, "广东": 600, "江苏": 800 },
    "广东": { "四川": 1600, "河南": 1300, "山东": 1700, "湖南": 600, "广东": 0, "江苏": 1200 },
    "江苏": { "四川": 1400, "河南": 500, "山东": 400, "湖南": 800, "广东": 1200, "江苏": 0 },
  };
  for (const origin of PROVINCES) {
    for (const dest of PROVINCES) {
      const dist = distances[origin]?.[dest] ?? 1000;
      rows.push({
        originProvince: origin,
        destinationProvince: dest,
        costPerKmPerKg: dist === 0 ? 0 : Math.round((0.0012 + Math.random() * 0.0008) * 10000) / 10000,
        distanceKm: dist,
      });
    }
  }
  return rows;
}

export const PROVINCE_LIST = PROVINCES;
export const PART_CODE_LIST = PART_CODES;
export const CUSTOMER_TYPE_LIST = CUSTOMER_TYPES;
export const FACTORY_ID_LIST = FACTORIES;
export const FARM_ID_LIST = FARMS;
export const WAREHOUSE_ID_LIST = WAREHOUSES;

export const sampleOptimizationInput: OptimizationInput = {
  slaughterSchedule: generateSlaughterSchedule(),
  yieldRates: generateYieldRates(),
  slaughterCapacity: generateSlaughterCapacity(),
  splitCapacity: generateSplitCapacity(),
  splitCosts: generateSplitCosts(),
  warehouses: generateWarehouses(),
  pigOrders: generatePigOrders(),
  partOrders: generatePartOrders(),
  deepProcessDemand: generateDeepProcessDemand(),
  transportCosts: generateTransportCosts(),
};
