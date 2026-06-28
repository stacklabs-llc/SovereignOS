import sqlite3

conn = sqlite3.connect("/home/james/SovereignOS/dna/sovereign_now.db")
cur = conn.cursor()

cur.execute("SELECT sys_id, name, sys_class_name, assigned_to FROM cmdb_ci;")
for row in cur.fetchall():
    print(row)

conn.close()
