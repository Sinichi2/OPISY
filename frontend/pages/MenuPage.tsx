import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useLang } from "../lang";
import { useCart } from "../cart";
import { IconSearch, IconPlus, IconArrow } from "../components/Icon";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_path: string | null;
}

export function MenuPage() {
  const { t } = useLang();
  const { add, lines, total } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<MenuItem[]>("/api/menu")
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.key : "error_generic"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) => {
    const s = q.toLowerCase();
    return !s || i.name.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s);
  });
  const byCategory = new Map<string, MenuItem[]>();
  for (const it of filtered) {
    const cat = it.category ?? "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(it);
  }
  const cartCount = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-16">
      {/* <header className="rise mb-16 max-w-3xl">
        <h1 className="font-heading text-5xl leading-[1.05] text-brown-deep sm:text-6xl">
          {t("nav_menu")}
        </h1>
        <p className="mt-6 max-w-xl text-base text-mid">
          Everything the kitchen can send out right now. Prices in pesos, cash or card at the register.
        </p>
      </header> */}

      <div className="mb-12 flex items-center gap-3 border-b border-hair pb-2">
        <IconSearch size={16} className="text-muted" />
        <input
          type="search"
          placeholder="Search dishes or categories"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-transparent py-1 text-base text-ink outline-none placeholder:text-muted"
        />
      </div>

      {loading && <p className="text-mid">{t("loading")}</p>}
      {error && <p className="text-danger">{t(error)}</p>}
      {!loading && filtered.length === 0 && (
        <p className="border-t border-hair pt-8 text-mid">{t("menu_empty")}</p>
      )}

      <div className="flex flex-col gap-20">
        {[...byCategory.entries()].map(([cat, list]) => (
          <section key={cat}>
            <div className="mb-8 flex items-baseline justify-between border-b border-hair pb-3">
              <h2 className="font-heading text-3xl text-brown-deep">{cat}</h2>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {list.length} {list.length === 1 ? "dish" : "dishes"}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
              {list.map((it) => (
                <li key={it.id} className="group flex gap-5">
                  {it.image_path
                    ? <img
                        src={`/${it.image_path}`}
                        alt=""
                        loading="lazy"
                        className="h-24 w-24 shrink-0 border border-hair object-cover"
                      />
                    : <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-dashed border-hair-strong text-xs uppercase tracking-[0.14em] text-muted">
                        {it.name.slice(0, 1)}
                      </div>}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-heading text-xl text-brown-deep">{it.name}</h3>
                      <span className="font-mono text-base text-ink">
                        ₱{it.price.toFixed(2)}
                      </span>
                    </div>
                    {it.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-mid">{it.description}</p>
                    )}
                    <button
                      onClick={() => add({
                        menu_item_id: it.id, name: it.name, price: it.price, image_path: it.image_path,
                      })}
                      className="btn-quiet mt-auto self-start pt-3"
                    >
                      <IconPlus size={12} />
                      <span>{t("add_to_cart")}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {cartCount > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-6 right-6 z-10 flex items-center gap-4 border border-brown-deep bg-brown-deep px-5 py-3 text-paper transition-transform hover:-translate-y-px active:scale-[0.99]"
        >
          <span className="text-sm">
            <span className="font-mono">{cartCount}</span> in cart
            <span className="mx-2 opacity-40">/</span>
            <span className="font-mono">₱{total.toFixed(2)}</span>
          </span>
          <IconArrow size={16} />
        </Link>
      )}
    </main>
  );
}
