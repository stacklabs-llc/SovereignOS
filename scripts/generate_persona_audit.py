#!/usr/bin/env python3
import os
import sqlite3
from datetime import datetime, timezone

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
REPORT_PATH = "/home/james/SovereignOS/reports/system_persona_audit.md"

def main():
    if not os.path.exists(os.path.dirname(REPORT_PATH)):
        os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Fetch all personas
    cursor.execute("""
        SELECT p.*, u.role, u.active as user_active, u.email, u.tailscale_ip, u.u_nap_mist_balance
        FROM persona p
        LEFT JOIN sys_user u ON p.user_name = u.user_name
        ORDER BY p.user_name ASC
    """)
    personas = cursor.fetchall()
    
    # Fetch users without personas
    cursor.execute("""
        SELECT u.*
        FROM sys_user u
        LEFT JOIN persona p ON u.user_name = p.user_name
        WHERE p.user_name IS NULL
        ORDER BY u.user_name ASC
    """)
    orphan_users = cursor.fetchall()
    
    # Stats
    total_personas = len(personas)
    active_personas = sum(1 for p in personas if p['user_active'] == 1 or p['user_active'] is None)
    total_orphans = len(orphan_users)
    
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    md = []
    md.append("# Sovereign OS - System Persona & User Audit")
    md.append(f"**Generated:** {timestamp} UTC")
    md.append("")
    md.append("## Executive Summary")
    md.append(f"- **Total Registered Personas:** {total_personas}")
    md.append(f"- **Active User Accounts with Personas:** {active_personas}")
    md.append(f"- **Users without Personas (Orphans):** {total_orphans}")
    md.append("")
    md.append("## Persona Roster")
    md.append("| Username | Display Name | Role | Active | Boggs Level | LLM Engine | Style | Zone | Email |")
    md.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    
    for p in personas:
        active_str = "✅ Active" if p['user_active'] == 1 else ("❌ Inactive" if p['user_active'] == 0 else "N/A")
        role_str = p['role'] or "N/A"
        zone_str = p['u_deployment_zone'] or "N/A"
        email_str = p['email'] or p['email_alias'] or "N/A"
        engine_str = p['llm_engine'] or "N/A"
        style_str = p['u_visual_style'] or "N/A"
        boggs_level = p['boggs_level'] if p['boggs_level'] is not None else "N/A"
        
        md.append(f"| `{p['user_name']}` | **{p['display_name'] or p['user_name']}** | {role_str} | {active_str} | {boggs_level} | {engine_str} | `{style_str}` | `{zone_str}` | {email_str} |")
        
    md.append("")
    md.append("## Detailed Persona Profiles")
    
    for p in personas:
        md.append(f"### Profile: `{p['user_name']}` ({p['display_name'] or p['user_name']})")
        md.append(f"- **Role:** {p['role'] or 'N/A'}")
        md.append(f"- **Active:** {'Yes' if p['user_active'] == 1 else 'No'}")
        md.append(f"- **Boggs Level:** {p['boggs_level']}")
        md.append(f"- **LLM Engine:** {p['llm_engine'] or 'N/A'}")
        md.append(f"- **Visual Style:** `{p['u_visual_style'] or 'N/A'}`")
        md.append(f"- **Deployment Zone:** `{p['u_deployment_zone'] or 'N/A'}`")
        if p['tailscale_ip']:
            md.append(f"- **Tailscale IP:** `{p['tailscale_ip']}`")
        if p['u_nap_mist_balance'] is not None:
            md.append(f"- **NapMist Balance:** `{p['u_nap_mist_balance']}`")
        if p['avatar_url']:
            md.append(f"- **Avatar URL:** `{p['avatar_url']}`")
        md.append("")
        
        if p['system_prompt']:
            md.append("#### System Prompt")
            md.append("```text")
            md.append(p['system_prompt'].strip())
            md.append("```")
            md.append("")
            
        if p['deep_lore']:
            md.append("#### Deep Lore")
            md.append("> " + p['deep_lore'].strip().replace("\n", "\n> "))
            md.append("")
            
        if p['behavior_notes']:
            md.append("#### Behavior Notes")
            md.append(f"*{p['behavior_notes'].strip()}*")
            md.append("")
            
        md.append("---")
        
    if orphan_users:
        md.append("## Users without Associated Personas")
        md.append("| Username | Display Name | Role | Active | Email |")
        md.append("| --- | --- | --- | --- | --- |")
        for u in orphan_users:
            active_str = "✅ Active" if u['active'] == 1 else "❌ Inactive"
            md.append(f"| `{u['user_name']}` | **{u['display_name'] or u['user_name']}** | {u['role']} | {active_str} | {u['email'] or 'N/A'} |")
        md.append("")
        
    # Write to file
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
        
    print(f"✅ Persona audit report successfully compiled and written to: {REPORT_PATH}")
    conn.close()

if __name__ == "__main__":
    main()
