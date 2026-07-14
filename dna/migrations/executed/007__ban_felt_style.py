#!/usr/bin/env python3
# ==============================================================================
# Sovereign OS Database Migration: Ban style_felt and enforce style_clay
# Path: /home/james/SovereignOS/dna/migrations/incoming/007__ban_felt_style.py
# ==============================================================================
import sqlite3

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Update persona
    cursor.execute("UPDATE persona SET u_visual_style = 'style_clay' WHERE u_visual_style = 'style_felt'")
    print(f"Updated {cursor.rowcount} rows in persona")
    
    # Update cmdb_ci_ai_persona
    cursor.execute("UPDATE cmdb_ci_ai_persona SET u_visual_style = 'style_clay' WHERE u_visual_style = 'style_felt'")
    print(f"Updated {cursor.rowcount} rows in cmdb_ci_ai_persona")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()
