import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL as qrDataUrl } from "qrcode";
import { getDb } from "../db";
import {
  createSession, deleteSession, readCookie, sessionCookie, clearedCookie,
  currentUser, guard, hashPassword, verifyPassword, jsonError,
  loginRateLimit, recordLoginAttempt,
} from "../auth";

// epochTolerance=1 means we accept the code from the prior/next 30s window --
// gentle Pi/phone clock drift. Any larger widens the attack window.
function verifyTotp(token: string, secret: string): boolean {
  return verifySync({ token, secret, epochTolerance: 1 }).valid;
}

interface LoginBody {
  username?: string;
  password?: string;
  remember_me?: boolean;
  totp?: string; // consumed in Phase 6
}

export async function login(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as LoginBody;
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) return jsonError(400, "missing_credentials");

  const db = getDb();
  const wait = loginRateLimit(db, username);
  if (wait > 0) {
    return new Response(JSON.stringify({ error: "rate_limited", retry_after: wait }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(wait) },
    });
  }

  const row = db.query(
    "SELECT id, password_hash, role, mfa_secret, must_reset_password FROM users WHERE username = ? COLLATE NOCASE",
  ).get(username) as {
    id: number; password_hash: string; role: string; mfa_secret: string | null; must_reset_password: number;
  } | null;

  const ok = row ? await verifyPassword(password, row.password_hash) : false;
  recordLoginAttempt(db, username, ok);
  if (!ok || !row) return jsonError(401, "invalid_credentials");

  if (row.mfa_secret) {
    if (!body.totp) return Response.json({ mfa_required: true });
    if (!verifyTotp(body.totp, row.mfa_secret)) return jsonError(401, "invalid_totp");
  }

  const sess = createSession(db, row.id, !!body.remember_me);
  return new Response(
    JSON.stringify({
      user: {
        id: row.id, username, role: row.role,
        must_reset_password: !!row.must_reset_password,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookie(sess.id, sess.maxAgeSec),
      },
    },
  );
}

export function logout(req: Request): Response {
  const sid = readCookie(req, "sid");
  if (sid) deleteSession(getDb(), sid);
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearedCookie() } });
}

export function me(req: Request): Response {
  const user = currentUser(req);
  if (!user) return jsonError(401, "unauthenticated");
  return Response.json({
    id: user.id, username: user.username, role: user.role,
    mfa_enrolled: !!user.mfa_enrolled_at, must_reset_password: !!user.must_reset_password,
    lang: user.lang,
  });
}

export const mfaEnroll = guard("staff", async (_req, user) => {
  const secret = generateSecret();
  const otpauth = generateURI({ issuer: "Panziann", label: user!.username, secret });
  const qr = await qrDataUrl(otpauth);
  // Store secret immediately so a page refresh doesn't lose it. It is only
  // treated as "enrolled" after the confirm step sets mfa_enrolled_at.
  getDb().query("UPDATE users SET mfa_secret = ?, mfa_enrolled_at = NULL WHERE id = ?")
    .run(secret, user!.id);
  return Response.json({ secret, otpauth_url: otpauth, qr_data_url: qr });
});

export const mfaConfirm = guard("staff", async (req, user) => {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code) return jsonError(400, "missing_totp");
  const db = getDb();
  const row = db.query("SELECT mfa_secret FROM users WHERE id = ?")
    .get(user!.id) as { mfa_secret: string | null };
  if (!row.mfa_secret) return jsonError(400, "mfa_not_started");
  if (!verifyTotp(code, row.mfa_secret)) return jsonError(401, "invalid_totp");
  db.query("UPDATE users SET mfa_enrolled_at = datetime('now') WHERE id = ?").run(user!.id);
  return new Response(null, { status: 204 });
});

export const changePassword = guard("visitor", async (req, user) => {
  const body = (await req.json().catch(() => ({}))) as { current_password?: string; new_password?: string };
  if (!body.new_password || body.new_password.length < 8) return jsonError(400, "password_too_short");
  const db = getDb();
  const row = db.query("SELECT password_hash, must_reset_password FROM users WHERE id = ?")
    .get(user!.id) as { password_hash: string; must_reset_password: number };
  // Skip current-password check when the account is in forced-reset mode.
  if (!row.must_reset_password) {
    if (!body.current_password) return jsonError(400, "missing_current_password");
    const ok = await verifyPassword(body.current_password, row.password_hash);
    if (!ok) return jsonError(401, "invalid_credentials");
  }
  const hash = await hashPassword(body.new_password);
  db.query("UPDATE users SET password_hash = ?, must_reset_password = 0 WHERE id = ?")
    .run(hash, user!.id);
  return new Response(null, { status: 204 });
});
