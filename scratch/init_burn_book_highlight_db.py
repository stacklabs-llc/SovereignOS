import sqlite3
import uuid
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def main():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create burn_events
    print("Creating burn_events table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS burn_events (
        sys_id TEXT PRIMARY KEY,
        game_pk TEXT NOT NULL,
        persona TEXT NOT NULL,
        target_persona TEXT,
        message TEXT NOT NULL,
        burn_score INTEGER DEFAULT 0,
        heat_index INTEGER DEFAULT 0,
        is_tko INTEGER DEFAULT 0,
        burn_date TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_burn_persona ON burn_events(persona);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_burn_date ON burn_events(burn_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_burn_game ON burn_events(game_pk);")

    # Create burn_daily_archive
    print("Creating burn_daily_archive table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS burn_daily_archive (
        sys_id TEXT PRIMARY KEY,
        archive_date TEXT NOT NULL,
        persona TEXT NOT NULL,
        total_burn INTEGER DEFAULT 0,
        heat_index INTEGER DEFAULT 0,
        tko_count INTEGER DEFAULT 0,
        top_burn TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    # Create highlight_queue
    print("Creating highlight_queue table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS highlight_queue (
        sys_id TEXT PRIMARY KEY,
        game_pk TEXT NOT NULL,
        persona TEXT NOT NULL,
        message TEXT NOT NULL,
        game_state TEXT,
        score INTEGER DEFAULT 0,
        reason TEXT,
        twitter_draft TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    # Create Stories in sovereign_tickets
    print("Creating stories in sovereign_tickets...")
    
    # Story 1: Burn Book
    sys_id_1 = uuid.uuid4().hex
    cursor.execute("""
        INSERT OR IGNORE INTO sovereign_tickets (
            sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, sys_created_on, sys_updated_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sys_id_1,
        "STRY1779732178",
        "STRY",
        "Sovereign Burn Book — Drill-Down View & Daily Reset",
        "Implement a chronological burn ledger, a daily reset cron, and a frontend drill-down modal/panel in PlaycallDesk.",
        2,  # IN_PROGRESS
        2,  # P2
        "Antigravity",
        "cmdb_ci_appl_fanstack",
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))

    # Story 2: Highlight Watcher
    sys_id_2 = uuid.uuid4().hex
    cursor.execute("""
        INSERT OR IGNORE INTO sovereign_tickets (
            sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, sys_created_on, sys_updated_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sys_id_2,
        "STRY1779732179",
        "STRY",
        "FanStack Real-Time Highlight Alert System",
        "Monitors game_chat for tweet-worthy moments and fires alerts.",
        2,  # IN_PROGRESS
        2,  # P2
        "Antigravity",
        "cmdb_ci_appl_fanstack",
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()
    print("Database initialization and ticket creation complete!")

if __name__ == "__main__":
    main()
