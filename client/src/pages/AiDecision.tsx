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
    sectionTitle: "先输入月份与预估价格，再生成价格波动曲线与 What-If 情景收益测算",
    sectionDesc:
      "本页已升级为独立 AI 决策工作台。上半区负责 1 到 8 个月价格预测与利润联动，下半区负责多变量 What-If 沙盘推演，并自动估算未来 1 到 3 个月所需的屠宰与仓储资源。",
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
    strategyTitle: "多 Agent 模块预留区",
    strategyDesc: "完成 What-If 情景模拟后，下一阶段将在本页继续接入多 Agent 推理、预警与派单反馈。",
    modules: [
      { icon: BrainCircuit, title: "多 Agent 推理", desc: "下一阶段输出总部、业务与现场三级决策建议。" },
      { icon: ShieldAlert, title: "红黄绿预警", desc: "基于阈值变化显示九宫格状态与异常重点。" },
      { icon: Truck, title: "派单与执行反馈", desc: "把 AI 决策转成标准工单并回收执行状态。" },
      { icon: Warehouse, title: "现场资源编排", desc: "把屠宰、速冻、仓储和冷链资源联成闭环。" },
    ],
    navReady: "预测工作台已联通",
    chartReady: "曲线已生成",
    whatIfReady: "What-If 沙盘已联通",
    nextPending: "等待接入多 Agent 与预警联动",
    monthShort: "月",
  },
  en: {
    eyebrow: "AI Decision OS",
    title: "AI Decision Command Center",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "Forecast price curves and What-If results from month and target inputs",
    sectionDesc:
      "This page is now an independent AI decision workspace. The top area handles 1-8 month forecast curves and profit linkage, while the lower area runs multi-variable What-If simulations and automatically estimates slaughter and storage resources for the next 1-3 months.",
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
    strategyTitle: "Reserved Multi-Agent Modules",
    strategyDesc: "After What-If simulation, the next phase will attach multi-agent reasoning, warnings, and dispatch feedback here.",
    modules: [
      { icon: BrainCircuit, title: "Multi-Agent Reasoning", desc: "Next phase will output strategic, orchestration, and field recommendations." },
      { icon: ShieldAlert, title: "Traffic-light Warnings", desc: "Threshold changes will drive nine-grid state visibility and anomaly focus." },
      { icon: Truck, title: "Dispatch & Feedback", desc: "AI decisions will become standardized jobs with execution status feedback." },
      { icon: Warehouse, title: "Resource Orchestration", desc: "Slaughter, freezing, storage, and cold-chain plans will be connected in one loop." },
    ],
    navReady: "Forecast workspace connected",
    chartReady: "Curve generated",
    whatIfReady: "What-If sandbox connected",
    nextPending: "Waiting for multi-agent and warning linkage",
    monthShort: "M",
  },
  ja: {
    eyebrow: "AI Decision OS",
    title: "AI意思決定コマンドセンター",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "月数と価格入力から予測曲線と What-If 結果を生成",
    sectionDesc:
      "このページは独立したAI意思決定ワークスペースに拡張されました。上段は1〜8か月の価格予測、下段は価格・能力・需要を同時に変える What-If 推演と 1〜3 か月の資源見積りを担います。",
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
    whatIfDesc: "価格、能力、需要を同時に調整し、利益差分と 1〜3 か月の屠殺・凍結・保管・冷鏈資源を自動算出します。",
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
    strategyTitle: "多エージェント予備領域",
    strategyDesc: "What-If 完了後、次段階で多エージェント推論、警報、配車フィードバックを接続します。",
    modules: [
      { icon: BrainCircuit, title: "多エージェント推論", desc: "次段階で本部・業務・現場の提案を出力します。" },
      { icon: ShieldAlert, title: "赤黄緑警報", desc: "閾値変化に応じて九宮格状態と異常重点を表示します。" },
      { icon: Truck, title: "配車と実行反馈", desc: "AI判断を標準工単へ変換し、実行状態を回収します。" },
      { icon: Warehouse, title: "現場資源編成", desc: "屠殺、凍結、保管、冷鏈を一つの循環に連結します。" },
    ],
    navReady: "予測ワークベンチ接続済み",
    chartReady: "曲線生成済み",
    whatIfReady: "What-If 接続済み",
    nextPending: "多エージェントと警報連携待ち",
    monthShort: "月",
  },
  th: {
    eyebrow: "AI Decision OS",
    title: "ศูนย์บัญชาการการตัดสินใจ AI",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "สร้างกราฟคาดการณ์และผล What-If จากเดือนและราคาเป้าหมาย",
    sectionDesc:
      "หน้านี้ถูกขยายเป็นพื้นที่ทำงานการตัดสินใจ AI แบบแยกอิสระ ส่วนบนดูแลการคาดการณ์ราคา 1-8 เดือน ส่วนล่างรองรับการจำลอง What-If หลายตัวแปรและประมาณทรัพยากรเชือด แช่แข็ง และคลังสำหรับ 1-3 เดือนถัดไป",
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
    strategyTitle: "พื้นที่โมดูลหลายเอเจนต์",
    strategyDesc: "หลังจาก What-If ขั้นถัดไปจะเชื่อมตรรกะหลายเอเจนต์ คำเตือน และฟีดแบ็กการสั่งงานที่หน้านี้",
    modules: [
      { icon: BrainCircuit, title: "การให้เหตุผลหลายเอเจนต์", desc: "ขั้นถัดไปจะแสดงข้อเสนอระดับกลยุทธ์ ธุรกิจ และหน้างาน" },
      { icon: ShieldAlert, title: "คำเตือนสามสี", desc: "การเปลี่ยนแปลงค่าเกณฑ์จะขับการมองเห็นสถานะและความผิดปกติในเก้าช่อง" },
      { icon: Truck, title: "การสั่งงานและฟีดแบ็ก", desc: "การตัดสินใจ AI จะกลายเป็นงานมาตรฐานพร้อมสถานะการปฏิบัติ" },
      { icon: Warehouse, title: "การจัดทรัพยากรหน้างาน", desc: "เชื่อมการเชือด แช่แข็ง จัดเก็บ และห้องเย็นในลูปเดียว" },
    ],
    navReady: "เชื่อมโต๊ะคาดการณ์แล้ว",
    chartReady: "สร้างกราฟแล้ว",
    whatIfReady: "เชื่อม What-If แล้ว",
    nextPending: "รอหลายเอเจนต์และการเตือน",
    monthShort: "ด.",
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
                <Input
                  value={targetPriceInput}
                  onChange={event => setTargetPriceInput(event.target.value)}
                  className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-slate-100"
                />
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
                      <Tooltip
                        contentStyle={{
                          background: "#0a1628",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 16,
                          fontSize: 11,
                        }}
                      />
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
                    <Tooltip
                      contentStyle={{
                        background: "#0a1628",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        fontSize: 11,
                      }}
                    />
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

      <div className="mt-6 grid gap-6 xl:grid-cols-4">
        <GlassPanel className="xl:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.strategyTitle}</p>
              <h4 className="mt-3 text-xl font-bold tracking-tight text-white">{current.strategyTitle}</h4>
            </div>
            <Button variant="outline" className="rounded-xl border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06] hover:text-white">{current.nextPending}</Button>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.strategyDesc}</p>
        </GlassPanel>

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
    </PlatformShell>
  );
}
