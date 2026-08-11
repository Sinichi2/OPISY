import { Database } from "bun:sqlite";
// @ts-expect-error -- Bun's text loader, see https://bun.sh/docs/bundler/loaders#text
import schemaSql from "./schema.sql" with { type: "text" };

const DB_PATH = process.env.DB_PATH ?? "panziann.db";

/** Opens the SQLite connection and makes sure the schema exists. */
export function connect(path: string = DB_PATH): Database {
  const db = new Database(path);
  applySchema(db);
  return db;
}

/** Creates the tables if they are missing. Safe to call on every connection. */
export function applySchema(db: Database): void {
  db.exec("PRAGMA foreign_keys = ON"); // off by default in SQLite
  db.exec(schemaSql as string);
}
