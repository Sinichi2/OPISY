import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson, ApiError } from "../api";
import { useAuth } from "../auth";
import { useLang } from "../lang";
import { IconArrow, IconWarn } from "../components/Icon";

export function ChangePasswordPage() {
  const { t } = useLang();
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const forced = !!user?.must_reset_password;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError("password_too_short");
    if (next !== confirm) return setError("passwords_do_not_match");
    setBusy(true);
    try {
      await apiJson("/api/auth/change-password", {
        current_password: forced ? undefined : current,
        new_password: next,
      });
      await refresh();
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rise">
        <h1 className="mb-10 font-heading text-4xl text-brown-deep">
          {forced ? "Set a new password" : "Change password"}
        </h1>

        {forced && (
          <div className="mb-8 flex items-start gap-3 border-t border-b border-hair py-4 text-sm text-warn-fg">
            <IconWarn size={16} className="mt-0.5 shrink-0" />
            <span>Your account was reset by an owner. Choose a new password to continue.</span>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-7">
          {!forced && (
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Current password</span>
              <input
                required type="password" autoComplete="current-password"
                value={current} onChange={(e) => setCurrent(e.target.value)}
                className="field"
              />
            </label>
          )}
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">New password</span>
            <input
              required type="password" autoComplete="new-password" minLength={8}
              value={next} onChange={(e) => setNext(e.target.value)}
              className="field"
            />
            <span className="text-xs text-muted">Minimum 8 characters.</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">Confirm new password</span>
            <input
              required type="password" autoComplete="new-password" minLength={8}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="field"
            />
          </label>

          {error && <p className="text-sm text-danger">{t(error)}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
            {busy ? t("loading") : "Save password"}
            <IconArrow size={14} />
          </button>
        </form>
      </div>
    </main>
  );
}
