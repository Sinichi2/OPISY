import type { Database } from "bun:sqlite";
import type { Product } from "./productNormalizer";

/**
 * Load step: write transformed products into SQLite.
 *
 * The quantity in the spreadsheet is the opening balance, stored as a movement.
 * Re-uploading a corrected workbook replaces that opening row instead of adding
 * to it, so deliveries and usage recorded since the last upload survive.
 */
const UPSERT = `
  INSERT INTO products (name, category, unit, location, supplier, unit_price)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
      category   = COALESCE(excluded.category, category),
      unit       = COALESCE(excluded.unit, unit),
      location   = COALESCE(excluded.location, location),
      supplier   = COALESCE(excluded.supplier, supplier),
      unit_price = COALESCE(excluded.unit_price, unit_price),
      updated_at = datetime('now')
`;

export interface LoadResult {
  inserted: number;
  updated: number;
}

/** Upserts products and their opening stock. */
export function load(db: Database, products: Product[]): LoadResult {
  const before = (db.query("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;

  const upsert = db.prepare(UPSERT);
  for (const p of products) {
    upsert.run(p.name, p.category, p.unit, p.location, p.supplier, p.unitPrice);
  }
  const after = (db.query("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;

  // same product named twice in the sheet -> last row's quantity wins
  const openingByName = new Map<string, number>();
  for (const p of products) {
    if (p.quantity !== null) openingByName.set(p.name.toLowerCase(), p.quantity);
  }

  const idsByName = new Map<string, number>();
  for (const row of db.query("SELECT id, name FROM products").all() as { id: number; name: string }[]) {
    idsByName.set(row.name.toLowerCase(), row.id);
  }

  const deleteOpening = db.prepare("DELETE FROM stock_movements WHERE product_id = ? AND reason = 'opening'");
  const insertOpening = db.prepare("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, ?, 'opening')");
  for (const [name, quantity] of openingByName) {
    const productId = idsByName.get(name)!;
    deleteOpening.run(productId);
    insertOpening.run(productId, quantity);
  }

  const inserted = after - before;
  return { inserted, updated: products.length - inserted };
}
