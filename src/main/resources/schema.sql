-- Panziann Inventory: the whole database.
-- Applied on every connection. IF NOT EXISTS makes it a no-op after the first run.

-- What a thing is. Name is the identity, so the spreadsheet can be re-uploaded
-- without creating duplicates.
CREATE TABLE IF NOT EXISTS products (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    category   TEXT,
    unit       TEXT,                   -- kilo, piraso, bote...
    location   TEXT,
    supplier   TEXT,
    unit_price REAL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every change in stock, append only. How much is on hand is never stored, it is
-- the sum of this table -- so the number can always be explained by the rows.
CREATE TABLE IF NOT EXISTS stock_movements (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    delta      REAL NOT NULL,          -- positive = pumasok, negative = lumabas
    reason     TEXT NOT NULL CHECK (reason IN
                   ('opening', 'delivery', 'usage', 'waste', 'correction')),
    note       TEXT,
    moved_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);

-- What the staff actually looks at.
CREATE VIEW IF NOT EXISTS current_stock AS
SELECT p.id, p.name, p.category, p.unit, p.location, p.supplier, p.unit_price,
       COALESCE(SUM(m.delta), 0) AS quantity,
       MAX(m.moved_at)           AS last_moved_at
FROM products p
LEFT JOIN stock_movements m ON m.product_id = p.id
GROUP BY p.id;
