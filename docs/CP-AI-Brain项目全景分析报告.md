# CP-AI Brain 项目全景分析报告

版本：V1.0  
分析日期：2026-04-24  
分析范围：`client/`、`server/`、`shared/`、`drizzle/`、根目录配置、现有 `docs/` 业务文档与项目验证记录。

## 1. 项目总览

CP-AI Brain 是一个面向正大猪事业及农牧全产业链的“量化套利 + AI 决策 + 调度执行闭环”平台。当前代码库已经不是单纯展示型驾驶舱，而是具备多页业务工作台、实时行情聚合、量化套利计算、AI 决策生成、自动派单、审计留痕、数据库持久化和多语言展示能力的 TypeScript 全栈应用。

项目的核心目标可以概括为：

1. 将猪肉全产业链从“经验决策”升级为“数据、公式、算法驱动的量化决策”。
2. 以 23 个猪肉分割部位为最小经营单元，计算成本、保本价、价差、库存收益和执行风险。
3. 支持时间套利、空间套利、金融套利、深度产业套利和全链最优化调度。
4. 将 AI 决策结果转化为可执行工单，覆盖厂长、司机、仓储管理员等现场角色。
5. 通过审计、通知、回执和历史记录实现“决策 - 执行 - 反馈 - 复盘”闭环。

当前系统更接近一个“业务原型 + 可运行算法沙盘 + 决策工作台”的阶段：业务模型覆盖面较广，核心页面和服务已贯通；但数据源、算法工业化、权限治理、生产级部署和真实系统集成仍需要进一步工程化。

## 2. 业务背景与战略意图

现有 Word 文档和会议纪要反复指向同一战略判断：当前猪价低于社会平均成本和公司成本，直接销售毛猪或白条会造成显著亏损，因此需要利用周期、区域、部位、渠道、资金和产能差异，把“低价周期”转化为“减亏和增效窗口”。

业务核心不是单点预测，而是全产业链资源配置：

- 毛猪出栏是否直接出售、屠宰、分割、速冻或进入深加工。
- 哪些部位适合冻储，哪些部位适合鲜销，哪些部位适合深加工。
- 哪些区域低价供给，哪些区域高价消化，冷链成本是否覆盖价差。
- 库存持有多久可以覆盖仓储、资金、损耗和机会成本。
- 产能瓶颈在屠宰、分割、速冻、仓储、深加工还是销售渠道。
- 高风险策略是否需要审批，执行是否真正闭环。

项目中已经落地的业务概念包括：

- 23 部位经营模型。
- 时间套利：低价收储、高价释放、持有成本和未来售价比较。
- 空间套利：产地和销地区域价差、物流运费、车型、产能和需求调度。
- 金融套利：现货、期货、基差、套保比例、保证金、资金占用、压力测试。
- 深度套利：跨品种传导、繁育结构、零废弃、渠道场景、产能错配、现金流、政策、品牌、信息差、逆周期、跨境、合规、联营、绿色循环等 14 类机会。
- 全局最优化调度：屠宰、分割、冻储、销售、运输、深加工和库存的综合分配。
- 多 Agent 决策：总部经营、业务调度、现场执行三层建议。
- 自动派单：将 AI 方案转化为工单、角色状态和升级通知。

## 3. 技术栈与运行方式

当前项目采用单仓全栈结构：

| 层级 | 技术 | 当前用途 |
| --- | --- | --- |
| 前端 | React 19、TypeScript、Vite、Tailwind CSS 4、Radix UI、lucide-react、Recharts、react-simple-maps、wouter | 多页工作台、图表、地图、表格、交互调参、响应式页面 |
| API | tRPC 11、superjson、Zod | 类型安全 API、输入校验、前后端共享调用类型 |
| 后端 | Node.js、Express、tsx、esbuild | HTTP 服务、tRPC 中间件、OAuth、静态资源、存储代理 |
| 数据库 | MySQL、Drizzle ORM、drizzle-kit | 用户、审计、工单、回执、通知、行情快照、创投图谱等持久化 |
| AI/外部服务 | Manus/Forge 风格 LLM 调用封装、OAuth、对象存储、企业微信、短信 | AI 结构化输出、鉴权、存储、告警通知 |
| 测试 | Vitest | 后端算法、路由流程、前端纯函数和导航注册测试 |
| 构建 | Vite + esbuild | 前端静态构建和服务端 ESM bundle |

核心脚本：

- `pnpm dev`：开发模式启动 `server/_core/index.ts`，同时挂载 Vite。
- `pnpm build`：构建前端到 `dist/public`，并用 esbuild 打包服务端到 `dist/index.js`。
- `pnpm start`：生产模式启动 `dist/index.js`。
- `pnpm check`：TypeScript 类型检查。
- `pnpm test`：运行 Vitest 测试。
- `pnpm db:push`：生成并执行 Drizzle 迁移，依赖 `DATABASE_URL`。

## 4. 目录结构分析

```text
client/
  index.html
  public/
  src/
    App.tsx
    main.tsx
    pages/
    components/
    contexts/
    hooks/
    lib/
    data/
server/
  _core/
  routers.ts
  db.ts
  platformData.ts
  marketData.ts
  aiDecision.ts
  timeArbitrage.ts
  spatialArbitrage.ts
  financialArbitrage.ts
  deepArbitrage.ts
  globalOptimization.ts
  porkIndustryModel.ts
  porkMap.ts
  cpVentureData.ts
  escalationNotifier.ts
shared/
  types.ts
  const.ts
  cpVenture.ts
  globalOptimization.ts
drizzle/
  schema.ts
  relations.ts
  *.sql
docs/
  现有业务 Word 文档
```

目录职责清晰：

- `client/src/pages/` 是业务页面集合，每个页面对应一个或多个 tRPC 服务。
- `client/src/components/ui/` 是 shadcn/Radix 风格基础组件。
- `client/src/components/platform/` 是平台级导航、地图、控制条等业务组件。
- `server/_core/` 是基础设施层，包括 Express 启动、tRPC、鉴权、OAuth、LLM、存储代理、地图和通知能力。
- `server/*.ts` 是业务服务和算法模块。
- `shared/` 存放前后端共享类型、常量和大规模静态业务数据。
- `drizzle/` 是数据库模型和迁移。

## 5. 前端应用分析

### 5.1 路由和应用壳

`client/src/App.tsx` 使用 `wouter` 管理路由。首页 `/` 独立渲染，平台页面统一进入 `PlatformRouter`。平台页面不是每次切换都卸载，而是“打开过的 tab 保持挂载，只隐藏非当前页面”，用于保留页面状态。

当前平台注册页面包括：

| 路由 | 页面 | 业务职责 |
| --- | --- | --- |
| `/tenants` | `Tenants.tsx` | 租户/事业部入口 |
| `/overview` | `Overview.tsx` | 全链总览、核心经营指标、业务卡片、风险提示 |
| `/pork` | `Pork.tsx` | 猪事业部实时行情、23 部位行情、库存批次、AI 入口 |
| `/pork-map` | `PorkMap.tsx` | 中国地图、省份行情、仓储节点、跨区机会 |
| `/quant` | `Quant.tsx` | 库存批次 1/2/3 个月持有或出售量化决策 |
| `/ai` | `AiDecision.tsx` | AI 决策工作台、预测、What-If、多 Agent、预警、派单和移动端角色视图 |
| `/time-arbitrage` | `TimeArbitrage.tsx` | 冻品收储时间套利模拟、多方案保存、成本/利润曲线 |
| `/spatial-arbitrage` | `SpatialArbitrage.tsx` | 真实物流调度、车型选择、空间套利路线和 AI 派单 |
| `/financial-arbitrage` | `FinancialArbitrage.tsx` | 期现套利、套保、资金占用、压力测试 |
| `/global-optimization` | `GlobalOptimization.tsx` | 全局最优化调度、调参、批量策略、AI 调参聊天 |
| `/deep-arbitrage` | `DeepArbitrage.tsx` | 14 类深度套利、核心指标和综合策略 |
| `/audit` | `Audit.tsx` | 审计日志、套利记录和治理说明 |
| `/cp-venture` | `CpVenture.tsx` | 正大集团创投与生态关系图谱 |

### 5.2 前端状态和上下文

项目主要上下文包括：

- `LanguageContext`：支持中文、英文、日文、泰文，多数导航和核心页面文案已多语言化。
- `ThemeContext`：默认深色主题。
- `TabContext`：维护打开的业务标签、激活标签、徽标和闪烁状态。
- `OptimizationChatProvider`：为全局最优化页面提供悬浮式 AI 调参入口。
- `useAuth`：读取 `auth.me`，处理登录态、登出和未登录跳转。

### 5.3 前端设计语言

`client/src/index.css` 定义深色科技风格，使用 Tailwind CSS 4、OKLCH 色彩变量、玻璃拟态面板、深蓝黑背景、青蓝主色和高密度数据界面。页面整体偏“战房 / 运营指挥台 / 量化终端”风格。

优势：

- 数据密度高，适合经营分析。
- 图表、地图、表格和调参控件较完整。
- 各业务页使用统一平台壳，体验一致。

风险：

- CSS 中存在大量全局装饰和复杂背景，后续性能和可维护性需要关注。
- 部分页面文件超过 1000 行，后续应拆分为页面容器、业务组件、图表组件和纯计算 helpers。
- `DashboardLayout.tsx` 仍保留通用模板菜单，平台实际主要使用 `PlatformShell`，需要后续清理。

## 6. 后端架构分析

### 6.1 服务启动

`server/_core/index.ts` 是服务入口：

1. 创建 Express app 和 HTTP server。
2. 注册 JSON 和 URL encoded body parser，限制 50MB。
3. 注册对象存储代理和 OAuth 路由。
4. 挂载 `/api/trpc`。
5. 开发模式接入 Vite，生产模式服务 `dist/public`。
6. 从 `PORT` 开始寻找可用端口，默认 3000。

### 6.2 tRPC 分层

`server/_core/trpc.ts` 定义：

- `publicProcedure`：公开接口。
- `protectedProcedure`：要求用户登录。
- `adminProcedure`：要求 admin 角色。

`server/_core/context.ts` 在每个请求中调用 `sdk.authenticateRequest()`，将 `user` 注入 tRPC context。认证失败不会影响 public procedure，但 protected procedure 会返回 `Please login (10001)`。

### 6.3 API 总览

所有主业务接口集中在 `server/routers.ts` 的 `platform` router 下。核心接口如下：

| 模块 | 接口 | 类型 | 说明 |
| --- | --- | --- | --- |
| 系统 | `system.health` | query | 健康检查 |
| 鉴权 | `auth.me`、`auth.logout` | query/mutation | 当前用户和登出 |
| 总览 | `platform.snapshot` | query | 全链指标、业务卡片、部位、库存、租户和角色 |
| 行情 | `platform.porkMarket` | query | 实时/降级猪价、原料、期货、区域和部位行情 |
| 地图 | `platform.porkMap` | query | 省份节点、仓储点、跨区机会 |
| 创投 | `platform.cpVentureMap` | query | 正大生态公司图谱 |
| 蓝图 | `platform.projectBlueprint` | query | 项目背景、目标、模块、验收标准 |
| 量化决策 | `platform.scenarios`、`platform.confirmDecision` | query/mutation | 批次持有/出售方案和确认审计 |
| AI 工作台 | `platform.aiDecisionWorkspace` | query | 预测、What-If、预警、派单和历史聚合 |
| AI 预测 | `platform.aiForecast`、`platform.aiWhatIf` | query | 单独预测和资源模拟 |
| 多 Agent | `platform.aiAgents`、`platform.aiChat` | mutation | 结构化 Agent 建议和自然语言助手 |
| 派单 | `platform.aiDispatch`、`platform.persistAiDispatch`、`platform.aiDispatchHistory`、`platform.updateAiDispatchReceipt` | query/mutation | 工单生成、落库、历史和角色回执 |
| 时间套利 | `platform.arbitrageSimulate`、`platform.arbitrageAiDecision` | query/mutation | 收储曲线和 AI 判断 |
| 空间套利 | `platform.spatialArbitrageSimulate`、`platform.spatialAiDispatch` | query/mutation | 物流调度和岗位任务 |
| 套利记录 | `platform.saveArbitrageRecord`、`platform.listArbitrageRecords` | mutation/query | 时间/空间套利记录 |
| 金融套利 | `platform.financialArbitrageSimulate` | query | 期现、套保、保证金和压力测试 |
| 深度套利 | `platform.deepArbitrageAnalysis`、`platform.coreMetrics`、`platform.deepArbitrageList` | query | 14 类深度机会、指标和综合分析 |
| 全局优化 | `platform.globalOptimizationSimulate`、`platform.globalOptimizationBatchSimulate`、`platform.globalOptimizationChat`、`platform.globalOptimizationSolve` | query/mutation | 调度优化、策略对比、AI 调参 |
| 审计 | `platform.auditLogs` | query | 数据库或内存审计记录 |

## 7. 数据库模型分析

`drizzle/schema.ts` 当前定义 29 张以上 MySQL 表，覆盖认证、审计、派单、通知、行情、库存、产能、成本、预测、套利执行、风控、订单、采购、财务、现金流、政策、质检、冷链、品牌、供应商、客户、产能分配和环保指标。

### 7.1 已在代码中深度使用的表

| 表 | 用途 |
| --- | --- |
| `users` | OAuth 用户映射、角色、登录时间 |
| `audit_logs` | 策略确认、派单生成、回执更新、超时升级 |
| `dispatch_orders` | AI 工单主表 |
| `dispatch_receipts` | 厂长、司机、仓储管理员回执 |
| `notification_deliveries` | 企业微信、短信、owner 通知投递记录 |
| `arbitrage_records` | 时间/空间套利方案保存 |
| `cp_venture_companies`、`cp_venture_links` | 正大创投图谱持久化 |
| `pork_market_snapshots` | 行情快照 |
| `pork_price_ticks` | 现货、期货、基准、区域、部位价格 tick |
| `pork_part_quote_snapshots` | 部位价格快照 |
| `pork_inventory_snapshots` | 库存快照 |

### 7.2 已建模但尚未形成完整服务闭环的表

这些表体现了目标架构，但当前业务代码还没有完全接入 CRUD、ETL 或页面：

- `pork_hog_price_daily`
- `pork_futures_price`
- `inventory_batches`
- `warehouse_capacity`
- `production_schedule`
- `supply_chain_cost`
- `price_forecast`
- `arbitrage_execution`
- `risk_metrics`
- `sales_orders`
- `procurement_orders`
- `financial_statements`
- `cash_flow_forecast`
- `policy_incentives`
- `quality_inspection`
- `cold_chain_logistics`
- `brand_certification`
- `supplier_management`
- `customer_management`
- `capacity_allocation`
- `environmental_metrics`

结论：数据库 schema 的目标覆盖面很大，已经具备“工业级数据中台”的轮廓；但当前落地重点仍在行情快照、派单执行、审计和套利记录。下一阶段需要把这些表从“schema 资产”升级为“数据采集、服务接口、页面消费、质量校验、回测验证”的闭环资产。

## 8. 核心业务与算法模块

### 8.1 猪肉部位模型

`server/porkIndustryModel.ts` 是业务定义中心，包含：

- 23 个部位：五花、大排、小排、前腿肉、后腿肉、里脊、通脊、前排、筒骨、肋排、梅肉、臀尖、中方、带皮五花、去皮五花、排骨段、腿肉丁、里脊丝、五花肉块、大排片、小排块、前腿肉丝、后腿肉块。
- 部位分类：A/B/C。
- 出品率、储存优先级、加工优先级、渠道优先级。
- 全成本计算：养殖、屠宰、分割、速冻、仓储、运输、资金、损耗。
- CoC 公允价。
- 风险调整持有收益。
- 项目蓝图：背景、目标、业务场景、核心功能、数据模块、14 类深度套利和验收标准。

该文件在项目中扮演“业务规范编码化”的角色，是连接现有 Word 方案和可运行代码的关键。

### 8.2 行情与市场数据

`server/marketData.ts` 聚合猪价和期货数据：

- 猪价格网：全国和省份生猪、玉米、豆粕信息。
- 东方财富期货：生猪、玉米、豆粕主力合约。
- 批发猪肉价格。
- fallback 行情：外部抓取失败时使用本地种子数据。
- cache：避免高频重复抓取。
- 动态构造 23 部位价格、冻品价、期货映射价、预测价、基差、库存批次和历史曲线。
- 异步写入行情快照和价格 tick 到数据库。

这是当前项目最接近“实时数据驱动”的模块。注意：外部页面结构和接口可能变化，后续需要更强的源监控、失败告警、数据源版本管理和合法合规确认。

### 8.3 量化决策与库存批次

`server/platformData.ts` 提供平台基础数据和库存决策公式：

- 链路指标、业务卡片、部位价格、基准报价、库存批次、租户和角色。
- `calculateDecision()` 计算 1/2/3 个月持有方案。
- 公式核心：未来售价减去当前成本和持有成本，结合季节、供给、期货映射和风险分。
- 风险分来自库龄、价格波动、库存集中度和持有期限。

这部分支撑 `/quant` 页面和 AI 工作台中的批次策略。

### 8.4 AI 决策工作台

`server/aiDecision.ts` 是 AI 决策页的主要服务模块，包含：

- `buildAiForecast()`：生成 1-8 个月预测曲线、实际历史、保本线、均价和关键摘要。
- `buildWhatIfSimulation()`：基于目标价、产能调整、需求调整生成 1-3 个月资源模拟。
- `buildAgentDecisionDraft()`：总部、业务、现场三层 Agent 规则兜底建议。
- `buildAlertBoard()`：动态红黄绿预警、根因、预计损失、责任人和建议动作。
- `buildDispatchBoard()`：工单、角色反馈、升级条件和 JSON payload。
- `buildDispatchExecutionSummary()`：结合持久化回执计算执行闭环状态。
- `buildAiDecisionWorkspace()`：聚合预测、模拟、Agent 草稿、预警、派单和历史。

该模块是“战房工具化”的核心：它把数据分析结果转为执行对象，而不是只生成展示图表。

### 8.5 时间套利

`server/timeArbitrage.ts` 实现冻品收储时间套利：

- 输入：当前毛猪价、月持有成本、社会养殖成本、收储吨数、开始月份、收储时长和产能参数。
- 输出：持有成本曲线、未来价格曲线、社会成本线、利润空间、CoC 公允价、风险调整年化收益、最佳出货月、套利窗口和产能计划。
- 包含养殖、屠宰、分割、速冻、仓储、深加工、销售等产能阶段。
- 包含统一风险评分、资金占用、压力损失和约束惩罚。

适用场景：回答“现在低价收储，持有几个月、储多少、何时释放最划算”。

### 8.6 空间套利

`server/spatialArbitrage.ts` 实现产销区域差和真实物流调度：

- 内置全国省份节点，区分产地和销地。
- 计算地理距离、运输成本、部位溢价、价差和单位净利。
- 支持小型、中型、大型冷链车型和自动选型。
- 使用贪心调度分配产地供给、销地需求和目标发运量。
- 结合时间套利判断是否开启冻储路线。
- 输出路线、调度计划、车型结构、产能利用、鲜销/冻储/深加工分配和策略报告。

适用场景：回答“哪里低价买、哪里高价卖、发多少、用什么车、是否转冻储或深加工”。

### 8.7 金融套利

`server/financialArbitrage.ts` 实现期现套利和套保模拟：

- 输入：现货价、期货价、未来现货价、未来期货价、现货敞口、套保比例、保证金率、合约吨数等。
- 计算：当前基差、未来基差、基差收敛、现货 PnL、期货 PnL、基差 PnL、仓储成本、融资成本、交易成本、滑点、交割成本、保证金、资金占用。
- 输出：净损益、风险调整目标、年化收益、套保有效性、追保风险、最差损失、敏感性和压力测试。

适用场景：回答“现货库存是否需要卖出套保，套多少，资金压力和极端行情风险如何”。

### 8.8 深度套利

`server/deepArbitrage.ts` 覆盖 14 类深度机会：

1. 产业链跨品种传导套利。
2. 养殖端繁育结构套利。
3. 全价值零废弃套利。
4. 渠道场景流量套利。
5. 产能错配协同套利。
6. 供应链现金流套利。
7. 政策红利精准套利。
8. 品质标准品牌套利。
9. 信息差量化套利。
10. 逆向周期危机套利。
11. 跨境内外盘联动套利。
12. 合规优化隐性套利。
13. 轻资产联营套利。
14. 绿色循环生态套利。

该模块与现有 `猪肉全产业链新增 14 类深度套利.docx` 高度一致，是从战略机会到可计算指标的初步编码。

### 8.9 全局最优化调度

`server/globalOptimization.ts` 和 `shared/globalOptimization.ts` 定义并求解全链排产调度：

- 输入：出栏计划、出品率、屠宰产能、分割/速冻/仓储产能、成本、猪订单、部位订单、深加工需求、运输成本。
- 输出：利润表、毛猪销售表、销售表、分割表、生产表、库存表、运输表和汇总指标。
- 逻辑：构建出品率树、按省份和工厂分配屠宰、生成部位可用量、按利润优先满足订单和深加工需求、分配成本并生成 AI 决策。
- 支持调参：出栏量、均重、猪价、屠宰产能、分割产能、速冻产能、仓储成本、运输成本、部位售价。
- 支持策略对比和 AI 自然语言调参。

这是当前最接近“全局资源配置”的模块，但算法本质仍偏启发式/贪心，不是完整 MILP 求解器。

### 8.10 创投与正大生态图谱

`shared/cpVenture.ts` 和 `server/cpVentureData.ts` 建模正大集团及相关生态公司：

- 领域：农牧食品、零售分销、通信媒体、数字、电商、地产、医药、金融、战略投资等。
- 阶段：集团母体、核心控股、平台生态、战略参股、生态关联。
- 节点包含业务、协同、地理、证据和来源 URL。
- 可持久化到数据库，也可 fallback 到静态 seed。

这部分与猪事业主线不是同一业务闭环，但有助于展示正大集团横向生态、资本协同和产业外延。

## 9. 鉴权、安全与通知

### 9.1 鉴权

`server/_core/sdk.ts` 通过 OAuth 服务和 JWT session cookie 认证用户：

- Cookie 名称：`app_session_id`。
- JWT 使用 `JWT_SECRET` 作为 HMAC secret。
- session payload 包含 `openId`、`appId`、`name`。
- 若用户不存在，会通过 OAuth JWT 同步用户信息并 upsert。
- `OWNER_OPEN_ID` 可以自动授予 admin 角色。

风险点：

- 生产必须强制配置强随机 `JWT_SECRET`。
- Cookie 策略需要根据 HTTPS、SameSite、domain 做生产加固。
- 当前平台大多数核心接口只要求登录，细粒度 RBAC 还不充分。

### 9.2 通知

`server/escalationNotifier.ts` 支持三类升级通知：

- 企业微信 webhook。
- SMS API。
- owner 通知。

未配置外部密钥时会记录 `skipped`，不会阻断业务流程。这种降级策略适合演示和测试，但生产需要明确“通知失败是否阻断高风险策略”的治理规则。

## 10. 测试与验证现状

当前测试覆盖较广：

- `aiDecision.test.ts`：预测、What-If、多 Agent、预警和 workspace 聚合。
- `auth.logout.test.ts`：登出清 cookie。
- `cpVentureGraph.test.ts`：创投图谱关键关系。
- `dispatch.workflow.test.ts`：派单回执、签收和升级通知。
- `marketData.test.ts`：行情解析、快照构建和动态决策。
- `optimizationScheduling2.test.ts`：全局优化输出和 AI 决策结构。
- `platform.decision.test.ts`：平台决策、审计和工作台。
- `porkIndustryModel.test.ts`：23 部位、成本、库龄、CoC、项目蓝图。
- `porkMap.test.ts`：地图节点、仓储和机会排序。
- `spatialArbitrage.test.ts`：真实物流调度、车型和约束。
- `timeArbitrage.test.ts`：套利曲线、公式、月份和 AI draft。
- 前端测试：导航注册、资产地图数据、AI 移动端角色、图表 viewport。

测试优势：

- 重要纯算法和 tRPC caller 流程已有覆盖。
- 派单闭环和通知降级路径有测试。
- 文档定义的 23 部位有锁定测试。

测试不足：

- 缺少真实浏览器端到端测试自动化。
- 缺少数据库迁移兼容性测试。
- 外部行情源失败、限流、结构变化和数据异常的长期监控不足。
- 缺少性能基准测试，例如大规模路线枚举、行情刷新、全局优化大样本。

## 11. 现有文档资产分析

`docs/` 中已有 6 份 Word 文档：

1. `7629913897026145221_record_audio.docx`：会议录音文字记录，包含业务讨论、算法认知、时间/空间套利优先级、数据和人才需求。
2. `猪事业全产业链量化套利与 AI 决策系统-技术实现全方案.docx`：工业级技术架构方案，提出 6 层架构、实时决策、弹性扩容、闭环迭代、安全合规。
3. `猪事业全产业链量化系统与 AI 决策系统搭建方案.docx`：业务搭建方案，强调短中长期目标、五层架构、四大套利和数据底座。
4. `猪全产业链 23 部位一体化量化套利 & AI 决策系统 - 数据需求文档.docx`：8 大模块、42 张表、全字段、实时/离线数据要求。
5. `猪全产业链 23 部位一体化量化套利.docx`：7 大模块、126 个指标，覆盖成本、时间、空间、实体、调度、AI、风控和 ROI。
6. `猪肉全产业链新增 14 类深度套利.docx`：深度套利机会扩展。

根目录还有：

- `ai_decision_system_plan.md`：AI 决策页面扩展结构设计。
- `DESIGN_SPEC.md`：前端设计方案。
- `verification_notes.md`：迁移、页面、数据库、鉴权、AI、派单和移动端验证记录。
- `todo.md`：迁移和综合升级历史。

结论：业务方案文档非常丰富，但分散在 Word、根目录 Markdown 和代码中。本报告和配套项目方案的价值，是把当前代码实现与业务蓝图统一到一个可持续维护的工程文档体系中。

## 12. 当前成熟度判断

| 维度 | 当前成熟度 | 说明 |
| --- | --- | --- |
| 前端可用性 | 中高 | 页面完整，交互丰富，适合演示和业务讨论 |
| 后端 API | 中高 | tRPC 类型安全，核心业务接口完整 |
| 数据持久化 | 中 | 派单、审计、行情快照等已落库，更多业务表未打通 |
| 算法深度 | 中 | 规则、启发式、财务公式和风险评分已覆盖，尚非工业级优化求解 |
| AI 能力 | 中 | 支持结构化 LLM 输出和兜底，但缺少评测、提示版本和可解释治理 |
| 生产部署 | 中低 | 构建脚本完整，但缺少标准化 CI/CD、监控、灰度和灾备 |
| 权限治理 | 中低 | 已有登录和 admin 概念，业务级权限和审批流需强化 |
| 数据治理 | 中低 | 有目标 schema，但真实数据源接入、质量、血缘和口径管理不足 |
| 测试 | 中 | Vitest 覆盖不少核心逻辑，缺少 E2E 和性能测试 |
| 文档 | 中高 | 业务文档丰富，工程文档需要系统化 |

## 13. 主要风险与改进方向

### 13.1 工程风险

- 业务页面过大，后续维护成本会升高。
- `server/routers.ts` 集中 1300 多行，路由、schema、LLM 调用和业务编排耦合较重。
- 算法服务和数据服务边界还可以更清晰。
- 当前工作区存在未提交代码改动，后续协作需要明确变更归属。

### 13.2 数据风险

- 外部行情源存在不可控变化。
- 当前很多业务数据是 seed 或模拟值，真实决策前必须标识数据可信度。
- 价格单位、缩放、吨/kg、头/kg 等口径需要统一元数据管理。
- 大量目标表缺少采集链路和质量校验。

### 13.3 算法风险

- 空间套利和全局优化采用启发式/贪心，可能不是全局最优。
- 深度套利多数仍为规则检测，缺少历史回测。
- 金融套利涉及真实风险，生产使用前需要合规审查和风控边界。
- AI 输出必须保持“建议”属性，高风险动作需要人工确认。

### 13.4 组织与落地风险

- 真正落地依赖财务、战房、IT、工厂、仓储、物流、销售多方数据。
- 自动派单需要现场角色真实使用，否则闭环会停留在系统内。
- 指标和公式需要业务负责人签字确认，避免模型与经营口径不一致。

## 14. 总结

CP-AI Brain 当前已经完成了从“概念方案”到“可运行决策平台”的关键跨越。代码库中同时存在业务蓝图、算法原型、前端工作台、数据持久化和执行闭环，尤其在猪事业部 23 部位经营、行情动态化、AI 决策、派单回执、时间/空间/金融/深度套利和全局调度方面已经形成完整雏形。

下一阶段的核心任务不是继续堆功能，而是把系统从“高保真原型”推进到“可信赖、可审计、可接入真实数据、可规模化运行”的生产级平台。重点应放在数据中台、算法求解器、权限审批、E2E 验证、监控告警、业务签核和模块拆分上。
