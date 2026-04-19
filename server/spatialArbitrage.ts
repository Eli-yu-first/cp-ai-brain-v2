export type GeoNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "origin" | "destination";
  basePrice: number; // 基础参考售价或收购价
  capacity?: number; // 产地可处理能力预估数值
};

// 预设一批地理节点（带简化坐标）用于地图与套利计算
const GEO_NODES: GeoNode[] = [
  // 产地，通常是低价区域
  { id: "origin_gx", name: "广西", lat: 23.8, lng: 108.3, type: "origin", basePrice: 9.3, capacity: 6000 },
  { id: "origin_hn", name: "湖南", lat: 27.6, lng: 111.7, type: "origin", basePrice: 9.5, capacity: 5500 },
  { id: "origin_sc", name: "四川", lat: 30.6, lng: 104.0, type: "origin", basePrice: 9.2, capacity: 7000 },
  { id: "origin_hb", name: "河北", lat: 38.0, lng: 114.5, type: "origin", basePrice: 9.8, capacity: 4800 },
  { id: "origin_sd", name: "山东", lat: 36.6, lng: 117.0, type: "origin", basePrice: 10.0, capacity: 8000 },
  { id: "origin_yn", name: "云南", lat: 25.0, lng: 102.7, type: "origin", basePrice: 9.6, capacity: 3500 },
  { id: "origin_cq", name: "重庆", lat: 29.5, lng: 106.5, type: "origin", basePrice: 11.8, capacity: 4000 },
  
  // 目的地
  { id: "dest_gd", name: "广东", lat: 23.1, lng: 113.2, type: "destination", basePrice: 14.1 },
  { id: "dest_sh", name: "上海", lat: 31.2, lng: 121.4, type: "destination", basePrice: 13.8 },
  { id: "dest_zj", name: "浙江", lat: 29.0, lng: 119.5, type: "destination", basePrice: 13.5 },
  { id: "dest_fj", name: "福建", lat: 26.0, lng: 118.0, type: "destination", basePrice: 13.1 },
  { id: "dest_bj", name: "北京", lat: 39.9, lng: 116.4, type: "destination", basePrice: 13.2 },
  { id: "dest_tj", name: "天津", lat: 39.1, lng: 117.2, type: "destination", basePrice: 12.8 },
  { id: "dest_js", name: "江苏", lat: 33.0, lng: 119.7, type: "destination", basePrice: 12.6 },
  { id: "dest_hlj", name: "黑龙江", lat: 46.5, lng: 126.6, type: "destination", basePrice: 9.9 },
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


export function calculateSpatialArbitrage(
  transportCostPerKmPerTon: number,
  minProfitThreshold: number,
  batchSizeTon: number,
  originFilter: string
): SpatialArbitrageResult {
  const routes: ArbitrageRoute[] = [];
  const origins = GEO_NODES.filter(n => n.type === "origin" && (originFilter === "all" || n.id === originFilter || n.name.includes(originFilter)));
  const destinations = GEO_NODES.filter(n => n.type === "destination");

  origins.forEach(origin => {
    destinations.forEach(dest => {
      // 距离计算并略微放大（因为直线距离短于实际公路路程）
      const distance = Math.round(getDistance(origin.lat, origin.lng, dest.lat, dest.lng) * 1.3);
      
      // 运输成本 = 距离 * 吨公里成本 / 1000 （化为元/公斤）
      const transportCost = parseFloat((distance * transportCostPerKmPerTon / 1000).toFixed(2));
      const netProfit = parseFloat((dest.basePrice - origin.basePrice - transportCost).toFixed(2));
      
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
          originPrice: origin.basePrice,
          destPrice: dest.basePrice,
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
