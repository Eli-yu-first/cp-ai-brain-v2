# CP AI Brain - Migration TODO

## Phase 1: Dependencies & Schema
- [x] Install extra dependencies: react-simple-maps, streamdown
- [x] Migrate shared/const.ts, shared/types.ts, shared/_core/errors.ts
- [x] Migrate drizzle/schema.ts (audit_logs, dispatch_orders, dispatch_receipts, notification_deliveries)
- [x] Execute database migration SQL (6 tables created)
- [x] Add resolveJsonModule to tsconfig.json for china-geo.json import

## Phase 2: Backend Migration
- [x] Migrate server/db.ts (all DB helpers: persistDispatchPlan, updateDispatchReceipt, createAuditLog, etc.)
- [x] Migrate server/platformData.ts
- [x] Migrate server/marketData.ts
- [x] Migrate server/aiDecision.ts (buildAiForecast, buildWhatIfSimulation, buildAgentDecisionDraft, buildAlertBoard, buildDispatchBoard)
- [x] Migrate server/porkMap.ts
- [x] Migrate server/escalationNotifier.ts
- [x] Migrate server/routers.ts (all tRPC routes: platform.*, auth.*)

## Phase 3: Frontend Migration
- [x] Migrate client/src/index.css (global styles & dark theme)
- [x] Migrate client/src/main.tsx
- [x] Migrate client/src/App.tsx (PlatformRouter + TabProvider)
- [x] Migrate client/src/const.ts
- [x] Migrate contexts: LanguageContext, TabContext, ThemeContext
- [x] Migrate hooks: useComposition, useMobile, usePersistFn
- [x] Migrate all UI components (shadcn/ui + custom platform components)
- [x] Migrate pages: Tenants, Overview, Pork, PorkMap, Quant, AiDecision, Audit (7 pages)
- [x] Migrate data/china-geo.json (582KB topojson)
- [x] Migrate types/react-simple-maps.d.ts
- [x] Migrate client/src/lib/trpc.ts
- [x] Migrate client/src/lib/utils.ts
- [x] Migrate ErrorBoundary component
- [x] Migrate _core hooks (useAuth)

## Phase 4: Verification
- [x] Verify all tRPC routes respond correctly (401 for protected, 200 for public)
- [x] Verify database read/write: audit_logs, dispatch_orders, dispatch_receipts (e2e tests pass)
- [x] Verify AI (gemini-2.5-flash) via Manus Forge API - invokeLLM tested with structured JSON
- [x] Verify dispatch persistence and audit logs (platform.decision.test.ts passes)
- [x] Run vitest tests: 29/29 passed (8 test files)
- [x] Verify all 7 pages render correctly in browser (Tenants, Overview, Pork, PorkMap, Quant, AiDecision, Audit)
- [x] TypeScript compilation: 0 errors

## 时间套利页面升级

- [x] 后端：扩展 timeArbitrage.ts 计算逻辑，支持社会养殖成本、收储量、收储时长参数
- [x] 后端：更新 routers.ts arbitrageSimulate 路由接受新参数
- [x] 前端：套利参数设置面板新增社会养殖成本、收储量滑块和收储时长选择器（1-9月）
- [x] 前端：价格曲线展示多条线（持有成本线、预期售价线、社会养殖成本线、利润空间柱）
- [x] 前端：释放利润预测卡片展示在图表中（利润空间柱状图叠加）
- [x] 前端：所有趋势线根据参数实时更新

## 综合升级 v1 / v2（已在 v3 子阶段中完成，归档）

> v1 中的记录持久化、Audit 展示、地图本地化、React.memo 优化，v2 中的后端重写、
> 收储背景高亮、每月价差、多方案保存/对比、真实物流调度、车型选择等需求，已合并进入
> v3 的阶段 2“9 并完成，下方 v3 段中为最新权威状态。

## 综合升级 v3（按步骤推进 + 每步 GitHub 同步）

**工作流规则（每步必执行）**：完成代码变更 → `pnpm check` 0 错误 → `pnpm test` 通过 → 同步到 `/home/ubuntu/cp-ai-brain-v2` → `git add -A && git commit -m "..." && git push origin main` → 再进入下一步

- [x] 阶段 2-5：时间套利综合升级（后端重构+前端重写+记录持久化+Audit 展示）→ 已提交 GitHub (c3f17fe)
- [x] 阶段 6：空间套利真实物流调度算法（后端 + 前端）→ 已提交 GitHub（后端 17423ba，前端 e7ab158）
- [x] 阶段 7：空间套利记录持久化 + Audit 展示 → 已实现（前端保存方案按钮 + Audit 页面设计上已覆盖 spatial，随阶段 6 前端提交 e7ab158）
- [x] 阶段 8：地图本地化缓存 → 已提交 GitHub (5316ec8)
- [x] 阶段 9：综合测试（49/49 vitest）+ 保存检查点 (89525345) → GitHub 完整提交链 c3f17fe → 17423ba → e7ab158 → 5316ec8
