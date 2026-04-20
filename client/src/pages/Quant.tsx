import { PlatformShell } from "@/components/platform/PlatformShell";
import { TechPanel, SectionHeader, NumberTicker } from "@/components/platform/PlatformPrimitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, Sigma, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RoleCode = "admin" | "strategist" | "executor";

export default function QuantPage() {
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [operatorRole, setOperatorRole] = useState<RoleCode>("strategist");
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const { language } = useLanguage();

  const copy = {
    zh: {
      eyebrow: "Quant Engine",
      title: "量化套利决策引擎",
      sectionEyebrow: "Formula First",
      sectionTitle: "基于数学公式的持有 / 出售明确结论",
      sectionDesc: "系统按照持有成本、保本价、预计售价和风险得分进行计算，严格输出“持有”或“出售”。对于高风险方案，系统必须触发人工确认弹窗。",
      inputs: "Scenario Inputs",
      chooseBatch: "选择库存批次",
      operatorRole: "操作角色",
      formulaTitle: "量化公式",
      formulaDesc: "建议 = 净收益与决策阈值比较结果",
      formulaBody: "持有成本 = 当前成本 + (仓储成本 + 资金成本 + 损耗成本) × 月数；保本价 = 当前成本 + 未来持有总成本；预计售价 = 现货价 + (期货映射价 - 现货价) × 0.62 + 季节性修正 + 供给修正 + 持有期激励；若净收益 > 决策阈值，则输出“持有”，否则输出“出售”。",
      currentBatch: "当前批次",
      part: "部位",
      warehouse: "仓库",
      cost: "成本",
      age: "库龄",
      monthPlan: "方案",
      breakEven: "保本价",
      expectedSell: "预计售价",
      netProfit: "净收益",
      risk: "风险等级",
      confirmAction: "确认",
      aiExplanation: "AI Explanation",
      clearConclusion: "明确结论",
      clearConclusionDesc: "系统不会输出模糊措辞。每个方案只会给出“持有”或“出售”两种确定性结论。",
      governance: "风险治理",
      governanceDesc: "当风险等级达到高，系统必须进入人工确认流程，并将方案、角色和动作完整写入审计日志。",
      confirmTitle: "高风险操作必须二次确认",
      confirmDesc: "系统已自动调出同一批次的 1 / 2 / 3 个月方案对比，审批人需在确认前比对保本价、预计售价、净收益与风险等级。",
      scheme: "方案",
      conclusion: "结论",
      cancel: "取消",
      submit: "确认并写入审计日志",
      submitting: "提交中...",
      admin: "管理员",
      strategist: "决策者",
      executor: "执行者",
      days: "天",
      holdMonth: "持有",
      auditToast: "已记录审计日志：",
      controlDeck: "决策控制台",
      recommended: "推荐优先",
      notRecommended: "保守处理",
      decisionStack: "决策栈",
      formulaSignal: "公式已锁定",
      compareTitle: "方案并列评估",
      compareDesc: "系统自动对 1 / 2 / 3 个月路径做并排比较，最高优先级方案以更强视觉层次强调。",
    },
    en: {
      eyebrow: "Quant Engine",
      title: "Quant Arbitrage Engine",
      sectionEyebrow: "Formula First",
      sectionTitle: "Explicit hold / sell conclusions driven by formulas",
      sectionDesc: "The system calculates holding cost, break-even price, expected selling price, and risk score, then outputs only “Hold” or “Sell”. High-risk scenarios must trigger human confirmation.",
      inputs: "Scenario Inputs",
      chooseBatch: "Choose Inventory Batch",
      operatorRole: "Operator Role",
      formulaTitle: "Quant Formula",
      formulaDesc: "Recommendation = net profit compared with decision threshold",
      formulaBody: "Holding cost = current cost + (storage + capital + loss cost) × months; break-even = current cost + future holding cost; expected sell = spot + (futures-mapped price - spot) × 0.62 + seasonal adjustment + supply adjustment + horizon incentive; if net profit > threshold, output Hold, otherwise Sell.",
      currentBatch: "Current Batch",
      part: "Part",
      warehouse: "Warehouse",
      cost: "Cost",
      age: "Age",
      monthPlan: "Plan",
      breakEven: "Break-even",
      expectedSell: "Expected Sell",
      netProfit: "Net Profit",
      risk: "Risk",
      confirmAction: "Confirm",
      aiExplanation: "AI Explanation",
      clearConclusion: "Explicit Conclusion",
      clearConclusionDesc: "The system never outputs ambiguous wording. Every scenario ends with only Hold or Sell.",
      governance: "Risk Governance",
      governanceDesc: "When risk reaches high, the workflow must enter human approval and write scenario, role, and action to the audit log.",
      confirmTitle: "High-risk actions require confirmation",
      confirmDesc: "The system has loaded the 1 / 2 / 3 month comparison for the same batch so the approver can compare break-even, expected sell, net profit, and risk before approval.",
      scheme: "Scenario",
      conclusion: "Conclusion",
      cancel: "Cancel",
      submit: "Confirm and write audit log",
      submitting: "Submitting...",
      admin: "Administrator",
      strategist: "Decision Maker",
      executor: "Executor",
      days: "days",
      holdMonth: "Hold",
      auditToast: "Audit log written: ",
      controlDeck: "Decision Control Deck",
      recommended: "Recommended",
      notRecommended: "Conservative",
      decisionStack: "Decision Stack",
      formulaSignal: "Formula Locked",
      compareTitle: "Parallel scenario evaluation",
      compareDesc: "The engine compares the 1 / 2 / 3 month paths side by side and elevates the highest-priority option with stronger visual emphasis.",
    },
    ja: {
      eyebrow: "Quant Engine",
      title: "定量裁定エンジン",
      sectionEyebrow: "Formula First",
      sectionTitle: "数式に基づく保有 / 売却の明確な結論",
      sectionDesc: "システムは保有コスト、損益分岐点、予想売価、リスクスコアを計算し、「保有」または「売却」のみを出力します。高リスク案は必ず人の確認に入ります。",
      inputs: "Scenario Inputs",
      chooseBatch: "在庫バッチを選択",
      operatorRole: "操作ロール",
      formulaTitle: "定量式",
      formulaDesc: "推奨 = 純利益と閾値の比較結果",
      formulaBody: "保有コスト = 現在コスト + (保管 + 資金 + 損耗コスト) × 月数；損益分岐点 = 現在コスト + 将来保有コスト；予想売価 = 現物価格 + (先物換算価格 - 現物価格) × 0.62 + 季節補正 + 供給補正 + 期間インセンティブ；純利益が閾値を超えれば保有、そうでなければ売却。",
      currentBatch: "現在バッチ",
      part: "部位",
      warehouse: "倉庫",
      cost: "コスト",
      age: "庫齢",
      monthPlan: "プラン",
      breakEven: "損益分岐点",
      expectedSell: "予想売価",
      netProfit: "純利益",
      risk: "リスク",
      confirmAction: "確認",
      aiExplanation: "AI Explanation",
      clearConclusion: "明確な結論",
      clearConclusionDesc: "あいまいな表現は出力されません。各案は「保有」または「売却」のどちらかに限定されます。",
      governance: "リスク統治",
      governanceDesc: "リスクが高に達した場合、人による承認フローに入り、案・役割・動作が監査ログへ記録されます。",
      confirmTitle: "高リスク操作は二次確認が必要です",
      confirmDesc: "同一バッチの 1 / 2 / 3 か月案を読み込み済みで、承認前に損益分岐点、予想売価、純利益、リスクを比較できます。",
      scheme: "シナリオ",
      conclusion: "結論",
      cancel: "キャンセル",
      submit: "監査ログへ記録して確認",
      submitting: "送信中...",
      admin: "管理者",
      strategist: "意思決定者",
      executor: "実行担当",
      days: "日",
      holdMonth: "保有",
      auditToast: "監査ログを記録しました: ",
      controlDeck: "意思決定コントロールデッキ",
      recommended: "優先推奨",
      notRecommended: "保守対応",
      decisionStack: "意思決定スタック",
      formulaSignal: "数式固定済み",
      compareTitle: "並列シナリオ評価",
      compareDesc: "1 / 2 / 3 か月の経路を並列比較し、優先度の高い案をより強い視覚層で強調します。",
    },
    th: {
      eyebrow: "Quant Engine",
      title: "เอนจินการตัดสินใจเชิงอาร์บิทราจ",
      sectionEyebrow: "Formula First",
      sectionTitle: "ข้อสรุปถือ / ขายที่ชัดเจนจากสูตรคณิตศาสตร์",
      sectionDesc: "ระบบคำนวณต้นทุนการถือ จุดคุ้มทุน ราคาขายคาดการณ์ และคะแนนความเสี่ยง แล้วส่งออกเพียง “ถือ” หรือ “ขาย” เท่านั้น กรณีความเสี่ยงสูงต้องเข้าสู่การยืนยันโดยมนุษย์",
      inputs: "Scenario Inputs",
      chooseBatch: "เลือกล็อตสินค้าคงคลัง",
      operatorRole: "บทบาทผู้ปฏิบัติ",
      formulaTitle: "สูตรเชิงปริมาณ",
      formulaDesc: "คำแนะนำ = ผลเปรียบเทียบกำไรสุทธิกับเกณฑ์ตัดสินใจ",
      formulaBody: "ต้นทุนการถือ = ต้นทุนปัจจุบัน + (คลัง + เงินทุน + การสูญเสีย) × จำนวนเดือน; จุดคุ้มทุน = ต้นทุนปัจจุบัน + ต้นทุนการถือในอนาคต; ราคาขายคาดการณ์ = ราคา Spot + (ราคา Futures ที่แมป - ราคา Spot) × 0.62 + การปรับตามฤดูกาล + การปรับด้านอุปทาน + แรงจูงใจตามระยะเวลา; หากกำไรสุทธิมากกว่าเกณฑ์ ให้ผลลัพธ์เป็นถือ มิฉะนั้นขาย",
      currentBatch: "ล็อตปัจจุบัน",
      part: "ชิ้นส่วน",
      warehouse: "คลัง",
      cost: "ต้นทุน",
      age: "อายุสินค้า",
      monthPlan: "แผน",
      breakEven: "จุดคุ้มทุน",
      expectedSell: "ราคาขายคาดการณ์",
      netProfit: "กำไรสุทธิ",
      risk: "ความเสี่ยง",
      confirmAction: "ยืนยัน",
      aiExplanation: "AI Explanation",
      clearConclusion: "ข้อสรุปที่ชัดเจน",
      clearConclusionDesc: "ระบบไม่ใช้ถ้อยคำกำกวม ทุกสถานการณ์จบด้วยคำว่า ถือ หรือ ขาย เท่านั้น",
      governance: "การกำกับความเสี่ยง",
      governanceDesc: "เมื่อระดับความเสี่ยงสูง เวิร์กโฟลว์ต้องเข้าสู่การอนุมัติของมนุษย์และบันทึกสถานการณ์ บทบาท และการกระทำลงในบันทึกการตรวจสอบ",
      confirmTitle: "การดำเนินการความเสี่ยงสูงต้องยืนยันซ้ำ",
      confirmDesc: "ระบบได้โหลดการเปรียบเทียบ 1 / 2 / 3 เดือนของล็อตเดียวกันไว้แล้ว เพื่อให้ผู้อนุมัติเปรียบเทียบจุดคุ้มทุน ราคาขายคาดการณ์ กำไรสุทธิ และความเสี่ยงก่อนอนุมัติ",
      scheme: "สถานการณ์",
      conclusion: "ข้อสรุป",
      cancel: "ยกเลิก",
      submit: "ยืนยันและบันทึกลงในบันทึกการตรวจสอบ",
      submitting: "กำลังส่ง...",
      admin: "ผู้ดูแลระบบ",
      strategist: "ผู้ตัดสินใจ",
      executor: "ผู้ปฏิบัติ",
      days: "วัน",
      holdMonth: "ถือ",
      auditToast: "บันทึกการตรวจสอบแล้ว: ",
      controlDeck: "เด็คควบคุมการตัดสินใจ",
      recommended: "แนะนำ",
      notRecommended: "แนวทางอนุรักษ์นิยม",
      decisionStack: "ชั้นการตัดสินใจ",
      formulaSignal: "ล็อกสูตรแล้ว",
      compareTitle: "การประเมินแบบขนาน",
      compareDesc: "เอนจินเปรียบเทียบเส้นทาง 1 / 2 / 3 เดือนแบบเคียงกัน และยกระดับตัวเลือกที่สำคัญที่สุดด้วยลำดับภาพที่ชัดกว่า",
    },
  }[language];

  const actionMap = {
    持有: { zh: "持有", en: "Hold", ja: "保有", th: "ถือ" },
    出售: { zh: "出售", en: "Sell", ja: "売却", th: "ขาย" },
  } as const;
  const riskMap = {
    低: { zh: "低", en: "Low", ja: "低", th: "ต่ำ" },
    中: { zh: "中", en: "Medium", ja: "中", th: "กลาง" },
    高: { zh: "高", en: "High", ja: "高", th: "สูง" },
  } as const;

  const utils = trpc.useUtils();
  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { data } = trpc.platform.scenarios.useQuery({ batchCode });
  const confirmDecision = trpc.platform.confirmDecision.useMutation({
    onSuccess: async result => {
      await utils.platform.auditLogs.invalidate();
      toast.success(`${copy.auditToast}${actionMap[result.audit.decision as keyof typeof actionMap]?.[language] ?? result.audit.decision}`);
      setPendingScenarioId(null);
    },
  });

  const pendingScenario = useMemo(
    () => data?.scenarios.find(item => item.scenarioId === pendingScenarioId) ?? null,
    [data, pendingScenarioId],
  );

  const recommendedScenario = useMemo(() => {
    if (!data?.scenarios?.length) return null;
    return [...data.scenarios].sort((a, b) => b.netProfitPerKg - a.netProfitPerKg)[0] ?? null;
  }, [data]);

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title} pageId="quant">
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={<div className="data-chip text-[12px]">{copy.formulaSignal}</div>}
      />

      <TechPanel className="mb-6 overflow-visible">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.controlDeck}</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{copy.compareTitle}</h3>
          </div>
          <Badge className="rounded-lg border-cyan-400/15 bg-cyan-400/[0.06] px-3.5 py-2 text-[11px] font-semibold text-cyan-200/80">{copy.compareDesc}</Badge>
        </div>
      </TechPanel>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_1.42fr]">
        <div className="space-y-6">
          <TechPanel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.inputs}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="mb-2 text-sm text-slate-400">{copy.chooseBatch}</p>
                <Select value={batchCode} onValueChange={setBatchCode}>
                  <SelectTrigger className="rounded-[20px] border-white/10 bg-slate-950/60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <SelectValue placeholder={copy.chooseBatch} />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] border-white/10 bg-slate-950 text-slate-100">
                    {snapshot?.inventoryBatches.map(batch => (
                      <SelectItem key={batch.batchCode} value={batch.batchCode}>
                        {batch.batchCode} · {batch.partName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-400">{copy.operatorRole}</p>
                <Select value={operatorRole} onValueChange={value => setOperatorRole(value as RoleCode)}>
                  <SelectTrigger className="rounded-[20px] border-white/10 bg-slate-950/60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <SelectValue placeholder={copy.operatorRole} />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] border-white/10 bg-slate-950 text-slate-100">
                    <SelectItem value="admin">{copy.admin}</SelectItem>
                    <SelectItem value="strategist">{copy.strategist}</SelectItem>
                    <SelectItem value="executor">{copy.executor}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TechPanel>

          <TechPanel>
            <div className="flex items-center gap-3">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                animate={{ boxShadow: ["0 0 0px rgba(56,189,248,0)", "0 0 16px rgba(56,189,248,0.15)", "0 0 0px rgba(56,189,248,0)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sigma className="h-4.5 w-4.5" />
              </motion.div>
              <div>
                <p className="text-base font-semibold text-white">{copy.formulaTitle}</p>
                <p className="text-sm text-slate-400">{copy.formulaDesc}</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 rounded-[24px] border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm leading-7 text-cyan-50/90 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <p className="relative">{copy.formulaBody}</p>
            </motion.div>
          </TechPanel>

          <TechPanel>
            <div className="flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-white">{copy.currentBatch}</p>
              <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">{copy.decisionStack}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-3 text-slate-300">{copy.part}：{data?.batch.partName}</div>
              <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-3 text-slate-300">{copy.warehouse}：{data?.batch.warehouse}</div>
              <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-3 text-slate-300">{copy.cost}：¥{data?.batch.unitCost}/kg</div>
              <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-3 text-slate-300">{copy.age}：{data?.batch.ageDays} {copy.days}</div>
            </div>
          </TechPanel>
        </div>

        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {data?.scenarios.map((scenario, index) => {
              const isRecommended = recommendedScenario?.scenarioId === scenario.scenarioId;
              const isHighRisk = scenario.riskLevel === "高";
              return (
                <motion.div
                  key={scenario.scenarioId}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`group relative overflow-hidden rounded-[32px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_80px_rgba(3,7,18,0.52)] transition-all duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_80px_rgba(3,7,18,0.52),0_0_30px_rgba(56,189,248,0.06)] ${
                    isRecommended
                      ? "border-cyan-300/20 bg-[radial-gradient(circle_at_top,_rgba(75,215,255,0.18),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018)),linear-gradient(180deg,rgba(9,17,31,0.94),rgba(7,12,22,0.92))]"
                      : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),linear-gradient(180deg,rgba(8,14,24,0.92),rgba(7,12,22,0.9))]"
                  }`}
                >
                  {isRecommended && (
                    <motion.div
                      className="absolute inset-0 rounded-[32px] pointer-events-none"
                      animate={{ boxShadow: ["0 0 0px rgba(56,189,248,0)", "0 0 30px rgba(56,189,248,0.08)", "0 0 0px rgba(56,189,248,0)"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {isHighRisk && (
                    <motion.div
                      className="absolute inset-0 rounded-[32px] pointer-events-none"
                      animate={{ boxShadow: ["0 0 0px rgba(251,113,133,0)", "0 0 20px rgba(251,113,133,0.08)", "0 0 0px rgba(251,113,133,0)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                  )}
                  {isRecommended ? (
                    <Badge className="absolute right-4 top-4 rounded-full border-cyan-300/20 bg-cyan-400/12 text-cyan-50">
                      <Zap className="mr-1 h-3 w-3" />
                      {copy.recommended}
                    </Badge>
                  ) : null}
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-400/8 blur-3xl" />
                  <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.holdMonth} {scenario.holdMonths}M</p>
                    <h3 className="mt-2 num-display text-3xl font-bold tracking-tight text-white">{copy.monthPlan} {scenario.holdMonths}</h3>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Badge className={scenario.action === "持有" ? "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "rounded-full border-rose-400/20 bg-rose-400/10 text-rose-100"}>
                        {actionMap[scenario.action]?.[language] ?? scenario.action}
                      </Badge>
                      <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        {scenario.action === "持有" ? copy.recommended : copy.notRecommended}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-300">
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * index + 0.1, duration: 0.4 }}
                        className="flex items-center justify-between rounded-[20px] border border-white/[0.05] bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-[13px] text-slate-400">{copy.breakEven}</span>
                        <span className="num-display font-semibold text-white">¥{scenario.breakEvenPrice.toFixed(2)}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * index + 0.2, duration: 0.4 }}
                        className="flex items-center justify-between rounded-[20px] border border-white/[0.05] bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-[13px] text-slate-400">{copy.expectedSell}</span>
                        <span className="num-display font-semibold text-white">¥{scenario.expectedSellPrice.toFixed(2)}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * index + 0.3, duration: 0.4 }}
                        className="flex items-center justify-between rounded-[20px] border border-white/[0.05] bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-[13px] text-slate-400">{copy.netProfit}</span>
                        <span className={scenario.netProfitPerKg > 0 ? "num-display font-semibold text-emerald-300" : "num-display font-semibold text-rose-300"}>
                          ¥<NumberTicker value={scenario.netProfitPerKg} decimals={2} />
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * index + 0.4, duration: 0.4 }}
                        className="flex items-center justify-between rounded-[20px] border border-white/[0.05] bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-[13px] text-slate-400">{copy.risk}</span>
                        <span className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
                          {isHighRisk && (
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="h-1.5 w-1.5 rounded-full bg-rose-400"
                            />
                          )}
                          {riskMap[scenario.riskLevel]?.[language] ?? scenario.riskLevel} · {scenario.riskScore}
                        </span>
                      </motion.div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-400">{scenario.reason}</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setPendingScenarioId(scenario.scenarioId)}
                        className={`mt-5 w-full rounded-xl font-semibold transition-all duration-300 ${
                          isRecommended
                            ? "bg-[linear-gradient(135deg,rgba(56,189,248,0.15),rgba(56,152,255,0.1))] border border-cyan-400/20 text-cyan-100 hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(56,152,255,0.15))] hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                            : "bg-white/[0.06] border border-white/[0.08] text-slate-200 hover:bg-white/[0.1] hover:border-white/[0.12]"
                        }`}
                      >
                        {copy.confirmAction} {actionMap[scenario.action]?.[language] ?? scenario.action}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <TechPanel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.aiExplanation}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="metric-orb rounded-[24px] p-4 text-sm leading-7 text-slate-300"
              >
                <div className="flex items-center gap-3 text-white">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </motion.div>
                  {copy.clearConclusion}
                </div>
                <p className="mt-3">{copy.clearConclusionDesc}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="metric-orb rounded-[24px] p-4 text-sm leading-7 text-slate-300"
              >
                <div className="flex items-center gap-3 text-white">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-300" />
                  </motion.div>
                  {copy.governance}
                </div>
                <p className="mt-3">{copy.governanceDesc}</p>
              </motion.div>
            </div>
          </TechPanel>
        </div>
      </div>

      <AlertDialog open={Boolean(pendingScenario)} onOpenChange={open => !open && setPendingScenarioId(null)}>
        <AlertDialogContent className="max-w-5xl rounded-[30px] border-white/10 bg-[linear-gradient(180deg,rgba(11,17,30,0.98),rgba(8,12,22,0.98))] text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl"><CircleAlert className="h-5 w-5 text-amber-300" />{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-sm leading-6 text-slate-400">
              <span className="block">{pendingScenario ? (actionMap[pendingScenario.action]?.[language] ?? pendingScenario.action) : ""} · {copy.monthPlan} {pendingScenario?.holdMonths}</span>
              <span className="block">{copy.confirmDesc}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="overflow-hidden rounded-[26px] border border-white/10">
            <div className="grid grid-cols-[0.7fr_0.9fr_0.9fr_0.9fr_0.8fr_0.8fr] border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">
              <span>{copy.scheme}</span><span>{copy.breakEven}</span><span>{copy.expectedSell}</span><span>{copy.netProfit}</span><span>{copy.risk}</span><span>{copy.conclusion}</span>
            </div>
            <div className="divide-y divide-white/8">
              {data?.scenarios.map(item => {
                const isRecommended = recommendedScenario?.scenarioId === item.scenarioId;
                return (
                  <div key={item.scenarioId} className={`grid grid-cols-[0.7fr_0.9fr_0.9fr_0.9fr_0.8fr_0.8fr] items-center gap-4 px-4 py-4 text-sm ${isRecommended ? "bg-cyan-400/[0.04]" : ""}`}>
                    <span className="font-medium text-white">{copy.holdMonth} {item.holdMonths} M</span>
                    <span className="text-slate-300">¥{item.breakEvenPrice.toFixed(2)}</span>
                    <span className="text-slate-300">¥{item.expectedSellPrice.toFixed(2)}</span>
                    <span className={item.netProfitPerKg > 0 ? "text-emerald-200" : "text-rose-200"}>¥{item.netProfitPerKg.toFixed(2)}</span>
                    <span className="text-slate-300">{riskMap[item.riskLevel]?.[language] ?? item.riskLevel} / {item.riskScore}</span>
                    <Badge className={item.action === "持有" ? "w-fit rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "w-fit rounded-full border-rose-400/20 bg-rose-400/10 text-rose-100"}>{actionMap[item.action]?.[language] ?? item.action}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.15),rgba(56,152,255,0.1))] border border-cyan-400/20 text-cyan-100 font-semibold hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(56,152,255,0.15))] hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all duration-300"
              onClick={event => {
                event.preventDefault();
                if (!pendingScenario) return;
                confirmDecision.mutate({
                  batchCode,
                  scenarioId: pendingScenario.scenarioId,
                  operatorRole,
                  operatorName: operatorRole === "admin" ? copy.admin : operatorRole === "strategist" ? copy.strategist : copy.executor,
                });
              }}
            >
              {confirmDecision.isPending ? copy.submitting : copy.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformShell>
  );
}
