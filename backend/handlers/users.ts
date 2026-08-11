import { randomBytes } from "node:crypto";
import { getDb } from "../db";
import { guard, hashPassword, jsonError, ROLE_LEVEL, type Role } from "../auth";

const ALL_ROLES: Role[] = ["visitor", "staff", "owner", "super_admin"];

// Owner+ can view + manage all lower/equal roles except super_admin, which only
// super_admin can create/delete. This keeps the "owner is a super_admin per se"
// principle from readme.md while preventing an owner from silently taking over.
export const listUsers = guard("owner", async (_req, user) => {
  const rows = getDb().query(`
    SELECT u.id, u.username, u.role, u.mfa_enrolled_at IS NOT NULL AS mfa_enrolled,
           u.must_reset_password, u.created_at,
           c.username AS created_by
    FROM users u LEFT JOIN users c ON c.id = u.created_by
    ORDER BY u.created_at DESC
  `).all();
  // Owner cannot see super_admin unless they are one.
  const visible = user!.role === "super_admin"
    ? rows
    : rows.filter((r: any) => r.role !== "super_admin" || r.id === user!.id);
  return Response.json(visible);
});

export const createUser = guard("owner", async (req, user) => {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string; password?: string; role?: Role;
  };
  const username = (body.username ?? "").trim();
  const role = body.role;
  const password = body.password ?? randomBytes(9).toString("base64url");
  if (!username || !role) return jsonError(400, "missing_fields");
  if (!ALL_ROLES.includes(role)) return jsonError(400, "invalid_role");
  if (ROLE_LEVEL[role] > ROLE_LEVEL[user!.role]) return jsonError(403, "cannot_create_higher_role");
  const db = getDb();
  const exists = db.query("SELECT 1 FROM users WHERE username = ? COLLATE NOCASE").get(username);
  if (exists) return jsonError(409, "username_taken");
  const hash = await hashPassword(password);
  const row = db.query(`
    INSERT INTO users (username, password_hash, role, created_by, must_reset_password)
    VALUES (?, ?, ?, ?, ?) RETURNING id
  `).get(username, hash, role, user!.id, body.password ? 0 : 1) as { id: number };
  // Return the password ONCE if it was auto-generated so the owner can hand it off.
  return Response.json({
    id: row.id, username, role,
    temp_password: body.password ? null : password,
  }, { status: 201 });
});

export const deleteUser = guard("owner", async (req, user) => {
  const id = Number(new URL(req.url).pathname.split("/").at(-1));
  if (!id) return jsonError(400, "invalid_id");
  if (id === user!.id) return jsonError(400, "cannot_delete_self");
  const db = getDb();
  const target = db.query("SELECT role FROM users WHERE id = ?").get(id) as { role: Role } | null;
  if (!target) return jsonError(404, "user_not_found");
  if (ROLE_LEVEL[target.role] >= ROLE_LEVEL[user!.role]) return jsonError(403, "cannot_delete_higher_role");
  db.query("DELETE FROM users WHERE id = ?").run(id);
  return new Response(null, { status: 204 });
});

export const resetPassword = guard("owner", async (req, user) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts.at(-2));
  if (!id) return jsonError(400, "invalid_id");
  const db = getDb();
  const target = db.query("SELECT role FROM users WHERE id = ?").get(id) as { role: Role } | null;
  if (!target) return jsonError(404, "user_not_found");
  if (ROLE_LEVEL[target.role] > ROLE_LEVEL[user!.role]) return jsonError(403, "forbidden");
  const temp = randomBytes(9).toString("base64url");
  const hash = await hashPassword(temp);
  db.query("UPDATE users SET password_hash = ?, must_reset_password = 1 WHERE id = ?")
    .run(hash, id);
  // Wipe the target's sessions so the old creds die immediately.
  db.query("DELETE FROM sessions WHERE user_id = ?").run(id);
  return Response.json({ temp_password: temp });
});
