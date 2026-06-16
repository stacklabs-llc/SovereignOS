#!/bin/bash
# =============================================================================
# SOVEREIGN OS — FANSTACK STACK RESTART
# Version: 2.0 (Hot/Cold Storage Architecture)
# Revised: 2026-05-20
#
# SDLC INVARIANTS:
#   • Idempotent: Safe to run against a live or dead stack — each section
#     self-compensates for missing or already-running processes.
#   • Surgical pkill: Targets exact script strings. Never uses broad killall
#     python3 — doing so would destroy sovereign_core_api, sdlc_portal_server,
#     sam_tracker, and any other non-FanStack Python daemons on clio.
#   • Log routing: All daemon stdout/stderr → /home/james/SovereignOS/logs/
#     (not /tmp) to maintain persistent audit trails across reboots.
#   • Statcast Sentinel: Wired into daemon stack via venv binary. Schema
#     bootstrap (_ensure_schema) is idempotent — safe on every boot.
#   • Inbox symlink: Gracefully advances or validates the 'today' symlink.
#     Exits cleanly if symlink is already correct. Never errors on a fresh day.
# =============================================================================

set -euo pipefail

# Enforce strict headless sandbox variables
export DISPLAY=""
export PLAYWRIGHT_HEADLESS=true


# --- PATHS -------------------------------------------------------------------
SOVEREIGN_HOME="/home/james/SovereignOS"
VENV_PYTHON="${SOVEREIGN_HOME}/.venv/bin/python3"
SCRIPTS_DIR="${SOVEREIGN_HOME}/scripts"
FANSTACK_DIR="${SOVEREIGN_HOME}/15_FanStack"
LOG_DIR="${SOVEREIGN_HOME}/logs"
INBOX_DIR="/home/james/sovereign_inbox"

# --- COLORS (non-interactive safe) ------------------------------------------
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'
CYN='\033[0;36m'; BLD='\033[1m'; RST='\033[0m'

log_info()  { echo -e "${CYN}[INFO]${RST}  $*"; }
log_ok()    { echo -e "${GRN}[OK]${RST}    $*"; }
log_warn()  { echo -e "${YLW}[WARN]${RST}  $*"; }
log_err()   { echo -e "${RED}[ERROR]${RST} $*"; }
log_phase() { echo -e "\n${BLD}${YLW}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"; }

# =============================================================================
# PHASE 0: PRE-FLIGHT VALIDATION
# =============================================================================
log_phase "PHASE 0: PRE-FLIGHT VALIDATION"

cd "${SOVEREIGN_HOME}"
log_info "Working directory: $(pwd)"

# Validate venv binary exists before any launch attempt
if [[ ! -x "${VENV_PYTHON}" ]]; then
    log_err "venv Python not found at ${VENV_PYTHON}. Aborting."
    exit 1
fi
log_ok "venv Python: ${VENV_PYTHON}"

# Ensure logs directory exists (it should — confirmed on disk — but defensive)
mkdir -p "${LOG_DIR}"
log_ok "Log directory: ${LOG_DIR}"

# Ensure game_states directory exists for the hot cache layer
mkdir -p "${SOVEREIGN_HOME}/game_states"
log_ok "Hot cache directory: ${SOVEREIGN_HOME}/game_states"

# =============================================================================
# PHASE 1: INBOX SYMLINK ADVANCEMENT
# =============================================================================
log_phase "PHASE 1: INBOX SYMLINK ADVANCEMENT"

# Derive today's expected inbox directory name from the local wall clock.
# Format must match the existing convention: daily_MMDDYYYY
TODAY_FOLDER="daily_$(date +%m%d%Y)"
TARGET_DIR="${INBOX_DIR}/${TODAY_FOLDER}"
SYMLINK_PATH="${INBOX_DIR}/today"

log_info "Expected inbox folder: ${TODAY_FOLDER}"

# Create today's inbox directory if it doesn't exist
if [[ ! -d "${TARGET_DIR}" ]]; then
    mkdir -p "${TARGET_DIR}"
    log_ok "Created inbox directory: ${TARGET_DIR}"
else
    log_ok "Inbox directory already exists: ${TARGET_DIR}"
fi

# Read current symlink target (if any)
if [[ -L "${SYMLINK_PATH}" ]]; then
    CURRENT_TARGET=$(readlink -f "${SYMLINK_PATH}" 2>/dev/null || echo "BROKEN")
    EXPECTED_TARGET="${TARGET_DIR}"

    if [[ "${CURRENT_TARGET}" == "${EXPECTED_TARGET}" ]]; then
        log_ok "Symlink 'today' is already correctly mapped → ${TODAY_FOLDER}"
    else
        # Atomically advance the symlink via tmp + mv -T to prevent directory nesting
        CURRENT_NAME=$(basename "${CURRENT_TARGET}" 2>/dev/null || echo "unknown")
        log_warn "Advancing symlink: ${CURRENT_NAME} → ${TODAY_FOLDER}"
        ln -sfn "${TARGET_DIR}" "${SYMLINK_PATH}.tmp"
        mv -fT "${SYMLINK_PATH}.tmp" "${SYMLINK_PATH}"
        log_ok "Symlink advanced → ${TODAY_FOLDER}"
    fi
else
    # No symlink present — create it from scratch
    log_warn "No 'today' symlink found. Creating fresh link → ${TODAY_FOLDER}"
    ln -sfn "${TARGET_DIR}" "${SYMLINK_PATH}"
    log_ok "Symlink created → ${TODAY_FOLDER}"
fi

# =============================================================================
# PHASE 2: TARGETED PROCESS CLEANUP
# =============================================================================
# CRITICAL SDLC RULE: We use exact pkill -f strings that match ONLY the three
# FanStack-specific daemon scripts. We do NOT use `killall python3` because clio
# runs sovereign_core_api.py, sdlc_portal_server.py, sam_tracker_server.py, and
# other mission-critical daemons on the same Python runtime. Broad kills would
# tear down the mesh mid-session, creating INC-worthy outages.
# =============================================================================
log_phase "PHASE 2: TARGETED PROCESS CLEANUP"

_pkill_daemon() {
    local label="$1"
    local pattern="$2"
    if pkill -15 -f "${pattern}" 2>/dev/null; then
        log_ok "SIGTERM sent to: ${label}"
    else
        log_info "Not running (clean state): ${label}"
    fi
}

# Send SIGTERM first — allows asyncio event loops to flush gracefully.
# If a process ignores SIGTERM after the grace period, SIGKILL follows.
_pkill_daemon "fanstack_background_poller" "fanstack_background_poller.py"
_pkill_daemon "fanstack_chatbots"          "fanstack_chatbots.py"
_pkill_daemon "statcast_sentinel"          "statcast_sentinel.py"
_pkill_daemon "tmi_daemon"                 "tmi_daemon.py"

# Preservation rule: Do not kill port 8000/8008 (fanstack_relay) if it is already healthy,
# to avoid dropping active live streaming WebSockets for other parallel sessions.
if ss -tlnp 2>/dev/null | grep -q ':8000'; then
    log_info "Preserving healthy fanstack_relay (Port 8000 is active). Skipping relay cleanup."
else
    _pkill_daemon "fanstack_relay"             "fanstack_relay.py"
fi

_pkill_daemon "fanstack_admin_api"         "fanstack_admin_api.py"
_pkill_daemon "fanstack_server"            "fanstack_server.py"
_pkill_daemon "stream_sniper_daemon"       "stream_sniper_daemon.py"
_pkill_daemon "dvr_controller_v2"          "dvr_controller_v2.py"
_pkill_daemon "cmdb_server"               "cmdb_server.py"
_pkill_daemon "gameday_continuous_sync"    "gameday_continuous_sync.py"
_pkill_daemon "cron_game_monitor"          "cron_game_monitor.py"

# Also send SIGTERM to the other core backends and watchdog
_pkill_daemon "sovereign_core_api"          "sovereign_core_api.py"
_pkill_daemon "sdlc_portal_server"         "sdlc_portal_server.py"
_pkill_daemon "sam_tracker_server"         "sam_tracker_server.py"
_pkill_daemon "theater_media_server"       "theater_media_server.py"
_pkill_daemon "mando_watchdog"              "mando_watchdog.py"

# --- Grace period: allow asyncio loops to exit cleanly before SIGKILL ---
log_info "Grace period (3s) for asyncio loops to drain..."
sleep 3

# --- SIGKILL mop-up: any process that survived SIGTERM ---
_pkill9_daemon() {
    local label="$1"
    local pattern="$2"
    if pkill -9 -f "${pattern}" 2>/dev/null; then
        log_warn "Force-killed (did not exit on SIGTERM): ${label}"
    fi
}
_pkill9_daemon "fanstack_background_poller" "fanstack_background_poller.py"
_pkill9_daemon "fanstack_chatbots"          "fanstack_chatbots.py"
_pkill9_daemon "statcast_sentinel"          "statcast_sentinel.py"
_pkill9_daemon "tmi_daemon"                 "tmi_daemon.py"

if ss -tlnp 2>/dev/null | grep -q ':8000'; then
    log_info "Preserving healthy fanstack_relay (Port 8000 is active). Skipping relay SIGKILL."
else
    _pkill9_daemon "fanstack_relay"             "fanstack_relay.py"
fi

_pkill9_daemon "fanstack_admin_api"         "fanstack_admin_api.py"
_pkill9_daemon "gameday_continuous_sync"    "gameday_continuous_sync.py"
_pkill9_daemon "cron_game_monitor"          "cron_game_monitor.py"

_pkill9_daemon "sovereign_core_api"          "sovereign_core_api.py"
_pkill9_daemon "sdlc_portal_server"         "sdlc_portal_server.py"
_pkill9_daemon "sam_tracker_server"         "sam_tracker_server.py"
_pkill9_daemon "theater_media_server"       "theater_media_server.py"
_pkill9_daemon "mando_watchdog"              "mando_watchdog.py"

# Release all Vite/React frontend port bindings if held
log_info "Releasing frontend port bindings..."
for port in 3000 3004 3006 3008 3009 3010 3015 3016 3017 3020 7300; do
    if fuser ${port}/tcp &>/dev/null; then
        log_warn "Port ${port} still bound. Releasing..."
        fuser -k ${port}/tcp 2>/dev/null || true
    fi
done

log_ok "Process cleanup complete."
sleep 1

# =============================================================================
# PHASE 3: DEPENDENCY LAYER — RELAY + ADMIN API
# =============================================================================
# fanstack_relay.py is the WebSocket mesh hub. chatbots and poller both
# connect TO it — they must not launch until the relay is accepting connections.
# Explicit sleep prevents [Errno 111] Connection Refused race conditions on boot.
# =============================================================================
log_phase "PHASE 3: DEPENDENCY LAYER — RELAY + ADMIN API"

if ss -tlnp 2>/dev/null | grep -q ':8000'; then
    log_ok "fanstack_relay.py is already running on Port 8000. Preserving running instance."
else
    log_info "Launching fanstack_relay.py (Port 8008)..."
    nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/fanstack_relay.py" \
        >> "${LOG_DIR}/fanstack_relay.log" 2>&1 &
    log_ok "fanstack_relay.py → PID $! → ${LOG_DIR}/fanstack_relay.log"
    log_info "Waiting 4s for relay to bind Port 8008..."
    sleep 4
fi

log_info "Launching fanstack_admin_api.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/fanstack_admin/fanstack_admin_api.py" \
    >> "${LOG_DIR}/fanstack_admin.log" 2>&1 &
log_ok "fanstack_admin_api.py → PID $! → ${LOG_DIR}/fanstack_admin.log"

log_info "Waiting 2s for admin API..."
sleep 2

# Pulse-check: verify relay is actually listening before proceeding
if ! ss -tlnp 2>/dev/null | grep -q ':8008'; then
    log_warn "Port 8008 not detected. Relay may still be initializing — proceeding cautiously."
else
    log_ok "Port 8008 confirmed open. Relay is ready."
fi

# =============================================================================
# PHASE 4: CORE FANSTACK DAEMONS
# =============================================================================
# Launch ORDER matters:
#   1. fanstack_chatbots.py  — Connects to relay; must be up before poller
#      starts emitting CMD_SYNC_STATE events to prevent missed first pitch.
#   2. fanstack_background_poller.py — Starts emitting live telemetry immediately.
#      If chatbots aren't ready, the first few STATE_UPDATE events are benign drops.
#   3. statcast_sentinel.py — Cold DB ingestion daemon. Entirely decoupled from
#      the WebSocket mesh. Runs on its own 15-30 minute polling cycle.
#      No ordering dependency — can launch any time after schema bootstrap.
# =============================================================================
log_phase "PHASE 4: CORE FANSTACK DAEMONS"

log_info "Launching fanstack_chatbots.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/fanstack_chatbots.py" \
    >> "${LOG_DIR}/fanstack_chatbots.log" 2>&1 &
log_ok "fanstack_chatbots.py → PID $! → ${LOG_DIR}/fanstack_chatbots.log"

sleep 2

log_info "Launching fanstack_background_poller.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/fanstack_background_poller.py" \
    >> "${LOG_DIR}/fanstack_poller.log" 2>&1 &
log_ok "fanstack_background_poller.py → PID $! → ${LOG_DIR}/fanstack_poller.log"

log_info "Launching tmi_daemon.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/tmi_daemon.py" \
    >> "${LOG_DIR}/tmi_daemon.log" 2>&1 &
log_ok "tmi_daemon.py → PID $! → ${LOG_DIR}/tmi_daemon.log"

log_info "Launching statcast_sentinel.py (via venv — pybaseball/sqlalchemy deps)..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/statcast_sentinel.py" \
    >> "${LOG_DIR}/statcast_sentinel.log" 2>&1 &
log_ok "statcast_sentinel.py → PID $! → ${LOG_DIR}/statcast_sentinel.log"

# =============================================================================
# PHASE 5: AUXILIARY DAEMONS
# =============================================================================
log_phase "PHASE 5: AUXILIARY DAEMONS"

log_info "Launching cmdb_server.py (Port 8082)..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/cmdb_server.py" \
    >> "${LOG_DIR}/cmdb.log" 2>&1 &
log_ok "cmdb_server.py → PID $! → ${LOG_DIR}/cmdb.log"

log_info "Launching stream_sniper_daemon.py (Port 5056)..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/stream_sniper_daemon.py" \
    >> "${LOG_DIR}/fanstack_sniper.log" 2>&1 &
log_ok "stream_sniper_daemon.py → PID $!"

log_info "Launching dvr_controller_v2.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/dvr_controller_v2.py" \
    >> "${LOG_DIR}/dvr_5051.log" 2>&1 &
log_ok "dvr_controller_v2.py → PID $!"

log_info "Launching gameday_continuous_sync.py in background daemon mode (no rclone)..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/gameday_continuous_sync.py" --daemon --no-rclone \
    >> "${LOG_DIR}/gameday_sync.log" 2>&1 &
log_ok "gameday_continuous_sync.py → PID $! → ${LOG_DIR}/gameday_sync.log"

log_info "Launching cron_game_monitor.py..."
nohup "${VENV_PYTHON}" -u "${SCRIPTS_DIR}/cron_game_monitor.py" \
    >> "${LOG_DIR}/cron_game_monitor.log" 2>&1 &
log_ok "cron_game_monitor.py → PID $! → ${LOG_DIR}/cron_game_monitor.log"


# =============================================================================
# PHASE 6: FANSTACK VITE FRONTEND (Port 3009)
# =============================================================================
log_phase "PHASE 6: FANSTACK VITE FRONTEND"

log_info "Launching FanStack Vite dev server (Port 3009)..."
cd "${FANSTACK_DIR}"
nohup npm run dev >> "${LOG_DIR}/vite.log" 2>&1 &
disown $!
log_ok "Vite dev server → PID $! → ${LOG_DIR}/vite.log"
cd "${SOVEREIGN_HOME}"

# =============================================================================
# PHASE 6.1: CORE BACKEND DAEMONS
# =============================================================================
log_phase "PHASE 6.1: CORE BACKEND DAEMONS"

log_info "Launching Sovereign Core API & Auth on Port 8090..."
nohup "${VENV_PYTHON}" "${SCRIPTS_DIR}/sovereign_core_api.py" >> "${LOG_DIR}/sovereign_core_8090.log" 2>&1 &
log_ok "Sovereign Core API → PID $! → ${LOG_DIR}/sovereign_core_8090.log"

log_info "Launching SDLC Ticketing Server on Port 8095..."
nohup "${VENV_PYTHON}" "${SCRIPTS_DIR}/sdlc_portal_server.py" >> "${LOG_DIR}/sdlc_portal_server.log" 2>&1 &
log_ok "SDLC Ticketing Server → PID $! → ${LOG_DIR}/sdlc_portal_server.log"

log_info "Launching SamTracker Backend on Port 8083..."
nohup "${VENV_PYTHON}" "${SCRIPTS_DIR}/sam_tracker_server.py" >> "${LOG_DIR}/sam_tracker.log" 2>&1 &
log_ok "SamTracker Backend → PID $! → ${LOG_DIR}/sam_tracker.log"

log_info "Launching Theater Media Server on Port 8085..."
nohup "${VENV_PYTHON}" "${SCRIPTS_DIR}/theater_media_server.py" >> "${LOG_DIR}/theater_media_8085.log" 2>&1 &
log_ok "Theater Media Server → PID $! → ${LOG_DIR}/theater_media_8085.log"

# =============================================================================
# PHASE 6.2: DYNAMIC FRONTEND STACK
# =============================================================================
log_phase "PHASE 6.2: DYNAMIC FRONTEND STACK"

_launch_vite() {
    local label="$1"
    local dir="$2"
    local port="$3"
    local extra_args="${4:-}"
    local logfile="${5:-vite_$(echo "${label}" | tr ' ' '_' | tr 'A-Z' 'a-z').log}"

    if [[ -d "${dir}" ]]; then
        log_info "Launching ${label} (Port ${port})..."
        cd "${dir}"
        nohup npm run dev -- --force --port "${port}" ${extra_args} >> "${LOG_DIR}/${logfile}" 2>&1 &
        disown $!
        log_ok "${label} Vite dev server → PID $! → ${LOG_DIR}/${logfile}"
        cd "${SOVEREIGN_HOME}"
        sleep 0.5
    else
        log_warn "Directory ${dir} not found. Skipping ${label}."
    fi
}

_launch_vite "StackLabs Monolith" "${SOVEREIGN_HOME}/16_StackLabsLLC" "3000" "--host 0.0.0.0" "vite_stacklabs.log"
_launch_vite "Sovereign OS Portal" "${SOVEREIGN_HOME}/01_Sovereign_Portal" "3016" "--host 0.0.0.0" "vite_portal.log"
_launch_vite "SamTracker Frontend" "${SOVEREIGN_HOME}/14_SamTracker" "3004" "" "vite_sam.log"
_launch_vite "Sovereign Media" "${SOVEREIGN_HOME}/02_Sovereign_Media" "3008" "--host 0.0.0.0" "vite_cinema.log"
_launch_vite "Sovereign Sports" "${SOVEREIGN_HOME}/19_Sovereign_Sports" "3010" "--host 0.0.0.0" "vite_sports.log"
_launch_vite "Aether Vet Telemedicine" "${SOVEREIGN_HOME}/20_AetherVet" "3015" "--host 0.0.0.0" "aether_vet.log"
_launch_vite "Storybook Station" "${SOVEREIGN_HOME}/23_EileenStack" "3017" "" "vite_garden.log"
_launch_vite "Barb's Stack" "${SOVEREIGN_HOME}/18_BarbStack" "3020" "" "vite_barb.log"
_launch_vite "Catnip Wars Sandbox" "/home/james/SovereignOS-sandbox/catnip-wars" "7300" "" "vite_catnip_wars.log"
_launch_vite "BistroPortal" "${SOVEREIGN_HOME}/16_BistroPortal" "3006" "" "vite_bistro.log"

# =============================================================================
# PHASE 6.3: MANDO WATCHDOG DAEMON
# =============================================================================
log_phase "PHASE 6.3: MANDO WATCHDOG DAEMON"
log_info "Launching mando_watchdog.py..."
nohup python3 "${SCRIPTS_DIR}/mando_watchdog.py" >> "${LOG_DIR}/mando_watchdog.log" 2>&1 &
log_ok "mando_watchdog.py → PID $! → ${LOG_DIR}/mando_watchdog.log"

# =============================================================================
# PHASE 7: POST-LAUNCH VERIFICATION
# =============================================================================
log_phase "PHASE 7: POST-LAUNCH VERIFICATION"

# Allow all daemons 8s to initialize before status check
log_info "Waiting 8s for daemon initialization..."
sleep 8

echo ""
echo -e "${BLD}  PROCESS STATUS${RST}"
echo -e "  ─────────────────────────────────────────────────"

_check_proc() {
    local label="$1"
    local pattern="$2"
    local pid
    pid=$(pgrep -f "${pattern}" | head -1 2>/dev/null || true)
    if [[ -n "${pid}" ]]; then
        echo -e "  ${GRN}✓${RST} ${label} (PID: ${pid})"
    else
        echo -e "  ${RED}✗${RST} ${label} — NOT RUNNING"
    fi
}

_check_proc "fanstack_relay.py"             "fanstack_relay.py"
_check_proc "fanstack_admin_api.py"         "fanstack_admin_api.py"
_check_proc "fanstack_chatbots.py"          "fanstack_chatbots.py"
_check_proc "fanstack_background_poller.py" "fanstack_background_poller.py"
_check_proc "tmi_daemon.py"                 "tmi_daemon.py"
_check_proc "cmdb_server.py"                "cmdb_server.py"
_check_proc "statcast_sentinel.py"          "statcast_sentinel.py"
_check_proc "stream_sniper_daemon.py"       "stream_sniper_daemon.py"
_check_proc "dvr_controller_v2.py"          "dvr_controller_v2.py"
_check_proc "gameday_continuous_sync.py"    "gameday_continuous_sync.py"
_check_proc "cron_game_monitor.py"          "cron_game_monitor.py"
_check_proc "sovereign_core_api.py"         "sovereign_core_api.py"
_check_proc "sdlc_portal_server.py"         "sdlc_portal_server.py"
_check_proc "sam_tracker_server.py"         "sam_tracker_server.py"
_check_proc "theater_media_server.py"       "theater_media_server.py"
_check_proc "mando_watchdog.py"             "mando_watchdog.py"

echo ""
echo -e "${BLD}  PORT BINDINGS${RST}"
echo -e "  ─────────────────────────────────────────────────"
for port in 8008 3009 8082 8090 8095 8083 8085 3000 3016 3004 3008 3010 3015 3017 3020 7300; do
    if ss -tlnp 2>/dev/null | grep -q ":${port}"; then
        echo -e "  ${GRN}✓${RST} Port ${port} is bound"
    else
        echo -e "  ${YLW}~${RST} Port ${port} not yet bound (may still be initializing)"
    fi
done

echo ""
echo -e "${BLD}  LOG TAILS (last 3 lines each)${RST}"
echo -e "  ─────────────────────────────────────────────────"

_tail_log() {
    local label="$1"
    local logfile="$2"
    echo -e "  ${CYN}[${label}]${RST}"
    if [[ -f "${logfile}" ]]; then
        tail -3 "${logfile}" 2>/dev/null | sed 's/^/    /'
    else
        echo "    (log file not yet created)"
    fi
}

_tail_log "relay"    "${LOG_DIR}/fanstack_relay.log"
_tail_log "tmi_daemon" "${LOG_DIR}/tmi_daemon.log"
_tail_log "chatbots" "${LOG_DIR}/fanstack_chatbots.log"
_tail_log "poller"   "${LOG_DIR}/fanstack_poller.log"
_tail_log "cmdb"     "${LOG_DIR}/cmdb.log"
_tail_log "sentinel" "${LOG_DIR}/statcast_sentinel.log"
_tail_log "vite"     "${LOG_DIR}/vite.log"
_tail_log "sync"     "${LOG_DIR}/gameday_sync.log"
_tail_log "monitor"  "${LOG_DIR}/cron_game_monitor.log"

echo ""
echo -e "${BLD}  INBOX SYMLINK${RST}"
echo -e "  ─────────────────────────────────────────────────"
echo -e "  ${CYN}today →${RST} $(readlink -f "${INBOX_DIR}/today" 2>/dev/null || echo 'ERROR: broken symlink')"

echo ""
log_ok "=== SOVEREIGN FANSTACK STACK RESTART COMPLETE ==="
