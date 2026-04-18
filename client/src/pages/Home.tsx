import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const copy = {
    zh: {
      style: "Elegant Tech SaaS",
      subtitle: "面向农牧产业集团的智能决策可视化平台",
      description:
        "以全产业链实时经营指标、部位级量化套利、人机协同审批和审计留痕为核心，构建适用于集团总部、事业部与行业客户交付的高端 AI 决策中枢。",
      heroLabel: "公式驱动 · 审计闭环 · 多租户交付",
      enter: "进入平台",
      preview: "查看总览",
      liveSignal: "实时经营脑图",
      liveSignalDesc: "九大环节经营信号已汇聚到统一决策界面。",
      cardA: "集团经营驾驶舱",
      cardADesc: "从产能、库存、价格到履约风险形成统一监控视图。",
      cardB: "23 部位量化决策",
      cardBDesc: "基于保本价、预计售价、持有成本与风险阈值输出明确结论。",
      cardC: "人机协同治理",
      cardCDesc: "高风险动作必须审批，所有动作自动写入审计日志。",
      sectionTitle: "高端商业化交付界面",
      sectionDesc: "统一导航、深色材质、精密边框、数值动效与图表层次被重新组织为更专业的科技 SaaS 风格。",
      feature1Title: "总部级经营控制",
      feature1Desc: "全链路 KPI、事业部指标与关键风险集中在同一视觉语言下。",
      feature2Title: "跨区域多语言交付",
      feature2Desc: "中英日泰同步切换，适合国际化农业集团内部推广。",
      feature3Title: "高风险审批防线",
      feature3Desc: "策略执行前必须经过二次确认，避免未经授权的高风险动作。",
      feature4Title: "审计与追责闭环",
      feature4Desc: "所有决策、审批、执行路径形成可复盘的合规记录。",
      stat1: "统一产业链控制",
      stat2: "量化公式驱动",
      stat3: "商业化交付原型",
      footerLeft: "CP-AI Brain V1.0 · 农牧产业集团智能运营系统",
      footerRight: "高端科技风 SaaS 演示原型",
      metric1: "九大链路协同",
      metric2: "23 部位动态行情",
      metric3: "高风险动作强审计",
      label1: "实时总览",
      label2: "量化建议",
      label3: "审批状态",
      actionHold: "持有",
      actionSell: "出售",
      actionPending: "待审批",
    },
    en: {
      style: "Elegant Tech SaaS",
      subtitle: "Intelligent Decision Visualization Platform for Agri-Food Conglomerates",
      description:
        "Centered on full-chain operating signals, part-level quantitative arbitrage, human approvals, and audit traceability, the platform delivers a premium AI decision hub for headquarters, business divisions, and external enterprise clients.",
      heroLabel: "Formula-driven · Auditable · Multi-tenant Delivery",
      enter: "Enter Platform",
      preview: "View Overview",
      liveSignal: "Live operating intelligence",
      liveSignalDesc: "Signals from all nine business stages are unified into one control interface.",
      cardA: "Group operating cockpit",
      cardADesc: "Capacity, inventory, pricing, and fulfillment risk are monitored in one command layer.",
      cardB: "23-part quantitative decisions",
      cardBDesc: "Clear conclusions are produced from break-even, expected price, holding cost, and risk thresholds.",
      cardC: "Human-AI governance",
      cardCDesc: "High-risk actions require approval and every move is written into the audit trail.",
      sectionTitle: "Premium commercial delivery interface",
      sectionDesc: "Navigation, dark surfaces, precise borders, numeric motion, and chart hierarchy are reassembled into a more professional technology SaaS expression.",
      feature1Title: "HQ-grade operating control",
      feature1Desc: "Full-chain KPIs, divisional signals, and key risks are presented in one coherent visual system.",
      feature2Title: "Cross-region multilingual delivery",
      feature2Desc: "Chinese, English, Japanese, and Thai switch consistently for international rollout.",
      feature3Title: "High-risk approval guardrail",
      feature3Desc: "Execution requires a second confirmation to prevent unauthorized actions.",
      feature4Title: "Audit and accountability loop",
      feature4Desc: "Every decision, approval, and execution path becomes reviewable compliance evidence.",
      stat1: "Unified value-chain control",
      stat2: "Quantitative formula engine",
      stat3: "Commercial-ready prototype",
      footerLeft: "CP-AI Brain V1.0 · Smart Operating System for Agri-Food Conglomerates",
      footerRight: "Premium technology SaaS demo prototype",
      metric1: "Nine-stage coordination",
      metric2: "23 live part quotes",
      metric3: "Mandatory audit on high-risk actions",
      label1: "Live Overview",
      label2: "Quant Signal",
      label3: "Approval",
      actionHold: "Hold",
      actionSell: "Sell",
      actionPending: "Pending",
    },
    ja: {
      style: "Elegant Tech SaaS",
      subtitle: "農牧産業グループ向けインテリジェント意思決定ビジュアルプラットフォーム",
      description:
        "全産業チェーンの経営シグナル、部位別の定量裁定、人による承認、監査証跡を統合し、本社・事業部・業界顧客へ提供できる上質な AI 意思決定ハブを構築します。",
      heroLabel: "数式駆動 · 監査可能 · マルチテナント提供",
      enter: "プラットフォームへ進む",
      preview: "総覧を見る",
      liveSignal: "リアルタイム経営インテリジェンス",
      liveSignalDesc: "九つの事業段階のシグナルが単一の制御画面に集約されています。",
      cardA: "グループ経営コックピット",
      cardADesc: "生産能力、在庫、価格、履行リスクを一つの管理層で監視します。",
      cardB: "23 部位の定量判断",
      cardBDesc: "損益分岐点、予想価格、保有コスト、リスク閾値から明確な結論を出力します。",
      cardC: "Human-AI ガバナンス",
      cardCDesc: "高リスク操作には承認が必要で、すべての動きが監査ログに記録されます。",
      sectionTitle: "上質な商用提案インターフェース",
      sectionDesc: "ナビゲーション、ダークマテリアル、精密な境界、数値アニメーション、チャート階層を再構成し、より専門的な SaaS 表現に仕上げました。",
      feature1Title: "本社級オペレーション制御",
      feature1Desc: "全チェーン KPI、事業部指標、主要リスクを一貫した視覚体系で提示します。",
      feature2Title: "越境対応の多言語提供",
      feature2Desc: "中国語・英語・日本語・タイ語を一貫して切り替えられます。",
      feature3Title: "高リスク承認ガードレール",
      feature3Desc: "実行前に二次確認を必須化し、無断の高リスク操作を防ぎます。",
      feature4Title: "監査と責任のループ",
      feature4Desc: "すべての判断、承認、実行経路が監査可能な証跡になります。",
      stat1: "統合バリューチェーン制御",
      stat2: "定量数式エンジン",
      stat3: "商用提案向けプロトタイプ",
      footerLeft: "CP-AI Brain V1.0 · 農牧産業グループ向けスマート運営システム",
      footerRight: "上質なテクノロジー SaaS デモ",
      metric1: "九段階協調",
      metric2: "23 部位リアルタイム相場",
      metric3: "高リスク操作は強制監査",
      label1: "総覧",
      label2: "定量シグナル",
      label3: "承認",
      actionHold: "保有",
      actionSell: "売却",
      actionPending: "承認待ち",
    },
    th: {
      style: "Elegant Tech SaaS",
      subtitle: "แพลตฟอร์มภาพการตัดสินใจอัจฉริยะสำหรับกลุ่มธุรกิจเกษตรอาหาร",
      description:
        "แพลตฟอร์มนี้รวมสัญญาณการดำเนินงานตลอดห่วงโซ่ การทำอาร์บิทราจเชิงปริมาณระดับชิ้นส่วน การอนุมัติจากมนุษย์ และการตรวจสอบย้อนหลัง เพื่อเป็นศูนย์กลางการตัดสินใจ AI ระดับพรีเมียมสำหรับสำนักงานใหญ่ หน่วยธุรกิจ และลูกค้าองค์กร",
      heroLabel: "ขับเคลื่อนด้วยสูตร · ตรวจสอบได้ · ส่งมอบแบบหลายผู้เช่า",
      enter: "เข้าสู่แพลตฟอร์ม",
      preview: "ดูภาพรวม",
      liveSignal: "สติปัญญาการดำเนินงานแบบเรียลไทม์",
      liveSignalDesc: "สัญญาณจากทั้งเก้าช่วงธุรกิจถูกรวมไว้ในอินเทอร์เฟซควบคุมเดียว",
      cardA: "ค็อกพิทการดำเนินงานระดับกลุ่ม",
      cardADesc: "ติดตามกำลังการผลิต สินค้าคงคลัง ราคา และความเสี่ยงด้านการส่งมอบในชั้นควบคุมเดียว",
      cardB: "การตัดสินใจเชิงปริมาณ 23 ชิ้นส่วน",
      cardBDesc: "สรุปผลลัพธ์อย่างชัดเจนจากจุดคุ้มทุน ราคาคาดการณ์ ต้นทุนการถือ และเกณฑ์ความเสี่ยง",
      cardC: "ธรรมาภิบาล Human-AI",
      cardCDesc: "การดำเนินการความเสี่ยงสูงต้องได้รับอนุมัติ และทุกขั้นตอนจะถูกบันทึกลงในบันทึกการตรวจสอบ",
      sectionTitle: "อินเทอร์เฟซเชิงพาณิชย์ระดับพรีเมียม",
      sectionDesc: "เราได้จัดระเบียบการนำทาง พื้นผิวสีเข้ม เส้นขอบแบบละเอียด แอนิเมชันตัวเลข และลำดับชั้นของกราฟใหม่ให้เป็น SaaS ด้านเทคโนโลยีที่ดูเป็นมืออาชีพมากขึ้น",
      feature1Title: "การควบคุมระดับสำนักงานใหญ่",
      feature1Desc: "KPI ตลอดห่วงโซ่ ตัวชี้วัดแต่ละหน่วยธุรกิจ และความเสี่ยงหลักอยู่ในระบบภาพเดียวกัน",
      feature2Title: "การส่งมอบหลายภาษาข้ามภูมิภาค",
      feature2Desc: "สลับจีน อังกฤษ ญี่ปุ่น และไทยได้อย่างสอดคล้องสำหรับการใช้งานระหว่างประเทศ",
      feature3Title: "รั้วป้องกันการอนุมัติความเสี่ยงสูง",
      feature3Desc: "ต้องยืนยันซ้ำก่อนดำเนินการเพื่อป้องกันการใช้งานที่ไม่ได้รับอนุญาต",
      feature4Title: "วงจรการตรวจสอบและความรับผิดชอบ",
      feature4Desc: "ทุกการตัดสินใจ การอนุมัติ และการดำเนินการสามารถย้อนตรวจสอบได้",
      stat1: "ควบคุมห่วงโซ่คุณค่ารวมศูนย์",
      stat2: "เอนจินสูตรเชิงปริมาณ",
      stat3: "ต้นแบบพร้อมส่งมอบเชิงพาณิชย์",
      footerLeft: "CP-AI Brain V1.0 · ระบบปฏิบัติการอัจฉริยะสำหรับกลุ่มธุรกิจเกษตรอาหาร",
      footerRight: "ต้นแบบสาธิต SaaS เทคโนโลยีระดับพรีเมียม",
      metric1: "ประสานงาน 9 ช่วงธุรกิจ",
      metric2: "ราคา 23 ชิ้นส่วนแบบสด",
      metric3: "บังคับตรวจสอบสำหรับความเสี่ยงสูง",
      label1: "ภาพรวมสด",
      label2: "สัญญาณเชิงปริมาณ",
      label3: "การอนุมัติ",
      actionHold: "ถือ",
      actionSell: "ขาย",
      actionPending: "รออนุมัติ",
    },
  }[language];

  const features = [
    { icon: Sparkles, title: copy.feature1Title, desc: copy.feature1Desc },
    { icon: Globe2, title: copy.feature2Title, desc: copy.feature2Desc },
    { icon: LockKeyhole, title: copy.feature3Title, desc: copy.feature3Desc },
    { icon: ShieldCheck, title: copy.feature4Title, desc: copy.feature4Desc },
  ];

  const dashboardStats = [copy.metric1, copy.metric2, copy.metric3];

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute left-[10%] top-24 h-72 w-72 rounded-full bg-cyan-400/18 blur-[110px] animate-glow-drift" />
      <div className="pointer-events-none absolute right-[8%] top-20 h-64 w-64 rounded-full bg-indigo-500/18 blur-[120px] animate-glow-drift" />
      <div className="relative container flex min-h-screen flex-col justify-between py-8 md:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-cyan-200/75">{t("common.platformName")}</p>
            <h1 className="mt-3 text-lg font-medium text-slate-300">{t("common.platformTagline")}</h1>
          </div>
          <Badge className="rounded-full border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]">{copy.style}</Badge>
        </header>

        <main className="grid gap-10 py-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-center xl:py-14">
          <div>
            <div className="eyebrow-chip">{copy.heroLabel}</div>
            <h2 className="mt-8 max-w-5xl text-5xl font-semibold leading-[0.96] text-white md:text-7xl xl:text-[5.25rem]">
              {copy.subtitle}
            </h2>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">{copy.description}</p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                onClick={() => setLocation("/tenants")}
                size="lg"
                className="rounded-2xl bg-[linear-gradient(135deg,#84ebff,#4ed8ff_38%,#86a8ff)] px-7 text-slate-950 shadow-[0_18px_40px_rgba(94,199,255,0.24)] hover:opacity-95"
              >
                {copy.enter}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setLocation("/overview")}
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/10 bg-white/[0.04] px-7 text-slate-100 hover:bg-white/[0.08]"
              >
                {copy.preview}
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {dashboardStats.map(item => (
                <div key={item} className="data-chip text-sm">{item}</div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-line rounded-[38px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)),linear-gradient(180deg,rgba(8,14,25,0.94),rgba(7,12,22,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_30px_110px_rgba(1,6,18,0.58)] md:p-6"
          >
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{copy.label1}</p>
                <p className="mt-1 text-sm font-medium text-white">{copy.liveSignal}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                {copy.liveSignalDesc}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                { title: copy.cardA, desc: copy.cardADesc, icon: ChartNoAxesCombined },
                { title: copy.cardB, desc: copy.cardBDesc, icon: Bot },
                { title: copy.cardC, desc: copy.cardCDesc, icon: Boxes },
              ].map(item => (
                <div key={item.title} className="metric-orb rounded-[28px] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{copy.label2}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{copy.actionHold}</p>
                  </div>
                  <Badge className="rounded-full border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">+2.38/kg</Badge>
                </div>
                <div className="mt-6 h-24 rounded-[20px] bg-[linear-gradient(180deg,rgba(52,211,153,0.18),rgba(52,211,153,0.02))] p-4">
                  <div className="flex h-full items-end gap-2">
                    {[42, 38, 51, 46, 60, 64, 72, 69, 78].map((value, index) => (
                      <div key={index} className="flex-1 rounded-full bg-[linear-gradient(180deg,rgba(125,255,210,0.85),rgba(52,211,153,0.18))]" style={{ height: `${value}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{copy.label3}</p>
                <div className="mt-4 space-y-3">
                  {[copy.actionPending, copy.actionSell, copy.actionHold].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-[18px] border border-white/8 bg-slate-950/50 px-4 py-3">
                      <span className="text-sm text-slate-300">0{index + 1}</span>
                      <span className="text-sm font-medium text-white">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        <section className="grid gap-5 border-t border-white/8 py-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <div className="md:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{copy.style}</p>
            <h3 className="mt-4 text-2xl font-semibold text-white">{copy.sectionTitle}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{copy.sectionDesc}</p>
          </div>
          {features.map(item => (
            <div key={item.title} className="glass-line rounded-[28px] border border-white/8 bg-white/[0.035] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-5 text-lg font-semibold text-white">{item.title}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-slate-500">
          <span>{copy.footerLeft}</span>
          <span>{copy.footerRight}</span>
        </footer>
      </div>
    </div>
  );
}
