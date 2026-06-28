# 📖 SOVEREIGN OS SYSTEM GLOSSARY & STACK INVENTORY
**Location:** `/home/james/SovereignOS/dna/docs/SOVEREIGN_OS_GLOSSARY.md`
**Last Updated:** 2026-06-20 (SOW-08 Unified Telemetry Redesign)

This document serves as the canonical, system-wide glossary and active inventory for all elements of Sovereign OS. It details every frontend stack, backend service, database table, background daemon, and cloud sync remote configuration across the mesh network.

---

## 🗂️ 1. Directory-Prefix Stack Inventory (01-04 & 14-23)

Sovereign OS organizes its application services using numeric prefix boundaries. All stacks matching these boundaries—including active, planned, or legacy concepts—are inventoried below.

| Prefix | Stack Directory | Default Port | Status | Purpose & Description |
| :--- | :--- | :---: | :---: | :--- |
| **`01_`** | `01_Sovereign_Portal` | `3016` | **ACTIVE** | **Sovereign OS Shell / Workspace Launcher**: The centralized launcher and shell UI for the workstation, allowing the Pilot to monitor background service health, view active networks, and transition between outposts. |
| **`02_** | `02_Sovereign_Media` | `3008` | **ACTIVE** | **Sovereign Cinema UI / Media Controller**: Visual interface to control media libraries, list movie directories, cast streams to argo/hobbes kiosks via HDMI-CEC, and manage WebRTC telepresence grids. |
| **`03_`** | `03_Media_Stack` | — | **STAGED** | **Media Ingestion & Codec Stack**: Lower-level video transformation utilities, stream compression configurations, and pipeline templates for broadcasting live feeds and rendering overlays. |
| **`04_`** | `04_Sovereign_Core` | `5051` | **ACTIVE** | **Core Monolith APIs**: The backend control center housing authentication engines (Port 5055), low-level admin controllers (Port 5056), and the voice/alert routing logic (Port 8090). |
| **`14_`** | `14_SamTracker` | `3004` | **ACTIVE** | **Active Simulation & Sports Telemetry**: Displays gameday matchups, pitcher release angles, and tracking metrics. Directly couples to the Generative Comic Factory pipeline to render live 5-panel comic strips. |
| **`15_`** | `15_FanStack` | `3009` | **ACTIVE** | **Sports Watch Party Portal**: The client chatroom and commentary hub for live watch parties, containing live stadium commentator streams, advocate rosters, and custom soundboard triggers. |
| **`16_`** | `16_StackLabsLLC` | `3000` | **ACTIVE** | **StackLabs Gateway**: Corporate landing page and prospectus dashboard. Renders cyberpunk-themed blueprints, dual-updated investor metrics, and terminal-styled portfolio trackers. |
| **`17_`** | `17_GonzasCantina` | `3022` | **PLANNED** | **Gonzas Convenience Store & Cantina**: Bodega transaction tracker and 24/7/365 Mexican Cantina lookbook, simulating local inventory metrics and generating custom regional advocates. |
| **`18_`** | `18_BarbStack` | `3020` | **ACTIVE** | **Barb's Cockpit & Smyrna Sentinel**: Personal dashboard configured for Barb to monitor daily Smyrna care feeds, medical timelines, and local package/groceries delivery logs. |
| **`19_`** | `19_Sovereign_Sports` | `3010` | **ACTIVE** | **Sports Production Overlay**: Interface mimicking a live sports broadcast truck, containing controls to trigger stream relays, customize scoreboard overlays, and adjust camera angles. |
| **`20_`** | `20_AetherVet` | `3015` | **ACTIVE** | **AetherVet Telemedicine**: Smyrna clinical portal for managing healthcare records, oncology scans, lab results, and real-time medical task checklists. |
| **`21_`** | `21_Wildseed_GardenStack` | `3024` | **PLANNED** | **Wildseed Garden Stack / Manufacture OS**: Living-soil brand identity tracker, organic soil mix telemetry logs, botanical cataloging templates, and the Wildseed Garden Club dashboard. |
| **`22_`** | `22_SpiteSlice` | `3023` | **PLANNED** | **Spite Slice Pizzeria**: Delivery tracking dashboard, rogue customer grudge matrices, and interactive pizza-making gameplay schemas. |
| **`23_`** | `23_EileenStack` | `3017` | **ACTIVE** | **Storybook Station Care & Connection Hub**: High-contrast, warm-serif tablet console scaled for senior readability, integrating HoloLink telepresence, TV controls, and a giant walker helper alert button. |

---

## 🔌 2. Complete Port Manifest & API Services

These network ports govern the routing of Sovereign OS mesh services, REST APIs, and WebSockets.

### 🌐 Frontend UI Ports
*   **`3000`** | **StackLabs Gateway** (Vite/React client)
*   **`3004`** | **SamTracker Frontend** (Vite/React client)
*   **`3008`** | **Sovereign Cinema UI** (Vite/React client)
*   **`3009`** | **FanStack Portal** (Vite/React client)
*   **`3010`** | **Sovereign Sports Telemetry UI** (Vite/React client)
*   **`3015`** | **AetherVet Telemedicine** (Vite/React client)
*   **`3016`** | **Sovereign OS Portal** (Vite/React client)
*   **`3017`** | **Storybook Station / Cozy Hearth Console** (Vite/React client)
*   **`3020`** | **BarbStack Personal Cockpit** (Vite/React client)
*   **`7300`** | **Catnip Wars Sandbox** (Vite/React game kiosk)

### ⚙️ Backend API & WebSocket Ports
*   **`5000`** | **Sandbox Admin API**: Flask API handling sandbox character state updates and card mutations.
*   **`5051`** | **Sovereign OS Core**: FastAPI system controller coordinating micro-services and state directories.
*   **`5055`** | **Sovereign OS Auth**: Identity validator and domain-scoped cookie manager for Tailscale sessions.
*   **`5056`** | **Sovereign Admin API**: Administrative script target and hardware telemetry monitor.
*   **`8000`** | **M.A.R.D REST API**: Serves chatroom configurations, rants, and commentator hot takes.
*   **`8008`** | **M.A.R.D WebSockets**: Real-time commentator stream and watch party chat message broker.
*   **`8012`** | **HoloLink WebRTC Signaling**: Presence tracker and peer connection signaling server.
*   **`8015`** | **Comet Relay WS**: Radio-styled messenger server for priority family alerts and provisions coordinates.
*   **`8085`** | **Sovereign Cinema API**: FastAPI server hosting local video lists and HTTP Range streaming.
*   **`8088`** | **Sovereign Dead Drop**: Tailscale-proxied Flask server for air-gapped media ingestion.
*   **`8090`** | **Sovereign Core Monolith**: Unified API exposing prompt decoders, macro matrices, and voice self-healing.
*   **`8095`** | **SDLC Ticketing API**: Serves tickets, attachments, and the integrated SDLC Portal.
*   **`8097`** | **Sovereign Stream Relay**: Live stream proxy routing external HLS feeds.
*   **`11434`**| **Ollama Local LLM**: Engine running local models for offline agent processing fallbacks.

---

## 🛠️ 3. Power Tools & System Daemons

Sovereign OS utilizes dedicated daemons to automate background ingestion, health monitoring, resource management, and file organization.

*   **Decision Derby (`scripts/organize_inbox.py`)**: Background file organization tool. It monitors `/home/james/sovereign_inbox/` for newly dropped files, semantically reads their content, and routes them to target subfolders (`reports/`, `walkthroughs/`, etc.), registering an audit ticket in `sovereign_now.db` for each action.
*   **Mando Watchdog (`scripts/mando_watchdog.py`)**: Physical hardware and software health sentinel. Runs on loopback (`127.0.0.1`) to check service endpoints and log ITSM tickets (`INC`) inside SQLite if a process crashes or becomes unresponsive.
*   **Clio Admin Cockpit (`scripts/clio_admin.sh`)**: Mobile-optimized command console wrapper. Consolidates diagnostics, Tailscale serve status, real-time log outputs, and background service loops into a simple terminal GUI.
*   **Ollama Governor (`scripts/ollama_governor.py`)**: Works to prevent CPU/memory starvation on Clio. Automatically shuts down the local Ollama LLM server when live baseball games are active, shifting chat agents to cloud APIs.
*   **Stream Sniper (`scripts/stream_sniper_daemon.py`)**: Monitors baseball streams, executing video capture, transcription, and summarization pipelines to feed real-time comments to chatrooms.
*   **Comet Relay Daemon (`scripts/comet_relay.py`)**: Listens for high-priority caregiver notifications and walker alerts, broadcasting immediate notifications to the active portals.
*   **Gameday Continuous Sync (`scripts/gameday_continuous_sync.py`)**: Live poller pulling Statcast telemetry and MLB schedule updates, parsing them into structured comment seeds for chat commentator personas.
*   **Wildcard Forge (`scripts/generate_universal_advocate.py`)**: AI script generating complete, multi-modal advocate personas with custom system prompts, traits, and colors.

---

## 🗄️ 4. Canonical Databases & Schemas

The single source of truth for system state, ticketing, and configurations is the SQLite database:
`/home/james/SovereignOS/dna/sovereign_now.db`

### 🔑 Essential SQLite Tables
*   **`sovereign_tickets`**: Unified table tracking all ITSM and SDLC requests. Replaces legacy individual tables to prevent schema fragmentation. Contains `STRY`, `DFCT`, `ENHC`, and `INC` tickets.
*   **`sys_user`**: Holds system operators, clinical contacts, and family members. Stores credential hashes, sports team allegiances, and user-profile settings.
*   **`persona`**: Stores active AI commentator/advocate parameters, system prompts, accent colors, and canned comment pools.
*   **`sys_sdlc_task`**: Tracks development checklist tasks mapped to specific portal targets.
*   **`cmdb_ci_hardware` / `cmdb_ci_appl`**: Tracks physical servers (IPs, Tailscale MAC addresses) and deployed software daemons.
*   **`sys_attachment`**: Maps walkthrough markdown documents and diagnostics reports directly to their parent tickets.
*   **`rpg_world_state`**: Captures active sandbox coordinates, zones, tension values, and card layout files.
*   **`game_play`**: Stores MLB Statcast telemetry, pitch velocities, pitch types, at-bat descriptions, and live scoreboard logs.
*   **`pga_tournament_telemetry`**: Stores PGA ShotLink shot-by-shot physics (ball speed, spin rate, launch angle, distance to pin) for active golfers.
*   **`pga_active_leaderboard`**: Tracks active golfer tournament standings, positions, and cumulative scores-to-par.
*   **`soccer_incident_ingress`**: Ingests live soccer match occurrences (goals, cards, fouls, substitutions) and leverage delta indexes.

---

## 📡 5. Google Drive Sync Engine (`rclone`)

To maintain absolute sync across the mesh network and enable seamless handoffs between active coding agents, system data is pushed to Google Drive.

### 👥 Mapped Remotes
1.  **`sovereign_os:`** Mapped to `sovereign.os.v1@gmail.com`. Backs up session reports, system logs, architectural blue prints (DNA), walkthrough reports, and the daily inbox folders.
2.  **`gdrive:`** Mapped to `sovereign.fanstack@gmail.com`. Manages sports logs, persona prompt caches, and backups of the `15_FanStack` codebase.

### 📂 Canonical Sync Locations
*   **Clio Inbox Sync Directory**:
    `sovereign_os:SovereignOS_Clio_Sync/sovereign_inbox/`
*   **Active Session Ingestion Folder**:
    `sovereign_os:SovereignOS/Inbox/$(date +%Y-%m-%d)/`
*   **Monolithic NotebookLM Context Folder**:
    `sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal/`
    *(Holds the combined codebase files, schema documents, and latest session logs for multi-turn agent reference).*
