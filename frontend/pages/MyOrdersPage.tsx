import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useLang } from "../lang";
import { IconArrow, IconCheck, IconClock } from "../components/Icon";

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

const STATUS_CHIP: Record<string, string> = {
  pending:   "bg-warn-bg text-warn-fg",
  preparing: "bg-info-bg text-info-fg",
  ready:     "bg-ok-bg text-ok-fg",
  served:    "bg-done-bg text-done-fg",
  cancelled: "bg-danger-bg text-danger",
};

const STAGES: Array<{ key: string; label: string }> = [
  { key: "pending",   label: "Placed" },
  { key: "preparing", label: "Cooking" },
  { key: "ready",     label: "Ready" },
  { key: "served",    label: "Served" },
];

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
      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="mb-4 font-heading text-4xl text-brown-deep">{t("nav_my_orders")}</h1>
        <p className="mb-8 text-mid">Place an order to see its status here.</p>
        <Link to="/" className="btn-primary self-center">
          {t("nav_menu")}
          <IconArrow size={14} />
        </Link>
      </main>
    );
  }

  if (error === "order_not_found") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="mb-4 font-heading text-3xl text-brown-deep">Order closed</h1>
        <p className="mb-8 text-mid">This order is no longer available.</p>
        <button
          onClick={() => { localStorage.removeItem(MY_ORDER_TOKEN); setToken(null); }}
          className="btn-primary self-center"
        >
          Clear
        </button>
      </main>
    );
  }

  const stageIndex = order ? STAGES.findIndex((s) => s.key === order.status) : -1;
  const totalMin = queue?.estimated_wait_seconds
    ? Math.max(1, Math.ceil(queue.estimated_wait_seconds / 60))
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-10 border-b border-hair pb-6">
        <h1 className="font-heading text-4xl text-brown-deep">{t("nav_my_orders")}</h1>
        {order && (
          <p className="mt-3 text-sm text-mid">
            <span className="font-mono text-ink">#{order.id}</span>
            <span className="mx-2 text-hair-strong">·</span>
            {order.customer_name}
            {order.table_number && (
              <>
                <span className="mx-2 text-hair-strong">·</span>
                Table {order.table_number}
              </>
            )}
          </p>
        )}
      </header>

      {order && (
        <>
          <section className="mb-10">
            <div className="mb-6 flex items-center justify-between">
              <span className={`chip ${STATUS_CHIP[order.status] ?? "bg-done-bg text-done-fg"}`}>
                {order.status}
              </span>
              {totalMin != null && order.status !== "served" && order.status !== "cancelled" && (
                <span className="flex items-center gap-2 text-sm text-mid">
                  <IconClock size={14} />
                  <span className="font-mono text-ink">{totalMin}</span> min est.
                </span>
              )}
            </div>

            <ol className="relative flex justify-between">
              <div aria-hidden className="absolute left-3 right-3 top-3 h-px bg-hair" />
              {STAGES.map((s, i) => {
                const done = stageIndex >= i;
                const active = stageIndex === i;
                return (
                  <li key={s.key} className="relative flex flex-col items-center gap-2">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full border transition-colors ${
                        done ? "border-brown-deep bg-brown-deep text-paper"
                             : "border-hair-strong bg-peach text-hair-strong"
                      }`}
                    >
                      {done ? <IconCheck size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-hair-strong" />}
                    </span>
                    <span
                      className={`text-xs uppercase tracking-[0.14em] ${
                        active ? "text-brown-deep" : done ? "text-mid" : "text-muted"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Items</h2>
            <ul className="divide-y divide-hair border-t border-b border-hair">
              {order.lines.map((l, i) => (
                <li key={i} className="flex justify-between py-3 text-sm">
                  <span className="text-ink">
                    <span className="mr-3 font-mono text-mid">×{l.quantity}</span>
                    {l.name}
                  </span>
                  <span className="font-mono text-ink">₱{(l.quantity * l.unit_price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>

          {queue?.status === "ready" && (
            <p className="mt-8 border border-ok-fg/40 bg-ok-bg px-4 py-3 text-center text-sm text-ok-fg">
              Ready for pickup{order.table_number ? ` at table ${order.table_number}` : ""}.
            </p>
          )}
        </>
      )}
    </main>
  );
}
