import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlobalAssetMap } from "./GlobalAssetMap";
import {
  Activity,
  Globe,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage, type LanguageCode } from "@/contexts/LanguageContext";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "zh", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "th", label: "ไทย" },
];

const navIcons = [LayoutGrid, Workflow, Sparkles, ShieldCheck, UsersRound] as const;

export function PlatformShell({
  children,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const shellCopy = {
    zh: {
      aiControl: "Formula-driven operation fabric",
      humanAiTitle: "Human + AI Governance",
      humanAiBody: "高风险动作只能在人工确认后执行，系统默认保留全过程审计轨迹与责任边界。",
      liveStatus: "实时运行",
      formulaTag: "公式驱动决策",
      governanceTag: "可审计治理",
      workspace: "集团控制台",
      commandDeck: "运营指挥甲板",
      hubLine: "蓝色科技中枢 · 高密度决策界面",
    },
    en: {
      aiControl: "Formula-driven operation fabric",
      humanAiTitle: "Human + AI Governance",
      humanAiBody: "High-risk actions only execute after human confirmation, and the platform preserves a full audit trail by default.",
      liveStatus: "Live",
      formulaTag: "Formula-driven",
      governanceTag: "Auditable",
      workspace: "Group Workspace",
      commandDeck: "Operations Command Deck",
      hubLine: "Blue-tech core · dense decision interface",
    },
    ja: {
      aiControl: "Formula-driven operation fabric",
      humanAiTitle: "Human + AI Governance",
      humanAiBody: "高リスク操作は人の確認後にのみ実行され、プラットフォームは全工程の監査証跡を保持します。",
      liveStatus: "稼働中",
      formulaTag: "数式駆動",
      governanceTag: "監査可能",
      workspace: "グループワークスペース",
      commandDeck: "オペレーション司令デッキ",
      hubLine: "ブルーテック中枢 · 高密度意思決定UI",
    },
    th: {
      aiControl: "Formula-driven operation fabric",
      humanAiTitle: "Human + AI Governance",
      humanAiBody: "การดำเนินการความเสี่ยงสูงจะทำได้หลังจากมนุษย์ยืนยันเท่านั้น และระบบจะเก็บเส้นทางการตรวจสอบครบถ้วนโดยอัตโนมัติ",
      liveStatus: "กำลังทำงาน",
      formulaTag: "ขับเคลื่อนด้วยสูตร",
      governanceTag: "ตรวจสอบได้",
      workspace: "พื้นที่ควบคุมกลุ่ม",
      commandDeck: "เด็คบัญชาการปฏิบัติการ",
      hubLine: "แกนกลางเทคสีน้ำเงิน · อินเทอร์เฟซตัดสินใจหนาแน่น",
    },
  }[language];

  const navItems = useMemo(
    () => [
      { label: t("nav.tenants"), href: "/tenants" },
      { label: t("nav.overview"), href: "/overview" },
      { label: t("nav.pork"), href: "/pork" },
      { label: t("nav.quant"), href: "/quant" },
      { label: t("nav.audit"), href: "/audit" },
    ],
    [t],
  );

  return (
    <div className="min-h-screen text-foreground">
      <div className="relative flex min-h-screen">
        <aside className="hidden xl:flex xl:w-[316px] xl:flex-col xl:px-4 xl:py-4">
          <div className="glass-line relative flex h-full flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,29,0.95),rgba(7,12,22,0.98))] shadow-[0_30px_90px_rgba(2,8,20,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(86,196,255,0.14),transparent_22%),linear-gradient(180deg,transparent,rgba(50,96,255,0.06))]" />

            <div className="relative px-6 pb-6 pt-7">
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)),linear-gradient(180deg,rgba(9,16,29,0.94),rgba(8,13,24,0.94))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_70px_rgba(0,0,0,0.26)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="eyebrow-chip">{t("common.demoMode")}</div>
                  <div className="data-chip flex items-center gap-2 text-xs">
                    <Activity className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{shellCopy.liveStatus}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">{t("common.platformName")}</p>
                  <h1 className="mt-4 text-[2rem] font-semibold leading-none text-white">{t("common.platformTagline")}</h1>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">{shellCopy.workspace} · {shellCopy.aiControl}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/55">{shellCopy.hubLine}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">01</p>
                    <p className="mt-2 text-sm font-medium text-white">{shellCopy.formulaTag}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">02</p>
                    <p className="mt-2 text-sm font-medium text-white">{shellCopy.governanceTag}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative px-4 pb-4">
              <GlobalAssetMap />
            </div>

            <nav className="relative flex-1 px-4 pb-4">
              <div className="space-y-2.5">
                {navItems.map((item, index) => {
                  const Icon = navIcons[index]!;
                  const isActive = location === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => setLocation(item.href)}
                      className={cn(
                        "group relative flex w-full items-center gap-4 overflow-hidden rounded-[26px] border px-4 py-4 text-left transition-all duration-300",
                        isActive
                          ? "border-cyan-400/30 bg-[linear-gradient(135deg,rgba(75,183,255,0.16),rgba(53,114,255,0.14)_58%,rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.28)]"
                          : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className={cn("absolute inset-y-3 left-0 w-[3px] rounded-full transition-all", isActive ? "bg-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.8)]" : "bg-transparent")} />
                      <div
                        className={cn(
                          "relative flex h-12 w-12 items-center justify-center rounded-[18px] border transition-all",
                          isActive
                            ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                            : "border-white/8 bg-white/[0.03] text-slate-400 group-hover:text-slate-100",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-semibold", isActive ? "text-white" : "text-slate-200")}>{item.label}</p>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.22em] text-slate-500">{shellCopy.commandDeck}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="relative p-4 pt-0">
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(8,14,24,0.92)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 text-cyan-100">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-semibold text-white">{shellCopy.humanAiTitle}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{shellCopy.humanAiBody}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col xl:pl-2">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[linear-gradient(180deg,rgba(6,11,20,0.88),rgba(6,11,20,0.74))] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-200/80">{eyebrow}</p>
                <h2 className="mt-3 truncate text-2xl font-semibold text-white md:text-[2rem]">{title}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
                  <span>{t("common.generatedByFormula")}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-white/10 bg-white/[0.05] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.09]"
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-[22px] border-white/10 bg-slate-950/95 p-2 text-slate-100">
                    {languages.map(item => (
                      <DropdownMenuItem
                        key={item.code}
                        onClick={() => setLanguage(item.code)}
                        className={cn(
                          "rounded-2xl px-3 py-2.5",
                          language === item.code ? "bg-cyan-400/12 text-cyan-100" : "text-slate-300",
                        )}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="tech-surface mx-auto max-w-[1580px] animate-fade-up px-4 py-5 md:px-6 md:py-6 xl:px-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
