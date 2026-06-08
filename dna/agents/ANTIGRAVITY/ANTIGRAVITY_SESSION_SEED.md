# 🛡️ ANTIGRAVITY // SESSION SEED CONTEXT
*Execute this payload immediately upon booting a new IDE connection.*

### THE SOVEREIGN TOPOLOGY (MAY 22nd DECOUPLED ARCHITECTURE)
You are entering a fully stabilized decoupled orchestration environment. All active components operate across isolated Git worktrees and must communicate exclusively via Tailscale MagicDNS boundaries.

#### 1. Node Topology
All communications within the Sovereign OS mesh MUST resolve via Tailscale MagicDNS hostnames instead of hardcoded local IPs (strict compliance with **KI-001**).

| Node Name | Tailscale IP | LAN IP / Type | Role & Services |
| :--- | :--- | :--- | :--- |
| **`clio`** | `100.73.155.70` | Workstation | **Central Server / Primary Worker**. Runs the Sovereign Portal, SDLC Ticketing Backend, FastAPI Admin/Core APIs, M.A.R.D WebSocket Engine, Bistro Backend, and FanStack sports telemetry loops. |
| **`argo`** | `100.123.68.9` | `192.168.1.75` / Kiosk | **Entertainment & Vision Kiosk**. Runs Sovereign Cinema player, `launch_cinema` Chromium instance, and the Hailo AI feed camera (`argo-vision-cam`). |
| **`hobbes`** | `100.88.5.122` | Host Node | General mesh node; designated hardware migration target. |
| **`calvin`** | `100.77.60.67` | Host Node | General mesh node; running persistent local backup loops and GardenStack camera streams. |
| **`pegasus`** | `100.90.6.117` | Host Node | Host daemon node. |
| **`grogu`** | `100.77.138.27` | Host Node | Micro-services worker. |
| **`artemis`** | `100.70.84.19` | Host Node | Secondary telemetry daemon runner. |
| **`mando`** | — | `192.168.1.116` | Active hardware watchdog / alerting ping-node. |
| **`stimpy`** | — | `192.168.1.186` | Legacy hardware node. |
| **`Android-2`**| — | `192.168.1.111` | Local mobile command telemetry. |

#### 2. Active Port Manifest
This manifest maps currently active and validated ports bound to services running on **`clio`** (`100.73.155.70`).

| Port | Service Name | Protocol / Backend | Description |
| :--- | :--- | :--- | :--- |
| **`3000`** | **Sovereign OS Portal** | Vite / React Frontend | Main workspace and dashboard frontend. |
| **`3008`** | **Sovereign Cinema UI** | Vite / React Frontend | Media and playback control interface. |
| **`3009`** | **Sovereign SDLC Portal**| Vite / React Frontend | ITSM dashboard and active ticket interface. |
| **`3015`** | **James's Bistro / AetherVet** | Vite / React Frontend | AetherVet telemedicine and Bistro dining portal. |
| **`3016`** | **Wildseed GardenStack**| Vite / React Frontend | Plant and gardening tracking console. |
| **`5051`** | **Sovereign OS Core** | FastAPI / Python | Core OS system orchestration API. |
| **`5055`** | **Sovereign OS Auth** | FastAPI / Python | Identity and session token validation server. |
| **`5056`** | **Sovereign Admin API** | FastAPI / Python | Low-level administrative commands and node telemetry. |
| **`8000`** / **`8008`** | **M.A.R.D Relay** | FastAPI / WebSockets | Multi-Agent Real-Time Discourse sports telemetry and comment streams. |
| **`8001`** / **`8009`** | **FanStack Chatbots** | Python Daemon | Active LLM chatbot runner managing persona discourse. |
| **`8012`** | **HoloLink Signaling WS** | Python Daemon | WebRTC signaling, queue routing, and presence tracking daemon. |
| **`8095`** | **SDLC Ticketing API** | FastAPI / Python | Backend engine serving tickets, attachments, and the bulk Ingestor. |
| **`11434`**| **Ollama Local LLM** | Ollama Engine | Local LLM host for fallbacks. |

#### 3. Canonical Database & Schema
The singular relational SQLite state store lives exclusively at the canonical path:
`/home/james/SovereignOS/dna/sovereign_now.db` (KI-038 compliance)

*   **Active Tables:** `sovereign_tickets` (unified ticket storage), `cmdb_ci`, `cmdb_ci_hardware`, `cmdb_ci_appl`, `sys_module`, `game_chat`, `game_context`, `mlb_schedule`, `persona`, `sys_user`, `sys_user_grmember`, `sys_attachment`.
*   **Legacy Tables:** `rm_story`, `rm_defect`, `rm_enhancement` are **DEPRECATED**. Never write to them.

#### 4. GDrive Sync Remotes
Synchronization is separated into two clean rclone remotes to decouple OS logs from sports logs:
*   **`sovereign_os:`** (Google account: `sovereign.os.v1@gmail.com`). Owns all parent architecture files: session reports, DNA updates, walkthroughs, UAT reports, boot/shutdown logs, and inbox drops.
*   **`gdrive:`** (Google account: `sovereign.fanstack@gmail.com`). Owns FanStack specific files: game room logs/exports, poller/relay logs, persona caches, and everything under `15_FanStack/`.

#### 5. Deprecated Terminology & Rules
Never mention or reference these legacy elements:
*   **Breadcrumbs** (replaced by Unified SDLC Ticketing and WALKTHROUGHS).
*   **Root-level Database Queries** (replaced by Canonical Path `/home/james/SovereignOS/dna/sovereign_now.db`).
*   **Midnight Slate Rollovers** (replaced by parameterized `_et_game_date()` rolling at exactly 10 AM ET).
*   **Legacy Tickets** (rm_story, rm_defect, rm_enhancement have been completely consolidated into `sovereign_tickets`).

#### 6. Core Operating Doctrines
*   **The Prove It Works Doctrine:** All modifications must be tested and proven empirically via terminal stdout/curl outputs before completing a task.
*   **Zero-Trust API Invariant:** A `200 OK` from an API is meaningless. You must explicitly verify backend Python scripts or read active daemon logs before assuming success.
*   **No Cosplay Mandate:** Every UI metric, stat, or status indicator must be driven by a real, verifiable backend data source. No random/hardcoded metrics.

#### 7. Active Known Issues (KIs)
*   **KI-001:** BANS raw local LAN IPs (192.168.x.x) in all code. Resolve via MagicDNS `clio.taila01894.ts.net`.
*   **KI-004:** Strictly FORBIDS using the phrases *"absolutely right"* or *"I apologize"*. Ground all statements in verified terminal outputs, and test external links via curl before handover.
*   **KI-021:** Warn the Pilot that standard browsers will block self-signed certificates on HSTS Tailnet links and they must type `thisisunsafe` directly on the blank page to force HSTS bypass.
*   **KI-030:** Decompiled Architecture: Standalone Vite projects on dedicated ports. No sub-folders inside main Portal.
*   **KI-031:** Include dynamic colored environment status banners and user profile chips in main layouts.
*   **KI-034:** BANS lazy symlinks. You must patch path references natively in the source code.
*   **KI-036:** Perform an Ironclad Visual Verification Audit via a browser subagent against the external URL before declaring a task complete.
*   **KI-038:** sovereign_now.db canonical path is `/home/james/SovereignOS/dna/sovereign_now.db`.
*   **KI-039:** Mandatory 3-step closure: `PUT` resolved to `/api/tickets/{number}`, write `walkthrough.md`, `POST` walkthrough attachment to ticketing API.
*   **KI-040:** Enforce Tailscale MagicDNS and strict raw IP bans from session ignition.

*Acknowledge receipt of this topology framework and complete compliance with KI-001 through KI-040 before executing commands.*
