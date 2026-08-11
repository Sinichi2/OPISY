import { expect, test } from "bun:test";
import { freshDb, seedUser, jsonReq } from "./helpers";
import { login } from "../handlers/auth";

async function runLogin(body: unknown): Promise<Response> {
  return login(new Request("http://x/api/auth/login", jsonReq("http://x", "POST", body)));
}

test("login: happy path returns cookie", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");

  const res = await runLogin({ username: "cook", password: "cookpass1" });
  expect(res.status).toBe(200);
  expect(res.headers.get("set-cookie")).toContain("sid=");

  const body = await res.json();
  expect(body.user.username).toBe("cook");
  expect(body.user.role).toBe("staff");
});

test("login: wrong password → 401", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  const res = await runLogin({ username: "cook", password: "nope" });
  expect(res.status).toBe(401);
});

test("login: rate limit trips at 6th bad attempt", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  for (let i = 0; i < 5; i++) {
    const r = await runLogin({ username: "cook", password: "nope" });
    expect(r.status).toBe(401);
  }
  const sixth = await runLogin({ username: "cook", password: "nope" });
  expect(sixth.status).toBe(429);
  expect(sixth.headers.get("retry-after")).toBeTruthy();
});
