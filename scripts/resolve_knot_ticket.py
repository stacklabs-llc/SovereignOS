#!/usr/bin/env python3
import sqlite3
import os
import uuid
import urllib.request
import urllib.error
import json
import sys

db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
walkthrough_path = '/home/james/sovereign_inbox/walkthroughs/walkthrough_WO-2026-101.md'
ticket_number = 'WO-2026-101'
task_id = 'WO-KNOT-MASTER'

print("Starting SDLC Closure Protocol for WO-2026-101...")

# Step 1: Direct Database Synchronization
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    target_table = 'sovereign_tickets' if 'sovereign_tickets' in tables else 'rm_story'
    
    # Update existing ticket to Resolved
    print(f"Updating ticket {ticket_number} in {target_table} to RESOLVED...")
    cursor.execute(f"UPDATE {target_table} SET state = 4, sys_updated_on = CURRENT_TIMESTAMP WHERE number = ?", (ticket_number,))
    
    # Update sys_sdlc_task
    if 'sys_sdlc_task' in tables:
        print(f"Updating sys_sdlc_task {task_id} to RESOLVED...")
        cursor.execute("UPDATE sys_sdlc_task SET state = 'RESOLVED' WHERE task_id = ?", (task_id,))

    # Add work note to journal/work_notes
    work_note = (
        "[Agent Journal - 2026-07-09T22:59:00Z - Antigravity]\n"
        "1. Created REQ_WO_KNOT_MASTER_SPEC.md design specifications under dna/docs/.\n"
        "2. Initialized sovereign_knot_core directory with local .venv and dependencies.\n"
        "3. Setup knot_state.db SQLite database in WAL mode with baseline variables.\n"
        "4. Built sovereign_knot.py consensus engine and fault_simulator.py transitions simulator.\n"
        "5. Deployed FastAPI app gateway on Port 3023 serving Glowing Dials index.html interface.\n"
        "6. Registered the component under Sovereign_Knot_Showcase_Console in VISUAL_PLAYBOOK.md.\n"
        "7. Executed unit tests and verified full nominal/fracture loops via API call simulation."
    )
    
    try:
        cursor.execute(f"SELECT work_notes FROM {target_table} WHERE number = ?", (ticket_number,))
        row = cursor.fetchone()
        current_notes = row[0] if row else ""
        new_notes = current_notes + "\n\n" + work_note if current_notes else work_note
        cursor.execute(f"UPDATE {target_table} SET work_notes = ? WHERE number = ?", (new_notes, ticket_number))
        print("Successfully updated work notes in database.")
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
            
    conn.commit()
    conn.close()
    print("Database sync completed successfully.")
except Exception as e:
    print(f"Database sync failed: {e}", file=sys.stderr)

# Step 2: REST API Calls to the SDLC Portal (Port 8095)
print("Attempting REST API calls to SDLC Portal on port 8095...")

# 2.1 Update ticket status via PUT /api/tickets/{number}
try:
    url = f"http://127.0.0.1:8095/api/tickets/{ticket_number}"
    data = {
        "status": "RESOLVED",
        "work_notes": (
            "1. Created REQ_WO_KNOT_MASTER_SPEC.md design specifications under dna/docs/.\n"
            "2. Initialized sovereign_knot_core directory with local .venv and dependencies.\n"
            "3. Setup knot_state.db SQLite database in WAL mode with baseline variables.\n"
            "4. Built sovereign_knot.py consensus engine and fault_simulator.py transitions simulator.\n"
            "5. Deployed FastAPI app gateway on Port 3023 serving Glowing Dials index.html interface.\n"
            "6. Registered the component under Sovereign_Knot_Showcase_Console in VISUAL_PLAYBOOK.md.\n"
            "7. Executed unit tests and verified full nominal/fracture loops via API call simulation."
        )
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
    print(f"API PUT request failed: {e}")

# 2.2 Upload walkthrough attachment via POST /api/tickets/{number}/attachments
try:
    url = f"http://127.0.0.1:8095/api/tickets/{ticket_number}/attachments"
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    
    with open(walkthrough_path, 'rb') as f:
        file_content = f.read()
        
    filename = os.path.basename(walkthrough_path)
    
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: text/markdown\r\n\r\n"
    ).encode('utf-8') + file_content + f"\r\n--{boundary}--\r\n".encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Content-Length': str(len(body))
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        res_data = response.read().decode('utf-8')
        print(f"API Attachment POST Response: {res_data}")
except Exception as e:
    print(f"API Attachment POST request failed: {e}")

print("SDLC Closure Protocol finished.")
