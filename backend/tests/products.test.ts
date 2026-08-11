import { expect, test } from "bun:test";
import { freshDb, seedUser, reqAs, jsonReq } from "./helpers";
import { listProducts, createProduct, updateProduct, deleteProduct, createMovement } from "../handlers/products";

test("products CRUD", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  await seedUser(db, "boss", "bosspass1", "owner");

  const cReq = reqAs(1, db, "http://x/api/products", jsonReq("http://x", "POST",
    { name: "Rice", category: "Grain", unit: "kg", unit_price: 55, low_stock_threshold: 5 }));
  const c = await createProduct(cReq);
  expect(c.status).toBe(201);

  const list = await listProducts(reqAs(1, db, "http://x/api/products"));
  const body = await list.json();
  expect(body[0].name).toBe("Rice");
  expect(body[0].quantity).toBe(0);
  expect(body[0].low_stock_threshold).toBe(5);
});

test("products: duplicate name → 409", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "Salt" })));
  const dup = await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "salt" }))); // NOCASE collation
  expect(dup.status).toBe(409);
});

test("products: visitor role blocked from write", async () => {
  const db = await freshDb();
  await seedUser(db, "guest", "guestpass1", "visitor");
  const res = await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "X" })));
  expect(res.status).toBe(403);
});

test("stock movement: is_low flips when quantity drops below threshold", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "Oil", low_stock_threshold: 3 })));
  await createMovement(reqAs(1, db, "http://x/api/stock/movements",
    jsonReq("http://x", "POST", { product_id: 1, delta: 10, reason: "opening" })));
  await createMovement(reqAs(1, db, "http://x/api/stock/movements",
    jsonReq("http://x", "POST", { product_id: 1, delta: -8, reason: "usage" })));
  const list = await listProducts(reqAs(1, db, "http://x/api/products"));
  const [p] = await list.json();
  expect(p.quantity).toBe(2);
  expect(!!p.is_low).toBe(true);
});

test("waste movement: reason_code required", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "Flour" })));
  const bad = await createMovement(reqAs(1, db, "http://x/api/stock/movements",
    jsonReq("http://x", "POST", { product_id: 1, delta: -1, reason: "waste" })));
  expect(bad.status).toBe(400);

  const good = await createMovement(reqAs(1, db, "http://x/api/stock/movements",
    jsonReq("http://x", "POST", {
      product_id: 1, delta: -1, reason: "waste", reason_code: "expired",
    })));
  expect(good.status).toBe(201);
});

test("delete product cascades movements", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "Gone" })));
  await createMovement(reqAs(1, db, "http://x/api/stock/movements",
    jsonReq("http://x", "POST", { product_id: 1, delta: 1, reason: "opening" })));
  const res = await deleteProduct(reqAs(1, db, "http://x/api/products/1", { method: "DELETE" }));
  expect(res.status).toBe(204);
  const remaining = db.query("SELECT COUNT(*) AS n FROM stock_movements").get() as { n: number };
  expect(remaining.n).toBe(0);
});

test("update product: unknown field ignored", async () => {
  const db = await freshDb();
  await seedUser(db, "cook", "cookpass1", "staff");
  await createProduct(reqAs(1, db, "http://x/api/products",
    jsonReq("http://x", "POST", { name: "Sugar", category: "Grain" })));
  const res = await updateProduct(reqAs(1, db, "http://x/api/products/1",
    jsonReq("http://x", "PATCH", { category: "Sweet" })));
  expect(res.status).toBe(204);
  const list = await listProducts(reqAs(1, db, "http://x/api/products"));
  const [p] = await list.json();
  expect(p.category).toBe("Sweet");
  expect(p.name).toBe("Sugar"); // untouched
});
