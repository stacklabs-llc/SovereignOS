import sqlite3
import os
from datetime import datetime

class FlowmercialPayloadGenerator:
    def __init__(self, db_path, payload_dir):
        self.db_path = db_path
        self.payload_dir = payload_dir

    def extract_inning_logs(self, game_pk, start_inning=1, end_inning=6):
        """Extracts raw chat logs for a specific game and inning range from the local Sovereign DB."""
        print(f"[OMEGA GATE] Extracting logs for GamePK {game_pk} (Innings {start_inning}-{end_inning})...")
        
        try:
            # Assuming a standard Sovereign SQLite log schema
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # This query grabs the raw text from the local db
            cursor.execute("""
                SELECT timestamp, persona_id, message_body, inning
                FROM chat_logs
                WHERE game_pk = ? AND inning BETWEEN ? AND ?
                ORDER BY timestamp ASC
            """, (game_pk, start_inning, end_inning))
            
            rows = cursor.fetchall()
            conn.close()
            
            return rows
        except Exception as e:
            print(f"Database extraction failed: {e}")
            return []

    def build_notebook_payload(self, game_pk, logs):
        """Formats the raw logs into a clean text file mapped specifically for NotebookLM ingestion."""
        if not logs:
            print("[OMEGA GATE] No logs found. Aborting payload generation.")
            return

        filename = f"Flowmercial_Payload_{game_pk}_{datetime.now().strftime('%Y%m%d%H%M')}.txt"
        filepath = os.path.join(self.payload_dir, filename)

        with open(filepath, 'w') as f:
            f.write(f"=== FANSTACK 7TH INNING STRETCH LOG EXTRACT ===\n")
            f.write(f"Game PK: {game_pk}\n")
            f.write(f"Innings: 1 through 6\n\n")
            f.write("NOTEBOOK LM DIRECTIVE:\n")
            f.write("Review the following siloed chat logs. Cross-reference them with current external MLB news. Identify the top 3 most unhinged or ironic comedic moments. Format the output as a 90s physical felt puppet Flowmercial prompt.\n\n")
            f.write("--- RAW LOGS ---\n")
            
            for row in logs:
                ts, persona, msg, inning = row
                f.write(f"[{ts}] (Inning {inning}) {persona}: {msg}\n")
                
        print(f"✅ [OMEGA GATE] Payload successfully synced to Google Drive: {filepath}")
        print(f"👉 ACTION REQUIRED: Drag {filename} into NotebookLM to bypass Vertex API toll.")

if __name__ == "__main__":
    # Standard Sovereign Paths
    DB_PATH = "/home/james/SovereignOS/sovereign_now.db" # Update if logs are isolated
    PAYLOAD_DIR = "/home/james/SovereignOS/dna/agents/PITCHMAN/payloads"
    
    # Dry Run Example
    extractor = FlowmercialPayloadGenerator(DB_PATH, PAYLOAD_DIR)
    
    # Mocking logs for the dry run since the database structure might not have chat_logs yet
    mock_logs = [
        ("2026-04-17 19:15", "barf", "Pete Alonso leaving was the worst thing to ever happen to this cursed franchise.", 2),
        ("2026-04-17 19:45", "barf", "I bet he's hitting a home run for the O's right now while we strike out looking.", 4),
        ("2026-04-17 20:10", "dirty_water_danny", "Stop crying Barf, drink your slop.", 6)
    ]
    
    extractor.build_notebook_payload("825019", mock_logs)
