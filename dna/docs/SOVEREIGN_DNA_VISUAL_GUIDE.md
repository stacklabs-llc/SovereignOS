# 🧬 SOVEREIGN OS: VISUAL ARCHITECTURE GUIDE & DNA INDEX

This document provides a highly readable, human-friendly overview of the Sovereign OS ecosystem. It describes the physical topography, network port usage, directory structures, database tables, and system laws.

---

## 🖥️ 1. Node Topology
*Where physical and virtual nodes live on our Tailscale mesh network.*

### 🛠️ Workstation (Primary Core)
* **`clio`** (`100.73.155.70`)
  * **Role:** The heartbeat of the system. Runs the primary user portal, SDLC API, sports relays, database operations, and LLM integrations.

### 📺 Kiosk Nodes (Living Room / Displays)
* **`argo`** (`100.123.68.9` / `192.168.1.75`)
  * **Role:** Driving the 65" TV. Runs the Sovereign Cinema front-door Chromium instance and the camera feeds.
* **`metsy-prime`** (`100.104.239.107` / `192.168.1.155`)
  * **Role:** Cozy card-table kiosk displaying the 16-bit Emergent World board game.

### 📡 Secondary mesh & General workers
* **`calvin`** (`100.77.60.67`): Local system backup scheduler and GardenStack cam relay.
* **`artemis`** (`100.70.84.19`): Telemetry collector node.
* **`hobbes`** (`100.88.5.122`), **`grogu`** (`100.77.138.27`), **`pegasus`** (`100.90.6.117`): Mesh compute nodes.

---

## 🔌 2. Port Map: Service Directory
*Quick reference for ports active on Clio.*

| Port | Friendly Name | Service | Purpose |
| :--- | :--- | :--- | :--- |
| **`3016`** | **Sovereign Portal** | React / Vite | The central command launcher and Clio Cockpit. |
| **`3010`** | **Sovereign Oracle** | React / Vite | The live baseball/sports simulation broadcast deck. |
| **`3008`** | **Sovereign Cinema** | React / Vite | TV UI to request and stream movies on the Fire TV. |
| **`3009`** | **Sovereign SDLC** | React / Vite | Tickets, walkthroughs, and release metrics. |
| **`3020`** | **Barb's Cockpit** | React / Vite | Persona configuration panel and Smyrna Sentinel tracker. |
| **`3017`** | **Storybook Station** | React / Vite | Eileen's daily custom workspace. |
| **`7300`** | **Catnip Wars** | React / Vite | emergent 16-bit RPG board game kiosk. |
| **`8443`** | **AetherVet Smyrna** | React / Vite | Smyrna clinical patient records workspace. |
| **`8090`** | **Core API Monolith** | FastAPI | Core system utilities, SabNZBd tunnel, and KB Ingest API. |
| **`8000`** | **M.A.R.D Relays** | FastAPI | Relays sports commentary, telemetry, and WebSocket streams. |
| **`8095`** | **SDLC Backend** | FastAPI | Manages tickets, work notes, and attachments. |
| **`11434`**| **Ollama Local LLM** | Ollama Engine | Handles offline inference. |

---

## 📂 3. Directory Layout
*The primary folders on Clio.*

* `/home/james/SovereignOS` — **Production Codebase Root.**
* `/home/james/SovereignOS/dna/` — **Architectural blueprints and canonical data.**
  * `docs/` — Flat repository for all user guides and system documentation.
  * `sovereign_now.db` — Core SQLite system database.
* `/home/james/sovereign_inbox/` — **The Landing zone.**
  * `kb/` — Knowledge Base documents synced up to GDrive.
  * `walkthroughs/` — release notes and UAT proof.
  * `implementation_plans/` — approved engineering drafts.
  * `reports/` — Daily consolidated logs and velocity reports.
  * `today/` — Symlink to active date-folder (e.g. `daily_07082026/`).

---

## 🗄️ 4. Primary Database Tables
*Key schemas stored inside `sovereign_now.db`.*

1. **`sovereign_tickets`**: Standard ITSM stories, incidents, and tasks.
2. **`kb_knowledge`**: Web-based articles for the Knowledge Hub.
3. **`persona`**: AI persona configurations, Allegiances, custom styling preferences, and canned responses.
4. **`cmdb_ci_media_asset`**: Tracked sprite sheet, avatar, and logo images mapping files to system actions.
5. **`mlb_schedule` & `game_chat`**: Baseball simulation scheduling and chat histories.
6. **`rpg_world_state` & `rpg_agent_memory`**: Cozy-card sandbox entity location grids, tensions, and lore caches.

---

## 🛡️ 5. Key System Laws (Invariants)
*Absolute rules our code must obey.*

* **MagicDNS Hostnames only (`KI-001`):** No hardcoded raw IP addresses (e.g., `192.168.1.155`). Use fully-qualified Tailscale MagicDNS hostnames.
* **Database Canonical Path (`KI-038`):** SQLite database is strictly at `/home/james/SovereignOS/dna/sovereign_now.db`.
* **Zero-Litter Inbox (`KI-050`):** The inbox root must remain pristine. The **Decision Derby** sorting daemon automatically moves files to `walkthroughs/`, `kb/`, `implementation_plans/`, or the active `daily_MMDDYYYY/` folders.
* **3-Step Ticket Resolution (`KI-039`):** All finished tickets must:
  1. Set state to `RESOLVED` (4) via SDLC API.
  2. Write a `walkthrough_[TICKET_ID].md` to the inbox walkthroughs folder.
  3. Upload the walkthrough to the ticket via the attachments API.
* **No Workstation Browser Popups (`KI-061`):** Never run headed browser tests or launch graphical windows on `clio` (which disrupts the Pilot's workflow). Run them on remote sandbox kiosks (`argo` or `metsy-prime`).
