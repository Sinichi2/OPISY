import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { useLang } from "../lang";
import { ApiError } from "../api";
import { IconArrow, IconLock } from "../components/Icon";

export function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [totp, setTotp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await login(username, password, { remember, totp: totp || undefined });
      if (res.mfa_required) { setMfaRequired(true); return; }
      nav(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.key);
      else setError("upload_failed");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rise">
        <h1 className="mb-10 flex items-baseline gap-4 font-heading text-4xl text-brown-deep">
          <IconLock size={20} className="translate-y-1 text-brown" />
          {t("sign_in")}
        </h1>

        <form onSubmit={submit} className="flex flex-col gap-7">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("username")}</span>
            <input
              required autoFocus autoComplete="username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="field"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("password")}</span>
            <input
              required type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </label>

          {mfaRequired && (
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">{t("totp_code")}</span>
              <input
                required inputMode="numeric" pattern="\d{6}" maxLength={6}
                value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                className="field font-mono text-xl tracking-[0.4em]"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-mid">
            <input
              type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-brown-deep"
            />
            <span>{t("remember_me")}</span>
          </label>

          {error && <p className="text-sm text-danger">{t(error)}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
            {busy ? t("loading") : t("sign_in")}
            <IconArrow size={14} />
          </button>
        </form>
      </div>
    </main>
  );
}
