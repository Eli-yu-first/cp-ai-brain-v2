import { partQuotes } from "./platformData";

export type GeoNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "origin" | "destination";
  basePrice: number; // 基础参考售价或收购价
  capacity?: number; // 产地可处理能力预估数值
};

const GEO_NODES: GeoNode[] = [
  { id: "node_bj", name: "北京", lat: 39.9042, lng: 116.4074, type: "destination", basePrice: 13.2 },
  { id: "node_tj", name: "天津", lat: 39.0842, lng: 117.2008, type: "destination", basePrice: 12.8 },
  { id: "node_he", name: "河北", lat: 38.0428, lng: 114.5149, type: "origin", basePrice: 9.8, capacity: 4800 },
  { id: "node_sx", name: "山西", lat: 37.857, lng: 112.5492, type: "origin", basePrice: 10.1, capacity: 3200 },
  { id: "node_nm", name: "内蒙古", lat: 40.8175, lng: 111.7652, type: "origin", basePrice: 9.2, capacity: 5000 },
  { id: "node_ln", name: "辽宁", lat: 41.8057, lng: 123.4315, type: "origin", basePrice: 9.7, capacity: 4500 },
  { id: "node_jl", name: "吉林", lat: 43.8171, lng: 125.3235, type: "origin", basePrice: 9.6, capacity: 3800 },
  { id: "node_hlj", name: "黑龙江", lat: 45.7567, lng: 126.6424, type: "origin", basePrice: 9.4, capacity: 4000 },
  { id: "node_sh", name: "上海", lat: 31.2304, lng: 121.4737, type: "destination", basePrice: 13.8 },
  { id: "node_js", name: "江苏", lat: 32.0603, lng: 118.7969, type: "destination", basePrice: 12.6 },
  { id: "node_zj", name: "浙江", lat: 30.2741, lng: 120.1551, type: "destination", basePrice: 13.5 },
  { id: "node_ah", name: "安徽", lat: 31.8206, lng: 117.2272, type: "origin", basePrice: 11.2, capacity: 5500 },
  { id: "node_fj", name: "福建", lat: 26.0745, lng: 119.2965, type: "destination", basePrice: 13.1 },
  { id: "node_jx", name: "江西", lat: 28.6829, lng: 115.8582, type: "origin", basePrice: 10.5, capacity: 4800 },
  { id: "node_sd", name: "山东", lat: 36.6512, lng: 117.1201, type: "origin", basePrice: 10.0, capacity: 8000 },
  { id: "node_ha", name: "河南", lat: 34.7466, lng: 113.6254, type: "origin", basePrice: 9.7, capacity: 9000 },
  { id: "node_hb", name: "湖北", lat: 30.5931, lng: 114.3054, type: "destination", basePrice: 12.1 },
  { id: "node_hn", name: "湖南", lat: 28.2282, lng: 112.9388, type: "origin", basePrice: 9.5, capacity: 5500 },
  { id: "node_gd", name: "广东", lat: 23.1291, lng: 113.2644, type: "destination", basePrice: 14.1 },
  { id: "node_gx", name: "广西", lat: 22.817, lng: 108.3669, type: "origin", basePrice: 9.3, capacity: 6000 },
  { id: "node_hi", name: "海南", lat: 20.02, lng: 110.3486, type: "destination", basePrice: 14.5 },
  { id: "node_cq", name: "重庆", lat: 29.563, lng: 106.5516, type: "destination", basePrice: 11.8 },
  { id: "node_sc", name: "四川", lat: 30.5728, lng: 104.0665, type: "origin", basePrice: 9.2, capacity: 7000 },
  { id: "node_gz", name: "贵州", lat: 26.5982, lng: 106.7074, type: "origin", basePrice: 10.3, capacity: 3000 },
  { id: "node_yn", name: "云南", lat: 24.8801, lng: 102.8329, type: "origin", basePrice: 9.6, capacity: 3500 },
  { id: "node_xz", name: "西藏", lat: 29.6525, lng: 91.1721, type: "destination", basePrice: 15.0 },
  { id: "node_sn", name: "陕西", lat: 34.3416, lng: 108.9398, type: "origin", basePrice: 10.4, capacity: 4000 },
  { id: "node_gs", name: "甘肃", lat: 36.0611, lng: 103.8343, type: "origin", basePrice: 10.6, capacity: 2500 },
  { id: "node_qh", name: "青海", lat: 36.6171, lng: 101.7782, type: "origin", basePrice: 11.0, capacity: 1500 },
  { id: "node_nx", name: "宁夏", lat: 38.4872, lng: 106.2309, type: "origin", basePrice: 10.2, capacity: 1800 },
  { id: "node_xj", name: "新疆", lat: 43.7928, lng: 87.6177, type: "origin", basePrice: 9.5, capacity: 2000 },
];


export type ArbitrageRoute = {
  originId: string;
  destId: string;
  originName: string;
  destName: string;
  originPrice: number;
  destPrice: number;
  distanceKm: number;
  transportCost: number;
  netProfit: number;
  batchProfit: number;
  decision: string;
  originCoords: [number, number];
  destCoords: [number, number];
};

export type SpatialArbitrageResult = {
  aiStrategyReport: DetailedStrategyReport;

  routes: ArbitrageRoute[];
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
  const p = 0.017453292519943295;    // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}



export type DetailedStrategyReport = {
  marketAnalysis: string;
  corePathways: string[];
  profitPrediction: string;
  recommendedAction: string;
  estimatedReturn: string;
};

export function generateDetailedStrategyReport(routes: ArbitrageRoute[], partName: string): DetailedStrategyReport {
  if (routes.length === 0) {
    return {
      marketAnalysis: "当前全国各地供需相对平衡，或受巨额运费壁垒阻挡，未能发现具有明显操作空间的价格洼地。",
      corePathways: [],
      profitPrediction: "暂无显著盈利空间，盲目跨区可能导致运费亏损。",
      recommendedAction: "保持现有区域内产销平衡，持续监控中原-华南、东北-长三角的核心价差。",
      estimatedReturn: "0 万元"
    };
  }

  const top = routes[0]!;
  const topStr = routes.slice(0, 3).map(r => `${r.originName}→${r.destName}(+${r.netProfit.toFixed(2)}元/kg)`).join('，');
  const totalProfit = routes.slice(0, 5).reduce((sum, r) => sum + r.batchProfit, 0).toFixed(1);
  return {
    marketAnalysis: `针对【${partName}】部位的实时测算显示，${top.originName}及周边产区存在显著的价格低谷（￥${top.originPrice.toFixed(2)}/kg），而${top.destName}等销区终端消费依然旺盛或因供给收缩形成价格高地（￥${top.destPrice.toFixed(2)}/kg）。当前时空维度的极差已突破运费壁垒。`,
    corePathways: routes.slice(0, 3).map(r => `${r.originName} 调往 ${r.destName}：净利预期 +${r.netProfit.toFixed(2)}元/kg`),
    profitPrediction: `若满载执行（基准车次发运），跨区溢价足以覆盖 ${top.distanceKm} 公里的运输磨耗与保险。预计首批调峰铺货可直接兑现 ${top.batchProfit} 万元单次利润。`,
    recommendedAction: `立即启动【${top.originName}】产区紧急冷链收货，锁定【${top.destName}】大宗批发渠道及餐饮供应链，实行点对点极速调拨。`,
    estimatedReturn: `${totalProfit} 万元 (前五条路径合计)`
  };
}

export function calculateSpatialArbitrage(
  transportCostPerKmPerTon: number,
  minProfitThreshold: number,
  batchSizeTon: number,
  originFilter: string,
  partCode: string = "all"
): SpatialArbitrageResult {
  const routes: ArbitrageRoute[] = [];
  const origins = GEO_NODES.filter(n => n.type === "origin" && (originFilter === "all" || n.id === originFilter || n.name.includes(originFilter)));
  const destinations = GEO_NODES.filter(n => n.type === "destination");

  // 获取具体部位的溢价
  const part = partQuotes.find(p => p.code === partCode);
  const premiumRatio = part ? (part.spotPrice / 23.4) : 1; // 假设 23.4 为基准白条价的参考
  const partName = part ? part.name : "生猪/白条通货";

  origins.forEach(origin => {
    destinations.forEach(dest => {
      // 距离计算并略微放大（因为直线距离短于实际公路路程）
      const distance = Math.round(getDistance(origin.lat, origin.lng, dest.lat, dest.lng) * 1.3);
      
      // 运输成本 = 距离 * 吨公里成本 / 1000 （化为元/公斤）
      const transportCost = parseFloat((distance * transportCostPerKmPerTon / 1000).toFixed(2));
      const oPrice = parseFloat((origin.basePrice * premiumRatio).toFixed(2));
      const dPrice = parseFloat((dest.basePrice * premiumRatio).toFixed(2));
      const netProfit = parseFloat((dPrice - oPrice - transportCost).toFixed(2));
      
      if (netProfit >= minProfitThreshold) {
        const batchProfit = parseFloat(((netProfit * 1000 * batchSizeTon) / 10000).toFixed(1)); // 万元
        
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
          destCoords: [dest.lng, dest.lat]
        });
      }
    });
  });

  // 按净利润排个降序
  routes.sort((a, b) => b.netProfit - a.netProfit);

  let bestRouteProfit = 0;
  let bestRouteName = "-";
  let top5TotalProfit = 0;
  let avSpread = 0;

  if (routes.length > 0) {
    bestRouteProfit = routes[0]!.netProfit;
    bestRouteName = `${routes[0]!.originName}→${routes[0]!.destName}`;
    const top5 = routes.slice(0, 5);
    top5TotalProfit = parseFloat((top5.reduce((sum, r) => sum + r.batchProfit, 0)).toFixed(1));
    const allSpread = routes.reduce((sum, r) => sum + (r.destPrice - r.originPrice), 0);
    avSpread = parseFloat((allSpread / routes.length).toFixed(2));
  }
  
  const topStr = routes.slice(0, 3).map(r => `${r.originName}→${r.destName}(+${r.netProfit}元/kg)`).join('，');
  const decisionOverview = routes.length > 0
    ? `AI决策：发现 ${routes.length} 条套利窗口，立即启动跨区调配！优先路由：${topStr}`
    : "AI决策：目前市场供需与运费不匹配，无最优套利路线。";

  return {
    routes,
    aiStrategyReport: generateDetailedStrategyReport(routes, partName),
    totalOpportunities: routes.length,
    bestRouteProfit,
    bestRouteName,
    top5TotalProfit,
    averageSpread: avSpread,
    nodes: GEO_NODES,
    aiDecisionOverview: decisionOverview
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
      risk: ["继续跟踪各地猪价价差表征时间序列", "暂不签发大规模调拨资金申请"]
    };
  }

  const best = routes[0]!;
  const orgNames = Array.from(new Set(routes.slice(0, 3).map(r => r.originName))).join("、");
  const destNames = Array.from(new Set(routes.slice(0, 3).map(r => r.destName))).join("、");

  return {
    purchasing: [
      `立即赴 ${orgNames} 产地锁量，本期主攻目标`,
      `与养殖场签订框架协议，尝试锁定于基准现货价`,
      `优先收购 ${best.originName} 货源，由于价差最大化`,
    ],
    logistics: [
      `申请开通 ${best.originName}→${best.destName} 干线，距离约 ${best.distanceKm}km`,
      `协调20辆生鲜冷链车，争取 48 小时内完成首批发运`,
      `实时追踪运输成本波动，如超出理论运费发生偏离及时干预`
    ],
    sales: [
      `锁定 ${destNames} 等周边高价渠道并与大客户对接`,
      `首批目标售价区间应卡紧 ${best.destPrice - 0.2} 左右尽快出清`,
      `对接商超和餐饮网点大客户源，保障到库后的极速分销运转`
    ],
    risk: [
      `必须严防目的地市场异动，波动超过当前测算阈值建议触发回写熔断`,
      `注意运费成本是否存在隐性抬高并对净利进行摊薄预警`,
      `记录实际发生的结算利润 vs 系统预测偏差`
    ]
  };
}
