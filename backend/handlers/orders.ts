import { randomBytes } from "node:crypto";
import { getDb } from "../db";
import { guard, jsonError } from "../auth";

interface OrderLineIn { menu_item_id: number; quantity: number }
interface OrderIn {
  customer_name?: string;
  table_number?: string | null;
  table_id?: number | null;
  notes?: string | null;
  lines?: OrderLineIn[];
}

function newToken(): string { return randomBytes(16).toString("hex"); }

function queuePosition(db: import("bun:sqlite").Database, orderId: number): number {
  // Count orders that will be claimed before this one, then +1.
  const row = db.query(`
    SELECT COUNT(*) AS ahead
    FROM orders o
    WHERE o.status = 'pending' AND (
      o.priority > (SELECT priority FROM orders WHERE id = ?)
      OR (o.priority = (SELECT priority FROM orders WHERE id = ?)
          AND o.placed_at < (SELECT placed_at FROM orders WHERE id = ?))
    )
  `).get(orderId, orderId, orderId) as { ahead: number };
  return row.ahead + 1;
}

function avgPrepSeconds(db: import("bun:sqlite").Database): number {
  const row = db.query(`
    SELECT AVG(strftime('%s', ready_at) - strftime('%s', claimed_at)) AS avg_sec
    FROM orders
    WHERE ready_at IS NOT NULL AND claimed_at IS NOT NULL
      AND ready_at > datetime('now', '-7 days')
  `).get() as { avg_sec: number | null };
  return row.avg_sec && row.avg_sec > 0 ? Math.round(row.avg_sec) : 300; // default 5 min
}

// -- POST /api/orders (public) --------------------------------------

export async function placeOrder(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as OrderIn;
  const name = (body.customer_name ?? "").trim();
  if (!name) return jsonError(400, "missing_name");
  if (!body.lines?.length) return jsonError(400, "empty_order");
  for (const l of body.lines) {
    if (!l.menu_item_id || !l.quantity || l.quantity < 1) return jsonError(400, "invalid_line");
  }
  const db = getDb();
  const token = newToken();

  let orderId!: number;
  try {
    db.transaction(() => {
      // A QR scan sends table_id; reject it early rather than silently
      // dropping the link if the table was deleted between scan and order.
      if (body.table_id != null && !db.query("SELECT 1 FROM tables WHERE id = ?").get(body.table_id)) {
        throw new Error("table_not_found");
      }

      // Snapshot prices, ensure every line is currently available.
      const menuStmt = db.query("SELECT id, price, available FROM menu_items WHERE id = ?");
      const priced = body.lines!.map((l) => {
        const m = menuStmt.get(l.menu_item_id) as { id: number; price: number; available: number } | null;
        if (!m) throw new Error("menu_item_not_found");
        if (!m.available) throw new Error("menu_item_unavailable");
        return { menu_item_id: m.id, quantity: l.quantity, unit_price: m.price };
      });

      const order = db.query(`
        INSERT INTO orders (customer_name, table_number, table_id, notes, order_token)
        VALUES (?, ?, ?, ?, ?) RETURNING id
      `).get(
        name, body.table_number ?? null, body.table_id ?? null, body.notes ?? null, token,
      ) as { id: number };
      orderId = order.id;

      const lineStmt = db.query(`
        INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `);
      for (const p of priced) lineStmt.run(orderId, p.menu_item_id, p.quantity, p.unit_price);

      // Decrement stock through the recipe of every line. Below-zero is allowed
      // (Pi kitchen isn't strict inventory) but the movement row is still logged
      // so it can be audited.
      const ingredientStmt = db.query(`
        SELECT product_id, quantity FROM menu_item_ingredients WHERE menu_item_id = ?
      `);
      const moveStmt = db.query(`
        INSERT INTO stock_movements (product_id, delta, reason, note)
        VALUES (?, ?, 'usage', ?)
      `);
      for (const p of priced) {
        const ingredients = ingredientStmt.all(p.menu_item_id) as { product_id: number; quantity: number }[];
        for (const ing of ingredients) {
          moveStmt.run(ing.product_id, -(ing.quantity * p.quantity), `order #${orderId}`);
        }
      }
    })();
  } catch (e: any) {
    return jsonError(400, e.message ?? "order_failed");
  }

  return Response.json({
    id: orderId,
    order_token: token,
    queue_position: queuePosition(db, orderId),
  }, { status: 201 });
}

// -- GET /api/orders (staff+) --------------------------------------

export const listOrders = guard("staff", async () => {
  const db = getDb();
  const rows = db.query(`
    SELECT o.id, o.customer_name, o.table_number, o.notes, o.status,
           o.assigned_to, u.username AS assigned_to_name,
           o.claimed_at, o.ready_at, o.priority, o.placed_at,
           l.name AS location_name,
           ROW_NUMBER() OVER (
             PARTITION BY o.status
             ORDER BY o.priority DESC, o.placed_at ASC
           ) AS queue_position
    FROM orders o
    LEFT JOIN users u ON u.id = o.assigned_to
    LEFT JOIN tables t ON t.id = o.table_id
    LEFT JOIN locations l ON l.id = t.location_id
    WHERE o.status IN ('pending','preparing','ready')
    ORDER BY o.status, o.priority DESC, o.placed_at ASC
  `).all() as any[];

  const lineStmt = db.query(`
    SELECT ol.order_id, ol.menu_item_id, ol.quantity, ol.unit_price, m.name
    FROM order_lines ol JOIN menu_items m ON m.id = ol.menu_item_id
    WHERE ol.order_id IN (${rows.map(() => "?").join(",") || "NULL"})
  `);
  const lines = rows.length ? lineStmt.all(...rows.map((r) => r.id)) as any[] : [];
  const byOrder = new Map<number, any[]>();
  for (const l of lines) {
    if (!byOrder.has(l.order_id)) byOrder.set(l.order_id, []);
    byOrder.get(l.order_id)!.push(l);
  }
  return Response.json(rows.map((r) => ({ ...r, lines: byOrder.get(r.id) ?? [] })));
});

// -- POST /api/orders/claim-next -----------------------------------

export const claimNext = guard("staff", async (_req, user) => {
  const db = getDb();
  const row = db.query(`
    UPDATE orders SET status = 'preparing', assigned_to = ?,
                      claimed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = (
      SELECT id FROM orders WHERE status = 'pending'
      ORDER BY priority DESC, placed_at ASC LIMIT 1
    )
    RETURNING id
  `).get(user!.id) as { id: number } | null;
  if (!row) return Response.json({ empty: true });
  return Response.json({ id: row.id });
});

// -- POST /api/orders/:id/claim ------------------------------------

export const claim = guard("staff", async (req, user) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts.at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const row = getDb().query(`
    UPDATE orders SET status = 'preparing', assigned_to = ?,
                      claimed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'
    RETURNING id
  `).get(user!.id, id) as { id: number } | null;
  if (!row) return jsonError(409, "already_claimed");
  return Response.json({ id: row.id });
});

// -- POST /api/orders/:id/release ----------------------------------

export const release = guard("staff", async (req) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts.at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const n = getDb().query(`
    UPDATE orders SET status = 'pending', assigned_to = NULL,
                      claimed_at = NULL, updated_at = datetime('now')
    WHERE id = ? AND status = 'preparing'
  `).run(id).changes;
  if (n === 0) return jsonError(404, "order_not_found");
  return new Response(null, { status: 204 });
});

// -- PATCH /api/orders/:id/status ----------------------------------

const VALID: Record<string, string[]> = {
  preparing: ["ready", "cancelled"],
  ready:     ["served", "cancelled"],
  pending:   ["cancelled"],
};

export const updateStatus = guard("staff", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const next = body.status;
  if (!next) return jsonError(400, "missing_status");
  const db = getDb();
  const cur = db.query("SELECT status FROM orders WHERE id = ?").get(id) as { status: string } | null;
  if (!cur) return jsonError(404, "order_not_found");
  if (!VALID[cur.status]?.includes(next)) return jsonError(400, "invalid_transition");
  const readyClause = next === "ready" ? ", ready_at = datetime('now')" : "";
  db.query(`UPDATE orders SET status = ?, updated_at = datetime('now')${readyClause} WHERE id = ?`)
    .run(next, id);
  return new Response(null, { status: 204 });
});

// -- POST /api/orders/:id/priority (owner+) ------------------------

export const setPriority = guard("owner", async (req) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const body = (await req.json().catch(() => ({}))) as { priority?: number };
  if (typeof body.priority !== "number") return jsonError(400, "missing_priority");
  const n = getDb().query("UPDATE orders SET priority = ?, updated_at = datetime('now') WHERE id = ?")
    .run(body.priority, id).changes;
  if (n === 0) return jsonError(404, "order_not_found");
  return new Response(null, { status: 204 });
});

// -- GET /api/orders/queue-position?token= (public) ----------------

export async function queuePositionByToken(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return jsonError(400, "missing_token");
  const db = getDb();
  const order = db.query(`
    SELECT id, status, priority, placed_at, claimed_at
    FROM orders WHERE order_token = ?
  `).get(token) as { id: number; status: string; priority: number; placed_at: string; claimed_at: string | null } | null;
  if (!order) return jsonError(404, "order_not_found");

  let position: number | null = null;
  let aheadCount = 0;
  if (order.status === "pending") {
    const ahead = db.query(`
      SELECT COUNT(*) AS n FROM orders
      WHERE status = 'pending' AND (
        priority > ? OR (priority = ? AND placed_at < ?)
      )
    `).get(order.priority, order.priority, order.placed_at) as { n: number };
    aheadCount = ahead.n;
    position = aheadCount + 1;
  }
  const avg = avgPrepSeconds(db);
  const eta = position ? position * avg : (order.status === "preparing" ? avg : 0);
  return Response.json({
    id: order.id, status: order.status,
    queue_position: position, ahead_of_you: aheadCount,
    estimated_wait_seconds: eta,
  });
}

// -- GET /api/orders/mine?token= (public) --------------------------

export async function myOrder(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return jsonError(400, "missing_token");
  const db = getDb();
  const order = db.query(`
    SELECT id, customer_name, table_number, notes, status, placed_at, priority
    FROM orders WHERE order_token = ?
  `).get(token) as any;
  if (!order) return jsonError(404, "order_not_found");
  const lines = db.query(`
    SELECT ol.menu_item_id, ol.quantity, ol.unit_price, m.name
    FROM order_lines ol JOIN menu_items m ON m.id = ol.menu_item_id
    WHERE ol.order_id = ?
  `).all(order.id);
  return Response.json({ ...order, lines });
}
