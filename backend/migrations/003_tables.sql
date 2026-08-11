-- Tables + locations, for QR-code ordering -----------------------------
-- A location is a physical area (Snack Bar, Restaurant, Poolside...). A
-- table belongs to one location and gets a QR code that deep-links back
-- to it, so a scan can identify both the table and where it sits.

CREATE TABLE IF NOT EXISTS locations (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tables (
    id          INTEGER PRIMARY KEY,
    label       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Snapshot text (table_number) already exists on orders for manual entry;
-- table_id links it to a real table when the order came from a QR scan.
ALTER TABLE orders ADD COLUMN table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL;
