#!/usr/bin/env python3
import sqlite3
import os
import uuid
import urllib.request
import urllib.error
import json
import sys

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def resolve_ticket(ticket_number, walkthrough_path, work_note):
    print(f"\n--- Resolving Ticket: {ticket_number} ---")
    
    # Step 1: Database Updates
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        target_table = 'sovereign_tickets' if 'sovereign_tickets' in tables else 'rm_story'
        
        # Update ticket state to 4 (Resolved)
        cursor.execute(f"UPDATE {target_table} SET state = 4, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP WHERE number = ?", (work_note, ticket_number))
        cursor.execute("UPDATE sys_sdlc_task SET state = 'RESOLVED', sys_updated_on = CURRENT_TIMESTAMP WHERE task_id = ?", (ticket_number,))
        
        # Register attachment
        if 'sys_attachment' in tables:
            attachment_sys_id = str(uuid.uuid4())
            file_name = os.path.basename(walkthrough_path)
            
            cursor.execute("SELECT sys_id FROM sys_attachment WHERE table_name = ? AND table_sys_id = ? AND file_name = ?",
                           (target_table, ticket_number, file_name))
            att_row = cursor.fetchone()
            
            if not att_row:
                cursor.execute("""
                    INSERT INTO sys_attachment (sys_id, table_name, table_sys_id, file_name, content_type, file_path)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (attachment_sys_id, target_table, ticket_number, file_name, 'text/markdown', walkthrough_path))
                print("Walkthrough attachment registered in database.")
            else:
                print("Walkthrough attachment already registered in database.")
                
        conn.commit()
        conn.close()
        print("Database sync completed.")
    except Exception as e:
        print(f"Database sync failed: {e}", file=sys.stderr)

    # Step 2: REST API PUT to SDLC Portal
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
        print(f"API PUT request failed: {e}")

    # Step 3: REST API POST Attachment
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

def main():
    # 1. FishTankFury
    fishtankfury_note = (
        "[Agent Journal - 2026-07-08 - Antigravity]\n"
        "1. Generated standard-tier Twitch-style avatars and coordinate poses (avatar, pointing, shrug).\n"
        "2. Completed advocate database records and seeded custom soundboard phrases.\n"
        "3. Compiled master Sprint 4 Lookbook with image embeds under reports/."
    )
    resolve_ticket(
        ticket_number="STRY1783380244",
        walkthrough_path="/home/james/sovereign_inbox/walkthroughs/walkthrough_STRY1783380244.md",
        work_note=fishtankfury_note
    )

    # 2. LibertyBellRage
    libertybellrage_note = (
        "[Agent Journal - 2026-07-08 - Antigravity]\n"
        "1. Generated standard-tier Twitch-style avatars and coordinate poses (avatar, pointing, shrug) matching the Karen Ballsnatcher character.\n"
        "2. Completed advocate database records and seeded custom soundboard phrases (e.g. Give Me That Ball!).\n"
        "3. Compiled master Sprint 4 Lookbook with image embeds under reports/."
    )
    resolve_ticket(
        ticket_number="STRY1783426227",
        walkthrough_path="/home/james/sovereign_inbox/walkthroughs/walkthrough_STRY1783426227.md",
        work_note=libertybellrage_note
    )

if __name__ == "__main__":
    main()
