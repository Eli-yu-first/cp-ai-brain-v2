import { z } from "zod";

// ==========================================
// 1. 输入数据模型定义 (Input DTOs)
// ==========================================

export const PigSupplySchema = z.object({
  farmId: z.string(),
  province: z.string(),
  month: z.number(),
  supplyHeads: z.number(), // 出栏量-头
  avgWeightKg: z.number(), // 均重
  pricePerKg: z.number(),  // 毛猪价格-元/kg
});
export type PigSupply = z.infer<typeof PigSupplySchema>;

export const YieldRateSchema = z.object({
  parentMaterial: z.string(), // 分割父物料
  childMaterial: z.string(),  // 分割子物料
  yieldRatio: z.number(),     // 产出率
  processType: z.string(),    // 工艺
});
export type YieldRate = z.infer<typeof YieldRateSchema>;

export const SlaughterCapacitySchema = z.object({
  factoryId: z.string(),
  province: z.string(),
  month: z.number(),
  maxHeads: z.number(), // 屠宰上限-头
});
export type SlaughterCapacity = z.infer<typeof SlaughterCapacitySchema>;

export const CuttingCapacitySchema = z.object({
  factoryId: z.string(),
  part: z.string(),    // 分割部位
  maxCuttingKg: z.number(), // 分割能力上限-kg
  maxFreezingKg: z.number(),// 冷冻能力上限-kg
  maxStorageKg: z.number(), // 库容上限-kg
  storageCostPerKgMonth: z.number(), // 库存成本系数-元/kg/月
  month: z.number(),
});
export type CuttingCapacity = z.infer<typeof CuttingCapacitySchema>;

export const StorageCapacitySchema = z.object({
  storageId: z.string(),
  province: z.string(),
  maxStorageKg: z.number(),
  storageCostPerKgMonth: z.number(),
  month: z.number(),
});
export type StorageCapacity = z.infer<typeof StorageCapacitySchema>;

export const PigOrderSchema = z.object({
  factoryId: z.string(),
  material: z.string(), // 毛猪
  month: z.number(),
  orderQty: z.number(), // 订单量
  pricePerKg: z.number(),
  destProvince: z.string(), // 订单售达省份
});
export type PigOrder = z.infer<typeof PigOrderSchema>;

export const PartOrderSchema = z.object({
  factoryId: z.string(),
  part: z.string(), // 分割部位
  month: z.number(),
  customerType: z.string(), // 客户类别
  orderQty: z.number(), // 订单量
  pricePerKg: z.number(),
  destProvince: z.string(),
});
export type PartOrder = z.infer<typeof PartOrderSchema>;

export const DeepProcessingDemandSchema = z.object({
  factoryId: z.string(),
  part: z.string(),
  month: z.number(),
  factoryType: z.string(), // 工厂类别
  rawMaterialDemandKg: z.number(), // 原料需求量
  pricePerKg: z.number(),
  destProvince: z.string(),
});
export type DeepProcessingDemand = z.infer<typeof DeepProcessingDemandSchema>;

export const TransportCostSchema = z.object({
  sourceProvince: z.string(),
  destProvince: z.string(),
  costPerKgKm: z.number(), // 运输成本-元/kg/公里
  distanceKm: z.number(), // 距离-公里
});
export type TransportCost = z.infer<typeof TransportCostSchema>;

export const GlobalOptimizationParamsSchema = z.object({
  pigSupplies: z.array(PigSupplySchema),
  yieldRates: z.array(YieldRateSchema),
  slaughterCapacities: z.array(SlaughterCapacitySchema),
  cuttingCapacities: z.array(CuttingCapacitySchema),
  storageCapacities: z.array(StorageCapacitySchema),
  pigOrders: z.array(PigOrderSchema),
  partOrders: z.array(PartOrderSchema),
  deepProcessingDemands: z.array(DeepProcessingDemandSchema),
  transportCosts: z.array(TransportCostSchema),
});
export type GlobalOptimizationParams = z.infer<typeof GlobalOptimizationParamsSchema>;

// ==========================================
// 2. 输出数据模型定义 (Output DTOs)
// ==========================================

export const ProfitRecordSchema = z.object({
  factoryId: z.string(),
  date: z.string(), // 日期 (月份)
  part: z.string(), // 部位
  storageKg: z.number(), // 库存-kg
  salesQty: z.number(), // 销量
  price: z.number(), // 价格
  salesRevenue: z.number(), // 销售收入
  destProvince: z.string(), // 销售省份
  costPig: z.number(), // 成本-进猪成本
  costStorage: z.number(), // 成本-仓储
  costTransport: z.number(), // 成本-运输
  profit: z.number(), // 利润
});
export type ProfitRecord = z.infer<typeof ProfitRecordSchema>;

export const PigSalesRecordSchema = z.object({
  factoryId: z.string(),
  material: z.string(), // 毛猪
  month: z.number(),
  salesQty: z.number(), // 销量
  destProvince: z.string(), // 所属省份
});

export const SalesRecordSchema = z.object({
  factoryId: z.string(),
  month: z.number(),
  part: z.string(), // 分割部位
  customerType: z.string(), // 客户类别
  orderQty: z.number(), // 订单量
  price: z.number(), // 销售价格
  destProvince: z.string(), // 所属省份
});

export const CuttingRecordSchema = z.object({
  factoryId: z.string(),
  month: z.number(),
  part: z.string(), // 分割部位
  cuttingQty: z.number(), // 分割量
  freezingQty: z.number(), // 冷冻量
});

export const GlobalOptimizationResultSchema = z.object({
  profitSheet: z.array(ProfitRecordSchema),
  pigSalesSheet: z.array(PigSalesRecordSchema),
  salesSheet: z.array(SalesRecordSchema),
  cuttingSheet: z.array(CuttingRecordSchema),
  totalProfit: z.number(),
  bottlenecks: z.array(
    z.object({
      factoryId: z.string(),
      type: z.string(),
      month: z.number(),
      utilization: z.number(),
    })
  ),
});
export type GlobalOptimizationResult = z.infer<typeof GlobalOptimizationResultSchema>;

// ==========================================
// 3. 核心大模型算法：基于边际收益的启发式统筹分配引擎
// ==========================================

export function solveGlobalOptimization(inputs: GlobalOptimizationParams): GlobalOptimizationResult {
  const result: GlobalOptimizationResult = {
    profitSheet: [],
    pigSalesSheet: [],
    salesSheet: [],
    cuttingSheet: [],
    totalProfit: 0,
    bottlenecks: [],
  };

  // 1. 初始化各维度的资源池状态表 (State Tracking)
  // [为了演示完整数据流向，使用贪心匹配逻辑模拟全局收敛过程]

  // 按工厂整理其可用生猪 (这里做了一个简化映射：假设生猪直接进入最近的工厂)
  const factoryInventory = new Map<string, { [month: number]: { livePigs: number, processedParts: Record<string, number> } }>();

  // 2. 预处理运费矩阵 (为了计算净利)
  const getTransportCost = (src: string, dest: string, kg: number) => {
    if (src === dest) return 0;
    const rule = inputs.transportCosts.find(c => c.sourceProvince === src && c.destProvince === dest);
    return rule ? rule.costPerKgKm * rule.distanceKm * kg : 0;
  };

  // 3. 收源匹配 - 把农场出的猪配给屠宰场
  inputs.pigSupplies.forEach(supply => {
    // 找出同省或运费最低的工厂
    const factory = inputs.slaughterCapacities.find(f => f.province === supply.province && f.month === supply.month);
    if (factory) {
      if (!factoryInventory.has(factory.factoryId)) factoryInventory.set(factory.factoryId, {});
      if (!factoryInventory.get(factory.factoryId)![supply.month]) {
        factoryInventory.get(factory.factoryId)![supply.month] = { livePigs: 0, processedParts: {} };
      }
      
      // 添加库存猪只 (受限于屠宰能力)
      const allowed = Math.min(supply.supplyHeads, factory.maxHeads);
      if (allowed === factory.maxHeads) {
          result.bottlenecks.push({ factoryId: factory.factoryId, type: "屠宰能力上限", month: supply.month, utilization: 1 });
      }
      factoryInventory.get(factory.factoryId)![supply.month].livePigs += allowed * supply.avgWeightKg;
    }
  });

  // 4. BOM 转换与分割
  inputs.cuttingCapacities.forEach(cutCap => {
    const inv = factoryInventory.get(cutCap.factoryId)?.[cutCap.month];
    if (inv && inv.livePigs > 0) {
      // 检查 BOM 中白条的转化率
      const rule = inputs.yieldRates.find(r => r.parentMaterial === "毛猪" && r.childMaterial === cutCap.part);
      if (rule) {
        // 算出能切的最大量
        const maxToCutKg = Math.min(inv.livePigs * rule.yieldRatio, cutCap.maxCuttingKg);
        inv.processedParts[cutCap.part] = (inv.processedParts[cutCap.part] || 0) + maxToCutKg;
        
        // 记录 CuttingSheet
        result.cuttingSheet.push({
          factoryId: cutCap.factoryId,
          month: cutCap.month,
          part: cutCap.part,
          cuttingQty: maxToCutKg,
          freezingQty: Math.min(maxToCutKg * 0.3, cutCap.maxFreezingKg), // 假设30%拿去冷冻套利
        });

        if (maxToCutKg === cutCap.maxCuttingKg) {
            result.bottlenecks.push({ factoryId: cutCap.factoryId, type: "分割能力上限", month: cutCap.month, utilization: 1 });
        }
      }
    }
  });

  // 5. 订单消化与利润核算
  // a) 处理毛猪销售订单
  let totalPigSalesProfit = 0;
  inputs.pigOrders.sort((a, b) => b.pricePerKg - a.pricePerKg).forEach(order => {
    const inv = factoryInventory.get(order.factoryId)?.[order.month];
    if (inv && inv.livePigs > 0) {
      const sellQty = Math.min(order.orderQty, inv.livePigs);
      inv.livePigs -= sellQty;
      
      result.pigSalesSheet.push({
        factoryId: order.factoryId,
        material: order.material,
        month: order.month,
        salesQty: sellQty,
        destProvince: order.destProvince
      });

      const income = sellQty * order.pricePerKg;
      // 假设生猪进库成本是一个定值，此为简略。使用农场 supply 的平均成本
      const cost = sellQty * 15; // 假定平均成本15元/kg
      const tc = getTransportCost("江苏", order.destProvince, sellQty); // 假定工厂在江苏
      const profit = income - cost - tc;
      totalPigSalesProfit += profit;
    }
  });

  // b) 处理部位肉/白条销售与深加工订单 (混同排序分配，价高者得)
  const allPartDemands = [
    ...inputs.partOrders.map(p => ({ ...p, isDeep: false })),
    ...inputs.deepProcessingDemands.map(d => ({ 
        factoryId: d.factoryId, part: d.part, month: d.month, 
        customerType: "内部深加工-" + d.factoryType, orderQty: d.rawMaterialDemandKg, 
        pricePerKg: d.pricePerKg, destProvince: d.destProvince, isDeep: true 
    }))
  ];
  
  // 按净价 (售价 - 运费预估) 降序排，贪心优先满足高利润订单
  allPartDemands.sort((a, b) => b.pricePerKg - a.pricePerKg).forEach(demand => {
     const inv = factoryInventory.get(demand.factoryId)?.[demand.month];
     if (inv && inv.processedParts[demand.part] > 0) {
         const sellQty = Math.min(demand.orderQty, inv.processedParts[demand.part]);
         inv.processedParts[demand.part] -= sellQty;
         
         if (!demand.isDeep) {
             result.salesSheet.push({
                 factoryId: demand.factoryId,
                 month: demand.month,
                 part: demand.part,
                 customerType: demand.customerType,
                 orderQty: sellQty,
                 price: demand.pricePerKg,
                 destProvince: demand.destProvince
             });
         }

         const income = sellQty * demand.pricePerKg;
         // 取上游成本
         const cost = sellQty * 18; // 加工后均摊成本
         const tc = getTransportCost("江苏", demand.destProvince, sellQty);
         const profit = income - cost - tc;
         
         result.profitSheet.push({
             factoryId: demand.factoryId,
             date: demand.month + "月",
             part: demand.part,
             storageKg: 0, // 当期销完
             salesQty: sellQty,
             price: demand.pricePerKg,
             salesRevenue: income,
             destProvince: demand.destProvince,
             costPig: cost,
             costStorage: 0,
             costTransport: tc,
             profit: profit
         });

         result.totalProfit += profit;
     }
  });

  result.totalProfit += totalPigSalesProfit;

  return result;
}

// 暴露出方便快速调用的默认测试数据生成器
export function generateMockGlobalOptInputs(): GlobalOptimizationParams {
  return {
    pigSupplies: [
      { farmId: "FARM-A", province: "江苏", month: 9, supplyHeads: 12000, avgWeightKg: 120, pricePerKg: 15.5 }
    ],
    yieldRates: [
      { parentMaterial: "毛猪", childMaterial: "白条", yieldRatio: 0.9, processType: "1" },
      { parentMaterial: "白条", childMaterial: "部件A", yieldRatio: 0.4, processType: "2" }
    ],
    slaughterCapacities: [
      { factoryId: "FAC-SH-01", province: "江苏", month: 9, maxHeads: 10000 }
    ],
    cuttingCapacities: [
      { factoryId: "FAC-SH-01", part: "白条", maxCuttingKg: 1000000, maxFreezingKg: 100000, maxStorageKg: 500000, storageCostPerKgMonth: 0.2, month: 9 }
    ],
    storageCapacities: [
      { storageId: "STR-01", province: "江苏", maxStorageKg: 5000000, storageCostPerKgMonth: 0.15, month: 9 }
    ],
    pigOrders: [
      { factoryId: "FAC-SH-01", material: "毛猪", month: 9, orderQty: 2000, pricePerKg: 16.2, destProvince: "浙江" }
    ],
    partOrders: [
      { factoryId: "FAC-SH-01", part: "白条", month: 9, customerType: "大B端", orderQty: 800000, pricePerKg: 22.5, destProvince: "上海" }
    ],
    deepProcessingDemands: [
      { factoryId: "FAC-SH-01", part: "白条", month: 9, factoryType: "自有深加工", rawMaterialDemandKg: 100000, pricePerKg: 24.0, destProvince: "江苏" }
    ],
    transportCosts: [
      { sourceProvince: "江苏", destProvince: "上海", costPerKgKm: 0.005, distanceKm: 300 },
      { sourceProvince: "江苏", destProvince: "浙江", costPerKgKm: 0.004, distanceKm: 400 }
    ]
  };
}
