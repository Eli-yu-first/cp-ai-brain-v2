import { PlatformShell } from "@/components/platform/PlatformShell";
import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Lock, Unlock, Layers, MapPin, Route, Sparkles, Warehouse, Factory, TrendingUp, ThermometerSun, Truck, Beef, Wheat, Ham } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

type ChinaGeoFeature = {
  type: string;
  properties: {
    adcode: number;
    name: string;
    center?: [number, number];
    centroid?: [number, number];
    childrenNum?: number;
    level?: string;
    parent?: { adcode: number };
    subFeatureIndex?: number;
    acroutes?: number[];
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
};

type ChinaGeoData = {
  type: string;
  features: ChinaGeoFeature[];
};

const CHINA_GEO_CDN_URL = "https://cdn.jsdelivr.net/npm/d3-geo-map@1.0.0/data/china.geojson";

type MetricKey = "hogPrice" | "cornPrice" | "soymealPrice";
type ScenarioKey = "margin" | "logistics" | "balanced";

const copy = {
  zh: {
    eyebrow: "Pork Geo Intelligence",
    title: "猪事业地图",
    sectionEyebrow: "China Spatial Arbitrage",
    sectionTitle: "中国省域行情地图与空间套利指挥台",
    sectionDesc: "地图把各省生猪、玉米和豆粕信号与仓储节点、跨区套利机会放到同一张图上，帮助业务快速判断调拨、套利与压仓风险。",
    metric: "地图指标",
    scenario: "分析策略",
    hogPrice: "生猪价格",
    cornPrice: "玉米价格",
    soymealPrice: "豆粕价格",
    margin: "利润优先",
    logistics: "物流优先",
    balanced: "平衡调度",
    visibleRegions: "可见省份",
    opportunities: "套利机会",
    highConfidence: "高置信窗口",
    avgMargin: "平均利润指数",
    mapPanel: "中国地图态势",
    mapDesc: "圆点越亮代表套利信号越强，白色仓储方块代表现有库存和冷库节点。",
    warehouseNodes: "仓储节点",
    marketNodes: "省份行情",
    selectedProvince: "当前焦点省份",
    spread: "跨区价差",
    storageLoad: "仓储负载",
    demandHeat: "需求热度",
    slaughterCapacity: "屠宰弹性",
    arbitragePanel: "AI 空间套利机会",
    arbitrageDesc: "系统综合跨区价差、运费惩罚与饲料成本对冲后，筛选出最值得关注的调拨路径。",
    netArbitrage: "净套利",
    estimatedFreight: "预估运费",
    confidence: "置信度",
    reason: "AI 判断",
    warehousePanel: "库存仓储节点",
    warehouseDesc: "现有批次库存会叠加显示在地图上，便于把仓储位置与跨区机会联动查看。",
    unitKg: "kg",
    unitYuanKg: "元/公斤",
    loading: "地图加载中...",
    error: "地图加载失败",
    industryLayers: "产业资产图层",
    selectLayers: "选择图层",
    swine: "养猪场节点",
    poultry: "家禽产业",
    feed: "饲料加工",
    slaughter: "屠宰中心",
  },
  en: {
    eyebrow: "Pork Geo Intelligence",
    title: "Pork Geo Map",
    sectionEyebrow: "China Spatial Arbitrage",
    sectionTitle: "China market map and spatial arbitrage console",
    sectionDesc: "The map combines provincial hog, corn and soybean meal signals with warehouse nodes and cross-region arbitrage routes in one operational view.",
    metric: "Map metric",
    scenario: "Strategy",
    hogPrice: "Hog price",
    cornPrice: "Corn price",
    soymealPrice: "Soymeal price",
    margin: "Margin first",
    logistics: "Logistics first",
    balanced: "Balanced",
    visibleRegions: "Visible regions",
    opportunities: "Opportunities",
    highConfidence: "High confidence",
    avgMargin: "Avg margin index",
    mapPanel: "China spatial view",
    mapDesc: "Brighter dots indicate stronger arbitrage signals, while white squares represent warehouse nodes.",
    warehouseNodes: "Warehouse nodes",
    marketNodes: "Market nodes",
    selectedProvince: "Focused province",
    spread: "Spread",
    storageLoad: "Storage load",
    demandHeat: "Demand heat",
    slaughterCapacity: "Slaughter elasticity",
    arbitragePanel: "AI spatial arbitrage opportunities",
    arbitrageDesc: "The engine ranks the best transfer paths after combining spread, freight penalty and feed-cost hedge effects.",
    netArbitrage: "Net arbitrage",
    estimatedFreight: "Estimated freight",
    confidence: "Confidence",
    reason: "AI rationale",
    warehousePanel: "Warehouse inventory nodes",
    warehouseDesc: "Existing cold-storage batches are rendered on the map so spatial routes can be matched with live inventory.",
    unitKg: "kg",
    unitYuanKg: "yuan/kg",
    loading: "Loading map...",
    error: "Map load failed",
    industryLayers: "Industry Asset Layers",
    selectLayers: "Select Layers",
    swine: "Swine Farms",
    poultry: "Poultry Industry",
    feed: "Feed Processing",
    slaughter: "Slaughter Centers",
  },
  ja: {
    eyebrow: "Pork Geo Intelligence",
    title: "豚事業マップ",
    sectionEyebrow: "China Spatial Arbitrage",
    sectionTitle: "中国省域マーケットマップと空間裁定コンソール",
    sectionDesc: "各省の豚価・トウモロコシ・大豆粕シグナルと倉庫拠点、広域裁定機会を一枚の地図に統合します。",
    metric: "地図指標",
    scenario: "分析戦略",
    hogPrice: "生体豚価格",
    cornPrice: "トウモロコシ価格",
    soymealPrice: "大豆粕価格",
    margin: "利益優先",
    logistics: "物流優先",
    balanced: "バランス",
    visibleRegions: "表示省域",
    opportunities: "裁定機会",
    highConfidence: "高信頼",
    avgMargin: "平均利益指数",
    mapPanel: "中国地図態勢",
    mapDesc: "点が明るいほど裁定シグナルが強く，白い四角は倉庫ノードを示します。",
    warehouseNodes: "倉庫ノード",
    marketNodes: "市場ノード",
    selectedProvince: "注目省域",
    spread: "地域間スプレッド",
    storageLoad: "保管負荷",
    demandHeat: "需要熱度",
    slaughterCapacity: "と畜弾性",
    arbitragePanel: "AI 空間裁定機会",
    arbitrageDesc: "地域差・運賃・飼料ヘッジを総合して注目すべき移送ルートを抽出します。",
    netArbitrage: "純裁定",
    estimatedFreight: "推定運賃",
    confidence: "信頼度",
    reason: "AI 判断",
    warehousePanel: "在庫倉庫ノード",
    warehouseDesc: "既存バッチ在庫を地図へ重ね，在庫位置と広域機会を連動して確認できます。",
    unitKg: "kg",
    unitYuanKg: "元/kg",
    loading: "マップ読み込み中...",
    error: "マップ読み込み失敗",
    industryLayers: "産業資産レイヤー",
    selectLayers: "レイヤー選択",
    swine: "養豚場ノード",
    poultry: "家禽産業",
    feed: "飼料加工",
    slaughter: "と畜センター",
  },
  th: {
    eyebrow: "Pork Geo Intelligence",
    title: "แผนที่ธุรกิจสุกร",
    sectionEyebrow: "China Spatial Arbitrage",
    sectionTitle: "แผนที่ตลาดระดับมณฑลของจีนและคอนโซลวิเคราะห์การทำอาร์บิทราจเชิงพื้นที่",
    sectionDesc: "แผนที่รวมสัญญาณราคาสุกร ข้าวโพด กากถั่วเหลือง กับคลังสินค้าและโอกาสการโยกย้ายข้ามภูมิภาคไว้ในมุมมองเดียว",
    metric: "ตัวชี้วัดแผนที่",
    scenario: "กลยุทธ์",
    hogPrice: "ราคาสุกร",
    cornPrice: "ราคาข้าวโพด",
    soymealPrice: "ราคากากถั่วเหลือง",
    margin: "เน้นกำไร",
    logistics: "เน้นโลจิสติกส์",
    balanced: "สมดุล",
    visibleRegions: "มณฑลที่แสดง",
    opportunities: "โอกาส",
    highConfidence: "ความเชื่อมั่นสูง",
    avgMargin: "ดัชนีกำไรเฉลี่ย",
    mapPanel: "ภาพสถานการณ์บนแผนที่จีน",
    mapDesc: "จุดที่สว่างกว่าหมายถึงสัญญาณอาร์บิทราจที่แรงกว่า ส่วนสี่เหลี่ยมสีขาวคือโหนดคลังสินค้า",
    warehouseNodes: "โหนดคลัง",
    marketNodes: "โหนดตลาด",
    selectedProvince: "มณฑลที่โฟกัส",
    spread: "ส่วนต่างราคา",
    storageLoad: "ภาระคลัง",
    demandHeat: "ความร้อนแรงของอุปสงค์",
    slaughterCapacity: "ความยืดหยุ่นโรงชำแหละ",
    arbitragePanel: "โอกาส AI Spatial Arbitrage",
    arbitrageDesc: "ระบบจัดอันดับเส้นทางย้ายสินค้าที่น่าสนใจที่สุดจากส่วนต่างราคา ค่าขนส่ง และการป้องกันความเสี่ยงด้านอาหารสัตว์",
    netArbitrage: "กำไรสุทธิจากอาร์บิทราจ",
    estimatedFreight: "ค่าขนส่งประมาณการ",
    confidence: "ความเชื่อมั่น",
    reason: "เหตุผลจาก AI",
    warehousePanel: "โหนดคลังสินค้าคงคลัง",
    warehouseDesc: "สต็อกจริงในคลังเย็นจะถูกแสดงทับบนแผนที่เพื่อจับคู่ตำแหน่งสต็อกกับโอกาสเชิงพื้นที่",
    unitKg: "kg",
    unitYuanKg: "หยวน/กก.",
    loading: "กำลังโหลดแผนที่...",
    error: "โหลดแผนที่ล้มเหลว",
    industryLayers: "ชั้นข้อมูลทรัพย์สินอุตสาหกรรม",
    selectLayers: "เลือกชั้นข้อมูล",
    swine: "โหนดฟาร์มสุกร",
    poultry: "อุตสาหกรรมไก่",
    feed: "การแปรรูปอาหารสัตว์",
    slaughter: "ศูนย์การชำแหละ",
  },
};

function getMetricValue(node: {
  liveHogPrice: number;
  cornPrice: number;
  soymealPrice: number;
}, metric: MetricKey) {
  if (metric === "cornPrice") return node.cornPrice;
  if (metric === "soymealPrice") return node.soymealPrice;
  return node.liveHogPrice;
}

const cpAssets = [
  { id: "p1", type: "pig", name: "内蒙古九原养猪场", coords: [109.84, 40.65] },
  { id: "p2", type: "pig", name: "河南驻马店种猪场", coords: [114.02, 32.98] },
  { id: "p3", type: "pig", name: "湖北襄阳正大猪场", coords: [112.14, 32.04] },
  { id: "po1", type: "poultry", name: "吉林榆树肉鸡基地", coords: [126.55, 44.82] },
  { id: "po2", type: "poultry", name: "北京平谷蛋鸡场", coords: [117.1, 40.1] },
  { id: "f1", type: "feed", name: "广东湛江饲料加工厂", coords: [110.39, 21.26] },
  { id: "f2", type: "feed", name: "四川成都饲料车间", coords: [104.06, 30.67] },
  { id: "s1", type: "slaughter", name: "洛阳生猪屠宰中心", coords: [112.45, 34.61] },
  { id: "s2", type: "slaughter", name: "山东青岛肉类加工厂", coords: [120.33, 36.07] },
] as const;

export default function PorkMapPage() {
  const { language } = useLanguage();
  const current = copy[language];
  const [metric, setMetric] = useState<MetricKey>("hogPrice");
  const [scenario, setScenario] = useState<ScenarioKey>("balanced");
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [activeLayers, setActiveLayers] = useState(["pig"]);
  const [chinaGeoData, setChinaGeoData] = useState<ChinaGeoData | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const { data, isLoading: isDataLoading } = trpc.platform.porkMap.useQuery({ metric, scenario });

  useEffect(() => {
    setIsLoading(true);
    fetch(CHINA_GEO_CDN_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch China geo data: ${res.status}`);
        return res.json();
      })
      .then((geoData: ChinaGeoData) => {
        setChinaGeoData(geoData);
        setMapError(null);
      })
      .catch(err => {
        console.error("Failed to load China geo data:", err);
        setMapError(err.message);
        import("@/data/china-geo.json")
          .then(mod => setChinaGeoData(mod.default as ChinaGeoData))
          .catch(() => {});
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const selectedNode = useMemo(() => {
    if (!data?.nodes.length) return null;
    return [...data.nodes].sort((a, b) => b.marginIndex - a.marginIndex)[0] ?? null;
  }, [data]);

  const opportunity = data?.opportunities[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <PlatformShell eyebrow={current.eyebrow} title={current.title} pageId="pork-map">
        <SectionHeader
          eyebrow={current.sectionEyebrow}
          title={current.sectionTitle}
          description={current.sectionDesc}
          aside={
            <div className="flex flex-wrap items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                  {current.visibleRegions} {data?.summary.visibleRegions ?? 0}
                </Badge>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                  {current.opportunities} {data?.summary.opportunityCount ?? 0}
                </Badge>
              </motion.div>
            </div>
          }
        />

        <TechPanel className="mb-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div>
              <motion.div 
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="min-w-[180px]">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.industryLayers}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-2xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] group">
                        <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> {current.selectLayers}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 rounded-xl border-white/10 bg-slate-950/95 text-slate-100">
                      {[
                        { id: "pig", label: current.swine, icon: <Ham className="h-4 w-4" /> },
                        { id: "poultry", label: current.poultry, icon: <span>🐔</span> },
                        { id: "feed", label: current.feed, icon: <Wheat className="h-4 w-4" /> },
                        { id: "slaughter", label: current.slaughter, icon: <Beef className="h-4 w-4" /> }
                      ].map(layer => (
                        <motion.div
                          key={layer.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DropdownMenuCheckboxItem
                            checked={activeLayers.includes(layer.id)}
                            onCheckedChange={(c) => setActiveLayers(prev => c ? [...prev, layer.id] : prev.filter(x => x !== layer.id))}
                            className="rounded-xl px-3 py-2 text-slate-200 focus:bg-cyan-400/12 focus:text-cyan-50 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <span>{layer.icon}</span>
                              {layer.label}
                            </div>
                          </DropdownMenuCheckboxItem>
                        </motion.div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="min-w-[180px]">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.metric}</p>
                  <Select value={metric} onValueChange={value => setMetric(value as MetricKey)}>
                    <SelectTrigger className="rounded-2xl border-white/10 bg-white/[0.04] text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-slate-950/95 text-slate-100">
                      <SelectItem value="hogPrice">{current.hogPrice}</SelectItem>
                      <SelectItem value="cornPrice">{current.cornPrice}</SelectItem>
                      <SelectItem value="soymealPrice">{current.soymealPrice}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[180px]">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.scenario}</p>
                  <Select value={scenario} onValueChange={value => setScenario(value as ScenarioKey)}>
                    <SelectTrigger className="rounded-2xl border-white/10 bg-white/[0.04] text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-slate-950/95 text-slate-100">
                      <SelectItem value="margin">{current.margin}</SelectItem>
                      <SelectItem value="balanced">{current.balanced}</SelectItem>
                      <SelectItem value="logistics">{current.logistics}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              <motion.div 
                className="mt-4 overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[radial-gradient(circle_at_45%_35%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(180deg,rgba(4,12,24,0.98),rgba(7,16,31,0.95))]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{current.mapPanel}</p>
                    <p className="mt-1 text-sm text-slate-400">{current.mapDesc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                      <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                      {current.marketNodes}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMapLocked(!isMapLocked)} 
                      className="h-7 w-7 text-cyan-400 hover:bg-cyan-400/20 transition-all duration-200 hover:scale-110"
                    >
                      {isMapLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                      <Warehouse className="h-3.5 w-3.5 text-white" />
                      {current.warehouseNodes}
                    </span>
                  </div>
                </div>
                <div className="relative h-[420px]" ref={mapRef}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(65,224,255,0.12),transparent_44%)" />
                  
                  {/* Loading animation */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.span 
                            className="text-sm text-slate-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {current.loading}
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Error message */}
                  <AnimatePresence>
                    {mapError && (
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="text-center p-4">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                          >
                            <Sparkles className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                          </motion.div>
                          <span className="text-sm text-rose-400">{current.error}: {mapError}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Map content */}
                  <AnimatePresence>
                    {chinaGeoData && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ComposableMap projection="geoOrthographic" projectionConfig={{ scale: 660, rotate: [-104, -36, 0] }} className="h-full w-full">
                          <ZoomableGroup center={[104, 36]} zoom={1} filterZoomEvent={() => !isMapLocked} filterPanEvent={() => !isMapLocked}>
                            <Geographies geography={chinaGeoData}>
                              {({ geographies }: { geographies: ChinaGeoFeature[] }) =>
                                geographies.map(geo => {
                                  const region = data?.nodes.find(item => item.regionName === geo.properties?.name);
                                  const fill = region
                                    ? region.arbitrageSignal === "机会"
                                      ? "rgba(34,197,94,0.28)"
                                      : region.arbitrageSignal === "关注"
                                        ? "rgba(250,204,21,0.26)"
                                        : "rgba(56,189,248,0.18)"
                                    : "rgba(8,24,45,0.94)";
                                  return (
                                    <motion.g
                                      key={geo.properties?.adcode ?? Math.random()}
                                      whileHover={{ scale: 1.02 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Geography
                                        geography={geo}
                                        className="stroke-[0.4] stroke-cyan-300/25 outline-none cursor-pointer"
                                        style={{
                                          default: { fill, outline: "none", transition: "fill 0.3s ease" },
                                          hover: { fill: "rgba(22,78,99,0.92)", outline: "none", transition: "fill 0.3s ease" },
                                          pressed: { fill: "rgba(22,78,99,0.92)", outline: "none", transition: "fill 0.3s ease" },
                                        }}
                                        onClick={() => region && setSelectedProvince(region.regionCode)}
                                      />
                                    </motion.g>
                                  );
                                })
                              }
                            </Geographies>

                            {/* Province nodes with animations */}
                            {(data?.nodes ?? []).map((node, index) => {
                              const metricValue = getMetricValue(node, metric);
                              const size = node.arbitrageSignal === "机会" ? 10 : node.arbitrageSignal === "关注" ? 8 : 6;
                              const color = node.arbitrageSignal === "机会" ? "#4ade80" : node.arbitrageSignal === "关注" ? "#facc15" : "#38bdf8";
                              return (
                                <motion.g
                                  key={node.regionCode}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.02, duration: 0.5, type: "spring" }}
                                  whileHover={{ scale: 1.1 }}
                                  onClick={() => setSelectedProvince(node.regionCode)}
                                >
                                  <Marker coordinates={node.coordinates}>
                                    <g>
                                      <motion.circle 
                                        r={size + 6} 
                                        fill={color} 
                                        fillOpacity={0.12}
                                        animate={{
                                          r: [size + 6, size + 9, size + 6],
                                          opacity: [0.12, 0.2, 0.12],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          repeatType: "reverse",
                                        }}
                                      />
                                      <motion.circle 
                                        r={size} 
                                        fill={color} 
                                        className="drop-shadow-[0_0_10px_rgba(65,224,255,0.55)]"
                                        animate={{
                                          scale: [1, 1.05, 1],
                                        }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          repeatType: "reverse",
                                        }}
                                      />
                                      <text y={-size - 8} textAnchor="middle" className="fill-slate-200 text-[9px]">
                                        {node.regionName}
                                      </text>
                                      <text y={size + 14} textAnchor="middle" className="fill-slate-400 text-[8px]">
                                        {metricValue.toFixed(2)}
                                      </text>
                                    </g>
                                  </Marker>
                                </motion.g>
                              );
                            })}

                            {/* CP Assets Nodes Overlay */}
                            {cpAssets.filter(a => activeLayers.includes(a.type)).map((asset, i) => {
                              const colorMap: Record<string, string> = { pig: "#fbbf24", poultry: "#e879f9", feed: "#34d399", slaughter: "#f87171" };
                              const color = colorMap[asset.type] ?? "#ffffff";
                              return (
                                <motion.g
                                  key={asset.id}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5, type: "spring" }}
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <Marker coordinates={asset.coords as [number, number]}>
                                    <g>
                                      <circle r={3} fill={color} className="animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                      <circle r={7} fill={color} fillOpacity={0.2} className="animate-ping" style={{ animationDuration: `${2 + (i % 3)}s` }} />
                                      <text y={-8} textAnchor="middle" fill={color} className="text-[7px] font-bold drop-shadow-md">
                                        {asset.name}
                                      </text>
                                    </g>
                                  </Marker>
                                </motion.g>
                              );
                            })}

                            {/* Warehouse nodes */}
                            {(data?.warehouses ?? []).map((item, index) => (
                              <motion.g
                                key={item.batchCode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.03, duration: 0.5 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <Marker coordinates={item.coordinates}>
                                  <g>
                                    <rect x={-4.5} y={-4.5} width={9} height={9} rx={2} fill="#ffffff" fillOpacity={0.88} />
                                    <text y={16} textAnchor="middle" className="fill-slate-300 text-[8px]">
                                      {item.warehouse.replace(/(一号冷库|二号冷库|联储中心)/g, "")}
                                    </text>
                                  </g>
                                </Marker>
                              </motion.g>
                            ))}
                          </ZoomableGroup>
                        </ComposableMap>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Data loading indicator */}
                  <AnimatePresence>
                    {isDataLoading && (
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div 
                          className="h-6 w-6 rounded-full border-2 border-cyan-500 border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              {/* Summary cards */}
              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div 
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-300"
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(6,182,212,0.15)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.highConfidence}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{data?.summary.highOpportunityCount ?? 0}</p>
                </motion.div>
                <motion.div 
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-300"
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(6,182,212,0.15)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.avgMargin}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{data?.summary.avgMarginIndex ?? 0}</p>
                </motion.div>
              </motion.div>

              {/* Selected province details */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.selectedProvince}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{selectedNode.regionName}</h3>
                      </div>
                      <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-200">
                        {selectedNode.arbitrageSignal}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <motion.div 
                        className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 hover:border-cyan-400/30 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {current.spread}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">¥{selectedNode.liveHogPrice.toFixed(2)}</p>
                      </motion.div>
                      <motion.div 
                        className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 hover:border-cyan-400/30 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Warehouse className="h-3.5 w-3.5" />
                          {current.storageLoad}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedNode.coldStorageLoad.toFixed(0)}%</p>
                      </motion.div>
                      <motion.div 
                        className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 hover:border-cyan-400/30 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <ThermometerSun className="h-3.5 w-3.5" />
                          {current.demandHeat}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedNode.demandHeat.toFixed(0)}</p>
                      </motion.div>
                      <motion.div 
                        className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 hover:border-cyan-400/30 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Beef className="h-3.5 w-3.5" />
                          {current.slaughterCapacity}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedNode.slaughterCapacity.toFixed(0)}%</p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arbitrage opportunities */}
              <motion.div 
                className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.arbitragePanel}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{current.arbitragePanel}</h3>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 text-emerald-300" />
                  </motion.div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{current.arbitrageDesc}</p>
                <div className="mt-4 space-y-3">
                  {data?.opportunities.map((item, index) => (
                    <motion.div 
                      key={item.routeId}
                      className="rounded-[20px] border border-white/8 bg-slate-950/45 p-3.5 hover:border-emerald-400/30 hover:bg-emerald-400/[0.05] transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(16,185,129,0.15)" }}
                      onClick={() => setSelectedOpportunity(item.routeId)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-white">
                          <Route className="h-4 w-4 text-cyan-300" />
                          <span className="font-medium">{item.sourceRegionName} → {item.targetRegionName}</span>
                        </div>
                        <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">
                          {current.confidence} {item.confidence}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">{current.netArbitrage}</p>
                          <p className="mt-1 text-base font-semibold text-emerald-300">¥{item.netArbitrage.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" />
                            {current.estimatedFreight}
                          </p>
                          <p className="mt-1 text-base font-semibold text-white">¥{item.estimatedFreight.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{item.reason}</p>
                    </motion.div>
                  ))}
                  {!data?.opportunities?.length && !isDataLoading && (
                    <motion.div 
                      className="rounded-[20px] border border-white/8 bg-slate-950/45 p-4 text-sm text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      No arbitrage routes available.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </TechPanel>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TechPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{current.warehousePanel}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{current.warehousePanel}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{current.warehouseDesc}</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Factory className="h-5 w-5 text-cyan-300" />
              </motion.div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {data?.warehouses.map((item, index) => (
                <motion.div 
                  key={item.batchCode}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(6,182,212,0.1)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.warehouse}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.partName} · {item.batchCode}</p>
                    </div>
                    <Warehouse className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">库存</span>
                      <span className="text-white">{item.weightKg.toLocaleString()} {current.unitKg}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">成本</span>
                      <span className="text-white">¥{item.unitCost.toFixed(2)} / {current.unitYuanKg}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">现货</span>
                      <span className="text-white">¥{item.currentSpotPrice.toFixed(2)} / {current.unitYuanKg}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">期货映射</span>
                      <span className="text-cyan-200">¥{item.futuresMappedPrice.toFixed(2)} / {current.unitYuanKg}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {!data?.warehouses?.length && !isDataLoading && (
                <motion.div 
                  className="col-span-full rounded-[22px] border border-white/8 bg-slate-950/45 p-6 text-center text-sm text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  No warehouse inventory available.
                </motion.div>
              )}
            </div>
          </TechPanel>
        </motion.div>
      </PlatformShell>
    </motion.div>
  );
}