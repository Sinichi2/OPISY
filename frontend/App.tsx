import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, hasRole, useAuth } from "./auth";
import { LangProvider, useLang } from "./lang";
import { CartProvider } from "./cart";
import { setUnauthorizedHandler } from "./api";
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
import { CartPage } from "./pages/CartPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { OrdersQueuePage } from "./pages/OrdersQueuePage";
import { UsersPage } from "./pages/UsersPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

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
          <Routes>
            <Route path="/"          element={<MenuPage />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="/mfa-setup" element={<RoleGate min="staff"><MfaSetupPage /></RoleGate>} />
            <Route path="/change-password" element={<RoleGate min="visitor"><ChangePasswordPage /></RoleGate>} />
            <Route path="/upload"    element={<RoleGate min="staff"><UploadPage /></RoleGate>} />
            <Route path="/inventory" element={<RoleGate min="staff"><InventoryPage /></RoleGate>} />
            <Route path="/orders"    element={<RoleGate min="staff"><OrdersQueuePage /></RoleGate>} />
            <Route path="/menu/edit" element={<RoleGate min="owner"><MenuAdminPage /></RoleGate>} />
            <Route path="/users"     element={<RoleGate min="owner"><UsersPage /></RoleGate>} />
            <Route path="/analytics" element={<RoleGate min="owner"><AnalyticsPage /></RoleGate>} />
            <Route path="/cart"        element={<CartPage />} />
            <Route path="/orders/mine" element={<MyOrdersPage />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}

