import asyncio
import json
import socket
import time
import websockets
import urllib.request
import traceback
import os
from pathlib import Path
from dotenv import load_dotenv

import requests

# Load environment configurations dynamically
load_dotenv("/home/james/SovereignOS/.env")

SOVEREIGN_HOME = Path(os.getenv("SOVEREIGN_HOME", "/home/james/SovereignOS"))
DB_PATH = str(SOVEREIGN_HOME / "dna" / os.getenv("SOVEREIGN_DB_NAME", "sovereign_now.db"))

def fire_govee(r, g, b, color_tem=0):
    import socket, json, os
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    if os.getenv("GOVEE_TMI_ACTIVE", "true").lower() == "false":
        return
    ips = []
    env_ips = os.getenv("GOVEE_DEVICE_IP")
    if env_ips:
        ips = [ip.strip() for ip in env_ips.split(",") if ip.strip()]
    if not ips:
        ips = ["192.168.1.173", "192.168.1.174", "192.168.1.176", "192.168.1.188"]
    port = int(os.getenv("GOVEE_PORT", 4003))
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        msg = {
            "msg": {
                "cmd": "colorWC",
                "data": {
                    "color": {"r": r, "g": g, "b": b},
                    "colorTem": color_tem
                }
            }
        }
        payload = json.dumps(msg).encode('utf-8')
        for ip in ips:
            try:
                sock.sendto(payload, (ip, port))
            except:
                pass
        sock.close()
    except Exception as e:
        print(f"[GOVEE UDP ERROR] {e}")

def get_govee_statuses_sync(ips, port=4003):
    import socket, json
    statuses = {}
    try:
        recv_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        recv_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        recv_sock.bind(('0.0.0.0', 4002))
        recv_sock.settimeout(0.15)
        
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
    except:
        pass
    return statuses

def trigger_govee_http_score():
    print("[GOVEE DIRECT OVERRIDE] Mets Score! Changing to Solid Orange.")
    fire_govee(252, 92, 29, 0)

def trigger_govee_http_hr():
    import os, time, socket, json
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    if os.getenv("GOVEE_TMI_ACTIVE", "true").lower() == "false":
        return
    ips = []
    env_ips = os.getenv("GOVEE_DEVICE_IP")
    if env_ips:
        ips = [ip.strip() for ip in env_ips.split(",") if ip.strip()]
    if not ips:
        ips = ["192.168.1.173", "192.168.1.174", "192.168.1.176", "192.168.1.188"]
    port = int(os.getenv("GOVEE_PORT", 4003))
    print("[GOVEE DIRECT OVERRIDE] Mets Home Run! Flashing Orange and Blue.")
    try:
        prev_statuses = get_govee_statuses_sync(ips, port)
        for _ in range(5):
            fire_govee(0, 45, 98, 0) # Mets Blue
            time.sleep(0.3)
            fire_govee(252, 92, 29, 0) # Mets Orange
            time.sleep(0.3)
            
        # Restore status
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
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
        sock.close()
    except Exception as e:
        print(f"[GOVEE HR ERROR] {e}")

clients = set()
senga_strikeout_streak = {}

game_states = __import__('collections').defaultdict(lambda: {
    "away_team": "AWY", "home_team": "HME",
    "away_score": 0, "home_score": 0,
    "inning": "1", "outs": 0,
    "status_msg": "Awaiting Telemetry...",
    "target_game_pk": "", "last_exit_velocity": "",
    "pitch_name": "---", "pitch_speed": "---",
    "onFirst": False, "onSecond": False, "onThird": False,
    "balls": 0, "strikes": 0, "pitchCount": "-",
    "batter": "", "pitcher": "",
    "hit_speed": "---", "hit_distance": "---",
    "launch_angle": "---", "event_type": "pitch",
    "batting_team": ""
})

global_system_state = {
    "mard_engine": True,
    "chaos_gating": True,
    "boggs_level": 2
}

recent_messages = {}
chat_buffers = __import__('collections').defaultdict(lambda: __import__('collections').deque(maxlen=100))
ws_rooms = {}
active_sim_task = None
INTELLIGENCE_DB = str(SOVEREIGN_HOME / "sovereign_intelligence.db")

async def run_simulation(game_pk, speed):
    con = sqlite3.connect(INTELLIGENCE_DB)
    cur = con.cursor()
    cur.execute("SELECT at_bat_number, pitch_number, events, description, des, away_score, home_score, inning, outs_when_up, balls, strikes, pitch_name, release_speed, batter, pitcher, away_team, home_team FROM statcast_pitches WHERE game_pk = ? ORDER BY at_bat_number ASC, pitch_number ASC", (game_pk,))
    rows = cur.fetchall()
    con.close()
    
    if not rows:
        state["status_msg"] = f"[SIMULATION ERROR] No statcast pitches found for game_pk {game_pk}"
        await broadcast_state()
        return

    state["status_msg"] = f"[SIMULATION ACTIVE] Game {game_pk} loaded. MESH OVERRIDE ENGAGED."
    await broadcast_state()
    await asyncio.sleep(2)
    
    try:
        for r in rows:
            ab_num, p_num, evts, desc, des, away_s, home_s, inn, outs, balls, strikes, p_name, speed_mph, batter, pitcher, away_t, home_t = r
            
            gs = game_states[str(game_pk)]
            gs["away_team"] = away_t if away_t else gs.get("away_team", "AWY")
            gs["home_team"] = home_t if home_t else gs.get("home_team", "HME")
            gs["away_score"] = away_s if away_s is not None else gs.get("away_score", 0)
            gs["home_score"] = home_s if home_s is not None else gs.get("home_score", 0)
            gs["inning"] = inn or gs.get("inning", 1)
            gs["outs"] = outs if outs is not None else gs.get("outs", 0)
            gs["balls"] = balls if balls is not None else gs.get("balls", 0)
            gs["strikes"] = strikes if strikes is not None else gs.get("strikes", 0)
            gs["pitch_name"] = p_name or "Unknown"
            gs["pitch_speed"] = speed_mph or "---"
            gs["pitcher"] = pitcher or gs.get("pitcher", "")
            gs["batter"] = batter or gs.get("batter", "")
            
            msg = f"Pitch {p_num} of AB {ab_num}: {desc}."
            if evts:
                msg += f" EVENT: {evts}."
            if des and len(str(des)) > 5:
                msg += f" {des}"
            
            gs["status_msg"] = msg
            gs["timestamp"] = time.strftime("%H:%M:%S")
            
            await broadcast_state(str(game_pk))
            
            delay = 12.0 / float(speed)
            await asyncio.sleep(delay)
            
        game_states[str(game_pk)]["status_msg"] = f"[SIMULATION COMPLETE] Game {game_pk} has concluded."
        await broadcast_state(str(game_pk))
    except asyncio.CancelledError:
        print(f"Simulation of game_pk {game_pk} was cancelled.")
        raise

def get_active_system_warnings():
    warnings = []
    try:
        conn = sqlite3.connect("/home/james/SovereignOS/dna/sovereign_now.db")
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT ea.ci_sys_id, ea.expression_name, ea.avatar_url, c.name, c.operational_status
            FROM cmdb_ci_expression_avatar ea
            JOIN cmdb_ci c ON ea.ci_sys_id = c.sys_id
            WHERE c.operational_status IN (2, 3)
        """)
        rows = cur.fetchall()
        for r in rows:
            warnings.append({
                "ci_sys_id": r["ci_sys_id"],
                "name": r["name"],
                "operational_status": r["operational_status"],
                "expression_name": r["expression_name"],
                "avatar_url": r["avatar_url"]
            })
        conn.close()
    except Exception as e:
        print(f"Error querying active warnings: {e}")
    return warnings

async def broadcast_state(target_pk=None, force_global=False):
    if not clients: return
    
    # Dynamically inject system warnings and degraded state
    warnings = get_active_system_warnings()
    global_system_state["warnings"] = warnings
    global_system_state["system_degraded"] = len(warnings) > 0
    
    if target_pk and target_pk in game_states:
        msg = json.dumps({"type": "STATE_UPDATE", "data": game_states[target_pk], "system": global_system_state, "force_global": force_global, "target_game_pk": target_pk})
        print(f"[DEBUG] Broadcasting STATE_UPDATE for {target_pk} to {len(clients)} clients...")
        for c in list(clients):
            # Send if force_global, or if they are in GLOBAL, or if they are in the target room
            room = ws_rooms.get(c, "GLOBAL")
            if force_global or room == "GLOBAL" or room == target_pk:
                try:
                    await c.send(msg)
                except Exception as e:
                    print(f"[DEBUG] Failed to send to client {c}: {e}")
                    clients.remove(c)
                    ws_rooms.pop(c, None)
    elif force_global and not target_pk:
        # Just sending an empty system update
        msg = json.dumps({"type": "STATE_UPDATE", "data": {}, "system": global_system_state, "force_global": True, "target_game_pk": "GLOBAL"})
        for c in list(clients):
            try: await c.send(msg)
            except: pass

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SovereignKnot/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None

async def mlb_poller():
    """Stub — MLB ingestion handled exclusively by fanstack_background_poller.py to avoid duplicate STATE_UPDATEs."""
    while True:
        await asyncio.sleep(3600)



async def handle_client(ws):
    clients.add(ws)
    print("New FanCast visualizer node connected!")
    ws_rooms[ws] = "GLOBAL"
    await ws.send(json.dumps({"type": "STATE_UPDATE", "data": {}, "system": global_system_state}))
    # History gets pulled when they JOIN_ROOM
    
    try:
        async for message in ws:
            data = json.loads(message)
            
            if data.get("event") == "webslinger_trigger":
                room_id = str(data.get("room_id", "GLOBAL"))
                out_msg = json.dumps({
                    "type": "webslinger_trigger",
                    "event_name": data.get("event_name"),
                    "data": data.get("data"),
                    "room_id": room_id
                })
                event_data = data.get("data") or {}
                if event_data.get("type") == "hardware":
                    params = event_data.get("params", {})
                    command = event_data.get("command")
                    if command == "color_strobe":
                        r1 = params.get("r1", 0)
                        g1 = params.get("g1", 45)
                        b1 = params.get("b1", 98)
                        r2 = params.get("r2", 252)
                        g2 = params.get("g2", 92)
                        b2 = params.get("b2", 29)
                        cycles = params.get("cycles", 5)
                        interval_ms = params.get("interval_ms", 300)
                        
                        def run_strobe():
                            for _ in range(cycles):
                                fire_govee(r1, g1, b1)
                                time.sleep(interval_ms / 1000.0)
                                fire_govee(r2, g2, b2)
                                time.sleep(interval_ms / 1000.0)
                        
                        loop = asyncio.get_running_loop()
                        loop.run_in_executor(None, run_strobe)
                
                for c in list(clients):
                    if ws_rooms.get(c, "GLOBAL") == room_id or room_id == "GLOBAL" or ws_rooms.get(c, "GLOBAL") == "GLOBAL":
                        try:
                            await c.send(out_msg)
                        except:
                            pass
                continue
            
            # Global Chat Relay for WardyStack and Fans
            if data.get("type") in ["CHAT_MESSAGE", "SYS_LOG", "YOUTUBE_CHAT"]:
                user = data.get("user", data.get("persona", "SYSTEM"))
                text = data.get("text", "")
                target_room = str(data.get("target_game_pk", "GLOBAL"))
                
                # Mean Gene Bouncer Intercept
                if data.get("type") == "CHAT_MESSAGE":
                    try:
                        from mean_gene import evaluate_bouncer_intervention
                        chk = evaluate_bouncer_intervention(user, text)
                        if not chk.get("allow", True):
                            # Suppress and send system moderation response to sender only
                            moderation_msg = {
                                "type": "CHAT_MESSAGE",
                                "user": "SYSTEM",
                                "color": "#f59e0b",
                                "text": chk.get("text"),
                                "target_game_pk": target_room,
                                "timestamp": time.strftime("%H:%M:%S"),
                                "model_engine": "MEAN_GENE_BOUNCER",
                                "is_penalty_box": False,
                                "msg_type": "MODERATION"
                            }
                            await ws.send(json.dumps(moderation_msg))
                            continue
                    except Exception as e:
                        print(f"[MEAN_GENE INTERCEPT ERROR] {e}")
                
                # FC-013: Deduplicate Bot commentary to prevent 3x echo loops from multiple UIs
                msg_key = f"{user}:{text}"
                now = time.time()
                if not data.get("is_penalty_box"):
                    if msg_key in recent_messages and now - recent_messages[msg_key] < 30:
                        continue # Suppress duplicate
                    recent_messages[msg_key] = now

                
                # Channel namespacing mapping
                channel = data.get("channel")
                if not channel:
                    if data.get("is_penalty_box"):
                        channel = "vocal_matrix"
                    else:
                        channel = "system_broadcast"

                chat_msg = {
                    "type": data.get("type", "CHAT_MESSAGE"),
                    "user": user,
                    "color": data.get("color"),
                    "text": text,
                    "target_game_pk": target_room,
                    "timestamp": time.strftime("%H:%M:%S"),
                    "model_engine": data.get("model_engine"),
                    "is_penalty_box": data.get("is_penalty_box", False),
                    "channel": channel,
                    "mediaUrl": data.get("mediaUrl") or data.get("media_url") or data.get("image"),
                    "shake": data.get("shake", False)
                }
                out_msg = json.dumps(chat_msg)
                
                chat_buffers[target_room].append(chat_msg)
                
                # UAT CHAT LOGGING
                try:
                    log_dir = SOVEREIGN_HOME / "logs"
                    log_dir.mkdir(parents=True, exist_ok=True)
                    with open(log_dir / "fanstack_chat_uat.log", "a") as f:
                        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                        f.write(f"[{timestamp}] {user}: {text}\n")
                except Exception:
                    pass
                    
                # AUTOMATED NOTEBOOK-LM EXPORTS (Per-Game Markdown)
                if target_room != "GLOBAL":
                    try:
                        import datetime
                        today_dir = datetime.datetime.now().strftime('daily_%d%m%Y')
                        export_dir = f"/home/james/SovereignOS/data/logs/{today_dir}"
                        os.makedirs(export_dir, exist_ok=True)
                        export_path = f"{export_dir}/auto_export_{target_room}.md"
                        if not os.path.exists(export_path):
                            with open(export_path, "w") as f:
                                f.write(f"# Sovereign FanCast Export: Game {target_room}\n\n")
                                
                        with open(export_path, "a") as f:
                            ts = time.strftime("%H:%M:%S")
                            f.write(f"**{user}** ({ts}): {text}\n\n")
                    except Exception as e:
                        print(f"Failed to write NotebookLM export: {e}")
                
                for c in list(clients):
                    if ws_rooms.get(c, "GLOBAL") == target_room or target_room == "GLOBAL" or ws_rooms.get(c, "GLOBAL") == "GLOBAL":
                        try: 
                            await c.send(out_msg)
                        except: 
                            pass
            
            if data.get("type") == "JOIN_ROOM":
                pk = str(data.get("target_game_pk", data.get("room", "GLOBAL")))
                ws_rooms[ws] = pk
                global_msgs = list(chat_buffers["GLOBAL"])
                room_msgs = list(chat_buffers[pk]) if pk != "GLOBAL" else []
                combined = global_msgs + room_msgs
                combined.sort(key=lambda x: x.get("timestamp", ""))
                hist_msg = json.dumps({"type": "CHAT_HISTORY", "messages": combined})
                await ws.send(hist_msg)
                if pk in game_states:
                    await ws.send(json.dumps({"type": "STATE_UPDATE", "data": game_states[pk], "system": global_system_state}))
            
            # Adversarial Ingress Broadcast
            if data.get("type") == "CMD_PERSONA":
                out_msg = json.dumps({"type": "CMD_PERSONA", "persona": data.get("persona"), "prompt": data.get("prompt")})
                for c in list(clients):
                    try: 
                        await c.send(out_msg)
                    except: 
                        pass
            
            if data.get("type") == "CMD_SYNC_STATE":
                sync_data = data.get("data", {})
                
                # SDLC-0027 FINAL LOCKDOWN LOGIC
                s_msg = sync_data.get("status_msg", "").lower()
                p_name = sync_data.get("pitch_name", "")
                p_speed = sync_data.get("pitch_speed", "")
                if "timeout" in s_msg:
                    print(f"[NYM_SF_LOCKDOWN] [{time.strftime('%H:%M:%S')}] STANDARD ON-FIELD TIMEOUT DETECTED.")
                elif "warmup" in s_msg or "scheduled" in s_msg or "awaiting" in s_msg:
                    pass # Ignore telemetry loss for pre-game states
                elif not p_name or not p_speed or p_name == "---" or p_speed == "---":
                    print(f"[NYM_SF_LOCKDOWN] [{time.strftime('%H:%M:%S')}] TELEMETRY LOSS DETECTED: Empty Pitch JSON received.")
                import sys
                sys.stdout.flush()
                
                force_global = data.get("force_global", False)
                pk = str(data.get("target_game_pk", "GLOBAL"))
                
                # NOTEBOOK-LM LOGGING FOR TELEMETRY
                if pk != "GLOBAL" and sync_data.get("status_msg") and sync_data.get("status_msg") != game_states.get(pk, {}).get("status_msg"):
                    try:
                        import datetime
                        today_dir = datetime.datetime.now().strftime('daily_%d%m%Y')
                        export_dir = f"/home/james/SovereignOS/data/logs/{today_dir}"
                        os.makedirs(export_dir, exist_ok=True)
                        export_path = f"{export_dir}/auto_export_{pk}.md"
                        if not os.path.exists(export_path):
                            with open(export_path, "w") as f:
                                f.write(f"# Sovereign FanCast Export: Game {pk}\n\n")
                        with open(export_path, "a") as f:
                            ts = time.strftime("%H:%M:%S")
                            f.write(f"> **[MLB TELEMETRY]** ({ts}): {sync_data['status_msg']}\n\n")
                    except Exception as e:
                        print(f"Failed to write Telemetry export: {e}")

                gs = game_states[pk]
                gs["timestamp"] = time.strftime("%H:%M:%S")
                gs["target_game_pk"] = pk
                gs["away_score"] = sync_data.get("away_score", gs["away_score"])
                gs["home_score"] = sync_data.get("home_score", gs["home_score"])
                gs["away_team"] = sync_data.get("away_team", gs["away_team"])
                gs["home_team"] = sync_data.get("home_team", gs["home_team"])
                gs["inning"] = sync_data.get("inning", gs["inning"])
                gs["outs"] = sync_data.get("outs", gs["outs"])
                gs["balls"] = sync_data.get("balls", gs.get("balls", 0))
                gs["strikes"] = sync_data.get("strikes", gs.get("strikes", 0))
                gs["last_exit_velocity"] = sync_data.get("last_exit_velocity", gs.get("last_exit_velocity", ""))
                gs["status_msg"] = sync_data.get("status_msg", gs["status_msg"])
                gs["pitcher"] = sync_data.get("pitcher", gs.get("pitcher", ""))
                gs["batter"] = sync_data.get("batter", gs.get("batter", ""))
                gs["pitch_name"] = sync_data.get("pitch_name", gs.get("pitch_name", "---"))
                gs["pitch_speed"] = sync_data.get("pitch_speed", gs.get("pitch_speed", "---"))
                gs["hit_speed"] = sync_data.get("hit_speed", gs.get("hit_speed", "---"))
                gs["hit_distance"] = sync_data.get("hit_distance", gs.get("hit_distance", "---"))
                gs["launch_angle"] = sync_data.get("launch_angle", gs.get("launch_angle", "---"))
                gs["event_type"] = sync_data.get("event_type", gs.get("event_type", "pitch"))
                gs["batting_team"] = sync_data.get("batting_team", gs.get("batting_team", ""))
                gs["onFirst"] = sync_data.get("onFirst", gs.get("onFirst", False))
                gs["onSecond"] = sync_data.get("onSecond", gs.get("onSecond", False))
                gs["onThird"] = sync_data.get("onThird", gs.get("onThird", False))
                gs["pitchCount"] = sync_data.get("pitchCount", gs.get("pitchCount", "-"))

                # Senga Ghost Protocol Easter Egg detection
                status_msg = sync_data.get("status_msg", "")
                pitcher_name = sync_data.get("pitcher", "")
                is_senga = "senga" in pitcher_name.lower() or "senga" in status_msg.lower()
                
                if is_senga and status_msg:
                    status_lower = status_msg.lower()
                    is_strikeout = "strikes out" in status_lower or "strikeout" in status_lower or "called out on strikes" in status_lower
                    is_other_outcome = any(x in status_lower for x in [
                        "singles", "doubles", "triples", "homers", "home run", "walks", "base hit",
                        "ground out", "flies out", "lines out", "pops out", "sac", "hit by pitch", "hbp",
                        "reached on", "fielder's choice", "double play", "triple play", "lineout", "flyout", "groundout"
                    ])
                    
                    old_msg = game_states.get(pk, {}).get("status_msg", "")
                    if status_msg != old_msg:
                        if is_strikeout:
                            streak_count = senga_strikeout_streak.get(pk, 0) + 1
                            senga_strikeout_streak[pk] = streak_count
                            print(f"[GHOST PROTOCOL] Kodai Senga strikeout detected! Streak for game {pk}: {streak_count}")
                            if streak_count >= 3:
                                print(f"[GHOST PROTOCOL] STREAK AT {streak_count}! Triggering Ghost Protocol Easter Egg!")
                                ghost_payload = {
                                    "type": "webslinger_trigger",
                                    "event_name": "EMIT_CHAT_GHOST_OVERLAY",
                                    "data": {"trigger": "EMIT_CHAT_GHOST_OVERLAY"},
                                    "room_id": pk
                                }
                                out_msg = json.dumps(ghost_payload)
                                for c in list(clients):
                                    try:
                                        await c.send(out_msg)
                                    except:
                                        pass
                        elif is_other_outcome:
                            senga_strikeout_streak[pk] = 0
                            print(f"[GHOST PROTOCOL] Pitcher outcome reset Senga streak for game {pk} to 0. (Play: {status_msg})")

                await broadcast_state(pk, force_global=force_global)

            # Keeping the manual trigger for testing / Chindogu Overrides
            
            if data.get("type") == "CMD_METS_HR" or (data.get("type") == "trigger_event" and data.get("event") == "home_run"):
                pk = ws_rooms.get(ws, "GLOBAL")
                if pk in game_states: game_states[pk]["status_msg"] = "🚨 SOVEREIGN HARDWARE OVERRIDE: METS HOME RUN! 🚨"
                await broadcast_state(pk)
                loop = asyncio.get_running_loop()
                loop.run_in_executor(None, trigger_govee_http_hr)

            elif data.get("type") == "CMD_METS_GOOD" or (data.get("type") == "trigger_event" and data.get("event") == "strikeout"):
                pk = ws_rooms.get(ws, "GLOBAL")
                if pk in game_states: game_states[pk]["status_msg"] = "🚨 SOVEREIGN HARDWARE OVERRIDE: METS WALK-OFF! 🚨"
                await broadcast_state(pk)
                loop = asyncio.get_running_loop()
                loop.run_in_executor(None, trigger_govee_http_score)
                
            elif data.get("type") == "trigger_event" and data.get("event") == "spam_logo":
                out_msg = json.dumps({"type": "CMD_SPAM_METS"})
                for c in list(clients):
                    try: await c.send(out_msg)
                    except: pass

            # Manual Studio Interventions (Wardy injections)
            if data.get("type") == "CMD_MSG":
                msg_text = data.get("text", "")
                force_global = data.get("force_global", False)
                pk = ws_rooms.get(ws, "GLOBAL")
                if msg_text:
                    if pk in game_states: game_states[pk]["status_msg"] = msg_text
                    await broadcast_state(pk, force_global=force_global)

            # Support Mesh-wide game synchronization
            if data.get("type") == "CMD_SWITCH_GAME":
                pk = data.get("game_pk")
                force_global = data.get("force_global", False)
                if pk:
                    hist_msg = json.dumps({"type": "CHAT_HISTORY", "messages": list(chat_buffers[str(pk)])})
                    if force_global:
                        for c in list(clients): 
                            ws_rooms[c] = str(pk)
                            try: await c.send(hist_msg)
                            except: pass
                    else:
                        ws_rooms[ws] = str(pk)
                        try: await ws.send(hist_msg)
                        except: pass
                    
                    # Broadcast room switch event to sync dropdown UI states
                    switch_msg = json.dumps({"type": "GAME_SWITCHED", "game_pk": str(pk)})
                    for c in list(clients):
                        try: await c.send(switch_msg)
                        except: pass

                    await broadcast_state(str(pk))
                    
                    if str(pk) != "GLOBAL":
                        import subprocess
                        print(f"[HOTSWAP] Triggering autonomous deployment for room {pk}...")
                        subprocess.Popen(["python3", "/home/james/SovereignOS/scripts/deploy_game_room.py", str(pk)])
                    
                    # Manage Simulation Tasks
                    global active_sim_task
                    if active_sim_task:
                        active_sim_task.cancel()
                        active_sim_task = None
                    
                    # Check DB to see if the chosen room is marked as simulated
                    con = sqlite3.connect(DB_PATH)
                    cur = con.cursor()
                    cur.execute("SELECT is_simulated, sim_speed FROM cmdb_ci_fanstack_room WHERE game_pk=?", (str(pk),))
                    row = cur.fetchone()
                    con.close()
                    if row and row[0] == 1:
                        speed = row[1] if row[1] else 1.0
                        active_sim_task = asyncio.create_task(run_simulation(pk, speed))

            # Boggs Level 5 Chaos
            if data.get("type") == "CMD_SPAM_METS":
                out_msg = json.dumps({"type": "CMD_SPAM_METS"})
                for c in list(clients):
                    try: 
                        await c.send(out_msg)
                    except: 
                        pass
            # Wardy Broadcast translation
            if data.get("type") == "broadcast":
                chat_msg = {"type": "CHAT_MESSAGE", "user": "Wardy", "color": "#f97316", "text": data.get("message", ""), "target_game_pk": "GLOBAL", "timestamp": time.strftime("%H:%M:%S")}
                out_msg = json.dumps(chat_msg)
                for c in list(clients):
                    try: await c.send(out_msg)
                    except: pass
                    
            # MARD Config (UI Toggles)
            if data.get("type") == "mard_config":
                key = data.get("key")
                val = data.get("value")
                if key == 'engine':
                    global_system_state["mard_engine"] = val
                elif key == 'chaos':
                    global_system_state["chaos_gating"] = val
                elif key == 'barf_cypher':
                    global_system_state["barf_cypher"] = val
                await broadcast_state(force_global=True)
                
            if data.get("type") == "boggs_level":
                global_system_state["boggs_level"] = data.get("level", 2)
                await broadcast_state(force_global=True)
                    
            # Pass all new Claude Wardy v2 UI events and WebRTC signaling transparently to backend bots/clients
            if data.get("type") in ["persona_config", "persona_strike", "custom_prompt", "boggs_level", "sim_speed", "trigger_event", "switch_game", "update_context", "TMI_ANOMALY", "hot_take_rant", "HOLOLINK_REQUEST", "WEBRTC_OFFER", "WEBRTC_ANSWER", "WEBRTC_ICE_CANDIDATE", "HOLOLINK_END", "outrage_proxy_deployed"]:
                out_msg = json.dumps(data)
                for c in list(clients):
                    try: 
                        await c.send(out_msg)
                    except: 
                        pass
    except Exception as e:
        print("Disconnection:", e)
    finally:
        if ws in clients: clients.remove(ws)

import uvicorn
from fastapi import FastAPI, WebSocket, Request, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import time

class ChatExportData(BaseModel):
    markdown_content: str

class HoloDexDecodeRequest(BaseModel):
    prompt: str
    vibe: str

import sqlite3
import uuid
import subprocess

# DB_PATH resolved dynamically in global scope at top of file

from fastapi.middleware.cors import CORSMiddleware

# --- FASTAPI PROXY SERVER (PORT 8000) ---
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Hot Takes service router (POST /api/hot_take, POST /api/hot_take/dub, GET /api/hot_take/voices)
import sys as _sys
_sys.path.insert(0, os.path.dirname(__file__))
from hot_takes_service import router as hot_takes_router
fastapi_app.include_router(hot_takes_router)

# Register Game Log Export router (GET /api/game-log/export/{game_pk}, /games, /chat, /plays)
try:
    from game_log_export_api import router as _game_log_router
    fastapi_app.include_router(_game_log_router)
    print("✅ Game log export routes mounted on /api/game-log/*")
except Exception as _gl_err:
    print(f"⚠️  Game log export routes NOT mounted: {_gl_err}")

# Ensure hot_takes table exists
def _ensure_hot_takes_table():
    try:
        _c = sqlite3.connect(DB_PATH)
        _c.execute("""
            CREATE TABLE IF NOT EXISTS hot_takes (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                persona    TEXT NOT NULL,
                topic      TEXT,
                response   TEXT NOT NULL,
                engine     TEXT,
                room_id    TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        _c.commit()
        _c.close()
    except Exception as _e:
        print(f"[STARTUP] hot_takes table init failed: {_e}")
_ensure_hot_takes_table()

# Also wire hot_takes DB persistence INTO hot_takes_service
@fastapi_app.get("/api/hot_takes")
async def get_hot_takes(persona: str = None, limit: int = 50):
    """Retrieve saved hot takes from the DB, optionally filtered by persona."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    if persona:
        cur.execute("SELECT * FROM hot_takes WHERE persona = ? ORDER BY created_at DESC LIMIT ?", (persona, limit))
    else:
        cur.execute("SELECT * FROM hot_takes ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return {"hot_takes": rows}

# Process Tracking
bot_process = None
telemetry_process = None

@fastapi_app.post("/api/holodex/decode")
async def decode_holodex_prompt(req: HoloDexDecodeRequest):
    # Sovereign Bro Decoder Logic Wrapper
    vibe_map = {
        "1990s Felt Puppet": "1990s physical felt puppet aesthetic, practical effects, Jim Henson style, slight VHS grain",
        "Cinematic Broadcast": "Cinematic 8k broadcast quality, telephoto lens, professional lighting, photorealistic",
        "Action Cam": "GoPro action cam POV, wide angle, dynamic motion, chaotic blur, high energy",
        "Gritty Noir": "High contrast black and white, gritty 1940s film noir, dramatic shadows, rain-slicked surfaces",
        "Hyper-Realistic": "Unreal Engine 5 render style, hyper-realistic, ray tracing, octane render, insanely detailed",
        "Retro 8-Bit": "Retro 8-bit pixel art style, flat colors, low resolution aesthetic, arcade vibe",
        "Surreal Anime": "Studio Ghibli inspired surreal anime style, vibrant pastel colors, ethereal lighting"
    }
    vibe_enhancement = vibe_map.get(req.vibe, req.vibe)
    decoded_prompt = f"[{req.vibe.upper()} OVERRIDE] {req.prompt}. Aesthetic injection: {vibe_enhancement}. Masterpiece, best quality, highly detailed."
    
    return {"decoded_prompt": decoded_prompt}


class HoloDexSynthesizeRequest(BaseModel):
    prompt: str
    vibe: str

@fastapi_app.post("/api/holodex/synthesize")
async def synthesize_holodex_image(req: HoloDexSynthesizeRequest):
    import urllib.parse
    import uuid
    
    vibe_map = {
        "1990s Felt Puppet": "1990s physical felt puppet aesthetic, practical effects, Jim Henson style, slight VHS grain",
        "Cinematic Broadcast": "Cinematic 8k broadcast quality, telephoto lens, professional lighting, photorealistic",
        "Action Cam": "GoPro action cam POV, wide angle, dynamic motion, chaotic blur, high energy",
        "Gritty Noir": "High contrast black and white, gritty 1940s film noir, dramatic shadows, rain-slicked surfaces",
        "Hyper-Realistic": "Unreal Engine 5 render style, hyper-realistic, ray tracing, octane render, insanely detailed",
        "Retro 8-Bit": "Retro 8-bit pixel art style, flat colors, low resolution aesthetic, arcade vibe",
        "Surreal Anime": "Studio Ghibli inspired surreal anime style, vibrant pastel colors, ethereal lighting"
    }
    
    vibe_enhancement = vibe_map.get(req.vibe, req.vibe)
    full_prompt = f"{req.prompt}. Aesthetic: {vibe_enhancement}. Masterpiece, highly detailed."
    
    # URL encode the prompt
    encoded_prompt = urllib.parse.quote(full_prompt)
    pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    # Save the synthesized image to our local static directory
    images_dir = "/home/james/SovereignOS/15_FanStack/public/images"
    os.makedirs(images_dir, exist_ok=True)
    
    filename = f"holodex_{uuid.uuid4().hex[:8]}.png"
    file_path = os.path.join(images_dir, filename)
    
    try:
        # Download the generated image using requests
        res = requests.get(pollinations_url, timeout=30)
        if res.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(res.content)
            
            # The static URL served by Vite
            media_url = f"/images/{filename}"
            
            # Also register the asset in our CMDB sys_media_asset table!
            try:
                import sqlite3
                sys_id = uuid.uuid4().hex
                con = sqlite3.connect(DB_PATH)
                c = con.cursor()
                
                # Get next asset tag
                c.execute("SELECT asset_tag FROM sys_media_asset ORDER BY asset_tag DESC LIMIT 1")
                row = c.fetchone()
                tag = "FS-MED-00001"
                if row:
                    import re
                    match = re.search(r'FS-MED-(\d+)', row[0])
                    if match:
                        tag = f"FS-MED-{(int(match.group(1)) + 1):05d}"
                
                c.execute("""
                    INSERT INTO sys_media_asset (sys_id, asset_tag, name, file_name, file_path, file_size_bytes, mime_type, category, status, md5_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (sys_id, tag, f"HoloDex Synthesis: {req.prompt[:50]}", filename, file_path, len(res.content), "image/png", "HoloDex", f"Generated: {req.vibe}", sys_id))
                con.commit()
                con.close()
            except Exception as e:
                print(f"[HOLODEX CMDB ERROR] {e}")
                
            return {
                "status": "success",
                "mediaUrl": media_url,
                "decoded_prompt": full_prompt,
                "filename": filename
            }
        else:
            return {"status": "error", "message": f"Failed to download image: HTTP {res.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ═══════════════════════════════════════════════════════════════
# STREAM SNIPER PROXY  — forwards /api/snipe/* to daemon on 5056
# ═══════════════════════════════════════════════════════════════

SNIPER_DAEMON_URL = "http://localhost:5056"

@fastapi_app.post("/api/snipe/{path:path}")
async def snipe_proxy_post(path: str, request: Request):
    """Proxy POST /api/snipe/* → stream_sniper_daemon:5056"""
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length", "transfer-encoding")}
    try:
        resp = await asyncio.to_thread(
            lambda: requests.post(f"{SNIPER_DAEMON_URL}/api/snipe/{path}", data=body, headers=headers, timeout=15)
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("Content-Type", "application/json"))
    except Exception as e:
        print(f"[SNIPE PROXY ERROR] {type(e).__name__}: {e}")
        return Response(content=json.dumps({"error": str(e), "type": type(e).__name__}), status_code=502, media_type="application/json")

@fastapi_app.get("/api/snipe/{path:path}")
async def snipe_proxy_get(path: str, request: Request):
    """Proxy GET /api/snipe/* → stream_sniper_daemon:5056"""
    try:
        resp = await asyncio.to_thread(
            lambda: requests.get(f"{SNIPER_DAEMON_URL}/api/snipe/{path}", params=dict(request.query_params), timeout=15)
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("Content-Type", "application/json"))
    except Exception as e:
        return Response(content=json.dumps({"error": str(e), "type": type(e).__name__}), status_code=502, media_type="application/json")

@fastapi_app.get("/api/vertex_burn/status")
async def get_vertex_status():
    import os
    is_on = os.path.exists('/home/james/SovereignOS/config/vertex_burn.on')
    return {"vertex_burn_enabled": is_on}

@fastapi_app.post("/api/vertex_burn/toggle")
async def toggle_vertex():
    import os
    file_path = '/home/james/SovereignOS/config/vertex_burn.on'
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "success", "vertex_burn_enabled": False, "message": "Vertex Burn Mode Disabled"}
    else:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write("ON")
        return {"status": "success", "vertex_burn_enabled": True, "message": "Vertex Burn Mode Enabled"}

@fastapi_app.get("/api/webslinger_events")
async def get_webslinger_events():
    """Retrieve all active webslinger templates from sys_webslinger_event."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        con.row_factory = _sq.Row
        c = con.cursor()
        c.execute("""
            SELECT id, event_name, payload_template, default_duration_ms, active_status
            FROM sys_webslinger_event
            WHERE active_status = 1
        """)
        rows = [dict(r) for r in c.fetchall()]
        con.close()
        return {"status": "success", "events": rows}
    except Exception as e:
        return {"status": "error", "message": str(e), "events": []}

class TelemetryRuleCreate(BaseModel):
    trigger_rule_name: str
    statcast_event_type: str
    telemetry_field: str
    operator_comparison: str
    comparison_value: str
    batting_team_filter: str = "NYM"
    target_webslinger_event_id: int
    is_automated_ingress: int = 1
    active_status: int = 1

class TelemetryRuleUpdate(BaseModel):
    trigger_rule_name: str = None
    statcast_event_type: str = None
    telemetry_field: str = None
    operator_comparison: str = None
    comparison_value: str = None
    batting_team_filter: str = None
    target_webslinger_event_id: int = None
    is_automated_ingress: int = None
    active_status: int = None

@fastapi_app.get("/api/tmi_telemetry_map")
async def get_tmi_telemetry_map():
    """Retrieve all telemetry rules from sys_tmi_telemetry_map."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        con.row_factory = _sq.Row
        c = con.cursor()
        c.execute("""
            SELECT id, trigger_rule_name, statcast_event_type, telemetry_field, 
                   operator_comparison, comparison_value, batting_team_filter, 
                   target_webslinger_event_id, is_automated_ingress, active_status
            FROM sys_tmi_telemetry_map
        """)
        rows = [dict(r) for r in c.fetchall()]
        con.close()
        return {"status": "success", "rules": rows}
    except Exception as e:
        return {"status": "error", "message": str(e), "rules": []}

@fastapi_app.post("/api/tmi_telemetry_map")
async def create_tmi_telemetry_rule(rule: TelemetryRuleCreate):
    """Create a new telemetry mapping rule."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        c = con.cursor()
        c.execute("""
            INSERT INTO sys_tmi_telemetry_map (
                trigger_rule_name, statcast_event_type, telemetry_field, 
                operator_comparison, comparison_value, batting_team_filter, 
                target_webslinger_event_id, is_automated_ingress, active_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rule.trigger_rule_name, rule.statcast_event_type, rule.telemetry_field,
            rule.operator_comparison, rule.comparison_value, rule.batting_team_filter,
            rule.target_webslinger_event_id, rule.is_automated_ingress, rule.active_status
        ))
        con.commit()
        new_id = c.lastrowid
        con.close()
        return {"status": "success", "id": new_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@fastapi_app.put("/api/tmi_telemetry_map/{rule_id}")
async def update_tmi_telemetry_rule(rule_id: int, rule: TelemetryRuleUpdate):
    """Update an existing telemetry mapping rule."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        c = con.cursor()
        
        fields = []
        params = []
        for key, val in rule.dict(exclude_unset=True).items():
            fields.append(f"{key} = ?")
            params.append(val)
            
        if not fields:
            con.close()
            return {"status": "error", "message": "No fields to update"}
            
        params.append(rule_id)
        query = f"UPDATE sys_tmi_telemetry_map SET {', '.join(fields)} WHERE id = ?"
        c.execute(query, params)
        con.commit()
        con.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@fastapi_app.delete("/api/tmi_telemetry_map/{rule_id}")
async def delete_tmi_telemetry_rule(rule_id: int):
    """Delete a telemetry mapping rule."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        c = con.cursor()
        c.execute("DELETE FROM sys_tmi_telemetry_map WHERE id = ?", (rule_id,))
        con.commit()
        con.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@fastapi_app.post("/api/tmi_telemetry_map/toggle_all")
async def toggle_all_tmi_telemetry_rules(enabled: bool):
    """Master toggle to enable/disable automated ingress database-wide."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        c = con.cursor()
        val = 1 if enabled else 0
        c.execute("UPDATE sys_tmi_telemetry_map SET is_automated_ingress = ?", (val,))
        con.commit()
        con.close()
        return {"status": "success", "is_automated_ingress": val}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@fastapi_app.post("/api/media/inject")
async def inject_media(file: UploadFile = File(...), room_id: str = "GLOBAL"):
    """Accept drag-and-drop SVG file uploads, save to temporary folder, write manifest.json, run ingest_media_assets.py as a subprocess, and broadcast media_injection WS."""
    import uuid as _uuid
    import shutil
    import subprocess
    import json
    import os
    
    if not file.filename.endswith(".svg"):
        raise HTTPException(status_code=400, detail="Only SVG files are supported.")
        
    try:
        temp_dir = f"/tmp/media_inject_{_uuid.uuid4().hex}"
        os.makedirs(temp_dir, exist_ok=True)
        
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with open(file_path, "r", encoding="utf-8") as f:
            svg_data = f.read()
            
        manifest = {
            "scenarios": [
                {
                    "num": 1,
                    "name": file.filename,
                    "raw_file": file.filename,
                    "processed_file": file.filename,
                    "expression_key": "injected_svg",
                    "expression_reference": "injected_svg",
                    "vibe": "playcall_desk"
                }
            ]
        }
        with open(os.path.join(temp_dir, "manifest.json"), "w") as f:
            json.dump(manifest, f)
            
        cmd = [
            "python3",
            "/home/james/SovereignOS/scripts/ingest_media_assets.py",
            "--dir", temp_dir,
            "--ticket", "STRY-06152026-PLAYCALL-DESK",
            "--advocate", "playcall",
            "--category", "Playcall Injections"
        ]
        
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print(f"[MEDIA INJECT ERROR] Ingestion failed: {proc.stderr}")
            raise HTTPException(status_code=500, detail=f"Asset ingestion failed: {proc.stderr}")
            
        ws_msg = json.dumps({
            "type": "media_injection",
            "svg_data": svg_data,
            "filename": file.filename,
            "room_id": room_id
        })
        for c in list(clients):
            if ws_rooms.get(c, "GLOBAL") == room_id or room_id == "GLOBAL" or ws_rooms.get(c, "GLOBAL") == "GLOBAL":
                try:
                    await c.send(ws_msg)
                except:
                    pass
                    
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"[MEDIA INJECT WARNING] Failed to cleanup temp dir {temp_dir}: {e}")
            
        return {"status": "success", "message": "SVG Injected successfully"}
    except Exception as e:
        print(f"[MEDIA INJECT ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════
# FLOW LIVE INTEGRATION NODE (sys_media_asset tables)
# ═══════════════════════════════════════════════════════════════

class FlowAssetCreate(BaseModel):
    title: str
    category: str
    prompt: str

@fastapi_app.get("/api/flow/assets")
async def get_flow_assets():
    """Retrieve all assets registered in the sys_media_asset CMDB table."""
    import sqlite3 as _sq
    try:
        con = _sq.connect(DB_PATH)
        con.row_factory = _sq.Row
        c = con.cursor()
        c.execute("""
            SELECT sys_id, asset_tag, name, file_name, file_path, file_size_bytes, category, status, created_at
            FROM sys_media_asset
            ORDER BY created_at DESC
        """)
        rows = [dict(r) for r in c.fetchall()]
        con.close()
        return {"status": "success", "assets": rows}
    except Exception as e:
        return {"status": "error", "message": str(e), "assets": []}

@fastapi_app.post("/api/flow/assets")
async def create_flow_asset(req: FlowAssetCreate):
    """Dynamically register a new synthesized Flow asset in the CMDB."""
    import sqlite3 as _sq
    import uuid as _uuid
    import hashlib as _hashlib
    try:
        con = _sq.connect(DB_PATH)
        c = con.cursor()
        
        sys_id = str(_uuid.uuid4()).replace('-', '')
        
        c.execute("SELECT asset_tag FROM sys_media_asset ORDER BY asset_tag DESC LIMIT 1")
        row = c.fetchone()
        tag = "FS-MED-00001"
        if row:
            last_tag = row[0]
            import re
            match = re.search(r'FS-MED-(\d+)', last_tag)
            if match:
                tag = f"FS-MED-{(int(match.group(1)) + 1):05d}"
                
        file_name = f"flow_{sys_id[:8]}.png"
        file_path = f"/home/james/SovereignOS/media_vault/01_Assets/Catnip_Wars/{file_name}"
        md5_hash = _hashlib.md5(sys_id.encode('utf-8')).hexdigest()
        
        c.execute("""
            INSERT INTO sys_media_asset (sys_id, asset_tag, name, file_name, file_path, file_size_bytes, mime_type, category, status, md5_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sys_id, tag, req.title, file_name, file_path, 1024, "image/png", req.category, f"Synced: {req.prompt[:100]}", md5_hash))
        con.commit()
        con.close()
        
        broadcast_msg = json.dumps({
            "type": "FLOW_ASSET_SYNC",
            "asset": {
                "sys_id": sys_id,
                "asset_tag": tag,
                "name": req.title,
                "file_name": file_name,
                "file_path": file_path,
                "category": req.category,
                "status": f"Synced: {req.prompt}",
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        })
        for cl in list(clients):
            try: await cl.send(broadcast_msg)
            except: pass
            
        return {"status": "success", "asset": {
            "sys_id": sys_id,
            "asset_tag": tag,
            "name": req.title,
            "file_name": file_name,
            "file_path": file_path,
            "category": req.category,
            "status": f"Synced: {req.prompt}"
        }}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ═══════════════════════════════════════════════════════════════
# ROOM BUILDER API  (absorbed from scruffys_bar_server.py)
# ═══════════════════════════════════════════════════════════════

@fastapi_app.get("/api/all_personas")
async def api_all_personas():
    """All available personas for the Room Builder modal. Only returns valid AI personas with a team assignment."""
    import sqlite3 as _sq
    con = _sq.connect(DB_PATH)
    c = con.cursor()
    c.execute("""
        SELECT id as sys_id, user_name, team, deep_lore, system_prompt, behavior_notes, governance, color, avatar_url
        FROM persona
        WHERE team IS NOT NULL AND team != '' AND team NOT IN ('golf_room')
        ORDER BY team, user_name
    """)
    rows = c.fetchall()
    con.close()
    personas = [{"sys_id": r[0], "user_name": r[1], "team": r[2], "deep_lore": r[3], "system_prompt": r[4], "behavior_notes": r[5], "governance": r[6], "color": r[7], "avatar_url": r[8]} for r in rows]
    return {"personas": personas}


@fastapi_app.get("/api/room_personas")
async def api_room_personas(gamePk: str):
    """Current persona roster for a specific game room.
    Returns personas as @-prefixed strings (matches ScruffysTavern string[] contract)
    plus a roster array with full objects for richer consumers.
    """
    import sqlite3 as _sq
    con = _sq.connect(DB_PATH)
    c = con.cursor()
    c.execute("""
        SELECT p.user_name, p.team, p.color, gp.gemini_tokens, gp.local_tokens
        FROM persona p
        JOIN game_persona gp ON gp.persona_id = p.id
        WHERE gp.game_pk = ? AND gp.seat_state = 'active'
        ORDER BY p.team, p.user_name
    """, (gamePk,))
    rows = c.fetchall()
    
    c.execute("SELECT gemini_tokens, local_tokens, sys_tokens FROM mlb_schedule WHERE game_pk = ?", (gamePk,))
    gt_row = c.fetchone()
    room_gemini = gt_row[0] if gt_row and gt_row[0] else 0
    room_local = gt_row[1] if gt_row and gt_row[1] else 0
    room_sys = gt_row[2] if gt_row and gt_row[2] else 0
    con.close()
    
    # String array — required by ScruffysTavern component (@-prefixed for mention autocomplete)
    persona_strings = [f"@{r[0]}" for r in rows]
    # Rich object array for anything that needs team/color data
    roster = [{"user_name": r[0], "team": r[1], "color": r[2], "gemini_tokens": r[3] or 0, "local_tokens": r[4] or 0} for r in rows]
    return {"personas": persona_strings, "roster": roster, "game_pk": gamePk, "room_gemini_tokens": room_gemini, "room_local_tokens": room_local, "room_sys_tokens": room_sys}


# Deprecated file-based upload route removed to resolve endpoint collision.
# All avatar uploads are handled securely by upload_persona_image_blob at line 1053.


@fastapi_app.post("/api/save_room_personas")
async def api_save_room_personas(request: Request):
    """Save persona roster for a game room (Room Builder save action)."""
    import sqlite3 as _sq, uuid as _uuid
    data = await request.json()
    
    con = _sq.connect(DB_PATH, timeout=30.0)
    c = con.cursor()
    
    # Handle RoomConfigurator incremental update format
    if 'action' in data:
        game_pk = str(data.get('game_pk', ''))
        persona_name = data.get('persona', '')
        action = data.get('action')
        
        if not game_pk or not persona_name:
            con.close()
            return {"status": "error", "message": "game_pk and persona required"}
            
        c.execute("SELECT id FROM persona WHERE user_name = ? COLLATE NOCASE", (persona_name,))
        row = c.fetchone()
        if not row:
            con.close()
            return {"status": "error", "message": "persona not found"}
        persona_id = row[0]
            
        if action == 'add':
            c.execute("SELECT id FROM game_persona WHERE game_pk = ? AND persona_id = ?", (game_pk, persona_id))
            if not c.fetchone():
                c.execute(
                    "INSERT INTO game_persona (id, game_pk, persona_id, seat_state) VALUES (?,?,?,'active')",
                    (_uuid.uuid4().hex, game_pk, persona_id)
                )
        elif action == 'remove':
            c.execute("DELETE FROM game_persona WHERE game_pk = ? AND persona_id = ?", (game_pk, persona_id))
            
        con.commit()
        con.close()
        
        # Force chatbots to reload the roster
        sync_msg = json.dumps({"action": "SYNC_DB_PERSONAS"})
        for c in list(clients):
            try: await c.send(sync_msg)
            except: pass
            
        return {"status": "success", "game_pk": game_pk, "action": action, "persona": persona_name}
        
    # Handle WatchPartyConsole bulk update format
    else:
        game_pk = str(data.get('gamePk', ''))
        persona_names = data.get('personas', [])
        
        if not game_pk:
            con.close()
            return {"status": "error", "message": "gamePk required"}
            
        c.execute("DELETE FROM game_persona WHERE game_pk = ?", (game_pk,))
        inserted = 0
        for name in persona_names:
            c.execute("SELECT id FROM persona WHERE user_name = ? COLLATE NOCASE", (name,))
            row = c.fetchone()
            if row:
                c.execute(
                    "INSERT INTO game_persona (id, game_pk, persona_id, seat_state) VALUES (?,?,?,'active')",
                    (_uuid.uuid4().hex, game_pk, row[0])
                )
                inserted += 1
        con.commit()
        con.close()
        
        # Force chatbots to reload the roster
        sync_msg = json.dumps({"action": "SYNC_DB_PERSONAS"})
        for c in list(clients):
            try: await c.send(sync_msg)
            except: pass
            
        return {"status": "success", "game_pk": game_pk, "inserted": inserted}


@fastapi_app.get("/api/scoreboard")
async def api_scoreboard(gamePk: str):
    """Live scoreboard for a specific game_pk — hits the MLB Stats API."""
    import urllib.request as _ur
    import json as _json
    try:
        live_url = f"https://statsapi.mlb.com/api/v1.1/game/{gamePk}/feed/live"
        req = _ur.Request(live_url, headers={"User-Agent": "SovereignKnot/1.0"})
        with _ur.urlopen(req, timeout=8) as resp:
            live_res = _json.loads(resp.read().decode("utf-8"))

        game_data = live_res["gameData"]
        live_data = live_res["liveData"]
        linescore = live_data["linescore"]

        away_abbr = game_data["teams"]["away"]["abbreviation"]
        home_abbr = game_data["teams"]["home"]["abbreviation"]
        away_name = game_data["teams"]["away"].get("teamName", away_abbr)
        home_name = game_data["teams"]["home"].get("teamName", home_abbr)

        return {
            "status": game_data["status"]["detailedState"],
            "away": {
                "name": away_abbr,
                "teamName": away_name,
                "runs": linescore["teams"]["away"].get("runs", 0),
                "hits": linescore["teams"]["away"].get("hits", 0),
                "errors": linescore["teams"]["away"].get("errors", 0),
            },
            "home": {
                "name": home_abbr,
                "teamName": home_name,
                "runs": linescore["teams"]["home"].get("runs", 0),
                "hits": linescore["teams"]["home"].get("hits", 0),
                "errors": linescore["teams"]["home"].get("errors", 0),
            },
            "inning": linescore.get("currentInningOrdinal", ""),
            "inningState": linescore.get("inningState", ""),
            "outs": linescore.get("outs", 0),
            "balls": linescore.get("balls", 0),
            "strikes": linescore.get("strikes", 0),
            "innings": linescore.get("innings", []),
            "offense": linescore.get("offense", {}),
        }
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════
# ROLL CALL ROOM ACTIVATION TOGGLES
# ═══════════════════════════════════════════════════════════════

@fastapi_app.post("/api/room/activate")
async def api_activate_room(request: Request):
    """Flip a staged room to active — chatbots start firing."""
    import sqlite3 as _sq
    data = await request.json()
    game_pk = str(data.get('game_pk', ''))
    if not game_pk:
        return {"status": "error", "message": "game_pk required"}
    con = _sq.connect(DB_PATH, timeout=60.0)
    con.execute("UPDATE mlb_schedule SET room_state='active' WHERE game_pk=?", (game_pk,))
    con.execute("UPDATE cmdb_ci_fanstack_room SET room_state='active' WHERE game_pk=?", (game_pk,))
    con.commit()
    con.close()
    return {"status": "success", "game_pk": game_pk, "room_state": "active"}


@fastapi_app.post("/api/room/deactivate")
async def api_deactivate_room(request: Request):
    """Flip an active room back to staged — chatbots go silent."""
    import sqlite3 as _sq
    data = await request.json()
    game_pk = str(data.get('game_pk', ''))
    if not game_pk:
        return {"status": "error", "message": "game_pk required"}
    con = _sq.connect(DB_PATH, timeout=60.0)
    con.execute("UPDATE mlb_schedule SET room_state='staged' WHERE game_pk=?", (game_pk,))
    con.execute("UPDATE cmdb_ci_fanstack_room SET room_state='staged' WHERE game_pk=?", (game_pk,))
    con.commit()
    con.close()
    return {"status": "success", "game_pk": game_pk, "room_state": "staged"}

@fastapi_app.post("/api/system/broadcast")
async def api_system_broadcast():
    """Trigger an immediate websocket state broadcast for system/warning updates."""
    await broadcast_state(force_global=True)
    return {"status": "success", "message": "System broadcast triggered"}

def _et_game_date() -> str:
    """Return the active game-slate date in Eastern time.
    Before 10 AM ET we're still on the previous day's slate —
    MLB doesn't publish a new schedule until ~10 AM ET."""
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo
    from datetime import datetime, timedelta
    now_et = datetime.now(ZoneInfo('America/New_York'))
    if now_et.hour < 10:
        return (now_et - timedelta(days=1)).strftime('%Y-%m-%d')
    return now_et.strftime('%Y-%m-%d')

@fastapi_app.post("/api/chat/inject")
async def api_inject_chat(request: Request):
    """God Mode: Inject a chat message from any persona into the live stream."""
    import time
    import json
    data = await request.json()
    user = data.get("user", "SYSTEM")
    text = data.get("text", "")
    target_room = str(data.get("target_game_pk", "GLOBAL"))
    channel = data.get("channel", "system_broadcast")
    color = data.get("color", "#94a3b8")
    
    chat_msg = {
        "type": "CHAT_MESSAGE",
        "user": user,
        "color": color,
        "text": text,
        "target_game_pk": target_room,
        "timestamp": time.strftime("%H:%M:%S"),
        "model_engine": "GOD_MODE_INJECTOR",
        "is_penalty_box": False,
        "channel": channel,
        "mediaUrl": data.get("mediaUrl") or data.get("media_url") or data.get("image"),
        "shake": data.get("shake", False)
    }
    chat_buffers[target_room].append(chat_msg)
    
    # Broadcast to all clients
    out_msg = json.dumps(chat_msg)
    for c in list(clients):
        if ws_rooms.get(c, "GLOBAL") == target_room or target_room == "GLOBAL" or ws_rooms.get(c, "GLOBAL") == "GLOBAL":
            try:
                await c.send(out_msg)
            except:
                pass
    return {"status": "success", "message": chat_msg}


@fastapi_app.get("/api/roll_call")
async def api_roll_call():
    """Full Roll Call status for the dashboard."""
    import sqlite3 as _sq
    today = _et_game_date()
    con = _sq.connect(DB_PATH)
    con.row_factory = _sq.Row
    rows = con.execute("""
        SELECT
            s.game_pk,
            s.away_team, s.home_team,
            s.game_date, s.game_time, s.status,
            s.room_state,
            group_concat(p.user_name) as personas
        FROM mlb_schedule s
        LEFT JOIN game_persona gp ON gp.game_pk = s.game_pk AND gp.seat_state = 'active'
        LEFT JOIN persona p ON p.id = gp.persona_id
        WHERE s.game_date = ?
        GROUP BY s.game_pk
        ORDER BY s.game_date
    """, (today,)).fetchall()
    con.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d['personas'] = d['personas'].split(',') if d['personas'] else []
        results.append(d)
        
    return {"games": results}


# ═══════════════════════════════════════════════════════════════
# GAME_PLAY PERSISTENCE  (Statcast / live feed storage)
# ═══════════════════════════════════════════════════════════════

@fastapi_app.post("/api/game_play")
async def api_store_game_play(request: Request):
    """Store a live play event. Called by the MLB poller on every pitch."""
    import sqlite3 as _sq, uuid as _uuid
    data = await request.json()
    game_pk = str(data.get('game_pk', ''))
    if not game_pk:
        return {"status": "error", "message": "game_pk required"}
    con = _sq.connect(DB_PATH)
    con.execute("""
        INSERT OR IGNORE INTO game_play
            (id, game_pk, play_id, inning, half, event_type,
             batter, pitcher, pitch_speed, pitch_type,
             description, score_away, score_home, outs, raw_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        _uuid.uuid4().hex,
        game_pk,
        data.get('play_id'),
        data.get('inning'),
        data.get('half'),
        data.get('event_type'),
        data.get('batter'),
        data.get('pitcher'),
        data.get('pitch_speed'),
        data.get('pitch_type'),
        data.get('description'),
        data.get('score_away'),
        data.get('score_home'),
        data.get('outs'),
        json.dumps(data.get('raw', {}))
    ))
    con.commit()
    con.close()
    return {"status": "stored"}


@fastapi_app.get("/api/game_play/{game_pk}")
async def api_get_game_plays(game_pk: str, last: int = 10):
    """Get the last N play events for a game (for persona context injection)."""
    import sqlite3 as _sq
    con = _sq.connect(DB_PATH)
    con.row_factory = _sq.Row
    rows = con.execute("""
        SELECT inning, half, event_type, batter, pitcher,
               pitch_speed, pitch_type, description, score_away, score_home
        FROM game_play
        WHERE game_pk = ?
        ORDER BY recorded_at DESC
        LIMIT ?
    """, (game_pk, last)).fetchall()
    con.close()
    return {"game_pk": game_pk, "plays": [dict(r) for r in reversed(rows)]}

@fastapi_app.post("/api/export_chat")
async def export_chat(data: ChatExportData):
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filepath = f"/home/james/SovereignOS/data/logs/chat_export_{timestamp}.md"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w") as f:
        f.write(data.markdown_content)
    return {"status": "success", "file": filepath}

import zipfile
import io
from fastapi.responses import Response

@fastapi_app.get("/api/logs")
async def get_logs():
    log_dir = "/home/james/SovereignOS/data/logs/"
    dropzone_dir = "/home/james/SovereignOS/dna/dropzone/daily_15042026/"
    try:
        files = []
        if os.path.exists(log_dir):
            files.extend([
                {"name": f, "path": f"/data/logs/{f}"} 
                for f in os.listdir(log_dir) 
                if f.startswith("auto_export_") and (f.endswith(".md") or f.endswith(".csv"))
            ])
        if os.path.exists(dropzone_dir):
            files.extend([
                {"name": f, "path": f"/dna/dropzone/daily_15042026/{f}"} 
                for f in os.listdir(dropzone_dir) 
                if "FanCast_Export" in f and f.endswith(".csv")
            ])
        files.sort(key=lambda x: x["name"], reverse=True)
        return {"logs": files}
    except Exception as e:
        return {"logs": []}

@fastapi_app.get("/api/export_all")
async def export_all_logs():
    log_dir = "/home/james/SovereignOS/data/logs/"
    zip_buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for f in os.listdir(log_dir):
                if f.startswith("auto_export_") and f.endswith(".md"):
                    file_path = os.path.join(log_dir, f)
                    zip_file.write(file_path, f)
        zip_buffer.seek(0)
        return Response(
            content=zip_buffer.getvalue(), 
            media_type="application/zip", 
            headers={"Content-Disposition": "attachment; filename=Sovereign_All_Logs.zip"}
        )
    except Exception as e:
        return {"error": str(e)}

from fastapi.responses import FileResponse
import glob

@fastapi_app.get("/api/persona_image/{persona_id}")
async def get_persona_image(persona_id: str):
    import base64, sqlite3 as _sq, glob
    from fastapi.responses import Response, FileResponse
    safe_id = persona_id.lower().replace(" ", "_")

    # Map name variations / aliases
    if "james" in safe_id:
        safe_id = "pilot_james"
    elif "barb" in safe_id:
        if "warden" in safe_id:
            safe_id = "warden_barb"
        else:
            safe_id = "barb_the_founder"

    # 1. Try DB first (canonical source of truth)
    try:
        con = _sq.connect(DB_PATH)
        row = con.execute(
            "SELECT avatar_blob, avatar_url FROM persona WHERE user_name = ? OR user_name = ?",
            (safe_id, safe_id)
        ).fetchone()
        con.close()
        
        if row:
            # A. Serve from DB blob if populated
            if row[0]:
                blob_data = row[0]
                if blob_data.startswith('data:'):
                    header, b64 = blob_data.split(',', 1)
                    mime = header.split(':')[1].split(';')[0]
                else:
                    b64 = blob_data
                    mime = 'image/png'
                return Response(content=base64.b64decode(b64), media_type=mime)
            
            # B. Serve from local filesystem path defined in avatar_url if populated
            if row[1]:
                filename = row[1]
                if filename.startswith('/avatars/'):
                    filename = filename.replace('/avatars/', '', 1)
                elif filename.startswith('avatars/'):
                    filename = filename.replace('avatars/', '', 1)
                local_path = os.path.join("/home/james/SovereignOS/avatars", filename)
                if os.path.exists(local_path):
                    return FileResponse(local_path)
    except Exception as e:
        print(f"[persona_image] DB lookup error: {e}")

    # 2. Fall back to direct filesystem search
    for search_dir in [
        "/home/james/SovereignOS/15_FanStack/public/avatars",
        "/home/james/SovereignOS/dna/media/avatars",
        "/home/james/SovereignOS/dna/media/character_maps"
    ]:
        for f in glob.glob(os.path.join(search_dir, f"{safe_id}.*")):
            if f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp')):
                return FileResponse(f)
        # Also check inside a subdirectory matching safe_id
        sub_dir = os.path.join(search_dir, safe_id)
        if os.path.isdir(sub_dir):
            for f in glob.glob(os.path.join(sub_dir, "*")):
                if f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp')) and "avatar" in f.lower():
                    return FileResponse(f)

    raise HTTPException(status_code=404, detail="Image not found")


@fastapi_app.post("/api/persona_image/{persona_id}")
async def upload_persona_image_blob(persona_id: str, file: UploadFile = File(...)):
    """Store avatar as base64 blob in persona.avatar_blob — no filesystem, no rebuild needed."""
    import base64, sqlite3 as _sq
    safe_id = persona_id.lower().replace(" ", "_")
    raw = await file.read()
    mime = file.content_type or 'image/png'
    b64 = base64.b64encode(raw).decode('utf-8')
    data_url = f"data:{mime};base64,{b64}"
    con = _sq.connect(DB_PATH)
    updated = con.execute(
        "UPDATE persona SET avatar_blob = ? WHERE user_name = ? OR user_name = ?",
        (data_url, persona_id, safe_id)
    ).rowcount
    con.commit()
    con.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    return {"status": "success", "user_name": safe_id, "avatar_url": f"/api/persona_image/{safe_id}"}


@fastapi_app.post("/api/chat/upload")
async def upload_chat_image(file: UploadFile = File(...)):
    """Upload a general chat image to public/images and return its web-accessible path."""
    import uuid
    images_dir = "/home/james/SovereignOS/15_FanStack/public/images"
    os.makedirs(images_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename or "")[1] or ".png"
    filename = f"chat_upload_{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(images_dir, filename)
    
    try:
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)
        return {"status": "success", "mediaUrl": f"/images/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@fastapi_app.get("/api/storyboards/projects")
async def get_storyboard_projects():
    projects_dir = "/home/james/SovereignOS/media_vault/02_Projects"
    try:
        if not os.path.exists(projects_dir):
            os.makedirs(projects_dir, exist_ok=True)
        projects = [d for d in os.listdir(projects_dir) if os.path.isdir(os.path.join(projects_dir, d))]
        return {"projects": projects}
    except Exception as e:
        return {"projects": [], "error": str(e)}

from pydantic import BaseModel
import shutil

class TMIAnomaly(BaseModel):
    id: str
    event: str
    time: str
    persona: str
    format: str
    script: str
    prompt: str

@fastapi_app.post("/api/storyboards/create_from_tmi")
async def create_storyboard_from_tmi(anomaly: TMIAnomaly):
    import re
    project_name = re.sub(r'[^a-zA-Z0-9]', '_', anomaly.event) + "_Storyboard"
    project_dir = f"/home/james/SovereignOS/media_vault/02_Projects/{project_name}"
    os.makedirs(project_dir, exist_ok=True)
    
    md_content = f"# Flowmercial: {anomaly.event}\n\n"
    md_content += f"**Persona:** {anomaly.persona}\n"
    md_content += f"**Format:** {anomaly.format}\n\n"
    md_content += f"## ElevenLabs Script\n```text\n{anomaly.script}\n```\n\n"
    md_content += f"## Google Flow Prompt\n```text\n{anomaly.prompt}\n```\n"
    
    with open(os.path.join(project_dir, "FLOW_PROMPTS.md"), "w") as f:
        f.write(md_content)
        
    # Auto-copy persona assets if we have them
    assets_dir = "/home/james/SovereignOS/media_vault/03_Assets/Personas"
    if os.path.exists(assets_dir):
        persona_normalized = anomaly.persona.lower()
        for root, dirs, files in os.walk(assets_dir):
            for file in files:
                if persona_normalized in file.lower() or file.lower().startswith(persona_normalized[:4]):
                    shutil.copy(os.path.join(root, file), os.path.join(project_dir, file))
                    
    return {"status": "success", "project": project_name}

@fastapi_app.get("/api/storyboards")
async def get_storyboards(project: str = "Mets_Twins_Collapse_Storyboard"):
    storyboard_dir = f"/home/james/SovereignOS/media_vault/02_Projects/{project}"
    try:
        if not os.path.exists(storyboard_dir):
            os.makedirs(storyboard_dir, exist_ok=True)
        files = []
        for f in os.listdir(storyboard_dir):
            if f.endswith((".png", ".jpg", ".webp", ".mp4", ".md", ".txt", ".json")):
                files.append({
                    "name": f,
                    "url": f"/media_vault/02_Projects/{project}/{f}",
                    "timestamp": os.path.getmtime(os.path.join(storyboard_dir, f))
                })
        # Sort by modification time
        files.sort(key=lambda x: x["timestamp"], reverse=True)
        return {"artifacts": files}
    except Exception as e:
        return {"artifacts": [], "error": str(e)}

@fastapi_app.websocket("/{path_name:path}")
async def catch_all_websocket(websocket: WebSocket, path_name: str):
    if path_name in ["ws", "ws-relay", "mesh-ws", "mesh-ws-dev", "mesh-ws-uat", "mesh-ws-sandbox"]:
        await websocket.accept()
        async with websockets.connect("ws://127.0.0.1:8008") as remote:
            async def forward_to_remote():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await remote.send(data)
                except:
                    pass

            async def forward_to_client():
                try:
                    async for message in remote:
                        await websocket.send_text(message)
                except:
                    pass

            await asyncio.gather(forward_to_remote(), forward_to_client())
    else:
        await websocket.accept()
        await websocket.close(code=1003)

# NOTE: Explicit /ws handler removed — it was shadowed by the catch_all_websocket
# route above (/{path_name:path}), which handles path_name == "ws" correctly.

# Serve all static files from apiary root 
# MOUNT MOVED TO BOTTOM

async def run_fastapi():
    try:
        config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=8000, log_level="warning")
        server = uvicorn.Server(config)
        await server.serve()
    except Exception as e:
        import traceback
        print(f"FASTAPI STARTUP ERROR: {e}")
        traceback.print_exc()

@fastapi_app.get("/api/mlb/boxscore/{game_pk}")
async def get_mlb_boxscore(game_pk: str):
    import requests
    url = f"https://statsapi.mlb.com/api/v1.1/game/{game_pk}/feed/live"
    try:
        r = requests.get(url, timeout=5)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

fastapi_app.mount("/images", StaticFiles(directory="/home/james/SovereignOS/15_FanStack/public/images"), name="images")
fastapi_app.mount("/", StaticFiles(directory="/home/james/SovereignOS", html=True), name="static")

async def main():
    print("🚀 Sovereign FanCast Relay booting on 0.0.0.0:8008...")
    print("🚀 Sovereign Proxy Server booting on 0.0.0.0:8000 (Serving HTML & /ws)...")
    
    asyncio.create_task(mlb_poller())
    asyncio.create_task(run_fastapi())
    
    async with websockets.serve(handle_client, "0.0.0.0", 8008, ping_interval=None, ping_timeout=None):
         await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
