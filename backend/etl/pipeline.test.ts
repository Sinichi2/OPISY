// Run: bun test -- fails loudly if the ETL breaks.
import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import * as XLSX from "xlsx";
import { runMigrations } from "../db";
import { importExcel } from "./pipeline";

const MESSY_SHEET = [
  ["PANZIANN RESTAURANT", "", "", ""],
  ["Inventory as of July 2026", "", "", ""],
  ["Item Name", "Category", "Qty", "Unit Price (PHP)"],
  ["Tomato", "Vegetable", "12", "PHP 45.50"],
  ["Olive Oil", "Condiments", "3", "1,250.00"],
  ["", "", "", ""],
  ["", "Vegetable", "9", "10"], // no name -> skipped
  ["Tomato", "Vegetable", "20", "50"], // same product again -> update
];

function buildWorkbookBytes(): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(MESSY_SHEET);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

function stock(db: Database, name: string) {
  return db.query("SELECT id, quantity, unit_price AS unitPrice, unit FROM current_stock WHERE name = ? COLLATE NOCASE")
    .get(name) as { id: number; quantity: number; unitPrice: number; unit: string | null };
}

test("messy workbook end to end", () => {
  const bytes = buildWorkbookBytes();
  const db = new Database(":memory:");
  runMigrations(db);

  const first = importExcel(bytes, db);
  expect(first).toEqual({ inserted: 2, updated: 1, skipped: 1 });

  const tomato = stock(db, "tomato"); // name match ignores case
  expect(tomato.quantity).toBe(20); // last row wins
  expect(tomato.unitPrice).toBe(50);

  const oil = stock(db, "Olive Oil");
  expect(oil.unitPrice).toBe(1250); // comma stripped
  expect(oil.unit).toBeNull(); // column absent

  // a delivery and a day of cooking, recorded after the upload
  db.run("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, 6, 'delivery')", [tomato.id]);
  db.run("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, -4, 'usage')", [tomato.id]);
  expect(stock(db, "Tomato").quantity).toBe(22);

  // re-uploading the same file corrects the opening balance without
  // duplicating products or double-counting the movements since
  const second = importExcel(bytes, db);
  expect(second).toEqual({ inserted: 0, updated: 3, skipped: 1 });
  expect(stock(db, "Tomato").quantity).toBe(22);

  // the reason list is enforced by the database, not by TypeScript
  expect(() => db.run("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, 1, 'lol')", [tomato.id]))
    .toThrow();

  db.close();
});
