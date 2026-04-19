import { describe, expect, it, vi } from "vitest";

vi.mock("./marketData", () => ({
  buildPorkMarketSnapshot: vi.fn(async () => ({
    regionQuotes: [
      { regionCode: "hb", regionName: "湖北", liveHogPrice: 14.8, liveHogChange: 0.4, cornPrice: 2520, cornChange: -10, soymealPrice: 3320, soymealChange: 12 },
      { regionCode: "gd", regionName: "广东", liveHogPrice: 17.4, liveHogChange: 0.8, cornPrice: 2610, cornChange: 8, soymealPrice: 3450, soymealChange: 16 },
      { regionCode: "sd", regionName: "山东", liveHogPrice: 15.6, liveHogChange: -0.2, cornPrice: 2550, cornChange: 4, soymealPrice: 3380, soymealChange: 6 },
    ],
  })),
}));

vi.mock("./platformData", () => ({
  inventoryBatches: [
    {
      batchCode: "CP-PK-240418-A1",
      warehouse: "武汉一号冷库",
      partName: "五花",
      weightKg: 18240,
      unitCost: 28.32,
      currentSpotPrice: 24.68,
      futuresMappedPrice: 25.12,
    },
    {
      batchCode: "CP-PK-240419-B2",
      warehouse: "上海二号冷库",
      partName: "排骨",
      weightKg: 9640,
      unitCost: 31.18,
      currentSpotPrice: 29.42,
      futuresMappedPrice: 30.11,
    },
  ],
}));

describe("buildPorkBusinessMap", async () => {
  const { buildPorkBusinessMap } = await import("./porkMap");

  it("returns province nodes, warehouses and ranked opportunities", async () => {
    const result = await buildPorkBusinessMap("hogPrice", "balanced");

    expect(result.nodes.length).toBe(3);
    expect(result.warehouses.length).toBe(2);
    expect(result.summary.visibleRegions).toBe(3);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.opportunities[0]!.netArbitrage).toBeGreaterThan(0);
  });

  it("changes opportunity ranking under different scenarios", async () => {
    const margin = await buildPorkBusinessMap("hogPrice", "margin");
    const logistics = await buildPorkBusinessMap("hogPrice", "logistics");

    expect(margin.opportunities[0]?.netArbitrage).not.toBe(logistics.opportunities[0]?.netArbitrage);
  });
});
