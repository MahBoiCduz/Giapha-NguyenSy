import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Use local SQLite file for development if no Turso URL set
const tursoUrl = process.env.TURSO_DATABASE_URL;
const isLocal = !tursoUrl;

const dbPath = "file:.data/local.db";

const client = createClient({
  url: tursoUrl || dbPath,
  authToken: tursoUrl ? process.env.TURSO_AUTH_TOKEN : undefined,
});

export const db = drizzle(client, { schema });

export * from "./schema";
