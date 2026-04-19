import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Building2, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function TenantsPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { data } = trpc.platform.snapshot.useQuery({ timeframe: "month" });

  const copy = {
    zh: {
      eyebrow: "Commercial SaaS",
      title: "多租户与权限治理",
      sectionEyebrow: "Tenant Architecture",
      sectionTitle: "面向集团级农牧业务的可商业化多租户架构",
      sectionDesc:
        "平台以租户隔离、事业部扩展、角色分权和审计留痕为核心，支持总部战略视图、区域经营视图与单事业部执行视图的统一交付。",
      enterWorkspace: "进入租户工作台",
      roleMatrix: "Role Matrix",
      unifiedOverview: "进入全产业链总览",
      auditable: "可审计",
      tenantStack: "Tenant Stack",
      tenantStackDesc: "同一产品底座下，按组织、区域和业务板块交付独立工作空间。",
      environment: "环境",
      region: "区域",
      roleBoundary: "角色边界",
      governanceTitle: "治理控制面",
      governanceDesc: "角色边界、审批规则与审计要求被统一编码，适用于总部到区域公司的连续管理。",
      roleLimit: "权限范围",
      approvalRule: "审批规则",
    },
    en: {
      eyebrow: "Commercial SaaS",
      title: "Multi-Tenant Governance",
      sectionEyebrow: "Tenant Architecture",
      sectionTitle: "Commercial multi-tenant architecture for agri-food groups",
      sectionDesc:
        "The platform is built around tenant isolation, business-unit scalability, role segregation, and auditability, enabling unified delivery for headquarters, regional operations, and division-level workspaces.",
      enterWorkspace: "Open Tenant Workspace",
      roleMatrix: "Role Matrix",
      unifiedOverview: "Open Value Chain Overview",
      auditable: "Auditable",
      tenantStack: "Tenant Stack",
      tenantStackDesc: "One product foundation delivers separate workspaces by organization, region, and business unit.",
      environment: "Environment",
      region: "Region",
      roleBoundary: "Role Boundary",
      governanceTitle: "Governance Control Layer",
      governanceDesc: "Role boundaries, approval rules, and audit requirements are encoded in one model for HQ-to-region operations.",
      roleLimit: "Permission Scope",
      approvalRule: "Approval Rule",
    },
    ja: {
      eyebrow: "Commercial SaaS",
      title: "マルチテナントと権限統治",
      sectionEyebrow: "Tenant Architecture",
      sectionTitle: "農牧グループ向け商用マルチテナント構成",
      sectionDesc:
        "本プラットフォームは、テナント分離、事業部拡張、役割分権、監査証跡を中核にし、本社・地域会社・単一事業部向けに統一された提供を実現します。",
      enterWorkspace: "テナントワークスペースへ",
      roleMatrix: "Role Matrix",
      unifiedOverview: "全産業チェーン概況へ",
      auditable: "監査可能",
      tenantStack: "Tenant Stack",
      tenantStackDesc: "単一の製品基盤から、組織・地域・事業単位ごとに独立したワークスペースを提供します。",
      environment: "環境",
      region: "地域",
      roleBoundary: "権限制御",
      governanceTitle: "ガバナンス制御層",
      governanceDesc: "役割境界、承認ルール、監査要件を一つのモデルで統合し、本社から地域会社まで連続的に管理できます。",
      roleLimit: "権限範囲",
      approvalRule: "承認ルール",
    },
    th: {
      eyebrow: "Commercial SaaS",
      title: "สถาปัตยกรรมผู้เช่าหลายรายและการกำกับสิทธิ์",
      sectionEyebrow: "Tenant Architecture",
      sectionTitle: "สถาปัตยกรรมหลายผู้เช่าสำหรับกลุ่มธุรกิจเกษตรอาหาร",
      sectionDesc:
        "แพลตฟอร์มนี้ออกแบบบนแนวคิดการแยกผู้เช่า การขยายตามหน่วยธุรกิจ การแบ่งสิทธิ์ตามบทบาท และการบันทึกตรวจสอบ เพื่อส่งมอบให้สำนักงานใหญ่ ภูมิภาค และหน่วยธุรกิจได้อย่างเป็นหนึ่งเดียว",
      enterWorkspace: "เข้าสู่พื้นที่ทำงานของผู้เช่า",
      roleMatrix: "Role Matrix",
      unifiedOverview: "เปิดภาพรวมทั้งห่วงโซ่",
      auditable: "ตรวจสอบได้",
      tenantStack: "Tenant Stack",
      tenantStackDesc: "ฐานผลิตภัณฑ์เดียวสามารถส่งมอบพื้นที่ทำงานแยกตามองค์กร ภูมิภาค และหน่วยธุรกิจได้",
      environment: "สภาพแวดล้อม",
      region: "ภูมิภาค",
      roleBoundary: "ขอบเขตบทบาท",
      governanceTitle: "ชั้นควบคุมธรรมาภิบาล",
      governanceDesc: "ขอบเขตบทบาท กฎการอนุมัติ และข้อกำหนดการตรวจสอบถูกเข้ารหัสไว้ในโมเดลเดียวสำหรับการบริหารจากสำนักงานใหญ่ถึงภูมิภาค",
      roleLimit: "ขอบเขตสิทธิ์",
      approvalRule: "กฎการอนุมัติ",
    },
  }[language];

  const roleMap = {
    admin: { zh: "管理员", en: "Administrator", ja: "管理者", th: "ผู้ดูแลระบบ" },
    strategist: { zh: "决策者", en: "Decision Maker", ja: "意思決定者", th: "ผู้ตัดสินใจ" },
    executor: { zh: "执行者", en: "Executor", ja: "実行担当", th: "ผู้ปฏิบัติ" },
  } as const;

  return (
    <PlatformShell eyebrow={copy.eyebrow} title={copy.title} pageId="tenants">
      <SectionHeader
        eyebrow={copy.sectionEyebrow}
        title={copy.sectionTitle}
        description={copy.sectionDesc}
        aside={<div className="data-chip text-[12px]">{copy.tenantStackDesc}</div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <TechPanel>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{copy.tenantStack}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{copy.enterWorkspace}</h3>
            </div>
            <Badge className="rounded-lg border-cyan-400/15 bg-cyan-400/[0.06] px-3.5 py-2 text-[11px] font-semibold text-cyan-200/80">{copy.auditable}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.tenantOptions.map((tenant, index) => (
              <motion.button
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setLocation("/overview")}
                className="group metric-orb rounded-[30px] p-5 text-left transition-all duration-300 hover:translate-y-[-2px] hover:border-cyan-300/20 hover:shadow-[0_12px_40px_rgba(56,189,248,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-13 w-13 items-center justify-center rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-300">0{index + 1}</Badge>
                </div>
                <h3 className="mt-6 text-lg font-semibold leading-7 text-white">{tenant.name}</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{copy.environment}</p>
                    <p className="mt-2 text-slate-200">{tenant.environment}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{copy.region}</p>
                    <p className="mt-2 text-slate-200">{tenant.region}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tenant.rolePreview.map(role => (
                    <span key={role} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-cyan-200">
                  {copy.enterWorkspace}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </TechPanel>

        <TechPanel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{copy.roleMatrix}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{copy.governanceTitle}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-[1.7] text-slate-400/80">{copy.governanceDesc}</p>

          <div className="mt-6 space-y-4">
            {data?.roleProfiles.map((role, index) => (
              <motion.div
                key={role.code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(56,152,255,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{roleMap[role.code]?.[language] ?? role.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{role.code}</p>
                    </div>
                  </div>
                  <Badge className="rounded-full border-white/10 bg-white/[0.05] text-slate-200">{copy.auditable}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-[18px] border border-white/8 bg-slate-950/45 p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{copy.roleLimit}</p>
                    <p className="mt-2 leading-6 text-slate-300">{role.decisionLimit}</p>
                  </div>
                  <div className="rounded-[18px] border border-cyan-400/10 bg-cyan-400/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{copy.approvalRule}</p>
                    <p className="mt-2 leading-6 text-cyan-100/80">{role.approvalRule}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={() => setLocation("/overview")}
            className="mt-6 w-full rounded-xl bg-[linear-gradient(135deg,rgba(56,189,248,0.15),rgba(56,152,255,0.1))] border border-cyan-400/20 text-cyan-100 font-semibold hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(56,152,255,0.15))] hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all duration-300"
          >
            {copy.unifiedOverview}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </TechPanel>
      </div>
    </PlatformShell>
  );
}
