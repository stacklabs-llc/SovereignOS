import sqlite3
import os
from pathlib import Path

# Canonical Database Path (KI-038)
DB_PATH = Path('/home/james/SovereignOS/dna/sovereign_now.db')

def get_connection():
    """Returns a connection to the canonical SQLite database."""
    # Ensure parent directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Creates the UAT Agent Engine tables if they do not exist."""
    conn = get_connection()
    c = conn.cursor()
    
    # 1. sim_agents: Tracks active persona profiles, core emotional anchors and tension states
    c.execute("""
    CREATE TABLE IF NOT EXISTS sim_agents (
        sys_id TEXT PRIMARY KEY,
        persona_name TEXT UNIQUE NOT NULL,
        team TEXT NOT NULL,
        injury_paranoia REAL DEFAULT 0.0,
        transit_fatalism REAL DEFAULT 0.0,
        asset_depreciation REAL DEFAULT 0.0,
        tension REAL DEFAULT 0.0,
        sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. cultural_relics: Stores persistent shared symbols, historical trauma callbacks, and evolving room vocabulary
    c.execute("""
    CREATE TABLE IF NOT EXISTS cultural_relics (
        sys_id TEXT PRIMARY KEY,
        relic_name TEXT UNIQUE NOT NULL,
        current_status TEXT NOT NULL,
        ideological_value REAL DEFAULT 0.0,
        last_context TEXT,
        sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 3. telemetry_cache: Acts as an isolated staging ground for raw play data
    c.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_cache (
        sys_id TEXT PRIMARY KEY,
        game_pk TEXT NOT NULL,
        event_type TEXT NOT NULL,
        speed REAL DEFAULT 0.0,
        event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payload TEXT,
        sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    import uuid
    print("🚀 [UAT AGENT ENGINE: models.py] Initializing database tables...")
    try:
        init_db()
        print("✅ [UAT AGENT ENGINE: models.py] Tables created successfully.")
        
        # Verify and insert mock test values (Prove It Works Doctrine)
        conn = get_connection()
        c = conn.cursor()
        
        # Insert a dummy agent to prove write works
        dummy_id = str(uuid.uuid4())
        c.execute("""
            INSERT OR REPLACE INTO sim_agents (sys_id, persona_name, team, injury_paranoia, transit_fatalism, asset_depreciation, tension)
            VALUES (?, ?, ?, 1.5, 2.0, 0.5, 3.2);
        """, (dummy_id, 'test_agent_alpha', 'NYM'))
        
        conn.commit()
        
        # Query back
        c.execute("SELECT * FROM sim_agents WHERE persona_name = 'test_agent_alpha';")
        row = c.fetchone()
        
        if row:
            print(f"✅ [UAT AGENT ENGINE: models.py] Test agent readback: Name={row['persona_name']}, Team={row['team']}, Tension={row['tension']}")
        else:
            raise ValueError("Failed to retrieve dummy agent.")
            
        # Clean up dummy agent to maintain UAT database hygiene
        c.execute("DELETE FROM sim_agents WHERE persona_name = 'test_agent_alpha';")
        conn.commit()
        conn.close()
        
        print("✅ PASS: [models.py] executed successfully with zero errors.")
        
    except Exception as e:
        print(f"❌ FAIL: [models.py] encountered error during execution: {e}")
        import traceback
        traceback.print_exc()
        os._exit(1)
