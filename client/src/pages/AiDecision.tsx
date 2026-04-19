import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import {
  BrainCircuit,
  Calculator,
  Factory,
  LineChart as LineChartIcon,
  Radar,
  ShieldAlert,
  Truck,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
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

const copy = {
  zh: {
    eyebrow: "AI Decision OS",
    title: "AI 决策指挥中枢",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "先输入月份与预估价格，再生成价格波动曲线、What-If 沙盘与多 Agent 推理",
    sectionDesc:
      "本页已升级为独立 AI 决策工作台。上半区负责 1 到 8 个月价格预测与利润联动，中部负责多变量 What-If 沙盘推演，下半区接入 Manus LLM 驱动的多 Agent 决策输出。",
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
    navReady: "预测工作台已联通",
    chartReady: "曲线已生成",
    whatIfReady: "What-If 沙盘已联通",
    agentsReady: "多 Agent 已接入",
    nextPending: "等待接入预警与派单联动",
    monthShort: "月",
    modules: [
      { icon: ShieldAlert, title: "红黄绿预警", desc: "下一阶段接入九宫格告警、阈值变化和风险升级判断。" },
      { icon: Truck, title: "派单与执行反馈", desc: "把多 Agent 结论转换成工单、回传和闭环追踪。" },
      { icon: Warehouse, title: "现场资源编排", desc: "继续强化屠宰、仓储、冷链和现场班次之间的联动。" },
    ],
  },
  en: {
    eyebrow: "AI Decision OS",
    title: "AI Decision Command Center",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "Generate forecast curves, What-If simulations, and multi-agent reasoning from the same workspace",
    sectionDesc:
      "This page is now an independent AI decision workspace. The top area handles 1-8 month forecast curves, the middle area runs multi-variable What-If simulations, and the lower area calls Manus LLM for multi-agent decision outputs.",
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
    navReady: "Forecast workspace connected",
    chartReady: "Curve generated",
    whatIfReady: "What-If sandbox connected",
    agentsReady: "Multi-agent connected",
    nextPending: "Waiting for alerts and dispatch linkage",
    monthShort: "M",
    modules: [
      { icon: ShieldAlert, title: "Traffic-light Warnings", desc: "Next phase adds nine-grid alerts, threshold changes, and escalation logic." },
      { icon: Truck, title: "Dispatch & Feedback", desc: "Convert multi-agent outputs into jobs, feedback loops, and closed-loop tracking." },
      { icon: Warehouse, title: "Field Resource Orchestration", desc: "Further connect slaughter, storage, cold-chain, and field shifts." },
    ],
  },
  ja: {
    eyebrow: "AI Decision OS",
    title: "AI意思決定コマンドセンター",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "同一ワークスペースで予測曲線、What-If、マルチエージェント推論を生成",
    sectionDesc:
      "このページは独立したAI意思決定ワークスペースです。上段は1〜8か月の価格予測、中段は多変量 What-If、下段は Manus LLM によるマルチエージェント出力を担います。",
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
    navReady: "予測ワークベンチ接続済み",
    chartReady: "曲線生成済み",
    whatIfReady: "What-If 接続済み",
    agentsReady: "多エージェント接続済み",
    nextPending: "警報と配車連携待ち",
    monthShort: "月",
    modules: [
      { icon: ShieldAlert, title: "赤黄緑警報", desc: "次段階で九宮格警報、閾値変化、エスカレーション判断を追加します。" },
      { icon: Truck, title: "配車と実行反馈", desc: "多エージェント出力を工単と進捗回収へ接続します。" },
      { icon: Warehouse, title: "現場資源編成", desc: "屠殺、保管、冷鏈、班次の連動をさらに強化します。" },
    ],
  },
  th: {
    eyebrow: "AI Decision OS",
    title: "ศูนย์บัญชาการการตัดสินใจ AI",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "สร้างกราฟคาดการณ์ What-If และตรรกะหลายเอเจนต์จากพื้นที่ทำงานเดียว",
    sectionDesc:
      "หน้านี้เป็นพื้นที่ทำงานการตัดสินใจ AI แบบอิสระ ส่วนบนคือการคาดการณ์ 1-8 เดือน ส่วนกลางคือ What-If หลายตัวแปร และส่วนล่างเรียก Manus LLM เพื่อสร้างผลลัพธ์หลายเอเจนต์",
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
    navReady: "เชื่อมโต๊ะคาดการณ์แล้ว",
    chartReady: "สร้างกราฟแล้ว",
    whatIfReady: "เชื่อม What-If แล้ว",
    agentsReady: "เชื่อมหลายเอเจนต์แล้ว",
    nextPending: "รอการเตือนและการเชื่อมงาน",
    monthShort: "ด.",
    modules: [
      { icon: ShieldAlert, title: "คำเตือนสามสี", desc: "ระยะถัดไปจะเพิ่มเก้าช่องเตือน การเปลี่ยนค่าเกณฑ์ และตรรกะยกระดับ" },
      { icon: Truck, title: "การสั่งงานและฟีดแบ็ก", desc: "แปลงผลลัพธ์หลายเอเจนต์เป็นงานและการติดตามแบบปิดลูป" },
      { icon: Warehouse, title: "การจัดทรัพยากรหน้างาน", desc: "เชื่อมการเชือด คลัง ห้องเย็น และกะทำงานให้แน่นขึ้น" },
    ],
  },
} as const;

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: typeof Calculator;
}) {
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

export default function AiDecisionPage() {
  const { language } = useLanguage();
  const current = copy[language];
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [targetPriceInput, setTargetPriceInput] = useState("15");
  const [scenarioMonth, setScenarioMonth] = useState("2");
  const [capacityAdjustmentInput, setCapacityAdjustmentInput] = useState("12");
  const [demandAdjustmentInput, setDemandAdjustmentInput] = useState("8");

  const selectedMonthNumber = useMemo(() => Number(selectedMonth), [selectedMonth]);
  const scenarioMonthNumber = useMemo(() => Number(scenarioMonth), [scenarioMonth]);
  const targetPrice = useMemo(() => {
    const parsed = Number(targetPriceInput);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [targetPriceInput]);
  const capacityAdjustment = useMemo(() => {
    const parsed = Number(capacityAdjustmentInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [capacityAdjustmentInput]);
  const demandAdjustment = useMemo(() => {
    const parsed = Number(demandAdjustmentInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [demandAdjustmentInput]);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data, isLoading } = trpc.platform.aiForecast.useQuery(
    {
      batchCode,
      selectedMonth: selectedMonthNumber,
      targetPrice,
    },
    { enabled: Boolean(batchCode) },
  );
  const { data: whatIfData, isLoading: whatIfLoading } = trpc.platform.aiWhatIf.useQuery(
    {
      batchCode,
      selectedMonth: Math.max(1, Math.min(3, scenarioMonthNumber)),
      targetPrice: targetPrice ?? 15,
      capacityAdjustment,
      demandAdjustment,
    },
    { enabled: Boolean(batchCode) },
  );
  const aiAgents = trpc.platform.aiAgents.useMutation();

  const runAiAgents = () => {
    aiAgents.mutate({
      batchCode,
      selectedMonth: Math.max(1, Math.min(3, scenarioMonthNumber)),
      targetPrice: targetPrice ?? 15,
      capacityAdjustment,
      demandAdjustment,
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
            <Badge className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">{current.nextPending}</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <GlassPanel>
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.workbench}</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.workbench}</h4>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.formulaHint}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.selectBatch}</p>
                <Select value={batchCode} onValueChange={setBatchCode}>
                  <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100">
                    <SelectValue placeholder={current.selectBatch} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                    {(snapshot?.inventoryBatches ?? []).map(batch => (
                      <SelectItem key={batch.batchCode} value={batch.batchCode}>
                        {batch.batchCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.selectMonth}</p>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100">
                    <SelectValue placeholder={current.selectMonth} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                    {Array.from({ length: 8 }, (_, index) => (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        {index + 1} {current.monthUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.targetPrice}</p>
                <Input value={targetPriceInput} onChange={event => setTargetPriceInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <MetricCard label={current.projectedPrice} value={`¥${data?.summary.projectedPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={LineChartIcon} />
              <MetricCard label={current.breakEven} value={`¥${data?.summary.breakEvenPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={Calculator} />
              <MetricCard label={current.avgSell} value={`¥${data?.summary.averageSellPrice.toFixed(2) ?? "--"}`} suffix={current.yuanPerKg} icon={Radar} />
              <MetricCard label={current.profit} value={`¥${data?.summary.totalProfit.toLocaleString() ?? "--"}`} suffix={current.tonnage} icon={BrainCircuit} />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.chartTitle}</p>
                <h4 className="mt-3 text-xl font-bold tracking-tight text-white">{current.chartTitle}</h4>
                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-400">{current.chartDesc}</p>
              </div>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.currentMonth}</p>
                <p className="mt-2 text-lg font-semibold text-white">{data?.selectedMonth ?? selectedMonthNumber} {current.monthUnit}</p>
                <p className="mt-1 text-[12px] text-slate-400">{current.perKgProfit} ¥{data?.summary.profitPerKg.toFixed(2) ?? "--"}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-[24px] border border-white/[0.06] bg-slate-950/50 p-4">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.curve ?? []} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={["dataMin - 0.6", "dataMax + 0.6"]} />
                      <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, fontSize: 11 }} />
                      <ReferenceLine y={data?.summary.breakEvenPrice} stroke="rgba(251,191,36,0.5)" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="projectedPrice" name={current.chartPrice} stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="breakEvenPrice" name={current.chartBreakEven} stroke="#f59e0b" strokeWidth={1.6} dot={false} strokeDasharray="6 3" />
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
                    <div className="flex items-center justify-between gap-3"><span>{current.targetPrice}</span><span className="font-medium text-slate-200">¥{data?.targetPrice.toFixed(2) ?? "--"}</span></div>
                  </div>
                </div>

                {(data?.curve ?? []).map(point => (
                  <button
                    key={point.month}
                    onClick={() => setSelectedMonth(String(point.month))}
                    className={`w-full rounded-[20px] border p-3 text-left transition-all ${point.month === selectedMonthNumber ? "border-cyan-400/30 bg-cyan-400/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{point.label}</p>
                      <p className={`text-sm font-semibold ${point.profitPerKg >= 0 ? "text-emerald-300" : "text-rose-300"}`}>¥{point.profitPerKg.toFixed(2)}/kg</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-slate-400">
                      <span>{current.chartPrice}</span>
                      <span className="text-slate-200">¥{point.projectedPrice.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassPanel>
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-300/60">{current.whatIfEyebrow}</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.whatIfTitle}</h4>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.whatIfDesc}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.scenarioMonth}</p>
                <Select value={scenarioMonth} onValueChange={setScenarioMonth}>
                  <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100">
                    <SelectValue placeholder={current.scenarioMonth} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/[0.08] bg-[rgba(8,16,32,0.98)] text-slate-100">
                    {[1, 2, 3].map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {month} {current.monthUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.targetPrice}</p>
                <Input value={targetPriceInput} onChange={event => setTargetPriceInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.capacityAdjustment}</p>
                <Input value={capacityAdjustmentInput} onChange={event => setCapacityAdjustmentInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-300">{current.demandAdjustment}</p>
                <Input value={demandAdjustmentInput} onChange={event => setDemandAdjustmentInput(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100" />
              </div>
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
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-300/60">{current.resourcesTitle}</p>
                <h4 className="mt-3 text-xl font-bold tracking-tight text-white">{current.resourcesTitle}</h4>
              </div>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.utilizationRate}</p>
                <p className="mt-2 text-lg font-semibold text-white">{whatIfData?.summary.utilizationRate.toFixed(2) ?? "--"}%</p>
              </div>
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
              {(whatIfData?.resources ?? []).map(resource => (
                <div key={resource.month} className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{resource.month}{current.monthShort}</p>
                  <div className="mt-4 space-y-3 text-[13px] text-slate-400">
                    <div className="flex items-center justify-between gap-3"><span>{current.slaughterHeads}</span><span className="font-medium text-slate-100">{resource.slaughterHeads.toLocaleString()}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{current.freezingTons}</span><span className="font-medium text-slate-100">{resource.freezingTons.toFixed(2)} t</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{current.storageTons}</span><span className="font-medium text-slate-100">{resource.storageTons.toFixed(2)} t</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{current.warehousePallets}</span><span className="font-medium text-slate-100">{resource.warehousePallets}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{current.coldChainTrips}</span><span className="font-medium text-slate-100">{resource.coldChainTrips}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {whatIfLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/60">{current.agentEyebrow}</p>
              <h4 className="mt-3 text-2xl font-bold tracking-tight text-white">{current.agentTitle}</h4>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.agentDesc}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.overview}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.overview ?? current.agentDesc}</p>
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.coordinationSignal}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.coordinationSignal ?? current.nextPending}</p>
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.dispatchSummary}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{aiAgents.data?.dispatchSummary ?? current.generateAgents}</p>
              </div>
            </div>

            <Button
              onClick={runAiAgents}
              disabled={aiAgents.isPending}
              className="h-12 rounded-2xl bg-violet-500/90 text-white hover:bg-violet-400"
            >
              {aiAgents.isPending ? current.generatingAgents : current.generateAgents}
            </Button>
          </div>
        </GlassPanel>

        <div className="grid gap-6 xl:grid-cols-3">
          {(aiAgents.data?.agents ?? []).map((agent: {
            agentId: "global" | "business" | "field";
            agentName: string;
            objective: string;
            recommendation: string;
            rationale: string;
            riskLevel: "低" | "中" | "高";
            nextAction: string;
          }) => (
            <GlassPanel key={agent.agentId} className="h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                    {agent.agentId === "global" ? <BrainCircuit className="h-5 w-5" /> : agent.agentId === "business" ? <Factory className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  </div>
                  <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">{current.riskLevel} {agent.riskLevel}</Badge>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{agent.agentName}</h4>
                  <div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-400">
                    <p><span className="font-semibold text-slate-200">{current.objective}：</span>{agent.objective}</p>
                    <p><span className="font-semibold text-slate-200">{current.recommendation}：</span>{agent.recommendation}</p>
                    <p><span className="font-semibold text-slate-200">{current.rationale}：</span>{agent.rationale}</p>
                    <p><span className="font-semibold text-slate-200">{current.nextAction}：</span>{agent.nextAction}</p>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}

          {current.modules.map(module => {
            const Icon = module.icon;
            return (
              <GlassPanel key={module.title} className="h-full">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{module.title}</h4>
                    <p className="mt-3 text-[13px] leading-6 text-slate-400">{module.desc}</p>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </div>
    </PlatformShell>
  );
}
