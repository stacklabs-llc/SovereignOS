import sqlite3

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
con = sqlite3.connect(DB_PATH)
con.row_factory = sqlite3.Row
cur = con.cursor()

print("--- PERSONA RECORDS ---")
personas = cur.execute("SELECT user_name, display_name, team, is_heel, rivalry_target_handle, avatar_url FROM persona WHERE team = 'CATNIPSYNDICATE'").fetchall()
for p in personas:
    print(dict(p))

print("\n--- MLB_SCHEDULE RECORDS ---")
sched = cur.execute("SELECT game_pk, home_team, away_team, status, room_state FROM mlb_schedule WHERE game_pk = 'CATNIPSYNDICATE_SIM_001'").fetchall()
for s in sched:
    print(dict(s))

print("\n--- GAME_PERSONA RECORDS ---")
game_p = cur.execute("""
    SELECT gp.game_pk, p.user_name, gp.overlay, gp.seat_state 
    FROM game_persona gp 
    JOIN persona p ON gp.persona_id = p.id 
    WHERE gp.game_pk = 'CATNIPSYNDICATE_SIM_001'
""").fetchall()
for gp in game_p:
    print(dict(gp))

print("\n--- M2M_PERSONA_ROOM RECORDS ---")
m2m = cur.execute("SELECT persona, room, prompt_overlay FROM m2m_persona_room WHERE room = 'CATNIPSYNDICATE_SIM_001'").fetchall()
for m in m2m:
    print(dict(m))

con.close()
