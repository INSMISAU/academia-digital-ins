CREATE TABLE `validation_academy_registration_forms` (
	`reference` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`owner` text NOT NULL,
	`emailKey` text NOT NULL,
	`payload` text NOT NULL,
	`certificateName` text NOT NULL,
	`notice` text NOT NULL,
	`created` text NOT NULL,
	`verifiedContact` text,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_registration_owner_course` ON `validation_academy_registration_forms` (`owner`,`courseId`);--> statement-breakpoint
CREATE UNIQUE INDEX `validation_registration_email_course` ON `validation_academy_registration_forms` (`emailKey`,`courseId`);--> statement-breakpoint
CREATE TABLE `validation_academy_registration_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`notice` text DEFAULT '' NOT NULL,
	`privacy` text
);
