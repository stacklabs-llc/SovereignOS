import sqlite3
db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT number, type, state, short_description FROM sovereign_tickets WHERE state IN (1, 2) ORDER BY state DESC, number;")
rows = cur.fetchall()
print(f"Found {len(rows)} unresolved tickets:")
for row in rows:
    print(f" - {row[0]} ({row[1]}) [state={row[2]}]: {row[3]}")
conn.close()
