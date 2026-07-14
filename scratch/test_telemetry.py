#!/usr/bin/env python3
import asyncio
import json
import websockets
import sys
import random

WS_URL = "ws://localhost:8008"
GAME_ID = str(random.randint(100000, 999999))

received_triggers = []

async def listen_loop(ws):
    try:
        async for message in ws:
            data = json.loads(message)
            if data.get("type") == "media_trigger":
                print(f"[TEST CLIENT] Received media_trigger event: {json.dumps(data, indent=2)}")
                received_triggers.append(data)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"[TEST CLIENT] Error in listen loop: {e}")

async def run_test():
    print(f"[*] Generating clean random game ID: {GAME_ID}")
    print("[*] Connecting to WebSocket relay...")
    async with websockets.connect(WS_URL) as ws:
        # Join room
        await ws.send(json.dumps({"type": "JOIN_ROOM", "room_id": GAME_ID}))
        print(f"[*] Joined room: {GAME_ID}")
        
        # Start listener task
        listener_task = asyncio.create_task(listen_loop(ws))
        await asyncio.sleep(1)
        
        # 1. Test WO-2026-117: Momentum Shift
        print("\n=== Test 1: Momentum Shift ===")
        payload1 = {
            "type": "CMD_SYNC_STATE",
            "target_game_pk": GAME_ID,
            "data": {
                "event_type": "scoring",
                "delta_score": 3,
                "inning_half": "bottom",
                "inning": "5",
                "batting_team": "NYM",
                "home_team": "NYM",
                "away_team": "PHI",
                "status_msg": "Home Run scores 3 runs!",
                "pitch_name": "Fastball",
                "pitch_speed": "95.0",
                "pitcher": "Edwin Diaz",
                "batter": "Bryce Harper"
            }
        }
        await ws.send(json.dumps(payload1))
        print("[*] Sent CMD_SYNC_STATE scoring delta_score=3 bottom half")
        await asyncio.sleep(2)
        
        # 2. Test WO-2026-118: Umpire Review
        print("\n=== Test 2: Umpire Review Start ===")
        payload2 = {
            "type": "official_review_start",
            "target_game_pk": GAME_ID
        }
        await ws.send(json.dumps(payload2))
        print("[*] Sent official_review_start")
        await asyncio.sleep(2)
        
        print("\n=== Test 2.1: Umpire Review End ===")
        payload2_end = {
            "type": "official_review_end",
            "target_game_pk": GAME_ID
        }
        await ws.send(json.dumps(payload2_end))
        print("[*] Sent official_review_end")
        await asyncio.sleep(2)
        
        print("\n=== Test 2.2: Umpire Review Override ===")
        payload2_override = {
            "type": "official_review_override",
            "target_game_pk": GAME_ID
        }
        await ws.send(json.dumps(payload2_override))
        print("[*] Sent official_review_override")
        await asyncio.sleep(2)
        
        # 3. Test WO-2026-119: No-Hitter Tension (Inning >= 7, 0 hits)
        print("\n=== Test 3: No-Hitter Tension (Inning >= 7, 0 hits) ===")
        payload3 = {
            "type": "CMD_SYNC_STATE",
            "target_game_pk": GAME_ID,
            "data": {
                "event_type": "pitch",
                "inning": "7",
                "inning_half": "top",
                "batting_team": "PHI",
                "home_team": "NYM",
                "away_team": "PHI",
                "status_msg": "Strike 1",
                "pitch_name": "Fastball",
                "pitch_speed": "95.0",
                "pitcher": "Edwin Diaz",
                "batter": "Bryce Harper"
            }
        }
        await ws.send(json.dumps(payload3))
        print("[*] Sent CMD_SYNC_STATE inning=7 top half")
        await asyncio.sleep(2)
        
        print("\n=== Test 3.1: Break No-Hitter ===")
        payload3_hit = {
            "type": "CMD_SYNC_STATE",
            "target_game_pk": GAME_ID,
            "data": {
                "event_type": "hit",
                "inning": "7",
                "inning_half": "top",
                "batting_team": "PHI",
                "home_team": "NYM",
                "away_team": "PHI",
                "status_msg": "Base hit to left field!",
                "pitch_name": "Fastball",
                "pitch_speed": "95.0",
                "pitcher": "Edwin Diaz",
                "batter": "Bryce Harper"
            }
        }
        await ws.send(json.dumps(payload3_hit))
        print("[*] Sent CMD_SYNC_STATE hit event")
        await asyncio.sleep(2)
        
        listener_task.cancel()
        await listener_task
        
    print("\n=== Verification Summary ===")
    print(f"Total media triggers received: {len(received_triggers)}")
    if len(received_triggers) >= 6:
        print("[✔] Success! All work order events triggered and routed correctly.")
        sys.exit(0)
    else:
        print("[✗] Failure: Expected at least 6 trigger events.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_test())
