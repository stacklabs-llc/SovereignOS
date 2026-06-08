import sqlite3
import os

DB_PATH = "/home/james/SovereignOS/scripts/sovereign_sdlc.db"

def init_db():
    if os.path.exists(DB_PATH):
        print(f"[*] Removing existing database at {DB_PATH}")
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. TICKETS TABLE
    cursor.execute("""
    CREATE TABLE tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        ticket_type TEXT DEFAULT 'INC',
        status TEXT DEFAULT 'OPEN',
        priority TEXT DEFAULT 'P3',
        risk_level TEXT,
        cab_approval TEXT DEFAULT 'PENDING',
        sprint_id TEXT,
        story_points INTEGER,
        acceptance_criteria TEXT,
        assigned_ci TEXT,
        sprint_eon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        resolved_at DATETIME
    )
    """)

    # 2. CI_REGISTRY TABLE
    cursor.execute("""
    CREATE TABLE ci_registry (
        ci_id TEXT PRIMARY KEY,
        display_name TEXT,
        ci_type TEXT,
        node_address TEXT,
        status TEXT DEFAULT 'ACTIVE',
        parent_ci TEXT,
        zone TEXT DEFAULT 'SOVEREIGN',
        degradation_mode TEXT DEFAULT 'NONE',
        metadata_json TEXT,
        last_heartbeat DATETIME
    )
    """)

    # 3. CI_RELATIONSHIPS TABLE
    cursor.execute("""
    CREATE TABLE ci_relationships (
        rel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_ci TEXT,
        child_ci TEXT,
        rel_type TEXT
    )
    """)

    # 4. TICKET_LOG TABLE
    cursor.execute("""
    CREATE TABLE ticket_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT,
        action TEXT,
        old_value TEXT,
        new_value TEXT,
        actor TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. SPRINTS TABLE
    cursor.execute("""
    CREATE TABLE sprints (
        sprint_id TEXT PRIMARY KEY,
        title TEXT,
        start_date DATE,
        end_date DATE,
        goal TEXT,
        status TEXT
    )
    """)

    # --- SEED DATA ---
    print("[*] Inserting Seed Data...")

    # Seed CI Registry
    cis = [
        ("CI-NODE-73", "Sovereign-E", "HARDWARE", ".73", "ACTIVE", "", "SOVEREIGN", "CRITICAL"),
        ("CI-NODE-64", "Artemis Bridge", "HARDWARE", ".64", "ACTIVE", "", "SOVEREIGN", "CRITICAL"),
        ("CI-ANTIGRAVITY", "Antigravity", "AGENT", ".73", "ACTIVE", "CI-NODE-73", "SOVEREIGN", "CRITICAL"),
        ("CI-MYCROFT", "Mycroft", "GEM", "CLOUD", "ACTIVE", "", "SOVEREIGN", "CRITICAL"),
        ("CI-SN-PDI", "ServiceNow PDI", "SERVICE", "EXTERNAL", "ACTIVE", "", "DMZ", "GRACEFUL"),
        ("CI-FANSTACK", "FanStack Sim", "SERVICE", ".73", "ACTIVE", "CI-NODE-73", "DMZ", "GRACEFUL"),
        ("CI-GOVEE", "Govee Array", "HARDWARE", "LAN", "ACTIVE", "", "DMZ", "GRACEFUL"),
        ("CI-PI5", "Pi 5", "HARDWARE", ".74", "ACTIVE", "", "SOVEREIGN", "CRITICAL"),
        ("CI-ARTEMIS-1", "Claude", "AGENT", "CLOUD", "ACTIVE", "", "SOVEREIGN", "CRITICAL"),
        ("CI-FERRIS", "Ferris", "AGENT", "CLOUD", "OFFLINE", "", "SOVEREIGN", "CRITICAL")
    ]
    cursor.executemany("""
        INSERT INTO ci_registry (ci_id, display_name, ci_type, node_address, status, parent_ci, zone, degradation_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, cis)

    # Seed Tickets
    tickets = [
        ("TKT-0001", "DOM Scraper — Broken", "The custom gem URL scraper is failing.", "INC", "OPEN", "P2", "LOW", "APPROVED", "", 2, "", "CI-ANTIGRAVITY"),
        ("TKT-0002", "Pi Zero Spring Cleaning", "Argus multi-room mesh deployment.", "STORY", "OPEN", "P3", "LOW", "PENDING", "", 3, "", "CI-NODE-73"),
        ("TKT-0003", "Architect SDLC Console", "ServiceNow style UI.", "STORY", "DONE", "P1", "LOW", "APPROVED", "SPRINT-2026-04-02", 5, "Blueprint delivered.", "CI-ARTEMIS-1"),
        ("TKT-0004", "Draft ATDC Origin Narrative", "Moores/Remedy pedigree pitch.", "STORY", "OPEN", "P2", "LOW", "PENDING", "", 5, "", "CI-ARTEMIS-1")
    ]
    cursor.executemany("""
        INSERT INTO tickets (id, title, description, ticket_type, status, priority, risk_level, cab_approval, sprint_id, story_points, acceptance_criteria, assigned_ci)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tickets)

    # Seed Sprints
    cursor.execute("""
        INSERT INTO sprints (sprint_id, title, status, goal)
        VALUES ('SPRINT-2026-04-02', 'Sovereign Console Validation', 'ACTIVE', 'Establish SDLC governance')
    """)

    conn.commit()
    conn.close()
    print("[*] Database initialization complete.")

if __name__ == "__main__":
    init_db()
