import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  image_path: string | null;
}

interface CartState {
  lines: CartLine[];
  add: (item: Omit<CartLine, "quantity">) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  total: number;
}

const Ctx = createContext<CartState | null>(null);
const STORAGE = "opisy_cart";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(lines)); }, [lines]);

  const add: CartState["add"] = (item) => {
    setLines((cur) => {
      const idx = cur.findIndex((l) => l.menu_item_id === item.menu_item_id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...cur, { ...item, quantity: 1 }];
    });
  };
  const setQty: CartState["setQty"] = (id, qty) => {
    if (qty <= 0) return remove(id);
    setLines((cur) => cur.map((l) => l.menu_item_id === id ? { ...l, quantity: qty } : l));
  };
  const remove: CartState["remove"] = (id) => {
    setLines((cur) => cur.filter((l) => l.menu_item_id !== id));
  };
  const clear = () => setLines([]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  return <Ctx.Provider value={{ lines, add, setQty, remove, clear, total }}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart outside CartProvider");
  return v;
}
