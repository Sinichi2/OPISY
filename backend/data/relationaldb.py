import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[2] / "panziann.db"
SCHEMA = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")


def get_db_connection():
    """
        Gets a connection to
        SQLite database.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    apply_schema(conn)
    return conn


def apply_schema(conn):
    """Creates the tables if they are missing. Safe to call on every connection."""
    conn.execute("PRAGMA foreign_keys = ON")  # off by default in SQLite
    conn.executescript(SCHEMA)
    return conn
