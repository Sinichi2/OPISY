import { useRef, useState } from "react";
import { useLang } from "../lang";
import { api, ApiError } from "../api";
import { IconUpload, IconCheck } from "../components/Icon";

type Result =
  | { ok: true; inserted: number; updated: number; skipped: number }
  | { ok: false; key: string };

export function UploadPage() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setResult(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const data = await api<{ inserted: number; updated: number; skipped: number }>(
        "/api/upload", { method: "POST", body },
      );
      setResult({ ok: true, ...data });
    } catch (err) {
      const key = err instanceof ApiError ? err.key : "upload_failed";
      setResult({ ok: false, key });
    } finally {
      setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <header className="mb-10">
        <h1 className="font-heading text-4xl text-brown-deep">{t("upload_heading")}</h1>
        <p className="mt-4 text-mid">{t("upload_sub")}</p>
      </header>

      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xlsm"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />

      <button
        onClick={() => fileInput.current?.click()}
        disabled={loading}
        className="group flex w-full flex-col items-center justify-center gap-4 border border-dashed border-hair-strong bg-paper px-8 py-14 text-center transition-colors hover:border-brown-deep disabled:opacity-50"
      >
        <IconUpload size={28} className="text-brown transition-colors group-hover:text-brown-deep" />
        <span className="font-heading text-2xl text-brown-deep">
          {loading ? t("loading") : t("choose_file")}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          .xlsx · .xlsm
        </span>
      </button>

      {result?.ok && (
        <div className="mt-8 border-t border-b border-hair py-6">
          <div className="mb-4 flex items-center gap-2 text-ok-fg">
            <IconCheck size={16} />
            <span className="text-sm">{t("upload_done")}</span>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            <Stat n={result.inserted} label={t("new_products")} />
            <Stat n={result.updated}  label={t("updated")} />
            <Stat n={result.skipped}  label={t("skipped")} />
          </dl>
        </div>
      )}

      {result && !result.ok && (
        <p className="mt-8 border-t border-b border-hair py-6 text-sm text-danger">
          {t("upload_failed")} — {t(result.key)}
        </p>
      )}
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-2xl text-brown-deep">{n}</dd>
    </div>
  );
}
