import { describe, expect, it } from "vitest";
import { buildAiForecast } from "./aiDecision";

describe("buildAiForecast", () => {
  it("returns eight forecast points and clamps selected month into range", () => {
    const result = buildAiForecast("CP-PK-240418-A1", 20, 15);

    expect(result.selectedMonth).toBe(8);
    expect(result.curve).toHaveLength(8);
    expect(result.curve[0]?.month).toBe(1);
    expect(result.curve[7]?.month).toBe(8);
  });

  it("uses the selected month summary from the generated curve", () => {
    const result = buildAiForecast("CP-PK-240418-A1", 3, 15.2);
    const selectedPoint = result.curve[2]!;

    expect(result.summary.projectedPrice).toBe(selectedPoint.projectedPrice);
    expect(result.summary.breakEvenPrice).toBe(selectedPoint.breakEvenPrice);
    expect(result.summary.totalProfit).toBe(selectedPoint.totalProfit);
  });

  it("changes projected outcome when target price changes", () => {
    const base = buildAiForecast("CP-PK-240418-A1", 4, 14.2);
    const optimistic = buildAiForecast("CP-PK-240418-A1", 4, 16.8);

    expect(optimistic.summary.projectedPrice).toBeGreaterThan(base.summary.projectedPrice);
    expect(optimistic.summary.totalProfit).toBeGreaterThan(base.summary.totalProfit);
  });
});
