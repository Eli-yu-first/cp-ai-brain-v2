import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("AI decision navigation registration", () => {
  it("registers the /ai platform route in App.tsx", () => {
    const content = readProjectFile("client/src/App.tsx");

    expect(content).toContain('import AiDecisionPage from "./pages/AiDecision";');
    expect(content).toContain('{ id: "ai", href: "/ai", Component: AiDecisionPage }');
  });

  it("registers the CP venture platform route in App.tsx", () => {
    const content = readProjectFile("client/src/App.tsx");

    expect(content).toContain('import CpVenturePage from "./pages/CpVenture";');
    expect(content).toContain('{ id: "cp-venture", href: "/cp-venture", Component: CpVenturePage }');
  });

  it("adds an AI nav item to PlatformShell", () => {
    const content = readProjectFile("client/src/components/platform/PlatformShell.tsx");

    expect(content).toContain('BrainCircuit');
    expect(content).toContain('{ id: "ai", label: t("nav.ai"), href: "/ai", shortLabel: "AI" }');
  });

  it("defines multilingual nav.ai translations", () => {
    const content = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(content).toContain('ai: {');
    expect(content).toContain('zh: "AI 决策"');
    expect(content).toContain('en: "AI Decision"');
  });

  it("adds a CP venture nav item and translation", () => {
    const shell = readProjectFile("client/src/components/platform/PlatformShell.tsx");
    const language = readProjectFile("client/src/contexts/LanguageContext.tsx");

    expect(shell).toContain('{ id: "cp-venture", label: t("nav.cpVenture"), href: "/cp-venture", shortLabel: "VC" }');
    expect(language).toContain('cpVenture: {');
    expect(language).toContain('zh: "正大创投"');
  });
});
