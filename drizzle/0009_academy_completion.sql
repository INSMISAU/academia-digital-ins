CREATE TABLE `academy_certificate_metadata` (
	`certificateId` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires` text
);
--> statement-breakpoint
CREATE TABLE `academy_course_approvals` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`approved` integer NOT NULL,
	`note` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_course_trash` (
	`courseId` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_discussions` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`lessonId` text NOT NULL,
	`parentId` text NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`state` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_discussions_course_created` ON `academy_discussions` (`courseId`,`created`);--> statement-breakpoint
CREATE TABLE `academy_editorial_drafts` (
	`entryId` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_editorial_publications` (
	`entryId` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer NOT NULL,
	`published` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_editorial_publications_slug_unique` ON `academy_editorial_publications` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_enrollment_state` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`expires` text,
	`approvedBy` text,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_event_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`registrationId` text NOT NULL,
	`sessionId` text NOT NULL,
	`present` integer NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_event_attendance_registration_session` ON `academy_event_attendance` (`registrationId`,`sessionId`);--> statement-breakpoint
CREATE TABLE `academy_event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`state` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_event_registrations_event_account` ON `academy_event_registrations` (`eventId`,`account`);--> statement-breakpoint
CREATE INDEX `academy_event_registrations_event_state` ON `academy_event_registrations` (`eventId`,`state`,`created`);--> statement-breakpoint
CREATE TABLE `academy_exam_events` (
	`id` text PRIMARY KEY NOT NULL,
	`runId` text NOT NULL,
	`kind` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_job_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`until` text NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`statement` text NOT NULL,
	`created` text NOT NULL,
	`delivered` text
);
--> statement-breakpoint
CREATE TABLE `academy_mail_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer NOT NULL,
	`available` text NOT NULL,
	`lease` text,
	`lastError` text NOT NULL,
	`sent` text
);
--> statement-breakpoint
CREATE TABLE `academy_media_details` (
	`mediaId` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`purpose` text NOT NULL,
	`metadata` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text NOT NULL,
	`readAt` text,
	`created` text NOT NULL,
	`dedupe` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_notifications_dedupe_unique` ON `academy_notifications` (`dedupe`);--> statement-breakpoint
CREATE INDEX `academy_notifications_account_created` ON `academy_notifications` (`account`,`created`);--> statement-breakpoint
CREATE TABLE `academy_package_states` (
	`id` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_package_states_package_enrollment` ON `academy_package_states` (`packageId`,`enrollmentId`);--> statement-breakpoint
CREATE TABLE `academy_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`lessonId` text NOT NULL,
	`standard` text NOT NULL,
	`manifest` text NOT NULL,
	`files` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`courseId` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`state` text NOT NULL,
	`providerId` text NOT NULL,
	`checkoutUrl` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_payments_account_course_state` ON `academy_payments` (`account`,`courseId`,`state`);--> statement-breakpoint
CREATE TABLE `academy_slug_redirects` (
	`slug` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `academy_study_time` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`lessonId` text NOT NULL,
	`seconds` integer NOT NULL,
	`lastSeen` integer NOT NULL,
	`session` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_study_time_enrollment_lesson` ON `academy_study_time` (`enrollmentId`,`lessonId`);--> statement-breakpoint
CREATE TABLE `academy_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignmentId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`body` text NOT NULL,
	`fileId` text NOT NULL,
	`state` text NOT NULL,
	`score` integer,
	`feedback` text NOT NULL,
	`revision` integer NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`grader` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_submissions_assignment_enrollment` ON `academy_submissions` (`assignmentId`,`enrollmentId`);--> statement-breakpoint
CREATE TABLE `validation_academy_certificate_metadata` (
	`certificateId` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires` text
);
--> statement-breakpoint
CREATE TABLE `validation_academy_course_approvals` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`approved` integer NOT NULL,
	`note` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_course_trash` (
	`courseId` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_discussions` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`lessonId` text NOT NULL,
	`parentId` text NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`state` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `validation_academy_discussions_course_created` ON `validation_academy_discussions` (`courseId`,`created`);--> statement-breakpoint
CREATE TABLE `validation_academy_editorial_drafts` (
	`entryId` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_editorial_publications` (
	`entryId` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer NOT NULL,
	`published` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_editorial_publications_slug_unique` ON `validation_academy_editorial_publications` (`slug`);--> statement-breakpoint
CREATE TABLE `validation_academy_enrollment_state` (
	`enrollmentId` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`expires` text,
	`approvedBy` text,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_event_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`registrationId` text NOT NULL,
	`sessionId` text NOT NULL,
	`present` integer NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_event_attendance_registration_session` ON `validation_academy_event_attendance` (`registrationId`,`sessionId`);--> statement-breakpoint
CREATE TABLE `validation_academy_event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`state` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_event_registrations_event_account` ON `validation_academy_event_registrations` (`eventId`,`account`);--> statement-breakpoint
CREATE INDEX `validation_academy_event_registrations_event_state` ON `validation_academy_event_registrations` (`eventId`,`state`,`created`);--> statement-breakpoint
CREATE TABLE `validation_academy_exam_events` (
	`id` text PRIMARY KEY NOT NULL,
	`runId` text NOT NULL,
	`kind` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_job_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`until` text NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`statement` text NOT NULL,
	`created` text NOT NULL,
	`delivered` text
);
--> statement-breakpoint
CREATE TABLE `validation_academy_mail_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer NOT NULL,
	`available` text NOT NULL,
	`lease` text,
	`lastError` text NOT NULL,
	`sent` text
);
--> statement-breakpoint
CREATE TABLE `validation_academy_media_details` (
	`mediaId` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`purpose` text NOT NULL,
	`metadata` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text NOT NULL,
	`readAt` text,
	`created` text NOT NULL,
	`dedupe` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_notifications_dedupe_unique` ON `validation_academy_notifications` (`dedupe`);--> statement-breakpoint
CREATE INDEX `validation_academy_notifications_account_created` ON `validation_academy_notifications` (`account`,`created`);--> statement-breakpoint
CREATE TABLE `validation_academy_package_states` (
	`id` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_package_states_package_enrollment` ON `validation_academy_package_states` (`packageId`,`enrollmentId`);--> statement-breakpoint
CREATE TABLE `validation_academy_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`lessonId` text NOT NULL,
	`standard` text NOT NULL,
	`manifest` text NOT NULL,
	`files` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`courseId` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`state` text NOT NULL,
	`providerId` text NOT NULL,
	`checkoutUrl` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `validation_academy_payments_account_course_state` ON `validation_academy_payments` (`account`,`courseId`,`state`);--> statement-breakpoint
CREATE TABLE `validation_academy_slug_redirects` (
	`slug` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_study_time` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`lessonId` text NOT NULL,
	`seconds` integer NOT NULL,
	`lastSeen` integer NOT NULL,
	`session` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_study_time_enrollment_lesson` ON `validation_academy_study_time` (`enrollmentId`,`lessonId`);--> statement-breakpoint
CREATE TABLE `validation_academy_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignmentId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`body` text NOT NULL,
	`fileId` text NOT NULL,
	`state` text NOT NULL,
	`score` integer,
	`feedback` text NOT NULL,
	`revision` integer NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`grader` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `validation_academy_submissions_assignment_enrollment` ON `validation_academy_submissions` (`assignmentId`,`enrollmentId`);