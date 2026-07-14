#!/usr/bin/env python3
import os
import sqlite3
import uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def run_migration():
    print("[*] Running migration: create_sys_gemini_instructions...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sys_gemini_instructions (
        sys_id TEXT PRIMARY KEY,
        gem_key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        instructions TEXT NOT NULL,
        sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. Create trigger for auto-updating sys_updated_on
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS trg_sys_gemini_instructions_update_timestamp
    AFTER UPDATE ON sys_gemini_instructions
    FOR EACH ROW
    WHEN NEW.sys_updated_on IS OLD.sys_updated_on
    BEGIN
        UPDATE sys_gemini_instructions SET sys_updated_on = CURRENT_TIMESTAMP WHERE rowid = NEW.rowid;
    END;
    """)
    
    # Define file paths and metadata
    instructions_meta = [
        {
            "gem_key": "gemini_custom",
            "title": "Gemini Custom Instructions",
            "description": "Personal Intelligence settings for Gemini Advanced co-pilot",
            "path": "/home/james/sovereign_inbox/pilot_drops/instructions_for _gemini.md",
            "fallback_content": """You are operating within the Sovereign OS architecture, built by a Certified Enterprise Specialist. You must prioritize precision over verbosity. Never generate generic, bloated Python boilerplate..."""
        },
        {
            "gem_key": "cypher_gem",
            "title": "Cypher Gem Instructions",
            "description": "The primary Pair-Programming Pilot and Sovereign Bro-Decoder Gem",
            "path": "/home/james/SovereignOS/dna/cypher_gem_instructions.md",
            "fallback_content": ""
        },
        {
            "gem_key": "creative_director_gem",
            "title": "StackLabs Creative Director Gem",
            "description": "StackLabs Chief Creative Director & Brand Evangelist prompt",
            "path": "/home/james/SovereignOS/dna/creative_director_gem_instructions.md",
            "fallback_content": ""
        },
        {
            "gem_key": "notebook_lm",
            "title": "NotebookLM Export Settings",
            "description": "Prompt parameters and instructions for syncing payload to Google Drive and NotebookLM",
            "path": "/home/james/SovereignOS/dna/notebook_lm_instructions.md",
            "fallback_content": ""
        }
    ]
    
    for meta in instructions_meta:
        content = ""
        # Try to read from file
        if os.path.exists(meta["path"]):
            try:
                with open(meta["path"], "r", encoding="utf-8") as f:
                    content = f.read()
                print(f"   [+] Loaded instructions for '{meta['gem_key']}' from file: {meta['path']}")
            except Exception as fe:
                print(f"   [!] Failed to read file {meta['path']}: {fe}")
        
        # Use fallback if file read failed or empty
        if not content:
            content = meta["fallback_content"]
            print(f"   [!] Using fallback content for '{meta['gem_key']}'")
            
        sys_id = uuid.uuid4().hex
        
        # Insert or replace the record
        cursor.execute("""
        INSERT INTO sys_gemini_instructions (sys_id, gem_key, title, description, instructions)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(gem_key) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            instructions = excluded.instructions,
            sys_updated_on = CURRENT_TIMESTAMP
        """, (sys_id, meta["gem_key"], meta["title"], meta["description"], content))
        
    conn.commit()
    conn.close()
    print("[*] Migration create_sys_gemini_instructions executed successfully.")

if __name__ == "__main__":
    run_migration()
