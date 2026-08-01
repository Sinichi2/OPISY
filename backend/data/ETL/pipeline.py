"""
    The whole ETL in one call: Excel file in, products in the database out.
    Used by the frontend uploader.
"""
from backend.data.relationaldb import apply_schema, get_db_connection
from backend.data.ETL.Extraction.excelDataExtraction import read_rows
from backend.data.ETL.Transformation.normalizeProducts import transform
from backend.data.ETL.Load.loadProducts import load


def import_excel(path, conn=None):
    """
        Returns (inserted, updated, skipped). Raises ValueError if the workbook
        has no rows this system can recognise as products.
    """
    products, skipped = transform(read_rows(path))
    if not products:
        raise ValueError("no_products")  # key into backend.i18n.STRINGS, translated by the caller

    own_connection = conn is None
    conn = conn or get_db_connection()
    try:
        inserted, updated = load(apply_schema(conn), products)
    finally:
        if own_connection:
            conn.close()
    return inserted, updated, skipped
