import { connect, _setDbForTests } from "../db";
import { hashPassword } from "../auth";

/** Fresh in-memory DB + injects it as the process-wide singleton. */
export async function freshDb() {
  const db = connect(":memory:");
  _setDbForTests(db);
  return db;
}

export async function seedUser(db: any, username: string, password: string, role: string) {
  const hash = await hashPassword(password);
  db.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)")
    .run(username, hash, role);
}

/** Build a Request with a session cookie for a given user id. */
export function reqAs(userId: number, db: any, url: string, init: RequestInit = {}): Request {
  const sid = "test-session-" + userId;
  db.query("INSERT OR REPLACE INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+1 day'))")
    .run(sid, userId);
  const headers = new Headers(init.headers);
  headers.set("cookie", `sid=${sid}`);
  return new Request(url, { ...init, headers });
}

export function jsonReq(url: string, method: string, body: unknown): RequestInit {
  return {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}
