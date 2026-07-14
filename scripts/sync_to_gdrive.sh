#!/bin/bash
# ==============================================================================
# Sovereign OS - Targeted Session State Synchronization to Google Drive
# Governed by RULE 11 (Session State Synchronization) - Pristine Fast Path Pass
# ==============================================================================

echo "📡 INITIATING SYSTEM STATE COMPILATION & CLOUD SYNC..."

# 1. Harvest artifacts
echo "Harvesting artifacts..."
python3 /home/james/SovereignOS/scripts/artifact_harvester.py

# 2. Compile fresh ground truth on Clio
echo "Generating latest high-entropy Sync Anchor Token..."
python3 /home/james/SovereignOS/scripts/generate_sync_anchor.py "$@"

echo "Compiling live codebase and massive database transfer packages..."
python3 /home/james/SovereignOS/scripts/compile_codebase_payload.py
python3 /home/james/SovereignOS/scripts/compile_massive_notebook_payload.py
python3 /home/james/SovereignOS/scripts/generate_persona_audit.py
python3 /home/james/SovereignOS/scripts/compile_conversation_history.py

# 3. Mirror the full local workspace codebase (SovereignOS) to Google Drive
echo "🚀 Mirroring the full codebase workspace (SovereignOS) to Google Drive..."
rclone sync "/home/james/SovereignOS" "sovereign_os:SovereignOS_Clio_Sync/SovereignOS" \
  --fast-list \
  --progress \
  --max-age 24h \
  --exclude-from "/home/james/SovereignOS/.rclone-ignore"

if [ $? -ne 0 ]; then
  echo "❌ ERROR: SovereignOS sync failed."
  exit 1
fi

# 3.1 Mirror the lookbooks to Google Drive specifically (since media_vault is excluded)
echo "🚀 Mirroring lookbooks to Google Drive..."
rclone sync "/home/james/SovereignOS/media_vault/03_Assets/Lookbooks" "sovereign_os:SovereignOS_Clio_Sync/SovereignOS/media_vault/03_Assets/Lookbooks" \
  --fast-list \
  --progress \
  --quiet

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Lookbooks sync failed."
  exit 1
fi

# 4. Mirror the sovereign_inbox workspace to Google Drive
echo "🚀 Mirroring the sovereign_inbox workspace to Google Drive..."
rclone sync "/home/james/sovereign_inbox" "sovereign_os:SovereignOS_Clio_Sync/sovereign_inbox" \
  --fast-list \
  --progress \
  --max-age 24h \
  --exclude-from "/home/james/sovereign_inbox/.rclone-ignore"

if [ $? -ne 0 ]; then
  echo "❌ ERROR: sovereign_inbox sync failed."
  exit 1
fi

# 5. Dispatch completion notification report
echo "📧 Dispatching completion email report..."
python3 /home/james/SovereignOS/scripts/send_notification.py

if [ $? -ne 0 ]; then
  echo "⚠️ WARNING: Completion notification dispatch failed."
else
  echo "🟢 SUCCESS: Completion email successfully sent."
fi

echo "🟢 SUCCESS: Ground truth and codebase successfully synchronized."