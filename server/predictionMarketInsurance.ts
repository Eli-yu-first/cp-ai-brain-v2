export type InsuranceRiskAppetite = "conservative" | "balanced" | "aggressive";

export interface PredictionMarketInsuranceInput {
  shipmentValueGbp?: number;
  delayDays?: number;
  dailyReroutePenaltyGbp?: number;
  promoLossGbp?: number;
  riskAppetite?: InsuranceRiskAppetite;
  selectedFactorIds?: string[];
}

export interface PredictionMarketPosition {
  id: string;
  category: "chokepoint" | "weather" | "macro" | "freight" | "execution" | "capital";
  title: string;
  market: "Polymarket" | "Kalshi" | "Baltic Exchange" | "ICE" | "Lloyd's" | "Self";
  side: "YES" | "NO" | "CAPITAL" | "FEE";
  ticker: string;
  probabilityPct: number;
  entryPricePct: number;
  stakeGbp: number;
  maxPayoutGbp: number;
  payoutPowerGbp: number;
  expectedValueGbp: number;
  confidencePct: number;
  trigger: string;
  hedgeInstruction: string;
  status: "live" | "live-critical" | "queued" | "covered";
}

export interface PredictionMarketInsuranceResult {
  caseSummary: {
    insuredName: string;
    route: string;
    goods: string;
    shipmentValueGbp: number;
    incoterm: string;
    vessel: string;
    eta: string;
  };
  premium: {
    parametricPremiumGbp: number;
    traditionalPremiumGbp: number;
    premiumReductionPct: number;
    marketHedgeBudgetGbp: number;
    capitalEfficiencyMultiple: number;
  };
  riskPipeline: Array<{
    stage: string;
    status: "done" | "active" | "pending";
    detail: string;
  }>;
  positions: PredictionMarketPosition[];
  payoutLadder: Array<{
    delayDays: number;
    payoutGbp: number;
    triggered: boolean;
    settlementHours: number;
    evidence: string;
  }>;
  portfolio: {
    independentPositions: number;
    highestRiskFactor: string;
    aggregateProbabilityPct: number;
    estimatedWorstLossGbp: number;
    coveredPayoutPowerGbp: number;
    hedgeCoveragePct: number;
    settlementHours: number;
    arbitrageEdgePct: number;
    expectedPlatformSpreadGbp: number;
  };
  comparison: Array<{
    dimension: string;
    traditional: string;
    justInCase: string;
  }>;
  audit: {
    dataSources: string[];
    assumptions: string[];
    feasibility: "可执行" | "需人工复核";
    warning: string;
  };
}

type FactorSeed = Omit<
  PredictionMarketPosition,
  "stakeGbp" | "payoutPowerGbp" | "expectedValueGbp" | "status"
> & {
  weight: number;
};

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function appetiteConfig(appetite: InsuranceRiskAppetite) {
  if (appetite === "conservative") {
    return { budgetRate: 0.028, platformSpread: 0.055, confidenceLift: 5, coverageTarget: 0.9 };
  }
  if (appetite === "aggressive") {
    return { budgetRate: 0.017, platformSpread: 0.075, confidenceLift: -3, coverageTarget: 0.72 };
  }
  return { budgetRate: 0.021, platformSpread: 0.064, confidenceLift: 0, coverageTarget: 0.81 };
}

function buildFactorSeeds(input: Required<Omit<PredictionMarketInsuranceInput, "selectedFactorIds">>): FactorSeed[] {
  const routePenalty = input.dailyReroutePenaltyGbp;
  const promoLoss = input.promoLossGbp;
  const value = input.shipmentValueGbp;

  return [
    {
      id: "bab-el-mandeb",
      category: "chokepoint",
      title: "曼德海峡封闭或胡塞武装攻击",
      market: "Polymarket",
      side: "YES",
      ticker: "HOUTHI-ATTACKS-Q2",
      probabilityPct: 42,
      entryPricePct: 43,
      maxPayoutGbp: round(routePenalty * 2.2 + promoLoss * 0.2),
      confidencePct: 88,
      trigger: "胡塞武装宣布攻击或 UKMTO 确认红海商船事件",
      hedgeInstruction: "买入 YES，覆盖绕行与红海保险附加费上升",
      weight: 1.22,
    },
    {
      id: "suez-closure",
      category: "chokepoint",
      title: "苏伊士运河关闭",
      market: "Polymarket",
      side: "YES",
      ticker: "SUEZ-CANAL-H1-2026",
      probabilityPct: 98.7,
      entryPricePct: 92,
      maxPayoutGbp: round(routePenalty * 3 + promoLoss * 0.18),
      confidencePct: 91,
      trigger: "苏伊士运河 H1 2026 通航量低于合同安全阈值",
      hedgeInstruction: "高概率但低赔率，作为保单参数化触发的稳定锚",
      weight: 1.35,
    },
    {
      id: "cape-reroute",
      category: "freight",
      title: "好望角绕行占比超过 70%",
      market: "Polymarket",
      side: "YES",
      ticker: "CAPE-REROUTE-APR",
      probabilityPct: 82.3,
      entryPricePct: 81,
      maxPayoutGbp: round(routePenalty * 2.4),
      confidencePct: 84,
      trigger: "4 月亚欧航线经好望角比例超过 70%",
      hedgeInstruction: "对冲 £80K/天罚款与远洋燃油消耗增加",
      weight: 1.12,
    },
    {
      id: "atlantic-storm",
      category: "weather",
      title: "大西洋命名风暴提前形成",
      market: "Kalshi",
      side: "YES",
      ticker: "ATLANTIC-STORM-EARLY",
      probabilityPct: 18.4,
      entryPricePct: 19,
      maxPayoutGbp: round(routePenalty * 1.1 + 11_000),
      confidencePct: 79,
      trigger: "5 月 31 日前 NOAA 命名风暴形成",
      hedgeInstruction: "买入低概率高赔率天气尾部风险",
      weight: 0.78,
    },
    {
      id: "malacca-delay",
      category: "chokepoint",
      title: "马六甲海峡延误超过 48 小时",
      market: "Kalshi",
      side: "YES",
      ticker: "MALACCA-DELAY-48H",
      probabilityPct: 10.7,
      entryPricePct: 11,
      maxPayoutGbp: round(routePenalty * 0.7),
      confidencePct: 73,
      trigger: "AIS 轨迹显示商船在马六甲附近滞留 48 小时以上",
      hedgeInstruction: "覆盖亚洲段拥堵对 ETA 的第一跳影响",
      weight: 0.52,
    },
    {
      id: "boe-rate",
      category: "macro",
      title: "英国央行 4 月利率不动",
      market: "Baltic Exchange",
      side: "YES",
      ticker: "BOE-HOLD-APR",
      probabilityPct: 98.4,
      entryPricePct: 96,
      maxPayoutGbp: round(value * 0.018),
      confidencePct: 90,
      trigger: "英国央行公布维持利率不变",
      hedgeInstruction: "对冲 GBP/CNY 与终端进口商付款节奏",
      weight: 0.68,
    },
    {
      id: "wti-spike",
      category: "macro",
      title: "WTI 5 月油价突破 $150",
      market: "ICE",
      side: "YES",
      ticker: "WTI-150-MAY",
      probabilityPct: 50.7,
      entryPricePct: 51,
      maxPayoutGbp: round(routePenalty * 0.9),
      confidencePct: 76,
      trigger: "ICE WTI 期货盘中或结算价触及 $150",
      hedgeInstruction: "覆盖燃油附加费与改道航程成本",
      weight: 0.88,
    },
    {
      id: "felixstowe-congestion",
      category: "execution",
      title: "Felixstowe 港口拥堵超过 72 小时",
      market: "Self",
      side: "CAPITAL",
      ticker: "PORTWATCH-FELIX-72H",
      probabilityPct: 33,
      entryPricePct: 34,
      maxPayoutGbp: round(routePenalty * 0.8 + 8_000),
      confidencePct: 82,
      trigger: "AIS 到港排队与港口公告共同确认",
      hedgeInstruction: "平台自留资本池覆盖最后一公里交付违约",
      weight: 0.82,
    },
    {
      id: "ais-arrival",
      category: "execution",
      title: "AIS 预计到港延误超过 10 天",
      market: "Self",
      side: "CAPITAL",
      ticker: "AIS-ETA-LATE-10D",
      probabilityPct: 26,
      entryPricePct: 27,
      maxPayoutGbp: 20_000,
      confidencePct: 86,
      trigger: "Postwatch/AIS ETA 与合同 ETA 偏差超过 10 天",
      hedgeInstruction: "触发第一层参数化赔付，无需人工查勘",
      weight: 0.9,
    },
    {
      id: "lloyds-war-premium",
      category: "capital",
      title: "Lloyd's 战争险费率上调",
      market: "Lloyd's",
      side: "YES",
      ticker: "LLOYDS-WAR-PREMIUM-UP",
      probabilityPct: 67,
      entryPricePct: 65,
      maxPayoutGbp: round(value * 0.022),
      confidencePct: 81,
      trigger: "Lloyd's 市场红海战争险附加费上调",
      hedgeInstruction: "用再保资本吸收承保报价跳升",
      weight: 0.74,
    },
    {
      id: "freight-index",
      category: "freight",
      title: "亚欧冷链运价指数上涨超过 25%",
      market: "Baltic Exchange",
      side: "YES",
      ticker: "REEFER-FBX-EUROPE-25",
      probabilityPct: 58,
      entryPricePct: 59,
      maxPayoutGbp: round(routePenalty * 1.25),
      confidencePct: 80,
      trigger: "FBX/冷链航线指数较投保日上涨超过 25%",
      hedgeInstruction: "覆盖冷藏箱替代航线采购成本",
      weight: 0.92,
    },
    {
      id: "buyer-promo-window",
      category: "execution",
      title: "夏季促销档期错过",
      market: "Self",
      side: "CAPITAL",
      ticker: "COSTCO-LWC-PROMO-LD",
      probabilityPct: 37,
      entryPricePct: 39,
      maxPayoutGbp: promoLoss,
      confidencePct: 84,
      trigger: "Costco/LWC/Wing Yip 档期锁定窗口失效",
      hedgeInstruction: "对应合同 LD 条款与渠道罚款",
      weight: 1.04,
    },
    {
      id: "fx-gbp-cny",
      category: "macro",
      title: "GBP/CNY 汇率逆向波动超过 3%",
      market: "ICE",
      side: "NO",
      ticker: "GBP-CNY-TAIL-HEDGE",
      probabilityPct: 22,
      entryPricePct: 24,
      maxPayoutGbp: round(value * 0.03),
      confidencePct: 72,
      trigger: "货值结算窗口内 GBP/CNY 逆向波动超过 3%",
      hedgeInstruction: "补齐保险赔付与最终人民币回款之间的敞口",
      weight: 0.58,
    },
  ];
}

export function simulatePredictionMarketInsurance(
  input: PredictionMarketInsuranceInput = {},
): PredictionMarketInsuranceResult {
  const normalized = {
    shipmentValueGbp: clamp(input.shipmentValueGbp ?? 482_000, 10_000, 10_000_000),
    delayDays: clamp(input.delayDays ?? 17, 0, 60),
    dailyReroutePenaltyGbp: clamp(input.dailyReroutePenaltyGbp ?? 80_000, 1_000, 500_000),
    promoLossGbp: clamp(input.promoLossGbp ?? 40_000, 1_000, 1_000_000),
    riskAppetite: input.riskAppetite ?? "balanced",
  };
  const config = appetiteConfig(normalized.riskAppetite);
  const selectedIds = new Set(input.selectedFactorIds ?? []);
  const allFactors = buildFactorSeeds(normalized);
  const activeFactors = selectedIds.size
    ? allFactors.filter(factor => selectedIds.has(factor.id))
    : allFactors;
  const factors = activeFactors.length ? activeFactors : allFactors;

  const routeDelayLoss = normalized.dailyReroutePenaltyGbp * Math.min(normalized.delayDays, 5);
  const estimatedWorstLossGbp = round(
    Math.min(
      normalized.shipmentValueGbp + normalized.promoLossGbp,
      routeDelayLoss + normalized.promoLossGbp + normalized.shipmentValueGbp * 0.18,
    ),
  );
  const contributionTotal = factors.reduce(
    (total, factor) => total + factor.probabilityPct * factor.maxPayoutGbp * factor.weight,
    0,
  );
  const baseHedgeBudget = Math.max(10_000, normalized.shipmentValueGbp * config.budgetRate);
  const premiumBase = Math.max(2_000, normalized.promoLossGbp * 0.049);
  const traditionalPremium = round(premiumBase / (1 - 0.52));
  const parametricPremium = round(premiumBase);

  const positions = factors.map<PredictionMarketPosition>(factor => {
    const contribution = factor.probabilityPct * factor.maxPayoutGbp * factor.weight;
    const stake = round(baseHedgeBudget * (contribution / contributionTotal));
    const entryPrice = clamp(factor.entryPricePct, 3, 98);
    const grossPayout = stake / (entryPrice / 100);
    const payoutPower = round(Math.min(factor.maxPayoutGbp, grossPayout));
    const expectedValue = round(payoutPower * (factor.probabilityPct / 100) - stake);
    const confidencePct = clamp(factor.confidencePct + config.confidenceLift, 50, 97);
    const status =
      factor.probabilityPct >= 80
        ? "live-critical"
        : factor.market === "Self"
          ? "covered"
          : factor.probabilityPct >= 30
            ? "live"
            : "queued";

    return {
      ...factor,
      stakeGbp: stake,
      entryPricePct: entryPrice,
      payoutPowerGbp: payoutPower,
      expectedValueGbp: expectedValue,
      confidencePct,
      status,
    };
  });

  const coveredPayoutPowerGbp = round(positions.reduce((total, item) => total + item.payoutPowerGbp, 0));
  const weightedProbability =
    positions.reduce((total, item) => total + item.probabilityPct * item.payoutPowerGbp, 0) /
    Math.max(coveredPayoutPowerGbp, 1);
  const highestRisk = [...positions].sort((a, b) => b.probabilityPct * b.maxPayoutGbp - a.probabilityPct * a.maxPayoutGbp)[0]!;
  const hedgeCoveragePct = clamp(
    (coveredPayoutPowerGbp / Math.max(estimatedWorstLossGbp * config.coverageTarget, 1)) * 100,
    0,
    99,
  );
  const platformSpread = round(baseHedgeBudget * config.platformSpread);

  return {
    caseSummary: {
      insuredName: "青岛啤酒英国运输保险",
      route: "Qingdao, CN → Felixstowe, UK",
      goods: "6 x 40FT reefer · 夏季促销批次",
      shipmentValueGbp: normalized.shipmentValueGbp,
      incoterm: "CIF Felixstowe",
      vessel: "LEC Beverages / 冷链集装箱",
      eta: "2026-05-14",
    },
    premium: {
      parametricPremiumGbp: parametricPremium,
      traditionalPremiumGbp: traditionalPremium,
      premiumReductionPct: round((1 - parametricPremium / traditionalPremium) * 100, 1),
      marketHedgeBudgetGbp: round(baseHedgeBudget),
      capitalEfficiencyMultiple: round(coveredPayoutPowerGbp / Math.max(baseHedgeBudget, 1), 1),
    },
    riskPipeline: [
      { stage: "风险识别", status: "done", detail: "解析合同 LD、ETA、航线、促销档期与货值敞口" },
      { stage: "AI 分析", status: "done", detail: "整合 AIS 到港、地缘政治、天气、宏观与运价指数" },
      { stage: "多市场下注", status: "active", detail: `已拆解 ${positions.length} 个独立头寸并分配下注预算` },
      { stage: "自动赔付", status: "pending", detail: "参数化触发后 72 小时到账，无需人工查勘" },
    ],
    positions,
    payoutLadder: [10, 20, 30].map(days => {
      const payout = days === 10 ? 8_000 : days === 20 ? 20_000 : 40_000;
      return {
        delayDays: days,
        payoutGbp: payout,
        triggered: normalized.delayDays >= days,
        settlementHours: 72,
        evidence:
          days === 10
            ? "AIS ETA 晚于合同 ETA 10 天"
            : days === 20
              ? "承运人通知改道且港口 ETA 超过 20 天"
              : "促销档期失效并触发合同 LD",
      };
    }),
    portfolio: {
      independentPositions: positions.length,
      highestRiskFactor: highestRisk.title,
      aggregateProbabilityPct: round(weightedProbability, 1),
      estimatedWorstLossGbp,
      coveredPayoutPowerGbp,
      hedgeCoveragePct: round(hedgeCoveragePct, 1),
      settlementHours: 72,
      arbitrageEdgePct: round(config.platformSpread * 100, 1),
      expectedPlatformSpreadGbp: platformSpread,
    },
    comparison: [
      { dimension: "承保范围", traditional: "物理损失为主", justInCase: "商业中断、地缘政治、天气、宏观与运价全覆盖" },
      { dimension: "理赔流程", traditional: "人工查勘，30 天以上", justInCase: "参数化触发，72 小时自动到账" },
      { dimension: "精算基础", traditional: "历史统计与除外条款", justInCase: "实时预测市场价格与 AIS 证据" },
      { dimension: "风险处置", traditional: "地缘政治常被拒保", justInCase: "拆成独立头寸并跨市场对冲" },
    ],
    audit: {
      dataSources: [
        "AIS 到港与港口排队数据",
        "Polymarket/Kalshi 概率价格",
        "Baltic/ICE 运价与能源指标",
        "合同 LD、促销档期和 CIF 货值",
      ],
      assumptions: [
        "预测市场价格作为风险概率代理，实际交易需接入合规券商或自营资本池",
        "Self 头寸由平台资本池覆盖，不伪装为公开市场成交",
        "所有自动赔付均依赖可审计外部事件源和合同参数",
      ],
      feasibility: hedgeCoveragePct >= 72 ? "可执行" : "需人工复核",
      warning:
        "预测市场不能替代持牌保险承保能力；上线前需要法务确认司法辖区、KYC/AML、再保安排与市场准入限制。",
    },
  };
}
