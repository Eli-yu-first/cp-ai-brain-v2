import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuditPage from "./pages/Audit";
import Home from "./pages/Home";
import OverviewPage from "./pages/Overview";
import PorkPage from "./pages/Pork";
import QuantPage from "./pages/Quant";
import TenantsPage from "./pages/Tenants";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tenants" component={TenantsPage} />
      <Route path="/overview" component={OverviewPage} />
      <Route path="/pork" component={PorkPage} />
      <Route path="/quant" component={QuantPage} />
      <Route path="/audit" component={AuditPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
