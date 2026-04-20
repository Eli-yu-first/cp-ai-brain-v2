import { PORK_PARTS, calculateCostOfCarryFairPrice, calculateRiskAdjustedHoldingReturn, type PorkPartDefinition } from "./porkIndustryModel";

export type DeepArbitrageCategory =
  | "transmission"
  | "breeding_structure"
  | "zero_waste"
  | "channel_scene"
  | "capacity_mismatch"
  | "supply_chain_cash"
  | "policy_bonus"
  | "quality_brand"
  | "info_arbitrage"
  | "counter_cyclical"
  | "cross_border"
  | "compliance_optimization"
  | "light_asset_joint"
  | "green_circular";

export type DeepArbitrageResult = {
  category: DeepArbitrageCategory;
  name: string;
  description: string;
  triggerCondition: string;
  triggerStatus: "active" | "watch" | "inactive";
  expectedReturnPerHead: number;
  riskLevel: "低" | "中" | "高";
  implementation: string[];
  metrics: Record<string, number>;
};

export type IntegratedArbitrageResult = {
  timeArbitrage: TimeArbitrageSummary;
  spaceArbitrage: SpaceArbitrageSummary;
  entityArbitrage: EntityArbitrageSummary;
  financialArbitrage: FinancialArbitrageSummary;
  deepArbitrages: DeepArbitrageResult[];
  totalExpectedReturn: number;
  optimalStrategy: string;
  riskDistribution: Record<string, number>;
};

export type TimeArbitrageSummary = {
  active: boolean;
  currentSpotPrice: number;
  futuresPrice: number;
  carryCost: number;
  basis: number;
  holdingDays: number;
  expectedReturnPerTon: number;
  SharpeRatio: number;
};

export type SpaceArbitrageSummary = {
  active: boolean;
  originPrice: number;
  destPrice: number;
  transportCost: number;
  netProfitPerKg: number;
  bestRoute: string;
  totalCapacity: number;
};

export type EntityArbitrageSummary = {
  active: boolean;
  freshProfitPerKg: number;
  frozenProfitPerKg: number;
  processingProfitPerKg: number;
  bestChannel: string;
  premiumRate: number;
};

export type FinancialArbitrageSummary = {
  active: boolean;
  spotPrice: number;
  futuresPrice: number;
  basisSpread: number;
  hedgeRatio: number;
  fundingCostSaving: number;
};

export type DeepArbitrageInput = {
  cornPrice: number;
  soybeanMealPrice: number;
  liveHogPrice: number;
  porkPartPrices: Record<string, number>;
  sowStock: number;
  capacityUtilization: number;
  inventoryAgeDistribution: Record<string, number>;
  coldChainCost: number;
  storageCost: number;
  capitalCost: number;
  regionalPriceSpread: Record<string, Record<string, number>>;
  policySignals: string[];
  brandCertification: string[];
};

const ARBITRAGE_THRESHOLDS = {
  transmissionThreshold: 0.08,
  breedingThreshold: 0.15,
  zeroWasteMinRevenue: 0.05,
  channelPremiumMin: 0.10,
  capacityMismatchMinGain: 0.03,
  cashFlowDiscount: 0.03,
  policySubsidyMin: 0.02,
  brandPremiumMin: 0.30,
  infoAdvantageMin: 0.05,
  counterCyclicalDiscount: 0.40,
  crossBorderSpreadMin: 0.15,
  complianceSavingMin: 0.02,
  jointProfitMin: 0.05,
  greenSavingMin: 0.03,
};

function detectTransmissionArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const cornPerKg = input.cornPrice / 1000;
  const soybeanMealPerKg = input.soybeanMealPrice / 1000;
  const feedCost = cornPerKg * 2.8 + soybeanMealPerKg * 0.6;
  const breedingCost = feedCost * 1.15 + 2.5;
  const expectedHogCost = breedingCost * 1.08;
  const deviation = Math.abs(input.liveHogPrice - expectedHogCost) / expectedHogCost;

  const isActive = deviation >= ARBITRAGE_THRESHOLDS.transmissionThreshold;
  const direction = input.liveHogPrice < expectedHogCost ? "压栏观望" : "加速出栏";
  const returnPerHead = deviation * input.liveHogPrice * 110;

  return {
    category: "transmission",
    name: "产业链跨品种传导套利",
    description: "基于原料成本（玉米/豆粕）→ 生猪养殖成本 → 分割品成本的传导公式，捕捉价格偏离套利机会",
    triggerCondition: `传导偏离度: ${(deviation * 100).toFixed(1)}% ${isActive ? "≥" : "<"} 8% 阈值`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: returnPerHead,
    riskLevel: deviation > 0.15 ? "高" : deviation > 0.10 ? "中" : "低",
    implementation: [
      deviation < -0.08 ? "买原料 + 卖期货套保" : "锁定采购 + 加快出栏节奏",
      "对冲饲料成本波动风险",
      "优化出栏窗口匹配行情",
    ],
    metrics: {
      cornPrice: input.cornPrice,
      soybeanMealPrice: input.soybeanMealPrice,
      liveHogPrice: input.liveHogPrice,
      expectedCost: expectedHogCost,
      deviation: deviation * 100,
    },
  };
}

function detectBreedingStructureArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const sowStockSignal = input.sowStock < 4100 ? "去化加速" : input.sowStock > 4500 ? "存栏过剩" : "平衡";
  const PSY = 22;
  const pigletCost = 350;
  const fatteningCost = input.liveHogPrice * 110 - pigletCost - 280;
  const returnPerHead = Math.max(0, fatteningCost);

  const isActive = input.sowStock < 4200 || input.sowStock > 4800;
  const direction = input.sowStock < 4100 ? "补栏高产母猪" : "淘汰低 PSY 母猪";

  return {
    category: "breeding_structure",
    name: "养殖端繁育结构套利",
    description: "基于能繁母猪存栏结构（PSY、胎龄结构）优化仔猪/育肥猪出栏节奏，赚取结构差",
    triggerCondition: `能繁母猪存栏: ${input.sowStock} 万头 [${sowStockSignal}] PSY=${PSY}`,
    triggerStatus: isActive ? "active" : "watch",
    expectedReturnPerHead: returnPerHead,
    riskLevel: input.sowStock < 4000 ? "高" : "中",
    implementation: [
      input.sowStock < 4100 ? "逆周期补栏高产母猪" : "淘汰 PSY<22 母猪",
      "优化胎龄结构，提升 PSY",
      `仔猪育肥成本: ¥${pigletCost + 280}/头 → 预期收益: ¥${returnPerHead.toFixed(0)}/头`,
    ],
    metrics: {
      sowStock: input.sowStock,
      PSY: PSY,
      pigletCost: pigletCost,
      fatteningCost: fatteningCost,
    },
  };
}

function detectZeroWasteArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const bloodRevenue = 15;
  const boneRevenue = 8;
  const skinRevenue = 25;
  const intestineRevenue = 12;
  const totalByproductValue = bloodRevenue + boneRevenue + skinRevenue + intestineRevenue;
  const wasteDisposalCost = -5;
  const netValue = totalByproductValue + wasteDisposalCost;

  const isActive = netValue > ARBITRAGE_THRESHOLDS.zeroWasteMinRevenue * input.liveHogPrice;

  return {
    category: "zero_waste",
    name: "全价值零废弃套利",
    description: "猪血→血红蛋白、猪皮→胶原蛋白、猪骨→骨油/骨粉、分割副产品→肉馅/肉丸，实现全猪零废弃",
    triggerCondition: `副产品总价值: ¥${totalByproductValue}/头 vs 处置成本: ¥${Math.abs(wasteDisposalCost)}/头`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: netValue,
    riskLevel: "低",
    implementation: [
      "猪血 → 生物医药原料 (溢价 10x)",
      "猪骨 → 骨油/骨粉/宠物食品",
      "碎肉 → 肉丸/灌肠/预制菜",
      "沼气 → 有机肥/绿电",
    ],
    metrics: {
      bloodRevenue: bloodRevenue,
      boneRevenue: boneRevenue,
      skinRevenue: skinRevenue,
      intestineRevenue: intestineRevenue,
      totalByproductValue: totalByproductValue,
      wasteSaving: Math.abs(wasteDisposalCost),
    },
  };
}

function detectChannelSceneArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const restaurantPrice = input.liveHogPrice * 1.45;
  const supermarketPrice = input.liveHogPrice * 1.28;
  const wholesalePrice = input.liveHogPrice * 1.15;
  const eCommercePrice = input.liveHogPrice * 1.22;

  const channelSpread = restaurantPrice - wholesalePrice;
  const premiumRate = channelSpread / wholesalePrice;
  const isActive = premiumRate >= ARBITRAGE_THRESHOLDS.channelPremiumMin;

  return {
    category: "channel_scene",
    name: "渠道场景流量套利",
    description: "餐饮渠道溢价 25-40%、商超溢价 15-20%、电商溢价 15-25%，脱离批发价约束赚取场景溢价",
    triggerCondition: `餐饮-批发价差: ¥${channelSpread.toFixed(2)}/kg (溢价率 ${(premiumRate * 100).toFixed(1)}%)`,
    triggerStatus: isActive ? "active" : "watch",
    expectedReturnPerHead: channelSpread * 70,
    riskLevel: "中",
    implementation: [
      "高端餐饮定制切割 → 溢价 25-40%",
      "商超预包装 → 溢价 15-20%",
      "社区团购/直播 → 溢价 15-30%",
      "应急渠道 → 溢价 10-20%",
    ],
    metrics: {
      restaurantPrice: restaurantPrice,
      supermarketPrice: supermarketPrice,
      wholesalePrice: wholesalePrice,
      eCommercePrice: eCommercePrice,
      channelSpread: channelSpread,
      premiumRate: premiumRate * 100,
    },
  };
}

function detectCapacityMismatchArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const utilizationGap = Math.abs(100 - input.capacityUtilization);
  const isActive = utilizationGap >= 15;
  const idleCostSaving = utilizationGap * 0.8;

  return {
    category: "capacity_mismatch",
    name: "产能错配协同套利",
    description: "利用行业内产能闲置/紧缺错配，集团内/行业间协同，赚产能使用费 + 差价",
    triggerCondition: `产能利用率: ${input.capacityUtilization}% (偏离度: ${utilizationGap.toFixed(1)}%)`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: idleCostSaving * 0.5,
    riskLevel: "低",
    implementation: [
      input.capacityUtilization < 85
        ? "对外承接代工，赚取加工费 + 部位差价"
        : "租赁闲置屠宰/分割/冷库产能",
      "冷链共享: 闲置冷库对外租赁",
      "产能互补: 集团内各工厂协同调配",
    ],
    metrics: {
      capacityUtilization: input.capacityUtilization,
      idleCapacitySaving: idleCostSaving,
      targetUtilization: 95,
    },
  };
}

function detectSupplyChainCashArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const upstreamDiscount = ARBITRAGE_THRESHOLDS.cashFlowDiscount;
  const downstreamPremium = 0.02;
  const bankRate = 0.035;
  const specialRate = 0.028;
  const rateSaving = bankRate - specialRate;

  const isActive = upstreamDiscount + downstreamPremium > ARBITRAGE_THRESHOLDS.cashFlowDiscount;

  return {
    category: "supply_chain_cash",
    name: "供应链现金流套利",
    description: "利用账期、票据、预付款、保理的时间差，赚资金收益 + 降财务成本",
    triggerCondition: `上游折扣: ${(upstreamDiscount * 100).toFixed(1)}% + 下游溢价: ${(downstreamPremium * 100).toFixed(1)}% + 利率差: ${(rateSaving * 100).toFixed(1)}%`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: (upstreamDiscount + downstreamPremium + rateSaving) * input.liveHogPrice * 110 * 0.5,
    riskLevel: "低",
    implementation: [
      "上游预付锁价 → 采购折扣 3-5%",
      "下游短账期换售价上浮 2-3%",
      "银行承兑汇票支付上游 → 赚取贴息",
      "争取专项授信利率 2.8% vs 市场 3.5%",
    ],
    metrics: {
      upstreamDiscount: upstreamDiscount * 100,
      downstreamPremium: downstreamPremium * 100,
      rateSaving: rateSaving * 100,
      annualSaving: rateSaving * input.liveHogPrice * 110 * 40000 * 120 / 10000,
    },
  };
}

function detectPolicyBonusArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const policySignals = input.policySignals.join(", ") || "暂无明确政策信号";
  const storageSubsidy = 0.3;
  const breedingSubsidy = 50;
  const insuranceSubsidy = 0.02;

  const isActive = input.policySignals.length > 0;
  const totalSubsidy = storageSubsidy + breedingSubsidy + insuranceSubsidy * input.liveHogPrice * 110;

  return {
    category: "policy_bonus",
    name: "政策红利精准套利",
    description: "精准对接国家/地方生猪政策，赚补贴、收储、保险、税费的红利，完全无市场风险",
    triggerCondition: `政策信号: ${policySignals}`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: totalSubsidy,
    riskLevel: "低",
    implementation: [
      "官方启动收储 → 按标准备货交储，赚托底价 + 运费补贴",
      "规模化养殖补贴: ¥50/头",
      "良种繁育补贴 + 环保改造补贴",
      "保险+期货套保: 锁定底部销售底价",
    ],
    metrics: {
      storageSubsidy: storageSubsidy,
      breedingSubsidy: breedingSubsidy,
      insuranceSubsidy: insuranceSubsidy * 100,
      totalSubsidyPerHead: totalSubsidy,
    },
  };
}

function detectQualityBrandArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const certifications = input.brandCertification.join(", ") || "暂无认证";
  const greenPremium = input.liveHogPrice * 0.35;
  const organicPremium = input.liveHogPrice * 0.60;
  const traceablePremium = input.liveHogPrice * 0.25;
  const geographicPremium = input.liveHogPrice * 0.50;

  const maxPremium = Math.max(greenPremium, organicPremium, traceablePremium, geographicPremium);
  const premiumRate = maxPremium / input.liveHogPrice;
  const isActive = premiumRate >= ARBITRAGE_THRESHOLDS.brandPremiumMin;

  return {
    category: "quality_brand",
    name: "品质标准品牌套利",
    description: "绿色食品/有机认证溢价 30-100%、地理标志溢价 50%+、全程溯源溢价 20-40%",
    triggerCondition: `品牌溢价: ¥${maxPremium.toFixed(2)}/kg (溢价率 ${(premiumRate * 100).toFixed(1)}%)`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: maxPremium * 70,
    riskLevel: "中",
    implementation: [
      "申请绿色食品/有机认证 → 溢价 30-100%",
      "地方黑猪地理标志 → 整猪溢价 50%+",
      "全程溯源体系 → 部位溢价 20-40%",
      "建立品牌壁垒，穿越周期",
    ],
    metrics: {
      certifications: certifications.length,
      greenPremium: greenPremium,
      organicPremium: organicPremium,
      traceablePremium: traceablePremium,
      geographicPremium: geographicPremium,
      maxPremium: maxPremium,
    },
  };
}

function detectInfoArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const regionalDemandSignals = Object.keys(input.regionalPriceSpread).length;
  const priceVolatility = calculatePriceVolatility(input.porkPartPrices);
  const isActive = regionalDemandSignals > 5 || priceVolatility > 0.08;

  const infoAdvantageValue = priceVolatility * input.liveHogPrice * 80;

  return {
    category: "info_arbitrage",
    name: "信息差量化套利",
    description: "利用产业数据、区域数据、供需数据的信息差，提前预判价格波动，赚预判收益",
    triggerCondition: `区域价差信号: ${regionalDemandSignals}个 | 价格波动率: ${(priceVolatility * 100).toFixed(1)}%`,
    triggerStatus: isActive ? "active" : "watch",
    expectedReturnPerHead: infoAdvantageValue,
    riskLevel: "高",
    implementation: [
      "区域供需信息差 → 提前囤货调拨",
      "能繁母猪存栏下滑 → 提前布局冻储",
      "屠宰开工率暴跌 → 提前收购生猪",
      "嵌入 AI 系统新增信息差预警指标",
    ],
    metrics: {
      regionalSignals: regionalDemandSignals,
      priceVolatility: priceVolatility * 100,
      infoAdvantageValue: infoAdvantageValue,
    },
  };
}

function detectCounterCyclicalArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const cyclePhase = input.liveHogPrice < 12 ? "底部" : input.liveHogPrice < 15 ? "下行" : "上行";
  const isActive = cyclePhase === "底部";
  const assetDiscount = isActive ? 0.70 : 0;
  const expectedAssetValue = input.liveHogPrice * 110 * (1 + assetDiscount);

  return {
    category: "counter_cyclical",
    name: "逆向周期危机套利",
    description: "猪周期底部利用行业危机、企业淘汰，逆向布局，赚周期反转的超额收益",
    triggerCondition: `周期阶段: ${cyclePhase} | 资产折价: ${(assetDiscount * 100).toFixed(0)}%`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: expectedAssetValue * 0.15,
    riskLevel: "高",
    implementation: [
      "收购亏损猪场/屠宰场 (价格仅为高峰期 20-30%)",
      "闲置资金置换优质产能 (比新建成本低 50%+)",
      "收购淘汰企业的渠道资源",
      "周期反转后资产增值 2-5 倍",
    ],
    metrics: {
      cyclePhaseCode: cyclePhase === "底部" ? 1 : cyclePhase === "下行" ? 2 : 3,
      assetDiscount: assetDiscount * 100,
      expectedAssetValue: expectedAssetValue,
      expectedReturn: expectedAssetValue * 0.15,
    },
  };
}

function detectCrossBorderArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const importPrice = input.liveHogPrice * 0.82;
  const tariff = 0.12;
  const logisticsCost = 1.5;
  const domesticPrice = input.liveHogPrice;
  const crossBorderSpread = domesticPrice - (importPrice * (1 + tariff) + logisticsCost);

  const isActive = crossBorderSpread > ARBITRAGE_THRESHOLDS.crossBorderSpreadMin * input.liveHogPrice;

  return {
    category: "cross_border",
    name: "跨境内外盘联动套利",
    description: "利用国内外猪肉价格、期货、关税、汇率的错配，赚跨境价差",
    triggerCondition: `进口成本: ¥${(importPrice * (1 + tariff) + logisticsCost).toFixed(2)}/kg vs 国内价: ¥${domesticPrice.toFixed(2)}/kg`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: Math.max(0, crossBorderSpread * 70),
    riskLevel: "高",
    implementation: [
      crossBorderSpread > 0
        ? "进口套利: 海外猪肉到岸+关税 < 国内价 15%"
        : "出口套利: 国内低价部位→东南亚/日韩",
      "内外盘期货套利: 价差收敛获利",
      "锁定汇率，规避汇率波动风险",
    ],
    metrics: {
      importPrice: importPrice,
      tariff: tariff * 100,
      logisticsCost: logisticsCost,
      domesticPrice: domesticPrice,
      crossBorderSpread: crossBorderSpread,
    },
  };
}

function detectComplianceOptimization(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const taxSaving = input.liveHogPrice * 0.015;
  const lossSaving = input.liveHogPrice * 0.012;
  const processSaving = input.liveHogPrice * 0.008;
  const totalSaving = taxSaving + lossSaving + processSaving;

  const isActive = totalSaving > ARBITRAGE_THRESHOLDS.complianceSavingMin * input.liveHogPrice;

  return {
    category: "compliance_optimization",
    name: "合规优化隐性套利",
    description: "通过税务、检疫、损耗、流程的合规优化，降低隐性成本，等同于套利",
    triggerCondition: `税务优化: ¥${taxSaving.toFixed(0)} + 损耗优化: ¥${lossSaving.toFixed(0)} + 流程优化: ¥${processSaving.toFixed(0)}`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: totalSaving,
    riskLevel: "低",
    implementation: [
      "农产品免税/进项抵扣 → 税负降低",
      "检疫流程优化 → 损耗率从 3% 降至 1%",
      "屠宰-分割-仓储流程简化 → 人工/水电成本降 10%",
      "年隐性成本降低百万级",
    ],
    metrics: {
      taxSaving: taxSaving,
      lossSaving: lossSaving,
      processSaving: processSaving,
      totalSaving: totalSaving,
    },
  };
}

function detectLightAssetJointArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const processingFee = 80;
  const jointProfit = 120;
  const selfOperationCost = 150;
  const saving = selfOperationCost - jointProfit;

  const isActive = saving > ARBITRAGE_THRESHOLDS.jointProfitMin * input.liveHogPrice * 110;

  return {
    category: "light_asset_joint",
    name: "轻资产联营套利",
    description: "与渠道、加工厂、养殖户联营，输出标准+技术，赚分成，无资产风险",
    triggerCondition: `联营分成收益: ¥${jointProfit}/头 vs 自营成本: ¥${selfOperationCost}/头 (节省: ¥${saving}/头)`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: saving,
    riskLevel: "低",
    implementation: [
      "渠道联营: 商超/餐饮供货，利润分成，不用垫资",
      "加工联营: 与熟食厂联营，输出部位原料，赚加工分成",
      "养殖联营: 公司+农户，输出仔猪/饲料，赚育肥分成",
      "轻资产、高周转、低风险",
    ],
    metrics: {
      processingFee: processingFee,
      jointProfit: jointProfit,
      selfOperationCost: selfOperationCost,
      saving: saving,
    },
  };
}

function detectGreenCircularArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  const greenElectricitySaving = input.liveHogPrice * 0.03;
  const carbonCredit = 15;
  const waterSaving = 8;
  const totalGreenValue = greenElectricitySaving + carbonCredit + waterSaving;

  const isActive = totalGreenValue > ARBITRAGE_THRESHOLDS.greenSavingMin * input.liveHogPrice;

  return {
    category: "green_circular",
    name: "绿色循环生态套利",
    description: "对接碳减排、绿电、循环农业政策，赚绿色收益+补贴",
    triggerCondition: `绿电节省: ¥${greenElectricitySaving.toFixed(0)} + 碳汇收益: ¥${carbonCredit} + 节水节省: ¥${waterSaving}`,
    triggerStatus: isActive ? "active" : "inactive",
    expectedReturnPerHead: totalGreenValue,
    riskLevel: "低",
    implementation: [
      "养殖场/冷库用光伏绿电 → 电价降低 30%+",
      "养殖减排/有机肥生产 → 申领碳汇收益",
      "屠宰循环水利用 → 水费降低 50%",
      "符合政策导向，持续获取增量收益",
    ],
    metrics: {
      greenElectricitySaving: greenElectricitySaving,
      carbonCredit: carbonCredit,
      waterSaving: waterSaving,
      totalGreenValue: totalGreenValue,
    },
  };
}

function calculatePriceVolatility(prices: Record<string, number>): number {
  const values = Object.values(prices);
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function analyzeAllDeepArbitrages(input: DeepArbitrageInput): DeepArbitrageResult[] {
  const results: DeepArbitrageResult[] = [];

  const transmission = detectTransmissionArbitrage(input);
  if (transmission) results.push(transmission);

  const breeding = detectBreedingStructureArbitrage(input);
  if (breeding) results.push(breeding);

  const zeroWaste = detectZeroWasteArbitrage(input);
  if (zeroWaste) results.push(zeroWaste);

  const channel = detectChannelSceneArbitrage(input);
  if (channel) results.push(channel);

  const capacity = detectCapacityMismatchArbitrage(input);
  if (capacity) results.push(capacity);

  const cashFlow = detectSupplyChainCashArbitrage(input);
  if (cashFlow) results.push(cashFlow);

  const policy = detectPolicyBonusArbitrage(input);
  if (policy) results.push(policy);

  const brand = detectQualityBrandArbitrage(input);
  if (brand) results.push(brand);

  const info = detectInfoArbitrageArbitrage(input);
  if (info) results.push(info);

  const counter = detectCounterCyclicalArbitrage(input);
  if (counter) results.push(counter);

  const crossBorder = detectCrossBorderArbitrage(input);
  if (crossBorder) results.push(crossBorder);

  const compliance = detectComplianceOptimization(input);
  if (compliance) results.push(compliance);

  const joint = detectLightAssetJointArbitrage(input);
  if (joint) results.push(joint);

  const green = detectGreenCircularArbitrage(input);
  if (green) results.push(green);

  return results.sort((a, b) => {
    if (a.triggerStatus === "active" && b.triggerStatus !== "active") return -1;
    if (a.triggerStatus !== "active" && b.triggerStatus === "active") return 1;
    return b.expectedReturnPerHead - a.expectedReturnPerHead;
  });
}

function detectInfoArbitrageArbitrage(input: DeepArbitrageInput): DeepArbitrageResult | null {
  return detectInfoArbitrage(input);
}

export function buildIntegratedArbitrageAnalysis(
  timeResult: { spotPrice: number; futuresPrice: number; basis: number; holdingDays: number; expectedReturn: number; sharpeRatio: number },
  spaceResult: { originPrice: number; destPrice: number; transportCost: number; netProfitPerKg: number; bestRoute: string; totalCapacity: number },
  entityResult: { freshProfitPerKg: number; frozenProfitPerKg: number; processingProfitPerKg: number; bestChannel: string; premiumRate: number },
  financialResult: { spotPrice: number; futuresPrice: number; basisSpread: number; hedgeRatio: number; fundingCostSaving: number },
  deepInput: DeepArbitrageInput,
): IntegratedArbitrageResult {
  const deepArbitrages = analyzeAllDeepArbitrages(deepInput);

  const timeArbitrage: TimeArbitrageSummary = {
    active: timeResult.basis > 0 && timeResult.holdingDays > 0,
    currentSpotPrice: timeResult.spotPrice,
    futuresPrice: timeResult.futuresPrice,
    carryCost: timeResult.basis,
    basis: timeResult.basis,
    holdingDays: timeResult.holdingDays,
    expectedReturnPerTon: timeResult.expectedReturn,
    SharpeRatio: timeResult.sharpeRatio,
  };

  const spaceArbitrage: SpaceArbitrageSummary = {
    active: spaceResult.netProfitPerKg > 0,
    originPrice: spaceResult.originPrice,
    destPrice: spaceResult.destPrice,
    transportCost: spaceResult.transportCost,
    netProfitPerKg: spaceResult.netProfitPerKg,
    bestRoute: spaceResult.bestRoute,
    totalCapacity: spaceResult.totalCapacity,
  };

  const entityArbitrage: EntityArbitrageSummary = {
    active: entityResult.premiumRate > 0.1,
    freshProfitPerKg: entityResult.freshProfitPerKg,
    frozenProfitPerKg: entityResult.frozenProfitPerKg,
    processingProfitPerKg: entityResult.processingProfitPerKg,
    bestChannel: entityResult.bestChannel,
    premiumRate: entityResult.premiumRate,
  };

  const financialArbitrage: FinancialArbitrageSummary = {
    active: financialResult.basisSpread > 0.5,
    spotPrice: financialResult.spotPrice,
    futuresPrice: financialResult.futuresPrice,
    basisSpread: financialResult.basisSpread,
    hedgeRatio: financialResult.hedgeRatio,
    fundingCostSaving: financialResult.fundingCostSaving,
  };

  const activeDeepArbitrages = deepArbitrages.filter(d => d.triggerStatus === "active");
  const totalExpectedReturn =
    timeResult.expectedReturn * 1000 +
    spaceResult.netProfitPerKg * spaceResult.totalCapacity +
    activeDeepArbitrages.reduce((sum, d) => sum + d.expectedReturnPerHead * 40000, 0) / 10000;

  const riskDistribution: Record<string, number> = {
    市场风险: 25,
    产能风险: 20,
    资金风险: 15,
    执行风险: 15,
    政策风险: 10,
    技术风险: 15,
  };

  const optimalStrategy = buildOptimalStrategy(timeArbitrage, spaceArbitrage, entityArbitrage, financialArbitrage, activeDeepArbitrages);

  return {
    timeArbitrage,
    spaceArbitrage,
    entityArbitrage,
    financialArbitrage,
    deepArbitrages,
    totalExpectedReturn,
    optimalStrategy,
    riskDistribution,
  };
}

function buildOptimalStrategy(
  time: TimeArbitrageSummary,
  space: SpaceArbitrageSummary,
  entity: EntityArbitrageSummary,
  financial: FinancialArbitrageSummary,
  deepArbitrages: DeepArbitrageResult[],
): string {
  const strategies: string[] = [];

  if (time.active) {
    strategies.push(`时间套利: 持有 ${time.holdingDays} 天，预期收益 ¥${time.expectedReturnPerTon}/吨，Sharpe=${time.SharpeRatio.toFixed(2)}`);
  }

  if (space.active) {
    strategies.push(`空间套利: ${space.bestRoute}，净利 ¥${space.netProfitPerKg.toFixed(2)}/kg，调配量 ${space.totalCapacity} 吨`);
  }

  if (entity.active) {
    strategies.push(`实体套利: 优先${entity.bestChannel}渠道，溢价率 ${(entity.premiumRate * 100).toFixed(0)}%`);
  }

  if (financial.active) {
    strategies.push(`金融套利: 期现基差 ¥${financial.basisSpread.toFixed(2)}/kg，对冲比例 ${(financial.hedgeRatio * 100).toFixed(0)}%`);
  }

  const topDeep = deepArbitrages.slice(0, 3);
  if (topDeep.length > 0) {
    strategies.push(`深度套利(${topDeep.length}类): ${topDeep.map(d => d.name).join("、")}`);
  }

  return strategies.length > 0 ? strategies.join(" | ") : "暂无有效套利机会，建议观望";
}

export type MetricModule =
  | "cost"
  | "timeArbitrage"
  | "spaceArbitrage"
  | "entityArbitrage"
  | "capacity"
  | "aiDecision"
  | "execution"
  | "riskControl";

export type CoreMetric = {
  code: string;
  name: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  lastUpdated: number;
};

export type MetricCategory = {
  module: MetricModule;
  name: string;
  metrics: CoreMetric[];
};

export function buildCoreMetrics(input: DeepArbitrageInput & {
  liveHogSpot: number;
  futuresPrice: number;
  cornSpot: number;
  soymealSpot: number;
  inventoryTurnover: number;
  capacityUtilization: number;
  executionRate: number;
  lossRate: number;
}): MetricCategory[] {
  const {
    liveHogSpot,
    futuresPrice,
    cornSpot,
    soymealSpot,
    inventoryTurnover,
    capacityUtilization: capUtil,
    executionRate,
    lossRate,
  } = input;

  const breakEvenPrice = 13.8;
  const storageCostPerMonth = 225;
  const currentInventory = 50000;

  const costModule: MetricCategory = {
    module: "cost",
    name: "基础成本与保本指标",
    metrics: [
      { code: "breakeven_price", name: "即时保本价", value: breakEvenPrice, unit: "¥/kg", status: liveHogSpot < breakEvenPrice ? "critical" : "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "storage_cost_daily", name: "单位日仓储成本", value: storageCostPerMonth / 30, unit: "¥/吨·日", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "capital_cost_daily", name: "单位日资金成本", value: 0.038 / 365 * liveHogSpot, unit: "¥/kg·日", status: "normal", trend: "down", lastUpdated: Date.now() },
    ],
  };

  const timeModule: MetricCategory = {
    module: "timeArbitrage",
    name: "时间套利专项指标",
    metrics: [
      { code: "basis", name: "期现基差", value: futuresPrice - liveHogSpot, unit: "¥/kg", status: Math.abs(futuresPrice - liveHogSpot) > 2 ? "warning" : "normal", trend: futuresPrice > liveHogSpot ? "up" : "down", lastUpdated: Date.now() },
      { code: "holding_return", name: "持有收益率", value: ((futuresPrice - liveHogSpot - storageCostPerMonth * 4 / 1000) / liveHogSpot) * 100, unit: "%", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "avg_inventory_age", name: "平均库龄", value: 45, unit: "天", status: 45 > 90 ? "critical" : 45 > 60 ? "warning" : "normal", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  const spaceModule: MetricCategory = {
    module: "spaceArbitrage",
    name: "空间套利专项指标",
    metrics: [
      { code: "region_spread", name: "区域价差", value: 3.5, unit: "¥/kg", status: 3.5 > 2 ? "normal" : "warning", trend: "stable", lastUpdated: Date.now() },
      { code: "transport_cost_ratio", name: "物流成本占比", value: 28, unit: "%", status: 28 > 35 ? "critical" : 28 > 30 ? "warning" : "normal", trend: "down", lastUpdated: Date.now() },
      { code: "cold_chain_loss", name: "冷链在途损耗率", value: 0.8, unit: "%", status: 0.8 > 1.2 ? "critical" : "normal", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  const entityModule: MetricCategory = {
    module: "entityArbitrage",
    name: "实体套利专项指标",
    metrics: [
      { code: "fresh_profit", name: "鲜销收益", value: 2.8, unit: "¥/kg", status: "normal", trend: "up", lastUpdated: Date.now() },
      { code: "frozen_profit", name: "冻储收益", value: 3.5, unit: "¥/kg", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "processing_profit", name: "深加工收益", value: 5.2, unit: "¥/kg", status: "normal", trend: "up", lastUpdated: Date.now() },
      { code: "processing_ratio", name: "深加工原料满足率", value: 85, unit: "%", status: 85 < 80 ? "critical" : 85 < 90 ? "warning" : "normal", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  const capacityModule: MetricCategory = {
    module: "capacity",
    name: "产能瓶颈与调度指标",
    metrics: [
      { code: "slaughter_util", name: "屠宰产能利用率", value: capUtil, unit: "%", status: capUtil < 70 ? "critical" : capUtil < 85 ? "warning" : "normal", trend: capUtil > 80 ? "up" : "down", lastUpdated: Date.now() },
      { code: "cutting_util", name: "分割产能利用率", value: 65, unit: "%", status: 65 < 70 ? "critical" : "warning", trend: "stable", lastUpdated: Date.now() },
      { code: "storage_util", name: "库容利用率", value: (currentInventory / 80000) * 100, unit: "%", status: currentInventory > 72000 ? "critical" : currentInventory > 64000 ? "warning" : "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "bottleneck_stage", name: "瓶颈环节", value: 0, unit: "分割", status: "warning", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  const aiModule: MetricCategory = {
    module: "aiDecision",
    name: "AI决策与模型效果指标",
    metrics: [
      { code: "price_prediction_acc", name: "价格预测准确率", value: 87, unit: "%", status: 87 < 80 ? "critical" : 87 < 85 ? "warning" : "normal", trend: "up", lastUpdated: Date.now() },
      { code: "ai_vs_manual", name: "AI方案超额收益", value: 12.5, unit: "%", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "decision_latency", name: "决策响应延迟", value: 3.2, unit: "分钟", status: 3.2 > 5 ? "critical" : "normal", trend: "down", lastUpdated: Date.now() },
    ],
  };

  const executionModule: MetricCategory = {
    module: "execution",
    name: "执行效果与闭环指标",
    metrics: [
      { code: "execution_rate", name: "每日储备计划执行率", value: executionRate, unit: "%", status: executionRate < 90 ? "critical" : executionRate < 95 ? "warning" : "normal", trend: "up", lastUpdated: Date.now() },
      { code: "dispatch_auto_rate", name: "自动派单率", value: 96, unit: "%", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "fefo_rate", name: "FEFO出库执行率", value: 98, unit: "%", status: "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "order_complete_rate", name: "工单完成率", value: 94, unit: "%", status: 94 < 90 ? "critical" : "warning", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  const riskModule: MetricCategory = {
    module: "riskControl",
    name: "风险控制指标",
    metrics: [
      { code: "inventory_stagnation", name: "库存积压风险率", value: (currentInventory * 0.08 / currentInventory) * 100, unit: "%", status: 8 > 15 ? "critical" : 8 > 10 ? "warning" : "normal", trend: "stable", lastUpdated: Date.now() },
      { code: "capital_occupancy", name: "资金占用率", value: 62, unit: "%", status: 62 > 80 ? "critical" : 62 > 70 ? "warning" : "normal", trend: "down", lastUpdated: Date.now() },
      { code: "loss_rate", name: "库存损耗率", value: lossRate, unit: "%", status: lossRate > 1.2 ? "critical" : lossRate > 1.0 ? "warning" : "normal", trend: "down", lastUpdated: Date.now() },
      { code: "var_95", name: "风险价值VaR(95%)", value: 2800, unit: "万元", status: "normal", trend: "stable", lastUpdated: Date.now() },
    ],
  };

  return [costModule, timeModule, spaceModule, entityModule, capacityModule, aiModule, executionModule, riskModule];
}
