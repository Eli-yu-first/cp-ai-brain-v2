CREATE TABLE `cp_venture_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(96) NOT NULL,
	`name` varchar(128) NOT NULL,
	`englishName` varchar(160) NOT NULL,
	`domain` varchar(64) NOT NULL,
	`stage` varchar(64) NOT NULL,
	`depth` int NOT NULL,
	`x` int NOT NULL,
	`y` int NOT NULL,
	`relation` varchar(160) NOT NULL,
	`logoDomain` varchar(160),
	`ownershipSummary` text,
	`boardRole` text,
	`cpRole` text NOT NULL,
	`participation` text NOT NULL,
	`business` text NOT NULL,
	`synergy` text NOT NULL,
	`geography` varchar(160) NOT NULL,
	`evidence` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cp_venture_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `cp_venture_companies_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `cp_venture_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` varchar(192) NOT NULL,
	`source` varchar(96) NOT NULL,
	`target` varchar(96) NOT NULL,
	`type` varchar(64) NOT NULL,
	`strength` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cp_venture_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `cp_venture_links_linkId_unique` UNIQUE(`linkId`)
);
