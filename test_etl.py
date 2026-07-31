"""Run: python test_etl.py -- fails loudly if the ETL breaks."""
import sqlite3
import tempfile
from pathlib import Path

from openpyxl import Workbook

from backend.data.ETL.pipeline import import_excel

MESSY_SHEET = [
    ["PANZIANN RESTAURANT", "", "", ""],            # title row above the headers
    ["Inventory as of July 2026", "", "", ""],
    ["Item Name", "Category", "Qty", "Unit Price (PHP)"],
    ["Tomato", "Vegetable", "12", "PHP 45.50"],
    ["Olive Oil", "Condiments", "3", "1,250.00"],
    ["", "", "", ""],                               # blank row in the middle
    ["", "Vegetable", "9", "10"],                   # no name -> skipped
    ["Tomato", "Vegetable", "20", "50"],            # same product again -> update
]


def main():
    workbook = Workbook()
    for row in MESSY_SHEET:
        workbook.active.append(row)

    with tempfile.TemporaryDirectory() as tmp:
        xlsx = Path(tmp) / "stock.xlsx"
        workbook.save(xlsx)
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row

        inserted, updated, skipped = import_excel(xlsx, conn)
        assert (inserted, updated, skipped) == (2, 1, 1), (inserted, updated, skipped)

        def stock(name):
            return conn.execute("SELECT * FROM current_stock WHERE name = ?", (name,)).fetchone()

        tomato = stock("tomato")                                     # name match ignores case
        assert tomato["quantity"] == 20, tomato["quantity"]          # last row wins
        assert tomato["unit_price"] == 50, tomato["unit_price"]

        oil = stock("Olive Oil")
        assert oil["unit_price"] == 1250.0, oil["unit_price"]        # comma stripped
        assert oil["unit"] is None, oil["unit"]                      # column absent

        # a delivery and a day of cooking, recorded after the upload
        conn.execute("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, 6, 'delivery')",
                     (tomato["id"],))
        conn.execute("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, -4, 'usage')",
                     (tomato["id"],))
        assert stock("Tomato")["quantity"] == 22, stock("Tomato")["quantity"]

        # re-uploading the same file corrects the opening balance without
        # duplicating products or double-counting the movements since
        inserted, updated, _ = import_excel(xlsx, conn)
        assert (inserted, updated) == (0, 3), (inserted, updated)
        assert stock("Tomato")["quantity"] == 22, stock("Tomato")["quantity"]

        # the reason list is enforced by the database, not by Python
        try:
            conn.execute("INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, 1, 'lol')",
                         (tomato["id"],))
            raise AssertionError("bad reason should have been rejected")
        except sqlite3.IntegrityError:
            pass

    print("ETL OK")


if __name__ == "__main__":
    main()
