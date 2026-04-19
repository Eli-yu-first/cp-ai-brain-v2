import { appRouter } from './server/routers.ts';

const ctx = {
  user: null,
  req: {
    protocol: 'https',
    headers: {},
  },
  res: {
    clearCookie() {},
    cookie() {},
    redirect() {},
    status() {
      return this;
    },
    json(payload) {
      return payload;
    },
  },
};

function summarizeArray(value) {
  return Array.isArray(value) ? value.length : null;
}

async function main() {
  const caller = appRouter.createCaller(ctx);

  const snapshot = await caller.platform.snapshot({ timeframe: 'month' });
  const porkMarket = await caller.platform.porkMarket({
    timeframe: 'month',
    regionCode: 'national',
    sortBy: 'hogPrice',
  });
  const batchCode = snapshot.inventoryBatches?.[0]?.batchCode ?? snapshot?.batches?.[0]?.batchCode;
  const scenarios = await caller.platform.scenarios({ batchCode, regionCode: 'national' });
  const ai = await caller.platform.aiChat({
    messages: [{ role: 'user', content: '请根据当前上下文给出一句简短结论。' }],
    context: { batchCode, timeframe: 'month', regionCode: 'national' },
  });

  console.log(JSON.stringify({
    snapshotKeys: Object.keys(snapshot),
    porkMarketKeys: Object.keys(porkMarket),
    scenarioKeys: Object.keys(scenarios),
    snapshotSummary: Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, summarizeArray(value)])),
    porkMarketSummary: Object.fromEntries(Object.entries(porkMarket).map(([key, value]) => [key, summarizeArray(value)])),
    scenarioSummary: Object.fromEntries(Object.entries(scenarios).map(([key, value]) => [key, summarizeArray(value)])),
    aiPreview: String(ai.content).slice(0, 200),
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
