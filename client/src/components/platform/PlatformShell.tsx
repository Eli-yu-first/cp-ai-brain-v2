import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutGrid,
  MapPinned,
  Menu,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  BrainCircuit,
  Map,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage, type LanguageCode } from "@/contexts/LanguageContext";
import { useTabContext } from "@/contexts/TabContext";
import { TabBar } from "./TabBar";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "zh", label: "\u7b80\u4f53\u4e2d\u6587" },
  { code: "en", label: "English" },
  { code: "ja", label: "\u65e5\u672c\u8a9e" },
  { code: "th", label: "\u0e44\u0e17\u0e22" },
];

const navIcons = [LayoutGrid, Workflow, Sparkles, MapPinned, BrainCircuit, Timer, Map, ShieldCheck, UsersRound] as const;

interface NavDef {
  id: string;
  label: string;
  href: string;
  shortLabel: string;
}

export function PlatformShell({
  children,
  title,
  eyebrow,
  pageId,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
  pageId?: string;
}) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openTab, tabs, activeTabId, switchTab } = useTabContext();

  const navItems: NavDef[] = [
    { id: "tenants", label: t("nav.tenants"), href: "/tenants", shortLabel: "T" },
    { id: "overview", label: t("nav.overview"), href: "/overview", shortLabel: "O" },
    { id: "pork", label: t("nav.pork"), href: "/pork", shortLabel: "P" },
    { id: "pork-map", label: t("nav.porkMap"), href: "/pork-map", shortLabel: "PM" },
    { id: "quant", label: t("nav.quant"), href: "/quant", shortLabel: "Q" },
    { id: "ai", label: t("nav.ai"), href: "/ai", shortLabel: "AI" },
    { id: "time-arbitrage", label: t("nav.timeArbitrage"), href: "/time-arbitrage", shortLabel: "TA" },
    { id: "spatial-arbitrage", label: t("nav.spatialArbitrage"), href: "/spatial-arbitrage", shortLabel: "SA" },
    { id: "audit", label: t("nav.audit"), href: "/audit", shortLabel: "A" },
  ];

  // Auto-register the current page as a tab
  useEffect(() => {
    if (pageId) {
      const nav = navItems.find(n => n.id === pageId);
      if (nav) {
        openTab({ id: nav.id, label: nav.label, href: nav.href });
      }
    }
  }, [pageId, language]); // re-register when language changes to update label

  const handleNavClick = (item: NavDef, isMobile: boolean) => {
    // Open tab and navigate
    openTab({ id: item.id, label: item.label, href: item.href });
    setLocation(item.href);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (isMobile: boolean) => (
    <div className={cn(
      "flex h-full flex-col",
      isMobile ? "w-full" : collapsed ? "w-[72px]" : "w-[220px]",
      "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    )}>
      {/* Logo area */}
      <div className={cn(
        "flex items-center border-b border-white/[0.06] px-3 py-4",
        collapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/20">
              <Activity className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white tracking-tight">CP-AI Brain</p>
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">V1.0</p>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/20">
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = navIcons[index]!;
          const isActive = location === item.href;
          // Check if this nav item has a badge in tabs
          const tabItem = tabs.find(t => t.id === item.id);
          const hasBadge = tabItem?.badge && !isActive;
          const badgeFlash = tabItem?.badgeFlash;

          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item, isMobile)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                collapsed && !isMobile ? "justify-center px-0" : "",
                isActive
                  ? "bg-cyan-400/[0.1] text-cyan-100 shadow-[inset_0_1px_0_rgba(56,189,248,0.1)]"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              )}
              <div className="relative">
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300")} />
                {/* Badge dot on sidebar icon */}
                {hasBadge && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500",
                    badgeFlash && "animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  )} />
                )}
              </div>
              {(!collapsed || isMobile) && (
                <span className={cn(
                  "truncate text-[13px] font-medium transition-colors",
                  isActive ? "text-cyan-100 font-semibold" : ""
                )}>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className={cn(
        "border-t border-white/[0.06] px-2 py-3 space-y-2",
        collapsed && !isMobile ? "items-center" : ""
      )}>
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all",
              collapsed && !isMobile ? "justify-center px-0" : ""
            )}>
              <Globe className="h-[18px] w-[18px] shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="truncate text-[13px] font-medium">{languages.find(l => l.code === language)?.label}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-44 rounded-xl border-white/[0.08] bg-[rgba(8,16,32,0.97)] p-1.5 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {languages.map(item => (
              <DropdownMenuItem
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[13px] transition-all cursor-pointer",
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

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300 transition-all"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="text-[12px] font-medium">{language === "zh" ? "\u6536\u8d77" : language === "en" ? "Collapse" : language === "ja" ? "\u6298\u308a\u305f\u305f\u3080" : "\u0e22\u0e38\u0e1a"}</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-foreground bg-[#060e1e]">
      <div className="relative flex min-h-screen">
        {/* MOBILE OVERLAY */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-[260px] border-r border-white/[0.06] bg-[#060e1e] shadow-2xl">
              {sidebarContent(true)}
            </aside>
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className={cn(
          "hidden xl:flex xl:flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,rgba(6,14,30,0.98),rgba(4,10,22,0.99))]",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed ? "xl:w-[72px]" : "xl:w-[220px]"
        )}>
          {sidebarContent(false)}
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* TabBar - shows open tabs */}
          <TabBar />

          {/* Header bar */}
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[rgba(6,14,30,0.92)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="hidden h-4 w-[2px] rounded-full bg-cyan-400/60 md:block" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/60">{eyebrow}</p>
                </div>
                <h2 className="mt-1.5 truncate text-lg font-bold tracking-tight text-white md:text-xl">{title}</h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Live status */}
                <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-slate-300/90 md:flex">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span>{t("common.generatedByFormula")}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-5">
            <div className="mx-auto max-w-[1580px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
