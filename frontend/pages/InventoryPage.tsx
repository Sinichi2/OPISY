import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth } from "../auth";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";
import { LowStockBanner } from "../components/LowStockBanner";
import { ImageUpload } from "../components/ImageUpload";
import { IconPlus, IconArrow } from "../components/Icon";

interface Product {
  id: number;
  name: string;
  category: string | null;
  unit: string | null;
  location: string | null;
  supplier: string | null;
  unit_price: number | null;
  image_path: string | null;
  low_stock_threshold: number;
  quantity: number;
  is_low: number;
  last_moved_at: string | null;
}

interface WasteReason { code: string; label: string }

const REASONS = ["opening", "delivery", "usage", "waste", "correction"] as const;

export function InventoryPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const canDelete = hasRole(user, "owner");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [wasteReasons, setWasteReasons] = useState<WasteReason[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await api<Product[]>("/api/products");
      setItems(rows);
      const wr = await api<WasteReason[]>("/api/waste-reasons");
      setWasteReasons(wr);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function del(p: Product) {
    if (!confirm(`${t("confirm_delete")} ${p.name}`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    }
  }

  const lowCount = items.filter((p) => p.is_low && p.low_stock_threshold > 0).length;
  const totalValue = items.reduce((s, p) => s + (p.unit_price ?? 0) * p.quantity, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-hair pb-6">
        <div>
          <h1 className="font-heading text-4xl text-brown-deep">{t("nav_inventory")}</h1>
          <p className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-mid">
            <span><span className="font-mono text-ink">{items.length}</span> products</span>
            <span><span className="font-mono text-ink">{lowCount}</span> below threshold</span>
            <span><span className="font-mono text-ink">₱{totalValue.toFixed(0)}</span> on-hand value</span>
          </p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">
          <IconPlus size={14} />
          {t("add_product")}
        </button>
      </header>

      <LowStockBanner count={lowCount} />
      {error && <p className="mb-6 text-sm text-danger">{t(error)}</p>}

      {loading ? (
        <p className="text-mid">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="border-t border-hair pt-8 text-mid">{t("inventory_empty")}</p>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hair-strong text-left text-xs uppercase tracking-[0.14em] text-muted">
                  <th className="w-14 py-3 pr-3 font-normal"></th>
                  <th className="py-3 pr-3 font-normal">{t("name")}</th>
                  <th className="py-3 pr-3 font-normal">{t("category")}</th>
                  <th className="py-3 pr-3 text-right font-normal">{t("quantity")}</th>
                  <th className="py-3 pr-3 font-normal">{t("unit")}</th>
                  <th className="py-3 pr-3 text-right font-normal">{t("unit_price")}</th>
                  <th className="py-3 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-hair transition-colors hover:bg-ivory/40">
                    <td className="py-3 pr-3">
                      {p.image_path
                        ? <img src={`/${p.image_path}`} alt="" className="h-10 w-10 border border-hair object-cover" />
                        : <div className="h-10 w-10 border border-dashed border-hair-strong" />}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-ink">{p.name}</span>
                      {p.location && (
                        <span className="ml-2 text-xs text-muted">{p.location}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-mid">{p.category ?? "—"}</td>
                    <td className={`py-3 pr-3 text-right font-mono ${p.is_low && p.low_stock_threshold > 0 ? "text-danger" : "text-ink"}`}>
                      {p.quantity}
                    </td>
                    <td className="py-3 pr-3 text-mid">{p.unit ?? "—"}</td>
                    <td className="py-3 pr-3 text-right font-mono text-ink">
                      {p.unit_price != null ? `₱${p.unit_price.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setAdjusting(p)} className="btn-quiet">
                          {t("adjust_stock")}
                        </button>
                        <button onClick={() => setEditing(p)} className="btn-quiet">
                          {t("edit")}
                        </button>
                        {canDelete && (
                          <button onClick={() => del(p)} className="btn-quiet hover:!text-danger">
                            {t("delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked rows */}
          <ul className="flex flex-col md:hidden">
            {items.map((p) => (
              <li key={p.id} className="flex gap-3 border-b border-hair py-4">
                {p.image_path
                  ? <img src={`/${p.image_path}`} alt="" className="h-16 w-16 border border-hair object-cover" />
                  : <div className="h-16 w-16 border border-dashed border-hair-strong" />}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-ink">{p.name}</p>
                    <span className={`font-mono text-sm ${p.is_low && p.low_stock_threshold > 0 ? "text-danger" : "text-ink"}`}>
                      {p.quantity} {p.unit ?? ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {p.category ?? "—"}
                    <span className="mx-2 text-hair-strong">·</span>
                    {p.unit_price != null ? `₱${p.unit_price.toFixed(2)}` : "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <button onClick={() => setAdjusting(p)} className="btn-quiet px-0">
                      {t("adjust_stock")} <IconArrow size={11} />
                    </button>
                    <span className="text-hair-strong">·</span>
                    <button onClick={() => setEditing(p)} className="btn-quiet px-0">
                      {t("edit")}
                    </button>
                    {canDelete && (
                      <>
                        <span className="text-hair-strong">·</span>
                        <button onClick={() => del(p)} className="btn-quiet px-0 hover:!text-danger">
                          {t("delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {adjusting && (
        <MovementForm
          product={adjusting} wasteReasons={wasteReasons}
          onClose={() => setAdjusting(null)}
          onSaved={() => { setAdjusting(null); load(); }}
        />
      )}
    </main>
  );
}

interface FormProps {
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductForm({ initial, onClose, onSaved }: FormProps) {
  const { t } = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [supplier, setSupplier] = useState(initial?.supplier ?? "");
  const [price, setPrice] = useState(initial?.unit_price != null ? String(initial.unit_price) : "");
  const [threshold, setThreshold] = useState(String(initial?.low_stock_threshold ?? 0));
  const [imagePath, setImagePath] = useState<string | null>(initial?.image_path ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    const body = {
      name, category: category || null, unit: unit || null,
      location: location || null, supplier: supplier || null,
      unit_price: price ? Number(price) : null,
      low_stock_threshold: Number(threshold) || 0,
      image_path: imagePath,
    };
    try {
      if (initial) await apiJson(`/api/products/${initial.id}`, body, "PATCH");
      else         await apiJson("/api/products", body, "POST");
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial ? t("edit_product") : t("add_product")}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <ImageUpload kind="product" value={imagePath} onChange={setImagePath} />
        <Field label={t("name")} required value={name} onChange={setName} />
        <Field label={t("category")}       value={category}  onChange={setCategory} />
        <div className="grid grid-cols-2 gap-6">
          <Field label={t("unit")}     value={unit}     onChange={setUnit} />
          <Field label={t("location")} value={location} onChange={setLocation} />
        </div>
        <Field label={t("supplier")} value={supplier} onChange={setSupplier} />
        <div className="grid grid-cols-2 gap-6">
          <Field label={t("unit_price")} type="number" step="0.01" value={price} onChange={setPrice} />
          <Field label={t("low_stock_threshold")} type="number" step="0.01" value={threshold} onChange={setThreshold} />
        </div>
        {error && <p className="text-sm text-danger">{t(error)}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">{t("cancel")}</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t("loading") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label, value, onChange, type = "text", required, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; step?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        type={type} required={required} step={step}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </label>
  );
}

function MovementForm({
  product, wasteReasons, onClose, onSaved,
}: {
  product: Product; wasteReasons: WasteReason[];
  onClose: () => void; onSaved: () => void;
}) {
  const { t } = useLang();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("delivery");
  const [reasonCode, setReasonCode] = useState(wasteReasons[0]?.code ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(delta);
    if (!n) return setError("delta");
    setError(null); setBusy(true);
    try {
      await apiJson("/api/stock/movements", {
        product_id: product.id, delta: n, reason,
        reason_code: reason === "waste" ? reasonCode : null,
        note: note || null,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`${t("adjust_stock")} — ${product.name}`}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <p className="flex items-baseline justify-between border-b border-hair pb-3 text-sm text-mid">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Current on-hand</span>
          <span className="font-mono text-lg text-ink">{product.quantity} {product.unit ?? ""}</span>
        </p>
        <Field label={t("delta")} type="number" step="0.01" required value={delta} onChange={setDelta} />
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("reason")}</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
            className="field"
          >
            {REASONS.map((r) => <option key={r} value={r}>{t(`reason_${r}`)}</option>)}
          </select>
        </label>
        {reason === "waste" && (
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("reason_code")}</span>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="field">
              {wasteReasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </label>
        )}
        <Field label={t("note")} value={note} onChange={setNote} />
        {error && <p className="text-sm text-danger">{t(error)}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">{t("cancel")}</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t("loading") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
