import { getDb } from "../db";
import { guard, jsonError } from "../auth";

// -- locations (owner+) ------------------------------------------------

export const listLocations = guard("owner", async () => {
  const rows = getDb().query("SELECT id, name FROM locations ORDER BY name").all();
  return Response.json(rows);
});

export const createLocation = guard("owner", async (req) => {
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return jsonError(400, "missing_name");
  const db = getDb();
  if (db.query("SELECT 1 FROM locations WHERE name = ? COLLATE NOCASE").get(name)) {
    return jsonError(409, "duplicate_name");
  }
  const row = db.query("INSERT INTO locations (name) VALUES (?) RETURNING id").get(name) as { id: number };
  return Response.json({ id: row.id, name }, { status: 201 });
});

export const deleteLocation = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const n = getDb().query("DELETE FROM locations WHERE id = ?").run(id).changes;
  if (n === 0) return jsonError(404, "location_not_found");
  return new Response(null, { status: 204 });
});

// -- tables (owner+ manage; single-table GET is public for QR scans) ---

export const listTables = guard("owner", async () => {
  const rows = getDb().query(`
    SELECT t.id, t.label, t.location_id, l.name AS location_name
    FROM tables t LEFT JOIN locations l ON l.id = t.location_id
    ORDER BY t.label COLLATE NOCASE
  `).all();
  return Response.json(rows);
});

export const createTable = guard("owner", async (req) => {
  const body = (await req.json().catch(() => ({}))) as { label?: string; location_id?: number | null };
  const label = (body.label ?? "").trim();
  if (!label) return jsonError(400, "missing_name");
  const db = getDb();
  if (body.location_id != null && !db.query("SELECT 1 FROM locations WHERE id = ?").get(body.location_id)) {
    return jsonError(400, "location_not_found");
  }
  if (db.query("SELECT 1 FROM tables WHERE label = ? COLLATE NOCASE").get(label)) {
    return jsonError(409, "duplicate_name");
  }
  const row = db.query("INSERT INTO tables (label, location_id) VALUES (?, ?) RETURNING id")
    .get(label, body.location_id ?? null) as { id: number };
  return Response.json({ id: row.id }, { status: 201 });
});

export const deleteTable = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const n = getDb().query("DELETE FROM tables WHERE id = ?").run(id).changes;
  if (n === 0) return jsonError(404, "table_not_found");
  return new Response(null, { status: 204 });
});

// GET /api/tables/:id (public) -- resolves a scanned QR to label + location
// so the visitor's cart can be pinned to the right table without a login.
export const getTable = guard("public", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const row = getDb().query(`
    SELECT t.id, t.label, l.name AS location_name
    FROM tables t LEFT JOIN locations l ON l.id = t.location_id
    WHERE t.id = ?
  `).get(id);
  if (!row) return jsonError(404, "table_not_found");
  return Response.json(row);
});
