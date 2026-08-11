import type { Database } from "bun:sqlite";
import { connect, runMigrations } from "../db";
import { readRows } from "./excelReader";
import { transform } from "./productNormalizer";
import { load } from "./productLoader";

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
}

export function importExcel(fileBytes: ArrayBuffer, db?: Database): ImportResult {
  const ownConnection = db === undefined;
  const conn = db ?? connect();
  try {
    runMigrations(conn);
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