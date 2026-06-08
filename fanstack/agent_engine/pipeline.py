import asyncio
import sqlite3
import json
import uuid
import time
from pathlib import Path
from datetime import datetime, timezone
from models import get_connection, init_db

class TelemetryIngressRouter:
    """
    Handles async event routing and cross-stadium telemetry bleed.
    Bundles events from multiple game_pks using a sliding temporal context window.
    """
    def __init__(self, db_path=None, window_size_seconds=0.2):
        self.window_size = window_size_seconds
        self.event_queue = asyncio.Queue()
        self.is_running = False
        
    async def ingest_event(self, game_pk: str, event_type: str, speed: float, metadata: dict):
        """Asynchronously ingests a raw StatCast or play telemetry event."""
        event_packet = {
            "sys_id": str(uuid.uuid4()),
            "game_pk": game_pk,
            "event_type": event_type,
            "speed": speed,
            "timestamp": time.time(),
            "payload": metadata
        }
        await self.event_queue.put(event_packet)

    async def start_router(self, dispatch_callback):
        """Starts the main sliding window router loop."""
        self.is_running = True
        print(f"📡 [UAT AGENT ENGINE: pipeline.py] TelemetryIngressRouter started (Window: {self.window_size}s)")
        
        while self.is_running:
            # Wait for the first event to seed the window
            first_event = await self.event_queue.get()
            window_events = [first_event]
            
            # Open sliding window
            await asyncio.sleep(self.window_size)
            
            # Pull any other events that arrived inside this temporal window
            while not self.event_queue.empty():
                window_events.append(self.event_queue.get_nowait())
                
            # Process the temporal bundle (the "Bleed" step)
            await self._process_window_bundle(window_events, dispatch_callback)

    async def _process_window_bundle(self, events: list, dispatch_callback):
        """Bundles events from multiple games, injects cross-stadium bleed indicators, and caches them."""
        # Detect if we have multiple physical games represented in this window
        game_pks_present = {e["game_pk"] for e in events}
        cross_stadium_bleed = len(game_pks_present) > 1
        
        unified_bundle = {
            "bundle_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cross_stadium_bleed_active": cross_stadium_bleed,
            "active_games": list(game_pks_present),
            "events": []
        }
        
        conn = get_connection()
        c = conn.cursor()
        
        for event in events:
            # Inject out-of-market highlights and global tags if it is a major event
            is_highlight = False
            global_event_tag = "STANDARD_PLAY"
            
            if event["event_type"] in ["home_run", "strikeout", "pitch_clock_violation"]:
                is_highlight = True
                global_event_tag = f"CRITICAL_{event['event_type'].upper()}"
                
            event_payload = {
                **event["payload"],
                "is_highlight": is_highlight,
                "global_event_tag": global_event_tag,
                "out_of_market_bleed": cross_stadium_bleed
            }
            
            # Persist to telemetry_cache to shield processing loops (Decoupling)
            c.execute("""
                INSERT INTO telemetry_cache (sys_id, game_pk, event_type, speed, payload)
                VALUES (?, ?, ?, ?, ?);
            """, (
                event["sys_id"], 
                event["game_pk"], 
                event["event_type"], 
                event["speed"], 
                json.dumps(event_payload)
            ))
            
            unified_bundle["events"].append({
                "sys_id": event["sys_id"],
                "game_pk": event["game_pk"],
                "event_type": event["event_type"],
                "speed": event["speed"],
                "injected_metadata": event_payload
            })
            
        conn.commit()
        conn.close()
        
        # Dispatch the enriched bundle to the active state machines
        await dispatch_callback(unified_bundle)

# Mock Data Generator Simulating StatCast Streams
async def mock_statcast_stream(router: TelemetryIngressRouter):
    """Simulates high-velocity, overlapping events arriving simultaneously from 2+ games."""
    print("🎬 [UAT AGENT ENGINE: pipeline.py] Starting Mock StatCast Live Telemetry Stream...")
    
    # Simulate simultaneous pitch clock violation in Philadelphia and Strikeout in Chicago
    print("💥 Overlapping Event Group 1 (Temporal collision):")
    await router.ingest_event(
        game_pk="822816", # Pirates @ Blue Jays
        event_type="pitch_clock_violation",
        speed=0.0,
        metadata={"batter": "Loonie Bin Larry", "pitcher": "Steel City Steve", "description": "Batter stepped out of box late"}
    )
    await router.ingest_event(
        game_pk="824679", # Cubs vs Astros
        event_type="strikeout",
        speed=98.5,
        metadata={"batter": "Orbit Overlord", "pitcher": "Ivy Inspector Ian", "description": "Four-seam fastball on the black"}
    )
    
    # Wait for next window
    await asyncio.sleep(0.5)
    
    # Simulate a single event
    print("⚾ Event Group 2 (Single isolated event):")
    await router.ingest_event(
        game_pk="822816",
        event_type="foul_ball",
        speed=76.2,
        metadata={"batter": "Jolly Roger Rick", "pitcher": "Loonie Bin Larry", "description": "Lazy foul ball into the third base seats"}
    )
    
    await asyncio.sleep(0.5)
    
    # Simulate massive Home Run crash
    print("🔥 Overlapping Event Group 3 (High tension collision):")
    await router.ingest_event(
        game_pk="824679",
        event_type="home_run",
        speed=112.4,
        metadata={"batter": "Space City Sam", "pitcher": "Day Game Drinker", "description": "Absolute moonshot over the ivy"}
    )
    await router.ingest_event(
        game_pk="822816",
        event_type="strikeout",
        speed=84.2,
        metadata={"batter": "Clemente Bridge Carl", "pitcher": "Loonie Bin Larry", "description": "Sweeping slider on 3-2 count"}
    )

if __name__ == "__main__":
    import os
    print("🚀 [UAT AGENT ENGINE: pipeline.py] Bootstrapping router validation...")
    
    # Initialize UAT tables first
    init_db()
    
    router = TelemetryIngressRouter(window_size_seconds=0.1)
    
    received_bundles = []
    
    async def test_dispatcher(bundle):
        print(f"📦 [DISPATCHER] Received enriched bundle: {bundle['bundle_id']}")
        print(f"   Cross-Stadium Bleed Active: {bundle['cross_stadium_bleed_active']}")
        print(f"   Active Games: {bundle['active_games']}")
        print(f"   Event Count: {len(bundle['events'])}")
        for e in bundle["events"]:
            print(f"     - Game {e['game_pk']} | {e['event_type']} ({e['speed']} mph) | Tag: {e['injected_metadata']['global_event_tag']}")
        received_bundles.append(bundle)
        
    async def main():
        # Start router as a background task
        router_task = asyncio.create_task(router.start_router(test_dispatcher))
        
        # Start mock stream simulator
        await mock_statcast_stream(router)
        
        # Let the sliding windows finalize
        await asyncio.sleep(1.0)
        
        # Shutdown
        router.is_running = False
        router_task.cancel()
        
        # Verify correctness (Prove It Works Doctrine)
        print("\n🔬 Validation Check:")
        if len(received_bundles) >= 3:
            print(f"✅ PASS: Ingress router successfully generated {len(received_bundles)} enriched multi-game bundles.")
            # Double check cross stadium bleed mapping
            bleed_found = any(b["cross_stadium_bleed_active"] for b in received_bundles)
            if bleed_found:
                print("✅ PASS: Cross-stadium data bleed successfully detected and tagged.")
            else:
                print("❌ FAIL: Cross-stadium bleed tag not triggered in overlapping windows.")
                os._exit(1)
        else:
            print(f"❌ FAIL: Expected at least 3 bundles, got {len(received_bundles)}")
            os._exit(1)
            
    try:
        asyncio.run(main())
        print("✅ PASS: [pipeline.py] executed successfully with zero errors.")
    except Exception as e:
        print(f"❌ FAIL: [pipeline.py] encountered execution error: {e}")
        os._exit(1)
