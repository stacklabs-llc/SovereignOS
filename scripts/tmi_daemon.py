#!/home/james/SovereignOS/.venv/bin/python3
# tmi_daemon.py — Sovereign OS: TMI Webslinger Telemetry Trigger Daemon
# Connects to the local WebSocket mesh, evaluates Statcast feeds against rules,
# and triggers webslinger overlay / hardware actions dynamically.

import asyncio
import json
import os
import sqlite3
import operator
import websockets
import time
import uuid
from datetime import datetime

WS_URL = "ws://localhost:8008"
DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

# Cache of recently triggered events to prevent multiple triggers for the same state
# Format: "game_pk_rule_id_inning_outs_balls_strikes"
triggered_cache = set()

# Cache of last known scores per game to detect run-scoring events
# Format: game_pk -> (last_away_score, last_home_score)
score_cache = {}

# Helper for comparing operators
def evaluate_condition(current_val, op_str, threshold_val):
    if current_val == "---" or current_val is None:
        return False
        
    try:
        # Convert to floats for numeric comparison if possible
        val_f = float(current_val)
        thresh_f = float(threshold_val)
    except (ValueError, TypeError):
        # Fallback to string comparison
        val_f = str(current_val).strip()
        thresh_f = str(threshold_val).strip()
        
    ops = {
        '>=': operator.ge,
        '<=': operator.le,
        '=': operator.eq,
        '>': operator.gt,
        '<': operator.lt,
    }
    
    if op_str == 'CONTAINS':
        return str(thresh_f).lower() in str(val_f).lower()
        
    if op_str in ops:
        try:
            return ops[op_str](val_f, thresh_f)
        except Exception:
            return False
            
    return False

# Map the telemetry field in database to our payload's keys
def get_telemetry_value(field_name, data):
    f = field_name.lower().strip()
    if 'launch_speed' in f or 'hit_speed' in f:
        return data.get("hit_speed")
    elif 'launch_angle' in f:
        return data.get("launch_angle")
    elif 'hit_distance' in f:
        return data.get("hit_distance")
    elif 'pitch_speed' in f or 'velocity' in f:
        return data.get("pitch_speed")
        
    # Check exact key first
    if field_name in data:
        return data[field_name]
    # Check case-insensitive key matching
    for k, v in data.items():
        if k.lower() == f:
            return v
    return None

async def evaluate_rules(ws, game_pk, event_frame):
    event_type = event_frame.get("event_type", "pitch")
    batting_team = event_frame.get("batting_team", "")
    inning = event_frame.get("inning", "")
    outs = event_frame.get("outs", 0)
    balls = event_frame.get("balls", 0)
    strikes = event_frame.get("strikes", 0)
    
    # 1. Query rules that are active and automated from sys_tmi_telemetry_map
    try:
        con = sqlite3.connect(DB_PATH)
        con.row_factory = sqlite3.Row
        c = con.cursor()
        c.execute("""
            SELECT id, trigger_rule_name, statcast_event_type, telemetry_field, 
                   operator_comparison, comparison_value, batting_team_filter, 
                   target_webslinger_event_id
            FROM sys_tmi_telemetry_map
            WHERE active_status = 1 AND is_automated_ingress = 1
        """)
        rules = [dict(r) for r in c.fetchall()]
        con.close()
    except Exception as e:
        print(f"[TMI DAEMON] DB query error: {e}")
        return

    for rule in rules:
        rule_id = rule["id"]
        rule_event_type = rule["statcast_event_type"]
        rule_team_filter = rule["batting_team_filter"]
        rule_name = rule["trigger_rule_name"]
        
        # A unique key representing this specific rule run on this specific pitch state
        trigger_key = f"{game_pk}_{rule_id}_{inning}_{outs}_{balls}_{strikes}"
        if trigger_key in triggered_cache:
            continue
            
        # 2. Check event type match
        # Normalize: 'home_run' rules match when event is 'home_run'. 'hit' rules match on 'hit' or 'home_run'.
        # 'runs_scored' rules match when runs_scored > 0
        event_match = False
        if rule_event_type in ('runs_scored', 'score'):
            if int(event_frame.get("runs_scored") or 0) > 0:
                event_match = True
        elif rule_event_type == event_type:
            event_match = True
        elif rule_event_type == 'hit' and event_type == 'home_run':
            event_match = True
            
        if not event_match:
            continue

        # 3. Check batting team filter (enforces Mets-only or matching team)
        # Verify team constraints:
        if rule_team_filter and batting_team != rule_team_filter:
            print(f"[TMI DECONSTRUCT] Skipping rule '{rule_name}': event team '{batting_team}' does not match Mets filter '{rule_team_filter}'.")
            # Cache so we don't spam print this skip log on every poll tick for the same pitch
            triggered_cache.add(trigger_key)
            continue
            
        # 4. Extract telemetry value and evaluate condition
        current_val = get_telemetry_value(rule["telemetry_field"], event_frame)
        comparison_op = rule["operator_comparison"]
        threshold_val = rule["comparison_value"]
        if current_val is None or current_val == "---":
            continue
            
        if evaluate_condition(current_val, comparison_op, threshold_val):
            # Condition is met! Let's fetch the template payload
            try:
                con = sqlite3.connect(DB_PATH)
                c = con.cursor()
                c.execute("""
                    SELECT event_name, payload_template 
                    FROM sys_webslinger_event 
                    WHERE id = ?
                """, (rule["target_webslinger_event_id"],))
                row = c.fetchone()
                con.close()
            except Exception as e:
                print(f"[TMI DAEMON] Failed to fetch webslinger event details: {e}")
                continue
                
            if row:
                ws_event_name, payload_template_str = row
                try:
                    payload_data = json.loads(payload_template_str)
                except Exception:
                    payload_data = {}
                    
                print(f"[TMI DAEMON] Rule '{rule_name}' MATCHED! Telemetry value {current_val} {comparison_op} {threshold_val} for {batting_team}.")
                
                # Instantly broadcast linked template across WebSocket mesh
                trigger_msg = {
                    "event": "webslinger_trigger",
                    "event_name": ws_event_name,
                    "room_id": str(game_pk),
                    "data": payload_data
                }
                try:
                    await ws.send(json.dumps(trigger_msg))
                    print(f"[TMI DAEMON] Broadcast webslinger_trigger '{ws_event_name}' to room {game_pk}")
                except Exception as ws_err:
                    print(f"[TMI DAEMON] Failed to send trigger over websocket: {ws_err}")
                
                # Log event to database
                try:
                    event_id = uuid.uuid4().hex
                    triggered_at = datetime.utcnow().isoformat()
                    payload_json = json.dumps({
                        "webslinger_trigger": trigger_msg,
                        "statcast_frame": event_frame
                    })
                    
                    con = sqlite3.connect(DB_PATH)
                    c = con.cursor()
                    c.execute("""
                        INSERT INTO game_tmi_event (
                            id, game_pk, name, description, payload, 
                            icon, triggered, triggered_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        event_id,
                        str(game_pk),
                        ws_event_name,
                        f"Rule '{rule_name}' triggered webslinger event '{ws_event_name}'",
                        payload_json,
                        "webslinger",
                        1,
                        triggered_at
                    ))
                    con.commit()
                    con.close()
                    print(f"[TMI DAEMON] Logged webslinger trigger to game_tmi_event table (ID: {event_id})")
                except Exception as db_err:
                    print(f"[TMI DAEMON] Failed to log webslinger trigger to database: {db_err}")
                
                # Mark as triggered in cache
                triggered_cache.add(trigger_key)

async def main_loop():
    print("🤖 Sovereign OS TMI Telemetry Daemon booting...")
    print(f"[*] Target DB: {DB_PATH}")
    print(f"[*] Target WS: {WS_URL}")
    
    while True:
        try:
            async with websockets.connect(WS_URL) as ws:
                print("[✔] Connected to Sovereign WebSocket Relay.")
                
                # Join the global pool
                join_msg = {"type": "JOIN_ROOM", "room_id": "GLOBAL"}
                await ws.send(json.dumps(join_msg))
                
                async for message in ws:
                    try:
                        data = json.loads(message)
                    except Exception:
                        continue
                        
                    if data.get("type") == "STATE_UPDATE":
                        event_frame = data.get("data", {})
                        game_pk = data.get("target_game_pk")
                        if event_frame and game_pk:
                            # Extract scores
                            away_score = 0
                            home_score = 0
                            try:
                                away_score = int(event_frame.get("away_score") or 0)
                            except (ValueError, TypeError):
                                pass
                            try:
                                home_score = int(event_frame.get("home_score") or 0)
                            except (ValueError, TypeError):
                                pass
                            
                            runs_scored = 0
                            if game_pk in score_cache:
                                prev_away, prev_home = score_cache[game_pk]
                                batting_team = event_frame.get("batting_team", "")
                                away_team = event_frame.get("away_team", "")
                                home_team = event_frame.get("home_team", "")
                                
                                # If batting team matches away or home, check if they scored
                                if batting_team and batting_team == away_team:
                                    runs_scored = max(0, away_score - prev_away)
                                elif batting_team and batting_team == home_team:
                                    runs_scored = max(0, home_score - prev_home)
                                else:
                                    # Fallback: sum of both scores
                                    runs_scored = max(0, (away_score + home_score) - (prev_away + prev_home))
                            
                            # Update cache
                            score_cache[game_pk] = (away_score, home_score)
                            
                            # Inject runs_scored
                            event_frame["runs_scored"] = runs_scored
                            
                            await evaluate_rules(ws, game_pk, event_frame)
                            
        except (websockets.exceptions.ConnectionClosedError, OSError) as e:
            print(f"[!] WebSocket disconnected or connection failed: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"[ERROR] Daemon crash: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("[*] Daemon shut down by user.")
