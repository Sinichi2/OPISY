-- Users + sessions + MFA + password reset ----------------------------

CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY,
    username            TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash       TEXT NOT NULL,
    role                TEXT NOT NULL CHECK (role IN
                            ('super_admin', 'owner', 'staff', 'visitor')),
    mfa_secret          TEXT,
    mfa_enrolled_at     TEXT,
    must_reset_password INTEGER NOT NULL DEFAULT 0,
    lang                TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en','ilo','tl')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL,
    remember_me INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Login attempts for rate limiting -----------------------------------

CREATE TABLE IF NOT EXISTS login_attempts (
    username     TEXT NOT NULL,
    attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
    success      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(username, attempted_at);

-- Products image + low-stock threshold -------------------------------

ALTER TABLE products ADD COLUMN image_path TEXT;
ALTER TABLE products ADD COLUMN low_stock_threshold REAL NOT NULL DEFAULT 0;

-- Menu + recipe ------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT,
    category    TEXT,
    price       REAL NOT NULL,
    image_path  TEXT,
    available   INTEGER NOT NULL DEFAULT 1,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    product_id   INTEGER NOT NULL REFERENCES products(id)   ON DELETE RESTRICT,
    quantity     REAL NOT NULL,
    PRIMARY KEY (menu_item_id, product_id)
);

-- Orders + queue -----------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    table_number  TEXT,
    notes         TEXT,
    status        TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','preparing','ready','served','cancelled')),
    placed_by     INTEGER REFERENCES users(id),
    assigned_to   INTEGER REFERENCES users(id),
    claimed_at    TEXT,
    ready_at      TEXT,
    priority      INTEGER NOT NULL DEFAULT 0,
    order_token   TEXT NOT NULL UNIQUE,
    placed_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Queue index matches ORDER BY priority DESC, placed_at ASC so SQLite
-- serves the queue in-order without a sort.
CREATE INDEX IF NOT EXISTS idx_orders_queue ON orders(status, priority DESC, placed_at ASC);

CREATE TABLE IF NOT EXISTS order_lines (
    id           INTEGER PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   REAL NOT NULL
);

-- Waste reason codes -------------------------------------------------

CREATE TABLE IF NOT EXISTS waste_reasons (
    code  TEXT PRIMARY KEY,
    label TEXT NOT NULL
);
INSERT OR IGNORE INTO waste_reasons (code, label) VALUES
    ('dropped', 'Dropped'),
    ('expired', 'Expired'),
    ('over_prepped', 'Over-prepped');

ALTER TABLE stock_movements ADD COLUMN reason_code TEXT REFERENCES waste_reasons(code);

-- current_stock view: rebuilt to include new columns + is_low flag ---

DROP VIEW IF EXISTS current_stock;
CREATE VIEW current_stock AS
SELECT p.id, p.name, p.category, p.unit, p.location, p.supplier, p.unit_price,
       p.image_path, p.low_stock_threshold,
       COALESCE(SUM(m.delta), 0) AS quantity,
       (COALESCE(SUM(m.delta), 0) <= p.low_stock_threshold) AS is_low,
       MAX(m.moved_at)           AS last_moved_at
FROM products p
LEFT JOIN stock_movements m ON m.product_id = p.id
GROUP BY p.id;

CREATE VIEW IF NOT EXISTS waste_summary AS
SELECT date(moved_at) AS day, reason_code, SUM(-delta) AS quantity_wasted
FROM stock_movements
WHERE reason = 'waste'
GROUP BY day, reason_code;
