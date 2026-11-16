CREATE TABLE `academy_institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_mfa` (
	`account` text PRIMARY KEY NOT NULL,
	`cipher` text NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`lastStep` integer DEFAULT -1 NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_mfa_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_resource_scopes` (
	`kind` text NOT NULL,
	`resourceId` text NOT NULL,
	`institutionId` text DEFAULT '' NOT NULL,
	`ownerAccount` text DEFAULT '' NOT NULL,
	`courseId` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`kind`, `resourceId`)
);
--> statement-breakpoint
CREATE TABLE `academy_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`role` text NOT NULL,
	`institutionId` text DEFAULT '' NOT NULL,
	`courseId` text DEFAULT '' NOT NULL,
	`cohortId` text DEFAULT '' NOT NULL,
	`canPublish` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_roles_account` ON `academy_roles` (`account`);--> statement-breakpoint
CREATE TABLE `validation_academy_institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_mfa` (
	`account` text PRIMARY KEY NOT NULL,
	`cipher` text NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`lastStep` integer DEFAULT -1 NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_mfa_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_resource_scopes` (
	`kind` text NOT NULL,
	`resourceId` text NOT NULL,
	`institutionId` text DEFAULT '' NOT NULL,
	`ownerAccount` text DEFAULT '' NOT NULL,
	`courseId` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`kind`, `resourceId`)
);
--> statement-breakpoint
CREATE TABLE `validation_academy_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`role` text NOT NULL,
	`institutionId` text DEFAULT '' NOT NULL,
	`courseId` text DEFAULT '' NOT NULL,
	`cohortId` text DEFAULT '' NOT NULL,
	`canPublish` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `validation_academy_roles_account` ON `validation_academy_roles` (`account`);--> statement-breakpoint
ALTER TABLE `audit` ADD `actor` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit` ADD `institution` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit` ADD `result` text DEFAULT 'permitido' NOT NULL;--> statement-breakpoint
ALTER TABLE `validation_audit` ADD `actor` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `validation_audit` ADD `institution` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `validation_audit` ADD `result` text DEFAULT 'permitido' NOT NULL;