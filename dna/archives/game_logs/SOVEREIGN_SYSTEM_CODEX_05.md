# 🏴‍☠️ MASTER ARCHITECTURAL LEDGER: SOVEREIGN SYSTEM CODEX
**Canonical File Path:** `/home/james/SovereignOS/dna/SOVEREIGN_SYSTEM_CODEX.md`

This document serves as the absolute, system-wide ground-truth index and comprehensive architectural blueprint for the Sovereign OS ecosystem. It consolidates all subsystem directories, SQLite schemas, Tailscale MagicDNS node mappings, background daemon daemons, and system invariants to provide a zero-friction reference for AI partner agents.

---

## 📂 1. CODEBASE SUBSYSTEM MAP

Sovereign OS operates as a highly decoupled, multi-fronted edge computing environment. All primary subsystems reside under `/home/james/SovereignOS/`:

| Subsystem Directory | Mapped Port | Tech Stack | Role & Core Functionality |
| :--- | :--- | :--- | :--- |
| **`01_Sovereign_Portal`** | `3000` | Vite / React / TypeScript | **Sovereign OS Desktop UI Portal**. Serves as the primary human command interface, system cockpit launcher, and user profile hub. |
| **`02_Sovereign_Auth`** | `5055` | FastAPI / Python | **OS Identity API**. Manages authentication, token generation, user profiles, and active session validation. |
| **`03_Sovereign_Core`** | `5051` | FastAPI / Python | **Sovereign Core API**. Handles CMDB assets, low-level server control commands, system updates, and rclone backup sweeps. |
| **`04_Sovereign_Cinema`** | `3008` | React / Vite | **Sovereign Cinema UI**. Movie player interface and play control deck. |
| **`05_Sovereign_SDLC`** | `3009` | React / Vite | **SDLC ITSM Frontend**. Manages STRY, DFCT, and INC ticketing boards, sprint planning, and manual attachment staging. |
| **`06_Sovereign_Sports`** | `3010` | React / Vite | **Sovereign Watch Party UI**. Live baseball game room chats, real-time comment feeds, and scoreboard widgets. |
| **`15_FanStack`** | — | Python / JS | **Sports Telemetry Hub**. Core folder containing poller caches, game schedule indices, and LLM chatbot integrations. |
| **`dna/`** | — | SQLite / Markdown | **Master State Repository**. Contains active databases, changelogs, corrections ledgers, and onboarding personas. |
| **`scripts/`** | — | Python / Bash | **OS Daemon Chamber**. Contains all automated watchdogs, sweeps, mesh relays, DVR recorders, and LLM governors. |

---

## 🧠 2. STATE DATABASE SCHEMA BLUEPRINT

The canonical database resides at `/home/james/SovereignOS/dna/sovereign_now.db`. All agents must target this exact path and structure when performing SQL mutations:

### A. Active Ticket Ledger (`sovereign_tickets`)
Consolidates all system sprint work, requirements, defects, and incident reports.
```sql
CREATE TABLE sovereign_tickets (
    sys_id          TEXT PRIMARY KEY,
    number          TEXT UNIQUE NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('STRY', 'DFCT', 'ENHC', 'INC')),
    parent_sys_id   TEXT,                        -- Points to parent STRY for DFCT/ENHC
    short_description TEXT,
    description     TEXT,
    state           INTEGER DEFAULT 1,           -- 1=Open 2=In Progress 3=Testing 4=Resolved 5=Closed
    priority        INTEGER DEFAULT 3,           -- 1=Critical 2=High 3=Medium 4=Low
    assigned_to     TEXT,
    cmdb_ci         TEXT,
    work_notes      TEXT,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### B. Configuration Item Registry (`cmdb_ci`)
Tracks all physical nodes, virtual services, camera feeds, and systems components.
```sql
CREATE TABLE cmdb_ci (
    sys_id            TEXT PRIMARY KEY,
    name              TEXT,
    sys_class_name    TEXT,
    short_description TEXT,
    operational_status INTEGER,                  -- 1=Active, 2=Offline, 3=Maintenance
    assigned_to       TEXT,
    sys_created_on    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### C. System Users & Auth (`sys_user`)
Authenticates human operators and active system personas.
```sql
CREATE TABLE sys_user (
    sys_id          TEXT PRIMARY KEY,
    user_name       TEXT UNIQUE,
    first_name      TEXT,
    last_name       TEXT,
    title           TEXT,
    introduction    TEXT,
    city            TEXT,
    department      TEXT,
    active          INTEGER DEFAULT 1,
    password_hash   TEXT,
    role            TEXT DEFAULT 'guest',
    display_name    TEXT,
    email           TEXT,
    avatar_url      TEXT,
    favorite_team   TEXT,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### D. AI Persona Configurator (`persona`)
Manages system chatbots, target allegiances, LLM model overrides, and lore.
```sql
CREATE TABLE persona (
    id            TEXT PRIMARY KEY,
    user_name     TEXT UNIQUE NOT NULL,
    display_name  TEXT,
    team          TEXT,                          -- MLB abbreviation (SD, SF, ATL, NYM, GLOBAL)
    system_prompt TEXT,
    boggs_level   INTEGER DEFAULT 2,
    avatar_url    TEXT,
    color         TEXT,
    cadence       TEXT DEFAULT 'pacer',
    deep_lore     TEXT,
    behavior_notes TEXT,
    governance    TEXT,
    avatar_blob   TEXT,
    llm_engine    TEXT DEFAULT 'gemini-2.0-flash',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT
);
```

---

## 🛠️ 3. CORE BACKGROUND DAEMONS & CONTROLLERS

The following key daemons and automation scripts reside in `/home/james/SovereignOS/scripts/` and run continuously on the workstation to manage local services and ingestion loops:

*   **`sovereign_core_api.py`** (Port `5051`)
    *   **Function:** System management endpoints. Triggers file archival, CMDB hardware updates, and rclone sync workflows.
*   **`sdlc_portal_server.py`** (Port `8095`)
    *   **Function:** SDLC Ticket and Attachment manager API. Handles uploading `walkthrough.md` files and updating ticket states.
*   **`fanstack_relay.py`** (Port `8000` / `8008`)
    *   **Function:** Master real-time Discursive Sports Relay. Orchestrates live watch party chat streams, StatCast event processing, and WebSocket channels.
*   **`fanstack_chatbots.py`** (Port `8001` / `8009`)
    *   **Function:** Live LLM Chatbot Orchestrator. Coordinates the baseball watch party responses for Pete the Pocket Protector (`welfare_bucco`) and other baseball personas using local Ollama or Vertex AI.
*   **`statcast_sentinel.py`**
    *   **Function:** Live MLB StatsAPI event loop watchdog. Monitors current game context changes and feeds structured base/strike/out events to the Chatbots relay.
*   **`ollama_governor.py`**
    *   **Function:** Workstation CPU/RAM resource protector. Automatically shuts down local Ollama systemd instances when active sports watch parties are streaming to prevent workstation starvation.
*   **`stream_sniper_daemon.py`**
    *   **Function:** universal DVR and streamer transcription poller. Captures stream segments, runs high-velocity speech-to-text, and stages audio briefings.
*   **`mando_watchdog.py`**
    *   **Function:** Native Loopback self-healing daemon. Pings local application ports and hardware interfaces, executing service restarts and logging alert incidents to `sovereign_now.db`.
*   **`organize_inbox.py`**
    *   **Function:** Zero-litter Inbox synchronization script. Runs post-sprint to group inbox files into `tickets/`, `reports/`, `dashboards/`, and sync the amnesia-bypassing `claude_drop/` package.

---

## 🌐 4. TAILSCALE MAGICDNS NETWORKING TOPOLOGY

Sovereign OS operates on a private mesh network secured by Tailscale. Hardcoded local IPs are prohibited—MagicDNS Magic names are used exclusively:

| Tailscale Hostname | MagicDNS Address | Role & Core Hardware Specs |
| :--- | :--- | :--- |
| **`clio`** | `clio.taila01894.ts.net` | **Workstation Server**. Runs the entire Core stack, SDLC API, and Sports Chat relays. |
| **`argo`** | `argo.taila01894.ts.net` | **Vision & Player Kiosk**. Directs Sovereign Cinema rendering and custom edge camera vision feeds. |
| **`metsy-prime`**| `metsy-prime.taila01894.ts.net`| **TV RPG Kiosk**. Dedicated full-screen card board server on Port `7300`. |
| **`hobbes`** | `hobbes.taila01894.ts.net` | General mesh hardware node. Mapped for container failovers. |
| **`calvin`** | `calvin.taila01894.ts.net` | Mesh storage backup node. Runs GardenStack agricultural telemetry cams. |

---

## 🏛️ 5. IN inbox AND SYNC PROTOCOLS

### Zero-Litter Inbox Invariant (**KI-050**)
Loose files in the root of `/home/james/sovereign_inbox/` are BANNED. Files must reside strictly in:
1. `/sovereign_inbox/tickets/` — Ticket walkthroughs and design plans.
2. `/sovereign_inbox/reports/` — Executive summaries, logs, and audits.
3. `/sovereign_inbox/dashboards/` — Screenshots and layout images.
4. `/sovereign_inbox/daily_MMDDYYYY/` — Transient data and date-based logs.

### The Claude Drop Sync Invariant
To cure amnesia across separate LLM chats, the `/home/james/sovereign_inbox/today/claude_drop/` folder MUST mirror all core DNA blueprints, pilot profiles, active ticket walkthroughs, and executive reports. Human operators simply select all items (`Ctrl+A`) from the Samba share and drag them directly into the Claude.ai project knowledge base window to instantly synchronize the workspace.
