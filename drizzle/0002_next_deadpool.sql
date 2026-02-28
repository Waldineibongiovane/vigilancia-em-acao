CREATE TABLE `adminLocal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`lastLogin` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminLocal_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminLocal_username_unique` UNIQUE(`username`)
);
