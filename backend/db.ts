import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

/** Opens the SQLite connection and runs any pending migrations. */
export function connect(path?: string): Database {
  // Path resolved at call time so tests can set DB_PATH before first getDb().
  const finalPath = path ?? process.env.DB_PATH ?? "panziann.db";
  const db = new Database(finalPath);
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
}

let singleton: Database | null = null;
/** Process-wide DB. Opened lazily so tests can pick their own via connect(). */
export function getDb(): Database {
  if (!singleton) singleton = connect();
  return singleton;
}

/** Test hook: replace the process-wide DB. Do NOT call in production. */
export function _setDbForTests(db: Database): void {
  singleton = db;
}

/**
 * Applies numbered SQL files in `migrations/` in filename order. Each file's
 * body runs in a single transaction; the filename (sans .sql) is written to
 * `schema_migrations` so it never runs twice.
 */
export function runMigrations(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    (db.query("SELECT version FROM schema_migrations").all() as { version: string }[])
      .map((r) => r.version),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    db.transaction(() => {
      db.exec(sql);
      db.query("INSERT INTO schema_migrations (version) VALUES (?)").run(version);
    })();
    console.log(`[db] applied migration ${version}`);
  }
}
