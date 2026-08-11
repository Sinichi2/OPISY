import type { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";

export type Role = "visitor" | "staff" | "owner" | "super_admin";
export const ROLE_LEVEL: Record<Role, number> = {
  visitor: 0, staff: 1, owner: 2, super_admin: 3,
};

export interface User {
  id: number;
  username: string;
  role: Role;
  mfa_secret: string | null;
  mfa_enrolled_at: string | null;
  must_reset_password: number;
  lang: "en" | "ilo" | "tl";
}

const SESSION_COOKIE = "sid";
const SESSION_DAYS_NORMAL = 1;
const SESSION_DAYS_REMEMBER = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_WINDOW_MIN = 15;

// -- password hash ---------------------------------------------------

export function hashPassword(pw: string): Promise<string> {
  return Bun.password.hash(pw, { algorithm: "argon2id" });
}
export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return Bun.password.verify(pw, hash);
}

// -- sessions --------------------------------------------------------

function newSessionId(): string {
  return randomBytes(32).toString("hex");
}

function isoPlusDays(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return d.toISOString();
}

export function createSession(db: Database, userId: number, remember: boolean): { id: string; expiresAt: string; maxAgeSec: number } {
  const id = newSessionId();
  const days = remember ? SESSION_DAYS_REMEMBER : SESSION_DAYS_NORMAL;
  const expiresAt = isoPlusDays(days);
  db.query("INSERT INTO sessions (id, user_id, expires_at, remember_me) VALUES (?, ?, ?, ?)")
    .run(id, userId, expiresAt, remember ? 1 : 0);
  return { id, expiresAt, maxAgeSec: days * 86400 };
}

export function deleteSession(db: Database, sid: string): void {
  db.query("DELETE FROM sessions WHERE id = ?").run(sid);
}

// -- cookie helpers --------------------------------------------------

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export function sessionCookie(id: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}${secure}`;
}
export function clearedCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

// -- current user + role guard --------------------------------------

export function currentUser(req: Request): User | null {
  const sid = readCookie(req, SESSION_COOKIE);
  if (!sid) return null;
  const db = getDb();
  const row = db.query(`
    SELECT u.id, u.username, u.role, u.mfa_secret, u.mfa_enrolled_at,
           u.must_reset_password, u.lang, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).get(sid) as (User & { expires_at: string }) | null;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(db, sid);
    return null;
  }
  const { expires_at: _e, ...user } = row;
  return user;
}

/**
 * Route wrapper: gates a handler by minimum role. Server-side check --
 * frontend RoleGate is only cosmetic; this is the security boundary.
 * `public` skips the check but still injects the user if present.
 */
export function guard(
  minRole: Role | "public",
  handler: (req: Request, user: User | null) => Response | Promise<Response>,
): (req: Request) => Response | Promise<Response> {
  return (req) => {
    const user = currentUser(req);
    if (minRole === "public") return handler(req, user);
    if (!user) return jsonError(401, "unauthenticated");
    if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) return jsonError(403, "forbidden");
    return handler(req, user);
  };
}

export function jsonError(status: number, key: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error: key, ...extra }, { status });
}

// -- rate limiting on login ------------------------------------------

export function recordLoginAttempt(db: Database, username: string, success: boolean): void {
  db.query("INSERT INTO login_attempts (username, success) VALUES (?, ?)").run(username, success ? 1 : 0);
  db.query("DELETE FROM login_attempts WHERE attempted_at < datetime('now', ?)")
    .run(`-${RATE_WINDOW_MIN * 4} minutes`);
}

/** Returns seconds to wait if rate-limited, or 0 if OK. */
export function loginRateLimit(db: Database, username: string): number {
  const row = db.query(`
    SELECT COUNT(*) AS fails, MAX(attempted_at) AS last
    FROM login_attempts
    WHERE username = ? AND success = 0
      AND attempted_at > datetime('now', ?)
  `).get(username, `-${RATE_WINDOW_MIN} minutes`) as { fails: number; last: string | null };
  if (row.fails < MAX_LOGIN_ATTEMPTS) return 0;
  // SQLite datetime('now') returns naive UTC ("YYYY-MM-DD HH:MM:SS"); the
  // 'Z' suffix forces JS Date to parse it as UTC, not local.
  const until = new Date(row.last!.replace(" ", "T") + "Z").getTime() + RATE_WINDOW_MIN * 60_000;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

// -- bootstrap super_admin ------------------------------------------

export async function bootstrapSuperAdmin(db: Database): Promise<void> {
  const count = (db.query("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0) return;
  const username = process.env.SUPER_ADMIN_USER ?? "admin";
  const provided = process.env.SUPER_ADMIN_PASS;
  const password = provided ?? randomBytes(9).toString("base64url");
  const hash = await hashPassword(password);
  db.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'super_admin')")
    .run(username, hash);
  if (!provided) {
    console.log("========================================================");
    console.log(` bootstrap super_admin created`);
    console.log(`   username: ${username}`);
    console.log(`   password: ${password}`);
    console.log(` (set SUPER_ADMIN_PASS env var to control this)`);
    console.log("========================================================");
  }
}
