export class ApiError extends Error {
  constructor(public status: number, public key: string, public extra: Record<string, unknown> = {}) {
    super(key);
  }
}

/**
 * Central fetch wrapper. Sends cookies, parses JSON, throws typed errors.
 * On 401, `handleUnauthorized` fires so the router can redirect to /login.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    const err = typeof body === "object" && body ? body : { error: String(body) };
    throw new ApiError(res.status, err.error ?? "unknown_error", err);
  }
  return body as T;
}

export const apiJson = <T = unknown>(path: string, body: unknown, method = "POST") =>
  api<T>(path, { method, body: JSON.stringify(body) });
