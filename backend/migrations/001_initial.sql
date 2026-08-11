-- Panziann Inventory: initial schema.
-- Applied once; idempotent within itself via IF NOT EXISTS but the migration
-- runner also tracks version so this only executes once per DB.

CREATE TABLE IF NOT EXISTS products (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    category   TEXT,
    unit       TEXT,
    location   TEXT,
    supplier   TEXT,
    unit_price REAL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    delta      REAL NOT NULL,
    reason     TEXT NOT NULL CHECK (reason IN
                   ('opening', 'delivery', 'usage', 'waste', 'correction')),
    note       TEXT,
    moved_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);

CREATE VIEW IF NOT EXISTS current_stock AS
SELECT p.id, p.name, p.category, p.unit, p.location, p.supplier, p.unit_price,
       COALESCE(SUM(m.delta), 0) AS quantity,
       MAX(m.moved_at)           AS last_moved_at
FROM products p
LEFT JOIN stock_movements m ON m.product_id = p.id
GROUP BY p.id;
