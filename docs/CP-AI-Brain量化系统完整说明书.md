# CP-AI Brain 量化系统完整说明书

版本：V1.0  
日期：2026-04-24  
适用对象：项目负责人、业务战房、财务、供应链、工厂、仓储、物流、销售、算法工程师、数据工程师、前后端工程师、审计与风控团队。  
依据范围：当前代码库 `client/`、`server/`、`shared/`、`drizzle/`、`docs/` 下业务 Word/Excel/Markdown 文档，以及现有 Vitest 回归测试。

## 1. 文档目的

本文档用于沉淀 CP-AI Brain 项目的全部量化说明，包括业务口径、数据输入、核心公式、模型输出、阈值规则、风险评分、执行闭环和后续工程化要求。它不是展示稿，而是后续开发、业务评审、财务对账、算法迭代和系统验收共同使用的“量化口径手册”。

当前项目的量化目标可以归纳为一句话：

> 以猪全产业链数据为基础，以 23 个分割部位为最小经营单元，用时间、空间、实体、金融、深度产业套利和全局优化模型，在真实产能、库容、订单、资金和风险约束下，求解风险调整后的最优收益，并把策略转化为可执行、可审计、可复盘的工单闭环。

## 2. 系统定位与量化边界

CP-AI Brain 是面向正大猪事业和农牧全产业链的“量化套利 + AI 决策 + 调度执行闭环”平台。当前系统已经覆盖以下量化能力：

1. 23 个猪肉分割部位的价格、出品率、库存、期货映射价、预测价、基差和持有策略。
2. 库存批次 1、2、3 个月持有或出售的量化决策。
3. 时间套利：低价收储、高价释放、持有成本、期货预测价、利润空间、套利窗口、最佳出货月。
4. 空间套利：区域价差、运输成本、车型选择、产能/需求约束、跨区调拨、鲜销/冻储/深加工通道分配。
5. 金融套利：现货、期货、基差、套保比例、保证金、资金成本、仓储成本、交易成本、滑点、压力测试。
6. 深度套利：跨品种传导、繁育结构、零废弃、渠道场景、产能错配、现金流、政策、品牌、信息差、逆周期、跨境、合规、联营、绿色循环等 14 类机会。
7. 全局最优化调度：出栏、屠宰、分割、速冻、仓储、订单、深加工、运输、利润表和综合汇总。
8. AI 决策：预测、What-If、多 Agent、红黄绿预警、根因分析、自动派单、回执和升级。
9. 风险调整：统一风险惩罚、资金惩罚、执行惩罚、约束校验和综合评分。

当前系统仍是“业务原型 + 可运行算法沙盘 + 决策工作台”阶段。所有演示数据、fallback 数据和 Excel 生成数据必须在生产落地前经过财务、业务和数据团队确认。

## 3. 业务背景与核心阈值

项目背景来自会议纪要、建设方案和系统代码：

1. 当前猪价低于社会平均成本和公司成本，直接出售毛猪或白条会造成明显亏损。
2. 历史储备肉项目证明时间套利可行，但暴露了目标不强制、执行不可控、数据孤岛和产能瓶颈问题。
3. 战房需要从参观型大屏升级为工具型 AI 决策系统。

核心业务阈值如下：

| 指标 | 业务口径 | 当前文档/代码口径 |
| --- | --- | --- |
| 社会平均成本/启动阈值 | 毛猪价低于社会平均成本时启动收储/储备评估 | 文档多处使用 13.8 元/kg；时间套利代码默认 `socialBreakevenCost = 12.0`，需生产前统一 |
| 公司成本 | 公司内部养殖全成本 | 会议资料提到 14.5 元/kg |
| 当前低价窗口示例 | 当前毛猪价格低于成本 | 方案文档示例 8.6 元/kg，时间套利测试示例 9.0 元/kg |
| 储存成本 | 冻品仓储、资金、损耗等持有费用 | 方案文档：225 元/吨/月，约 0.225 元/kg/月；代码默认时间套利持有成本 0.2 元/kg/月 |
| 出货阈值 | 冻品售价达到可覆盖未来毛猪成本和持有成本 | 文档示例冻品售价 >= 10 元/kg，需结合部位口径细化 |
| 库龄预警 | FEFO 和风险管理 | 90 天以上预警，120 天为硬约束目标；代码折价分段见第 7 节 |
| 数据刷新 | 决策系统响应 | 文档目标：核心数据 <= 1 分钟刷新，决策响应 <= 5 分钟 |

重要说明：`13.8`、`14.5`、`12.0`、`0.2`、`225` 等当前存在“业务方案口径”和“代码默认口径”的差异。后续生产使用时必须建立统一参数表，禁止在代码中长期硬编码。

## 4. 最小经营单元：23 个分割部位

系统以 23 个部位作为最小经营单元。代码中由 `server/porkIndustryModel.ts` 的 `PORK_PARTS` 锁定，测试已验证数量和名称。

| 序号 | 部位 | 代码 | 分类 | 出品率 | 冻储优先级 | 深加工优先级 | 渠道优先级 |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: |
| 1 | 五花 | `pork_belly` | A | 0.080 | 95 | 72 | 90 |
| 2 | 大排 | `big_chop` | A | 0.055 | 88 | 70 | 86 |
| 3 | 小排 | `small_chop` | A | 0.038 | 92 | 68 | 88 |
| 4 | 前腿肉 | `shoulder` | A | 0.075 | 78 | 86 | 76 |
| 5 | 后腿肉 | `ham` | A | 0.090 | 76 | 88 | 75 |
| 6 | 里脊 | `loin` | A | 0.018 | 84 | 80 | 92 |
| 7 | 通脊 | `striploin` | A | 0.026 | 82 | 78 | 86 |
| 8 | 前排 | `front_rib` | A | 0.032 | 84 | 74 | 84 |
| 9 | 筒骨 | `tube_bone` | B | 0.036 | 62 | 76 | 65 |
| 10 | 肋排 | `rib` | A | 0.030 | 93 | 70 | 91 |
| 11 | 梅肉 | `collar` | A | 0.028 | 86 | 82 | 88 |
| 12 | 臀尖 | `rump_tip` | B | 0.040 | 70 | 82 | 70 |
| 13 | 中方 | `middle_cut` | B | 0.052 | 74 | 80 | 72 |
| 14 | 带皮五花 | `skin_on_belly` | A | 0.045 | 90 | 74 | 89 |
| 15 | 去皮五花 | `skinless_belly` | A | 0.040 | 91 | 76 | 90 |
| 16 | 排骨段 | `rib_segment` | A | 0.035 | 90 | 72 | 88 |
| 17 | 腿肉丁 | `diced_leg` | B | 0.045 | 68 | 90 | 72 |
| 18 | 里脊丝 | `loin_shreds` | B | 0.018 | 72 | 88 | 82 |
| 19 | 五花肉块 | `belly_cubes` | B | 0.040 | 78 | 84 | 80 |
| 20 | 大排片 | `big_chop_slices` | B | 0.036 | 72 | 86 | 78 |
| 21 | 小排块 | `small_chop_cubes` | B | 0.030 | 76 | 82 | 77 |
| 22 | 前腿肉丝 | `shoulder_shreds` | B | 0.034 | 66 | 90 | 72 |
| 23 | 后腿肉块 | `ham_cubes` | B | 0.048 | 68 | 88 | 73 |

部位分类建议：

1. A 类：高价值、高渠道优先级、高冻储优先级，适合作为时间套利和渠道溢价核心对象。
2. B 类：更适合深加工、组合销售或走量消化，需要结合订单和产能决定是否入储。
3. C 类：当前代码类型预留，但 23 部位中未实际配置 C 类。

## 5. 数据输入体系

### 5.1 Excel 输入工作簿

当前真实业务输入来自 `docs/输入参数-2026.4.24.xlsx`，已生成到 `shared/excelOptimizationData.ts`。工作簿共有 14 个 sheet：

| Sheet | 行数 | 列数 | 系统映射 |
| --- | ---: | ---: | --- |
| 1.出栏表 | 6074 | 8 | 日度出栏记录、月度 `slaughterSchedule` |
| 2.出品率表 | 99 | 6 | `yieldRates` |
| 3.屠宰能力表 | 25 | 5 | `slaughterCapacity`、工厂主数据 |
| 4.分割能力表 | 25 | 5 | `splitCapacity`、鲜销/冷冻能力 |
| 5.成本表 | 2233 | 10 | `splitCosts`、部位成本 |
| 6.仓库表 | 25 | 9 | `warehouses` |
| 7.部位订单表 | 704 | 10 | `partOrders` |
| 8.深加工需求表 | 128 | 9 | `deepProcessDemand` |
| 9.运输费用表 | 618 | 5 | `transportCosts` |
| 辅助表→ | 1 | 1 | 空标记页，不进入模型 |
| 系数辅助表 | 54 | 10 | 部位产量占比、产值系数、储备标识 |
| 价格系数辅助表 | 53 | 5 | 冻价系数、鲜价系数 |
| 标准费用表-2024年&2025年优化 | 39 | 15 | 标准屠宰费用、分割费用、系统/自建/OEM 口径 |
| 根据产能每天需要鲜销部分 | 845 | 12 | 鲜销/储备拆分公式来源 |

已进入系统的核心行数：

| 数据集 | 行数 |
| --- | ---: |
| 日度出栏 `excelDailySlaughterRows` | 6072 |
| 月度出栏 `slaughterSchedule` | 216 |
| 出品率 `yieldRates` | 97 |
| 工厂 `excelFactories` | 35 |
| 屠宰能力 `slaughterCapacity` | 207 |
| 分割/冷冻/仓储能力 `splitCapacity` | 7578 |
| 成本 `splitCosts`/`excelCostRows` | 2231 |
| 仓库 `warehouses` | 207 |
| 部位订单 `partOrders` | 702 |
| 深加工需求 `deepProcessDemand` | 126 |
| 原始运输费用 `excelTransportFeeRows` | 616 |
| 模型运输成本 `transportCosts` | 20 |
| 鲜销能力辅助 `excelFreshCapacityRows` | 842 |
| 部位系数 `excelPartCoefficients` | 50 |
| 价格系数 `excelPriceCoefficients` | 50 |
| 标准费用 `excelStandardFees` | 35 |

### 5.2 Excel 关键公式口径

Excel 中已有若干业务公式，应固化为后端规则：

1. 成本表屠宰成本：

```text
屠宰成本(元/kg)
= IFERROR(
    VLOOKUP(工厂ID, 标准费用表, 屠宰费用列)
    × 部位副产/白条调整系数
    × 部位产值系数
    / 部位单头产量,
    0
  )
```

2. 成本系数：

```text
成本系数 = VLOOKUP(分割部位, 系数辅助表, 产值系数列)
```

3. 部位订单价格：

```text
鲜销价格系数 = XLOOKUP(分割部位, 价格系数辅助表, 鲜价格系数)
销售价格 = 鲜销价格系数 × 毛猪价格
```

4. 部位订单量：

```text
订单量 = SUMIFS(每日鲜销量, 工厂ID=当前工厂, 部位=当前部位)
```

5. 产能辅助表产量：

```text
白条产量 = (每日屠宰头数 - 每日分割头数) × 部位出品率 × 毛猪均重
分割部位产量 = 每日屠宰头数 × 部位出品率 × 毛猪均重
鲜销量 = MAX(产量 - 储备量, 0)
```

当前代码已经把 Excel 数据转入模型，但仍有口径缺口：

1. `东营、内蒙古、广东、浙江、海南、福建` 出栏地区缺少可直接匹配的屠宰能力。
2. 部位订单 `客户类别` 为空，系统未伪造客户类别。
3. 深加工需求日期为空，当前映射到 Excel 出栏数据首月。
4. 分割、包装、速冻费用大量为空，当前按 0 保留。
5. 运输费用缺少显式起点省份，当前通过工厂 ID 推导。

## 6. 基础成本与保本模型

### 6.1 部位级全成本

代码函数：`calculatePartFullCost(input)`。

输入字段：

| 字段 | 含义 |
| --- | --- |
| `breedingCostPerKg` | 养殖成本，元/kg |
| `slaughterCostPerKg` | 屠宰成本，元/kg |
| `splitCostPerKg` | 分割成本，元/kg |
| `freezeCostPerKg` | 速冻成本，元/kg |
| `storageCostPerTonDay` | 仓储成本，元/吨/日 |
| `transportCostPerTonKm` | 运输成本，元/吨/km |
| `annualCapitalRate` | 年资金成本率，百分数或小数均可 |
| `stockDays` | 库存天数 |
| `transportDistanceKm` | 运输距离，km |
| `partInventoryValuePerKg` | 部位库存价值，元/kg |
| `partDailyLossRate` | 部位日损耗率 |
| `yieldRate` | 部位出品率 |

公式：

```text
养殖成本分摊 = 养殖成本/kg × 出品率
屠宰成本分摊 = 屠宰成本/kg × 出品率
分割成本 = 分割成本/kg
速冻成本 = 速冻成本/kg
仓储成本 = (仓储成本/吨/日 ÷ 1000) × 库存天数
运输成本 = (运输成本/吨/km ÷ 1000) × 运输距离
资金成本 = 部位库存价值/kg × (年资金成本率 ÷ 365) × 库存天数
损耗成本 = 部位库存价值/kg × 日损耗率 × 库存天数
部位全成本/kg = 上述成本合计
```

测试示例：

```text
storageCostPerTonDay = 7.5
stockDays = 30
仓储成本 = 7.5 / 1000 × 30 = 0.225 元/kg

transportCostPerTonKm = 0.85
transportDistanceKm = 180
运输成本 = 0.85 / 1000 × 180 = 0.153 元/kg
```

### 6.2 库龄折价系数

代码函数：`calculateAgeDepreciationCoefficient(ageDays)`。

| 库龄 | 折价系数 |
| ---: | ---: |
| <= 30 天 | 1.00 |
| 31-60 天 | 0.98 |
| 61-90 天 | 0.95 |
| 91-120 天 | 0.90 |
| > 120 天 | 0.80 |

业务要求：库存执行 FEFO，90 天以上预警，120 天以上必须进入处置或审批流程。

### 6.3 持有成本公允价 CoC

代码函数：`calculateCostOfCarryFairPrice(input)`。

公式：

```text
日资金成本率 = 年资金成本率 / 365
CoC 公允价 = 现货价 × exp((日资金成本率 + 日仓储率 + 日损耗率) × 持有天数) - 便利收益
```

输入说明：

| 字段 | 含义 |
| --- | --- |
| `spotPrice` | 当前现货价，元/kg |
| `annualCapitalRate` | 年资金成本率 |
| `dailyStorageRate` | 日仓储率 |
| `dailyLossRate` | 日损耗率 |
| `holdingDays` | 持有天数 |
| `convenienceYieldPerKg` | 便利收益，元/kg |

### 6.4 风险调整持有收益

代码函数：`calculateRiskAdjustedHoldingReturn(input)`。

公式：

```text
单位利润 = 预期未来价 - 保本价
总利润 = 单位利润 × 库存 kg
年化收益率 = 单位利润 ÷ 库存成本价 ÷ (持有天数 / 365) × 100
Sharpe = (年化收益率 - 无风险年利率) ÷ 年化波动率
```

## 7. 库存批次量化决策

代码函数：`calculateDecision(batch, holdMonths)`。

适用场景：`/quant` 页面和 AI 预测页面，对库存批次输出 1、2、3 个月持有或出售建议。

核心公式：

```text
未来持有成本 = (仓储成本/月 + 资金成本/月 + 损耗成本/月) × 持有月数
保本价 = 当前单位成本 + 未来持有成本
预期售价 =
  当前现货价
  + (期货映射价 - 当前现货价) × 0.62
  + 季节性修正
  + 供给修正
  + 持有月数 × 0.28
净收益/kg = 预期售价 - 保本价
决策阈值 = 0.2 元/kg
若 净收益/kg > 0.2，则建议“持有”；否则建议“出售”
```

风险评分：

```text
库龄风险 = min(40, 库龄天数 × 0.62)
价格风险 = min(25, abs(期货映射价 - 当前现货价) × 6.2)
集中度风险 = min(20, 库存集中度 × 0.22)
期限风险 = 持有月数 × 5
风险分 = 库龄风险 + 价格风险 + 集中度风险 + 期限风险
```

风险等级：

| 风险分 | 等级 |
| ---: | --- |
| >= 70 | 高 |
| >= 40 且 < 70 | 中 |
| < 40 | 低 |

高风险动作必须进入审批和审计，执行者不能修改公式和阈值。

## 8. 时间套利模型

代码模块：`server/timeArbitrage.ts`。

### 8.1 输入参数

```text
calculateArbitrage(
  spotPrice,
  holdingCostPerMonth = 0.2,
  socialBreakevenCost = 12.0,
  storageTons = 1000,
  startMonth = 4,
  storageDurationMonths = 6,
  optimization?
)
```

| 参数 | 含义 | 单位 |
| --- | --- | --- |
| `spotPrice` | 当前毛猪价/现货价 | 元/kg |
| `holdingCostPerMonth` | 月持有成本 | 元/kg/月 |
| `socialBreakevenCost` | 社会养殖成本/保本线 | 元/kg |
| `storageTons` | 收储量 | 吨 |
| `startMonth` | 起始月份 | 1-12 |
| `storageDurationMonths` | 持有时长，代码限制 1-10 | 月 |
| `optimization` | 养殖、屠宰、分割、速冻、仓储、深加工、销售产能与成本 | 多单位 |

### 8.2 期货预测曲线

代码采用分段锚点曲线，从现货价向社会成本收敛：

```text
gap = socialBreakevenCost - spotPrice

offset 0: spot
offset 1: spot + 0.10 × gap
offset 2: spot + 0.23 × gap
offset 3: spot + 0.43 × gap
offset 4: spot + 0.67 × gap
offset 5: spot + 0.90 × gap
offset 6: socialBreakevenCost
offset 7: socialBreakevenCost + 0.20
offset 8: socialBreakevenCost + 0.40
offset 9: socialBreakevenCost + 0.60
offset 10: socialBreakevenCost + 0.80
offset 11: socialBreakevenCost + 1.00
```

历史三个月逆推：

```text
offset -3: spot × 0.92
offset -2: spot × 0.94
offset -1: spot × 0.97
```

### 8.3 核心套利公式

```text
持有成本(m) = spotPrice + holdingCostPerMonth × i
未来价(m) = futuresPriceAtOffset(spotPrice, socialBreakevenCost, i)
价差(m) = 未来价(m) - 持有成本(m)
单月总利润(万元) = 价差(m) × storageTons × 1000 ÷ 10000
收储信号 = 价差(m) > 0 且 持有成本(m) < socialBreakevenCost
最佳出货月 = 价差最大月
套利窗口 = 连续满足收储信号的月份区间
保本点预计月 = 首个未来价 >= socialBreakevenCost 的月份
```

### 8.4 产能优化计划

默认产能和成本：

| 环节 | 默认实际产能 | 目标产能 | 单位 | 默认单位成本 |
| --- | ---: | ---: | --- | ---: |
| breeding | 40000 | 40000 | 头/天 | 0.18 |
| slaughter | 22000 | 40000 | 头/天 | 0.42 |
| cutting | 9000 | 40000 | 头/天 | 0.33 |
| freezing | 520 | 760 | 吨/天 | 86 |
| storage | max(storageTons × 1.35, 1200) | max(月库容, 收储量) | 吨/月 | 42 |
| deepProcessing | 210 | 320 | 吨/天 | 120 |
| sales | max(storageTons / 6, 180) | max(日销能力, storageTons / 4) | 吨/天 | 35 |

产能换算：

```text
月产能 = 日产能 × 30
每头猪冻品产出 = 0.078 吨/头
最大可生产吨数 = min(养殖月产能, 屠宰月产能, 分割月产能) × 0.078
实际可速冻吨数 = min(最大可生产吨数, 速冻月产能)
```

生产与释放逻辑：

1. 找到利润峰值月。
2. 从利润峰值月开始向后释放库存，释放量受销售月产能和深加工月产能约束。
3. 从利润峰值月向前倒推生产，尽量晚生产以降低持仓费用。
4. 逐月计算库存、产能利用率、运营成本和服务水平。

服务水平与吞吐：

```text
服务水平 = 已释放吨数 ÷ 目标收储吨数 × 100
吞吐评分 = 已释放吨数 ÷ 目标收储吨数 × 100
平均利用率 = 各月各环节利用率平均值
瓶颈环节 = 存在任一月份利用率 >= 92% 的环节
```

### 8.5 时间套利风险调整

```text
融资成本 = spotPrice × storageTons × 1000 × 4.2% × (持有月数 × 30 / 365)
展期/滚动成本 = storageTons × 18 × max(0, 持有月数 - 1)
资金占用成本 = storageTons × spotPrice × 1000 × 0.006 × 持有月数
账面毛利 = 最大总利润(万元) × 10000
压力损失 = max(0, 账面毛利 × 0.18 + 融资成本 × 0.4 + 资金占用成本 × 0.35)
风险调整后净利 =
  账面毛利
  - 融资成本
  - 展期/滚动成本
  - 资金占用成本
  - 风险惩罚
  - 资金惩罚
  - 执行惩罚
年化收益率 =
  风险调整后净利 ÷ (spotPrice × storageTons × 1000)
  × (365 ÷ (持有月数 × 30)) × 100
单位资金收益率 = 风险调整后净利 ÷ 初始库存资金 × 100
持有覆盖倍数 = 账面毛利 ÷ (融资成本 + 资金占用成本 + 展期成本)
```

## 9. 空间套利模型

代码模块：`server/spatialArbitrage.ts`。

### 9.1 目标

空间套利用于识别产地低价、销地高价、且区域价差能够覆盖冷链运费、损耗、资金和执行风险的跨区调拨机会。

### 9.2 区域节点

系统内置全国省份节点，区分产地 `origin` 和销地 `destination`，每个节点含：

```text
id, name, lat, lng, type, basePrice, capacity?, demand?
```

示例：

| 节点 | 类型 | 基准价 | 产能/需求 |
| --- | --- | ---: | ---: |
| 河南 | 产地 | 9.7 | 9000 |
| 山东 | 产地 | 10.0 | 8000 |
| 四川 | 产地 | 9.2 | 7000 |
| 广东 | 销地 | 14.1 | 3600 |
| 上海 | 销地 | 13.8 | 2800 |
| 海南 | 销地 | 14.5 | 900 |

### 9.3 距离与运费

距离使用简化球面距离：

```text
p = π / 180
a = 0.5 - cos((lat2-lat1)×p)/2
    + cos(lat1×p)×cos(lat2×p)×(1 - cos((lon2-lon1)×p))/2
球面距离 = 12742 × asin(sqrt(a))
调度距离 = round(球面距离 × 1.3)
```

车型：

| 车型 | 载重 | 成本 |
| --- | ---: | ---: |
| 小型冷链 | 5 吨 | 1.8 元/km/吨 |
| 中型冷链 | 15 吨 | 1.4 元/km/吨 |
| 大型干线 | 25 吨 | 1.1 元/km/吨 |

自动选车：

```text
remainingTon >= 22: 大型干线
remainingTon >= 10: 中型冷链
其他: 小型冷链
```

单车运费：

```text
车次运费 = 距离km × 车型成本(元/km/吨) × 装载吨数
单位运费 = 总运费 ÷ (发运吨数 × 1000)
```

### 9.4 路线筛选

部位溢价：

```text
premiumRatio = 部位现货价 / 23.4
产地部位价 = 产地基准价 × premiumRatio
销地部位价 = 销地基准价 × premiumRatio
```

候选路线：

```text
单位运费 = distanceKm × transportCostPerKmPerTon ÷ 1000
单位净利 = 销地价 - 产地价 - 单位运费
批次利润(万元) = 单位净利 × 1000 × batchSizeTon ÷ 10000
若 单位净利 >= minProfitThreshold，则进入候选池
```

决策标签：

| 单位净利 | 标签 |
| ---: | --- |
| > 2.5 元/kg | 强烈推荐 |
| > 1.5 元/kg | 建议开通 |
| 其他正收益 | 备选池 |

### 9.5 贪心调度

调度步骤：

1. 枚举所有产地-销地路线。
2. 按单位净利降序排序。
3. 每条路线发运量：

```text
ship = min(产地剩余产能, 销地剩余需求, 剩余目标发运量)
```

4. 根据发运量拆分车型和车次。
5. 计算鲜销、冻储、深加工三个收益通道。
6. 仅保留单位净利仍为正且实际分配量大于 0 的调度路线。

### 9.6 鲜销、冻储、深加工通道

```text
区域价差 = 销地价 - 产地价
鲜销利润/kg = 区域价差 - 实际单位运费
时间套利最大利润/kg = timeArbitrage.maxProfit
冻储处理成本/kg = 0.18 + 实际单位运费 × 0.55
冻储利润/kg = 时间套利最大利润/kg - 冻储处理成本/kg
深加工利润/kg = 冻储利润/kg + 0.42
```

通道分配：

```text
按利润 × 策略偏置排序
在各通道剩余容量内依次分配
通道加权利润 = Σ(分配吨数 × 1000 × 通道利润/kg)
最终单位净利 = 通道加权利润 ÷ (已分配吨数 × 1000)
总净利(万元) = 通道加权利润 ÷ 10000
```

策略偏置：

| 策略 | 鲜销 | 冻储 | 深加工 |
| --- | ---: | ---: | ---: |
| `fresh_first` | 1.20 | 0.88 | 0.95 |
| `storage_first` | 0.90 | 1.25 | 1.05 |
| `deep_processing` | 0.90 | 1.05 | 1.25 |
| `balanced` | 1.00 | 1.04 | 1.02 |

### 9.7 空间套利汇总

```text
总发运吨数 = Σ路线发运吨数
总运费 = Σ路线运费
总净利(万元) = Σ路线净利(万元)
平均运费/kg = 总运费 ÷ (总发运吨数 × 1000)
平均净利/kg = 总净利 × 10000 ÷ (总发运吨数 × 1000)
平均区域基差 = avg((销地基准价 - 社会成本) - (产地基准价 - 社会成本))
```

空间套利风险调整：

```text
压力损失 = max(0, 总净利元 × 0.18 + 总运费 × 0.12)
区域基差 PnL = Σ(时间套利利润/kg × 入储/深加工吨数 × 1000)
风险调整目标 = 总净利元 - 风险惩罚 - 资金惩罚 - 执行惩罚
资本占用 = 总运费 + 总发运吨数 × socialBreakevenCost × 1000
资本收益率 = 总净利元 ÷ 资本占用 × 100
```

### 9.8 产业链约束

代码内置产业链关键约束：

| 环节 | 目标 | 当前 | 说明 |
| --- | ---: | ---: | --- |
| 肥猪出栏 | 40000 头/天 | 40000 头/天 | 毛猪调配 |
| 屠宰 | 40000 头/天 | 20000 头/天 | 寻找屠宰分割速冻一体产能 |
| 分割 | 40000 头/天 | 8000 头/天 | 补充分割小刀手 |
| 速冻 | 78kg/头 × 40000 = 3120 吨/天 | 400 吨/天 | 匹配一体化节点 |
| 仓储 | 78kg/头 × 40000 × 30 × 4 / 10000 = 37440 吨 | 5000 吨 | 就近标准外租库 |

测试已锁定：屠宰目标 40000，当前 20000；仓储目标 37440，当前至少 5000。

## 10. 金融套利与套保模型

代码模块：`server/financialArbitrage.ts`。

### 10.1 输入参数

| 参数 | 含义 |
| --- | --- |
| `spotPrice` | 当前现货价 |
| `futuresPrice` | 当前期货价 |
| `expectedFutureSpotPrice` | 预期未来现货价 |
| `expectedFutureFuturesPrice` | 预期未来期货价 |
| `physicalExposureTons` | 现货敞口吨数 |
| `hedgeRatio` | 套保比例 |
| `marginRate` | 保证金比例 |
| `contractSize` | 合约吨数 |
| `holdingDays` | 持有天数，默认 90 |
| `storageCostPerTonDay` | 仓储成本，默认 1.1 元/吨/日 |
| `financingRatePct` | 融资年利率，默认 4.2% |
| `transactionCostPerTon` | 交易成本，默认 18 元/吨 |
| `slippagePerKg` | 滑点，默认 0.03 元/kg |
| `deliveryCostPerTon` | 交割成本，默认 35 元/吨 |
| `expectedBasisConvergence` | 预期基差收敛 |
| `maxCapital` | 最大资本约束 |
| `maxMarginUsage` | 最大保证金约束 |

### 10.2 核心公式

```text
当前基差 = spotPrice - futuresPrice
未来基差 = expectedFutureSpotPrice - expectedFutureFuturesPrice
基差变化 = 未来基差 - 当前基差

现货损益 = (expectedFutureSpotPrice - spotPrice) × physicalExposureTons × 1000
套保吨数 = physicalExposureTons × hedgeRatio
合约数量 = ceil(套保吨数 / contractSize)
实际套保吨数 = 合约数量 × contractSize
期货损益 = (futuresPrice - expectedFutureFuturesPrice) × 实际套保吨数 × 1000
基差损益 = (expectedBasisConvergence - 基差变化) × 实际套保吨数 × 1000

仓储成本 = storageCostPerTonDay × holdingDays × physicalExposureTons
融资成本 = spotPrice × physicalExposureTons × 1000 × financingRatePct × holdingDays / 365
交易成本 = transactionCostPerTon × 实际套保吨数
滑点成本 = slippagePerKg × 实际套保吨数 × 1000
交割成本 = deliveryCostPerTon × 实际套保吨数
持有成本 = 仓储成本 + 融资成本

毛损益 = 现货损益 + 期货损益 + 基差损益
净损益 = 毛损益 - 持有成本 - 交易成本 - 滑点成本 - 交割成本
保证金 = futuresPrice × 1000 × 实际套保吨数 × marginRate
峰值资本占用 = spotPrice × physicalExposureTons × 1000 + 保证金 + 持有成本
```

有效价格和收益：

```text
有效价格 =
  expectedFutureSpotPrice
  + (期货损益 + 基差损益 - 持有成本) ÷ (physicalExposureTons × 1000)

资本收益率 = 净损益 ÷ 峰值资本占用 × 100
保证金收益率 = 净损益 ÷ 保证金 × 100
年化收益率 = 资本收益率 × 365 ÷ holdingDays

保本基差 =
  当前基差
  + (持有成本 + 交易成本 + 滑点成本 + 交割成本)
    ÷ (实际套保吨数 × 1000)
```

### 10.3 风险指标

```text
波动风险 = abs(毛损益) × (1 - hedgeRatio) × 0.08
基差风险 = abs(基差变化) × 实际套保吨数 × 280
价差风险 = abs(expectedFutureFuturesPrice - futuresPrice) × 实际套保吨数 × 110
追保风险 = 保证金 × max(0, 0.18 - hedgeRatio × 0.09) ÷ 峰值资本占用
最大回撤代理 = abs(现货损益) × 0.16 + abs(期货损益) × 0.05
套保有效性 = 1 - abs(现货损益 + 期货损益) ÷ max(abs(现货损益), 1)
压力损失 =
  abs(现货损益) × 0.22 × (1 - hedgeRatio × 0.7)
  + abs(基差损益) × 0.55
  + 保证金 × 0.06
```

压力测试：

| 场景 | 公式 |
| --- | --- |
| 基差走阔 | 净损益 - 实际套保吨数 × 500 - 保证金 × 0.25 |
| 现货抛售 | 净损益 - abs(现货损益) × 0.10 + abs(期货损益) × 0.04 |
| 资金冲击 | 净损益 - 融资成本 × 0.36 - 仓储成本 × 0.12 |

生产使用限制：金融套利模块必须经过财务和合规审批，接入真实期货账户、持仓、合约日历、保证金、限额和每日盯市后才可用于生产决策。

## 11. 深度产业套利模型

代码模块：`server/deepArbitrage.ts`。

系统识别 14 类深度套利机会。每类输出：

```text
类别、名称、描述、触发条件、触发状态、预期头均收益、风险等级、执行建议、量化指标
```

### 11.1 阈值

| 类型 | 阈值 |
| --- | ---: |
| 跨品种传导偏离 | 8% |
| 繁育结构阈值 | 15% |
| 零废弃最小收益 | 5% |
| 渠道溢价最小值 | 10% |
| 产能错配最小收益 | 3% |
| 现金流折扣 | 3% |
| 政策补贴最小值 | 2% |
| 品牌溢价最小值 | 30% |
| 信息优势最小值 | 5% |
| 逆周期折价 | 40% |
| 跨境价差最小值 | 15% |
| 合规节约最小值 | 2% |
| 联营收益最小值 | 5% |
| 绿色节约最小值 | 3% |

### 11.2 主要公式

1. 产业链跨品种传导套利：

```text
玉米/kg = cornPrice / 1000
豆粕/kg = soybeanMealPrice / 1000
饲料成本 = 玉米/kg × 2.8 + 豆粕/kg × 0.6
养殖成本 = 饲料成本 × 1.15 + 2.5
预期生猪成本 = 养殖成本 × 1.08
偏离度 = abs(liveHogPrice - 预期生猪成本) ÷ 预期生猪成本
头均收益 = 偏离度 × liveHogPrice × 110
触发 = 偏离度 >= 8%
```

2. 繁育结构套利：

```text
PSY = 22
仔猪成本 = 350 元/头
育肥收益 = liveHogPrice × 110 - 仔猪成本 - 280
触发 = sowStock < 4200 或 sowStock > 4800
方向 = sowStock < 4100 ? 补栏高产母猪 : 淘汰低 PSY 母猪
```

3. 零废弃套利：

```text
副产品价值 = 猪血 15 + 猪骨 8 + 猪皮 25 + 肠衣 12
处置成本节约 = -5
净价值 = 副产品价值 + 处置成本节约
触发 = 净价值 > 5% × liveHogPrice
```

4. 渠道场景套利：

```text
餐饮价 = liveHogPrice × 1.45
商超价 = liveHogPrice × 1.28
批发价 = liveHogPrice × 1.15
电商价 = liveHogPrice × 1.22
渠道价差 = 餐饮价 - 批发价
溢价率 = 渠道价差 ÷ 批发价
头均收益 = 渠道价差 × 70
触发 = 溢价率 >= 10%
```

5. 产能错配套利：

```text
利用率偏离 = abs(100 - capacityUtilization)
闲置成本节约 = 利用率偏离 × 0.8
头均收益 = 闲置成本节约 × 0.5
触发 = 利用率偏离 >= 15
```

6. 供应链现金流套利：

```text
上游折扣 = 3%
下游溢价 = 2%
银行利率 = 3.5%
专项利率 = 2.8%
利率节约 = 银行利率 - 专项利率
头均收益 = (上游折扣 + 下游溢价 + 利率节约) × liveHogPrice × 110 × 0.5
```

7. 政策红利套利：

```text
储备补贴 = 0.3 元/kg
养殖补贴 = 50 元/头
保险补贴 = 2% × liveHogPrice × 110
头均总补贴 = 储备补贴 + 养殖补贴 + 保险补贴
触发 = 存在政策信号
```

8. 品质品牌套利：

```text
绿色溢价 = liveHogPrice × 0.35
有机溢价 = liveHogPrice × 0.60
溯源溢价 = liveHogPrice × 0.25
地标溢价 = liveHogPrice × 0.50
最大溢价 = max(上述溢价)
溢价率 = 最大溢价 ÷ liveHogPrice
头均收益 = 最大溢价 × 70
触发 = 溢价率 >= 30%
```

9. 信息差套利：

```text
价格波动率 = std(部位价格) ÷ mean(部位价格)
信息优势价值 = 价格波动率 × liveHogPrice × 80
触发 = 区域价差信号 > 5 或 价格波动率 > 8%
```

10. 逆周期危机套利：

```text
周期阶段 = liveHogPrice < 12 ? 底部 : liveHogPrice < 15 ? 下行 : 上行
资产折价 = 底部 ? 70% : 0
预期资产价值 = liveHogPrice × 110 × (1 + 资产折价)
头均收益 = 预期资产价值 × 15%
触发 = 周期阶段为底部
```

11. 跨境套利：

```text
进口价 = liveHogPrice × 0.82
关税 = 12%
物流成本 = 1.5 元/kg
进口到岸成本 = 进口价 × (1 + 关税) + 物流成本
跨境价差 = 国内价 - 进口到岸成本
头均收益 = max(0, 跨境价差 × 70)
触发 = 跨境价差 > 15% × liveHogPrice
```

12. 合规优化套利：

```text
税务节约 = liveHogPrice × 1.5%
损耗节约 = liveHogPrice × 1.2%
流程节约 = liveHogPrice × 0.8%
总节约 = 税务节约 + 损耗节约 + 流程节约
触发 = 总节约 > 2% × liveHogPrice
```

13. 轻资产联营套利：

```text
加工费 = 80 元/头
联营分成收益 = 120 元/头
自营成本 = 150 元/头
节省 = 自营成本 - 联营分成收益
触发 = 节省 > 5% × liveHogPrice × 110
```

14. 绿色循环套利：

```text
绿电节省 = liveHogPrice × 3%
碳汇收益 = 15 元/头
节水节省 = 8 元/头
绿色总价值 = 绿电节省 + 碳汇收益 + 节水节省
触发 = 绿色总价值 > 3% × liveHogPrice
```

### 11.3 综合套利收益

```text
总预期收益 =
  时间套利 expectedReturn × 1000
  + 空间套利 netProfitPerKg × totalCapacity
  + Σ(active 深度套利头均收益 × 40000) ÷ 10000
```

风险分布默认：

| 风险 | 占比 |
| --- | ---: |
| 市场风险 | 25 |
| 产能风险 | 20 |
| 资金风险 | 15 |
| 执行风险 | 15 |
| 政策风险 | 10 |
| 技术风险 | 15 |

## 12. 全局最优化调度

代码模块：`server/globalOptimization.ts`、`shared/globalOptimization.ts`。

### 12.1 输入表

```text
OptimizationInput = {
  slaughterSchedule,
  yieldRates,
  slaughterCapacity,
  splitCapacity,
  splitCosts,
  warehouses,
  pigOrders,
  partOrders,
  deepProcessDemand,
  transportCosts
}
```

### 12.2 出栏分配到工厂

```text
工厂月产能 key = factoryId_month
省份工厂列表 = 按屠宰能力表建立
对每条省份/月出栏计划：
  remaining = 出栏头数
  按工厂剩余产能降序分配
  allocated = min(remaining, 工厂剩余产能)
  总重量kg += allocated × avgWeightKg
```

### 12.3 出品率树

```text
yieldTree[parentMaterial] = [{ childMaterial, yieldRate, process }]
一级子物料 = 毛猪的直接子物料
二级部位综合出品率 = 一级出品率 × 二级出品率
同一部位多路径时累加
```

### 12.4 部位可用量

```text
理论产出kg = 工厂月总毛猪重量kg × 部位综合出品率
实际可分割kg = min(理论产出kg, 分割能力上限kg)
```

### 12.5 订单和深加工需求分配

对同一 `factoryId_part_month`：

```text
运输成本/kg = costPerKmPerKg × distanceKm
普通订单单位毛利 = 销售价 - 运输成本/kg
深加工需求单位毛利 = 深加工销售价 - 运输成本/kg
需求按单位毛利降序排序
fulfilledQty = min(剩余可用量, 订单量)
收入 = fulfilledQty × salesPrice
运输成本 = fulfilledQty × 运输成本/kg
未销售剩余量优先转入 freezeQty = min(remaining, maxFreezeKg)
```

### 12.6 成本分摊和利润表

工厂月毛猪成本：

```text
月均毛猪价格 =
  Σ(livePigPrice × 出栏头数) ÷ Σ出栏头数
工厂月毛猪总成本 = 工厂月总重量kg × 月均毛猪价格
```

部位成本分摊：

```text
部位权重 = 部位产出重量 ÷ 工厂月全部部位产出重量
部位毛猪成本份额 = 部位权重 × 工厂月毛猪总成本
单位毛猪成本 = 部位毛猪成本份额 ÷ 部位销售kg
```

加工成本：

```text
仓储成本 = salesKg × storageCostRate
屠宰成本 = salesKg × slaughterCostPerKg
分割成本 = salesKg × splitCostPerKg
包装成本 = salesKg × packageCostPerKg
速冻成本 = salesKg × freezeCostPerKg
加工成本 = 屠宰成本 + 分割成本 + 包装成本 + 速冻成本
利润 = 收入 - 毛猪成本 - 仓储成本 - 运输成本 - 加工成本
```

测试已锁定：

```text
abs(row.profit - (row.revenue - row.pigCost - row.storageCost - row.transportCost - row.processingCost)) < 0.02
```

### 12.7 汇总指标

```text
总收入 = Σ收入
总毛猪成本 = Σ毛猪成本
总仓储成本 = Σ仓储成本
总运输成本 = Σ运输成本
总加工成本 = Σ加工成本
总利润 = Σ利润
利润率 = 总利润 ÷ 总收入 × 100
总屠宰头数 = Σ pigSales.salesQty
总销售kg = Σ salesKg
总冻储kg = Σ freezeKg
头均利润 = 总利润 ÷ 总屠宰头数
产能利用率 = 总分配头数 ÷ 总最大屠宰产能 × 100
```

### 12.8 调参模型

可调参数：

| 参数 | 作用 |
| --- | --- |
| `slaughterCountMultiplier` | 调整出栏量 |
| `avgWeightAdjustmentKg` | 调整均重 |
| `livePigPriceAdjustment` | 调整活猪成本 |
| `slaughterCapacityMultiplier` | 调整屠宰产能 |
| `splitCapacityMultiplier` | 调整分割能力 |
| `freezeCapacityMultiplier` | 调整冷冻/仓储能力 |
| `storageCostMultiplier` | 调整仓储成本 |
| `transportCostMultiplier` | 调整运输成本 |
| `partPriceAdjustments` | 调整部位售价 |

调参后会输出 `appliedParameters`，用于记录前后值、单位和展示说明。

敏感性：

```text
利润变化 = 调参后总利润 - 基线总利润
利润率变化 = 调参后利润率 - 基线利润率
产能利用率变化 = 调参后产能利用率 - 基线产能利用率
瓶颈变化 = 调参后瓶颈数量 - 基线瓶颈数量
```

### 12.9 增强计划

增强优化输出还包含：

1. 日屠宰计划：月度头数按天拆解，并估算出品 kg。
2. 仓储计划：计划入库、计划出库、库存期末量、周转率。
3. 省际调拨：起点、终点、部位、计划调拨、在途、已达、成本和时效。
4. 库存批次：入库日期、当前 kg、库龄、剩余保质期、累计仓储成本、FEFO 优先级。
5. 库龄分布：0-7、8-14、15-30、31-60、60+ 天。
6. 期货市场数据：M0-M3 期货价、现货价、基差、持仓、成交量、波动率、趋势、建议。
7. 未来出栏计划：合同/现货头数、锁价头数、置信度。
8. 期货套利信号、季节采购建议、库存时点建议、合约建议和风险调整建议。

## 13. AI 预测、What-If 和执行闭环

代码模块：`server/aiDecision.ts`。

### 13.1 AI 价格预测

```text
月持有成本 = 仓储成本/月 + 资金成本/月 + 损耗成本/月
策略因子 = steady:0.84, balanced:1.00, aggressive:1.18
锚定目标价 = 用户目标价 或 当前现货价 + 月数 × 0.38 + 季节性修正
有效目标价 = 锚定目标价 + 基差调整 × 0.45 + (策略因子 - 1) × 0.9
```

预测曲线第 `horizon` 月：

```text
ratio = horizon ÷ selectedMonth
controlledRatio = min(1.45, ratio × (0.92 + 策略因子 × 0.08))
seasonalDrift = sin((horizon/8)×π) × 0.22 + 基差调整 × 0.04 × horizon
预测价 =
  当前现货价
  + (有效目标价 - 当前现货价) × controlledRatio
  + seasonalDrift
  + (策略因子 - 1) × horizon × 0.08
总成本/kg = 当前单位成本 + 月持有成本 × horizon
平均售价 = (当前现货价 + 预测价) ÷ 2
利润/kg = 预测价 - 总成本/kg
总利润 = 利润/kg × 批次重量kg
```

### 13.2 What-If 资源模拟

```text
baselineProfit = 基线预测总利润
normalizedCapacity = 产能调整% ÷ 100
normalizedDemand = 需求调整% ÷ 100
资源利用率 = 100 + 产能调整 × 0.68 + 需求调整 × 0.32
价格信号 = (目标价 - 14) × 批次重量kg × 0.42
需求信号 = 批次重量kg × normalizedDemand × 0.65
产能信号 = 批次重量kg × normalizedCapacity × 0.18
超载惩罚 = max(0, 资源利用率 - 118) × 320
模拟利润 = baselineProfit + 价格信号 + 需求信号 + 产能信号 - 超载惩罚
预期收入 = 批次重量kg × 目标价 × (1 + normalizedDemand × 0.08)
```

资源估算：

```text
baseHeads = max(900, batch.weightKg ÷ 6.1)
monthFactor = 0.88 + 月份 × 0.12
demandFactor = 1 + normalizedDemand × (0.8 + 月份 × 0.06)
capacityFactor = 1 + normalizedCapacity × (0.7 + 月份 × 0.08)
屠宰头数 = baseHeads × monthFactor × demandFactor × capacityFactor
速冻吨数 = 屠宰头数 × 0.098 ÷ 1000
仓储吨数 = 速冻吨数 × (0.72 + 月份 × 0.11)
托盘数 = 仓储吨数 × 22.5
冷链车次 = max(1, 仓储吨数 ÷ 18)
```

风险等级：

```text
若 增量利润 < -50000 或 资源利用率 > 118，则高风险
若 增量利润 < 0 或 资源利用率 > 108，则中风险
否则低风险
```

### 13.3 红黄绿预警

系统预警包括：

| 预警 | 红色条件 | 黄色条件 |
| --- | --- | --- |
| 利润偏差 | 增量利润 < -20000 | 增量利润 < 10000 |
| 价格目标可达性 | 预测价 - 目标价 < -1.2 | < -0.3 |
| 需求波动 | 需求调整 < -10 | 需求调整 < 0 或 > 20 |
| 产能负荷 | 利用率 > 114 | > 105 |
| 屠宰节奏 | 屠宰计划 > 1900 头 | > 1500 头 |
| 仓储压力 | 峰值仓储 > 0.44 吨 | > 0.34 吨 |
| 冷链时效 | 车次 > 2 | > 1 |
| 执行闭环 | 利润/kg < 0 或利用率高压 | 增量利润 < 5000 |
| 异常积压 | 异常暴露指数 >= 3 | >= 1 |

异常暴露：

```text
异常暴露指数 = round((利润缺口 + 最大车次 × 1200 + 最大仓储吨数 × 2500) ÷ 6000)
```

### 13.4 多 Agent 与派单

三类决策 Agent：

| Agent | 目标 |
| --- | --- |
| 经营 Agent / 事业部利润 Agent | 最大化总部利润和库存周转 |
| 生产编排 Agent / 物流调度 Agent | 拆解为屠宰、速冻、入库和运输计划 |
| 场长运营 Agent / 环控生物安全 Agent | 确保现场执行达标并反馈异常 |

派单角色：

1. 厂长：屠宰、分割、班组、设备、质量标准。
2. 司机：冷链车辆、路线、温控、时效。
3. 仓储管理员：入库、托盘、库位、FEFO、温控。

执行状态：

```text
待确认 -> 已接单 -> 执行中 -> 已完成
异常路径：超时升级
```

执行汇总：

```text
关闭率 = completedCount ÷ totalOrders × 100
阻塞异常 = escalatedCount + 超时/未确认关键节点
```

所有策略确认、派单、回执和升级都应写入审计日志。

## 14. 统一风险惩罚和评分体系

代码模块：`server/arbitrageShared.ts`。

### 14.1 风险配置

默认权重：

| 权重 | 默认值 |
| --- | ---: |
| 总风险惩罚 | 1.00 |
| 资金惩罚 | 1.00 |
| 执行惩罚 | 1.00 |
| 波动风险 | 0.90 |
| 基差风险 | 0.85 |
| 价差风险 | 0.80 |
| 回撤风险 | 0.75 |
| 压力损失 | 1.00 |
| 保证金 | 0.80 |
| 资金占用 | 0.70 |
| 杠杆 | 0.75 |
| 流动性 | 0.65 |

风险偏好：

| 偏好 | 变化 |
| --- | --- |
| conservative | 风险、资金、执行、回撤、压力和保证金权重上调 |
| balanced | 使用默认权重 |
| aggressive | 风险、资金、执行、回撤、压力和保证金权重下调 |

### 14.2 惩罚公式

```text
风险惩罚 =
  波动风险 × 波动权重
  + 基差风险 × 基差权重
  + 价差风险 × 价差权重
  + 最大回撤代理 × 回撤权重
  + 压力损失 × 压力权重

资金惩罚 =
  保证金使用 × 0.0001 × 保证金权重
  + 峰值资本占用 × 0.00005 × 资金占用权重
  + max(0, 杠杆率 - 1) × 100 × 杠杆权重

执行惩罚 =
  流动性风险 × 流动性权重
  + 执行复杂度 × 执行权重
```

约束校验：

```text
violation = max(0, actual - limit)
passed = violation <= 0
penaltyContribution = violation × penaltyWeight
```

### 14.3 综合评分

```text
利润分 =
  clamp01((风险调整目标 + max(净损益, 0) × 0.35) ÷ (abs(净损益) + 500)) × 100

风险分 =
  clamp01(套保/执行有效性 - 风险惩罚 ÷ 600) × 100

资本效率分 =
  clamp01((资本收益率 ÷ 25 + 保证金收益率 ÷ 35) ÷ 2) × 100

执行分 =
  clamp01(1 - 执行惩罚 ÷ 120) × 100

稳健性分 =
  clamp01(1 - 压力损失 ÷ (abs(净损益) + 200)) × 100

综合分 =
  利润分 × 0.28
  + 风险分 × 0.22
  + 资本效率分 × 0.18
  + 执行分 × 0.15
  + 稳健性分 × 0.17
```

## 15. 核心指标体系

`buildCoreMetrics` 当前输出 8 类核心指标。

| 模块 | 指标 | 公式/口径 | 状态规则 |
| --- | --- | --- | --- |
| 基础成本 | 即时保本价 | 当前硬编码 13.8 元/kg | 现货 < 保本价为 critical |
| 基础成本 | 单位日仓储成本 | 225 ÷ 30 | normal |
| 基础成本 | 单位日资金成本 | 0.038 ÷ 365 × liveHogSpot | normal |
| 时间套利 | 期现基差 | futuresPrice - liveHogSpot | abs > 2 为 warning |
| 时间套利 | 持有收益率 | (期货 - 现货 - 225×4/1000) ÷ 现货 × 100 | normal |
| 时间套利 | 平均库龄 | 当前示例 45 天 | >90 critical，>60 warning |
| 空间套利 | 区域价差 | 当前示例 3.5 元/kg | >2 normal |
| 空间套利 | 物流成本占比 | 当前示例 28% | >35 critical，>30 warning |
| 空间套利 | 冷链损耗率 | 当前示例 0.8% | >1.2 critical |
| 实体套利 | 鲜销收益 | 当前示例 2.8 元/kg | normal |
| 实体套利 | 冻储收益 | 当前示例 3.5 元/kg | normal |
| 实体套利 | 深加工收益 | 当前示例 5.2 元/kg | normal |
| 实体套利 | 深加工原料满足率 | 当前示例 85% | <80 critical，<90 warning |
| 产能 | 屠宰产能利用率 | 输入 `capacityUtilization` | <70 critical，<85 warning |
| 产能 | 分割产能利用率 | 当前示例 65% | <70 critical |
| 产能 | 库容利用率 | currentInventory / 80000 × 100 | >72000 critical，>64000 warning |
| AI | 价格预测准确率 | 当前示例 87% | <80 critical，<85 warning |
| AI | AI 方案超额收益 | 当前示例 12.5% | normal |
| AI | 决策响应延迟 | 当前示例 3.2 分钟 | >5 critical |
| 执行 | 每日储备计划执行率 | 输入 `executionRate` | <90 critical，<95 warning |
| 执行 | 自动派单率 | 当前示例 96% | normal |
| 执行 | FEFO 出库执行率 | 当前示例 98% | normal |
| 执行 | 工单完成率 | 当前示例 94% | <90 critical，否则 warning |
| 风控 | 库存积压风险率 | 当前示例 8% | >15 critical，>10 warning |
| 风控 | 资金占用率 | 当前示例 62% | >80 critical，>70 warning |
| 风控 | 库存损耗率 | 输入 `lossRate` | >1.2 critical，>1.0 warning |
| 风控 | VaR(95%) | 当前示例 2800 万元 | normal |

## 16. 审批、审计和权限

角色：

| 角色 | 权限 |
| --- | --- |
| 管理员 | 维护规则、租户、参数配置；策略和阈值修改强制入审计 |
| 决策者 | 审批高风险策略与库存动作；高风险必须审批 |
| 执行者 | 只能执行已审批指令并反馈结果；不能修改公式和风险阈值 |

审计对象：

1. 库存策略确认。
2. 高风险审批。
3. AI 派单生成。
4. 工单回执更新。
5. 超时升级。
6. 时间/空间套利记录保存。

审计最小字段：

```text
actionType, entityType, entityId, operatorRole, operatorName,
riskLevel, decision, beforeValue, afterValue, createdAt, status
```

## 17. 验收标准

来自 `PORK_PROJECT_BLUEPRINT`：

| 指标 | 目标 | 证据 |
| --- | --- | --- |
| 价格预测准确率 | >= 85% | 3 年历史回测与每日偏差复盘 |
| 套利收益覆盖率 | >= 90% | 理论收益与实际执行收益对账 |
| 执行自动化率 | >= 95% | 自动派单数 / 总工单数 |
| 决策响应延迟 | <= 5 分钟 | 数据输入到方案输出链路日志 |
| 大屏与核心数据刷新 | <= 1 分钟 | 行情、库存、产能更新监控 |
| 库存损耗率 | <= 1.2% | WMS 出入库、温控与损耗台账 |
| 数据质量 | 误差 <= 0.1%，23 部位无遗漏 | 每日自动校验与异常告警 |
| 库存库龄约束 | 库龄 <= 120 天，90 天以上预警 | FEFO 批次明细与预警记录 |
| 硬约束满足率 | 100% | 产能、库容、资金、合同、半径规则校验 |
| 系统可用性 | >= 99.9% | 生产监控、熔断降级和故障恢复记录 |

## 18. 当前实现与生产化差距

当前已经实现：

1. 23 部位主数据和成本/CoC/风险收益计算。
2. 库存批次持有/出售决策。
3. 时间套利曲线、窗口、最佳出货月、产能倒排和统一评分。
4. 空间套利路线枚举、真实车型调度、通道分配、产能/需求约束和统一评分。
5. 金融套利、套保、保证金、压力测试和统一评分。
6. 14 类深度套利识别。
7. Excel 输入参数生成到系统模型。
8. 全局优化求解、利润表、生产/库存/运输表和 AI 决策。
9. AI 预测、What-If、预警、派单和回执闭环。
10. 回归测试覆盖核心公式和数据映射。

生产化仍需补齐：

1. 统一业务参数表，消除代码默认值与业务文档阈值不一致。
2. 建立真实数据源接入：SAP、WMS、TMS、MES、战房、UWORK、期货、行情、企业微信、短信。
3. 将 Excel 公式口径固化为可版本化规则，保留公式变更审计。
4. 以真实历史数据做回测，形成预测准确率、收益覆盖率和风险校准报告。
5. 引入专业优化求解器，例如 OR-Tools、HiGHS、Pyomo、Gurobi 或 CPLEX，用于替代部分贪心策略。
6. 建立审批流状态机、风控限额、金融合规边界和每日盯市流程。
7. 建立数据质量系统：缺失、异常、延迟、口径冲突、来源可信度。
8. 建立执行收益复盘：系统建议收益、实际执行收益、偏差原因、责任部门。

## 19. 推荐落地顺序

第一阶段：口径固化。

1. 确认社会成本、公司成本、储存成本、资金成本、损耗率、库龄规则。
2. 确认 23 部位名称、出品率、储备标识、价格系数和成本系数。
3. 将 Excel 公式转为可配置规则，并建立版本号。

第二阶段：数据贯通。

1. 接入真实出栏、屠宰、分割、速冻、仓储、订单、运输和成本数据。
2. 标记数据来源、更新时间、责任部门和可信度。
3. 对未匹配地区补充屠宰工厂或调拨规则。

第三阶段：模型闭环。

1. 时间套利先上线，确保成本、库存、释放窗口和审批闭环可用。
2. 空间套利上线真实 TMS 路由、车辆、司机、油价、过路费、温控和损耗。
3. 全局优化接入真实约束和回测。
4. 金融套利仅在财务合规审批后进入生产。

第四阶段：AI 与执行。

1. AI 只输出可解释建议，每条建议必须能回溯公式和数据。
2. 高风险策略保留人工审批。
3. 派单、回执、超时升级和收益复盘形成闭环。

第五阶段：工业化。

1. 引入专业求解器和调度任务。
2. 建立监控、告警、熔断和灰度发布。
3. 建立模型版本、参数版本、数据版本、策略版本和审计版本。

## 20. 关键文件索引

| 文件 | 说明 |
| --- | --- |
| `server/porkIndustryModel.ts` | 23 部位、全成本、CoC、公允价、风险收益、项目蓝图 |
| `server/platformData.ts` | 批次决策、风险评分、行情种子、审计种子 |
| `server/timeArbitrage.ts` | 时间套利、期货曲线、产能倒排、统一评分 |
| `server/spatialArbitrage.ts` | 空间套利、车型调度、产能需求约束、通道分配 |
| `server/financialArbitrage.ts` | 金融套利、套保、压力测试 |
| `server/deepArbitrage.ts` | 14 类深度套利和核心指标 |
| `server/globalOptimization.ts` | 全局优化、Excel 输入求解、AI 决策、增强计划 |
| `server/arbitrageShared.ts` | 统一风险惩罚、约束校验、评分卡 |
| `shared/globalOptimization.ts` | 全局优化类型和样例/Excel 输入导出 |
| `shared/excelOptimizationData.ts` | 从 Excel 生成的真实输入参数 |
| `docs/输入参数-2026.4.24字段映射与补充清单.md` | Excel 字段映射与数据覆盖说明 |
| `server/*test.ts` | 量化公式、数据映射和业务约束回归测试 |

## 21. 公式索引

| 公式 | 章节 |
| --- | --- |
| 部位全成本 | 6.1 |
| 库龄折价 | 6.2 |
| CoC 公允价 | 6.3 |
| 风险调整持有收益 | 6.4 |
| 批次持有/出售决策 | 7 |
| 批次风险分 | 7 |
| 时间套利期货预测曲线 | 8.2 |
| 时间套利收益与窗口 | 8.3 |
| 时间套利产能倒排 | 8.4 |
| 时间套利风险调整 | 8.5 |
| 空间套利距离、运费和车型 | 9.3 |
| 空间套利路线筛选 | 9.4 |
| 鲜销/冻储/深加工通道 | 9.6 |
| 金融套利损益 | 10.2 |
| 金融套利风险指标 | 10.3 |
| 14 类深度套利 | 11.2 |
| 全局优化成本分摊 | 12.6 |
| 全局优化汇总指标 | 12.7 |
| AI 价格预测 | 13.1 |
| What-If 资源模拟 | 13.2 |
| 统一风险惩罚 | 14.2 |
| 综合评分卡 | 14.3 |
| 数学公式体系详解 | 22 |
| 变量与公式查表 | 23 |

## 22. 数学公式体系详解

本章把前文业务公式进一步抽象为统一数学表达，便于算法实现、模型评审、参数校准、回测和后续引入专业优化求解器。为了保持工程可读性，本文使用 ASCII 变量名表达数学符号，所有变量在第 23 章附件中统一解释。

### 22.1 统一索引集合

系统最小决策单元是“时间 × 工厂 × 部位 × 渠道 × 区域 × 批次”。建议后续所有模型统一使用以下集合：

```text
T = {t | t 为日期、周、月或计划期}
F = {f | f 为屠宰/分割/深加工工厂}
P = {p | p 为分割部位}
R = {r | r 为区域、省份或城市节点}
O = {o | o 为产地节点}
D = {d | d 为销地节点}
C = {c | c 为销售渠道或客户类型}
B = {b | b 为库存批次}
V = {v | v 为车型}
S = {s | s 为情景或压力测试场景}
```

常用决策变量：

```text
x_slaughter[f,t]       = 工厂 f 在 t 期屠宰头数
x_split[f,p,t]         = 工厂 f 在 t 期分割部位 p 的 kg 数
x_freeze[f,p,t]        = 工厂 f 在 t 期入冻部位 p 的 kg 数
x_store[w,p,t]         = 仓库 w 在 t 期期末库存 kg
x_sell[f,p,c,r,t]      = 工厂 f 在 t 期向区域 r/渠道 c 销售部位 p 的 kg 数
x_transfer[o,d,p,t]    = t 期从产地 o 向销地 d 调拨部位 p 的 kg 数
x_deep[f,p,t]          = 工厂 f 在 t 期投入深加工的部位 p kg 数
x_hedge[p,t]           = 部位 p 在 t 期套保 kg 数
y_route[o,d,p,t]       = 路线 o->d 在 t 期是否启用，0/1
y_store[b,t]           = 批次 b 在 t 期是否继续持有，0/1
```

### 22.2 单位、维度与换算规则

量化系统必须严格区分“元/kg、元/吨、元/头、kg、吨、头、天、月”。核心换算如下：

```text
1 吨 = 1000 kg
部位产出kg = 毛猪头数 × 均重kg/头 × 出品率
部位产出吨 = 部位产出kg / 1000
月度能力 = 日度能力 × 当月有效天数
单位吨成本转 kg 成本 = 单位吨成本 / 1000
年利率转日利率 = 年利率 / 365
月持有成本转日持有成本 = 月持有成本 / 30
万元 = 元 / 10000
```

所有收益、成本和风险惩罚在进入综合目标函数前应统一为“元”。前端展示可以转换为“万元”或“元/kg”，但后端计算不应混用展示单位。

### 22.3 部位出品率与物料树公式

部位出品率可以是一层或多层物料树。若 `p` 是毛猪直接产物：

```text
yield[p] = yield_rate("毛猪" -> p)
```

若 `p` 是白条等中间物料继续分割得到：

```text
yield[p] = yield_rate("毛猪" -> parent) × yield_rate(parent -> p)
```

如果同一部位存在多条路径，综合出品率为路径累加：

```text
yield[p] = Σ_path Π_edge yield_rate[edge]
```

工厂 f 在 t 期对部位 p 的理论产出：

```text
q_theory[f,p,t] = x_slaughter[f,t] × avg_weight[f,t] × yield[p]
```

考虑分割能力上限：

```text
q_available[f,p,t] = min(q_theory[f,p,t], cap_split[f,p,t])
```

若需要把未分割白条、直接鲜销和储备品分开，应建立三类产出：

```text
q_fresh[f,p,t]   = max(q_available[f,p,t] - q_reserve[f,p,t], 0)
q_reserve[f,p,t] = min(q_available[f,p,t], cap_freeze[f,p,t], cap_storage[f,p,t])
q_deep[f,p,t]    = min(q_available[f,p,t], demand_deep[f,p,t], cap_deep[f,t])
```

### 22.4 全成本核算公式

部位 p 在工厂 f、t 期的全成本由毛猪成本、屠宰成本、分割成本、包装成本、速冻成本、仓储成本、资金成本、损耗成本、运输成本和其他费用组成。

毛猪成本分摊：

```text
live_cost_total[f,t] = Σ_i live_price[i,t] × head_count[i,t] × avg_weight[i,t]
part_weight[f,p,t]   = q_available[f,p,t]
total_part_weight[f,t] = Σ_p part_weight[f,p,t]
live_cost_alloc[f,p,t] =
  live_cost_total[f,t] × part_weight[f,p,t] / max(total_part_weight[f,t], eps)
live_cost_per_kg[f,p,t] =
  live_cost_alloc[f,p,t] / max(q_available[f,p,t], eps)
```

加工成本：

```text
process_cost_per_kg[f,p,t] =
  slaughter_cost_per_kg[f,p,t]
  + split_cost_per_kg[f,p,t]
  + package_cost_per_kg[f,p,t]
  + freeze_cost_per_kg[f,p,t]
```

仓储成本：

```text
storage_cost_per_kg[b,t] = storage_cost_per_kg_day[b] × storage_days[b,t]
```

资金成本：

```text
capital_cost_per_kg[b,t] =
  inventory_value_per_kg[b]
  × annual_capital_rate[t] / 365
  × storage_days[b,t]
```

损耗成本：

```text
loss_cost_per_kg[b,t] =
  inventory_value_per_kg[b]
  × daily_loss_rate[p]
  × storage_days[b,t]
```

运输成本：

```text
transport_cost_per_kg[o,d,v,t] =
  distance_km[o,d]
  × vehicle_cost_per_km_ton[v]
  / 1000
```

部位全成本：

```text
full_cost_per_kg[f,p,b,o,d,v,t] =
  live_cost_per_kg[f,p,t]
  + process_cost_per_kg[f,p,t]
  + storage_cost_per_kg[b,t]
  + capital_cost_per_kg[b,t]
  + loss_cost_per_kg[b,t]
  + transport_cost_per_kg[o,d,v,t]
  + other_cost_per_kg[f,p,t]
```

保本价：

```text
break_even_price[f,p,b,o,d,v,t] = full_cost_per_kg[f,p,b,o,d,v,t] + target_margin_per_kg[p,t]
```

如果目标是“减亏最大化”而不是“利润最大化”，目标毛利可以为 0：

```text
break_even_price_loss_reduction = full_cost_per_kg
```

### 22.5 库龄、FEFO 与品质折价公式

库存批次 b 的库龄：

```text
age_days[b,t] = t_date - inbound_date[b]
remaining_shelf_life[b,t] = shelf_life_days[p] - age_days[b,t]
```

折价系数：

```text
age_discount[b,t] =
  1.00, age_days <= 30
  0.98, 30 < age_days <= 60
  0.95, 60 < age_days <= 90
  0.90, 90 < age_days <= 120
  0.80, age_days > 120
```

库龄调整后可兑现价格：

```text
realizable_price[b,t] = expected_sell_price[p,t] × age_discount[b,t]
```

FEFO 优先级可以定义为：

```text
fefo_priority[b,t] =
  1, remaining_shelf_life < 14
  2, 14 <= remaining_shelf_life < 30
  3, remaining_shelf_life >= 30
```

出库排序：

```text
sort_key[b,t] = (fefo_priority[b,t], remaining_shelf_life[b,t], -age_days[b,t])
```

### 22.6 时间套利数学模型

时间套利判断的是：现在低价买入/屠宰/分割/冻储，未来价格回升后释放，收益是否覆盖全部持有成本和风险。

未来价格曲线：

```text
gap = social_cost - spot_price
future_price[t+i] = spot_price + alpha_i × gap + beta_i
```

其中当前实现的锚点：

```text
alpha = [0.00, 0.10, 0.23, 0.43, 0.67, 0.90, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
beta  = [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.20, 0.40, 0.60, 0.80, 1.00]
```

持有成本：

```text
holding_cost[t+i] = spot_price + holding_cost_per_month × i
```

单位价差：

```text
spread_time[t+i] = future_price[t+i] - holding_cost[t+i]
```

总利润：

```text
profit_time[t+i] = spread_time[t+i] × storage_tons × 1000
profit_time_wan[t+i] = profit_time[t+i] / 10000
```

套利触发条件：

```text
signal_time[t+i] =
  1, spread_time[t+i] > 0 AND holding_cost[t+i] < social_cost
  0, otherwise
```

最佳释放期：

```text
t_release_star = argmax_i profit_time[t+i]
max_profit_time = max_i profit_time[t+i]
```

套利窗口：

```text
window_start = min{i | signal_time[t+i] = 1}
window_end   = max{i | signal_time[t+i] = 1}
```

资金和风险调整：

```text
financing_cost_time =
  spot_price × storage_tons × 1000 × annual_financing_rate × holding_days / 365

roll_cost_time =
  storage_tons × roll_cost_per_ton × max(0, holding_months - 1)

capital_occupancy_cost_time =
  storage_tons × spot_price × 1000 × monthly_capital_occupancy_rate × holding_months

stress_loss_time =
  max(0,
    max_profit_time × stress_profit_ratio
    + financing_cost_time × stress_financing_ratio
    + capital_occupancy_cost_time × stress_capital_ratio
  )

adjusted_profit_time =
  max_profit_time
  - financing_cost_time
  - roll_cost_time
  - capital_occupancy_cost_time
  - risk_penalty
  - capital_penalty
  - execution_penalty
```

收益率：

```text
initial_capital_time = spot_price × storage_tons × 1000
return_on_capital_time = adjusted_profit_time / max(initial_capital_time, eps)
annualized_return_time =
  return_on_capital_time × 365 / max(holding_days, 1)
carry_coverage_ratio =
  max_profit_time / max(financing_cost_time + roll_cost_time + capital_occupancy_cost_time, eps)
```

### 22.7 空间套利数学模型

区域价差：

```text
regional_spread[o,d,p,t] = price_dest[d,p,t] - price_origin[o,p,t]
```

部位溢价映射：

```text
premium_ratio[p,t] = spot_price[p,t] / carcass_benchmark_price[t]
price_origin[o,p,t] = base_price[o,t] × premium_ratio[p,t]
price_dest[d,p,t]   = base_price[d,t] × premium_ratio[p,t]
```

距离：

```text
p_rad = pi / 180
a = 0.5 - cos((lat_d - lat_o) × p_rad) / 2
    + cos(lat_o × p_rad) × cos(lat_d × p_rad)
      × (1 - cos((lng_d - lng_o) × p_rad)) / 2
distance_raw[o,d] = 12742 × asin(sqrt(a))
distance_km[o,d] = round(distance_raw[o,d] × route_detour_factor)
```

运输成本：

```text
freight_total[o,d,v,t] =
  distance_km[o,d] × vehicle_cost_per_km_ton[v] × shipped_ton[o,d,p,t]

freight_per_kg[o,d,v,t] =
  freight_total[o,d,v,t] / max(shipped_ton[o,d,p,t] × 1000, eps)
```

单位鲜销利润：

```text
profit_fresh_per_kg[o,d,p,t] =
  regional_spread[o,d,p,t] - freight_per_kg[o,d,v,t]
```

冻储利润：

```text
storage_handling_cost_per_kg =
  storage_handling_base_cost + freight_per_kg × freight_storage_factor

profit_storage_per_kg[o,d,p,t] =
  max_profit_time_per_kg[p,t] - storage_handling_cost_per_kg
```

深加工利润：

```text
profit_deep_per_kg[o,d,p,t] =
  profit_storage_per_kg[o,d,p,t] + deep_processing_premium_per_kg[p,t]
```

通道分配：

```text
lane_profit[l] = profit_l_per_kg × strategy_bias[mode,l]
x_lane[l] <= cap_lane[l]
Σ_l x_lane[l] <= shipped_ton
weighted_profit_route = Σ_l x_lane[l] × 1000 × profit_l_per_kg
net_profit_route_per_kg =
  weighted_profit_route / max(Σ_l x_lane[l] × 1000, eps)
```

空间套利调度目标：

```text
maximize Σ_o Σ_d Σ_p Σ_t weighted_profit_route[o,d,p,t]
```

当前贪心约束：

```text
Σ_d Σ_p x_transfer[o,d,p,t] <= capacity_origin[o,t]
Σ_o Σ_p x_transfer[o,d,p,t] <= demand_dest[d,t]
Σ_o Σ_d Σ_p x_transfer[o,d,p,t] <= target_shipment_ton[t]
x_transfer[o,d,p,t] >= 0
y_route[o,d,p,t] in {0,1}
x_transfer[o,d,p,t] <= M × y_route[o,d,p,t]
```

### 22.8 金融套利和套保数学模型

基差：

```text
basis_now[p,t] = spot_price[p,t] - futures_price[p,t]
basis_future[p,t+h] = expected_spot_price[p,t+h] - expected_futures_price[p,t+h]
basis_change = basis_future - basis_now
```

套保头寸：

```text
hedged_tons = physical_exposure_tons × hedge_ratio
contracts_needed = ceil(hedged_tons / contract_size_ton)
actual_hedged_tons = contracts_needed × contract_size_ton
```

损益：

```text
spot_pnl =
  (expected_spot_price - spot_price) × physical_exposure_tons × 1000

futures_pnl =
  (futures_price - expected_futures_price) × actual_hedged_tons × 1000

basis_pnl =
  (expected_basis_convergence - basis_change) × actual_hedged_tons × 1000

gross_pnl_financial = spot_pnl + futures_pnl + basis_pnl
```

成本：

```text
storage_cost_financial =
  storage_cost_per_ton_day × holding_days × physical_exposure_tons

financing_cost_financial =
  spot_price × physical_exposure_tons × 1000
  × financing_rate × holding_days / 365

transaction_cost =
  transaction_cost_per_ton × actual_hedged_tons

slippage_cost =
  slippage_per_kg × actual_hedged_tons × 1000

delivery_cost =
  delivery_cost_per_ton × actual_hedged_tons

net_pnl_financial =
  gross_pnl_financial
  - storage_cost_financial
  - financing_cost_financial
  - transaction_cost
  - slippage_cost
  - delivery_cost
```

保证金和资本占用：

```text
total_margin =
  futures_price × 1000 × actual_hedged_tons × margin_rate

peak_capital_occupied =
  spot_price × physical_exposure_tons × 1000
  + total_margin
  + storage_cost_financial
  + financing_cost_financial
```

有效价格：

```text
effective_price =
  expected_spot_price
  + (futures_pnl + basis_pnl - storage_cost_financial - financing_cost_financial)
    / max(physical_exposure_tons × 1000, eps)
```

保本基差：

```text
break_even_basis =
  basis_now
  + (storage_cost_financial + financing_cost_financial + transaction_cost + slippage_cost + delivery_cost)
    / max(actual_hedged_tons × 1000, eps)
```

套保有效性：

```text
hedge_effectiveness =
  1 - abs(spot_pnl + futures_pnl) / max(abs(spot_pnl), eps)
```

追保风险：

```text
margin_call_risk =
  total_margin × max(0, margin_risk_base - hedge_ratio × hedge_risk_offset)
  / max(peak_capital_occupied, eps)
```

### 22.9 深度套利数学模型

深度套利可以统一成“触发函数 + 收益函数 + 风险标签”：

```text
trigger_k = I(metric_k >= threshold_k)
expected_return_k = f_k(input_variables)
risk_level_k = g_k(metric_k, threshold_k, volatility, execution_complexity)
```

综合深度套利收益：

```text
return_deep_total =
  Σ_k I(trigger_k = active) × expected_return_per_head[k] × planned_heads
```

若需要考虑执行概率：

```text
expected_return_deep_risk_adjusted =
  Σ_k expected_return_per_head[k]
      × planned_heads
      × confidence_k
      × (1 - risk_haircut_k)
```

示例：跨品种传导套利。

```text
feed_cost = corn_price / 1000 × corn_feed_ratio
          + soybean_meal_price / 1000 × soybean_feed_ratio

breeding_cost = feed_cost × feed_conversion_markup + fixed_breeding_cost
expected_hog_cost = breeding_cost × hog_cost_markup
deviation = abs(live_hog_price - expected_hog_cost) / expected_hog_cost
trigger_transmission = I(deviation >= transmission_threshold)
return_transmission_per_head = deviation × live_hog_price × standard_weight_kg
```

### 22.10 全局优化目标函数

在生产级系统中，全局优化应从当前贪心规则升级为约束优化。推荐的基本目标函数：

```text
maximize Objective =
  Total_Revenue
  - Total_LivePig_Cost
  - Total_Process_Cost
  - Total_Storage_Cost
  - Total_Transport_Cost
  - Total_Financing_Cost
  - Total_Loss_Cost
  - Risk_Penalty
  - Execution_Penalty
  - Constraint_Violation_Penalty
```

收入：

```text
Total_Revenue =
  Σ_f Σ_p Σ_c Σ_r Σ_t
    x_sell[f,p,c,r,t] × sell_price[p,c,r,t]
  + Σ_f Σ_p Σ_t
    x_deep[f,p,t] × deep_processing_output_price[p,t]
```

毛猪成本：

```text
Total_LivePig_Cost =
  Σ_f Σ_t x_slaughter[f,t] × avg_weight[f,t] × live_price[f,t]
```

加工成本：

```text
Total_Process_Cost =
  Σ_f Σ_p Σ_t x_split[f,p,t]
  × (slaughter_cost_per_kg[f,p,t]
     + split_cost_per_kg[f,p,t]
     + package_cost_per_kg[f,p,t]
     + freeze_cost_per_kg[f,p,t])
```

仓储成本：

```text
Total_Storage_Cost =
  Σ_w Σ_p Σ_t x_store[w,p,t] × storage_cost_per_kg_day[w,p,t] × days_in_period[t]
```

运输成本：

```text
Total_Transport_Cost =
  Σ_o Σ_d Σ_p Σ_v Σ_t
    x_transfer[o,d,p,t] / 1000
    × distance_km[o,d]
    × vehicle_cost_per_km_ton[v]
```

资金成本：

```text
Total_Financing_Cost =
  Σ_w Σ_p Σ_t inventory_value[w,p,t]
  × annual_capital_rate[t]
  × days_in_period[t] / 365
```

损耗成本：

```text
Total_Loss_Cost =
  Σ_w Σ_p Σ_t x_store[w,p,t] × inventory_value_per_kg[p,t] × daily_loss_rate[p] × days_in_period[t]
```

硬约束：

```text
Σ_source x_slaughter[f,t] <= slaughter_capacity[f,t]
Σ_p x_split[f,p,t] <= split_capacity[f,t]
x_freeze[f,p,t] <= freeze_capacity[f,p,t]
x_store[w,p,t] <= warehouse_capacity[w,p,t]
Σ_f x_sell[f,p,c,r,t] <= demand[p,c,r,t]
Σ_d x_transfer[o,d,p,t] <= supply[o,p,t]
Σ_o x_transfer[o,d,p,t] <= demand[d,p,t]
Σ_p x_deep[f,p,t] <= deep_processing_capacity[f,t]
capital_used[t] <= capital_budget[t]
risk_exposure[t] <= risk_limit[t]
```

库存平衡约束：

```text
inventory[w,p,t] =
  inventory[w,p,t-1]
  + inbound[w,p,t]
  - outbound[w,p,t]
  - loss[w,p,t]
```

产出平衡约束：

```text
x_split[f,p,t] + x_fresh_unsplit[f,p,t] + x_byproduct[f,p,t]
<= x_slaughter[f,t] × avg_weight[f,t] × yield[p]
```

销售和调拨平衡：

```text
x_sell[f,p,c,r,t] + x_deep[f,p,t] + x_freeze[f,p,t]
<= x_split[f,p,t] + inventory_available[f,p,t]
```

二进制启用约束：

```text
x_transfer[o,d,p,t] <= M × y_route[o,d,p,t]
y_route[o,d,p,t] in {0,1}
```

### 22.11 多目标优化与权重

当业务目标不是单一利润最大化时，可以使用加权多目标：

```text
maximize Z =
  w_profit × normalized_profit
  + w_loss_reduction × normalized_loss_reduction
  + w_cashflow × normalized_cashflow
  + w_turnover × normalized_inventory_turnover
  + w_service × normalized_service_level
  - w_risk × normalized_risk
  - w_complexity × normalized_execution_complexity
```

权重约束：

```text
Σ_i w_i = 1
w_i >= 0
```

建议场景权重：

| 场景 | 利润 | 减亏 | 现金流 | 周转 | 服务 | 风险 | 复杂度 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 猪周期底部 | 0.20 | 0.30 | 0.15 | 0.10 | 0.05 | 0.15 | 0.05 |
| 正常经营 | 0.35 | 0.10 | 0.10 | 0.15 | 0.10 | 0.15 | 0.05 |
| 高库存压力 | 0.20 | 0.15 | 0.15 | 0.25 | 0.05 | 0.15 | 0.05 |
| 高价格波动 | 0.20 | 0.15 | 0.10 | 0.10 | 0.05 | 0.30 | 0.10 |

### 22.12 回测与模型效果评估

预测误差：

```text
error[t] = predicted_price[t] - actual_price[t]
MAE = mean(abs(error[t]))
MAPE = mean(abs(error[t] / actual_price[t])) × 100
RMSE = sqrt(mean(error[t]^2))
direction_accuracy =
  count(sign(predicted_price[t] - price[t-1]) = sign(actual_price[t] - price[t-1]))
  / N
```

套利收益覆盖率：

```text
profit_capture_rate =
  actual_profit / max(theoretical_profit, eps) × 100
```

执行偏差：

```text
execution_qty_deviation =
  abs(actual_qty - planned_qty) / max(planned_qty, eps) × 100

execution_profit_deviation =
  actual_profit - planned_profit
```

风险校准：

```text
breach_rate =
  count(actual_loss > predicted_var_95) / N

stress_pass_rate =
  count(stress_scenario_pass = true) / total_stress_scenarios
```

策略对比：

```text
alpha_strategy =
  actual_profit_strategy - actual_profit_baseline

uplift_rate =
  alpha_strategy / max(abs(actual_profit_baseline), eps) × 100
```

### 22.13 数据质量约束公式

完整率：

```text
completeness[field,t] =
  non_null_count[field,t] / expected_count[field,t] × 100
```

及时率：

```text
timeliness[source,t] =
  count(arrival_delay <= SLA) / total_records × 100
```

一致性：

```text
consistency_metric =
  1 - abs(value_source_a - value_source_b) / max(abs(value_source_a), eps)
```

异常值：

```text
z_score[x] = (x - mean(x_history)) / std(x_history)
is_outlier = abs(z_score[x]) > z_threshold
```

数据可信度：

```text
data_confidence =
  0.35 × completeness
  + 0.25 × timeliness
  + 0.20 × consistency
  + 0.20 × source_reliability
```

## 23. 附件：变量与公式查表

本附件用于开发、算法、业务和财务团队对照使用。变量表优先定义通用符号，公式表按模块列出公式名称、表达式、变量依赖、输出和用途。

### 23.1 通用变量表

| 变量 | 中文名称 | 单位 | 类型 | 适用模块 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `t` | 时间索引 | 日/周/月 | 索引 | 全局 | 可映射到日期、月份或计划周期 |
| `f` | 工厂索引 | 无 | 索引 | 全局优化 | 屠宰厂、分割厂、深加工厂 |
| `p` | 部位索引 | 无 | 索引 | 23 部位/全局 | 五花、排骨、里脊等部位 |
| `r` | 区域索引 | 无 | 索引 | 空间/销售 | 省份、城市或市场区域 |
| `o` | 产地节点 | 无 | 索引 | 空间套利 | 低价供给区域 |
| `d` | 销地节点 | 无 | 索引 | 空间套利 | 高价需求区域 |
| `c` | 渠道索引 | 无 | 索引 | 销售/实体套利 | 批发、商超、餐饮、深加工等 |
| `b` | 库存批次 | 无 | 索引 | 库存/时间套利 | 批次维度可追溯库存 |
| `v` | 车型索引 | 无 | 索引 | 空间套利 | 小型、中型、大型冷链车 |
| `s` | 情景索引 | 无 | 索引 | 压力测试 | 基差走阔、现货下跌、资金冲击等 |
| `eps` | 极小正数 | 无 | 参数 | 全局 | 防止除零，建议 1e-9 或按业务最小单位设置 |
| `M` | 大 M 常数 | kg/吨 | 参数 | MILP | 二进制启用约束上界 |
| `I(condition)` | 指示函数 | 0/1 | 函数 | 全局 | 条件成立为 1，否则为 0 |
| `min()` | 最小值函数 | 取决于输入 | 函数 | 全局 | 约束上限取小 |
| `max()` | 最大值函数 | 取决于输入 | 函数 | 全局 | 下限保护、压力损失 |
| `argmax()` | 最大值位置 | 索引 | 函数 | 时间/优化 | 求最佳释放期或最佳策略 |
| `clamp01(x)` | 0-1 截断 | 无 | 函数 | 评分 | 小于 0 取 0，大于 1 取 1 |

### 23.2 价格、成本与产出变量表

| 变量 | 中文名称 | 单位 | 来源 | 说明 |
| --- | --- | --- | --- | --- |
| `spot_price` | 当前现货价 | 元/kg | 行情/输入 | 毛猪、白条或部位当前价 |
| `live_price` | 毛猪价格 | 元/kg | 出栏表 | 用于计算毛猪采购/养殖成本 |
| `website_price` | 网站价格 | 元/kg | 出栏表 | 用于决策参考 |
| `futures_price` | 当前期货价 | 元/kg | 期货行情/出栏表 | 期货主力或映射价格 |
| `expected_spot_price` | 预期未来现货价 | 元/kg | 预测模型 | 金融套利和时间套利输入 |
| `expected_futures_price` | 预期未来期货价 | 元/kg | 预测模型 | 金融套利输入 |
| `future_price` | 未来预测价 | 元/kg | 时间套利曲线 | 分段锚点生成 |
| `sell_price` | 销售价 | 元/kg | 订单/价格系数 | 普通销售或渠道价格 |
| `deep_processing_output_price` | 深加工产出价格 | 元/kg | 深加工需求 | 深加工销售收益 |
| `base_price` | 区域基准价 | 元/kg | 空间节点 | 产地/销地基础价格 |
| `carcass_benchmark_price` | 白条基准价 | 元/kg | 平台行情 | 部位溢价基准，当前示例 23.4 |
| `premium_ratio` | 部位溢价系数 | 倍 | 部位价格/白条价 | 空间套利部位价格映射 |
| `avg_weight` | 毛猪均重 | kg/头 | 出栏表 | 当前 Excel 示例 120/125 kg |
| `yield_rate` | 出品率 | % 或小数 | 出品率表 | 父子物料转换比例 |
| `q_theory` | 理论产出 | kg | 计算 | 屠宰头数 × 均重 × 出品率 |
| `q_available` | 可用产出 | kg | 计算 | 理论产出与能力上限取小 |
| `storage_days` | 储存天数 | 天 | 批次/WMS | 入库到当前或计划出库的天数 |
| `holding_months` | 持有月数 | 月 | 策略输入 | 时间套利持有周期 |
| `holding_days` | 持有天数 | 天 | 策略输入 | 金融套利/CoC 使用 |
| `annual_capital_rate` | 年资金成本率 | % 或小数 | 财务 | 资金占用成本 |
| `daily_loss_rate` | 日损耗率 | % 或小数 | 业务/质检 | 库存自然损耗 |
| `storage_cost_per_kg_day` | 日仓储成本 | 元/kg/日 | 仓库表 | 仓储成本 |
| `storage_cost_per_ton_day` | 日仓储成本 | 元/吨/日 | 仓库表/输入 | 需除以 1000 转 kg |
| `transport_cost_per_kg` | 运输成本 | 元/kg | 运输表/计算 | 距离 × 单位运价 |
| `vehicle_cost_per_km_ton` | 车型单位运价 | 元/km/吨 | 车型表 | 小型 1.8、中型 1.4、大型 1.1 |
| `distance_km` | 调度距离 | km | 经纬度/运输表 | 空间套利路线距离 |
| `process_cost_per_kg` | 加工成本 | 元/kg | 成本表 | 屠宰、分割、包装、速冻合计 |
| `full_cost_per_kg` | 全成本 | 元/kg | 计算 | 全成本核算核心输出 |
| `break_even_price` | 保本价 | 元/kg | 计算 | 全成本加目标毛利 |

### 23.3 产能、库存和调度变量表

| 变量 | 中文名称 | 单位 | 来源 | 说明 |
| --- | --- | --- | --- | --- |
| `slaughter_capacity` | 屠宰产能 | 头/期 | 屠宰能力表 | 日能力需乘有效天数 |
| `split_capacity` | 分割能力 | kg/期 或 头/日 | 分割能力表 | 部位级或工厂级 |
| `freeze_capacity` | 速冻能力 | kg/期 | 分割能力表 | 冻储前置约束 |
| `warehouse_capacity` | 仓储容量 | kg | 仓库表 | 库容硬约束 |
| `deep_processing_capacity` | 深加工能力 | kg/期 | 深加工表 | 投料/产线约束 |
| `capacity_origin` | 产地供应能力 | 吨 | 空间节点 | 产地可发运吨数 |
| `demand_dest` | 销地需求 | 吨 | 空间节点/订单 | 销地可消化吨数 |
| `target_shipment_ton` | 目标发运量 | 吨 | 用户输入 | 空间套利总量上限 |
| `shipped_ton` | 实际发运量 | 吨 | 调度计算 | 路线实际分配 |
| `inventory` | 库存量 | kg | WMS/计算 | 期初、期末、当前库存 |
| `inbound` | 入库量 | kg | WMS/计划 | 计划入库或实际入库 |
| `outbound` | 出库量 | kg | WMS/计划 | 计划出库或实际出库 |
| `loss` | 损耗量 | kg | 质检/计算 | 库存损耗 |
| `service_level` | 服务水平 | % | 调度计算 | 实际释放/目标收储 |
| `utilization` | 产能利用率 | % | 调度计算 | 使用量/能力上限 |
| `bottleneck_stage` | 瓶颈环节 | 文本 | 调度计算 | 利用率过高或缺口最大环节 |
| `fefo_priority` | FEFO 优先级 | 1/2/3 | 计算 | 越小越优先出库 |
| `remaining_shelf_life` | 剩余保质期 | 天 | 批次/计算 | 低于阈值触发预警 |

### 23.4 金融与风险变量表

| 变量 | 中文名称 | 单位 | 来源 | 说明 |
| --- | --- | --- | --- | --- |
| `basis_now` | 当前基差 | 元/kg | 现货-期货 | 现货价 - 期货价 |
| `basis_future` | 未来基差 | 元/kg | 预测 | 未来现货 - 未来期货 |
| `basis_change` | 基差变化 | 元/kg | 计算 | 未来基差 - 当前基差 |
| `physical_exposure_tons` | 现货敞口 | 吨 | 库存/输入 | 需要套保的现货规模 |
| `hedge_ratio` | 套保比例 | 0-1 | 策略输入 | 现货敞口中套保比例 |
| `contract_size_ton` | 合约规模 | 吨/手 | 期货合约 | 合约乘数 |
| `contracts_needed` | 合约数量 | 手 | 计算 | 向上取整 |
| `actual_hedged_tons` | 实际套保吨数 | 吨 | 计算 | 合约数量 × 合约吨数 |
| `margin_rate` | 保证金率 | % 或小数 | 期货规则 | 保证金占合约名义本金比例 |
| `total_margin` | 保证金 | 元 | 计算 | 期货价 × kg × 吨数 × 保证金率 |
| `spot_pnl` | 现货损益 | 元 | 计算 | 未来现货变化带来的损益 |
| `futures_pnl` | 期货损益 | 元 | 计算 | 期货卖出/买入后的损益 |
| `basis_pnl` | 基差损益 | 元 | 计算 | 基差收敛或扩张的损益 |
| `gross_pnl` | 毛损益 | 元 | 计算 | 现货 + 期货 + 基差 |
| `net_pnl` | 净损益 | 元 | 计算 | 毛损益扣除所有成本 |
| `adjusted_objective` | 风险调整目标 | 元 | 计算 | 净损益扣除风险/资金/执行惩罚 |
| `volatility_risk` | 波动风险 | 元 | 计算 | 价格波动带来的风险代理 |
| `basis_risk` | 基差风险 | 元 | 计算 | 基差变化风险 |
| `spread_risk` | 价差风险 | 元 | 计算 | 期限或区域价差变化风险 |
| `stress_loss` | 压力损失 | 元 | 压力测试 | 极端情景下潜在损失 |
| `risk_penalty` | 风险惩罚 | 元 | 统一评分 | 波动、基差、价差、回撤、压力损失加权 |
| `capital_penalty` | 资金惩罚 | 元 | 统一评分 | 保证金、资本占用、杠杆加权 |
| `execution_penalty` | 执行惩罚 | 元 | 统一评分 | 流动性和复杂度加权 |
| `overall_score` | 综合评分 | 0-100 | 评分卡 | 利润、风险、资本、执行、稳健性加权 |

### 23.5 公式总表

| 编号 | 公式名称 | 数学表达 | 主要变量 | 输出 | 适用模块 |
| --- | --- | --- | --- | --- | --- |
| F-001 | 部位理论产出 | `q_theory = x_slaughter × avg_weight × yield[p]` | `x_slaughter`, `avg_weight`, `yield` | kg | 出品率/全局优化 |
| F-002 | 部位可用产出 | `q_available = min(q_theory, cap_split)` | `q_theory`, `cap_split` | kg | 全局优化 |
| F-003 | 毛猪成本分摊 | `live_cost_alloc = live_cost_total × part_weight / total_part_weight` | `live_cost_total`, `part_weight` | 元 | 成本核算 |
| F-004 | 加工成本 | `process_cost = slaughter + split + package + freeze` | 成本表字段 | 元/kg | 成本核算 |
| F-005 | 仓储成本 | `storage_cost = storage_cost_per_kg_day × storage_days` | `storage_cost_per_kg_day`, `storage_days` | 元/kg | 库存/时间套利 |
| F-006 | 资金成本 | `capital_cost = value_per_kg × annual_rate / 365 × days` | `value_per_kg`, `annual_rate`, `days` | 元/kg | 成本/金融 |
| F-007 | 损耗成本 | `loss_cost = value_per_kg × daily_loss_rate × days` | `daily_loss_rate`, `days` | 元/kg | 库存/成本 |
| F-008 | 运输成本 | `transport_cost = distance_km × cost_per_km_ton / 1000` | `distance_km`, `cost_per_km_ton` | 元/kg | 空间套利 |
| F-009 | 全成本 | `full_cost = live + process + storage + capital + loss + transport + other` | 全成本组件 | 元/kg | 成本核算 |
| F-010 | 保本价 | `break_even = full_cost + target_margin` | `full_cost`, `target_margin` | 元/kg | 决策 |
| F-011 | 库龄 | `age_days = current_date - inbound_date` | 日期 | 天 | FEFO |
| F-012 | 库龄折价价 | `realizable_price = expected_sell_price × age_discount` | `expected_sell_price`, `age_discount` | 元/kg | 库存 |
| F-013 | CoC 公允价 | `fair_price = spot × exp((r_day + storage_day + loss_day) × days) - convenience_yield` | `spot`, `r_day`, `days` | 元/kg | 时间/金融 |
| F-014 | 持有单位利润 | `profit_per_kg = expected_future_price - break_even_price` | `expected_future_price`, `break_even_price` | 元/kg | 时间套利 |
| F-015 | 持有总利润 | `total_profit = profit_per_kg × inventory_kg` | `profit_per_kg`, `inventory_kg` | 元 | 时间套利 |
| F-016 | 持有年化收益 | `annualized_return = profit_per_kg / inventory_cost_per_kg / (days/365)` | `profit_per_kg`, `days` | % | 时间套利 |
| F-017 | Sharpe | `sharpe = (annualized_return - risk_free_rate) / volatility` | `annualized_return`, `volatility` | 倍 | 风险收益 |
| F-018 | 时间套利未来价 | `future_price = spot + alpha_i × (social - spot) + beta_i` | `spot`, `social`, `alpha_i`, `beta_i` | 元/kg | 时间套利 |
| F-019 | 时间套利持有成本 | `holding_cost = spot + holding_cost_per_month × i` | `spot`, `holding_cost_per_month` | 元/kg | 时间套利 |
| F-020 | 时间套利价差 | `spread_time = future_price - holding_cost` | `future_price`, `holding_cost` | 元/kg | 时间套利 |
| F-021 | 时间套利总利润 | `profit_time = spread_time × storage_tons × 1000` | `spread_time`, `storage_tons` | 元 | 时间套利 |
| F-022 | 时间套利触发 | `signal = I(spread_time > 0 AND holding_cost < social_cost)` | `spread_time`, `holding_cost`, `social_cost` | 0/1 | 时间套利 |
| F-023 | 最佳释放期 | `t_star = argmax_i profit_time[t+i]` | `profit_time` | 月份 | 时间套利 |
| F-024 | 时间套利融资成本 | `financing = spot × tons × 1000 × rate × days / 365` | `spot`, `tons`, `rate`, `days` | 元 | 时间套利 |
| F-025 | 时间套利调整利润 | `adjusted_profit = gross - financing - roll - capital - risk_penalty - capital_penalty - execution_penalty` | 损益与惩罚 | 元 | 时间套利 |
| F-026 | 区域价差 | `regional_spread = price_dest - price_origin` | `price_dest`, `price_origin` | 元/kg | 空间套利 |
| F-027 | 球面距离 | `distance_raw = 12742 × asin(sqrt(a))` | 经纬度 | km | 空间套利 |
| F-028 | 车次运费 | `freight_total = distance × vehicle_cost × shipped_ton` | `distance`, `vehicle_cost`, `shipped_ton` | 元 | 空间套利 |
| F-029 | 鲜销利润 | `fresh_profit = regional_spread - freight_per_kg` | `regional_spread`, `freight_per_kg` | 元/kg | 空间套利 |
| F-030 | 冻储利润 | `storage_profit = time_max_profit_per_kg - storage_handling_cost` | `time_max_profit_per_kg` | 元/kg | 空间套利 |
| F-031 | 深加工利润 | `deep_profit = storage_profit + deep_processing_premium` | `storage_profit`, `premium` | 元/kg | 空间/实体 |
| F-032 | 通道加权利润 | `weighted_profit = Σ x_lane × 1000 × profit_lane` | `x_lane`, `profit_lane` | 元 | 空间套利 |
| F-033 | 调度发运量 | `ship = min(origin_cap_left, dest_demand_left, target_left)` | 产能/需求/目标 | 吨 | 空间套利 |
| F-034 | 当前基差 | `basis_now = spot_price - futures_price` | `spot_price`, `futures_price` | 元/kg | 金融套利 |
| F-035 | 基差变化 | `basis_change = basis_future - basis_now` | `basis_future`, `basis_now` | 元/kg | 金融套利 |
| F-036 | 合约数量 | `contracts = ceil(hedged_tons / contract_size)` | `hedged_tons`, `contract_size` | 手 | 金融套利 |
| F-037 | 现货损益 | `spot_pnl = (future_spot - spot) × exposure_tons × 1000` | `future_spot`, `spot` | 元 | 金融套利 |
| F-038 | 期货损益 | `futures_pnl = (futures - future_futures) × actual_hedged_tons × 1000` | 期货价格 | 元 | 金融套利 |
| F-039 | 基差损益 | `basis_pnl = (expected_basis_convergence - basis_change) × actual_hedged_tons × 1000` | 基差 | 元 | 金融套利 |
| F-040 | 净损益 | `net_pnl = gross_pnl - carry - transaction - slippage - delivery` | 损益与成本 | 元 | 金融套利 |
| F-041 | 保证金 | `margin = futures_price × 1000 × hedged_tons × margin_rate` | `futures_price`, `margin_rate` | 元 | 金融套利 |
| F-042 | 有效价格 | `effective_price = future_spot + (futures_pnl + basis_pnl - carry) / exposure_kg` | 损益/敞口 | 元/kg | 金融套利 |
| F-043 | 套保有效性 | `hedge_effectiveness = 1 - abs(spot_pnl + futures_pnl) / abs(spot_pnl)` | 损益 | 0-1 | 金融套利 |
| F-044 | 跨品种传导偏离 | `deviation = abs(live_hog_price - expected_hog_cost) / expected_hog_cost` | 原料/生猪价 | % | 深度套利 |
| F-045 | 渠道溢价率 | `premium_rate = (restaurant_price - wholesale_price) / wholesale_price` | 渠道价格 | % | 深度套利 |
| F-046 | 价格波动率 | `volatility = std(part_prices) / mean(part_prices)` | 部位价格 | % | 信息差套利 |
| F-047 | 全局目标函数 | `Objective = Revenue - Costs - Penalties` | 收入/成本/惩罚 | 元 | 全局优化 |
| F-048 | 库存平衡 | `inventory_t = inventory_t-1 + inbound_t - outbound_t - loss_t` | 库存流 | kg | 全局优化 |
| F-049 | 利润率 | `profit_margin = total_profit / total_revenue × 100` | 利润/收入 | % | 全局优化 |
| F-050 | 头均利润 | `avg_profit_per_pig = total_profit / total_slaughter_count` | 利润/头数 | 元/头 | 全局优化 |
| F-051 | 产能利用率 | `capacity_utilization = allocated_count / max_capacity × 100` | 分配量/能力 | % | 全局优化 |
| F-052 | AI 预测目标价 | `target_effective = target_anchor + basis_adjustment × 0.45 + (strategy_factor - 1) × 0.9` | 目标/基差/策略 | 元/kg | AI 预测 |
| F-053 | AI 预测价 | `projected = current + (target_effective-current)×controlled_ratio + seasonal_drift + strategy_drift` | 预测参数 | 元/kg | AI 预测 |
| F-054 | What-If 利用率 | `utilization = 100 + capacity_adjustment × 0.68 + demand_adjustment × 0.32` | 调参 | % | What-If |
| F-055 | What-If 模拟利润 | `sim_profit = baseline + price_signal + demand_signal + capacity_signal - overload_penalty` | 信号项 | 元 | What-If |
| F-056 | 风险惩罚 | `risk_penalty = volatility×w_v + basis×w_b + spread×w_s + drawdown×w_d + stress×w_stress` | 风险项 | 元 | 统一评分 |
| F-057 | 资金惩罚 | `capital_penalty = margin×0.0001×w_m + peak_capital×0.00005×w_c + max(0, leverage-1)×100×w_l` | 资金项 | 元 | 统一评分 |
| F-058 | 执行惩罚 | `execution_penalty = liquidity_risk×w_liq + execution_complexity×w_exec` | 执行项 | 元 | 统一评分 |
| F-059 | 约束违规惩罚 | `penalty = max(0, actual-limit) × penalty_weight` | 实际值/限制 | 元/分 | 约束校验 |
| F-060 | 综合评分 | `overall = profit×0.28 + risk×0.22 + capital×0.18 + execution×0.15 + robustness×0.17` | 五类分 | 0-100 | 评分卡 |
| F-061 | MAE | `MAE = mean(abs(predicted - actual))` | 预测/实际 | 元/kg | 回测 |
| F-062 | MAPE | `MAPE = mean(abs((predicted - actual)/actual)) × 100` | 预测/实际 | % | 回测 |
| F-063 | RMSE | `RMSE = sqrt(mean((predicted - actual)^2))` | 预测/实际 | 元/kg | 回测 |
| F-064 | 收益覆盖率 | `capture_rate = actual_profit / theoretical_profit × 100` | 实际/理论收益 | % | 复盘 |
| F-065 | 数据完整率 | `completeness = non_null_count / expected_count × 100` | 数据计数 | % | 数据质量 |
| F-066 | 数据及时率 | `timeliness = count(delay <= SLA) / total_records × 100` | 延迟 | % | 数据质量 |
| F-067 | 数据可信度 | `confidence = 0.35×completeness + 0.25×timeliness + 0.20×consistency + 0.20×source_reliability` | 质量指标 | 0-100 | 数据治理 |

### 23.6 公式使用优先级

生产落地时建议按以下优先级固化公式：

1. 财务确认公式：全成本、毛猪成本分摊、加工成本、仓储成本、资金成本、损耗成本、利润率、头均利润。
2. 业务确认公式：出品率、鲜销/储备拆分、FEFO、库龄折价、产能利用率、订单满足率。
3. 算法确认公式：时间套利、空间套利、通道分配、全局目标函数、多目标权重。
4. 风控确认公式：风险惩罚、资本惩罚、压力测试、VaR、审批阈值。
5. 数据确认公式：完整率、及时率、一致性、可信度和异常值。

### 23.7 生产参数表建议

建议将以下参数从代码硬编码迁移到数据库或配置中心：

| 参数 | 当前示例/默认 | 建议管理方 | 说明 |
| --- | ---: | --- | --- |
| `social_cost` | 12.0 或 13.8 | 财务/业务 | 社会平均成本口径需统一 |
| `company_cost` | 14.5 | 财务 | 公司内部全成本 |
| `holding_cost_per_month` | 0.2 元/kg/月 | 财务/仓储 | 时间套利月持有成本 |
| `storage_cost_per_ton_month` | 225 元/吨/月 | 仓储/财务 | 文档口径储存成本 |
| `annual_capital_rate` | 4.2% | 财务 | 资金成本 |
| `daily_loss_rate` | 0.0007 | 质检/仓储 | 部位损耗率应分部位 |
| `decision_threshold` | 0.2 元/kg | 业务/风控 | 持有/出售阈值 |
| `age_warning_days` | 90 | 仓储/风控 | 库龄预警 |
| `age_hard_limit_days` | 120 | 仓储/风控 | 库龄硬约束 |
| `route_detour_factor` | 1.3 | 物流 | 球面距离到实际路线距离修正 |
| `deep_processing_premium` | 0.42 元/kg | 食品/销售 | 深加工溢价 |
| `storage_handling_base_cost` | 0.18 元/kg | 仓储 | 冻储处理基础成本 |
| `freight_storage_factor` | 0.55 | 物流/仓储 | 运费进入冻储处理成本的折算 |
| `risk_weights` | 见 14.1 | 风控 | 风险偏好配置 |
| `strategy_weights` | 见 22.11 | 管理层/经营 | 多目标优化权重 |
