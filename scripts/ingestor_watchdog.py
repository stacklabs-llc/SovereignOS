import os
import json
import sqlite3
import time
import threading
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from flask import Flask, jsonify, request
from flask_cors import CORS

WATCH_DIR = "/home/james/SovereignOS/dna/ingest/queue"
ARCHIVE_DIR = "/home/james/SovereignOS/dna/ingest/archive"
DB_PATH = "/home/james/SovereignOS/sovereign_sdlc.db"
SAVINGS_DB_PATH = "/home/james/SovereignOS/savings_ledger.db"

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            sys_id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT UNIQUE,
            action TEXT,
            ticket_type TEXT,
            priority TEXT,
            assigned_ci TEXT,
            source TEXT,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

    # Savings Ledger
    conn2 = sqlite3.connect(SAVINGS_DB_PATH)
    cursor2 = conn2.cursor()
    cursor2.execute('''
        CREATE TABLE IF NOT EXISTS savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT,
            tokens_saved INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn2.commit()
    conn2.close()

class IngestorHandler(FileSystemEventHandler):
    def process_file(self, file_path):
        if not file_path.endswith(".json"): return
        
        try:
            # Short wait to ensure file is completely written before reading
            time.sleep(0.1) 
            with open(file_path, 'r') as f:
                payload = json.load(f)
            
            event_id = payload.get('event_id', 'UNKNOWN_EVENT')
            action = payload.get('action', '')
            ticket_type = payload.get('ticket_type', 'GENERAL')
            priority = payload.get('priority', 'P3')
            assigned_ci = payload.get('assigned_ci', 'SYSTEM')
            
            # Determine source
            source = "PORTAL" if file_path.startswith(WATCH_DIR) else "IDE"

            # Estimate token savings (Standard IDE prompt overhead ~3000 tokens)
            payload_size = len(str(payload)) // 4  # roughly 1 token per 4 chars
            tokens_saved = max(0, 3000 - payload_size)

            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Insert or update
            cursor.execute('''
                INSERT OR IGNORE INTO tickets (event_id, action, ticket_type, priority, assigned_ci, source, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Active')
            ''', (event_id, action, ticket_type, priority, assigned_ci, source))
            
            conn.commit()
            conn.close()

            # Record savings
            conn2 = sqlite3.connect(SAVINGS_DB_PATH)
            cursor2 = conn2.cursor()
            cursor2.execute('INSERT INTO savings (event_id, tokens_saved) VALUES (?, ?)', (event_id, tokens_saved))
            conn2.commit()
            conn2.close()

            print(f"[WATCHDOG] 🟢 Ingested {event_id} from {source} | Tokens Traded: -{payload_size} | SAVED: {tokens_saved}")

            # Archive the file
            filename = os.path.basename(file_path)
            os.rename(file_path, os.path.join(ARCHIVE_DIR, filename))
            
        except Exception as e:
            print(f"[WATCHDOG] 🔴 Error processing {file_path}: {e}")

    def on_created(self, event):
        if not event.is_directory:
            self.process_file(event.src_path)

@app.route('/api/ci_roster', methods=['GET'])
def get_ci_roster():
    try:
        conn = sqlite3.connect("/home/james/SovereignOS/Sovereign_CMDB.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT ci_name, ci_role FROM ci_registry WHERE status='Active'")
        agents = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"agents": agents}), 200
    except Exception as e:
        print(f"[WATCHDOG] ERR: CMDB Roster fetch failed - {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/kanban', methods=['GET'])
def get_kanban_data():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets ORDER BY sys_id DESC")
    tickets = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Get total savings
    conn2 = sqlite3.connect(SAVINGS_DB_PATH)
    cursor2 = conn2.cursor()
    cursor2.execute("SELECT SUM(tokens_saved) FROM savings")
    tot_s = cursor2.fetchone()[0] or 0
    conn2.close()

    return jsonify({"tickets": tickets, "total_savings": tot_s}), 200

@app.route('/api/cast_kanban', methods=['POST'])
def cast_kanban():
    try:
        # Assuming you use standard port 8000 for your local mesh nodes when viewing html
        url_to_cast = "http://clio.taila01894.ts.net:8000/sovereign_kanban_tv.html"
        subprocess.Popen(['python3', '/home/james/SovereignOS/scripts/vesper_tv_launch.py', url_to_cast])
        print(f"[MATRX] Casting Kanban to 65-inch Fire TV via vesper_tv_launch.py")
        return jsonify({"status": "success", "casted_url": url_to_cast}), 200
    except Exception as e:
        print(f"[MATRX] ERR: Failed to cast - {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingest', methods=['POST'])
def api_ingest():
    payload = request.json
    
    # Metal First Rule: Normalize and Pour physically to disk
    normalized = {}
    if 'data' in payload:
        d = payload['data']
        normalized['event_id'] = d.get('id', 'UNKNOWN')
        normalized['action'] = d.get('description', '')
        normalized['ticket_type'] = d.get('ticket_type', 'GENERAL')
        normalized['priority'] = d.get('priority', 'P3')
        normalized['assigned_ci'] = d.get('assigned_ci', 'SYSTEM')
    else:
        normalized = payload
        
    filename = f"{normalized.get('event_id', 'INGEST')}_{int(time.time())}.json"
    file_path = os.path.join(WATCH_DIR, filename)
    
    with open(file_path, 'w') as f:
        import json
        json.dump(normalized, f, indent=4)
        
    print(f"[WATCHDOG-API] 📥 Poured payload natively to {file_path}")
    
    return jsonify({"status": "success", "ticket_id": normalized.get('event_id', 'UNKNOWN')}), 200

@app.route('/api/update_ticket', methods=['POST'])
def api_update_ticket():
    payload = request.json
    sys_id = payload.get('sys_id')
    new_status = payload.get('status')
    if not sys_id or not new_status:
        return jsonify({"error": "Missing sys_id or status"}), 400
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE tickets SET status=? WHERE sys_id=?", (new_status, sys_id))
    conn.commit()
    conn.close()
    
    print(f"[WATCHDOG] 🔄 Ticket {sys_id} moved to {new_status}")
    return jsonify({"status": "success"}), 200

@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    upload_dir = '/home/james/SovereignOS/dna/ingest/attachments/'
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        if file:
            # simple secure filename substitute since werkzeug might not be imported 
            # or we can just use os.path.basename(file.filename)
            filename = os.path.basename(file.filename)
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            saved_files.append(filename)
            
    print(f"[WATCHDOG] 📁 Vaulted attachments: {saved_files}")
    return jsonify({"status": "success", "files": saved_files}), 200

def run_watchdog():
    os.makedirs(WATCH_DIR, exist_ok=True)
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    
    event_handler = IngestorHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    print(f"[SYS] Sovereign Ingestor Watchdog Active -> {WATCH_DIR}...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    init_db()
    # Start watchdog running in background
    t = threading.Thread(target=run_watchdog, daemon=True)
    t.start()
    
    # Run the webhook server for TV/Kanban state tracking
    app.run(host='0.0.0.0', port=5056)
