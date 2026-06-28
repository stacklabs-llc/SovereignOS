"""Shared SQLite connection helper. Replaces 93 scattered sqlite3.connect() calls."""
import sqlite3
from contextlib import contextmanager

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

@contextmanager
def get_db(row_factory=True):
    """Usage:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(...)
            conn.commit()
    Connection is always closed, even on exception.
    """
    conn = sqlite3.connect(DB_PATH)
    if row_factory:
        conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
