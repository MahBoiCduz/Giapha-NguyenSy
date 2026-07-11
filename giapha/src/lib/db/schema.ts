import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

// ==================== Auth.js Tables ====================
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified"),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ==================== Clans ====================
export const clans = sqliteTable("clans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  origin: text("origin"),
  coverImageUrl: text("cover_image_url"),
  isPublic: integer("is_public").default(0),
  accessCodeHash: text("access_code_hash"),
  createdAt: text("created_at").default("(datetime('now'))"),
  updatedAt: text("updated_at").default("(datetime('now'))"),
});

// ==================== Members ====================
export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    clanId: text("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    familyName: text("family_name").notNull(),
    middleName: text("middle_name"),
    givenName: text("given_name").notNull(),
    fullName: text("full_name").notNull(),
    alias: text("alias"),
    gender: text("gender", { enum: ["male", "female"] }).notNull(),
    birthDate: text("birth_date"),
    birthDateLunar: text("birth_date_lunar"),
    deathDate: text("death_date"),
    deathDateLunar: text("death_date_lunar"),
    isLiving: integer("is_living").default(1),
    photoUrl: text("photo_url"),
    biography: text("biography"),
    address: text("address"),
    education: text("education"),
    occupation: text("occupation"),
    bloodType: text("blood_type"),
    phone: text("phone"),
    email: text("email"),
    generation: integer("generation").default(1),
    birthOrder: integer("birth_order"),
    notes: text("notes"),
    createdAt: text("created_at").default("(datetime('now'))"),
    updatedAt: text("updated_at").default("(datetime('now'))"),
  },
  (table) => [
    index("members_clan_idx").on(table.clanId),
    index("members_fullname_idx").on(table.fullName),
    index("members_generation_idx").on(table.generation),
  ]
);

// ==================== Marriages ====================
export const marriages = sqliteTable(
  "marriages",
  {
    id: text("id").primaryKey(),
    clanId: text("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    partner1Id: text("partner_1_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    partner2Id: text("partner_2_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    marriageDate: text("marriage_date"),
    divorceDate: text("divorce_date"),
    isActive: integer("is_active").default(1),
    notes: text("notes"),
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => [
    index("marriages_clan_idx").on(table.clanId),
    index("marriages_p1_idx").on(table.partner1Id),
    index("marriages_p2_idx").on(table.partner2Id),
  ]
);

// ==================== Parent-Child Relationships ====================
export const parentChildRelationships = sqliteTable(
  "parent_child_relationships",
  {
    id: text("id").primaryKey(),
    clanId: text("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    parentId: text("parent_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    childId: text("child_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    marriageId: text("marriage_id").references(() => marriages.id, {
      onDelete: "set null",
    }),
    relationshipType: text("relationship_type").default("biological"),
    birthOrder: integer("birth_order"),
    notes: text("notes"),
  },
  (table) => [
    index("pcr_clan_idx").on(table.clanId),
    index("pcr_parent_idx").on(table.parentId),
    index("pcr_child_idx").on(table.childId),
  ]
);

// ==================== Member Media ====================
export const memberMedia = sqliteTable(
  "member_media",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    mediaType: text("media_type").default("photo"),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => [index("media_member_idx").on(table.memberId)]
);

// ==================== Clan Editors ====================
export const clanEditors = sqliteTable(
  "clan_editors",
  {
    id: text("id").primaryKey(),
    clanId: text("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "editor", "viewer"] }).default("editor"),
    joinedAt: text("joined_at").default("(datetime('now'))"),
  },
  (table) => [
    index("ce_clan_idx").on(table.clanId),
    index("ce_user_idx").on(table.userId),
  ]
);
