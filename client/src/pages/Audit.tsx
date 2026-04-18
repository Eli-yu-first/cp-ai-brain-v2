import { PlatformShell } from "@/components/platform/PlatformShell";
import { GlassPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { History, ScanSearch, ShieldCheck, Sparkles, UserRoundCog } from "lucide-react";
import { motion } from "framer-motion";

export default function AuditPage() {
  const { data: logs } = trpc.platform.auditLogs.useQuery();
  const { data: snapshot } = trpc.platform.snapshot.useQuery({ timeframe: "month" });
  const { language } = useLanguage();

  const copy = {
    zh: {
      eyebrow: "Audit & Compliance",
      title: "全流程审计日志",
      sectionEyebrow: "Traceability",
      sectionTitle: "全部关键操作可追溯、可审计、可复盘",
      sectionDesc: "该页面集中展示策略确认、高风险审批、执行反馈与角色动作记录，体现平台的商业化合规能力与人机协同边界。",
      governance: "Governance",
      humanAiTitle: "人机协同边界",
      compliance: "可审计",
      checkpointsTitle: "合规校验点",
      checkpointsDesc: "高风险动作不可跳过弹窗，所有状态变更必须记录前后值。",
      checkpoint1: "策略阈值调整必须记录操作者与调整前后参数。",
      checkpoint2: "高风险决策进入待审批状态后不得直接执行。",
      checkpoint3: "执行动作回传后需记录责任角色与执行时间。",
      auditTrail: "Audit Trail",
      latestLogs: "最新操作日志",
      action: "动作",
      entity: "实体",
      role: "角色",
      status: "状态",
      controlDeck: "治理控制台",
      traceSignalA: "高风险审批",
      traceSignalB: "角色权限边界",
      traceSignalC: "全链路留痕",
      latestBoard: "审计中枢面板",
      before: "变更前",
      after: "变更后",
    },
    en: {
      eyebrow: "Audit & Compliance",
      title: "End-to-End Audit Log",
      sectionEyebrow: "Traceability",
      sectionTitle: "Every key action is traceable, auditable, and reviewable",
      sectionDesc: "This page centralizes strategy confirmation, high-risk approval, execution feedback, and role actions to demonstrate commercial compliance and human-AI governance boundaries.",
      governance: "Governance",
      humanAiTitle: "Human-AI Governance Boundary",
      compliance: "Auditable",
      checkpointsTitle: "Compliance Checkpoints",
      checkpointsDesc: "High-risk actions cannot skip confirmation, and every status change must record before and after values.",
      checkpoint1: "Any strategy threshold change must record operator and before/after parameters.",
      checkpoint2: "High-risk decisions cannot be executed directly once they enter pending approval.",
      checkpoint3: "Execution feedback must record owner role and execution timestamp.",
      auditTrail: "Audit Trail",
      latestLogs: "Latest action logs",
      action: "Action",
      entity: "Entity",
      role: "Role",
      status: "Status",
      controlDeck: "Governance Control Deck",
      traceSignalA: "High-risk approval",
      traceSignalB: "Role boundary",
      traceSignalC: "Full traceability",
      latestBoard: "Audit command board",
      before: "Before",
      after: "After",
    },
    ja: {
      eyebrow: "Audit & Compliance",
      title: "全工程監査ログ",
      sectionEyebrow: "Traceability",
      sectionTitle: "すべての主要アクションは追跡・監査・レビュー可能",
      sectionDesc: "本ページは、戦略確認、高リスク承認、実行フィードバック、役割別アクション記録を集約し、商用コンプライアンスと人機協調の境界を示します。",
      governance: "Governance",
      humanAiTitle: "人機協調の境界",
      compliance: "監査可能",
      checkpointsTitle: "コンプライアンス確認点",
      checkpointsDesc: "高リスク操作は確認ダイアログを省略できず、すべての状態変更で前後値を記録する必要があります。",
      checkpoint1: "戦略閾値の変更では、操作者と変更前後のパラメータを記録する必要があります。",
      checkpoint2: "高リスク判断は承認待ちに入った後、直接実行してはなりません。",
      checkpoint3: "実行結果の返却時には責任ロールと実行時刻を記録する必要があります。",
      auditTrail: "Audit Trail",
      latestLogs: "最新操作ログ",
      action: "アクション",
      entity: "エンティティ",
      role: "ロール",
      status: "状態",
      controlDeck: "ガバナンス制御デッキ",
      traceSignalA: "高リスク承認",
      traceSignalB: "権限境界",
      traceSignalC: "全工程トレース",
      latestBoard: "監査コマンドボード",
      before: "変更前",
      after: "変更後",
    },
    th: {
      eyebrow: "Audit & Compliance",
      title: "บันทึกการตรวจสอบครบวงจร",
      sectionEyebrow: "Traceability",
      sectionTitle: "ทุกการดำเนินการสำคัญสามารถติดตาม ตรวจสอบ และทบทวนได้",
      sectionDesc: "หน้านี้รวบรวมการยืนยันกลยุทธ์ การอนุมัติความเสี่ยงสูง ผลการปฏิบัติ และบันทึกการกระทำของแต่ละบทบาท เพื่อแสดงความพร้อมเชิงพาณิชย์และขอบเขตการกำกับคน-เอไอ",
      governance: "Governance",
      humanAiTitle: "ขอบเขตการกำกับคน-เอไอ",
      compliance: "ตรวจสอบได้",
      checkpointsTitle: "จุดตรวจสอบด้านกำกับดูแล",
      checkpointsDesc: "การดำเนินการความเสี่ยงสูงไม่สามารถข้ามหน้าต่างยืนยัน และทุกการเปลี่ยนสถานะต้องบันทึกค่าก่อนและหลัง",
      checkpoint1: "การปรับเกณฑ์กลยุทธ์ต้องบันทึกผู้ปฏิบัติและพารามิเตอร์ก่อน/หลังทุกครั้ง",
      checkpoint2: "การตัดสินใจความเสี่ยงสูงไม่สามารถดำเนินการตรงได้หลังเข้าสถานะรออนุมัติ",
      checkpoint3: "เมื่อส่งผลการปฏิบัติกลับ ต้องบันทึกบทบาทผู้รับผิดชอบและเวลาในการดำเนินการ",
      auditTrail: "Audit Trail",
      latestLogs: "บันทึกการดำเนินการล่าสุด",
      action: "การกระทำ",
      entity: "เอนทิตี",
      role: "บทบาท",
      status: "สถานะ",
      controlDeck: "เด็คควบคุมธรรมาภิบาล",
      traceSignalA: "อนุมัติความเสี่ยงสูง",
      traceSignalB: "ขอบเขตบทบาท",
      traceSignalC: "ร่องรอยครบวงจร",
      latestBoard: "บอร์ดบัญชาการตรวจสอบ",
      before: "ก่อนเปลี่ยน",
      after: "หลังเปลี่ยน",
    },
  }[language];

  const roleMap = {
    admin: { zh: "管理员", en: "Administrator", ja: "管理者", th: "ผู้ดูแลระบบ" },
    strategist: { zh: "决策者", en: "Decision Maker", ja: "意思決定者", th: "ผู้ตัดสินใจ" },
    executor: { zh: "执行者", en: "Executor", ja: "実行担当", th: "ผู้ปฏิบัติ" },
  } as const;
  const riskMap = {
    低: { zh: "低", en: "Low", ja: "低", th: "ต่ำ" },
    中: { zh: "中", en: "Medium", ja: "中", th: "กลาง" },
    高: { zh: "高", en: "High", ja: "高", th: "สูง" },
  } as const;
  const statusMap = {
    已确认: { zh: "已确认", en: "Confirmed", ja: "確認済み", th: "ยืนยันแล้ว" },
    待审批: { zh: "待审批", en: "Pending Approval", ja: "承認待ち", th: "รออนุมัติ" },
    已执行: { zh: "已执行", en: "Executed", ja: "実行済み", th: "ดำเนินการแล้ว" },
  } as const;

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title}>
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="data-chip text-[12px]">{copy.traceSignalA}</div>
            <div className="data-chip text-[12px]">{copy.traceSignalB}</div>
            <div className="data-chip text-[12px]">{copy.traceSignalC}</div>
          </div>
        }
      />

      <GlassPanel className="mb-6 overflow-visible">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.controlDeck}</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{copy.latestBoard}</h3>
          </div>
          <Badge className="rounded-lg border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2 text-[11px] font-semibold text-emerald-200/80">{copy.compliance}</Badge>
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_1.52fr]">
        <div className="space-y-6">
          <GlassPanel>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.governance}</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.humanAiTitle}</h3>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {snapshot?.roleProfiles.map((role, index) => (
                <motion.div
                  key={role.code}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),linear-gradient(180deg,rgba(8,14,24,0.92),rgba(7,12,22,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(56,152,255,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-cyan-400/15 bg-cyan-400/8 text-cyan-200">
                        <UserRoundCog className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{roleMap[role.code]?.[language] ?? role.name}</p>
                        <p className="text-xs text-slate-500">{role.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full border-white/10 bg-white/[0.04] text-slate-200">0{index + 1}</Badge>
                      <Badge className="rounded-full border-white/10 bg-white/[0.04] text-slate-200">{copy.compliance}</Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] leading-[1.7] text-slate-400">{role.decisionLimit}</p>
                  <p className="mt-2 text-[11px] leading-5 text-cyan-100/80">{role.approvalRule}</p>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><ScanSearch className="h-4.5 w-4.5" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white">{copy.checkpointsTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">{copy.checkpointsDesc}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[copy.checkpoint1, copy.checkpoint2, copy.checkpoint3].map(item => (
                <div key={item} className="metric-orb rounded-[22px] p-4 text-sm leading-6 text-slate-300">{item}</div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <GlassPanel>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100"><History className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.auditTrail}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-white">{copy.latestLogs}</h3>
            </div>
            <div className="ml-auto flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-slate-300"><Sparkles className="h-4.5 w-4.5" /></div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="grid grid-cols-[1.15fr_1fr_0.85fr_0.8fr] border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">
              <span>{copy.action}</span><span>{copy.entity}</span><span>{copy.role}</span><span>{copy.status}</span>
            </div>
            <div className="divide-y divide-white/8">
              {logs?.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.35 }}
                  className="grid grid-cols-[1.15fr_1fr_0.85fr_0.8fr] gap-4 px-5 py-4 text-sm transition-colors hover:bg-white/[0.02]">
                  <div>
                    <p className="font-medium text-white">{log.actionType}</p>
                    <p className="mt-2 leading-6 text-slate-400">{log.decision}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-200">{log.entityId}</p>
                    <div className="mt-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-3 text-xs leading-5 text-slate-500">
                      <span className="block uppercase tracking-[0.18em] text-slate-600">{copy.before}</span>
                      <span className="mt-1 block">{log.beforeValue}</span>
                    </div>
                    <div className="mt-2 rounded-[18px] border border-cyan-400/10 bg-cyan-400/5 p-3 text-xs leading-5 text-cyan-100/80">
                      <span className="block uppercase tracking-[0.18em] text-cyan-200/60">{copy.after}</span>
                      <span className="mt-1 block">{log.afterValue}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-200">{log.operatorName}</p>
                    <p className="mt-2 text-xs text-slate-500">{roleMap[log.operatorRole]?.[language] ?? log.operatorRole}</p>
                    <Badge className="mt-2 rounded-full border-white/10 bg-white/[0.05] text-slate-200">{riskMap[log.riskLevel]?.[language] ?? log.riskLevel}</Badge>
                  </div>
                  <div className="flex items-start">
                    <Badge className={log.status === "待审批" ? "rounded-full border-amber-400/20 bg-amber-400/10 text-amber-100" : log.status === "已执行" ? "rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-100"}>{statusMap[log.status]?.[language] ?? log.status}</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </PlatformShell>
  );
}
