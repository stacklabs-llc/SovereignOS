#!/usr/bin/env bash
# fanstack_daily_prep.sh

set -e

GAME_ID=""
FORCE_REFRESH=false
CROSS_POLLINATE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --game-id) GAME_ID="$2"; shift ;;
        --force-refresh) FORCE_REFRESH=true ;;
        --cross-pollinate) CROSS_POLLINATE=true ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$GAME_ID" ]; then
    echo "Usage: ./fanstack_daily_prep.sh --game-id <GAME_ID> [--force-refresh] [--cross-pollinate]"
    exit 1
fi

echo "[*] Running FanStack Daily Prep Wrapper for Game ID: $GAME_ID"

# Ingress Phase: Fetch today's schedule from MLB API
echo "[*] Ingress Phase: Fetching fresh MLB daily schedule..."
mkdir -p /home/james/SovereignOS/data
curl -s "https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1" > /home/james/SovereignOS/data/today_schedule.json

# Seeding Phase: Run the seeder script
echo "[*] Seeding Phase: Seeding MLB schedule into DB..."
python3 /home/james/SovereignOS/scripts/seed_schedule.py --file /home/james/SovereignOS/data/today_schedule.json

# Checkpoint Phase: Run directory sync and notify UI
echo "[*] Checkpoint Phase: Running sync to Google Drive..."
python3 /home/james/SovereignOS/scripts/generate_session_boot.py
bash /home/james/SovereignOS/scripts/sync_to_gdrive.sh -gd
echo "[*] Notifying Roll Call UI via system broadcast..."
curl -s -X POST http://localhost:8000/api/system/broadcast || true

# Step 1: Run setup_all_rooms.py to stage the game room in the DB
python3 /home/james/SovereignOS/scripts/setup_all_rooms.py "$GAME_ID"

# Step 2: Override seating to place advocates in game_persona and m2m_persona_room
if [ "$CROSS_POLLINATE" = true ]; then
    echo "[*] Cross-pollinating room seating..."
    python3 /home/james/SovereignOS/scripts/seat_cross_pollinated.py
else
    echo "[*] Seating default advocates..."
    python3 /home/james/SovereignOS/scripts/seat_advocates.py
fi

# Step 3: Deploy the game room and activate the advocates
python3 /home/james/SovereignOS/scripts/deploy_game_room.py "$GAME_ID"

# Step 4: Restart the stack to ensure everything is initialized
bash /home/james/SovereignOS/scripts/restart_stack.sh

echo "[✔] fanstack_daily_prep.sh execution complete."
