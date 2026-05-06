import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  OptimizationChatLauncher,
  OptimizationChatProvider,
} from "./components/OptimizationChatLauncher";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TabProvider, useTabContext } from "./contexts/TabContext";
import AuditPage from "./pages/Audit";
import AiDecisionPage from "./pages/AiDecision";
import AiDispatchExecutionPage from "./pages/AiDispatchExecution";
import AiFactoryExecutionPage from "./pages/AiFactoryExecution";
import AiGovernanceClosurePage from "./pages/AiGovernanceClosure";
import AiFuturesStorageDecisionPage from "./pages/AiFuturesStorageDecision";
import AiStrategySimulationPage from "./pages/AiStrategySimulation";
import AiSystemBlueprintPage from "./pages/AiSystemBlueprint";
import AiValueChainPage from "./pages/AiValueChain";
import AiWarRoomPage from "./pages/AiWarRoom";
import CpVenturePage from "./pages/CpVenture";
import DeepArbitragePage from "./pages/DeepArbitrage";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import OverviewPage from "./pages/Overview";
import PorkPage from "./pages/Pork";
import PorkMapPage from "./pages/PorkMap";
import QuantPage from "./pages/Quant";
import TenantsPage from "./pages/Tenants";
import TimeArbitragePage from "./pages/TimeArbitrage";
import SpatialArbitragePage from "./pages/SpatialArbitrage";
import FinancialArbitragePage from "./pages/FinancialArbitrage";
import PredictionMarketInsurancePage from "./pages/PredictionMarketInsurance";
import ProfessionalArbitragePage from "./pages/ProfessionalArbitrage";
import GlobalOptimizationPage from "./pages/GlobalOptimization";

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
    { id: "pork-map", href: "/pork-map", Component: PorkMapPage },
    { id: "quant", href: "/quant", Component: QuantPage },
    { id: "ai", href: "/ai", Component: AiDecisionPage },
    { id: "ai-war-room", href: "/ai-war-room", Component: AiWarRoomPage },
    {
      id: "ai-system-blueprint",
      href: "/ai-system-blueprint",
      Component: AiSystemBlueprintPage,
    },
    {
      id: "ai-value-chain",
      href: "/ai-value-chain",
      Component: AiValueChainPage,
    },
    {
      id: "ai-dispatch-execution",
      href: "/ai-dispatch-execution",
      Component: AiDispatchExecutionPage,
    },
    {
      id: "ai-factory-execution",
      href: "/ai-factory-execution",
      Component: AiFactoryExecutionPage,
    },
    {
      id: "ai-futures-storage-decision",
      href: "/ai-futures-storage-decision",
      Component: AiFuturesStorageDecisionPage,
    },
    {
      id: "ai-strategy-simulation",
      href: "/ai-strategy-simulation",
      Component: AiStrategySimulationPage,
    },
    {
      id: "ai-governance-closure",
      href: "/ai-governance-closure",
      Component: AiGovernanceClosurePage,
    },
    {
      id: "time-arbitrage",
      href: "/time-arbitrage",
      Component: TimeArbitragePage,
    },
    {
      id: "spatial-arbitrage",
      href: "/spatial-arbitrage",
      Component: SpatialArbitragePage,
    },
    {
      id: "financial-arbitrage",
      href: "/financial-arbitrage",
      Component: FinancialArbitragePage,
    },
    {
      id: "prediction-market-insurance",
      href: "/prediction-market-insurance",
      Component: PredictionMarketInsurancePage,
    },
    {
      id: "professional-arbitrage",
      href: "/professional-arbitrage",
      Component: ProfessionalArbitragePage,
    },
    {
      id: "global-optimization",
      href: "/global-optimization",
      Component: GlobalOptimizationPage,
    },
    {
      id: "deep-arbitrage",
      href: "/deep-arbitrage",
      Component: DeepArbitragePage,
    },
    { id: "audit", href: "/audit", Component: AuditPage },
    { id: "cp-venture", href: "/cp-venture", Component: CpVenturePage },
  ];

  // Check if current route is a platform page
  const isPlatformRoute = platformPages.some(p => p.href === location);

  useAuth({ redirectOnUnauthenticated: isPlatformRoute });

  if (!isPlatformRoute) {
    // Non-platform routes (Home, NotFound) render normally
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={LoginPage} />
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
          <div key={id} style={{ display: isVisible ? "contents" : "none" }}>
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
            <OptimizationChatProvider>
              <TooltipProvider>
                <Toaster richColors position="top-right" />
                <PlatformRouter />
                <OptimizationChatLauncher />
              </TooltipProvider>
            </OptimizationChatProvider>
          </TabProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
