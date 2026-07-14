# ==============================================================================
# Sovereign OS: Database Migration to Reconcile & Activate All Personas
# Path: /home/james/SovereignOS/dna/migrations/incoming/004__activate_and_reconcile_all_personas.py
# ==============================================================================
import sqlite3
import uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    print("[*] Starting full persona activation and reconciliation...")
    
    # 1. Fetch all personas from the persona table
    cur.execute("""
        SELECT id, user_name, display_name, team, system_prompt, deep_lore, 
               avatar_url, cadence, boggs_level, behavior_notes 
        FROM persona
    """)
    personas = cur.fetchall()
    
    reconciled_count = 0
    
    for row in personas:
        sys_id, username, display_name, team, system_prompt, deep_lore, avatar_url, cadence, boggs_level, behavior_notes = row
        
        bio = behavior_notes if behavior_notes else f"Brand Advocate for {team}."
        if not display_name:
            display_name = username.replace("_", " ").title()
            
        name_parts = display_name.split(" ")
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        # 1. Reconcile sys_user
        cur.execute("SELECT sys_id FROM sys_user WHERE sys_id = ? OR LOWER(user_name) = LOWER(?)", (sys_id, username))
        user_row = cur.fetchone()
        
        if user_row:
            user_id = user_row[0]
            cur.execute("""
                UPDATE sys_user SET
                    user_name = ?,
                    first_name = ?,
                    last_name = ?,
                    introduction = ?,
                    department = ?,
                    display_name = ?,
                    avatar_url = ?,
                    active = 1,
                    sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (username, first_name, last_name, bio, team, display_name, avatar_url, user_id))
        else:
            cur.execute("""
                INSERT INTO sys_user (
                    sys_id, user_name, first_name, last_name, title, introduction, department, active, role, display_name, avatar_url
                ) VALUES (?, ?, ?, ?, 'Advocate', ?, ?, 1, 'advocate', ?, ?)
            """, (sys_id, username, first_name, last_name, bio, team, display_name, avatar_url))
            
        # 2. Reconcile cmdb_ci
        cur.execute("SELECT sys_id FROM cmdb_ci WHERE sys_id = ? OR LOWER(name) = LOWER(?)", (sys_id, username))
        ci_row = cur.fetchone()
        
        if ci_row:
            ci_id = ci_row[0]
            cur.execute("""
                UPDATE cmdb_ci SET
                    name = ?,
                    assigned_to = ?,
                    operational_status = 1,
                    sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (username, team, ci_id))
        else:
            cur.execute("""
                INSERT INTO cmdb_ci (sys_id, name, sys_class_name, assigned_to, short_description, operational_status)
                VALUES (?, ?, 'cmdb_ci_ai_persona', ?, 'Sovereign Entity', 1)
            """, (sys_id, username, team))
            
        # 3. Reconcile cmdb_ci_ai_persona
        cur.execute("SELECT sys_id FROM cmdb_ci_ai_persona WHERE sys_id = ?", (sys_id,))
        ap_row = cur.fetchone()
        
        u_deployment_zone = "global"
        if team == "SPITESLICE":
            u_deployment_zone = "SPITESLICE_ZONE"
        elif team == "CARYGRANTINVESTIGATIONS":
            u_deployment_zone = "CARYGRANT_ZONE"
            
        if ap_row:
            cur.execute("""
                UPDATE cmdb_ci_ai_persona SET
                    u_system_prompt = ?,
                    u_deep_lore = ?,
                    u_deployment_zone = ?,
                    u_cadence = ?
                WHERE sys_id = ?
            """, (system_prompt, deep_lore, u_deployment_zone, cadence, sys_id))
        else:
            cur.execute("""
                INSERT INTO cmdb_ci_ai_persona (sys_id, u_boggs_reactivity, u_system_prompt, u_deployment_zone, u_cadence, u_deep_lore)
                VALUES (?, 'medium', ?, ?, ?, ?)
            """, (sys_id, system_prompt, u_deployment_zone, cadence, deep_lore))
            
        reconciled_count += 1
        
    conn.commit()
    conn.close()
    
    print(f"[SUCCESS] Reconciled and activated {reconciled_count} personas in the system.")

if __name__ == "__main__":
    main()
