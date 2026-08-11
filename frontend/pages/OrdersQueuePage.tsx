import { useCallback, useEffect, useState } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth } from "../auth";
import { useLang } from "../lang";

interface OrderLine { menu_item_id: number; quantity: number; unit_price: number; name: string }
interface Order {
  id: number;
  customer_name: string;
  table_number: string | null;
  notes: string | null;
  status: "pending" | "preparing" | "ready";
  assigned_to: number | null;
  assigned_to_name: string | null;
  claimed_at: string | null;
  ready_at: string | null;
  priority: number;
  placed_at: string;
  queue_position: number;
  lines: OrderLine[];
}

export function OrdersQueuePage() {
  const { t } = useLang();
  const { user } = useAuth();
  const canBump = hasRole(user, "owner");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await api<Order[]>("/api/orders");
      setOrders(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 5_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function claimNext() {
    setBusy(true);
    try { await apiJson("/api/orders/claim-next", {}); await load(); }
    finally { setBusy(false); }
  }
  async function claim(o: Order) { await apiJson(`/api/orders/${o.id}/claim`, {}); load(); }
  async function release(o: Order) { await apiJson(`/api/orders/${o.id}/release`, {}); load(); }
  async function status(o: Order, next: string) {
    await apiJson(`/api/orders/${o.id}/status`, { status: next }, "PATCH");
    load();
  }
  async function bump(o: Order) {
    await apiJson(`/api/orders/${o.id}/priority`, { priority: o.priority + 1 });
    load();
  }

  const pending    = orders.filter((o) => o.status === "pending");
  const preparing  = orders.filter((o) => o.status === "preparing");
  const ready      = orders.filter((o) => o.status === "ready");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl text-brown">{t("nav_orders")}</h1>
        <button onClick={claimNext} disabled={busy || pending.length === 0}
          className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50">
          Claim next ({pending.length})
        </button>
      </div>
      {error && <p className="mb-4 text-danger">{t(error)}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Column title={`Queue · ${pending.length}`} tone="pending">
          {pending.map((o) => (
            <Card key={o.id} order={o}>
              <button onClick={() => claim(o)} className="rounded-button bg-brown px-3 py-1 text-xs font-semibold text-white">Claim</button>
              {canBump && (
                <button onClick={() => bump(o)} className="rounded-button bg-peach px-3 py-1 text-xs">Bump ↑</button>
              )}
            </Card>
          ))}
          {pending.length === 0 && <Empty />}
        </Column>

        <Column title={`In progress · ${preparing.length}`} tone="preparing">
          {preparing.map((o) => (
            <Card key={o.id} order={o} highlight={o.assigned_to === user?.id}>
              <button onClick={() => status(o, "ready")} className="rounded-button bg-green-700 px-3 py-1 text-xs font-semibold text-white">Ready</button>
              <button onClick={() => release(o)} className="rounded-button bg-peach px-3 py-1 text-xs">Release</button>
              <button onClick={() => status(o, "cancelled")} className="rounded-button bg-danger/10 px-3 py-1 text-xs text-danger">Cancel</button>
            </Card>
          ))}
          {preparing.length === 0 && <Empty />}
        </Column>

        <Column title={`Ready · ${ready.length}`} tone="ready">
          {ready.map((o) => (
            <Card key={o.id} order={o}>
              <button onClick={() => status(o, "served")} className="rounded-button bg-brown px-3 py-1 text-xs font-semibold text-white">Served</button>
            </Card>
          ))}
          {ready.length === 0 && <Empty />}
        </Column>
      </div>
    </main>
  );
}

function Column({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  const bg = tone === "pending" ? "bg-yellow-50" : tone === "preparing" ? "bg-blue-50" : "bg-green-50";
  return (
    <section className={`flex flex-col gap-3 rounded-card p-3 ${bg}`}>
      <h2 className="font-heading text-lg text-brown">{title}</h2>
      {children}
    </section>
  );
}

function Empty() { return <p className="text-center text-sm text-mid">—</p>; }

function Card({ order, highlight, children }: { order: Order; highlight?: boolean; children: React.ReactNode }) {
  const total = order.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  return (
    <div className={`rounded-card bg-white p-3 shadow ${highlight ? "ring-2 ring-brown" : ""}`}>
      <div className="mb-2 flex items-baseline justify-between">
        {order.status === "pending"
          ? <span className="rounded-badge bg-brown px-2 py-0.5 text-lg font-bold text-white">#{order.queue_position}</span>
          : <span className="font-heading text-brown">Order #{order.id}</span>}
        <span className="font-mono text-sm">₱{total.toFixed(2)}</span>
      </div>
      <p className="text-sm">
        <strong>{order.customer_name}</strong>
        {order.table_number ? ` · Table ${order.table_number}` : ""}
      </p>
      {order.priority > 0 && <p className="text-xs font-semibold text-danger">Priority {order.priority}</p>}
      {order.assigned_to_name && <p className="text-xs text-mid">by {order.assigned_to_name}</p>}
      <ul className="my-2 text-sm">
        {order.lines.map((l, i) => (
          <li key={i}>{l.quantity}× {l.name}</li>
        ))}
      </ul>
      {order.notes && <p className="mb-2 text-xs italic text-mid">{order.notes}</p>}
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
