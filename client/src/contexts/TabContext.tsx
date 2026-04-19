import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  /** Whether this tab has a notification badge */
  badge: boolean;
  /** Whether the badge should flash/pulse */
  badgeFlash: boolean;
  /** Timestamp when badge was set */
  badgeSetAt?: number;
}

interface TabContextValue {
  tabs: TabItem[];
  activeTabId: string | null;
  openTab: (tab: Omit<TabItem, "badge" | "badgeFlash">) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  setBadge: (id: string, flash?: boolean) => void;
  clearBadge: (id: string) => void;
  isTabOpen: (id: string) => boolean;
}

const TabContext = createContext<TabContextValue | null>(null);

export function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTabContext must be used within TabProvider");
  return ctx;
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const navigateRef = useRef<((href: string) => void) | null>(null);

  const openTab = useCallback((tab: Omit<TabItem, "badge" | "badgeFlash">) => {
    setTabs(prev => {
      const exists = prev.find(t => t.id === tab.id);
      if (exists) return prev;
      return [...prev, { ...tab, badge: false, badgeFlash: false }];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      // If closing active tab, switch to adjacent
      if (id === activeTabId && next.length > 0) {
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTabId(next[newIdx]!.id);
      } else if (next.length === 0) {
        setActiveTabId(null);
      }
      return next;
    });
  }, [activeTabId]);

  const switchTab = useCallback((id: string) => {
    setActiveTabId(id);
    // Clear badge when switching to the tab
    setTabs(prev => prev.map(t => t.id === id ? { ...t, badge: false, badgeFlash: false } : t));
  }, []);

  const setBadge = useCallback((id: string, flash = true) => {
    setTabs(prev => prev.map(t =>
      t.id === id && t.id !== activeTabId
        ? { ...t, badge: true, badgeFlash: flash, badgeSetAt: Date.now() }
        : t
    ));
  }, [activeTabId]);

  const clearBadge = useCallback((id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, badge: false, badgeFlash: false } : t));
  }, []);

  const isTabOpen = useCallback((id: string) => {
    return tabs.some(t => t.id === id);
  }, [tabs]);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, switchTab, setBadge, clearBadge, isTabOpen }}>
      {children}
    </TabContext.Provider>
  );
}
