import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  appendAuditEntry,
  getDecisionScenarios,
  getPlatformSnapshot,
  inventoryBatches,
  listAuditEntries,
} from "./platformData";
import { buildLiveDecisionScenarios, buildPorkMarketSnapshot } from "./marketData";

const timeframeSchema = z.enum(["day", "week", "month", "quarter", "halfYear", "year"]);
const roleSchema = z.enum(["admin", "strategist", "executor"]);
const marketSortSchema = z.enum(["hogPrice", "cornPrice", "soymealPrice", "hogChange"]);

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
    snapshot: publicProcedure
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
    porkMarket: publicProcedure
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
    scenarios: publicProcedure
      .input(
        z.object({
          batchCode: z.string(),
          regionCode: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        return buildLiveDecisionScenarios(input.batchCode, input.regionCode ?? "national");
      }),
    auditLogs: publicProcedure.query(() => {
      return listAuditEntries();
    }),
    confirmDecision: publicProcedure
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
        const audit = appendAuditEntry({
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
    aiChat: publicProcedure
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
  }),
});

export type AppRouter = typeof appRouter;
