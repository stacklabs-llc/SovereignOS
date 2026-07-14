#!/usr/bin/env python3
import os
import sqlite3

MAM_DB_PATH = "/home/james/SovereignOS/dna/mam_warehouse.db"

def run_migration():
    print(f"[*] Initializing MAM Warehouse database: {MAM_DB_PATH}")
    
    # 1. Connect and enable WAL
    conn = sqlite3.connect(MAM_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    journal_mode = cursor.fetchone()[0]
    print(f"   [+] Journal mode set to: {journal_mode}")
    
    # 2. Create media_assets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS media_assets (
        asset_id TEXT PRIMARY KEY,
        file_path TEXT UNIQUE NOT NULL,
        mime_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("   [+] Created table: media_assets")
    
    # 3. Create asset_metadata table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS asset_metadata (
        meta_id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL, -- JSON formatted string
        FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_asset_metadata_key ON asset_metadata(key);")
    print("   [+] Created table: asset_metadata and index")
    
    # 4. Create FTS5 virtual table for metadata and sync triggers
    try:
        cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS asset_metadata_fts USING fts5(
            key, 
            value, 
            content='asset_metadata', 
            content_rowid='meta_id'
        );
        """)
        
        # Sync triggers for FTS5
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trg_asset_metadata_ai AFTER INSERT ON asset_metadata BEGIN
            INSERT INTO asset_metadata_fts(rowid, key, value) VALUES (new.meta_id, new.key, new.value);
        END;
        """)
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trg_asset_metadata_ad AFTER DELETE ON asset_metadata BEGIN
            INSERT INTO asset_metadata_fts(asset_metadata_fts, rowid, key, value) VALUES('delete', old.meta_id, old.key, old.value);
        END;
        """)
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trg_asset_metadata_au AFTER UPDATE ON asset_metadata BEGIN
            INSERT INTO asset_metadata_fts(asset_metadata_fts, rowid, key, value) VALUES('delete', old.meta_id, old.key, old.value);
            INSERT INTO asset_metadata_fts(rowid, key, value) VALUES (new.meta_id, new.key, new.value);
        END;
        """)
        print("   [+] Created FTS5 virtual table and triggers for asset_metadata")
    except sqlite3.OperationalError as e:
        print(f"   [!] FTS5 table initialization skipped or failed: {e}")
        
    # 5. Create tmi_rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tmi_rules (
        rule_id TEXT PRIMARY KEY,
        condition TEXT NOT NULL,
        conditions_json TEXT, -- JSON logic string
        action TEXT NOT NULL,
        target_asset_type TEXT NOT NULL,
        active_status INTEGER DEFAULT 1,
        sys_created_on DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("   [+] Created table: tmi_rules")
    
    # 6. Create media_pins table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS media_pins (
        pin_id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        pos_x REAL NOT NULL,
        pos_y REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        label TEXT,
        sys_created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
    );
    """)
    print("   [+] Created table: media_pins")
    
    conn.commit()
    conn.close()
    print("[*] Migration 011__initialize_mam_warehouse completed successfully.")

if __name__ == "__main__":
    run_migration()
