import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";
import { ImageUpload } from "../components/ImageUpload";

interface Ingredient {
  product_id: number;
  quantity: number;
  product_name?: string;
  unit?: string | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_path: string | null;
  available: number;
  ingredients: Ingredient[];
}

interface ProductLite { id: number; name: string; unit: string | null }

export function MenuAdminPage() {
  const { t } = useLang();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [recipeFor, setRecipeFor] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        api<MenuItem[]>("/api/menu/all"),
        api<ProductLite[]>("/api/products"),
      ]);
      setItems(m);
      setProducts(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function toggle(it: MenuItem) {
    await apiJson(`/api/menu/${it.id}/availability`, { available: !it.available });
    load();
  }
  async function del(it: MenuItem) {
    if (!confirm(`${t("confirm_delete")} ${it.name}`)) return;
    await api(`/api/menu/${it.id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl text-brown">{t("nav_menu_edit")}</h1>
        <button onClick={() => setEditing("new")}
          className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
          + {t("add_dish")}
        </button>
      </div>
      {loading && <p>{t("loading")}</p>}
      {error && <p className="text-danger">{t(error)}</p>}
      {!loading && items.length === 0 && <p className="text-mid">{t("menu_empty")}</p>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col overflow-hidden rounded-card bg-white shadow">
            {it.image_path
              ? <img src={`/${it.image_path}`} alt="" className="h-32 w-full object-cover" />
              : <div className="h-32 w-full bg-peach" />}
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{it.name}</h3>
                <span className="font-mono">₱{it.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-mid">
                {it.category ?? "—"} · {it.ingredients.length} {t("recipe").toLowerCase()}
              </p>
              <span className={`inline-block w-max rounded-badge px-2 py-0.5 text-xs ${it.available ? "bg-green-100 text-green-800" : "bg-danger/10 text-danger"}`}>
                {t(it.available ? "available" : "unavailable")}
              </span>
              <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
                <button onClick={() => setEditing(it)} className="rounded-button bg-peach px-2 py-1">{t("edit")}</button>
                <button onClick={() => setRecipeFor(it)} className="rounded-button bg-peach px-2 py-1">{t("recipe")}</button>
                <button onClick={() => toggle(it)} className="rounded-button bg-peach px-2 py-1">
                  {it.available ? "86'" : "Un-86'"}
                </button>
                <button onClick={() => del(it)} className="rounded-button bg-danger/10 px-2 py-1 text-danger">
                  {t("delete")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <MenuForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {recipeFor && (
        <RecipeEditor
          item={recipeFor} products={products}
          onClose={() => setRecipeFor(null)}
          onSaved={() => { setRecipeFor(null); load(); }}
        />
      )}
    </main>
  );
}

function MenuForm({
  initial, onClose, onSaved,
}: { initial: MenuItem | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [imagePath, setImagePath] = useState<string | null>(initial?.image_path ?? null);
  const [available, setAvailable] = useState(initial ? !!initial.available : true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const body = {
        name, description: description || null, category: category || null,
        price: Number(price), image_path: imagePath, available,
      };
      if (initial) await apiJson(`/api/menu/${initial.id}`, body, "PATCH");
      else         await apiJson("/api/menu", body, "POST");
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={initial ? t("edit_dish") : t("add_dish")}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <ImageUpload kind="menu" value={imagePath} onChange={setImagePath} />
        <Row label={t("name")} required value={name} onChange={setName} />
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("description")}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="rounded-button border border-brown/30 px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Row label={t("category")} value={category} onChange={setCategory} />
          <Row label={t("price")} type="number" step="0.01" required value={price} onChange={setPrice} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          <span>{t("available")}</span>
        </label>
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

function Row({
  label, value, onChange, type = "text", required, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; step?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <input type={type} required={required} step={step}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-button border border-brown/30 px-3 py-2" />
    </label>
  );
}

function RecipeEditor({
  item, products, onClose, onSaved,
}: { item: MenuItem; products: ProductLite[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<Ingredient[]>(
    item.ingredients.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    if (products.length === 0) return;
    setRows((r) => [...r, { product_id: products[0].id, quantity: 1 }]);
  }
  function updateRow(idx: number, patch: Partial<Ingredient>) {
    setRows((r) => r.map((row, i) => i === idx ? { ...row, ...patch } : row));
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null); setBusy(true);
    try {
      await apiJson(`/api/menu/${item.id}/recipe`, { ingredients: rows }, "PUT");
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={`${t("recipe")} — ${item.name}`}>
      <div className="flex flex-col gap-3">
        {rows.length === 0 && <p className="text-sm text-mid">No ingredients.</p>}
        {rows.map((row, i) => {
          const p = products.find((x) => x.id === row.product_id);
          return (
            <div key={i} className="flex items-center gap-2">
              <select value={row.product_id}
                onChange={(e) => updateRow(i, { product_id: Number(e.target.value) })}
                className="flex-1 rounded-button border border-brown/30 px-2 py-1 text-sm">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ""}</option>
                ))}
              </select>
              <input type="number" step="0.01" min="0" value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
                className="w-20 rounded-button border border-brown/30 px-2 py-1 text-right text-sm" />
              <span className="w-10 text-xs text-mid">{p?.unit ?? ""}</span>
              <button onClick={() => removeRow(i)} className="text-danger" aria-label="remove">✕</button>
            </div>
          );
        })}
        <button onClick={addRow} className="rounded-button border border-brown/30 py-1 text-sm">
          {t("add_ingredient")}
        </button>
        {error && <p className="text-sm text-danger">{t(error)}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-button border border-brown/30 px-4 py-2 text-sm">
            {t("cancel")}
          </button>
          <button onClick={save} disabled={busy}
            className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy ? t("loading") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
