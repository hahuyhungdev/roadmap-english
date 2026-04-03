// Run this script to create the database tables
// Usage: node scripts/migrate.mjs

import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Load DATABASE_URL from .env.local if not in env ─────────────────────────
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  const envPath = resolve(root, ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^DATABASE_URL\s*=\s*(.+)/);
      if (m) {
        DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }
}
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL not set. Add it to .env.local or set it in your environment.",
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── Find all migration files ────────────────────────────────────────────────
const drizzleDir = resolve(root, "drizzle");
const migrationFiles = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.error("No migration files found in drizzle/");
  process.exit(1);
}

async function migrate() {
  let failed = 0;
  for (const file of migrationFiles) {
    console.log(`\n── ${file} ──`);
    const content = readFileSync(resolve(drizzleDir, file), "utf-8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      console.log("  Executing:", stmt.slice(0, 70) + "...");
      try {
        await sql.query(stmt);
        console.log("    ✓ OK");
      } catch (err) {
        if (err.message?.includes("already exists")) {
          console.log("    ⊘ Already exists, skipping");
        } else {
          failed += 1;
          console.error("    ✗ Error:", err.message);
        }
      }
    }
  }

  if (failed > 0) {
    console.error(`\n❌ Migration finished with ${failed} error(s).`);
    process.exitCode = 1;
    return;
  }

  console.log("\n✅ Migration complete!");
}

migrate().catch(console.error);
