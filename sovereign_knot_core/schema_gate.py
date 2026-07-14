#!/usr/bin/env python3
import sqlite3
import os
import sys

# Store original connect to avoid infinite recursion
_original_connect = sqlite3.connect
DB_PATH = os.path.join(os.path.dirname(__file__), "knot_state.db")

def authorizer_callback(action, arg1, arg2, dbname, trigger_name):
    # SQLite DDL actions: CREATE (1..8), DROP (10..17), ALTER (26)
    ddl_actions = {1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 26}
    if action in ddl_actions:
        print(f"[SCHEMA GATE] DDL schema alteration intercepted! Action code: {action}. Denying execution.", flush=True)
        # Update Compliance C variable to 0.0
        try:
            conn = _original_connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE sys_variable SET status_value = 0.0, last_verified_timestamp = datetime('now') WHERE variable_key = 'C'"
            )
            conn.commit()
            conn.close()
            print("[SCHEMA GATE] Compliance variable C set to 0.0.", flush=True)
        except Exception as e:
            print(f"[SCHEMA GATE ERROR] Failed to update compliance variable: {e}", file=sys.stderr, flush=True)
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK

def gated_connect(database, *args, **kwargs):
    conn = _original_connect(database, *args, **kwargs)
    # Only enforce schema gate on knot_state.db
    if "knot_state.db" in str(database):
        conn.set_authorizer(authorizer_callback)
    return conn

# Patch sqlite3 library connection builder
sqlite3.connect = gated_connect

if __name__ == "__main__":
    print("Executing schema gate UAT test verification...", flush=True)
    
    # 1. Reset compliance C to 1.0 first
    conn_reset = _original_connect(DB_PATH)
    conn_reset.execute("UPDATE sys_variable SET status_value = 1.0, last_verified_timestamp = datetime('now') WHERE variable_key = 'C'")
    conn_reset.commit()
    conn_reset.close()
    
    # 2. Open gated connection and attempt to create a table
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("CREATE TABLE schema_gate_uat_dummy (id INTEGER PRIMARY KEY)")
        conn.commit()
        print("UAT Failed: Table creation was not intercepted.", flush=True)
    except sqlite3.DatabaseError as e:
        print(f"UAT Passed: Blocked schema modification. Error: {e}", flush=True)
    finally:
        conn.close()
        
    # 3. Verify compliance variable C was set to 0.0
    conn_check = _original_connect(DB_PATH)
    c_val = conn_check.execute("SELECT status_value FROM sys_variable WHERE variable_key = 'C'").fetchone()[0]
    print(f"Verification: Compliance (C) = {c_val}", flush=True)
    conn_check.close()
    
    if c_val == 0.0:
        print("UAT SUCCESS: Compliance set to 0.0 successfully.", flush=True)
        sys.exit(0)
    else:
        print("UAT FAILURE: Compliance remains at nominal.", file=sys.stderr, flush=True)
        sys.exit(1)
