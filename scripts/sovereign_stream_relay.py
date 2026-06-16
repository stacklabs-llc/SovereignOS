import sys
import os
import json
import asyncio
import logging
import sqlite3
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re

# Use standard Sovereign OS logging format
logging.basicConfig(level=logging.INFO, format="%(asctime)s - STREAM_RELAY - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Sovereign Stream Relay")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open CORS for the Vite proxies
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/health")
def health_check():
    return {"status": "Sovereign Stream Relay is Active", "port": 8097}

@app.get("/api/sports/telemetry_logs")
async def get_telemetry_logs(game_pk: str = None, limit: int = 50):
    """
    Returns the tail of the background poller's raw statcast telemetry log,
    optionally filtered by game_pk.
    """
    logger.info(f"get_telemetry_logs: game_pk={game_pk}, limit={limit}")
    log_path = "/home/james/sovereign_inbox/today/statcast_telemetry.log"
    if not os.path.exists(log_path):
        return []
    try:
        # Resolve game_pk to teams if provided
        filter_teams = None
        if game_pk:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT home_team, away_team FROM mlb_schedule WHERE game_pk = ?", (game_pk,))
                row = cursor.fetchone()
                conn.close()
                if row:
                    # e.g., ("BAL", "SD")
                    filter_teams = (row["home_team"], row["away_team"])
            except Exception as db_err:
                logger.error(f"Error querying teams for game_pk {game_pk}: {db_err}")

        with open(log_path, "r") as f:
            content = f.read()
        
        # Split blocks by literal "\n\n" string
        raw_blocks = content.strip().split("\\n\\n")
            
        parsed_blocks = []
        for raw in raw_blocks:
            if not raw.strip():
                continue
            block_lines = raw.strip().split("\\n")
            block_data = {
                "timestamp": "",
                "state_summary": "",
                "statcast_info": None,
                "raw_payload": None
            }
            for l in block_lines:
                l = l.strip()
                if l.startswith("[") and "] [STATE]" in l:
                    parts = l.split("] [STATE] ")
                    block_data["timestamp"] = parts[0][1:]
                    block_data["state_summary"] = parts[1]
                elif l.startswith("[") and "STATCAST 📡" in l:
                    parts = l.split(" STATCAST 📡 ")
                    if not block_data["timestamp"]:
                        block_data["timestamp"] = parts[0][1:]
                    block_data["statcast_info"] = parts[1]
                elif l.startswith("RAW PAYLOAD: "):
                    payload_str = l[len("RAW PAYLOAD: "):]
                    try:
                        block_data["raw_payload"] = json.loads(payload_str)
                    except Exception:
                        block_data["raw_payload"] = payload_str
            
            # Filter by teams if game_pk was resolved
            if filter_teams:
                payload = block_data["raw_payload"]
                matches = False
                if isinstance(payload, dict):
                    home = payload.get("home_team")
                    away = payload.get("away_team")
                    # Check matching teams in either order
                    if (home == filter_teams[0] and away == filter_teams[1]) or \
                       (home == filter_teams[1] and away == filter_teams[0]):
                        matches = True
                else:
                    if filter_teams[0] in raw and filter_teams[1] in raw:
                        matches = True
                if not matches:
                    continue
                    
            parsed_blocks.append(block_data)
            
        return parsed_blocks[-limit:]
    except Exception as e:
        logger.error(f"Error parsing telemetry logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse telemetry logs")


@app.get("/api/sports/active_games")
async def get_active_games():
    """
    Returns a list of all active game rooms.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT game_pk, home_team, away_team, room_state FROM mlb_schedule WHERE room_state = 'active'"
        )
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "game_pk": str(r["game_pk"]),
                "home_team": r["home_team"],
                "away_team": r["away_team"],
                "room_state": r["room_state"]
            }
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching active games: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sports/{sport_type}")
async def get_games(sport_type: str):
    """
    Returns filtered weekend and today games from the SQLite mlb_schedule database table,
    complete with mapped live statuses and injected cached game scores.
    """
    if sport_type == "mlb":
        try:
            today_str = date.today().isoformat()
            start_date = (date.today() - timedelta(days=2)).isoformat()
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT game_pk, home_team, away_team, status, game_time, stream_url, stream_source "
                "FROM mlb_schedule WHERE game_date BETWEEN ? AND ?",
                (start_date, today_str)
            )
            rows = cursor.fetchall()
            conn.close()
            
            games = []
            for r in rows:
                game_pk = str(r["game_pk"])
                home_score = None
                away_score = None
                
                state_path = f"/home/james/SovereignOS/game_states/{game_pk}.json"
                if os.path.exists(state_path):
                    try:
                        with open(state_path, "r") as f:
                            state_data = json.load(f)
                            home_score = state_data.get("home_score")
                            away_score = state_data.get("away_score")
                    except Exception:
                        pass
                
                # Map active/in-progress game states to "LIVE" for frontend CSS trigger
                status = r["status"] or "Scheduled"
                if status in ("In Progress", "Warmup"):
                    status = "LIVE"
                
                games.append({
                    "id": game_pk,
                    "title": f"{r['away_team']} @ {r['home_team']}",
                    "status": status,
                    "time": r["game_time"] or "7:10 PM ET",
                    "stream_available": bool(r["stream_url"]),
                    "scraper": r["stream_source"] or "Unknown",
                    "home_team": r["home_team"],
                    "away_team": r["away_team"],
                    "home_score": home_score,
                    "away_score": away_score
                })
            return games
        except Exception as e:
            logger.error(f"Error fetching from DB: {e}")
            return []
    return []

@app.get("/api/stream/{game_id}")
async def get_stream_url(game_id: str):
    """
    Returns the resolved SQLite stream URL or falls back to the Red Bull TV stream.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT stream_url, stream_headers FROM mlb_schedule WHERE game_pk = ?", (game_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row and row["stream_url"]:
            headers_json = row["stream_headers"]
            headers = {}
            if headers_json:
                try:
                    headers = json.loads(headers_json)
                except Exception:
                    pass
            return {"m3u8_url": row["stream_url"], "stream_headers": headers}
    except Exception as e:
        logger.error(f"Error loading stream URL: {e}")
        
    # Active 24/7 Red Bull TV live HLS action sports stream (failsafe fallback)
    return {
        "m3u8_url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
        "stream_headers": {}
    }

class UpdateStreamRequest(BaseModel):
    stream_url: str
    stream_source: str = "Manual Override"
    stream_headers: dict = None

@app.post("/api/stream/{game_id}")
async def update_stream_url(game_id: str, req: UpdateStreamRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        headers_json = json.dumps(req.stream_headers) if req.stream_headers else None
        cursor.execute(
            "UPDATE mlb_schedule SET stream_url = ?, stream_source = ?, stream_headers = ?, stream_resolved_at = datetime('now') WHERE game_pk = ?",
            (req.stream_url, req.stream_source, headers_json, game_id)
        )
        conn.commit()
        conn.close()
        logger.info(f"Updated stream URL for game {game_id} to {req.stream_url}")
        return {"status": "success", "message": f"Updated stream URL for game {game_id}"}
    except Exception as e:
        logger.error(f"Error updating stream URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/sports/game_state/{game_id}")
async def get_game_state(game_id: str):
    """
    Returns the current cached game state for initial load in the sports portal.
    """
    file_path = f"/home/james/SovereignOS/game_states/{game_id}.json"
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading game state file {file_path}: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse game state")
    raise HTTPException(status_code=404, detail="Game state not found")


if __name__ == "__main__":
    import uvicorn
    logger.info("Initializing Sovereign Stream Relay Engine...")
    uvicorn.run(app, host="0.0.0.0", port=8097)
