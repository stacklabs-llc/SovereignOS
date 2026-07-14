from fastapi import APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3, os, re, uuid, time, json, subprocess, asyncio, aiohttp, shutil
from datetime import datetime, timedelta, timezone
from core.db import DB_PATH, get_db
from core.security import get_current_user, require_pilot, require_manager_or_pilot, security

router = APIRouter()


@router.post("/api/system/onboard/sync-work-orders")
async def sync_work_orders(pilot: dict = Depends(require_pilot)):
    # 1. Write watchdog record to sovereign_tickets prior to shell processes
    ticket_id = f"INC-SYNC-{int(time.time())}"
    sys_id = uuid.uuid4().hex
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO sovereign_tickets 
              (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes)
            VALUES (?, ?, 'INC', 'Google Drive Work Order Sync Pipeline Execution', 'Sync pipeline execution started.', 2, 3, 'james', 'GoogleDriveSync', 'Initializing shell script sovereign_pull_sync.sh')
        """, (sys_id, ticket_id))
        conn.commit()
    except Exception as e:
        print(f"Failed to write watchdog record: {e}")
    finally:
        conn.close()

    # 2. Programmatically execute scripts/sovereign_pull_sync.sh
    try:
        process = await asyncio.create_subprocess_exec(
            "/home/james/SovereignOS/scripts/sovereign_pull_sync.sh",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            err_msg = stderr.decode()
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sovereign_tickets 
                SET state = 4, work_notes = ? 
                WHERE sys_id = ?
            """, (f"Execution of sovereign_pull_sync.sh failed: {err_msg}", sys_id))
            conn.commit()
            conn.close()
            raise HTTPException(status_code=500, detail=f"Sync execution failed: {err_msg}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to start sovereign_pull_sync.sh: {str(e)}")

    # 3. Execute scripts/execute_staged_orders.py
    staged_count = 0
    try:
        process_stage = await asyncio.create_subprocess_exec(
            "/home/james/SovereignOS/.venv/bin/python3", "/home/james/SovereignOS/scripts/execute_staged_orders.py",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout_stage, stderr_stage = await process_stage.communicate()
        out_str = stdout_stage.decode()
        match = re.search(r"Total staged work orders:\s*(\d+)", out_str)
        if match:
            staged_count = int(match.group(1))
    except Exception as e:
        print(f"Failed to execute staged parser: {e}")

    # 4. Update watchdog ticket to RESOLVED
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE sovereign_tickets 
        SET state = 4, work_notes = ? 
        WHERE sys_id = ?
    """, (f"Sync execution completed successfully. Newly staged orders: {staged_count}", sys_id))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "staged_count": staged_count,
        "message": f"Successfully pulled and staged {staged_count} work orders."
    }

@router.post("/api/system/onboard/easy-pull")
async def legacy_easy_pull(pilot: dict = Depends(require_pilot)):
    return await sync_work_orders(pilot)

@router.get("/api/system/telemetry")
async def get_system_telemetry():
    temp_c = 0.0
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            temp_c = float(f.read().strip()) / 1000.0
    except Exception:
        pass

    try:
        load = os.getloadavg()
    except Exception:
        load = (0.0, 0.0, 0.0)
        
    ram_total, ram_used, swap_used = 0, 0, 0
    power_nominal = True
    try:
        import psutil
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        ram_total = mem.total // (1024 * 1024)
        ram_used = mem.used // (1024 * 1024)
        swap_used = swap.used // (1024 * 1024)
    except Exception:
        pass
        
    if ram_total == 0:
        try:
            meminfo = {}
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    parts = line.split()
                    if len(parts) >= 2:
                        meminfo[parts[0].replace(':', '')] = int(parts[1])
            if 'MemTotal' in meminfo:
                ram_total = meminfo['MemTotal'] // 1024
                if 'MemAvailable' in meminfo:
                    ram_used = ram_total - (meminfo['MemAvailable'] // 1024)
                elif 'MemFree' in meminfo:
                    ram_used = ram_total - (meminfo['MemFree'] // 1024)
            if 'SwapTotal' in meminfo and 'SwapFree' in meminfo:
                swap_used = (meminfo['SwapTotal'] - meminfo['SwapFree']) // 1024
        except Exception:
            pass
        
    try:
        res = subprocess.run(['vcgencmd', 'get_throttled'], capture_output=True, text=True)
        if 'throttled=' in res.stdout:
            val = res.stdout.split('=')[1].strip()
            if int(val, 16) & 0x50000:
                power_nominal = False
    except Exception:
        pass

    uptime_str = "unknown"
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            if days > 0:
                uptime_str = f"{days}d {hours}h {minutes}m"
            elif hours > 0:
                uptime_str = f"{hours}h {minutes}m"
            else:
                uptime_str = f"{minutes}m"
    except Exception:
        pass

    return {
        "temp_c": round(temp_c, 1),
        "tempC": round(temp_c, 1),
        "load_1m": round(load[0], 2),
        "load1m": round(load[0], 2),
        "load_5m": round(load[1], 2),
        "load5m": round(load[1], 2),
        "load_15m": round(load[2], 2),
        "load15m": round(load[2], 2),
        "ramUsageTotalMB": ram_total,
        "ramUsageUsedMB": ram_used,
        "swapUsedMB": swap_used,
        "powerRailNominal": power_nominal,
        "uptime_str": uptime_str
    }

class DocSaveRequest(BaseModel):
    path: str
    content: str

@router.get("/api/system/docs")
async def list_system_docs():
    docs_dir = "/home/james/SovereignOS/dna/docs"
    if not os.path.exists(docs_dir):
        return {"docs": []}
        
    docs = []
    for root, dirs, files in os.walk(docs_dir):
        for f in files:
            if not f.endswith(".md"):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, docs_dir)
            
            # Simple title extraction
            title = f.replace(".md", "").replace("_", " ").title()
            summary = ""
            try:
                with open(full_path, "r", encoding="utf-8") as file_handle:
                    lines = file_handle.readlines()
                    # Find first H1
                    for line in lines:
                        if line.strip().startswith("# "):
                            title = line.replace("# ", "").strip()
                            break
                    # Find some teaser text
                    non_empty = [l.strip() for l in lines if l.strip() and not l.strip().startswith("#") and not l.strip().startswith(">") and not l.strip().startswith("*") and not l.strip().startswith("-")]
                    if non_empty:
                        summary = non_empty[0][:150]
                        if len(non_empty[0]) > 150:
                            summary += "..."
            except Exception as e:
                print(f"Error reading doc {rel_path}: {e}")
                
            docs.append({
                "path": rel_path,
                "title": title,
                "summary": summary,
            })
    # Sort docs by title
    docs.sort(key=lambda x: x["title"])
    return {"docs": docs}

@router.get("/api/system/docs/content")
async def get_system_doc_content(path: str):
    docs_dir = "/home/james/SovereignOS/dna/docs"
    # Prevent path traversal
    safe_path = os.path.abspath(os.path.join(docs_dir, path))
    if not safe_path.startswith(os.path.abspath(docs_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(safe_path) or os.path.isdir(safe_path):
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        with open(safe_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"path": path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/system/docs/media")
async def get_system_docs_media(src: str, doc_path: str | None = None):
    docs_dir = "/home/james/SovereignOS/dna/docs"
    
    # Resolve relative source path
    if doc_path and not src.startswith("/") and not src.startswith("http"):
        doc_full_path = os.path.abspath(os.path.join(docs_dir, doc_path))
        doc_dir = os.path.dirname(doc_full_path)
        resolved_path = os.path.abspath(os.path.join(doc_dir, src))
    else:
        if src.startswith("/home/james/"):
            resolved_path = os.path.abspath(src)
        else:
            resolved_path = os.path.abspath(os.path.join("/home/james/SovereignOS", src.lstrip("/")))
            
    # Allowed parent directories for security
    allowed_dirs = [
        os.path.abspath("/home/james/SovereignOS/media_vault"),
        os.path.abspath("/home/james/SovereignOS/dna/docs"),
        os.path.abspath("/home/james/SovereignOS/work_orders"),
        os.path.abspath("/home/james/sovereign_inbox"),
    ]
    
    is_allowed = False
    for allowed_dir in allowed_dirs:
        if resolved_path.startswith(allowed_dir):
            is_allowed = True
            break
            
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Access denied to requested file path")
        
    if not os.path.exists(resolved_path) or os.path.isdir(resolved_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(resolved_path)

@router.put("/api/system/docs/save")
async def save_system_doc(payload: DocSaveRequest):
    docs_dir = "/home/james/SovereignOS/dna/docs"
    # Prevent path traversal
    safe_path = os.path.abspath(os.path.join(docs_dir, payload.path))
    if not safe_path.startswith(os.path.abspath(docs_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
        
    try:
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(payload.content)
        return {"status": "success", "path": payload.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/system/mesh_telemetry")
async def get_mesh_telemetry():
    mesh_nodes = []
    mesh_nodes.append(("127.0.0.1", "CLIO (HQ)"))
    try:
        ts_output = subprocess.check_output(["tailscale", "status"], timeout=3).decode('utf-8')
        ts_ips = re.findall(r'(100\.\d+\.\d+\.\d+)\s+([a-zA-Z0-9\-]+)', ts_output)
        for ip, hostname in ts_ips:
            if hostname.lower() == "clio":
                continue  # Skip to avoid duplicate with 127.0.0.1
            if hostname.lower() == "sov73":
                hostname = "ARGO"
            mesh_nodes.append((ip, hostname.upper()))
    except Exception as e:
        print(f"Tailscale scan failed for mesh telemetry: {e}")

    results = []

    async def fetch_node(session, ip, name):
        url = f"http://{ip}:8090/api/system/telemetry"
        node_data = {
            "ip": ip,
            "hostname": name,
            "status": "OFFLINE",
            "cpu_load": 0.0,
            "temp": 0.0,
            "ram_used": 0,
            "ram_total": 0
        }
        try:
            async with session.get(url, timeout=1.5) as response:
                if response.status == 200:
                    data = await response.json()
                    node_data["status"] = "ONLINE"
                    node_data["cpu_load"] = round(data.get("load_1m", 0.0) * 25, 1) # simple load conversion
                    node_data["temp"] = data.get("temp_c", 0.0)
                    node_data["ram_used"] = data.get("ramUsageUsedMB", 0)
                    node_data["ram_total"] = data.get("ramUsageTotalMB", 0)
        except Exception:
            pass
        return node_data

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_node(session, ip, name) for ip, name in mesh_nodes]
        responses = await asyncio.gather(*tasks)

    total_ram = sum(r["ram_total"] for r in responses)
    used_ram = sum(r["ram_used"] for r in responses)
    active_nodes = sum(1 for r in responses if r["status"] == "ONLINE")
    avg_load = sum(r["cpu_load"] for r in responses if r["status"] == "ONLINE") / max(1, active_nodes)

    return {
        "status": "success",
        "cluster": {
            "total_nodes": len(responses),
            "active_nodes": active_nodes,
            "total_ram_mb": total_ram,
            "used_ram_mb": used_ram,
            "avg_load": round(avg_load, 1)
        },
        "nodes": responses
    }

@router.get("/api/argus/scan")
async def scan_argus_mesh():
    scan_targets_8081 = [
        ("127.0.0.1", "clio")
    ]
        
    try:
        ts_output = subprocess.check_output(["tailscale", "status"], timeout=3).decode('utf-8')
        ts_ips = re.findall(r'(100\.\d+\.\d+\.\d+)\s+([a-zA-Z0-9\-]+)', ts_output)
        for ip, hostname in ts_ips:
            if hostname.lower() != "clio" and not any(h == hostname.lower() for _, h in scan_targets_8081):
                scan_targets_8081.append((ip, hostname))
    except Exception as e:
        print(f"Tailscale scan failed: {e}")
    
    ips_to_scan_5051 = [
        ("127.0.0.1", "Edge DVR")
    ]
    
    active_cameras = []
    
    async def check_camera(session, ip, port, path, name_fallback):
        display_ip = ip
        if ip == "127.0.0.1":
            display_ip = "183"
            
        url = f"http://{ip}:{port}{path}"
        try:
            async with session.get(url, timeout=10.0) as response:
                if response.status == 200:
                    active_cameras.append({
                        "id": f"cam_{ip}_{port}",
                        "name": f"Node .{display_ip.split('.')[-1]} ({name_fallback})",
                        "hostname": name_fallback.lower(),
                        "ip": ip,
                        "port": port,
                        "stream_url": url
                    })
        except Exception:
            pass

    async with aiohttp.ClientSession() as session:
        tasks = []
        for ip, hostname in scan_targets_8081:
            tasks.append(check_camera(session, ip, 8081, "/cam/0", hostname.capitalize()))
        for ip, name in ips_to_scan_5051:
            tasks.append(check_camera(session, ip, 5051, "/video_feed", name))
                
        await asyncio.gather(*tasks)
        
    return {"status": "success", "count": len(active_cameras), "cameras": active_cameras}

class CaptureRequest(BaseModel):
    ip: str
    port: int
    name: str

@router.post("/api/argus/capture")
async def capture_rom(req: CaptureRequest):
    vault_dir = "/home/james/SovereignOS/media_vault/01_Ingest/DVR_Recordings"
    os.makedirs(vault_dir, exist_ok=True)
    
    path = "/" if req.ip == "192.168.1.115" else "/cam/0"
    if req.port == 5051:
        path = "/video_feed"
        
    stream_url = f"http://{req.ip}:{req.port}{path}"
    
    rom_id = f"ROM_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    output_path = os.path.join(vault_dir, f"{rom_id}.mp4")
    
    cmd = [
        "ffmpeg", "-y", "-i", stream_url,
        "-t", "15", "-c:v", "libx264", "-preset", "ultrafast",
        output_path
    ]
    
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    return {
        "status": "success", 
        "message": "Capture initiated", 
        "rom_id": rom_id,
        "output_path": output_path
    }



# --- MIGRATED FROM FANSTACK RELAY ---
bot_process = None
telemetry_process = None

@router.get("/api/sys_rules")
async def get_sys_rules():
    """Retrieve SDLC rules from the CMDB, syncing with local files first."""
    try:
        import sys
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.append(scripts_dir)
        from sync_knowledge_rules import sync_rules
        sync_rules()
    except Exception as e:
        print(f"Error syncing knowledge rules on GET: {e}")

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT * FROM sys_rules ORDER BY sys_updated_on DESC")
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return {"sys_rules": rows}

@router.post("/api/system/start/{app_target}")
async def start_daemons(app_target: str):
    global bot_process, telemetry_process
    try:
        if app_target == "bots":
            if os.path.exists('/tmp/bots_paused.flag'):
                try: os.remove('/tmp/bots_paused.flag')
                except: pass
            os.system("pkill -CONT -f 'scripts/fanstack_chatbots.py'")
            os.system("pkill -9 -f 'scripts/fanstack_chatbots.py'")

            log_file = open('/home/james/SovereignOS/scripts/fanstack_chatbots.log', 'a')
            bot_process = subprocess.Popen(["/home/james/SovereignOS/.venv/bin/python3", "-u", "/home/james/SovereignOS/scripts/fanstack_chatbots.py"], stdout=log_file, stderr=log_file)
            return {"status": "started", "message": "FanStack MARD Engine booted."}
        elif app_target == "telemetry":
            os.system("pkill -CONT -f 'scripts/fanstack_background_poller.py'")
            os.system("pkill -9 -f 'scripts/fanstack_background_poller.py'")
            log_file = open('/home/james/SovereignOS/logs/fanstack_poller.log', 'a')
            telemetry_process = subprocess.Popen(["/home/james/SovereignOS/.venv/bin/python3", "-u", "/home/james/SovereignOS/scripts/fanstack_background_poller.py"], stdout=log_file, stderr=log_file)
            return {"status": "started", "message": "MLB Telemetry Poller booted."}
        return {"status": "error", "message": "Unknown target"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/api/system/pause/{app_target}")
async def pause_daemons(app_target: str):
    if app_target == "bots":
        os.system("touch /tmp/bots_paused.flag")
        return {"status": "paused", "message": "FanStack bots muted (OS process still running)."}
    elif app_target == "telemetry":
        os.system("pkill -STOP -f 'scripts/fanstack_background_poller.py'")
        return {"status": "paused", "message": "MLB Telemetry Poller paused."}
    return {"status": "error", "message": "Unknown target"}

@router.post("/api/system/stop/{app_target}")
async def stop_daemons(app_target: str):
    global bot_process, telemetry_process
    if app_target == "bots":
        if bot_process is not None:
            try: bot_process.terminate()
            except: pass
            bot_process = None
        os.system("pkill -CONT -f 'scripts/fanstack_chatbots.py'")
        os.system("pkill -9 -f 'scripts/fanstack_chatbots.py'")
        return {"status": "stopped", "message": "FanStack bots ripped from Mesh."}
    elif app_target == "telemetry":
        if telemetry_process is not None:
            try: telemetry_process.terminate()
            except: pass
            telemetry_process = None
        os.system("pkill -CONT -f 'scripts/fanstack_background_poller.py'")
        os.system("pkill -9 -f 'scripts/fanstack_background_poller.py'")
        return {"status": "stopped", "message": "MLB Telemetry suspended."}
    return {"status": "error", "message": "Unknown target"}


@router.post("/api/telemetry/voice")
async def play_telemetry_voice(request: Request):
    import subprocess
    data = await request.json()
    message = data.get("message", "")
    if message:
        subprocess.Popen(["python3", "/home/james/SovereignOS/scripts/antigravity_voice.py", message])
    return {"status": "broadcasted", "message": message}


@router.post("/api/bro_decode")
async def bro_decode(req: Request):
    data = await req.json()
    short_desc = data.get("short_description", "")
    desc = data.get("description", "")
    
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {"short_description": short_desc, "description": desc + "\n\n[Bro Decoder Bypass: No API Key / GenAI]"}
        
    try:
        import google.genai as genai
        client = genai.Client(api_key=api_key)
        prompt = f"The user is typing a hurried/jumbled software development ticket from their phone at a baseball game. Clean this up into a concise, professional title and a clear, actionable set of instructions for an AI coding assistant. Return raw JSON ONLY with 'short_description' (string) and 'description' (string) keys. No markdown blocks.\n\nInput Title: {short_desc}\nInput Body: {desc}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        return {"short_description": result.get("short_description", short_desc), "description": result.get("description", desc)}
    except Exception as e:
        return {"short_description": short_desc, "description": f"{desc}\n\n[Bro Decoder Error: {str(e)}]"}


# Kids_Daily_Adventures archived — module removed from repo (May 6 cleanup)
# import sys
# sys.path.append("/home/james/SovereignOS")
# from Kids_Daily_Adventures.backend.main import app as kids_app
# fastapi_app.mount("/kids_api", kids_app)

# Must mount static files LAST so it doesn't shadow API routes

import json

class SysRuleUpdate(BaseModel):
    summary: str
    content: str

@router.put("/api/sys_rules/{sys_id}")
async def update_sys_rule(sys_id: str, payload: SysRuleUpdate):
    """Two-way sync: Update rule in DB and IDE Knowledge Directory."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT rule_id FROM sys_rules WHERE sys_id=?", (sys_id,))
    row = cur.fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Rule not found")
        
    rule_id = row['rule_id']
    
    cur.execute("UPDATE sys_rules SET summary=?, content=?, sys_updated_on=CURRENT_TIMESTAMP WHERE sys_id=?", 
                (payload.summary, payload.content, sys_id))
    con.commit()
    con.close()
    
    # Write back to IDE Knowledge Base
    base_dir = f"/home/james/.gemini/antigravity/knowledge/{rule_id}"
    meta_path = os.path.join(base_dir, "metadata.json")
    rule_path = os.path.join(base_dir, "artifacts", "rule.md")
    
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta = json.load(f)
        meta['summary'] = payload.summary
        with open(meta_path, 'w') as f:
            json.dump(meta, f, indent=2)
            
    if os.path.exists(rule_path):
        with open(rule_path, 'w') as f:
            f.write(payload.content)
            
    return {"status": "success", "sys_id": sys_id, "rule_id": rule_id}


# ── Pixel Dropzone Endpoint ───────────────────────────────────────────────────

HAILO_DROPZONE = "/home/james/sovereign_inbox/hailo_dropzone/"
DEAD_DROP_DIR = "/home/james/sovereign_inbox/dead_drop"
QUARANTINE_DIR = "/home/james/sovereign_inbox/quarantine"

for d in [HAILO_DROPZONE, DEAD_DROP_DIR, QUARANTINE_DIR]:
    try:
        os.makedirs(d, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create {d}: {e}")

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
VIDEO_AUDIO_EXTS = {'.mp4', '.mp3', '.m4a', '.wav', '.webm', '.mov'}
ARCHIVE_EXTS = {'.zip', '.7z', '.rar', '.tar', '.gz'}

@router.post("/api/system/dropzone/upload")
async def dropzone_upload(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext in IMAGE_EXTS:
        target_dir = HAILO_DROPZONE
        msg = "Image routed directly to Hailo NPU queue."
    elif ext in VIDEO_AUDIO_EXTS or ext in ARCHIVE_EXTS:
        target_dir = DEAD_DROP_DIR
        msg = "Media successfully staged in Dead Drop."
    else:
        target_dir = QUARANTINE_DIR
        msg = "WARNING: Invalid file quarantined."
        
    if not os.path.isdir(target_dir):
        target_dir = DEAD_DROP_DIR
        msg = "Primary target inaccessible. Fallback to Dead Drop."

    file_path = os.path.join(target_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "message": msg, "filename": file.filename, "path": file_path}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ── AetherVet Patient Endpoints ───────────────────────────────────────────────

class AetherVetPatient(BaseModel):
    patient_name: str
    species_breed: str | None = None
    age_sex: str | None = None
    weight: str | None = None
    food_brand_flavor: str | None = None
    meals_per_day: str | None = None
    amount_per_meal: str | None = None
    medications_supplements: str | None = None
    heartworm_preventative_name: str | None = None
    missed_heartworm_doses: str | None = None
    flea_preventative_name: str | None = None
    missed_flea_doses: str | None = None
    visited_another_vet_er: str | None = None

@router.get("/api/system/aethervet/patient/{name}")
async def get_aethervet_patient(name: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM aethervet_patients WHERE patient_name = ?", (name,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Patient {name} not found")
    return dict(row)

@router.post("/api/system/aethervet/patient")
async def save_aethervet_patient(req: AetherVetPatient):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO aethervet_patients (
            patient_name, species_breed, age_sex, weight, food_brand_flavor,
            meals_per_day, amount_per_meal, medications_supplements,
            heartworm_preventative_name, missed_heartworm_doses,
            flea_preventative_name, missed_flea_doses, visited_another_vet_er,
            sys_updated_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(patient_name) DO UPDATE SET
            species_breed = excluded.species_breed,
            age_sex = excluded.age_sex,
            weight = excluded.weight,
            food_brand_flavor = excluded.food_brand_flavor,
            meals_per_day = excluded.meals_per_day,
            amount_per_meal = excluded.amount_per_meal,
            medications_supplements = excluded.medications_supplements,
            heartworm_preventative_name = excluded.heartworm_preventative_name,
            missed_heartworm_doses = excluded.missed_heartworm_doses,
            flea_preventative_name = excluded.flea_preventative_name,
            missed_flea_doses = excluded.missed_flea_doses,
            visited_another_vet_er = excluded.visited_another_vet_er,
            sys_updated_on = CURRENT_TIMESTAMP
    """, (
        req.patient_name, req.species_breed, req.age_sex, req.weight, req.food_brand_flavor,
        req.meals_per_day, req.amount_per_meal, req.medications_supplements,
        req.heartworm_preventative_name, req.missed_heartworm_doses,
        req.flea_preventative_name, req.missed_flea_doses, req.visited_another_vet_er
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "patient_name": req.patient_name}



class CompareRequest(BaseModel):
    prompt: str
    persona: str

@router.post("/api/models/compare")
async def compare_models(req: CompareRequest):
    import json
    gemini_key = None
    env_path = "/home/james/SovereignOS/01_Sovereign_Portal/.env"
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("VITE_GEMINI_API_KEY="):
                    gemini_key = line.strip().split("=")[1].replace('"', '')
    
    if not gemini_key:
        gemini_key = os.getenv("GEMINI_API_KEY")

    async def fetch_ollama(session, model, prompt, system_prompt):
        url = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }
        start_t = time.time()
        try:
            async with session.post(url, json=payload, timeout=60) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    elapsed = time.time() - start_t
                    return {"model": model, "text": data.get("response", ""), "time": round(elapsed, 2)}
                else:
                    return {"model": model, "text": f"Error {resp.status}", "time": 0.0}
        except Exception as e:
            return {"model": model, "text": f"Error: {e}", "time": 0.0}

    async def fetch_gemini(session, model, prompt, system_prompt, key):
        if not key:
            return {"model": model, "text": "Error: Missing API Key", "time": 0.0}
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "system_instruction": {"parts": {"text": system_prompt}},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 1.0}
        }
        start_t = time.time()
        try:
            async with session.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    elapsed = time.time() - start_t
                    try:
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                    except (KeyError, IndexError):
                        text = "Error parsing response"
                    return {"model": model, "text": text, "time": round(elapsed, 2)}
                else:
                    error_data = await resp.text()
                    return {"model": model, "text": f"Error {resp.status}: {error_data}", "time": 0.0}
        except Exception as e:
            return {"model": model, "text": f"Error: {e}", "time": 0.0}

    system_prompt = f"Adopt the persona of: {req.persona}. Respond to the user's prompt in character."
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch_ollama(session, "phi3:mini", req.prompt, system_prompt),
            fetch_ollama(session, "dolphin-llama3", req.prompt, system_prompt),
            fetch_gemini(session, "gemini-flash-latest", req.prompt, system_prompt, gemini_key)
        ]
        results = await asyncio.gather(*tasks)
        
    return {"status": "success", "results": results}


# ── Clio Cockpit Telemetry and Process Actuator Endpoints ─────────────────────

import psutil

# Global cache to keep track of process CPU percentages across requests
_process_cache = {}  # script_name -> (psutil.Process, pid)

class ServiceControlRequest(BaseModel):
    service: str
    action: str  # "start" | "stop" | "restart" | "terminate"

@router.get("/api/system/metrics")
async def get_system_metrics():
    # 1. CPU Metrics
    try:
        cpu_cores = psutil.cpu_percent(interval=0.1, percpu=True)
        cpu_total = round(sum(cpu_cores) / len(cpu_cores), 1) if cpu_cores else 0.0
    except Exception:
        cpu_total = 0.0
        cpu_cores = []

    # 2. RAM Metrics
    try:
        mem = psutil.virtual_memory()
        ram_total = mem.total // (1024 * 1024)
        ram_used = mem.used // (1024 * 1024)
        ram_free = mem.available // (1024 * 1024)
        ram_percent = mem.percent
    except Exception:
        ram_total, ram_used, ram_free, ram_percent = 0, 0, 0, 0.0
    oom_warning = ram_percent > 85.0

    # 3. Pi 5 Temperature
    temp_m = 0
    temp_c = 0.0
    for path in ["/sys/class/thermal/thermal_zone0/temp", "/sys/class/thermal/thermal_zone1/temp"]:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    temp_m = int(f.read().strip())
                    temp_c = temp_m / 1000.0
                    break
            except Exception:
                pass
    temp_warning = temp_c >= 60.0 or temp_m >= 60000

    # 4. Disk I/O Metrics
    try:
        disk = psutil.disk_io_counters()
        read_bytes = disk.read_bytes if disk else 0
        write_bytes = disk.write_bytes if disk else 0
        read_time = disk.read_time if disk else 0
        write_time = disk.write_time if disk else 0
        write_latency = round(write_time / disk.write_count, 2) if disk and disk.write_count > 0 else 0.0
    except Exception:
        read_bytes, write_bytes, read_time, write_time, write_latency = 0, 0, 0, 0, 0.0

    # 5. Active Service Process Matrix
    services = {
        "fanstack_relay.py": "WebSocket Relay",
        "fanstack_background_poller.py": "Telemetry Poller",
        "sovereign_core_api.py": "Sovereign Core API",
        "tmi_daemon.py": "TMI Engine Daemon",
        "vesper_scheduler.py": "Vesper Scheduler Engine",
        "fanstack_chatbots.py": "MARD Chat Engine",
        "statcast_ingestor.py": "Statcast Ingestor",
        "statcast_sentinel.py": "Statcast Sentinel",
        "sovereign_drive_pipeline.py": "Sovereign Drive Pipeline"
    }

    status_matrix = []
    
    # Scan running processes to match services
    found_procs = {}
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info['cmdline']
            name = proc.info['name'] or ''
            if cmdline and len(cmdline) > 0:
                is_python = 'python' in name.lower() or 'python' in cmdline[0].lower()
                if is_python:
                    for script in services:
                        if any(script in arg for arg in cmdline):
                            found_procs[script] = proc.info['pid']
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    for script, display_name in services.items():
        pid = found_procs.get(script)
        if pid:
            try:
                # Retrieve or create Process object for delta CPU calculations
                cached_proc, cached_pid = _process_cache.get(script, (None, None))
                if cached_proc and cached_pid == pid:
                    p = cached_proc
                else:
                    p = psutil.Process(pid)
                    _process_cache[script] = (p, pid)
                
                # Fetch metrics
                cpu = p.cpu_percent(interval=None)
                mem_mb = p.memory_info().rss // (1024 * 1024)
                
                # Dynamic warning status if excessive resource utilization
                status = "Running"
                if cpu > 90.0 or mem_mb > 512:
                    status = "Warning"
                
                status_matrix.append({
                    "name": display_name,
                    "script": script,
                    "status": status,
                    "pid": pid,
                    "cpu": round(cpu, 1),
                    "ram": mem_mb
                })
            except Exception:
                status_matrix.append({
                    "name": display_name,
                    "script": script,
                    "status": "Crashed",
                    "pid": None,
                    "cpu": 0.0,
                    "ram": 0
                })
        else:
            # If not running, remove from cache
            _process_cache.pop(script, None)
            status_matrix.append({
                "name": display_name,
                "script": script,
                "status": "Stopped",
                "pid": None,
                "cpu": 0.0,
                "ram": 0
            })

    # Get system uptime
    uptime_str = "unknown"
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            if days > 0:
                uptime_str = f"{days}d {hours}h {minutes}m"
            elif hours > 0:
                uptime_str = f"{hours}h {minutes}m"
            else:
                uptime_str = f"{minutes}m"
    except Exception:
        pass

    is_suite_running = "fanstack_background_poller.py" in found_procs

    return {
        "cpu": {
            "total": cpu_total,
            "cores": cpu_cores
        },
        "ram": {
            "total": ram_total,
            "used": ram_used,
            "free": ram_free,
            "percent": ram_percent,
            "oom_warning": oom_warning
        },
        "temp": {
            "celsius": round(temp_c, 1),
            "millidegrees": temp_m,
            "warning": temp_warning
        },
        "disk_io": {
            "read_bytes": read_bytes,
            "write_bytes": write_bytes,
            "read_time": read_time,
            "write_time": write_time,
            "write_latency_ms": write_latency
        },
        "services": status_matrix,
        "uptime": uptime_str,
        "fanstack_suite_status": "Running" if is_suite_running else "Stopped"
    }

@router.post("/api/system/service/control")
async def control_system_service(payload: ServiceControlRequest):
    script_name = payload.service
    action = payload.action

    if script_name == "fanstack_suite":
        if action in ["stop", "terminate"]:
            try:
                subprocess.Popen(["/home/james/SovereignOS/scripts/stop_fanstack.sh"], preexec_fn=os.setpgrp)
                return {"status": "success", "message": "FanStack telemetry suite successfully hibernated. Core services preserved."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to hibernate FanStack: {str(e)}")
        elif action in ["start", "restart"]:
            try:
                subprocess.Popen(["/home/james/SovereignOS/scripts/start_fanstack.sh"], preexec_fn=os.setpgrp)
                return {"status": "success", "message": "FanStack telemetry suite ignited. Sports polling activated."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to ignite FanStack: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Invalid action for FanStack suite")

    valid_scripts = {
        "fanstack_relay.py": "/home/james/SovereignOS/scripts/fanstack_relay.py",
        "fanstack_background_poller.py": "/home/james/SovereignOS/scripts/fanstack_background_poller.py",
        "sovereign_core_api.py": "/home/james/SovereignOS/scripts/sovereign_core_api.py",
        "tmi_daemon.py": "/home/james/SovereignOS/scripts/tmi_daemon.py",
        "vesper_scheduler.py": "/home/james/SovereignOS/scripts/vesper_scheduler.py",
        "fanstack_chatbots.py": "/home/james/SovereignOS/scripts/fanstack_chatbots.py",
        "statcast_ingestor.py": "/home/james/SovereignOS/scripts/statcast_ingestor.py",
        "statcast_sentinel.py": "/home/james/SovereignOS/scripts/statcast_sentinel.py",
        "sovereign_drive_pipeline.py": "/home/james/SovereignOS/scripts/sovereign_drive_pipeline.py"
    }

    if script_name not in valid_scripts:
        raise HTTPException(status_code=400, detail="Forbidden or invalid service target")

    script_path = valid_scripts[script_name]
    venv_python = "/home/james/SovereignOS/.venv/bin/python3"

    # Log files
    log_name = script_name.replace(".py", ".log").replace("fanstack_", "")
    if script_name == "sovereign_core_api.py":
        log_name = "sovereign_core_8090.log"
    elif script_name == "vesper_scheduler.py":
        log_name = "vesper_scheduler.log"
    log_path = f"/home/james/SovereignOS/logs/{log_name}"

    # Terminate/Stop Actions
    if action in ["stop", "terminate", "restart"]:
        try:
            # Resolve the PID of the python process running the script specifically
            target_pid = None
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = proc.info['cmdline']
                    name = proc.info['name'] or ''
                    if cmdline and len(cmdline) > 0:
                        is_python = 'python' in name.lower() or 'python' in cmdline[0].lower()
                        if is_python and any(script_name in arg for arg in cmdline):
                            target_pid = proc.info['pid']
                            break
                except Exception:
                    pass

            if target_pid:
                # Safe SIGTERM targeting the PID specifically
                subprocess.run(["kill", "-15", str(target_pid)])
                await asyncio.sleep(0.8)
                # SIGKILL mop up if it survived
                try:
                    p = psutil.Process(target_pid)
                    p.kill()
                except psutil.NoSuchProcess:
                    pass
            else:
                # Fallback to standard pkill if pid not resolved cleanly (defensive)
                subprocess.run(["pkill", "-15", "-f", script_name])
                await asyncio.sleep(0.8)
                subprocess.run(["pkill", "-9", "-f", script_name])
        except Exception as e:
            print(f"Error terminating {script_name}: {e}")

    # Start/Restart Actions
    if action in ["start", "restart"]:
        if script_name == "sovereign_core_api.py":
            # Delayed self-restart sequence to prevent dropping HTTP response
            cmd = f"sleep 1 && pkill -15 -f {script_name} && sleep 1 && pkill -9 -f {script_name} && nohup {venv_python} -u {script_path} >> {log_path} 2>&1 &"
            subprocess.Popen(cmd, shell=True, preexec_fn=os.setpgrp)
            return {
                "status": "success",
                "message": "Sovereign Core API self-restart sequence initiated. Re-connection required in 3 seconds."
            }
        else:
            try:
                log_file = open(log_path, "a")
                subprocess.Popen([venv_python, "-u", script_path], stdout=log_file, stderr=log_file, preexec_fn=os.setpgrp)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to boot service: {str(e)}")

    return {"status": "success", "message": f"Service {script_name} successfully {action}ed."}


# ── Knowledge Base (KB) REST API & Two-Way Filesystem Sync ───────────────────

class KBSaveRequest(BaseModel):
    topic: str
    short_description: str
    text: str
    workflow_state: str = "published"
    u_source: str | None = None
    u_tags: str | None = None

def sync_kb_to_filesystem(kb_number: str, topic: str, text: str):
    import re
    from datetime import datetime
    docs_dir = "/home/james/SovereignOS/dna/docs"
    os.makedirs(docs_dir, exist_ok=True)
    
    # Clean up old file for this KB number to prevent duplicates when topic changes
    for filename in os.listdir(docs_dir):
        if filename.startswith(f"{kb_number}_") and filename.endswith(".md"):
            try:
                os.remove(os.path.join(docs_dir, filename))
            except Exception:
                pass
                
    # Generate new filename following system documentation standards (flat structure, uppercase)
    safe_topic = re.sub(r'[^a-zA-Z0-9\s]', '', topic)
    safe_topic = re.sub(r'\s+', '_', safe_topic).strip().upper()
    filename = f"{kb_number}_{safe_topic}.md"
    file_path = os.path.join(docs_dir, filename)
    
    # Format markdown content cleanly
    content = f"# {topic}\n\n**Article ID:** {kb_number}  \n**Last Synchronized:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n\n{text}"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def delete_kb_from_filesystem(kb_number: str):
    docs_dir = "/home/james/SovereignOS/dna/docs"
    if not os.path.exists(docs_dir):
        return
    for filename in os.listdir(docs_dir):
        if filename.startswith(f"{kb_number}_") and filename.endswith(".md"):
            try:
                os.remove(os.path.join(docs_dir, filename))
            except Exception:
                pass

@router.get("/api/system/kb")
async def get_all_kb():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT sys_id, number, topic, short_description, workflow_state, 
               sys_created_on, sys_updated_on, u_source, u_tags 
        FROM kb_knowledge 
        ORDER BY sys_updated_on DESC
    """)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"kb_articles": rows}

@router.get("/api/system/kb/{sys_id}")
async def get_kb_detail(sys_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM kb_knowledge WHERE sys_id = ?", (sys_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="KB Article not found")
    return dict(row)

@router.post("/api/system/kb")
async def create_kb(req: KBSaveRequest):
    import uuid
    sys_id = f"sys_kb_{uuid.uuid4().hex}"
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Query all existing KB numbers to find the next sequential number
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
            
    new_number = f"KB{max_num + 1:04d}"
    
    c.execute("""
        INSERT INTO kb_knowledge (sys_id, number, topic, short_description, text, workflow_state, u_source, u_tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (sys_id, new_number, req.topic, req.short_description, req.text, req.workflow_state, req.u_source, req.u_tags))
    conn.commit()
    conn.close()
    
    # Write to filesystem for two-way sync
    try:
        sync_kb_to_filesystem(new_number, req.topic, req.text)
    except Exception as e:
        print(f"Error syncing KB to filesystem on create: {e}")
        
    return {"status": "success", "sys_id": sys_id, "number": new_number}

@router.put("/api/system/kb/{sys_id}")
async def update_kb(sys_id: str, req: KBSaveRequest):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT number FROM kb_knowledge WHERE sys_id = ?", (sys_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="KB Article not found")
    kb_number = row[0]
    
    c.execute("""
        UPDATE kb_knowledge
        SET topic = ?, short_description = ?, text = ?, workflow_state = ?, u_source = ?, u_tags = ?, sys_updated_on = CURRENT_TIMESTAMP
        WHERE sys_id = ?
    """, (req.topic, req.short_description, req.text, req.workflow_state, req.u_source, req.u_tags, sys_id))
    conn.commit()
    conn.close()
    
    # Write to filesystem for two-way sync
    try:
        sync_kb_to_filesystem(kb_number, req.topic, req.text)
    except Exception as e:
        print(f"Error syncing KB to filesystem on update: {e}")
        
    return {"status": "success", "sys_id": sys_id, "number": kb_number}

@router.delete("/api/system/kb/{sys_id}")
async def delete_kb(sys_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT number FROM kb_knowledge WHERE sys_id = ?", (sys_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="KB Article not found")
    kb_number = row[0]
    
    c.execute("DELETE FROM kb_knowledge WHERE sys_id = ?", (sys_id,))
    conn.commit()
    conn.close()
    
    # Remove file from filesystem if exists
    try:
        delete_kb_from_filesystem(kb_number)
    except Exception as e:
        print(f"Error deleting KB from filesystem: {e}")
        
    return {"status": "success", "message": f"KB Article {kb_number} deleted successfully."}


# ── Global Document Search & Configurable Directories ─────────────────────────

class SearchDirectoryModel(BaseModel):
    name: str
    path: str
    active: int = 1
    recursive: int = 1
    file_extensions: str = ".md,.txt"

@router.get("/api/system/search/directories")
async def get_search_directories(pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM sys_search_directory ORDER BY name ASC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"directories": rows}

@router.post("/api/system/search/directories")
async def create_search_directory(payload: SearchDirectoryModel, pilot: dict = Depends(require_pilot)):
    # Basic validation
    path = os.path.abspath(payload.path)
    if not os.path.exists(path) or not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Specified path does not exist or is not a directory.")
        
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    sys_id = uuid.uuid4().hex
    try:
        cur.execute("""
            INSERT INTO sys_search_directory (sys_id, name, path, active, recursive, file_extensions)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (sys_id, payload.name, path, payload.active, payload.recursive, payload.file_extensions))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="This directory path is already registered.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "sys_id": sys_id}

@router.put("/api/system/search/directories/{sys_id}")
async def update_search_directory(sys_id: str, payload: SearchDirectoryModel, pilot: dict = Depends(require_pilot)):
    path = os.path.abspath(payload.path)
    if not os.path.exists(path) or not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Specified path does not exist or is not a directory.")
        
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT sys_id FROM sys_search_directory WHERE sys_id=?", (sys_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Directory configuration not found.")
        
    try:
        cur.execute("""
            UPDATE sys_search_directory 
            SET name=?, path=?, active=?, recursive=?, file_extensions=?, sys_updated_on=CURRENT_TIMESTAMP
            WHERE sys_id=?
        """, (payload.name, path, payload.active, payload.recursive, payload.file_extensions, sys_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="This directory path is already registered by another configuration.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "sys_id": sys_id}

@router.delete("/api/system/search/directories/{sys_id}")
async def delete_search_directory(sys_id: str, pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT sys_id FROM sys_search_directory WHERE sys_id=?", (sys_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Directory configuration not found.")
        
    cur.execute("DELETE FROM sys_search_directory WHERE sys_id=?", (sys_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.get("/api/system/search")
async def search_documents(q: str, pilot: dict = Depends(require_pilot)):
    if not q or len(q.strip()) < 2:
        return {"results": []}
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM sys_search_directory WHERE active = 1")
    directories = [dict(r) for r in cur.fetchall()]
    conn.close()
    
    results = []
    query = q.lower().strip()
    
    for folder in directories:
        path = os.path.abspath(folder["path"])
        recursive = folder["recursive"] == 1
        name = folder["name"]
        exts = [e.strip().lower() for e in folder.get("file_extensions", ".md,.txt").split(",") if e.strip()]
        
        if not os.path.exists(path) or not os.path.isdir(path):
            continue
            
        for root, dirs, files in os.walk(path):
            if not recursive and os.path.abspath(root) != path:
                continue
                
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if exts and ext not in exts:
                    continue
                    
                full_path = os.path.abspath(os.path.join(root, file))
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        
                    if query in content.lower():
                        lines = content.splitlines()
                        matches = []
                        title = file
                        
                        # Extract first H1 for markdown title if available
                        if file.endswith(".md"):
                            for line in lines:
                                if line.strip().startswith("# "):
                                    title = line.replace("# ", "").strip()
                                    break
                                    
                        for idx, line in enumerate(lines):
                            if query in line.lower():
                                matches.append({
                                    "line_number": idx + 1,
                                    "content": line
                                })
                                if len(matches) >= 5:
                                    break
                                    
                        # Get file stats
                        try:
                            stat_res = os.stat(full_path)
                            f_size = stat_res.st_size
                            import datetime
                            f_mtime = datetime.datetime.fromtimestamp(stat_res.st_mtime, datetime.timezone.utc).isoformat()
                        except Exception:
                            f_size = 0
                            f_mtime = ""

                        results.append({
                            "title": title,
                            "filename": file,
                            "path": full_path,
                            "folder_name": name,
                            "folder_path": path,
                            "matches": matches,
                            "snippet": matches[0]["content"] if matches else "",
                            "size": f_size,
                            "last_modified": f_mtime
                        })
                except Exception as e:
                    print(f"Error searching file {full_path}: {e}")
                    
    return {"results": results}

@router.get("/api/system/search/file/content")
async def get_search_file_content(path: str, pilot: dict = Depends(require_pilot)):
    abs_path = os.path.abspath(path)
    
    # Security check: Ensure target path resides within an active search directory
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT path FROM sys_search_directory WHERE active = 1")
    allowed_paths = [os.path.abspath(r[0]) for r in cur.fetchall()]
    conn.close()
    
    is_allowed = False
    for allowed in allowed_paths:
        try:
            if os.path.commonpath([allowed, abs_path]) == allowed:
                is_allowed = True
                break
        except ValueError:
            continue
            
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Access denied. The target path is not within your active search directories.")
        
    if not os.path.exists(abs_path) or os.path.isdir(abs_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {"path": abs_path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/system/search/file/save")
async def save_search_file(payload: DocSaveRequest, pilot: dict = Depends(require_pilot)):
    abs_path = os.path.abspath(payload.path)
    
    # Security check: Ensure target path resides within an active search directory
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT path FROM sys_search_directory WHERE active = 1")
    allowed_paths = [os.path.abspath(r[0]) for r in cur.fetchall()]
    conn.close()
    
    is_allowed = False
    for allowed in allowed_paths:
        try:
            if os.path.commonpath([allowed, abs_path]) == allowed:
                is_allowed = True
                break
        except ValueError:
            continue
            
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Access denied. The target path is not within your active search directories.")
        
    try:
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(payload.content)
        return {"status": "success", "path": abs_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




