import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useLang } from "../lang";

const MY_ORDER_TOKEN = "opisy_my_order_token";

interface QueueInfo {
  id: number;
  status: string;
  queue_position: number | null;
  ahead_of_you: number;
  estimated_wait_seconds: number;
}

interface OrderDetail {
  id: number;
  customer_name: string;
  table_number: string | null;
  status: string;
  lines: { name: string; quantity: number; unit_price: number }[];
}

const BADGES: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-900",
  preparing:  "bg-blue-100 text-blue-900",
  ready:      "bg-green-100 text-green-900",
  served:     "bg-neutral-100 text-neutral-700",
  cancelled:  "bg-danger/10 text-danger",
};

export function MyOrdersPage() {
  const { t } = useLang();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(MY_ORDER_TOKEN));
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function tick() {
      try {
        const [q, o] = await Promise.all([
          api<QueueInfo>(`/api/orders/queue-position?token=${token}`),
          api<OrderDetail>(`/api/orders/mine?token=${token}`),
        ]);
        if (!cancelled) { setQueue(q); setOrder(o); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.key : "error_generic");
      }
    }
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [token]);

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-3 font-heading text-3xl text-brown">{t("nav_my_orders")}</h1>
        <p className="mb-4 text-mid">Place an order to see its status here.</p>
        <Link to="/" className="rounded-button bg-brown px-6 py-3 font-semibold text-white shadow hover:opacity-90">
          {t("nav_menu")}
        </Link>
      </main>
    );
  }

  if (error === "order_not_found") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4 text-mid">This order is no longer available.</p>
        <button onClick={() => { localStorage.removeItem(MY_ORDER_TOKEN); setToken(null); }}
          className="rounded-button bg-brown px-6 py-3 font-semibold text-white shadow hover:opacity-90">
          Clear
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 font-heading text-3xl text-brown">{t("nav_my_orders")}</h1>
      {order && (
        <div className="mb-4 rounded-card bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-heading text-xl text-brown">#{order.id}</p>
            <span className={`rounded-badge px-3 py-1 text-xs font-semibold uppercase ${BADGES[order.status] ?? ""}`}>
              {order.status}
            </span>
          </div>
          <p className="mb-3 text-sm text-mid">
            {order.customer_name}{order.table_number ? ` · Table ${order.table_number}` : ""}
          </p>
          <ul className="mb-3 flex flex-col gap-1">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{l.quantity}× {l.name}</span>
                <span className="font-mono">₱{(l.quantity * l.unit_price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {queue?.status === "pending" && (
            <p className="rounded-card bg-yellow-50 p-3 text-center">
              You are <strong>#{queue.queue_position}</strong> in line
              {queue.estimated_wait_seconds > 0 && (
                <> · est. {Math.ceil(queue.estimated_wait_seconds / 60)} min</>
              )}
            </p>
          )}
          {queue?.status === "preparing" && (
            <p className="rounded-card bg-blue-50 p-3 text-center">
              Being prepared · est. {Math.ceil(queue.estimated_wait_seconds / 60)} min
            </p>
          )}
          {queue?.status === "ready" && (
            <p className="rounded-card bg-green-50 p-3 text-center font-semibold">
              Ready for pickup{order.table_number ? ` at table ${order.table_number}` : ""}!
            </p>
          )}
          {queue?.status === "served" && (
            <p className="rounded-card bg-neutral-50 p-3 text-center">Enjoy your meal.</p>
          )}
        </div>
      )}
    </main>
  );
}
