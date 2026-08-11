import type { Database } from "bun:sqlite";
import { applySchema, connect } from "../db";
import { readRows } from "./excelReader";
import { transform } from "./productNormalizer";
import { load } from "./productLoader";

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
}

/**
 * The whole ETL in one call: Excel file bytes in, products in the database out.
 * Used by the upload endpoint.
 *
 * Reuses the given connection if passed (the caller owns closing it), otherwise
 * opens and closes its own. Throws Error("no_products") -- a key into
 * server/i18n.ts, translated by the caller -- if the workbook has no rows this
 * system can recognise as products.
 */
export function importExcel(fileBytes: ArrayBuffer, db?: Database): ImportResult {
  const ownConnection = db === undefined;
  const conn = db ?? connect();
  try {
    applySchema(conn);
    const { products, skipped } = transform(readRows(fileBytes));
    if (products.length === 0) {
      throw new Error("no_products");
    }
    const { inserted, updated } = load(conn, products);
    return { inserted, updated, skipped };
  } finally {
    if (ownConnection) conn.close();
  }
}

export function importPDF(fileBytes: ArrayBuffer, db?: Database): ImportResult{
  
}