import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { BrainCircuit, Calculator, LineChart as LineChartIcon, Radar, ShieldAlert, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
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
    sectionTitle: "先输入月份与预估价格，再生成价格波动曲线与利润测算",
    sectionDesc:
      "该页面现在提供独立预测交互区，支持输入库存批次、持有月份和目标价格，并自动生成未来 1 到 8 个月的价格轨迹、利润、成本和平均售价联动结果。",
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
    chartDesc: "蓝线为预测售价，虚线为保本线，拖动输入即可观察不同月份的利润区间。",
    currentMonth: "当前选择",
    perKgProfit: "每公斤利润",
    weight: "库存量",
    chartPrice: "预测售价",
    chartBreakEven: "保本价",
    monthUnit: "个月",
    yuanPerKg: "元/公斤",
    tonnage: "kg",
    strategyTitle: "多 Agent 模块预留区",
    strategyDesc: "完成预测交互后，下一阶段将在本页继续接入沙盘推演、多 Agent 推理、预警与派单反馈。",
    modules: [
      { icon: BrainCircuit, title: "多 Agent 推理", desc: "在下一阶段输出总部、业务与现场三级决策建议。" },
      { icon: Radar, title: "What-If 模拟", desc: "继续扩展价格、产能、需求等变量推演。" },
      { icon: ShieldAlert, title: "预警与根因分析", desc: "接入红黄绿告警和异常根因弹窗。" },
      { icon: Truck, title: "派单与执行反馈", desc: "把 AI 决策转成标准化工单并回收进度状态。" },
    ],
    navReady: "预测工作台已联通",
    chartReady: "曲线已生成",
    nextPending: "等待接入 What-If 与多 Agent",
  },
  en: {
    eyebrow: "AI Decision OS",
    title: "AI Decision Command Center",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "Enter month and target price to generate forecast curves and profit estimates",
    sectionDesc:
      "The page now provides an interactive forecasting workspace for inventory batch, horizon month, and target price inputs, then generates 1-8 month price paths with linked profit, cost, and average selling price outputs.",
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
    chartDesc: "The blue line shows projected price while the dashed line marks break-even for fast scenario reading.",
    currentMonth: "Selected Horizon",
    perKgProfit: "Profit per kg",
    weight: "Inventory Weight",
    chartPrice: "Projected Price",
    chartBreakEven: "Break-even",
    monthUnit: "months",
    yuanPerKg: "CNY/kg",
    tonnage: "kg",
    strategyTitle: "Reserved Multi-Agent Modules",
    strategyDesc: "After the forecast workspace, the next phase will connect sandbox simulation, multi-agent reasoning, alerts, and dispatch feedback here.",
    modules: [
      { icon: BrainCircuit, title: "Multi-Agent Reasoning", desc: "Next phase will output strategic, orchestration, and field recommendations." },
      { icon: Radar, title: "What-If Simulation", desc: "Next phase will extend pricing, capacity, and demand variables." },
      { icon: ShieldAlert, title: "Warnings & Root Cause", desc: "Red-yellow-green alerts and anomaly diagnosis will be added here." },
      { icon: Truck, title: "Dispatch & Feedback", desc: "AI decisions will be converted into standardized jobs with live execution status." },
    ],
    navReady: "Forecast workspace connected",
    chartReady: "Curve generated",
    nextPending: "Waiting for What-If and multi-agent logic",
  },
  ja: {
    eyebrow: "AI Decision OS",
    title: "AI意思決定コマンドセンター",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "月数と目標価格を入力して価格曲線と利益試算を生成",
    sectionDesc:
      "このページでは在庫バッチ、保有月数、目標価格を入力すると、1〜8か月の価格軌跡と利益・コスト・平均売価を連動表示します。",
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
    chartDesc: "青線は予測売価、破線は保本線を示し、月数を変えると利益帯を即時に確認できます。",
    currentMonth: "選択期間",
    perKgProfit: "kg当たり利益",
    weight: "在庫重量",
    chartPrice: "予測売価",
    chartBreakEven: "保本線",
    monthUnit: "か月",
    yuanPerKg: "元/kg",
    tonnage: "kg",
    strategyTitle: "多エージェント予備領域",
    strategyDesc: "予測機能の次段階として、What-If、マルチエージェント推論、警報、配車フィードバックを接続します。",
    modules: [
      { icon: BrainCircuit, title: "多エージェント推論", desc: "次段階で本部・業務・現場の提案を出力します。" },
      { icon: Radar, title: "What-If シミュレーション", desc: "価格・能力・需要などの変数推演を追加します。" },
      { icon: ShieldAlert, title: "警報と根因分析", desc: "赤黄緑警報と異常診断ダイアログを追加します。" },
      { icon: Truck, title: "配車と実行フィードバック", desc: "AI判断を標準工単へ変換し、進捗を回収します。" },
    ],
    navReady: "予測ワークベンチ接続済み",
    chartReady: "曲線生成済み",
    nextPending: "What-If と多エージェント待機中",
  },
  th: {
    eyebrow: "AI Decision OS",
    title: "ศูนย์บัญชาการการตัดสินใจ AI",
    sectionEyebrow: "Prediction Workspace",
    sectionTitle: "ป้อนเดือนและราคาเป้าหมายเพื่อสร้างกราฟราคาและประมาณการกำไร",
    sectionDesc:
      "หน้านี้รองรับการเลือกล็อตคงคลัง จำนวนเดือน และราคาเป้าหมาย จากนั้นจะสร้างเส้นทางราคา 1-8 เดือนพร้อมกำไร ต้นทุน และราคาเฉลี่ยที่เชื่อมโยงกัน",
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
    chartDesc: "เส้นสีน้ำเงินคือราคาคาดการณ์ ส่วนเส้นประคือเส้นคุ้มทุนเพื่อให้เห็นช่วงกำไรได้ทันที",
    currentMonth: "ช่วงเวลาที่เลือก",
    perKgProfit: "กำไรต่อกก.",
    weight: "น้ำหนักคงคลัง",
    chartPrice: "ราคาคาดการณ์",
    chartBreakEven: "จุดคุ้มทุน",
    monthUnit: "เดือน",
    yuanPerKg: "หยวน/กก.",
    tonnage: "kg",
    strategyTitle: "พื้นที่โมดูลหลายเอเจนต์",
    strategyDesc: "หลังจากพื้นที่คาดการณ์ ขั้นถัดไปจะเชื่อม What-If การให้เหตุผลหลายเอเจนต์ คำเตือน และฟีดแบ็กการสั่งงานที่หน้านี้",
    modules: [
      { icon: BrainCircuit, title: "การให้เหตุผลหลายเอเจนต์", desc: "ขั้นถัดไปจะแสดงข้อเสนอระดับกลยุทธ์ ธุรกิจ และหน้างาน" },
      { icon: Radar, title: "การจำลอง What-If", desc: "จะเพิ่มตัวแปรราคา กำลังผลิต และอุปสงค์" },
      { icon: ShieldAlert, title: "คำเตือนและสาเหตุราก", desc: "จะเพิ่มคำเตือนแดงเหลืองเขียวและหน้าต่างวิเคราะห์ความผิดปกติ" },
      { icon: Truck, title: "การสั่งงานและฟีดแบ็ก", desc: "จะเปลี่ยนผลลัพธ์ AI เป็นงานมาตรฐานพร้อมสถานะสด" },
    ],
    navReady: "เชื่อมโต๊ะคาดการณ์แล้ว",
    chartReady: "สร้างกราฟแล้ว",
    nextPending: "รอ What-If และตรรกะหลายเอเจนต์",
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

  const selectedMonthNumber = useMemo(() => Number(selectedMonth), [selectedMonth]);
  const targetPrice = useMemo(() => {
    const parsed = Number(targetPriceInput);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [targetPriceInput]);

  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data, isLoading } = trpc.platform.aiForecast.useQuery(
    {
      batchCode,
      selectedMonth: selectedMonthNumber,
      targetPrice,
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
                      <ReferenceLine
                        y={data?.summary.breakEvenPrice}
                        stroke="rgba(251,191,36,0.5)"
                        strokeDasharray="5 5"
                      />
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
                      <p className={`text-sm font-semibold ${point.profitPerKg >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        ¥{point.profitPerKg.toFixed(2)}/kg
                      </p>
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
