#!/usr/bin/env python3
import socket
import time
import subprocess
import uuid
import sqlite3
import os
import datetime

# Mando Watchdog Configuration
TARGET_HOST = "clio.taila01894.ts.net"  # Tailscale hostname, NO hardcoded IP (KI-001)
CHECK_INTERVAL = 30  # Polling interval in seconds
COOLDOWN_PERIOD = 3600  # 1 hour cooldown per incident / service

# DB Path (KI-038)
DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

# Services to monitor
# Services to monitor with their designated identity verification keywords
SERVICES = {
    "Sovereign OS Portal": {
        "port": 3000,
        "ci": "SovereignPortal",
        "keyword": "Sovereign",
        "restart_cmd": "cd /home/james/SovereignOS/01_Sovereign_Portal && nohup npm run dev -- --force --port 3000 >> /home/james/SovereignOS/logs/vite_portal.log 2>&1 &"
    },
    "SamTracker Frontend": {
        "port": 3004, 
        "ci": "SamTracker",
        "keyword": "SamTracker",
        "restart_cmd": "cd /home/james/SovereignOS/14_SamTracker && nohup npm run dev -- --force --port 3004 >> /home/james/SovereignOS/logs/vite_sam.log 2>&1 &"
    },
    "SamTracker Backend": {
        "port": 8083,
        "ci": "SamTracker",
        "keyword": "fastapi",
        "restart_cmd": "cd /home/james/SovereignOS && nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/sam_tracker_server.py >> /home/james/SovereignOS/logs/sam_tracker.log 2>&1 &"
    },
    "Sovereign Core API": {
        "port": 8090,
        "ci": "SovereignCore",
        "keyword": "fastapi",
        "restart_cmd": "cd /home/james/SovereignOS && nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/sovereign_core_api.py >> /home/james/SovereignOS/logs/sovereign_core_8090.log 2>&1 &"
    },
    "SDLC Ticketing Server": {
        "port": 8095,
        "ci": "SDLC",
        "keyword": "sdlc",
        "restart_cmd": "cd /home/james/SovereignOS && nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/sdlc_portal_server.py >> /home/james/SovereignOS/logs/sdlc_portal_server.log 2>&1 &"
    },
    "Aether Vet Telemedicine": {
        "port": 3015,
        "ci": "AetherVet",
        "keyword": "AetherVet",
        "restart_cmd": "cd /home/james/SovereignOS/20_AetherVet && nohup npm run dev -- --host 0.0.0.0 --port 3015 >> /home/james/SovereignOS/logs/aether_vet.log 2>&1 &"
    },
    "Sovereign Media": {
        "port": 3008,
        "ci": "SovereignMedia",
        "keyword": "media",
        "restart_cmd": "cd /home/james/SovereignOS/02_Sovereign_Media && nohup npm run dev -- --host 0.0.0.0 --port 3008 >> /home/james/SovereignOS/logs/vite_cinema.log 2>&1 &"
    },
    "WeedStack Content Poller": {
        "port": None,
        "script": "scripts/weedstack_content_poller.py",
        "ci": "WeedStackPoller",
        "restart_cmd": "cd /home/james/SovereignOS && nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/weedstack_content_poller.py >> /home/james/SovereignOS/logs/weedstack_poller.log 2>&1 &"
    }
}

active_incidents = {}
active_hardware_incident = None

# PAA-7 Port Authority Module State
paa7_failures = {}        # Maps port -> consecutive failure count
active_paa7_tickets = {}   # Maps port -> STRY ticket number

def verify_port_identity(port, expected_keyword):
    """PAA-7 identity verification check: Probes port and looks for expected keyword."""
    import urllib.request
    import ssl
    
    # Check if port is open first
    if not check_port("127.0.0.1", port):
        return False, "DARK"
        
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Try standard root path first
    url = f"http://127.0.0.1:{port}/"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'PAA7-Watchdog/1.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=2) as response:
            content = response.read().decode('utf-8', errors='ignore')
            if expected_keyword.lower() in content.lower():
                return True, "OK"
    except Exception:
        pass
        
    # Try /docs endpoint for backend services
    url_docs = f"http://127.0.0.1:{port}/docs"
    try:
        req = urllib.request.Request(url_docs, headers={'User-Agent': 'PAA7-Watchdog/1.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=2) as response:
            content = response.read().decode('utf-8', errors='ignore')
            if "swagger" in content.lower() or "redoc" in content.lower() or expected_keyword.lower() in content.lower():
                return True, "OK"
    except Exception:
        pass
        
    return False, "SQUATTERS"

def generate_paa7_stry_ticket(port, incident_type, desc):
    """Generates a STRY ticket in the database for a Port Authority drift/squatter violation."""
    sys_id = uuid.uuid4().hex
    import random
    stry_num = f"STRY{random.randint(1780000, 1789999)}"
    short_desc = f"PAA-7 PORT AUTHORITY ALERT: Port {port} {incident_type}"
    
    sql = """
    INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on) 
    VALUES (?, ?, 'STRY', ?, ?, 2, 2, 'james', 'PortAuthority', 'Port Authority PAA-7 integrity violation detected.', ?, ?);
    """
    now_str = datetime.datetime.now().isoformat()
    if execute_db_query(sql, (sys_id, stry_num, short_desc, desc, now_str, now_str)):
        print(f"[PAA-7] Generated ticket {stry_num} for port {port} violation: {incident_type}")
        return stry_num
    return None

def resolve_paa7_stry_ticket(stry_num, port):
    """Auto-resolves/closes the PAA-7 STRY ticket when the port returns to manifest compliance."""
    print(f"[PAA-7] Port {port} recovered. Resolving ticket {stry_num}...")
    sql = "UPDATE sovereign_tickets SET state = 4, sys_updated_on = ?, work_notes = work_notes || char(10) || '[PAA-7 Watchdog] Port integrity recovered and verified. Resolving ticket.' WHERE number = ?;"
    execute_db_query(sql, (datetime.datetime.now().isoformat(), stry_num))

def check_port(host, port):
    """Check if a TCP port is open. If running locally on Clio, check 127.0.0.1 directly."""
    target = "127.0.0.1" if os.path.exists(DB_PATH) else host
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    try:
        result = sock.connect_ex((target, port))
        return result == 0
    except Exception:
        return False
    finally:
        sock.close()

def check_process_running(script_name):
    """Check if a process is running locally or via SSH fallback."""
    target_cmd = f"pgrep -f {script_name}"
    if os.path.exists(DB_PATH):
        try:
            res = subprocess.run(target_cmd, shell=True, capture_output=True)
            return res.returncode == 0
        except Exception:
            return False
    else:
        ssh_cmd = [
            "ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes",
            f"james@{TARGET_HOST}", target_cmd
        ]
        try:
            res = subprocess.run(ssh_cmd, capture_output=True)
            return res.returncode == 0
        except Exception:
            return False


def execute_db_query(sql, params=()):
    """Executes a database query locally or via SSH fallback."""
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Local SQL Error: {e}")
            return False
    else:
        # Fallback to SSH via Tailscale Hostname (KI-001)
        formatted_sql = sql
        for p in params:
            if isinstance(p, str):
                escaped_p = p.replace("'", "''")
                formatted_sql = formatted_sql.replace("?", f"'{escaped_p}'", 1)
            else:
                formatted_sql = formatted_sql.replace("?", str(p), 1)
        ssh_cmd = [
            "ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes",
            f"james@{TARGET_HOST}",
            f'sqlite3 {DB_PATH} "{formatted_sql.strip()}"'
        ]
        try:
            subprocess.run(ssh_cmd, check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"SSH DB Error: {e.stderr.decode('utf-8')}")
            return False

def generate_service_ticket(service_name, ci):
    """Generates an INC ticket for a down port."""
    sys_id = uuid.uuid4().hex
    import random
    inc_num = f"INC{random.randint(1000000, 9999999)}"
    short_desc = f"CRITICAL: {service_name} Offline"
    desc = f"The Mando Watchdog detected that {service_name} is no longer responding on its designated port on {TARGET_HOST}."
    
    sql = """
    INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on) 
    VALUES (?, ?, 'INC', ?, ?, 1, 1, 'Antigravity', ?, 'Ticket auto-generated by Mando Watchdog.', ?, ?);
    """
    now_str = datetime.datetime.now().isoformat()
    if execute_db_query(sql, (sys_id, inc_num, short_desc, desc, ci, now_str, now_str)):
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Successfully generated ticket {inc_num} for {service_name}.")
        return inc_num
    return None

def resolve_service_ticket(inc_num, service_name):
    """Auto-resolves an INC ticket when service recovers."""
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {service_name} recovered. Auto-resolving ticket {inc_num}...")
    sql = "UPDATE sovereign_tickets SET state = 4, sys_updated_on = ?, work_notes = work_notes || char(10) || '[Mando Watchdog] Service recovered. Auto-resolving ticket.' WHERE number = ?;"
    execute_db_query(sql, (datetime.datetime.now().isoformat(), inc_num))

# Hardware Metrics Resolution
def get_cpu_load():
    try:
        with open("/proc/loadavg", "r") as f:
            return float(f.read().split()[0])
    except Exception:
        return 0.0

def get_memory_usage():
    try:
        meminfo = {}
        with open("/proc/meminfo", "r") as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2:
                    meminfo[parts[0].replace(":", "")] = int(parts[1])
        total = meminfo.get("MemTotal", 1)
        free = meminfo.get("MemFree", 0)
        buffers = meminfo.get("Buffers", 0)
        cached = meminfo.get("Cached", 0)
        used = total - (free + buffers + cached)
        ram_percent = (used / total) * 100
        
        swap_total = meminfo.get("SwapTotal", 0)
        swap_free = meminfo.get("SwapFree", 0)
        swap_used = swap_total - swap_free
        swap_percent = (swap_used / swap_total) * 100 if swap_total > 0 else 0
        return ram_percent, swap_percent
    except Exception:
        return 0.0, 0.0

def get_cpu_temp():
    try:
        for i in range(10):
            try:
                with open(f"/sys/class/thermal/thermal_zone{i}/type", "r") as f:
                    t_type = f.read().strip()
                if "cpu" in t_type.lower() or "x86_pkg_temp" in t_type.lower():
                    with open(f"/sys/class/thermal/thermal_zone{i}/temp", "r") as f:
                        return float(f.read().strip()) / 1000.0
            except FileNotFoundError:
                break
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return float(f.read().strip()) / 1000.0
    except Exception:
        return 0.0

def get_top_cpu_processes():
    try:
        cmd = "ps -eo pcpu,pid,comm --sort=-pcpu | head -n 6"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return res.stdout.strip()
    except Exception as e:
        return str(e)

def monitor_hardware():
    """Checks hardware thresholds and raises incident tickets if breached."""
    global active_hardware_incident
    
    cpu_load = get_cpu_load()
    ram_use, swap_use = get_memory_usage()
    cpu_temp = get_cpu_temp()
    
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Telemetry check -> CPU Load: {cpu_load:.2f}, RAM: {ram_use:.1f}%, Swap: {swap_use:.1f}%, Temp: {cpu_temp:.1f}°C")
    
    # Thresholds
    breached = []
    if cpu_load > 20.0:
        breached.append(f"CPU Load ({cpu_load:.2f} > 20)")
    if ram_use > 85.0:
        breached.append(f"RAM Usage ({ram_use:.1f}% > 85%)")
    if swap_use > 90.0:
        breached.append(f"Swap Usage ({swap_use:.1f}% > 90%)")
    if cpu_temp > 80.0:
        breached.append(f"CPU Temp ({cpu_temp:.1f}°C > 80°C)")
        
    if breached:
        if not active_hardware_incident or (time.time() - active_hardware_incident["time"]) > COOLDOWN_PERIOD:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Hardware threshold breached: {', '.join(breached)}! Generating incident...")
            
            sys_id = uuid.uuid4().hex
            import random
            inc_num = f"INC{random.randint(1000000, 9999999)}"
            
            top_procs = get_top_cpu_processes()
            
            # Find the top process name to suggest killing
            top_proc_name = "unknown"
            try:
                lines = top_procs.strip().split("\n")
                if len(lines) > 1:
                    top_proc_name = lines[1].split()[-1]
            except Exception:
                pass
                
            short_desc = f"CRITICAL: Hardware Telemetry Breached - {', '.join(breached)}"
            desc = (
                f"Sovereign Hardware Telemetry Alert!\n"
                f"Metrics Breached:\n"
                f"- CPU Load: {cpu_load:.2f} (Threshold: 20.0)\n"
                f"- RAM Usage: {ram_use:.1f}% (Threshold: 85.0%)\n"
                f"- Swap Usage: {swap_use:.1f}% (Threshold: 50.0%)\n"
                f"- CPU Temp: {cpu_temp:.1f}°C (Threshold: 80.0°C)\n\n"
                f"Top CPU Consuming Processes:\n"
                f"{top_procs}\n\n"
                f"Recommended Mitigation:\n"
                f"Consider killing process '{top_proc_name}' immediately to alleviate load."
            )
            
            sql = """
            INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on) 
            VALUES (?, ?, 'INC', ?, ?, 1, 1, 'Antigravity', 'cmdb_ci_hardware', 'Hardware threshold breach auto-generated ticket.', ?, ?);
            """
            now_str = datetime.datetime.now().isoformat()
            if execute_db_query(sql, (sys_id, inc_num, short_desc, desc, now_str, now_str)):
                active_hardware_incident = {"time": time.time(), "inc_num": inc_num}
    else:
        if active_hardware_incident:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Hardware telemetry recovered. Auto-resolving ticket {active_hardware_incident['inc_num']}...")
            sql = "UPDATE sovereign_tickets SET state = 4, sys_updated_on = ?, work_notes = work_notes || char(10) || '[Mando Watchdog] Hardware metrics recovered within limits.' WHERE number = ?;"
            execute_db_query(sql, (datetime.datetime.now().isoformat(), active_hardware_incident["inc_num"]))
            active_hardware_incident = None

def main():
    print("=========================================")
    print("   Sovereign Watchdog (Project Mando)    ")
    print("=========================================")
    print(f"Target: {TARGET_HOST}")
    print(f"Polling Interval: {CHECK_INTERVAL}s")
    print("Monitoring services and hardware...")
    
    while True:
        now = time.time()
        
        # Check Hardware Telemetry
        monitor_hardware()
        
        # Check Port Services
        for name, info in SERVICES.items():
            port = info.get("port")
            script = info.get("script")
            ci = info["ci"]
            restart_cmd = info.get("restart_cmd")
            
            if port is not None:
                is_up = check_port(TARGET_HOST, port)
            elif script is not None:
                is_up = check_process_running(script)
            else:
                is_up = True
            
            if not is_up:
                incident = active_incidents.get(name)
                last_ticket_time = incident["time"] if incident else 0
                if (now - last_ticket_time) > COOLDOWN_PERIOD:
                    desc_str = f"Port {port}" if port is not None else f"Process {script}"
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {desc_str} down for {name}. Generating INC and attempting Auto-Restart...")
                    
                    inc_num = generate_service_ticket(name, ci)
                    if inc_num:
                        active_incidents[name] = {"time": now, "inc_num": inc_num}
                    
                    if restart_cmd:
                        ssh_restart = [
                            "ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", 
                            f"james@{TARGET_HOST}", restart_cmd
                        ]
                        try:
                            subprocess.run(ssh_restart, check=True, capture_output=True)
                        except Exception as e:
                            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Auto-Restart execution failed: {e}")
                            
                        time.sleep(10)
                        
                        if port is not None:
                            is_up_now = check_port(TARGET_HOST, port)
                        elif script is not None:
                            is_up_now = check_process_running(script)
                        else:
                            is_up_now = True
                    
                        if is_up_now:
                            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Auto-Restart successful for {name}! Resolving ticket...")
                            if inc_num:
                                resolve_service_ticket(inc_num, name)
                                del active_incidents[name]
                        else:
                            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Auto-Restart failed. {name} is still down.")
            else:
                if name in active_incidents:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {name} has recovered!")
                    inc_num = active_incidents[name]["inc_num"]
                    resolve_service_ticket(inc_num, name)
                    del active_incidents[name]
            
            # --- PAA-7 Integrity & Identity Checks ---
            if port is not None and "keyword" in info:
                ok, status = verify_port_identity(port, info["keyword"])
                if not ok:
                    paa7_failures[port] = paa7_failures.get(port, 0) + 1
                    print(f"[PAA-7] Port {port} failed integrity check ({status}). Failure count: {paa7_failures[port]}/3")
                    if paa7_failures[port] >= 3:
                        if port not in active_paa7_tickets:
                            desc = f"PAA-7 Port Authority Alert!\nService: {name}\nPort: {port}\nStatus: {status}\n3 consecutive cycles of integrity drift/squatting detected. Action Required: Realign service port binding."
                            t_num = generate_paa7_stry_ticket(port, status, desc)
                            if t_num:
                                active_paa7_tickets[port] = t_num
                else:
                    paa7_failures[port] = 0
                    if port in active_paa7_tickets:
                        resolve_paa7_stry_ticket(active_paa7_tickets[port], port)
                        del active_paa7_tickets[port]

        # --- Port 8080 Squatting Protection ---
        port_8080_open = check_port("127.0.0.1", 8080)
        if port_8080_open:
            paa7_failures[8080] = paa7_failures.get(8080, 0) + 1
            print(f"[PAA-7] Unauthorized squatting detected on Port 8080! Failure count: {paa7_failures[8080]}/3")
            if paa7_failures[8080] >= 3:
                if 8080 not in active_paa7_tickets:
                    desc = "PAA-7 Port Squatting Alert!\nPort: 8080\nStatus: SQUATTERS\nAn unauthorized process has squatted on port 8080 for 3 consecutive poll cycles. Action Required: Identify and terminate the squatting process."
                    t_num = generate_paa7_stry_ticket(8080, "SQUATTERS", desc)
                    if t_num:
                        active_paa7_tickets[8080] = t_num
        else:
            paa7_failures[8080] = 0
            if 8080 in active_paa7_tickets:
                resolve_paa7_stry_ticket(active_paa7_tickets[8080], 8080)
                del active_paa7_tickets[8080]
                    
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
