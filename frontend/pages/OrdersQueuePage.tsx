import { useCallback, useEffect, useState } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth } from "../auth";
import { useLang } from "../lang";
import { IconArrow, IconCheck, IconClose, IconUp } from "../components/Icon";

interface OrderLine { menu_item_id: number; quantity: number; unit_price: number; name: string }
interface Order {
  id: number;
  customer_name: string;
  table_number: string | null;
  location_name: string | null;
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

type Tone = "pending" | "preparing" | "ready";

const TONE_CHIP: Record<Tone, string> = {
  pending:   "bg-warn-bg text-warn-fg",
  preparing: "bg-info-bg text-info-fg",
  ready:     "bg-ok-bg text-ok-fg",
};

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
  async function claim(o: Order)   { await apiJson(`/api/orders/${o.id}/claim`, {}); load(); }
  async function release(o: Order) { await apiJson(`/api/orders/${o.id}/release`, {}); load(); }
  async function status(o: Order, next: string) {
    await apiJson(`/api/orders/${o.id}/status`, { status: next }, "PATCH"); load();
  }
  async function bump(o: Order) {
    await apiJson(`/api/orders/${o.id}/priority`, { priority: o.priority + 1 }); load();
  }

  const pending    = orders.filter((o) => o.status === "pending");
  const preparing  = orders.filter((o) => o.status === "preparing");
  const ready      = orders.filter((o) => o.status === "ready");

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-hair pb-6">
        <div>
          <h1 className="font-heading text-4xl text-brown-deep">{t("nav_orders")}</h1>
          <p className="mt-3 flex gap-x-8 gap-y-1 text-sm text-mid">
            <span><span className="font-mono text-ink">{pending.length}</span> waiting</span>
            <span><span className="font-mono text-ink">{preparing.length}</span> in progress</span>
            <span><span className="font-mono text-ink">{ready.length}</span> ready</span>
          </p>
        </div>
        <button onClick={claimNext} disabled={busy || pending.length === 0} className="btn-primary">
          Claim next
          <span className="font-mono text-xs opacity-80">({pending.length})</span>
          <IconArrow size={14} />
        </button>
      </header>

      {error && <p className="mb-6 text-sm text-danger">{t(error)}</p>}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Column title={t("nav_orders")} label="Queue" count={pending.length} tone="pending">
          {pending.map((o) => (
            <Card key={o.id} order={o} tone="pending">
              <button onClick={() => claim(o)} className="btn-ghost">
                <IconCheck size={12} /> Claim
              </button>
              {canBump && (
                <button onClick={() => bump(o)} className="btn-quiet">
                  <IconUp size={12} /> Bump
                </button>
              )}
            </Card>
          ))}
          {pending.length === 0 && <Empty label="Queue clear." />}
        </Column>

        <Column title="Preparing" label="In progress" count={preparing.length} tone="preparing">
          {preparing.map((o) => (
            <Card key={o.id} order={o} tone="preparing" highlight={o.assigned_to === user?.id}>
              <button onClick={() => status(o, "ready")} className="btn-primary !px-3 !py-1.5 !text-xs">
                <IconCheck size={12} /> Ready
              </button>
              <button onClick={() => release(o)} className="btn-quiet">Release</button>
              <button onClick={() => status(o, "cancelled")} className="btn-quiet hover:!text-danger">
                <IconClose size={12} /> Cancel
              </button>
            </Card>
          ))}
          {preparing.length === 0 && <Empty label="Nothing in progress." />}
        </Column>

        <Column title="Ready" label="For pickup" count={ready.length} tone="ready">
          {ready.map((o) => (
            <Card key={o.id} order={o} tone="ready">
              <button onClick={() => status(o, "served")} className="btn-ghost">
                <IconCheck size={12} /> Served
              </button>
            </Card>
          ))}
          {ready.length === 0 && <Empty label="Nothing waiting." />}
        </Column>
      </div>
    </main>
  );
}

function Column({
  title, label, count, tone, children,
}: {
  title: string; label: string; count: number; tone: Tone; children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between border-b border-hair-strong pb-3">
        <h2 className="font-heading text-xl text-brown-deep">{title}</h2>
        <div className="flex items-baseline gap-3 text-xs uppercase tracking-[0.14em]">
          <span className={`chip ${TONE_CHIP[tone]}`}>{label}</span>
          <span className="font-mono text-mid">{count}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="border border-dashed border-hair-strong px-3 py-6 text-center text-sm text-muted">{label}</p>;
}

function Card({
  order, tone, highlight, children,
}: {
  order: Order; tone: Tone; highlight?: boolean; children: React.ReactNode;
}) {
  const total = order.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  return (
    <article
      className={`border bg-paper p-4 transition-shadow ${
        highlight ? "border-brown-deep shadow-[0_0_0_1px_var(--color-brown-deep)]" : "border-hair"
      }`}
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        {order.status === "pending" ? (
          <span className="font-mono text-2xl leading-none text-brown-deep">
            <span className="text-muted">#</span>{order.queue_position}
          </span>
        ) : (
          <span className="font-heading text-lg text-brown-deep">Order #{order.id}</span>
        )}
        <span className="font-mono text-sm text-ink">₱{total.toFixed(2)}</span>
      </header>

      <p className="text-sm text-ink">
        {order.customer_name}
        {order.table_number && (
          <>
            <span className="mx-2 text-hair-strong">·</span>
            <span className="text-mid">Table {order.table_number}</span>
          </>
        )}
        {order.location_name && (
          <>
            <span className="mx-2 text-hair-strong">·</span>
            <span className="text-muted">{order.location_name}</span>
          </>
        )}
      </p>

      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        {order.priority > 0 && (
          <span className={`chip ${TONE_CHIP[tone === "pending" ? "pending" : "preparing"]}`}>
            Priority {order.priority}
          </span>
        )}
        {order.assigned_to_name && (
          <span className="text-muted">by {order.assigned_to_name}</span>
        )}
      </div>

      <ul className="my-4 border-t border-hair pt-3 text-sm text-ink">
        {order.lines.map((l, i) => (
          <li key={i} className="flex justify-between py-0.5">
            <span>{l.name}</span>
            <span className="font-mono text-muted">×{l.quantity}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-3 text-xs italic text-mid">
          <span className="mr-2 text-muted">Note ·</span>{order.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div>
    </article>
  );
}
