CREATE TABLE `academy_package_launches` (
	`token` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `validation_academy_package_launches` (
	`token` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`enrollmentId` text NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL
);
