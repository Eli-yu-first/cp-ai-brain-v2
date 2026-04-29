-- Extended tables migration for CP-AI Brain V2
-- Tables: arbitrage_records, pork_hog_price_daily, pork_futures_price,
--         inventory_batches, warehouse_capacity, production_schedule,
--         supply_chain_cost, price_forecast, arbitrage_execution,
--         risk_metrics, sales_orders, procurement_orders,
--         financial_statements, cash_flow_forecast, policy_incentives,
--         quality_inspection, cold_chain_logistics, brand_certification,
--         supplier_management, customer_management, capacity_allocation,
--         environmental_metrics

CREATE TABLE IF NOT EXISTS `arbitrage_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordType` enum('time','spatial') NOT NULL,
	`scenarioLabel` varchar(128) NOT NULL,
	`paramsJson` text NOT NULL,
	`resultJson` text NOT NULL,
	`summaryProfit` varchar(64) NOT NULL,
	`summaryMetric` varchar(128) NOT NULL,
	`operatorOpenId` varchar(64),
	`operatorName` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arbitrage_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pork_hog_price_daily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`priceDate` varchar(32) NOT NULL,
	`regionCode` varchar(64) NOT NULL,
	`regionName` varchar(128) NOT NULL,
	`hogPriceScaled` int NOT NULL,
	`hogChangeScaled` int NOT NULL,
	`cornPriceScaled` int NOT NULL,
	`cornChangeScaled` int NOT NULL,
	`soymealPriceScaled` int NOT NULL,
	`soymealChangeScaled` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_hog_price_daily_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pork_futures_price` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractMonth` varchar(32) NOT NULL,
	`futuresPriceScaled` int NOT NULL,
	`settlementPriceScaled` int NOT NULL,
	`volume` int NOT NULL,
	`openInterest` int NOT NULL,
	`observedMinute` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_futures_price_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `inventory_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchCode` varchar(96) NOT NULL,
	`partCode` varchar(96) NOT NULL,
	`partName` varchar(128) NOT NULL,
	`warehouseCode` varchar(64) NOT NULL,
	`warehouseName` varchar(128) NOT NULL,
	`weightKg` int NOT NULL,
	`unitCostScaled` int NOT NULL,
	`currentPriceScaled` int NOT NULL,
	`storageEntryDate` varchar(32) NOT NULL,
	`ageDays` int NOT NULL,
	`expiryDate` varchar(32) NOT NULL,
	`status` enum('frozen','selling','expired','cleared') NOT NULL,
	`fifoPriority` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_batches_batchCode_unique` UNIQUE(`batchCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `warehouse_capacity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warehouseCode` varchar(64) NOT NULL,
	`warehouseName` varchar(128) NOT NULL,
	`regionCode` varchar(64) NOT NULL,
	`regionName` varchar(128) NOT NULL,
	`totalCapacityKg` int NOT NULL,
	`currentOccupancyKg` int NOT NULL,
	`utilizationRate` int NOT NULL,
	`tempZone` enum('cold','frozen','deep_frozen') NOT NULL,
	`facilityType` enum('owned','leased','shared') NOT NULL,
	`fixedCostMonthly` int NOT NULL,
	`variableCostPerKg` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouse_capacity_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_capacity_warehouseCode_unique` UNIQUE(`warehouseCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `production_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleCode` varchar(96) NOT NULL,
	`scenarioMonth` int NOT NULL,
	`factoryCode` varchar(64) NOT NULL,
	`factoryName` varchar(128) NOT NULL,
	`productLine` enum('slaughter','cutting','processing','cold_storage') NOT NULL,
	`scheduledQuantity` int NOT NULL,
	`completedQuantity` int NOT NULL,
	`executionRate` int NOT NULL,
	`scheduledDate` varchar(32) NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`scheduleStatus` enum('planned','in_progress','completed','cancelled') NOT NULL,
	`bottleneckStage` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_schedule_scheduleCode_unique` UNIQUE(`scheduleCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `supply_chain_cost` (
	`id` int AUTO_INCREMENT NOT NULL,
	`costCode` varchar(96) NOT NULL,
	`costCategory` enum('breeding','feed','logistics','storage','processing','capital','inspection','insurance','tax','other') NOT NULL,
	`costItem` varchar(128) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`unitCostScaled` int NOT NULL,
	`quantity` int NOT NULL,
	`totalCostScaled` int NOT NULL,
	`effectiveDate` varchar(32) NOT NULL,
	`expiryDate` varchar(32),
	`regionCode` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supply_chain_cost_id` PRIMARY KEY(`id`),
	CONSTRAINT `supply_chain_cost_costCode_unique` UNIQUE(`costCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `price_forecast` (
	`id` int AUTO_INCREMENT NOT NULL,
	`forecastCode` varchar(96) NOT NULL,
	`commodityCode` varchar(64) NOT NULL,
	`commodityName` varchar(128) NOT NULL,
	`forecastDate` varchar(32) NOT NULL,
	`forecastPeriod` enum('1w','2w','1m','3m','6m') NOT NULL,
	`predictedPriceScaled` int NOT NULL,
	`confidenceLevel` int NOT NULL,
	`modelVersion` varchar(64) NOT NULL,
	`featureImportanceJson` text,
	`actualPriceScaled` int,
	`predictionErrorScaled` int,
	`accuracyScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_forecast_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_forecast_forecastCode_unique` UNIQUE(`forecastCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `arbitrage_execution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionCode` varchar(96) NOT NULL,
	`arbitrageType` enum('time','spatial','entity','financial','transmission','breeding','zero_waste','channel','capacity','cash_flow','policy','brand','info','counter_cyclical','cross_border','compliance','joint','green') NOT NULL,
	`scenarioLabel` varchar(128) NOT NULL,
	`triggerStatus` enum('active','watch','inactive') NOT NULL,
	`expectedReturnScaled` int NOT NULL,
	`actualReturnScaled` int,
	`executionQuantity` int NOT NULL,
	`executionPriceScaled` int NOT NULL,
	`executionDate` varchar(32) NOT NULL,
	`closeDate` varchar(32),
	`executionStatus` enum('opened','closed','cancelled') NOT NULL,
	`riskLevel` enum('低','中','高') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arbitrage_execution_id` PRIMARY KEY(`id`),
	CONSTRAINT `arbitrage_execution_executionCode_unique` UNIQUE(`executionCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `risk_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricCode` varchar(96) NOT NULL,
	`metricName` varchar(128) NOT NULL,
	`metricCategory` enum('market','credit','operational','compliance','liquidity') NOT NULL,
	`metricValue` int NOT NULL,
	`threshold` int NOT NULL,
	`metricStatus` enum('normal','warning','critical') NOT NULL,
	`trend` enum('up','down','stable') NOT NULL,
	`observedDate` varchar(32) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_metrics_metricCode_unique` UNIQUE(`metricCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(96) NOT NULL,
	`customerCode` varchar(64) NOT NULL,
	`customerName` varchar(128) NOT NULL,
	`channel` enum('restaurant','supermarket','wholesale','e_commerce','processing') NOT NULL,
	`partCode` varchar(64) NOT NULL,
	`partName` varchar(128) NOT NULL,
	`quantityKg` int NOT NULL,
	`unitPriceScaled` int NOT NULL,
	`totalAmountScaled` int NOT NULL,
	`orderDate` varchar(32) NOT NULL,
	`deliveryDate` varchar(32) NOT NULL,
	`orderStatus` enum('pending','confirmed','delivering','delivered','cancelled') NOT NULL,
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL,
	`deliveryAddress` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_orders_orderCode_unique` UNIQUE(`orderCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `procurement_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(96) NOT NULL,
	`supplierCode` varchar(64) NOT NULL,
	`supplierName` varchar(128) NOT NULL,
	`commodityCode` varchar(64) NOT NULL,
	`commodityName` varchar(128) NOT NULL,
	`quantityKg` int NOT NULL,
	`unitPriceScaled` int NOT NULL,
	`totalAmountScaled` int NOT NULL,
	`orderDate` varchar(32) NOT NULL,
	`expectedDeliveryDate` varchar(32) NOT NULL,
	`actualDeliveryDate` varchar(32),
	`qualityStatus` enum('pending','passed','rejected') NOT NULL,
	`procurementStatus` enum('pending','confirmed','delivered','cancelled') NOT NULL,
	`warehouseCode` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procurement_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_orders_orderCode_unique` UNIQUE(`orderCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `financial_statements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`statementCode` varchar(96) NOT NULL,
	`statementType` enum('income','balance','cash_flow') NOT NULL,
	`periodCode` varchar(32) NOT NULL,
	`periodName` varchar(128) NOT NULL,
	`revenueScaled` int NOT NULL,
	`costOfGoodsScaled` int NOT NULL,
	`grossProfitScaled` int NOT NULL,
	`operatingExpenseScaled` int NOT NULL,
	`netProfitScaled` int NOT NULL,
	`totalAssetsScaled` int NOT NULL,
	`totalLiabilitiesScaled` int NOT NULL,
	`totalEquityScaled` int NOT NULL,
	`cashFlowFromOperationsScaled` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_statements_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_statements_statementCode_unique` UNIQUE(`statementCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cash_flow_forecast` (
	`id` int AUTO_INCREMENT NOT NULL,
	`forecastCode` varchar(96) NOT NULL,
	`forecastDate` varchar(32) NOT NULL,
	`cashInflowScaled` int NOT NULL,
	`cashOutflowScaled` int NOT NULL,
	`netCashFlowScaled` int NOT NULL,
	`openingBalanceScaled` int NOT NULL,
	`closingBalanceScaled` int NOT NULL,
	`fundingGapScaled` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_flow_forecast_id` PRIMARY KEY(`id`),
	CONSTRAINT `cash_flow_forecast_forecastCode_unique` UNIQUE(`forecastCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `policy_incentives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyCode` varchar(96) NOT NULL,
	`policyName` varchar(256) NOT NULL,
	`policyType` enum('subsidy','tax_reduction','storage_support','breeding_support','insurance','loan_support') NOT NULL,
	`applicableRegion` varchar(128) NOT NULL,
	`eligibleCriteria` text NOT NULL,
	`subsidyAmountScaled` int NOT NULL,
	`applicationDeadline` varchar(32),
	`effectiveDate` varchar(32) NOT NULL,
	`expiryDate` varchar(32),
	`policyStatus` enum('active','expired','pending') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policy_incentives_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_incentives_policyCode_unique` UNIQUE(`policyCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `quality_inspection` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionCode` varchar(96) NOT NULL,
	`batchCode` varchar(96) NOT NULL,
	`inspectionType` enum('entry','process','exit','random') NOT NULL,
	`inspectionDate` varchar(32) NOT NULL,
	`inspectorName` varchar(128) NOT NULL,
	`temperature` decimal(5,2),
	`moisture` decimal(5,2),
	`bacteriaCount` int,
	`foreignMatter` decimal(5,2),
	`colorScore` int,
	`smellScore` int,
	`inspectionResult` enum('passed','rejected','conditional') NOT NULL,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quality_inspection_id` PRIMARY KEY(`id`),
	CONSTRAINT `quality_inspection_inspectionCode_unique` UNIQUE(`inspectionCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cold_chain_logistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logisticsCode` varchar(96) NOT NULL,
	`orderCode` varchar(96) NOT NULL,
	`vehicleCode` varchar(64) NOT NULL,
	`driverName` varchar(128) NOT NULL,
	`driverPhone` varchar(32) NOT NULL,
	`originWarehouse` varchar(128) NOT NULL,
	`destination` varchar(128) NOT NULL,
	`cargoType` varchar(64) NOT NULL,
	`cargoWeightKg` int NOT NULL,
	`temperature` decimal(5,2) NOT NULL,
	`humidity` decimal(5,2),
	`departureTime` timestamp NOT NULL,
	`estimatedArrivalTime` timestamp NOT NULL,
	`actualArrivalTime` timestamp,
	`transportCostScaled` int NOT NULL,
	`lossRate` decimal(5,2),
	`logisticsStatus` enum('in_transit','delivered','delayed','exception') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cold_chain_logistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `cold_chain_logistics_logisticsCode_unique` UNIQUE(`logisticsCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brand_certification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificationCode` varchar(96) NOT NULL,
	`certificationType` enum('green_food','organic','geographic_indication','traceability','quality_standard','haccp') NOT NULL,
	`certificationName` varchar(256) NOT NULL,
	`issuingAuthority` varchar(128) NOT NULL,
	`certificateNumber` varchar(128) NOT NULL,
	`issueDate` varchar(32) NOT NULL,
	`expiryDate` varchar(32) NOT NULL,
	`applicableProducts` text NOT NULL,
	`premiumRate` int NOT NULL,
	`certStatus` enum('active','expired','suspended') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_certification_id` PRIMARY KEY(`id`),
	CONSTRAINT `brand_certification_certificationCode_unique` UNIQUE(`certificationCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `supplier_management` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierCode` varchar(64) NOT NULL,
	`supplierName` varchar(256) NOT NULL,
	`supplierType` enum('hog_breeding','feed','logistics','storage','processing','equipment','service') NOT NULL,
	`contactPerson` varchar(128) NOT NULL,
	`contactPhone` varchar(32) NOT NULL,
	`address` text NOT NULL,
	`creditRating` enum('A','B','C','D') NOT NULL,
	`cooperationStartDate` varchar(32) NOT NULL,
	`annualTransactionAmountScaled` int NOT NULL,
	`paymentTerms` varchar(64) NOT NULL,
	`supplierStatus` enum('active','inactive','blacklisted') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_management_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_management_supplierCode_unique` UNIQUE(`supplierCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customer_management` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerCode` varchar(64) NOT NULL,
	`customerName` varchar(256) NOT NULL,
	`customerType` enum('restaurant','supermarket','wholesale','e_commerce','processing','retail') NOT NULL,
	`channel` enum('ho_re_ca','retail','e_commerce','wholesale') NOT NULL,
	`contactPerson` varchar(128) NOT NULL,
	`contactPhone` varchar(32) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`creditLimitScaled` int NOT NULL,
	`currentCreditUsedScaled` int NOT NULL,
	`paymentTerms` varchar(64) NOT NULL,
	`annualVolumeKg` int NOT NULL,
	`lastOrderDate` varchar(32),
	`customerStatus` enum('active','inactive','blacklisted') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_management_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_management_customerCode_unique` UNIQUE(`customerCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `capacity_allocation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`allocationCode` varchar(96) NOT NULL,
	`factoryCode` varchar(64) NOT NULL,
	`factoryName` varchar(128) NOT NULL,
	`productLine` enum('slaughter','cutting','processing','cold_storage') NOT NULL,
	`allocatedCapacityKg` int NOT NULL,
	`utilizedCapacityKg` int NOT NULL,
	`utilizationRate` int NOT NULL,
	`idleCapacityKg` int NOT NULL,
	`idleCostSavingPotentialScaled` int NOT NULL,
	`sharingEnabled` boolean NOT NULL DEFAULT false,
	`allocationDate` varchar(32) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capacity_allocation_id` PRIMARY KEY(`id`),
	CONSTRAINT `capacity_allocation_allocationCode_unique` UNIQUE(`allocationCode`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `environmental_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricCode` varchar(96) NOT NULL,
	`facilityCode` varchar(64) NOT NULL,
	`facilityName` varchar(128) NOT NULL,
	`metricType` enum('energy','water','waste','emission','carbon') NOT NULL,
	`metricValue` int NOT NULL,
	`unit` varchar(32) NOT NULL,
	`targetValue` int NOT NULL,
	`complianceStatus` enum('compliant','warning','violation') NOT NULL,
	`observedDate` varchar(32) NOT NULL,
	`costSavingScaled` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `environmental_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `environmental_metrics_metricCode_unique` UNIQUE(`metricCode`)
);
