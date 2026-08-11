import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth } from "../auth";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";
import { LowStockBanner } from "../components/LowStockBanner";
import { ImageUpload } from "../components/ImageUpload";

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl text-brown">{t("nav_inventory")}</h1>
        <button
          onClick={() => setEditing("new")}
          className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
        >
          + {t("add_product")}
        </button>
      </div>
      <LowStockBanner count={lowCount} />
      {error && <p className="mb-4 text-danger">{t(error)}</p>}
      {loading ? (
        <p className="text-mid">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-mid">{t("inventory_empty")}</p>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden overflow-hidden rounded-card bg-white shadow md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-peach text-charcoal">
                <tr>
                  <th className="w-16 p-2"></th>
                  <th className="p-2">{t("name")}</th>
                  <th className="p-2">{t("category")}</th>
                  <th className="p-2 text-right">{t("quantity")}</th>
                  <th className="p-2">{t("unit")}</th>
                  <th className="p-2 text-right">{t("unit_price")}</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-brown/10">
                    <td className="p-2">
                      {p.image_path && <img src={`/${p.image_path}`} alt="" className="h-10 w-10 rounded object-cover" />}
                    </td>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-mid">{p.category ?? "—"}</td>
                    <td className={`p-2 text-right font-mono ${p.is_low && p.low_stock_threshold > 0 ? "text-danger" : ""}`}>
                      {p.quantity}
                    </td>
                    <td className="p-2 text-mid">{p.unit ?? "—"}</td>
                    <td className="p-2 text-right font-mono">{p.unit_price != null ? `₱${p.unit_price.toFixed(2)}` : "—"}</td>
                    <td className="space-x-1 p-2 text-right">
                      <button onClick={() => setAdjusting(p)} className="rounded-button bg-peach px-2 py-1 text-xs">
                        {t("adjust_stock")}
                      </button>
                      <button onClick={() => setEditing(p)} className="rounded-button bg-peach px-2 py-1 text-xs">
                        {t("edit")}
                      </button>
                      {canDelete && (
                        <button onClick={() => del(p)} className="rounded-button bg-danger/10 px-2 py-1 text-xs text-danger">
                          {t("delete")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-card bg-white p-3 shadow">
                {p.image_path
                  ? <img src={`/${p.image_path}`} alt="" className="h-16 w-16 rounded object-cover" />
                  : <div className="h-16 w-16 rounded bg-peach" />}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{p.name}</p>
                    <span className={`font-mono ${p.is_low && p.low_stock_threshold > 0 ? "text-danger" : ""}`}>
                      {p.quantity} {p.unit ?? ""}
                    </span>
                  </div>
                  <p className="text-xs text-mid">{p.category ?? "—"} · {p.unit_price != null ? `₱${p.unit_price.toFixed(2)}` : "—"}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setAdjusting(p)} className="rounded-button bg-peach px-2 py-1 text-xs">
                      {t("adjust_stock")}
                    </button>
                    <button onClick={() => setEditing(p)} className="rounded-button bg-peach px-2 py-1 text-xs">
                      {t("edit")}
                    </button>
                    {canDelete && (
                      <button onClick={() => del(p)} className="rounded-button bg-danger/10 px-2 py-1 text-xs text-danger">
                        {t("delete")}
                      </button>
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
      <form onSubmit={submit} className="flex flex-col gap-3">
        <ImageUpload kind="product" value={imagePath} onChange={setImagePath} />
        <Field label={t("name")}       required value={name}      onChange={setName} />
        <Field label={t("category")}            value={category}  onChange={setCategory} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("unit")}              value={unit}      onChange={setUnit} />
          <Field label={t("location")}          value={location}  onChange={setLocation} />
        </div>
        <Field label={t("supplier")}            value={supplier}  onChange={setSupplier} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("unit_price")} type="number" step="0.01" value={price} onChange={setPrice} />
          <Field label={t("low_stock_threshold")} type="number" step="0.01" value={threshold} onChange={setThreshold} />
        </div>
        {error && <p className="text-sm text-danger">{t(error)}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-button border border-brown/30 px-4 py-2 text-sm">
            {t("cancel")}
          </button>
          <button type="submit" disabled={busy}
            className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
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
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <input
        type={type} required={required} step={step}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-button border border-brown/30 px-3 py-2"
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
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-sm text-mid">
          {t("quantity")}: <span className="font-mono">{product.quantity}</span> {product.unit ?? ""}
        </p>
        <Field label={t("delta")} type="number" step="0.01" required value={delta} onChange={setDelta} />
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("reason")}</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
            className="rounded-button border border-brown/30 px-3 py-2">
            {REASONS.map((r) => <option key={r} value={r}>{t(`reason_${r}`)}</option>)}
          </select>
        </label>
        {reason === "waste" && (
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("reason_code")}</span>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}
              className="rounded-button border border-brown/30 px-3 py-2">
              {wasteReasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </label>
        )}
        <Field label={t("note")} value={note} onChange={setNote} />
        {error && <p className="text-sm text-danger">{t(error)}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-button border border-brown/30 px-4 py-2 text-sm">
            {t("cancel")}
          </button>
          <button type="submit" disabled={busy}
            className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy ? t("loading") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
