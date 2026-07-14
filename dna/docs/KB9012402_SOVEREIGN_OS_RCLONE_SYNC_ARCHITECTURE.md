# Sovereign OS Rclone Sync Architecture

**Article ID:** KB9012402  
**Last Synchronized:** 2026-07-05 20:48:17  

# 📡 RCLONE SYNC & CONTEXT PACKAGING ARCHITECTURE
**Location:** `/home/james/SovereignOS/dna/docs/RCLONE_SYNC_ARCHITECTURE.md`
**Last Updated:** 2026-07-05 (SOW-12 Sync Architecture Audit)

This document maps the complete Google Drive synchronization, codebase staging, and remote ingress/egress pipeline utilized across the Sovereign OS mesh network. It serves as a technical reference for other developer agents (e.g., Spark) to understand exactly what is synchronized, when it is synchronized, and how data flow integrity is preserved.

---

## 🏛️ 1. Mapped Cloud Remotes

Sovereign OS manages synchronization across two distinct Google Drive endpoints:

| Remote Name | Google Drive Account | Primary Sync Targets & Role |
| :--- | :--- | :--- |
| **`sovereign_os:`** | `sovereign.os.v1@gmail.com` | **Primary System Registry:** Manages system logs, executive reports, SDLC ticketing documents (walkthroughs/plans), the NotebookLM transfer package, and core codebase mirrors. |
| **`gdrive:`** | `sovereign.fanstack@gmail.com` | **Sports & Simulator Outpost:** Backs up game chat logs, simulator caches, active telemetry logs, and the `15_FanStack` codebase. |

---

## 📥 2. Ingress Pipeline (Pull Workflow)

The system queries and pulls incoming work orders, stories, and developer guides from Google Drive to initialize the local workspace.

### ⚙️ Executable Target: `sovereign_pull_sync.sh`
*   **Path:** `/home/james/SovereignOS/scripts/sovereign_pull_sync.sh`
*   **Execution frequency:** Run manually or on timer/daemon boot sequences.
*   **Sequence of Operations:**
    1.  **Bidirectional Artifact Recovery:** Pulls plans, walkthroughs, and harvested assets from `sovereign_os:SovereignOS_Clio_Sync/` to `/home/james/sovereign_inbox/`.
    2.  **Pull Spark Work Orders:** Pulls plain text and Google Doc files from `sovereign_os:SovereignOS_Clio_Sync/work_orders/` (excluding archives).
    3.  **Pull Gemini Work Orders:** Queries the root of `sovereign_os:` using filters for keywords (e.g., `workorder`, `wo-`, `knowledge`, `kb`) up to a maximum depth of 1.
    4.  **Extension Normalization:** Dynamically renames all pulled plain text (`.txt`) documents in the inbox to `.md` (ignoring `.md.txt` files).
    5.  **Sorting Hat Ingestion:** Invokes `/home/james/SovereignOS/scripts/organize_inbox.py` (Decision Derby) to parse content, sort files into subfolders, and insert active tickets into the canonical SQLite database.
    6.  **Queue Deletion & Archiving:** Moves the processed cloud-hosted files into `sovereign_os:SovereignOS_Clio_Sync/work_orders/archive/` to prevent duplicate ingestion loops.

---

## 📤 3. Egress Pipeline (Push Workflow)

The egress pipeline packages the state of the codebase, database contents, conversation history, and documentation before pushing it to Google Drive to ensure absolute context preservation.

### ⚙️ Executable Target: `sync_to_gdrive.sh`
*   **Path:** `/home/james/SovereignOS/scripts/sync_to_gdrive.sh`
*   **Execution frequency:** Executed during the session wrap-up sequence (such as during `/sovereign_shutdown`).
*   **Sequence of Operations:**
    1.  **Artifact Harvesting:** Calls `scripts/artifact_harvester.py` to sweep the workspace.
    2.  **Bidirectional Egress Copy:** Syncs `/walkthroughs`, `/implementation_plans`, and `/Harvested_Artifacts` up to Google Drive first.
    3.  **Anchor Token Generation:** Runs `generate_sync_anchor.py` to compile a high-entropy `SYNC_ANCHOR_TOKEN.txt` file containing anchor coordinates.
    4.  **Monolithic Transfer Compilation:**
        *   `compile_codebase_payload.py`: Merges python/js/ts source code into split payloads (e.g., `SOVEREIGN_CODEBASE_PART_1.md.txt`, `PART_2`).
        *   `compile_massive_notebook_payload.py`: Serializes the entire SQLite database tables, tickets, logs, and schemas into split parts.
        *   `compile_conversation_history.py`: Extracts and formats the complete session message history into 10 chunked text files under 450k characters.
    5.  **NotebookLM Local Staging:** Copies compiled payloads, shared docs (`SOVEREIGN_DNA.md`, `bro_decoder_arch_ref.md`), brand blueprints, all plans/walkthroughs, and repository documentation into the local staging folder:
        `/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal/`
    6.  **Pristine Mirror Push:** Syncs the staged folder to:
        `sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal`
    7.  **Codebase Mirror:** Runs `scripts/sync_workspace_to_drive.sh` to mirror the entire active worktree `/home/james/SovereignOS` to the remote path `sovereign_os:SovereignOS_Clio_Sync/SovereignOS/` (excluding virtual environments, logs, and database locks using `.rclone-ignore`).

---

## ⏳ 4. Background Sync Daemons

Sovereign OS runs continuous background sync processes to capture changes immediately and prevent file staleness.

### 📁 A. Docs Sync Watcher (`docs_sync_watcher.sh`)
*   **Path:** `/home/james/SovereignOS/scripts/docs_sync_watcher.sh`
*   **Mechanism:** Uses `inotifywait` to monitor changes in `/home/james/SovereignOS/dna/docs/` in real time.
*   **Actions:**
    *   On `close_write`, `moved_to`, or `delete` events for `.md` files, it immediately syncs the folder to `sovereign_os:SovereignOS_Clio_Sync/SovereignOS/dna/docs/`.
    *   Concurrently copies and stamps files with a sync timestamp before pushing them to `sovereign_os:SovereignOS_Clio_Sync/NotebookLM_Sync/StackLabs_Internal/docs/` as `.txt` files to preserve NotebookLM context.

### 📁 B. Master Payload Watcher (`payload_sync_watcher.sh`)
*   **Path:** `/home/james/SovereignOS/scripts/payload_sync_watcher.sh`
*   **Mechanism:** Polls on a 60-second sleep loop.
*   **Actions:**
    *   Sweeps `/home/james/SovereignOS/dna/agents/*/payloads/` and mirrors them to `sovereign_os:Sovereign_OS_Master_Payloads/{AgentName}/`.
    *   Syncs the Pixel Drop Zone folder (`/dna/dropzone/`) to the cloud.
    *   Copies local Haillo video recordings (`/mnt/ghost_drive/hailo_dropzone/`) to the cloud media archive with a 5MB bandwidth limit (`--bwlimit 5M`) to prevent network congestion.
    *   Syncs incoming M.A.R.D. artifacts from `/mnt/node_177` to `sovereign_os:Sovereign_OS_Master_Payloads/Pegasus_MARD_Artifacts/`.

---

## ⚓ 5. Ad-Hoc & Special-Purpose Syncs

*   **Vesper Kernel Dropzone Ingest (`vesper_scheduler.py`):**
    *   Runs on a 60-second loop.
    *   Calls `rclone move "sovereign_os:Sovereign_Dropzone" "/home/james/SovereignOS/dna/archives/smuggler_dropzone/"` to download and ingest files. The `move` command deletes the cloud copies upon transfer to prevent dual-processing.
*   **Lightweight Workspace Sync (`sync_lightweight.sh`):**
    *   Synchronizes only the most critical files (database, docs, logs, walkthroughs, plans) to reduce bandwidth and speed up mobile-mesh synchronization cycles.
*   **Romeo DNA Sync (`sync_romeo_to_gdrive.sh`):**
    *   Ad-hoc sync pushing the local Romeo configuration directories to Google Drive.
*   **Press Kit Sync (`sync_press_kit.py`):**
    *   Python-driven media asset synchronizer copying large lookbooks, promotional materials, and marketing brochures.

---

## 🚫 6. Exclusion & Ignore Rules

To prevent bloating Google Drive, the file `/home/james/SovereignOS/.rclone-ignore` defines strict exclusion criteria:
*   Git history (`.git/`)
*   Python virtual environments (`.venv/`, `venv/`, `__pycache__/`, `*.pyc`)
*   Node packages (`node_modules/`)
*   Compiled build folders (`dist/`, `.vite/`)
*   Database lock files (`*.db-shm`, `*.db-wal`)
*   Credential and key files (`*.key`, `*.crt`, `.env*`, `mlbtv_credentials.json`, `vertex_sa.json`)
*   Raw logs and telemetry streams (`logs/`, `*.log`, `game_states/`)
