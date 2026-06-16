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
    "implementation_plan": os.path.join(INBOX_DIR, "implementation_plans"),
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
        "implementation_plan": 0,
        "kb": 0
    }

    # Keyword weights for semantic matching
    keywords = {
        "ticket": [r"ticket id", r"\bpriority\b", r"inc\d+", r"stry\d+", r"work order", r"assigned to", r"itsm"],
        "config": [r"recipe", r"manifest", r"aesthetic style", r"flow prompts", r"3x3 matrix", r"coordinate key"],
        "walkthrough": [r"walkthrough", r"changes made", r"defect tracking"],
        "implementation_plan": [r"implementation plan", r"proposed changes", r"verification plan", r"implementation plan specification"],
        "kb": [r"backstory", r"deep lore", r"glossary", r"ecosystem specification", r"origin trauma", r"feline rescue fund", r"architectural blueprint", r"base contract", r"implementation specification", r"design specification", r"design dossier"]
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
    content = content.lstrip("\ufeff")
    import hashlib
    h = hashlib.md5(content.encode('utf-8', errors='ignore')).hexdigest()
    meta = {
        "id": "INC" + str(int(h, 16) % 10000000),
        "type": "INC",
        "state": "STAGED",
        "desc": "Semantically Routed Document"
    }

    # Extract ID (allowing formatting characters like * and colons in between)
    id_matches = re.findall(r'\b(Ticket ID|Ticket|ID)\b[\s*:\`]*([A-Z0-9\-_]+)', content, re.IGNORECASE)
    ticket_id = None
    for label, val in id_matches:
        val_upper = val.upper()
        if any(val_upper.startswith(prefix) for prefix in ["STRY", "INC", "DFCT", "ENHC", "WO-"]) or val_upper.isdigit():
            ticket_id = val
            break
            
    # Check filename first if content didn't yield a valid ticket ID format
    if not ticket_id and filename:
        fn_match = re.search(r'\b(STRY\d+|INC\d+|DFCT\d+|ENHC\d+|WO-\d+-\d+(?:-[A-Z0-9\-]+)?)(?=\b|_)', filename, re.IGNORECASE)
        if fn_match:
            ticket_id = fn_match.group(1)

    if not ticket_id and id_matches:
        # Fall back to first match only if it doesn't look like common words and has minimum length
        val = id_matches[0][1]
        val_upper = val.upper()
        if len(val) >= 4 and val_upper not in ["ENTIFIED", "GETS", "GING", "EO", "S", "EBAR", "ATION", "UAL"]:
            ticket_id = val
        
    if ticket_id:
        meta["id"] = ticket_id
        if "STRY" in meta["id"]:
            meta["type"] = "STRY"

    # Extract State/Status (allowing optional colons and multi-line whitespace)
    state_match = re.search(r'(State|Status)\s*:?\s*`?([A-Za-z_ ]+)`?', content, re.IGNORECASE)
    if state_match:
        meta["state"] = state_match.group(2).strip()

    # Extract Short Description/Title by inspecting the first 10 lines
    lines = content.splitlines()[:10]
    
    true_title = None
    # 1. Scan for explicit WORK ORDER keyword in the first few lines
    for line in lines:
        if "WORK ORDER:" in line.upper():
            parts = re.split(r'WORK ORDER:', line, flags=re.IGNORECASE)
            if len(parts) > 1:
                true_title = parts[1].replace("**", "").replace("*", "").strip()
                break
                
    if not true_title:
        # 2. Fall back to the first H1 header in the file
        for line in lines:
            if line.strip().startswith("#"):
                true_title = line.strip().lstrip("#").replace("**", "").replace("*", "").strip()
                break
            
    if true_title:
        meta["desc"] = clean_title(true_title.strip())
    elif filename:
        # 3. Fall back to filename
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
    filename_lower = filename.lower()
    
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
        content = content.lstrip("\ufeff")

        # Prioritize filename-based classification
        if "walkthrough" in filename_lower:
            category = "walkthrough"
        elif "implementation_plan" in filename_lower or "implementationplan" in filename_lower or "implementation plan" in filename_lower:
            category = "implementation_plan"
        elif "report" in filename_lower:
            category = "report"
        elif "config" in filename_lower or "recipe" in filename_lower:
            category = "config"
        elif "kb" in filename_lower or "lore" in filename_lower or "spec" in filename_lower or "specification" in filename_lower:
            category = "kb"
        elif any(filename_lower.startswith(p) for p in ["wo-", "stry", "inc", "dfct", "enhc"]):
            category = "ticket"
        else:
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

import zipfile

def freeze_frontend_tasks():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE sys_sdlc_task SET state = 'FROZEN' WHERE module_target = 'portal_core' AND state != 'RESOLVED';")
        conn.commit()
        conn.close()
        print("[✔] Frontend SDLC tasks frozen due to ingress validation failure.")
    except Exception as e:
        print(f"Failed to freeze tasks: {e}")

def validate_project_schema(project_path):
    required_dirs = [
        "design_dossier",
        "upstream_v0_source",
        "local_clio_patch"
    ]
    for d in required_dirs:
        if not os.path.isdir(os.path.join(project_path, d)):
            return False
    return True

def process_wireframe_zip(zip_path):
    project_name = Path(zip_path).stem
    project_dir = os.path.join(os.path.dirname(zip_path), project_name)
    os.makedirs(project_dir, exist_ok=True)
    
    design_dossier_dir = os.path.join(project_dir, "design_dossier")
    upstream_v0_dir = os.path.join(project_dir, "upstream_v0_source")
    local_clio_dir = os.path.join(project_dir, "local_clio_patch")
    
    os.makedirs(design_dossier_dir, exist_ok=True)
    os.makedirs(upstream_v0_dir, exist_ok=True)
    os.makedirs(local_clio_dir, exist_ok=True)
    
    os.makedirs(os.path.join(upstream_v0_dir, "components"), exist_ok=True)
    os.makedirs(os.path.join(upstream_v0_dir, "config"), exist_ok=True)
    os.makedirs(os.path.join(upstream_v0_dir, "styles"), exist_ok=True)
    
    import tempfile
    temp_extract_dir = tempfile.mkdtemp(prefix=f"zip_extract_{project_name}")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
            
        for root, dirs, files in os.walk(temp_extract_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Determine destination
                if file.endswith("styles.ts") or file.endswith("styles.js") or "styles" in file.lower():
                    dest = os.path.join(upstream_v0_dir, "styles", file)
                elif file.endswith(".tsx") or file.endswith(".jsx"):
                    dest = os.path.join(upstream_v0_dir, "components", file)
                elif file.endswith(".json") or file.endswith(".mjs") or file.endswith(".config.js") or "config" in file.lower():
                    dest = os.path.join(upstream_v0_dir, "config", file)
                elif file == "layout_mock.png" or file.endswith(".png") or file.endswith(".jpg"):
                    dest = os.path.join(design_dossier_dir, file)
                elif file == "spec_prompt.md" or file.endswith(".md"):
                    dest = os.path.join(design_dossier_dir, file)
                elif file.endswith(".patch") or file.endswith(".diff"):
                    dest = os.path.join(local_clio_dir, file)
                else:
                    dest = os.path.join(upstream_v0_dir, "components", file)
                
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                shutil.copy2(file_path, dest)
                
        os.remove(zip_path)
        print(f"[✔] Automatically decomposed zip structure for {project_name}")
        
    except Exception as e:
        print(f"[❌] Failed to decompose zip {zip_path}: {e}")
    finally:
        shutil.rmtree(temp_extract_dir, ignore_errors=True)

def validate_wireframes():
    wire_frames_dir = "/home/james/sovereign_inbox/tickets/wire_frames"
    if not os.path.exists(wire_frames_dir):
        os.makedirs(wire_frames_dir, exist_ok=True)
        return
        
    failsafe_triggered = False
    for entry in os.scandir(wire_frames_dir):
        if entry.is_file():
            if entry.name.startswith('.'):
                continue
            if entry.name.endswith('.zip'):
                process_wireframe_zip(entry.path)
            else:
                failsafe_triggered = True
        elif entry.is_dir():
            if not validate_project_schema(entry.path):
                failsafe_triggered = True
                
    if failsafe_triggered:
        print("[INGRESS FAILSAFE]: Structured UI directories missing. Aborting deployment to port 3016 to prevent drift.")
        freeze_frontend_tasks()

def run_sorting_hat():
    print("[*] Initiating Semantic Sorting Hat Sweep...")
    # Scan inbox directory root
    for entry in os.scandir(INBOX_DIR):
        if entry.is_file():
            # Skip hidden files or system swap files
            if entry.name.startswith('.') or entry.name.endswith('.swp'):
                continue
            organize_file(entry.path)
            
    # Perform wireframe validation check
    validate_wireframes()

if __name__ == "__main__":
    run_sorting_hat()