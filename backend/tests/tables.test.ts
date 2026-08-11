import { expect, test } from "bun:test";
import { freshDb, seedUser, reqAs, jsonReq } from "./helpers";
import {
  listLocations, createLocation, deleteLocation,
  listTables, createTable, deleteTable, getTable,
} from "../handlers/tables";
import { placeOrder, listOrders } from "../handlers/orders";

test("locations + tables CRUD, owner+ only", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  await seedUser(db, "cook", "cookpass1", "staff");

  const staffTry = await createLocation(reqAs(2, db, "http://x/api/locations",
    jsonReq("http://x", "POST", { name: "Snack Bar" })));
  expect(staffTry.status).toBe(403);

  const loc = await createLocation(reqAs(1, db, "http://x/api/locations",
    jsonReq("http://x", "POST", { name: "Snack Bar" })));
  expect(loc.status).toBe(201);
  const locBody = await loc.json();

  const table = await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 5", location_id: locBody.id })));
  expect(table.status).toBe(201);

  const list = await listTables(reqAs(1, db, "http://x/api/tables"));
  const rows = await list.json();
  expect(rows[0].label).toBe("Table 5");
  expect(rows[0].location_name).toBe("Snack Bar");

  const locs = await listLocations(reqAs(1, db, "http://x/api/locations"));
  const locRows = await locs.json();
  expect(locRows.map((l: { name: string }) => l.name)).toEqual(["Snack Bar"]);
});

test("delete table: removes it, 404 on a repeat delete", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 7" })));

  const del = await deleteTable(reqAs(1, db, "http://x/api/tables/1", { method: "DELETE" }));
  expect(del.status).toBe(204);

  const list = await listTables(reqAs(1, db, "http://x/api/tables"));
  expect(await list.json()).toEqual([]);

  const again = await deleteTable(reqAs(1, db, "http://x/api/tables/1", { method: "DELETE" }));
  expect(again.status).toBe(404);
});

test("duplicate table label rejected", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 1" })));
  const dup = await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "table 1" }))); // NOCASE collation
  expect(dup.status).toBe(409);
});

test("deleting a location clears it from its tables instead of blocking", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  const loc = await createLocation(reqAs(1, db, "http://x/api/locations",
    jsonReq("http://x", "POST", { name: "Poolside" })));
  const { id: locId } = await loc.json();
  await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 9", location_id: locId })));

  const del = await deleteLocation(reqAs(1, db, `http://x/api/locations/${locId}`, { method: "DELETE" }));
  expect(del.status).toBe(204);

  const list = await listTables(reqAs(1, db, "http://x/api/tables"));
  const [row] = await list.json();
  expect(row.location_id).toBeNull();
});

test("GET /api/tables/:id is public and resolves label + location", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  const loc = await createLocation(reqAs(1, db, "http://x/api/locations",
    jsonReq("http://x", "POST", { name: "Restaurant" })));
  const { id: locId } = await loc.json();
  await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 3", location_id: locId })));

  const res = await getTable(new Request("http://x/api/tables/1"));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.label).toBe("Table 3");
  expect(body.location_name).toBe("Restaurant");

  const missing = await getTable(new Request("http://x/api/tables/999"));
  expect(missing.status).toBe(404);
});

test("placing an order with a scanned table_id links it and surfaces on the queue", async () => {
  const db = await freshDb();
  await seedUser(db, "boss", "bosspass1", "owner");
  await seedUser(db, "cook", "cookpass1", "staff");
  db.query("INSERT INTO menu_items (name, price, available) VALUES ('Halo-Halo', 185, 1)").run();
  const loc = await createLocation(reqAs(1, db, "http://x/api/locations",
    jsonReq("http://x", "POST", { name: "Snack Bar" })));
  const { id: locId } = await loc.json();
  await createTable(reqAs(1, db, "http://x/api/tables",
    jsonReq("http://x", "POST", { label: "Table 5", location_id: locId })));

  const order = await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST", {
    customer_name: "Erika", table_number: "5", table_id: 1,
    lines: [{ menu_item_id: 1, quantity: 1 }],
  })));
  expect(order.status).toBe(201);

  const queue = await listOrders(reqAs(2, db, "http://x/api/orders"));
  const [row] = await queue.json();
  expect(row.location_name).toBe("Snack Bar");
});

test("placing an order with an unknown table_id is rejected", async () => {
  const db = await freshDb();
  db.query("INSERT INTO menu_items (name, price, available) VALUES ('Halo-Halo', 185, 1)").run();
  const order = await placeOrder(new Request("http://x/api/orders", jsonReq("http://x", "POST", {
    customer_name: "Erika", table_id: 999,
    lines: [{ menu_item_id: 1, quantity: 1 }],
  })));
  expect(order.status).toBe(400);
  const body = await order.json();
  expect(body.error).toBe("table_not_found");
});
