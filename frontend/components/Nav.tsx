import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { hasRole, useAuth, type Role } from "../auth";
import { useLang } from "../lang";
import { LangPicker } from "./LangPicker";
import { IconMenu, IconClose } from "./Icon";

interface Item { to: string; key: string; min: Role; not?: Role }
const ITEMS: Item[] = [
  // Owner runs the place, not the counter — menu browsing and order
  // tracking are for visitors/staff, so owner is excluded even though
  // "visitor" would otherwise let every role through.
  { to: "/",            key: "nav_menu",      min: "visitor", not: "owner" },
  { to: "/orders/mine", key: "nav_my_orders", min: "visitor", not: "owner" },
  { to: "/inventory",   key: "nav_inventory", min: "staff" },
  { to: "/orders",      key: "nav_orders",    min: "staff" },
  { to: "/upload",      key: "nav_upload",    min: "staff" },
  { to: "/menu/edit",   key: "nav_menu_edit", min: "owner" },
  { to: "/tables",      key: "nav_tables",    min: "owner" },
  { to: "/users",       key: "nav_users",     min: "owner" },
  { to: "/analytics",   key: "nav_analytics", min: "owner" },
];

export function Nav() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Staff+ see the tab strip. Visitors and unauthenticated users only see
  // the logo, lang picker, and login button — no navigation tabs.
  const showTabs = hasRole(user, "staff");
  const visible = showTabs ? ITEMS.filter((i) => hasRole(user, i.min) && i.not !== user?.role) : [];

  return (
    <header className="sticky top-0 z-20 border-b border-hair bg-peach/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link to="/" className="font-heading text-xl tracking-tight text-brown-deep">
          {t("app_name")}
        </Link>

        <ul className="hidden flex-1 items-center gap-6 md:flex">
          {visible.map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                end={i.to === "/"}
                onClick={close}
                className={({ isActive }) =>
                  `relative py-1 text-sm transition-colors ${
                    isActive
                      ? "text-brown-deep after:absolute after:-bottom-[9px] after:left-0 after:right-0 after:h-px after:bg-brown-deep"
                      : "text-mid hover:text-brown-deep"
                  }`
                }
              >
                {t(i.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:block"><LangPicker /></div>
          {user ? (
            <button onClick={logout} className="btn-ghost">{t("logout")}</button>
          ) : (
            <Link to="/login" className="btn-primary">{t("login")}</Link>
          )}
          <button
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "close menu" : "open menu"}
          >
            {open ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-hair bg-peach px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {visible.map((i) => (
              <li key={i.to}>
                <NavLink
                  to={i.to}
                  end={i.to === "/"}
                  onClick={close}
                  className={({ isActive }) =>
                    `block text-base ${isActive ? "text-brown-deep" : "text-mid"}`
                  }
                >
                  {t(i.key)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="rule mt-4 pt-4"><LangPicker /></div>
        </div>
      )}
    </header>
  );
}
