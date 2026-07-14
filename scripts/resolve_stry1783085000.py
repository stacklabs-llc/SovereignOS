import sqlite3
import uuid
import os
import shutil

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
WALKTHROUGH_PATH = "/home/james/sovereign_inbox/walkthroughs/walkthrough_STRY1783085000.md"
TICKET_NUMBER = "STRY1783085000"

def main():
    if not os.path.exists(WALKTHROUGH_PATH):
        print(f"❌ Walkthrough not found at {WALKTHROUGH_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Fetch ticket from sovereign_tickets first
    c.execute("SELECT * FROM sovereign_tickets WHERE number = ?", (TICKET_NUMBER,))
    st_row = c.fetchone()
    if not st_row:
        print(f"❌ Ticket {TICKET_NUMBER} not found in sovereign_tickets!")
        conn.close()
        return
        
    c.execute("PRAGMA table_info(sovereign_tickets)")
    cols = [col[1] for col in c.fetchall()]
    ticket_data = dict(zip(cols, st_row))
    sys_id = ticket_data["sys_id"]
    
    work_notes = (
        "[Agent Journal - 2026-07-04T05:59:00Z - Antigravity]\n"
        "1. Stabilized Vite config proxy, catch-all /api now proxies to port 8090.\n"
        "2. Resolved duplicate React list keys in AdvocateCenter.tsx using sys_id & indices.\n"
        "3. Synchronized BobbyBonillaHater (Sal Siravo) record across database tables.\n"
        "4. Resolved duplicate advocate_center sidebar key warning in NavigationRail.tsx.\n"
        "5. Conducted successful Tailscale-based Playwright verification from node argo."
    )
    
    # 2. Check/Insert/Update rm_story
    c.execute("SELECT sys_id FROM rm_story WHERE number = ?", (TICKET_NUMBER,))
    rm_row = c.fetchone()
    if not rm_row:
        print(f"Ticket {TICKET_NUMBER} not found in rm_story. Inserting...")
        c.execute("""
            INSERT INTO rm_story (
                sys_id, number, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
            ) VALUES (?, ?, ?, ?, 4, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            sys_id,
            TICKET_NUMBER,
            ticket_data.get("short_description", "Onboard New FanStack Advocate: BobbyBonillaHater"),
            ticket_data.get("description", ""),
            ticket_data.get("priority", 3),
            ticket_data.get("assigned_to", "antigravity"),
            ticket_data.get("cmdb_ci", "cmdb_ci_appl"),
            work_notes
        ))
        print(f"Inserted ticket {TICKET_NUMBER} into rm_story.")
    else:
        c.execute("""
            UPDATE rm_story 
            SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """, (work_notes, TICKET_NUMBER))
        print(f"Updated ticket {TICKET_NUMBER} in rm_story to state = 4 (RESOLVED).")
    
    # 3. Update sovereign_tickets
    c.execute("""
        UPDATE sovereign_tickets
        SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
        WHERE number = ?
    """, (work_notes, TICKET_NUMBER))
    print(f"Updated ticket {TICKET_NUMBER} in sovereign_tickets to state = 4 (RESOLVED).")
        
    # 4. Insert or update attachment in sys_attachment
    file_name = os.path.basename(WALKTHROUGH_PATH)
    file_size = os.path.getsize(WALKTHROUGH_PATH)
    
    for table in ["rm_story", "sovereign_tickets"]:
        c.execute("""
            SELECT sys_id FROM sys_attachment 
            WHERE table_name = ? AND table_sys_id = ? AND file_name = ?
        """, (table, sys_id, file_name))
        att_row = c.fetchone()
        if not att_row:
            att_sys_id = str(uuid.uuid4())
            c.execute("""
                INSERT INTO sys_attachment (
                    sys_id, table_name, table_sys_id, file_name, content_type, file_path, file_size, sys_created_on, sys_updated_on
                ) VALUES (?, ?, ?, ?, 'text/markdown', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (att_sys_id, table, sys_id, file_name, WALKTHROUGH_PATH, file_size))
            print(f"Registered attachment for {table} in sys_attachment.")
        else:
            c.execute("""
                UPDATE sys_attachment
                SET file_path = ?, file_size = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE table_name = ? AND table_sys_id = ? AND file_name = ?
            """, (WALKTHROUGH_PATH, file_size, table, sys_id, file_name))
            print(f"Updated attachment registration for {table} in sys_attachment.")
            
    conn.commit()
    conn.close()
    print("Database sync and ticket resolution completed successfully.")

if __name__ == "__main__":
    main()
