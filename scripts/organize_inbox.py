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
import sys
import time
import shutil
import sqlite3
import fcntl
import mimetypes
import hashlib
from pathlib import Path

def strip_sync_suffix(filename):
    # Matches trailing underscore followed by 4-character hex, e.g. "_c0b4.md" -> ".md"
    return re.sub(r'_[a-fA-F0-9]{4}(\.[a-zA-Z0-9]+)?$', r'\1', filename)

def calculate_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def log_sync_event(status, msg):
    log_path = "/home/james/SovereignOS/logs/sync.log"
    # Ensure directory exists
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    log_line = f"[{timestamp}] [{status}] {msg}\n"
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(log_line)
        # Limit sync.log to 500 lines
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        if len(lines) > 500:
            with open(log_path, "w", encoding="utf-8") as f:
                f.writelines(lines[-500:])
    except Exception as err:
        print(f"Failed to write to sync.log: {err}")

    # Write to sys_sync_log in DB
    if os.path.exists(DB_PATH):
        try:
            import uuid
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS sys_sync_log (sys_id TEXT PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT, event_message TEXT)")
            sys_id = uuid.uuid4().hex
            cursor.execute("INSERT INTO sys_sync_log (sys_id, status, event_message) VALUES (?, ?, ?)", (sys_id, status, msg))
            cursor.execute("DELETE FROM sys_sync_log WHERE sys_id NOT IN (SELECT sys_id FROM sys_sync_log ORDER BY timestamp DESC LIMIT 500)")
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"Failed to write sync event to DB: {db_err}")

def acquire_lock():
    lock_file_path = "/tmp/sovereign_organize_inbox.lock"
    lock_file = open(lock_file_path, "w")
    # Wait up to 10 seconds to acquire the lock if it's currently held
    for _ in range(10):
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return lock_file
        except BlockingIOError:
            time.sleep(1.0)
    print("[*] Another instance of organize_inbox.py is already running. Exiting.")
    sys.exit(0)

# Clio System Directories
INBOX_DIR = "/home/james/sovereign_inbox"
SVR_ROOT = "/home/james/SovereignOS"
DB_PATH = os.path.join(SVR_ROOT, "dna/sovereign_now.db")

# Target Folders inside Inbox Staging
ROUTES = {
    "ticket": os.path.join(INBOX_DIR, "executed"),
    "config": os.path.join(INBOX_DIR, "executed"),
    "walkthrough": os.path.join(INBOX_DIR, "walkthroughs"),
    "implementation_plan": os.path.join(INBOX_DIR, "implementation_plans"),
    "kb": os.path.join(INBOX_DIR, "kb"),
    "report": os.path.join(INBOX_DIR, "reports"),
    "media": os.path.join(SVR_ROOT, "media_vault/03_Assets"),
    "media_transcribe": os.path.join(INBOX_DIR, "media_transcribe")
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
        "ticket": [r"\bticket id\b", r"\bpriority\b", r"\binc\d+\b", r"\bstry\d+\b", r"\bwork order\b", r"\bassigned to\b", r"\bitsm\b"],
        "config": [r"\brecipe\b", r"\bmanifest\b", r"\baesthetic style\b", r"\bflow prompts\b", r"\b3x3 matrix\b", r"\bcoordinate key\b"],
        "walkthrough": [r"\bwalkthrough\b", r"\bchanges made\b", r"\bdefect tracking\b"],
        "implementation_plan": [r"\bimplementation plan\b", r"\bproposed changes\b", r"\bverification plan\b", r"\bimplementation plan specification\b"],
        "kb": [r"\bbackstory\b", r"\bdeep lore\b", r"\bglossary\b", r"\becosystem specification\b", r"\borigin trauma\b", r"\bfeline rescue fund\b", r"\barchitectural blueprint\b", r"\bbase contract\b", r"\bimplementation specification\b", r"\bdesign specification\b", r"\bdesign dossier\b", r"\bknowledge base\b", r"\bstandards\b", r"\bcode quality\b", r"\bdevelopment standards\b"]
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
        "state": None,
        "desc": "Semantically Routed Document"
    }

    # 1. First attempt to parse ticket ID from filename using a flexible, robust pattern
    ticket_id = None
    if filename:
        fn_match = re.search(r'\b((?:STRY|INC|DFCT|ENHC|WO)-[A-Z0-9\-]+|\b(?:STRY|INC|DFCT|ENHC)\d+)\b', filename, re.IGNORECASE)
        if fn_match:
            ticket_id = fn_match.group(1)

    # 2. If filename yields nothing, attempt to find a explicit ticket ID pattern in content
    if not ticket_id:
        content_match = re.search(r'\b((?:STRY|INC|DFCT|ENHC|WO)-[A-Z0-9\-]+|\b(?:STRY|INC|DFCT|ENHC)\d+)\b', content, re.IGNORECASE)
        if content_match:
            ticket_id = content_match.group(1)

    # 3. Fall back to standard ID labels only if no explicit ticket prefix pattern matches
    if not ticket_id:
        id_matches = re.findall(r'\b(Ticket ID|Ticket|ID)\b[\s*:\`]*([A-Z0-9\-_]+)', content, re.IGNORECASE)
        for label, val in id_matches:
            val_upper = val.upper()
            # Ignore SQL type keywords that trigger false positives
            if val_upper in ["BIGSERIAL", "VARCHAR", "PRIMARY", "KEY", "REFERENCES", "INTEGER"]:
                continue
            if any(val_upper.startswith(prefix) for prefix in ["STRY", "INC", "DFCT", "ENHC", "WO-"]) or val_upper.isdigit():
                ticket_id = val
                break

    if ticket_id:
        meta["id"] = ticket_id
        if "STRY" in meta["id"].upper() or meta["id"].upper().startswith("WO-"):
            meta["type"] = "STRY"

    # Extract State/Status (allowing optional colons and multi-line whitespace)
    state_match = re.search(r'\b(State|Status)\s*:\s*`?([A-Za-z_ ]+)`?', content, re.IGNORECASE)
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


def log_to_sqlite(meta, filename, src_path=None, dest_path=None):
    """
    Maintains ITSM database parity by registering a ticket record.
    """
    if not os.path.exists(DB_PATH):
        print(f"[⚠️] Database not found at canonical path: {DB_PATH}")
        return False

    try:
        import uuid
        import hashlib
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if ticket already exists by number
        cursor.execute("SELECT sys_id, state FROM sovereign_tickets WHERE number = ?", (meta["id"],))
        row = cursor.fetchone()
        
        existing_sys_id = row[0] if row else None
        existing_state = row[1] if row else None
        
        # Read the file description
        read_path = src_path or dest_path
        if read_path and os.path.exists(read_path):
            try:
                with open(read_path, 'r', encoding='utf-8', errors='ignore') as wf:
                    description_text = wf.read()
            except Exception as read_err:
                print(f"Failed to read file body: {read_err}")
                description_text = f"Sovereign Inbox Decision Derby automatically categorized and moved a file.\n\n- File Name: {filename}\n- Source: /home/james/sovereign_inbox/{filename}"
        else:
            description_text = f"Sovereign Inbox Decision Derby automatically categorized and moved a file.\n\n- File Name: {filename}\n- Source: /home/james/sovereign_inbox/{filename}"
        
        # Determine numeric state and string state
        if meta["state"] is None:
            if existing_state is not None:
                num_state = existing_state
                # Map numeric state to string state
                if num_state == 2:
                    sdlc_state = 'WIP'
                elif num_state in [4, 5]:
                    sdlc_state = 'RESOLVED'
                else:
                    sdlc_state = 'STAGED'
            else:
                num_state = 1
                sdlc_state = 'STAGED'
        else:
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

        # BOM Preservation Safeguard for all tickets
        if dest_path:
            path_for_stats = src_path or dest_path
            if path_for_stats and os.path.exists(path_for_stats):
                file_size = os.path.getsize(path_for_stats)
                try:
                    with open(path_for_stats, 'rb') as f:
                        md5_hash = hashlib.md5(f.read()).hexdigest()
                except:
                    md5_hash = None
            else:
                file_size = 0
                md5_hash = None

            # Check if attachment already exists
            cursor.execute("""
                SELECT sys_id FROM sys_attachment 
                WHERE table_name = 'work_order_history' AND table_sys_id = ? AND file_name = ?
            """, (sys_id, filename))
            att_row = cursor.fetchone()
            if att_row:
                cursor.execute("""
                    UPDATE sys_attachment 
                    SET file_path = ?, file_size = ?, md5_hash = ?, sys_updated_on = CURRENT_TIMESTAMP
                    WHERE sys_id = ?
                """, (dest_path, file_size, md5_hash, att_row[0]))
                print(f"  [✔] Updated work_order_history attachment for {meta['id']}")
            else:
                att_sys_id = uuid.uuid4().hex
                cursor.execute("""
                    INSERT INTO sys_attachment (sys_id, table_name, table_sys_id, file_name, content_type, file_path, file_size, md5_hash, sys_updated_on)
                    VALUES (?, 'work_order_history', ?, ?, 'text/markdown', ?, ?, ?, CURRENT_TIMESTAMP)
                """, (att_sys_id, sys_id, filename, dest_path, file_size, md5_hash))
                print(f"  [✔] Created work_order_history attachment for {meta['id']}")

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"  [❌] Failed database write: {e}")
        return False

def clean_title_slug(title):
    import re
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9]+', '_', slug)
    slug = slug.strip('_')
    return slug

def register_kb_file(filepath, filename):
    """
    Registers a KB markdown file by creating a structured knowledge item directory
    under KNOWLEDGE_DIR so that sync_knowledge_rules can pick it up.
    Also registers it in the SQLite kb_knowledge table and exports it to dna/docs/.
    """
    try:
        import json
        import hashlib
        from datetime import datetime
        import uuid
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        content = content.lstrip("\ufeff")
        
        # 1. Parse Title
        title = None
        for line in content.splitlines()[:5]:
            if line.strip().startswith("#"):
                title = line.strip().lstrip("#").strip()
                break
        if not title:
            # Fall back to first non-empty line
            for line in content.splitlines()[:5]:
                if line.strip():
                    title = line.strip()
                    break
        if not title:
            # Fall back to cleaned filename
            if filename:
                title = os.path.splitext(filename)[0].replace("_", " ").strip()
        if not title:
            title = "Untitled Knowledge Item"
        
        # 2. Parse Document ID / Rule ID
        doc_id_match = re.search(r'\b(Document ID|Doc ID|ID)\b[\s*:\`]*([A-Za-z0-9\-_]+)', content, re.IGNORECASE)
        if doc_id_match:
            doc_id = doc_id_match.group(2).strip().lower().replace("-", "_")
        else:
            # Generate a short hash based on title
            doc_id = "gen_" + hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
            
        # 3. Create Slug
        clean_title = clean_title_slug(title)
        dir_name = f"ki_{doc_id}_{clean_title}"
        dir_name = dir_name[:100]
        
        # 4. Create target directory structure
        ki_dir = os.path.join("/home/james/.gemini/antigravity/knowledge", dir_name)
        artifacts_dir = os.path.join(ki_dir, "artifacts")
        os.makedirs(artifacts_dir, exist_ok=True)
        
        # 5. Extract Summary
        summary = "No summary provided."
        summary_match = re.search(r'##\s*(?:1\.\s*)?(?:Executive Summary|Summary|Diagnostic)[\s\S]*?(?=##|\Z)', content, re.IGNORECASE)
        if summary_match:
            summary_text = summary_match.group(0).strip()
            summary_lines = [l for l in summary_text.splitlines() if not l.strip().startswith("#") and l.strip()]
            if summary_lines:
                summary = " ".join(summary_lines[:3])[:200] + "..."
                
        # 6. Write metadata.json
        metadata = {
            "summary": summary,
            "ArtifactType": "rule",
            "references": []
        }
        with open(os.path.join(ki_dir, "metadata.json"), 'w') as f:
            json.dump(metadata, f, indent=2)
            
        # 7. Write timestamps.json
        timestamps = {
            "created": datetime.now().isoformat() + "Z",
            "updated": datetime.now().isoformat() + "Z"
        }
        with open(os.path.join(ki_dir, "timestamps.json"), 'w') as f:
            json.dump(timestamps, f, indent=2)
            
        # 8. Copy file contents as rule.md
        with open(os.path.join(artifacts_dir, "rule.md"), 'w') as f:
            f.write(content)
            
        print(f"  [✔] Registered Knowledge Item: {dir_name}")

        # Also register in SQLite kb_knowledge table for the web UI
        if os.path.exists(DB_PATH):
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Check if this article (matched by topic) already exists in kb_knowledge
            c.execute("SELECT sys_id, number FROM kb_knowledge WHERE topic = ?", (title,))
            kb_row = c.fetchone()
            
            if kb_row:
                kb_sys_id, kb_number = kb_row
                c.execute("""
                    UPDATE kb_knowledge
                    SET text = ?, short_description = ?, sys_updated_on = CURRENT_TIMESTAMP
                    WHERE sys_id = ?
                """, (content, summary, kb_sys_id))
                print(f"  [✔] Updated KB Article in DB: {kb_number}")
            else:
                # Find the next sequential KB number
                c.execute("SELECT number FROM kb_knowledge WHERE number LIKE 'KB%'")
                numbers = [r[0] for r in c.fetchall()]
                max_num = 1000
                for num in numbers:
                    try:
                        val = int(num.replace("KB", ""))
                        if val > max_num:
                            max_num = val
                    except ValueError:
                        pass
                kb_number = f"KB{max_num + 1:04d}"
                
                # Check filename or content for a custom KB number
                filename_kb_match = re.match(r'^(KB\d+)', filename, re.IGNORECASE)
                if filename_kb_match:
                    kb_number = filename_kb_match.group(1).upper()
                else:
                    content_kb_match = re.search(r'\b(?:ARTICLE ID|KB ID|ID)\b[\s*:\`]*(KB\d+)', content, re.IGNORECASE)
                    if content_kb_match:
                        kb_number = content_kb_match.group(1).upper()
                
                kb_sys_id = f"sys_kb_{uuid.uuid4().hex}"
                
                c.execute("""
                    INSERT INTO kb_knowledge (sys_id, number, topic, short_description, text, workflow_state, u_source, u_tags)
                    VALUES (?, ?, ?, ?, ?, 'published', 'system_operations', 'sync-standards')
                """, (kb_sys_id, kb_number, title, summary, content))
                print(f"  [✔] Registered new KB Article in DB: {kb_number}")
            
            conn.commit()
            conn.close()
            
            # Sync to filesystem under dna/docs/ so the two-way sync is aligned
            try:
                docs_dir = "/home/james/SovereignOS/dna/docs"
                os.makedirs(docs_dir, exist_ok=True)
                
                # Remove any old file for this KB
                for fn in os.listdir(docs_dir):
                    if fn.startswith(f"{kb_number}_") and fn.endswith(".md"):
                        try:
                            os.remove(os.path.join(docs_dir, fn))
                        except Exception:
                            pass
                            
                safe_topic = re.sub(r'[^a-zA-Z0-9\s]', '', title)
                safe_topic = re.sub(r'\s+', '_', safe_topic).strip().upper()
                doc_filename = f"{kb_number}_{safe_topic}.md"
                doc_path = os.path.join(docs_dir, doc_filename)
                
                doc_content = f"# {title}\n\n**Article ID:** {kb_number}  \n**Last Synchronized:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n\n{content}"
                with open(doc_path, "w", encoding="utf-8") as df:
                    df.write(doc_content)
                print(f"  [✔] Wrote KB doc to filesystem: {doc_filename}")
            except Exception as fs_err:
                print(f"  [❌] Failed to sync KB to filesystem: {fs_err}")
                
    except Exception as e:
        print(f"  [❌] Failed to register KB file: {e}")

def is_blacklisted_path(filepath):
    abs_path = os.path.abspath(filepath)
    parts = abs_path.split(os.sep)
    blacklist_dirs = {"node_modules", "dist", ".git", ".venv", ".next", ".turbo", "build", "out"}
    blacklist_files = {".DS_Store", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "today.tmp", "yesterday.tmp"}
    
    for part in parts:
        if part in blacklist_dirs:
            return True
            
    filename = os.path.basename(filepath)
    if filename in blacklist_files or filename.endswith(".swp"):
        return True
        
    return False

def parse_multi_work_orders(content):
    """
    Scans content for multiple work order sections starting with WO-xxxx-xxxx or STRYxxxx etc.
    Returns a list of dictionaries with {id, desc, content}.
    """
    pattern = re.compile(r'^(WO-\d+-\d+|STRY\d+|INC\d+|DFCT\d+)(?:\s*:\s*(.*))?$', re.MULTILINE)
    matches = list(pattern.finditer(content))
    if not matches:
        return []
        
    tickets = []
    for i, match in enumerate(matches):
        ticket_id = match.group(1)
        title = match.group(2) or "Work Order Details"
        
        # Calculate the end of this work order block
        start_idx = match.start()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        block_content = content[start_idx:end_idx].strip()
        tickets.append({
            "id": ticket_id,
            "desc": title.strip(),
            "content": block_content
        })
    return tickets

def process_and_log_multi_work_orders(content, filename, filepath):
    """
    Extracts multiple work orders from content and registers them in the database.
    """
    work_orders = parse_multi_work_orders(content)
    if not work_orders:
        return False
        
    print(f"[*] Found {len(work_orders)} work orders in {filename}. Registering...")
    
    success = True
    for wo in work_orders:
        wo_id = wo["id"]
        wo_desc = wo["desc"]
        wo_content = wo["content"]
        
        # Determine ticket type (default to STRY for WO-)
        wo_type = "STRY"
        if "INC" in wo_id.upper():
            wo_type = "INC"
        elif "DFCT" in wo_id.upper():
            wo_type = "DFCT"
        elif "ENHC" in wo_id.upper():
            wo_type = "ENHC"
            
        meta = {
            "id": wo_id,
            "type": wo_type,
            "state": "STAGED",
            "desc": wo_desc
        }
        
        # Write sub-work-order to a separate file under executed/
        sub_filename = f"{wo_id}.md"
        sub_dest_path = os.path.join(ROUTES["ticket"], sub_filename)
        
        try:
            with open(sub_dest_path, "w", encoding="utf-8") as sf:
                sf.write(wo_content)
            print(f"  [✔] Wrote sub-work-order file: {sub_filename}")
        except Exception as file_err:
            print(f"  [❌] Failed to write sub-work-order file {sub_filename}: {file_err}")
            sub_dest_path = filepath
            
        # Log to SQLite and sync with sys_sdlc_task
        db_success = log_to_sqlite(meta, sub_filename, src_path=None, dest_path=sub_dest_path)
        success = success and db_success
        
    return success

def organize_file(filepath):
    # Enforce strict path-based blacklisting
    if is_blacklisted_path(filepath):
        return

    # Skip directories and symlinks to prevent parsing/moving issues (e.g. broken links)
    if os.path.islink(filepath) or os.path.isdir(filepath):
        return

    filename = os.path.basename(filepath)
    filename = strip_sync_suffix(filename)
    filename_lower = filename.lower()
    
    # 1. Inspect Media Files by MIME/Sig/Extension
    mime_type, _ = mimetypes.guess_type(filepath)
    _, ext = os.path.splitext(filename_lower)
    
    transcribe_extensions = {'.mp3', '.m4a', '.mp4', '.wav', '.webm', '.aac', '.flac', '.ogg', '.mov', '.avi', '.mkv'}
    is_transcribe_mime = mime_type and (mime_type.startswith('audio/') or mime_type.startswith('video/'))
    is_transcribe_ext = ext in transcribe_extensions
    
    if is_transcribe_mime or is_transcribe_ext:
        dest = os.path.join(ROUTES["media_transcribe"], filename)
        shutil.move(filepath, dest)
        print(f"[✔] Classified Media for Transcription: {filename} -> /sovereign_inbox/media_transcribe/")
        return
        
    if mime_type and mime_type.startswith('image/'):
        dest = os.path.join(ROUTES["media"], filename)
        shutil.move(filepath, dest)
        print(f"[✔] Classified Image: {filename} -> /media_vault/03_Assets/")
        return

    # 2. Inspect Text/Markdown files semantically
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        content = content.lstrip("\ufeff")

        # Normalize filename by replacing separators with spaces for clean word boundary matching
        normalized_name = filename_lower.replace('_', ' ').replace('-', ' ')
        has_kb_keyword = re.search(r'\b(kb|lore|spec|specification|knowledge|standards?)\b', normalized_name) is not None
        _, ext = os.path.splitext(filename_lower)
        is_doc_ext = ext in ['.md', '.txt']

        # Check for tags or filenames that suggest this is a document/reference/omnibus
        has_ignore_tag = any(tag in content for tag in ["[Ignore-Ticket]", "Ignore-Ticket: true", "[Doc]", "[Reference]", "[Omnibus]"])
        has_plural_wo = "work orders" in filename_lower or "omnibus" in filename_lower
        
        # Check if file has multiple work orders
        work_orders = parse_multi_work_orders(content)
        has_multiple_wos = len(work_orders) > 1
        
        is_omnibus = has_ignore_tag or has_plural_wo or has_multiple_wos

        # Prioritize filename-based classification
        if "walkthrough" in filename_lower:
            category = "walkthrough"
        elif "implementation_plan" in filename_lower or "implementationplan" in filename_lower or "implementation plan" in filename_lower:
            category = "implementation_plan"
        elif "report" in filename_lower:
            category = "report"
        elif "config" in filename_lower or "recipe" in filename_lower:
            category = "config"
        elif any(filename_lower.startswith(p) for p in ["wo-", "stry", "inc", "dfct", "enhc"]):
            category = "ticket"
        elif is_doc_ext and (has_kb_keyword or re.match(r'^kb\d+', filename_lower)):
            category = "kb"
        else:
            category = sniff_text_content(content)
            # Failsafe: restrict kb classification strictly to document extensions
            if category == "kb" and not is_doc_ext:
                category = "report"
            
        # Override for omnibus/container/reference files
        if is_omnibus and category in ["ticket", "config"]:
            category = "implementation_plan"

        dest_folder = ROUTES[category]
        dest_path = os.path.join(dest_folder, filename)

        if category == "kb":
            file_hash = calculate_file_hash(filepath)
            title = None
            for line in content.splitlines()[:5]:
                if line.strip().startswith("#"):
                    title = line.strip().lstrip("#").strip()
                    break
            if not title:
                for line in content.splitlines()[:5]:
                    if line.strip():
                        title = line.strip()
                        break
            if not title:
                title = os.path.splitext(filename)[0].replace("_", " ").strip()
                
            stripped_title = strip_sync_suffix(title)
            
            is_duplicate = False
            if os.path.exists(DB_PATH):
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT text, topic FROM kb_knowledge")
                rows = c.fetchall()
                for db_text, db_topic in rows:
                    if db_text:
                        db_hash = hashlib.sha256(db_text.encode('utf-8', errors='ignore')).hexdigest()
                        if db_hash == file_hash:
                            is_duplicate = True
                            break
                    if db_topic:
                        db_topic_stripped = strip_sync_suffix(db_topic)
                        if db_topic_stripped.lower() == stripped_title.lower() or db_topic.lower() == stripped_title.lower():
                            is_duplicate = True
                            break
                conn.close()
                
            if is_duplicate:
                print(f"[DEDUPLICATED] Skipping duplicate KB article '{filename}' (hash: {file_hash[:8]})")
                log_sync_event("success", f"[DEDUPLICATED] Skipped duplicate KB article: {filename}")
                try:
                    os.remove(filepath)
                    print(f"  [✔] Deleted redundant file: {filename}")
                except Exception as del_err:
                    print(f"  [❌] Failed to delete redundant file {filename}: {del_err}")
                return

        # If classified as a ticket or configuration, write ITSM ledger FIRST
        db_success = True
        if category in ["ticket", "config"]:
            meta = extract_ticket_meta(content, filename)
            db_success = log_to_sqlite(meta, filename, src_path=filepath, dest_path=dest_path)
            
        # Process and log individual sub-work-orders if this is an omnibus file containing multiple work orders
        if has_multiple_wos:
            db_success = process_and_log_multi_work_orders(content, filename, filepath) and db_success

        # Move the file ONLY if database write succeeded (or if it wasn't a database-backed file type)
        if db_success:
            shutil.move(filepath, dest_path)
            success_msg = f"Classified {category.upper()}: {filename} -> {os.path.basename(dest_folder)}/"
            print(f"[✔] {success_msg}")
            log_sync_event("success", success_msg)
            if category == "kb":
                register_kb_file(dest_path, filename)
        else:
            fail_msg = f"Retaining file in inbox due to DB write failure: {filename}"
            print(f"[❌] {fail_msg}")
            log_sync_event("error", fail_msg)

    except Exception as e:
        err_msg = f"Error parsing {filename}: {e}"
        print(f"[❌] {err_msg}")
        log_sync_event("error", err_msg)

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
    # Acquire exclusive process lock to prevent concurrent execution races
    lock_file = acquire_lock()
    log_sync_event("success", "Decision Derby sweep initiated.")
    print("[*] Initiating Semantic Sorting Hat Sweep...")
    # Execute pending migrations
    try:
        import sys
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.append(scripts_dir)
        import sovereign_migrator
        print("[*] Checking for pending database migrations...")
        sovereign_migrator.run_migrations()
    except Exception as mig_err:
        print(f"[❌] Database migration execution failed: {mig_err}")

    # Scan root of inbox directory only (no recursion into subfolders or project dirs)
    for entry in os.scandir(INBOX_DIR):
        if is_blacklisted_path(entry.path):
            continue
        if entry.is_file():
            if entry.name.startswith('.') or entry.name.endswith('.swp'):
                continue
            organize_file(entry.path)
            
    # Perform wireframe validation check
    validate_wireframes()

if __name__ == "__main__":
    run_sorting_hat()