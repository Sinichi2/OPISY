import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiJson, ApiError } from "../api";
import { useAuth } from "../auth";
import { useLang } from "../lang";
import { IconArrow, IconLock } from "../components/Icon";

export function MfaSetupPage() {
  const { t } = useLang();
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [enroll, setEnroll] = useState<{ secret: string; qr_data_url: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ secret: string; qr_data_url: string; otpauth_url: string }>(
      "/api/auth/mfa/enroll", { method: "POST" },
    ).then(setEnroll).catch((e) => setError(e instanceof ApiError ? e.key : "error_generic"));
  }, []);

  async function confirm() {
    setError(null); setBusy(true);
    try {
      await apiJson("/api/auth/mfa/confirm", { code });
      await refresh();
      nav("/", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "error_generic");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-lg flex-col justify-center px-6 py-12">
      <div className="rise">
        <h1 className="mb-4 flex items-baseline gap-4 font-heading text-4xl text-brown-deep">
          <IconLock size={20} className="translate-y-1 text-brown" />
          Two-factor setup
        </h1>
        <p className="mb-10 max-w-md text-mid">
          Scan the code with Google Authenticator, Authy, or 1Password, then enter the six digits it shows.
        </p>

        {!enroll && !error && <p className="text-mid">{t("loading")}</p>}
        {error && <p className="text-sm text-danger">{t(error)}</p>}

        {enroll && (
          <div className="flex flex-col items-center gap-6 border-t border-b border-hair py-10">
            <img
              src={enroll.qr_data_url}
              alt="TOTP QR"
              className="h-56 w-56 border border-hair bg-white p-3"
            />
            <p className="max-w-xs break-all text-center font-mono text-xs text-muted">
              {enroll.secret}
            </p>

            <label className="flex w-full max-w-xs flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Verification code</span>
              <input
                inputMode="numeric" pattern="\d{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="field text-center font-mono text-2xl tracking-[0.5em]"
              />
            </label>

            <button
              onClick={confirm}
              disabled={busy || code.length !== 6}
              className="btn-primary w-full max-w-xs"
            >
              {busy ? t("loading") : "Confirm"}
              <IconArrow size={14} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
