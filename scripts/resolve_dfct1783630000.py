#!/usr/bin/env python3
import sqlite3
import os
import uuid
import urllib.request
import urllib.error
import json
import sys

db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
walkthrough_path = '/home/james/sovereign_inbox/walkthroughs/walkthrough_DFCT1783630000.md'
ticket_number = 'DFCT1783630000'

print(f"Starting SDLC Defect Closure Protocol for {ticket_number}...")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check what tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    target_table = 'sovereign_tickets' if 'sovereign_tickets' in tables else 'rm_story'
    print(f"Targeting ticket table: {target_table}")
    
    # Check if ticket already exists
    cursor.execute(f"SELECT sys_id FROM {target_table} WHERE number = ?", (ticket_number,))
    ticket_row = cursor.fetchone()
    
    sys_id = ticket_row[0] if ticket_row else str(uuid.uuid4())
    
    if not ticket_row:
        # Insert a new ticket
        print(f"Ticket {ticket_number} not found. Creating it...")
        cursor.execute(f"PRAGMA table_info({target_table})")
        cols = [c[1] for c in cursor.fetchall()]
        
        insert_cols = ['sys_id', 'number', 'short_description', 'description', 'state', 'priority', 'assigned_to', 'cmdb_ci']
        insert_vals = [
            sys_id,
            ticket_number,
            "Remediate Chatbot Mentions Game Context Grounding Hallucination",
            "Chatbots hallucinating game context during direct @mention checks due to lack of game state caching and missing dynamic system instructions override compiler.",
            4, # Resolved
            2, # High
            "Antigravity",
            "FanStack"
        ]
        
        if 'type' in cols:
            insert_cols.append('type')
            insert_vals.append('DFCT') # Check constraint allows DFCT / STRY
            
        placeholders = ', '.join(['?'] * len(insert_cols))
        cols_str = ', '.join(insert_cols)
        
        insert_query = f"INSERT INTO {target_table} ({cols_str}) VALUES ({placeholders})"
        cursor.execute(insert_query, insert_vals)
        print(f"Successfully inserted ticket {ticket_number} into {target_table}.")
    else:
        # Update existing ticket
        print(f"Ticket {ticket_number} found with sys_id {sys_id}. Updating to Resolved...")
        update_query = f"""
            UPDATE {target_table}
            SET state = 4, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """
        cursor.execute(update_query, (ticket_number,))
        print(f"Successfully updated ticket {ticket_number} to Resolved.")
        
    # Add work note to journal/work_notes
    work_note = (
        "[Agent Journal - 2026-07-09T17:59:00Z - Antigravity]\n"
        "1. Identified that user mentions bypassed build_dynamic_system_instruction, stripping roster grounding and team contexts.\n"
        "2. Added last_known_game_states caching inside the STATE_UPDATE loop in fanstack_chatbots.py.\n"
        "3. Updated CHAT_MESSAGE mention branch to build dynamic system instruction (dyn_sys) referencing the cached game state.\n"
        "4. Appended the current live play descriptions and score to prompt context to ground model outputs in active events."
    )
    
    try:
        cursor.execute(f"SELECT work_notes FROM {target_table} WHERE number = ?", (ticket_number,))
        current_notes = cursor.fetchone()[0] or ""
        new_notes = current_notes + "\n\n" + work_note if current_notes else work_note
        cursor.execute(f"UPDATE {target_table} SET work_notes = ? WHERE number = ?", (new_notes, ticket_number))
        print("Successfully updated work notes.")
    except Exception as e:
        print(f"Could not update work notes column: {e}")
        
    # Register attachment in sys_attachment
    if 'sys_attachment' in tables:
        attachment_sys_id = str(uuid.uuid4())
        file_name = os.path.basename(walkthrough_path)
        
        cursor.execute("SELECT sys_id FROM sys_attachment WHERE table_name = ? AND table_sys_id = ? AND file_name = ?",
                       (target_table, ticket_number, file_name))
        att_row = cursor.fetchone()
        
        if not att_row:
            print("Registering walkthrough attachment in sys_attachment...")
            cursor.execute("""
                INSERT INTO sys_attachment (sys_id, table_name, table_sys_id, file_name, content_type, file_path)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (attachment_sys_id, target_table, ticket_number, file_name, 'text/markdown', walkthrough_path))
            print("Walkthrough attachment registered successfully.")
        else:
            print("Walkthrough attachment already registered in database.")
            
    conn.commit()
    conn.close()
    print("Database sync completed successfully.")
except Exception as e:
    print(f"Database sync failed: {e}", file=sys.stderr)
    sys.exit(1)

# Step 2: REST API Call
print("Attempting REST API calls to SDLC Portal on port 8095...")
try:
    url = f"http://127.0.0.1:8095/api/tickets/{ticket_number}"
    data = {
        "status": "RESOLVED",
        "work_notes": work_note
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        res_data = response.read().decode('utf-8')
        print(f"API PUT Response: {res_data}")
except Exception as e:
    print(f"API PUT request failed/timed out: {e}")

print("SDLC Closure Protocol finished.")
