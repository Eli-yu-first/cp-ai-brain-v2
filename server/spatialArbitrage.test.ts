import { describe, expect, it } from "vitest";
import { calculateSpatialArbitrage, VEHICLE_TYPES } from "./spatialArbitrage";

describe("calculateSpatialArbitrage (real logistics scheduling)", () => {
  it("returns schedule plan with vehicle selection and capacity/demand respect", () => {
    const res = calculateSpatialArbitrage({
      transportCostPerKmPerTon: 0.8,
      minProfitThreshold: 0.5,
      batchSizeTon: 500,
      originFilter: "all",
      partCode: "carcass",
      vehiclePreference: "auto",
    });

    expect(res.schedulePlan.length).toBeGreaterThan(0);

    // 每条调度线 shippedTon 必然 <= 对应产地产能
    const totalShippedByOrigin: Record<string, number> = {};
    for (const p of res.schedulePlan) {
      totalShippedByOrigin[p.originId] = (totalShippedByOrigin[p.originId] ?? 0) + p.shippedTon;
    }
    for (const originId of Object.keys(totalShippedByOrigin)) {
      const node = res.nodes.find((n) => n.id === originId);
      expect(node).toBeDefined();
      expect(totalShippedByOrigin[originId]).toBeLessThanOrEqual((node!.capacity ?? 0) + 0.001);
    }

    // 每条调度线 shippedTon 必然 <= 对应销地需求
    const totalShippedByDest: Record<string, number> = {};
    for (const p of res.schedulePlan) {
      totalShippedByDest[p.destId] = (totalShippedByDest[p.destId] ?? 0) + p.shippedTon;
    }
    for (const destId of Object.keys(totalShippedByDest)) {
      const node = res.nodes.find((n) => n.id === destId);
      expect(node).toBeDefined();
      const cap = node!.demand ?? Number.POSITIVE_INFINITY;
      expect(totalShippedByDest[destId]).toBeLessThanOrEqual(cap + 0.001);
    }
  });

  it("schedule plan keeps net profit per kg positive", () => {
    const res = calculateSpatialArbitrage({
      transportCostPerKmPerTon: 0.8,
      minProfitThreshold: 0.5,
      batchSizeTon: 500,
      originFilter: "all",
      partCode: "carcass",
      vehiclePreference: "auto",
    });
    for (const p of res.schedulePlan) {
      expect(p.netProfitPerKg).toBeGreaterThan(0);
    }
  });

  it("vehiclePreference=large forces only large trucks into mix when batches allow", () => {
    const res = calculateSpatialArbitrage({
      transportCostPerKmPerTon: 0.8,
      minProfitThreshold: 0.5,
      batchSizeTon: 500,
      originFilter: "all",
      partCode: "carcass",
      vehiclePreference: "large",
    });
    // 当强制大车时，small/medium 计数应为 0
    expect(res.scheduleSummary.vehicleMix.small).toBe(0);
    expect(res.scheduleSummary.vehicleMix.medium).toBe(0);
    expect(res.scheduleSummary.vehicleMix.large).toBeGreaterThan(0);
  });

  it("backward compatibility: accepts legacy positional signature", () => {
    const res = calculateSpatialArbitrage(0.8, 0.5, 500, "all", "carcass");
    expect(res).toBeDefined();
    expect(res.routes).toBeDefined();
    expect(res.schedulePlan).toBeDefined();
  });

  it("returns vehicle types with correct fields", () => {
    expect(VEHICLE_TYPES).toHaveLength(3);
    for (const v of VEHICLE_TYPES) {
      expect(v.code).toBeDefined();
      expect(v.name).toBeDefined();
      expect(v.payloadTon).toBeGreaterThan(0);
      expect(v.costPerKmPerTon).toBeGreaterThan(0);
    }
  });

  it("schedule summary aggregates totals correctly", () => {
    const res = calculateSpatialArbitrage({
      transportCostPerKmPerTon: 0.8,
      minProfitThreshold: 0.5,
      batchSizeTon: 500,
      originFilter: "all",
      partCode: "carcass",
      vehiclePreference: "auto",
    });
    const sumShipped = res.schedulePlan.reduce((s, p) => s + p.shippedTon, 0);
    expect(res.scheduleSummary.totalShippedTon).toBeCloseTo(sumShipped, 1);
    const sumNet = res.schedulePlan.reduce((s, p) => s + p.netProfitTotal, 0);
    expect(res.scheduleSummary.totalNetProfit).toBeCloseTo(sumNet, 0);
  });

  it("targetShipmentTon caps total shipment", () => {
    const res = calculateSpatialArbitrage({
      transportCostPerKmPerTon: 0.8,
      minProfitThreshold: 0.5,
      batchSizeTon: 500,
      originFilter: "all",
      partCode: "carcass",
      vehiclePreference: "auto",
      targetShipmentTon: 1000,
    });
    expect(res.scheduleSummary.totalShippedTon).toBeLessThanOrEqual(1000 + 0.1);
  });
});
