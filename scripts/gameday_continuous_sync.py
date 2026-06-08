#!/usr/bin/env python3
import os
import sys
import time
import sqlite3
import subprocess
import argparse
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
TELEMETRY_LOG = "/home/james/sovereign_inbox/today/statcast_telemetry.log"

SYNC_DIRS = [
    "/home/james/sovereign_inbox/notebook_sync/SovereignOS",
    "/home/james/sovereign_inbox/notebook_sync/SovereignOS_Internal",
    "/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal",
    "/home/james/sovereign_inbox/notebook_sync/StackLabs_Syndicate"
]

RCLONE_TARGETS = [
    ("/home/james/sovereign_inbox/notebook_sync/SovereignOS/", "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/SovereignOS/"),
    ("/home/james/sovereign_inbox/notebook_sync/SovereignOS_Internal/", "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/SovereignOS_Internal/"),
    ("/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal/", "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal/"),
    ("/home/james/sovereign_inbox/notebook_sync/StackLabs_Syndicate/", "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Syndicate/")
]

def run_sync(no_rclone=False):
    print("=== Gameday Live Feed Sync: Starting Compilation ===")
    
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # 1. Fetch active rooms from registry
        cursor.execute("SELECT room_key, game_pk, name FROM cmdb_ci_fanstack_room WHERE room_state = 'active'")
        active_rooms = [dict(r) for r in cursor.fetchall()]
        
        # Build active keys set to avoid duplicates
        active_keys = set()
        for r in active_rooms:
            if r['game_pk']:
                active_keys.add(str(r['game_pk']))
            if r['room_key']:
                active_keys.add(str(r['room_key']))
                
        # Dynamically discover other active streams (chats in last 2 hours or global system streams)
        cursor.execute("""
            SELECT DISTINCT game_pk FROM game_chat 
            WHERE created_at >= datetime('now', '-2 hours') 
               OR game_pk IN ('global', 'GLOBAL', 'live_chat_sniper', 'the_skew')
        """)
        additional_pks = [str(row['game_pk']) for row in cursor.fetchall() if row['game_pk']]
        
        for apk in additional_pks:
            if apk not in active_keys:
                active_rooms.append({
                    'room_key': apk,
                    'game_pk': apk if apk.isdigit() else None,
                    'name': apk if not apk.isdigit() else f"Game Room {apk}"
                })
                active_keys.add(apk)
                
        print(f"Found {len(active_rooms)} active room(s) / dynamic stream(s) to process.")
        
        # 2. Ensure target directories exist
        for d in SYNC_DIRS:
            os.makedirs(d, exist_ok=True)
            
        # 3. Clean any existing managed livefeed files to prevent stale sync files
        for d in SYNC_DIRS:
            for f in os.listdir(d):
                if f.startswith("livefeed_") and f.endswith(".md.txt"):
                    try:
                        os.remove(os.path.join(d, f))
                    except Exception as e:
                        print(f"Warning: Could not remove old file {f} in {d}: {e}")
                        
        # 4. Generate markdown feed for each active room
        for room in active_rooms:
            room_key = room['room_key'] or 'unknown_room'
            game_pk = room['game_pk']
            room_name = room['name'] or 'Active Game Room'
            
            print(f"Compiling live feed for {room_name} ({room_key})")
            
            # Retrieve game metadata from schedule if game_pk is populated
            game_metadata = {"away_team": "?", "home_team": "?", "game_date": "Unknown", "venue": ""}
            if game_pk:
                cursor.execute("SELECT away_team, home_team, game_date, venue FROM mlb_schedule WHERE game_pk = ?", (game_pk,))
                sched_row = cursor.fetchone()
                if sched_row:
                    game_metadata = dict(sched_row)
                    
            matchup = f"{game_metadata['away_team']} @ {game_metadata['home_team']}" if game_pk else room_name
            game_date = game_metadata['game_date']
            venue = game_metadata['venue']
            
            # Fetch chats (if game_pk is blank, check room_key)
            chats = []
            query_key = game_pk if game_pk else room_key
            if query_key:
                cursor.execute("""
                    SELECT 'chat' AS log_type, created_at AS ts, persona, text, model, msg_type,
                           NULL AS inning, NULL AS half, NULL AS event_type,
                           NULL AS batter, NULL AS pitcher, NULL AS pitch_speed, NULL AS description
                    FROM game_chat WHERE game_pk = ?
                    ORDER BY id ASC
                """, (query_key,))
                chats = [dict(r) for r in cursor.fetchall()]
                
            # Fetch plays (if game_pk is populated)
            plays = []
            if game_pk:
                cursor.execute("""
                    SELECT 'play' AS log_type, recorded_at AS ts, NULL AS persona, description AS text,
                           NULL AS model, NULL AS msg_type,
                           inning, half, event_type, batter, pitcher, pitch_speed, description
                    FROM game_play WHERE game_pk = ?
                    ORDER BY id ASC
                """, (game_pk,))
                plays = [dict(r) for r in cursor.fetchall()]
                
            # Merge and sort chronologically
            all_events = chats + plays
            all_events.sort(key=lambda e: e.get("ts") or "")
            
            # Format Markdown
            md_lines = [
                f"# 📋 Live Discourse Stream: {matchup}",
                f"**Date:** {game_date}  |  **Room Key:** {room_key}  |  **Venue:** {venue if venue else 'N/A'}",
                f"**Last Sync Update:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                "",
                "---",
                "",
                f"## Summary",
                f"- **Total Events Logged:** {len(all_events)}",
                f"- **Chat Messages:** {len(chats)}",
                f"- **Plays Logged:** {len(plays)}",
                "",
                "---",
                "",
                "## Chronological Log",
                ""
            ]
            
            for e in all_events:
                ts = (e.get("ts") or "")[:19].replace("T", " ")
                if e["log_type"] == "chat":
                    persona = e.get("persona") or "?"
                    model = e.get("model") or ""
                    text = e.get("text") or ""
                    model_tag = f" `[{model}]`" if model else ""
                    md_lines.append(f"**{ts}** 🗣️ **{persona}**{model_tag}")
                    md_lines.append(f"> {text}")
                    md_lines.append("")
                else:
                    inning = e.get("inning") or "?"
                    half = e.get("half") or ""
                    batter = e.get("batter") or ""
                    pitcher = e.get("pitcher") or ""
                    desc = e.get("description") or ""
                    speed = e.get("pitch_speed") or ""
                    speed_tag = f" @ {speed} mph" if speed else ""
                    md_lines.append(f"**{ts}** ⚾ **Inning {inning} {half}** — {batter} vs {pitcher}{speed_tag}")
                    md_lines.append(f"*{desc}*")
                    md_lines.append("")
                    
            md_content = "\n".join(md_lines)
            
            # Route target folders based on room_key:
            target_dirs = []
            lower_key = room_key.lower()
            if "weedstack" in lower_key:
                target_dirs = [
                    "/home/james/sovereign_inbox/notebook_sync/SovereignOS",
                    "/home/james/sovereign_inbox/notebook_sync/SovereignOS_Internal"
                ]
            elif "stacklabs" in lower_key:
                target_dirs = [
                    "/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal",
                    "/home/james/sovereign_inbox/notebook_sync/StackLabs_Syndicate"
                ]
            else:
                target_dirs = SYNC_DIRS
                
            filename = f"livefeed_{room_key}.md.txt"
            for d in target_dirs:
                file_path = os.path.join(d, filename)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(md_content)
            print(f"Staged {filename} to target directories: {', '.join([os.path.basename(d) for d in target_dirs])}")
            
        # 5. Copy the raw statcast_telemetry.log if it exists
        if os.path.exists(TELEMETRY_LOG):
            print("Staging raw statcast telemetry log...")
            for d in SYNC_DIRS:
                dest_path = os.path.join(d, "statcast_telemetry.log.txt")
                subprocess.run(["cp", TELEMETRY_LOG, dest_path], check=True)
        else:
            print("No active statcast_telemetry.log found to stage.")
            
        # 6. Mirror staging directories to Google Drive via rclone (unless --no-rclone is specified)
        if not no_rclone:
            print("Syncing files to Google Drive remotes...")
            for local_dir, remote_path in RCLONE_TARGETS:
                if os.path.exists(local_dir):
                    cmd = ["rclone", "sync", local_dir, remote_path, "--delete-after", "--quiet"]
                    subprocess.run(cmd, check=True)
            print("🟢 Google Drive sync pass completed.")
        else:
            print("Skipping rclone pass (--no-rclone active).")
            
        print("=== Gameday Live Feed Sync: Completed successfully ===")
        
    except Exception as e:
        print(f"❌ Exception in Gameday Sync Compile: {e}")
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="Sovereign OS Continuous Gameday Live Feed Sync")
    parser.add_argument("--one-shot", action="store_true", help="Compile and sync once, then exit")
    parser.add_argument("--daemon", action="store_true", help="Run indefinitely in a 60-second loop")
    parser.add_argument("--no-rclone", action="store_true", help="Skip the rclone sync execution")
    
    args = parser.parse_args()
    
    if args.daemon:
        print("Starting gameday sync daemon (60-second polling)...")
        try:
            while True:
                run_sync(no_rclone=args.no_rclone)
                sys.stdout.flush()
                time.sleep(60)
        except KeyboardInterrupt:
            print("Daemon stopped by keyboard interrupt.")
    else:
        # Default is --one-shot if nothing else specified
        run_sync(no_rclone=args.no_rclone)

if __name__ == "__main__":
    main()
