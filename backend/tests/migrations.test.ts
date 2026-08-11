import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../db";

test("migrations create all tables + views", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const names = db.query("SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name")
    .all().map((r: any) => r.name);
  for (const t of [
    "users", "sessions", "login_attempts", "products", "stock_movements",
    "menu_items", "menu_item_ingredients", "orders", "order_lines",
    "waste_reasons", "current_stock", "waste_summary", "schema_migrations",
  ]) expect(names).toContain(t);
});

test("migrations are idempotent", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const before = db.query("SELECT COUNT(*) AS n FROM schema_migrations").get() as { n: number };
  runMigrations(db); // second run must not double-apply
  const after = db.query("SELECT COUNT(*) AS n FROM schema_migrations").get() as { n: number };
  expect(after.n).toBe(before.n);
});
