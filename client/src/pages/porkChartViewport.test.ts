import { describe, expect, it } from "vitest";
import { createTrailingViewport, shiftViewport, zoomViewport } from "./porkChartViewport";

describe("porkChartViewport", () => {
  it("creates a trailing viewport anchored at the latest data", () => {
    expect(createTrailingViewport(12, 6)).toEqual({ startIndex: 6, endIndex: 11 });
  });

  it("shifts within bounds when browsing history left and right", () => {
    const base = { startIndex: 6, endIndex: 11 };

    expect(shiftViewport(12, base, -3)).toEqual({ startIndex: 3, endIndex: 8 });
    expect(shiftViewport(12, { startIndex: 0, endIndex: 5 }, -2)).toEqual({ startIndex: 0, endIndex: 5 });
    expect(shiftViewport(12, { startIndex: 4, endIndex: 9 }, 10)).toEqual({ startIndex: 6, endIndex: 11 });
  });

  it("zooms in and out around the current center while respecting limits", () => {
    const base = { startIndex: 4, endIndex: 11 };

    expect(zoomViewport(20, base, "in", 2)).toEqual({ startIndex: 5, endIndex: 10 });
    expect(zoomViewport(20, base, "out", 4)).toEqual({ startIndex: 2, endIndex: 13 });
  });
});
