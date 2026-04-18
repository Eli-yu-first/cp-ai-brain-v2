# CP-AI Brain 迁移 TODO

## 依赖安装
- [x] 安装 react-simple-maps、framer-motion、recharts、streamdown 等缺失依赖

## 共享类型和样式
- [x] 迁移 shared/types.ts（从 platformData.ts 提取类型）
- [x] 迁移 client/src/index.css 深色科技风全局样式
- [x] 迁移 client/src/const.ts
- [x] 迁移 shared/const.ts

## Contexts
- [x] 迁移 LanguageContext.tsx
- [x] 迁移 ThemeContext.tsx（已存在，确认一致）

## 前端组件
- [x] 迁移 components/platform/PlatformPrimitives.tsx
- [x] 迁移 components/platform/PlatformShell.tsx
- [x] 迁移 components/platform/TimeframeToggle.tsx
- [x] 迁移 components/platform/GlobalAssetMap.tsx
- [x] 迁移 components/platform/globalAssetMapData.ts
- [x] 迁移 components/AIChatBox.tsx
- [x] 迁移 components/ManusDialog.tsx
- [x] 迁移 components/Map.tsx
- [x] 迁移 components/DashboardLayout.tsx（已存在，确认一致）
- [x] 迁移所有 UI 组件（accordion, alert-dialog, badge 等）

## 前端页面
- [x] 迁移 pages/Home.tsx
- [x] 迁移 pages/Tenants.tsx
- [x] 迁移 pages/Overview.tsx
- [x] 迁移 pages/Pork.tsx（含 porkChartViewport.ts）
- [x] 迁移 pages/Quant.tsx
- [x] 迁移 pages/Audit.tsx
- [x] 迁移 pages/NotFound.tsx
- [x] 更新 App.tsx 路由

## 后端业务逻辑
- [x] 迁移 server/platformData.ts
- [x] 迁移 server/marketData.ts
- [x] 更新 server/routers.ts（添加所有 platform 路由）
- [x] 添加 AI 聊天路由（platform.aiChat）

## AI 集成
- [x] 在 server/routers.ts 中添加 AI 分析路由（platform.aiChat）
- [x] 在 Pork 页面集成 AI 建议（通过 AIChatBox 组件）
- [x] 在 Quant 页面集成 AI 解释（通过 ManusDialog 组件）

## 测试
- [x] 迁移 server/marketData.test.ts（3 个测试通过）
- [x] 迁移 server/platform.decision.test.ts（2 个测试通过）
- [x] 迁移 client/src/pages/porkChartViewport.test.ts（3 个测试通过）
- [x] 迁移 client/src/components/platform/globalAssetMapData.test.ts（3 个测试通过）
- [x] 所有 12 个测试全部通过

## 验证
- [x] 所有页面正常加载（Home、Tenants、Overview、Pork、Quant、Audit）
- [x] 行情数据正确展示（23 个部位现货价、期货价、历史数据）
- [x] 量化决策引擎正常工作（保本价、预计售价、净收益计算正确）
- [x] 审计日志写入正常（种子数据已加载）
- [x] 多语言切换正常（中/英/日/泰）
- [x] AI 分析功能正常（Manus LLM 集成，基于实时数据给出准确分析）
- [x] TypeScript 零错误
