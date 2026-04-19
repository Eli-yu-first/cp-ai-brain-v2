import { buildWhatIfSimulation } from "./server/aiDecision.ts";

const conservative = buildWhatIfSimulation("CP-PK-240418-A1", 2, 14.4, 0, -5);
const optimistic = buildWhatIfSimulation("CP-PK-240418-A1", 2, 16.2, 15, 12);

console.log(JSON.stringify({ conservative, optimistic }, null, 2));
