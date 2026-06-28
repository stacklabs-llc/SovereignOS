import sqlite3
import sys
import uuid
from datetime import datetime

db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
print(f"Connecting to database at {db_path}...")

try:
    conn = sqlite3.connect(db_path, timeout=30.0)
    cursor = conn.cursor()
    
    # Create sys_policy table if not exists (though it likely does or will be created)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sys_policy (
        policy_key TEXT PRIMARY KEY,
        policy_name TEXT,
        description TEXT,
        compliance_enforcer TEXT,
        active INTEGER
    )
    """)
    
    # Insert compliance standard policy
    cursor.execute("""
    INSERT OR REPLACE INTO sys_policy (
        policy_key, policy_name, description, compliance_enforcer, active
    ) VALUES (
        'campsite_uat_walkthrough',
        'Campsite Walkthrough & Operational UAT Standard',
        'Requires all code deliveries to include an explicit, non-technical runnable UAT script and direct Tailnet URLs prior to story resolution.',
        'antigravity_qa_gate',
        1
    )
    """)
    
    # Generate unique ID for our module or check if it already exists by module_name
    cursor.execute("SELECT id FROM sys_module WHERE module_name = 'uat_compliance_loop'")
    row = cursor.fetchone()
    module_id = row[0] if row else uuid.uuid4().hex
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Insert compliance standard module into the existing table structure
    cursor.execute("""
    INSERT OR REPLACE INTO sys_module (
        id, module_name, display_name, description, icon, color, active, category, port, u_visible_on_main, sys_created_on, sys_updated_on
    ) VALUES (
        ?, 'uat_compliance_loop', 'Walkthrough Compliance Loop', 
        'Asynchronous validation daemon enforcing human-runnable UAT walkthroughs', 
        '📜', '#38bdf8', 1, 'compliance', NULL, 1, ?, ?
    )
    """, (module_id, now_str, now_str))
    
    conn.commit()
    conn.close()
    print("✓ Successfully seeded sys_policy and sys_module tables in database.")
except Exception as e:
    print(f"✗ Database update failed: {e}")
    sys.exit(1)
