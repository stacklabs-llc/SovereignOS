#!/bin/bash
# ==============================================================================
# Sovereign OS - Lightweight State Synchronization to Google Drive
# Governed by STRY8791010 - Automated Ticket Ledger and Artifact Synchronization
# ==============================================================================

set -euo pipefail

TARGET_NOTEBOOK_DIR="/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal"
LIGHTWEIGHT_REMOTE="sovereign_os:SovereignOS_Clio_Sync/Lightweight"

echo "📡 INITIATING LIGHTWEIGHT STATE SYNC..."

# 1. Compile fresh database transfer packages (fast)
echo "Compiling live database transfer packages..."
python3 /home/james/SovereignOS/scripts/compile_massive_notebook_payload.py
python3 /home/james/SovereignOS/scripts/generate_persona_audit.py

# Ensure directories exist
mkdir -p "$TARGET_NOTEBOOK_DIR/walkthroughs"
mkdir -p "$TARGET_NOTEBOOK_DIR/implementation_plans"
mkdir -p "$TARGET_NOTEBOOK_DIR/docs"

# 2. Stage split database payloads, walkthroughs, plans, and docs
echo "Staging updated documents..."
rm -f "$TARGET_NOTEBOOK_DIR/SOVEREIGN_OS_INTERNAL_MASSIVE_DATA_TRANSFER_PACKAGE"*
for part_file in /home/james/SovereignOS/dna/notebook_lm_exports/SOVEREIGN_OS_INTERNAL_MASSIVE_DATA_TRANSFER_PACKAGE_PART_*.txt; do
  if [ -f "$part_file" ]; then
    cp "$part_file" "$TARGET_NOTEBOOK_DIR/$(basename "$part_file")"
  fi
done

# Copy documentation files
find /home/james/sovereign_inbox/walkthroughs/ -name "walkthrough_*.md" -type f 2>/dev/null | while read -r f; do
  cp "$f" "$TARGET_NOTEBOOK_DIR/walkthroughs/$(basename "$f").txt"
done

find /home/james/sovereign_inbox/implementation_plans/ -name "implementation_plan_*.md" -type f 2>/dev/null | while read -r f; do
  cp "$f" "$TARGET_NOTEBOOK_DIR/implementation_plans/$(basename "$f").txt"
done

find /home/james/SovereignOS/dna/docs/ -name "*.md" -type f 2>/dev/null | while read -r f; do
  cp "$f" "$TARGET_NOTEBOOK_DIR/docs/$(basename "$f").txt"
done

# 3. Mirror the NotebookLM directory to Google Drive
echo "Syncing NotebookLM target directory..."
rclone sync "$TARGET_NOTEBOOK_DIR" "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal" \
  --fast-list \
  --exclude "node_modules/**" \
  --exclude "dist/**" \
  --exclude ".git/**" \
  --quiet

# 4. Copy raw database file and other critical system directories
echo "Backing up raw DB and system directories..."
rclone copy "/home/james/SovereignOS/dna/sovereign_now.db" "$LIGHTWEIGHT_REMOTE/dna/" --quiet
rclone copy "/home/james/SovereignOS/dna/docs/" "$LIGHTWEIGHT_REMOTE/dna/docs/" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/SovereignOS/logs/" "$LIGHTWEIGHT_REMOTE/logs/" --quiet
rclone copy "/home/james/sovereign_inbox/walkthroughs/" "$LIGHTWEIGHT_REMOTE/inbox/walkthroughs/" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/sovereign_inbox/implementation_plans/" "$LIGHTWEIGHT_REMOTE/inbox/implementation_plans/" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/sovereign_inbox/reports/" "$LIGHTWEIGHT_REMOTE/inbox/reports/" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet

# 5. Run artifact harvester
echo "Harvesting artifacts..."
python3 /home/james/SovereignOS/scripts/artifact_harvester.py

# 6. Bidirectional Sync of Harvested Assets, Walkthroughs, and Plans
echo "Syncing harvested artifacts (bidirectional copy)..."
rclone copy "sovereign_os:SovereignOS_Clio_Sync/Harvested_Artifacts" "/home/james/SovereignOS/media_vault/03_Assets/Harvested_Artifacts" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/SovereignOS/media_vault/03_Assets/Harvested_Artifacts" "sovereign_os:SovereignOS_Clio_Sync/Harvested_Artifacts" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet

echo "Syncing lookbooks (bidirectional copy)..."
rclone copy "sovereign_os:SovereignOS_Clio_Sync/SovereignOS/media_vault/03_Assets/Lookbooks" "/home/james/SovereignOS/media_vault/03_Assets/Lookbooks" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/SovereignOS/media_vault/03_Assets/Lookbooks" "sovereign_os:SovereignOS_Clio_Sync/SovereignOS/media_vault/03_Assets/Lookbooks" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet

echo "Syncing walkthroughs and plans (bidirectional copy)..."
rclone copy "sovereign_os:SovereignOS_Clio_Sync/walkthroughs" "/home/james/sovereign_inbox/walkthroughs" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/sovereign_inbox/walkthroughs" "sovereign_os:SovereignOS_Clio_Sync/walkthroughs" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet

rclone copy "sovereign_os:SovereignOS_Clio_Sync/implementation_plans" "/home/james/sovereign_inbox/implementation_plans" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet
rclone copy "/home/james/sovereign_inbox/implementation_plans" "sovereign_os:SovereignOS_Clio_Sync/implementation_plans" --exclude "node_modules/**" --exclude "dist/**" --exclude ".git/**" --quiet

echo "🟢 Lightweight state sync completed successfully."
