import { PlatformShell } from "@/components/platform/PlatformShell";
import { TechPanel, SectionHeader, TickerTape } from "@/components/platform/PlatformPrimitives";
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
import { useTabContext } from "@/contexts/TabContext";
import { trpc } from "@/lib/trpc";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpDown,
  BrainCircuit,
  ChevronDown,
  Filter,
  MapPinned,
  MoveHorizontal,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { createTrailingViewport, shiftViewport, zoomViewport } from "./porkChartViewport";

type Timeframe = "day" | "week" | "month" | "quarter" | "halfYear" | "year";
type MetricKey = "porkPrice" | "porkCost" | "frozenCost" | "frozenPrice" | "storageVolume";
type SortKey = "hogPrice" | "cornPrice" | "soymealPrice" | "hogChange";
type CategoryFilter = "all" | "whole_hog" | "fresh_meat" | "carcass" | "offal" | "frozen";

const sortOptions: SortKey[] = ["hogPrice", "cornPrice", "soymealPrice", "hogChange"];

/* ─── Crosshair tooltip for stock-style chart ─── */
function StockTooltip({ active, payload, label, metricLabels }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="font-mono font-semibold text-white">
              {entry.dataKey === "storageVolume" ? `${Number(entry.value).toFixed(2)} t` : `¥${Number(entry.value).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pulse animation for live refresh ─── */
function PulseIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
    </span>
  );
}

/* ─── Animated metric card with refresh pulse ─── */
function LiveMetricCard({ title, value, unit, changeRate, suffix, delay }: {
  title: string; value: number; unit: string; changeRate: number; suffix?: string; delay: number;
}) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlash(true);
      prevValue.current = value;
      const timer = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-[18px] border p-4 transition-all duration-500 ${
        flash
          ? "border-cyan-400/30 bg-cyan-400/[0.06] shadow-[0_0_20px_rgba(56,189,248,0.1)]"
          : "border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] hover:border-white/[0.1] hover:bg-white/[0.04]"
      }`}
    >
      {/* Shimmer effect on refresh */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-white/90">{title}</p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">{suffix ?? "LIVE"}</p>
        </div>
        <div className="flex items-center gap-2">
          <PulseIndicator />
          <Badge className={changeRate >= 0
            ? "rounded-md border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-300"
            : "rounded-md border-rose-400/15 bg-rose-400/[0.06] px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-300"
          }>
            {changeRate >= 0 ? "+" : ""}{changeRate.toFixed(2)}%
          </Badge>
        </div>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-white">
        {unit === "¥/kg" ? "¥" : ""}{value.toFixed(2)}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{unit}</p>
    </motion.div>
  );
}

export default function PorkPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [selectedPartCode, setSelectedPartCode] = useState("pork_belly");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["porkPrice", "porkCost", "frozenPrice"]);
  const [selectedRegionCode, setSelectedRegionCode] = useState("national");
  const [sortBy, setSortBy] = useState<SortKey>("hogPrice");
  const [viewport, setViewport] = useState(() => createTrailingViewport(18, 10));
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [crosshairX, setCrosshairX] = useState<number | null>(null);
  const marketScrollerRef = useRef<HTMLDivElement | null>(null);

  const { setBadge, activeTabId } = useTabContext();

  const { data, isLoading, dataUpdatedAt } = trpc.platform.porkMarket.useQuery(
    { timeframe, regionCode: selectedRegionCode, sortBy },
    { refetchInterval: 30000 }
  );

  // Trigger badge notification when data refreshes in background tab
  const prevUpdatedAt = useRef(0);
  useEffect(() => {
    if (dataUpdatedAt && prevUpdatedAt.current > 0 && dataUpdatedAt !== prevUpdatedAt.current) {
      if (activeTabId !== "pork") {
        setBadge("pork", true);
      }
    }
    prevUpdatedAt.current = dataUpdatedAt;
  }, [dataUpdatedAt, activeTabId, setBadge]);

  const copy = {
    zh: {
      eyebrow: "Pork Division",
      title: "猪事业部决策中心",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "区域化实时行情、部位经营与库存决策驾驶舱",
      sectionDesc: "页面已经接入生猪、玉米、豆粕的实时现货与期货信号，并将其映射到部位价格、成本曲线、库存批次与量化判断中。今日价格固定展示最新现货基准，历史图表则仅随时间区间变化。",
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
      mergedMarketEyebrow: "Live Benchmarks",
      mergedMarketTitle: "毛猪、白条、冻品、原料与实时输入一体行情带",
      mergedMarketDesc: "把今日基准与实时输入合并为单行行情块，支持自动滚动与手动左右滑动，便于像期货区一样快速扫读关键价格。",
      swipeHint: "自动滚动中，可手动左右滑动查看全部卡片",
      marketDynamics: "Market Dynamics",
      marketTitle: "23 部位与经营指标股票式图表",
      chartHint: "支持多选指标、十字光标、历史滚动、滚轮缩放与底部区间刷选。",
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
      regionRankingDesc: "柱状图对比全国各省生猪、玉米和豆粕的今日基准价。",
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
      formulaHint: "量化依据：保本价 = 当前单位成本 + 未来持有总成本；若预计售价 - 保本价 > 阈值，则输出[持有]，否则输出[出售]。",
      openEngine: "打开量化套利决策引擎",
      openAiDecision: "进入 AI 决策建议面板",
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
      filterAll: "全部",
      filterWholeHog: "毛猪",
      filterFreshMeat: "生肉",
      filterCarcass: "白条",
      filterOffal: "副产品",
      filterFrozen: "冻品",
      searchPlaceholder: "搜索部位...",
      dataFilter: "数据筛选",
      sortAsc: "升序",
      sortDesc: "降序",
      lastUpdate: "最后更新",
      autoRefresh: "自动刷新 30s",
      maShort: "MA5",
      maLong: "MA10",
      volume: "成交量",
    },
    en: {
      eyebrow: "Pork Division",
      title: "Pork Decision Center",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "Regional live markets, part operations and inventory decision cockpit",
      sectionDesc: "This page now ingests live spot and futures signals for hogs, corn and soybean meal, then maps them into part pricing, cost curves, inventory batches and quantitative actions.",
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
      benchmarkTitle: "Today benchmarks for hogs, carcass, frozen and raw materials",
      benchmarkDesc: "These tiles stay fixed to today's latest prices regardless of the history window below.",
      mergedMarketEyebrow: "Live Benchmarks",
      mergedMarketTitle: "Unified market tape for benchmarks and live inputs",
      mergedMarketDesc: "Benchmarks and live inputs now share one scrollable single-row tape so traders can scan prices like a futures board.",
      swipeHint: "Auto-scrolling enabled. You can also drag or swipe horizontally.",
      marketDynamics: "Market Dynamics",
      marketTitle: "Stock-style chart for 23 parts and operating metrics",
      chartHint: "Supports multi-metric overlay, crosshair, panning, wheel zoom and bottom brush selection.",
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
      regionRankingDesc: "Bar chart comparing today's live hog, corn and soybean meal benchmarks by province.",
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
      aiBoardDesc: "The AI section now sits below the market and region analysis so users can study the market first.",
      formulaHint: "Formula basis: break-even = current unit cost + future holding cost. If expected sell price - break-even exceeds the threshold, output Hold; otherwise output Sell.",
      openEngine: "Open Quant Arbitrage Engine",
      openAiDecision: "Open AI Decision Panel",
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
      filterAll: "All",
      filterWholeHog: "Whole Hog",
      filterFreshMeat: "Fresh Meat",
      filterCarcass: "Carcass",
      filterOffal: "Offal",
      filterFrozen: "Frozen",
      searchPlaceholder: "Search parts...",
      dataFilter: "Data Filter",
      sortAsc: "Ascending",
      sortDesc: "Descending",
      lastUpdate: "Last Update",
      autoRefresh: "Auto-refresh 30s",
      maShort: "MA5",
      maLong: "MA10",
      volume: "Volume",
    },
    ja: {
      eyebrow: "Pork Division",
      title: "豚事業部意思決定センター",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "地域別リアルタイム相場・部位運営・在庫判断コックピット",
      sectionDesc: "生体豚・トウモロコシ・大豆粕の現物と先物を取り込み、部位価格、コスト曲線、在庫バッチ、定量判断に反映します。",
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
      chartHint: "複数指標、十字線、左右移動、ホイールズーム、下部ブラシ選択に対応。",
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
      regionRankingDesc: "省別の生体豚・トウモロコシ・大豆粕の当日価格を棒グラフで比較。",
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
      formulaHint: "定量根拠：損益分岐点 = 現在単位コスト + 将来保有コスト。予想売価 - 損益分岐点が閾値を超えれば保有、それ以外は売却。",
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
      filterAll: "すべて",
      filterWholeHog: "毛豚",
      filterFreshMeat: "生肉",
      filterCarcass: "枝肉",
      filterOffal: "副産物",
      filterFrozen: "冷凍品",
      searchPlaceholder: "部位を検索...",
      dataFilter: "データフィルター",
      sortAsc: "昇順",
      sortDesc: "降順",
      lastUpdate: "最終更新",
      autoRefresh: "自動更新 30秒",
      maShort: "MA5",
      maLong: "MA10",
      volume: "出来高",
    },
    th: {
      eyebrow: "Pork Division",
      title: "ศูนย์ตัดสินใจธุรกิจสุกร",
      sectionEyebrow: "Live Market + Quant Engine",
      sectionTitle: "ค็อกพิตราคาตลาดตามภูมิภาค การบริหารชิ้นส่วน และการตัดสินใจสต็อก",
      sectionDesc: "หน้านี้เชื่อมต่อสัญญาณสปอตและฟิวเจอร์สของสุกร ข้าวโพด และกากถั่วเหลือง",
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
      benchmarkDesc: "ส่วนนี้จะแสดงราคาล่าสุดของวันนี้เสมอ",
      marketDynamics: "Market Dynamics",
      marketTitle: "กราฟสไตล์หุ้นสำหรับ 23 ชิ้นส่วนและตัวชี้วัดการดำเนินงาน",
      chartHint: "รองรับหลายตัวชี้วัด เส้นกากบาท การเลื่อน การซูม และการเลือกช่วง",
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
      viewportHint: "รองรับการเลื่อนแบบกราฟหุ้น การซูมด้วยล้อเมาส์ และการขยายช่วง",
      regionFilter: "ภูมิภาค",
      sortBy: "จัดเรียงตาม",
      national: "ประเทศ",
      regionRanking: "อันดับราคาตามภูมิภาค",
      regionRankingDesc: "แผนภูมิแท่งเปรียบเทียบราคาสุกร ข้าวโพด และกากถั่วเหลืองรายจังหวัด",
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
      aiBoardDesc: "ย้ายส่วน AI ลงล่างเพื่อให้ผู้ใช้ดูตลาดก่อน",
      formulaHint: "สูตรเชิงปริมาณ: จุดคุ้มทุน = ต้นทุนต่อหน่วยปัจจุบัน + ต้นทุนการถือครองในอนาคต",
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
      filterAll: "ทั้งหมด",
      filterWholeHog: "สุกรทั้งตัว",
      filterFreshMeat: "เนื้อสด",
      filterCarcass: "ซาก",
      filterOffal: "เครื่องใน",
      filterFrozen: "แช่แข็ง",
      searchPlaceholder: "ค้นหาชิ้นส่วน...",
      dataFilter: "ตัวกรองข้อมูล",
      sortAsc: "น้อยไปมาก",
      sortDesc: "มากไปน้อย",
      lastUpdate: "อัปเดตล่าสุด",
      autoRefresh: "รีเฟรชอัตโนมัติ 30 วินาที",
      maShort: "MA5",
      maLong: "MA10",
      volume: "ปริมาณ",
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

  const categoryLabels: Record<CategoryFilter, string> = {
    all: copy.filterAll,
    whole_hog: copy.filterWholeHog,
    fresh_meat: copy.filterFreshMeat,
    carcass: copy.filterCarcass,
    offal: copy.filterOffal,
    frozen: copy.filterFrozen,
  };

  // Map part codes to categories
  const partCategoryMap = useMemo(() => {
    const map: Record<string, CategoryFilter> = {};
    (data?.allPartQuotes ?? []).forEach(part => {
      const cat = part.category?.toLowerCase() ?? "";
      if (cat.includes("毛猪") || cat.includes("whole") || cat.includes("hog") || part.code.includes("whole")) map[part.code] = "whole_hog";
      else if (cat.includes("白条") || cat.includes("carcass") || part.code.includes("carcass")) map[part.code] = "carcass";
      else if (cat.includes("冻") || cat.includes("frozen") || part.code.includes("frozen")) map[part.code] = "frozen";
      else if (cat.includes("副") || cat.includes("offal") || part.code.includes("offal") || part.code.includes("liver") || part.code.includes("heart") || part.code.includes("intestine") || part.code.includes("stomach") || part.code.includes("ear") || part.code.includes("tongue") || part.code.includes("feet") || part.code.includes("tail") || part.code.includes("head")) map[part.code] = "offal";
      else map[part.code] = "fresh_meat";
    });
    return map;
  }, [data]);

  // Filtered and sorted parts
  const filteredParts = useMemo(() => {
    let parts = data?.allPartQuotes ?? [];
    if (categoryFilter !== "all") {
      parts = parts.filter(p => partCategoryMap[p.code] === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      parts = parts.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }
    if (sortDirection === "asc") {
      parts = [...parts].sort((a, b) => a.spotPrice - b.spotPrice);
    } else {
      parts = [...parts].sort((a, b) => b.spotPrice - a.spotPrice);
    }
    return parts;
  }, [data, categoryFilter, searchQuery, sortDirection, partCategoryMap]);

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

    return values.map((value, index) => {
      const porkPrice = Number(value.toFixed(2));
      const porkCost = Number((baseCost + feedShift * 0.82 + index * 0.03 + Math.sin(index / 1.8) * 0.16).toFixed(2));
      const frozenCost = Number((baseCost + 0.96 + feedShift * 0.64 + index * 0.025 + Math.cos(index / 2.1) * 0.15).toFixed(2));
      const frozenPrice = Number((value + 0.92 + (hogFutureKg - value / 1.95) * 0.08 + Math.sin(index / 2.5) * 0.18).toFixed(2));
      const storageVolume = Number((storageBase - index * 0.16 + Math.cos(index / 2.4) * 0.24).toFixed(2));
      // Simulated volume (trading activity)
      const volume = Number((Math.abs(Math.sin(index * 0.7)) * 500 + 200 + Math.random() * 100).toFixed(0));
      return { label: labels[index] ?? `T${index + 1}`, porkPrice, porkCost, frozenCost, frozenPrice, storageVolume, volume };
    });
  }, [commodityFuturesMap, commoditySpotMap, data?.timelineLabels, linkedBatch, selectedPart, timeframe]);

  // MA calculations for stock-style chart
  const stockSeriesWithMA = useMemo(() => {
    return stockSeries.map((item, index) => {
      const ma5 = index >= 4 ? Number((stockSeries.slice(index - 4, index + 1).reduce((s, d) => s + d.porkPrice, 0) / 5).toFixed(2)) : undefined;
      const ma10 = index >= 9 ? Number((stockSeries.slice(index - 9, index + 1).reduce((s, d) => s + d.porkPrice, 0) / 10).toFixed(2)) : undefined;
      return { ...item, ma5, ma10 };
    });
  }, [stockSeries]);

  useEffect(() => {
    setViewport(createTrailingViewport(stockSeries.length, Math.min(14, stockSeries.length || 1)));
  }, [selectedPart?.code, stockSeries.length, timeframe, selectedRegionCode]);

  const visibleSeries = useMemo(
    () => stockSeriesWithMA.slice(viewport.startIndex, viewport.endIndex + 1),
    [stockSeriesWithMA, viewport.endIndex, viewport.startIndex],
  );

  const shiftHistory = (offset: number) => {
    setViewport(current => shiftViewport(stockSeries.length, current, offset));
  };

  const zoomHistory = (direction: "in" | "out") => {
    setViewport(current => zoomViewport(stockSeries.length, current, direction, 2));
  };

  const handleBrushChange = (next: { startIndex?: number; endIndex?: number } | null | undefined) => {
    if (next?.startIndex === undefined || next?.endIndex === undefined) return;
    setViewport({ startIndex: next.startIndex, endIndex: next.endIndex });
  };

  const handleChartWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomHistory(event.deltaY < 0 ? "in" : "out");
  };

  const toggleMetric = (metric: MetricKey, checked: boolean | "indeterminate") => {
    const nextChecked = checked === true;
    setSelectedMetrics(current => {
      if (nextChecked) return current.includes(metric) ? current : [...current, metric];
      if (current.length === 1) return current;
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
        code: item.code, title: translatedName(item.code), value: item.price, unit: item.unit, changeRate: item.changeRate, suffix: undefined as string | undefined,
      }))),
      ...((data?.commodityQuotes.futures ?? []).map(item => ({
        code: item.commodityCode, title: futureTranslatedName(item.commodityCode), value: item.price, unit: item.unit, changeRate: item.changeRate, suffix: item.contractCode.toUpperCase(),
      }))),
    ];
  }, [copy, data]);

  const mergedMarketCards = useMemo(() => {
    const benchmarkCards = (data?.benchmarkQuotes ?? []).map(item => ({
      code: item.code,
      title: language === "zh" ? item.name : item.englishName,
      value: item.price,
      unit: item.unit,
      changeRate: item.changeRate,
      suffix: copy.todayPrice,
    }));

    return [...liveInputCards, ...benchmarkCards];
  }, [copy.todayPrice, data?.benchmarkQuotes, language, liveInputCards]);

  useEffect(() => {
    const node = marketScrollerRef.current;
    if (!node) return;

    let direction = 1;
    const id = window.setInterval(() => {
      const el = marketScrollerRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (el.scrollLeft >= maxScroll - 8) direction = -1;
      if (el.scrollLeft <= 8) direction = 1;
      el.scrollBy({ left: 220 * direction, behavior: "smooth" });
    }, 2600);

    return () => window.clearInterval(id);
  }, [mergedMarketCards.length]);

  // Region bar chart data
  const regionBarData = useMemo(() => {
    const regions = data?.regionQuotes ?? [];
    return regions.slice(0, 10).map(r => ({
      name: r.regionName.slice(0, 3),
      fullName: r.regionName,
      hogPrice: r.liveHogPrice,
      cornPrice: r.cornPrice,
      soymealPrice: r.soymealPrice,
      change: r.liveHogChange,
      regionCode: r.regionCode,
    }));
  }, [data]);

  const lastUpdateTime = useMemo(() => {
    if (!dataUpdatedAt) return "";
    return new Date(dataUpdatedAt).toLocaleTimeString();
  }, [dataUpdatedAt]);

  if (isLoading && !data) {
    return (
      <PlatformShell eyebrow={copy.eyebrow} title={copy.title} pageId="pork">
        <TechPanel>
          <div className="flex items-center justify-center gap-3 py-16">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="text-slate-300">{copy.loading}</span>
          </div>
        </TechPanel>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title} pageId="pork">
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <div className="data-chip text-[11px]">{copy.liveSignalA}</div>
            <div className="data-chip text-[11px]">{copy.liveSignalB}</div>
            <div className="data-chip text-[11px]">{copy.liveSignalC}</div>
          </div>
        }
      />

      {/* Control deck header */}
      <TechPanel className="mb-5 overflow-visible">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.controlDeck}</p>
            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white">{copy.marketDeck}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-lg border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-semibold text-cyan-200/80">{copy.refreshed}</Badge>
            <Badge className="rounded-lg border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-200">{data?.selectedRegionName ?? copy.national}</Badge>
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-2.5 py-1.5 text-[10px] text-emerald-300">
              <PulseIndicator />
              <span>{copy.autoRefresh}</span>
            </div>
            {lastUpdateTime && (
              <span className="text-[10px] text-slate-500">{copy.lastUpdate}: {lastUpdateTime}</span>
            )}
          </div>
        </div>
      </TechPanel>

      <TickerTape items={tickerItems} />

      <div className="mt-5 space-y-5">
        {/* ═══ MERGED LIVE BENCHMARK TAPE ═══ */}
        <TechPanel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.mergedMarketEyebrow}</p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white">{copy.mergedMarketTitle}</h3>
              <p className="mt-1.5 max-w-3xl text-[12px] leading-[1.7] text-slate-400/80">{copy.mergedMarketDesc}</p>
            </div>
            <Badge className="rounded-lg border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-slate-200">{copy.swipeHint}</Badge>
          </div>
          <div
            ref={marketScrollerRef}
            className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {mergedMarketCards.map((item, index) => (
              <div key={`${item.code}-${index}`} className="min-w-[220px] max-w-[220px] flex-none snap-start">
                <LiveMetricCard {...item} delay={index} />
              </div>
            ))}
          </div>
        </TechPanel>

        {/* ═══ STOCK-STYLE CHART ═══ */}
        <TechPanel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.marketDynamics}</p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white">{copy.marketTitle}</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-w-[160px] flex-col gap-1.5 text-[12px] text-slate-400">
                <span>{copy.regionFilter}</span>
                <select
                  value={selectedRegionCode}
                  onChange={e => setSelectedRegionCode(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-[12px] text-white outline-none transition focus:border-cyan-400/40"
                >
                  {(data?.regionOptions ?? [{ code: "national", name: copy.national }]).map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[160px] flex-col gap-1.5 text-[12px] text-slate-400">
                <span>{copy.sortBy}</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-[12px] text-white outline-none transition focus:border-cyan-400/40"
                >
                  {sortOptions.map(opt => (
                    <option key={opt} value={opt}>{sortLabels[opt]}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* ── Category filter + Search bar ── */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(categoryLabels) as CategoryFilter[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                    categoryFilter === cat
                      ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]"
                      : "border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30 w-[180px]"
                />
              </div>
              <button
                onClick={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortDirection === "asc" ? copy.sortAsc : copy.sortDesc}
              </button>
            </div>
          </div>

          {/* ── Part selector tags ── */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {filteredParts.map(part => (
              <button
                key={part.code}
                onClick={() => setSelectedPartCode(part.code)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all ${
                  selectedPartCode === part.code
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]"
                    : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                }`}
              >
                {part.name}
                <span className="ml-1.5 font-mono text-[10px] text-slate-500">¥{part.spotPrice.toFixed(1)}</span>
              </button>
            ))}
          </div>

          {/* ── Chart area: left info + right chart ── */}
          <div className="mt-5 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Left: Current part info */}
            <div className="rounded-[16px] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
              <p className="text-[11px] text-slate-500">{copy.currentPart}</p>
              <h4 className="mt-2 text-2xl font-bold text-white">{selectedPart?.name}</h4>
              <Badge className="mt-2 rounded-md border-white/10 bg-white/[0.05] text-[10px] text-slate-300">{selectedPart?.category}</Badge>
              <div className="mt-4 space-y-2">
                {[
                  { label: copy.todayPrice, value: selectedPart?.spotPrice },
                  { label: copy.frozenPrice, value: selectedPart?.frozenPrice },
                  { label: copy.mappedPriceText, value: selectedPart?.futuresMappedPrice },
                  { label: copy.predicted, value: selectedPart?.predictedPrice },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-mono font-semibold text-white">¥{item.value?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {/* MA legend */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="h-[2px] w-4 rounded-full bg-amber-400" />
                  <span className="text-amber-300/80">{copy.maShort}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="h-[2px] w-4 rounded-full bg-fuchsia-400" />
                  <span className="text-fuchsia-300/80">{copy.maLong}</span>
                </div>
              </div>
            </div>

            {/* Right: Stock-style chart */}
            <div className="rounded-[16px] border border-white/[0.06] bg-slate-950/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">{copy.chartHint}</p>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.04] text-[11px] text-slate-200 hover:bg-white/[0.08]">
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                        {copy.metricSelector}
                        <ChevronDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 bg-slate-950/95 p-1.5 text-slate-100">
                      {(Object.keys(metricLabels) as MetricKey[]).map(metric => (
                        <DropdownMenuCheckboxItem
                          key={metric}
                          checked={selectedMetrics.includes(metric)}
                          onCheckedChange={checked => toggleMetric(metric, checked)}
                          className="rounded-lg px-3 py-2 text-[12px] focus:bg-white/[0.08]"
                        >
                          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: metricAppearance[metric].color }} />
                          {metricLabels[metric]}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Chart controls */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" onClick={() => shiftHistory(-2)}>
                    <MoveHorizontal className="h-3.5 w-3.5 rotate-180" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" onClick={() => shiftHistory(2)}>
                    <MoveHorizontal className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" onClick={() => zoomHistory("in")}>
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" onClick={() => zoomHistory("out")}>
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400">
                    {copy.zoomWindow} {viewport.startIndex + 1}-{viewport.endIndex + 1}
                  </span>
                </div>
              </div>

              {/* Main price chart with MA lines */}
              <div className="mt-3 h-[320px]" onWheel={handleChartWheel}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleSeries} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} width={50} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(251,191,36,0.5)" tickLine={false} axisLine={false} width={50} tick={{ fontSize: 10 }} />
                    <Tooltip content={<StockTooltip metricLabels={metricLabels} />} />
                    <ReferenceLine yAxisId="left" y={selectedPart?.spotPrice} stroke="rgba(56,189,248,0.3)" strokeDasharray="4 4" />
                    {selectedMetrics.map(metric => (
                      <Line
                        key={metric}
                        yAxisId={metricAppearance[metric].axis}
                        type="monotone"
                        dataKey={metric}
                        name={metricLabels[metric]}
                        stroke={metricAppearance[metric].color}
                        strokeWidth={metric === "porkPrice" ? 2.5 : 1.8}
                        dot={false}
                        activeDot={{ r: 4, stroke: metricAppearance[metric].color, strokeWidth: 2, fill: "#0a1628" }}
                      />
                    ))}
                    {/* MA5 line */}
                    <Line yAxisId="left" type="monotone" dataKey="ma5" name={copy.maShort} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="4 2" dot={false} connectNulls />
                    {/* MA10 line */}
                    <Line yAxisId="left" type="monotone" dataKey="ma10" name={copy.maLong} stroke="#e879f9" strokeWidth={1.2} strokeDasharray="6 3" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Volume sub-chart */}
              <div className="mt-1 h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visibleSeries} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Tooltip content={<StockTooltip metricLabels={metricLabels} />} />
                    <Bar dataKey="volume" name={copy.volume} radius={[2, 2, 0, 0]}>
                      {visibleSeries.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={index > 0 && entry.porkPrice >= visibleSeries[index - 1].porkPrice
                            ? "rgba(52,211,153,0.4)"
                            : "rgba(251,113,133,0.4)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Brush navigator */}
              <div className="mt-1 rounded-xl border border-white/[0.06] bg-slate-950/60 p-2">
                <div className="h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockSeriesWithMA}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                      <Line type="monotone" dataKey="porkPrice" stroke="#38bdf8" strokeWidth={1.2} dot={false} />
                      <Brush
                        dataKey="label"
                        startIndex={viewport.startIndex}
                        endIndex={viewport.endIndex}
                        onChange={handleBrushChange}
                        height={24}
                        stroke="#38bdf8"
                        travellerWidth={10}
                        fill="rgba(56,189,248,0.06)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
               {/* Bottom Chart Actions */}
               <div className="mt-4 flex items-center justify-end">
                 <TimeframeToggle value={timeframe} onChange={setTimeframe} />
               </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {(Object.keys(metricLabels) as MetricKey[]).map(metric => (
                  <div key={metric} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: metricAppearance[metric].color }} />
                    {metricLabels[metric]}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[10px] text-amber-300/70">
                  <span className="h-[2px] w-3 rounded-full bg-amber-400" style={{ borderBottom: "1px dashed" }} />
                  {copy.maShort}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-300/70">
                  <span className="h-[2px] w-3 rounded-full bg-fuchsia-400" style={{ borderBottom: "1px dashed" }} />
                  {copy.maLong}
                </div>
              </div>
            </div>
          </div>
        </TechPanel>

        {/* ═══ REGION RANKING BAR CHART ═══ */}
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
          <TechPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{copy.regionRanking}</p>
                <h3 className="mt-1.5 text-lg font-semibold text-white">{copy.regionRanking}</h3>
                <p className="mt-1 text-[12px] text-slate-400">{copy.regionRankingDesc}</p>
              </div>
              <Badge className="rounded-lg border-white/10 bg-white/[0.05] text-[10px] text-slate-200">{sortLabels[sortBy]}</Badge>
            </div>
            <div className="mt-5 h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionBarData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(148,163,184,0.7)"
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`¥${value.toFixed(2)}`, name]}
                    labelFormatter={(label: string) => {
                      const item = regionBarData.find(r => r.name === label);
                      return item?.fullName ?? label;
                    }}
                  />
                  <Bar dataKey="hogPrice" name={copy.hogSpot} radius={[0, 4, 4, 0]} barSize={14}>
                    {regionBarData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.regionCode === selectedRegionCode ? "#38bdf8" : "rgba(56,189,248,0.35)"}
                        cursor="pointer"
                        onClick={() => setSelectedRegionCode(entry.regionCode)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TechPanel>

          <div className="grid gap-5">
            {/* Basis chart */}
            <TechPanel>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{copy.basis}</p>
                  <h3 className="mt-1.5 text-base font-semibold text-white">{copy.basisTitle}</h3>
                </div>
                <Badge className="rounded-lg border-white/10 bg-white/[0.05] text-[10px] text-slate-200">{copy.realtime}</Badge>
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-slate-950/40 p-2">
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={basisHistory}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                      <Line type="monotone" dataKey="value" stroke="#7c88ff" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TechPanel>

            {/* Spread chart */}
            <TechPanel>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{copy.spread}</p>
                  <h3 className="mt-1.5 text-base font-semibold text-white">{copy.spreadTitle}</h3>
                </div>
                <Badge className="rounded-lg border-white/10 bg-white/[0.05] text-[10px] text-slate-200">{copy.inventorySensitive}</Badge>
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-slate-950/40 p-2">
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spreadHistory}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis stroke="rgba(148,163,184,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                      <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TechPanel>
          </div>
        </div>

        {/* ═══ RISK + MODULE ENTRY ═══ */}
        <div className="grid gap-5 xl:grid-cols-2">
          <TechPanel>
            <div className="flex items-center gap-2 text-amber-200">
              <TriangleAlert className="h-4 w-4" />
              <h3 className="text-base font-semibold text-white">{copy.riskTitle}</h3>
            </div>
            <div className="mt-3 space-y-2">
              {data?.inventoryBatches.map(batch => (
                <div key={batch.batchCode} className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3 text-[12px] text-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <span>{batch.warehouse}</span>
                    <span className="text-cyan-200">{copy.concentration} {batch.concentration}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{copy.spotPrice} ¥{batch.currentSpotPrice.toFixed(2)}</span>
                    <span>{copy.mappedPrice} ¥{batch.futuresMappedPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TechPanel>

          <TechPanel>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{copy.moduleEntry}</h3>
                <p className="mt-0.5 text-[12px] text-slate-400">{copy.moduleDesc}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                { title: language === "zh" ? "鸡事业部" : language === "en" ? "Poultry Division" : language === "ja" ? "鶏事業部" : "ธุรกิจไก่", metric: copy.poultryMetric },
                { title: language === "zh" ? "饲料事业部" : language === "en" ? "Feed Division" : language === "ja" ? "飼料事業部" : "ธุรกิจอาหารสัตว์", metric: copy.feedMetric },
              ].map(item => (
                <div key={item.title} className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[13px] font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.metric}</p>
                </div>
              ))}
            </div>
          </TechPanel>
        </div>

        {/* ═══ AI RECOMMENDATION ═══ */}
        <TechPanel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">{copy.aiPanel}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{copy.aiTitle}</h3>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {data?.inventoryBatches.map((batch, index) => (
              <div key={batch.batchCode} className="rounded-[16px] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-white">{batch.partName}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{batch.batchCode}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="rounded-md border-white/10 bg-white/[0.05] text-[10px] text-slate-300">0{index + 1}</Badge>
                    <Badge className={batch.ageDays > 45
                      ? "rounded-md border-amber-400/20 bg-amber-400/10 text-[10px] text-amber-200"
                      : "rounded-md border-emerald-400/20 bg-emerald-400/10 text-[10px] text-emerald-200"
                    }>{copy.agePrefix} {batch.ageDays} {copy.day}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-slate-300">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">{copy.inventory} {batch.weightKg.toLocaleString()} kg</div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">{copy.cost} ¥{batch.unitCost}/kg</div>
                </div>
                <div className="mt-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-2.5 text-[11px] leading-relaxed text-cyan-50/80">{copy.formulaHint}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Button onClick={() => setLocation("/ai")} className="w-full rounded-xl border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(56,189,248,0.08))] text-cyan-100 font-semibold hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.2),rgba(56,189,248,0.12))] transition-all">
              {copy.openAiDecision}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setLocation("/quant")} className="w-full rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(56,152,255,0.08))] border border-cyan-400/20 text-cyan-100 font-semibold hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(56,152,255,0.12))] transition-all">
              {copy.openEngine}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TechPanel>
      </div>
    </PlatformShell>
  );
}
