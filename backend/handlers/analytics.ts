import { getDb } from "../db";
import { guard, jsonError } from "../auth";

function range(req: Request): { from: string; to: string } {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  return { from, to };
}

export const wasteAnalytics = guard("owner", async (req) => {
  const { from, to } = range(req);
  const rows = getDb().query(`
    SELECT day, reason_code, quantity_wasted
    FROM waste_summary
    WHERE day >= ? AND day <= ?
    ORDER BY day
  `).all(from, to);
  return Response.json({ from, to, rows });
});

export const salesAnalytics = guard("owner", async (req) => {
  const { from, to } = range(req);
  const db = getDb();
  const daily = db.query(`
    SELECT date(o.placed_at) AS day,
           COUNT(DISTINCT o.id) AS orders,
           ROUND(SUM(ol.quantity * ol.unit_price), 2) AS revenue
    FROM orders o JOIN order_lines ol ON ol.order_id = o.id
    WHERE o.status != 'cancelled'
      AND date(o.placed_at) >= ? AND date(o.placed_at) <= ?
    GROUP BY day ORDER BY day
  `).all(from, to);
  const top = db.query(`
    SELECT m.id, m.name, SUM(ol.quantity) AS units,
           ROUND(SUM(ol.quantity * ol.unit_price), 2) AS revenue
    FROM orders o
    JOIN order_lines ol ON ol.order_id = o.id
    JOIN menu_items m  ON m.id = ol.menu_item_id
    WHERE o.status != 'cancelled'
      AND date(o.placed_at) >= ? AND date(o.placed_at) <= ?
    GROUP BY m.id ORDER BY units DESC LIMIT 10
  `).all(from, to);
  return Response.json({ from, to, daily, top });
});

export const lowStockAnalytics = guard("owner", async () => {
  const rows = getDb().query(`
    SELECT id, name, category, unit, quantity, low_stock_threshold
    FROM current_stock
    WHERE low_stock_threshold > 0 AND quantity <= low_stock_threshold
    ORDER BY (quantity / NULLIF(low_stock_threshold, 0)) ASC
  `).all();
  return Response.json(rows);
});
