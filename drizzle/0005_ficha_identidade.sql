CREATE TABLE `registration_identity_flows` (
	`state` text PRIMARY KEY NOT NULL,
	`ticket` text NOT NULL,
	`owner` text NOT NULL,
	`origin` text NOT NULL,
	`provider` text NOT NULL,
	`nonce` text NOT NULL,
	`verifier` text NOT NULL,
	`browser` text,
	`phase` text NOT NULL,
	`expires` integer NOT NULL,
	`account` text,
	`name` text,
	`email` text,
	`trusted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_identity_flows_ticket_unique` ON `registration_identity_flows` (`ticket`);--> statement-breakpoint
CREATE TABLE `registration_mail_checks` (
	`account` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`digest` text NOT NULL,
	`tries` integer NOT NULL,
	`expires` integer NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registration_mail_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registration_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`trusted` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `academy_registration_forms` ADD `verifiedContact` text;--> statement-breakpoint
ALTER TABLE `academy_registration_settings` ADD `privacy` text;