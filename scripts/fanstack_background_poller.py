import asyncio
import websockets
import json
import os
import traceback
import sys
import time
import requests

WS_URL         = "ws://localhost:8008"
SCHEDULE_URL   = "https://statsapi.mlb.com/api/v1/schedule?sportId=1"
LIVE_FEED_BASE = "https://statsapi.mlb.com/api/v1.1/game/{}/feed/live"
GAME_STATE_DIR = "/home/james/SovereignOS/game_states"

last_status_map = {}
delay_state_map = {}
blowout_state_map = {}
game_count_states = {}
extra_innings_notified = {}
whiff_anomalies_notified = {}
schedule_cache = None
last_schedule_time = 0
last_poll_times = {}
last_game_status = {}

async def _fetch_json(url):
    try:
        res = await asyncio.to_thread(requests.get, url, timeout=10)
        return res.json() if res.status_code == 200 else None
    except Exception as e:
        return None


def _write_game_state_cache(game_pk: int, feed: dict, payload_data: dict) -> None:
    """
    Atomically serialize the live game state to a local disk cache.

    Called ONLY when state_hash changes — no disk I/O on no-op poll ticks.
    Uses write-to-tmp + os.replace() for atomic delivery: a reader in
    game_cache_reader.py always sees a complete document, never a partial write.

    Args:
        game_pk:      MLB game primary key (int).
        feed:         Full raw feed/live JSON dict from the MLB StatsAPI.
        payload_data: The already-computed thin summary dict (payload["data"]).
    """
    import datetime as _dt

    os.makedirs(GAME_STATE_DIR, exist_ok=True)
    target_path = os.path.join(GAME_STATE_DIR, f"{game_pk}.json")

    # Extract inning-by-inning scoring detail from the full linescore.
    # This is what get_inning_context() in game_cache_reader.py consumes.
    innings_data = feed.get("liveData", {}).get("linescore", {}).get("innings", [])

    # Build a ring buffer of the last 10 play descriptions.
    # This is what get_recent_plays() in game_cache_reader.py consumes.
    all_plays = feed.get("liveData", {}).get("plays", {}).get("allPlays", [])
    recent_plays = []
    for play in all_plays[-10:]:
        result  = play.get("result", {})
        desc    = result.get("description", "")
        event   = result.get("event", "")
        inn_num = play.get("about", {}).get("inning", "?")
        half    = "Top" if play.get("about", {}).get("isTopInning", True) else "Bot"
        if desc:
            recent_plays.append({
                "inning":      f"{half} {inn_num}",
                "event":       event,
                "description": desc,
            })

    doc = {
        "game_pk":        game_pk,
        "last_updated":   _dt.datetime.utcnow().isoformat() + "Z",
        "away_team":      payload_data.get("away_team"),
        "home_team":      payload_data.get("home_team"),
        "away_score":     payload_data.get("away_score"),
        "home_score":     payload_data.get("home_score"),
        "inning":         payload_data.get("inning"),
        "outs":           payload_data.get("outs"),
        "balls":          payload_data.get("balls"),
        "strikes":        payload_data.get("strikes"),
        "pitcher":        payload_data.get("pitcher"),
        "batter":         payload_data.get("batter"),
        "pitch_name":     payload_data.get("pitch_name"),
        "pitch_speed":    payload_data.get("pitch_speed"),
        "hit_speed":      payload_data.get("hit_speed"),
        "hit_distance":   payload_data.get("hit_distance"),
        "status_msg":     payload_data.get("status_msg"),
        "innings_detail": innings_data,
        "recent_plays":   recent_plays,
    }

    # Atomic write: tmp file → os.replace().
    # os.replace() is a POSIX rename — atomic on the same filesystem.
    # Readers in game_cache_reader.py can never observe a half-written file.
    tmp_path = target_path + ".tmp"
    with open(tmp_path, "w") as fh:
        json.dump(doc, fh)
    os.replace(tmp_path, target_path)


stateful_triggers_notified = {}

def check_trigger_enabled(trigger_name):
    try:
        import sqlite3
        conn = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')
        row = conn.execute("SELECT value FROM sys_user_preference WHERE user_name = 'james' AND name = 'tmi_configured_events'").fetchone()
        conn.close()
        if row:
            configured = json.loads(row[0])
            return trigger_name in configured
    except Exception:
        pass
    return True

async def log_stateful_anomaly(trigger_type, game_pk, markdown_details):
    try:
        import datetime as dt
        import os
        log_dir = "/home/james/sovereign_inbox/today"
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "statcast_telemetry.log")
        with open(log_path, "a") as log_file:
            timestamp = dt.datetime.now().strftime("%H:%M:%S")
            log_file.write(f"\n[{timestamp}] [TMI_TRIGGER] {trigger_type} (Game {game_pk})\n")
            log_file.write(markdown_details)
            log_file.write("\n\n")
    except Exception as e:
        print(f"[POLLER] Failed to write stateful anomaly log: {e}")

async def _post_json(url, payload):
    try:
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=10)
        return res.json() if res.status_code in (200, 201) else None
    except Exception as e:
        print(f"[POLLER] POST failed to {url}: {e}")
        return None

async def broadcast_to_mesh(ws, game_pk, tmi_payload, update_text):
    try:
        await ws.send(json.dumps(tmi_payload))
    except Exception as e:
        print(f"[POLLER] Failed to broadcast TMI_ANOMALY: {e}")
        
    ctx_msg = {
        "type": "update_context",
        "text": update_text,
        "target_nodes": ["ALL"],
        "target_game_pk": str(game_pk)
    }
    try:
        await ws.send(json.dumps(ctx_msg))
    except Exception as e:
        print(f"[POLLER] Failed to send update_context: {e}")

    chat_msg = {
        "type": "CHAT_MESSAGE",
        "user": "STATCAST",
        "persona": "STATCAST",
        "color": "#38bdf8",
        "text": f"🚨 {tmi_payload['event']}: {tmi_payload['script']}",
        "target_game_pk": str(game_pk),
        "is_telemetry": True
    }
    try:
        await ws.send(json.dumps(chat_msg))
    except Exception as e:
        print(f"[POLLER] Failed to send CHAT_MESSAGE: {e}")


class GameStateAccumulator:
    def __init__(self, game_pk, feed, game_status):
        self.game_pk = game_pk
        self.feed = feed
        self.game_status = game_status
        self.all_plays = feed.get("liveData", {}).get("plays", {}).get("allPlays", [])
        
        gd_teams = feed.get("gameData", {}).get("teams", {})
        self.away_team = gd_teams.get("away", {}).get("abbreviation", "AWY")
        self.home_team = gd_teams.get("home", {}).get("abbreviation", "HME")

    async def evaluate_triggers(self, ws):
        await self._check_rule_a(ws)
        await self._check_rule_b(ws)
        await self._check_rule_c(ws)

    async def _check_rule_a(self, ws):
        if not check_trigger_enabled('Full-Count Strikeout'):
            return
            
        for play in self.all_plays:
            play_id = play.get("about", {}).get("playId")
            if not play_id:
                continue
                
            notify_key = f"{self.game_pk}_ruleA_{play_id}"
            if notify_key in stateful_triggers_notified:
                continue
                
            result = play.get("result", {})
            event_type = result.get("eventType", "")
            if event_type not in ["strikeout", "strikeout_double_play"]:
                continue
                
            events = play.get("playEvents", [])
            final_pitch_idx = -1
            for idx in range(len(events) - 1, -1, -1):
                if events[idx].get("isPitch", False):
                    final_pitch_idx = idx
                    break
                    
            if final_pitch_idx == -1:
                continue
                
            if final_pitch_idx > 0:
                prev_count = events[final_pitch_idx - 1].get("count", {})
                balls = prev_count.get("balls", 0)
                strikes = prev_count.get("strikes", 0)
                if balls == 3 and strikes == 2:
                    stateful_triggers_notified[notify_key] = True
                    
                    pitcher = play.get("matchup", {}).get("pitcher", {}).get("fullName", "Pitcher")
                    batter = play.get("matchup", {}).get("batter", {}).get("fullName", "Batter")
                    about = play.get("about", {})
                    inning_half = "Top" if about.get("isTopInning", True) else "Bot"
                    inning_num = about.get("inning", 1)
                    play_desc = result.get("description", "")
                    
                    markdown_details = (
                        f"### 📡 STATEFUL TMI ANOMALY DETECTED\n"
                        f"**Event**: Full-Count Strikeout\n"
                        f"**Game PK**: {self.game_pk} ({self.away_team}@{self.home_team})\n"
                        f"**Inning**: {inning_half} {inning_num}\n"
                        f"**Count**: 3-2 (Full Count)\n"
                        f"**Batter**: {batter}\n"
                        f"**Pitcher**: {pitcher}\n"
                        f"**Play Description**: {play_desc}"
                    )
                    
                    await log_stateful_anomaly("Full-Count Strikeout", self.game_pk, markdown_details)
                    
                    tmi_payload = {
                        "id": f"anom-fc-{self.game_pk}-{play_id}",
                        "game_pk": str(self.game_pk),
                        "event": f"[{self.away_team}@{self.home_team}] Full-Count Strikeout",
                        "time": f"LIVE — {inning_half} {inning_num}",
                        "persona": "BatteryBarf",
                        "format": "Format A (Standard)",
                        "script": f"Full-Count Punchout! {batter} strikes out on a 3-2 count pitch from {pitcher}! High tension pay-off!",
                        "prompt": f"Cinematic close-up of a pitcher celebrating after striking out the batter on a 3-2 full count pitch.",
                        "target_game_pk": str(self.game_pk)
                    }
                    
                    await _post_json("http://localhost:8095/api/tmi_anomalies", tmi_payload)
                    await broadcast_to_mesh(ws, self.game_pk, tmi_payload, update_text=f"MOMENTUM SHIFT (TMI ANOMALY): Full-Count Strikeout! {batter} strikes out on a 3-2 payoff pitch from {pitcher}!")

    async def _check_rule_b(self, ws):
        if not check_trigger_enabled('Bases-Loaded Inning-Ending Jam'):
            return
            
        jam_active = False
        jam_start_score = 0
        jam_half_inning = None
        jam_play_id = None
        
        for idx, play in enumerate(self.all_plays):
            about = play.get("about", {})
            inning = about.get("inning")
            is_top = about.get("isTopInning")
            current_half = (inning, is_top)
            
            if idx > 0:
                prev_play = self.all_plays[idx - 1]
                prev_about = prev_play.get("about", {})
                prev_half = (prev_about.get("inning"), prev_about.get("isTopInning"))
                if prev_half == current_half:
                    starting_outs = prev_play.get("count", {}).get("outs", 0)
                else:
                    starting_outs = 0
            else:
                starting_outs = 0
                
            score_key = "awayScore" if is_top else "homeScore"
            current_score = play.get("result", {}).get(score_key, 0)
            
            if jam_active:
                notify_key = f"{self.game_pk}_ruleB_{jam_play_id}"
                
                if current_half != jam_half_inning:
                    if notify_key not in stateful_triggers_notified:
                        stateful_triggers_notified[notify_key] = True
                        await self._fire_rule_b(ws, jam_play_id, jam_half_inning, jam_start_score)
                    jam_active = False
                elif current_score > jam_start_score:
                    jam_active = False
                elif play.get("count", {}).get("outs", 0) == 3:
                    if notify_key not in stateful_triggers_notified:
                        stateful_triggers_notified[notify_key] = True
                        await self._fire_rule_b(ws, jam_play_id, jam_half_inning, jam_start_score)
                    jam_active = False
                    
            if not jam_active:
                matchup = play.get("matchup", {})
                has_bases_loaded = (
                    matchup.get("postOnFirst") is not None and
                    matchup.get("postOnSecond") is not None and
                    matchup.get("postOnThird") is not None
                )
                if has_bases_loaded and starting_outs < 2:
                    jam_active = True
                    if idx > 0:
                        prev_play = self.all_plays[idx - 1]
                        prev_about = prev_play.get("about", {})
                        prev_half = (prev_about.get("inning"), prev_about.get("isTopInning"))
                        if prev_half == current_half:
                            jam_start_score = prev_play.get("result", {}).get(score_key, 0)
                        else:
                            jam_start_score = 0
                    else:
                        jam_start_score = 0
                    jam_half_inning = current_half
                    jam_play_id = play.get("about", {}).get("playId") or f"play-{idx}"
                    
        if jam_active and self.game_status == "Final":
            notify_key = f"{self.game_pk}_ruleB_{jam_play_id}"
            if notify_key not in stateful_triggers_notified:
                stateful_triggers_notified[notify_key] = True
                await self._fire_rule_b(ws, jam_play_id, jam_half_inning, jam_start_score)

    async def _fire_rule_b(self, ws, play_id, half_inning, start_score):
        inning_num, is_top = half_inning
        inning_half = "Top" if is_top else "Bot"
        defending_team = self.home_team if is_top else self.away_team
        
        markdown_details = (
            f"### 📡 STATEFUL TMI ANOMALY DETECTED\n"
            f"**Event**: Houdini Escape\n"
            f"**Game PK**: {self.game_pk} ({self.away_team}@{self.home_team})\n"
            f"**Inning**: {inning_half} {inning_num}\n"
            f"**Defending Team**: {defending_team}\n"
            f"**Escape Scenario**: Escaped a bases-loaded jam with < 2 outs without conceding any runs."
        )
        
        await log_stateful_anomaly("Houdini Escape", self.game_pk, markdown_details)
        
        tmi_payload = {
            "id": f"anom-he-{self.game_pk}-{play_id}",
            "game_pk": str(self.game_pk),
            "event": f"[{self.away_team}@{self.home_team}] Bases-Loaded Inning-Ending Jam",
            "time": f"LIVE — {inning_half} {inning_num}",
            "persona": "Terry the Boomer",
            "format": "Format E (Hyper-Realistic Human)",
            "script": f"A magnificent Houdini escape! The defense gets out of a bases-loaded, low-out jam without conceding a single run! Incredible poise by {defending_team}!",
            "prompt": f"Distressed home fans high-fiving and celebrating in the stands of a baseball stadium.",
            "target_game_pk": str(self.game_pk)
        }
        
        await _post_json("http://localhost:8095/api/tmi_anomalies", tmi_payload)
        await broadcast_to_mesh(ws, self.game_pk, tmi_payload, update_text=f"MOMENTUM SHIFT (TMI ANOMALY): Houdini Escape! {defending_team} successfully escapes a bases-loaded jam in the {inning_half} {inning_num} without conceding a single run!")

    async def _check_rule_c(self, ws):
        if not check_trigger_enabled('Late-Inning Comeback Rally'):
            return
            
        away_rally_candidate = False
        home_rally_candidate = False
        away_rally_play_id = None
        home_rally_play_id = None
        
        for play in self.all_plays:
            about = play.get("about", {})
            inning = about.get("inning", 1)
            play_id = about.get("playId")
            if not play_id:
                continue
                
            result = play.get("result", {})
            away_score = result.get("awayScore", 0)
            home_score = result.get("homeScore", 0)
            
            if inning >= 7:
                diff = away_score - home_score
                if diff <= -3:
                    if not away_rally_candidate:
                        away_rally_candidate = True
                        away_rally_play_id = play_id
                elif diff >= 3:
                    if not home_rally_candidate:
                        home_rally_candidate = True
                        home_rally_play_id = play_id
                        
                if away_rally_candidate and diff >= 0:
                    notify_key = f"{self.game_pk}_ruleC_{away_rally_play_id}"
                    if notify_key not in stateful_triggers_notified:
                        stateful_triggers_notified[notify_key] = True
                        await self._fire_rule_c(ws, away_rally_play_id, "away", inning, away_score, home_score)
                    away_rally_candidate = False
                    
                if home_rally_candidate and diff <= 0:
                    notify_key = f"{self.game_pk}_ruleC_{home_rally_play_id}"
                    if notify_key not in stateful_triggers_notified:
                        stateful_triggers_notified[notify_key] = True
                        await self._fire_rule_c(ws, home_rally_play_id, "home", inning, away_score, home_score)
                    home_rally_candidate = False

    async def _fire_rule_c(self, ws, play_id, team_side, inning_num, away_score, home_score):
        rallying_team = self.away_team if team_side == "away" else self.home_team
        
        markdown_details = (
            f"### 📡 STATEFUL TMI ANOMALY DETECTED\n"
            f"**Event**: Miracle Rally\n"
            f"**Game PK**: {self.game_pk} ({self.away_team}@{self.home_team})\n"
            f"**Inning**: {inning_num}\n"
            f"**Rallying Team**: {rallying_team}\n"
            f"**Score**: {away_score} - {home_score}\n"
            f"**Rally Scenario**: Overcame a 3+ run deficit in the 7th inning or later to tie or take the lead."
        )
        
        await log_stateful_anomaly("Miracle Rally", self.game_pk, markdown_details)
        
        tmi_payload = {
            "id": f"anom-mr-{self.game_pk}-{play_id}",
            "game_pk": str(self.game_pk),
            "event": f"[{self.away_team}@{self.home_team}] Late-Inning Comeback Rally",
            "time": f"LIVE — Inning {inning_num}",
            "persona": "Dr. Kosmos",
            "format": "Format C (Dynamic Flow)",
            "script": f"A miracle rally! {rallying_team} has overcome a 3+ run deficit in the late innings to tie or take the lead! Pure magic on the field!",
            "prompt": f"A dramatic baseball moment. Players in the dugout leaping and screaming in excitement.",
            "target_game_pk": str(self.game_pk)
        }
        
        await _post_json("http://localhost:8095/api/tmi_anomalies", tmi_payload)
        await broadcast_to_mesh(ws, self.game_pk, tmi_payload, update_text=f"MOMENTUM SHIFT (TMI ANOMALY): Miracle Comeback! {rallying_team} rallies from a 3+ run deficit in the 7th inning or later to tie or take the lead!")


async def poll_games(ws):
    global schedule_cache, last_schedule_time, last_poll_times, last_game_status
    now = time.time()
    
    if not schedule_cache or now - last_schedule_time > 300:
        import datetime
        today = (datetime.datetime.utcnow() - datetime.timedelta(hours=6)).strftime("%Y-%m-%d")
        url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate={today}&endDate={today}"
        data = await _fetch_json(url)
        if data:
            schedule_cache = data
            last_schedule_time = now
            print(f"[POLLER] Schedule refreshed for {today}: {sum(len(d.get('games',[])) for d in data.get('dates',[]))} games found")
    else:
        data = schedule_cache
        
    if not data: return
    games = []
    for d_obj in data.get("dates", []):
        games.extend(d_obj.get("games", []))
    
    active_games = []
    from datetime import datetime, timezone
    for g in games:
        pk = g.get("gamePk")
        if not pk: continue
        status = g.get("status", {}).get("abstractGameState", "")
        detailed_status = g.get("status", {}).get("detailedState", "")
        
        if status in ["Postponed", "Cancelled"]:
            continue
            
        delta_mins = 999
        if status in ["Scheduled", "Preview"]:
            game_time_str = g.get("gameDate")
            if game_time_str:
                game_time = datetime.strptime(game_time_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
                now_utc = datetime.now(timezone.utc)
                delta_mins = (game_time - now_utc).total_seconds() / 60
                if delta_mins > 240:
                    continue
            else:
                continue

        # Adaptive Polling: Determine wait interval based on status and start time
        prev_status = last_game_status.get(pk)
        status_changed = (prev_status != status)
        
        if status == "Live":
            interval = 5.0      # Poll active live games every 5 seconds
        elif delta_mins < 15:
            interval = 15.0     # Poll pre-game / warmup games every 15 seconds
        elif status == "Final":
            interval = 600.0    # Finished games: check once every 10 minutes
        else:
            interval = 60.0     # Far scheduled games: check once every 60 seconds

        last_fetched = last_poll_times.get(pk, 0.0)
        if not status_changed and (now - last_fetched < interval):
            continue

        active_games.append((pk, status, detailed_status, delta_mins))
        last_game_status[pk] = status
        last_poll_times[pk] = now

    if not active_games:
        return

    tasks = [_fetch_json(LIVE_FEED_BASE.format(pk)) for (pk, _, _, _) in active_games]
    feeds = await asyncio.gather(*tasks)

    for i, feed in enumerate(feeds):
        if not feed: continue
        pk, status, detailed_status, delta_mins = active_games[i]
        
        linescore = feed.get("liveData", {}).get("linescore", {})
        inning = linescore.get("currentInningOrdinal", "-")
        is_top = linescore.get("isTopInning", True)
        half = "Top" if is_top else "Bot"
        outs = linescore.get("outs", 0)
        balls = linescore.get("balls", 0)
        strikes = linescore.get("strikes", 0)
        
        offense = linescore.get("offense", {})
        onFirst = "first" in offense
        onSecond = "second" in offense
        onThird = "third" in offense
        
        teams = linescore.get("teams", {})
        away_score = teams.get("away", {}).get("runs", 0)
        home_score = teams.get("home", {}).get("runs", 0)
        
        gd_teams = feed.get("gameData", {}).get("teams", {})
        away_team = gd_teams.get("away", {}).get("abbreviation", "AWY")
        home_team = gd_teams.get("home", {}).get("abbreviation", "HME")
        
        plays = feed.get("liveData", {}).get("plays", {})
        targetPlay = plays.get("currentPlay", {})
        allPlays = plays.get("allPlays", [])
        
        batterName = targetPlay.get("matchup", {}).get("batter", {}).get("fullName", "Awaiting Batter")
        pitcherName = targetPlay.get("matchup", {}).get("pitcher", {}).get("fullName", "Awaiting Pitcher")
        
        # PRE-GAME WARMUP FALLBACK (MLB API doesn't populate currentPlay until first pitch)
        if batterName == "Awaiting Batter" and linescore.get("offense", {}).get("batter", {}).get("fullName"):
            batterName = linescore.get("offense", {}).get("batter", {}).get("fullName")
            
        if pitcherName == "Awaiting Pitcher" and linescore.get("defense", {}).get("pitcher", {}).get("fullName"):
            pitcherName = linescore.get("defense", {}).get("pitcher", {}).get("fullName")
            
        playDesc = targetPlay.get("result", {}).get("description", "Awaiting Pitches...")
        
        if playDesc == "Awaiting Pitches...":
            if status in ["Scheduled", "Preview"]:
                current_min = int(time.time() / 60)
                if detailed_status == "Warmup":
                    playDesc = f"Pre-Game Warmup [{current_min}]"
                else:
                    playDesc = f"Scheduled (T-Minus {int(delta_mins)}m) [{current_min}]"
            else:
                if targetPlay.get("playEvents", []) and len(targetPlay["playEvents"]) > 0:
                    playDesc = targetPlay["playEvents"][-1].get("details", {}).get("description", "In Play...")
                elif len(allPlays) > 1:
                    playDesc = allPlays[-2].get("result", {}).get("description", "Awaiting Pitches...")
                    
        playDesc = playDesc.replace("**[LIVE SECURE FEED]**\n", "").replace("**[LIVE SECURE FEED]**", "").strip()
        
        events = targetPlay.get("playEvents", [])
        speed = "---"
        pName = "---"
        hit_speed = "---"
        hit_distance = "---"
        launch_angle = "---"
        
        # Whiff detection parameters
        bat_speed = "---"
        miss_distance = None
        timing_class = "---"
        timing_delta = 0.0
        vert_align = "---"
        vert_delta = 0.0
        horiz_align = "---"
        horiz_delta = 0.0
        whiff_image_url = None
        
        for ev in reversed(events):
            if ev.get("hitData") and hit_speed == "---":
                hit_speed = ev["hitData"].get("launchSpeed", "---")
                hit_distance = ev["hitData"].get("totalDistance", "---")
                launch_angle = ev["hitData"].get("launchAngle", "---")
            if ev.get("pitchData"):
                if speed == "---" and ev["pitchData"].get("startSpeed"):
                    speed = ev["pitchData"].get("startSpeed", "---")
                if pName == "---" and ev.get("details", {}).get("type", {}).get("description"):
                    pName = ev.get("details", {}).get("type", {}).get("description", "---")
            
            # Extract bat tracking if present
            bt = ev.get("batTracking") or ev.get("bat_tracking") or ev.get("pitchData", {}).get("batTracking") or ev.get("pitchData", {}).get("bat_tracking")
            if bt and miss_distance is None:
                bat_speed = bt.get("bat_speed_mph") or bt.get("batSpeedMph") or "---"
                ca = bt.get("closest_approach") or bt.get("closestApproach")
                if ca:
                    miss_distance = ca.get("miss_distance_in") or ca.get("miss_distance") or ca.get("missDistanceIn")
                    timing_class = ca.get("timing_classification") or ca.get("timingClassification") or "---"
                    timing_delta = ca.get("timing_delta_ms") or ca.get("timingDeltaMs") or 0.0
                    vert_align = ca.get("vertical_alignment") or ca.get("verticalAlignment") or "---"
                    vert_delta = ca.get("vertical_delta_in") or ca.get("verticalDeltaIn") or 0.0
                    horiz_align = ca.get("horizontal_alignment") or ca.get("horizontalAlignment") or "---"
                    horiz_delta = ca.get("horizontal_delta_in") or ca.get("horizontalDeltaIn") or 0.0
                    
        # Pivot to Hit Telemetry if Pitch Data is missing
        if (pName == "---" or speed == "---") and hit_speed != "---":
            pName = f"EXIT VELO ({hit_distance}ft)" if hit_distance != "---" else "EXIT VELOCITY"
            speed = hit_speed
            
        # Check if this is a Ghost Pitch Whiff Anomaly and generate graphic
        if miss_distance is not None and miss_distance >= 8.0 and vert_align == 'OVER':
            event_id = len(events)
            whiff_key = f"{pk}_{inning}_{outs}_{balls}_{strikes}_{event_id}"
            if whiff_key not in whiff_anomalies_notified:
                whiff_anomalies_notified[whiff_key] = True
                try:
                    import subprocess
                    import uuid
                    img_id = f"{pk}_{int(time.time())}"
                    out_path1 = f"/home/james/SovereignOS/15_FanStack/public/images/whiff_{img_id}.png"
                    out_path2 = f"/home/james/SovereignOS/19_Sovereign_Sports/public/images/whiff_{img_id}.png"
                    
                    cmd = [
                        "/home/james/SovereignOS/.venv/bin/python3",
                        "/home/james/SovereignOS/scripts/auto_image_generator.py",
                        "--miss_distance", str(miss_distance),
                        "--vertical_alignment", str(vert_align),
                        "--vertical_delta", str(vert_delta),
                        "--horizontal_alignment", str(horiz_align),
                        "--horizontal_delta", str(horiz_delta),
                        "--swing_speed", str(bat_speed) if bat_speed != "---" else "78.2",
                        "--pitch_speed", str(speed) if speed != "---" else "90.5",
                        "--pitch_name", str(pName) if pName != "---" else "Fastball",
                        "--batter", str(batterName),
                        "--pitcher", str(pitcherName),
                        "--output", out_path1
                    ]
                    subprocess.run(cmd, check=True)
                    os.makedirs(os.path.dirname(out_path2), exist_ok=True)
                    import shutil
                    shutil.copy(out_path1, out_path2)
                    
                    whiff_image_url = f"/images/whiff_{img_id}.png"
                    print(f"[POLLER] Ghost pitch anomaly image generated: {whiff_image_url}")
                except Exception as img_err:
                    print(f"[POLLER] Failed to generate whiff image: {img_err}")
                
        # P2 FIX: Include DB room_state in hash so staged→active transition forces a re-broadcast
        # Root cause: chatbots slept for 50min because Pre-Game state_hash never changed after room activation
        db_room_state = "unknown"
        try:
            import sqlite3 as _sq
            _con = _sq.connect('/home/james/SovereignOS/dna/sovereign_now.db')
            _cur = _con.cursor()
            _cur.execute("SELECT room_state FROM mlb_schedule WHERE game_pk = ?", (str(pk),))
            _row = _cur.fetchone()
            _con.close()
            if _row:
                db_room_state = _row[0] or "unknown"
        except Exception:
            pass

        # Determine batting team and event type for triggers
        batting_team = away_team if is_top else home_team
        raw_event_type = targetPlay.get("result", {}).get("eventType", "")
        if raw_event_type == "home_run":
            event_type = "home_run"
        elif raw_event_type in ["hit", "single", "double", "triple"]:
            event_type = "hit"
        elif raw_event_type in ["strikeout", "strikeout_double_play"]:
            event_type = "strikeout"
        else:
            event_type = "pitch"

        state_hash = f"{playDesc}|{balls}|{strikes}|{outs}|{away_score}|{home_score}|{pName}|{speed}|{batterName}|room:{db_room_state}"
        if pk not in last_status_map or last_status_map[pk] != state_hash:
            payload = {
                "type": "CMD_SYNC_STATE",
                "source": "MLB_TELEMETRY",
                "force_global": False,
                "target_game_pk": str(pk),
                "data": {
                    "pitcher": pitcherName,
                    "batter": batterName,
                    "status_msg": playDesc,
                    "away_score": away_score,
                    "home_score": home_score,
                    "away_team": away_team,
                    "home_team": home_team,
                    "inning": f"{half} {inning}",
                    "outs": outs,
                    "balls": balls,
                    "strikes": strikes,
                    "onFirst": onFirst,
                    "onSecond": onSecond,
                    "onThird": onThird,
                    "pitch_name": pName,
                    "pitch_speed": speed,
                    "hit_speed": hit_speed,
                    "hit_distance": hit_distance,
                    "launch_angle": launch_angle,
                    "event_type": event_type,
                    "batting_team": batting_team
                }
            }
            print(f"[POLLER] New play for {away_team}@{home_team} (Game {pk}): {playDesc}")
            
            # Write to daily telemetry log
            try:
                import datetime as dt
                import os
                today_folder_date = dt.datetime.now().strftime("%Y-%m-%d")
                log_dir = "/home/james/sovereign_inbox/today"
                if not os.path.isdir(log_dir):
                    os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, "statcast_telemetry.log")
                with open(log_path, "a") as log_file:
                    timestamp = dt.datetime.now().strftime("%H:%M:%S")
                    log_file.write(f"[{timestamp}] [STATE] {away_team} {away_score} - {home_score} {home_team} | {playDesc}\\n")
                    if pName != '---' or speed != '---':
                        log_file.write(f"[{timestamp}] STATCAST 📡 {pName} {speed}mph | Hit: {hit_speed}mph {hit_distance}ft\\n")
                    log_file.write(f"RAW PAYLOAD: {json.dumps(payload['data'])}\\n\\n")
            except Exception as e:
                print(f"[POLLER] Failed to write to statcast telemetry log: {e}")
            try:
                await ws.send(json.dumps(payload))
                last_status_map[pk] = state_hash

                # PRECOG 50-SECOND PREDICTIVE VIDEO PIPELINE TRIGGER
                try:
                    import sys
                    sys.path.append("/home/james/SovereignOS/scripts")
                    import precog_pipeline
                    
                    # 1. Finalization: Check if previous count was 3-2 (payoff pitch outcome)
                    prev_count = game_count_states.get(pk, (0, 0))
                    if prev_count == (3, 2):
                        print(f"[PRECOG] Payoff pitch outcome detected for {batterName} vs {pitcherName}: {playDesc}. Finalizing...")
                        dyn_text = await asyncio.to_thread(
                            precog_pipeline.finalize_prediction, pk, batterName, pitcherName, playDesc
                        )
                        # Broadcast winning video to live chat
                        video_msg = {
                            "type": "CHAT_MESSAGE",
                            "user": "SOVEREIGN ORACLE",
                            "persona": "oracle",
                            "color": "#A78BFA",
                            "text": f"🔮 PRECOG REALIZED: {dyn_text}",
                            "target_game_pk": str(pk),
                            "image": "https://clio.taila01894.ts.net:7300/videos/precog_winning.mp4",
                            "is_telemetry": True
                        }
                        await ws.send(json.dumps(video_msg))
                    
                    # 2. Pre-loading: Check if count is now 3-2
                    if balls == 3 and strikes == 2:
                        print(f"[PRECOG] Full count (3-2) detected for {batterName} vs {pitcherName}. Initiating pre-generation...")
                        await asyncio.to_thread(
                            precog_pipeline.init_pregeneration, pk, batterName, pitcherName
                        )
                    
                    # Update stored count state
                    game_count_states[pk] = (balls, strikes)
                except Exception as precog_err:
                    print(f"[PRECOG PIPELINE ERROR] Failed during evaluation: {precog_err}")

                # HOT CACHE WRITE: Atomically persist full game state to disk.
                # Gated by the state_hash delta check above — only fires on real changes.
                # Non-fatal: a disk error must never drop the active WebSocket connection.
                try:
                    _write_game_state_cache(pk, feed, payload["data"])
                except Exception as _cache_err:
                    print(f"[CACHE WRITE] Non-fatal error for game {pk}: {_cache_err}")

                try:
                    accumulator = GameStateAccumulator(pk, feed, status)
                    await accumulator.evaluate_triggers(ws)
                except Exception as accum_err:
                    print(f"[POLLER] GameStateAccumulator error for game {pk}: {accum_err}")

                # Broadcast raw telemetry as a visible CHAT_MESSAGE so it appears in the chat feed
                if db_room_state == 'active' and playDesc and "Awaiting" not in playDesc and "Scheduled" not in playDesc and "Warmup" not in playDesc:
                    score_str = f"{away_team} {away_score} — {home_team} {home_score}"
                    pitch_str = f" | {pName} {speed}mph" if pName != '---' and speed != '---' else ""
                    
                    if whiff_image_url:
                        telem_text = f"🚨 GHOST PITCH ANOMALY: {batterName} swings and misses! Bat speed {bat_speed} MPH, missed by {miss_distance} inches OVER the ball! [{score_str}]"
                        telem_msg = {
                            "type": "CHAT_MESSAGE",
                            "user": "STATCAST",
                            "persona": "STATCAST",
                            "color": "#38bdf8",
                            "text": telem_text,
                            "target_game_pk": str(pk),
                            "is_telemetry": True,
                            "image": whiff_image_url
                        }
                        # Send context update to trigger chatbots to talk about the anomaly
                        ctx_msg = {
                            "type": "update_context",
                            "text": f"GHOST PITCH ANOMALY: {batterName} just swung and completely missed a pitch from {pitcherName}. The ball passed under the bat with a whopping spatial gap of {miss_distance} inches! The bat speed was {bat_speed} MPH. The room is in shock! React to this crazy whiff!",
                            "target_nodes": ["ALL"],
                            "target_game_pk": str(pk)
                        }
                        try:
                            await ws.send(json.dumps(ctx_msg))
                        except Exception as ctx_err:
                            print(f"[POLLER] Failed to send context update: {ctx_err}")
                    else:
                        telem_text = f"📡 {playDesc}{pitch_str} [{score_str}]"
                        telem_msg = {
                            "type": "CHAT_MESSAGE",
                            "user": "STATCAST",
                            "persona": "STATCAST",
                            "color": "#38bdf8",
                            "text": telem_text,
                            "target_game_pk": str(pk),
                            "is_telemetry": True
                        }
                    await ws.send(json.dumps(telem_msg))

                # Check for Extra Innings Trigger — fires when game enters 10th inning or higher
                current_inning = linescore.get("currentInning", 0)
                if current_inning >= 10 and db_room_state == 'active':
                    noti_key = f"{pk}_{current_inning}"
                    if not extra_innings_notified.get(noti_key, False):
                        extra_innings_notified[noti_key] = True
                        
                        # Set the room's Boggs Level to 4!
                        boggs_payload = {
                            "type": "BOGGS_LEVEL_UPDATE",
                            "level": 4,
                            "target_game_pk": str(pk)
                        }
                        try:
                            await ws.send(json.dumps(boggs_payload))
                        except Exception as e:
                            print(f"[POLLER] Failed to send extra inning boggs level: {e}")
                        
                        # Send an exciting Extra Innings sensory update to the chat
                        extra_msg = {
                            "type": "CHAT_MESSAGE",
                            "user": "SYSTEM",
                            "text": f"🚨 SENSORY OVERDRIVE: Game {pk} has entered EXTRA INNINGS ({inning} Inning)! BOGGS OVERDRIVE CRANKED TO MAX LEVEL 4!!!",
                            "color": "#FF003C",
                            "target_game_pk": str(pk),
                            "shake": True
                        }
                        try:
                            await ws.send(json.dumps(extra_msg))
                        except Exception as e:
                            print(f"[POLLER] Failed to send extra inning chat message: {e}")
                
                # Check for TMI Delay Triggers — fires for ALL live games, not just active rooms
                is_delayed = "Delay" in detailed_status
                if is_delayed and not delay_state_map.get(pk, False):
                    # Transition to Delayed! Fire TMI
                    delay_state_map[pk] = True
                    try:
                        import sqlite3
                        con = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')
                        cur = con.cursor()
                        # Favor scenarios specifically mapped to this game_pk, fallback to any random scenario if none found
                        cur.execute("SELECT name, payload FROM cmdb_ci_tmi_scenario WHERE game_pk = ? ORDER BY RANDOM() LIMIT 1", (str(pk),))
                        row = cur.fetchone()
                        if not row:
                            cur.execute("SELECT name, payload FROM cmdb_ci_tmi_scenario ORDER BY RANDOM() LIMIT 1")
                            row = cur.fetchone()
                        con.close()
                        
                        if row:
                            tmi_payload = row[1]
                            tmi_msg = {
                                "type": "TMI_ANOMALY",
                                "event": "Delay of Game (Rain / Unspecified)",
                                "time": f"LIVE (Game {pk})",
                                "persona": "BatteryBarf", 
                                "format": "Format B (2D Cartoon)",
                                "script": tmi_payload,
                                "prompt": "2D animation, flat comic-book coloring, cartoon style. An anthropomorphic dog wearing a thick medical neck brace...",
                                "id": f"anom-{pk}-{int(time.time())}",
                                "target_game_pk": "GLOBAL"
                            }
                            # Also dispatch standard update_context to local so Wardy Desk catches the override
                            local_msg = {
                                "type": "update_context",
                                "text": f"SYSTEM OVERRIDE (TMI TIMELINE BRANCH): {tmi_payload}",
                                "target_game_pk": str(pk)
                            }
                            await ws.send(json.dumps(local_msg))
                            await ws.send(json.dumps(tmi_msg))
                            print(f"[TMI] Executing Autonomous Timeline Prune for Game {pk}: {row[0]}")
                    except Exception as tmi_e:
                        print(f"TMI Execution Error: {tmi_e}")
                elif not is_delayed and delay_state_map.get(pk, False):
                    # Transition OUT of Delay
                    delay_state_map[pk] = False
                    
                # Catch-All TMI Sweeper — fires for ALL live games (feeds TMI News Desk regardless of active room)
                if playDesc:
                    l_desc = playDesc.lower()
                    is_hr = "homers" in l_desc or "home run" in l_desc or "grand slam" in l_desc
                    is_weird = "eject" in l_desc or "balk" in l_desc or "review" in l_desc or "interfere" in l_desc or "injur" in l_desc or "brawl" in l_desc or "fight" in l_desc or "benches clear" in l_desc
                    
                    run_diff = abs(away_score - home_score)
                    current_blowout_state = blowout_state_map.get(pk, 0)
                    is_blowout = False
                    blowout_level = 0
                    
                    if run_diff >= 15 and current_blowout_state < 15:
                        is_blowout = True; blowout_level = 15
                        blowout_state_map[pk] = 15
                    elif run_diff >= 10 and current_blowout_state < 10:
                        is_blowout = True; blowout_level = 10
                        blowout_state_map[pk] = 10
                    elif run_diff >= 7 and current_blowout_state < 7:
                        is_blowout = True; blowout_level = 7
                        blowout_state_map[pk] = 7

                    if (is_hr or is_weird or is_blowout):
                        if is_blowout:
                            event_title = f"Massive Blowout Alert ({blowout_level}+ Run Differential)"
                        elif is_hr:
                            event_title = "Home Run Detected" 
                        else:
                            event_title = "Game Anomaly / High Entropy Event"
                            
                        tmi_catchall_msg = {
                            "type": "TMI_ANOMALY",
                            "event": f"[{away_team}@{home_team}] {event_title}",
                            "time": f"{half} {inning}",
                            "persona": "Flowmercial Specialist", 
                            "format": "Format C (Dynamic Flow)",
                            "script": f"React dynamically to this: {playDesc}",
                            "prompt": f"A shocked or excited baseball fan reacting to a screen showing: {playDesc}. Extreme emotional expression, cinematic sports style.",
                            "id": f"anom-catchall-{pk}-{int(time.time())}",
                            "target_game_pk": "GLOBAL"
                        }
                        try:
                            await ws.send(json.dumps(tmi_catchall_msg))
                            print(f"[TMI] Captured High-Entropy Play: {event_title} for Game {pk}")
                        except: pass
                    
            except Exception as e:
                print(f"[SEND_ERROR] Dropping cache hash to force retry: {e}")
                raise e

async def main():
    while True:
        try:
            # ping_interval=None, ping_timeout=None keeps the TCP connection alive
            # without blocking the asyncio event loop on idle game nights
            async with websockets.connect(WS_URL, ping_interval=None, ping_timeout=None) as ws:
                print("[BACKGROUND POLLER] Connected to Sovereign Mesh!")
                while True:
                    await poll_games(ws)
                    await asyncio.sleep(1)  # 1s poll 
        except Exception as e:
            print(f"[RECONNECT] Lost connection to mesh, retrying in 10s... {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(main())
