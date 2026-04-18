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
  Zap,
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
        {/* ═══ SIDEBAR ═══ */}
        <aside className="hidden xl:flex xl:w-[316px] xl:flex-col xl:px-4 xl:py-4">
          <div className="glass-line relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(6,14,30,0.96),rgba(4,10,22,0.98))] shadow-[0_32px_100px_rgba(0,4,15,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_0%,rgba(56,152,255,0.1),transparent),radial-gradient(ellipse_40%_30%_at_80%_100%,rgba(56,100,255,0.06),transparent)]" />

            {/* Brand card */}
            <div className="relative px-5 pb-5 pt-6">
              <div className="holo-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="eyebrow-chip">{t("common.demoMode")}</div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </span>
                    <span>{shellCopy.liveStatus}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{t("common.platformName")}</p>
                  <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.1] tracking-tight text-white">{t("common.platformTagline")}</h1>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-400/90">{shellCopy.workspace} · {shellCopy.aiControl}</p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-200/40">{shellCopy.hubLine}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.04]">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-cyan-400/60" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">01</p>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-white/90">{shellCopy.formulaTag}</p>
                  </div>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.04]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-cyan-400/60" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">02</p>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-white/90">{shellCopy.governanceTag}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="relative px-4 pb-3">
              <GlobalAssetMap />
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 px-3 pb-3">
              <div className="space-y-1.5">
                {navItems.map((item, index) => {
                  const Icon = navIcons[index]!;
                  const isActive = location === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => setLocation(item.href)}
                      className={cn(
                        "group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-300",
                        isActive
                          ? "border-cyan-400/25 bg-[linear-gradient(135deg,rgba(56,152,255,0.12),rgba(40,100,255,0.1)_60%,rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,4,15,0.35)]"
                          : "border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.03]",
                      )}
                    >
                      {/* Active indicator */}
                      <div className={cn(
                        "absolute inset-y-2.5 left-0 w-[2.5px] rounded-full transition-all duration-300",
                        isActive
                          ? "bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                          : "bg-transparent"
                      )} />

                      <div
                        className={cn(
                          "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300",
                          isActive
                            ? "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-500 group-hover:border-white/[0.1] group-hover:text-slate-300",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "truncate text-[13px] font-semibold transition-colors",
                          isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                        )}>{item.label}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">{shellCopy.commandDeck}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Governance card */}
            <div className="relative p-3 pt-0">
              <div className="holo-card p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06]">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="text-[13px] font-bold text-white">{shellCopy.humanAiTitle}</p>
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.7] text-slate-400/90">{shellCopy.humanAiBody}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col xl:pl-1">
          {/* Header bar */}
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(4,10,22,0.92),rgba(4,10,22,0.8))] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-8 md:py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="hidden h-5 w-[2px] rounded-full bg-cyan-400/60 md:block" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-300/70">{eyebrow}</p>
                </div>
                <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h2>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Live status badge */}
                <div className="hidden items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300/90 backdrop-blur-sm md:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  </span>
                  <span>{t("common.generatedByFormula")}</span>
                </div>

                {/* Language selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-white/[0.08] bg-white/[0.03] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/[0.08] bg-[rgba(8,16,32,0.97)] p-1.5 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    {languages.map(item => (
                      <DropdownMenuItem
                        key={item.code}
                        onClick={() => setLanguage(item.code)}
                        className={cn(
                          "rounded-lg px-3 py-2.5 text-[13px] transition-all",
                          language === item.code
                            ? "bg-cyan-400/[0.1] text-cyan-200 font-medium"
                            : "text-slate-400 hover:text-white",
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

          {/* Page content */}
          <main className="flex-1 px-3 py-5 md:px-6 md:py-6">
            <div className="tech-surface mx-auto max-w-[1580px] animate-fade-up px-4 py-5 md:px-6 md:py-6 xl:px-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
