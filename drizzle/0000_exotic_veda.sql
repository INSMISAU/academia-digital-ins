CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`score` integer NOT NULL,
	`answers` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'valido' NOT NULL,
	`version` integer NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_enrollmentId_unique` ON `certificates` (`enrollmentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_code_unique` ON `certificates` (`code`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`title` text NOT NULL,
	`trainer` text NOT NULL,
	`starts` text NOT NULL,
	`ends` text NOT NULL,
	`capacity` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`hours` integer DEFAULT 1 NOT NULL,
	`pass` integer DEFAULT 80 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`external` text,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`participant` text NOT NULL,
	`province` text NOT NULL,
	`institution` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_participant_course` ON `enrollments` (`participant`,`courseId`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`module` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`enrollmentId` text NOT NULL,
	`lessonId` text NOT NULL,
	`completed` text NOT NULL,
	PRIMARY KEY(`enrollmentId`, `lessonId`),
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`prompt` text NOT NULL,
	`options` text NOT NULL,
	`answer` integer NOT NULL,
	`explanation` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`comment` text NOT NULL,
	`decision` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
