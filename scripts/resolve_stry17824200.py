import sqlite3
import uuid
import os

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
WALKTHROUGH_PATH = "/home/james/sovereign_inbox/walkthroughs/walkthrough_STRY17824200.md"
TICKET_NUMBER = "STRY17824200"

def main():
    if not os.path.exists(WALKTHROUGH_PATH):
        print(f"❌ Walkthrough not found at {WALKTHROUGH_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Fetch ticket from rm_story
    c.execute("SELECT * FROM rm_story WHERE number = ?", (TICKET_NUMBER,))
    rm_row = c.fetchone()
    if not rm_row:
        print(f"❌ Ticket {TICKET_NUMBER} not found in rm_story!")
        conn.close()
        return
        
    c.execute("PRAGMA table_info(rm_story)")
    cols = [col[1] for col in c.fetchall()]
    ticket_data = dict(zip(cols, rm_row))
    sys_id = ticket_data["sys_id"]
    
    work_notes = (
        "[Agent Journal - 2026-06-28T18:47:00Z - Antigravity]\n"
        "1. Cleaned up @verdant_anarchist database records from NYM-PHI rooms.\n"
        "2. Mapped Team IDs to MLB static CDN team IDs in SovereignSportsDashboard.tsx.\n"
        "3. Rendered team logos inline next to the scores in the highlighted scoreboard widget.\n"
        "4. Added the advocates dropdown select and avatar roster panel to Panel C (Chat Reactor).\n"
        "5. Verified TypeScript build compilation."
    )
    
    # Update rm_story
    c.execute("""
        UPDATE rm_story 
        SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
        WHERE number = ?
    """, (work_notes, TICKET_NUMBER))
    print(f"Updated ticket {TICKET_NUMBER} in rm_story to state = 4 (RESOLVED).")
    
    # 2. Check if ticket exists in sovereign_tickets
    c.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ?", (TICKET_NUMBER,))
    st_row = c.fetchone()
    if not st_row:
        print(f"Ticket {TICKET_NUMBER} not found in sovereign_tickets. Inserting...")
        c.execute("""
            INSERT INTO sovereign_tickets (
                sys_id, number, type, parent_sys_id, short_description, description, 
                state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
            ) VALUES (?, ?, 'STRY', NULL, ?, ?, 4, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            sys_id,
            TICKET_NUMBER,
            ticket_data["short_description"],
            ticket_data["description"],
            ticket_data["priority"],
            ticket_data["assigned_to"],
            ticket_data["cmdb_ci"],
            work_notes
        ))
        print(f"Inserted ticket {TICKET_NUMBER} into sovereign_tickets.")
    else:
        # Update sovereign_tickets
        c.execute("""
            UPDATE sovereign_tickets
            SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """, (work_notes, TICKET_NUMBER))
        print(f"Updated ticket {TICKET_NUMBER} in sovereign_tickets.")
        
    # 3. Insert or update attachment in sys_attachment
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
