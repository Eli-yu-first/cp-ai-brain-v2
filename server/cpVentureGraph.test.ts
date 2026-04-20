import { describe, expect, it } from "vitest";
import { cpVentureCompanies, cpVentureLinks } from "@shared/cpVenture";

describe("cp venture graph seed data", () => {
  it("models CITIC Group as controller of CITIC Limited and strategic CP partner", () => {
    const citicGroup = cpVentureCompanies.find(company => company.id === "citic-group");
    const citicLimited = cpVentureCompanies.find(company => company.id === "citic");

    expect(citicGroup?.name).toBe("中信集团");
    expect(citicGroup?.participation).toContain("非隶属、非母子公司");
    expect(citicLimited?.ownershipSummary).toContain("20.61%");
    expect(citicLimited?.ownershipSummary).toContain("约 60%");
    expect(cpVentureLinks).toContainEqual({
      source: "citic-group",
      target: "citic",
      type: "ownership",
      strength: 0.9,
    });
  });

  it("models confirmed CP Robot strategic investment into AgiBot", () => {
    const cpRobot = cpVentureCompanies.find(company => company.id === "cp-robot");
    const agibot = cpVentureCompanies.find(company => company.id === "agibot");

    expect(cpRobot?.name).toBe("正大机器人");
    expect(cpRobot?.ownershipSummary).toContain("2025 年 7 月");
    expect(agibot?.relation).toContain("已确认");
    expect(agibot?.ownershipSummary).toContain("160 亿元");
    expect(cpVentureLinks).toContainEqual({
      source: "cp-robot",
      target: "agibot",
      type: "strategic",
      strength: 0.68,
    });
  });
});
