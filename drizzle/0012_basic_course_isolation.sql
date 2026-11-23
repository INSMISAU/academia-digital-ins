CREATE TABLE IF NOT EXISTS `basic_course_editions` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`state` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`author` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `basic_course_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`revision` integer NOT NULL,
	`state` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`author` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `validation_basic_course_editions` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`state` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`author` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `validation_basic_course_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`revision` integer NOT NULL,
	`state` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	`author` text NOT NULL
);
