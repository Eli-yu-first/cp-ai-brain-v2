import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, MetricCard, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { TimeframeToggle } from "@/components/platform/TimeframeToggle";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  Factory,
  Network,
  Orbit,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type Timeframe = "day" | "week" | "month" | "quarter" | "halfYear" | "year";

export default function OverviewPage() {
  const [, setLocation] = useLocation();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const { language } = useLanguage();
  const { data } = trpc.platform.snapshot.useQuery({ timeframe });

  const copy = {
    zh: {
      eyebrow: "Global Command Center",
      title: "全产业链总览大屏",
      sectionEyebrow: "Nine-Stage Chain",
      sectionTitle: "种子到销售的九大环节协同态势",
      sectionDesc: "以统一的深色科技风呈现集团级经营概况、九大环节指标联动、事业部入口以及高优先级风险区域，强调总部级指挥与商业化交付气质。",
      dataUpdated: "数据刷新时间",
      chainFlow: "Chain Flow",
      chainFlowTitle: "九大环节协同链路",
      chainFlowDesc: "端到端可视化 + 决策联动",
      stage: "阶段",
      synergyIndex: "协同指数",
      businessUnits: "Business Units",
      businessDesc: "按事业部拆分经营信号与量化决策入口，支持统一风格下的独立扩展。",
      riskTitle: "今日风控重点",
      risk1: "猪事业部后腿批次库存集中度高于预警线，建议优先进入量化决策页处理。",
      risk2: "鸡事业部冷链履约稳定，但区域订单结构分化，需要二级市场监控。",
      risk3: "饲料事业部豆粕波动抬升，建议关注原料库存可用天数。",
      visualRule: "统一视觉规范",
      poultryTitle: "鸡事业部核心指标面板",
      poultryDesc: "鸡事业部面板沿用与猪事业部相同的卡片、色阶、边框和动效规则，用于承接屠宰、蛋品、渠道和冷链指标。",
      feedTitle: "饲料事业部核心指标面板",
      feedDesc: "饲料事业部可继续向原料采购、配方成本、周转效率和多工厂协同方向扩展，视觉和结构与其他事业部保持一致。",
      poultryMetrics: [["白羽肉鸡屠宰量", "3.0", "亿只"], ["蛋鸡存栏", "2580", "万只"], ["订单履约率", "97.8", "%"]],
      feedMetrics: [["饲料产能", "1000", "万吨/年"], ["产能利用率", "84.6", "%"], ["原料库存可用天数", "29", "天"]],
      chainStages: ["种子", "种植", "饲料", "养殖", "屠宰", "深加工", "仓储冷冻", "冷链物流", "销售营销"],
      heroSignalA: "总部指挥视角",
      heroSignalB: "事业部协同视角",
      heroSignalC: "风险联动视角",
      controlDeck: "控制台工具条",
      flagship: "旗舰经营看板",
      gotoPork: "进入猪事业部",
      riskLevel: "风险等级",
      medium: "中",
      high: "高",
      response: "建议动作",
      response1: "优先进入量化页复核库存持有窗口",
      response2: "跟踪区域订单结构与冷链周转效率",
      response3: "监控豆粕波动与原料库存可用天数",
    },
    en: {
      eyebrow: "Global Command Center",
      title: "Full Value Chain Command View",
      sectionEyebrow: "Nine-Stage Chain",
      sectionTitle: "Coordination across nine stages from seed to sales",
      sectionDesc: "A unified dark-tech experience for group-level KPIs, cross-stage linkage, business-unit access, and prioritized risk areas suitable for executive command and commercial delivery.",
      dataUpdated: "Data refreshed at",
      chainFlow: "Chain Flow",
      chainFlowTitle: "Nine-stage operating chain",
      chainFlowDesc: "End-to-end visualization + decision linkage",
      stage: "Stage",
      synergyIndex: "Synergy Index",
      businessUnits: "Business Units",
      businessDesc: "Operating signals and quantitative decision entries are split by division while preserving one unified premium visual language.",
      riskTitle: "Today's risk priorities",
      risk1: "Ham inventory concentration in the pork division is above the warning line and should be handled in the quant decision engine first.",
      risk2: "Cold-chain fulfillment in poultry remains stable, but regional order structure divergence requires secondary market monitoring.",
      risk3: "Soybean meal volatility is rising in feed operations, and raw-material days of supply should be closely watched.",
      visualRule: "Unified Visual Rule",
      poultryTitle: "Poultry Division KPI Panel",
      poultryDesc: "The poultry panel follows the same card language, color scale, borders, and motion logic as the pork division to host slaughter, egg, channel, and cold-chain metrics.",
      feedTitle: "Feed Division KPI Panel",
      feedDesc: "The feed panel can continue toward raw-material sourcing, formulation cost, turnover efficiency, and multi-plant coordination while keeping the same visual grammar.",
      poultryMetrics: [["Broiler slaughter volume", "3.0", "hundred million birds"], ["Layer inventory", "2580", "ten thousand birds"], ["Order fulfillment", "97.8", "%"]],
      feedMetrics: [["Feed capacity", "1000", "ten thousand tons/year"], ["Capacity utilization", "84.6", "%"], ["Raw-material days of supply", "29", "days"]],
      chainStages: ["Seeds", "Planting", "Feed", "Farming", "Slaughter", "Processing", "Storage", "Cold Chain", "Sales"],
      heroSignalA: "HQ command view",
      heroSignalB: "Division coordination",
      heroSignalC: "Risk linkage",
      controlDeck: "Control Deck",
      flagship: "Flagship Operating Board",
      gotoPork: "Open Pork Division",
      riskLevel: "Risk",
      medium: "Medium",
      high: "High",
      response: "Suggested action",
      response1: "Review inventory holding window in the quant page first",
      response2: "Track regional order mix and cold-chain turnover",
      response3: "Monitor soybean meal volatility and days of supply",
    },
    ja: {
      eyebrow: "Global Command Center",
      title: "全産業チェーン統合ダッシュボード",
      sectionEyebrow: "Nine-Stage Chain",
      sectionTitle: "種子から販売までの 9 段階連携",
      sectionDesc: "統一されたダークテック表現で、グループ経営指標、9 段階連動、事業部入口、優先リスク領域を可視化し、経営指揮と商用提案に適した体験を構築します。",
      dataUpdated: "データ更新時刻",
      chainFlow: "Chain Flow",
      chainFlowTitle: "9 段階オペレーションチェーン",
      chainFlowDesc: "エンドツーエンド可視化 + 意思決定連動",
      stage: "段階",
      synergyIndex: "連携指数",
      businessUnits: "Business Units",
      businessDesc: "事業部ごとに経営シグナルと定量判断入口を分けつつ、プレミアムな統一ビジュアル言語を維持します。",
      riskTitle: "本日のリスク重点",
      risk1: "豚事業部のハム在庫集中度が警戒線を超えており、先に定量意思決定エンジンで処理する必要があります。",
      risk2: "鶏事業部のコールドチェーン履行は安定していますが、地域別注文構成の分化に対する監視が必要です。",
      risk3: "飼料事業部では大豆粕の変動が上昇しており、原料在庫日数の監視が必要です。",
      visualRule: "統一ビジュアル規範",
      poultryTitle: "鶏事業部 KPI パネル",
      poultryDesc: "鶏事業部パネルは豚事業部と同じカード、色階、境界、動作ロジックを採用し、と畜・卵品・チャネル・コールドチェーン指標を収容します。",
      feedTitle: "飼料事業部 KPI パネル",
      feedDesc: "飼料事業部は原料調達、配合コスト、回転効率、多工場協調へ拡張可能で、他事業部と同じ視覚文法を維持します。",
      poultryMetrics: [["白羽ブロイラー処理量", "3.0", "億羽"], ["採卵鶏在庫", "2580", "万羽"], ["受注履行率", "97.8", "%"]],
      feedMetrics: [["飼料生産能力", "1000", "万トン/年"], ["稼働率", "84.6", "%"], ["原料在庫日数", "29", "日"]],
      chainStages: ["種子", "栽培", "飼料", "飼育", "と畜", "深加工", "保管冷凍", "コールドチェーン", "販売"],
      heroSignalA: "本社指揮視点",
      heroSignalB: "事業部連携視点",
      heroSignalC: "リスク連動視点",
      controlDeck: "コントロールデッキ",
      flagship: "旗艦オペレーションボード",
      gotoPork: "豚事業部へ",
      riskLevel: "リスク",
      medium: "中",
      high: "高",
      response: "推奨アクション",
      response1: "定量ページで在庫保有ウィンドウを優先確認",
      response2: "地域別受注構成とコールドチェーン回転を追跡",
      response3: "大豆粕変動と在庫日数を監視",
    },
    th: {
      eyebrow: "Global Command Center",
      title: "แดชบอร์ดบัญชาการทั้งห่วงโซ่อุตสาหกรรม",
      sectionEyebrow: "Nine-Stage Chain",
      sectionTitle: "การประสานงาน 9 ขั้นตอนตั้งแต่เมล็ดพันธุ์ถึงการขาย",
      sectionDesc: "ประสบการณ์เทคโนโลยีโทนมืดแบบเป็นหนึ่งเดียวสำหรับ KPI ระดับกลุ่ม การเชื่อมโยงข้ามขั้นตอน ทางเข้าแต่ละหน่วยธุรกิจ และพื้นที่ความเสี่ยงลำดับสูงที่เหมาะกับการสั่งการระดับผู้บริหารและการส่งมอบเชิงพาณิชย์",
      dataUpdated: "รีเฟรชข้อมูลเวลา",
      chainFlow: "Chain Flow",
      chainFlowTitle: "ห่วงโซ่ปฏิบัติการ 9 ขั้นตอน",
      chainFlowDesc: "ภาพรวมตั้งแต่ต้นน้ำถึงปลายน้ำ + การเชื่อมโยงการตัดสินใจ",
      stage: "ขั้นตอน",
      synergyIndex: "ดัชนีการประสานงาน",
      businessUnits: "Business Units",
      businessDesc: "แยกสัญญาณการดำเนินงานและจุดเข้าเอนจินการตัดสินใจตามแต่ละหน่วยธุรกิจ โดยยังคงภาษาภาพระดับพรีเมียมแบบเดียวกัน",
      riskTitle: "ลำดับความเสี่ยงวันนี้",
      risk1: "ความเข้มข้นของสินค้าคงคลังส่วนแฮมในธุรกิจสุกรสูงกว่าเส้นเตือนและควรถูกประมวลผลในเอนจินเชิงปริมาณก่อน",
      risk2: "การส่งมอบห่วงโซ่เย็นในธุรกิจไก่ยังคงเสถียร แต่ความแตกต่างของโครงสร้างคำสั่งซื้อรายภูมิภาคต้องได้รับการติดตาม",
      risk3: "ความผันผวนของกากถั่วเหลืองในธุรกิจอาหารสัตว์เพิ่มขึ้น และควรติดตามจำนวนวันคงคลังวัตถุดิบอย่างใกล้ชิด",
      visualRule: "มาตรฐานภาพเดียวกัน",
      poultryTitle: "แผง KPI ธุรกิจไก่",
      poultryDesc: "แผงธุรกิจไก่ใช้ภาษาภาพเดียวกับธุรกิจสุกร ทั้งระบบการ์ด ไล่สี เส้นขอบ และตรรกะแอนิเมชัน เพื่อรองรับตัวชี้วัดการชำแหละ ไข่ ช่องทาง และห่วงโซ่เย็น",
      feedTitle: "แผง KPI ธุรกิจอาหารสัตว์",
      feedDesc: "แผงธุรกิจอาหารสัตว์สามารถต่อยอดไปสู่การจัดหาวัตถุดิบ ต้นทุนสูตร ประสิทธิภาพการหมุนเวียน และการประสานหลายโรงงาน โดยคงภาษาภาพเดียวกับธุรกิจอื่น",
      poultryMetrics: [["ปริมาณชำแหละไก่เนื้อ", "3.0", "ร้อยล้านตัว"], ["จำนวนแม่ไก่ไข่", "2580", "หมื่นตัว"], ["อัตราปฏิบัติตามคำสั่งซื้อ", "97.8", "%"]],
      feedMetrics: [["กำลังการผลิตอาหารสัตว์", "1000", "หมื่นตัน/ปี"], ["การใช้กำลังการผลิต", "84.6", "%"], ["วันคงคลังวัตถุดิบ", "29", "วัน"]],
      chainStages: ["เมล็ดพันธุ์", "การเพาะปลูก", "อาหารสัตว์", "การเลี้ยง", "การชำแหละ", "แปรรูป", "คลังแช่เย็น", "ห่วงโซ่เย็น", "การขาย"],
      heroSignalA: "มุมมองบัญชาการสำนักงานใหญ่",
      heroSignalB: "มุมมองการประสานหน่วยธุรกิจ",
      heroSignalC: "มุมมองความเสี่ยงเชื่อมโยง",
      controlDeck: "แถบควบคุม",
      flagship: "บอร์ดปฏิบัติการเรือธง",
      gotoPork: "เปิดธุรกิจสุกร",
      riskLevel: "ความเสี่ยง",
      medium: "กลาง",
      high: "สูง",
      response: "ข้อเสนอแนะ",
      response1: "ตรวจทานหน้าต่างการถือครองสินค้าคงคลังในหน้าเชิงปริมาณก่อน",
      response2: "ติดตามโครงสร้างคำสั่งซื้อรายภูมิภาคและการหมุนเวียนห่วงโซ่เย็น",
      response3: "ติดตามความผันผวนของกากถั่วเหลืองและจำนวนวันคงคลัง",
    },
  }[language];

  const metricCopy = {
    seed_coverage: {
      zh: { label: "种子与种植覆盖", desc: "自有种植与订单农业协同面积", unit: "万亩" },
      en: { label: "Seed & planting coverage", desc: "Integrated area across owned farms and contract farming", unit: "10k mu" },
      ja: { label: "種子・栽培カバー", desc: "自社栽培と契約農業の連動面積", unit: "万ムー" },
      th: { label: "ครอบคลุมเมล็ดพันธุ์และการเพาะปลูก", desc: "พื้นที่ที่ประสานระหว่างแปลงของบริษัทและเกษตรพันธสัญญา", unit: "หมื่นหมู่" },
    },
    feed_capacity: {
      zh: { label: "饲料产能", desc: "全国饲料产线综合产能", unit: "万吨/年" },
      en: { label: "Feed capacity", desc: "Integrated national feed-line capacity", unit: "10k tons/year" },
      ja: { label: "飼料生産能力", desc: "全国飼料ラインの総合能力", unit: "万トン/年" },
      th: { label: "กำลังการผลิตอาหารสัตว์", desc: "กำลังการผลิตรวมของสายการผลิตอาหารสัตว์ทั่วประเทศ", unit: "หมื่นตัน/ปี" },
    },
    hog_output: {
      zh: { label: "生猪年出栏", desc: "猪事业部年度出栏规模", unit: "万头" },
      en: { label: "Annual hog output", desc: "Annual shipping scale of the pork division", unit: "10k head" },
      ja: { label: "年間生豚出荷", desc: "豚事業部の年間出荷規模", unit: "万頭" },
      th: { label: "ผลผลิตสุกรรายปี", desc: "ขนาดการส่งออกประจำปีของธุรกิจสุกร", unit: "หมื่นตัว" },
    },
    broiler_output: {
      zh: { label: "白羽肉鸡屠宰量", desc: "鸡事业部白羽肉鸡处理规模", unit: "百万只" },
      en: { label: "Broiler slaughter volume", desc: "Broiler processing scale of the poultry division", unit: "million birds" },
      ja: { label: "白羽ブロイラー処理量", desc: "鶏事業部の白羽ブロイラー処理規模", unit: "百万羽" },
      th: { label: "ปริมาณชำแหละไก่เนื้อ", desc: "ขนาดการแปรรูปไก่เนื้อของธุรกิจไก่", unit: "ล้านตัว" },
    },
    layer_inventory: {
      zh: { label: "蛋鸡存栏", desc: "蛋鸡业务在栏规模", unit: "万只" },
      en: { label: "Layer inventory", desc: "In-house layer inventory scale", unit: "10k birds" },
      ja: { label: "採卵鶏在庫", desc: "採卵鶏事業の飼養規模", unit: "万羽" },
      th: { label: "จำนวนแม่ไก่ไข่", desc: "ขนาดฝูงแม่ไก่ไข่ที่อยู่ในระบบ", unit: "หมื่นตัว" },
    },
    deep_processing_sku: {
      zh: { label: "深加工 SKU", desc: "深加工产品矩阵规模", unit: "个" },
      en: { label: "Deep-processing SKU", desc: "Scale of the processed-product matrix", unit: "items" },
      ja: { label: "深加工 SKU", desc: "深加工製品マトリクス規模", unit: "件" },
      th: { label: "SKU แปรรูปลึก", desc: "ขนาดของเมทริกซ์สินค้าการแปรรูป", unit: "รายการ" },
    },
  } as const;

  const businessCopy = {
    pork: {
      zh: { name: "猪事业部", detail: "23 部位经营、库存与套利决策中枢", unit: "万头年出栏" },
      en: { name: "Pork Division", detail: "Center for 23-part operations, inventory, and arbitrage decisions", unit: "10k head/year" },
      ja: { name: "豚事業部", detail: "23 部位運営・在庫・裁定判断の中枢", unit: "万頭/年" },
      th: { name: "ธุรกิจสุกร", detail: "ศูนย์กลางการดำเนินงาน 23 ชิ้นส่วน สินค้าคงคลัง และการตัดสินใจเชิงอาร์บิทราจ", unit: "หมื่นตัว/ปี" },
    },
    poultry: {
      zh: { name: "鸡事业部", detail: "白羽肉鸡、蛋鸡存栏与渠道履约管理", unit: "百万只屠宰量" },
      en: { name: "Poultry Division", detail: "Broilers, layer inventory, and channel fulfillment management", unit: "million birds" },
      ja: { name: "鶏事業部", detail: "ブロイラー、採卵鶏在庫、チャネル履行管理", unit: "百万羽" },
      th: { name: "ธุรกิจไก่", detail: "การบริหารไก่เนื้อ แม่ไก่ไข่ และการส่งมอบช่องทาง", unit: "ล้านตัว" },
    },
    feed: {
      zh: { name: "饲料事业部", detail: "产能利用率、原料库存和成本波动联动", unit: "万吨/年产能" },
      en: { name: "Feed Division", detail: "Capacity use, raw-material stock, and cost-volatility linkage", unit: "10k tons/year" },
      ja: { name: "飼料事業部", detail: "稼働率・原料在庫・コスト変動の連動", unit: "万トン/年" },
      th: { name: "ธุรกิจอาหารสัตว์", detail: "การใช้กำลังการผลิต สต็อกวัตถุดิบ และการเชื่อมโยงต้นทุนผันผวน", unit: "หมื่นตัน/ปี" },
    },
  } as const;

  const topMetrics = useMemo(
    () =>
      (data?.chainMetrics.slice(0, 6) ?? []).map(metric => {
        const localized = metricCopy[metric.code as keyof typeof metricCopy]?.[language];
        return localized ? { ...metric, label: localized.label, description: localized.desc, unit: localized.unit } : metric;
      }),
    [data, language],
  );

  const riskCards = [
    { text: copy.risk1, level: copy.high, action: copy.response1 },
    { text: copy.risk2, level: copy.medium, action: copy.response2 },
    { text: copy.risk3, level: copy.medium, action: copy.response3 },
  ];

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title}>
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="data-chip text-[12px]">{copy.heroSignalA}</div>
            <div className="data-chip text-[12px]">{copy.heroSignalB}</div>
            <div className="data-chip text-[12px]">{copy.heroSignalC}</div>
          </div>
        }
      />

      {/* Control deck */}
      <GlassPanel className="mb-6 overflow-visible">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.controlDeck}</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{copy.flagship}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TimeframeToggle value={timeframe} onChange={setTimeframe} />
            <Badge className="rounded-lg border-cyan-400/15 bg-cyan-400/[0.06] px-3.5 py-2 text-[11px] font-semibold text-cyan-200/80">
              {copy.dataUpdated} {data ? new Date(data.generatedAt).toLocaleTimeString() : "--:--:--"}
            </Badge>
          </div>
        </div>
      </GlassPanel>

      {/* KPI metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topMetrics.map((metric, index) => (
          <MetricCard
            key={metric.code}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            delta={metric.delta}
            description={metric.description}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Chain flow + Business units */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <GlassPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.chainFlow}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.chainFlowTitle}</h3>
            </div>
            <div className="data-chip text-[12px]">{copy.chainFlowDesc}</div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {copy.chainStages.map((stage, index) => (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-xl border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008)),rgba(6,14,28,0.9)] p-4 transition-all hover:border-cyan-400/15 hover:bg-[rgba(56,152,255,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300 transition-all group-hover:bg-cyan-400/[0.1] group-hover:shadow-[0_0_14px_rgba(56,180,255,0.1)]">
                    {index < 2 ? <Orbit className="h-4 w-4" /> : index < 5 ? <Factory className="h-4 w-4" /> : index < 7 ? <Boxes className="h-4 w-4" /> : index === 7 ? <Snowflake className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{stage}</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{copy.stage} {index + 1}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">{copy.synergyIndex}</span>
                  <span className="num-display font-semibold text-cyan-200">{92 + index * 0.6}%</span>
                </div>
                <Progress value={74 + index * 2.4} className="mt-2.5 h-1.5 bg-white/[0.06]" />
                {index < copy.chainStages.length - 1 ? (
                  <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 text-cyan-300/40 xl:block" />
                ) : null}
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.businessUnits}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.businessDesc}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data?.businessCards.map(card => {
              const localized = businessCopy[card.id as keyof typeof businessCopy]?.[language];
              const isPork = card.id === "pork";
              return (
                <button
                  key={card.id}
                  onClick={() => setLocation(isPork ? "/pork" : "/overview")}
                  className="group w-full rounded-xl border border-white/[0.05] bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),rgba(6,14,28,0.9)] p-5 text-left transition-all duration-300 hover:border-cyan-400/15 hover:bg-[rgba(56,152,255,0.03)] hover:shadow-[0_8px_30px_rgba(56,152,255,0.06)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="rounded-lg border-white/[0.08] bg-white/[0.04] text-[12px] font-semibold text-slate-200">{localized?.name ?? card.name}</Badge>
                    <span className="num-display text-[13px] font-bold text-emerald-400">+{card.delta}%</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-semibold text-white">{localized?.detail ?? card.detail}</p>
                      <p className="mt-2 text-[12px] text-slate-500">{localized?.unit ?? card.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="num-display text-3xl font-bold text-white">{card.highlight}</p>
                      <p className="mt-1.5 text-[12px] text-slate-400">{isPork ? copy.gotoPork : localized?.name ?? card.name}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* Risk + Division panels */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <GlassPanel>
          <div className="flex items-center gap-3 text-amber-300">
            <CircleAlert className="h-5 w-5" />
            <h3 className="text-lg font-bold text-white">{copy.riskTitle}</h3>
          </div>
          <div className="mt-5 space-y-3">
            {riskCards.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="rounded-xl border border-white/[0.05] bg-[rgba(6,14,28,0.7)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-lg border-amber-400/15 bg-amber-400/[0.06] text-[11px] font-semibold text-amber-200">0{index + 1}</Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.riskLevel} · {item.level}</span>
                </div>
                <p className="mt-3 text-[13px] leading-[1.7] text-slate-300/90">{item.text}</p>
                <div className="mt-3 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.response}</span>
                  <p className="mt-1.5 text-[12.5px] leading-[1.6] text-cyan-200/80">{item.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <GlassPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Poultry Division</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.poultryTitle}</h3>
              </div>
              <Badge className="rounded-lg border-violet-400/15 bg-violet-400/[0.06] text-[10px] font-semibold text-violet-200">{copy.visualRule}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {copy.poultryMetrics.map(([label, value, unit], index) => (
                <div key={label} className="rounded-xl border border-white/[0.05] bg-[rgba(6,14,28,0.7)] p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[12px] text-slate-500">{label}</p>
                      <p className="mt-3 num-display text-2xl font-bold text-white">
                        {value}
                        <span className="ml-2 text-[13px] font-medium text-slate-400">{unit}</span>
                      </p>
                    </div>
                    <Badge className="rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold text-slate-300">0{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-[1.7] text-slate-400/80">{copy.poultryDesc}</p>
          </GlassPanel>

          <GlassPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Feed Division</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.feedTitle}</h3>
              </div>
              <Badge className="rounded-lg border-emerald-400/15 bg-emerald-400/[0.06] text-[10px] font-semibold text-emerald-200">{copy.visualRule}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {copy.feedMetrics.map(([label, value, unit], index) => (
                <div key={label} className="rounded-xl border border-white/[0.05] bg-[rgba(6,14,28,0.7)] p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[12px] text-slate-500">{label}</p>
                      <p className="mt-3 num-display text-2xl font-bold text-white">
                        {value}
                        <span className="ml-2 text-[13px] font-medium text-slate-400">{unit}</span>
                      </p>
                    </div>
                    <Badge className="rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold text-slate-300">0{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-[1.7] text-slate-400/80">{copy.feedDesc}</p>
          </GlassPanel>
        </div>
      </div>
    </PlatformShell>
  );
}
