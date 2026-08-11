import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";
import { ImageUpload } from "../components/ImageUpload";
import { IconClose, IconPlus } from "../components/Icon";

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

  const available = items.filter((i) => i.available).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-hair pb-6">
        <div>
          <h1 className="font-heading text-4xl text-brown-deep">{t("nav_menu_edit")}</h1>
          <p className="mt-3 text-sm text-mid">
            <span className="font-mono text-ink">{available}</span> of{" "}
            <span className="font-mono text-ink">{items.length}</span> dishes currently on the menu
          </p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">
          <IconPlus size={14} />
          {t("add_dish")}
        </button>
      </header>

      {loading && <p className="text-mid">{t("loading")}</p>}
      {error && <p className="text-sm text-danger">{t(error)}</p>}
      {!loading && items.length === 0 && (
        <p className="border-t border-hair pt-8 text-mid">{t("menu_empty")}</p>
      )}

      <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col border border-hair bg-paper">
            {it.image_path
              ? <img src={`/${it.image_path}`} alt="" className="h-40 w-full object-cover" />
              : <div className="grid h-40 w-full place-items-center border-b border-dashed border-hair-strong text-xs uppercase tracking-[0.14em] text-muted">
                  No image
                </div>}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-lg text-brown-deep">{it.name}</h3>
                <span className="font-mono text-sm text-ink">₱{it.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted">
                {it.category ?? "Uncategorised"}
                <span className="mx-2 text-hair-strong">·</span>
                {it.ingredients.length} {t("recipe").toLowerCase()}
              </p>
              <span className={`chip w-max ${it.available ? "bg-ok-bg text-ok-fg" : "bg-danger-bg text-danger"}`}>
                {t(it.available ? "available" : "unavailable")}
              </span>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs">
                <button onClick={() => setEditing(it)} className="btn-quiet px-0">{t("edit")}</button>
                <span className="text-hair-strong">·</span>
                <button onClick={() => setRecipeFor(it)} className="btn-quiet px-0">{t("recipe")}</button>
                <span className="text-hair-strong">·</span>
                <button onClick={() => toggle(it)} className="btn-quiet px-0">
                  {it.available ? "86" : "Un-86"}
                </button>
                <span className="text-hair-strong">·</span>
                <button onClick={() => del(it)} className="btn-quiet px-0 hover:!text-danger">
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
      <form onSubmit={submit} className="flex flex-col gap-6">
        <ImageUpload kind="menu" value={imagePath} onChange={setImagePath} />
        <Row label={t("name")} required value={name} onChange={setName} />
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("description")}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="field" />
        </label>
        <div className="grid grid-cols-2 gap-6">
          <Row label={t("category")} value={category} onChange={setCategory} />
          <Row label={t("price")} type="number" step="0.01" required value={price} onChange={setPrice} />
        </div>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox" checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 accent-brown-deep"
          />
          <span>{t("available")}</span>
        </label>
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

function Row({
  label, value, onChange, type = "text", required, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; step?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <input type={type} required={required} step={step}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="field" />
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
      <div className="flex flex-col gap-5">
        {rows.length === 0 && (
          <p className="border-t border-b border-hair py-6 text-center text-sm text-muted">
            No ingredients yet.
          </p>
        )}

        {rows.length > 0 && (
          <div className="divide-y divide-hair border-t border-b border-hair">
            {rows.map((row, i) => {
              const p = products.find((x) => x.id === row.product_id);
              return (
                <div key={i} className="flex items-center gap-3 py-3">
                  <select
                    value={row.product_id}
                    onChange={(e) => updateRow(i, { product_id: Number(e.target.value) })}
                    className="field flex-1"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ""}</option>
                    ))}
                  </select>
                  <input
                    type="number" step="0.01" min="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
                    className="field w-20 text-right font-mono"
                  />
                  <span className="w-10 text-xs text-muted">{p?.unit ?? ""}</span>
                  <button
                    onClick={() => removeRow(i)}
                    className="text-mid transition-colors hover:text-danger"
                    aria-label="remove"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={addRow} className="btn-ghost self-start">
          <IconPlus size={12} />
          {t("add_ingredient")}
        </button>

        {error && <p className="text-sm text-danger">{t(error)}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{t("cancel")}</button>
          <button onClick={save} disabled={busy} className="btn-primary">
            {busy ? t("loading") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
