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
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute left-[8%] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,152,255,0.15),transparent_60%)] blur-[100px] animate-glow-drift" />
      <div className="pointer-events-none absolute right-[6%] top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(40,80,200,0.12),transparent_60%)] blur-[110px] animate-glow-drift delay-300" />
      <div className="pointer-events-none absolute left-[40%] bottom-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(56,180,255,0.08),transparent_60%)] blur-[90px]" />

      <div className="relative container flex min-h-screen flex-col justify-between py-8 md:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-300/60">{t("common.platformName")}</p>
            <h1 className="mt-2 text-base font-semibold text-slate-300/80">{t("common.platformTagline")}</h1>
          </div>
          <Badge className="rounded-lg border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200/80 shadow-[0_0_20px_rgba(56,180,255,0.08)]">
            {copy.style}
          </Badge>
        </motion.header>

        {/* Hero */}
        <main className="grid gap-10 py-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-center xl:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="eyebrow-chip">{copy.heroLabel}</div>
            <h2 className="mt-7 max-w-5xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl xl:text-[5rem]">
              {copy.subtitle}
            </h2>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-400/90 md:text-lg">{copy.description}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                onClick={() => setLocation("/tenants")}
                size="lg"
                className="group rounded-xl bg-[linear-gradient(135deg,rgba(56,180,255,0.9),rgba(56,130,255,0.9))] px-7 text-white shadow-[0_16px_40px_rgba(56,152,255,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_20px_50px_rgba(56,152,255,0.3)] hover:brightness-110"
              >
                {copy.enter}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                onClick={() => setLocation("/overview")}
                size="lg"
                variant="outline"
                className="rounded-xl border-white/[0.08] bg-white/[0.03] px-7 text-slate-200 backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.06]"
              >
                {copy.preview}
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {dashboardStats.map(item => (
                <div key={item} className="data-chip text-[13px]">{item}</div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard preview card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="holo-card p-5"
          >
            {/* Live signal bar */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.label1}</p>
                <p className="mt-1 text-[13px] font-semibold text-white">{copy.liveSignal}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {copy.liveSignalDesc}
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { title: copy.cardA, desc: copy.cardADesc, icon: ChartNoAxesCombined },
                { title: copy.cardB, desc: copy.cardBDesc, icon: Bot },
                { title: copy.cardC, desc: copy.cardCDesc, icon: Boxes },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group rounded-xl border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008)),rgba(6,14,28,0.9)] p-4 transition-all hover:border-cyan-400/15 hover:bg-[rgba(56,152,255,0.03)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300 transition-all group-hover:bg-cyan-400/[0.1] group-hover:shadow-[0_0_16px_rgba(56,180,255,0.12)]">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-4 text-[14px] font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-[1.7] text-slate-400/80">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Data preview */}
            <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">{copy.label2}</p>
                    <p className="mt-2 num-display text-xl font-bold text-white">{copy.actionHold}</p>
                  </div>
                  <Badge className="rounded-lg border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1.5 num-display text-[11px] font-semibold text-emerald-300">+2.38/kg</Badge>
                </div>
                <div className="mt-5 h-20 rounded-xl bg-[linear-gradient(180deg,rgba(52,211,153,0.1),rgba(52,211,153,0.02))] p-3">
                  <div className="flex h-full items-end gap-1.5">
                    {[42, 38, 51, 46, 60, 64, 72, 69, 78].map((value, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${value}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(52,211,153,0.7),rgba(52,211,153,0.15))]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">{copy.label3}</p>
                <div className="mt-3 space-y-2">
                  {[copy.actionPending, copy.actionSell, copy.actionHold].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[rgba(6,14,28,0.6)] px-3.5 py-2.5"
                    >
                      <span className="num-display text-[12px] text-slate-500">0{index + 1}</span>
                      <span className="text-[13px] font-semibold text-white">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Features section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid gap-4 border-t border-white/[0.06] py-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-5"
        >
          <div className="md:col-span-2 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{copy.style}</p>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-white">{copy.sectionTitle}</h3>
            <p className="mt-3 max-w-md text-[13px] leading-[1.7] text-slate-400/80">{copy.sectionDesc}</p>
          </div>
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="holo-card glow-border p-5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300 transition-all group-hover:bg-cyan-400/[0.1] group-hover:shadow-[0_0_16px_rgba(56,180,255,0.12)]">
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h4 className="relative mt-4 text-[15px] font-bold text-white">{item.title}</h4>
              <p className="relative mt-2.5 text-[12.5px] leading-[1.7] text-slate-400/80">{item.desc}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-[12px] text-slate-500/80">
          <span>{copy.footerLeft}</span>
          <span>{copy.footerRight}</span>
        </footer>
      </div>
    </div>
  );
}
