import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, hasRole, useAuth } from "./auth";
import { LangProvider, useLang } from "./lang";
import { CartProvider } from "./cart";
import { api, setUnauthorizedHandler } from "./api";
import { Nav } from "./components/Nav";
import { LangPicker } from "./components/LangPicker";
import { RoleGate } from "./components/RoleGate";
import { LoginPage } from "./pages/LoginPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { UploadPage } from "./pages/UploadPage";
import { MenuPage } from "./pages/MenuPage";
import { MfaSetupPage } from "./pages/MfaSetupPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { InventoryPage } from "./pages/InventoryPage";
import { MenuAdminPage } from "./pages/MenuAdminPage";
import { TablesPage } from "./pages/TablesPage";
import { CartPage } from "./pages/CartPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { OrdersQueuePage } from "./pages/OrdersQueuePage";
import { UsersPage } from "./pages/UsersPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

const SCANNED_TABLE = "opisy_table";

function Redirector() {
  const nav = useNavigate();
  useEffect(() => {
    setUnauthorizedHandler(() => nav("/login", { replace: true }));
  }, [nav]);
  return null;
}

function ForceReset() {
  const { user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (user?.must_reset_password && loc.pathname !== "/change-password") {
      nav("/change-password", { replace: true });
    }
  }, [user, loc.pathname, nav]);
  return null;
}

function TitleSync() {
  const { t } = useLang();
  useEffect(() => { document.title = t("window_title"); }, [t]);
  return null;
}

function StaffNav() {
  const { user } = useAuth();
  if (!hasRole(user, "staff")) return null;
  return <Nav />;
}

// Owner runs the floor, not the counter: keep them off the customer-facing
// menu/order-tracking pages. Anonymous visitors and every other role pass
// straight through, so this can't reuse RoleGate's "must be logged in" check.
function NotOwner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "owner") return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}

// Captures a scanned table QR's `?t=<table id>` off the URL, resolves it to
// a label/location, and stashes it for CartPage to pick up — same
// localStorage-handoff pattern as the order token in cart.tsx/MyOrdersPage.
function TableCapture() {
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const t = params.get("t");
    if (!t) return;
    api(`/api/tables/${t}`)
      .then((table) => localStorage.setItem(SCANNED_TABLE, JSON.stringify(table)))
      .catch(() => {})
      .finally(() => {
        params.delete("t");
        nav({ pathname: loc.pathname, search: params.toString() }, { replace: true });
      });
    // Runs once per incoming `t` param; nav() above strips it so this settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.search]);
  return null;
}

function VisitorLang() {
  const { user } = useAuth();
  if (hasRole(user, "staff")) return null;
  return (
    <div className="fixed right-6 top-6 z-20">
      <LangPicker />
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <TitleSync />
      <AuthProvider>
        <CartProvider>
        <BrowserRouter>
          <Redirector />
          <ForceReset />
          <StaffNav />
          <VisitorLang />
          <TableCapture />
          <Routes>
            <Route path="/"          element={<NotOwner><MenuPage /></NotOwner>} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="/mfa-setup" element={<RoleGate min="staff"><MfaSetupPage /></RoleGate>} />
            <Route path="/change-password" element={<RoleGate min="visitor"><ChangePasswordPage /></RoleGate>} />
            <Route path="/upload"    element={<RoleGate min="staff"><UploadPage /></RoleGate>} />
            <Route path="/inventory" element={<RoleGate min="staff"><InventoryPage /></RoleGate>} />
            <Route path="/orders"    element={<RoleGate min="staff"><OrdersQueuePage /></RoleGate>} />
            <Route path="/menu/edit" element={<RoleGate min="owner"><MenuAdminPage /></RoleGate>} />
            <Route path="/tables"    element={<RoleGate min="owner"><TablesPage /></RoleGate>} />
            <Route path="/users"     element={<RoleGate min="owner"><UsersPage /></RoleGate>} />
            <Route path="/analytics" element={<RoleGate min="owner"><AnalyticsPage /></RoleGate>} />
            <Route path="/cart"        element={<CartPage />} />
            <Route path="/orders/mine" element={<NotOwner><MyOrdersPage /></NotOwner>} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}

