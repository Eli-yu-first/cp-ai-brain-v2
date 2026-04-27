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
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileText,
  HelpCircle,
  History,
  LineChart as LineChartIcon,
  RefreshCw,
  Save,
  Search,
  Sigma,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RoleCode = "admin" | "strategist" | "executor";
type DecisionStatus = "待决策" | "已保存" | "待审批" | "已生成工单";

const formatMoney = (value: number) => `¥${Math.round(value).toLocaleString()}`;

export default function QuantPage() {
  const [batchCode, setBatchCode] = useState("CP-PK-240418-A1");
  const [operatorRole, setOperatorRole] = useState<RoleCode>("strategist");
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("sell-now");
  const [customDays, setCustomDays] = useState(45);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>("待决策");
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

  const decisionWorkspace = useMemo(() => {
    if (!data?.batch) return null;
    const batch = data.batch;
    const monthlyCarryCost = batch.storageCostPerMonth + batch.capitalCostPerMonth + batch.lossCostPerMonth;
    const immediateProfitPerKg = Number((batch.currentSpotPrice - batch.unitCost).toFixed(2));
    const immediateTotalProfit = Math.round(immediateProfitPerKg * batch.weightKg);
    const serverPlans = (data.scenarios ?? []).map((scenario, index) => {
      const totalProfit = Math.round(scenario.netProfitPerKg * batch.weightKg);
      const capitalCost = Math.max(1, batch.unitCost * batch.weightKg);
      const annualized = Number((((totalProfit / capitalCost) * (365 / Math.max(30, scenario.holdMonths * 30))) * 100).toFixed(2));
      return {
        id: scenario.scenarioId,
        title: `持有${scenario.holdMonths}个月`,
        badge: `方案${index + 2}`,
        days: scenario.holdMonths * 30,
        scenarioId: scenario.scenarioId,
        action: scenario.action,
        netIncome: totalProfit,
        annualized,
        profitPerKg: scenario.netProfitPerKg,
        breakEven: scenario.breakEvenPrice,
        expected: scenario.expectedSellPrice,
        riskScore: scenario.riskScore,
        riskLevel: scenario.riskLevel,
        reason: scenario.reason,
      };
    });
    const customMonths = customDays / 30;
    const customExpected = Number((batch.currentSpotPrice + (batch.futuresMappedPrice - batch.currentSpotPrice) * 0.78 + batch.seasonalAdjustment + customMonths * 0.18).toFixed(2));
    const customBreakEven = Number((batch.unitCost + monthlyCarryCost * customMonths).toFixed(2));
    const customProfitPerKg = Number((customExpected - customBreakEven).toFixed(2));
    const customTotalProfit = Math.round(customProfitPerKg * batch.weightKg);
    const plans = [
      {
        id: "sell-now",
        title: "立即出售",
        badge: "方案1",
        days: 0,
        action: "出售",
        netIncome: immediateTotalProfit,
        annualized: Number(((immediateProfitPerKg / Math.max(batch.unitCost, 1)) * 365 * 100).toFixed(2)),
        profitPerKg: immediateProfitPerKg,
        breakEven: batch.unitCost,
        expected: batch.currentSpotPrice,
        riskScore: Math.max(10, Math.round(batch.ageDays * 0.35)),
        riskLevel: "低",
        reason: "当前价格已覆盖批次成本，立即出售可锁定现金流并降低库龄风险。",
      },
      ...serverPlans,
      {
        id: "custom",
        title: "自定义周期",
        badge: "方案5",
        days: customDays,
        action: customProfitPerKg > 0 ? "持有" : "出售",
        netIncome: customTotalProfit,
        annualized: Number((((customTotalProfit / Math.max(batch.unitCost * batch.weightKg, 1)) * (365 / Math.max(customDays, 1))) * 100).toFixed(2)),
        profitPerKg: customProfitPerKg,
        breakEven: customBreakEven,
        expected: customExpected,
        riskScore: Math.min(92, Math.round(batch.ageDays * 0.62 + customDays * 0.34 + batch.concentration * 0.12)),
        riskLevel: customDays > 60 ? "中" : "低",
        reason: "自定义周期基于期货映射价、季节因子、仓储资金成本和库龄风险进行外推。",
      },
    ];
    const selected = plans.find(plan => plan.id === selectedPlanId) ?? plans[0]!;
    const forecast = [0, 7, 15, 30, 45, 60, 90].map(day => {
      const projected = Number((batch.currentSpotPrice + (batch.futuresMappedPrice - batch.currentSpotPrice) * Math.min(1, day / 90) + batch.seasonalAdjustment * Math.min(1, day / 45)).toFixed(2));
      const breakEven = Number((batch.unitCost + monthlyCarryCost * (day / 30)).toFixed(2));
      return {
        label: day === 0 ? "今日" : `+${day}天`,
        predicted: projected,
        futures: Number((batch.futuresMappedPrice - Math.max(0, (90 - day) * 0.003)).toFixed(2)),
        currentCost: batch.unitCost,
        breakEven,
      };
    });
    return { plans, selected, forecast, monthlyCarryCost };
  }, [customDays, data, selectedPlanId]);

  const handleDecisionOperation = (next: DecisionStatus) => {
    setDecisionStatus(next);
    if (next === "已保存") {
      toast.success("模拟方案已保存，可用于后续对比复盘。");
    } else if (next === "待审批") {
      toast.success("方案已提交审批流，等待风控与负责人确认。");
    } else {
      toast.success("执行工单已生成：库存、财务、销售同步接收。");
    }
  };

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title} pageId="quant">
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={<div className="data-chip text-[12px]">{copy.formulaSignal}</div>}
      />

      {decisionWorkspace && (
        <div className="mb-6 grid gap-4 xl:grid-cols-[300px_1fr_320px]">
          <div className="space-y-4">
            <TechPanel className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-white">批次信息查询</h3>
              <div className="space-y-3 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-500">批次号</span>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-slate-200">
                    <span className="min-w-0 flex-1 truncate">{batchCode}</span>
                    <Search className="h-4 w-4 text-cyan-300" />
                  </div>
                </label>
                <div>
                  <span className="mb-1 block text-xs text-slate-500">部位</span>
                  <Select value={batchCode} onValueChange={setBatchCode}>
                    <SelectTrigger className="h-10 rounded-lg border-white/10 bg-slate-950/60 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[16px] border-white/10 bg-slate-950 text-slate-100">
                      {snapshot?.inventoryBatches.map(batch => (
                        <SelectItem key={batch.batchCode} value={batch.batchCode}>
                          {batch.partName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {[
                  ["仓库", data?.batch.warehouse ?? "-"],
                  ["入库日期", "2025-06-20"],
                  ["库龄", `${data?.batch.ageDays ?? 0} 天`],
                  ["数量", `${Math.round((data?.batch.weightKg ?? 0) / 1000).toLocaleString()} 吨`],
                  ["当前成本", `¥${data?.batch.unitCost.toFixed(2)} /kg`],
                  ["当前价", `¥${data?.batch.currentSpotPrice.toFixed(2)} /kg`],
                  ["期货映射价", `¥${data?.batch.futuresMappedPrice.toFixed(2)} /kg`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
            </TechPanel>

            <TechPanel className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">批次详情</h3>
              <div className="space-y-2 text-sm text-slate-400">
                {[
                  ["产品名称", data?.batch.partName ?? "-"],
                  ["规格", "10kg/箱"],
                  ["质量等级", (data?.batch.concentration ?? 0) > 60 ? "关注 (B)" : "合格 (A)"],
                  ["批次状态", "可用"],
                  ["备注", "-"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-white/8 py-2">
                    <span>{label}</span>
                    <span className="text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
            </TechPanel>
          </div>

          <div className="space-y-4">
            <TechPanel className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">方案对比分析 <span className="text-slate-500">（基于当前数据与AI预测）</span></h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">预测模型：AI-Price v3.2</span>
                  <Button size="sm" variant="outline" onClick={() => toast.success("已重新预测方案收益。")} className="h-8 border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />重新预测
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                {decisionWorkspace.plans.map(plan => {
                  const active = decisionWorkspace.selected.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "min-h-[118px] rounded-2xl border p-3 text-left transition-all",
                        active ? "border-emerald-300/50 bg-emerald-500/[0.12] shadow-[0_0_24px_rgba(16,185,129,0.18)]" : "border-blue-500/25 bg-blue-950/30 hover:border-cyan-400/40",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge className={active ? "bg-emerald-400 text-slate-950" : "border-blue-500/30 bg-blue-500/15 text-blue-200"}>{plan.badge}</Badge>
                        {active ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
                      </div>
                      <p className="text-lg font-black text-white">{plan.title}</p>
                      {plan.id === "custom" ? (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <span>持有</span>
                          <input
                            value={customDays}
                            onChange={event => setCustomDays(Math.min(120, Math.max(1, Number(event.target.value) || 1)))}
                            className="h-7 w-14 rounded border border-white/10 bg-slate-950 px-2 text-center font-mono text-cyan-200"
                          />
                          <span>天</span>
                        </div>
                      ) : null}
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">净收益</span><span className="font-mono text-cyan-200">{formatMoney(plan.netIncome)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">年化收益</span><span className="font-mono text-emerald-300">{plan.annualized.toFixed(2)}%</span></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TechPanel>

            <div className="grid gap-4 lg:grid-cols-[.9fr_1fr]">
              <TechPanel className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{decisionWorkspace.selected.badge} · {decisionWorkspace.selected.title}</h3>
                  <span className="text-xs text-slate-500">预计出库日期：{decisionWorkspace.selected.days === 0 ? "今日" : `+${decisionWorkspace.selected.days}天`}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/8">
                    {[
                      ["当前单位成本", "批次当前成本", data?.batch.unitCost.toFixed(2), "含采购+加工+入库费用"],
                      ["仓储成本", "仓储费率×库龄/周期", (decisionWorkspace.monthlyCarryCost * decisionWorkspace.selected.days / 30).toFixed(2), "含冷链、库租、能耗"],
                      ["资金成本", "资金占用成本", (data?.batch.capitalCostPerMonth ?? 0).toFixed(2), "年化资金成本"],
                      ["未来保本价", "成本+持有成本", decisionWorkspace.selected.breakEven.toFixed(2), "基于方案周期"],
                      ["预计售价", "AI价格预测", decisionWorkspace.selected.expected.toFixed(2), "基于期货+现货+库存因子"],
                      ["单吨净收益", "价差×1000", (decisionWorkspace.selected.profitPerKg * 1000).toFixed(0), "-"],
                      ["总收益", "单吨净收益×数量", decisionWorkspace.selected.netIncome.toLocaleString(), "-"],
                      ["年化收益率", "收益/资金成本×365", `${decisionWorkspace.selected.annualized.toFixed(2)}%`, "-"],
                    ].map(row => (
                      <tr key={row[0]}>
                        <td className="py-2 text-slate-400">{row[0]}</td>
                        <td className="py-2 text-slate-500">{row[1]}</td>
                        <td className="py-2 text-right font-mono text-emerald-300">{row[2]}</td>
                        <td className="py-2 text-right text-slate-500">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TechPanel>

              <TechPanel className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <LineChartIcon className="h-4 w-4 text-cyan-300" />未来价格预测趋势 <span className="text-xs text-slate-500">（元/kg）</span>
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={decisionWorkspace.forecast}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                    <Tooltip contentStyle={{ background: "#071426", border: "1px solid rgba(56,189,248,.2)", borderRadius: 12 }} />
                    <Line dataKey="predicted" name="预测售价" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line dataKey="futures" name="期货映射价" stroke="#60a5fa" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line dataKey="currentCost" name="当前成本" stroke="#facc15" strokeDasharray="3 5" strokeWidth={2} dot={false} />
                    <Line dataKey="breakEven" name="保本价" stroke="#fb923c" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </TechPanel>
            </div>

            <div className="grid gap-4 lg:grid-cols-[.95fr_1fr]">
              <TechPanel className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">风险评估（{decisionWorkspace.selected.title}）</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["库龄风险", Math.min(100, data?.batch.ageDays ?? 0), `库龄 ${data?.batch.ageDays ?? 0} 天`, "emerald"],
                    ["价格风险", Math.min(100, Math.abs((data?.batch.futuresMappedPrice ?? 0) - (data?.batch.currentSpotPrice ?? 0)) * 15), "价格波动率", "amber"],
                    ["集中度风险", data?.batch.concentration ?? 0, `占上库库存 ${data?.batch.concentration ?? 0}%`, "amber"],
                    ["期限风险", decisionWorkspace.selected.days, `持有期限 ${decisionWorkspace.selected.days} 天`, "emerald"],
                  ].map(([label, value, sub, tone]) => (
                    <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{String(label)}</span>
                        <span className={cn("font-mono text-lg font-black", tone === "amber" ? "text-amber-300" : "text-emerald-300")}>{Number(value).toFixed(0)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{String(sub)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
                  <p className="text-3xl font-black text-emerald-300">{decisionWorkspace.selected.riskScore}<span className="text-sm text-slate-500">/100</span></p>
                  <p className="mt-1 text-sm text-emerald-200">{decisionWorkspace.selected.riskLevel}风险 · 整体风险可控，建议执行</p>
                </div>
              </TechPanel>

              <TechPanel className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-cyan-300" />AI 决策解释（{decisionWorkspace.selected.title}）
                </h3>
                <div className="flex gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
                    <Sparkles className="h-8 w-8 text-cyan-200" />
                  </div>
                  <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                    <p><strong className="text-emerald-300">结论：</strong>{decisionWorkspace.selected.action === "出售" ? "推荐执行立即出售/释放库存。" : `推荐执行${decisionWorkspace.selected.title}。`}</p>
                    <p>{decisionWorkspace.selected.reason}</p>
                    <p>预计净收益 {formatMoney(decisionWorkspace.selected.netIncome)}，保本价 {decisionWorkspace.selected.breakEven.toFixed(2)} 元/kg，预测售价 {decisionWorkspace.selected.expected.toFixed(2)} 元/kg。</p>
                    <p>是否需要审批：<strong className="text-emerald-300">{decisionWorkspace.selected.riskLevel === "高" ? "需要" : "不需要"} ✓</strong></p>
                  </div>
                </div>
              </TechPanel>
            </div>

            <TechPanel className="p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Button onClick={() => setPendingScenarioId(decisionWorkspace.selected.id ?? recommendedScenario?.scenarioId ?? null)} className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <CheckCircle2 className="mr-2 h-4 w-4" />确认{decisionWorkspace.selected.action}
                </Button>
                <Button onClick={() => setSelectedPlanId(recommendedScenario?.scenarioId ?? "sell-now")} className="bg-blue-600 text-white hover:bg-blue-500">
                  <CalendarDays className="mr-2 h-4 w-4" />确认持有
                </Button>
                <Button onClick={() => handleDecisionOperation("待审批")} className="bg-violet-600 text-white hover:bg-violet-500">
                  <ClipboardCheck className="mr-2 h-4 w-4" />提交审批
                </Button>
                <Button onClick={() => handleDecisionOperation("已保存")} variant="outline" className="border-white/10 bg-white/[0.04] text-slate-200">
                  <Save className="mr-2 h-4 w-4" />保存模拟方案
                </Button>
                <Button onClick={() => handleDecisionOperation("已生成工单")} variant="outline" className="border-white/10 bg-white/[0.04] text-slate-200">
                  <FileText className="mr-2 h-4 w-4" />生成工单
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">温馨提示：确认后将生成执行工单并锁定当前策略数据，用于后续审计与复盘。</p>
            </TechPanel>
          </div>

          <aside className="space-y-4">
            <TechPanel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">决策记录</h3>
                <Badge className="bg-emerald-500/15 text-emerald-200">{decisionStatus}</Badge>
              </div>
              {[
                ["策略版本", "v2.4.1", "当前"],
                ["创建时间", "2025-07-01 10:28:36", ""],
                ["创建人", operatorRole === "admin" ? "管理员" : "潘猛", ""],
                ["数据依照", "2025-07-01 10:28:30", ""],
                ["预测模型", "AI-Price v3.2", ""],
                ["方案状态", decisionStatus, ""],
              ].map(([label, value, tag]) => (
                <div key={label} className="flex justify-between border-b border-white/8 py-2 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200">{value} {tag ? <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">{tag}</span> : null}</span>
                </div>
              ))}
            </TechPanel>

            <TechPanel className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-white">审批流与操作记录</h3>
              {[
                ["发起", "提交方案", "10:28:36", "提交方案：" + decisionWorkspace.selected.title],
                ["系统校验", "风险校验通过", "10:28:37", "规划校验通过"],
                ["AI解释生成", "已生成AI决策解释", "10:28:38", "推荐方案：" + decisionWorkspace.selected.title],
                ["待操作", "等待用户操作", "10:28:38", decisionStatus],
              ].map(([stage, title, time, desc], index) => (
                <div key={stage} className="relative mb-3 pl-8">
                  <div className={cn("absolute left-0 top-1 grid h-6 w-6 place-items-center rounded-full border", index < 3 ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200" : "border-amber-400/40 bg-amber-500/15 text-amber-200")}>
                    {index + 1}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex justify-between text-xs"><span className="text-cyan-200">{title}</span><span className="text-slate-500">{time}</span></div>
                    <p className="mt-1 text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </TechPanel>

            <TechPanel className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <History className="h-4 w-4 text-cyan-300" />历史决策记录（近30天）
              </h3>
              {[
                ["06-30", "持有2个月", "已完成", 812913],
                ["06-29", "立即出售", "已完成", 623451],
                ["06-27", "持有1个月", "已完成", 531882],
                ["06-25", "立即出售", "已完成", 412680],
              ].map(row => (
                <div key={row.join("-")} className="grid grid-cols-4 border-b border-white/8 py-2 text-xs text-slate-400">
                  <span>{row[0]}</span>
                  <span>{row[1]}</span>
                  <span className="text-emerald-300">{row[2]}</span>
                  <span className="text-right font-mono text-slate-200">{Number(row[3]).toLocaleString()}</span>
                </div>
              ))}
            </TechPanel>
          </aside>
        </div>
      )}

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
