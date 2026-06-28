import asyncio
import websockets
import json
import time
import random

# The Ground Truth for Thursday 2025 Masters (Static State)
STATIC_LEADERBOARD = [
    {"name": "Justin Rose", "score": -7, "thru": "F"},
    {"name": "Scottie Scheffler", "score": -4, "thru": "F"},
    {"name": "Corey Conners", "score": -4, "thru": "F"},
    {"name": "Ludvig Åberg", "score": -4, "thru": "F"},
    {"name": "Bryson DeChambeau", "score": -3, "thru": "F"},
    {"name": "Rory McIlroy", "score": 0, "thru": "F"}
]

# The Drifter Initial State (Back 9 Surge)
drifter_state = {
    "score": 4, 
    "thru": 9,
    "last_tick": time.time()
}

DRIFTER_LORE_MESSAGES = [
    "The Scrambler (R. 'Range' Mac) just hit a 280-yard drive off a discarded beer can on Hole 10.",
    "Unbelievable. The Scrambler shanked it into the pine straw, then blasted a recovery shot onto the green with a rusty 2-iron.",
    "The Scrambler is smoking a cigarette while reading the break on the 12th green. Pure disregard for Augusta decorum.",
    "A massive roar from the gallery! The Scrambler holed out from the bunker on 14!",
    "The Scrambler's caddie just snapped his 7-iron over his knee. The tension is thick.",
    "The Scrambler appears to be using a rusty wedge he found in a parking lot... and he just stuck it to 3 feet."
]

async def poll_and_broadcast():
    uri = "ws://127.0.0.1:8009"
    
    last_leaderboard_str = ""
    last_status = ""
    
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print("Connected to Masters Relay (SIMULATION MODE)...")
                while True:
                    # Tick Simulation
                    now = time.time()
                    
                    # Pause Lock Mechanism
                    import os
                    if os.path.exists("/tmp/masters_sim.paused"):
                        drifter_state["last_tick"] = now # Prevent massive time jump upon unpausing
                        drifter_shot_text = ""
                        dt = 0
                    else:
                        dt = now - drifter_state["last_tick"]
                        drifter_shot_text = ""
                        
                        if dt > 30: # 30 seconds for faster testing (instead of 60)
                            drifter_state["last_tick"] = now
                            if drifter_state["thru"] < 18:
                                rand_val = random.random()
                                if rand_val < 0.35:
                                    drifter_state["score"] -= 1 # Birdie
                                    drifter_shot_text = random.choice(DRIFTER_LORE_MESSAGES)
                                elif rand_val < 0.45:
                                    # Node .172 Breach Event! (10% chance)
                                    drifter_shot_text = "🚨 PLAY HALTED 🚨 Node .172 (Biological Asset 'Sam') has breached the 13th green! The one-brain-cell entity is currently playing with Scottie's ball!"
                                elif rand_val < 0.60:
                                    drifter_state["score"] += 1 # Bogey
                                    drifter_shot_text = "The Scrambler just shanked one directly into the Heritage Azaleas. Coach Shrubbs is sweating profusely and tapping out for Cap Peterson!"
                                # He always advances a hole unless he's at 18
                                drifter_state["thru"] += 1

                    # Build Top Players List
                    top_players = []
                    
                    # Inject The Drifter into Top Players list
                    ds = drifter_state["score"]
                    ds_str = "E" if ds == 0 else (f"+{ds}" if ds > 0 else f"{ds}")
                    drifter_lbl = f"The Scrambler ({ds_str}) Thru {drifter_state['thru']}"
                    top_players.append(drifter_lbl) # Position 1
                    
                    for p in STATIC_LEADERBOARD:
                        ps = p["score"]
                        ps_str = "E" if ps == 0 else (f"+{ps}" if ps > 0 else f"{ps}")
                        top_players.append(f"{p['name']} ({ps_str}) Thru {p['thru']}")
                    
                    leaderboard_str = " | ".join(top_players)
                    name_event = "The Masters (2025 Sim)"
                    status_msg = "Round 1 (Thursday)"
                    
                    if drifter_shot_text:
                        status_msg = drifter_shot_text
                    else:
                        if random.random() < 0.15:
                            status_msg = "Replay: Rory McIlroy double-bogeys 17 after a brutal three-putt. SlopeMatrix is analyzing the break."
                        
                    if leaderboard_str != last_leaderboard_str or status_msg != last_status:
                        print(f"Update: {status_msg} - {leaderboard_str[:60]}...")
                        last_leaderboard_str = leaderboard_str
                        last_status = status_msg
                        
                        payload = {
                            "type": "CMD_SYNC_STATE",
                            "data": {
                                "status_msg": f"{name_event}: {status_msg}",
                                "leaderboard": top_players,
                                "event_name": name_event,
                                "event_status": status_msg,
                                "boggs_level": 2
                            }
                        }
                        await websocket.send(json.dumps(payload))
                        
                        if drifter_shot_text and "Node .172" in drifter_shot_text:
                            sam_payload = {
                                "type": "GOPHER_SIGHTING",
                                "event": "BIOLOGICAL_BREACH",
                                "image_url": "http://192.168.1.73:5174/sam.jpg"
                            }
                            await websocket.send(json.dumps(sam_payload))
                            print("🐈 BIOLOGICAL BREACH: Node .172 Payload Sent!")
                        elif drifter_shot_text and "Heritage Azaleas" in drifter_shot_text:
                            commercial_payload = {
                                "type": "trigger_event",
                                "event": "COMMERCIAL_BREAK",
                                "video_url": "http://192.168.1.73:8001/dna/media/masters/flowmercials/bent_carrot_flowmercial.mp4"
                            }
                            await websocket.send(json.dumps(commercial_payload))
                            print("📺 FLOWMERCIAL TRIGGERED: Peyronie's Disease Overlay sent to Butler Cabin!")
                        
                    await asyncio.sleep(15)
        except websockets.exceptions.ConnectionClosedError:
            print("Connection to Relay lost. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Poller Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    print("🚀 Masters Offline Simulator (Thursday 2025) starting...")
    asyncio.run(poll_and_broadcast())
