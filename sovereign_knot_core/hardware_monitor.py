#!/usr/bin/env python3
import time
import sqlite3
import subprocess
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "knot_state.db")

def check_undervoltage():
    try:
        res = subprocess.run(["vcgencmd", "get_throttled"], capture_output=True, text=True, check=True)
        out = res.stdout.strip()
        if '=' in out:
            val_str = out.split('=')[1].strip()
            val = int(val_str, 16)
            if (val & 0x1) != 0:
                return True
    except Exception:
        # Fallback check
        try:
            status_path = "/sys/class/power_supply/rpi_power_control/status"
            if os.path.exists(status_path):
                with open(status_path, "r") as f:
                    status = f.read().strip()
                    if "under" in status.lower():
                        return True
        except Exception:
            pass
    return False

def main():
    print("Starting hardware_monitor.py daemon...", flush=True)
    while True:
        try:
            uv = check_undervoltage()
            conn = sqlite3.connect(DB_PATH, timeout=5.0)
            cursor = conn.cursor()
            if uv:
                print("[HARDWARE MONITOR] Under-voltage detected! Flipping PW to 0.0.", flush=True)
                cursor.execute(
                    "UPDATE sys_variable SET status_value = 0.0, last_verified_timestamp = datetime('now') WHERE variable_key = 'PW'"
                )
                conn.commit()
            else:
                cursor.execute("SELECT status_value FROM sys_variable WHERE variable_key = 'PW'")
                row = cursor.fetchone()
                if row and row[0] == 0.0:
                    print("[HARDWARE MONITOR] Nominal voltage restored. Restoring PW to 5.1.", flush=True)
                    cursor.execute(
                        "UPDATE sys_variable SET status_value = 5.1, last_verified_timestamp = datetime('now') WHERE variable_key = 'PW'"
                    )
                    conn.commit()
            conn.close()
        except Exception as e:
            print(f"[HARDWARE MONITOR ERROR] {e}", file=sys.stderr, flush=True)
        time.sleep(0.5)

if __name__ == "__main__":
    main()
