// Run this script to create the database tables
// Usage: node scripts/migrate.mjs

import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Load DATABASE_URL from .env.local or .env if not in env ─────────────────
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  for (const envFile of [".env.local", ".env"]) {
    const envPath = resolve(root, envFile);
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const m = line.match(/^DATABASE_URL\s*=\s*(.+)/);
        if (m) {
          DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
      if (DATABASE_URL) break;
    }
  }
}
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL not set. Add it to .env.local, .env, or set it in your environment.",
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runWithRetry(stmt, retries = 3, delayMs = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      await sql.query(stmt);
      return;
    } catch (err) {
      if (err.message?.includes("already exists")) throw err;
      if (i < retries) {
        console.log(`    ⟳ Retry ${i + 1}/${retries} after ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

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
        await runWithRetry(stmt);
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
