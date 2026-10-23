CREATE TABLE `validation_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`score` integer NOT NULL,
	`answers` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'valido' NOT NULL,
	`version` integer NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_certificates_enrollmentId_unique` ON `validation_certificates` (`enrollmentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `validation_certificates_code_unique` ON `validation_certificates` (`code`);--> statement-breakpoint
CREATE TABLE `validation_cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`title` text NOT NULL,
	`trainer` text NOT NULL,
	`starts` text NOT NULL,
	`ends` text NOT NULL,
	`capacity` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_courses` (
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
CREATE TABLE `validation_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`participant` text NOT NULL,
	`province` text NOT NULL,
	`institution` text NOT NULL,
	`visitorKey` text,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_enrollment_participant_course` ON `validation_enrollments` (`participant`,`courseId`);--> statement-breakpoint
CREATE INDEX `validation_enrollment_visitor` ON `validation_enrollments` (`visitorKey`);--> statement-breakpoint
CREATE TABLE `validation_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`module` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_progress` (
	`enrollmentId` text NOT NULL,
	`lessonId` text NOT NULL,
	`completed` text NOT NULL,
	PRIMARY KEY(`enrollmentId`, `lessonId`),
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lessonId`) REFERENCES `validation_lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`prompt` text NOT NULL,
	`options` text NOT NULL,
	`answer` integer NOT NULL,
	`explanation` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`comment` text NOT NULL,
	`decision` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `validation_courses`(`id`) ON UPDATE no action ON DELETE no action
);
