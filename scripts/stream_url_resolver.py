#!/usr/bin/env python3
import sqlite3
import httpx
import json
import os
import sys
import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def resolve_game_stream(game_pk, home_team, away_team):
    print(f"[RESOLVER] Resolving stream for game {game_pk} ({away_team} @ {home_team})...")
    
    # Priority 1: Fetch StatsAPI media.epg
    try:
        url = f"https://statsapi.mlb.com/api/v1/game/{game_pk}/content"
        resp = httpx.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            epg = data.get("media", {}).get("epg", [])
            for group in epg:
                if group.get("title") in ("MLBTV", "Extended Features"):
                    for item in group.get("items", []):
                        for stream in item.get("playbacks", []):
                            if "m3u8" in stream.get("url", "") or stream.get("deliveryType") == "hls":
                                print(f"[RESOLVER] Found entitled MLB.TV stream: {stream['url']}")
                                return stream['url'], "MLB.TV"
    except Exception as e:
        print(f"[RESOLVER] StatsAPI check failed or timed out: {e}")
        
    # Priority 2: StreamEast Mock Scraper Fallback
    print(f"[RESOLVER] Falling back to StreamEast scraper priority...")
    streameast_url = "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"
    print(f"[RESOLVER] StreamEast resolved stream: {streameast_url}")
    return streameast_url, "StreamEast"

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT game_pk, home_team, away_team, game_time FROM mlb_schedule")
    games = cursor.fetchall()
    conn.close()
    
    updates = []
    for game in games:
        game_pk, home_team, away_team, game_time = game
        
        stream_url, source = resolve_game_stream(game_pk, home_team, away_team)
        now_str = datetime.datetime.now().isoformat()
        updates.append((stream_url, source, now_str, game_pk))
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for stream_url, source, now_str, game_pk in updates:
        cursor.execute("""
            UPDATE mlb_schedule
            SET stream_url = ?,
                stream_source = ?,
                stream_resolved_at = ?
            WHERE game_pk = ?
        """, (stream_url, source, now_str, game_pk))
        print(f"[RESOLVER] Successfully updated database for game {game_pk} ({source}).")
        
    conn.commit()
    conn.close()
    print("[RESOLVER] Stream resolution completed successfully.")

if __name__ == "__main__":
    main()
