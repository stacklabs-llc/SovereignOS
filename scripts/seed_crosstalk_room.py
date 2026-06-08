# /home/james/SovereignOS/scripts/seed_crosstalk_room.py
import sqlite3
import uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
GAME_ID = "823048" # CIN @ STL

# Curated Multi-Tenant Cross-Talk Roster
CROSS_TALK_USERNAMES = [
    # 1. STL Team Advocate
    "stadium_phantom_stl",
    # 2. WeedStack Advocates
    "couch_lock_carl", "compliance_karen",
    # 3. Spite Slice Advocates
    "pizzabot_74", "warden_barb",
    # 4. Inkwell & Irony Advocates
    "cary_sterling", "vesper_vance",
    # 5. Wild Paws Advocates
    "barb_the_founder", "moscato_sally",
    # 6. StackLabs LLC Advocates
    "mando_enforcer", "decision_derby"
]

def seed_crosstalk():
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA busy_timeout = 30000;")
    cur = con.cursor()
    
    # 1. Promote CIN @ STL room state to active on the dashboard
    cur.execute("""
        UPDATE cmdb_ci_fanstack_room 
        SET room_state = 'active', boggs_level = 3 
        WHERE game_pk = ?
    """, (GAME_ID,))

    cur.execute("""
        UPDATE mlb_schedule
        SET room_state = 'active'
        WHERE game_pk = ?
    """, (GAME_ID,))
    
    # 2. Clear out any legacy staging assignments for this room
    cur.execute("DELETE FROM m2m_persona_room WHERE room = ?", (GAME_ID,))
    cur.execute("DELETE FROM game_persona WHERE game_pk = ?", (GAME_ID,))
    cur.execute("DELETE FROM game_chat WHERE game_pk = ?", (GAME_ID,))
    
    # 3. Double-seat each Advocate inside both legacy and current relational tables
    for username in CROSS_TALK_USERNAMES:
        cur.execute("SELECT id, display_name FROM persona WHERE user_name = ?", (username,))
        row = cur.fetchone()
        if not row:
            print(f"⚠️ Warning: Advocate '{username}' is missing from database. Skipping.")
            continue
        adv_id, display_name = row
        
        # Seat inside current Faction Room junction table (m2m_persona_room)
        m2m_id = uuid.uuid4().hex
        cur.execute("""
            INSERT OR REPLACE INTO m2m_persona_room (sys_id, persona, room, prompt_overlay)
            VALUES (?, ?, ?, ?)
        """, (m2m_id, adv_id, GAME_ID, f"Multi-Tenant Cross-Talk Event: Seated inside Game ID {GAME_ID}."))
        
        # Also seat inside game_persona table to satisfy join condition in load_fans()
        gp_id = uuid.uuid4().hex
        cur.execute("""
            INSERT OR REPLACE INTO game_persona (id, game_pk, persona_id, seat_state)
            VALUES (?, ?, ?, 'active')
        """, (gp_id, GAME_ID, adv_id))
        
        print(f"✅ Seated Advocate: @{username} in Faction Room {GAME_ID}")
        
    con.commit()
    con.close()
    print("🏆 Successfully completed multi-tenant cross-talk seeder run.")

if __name__ == "__main__":
    seed_crosstalk()
