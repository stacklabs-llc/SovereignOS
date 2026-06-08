import sqlite3
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
sys_id = "b4b7157a986443ada218c9a393b00b77"

try:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Update persona table
    cur.execute("""
        UPDATE persona 
        SET user_name = ?, display_name = ?, email_alias = ?, avatar_url = ?, updated_at = ?
        WHERE id = ?
    """, (
        "UncleStevieStan",
        "Uncle Stevie Stan",
        "unclesteviestan@gmail.com",
        "/avatars/uncle_stevie_stan.png",
        datetime.now().isoformat(),
        sys_id
    ))
    print(f"[+] Updated persona table for sys_id {sys_id}")
    
    # 2. Update cmdb_ci table
    cur.execute("""
        UPDATE cmdb_ci
        SET name = ?, sys_updated_on = ?
        WHERE sys_id = ?
    """, (
        "UncleStevieStan",
        datetime.now().isoformat(),
        sys_id
    ))
    print(f"[+] Updated cmdb_ci table for sys_id {sys_id}")
    
    conn.commit()
    conn.close()
    print("=== DATABASE SYNCHRONIZATION COMPLETE ===")
except Exception as e:
    print(f"[ERROR] Database synchronization failed: {e}")
