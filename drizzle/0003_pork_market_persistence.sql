CREATE TABLE `pork_market_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotId` varchar(96) NOT NULL,
	`timeframe` varchar(32) NOT NULL,
	`regionCode` varchar(64) NOT NULL,
	`regionName` varchar(128) NOT NULL,
	`sourceStatus` varchar(64) NOT NULL,
	`sourceSummary` text NOT NULL,
	`benchmarkQuotesJson` text NOT NULL,
	`commodityQuotesJson` text NOT NULL,
	`regionQuotesJson` text NOT NULL,
	`partQuotesJson` text NOT NULL,
	`inventoryBatchesJson` text NOT NULL,
	`generatedAtMs` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_market_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `pork_market_snapshots_snapshotId_unique` UNIQUE(`snapshotId`)
);
--> statement-breakpoint
CREATE TABLE `pork_price_ticks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tickKey` varchar(192) NOT NULL,
	`snapshotId` varchar(96) NOT NULL,
	`quoteType` enum('spot','futures','benchmark','region','part') NOT NULL,
	`code` varchar(96) NOT NULL,
	`name` varchar(128) NOT NULL,
	`regionCode` varchar(64),
	`regionName` varchar(128),
	`priceScaled` int NOT NULL,
	`changeScaled` int NOT NULL,
	`unit` varchar(32) NOT NULL,
	`source` varchar(128) NOT NULL,
	`observedMinute` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_price_ticks_id` PRIMARY KEY(`id`),
	CONSTRAINT `pork_price_ticks_tickKey_unique` UNIQUE(`tickKey`)
);
--> statement-breakpoint
CREATE TABLE `pork_part_quote_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rowKey` varchar(192) NOT NULL,
	`snapshotId` varchar(96) NOT NULL,
	`partCode` varchar(96) NOT NULL,
	`partName` varchar(128) NOT NULL,
	`category` enum('A','B','C') NOT NULL,
	`spotPriceScaled` int NOT NULL,
	`frozenPriceScaled` int NOT NULL,
	`futuresMappedPriceScaled` int NOT NULL,
	`predictedPriceScaled` int NOT NULL,
	`basisScaled` int NOT NULL,
	`changeScaled` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_part_quote_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `pork_part_quote_snapshots_rowKey_unique` UNIQUE(`rowKey`)
);
--> statement-breakpoint
CREATE TABLE `pork_inventory_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rowKey` varchar(192) NOT NULL,
	`snapshotId` varchar(96) NOT NULL,
	`batchCode` varchar(96) NOT NULL,
	`partCode` varchar(96) NOT NULL,
	`partName` varchar(128) NOT NULL,
	`warehouse` varchar(128) NOT NULL,
	`weightKg` int NOT NULL,
	`unitCostScaled` int NOT NULL,
	`ageDays` int NOT NULL,
	`currentSpotPriceScaled` int NOT NULL,
	`futuresMappedPriceScaled` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pork_inventory_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `pork_inventory_snapshots_rowKey_unique` UNIQUE(`rowKey`)
);
