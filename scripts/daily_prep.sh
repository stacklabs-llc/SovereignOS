#!/bin/bash
# Sovereign FanStack Daily Prep Sequence
# Version 3.0 (Aligned with /fanstack_daily_prep SDLC workflow)
# Executes the complete 8-step daily sim ingestion and daemon cold-boot sequence.

set -e

# Enforce strict headless sandbox variables
export DISPLAY=""
export PLAYWRIGHT_HEADLESS=true


SOVEREIGN_HOME="/home/james/SovereignOS"
VENV_PYTHON="${SOVEREIGN_HOME}/.venv/bin/python3"
LOG_FILE="/tmp/daily_prep.log"

echo "============================================="
echo "  SOVEREIGN FANSTACK DAILY PREP INITIATED"
echo "  $(date)"
echo "============================================="

echo "[1/8] Running Yardbarker Entropy Pump..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/yardbarker_entropy_pump.py"

echo "[2/8] Sweeping Gmail for Promos..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/gmail_promo_sweeper.py"

echo "[3/8] Fetching MLB Schedule for Today..."
bash "${SOVEREIGN_HOME}/scripts/fanstack_mlb.sh" today

echo "[4/8] Performing Vertex Persona Audit..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/vertex_persona_audit.py"

echo "[5/8] Staging Rooms and Personas in DB..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/setup_all_rooms.py"

echo "[6/8] Restarting Sovereign Stack Daemons (Cold-Boot)..."
bash "${SOVEREIGN_HOME}/scripts/restart_stack.sh"

echo "[7/8] Deploying Barf Twitter Bot..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/barf_twitter_bot.py"

echo "[8/8] Running SDLC Persona Onboarder..."
"${VENV_PYTHON}" "${SOVEREIGN_HOME}/scripts/sdlc_persona_onboarder.py"

echo "============================================="
echo "  DAILY PREP COMPLETE"
echo "  $(date)"
echo "============================================="
