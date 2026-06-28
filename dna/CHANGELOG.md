# Sovereign OS Historical Changelog

This document preserves the chronological record of architectural changes, deployments, and sprint decisions in the Sovereign OS mesh.

---

## 2026-06-26 (Night): Cross-Portal Stream Sniper Integration & Cockpit Command Center Convergence
- **Cross-Portal Stream Sniper Console Integration:** Imported, registered, and deployed the `StreamSniperConsole` component inside the `16_StackLabsLLC` workspace.
- **Decoupled API Proxy Hardening:** Configured Vite proxy routing in `16_StackLabsLLC/vite.config.ts` to redirect `/api/snipe`, `/api/transcribe`, `/api/summarize`, and `/api/analyze_video` requests directly to the background stream_sniper_daemon (port 5056), establishing complete pipeline parity across major portals.
- **Cockpit Dashboard Relic Synchronization:** Added a brand-new high-fidelity "Stream Sniper" relic matrix card in both `01_Sovereign_Portal` and `16_StackLabsLLC`'s `InteractiveCockpit.tsx` dashboards.
- **Seamless Navigation Routing:** Connected the `onNavigate` command callback inside the StackLabs homepage (`App.tsx`) to natively trigger the full-screen Stream Sniper overlay when the relic is ignited, while maintaining redirection to the main portal for external service cards.

## 2026-05-22 (Evening): HoloLink Mobile Auth Presence & Administrative Profile Security Unification
- **HoloLink Mobile Auth Integration:** Refactored `MobileHololink.tsx` to leverage the global `useAuth()` React context, dynamically registering WebSocket presence under authenticated credentials (`eileen` / `Eileen Carroll`, `patron`) instead of randomized temporary guest fallbacks.
- **Inbound WebRTC Offer Routing:** Standardized `HololinkHub.tsx` to accept incoming signaling targeting the portal hostname `'clio'`, allowing standard workstations to ring and connect when remote guest/patron terminals dial.
- **Unified Administrative Profile Updates:** Excised client-side role-based endpoint routing (`isPilotEditing`) in `UserManagementConsole.tsx`. All administrative edits consistently leverage the unified `/api/auth/update_user` endpoint, placing authorization logic exclusively under backend role validation rules.
- **Backend Username Desync Patch:** Resolved an update sequence bug in the `/api/auth/update_user` API (`sovereign_core_api.py`) where password hash updates bound to a stale `req.username` instead of the newly updated `target_username`. Cleanly restarted the active daemon to load changes.
- **SDLC Ticket Closure Integration:** Created, resolved, and successfully logged comprehensive work walkthroughs for both **ENHC2461064** and **STRY1779457600** inside the `sovereign_tickets` repository table.

## 2026-05-21 (Evening): Patron Role, Roll Call Date Logic, and AetherVet ws-relay Fix
- **Patron Role (New Auth Tier):** 
  - 5-tier RBAC: Role hierarchy is now `pilot > creator > patron > user > guest`.
  - Patron scope: FanStack portal (port 3009), GardenStack, AetherVet, SamTracker. No access to ITSM, ARGUS, System Config, PROD, Cinema Remote.
  - Both portals patched: `01_Sovereign_Portal/src/App.tsx` hard-redirects patron → port 3009. `15_FanStack/src/App.tsx` shows patron nav strip. `GlobalSystemBar.tsx` shows `◆ PATRON` amber badge.
  - Current patron user: `pawel` (Pawel Rudnicki / Wildseed LLC).
- **Roll Call Date Logic — ET + 10 AM Cutoff Rule:**
  - Root cause: SQLite `date('now')` and Python `dt_date.today()` are UTC. After midnight UTC but before midnight ET, the roll call was pulling tomorrow's slate.
  - Fix: `_et_game_date()` helper added to `fanstack_relay.py`, `the_skew_relay.py`, and `sovereign_core_api.py`. Returns ET date. Before 10 AM ET → returns previous day. 10 AM ET+ → returns current ET date.
  - CRITICAL RULE: Never embed Python function calls inside SQL strings. `WHERE col = python_func()` is invalid SQLite syntax. Always compute the value in Python first and bind as a `?` parameter.
- **AetherVet ws-relay Proxy Fix:**
  - Bug: `20_AetherVet/vite.config.ts` `/ws-relay` proxy was pointing to `ws://127.0.0.1:8008` (FanStack relay) instead of `ws://127.0.0.1:8012` (sovereign_mesh_relay). This silently broke all HoloLink calls from AetherVet for an unknown duration.
  - Fix: Updated proxy target to `ws://127.0.0.1:8012`.
- **Daily Prep Relay Kill Bug — OPEN:**
  - Known issue: `daily_prep.sh` (via `restart_stack.sh`) kills the fanstack_relay process. Investigation confirmed the kill happens in `restart_stack.sh`. Root fix was NOT applied as of session end due to crash. Next agent must fix restart_stack.sh to not kill port 8000.
- **Tailscale Funnel — Port 3009 Not Exposed:**
  - Critical gap: Tailscale Funnel currently only exposes port 3000 (main portal) and `/sam`. Port 3009 (FanStack / HoloLink) is not publicly accessible. External callers (e.g., Pawel Rudnicki) cannot reach HoloLink. Fix: `sudo tailscale funnel 3009`.
- **LiveChatSniper — behavior_notes Must Be Wired:**
  - The `/api/all_personas` endpoint returns `behavior_notes` but it was never mapped in `LiveChatSniper.tsx`. The persona DB can be updated all day but the Sniper will still fire old prompts unless `behavior_notes` is included in the voice construction. This has been fixed — any future Sniper rebuild must preserve this mapping.
- **Sovereign Ingestor — Bulk Ticket Ingestion (2026-05-22):**
  - New endpoint: `POST /api/ingest` on `sovereign_core_api.py` (port 8090). Accepts a JSON array of ticket objects and bulk-inserts into `sovereign_tickets`. Handles type validation (`STRY/DFCT/ENHC/INC`), string priority/state coercion (`P1/HIGH/OPEN/RESOLVED`), and surfaces duplicate errors per-row. Never silently overwrites.
  - Ingestor UI: `sovereign_ingestor.html` (V5.0) served at `http://127.0.0.1:8095/ingestor` via `sdlc_portal_server.py` `/ingestor` route. Paste raw JSON array → SUBMIT TO METAL → per-row results. Styled to Sovereign premium design system.
  - sovereign_now.db canonical path: `/home/james/SovereignOS/dna/sovereign_now.db` — NEVER the project root `/home/james/SovereignOS/sovereign_now.db`. KI-038 locks this in permanently.
- **Cinema Remote — Arrow Key Navigation Fix (2026-05-22):**
  - Root cause: `SeriesDetailView.tsx` WebSocket handler had `if (!room) return` guard. Cinema loads at `/cinema-portal/` with no `?room=` URL param, so all D-pad commands were silently dropped.
  - Fix: Removed room guard. Added `window.addEventListener('keydown')` for native keyboard navigation. ⬆️⬇️ = season, ⬅️➡️ = episode, Enter = play.
  - VAAPI: `launch_cinema` in `sovereign_core_api.py` now passes `--disable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL` to Chrome. VAAPI was crashing x265 playback on the TV.
  - EAC3 transcoding: `media_vault_optimizer.py` / manual ffmpeg converts EAC3 → Opus (audio only, video copy). Required for Chromium playback compatibility.

## 2026-05-21 (Morning): AetherVet HoloLink Restoration & Aesthetic Silo
- **AetherVet Port:** `20_AetherVet` canonically on Port 3015. Mobile HoloLink: `https://clio.taila01894.ts.net:3015/?view=mobile_hololink&app=aether_vet`.
- **HoloLink Ring UI Contract:** Dashboard MUST NOT auto-answer WEBRTC_OFFER. Offer stored in ref, ringing state shown. WebRTC answer runs ONLY after user clicks Answer button. Prevents ICE race condition causing one-way video.
- **theme-aether:** AetherVet canonical CSS theme. Navy #050d18 + teal #2a9d8f. Defined in index.css @layer components. Default in App.tsx. Theme picker still available.
- **BANNED: pkill -f vite:** Kills ALL decoupled app servers simultaneously. This session downed Portal+FanStack while targeting only AetherVet. Use pkill -f "vite.*PORT" or target by PID only.
- **AetherVet Auth-Free:** No FanStack AuthGate. Routes direct to dashboard. Do not add auth guards without Pilot instruction.

## 2026-05-21 (Afternoon): HoloLink Port Topology Correction & Portal Auth Stabilization
- **Port Ownership — CANONICAL MAP (Do Not Violate):**
  - 8000: `fancast_relay.py` HTTP (REST API for roll call, scoreboard, etc.)
  - 8008: `fancast_relay.py` WebSocket (MARD game room state updates)
  - 8012: `sovereign_mesh_relay.py` WebSocket (HoloLink WebRTC signaling)
  - 8090: `sovereign_core_api.py` HTTP (Portal auth, SDLC tickets, system APIs)
- **sovereign_mesh_relay.py runs on port 8012:** Previously collided with fancast_relay on 8008. Fixed permanently.
- **Portal vite.config.ts `/ws-relay` proxy updated:** `ws://127.0.0.1:8008` → `ws://127.0.0.1:8012`.
- **BLAST RADIUS RULE:** Before killing any process by PID, run `ss -tlnp | grep <PID>` to see every port it owns.
- **HoloLink Hub (Portal):** `HololinkHub.tsx` mounted in `01_Sovereign_Portal/src/App.tsx`, connecting to `ws://127.0.0.1:8012` via the `/ws-relay` vite proxy.
- **Portal Login:** `AuthGate.tsx` branding corrected: title "Sovereign OS", Icon 🛡️. `sovereign_core_api.py` runs on 8090.
- **NotebookLM Two-Silo Architecture:** 
  - **Sovereign OS Notebook** (`ef2f309e`): Engineering ledger. 130+ session reports.
  - **FanStack Notebook** (`693f21d0`): Live media production engine.
- **KI-037 Added:** Prospectus Dual-Update Mandate. `public/prospectus.html` AND `InvestorProspectus.tsx` must always be updated together.

## 2026-05-21: Prospectus Redesign & Edge Moat CSS Visualization
- **Served HTML Prospectus Redesign:** Rebuilt static served `public/prospectus.html` from scratch to achieve immediate browser rendering (<20ms).
- **Thermodynamic Moat Chart:** Replaced image dependencies with custom native CSS bar chart featuring glowing shadow overlays.
- **Responsive Layout Stabilization:** Decoupled metrics description from the fixed-height chart columns, resolving layout overlaps on mobile.
- **Ecosystem Convergence & Live CTA:** Connected Tavern stream into header CTA. Renamed agricultural vertical to **GardenStack — Phase 2**.
- **SDLC Done Verification:** Resolved investor engagement ticket `STRY0000550` inside `sovereign_now.db`.

## 2026-05-21: SamTracker Daemon Synchronization & Verification
- **In-Memory Cache Realignment:** `sam_tracker_server.py` relies strictly on in-memory arrays populated only at server boot. Restored feed using the unified `./scripts/restart_servers.sh` service daemon restart script.
- **Creator Role Endpoints:** Exposed sighting deletions and state configurations via `role=pilot` query parameter.

## 2026-05-20: FanStack Hot/Cold Storage Architecture
- **Hot Cache Layer:** `fanstack_background_poller.py` atomically serializes the full MLB `feed/live` JSON payload to `/home/james/SovereignOS/game_states/{game_pk}.json` on every state-hash delta using POSIX atomic rename.
- **Context Decoupling:** `fanstack_chatbots.py` `STATE_UPDATE` handler no longer inlines full persona lore on every pitch. Lore cap at 400 chars. Full lore for Gemini on massive events only.
- **Context Injection Gate:** `get_inning_context()` and `get_recent_plays()` from `game_cache_reader.py` are injected into prompts ONLY when `is_massive_event == True`.
- **Vertex Burn Constraint (HARD RULE):** `vertex_burn.on` is no longer a blanket override. Routine plays MUST route to local edge models.
- **Cold DB Bootstrap:** `sovereign_intelligence.db` idempotent Schema boost via `statcast_sentinel.py`.
- **New Module:** `scripts/game_cache_reader.py` created as standalone, exception-silent cache reader. Direct file reads in chatbots are banned.

## 2026-05-20: Event Loop & CPU Stabilization (Vertex Burn Fix)
- **Event Loop Shielding:** Wrapped all synchronous, blocking Vertex AI SDK calls inside `asyncio.to_thread` executors to prevent thread hijacking of main event loop.
- **Reconnection Storm Prevention:** Offloading sync processes resolved WebSocket timeout pings, stabilizing CPU usage at 0-5%.
- **Telemetry Interception Middleware:** Deployed `fanstack_payload_interceptor.py` for logging of prompts, responses, and token metadata.
- **SDLC Compliance:** Formally resolved STRY7763197 and defect DFCT0000017 in `sovereign_now.db`.

## 2026-05-20: SDLC Portal Infrastructure Refactor (sovereign_tickets Integration)
- **sdlc_portal_server.py Refactored:** All ticket CRUD endpoints query `sovereign_tickets` exclusively. Purged `rm_story`, `rm_defect`, `rm_enhancement` from backend logic.
- **sdlc_completion_hook.py Refactored:** Remapped target fields to `sovereign_tickets`.
- **vertex_uat_agent.py Refactored:** Ingests and validates resolved tickets against `sovereign_tickets`.
- **Three-Phase Pipeline Verified End-to-End:** STRY0000549 successfully moved through Dev Agent -> UAT Agent -> Pilot workflow.
- **Antigravity 1.23.2 Boot Protocol Confirmed:** sovereign_boot sequence successfully executed on startup.

## 2026-05-20: SDLC Unification — sovereign_tickets Migration
- **Table Consolidation Mandate:** Legacy SDLC tables consolidated into single unified `sovereign_tickets` table.
- **Type Discrimination:** Supported using `type` column (`STRY`, `DFCT`, `ENHC`, `INC`).
- **Parent Relationship Model:** Supported using `parent_sys_id` column for linking children to parents.
- **Incident Table Clean Slate:** Legacy INC records wiped for clean watchdog incidents.
- **sys_attachment Remapped:** Updated 107 records to point to `table_name = 'sovereign_tickets'`.
- **Old Tables Preserved as Empty Shells:** Preserved for backward compatibility temporarily.

## 2026-05-20 (Evening): SamTracker Port Realignment, Subpath Reverse Proxies, and SDLC State Machine
- **SamTracker Decoupled Port Realignment:** Decoupled Vite frontend (Port 3004) and backend (Port 8083) with dynamic proxying.
- **Tailscale Funnel Subpath Redirect Loop Resolution:** Implemented relative `./` base path in Vite to prevent path prefix stripping loop blocks.
- **Dynamic Portal Environment Indicators (KI_031):** Standardized environment indicator pills in the frontend.
- **Master App Registry Update:** Updated registry mapping in `PortalApps.tsx`.
- **Multi-Agent Software Factory Lifecycle:** Codified app lifecycle states in `.cursorrules` and `.windsurfrules`.

## 2026-05-19 (Evening): FanStack Routing & Kiosk Database Locking
- **Global Domain Router:** Decoupled apps mapped inside active domain routing to prevent incorrect falls into MLB templates.
- **SQLite Brain Directory locks:** Resolved multi-node file-lock collisions.
- **WebSocket Size Limit Exhaustion:** Downscaled Canvas thumbnails to 640px to prevent Base64 WebSockets crashes.

## 2026-05-19 (Afternoon): Sovereign Cinema HSTS & Funnel Sub-Path Routing
- **Tailscale HSTS Enforcements:** Mandated Dev HTTPS servers across all local kiosk domains.
- **Service Worker Cache Traps:** Wiped stale PWA caches on client devices.
- **Vite Base Path & Proxy Ping-Pong:** Set Vite base path to prevent proxy redirect loops.

## 2026-05-19 (Morning): Mobile Fluidity & Architecture Render Fallbacks
- **Absolute Positioning Ban:** PURGED absolute styles from Kanban wrappers to prevent component overlap on mobile screens.
- **Markdown Architecture Fallbacks:** ExportedMermaid blocks to static PNGs or raw HTML to guarantee visibility across simple markdown viewers (GDrive mobile).

## 2026-05-19: FanStack Mention Hardening & Security
- **Vertex Burn Override Enforcement:** Evaluated `vertex_burn.on` across all pitch comment paths to prevent local edge fallback leaks.
- **Okerlund Protocol:** Deployed anti-dogpile cooldown triggers in chatbots.
- **CMDB Port Tracking:** Tracked GardenStack on port 3016 inside `cmdb_ci_appl` to prevent server port collisions.

## 2026-05-19 (Late Night): Sovereign Oracle Security
- **Data-Driven Guardrails:** Saved Oracle instruction constraints to the `oracle_guardrails` table of `sovereign_intelligence.db`.
- **Oracle Telemetry Logging:** Streamed all Oracle runs to `/api/admin/oracle_log` and saved to `oracle_audit.jsonl`.

## 2026-05-18 (Late Night): GardenStack Decoupling & Tailscale HSTS Desktop Bypass
- **GardenStack Port Allocation:** Set standalone Vite site on Port `3016`.
- **Desktop HSTS Bypass via Tailscale Serve:** Exposed Vite through local Tailscale Proxy `8451 -> 3016` to deliver a valid Let's Encrypt TLS cert.

## 2026-05-18 (Afternoon): Decoupled Micro-Frontends & Aesthetic Silos
- **The Decoupled Architecture Mandate (KI_030):** Standalone port sites for new apps only (e.g. `20_AetherVet` on 3015).
- **The Global Header Mandate (KI_031):** Env indicators and profile chips forced in all micro-frontends.
- **Aesthetic Silos Protocol:** Isolated the Cyberpunk theme to FanStack. Navy/Teal medical theme mapped to AetherVet.

## 2026-05-18 (Night): FanStack UI Stabilization & Decoupled Routing
- **Decoupled Link Integrity:** Enforced `window.open` external redirects in `PortalApps.tsx`.
- **Mobile Responsive Kanbans:** Upgraded toolbar buttons using flex-wrap and responsive flex-col stacks.
- **Viewport Scaling for Legacy iFrames:** Added custom CSS scale(0.75) wrapping to fit MLB iFrames.

## 2026-05-18: WebRTC Mesh Resilience & Mobile Telepresence
- **Global Signaling Collisions:** Isolated WebRTC calling IDs (`aether_vet_hq`) to prevent parallel telepresence conflicts.
- **Mobile Hardware Security Blocker:** Cache allocated streams during initial user click.
- **React Video Stream Race:** Utilized hook triggers to attach tracks only *after* video tags mount.

## 2026-05-17 (Evening): The Docker Freeze & Sniper UI Hot Reload
- **Docker Memory Limits:** Enforced RAM limits on media containers to prevent Ollama RAM starvation swapping storms.
- **Decoupled API Overrides:** Executed prompt filters inside frontend `LiveChatSniper.tsx` to exploit hot-reloads.

## 2026-05-17 (Late Night): Kiosk Display Architecture & MKV Invariants
- **XFCE Keyring Trap Prevention:** Passed `--password-store=basic` flag to Chromium in autostart scripts.
- **Physical Display Input Freedom:** Replaced `--kiosk` with `--incognito` on dev workstation displays.
- **MKV Embedded Subtitle Blindspot:** Extracted MKV subtitles to standalone `.vtt` tracks.

## 2026-05-17 (Afternoon): Headless FanStack Authentication & Cookie Injection
- **Google Auth Bypass:** Manually exported desktop session cookies and injected them via `inject_cookies.py` to bypass headless bot blocks.
- **Algorithmic Traction Mandate:** Integrated multi-persona prompts and required Mets Twitter tags.

## 2026-05-17 (Early Morning): FanStack API Decoupling & Promotional Credit Weaponization
- **Vertex AI Pivot:** Decoupled chatbot inference from Google AI Studio to GCP Enterprise endpoints via `vertex_sa.json` service accounts.
- **Sandbox-Driven SDLC:** Restrained active core modifications to Dev environments before UAT promotion.

## 2026-05-17 (Late Morning): Environment Isolation & Test Automation
- **Dynamic Port Bifurcation:** Purged all hardcoded local IPs. Enforced dynamic environment mappings inside `SovereignConfig`.
- **The ATF Mandate:** Playwright automated suite (`atf_runner.js`) automatically logs watchdog incidents to database.
- **Mando Watchdog Parameterization:** Segmented watchdog daemons via environmental flags (`--env dev`).
- **The Persona Scrub:** Genericized chatbot names to pull dynamic parameters from database fields.

## 2026-05-16 (Late Night): SamTracker AIOHTTP & Tailscale Topology
- **Tailscale Funnel Prefix Stripping Rule:** Configured AIOHTTP routing endpoints to support stripped paths (e.g. `/ws` instead of `/sam/ws`).
- **Argo Edge Deployment Standard:** Forced CV scripts to use native `/usr/bin/python3` for Hailo dependencies.

## 2026-05-16: SamTracker Single-Process Daemon & FanStack LLM Sanitization
- **Architectural Consolidation:** Unified SamTracker frontend and backend into single AIOHTTP daemon on Port 3004.
- **App Directory Synchrony:** Synchronized app registry targets in `PortalApps.tsx`.
- **LLM Artifact Stripping:** Truncated trailing LLM commentary using `_strip_meta_notes` pattern.

## 2026-05-16 (Evening): Local Edge Vision AI Pivot (SamTracker)
- **Local Vision AI Edge Strategy:** Switched from Google Cloud SDM camera API to local Tapo C120 RTSP stream analyzed on Argo Pi 5 Hailo NPU.
- **Mesh Camera Mandate:** Wired attached USB cameras for node localized telemetry (Calvin grow tents, clio workspace).
- **MacroDroid Bridge:** Fired ambient cat alerts over Tailnet via cell push notifications.

## 2026-05-16 (Night): Calvin Edge Node Integration & GardenStack Telemetry
- **Edge Architecture Migration:** Exorcised motioneye and deployed custom `edge_cam.py` systemd service.
- **Sudo Remote Automation:** Configured passwordless sudo on nodes to prevent heredoc deadlocks.
- **Data-Driven Visualization Mandate:** Mapped GardenStack coordinate grids to structural blueprint overlay.

## 2026-05-15: Portal Decoupling & Tailscale MagicDNS Mandate
- **Wildseed Farm & Investor Prospectus Bifurcation:** Split Investor Prospectus and Garden telemetry dashboard in routing.
- **MagicDNS Hostname Enforcement:** Banned raw IPs in Vite proxies and mesh scanning loops.

## 2026-05-15: Kiosk Display Locking & Autostart Automation
- **Screen Lock Prevention:** Uninstalled `light-locker` and disabled DPMS blanking to prevent display lockout on input changes.
- **XFCE Native Autostart:** Switched from raw xinit to native `.desktop` autostart.
- **LightDM Auto-login:** Registered target user into the `nopasswdlogin` system group.

## 2026-05-15: SDLC CMDB Rigidity & SamTracker Proxying
- **CMDB Service Isolation:** decoulped CI targets from personal assignees.
- **SamTracker WebSocket Proxy:** Routed websocket queries to backend port `8083`.

## 2026-05-15: Multi-Portal Architecture & FanStack Decoupling
- **Port Isolation:** Mapped sub-apps on dedicated Vite servers (e.g. Cinema on port 3008, FanStack on port 3009).
- **CMDB Persona Scope:** Isolated operating nodes from character persona tables in assignment drop-downs.

## 2026-05-15 (Evening): FanStack Routing Enforcements
- **Strict Domain Force:** Forced fan-role users directly into MLB templates.
- **Scruffy's as Default Lobby:** Routed fans directly to Tavern.

## 2026-05-15 (Night): FanStack Loop Isolation & SamTracker Configuration
- **Async Event Loop Integrity:** Prevented chatbot pauses from breaking core poller loops.
- **SQLite Data-Driven Micro-Frontends:** Switched SamTracker dynamic configs to SQLite tables (`sam_tracker_config`).
- **WebSocket Size Limit Exhaustion:** Extended websocket size limit to 10MB to support media payloads.

## 2026-05-14: Gemini API Quota Protection & Kiosk Session Management
- **Zero-Token Telemetry Bypass:** Programmed high-frequency telemetry bots to output hardcoded statcast layouts instead of calling LLMs.
- **Chromium Kiosk Session Integrity:** Added `--incognito` flag to autostart browser scripts.
- **Argus Nexus DNS Resolution:** Forced fully-qualified Tailscale DNS routing on Vite proxies to prevent IPv6 drops.

## 2026-05-14: Pi 5 Desktop Migration & API Routing
- **Graphical Target Migration:** Upgraded Pi 5 (`clio`) workstation from headless matchbox-manager to standard XFCE LightDM desktop.
- **Strict API Telemetry Routing:** Routed balls/strikes to local phi-3 model, restricting Gemini to major home run highlights only.

## 2026-05-14 (Evening): TMI News Desk Global Scope & Fan RBAC
- **TMI News Desk All-Games Mandate:** Parallelized news sweeps across all games in the MLB schedule.
- **RBAC: BUILD ROOM Button:** Restrained game room constructor to pilot/creator roles.
- **Fan Lobby Routing Invariant:** Redirected fan roles to scruffys lobby.
- **Grogu (Pi Zero 2W) Retirement:** Retired Pi Zero from heavier React UI page rendering.
- **Pi 5 Fan Station Protocol:** Exposed the standard lobby viewer over the tailnet browser.

## 2026-05-13: Roll Call & FanStack Segregation
- **Data Architecture:** Retired `roll_call.json` in favor of dynamic `mlb_schedule` joins.
- **Daemon Boot Synchronization:** Injected explicit sleep delays between core backend startups to prevent refusal race conditions.
- **Cross-Session Isolation:** Excised core daemons from simple fan prep cycles.

## 2026-05-13: UI Hardening & Role-Based Access Control (RBAC)
- **Role Hierarchy Expansion:** Established 4-tier model (`pilot`, `creator`, `user`, `guest`).
- **Creator Tool Segregation:** Gate system settings bars away from simple users.

## 2026-05-13: Argus Nexus Node Multi-Client Stream Segregation
- **Hardware Lock Circumvention:** Implemented threading models inside `edge_cam.py`.
- **MJPEG Formatting Mandate:** Standardized MJPG delimiters to ensure reliable frame extraction.

## 2026-05-12 Architectural Updates
- **SDLC Tracking:** Fully deprecated `agent_kanban.json` in favor of SQLite `sovereign_tickets`.
- **Public Folder Janitorial Policy:** Restricted React `/public` folder prototyping.

## 2026-05-12: FanStack/Core API Decoupling
- **Architectural Shift:** Moved administrative endpoints from FanStack to `sovereign_core_api.py` on port 8090.
- **Routing:** Mapped Vite configuration files to proxy `/api/system` and `/api/now` to port 8090.

## 2026-05-12: System Users & Persona Decoupling
- **Architectural Shift:** Filtered out persona database rows from system user management profiles.

## 2026-05-12: SDLC Proxy & Kiosk TLS Invariants
- **SDLC Port Correction:** Moved ticketing system to port `8095` via `sdlc_portal_server.py`.
- **Tailscale HSTS Mandate:** Mandated basic-ssl Dev configurations across Vite instances.

## 2026-05-12: Live Stream Sniper & API Threat Mitigation
- **FastAPI Event Loop Deadlocks:** Switched blocking synchronous routes from `async def` to standard `def` to invoke thread pool spawning.
- **SDLC Query Bypass:** Mapped specific GET query endpoints for bots to submit ticket incidents.
- **Manual AI Matrix Orchestration:** Kept high-profile bot integrations under manual Pilot control via standard UI payloads.
