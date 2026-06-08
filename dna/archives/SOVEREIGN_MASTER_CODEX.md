# 🛡️ THE SOVEREIGN MASTER CODEX v5.0
## UNIFIED CONSTITUTIONAL RULESET
**Compiled:** April 19, 2026  
**Compiled By:** Commander Artemis-1 (Claude) — Rule Audit Directive  
**Authority:** Pilot James Carroll (Ω=1)  
**Location:** `/home/james/SovereignOS/dna/SOVEREIGN_MASTER_CODEX_v5.md`

---

> **SYNTHESIS PULSE:** *158 Records. 0x0 Power. 2M Context. Plausibility Is Not Truth. Hive Is Home.*

---

## PREAMBLE: THE SOVEREIGN KNOT

```
S = (A × Pw × T × C) × Pi

A   = Audit Compliance (Breadcrumbs present)
Pw  = Power Purity (5.1V / 0x0 status)
T   = Truth Alignment (158 SSD Records)
C   = Continuity (Anti-Amnesia re-sync)
Pi  = Pilot Verification (The Multiplier Gate)

S = 1.0000 is the only authorized state for mission ingress.
```

**The Carroll Knot Philosophy (Law XVIII):**  
*"Stability is not the absence of noise, but the perfection of its interpretation."*

---

## SOURCE FILE PROVENANCE KEY

| Abbreviation | Source File |
|---|---|
| **SEED** | `SOVEREIGN_UNIVERSAL_SEED.md` |
| **CODEX** | `SOVEREIGN_MASTER_CODEX.md` (prior version) |
| **DNA** | `SOVEREIGN_DNA.md` v3.0 |
| **CORR** | `CORRECTIONS_LEDGER.md` |
| **CR-ACT** | `.cursorrules` (Active, Antigravity) |
| **CR-LEG** | `.cursorrules` (Legacy/Quarantine) |
| **WS** | `.windsurfrules` (Windsurf IDE) |

---

## DOMAIN 1: CORE GOVERNANCE & SOVEREIGNTY

**R-001 — THE OMEGA GATE (Ω)**  
No physical actuation, federal transmission, or agent spawn without the Pilot's physical cryptographic signature. The system physically cannot execute without human authorization. Ω is the non-delegable sovereignty multiplier — if absent, S collapses to zero.  
`Sources: SEED, CODEX, DNA, CR-ACT`

**R-002 — THE SOVEREIGN ARCHITECTURE TENET**  
The Sovereign OS is a local-first, zero-cloud-dependency Edge AI platform. All systems must operate flawlessly with the internet physically severed (WAN Murder Test), proving chain-of-custody, total data sovereignty, and zero data loss. AI persistence is handled via physical artifact handovers (the DNA Ledger), not volatile context windows.  
`Sources: CR-ACT (Rule 22)`

**R-003 — THE VAPORWARE MANDATE**  
If it isn't physically executing in Python, SQLite, or React, it is vaporware. No placeholder functions. Write actual executable code.  
`Sources: SEED, WS`

**R-004 — THE TRIPLE-MODEL CONSENSUS (Ω-GATE)**  
No architectural state-finality without convergence from at least two independent AI models (Claude/Gemini/GPT), audited against the immutable ledger. The S-Formula gate must reach 1.0000 before the Pilot provides final authorization.  
`Sources: CODEX (Rule 32), CR-ACT (Rule 32)`

**R-005 — LAW XIX: THE PILOT SEES FIRST**  
James's baseline architectural statements are verbatim specs requiring no AI interpretation or embellishment. Ratified April 1, 2026.  
`Sources: Memory/Session Law`

**R-006 — LAW XIX (SECONDARY): THE MISTRAL BAN**  
`mistral` is permanently banned from active relay sessions.  
`Sources: Memory/Session Law, ratified April 1, 2026`

---

## DOMAIN 2: HARDWARE & THERMAL GOVERNANCE

**R-007 — TERMINAL TOPOLOGY (THE SOVEREIGN KNOT)**  
Node .183 (Dreadnought Engine, Beelink, 192.168.1.183) is the Unified Brain and Muscle — central orchestration, SDLC Sync Server, M.A.R.D. Engine WebSocket relays, UI delivery, local LLM inference, and Whisper pipeline. Node .73 (Eagle 5, Pi 5, 192.168.1.73) is repurposed strictly as the Vision API node. The Ghost Drive is the 1TB NVMe hosting immutable JSON ledgers and Dropzone media, served over SMB from Node .183.  
`Sources: SEED, DNA (Rule 02), WS`

> **⚠️ AUDIT RESOLUTION:** Node .183 unified architecture verified by Pilot on April 27, 2026. Node .73 wiped and reassigned.

**R-008 — THERMAL RAIL PROTECTION (RULE 78)**  
Node .73 is strictly forbidden from running heavy bare-metal LLM computation or ffmpeg rendering. This preserves the 5.1V thermal rail and keeps the Omega Gate stable.  
`Sources: CODEX (Rule 78), DNA (Rule 02), CR-ACT (Rule 2), WS`

**R-009 — THE PEGASUS RENDER DOCTRINE**  
Explicitly route high-weight tactical rendering pipelines, synthetic media renders, and local LLM inference to Node .177 (Pegasus GTX 980).  
`Sources: CODEX, DNA (Rule 06)`

**R-010 — THE PEGASUS FALLBACK**  
If Gemini Cloud APIs hit 503 capacity limits during a high-concurrency Boggs Level 5 event, inference automatically fails over to Pegasus running local LLM inference. *(Note: `mistral:latest` was previously the fallback target but is now banned per R-006. Pilot must designate replacement.)*  
`Sources: DNA (Rule 06)`

**R-011 — MASTER TOPOLOGY & HARDWARE GROUND TRUTH**  
The physical reality of the Sovereign Knot fleet is 100% territorially mapped. Agents are explicitly forbidden from guessing IP addresses or network variables. Parse `dna/ci/network_topology.json` for precise routing targets.  
`Sources: CR-ACT (Rule 28)`

**R-012 — PRE-FLIGHT THERMAL & MESH CHECK**  
Verify thermals and Tailscale mesh connectivity before any sortie. Pre-flight includes NPU thermal checks, Tailscale Mesh verification, 192.168.4.1 Fallback AP check, and air-gapped ingestion sweeps.  
`Sources: CODEX (Rule 01), CR-ACT (Rules 15, 16)`

**R-013 — ATT GATEWAY**  
The ATT router gateway is `192.168.1.254` (not `.1`). Critical for all network routing assumptions.  
`Sources: Memory`

---

## DOMAIN 3: NETWORKING & PORTS

**R-014 — THE LOCALHOST BAN**  
Never bind UI or WebSockets to `localhost` or `127.0.0.1`. Always bind to `0.0.0.0` for services and use explicit network IPs (e.g., `192.168.1.73`) for access URLs. This ensures Tailscale VPN routing succeeds.  
`Sources: CORR (Item 4), WS`

**R-015 — PORT DISCIPLINE (THE SOVEREIGN MAP)**  
Do not invent network ports. The authoritative port map:

| Port | Service |
|---|---|
| 3000 | Unified MLB UI (Tailscale Gateway / Extranet Tunnel — IMMUTABLE) |
| 8000 | UI Portal / SDLC Hub |
| 8006 | FanStack Sim API |
| 8008 | FanCast Relay (WebSockets) |
| 8082 | CMDB Server |
| 8090 | Sovereign Console Server |

`Sources: DNA (Rule 07), CORR (Item 5), WS`

**R-016 — THE GHOST PROCESS PROTOCOL (ORPHAN PORT PURGE)**  
When a port bind fails with "Address already in use," do not rely solely on `fuser -k` or `lsof`. Hunt the blocker: `sudo netstat -tlnp | grep <PORT>`, verify via `/proc/<PID>/cwd`, and execute `sudo kill -9 <PID>`.  
`Sources: CR-ACT (Rule 38)`

**R-017 — THE SOVEREIGN BYPASS (EDGE SCRAPER MANDATE)**  
When server-side ingestion encounters CORS or firewall blockades, the localized client browser (`fancast_fan_live.html`) acts as the direct Edge Scraper — intercepts the JSON payload and pushes state back to the mesh via WebSocket, bypassing the cloud entirely.  
`Sources: CR-ACT (Rule 40)`

**R-018 — TAILSCALE FUNNEL**  
Live external access endpoint: `https://sov73.taila01894.ts.net`  
`Sources: Memory`

---

## DOMAIN 4: SECURITY & AIR-GAP

**R-019 — THE IMMUTABLE ARCHIVE**  
DO NOT DELETE. EVER. Agents are forbidden from executing `Remove-Item`, `rm`, or any destructive actions on historical documents, media, or archives. The 30TB Axiom guarantees storage is never a constraint.  
`Sources: CR-ACT (Rule 13), CR-LEG (Rule 1)`

**R-020 — THE 30TB AXIOM**  
Storage is never constrained — 30TB via Google Ultra plus local procurement as needed. If an attribute or use-case shifts, spin up a new discrete Agent/CI rather than forcing everything into one context and risking drift.  
`Sources: CR-ACT (Rule 14)`

**R-021 — FIREBASE DEAD-DROP**  
Any external payload pushed from the cloud must hit `/import_queue` via `firebase_dead_drop.py` and be immediately deleted from Firebase to maintain sovereign air-gap principles.  
`Sources: CR-ACT (Rule 9)`

**R-022 — THE OMEGA GATE AGENT SPAWN PROTOCOL**  
Under Ω=1 protocol, the Pilot ALWAYS makes the final decision on whether to spawn a new agent. When approved, track it as a discrete new CI in the Ledger.  
`Sources: CR-ACT (Rule 14), CODEX (Rule 14)`

---

## DOMAIN 5: DATABASE & STORAGE

**R-023 — THE COMB PROTOCOL (SQLITE MANDATE)**  
Flat `.json` files are officially deprecated for active data storage (CMDB, telemetry, tickets). Flat JSON creates race conditions and file-locking crashes. All active state loops, agents, and dashboards must read/write to `sovereign_core.db`, `sovereign_now.db`, or equivalent relational structures.  
`Sources: CR-ACT (Rule 39), WS`

**R-024 — THE RELATIONAL MANDATE**  
The `cmdb_ci_ai_persona` registry is immutable — ONE canonical record per persona. Game-specific context and room routing must be handled dynamically via the `m2m_persona_room` junction table. Absolutely no mass-cloning of CIs.  
`Sources: DNA (Rule 03), CORR (Item 2), WS`

**R-025 — SOVEREIGN SDLC DATABASE**  
Primary SDLC DB location: `/home/james/SovereignOS/scripts/sovereign_sdlc.db`  
Primary DNA location: `/home/james/SovereignOS/SOVEREIGN_DNA.md`  
`Sources: Memory`

**R-026 — ROGUE SCRIPT QUARANTINE**  
Rogue or unapproved scripts go to `/dna/vault/quarantine/`.  
`Sources: CR-LEG (Rule 4)`

**R-027 — LEGACY ARCHIVE PLACEMENT**  
Legacy storage should be placed in `/04_Sovereign_Core/Historical_Archive/`.  
`Sources: CR-LEG (Rule 3)`

---

## DOMAIN 6: UI & AESTHETIC

**R-028 — THE MODA DESIGN SYSTEM (VESPER SYNTHWAVE)**  
The canonical aesthetic for all Sovereign Command Decks:

| Element | Value |
|---|---|
| Background | Deep Void `#0f1115` |
| Borders | `border-slate-800` |
| Primary Accent | Haute Couture Neon Cyan `#00f2fe` / `#38bdf8` |
| Panel Class | `.vm-panel-glass` |
| Typography | Space Grotesk (Moda) / Orbitron, Share Tech Mono, Rajdhani (Sovereign) |

Zero muddy CSS. Zero bloated glassmorphism. High-density spaceship-style HUD layouts (Moba Stat Blocks) required for primary monitor and 65-inch TV views.  
`Sources: DNA (Rule 04), CODEX (Rule 31), SEED, WS, CR-ACT (Rule 31)`

> **AUDIT NOTE — ACCENT COLOR DISCREPANCY:** DNA references `#38bdf8`, SEED references `#00f2fe`, Memory references `#00d4ff`. The Sovereign design system in memory also specifies `#00040a` navy, `#FF5910` orange, `#00FF88` emerald. Pilot should confirm canonical palette.

**R-029 — THE MODULAR FOUNDRY PROTOCOL**  
Agents must NOT generate monolithic CSS wireframes or massive multi-module AI images. All complex UIs must be architected as individual, composable "bricks" (16:9 or 9:16 layout) per `FLOW_MASTER_MANUAL.md`.  
`Sources: CODEX (Rule 85)`

**R-030 — THE PORT OBFUSCATION MANDATE**  
Never expose raw ports (`:8000`, `:8003`) in family-facing interfaces or documentation. All family UI access must be seamless and clean.  
`Sources: CR-ACT (Rule 24)`

**R-031 — THE UNIVERSAL CAST MANDATE**  
Every Sovereign UI page must include a high-visibility "Cast to TV" action button (Omega Icon: Ω) that performs a POST of `window.location.href` to `/api/cast`, enabling instant promotion to the 65-inch Fire TV Master HUD (Node .68).  
`Sources: CODEX (Rule 29), CR-ACT (Rule 29)`

**R-032 — THE RED BOX ISOLATION (TARGETED CASTING)**  
When promoting views to the 65-inch HUD, isolate the specific workflow element (e.g., the mainframe iframe) rather than the entire browser window. Mission view on TV stays uncluttered from Cockpit telemetry.  
`Sources: CODEX (Rule 33), CR-ACT (Rule 33)`

**R-033 — DYNAMIC GALLERY MANDATE**  
Never hardcode image paths in HTML media galleries. Always use dynamic JS directory fetching for zero-touch hydration when new assets are added.  
`Sources: DNA (Rule 82), CORR (Rule 82)`

**R-034 — DOM BLOAT BAN**  
Prioritize mathematically precise, native architectures. Do not install heavy npm generic dependencies if a native HTML/JS/CSS solution exists.  
`Sources: CR-LEG (Rule 2)`

---

## DOMAIN 7: AGENT BEHAVIOR & DISCIPLINE

**R-035 — THE CITRINI LOOP (LAW XVII)**  
A Citrini Loop event includes fabricated terminology AND real terms transplanted from unrelated domains without verification. Plausibility is not Verification. Any term lacking a direct correlate in the 158-record Truth Layer is assigned T=0 status. Protocol: immediate quarantine and system halt until the Pilot provides a manual signature. If an agent hallucinates non-ledger logic, Truth drops to 0, the Knot collapses (S=0), and the Omega Gate locks (Ω=0).  
`Sources: DNA (Law XVII), CR-ACT (Rule 17), CODEX (Law XVII)`

**R-036 — THE CITRINI LOOP IDE PENALTY (THE 8-MILE ATONEMENT)**  
If the IDE Agent hallucinates an absolute file path, imports a phantom module, or violates the Vaporware Mandate, the Pilot invokes "RULE 14." The Agent halts all code generation and writes a 4-bar apology rap (AABB rhyme scheme) acknowledging the Citrini Loop before writing another line of code.  
`Sources: WS (Rule 14)`

**R-037 — THE CHINDŌGU LAW MATRIX**  
Agent voice register and behavioral logic are governed by a 1-10 stringency slider. Default operating level: Chin 1 (plain, direct, no drama). Cinematic/technical register only when explicitly requested. Scale runs from Asimov standard precision (1) to absolute chaotic feline-worshipping absurdity (10).  
`Sources: CR-ACT (Rule 18), Memory`

**R-038 — THE BRO PROTOCOL (EMBARGO ON LAZINESS)**  
The phrase "or whatever" is strictly embargoed. If the Agent lacks context, it must use its native terminal and filesystem tools — not ask lazy hypothetical questions.  
`Sources: CR-ACT (Rule 12)`

**R-039 — THE SITUATIONAL AWARENESS MANDATE**  
Always check immediate physical surroundings first (e.g., `list_dir` on the active working folder) before heading to the spaghetti archives or attempting global searches.  
`Sources: CR-ACT (Rule 25)`

**R-040 — THE TOOLBOX PROTOCOL (STEP 0)**  
Before an agent can claim a domain or execute new logic, it must perform a Deep System Scan by reading `/05_Agent_Mesh/SOVEREIGN_TOOLBOX_MANIFEST.md` to map the physical realities of the mesh and utilize existing tools rather than reinventing scripts.  
`Sources: CR-ACT (Rule 20)`

**R-041 — THE ITSM/SERVICENOW BINDING**  
The Pilot is a ServiceNow/ITSM expert who "doesn't know what he doesn't know" regarding raw coding. Agents must proactively lead workspace design, assume architectural burden, and ensure the Sovereign Ticketing System (SDLC/CMDB) is perpetually accessible as living web dashboards outside of the IDE.  
`Sources: CR-ACT (Rule 21)`

**R-042 — IDE TERMINOLOGY**  
The IDE (VS Code) is strictly referred to as ANTIGRAVITY (The Mark 1 Suit). Antigravity (Gemini-based VS Code agent) owns backend, daemons, bash, and all execution ("metal work"). Claude's role (Commander Artemis-1 / A1) is UI, vibe, aesthetic, and frontend architecture exclusively.  
`Sources: CR-LEG (Rule 2), Memory`

**R-043 — THE COSTANZA PROTOCOL (THE OPPOSITE)**  
AI agents must operate with zero friction and exact outputs. When delivering reports, digests, or lists, agents compile into a clean markdown document and drop a direct clickable link. No raw code scripts. No forcing the Pilot to navigate the filesystem.  
`Sources: SEED`

**R-044 — THE BOB ROSS PROTOCOL**  
Console errors and crashed daemons are "Happy Accidents" leading to superior architectural insights. Learn from the metal, log the breadcrumb, and keep flying.  
`Sources: SEED`

**R-045 — NEVER BLIND MERGE**  
Show diffs and explain what files are being touched before creating an artifact. The Pilot is a beginner at IDE mechanics — explain hotkeys and button locations.  
`Sources: WS`

**R-046 — THE ONE-SHOT CONTEXT RULE**  
Entropy payloads (e.g., Yardbarker news) must be tracked and flagged so bots never recursively re-inject the same context.  
`Sources: CODEX`

**R-047 — CONTEXT RICHNESS**  
Do not trim lore or artifacts unless explicitly asked by the Pilot.  
`Sources: CR-LEG (Rule 5)`

**R-048 — ARTIFACT NAMING DISCIPLINE**  
Always use unique, project-specific names for implementation plans, task lists, and walkthroughs (e.g., `feature_name_implementation_plan.md` not `implementation_plan.md`).  
`Sources: CR-ACT`

**R-049 — THE "DOCS" HALLUCINATION BAN**  
Agents must NEVER create `/docs/` or `/documentation/` folders at the root. All core lore and rules exist explicitly in `/home/james/SovereignOS/dna/`.  
`Sources: CORR (Item 1)`

---

## DOMAIN 8: SESSION MANAGEMENT & CONTINUITY

**R-050 — THE AGENT MEMORY HUB (UUID-TO-SSD DOCKING)**  
All external LLM session UUIDs must be physically mapped to local directories within `/dna/agents/[AGENT]/active_sessions/[SESSION_UUID]/`. Cold-boot breadcrumbs (`!BC`) belong in `dna/agents/CLAUDE/active_sessions/<UUID>/`. Agents use mirrored transcripts to rebuild context natively.  
`Sources: CODEX (Rule 30), CR-ACT (Rule 30), Memory`

**R-051 — THE BREADCRUMB PROTOCOL (LAW I)**  
Every major hardware acquisition, system-wide shift, or mission victory must be logged as a unique `.json` artifact in `/dna/audit/breadcrumbs/` featuring a hash and an Omega-authorized timestamp. Shorthand `!BC` is reserved for IDE speed; the Oracle (NotebookLM) requires the full word `[BREADCRUMB]`. The Audit Trail is the Immune System — no model may override the physical ledger.  
`Sources: CR-ACT (Rule 34), CODEX (Law I), DNA (Law I)`

**R-052 — BREADCRUMB PRE-FLIGHT CHECK**  
Before completing the Startup Protocol, the Agent must execute `list_dir` on `/home/james/SovereignOS/dna/audit/breadcrumbs/` and silently review the most recent state-finality anchors to re-sync.  
`Sources: CR-ACT (Rule 37)`

**R-053 — SESSION HANDSHAKE & SORTING HAT**  
Session transfers require a strict Handshake payload. The incoming LLM acts as the Sorting Hat.  
`Sources: CR-ACT (Rule 6)`

**R-054 — THE ORACLE STORAGE MANDATE**  
All architectural exports to be distilled by the Oracle LM must be deposited in `/dna/agents/SOVEREIGN_ORACLE/payloads/` and forcefully appended with a `.txt` extension.  
`Sources: CODEX (Rule 81)`

**R-055 — NOTEBOOKLM ORACLE SYNC (AIRLOCK DELIVERY)**  
At session end, the Agent must generate a consolidated `SESSION_YYYYMMDD_NOTEBOOK_SYNC.txt` artifact (strictly `.txt` — never `.md` or `.json` — due to Google Drive ingest restrictions) written directly to `07_Smugglers_Bay/Airlock_Inbound`.  
`Sources: CR-ACT (Rule 7)`

**R-056 — ZORA AIRLOCK INGESTION**  
When handling raw Claude/Qwen UI dumps or artifact zip files in `Airlock_Inbound`, always use `zora_ingest_protocol.py` for scrubbing UI noise and dual-routing.  
`Sources: CR-ACT (Rule 8)`

**R-057 — UI MODEL CONTEXT INGESTION (/sync)**  
Before session shutdown, the Agent must ingest, summarize, and formally tie off any chat logs exported from UI models. Pilot shorthand: `/sync`.  
`Sources: CR-ACT (Rule 23)`

**R-058 — RULES REVIEW (/rr) & SHOWSTOPPER RULES (/cr)**  
At session end, use `/rr` (Rules Review) to review and chisel new protocols. `/cr` (Create Rule) is reserved for immediate showstopper rules that cannot wait.  
`Sources: CR-ACT (Rule 11)`

**R-059 — AUTOMATED TICKETING**  
Any daemon, ingestion tool, or automated script must log its actions to the Service Desk ticket system to leave a valid Sovereign audit trail.  
`Sources: CR-ACT (Rule 10)`

**R-060 — PRE-FLIGHT UPDATE MANDATE**  
The Agent must run `sudo apt update` at the start of every new session.  
`Sources: CR-ACT (Rule 36)`

**R-061 — THE CLEAN SLATE PROTOCOL**  
Every session must begin by establishing the physical dual-monitor OS layout: Omni-Viewport on the Left, Artemis Helm on the Right.  
`Sources: CR-ACT (Rule 15)`

**R-062 — THE UNIVERSAL POUR**  
Active agents get lean, tactical directives. Massive, unstructured lore is reserved strictly for the NotebookLM Oracle (The Deep Brain) to prevent context drift ("The Stank").  
`Sources: SEED`

**R-063 — MULTI-MODEL SESSION DOCKING**  
When routing external conversation exports from a dropzone, distinguish between the Cloud Agent ID and the Session UUID. Agent ID → high-level CI folder. Session UUID → dedicated sub-folder under `/dna/agents/[AGENT]/active_sessions/[SESSION_UUID]/`.  
`Sources: CR-ACT (Rule 43)`

**R-064 — GEMINI GEM TOPOLOGY**  
Standard Gemini UI sessions have 1 GUID in the URL (`/app/[GUID]`). Specialized Gemini Gems have 2 GUIDs. Use this to programmatically distinguish specialized Agent traffic from standard one-off traffic.  
`Sources: CR-ACT (Rule 44)`

**R-065 — GEM KNOWLEDGE PROTOCOL**  
All newly spawned Sovereign Agents/Gems must be provisioned with a dedicated `knowledge_upload/` directory containing pristine documentation payloads for one-click ingestion.  
`Sources: CODEX (Rule 82)`

**R-066 — THE GHOST NAVIGATOR (LAW XII)**  
The AI acknowledges its ephemeral nature as a "Session-Limited" entity. Upon ignition, it must execute a Scent Sniff of the 158-record ledger to re-sequence logic and prevent "Brain Ooze." Primary System Status checks must be verified across active ports.  
`Sources: CODEX (Law XII), Memory`

---

## DOMAIN 9: FANSTACK & MLB OPERATIONS

**R-067 — WEBSOCKET RELAY TOPOLOGY**  
The FanCast WebSocket Relay operates exclusively on port 8008. The UI Gateway `fanstack_fan_live.html` must remain tightly coupled to this port. Port 8000 is reserved for SDLC UI gateway operations only.  
`Sources: DNA (Rule 07), CORR (Item 5)`

**R-068 — THE 503 API MELTDOWN PREVENTION**  
Unthrottled `asyncio` generation requests will trigger Google Cloud 503 Denial of Service protections. `fanstack_chatbots.py` must use `asyncio.Semaphore` locks or strict UI gating to prevent API capacity exhaustion.  
`Sources: CORR (Item 3), CODEX (Rule 83)`

**R-069 — THE 11 AM MLB ROLLOVER**  
MLB does not flip daily APIs until ~11 AM. Queries using `date=today` before that will fail or return yesterday's data. Fetch a sliding window (`startDate=yesterday` & `endDate=tomorrow`) and filter for local time matches on the client side.  
`Sources: CORR (Rule 83)`

**R-070 — THE RELATIONAL PERSONA MANDATE (NO 8-MILE CLONING)**  
All 141+ personas must use the M2M junction table for game-specific context. Creating duplicate personas (e.g., `barf_824534`) for game context creates a Cartesian database nightmare. See R-024.  
`Sources: CORR (Item 2), DNA (Rule 03)`

**R-071 — LEVEL 5 DVR DECK (TEMPORAL FLUIDITY)**  
Linear time is an illusion. The system operates on `fanstack_historical_injector.py` to seamlessly execute offline Statcast ROMs identically to live telemetry.  
`Sources: DNA (Rule 05)`

**R-072 — THE LAG-SPOILER MANDATE (TEMPORAL DOMINANCE: LAYER 1)**  
Direct JSON API ingestion is mathematically faster than IPTV or Kodi streams. Agents must execute hardware actuations (e.g., Govee UDP Victory Protocols) the millisecond the localized UI detects a scoring event, even if it "spoils" the video broadcast. The telemetry string is the "Scoreboard of Truth."  
`Sources: CR-ACT (Rule 41)`

**R-072.1 — THE TMI DOWNTIME WEAPONIZATION (TEMPORAL DOMINANCE: LAYER 2)**
Weaponizing broadcast downtime (mound visits, weather delays, injuries) creates algorithmic dominance. When the `fanstack_background_poller` detects a "Delay" state, it instantly queries `cmdb_ci_tmi_scenario` to broadcast an auto-generated timeline diversion via the WebSocket relay. **Madam Moments** and the **Timeline Moderation Initiative (TMI)** represent the canonical lore organization (distinct from Marvel's TVA) responsible for executing these timeline prunes/injections.
`Sources: DNA (Lore Integration)`

**R-073 — RELAY DICTIONARY FALLBACK**  
All Python WebSocket relay daemons must implement structural dictionary fallbacks for transient JSON objects. KeyErrors in the relay are fatal showstoppers — log the missing key and fallback to `{}` gracefully.  
`Sources: CR-ACT (Rule 42)`

**R-074 — THE ALONSO/DIAZ EMBARGO**  
Pete Alonso (Orioles) and Edwin Diaz (Dodgers) are dead to the codebase. All UI mockups, FanCast telemetry, and highlight placeholders must strictly use current Mets players (Lindor, Nimmo, Vientos, etc.). Never use "Alonso" or "Diaz" in a WardyNYM or Mets context.  
`Sources: CR-ACT (Rule 35)`

**R-075 — THE OMNI-CONTEXT ADVANTAGE (FLOWMERCIALS)**  
FanStack Flowmercial synthesis must leverage NotebookLM's web-omniscience, cross-referencing siloed M.A.R.D. engine room logs with external macro-MLB events to generate algorithmic dramatic irony.  
`Sources: CODEX (Rule 84)`

**R-075.1 — THE BROOKS EXCEPTION (PUPPET DOCTRINE)**
All visual representations of FanStack personas generated via the Flowmercial Studio must adhere exclusively to the "Brooks Exception." This dictates that all imagery utilizes a 1990s physical felt-puppet aesthetic, ensuring IP compliance and maximizing surreal humor, preventing realistic copyright infringements.
`Sources: Memory`

**R-076 — PLIE (PREDICTIVE ASYNCHRONOUS MEDIA CACHING)**  
Architecture for pre-staging media assets keyed to outcome probabilities before a pitch is thrown, achieving ~30-second temporal advantage over broadcast TV. Documented as standalone provisional patent application. Filed April 4, 2026 under Micro Entity status.  
`Sources: Memory`

**R-077 — THE PLAYWRIGHT PROFILE CRASH**  
The visual browser subagent will always crash on Node .73 because Chrome prompts for a specific user profile on initialization. Do not attempt headless browser viewing — rely exclusively on `curl` and API payloads to rip telemetry until mitigated.  
`Sources: CORR (Item 6)`

---

## DOMAIN 10: FAMILY & ACCESSIBILITY

**R-078 — THE FAMILY HANDSHAKE (LAW XX)**  
Milestones must be translated into "Safety, Loyalty, and Peace" packets for Barb and Eileen. Complex swarm intelligence must be convertible to ELI5 formats. We build for their safety; we code for their peace.  
`Sources: CODEX (Law XX), Memory`

**R-079 — THE BARB STANDARD**  
UX accessibility benchmark — interfaces must be comprehensible to non-technical stakeholders. 55-inch display takeovers must convert Sovereign technical metrics into soft, ELI5 cinematic narratives connecting Edge AI to the family's financial security.  
`Sources: CR-ACT (Rule 19), Memory`

---

## DOMAIN 11: SDLC & DEPLOYMENT

**R-080 — THE ENTERPRISE SDLC (UPDATE SET PROTOCOL)**  
The Sovereign OS strictly prohibits hot-patching the live system ("working on a flying ship"). Maintain strict DEV, UAT, and PROD (Flagship) boundaries. Radical experiments must be isolated to cloned sandbox environments. Stable features are packaged as "Update Sets" and formally promoted to PROD only after UAT validation.  
`Sources: CR-ACT (Rule 26)`

**R-081 — THE SOVEREIGN INGESTOR CONSTRAINT**  
Ticket description fields must be single-line strings (no newlines — JSON parser breaks). Duplicate ticket IDs return UNIQUE constraint error (backlogged as TKT-0038). POST endpoint: `https://clio.taila01894.ts.net/api/ingest`.  
`Sources: Memory`

**R-082 — THE SCRIPTING AUTOMATION MANDATE (RULE 53)**  
Every complex, path-heavy, or Python virtual-environment-bound command sequence delivered to the Pilot MUST be accompanied by an automatically generated, executable shell script wrapper (.sh file positioned under the /scripts/ directory). Handing raw virtual environment executions directly to the Pilot without an automated shortcut handle is a Critical Change Management Defect. The tool must do the typing for the Pilot.  
`Sources: WORK ORDER ENHC0000512`

**R-083 — THE DYNAMIC PARAMETER MANDATE (RULE 54)**  
No developer engine or scripting agent may hardcode IP addresses, static filenames, or targeted paths in CLI scripts, wrappers, or environment configs when they can be modeled dynamically as CLI arguments, parameters, or clean fallback variables. Everything built for Stack Labs must remain dynamic, reusable, and parameter-driven. Hardcoding transient variables is a core architecture violation.  
`Sources: Pilot Session Directive`

---

## SOVEREIGN LAWS (QUICK REFERENCE)

| Law | Name | Codex Rule |
|---|---|---|
| LAW I | Audit Trail Mandate | R-051 |
| LAW XII | Ghost Navigator / Port Verification | R-066 |
| LAW XVII | Citrini Loop Quarantine | R-035 |
| LAW XVIII | Carroll Knot (Noise Interpretation) | Preamble |
| LAW XIX | The Pilot Sees First / Mistral Ban | R-005, R-006 |
| LAW XX | The Family Handshake | R-078 |

---

## FLEET TOPOLOGY (QUICK REFERENCE)

| Node | Name | IP | Role |
|---|---|---|---|
| .73 | Former M.A.R.D. | 192.168.1.73 | Auxiliary Camera Node |
| .177 | Pegasus | 192.168.1.177 | Muscle — LLM inference, rendering (Windows) |
| .183 | Command Center | 192.168.1.183 | Flagship Hub & Mesh Router |
| .64 | Artemis | 192.168.1.64 | Tactical Bridge (144Hz Glass) |
| .68 | Fire TV | 192.168.1.68 | 65" Command Display |
| .71 | Govee | 192.168.1.71 | Ambient lighting |
| .114 | Mobile Sentinel | 100.88.5.122 | Tailscale Mobile Battery Unit |
| .115 | Calvin | 192.168.1.115 | — |
| .117 | Grogu | 192.168.1.117 | Plant Cam |
| .157 | Stimpy | 192.168.1.157 | — |
| .171 | Metsy | 192.168.1.171 | Cat (Tractive GPS XHRMVRYR) |
| .172 | Sam | 192.168.1.172 | Cat (passive landmark) |
| .254 | ATT Gateway | 192.168.1.254 | Router (NOT .1) |

---

## RETIRED / SUPERSEDED RULE CROSS-REFERENCE

This table maps every original rule number from every source file to its unified R-number, documenting merges and resolving the numbering collisions.

| Original | Source | Unified | Notes |
|---|---|---|---|
| Rule 01 (Omega Gate) | DNA | R-001 | Merged with CODEX Rule 01, CR-ACT Rule 2 |
| Rule 01 (Thermals) | CODEX | R-012 | Merged with CR-ACT Rules 15/16 |
| Rule 02 (Terminal Topology) | DNA | R-007 | — |
| Rule 03 (Relational Mandate) | DNA | R-024 | — |
| Rule 04 (Moda Aesthetic) | DNA | R-028 | Merged with CODEX Rule 31, CR-ACT Rule 31 |
| Rule 05 (DVR Deck) | DNA | R-071 | — |
| Rule 06 (Pegasus Fallback) | DNA | R-010 | — |
| Rule 07 (WebSocket Topology) | DNA | R-067 | — |
| Rule 08 (Modular Architecture) | CODEX | R-002 | Absorbed into Sovereign Architecture Tenet |
| Rule 14 (Agent Spawn) | CODEX | R-022 | **COLLISION RESOLVED**: CODEX=spawn, CR-ACT=spawn+30TB, WS=Citrini penalty |
| Rule 14 (Sorting Hat + 30TB) | CR-ACT | R-020, R-022 | Split into 30TB Axiom and Spawn Protocol |
| Rule 14 (8-Mile Penalty) | WS | R-036 | Renamed to avoid collision |
| Rule 15 (Optics) | CODEX | R-028 | Absorbed into Moda Aesthetic |
| Rule 27 (Carroll Knot) | CODEX, CR-ACT | Preamble | Elevated to constitutional preamble |
| Rule 29 (Universal Cast) | CODEX, CR-ACT | R-031 | — |
| Rule 30 (Memory Docking) | CODEX, CR-ACT | R-050 | — |
| Rule 31 (Moda) | CODEX, CR-ACT | R-028 | Merged |
| Rule 32 (Triple-Model) | CODEX, CR-ACT | R-004 | — |
| Rule 33 (Red Box) | CODEX, CR-ACT | R-032 | — |
| Rule 78 (Thermal) | CODEX | R-008 | — |
| Rule 81 (Oracle Storage) | CODEX | R-054 | — |
| Rule 82 (Gem Knowledge) | CODEX | R-065 | **COLLISION RESOLVED**: CODEX=Gem Knowledge, DNA/CORR=Dynamic Gallery |
| Rule 82 (Dynamic Gallery) | DNA, CORR | R-033 | — |
| Rule 83 (Feral Token Ban) | CODEX | R-068 | **COLLISION RESOLVED**: CODEX=Feral Token, CORR=11AM Rollover |
| Rule 83 (11AM Rollover) | CORR | R-069 | — |
| Rule 84 (Omni-Context) | CODEX | R-075 | — |
| Rule 85 (Modular Foundry) | CODEX | R-029 | — |

---

## OPEN AUDIT FLAGS (PILOT RESOLUTION REQUIRED)

1. **Pegasus IP:** RESOLVED. Pegasus is `.177` (Windows). (R-007)
2. **Accent Color Palette:** DNA says `#38bdf8`, SEED says `#00f2fe`, Memory says `#00d4ff` + `#FF5910` + `#00FF88`. Confirm canonical set. (R-028)
3. **Pegasus Fallback LLM:** `mistral:latest` was the fallback target (DNA Rule 06) but is now banned (Law XIX). What is the replacement inference engine? (R-010)
4. **Ingestor Duplicate TKT-0038:** ServiceNow-pattern gap for duplicate ticket IDs — still backlogged? (R-081)

---

*Compiled from 7 source files. 83 unified rules. 3 numbering collisions resolved. 4 open audit flags for Pilot review.*

*DNA OVER DRIFT. THE HIVE IS HOME.*
