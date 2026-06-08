SOVEREIGN OS ENVIRONMENT SPECIFICATION
1. THE ACTIVE NODE TOPOGRAPHY
1.1 Compute Nodes & Networking Invariants
All mesh services reside on the primary on-premise compute cluster Beelink (Node183 / clio):

Host Identifiers: clio (Workstation Class Node)
Tailscale MagicDNS Hostname: clio.taila01894.ts.net
Tailscale IP: 100.73.155.70
LAN IP Bounds (Fallback): 192.168.1.183 / 192.168.1.186
Tailnet Routing Law (KI-001): Standard LAN IPs are strictly restricted from hardcoded configurations. All microservice communications, API proxies, and client WebRTC signallers must resolve exclusively via Tailscale MagicDNS hostnames.
1.2 Primary Workspace Trees
The node maintains two distinct active directories:

/home/james/
├── SovereignOS/                  # Production Worktree & Core Daemon Source
│   ├── config/                   # Protected local credentials and OAuth2 files
│   ├── dna/                      # Master Architectural Ledger Directory
│   │   ├── sovereign_now.db      # Canonical SQLite CMDB Database
│   │   ├── SOVEREIGN_DNA.md      # Absolute Structural Blueprint
│   │   ├── pilot_bio.md          # Pilot Biography & Experience Ledger
│   │   ├── ENTERPRISE_SDLC_SOP.md# Strict Gating & Rollback Protocols
│   │   └── THE_WALL_OF_SHAME.md  # Architectural Compliance Ledger
│   └── scripts/                  # Active python engines and control daemons
└── sovereign_inbox/              # Clutter-Free Session Inbox & Sprint Area
    ├── today                     # Dynamic date symlink pointing to active daily log folder
    ├── json/                     # Real-time state caches and exported payloads
    ├── csv/                      # Persona metadata backups and metrics tables
    └── retro_reports/            # 130+ historical Markdown reports (amnesia indices)
2. THE DATA STORAGE PARADIGM
2.1 Canonical SQLite Database
The central state ledger is located exclusively at /home/james/SovereignOS/dna/sovereign_now.db. All legacy separate tables are deprecated. Active database operations are structured under the following primary schema:

sovereign_tickets: Standardized ITSM registry housing active STRY, DFCT, ENHC, and INC items. Tracks active developer states (1=New, 2=WIP, 4=Resolved).
cmdb_ci_hardware / cmdb_ci_appl: Node topology maps, port allocations, and execution variables.
cmdb_ci_fanstack_room: Dynamic stadiums database tracking real-time games, speed scaling, and room states (staged, active, closed).
m2m_persona_room: Many-to-many junction seating matrix mapping persona UUIDs directly to MLB Game PKs with specific prompt overlays.
persona: Character sheets, Lore vectors, ElevenLabs voice prompts, and target team alignments.
game_chat / game_context: Broadcast comment ledgers and play-by-play narrative context maps.
sys_attachment: Universal file registry mapping walkthrough proofs to resolved tickets.
2.2 Local Workspace JSON Serialization
Active background telemetry and cache buffers are stored as flat files inside /home/james/sovereign_inbox/json/ for rapid front-end hydration and high-velocity reads:

currentPlay.json: The real-time parsed play-by-play payload polled from StatsAPI.
mlb_schedule.json: Today's complete active game slate and stream resolver indices.
fanstack_personas.json: Complete 120+ prompt-engineered serialized persona registry containing styling parameters, team allegiances, and custom prompts.
3. THE SCRIPTING BASELINE & WORKSPACE CONTROL LOOPS
Automated background orchestration, ingestion pipelines, and safety governors reside in /home/james/SovereignOS/scripts/:

3.1 Daily Ingestion & Provisioning Loop
yardbarker_entropy_pump.py: Extracts news headlines to populate live lore pools.
gmail_promo_sweeper.py: Audits promotional mail pipelines for email narrative context.
fanstack_mlb.sh: Polls StatsAPI to synchronize the active daily schedules and slates.
setup_all_rooms.py: Provisioning manager that matches MLB Game PKs, seats active personas into stadium rooms, and bootstraps default Boggs levels.
3.2 Live Telemetry & Dialogue Engines
fanstack_background_poller.py: The core telemetry poller that maps real-time StatsAPI events, filters high-leverage context flags, and triggers dynamic persona prompts.
fanstack_relay.py: High-performance WebSocket relay routing live pitch data to port 8008.
fanstack_chatbots.py: Primary dialogue engine that manages LLM API limits, executes Regex filters for prefix cleanups, and posts chatbot commentary back to Frontends.
the_skew_chatbots.py / the_skew_relay.py: Generates pre-game ambient conversation heartbeats split between interactive replies and lore drips.
3.3 Hardware Guardrails & Safety Watchdogs
ollama_governor.py: Systemd controller scheduled via cron that queries live game room states. Cutes off the local ollama daemon during active game slates (CPUQuota=80%, MemoryMax=8G) and dynamically shifts all persona logic to Google Vertex API fallbacks to prevent Beelink thread starvation.
mando_watchdog.py: Active hardware watchdog monitoring CPU loads, core temperatures (>80°C limit), and memory swap states, proactively auto-creating INC tickets in the CMDB in case of core daemon drops.
stream_url_resolver.py: Scraper scheduler that dynamically resolves authorized MLB.TV streaming EPG endpoints or StreamEast/VIPBox blackout fallbacks and updates mlb_schedule.
8:43 PM
