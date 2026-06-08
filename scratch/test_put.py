import sqlite3
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
ticket_id = "STRY1779732182"
data = {"status": "RESOLVED", "work_notes": "Test closure"}

def reverse_map_state(status_str):
    if not status_str:
        return 1
    s = str(status_str).strip().upper()
    if s == "CLOSED": return 5
    if s in ("DONE", "RESOLVED"): return 4
    if s == "TESTING": return "Testing"
    if s == "IN_PROGRESS": return 2
    if s == "OPEN": return 1
    if s == "PLANNING": return 0
    return 1

try:
    conn = sqlite3.connect(DB_PATH)
    fields = []
    params = []
    
    if 'work_notes' in data:
        fields.append("work_notes = ?")
        params.append(data['work_notes'])
    if 'status' in data:
        fields.append("state = ?")
        params.append(reverse_map_state(data['status']))
        
    fields.append("sys_updated_on = ?")
    params.append(datetime.now().isoformat())
    
    params.append(ticket_id)
    params.append(ticket_id)
    
    query = f"UPDATE sovereign_tickets SET {', '.join(fields)} WHERE number = ? OR sys_id = ?"
    print("Query:", query)
    print("Params:", params)
    
    conn.execute(query, params)
    conn.commit()
    conn.close()
    print("Database update successful!")
except Exception as e:
    print("Database update failed with exception:", e)
