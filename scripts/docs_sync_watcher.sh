#!/bin/bash
# ==============================================================================
# Sovereign OS // Docs Sync Watcher
# Function: Automatically watches dna/docs/ and syncs all markdown files
#           to Google Drive workspace backup and NotebookLM staging directory
#           immediately on file save, move, or delete.
# ==============================================================================

WATCH_DIR="/home/james/SovereignOS/dna/docs"
GDRIVE_TARGET_WORKSPACE="sovereign_os:SovereignOS_Clio_Sync/SovereignOS/dna/docs"
GDRIVE_TARGET_NOTEBOOK="sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal/docs"
STAGE_DIR="/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal/docs"
LOG="/home/james/SovereignOS/scripts/docs_sync.log"

# Ensure staging directory exists
mkdir -p "$STAGE_DIR"

echo "[DOCS SYNC] Watcher daemon armed. Monitoring $WATCH_DIR..." | tee -a "$LOG"

# Helper to stage a file with a timestamp
stage_with_timestamp() {
  local src="$1"
  local dest="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
  echo "**LAST SYNC TIME:** ${timestamp} UTC" > "$dest"
  echo "" >> "$dest"
  cat "$src" >> "$dest"
}

# Run a sync immediately on startup to ensure remote is up to date
echo "[DOCS SYNC] Performing initial synchronization sweep..." | tee -a "$LOG"

# 1. Sync raw workspace docs folder
rclone sync "$WATCH_DIR" "$GDRIVE_TARGET_WORKSPACE" -v 2>> "$LOG"

# 2. Stage to NotebookLM folder and sync
rm -f "$STAGE_DIR"/*
find "$WATCH_DIR" -name "*.md" -type f 2>/dev/null | while read -r f; do
  if [ -f "$f" ]; then
    stage_with_timestamp "$f" "$STAGE_DIR/$(basename "$f").txt"
  fi
done
rclone sync "$STAGE_DIR" "$GDRIVE_TARGET_NOTEBOOK" -v 2>> "$LOG"

echo "[DOCS SYNC] Initial sweep completed." | tee -a "$LOG"

# Monitor the directory for close_write, moved_to, and delete events
inotifywait -m -r -e close_write,moved_to,delete "$WATCH_DIR" |
while read -r directory events filename; do
    # Only react to markdown files to avoid sync loops on temporary files
    if [[ "$filename" =~ \.md$ ]]; then
        echo "[DOCS SYNC] $(date) — Change detected in $directory: $filename ($events)" | tee -a "$LOG"
        
        # 1. Sync workspace backup folder on Google Drive
        rclone sync "$WATCH_DIR" "$GDRIVE_TARGET_WORKSPACE" -v 2>> "$LOG"
        
        # 2. Re-stage all docs and sync NotebookLM target folder
        rm -f "$STAGE_DIR"/*
        find "$WATCH_DIR" -name "*.md" -type f 2>/dev/null | while read -r f; do
            if [ -f "$f" ]; then
                stage_with_timestamp "$f" "$STAGE_DIR/$(basename "$f").txt"
            fi
        done
        rclone sync "$STAGE_DIR" "$GDRIVE_TARGET_NOTEBOOK" -v 2>> "$LOG"
        
        echo "[DOCS SYNC] $(date) — Push completed." | tee -a "$LOG"
    fi
done
