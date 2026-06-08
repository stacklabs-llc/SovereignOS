#!/usr/bin/env python3
import sqlite3
import os
import json

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
OUTPUT_PATH = "/home/james/.gemini/antigravity/brain/c884cd99-e08b-49a8-8007-d65f9e56c51f/gonzas_advocates_report.md"

def compile_report():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        personas = cur.execute("""
            SELECT user_name, display_name, team, llm_engine, boggs_level, cadence, 
                   avatar_url, color, system_prompt, deep_lore, behavior_notes, governance,
                   is_heel, rivalry_target_handle, u_deployment_zone
            FROM persona 
            WHERE team = 'GONZASCONVENIENCESTORECANTINA'
            ORDER BY user_name
        """).fetchall()

        report = []
        report.append("# 🏪 Gonzas Convenience Store & Cantina - Advocate Registry")
        report.append(f"This report lists all registered AI commentary advocates aligned with the **Gonzas Convenience Store & Cantina** stack.\n")
        report.append("## Overview Table\n")
        report.append("| Username | Display Name | Engine | Volatility (Boggs) | Cadence | Accent Color | Heel? |")
        report.append("|---|---|---|---|---|---|---|")
        
        for p in personas:
            p_dict = dict(p)
            heel_str = "😈 Yes" if p_dict.get("is_heel") else "😇 No"
            report.append(f"| @{p_dict.get('user_name')} | {p_dict.get('display_name')} | `{p_dict.get('llm_engine')}` | {p_dict.get('boggs_level')}/5 | {p_dict.get('cadence')} | `{p_dict.get('color')}` | {heel_str} |")
        
        report.append("\n---\n")
        report.append("## Detailed Advocate Profiles\n")

        for p in personas:
            p_dict = dict(p)
            report.append(f"### 👤 @{p_dict.get('user_name')} ({p_dict.get('display_name')})")
            report.append(f"- **Alignment/Team:** `{p_dict.get('team')}`")
            report.append(f"- **LLM Engine:** `{p_dict.get('llm_engine')}`")
            report.append(f"- **Boggs Volatility Rating:** {p_dict.get('boggs_level')}/5")
            report.append(f"- **Cadence Config:** {p_dict.get('cadence')}")
            report.append(f"- **UI Accent Color:** <span style='color:{p_dict.get('color')}'>●</span> `{p_dict.get('color')}`")
            report.append(f"- **Avatar Image Route:** `{p_dict.get('avatar_url')}`")
            if p_dict.get('rivalry_target_handle'):
                report.append(f"- **Rivalry Target:** @{p_dict.get('rivalry_target_handle')}")
            if p_dict.get('u_deployment_zone'):
                report.append(f"- **Deployment Zone:** `{p_dict.get('u_deployment_zone')}`")
            
            report.append(f"\n#### 📖 Biography & Deep Lore")
            lore = p_dict.get('deep_lore') or "No deep lore defined."
            report.append(f"```text\n{lore.strip()}\n```")

            report.append(f"\n#### 🛡️ Cognitive System Instructions")
            sys_prompt = p_dict.get('system_prompt') or "No system prompt defined."
            report.append(f"```text\n{sys_prompt.strip()}\n```")

            report.append(f"\n#### 🎭 Behavioral & Tone Guidelines")
            notes = p_dict.get('behavior_notes') or "No behavior notes defined."
            report.append(f"```text\n{notes.strip()}\n```")

            report.append(f"\n#### ⚖️ Governance & Guardrails")
            gov = p_dict.get('governance') or "No governance defined."
            report.append(f"```text\n{gov.strip()}\n```")
            
            report.append("\n" + "="*80 + "\n")

        with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
            out.write("\n".join(report))
        print(f"✅ Gonzas Advocates Report written successfully to {OUTPUT_PATH}")

    except Exception as e:
        print(f"❌ Failed to query database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    compile_report()
