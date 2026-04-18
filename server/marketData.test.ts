import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  buildLiveDecisionScenarios,
  buildPorkMarketSnapshot,
  extractProvinceLinks,
  extractSpotCards,
} from "./marketData";

function createSpotHtml(cards: Array<{ label: string; price: string; change: string; unitText: string }>, links = "") {
  return `
    <html><body>
      ${cards
        .map(
          card => `
            <div class="panel-box">
              <div class="describe-box">${card.label}<span></span></div>
              <div class="value-box">${card.price}</div>
              <div class="increase-box"><span class="up">${card.change}</span>${card.unitText}</div>
            </div>
          `,
        )
        .join("")}
      ${links}
    </body></html>
  `;
}

function createHistoryPayload(length: number) {
  return {
    data: {
      klines: Array.from({ length }, (_, index) => {
        const day = String((index % 28) + 1).padStart(2, "0");
        const open = 18000 + index * 8;
        const close = open + 30;
        const high = close + 25;
        const low = open - 20;
        return `2026-03-${day},${open},${close},${high},${low},1200,3200,1.8`;
      }),
    },
  };
}

const nationalHtml = createSpotHtml(
  [
    { label: "全国外三元生猪", price: "9.28", change: "0.15", unitText: "元/公斤" },
    { label: "全国猪肉", price: "26.80", change: "0.10", unitText: "元/公斤" },
    { label: "全国玉米", price: "2386", change: "12", unitText: "元/吨" },
    { label: "全国豆粕", price: "3115", change: "-18", unitText: "元/吨" },
  ],
  `
    <a href="https://zhujia.zhuwang.com.cn/pigprice-101.shtml">广东</a>
    <a href="https://zhujia.zhuwang.com.cn/pigprice-102.shtml">河南</a>
  `,
);

const guangdongHtml = createSpotHtml([
  { label: "广东外三元生猪", price: "9.80", change: "0.30", unitText: "元/公斤" },
  { label: "广东玉米", price: "2450", change: "16", unitText: "元/吨" },
  { label: "广东豆粕", price: "3230", change: "-10", unitText: "元/吨" },
]);

const henanHtml = createSpotHtml([
  { label: "河南外三元生猪", price: "9.10", change: "-0.12", unitText: "元/公斤" },
  { label: "河南玉米", price: "2360", change: "8", unitText: "元/吨" },
  { label: "河南豆粕", price: "3090", change: "-12", unitText: "元/吨" },
]);

const originalFetch = global.fetch;

beforeAll(() => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "https://zhujia.zhuwang.com.cn/") {
      return {
        ok: true,
        text: async () => nationalHtml,
      };
    }

    if (url === "https://zhujia.zhuwang.com.cn/pigprice-101.shtml") {
      return {
        ok: true,
        text: async () => guangdongHtml,
      };
    }

    if (url === "https://zhujia.zhuwang.com.cn/pigprice-102.shtml") {
      return {
        ok: true,
        text: async () => henanHtml,
      };
    }

    if (url.includes("list/variety/114/21")) {
      return {
        ok: true,
        json: async () => ({ list: [{ p: 18620, sc: 114, dm: "lh2409", zde: 160, zdf: 0.87, zjsj: 18460, o: 18510, vol: 98000, ccl: 140000 }] }),
      };
    }

    if (url.includes("list/variety/114/1")) {
      return {
        ok: true,
        json: async () => ({ list: [{ p: 2456, sc: 114, dm: "c2409", zde: 14, zdf: 0.57, zjsj: 2442, o: 2448, vol: 88000, ccl: 95000 }] }),
      };
    }

    if (url.includes("list/variety/114/4")) {
      return {
        ok: true,
        json: async () => ({ list: [{ p: 3198, sc: 114, dm: "m2409", zde: -8, zdf: -0.25, zjsj: 3206, o: 3202, vol: 76000, ccl: 81000 }] }),
      };
    }

    if (url.includes("push2his.eastmoney.com/api/qt/stock/kline/get")) {
      return {
        ok: true,
        json: async () => createHistoryPayload(40),
      };
    }

    throw new Error(`Unhandled fetch in test: ${url}`);
  }) as typeof fetch);
});

afterAll(() => {
  vi.unstubAllGlobals();
  global.fetch = originalFetch;
});

describe("marketData service", () => {
  it("extracts spot cards and province links from zhuwang pages", () => {
    const cards = extractSpotCards(nationalHtml);
    const provinces = extractProvinceLinks(nationalHtml);

    expect(cards.some(card => card.label.includes("外三元生猪"))).toBe(true);
    expect(cards.some(card => card.label.includes("玉米"))).toBe(true);
    expect(cards[0]?.price).toBeGreaterThan(18);
    expect(provinces).toEqual([
      { code: "101", name: "广东", path: "/pigprice-101.shtml" },
      { code: "102", name: "河南", path: "/pigprice-102.shtml" },
    ]);
  });

  it("builds a live pork market snapshot with spot, futures and regional ranking", async () => {
    const snapshot = await buildPorkMarketSnapshot("month", "101", "cornPrice");

    expect(snapshot.selectedRegionCode).toBe("101");
    expect(snapshot.selectedRegionName).toBe("广东");
    expect(snapshot.commodityQuotes.spot).toHaveLength(3);
    expect(snapshot.commodityQuotes.futures).toHaveLength(3);
    expect(snapshot.timelineLabels.length).toBeGreaterThan(0);
    expect(snapshot.regionQuotes[0]?.cornPrice).toBeGreaterThanOrEqual(snapshot.regionQuotes[1]?.cornPrice ?? 0);
    expect(snapshot.benchmarkQuotes.some(item => item.code === "live_hog")).toBe(true);
  });

  it("recomputes decision scenarios from live market inputs", async () => {
    const result = await buildLiveDecisionScenarios("CP-PK-240418-A1", "101");

    expect(result.batch.batchCode).toBe("CP-PK-240418-A1");
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios.every(item => item.action === "持有" || item.action === "出售")).toBe(true);
    expect(result.scenarios[0]?.currentUnitCost).not.toBe(0);
  });
});
