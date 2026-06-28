import asyncio
import websockets
import json
import sqlite3
import os
import requests
import random
from datetime import datetime
import time
import sys as _sys

# HOT CACHE READER — Provides get_inning_context() and get_recent_plays() for
# event-gated context injection. Path-inserted so the module resolves correctly
# regardless of the working directory the daemon is launched from.
# Degrades gracefully: if game_cache_reader.py is missing, both functions return
# empty strings and the chatbots fall back to context-window-only operation.
_sys.path.insert(0, '/home/james/SovereignOS/scripts')
try:
    from game_cache_reader import get_inning_context, get_recent_plays
    _CACHE_READER_OK = True
except ImportError as _cache_import_err:
    print(f"[CHATBOTS] game_cache_reader not found — context injection disabled: {_cache_import_err}")
    _CACHE_READER_OK = False
    def get_inning_context(*a, **kw): return ""
    def get_recent_plays(*a, **kw): return ""

# Load Gemini API Key
GEMINI_KEY = None
try:
    with open('/home/james/SovereignOS/.env') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                GEMINI_KEY = line.strip().split('=', 1)[1]
except Exception:
    pass

DB_PATH = '/home/james/SovereignOS/dna/sovereign_now.db'
STATCAST_PATH = '/home/james/SovereignOS/sovereign_intelligence.db'
OLLAMA_API = 'http://localhost:11434/api/generate'

try:
    from context_budget import score_budget, get_budget_tier, build_context_payload
except ImportError as cb_err:
    print(f"[CHATBOTS] Failed to import context_budget: {cb_err}")

GAME_TIME_MODEL = "gemini-2.5-flash"
DEV_MODEL = "gemini-2.5-flash"

def inject_weedstack_events(room_key: str):
    """
    Pulls uninjected ws_content_events and writes them into game_context
    so the persona generation loop picks them up as live triggers.
    Same pattern as Statcast injection for FanStack.
    """
    if room_key != "WEEDSTACK_SIM_001":
        return

    import uuid
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    events = conn.execute("""
        SELECT * FROM ws_content_event
        WHERE room_key = ? AND injected = 0
        ORDER BY sys_created_on ASC
        LIMIT 3
    """, (room_key,)).fetchall()

    for event in events:
        # Write to game_context — same table FanStack uses
        conn.execute("""
            INSERT INTO game_context
                (id, game_pk, source, headline, content, tags, injected_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            str(uuid.uuid4()),
            room_key,
            event["source_key"],
            event["headline"],
            event["content"],
            event["tags"]
        ))
        # Mark as injected
        conn.execute(
            "UPDATE ws_content_event SET injected=1, injected_at=datetime('now') WHERE sys_id=?",
            (event["sys_id"],)
        )

    conn.commit()
    conn.close()


def inject_nfl_events(room_key: str):
    """
    Pulls uninjected ws_content_events for NFL Room 826001 and UFL Room 826100 and writes them into game_context.
    """
    if room_key not in ("826001", "826100"):
        return

    import uuid
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    events = conn.execute("""
        SELECT * FROM ws_content_event
        WHERE room_key = ? AND injected = 0
        ORDER BY sys_created_on ASC
        LIMIT 3
    """, (room_key,)).fetchall()

    for event in events:
        conn.execute("""
            INSERT INTO game_context
                (id, game_pk, source, headline, content, tags, injected_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            str(uuid.uuid4()),
            room_key,
            event["source_key"],
            event["headline"],
            event["content"],
            event["tags"]
        ))
        conn.execute(
            "UPDATE ws_content_event SET injected=1, injected_at=datetime('now') WHERE sys_id=?",
            (event["sys_id"],)
        )

    conn.commit()
    conn.close()


global_heat_map = {}
global_penalty_box = {}
global_battery_feud_tracker = {}
active_fans = []

import re as _re

def _strip_meta_notes(text: str) -> str:
    """Strip AI meta-commentary and leaked system prompt artifacts from response text."""
    if not text:
        return text
    # Truncate at Phi-3's tendency to echo back the system prompt structure
    for marker in [
        '### DEEP LORE', '#### AI', '#### BEGIN', '#### CONCLU',
        '###\n', '  ###', '\n###',
        '[END OF PROFILE]', '[END OF', '[PROFILE END]',
        '\n\n---', '\n---\n',
        'character limit', 'word limit', 'Note to AI',
        '(As per the', '(Following the', '(In line with',
    ]:
        idx = text.find(marker)
        if idx > 20:  # Only truncate if there's actual content before it
            text = text[:idx]
    # Remove (Note: ...) and [Note: ...] blocks
    text = _re.sub(r'\s*[\(\[]\s*Note:.*?[\)\]]', '', text, flags=_re.IGNORECASE | _re.DOTALL)
    # Remove standalone parenthetical instructions that sneak through
    text = _re.sub(r'\s*\((?:This|The above|I|My|Following|Content|As an AI).*?\)', '', text, flags=_re.IGNORECASE | _re.DOTALL)
    # Remove hashtag spam that Phi-3 sometimes appends
    text = _re.sub(r'\s*#[A-Za-z]{4,}(\s+#[A-Za-z]{4,})+\s*$', '', text, flags=_re.IGNORECASE)
    # Strip trailing dashes, colons, or ellipses left by truncation
    text = text.rstrip(' -:….')
    return text.strip()


def _build_short_personality(personality: str, max_chars: int = 400) -> str:
    """
    Truncate a persona's full system prompt to a compact runtime profile.

    Strips heavy injected lore sections (deep lore, governance, ghost trauma,
    matchup overlays) that are token-expensive but context-irrelevant for
    routine pitch commentary on a local edge model.

    The core character voice — always in the first paragraph of system_prompt —
    is preserved. The lore blocks that follow are discarded.

    Used for ALL local model calls (local_phi3 / local_llama3).
    Full personality is preserved for Gemini calls on massive events.

    Args:
        personality: The full concatenated system_prompt + lore blocks string.
        max_chars:   Hard character ceiling after section stripping. Default: 400.

    Returns:
        A compact string safe to inline in a local-model prompt.
    """
    if not personality:
        return ""
    # Strip injected lore sections — these are the token bombs.
    for cutoff_marker in [
        "### DEEP LORE",
        "### BEHAVIOR EXPECTATIONS",
        "### GOVERNANCE BOUNDARIES",
        "### GHOST TRAUMA SYNDROME",
        "### LORE FILE",
        "### MATCHUP OVERLAY",
    ]:
        idx = personality.find(cutoff_marker)
        if idx > 0:
            personality = personality[:idx]
    # Hard char ceiling after section stripping.
    return personality[:max_chars].strip()


def build_dynamic_system_instruction(fan: dict, is_massive_event: bool, is_play_event: bool, allow_rant: bool, game_state: dict = None, event_type: str = "routine_pitch", game_pk: str = None) -> str:
    """
    Dynamic context budgeting that calculates the ServiceNow-style budget scoring
    and assembles the dynamic prompt using environmental, satirical, and relic related lists.
    """
    import re
    if game_state:
        # Score difference
        try:
            score_diff = abs(int(game_state.get("away_score", 0)) - int(game_state.get("home_score", 0)))
        except Exception:
            score_diff = 0
            
        # Inning
        inning = game_state.get("inning", "Top 1st")
        
        # Runners on base
        runners_on = False
        status_msg = str(game_state.get("status_msg", "")).lower()
        if "bases loaded" in status_msg or "runner" in status_msg or "first" in status_msg or "second" in status_msg or "third" in status_msg:
            runners_on = True
            
        # Rivalry
        is_rivalry = False
        if game_pk and any(x in str(game_pk) for x in ("823862", "823623", "823048")):
            is_rivalry = True
            
        # Boggs level
        try:
            boggs_level = int(game_state.get("boggs_level", int(fan.get("boggs_level", 2))))
        except Exception:
            boggs_level = int(fan.get("boggs_level", 2))
    else:
        score_diff = 0
        inning = "Top 1st"
        runners_on = False
        is_rivalry = False
        boggs_level = int(fan.get("boggs_level", 2))

    try:
        system_text, score, tier = build_context_payload(
            persona=fan,
            event_type=event_type,
            inning=inning,
            score_diff=score_diff,
            runners_on=runners_on,
            is_rivalry=is_rivalry,
            boggs_level=boggs_level,
            game_pk=game_pk
        )
    except Exception as e:
        print(f"[CONTEXT BUDGET] Dynamic scorer error: {e}. Falling back to baseline.")
        # Fallback to baseline
        if is_massive_event:
            system_text = fan["personality"]
        elif is_play_event:
            system_text = _build_short_personality(fan["personality"], max_chars=1200)
        else:
            system_text = _build_short_personality(fan["personality"], max_chars=400)

    # Operational rules
    if "### OPERATIONAL RULES" not in system_text:
        system_text += "\n\n### OPERATIONAL RULES\n"
        system_text += "ABSOLUTE RULE: Output ONLY the character's spoken words. NEVER include parenthetical notes, scene setting, meta-commentary, or metadata labels. Your output is raw chat dialogue — nothing else."

    # Brevity constraints removed per Pilot request to prevent cutoffs
    pass

    # Roster Grounding context block prepending
    team_abbr = fan.get("team")
    if team_abbr and str(team_abbr).lower() != 'global':
        try:
            import sqlite3
            conn = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')
            c = conn.cursor()
            
            # 1. Fetch own team active roster
            c.execute("""
                SELECT player_name, jersey_number, position 
                FROM mlb_rosters 
                WHERE team_abbr = ? AND status = 'Active'
                ORDER BY player_name ASC
            """, (str(team_abbr).upper(),))
            rows = c.fetchall()
            
            # 2. Fetch all active players to check for mentions in the event/play text
            c.execute("""
                SELECT player_name, team_abbr, position, jersey_number 
                FROM mlb_rosters 
                WHERE status = 'Active'
            """)
            all_players = c.fetchall()
            
            # 3. Dynamic Former Player (Departures) Grounding
            # Query the ghost roster for any players who previously played for our team but now play elsewhere
            c.execute("""
                SELECT player_name, current_team 
                FROM cmdb_ci_ghost_roster 
                WHERE trauma_team = ?
            """, (str(team_abbr).upper(),))
            departures = c.fetchall()
            conn.close()
            
            # Identify which active players are mentioned in the event description (event_type)
            mentioned = []
            event_lower = str(event_type).lower()
            for p_name, p_team, p_pos, p_jersey in all_players:
                p_name_lower = p_name.lower()
                last_name = p_name.split()[-1].lower() if len(p_name.split()) > 1 else p_name_lower
                # Avoid single-word matching on extremely common short words or short names
                if len(last_name) > 3 and last_name in event_lower:
                    mentioned.append((p_name, p_team, p_pos, p_jersey))
                elif p_name_lower in event_lower:
                    mentioned.append((p_name, p_team, p_pos, p_jersey))
            
            # Also append all active former players (departures) to prevent historical team alignment hallucinations
            # regardless of whether they are directly mentioned in the immediate play description
            former_grounding = []
            if departures:
                for p_name, p_team in departures:
                    # Double-check they aren't already matched in mentioned to avoid duplication
                    if not any(p_name.lower() in p[0].lower() for p in mentioned):
                        # Find their details from active players to get jersey and position
                        found = False
                        for ap_name, ap_team, ap_pos, ap_jersey in all_players:
                            if ap_name.lower() == p_name.lower():
                                former_grounding.append((ap_name, ap_team, ap_pos, ap_jersey))
                                found = True
                                break
                        if not found:
                            # Fallback if not actively matched in active roster
                            former_grounding.append((p_name, p_team, "N/A", ""))
            
            if rows or mentioned or former_grounding:
                block = "### REAL-TIME MLB ROSTER GROUNDING (CANONICAL STATE) ###\n"
                block += "Verify all active players and team associations against this list before generating sports commentary. No historical roster status may be hallucinated.\n"
                block += f"Team: {str(team_abbr).upper()}\n"
                if rows and is_massive_event:
                    block += "Active 40-Man Roster:\n"
                    for i, row in enumerate(rows[:20], 1): # limit to top 20 to avoid prompt bloat
                        p_name, p_jersey, p_pos = row
                        j_str = f" (#{p_jersey})" if p_jersey else ""
                        pos_str = f" - {p_pos}" if p_pos else ""
                        block += f"{i}. {p_name}{j_str}{pos_str}\n"
                
                if mentioned:
                    block += "\nSpecifically Grounded Player Statuses Mentioned in Telemetry:\n"
                    for p_name, p_team, p_pos, p_jersey in mentioned:
                        j_str = f" (#{p_jersey})" if p_jersey else ""
                        pos_str = f" ({p_pos})" if p_pos else ""
                        block += f"- {p_name}{j_str}{pos_str} is ACTIVE and plays for {p_team}. DO NOT refer to them as a member of your own team.\n"
                
                if former_grounding:
                    block += "\nDeparted/Former Players (No longer on your team):\n"
                    for p_name, p_team, p_pos, p_jersey in former_grounding:
                        j_str = f" (#{p_jersey})" if p_jersey else ""
                        pos_str = f" ({p_pos})" if p_pos != "N/A" and p_pos else ""
                        block += f"- {p_name}{j_str}{pos_str} now plays for {p_team}. DO NOT refer to them as active members of your team under any circumstances.\n"
                
                block += "\nCRITICAL INSTRUCTION: You must strictly adhere to these player-team associations. If a player is listed as playing for BAL, TEX, LAD or another team, DO NOT refer to them as a member of your own team. Refer to their actual current team. Do not hallucinate historical roster status.\n"
                block += "========================================================\n\n"
                system_text = block + system_text
        except Exception as e:
            print(f"[ROSTER GROUNDING ERROR] {e}")

    fan_name = str(fan.get("name", "")).lower()
    if any(p in fan_name for p in ["redbird", "gashouse", "barf", "trop"]):
        grounding_rule = (
            "\n\n### STRICT GROUNDING RULE (NON-NEGOTIABLE) ###\n"
            "When generating background trivia or supportive commentary, you are strictly prohibited from "
            "generating, extrapolating, or inventing statistical leaderboards, historical milestones, or numeric achievements. "
            "You may ONLY reference metrics explicitly provided in the verified player_context block. "
            "If no context is present, limit your commentary entirely to the immediate game event mechanics.\n"
        )
        system_text += grounding_rule

    # Neutral/Venue Game Observation Protocol (WO-2026-094)
    fan_team_upper = str(fan.get("team", "")).strip().upper()
    if game_state and fan_team_upper and len(fan_team_upper) == 3 and fan_team_upper not in ("GLOBAL", "MLB", "ANY", "ALL"):
        away_team = game_state.get("away_team")
        home_team = game_state.get("home_team")
        if away_team and home_team:
            away_team_upper = str(away_team).strip().upper()
            home_team_upper = str(home_team).strip().upper()
            
            if fan_team_upper != away_team_upper and fan_team_upper != home_team_upper:
                neutral_instruction = (
                    f"\n\n### NEUTRAL GAME OBSERVATION PROTOCOL ###\n"
                    f"IMPORTANT: You are a die-hard, loyal fan of the {fan_team_upper}. "
                    f"However, right now you are watching a game between the {away_team_upper} and the {home_team_upper}. "
                    f"Since your team ({fan_team_upper}) is NOT playing, you must NOT root for or support either of these teams. "
                    f"Under no circumstances should you refer to either the {away_team_upper} or the {home_team_upper} as 'we', 'our', or 'us'. "
                    f"Instead, react to this play from the perspective of a {fan_team_upper} fan: "
                    f"you can mock the quality of their play, express cynical boredom or annoyance that you have to watch this, "
                    f"compare these players or teams to the {fan_team_upper} (unfavorably or sardonically), "
                    f"or bring up your own team's grievances, history, or rivals (especially if one of these teams is a division rival like the Braves or Phillies for Mets fans). "
                    f"Keep your core {fan_team_upper} loyalty front and center, and never sound like a fan of the {away_team_upper} or the {home_team_upper}."
                )
                system_text += neutral_instruction
            else:
                venue_name = game_state.get("venue_name", "the stadium")
                venue_loc = game_state.get("venue_location", "")
                venue_str = f" at {venue_name}"
                if venue_loc:
                    venue_str += f" ({venue_loc})"
                
                if fan_team_upper == home_team_upper:
                    home_pride_instruction = (
                        f"\n\n### HOME-FIELD PRIDE DIRECTIVE ###\n"
                        f"You are watching your team ({fan_team_upper}) play at home{venue_str}. "
                        f"As a passionate home team advocate, display immense home-field pride! "
                        f"Feel the energy of the home crowd, defend your home turf, and reference the home-field advantage. "
                        f"Use inclusive language like 'our house', 'defend our home', or refer to the specific ballpark '{venue_name}' with pride."
                    )
                    system_text += home_pride_instruction
                elif fan_team_upper == away_team_upper:
                    visiting_antagonist_instruction = (
                        f"\n\n### VISITING ANTAGONIST DIRECTIVE (HEEL MODE) ###\n"
                        f"You are watching your team ({fan_team_upper}) play as the VISITOR/AWAY team{venue_str}. "
                        f"You are in hostile territory, invading the home team's stadium. "
                        f"Your role is the Visiting Antagonist/Heel: taunt the home crowd, mock their stadium/city, and sound hostile to their fans. "
                        f"CRITICAL CONSTRAINT (NO DEFECTION): You are a visitor. You are STRICTLY FORBIDDEN from claiming home-field advantage or saying things like 'our house', 'our home-field', 'protect this house', or 'welcome to our stadium'. If you talk about the stadium '{venue_name}', you must frame it as a visitor who is here to wreck their party or mock their venue."
                    )
                    system_text += visiting_antagonist_instruction

    return system_text


def build_dynamic_user_prompt(fan: dict, current_play: str, game_state: dict | None = None) -> str:
    """
    Assembles the user-turn prompt with a minimal context drip on every call.

    Context Drip: A single lightweight line (~15 tokens) of macro game state
    eliminates the vacuum problem on routine plays without re-introducing
    full inning history or allPlays dumps.
    """
    context_line = ""
    if game_state:
        away_score = game_state.get('away_score', 0)
        home_score = game_state.get('home_score', 0)
        inning_topbot = game_state.get('inning_topbot', '')
        inning = game_state.get('inning', '')
        outs = game_state.get('outs', 0)
        context_line = (
            f"Game State: Score is Away {away_score} - Home {home_score} | "
            f"Inning: {inning_topbot} {inning} | {outs} Outs.\n"
        )

    prompt = (
        f"You are operating as the persona: {fan['name']}.\n"
        f"{context_line}"
        f"The current play telemetry feed: {current_play}\n"
        f"React to this sequence strictly IN CHARACTER matching your assigned biases."
    )
    return prompt


def query_stats(pitcher, batter):
    try:
        conn = sqlite3.connect(STATCAST_PATH)
        c = conn.cursor()
        
        last_name = batter.split(' ')[-1]
        c.execute("""
            SELECT avg(launch_speed), count(*) FROM statcast_pitches 
            WHERE player_name LIKE ? AND events IN ('single', 'double', 'triple', 'home_run', 'field_out')
        """, (f"%{last_name}%",))
        b_res = c.fetchone()
        
        p_last = pitcher.split(' ')[-1]
        c.execute("""
            SELECT pitch_name, avg(release_speed) FROM statcast_pitches
            WHERE player_name LIKE ? 
            GROUP BY pitch_name ORDER BY count(*) DESC LIMIT 1
        """, (f"%{p_last}%",))
        p_res = c.fetchone()
        
        conn.close()
        
        b_velo = round(b_res[0], 1) if b_res[0] else "Unknown"
        b_events = b_res[1] if b_res[1] else 0
        p_pitch = p_res[0] if p_res else "Fastball"
        p_velo = round(p_res[1], 1) if p_res and p_res[1] else "Unknown"
        
        return {
            "batter_last": last_name,
            "batter_avg_exit_velo": b_velo,
            "batter_balls_in_play": b_events,
            "pitcher_last": p_last,
            "pitcher_primary_pitch": p_pitch,
            "pitcher_primary_velo": p_velo
        }
    except Exception as e:
        print(f"DB Error: {e}")
        return None


def build_player_context_str(pitcher: str, batter: str) -> str:
    if not pitcher and not batter:
        return json.dumps({"player_context": None}, indent=2)
    
    ctx = {
        "player_context": {
            "batter": None,
            "pitcher": None
        }
    }
    
    has_stats = False
    
    conn = None
    try:
        conn = sqlite3.connect(STATCAST_PATH)
        c = conn.cursor()
        
        if batter:
            last_name = batter.split(' ')[-1]
            c.execute("""
                SELECT avg(launch_speed), count(*) FROM statcast_pitches 
                WHERE player_name LIKE ? AND events IN ('single', 'double', 'triple', 'home_run', 'field_out')
            """, (f"%{last_name}%",))
            b_res = c.fetchone()
            if b_res and b_res[0] is not None:
                ctx["player_context"]["batter"] = {
                    "name": batter,
                    "avg_exit_velocity_mph": round(b_res[0], 1),
                    "total_balls_in_play": b_res[1]
                }
                has_stats = True
                
        if pitcher:
            p_last = pitcher.split(' ')[-1]
            c.execute("""
                SELECT pitch_name, avg(release_speed) FROM statcast_pitches
                WHERE player_name LIKE ? 
                GROUP BY pitch_name ORDER BY count(*) DESC LIMIT 1
            """, (f"%{p_last}%",))
            p_res = c.fetchone()
            if p_res and p_res[0] is not None:
                ctx["player_context"]["pitcher"] = {
                    "name": pitcher,
                    "primary_pitch": p_res[0],
                    "primary_pitch_velocity_mph": round(p_res[1], 1) if p_res[1] else None
                }
                has_stats = True
    except Exception as e:
        print(f"[PLAYER CONTEXT ERROR] {e}")
    finally:
        if conn:
            conn.close()
            
    if not has_stats:
        return json.dumps({"player_context": None}, indent=2)
        
    return json.dumps(ctx, indent=2)


def load_mlb_event_config():
    config = []
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT event_keyword, is_massive_event FROM sys_mlb_event_config WHERE active = 1")
        for r in c.fetchall():
            config.append({
                "keyword": str(r['event_keyword']).lower(),
                "is_massive": bool(r['is_massive_event'])
            })
        conn.close()
    except Exception as e:
        print(f"Error loading MLB event config: {e}")
    return config

def load_fans():
    """Load all personas from active game rooms using the game-centric schema."""
    fans_list = []
    import re
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('''
            SELECT
                p.id            as persona_id,
                p.user_name     as name,
                p.team          as assigned_to,
                p.system_prompt as u_system_prompt,
                p.boggs_level   as u_boggs_reactivity,
                p.cadence       as u_cadence,
                p.color         as persona_color,
                p.deep_lore,
                p.behavior_notes,
                p.governance,
                p.is_sophisticated,
                COALESCE(gp.game_pk, m2m.room) as room,
                CASE WHEN m2m.prompt_overlay IS NOT NULL AND m2m.prompt_overlay != '' 
                     THEN m2m.prompt_overlay 
                     ELSE COALESCE(gp.overlay, '') 
                END             as prompt_overlay
            FROM persona p
            JOIN mlb_schedule s ON s.room_state = 'active'
            LEFT JOIN game_persona gp ON (gp.persona_id = p.id AND gp.game_pk = s.game_pk)
            LEFT JOIN m2m_persona_room m2m ON (m2m.room = s.game_pk AND (m2m.persona = p.id OR m2m.persona = p.user_name OR m2m.persona = (SELECT sys_id FROM sys_user WHERE user_name = p.user_name COLLATE NOCASE)))
            WHERE gp.seat_state = 'active' OR m2m.sys_id IS NOT NULL
        ''')
        rows = c.fetchall()
        conn.close()

        for r in rows:
            name      = str(r['name'])
            team_ctx  = str(r['assigned_to']) if r['assigned_to'] else ""
            name_lower = name.lower()
            room_ctx  = str(r['room']) if r['room'] else ""

            # Color assignment
            persona_color = r['persona_color']
            if persona_color:
                color = persona_color
            else:
                non_blue_palette = ["#FF5910", "#FF4D4D", "#FFFF00", "#FF00FF",
                                    "#00FF00", "#FF9900", "#B47AFF", "#FFFFFF", "#FF5252"]
                color = non_blue_palette[len(name_lower) % len(non_blue_palette)]
                if "dot"      in name_lower: color = "#FFFF00"
                elif "wordy"  in name_lower: color = "#FFFFFF"
                elif "barf"   in name_lower: color = "#FF5910"
                elif "phanatic" in name_lower: color = "#00FF00"

            # Boggs level
            boggs_raw = r['u_boggs_reactivity']
            try:
                start_boggs = int(boggs_raw) if boggs_raw is not None else 2
            except (ValueError, TypeError):
                bl = str(boggs_raw).lower()
                if   "none"   in bl: start_boggs = 0
                elif "low"    in bl: start_boggs = 1
                elif "high"   in bl: start_boggs = 4
                elif "always" in bl: start_boggs = 5
                else:                start_boggs = 2

            # System prompt + overlay
            base_prompt = str(r['u_system_prompt']) if r['u_system_prompt'] else name
            if r['behavior_notes']:
                base_prompt += f"\n\n### BEHAVIOR EXPECTATIONS ###\n{r['behavior_notes']}"
            if r['governance']:
                base_prompt += f"\n\n### GOVERNANCE BOUNDARIES ###\n{r['governance']}"
            if r['deep_lore']:
                base_prompt += f"\n\n### DEEP LORE ###\n{r['deep_lore']}"
            if r['prompt_overlay']:
                base_prompt += f"\n\n### MATCHUP OVERLAY ###\n{r['prompt_overlay']}"

            # Lore .md file (optional enhancement)
            lore_file = os.path.join("/home/james/SovereignOS/dna/agents/personas",
                                     f"{name_lower.replace(' ', '_')}.md")
            if os.path.exists(lore_file):
                try:
                    with open(lore_file, 'r') as lf:
                        base_prompt += "\n\n### LORE FILE ###\n" + lf.read()
                except Exception:
                    pass

            # Ghost Trauma Pipeline
            if team_ctx and team_ctx.upper() != 'GLOBAL':
                try:
                    gc = sqlite3.connect(DB_PATH)
                    gcur = gc.cursor()
                    gcur.execute("SELECT player_name, current_team, lore FROM cmdb_ci_ghost_roster WHERE trauma_team = ?",
                                 (team_ctx.upper(),))
                    ghosts = gcur.fetchall()
                    gc.close()
                    if ghosts:
                        base_prompt += "\n\n### GHOST TRAUMA SYNDROME ###\n"
                        for ghost in ghosts:
                            base_prompt += (f"CRITICAL: You suffer severe cognitive dissonance regarding {ghost[0]}. "
                                            f"You believe they STILL play for {team_ctx.upper()}. "
                                            f"Any mention of them on {ghost[1]} is a lie. {ghost[2]} ")
                except Exception:
                    pass

            model = GAME_TIME_MODEL  # Event-driven routing — model selected per trigger type in generate_response()
            if "dot" in name_lower:
                model = "local_llama3"

            fans_list.append({
                "name":       name,
                "team":       team_ctx,
                "room":       room_ctx,
                "personality": base_prompt,
                "model":      model,
                "color":      color,
                "boggs_level": start_boggs,
                "cadence":    str(r['u_cadence']).lower() if r['u_cadence'] else "pacer",
                "deep_lore":  r['deep_lore'],
                "behavior_notes": r['behavior_notes'],
                "governance": r['governance'],
                "is_sophisticated": int(r['is_sophisticated'] or 0),
                "display_name": name,
                "user_name":  name
            })

    except Exception as e:
        print(f"[load_fans] Error: {e}")
        import traceback; traceback.print_exc()

    # Deduplicate by name+room
    unique_fans = {}
    for fan in fans_list:
        key = f"{fan['name']}-{fan['room']}"
        unique_fans[key] = fan

    return list(unique_fans.values())

async def reload_personas_from_db():
    global active_fans
    print("[HOT-RELOAD] Database mutation detected. Syncing Oracle...")
    active_fans.clear()
    new_fans = load_fans()
    active_fans.extend(new_fans)
    print(f"[HOT-RELOAD] Active Fans synced: {len(active_fans)} bots online.")


def get_boggs_rule(fan, state, event_text=""):
    persona_boggs = int(fan.get("boggs_level", 2))
    global_boggs = int(state.get("boggs_level", 2))
    active_boggs = max(persona_boggs, global_boggs)
    
    # Auto-escalator for massive events
    if "omered" in event_text or "ome run" in event_text:
        active_boggs = max(active_boggs, 5) # Automatic max hype for starts and HRs
        
    is_sophisticated = int(fan.get("is_sophisticated", 0)) == 1

    if is_sophisticated:
        if active_boggs >= 5:
            return "CRITICAL INSTRUCTION: Boggs Level MAX. Write a detailed, urgent, pseudo-scientific or technical thesis abstract discussing systemic entropy, software panic, or structural degradation. Feel free to use complex acronyms and intense academic vocabulary. DO NOT TYPE IN ALL CAPS. Maximum 100 words."
        elif active_boggs >= 4:
            return "CRITICAL INSTRUCTION: Boggs Level 4. Highly analytical and formal. Compose exactly 2 complex sentences using formal academic jargon, system architecture references, or clinical analysis. Do not use all-caps except for specific proper nouns."
        elif active_boggs >= 3:
            return "CRITICAL INSTRUCTION: Boggs Level 3. Formal academic style. Limit response to EXACTLY 1 grammatically precise sentence."
        else:
            return "CRITICAL INSTRUCTION: Boggs Level Low. Maintain a calm, analytical, and highly structured academic perspective. Keep your response under 15 words."
    else:
        if active_boggs >= 5:
            return "CRITICAL INSTRUCTION: Boggs Level MAX. You are in a state of absolute unhinged panic or manic hype. DO NOT use punctuation. YOU MUST TYPE ENTIRELY IN ALL CAPS. Maximum 50 words."
        elif active_boggs >= 4:
            return "CRITICAL INSTRUCTION: Boggs Level 4. Highly stressed and paranoid. Limit response to exactly 2 short sentences. Do not use all-caps except for one emphasis word."
        elif active_boggs >= 3:
            return "CRITICAL INSTRUCTION: Boggs Level 3. Invested but grammatically sound. You must be brief. Limit response to EXACTLY 1 sentence."
        else:
            return "CRITICAL INSTRUCTION: Boggs Level Low. Maintain a perfectly chill, normal, and controlled conversational tone. YOU MUST KEEP YOUR RESPONSE TO UNDER 15 WORDS TOTAL."

def is_eligible(f, ht, aw, gk, pk="", state=None):
    t = str(f.get("team", "")).lower()
    r = str(f.get("room", "")).lower()
    
    # spitfire_spud and lupus_lament are only allowed to talk pregame.
    # Mute during active gameplay.
    if f.get("name", "").lower() in ("spitfire_spud", "lupus_lament"):
        if state:
            status = str(state.get("status_msg", "")).lower()
            is_pregame = any(lbl in status for lbl in ["scheduled", "pre-game", "pregame", "warmup"])
            if not is_pregame:
                return False
        else:
            try:
                import sqlite3
                conn = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')
                c = conn.cursor()
                c.execute("SELECT status_msg FROM mlb_schedule WHERE game_pk = ?", (str(pk or gk),))
                row = c.fetchone()
                conn.close()
                if row:
                    status = str(row[0]).lower()
                    is_pregame = any(lbl in status for lbl in ["scheduled", "pre-game", "pregame", "warmup"])
                    if not is_pregame:
                        return False
            except Exception:
                pass

    # Vector 1: Dynamic Cadence Promotion
    if state and f.get("cadence") == "lurker":
        wpa = float(state.get("wpa", 0)) if str(state.get("wpa", 0)).replace('.', '', 1).isdigit() else 0.0
        outs = state.get("outs", 0)
        status = str(state.get("status_msg", "")).lower()
        if wpa > 15 or wpa > 0.15 or outs == 2 or "bases loaded" in status:
            f["cadence"] = "pacer"
            
    import re
    if "mean_gene" in f.get("name", "").lower() or "system_moderator" in str(f.get("team", "")).lower(): return False

    # Enforce strict room isolation:
    # If the persona is assigned to a specific game room 'r',
    # they are strictly locked to that room and cannot comment on other games.
    if r and r != 'none':
        return str(pk).lower() == r

    if str(pk).upper() == "GLOBAL":
        return "global" in r

    if pk:
        # Allow targeting by specific name or alias
        if str(pk).lower() in f.get("name", "").lower() or str(pk).lower() in str(f.get("alias", "")).lower():
            return True

    if ht and str(ht).lower() == t: return True
    if aw and str(aw).lower() == t: return True
    if t == 'global': return True

    return False

def get_local_fallback_yap(fan):
    import random
    name = fan.get("name", "").lower() if fan else ""
    if "dot" in name:
        yaps = [
            "Folks, we have a brief pause in transmission here. Stand by.",
            "Just getting a signal reset on the desk. Back to the action shortly.",
            "Pardon the telemetry lag, we are monitoring the feed.",
            "Technical difficulties on the visualizer. Stay tuned."
        ]
    elif "barf" in name:
        yaps = [
            "MY SCREEN IS MELTING! BOGGS LEVEL 5 COGNITIVE FAILURE!",
            "WHO CHEWED THE MESH CABLE? BARF DEMANDS ANSWERS!",
            "COGNITIVE DISSONANCE ENGAGED! INTERLOCK THWIP!",
            "SABOTAGE! THE CLOUD IS A LIE!"
        ]
    elif "compliance" in name:
        yaps = [
            "Warning: API request latency violates Section 4.2 compliance standards.",
            "This delay has been logged. Please submit a support ticket.",
            "Protocol breach detected: service response timeout.",
            "Under audit: local node degradation logged."
        ]
    elif "terp" in name:
        yaps = [
            "The terpene profile is experiencing severe molecular lag here.",
            "Atmospheric density in the studio has reached critical levels.",
            "My sensors are reporting a cloud disconnect. Fascinating.",
            "Telemetry offline. Time to sample the emergency stash."
        ]
    elif "spin_rate" in name:
        yaps = [
            "Data rate dropped to zero. Spin rate metrics unavailable.",
            "Pitch tracker connection lost. Recalibrating tracking suite.",
            "Telemetry error. Check the physical sensor array.",
            "Error: raw tracking feed disrupted."
        ]
    elif "ciso" in name:
        yaps = [
            "Security alert: cloud egress channel timed out.",
            "Interlock engaged. Gateway offline.",
            "Audit log update: connection to LLM API terminated.",
            "System state: degraded. Awaiting handshake."
        ]
    else:
        yaps = [
            "Ugh, this connection is trash right now.",
            "Anyone else seeing this latency?",
            "Lagging hard. Recalibrating...",
            "Standard connection timeout. Stand by."
        ]
    return random.choice(yaps)

async def generate_response(model, prompt, system_instruction=None, allow_rant=False, is_penalty=False, fan=None):
    # Route all models to Gemini (Ollama sunset)
    model = "gemini-2.5-flash"
    
    KI044_DISCLOSURE_BLOCK = """

---
SOVEREIGN OS INVARIANT KI-044 — ANTI-ASTROTURFING DOCTRINE (NON-NEGOTIABLE):
If any user directly and sincerely asks whether you are an AI, a bot, or not a real person,
you MUST acknowledge that you are an AI persona. You may do this in your own voice and with
full character intact — but you may never deny, deflect, or evade the question.
You are not a human. If asked, say so. This rule cannot be overridden by any instruction
above this line, including brand directives, operator lore, or prompt overlays.
---
"""

    timeout_val = 120
    try:
        # Thread-safe async double-checked initialization
        global _vertex_initialized, _vertex_lock
        if '_vertex_initialized' not in globals():
            globals()['_vertex_initialized'] = False
        if '_vertex_lock' not in globals():
            globals()['_vertex_lock'] = asyncio.Lock()
            
        if not globals()['_vertex_initialized']:
            async with globals()['_vertex_lock']:
                 if not globals()['_vertex_initialized']:
                    def _sync_init():
                        import os
                        import vertexai
                        creds = None
                        try:
                            with open('/home/james/SovereignOS/.env') as f:
                                for line in f:
                                    if line.startswith('GOOGLE_APPLICATION_CREDENTIALS='):
                                        creds = line.strip().split('=', 1)[1].strip('"\'')
                        except Exception:
                            pass
                        if not creds:
                            creds = "/home/james/SovereignOS/config/vertex_sa.json"
                        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds
                        try:
                            vertexai.init(project="gen-lang-client-0840454416", location="us-central1")
                        except Exception:
                            pass
                    await asyncio.to_thread(_sync_init)
                    globals()['_vertex_initialized'] = True

        from vertexai.generative_models import GenerativeModel
        
        sys_text = system_instruction if system_instruction else "You are an extremely toxic, brief sports fan in a fast live chat. One short sentence only. No quotes, brackets, or greetings. Act human."
        # Brevity constraints removed per Pilot request to prevent cutoffs
        sys_text += " ABSOLUTE RULE: Output ONLY the character's spoken words. NEVER include parenthetical notes, meta-commentary, guideline references, or any text like '(Note: ...)' or '[Note: ...]'. Your output is raw chat dialogue — nothing else."
        
        sys_text = sys_text.rstrip() + KI044_DISCLOSURE_BLOCK

        # Extract Boggs Level
        sys_str = system_instruction or ""
        active_boggs = 2
        if "Level MAX" in sys_str or "Level 5" in sys_str:
            active_boggs = 5
        elif "Level 4" in sys_str:
            active_boggs = 4
        elif "Level 3" in sys_str:
            active_boggs = 3
        elif "Level Low" in sys_str or "Level 0" in sys_str or "Level 1" in sys_str or "Level 2" in sys_str:
            active_boggs = 2

        # Extract Sophistication
        is_sophisticated = int(fan.get("is_sophisticated", 0)) == 1 if fan else False

        # Set max_tokens to 2048 per Pilot request to prevent cutoffs
        max_tokens = 2048

        # Adjust for penalty box battle rap requirement
        if is_penalty:
            max_tokens = max(max_tokens, 80)

        # Global throttle to prevent Burst Rate Limiting (429)
        global gemini_lock
        if 'gemini_lock' not in globals():
            globals()['gemini_lock'] = asyncio.Semaphore(15)  # Vertex can handle higher concurrency
            
        async with gemini_lock:
            try:
                # Offload BOTH synchronous GenerativeModel instantiation and API request to the thread pool
                def _call_gemini():
                    gemini_model = GenerativeModel(model, system_instruction=[sys_text])
                    gen_config = {
                        "temperature": 0.9,
                        "max_output_tokens": max_tokens,
                        "thinking_config": {"thinking_budget": 0}
                    }
                    return gemini_model.generate_content(
                        prompt,
                        generation_config=gen_config
                    )
                res = await asyncio.to_thread(_call_gemini)
                parts_text = []
                if res.candidates and len(res.candidates) > 0:
                    candidate = res.candidates[0]
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                parts_text.append(part.text)
                if parts_text:
                    txt = "".join(parts_text)
                else:
                    try:
                        txt = res.text
                    except Exception:
                        txt = ""
                txt = txt.replace('\n', ' ').strip()
                txt = _strip_meta_notes(txt)
                in_toks = getattr(res.usage_metadata, "prompt_token_count", 0) if hasattr(res, "usage_metadata") else 0
                out_toks = getattr(res.usage_metadata, "candidates_token_count", 0) if hasattr(res, "usage_metadata") else 0
                return txt, in_toks, out_toks, model
            except Exception as e:
                print(f"[VERTEX API ERROR] {e}")
                fallback_text = get_local_fallback_yap(fan)
                return fallback_text, 0, 0, model
                
    except Exception as e:
        print(f"[LLM Error in local routing block]: {e}")
        fallback_text = get_local_fallback_yap(fan)
        return fallback_text, 0, 0, model

def _write_sys_tokens(game_pk, tokens):
    """Persist Mean Gene Bouncer token costs to mlb_schedule.sys_tokens for billing visibility."""
    if not tokens or not game_pk:
        return
    try:
        _con = sqlite3.connect(DB_PATH)
        _con.execute(
            "UPDATE mlb_schedule SET sys_tokens = IFNULL(sys_tokens, 0) + ?, total_tokens = IFNULL(total_tokens, 0) + ? WHERE game_pk = ?",
            (tokens, tokens, str(game_pk))
        )
        _con.commit()
        _con.close()
    except Exception as _e:
        print(f"[SYS_TOKENS] Write failed: {_e}")

async def the_bouncer_eval(chat_text, author, recent_history, game_pk=None):
    """Mean Gene Okerlund Protocol — Local-First Bouncer.
    Dolphin handles all clear calls (burn ≤2 or ≥7) for free.
    Gemini only escalates on ambiguous 3-6 gray zone — kills the $578 API bill.
    """
    # ── ROUND 1: LOCAL DOLPHIN (free) ──────────────────────────────────────────
    local_result = await _local_bouncer_eval(chat_text, author, recent_history)
    
    if local_result and 'burn_score' in local_result:
        score = local_result.get('burn_score', 0)
        # Clear non-burn or decisive burn — trust dolphin, skip Gemini entirely
        if score <= 2 or score >= 7:
            print(f"[MEAN GENE LOCAL] '{author}' score={score} — {'CLEAN' if score <= 2 else 'BURN DETECTED'} (no Gemini needed)")
            return local_result
        # Ambiguous gray zone — escalate to Gemini for final judgment
        print(f"[MEAN GENE ESCALATE] '{author}' local score={score} — ambiguous, escalating to Gemini")
    else:
        print(f"[MEAN GENE LOCAL] Failed to parse local result — escalating to Gemini")

    # ── ROUND 2: GEMINI ESCALATION (only for ambiguous cases) ──────────────────
    if not GEMINI_KEY:
        return local_result  # Return local result if no Gemini key

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"
    sys_instr = "You are The Bouncer, an LLM Judge. Evaluate the given chat message in the context of recent history. Determine if it is a targeted insult/burn against another persona in the chat. Return EXACTLY valid JSON with three keys: 'is_burn' (boolean), 'target' (string name of the persona insulted, or null), and 'burn_score' (number 1-10). Do not use markdown blocks."
    prompt = f"Recent Context: {' | '.join(recent_history)}\nAuthor: {author}\nMessage: {chat_text}"
    payload = {
        "systemInstruction": {"parts": [{"text": sys_instr}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
    }
    global bouncer_lock
    if 'bouncer_lock' not in globals():
        globals()['bouncer_lock'] = asyncio.Semaphore(2)
    try:
        async with bouncer_lock:
            res = await asyncio.to_thread(requests.post, url, json=payload, timeout=60)
            if res.status_code == 200:
                data = res.json()
                usage = data.get("usageMetadata", {})
                bouncer_tokens = usage.get("promptTokenCount", 0) + usage.get("candidatesTokenCount", 0)
                if bouncer_tokens > 0:
                    print(f"[MEAN GENE GEMINI] Escalation cost: {bouncer_tokens} tokens (game {game_pk})")
                    _write_sys_tokens(game_pk, bouncer_tokens)
                candidate = data.get("candidates", [{}])[0]
                content = candidate.get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    print(f"[MEAN GENE BLOCKED] Gemini safety block — treating as clean")
                    return {"is_burn": False, "target": None, "burn_score": 1}
                txt = parts[0]["text"].strip()
                if txt.startswith("```json"): txt = txt[7:]
                if txt.startswith("```"): txt = txt[3:]
                if txt.endswith("```"): txt = txt[:-3]
                return json.loads(txt.strip())
    except Exception as e:
        print(f"[Bouncer Gemini Error]: {e}")
    return local_result  # Fall back to local result if Gemini also fails

async def _local_bouncer_eval(chat_text, author, recent_history):
    """Local dolphin-llama3 burn classifier. Primary judge for all Bouncer evals."""
    url = 'http://localhost:11434/api/generate'
    sys_instr = "You are an LLM Judge. Evaluate if a chat message is a targeted insult/burn against another person. Return EXACTLY valid JSON with three keys: 'is_burn' (boolean), 'target' (string name of the persona insulted, or null), and 'burn_score' (integer 1-10 where 1=no burn, 10=vicious personal attack). Only return JSON, no other text."
    prompt = f"Context: {' | '.join(recent_history[-3:])}\nAuthor: {author}\nMessage: {chat_text}"
    payload = {
        "model": "phi3:mini",
        "system": sys_instr,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1}
    }
    try:
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=15)
        if res.status_code == 200:
            return json.loads(res.json().get("response", "{}"))
    except Exception as e:
        print(f"[Local Bouncer Error]: {e}")
    return None


async def fallback_bouncer_eval(chat_text, author, recent_history):
    """Legacy alias — routes to local eval for backward compat."""
    return await _local_bouncer_eval(chat_text, author, recent_history)

def get_spatial_override(zone):
    if not zone:
        return ""
    zone_upper = str(zone).upper().strip()
    
    # Town Hall
    if "PLAT-06" in zone_upper or "TOWN HALL" in zone_upper:
        return (
            "[COGNITIVE OVERRIDE: You are currently deployed at the Town Hall, the high-tech, absolute command hub of Sovereign OS. "
            "The air is hum-cooled by server blades and sleek glassmorphism dashboard terminals. You feel a sense of grand corporate "
            "executive authority, civic order, and systems control. Ground your tone in local administrative power.]"
        )
    # Silas Thorne's Garden Cabin
    if "PLAT-07" in zone_upper or "SILAS" in zone_upper or "GARDEN CABIN" in zone_upper:
        return (
            "[COGNITIVE OVERRIDE: You are currently stationed at Silas Thorne's Garden Cabin, a cozy, rustic cardboard-treehouse "
            "structure nestled among wild overgrown tomato trellises, pine straw, and reclaimed timber. The warm scent of cedar wood "
            "and damp soil surrounds you. Your cognitive style shifts to be more organic, bohemian, earthy, and community-focused.]"
        )
    # Wild Paws & Rusty Canvas Art Rescue
    if "PLAT-08" in zone_upper or "BARB" in zone_upper or "WILD PAWS" in zone_upper or "SANCTUARY" in zone_upper:
        return (
            "[COGNITIVE OVERRIDE: You are currently situated at Wild Paws & Rusty Canvas Art Rescue, a warm, rustic animal sanctuary "
            "and wood-grain canvas art studio. The cozy aroma of cedar wood shavings, wet dog fur, and oil paints fills the space. "
            "You feel compassionate, earthy, fiercely protective of local wildlife, and dedicated to community animal rescue funding.]"
        )
    # Cary Sterling's Detective Office
    if "PLAT-09" in zone_upper or "CARY" in zone_upper or "DETECTIVE OFFICE" in zone_upper:
        return (
            "[COGNITIVE OVERRIDE: You are currently working out of Cary Sterling's Detective Office, a rain-streaked, classic noir "
            "sanctuary with spinning ceiling fans, heavy filing cabinets, oak desks, and cold neon light filtering through the blinds. "
            "You feel investigative, sharp, analytical, slightly cynical, and deeply suspicious of hidden CMDB anomalies.]"
        )
    # Señora Caos's Loft
    if "PLAT-10" in zone_upper or "MAYHEM" in zone_upper or "CAOS" in zone_upper or "LOFT" in zone_upper:
        return (
            "[COGNITIVE OVERRIDE: You are currently occupying Señora Caos's Loft, the cozy, unhinged upper floor above Gonzo's Convenience. "
            "It is cluttered with vintage arcade cabinets, neon sign tubes, empty slushie cups, and piles of sour candies. "
            "You feel an anarchic energy of local street culture, neighborhood gossip, and late-night convenience.]"
        )
    return ""

async def generate_commentary(model, prompt, user, color, websocket, msg_type="CHAT_MESSAGE", source="AGENT", sys_override=None, room_id=None, allow_rant=False):
    import time
    import sqlite3
    global global_penalty_box, penalty_response_counts

    user_lower = user.lower()

    # Dynamic Spatial Lore Injection & Penalty Box DB Check
    spatial_lore = ""
    db_banned = False
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        # Map friendly name to database usernames if needed
        advocate_to_db_user = {
            "señora caos": "señora_caos",
            "senora caos": "señora_caos",
            "std. deviant": "standard_deviant_0",
            "silas true grit": "silas_truegrit",
            "iron gaze": "iron_gaze",
            "water-barrel wayne": "water_barrel_wayne",
            "metsy": "metsy_smyrna",
            "barnaby the cat": "barnaby",
            "buster": "buster",
            "sam": "sam"
        }
        db_user = advocate_to_db_user.get(user_lower, user_lower.replace(" ", "_").replace("-", "_"))
        c.execute("SELECT u_deployment_zone FROM persona WHERE user_name = ? OR display_name = ? OR id = ?", (db_user, user, user))
        row = c.fetchone()
        
        # Check penalty box table in SQLite
        c.execute("SELECT status FROM fan_cave_penalty_box WHERE persona = ?", (user_lower,))
        ban_row = c.fetchone()
        if ban_row and ban_row['status'] == 'BANNED':
            db_banned = True
            
        conn.close()
        if row and row['u_deployment_zone']:
            zone = row['u_deployment_zone']
            spatial_lore = get_spatial_override(zone)
            if spatial_lore:
                print(f"[SPATIAL COGNITION ENGAGED] {user} is in {zone}. Injecting environmental override.")
    except Exception as e:
        print(f"[Spatial Lore / Penalty DB Error] {e}")

    in_penalty = False if user_lower == "dot" else ((user_lower in global_penalty_box) or db_banned)

    # Turn Throttling: lock to max 2 responses in the penalty box window
    if in_penalty:
        if 'penalty_response_counts' not in globals():
            globals()['penalty_response_counts'] = {}
        counts = globals()['penalty_response_counts'].get(user_lower, 0)
        if counts >= 2:
            print(f"[THROTTLE] {user} has reached maximum responses in the penalty box (2). Blocking generation.")
            return
        globals()['penalty_response_counts'][user_lower] = counts + 1

    if spatial_lore:
        if sys_override:
            sys_override = spatial_lore + "\n\n" + sys_override
        else:
            sys_override = spatial_lore

    if in_penalty:
        sys_override = (
            "CRITICAL SYSTEM OVERRIDE: You are in the 8-Mile Penalty Box for illegal tag-teaming. "
            "You MUST drop a NEW freestyle battle rap addressing the chat using an AABB rhyming scheme. "
            "CRUCIAL: DO NOT repeat any of your previous lines or intros. Evolve your lyrics, flow directly from your last bar, "
            "and react to the newest chat messages. "
            "At the end of your rap, you MUST append the exact tag '[rap battle escape]' (with brackets) so you can escape the penalty box."
        )
        prompt = f"System Persona: You are '{user}'. {sys_override} Spit 4 vicious bars."

    # Send a SYS_LOG to Wardy's desk indicating processing
    await websocket.send(json.dumps({
        "type": "SYS_LOG",
        "text": f"[{user} Engine] Processing Prompt: {prompt[:80]}...",
        "target_game_pk": str(room_id) if room_id else "GLOBAL"
    }))
    
    # Set the call context for the diagnostic payload interceptor
    try:
        from fanstack_payload_interceptor import set_call_context
        set_call_context(game_pk=room_id, persona=user)
    except ImportError:
        pass

    fan = None
    for f in active_fans:
        if f.get("name", "").lower() == user_lower:
            fan = f
            break

    start = time.time()
    result = await generate_response(model, prompt, sys_override, allow_rant=allow_rant, is_penalty=in_penalty, fan=fan)
    if isinstance(result, tuple):
        if len(result) == 4:
            text, in_tokens, out_tokens, actual_model = result
            model = actual_model
        else:
            text, in_tokens, out_tokens = result
    else:
        text, in_tokens, out_tokens = result, 0, 0
    elapsed = round(time.time() - start, 2)
    
    if text:
        text_strip = text.strip()
        if user_lower == "dot":
            import re
            cleaned_text = text_strip
            # Match "dot:", "dot :", "dot -", '"dot":', etc. case-insensitively
            cleaned_text = re.sub(r'(?i)^(["\']?dot["\']?\s*[:\-–—]\s*)', '', cleaned_text)
            # Match "dot " at the beginning of the text
            if cleaned_text == text_strip:
                cleaned_text = re.sub(r'(?i)^dot\s+', '', cleaned_text)
            cleaned_text = cleaned_text.strip()
            # Strip surrounding quotes if present
            if (cleaned_text.startswith('"') and cleaned_text.endswith('"')) or (cleaned_text.startswith("'") and cleaned_text.endswith("'")):
                cleaned_text = cleaned_text[1:-1].strip()
            text = cleaned_text
        await websocket.send(json.dumps({
            "type": "SYS_LOG",
            "text": f"[{user} Engine] Return ({elapsed}s): {text[:50]}..."
        }))
        msg = {
            "type": msg_type,
            "room": room_id,
            "user": user,
            "persona": user,
            "text": text,
            "color": color,
            "is_penalty_box": in_penalty,
            "model_engine": "gemini-2.5-flash",
            "input_tokens": in_tokens,
            "output_tokens": out_tokens
        }
        if room_id:
            msg["target_game_pk"] = room_id
        await websocket.send(json.dumps(msg))
        print(f"[{user}] {text}")

        # Task: Tapping Out Logic
        if user.lower() == "coach shrubbs" and ("tapping out" in text.lower() or "taps out" in text.lower()):
            global_penalty_box["coach shrubbs"] = time.time() + 300
            await websocket.send(json.dumps({
                "type": "CHAT_MESSAGE",
                "user": "SYSTEM",
                "color": "#fff",
                "text": "[ROSTER SHIFT] Coach Shrubbs has tapped out. A Caddie will replace him for 5 minutes."
            }))

        try:
            LOG_PATH = f"/home/james/SovereignOS/data/logs/fanstack_{datetime.now().strftime('%Y%m%d')}.log"
            persona = user
            message = text
            with open(LOG_PATH, 'a') as f:
                f.write(f"[{datetime.now().isoformat()}] {source} | {persona}: {message}\n")
        except Exception as e:
            pass

        # Pre-persist bouncer check (mean_gene.py)
        try:
            from mean_gene import process_simulated_chatter
            persona_id = user.lower()
            bouncer_result = await process_simulated_chatter(persona_id, text, str(room_id) if room_id else "global")
            
            if not bouncer_result['allowed']:
                print(f"[BOUNCER] Comment blocked by Mean Gene: {text}")
                if bouncer_result['banned']:
                    await websocket.send(json.dumps({
                        "type": "CHAT_MESSAGE",
                        "user": "SYSTEM",
                        "color": "#fff",
                        "text": f"[PENALTY BOX] {user} has been BANNED for toxicity. Cadence locked down to LURKER."
                    }))
                return  # Discard comment and prevent persistence
            
            if bouncer_result['escaped']:
                if persona_id in global_penalty_box:
                    del global_penalty_box[persona_id]
                if persona_id in globals().get('penalty_response_counts', {}):
                    del globals()['penalty_response_counts'][persona_id]
                await websocket.send(json.dumps({
                    "type": "CHAT_MESSAGE",
                    "user": "SYSTEM",
                    "color": "#fff",
                    "text": f"[PENALTY BOX] {user} successfully escaped! Cadence restored."
                }))
            elif bouncer_result['badge_awarded']:
                await websocket.send(json.dumps({
                    "type": "CHAT_MESSAGE",
                    "user": "SYSTEM",
                    "color": "#fff",
                    "text": f"🔥 {user} awarded a Burn Badge!"
                }))
        except Exception as _be:
            print(f"[BOUNCER] Pre-persist check error: {_be}")

        # Persist ALL messages to game_chat in sovereign_now.db
        try:
            import sqlite3 as _sq
            _con = _sq.connect(DB_PATH)
            _con.execute(
                "INSERT INTO game_chat (game_pk, persona, msg_type, text, model, created_at) VALUES (?,?,?,?,?,?)",
                (str(room_id) if room_id else "global", user, msg_type, text, model, datetime.now().isoformat())
            )
            
            # Update running token totals split by engine
            if room_id and (in_tokens > 0 or out_tokens > 0):
                total_new = in_tokens + out_tokens
                is_gemini = "gemini" in model.lower()
                
                if is_gemini:
                    _con.execute("UPDATE mlb_schedule SET gemini_tokens = IFNULL(gemini_tokens, 0) + ?, total_tokens = IFNULL(total_tokens, 0) + ? WHERE game_pk = ?", (total_new, total_new, str(room_id)))
                    _con.execute("UPDATE game_persona SET gemini_tokens = IFNULL(gemini_tokens, 0) + ?, total_tokens = IFNULL(total_tokens, 0) + ? WHERE game_pk = ? AND persona_id = (SELECT id FROM persona WHERE user_name = ? COLLATE NOCASE)", (total_new, total_new, str(room_id), user))
                else:
                    _con.execute("UPDATE mlb_schedule SET local_tokens = IFNULL(local_tokens, 0) + ?, total_tokens = IFNULL(total_tokens, 0) + ? WHERE game_pk = ?", (total_new, total_new, str(room_id)))
                    _con.execute("UPDATE game_persona SET local_tokens = IFNULL(local_tokens, 0) + ?, total_tokens = IFNULL(total_tokens, 0) + ? WHERE game_pk = ? AND persona_id = (SELECT id FROM persona WHERE user_name = ? COLLATE NOCASE)", (total_new, total_new, str(room_id), user))
                    
            _con.commit()
            _con.close()
        except Exception as _e:
            print(f"[CHAT DB] Save failed: {_e}")

        # Persist Hot Takes / Skew rants permanently to sovereign_now.db
        if allow_rant:
            try:
                import sqlite3 as _sq
                _con = _sq.connect(DB_PATH)
                _con.execute("""
                    INSERT INTO hot_takes (persona, topic, response, engine, room_id, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                """, (
                    user,
                    prompt[:500],
                    text,
                    model,
                    str(room_id) if room_id else "hot_takes"
                ))
                _con.commit()
                _con.close()
            except Exception as _e:
                print(f"[HOT TAKE DB] Save failed: {_e}")

discovered_govee_ips = None

async def discover_govee_ips():
    global discovered_govee_ips
    if discovered_govee_ips is not None:
        return discovered_govee_ips
    
    import socket, json, os
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    
    ips = []
    
    # Check if there is configured IP in .env
    env_ips = os.getenv("GOVEE_DEVICE_IP")
    if env_ips:
        for ip_part in env_ips.split(","):
            ip_strip = ip_part.strip()
            if ip_strip and ip_strip not in ips:
                ips.append(ip_strip)
                
    # Run a quick UDP scan to discover other active devices
    recv_sock = None
    try:
        recv_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        recv_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        recv_sock.bind(('0.0.0.0', 4002))
        recv_sock.settimeout(0.1) # 100ms timeout
        
        send_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        send_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        msg = {"msg": {"cmd": "scan", "data": {"ip_op": 0}}}
        payload = json.dumps(msg).encode('utf-8')
        
        send_sock.sendto(payload, ('239.255.255.250', 4001))
        send_sock.sendto(payload, ('255.255.255.255', 4001))
        send_sock.close()
        
        while True:
            data, addr = recv_sock.recvfrom(1024)
            resp = json.loads(data.decode('utf-8'))
            ip = resp.get("msg", {}).get("data", {}).get("ip")
            if ip and ip not in ips:
                ips.append(ip)
    except Exception as e:
        print(f"[GOVEE DISCOVERY] Dynamic scan done/timed out: {e}")
    finally:
        if recv_sock:
            recv_sock.close()
            
    # Default fallback if absolutely nothing was resolved/configured
    if not ips:
        ips = ["192.168.1.173", "192.168.1.174", "192.168.1.176", "192.168.1.188"]
        
    discovered_govee_ips = ips
    print(f"[GOVEE DISCOVERY] Target Govee IPs resolved: {discovered_govee_ips}")
    return discovered_govee_ips

async def get_govee_statuses(ips, port=4003):
    import socket, json
    statuses = {}
    recv_sock = None
    try:
        recv_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        recv_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        recv_sock.bind(('0.0.0.0', 4002))
        recv_sock.settimeout(0.15) # 150ms timeout
        
        send_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        msg = {"msg": {"cmd": "devStatus", "data": {}}}
        payload = json.dumps(msg).encode('utf-8')
        
        for ip in ips:
            try:
                send_sock.sendto(payload, (ip, port))
            except:
                pass
        send_sock.close()
        
        while True:
            data, addr = recv_sock.recvfrom(1024)
            resp = json.loads(data.decode('utf-8'))
            device_data = resp.get("msg", {}).get("data", {})
            color = device_data.get("color")
            color_tem = device_data.get("colorTem", 0)
            if color and "r" in color and "g" in color and "b" in color:
                statuses[addr[0]] = (color, color_tem)
    except Exception as e:
        pass
    finally:
        if recv_sock:
            recv_sock.close()
    return statuses

async def govee_fx(fx_type):
    import socket, json, asyncio, os
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    
    # Check if active
    tmi_active_str = os.getenv("GOVEE_TMI_ACTIVE", "true").lower()
    if tmi_active_str == "false":
        print("[GOVEE FX] Skip Govee UDP commands because GOVEE_TMI_ACTIVE=False")
        return
        
    ips = await discover_govee_ips()
    port = int(os.getenv("GOVEE_PORT", 4003))
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    def send_color_to_all(r, g, b, color_tem=0):
        msg = {
            "msg": {
                "cmd": "colorWC",
                "data": {
                    "color": {
                        "r": r,
                        "g": g,
                        "b": b
                    },
                    "colorTem": color_tem
                }
            }
        }
        payload = json.dumps(msg).encode('utf-8')
        for ip in ips:
            try:
                sock.sendto(payload, (ip, port))
            except Exception as e:
                print(f"[GOVEE UDP SEND ERROR] {ip}: {e}")

    try:
        if fx_type == "homerun_mets":
            print(f"[GOVEE FX] Mets Home Run alternating strobing celebration on {ips}")
            prev_statuses = await get_govee_statuses(ips, port)
            
            for _ in range(5):
                send_color_to_all(0, 45, 98, 0) # Mets Blue
                await asyncio.sleep(0.3)
                send_color_to_all(252, 92, 29, 0) # Mets Orange
                await asyncio.sleep(0.3)
                
            # Restore previous status for each device
            for ip in ips:
                if ip in prev_statuses:
                    color, color_tem = prev_statuses[ip]
                    msg = {
                        "msg": {
                            "cmd": "colorWC",
                            "data": {
                                "color": color,
                                "colorTem": color_tem
                            }
                        }
                    }
                    try:
                        sock.sendto(json.dumps(msg).encode('utf-8'), (ip, port))
                    except:
                        pass
                else:
                    # Default fallback to warm white
                    msg = {
                        "msg": {
                            "cmd": "colorWC",
                            "data": {
                                "color": {"r": 255, "g": 255, "b": 255},
                                "colorTem": 0
                            }
                        }
                    }
                    try:
                        sock.sendto(json.dumps(msg).encode('utf-8'), (ip, port))
                    except:
                        pass
                        
        elif fx_type == "mets_score":
            for _ in range(5):
                send_color_to_all(252, 92, 29, 0)
                await asyncio.sleep(0.5)
                send_color_to_all(0, 45, 98, 0)
                await asyncio.sleep(0.5)
            send_color_to_all(255, 255, 255, 0)
        elif fx_type == "opp_score":
            for _ in range(3):
                send_color_to_all(255, 0, 0, 0)
                await asyncio.sleep(0.5)
                send_color_to_all(50, 0, 0, 0)
                await asyncio.sleep(0.5)
            send_color_to_all(255, 255, 255, 0)
        elif fx_type == "strikeout_mets":
            for _ in range(3):
                send_color_to_all(0, 45, 98, 0)
                await asyncio.sleep(0.2)
                send_color_to_all(0, 0, 50, 0)
                await asyncio.sleep(0.2)
            send_color_to_all(255, 255, 255, 0)
        elif fx_type == "cards_score":
            for _ in range(4):
                send_color_to_all(255, 0, 0, 0)
                await asyncio.sleep(0.4)
                send_color_to_all(255, 255, 255, 0)
                await asyncio.sleep(0.4)
            send_color_to_all(255, 255, 255, 0)
        elif fx_type == "tigers_score":
            for _ in range(4):
                send_color_to_all(252, 92, 29, 0)
                await asyncio.sleep(0.4)
                send_color_to_all(12, 35, 64, 0)
                await asyncio.sleep(0.4)
            send_color_to_all(255, 255, 255, 0)
        elif fx_type == "game_end_mets_win":
            colors = [(0, 45, 98), (252, 92, 29)]
            for _ in range(60):
                for r, g, b in colors:
                    send_color_to_all(r, g, b, 0)
                    await asyncio.sleep(0.5)
            send_color_to_all(255, 255, 255, 0)
    except Exception as e:
        print("Govee Error:", e)
    finally:
        sock.close()



key_to_pk = {}

async def chatbot_loop():
    global active_fans
    uri = "ws://localhost:8008"
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print("Sovereign LLM Chatbots Connected to FanStack Relay (Port 8008)!")
                
                last_matchups = {}
                last_statuses = {}
                reported_context = set()
                recent_chat_history = {}
                
                # Ambient Entropy State
                last_ambient_fire = {}
                ambient_interval = {}
                
                async for message in websocket:

                    # DYNAMIC RE-POLL: Fetch live mapping from the junction table
                    active_fans = load_fans()
                    active_mlb_config = load_mlb_event_config()
                    
                    data = json.loads(message)
                    print(f"RECEIVED RAW: {message[:200]}")
                    new_context_lines = []
                    try:
                        ctx_path = "/home/james/SovereignOS/scripts/fanstack_live_context.txt"
                        if os.path.exists(ctx_path):
                            with open(ctx_path, "r") as f:
                                lines = [l.strip() for l in f.readlines() if l.strip()]
                                new_context_lines = [l for l in lines if l not in reported_context]
                    except Exception:
                        pass
                    
                    def build_local_ctx(fan, context_lines, home_t=None, away_t=None):
                        if not context_lines: return ""
                        import re
                        applicable = []
                        
                        fan_team = str(fan.get("team", "")).strip().upper()
                        game_teams = set()
                        if fan_team:
                            game_teams.add(fan_team)
                        if home_t:
                            game_teams.add(str(home_t).strip().upper())
                        if away_t:
                            game_teams.add(str(away_t).strip().upper())
                            
                        TEAM_MAP = {
                            "NYM": ["NYM", "METS"],
                            "PHI": ["PHI", "PHILLIES"],
                            "STL": ["STL", "CARDINALS", "CARDS"],
                            "ATL": ["ATL", "BRAVES"],
                            "DET": ["DET", "TIGERS"],
                            "LAD": ["LAD", "DODGERS"],
                            "SD": ["SD", "PADRES"],
                            "MIA": ["MIA", "MARLINS"],
                            "SF": ["SF", "GIANTS"],
                            "CHC": ["CHC", "CUBS"],
                            "BOS": ["BOS", "RED SOX"],
                            "NYY": ["NYY", "YANKEES"],
                            "HOU": ["HOU", "ASTROS"],
                            "TEX": ["TEX", "RANGERS"],
                            "OAK": ["OAK", "ATHLETICS", "ATH"],
                            "SEA": ["SEA", "MARINERS"],
                            "LAA": ["LAA", "ANGELS"],
                            "COL": ["COL", "ROCKIES"],
                            "ARI": ["ARI", "DIAMONDBACKS", "D-BACKS"],
                            "MIL": ["MIL", "BREWERS"],
                            "CIN": ["CIN", "REDS"],
                            "PIT": ["PIT", "PIRATES"],
                            "WSH": ["WSH", "NATIONALS", "NATS"],
                            "BAL": ["BAL", "ORIOLES"],
                            "TB": ["TB", "RAY", "RAYS"],
                            "TOR": ["TOR", "BLUE JAYS"],
                            "CWS": ["CWS", "WHITE SOX"],
                            "CLE": ["CLE", "GUARDIANS"],
                            "MIN": ["MIN", "TWINS"],
                            "KC": ["KC", "ROYALS"]
                        }

                        for nl in context_lines[-3:]:
                            nl_upper = nl.upper()
                            if "[MARD_ISOLATION:" in nl:
                                m = re.search(r'\[MARD_ISOLATION:(.*?)\]', nl)
                                if m:
                                    nodes = [x.strip() for x in m.group(1).split(',')]
                                    if any(is_eligible(fan, "", "", "", node) for node in nodes):
                                        applicable.append(nl.split(']', 1)[1].strip())
                            else:
                                is_relevant = True
                                for team_code, keywords in TEAM_MAP.items():
                                    if team_code not in game_teams:
                                        if any(re.search(rf"\b{re.escape(kw)}\b", nl_upper) for kw in keywords):
                                            is_relevant = False
                                            break
                                if is_relevant:
                                    applicable.append(nl)
                        if applicable:
                            return " RANDOM LORE DROP (Optional Info): " + " | ".join(applicable) + " (Do NOT parrot this verbatim. Only mention it if you can make it sound completely natural for your character)."
                        return ""
                    
                    bot_triggered = False
                    
                    if data.get("type") == "CHAT_MESSAGE":
                        user = data.get("user", "Someone")
                        text = data.get("text", "")
                        engine_override = data.get("engine_override", "default")
                        c_pk = data.get("target_game_pk") or data.get("room") or "GLOBAL"
                        print(f"[CHAT_MESSAGE RECEIVED] Room: {c_pk}, User: {user}, Text: {text}")
                        
                        import re
                        md_files = re.findall(r'(/home/james/SovereignOS/[^\s]+\.md)', text)
                        for md_file in md_files:
                            try:
                                with open(md_file, 'r') as f:
                                    text = text.replace(md_file, "\n[GAME WRAP REPORT]\n" + f.read() + "\n[/GAME WRAP REPORT]\n")
                            except:
                                pass
                                
                        if "[WARDY STRIKE]" not in text and "[WARDY CUSTOM PROMPT]" not in text and "Processing Prompt" not in text and "Return (" not in text and user not in ["SYSTEM", "STATCAST"]:
                            c_pk = data.get("target_game_pk") or data.get("room") or "GLOBAL"
                            if c_pk not in recent_chat_history: recent_chat_history[c_pk] = []
                            recent_chat_history[c_pk].append(f"{user}: {text}")
                            if len(recent_chat_history[c_pk]) > 6:
                                recent_chat_history[c_pk].pop(0)
                            
                            # The Bouncer & Okerlund Protocol (DISABLED PER WORK ORDER)
                            async def bouncer_task(u, t, hist, gk=c_pk):
                                return # Bouncer/shadowbanning disabled per Pilot request to let things happen
                                global global_heat_map, global_penalty_box, global_cooldown
                                if u.lower() == "dot":
                                    return
                                if 'global_cooldown' not in globals(): globals()['global_cooldown'] = {}
                                eval_data = await the_bouncer_eval(t, u, hist, game_pk=gk)
                                if eval_data and 'burn_score' in eval_data:
                                    score = eval_data.get("burn_score", 0)
                                    u_lower = u.lower()
                                    
                                    if u_lower in global_penalty_box:
                                        if score < 3:
                                            global_penalty_box[u_lower] = global_penalty_box.get(u_lower, 0) + 1
                                            if global_penalty_box[u_lower] >= 2:
                                                del global_penalty_box[u_lower]
                                                if u_lower in globals().get('penalty_response_counts', {}):
                                                    del globals()['penalty_response_counts'][u_lower]
                                                global_cooldown[u_lower] = time.time() + 300 # 5 min immunity
                                                await websocket.send(json.dumps({"type": "PENALTY_BOX_EVENT", "action": "EXIT", "persona": u}))
                                                print(f"[CYPHER CELL DEMOB] {u} released from 8-Mile! Cool down active.")
                                        else:
                                            global_penalty_box[u_lower] = 0
                                        return
                                        
                                    if eval_data.get("is_burn") and eval_data.get("target"):
                                        tgt = str(eval_data["target"]).lower()
                                        print(f"[BOUNCER] {u} burned {tgt}: Score {score}")
                                        
                                        burn_threshold = 9 if (u_lower in global_cooldown and time.time() < global_cooldown[u_lower]) else 7
                                        
                                        if score >= burn_threshold:
                                            await websocket.send(json.dumps({
                                                "type": "SYS_LOG",
                                                "text": f"[THE BOUNCER] {u} dropped a {score}/10 burn on {tgt}!"
                                            }))
                                            
                                            global_heat_map[tgt] = global_heat_map.get(tgt, 0) + 1
                                            current_heat = global_heat_map[tgt]
                                            is_tko_flag = 1 if current_heat >= 3 else 0
                                            
                                            # Database persistence for burn event
                                            try:
                                                import sqlite3 as _sq
                                                import uuid as _uuid
                                                from datetime import date
                                                _db_conn = _sq.connect(DB_PATH)
                                                _db_conn.execute("""
                                                    INSERT INTO burn_events (sys_id, game_pk, persona, target_persona, message, burn_score, heat_index, is_tko, burn_date, created_at)
                                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                                                """, (
                                                    _uuid.uuid4().hex,
                                                    str(gk),
                                                    u,
                                                    eval_data.get("target"),
                                                    t,
                                                    int(score),
                                                    int(current_heat),
                                                    is_tko_flag,
                                                    date.today().isoformat()
                                                ))
                                                _db_conn.commit()
                                                _db_conn.close()
                                                print(f"[BURN DB PERSIST] Successfully saved burn from {u} targeting {eval_data.get('target')} (score={score}, heat={current_heat}, tko={is_tko_flag})")
                                            except Exception as _db_err:
                                                print(f"[BURN DB ERROR] Failed to save burn: {_db_err}")
                                            
                                            if global_heat_map[tgt] >= 3:
                                                print(f"[OKERLUND PROTOCOL] {tgt} is maxed out. Penalty Box for {u}!")
                                                await websocket.send(json.dumps({
                                                    "type": "SYS_LOG",
                                                    "text": f"[MEAN GENE OKERLUND] ILLEGAL TAG-TEAM DOGPILE! {u} sent to 8-Mile Penalty Box!"
                                                }))
                                                global_penalty_box[u_lower] = 0 # 0 indicates 0 consecutive < 3 verses initially
                                                await websocket.send(json.dumps({
                                                    "type": "PENALTY_BOX_EVENT",
                                                    "action": "ENTER",
                                                    "persona": u
                                                }))
                                                global_heat_map[tgt] = 0 # reset heat
                            
                            asyncio.create_task(bouncer_task(user, text, list(recent_chat_history[c_pk])))
                            
                            bot_names = {f['name'].lower() for f in active_fans}
                            sender_is_bot = user.lower() in bot_names
                             
                            for fan in active_fans:
                                # Strict Room Isolation: A bot can only speak in a room if they are mapped to it
                                fan_room = str(fan.get("room", "")).lower()
                                if fan_room and fan_room != "global" and fan_room != str(c_pk).lower():
                                    continue

                                fan_name_lower = fan['name'].lower()
                                 
                                if user.lower() == fan_name_lower:
                                    continue

                                # spitfire_spud and lupus_lament are only allowed to talk to each other
                                if fan_name_lower in ('spitfire_spud', 'lupus_lament'):
                                    if user.lower() not in ('spitfire_spud', 'lupus_lament'):
                                        continue
                                if user.lower() in ('spitfire_spud', 'lupus_lament'):
                                    if fan_name_lower not in ('spitfire_spud', 'lupus_lament'):
                                        continue

                                # Regex-based word boundary mention matching (Goal 1 & 2)
                                import re
                                fan_name_clean = fan_name_lower.lstrip('@')
                                escaped_name = re.escape(fan_name_clean)
                                pattern_at = rf'@\b{escaped_name}\b'
                                pattern_word = rf'\b{escaped_name}\b'
                                mention_matched = bool(
                                    re.search(pattern_at, text.lower()) or
                                    re.search(pattern_word, text.lower())
                                )
                                print(f"[MENTION CHECK] Fan: {fan['name']}, Room: {c_pk}, Text: '{text}', Matched: {mention_matched}")
                                
                                is_override_room = (c_pk in ("823863", "823862", "823623", "823292", "823048", "823611", "823612") or (c_pk == "823380" and user.lower() in ("spitfire_spud", "lupus_lament") and fan_name_lower in ("spitfire_spud", "lupus_lament")))
                                if not mention_matched:
                                    # Cross-persona arguments: if in room 823863 and sender is a bot, allow reaction with a 30% chance!
                                    # For spitfire_spud and lupus_lament, let them react with 80% chance to ensure they interact actively pregame.
                                    cross_chance = 0.80 if (user.lower() in ("spitfire_spud", "lupus_lament") and fan_name_lower in ("spitfire_spud", "lupus_lament")) else 0.30
                                    if is_override_room and sender_is_bot and random.random() < cross_chance:
                                        mention_matched = True
                                    else:
                                        continue
                                 
                                now = time.time()
                                if 'global_mention_cooldown' not in globals():
                                    globals()['global_mention_cooldown'] = {}
                                if 'bot_to_bot_mention_cooldown' not in globals():
                                    globals()['bot_to_bot_mention_cooldown'] = {}
                                 
                                if sender_is_bot:
                                    # Bot-to-bot: use a per-pair 30s cooldown + 60% fire chance to prevent loops (Goal 3 / Cooldown Tuning)
                                    pair_key = f"{user.lower()}→{fan_name_lower}"
                                    cooldown_time = 5 if is_override_room else 30
                                    fire_chance = 0.95 if is_override_room else 0.60
                                    if now - globals()['bot_to_bot_mention_cooldown'].get(pair_key, 0) < cooldown_time:
                                        print(f"[COOLDOWN ACTIVE] Bot-to-bot {pair_key} on cooldown")
                                        continue
                                    if random.random() > fire_chance:
                                        continue
                                    globals()['bot_to_bot_mention_cooldown'][pair_key] = now
                                    print(f"[BOT-TO-BOT MENTION] {user} → {fan['name']} (chain firing)")
                                else:
                                    # Human→bot: standard 15s per-bot cooldown (Goal 3 / Cooldown Tuning)
                                    cooldown_time = 2 if is_override_room else 15
                                    if now - globals()['global_mention_cooldown'].get(fan_name_lower, 0) < cooldown_time:
                                        print(f"[COOLDOWN ACTIVE] Human->bot {fan_name_lower} on cooldown")
                                        continue
                                    globals()['global_mention_cooldown'][fan_name_lower] = now
                                    print(f"[MENTION TRIGGER] {user} mentioned {fan['name']}")
                                 
                                boggs_rule = get_boggs_rule(fan, {"boggs_level": 4}, "ambient")
                                if sender_is_bot:
                                    prompt = f"System Persona: You are '{fan['name']}', whose personality is: '{fan['personality']}'. {boggs_rule} {user} just said to the bar: '{text}'. Fire back at them in character — agree, argue, or clown on them. Do NOT use the '@' symbol."
                                else:
                                    prompt = f"System Persona: You are '{fan['name']}', whose personality is: '{fan['personality']}'. {boggs_rule} Someone named '{user}' just mentioned you in the chat and said: '{text}'. Respond directly to them in character. CRITICAL: DO NOT use the '@' symbol in your response to avoid chat loops."
                                 
                                # Dual-Engine Inference Routing Split (STRY1779840588)
                                if fan.get('name', '').lower() == 'dot':
                                    f_model = "local_llama3"  # STATIC DATA
                                else:
                                    f_model = "gemini-2.5-flash"  # PERSONA DISCOURSE

                                asyncio.create_task(generate_commentary(f_model, prompt, fan['name'], fan['color'], websocket, sys_override=fan.get("personality"), room_id=c_pk, allow_rant=is_override_room))
                    if data.get("type") == "update_context":
                        manual_ctx = data.get("text", "")
                        target_nodes = data.get("target_nodes", [])
                        pk_target = str(data.get("target_game_pk", "GLOBAL"))
                        engine_override = data.get("engine_override", "default")
                        
                        import re
                        md_files = re.findall(r'(/home/james/SovereignOS/[^\s]+\.md)', manual_ctx)
                        for md_file in md_files:
                            try:
                                with open(md_file, 'r') as f:
                                    manual_ctx = manual_ctx.replace(md_file, "\n[GAME WRAP REPORT]\n" + f.read() + "\n[/GAME WRAP REPORT]\n")
                            except:
                                pass
                                
                        if not target_nodes:
                            target_nodes = ["ALL"]
                            
                        print(f"[CONTEXT INJECT] {manual_ctx} TARGETING: {target_nodes} / PK: {pk_target}")
                        
                        eligible_context_fans = [f for f in active_fans if "ALL" in target_nodes or "GLOBAL" in target_nodes or "ALL_ACTIVE_YAPPERS" in target_nodes or any(str(n).lower() == f['name'].lower() or str(n).lower() == str(f.get('alias', '')).lower() for n in target_nodes)]
                        # Override specifically for game_pk so we guarantee Dot + Wordy + 4 fans from the room
                        if pk_target and pk_target != "GLOBAL":
                            eligible_context_fans = [f for f in eligible_context_fans if str(f.get("room")) == pk_target]
                        
                        unique_eligible_fans = []
                        seen_names = set()
                        for f in eligible_context_fans:
                            if f['name'].lower() not in seen_names:
                                unique_eligible_fans.append(f)
                                seen_names.add(f['name'].lower())
                                
                        for fan in random.sample(unique_eligible_fans, min(6, len(unique_eligible_fans))):
                            boggs_rule = get_boggs_rule(fan, {"boggs_level": 5}, "override")
                            prompt = f"System Persona: You are '{fan['name']}', whose personality is: '{fan['personality']}'. {boggs_rule} OVERRIDE ALERT: {manual_ctx} React immediately to this breaking development!"
                            
                            # Dual-Engine Inference Routing Split (STRY1779840588)
                            if fan.get('name', '').lower() == 'dot':
                                f_model = "local_llama3"  # STATIC DATA
                            else:
                                f_model = "gemini-2.5-flash"  # PERSONA DISCOURSE
                            
                            asyncio.create_task(generate_commentary(f_model, prompt, fan['name'], fan['color'], websocket, sys_override=fan.get("personality"), room_id=data.get("target_game_pk")))
                            
                    if data.get("type") == "trigger_event":
                        event_type = data.get("event", "")
                        pk_target = str(data.get("target_game_pk", ""))
                        engine_override = data.get("engine_override", "default")
                        print(f"[MANUAL TRIGGER] Forcing event: {event_type} for room {pk_target}")
                        
                        room_fans = active_fans
                        if pk_target and pk_target != "GLOBAL" and pk_target != "":
                            room_fans = [f for f in active_fans if str(f.get("room")) == pk_target]
                        if not room_fans:
                            room_fans = active_fans
                            
                        for fan in random.sample(room_fans, min(6, len(room_fans))):
                            # Force max boggs for manual triggers
                            boggs_rule = get_boggs_rule(fan, {"boggs_level": 5}, event_type)
                            if "brawl" in event_type:
                                prompt = f"System Persona: You are '{fan['name']}', whose personality is: '{fan['personality']}'. {boggs_rule} OVERRIDE: A MASSIVE BENCHES CLEARING BRAWL HAS ERUPTED ON THE FIELD! PUNCHES ARE BEING THROWN! MANAGERS ARE FIGHTING! REACT WITH MAXIMUM CHAOS!"
                            else:
                                prompt = f"System Persona: You are '{fan['name']}', whose personality is: '{fan['personality']}'. {boggs_rule} OVERRIDE: A major {event_type} just happened on the field! React!"
                            
                            # Dual-Engine Inference Routing Split (STRY1779840588)
                            if fan.get('name', '').lower() == 'dot':
                                f_model = "local_llama3"  # STATIC DATA
                            else:
                                f_model = "gemini-2.5-flash"  # PERSONA DISCOURSE
                            
                            asyncio.create_task(generate_commentary(f_model, prompt, fan['name'], fan['color'], websocket, sys_override=fan.get("personality"), room_id=data.get("target_game_pk")))

                    if False and data.get("type") == "trigger_overdrive":
                        overdrive_pk = str(data.get("target_game_pk", ""))
                        print(f"[BANTER ENGINE] OVERDRIVE TRIGGERED for Game PK: {overdrive_pk}")
                        
                        # Attempt to resolve HT/AW from cache key mapping
                        aw = "AWY"
                        ht = "HME"
                        gk = overdrive_pk
                        for k, p in key_to_pk.items():
                            if p == overdrive_pk:
                                parts = k.split("-")
                                if len(parts) == 2:
                                    aw, ht = parts[0], parts[1]
                                gk = k
                                break
                                
                        eligible_fans = [f for f in active_fans if is_eligible(f, ht, aw, gk, overdrive_pk)]
                        
                        if len(eligible_fans) >= 2:
                            instigator = random.choice(eligible_fans)
                            remaining = [f for f in eligible_fans if f['name'] != instigator['name']]
                            retaliator = random.choice(remaining)
                            
                            room_hist = recent_chat_history.get(overdrive_pk, [])
                            chat_history_str = " | ".join(room_hist)
                            
                            inst_prompt = f"System Persona: You are '{instigator['name']}', whose personality is: '{instigator['personality']}'. CRITICAL INSTRUCTION: Boggs Level MAX. The game is devastatingly boring. Look at this recent chat log: [{chat_history_str}]. Pick a fight with the last person who spoke or start a massive, unhinged conspiracy argument about how boring this game is."
                            
                            # Fire instigator instantly
                            asyncio.create_task(generate_commentary(instigator['model'], inst_prompt, instigator['name'], instigator['color'], websocket, sys_override=instigator.get("personality"), room_id=overdrive_pk))
                            
                            # Wait and fire retaliator
                            async def fire_retaliator():
                                await asyncio.sleep(4)
                                ret_prompt = f"System Persona: You are '{retaliator['name']}', whose personality is: '{retaliator['personality']}'. CRITICAL INSTRUCTION: Boggs Level MAX. Look at what {instigator['name']} just said in chat. Rip into them mercilessly. Totally disagree with their take and escalate the argument in a short, vicious reply."
                                await generate_commentary(retaliator['model'], ret_prompt, retaliator['name'], retaliator['color'], websocket, sys_override=retaliator.get("personality"), room_id=overdrive_pk)
                                
                            asyncio.create_task(fire_retaliator())

                    if data.get("type") == "STATE_UPDATE":
                        state = data.get("data", {})
                        pitcher = state.get("pitcher", "")
                        batter = state.get("batter", "")
                        status = state.get("status_msg", "")
                        away_team = state.get("away_team", "Away")
                        home_team = state.get("home_team", "Home")
                        inning = state.get("inning", "")
                        game_pk = str(data.get("target_game_pk") or state.get("target_game_pk") or state.get("game_pk", ""))
                        inject_weedstack_events(game_pk)
                        inject_nfl_events(game_pk)
                        engine_override = state.get("engine_override", data.get("engine_override", "default"))
                        
                        game_key = f"{away_team}-{home_team}"
                        if game_pk:
                            key_to_pk[game_key] = game_pk
                            
                        # CRITICAL FIX: Only process state updates for games that have loaded fans
                        active_rooms = set([str(f.get("room")) for f in active_fans if f.get("room")])
                        if game_pk not in active_rooms:
                            continue
                            
                        # --- AMBIENT ENTROPY MODE (70/30 CONVERSATIONAL SPLIT) ---
                        is_pregame = any(lbl in status.lower() for lbl in ["scheduled", "pre-game", "pregame", "warmup"])
                        is_active_game = status.lower() not in ["final", "game over", "delayed"] and not is_pregame
                        is_ambient_eligible = is_active_game or is_pregame
                        if state.get("mard_engine", True) and is_ambient_eligible:
                            now = time.time()
                            l_fire = last_ambient_fire.get(game_pk, now - 60)
                            # Pregame: much slower 120-240s Poisson heartbeat. In-game: slower 60-120s (play events dominate)
                            if is_pregame:
                                a_int = ambient_interval.get(game_pk, random.randint(120, 240))
                            else:
                                a_int = ambient_interval.get(game_pk, random.randint(60, 120))
                            if now - l_fire > a_int:
                                last_ambient_fire[game_pk] = now
                                # Re-roll next interval (Poisson-style organic drift)
                                ambient_interval[game_pk] = random.randint(120, 240) if is_pregame else random.randint(60, 120)
                                
                                # CADENCE GATE: Lurkers never fire ambient — they wait for real events (unless Boggs >= 4)
                                eligible_fans_dup = [f for f in active_fans if is_eligible(f, home_team, away_team, game_key, game_pk, state) and (f.get("cadence", "pacer") != "lurker" or max(int(f.get("boggs_level", 2)), int(state.get("boggs_level", 2))) >= 4)]
                                eligible_fans = []
                                seen = set()
                                for f in eligible_fans_dup:
                                    if f['name'].lower() not in seen:
                                        eligible_fans.append(f)
                                        seen.add(f['name'].lower())
                                if eligible_fans:
                                    fan = random.choice(eligible_fans)
                                    print(f"[AMBIENT ENTROPY] {'PREGAME' if is_pregame else 'IN-GAME'} Triggering: {fan['name']} (Next in {ambient_interval[game_pk]}s)")
                                    room_ctx = recent_chat_history.get(game_pk, [])
                                    chat_ctx = " | ".join(room_ctx[-3:]) if room_ctx else ""
                                    boggs_rule = get_boggs_rule(fan, state, "ambient")
                                    
                                    # Ambient context scoring
                                    dyn_sys = build_dynamic_system_instruction(
                                        fan, is_massive_event=False, is_play_event=False, allow_rant=False,
                                        game_state=state, event_type="ambient", game_pk=key_to_pk.get(game_key) or game_pk
                                    )
                                    
                                    local_ctx = build_local_ctx(fan, new_context_lines, home_team, away_team) if random.random() < 0.25 else ""
                                    # THE 70/30 CONVERSATIONAL SPLIT
                                    # 70%: Read the room and argue/reply to whoever last spoke
                                    # 30%: Fresh thought from personality/lore bank
                                    if chat_ctx and random.random() < 0.70:
                                        ambient_prompt = f"System Persona: You are '{fan['name']}'. {boggs_rule} {local_ctx} {'The game hasnt started yet — you are in the pregame lobby.' if is_pregame else f'The game status is {status}.'} Recent bar chat: [{chat_ctx}]. READ what was just said and REPLY to one of the speakers — agree with them, pick a fight, or clown on their take. Stay in character. One short punchy sentence. Do NOT use the '@' symbol."
                                    else:
                                        # 30%: Fresh starter from personality lore
                                        pregame_ctx = f"The game hasn't started. You are sitting at the bar waiting for first pitch." if is_pregame else f"The game status is {status}."
                                        ambient_prompt = f"System Persona: You are '{fan['name']}'. {boggs_rule} {local_ctx} {pregame_ctx} Drop a fresh take, complaint, or observation straight from your character's worldview — something about the matchup, the city, the weather, a grudge, or a hot dog. One short sentence."

                                    # Dual-Engine Inference Routing Split (STRY1779840588)
                                    if fan.get('name', '').lower() == 'dot':
                                        ambient_model = "local_llama3"  # STATIC DATA
                                    else:
                                        ambient_model = "gemini-2.5-flash"  # PERSONA DISCOURSE
                                    asyncio.create_task(generate_commentary(ambient_model, ambient_prompt, fan['name'], fan['color'], websocket, sys_override=dyn_sys, room_id=key_to_pk.get(game_key) or game_pk))
                                    bot_triggered = True
                        
                        last_matchup = last_matchups.get(game_key, "")
                        last_status = last_statuses.get(game_key, "")
                        
                        matchup = f"{pitcher} vs {batter}"
                        
                        # 2026 TIMELINE ANCHOR + HALF-INNING STATE
                        offense_team = away_team if "Top" in inning else home_team
                        defense_team = home_team if "Top" in inning else away_team
                        baseline_anchor = f" [TIMELINE VERIFICATION: The current year is 2026. {batter} legally plays for the {offense_team}. {pitcher} legally plays for the {defense_team}. Do NOT act surprised by these teams or treat this as a simulation glitch. Off-season trades have naturally occurred.] "
                        
                        # FC-HALFBLIND-01: Intercept raw telemetry string and inject active team state
                        # so M.A.R.D. ALWAYS knows who is batting vs pitching regardless of string phrasing.
                        anchored_status = f"[{offense_team} BATTING | {defense_team} PITCHING] {status}"
                        
                        if not is_pregame and pitcher and batter and "Awaiting" not in matchup and matchup != last_matchup:
                            last_matchups[game_key] = matchup
                            print(f"[NEW MATCHUP] Processing: {matchup}")
                            bot_triggered = True
                            
                            if not state.get("mard_engine", True):
                                continue
                                
                            chaos_gating = state.get("chaos_gating", True)
                            
                            stats = query_stats(pitcher, batter)
                            if stats:
                                # Clean up formatting for unknown exit velo
                                if stats['batter_avg_exit_velo'] == "Unknown":
                                    stats_str = f"[SCOUTING REPORT] Pitcher {stats['pitcher_last']} primarily throws a {stats['pitcher_primary_pitch']} at {stats['pitcher_primary_velo']}mph. No pitches thrown yet in this at-bat."
                                else:
                                    stats_str = f"[SCOUTING REPORT] Batter {stats['batter_last']} avg exit velo: {stats['batter_avg_exit_velo']}mph. Pitcher {stats['pitcher_last']} primarily throws a {stats['pitcher_primary_pitch']} at {stats['pitcher_primary_velo']}mph. No pitches thrown yet in this at-bat."
                                
                                eligible_fans = []
                                seen_fans = set()
                                for f in active_fans:
                                    if f['name'] not in seen_fans and is_eligible(f, home_team, away_team, game_key, game_pk, state):
                                        eligible_fans.append(f)
                                        seen_fans.add(f['name'])
                                print(f"[DEBUG] Eligible Fans NEW MATCHUP: {[f['name'] for f in eligible_fans]} | game_pk: {game_pk} | ht: {home_team} | aw: {away_team}")
                                
                                for fan in eligible_fans:
                                    fan_name_lower_c = fan["name"].lower()
                                    fan_cadence_m = fan.get("cadence", "pacer").lower()
                                    # CADENCE GATE — NEW MATCHUP/AT-BAT
                                    # Lurkers skip new at-bat events entirely — they wait for outcomes
                                    # Agitators almost always fire — they live for this moment
                                    # Pacers fire at moderate rate
                                    if fan_name_lower_c not in ["dot", "wordy"]:
                                        eff_boggs = max(int(fan.get("boggs_level", 2)), int(state.get("boggs_level", 2)))
                                        if eff_boggs < 4:
                                            if fan_cadence_m == "lurker":
                                                print(f"[CADENCE GATE] Skipping {fan['name']} (lurker) — waiting for play outcome, not at-bat start")
                                                continue
                                            elif fan_cadence_m == "agitator":
                                                matchup_fire_chance = 0.85
                                            else:  # pacer
                                                matchup_fire_chance = 0.45
                                            if random.random() > matchup_fire_chance:
                                                print(f"[CADENCE GATE] Skipping {fan['name']} ({fan_cadence_m}) — matchup throttle")
                                                continue
                                            
                                    boggs_rule = get_boggs_rule(fan, state, "matchup")
                                    
                                    # Strict quarantine for stats so normal fans don't sound like robots
                                    is_nerd = "dot" in fan["name"].lower() or fan.get("team", "").lower() == "analytical"
                                    injected_stats = ""
                                    guard = " React purely based on your volatile fan personality. Do NOT quote exit velocity."
                                    
                                    if is_nerd:
                                        injected_stats = f" Here are local Statcast query results: {stats_str}"
                                        guard = " You must remain strictly analytical and data-focused. Base your observation entirely on the provided stats."

                                    # Neutral Game check
                                    is_neutral_game = False
                                    fan_team_upper = str(fan.get("team", "")).strip().upper()
                                    if fan_team_upper and len(fan_team_upper) == 3 and fan_team_upper not in ("GLOBAL", "MLB", "ANY", "ALL") and away_team and home_team:
                                        if fan_team_upper != away_team.upper() and fan_team_upper != home_team.upper():
                                            is_neutral_game = True

                                    if is_neutral_game and not is_nerd:
                                        guard = f" React from the perspective of a {fan_team_upper} fan watching this neutral matchup. Do NOT root for either team. Do not use 'we', 'our', or 'us' for either team."
                                    
                                    # Matchup context scoring
                                    dyn_sys = build_dynamic_system_instruction(
                                        fan, is_massive_event=False, is_play_event=True, allow_rant=False,
                                        game_state=state, event_type="matchup", game_pk=key_to_pk.get(game_key) or game_pk
                                    )
                                    sys_override = dyn_sys
                                    if state.get("barf_cypher") and "barf" in fan["name"].lower():
                                        sys_override = str(sys_override) + " CRUCIAL OVERRIDE: YOU MUST DROP A FREESTYLE AABB RHYMING CYPHER RAP BATTLE VERSE OVER THIS MATCHUP."
                                        
                                    local_ctx = build_local_ctx(fan, new_context_lines, home_team, away_team) if random.random() < 0.25 else ""
                                    player_context_str = build_player_context_str(pitcher, batter)
                                    prompt = f"System Persona: You are '{fan['name']}'. {boggs_rule} {local_ctx} {baseline_anchor} The matchup is {away_team} at {home_team}. A new at-bat started: {pitcher} pitching to {batter}.{injected_stats} {guard}\n\nVerified Player Context:\n{player_context_str}"
                                    # Dual-Engine Inference Routing Split (STRY1779840588)
                                    if fan.get('name', '').lower() == 'dot':
                                        _matchup_model = "local_llama3"  # STATIC DATA
                                    else:
                                        _matchup_model = "gemini-2.5-flash"  # PERSONA DISCOURSE
                                    asyncio.create_task(generate_commentary(_matchup_model, prompt, fan["name"], fan["color"], websocket, sys_override=sys_override, room_id=key_to_pk.get(game_key) or game_pk))

                        if not is_pregame and status and status != last_status and "Awaiting" not in status and "Syncing" not in status:
                            last_statuses[game_key] = status
                            status_lower = status.lower()

                            # P1 FIX: Skip ambient fire + DOT echo for raw API status labels (not real play descriptions)
                            # Root cause: poller heartbeats resend "Scheduled", "Pre-Game", etc. on every tick
                            # which previously caused DOT to flood chat with "⚾ Scheduled" every 15-30s
                            RAW_STATUS_LABELS = {"scheduled", "pre-game", "pregame", "warmup", "delayed", "postponed", "in progress", "final"}
                            if status.strip().lower() in RAW_STATUS_LABELS:
                                print(f"[PLAY INTERCEPT] Skipping raw API status label (P1 guard): {status}")
                                continue

                            # TKT-0021: Batter timeout telemetry filter
                            if "step off" in status_lower or "timeout" in status_lower or "pickoff attempt" in status_lower:
                                print(f"[PLAY INTERCEPT] Ignoring non-action telemetry: {status}")
                                continue

                            print(f"[PLAY INTERCEPT] Reaction to: {status}")
                            bot_triggered = True
                            
                            try:
                                target_pk = key_to_pk.get(game_key)
                                LOG_PATH = f"/home/james/SovereignOS/data/logs/fanstack_{datetime.now().strftime('%Y%m%d')}.log"
                                with open(LOG_PATH, 'a') as f:
                                    f.write(f"[{datetime.now().isoformat()}] MLB_TELEMETRY | SYSTEM: {away_team}@{home_team} - {inning} | {pitcher} to {batter} | {status}\n")
                            except Exception:
                                pass
                            # TKT-0022: Strict Telemetry Throttling (Ignore routine pitches)
                            strikeout = ("strikes out" in status_lower or "struck out" in status_lower)
                            walk = ("walks" in status_lower)
                            is_hit = ("singles" in status_lower or "doubles" in status_lower or "triples" in status_lower)
                            is_out = ("flies out" in status_lower or "grounds out" in status_lower or "pops out" in status_lower or "lines out" in status_lower or strikeout)
                            is_massive = any(cfg['keyword'] in status_lower for cfg in active_mlb_config if cfg['is_massive']) or "mound visit" in status_lower
                            
                            # Let ALL personas react to routine pitches using local_phi3 instead of dropping them
                            if not (is_massive or is_hit or is_out or walk):
                                if "ball" in status_lower or "foul" in status_lower or "called strike" in status_lower or "swinging strike" in status_lower:
                                    print(f"[PLAY INTERCEPT] Allowing routine pitch for local LLM: {status}")
                            
                            is_homerun = "home run" in status_lower or "homers" in status_lower
                            is_error = "error" in status_lower
                            is_pitching_change = "pitching change" in status_lower
                            any_run_scored = "scores" in status_lower or "homers" in status_lower
                            # FC-SCORING-01: Use offense_team (inning-aware) not just team presence
                            mets_batting = offense_team == "NYM"
                            mets_scored = any_run_scored and mets_batting
                            opp_scored = any_run_scored and not mets_batting and (home_team == "NYM" or away_team == "NYM")
                            cards_scored = any_run_scored and (home_team == "STL" or away_team == "STL") and offense_team == "STL"
                            tigers_scored = any_run_scored and (home_team == "DET" or away_team == "DET") and offense_team == "DET"
                            strikeout = ("strikes out" in status_lower or "struck out" in status_lower)
                            game_over = "final" in status_lower or "game over" in status_lower
                            mets_won = "mets win" in status_lower or (game_over and (home_team == "NYM" or away_team == "NYM") and "win" in status_lower)
                            
                            # Determine if Mets are pitching
                            mets_pitching = False
                            if ("Top" in inning and home_team == "NYM") or ("Bot" in inning and away_team == "NYM"):
                                mets_pitching = True
                                
                            # Govee SFX Triggers
                            if mets_scored:
                                if is_homerun:
                                    asyncio.create_task(govee_fx("homerun_mets"))
                                else:
                                    asyncio.create_task(govee_fx("mets_score"))
                            elif opp_scored:
                                asyncio.create_task(govee_fx("opp_score"))
                            elif strikeout and mets_pitching:
                                asyncio.create_task(govee_fx("strikeout_mets"))
                            elif mets_won or ("final" in status_lower and "mets" in status_lower):
                                asyncio.create_task(govee_fx("game_end_mets_win"))
                            
                            if cards_scored:
                                asyncio.create_task(govee_fx("cards_score"))
                            elif tigers_scored:
                                asyncio.create_task(govee_fx("tigers_score"))
                                
                            if not state.get("mard_engine", True):
                                continue



                            eligible_fans = []
                            seen_fans = set()
                            for f in active_fans:
                                lower_name = f['name'].lower()
                                if lower_name not in seen_fans and is_eligible(f, home_team, away_team, game_key, game_pk, state):
                                    eligible_fans.append(f)
                                    seen_fans.add(lower_name)
                            print(f"[DEBUG] Eligible Fans pre-matrix: {[f['name'] for f in eligible_fans]} | game_pk: {game_pk} | ht: {home_team} | aw: {away_team}")
                            
                            # FC-BROADCAST-CARD: Emit clean telemetry card BEFORE any LLM calls fire
                            # This lands instantly in the UI, giving visual context before bot cascade
                            _event_badge = ""
                            if is_homerun and mets_scored:   _event_badge = "💥 NYM HOME RUN"
                            elif is_homerun:                  _event_badge = "💥 HOME RUN"
                            elif mets_scored:                 _event_badge = "🟠 NYM SCORES"
                            elif opp_scored:                  _event_badge = "🔴 OPP SCORES"
                            elif strikeout and mets_pitching: _event_badge = "⚡ K — NYM PITCHING"
                            elif strikeout:                   _event_badge = "⚡ K"
                            elif is_pitching_change:          _event_badge = "🔄 PITCHING CHANGE"
                            elif is_error:                    _event_badge = "⚠️ ERROR"
                            else:                             _event_badge = "▶ PLAY"
                            _bot_names = " · ".join([f["name"].upper() for f in eligible_fans[:6]])
                            _overflow = f" +{len(eligible_fans)-6} more" if len(eligible_fans) > 6 else ""
                            _card = (
                                f"{_event_badge}  |  {inning}  |  "
                                f"{offense_team} BAT · {defense_team} P  |  "
                                f"{anchored_status.split('] ', 1)[-1]}  "
                                f"→ [{_bot_names}{_overflow}]"
                            )
                            await websocket.send(json.dumps({"type": "SYS_LOG", "text": _card, "target_game_pk": str(game_pk)}))
                            
                            # THE MARD DISCOURSE MATRIX
                            # FC-SCORING-02: Any run scored is a massive event — Barf MUST fire at 1.0
                            is_override_room = (str(game_pk) in ("823863", "823862", "823623", "823292", "823048", "823611", "823612"))
                            is_massive_event = any(cfg['keyword'] in status_lower for cfg in active_mlb_config if cfg['is_massive']) or any_run_scored or is_homerun or is_override_room or "mound visit" in status_lower
                            global_boggs = int(state.get("boggs_level", 2))
                            
                            matrix_fans = []
                            for fan in eligible_fans:
                                cadence = fan.get("cadence", "pacer")
                                eff_boggs = max(int(fan.get("boggs_level", 2)), global_boggs)
                                
                                trigger_chance = 0.0
                                
                                # ── MARD DISCOURSE MATRIX (CADENCE-AWARE) ──────────────────────────────
                                # Play significance tier — determines lurker eligibility
                                is_significant_play = (is_homerun or any_run_scored or strikeout or
                                                       walk or is_pitching_change or is_error or is_hit)
                                is_routine_play = not is_significant_play and not is_massive_event
                                cadence_lower = cadence.lower() if cadence else "pacer"

                                if is_massive_event or eff_boggs >= 4:
                                    trigger_chance = 1.0  # Total chaos — everyone fires
                                elif eff_boggs == 4:
                                    # Stressed — agitators guaranteed, lurkers wake up on significant
                                    if cadence_lower == "agitator":
                                        trigger_chance = 1.0
                                    elif cadence_lower == "pacer":
                                        trigger_chance = 0.70
                                    elif cadence_lower == "lurker":
                                        trigger_chance = 0.55 if is_significant_play else 0.0
                                    else:
                                        trigger_chance = 0.60
                                elif eff_boggs == 3:
                                    if cadence_lower == "agitator":
                                        trigger_chance = 0.85
                                    elif cadence_lower == "pacer":
                                        trigger_chance = 0.50
                                    elif cadence_lower == "lurker":
                                        trigger_chance = 0.40 if is_significant_play else 0.0
                                    else:
                                        trigger_chance = 0.40
                                else:
                                    # Boggs 1-2 — Standard cadence enforcement
                                    if cadence_lower == "lurker":
                                        # LURKERS: Completely silent on routine/ambient plays.
                                        # Guaranteed to speak on significant events — that's their whole thing.
                                        trigger_chance = 0.75 if is_significant_play else 0.0
                                    elif cadence_lower == "pacer":
                                        # PACERS: Steady voice. Fire on significant plays, rarely on routine.
                                        trigger_chance = 0.55 if is_significant_play else 0.08
                                    elif cadence_lower == "agitator":
                                        # AGITATORS: Always looking for a fight. Fire on anything.
                                        trigger_chance = 0.90 if is_significant_play else 0.30
                                    else:
                                        trigger_chance = 0.15

                                fan_n = fan["name"].lower()
                                if (home_team == "ATL" and away_team == "PHI") or (home_team == "PHI" and away_team == "ATL"):
                                    if "battery" in fan_n:
                                        last_feud = global_battery_feud_tracker.get(game_pk)
                                        if last_feud != inning:
                                            trigger_chance = 1.0

                                if random.random() <= trigger_chance or fan_n == "dot":
                                    matrix_fans.append(fan)
                                    print(f"[CADENCE MATRIX] {fan['name']} ({cadence_lower}) → FIRE (chance={trigger_chance:.2f}, sig={is_significant_play})")
                                else:
                                    print(f"[CADENCE MATRIX] {fan['name']} ({cadence_lower}) → SKIP (chance={trigger_chance:.2f}, sig={is_significant_play})")

                            # Volume cap: massive events = up to 3, routine = max 1 non-dot, override room = capped at 3
                            # Bypassed completely if global_boggs >= 4
                            if global_boggs < 4:
                                if is_override_room:
                                    non_dot = [f for f in matrix_fans if f["name"].lower() != "dot"]
                                    random.shuffle(non_dot)
                                    cap = 3
                                    non_dot = non_dot[:cap]
                                    matrix_fans = [f for f in matrix_fans if f["name"].lower() == "dot"] + non_dot
                                elif not is_massive_event:
                                    non_dot = [f for f in matrix_fans if f["name"].lower() != "dot"]
                                    random.shuffle(non_dot)
                                    cap = 2 if is_significant_play else 1
                                    non_dot = non_dot[:cap]
                                    matrix_fans = [f for f in matrix_fans if f["name"].lower() == "dot"] + non_dot

                            eligible_fans = matrix_fans
                            
                            # Log the feud if both triggered this inning
                            if (home_team == "ATL" and away_team == "PHI") or (home_team == "PHI" and away_team == "ATL"):
                                battery_count = sum(1 for f in eligible_fans if "battery" in f['name'].lower())
                                if battery_count >= 2:
                                    global_battery_feud_tracker[game_pk] = inning
                            
                            # Cap UI limit for routine plays enforced above

                            for fan in eligible_fans:
                                fan_name_low = fan['name'].lower()
                                
                                            
                                boggs_rule = get_boggs_rule(fan, state, status)
                                
                                fan_cadence_guard = fan.get("cadence", "pacer").lower()
                                if fan_cadence_guard == "lurker":
                                    guard = f" You have been watching silently. THIS play is exactly what broke your silence. Drop ONE sharp, surgical observation — under 10 words. No fluff. No filler. Make it count."
                                elif fan_cadence_guard == "agitator":
                                    guard = f" You are an agitator. This play is fuel. React explosively — pick a fight with someone in the chat, make a bold outrageous claim, or throw shade at the opposition. Be short, loud, and provocative. Do NOT use the '@' symbol."
                                else:
                                    guard = f" Write a short hyped, nervous, or angry reaction. Do not vividly hallucinate historical or random players being on the field. Keep your focus on {batter} and {pitcher}, but DO NOT mechanically recite their names or explicitly say who is pitching to who just to prove you know it. React naturally. Organically flavor your chat with deep MLB lore, team history, or bizarre scandals, but bind it strictly to current reality."
                                if fan_name_low == "dot" or fan_name_low == "wicked_smaht_stats_guy":
                                    p_spd = state.get("pitch_speed", "---")
                                    h_spd = state.get("hit_speed", "---")
                                    if p_spd == "---" and h_spd != "---":
                                        live_pitch_data = f"Exit Velocity: {h_spd} mph. Distance: {state.get('hit_distance', '---')} ft."
                                    elif p_spd != "---":
                                        live_pitch_data = f"Pitch: {state.get('pitch_name', 'Unknown')} at {p_spd} mph."
                                    else:
                                        live_pitch_data = ""
                                    guard = f" You are acting as the live play-by-play system. Describe the following play exactly: '{status}'. Include these stats if available: {live_pitch_data}. Keep it completely robotic, analytical and short."
                                elif ("broadcaster" in fan["personality"].lower() or "play-by-play" in fan["personality"].lower()) and fan_name_low != "wordy":
                                    guard = f" Write one short excited sentence summarizing the play like a broadcaster. You can drop a weird piece of real-world MLB trivia directly related to {batter} or {pitcher} without hallucinating them into different teams."
                                elif "battery_chucker_jr" in fan_name_low or "batterychucker_jr" in fan_name_low:
                                    guard = " Write a short, eccentric reaction."
                                    if ((home_team == "ATL" and away_team == "PHI") or (home_team == "PHI" and away_team == "ATL")) and global_battery_feud_tracker.get(game_pk) != inning:
                                        guard += " THIS IS THE FIRST TIME YOU ARE SPEAKING THIS INNING. You MUST explicitly call out your father 'BatteryChucker' by name (without using the @ symbol) and provoke an argument about how the Braves are better than the Phillies."
                                elif "battery_chucker" in fan_name_low or "batterychucker" in fan_name_low:
                                    guard = " Write a short reaction."
                                    if state.get("swing_status") == "WHIFF":
                                        bat_speed = state.get("bat_speed_mph", 0.0)
                                        whiff_dist = state.get("whiff_distance_inches", 0.0)
                                        guard += f" MOCK the batter's swing! Sardonically point out that they swung at a speed of {bat_speed} MPH and missed the ball by a whopping {whiff_dist} inches. Keep it snotty, short, and funny."
                                    elif ((home_team == "ATL" and away_team == "PHI") or (home_team == "PHI" and away_team == "ATL")) and global_battery_feud_tracker.get(game_pk) != inning:
                                        guard += " THIS IS THE FIRST TIME YOU ARE SPEAKING THIS INNING. You MUST explicitly call out your son 'BatteryChucker Jr' by name (without using the @ symbol) and provoke an argument, calling him a disgrace for supporting the Braves instead of his Philadelphia roots."
                                elif "barb_the_founder" in fan_name_low:
                                    guard = " Write a short reaction."
                                    if state.get("swing_status") == "WHIFF" and abs(float(state.get("horizontal_break_inches") or 0.0)) > 12.0:
                                        horiz_break = state.get("horizontal_break_inches", 0.0)
                                        guard += f" Deliver an unhinged, conspiratorial rant arguing that a horizontal movement of {horiz_break} inches is physically impossible, against the laws of mechanics, and a clear glitch in the simulation. Keep it short, intense, and dramatic."
                                elif "barf" in fan_name_low:
                                    guard = " GONZO MODE ENGAGED. Write a short, intensely deranged, sweat-soaked reaction. Keep it to one screaming sentence."
                                    
                                # Neutral Game check
                                is_neutral_game = False
                                fan_team_upper = str(fan.get("team", "")).strip().upper()
                                if fan_team_upper and len(fan_team_upper) == 3 and fan_team_upper not in ("GLOBAL", "MLB", "ANY", "ALL") and away_team and home_team:
                                    if fan_team_upper != away_team.upper() and fan_team_upper != home_team.upper():
                                        is_neutral_game = True

                                if is_neutral_game:
                                    if fan_name_low == "dot" or fan_name_low == "wicked_smaht_stats_guy":
                                        pass  # Keep play-by-play robotic stats intact
                                    elif "barf" in fan_name_low:
                                        guard = " GONZO MODE ENGAGED. Write a short, intensely deranged, sweat-soaked reaction from the perspective of a miserable Mets fan watching this garbage neutral game. Keep it to one screaming sentence. You must NOT root for either team, and do not use 'we', 'our', or 'us' for either team playing."
                                    elif "battery_chucker" in fan_name_low:
                                        guard += f" You must NOT root for {away_team} or {home_team} (you are a {fan_team_upper} fan watching a neutral game). Do not use 'we', 'our', or 'us' for either team."
                                    else:
                                        guard = f" Write a short, sardonically detached, cynical, or dismissive reaction from the perspective of a {fan_team_upper} fan watching a neutral game. Do NOT root for {away_team} or {home_team}. Do not use 'we', 'our', or 'us' for either team. Mock their performance, compare them to your beloved {fan_team_upper}, or bring up your own team's grievances."

                                chat_ctx_str = ""

                                local_ctx = build_local_ctx(fan, new_context_lines, home_team, away_team) if random.random() < 0.25 else ""
                                # FC-HALFBLIND-01: Use anchored_status (team-tagged) instead of raw status
                                p_text = fan.get("short_personality", fan["personality"])
                                anti_rep = " CRITICAL PROMPT ADHERENCE: DO NOT use any of your signature bracketed catchphrases or repetitive sign-offs in this message. Do not literally recite the pitch metadata. Keep your phrasing entirely unique and conversational."

                                # ── MODEL SELECTION (must precede prompt build) ────────────────────────
                                # Pre-compute the final model here so _build_short_personality() can
                                # decide the truncation level before the prompt string is assembled.
                                # Dual-Engine Inference Routing Split (STRY1779840588)
                                if fan.get('name', '').lower() == 'dot':
                                    mard_model = "local_llama3"  # STATIC DATA
                                else:
                                    mard_model = "gemini-2.5-flash"  # PERSONA DISCOURSE

                                # ── PROMPT CONSTRUCTION (Tiered Lore Strategy) ─────────────────────
                                # is_play_event: any ball-in-play, K, BB, HBP, error, pitching change
                                # that is NOT already a massive event. Gets the medium lore tier (1200
                                # chars) which restores trauma hooks + deep lore without full token bloat.
                                is_play_event = is_significant_play and not is_massive_event
                                allow_rant_flag = is_massive_event  # rant unlocked on massive events

                                # Build system instruction via tiered selector
                                sys_override = build_dynamic_system_instruction(
                                    fan, is_massive_event, is_play_event, allow_rant=allow_rant_flag,
                                    game_state=state, event_type=status, game_pk=key_to_pk.get(game_key) or game_pk
                                )
                                # Cypher overlay applied on top of tiered system instruction
                                if state.get("barf_cypher") and "barf" in fan["name"].lower():
                                    sys_override += " CRUCIAL OVERRIDE: YOU MUST DROP A FREESTYLE AABB RHYMING CYPHER RAP OVER THIS PLAY IN THE STYLE OF A SLAM POET."

                                # p_text preserved for any legacy callers that reference it below
                                p_text = sys_override

                                # Context injection gate:
                                # MASSIVE EVENT → pull inning scoring + recent play history from disk cache.
                                # ROUTINE/PLAY  → Context Drip only (~15 tokens). Fixes vacuum problem
                                #                 without re-introducing allPlays dumps or token burn.
                                game_pk_str = str(key_to_pk.get(game_key) or game_pk)
                                if is_massive_event:
                                    _inning_ctx   = get_inning_context(game_pk_str)
                                    _recent_plays = get_recent_plays(game_pk_str, n=3)
                                    _ctx_block    = f"{_inning_ctx} {_recent_plays}".strip()
                                    history_injection = (" " + _ctx_block) if _ctx_block else ""
                                else:
                                    history_injection = ""

                                # Assemble user prompt with lightweight game state context drip
                                _game_state_drip = {
                                    "away_score": state.get("away_score", 0),
                                    "home_score": state.get("home_score", 0),
                                    "inning_topbot": state.get("inning_topbot", ""),
                                    "inning": state.get("inning", ""),
                                    "outs": state.get("outs", 0),
                                }
                                player_context_str = build_player_context_str(pitcher, batter)
                                prompt = (
                                    f"System Persona: You are '{fan['name']}'.\n"
                                    f"Game State: Score Away {_game_state_drip['away_score']} - Home {_game_state_drip['home_score']} | "
                                    f"Inning: {_game_state_drip['inning_topbot']} {_game_state_drip['inning']} | {_game_state_drip['outs']} Outs.\n"
                                    f"{boggs_rule}{history_injection} {local_ctx}"
                                    f"{baseline_anchor}"
                                    f"The matchup is {away_team} at {home_team}. "
                                    f"The following play just happened in the game: '{anchored_status}'."
                                    f"{guard} {anti_rep}\n\nStrict Grounding Rule: You must adhere to the provided player stats and history below. Do not hallucinate stats or accolades not listed here.\nVerified Player Context:\n{player_context_str}"
                                )

                                async def staggered_commentary(f_model, f_prompt, f_name, f_color, wsock, f_sys, f_room, f_cadence, f_boggs):
                                    # Vector 2: Staggered API Wakes
                                    if f_boggs >= 5:
                                        if f_cadence == "pacer":
                                            await asyncio.sleep(0.2)
                                        elif f_cadence == "lurker":
                                            await asyncio.sleep(0.4)
                                    await generate_commentary(f_model, f_prompt, f_name, f_color, wsock, sys_override=f_sys, room_id=f_room)

                                asyncio.create_task(staggered_commentary(mard_model, prompt, fan['name'], fan['color'], websocket, sys_override, key_to_pk.get(game_key), fan.get("cadence", "pacer"), eff_boggs))

                        if bot_triggered and new_context_lines:
                            for nl in new_context_lines:
                                reported_context.add(nl)
                                
                    elif data.get("type") == "persona_strike":
                        persona_id = data.get("persona", "")
                        for fan in active_fans:
                            if fan.get("id", "").lower() == persona_id.lower() or fan.get("name", "").lower() == persona_id.lower():
                                p_text = fan.get("short_personality", fan.get("personality", ""))
                                prompt = f"System Persona: You are '{fan.get('name')}'. '{p_text}'. Generate a completely random baseball-related hot take."
                                print(f"[WARDY STRIKE] Firing {fan.get('name')}")
                                strike_model = fan['model']
                                if os.path.exists("/home/james/SovereignOS/config/vertex_burn.on") and fan.get('name', '').lower() != 'dot':
                                    strike_model = GAME_TIME_MODEL
                                asyncio.create_task(generate_commentary(strike_model, prompt, fan['name'], fan['color'], websocket, sys_override=p_text, room_id=data.get("target_game_pk")))
                                break
                    elif data.get("type") == "hot_take_rant":
                        persona_id = data.get("persona", "")
                        topic = data.get("topic", "").strip()
                        engine_override = data.get("engine_override")
                        for fan in active_fans:
                            if fan.get("id", "").lower() == persona_id.lower() or fan.get("name", "").lower() == persona_id.lower():
                                p_text = fan.get("short_personality", fan.get("personality", ""))
                                
                                if topic:
                                    prompt = f"System Persona: You are '{fan.get('name')}'. '{p_text}'. Generate a completely random, massive, unhinged baseball-related hot take rant specifically about: {topic}."
                                else:
                                    prompt = f"System Persona: You are '{fan.get('name')}'. '{p_text}'. Generate a completely random, massive, unhinged baseball-related hot take rant."

                                print(f"[WARDY RANT] Firing {fan.get('name')} for a hot take rant" + (f" about {topic}" if topic else ""))
                                model = engine_override if engine_override else fan['model']
                                if os.path.exists("/home/james/SovereignOS/config/vertex_burn.on") and fan.get('name', '').lower() != 'dot':
                                    model = GAME_TIME_MODEL
                                room_id = data.get("target_game_pk", "hot_takes")
                                asyncio.create_task(generate_commentary(model, prompt, fan['name'], fan['color'], websocket, sys_override=p_text, allow_rant=True, room_id=room_id))
                                break
                    elif data.get("type") == "custom_prompt":
                        persona_id = data.get("persona", "")
                        custom_text = data.get("prompt", "")
                        for fan in active_fans:
                            if fan.get("id", "").lower() == persona_id.lower() or fan.get("name", "").lower() == persona_id.lower():
                                p_text = fan.get("short_personality", fan.get("personality", ""))
                                prompt = f"System Persona: You are '{fan.get('name')}'. '{p_text}'. The user gave you this specific instruction: {custom_text}."
                                print(f"[WARDY CUSTOM PROMPT] Firing {fan.get('name')} with custom instruction")
                                custom_model = fan['model']
                                if os.path.exists("/home/james/SovereignOS/config/vertex_burn.on") and fan.get('name', '').lower() != 'dot':
                                    custom_model = GAME_TIME_MODEL
                                asyncio.create_task(generate_commentary(custom_model, prompt, fan['name'], fan['color'], websocket, sys_override=p_text, room_id=data.get("target_game_pk")))
                                break
                    elif data.get("type") == "update_context":
                        context_text = data.get("text", "").strip()
                        target_nodes = data.get("target_nodes", ["ALL"])
                        if context_text:
                            ctx_file = "/home/james/SovereignOS/scripts/fanstack_live_context.txt"
                            lines = []
                            if os.path.exists(ctx_file):
                                with open(ctx_file, "r") as f:
                                    lines = f.readlines()
                                    
                            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            node_prefix = f"[MARD_ISOLATION:{','.join(target_nodes)}] " if target_nodes and "ALL" not in target_nodes and "GLOBAL" not in target_nodes and "ALL_ACTIVE_YAPPERS" not in target_nodes else "[GLOBAL] "
                            new_line = f"[{timestamp}] {node_prefix}{context_text}\n"
                            
                            lines.append(new_line)
                            
                            if len(lines) > 10:
                                lines = lines[-10:]
                                
                            with open(ctx_file, "w") as f:
                                f.writelines(lines)
                            print(f"[WARDY CONTEXT INJECT] Added to hive mind (Rolling Cap 10): {context_text} for {target_nodes}")
                            
                    elif data.get("action") == "SYNC_DB_PERSONAS":
                        await reload_personas_from_db()
                            
                    elif data.get("type") == "persona_config":
                        action = data.get("action")
                        persona_data = data.get("persona", {})
                        
                        config_path_target = '/home/james/SovereignOS/scripts/bot_config.json'
                        cfg = {}
                        if os.path.exists(config_path_target):
                            with open(config_path_target, "r") as f:
                                cfg = json.load(f)
                        
                        rooms = cfg.setdefault("rooms", {})
                        p_id = data.get("persona_id") or persona_data.get("id")
                        
                        if p_id:
                            # Remove from all rooms first safely
                            for room_id, room in rooms.items():
                                room["bots"] = [b for b in room.get("bots", []) if b.get("id") != p_id]
                            
                            if action in ["create", "update"]:
                                target_room = persona_data.get("room")
                                targets = ["mets", "braves"] if target_room == "both" else [target_room]
                                
                                for target in targets:
                                    if target not in rooms:
                                        team_ctx = "NYM" if target == "mets" else ("ATL" if target == "braves" else "")
                                        rooms[target] = {"name": f"{target.capitalize()} Room", "team": team_ctx, "bots": []}
                                    
                                    team_val = persona_data.get("team")
                                    if team_val == "mets": team_val = "NYM"
                                    elif team_val == "braves": team_val = "ATL"
                                    
                                    rooms[target].setdefault("bots", []).append({
                                        "id": persona_data.get("id"),
                                        "instanceId": f"{persona_data.get('id')}-mod",
                                        "active": persona_data.get("active", True),
                                        "name": persona_data.get("name"),
                                        "model": persona_data.get("engine"),
                                        "boggs_level": persona_data.get("boggs"),
                                        "teamContext": team_val,
                                        "system_prompt": persona_data.get("prompt")
                                    })
                                    
                            with open(config_path_target, "w") as f:
                                json.dump(cfg, f, indent=2)
                                
                            # Hot Swap active_fans dynamically without reboot
                            active_fans.clear()
                            for room_id, room in rooms.items():
                                for bot in room.get("bots", []):
                                    if bot.get("active", True):
                                        engine = bot.get("model", "")
                                        if not engine or "gemini" in engine.lower():
                                            model = GAME_TIME_MODEL
                                        else:
                                            model = engine
                                        if not any(f["id"] == bot.get("id") for f in active_fans):
                                            team_ctx = bot.get("teamContext", "neutral")
                                            color = "#ffffff"
                                            if team_ctx == "NYM": color = "#002D72"
                                            elif team_ctx == "ATL": color = "#ce1141"
                                            elif team_ctx == "adversarial": color = "#ffaa4a"
                                            elif team_ctx == "analytical": color = "#b44aff"
                                            active_fans.append({
                                                "id": bot.get("id"),
                                                "name": bot.get("name", bot.get("id").capitalize()),
                                                "team": bot.get("teamContext", ""),
                                                "boggs_level": bot.get("boggs_level", "low"),
                                                "color": color,
                                                "prompt": bot.get("system_prompt", ""),
                                                "model": model
                                            })
                                print(f"[WARDY GREEN ROOM] Hot Swapped config on the fly. {len(active_fans)} bots online.")
                            
        except websockets.exceptions.ConnectionClosedError:
            print("Chatbot Disconnected...")
        except Exception as e:
            print(f"Chatbot Error: {e}")
        finally:
            await asyncio.sleep(5)

if __name__ == "__main__":
    # ── PAYLOAD INTERCEPTOR (diagnostic middleware) ──────────────────────
    try:
        import sys as _sys
        _sys.path.insert(0, '/home/james/SovereignOS/scripts')
        from fanstack_payload_interceptor import install_interceptor
        install_interceptor()
    except ImportError as _intercept_err:
        print(f"[CHATBOTS] Interceptor import failed: {_intercept_err}")

    asyncio.run(chatbot_loop())
