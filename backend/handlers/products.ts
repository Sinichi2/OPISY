import { getDb } from "../db";
import { guard, jsonError } from "../auth";

interface ProductInput {
  name?: string;
  category?: string | null;
  unit?: string | null;
  location?: string | null;
  supplier?: string | null;
  unit_price?: number | null;
  image_path?: string | null;
  low_stock_threshold?: number;
}

const REASONS = ["opening", "delivery", "usage", "waste", "correction"] as const;
type Reason = (typeof REASONS)[number];

export const listProducts = guard("staff", async () => {
  const rows = getDb().query(`
    SELECT id, name, category, unit, location, supplier, unit_price,
           image_path, low_stock_threshold, quantity, is_low, last_moved_at
    FROM current_stock ORDER BY name
  `).all();
  return Response.json(rows);
});

export const createProduct = guard("staff", async (req) => {
  const body = (await req.json().catch(() => ({}))) as ProductInput;
  const name = (body.name ?? "").trim();
  if (!name) return jsonError(400, "missing_name");
  const db = getDb();
  const exists = db.query("SELECT 1 FROM products WHERE name = ? COLLATE NOCASE").get(name);
  if (exists) return jsonError(409, "duplicate_name");
  const row = db.query(`
    INSERT INTO products (name, category, unit, location, supplier, unit_price, image_path, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
  `).get(
    name, body.category ?? null, body.unit ?? null, body.location ?? null,
    body.supplier ?? null, body.unit_price ?? null, body.image_path ?? null,
    body.low_stock_threshold ?? 0,
  ) as { id: number };
  return Response.json({ id: row.id }, { status: 201 });
});

export const updateProduct = guard("staff", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as ProductInput;
  const db = getDb();
  const cur = db.query("SELECT id FROM products WHERE id = ?").get(id);
  if (!cur) return jsonError(404, "product_not_found");
  // Only update fields the caller actually sent -- undefined means "leave alone".
  const setFrags: string[] = []; const args: unknown[] = [];
  const map: Record<string, unknown> = {
    name: body.name?.trim(),
    category: body.category,
    unit: body.unit,
    location: body.location,
    supplier: body.supplier,
    unit_price: body.unit_price,
    image_path: body.image_path,
    low_stock_threshold: body.low_stock_threshold,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val === undefined) continue;
    setFrags.push(`${col} = ?`); args.push(val);
  }
  if (setFrags.length === 0) return new Response(null, { status: 204 });
  setFrags.push("updated_at = datetime('now')");
  args.push(id);
  try {
    db.query(`UPDATE products SET ${setFrags.join(", ")} WHERE id = ?`).run(...args);
  } catch (e: any) {
    if (String(e?.message ?? "").includes("UNIQUE")) return jsonError(409, "duplicate_name");
    throw e;
  }
  return new Response(null, { status: 204 });
});

export const deleteProduct = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const db = getDb();
  const n = db.query("DELETE FROM products WHERE id = ?").run(id).changes;
  if (n === 0) return jsonError(404, "product_not_found");
  return new Response(null, { status: 204 });
});

// -- stock movements -------------------------------------------------

interface MovementInput {
  product_id?: number;
  delta?: number;
  reason?: Reason;
  reason_code?: string | null; // required when reason='waste'
  note?: string | null;
}

export const listMovements = guard("staff", async (req) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  const from = url.searchParams.get("from");
  const to   = url.searchParams.get("to");
  const clauses: string[] = []; const args: unknown[] = [];
  if (productId) { clauses.push("product_id = ?"); args.push(Number(productId)); }
  if (from)      { clauses.push("moved_at >= ?"); args.push(from); }
  if (to)        { clauses.push("moved_at <= ?"); args.push(to); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb().query(`
    SELECT m.id, m.product_id, p.name AS product_name, m.delta,
           m.reason, m.reason_code, m.note, m.moved_at
    FROM stock_movements m JOIN products p ON p.id = m.product_id
    ${where}
    ORDER BY m.moved_at DESC LIMIT 500
  `).all(...args);
  return Response.json(rows);
});

export const createMovement = guard("staff", async (req) => {
  const body = (await req.json().catch(() => ({}))) as MovementInput;
  const { product_id, delta, reason } = body;
  if (!product_id || typeof delta !== "number" || !reason) return jsonError(400, "missing_fields");
  if (!REASONS.includes(reason)) return jsonError(400, "invalid_reason");
  const db = getDb();
  const p = db.query("SELECT 1 FROM products WHERE id = ?").get(product_id);
  if (!p) return jsonError(404, "product_not_found");
  if (reason === "waste") {
    if (!body.reason_code) return jsonError(400, "missing_reason_code");
    const rc = db.query("SELECT 1 FROM waste_reasons WHERE code = ?").get(body.reason_code);
    if (!rc) return jsonError(400, "invalid_reason_code");
  }
  db.query(`
    INSERT INTO stock_movements (product_id, delta, reason, reason_code, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(product_id, delta, reason, body.reason_code ?? null, body.note ?? null);
  return new Response(null, { status: 201 });
});

export const listWasteReasons = guard("staff", async () => {
  const rows = getDb().query("SELECT code, label FROM waste_reasons ORDER BY label").all();
  return Response.json(rows);
});
