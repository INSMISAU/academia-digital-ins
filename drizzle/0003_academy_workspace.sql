CREATE TABLE `academy_assessment_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`assessmentId` text NOT NULL,
	`stage` text NOT NULL,
	`state` text NOT NULL,
	`started` text NOT NULL,
	`deadline` text,
	`snapshot` text NOT NULL,
	`answers` text,
	`review` text,
	`score` integer,
	`submitted` text,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `academy_assessment_runs_enrollment` ON `academy_assessment_runs` (`enrollmentId`,`assessmentId`,`started`);--> statement-breakpoint
CREATE UNIQUE INDEX `academy_assessment_one_active` ON `academy_assessment_runs` (`enrollmentId`,`assessmentId`) WHERE state = 'active';--> statement-breakpoint
CREATE TABLE `academy_attendance` (
	`cohortId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`sessionDate` text NOT NULL,
	`state` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`cohortId`, `enrollmentId`, `sessionDate`),
	FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `academy_cohort_members` (
	`cohortId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`cohortId`, `enrollmentId`),
	FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `academy_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_entries_kind_status` ON `academy_entries` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `academy_entry_history` (
	`entryId` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`entryId`, `revision`)
);
--> statement-breakpoint
CREATE TABLE `validation_academy_assessment_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`assessmentId` text NOT NULL,
	`stage` text NOT NULL,
	`state` text NOT NULL,
	`started` text NOT NULL,
	`deadline` text,
	`snapshot` text NOT NULL,
	`answers` text,
	`review` text,
	`score` integer,
	`submitted` text,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `validation_academy_assessment_runs_enrollment` ON `validation_academy_assessment_runs` (`enrollmentId`,`assessmentId`,`started`);--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_assessment_one_active` ON `validation_academy_assessment_runs` (`enrollmentId`,`assessmentId`) WHERE state = 'active';--> statement-breakpoint
CREATE TABLE `validation_academy_attendance` (
	`cohortId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`sessionDate` text NOT NULL,
	`state` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`cohortId`, `enrollmentId`, `sessionDate`),
	FOREIGN KEY (`cohortId`) REFERENCES `validation_cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_academy_cohort_members` (
	`cohortId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`cohortId`, `enrollmentId`),
	FOREIGN KEY (`cohortId`) REFERENCES `validation_cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollmentId`) REFERENCES `validation_enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validation_academy_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `validation_academy_entries_kind_status` ON `validation_academy_entries` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `validation_academy_entry_history` (
	`entryId` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`entryId`, `revision`)
);
