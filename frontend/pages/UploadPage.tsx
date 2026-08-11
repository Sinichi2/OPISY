import { useRef, useState } from "react";
import { useLang } from "../lang";
import { api, ApiError } from "../api";

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
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="font-heading text-3xl text-brown">{t("upload_heading")}</h1>
        <p className="mt-2 text-mid">{t("upload_sub")}</p>
      </div>
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
        className="rounded-card bg-green-700 px-10 py-6 text-2xl font-bold text-white shadow-lg hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? t("loading") : t("choose_file")}
      </button>
      {result && (
        <p className={`whitespace-pre-line text-lg font-medium ${result.ok ? "text-green-700" : "text-danger"}`}>
          {result.ok
            ? `${t("upload_done")}\n${result.inserted} ${t("new_products")}\n${result.updated} ${t("updated")}\n${result.skipped} ${t("skipped")}`
            : `${t("upload_failed")}\n${t(result.key)}`}
        </p>
      )}
    </main>
  );
}
