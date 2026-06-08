"""
FanStack Gametime Simulator — Sovereign Build (Cloud Architect Fix)
===================================================================
Fixes applied by Commander Artemis-1:
  1. Table name: "pitches" → "statcast_pitches" (all 4 references)
  2. Newline bug: "\\n" literal → "\n" actual newline
  3. Added proper logging throughout (no more silent swallowing)
  4. Hardened error handling with contextual log messages
"""

import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import uvicorn
import json
from typing import List

# ── Logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fanstack")

# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(title="FanStack Gametime Simulator", version="1.1-sovereign")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/home/james/SovereignOS/scripts/fanstack_sim.db"


class SimulationState:
    def __init__(self):
        self.pitch_index = 1
        self.status = "PAUSED"
        self.speed_multiplier = 1.0
        self.max_index = 156  # Default fallback

    def get_pitch(self, index):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()

            # FIX 1a: pitches → statcast_pitches
            cur.execute("SELECT MAX(pitch_id) as m FROM statcast_pitches")
            max_row = cur.fetchone()
            self.max_index = max_row["m"] if max_row and max_row["m"] else 1

            # FIX 1b: pitches → statcast_pitches
            cur.execute(
                "SELECT * FROM statcast_pitches WHERE pitch_id = ?", (index,)
            )
            row = cur.fetchone()
            conn.close()

            if row:
                pkt = dict(row)
                pkt["sim_status"] = self.status
                pkt["sim_speed"] = self.speed_multiplier
                return pkt
            return None

        except sqlite3.OperationalError as e:
            # FIX 3: No more silent swallowing — log the actual error
            logger.error("SQLite OperationalError in get_pitch(%s): %s", index, e)
            return None
        except Exception as e:
            logger.exception("Unexpected error in get_pitch(%s): %s", index, e)
            return None


sim_state = SimulationState()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            "WebSocket connected. Active connections: %d",
            len(self.active_connections),
        )
        # On connection, immediately send the current state
        pitch_data = sim_state.get_pitch(sim_state.pitch_index)
        if pitch_data:
            await websocket.send_json(pitch_data)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(
            "WebSocket disconnected. Active connections: %d",
            len(self.active_connections),
        )

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning("Broadcast to client failed: %s", e)


manager = ConnectionManager()


@app.websocket("/ws/gametime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            cmd = json.loads(data)
            action = cmd.get("action")
            logger.info("Received command: %s", action)

            if action == "PLAY":
                sim_state.status = "PLAYING"

            elif action == "PAUSE":
                sim_state.status = "PAUSED"

            elif action == "STEP_FWD":
                sim_state.pitch_index = min(
                    sim_state.pitch_index + 1, sim_state.max_index
                )

            elif action == "STEP_BACK":
                sim_state.pitch_index = max(sim_state.pitch_index - 1, 1)

            elif action == "FFWD":
                try:
                    conn = sqlite3.connect(DB_PATH)
                    cur = conn.cursor()
                    # FIX 1c: pitches → statcast_pitches
                    cur.execute(
                        "SELECT MIN(pitch_id) as pid FROM statcast_pitches "
                        "WHERE pitch_id > ? AND events != ''",
                        (sim_state.pitch_index,),
                    )
                    row = cur.fetchone()
                    conn.close()
                    if row and row[0]:
                        sim_state.pitch_index = row[0]
                except Exception as e:
                    logger.error("FFWD query failed: %s", e)

            elif action == "REWIND":
                try:
                    conn = sqlite3.connect(DB_PATH)
                    cur = conn.cursor()
                    # FIX 1d: pitches → statcast_pitches
                    cur.execute(
                        "SELECT MAX(pitch_id) as pid FROM statcast_pitches "
                        "WHERE pitch_id < ? AND events != ''",
                        (sim_state.pitch_index - 1,),
                    )
                    row = cur.fetchone()
                    conn.close()
                    if row and row[0]:
                        sim_state.pitch_index = row[0]
                    else:
                        sim_state.pitch_index = 1
                except Exception as e:
                    logger.error("REWIND query failed: %s", e)

            elif action == "SPEED":
                new_speed = cmd.get("value", 1.0)
                sim_state.speed_multiplier = max(0.1, float(new_speed))
                logger.info("Speed set to %.1fx", sim_state.speed_multiplier)

            # Broadcast new state
            pitch_data = sim_state.get_pitch(sim_state.pitch_index)
            if pitch_data:
                await manager.broadcast(pitch_data)

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── DVR Engine ───────────────────────────────────────────────────────
async def dvr_engine():
    """Background loop that advances the simulation when PLAYING."""
    logger.info("DVR engine started.")
    while True:
        if sim_state.status == "PLAYING":
            if sim_state.pitch_index < sim_state.max_index:
                sim_state.pitch_index += 1
                pitch_data = sim_state.get_pitch(sim_state.pitch_index)
                if pitch_data:
                    await manager.broadcast(pitch_data)

        base_delay = 5.0
        await asyncio.sleep(base_delay / max(sim_state.speed_multiplier, 0.1))


# ── REST Endpoints ───────────────────────────────────────────────────
@app.post("/api/context")
async def add_context(request: Request):
    data = await request.json()
    text = data.get("text")
    if text:
        with open(
            "/home/james/SovereignOS/scripts/fanstack_live_context.txt", "a"
        ) as f:
            # FIX 2: "\\n" literal → "\n" actual newline
            f.write(text + "\n")
        logger.info("Context appended: %s", text[:80])
    return {"status": "ok"}


@app.post("/api/config")
async def write_bot_config(request: Request):
    data = await request.json()
    with open("/home/james/SovereignOS/scripts/bot_config.json", "w") as f:
        json.dump(data, f, indent=4)
    logger.info("Bot config written.")
    return {"status": "success", "message": "Saved to bot_config.json"}


@app.post("/api/savant_query")
async def savant_query(request: Request):
    data = await request.json()
    query_text = (data.get("query") or "").lower()

    conn = sqlite3.connect("/home/james/SovereignOS/sovereign_intelligence.db")
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    des_filter = ""
    pitch_filter = ""
    chips = []

    if "alonso" in query_text:
        des_filter += " AND des LIKE '%Alonso%'"
        chips.append({"label": "Batter", "value": "Pete Alonso"})
    elif "lindor" in query_text:
        des_filter += " AND des LIKE '%Lindor%'"
        chips.append({"label": "Batter", "value": "Francisco Lindor"})
    elif "vientos" in query_text:
        des_filter += " AND des LIKE '%Vientos%'"
        chips.append({"label": "Batter", "value": "Mark Vientos"})

    if "slider" in query_text:
        pitch_filter = " AND pitch_type = 'SL'"
        chips.append({"label": "Pitch", "value": "Slider (SL)"})
    elif "fastball" in query_text:
        pitch_filter = " AND pitch_type = 'FF'"
        chips.append({"label": "Pitch", "value": "Fastball (FF)"})

    if "lefty" in query_text or "lefties" in query_text:
        des_filter += " AND stand = 'L'"
        chips.append({"label": "Bat Side", "value": "Lefty"})

    sql = f"""
    SELECT player_name, des, pitch_type, release_speed, launch_speed,
           launch_angle, estimated_ba_using_speedangle, events
    FROM statcast_pitches
    WHERE events IS NOT NULL AND events != ''
    {des_filter}
    {pitch_filter}
    ORDER BY game_date DESC
    LIMIT 20
    """

    try:
        cur.execute(sql)
        rows = cur.fetchall()
    except Exception as e:
        logger.error("Savant Query Error: %s", e)
        rows = []

    conn.close()

    results = []
    for row in rows:
        results.append(
            {
                "pitcher": row["player_name"] or "Unknown",
                "batter": (
                    row["des"].split(" ")[0] + " " + row["des"].split(" ")[1]
                    if row["des"]
                    else "Unknown"
                ),
                "pitch_type": row["pitch_type"] or "Unknown",
                "release_speed": (
                    f"{row['release_speed']} mph" if row["release_speed"] else "--"
                ),
                "launch_speed": (
                    f"{row['launch_speed']} mph"
                    if "launch_speed" in row.keys() and row["launch_speed"]
                    else "--"
                ),
                "launch_angle": (
                    f"{row['launch_angle']}°"
                    if "launch_angle" in row.keys() and row["launch_angle"]
                    else "--"
                ),
                "estimated_ba": (
                    row["estimated_ba_using_speedangle"]
                    if "estimated_ba_using_speedangle" in row.keys()
                    and row["estimated_ba_using_speedangle"]
                    else "--"
                ),
                "events": row["events"] or "Unknown",
            }
        )

    if not chips:
        chips.append({"label": "Status", "value": "Broad Spectrum Query"})

    return {"chips": chips, "results": results}


# ── Startup ──────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    logger.info("FanStack Gametime Simulator v1.1-sovereign starting up.")
    asyncio.create_task(dvr_engine())


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8006)
