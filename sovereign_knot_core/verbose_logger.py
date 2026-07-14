#!/usr/bin/env python3
import sqlite3
import hashlib
import time
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "knot_state.db")

def get_variables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT variable_key, status_value FROM sys_variable")
        rows = cursor.fetchall()
        return {row[0]: row[1] for row in rows}
    finally:
        conn.close()

def main():
    print("Starting verbose_logger.py daemon...", flush=True)
    last_vars = {}
    try:
        last_vars = get_variables()
        print(f"[VERBOSE LOGGER] Initial variables loaded: {last_vars}", flush=True)
    except Exception as e:
        print(f"[VERBOSE LOGGER ERROR] Failed to load initial variables: {e}", file=sys.stderr, flush=True)

    while True:
        try:
            current_vars = get_variables()
            shifted = False
            for k, val in current_vars.items():
                if k not in last_vars or last_vars[k] != val:
                    shifted = True
                    break
            
            if shifted:
                # Calculate S-Score
                a_val = current_vars.get("A", 0.0)
                pw_val = current_vars.get("PW", 0.0)
                t_val = current_vars.get("T", 0.0)
                c_val = current_vars.get("C", 0.0)
                pi_val = current_vars.get("PI", 0.0)

                a_status = 1.0 if a_val >= 1.0 else 0.0
                pw_status = 1.0 if (5.05 <= pw_val <= 5.15) else 0.0
                t_status = 1.0 if t_val >= 1.0 else 0.0
                c_status = 1.0 if c_val >= 1.0 else 0.0
                pi_status = 1.0 if pi_val >= 1.0 else 0.0

                s_score = (a_status * pw_status * t_status * c_status) * pi_status
                
                # Construct SHA-256 state hash
                state_str = f"A:{a_val}|PW:{pw_val}|T:{t_val}|C:{c_val}|PI:{pi_val}|S:{s_score}"
                state_hash = hashlib.sha256(state_str.encode('utf-8')).hexdigest()
                
                # Compile diff details
                diffs = []
                for k, v in current_vars.items():
                    if k not in last_vars:
                        diffs.append(f"{k}: created({v})")
                    elif last_vars[k] != v:
                        diffs.append(f"{k}: {last_vars[k]} -> {v}")
                details = "STATE SHIFT - [" + ", ".join(diffs) + "]"
                
                # Commit to audit breadcrumb
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                try:
                    cursor.execute(
                        "INSERT INTO audit_breadcrumb (state_hash, s_score, details, timestamp) VALUES (?, ?, ?, datetime('now'))",
                        (state_hash, s_score, details)
                    )
                    conn.commit()
                    print(f"[VERBOSE LOGGER] Shift logged. Hash: {state_hash[:8]} Details: {details}", flush=True)
                finally:
                    conn.close()
                
                last_vars = current_vars
        except Exception as e:
            print(f"[VERBOSE LOGGER ERROR] Loop exception: {e}", file=sys.stderr, flush=True)
            
        time.sleep(0.5)

if __name__ == "__main__":
    main()
