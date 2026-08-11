import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { guard, jsonError } from "../auth";

const BACKEND_DIR = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(BACKEND_DIR, "..", "uploads");

const KIND_SUBDIRS = { product: "products", menu: "menu" } as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

for (const sub of Object.values(KIND_SUBDIRS)) {
  const dir = join(UPLOADS_DIR, sub);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export const uploadImage = guard("staff", async (req) => {
  const kind = new URL(req.url).searchParams.get("kind") as keyof typeof KIND_SUBDIRS | null;
  if (!kind || !(kind in KIND_SUBDIRS)) return jsonError(400, "invalid_kind");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "no_file");
  const ext = MIME_TO_EXT[file.type];
  if (!ext) return jsonError(400, "image_type_not_supported");
  if (file.size > MAX_BYTES) return jsonError(400, "image_too_large");

  const filename = `${randomUUID()}.${ext}`;
  const rel = `uploads/${KIND_SUBDIRS[kind]}/${filename}`;
  const abs = join(UPLOADS_DIR, KIND_SUBDIRS[kind], filename);
  await Bun.write(abs, file);
  return Response.json({ path: rel });
});

/**
 * Static serve for uploaded images. Public read; hides the physical filesystem
 * path via the strict URL prefix + basename allow-list (letters/digits/-._).
 */
export async function serveUpload(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rel = url.pathname.replace(/^\/uploads\//, "");
  if (!/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(rel)) return new Response(null, { status: 404 });
  const abs = join(UPLOADS_DIR, rel);
  if (!abs.startsWith(UPLOADS_DIR)) return new Response(null, { status: 404 });
  const f = Bun.file(abs);
  if (!(await f.exists())) return new Response(null, { status: 404 });
  return new Response(f);
}
