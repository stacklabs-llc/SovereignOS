import sqlite3

conn = sqlite3.connect("/home/james/SovereignOS/dna/sovereign_now.db")
cur = conn.cursor()
cur.execute("SELECT DISTINCT team FROM persona;")
print("Teams:", [r[0] for r in cur.fetchall()])
conn.close()
