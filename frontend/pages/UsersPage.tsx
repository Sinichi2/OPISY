import { useEffect, useState, type FormEvent } from "react";
import { api, apiJson, ApiError } from "../api";
import { hasRole, useAuth, type Role } from "../auth";
import { useLang } from "../lang";
import { Modal } from "../components/Modal";

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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl text-brown">{t("nav_users")}</h1>
        <button onClick={() => setAdding(true)}
          className="rounded-button bg-brown px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
          + Add user
        </button>
      </div>
      {error && <p className="mb-4 text-danger">{t(error)}</p>}
      {loading ? <p>{t("loading")}</p> : (
        <div className="overflow-hidden rounded-card bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-peach">
              <tr>
                <th className="p-2">{t("username")}</th>
                <th className="p-2">Role</th>
                <th className="p-2">MFA</th>
                <th className="p-2">Created</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-brown/10">
                  <td className="p-2 font-medium">{r.username}</td>
                  <td className="p-2 text-mid">{r.role}</td>
                  <td className="p-2">{r.mfa_enrolled ? "✓" : "—"}</td>
                  <td className="p-2 text-xs text-mid">{r.created_at}</td>
                  <td className="space-x-1 p-2 text-right">
                    <button onClick={() => reset(r)} className="rounded-button bg-peach px-2 py-1 text-xs">Reset pw</button>
                    {r.id !== user?.id && (
                      <button onClick={() => del(r)} className="rounded-button bg-danger/10 px-2 py-1 text-xs text-danger">
                        {t("delete")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <div className="flex flex-col gap-3">
            <p className="text-sm text-mid">
              Hand this to <strong>{tempPw.username}</strong>. It only shows once.
            </p>
            <div className="rounded-card bg-peach p-4 text-center">
              <code className="text-xl">{tempPw.password}</code>
              <button
                onClick={() => navigator.clipboard.writeText(tempPw.password)}
                className="mt-2 block w-full rounded-button bg-brown py-2 text-sm font-semibold text-white"
              >
                Copy
              </button>
            </div>
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
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("username")}</span>
          <input required value={username} onChange={(e) => setUsername(e.target.value)}
            className="rounded-button border border-brown/30 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-button border border-brown/30 px-3 py-2">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoGen} onChange={(e) => setAutoGen(e.target.checked)} />
          <span>Auto-generate password (recommended)</span>
        </label>
        {!autoGen && (
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("password")}</span>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-button border border-brown/30 px-3 py-2" />
          </label>
        )}
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
