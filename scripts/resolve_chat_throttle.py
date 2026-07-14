#!/usr/bin/env python3
import sqlite3
import os
import uuid
import urllib.request
import urllib.error
import json
import sys

db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
walkthrough_path = '/home/james/sovereign_inbox/walkthroughs/walkthrough_INC-2026-0710-CHAT-THROTTLE.md'
ticket_number = 'INC-2026-0710-CHAT-THROTTLE'
sys_id = '07101783'

print(f"Starting SDLC Closure Protocol for {ticket_number}...")

# Step 1: Direct Database Synchronization
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    target_table = 'sovereign_tickets' if 'sovereign_tickets' in tables else 'rm_story'
    
    work_note = (
        "[Agent Journal - 2026-07-10T23:56:00Z - Antigravity]\n"
        "1. Deactivated over-active game-day chatroom 823604 to manage engagement limits.\n"
        "2. Triggered REST API POST /api/room/deactivate to update schedule and room records to 'staged'.\n"
        "3. Confirmed database state sync (mlb_schedule and cmdb_ci_fanstack_room updated successfully).\n"
        "4. Conducted Playwright browser UAT check confirming no new chatbot messages are sent.\n"
        "5. Captured live chat dashboard screenshot and compiled resolution walkthrough."
    )
    
    # Check if ticket exists in sovereign_tickets
    cursor.execute(f"SELECT sys_id FROM {target_table} WHERE number = ?", (ticket_number,))
    row = cursor.fetchone()
    
    if not row:
        print(f"Ticket {ticket_number} not found in {target_table}. Inserting...")
        cursor.execute(f"""
            INSERT INTO {target_table} (
                sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
            ) VALUES (?, ?, 'INC', 'Chatbot Swarm Moderation & Activity Control', 'Pause active chatbot swarm in room 823604 to manage engagement levels.', 4, 3, 'Antigravity', 'cmdb_ci_appl', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (sys_id, ticket_number, work_note))
        print(f"Inserted into {target_table}.")
    else:
        sys_id = row[0]
        cursor.execute(f"""
            UPDATE {target_table}
            SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE number = ?
        """, (work_note, ticket_number))
        print(f"Updated {target_table}.")

    # Check rm_story table as well
    if 'rm_story' in tables and target_table != 'rm_story':
        cursor.execute("SELECT sys_id FROM rm_story WHERE number = ?", (ticket_number,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO rm_story (
                    sys_id, number, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on
                ) VALUES (?, ?, 'Chatbot Swarm Moderation & Activity Control', 'Pause active chatbot swarm in room 823604 to manage engagement levels.', 4, 3, 'Antigravity', 'cmdb_ci_appl', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (sys_id, ticket_number, work_note))
            print("Inserted into rm_story.")
            
    # Register attachment in sys_attachment
    if 'sys_attachment' in tables:
        file_name = os.path.basename(walkthrough_path)
        file_size = os.path.getsize(walkthrough_path)
        att_path = f"/attachments/{file_name}"
        
        for table in [target_table, 'rm_story'] if 'rm_story' in tables else [target_table]:
            cursor.execute("SELECT sys_id FROM sys_attachment WHERE table_name = ? AND table_sys_id = ? AND file_name = ?",
                           (table, sys_id, file_name))
            att_row = cursor.fetchone()
            
            if not att_row:
                attachment_sys_id = str(uuid.uuid4())
                print(f"Registering walkthrough attachment in sys_attachment for {table}...")
                cursor.execute("""
                    INSERT INTO sys_attachment (sys_id, table_name, table_sys_id, file_name, content_type, file_path, file_size, sys_created_on, sys_updated_on)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (attachment_sys_id, table, sys_id, file_name, 'text/markdown', att_path, file_size))
                print(f"Walkthrough attachment registered successfully for {table}.")
            else:
                cursor.execute("""
                    UPDATE sys_attachment
                    SET file_path = ?, file_size = ?, sys_updated_on = CURRENT_TIMESTAMP
                    WHERE table_name = ? AND table_sys_id = ? AND file_name = ?
                """, (att_path, file_size, table, sys_id, file_name))
                print(f"Updated walkthrough attachment in sys_attachment for {table}.")
            
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
            "1. Deactivated over-active game-day chatroom 823604 to manage engagement limits.\n"
            "2. Triggered REST API POST /api/room/deactivate to update schedule and room records to 'staged'.\n"
            "3. Confirmed database state sync (mlb_schedule and cmdb_ci_fanstack_room updated successfully).\n"
            "4. Conducted Playwright browser UAT check confirming no new chatbot messages are sent.\n"
            "5. Captured live chat dashboard screenshot and compiled resolution walkthrough."
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
