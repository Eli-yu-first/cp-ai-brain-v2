import {
  benchmarkQuotes as fallbackBenchmarkQuotes,
  freshFrozenSpreadHistory as fallbackFreshFrozenSpreadHistory,
  calculateDecision,
  getPlatformSnapshot,
  inventoryBatches as baseInventoryBatches,
  partQuotes as basePartQuotes,
  type DecisionScenario,
  type InventoryBatch,
  type PartQuote,
  type Timeframe,
} from "./platformData";

type SpotCard = {
  label: string;
  price: number;
  change: number;
  unit: string;
};

type RegionMeta = {
  code: string;
  name: string;
  path: string;
};

export type RegionQuote = {
  regionCode: string;
  regionName: string;
  liveHogPrice: number;
  liveHogChange: number;
  cornPrice: number;
  cornChange: number;
  soymealPrice: number;
  soymealChange: number;
};

type EastmoneyListItem = {
  p: number;
  sc: number;
  dm: string;
  zde: number;
  zdf: number;
  zjsj: number;
  o: number;
  vol: number;
  ccl: number;
};

export type FuturesQuote = {
  name: string;
  englishName: string;
  commodityCode: "live_hog_futures" | "corn_futures" | "soymeal_futures";
  contractCode: string;
  secid: string;
  price: number;
  changeRate: number;
  changeValue: number;
  previousClose: number;
  open: number;
  volume: number;
  openInterest: number;
  unit: string;
};

type FuturesHistoryPoint = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  amplitude: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

export type MarketSortBy = "hogPrice" | "cornPrice" | "soymealPrice" | "hogChange";

export type PorkMarketSnapshot = ReturnType<typeof getPlatformSnapshot> & {
  selectedRegionCode: string;
  selectedRegionName: string;
  timelineLabels: string[];
  regionOptions: Array<{ code: string; name: string }>;
  regionQuotes: RegionQuote[];
  commodityQuotes: {
    spot: Array<{
      code: string;
      name: string;
      englishName: string;
      price: number;
      changeRate: number;
      unit: string;
    }>;
    futures: FuturesQuote[];
  };
};

const SPOT_BASE_URL = "https://zhujia.zhuwang.com.cn";
const FUTURES_TOKEN = "8163b6a9200dc68c03113094df2db2c7";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const cache = new Map<string, CacheEntry<unknown>>();

function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  const current = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (current && current.expiresAt > now) {
    return current.value;
  }
  const value = loader().catch(error => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

function toNumber(raw: string) {
  const normalized = raw.replace(/,/g, "").replace(/[^0-9.-]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripTags(raw: string) {
  return raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeLiveHogPrice(price: number) {
  return price < 15 ? Number((price * 2).toFixed(2)) : Number(price.toFixed(2));
}

function normalizeLiveHogChange(change: number) {
  return Math.abs(change) < 5 ? Number((change * 2).toFixed(2)) : Number(change.toFixed(2));
}

export function extractSpotCards(html: string) {
  const cards: SpotCard[] = [];
  const panelRegex = /<div class="panel-box">[\s\S]*?<div class="describe-box[^>]*>([\s\S]*?)<span><\/span><\/div>[\s\S]*?<div class="value-box[^>]*">([\d.,-]+)<\/div>[\s\S]*?<div class="increase-box"><span class="[^"]*">([^<]+)<\/span>([^<]+)<\/div>[\s\S]*?<\/div>\s*<\/div>/g;
  let match: RegExpExecArray | null = null;
  while ((match = panelRegex.exec(html)) !== null) {
    const label = stripTags(match[1] ?? "");
    const rawPrice = toNumber(match[2] ?? "0");
    const rawChange = toNumber(match[3] ?? "0");
    const unitSuffix = (match[4] ?? "").trim();
    const isHog = label.includes("生猪");
    cards.push({
      label,
      price: isHog ? normalizeLiveHogPrice(rawPrice) : Number(rawPrice.toFixed(2)),
      change: isHog ? normalizeLiveHogChange(rawChange) : Number(rawChange.toFixed(2)),
      unit: isHog ? "¥/kg" : unitSuffix.includes("吨") ? "¥/ton" : unitSuffix.includes("公斤") ? "¥/kg" : "¥/unit",
    });
  }
  return cards;
}

export function extractProvinceLinks(html: string) {
  const regions: RegionMeta[] = [];
  const seen = new Set<string>();
  const regex = /href="https:\/\/zhujia\.zhuwang\.com\.cn\/pigprice-(\d+)\.shtml">([^<]+)<\/a>/g;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html)) !== null) {
    const code = match[1] ?? "";
    if (!code || seen.has(code)) continue;
    seen.add(code);
    regions.push({
      code,
      name: stripTags(match[2] ?? code),
      path: `/pigprice-${code}.shtml`,
    });
  }
  return regions;
}

export function pickMainContract(list: EastmoneyListItem[], prefix: string) {
  const actualContracts = list.filter(item => new RegExp(`^${prefix}\\d{4}$`, "i").test(item.dm));
  const source = actualContracts.length > 0 ? actualContracts : list;
  return [...source].sort((a, b) => {
    if (b.vol !== a.vol) return b.vol - a.vol;
    if (b.ccl !== a.ccl) return b.ccl - a.ccl;
    return b.p - a.p;
  })[0] ?? null;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      referer: SPOT_BASE_URL,
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json,text/plain,*/*",
      referer: "https://futures.eastmoney.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function getNationalSpotContext() {
  return withCache("national-spot-context", 1000 * 60 * 10, async () => {
    const html = await fetchText(`${SPOT_BASE_URL}/`);
    return {
      cards: extractSpotCards(html),
      regions: extractProvinceLinks(html),
    };
  });
}

function findCard(cards: SpotCard[], includesText: string) {
  return cards.find(card => card.label.includes(includesText));
}

async function getRegionQuotes() {
  return withCache("region-quotes", 1000 * 60 * 10, async () => {
    const context = await getNationalSpotContext();
    const regions = context.regions;
    const regionQuotes = await Promise.all(
      regions.map(async region => {
        try {
          const html = await fetchText(`${SPOT_BASE_URL}${region.path}`);
          const cards = extractSpotCards(html);
          const hog = findCard(cards, "外三元");
          const corn = findCard(cards, "玉米");
          const soymeal = findCard(cards, "豆粕");
          return {
            regionCode: region.code,
            regionName: region.name,
            liveHogPrice: hog?.price ?? 0,
            liveHogChange: hog?.change ?? 0,
            cornPrice: corn?.price ?? 0,
            cornChange: corn?.change ?? 0,
            soymealPrice: soymeal?.price ?? 0,
            soymealChange: soymeal?.change ?? 0,
          } satisfies RegionQuote;
        } catch {
          return null;
        }
      }),
    );

    return regionQuotes.filter((item): item is RegionQuote => Boolean(item && item.liveHogPrice > 0));
  });
}

const futuresConfig = {
  live_hog_futures: {
    name: "生猪期货",
    englishName: "Live Hog Futures",
    segmentMarketId: 21,
    prefix: "lh",
  },
  corn_futures: {
    name: "玉米期货",
    englishName: "Corn Futures",
    segmentMarketId: 1,
    prefix: "c",
  },
  soymeal_futures: {
    name: "豆粕期货",
    englishName: "Soybean Meal Futures",
    segmentMarketId: 4,
    prefix: "m",
  },
} as const;

const fallbackRegionQuotes: RegionQuote[] = [
  { regionCode: "440000", regionName: "广东", liveHogPrice: 14.1, liveHogChange: 0.16, cornPrice: 2410, cornChange: 8, soymealPrice: 3230, soymealChange: -10 },
  { regionCode: "310000", regionName: "上海", liveHogPrice: 13.8, liveHogChange: 0.12, cornPrice: 2390, cornChange: 5, soymealPrice: 3180, soymealChange: -6 },
  { regionCode: "410000", regionName: "河南", liveHogPrice: 9.7, liveHogChange: -0.08, cornPrice: 2360, cornChange: 8, soymealPrice: 3090, soymealChange: 4 },
  { regionCode: "370000", regionName: "山东", liveHogPrice: 10.0, liveHogChange: -0.03, cornPrice: 2375, cornChange: 4, soymealPrice: 3110, soymealChange: 3 },
  { regionCode: "510000", regionName: "四川", liveHogPrice: 9.2, liveHogChange: -0.12, cornPrice: 2420, cornChange: 6, soymealPrice: 3200, soymealChange: 2 },
  { regionCode: "420000", regionName: "湖北", liveHogPrice: 12.1, liveHogChange: 0.06, cornPrice: 2388, cornChange: 3, soymealPrice: 3140, soymealChange: -2 },
];

const fallbackSpotContext = {
  cards: [
    { label: "全国外三元", price: 12.0, change: 0.04, unit: "¥/kg" },
    { label: "全国玉米", price: 2386, change: 12, unit: "¥/ton" },
    { label: "全国豆粕", price: 3115, change: -6, unit: "¥/ton" },
  ],
  regions: fallbackRegionQuotes.map(item => ({
    code: item.regionCode,
    name: item.regionName,
    path: `/pigprice-${item.regionCode}.shtml`,
  })),
};

function buildFallbackFuturesQuote(commodityCode: keyof typeof futuresConfig): FuturesQuote {
  const fallbackByCode: Record<keyof typeof futuresConfig, { contractCode: string; price: number; changeRate: number; changeValue: number }> = {
    live_hog_futures: { contractCode: "lh2609", price: 12600, changeRate: 0.8, changeValue: 100 },
    corn_futures: { contractCode: "c2609", price: 2390, changeRate: 0.2, changeValue: 5 },
    soymeal_futures: { contractCode: "m2609", price: 3120, changeRate: -0.16, changeValue: -5 },
  };
  const config = futuresConfig[commodityCode];
  const fallback = fallbackByCode[commodityCode];
  return {
    name: config.name,
    englishName: config.englishName,
    commodityCode,
    contractCode: fallback.contractCode,
    secid: `${config.segmentMarketId}.${fallback.contractCode}`,
    price: fallback.price,
    changeRate: fallback.changeRate,
    changeValue: fallback.changeValue,
    previousClose: fallback.price - fallback.changeValue,
    open: fallback.price - fallback.changeValue * 0.5,
    volume: 0,
    openInterest: 0,
    unit: "¥/ton",
  };
}

async function settleOrFallback<T>(loader: Promise<T>, fallback: T) {
  try {
    return await loader;
  } catch {
    return fallback;
  }
}

async function fetchFuturesQuote(commodityCode: keyof typeof futuresConfig) {
  return withCache(`futures-quote-${commodityCode}`, 1000 * 60 * 3, async () => {
    const config = futuresConfig[commodityCode];
    const url = `https://futsseapi.eastmoney.com/list/variety/114/${config.segmentMarketId}?orderBy=zdf&sort=desc&pageSize=50&pageIndex=0&token=${FUTURES_TOKEN}&field=zdf,o,zjsj,sc,dm,zsjd,p,zde,vol,ccl`;
    const payload = await fetchJson<{ list?: EastmoneyListItem[] }>(url);
    const selected = pickMainContract(payload.list ?? [], config.prefix);

    if (!selected) {
      throw new Error(`Futures contract not found for ${commodityCode}`);
    }

    return {
      name: config.name,
      englishName: config.englishName,
      commodityCode,
      contractCode: selected.dm,
      secid: `${selected.sc}.${selected.dm}`,
      price: Number(selected.p.toFixed(2)),
      changeRate: Number(selected.zdf.toFixed(2)),
      changeValue: Number(selected.zde.toFixed(2)),
      previousClose: Number(selected.zjsj.toFixed(2)),
      open: Number(selected.o.toFixed(2)),
      volume: selected.vol,
      openInterest: selected.ccl,
      unit: "¥/ton",
    } satisfies FuturesQuote;
  });
}

async function fetchFuturesHistory(commodityCode: keyof typeof futuresConfig, timeframe: Timeframe) {
  const quote = await fetchFuturesQuote(commodityCode);
  return withCache(`futures-history-${commodityCode}-${timeframe}`, 1000 * 60 * 10, async () => {
    const limitByTimeframe: Record<Timeframe, number> = {
      day: 12,
      week: 20,
      month: 40,
      quarter: 80,
      halfYear: 120,
      year: 180,
    };
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${quote.secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58&klt=101&fqt=1&lmt=${limitByTimeframe[timeframe]}&end=20500000`;
    const payload = await fetchJson<{ data?: { klines?: string[] } }>(url);
    return (payload.data?.klines ?? []).map(line => {
      const [date, open, close, high, low, volume, amount, amplitude] = line.split(",");
      return {
        date,
        open: toNumber(open),
        close: toNumber(close),
        high: toNumber(high),
        low: toNumber(low),
        volume: toNumber(volume),
        amount: toNumber(amount),
        amplitude: toNumber(amplitude),
      } satisfies FuturesHistoryPoint;
    });
  });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortRegionQuotes(items: RegionQuote[], sortBy: MarketSortBy) {
  const cloned = [...items];
  cloned.sort((a, b) => {
    if (sortBy === "hogPrice") return b.liveHogPrice - a.liveHogPrice;
    if (sortBy === "cornPrice") return b.cornPrice - a.cornPrice;
    if (sortBy === "soymealPrice") return b.soymealPrice - a.soymealPrice;
    return b.liveHogChange - a.liveHogChange;
  });
  return cloned;
}

function buildDynamicHistory(baseSeries: number[], targetLastValue: number, shift = 0) {
  if (baseSeries.length === 0) return [];
  const baseLastValue = baseSeries[baseSeries.length - 1] ?? targetLastValue;
  const ratio = baseLastValue === 0 ? 1 : targetLastValue / baseLastValue;
  return baseSeries.map(value => Number((value * ratio + shift).toFixed(2)));
}

function buildDynamicPartQuotes(
  liveCarcassPrice: number,
  liveFrozenPrice: number,
  liveHogFuturesKg: number,
  currentRegionShift: number,
  timeframe: Timeframe,
) {
  const fallbackCarcass = fallbackBenchmarkQuotes.find(item => item.code === "carcass")?.price ?? 23.4;
  return basePartQuotes.map(part => {
    const premiumRatio = part.spotPrice / fallbackCarcass;
    const regionShift = currentRegionShift * 0.42;
    const spotPrice = Number((liveCarcassPrice * premiumRatio + regionShift).toFixed(2));
    const frozenGap = part.frozenPrice - part.spotPrice;
    const frozenPrice = Number((spotPrice + frozenGap).toFixed(2));
    const mappedDiff = liveHogFuturesKg - normalizeLiveHogPrice(9.28);
    const futuresMappedPrice = Number((spotPrice + mappedDiff * 0.68 + part.basis * 0.24).toFixed(2));
    const predictedPrice = Number((futuresMappedPrice + Math.max(part.changeRate, 0.4) * 0.28).toFixed(2));
    const updatedHistory = buildDynamicHistory(part.histories[timeframe], spotPrice, regionShift * 0.18);

    return {
      ...part,
      spotPrice,
      frozenPrice,
      futuresMappedPrice,
      predictedPrice,
      sparkline: updatedHistory.slice(-12),
      histories: {
        ...part.histories,
        [timeframe]: updatedHistory,
      },
    } satisfies PartQuote;
  });
}

function buildLiveInventoryBatches(liveParts: PartQuote[]) {
  const partMap = new Map(liveParts.map(item => [item.code, item]));
  return baseInventoryBatches.map(batch => {
    const linked = partMap.get(batch.partCode);
    if (!linked) return batch;
    return {
      ...batch,
      currentSpotPrice: linked.spotPrice,
      futuresMappedPrice: linked.futuresMappedPrice,
      unitCost: Number((batch.unitCost + (linked.spotPrice - batch.currentSpotPrice) * 0.18).toFixed(2)),
    } satisfies InventoryBatch;
  });
}

export async function buildPorkMarketSnapshot(
  timeframe: Timeframe = "month",
  regionCode = "national",
  sortBy: MarketSortBy = "hogPrice",
): Promise<PorkMarketSnapshot> {
  const baseSnapshot = getPlatformSnapshot(timeframe);
  const [spotContext, regionQuotes, liveHogFutures, cornFutures, soymealFutures] = await Promise.all([
    settleOrFallback(getNationalSpotContext(), fallbackSpotContext),
    settleOrFallback(getRegionQuotes(), fallbackRegionQuotes),
    settleOrFallback(fetchFuturesQuote("live_hog_futures"), buildFallbackFuturesQuote("live_hog_futures")),
    settleOrFallback(fetchFuturesQuote("corn_futures"), buildFallbackFuturesQuote("corn_futures")),
    settleOrFallback(fetchFuturesQuote("soymeal_futures"), buildFallbackFuturesQuote("soymeal_futures")),
  ]);
  const { cards } = spotContext;

  const nationalLiveHog = findCard(cards, "外三元");
  const nationalCorn = findCard(cards, "玉米");
  const nationalSoymeal = findCard(cards, "豆粕");

  const selectedRegion =
    regionCode === "national"
      ? null
      : regionQuotes.find(item => item.regionCode === regionCode) ?? null;

  const liveHogSpot = selectedRegion?.liveHogPrice ?? nationalLiveHog?.price ?? 18.56;
  const liveHogChange = selectedRegion?.liveHogChange ?? nationalLiveHog?.change ?? 0;
  const cornSpot = selectedRegion?.cornPrice ?? nationalCorn?.price ?? 2386;
  const cornChange = selectedRegion?.cornChange ?? nationalCorn?.change ?? 0;
  const soymealSpot = selectedRegion?.soymealPrice ?? nationalSoymeal?.price ?? 3115;
  const soymealChange = selectedRegion?.soymealChange ?? nationalSoymeal?.change ?? 0;
  const liveHogFuturesKg = Number((liveHogFutures.price / 1000).toFixed(2));
  const liveCarcassPrice = Number((liveHogSpot * 1.26 + (liveHogFuturesKg - liveHogSpot) * 0.18).toFixed(2));
  const liveFrozenPrice = Number((liveCarcassPrice + 2.18).toFixed(2));
  const regionShift = Number((liveHogSpot - (nationalLiveHog?.price ?? liveHogSpot)).toFixed(2));

  const allPartQuotes = buildDynamicPartQuotes(liveCarcassPrice, liveFrozenPrice, liveHogFuturesKg, regionShift, timeframe);
  const inventoryBatches = buildLiveInventoryBatches(allPartQuotes);

  const hogHistory = await settleOrFallback(fetchFuturesHistory("live_hog_futures", timeframe), [] as FuturesHistoryPoint[]);
  const historyPointCount = allPartQuotes[0]?.histories[timeframe].length ?? 0;
  const alignedHistory = historyPointCount > 0 ? hogHistory.slice(-historyPointCount) : hogHistory;
  const timelineLabels = alignedHistory.length > 0
    ? alignedHistory.map(point => point.date.slice(5))
    : Array.from({ length: historyPointCount || 12 }, (_, index) => `T${index + 1}`);
  const basisHistory = alignedHistory.map(point => Number((point.close / 1000 - liveHogSpot).toFixed(2)));
  const freshFrozenSpreadHistory = alignedHistory.map((point, index) => {
    const representativeSpot = allPartQuotes[index % allPartQuotes.length]?.spotPrice ?? liveCarcassPrice;
    return Number((liveFrozenPrice - representativeSpot + Math.sin(index / 3) * 0.18).toFixed(2));
  });

  const commodityQuotes = {
    spot: [
      {
        code: "live_hog_spot",
        name: "生猪现货",
        englishName: "Live Hog Spot",
        price: Number(liveHogSpot.toFixed(2)),
        changeRate: Number(((liveHogChange / Math.max(liveHogSpot - liveHogChange, 1)) * 100).toFixed(2)),
        unit: "¥/kg",
      },
      {
        code: "corn_spot",
        name: "玉米现货",
        englishName: "Corn Spot",
        price: Number(cornSpot.toFixed(2)),
        changeRate: Number(((cornChange / Math.max(cornSpot - cornChange, 1)) * 100).toFixed(2)),
        unit: "¥/ton",
      },
      {
        code: "soymeal_spot",
        name: "豆粕现货",
        englishName: "Soybean Meal Spot",
        price: Number(soymealSpot.toFixed(2)),
        changeRate: Number(((soymealChange / Math.max(soymealSpot - soymealChange, 1)) * 100).toFixed(2)),
        unit: "¥/ton",
      },
    ],
    futures: [liveHogFutures, cornFutures, soymealFutures],
  };

  return {
    ...baseSnapshot,
    allPartQuotes,
    inventoryBatches,
    benchmarkQuotes: [
      {
        code: "live_hog",
        name: "毛猪",
        englishName: "Live Hog",
        price: Number(liveHogSpot.toFixed(2)),
        changeRate: Number(((liveHogChange / Math.max(liveHogSpot - liveHogChange, 1)) * 100).toFixed(2)),
        unit: "¥/kg",
      },
      {
        code: "carcass",
        name: "白条",
        englishName: "Carcass",
        price: Number(liveCarcassPrice.toFixed(2)),
        changeRate: Number((((liveCarcassPrice - 23.4) / 23.4) * 100).toFixed(2)),
        unit: "¥/kg",
      },
      {
        code: "frozen_stock",
        name: "冷冻",
        englishName: "Frozen Stock",
        price: Number(liveFrozenPrice.toFixed(2)),
        changeRate: Number((((liveFrozenPrice - 26.1) / 26.1) * 100).toFixed(2)),
        unit: "¥/kg",
      },
      {
        code: "corn_spot",
        name: "玉米",
        englishName: "Corn Spot",
        price: Number(cornSpot.toFixed(2)),
        changeRate: Number(((cornChange / Math.max(cornSpot - cornChange, 1)) * 100).toFixed(2)),
        unit: "¥/ton",
      },
      {
        code: "soymeal_spot",
        name: "豆粕",
        englishName: "Soybean Meal Spot",
        price: Number(soymealSpot.toFixed(2)),
        changeRate: Number(((soymealChange / Math.max(soymealSpot - soymealChange, 1)) * 100).toFixed(2)),
        unit: "¥/ton",
      },
      {
        code: "live_hog_futures",
        name: "生猪期货主力",
        englishName: "Live Hog Futures",
        price: Number(liveHogFuturesKg.toFixed(2)),
        changeRate: liveHogFutures.changeRate,
        unit: "¥/kg",
      },
    ],
    basisHistory: basisHistory.length > 0 ? basisHistory : baseSnapshot.basisHistory,
    freshFrozenSpreadHistory:
      freshFrozenSpreadHistory.length > 0 ? freshFrozenSpreadHistory : fallbackFreshFrozenSpreadHistory[timeframe],
    selectedRegionCode: selectedRegion?.regionCode ?? "national",
    selectedRegionName: selectedRegion?.regionName ?? "全国",
    timelineLabels,
    regionOptions: [{ code: "national", name: "全国" }, ...regionQuotes.map(item => ({ code: item.regionCode, name: item.regionName }))],
    regionQuotes: sortRegionQuotes(regionQuotes, sortBy),
    commodityQuotes,
    generatedAt: Date.now(),
  };
}

export async function buildLiveDecisionScenarios(batchCode: string, regionCode = "national") {
  const snapshot = await buildPorkMarketSnapshot("month", regionCode, "hogPrice");
  const batch = snapshot.inventoryBatches.find(item => item.batchCode === batchCode) ?? snapshot.inventoryBatches[0]!;
  const scenarios = [1, 2, 3].map(month => calculateDecision(batch, month as 1 | 2 | 3)) as DecisionScenario[];
  return {
    batch,
    scenarios,
    snapshot,
  };
}
