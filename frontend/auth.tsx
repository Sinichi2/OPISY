import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, apiJson } from "./api";

export type Role = "visitor" | "staff" | "owner" | "super_admin";
export const ROLE_LEVEL: Record<Role, number> = {
  visitor: 0, staff: 1, owner: 2, super_admin: 3,
};

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  mfa_enrolled: boolean;
  must_reset_password: boolean;
  lang: "en" | "ilo" | "tl";
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string, opts?: { remember?: boolean; totp?: string }) => Promise<{ mfa_required?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login: AuthState["login"] = async (username, password, opts = {}) => {
    const res = await apiJson<{ user?: AuthUser; mfa_required?: boolean }>(
      "/api/auth/login",
      { username, password, remember_me: opts.remember, totp: opts.totp },
    );
    if (res.mfa_required) return { mfa_required: true };
    if (res.user) await refresh();
    return {};
  };

  const logout = async () => {
    await apiJson("/api/auth/logout", {});
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export function hasRole(user: AuthUser | null, min: Role): boolean {
  if (!user) return min === "visitor";
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL[min];
}
