import sqlite3

conn = sqlite3.connect("/home/james/SovereignOS/dna/sovereign_now.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT u_visual_style, u_avatar_prompt FROM cmdb_ci_ai_persona WHERE sys_id IN ('8bea7fb1511f4c9f8181c0b152b87999', '287a773da7f9446880eadc797d165a16')")
for r in cur.fetchall():
    print(dict(r))
conn.close()
