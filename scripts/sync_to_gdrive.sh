#!/bin/bash
# ==============================================================================
# Sovereign OS - Targeted Session State Synchronization to Google Drive
# Governed by RULE 11 (Session State Synchronization) - Pristine Fast Path Pass
# ==============================================================================

TARGET_NOTEBOOK_DIR="/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal"
TODAY_DIR="/home/james/sovereign_inbox/today"

# Helper to copy and prepend sync timestamp to staged files
stage_with_timestamp() {
  local src="$1"
  local dest="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
  echo "**LAST SYNC TIME:** ${timestamp} UTC" > "$dest"
  echo "" >> "$dest"
  cat "$src" >> "$dest"
}

echo "📡 INITIATING SYSTEM PURGE & SESSION SYNC..."

# 1. Compile fresh ground truth on Clio
echo "Generating latest high-entropy Sync Anchor Token..."
python3 /home/james/SovereignOS/scripts/generate_sync_anchor.py "$@"

echo "Compiling live codebase and massive database transfer packages..."
python3 /home/james/SovereignOS/scripts/compile_codebase_payload.py
python3 /home/james/SovereignOS/scripts/compile_massive_notebook_payload.py
python3 /home/james/SovereignOS/scripts/generate_persona_audit.py

# Ensure directory structure exists
mkdir -p "$TARGET_NOTEBOOK_DIR/dna"

# 2. Stage Explicit Codebase Chunks for Ingestion (with .txt extension at the root)
echo "📦 Staging verified codebase components..."
cp /home/james/SovereignOS/dna/notebook_lm_exports/SOVEREIGN_CODEBASE_PART_1.md "$TARGET_NOTEBOOK_DIR/SOVEREIGN_CODEBASE_PART_1.md.txt"
cp /home/james/SovereignOS/dna/notebook_lm_exports/SOVEREIGN_CODEBASE_PART_2.md "$TARGET_NOTEBOOK_DIR/SOVEREIGN_CODEBASE_PART_2.md.txt"
cp /home/james/SovereignOS/dna/notebook_lm_exports/SOVEREIGN_OS_INTERNAL_MASSIVE_DATA_TRANSFER_PACKAGE.md "$TARGET_NOTEBOOK_DIR/SOVEREIGN_OS_INTERNAL_MASSIVE_DATA_TRANSFER_PACKAGE.md.txt"

# 3. Stage Shared Architectural References
echo "📚 Staging partner-safe architectural references..."
if [ -f "/home/james/SovereignOS/dna/SOVEREIGN_DNA.md" ]; then
  stage_with_timestamp "/home/james/SovereignOS/dna/SOVEREIGN_DNA.md" "$TARGET_NOTEBOOK_DIR/SOVEREIGN_DNA.md.txt"
fi
if [ -f "/home/james/SovereignOS/dna/bro_decoder_arch_ref.md" ]; then
  stage_with_timestamp "/home/james/SovereignOS/dna/bro_decoder_arch_ref.md" "$TARGET_NOTEBOOK_DIR/bro_decoder_arch_ref.md.txt"
fi
if [ -f "/home/james/sovereign_inbox/StackLabs_Syndicate_Master_Codex.md" ]; then
  stage_with_timestamp "/home/james/sovereign_inbox/StackLabs_Syndicate_Master_Codex.md" "$TARGET_NOTEBOOK_DIR/StackLabs_Syndicate_Master_Codex.md.txt"
fi
if [ -f "/home/james/sovereign_inbox/StackLabs_Stack_Seeder_Product_Datasheet.md" ]; then
  stage_with_timestamp "/home/james/sovereign_inbox/StackLabs_Stack_Seeder_Product_Datasheet.md" "$TARGET_NOTEBOOK_DIR/StackLabs_Stack_Seeder_Product_Datasheet.md.txt"
fi
if [ -f "/home/james/sovereign_inbox/StackLabs_Genesis_Chamber_Briefing.md" ]; then
  stage_with_timestamp "/home/james/sovereign_inbox/StackLabs_Genesis_Chamber_Briefing.md" "$TARGET_NOTEBOOK_DIR/StackLabs_Genesis_Chamber_Briefing.md.txt"
fi

# 4. Stage Telemetry Logs, Active Room Logs, Reports, and Walkthroughs from Today's Session
echo "📊 Staging active session logs, reports, and walkthroughs..."
for f in "$TODAY_DIR"/game_log_*.md; do
  if [ -f "$f" ]; then
    stage_with_timestamp "$f" "$TARGET_NOTEBOOK_DIR/$(basename "$f").txt"
  fi
done

if [ -f "$TODAY_DIR/statcast_telemetry.log" ]; then
  stage_with_timestamp "$TODAY_DIR/statcast_telemetry.log" "$TARGET_NOTEBOOK_DIR/statcast_telemetry.log.txt"
fi

if [ -f "/home/james/SovereignOS/reports/system_persona_audit.md" ]; then
  stage_with_timestamp "/home/james/SovereignOS/reports/system_persona_audit.md" "$TARGET_NOTEBOOK_DIR/system_persona_audit.md.txt"
fi

# Latest session report
LATEST_REPORT=$(find -L "${TODAY_DIR}" -name "SESSION_REPORT_*.md" -type f -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -n 1 | cut -d' ' -f2- || true)
if [ -n "${LATEST_REPORT}" ] && [ -f "${LATEST_REPORT}" ]; then
  stage_with_timestamp "${LATEST_REPORT}" "$TARGET_NOTEBOOK_DIR/ACTIVE_SESSION_REPORT.md.txt"
fi

# Latest walkthrough
LATEST_WALKTHROUGH=$(find -L "${TODAY_DIR}" "/home/james/sovereign_inbox/walkthroughs" -name "walkthrough_*.md" -type f -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -n 1 | cut -d' ' -f2- || true)
if [ -n "${LATEST_WALKTHROUGH}" ] && [ -f "${LATEST_WALKTHROUGH}" ]; then
  stage_with_timestamp "${LATEST_WALKTHROUGH}" "$TARGET_NOTEBOOK_DIR/ACTIVE_WALKTHROUGH.md.txt"
fi

# 4.5. Stage all walkthroughs and implementation plans for external agent ground truth
echo "📚 Staging all walkthroughs..."
mkdir -p "$TARGET_NOTEBOOK_DIR/walkthroughs"
find /home/james/sovereign_inbox/walkthroughs/ /home/james/sovereign_inbox/tickets/ -name "walkthrough_*.md" -type f 2>/dev/null | while read -r f; do
  if [ -f "$f" ]; then
    stage_with_timestamp "$f" "$TARGET_NOTEBOOK_DIR/walkthroughs/$(basename "$f").txt"
  fi
done

echo "📚 Staging all implementation plans..."
mkdir -p "$TARGET_NOTEBOOK_DIR/implementation_plans"
find /home/james/sovereign_inbox/implementation_plans/ /home/james/sovereign_inbox/tickets/ -name "implementation_plan_*.md" -type f 2>/dev/null | while read -r f; do
  if [ -f "$f" ]; then
    stage_with_timestamp "$f" "$TARGET_NOTEBOOK_DIR/implementation_plans/$(basename "$f").txt"
  fi
done


# 5. Stage Critical Synchronization Tokens (both at root and inside dna/ for compatibility)
if [ -f "$TARGET_NOTEBOOK_DIR/SYNC_ANCHOR_TOKEN.txt" ]; then
  cp "$TARGET_NOTEBOOK_DIR/SYNC_ANCHOR_TOKEN.txt" "$TARGET_NOTEBOOK_DIR/dna/SYNC_ANCHOR_TOKEN.txt"
fi

# 6. Execute the Laser-Targeted rclone Mirror Push
echo "🚀 Mirroring pristine session context to Google Drive remote..."
rclone sync "$TARGET_NOTEBOOK_DIR" "sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal" \
  --fast-list \
  --progress

if [ $? -eq 0 ]; then
  echo "🟢 SUCCESS: Ground truth successfully pushed. Safe to execute /sovereign_shutdown."
else
  echo "❌ ERROR: rclone handshake failed. Check Tailscale proxy routing tables."
  exit 1
fi