import { expect, test } from "bun:test";
import { freshDb, seedUser, reqAs, jsonReq } from "./helpers";
import { placeOrder, claimNext, listOrders, updateStatus, setPriority } from "../handlers/orders";

async function seedMenuWithRecipe(db: any) {
  db.query("INSERT INTO products (name, unit) VALUES ('Chicken', 'kg')").run();
  db.query("INSERT INTO stock_movements (product_id, delta, reason) VALUES (1, 10, 'opening')").run();
  db.query("INSERT INTO menu_items (name, price, available) VALUES ('Adobo', 250, 1)").run();
  db.query("INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity) VALUES (1, 1, 0.5)").run();
}

test("place order decrements stock via recipe", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);

  const res = await placeOrder(new Request("http://x/api/orders",
    jsonReq("http://x", "POST", {
      customer_name: "Erika",
      lines: [{ menu_item_id: 1, quantity: 2 }],
    })));
  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.id).toBeGreaterThan(0);
  expect(typeof body.order_token).toBe("string");
  expect(body.queue_position).toBe(1);

  const stock = db.query("SELECT quantity FROM current_stock WHERE name = 'Chicken'").get() as { quantity: number };
  expect(stock.quantity).toBe(9); // 10 - 2*0.5
});

test("place order rejects unavailable item", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  db.query("UPDATE menu_items SET available = 0 WHERE id = 1").run();

  const res = await placeOrder(new Request("http://x/api/orders",
    jsonReq("http://x", "POST", {
      customer_name: "Erika",
      lines: [{ menu_item_id: 1, quantity: 1 }],
    })));
  expect(res.status).toBe(400);
});

test("queue FIFO: earlier order claimed first", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  await seedUser(db, "cook", "cookpass1", "staff");

  await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
    { customer_name: "A", lines: [{ menu_item_id: 1, quantity: 1 }] })));
  await new Promise((r) => setTimeout(r, 1100)); // SQLite datetime is 1s resolution
  await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
    { customer_name: "B", lines: [{ menu_item_id: 1, quantity: 1 }] })));

  const claim = await claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" }));
  const c1 = await claim.json();
  expect(c1.id).toBe(1); // A first

  const claim2 = await claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" }));
  const c2 = await claim2.json();
  expect(c2.id).toBe(2); // then B
});

test("priority bump reorders queue", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  await seedUser(db, "owner", "ownerpass", "owner");

  // Three pending orders A, B, C.
  for (const n of ["A", "B", "C"]) {
    await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
      { customer_name: n, lines: [{ menu_item_id: 1, quantity: 1 }] })));
    await new Promise((r) => setTimeout(r, 1100));
  }

  // Bump C to priority 5.
  const bump = await setPriority(reqAs(1, db,
    "http://x/api/orders/3/priority",
    jsonReq("http://x", "POST", { priority: 5 })));
  expect(bump.status).toBe(204);

  const claim = await claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" }));
  const c = await claim.json();
  expect(c.id).toBe(3); // bumped one goes first
});

test("atomic claim: single order → single winner", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  await seedUser(db, "cook", "cookpass1", "staff");
  await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
    { customer_name: "Solo", lines: [{ menu_item_id: 1, quantity: 1 }] })));

  const [a, b] = await Promise.all([
    claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" })),
    claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" })),
  ]);
  const [aj, bj] = await Promise.all([a.json(), b.json()]);
  const claimed = [aj, bj].filter((x) => !x.empty);
  const empty   = [aj, bj].filter((x) => x.empty);
  expect(claimed.length).toBe(1);
  expect(empty.length).toBe(1);
});

test("status transitions: preparing → ready sets ready_at", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  await seedUser(db, "cook", "cookpass1", "staff");
  await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
    { customer_name: "X", lines: [{ menu_item_id: 1, quantity: 1 }] })));
  await claimNext(reqAs(1, db, "http://x/api/orders/claim-next", { method: "POST" }));

  const r = await updateStatus(reqAs(1, db,
    "http://x/api/orders/1/status",
    jsonReq("http://x", "PATCH", { status: "ready" })));
  expect(r.status).toBe(204);

  const row = db.query("SELECT status, ready_at FROM orders WHERE id = 1").get() as any;
  expect(row.status).toBe("ready");
  expect(row.ready_at).toBeTruthy();
});

test("kitchen list includes queue_position", async () => {
  const db = await freshDb();
  await seedMenuWithRecipe(db);
  await seedUser(db, "cook", "cookpass1", "staff");
  await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST",
    { customer_name: "Q", lines: [{ menu_item_id: 1, quantity: 1 }] })));

  const res = await listOrders(reqAs(1, db, "http://x/api/orders"));
  const body = await res.json();
  expect(body[0].status).toBe("pending");
  expect(body[0].queue_position).toBe(1);
});
