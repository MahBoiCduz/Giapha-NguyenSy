CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clan_editors` (
	`id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'editor',
	`joined_at` text DEFAULT '(datetime(''now''))',
	FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ce_clan_idx` ON `clan_editors` (`clan_id`);--> statement-breakpoint
CREATE INDEX `ce_user_idx` ON `clan_editors` (`user_id`);--> statement-breakpoint
CREATE TABLE `clans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`origin` text,
	`cover_image_url` text,
	`is_public` integer DEFAULT 0,
	`access_code_hash` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `marriages` (
	`id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`partner_1_id` text NOT NULL,
	`partner_2_id` text NOT NULL,
	`marriage_date` text,
	`divorce_date` text,
	`is_active` integer DEFAULT 1,
	`notes` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner_1_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner_2_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `marriages_clan_idx` ON `marriages` (`clan_id`);--> statement-breakpoint
CREATE INDEX `marriages_p1_idx` ON `marriages` (`partner_1_id`);--> statement-breakpoint
CREATE INDEX `marriages_p2_idx` ON `marriages` (`partner_2_id`);--> statement-breakpoint
CREATE TABLE `member_media` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`media_type` text DEFAULT 'photo',
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT '(datetime(''now''))',
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_member_idx` ON `member_media` (`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`family_name` text NOT NULL,
	`middle_name` text,
	`given_name` text NOT NULL,
	`full_name` text NOT NULL,
	`alias` text,
	`gender` text NOT NULL,
	`birth_date` text,
	`birth_date_lunar` text,
	`death_date` text,
	`death_date_lunar` text,
	`is_living` integer DEFAULT 1,
	`photo_url` text,
	`biography` text,
	`address` text,
	`education` text,
	`occupation` text,
	`blood_type` text,
	`phone` text,
	`email` text,
	`generation` integer DEFAULT 1,
	`birth_order` integer,
	`notes` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text DEFAULT '(datetime(''now''))',
	FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_clan_idx` ON `members` (`clan_id`);--> statement-breakpoint
CREATE INDEX `members_fullname_idx` ON `members` (`full_name`);--> statement-breakpoint
CREATE INDEX `members_generation_idx` ON `members` (`generation`);--> statement-breakpoint
CREATE TABLE `parent_child_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`parent_id` text NOT NULL,
	`child_id` text NOT NULL,
	`marriage_id` text,
	`relationship_type` text DEFAULT 'biological',
	`birth_order` integer,
	`notes` text,
	FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`marriage_id`) REFERENCES `marriages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pcr_clan_idx` ON `parent_child_relationships` (`clan_id`);--> statement-breakpoint
CREATE INDEX `pcr_parent_idx` ON `parent_child_relationships` (`parent_id`);--> statement-breakpoint
CREATE INDEX `pcr_child_idx` ON `parent_child_relationships` (`child_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
