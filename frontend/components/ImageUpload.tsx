import { useRef, useState } from "react";
import { api, ApiError } from "../api";
import { resizeToJpeg } from "../image";
import { IconImage } from "./Icon";

interface Props {
  kind: "product" | "menu";
  value: string | null;
  onChange: (path: string | null) => void;
  className?: string;
}

export function ImageUpload({ kind, value, onChange, className = "" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const blob = await resizeToJpeg(file);
      const form = new FormData();
      form.append("file", blob, "image.jpg");
      const res = await api<{ path: string }>(`/api/images?kind=${kind}`, {
        method: "POST", body: form,
      });
      onChange(res.path);
    } catch (e) {
      setError(e instanceof ApiError ? e.key : "upload_failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {value ? (
        <img src={`/${value}`} alt="" className="h-32 w-32 border border-hair object-cover" />
      ) : (
        <div className="flex h-32 w-32 flex-col items-center justify-center gap-2 border border-dashed border-hair-strong text-muted">
          <IconImage size={20} />
          <span className="text-xs">No image</span>
        </div>
      )}
      <input
        ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-ghost">
          {busy ? "…" : value ? "Change" : "Upload"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="btn-quiet">
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
