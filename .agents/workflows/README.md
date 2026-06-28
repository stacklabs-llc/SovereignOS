# Sovereign OS Workflow Registry & Runbook

This directory contains the operational runbooks and SDLC workflow definitions for the **Sovereign OS** agent execution environment. These workflows govern agent lifecycle, daily environment prep, database audit checks, and session cleanup.

---

## 🛠️ The Big Three (Core Lifecycle Workflows)

### 1. Sovereign Boot (`/sovereign_boot`)
* **Purpose:** Resets agent state and loads memory caches at the start of a coding session (the "Cold Boot Amnesia Cure").
* **Mandated Behavior:** Before outputting code, the agent MUST silently load and read the following DNA and system state files:
  - `dna/SOVEREIGN_DNA.md` (System specs, ports, and invariants)
  - `dna/pilot_bio.md` (Pilot expertise context and standards)
  - `dna/ENTERPRISE_SDLC_SOP.md` (Release control and ticket compliance rules)
  - `dna/THE_WALL_OF_SHAME.md` (Past failures and hard lessons)
  - `ai_laziness_explained.md` (Guidelines on complete, production-ready deliverables)
  - `dna/bro_decoder_arch_ref.md` (Architecture references)
  - `sovereign_inbox/today/SESSION_REPORT_*.md` (Historical session logs from today)
* **Boot Flags:**
  - `-ts` (`--training-sandbox`): Training mode. Restricts GPU, skips UI dashboards, launches YOLO combat loops.
  - `-gd` (`--game-day`): FanStack game day mode. Optimizes WebSockets and live feeds; triggers `/fanstack_daily_prep`.
  - `-uat` (`--uat-remediation`): Ingress test mode. Audits external routing and Vite micro-frontends.
  - `-dr` (`--dry-run`): Dry-run configuration validation. Safe pass. No mutations.
  - `-rc` (`--recovery`): Disaster recovery mode. Sweeps file changes from the last 24 hours, queries today's tickets, writes a recovery session report, and backs it up to GDrive.
* **Anchor Word Protocol:** Establishes a session-specific cognitive diagnostic word (e.g. `FLANNEL_PUNDIT`, `KRAMER_MARD`) to verify attention window health across multi-turn sprints.

---

### 2. Sovereign Shutdown (`/sovereign_shutdown`)
* **Purpose:** Performs workspace synchronization, records system history, and shuts down services before terminating a session.
* **Execution Steps:**
  1. **Consolidated Session Executive Report:** Sweeps all `walkthrough_*.md` and `SESSION_REPORT_*.md` files modified within the last 24 hours (compliant with **KI-044** 86400 Remedy Law) and creates a unified session executive report in `/sovereign_inbox/daily_MMDDYYYY/SESSION_REPORT_YYYYMMDD_HHMMSS.md`.
  2. **Architectural Review:** Scans for port changes, database schema shifts, or deprecated endpoints.
  3. **DNA Synchronization:** Updates `/home/james/SovereignOS/dna/SOVEREIGN_DNA.md` with system changes.
  4. **Backup:** Syncs data to Google Drive via `sync_to_gdrive.sh`.
  5. **Inbox Sweep:** Triggers `inbox_processor.py` to route staging drops and advances the `today/` symlink.
* **Shutdown Flags:**
  - `-s` (`--session-only`): Skips workspace archive. Logs are moved, but `today/` directory is left intact.
  - `-kw` (`--kill-weights`): Reverts AI model weights to last stable baseline.
  - `-fc` (`--freeze-containers`): Pauses Docker containers rather than bringing them down, speeding up the next boot.
  - `-bc` (`--backup-cloud`): Triggers offsite parallel encrypted backup of schemas and logs.

---

### 3. FanStack Daily Prep (`/fanstack_daily_prep`)
* **Purpose:** Prepares the FanStack sports simulation, ingests baseball feeds, and spins up background chatrooms.
* **Current Execution Sequence:**
  1. **Yardbarker Entropy Pump:** Fetches latest real-time sports gossip (`yardbarker_entropy_pump.py`).
  2. **Gmail Promo Sweeper:** Pulls and categorizes emails for fan engagement items (`gmail_promo_sweeper.py`).
  3. **MLB Schedule Sync:** Ingests the current day's MLB slate and matchups (`sync_mlb_schedule.py`).
  4. **Stream URL Resolver:** Finds and resolves links for live sports streams (`stream_url_resolver.py`).
  5. **Setup All Rooms:** Creates the digital chatrooms for active game watch-parties (`setup_all_rooms.py`).
  6. **Restart Stack:** Refreshes PM2 services and local servers (`restart_stack.sh`).

> [!NOTE]
> The legacy version `fanstack_daily_prep copy.md` also runs persona auditing, automated Twitter bots, and candidate onboarding scripts at startup. These are now executed selectively to avoid automation noise.

---

## 🤖 FanStack Automation Script Deep Dive

These three scripts automate persona maintenance, social posting, and candidate generation for the fan watch-party simulation:

### 1. Persona Auditor (`vertex_persona_audit.py`)
* **What it does:** Runs a parallel audit across the entire database roster of AI personas in `sovereign_now.db`.
* **Details:**
  - Loads the latest baseball news from `/dna/context_database.json`.
  - Fires parallel queries (up to 20 concurrent threads) to Gemini 2.5 Flash.
  - For each persona, Gemini is given their character deep lore and the MLB news. It generates a character-specific update stating how they would react to the news, along with a validation test quote.
  - Success outputs are committed to the `persona` table, updating `behavior_notes` with dated entries.

### 2. Barf Twitter Bot (`barf_twitter_bot.py`)
* **What it does:** Automates character postings on X (Twitter) via headless Playwright browser scripts.
* **Details:**
  - Launches Chromium using a persistent browser profile located at `/home/james/.config/playwright-barf-profile`.
  - Navigates to the Gemini web interface (`gemini.google.com/app`).
  - Instructs Gemini to write a pessimistic, trauma-laden game preview from the perspective of **Barf** (the long-suffering Mets dog persona), along with traction-building analytical replies from **FanStack** and **jc2pointzero**.
  - Navigates to `x.com`, logs in (or utilizes the saved session cookie), pastes the generated post with Mets tags (`#LGM #MetsTwitter`), and posts it.
  - Can be run with `--dry-run` to print the output locally without posting.

### 3. SDLC Persona Onboarder (`sdlc_persona_onboarder.py`)
* **What it does:** Generates and stages brand new fan advocate personas from scratch based on MLB news.
* **Details:**
  - Evaluates today's MLB news to find teams with major storylines (e.g. trades, upsets).
  - Uses Gemini to output a structured JSON schema defining a new fan character (handle, bio, display name, and deep lore).
  - Triggers Imagen-3 (`imagen-3.0-generate-001`) to generate a vector/cartoon Twitch-style character avatar sheet and saves it to `/sovereign_inbox/today/`.
  - Automates the creation of a Google Mail alias (`sovereign.fanstack+{handle}@gmail.com`).
  - Writes a comprehensive onboarding markdown blueprint file in `/sovereign_inbox/today/`.
  - Automatically raises a new `STRY` ticket in `sovereign_tickets` to track the registration of the social media account, attaching the path to the blueprint.

---

## 🗂️ Entire Workflow Catalog Reference

| Command / File | Description |
| :--- | :--- |
| [`catnip_wars_boot.md`](file:///home/james/SovereignOS/.agents/workflows/catnip_wars_boot.md) | Launches the Catnip Wars visual sandbox and enforces structural guidelines. |
| [`claude_fanstack.md`](file:///home/james/SovereignOS/.agents/workflows/claude_fanstack.md) | Prompts and directives to restore the modular FanStack React architecture. |
| [`compile_genesis_report.md`](file:///home/james/SovereignOS/.agents/workflows/compile_genesis_report.md) | Consolidates and syncs the Genesis Seeding PDF Report for active cartridges. |
| [`fanstack_history_lesson.md`](file:///home/james/SovereignOS/.agents/workflows/fanstack_history_lesson.md) | Anti-hallucination reference mapping Mets, Padres, Rockies, and Golf personas. |
| [`fanstack_mailbag.md`](file:///home/james/SovereignOS/.agents/workflows/fanstack_mailbag.md) | Manages fan email drops and automated feedback triage. |
| [`fanstack_notebooklm_prep.md`](file:///home/james/SovereignOS/.agents/workflows/fanstack_notebooklm_prep.md) | Packages codebase metadata for ingestion into Google NotebookLM. |
| [`persona_onboarding.md`](file:///home/james/SovereignOS/.agents/workflows/persona_onboarding.md) | Manual SDLC checklist for registering, configuring, and verifying a new persona. |
| [`promo_sweeper.md`](file:///home/james/SovereignOS/.agents/workflows/promo_sweeper.md) | Crawls emails to ingest and apply merchant discount campaigns. |
| [`sovereign_inbox_read.md`](file:///home/james/SovereignOS/.agents/workflows/sovereign_inbox_read.md) | Scans internal ingestion queues and routes incoming work orders. |
| [`uspto_provisional_filing.md`](file:///home/james/SovereignOS/.agents/workflows/uspto_provisional_filing.md) | Packages system architectures for IP protection reports. |
| [`walk_a_mile_in_my_shoes.md`](file:///home/james/SovereignOS/.agents/workflows/walk_a_mile_in_my_shoes.md) | Runbook for simulating the end-to-end user experience audit. |
| [`youtube_downloader.md`](file:///home/james/SovereignOS/.agents/workflows/youtube_downloader.md) | Automates grabbing video b-roll and pregame broadcasts. |
| [`zero_trust.md`](file:///home/james/SovereignOS/.agents/workflows/zero_trust.md) | Audits system ports and locks down public endpoints. |
