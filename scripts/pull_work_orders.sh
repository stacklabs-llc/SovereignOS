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

GDRIVE_SOURCE_SPARK="sovereign_os:SovereignOS_Clio_Sync/work_orders"
GDRIVE_SOURCE_GEMINI="sovereign_os:"
GDRIVE_ARCHIVE="sovereign_os:SovereignOS_Clio_Sync/work_orders/archive"
LOCAL_INBOX="/home/james/sovereign_inbox"
SORTING_HAT_SCRIPT="/home/james/SovereignOS/scripts/organize_inbox.py"

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
