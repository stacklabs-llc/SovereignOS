import sqlite3
import uuid
from datetime import date

DB_PATH = '/home/james/SovereignOS/dna/sovereign_now.db'

# Personas whose game-room clones must NEVER be inserted into sys_user.
# Mean Gene is a SYSTEM_MODERATOR subroutine (LLM-as-a-Judge), not a human
# persona. Inserting him into sys_user caused the April 2026 API Meltdown —
# the engine loaded his clones as active sports fans, and he began screaming
# "ILLEGAL TAG-TEAM DOGPILE!" at every pitch across 15 simultaneous games,
# burning the entire Gemini quota. He lives in cmdb_ci_ai_persona only.
SUBROUTINE_PERSONAS = {'mean_gene'}

SKIP_STATUSES = ('Postponed', 'Suspended', 'Cancelled', 'Cancelled by Rain')

def get_live_games() -> list[str]:
    """
    Returns today's gamePks from mlb_schedule, excluding any Postponed /
    Suspended / Cancelled games. Run sync_mlb_schedule.py first during
    daily prep to ensure statuses are current.
    """
    today = date.today().isoformat()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    placeholders = ','.join(['?' for _ in SKIP_STATUSES])
    c.execute(
        f"SELECT game_pk FROM mlb_schedule WHERE game_date=? AND status NOT IN ({placeholders}) ORDER BY game_pk",
        (today, *SKIP_STATUSES)
    )
    games = [row[0] for row in c.fetchall()]
    conn.close()
    print(f"[populate_rooms] {len(games)} active games for {today}: {games}")
    return games

def populate():
    games = get_live_games()
    print(f"Found {len(games)} games: {games}")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    six_personas = ['dot', 'barf', 'wardy', 'tomahawk', 'phanatic', 'mean_gene']

    for p_name in six_personas:
        c.execute("SELECT sys_id, user_name, first_name, title, department, introduction FROM sys_user WHERE user_name=?", (p_name,))
        user_row = c.fetchone()
        if not user_row:
            c.execute("SELECT sys_id, user_name, first_name, title, department, introduction FROM sys_user WHERE user_name='wavy'")
            user_row = c.fetchone()
            if not user_row: continue

        base_sys_id, base_user_name, first_name, title, department, introduction = user_row
        u_name = base_user_name
        is_subroutine = u_name in SUBROUTINE_PERSONAS

        c.execute("SELECT u_boggs_reactivity, u_cadence FROM cmdb_ci_ai_persona WHERE sys_id=?", (base_sys_id,))
        ci_row = c.fetchone()
        boggs   = ci_row[0] if ci_row else 'medium'
        cadence = ci_row[1] if ci_row else 'pacer'

        for game_pk in games:
            new_name   = f"{u_name}_{game_pk}"
            new_sys_id = str(uuid.uuid4()).replace('-', '')

            # ── sys_user ─────────────────────────────────────────────────────
            # Subroutine personas (mean_gene) are NEVER inserted into sys_user.
            # They are deployment records only — not humans, not fans.
            # Fan persona clones are inserted with active=0 so they appear as
            # deployment records in the CMDB, not as live "Human" accounts in
            # the Persona Center. The sim engine activates them at runtime.
            if not is_subroutine:
                c.execute("SELECT sys_id FROM sys_user WHERE user_name=?", (new_name,))
                if not c.fetchone():
                    c.execute("""
                        INSERT INTO sys_user (sys_id, user_name, first_name, title, department, introduction, active)
                        VALUES (?, ?, ?, ?, ?, ?, 0)
                    """, (new_sys_id, new_name, first_name, f"{title} [Room {game_pk}]", department, introduction))

            # ── cmdb_ci ───────────────────────────────────────────────────────
            c.execute("SELECT sys_id FROM cmdb_ci WHERE sys_id=?", (new_sys_id,))
            if not c.fetchone():
                c.execute("""
                    INSERT INTO cmdb_ci (sys_id, name, sys_class_name, assigned_to, short_description, operational_status)
                    VALUES (?, ?, 'cmdb_ci_ai_persona', ?, ?, 1)
                """, (new_sys_id, new_name, department, f"{first_name} - {title} [Room {game_pk}]"))

            # ── cmdb_ci_ai_persona ────────────────────────────────────────────
            c.execute("SELECT sys_id FROM cmdb_ci_ai_persona WHERE sys_id=?", (new_sys_id,))
            if not c.fetchone():
                c.execute("""
                    INSERT INTO cmdb_ci_ai_persona (sys_id, u_boggs_reactivity, u_system_prompt, u_deployment_zone, u_cadence)
                    VALUES (?, ?, ?, ?, ?)
                """, (new_sys_id, boggs, introduction, game_pk, cadence))

            print(f"{'[SUBROUTINE]' if is_subroutine else '[PERSONA]'} Populated {new_name} in room {game_pk}")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    populate()

