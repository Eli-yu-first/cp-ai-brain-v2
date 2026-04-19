import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { buildMobileRoleView, getRoleStatusBadgeClass, type MobileRole, type MobileRoleFeedback } from "./aiDecisionMobileRoles";
import {
  BrainCircuit,
  Calculator,
  Factory,
  LineChart as LineChartIcon,
  Radar,
  ShieldAlert,
  Siren,
  Truck,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AgentCard = {
  agentId: "global" | "business" | "field";
  agentName: string;
  objective: string;
  recommendation: string;
  rationale: string;
  riskLevel: "低" | "中" | "高";
  nextAction: string;
};

type AlertCard = {
  alertId: string;
  title: string;
  status: "red" | "yellow" | "green";
  summary: string;
  impactScope: string;
  estimatedLoss: number;
  aiRecommendation: string;
  rootCause: string;
  actionOwner: string;
};

type ForecastStrategy = "steady" | "balanced" | "aggressive";
type ForecastDisplayMetric = "projected" | "average" | "profit";

const copy = {
  zh: {
    eyebrow: "AI Decision OS",
    title: "AI 决策指挥中枢",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "先输入月份与预估价格，再生成价格波动曲线、What-If 沙盘、多 Agent 推理与动态预警",
    sectionDesc:
      "本页已升级为独立 AI 决策工作台。上半区负责 1 到 8 个月价格预测，中部负责多变量 What-If 与资源测算，下半区接入 Manus LLM 多 Agent 输出、红黄绿预警和根因分析弹窗。",
    workbench: "预测工作台",
    selectBatch: "库存批次",
    selectMonth: "预测月份",
    targetPrice: "预估价格（元/公斤）",
    formulaHint: "系统将基于当前批次成本、持有成本和目标价格，自动推演 1-8 月价格波动与收益变化。",
    projectedPrice: "预测售价",
    breakEven: "保本价",
    avgSell: "平均售价",
    profit: "总收益",
    monthlyCost: "月持有成本",
    batchInfo: "批次信息",
    chartTitle: "价格波动曲线",
    chartDesc: "蓝线为预测售价，虚线为保本线，选择不同月份即可切换对应利润区间。",
    currentMonth: "当前选择",
    perKgProfit: "每公斤利润",
    weight: "库存量",
    chartPrice: "预测售价",
    chartBreakEven: "保本价",
    monthUnit: "个月",
    yuanPerKg: "元/公斤",
    tonnage: "kg",
    whatIfEyebrow: "What-If Sandbox",
    whatIfTitle: "多变量情景模拟",
    whatIfDesc: "可同时调整价格、产能与需求，观察利润变化，并自动生成未来 1 到 3 个月的屠宰、速冻、入库和冷链资源计划。",
    scenarioMonth: "模拟月份",
    capacityAdjustment: "产能调整（%）",
    demandAdjustment: "需求调整（%）",
    baselineProfit: "基线收益",
    simulatedProfit: "模拟收益",
    incrementalProfit: "收益增量",
    expectedRevenue: "预计收入",
    utilizationRate: "资源利用率",
    resourcesTitle: "1-3 个月资源需求",
    slaughterHeads: "屠宰头数",
    freezingTons: "速冻吨位",
    storageTons: "仓储吨位",
    warehousePallets: "托盘需求",
    coldChainTrips: "冷链车次",
    agentEyebrow: "Multi-Agent Reasoning",
    agentTitle: "多 Agent 分层决策输出",
    agentDesc: "调用 Manus 内置模型，将总部经营、业务调度和现场执行三层 Agent 的判断汇总为统一行动方案。",
    generateAgents: "生成多 Agent 协同推理",
    generatingAgents: "正在生成多 Agent 推理...",
    overview: "总览判断",
    coordinationSignal: "协同信号",
    dispatchSummary: "执行摘要",
    objective: "目标",
    recommendation: "建议",
    rationale: "依据",
    nextAction: "下一步",
    riskLevel: "风险等级",
    alertEyebrow: "Traffic-Light Alerts",
    alertTitle: "红黄绿动态预警",
    alertDesc: "系统会根据利润、产能、仓储、冷链、需求与执行节奏生成动态告警。点击任意卡片可查看根因分析。",
    alertOverview: "预警概览",
    impactScope: "影响范围",
    estimatedLoss: "预计损失",
    aiRecommendation: "AI 建议",
    rootCause: "问题根因",
    actionOwner: "责任 Agent",
    closeHint: "点击任意卡片查看详情",
    alertStatusRed: "红色预警",
    alertStatusYellow: "黄色预警",
    alertStatusGreen: "绿色正常",
    navReady: "预测工作台已联通",
    chartReady: "曲线已生成",
    whatIfReady: "What-If 沙盘已联通",
    agentsReady: "多 Agent 已接入",
    alertsReady: "动态预警已接入",
    nextPending: "等待接入派单与执行反馈联动",
    monthShort: "月",
    modules: [
      { icon: Truck, title: "派单与执行反馈", desc: "下一阶段把多 Agent 与预警结论转成工单、回传与超时升级。" },
      { icon: Warehouse, title: "现场资源编排", desc: "继续强化屠宰、仓储、冷链和现场班次之间的联动。" },
    ],
  },
  en: {
    eyebrow: "AI Decision OS",
    title: "AI Decision Command Center",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "Forecast, simulate, reason, and monitor alerts in one AI decision workspace",
    sectionDesc:
      "This page now combines 1-8 month forecasting, What-If resource simulation, Manus LLM multi-agent reasoning, and traffic-light alerts with root-cause dialogs.",
    workbench: "Forecast Workbench",
    selectBatch: "Inventory Batch",
    selectMonth: "Forecast Month",
    targetPrice: "Target Price (CNY/kg)",
    formulaHint: "The system projects 1-8 month price and return changes from batch cost, holding cost, and target price inputs.",
    projectedPrice: "Projected Price",
    breakEven: "Break-even",
    avgSell: "Average Sell",
    profit: "Total Profit",
    monthlyCost: "Monthly Holding Cost",
    batchInfo: "Batch Info",
    chartTitle: "Price Path Curve",
    chartDesc: "The blue line shows projected price while the dashed line marks break-even for quick scenario reading.",
    currentMonth: "Selected Horizon",
    perKgProfit: "Profit per kg",
    weight: "Inventory Weight",
    chartPrice: "Projected Price",
    chartBreakEven: "Break-even",
    monthUnit: "months",
    yuanPerKg: "CNY/kg",
    tonnage: "kg",
    whatIfEyebrow: "What-If Sandbox",
    whatIfTitle: "Multi-variable What-If Simulation",
    whatIfDesc: "Adjust price, capacity, and demand together to compare profit shifts and automatically generate slaughter, freezing, storage, and cold-chain plans for the next 1-3 months.",
    scenarioMonth: "Scenario Month",
    capacityAdjustment: "Capacity Adjustment (%)",
    demandAdjustment: "Demand Adjustment (%)",
    baselineProfit: "Baseline Profit",
    simulatedProfit: "Simulated Profit",
    incrementalProfit: "Incremental Profit",
    expectedRevenue: "Expected Revenue",
    utilizationRate: "Utilization Rate",
    resourcesTitle: "1-3 Month Resource Demand",
    slaughterHeads: "Slaughter Heads",
    freezingTons: "Freezing Tons",
    storageTons: "Storage Tons",
    warehousePallets: "Pallet Demand",
    coldChainTrips: "Cold-chain Trips",
    agentEyebrow: "Multi-Agent Reasoning",
    agentTitle: "Layered Multi-Agent Decision Output",
    agentDesc: "Calls the built-in Manus model to summarize headquarters, business orchestration, and field execution agents into one action plan.",
    generateAgents: "Generate Multi-Agent Reasoning",
    generatingAgents: "Generating multi-agent reasoning...",
    overview: "Overview",
    coordinationSignal: "Coordination Signal",
    dispatchSummary: "Dispatch Summary",
    objective: "Objective",
    recommendation: "Recommendation",
    rationale: "Rationale",
    nextAction: "Next Action",
    riskLevel: "Risk Level",
    alertEyebrow: "Traffic-Light Alerts",
    alertTitle: "Dynamic Warning Board",
    alertDesc: "The system generates dynamic warnings for profit, capacity, storage, cold-chain, demand, and execution rhythm. Click any card for root cause analysis.",
    alertOverview: "Alert Overview",
    impactScope: "Impact Scope",
    estimatedLoss: "Estimated Loss",
    aiRecommendation: "AI Recommendation",
    rootCause: "Root Cause",
    actionOwner: "Owner Agent",
    closeHint: "Click any card to open details",
    alertStatusRed: "Red Alert",
    alertStatusYellow: "Yellow Alert",
    alertStatusGreen: "Green / Normal",
    navReady: "Forecast workspace connected",
    chartReady: "Curve generated",
    whatIfReady: "What-If sandbox connected",
    agentsReady: "Multi-agent connected",
    alertsReady: "Dynamic alerts connected",
    nextPending: "Waiting for dispatch and execution feedback linkage",
    monthShort: "M",
    modules: [
      { icon: Truck, title: "Dispatch & Feedback", desc: "Next phase converts reasoning and alerts into jobs, feedback loops, and escalation handling." },
      { icon: Warehouse, title: "Field Resource Orchestration", desc: "Further connect slaughter, storage, cold-chain, and field shifts." },
    ],
  },
  ja: {
    eyebrow: "AI Decision OS",
    title: "AI意思決定コマンドセンター",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "予測、What-If、マルチエージェント、警報を一つの画面で実行",
    sectionDesc:
      "このページは1〜8か月予測、資源シミュレーション、Manus LLM 多エージェント推論、赤黄緑警報と根因分析ダイアログを統合しています。",
    workbench: "予測ワークベンチ",
    selectBatch: "在庫バッチ",
    selectMonth: "予測月数",
    targetPrice: "目標価格（元/kg）",
    formulaHint: "バッチ原価、保有コスト、目標価格を基に1〜8か月の価格と収益を自動推計します。",
    projectedPrice: "予測売価",
    breakEven: "損益分岐点",
    avgSell: "平均売価",
    profit: "総利益",
    monthlyCost: "月次保有コスト",
    batchInfo: "バッチ情報",
    chartTitle: "価格変動カーブ",
    chartDesc: "青線は予測売価、破線は保本線を示し、月数変更で利益帯を即時に確認できます。",
    currentMonth: "選択期間",
    perKgProfit: "kg当たり利益",
    weight: "在庫重量",
    chartPrice: "予測売価",
    chartBreakEven: "保本線",
    monthUnit: "か月",
    yuanPerKg: "元/kg",
    tonnage: "kg",
    whatIfEyebrow: "What-If Sandbox",
    whatIfTitle: "多変量 What-If シミュレーション",
    whatIfDesc: "価格、能力、需要を同時に調整し、利益差分と1〜3か月の屠殺・凍結・保管・冷鏈資源を自動算出します。",
    scenarioMonth: "シナリオ月",
    capacityAdjustment: "能力調整（%）",
    demandAdjustment: "需要調整（%）",
    baselineProfit: "基準利益",
    simulatedProfit: "シミュレーション利益",
    incrementalProfit: "利益増分",
    expectedRevenue: "予想売上",
    utilizationRate: "資源利用率",
    resourcesTitle: "1〜3か月の資源需要",
    slaughterHeads: "屠殺頭数",
    freezingTons: "急速冷凍トン数",
    storageTons: "保管トン数",
    warehousePallets: "パレット需要",
    coldChainTrips: "冷鏈便数",
    agentEyebrow: "Multi-Agent Reasoning",
    agentTitle: "多層エージェント意思決定出力",
    agentDesc: "Manus 内蔵モデルを呼び出し、本部・業務調整・現場実行エージェントの判断を統合します。",
    generateAgents: "多エージェント推論を生成",
    generatingAgents: "多エージェント推論を生成中...",
    overview: "全体判断",
    coordinationSignal: "協調シグナル",
    dispatchSummary: "実行概要",
    objective: "目標",
    recommendation: "提案",
    rationale: "根拠",
    nextAction: "次アクション",
    riskLevel: "リスク",
    alertEyebrow: "Traffic-Light Alerts",
    alertTitle: "動的警報ボード",
    alertDesc: "利益、能力、保管、冷鏈、需要、実行リズムに対する動的警報を生成します。カードを押すと根因分析を表示します。",
    alertOverview: "警報概要",
    impactScope: "影響範囲",
    estimatedLoss: "想定損失",
    aiRecommendation: "AI 提案",
    rootCause: "根因",
    actionOwner: "責任 Agent",
    closeHint: "カードを押すと詳細を表示",
    alertStatusRed: "赤警報",
    alertStatusYellow: "黄警報",
    alertStatusGreen: "緑 / 正常",
    navReady: "予測ワークベンチ接続済み",
    chartReady: "曲線生成済み",
    whatIfReady: "What-If 接続済み",
    agentsReady: "多エージェント接続済み",
    alertsReady: "動的警報接続済み",
    nextPending: "配車と実行反馈連携待ち",
    monthShort: "月",
    modules: [
      { icon: Truck, title: "配車と実行反馈", desc: "次段階で推論と警報を工単、反馈、エスカレーションへ接続します。" },
      { icon: Warehouse, title: "現場資源編成", desc: "屠殺、保管、冷鏈、班次の連動をさらに強化します。" },
    ],
  },
  th: {
    eyebrow: "AI Decision OS",
    title: "ศูนย์บัญชาการการตัดสินใจ AI",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "คาดการณ์ จำลอง ตรรกะหลายเอเจนต์ และคำเตือนในหน้าจอเดียว",
    sectionDesc:
      "หน้านี้รวมการคาดการณ์ 1-8 เดือน การจำลองทรัพยากร What-If การให้เหตุผลหลายเอเจนต์ของ Manus LLM และคำเตือนสามสีพร้อมหน้าต่างวิเคราะห์สาเหตุรากไว้ด้วยกัน",
    workbench: "โต๊ะคาดการณ์",
    selectBatch: "ล็อตคงคลัง",
    selectMonth: "เดือนที่คาดการณ์",
    targetPrice: "ราคาเป้าหมาย (หยวน/กก.)",
    formulaHint: "ระบบจะประมาณการราคาและผลตอบแทน 1-8 เดือนจากต้นทุนล็อต ต้นทุนการถือ และราคาเป้าหมาย",
    projectedPrice: "ราคาคาดการณ์",
    breakEven: "จุดคุ้มทุน",
    avgSell: "ราคาเฉลี่ยขาย",
    profit: "กำไรรวม",
    monthlyCost: "ต้นทุนการถือต่อเดือน",
    batchInfo: "ข้อมูลล็อต",
    chartTitle: "กราฟเส้นทางราคา",
    chartDesc: "เส้นสีน้ำเงินคือราคาคาดการณ์ ส่วนเส้นประคือเส้นคุ้มทุนเพื่ออ่านสถานการณ์ได้รวดเร็ว",
    currentMonth: "ช่วงเวลาที่เลือก",
    perKgProfit: "กำไรต่อกก.",
    weight: "น้ำหนักคงคลัง",
    chartPrice: "ราคาคาดการณ์",
    chartBreakEven: "จุดคุ้มทุน",
    monthUnit: "เดือน",
    yuanPerKg: "หยวน/กก.",
    tonnage: "kg",
    whatIfEyebrow: "What-If Sandbox",
    whatIfTitle: "การจำลอง What-If หลายตัวแปร",
    whatIfDesc: "ปรับราคา กำลังผลิต และอุปสงค์พร้อมกันเพื่อเปรียบเทียบกำไร และสร้างแผนเชือด แช่แข็ง เก็บคลัง และรถห้องเย็นสำหรับ 1-3 เดือนอัตโนมัติ",
    scenarioMonth: "เดือนสถานการณ์",
    capacityAdjustment: "การปรับกำลังผลิต (%)",
    demandAdjustment: "การปรับอุปสงค์ (%)",
    baselineProfit: "กำไรฐาน",
    simulatedProfit: "กำไรจำลอง",
    incrementalProfit: "กำไรเพิ่มขึ้น",
    expectedRevenue: "รายได้คาดการณ์",
    utilizationRate: "อัตราใช้ทรัพยากร",
    resourcesTitle: "ความต้องการทรัพยากร 1-3 เดือน",
    slaughterHeads: "จำนวนหัวเชือด",
    freezingTons: "ตันแช่แข็ง",
    storageTons: "ตันจัดเก็บ",
    warehousePallets: "ความต้องการพาเลต",
    coldChainTrips: "เที่ยวรถห้องเย็น",
    agentEyebrow: "Multi-Agent Reasoning",
    agentTitle: "ผลลัพธ์การตัดสินใจหลายเอเจนต์",
    agentDesc: "เรียกโมเดลในตัวของ Manus เพื่อสรุปการตัดสินใจของผู้บริหาร การจัดคิวธุรกิจ และการปฏิบัติหน้างานเป็นแผนเดียวกัน",
    generateAgents: "สร้างตรรกะหลายเอเจนต์",
    generatingAgents: "กำลังสร้างตรรกะหลายเอเจนต์...",
    overview: "ภาพรวม",
    coordinationSignal: "สัญญาณการประสาน",
    dispatchSummary: "สรุปการปฏิบัติ",
    objective: "เป้าหมาย",
    recommendation: "ข้อเสนอ",
    rationale: "เหตุผล",
    nextAction: "ขั้นถัดไป",
    riskLevel: "ระดับความเสี่ยง",
    alertEyebrow: "Traffic-Light Alerts",
    alertTitle: "กระดานคำเตือนแบบไดนามิก",
    alertDesc: "ระบบจะสร้างคำเตือนสำหรับกำไร กำลังผลิต คลัง ห้องเย็น อุปสงค์ และจังหวะการปฏิบัติ คลิกการ์ดเพื่อดูสาเหตุราก",
    alertOverview: "ภาพรวมคำเตือน",
    impactScope: "ขอบเขตผลกระทบ",
    estimatedLoss: "ความเสียหายคาดการณ์",
    aiRecommendation: "คำแนะนำ AI",
    rootCause: "สาเหตุราก",
    actionOwner: "เอเจนต์รับผิดชอบ",
    closeHint: "คลิกการ์ดเพื่อเปิดรายละเอียด",
    alertStatusRed: "คำเตือนสีแดง",
    alertStatusYellow: "คำเตือนสีเหลือง",
    alertStatusGreen: "สีเขียว / ปกติ",
    navReady: "เชื่อมโต๊ะคาดการณ์แล้ว",
    chartReady: "สร้างกราฟแล้ว",
    whatIfReady: "เชื่อม What-If แล้ว",
    agentsReady: "เชื่อมหลายเอเจนต์แล้ว",
    alertsReady: "เชื่อมคำเตือนแล้ว",
    nextPending: "รอเชื่อมการสั่งงานและฟีดแบ็ก",
    monthShort: "ด.",
    modules: [
      { icon: Truck, title: "การสั่งงานและฟีดแบ็ก", desc: "ขั้นถัดไปจะแปลงผลลัพธ์การตัดสินใจและคำเตือนเป็นงานและการยกระดับ" },
      { icon: Warehouse, title: "การจัดทรัพยากรหน้างาน", desc: "เชื่อมการเชือด คลัง ห้องเย็น และกะทำงานให้แน่นขึ้น" },
    ],
  },
} as const;

function MetricCard({ label, value, suffix, icon: Icon }: { label: string; value: string; suffix?: string; icon: typeof Calculator }) {
  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),rgba(6,14,30,0.92)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_40px_rgba(0,0,0,0.24)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-white">
        {value}
        {suffix ? <span className="ml-2 text-sm font-medium text-slate-500">{suffix}</span> : null}
      </p>
    </div>
  );
}

function getAlertColors(status: AlertCard["status"]) {
  if (status === "red") {
    return {
      badge: "border-rose-400/20 bg-rose-400/10 text-rose-200",
      panel: "border-rose-400/20 bg-rose-400/[0.06]",
    };
  }
  if (status === "yellow") {
    return {
      badge: "border-amber-400/20 bg-amber-400/10 text-amber-100",
      panel: "border-amber-400/20 bg-amber-400/[0.06]",
    };
  }
  return {
    badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    panel: "border-emerald-400/20 bg-emerald-400/[0.06]",
  };
}

function getActionButtonClass(tone: "neutral" | "success" | "danger") {
  if (tone === "success") {
    return "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/20";
  }
  if (tone === "danger") {
    return "rounded-full border-rose-400/20 bg-rose-400/10 text-rose-50 hover:bg-rose-400/20";
  }
  return "rounded-full border-white/[0.12] bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]";
}

export default function AiDecisionPage() {
  const { language } = useLanguage();
  const current = copy[language];
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [targetPriceInput, setTargetPriceInput] = useState("15");
  const [forecastStrategy, setForecastStrategy] = useState<ForecastStrategy>("balanced");
  const [basisAdjustmentInput, setBasisAdjustmentInput] = useState("0");
  const [historyWindow, setHistoryWindow] = useState("6");
  const [displayMetric, setDisplayMetric] = useState<ForecastDisplayMetric>("projected");
  const [scenarioMonth, setScenarioMonth] = useState("2");
  const [capacityAdjustmentInput, setCapacityAdjustmentInput] = useState("12");
  const [demandAdjustmentInput, setDemandAdjustmentInput] = useState("8");
  const [activeAlert, setActiveAlert] = useState<AlertCard | null>(null);
  const [mobileRole, setMobileRole] = useState<MobileRole>("厂长");

  const selectedMonthNumber = useMemo(() => Number(selectedMonth), [selectedMonth]);
  const scenarioMonthNumber = useMemo(() => Number(scenarioMonth), [scenarioMonth]);
  const targetPrice = useMemo(() => {
    const parsed = Number(targetPriceInput);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [targetPriceInput]);
  const basisAdjustment = useMemo(() => {
    const parsed = Number(basisAdjustmentInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [basisAdjustmentInput]);
  const capacityAdjustment = useMemo(() => {
    const parsed = Number(capacityAdjustmentInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [capacityAdjustmentInput]);
  const demandAdjustment = useMemo(() => {
    const parsed = Number(demandAdjustmentInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [demandAdjustmentInput]);

  const forecastUi = useMemo(() => {
    if (language === "en") {
      return {
        strategy: "Forecast strategy",
        basisAdjustment: "Basis adjustment (¥/kg)",
        historyWindow: "Lookback window",
        displayMetric: "Trend overlay",
        strategyOptions: { steady: "Steady", balanced: "Balanced", aggressive: "Aggressive" },
        displayOptions: { projected: "Break-even", average: "Average sell", profit: "Profit/kg" },
        actualLine: "Actual price",
        forecastLine: "Forecast price",
        splitLine: "Forecast split",
        view4: "4 points",
        view6: "6 points",
        batchSnapshot: "Decision snapshot",
        livePrice: "Current spot",
        effectiveTarget: "Effective target",
        trendHint: "The actual series stays solid, while the forecast section turns into a dashed line after the split marker.",
      };
    }
    if (language === "ja") {
      return {
        strategy: "予測戦略",
        basisAdjustment: "基差補正（元/kg）",
        historyWindow: "回看ウィンドウ",
        displayMetric: "トレンド補助線",
        strategyOptions: { steady: "慎重", balanced: "標準", aggressive: "積極" },
        displayOptions: { projected: "損益分岐", average: "平均売価", profit: "kg当たり利益" },
        actualLine: "実績価格",
        forecastLine: "予測価格",
        splitLine: "予測分界",
        view4: "4点",
        view6: "6点",
        batchSnapshot: "意思決定スナップショット",
        livePrice: "現在現物",
        effectiveTarget: "有効目標",
        trendHint: "実績区間は実線、分界点以降の予測区間は破線で表示します。",
      };
    }
    if (language === "th") {
      return {
        strategy: "กลยุทธ์คาดการณ์",
        basisAdjustment: "การปรับ Basis (หยวน/กก.)",
        historyWindow: "ช่วงมองย้อนหลัง",
        displayMetric: "เส้นช่วยวิเคราะห์",
        strategyOptions: { steady: "ระมัดระวัง", balanced: "สมดุล", aggressive: "เชิงรุก" },
        displayOptions: { projected: "จุดคุ้มทุน", average: "ราคาเฉลี่ยขาย", profit: "กำไรต่อกก." },
        actualLine: "ราคาจริง",
        forecastLine: "ราคาคาดการณ์",
        splitLine: "จุดแบ่งคาดการณ์",
        view4: "4 จุด",
        view6: "6 จุด",
        batchSnapshot: "สแน็ปช็อตการตัดสินใจ",
        livePrice: "ราคาสปอตปัจจุบัน",
        effectiveTarget: "เป้าหมายจริง",
        trendHint: "ช่วงข้อมูลจริงใช้เส้นทึบ และหลังเส้นแบ่งจะใช้เส้นประสำหรับการคาดการณ์",
      };
    }
    return {
      strategy: "预测策略",
      basisAdjustment: "基差修正（元/公斤）",
      historyWindow: "回看窗口",
      displayMetric: "趋势叠加",
      strategyOptions: { steady: "稳健", balanced: "基准", aggressive: "进取" },
      displayOptions: { projected: "保本线", average: "平均售价", profit: "公斤利润" },
      actualLine: "真实价格",
      forecastLine: "预测价格",
      splitLine: "预测分界",
      view4: "近 4 点",
      view6: "近 6 点",
      batchSnapshot: "决策快照",
      livePrice: "当前现货",
      effectiveTarget: "有效目标价",
      trendHint: "真实价格使用实线，经过分界竖线后的预测区间使用虚线显示，并可切换不同叠加指标。",
    };
  }, [language]);

  const queryInput = {
    batchCode,
    selectedMonth: Math.max(1, Math.min(3, scenarioMonthNumber)),
    targetPrice: targetPrice ?? 15,
    capacityAdjustment,
    demandAdjustment,
  };

  const utils = trpc.useUtils();
  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data, isLoading } = trpc.platform.aiForecast.useQuery(
    { batchCode, selectedMonth: selectedMonthNumber, targetPrice, strategy: forecastStrategy, basisAdjustment },
    { enabled: Boolean(batchCode) },
  );
  const { data: whatIfData, isLoading: whatIfLoading } = trpc.platform.aiWhatIf.useQuery(queryInput, { enabled: Boolean(batchCode) });
  const { data: alertsData } = trpc.platform.aiAlerts.useQuery(queryInput, { enabled: Boolean(batchCode) });
  const { data: dispatchData } = trpc.platform.aiDispatch.useQuery(queryInput, { enabled: Boolean(batchCode) });
  const { data: dispatchHistory } = trpc.platform.aiDispatchHistory.useQuery(
    { batchCode },
    { enabled: Boolean(batchCode) },
  );
  const persistDispatch = trpc.platform.persistAiDispatch.useMutation({
    onSuccess: async () => {
      await utils.platform.aiDispatchHistory.invalidate({ batchCode });
      await utils.platform.auditLogs.invalidate();
      toast.success("派单已落库，并已触发通知链路。");
    },
    onError: error => {
      toast.error(error.message || "派单落库失败，请稍后重试。");
    },
  });
  const updateDispatchReceiptMutation = trpc.platform.updateAiDispatchReceipt.useMutation({
    onSuccess: async result => {
      await utils.platform.aiDispatchHistory.invalidate({ batchCode });
      await utils.platform.auditLogs.invalidate();
      if (result.notifications.wecom === "sent" || result.notifications.sms === "sent") {
        toast.success("回执已更新，升级通知已发送。", { duration: 3500 });
        return;
      }
      toast.success("回执状态已更新。", { duration: 2500 });
    },
    onError: error => {
      toast.error(error.message || "回执更新失败，请稍后重试。");
    },
  });
  const aiAgents = trpc.platform.aiAgents.useMutation();

  const effectiveDispatchData = persistDispatch.data ?? dispatchData;
  const dispatchJson = useMemo(() => JSON.stringify(effectiveDispatchData?.workOrders ?? [], null, 2), [effectiveDispatchData]);
  const chartWindowSize = useMemo(() => Math.max(2, Number(historyWindow)), [historyWindow]);
  const chartData = useMemo(() => {
    const timeline = data?.timeline ?? [];
    const actualSeries = timeline.filter(point => point.phase === "actual");
    const forecastSeries = timeline.filter(point => point.phase === "forecast");
    return [...actualSeries.slice(Math.max(0, actualSeries.length - chartWindowSize)), ...forecastSeries];
  }, [chartWindowSize, data?.timeline]);
  const splitLabel = useMemo(() => chartData.find(point => point.phase === "actual" && point.step === 0)?.label ?? "当前", [chartData]);
  const selectedForecastPoint = useMemo(
    () => data?.curve.find(point => point.month === selectedMonthNumber) ?? data?.curve[data?.curve.length ? data.curve.length - 1 : 0],
    [data?.curve, selectedMonthNumber],
  );

  const persistedFeedback = useMemo(() => {
    if (!dispatchHistory?.length) {
      return (effectiveDispatchData?.feedback ?? []).map(item => ({
        orderId: `preview-${item.role}`,
        role: item.role,
        status: item.status,
        etaMinutes: item.etaMinutes,
        note: item.note,
        priority: "P2",
      }));
    }

    return dispatchHistory
      .map(order => {
        const latest = order.receipts[0];
        if (!latest) {
          return undefined;
        }
        return {
          orderId: order.orderId,
          role: latest.role,
          status: latest.status,
          etaMinutes: latest.etaMinutes,
          note: latest.note,
          priority: order.priority,
        };
      })
      .filter((item): item is MobileRoleFeedback => Boolean(item));
  }, [dispatchHistory, effectiveDispatchData]);

  const notificationStatus = persistDispatch.data?.notifications;
  const mobileRoleTabs = useMemo(
    () => [
      { role: "厂长" as const, label: language === "en" ? "Plant" : "厂长" },
      { role: "司机" as const, label: language === "en" ? "Driver" : "司机" },
      { role: "仓储管理员" as const, label: language === "en" ? "Warehouse" : "仓储" },
    ],
    [language],
  );
  const mobileRoleFeedbackMap = useMemo<Record<MobileRole, MobileRoleFeedback>>(() => {
    const factoryFeedback = persistedFeedback.find(item => item.role === "厂长");
    const driverFeedback = persistedFeedback.find(item => item.role === "司机");
    const warehouseFeedback = persistedFeedback.find(item => item.role === "仓储管理员");

    return {
      厂长: factoryFeedback ?? {
        orderId: "preview-厂长",
        role: "厂长",
        status: "待确认",
        etaMinutes: 25,
        note: "等待厂长确认派单与预警联动。",
        priority: "P1",
      },
      司机: driverFeedback ?? {
        orderId: "preview-司机",
        role: "司机",
        status: "待确认",
        etaMinutes: 45,
        note: "等待司机确认装车与配送路线。",
        priority: "P2",
      },
      仓储管理员: warehouseFeedback ?? {
        orderId: "preview-仓储",
        role: "仓储管理员",
        status: "待确认",
        etaMinutes: 35,
        note: "等待仓储管理员确认入库回执。",
        priority: "P2",
      },
    };
  }, [persistedFeedback]);
  const activeMobileRoleFeedback = mobileRoleFeedbackMap[mobileRole];
  const mobileRoleView = useMemo(
    () => buildMobileRoleView({
      language,
      role: mobileRole,
      feedback: activeMobileRoleFeedback,
      alertsCount: alertsData?.items.length ?? 0,
      projectedPrice: data?.summary.projectedPrice ?? 0,
      incrementalProfit: whatIfData?.summary.incrementalProfit ?? 0,
      workOrderCount: effectiveDispatchData?.workOrders.length ?? 0,
    }),
    [activeMobileRoleFeedback, alertsData?.items.length, data?.summary.projectedPrice, effectiveDispatchData?.workOrders.length, language, mobileRole, whatIfData?.summary.incrementalProfit],
  );

  const runAiAgents = () => {
    aiAgents.mutate(queryInput);
  };

  const persistCurrentDispatch = () => {
    persistDispatch.mutate(queryInput);
  };

  const updateRoleReceipt = (
    role: "厂长" | "司机" | "仓储管理员",
    status: "已接单" | "已完成" | "超时升级",
    orderId?: string,
  ) => {
    if (!orderId) {
      toast.error("当前角色尚未生成可更新的工单。", { duration: 2500 });
      return;
    }

    updateDispatchReceiptMutation.mutate({
      orderId,
      role,
      status,
      etaMinutes: status === "已完成" ? 0 : status === "超时升级" ? 90 : 25,
      note:
        status === "已完成"
          ? `${role} 已完成签收回执并留痕。`
          : status === "超时升级"
            ? `${role} 工单超时，已触发升级通知。`
            : `${role} 已确认接单，准备执行。`,
      acknowledgedBy: status === "已接单" ? `${role}-现场确认` : undefined,
      receiptBy: status === "已完成" ? `${role}-签收回执` : undefined,
    });
  };

  return (
    <PlatformShell eyebrow={current.eyebrow} title={current.title} pageId="ai">
      <SectionHeader
        eyebrow={current.sectionEyebrow}
        title={current.sectionTitle}
        description={current.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">{current.navReady}</Badge>
            <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">{current.chartReady}</Badge>
            <Badge className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-200">{current.whatIfReady}</Badge>
            <Badge className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold text-violet-200">{current.agentsReady}</Badge>
            <Badge className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold text-rose-100">{current.alertsReady}</Badge>
            <Badge className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">{current.nextPending}</Badge>
          </div>
        }
      />

      <GlassPanel>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.workbench}</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.workbench} · {current.chartTitle}</h4>
              <p className="mt-3 max-w-3xl text-[13px] leading-6 text-slate-400">{current.formulaHint}</p>
            </div>
            <div className="grid min-w-[240px] gap-3 sm:grid-cols-2 xl:w-[360px]">
              <div className="rounded-[20px] border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">{current.currentMonth}</p>
                <p className="mt-2 text-xl font-semibold text-white">{data?.selectedMonth ?? selectedMonthNumber} {current.monthUnit}</p>
                <p className="mt-1 text-[12px] text-cyan-50/75">{current.perKgProfit} ¥{selectedForecastPoint ? selectedForecastPoint.profitPerKg.toFixed(2) : "--"}</p>
              </div>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{forecastUi.batchSnapshot}</p>
                <p className="mt-2 text-base font-semibold text-white">{data?.batch.partName ?? batchCode}</p>
                <p className="mt-1 text-[12px] text-slate-400">{forecastUi.livePrice} ¥{data?.summary.currentSpotPrice.toFixed(2) ?? "--"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{current.selectBatch}</p>
              <Select value={batchCode} onValueChange={setBatchCode}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"><SelectValue placeholder={current.selectBatch} /></SelectTrigger>
                <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                  {(snapshot?.inventoryBatches ?? []).map(batch => <SelectItem key={batch.batchCode} value={batch.batchCode}>{batch.batchCode}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{current.selectMonth}</p>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"><SelectValue placeholder={current.selectMonth} /></SelectTrigger>
                <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                  {Array.from({ length: 8 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{index + 1} {current.monthUnit}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{current.targetPrice}</p>
              <Input value={targetPriceInput} onChange={event => setTargetPriceInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{forecastUi.strategy}</p>
              <Select value={forecastStrategy} onValueChange={value => setForecastStrategy(value as ForecastStrategy)}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"><SelectValue placeholder={forecastUi.strategy} /></SelectTrigger>
                <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                  <SelectItem value="steady">{forecastUi.strategyOptions.steady}</SelectItem>
                  <SelectItem value="balanced">{forecastUi.strategyOptions.balanced}</SelectItem>
                  <SelectItem value="aggressive">{forecastUi.strategyOptions.aggressive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{forecastUi.basisAdjustment}</p>
              <Input value={basisAdjustmentInput} onChange={event => setBasisAdjustmentInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">{forecastUi.historyWindow}</p>
              <Select value={historyWindow} onValueChange={setHistoryWindow}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"><SelectValue placeholder={forecastUi.historyWindow} /></SelectTrigger>
                <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                  <SelectItem value="4">{forecastUi.view4}</SelectItem>
                  <SelectItem value="6">{forecastUi.view6}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={forecastUi.livePrice} value={`¥${data?.summary.currentSpotPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={Radar} />
            <MetricCard label={current.projectedPrice} value={`¥${data?.summary.projectedPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={LineChartIcon} />
            <MetricCard label={current.breakEven} value={`¥${data?.summary.breakEvenPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={Calculator} />
            <MetricCard label={current.avgSell} value={`¥${data?.summary.averageSellPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={Factory} />
            <MetricCard label={current.profit} value={`¥${data?.summary.totalProfit.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={BrainCircuit} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[24px] border border-white/[0.06] bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">{forecastUi.displayMetric}</p>
                  <p className="mt-2 text-sm text-slate-400">{forecastUi.trendHint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["projected", forecastUi.displayOptions.projected],
                    ["average", forecastUi.displayOptions.average],
                    ["profit", forecastUi.displayOptions.profit],
                  ] as Array<[ForecastDisplayMetric, string]>).map(([metric, label]) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setDisplayMetric(metric)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${displayMetric === metric ? "border-cyan-400/30 bg-cyan-400/[0.1] text-cyan-100" : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="price" stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={["dataMin - 0.8", "dataMax + 0.8"]} />
                    <YAxis yAxisId="profit" orientation="right" hide={displayMetric !== "profit"} stroke="rgba(148,163,184,0.55)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, fontSize: 11 }} />
                    <ReferenceLine x={splitLabel} yAxisId="price" stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" label={{ value: forecastUi.splitLine, position: "insideTop", fill: "rgba(226,232,240,0.7)", fontSize: 10 }} />
                    <Line yAxisId="price" type="monotone" dataKey="actualPrice" name={forecastUi.actualLine} stroke="#f8fafc" strokeWidth={2.2} dot={false} connectNulls={false} />
                    <Line yAxisId="price" type="monotone" dataKey="projectedPrice" name={forecastUi.forecastLine} stroke="#38bdf8" strokeWidth={2.4} strokeDasharray="7 5" dot={false} connectNulls />
                    {displayMetric === "projected" ? <Line yAxisId="price" type="monotone" dataKey="breakEvenPrice" name={current.chartBreakEven} stroke="#f59e0b" strokeWidth={1.6} dot={false} connectNulls strokeDasharray="5 3" /> : null}
                    {displayMetric === "average" ? <Line yAxisId="price" type="monotone" dataKey="averageSellPrice" name={current.avgSell} stroke="#c084fc" strokeWidth={1.8} dot={false} connectNulls /> : null}
                    {displayMetric === "profit" ? <Line yAxisId="profit" type="monotone" dataKey="profitPerKg" name={forecastUi.displayOptions.profit} stroke="#34d399" strokeWidth={1.8} dot={false} connectNulls /> : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.batchInfo}</p>
                <p className="mt-3 text-base font-semibold text-white">{data?.batch.partName ?? batchCode}</p>
                <div className="mt-4 space-y-2 text-[13px] text-slate-400">
                  <div className="flex items-center justify-between gap-3"><span>{current.weight}</span><span className="font-medium text-slate-200">{data?.batch.weightKg.toLocaleString() ?? "--"} {current.tonnage}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>{current.monthlyCost}</span><span className="font-medium text-slate-200">¥{data?.monthlyHoldingCost.toFixed(2) ?? "--"}/{current.monthUnit}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>{forecastUi.effectiveTarget}</span><span className="font-medium text-slate-200">¥{data?.targetPrice.toFixed(2) ?? "--"}</span></div>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.chartDesc}</p>
                <div className="mt-4 space-y-3 text-[13px] text-slate-400">
                  <div className="flex items-center gap-2"><span className="h-[2px] w-7 rounded-full bg-white" /><span>{forecastUi.actualLine}</span></div>
                  <div className="flex items-center gap-2"><span className="h-[2px] w-7 rounded-full border-t-2 border-dashed border-cyan-300" /><span>{forecastUi.forecastLine}</span></div>
                  <div className="flex items-center gap-2"><span className="h-[2px] w-7 rounded-full border-t-2 border-dashed border-white/40" /><span>{forecastUi.splitLine}</span></div>
                </div>
              </div>
              <div className="rounded-[22px] border border-cyan-400/12 bg-cyan-400/[0.05] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/80">{current.currentMonth}</p>
                <p className="mt-3 text-base font-semibold text-white">{selectedForecastPoint?.label ?? `${selectedMonthNumber}M`}</p>
                <div className="mt-4 space-y-2 text-[13px] text-slate-300">
                  <div className="flex items-center justify-between gap-3"><span>{current.chartPrice}</span><span className="font-medium text-white">¥{selectedForecastPoint?.projectedPrice.toFixed(2) ?? "--"}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>{current.avgSell}</span><span className="font-medium text-white">¥{selectedForecastPoint?.averageSellPrice.toFixed(2) ?? "--"}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>{current.perKgProfit}</span><span className={`font-medium ${selectedForecastPoint && selectedForecastPoint.profitPerKg >= 0 ? "text-emerald-300" : "text-rose-300"}`}>¥{selectedForecastPoint?.profitPerKg.toFixed(2) ?? "--"}</span></div>
                </div>
              </div>
            </div>
          </div>
          {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        </div>
      </GlassPanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassPanel>
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-300/60">{current.whatIfEyebrow}</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.whatIfTitle}</h4>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.whatIfDesc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><p className="text-[11px] font-semibold text-slate-300">{current.scenarioMonth}</p><Select value={scenarioMonth} onValueChange={setScenarioMonth}><SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"><SelectValue placeholder={current.scenarioMonth} /></SelectTrigger><SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">{[1, 2, 3].map(month => <SelectItem key={month} value={String(month)}>{month} {current.monthUnit}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><p className="text-[11px] font-semibold text-slate-300">{current.targetPrice}</p><Input value={targetPriceInput} onChange={event => setTargetPriceInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" /></div>
              <div className="space-y-2"><p className="text-[11px] font-semibold text-slate-300">{current.capacityAdjustment}</p><Input value={capacityAdjustmentInput} onChange={event => setCapacityAdjustmentInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" /></div>
              <div className="space-y-2"><p className="text-[11px] font-semibold text-slate-300">{current.demandAdjustment}</p><Input value={demandAdjustmentInput} onChange={event => setDemandAdjustmentInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label={current.baselineProfit} value={`¥${whatIfData?.summary.baselineProfit.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={Calculator} />
              <MetricCard label={current.simulatedProfit} value={`¥${whatIfData?.summary.simulatedProfit.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={LineChartIcon} />
              <MetricCard label={current.incrementalProfit} value={`¥${whatIfData?.summary.incrementalProfit.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={BrainCircuit} />
              <MetricCard label={current.expectedRevenue} value={`¥${whatIfData?.summary.expectedRevenue.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={Factory} />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-300/60">{current.resourcesTitle}</p><h4 className="mt-3 text-xl font-bold tracking-tight text-white">{current.resourcesTitle}</h4></div>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.utilizationRate}</p><p className="mt-2 text-lg font-semibold text-white">{whatIfData?.summary.utilizationRate.toFixed(2) ?? "--"}%</p></div>
            </div>
            <div className="rounded-[24px] border border-white/[0.06] bg-slate-950/50 p-4">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={whatIfData?.resources ?? []} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={value => `${value}${current.monthShort}`} stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, fontSize: 11 }} />
                    <Bar dataKey="slaughterHeads" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="warehousePallets" fill="#c084fc" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(whatIfData?.resources ?? []).map(resource => <div key={resource.month} className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{resource.month}{current.monthShort}</p><div className="mt-4 space-y-3 text-[13px] text-slate-400"><div className="flex items-center justify-between gap-3"><span>{current.slaughterHeads}</span><span className="font-medium text-slate-100">{resource.slaughterHeads.toLocaleString()}</span></div><div className="flex items-center justify-between gap-3"><span>{current.freezingTons}</span><span className="font-medium text-slate-100">{resource.freezingTons.toFixed(2)} t</span></div><div className="flex items-center justify-between gap-3"><span>{current.storageTons}</span><span className="font-medium text-slate-100">{resource.storageTons.toFixed(2)} t</span></div><div className="flex items-center justify-between gap-3"><span>{current.warehousePallets}</span><span className="font-medium text-slate-100">{resource.warehousePallets}</span></div><div className="flex items-center justify-between gap-3"><span>{current.coldChainTrips}</span><span className="font-medium text-slate-100">{resource.coldChainTrips}</span></div></div></div>)}
            </div>
            {whatIfLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/60">{current.agentEyebrow}</p><h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.agentTitle}</h4><p className="mt-3 text-[13px] leading-6 text-slate-400">{current.agentDesc}</p></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.overview}</p><p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.overview ?? current.agentDesc}</p></div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.coordinationSignal}</p><p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.coordinationSignal ?? current.nextPending}</p></div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.dispatchSummary}</p><p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.dispatchSummary ?? current.generateAgents}</p></div>
            </div>
            <Button onClick={runAiAgents} disabled={aiAgents.isPending} className="h-12 rounded-2xl bg-violet-500/90 text-white hover:bg-violet-400">{aiAgents.isPending ? current.generatingAgents : current.generateAgents}</Button>
          </div>
        </GlassPanel>

        <div className="grid gap-6 xl:grid-cols-3">
          {(aiAgents.data?.agents ?? []).map((agent: AgentCard) => (
            <GlassPanel key={agent.agentId} className="h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">{agent.agentId === "global" ? <BrainCircuit className="h-5 w-5" /> : agent.agentId === "business" ? <Factory className="h-5 w-5" /> : <Truck className="h-5 w-5" />}</div><Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">{current.riskLevel} {agent.riskLevel}</Badge></div>
                <div><h4 className="text-lg font-semibold text-white">{agent.agentName}</h4><div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-400"><p><span className="font-semibold text-slate-200">{current.objective}：</span>{agent.objective}</p><p><span className="font-semibold text-slate-200">{current.recommendation}：</span>{agent.recommendation}</p><p><span className="font-semibold text-slate-200">{current.rationale}：</span>{agent.rationale}</p><p><span className="font-semibold text-slate-200">{current.nextAction}：</span>{agent.nextAction}</p></div></div>
              </div>
            </GlassPanel>
          ))}
          {current.modules.map(module => { const Icon = module.icon; return <GlassPanel key={module.title} className="h-full"><div className="flex h-full flex-col gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200"><Icon className="h-5 w-5" /></div><div><h4 className="text-lg font-semibold text-white">{module.title}</h4><p className="mt-3 text-[13px] leading-6 text-slate-400">{module.desc}</p></div></div></GlassPanel>; })}
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:hidden">
        <GlassPanel className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">Mobile War-Room</p>
              <h4 className="mt-3 text-lg font-semibold text-white">{language === "en" ? "Mobile role views" : "移动端角色视图"}</h4>
              <p className="mt-2 text-[12px] leading-5 text-slate-400">{language === "en" ? "Switch between plant, driver, and warehouse roles to execute work orders on site." : "在厂长、司机与仓储管理员之间切换，直接完成现场工单执行。"}</p>
            </div>
            <Badge className={`rounded-full border px-3 py-1 text-[10px] ${getRoleStatusBadgeClass(activeMobileRoleFeedback.status)}`}>{activeMobileRoleFeedback.status}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-[22px] border border-white/[0.06] bg-slate-950/55 p-2">
            {mobileRoleTabs.map(tab => (
              <button
                key={tab.role}
                type="button"
                onClick={() => setMobileRole(tab.role)}
                className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition-colors ${mobileRole === tab.role ? "bg-cyan-400/15 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "bg-white/[0.03] text-slate-400"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(6,14,30,0.92)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">{mobileRoleView.modeEyebrow}</p>
                <h5 className="mt-3 text-lg font-semibold text-white">{mobileRoleView.modeTitle}</h5>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-100">
                {mobileRole === "厂长" ? <Factory className="h-5 w-5" /> : mobileRole === "司机" ? <Truck className="h-5 w-5" /> : <Warehouse className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-400">{mobileRoleView.primaryMetricLabel}</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-white">{mobileRoleView.primaryMetricValue}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-400">{mobileRoleView.secondaryMetricLabel}</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-white">{mobileRoleView.secondaryMetricValue}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-slate-950/45 p-3 text-[12px] leading-6 text-slate-300">
              <p><span className="font-semibold text-slate-100">{mobileRoleView.summaryLabel}：</span>{mobileRoleView.summaryValue}</p>
              <p className="mt-2"><span className="font-semibold text-slate-100">ETA：</span>{language === "en" ? `${activeMobileRoleFeedback.etaMinutes} min` : `${activeMobileRoleFeedback.etaMinutes} 分钟`}</p>
              <p className="mt-2"><span className="font-semibold text-slate-100">{language === "en" ? "Note" : "说明"}：</span>{activeMobileRoleFeedback.note}</p>
              <p className="mt-2"><span className="font-semibold text-slate-100">{language === "en" ? "Order" : "工单"}：</span>{activeMobileRoleFeedback.orderId}</p>
            </div>

            <p className="mt-4 text-[12px] leading-5 text-slate-400">{mobileRoleView.helperText}</p>

            <div className="mt-4 grid gap-2">
              {mobileRoleView.actions.map(action => (
                <Button
                  key={`${mobileRole}-${action.status}`}
                  type="button"
                  variant="outline"
                  className={getActionButtonClass(action.tone)}
                  onClick={() => updateRoleReceipt(mobileRole, action.status, activeMobileRoleFeedback.orderId)}
                  disabled={updateDispatchReceiptMutation.isPending}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-300/60">{current.alertEyebrow}</p><h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.alertTitle}</h4><p className="mt-3 text-[13px] leading-6 text-slate-400">{current.alertDesc}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] text-rose-200"><Siren className="h-5 w-5" /></div></div>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.alertOverview}</p><p className="mt-3 text-sm leading-7 text-slate-300">{alertsData?.overview ?? current.closeHint}</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {(alertsData?.items ?? []).slice(0, 3).map((alert: AlertCard) => {
                const colors = getAlertColors(alert.status);
                return <button key={alert.alertId} onClick={() => setActiveAlert(alert)} className={`rounded-[22px] border p-4 text-left transition-all hover:translate-y-[-2px] ${colors.panel}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">{alert.title}</p><Badge className={`rounded-full px-2 py-1 text-[10px] ${colors.badge}`}>{alert.status === "red" ? current.alertStatusRed : alert.status === "yellow" ? current.alertStatusYellow : current.alertStatusGreen}</Badge></div><p className="mt-4 text-[12px] leading-6 text-slate-300">{alert.summary}</p></button>;
              })}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="grid gap-4 md:grid-cols-3">
            {(alertsData?.items ?? []).map((alert: AlertCard) => {
              const colors = getAlertColors(alert.status);
              return <button key={alert.alertId} onClick={() => setActiveAlert(alert)} className={`rounded-[22px] border p-4 text-left transition-all hover:translate-y-[-2px] ${colors.panel}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">{alert.title}</p><Badge className={`rounded-full px-2 py-1 text-[10px] ${colors.badge}`}>{alert.status === "red" ? current.alertStatusRed : alert.status === "yellow" ? current.alertStatusYellow : current.alertStatusGreen}</Badge></div><p className="mt-3 text-[12px] leading-6 text-slate-300">{alert.summary}</p><p className="mt-3 text-[12px] text-slate-400">{current.impactScope}：{alert.impactScope}</p><p className="mt-1 text-[12px] text-slate-400">{current.estimatedLoss}：¥{alert.estimatedLoss.toLocaleString()}</p></button>;
            })}
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="xl:col-span-2 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <GlassPanel className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/70">Device Ready</p>
            <h4 className="mt-3 text-xl font-bold tracking-tight text-white">工业平板与战房大屏适配</h4>
            <p className="mt-3 text-[13px] leading-6 text-slate-400">当前布局已按移动端、工业平板和桌面战房进行分层编排：移动端优先显示关键 KPI，平板端保持双列执行卡片，桌面端延续全量分析工作台。</p>
          </GlassPanel>
          <GlassPanel className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/70">Notification Entry</p>
            <h4 className="mt-3 text-xl font-bold tracking-tight text-white">企业微信 / 短信告警升级链路</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">企业微信提醒</p>
                  <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">{notificationStatus?.wecom ?? "待触发"}</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-slate-400">红色预警与超时升级会在派单落库或执行回执升级时自动触发企业微信机器人通知；未配置密钥时会自动记录为 skipped。</p>
              </div>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">短信提醒</p>
                  <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">{notificationStatus?.sms ?? "待触发"}</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-slate-400">短信链路会在高风险预警与工单超时升级时向负责人推送摘要，落库与回执升级均会写入通知投递记录。</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300/60">Dispatch & Feedback</p>
                <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">自动派单调度与执行反馈</h4>
                <p className="mt-3 text-[13px] leading-6 text-slate-400">系统会把当前模拟结果转换成标准化 JSON 工单，并同步展示厂长、司机、仓储管理员三类角色的执行状态与超时升级信号。</p>
              </div>
              <Badge className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${dispatchData?.escalation ? "border-rose-400/20 bg-rose-400/10 text-rose-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>{dispatchData?.escalation ? "已触发超时升级" : "执行链路正常"}</Badge>
            </div>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Dispatch Summary</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{effectiveDispatchData?.summary ?? "等待派单数据返回"}</p>
                </div>
                <Button
                  type="button"
                  onClick={persistCurrentDispatch}
                  disabled={persistDispatch.isPending}
                  className="rounded-full bg-cyan-500/90 px-4 text-slate-950 hover:bg-cyan-400"
                >
                  {persistDispatch.isPending ? "正在落库与通知..." : "落库并通知负责人"}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Persistence</p>
                  <p className="mt-2 text-sm font-semibold text-white">{persistDispatch.data?.persistence.persisted ? "已写入数据库" : "待落库"}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">WeCom</p>
                  <p className="mt-2 text-sm font-semibold text-white">{notificationStatus?.wecom ?? "待触发"}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">SMS</p>
                  <p className="mt-2 text-sm font-semibold text-white">{notificationStatus?.sms ?? "待触发"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/[0.06] bg-slate-950/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Work Order JSON</p>
              <pre className="mt-3 overflow-x-auto text-[12px] leading-6 text-slate-300">{dispatchJson}</pre>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300/60">Execution Tracker</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">角色执行反馈与状态追踪</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {persistedFeedback.map(item => (
                <div key={`${item.role}-${item.orderId}`} className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{item.role}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.priority}</p>
                    </div>
                    <Badge className={`rounded-full px-2 py-1 text-[10px] ${getRoleStatusBadgeClass(item.status)}`}>{item.status}</Badge>
                  </div>
                  <div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-400">
                    <p><span className="font-semibold text-slate-200">ETA：</span>{item.etaMinutes} 分钟</p>
                    <p><span className="font-semibold text-slate-200">说明：</span>{item.note}</p>
                    <p><span className="font-semibold text-slate-200">工单：</span>{item.orderId}</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Button type="button" variant="outline" className="rounded-full border-white/[0.12] bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]" onClick={() => updateRoleReceipt(item.role, "已接单", item.orderId)} disabled={updateDispatchReceiptMutation.isPending}>确认接单</Button>
                    <Button type="button" variant="outline" className="rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/20" onClick={() => updateRoleReceipt(item.role, "已完成", item.orderId)} disabled={updateDispatchReceiptMutation.isPending}>完成签收</Button>
                    <Button type="button" variant="outline" className="rounded-full border-rose-400/20 bg-rose-400/10 text-rose-50 hover:bg-rose-400/20" onClick={() => updateRoleReceipt(item.role, "超时升级", item.orderId)} disabled={updateDispatchReceiptMutation.isPending}>超时升级</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-20 md:hidden">
        <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-white/10 bg-slate-950/80 p-2 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">预警</p>
            <p className="mt-1 text-sm font-semibold text-white">{alertsData?.items.length ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">工单</p>
            <p className="mt-1 text-sm font-semibold text-white">{effectiveDispatchData?.workOrders.length ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Agent</p>
            <p className="mt-1 text-sm font-semibold text-white">{aiAgents.data?.agents.length ?? 3}</p>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(activeAlert)} onOpenChange={open => !open && setActiveAlert(null)}>
        <DialogContent className="max-w-2xl rounded-[28px] border-white/10 bg-[#081122] text-white">
          <DialogHeader>
            <DialogTitle>{activeAlert?.title ?? current.alertTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">{current.closeHint}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{current.impactScope}</p><p className="mt-3 text-sm leading-7 text-slate-200">{activeAlert?.impactScope}</p></div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{current.estimatedLoss}</p><p className="mt-3 text-sm leading-7 text-slate-200">¥{activeAlert?.estimatedLoss.toLocaleString() ?? "--"}</p></div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{current.aiRecommendation}</p><p className="mt-3 text-sm leading-7 text-slate-200">{activeAlert?.aiRecommendation}</p></div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{current.actionOwner}</p><p className="mt-3 text-sm leading-7 text-slate-200">{activeAlert?.actionOwner}</p></div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{current.rootCause}</p><p className="mt-3 text-sm leading-7 text-slate-200">{activeAlert?.rootCause}</p></div>
        </DialogContent>
      </Dialog>
    </PlatformShell>
  );
}
