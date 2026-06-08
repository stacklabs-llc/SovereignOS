#!/usr/bin/env bash
# ==============================================================================
# Sovereign OS: Google Drive Work Order Pull & Convert Script
# Path: /home/james/SovereignOS/scripts/pull_work_orders.sh
#
# Governed by STRY-06052026-PULL-WORKORDERS.
# Fetches Google Docs from drive, exports them as raw text (markdown),
# renames them to .md, and fires the Sorting Hat processor.
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

GDRIVE_SOURCE="sovereign_os:work_orders"
LOCAL_INBOX="/home/james/sovereign_inbox"
SORTING_HAT_SCRIPT="/home/james/SovereignOS/scripts/organize_inbox.py"

echo -e "${CYAN}[*] Initiating Sovereign Google Drive Pull Pass...${NC}"

# 1. Pull down files from the Google Drive work_orders folder
# We specify '--drive-export-formats txt' to force rclone to download Google Docs
# as raw, unformatted text files (which preserves your clean markdown text).
if rclone copy "$GDRIVE_SOURCE" "$LOCAL_INBOX" \
    --drive-export-formats txt \
    --exclude "archive/**" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Google Drive sync complete. Staged files pulled to inbox.${NC}"
else
    echo -e "${RED}[❌] Failed to connect to Google Drive. Check Tailscale proxy routing.${NC}"
    exit 1
fi

# 2. Iterate through pulled plain text files and convert extensions to .md
# This converts the default rclone '.txt' export directly to '.md' files
# so they are native to your Clio markdown tickets engine.
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

# 2.5. Destroy active queue in Google Drive to prevent duplication loop
echo -e "${CYAN}🧹 Archiving processed cloud files to prevent infinite replication loops...${NC}"
if rclone move "$GDRIVE_SOURCE" "${GDRIVE_SOURCE}/archive" \
    --exclude "archive/**" \
    --max-depth 1 \
    --fast-list \
    --quiet; then
    echo -e "${GREEN}[✔] Google Drive queue cleaned and archived successfully.${NC}"
else
    echo -e "${RED}[❌] Failed to archive Google Drive queue. Check permissions.${NC}"
    exit 1
fi

# 3. Fire your native Sorting Hat to parse, catalog, and generate SQLite tickets
# We use the correct python path (project virtual environment venv/bin/python3 or system python3)
# The current system has python3 and .venv/bin/python3
if [ -f "$SORTING_HAT_SCRIPT" ]; then
    echo -e "${CYAN}[*] Activating local Ingestion Sorting Hat...${NC}"
    python3 "$SORTING_HAT_SCRIPT"
    echo -e "${GREEN}[✔] Sorting Hat pass complete. Tickets staged and database synchronized.${NC}"
else
    echo -e "${RED}[❌] Ingestion script missing at $SORTING_HAT_SCRIPT${NC}"
    exit 1
fi

echo -e "${GREEN}=== Sovereign OS Sync Loop Complete ===${NC}"
