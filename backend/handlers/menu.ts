import { getDb } from "../db";
import { guard, jsonError } from "../auth";

interface MenuInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  image_path?: string | null;
  available?: boolean;
}
interface Ingredient { product_id: number; quantity: number }

export const listPublicMenu = guard("public", async () => {
  const rows = getDb().query(`
    SELECT id, name, description, category, price, image_path
    FROM menu_items WHERE available = 1 ORDER BY category, name
  `).all();
  return Response.json(rows);
});

export const listMenuAll = guard("staff", async () => {
  const db = getDb();
  const items = db.query(`
    SELECT id, name, description, category, price, image_path, available, updated_at
    FROM menu_items ORDER BY category, name
  `).all() as any[];
  const ingredients = db.query(`
    SELECT mi.menu_item_id, mi.product_id, mi.quantity, p.name AS product_name, p.unit
    FROM menu_item_ingredients mi JOIN products p ON p.id = mi.product_id
  `).all() as any[];
  const byMenu = new Map<number, any[]>();
  for (const ing of ingredients) {
    if (!byMenu.has(ing.menu_item_id)) byMenu.set(ing.menu_item_id, []);
    byMenu.get(ing.menu_item_id)!.push(ing);
  }
  return Response.json(items.map((m) => ({ ...m, ingredients: byMenu.get(m.id) ?? [] })));
});

export const createMenuItem = guard("owner", async (req) => {
  const body = (await req.json().catch(() => ({}))) as MenuInput;
  const name = (body.name ?? "").trim();
  if (!name) return jsonError(400, "missing_name");
  if (typeof body.price !== "number") return jsonError(400, "missing_price");
  const db = getDb();
  const exists = db.query("SELECT 1 FROM menu_items WHERE name = ? COLLATE NOCASE").get(name);
  if (exists) return jsonError(409, "duplicate_name");
  const row = db.query(`
    INSERT INTO menu_items (name, description, category, price, image_path, available)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING id
  `).get(
    name, body.description ?? null, body.category ?? null,
    body.price, body.image_path ?? null, body.available === false ? 0 : 1,
  ) as { id: number };
  return Response.json({ id: row.id }, { status: 201 });
});

export const updateMenuItem = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as MenuInput;
  const db = getDb();
  if (!db.query("SELECT 1 FROM menu_items WHERE id = ?").get(id)) {
    return jsonError(404, "menu_item_not_found");
  }
  const set: string[] = []; const args: unknown[] = [];
  const map: Record<string, unknown> = {
    name: body.name?.trim(),
    description: body.description,
    category: body.category,
    price: body.price,
    image_path: body.image_path,
    available: body.available === undefined ? undefined : body.available ? 1 : 0,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val === undefined) continue;
    set.push(`${col} = ?`); args.push(val);
  }
  if (set.length === 0) return new Response(null, { status: 204 });
  set.push("updated_at = datetime('now')");
  args.push(id);
  try {
    db.query(`UPDATE menu_items SET ${set.join(", ")} WHERE id = ?`).run(...args);
  } catch (e: any) {
    if (String(e?.message ?? "").includes("UNIQUE")) return jsonError(409, "duplicate_name");
    throw e;
  }
  return new Response(null, { status: 204 });
});

export const deleteMenuItem = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  const n = getDb().query("DELETE FROM menu_items WHERE id = ?").run(id).changes;
  if (n === 0) return jsonError(404, "menu_item_not_found");
  return new Response(null, { status: 204 });
});

// PUT /api/menu/:id/recipe -- full replace, transactional.
export const setRecipe = guard("owner", async (req) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts.at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as { ingredients?: Ingredient[] };
  const ingredients = body.ingredients ?? [];
  const db = getDb();
  if (!db.query("SELECT 1 FROM menu_items WHERE id = ?").get(id)) {
    return jsonError(404, "menu_item_not_found");
  }
  // Verify every product_id exists; better to fail before we've wiped the old rows.
  for (const ing of ingredients) {
    if (!ing.product_id || typeof ing.quantity !== "number" || ing.quantity <= 0) {
      return jsonError(400, "invalid_ingredient");
    }
    if (!db.query("SELECT 1 FROM products WHERE id = ?").get(ing.product_id)) {
      return jsonError(400, "product_not_found");
    }
  }
  db.transaction(() => {
    db.query("DELETE FROM menu_item_ingredients WHERE menu_item_id = ?").run(id);
    const ins = db.query("INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity) VALUES (?, ?, ?)");
    for (const ing of ingredients) ins.run(id, ing.product_id, ing.quantity);
  })();
  return new Response(null, { status: 204 });
});

export const toggleAvailability = guard("staff", async (req) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts.at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as { available?: boolean };
  if (typeof body.available !== "boolean") return jsonError(400, "missing_fields");
  const n = getDb().query("UPDATE menu_items SET available = ?, updated_at = datetime('now') WHERE id = ?")
    .run(body.available ? 1 : 0, id).changes;
  if (n === 0) return jsonError(404, "menu_item_not_found");
  return new Response(null, { status: 204 });
});
