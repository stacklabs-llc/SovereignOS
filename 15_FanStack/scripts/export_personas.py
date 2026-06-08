import sqlite3
import json
import os

DB_PATH = '/home/james/SovereignOS/sovereign_now.db'
OUT_PATH = '/home/james/SovereignOS/01_Sovereign_Portal/public/personas.json'

def export_personas():
    if not os.path.exists(os.path.dirname(OUT_PATH)):
        os.makedirs(os.path.dirname(OUT_PATH))

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT c.name, p.u_system_prompt, p.u_llm_engine, p.u_deployment_zone, p.u_boggs_reactivity, p.u_cadence
        FROM cmdb_ci c
        JOIN cmdb_ci_ai_persona p ON c.sys_id = p.sys_id
    """)
    rows = [dict(r) for r in c.fetchall()]
    
    with open(OUT_PATH, 'w') as f:
        json.dump(rows, f, indent=2)
    print(f"Exported {len(rows)} personas to {OUT_PATH}")

if __name__ == '__main__':
    export_personas()
