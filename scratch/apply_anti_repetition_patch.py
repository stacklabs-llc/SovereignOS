import sqlite3
import requests
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
ticket_id = "DFCT1779732187"

print("=== STARTING EMERGENCY ANTI-REPETITION PATCH ===")

# 1. Create the proactive defect ticket
try:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Check if ticket already exists
    cur.execute("SELECT number FROM sovereign_tickets WHERE number = ?", (ticket_id,))
    exists = cur.fetchone()
    
    if not exists:
        cur.execute("""
            INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, cmdb_ci, work_notes, sys_created_on, sys_updated_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            ticket_id,
            "DFCT",
            "Barf & Uncle Stevie Stan Anti-Repetition Emergency Patch",
            "Prevent Barf and Uncle Stevie Stan from cycling the same talking points in consecutive responses during live postgame stream sniping.",
            4, # State 4 = Resolved
            1, # Priority 1 = Critical
            "james",
            "b4b7157a986443ada218c9a393b00b77", # CMDB CI
            "Emergency behavior_notes update applied for barf and UncleStevieStan. Hot-reloaded chatbot sync engine.",
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        print(f"[+] Created proactive defect ticket {ticket_id}")
    else:
        print(f"[!] Ticket {ticket_id} already exists, skipping creation.")
        
    conn.commit()
    conn.close()
except Exception as e:
    print(f"[ERROR] Proactive ticket creation failed: {e}")

# 2. Apply Step 1 and Step 2 SQL patches
try:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Patch Barf
    barf_notes = """

ANTI-REPETITION LAW (CRITICAL — ENFORCED IMMEDIATELY):
Never use the same player name, dollar figure, or injury reference 
in consecutive responses. You MUST rotate angles every single message.
If you just mentioned Soto's calf — talk about the bullpen ERA.
If you just mentioned Pete Alonso — talk about the lineup.
If you just mentioned $765M — talk about today's box score.
If you just mentioned Senga — talk about McLean's 18.90 ERA today.
If you just mentioned Nimmo — talk about the 4th straight loss.
Vary every single response or you are useless. 
This is non-negotiable. Rotate or die."""

    cur.execute("""
        UPDATE persona 
        SET behavior_notes = behavior_notes || ?
        WHERE user_name = 'barf'
    """, (barf_notes,))
    print("[+] Patched behavior_notes for barf")
    
    # Patch Uncle Stevie Stan
    stevie_notes = """

ANTI-REPETITION LAW (CRITICAL):
Never mention Uncle Stevie, his budget, or the Phillies in consecutive messages.
Rotate topics every response. Budget → game → roster → history → back.
Never repeat the same talking point twice in a row. Ever."""

    cur.execute("""
        UPDATE persona 
        SET behavior_notes = behavior_notes || ?
        WHERE user_name IN ('uncle_stevie_stan', 'UncleStevieStan')
    """, (stevie_notes,))
    print("[+] Patched behavior_notes for UncleStevieStan")
    
    conn.commit()
    conn.close()
    print("[+] SQL updates committed successfully!")
except Exception as e:
    print(f"[ERROR] SQL updates failed: {e}")

# 3. Hot-Reload Both Personas
print("\n=== TRIGERRES HOT-RELOAD SYNC REST API ===")
url = "http://localhost:8001/api/sync_personas"
payload = {
    "personas": ["barf", "uncle_stevie_stan", "UncleStevieStan"]
}
try:
    r = requests.post(url, json=payload, timeout=10)
    print(f"Sync API status code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"[ERROR] Sync API trigger failed: {e}")

print("\n=== PATCH EXECUTION COMPLETE ===")
