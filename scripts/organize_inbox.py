#!/usr/bin/env python3
# ==============================================================================
# Sovereign OS: Semantic Ingestion Sorting Hat Engine
# Path: /home/james/SovereignOS/scripts/organize_inbox.py
#
# Governed by STRY-06052026-PULL-WORKORDERS.
# Deep-inspects file content (not names) to categorize and route documents 
# and media assets, then writes ITSM records to SQLite.
# ==============================================================================

import os
import re
import shutil
import sqlite3
import mimetypes
from pathlib import Path

# Clio System Directories
INBOX_DIR = "/home/james/sovereign_inbox"
SVR_ROOT = "/home/james/SovereignOS"
DB_PATH = os.path.join(SVR_ROOT, "dna/sovereign_now.db")

# Target Folders inside Inbox Staging
ROUTES = {
    "ticket": os.path.join(INBOX_DIR, "tickets"),
    "config": os.path.join(INBOX_DIR, "configs"),
    "walkthrough": os.path.join(INBOX_DIR, "walkthroughs"),
    "kb": os.path.join(INBOX_DIR, "kb"),
    "report": os.path.join(INBOX_DIR, "reports"),
    "media": os.path.join(SVR_ROOT, "media_vault/03_Assets")
}

# Ensure all target routing directories exist
for path in ROUTES.values():
    os.makedirs(path, exist_ok=True)

def sniff_text_content(content):
    """
    Deep-inspects document text for semantic keywords to determine category.
    """
    scores = {
        "ticket": 0,
        "config": 0,
        "walkthrough": 0,
        "kb": 0
    }

    # Keyword weights for semantic matching
    keywords = {
        "ticket": [r"ticket id", r"priority", r"inc\d+", r"stry\d+", r"work order", r"assigned to", r"itsm"],
        "config": [r"recipe", r"manifest", r"aesthetic style", r"flow prompts", r"3x3 matrix", r"coordinate key"],
        "walkthrough": [r"walkthrough", r"changes made", r"proposed changes", r"implementation plan", r"defect tracking"],
        "kb": [r"backstory", r"deep lore", r"glossary", r"ecosystem specification", r"origin trauma", r"feline rescue fund"]
    }

    # Score content
    for category, patterns in keywords.items():
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            scores[category] += len(matches)

    # Return category with highest score, or fall back to default report
    max_score = max(scores.values())
    if max_score == 0:
        return "report"
    
    best_match = [k for k, v in scores.items() if v == max_score][0]
    return best_match

def clean_title(title):
    if not title:
        return title
    # Remove emoji symbols
    title = re.sub(r'[\u2600-\u27BF]|[\u2000-\u3300]|[\uD83C-\uDBFF\uDC00-\uDFFF]', '', title)
    # Remove leading/trailing colons, dashes, and spaces
    title = title.strip(" :.-–—")
    return title

def extract_ticket_meta(content, filename=None):
    """
    Parses structured variables inside tickets to write cleaner database entries.
    """
    meta = {
        "id": "INC" + str(hash(content) % 10000000),
        "type": "INC",
        "state": "STAGED",
        "desc": "Semantically Routed Document"
    }

    # Extract ID (allowing underscores, hyphens, optional colons, and multi-line whitespace)
    id_match = re.search(r'(Ticket ID|Ticket|ID)\s*:?\s*`?([A-Z0-9\-_]+)`?', content, re.IGNORECASE)
    if id_match:
        meta["id"] = id_match.group(2)
        if "STRY" in meta["id"]:
            meta["type"] = "STRY"

    # Extract State/Status (allowing optional colons and multi-line whitespace)
    state_match = re.search(r'(State|Status)\s*:?\s*`?([A-Za-z_ ]+)`?', content, re.IGNORECASE)
    if state_match:
        meta["state"] = state_match.group(2).strip()

    # Extract Short Description/Title by inspecting the first 10 lines
    lines = content.splitlines()[:10]
    header_content = "\n".join(lines)
    
    # 1. Search for explicit ANTIGRAVITY WORK ORDER or WORK ORDER headings
    match = re.search(r'^#*\s*(?:\*\*\s*)?(?:📡\s*)?(?:ANTIGRAVITY WORK ORDER|WORK ORDER|UAT Work Order):\s*(.*?)(?:\s*\*\*)?$', header_content, re.IGNORECASE | re.MULTILINE)
    if match:
        meta["desc"] = clean_title(match.group(1).strip())
    else:
        # 2. Fall back to the first H1 header in the file
        match_h1 = re.search(r'^#\s*(?:\*\*\s*)?(?:📡\s*)?(.*?)(?:\s*\*\*)?$', header_content, re.MULTILINE)
        if match_h1:
            meta["desc"] = clean_title(match_h1.group(1).strip())
        elif filename:
            # 3. Fall back to cleaning up the filename
            fn_base = os.path.splitext(filename)[0]
            meta["desc"] = clean_title(fn_base.replace("UAT Work Order", "").replace("Work Order", "").replace("_", " ").strip())

    return meta


def log_to_sqlite(meta, filename):
    """
    Maintains ITSM database parity by registering a ticket record.
    """
    if not os.path.exists(DB_PATH):
        print(f"[⚠️] Database not found at canonical path: {DB_PATH}")
        return

    try:
        import uuid
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if ticket already exists by number
        cursor.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ?", (meta["id"],))
        row = cursor.fetchone()
        
        description_text = f"Sovereign Inbox Decision Derby automatically categorized and moved a file.\n\n- File Name: {filename}\n- Source: /home/james/sovereign_inbox/{filename}"
        
        # Determine numeric state for sovereign_tickets
        num_state = 1  # Default to STAGED
        if meta["state"].lower() in ["wip", "work in progress", "open"]:
            num_state = 2
        elif meta["state"].lower() in ["resolved", "closed", "complete"]:
            num_state = 4

        # Determine string state for sys_sdlc_task
        sdlc_state = 'STAGED'
        if meta["state"].lower() in ["wip", "work in progress", "open"]:
            sdlc_state = 'WIP'
        elif meta["state"].lower() in ["resolved", "closed", "complete"]:
            sdlc_state = 'RESOLVED'

        if row:
            sys_id = row[0]
            cursor.execute("""
                UPDATE sovereign_tickets 
                SET type = ?, short_description = ?, description = ?, state = ?, priority = ?, assigned_to = ?, cmdb_ci = ?, work_notes = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (meta["type"], meta["desc"], description_text, num_state, 3, 'james', 'DecisionDerby', f"File semantically classified and updated.", sys_id))
            print(f"  [✔] Updated SQLite ticket: {meta['id']} mapped to {filename}")
        else:
            sys_id = uuid.uuid4().hex
            cursor.execute("""
                INSERT INTO sovereign_tickets 
                  (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (sys_id, meta["id"], meta["type"], meta["desc"], description_text, num_state, 3, 'james', 'DecisionDerby', f"File semantically classified and routed."))
            print(f"  [✔] Logged new SQLite ticket: {meta['id']} mapped to {filename}")

        # Sync/register in sys_sdlc_task
        cursor.execute("SELECT task_id FROM sys_sdlc_task WHERE task_id = ?", (meta["id"],))
        task_row = cursor.fetchone()
        if task_row:
            cursor.execute("""
                UPDATE sys_sdlc_task
                SET task_type = ?, state = ?, short_description = ?
                WHERE task_id = ?
            """, (meta["type"].lower() if meta["type"] == "STRY" else "story", sdlc_state, meta["desc"], meta["id"]))
        else:
            cursor.execute("""
                INSERT INTO sys_sdlc_task (task_id, task_type, state, module_target, short_description)
                VALUES (?, ?, ?, ?, ?)
            """, (meta["id"], meta["type"].lower() if meta["type"] == "STRY" else "story", sdlc_state, 'portal_core', meta["desc"]))
        print(f"  [✔] Synced SDLC task: {meta['id']} in state {sdlc_state}")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"  [❌] Failed database write: {e}")

def organize_file(filepath):
    filename = os.path.basename(filepath)
    
    # 1. Inspect Media Files by MIME/Sig
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type and (mime_type.startswith('image/') or mime_type.startswith('video/')):
        dest = os.path.join(ROUTES["media"], filename)
        shutil.move(filepath, dest)
        print(f"[✔] Classified Media: {filename} -> /media_vault/03_Assets/")
        return

    # 2. Inspect Text/Markdown files semantically
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        category = sniff_text_content(content)
        dest_folder = ROUTES[category]
        dest_path = os.path.join(dest_folder, filename)

        # Move the file
        shutil.move(filepath, dest_path)
        print(f"[✔] Classified {category.upper()}: {filename} -> {os.path.basename(dest_folder)}/")

        # If classified as a ticket or configuration, write ITSM ledger
        if category in ["ticket", "config"]:
            meta = extract_ticket_meta(content, filename)
            log_to_sqlite(meta, filename)

    except Exception as e:
        print(f"[❌] Error parsing {filename}: {e}")

def run_sorting_hat():
    print("[*] Initiating Semantic Sorting Hat Sweep...")
    # Scan inbox directory root
    for entry in os.scandir(INBOX_DIR):
        if entry.is_file():
            # Skip hidden files or system swap files
            if entry.name.startswith('.') or entry.name.endswith('.swp'):
                continue
            organize_file(entry.path)

if __name__ == "__main__":
    run_sorting_hat()