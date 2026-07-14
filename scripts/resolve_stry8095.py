import sqlite3
import uuid
import os
import shutil

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
TICKET_NUMBER = "STRY8095"

def main():
    possible_paths = [
        "/home/james/sovereign_inbox/walkthroughs/walkthrough_STRY8095.md",
        "/home/james/sovereign_inbox/walkthrough_STRY8095.md",
        "/home/james/.gemini/antigravity/brain/34911535-52d9-4991-b1f0-48f7201b7afb/walkthrough_STRY8095.md"
    ]
    
    walkthrough_src = None
    for p in possible_paths:
        if os.path.exists(p):
            walkthrough_src = p
            break
            
    if not walkthrough_src:
        print("❌ Walkthrough not found in any of the expected paths:")
        for p in possible_paths:
            print(f"  - {p}")
        return

    print(f"Found walkthrough at {walkthrough_src}")
    
    # Ensure it's in the walkthroughs subdirectory
    walkthroughs_dir = "/home/james/sovereign_inbox/walkthroughs"
    os.makedirs(walkthroughs_dir, exist_ok=True)
    walkthrough_dest = os.path.join(walkthroughs_dir, "walkthrough_STRY8095.md")
    if walkthrough_src != walkthrough_dest:
        shutil.copy2(walkthrough_src, walkthrough_dest)
        print(f"Copied walkthrough to {walkthrough_dest}")
    else:
        print(f"Walkthrough already in {walkthrough_dest}")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Check/Insert into rm_story
    c.execute("SELECT sys_id FROM rm_story WHERE number = ?", (TICKET_NUMBER,))
    rm_row = c.fetchone()
    sys_id = "8095"
    
    work_notes = (
        "[Agent Journal - 2026-07-03T23:45:00Z - Antigravity]\n"
        "1. Remapped AIRBENDER_OVERLAY to trigger exclusively on Francisco Lindor hit events.\n"
        "2. Updated VideoPlayer and FanFanStackPortal overlay rendering with Lindor theme.\n"
        "3. Re-architected TeamLogo with ESPN CDN, white radial backdrops, and double drop-shadows.\n"
        "4. Purged M.A.R.D. LIVE connection status badges to resolve layout regressions.\n"
        "5. Conducted successful Playwright UAT and captured screenshots."
    )
    
    if not rm_row:
        print(f"Ticket {TICKET_NUMBER} not found in rm_story. Inserting...")
        c.execute("""
            INSERT INTO rm_story (
                sys_id, number, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
            ) VALUES (?, ?, ?, ?, 4, 3, 'antigravity', 'cmdb_ci_appl', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            sys_id,
            TICKET_NUMBER,
            "Sovereign Sports Dashboard - Air Bender & Logo Visibility Enhancements",
            "Enhance branding visibility and remap Air Bender overlay.",
            work_notes
        ))
        print("Inserted into rm_story.")
    else:
        sys_id = rm_row[0]
        c.execute("""
            UPDATE rm_story
            SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """, (work_notes, TICKET_NUMBER))
        print("Updated rm_story.")
        
    # 2. Check/Insert into sovereign_tickets
    c.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ?", (TICKET_NUMBER,))
    st_row = c.fetchone()
    if not st_row:
        print(f"Ticket {TICKET_NUMBER} not found in sovereign_tickets. Inserting...")
        c.execute("""
            INSERT INTO sovereign_tickets (
                sys_id, number, type, parent_sys_id, short_description, description, 
                state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
            ) VALUES (?, ?, 'STRY', NULL, ?, ?, 4, 3, 'antigravity', 'cmdb_ci_appl', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            sys_id,
            TICKET_NUMBER,
            "Sovereign Sports Dashboard - Air Bender & Logo Visibility Enhancements",
            "Enhance branding visibility and remap Air Bender overlay.",
            work_notes
        ))
        print("Inserted into sovereign_tickets.")
    else:
        c.execute("""
            UPDATE sovereign_tickets
            SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """, (work_notes, TICKET_NUMBER))
        print("Updated sovereign_tickets.")
        
    # 3. Register walkthrough attachment in sys_attachment
    file_name = "walkthrough_STRY8095.md"
    file_size = os.path.getsize(walkthrough_dest)
    att_path = f"/attachments/{file_name}"
    
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
            """, (att_sys_id, table, sys_id, file_name, att_path, file_size))
            print(f"Registered attachment for {table} in sys_attachment.")
        else:
            c.execute("""
                UPDATE sys_attachment
                SET file_path = ?, file_size = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE table_name = ? AND table_sys_id = ? AND file_name = ?
            """, (att_path, file_size, table, sys_id, file_name))
            print(f"Updated attachment for {table} in sys_attachment.")
            
    conn.commit()
    conn.close()
    print("Database sync and ticket 8095 resolution completed successfully.")

if __name__ == "__main__":
    main()
