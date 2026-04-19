CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(128) NOT NULL,
	`entityType` varchar(128) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`relatedOrderId` varchar(64),
	`operatorRole` enum('admin','strategist','executor') NOT NULL,
	`operatorName` varchar(128) NOT NULL,
	`riskLevel` enum('低','中','高') NOT NULL,
	`decision` text NOT NULL,
	`beforeValue` text NOT NULL,
	`afterValue` text NOT NULL,
	`status` enum('已确认','待审批','已执行') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispatch_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`batchCode` varchar(64) NOT NULL,
	`scenarioMonth` int NOT NULL,
	`factory` varchar(128) NOT NULL,
	`quantity` int NOT NULL,
	`scheduledLabel` varchar(64) NOT NULL,
	`acceptanceStandard` text NOT NULL,
	`priority` enum('P1','P2','P3') NOT NULL,
	`payloadJson` text NOT NULL,
	`currentStatus` enum('待确认','已接单','执行中','已完成','超时升级') NOT NULL,
	`isEscalated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispatch_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `dispatch_orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `dispatch_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`role` enum('厂长','司机','仓储管理员') NOT NULL,
	`status` enum('待确认','已接单','执行中','已完成','超时升级') NOT NULL,
	`etaMinutes` int NOT NULL,
	`note` text NOT NULL,
	`acknowledgedBy` varchar(128),
	`acknowledgedAt` timestamp,
	`receiptBy` varchar(128),
	`receiptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispatch_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('wecom','sms','owner') NOT NULL,
	`relatedAlertId` varchar(64),
	`relatedOrderId` varchar(64),
	`targetLabel` varchar(128) NOT NULL,
	`payloadSummary` text NOT NULL,
	`deliveryStatus` enum('pending','sent','failed','skipped') NOT NULL,
	`providerMessageId` varchar(128),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `notification_deliveries_id` PRIMARY KEY(`id`)
);
