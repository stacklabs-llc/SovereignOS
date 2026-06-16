#!/usr/bin/env python3
import os
import re
import sqlite3
import uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
INBOX_TICKETS_DIR = "/home/james/sovereign_inbox/tickets"
INBOX_DIR = "/home/james/sovereign_inbox"

def parse_work_order_file(filepath):
    filename = os.path.basename(filepath)
    print(f"Parsing file: {filename}")
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    lines = [line.strip() for line in content.splitlines()]
    
    # Parse title (first line)
    title = ""
    if lines:
        first_line = lines[0]
        # Match e.g. "📡 ANTIGRAVITY WORK ORDER: SOVEREIGN OS WORK ORDER SYNC AUTOMATION"
        match = re.search(r"(?:ANTIGRAVITY\s+)?WORK\s+ORDER:\s*(.*)$", first_line, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
        else:
            # Fallback H1 search
            h1_match = re.search(r"^#\s*(.*)$", first_line)
            if h1_match:
                title = h1_match.group(1).strip()
            else:
                title = os.path.splitext(filename)[0]

    # Clean title from emojis/brackets
    title = re.sub(r'[\u2600-\u27BF]|[\u2000-\u3300]|[\uD83C-\uDBFF\uDC00-\uDFFF]', '', title).strip(" :.-–—")

    # Helper to find values in tabbed key-value lines
    ticket_id = ""
    priority = "3"
    assigned_to = "antigravity"
    
    for idx, line in enumerate(lines):
        if line.lower() == "ticket id":
            if idx + 1 < len(lines):
                ticket_id = lines[idx + 1].strip("` \t")
        elif line.lower() == "priority":
            if idx + 1 < len(lines):
                p_val = lines[idx + 1].strip()
                p_match = re.search(r"P(\d+)", p_val, re.IGNORECASE)
                if p_match:
                    priority = p_match.group(1)
        elif line.lower() in ["assigned to", "assigned_to"]:
            if idx + 1 < len(lines):
                assigned_to = lines[idx + 1].strip("` \t")

    # Fallbacks via regex if tab structure is different
    if not ticket_id:
        pattern_match = re.search(r'\b((?:STRY|INC|DFCT|ENHC|WO)-[A-Z0-9\-_]+)\b', content, re.IGNORECASE)
        if pattern_match:
            ticket_id = pattern_match.group(1).upper()

    if not ticket_id:
        id_match = re.search(r'\b(Ticket ID|Ticket|ID)\b\s*:?\s*`?([A-Z0-9\-_]+)`?', content, re.IGNORECASE)
        if id_match:
            val = id_match.group(2)
            val_upper = val.upper()
            if len(val) >= 4 and val_upper not in ["ENTIFIED", "GETS", "GING", "EO", "S", "EBAR", "ATION", "UAL"]:
                ticket_id = val
            
    if not ticket_id:
        # Generate deterministic md5 hash-based ID if none found
        import hashlib
        h = hashlib.md5(content.encode('utf-8', errors='ignore')).hexdigest()
        ticket_id = "INC" + str(int(h, 16) % 10000000)

    # Determine type
    ticket_type = "STRY" if any(x in ticket_id.upper() for x in ["STRY", "WO"]) else "INC"

    return {
        "id": ticket_id,
        "type": ticket_type,
        "title": title,
        "priority": int(priority),
        "assigned_to": assigned_to,
        "content": content,
        "filename": filename
    }

def stage_ticket_in_db(ticket):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    num_state = 1  # STAGED
    sdlc_state = 'STAGED'
    description_text = f"Google Drive Work Order Sync automatically pulled and staged this file.\n\n- File Name: {ticket['filename']}\n- Source: {INBOX_TICKETS_DIR}/{ticket['filename']}"

    # 1. Update/Insert into sovereign_tickets
    cursor.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ?", (ticket["id"],))
    row = cursor.fetchone()
    
    if row:
        sys_id = row[0]
        print(f"  [sovereign_tickets] Updating ticket {ticket['id']}...")
        cursor.execute("""
            UPDATE sovereign_tickets 
            SET type = ?, short_description = ?, description = ?, state = ?, priority = ?, assigned_to = ?, cmdb_ci = ?, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
            WHERE sys_id = ?
        """, (ticket["type"], ticket["title"], description_text, num_state, ticket["priority"], ticket["assigned_to"], 'GoogleDriveSync', 'File sync executed and staged.', sys_id))
    else:
        sys_id = uuid.uuid4().hex
        print(f"  [sovereign_tickets] Inserting new ticket {ticket['id']}...")
        cursor.execute("""
            INSERT INTO sovereign_tickets 
              (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sys_id, ticket["id"], ticket["type"], ticket["title"], description_text, num_state, ticket["priority"], ticket["assigned_to"], 'GoogleDriveSync', 'File sync executed and staged.'))

    # 2. Update/Insert into sys_sdlc_task
    cursor.execute("SELECT task_id FROM sys_sdlc_task WHERE task_id = ?", (ticket["id"],))
    task_row = cursor.fetchone()
    
    task_type_db = ticket["type"].lower() if ticket["type"] == "STRY" else "story"
    if task_row:
        print(f"  [sys_sdlc_task] Updating task {ticket['id']}...")
        cursor.execute("""
            UPDATE sys_sdlc_task
            SET task_type = ?, state = ?, short_description = ?
            WHERE task_id = ?
        """, (task_type_db, sdlc_state, ticket["title"], ticket["id"]))
    else:
        print(f"  [sys_sdlc_task] Inserting new task {ticket['id']}...")
        cursor.execute("""
            INSERT INTO sys_sdlc_task (task_id, task_type, state, module_target, short_description)
            VALUES (?, ?, ?, ?, ?)
        """, (ticket["id"], task_type_db, sdlc_state, 'portal_core', ticket["title"]))

    conn.commit()
    conn.close()
    print(f"✅ Staged ticket {ticket['id']} successfully.")

def main():
    print("🚀 Running execute_staged_orders.py parser...")
    
    # Check both tickets folder and root inbox (just in case they are not yet organized)
    paths_to_scan = [INBOX_TICKETS_DIR, INBOX_DIR]
    scanned_files = []
    
    for scan_dir in paths_to_scan:
        if not os.path.exists(scan_dir):
            continue
        for entry in os.scandir(scan_dir):
            if entry.is_file() and entry.name.endswith(".md"):
                # Ignore walkthroughs by filename
                if "walkthrough" in entry.name.lower():
                    continue
                # Avoid duplicates
                if entry.name not in scanned_files:
                    # Filter for files that contain "ANTIGRAVITY WORK ORDER" or "WORK ORDER"
                    try:
                        with open(entry.path, 'r', encoding='utf-8', errors='ignore') as f:
                            first_few_lines = f.read(500)
                        # Skip if it is a walkthrough
                        if "walkthrough" in first_few_lines.lower():
                            continue
                        if "WORK ORDER" in first_few_lines.upper():
                            scanned_files.append((entry.name, entry.path))
                    except Exception:
                        pass
                        
    staged_count = 0
    for filename, filepath in scanned_files:
        try:
            ticket = parse_work_order_file(filepath)
            stage_ticket_in_db(ticket)
            staged_count += 1
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
            
    print(f"📊 Completed staging. Total staged work orders: {staged_count}")
    # Write count to stdout/file for backend API consumption if needed
    return staged_count

if __name__ == "__main__":
    main()
