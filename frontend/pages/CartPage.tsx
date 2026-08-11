import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson, ApiError } from "../api";
import { useCart } from "../cart";
import { useLang } from "../lang";
import { IconPlus, IconMinus, IconClose, IconArrow } from "../components/Icon";

const MY_ORDER_TOKEN = "opisy_my_order_token";

export function CartPage() {
  const { t } = useLang();
  const { lines, setQty, remove, clear, total } = useCart();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await apiJson<{ id: number; order_token: string; queue_position: number }>(
        "/api/orders",
        {
          customer_name: name, table_number: table || null, notes: notes || null,
          lines: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
        },
      );
      localStorage.setItem(MY_ORDER_TOKEN, res.order_token);
      clear();
      nav("/orders/mine", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <h1 className="font-heading text-4xl text-brown-deep">{t("nav_cart")}</h1>
      </header>

      {lines.length === 0 ? (
        <div className="border-t border-hair py-16 text-center">
          <p className="mb-6 text-mid">Your cart is empty.</p>
          <Link to="/" className="btn-primary">
            {t("back_home")}
            <IconArrow size={14} />
          </Link>
        </div>
      ) : (
        <>
          <ul className="mb-8 divide-y divide-hair border-t border-b border-hair">
            {lines.map((l) => (
              <li key={l.menu_item_id} className="flex items-center gap-4 py-4">
                {l.image_path
                  ? <img src={`/${l.image_path}`} alt="" className="h-14 w-14 border border-hair object-cover" />
                  : <div className="h-14 w-14 border border-dashed border-hair-strong" />}
                <div className="flex-1">
                  <p className="text-ink">{l.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted">₱{l.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1 border border-hair-strong">
                  <button
                    onClick={() => setQty(l.menu_item_id, l.quantity - 1)}
                    className="grid h-8 w-8 place-items-center text-mid transition-colors hover:text-brown-deep"
                    aria-label="decrease"
                  >
                    <IconMinus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{l.quantity}</span>
                  <button
                    onClick={() => setQty(l.menu_item_id, l.quantity + 1)}
                    className="grid h-8 w-8 place-items-center text-mid transition-colors hover:text-brown-deep"
                    aria-label="increase"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
                <span className="w-20 text-right font-mono text-sm text-ink">
                  ₱{(l.price * l.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => remove(l.menu_item_id)}
                  className="text-mid transition-colors hover:text-danger"
                  aria-label="remove"
                >
                  <IconClose size={14} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mb-12 flex items-baseline justify-end gap-4">
            <span className="text-xs uppercase tracking-[0.18em] text-muted">Total</span>
            <span className="font-mono text-2xl text-brown-deep">₱{total.toFixed(2)}</span>
          </div>

          <form onSubmit={submit} className="grid gap-8 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Your name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="field" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Table number (optional)</span>
              <input value={table} onChange={(e) => setTable(e.target.value)} className="field" />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="field" />
            </label>
            {error && (
              <p className="text-sm text-danger sm:col-span-2">{t(error)}</p>
            )}
            <div className="sm:col-span-2 sm:flex sm:justify-end">
              <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
                {busy ? t("loading") : `Place order · ₱${total.toFixed(2)}`}
                <IconArrow size={14} />
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
