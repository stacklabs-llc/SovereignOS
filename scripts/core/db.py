"""Shared SQLite connection helper. Replaces 93 scattered sqlite3.connect() calls."""
import sqlite3
from contextlib import contextmanager

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

@contextmanager
def get_db(row_factory=True, timeout=30.0):
    """Usage:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(...)
            conn.commit()
    Connection is always closed, even on exception.
    """
    conn = sqlite3.connect(DB_PATH, timeout=timeout)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    if row_factory:
        conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
