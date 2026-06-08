#!/bin/bash
# ==============================================================================
# Sovereign OS - Live Game Log Synchronization Loop
# STRY-06072026-LOG-INTEGRATION — Phase 3: The 5-Minute Sync Loop
# ==============================================================================

GAME_PK="824916"
OUTPUT_DIR="/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal"
OUTPUT_FILE="$OUTPUT_DIR/game_log_${GAME_PK}_live.md.txt"

echo "=== Gamelog Sync Start: $(date -u) ==="

# 1. Export the latest chat log from the SQLite database
/usr/bin/python3 /home/james/SovereignOS/scripts/export_live_chat.py --game_pk "$GAME_PK" --output "$OUTPUT_FILE"

# 2. Push the resulting file to the designated Google Drive remote repository
# Using rclone copy to upload the single file efficiently
/usr/bin/rclone copy "$OUTPUT_FILE" "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal" \
  --fast-list \
  --progress

if [ $? -eq 0 ]; then
  echo "=== Gamelog Sync Success: $(date -u) ==="
else
  echo "=== Gamelog Sync Failed: $(date -u) ==="
  exit 1
fi
