import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("AI decision navigation registration", () => {
  function expectNavigationItem(
    content: string,
    fields: {
      id: string;
      label: string;
      href: string;
      shortLabel: string;
    }
  ) {
    expect(content).toContain(`id: "${fields.id}"`);
    expect(content).toContain(`label: t("${fields.label}")`);
    expect(content).toContain(`href: "${fields.href}"`);
    expect(content).toContain(`shortLabel: "${fields.shortLabel}"`);
  }

  it("registers the /ai platform route in App.tsx", () => {
    const content = readProjectFile("client/src/App.tsx");

    expect(content).toContain(
      'import AiDecisionPage from "./pages/AiDecision";'
    );
    expect(content).toContain(
      '{ id: "ai", href: "/ai", Component: AiDecisionPage }'
    );
  });

  it("registers the CP venture platform route in App.tsx", () => {
    const content = readProjectFile("client/src/App.tsx");

    expect(content).toContain('import CpVenturePage from "./pages/CpVenture";');
    expect(content).toContain(
      '{ id: "cp-venture", href: "/cp-venture", Component: CpVenturePage }'
    );
  });

  it("adds an AI nav item to PlatformShell", () => {
    const content = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );

    expect(content).toContain("BrainCircuit");
    expect(content).toContain(
      '{ id: "ai", label: t("nav.ai"), href: "/ai", shortLabel: "AI" }'
    );
  });

  it("registers the AI war-room page route and nav entry", () => {
    const app = readProjectFile("client/src/App.tsx");
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(app).toContain('import AiWarRoomPage from "./pages/AiWarRoom";');
    expect(app).toContain(
      '{ id: "ai-war-room", href: "/ai-war-room", Component: AiWarRoomPage }'
    );
    expectNavigationItem(shell, {
      id: "ai-war-room",
      label: "nav.aiWarRoom",
      href: "/ai-war-room",
      shortLabel: "WR",
    });
    expect(language).toContain("aiWarRoom: {");
    expect(language).toContain('zh: "AI 作战系统"');
    expect(language).toContain('en: "AI War Room"');
  });

  it("registers the AI value-chain page route and nav entry", () => {
    const app = readProjectFile("client/src/App.tsx");
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(app).toContain(
      'import AiValueChainPage from "./pages/AiValueChain";'
    );
    expect(app).toContain('id: "ai-value-chain"');
    expect(app).toContain('href: "/ai-value-chain"');
    expect(app).toContain("Component: AiValueChainPage");
    expectNavigationItem(shell, {
      id: "ai-value-chain",
      label: "nav.aiValueChain",
      href: "/ai-value-chain",
      shortLabel: "VL",
    });
    expect(language).toContain("aiValueChain: {");
    expect(language).toContain('zh: "AI 价值链"');
    expect(language).toContain('en: "AI Value Chain"');
  });

  it("registers the AI dispatch execution page route and nav entry", () => {
    const app = readProjectFile("client/src/App.tsx");
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(app).toContain(
      'import AiDispatchExecutionPage from "./pages/AiDispatchExecution";'
    );
    expect(app).toContain('id: "ai-dispatch-execution"');
    expect(app).toContain('href: "/ai-dispatch-execution"');
    expect(app).toContain("Component: AiDispatchExecutionPage");
    expectNavigationItem(shell, {
      id: "ai-dispatch-execution",
      label: "nav.aiDispatchExecution",
      href: "/ai-dispatch-execution",
      shortLabel: "DX",
    });
    expect(language).toContain("aiDispatchExecution: {");
    expect(language).toContain('zh: "AI 派单执行"');
    expect(language).toContain('en: "AI Dispatch"');
  });

  it("registers the AI strategy simulation page route and nav entry", () => {
    const app = readProjectFile("client/src/App.tsx");
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(app).toContain(
      'import AiStrategySimulationPage from "./pages/AiStrategySimulation";'
    );
    expect(app).toContain('id: "ai-strategy-simulation"');
    expect(app).toContain('href: "/ai-strategy-simulation"');
    expect(app).toContain("Component: AiStrategySimulationPage");
    expectNavigationItem(shell, {
      id: "ai-strategy-simulation",
      label: "nav.aiStrategySimulation",
      href: "/ai-strategy-simulation",
      shortLabel: "WF",
    });
    expect(language).toContain("aiStrategySimulation: {");
    expect(language).toContain('zh: "AI 战略模拟"');
    expect(language).toContain('en: "AI What-if"');
  });

  it("registers the AI governance closure page route and nav entry", () => {
    const app = readProjectFile("client/src/App.tsx");
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(app).toContain(
      'import AiGovernanceClosurePage from "./pages/AiGovernanceClosure";'
    );
    expect(app).toContain('id: "ai-governance-closure"');
    expect(app).toContain('href: "/ai-governance-closure"');
    expect(app).toContain("Component: AiGovernanceClosurePage");
    expectNavigationItem(shell, {
      id: "ai-governance-closure",
      label: "nav.aiGovernanceClosure",
      href: "/ai-governance-closure",
      shortLabel: "GV",
    });
    expect(language).toContain("aiGovernanceClosure: {");
    expect(language).toContain('zh: "AI 闭环治理"');
    expect(language).toContain('en: "AI Governance"');
  });

  it("defines multilingual nav.ai translations", () => {
    const content = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(content).toContain("ai: {");
    expect(content).toContain('zh: "AI 决策"');
    expect(content).toContain('en: "AI Decision"');
  });

  it("adds a CP venture nav item and translation", () => {
    const shell = readProjectFile(
      "client/src/components/platform/PlatformShell.tsx"
    );
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expectNavigationItem(shell, {
      id: "cp-venture",
      label: "nav.cpVenture",
      href: "/cp-venture",
      shortLabel: "VC",
    });
    expect(language).toContain("cpVenture: {");
    expect(language).toContain('zh: "正大创投"');
  });
});
