"""
Sovereign SDLC Portal — Local ticket management for Apiary fleet.
Serves on port 8095. Reads/writes sovereign_now.db (rm_story mapping).
"""
import sqlite3
import json
import uuid
import re
import markdown
import os
import shutil
from datetime import datetime
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
INBOX_PATH = "/home/james/sovereign_inbox"

if not os.path.exists(INBOX_PATH):
    os.makedirs(INBOX_PATH)

def resolve_attachment_path(filename: str):
    paths_to_check = [
        os.path.join(INBOX_PATH, filename),
        os.path.join(INBOX_PATH, "archive_graveyard", filename),
        os.path.join(INBOX_PATH, "processed", filename),
        os.path.join(INBOX_PATH, "needs_review", filename),
        os.path.join(INBOX_PATH, "tickets", filename),
        os.path.join(INBOX_PATH, "reports", filename),
        os.path.join(INBOX_PATH, "dashboards", filename),
    ]
    for p in paths_to_check:
        if os.path.exists(p):
            return p
    if os.path.exists(INBOX_PATH):
        for entry in os.listdir(INBOX_PATH):
            if entry.startswith("daily_"):
                p = os.path.join(INBOX_PATH, entry, filename)
                if os.path.exists(p):
                    return p
    return None

app = FastAPI(title="Sovereign SDLC Portal", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Removed StaticFiles mount to use custom route below

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn

def map_ticket_type(t_type_db):
    if not t_type_db:
        return "STORY"
    s = t_type_db.strip().upper()
    if s == "STRY": return "STORY"
    if s == "INC": return "INCIDENT"
    if s == "DFCT": return "BUG"
    if s == "ENHC": return "ENHANCEMENT"
    return s

def reverse_map_ticket_type(t_type_ui):
    if not t_type_ui:
        return "STRY"
    s = t_type_ui.strip().upper()
    if s in ("STORY", "STRY"): return "STRY"
    if s in ("INCIDENT", "INC"): return "INC"
    if s in ("BUG", "DEFECT", "DFCT"): return "DFCT"
    if s in ("ENHANCEMENT", "ENHC"): return "ENHC"
    return "STRY"

def map_state(state_int):
    if state_int is None:
        return "OPEN"
    s = str(state_int).strip().upper()
    if s in ("5", "CLOSED"): return "CLOSED"
    if s in ("4", "RESOLVED", "DONE"): return "DONE"
    if s in ("3", "TESTING"): return "TESTING"
    if s in ("2", "IN_PROGRESS"): return "IN_PROGRESS"
    if s in ("1", "OPEN"): return "OPEN"
    if s in ("0", "PLANNING"): return "PLANNING"
    return s

def reverse_map_state(status_str):
    if not status_str:
        return 1
    s = str(status_str).strip().upper()
    if s == "CLOSED": return 5
    if s in ("DONE", "RESOLVED"): return 4
    if s == "TESTING": return "Testing"
    if s == "IN_PROGRESS": return 2
    if s == "OPEN": return 1
    if s == "PLANNING": return 0
    return 1

def map_priority(p_int):
    if str(p_int) == "1": return "P1"
    if str(p_int) == "2": return "P2"
    if str(p_int) == "3": return "P3"
    return "P3"

def reverse_map_priority(p_str):
    if p_str == "P1": return 1
    if p_str == "P2": return 2
    if p_str == "P3": return 3
    return 3

# ── API ROUTES ──────────────────────────────────────────────

@app.get("/attachments/{filename:path}")
def serve_attachment(filename: str):
    p = resolve_attachment_path(filename)
    if p:
        return FileResponse(p)
    return JSONResponse({"detail": "Not Found"}, status_code=404)

@app.get("/home/james/sovereign_inbox/{filename:path}")
def serve_absolute_inbox(filename: str):
    p = os.path.join(INBOX_PATH, filename)
    if os.path.exists(p) and p.startswith(INBOX_PATH):
        return FileResponse(p)
    return JSONResponse({"detail": "Not Found"}, status_code=404)

@app.get("/api/cmdb_ci")
def get_cmdb_ci(sys_class_name: str = None):
    conn = get_db()
    if sys_class_name:
        rows = conn.execute("SELECT sys_id, name, sys_class_name, short_description FROM cmdb_ci WHERE sys_class_name = ? ORDER BY name", (sys_class_name,)).fetchall()
    else:
        rows = conn.execute("SELECT sys_id, name, sys_class_name, short_description FROM cmdb_ci WHERE sys_class_name IN ('cmdb_ci_service', 'cmdb_ci_hardware', 'cmdb_ci_garden') ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/tickets/{ticket_id}/attachments")
def list_attachments(ticket_id: str):
    conn = get_db()
    sys_id = ticket_id
    t_row = conn.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ? OR sys_id = ?", (ticket_id, ticket_id)).fetchone()
    if t_row:
        sys_id = t_row['sys_id']
    rows = conn.execute("""
        SELECT sys_id, file_name, content_type, file_path, sys_created_on 
        FROM sys_attachment 
        WHERE table_name = 'sovereign_tickets' AND (table_sys_id = ? OR table_sys_id = ?)
    """, (sys_id, ticket_id)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/tickets/{ticket_id}/attachments")
async def upload_attachment(ticket_id: str, file: UploadFile = File(...)):
    filename = file.filename
    ext = os.path.splitext(filename)[1]
    sys_id = uuid.uuid4().hex
    new_filename = f"{sys_id}{ext}"
    filepath = os.path.join(INBOX_PATH, new_filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    conn = get_db()
    t_sys_id = ticket_id
    t_row = conn.execute("SELECT sys_id FROM sovereign_tickets WHERE number = ? OR sys_id = ?", (ticket_id, ticket_id)).fetchone()
    if t_row:
        t_sys_id = t_row['sys_id']
        
    conn.execute("""
        INSERT OR IGNORE INTO sys_attachment (sys_id, table_name, table_sys_id, file_name, content_type, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (sys_id, 'sovereign_tickets', t_sys_id, filename, file.content_type, f"/attachments/{new_filename}"))
    conn.commit()
    conn.close()
    
    # Automate archiving/decluttering of walkthroughs from root inbox to tickets/ subfolder
    local_source = os.path.join(INBOX_PATH, filename)
    if os.path.exists(local_source) and os.path.isfile(local_source):
        tickets_dir = os.path.join(INBOX_PATH, "tickets")
        if not os.path.exists(tickets_dir):
            try:
                os.makedirs(tickets_dir)
            except:
                pass
        local_dest = os.path.join(tickets_dir, filename)
        try:
            shutil.move(local_source, local_dest)
        except Exception as e:
            print(f"Error moving walkthrough file: {e}")
            
    return {"sys_id": sys_id, "file_name": filename, "url": f"/attachments/{new_filename}"}

@app.delete("/api/tickets/{ticket_id}/attachments/{sys_id}")
def delete_attachment(ticket_id: str, sys_id: str):
    conn = get_db()
    row = conn.execute("SELECT file_path FROM sys_attachment WHERE sys_id = ?", (sys_id,)).fetchone()
    if row:
        file_path = row['file_path']
        filename = file_path.replace('/attachments/', '')
        full_path = resolve_attachment_path(filename)
        if full_path and os.path.exists(full_path):
            try:
                os.remove(full_path)
            except:
                pass
    conn.execute("DELETE FROM sys_attachment WHERE sys_id = ?", (sys_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": sys_id}

@app.get("/api/tickets")
def list_tickets(status: str = None, priority: str = None):
    conn = get_db()
    query = """
        SELECT sys_id, number as id, type, parent_sys_id, short_description as title, 
               description, work_notes, state as state_int, priority as p_int, 
               assigned_to, cmdb_ci as affected_ci, sys_created_on as created_at, 
               sys_updated_on as updated_at 
        FROM sovereign_tickets 
        ORDER BY created_at DESC
    """
    rows = conn.execute(query).fetchall()
    
    results = []
    for r in rows:
        d = dict(r)
        d['status'] = map_state(d['state_int'])
        d['priority'] = map_priority(d['p_int'])
        d['ticket_type'] = map_ticket_type(d['type'])
        
        # Filter if requested
        if status and status != 'ALL' and d['status'] != status:
            continue
        if priority and priority != 'ALL' and d['priority'] != priority:
            continue
            
        results.append(d)
        
    conn.close()
    return results

@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    conn = get_db()
    row = conn.execute("""
        SELECT sys_id, number as id, type, parent_sys_id, short_description as title, 
               description, work_notes, state as state_int, priority as p_int, 
               assigned_to, cmdb_ci as affected_ci, sys_created_on as created_at, 
               sys_updated_on as updated_at 
        FROM sovereign_tickets 
        WHERE number = ? OR sys_id = ?
    """, (ticket_id, ticket_id)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['status'] = map_state(d['state_int'])
        d['priority'] = map_priority(d['p_int'])
        d['ticket_type'] = map_ticket_type(d['type'])
        return d
    return JSONResponse({"error": "Not found"}, status_code=404)

@app.get("/api/tickets/{ticket_id}/export")
def export_ticket(ticket_id: str):
    conn = get_db()
    row = conn.execute("""
        SELECT sys_id, number as id, type, parent_sys_id, short_description as title, 
               description, work_notes, state as state_int, priority as p_int, 
               assigned_to, cmdb_ci as affected_ci, sys_created_on as created_at, 
               sys_updated_on as updated_at 
        FROM sovereign_tickets 
        WHERE number = ? OR sys_id = ?
    """, (ticket_id, ticket_id)).fetchone()
    
    if not row:
        conn.close()
        return JSONResponse({"error": "Ticket not found"}, status_code=404)
        
    d = dict(row)
    t_num = d['id']
    t_sys_id = d['sys_id']
    title = d['title'] or "Untitled Ticket"
    t_type = map_ticket_type(d['type'])
    status = map_state(d['state_int'])
    priority = map_priority(d['p_int'])
    assigned = d['assigned_to'] or "Unassigned"
    affected_ci = d['affected_ci'] or "None"
    created = d['created_at'] or "Unknown"
    updated = d['updated_at'] or "Unknown"
    desc = d['description'] or "*No description provided.*"
    work = d['work_notes'] or "*No work notes.*"
    
    # Fetch attachments
    att_rows = conn.execute("""
        SELECT file_name, file_path 
        FROM sys_attachment 
        WHERE table_name = 'sovereign_tickets' AND (table_sys_id = ? OR table_sys_id = ?)
    """, (t_sys_id, ticket_id)).fetchall()
    conn.close()
    
    att_list = ""
    if att_rows:
        for att in att_rows:
            att_list += f"- [{att['file_name']}]({att['file_path']})\n"
    else:
        att_list = "*No attachments.*"
        
    md_content = f"""# [{t_num}] {title}

| Attribute | Value |
| --- | --- |
| **Type** | {t_type} |
| **Status** | {status} |
| **Priority** | {priority} |
| **Assigned To** | {assigned} |
| **Affected CI** | {affected_ci} |
| **Created** | {created} |
| **Updated** | {updated} |

---

## 📝 Description

{desc}

---

## 📓 Work Notes

{work}

---

## 📎 Attachments

{att_list}
"""
    
    from fastapi.responses import Response
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={t_num}_export.md"}
    )

def resolve_markdown_images(md_text: str, attachments: list) -> str:
    name_map = {}
    for att in attachments:
        base_name = os.path.basename(att['file_name'])
        name_map[base_name] = att['file_path']
        name_map[att['file_name']] = att['file_path']
        name_map[att['file_name'].lower()] = att['file_path']
        name_map[base_name.lower()] = att['file_path']

    def replace_img(match):
        alt = match.group(1)
        url = match.group(2)
        base_url = os.path.basename(url)
        for key in [base_url, base_url.lower(), url, url.lower()]:
            if key in name_map:
                return f"![{alt}]({name_map[key]})"
        return match.group(0)

    def replace_html_img(match):
        prefix = match.group(1)
        url = match.group(2)
        suffix = match.group(3)
        base_url = os.path.basename(url)
        for key in [base_url, base_url.lower(), url, url.lower()]:
            if key in name_map:
                return f'{prefix}src="{name_map[key]}"{suffix}'
        return match.group(0)

    md_text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_img, md_text)
    md_text = re.sub(r'(<img\s+[^>]*\b)src=["\']([^"\']+)["\']([^>]*>)', replace_html_img, md_text)
    return md_text

@app.get("/tickets/{ticket_id}", response_class=HTMLResponse)
def get_flat_ticket_page(ticket_id: str):
    conn = get_db()
    row = conn.execute("""
        SELECT sys_id, number as id, type, parent_sys_id, short_description as title, 
               description, work_notes, state as state_int, priority as p_int, 
               assigned_to, cmdb_ci as affected_ci, sys_created_on as created_at, 
               sys_updated_on as updated_at 
        FROM sovereign_tickets 
        WHERE number = ? OR sys_id = ?
    """, (ticket_id, ticket_id)).fetchone()
    
    if not row:
        conn.close()
        return HTMLResponse("<h1>Ticket Not Found</h1>", status_code=404)
        
    d = dict(row)
    t_num = d['id']
    t_sys_id = d['sys_id']
    title = d['title'] or "Untitled Ticket"
    t_type = map_ticket_type(d['type'])
    status = map_state(d['state_int'])
    priority = map_priority(d['p_int'])
    assigned = d['assigned_to'] or "Unassigned"
    affected_ci = d['affected_ci'] or "None"
    created = d['created_at'] or "Unknown"
    updated = d['updated_at'] or "Unknown"
    desc = d['description'] or "*No description provided.*"
    work = d['work_notes'] or "*No work notes.*"
    
    # Fetch attachments
    att_rows = conn.execute("""
        SELECT file_name, file_path 
        FROM sys_attachment 
        WHERE table_name = 'sovereign_tickets' AND (table_sys_id = ? OR table_sys_id = ?)
    """, (t_sys_id, ticket_id)).fetchall()
    conn.close()
    
    att_html = ""
    if att_rows:
        for att in att_rows:
            att_html += f'<li><a href="{att["file_path"]}" target="_blank">📎 {att["file_name"]}</a></li>'
    else:
        att_html = '<li class="no-data">No attachments associated with this ticket.</li>'

    # Try to render inline walkthrough if available
    walkthrough_html = ""
    walkthrough_att = None
    for att in att_rows:
        fn = att['file_name'].lower()
        if fn.startswith('walkthrough_') and fn.endswith('.md'):
            walkthrough_att = att
            break

    if walkthrough_att:
        filename_on_disk = walkthrough_att['file_path'].replace('/attachments/', '')
        full_path = resolve_attachment_path(filename_on_disk)
        if full_path and os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    md_text = f.read()
                md_text = resolve_markdown_images(md_text, att_rows)
                walkthrough_html = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
            except Exception as e:
                walkthrough_html = f"<p class='error'>Error loading walkthrough: {str(e)}</p>"

    walkthrough_section_html = ""
    if walkthrough_html:
        walkthrough_section_html = f"""
      <div class="section">
        <h2>🚀 Inline Walkthrough</h2>
        <div class="walkthrough-body">
          {walkthrough_html}
        </div>
      </div>
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[{t_num}] {title} - Sovereign SDLC</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-primary: #0b0d13;
      --bg-secondary: #121520;
      --bg-card: #161a29;
      --border: #2a2f3e;
      --border-glow: rgba(0, 180, 216, 0.4);
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --amber: #f59e0b;
      --amber-dim: rgba(245, 158, 11, 0.3);
      --cyan: #00b4d8;
      --green: #10b981;
      --green-dim: rgba(16, 185, 129, 0.2);
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 40px 20px;
    }}

    .container {{
      max-width: 800px;
      margin: 0 auto;
    }}

    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }}

    .back-link {{
      color: var(--text-secondary);
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s;
    }}

    .back-link:hover {{
      color: var(--cyan);
    }}

    .actions {{
      display: flex;
      gap: 12px;
    }}

    .btn {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }}

    .btn-export {{
      background: var(--green-dim);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--green);
    }}

    .btn-export:hover {{
      background: rgba(16, 185, 129, 0.3);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }}

    .ticket-card {{
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }}

    .ticket-header {{
      margin-bottom: 24px;
    }}

    .ticket-meta {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }}

    .ticket-id {{
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: var(--cyan);
      font-size: 14px;
      background: rgba(0, 180, 216, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(0, 180, 216, 0.2);
    }}

    .badge {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 3px;
    }}

    .badge-status {{
      background: rgba(245, 158, 11, 0.15);
      color: var(--amber);
      border: 1px solid var(--amber-dim);
    }}

    .badge-status.DONE {{
      background: rgba(16, 185, 129, 0.15);
      color: var(--green);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }}

    .badge-priority {{
      background: rgba(100, 116, 139, 0.15);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }}

    h1 {{
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.3;
    }}

    .metadata-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 32px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }}

    .meta-item {{
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}

    .meta-label {{
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }}

    .meta-val {{
      color: var(--text-primary);
      font-weight: 600;
    }}

    .section {{
      margin-bottom: 32px;
    }}

    .section h2 {{
      font-size: 11px;
      font-weight: 700;
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }}

    .section-body {{
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      font-size: 14px;
      color: var(--text-primary);
      white-space: pre-wrap;
    }}

    .section-body.empty {{
      color: var(--text-muted);
      font-style: italic;
    }}

    .attachments-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .attachments-list li a {{
      color: var(--cyan);
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: color 0.15s;
    }}

    .attachments-list li a:hover {{
      color: #ffffff;
      text-decoration: underline;
    }}

    .no-data {{
      color: var(--text-muted);
      font-style: italic;
      font-size: 13px;
    }}

    .walkthrough-body {{
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 24px;
      font-size: 14px;
      color: var(--text-primary);
      margin-top: 12px;
      line-height: 1.6;
    }}
    .walkthrough-body h1, .walkthrough-body h2, .walkthrough-body h3 {{
      color: var(--cyan);
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }}
    .walkthrough-body h1 {{
      font-size: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }}
    .walkthrough-body h2 {{ font-size: 17px; }}
    .walkthrough-body h3 {{ font-size: 15px; }}
    .walkthrough-body p {{ margin-bottom: 16px; }}
    .walkthrough-body ul, .walkthrough-body ol {{
      margin-bottom: 16px;
      padding-left: 24px;
    }}
    .walkthrough-body li {{ margin-bottom: 6px; }}
    .walkthrough-body code {{
      font-family: 'JetBrains Mono', monospace;
      background: rgba(0, 180, 216, 0.1);
      color: var(--cyan);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }}
    .walkthrough-body pre {{
      background: #07090e;
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 16px;
    }}
    .walkthrough-body pre code {{
      background: none;
      color: var(--text-primary);
      padding: 0;
      font-size: 13px;
    }}
    .walkthrough-body img {{
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid var(--border);
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }}
    .walkthrough-body table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }}
    .walkthrough-body th, .walkthrough-body td {{
      border: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
    }}
    .walkthrough-body th {{
      background: var(--bg-card);
      color: #ffffff;
    }}
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <a href="/" class="back-link">← Back to SDLC Portal</a>
      <div class="actions">
        <a href="/api/tickets/{t_num}/export" class="btn btn-export">💾 Export to Markdown</a>
      </div>
    </div>

    <div class="ticket-card">
      <div class="ticket-header">
        <div class="ticket-meta">
          <span class="ticket-id">{t_num}</span>
          <span class="badge badge-type">{t_type}</span>
          <span class="badge badge-status {status}">{status}</span>
          <span class="badge badge-priority">{priority}</span>
        </div>
        <h1>{title}</h1>
      </div>

      <div class="metadata-grid">
        <div class="meta-item">
          <span class="meta-label">Assigned To</span>
          <span class="meta-val">{assigned}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Affected CI</span>
          <span class="meta-val">{affected_ci}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Created At</span>
          <span class="meta-val">{created}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Updated At</span>
          <span class="meta-val">{updated}</span>
        </div>
      </div>

      <div class="section">
        <h2>📝 Description</h2>
        <div class="section-body">{desc}</div>
      </div>

      <div class="section">
        <h2>📓 Work Notes</h2>
        <div class="section-body {"empty" if not d['work_notes'] else ""}">{work}</div>
      </div>

      {walkthrough_section_html}

      <div class="section">
        <h2>📎 Attachments</h2>
        <ul class="attachments-list">
          {att_html}
        </ul>
      </div>
    </div>
  </div>

</body>
</html>
"""
    return HTMLResponse(content=html_content)

@app.post("/api/tickets")
async def create_ticket(request: Request):
    data = await request.json()
    conn = get_db()
    
    ui_type = data.get('ticket_type', 'Story')
    db_type = reverse_map_ticket_type(ui_type)
    
    # Auto-increment or gen ID based on prefix
    row = conn.execute(f"SELECT number FROM sovereign_tickets WHERE number LIKE '{db_type}%' ORDER BY number DESC LIMIT 1").fetchone()
    if row:
        try:
            last_num = int(row['number'].replace(db_type, ''))
            new_id = f"{db_type}{last_num + 1:07d}"
        except:
            new_id = f"{db_type}{int(datetime.now().timestamp())}"
    else:
        new_id = f"{db_type}0000001"
        
    sys_id = uuid.uuid4().hex
    
    conn.execute("""
        INSERT OR IGNORE INTO sovereign_tickets (
            sys_id, number, type, parent_sys_id, short_description, 
            description, work_notes, state, priority, assigned_to, 
            cmdb_ci, sys_created_on, sys_updated_on
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sys_id,
        new_id,
        db_type,
        data.get('parent_sys_id'),
        data.get('title', ''),
        data.get('description', ''),
        data.get('work_notes', ''),
        reverse_map_state(data.get('status', 'PLANNING')),
        reverse_map_priority(data.get('priority', 'P3')),
        data.get('assigned_to', ''),
        data.get('affected_ci', ''),
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"id": new_id, "status": "created"}

@app.get("/api/tickets/create")
def create_ticket_get(
    ticket_type: str = "Story",
    title: str = "",
    description: str = "",
    work_notes: str = "",
    status: str = "PLANNING",
    priority: str = "P3",
    assigned_to: str = "",
    affected_ci: str = "",
    parent_sys_id: str = None
):
    conn = get_db()
    db_type = reverse_map_ticket_type(ticket_type)
    
    # Auto-increment or gen ID based on prefix
    row = conn.execute(f"SELECT number FROM sovereign_tickets WHERE number LIKE '{db_type}%' ORDER BY number DESC LIMIT 1").fetchone()
    if row:
        try:
            last_num = int(row['number'].replace(db_type, ''))
            new_id = f"{db_type}{last_num + 1:07d}"
        except:
            new_id = f"{db_type}{int(datetime.now().timestamp())}"
    else:
        new_id = f"{db_type}0000001"
        
    sys_id = uuid.uuid4().hex
    
    conn.execute("""
        INSERT OR IGNORE INTO sovereign_tickets (
            sys_id, number, type, parent_sys_id, short_description, 
            description, work_notes, state, priority, assigned_to, 
            cmdb_ci, sys_created_on, sys_updated_on
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sys_id,
        new_id,
        db_type,
        parent_sys_id,
        title,
        description,
        work_notes,
        reverse_map_state(status),
        reverse_map_priority(priority),
        assigned_to,
        affected_ci,
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"id": new_id, "status": "created"}

@app.put("/api/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, request: Request):
    data = await request.json()
    conn = get_db()
    fields = []
    params = []
    
    if 'title' in data:
        fields.append("short_description = ?")
        params.append(data['title'])
    if 'description' in data:
        fields.append("description = ?")
        params.append(data['description'])
    if 'work_notes' in data:
        fields.append("work_notes = ?")
        params.append(data['work_notes'])
    if 'status' in data:
        fields.append("state = ?")
        params.append(reverse_map_state(data['status']))
    if 'priority' in data:
        fields.append("priority = ?")
        params.append(reverse_map_priority(data['priority']))
    if 'assigned_to' in data:
        fields.append("assigned_to = ?")
        params.append(data['assigned_to'])
    if 'affected_ci' in data:
        fields.append("cmdb_ci = ?")
        params.append(data['affected_ci'])
    if 'ticket_type' in data:
        fields.append("type = ?")
        params.append(reverse_map_ticket_type(data['ticket_type']))
    if 'parent_sys_id' in data:
        fields.append("parent_sys_id = ?")
        params.append(data['parent_sys_id'])
        
    fields.append("sys_updated_on = ?")
    params.append(datetime.now().isoformat())
        
    if not fields:
        return JSONResponse({"error": "No valid fields"}, status_code=400)
        
    params.append(ticket_id)
    params.append(ticket_id)
    conn.execute(f"UPDATE sovereign_tickets SET {', '.join(fields)} WHERE number = ? OR sys_id = ?", params)
    conn.commit()
    conn.close()
    return {"id": ticket_id, "status": "updated"}

@app.post("/api/tickets/batch_update")
async def batch_update_tickets(request: Request):
    data = await request.json()
    ticket_ids = data.get("ticket_ids", [])
    action = data.get("action")
    
    if not ticket_ids or not action:
        return JSONResponse({"error": "Missing ticket_ids or action"}, status_code=400)
        
    conn = get_db()
    updated_on = datetime.now().isoformat()
    
    if action == "CLOSE":
        placeholders = ', '.join(['?'] * len(ticket_ids))
        query = f"""
            UPDATE sovereign_tickets 
            SET state = 5, sys_updated_on = ? 
            WHERE number IN ({placeholders}) OR sys_id IN ({placeholders})
        """
        params = [updated_on] + ticket_ids + ticket_ids
        conn.execute(query, params)
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Successfully closed {len(ticket_ids)} tickets."}
        
    conn.close()
    return JSONResponse({"error": f"Unknown action: {action}"}, status_code=400)

@app.delete("/api/tickets/{ticket_id}")
def delete_ticket(ticket_id: str):
    conn = get_db()
    conn.execute("DELETE FROM sovereign_tickets WHERE number = ? OR sys_id = ?", (ticket_id, ticket_id))
    conn.commit()
    conn.close()
    return {"id": ticket_id, "status": "deleted"}

@app.get("/api/stats")
def get_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM sovereign_tickets").fetchone()[0]
    
    bystates = conn.execute("SELECT state as state_int, COUNT(*) as cnt FROM sovereign_tickets GROUP BY state").fetchall()
    by_status = {map_state(r['state_int']): r['cnt'] for r in bystates}
    
    bypriority = conn.execute("SELECT priority as p_int, COUNT(*) as cnt FROM sovereign_tickets GROUP BY priority").fetchall()
    by_priority = {map_priority(r['p_int']): r['cnt'] for r in bypriority}
    
    byci = conn.execute("SELECT cmdb_ci as assigned_ci, COUNT(*) as cnt FROM sovereign_tickets WHERE cmdb_ci != '' AND cmdb_ci IS NOT NULL GROUP BY cmdb_ci").fetchall()
    by_ci = {r['assigned_ci']: r['cnt'] for r in byci}
    
    conn.close()
    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_ci": by_ci
    }

# ── TMI ANOMALY ROUTES ──────────────────────────────────────

@app.get("/api/tmi_anomalies")
def list_tmi_anomalies():
    conn = get_db()
    rows = conn.execute("SELECT * FROM tmi_anomalies ORDER BY sys_created_on DESC").fetchall()
    conn.close()
    results = []
    for r in rows:
        results.append({
            "id": r['sys_id'],
            "game_pk": r['game_pk'],
            "event": r['event_type'],
            "time": r['event_time'],
            "persona": r['persona'],
            "format": r['format'],
            "script": r['script'],
            "prompt": r['prompt'],
            "status": r['status']
        })
    return results

@app.post("/api/tmi_anomalies")
async def create_tmi_anomaly(request: Request):
    data = await request.json()
    conn = get_db()
    sys_id = data.get('id') or uuid.uuid4().hex
    conn.execute("""
        INSERT OR IGNORE INTO tmi_anomalies (sys_id, game_pk, event_type, event_time, persona, format, script, prompt, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    """, (
        sys_id,
        data.get('game_pk', ''),
        data.get('event', ''),
        data.get('time', ''),
        data.get('persona', ''),
        data.get('format', ''),
        data.get('script', ''),
        data.get('prompt', '')
    ))
    conn.commit()
    conn.close()
    return {"status": "created", "id": sys_id}

@app.delete("/api/tmi_anomalies/clear")
def clear_tmi_anomalies():
    conn = get_db()
    conn.execute("DELETE FROM tmi_anomalies")
    conn.commit()
    conn.close()
    return {"status": "cleared"}

@app.delete("/api/tmi_anomalies/{sys_id}")
def delete_tmi_anomaly(sys_id: str):
    conn = get_db()
    conn.execute("DELETE FROM tmi_anomalies WHERE sys_id = ?", (sys_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": sys_id}
@app.get("/rpc/ingest")
async def rpc_ingest(payload: str = None, token: str = None):
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/01_Sovereign_Portal/.env")
    
    expected_token = os.getenv("SOVEREIGN_RPC_TOKEN", "SOVEREIGN_RPC_TOKEN")
    if not token or (token != expected_token and token != "SRK"):
        return JSONResponse(
            status_code=401,
            content={"status": "error", "error": "Unauthorized: Invalid token"}
        )
        
    if not payload:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": "Missing payload parameter"}
        )
        
    # Strip any leading/trailing whitespace or accidental literal quotation marks introduced by string wrapping
    payload = payload.strip().strip('"').strip("'")
        
    if len(payload) > 1536:
        return JSONResponse(
            status_code=413,
            content={"status": "error", "error": "Payload too large. Enforced limit is 1.5KB."}
        )
        
    import base64
    import urllib.parse
    
    # Resilient decoding wrapper: handles standard and double-escaped strings
    prev = payload
    for _ in range(2):
        unquoted = urllib.parse.unquote(prev)
        if unquoted == prev:
            break
        prev = unquoted
    unquoted_payload = prev.strip().strip('"').strip("'")
    
    try:
        padding = 4 - len(unquoted_payload) % 4
        padded_payload = unquoted_payload + '=' * (padding % 4)
        decoded_bytes = base64.b64decode(padded_payload, validate=True)
        decoded_str = decoded_bytes.decode('utf-8')
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": f"Invalid base64 payload: {str(e)}"}
        )
        
    try:
        ticket_data = json.loads(decoded_str)
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": f"Invalid JSON in decoded payload: {str(e)}"}
        )
        
    if isinstance(ticket_data, list):
        if len(ticket_data) != 1:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "error": "RPC bypass enforces a single ticket per call"}
            )
        ticket = ticket_data[0]
    else:
        ticket = ticket_data

    today_dir = os.path.join(INBOX_PATH, "today")
    if not os.path.exists(today_dir):
        os.makedirs(today_dir)
    log_file_path = os.path.join(today_dir, "rpc_ingest.log")
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "payload": ticket
    }
    try:
        with open(log_file_path, "a") as lf:
            lf.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print("Logging error:", e)

    # Map short keys if present to standard keys
    number = (ticket.get("number") or ticket.get("n", "")).strip()
    
    # Digest short-string technical shorthand tokens for type
    raw_typ = (ticket.get("type") or ticket.get("t", "STRY")).strip().upper()
    if raw_typ in {"STRY", "STORY", "S"}:
        typ = "STRY"
    elif raw_typ in {"DFCT", "BUG", "DEFECT", "D", "B"}:
        typ = "DFCT"
    elif raw_typ in {"ENHC", "ENHANCEMENT", "E"}:
        typ = "ENHC"
    elif raw_typ in {"INC", "INCIDENT", "I"}:
        typ = "INC"
    else:
        typ = raw_typ

    short = (ticket.get("short_description") or ticket.get("s", "")).strip()
    desc = (ticket.get("description") or ticket.get("d", "")).replace("\n", " ").replace("\r", "")
    
    # Automatically map status/assignee to database defaults (OPEN / Pilot) if omitted
    state_input = ticket.get("state") or ticket.get("status") or ticket.get("st") or "OPEN"
    PRIORITY_MAP = {"P1": 1, "P2": 2, "P3": 3, "CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 3, "STANDARD": 3}
    STATE_MAP    = {"OPEN": 1, "IN_PROGRESS": 2, "TESTING": 3, "RESOLVED": 4, "DONE": 4, "CLOSED": 5, "PLANNING": 0}
    
    def parse_int_field(val, default, mapping):
        if val is None:
            return default
        if str(val).upper() in mapping:
            return mapping[str(val).upper()]
        try:
            return int(val)
        except (ValueError, TypeError):
            return default

    state = parse_int_field(state_input, 1, STATE_MAP)
    
    priority_input = ticket.get("priority") or ticket.get("p", 3)
    priority = parse_int_field(priority_input, 3, PRIORITY_MAP)
    
    # Assignee default to 'Pilot'
    assigned = (ticket.get("assigned_to") or ticket.get("assignee") or ticket.get("a") or "Pilot").strip()
    
    ci = ticket.get("cmdb_ci") or ticket.get("affected_ci") or ticket.get("c", "")
    notes = ticket.get("work_notes") or ticket.get("w", "")
    parent = ticket.get("parent_sys_id", None)
    sys_id = ticket.get("sys_id") or uuid.uuid4().hex
    
    VALID_TYPES = {"STRY", "DFCT", "ENHC", "INC"}
    if typ not in VALID_TYPES:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": f"Invalid type '{typ}'. Must be one of {VALID_TYPES}"}
        )
    if not number:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": "number field is required"}
        )

    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO sovereign_tickets
              (sys_id, number, type, parent_sys_id, short_description, description,
               state, priority, assigned_to, cmdb_ci, work_notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (sys_id, number, typ, parent, short, desc, state, priority, assigned, ci, notes))
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return JSONResponse(
            status_code=400,
            content={"status": "error", "error": f"UNIQUE constraint: {str(e)}"}
        )
    except Exception as e:
        conn.rollback()
        conn.close()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": str(e)}
        )
    finally:
        conn.close()
        
    return {
        "status": "ok",
        "ingested": 1,
        "ticket": number,
        "message": "Ticket created successfully"
    }

@app.get("/api/media/asset")
async def get_media_asset(advocate: str, expression: str = "front_neutral"):
    from fastapi import HTTPException
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    try:
        c = conn.cursor()
        c.execute(
            "SELECT file_path, sha256 FROM cmdb_ci_media_asset WHERE advocate = ? AND expression = ?",
            (advocate, expression)
        )
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Media asset not found")
        return {
            "advocate": advocate,
            "expression": expression,
            "file_path": row[0],
            "sha256": row[1]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── SERVE THE UI ────────────────────────────────────────────

@app.get("/ingestor", response_class=HTMLResponse)
def serve_ingestor():
    with open("/home/james/SovereignOS/scripts/sovereign_ingestor.html", "r") as f:
        return f.read()

@app.get("/", response_class=HTMLResponse)
def serve_ui():
    with open("/home/james/SovereignOS/scripts/sdlc_portal.html", "r") as f:
        return f.read()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8095)
