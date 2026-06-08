# Sovereign OS Context Sync Package — 2026-05-22
**Destination:** `/home/james/sovereign_inbox/today/claude_context_sync.md`  
**Purpose:** Comprehensive current-state alignment for the Bro-Decoder AI assistant (Claude.ai).

---

## 1. Current Node Topology

All communications within the Sovereign OS mesh MUST resolve via Tailscale MagicDNS hostnames instead of hardcoded local IPs (strict compliance with **KI-001**).

| Node Name | Tailscale IP | LAN IP / Type | Role & Services Running |
| :--- | :--- | :--- | :--- |
| **`clio`** | `100.73.155.70` | Workstation | **Central Server / Primary Worker**. Runs the Sovereign Portal, SDLC Ticketing Backend, FastAPI Admin/Core APIs, M.A.R.D WebSocket Engine, Bistro Backend, and FanStack sports telemetry loops. |
| **`argo`** | `100.123.68.9` | `192.168.1.75` (TV Kiosk) | **Entertainment & Vision Kiosk**. Runs Sovereign Cinema player, `launch_cinema` Chromium instance, and the Hailo AI feed camera (`argo-vision-cam`). |
| **`hobbes`** | `100.88.5.122` | Host Node | General mesh node; designated hardware migration target. |
| **`calvin`** | `100.77.60.67` | Host Node | General mesh node; running persistent local backup loops. |
| **`pegasus`** | `100.90.6.117` | Host Node | Host daemon node. |
| **`grogu`** | `100.77.138.27` | Host Node | Micro-services worker. |
| **`artemis`** | `100.70.84.19` | Host Node | Secondary telemetry daemon runner. |
| **`mando`** | — | `192.168.1.116` | Active hardware watchdog / alerting ping-node. |
| **`stimpy`** | — | `192.168.1.186` | Legacy hardware node. |
| **`Android-2`**| — | `192.168.1.111` | Local mobile command telemetry. |

---

## 2. Active Port Manifest

This manifest maps currently active and validated ports bound to services running on **`clio`** (`100.73.155.70`).

| Port | Service Name | Protocol / Backend | Description |
| :--- | :--- | :--- | :--- |
| **`3000`** | **Sovereign OS Portal** | Vite / React Frontend | Main workspace and dashboard frontend. |
| **`3008`** | **Sovereign Cinema UI** | Vite / React Frontend | Media and playback control interface (reverse proxy masked). |
| **`3009`** | **Sovereign SDLC Portal**| Vite / React Frontend | ITSM dashboard and active ticket interface. |
| **`3010`** | **Sovereign Sports** | Vite / React Frontend | Decoupled MLB sports command center and stream viewer. |
| **`3015`** | **James's Bistro** | Vite / React Frontend | Menu and dining ordering portal. |
| **`3016`** | **Wildseed GardenStack**| Vite / React Frontend | Plant and gardening tracking console. |
| **`5051`** | **Sovereign OS Core** | FastAPI / Python | Core OS system orchestration API. |
| **`5055`** | **Sovereign OS Auth** | FastAPI / Python | Identity and session token validation server. |
| **`5056`** | **Sovereign Admin API** | FastAPI / Python | Low-level administrative commands and node telemetry. |
| **`8000`** / **`8008`** | **M.A.R.D Relay** | FastAPI / WebSockets | Multi-Agent Real-Time Discourse sports telemetry and comment streams. |
| **`8001`** / **`8009`** | **FanStack Chatbots** | Python Daemon | Active LLM chatbot runner managing persona discourse. |
| **`8012`** | **FanStack Poller** | Python Daemon | Ultra-low latency (1s) MLB telemetry poller. |
| **`8095`** | **SDLC Ticketing API** | FastAPI / Python | Backend engine serving tickets, attachments, and the bulk Ingestor. |
| **`8097`** | **Sovereign Stream Relay**| FastAPI / Python | Scrapes/relays sports streams and serves active game state caches. |
| **`11434`**| **Ollama Local LLM** | Ollama Engine | Local LLM host for fallbacks. |

---

## 3. Current Terminology

Sovereign OS architecture moves fast. Ensure you never use stale concepts.

*   **Breadcrumbs [DEPRECATED]**  
    *Replaced by:* **Unified SDLC Ticketing & Walkthroughs**. Do not write loose breadcrumb text files. All session history is recorded via `walkthrough.md` files attached to formal tickets.
*   **Root-level Database Queries [DEPRECATED]**  
    *Replaced by:* **Canonical Path Database Access**. All active ledger work must target `/home/james/SovereignOS/dna/sovereign_now.db`. Never query the project root `/home/james/SovereignOS/sovereign_now.db` (violates **KI-038**).
*   **Midnight Slate Rollovers [DEPRECATED]**  
    *Replaced by:* **10 AM ET Slate Rollovers**. Game slates are locked to the operational date via parameterized `_et_game_date()` logic and roll over at exactly 10 AM ET to preserve pre-game and post-game chatter.
*   **Single GDrive Sync Remote [DEPRECATED]**  
    *Replaced by:* **Decoupled GDrive Sync Protocol**. GDrive sync is separated into two rclone remotes:
    - **`sovereign_os:`** (Google account: `sovereign.os.v1@gmail.com`). Owns all parent architecture files: session reports, DNA updates, walkthroughs, UAT reports, boot/shutdown logs, and inbox drops.
    - **`gdrive:`** (Google account: `sovereign.fanstack@gmail.com`). Owns FanStack specific files: game room logs/exports, poller/relay logs, persona caches, and everything under `15_FanStack/`.
*   **M.A.R.D WebSocket Engine [ACTIVE]**  
    Multi-Agent Real-Time Discourse. The core real-time message relay powering real-time sports chatrooms and live comment streams on port 8000.
*   **The Prove It Works Doctrine [ACTIVE]**  
    Mandate stating that all modifications must be tested and proven empirically via terminal stdout/curl outputs before a task is complete. No "silent handovers."

---

## 4. Current DB Schema Summary

The database lives exclusively at `/home/james/SovereignOS/dna/sovereign_now.db`.

### Replaced Tables
*   **`sovereign_tickets` [ACTIVE]**  
    *Replaced:* Legacy standalone tracking in `rm_story`, `rm_defect`, and `rm_enhancement`. These legacy tables remain in the schema for historical migrations, but ALL active ticket lookups, updates, and creation must be performed against the unified `sovereign_tickets` table.

### Primary Operational Tables
*   **`sovereign_tickets`**: Standard ITSM ticket fields (`sys_id`, `number`, `type` [STRY/DFCT/ENHC/INC], `short_description`, `description`, `state` [1=Open, 2=In Progress, 3=Testing, 4=Resolved, 5=Closed], `priority`, `assigned_to`, `work_notes`).
*   **`cmdb_ci`**: Configuration items (servers, modules, cameras, hardware).
*   **`cmdb_ci_hardware`**: Joins with `cmdb_ci` to provide hardware host metadata (`ip_address`, `mac_address`, `model_id`).
*   **`cmdb_ci_appl`**: Joins with `cmdb_ci` to store port configurations and startup commands (`process_name`, `process_cmd`, `port`).
*   **`sys_module`**: Registry of Sovereign OS sub-modules (`fanstack`, `bistro`, `gardenstack`, `argus`, `itsm`) and their activation states.
*   **`game_chat`**: Chat records and logs for all FanStack game rooms.
*   **`game_context`**: Live game state metadata (inning, balls, strikes, play-by-play events).
*   **`mlb_schedule`**: Integrated schedule mapping games to dates and active slate statuses.
*   **`persona`**: Persona profiles, AI bio data, and local/remote routing variables.

---

## 5. Active Governance & Known Issues (KI)

Claude.ai MUST strictly adhere to these architectural laws in every turn.

*   **KI-038: Sovereign DB Path**  
    The SQLite database resides exclusively at `/home/james/SovereignOS/dna/sovereign_now.db`. Querying `SovereignOS/sovereign_now.db` triggers critical file errors.
*   **KI-039: Mandatory Ticket Closure Protocol**  
    Whenever resolving any ticket:
    1. Send a `PUT` request to `http://localhost:8095/api/tickets/{number}` setting `state` = 4 (Resolved) with a professional `work_notes` entry.
    2. Write a comprehensive uniquely-named walkthrough (`walkthrough_{TICKET_NUMBER}.md`) to `/home/james/sovereign_inbox/today/`.
    3. `POST` the walkthrough file as a multipart attachment directly to the ticketing API at `http://localhost:8095/api/tickets/{number}/attachments`.
*   **KI-040: Inbox Zero-Litter & Unique Naming Policy**  
    Always name implementation plans and walkthroughs uniquely using their corresponding ticket ID (e.g. `implementation_plan_STRY0000543.md` and `walkthrough_STRY0000543.md`) and save them inside the today directory (`/home/james/sovereign_inbox/today/`) to ensure automatic synchronization with the Sovereign OS notebook and avoid workspace clutter.
*   **KI-001: Tailscale DNS Resolution**  
    Never hardcode local IP addresses (e.g. `192.168.1.x`). Always resolve using Tailscale MagicDNS hostnames (e.g. `clio.taila01894.ts.net`).
*   **KI-034: Anti-Band-Aid Mandate**  
    Do not use symlinks to bypass broken hardcoded paths. You must permanently patch the path in the codebase.
*   **KI-030: Decoupled Architecture Mandate**  
    Any new applications or micro-frontends must be built as standalone directories, never embedded as folders inside the main Sovereign OS Portal source tree.
*   **KI-031: Global Header Mandate**  
    All decoupled apps must display the unified environment status banner (DEV/UAT/PROD) and user dropdown chip in their main header layout.
*   **KI-036: Ironclad Visual Verification Audit**  
    Do not declare a portal or layout complete based on local build outputs alone. Use a browser subagent to render the actual external Tailscale URL, verifying zero console errors or broken assets.
*   **KI-021: Vite HTTPS HSTS Cert Warn**  
    When dropping Vite HSTS links, warn the Pilot that Google Chrome will block self-signed certificates and they must type `thisisunsafe` directly on the blank page to force bypass the security shield.
*   **KI-004: Anti-Apology Regulation**  
    Never use the phrases *"absolutely right"* or *"I apologize"*. Ground all statements in verified terminal outputs and empirical facts.

---

## 6. Recent Sprint Summary

### Completed & Shipped (Last 30 Days)
*   **Sovereign Sports Live Game Center & M.A.R.D Telemetry (STRY0000543):** Deployed dual-WebSocket M.A.R.D telemetry (port 8008) and remote control (port 8090) integration in the decoupled Sports app (port 3010). Features a high-contrast Vesper Synthwave Chic HUD visualizer complete with real-time base runner mapping, live LED scoreboard counts, scrolling play-by-play ticker, and direct TV remote hardware play/pause/seek controls.
*   **GDrive Sync Decoupling:** Re-architected sync pipelines. Set up dual rclone remotes (`sovereign_os` and `gdrive`). Updated all 7 system scripts (`sync_to_gdrive.sh`, `payload_sync_watcher.sh`, `daily_smuggler_sync.py`, `sync_romeo_to_gdrive.sh`, `vesper_scheduler.py`, `gather_barbs_birthday_lore.py`, `oracle_sync_watcher.sh`) to synchronize only OS logs to the parent drive, while a new script (`sync_fanstack_to_gdrive.sh`) pushes sports logs to the FanStack drive.
*   **Sovereign Ingestor V5.0:** Shipped a modern, glassmorphic bulk ticket ingestor served on port 8095 `/ingestor` which handles auto-parsing and inserts bulk stories, defects, and enhancements directly to `sovereign_tickets`.
*   **Port-Verification Relay Gate:** Modified the daily prep execution script so that it checks if ports `8000` / `8008` are healthy; if the M.A.R.D relay is healthy, it bypasses terminal termination, preserving live kiosk telepresence connections.
*   **Boot/Shutdown Flag Interface:** Deployed a strict boot interface (`-ts` [Tailscale], `-gd` [Game Day], `-dr` [Dry Run]) and shutdown interface (`-s` [Session Only], `-kw` [Kill Watchdog]) with automated safety gates.
*   **Cinema Navigation & Transcoding:** Transcoded legacy EAC3 audio files to highly compatible Opus formats and implemented physical arrow key keyboard navigation directly on the Cinema TV remote viewer.

### Deprecated
*   Legacy root-level database file syncing.
*   Legacy centralized rclone sync routines.
*   Old hardcoded local network endpoints.

### In Progress
*   **Hardware Migration Phase:** Migrating specific background runners from Clio workstation over to Hobbes and Calvin nodes.
*   **AirTag BLE Mesh:** Building neighborhood presence logging networks for Six Dinner Sam.
