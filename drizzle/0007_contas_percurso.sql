CREATE TABLE `academy_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_accounts_email_unique` ON `academy_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `academy_learning_preferences` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`lastLesson` text,
	`visited` text,
	`archived` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `academy_password_resets` (
	`account` text PRIMARY KEY NOT NULL,
	`digest` text NOT NULL,
	`expires` integer NOT NULL,
	`tries` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_accounts_email_unique` ON `validation_academy_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `validation_academy_learning_preferences` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`lastLesson` text,
	`visited` text,
	`archived` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_academy_password_resets` (
	`account` text PRIMARY KEY NOT NULL,
	`digest` text NOT NULL,
	`expires` integer NOT NULL,
	`tries` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_registration_mail_checks` (
	`account` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`digest` text NOT NULL,
	`tries` integer NOT NULL,
	`expires` integer NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_registration_mail_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_registration_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`trusted` integer NOT NULL,
	`expires` integer NOT NULL
);
