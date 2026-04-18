import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader, TickerTape } from "@/components/platform/PlatformPrimitives";
import { TimeframeToggle } from "@/components/platform/TimeframeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  MapPinned,
  MoveHorizontal,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { createTrailingViewport, shiftViewport, zoomViewport } from "./porkChartViewport";

type Timeframe = "day" | "week" | "month" | "quarter" | "halfYear" | "year";
type MetricKey = "porkPrice" | "porkCost" | "frozenCost" | "frozenPrice" | "storageVolume";
type SortKey = "hogPrice" | "cornPrice" | "soymealPrice" | "hogChange";

const sortOptions: SortKey[] = ["hogPrice", "cornPrice", "soymealPrice", "hogChange"];

export default function PorkPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [selectedPartCode, setSelectedPartCode] = useState("pork_belly");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["porkPrice", "porkCost", "frozenPrice"]);
  const [selectedRegionCode, setSelectedRegionCode] = useState("national");
  const [sortBy, setSortBy] = useState<SortKey>("hogPrice");
  const [viewport, setViewport] = useState(() => createTrailingViewport(18, 10));

  const { data, isLoading } = trpc.platform.porkMarket.useQuery({
    timeframe,
    regionCode: selectedRegionCode,
    sortBy,
  });

  const copy = {
    zh: {
      eyebrow: "Pork Division",
      title: "猪事业部决策中心",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "区域化实时行情、部位经营与库存决策驾驶舱",
      sectionDesc:
        "页面已经接入生猪、玉米、豆粕的实时现货与期货信号，并将其映射到部位价格、成本曲线、库存批次与量化判断中。今日价格固定展示最新现货基准，历史图表则仅随时间区间变化。",
      controlDeck: "经营控制台",
      marketDeck: "区域化市场驾驶舱",
      refreshed: "实时现货/期货与库存决策已联动刷新",
      liveSignalA: "23 部位完整标签",
      liveSignalB: "地域/排序联动",
      liveSignalC: "现货-期货-库存统一计算",
      liveMarketEyebrow: "Live Inputs",
      liveMarketTitle: "生猪、玉米、豆粕实时输入面板",
      liveMarketDesc: "现货与期货信号直接驱动成本、映射价与库存策略。",
      benchmarkEyebrow: "Today Benchmarks",
      benchmarkTitle: "毛猪、白条、冻品与原料今日基准",
      benchmarkDesc: "这里固定显示今日实时价格，不受下方历史区间切换影响。",
      marketDynamics: "Market Dynamics",
      marketTitle: "23 部位与经营指标股票式图表",
      chartHint: "支持多选指标、历史滚动、滚轮缩放与底部区间刷选。时间区间只影响历史曲线，不影响今日价格卡。",
      currentPart: "当前品类",
      todayPrice: "今日现货",
      frozenPrice: "冷冻价格",
      mappedPriceText: "期货映射价",
      predicted: "预计售价",
      metricSelector: "指标选择",
      metricPorkPrice: "猪肉价格",
      metricPorkCost: "猪肉成本",
      metricFrozenCost: "冻肉成本",
      metricFrozenPrice: "冻肉价格",
      metricStorageVolume: "储存量",
      timeRange: "时间区间",
      browseHistory: "历史浏览",
      zoomWindow: "缩放区间",
      viewportHint: "支持股票式拖拽浏览、滚轮缩放与底部 Brush 区间放大。",
      regionFilter: "地域筛选",
      sortBy: "排序方式",
      national: "全国",
      regionRanking: "区域价格排序",
      regionRankingDesc: "用于比较全国各省生猪、玉米和豆粕的今日基准价，并快速切换当前图表的锚点区域。",
      sortHogPrice: "按生猪价格",
      sortCornPrice: "按玉米价格",
      sortSoymealPrice: "按豆粕价格",
      sortHogChange: "按生猪涨跌",
      hogSpot: "生猪现货",
      cornSpot: "玉米现货",
      soymealSpot: "豆粕现货",
      liveHogFutures: "生猪期货",
      cornFutures: "玉米期货",
      soymealFutures: "豆粕期货",
      basis: "Basis Monitor",
      basisTitle: "生猪期货基差图",
      realtime: "实时联动",
      spread: "Spread Monitor",
      spreadTitle: "鲜冻价差图",
      inventorySensitive: "库存敏感",
      aiPanel: "AI Recommendation",
      aiTitle: "AI 决策建议面板",
      aiBoardDesc: "AI 建议下置，先看行情与区域差异，再统一查看批次动作建议与量化依据。",
      formulaHint:
        "量化依据：保本价 = 当前单位成本 + 未来持有总成本；若预计售价 - 保本价 > 阈值，则输出“持有”，否则输出“出售”。实时现货与期货输入会同步影响当前映射价。",
      openEngine: "打开量化套利决策引擎",
      inventory: "库存",
      cost: "成本",
      day: "天",
      concentration: "集中度",
      riskTitle: "库存批次重点",
      spotPrice: "现货",
      mappedPrice: "映射价",
      agePrefix: "库龄",
      moduleEntry: "鸡事业部与饲料事业部入口",
      moduleDesc: "继续保持与猪事业部一致的科技风信息层级。",
      poultryMetric: "白羽肉鸡屠宰量 3.0 亿只",
      feedMetric: "饲料产能 1000 万吨/年",
      loading: "正在同步实时行情与区域数据...",
    },
    en: {
      eyebrow: "Pork Division",
      title: "Pork Decision Center",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "Regional live markets, part operations and inventory decision cockpit",
      sectionDesc:
        "This page now ingests live spot and futures signals for hogs, corn and soybean meal, then maps them into part pricing, cost curves, inventory batches and quantitative actions. Today's price cards stay fixed to the latest benchmark while historical charts only respond to time changes.",
      controlDeck: "Operating Control Deck",
      marketDeck: "Regional Market Cockpit",
      refreshed: "Live spot/futures inputs and inventory decisions refreshed together",
      liveSignalA: "Full 23-part labels",
      liveSignalB: "Region + sort linkage",
      liveSignalC: "Unified spot-futures-inventory math",
      liveMarketEyebrow: "Live Inputs",
      liveMarketTitle: "Live hog, corn and soybean meal input board",
      liveMarketDesc: "Spot and futures signals directly drive cost, mapped price and inventory actions.",
      benchmarkEyebrow: "Today Benchmarks",
      benchmarkTitle: "Today's hog, carcass, frozen and feedstock benchmarks",
      benchmarkDesc: "These cards always show the latest live benchmark and are not affected by the historical interval below.",
      marketDynamics: "Market Dynamics",
      marketTitle: "Stock-style chart for 23 parts and operating metrics",
      chartHint: "Supports multi-metric overlay, panning, wheel zoom and bottom brush selection. Time switching affects the historical chart only, not today's price cards.",
      currentPart: "Current Item",
      todayPrice: "Today Spot",
      frozenPrice: "Frozen",
      mappedPriceText: "Futures mapped",
      predicted: "Expected Sell",
      metricSelector: "Metrics",
      metricPorkPrice: "Pork price",
      metricPorkCost: "Pork cost",
      metricFrozenCost: "Frozen cost",
      metricFrozenPrice: "Frozen price",
      metricStorageVolume: "Storage volume",
      timeRange: "Time Range",
      browseHistory: "History Browse",
      zoomWindow: "Zoom Window",
      viewportHint: "Supports stock-style panning, wheel zooming and bottom brush expansion.",
      regionFilter: "Region",
      sortBy: "Sort By",
      national: "National",
      regionRanking: "Regional price ranking",
      regionRankingDesc: "Compare today's live hog, corn and soybean meal benchmarks by province, then switch the current chart anchor region instantly.",
      sortHogPrice: "By hog price",
      sortCornPrice: "By corn price",
      sortSoymealPrice: "By soymeal price",
      sortHogChange: "By hog move",
      hogSpot: "Live hog spot",
      cornSpot: "Corn spot",
      soymealSpot: "Soymeal spot",
      liveHogFutures: "Live hog futures",
      cornFutures: "Corn futures",
      soymealFutures: "Soymeal futures",
      basis: "Basis Monitor",
      basisTitle: "Live hog futures basis chart",
      realtime: "Real-time linked",
      spread: "Spread Monitor",
      spreadTitle: "Fresh-frozen spread chart",
      inventorySensitive: "Inventory sensitive",
      aiPanel: "AI Recommendation",
      aiTitle: "AI Recommendation Panel",
      aiBoardDesc: "The AI section now sits below the market and region analysis so users can study the market first and review batch actions second.",
      formulaHint:
        "Formula basis: break-even = current unit cost + future holding cost. If expected sell price - break-even exceeds the threshold, output Hold; otherwise output Sell. Live spot and futures inputs immediately update the mapped price.",
      openEngine: "Open Quant Arbitrage Engine",
      inventory: "Inventory",
      cost: "Cost",
      day: "days",
      concentration: "Concentration",
      riskTitle: "Priority inventory batches",
      spotPrice: "Spot",
      mappedPrice: "Mapped",
      agePrefix: "Age",
      moduleEntry: "Poultry and feed module entry",
      moduleDesc: "Keeps the same technology-first visual hierarchy as the pork division.",
      poultryMetric: "Broiler slaughter volume 300 million birds",
      feedMetric: "Feed capacity 10 million tons/year",
      loading: "Syncing live markets and regional data...",
    },
    ja: {
      eyebrow: "Pork Division",
      title: "豚事業部意思決定センター",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "地域別リアルタイム相場・部位運営・在庫判断コックピット",
      sectionDesc:
        "生体豚・トウモロコシ・大豆粕の現物と先物を取り込み、部位価格、コスト曲線、在庫バッチ、定量判断に反映します。本日価格カードは固定表示で、履歴図だけが時間区間に応答します。",
      controlDeck: "運営制御デッキ",
      marketDeck: "地域市場コックピット",
      refreshed: "現物・先物入力と在庫判断を同時更新済み",
      liveSignalA: "23 部位フルラベル",
      liveSignalB: "地域・並び替え連動",
      liveSignalC: "現物・先物・在庫の統一計算",
      liveMarketEyebrow: "Live Inputs",
      liveMarketTitle: "生体豚・トウモロコシ・大豆粕のリアルタイム入力ボード",
      liveMarketDesc: "現物と先物のシグナルがコスト、換算価格、在庫アクションを直接動かします。",
      benchmarkEyebrow: "Today Benchmarks",
      benchmarkTitle: "毛豚・枝肉・冷凍・原料の本日基準",
      benchmarkDesc: "ここは常に当日の最新価格を表示し、下部の履歴区間切替の影響を受けません。",
      marketDynamics: "Market Dynamics",
      marketTitle: "23 部位と経営指標の株式風チャート",
      chartHint: "複数指標、左右移動、ホイールズーム、下部ブラシ選択に対応。時間切替は履歴図のみに作用します。",
      currentPart: "現在品目",
      todayPrice: "本日現物",
      frozenPrice: "冷凍価格",
      mappedPriceText: "先物換算価格",
      predicted: "想定売価",
      metricSelector: "指標",
      metricPorkPrice: "豚肉価格",
      metricPorkCost: "豚肉コスト",
      metricFrozenCost: "冷凍コスト",
      metricFrozenPrice: "冷凍価格",
      metricStorageVolume: "保管量",
      timeRange: "時間区間",
      browseHistory: "履歴閲覧",
      zoomWindow: "ズーム区間",
      viewportHint: "株式チャートのような横移動、ホイール拡縮、下部ブラシ拡大に対応。",
      regionFilter: "地域",
      sortBy: "並び替え",
      national: "全国",
      regionRanking: "地域価格ランキング",
      regionRankingDesc: "省別の生体豚・トウモロコシ・大豆粕の当日価格を比較し、現在のチャート基準地域をすばやく切り替えられます。",
      sortHogPrice: "豚価格順",
      sortCornPrice: "トウモロコシ順",
      sortSoymealPrice: "大豆粕順",
      sortHogChange: "豚騰落順",
      hogSpot: "生体豚現物",
      cornSpot: "トウモロコシ現物",
      soymealSpot: "大豆粕現物",
      liveHogFutures: "生体豚先物",
      cornFutures: "トウモロコシ先物",
      soymealFutures: "大豆粕先物",
      basis: "Basis Monitor",
      basisTitle: "生体豚先物ベーシス図",
      realtime: "リアルタイム連動",
      spread: "Spread Monitor",
      spreadTitle: "生鮮・冷凍スプレッド図",
      inventorySensitive: "在庫感応",
      aiPanel: "AI Recommendation",
      aiTitle: "AI 提案パネル",
      aiBoardDesc: "AI セクションを下段に置き、市場と地域差を見た後でバッチ提案を読む流れに整理しました。",
      formulaHint:
        "定量根拠：損益分岐点 = 現在単位コスト + 将来保有コスト。予想売価 - 損益分岐点が閾値を超えれば保有、それ以外は売却。現物・先物入力は換算価格へ即時反映されます。",
      openEngine: "定量裁定エンジンを開く",
      inventory: "在庫",
      cost: "コスト",
      day: "日",
      concentration: "集中度",
      riskTitle: "重点在庫バッチ",
      spotPrice: "現物",
      mappedPrice: "換算",
      agePrefix: "庫齢",
      moduleEntry: "鶏事業部・飼料事業部入口",
      moduleDesc: "豚事業部と同じテクノロジー重視の情報階層を維持します。",
      poultryMetric: "ブロイラー処理量 3.0 億羽",
      feedMetric: "飼料生産能力 1000 万トン/年",
      loading: "リアルタイム相場と地域データを同期中...",
    },
    th: {
      eyebrow: "Pork Division",
      title: "ศูนย์ตัดสินใจธุรกิจสุกร",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "ค็อกพิตราคาตลาดตามภูมิภาค การบริหารชิ้นส่วน และการตัดสินใจสต็อก",
      sectionDesc:
        "หน้านี้เชื่อมต่อสัญญาณสปอตและฟิวเจอร์สของสุกร ข้าวโพด และกากถั่วเหลือง แล้วนำไปคำนวณราคาแต่ละชิ้นส่วน ต้นทุน สต็อก และคำสั่งเชิงปริมาณ โดยการ์ดราคาวันนี้จะแสดงค่าล่าสุดคงที่ ส่วนกราฟประวัติจะเปลี่ยนตามช่วงเวลาเท่านั้น",
      controlDeck: "เด็คควบคุมการดำเนินงาน",
      marketDeck: "ค็อกพิตตลาดระดับภูมิภาค",
      refreshed: "ข้อมูลสปอต/ฟิวเจอร์สและการตัดสินใจสต็อกอัปเดตร่วมกันแล้ว",
      liveSignalA: "ครบทั้ง 23 ชิ้นส่วน",
      liveSignalB: "เชื่อมโยงภูมิภาคและการจัดเรียง",
      liveSignalC: "คำนวณสปอต-ฟิวเจอร์ส-สต็อกแบบรวม",
      liveMarketEyebrow: "Live Inputs",
      liveMarketTitle: "บอร์ดข้อมูลสดของสุกร ข้าวโพด และกากถั่วเหลือง",
      liveMarketDesc: "สัญญาณสปอตและฟิวเจอร์สขับเคลื่อนต้นทุน ราคาแมป และการตัดสินใจสินค้าคงคลังโดยตรง",
      benchmarkEyebrow: "Today Benchmarks",
      benchmarkTitle: "ฐานราคาวันนี้ของสุกร ซาก สินค้าแช่แข็ง และวัตถุดิบ",
      benchmarkDesc: "ส่วนนี้จะแสดงราคาล่าสุดของวันนี้เสมอ และไม่เปลี่ยนตามช่วงประวัติด้านล่าง",
      marketDynamics: "Market Dynamics",
      marketTitle: "กราฟสไตล์หุ้นสำหรับ 23 ชิ้นส่วนและตัวชี้วัดการดำเนินงาน",
      chartHint: "รองรับหลายตัวชี้วัด การเลื่อนซ้ายขวา การซูมด้วยล้อเมาส์ และการเลือกช่วงด้านล่าง การเปลี่ยนช่วงเวลาจะมีผลเฉพาะกราฟประวัติ",
      currentPart: "รายการปัจจุบัน",
      todayPrice: "สปอตวันนี้",
      frozenPrice: "ราคาแช่แข็ง",
      mappedPriceText: "ราคาแมปจากฟิวเจอร์ส",
      predicted: "ราคาขายคาดการณ์",
      metricSelector: "ตัวชี้วัด",
      metricPorkPrice: "ราคาหมู",
      metricPorkCost: "ต้นทุนหมู",
      metricFrozenCost: "ต้นทุนแช่แข็ง",
      metricFrozenPrice: "ราคาแช่แข็ง",
      metricStorageVolume: "ปริมาณจัดเก็บ",
      timeRange: "ช่วงเวลา",
      browseHistory: "การเลื่อนดูประวัติ",
      zoomWindow: "ช่วงซูม",
      viewportHint: "รองรับการเลื่อนแบบกราฟหุ้น การซูมด้วยล้อเมาส์ และการขยายช่วงด้วยแถบด้านล่าง",
      regionFilter: "ภูมิภาค",
      sortBy: "จัดเรียงตาม",
      national: "ประเทศ",
      regionRanking: "อันดับราคาตามภูมิภาค",
      regionRankingDesc: "ใช้เปรียบเทียบราคาสุกร ข้าวโพด และกากถั่วเหลืองรายจังหวัดของวันนี้ และสลับภูมิภาคอ้างอิงของกราฟได้ทันที",
      sortHogPrice: "ตามราคาสุกร",
      sortCornPrice: "ตามราคาข้าวโพด",
      sortSoymealPrice: "ตามราคากากถั่วเหลือง",
      sortHogChange: "ตามการเปลี่ยนแปลงสุกร",
      hogSpot: "สุกรสปอต",
      cornSpot: "ข้าวโพดสปอต",
      soymealSpot: "กากถั่วเหลืองสปอต",
      liveHogFutures: "ฟิวเจอร์สสุกร",
      cornFutures: "ฟิวเจอร์สข้าวโพด",
      soymealFutures: "ฟิวเจอร์สกากถั่วเหลือง",
      basis: "Basis Monitor",
      basisTitle: "กราฟ Basis ของฟิวเจอร์สสุกร",
      realtime: "เชื่อมโยงแบบเรียลไทม์",
      spread: "Spread Monitor",
      spreadTitle: "กราฟส่วนต่างสด-แช่แข็ง",
      inventorySensitive: "ไวต่อสต็อก",
      aiPanel: "AI Recommendation",
      aiTitle: "แผงคำแนะนำ AI",
      aiBoardDesc: "ย้ายส่วน AI ลงล่างเพื่อให้ผู้ใช้ดูตลาดและความต่างของภูมิภาคก่อน แล้วค่อยอ่านคำแนะนำระดับล็อต",
      formulaHint:
        "สูตรเชิงปริมาณ: จุดคุ้มทุน = ต้นทุนต่อหน่วยปัจจุบัน + ต้นทุนการถือครองในอนาคต หากราคาขายคาดการณ์ - จุดคุ้มทุนเกินเกณฑ์ จะให้ผลลัพธ์เป็นถือ มิฉะนั้นขาย โดยข้อมูลสปอตและฟิวเจอร์สจะอัปเดตราคาแมปทันที",
      openEngine: "เปิดเอนจินอาร์บิทราจเชิงปริมาณ",
      inventory: "สินค้าคงคลัง",
      cost: "ต้นทุน",
      day: "วัน",
      concentration: "ความเข้มข้น",
      riskTitle: "ล็อตสินค้าคงคลังสำคัญ",
      spotPrice: "สปอต",
      mappedPrice: "ราคาแมป",
      agePrefix: "อายุ",
      moduleEntry: "ทางเข้าโมดูลไก่และอาหารสัตว์",
      moduleDesc: "ยังคงลำดับข้อมูลแบบเทคโนโลยีเดียวกับธุรกิจสุกร",
      poultryMetric: "ปริมาณชำแหละไก่เนื้อ 300 ล้านตัว",
      feedMetric: "กำลังการผลิตอาหารสัตว์ 10 ล้านตัน/ปี",
      loading: "กำลังซิงก์ข้อมูลตลาดสดและภูมิภาค...",
    },
  }[language];

  const metricLabels: Record<MetricKey, string> = {
    porkPrice: copy.metricPorkPrice,
    porkCost: copy.metricPorkCost,
    frozenCost: copy.metricFrozenCost,
    frozenPrice: copy.metricFrozenPrice,
    storageVolume: copy.metricStorageVolume,
  };

  const sortLabels: Record<SortKey, string> = {
    hogPrice: copy.sortHogPrice,
    cornPrice: copy.sortCornPrice,
    soymealPrice: copy.sortSoymealPrice,
    hogChange: copy.sortHogChange,
  };

  const metricAppearance: Record<MetricKey, { color: string; axis: "left" | "right" }> = {
    porkPrice: { color: "#38bdf8", axis: "left" },
    porkCost: { color: "#7c88ff", axis: "left" },
    frozenCost: { color: "#b388ff", axis: "left" },
    frozenPrice: { color: "#22d3ee", axis: "left" },
    storageVolume: { color: "#fbbf24", axis: "right" },
  };

  const selectedPart = useMemo(() => data?.allPartQuotes.find(item => item.code === selectedPartCode) ?? data?.allPartQuotes[0], [data, selectedPartCode]);
  const linkedBatch = useMemo(
    () => data?.inventoryBatches.find(item => item.partCode === selectedPart?.code) ?? data?.inventoryBatches[0],
    [data, selectedPart],
  );

  const commoditySpotMap = useMemo(() => {
    return new Map((data?.commodityQuotes.spot ?? []).map(item => [item.code, item] as const));
  }, [data]);

  const commodityFuturesMap = useMemo(() => {
    return new Map((data?.commodityQuotes.futures ?? []).map(item => [item.commodityCode, item] as const));
  }, [data]);

  const tickerItems = useMemo(
    () => [
      ...((data?.commodityQuotes.spot ?? []).map(item => ({ code: item.code, name: item.name, price: item.price, changeRate: item.changeRate }))),
      ...((data?.commodityQuotes.futures ?? []).map(item => ({ code: item.contractCode, name: item.name, price: item.price, changeRate: item.changeRate }))),
      ...((data?.allPartQuotes ?? []).map(item => ({ code: item.code, name: item.name, price: item.spotPrice, changeRate: item.changeRate }))),
    ],
    [data],
  );

  const basisHistory = useMemo(
    () => (data?.basisHistory ?? []).map((value, index) => ({ label: data?.timelineLabels[index] ?? `T${index + 1}`, value })),
    [data],
  );
  const spreadHistory = useMemo(
    () => (data?.freshFrozenSpreadHistory ?? []).map((value, index) => ({ label: data?.timelineLabels[index] ?? `T${index + 1}`, value })),
    [data],
  );

  const stockSeries = useMemo(() => {
    const values = selectedPart?.histories[timeframe] ?? [];
    const labels = data?.timelineLabels ?? [];
    const cornSpot = commoditySpotMap.get("corn_spot")?.price ?? 2380;
    const soymealSpot = commoditySpotMap.get("soymeal_spot")?.price ?? 3120;
    const hogFutureKg = (commodityFuturesMap.get("live_hog_futures")?.price ?? 9800) / 1000;
    const baseCost = linkedBatch?.unitCost ?? 24.5;
    const storageBase = (linkedBatch?.weightKg ?? 12000) / 1000;
    const feedShift = (cornSpot - 2360) / 1000 + (soymealSpot - 3120) / 1400;

    return values.map((value, index) => ({
      label: labels[index] ?? `T${index + 1}`,
      porkPrice: Number(value.toFixed(2)),
      porkCost: Number((baseCost + feedShift * 0.82 + index * 0.03 + Math.sin(index / 1.8) * 0.16).toFixed(2)),
      frozenCost: Number((baseCost + 0.96 + feedShift * 0.64 + index * 0.025 + Math.cos(index / 2.1) * 0.15).toFixed(2)),
      frozenPrice: Number((value + 0.92 + (hogFutureKg - value / 1.95) * 0.08 + Math.sin(index / 2.5) * 0.18).toFixed(2)),
      storageVolume: Number((storageBase - index * 0.16 + Math.cos(index / 2.4) * 0.24).toFixed(2)),
    }));
  }, [commodityFuturesMap, commoditySpotMap, data?.timelineLabels, linkedBatch, selectedPart, timeframe]);

  useEffect(() => {
    setViewport(createTrailingViewport(stockSeries.length, Math.min(14, stockSeries.length || 1)));
  }, [selectedPart?.code, stockSeries.length, timeframe, selectedRegionCode]);

  const visibleSeries = useMemo(
    () => stockSeries.slice(viewport.startIndex, viewport.endIndex + 1),
    [stockSeries, viewport.endIndex, viewport.startIndex],
  );

  const shiftHistory = (offset: number) => {
    setViewport(current => shiftViewport(stockSeries.length, current, offset));
  };

  const zoomHistory = (direction: "in" | "out") => {
    setViewport(current => zoomViewport(stockSeries.length, current, direction, 2));
  };

  const handleBrushChange = (next: { startIndex?: number; endIndex?: number } | null | undefined) => {
    if (next?.startIndex === undefined || next?.endIndex === undefined) {
      return;
    }
    setViewport({ startIndex: next.startIndex, endIndex: next.endIndex });
  };

  const handleChartWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomHistory(event.deltaY < 0 ? "in" : "out");
  };

  const toggleMetric = (metric: MetricKey, checked: boolean | "indeterminate") => {
    const nextChecked = checked === true;
    setSelectedMetrics(current => {
      if (nextChecked) {
        return current.includes(metric) ? current : [...current, metric];
      }
      if (current.length === 1) {
        return current;
      }
      return current.filter(item => item !== metric);
    });
  };

  const liveInputCards = useMemo(() => {
    const translatedName = (code: string) => {
      if (code === "live_hog_spot") return copy.hogSpot;
      if (code === "corn_spot") return copy.cornSpot;
      if (code === "soymeal_spot") return copy.soymealSpot;
      return code;
    };
    const futureTranslatedName = (code: string) => {
      if (code === "live_hog_futures") return copy.liveHogFutures;
      if (code === "corn_futures") return copy.cornFutures;
      if (code === "soymeal_futures") return copy.soymealFutures;
      return code;
    };

    return [
      ...((data?.commodityQuotes.spot ?? []).map(item => ({
        code: item.code,
        title: translatedName(item.code),
        value: item.price,
        unit: item.unit,
        changeRate: item.changeRate,
        suffix: undefined as string | undefined,
      }))),
      ...((data?.commodityQuotes.futures ?? []).map(item => ({
        code: item.commodityCode,
        title: futureTranslatedName(item.commodityCode),
        value: item.price,
        unit: item.unit,
        changeRate: item.changeRate,
        suffix: item.contractCode.toUpperCase(),
      }))),
    ];
  }, [copy, data]);

  if (isLoading && !data) {
    return (
      <PlatformShell eyebrow={copy.eyebrow} title={copy.title}>
        <GlassPanel>
          <div className="py-16 text-center text-slate-300">{copy.loading}</div>
        </GlassPanel>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title}>
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-3">
            <div className="data-chip text-sm">{copy.liveSignalA}</div>
            <div className="data-chip text-sm">{copy.liveSignalB}</div>
            <div className="data-chip text-sm">{copy.liveSignalC}</div>
          </div>
        }
      />

      <GlassPanel className="mb-6 overflow-visible">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.controlDeck}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{copy.marketDeck}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="data-chip text-sm">{copy.refreshed}</div>
            <div className="data-chip text-sm">{data?.selectedRegionName ?? copy.national}</div>
          </div>
        </div>
      </GlassPanel>

      <TickerTape items={tickerItems} />

      <div className="mt-6 space-y-6">
        <GlassPanel>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.liveMarketEyebrow}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{copy.liveMarketTitle}</h3>
            <p className="mt-2 text-sm text-slate-400">{copy.liveMarketDesc}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveInputCards.map(item => (
              <div key={item.code} className="metric-orb rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.suffix ?? "LIVE"}</p>
                  </div>
                  <Badge className={item.changeRate >= 0 ? "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "rounded-full border-rose-400/20 bg-rose-400/10 text-rose-100"}>
                    {item.changeRate >= 0 ? "+" : ""}{item.changeRate.toFixed(2)}%
                  </Badge>
                </div>
                <p className="mt-5 text-3xl font-semibold text-white">{item.unit === "¥/kg" ? "¥" : ""}{item.value.toFixed(2)}</p>
                <p className="mt-2 text-sm text-slate-500">{item.unit}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.benchmarkEyebrow}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{copy.benchmarkTitle}</h3>
            <p className="mt-2 text-sm text-slate-400">{copy.benchmarkDesc}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.benchmarkQuotes ?? []).map(item => (
              <div key={item.code} className="metric-orb rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{language === "zh" ? item.name : item.englishName}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">{copy.todayPrice}</p>
                  </div>
                  <Badge className={item.changeRate >= 0 ? "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "rounded-full border-rose-400/20 bg-rose-400/10 text-rose-100"}>
                    {item.changeRate >= 0 ? "+" : ""}{item.changeRate.toFixed(2)}%
                  </Badge>
                </div>
                <p className="mt-5 text-3xl font-semibold text-white">{item.unit === "¥/kg" ? "¥" : ""}{item.price.toFixed(2)}</p>
                <p className="mt-2 text-sm text-slate-500">{item.unit}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.marketDynamics}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{copy.marketTitle}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-400">
                <span>{copy.regionFilter}</span>
                <select
                  value={selectedRegionCode}
                  onChange={event => setSelectedRegionCode(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                >
                  {(data?.regionOptions ?? [{ code: "national", name: copy.national }]).map(option => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-400">
                <span>{copy.sortBy}</span>
                <select
                  value={sortBy}
                  onChange={event => setSortBy(event.target.value as SortKey)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                >
                  {sortOptions.map(option => (
                    <option key={option} value={option}>
                      {sortLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(data?.allPartQuotes ?? []).map(part => (
              <button
                key={part.code}
                onClick={() => setSelectedPartCode(part.code)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${selectedPartCode === part.code ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`}
              >
                {part.name}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="metric-orb rounded-[20px] p-5">
              <p className="text-sm text-slate-500">{copy.currentPart}</p>
              <h4 className="mt-3 text-3xl font-semibold text-white">{selectedPart?.name}</h4>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">{copy.todayPrice} ¥{selectedPart?.spotPrice.toFixed(2)}</div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">{copy.frozenPrice} ¥{selectedPart?.frozenPrice.toFixed(2)}</div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">{copy.mappedPriceText} ¥{selectedPart?.futuresMappedPrice.toFixed(2)}</div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">{copy.predicted} ¥{selectedPart?.predictedPrice.toFixed(2)}</div>
              </div>
              <Badge className="mt-4 rounded-full border-white/10 bg-white/[0.05] text-slate-200">{selectedPart?.category}</Badge>
            </div>

            <div className="rounded-[20px] border border-white/8 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-3xl text-sm text-slate-400">{copy.chartHint}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {copy.metricSelector}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-[20px] border-white/10 bg-slate-950/95 p-2 text-slate-100">
                    {(Object.keys(metricLabels) as MetricKey[]).map(metric => (
                      <DropdownMenuCheckboxItem
                        key={metric}
                        checked={selectedMetrics.includes(metric)}
                        onCheckedChange={checked => toggleMetric(metric, checked)}
                        className="rounded-xl px-3 py-2 text-sm focus:bg-white/[0.08]"
                      >
                        {metricLabels[metric]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]" onClick={() => shiftHistory(-2)}>
                    <MoveHorizontal className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]" onClick={() => shiftHistory(2)}>
                    <MoveHorizontal className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]" onClick={() => zoomHistory("in")}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]" onClick={() => zoomHistory("out")}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
                <div className="data-chip text-sm">
                  {copy.zoomWindow} {viewport.startIndex + 1}-{viewport.endIndex + 1}
                </div>
              </div>

              <div className="mt-5 h-[360px]" onWheel={handleChartWheel}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleSeries} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} width={54} />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(251,191,36,0.7)" tickLine={false} axisLine={false} width={54} />
                    <Tooltip
                      contentStyle={{ background: "#07111d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                      formatter={(value: number, name: string) => [name === copy.metricStorageVolume ? `${Number(value).toFixed(2)} t` : `¥${Number(value).toFixed(2)}`, name]}
                    />
                    {selectedMetrics.map(metric => (
                      <Line
                        key={metric}
                        yAxisId={metricAppearance[metric].axis}
                        type="monotone"
                        dataKey={metric}
                        name={metricLabels[metric]}
                        stroke={metricAppearance[metric].color}
                        strokeWidth={metric === "porkPrice" ? 2.7 : 2.1}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/8 bg-slate-950/60 p-3">
                <div className="h-[88px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                      <Line type="monotone" dataKey="porkPrice" stroke="#38bdf8" strokeWidth={1.8} dot={false} />
                      <Brush
                        dataKey="label"
                        startIndex={viewport.startIndex}
                        endIndex={viewport.endIndex}
                        onChange={handleBrushChange}
                        height={28}
                        stroke="#38bdf8"
                        travellerWidth={12}
                        fill="rgba(56,189,248,0.08)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  {(Object.keys(metricLabels) as MetricKey[]).map(metric => (
                    <div key={metric} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: metricAppearance[metric].color }} />
                      {metricLabels[metric]}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-500">{copy.timeRange}</span>
                    <TimeframeToggle value={timeframe} onChange={setTimeframe} />
                  </div>
                  <div className="data-chip text-sm">{copy.viewportHint}</div>
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <GlassPanel>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.regionRanking}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{copy.regionRanking}</h3>
                <p className="mt-2 text-sm text-slate-400">{copy.regionRankingDesc}</p>
              </div>
              <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">{sortLabels[sortBy]}</Badge>
            </div>
            <div className="mt-6 grid gap-3">
              {(data?.regionQuotes ?? []).slice(0, 8).map(region => (
                <button
                  key={region.regionCode}
                  onClick={() => setSelectedRegionCode(region.regionCode)}
                  className={`rounded-[20px] border p-4 text-left transition ${selectedRegionCode === region.regionCode ? "border-cyan-400/30 bg-cyan-400/8 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-cyan-400/15 bg-cyan-400/8 text-cyan-100">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{region.regionName}</p>
                        <p className="mt-1 text-xs text-slate-500">{copy.hogSpot} ¥{region.liveHogPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge className={region.liveHogChange >= 0 ? "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "rounded-full border-rose-400/20 bg-rose-400/10 text-rose-100"}>
                      {region.liveHogChange >= 0 ? "+" : ""}{region.liveHogChange.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2">{copy.cornSpot} {region.cornPrice.toFixed(0)}</div>
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2">{copy.soymealSpot} {region.soymealPrice.toFixed(0)}</div>
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2">{copy.sortHogChange} {region.liveHogChange >= 0 ? "+" : ""}{region.liveHogChange.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.basis}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{copy.basisTitle}</h3>
                </div>
                <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">{copy.realtime}</Badge>
              </div>
              <div className="mt-6 rounded-[20px] border border-white/8 bg-slate-950/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={basisHistory}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#07111d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} />
                      <Line type="monotone" dataKey="value" stroke="#7c88ff" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{copy.spread}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{copy.spreadTitle}</h3>
                </div>
                <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">{copy.inventorySensitive}</Badge>
              </div>
              <div className="mt-6 rounded-[20px] border border-white/8 bg-slate-950/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spreadHistory}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#07111d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} />
                      <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        <GlassPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{copy.aiPanel}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{copy.aiTitle}</h3>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">{copy.aiBoardDesc}</p>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {data?.inventoryBatches.map((batch, index) => (
              <div key={batch.batchCode} className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),linear-gradient(180deg,rgba(8,14,24,0.92),rgba(7,12,22,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{batch.partName}</p>
                    <p className="mt-1 text-xs text-slate-500">{batch.batchCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">0{index + 1}</Badge>
                    <Badge className={batch.ageDays > 45 ? "rounded-full border-amber-400/20 bg-amber-400/10 text-amber-100" : "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}>{copy.agePrefix} {batch.ageDays} {copy.day}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">{copy.inventory} {batch.weightKg.toLocaleString()} kg</div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">{copy.cost} ¥{batch.unitCost}/kg</div>
                </div>
                <div className="mt-4 rounded-[18px] border border-cyan-400/10 bg-cyan-400/5 p-3 text-sm leading-6 text-cyan-50/90">{copy.formulaHint}</div>
              </div>
            ))}
          </div>
          <Button onClick={() => setLocation("/quant")} className="mt-5 w-full rounded-2xl bg-[linear-gradient(135deg,#84ebff,#4ed8ff_38%,#86a8ff)] text-slate-950 hover:opacity-95">{copy.openEngine}<ArrowRight className="h-4 w-4" /></Button>
        </GlassPanel>

        <div className="grid gap-6 xl:grid-cols-2">
          <GlassPanel>
            <div className="flex items-center gap-3 text-amber-200"><TriangleAlert className="h-5 w-5" /><h3 className="text-xl font-semibold text-white">{copy.riskTitle}</h3></div>
            <div className="mt-4 space-y-3">
              {data?.inventoryBatches.map(batch => (
                <div key={batch.batchCode} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>{batch.warehouse}</span>
                    <span className="text-cyan-100">{copy.concentration} {batch.concentration}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{copy.spotPrice} ¥{batch.currentSpotPrice.toFixed(2)}</span>
                    <span>{copy.mappedPrice} ¥{batch.futuresMappedPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{copy.moduleEntry}</h3>
                <p className="mt-1 text-sm text-slate-400">{copy.moduleDesc}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { title: language === "zh" ? "鸡事业部" : language === "en" ? "Poultry Division" : language === "ja" ? "鶏事業部" : "ธุรกิจไก่", metric: copy.poultryMetric },
                { title: language === "zh" ? "饲料事业部" : language === "en" ? "Feed Division" : language === "ja" ? "飼料事業部" : "ธุรกิจอาหารสัตว์", metric: copy.feedMetric },
              ].map(item => (
                <div key={item.title} className="metric-orb rounded-[22px] p-4">
                  <p className="text-base font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.metric}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </PlatformShell>
  );
}
