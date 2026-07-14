#!/usr/bin/env bash
# ==============================================================================
# Sovereign OS: Unified Google Drive Work Order Pull & Sync Script
# Path: /home/james/SovereignOS/scripts/sovereign_pull_sync.sh
#
# Governed by STRY8791010.
# Fetches Google Docs from drive, exports them as raw text (markdown),
# renames them to .md, and fires the Sorting Hat processor within the venv.
# ==============================================================================

set -euo pipefail

# Enforce strict headless sandbox variables
export DISPLAY=""
export PLAYWRIGHT_HEADLESS=true

# Design Token Colors for Clio Terminal Output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SOVEREIGN_HOME="/home/james/SovereignOS"
VENV_PYTHON="${SOVEREIGN_HOME}/.venv/bin/python3"
GDRIVE_SOURCE_SPARK="sovereign_os:SovereignOS_Clio_Sync/work_orders"
GDRIVE_SOURCE_GEMINI="sovereign_os:"
GDRIVE_ARCHIVE="sovereign_os:SovereignOS_Clio_Sync/work_orders/archive"
LOCAL_INBOX="/home/james/sovereign_inbox"
SORTING_HAT_SCRIPT="${SOVEREIGN_HOME}/scripts/organize_inbox.py"

# Check if loop argument is passed
if [ "${1:-}" = "--loop" ]; then
    AUDIT_LOG="${SOVEREIGN_HOME}/logs/sync_audit.log"
    mkdir -p "$(dirname "$AUDIT_LOG")"
    
    echo "Starting persistent telemetry sync loop..."
    echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] [STARTUP] Sync loop daemon started." >> "$AUDIT_LOG"
    
    # Graceful shutdown handler
    cleanup_loop() {
        echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] [SHUTDOWN] Sync loop daemon received termination signal." >> "$AUDIT_LOG"
        exit 0
    }
    trap cleanup_loop SIGINT SIGTERM
    
    while true; do
        timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
        src_file="/home/james/sovereign_inbox/live_feed.json"
        src_file_alt="/home/james/sovereign_inbox/reports/live_feed.json"
        dest_file="/home/james/SovereignOS/data/live_feed.json"
        
        active_src=""
        if [ -f "$src_file" ]; then
            active_src="$src_file"
        elif [ -f "$src_file_alt" ]; then
            active_src="$src_file_alt"
        fi
        
        if [ -n "$active_src" ]; then
            tmp_file="${dest_file}.tmp"
            if cp "$active_src" "$tmp_file" && mv "$tmp_file" "$dest_file"; then
                echo "[$timestamp] [HEARTBEAT] Sync successful" >> "$AUDIT_LOG"
            else
                echo "[$timestamp] [HEARTBEAT] Sync failed during copy/rename" >> "$AUDIT_LOG"
            fi
        else
            echo "[$timestamp] [HEARTBEAT] Telemetry file missing" >> "$AUDIT_LOG"
        fi
        
        # Keep log to max 500 lines
        if [ -f "$AUDIT_LOG" ] && [ "$(wc -l < "$AUDIT_LOG")" -gt 500 ]; then
            tail -n 500 "$AUDIT_LOG" > "${AUDIT_LOG}.tmp" && mv "${AUDIT_LOG}.tmp" "$AUDIT_LOG"
        fi
        
        sleep 90
    done
fi

# Log sync start
DB_PATH="${SOVEREIGN_HOME}/dna/sovereign_now.db"
SYNC_LOG_FILE="${SOVEREIGN_HOME}/logs/sync.log"
mkdir -p "$(dirname "$SYNC_LOG_FILE")"

log_sync_event() {
    local status="$1"
    local msg="$2"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$status] $msg" >> "$SYNC_LOG_FILE"
    # Keep log file to max 500 lines
    if [ -f "$SYNC_LOG_FILE" ] && [ "$(wc -l < "$SYNC_LOG_FILE")" -gt 500 ]; then
        tail -n 500 "$SYNC_LOG_FILE" > "$SYNC_LOG_FILE.tmp" && mv "$SYNC_LOG_FILE.tmp" "$SYNC_LOG_FILE"
    fi
    # Log to SQLite
    sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS sys_sync_log (sys_id TEXT PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT, event_message TEXT); INSERT INTO sys_sync_log (sys_id, status, event_message) VALUES (lower(hex(randomblob(16))), '$status', '$msg'); DELETE FROM sys_sync_log WHERE sys_id NOT IN (SELECT sys_id FROM sys_sync_log ORDER BY timestamp DESC LIMIT 500);" 2>/dev/null || true
}

cleanup() {
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        log_sync_event "error" "Sync loop failed with exit code $exit_code."
    fi
}
trap cleanup EXIT

log_sync_event "syncing" "Sync loop started."

echo -e "${CYAN}[*] Syncing walkthroughs, plans, and harvested artifacts bidirectionally...${NC}"
rclone copy "sovereign_os:SovereignOS_Clio_Sync/walkthroughs" "/home/james/sovereign_inbox/walkthroughs" --quiet
rclone copy "sovereign_os:SovereignOS_Clio_Sync/implementation_plans" "/home/james/sovereign_inbox/implementation_plans" --quiet
rclone copy "sovereign_os:SovereignOS_Clio_Sync/Harvested_Artifacts" "/home/james/SovereignOS/media_vault/03_Assets/Harvested_Artifacts" --quiet

echo -e "${CYAN}[*] Initiating Sovereign Google Drive Pull Pass...${NC}"

# 1. Pull down files from the Google Drive work_orders folder (Spark)
echo -e "${CYAN}[➔] Pulling from Spark work_orders subfolder...${NC}"
if rclone copy "$GDRIVE_SOURCE_SPARK" "$LOCAL_INBOX" \
    --drive-export-formats txt \
    --exclude "archive/**" \
    --exclude "spark/**" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Spark subfolder pull complete.${NC}"
else
    echo -e "${RED}[❌] Failed to pull from Spark subfolder. Check Tailscale proxy routing.${NC}"
    exit 1
fi

# 1.5. Pull down files from the Google Drive root folder (Gemini)
echo -e "${CYAN}[➔] Pulling from Gemini root folder...${NC}"
if rclone copy "$GDRIVE_SOURCE_GEMINI" "$LOCAL_INBOX" \
    --drive-export-formats txt \
    --filter "- SovereignOS_Clio_Sync/**" \
    --filter "- SovereignOS_Clio_Sync*" \
    --filter "+ *[wW][oO][rR][kK]*[oO][rR][dD][eE][rR]*" \
    --filter "+ *[wW][oO]-*" \
    --filter "+ *[kK][nN][oO][wW][lL][eE][dD][gG][eE]*" \
    --filter "+ *[kK][bB]*" \
    --filter "- *" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Gemini root folder pull complete.${NC}"
else
    echo -e "${RED}[❌] Failed to pull from Gemini root folder. Check Tailscale proxy routing.${NC}"
    exit 1
fi

# 2. Iterate through pulled plain text files and convert extensions to .md
CONVERT_COUNT=0
for f in "$LOCAL_INBOX"/*.txt; do
    if [ -f "$f" ]; then
        # Skip files that are already mapped as .md.txt
        if [[ "$f" == *.md.txt ]]; then
            continue
        fi
        
        target_name="${f%.txt}.md"
        mv "$f" "$target_name"
        CONVERT_COUNT=$((CONVERT_COUNT + 1))
        echo -e "${CYAN}  [➔] Converted: $(basename "$f") -> $(basename "$target_name")${NC}"
    fi
done

if [ "$CONVERT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}[✔] Successfully converted $CONVERT_COUNT Google Doc(s) to Markdown.${NC}"
else
    echo -e "${YELLOW}[i] No new plain-text Google Docs required conversion in this pass.${NC}"
fi

# 3. Fire your native Sorting Hat to parse, catalog, and generate SQLite tickets
if [ -f "$SORTING_HAT_SCRIPT" ]; then
    echo -e "${CYAN}[*] Activating local Ingestion Sorting Hat (Virtual Environment)...${NC}"
    "$VENV_PYTHON" "$SORTING_HAT_SCRIPT"
    echo -e "${GREEN}[✔] Sorting Hat pass complete. Tickets staged and database synchronized.${NC}"
else
    echo -e "${RED}[❌] Ingestion script missing at $SORTING_HAT_SCRIPT${NC}"
    exit 1
fi

# 3.5. Destroy active queue in Google Drive ONLY after sorting hat successfully processed files
echo -e "${CYAN}🧹 Archiving processed cloud files to prevent infinite replication loops...${NC}"

echo -e "${CYAN}[➔] Archiving Spark subfolder queue...${NC}"
if rclone move "$GDRIVE_SOURCE_SPARK" "$GDRIVE_ARCHIVE" \
    --exclude "archive/**" \
    --exclude "spark/**" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Spark subfolder queue archived.${NC}"
else
    echo -e "${RED}[❌] Failed to archive Spark subfolder queue.${NC}"
    exit 1
fi

echo -e "${CYAN}[➔] Archiving Gemini root folder queue...${NC}"
if rclone move "$GDRIVE_SOURCE_GEMINI" "$GDRIVE_ARCHIVE" \
    --filter "- SovereignOS_Clio_Sync/**" \
    --filter "- SovereignOS_Clio_Sync*" \
    --filter "+ *[wW][oO][rR][kK]*[oO][rR][dD][eE][rR]*" \
    --filter "+ *[wW][oO]-*" \
    --filter "+ *[kK][nN][oO][wW][lL][eE][dD][gG][eE]*" \
    --filter "+ *[kK][bB]*" \
    --filter "- *" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Gemini root folder queue archived successfully.${NC}"
else
    echo -e "${RED}[❌] Failed to archive Gemini root folder queue.${NC}"
    exit 1
fi

echo -e "${GREEN}=== Sovereign OS Sync Loop Complete ===${NC}"
log_sync_event "success" "Sync loop completed successfully."
trap - EXIT
