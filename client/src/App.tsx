import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TabProvider, useTabContext } from "./contexts/TabContext";
import AuditPage from "./pages/Audit";
import AiDecisionPage from "./pages/AiDecision";
import Home from "./pages/Home";
import OverviewPage from "./pages/Overview";
import PorkPage from "./pages/Pork";
import QuantPage from "./pages/Quant";
import TenantsPage from "./pages/Tenants";

/**
 * PlatformRouter: Renders all platform pages simultaneously but only shows the active one.
 * This preserves React component state when switching tabs (no unmount/remount).
 */
function PlatformRouter() {
  const [location] = useLocation();
  const { tabs } = useTabContext();

  // Pages that use the tab system (inside PlatformShell)
  const platformPages = [
    { id: "tenants", href: "/tenants", Component: TenantsPage },
    { id: "overview", href: "/overview", Component: OverviewPage },
    { id: "pork", href: "/pork", Component: PorkPage },
    { id: "quant", href: "/quant", Component: QuantPage },
    { id: "ai", href: "/ai", Component: AiDecisionPage },
    { id: "audit", href: "/audit", Component: AuditPage },
  ];

  // Check if current route is a platform page
  const isPlatformRoute = platformPages.some(p => p.href === location);

  useAuth({ redirectOnUnauthenticated: isPlatformRoute });

  if (!isPlatformRoute) {
    // Non-platform routes (Home, NotFound) render normally
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For platform routes: render all opened tabs but only show the active one
  return (
    <>
      {platformPages.map(({ id, href, Component }) => {
        const isOpen = tabs.some(t => t.id === id) || location === href;
        const isVisible = location === href;

        if (!isOpen) return null;

        return (
          <div
            key={id}
            style={{ display: isVisible ? "contents" : "none" }}
          >
            <Component />
          </div>
        );
      })}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TabProvider>
            <TooltipProvider>
              <Toaster richColors position="top-right" />
              <PlatformRouter />
            </TooltipProvider>
          </TabProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
