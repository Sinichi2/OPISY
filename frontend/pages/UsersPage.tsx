import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth, type Role } from "../auth";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";
import { IconCheck, IconCopy, IconPlus } from "../components/Icon";

interface Row {
  id: number;
  username: string;
  role: Role;
  mfa_enrolled: number;
  must_reset_password: number;
  created_at: string;
  created_by: string | null;
}

export function UsersPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [adding, setAdding] = useState(false);
  const [tempPw, setTempPw] = useState<{ username: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await api<Row[]>("/api/users")); }
    catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function del(r: Row) {
    if (!confirm(`${t("confirm_delete")} ${r.username}`)) return;
    try { await api(`/api/users/${r.id}`, { method: "DELETE" }); load(); }
    catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
  }
  async function reset(r: Row) {
    if (!confirm(`Reset password for ${r.username}?`)) return;
    try {
      const res = await apiJson<{ temp_password: string }>(`/api/users/${r.id}/reset-password`, {});
      setTempPw({ username: r.username, password: res.temp_password });
      load();
    } catch (e) { setError(e instanceof ApiError ? e.key : "error_generic"); }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-hair pb-6">
        <div>
          <h1 className="font-heading text-4xl text-brown-deep">{t("nav_users")}</h1>
          <p className="mt-3 text-sm text-mid">
            <span className="font-mono text-ink">{rows.length}</span> accounts with access
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <IconPlus size={14} />
          Add user
        </button>
      </header>

      {error && <p className="mb-6 text-sm text-danger">{t(error)}</p>}

      {loading ? (
        <p className="text-mid">{t("loading")}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hair-strong text-left text-xs uppercase tracking-[0.14em] text-muted">
              <th className="py-3 pr-3 font-normal">{t("username")}</th>
              <th className="py-3 pr-3 font-normal">Role</th>
              <th className="py-3 pr-3 font-normal">MFA</th>
              <th className="py-3 pr-3 font-normal">Created</th>
              <th className="py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-hair transition-colors hover:bg-ivory/40">
                <td className="py-3 pr-3 text-ink">{r.username}</td>
                <td className="py-3 pr-3">
                  <span className="text-xs uppercase tracking-[0.14em] text-mid">{r.role}</span>
                </td>
                <td className="py-3 pr-3">
                  {r.mfa_enrolled
                    ? <IconCheck size={14} className="text-ok-fg" />
                    : <span className="text-hair-strong">—</span>}
                </td>
                <td className="py-3 pr-3 font-mono text-xs text-muted">{r.created_at.slice(0, 10)}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => reset(r)} className="btn-quiet">Reset pw</button>
                    {r.id !== user?.id && (
                      <button onClick={() => del(r)} className="btn-quiet hover:!text-danger">
                        {t("delete")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && (
        <AddUserForm
          maxRole={user?.role ?? "owner"}
          onClose={() => setAdding(false)}
          onSaved={(temp) => {
            setAdding(false);
            if (temp) setTempPw(temp);
            load();
          }}
        />
      )}

      {tempPw && (
        <Modal open onClose={() => setTempPw(null)} title="Temporary password">
          <div className="flex flex-col gap-5">
            <p className="text-sm text-mid">
              Hand this to <span className="text-ink">{tempPw.username}</span>. It only shows once.
            </p>
            <div className="border border-hair bg-ivory px-6 py-8 text-center">
              <code className="font-mono text-2xl tracking-[0.1em] text-brown-deep">{tempPw.password}</code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(tempPw.password)}
              className="btn-primary self-end"
            >
              <IconCopy size={14} />
              Copy password
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function AddUserForm({
  maxRole, onClose, onSaved,
}: { maxRole: Role; onClose: () => void; onSaved: (temp: { username: string; password: string } | null) => void }) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [autoGen, setAutoGen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ROLES: Role[] = hasRole({ role: maxRole } as any, "super_admin")
    ? ["visitor", "staff", "owner", "super_admin"]
    : ["visitor", "staff", "owner"];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await apiJson<{ username: string; temp_password: string | null }>(
        "/api/users",
        { username, role, password: autoGen ? undefined : password },
      );
      onSaved(res.temp_password ? { username: res.username, password: res.temp_password } : null);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add user">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("username")}</span>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} className="field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="field">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox" checked={autoGen}
            onChange={(e) => setAutoGen(e.target.checked)}
            className="h-4 w-4 accent-brown-deep"
          />
          <span>Auto-generate password <span className="text-muted">(recommended)</span></span>
        </label>
        {!autoGen && (
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("password")}</span>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} className="field" />
          </label>
        )}
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
