/**
 * Seed script — creates local SQLite DB, pushes schema, and creates a test user.
 * Usage: npx tsx scripts/seed.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../src/lib/db/schema";

async function seed() {
  const dbPath = "file:.data/local.db";
  console.log(`Using local DB: ${dbPath}`);

  const client = createClient({ url: dbPath });
  const db = drizzle(client, { schema });

  // Create tables (push schema)
  console.log("Creating tables...");

  // Create all tables by running raw SQL
  const sql = `
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY,
      "name" text,
      "email" text NOT NULL UNIQUE,
      "emailVerified" integer,
      "image" text
    );

    CREATE TABLE IF NOT EXISTS "account" (
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "type" text NOT NULL,
      "provider" text NOT NULL,
      "providerAccountId" text NOT NULL,
      "refresh_token" text,
      "access_token" text,
      "expires_at" integer,
      "token_type" text,
      "scope" text,
      "id_token" text,
      "session_state" text,
      PRIMARY KEY ("provider", "providerAccountId")
    );

    CREATE TABLE IF NOT EXISTS "session" (
      "sessionToken" text PRIMARY KEY,
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "expires" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "verificationToken" (
      "identifier" text NOT NULL,
      "token" text NOT NULL,
      "expires" integer NOT NULL,
      PRIMARY KEY ("identifier", "token")
    );

    CREATE TABLE IF NOT EXISTS "clans" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "description" text,
      "origin" text,
      "cover_image_url" text,
      "is_public" integer DEFAULT 0,
      "access_code_hash" text,
      "created_at" text DEFAULT (datetime('now')),
      "updated_at" text DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS "members" (
      "id" text PRIMARY KEY,
      "clan_id" text NOT NULL REFERENCES "clans"("id") ON DELETE CASCADE,
      "family_name" text NOT NULL,
      "middle_name" text,
      "given_name" text NOT NULL,
      "full_name" text NOT NULL,
      "alias" text,
      "gender" text NOT NULL,
      "birth_date" text,
      "birth_date_lunar" text,
      "death_date" text,
      "death_date_lunar" text,
      "is_living" integer DEFAULT 1,
      "photo_url" text,
      "biography" text,
      "address" text,
      "education" text,
      "occupation" text,
      "blood_type" text,
      "phone" text,
      "email" text,
      "generation" integer DEFAULT 1,
      "birth_order" integer,
      "notes" text,
      "created_at" text DEFAULT (datetime('now')),
      "updated_at" text DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS "members_clan_idx" ON "members"("clan_id");
    CREATE INDEX IF NOT EXISTS "members_fullname_idx" ON "members"("full_name");
    CREATE INDEX IF NOT EXISTS "members_generation_idx" ON "members"("generation");

    CREATE TABLE IF NOT EXISTS "marriages" (
      "id" text PRIMARY KEY,
      "clan_id" text NOT NULL REFERENCES "clans"("id") ON DELETE CASCADE,
      "partner_1_id" text NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
      "partner_2_id" text NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
      "marriage_date" text,
      "divorce_date" text,
      "is_active" integer DEFAULT 1,
      "notes" text,
      "created_at" text DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS "parent_child_relationships" (
      "id" text PRIMARY KEY,
      "clan_id" text NOT NULL REFERENCES "clans"("id") ON DELETE CASCADE,
      "parent_id" text NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
      "child_id" text NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
      "marriage_id" text REFERENCES "marriages"("id") ON DELETE SET NULL,
      "relationship_type" text DEFAULT 'biological',
      "birth_order" integer,
      "notes" text
    );

    CREATE TABLE IF NOT EXISTS "member_media" (
      "id" text PRIMARY KEY,
      "member_id" text NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
      "url" text NOT NULL,
      "caption" text,
      "media_type" text DEFAULT 'photo',
      "sort_order" integer DEFAULT 0,
      "created_at" text DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS "clan_editors" (
      "id" text PRIMARY KEY,
      "clan_id" text NOT NULL REFERENCES "clans"("id") ON DELETE CASCADE,
      "user_id" text NOT NULL,
      "role" text DEFAULT 'editor',
      "joined_at" text DEFAULT (datetime('now'))
    );
  `;

  const statements = sql.split(";").filter((s) => s.trim());
  for (const stmt of statements) {
    await client.execute(stmt.trim() + ";");
  }

  console.log("Tables created successfully.");

  // Check if test user already exists
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (schema.users as any).email
        ? undefined
        : undefined
    )
    .all();

  // Create test user
  const testEmail = "admin@example.com";
  const testPassword = "123456";

  const alreadyExists = await db
    .select()
    .from(schema.users)
    .all();

  const userExists = alreadyExists.find((u) => u.email === testEmail);
  if (userExists) {
    console.log(`Test user already exists: ${testEmail}`);
    console.log("Done!");
    return;
  }

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  await db.insert(schema.users).values({
    id: userId,
    name: "Admin",
    email: testEmail,
  });

  await db.insert(schema.accounts).values({
    userId,
    type: "credentials",
    provider: "credentials",
    providerAccountId: userId,
    refresh_token: hashedPassword,
  });

  console.log("========================================");
  console.log("  Seed data created successfully!");
  console.log("========================================");
  console.log(`  Email:    ${testEmail}`);
  console.log(`  Password: ${testPassword}`);
  console.log("========================================");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
