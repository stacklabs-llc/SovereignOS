import sqlite3
import requests
import re
import uuid
import os
import json
import google.genai as genai
from dotenv import load_dotenv
import sys
import asyncio

# Enforce strict sequential execution to eliminate write deadlocks on sovereign_now.db
sem = asyncio.Semaphore(1)

async def setup_game_room(game, data, candidates, dot, wordy):
    async with sem:
        game_pk = str(game['gamePk'])
        home_team = game['teams']['home']['team']['name'].lower()
        away_team = game['teams']['away']['team']['name'].lower()
        
        room_name = f"Game {game_pk} ({away_team.title()}@{home_team.title()})"
        print(f"📡 SECURING TRANSACTION SEMAPHORE: Initializing {room_name}...")
        
        # Map to MLB standard abbreviations
        mlb_teams = {
            'arizona diamondbacks': 'AZ',
            'atlanta braves': 'ATL',
            'baltimore orioles': 'BAL',
            'boston red sox': 'BOS',
            'chicago cubs': 'CHC',
            'chicago white sox': 'CWS',
            'cincinnati reds': 'CIN',
            'cleveland guardians': 'CLE',
            'colorado rockies': 'COL',
            'detroit tigers': 'DET',
            'houston astros': 'HOU',
            'kansas city royals': 'KC',
            'los angeles angels': 'LAA',
            'los angeles dodgers': 'LAD',
            'miami marlins': 'MIA',
            'milwaukee brewers': 'MIL',
            'minnesota twins': 'MIN',
            'new york mets': 'NYM',
            'new york yankees': 'NYY',
            'oakland athletics': 'ATH',
            'athletics': 'ATH',
            'philadelphia phillies': 'PHI',
            'pittsburgh pirates': 'PIT',
            'san diego padres': 'SD',
            'san francisco giants': 'SF',
            'seattle mariners': 'SEA',
            'st. louis cardinals': 'STL',
            'tampa bay rays': 'TB',
            'texas rangers': 'TEX',
            'toronto blue jays': 'TOR',
            'washington nationals': 'WSH'
        }
        home_abbr = mlb_teams.get(home_team, 'UNK')
        away_abbr = mlb_teams.get(away_team, 'UNK')

        # Select exactly 3 personas whose assigned_to matches the team abbreviation
        import random
        def get_team_personas(team_abbr, candidate_pool):
            matching = []
            for p in candidate_pool:
                assigned = str(p.get('team') or '').strip().lower()
                if assigned in [k.lower() for k in mlb_teams.keys()]:
                    assigned = mlb_teams[assigned].lower()
                if team_abbr.lower() in assigned.split('-'):
                    matching.append(p)
            
            if team_abbr.upper() == 'NYM':
                metsfan = next((p for p in matching if p['user_name'] == 'metsfan_86'), None)
                if metsfan:
                    matching.remove(metsfan)
                    random.shuffle(matching)
                    return [metsfan] + matching[:2]

            random.shuffle(matching)
            return matching[:3]

        home_selected = get_team_personas(home_abbr, candidates)
        temp_candidates = [c for c in candidates if c not in home_selected]
        away_selected = get_team_personas(away_abbr, temp_candidates)

        room_key = f"room_{game_pk}"
        boggs_level = 2 # default mid
        
        db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
        conn = sqlite3.connect(db_path, timeout=60.0)
        conn.execute("PRAGMA busy_timeout = 30000;")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check room
        cursor.execute("SELECT sys_id FROM cmdb_ci_fanstack_room WHERE game_pk = ?", (game_pk,))
        room = cursor.fetchone()
        if not room:
            room_sys_id = str(uuid.uuid4()).replace('-', '')
            cursor.execute("""
                INSERT INTO cmdb_ci_fanstack_room (sys_id, name, room_key, game_pk, is_simulated, sim_speed, u_cadence, boggs_level, room_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (room_sys_id, room_name, room_key, game_pk, 1, 1.0, 'pacer', boggs_level, 'staged'))
        else:
            room_sys_id = room['sys_id']

        # Align room_state
        cursor.execute("UPDATE mlb_schedule SET room_state = COALESCE(room_state, 'staged') WHERE game_pk = ?", (game_pk,))
        cursor.execute("UPDATE cmdb_ci_fanstack_room SET room_state = COALESCE(room_state, 'staged') WHERE game_pk = ?", (game_pk,))

        # Assign personas
        cursor.execute("DELETE FROM game_persona WHERE game_pk = ?", (game_pk,))
        members = home_selected + away_selected
        if dot: members.append(dot)
        if wordy: members.append(wordy)

        for p in members:
            gp_id = str(uuid.uuid4()).replace('-', '')
            cursor.execute("INSERT INTO game_persona (id, game_pk, persona_id, seat_state) VALUES (?, ?, ?, ?)",
                           (gp_id, game_pk, p['id'], 'active'))
            
        print(f"Room {room_name} configured with {len(members)} personas in game_persona.")
        conn.commit()
        conn.close()

        # TMI Scenario Generation Phase (blocking API calls, run via asyncio.to_thread)
        load_dotenv('/home/james/SovereignOS/.env')
        api_key = os.environ.get("VITE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
        
        try:
            with open('/home/james/SovereignOS/scripts/fanstack_live_context.txt', 'r') as f:
                news = f.read()
        except Exception:
            news = "No ambient news available."
            
        prompt = f"""You are Madam Moments, the cheerfully bureaucratic, highly sassy, and slightly terrifying Southern receptionist for the Timeline Moderation Initiative (TMI). You speak with an exaggerated, syrupy Southern accent (using terms like 'honey', sugar, bless his heart, y'all, etc) but your job is orchestrating chaotic timeline branches. A baseball game between {away_team} and {home_team} is experiencing a random on-field delay. 
        Use recent MLB news if relevant: '{news}'. Generate exactly 3 highly specific, chaotic scenarios detailing what caused the delay.
        Output as a JSON array of 3 objects with keys: 'name' (short title), 'description', 'payload' (the narrative text to inject into the live broadcast chat, written completely in your sassy Southern voice), and 'icon' (a single emoji)."""

        scenarios_text = None
        
        def run_api_call():
            text = None
            if api_key:
                try:
                    client = genai.Client(api_key=api_key)
                    res = client.models.generate_content(
                        model='gemini-flash-latest',
                        contents=prompt,
                        config={"response_mime_type": "application/json"}
                    )
                    text = res.text
                except Exception as e:
                    print(f"Primary google.genai TMI generation failed: {e}. Falling back to Enterprise Vertex AI...")
            if not text:
                try:
                    import vertexai
                    from vertexai.generative_models import GenerativeModel
                    CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
                    PROJECT_ID = "gen-lang-client-0840454416"
                    LOCATION = "us-central1"
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
                    vertexai.init(project=PROJECT_ID, location=LOCATION)
                    model = GenerativeModel("gemini-flash-latest")
                    res = model.generate_content(prompt)
                    text = res.text
                except Exception as e:
                    print(f"Vertex AI TMI fallback failed: {e}")
            return text

        scenarios_text = await asyncio.to_thread(run_api_call)

        if scenarios_text:
            try:
                clean_text = scenarios_text.strip()
                if clean_text.startswith("```"):
                    match = re.search(r"```(?:json)?\s*(.*?)\s*```", clean_text, re.DOTALL)
                    if match:
                        clean_text = match.group(1).strip()
                
                import ast
                try:
                    scenarios = json.loads(clean_text)
                except:
                    scenarios = ast.literal_eval(clean_text)
                
                conn = sqlite3.connect(db_path, timeout=60.0)
                conn.execute("PRAGMA busy_timeout = 30000;")
                cursor = conn.cursor()
                for s in scenarios[:3]:
                    s_id = str(uuid.uuid4()).replace('-', '')
                    cursor.execute("INSERT INTO cmdb_ci_tmi_scenario (sys_id, name, description, payload, icon, game_pk) VALUES (?, ?, ?, ?, ?, ?)", 
                                   (s_id, s.get('name',''), s.get('description',''), s.get('payload',''), s.get('icon','🚨'), game_pk))
                conn.commit()
                conn.close()
                print(f"Generated 3 distinct TMI Timeline Branches for Game {game_pk}")
            except Exception as e:
                print(f"Failed to parse or save TMI scenarios: {e}. Response was: {scenarios_text}")

async def main_async(games, data, candidates, dot, wordy):
    tasks = [setup_game_room(g, data, candidates, dot, wordy) for g in games]
    await asyncio.gather(*tasks)

def main():
    db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
    conn = sqlite3.connect(db_path, timeout=60.0)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Load personas directly from the canonical persona table
    cursor.execute("""
        SELECT id, user_name, team
        FROM persona
    """)
    data = [dict(row) for row in cursor.fetchall()]
    
    # Ensure no None types for text processing and filter out cloned game_pk and _ci personas
    valid_data = []
    for p in data:
        if not p.get('user_name'):
            continue
        is_clone = bool(re.search(r'_\d{6}$', p['user_name']) or p['user_name'].endswith('_ci'))
        if p['user_name'] == 'metsfan_86':
            is_clone = False
        if not is_clone:
            valid_data.append(p)
    data = valid_data

    # Parse arguments for date or game PKs
    target_date = None
    target_games = []
    for arg in sys.argv[1:]:
        if re.match(r'^\d{4}-\d{2}-\d{2}$', arg):
            target_date = arg
        else:
            target_games.append(arg)

    # Determine date using Eastern Time to align with fanstack_relay.py
    if not target_date:
        try:
            from zoneinfo import ZoneInfo
        except ImportError:
            from backports.zoneinfo import ZoneInfo
        from datetime import datetime, timedelta
        now_et = datetime.now(ZoneInfo('America/New_York'))
        if now_et.hour < 10:
            target_date = (now_et - timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            target_date = now_et.strftime('%Y-%m-%d')

    print(f"Aligning daily room setup with game slate date: {target_date}")

    # Deactivate past rooms to prevent stale entries from polluting the switcher dropdown
    try:
        cleanup_conn = sqlite3.connect(db_path, timeout=60.0)
        cleanup_conn.execute("PRAGMA busy_timeout = 30000;")
        cleanup_cursor = cleanup_conn.cursor()
        cleanup_cursor.execute("UPDATE mlb_schedule SET room_state = 'staged' WHERE game_date < ?", (target_date,))
        cleanup_cursor.execute("UPDATE cmdb_ci_fanstack_room SET room_state = 'staged' WHERE game_pk IN (SELECT game_pk FROM mlb_schedule WHERE game_date < ?)", (target_date,))
        cleanup_conn.commit()
        cleanup_conn.close()
        print(f"🧹 Past game rooms (prior to {target_date}) deactivated.")
    except Exception as e:
        print("Error during past room cleanup:", e)

    # Get today's schedule explicitly passing the date to bypass MLB's 11 AM roll-over
    try:
        url = f'https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={target_date}'
        schedule = requests.get(url, timeout=5).json()
        dates = schedule.get('dates', [])
        if not dates:
            print(f"No games found on the schedule for date: {target_date}")
            return
        games = dates[0].get('games', [])
        
        # Filter games if targets provided
        if target_games:
            games = [g for g in games if str(g['gamePk']) in target_games]
            if not games:
                print(f"Target games not found in today's schedule for {target_date}.")
                return
        
        # FC-008: Inject Ambient Live News Context automatically during room setup
        print("Scraping Yardbarker for live ambient context...")
        yb_res = requests.get('https://www.yardbarker.com/mlb', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, timeout=5)
        if yb_res.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(yb_res.text, 'html.parser')
            headlines = [a.text.strip() for a in soup.select('.article_title_link')[:6]]
            from datetime import datetime
            with open('/home/james/SovereignOS/scripts/fanstack_live_context.txt', 'w') as f:
                for h in headlines:
                    f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] AMBIENT YARDBARKER NEWS DROP: {h}\n")
            print("Successfully updated fanstack_live_context.txt with fresh MLB lore.")
        else:
            print(f"Failed to fetch Yardbarker news (Status: {yb_res.status_code}).")
    except Exception as e:
        print("Error fetching dynamic schedule or news context:", e)
        return
    finally:
        conn.close()

    dot = next((p for p in data if p['user_name'] == 'dot'), None)
    wordy = next((p for p in data if p['user_name'] == 'wordy'), None)
    candidates = [p for p in data if p['user_name'] not in ['dot', 'wordy']]

    asyncio.run(main_async(games, data, candidates, dot, wordy))
    print("All games today have been provisioned directly from the DB.")

if __name__ == "__main__":
    main()
