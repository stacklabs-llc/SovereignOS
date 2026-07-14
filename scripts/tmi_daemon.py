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

# Rate-limiting state for momentum triggers (game_pk -> timestamp)
last_momentum_trigger = {}

# State for tracking no-hitter tension trigger (game_pk -> bool)
no_hitter_tension_triggered = {}

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

MAM_DB_PATH = "/home/james/SovereignOS/dna/mam_warehouse.db"

# Helpers for dynamic logic evaluation
def resolve_var(var_path, data):
    parts = var_path.split('.')
    curr = data
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        elif isinstance(curr, dict):
            # Check case-insensitive key
            matched = False
            for k, v in curr.items():
                if k.lower() == p.lower():
                    curr = v
                    matched = True
                    break
            if not matched:
                return None
        else:
            return None
    return curr

def evaluate_json_node(node, data):
    if not isinstance(node, dict):
        return bool(node)
        
    if "and" in node:
        return all(evaluate_json_node(item, data) for item in node["and"])
    if "or" in node:
        return any(evaluate_json_node(item, data) for item in node["or"])
        
    for op, args in node.items():
        if op in (">", "<", ">=", "<=", "==", "!=", "contains", "CONTAINS"):
            if not isinstance(args, list) or len(args) != 2:
                continue
            lhs, rhs = args[0], args[1]
            
            # Resolve LHS
            if isinstance(lhs, dict) and "var" in lhs:
                lhs_val = resolve_var(lhs["var"], data)
            else:
                lhs_val = lhs
                
            # Resolve RHS
            if isinstance(rhs, dict) and "var" in rhs:
                rhs_val = resolve_var(rhs["var"], data)
            else:
                rhs_val = rhs
                
            return evaluate_condition(lhs_val, op.upper() if op.lower() == "contains" else op, rhs_val)
            
    return False

import re
def evaluate_string_condition(cond_str, data):
    cond_str = cond_str.strip()
    m = re.match(r"^([a-zA-Z0-9_\.]+)\s*(>=|<=|>|<|=|contains|CONTAINS)\s*(.+)$", cond_str, re.IGNORECASE)
    if not m:
        return False
    var_path, op_str, val_str = m.groups()
    val_str = val_str.strip().strip("'\"")
    lhs_val = resolve_var(var_path, data)
    return evaluate_condition(lhs_val, op_str.upper(), val_str)

def check_hits_in_db(game_pk):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM game_play WHERE game_pk = ? AND event_type = 'hit'", (str(game_pk),))
        count = c.fetchone()[0]
        conn.close()
        return count > 0
    except Exception as e:
        print(f"[TMI DAEMON] Error checking hits in DB: {e}")
        return False

def get_matching_asset(target_asset_type):
    if not os.path.exists(MAM_DB_PATH):
        return None
    try:
        conn = sqlite3.connect(MAM_DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT * FROM media_assets 
            WHERE mime_type LIKE ? OR file_path LIKE ? 
            ORDER BY created_at DESC LIMIT 1
        """, (f"%{target_asset_type}%", f"%{target_asset_type}%"))
        row = c.fetchone()
        
        # Fallback to any recent asset if none matched specifically
        if not row:
            c.execute("SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 1")
            row = c.fetchone()
            
        if row:
            asset_dict = dict(row)
            metadata_rows = c.execute(
                "SELECT key, value FROM asset_metadata WHERE asset_id = ?", 
                (asset_dict["asset_id"],)
            ).fetchall()
            meta = {}
            for r in metadata_rows:
                try:
                    meta[r["key"]] = json.loads(r["value"])
                except Exception:
                    meta[r["key"]] = r["value"]
            asset_dict["metadata"] = meta
            conn.close()
            return asset_dict
        conn.close()
    except Exception as e:
        print(f"[TMI DAEMON] Error matching asset: {e}")
    return None

async def evaluate_rules(ws, game_pk, event_frame):
    event_type = event_frame.get("event_type", "pitch")
    batting_team = event_frame.get("batting_team", "")
    inning = event_frame.get("inning", "")
    outs = event_frame.get("outs", 0)
    balls = event_frame.get("balls", 0)
    strikes = event_frame.get("strikes", 0)
    
    # A. Evaluate Legacy Rules from sys_tmi_telemetry_map
    legacy_rules = []
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
        legacy_rules = [dict(r) for r in c.fetchall()]
        con.close()
    except Exception as e:
        print(f"[TMI DAEMON] Legacy DB query error: {e}")

    for rule in legacy_rules:
        rule_id = rule["id"]
        rule_event_type = rule["statcast_event_type"]
        rule_team_filter = rule["batting_team_filter"]
        rule_name = rule["trigger_rule_name"]
        
        trigger_key = f"{game_pk}_{rule_id}_{inning}_{outs}_{balls}_{strikes}"
        if trigger_key in triggered_cache:
            continue
            
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

        if rule_team_filter and batting_team != rule_team_filter:
            triggered_cache.add(trigger_key)
            continue
            
        current_val = get_telemetry_value(rule["telemetry_field"], event_frame)
        comparison_op = rule["operator_comparison"]
        threshold_val = rule["comparison_value"]
        if current_val is None or current_val == "---":
            continue
            
        if evaluate_condition(current_val, comparison_op, threshold_val):
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
                except Exception as db_err:
                    print(f"[TMI DAEMON] Failed to log webslinger trigger to database: {db_err}")
                
                triggered_cache.add(trigger_key)

    # B. Evaluate Unified MAM Rules from mam_warehouse.db
    mam_rules = []
    if os.path.exists(MAM_DB_PATH):
        try:
            conn = sqlite3.connect(MAM_DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("""
                SELECT rule_id, condition, conditions_json, action, target_asset_type
                FROM tmi_rules
                WHERE active_status = 1
            """)
            mam_rules = [dict(r) for r in c.fetchall()]
            conn.close()
        except Exception as e:
            print(f"[TMI DAEMON] MAM DB query error: {e}")

    for rule in mam_rules:
        rule_id = rule["rule_id"]
        action = rule["action"]
        target_asset_type = rule["target_asset_type"]
        
        trigger_key = f"{game_pk}_mam_{rule_id}_{inning}_{outs}_{balls}_{strikes}"
        if trigger_key in triggered_cache:
            continue
            
        matched = False
        if rule.get("conditions_json"):
            try:
                node = json.loads(rule["conditions_json"])
                matched = evaluate_json_node(node, event_frame)
            except Exception as le:
                print(f"[TMI DAEMON] Error parsing/evaluating JSON Logic: {le}")
        
        if not matched and rule.get("condition"):
            try:
                matched = evaluate_string_condition(rule["condition"], event_frame)
            except Exception as se:
                print(f"[TMI DAEMON] Error parsing/evaluating string condition: {se}")
                
        if matched:
            print(f"[TMI DAEMON] MAM Rule '{rule_id}' MATCHED!")
            asset = get_matching_asset(target_asset_type)
            
            asset_id = asset["asset_id"] if asset else None
            file_path = asset["file_path"] if asset else None
            mime_type = asset["mime_type"] if asset else None
            metadata = asset["metadata"] if asset else {}
            
            trigger_msg = {
                "event": "media_trigger",
                "room_id": str(game_pk),
                "data": {
                    "rule_id": rule_id,
                    "action": action,
                    "asset_id": asset_id,
                    "file_path": file_path,
                    "mime_type": mime_type,
                    "metadata": metadata
                }
            }
            try:
                await ws.send(json.dumps(trigger_msg))
                print(f"[TMI DAEMON] Broadcast media_trigger to room {game_pk} for asset {asset_id}")
            except Exception as ws_err:
                print(f"[TMI DAEMON] Failed to send media_trigger: {ws_err}")
                
            try:
                event_id = uuid.uuid4().hex
                triggered_at = datetime.utcnow().isoformat()
                payload_json = json.dumps({
                    "media_trigger": trigger_msg,
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
                    f"MAM Rule {rule_id}",
                    f"MAM Rule '{rule_id}' triggered media action '{action}' on asset '{asset_id}'",
                    payload_json,
                    "media",
                    1,
                    triggered_at
                ))
                con.commit()
                con.close()
            except Exception as db_err:
                print(f"[TMI DAEMON] Failed to log media trigger: {db_err}")
                
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
                            
                            # --- Custom Evaluation WO-2026-117: Sudden Momentum Shift ---
                            event_type = event_frame.get("event_type")
                            delta_score = event_frame.get("delta_score")
                            try:
                                if delta_score is not None:
                                    delta_score = int(delta_score)
                                else:
                                    delta_score = runs_scored
                            except (ValueError, TypeError):
                                delta_score = runs_scored

                            inning_half = event_frame.get("inning_half") or event_frame.get("half") or ""
                            if inning_half:
                                inning_half = inning_half.lower()

                            if event_type == "scoring" and delta_score >= 3 and "bot" in inning_half:
                                current_time = time.time()
                                last_trigger = last_momentum_trigger.get(str(game_pk), 0)
                                if current_time - last_trigger >= 600:
                                    last_momentum_trigger[str(game_pk)] = current_time
                                    asset = get_matching_asset("RALLY_SKELETON_DANCE")
                                    trigger_msg = {
                                        "event": "media_trigger",
                                        "room_id": str(game_pk),
                                        "data": {
                                            "rule_id": "rule_momentum_shift",
                                            "action": "overlay_play",
                                            "asset_id": asset["asset_id"] if asset else "RALLY_SKELETON_DANCE",
                                            "file_path": asset["file_path"] if asset else "/production/assets/sprint4/[PROCESSED]_RALLY_SKELETON_DANCE.mp4",
                                            "mime_type": "video/mp4",
                                            "metadata": {}
                                        }
                                    }
                                    await ws.send(json.dumps(trigger_msg))
                                    print(f"[TMI DAEMON] Momentum shift matched. Sent media_trigger for RALLY_SKELETON_DANCE")

                            # --- Custom Evaluation WO-2026-119: No-Hitter Tension Gradient ---
                            inning_str = event_frame.get("inning", "1")
                            try:
                                inning_num = int(re.sub(r'\D', '', str(inning_str)))
                            except (ValueError, TypeError):
                                inning_num = 1

                            hit_occurred = check_hits_in_db(game_pk) or (event_type == "hit")
                            if hit_occurred:
                                if no_hitter_tension_triggered.get(str(game_pk), False):
                                    no_hitter_tension_triggered[str(game_pk)] = False
                                    trigger_msg = {
                                        "event": "media_trigger",
                                        "room_id": str(game_pk),
                                        "data": {
                                            "rule_id": "rule_no_hitter_tension",
                                            "action": "shader_tension_clear",
                                            "asset_id": None,
                                            "file_path": None,
                                            "mime_type": None,
                                            "metadata": {}
                                        }
                                    }
                                    await ws.send(json.dumps(trigger_msg))
                                    print(f"[TMI DAEMON] No-hitter broken! Deactivating level 3 tension shader.")
                            elif inning_num >= 7:
                                if not no_hitter_tension_triggered.get(str(game_pk), False):
                                    no_hitter_tension_triggered[str(game_pk)] = True
                                    asset = get_matching_asset("LEVEL_3_TENSION")
                                    trigger_msg = {
                                        "event": "media_trigger",
                                        "room_id": str(game_pk),
                                        "data": {
                                            "rule_id": "rule_no_hitter_tension",
                                            "action": "shader_tension_level_3",
                                            "asset_id": asset["asset_id"] if asset else "LEVEL_3_TENSION",
                                            "file_path": asset["file_path"] if asset else "/production/assets/sprint4/[PROCESSED]_LEVEL_3_TENSION.mp4",
                                            "mime_type": "video/mp4",
                                            "metadata": {}
                                        }
                                    }
                                    await ws.send(json.dumps(trigger_msg))
                                    print(f"[TMI DAEMON] Potential no-hitter in inning {inning_num}! Activating level 3 tension shader.")

                    # --- Custom Evaluation WO-2026-118: Umpire Review Handler ---
                    msg_type = data.get("type")
                    if msg_type == "official_review_start":
                        game_pk = data.get("target_game_pk") or data.get("game_pk")
                        if game_pk:
                            asset = get_matching_asset("REVIEW_IN_PROGRESS")
                            trigger_msg = {
                                "event": "media_trigger",
                                "room_id": str(game_pk),
                                "data": {
                                    "rule_id": "rule_umpire_review",
                                    "action": "overlay_loop",
                                    "asset_id": asset["asset_id"] if asset else "REVIEW_IN_PROGRESS",
                                    "file_path": asset["file_path"] if asset else "/production/assets/sprint4/[PROCESSED]_REVIEW_IN_PROGRESS.mp4",
                                    "mime_type": "video/mp4",
                                    "metadata": {}
                                }
                            }
                            await ws.send(json.dumps(trigger_msg))
                            print(f"[TMI DAEMON] Official review started. Sent media_trigger for REVIEW_IN_PROGRESS")
                            
                    elif msg_type in ["official_review_end", "official_review_override", "official_review_clear"]:
                        game_pk = data.get("target_game_pk") or data.get("game_pk")
                        if game_pk:
                            trigger_msg = {
                                "event": "media_trigger",
                                "room_id": str(game_pk),
                                "data": {
                                    "rule_id": "rule_umpire_review",
                                    "action": "overlay_clear",
                                    "asset_id": None,
                                    "file_path": None,
                                    "mime_type": None,
                                    "metadata": {}
                                }
                            }
                            await ws.send(json.dumps(trigger_msg))
                            print(f"[TMI DAEMON] Official review ended/cleared. Sent media_clear")

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
