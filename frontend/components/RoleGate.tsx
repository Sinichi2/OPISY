import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasRole, useAuth, type Role } from "../auth";
import { useLang } from "../lang";

interface Props { min: Role; children: ReactNode }

/**
 * Cosmetic gate; the SERVER enforces role checks on every API call. This just
 * spares the user a broken page when they follow a link they cannot use.
 */
export function RoleGate({ min, children }: Props) {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center text-mid">{t("loading")}</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!hasRole(user, min)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
