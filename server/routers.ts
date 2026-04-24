import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  appendAuditEntry,
  getDecisionScenarios,
  getPlatformSnapshot,
  inventoryBatches,
  listAuditEntries,
} from "./platformData";
import { buildLiveDecisionScenarios, buildPorkMarketSnapshot } from "./marketData";
import {
  buildAgentDecisionContext,
  buildAgentDecisionDraft,
  buildAiDecisionWorkspace,
  buildAiForecast,
  buildAlertBoard,
  buildDispatchBoard,
  buildDispatchExecutionSummary,
  buildWhatIfSimulation,
} from "./aiDecision";
import {
  buildArbitrageDecisionContext,
  buildArbitrageAgentDraft,
  calculateArbitrage,
} from "./timeArbitrage";
import {
  calculateSpatialArbitrage,
  generateRoleTasksDraft,
} from "./spatialArbitrage";
import {
  analyzeAllDeepArbitrages,
  buildIntegratedArbitrageAnalysis,
  buildCoreMetrics,
  type DeepArbitrageInput,
} from "./deepArbitrage";
import { simulateFinancialArbitrage } from "./financialArbitrage";
import { simulateProfessionalArbitrage } from "./professionalArbitrage";
import {
  createAuditLog,
  createArbitrageRecord,
  getDispatchOrderByOrderId,
  listArbitrageRecords,
  listDispatchReceiptsByBatch,
  listPersistedAuditLogs,
  persistDispatchPlan,
  updateDispatchReceipt,
} from "./db";
import { sendEscalationNotifications } from "./escalationNotifier";
import { buildPorkBusinessMap } from "./porkMap";
import { getCpVentureMap } from "./cpVentureData";
import { PORK_PARTS, PORK_PROJECT_BLUEPRINT } from "./porkIndustryModel";
import {
  solveOptimization,
  generateAIDecision,
  buildOptimizationChatFallback,
  buildOptimizationSensitivity,
  buildTunedOptimizationInput,
} from "./globalOptimization";
import {
  sampleOptimizationInput,
  type GlobalOptimizationChatMessage,
  type GlobalOptimizationChatSuggestion,
} from "@shared/globalOptimization";

const timeframeSchema = z.enum(["day", "week", "month", "quarter", "halfYear", "year"]);
const roleSchema = z.enum(["admin", "strategist", "executor"]);
const marketSortSchema = z.enum(["hogPrice", "cornPrice", "soymealPrice", "hogChange"]);

const timeOptimizationSchema = z.object({
  breedingHeadsPerDay: z.number().min(1000).max(200000).optional(),
  slaughterHeadsPerDay: z.number().min(1000).max(200000).optional(),
  cuttingHeadsPerDay: z.number().min(1000).max(200000).optional(),
  freezingTonsPerDay: z.number().min(10).max(10000).optional(),
  storageTonsCapacity: z.number().min(10).max(500000).optional(),
  deepProcessingTonsPerDay: z.number().min(0).max(10000).optional(),
  salesTonsPerDay: z.number().min(0).max(10000).optional(),
  breedingCostPerHead: z.number().min(0).max(1000).optional(),
  slaughterCostPerHead: z.number().min(0).max(1000).optional(),
  cuttingCostPerHead: z.number().min(0).max(1000).optional(),
  freezingCostPerTon: z.number().min(0).max(5000).optional(),
  storageCostPerTonMonth: z.number().min(0).max(5000).optional(),
  deepProcessingCostPerTon: z.number().min(0).max(5000).optional(),
  salesCostPerTon: z.number().min(0).max(5000).optional(),
}).optional();

const networkOptimizationSchema = z.object({
  breedingHeadsPerDay: z.number().min(1000).max(200000).optional(),
  slaughterHeadsPerDay: z.number().min(1000).max(200000).optional(),
  cuttingHeadsPerDay: z.number().min(1000).max(200000).optional(),
  freezingTonsPerDay: z.number().min(10).max(10000).optional(),
  storageTonsCapacity: z.number().min(10).max(500000).optional(),
  deepProcessingTonsPerDay: z.number().min(0).max(10000).optional(),
  salesFreshTonsPerDay: z.number().min(0).max(10000).optional(),
  salesFrozenTonsPerMonth: z.number().min(0).max(500000).optional(),
  salesProcessedTonsPerDay: z.number().min(0).max(10000).optional(),
  breedingCostPerHead: z.number().min(0).max(1000).optional(),
  slaughterCostPerHead: z.number().min(0).max(1000).optional(),
  cuttingCostPerHead: z.number().min(0).max(1000).optional(),
  freezingCostPerTon: z.number().min(0).max(5000).optional(),
  storageCostPerTonMonth: z.number().min(0).max(5000).optional(),
  deepProcessingCostPerTon: z.number().min(0).max(5000).optional(),
  salesCostPerTon: z.number().min(0).max(5000).optional(),
}).optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  platform: router({
    snapshot: protectedProcedure
      .input(
        z
          .object({
            timeframe: timeframeSchema.optional(),
          })
          .optional(),
      )
      .query(({ input }) => {
        return getPlatformSnapshot(input?.timeframe ?? "month");
      }),
    porkMarket: protectedProcedure
      .input(
        z
          .object({
            timeframe: timeframeSchema.optional(),
            regionCode: z.string().optional(),
            sortBy: marketSortSchema.optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        return buildPorkMarketSnapshot(
          input?.timeframe ?? "month",
          input?.regionCode ?? "national",
          input?.sortBy ?? "hogPrice",
        );
      }),
    porkMap: protectedProcedure
      .input(
        z
          .object({
            metric: z.enum(["hogPrice", "cornPrice", "soymealPrice"]).optional(),
            scenario: z.enum(["margin", "logistics", "balanced"]).optional(),
          })
          .optional(),
      )
      .query(({ input }) => {
        return buildPorkBusinessMap(input?.metric ?? "hogPrice", input?.scenario ?? "balanced");
      }),
    cpVentureMap: protectedProcedure.query(() => {
      return getCpVentureMap();
    }),
    projectBlueprint: protectedProcedure.query(() => {
      return {
        ...PORK_PROJECT_BLUEPRINT,
        partCount: PORK_PARTS.length,
        parts: PORK_PARTS,
      };
    }),
    scenarios: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          regionCode: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        return buildLiveDecisionScenarios(input.batchCode, input.regionCode ?? "national");
      }),
    aiDecisionWorkspace: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          forecastMonth: z.number().int().min(1).max(8),
          scenarioMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          strategy: z.enum(["steady", "balanced", "aggressive"]).optional(),
          basisAdjustment: z.number().min(-4).max(4).optional(),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .query(async ({ input }) => {
        const dispatchHistoryRows = await listDispatchReceiptsByBatch(input.batchCode);
        const dispatchHistory = dispatchHistoryRows.map(order => ({
          orderId: order.orderId,
          batchCode: order.batchCode,
          currentStatus: order.currentStatus,
          priority: order.priority,
          receipts: order.receipts.map(receipt => ({
            role: receipt.role,
            status: receipt.status,
            etaMinutes: receipt.etaMinutes,
            note: receipt.note,
            acknowledgedBy: receipt.acknowledgedBy,
            receiptBy: receipt.receiptBy,
          })),
        }));

        const workspace = buildAiDecisionWorkspace(
          input.batchCode,
          input.scenarioMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
          dispatchHistory,
        );

        const forecast = buildAiForecast(
          input.batchCode,
          input.forecastMonth,
          input.targetPrice,
          input.strategy ?? "balanced",
          input.basisAdjustment ?? 0,
        );

        return {
          ...workspace,
          forecast,
          executionSummary: buildDispatchExecutionSummary(workspace.dispatchBoard, dispatchHistory),
        };
      }),
    aiForecast: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(8),
          targetPrice: z.number().min(1).max(40).optional(),
          strategy: z.enum(["steady", "balanced", "aggressive"]).optional(),
          basisAdjustment: z.number().min(-4).max(4).optional(),
        }),
      )
      .query(({ input }) => {
        return buildAiForecast(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.strategy ?? "balanced",
          input.basisAdjustment ?? 0,
        );
      }),
    aiWhatIf: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .query(({ input }) => {
        return buildWhatIfSimulation(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
      }),

    arbitrageSimulate: protectedProcedure
      .input(
        z.object({
          spotPrice: z.number().min(1).max(40),
          holdingCostPerMonth: z.number().min(0.01).max(2.0),
          socialBreakevenCost: z.number().min(1).max(40).optional().default(12.0),
          storageTons: z.number().min(50).max(50000).optional().default(1000),
          startMonth: z.number().min(1).max(12).optional().default(4),
          storageDurationMonths: z.number().int().min(1).max(10).optional().default(6),
          optimization: timeOptimizationSchema,
        })
      )
      .query(({ input }) => {
        return calculateArbitrage(
          input.spotPrice,
          input.holdingCostPerMonth,
          input.socialBreakevenCost,
          input.storageTons,
          input.startMonth,
          input.storageDurationMonths,
          input.optimization,
        );
      }),
    arbitrageAiDecision: protectedProcedure
      .input(
        z.object({
          spotPrice: z.number().min(1).max(40),
          holdingCostPerMonth: z.number().min(0.01).max(2.0),
          socialBreakevenCost: z.number().min(1).max(40).optional().default(12.0),
          storageTons: z.number().min(50).max(50000).optional().default(1000),
          startMonth: z.number().min(1).max(12).optional().default(4),
          storageDurationMonths: z.number().int().min(1).max(10).optional().default(6),
          optimization: timeOptimizationSchema,
        })
      )
      .mutation(async ({ input }) => {
        const context = buildArbitrageDecisionContext(
          input.spotPrice,
          input.holdingCostPerMonth,
          input.socialBreakevenCost,
          input.storageTons,
          input.startMonth,
          input.storageDurationMonths,
          input.optimization,
        );
        const fallback = buildArbitrageAgentDraft(
          input.spotPrice,
          input.holdingCostPerMonth,
          input.socialBreakevenCost,
          input.storageTons,
          input.startMonth,
          input.storageDurationMonths,
          input.optimization,
        );

        try {
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "你是 CP-AI Brain 的动态套利引擎。请基于给定的套利参数模拟结果，输出结构化的判断结果。如果能买入就给出买入建议，否则输出卖出和风险警示。请确保专业。",
              },
              {
                role: "user",
                content: JSON.stringify(context),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "ai_arbitrage_decision",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    marketAnalysis: { type: "string" },
                    costRecommendation: { type: "string" },
                    decision: { 
                      type: "array",
                      items: { type: "string" }
                    },
                    riskWarning: { type: "string" },
                  },
                  required: ["marketAnalysis", "costRecommendation", "decision", "riskWarning"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = llmResult.choices?.[0]?.message?.content;
          if (typeof rawContent !== "string") {
            return fallback;
          }
          const parsed = JSON.parse(rawContent);
          if (!parsed || typeof parsed.marketAnalysis !== 'string') {
            return fallback;
          }
          return parsed as typeof fallback;
        } catch {
          return fallback;
        }
      }),
    spatialArbitrageSimulate: protectedProcedure
      .input(
        z.object({
          transportCostPerKmPerTon: z.number().min(0.1).max(5.0),
          minProfitThreshold: z.number().min(0.0).max(10.0),
          batchSizeTon: z.number().min(50).max(5000),
          originFilter: z.string(),
          partCode: z.string().optional(),
          vehiclePreference: z.enum(["auto", "small", "medium", "large"]).optional().default("auto"),
          targetShipmentTon: z.number().min(0).max(200000).optional(),
          strategyMode: z.enum(["balanced", "fresh_first", "storage_first", "deep_processing"]).optional().default("balanced"),
          timeStoragePolicy: z.enum(["auto", "force", "off"]).optional().default("auto"),
          planningDays: z.number().int().min(1).max(30).optional().default(7),
          holdingCostPerMonth: z.number().min(0.01).max(2.0).optional().default(0.2),
          socialBreakevenCost: z.number().min(1).max(40).optional().default(12.0),
          startMonth: z.number().int().min(1).max(12).optional().default(4),
          storageDurationMonths: z.number().int().min(1).max(10).optional().default(6),
          freshSalesTonPerDay: z.number().min(0).max(50000).optional().default(900),
          reserveSalesTonPerMonth: z.number().min(0).max(200000).optional().default(5000),
          deepProcessingTonPerDay: z.number().min(0).max(50000).optional().default(260),
          rentedStorageTon: z.number().min(0).max(200000).optional().default(0),
          optimization: networkOptimizationSchema,
        })
      )
      .query(({ input }) => {
        return calculateSpatialArbitrage({
          transportCostPerKmPerTon: input.transportCostPerKmPerTon,
          minProfitThreshold: input.minProfitThreshold,
          batchSizeTon: input.batchSizeTon,
          originFilter: input.originFilter,
          partCode: input.partCode ?? "all",
          vehiclePreference: input.vehiclePreference,
          targetShipmentTon: input.targetShipmentTon,
          strategyMode: input.strategyMode,
          timeStoragePolicy: input.timeStoragePolicy,
          planningDays: input.planningDays,
          holdingCostPerMonth: input.holdingCostPerMonth,
          socialBreakevenCost: input.socialBreakevenCost,
          startMonth: input.startMonth,
          storageDurationMonths: input.storageDurationMonths,
          freshSalesTonPerDay: input.freshSalesTonPerDay,
          reserveSalesTonPerMonth: input.reserveSalesTonPerMonth,
          deepProcessingTonPerDay: input.deepProcessingTonPerDay,
          rentedStorageTon: input.rentedStorageTon,
          optimization: input.optimization,
        });
      }),
    spatialAiDispatch: protectedProcedure
      .input(
        z.object({
          routes: z.array(z.any()) // simplifying validation check here manually
        })
      )
      .mutation(async ({ input }) => {
        const routes = input.routes as any[];
        const fallback = generateRoleTasksDraft(routes);

        try {
          // You could run Manus LLM to dynamically generate tasks.
          // For simplicity in UI update, we are making a direct LLM call logic here similar to aiDecision
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "你是生猪供应链专家。请根据传入的最优套利路线指引生成4个关键岗位的详细落地执行任务单，给出 3 到 4 句话简明扼要的执行步骤即可。",
              },
              {
                role: "user",
                content: "最优路线数据为：\n" + JSON.stringify(routes.slice(0, 3)),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "ai_bussiness_roles_tasks",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    purchasing: { type: "array", items: { type: "string" } },
                    logistics: { type: "array", items: { type: "string" } },
                    sales: { type: "array", items: { type: "string" } },
                    risk: { type: "array", items: { type: "string" } },
                  },
                  required: ["purchasing", "logistics", "sales", "risk"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = llmResult.choices?.[0]?.message?.content;
          if (typeof rawContent !== "string") {
            return fallback;
          }
          const parsed = JSON.parse(rawContent);
          if (!parsed || !Array.isArray(parsed.purchasing)) {
            return fallback;
          }
          return parsed as typeof fallback;
        } catch {
          return fallback;
        }
      }),
    saveArbitrageRecord: protectedProcedure
      .input(
        z.object({
          recordType: z.enum(["time", "spatial"]),
          scenarioLabel: z.string().min(1).max(128),
          params: z.record(z.string(), z.any()),
          result: z.record(z.string(), z.any()),
          summaryProfit: z.string().min(1).max(64),
          summaryMetric: z.string().min(1).max(128),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        const record = await createArbitrageRecord({
          recordType: input.recordType,
          scenarioLabel: input.scenarioLabel,
          params: input.params,
          result: input.result,
          summaryProfit: input.summaryProfit,
          summaryMetric: input.summaryMetric,
          operatorOpenId: user?.openId,
          operatorName: user?.name ?? undefined,
        });
        return { success: !!record, record };
      }),
    listArbitrageRecords: protectedProcedure
      .input(
        z.object({
          recordType: z.enum(["time", "spatial"]).optional(),
          limit: z.number().int().min(1).max(200).optional().default(50),
        }).optional()
      )
      .query(async ({ input }) => {
        const rows = await listArbitrageRecords({
          recordType: input?.recordType,
          limit: input?.limit ?? 50,
        });
        return rows.map(row => ({
          id: row.id,
          recordType: row.recordType,
          scenarioLabel: row.scenarioLabel,
          summaryProfit: row.summaryProfit,
          summaryMetric: row.summaryMetric,
          operatorName: row.operatorName ?? null,
          createdAt: row.createdAt,
          params: (() => { try { return JSON.parse(row.paramsJson); } catch { return {}; } })(),
          result: (() => { try { return JSON.parse(row.resultJson); } catch { return {}; } })(),
        }));
      }),
    aiAgents: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .mutation(async ({ input }) => {
        const context = buildAgentDecisionContext(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
        const fallback = buildAgentDecisionDraft(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );

        try {
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "你是 CP-AI Brain 的多 Agent 协同决策引擎。请基于给定业务数据，输出总部经营 Agent、业务调度 Agent、现场执行 Agent 的分层推理结果。结果必须专业、明确、可执行，并严格输出 JSON。",
              },
              {
                role: "user",
                content: JSON.stringify(context),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "ai_agent_decision",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    overview: { type: "string" },
                    coordinationSignal: { type: "string" },
                    dispatchSummary: { type: "string" },
                    agents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          agentId: { type: "string", enum: ["global", "business", "field"] },
                          agentName: { type: "string" },
                          objective: { type: "string" },
                          recommendation: { type: "string" },
                          rationale: { type: "string" },
                          riskLevel: { type: "string", enum: ["低", "中", "高"] },
                          nextAction: { type: "string" },
                        },
                        required: [
                          "agentId",
                          "agentName",
                          "objective",
                          "recommendation",
                          "rationale",
                          "riskLevel",
                          "nextAction",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["overview", "coordinationSignal", "dispatchSummary", "agents"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = llmResult.choices?.[0]?.message?.content;
          if (typeof rawContent !== "string") {
            return fallback;
          }
          const parsed = JSON.parse(rawContent);
          if (!parsed || !Array.isArray(parsed.agents)) {
            return fallback;
          }
          return parsed;
        } catch {
          return fallback;
        }
      }),
    aiAlerts: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .query(({ input }) => {
        return buildAlertBoard(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
      }),
    aiDispatch: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .query(({ input }) => {
        return buildDispatchBoard(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
      }),
    persistAiDispatch: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          selectedMonth: z.number().int().min(1).max(3),
          targetPrice: z.number().min(1).max(40),
          capacityAdjustment: z.number().min(-60).max(120),
          demandAdjustment: z.number().min(-60).max(120),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const dispatch = buildDispatchBoard(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
        const alerts = buildAlertBoard(
          input.batchCode,
          input.selectedMonth,
          input.targetPrice,
          input.capacityAdjustment,
          input.demandAdjustment,
        );
        const persistence = await persistDispatchPlan({
          batchCode: input.batchCode,
          scenarioMonth: input.selectedMonth,
          escalation: dispatch.escalation,
          summary: dispatch.summary,
          workOrders: dispatch.workOrders,
          feedback: dispatch.feedback,
          operatorName: ctx.user.name ?? "系统",
          operatorRole: ctx.user.role === "admin" ? "admin" : "strategist",
        });
        const notifications = dispatch.escalation || alerts.items.some(item => item.status === "red")
          ? await sendEscalationNotifications({
              batchCode: input.batchCode,
              overview: alerts.overview,
              alerts: alerts.items,
              workOrders: dispatch.workOrders,
            })
          : { wecom: "skipped", sms: "skipped", owner: "skipped" };

        return {
          ...dispatch,
          persistence,
          notifications,
        };
      }),
    aiDispatchHistory: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return listDispatchReceiptsByBatch(input.batchCode);
      }),
    updateAiDispatchReceipt: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          role: z.enum(["厂长", "司机", "仓储管理员"]),
          status: z.enum(["待确认", "已接单", "执行中", "已完成", "超时升级"]),
          etaMinutes: z.number().int().min(0).max(720),
          note: z.string().min(1),
          acknowledgedBy: z.string().optional(),
          receiptBy: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const updateResult = await updateDispatchReceipt(input);
        const order = await getDispatchOrderByOrderId(input.orderId);
        const persistedAudit = await createAuditLog({
          actionType: input.status === "超时升级" ? "工单超时升级" : "工单回执更新",
          entityType: "DispatchOrder",
          entityId: input.orderId,
          relatedOrderId: input.orderId,
          operatorRole: ctx.user.role === "admin" ? "admin" : "executor",
          operatorName: ctx.user.name ?? input.receiptBy ?? input.acknowledgedBy ?? "现场执行",
          riskLevel: input.status === "超时升级" ? "高" : input.status === "已完成" ? "低" : "中",
          decision: `${input.role} -> ${input.status}`,
          beforeValue: `ETA=${input.etaMinutes}; 说明=${input.note}`,
          afterValue: input.receiptBy ? `签收人=${input.receiptBy}` : `确认人=${input.acknowledgedBy ?? "系统"}`,
          status: input.status === "超时升级" ? "待审批" : "已执行",
        });
        const audit =
          persistedAudit ??
          appendAuditEntry({
            actionType: input.status === "超时升级" ? "工单超时升级" : "工单回执更新",
            entityType: "DispatchOrder",
            entityId: input.orderId,
            operatorRole: ctx.user.role === "admin" ? "admin" : "executor",
            operatorName: ctx.user.name ?? input.receiptBy ?? input.acknowledgedBy ?? "现场执行",
            riskLevel: input.status === "超时升级" ? "高" : input.status === "已完成" ? "低" : "中",
            decision: `${input.role} -> ${input.status}`,
            beforeValue: `ETA=${input.etaMinutes}; 说明=${input.note}`,
            afterValue: input.receiptBy ? `签收人=${input.receiptBy}` : `确认人=${input.acknowledgedBy ?? "系统"}`,
            status: input.status === "超时升级" ? "待审批" : "已执行",
          });

        let notifications = { wecom: "skipped", sms: "skipped", owner: "skipped" };
        if (input.status === "超时升级" && order) {
          let payload: Record<string, string | number> = {};
          try {
            const parsed = JSON.parse(order.payloadJson) as Record<string, unknown>;
            payload = Object.fromEntries(
              Object.entries(parsed).filter((entry): entry is [string, string | number] => {
                return typeof entry[1] === "string" || typeof entry[1] === "number";
              }),
            );
          } catch {
            payload = {};
          }

          notifications = await sendEscalationNotifications({
            batchCode: order.batchCode,
            overview: `工单 ${order.orderId} 已触发超时升级，请负责人立即介入。`,
            alerts: [
              {
                alertId: `TIMEOUT-${order.orderId}`,
                title: `${input.role} 工单超时升级`,
                status: "red",
                summary: `工厂 ${order.factory} 的 ${input.role} 工单已超时，当前 ETA 为 ${input.etaMinutes} 分钟。`,
                impactScope: `${order.factory} / 订单 ${order.orderId}`,
                estimatedLoss: Math.max(order.quantity * 2, 5000),
                aiRecommendation: input.note,
                rootCause: "执行回执超时或签收未闭环",
                actionOwner: input.role,
              },
            ],
            workOrders: [
              {
                orderId: order.orderId,
                role: input.role,
                stage: input.role === "厂长" ? "slaughter" : input.role === "司机" ? "cold-chain" : "warehouse",
                factory: order.factory,
                quantity: order.quantity,
                priority: order.priority,
                scheduledTime: order.scheduledLabel,
                acceptanceStandard: order.acceptanceStandard,
                operationRequirement: input.note,
                escalationCondition: "执行回执超时或关键节点未闭环时立即升级。",
                payload,
              },
            ],
          });
        }

        return {
          success: true,
          updateResult,
          audit,
          notifications,
        };
      }),
    auditLogs: protectedProcedure.query(async () => {
      const persisted = await listPersistedAuditLogs();
      if (persisted.length > 0) {
        return persisted.sort((a, b) => b.createdAt - a.createdAt);
      }
      return listAuditEntries().sort((a, b) => b.createdAt - a.createdAt);
    }),
    confirmDecision: protectedProcedure
      .input(
        z.object({
          batchCode: z.string(),
          scenarioId: z.string(),
          operatorRole: roleSchema,
          operatorName: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const { scenarios } = await buildLiveDecisionScenarios(input.batchCode);
        const targetScenario = scenarios.find(item => item.scenarioId === input.scenarioId);
        if (!targetScenario) {
          throw new Error("Decision scenario not found");
        }
        const status = targetScenario.riskLevel === "高" ? "待审批" : "已确认";
        const persistedAudit = await createAuditLog({
          actionType: targetScenario.riskLevel === "高" ? "高风险策略提交" : "策略确认",
          entityType: "DecisionScenario",
          entityId: targetScenario.scenarioId,
          relatedOrderId: null,
          operatorRole: input.operatorRole,
          operatorName: input.operatorName,
          riskLevel: targetScenario.riskLevel,
          decision: `${targetScenario.action} ${targetScenario.holdMonths} 个月`,
          beforeValue: `保本价=${targetScenario.breakEvenPrice}; 预计售价=${targetScenario.expectedSellPrice}`,
          afterValue:
            status === "待审批"
              ? "已触发人工二次确认弹窗，等待审批"
              : `已确认执行; 动作=${targetScenario.action}`,
          status,
        });
        const audit =
          persistedAudit ??
          appendAuditEntry({
            actionType: targetScenario.riskLevel === "高" ? "高风险策略提交" : "策略确认",
            entityType: "DecisionScenario",
            entityId: targetScenario.scenarioId,
            operatorRole: input.operatorRole,
            operatorName: input.operatorName,
            riskLevel: targetScenario.riskLevel,
            decision: `${targetScenario.action} ${targetScenario.holdMonths} 个月`,
            beforeValue: `保本价=${targetScenario.breakEvenPrice}; 预计售价=${targetScenario.expectedSellPrice}`,
            afterValue:
              status === "待审批"
                ? "已触发人工二次确认弹窗，等待审批"
                : `已确认执行; 动作=${targetScenario.action}`,
            status,
          });
        return {
          success: true,
          audit,
        };
      }),
    financialArbitrageSimulate: protectedProcedure
      .input(
        z.object({
          spotPrice: z.number(),
          futuresPrice: z.number(),
          expectedFutureSpotPrice: z.number(),
          expectedFutureFuturesPrice: z.number(),
          physicalExposureTons: z.number(),
          hedgeRatio: z.number(),
          marginRate: z.number(),
          contractSize: z.number(),
          holdingDays: z.number().int().min(1).max(365).optional().default(90),
          storageCostPerTonDay: z.number().min(0).max(50).optional().default(1.1),
          financingRatePct: z.number().min(0).max(30).optional().default(4.2),
          transactionCostPerTon: z.number().min(0).max(500).optional().default(18),
          slippagePerKg: z.number().min(0).max(2).optional().default(0.03),
          deliveryCostPerTon: z.number().min(0).max(1000).optional().default(35),
          expectedBasisConvergence: z.number().min(-5).max(5).optional().default(0),
          maxCapital: z.number().min(1).max(1_000_000_000).optional(),
          maxMarginUsage: z.number().min(1).max(1_000_000_000).optional(),
          optimizationTarget: z.enum(["net_profit_max", "risk_adjusted_return_max", "capital_efficiency_max"]).optional().default("risk_adjusted_return_max"),
          riskProfile: z.enum(["conservative", "balanced", "aggressive"]).optional().default("balanced"),
        })
      )
      .query(({ input }) => {
        return simulateFinancialArbitrage(input);
      }),
    professionalArbitrageSimulate: protectedProcedure
      .input(
        z
          .object({
            partCode: z.string().optional(),
            batchCode: z.string().optional(),
            spotPrice: z.number().min(1).max(40).optional(),
            futuresPrice: z.number().min(1).max(40).optional(),
            expectedFutureSpotPrice: z.number().min(1).max(40).optional(),
            expectedFutureFuturesPrice: z.number().min(1).max(40).optional(),
            holdingCostPerMonth: z.number().min(0.01).max(2.0).optional(),
            socialBreakevenCost: z.number().min(1).max(40).optional(),
            storageTons: z.number().min(50).max(50000).optional(),
            startMonth: z.number().int().min(1).max(12).optional(),
            storageDurationMonths: z.number().int().min(1).max(10).optional(),
            originFilter: z.string().optional(),
            transportCostPerKmPerTon: z.number().min(0.1).max(5.0).optional(),
            minProfitThreshold: z.number().min(0).max(10).optional(),
            targetShipmentTon: z.number().min(0).max(200000).optional(),
            physicalExposureTons: z.number().min(1).max(200000).optional(),
            hedgeRatio: z.number().min(0).max(1).optional(),
            marginRate: z.number().min(0.01).max(0.5).optional(),
            contractSize: z.number().min(1).max(100).optional(),
            maxCapital: z.number().min(1).max(1_000_000_000).optional(),
            maxMarginUsage: z.number().min(1).max(1_000_000_000).optional(),
            riskProfile: z.enum(["conservative", "balanced", "aggressive"]).optional(),
          })
          .optional(),
      )
      .query(({ input }) => {
        return simulateProfessionalArbitrage(input ?? {});
      }),
    aiChat: protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            }),
          ),
          context: z
            .object({
              batchCode: z.string().optional(),
              timeframe: timeframeSchema.optional(),
              regionCode: z.string().optional(),
            })
            .optional(),
        }),
      )
      .mutation(async ({ input }) => {
        // Build system prompt with market context
        let systemContext = `你是 CP-AI Brain 平台的智能决策助手，专注于农牧产业（特别是猪肉产业链）的量化分析与决策支持。
你的职责是：
1. 基于当前市场行情数据（现货价、期货价、基差）提供准确的市场分析
2. 解释量化决策公式的计算结果（保本价、预计售价、净收益）
3. 分析库存批次的持有/出售建议，并给出明确的风险评估
4. 提供产业链各环节的经营洞察

重要原则：
- 所有建议必须基于数学公式和数据，不得给出模糊建议
- 高风险操作必须明确提示需要人工确认
- 回答要专业、简洁、有数据支撑`;

        if (input.context?.batchCode) {
          try {
            const { batch, scenarios, snapshot } = await buildLiveDecisionScenarios(
              input.context.batchCode,
              input.context.regionCode ?? "national",
            );
            const marketSnapshot = await buildPorkMarketSnapshot(
              input.context.timeframe ?? "month",
              input.context.regionCode ?? "national",
              "hogPrice",
            );

            systemContext += `\n\n当前市场数据（实时）：
- 生猪现货价：¥${marketSnapshot.benchmarkQuotes.find(q => q.code === "live_hog")?.price ?? "N/A"}/kg
- 白条价：¥${marketSnapshot.benchmarkQuotes.find(q => q.code === "carcass")?.price ?? "N/A"}/kg
- 冷冻价：¥${marketSnapshot.benchmarkQuotes.find(q => q.code === "frozen_stock")?.price ?? "N/A"}/kg
- 玉米现货：¥${marketSnapshot.benchmarkQuotes.find(q => q.code === "corn_spot")?.price ?? "N/A"}/ton
- 豆粕现货：¥${marketSnapshot.benchmarkQuotes.find(q => q.code === "soymeal_spot")?.price ?? "N/A"}/ton

当前库存批次（${input.context.batchCode}）：
- 部位：${batch.partName}
- 仓库：${batch.warehouse}
- 库龄：${batch.ageDays} 天
- 库存量：${batch.weightKg.toLocaleString()} kg
- 单位成本：¥${batch.unitCost}/kg
- 当前现货价：¥${batch.currentSpotPrice}/kg
- 期货映射价：¥${batch.futuresMappedPrice}/kg

量化决策方案：
${scenarios
  .map(
    s =>
      `- ${s.holdMonths}个月方案：保本价=¥${s.breakEvenPrice.toFixed(2)}, 预计售价=¥${s.expectedSellPrice.toFixed(2)}, 净收益=¥${s.netProfitPerKg.toFixed(2)}/kg, 建议=${s.action}, 风险=${s.riskLevel}(${s.riskScore})`,
  )
  .join("\n")}`;
          } catch (e) {
            // Context enrichment failed, continue with base system prompt
          }
        }

        const messagesWithSystem = [
          { role: "system" as const, content: systemContext },
          ...input.messages,
        ];

        const result = await invokeLLM({ messages: messagesWithSystem });
        const content = result.choices?.[0]?.message?.content ?? "AI 暂时无法响应，请稍后重试。";

        return { content };
      }),
    deepArbitrageAnalysis: protectedProcedure
      .input(
        z.object({
          cornPrice: z.number().min(1500).max(3500).optional().default(2386),
          soybeanMealPrice: z.number().min(2500).max(4500).optional().default(3115),
          liveHogPrice: z.number().min(5).max(25).optional().default(14.5),
          sowStock: z.number().min(3000).max(6000).optional().default(4200),
          capacityUtilization: z.number().min(30).max(120).optional().default(72),
          inventoryAge90Plus: z.number().min(0).max(100).optional().default(8),
          coldChainCost: z.number().min(0.5).max(5).optional().default(1.2),
          storageCost: z.number().min(100).max(500).optional().default(225),
          capitalCost: z.number().min(2).max(10).optional().default(3.8),
          liveHogSpot: z.number().min(5).max(25).optional().default(14.5),
          futuresPrice: z.number().min(10).max(30).optional().default(16.2),
          cornSpot: z.number().min(1500).max(3500).optional().default(2386),
          soymealSpot: z.number().min(2500).max(4500).optional().default(3115),
          inventoryTurnover: z.number().min(0).max(100).optional().default(85),
          executionRate: z.number().min(50).max(100).optional().default(92),
          lossRate: z.number().min(0).max(5).optional().default(0.9),
        }),
      )
      .query(({ input }) => {
        const deepInput: DeepArbitrageInput = {
          cornPrice: input.cornPrice,
          soybeanMealPrice: input.soybeanMealPrice,
          liveHogPrice: input.liveHogPrice,
          porkPartPrices: Object.fromEntries(
            PORK_PARTS.slice(0, 8).map(p => [p.code, p.yieldRate * 100 + 20])
          ),
          sowStock: input.sowStock,
          capacityUtilization: input.capacityUtilization,
          inventoryAgeDistribution: { "0-30": 45, "30-60": 28, "60-90": 19, "90+": input.inventoryAge90Plus },
          coldChainCost: input.coldChainCost,
          storageCost: input.storageCost,
          capitalCost: input.capitalCost,
          regionalPriceSpread: {
            "东北": { "华南": 3.2, "华东": 2.8 },
            "华北": { "华南": 2.6, "华东": 1.9 },
            "华中": { "华南": 1.8, "华东": 1.2 },
          },
          policySignals: input.liveHogPrice < 13.8 ? ["启动冻肉收储", "养殖补贴"] : [],
          brandCertification: ["绿色食品", "地理标志"],
        };

        const timeResult = {
          spotPrice: input.liveHogSpot,
          futuresPrice: input.futuresPrice,
          basis: input.futuresPrice - input.liveHogSpot,
          holdingDays: 120,
          expectedReturn: (input.futuresPrice - input.liveHogSpot - input.storageCost * 4 / 1000) * 1000,
          sharpeRatio: 1.2,
        };

        const spaceResult = {
          originPrice: input.liveHogSpot,
          destPrice: input.liveHogSpot * 1.22,
          transportCost: input.coldChainCost * 800 / 1000,
          netProfitPerKg: input.liveHogSpot * 0.22 - input.coldChainCost * 800 / 1000,
          bestRoute: "东北→华南",
          totalCapacity: 8500,
        };

        const entityResult = {
          freshProfitPerKg: input.liveHogSpot * 0.15,
          frozenProfitPerKg: input.liveHogSpot * 0.22,
          processingProfitPerKg: input.liveHogSpot * 0.35,
          bestChannel: "深加工",
          premiumRate: 0.35,
        };

        const financialResult = {
          spotPrice: input.liveHogSpot,
          futuresPrice: input.futuresPrice,
          basisSpread: input.futuresPrice - input.liveHogSpot,
          hedgeRatio: 0.6,
          fundingCostSaving: (input.capitalCost / 100 - 2.8 / 100) * 4,
        };

        return buildIntegratedArbitrageAnalysis(timeResult, spaceResult, entityResult, financialResult, deepInput);
      }),
    coreMetrics: protectedProcedure
      .input(
        z.object({
          cornPrice: z.number().min(1500).max(3500).optional().default(2386),
          soybeanMealPrice: z.number().min(2500).max(4500).optional().default(3115),
          liveHogPrice: z.number().min(5).max(25).optional().default(14.5),
          liveHogSpot: z.number().min(5).max(25).optional().default(14.5),
          futuresPrice: z.number().min(10).max(30).optional().default(16.2),
          cornSpot: z.number().min(1500).max(3500).optional().default(2386),
          soymealSpot: z.number().min(2500).max(4500).optional().default(3115),
          sowStock: z.number().min(3000).max(6000).optional().default(4200),
          capacityUtilization: z.number().min(30).max(120).optional().default(72),
          inventoryTurnover: z.number().min(0).max(100).optional().default(85),
          executionRate: z.number().min(50).max(100).optional().default(92),
          lossRate: z.number().min(0).max(5).optional().default(0.9),
        }),
      )
      .query(({ input }) => {
        const deepInput: DeepArbitrageInput & {
          liveHogSpot: number;
          futuresPrice: number;
          cornSpot: number;
          soymealSpot: number;
          inventoryTurnover: number;
          capacityUtilization: number;
          executionRate: number;
          lossRate: number;
        } = {
          cornPrice: input.cornPrice,
          soybeanMealPrice: input.soybeanMealPrice,
          liveHogPrice: input.liveHogPrice,
          porkPartPrices: Object.fromEntries(
            PORK_PARTS.slice(0, 8).map(p => [p.code, p.yieldRate * 100 + 20])
          ),
          sowStock: input.sowStock,
          capacityUtilization: input.capacityUtilization,
          inventoryAgeDistribution: { "0-30": 45, "30-60": 28, "60-90": 19, "90+": 8 },
          coldChainCost: 1.2,
          storageCost: 225,
          capitalCost: 3.8,
          regionalPriceSpread: {},
          policySignals: [],
          brandCertification: [],
          liveHogSpot: input.liveHogSpot,
          futuresPrice: input.futuresPrice,
          cornSpot: input.cornSpot,
          soymealSpot: input.soymealSpot,
          inventoryTurnover: input.inventoryTurnover,
          executionRate: input.executionRate,
          lossRate: input.lossRate,
        };
        return buildCoreMetrics(deepInput);
      }),
    deepArbitrageList: protectedProcedure
      .input(
        z.object({
          cornPrice: z.number().min(1500).max(3500).optional().default(2386),
          soybeanMealPrice: z.number().min(2500).max(4500).optional().default(3115),
          liveHogPrice: z.number().min(5).max(25).optional().default(14.5),
          sowStock: z.number().min(3000).max(6000).optional().default(4200),
          capacityUtilization: z.number().min(30).max(120).optional().default(72),
        }),
      )
      .query(({ input }) => {
        const deepInput: DeepArbitrageInput = {
          cornPrice: input.cornPrice,
          soybeanMealPrice: input.soybeanMealPrice,
          liveHogPrice: input.liveHogPrice,
          porkPartPrices: Object.fromEntries(
            PORK_PARTS.map(p => [p.code, p.yieldRate * 100 + 20])
          ),
          sowStock: input.sowStock,
          capacityUtilization: input.capacityUtilization,
          inventoryAgeDistribution: { "0-30": 45, "30-60": 28, "60-90": 19, "90+": 8 },
          coldChainCost: 1.2,
          storageCost: 225,
          capitalCost: 3.8,
          regionalPriceSpread: {
            "东北": { "华南": 3.2, "华东": 2.8 },
            "华北": { "华南": 2.6, "华东": 1.9 },
            "华中": { "华南": 1.8, "华东": 1.2 },
          },
          policySignals: input.liveHogPrice < 13.8 ? ["启动冻肉收储", "养殖补贴"] : [],
          brandCertification: ["绿色食品"],
        };
        return analyzeAllDeepArbitrages(deepInput);
      }),
    globalOptimizationSimulate: protectedProcedure
      .input(
        z.object({
          tuning: z.object({
            slaughterCountMultiplier: z.number().min(0.5).max(1.5).optional(),
            avgWeightAdjustmentKg: z.number().min(-20).max(20).optional(),
            livePigPriceAdjustment: z.number().min(-5).max(5).optional(),
            slaughterCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            splitCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            freezeCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            storageCostMultiplier: z.number().min(0.5).max(1.5).optional(),
            transportCostMultiplier: z.number().min(0.5).max(1.5).optional(),
            partPriceAdjustments: z.record(z.string(), z.number().min(-10).max(10)).optional(),
          }).optional(),
        }).optional()
      )
      .query(({ input }) => {
        const baseInput = sampleOptimizationInput;
        const baseOutput = solveOptimization(baseInput);
        const baseDecision = generateAIDecision(baseInput, baseOutput);
        const tuned = buildTunedOptimizationInput(baseInput, input?.tuning);
        const output = solveOptimization(tuned.input);
        const decision = generateAIDecision(tuned.input, output);
        const sensitivity = buildOptimizationSensitivity(baseOutput, output, baseDecision, decision);
        return {
          input: tuned.input,
          output,
          decision,
          tuning: input?.tuning ?? {},
          appliedParameters: tuned.appliedParameters,
          sensitivity,
          baseline: {
            output: baseOutput,
            decision: baseDecision,
          },
        };
      }),
    globalOptimizationBatchSimulate: protectedProcedure
      .input(
        z.object({
          scenarios: z.array(z.object({
            name: z.string(),
            tuning: z.object({
              slaughterCountMultiplier: z.number().min(0.5).max(1.5).optional(),
              avgWeightAdjustmentKg: z.number().min(-20).max(20).optional(),
              livePigPriceAdjustment: z.number().min(-5).max(5).optional(),
              slaughterCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
              splitCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
              freezeCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
              storageCostMultiplier: z.number().min(0.5).max(1.5).optional(),
              transportCostMultiplier: z.number().min(0.5).max(1.5).optional(),
              partPriceAdjustments: z.record(z.string(), z.number().min(-10).max(10)).optional(),
            }),
          })).min(1).max(6),
        })
      )
      .query(({ input }) => {
        const baseInput = sampleOptimizationInput;
        const baseOutput = solveOptimization(baseInput);
        return input.scenarios.map((scenario) => {
          const tuned = buildTunedOptimizationInput(baseInput, scenario.tuning);
          const output = solveOptimization(tuned.input);
          const decision = generateAIDecision(tuned.input, output);
          return {
            name: scenario.name,
            tuning: scenario.tuning,
            summary: output.summary,
            decision,
            appliedParameters: tuned.appliedParameters,
            profitDelta: output.summary.totalProfit - baseOutput.summary.totalProfit,
          };
        });
      }),
    globalOptimizationChat: protectedProcedure
      .input(
        z.object({
          messages: z.array(z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string().min(1),
          })),
          tuning: z.object({
            slaughterCountMultiplier: z.number().min(0.5).max(1.5).optional(),
            avgWeightAdjustmentKg: z.number().min(-20).max(20).optional(),
            livePigPriceAdjustment: z.number().min(-5).max(5).optional(),
            slaughterCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            splitCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            freezeCapacityMultiplier: z.number().min(0.5).max(1.5).optional(),
            storageCostMultiplier: z.number().min(0.5).max(1.5).optional(),
            transportCostMultiplier: z.number().min(0.5).max(1.5).optional(),
            partPriceAdjustments: z.record(z.string(), z.number().min(-10).max(10)).optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const latestMessage = input.messages[input.messages.length - 1]?.content ?? "";
        const fallbackTuning = {
          ...(input.tuning ?? {}),
          ...buildOptimizationChatFallback(latestMessage),
        };
        const baseInput = sampleOptimizationInput;
        const baseOutput = solveOptimization(baseInput);
        const baseDecision = generateAIDecision(baseInput, baseOutput);

        const buildChatResult = (suggestion: GlobalOptimizationChatSuggestion) => {
          const tuned = buildTunedOptimizationInput(baseInput, {
            ...(input.tuning ?? {}),
            ...suggestion.parameterSuggestions,
            partPriceAdjustments: {
              ...(input.tuning?.partPriceAdjustments ?? {}),
              ...(suggestion.parameterSuggestions.partPriceAdjustments ?? {}),
            },
          });
          const output = solveOptimization(tuned.input);
          const decision = generateAIDecision(tuned.input, output);
          const sensitivity = buildOptimizationSensitivity(baseOutput, output, baseDecision, decision);
          return {
            suggestion: {
              ...suggestion,
              appliedParameters: tuned.appliedParameters,
            },
            input: tuned.input,
            output,
            decision,
            appliedParameters: tuned.appliedParameters,
            sensitivity,
          };
        };

        try {
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "你是最优化调度2页面的智能调参助手。你需要把用户自然语言目标转换成结构化调参建议，并输出严格 JSON。调参字段仅限：slaughterCountMultiplier, avgWeightAdjustmentKg, livePigPriceAdjustment, slaughterCapacityMultiplier, splitCapacityMultiplier, freezeCapacityMultiplier, storageCostMultiplier, transportCostMultiplier, partPriceAdjustments。倍率字段用 1 表示不变。",
              },
              {
                role: "user",
                content: JSON.stringify({
                  messages: input.messages as GlobalOptimizationChatMessage[],
                  tuning: input.tuning ?? {},
                  currentSummary: baseOutput.summary,
                  currentDecision: baseDecision,
                }),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "optimization_scheduling2_chat",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    structuredPrompt: { type: "string" },
                    reasoningSummary: { type: "string" },
                    decisionFocus: { type: "array", items: { type: "string" } },
                    recommendedActions: { type: "array", items: { type: "string" } },
                    parameterSuggestions: {
                      type: "object",
                      properties: {
                        slaughterCountMultiplier: { type: "number" },
                        avgWeightAdjustmentKg: { type: "number" },
                        livePigPriceAdjustment: { type: "number" },
                        slaughterCapacityMultiplier: { type: "number" },
                        splitCapacityMultiplier: { type: "number" },
                        freezeCapacityMultiplier: { type: "number" },
                        storageCostMultiplier: { type: "number" },
                        transportCostMultiplier: { type: "number" },
                        partPriceAdjustments: {
                          type: "object",
                          additionalProperties: { type: "number" },
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["structuredPrompt", "reasoningSummary", "decisionFocus", "recommendedActions", "parameterSuggestions"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = llmResult.choices?.[0]?.message?.content;
          if (typeof rawContent !== "string") {
            throw new Error("Invalid LLM content");
          }
          const parsed = JSON.parse(rawContent) as Omit<GlobalOptimizationChatSuggestion, "appliedParameters">;
          return buildChatResult({
            ...parsed,
            appliedParameters: [],
          });
        } catch {
          return buildChatResult({
            structuredPrompt: `根据用户意图自动生成调参建议：${latestMessage || "优化当前排产表现"}`,
            reasoningSummary: "已按关键词规则生成保守调参建议，并自动重新运行预测。",
            decisionFocus: ["利润提升", "瓶颈缓解", "成本优化"],
            recommendedActions: ["检查新的利润变化", "关注瓶颈是否减少", "如结果符合预期再继续细化参数"],
            parameterSuggestions: fallbackTuning,
            appliedParameters: [],
          });
        }
      }),
    globalOptimizationSolve: protectedProcedure
      .mutation(() => {
        const optInput = sampleOptimizationInput;
        const output = solveOptimization(optInput);
        const decision = generateAIDecision(optInput, output);
        return { input: optInput, output, decision };
      }),
  }),
});

export type AppRouter = typeof appRouter;
