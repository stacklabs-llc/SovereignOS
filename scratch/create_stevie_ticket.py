import sqlite3
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

try:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Insert new ticket STRY1779732186
    cur.execute("""
        INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "STRY1779732186",
        "STRY1779732186",
        "STRY",
        "Onboard New FanStack Persona: UncleStevieStan",
        "Provision character map, crop avatar, and synchronize Uncle Stevie Stan AI Persona for WardyNYMs postgame.",
        4, # State 4 = Resolved
        2, # Priority 2 = High
        "james",
        "b4b7157a986443ada218c9a393b00b77", # CMDB CI
        "Generated 3x3 high-fidelity character map, cropped top-left cell as 1:1 avatar, updated database entries to match UncleStevieStan and unclesteviestan@gmail.com. Verified and resolved.",
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))
    print("[+] Successfully created STRY1779732186 ticket in sovereign_tickets.")
    
    conn.commit()
    conn.close()
    print("=== TICKET CREATION COMPLETE ===")
except Exception as e:
    print(f"[ERROR] Ticket creation failed: {e}")
