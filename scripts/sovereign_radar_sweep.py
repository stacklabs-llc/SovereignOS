#!/usr/bin/env python3
import subprocess
import sqlite3
import re
import datetime

DB_PATH = "/home/james/SovereignOS/scripts/sovereign_sdlc.db"

# Dictionary to map network hostnames explicitly to system CI IDs
HOSTNAME_TO_CI = {
    "Petkit_T3": "CI-05",
    "Petkit_T3.attlocal.net": "CI-05",
    "hq": "CI-NODE-73",
    "hq.attlocal.net": "CI-NODE-73",
    "artemis": "CI-NODE-64",
    "artemis.attlocal.net": "CI-NODE-64",
    "pegasus": "CI-PEGASUS",
    "pegasus.attlocal.net": "CI-PEGASUS",
    "grogu": "CI-NODE-170",
    "grogu.attlocal.net": "CI-NODE-170",
    "stimpy": "CI-NODE-157",
    "stimpy.attlocal.net": "CI-NODE-157",
    "Nest-Cam-indoor": "CI-NEST-CAM-INDOOR",
    "Nest-Cam-indoor.attlocal.net": "CI-NEST-CAM-INDOOR"
}

# The user's provided manual ATT jumpstart table, used to pre-warm the database
# before performing a live scan, ensuring offline devices are still mapped.
BOOTSTRAP_ATT_MAP = {
    "Petkit_T3": "192.168.1.65",
    "pegasus": "192.168.1.74",
    "hq": "clio.taila01894.ts.net",
    "artemis": "192.168.1.64",
    "grogu": "192.168.1.170",
    "stimpy": "192.168.1.157",
    "Nest-Cam-indoor": "192.168.1.252"
}

def update_db(ci_id, display_name, ip_address):
    """Upsert the CI into the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if exists
    cursor.execute("SELECT node_address FROM ci_registry WHERE ci_id = ?", (ci_id,))
    row = cursor.fetchone()
    
    timestamp = datetime.datetime.now().isoformat()
    
    if row:
        if row[0] != ip_address:
            print(f"[RADAR] Updating {ci_id} IP: {row[0]} -> {ip_address}")
            cursor.execute("""
                UPDATE ci_registry 
                SET node_address = ?, last_heartbeat = ?
                WHERE ci_id = ?
            """, (ip_address, timestamp, ci_id))
        else:
            # Just touch the heartbeat
            cursor.execute("""
                UPDATE ci_registry SET last_heartbeat = ? WHERE ci_id = ?
            """, (timestamp, ci_id))
    else:
        print(f"[RADAR] Discovering New Entity! Inserting {ci_id} ({display_name}) at {ip_address}")
        cursor.execute("""
            INSERT INTO ci_registry 
            (ci_id, display_name, ci_type, node_address, status, zone, degradation_mode)
            VALUES (?, ?, 'IOT_NODE', ?, 'ONLINE', 'SOVEREIGN', 'NONE')
        """, (ci_id, display_name, ip_address))
        
    conn.commit()
    conn.close()

def perform_radar_sweep():
    # 1. Warm up the DB with the absolute truth hardcoded ATT map
    for host, ip in BOOTSTRAP_ATT_MAP.items():
        if host in HOSTNAME_TO_CI:
            update_db(HOSTNAME_TO_CI[host], host, ip)

    # 2. Perform live sweep for volatility / drifts
    print("[RADAR] Engaging active nmap sweep across 192.168.1.0/24...")
    try:
        output = subprocess.check_output(
            ["nmap", "-sn", "192.168.1.0/24"], 
            stderr=subprocess.STDOUT, 
            timeout=120
        ).decode('utf-8')
    except subprocess.TimeoutExpired:
        print("[RADAR] CRITICAL: Nmap scan timed out.")
        return
    except Exception as e:
        print(f"[RADAR] SCAN FAILED: {str(e)}")
        return

    # Parse nmap output
    # Typical nmap line: Nmap scan report for Petkit_T3.attlocal.net (192.168.1.65)
    # Or: Nmap scan report for clio.taila01894.ts.net
    lines = output.split('\n')
    for line in lines:
        if "Nmap scan report for" in line:
            match = re.search(r"Nmap scan report for ([\w\.-]+) \((\d+\.\d+\.\d+\.\d+)\)", line)
            if match:
                hostname = match.group(1)
                ip = match.group(2)
            else:
                match_ip = re.search(r"Nmap scan report for (\d+\.\d+\.\d+\.\d+)", line)
                hostname = "UNKNOWN"
                ip = match_ip.group(1) if match_ip else None
                
            if ip and hostname in HOSTNAME_TO_CI:
                ci_id = HOSTNAME_TO_CI[hostname]
                update_db(ci_id, hostname.split('.')[0], ip)

    print("[RADAR] Sweep Complete. Topology updated.")

if __name__ == "__main__":
    perform_radar_sweep()
