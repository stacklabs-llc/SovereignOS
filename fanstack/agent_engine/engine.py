import sqlite3
import json
import uuid
import asyncio
from pathlib import Path
from models import get_connection, init_db

class AgentEngine:
    """
    State machine coordinator tracking persona emotional tension scores,
    shared cultural relics, and executing rhetorical divergence triggers.
    """
    def __init__(self):
        # Local memory fallback to avoid empty returns
        self.cached_relics = {}
        
    def _bootstrap_agents_and_relics(self, conn):
        """Initializes default agents and cultural relics in the DB if not present."""
        c = conn.cursor()
        
        # Default active personas mapped to UAT engine
        default_agents = [
            ("barf", "NYM", 2.1, 0.0, 0.0, 1.2),
            ("7_train_terry", "NYM", 0.0, 3.4, 0.0, 1.8),
            ("battery_chucker_jr", "PHI", 0.0, 0.0, 0.0, 2.5),
            ("bendix_burnout", "MIA", 0.0, 0.0, 4.2, 0.8)
        ]
        
        for name, team, ip, tf, ad, tension in default_agents:
            c.execute("""
                INSERT OR IGNORE INTO sim_agents (sys_id, persona_name, team, injury_paranoia, transit_fatalism, asset_depreciation, tension)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (str(uuid.uuid4()), name, team, ip, tf, ad, tension))
            
        # Default cultural relics in CMDB
        default_relics = [
            ("home_run_sculpture", "Operational", 8.4, "Miami's mechanical neon monstrosity of unbridled joy."),
            ("citi_field_apple", "Staged", 9.1, "The legendary big plastic apple representing Queens anxiety.")
        ]
        
        for name, status, val, context in default_relics:
            c.execute("""
                INSERT OR IGNORE INTO cultural_relics (sys_id, relic_name, current_status, ideological_value, last_context)
                VALUES (?, ?, ?, ?, ?);
            """, (str(uuid.uuid4()), name, status, val, context))
            
        conn.commit()

    def get_agent_state(self, persona_name: str) -> dict:
        """Retrieves tension and trauma metrics for a persona from DB."""
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT injury_paranoia, transit_fatalism, asset_depreciation, tension 
            FROM sim_agents WHERE persona_name = ?;
        """, (persona_name,))
        row = c.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return {"injury_paranoia": 0.0, "transit_fatalism": 0.0, "asset_depreciation": 0.0, "tension": 0.0}

    def update_agent_state(self, persona_name: str, updates: dict):
        """Persists updated emotional metrics to the SQLite store."""
        conn = get_connection()
        c = conn.cursor()
        
        fields = []
        values = []
        for k, v in updates.items():
            fields.append(f"{k} = ?")
            values.append(v)
        values.append(persona_name)
        
        query = f"UPDATE sim_agents SET {', '.join(fields)}, sys_updated_on = CURRENT_TIMESTAMP WHERE persona_name = ?;"
        c.execute(query, tuple(values))
        conn.commit()
        conn.close()

    def get_cultural_relic(self, relic_name: str) -> dict:
        """Queries the database for historical and cultural callbacks."""
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT current_status, ideological_value, last_context FROM cultural_relics WHERE relic_name = ?;", (relic_name,))
        row = c.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {"current_status": "Unknown", "ideological_value": 0.0, "last_context": "None"}

    async def process_telemetry_bundle(self, bundle: dict):
        """Processes a bundled temporal payload, firing trigger matrices per persona."""
        print(f"\n⚙️ [UAT AGENT ENGINE: engine.py] Coordinating bundle {bundle['bundle_id']}...")
        
        conn = get_connection()
        self._bootstrap_agents_and_relics(conn)
        conn.close()
        
        for event in bundle["events"]:
            event_type = event["event_type"]
            speed = event["speed"]
            metadata = event["injected_metadata"]
            
            # Enforce rigid rhetorical divergence - zero homogenization loops
            await self._evaluate_divergence(event_type, speed, metadata)

    async def _evaluate_divergence(self, event_type: str, speed: float, metadata: dict):
        """Evaluates how each persona uniquely experiences and broadcasts the play event."""
        
        # 1. BARF (Injury Paranoia & Doom Recursion)
        barf_state = self.get_agent_state("barf")
        if event_type == "foul_ball" and speed < 80.0:
            barf_state["injury_paranoia"] += 1.2
            barf_state["tension"] = min(10.0, barf_state["tension"] + 0.8)
            self.update_agent_state("barf", barf_state)
            
            print(f"🤖 [RHETORICAL OUT: barf] (Tension: {barf_state['tension']:.1f})")
            print("   \"This sub-80mph pitch speed is a terrifying indicator. That exit velocity indicates soft-tissue ")
            print("    calf vulnerability on the pivot. Mark my words, the ligament integrity is structurally compromised.")
            print("    We are entering a classic Wilpon-era regression loop. Absolutely doomed!\"")
            
        elif event_type == "strikeout":
            barf_state["tension"] = min(10.0, barf_state["tension"] + 1.5)
            self.update_agent_state("barf", barf_state)
            
            print(f"🤖 [RHETORICAL OUT: barf] (Tension: {barf_state['tension']:.1f})")
            print("   \"Another empty swing. Sunk-cost trauma fully active. I can physically feel the ghost ")
            print("    of ancient Mets contract negotiations weighing down this batter's hands. Pain is inevitable.\"")

        # 2. 7_TRAIN_TERRY (Transit Fatalism & Infrastructure Decay)
        terry_state = self.get_agent_state("7_train_terry")
        if event_type == "pitch_clock_violation":
            terry_state["transit_fatalism"] += 1.5
            terry_state["tension"] = min(10.0, terry_state["tension"] + 1.1)
            self.update_agent_state("7_train_terry", terry_state)
            
            print(f"🤖 [RHETORICAL OUT: 7_train_terry] (Tension: {terry_state['tension']:.1f})")
            print("   \"A pitch clock violation! A direct, systemic breakdown of scheduling flow! This is exactly ")
            print("    like the crumbling signal boards on the Queensboro plaza local line. If the transit system ")
            print("    can't hold a schedule, how can a pitcher? The infrastructure is rotting underneath us!\"")

        # 3. BATTERY_CHUCKER_JR (Defiance & Unregulated Voltage)
        chucker_state = self.get_agent_state("battery_chucker_jr")
        if event_type == "foul_ball":
            chucker_state["tension"] = min(10.0, chucker_state["tension"] + 1.0)
            self.update_agent_state("battery_chucker_jr", chucker_state)
            
            print(f"🤖 [RHETORICAL OUT: battery_chucker_jr] (Tension: {chucker_state['tension']:.1f})")
            print("   \"Why are we letting them collect souvenirs? Throw that foul ball right back onto the field! ")
            print("    The ballpark police are probably watching, but corporate capital doesn't own our energy! ")
            print("    Escalate the voltage! Throw it back!\"")

        # 4. BENDIX_BURNOUT (Asset Depreciation & Ledger Optimization)
        bendix_state = self.get_agent_state("bendix_burnout")
        if event_type == "home_run":
            bendix_state["asset_depreciation"] += 1.8
            bendix_state["tension"] = min(10.0, bendix_state["tension"] + 1.4)
            self.update_agent_state("bendix_burnout", bendix_state)
            
            # Fetch cultural relic "home_run_sculpture" for shared mythology callback
            relic = self.get_cultural_relic("home_run_sculpture")
            
            print(f"🤖 [RHETORICAL OUT: bendix_burnout] (Tension: {bendix_state['tension']:.1f})")
            print("   \"A home run represents a catastrophic ledger depreciation event. The cost-per-WAR of this ")
            print(f"    pitch sequence has plummeted. Furthermore, the Miami Home Run Sculpture is currently {relic['current_status']} ")
            print(f"    (Ideological Value: {relic['ideological_value']:.1f}). A tragic misuse of mechanical capital. ")
            print("    Write down the entire inning as a structural tax loss.\"")

if __name__ == "__main__":
    print("🚀 [UAT AGENT ENGINE: engine.py] Bootstrapping state machine validation...")
    
    # Initialize UAT tables
    init_db()
    
    engine = AgentEngine()
    
    # Mock bundled telemetry package (Temporal collision matching Spec)
    mock_bundle = {
        "bundle_id": str(uuid.uuid4()),
        "cross_stadium_bleed_active": True,
        "events": [
            {
                "event_type": "foul_ball",
                "speed": 74.5,
                "injected_metadata": {"global_event_tag": "STANDARD_PLAY"}
            },
            {
                "event_type": "pitch_clock_violation",
                "speed": 0.0,
                "injected_metadata": {"global_event_tag": "CRITICAL_PITCH_CLOCK_VIOLATION"}
            },
            {
                "event_type": "home_run",
                "speed": 109.8,
                "injected_metadata": {"global_event_tag": "CRITICAL_HOME_RUN"}
            }
        ]
    }
    
    async def main():
        # Process the simulated StatCast bundle
        await engine.process_telemetry_bundle(mock_bundle)
        
        # Verify changes in SQLite
        print("\n🔬 Validation Check:")
        barf_res = engine.get_agent_state("barf")
        terry_res = engine.get_agent_state("7_train_terry")
        bendix_res = engine.get_agent_state("bendix_burnout")
        
        print(f"   Barf Tension State: {barf_res['tension']:.1f} | Paranoia: {barf_res['injury_paranoia']:.1f}")
        print(f"   Terry Tension State: {terry_res['tension']:.1f} | Transit Fatalism: {terry_res['transit_fatalism']:.1f}")
        print(f"   Bendix Tension State: {bendix_res['tension']:.1f} | Asset Depreciation: {bendix_res['asset_depreciation']:.1f}")
        
        if barf_res['tension'] > 1.2 and terry_res['tension'] > 1.8 and bendix_res['tension'] > 0.8:
            print("✅ PASS: State engine updated all persona tension states dynamically in local SQLite database.")
        else:
            print("❌ FAIL: Tension scores did not update correctly in SQLite store.")
            import os
            os._exit(1)
            
    try:
        asyncio.run(main())
        print("✅ PASS: [engine.py] executed successfully with zero errors.")
    except Exception as e:
        print(f"❌ FAIL: [engine.py] encountered execution error: {e}")
        import os
        os._exit(1)
