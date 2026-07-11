import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoToken });

async function migrate() {
  const migrationsDir = path.join(__dirname, "..", "src", "lib", "db", "migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Applying ${file} (${statements.length} statements)...`);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
        console.log(`  ✓ ${stmt.substring(0, 60)}...`);
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message?.includes("already exists")) {
          console.log(`  ⏭ (already exists) ${stmt.substring(0, 60)}...`);
        } else {
          console.error(`  ✗ FAILED: ${stmt.substring(0, 60)}...`);
          console.error(`    ${err.message}`);
        }
      }
    }
  }

  console.log("Migration complete.");
}

migrate().catch(console.error);
