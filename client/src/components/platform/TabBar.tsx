import { cn } from "@/lib/utils";
import { useTabContext } from "@/contexts/TabContext";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function TabBar() {
  const { tabs, activeTabId, switchTab, closeTab } = useTabContext();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  if (tabs.length === 0) return null;

  const handleSwitch = (tab: typeof tabs[0]) => {
    switchTab(tab.id);
    setLocation(tab.href);
  };

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    const remaining = tabs.filter(t => t.id !== tabId);
    closeTab(tabId);
    // Navigate to the next active tab or home
    if (remaining.length > 0 && tabId === activeTabId) {
      const idx = tabs.findIndex(t => t.id === tabId);
      const nextTab = remaining[Math.min(idx, remaining.length - 1)]!;
      setLocation(nextTab.href);
    } else if (remaining.length === 0) {
      setLocation("/overview");
    }
  };

  return (
    <div className="flex items-center gap-0 border-b border-white/[0.06] bg-[rgba(4,10,22,0.95)] backdrop-blur-xl overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => handleSwitch(tab)}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium whitespace-nowrap transition-all duration-200 border-r border-white/[0.04]",
              "min-w-[120px] max-w-[200px]",
              isActive
                ? "bg-white/[0.06] text-cyan-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
            )}
          >
            {/* Active indicator line at bottom */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500" />
            )}

            {/* Badge / notification dot */}
            {tab.badge && !isActive && (
              <span className={cn(
                "absolute top-1.5 right-8 h-2 w-2 rounded-full bg-red-500",
                tab.badgeFlash && "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              )} />
            )}

            <span className="truncate">{tab.label}</span>

            {/* Close button */}
            <span
              onClick={(e) => handleClose(e, tab.id)}
              className={cn(
                "ml-auto shrink-0 p-0.5 rounded transition-colors",
                isActive
                  ? "text-slate-400 hover:text-white hover:bg-white/[0.1]"
                  : "text-transparent group-hover:text-slate-500 hover:!text-white hover:bg-white/[0.1]"
              )}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
