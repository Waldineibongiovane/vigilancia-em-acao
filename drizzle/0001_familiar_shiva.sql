CREATE TABLE `audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`details` text,
	`entityType` varchar(100),
	`entityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulletins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('daily','weekly') NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`periodStart` bigint NOT NULL,
	`periodEnd` bigint NOT NULL,
	`generatedByAi` boolean NOT NULL DEFAULT true,
	`publishedAt` bigint,
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulletins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocol` varchar(20) NOT NULL,
	`date` bigint NOT NULL,
	`type` enum('standing_water','abandoned_lot','trash_accumulation','open_container','construction_debris','other') NOT NULL,
	`description` text,
	`neighborhoodId` int NOT NULL,
	`addressPrivate` text,
	`latPrivate` text,
	`lngPrivate` text,
	`photoUrl` text,
	`photoKey` text,
	`anonymous` boolean NOT NULL DEFAULT true,
	`reporterName` varchar(255),
	`reporterContact` varchar(255),
	`status` enum('received','in_analysis','confirmed','resolved','rejected','archived') NOT NULL DEFAULT 'received',
	`aiPriority` enum('low','medium','high','critical'),
	`aiSummary` text,
	`resolvedAt` bigint,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`),
	CONSTRAINT `complaints_protocol_unique` UNIQUE(`protocol`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` bigint NOT NULL,
	`confirmedCases` int NOT NULL DEFAULT 0,
	`suspectedCases` int NOT NULL DEFAULT 0,
	`deaths` int NOT NULL DEFAULT 0,
	`underInvestigation` int NOT NULL DEFAULT 0,
	`infestationIndex` text,
	`incidenceRate` text,
	`totalComplaints` int NOT NULL DEFAULT 0,
	`byNeighborhood` json,
	`source` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `neighborhoods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`lat` text,
	`lng` text,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`totalComplaints` int NOT NULL DEFAULT 0,
	`totalCases` int NOT NULL DEFAULT 0,
	`infestationIndex` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `neighborhoods_id` PRIMARY KEY(`id`),
	CONSTRAINT `neighborhoods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
