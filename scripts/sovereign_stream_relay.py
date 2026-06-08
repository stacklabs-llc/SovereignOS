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
        cursor.execute("SELECT stream_url FROM mlb_schedule WHERE game_pk = ?", (game_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row and row["stream_url"]:
            return {"m3u8_url": row["stream_url"]}
    except Exception as e:
        logger.error(f"Error loading stream URL: {e}")
        
    # Active 24/7 Red Bull TV live HLS action sports stream (failsafe fallback)
    return {
        "m3u8_url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"
    }

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
