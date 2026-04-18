import { describe, expect, it } from "vitest";
import { categoryOrder, filterSitesByCategories, getCategoryCounts, globalSites } from "./globalAssetMapData";

describe("globalAssetMapData", () => {
  it("returns counts in the configured category order", () => {
    const counts = getCategoryCounts(globalSites);

    expect(counts.map(item => item.category)).toEqual(categoryOrder);
    expect(counts).toEqual([
      { category: "swine", count: 5 },
      { category: "poultry", count: 2 },
      { category: "feed", count: 2 },
      { category: "slaughter", count: 3 },
    ]);
  });

  it("filters sites by selected categories", () => {
    const filtered = filterSitesByCategories(globalSites, ["swine", "feed"]);

    expect(filtered.every(item => item.category === "swine" || item.category === "feed")).toBe(true);
    expect(filtered).toHaveLength(7);
  });

  it("returns all sites when no category is selected", () => {
    expect(filterSitesByCategories(globalSites, [])).toHaveLength(globalSites.length);
  });
});
