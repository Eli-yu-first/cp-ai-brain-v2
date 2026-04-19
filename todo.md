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

## 前端升级 - 高端科技风 SaaS 风格
- [x] 拉取 GitHub 最新代码并同步
- [x] 设计科技风视觉方案（字体、色彩、动效、质感）
- [x] 升级 index.css 全局样式和 CSS 变量
- [x] 升级 index.html（引入高端字体）
- [x] 升级 PlatformShell 导航组件
- [x] 升级 PlatformPrimitives 基础组件
- [x] 升级 Home 首页着陆页
- [x] 升级 Overview 全链总览大屏
- [x] 升级 Pork 猪事业部决策中心
- [x] 升级 Quant 量化决策引擎
- [x] 升级 Audit 审计日志页面
- [x] 升级 Tenants 租户选择页面
- [x] 全面测试验证所有功能不受影响（12/12 测试通过，TypeScript 零错误）

## 补充验证
- [x] 确认 GitHub 最新代码已同步到项目（diff 验证：shared/、server/ 核心文件完全一致）
- [x] 创建前端设计方案文档 DESIGN_SPEC.md（字体、色板、动效、材质、布局规则）
- [x] 验证 Audit 页面内容区正常渲染（角色矩阵 3 个角色、审计日志 2 条记录、变更前后对比）

## 前端 UI 重构（第二轮）
- [x] 重构左侧菜单栏：只显示导航标签，不嵌入概览/地图等页面内容
- [x] 猪事业部区域价格排序改为柱状图展示
- [x] 23部位图表添加毛猪、生肉、白条等品类（全部、毛猪、生肉、白条、副产品、冻品）
- [x] 折线图改为同花顺股票趋势图风格（MA5/MA10均线、指标选择、时间区间、缩放区间）
- [x] 为猪肉事业部添加数据筛选和排序功能（品类筛选、搜索、地域筛选、排序方式、升降序）
- [x] 关键指标卡片增加实时刷新和加载动画（30s自动刷新、脉冲动画、数据闪烁效果）

## 前端 UI 改进（第三轮）
- [ ] 实现多标签页系统（TabBar + 状态保持 + 切换不中断）→ 提交 GitHub
- [ ] 后台标签页功能完成时 TabBar 显示小红点/闪烁提示 → 提交 GitHub
- [ ] 右侧页面内容区面板改为直角科技感（菜单栏和按钮保持圆角）→ 提交 GitHub
- [ ] Live Inputs 面板改为期货行情滚动条风格（一行自动滚动 + 手动左右滑动）→ 提交 GitHub
- [ ] 恢复中国地图页面到 Overview，添加动态交互功能（省份悬停、点击、数据气泡等）→ 提交 GitHub
- [ ] 全面测试验证所有功能和视觉效果 → 提交 GitHub
