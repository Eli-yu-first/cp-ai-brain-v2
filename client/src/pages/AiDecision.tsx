import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrainCircuit, Radar, ShieldAlert, Truck } from "lucide-react";

const copy = {
  zh: {
    eyebrow: "AI Decision OS",
    title: "AI 决策指挥中枢",
    sectionEyebrow: "Multi-Agent Workforce",
    sectionTitle: "从经营推演到执行派单的统一 AI 决策页面",
    sectionDesc:
      "该页面将承接经营预测、What-If 推演、根因分析、红黄绿预警与自动派单的统一交互入口，并保持与现有平台一致的深色科技风视觉结构。",
    pageLabel: "AI 决策操作台",
    pageDesc:
      "当前阶段先完成独立页面、导航入口与统一信息布局，后续将在此页继续接入预测曲线、多 Agent 推理、预警弹窗与派单执行反馈。",
    strategyTitle: "决策层级",
    strategyDesc: "将经营 AI 拆分为总部统筹、业务调度与现场执行三个协同层。",
    strategyItems: [
      {
        title: "CEO 经营 Agent",
        desc: "面向集团利润最大化，汇总价格、库存、产能与履约约束输出全局处理策略。",
      },
      {
        title: "业务调度 Agent",
        desc: "将全局目标拆解为屠宰、分割、仓储与冷链调度动作，形成可执行指令。",
      },
      {
        title: "现场执行 Agent",
        desc: "跟踪工厂、司机与仓储端执行状态，并将偏差实时反馈回决策回路。",
      },
    ],
    signalTitle: "核心信号面板",
    signalDesc: "提前为后续情景模拟、风险预警与自动派单模块预留统一信息区。",
    signals: [
      { label: "经营推演", value: "1-8 月", hint: "支持月份与目标价格输入" },
      { label: "预警等级", value: "红 / 黄 / 绿", hint: "按库存、价格、履约阈值联动" },
      { label: "派单流", value: "JSON 工单", hint: "工厂、物流、仓储多角色协同" },
      { label: "执行反馈", value: "实时回传", hint: "超时升级并进入异常处置" },
    ],
    moduleTitle: "后续模块规划",
    moduleDesc: "后续开发将继续在本页面内扩展以下四个工作区。",
    modules: [
      {
        icon: BrainCircuit,
        title: "情景模拟工作区",
        desc: "输入月份、价格、产能与需求后生成价格轨迹、利润、成本与均价推演。",
      },
      {
        icon: Radar,
        title: "多 Agent 推理面板",
        desc: "展示全局决策层、业务调度层与现场执行层的建议与责任分配。",
      },
      {
        icon: ShieldAlert,
        title: "风险预警与根因分析",
        desc: "通过红黄绿信号和异常弹窗定位问题、损失与 AI 建议动作。",
      },
      {
        icon: Truck,
        title: "派单与执行反馈",
        desc: "将 AI 输出转化为标准化工单，并跟踪厂长、司机、仓储管理员执行进度。",
      },
    ],
    actionPrimary: "查看 AI 工作流",
    actionSecondary: "返回量化决策",
    statusA: "导航已独立",
    statusB: "视觉风格已对齐",
    statusC: "等待接入模拟与预警逻辑",
  },
  en: {
    eyebrow: "AI Decision OS",
    title: "AI Decision Command Center",
    sectionEyebrow: "Multi-Agent Workforce",
    sectionTitle: "A unified AI decision page from planning to dispatch",
    sectionDesc:
      "This page becomes the single entry for forecasting, What-If simulation, root-cause analysis, red-yellow-green alerts, and automatic dispatch while preserving the existing premium dark platform style.",
    pageLabel: "AI Decision Workbench",
    pageDesc:
      "This phase focuses on the standalone page, navigation entry, and unified layout. Forecast curves, multi-agent reasoning, alert dialogs, and dispatch feedback will be added here next.",
    strategyTitle: "Decision Layers",
    strategyDesc: "The AI system is organized into headquarters planning, business orchestration, and field execution layers.",
    strategyItems: [
      { title: "CEO Operations Agent", desc: "Maximizes enterprise profit by combining price, inventory, capacity, and fulfillment constraints." },
      { title: "Business Orchestration Agent", desc: "Breaks strategic targets into slaughter, cutting, storage, and cold-chain actions." },
      { title: "Field Execution Agent", desc: "Tracks plant, driver, and warehouse execution status and feeds deviations back into decisions." },
    ],
    signalTitle: "Signal Deck",
    signalDesc: "This area is reserved for simulation, warnings, and dispatch modules that will be connected next.",
    signals: [
      { label: "Forecasting", value: "1-8 months", hint: "Month and target price inputs" },
      { label: "Alert Level", value: "Red / Yellow / Green", hint: "Driven by inventory, price, and fulfillment thresholds" },
      { label: "Dispatch Flow", value: "JSON Jobs", hint: "Plant, logistics, and warehouse coordination" },
      { label: "Execution Feedback", value: "Live Status", hint: "Timeout escalation for abnormal execution" },
    ],
    moduleTitle: "Planned Modules",
    moduleDesc: "The following workspaces will be added to this page in the next steps.",
    modules: [
      { icon: BrainCircuit, title: "Scenario Simulation", desc: "Input month, price, capacity, and demand to generate price tracks and profit-cost projections." },
      { icon: Radar, title: "Multi-Agent Reasoning", desc: "Show recommendations and accountability across strategic, orchestration, and field layers." },
      { icon: ShieldAlert, title: "Warnings & Root Cause", desc: "Use red-yellow-green alerts and anomaly dialogs to locate issues, losses, and AI actions." },
      { icon: Truck, title: "Dispatch & Feedback", desc: "Turn AI output into standard jobs and track execution across managers, drivers, and warehouses." },
    ],
    actionPrimary: "View AI Workflow",
    actionSecondary: "Back to Quant Engine",
    statusA: "Independent navigation added",
    statusB: "Visual language aligned",
    statusC: "Waiting for simulation and alert logic",
  },
  ja: {
    eyebrow: "AI Decision OS",
    title: "AI意思決定コマンドセンター",
    sectionEyebrow: "Multi-Agent Workforce",
    sectionTitle: "経営推論から配車指令までを束ねる統合AIページ",
    sectionDesc:
      "本ページは予測、What-Ifシミュレーション、根因分析、赤黄緑アラート、自動配車の統一入口として機能し、既存のダーク系プラットフォームデザインを維持します。",
    pageLabel: "AI意思決定ワークベンチ",
    pageDesc:
      "この段階では独立ページ、ナビゲーション入口、統一レイアウトを完成させます。予測曲線、多エージェント推論、アラートダイアログ、配車フィードバックは次段階で接続します。",
    strategyTitle: "意思決定レイヤー",
    strategyDesc: "本AIシステムは本部計画、業務編成、現場実行の三層で構成されます。",
    strategyItems: [
      { title: "CEO経営Agent", desc: "価格、在庫、能力、履行制約を組み合わせて全社利益最大化を図ります。" },
      { title: "業務編成Agent", desc: "戦略目標をと畜、分割、保管、コールドチェーンの実行動作に分解します。" },
      { title: "現場実行Agent", desc: "工場、ドライバー、倉庫の実行状況を追跡し、逸脱を意思決定へ戻します。" },
    ],
    signalTitle: "シグナルデッキ",
    signalDesc: "ここには今後、シミュレーション、警報、配車モジュールが接続されます。",
    signals: [
      { label: "予測", value: "1-8か月", hint: "月数と目標価格入力" },
      { label: "警報レベル", value: "赤 / 黄 / 緑", hint: "在庫・価格・履行閾値で判定" },
      { label: "配車フロー", value: "JSON指令", hint: "工場・物流・倉庫の協調" },
      { label: "実行フィードバック", value: "リアルタイム", hint: "異常時は即時エスカレーション" },
    ],
    moduleTitle: "今後のモジュール",
    moduleDesc: "次の段階で以下のワークスペースを本ページに追加します。",
    modules: [
      { icon: BrainCircuit, title: "シナリオシミュレーション", desc: "月数、価格、能力、需要を入力して価格軌跡と利益・コスト推定を生成します。" },
      { icon: Radar, title: "多エージェント推論", desc: "戦略層、業務層、現場層の提案と責任分担を表示します。" },
      { icon: ShieldAlert, title: "警報と根因分析", desc: "赤黄緑シグナルと異常ダイアログで問題、損失、AI提案を特定します。" },
      { icon: Truck, title: "配車と実行フィードバック", desc: "AI出力を標準指令に変換し、管理者、ドライバー、倉庫の進捗を追跡します。" },
    ],
    actionPrimary: "AIワークフローを見る",
    actionSecondary: "定量意思決定へ戻る",
    statusA: "独立ナビゲーション追加済み",
    statusB: "視覚言語を統一済み",
    statusC: "シミュレーションと警報ロジック待機中",
  },
  th: {
    eyebrow: "AI Decision OS",
    title: "ศูนย์บัญชาการการตัดสินใจ AI",
    sectionEyebrow: "Multi-Agent Workforce",
    sectionTitle: "หน้า AI กลางสำหรับตั้งแต่การวางแผนจนถึงการสั่งงาน",
    sectionDesc:
      "หน้านี้จะเป็นทางเข้ารวมสำหรับการพยากรณ์ การจำลอง What-If การวิเคราะห์สาเหตุ การเตือนสีแดงเหลืองเขียว และการสั่งงานอัตโนมัติ โดยยังคงภาษาการออกแบบเดิมของแพลตฟอร์มไว้",
    pageLabel: "AI Decision Workbench",
    pageDesc:
      "ระยะนี้จะทำหน้าแยก เมนูนำทาง และโครงสร้างข้อมูลให้พร้อมก่อน จากนั้นจะค่อยเชื่อมกราฟคาดการณ์ การให้เหตุผลหลายเอเจนต์ การเตือน และฟีดแบ็กการสั่งงาน",
    strategyTitle: "ลำดับชั้นการตัดสินใจ",
    strategyDesc: "ระบบ AI ถูกแบ่งเป็นชั้นวางแผนส่วนกลาง ชั้นจัดสรรงานธุรกิจ และชั้นปฏิบัติการหน้างาน",
    strategyItems: [
      { title: "CEO Operations Agent", desc: "เพิ่มกำไรสูงสุดโดยรวมข้อมูลราคา สต็อก กำลังการผลิต และข้อจำกัดการส่งมอบ" },
      { title: "Business Orchestration Agent", desc: "แปลงเป้าหมายเชิงกลยุทธ์เป็นงานเชือด แยกชิ้น จัดเก็บ และขนส่งห้องเย็น" },
      { title: "Field Execution Agent", desc: "ติดตามการปฏิบัติงานของโรงงาน คนขับ และคลัง พร้อมส่งความเบี่ยงเบนกลับเข้าสู่การตัดสินใจ" },
    ],
    signalTitle: "แผงสัญญาณ",
    signalDesc: "พื้นที่นี้จะเชื่อมต่อกับการจำลอง คำเตือน และการสั่งงานในขั้นตอนถัดไป",
    signals: [
      { label: "การคาดการณ์", value: "1-8 เดือน", hint: "รองรับการป้อนเดือนและราคาเป้าหมาย" },
      { label: "ระดับการเตือน", value: "แดง / เหลือง / เขียว", hint: "อิงตามสต็อก ราคา และเกณฑ์การส่งมอบ" },
      { label: "การสั่งงาน", value: "JSON Jobs", hint: "ประสานงานโรงงาน โลจิสติกส์ และคลัง" },
      { label: "ฟีดแบ็กการปฏิบัติ", value: "สถานะสด", hint: "ยกระดับทันทีเมื่อเกินเวลา" },
    ],
    moduleTitle: "โมดูลที่กำลังจะเพิ่ม",
    moduleDesc: "พื้นที่ทำงานต่อไปนี้จะถูกเพิ่มในหน้านี้ในขั้นถัดไป",
    modules: [
      { icon: BrainCircuit, title: "การจำลองสถานการณ์", desc: "ป้อนเดือน ราคา กำลังผลิต และอุปสงค์เพื่อสร้างกราฟราคาและประมาณการกำไร-ต้นทุน" },
      { icon: Radar, title: "การให้เหตุผลหลายเอเจนต์", desc: "แสดงข้อเสนอและความรับผิดชอบของชั้นกลยุทธ์ การจัดสรรงาน และหน้างาน" },
      { icon: ShieldAlert, title: "คำเตือนและสาเหตุราก", desc: "ใช้สัญญาณแดงเหลืองเขียวและหน้าต่างเหตุผิดปกติเพื่อระบุปัญหา ความสูญเสีย และการแนะนำจาก AI" },
      { icon: Truck, title: "การสั่งงานและฟีดแบ็ก", desc: "แปลงผลลัพธ์จาก AI เป็นงานมาตรฐานและติดตามความคืบหน้าของผู้จัดการ คนขับ และคลัง" },
    ],
    actionPrimary: "ดูเวิร์กโฟลว์ AI",
    actionSecondary: "กลับไปหน้า Quant",
    statusA: "เพิ่มเมนูแยกแล้ว",
    statusB: "จัดแนวภาพลักษณ์แล้ว",
    statusC: "รอเชื่อมตรรกะจำลองและคำเตือน",
  },
} as const;

export default function AiDecisionPage() {
  const { language } = useLanguage();
  const current = copy[language];

  return (
    <PlatformShell eyebrow={current.eyebrow} title={current.title} pageId="ai">
      <SectionHeader
        eyebrow={current.sectionEyebrow}
        title={current.sectionTitle}
        description={current.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">{current.statusA}</Badge>
            <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">{current.statusB}</Badge>
            <Badge className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">{current.statusC}</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="overflow-hidden">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.pageLabel}</p>
                <h4 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-[2rem]">{current.title}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300">{current.actionPrimary}</Button>
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06] hover:text-white">{current.actionSecondary}</Button>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-slate-400">{current.pageDesc}</p>

            <div className="grid gap-4 md:grid-cols-3">
              {current.strategyItems.map(item => (
                <div key={item.title} className="rounded-[22px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),rgba(6,14,30,0.92)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_40px_rgba(0,0,0,0.24)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{current.strategyTitle}</p>
                  <h5 className="mt-3 text-base font-semibold text-white">{item.title}</h5>
                  <p className="mt-3 text-[13px] leading-6 text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex h-full flex-col gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{current.signalTitle}</p>
              <h4 className="mt-3 text-xl font-bold tracking-tight text-white">{current.moduleTitle}</h4>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">{current.signalDesc}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {current.signals.map(item => (
                <div key={item.label} className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-[12px] leading-5 text-slate-400">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-4">
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
