"""
    Load step: write transformed products into SQLite.

    The quantity in the spreadsheet is the opening balance, stored as a movement.
    Re-uploading a corrected workbook replaces that opening row instead of adding
    to it, so deliveries and usage recorded since the last upload survive.
"""
UPSERT = """
INSERT INTO products (name, category, unit, unit_price)
VALUES (:name, :category, :unit, :unit_price)
ON CONFLICT(name) DO UPDATE SET
    category   = COALESCE(excluded.category, category),
    unit       = COALESCE(excluded.unit, unit),
    unit_price = COALESCE(excluded.unit_price, unit_price),
    updated_at = datetime('now')
"""


def load(conn, products):
    """Upserts products and their opening stock. Returns (inserted, updated)."""
    before = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    conn.executemany(UPSERT, products)
    after = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]

    # ponytail: reads every product id to map names back to ids. One query at
    # restaurant scale; add a WHERE name IN (...) if the table ever gets huge.
    ids = {name.lower(): product_id
           for product_id, name in conn.execute("SELECT id, name FROM products")}
    opening = {ids[p["name"].lower()]: p["quantity"]
               for p in products if p["quantity"] is not None}  # same name twice -> last wins

    conn.executemany("DELETE FROM stock_movements WHERE product_id = ? AND reason = 'opening'",
                     [(product_id,) for product_id in opening])
    conn.executemany("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, ?, 'opening')",
                     list(opening.items()))
    conn.commit()

    inserted = after - before
    return inserted, len(products) - inserted
