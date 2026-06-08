# Implementation Plan: STRY1779840587 - Sovereign OS Press Kit & NotebookLM Sync Pipeline

Build an automated synchronization pipeline for the Sovereign OS Press Kit media assets, compiling vision frames into structured text logs and an aggregated PDF manifest for flawless Google NotebookLM ingestion via rclone.

---

## 🛑 Invariants & System Constraints
*   **KI-038 (sqlite3 canonical database)**: Query only from `/home/james/SovereignOS/dna/sovereign_now.db`.
*   **KI-040 (Zero-Litter Workspace)**: Implementation plans and walkthroughs must be named uniquely using the ticket ID (e.g. `implementation_plan_STRY1779840587.md`).
*   **KI-041 (No Hidden Media)**: All images and manifest files must route to structured staging paths:
    *   `/home/james/sovereign_inbox/dashboards/presskit/`
    *   `/home/james/sovereign_inbox/reports/notebook_sync/`
*   **Brooks Exception Mandate**: Enforce the 1990s physical felt puppet aesthetic in the brand materials.

---

## 🛠️ Proposed Changes

### 1. Workspace Organization [NEW]
We will initialize the compliant directories on Clio:
*   `/home/james/sovereign_inbox/dashboards/presskit/` (contains generated PNG assets)
*   `/home/james/sovereign_inbox/reports/notebook_sync/` (will contain compiled logs & PDF manifest)

### 2. Pipeline Script [NEW]
#### [NEW] [sync_press_kit.py](file:///home/james/SovereignOS/scripts/sync_press_kit.py)
We will create an ultra-premium python script `/home/james/SovereignOS/scripts/sync_press_kit.py` that handles the entire pipeline end-to-end:

1.  **Extract Visual Descriptions**:
    *   Iterates through the 10 generated PNG assets inside `/home/james/sovereign_inbox/dashboards/presskit/`.
    *   Extracts or maps their technical prompts, descriptions, clinical/technical roles, and aesthetic directions.
2.  **Generate Markdown Logs**:
    *   Generates a dedicated `.md` text log file for each asset under `/home/james/sovereign_inbox/reports/notebook_sync/` (e.g., `presskit_architecture.md`, `presskit_mard_engine.md`, etc.).
    *   These text logs are designed to be ingested by Google NotebookLM, providing perfect context for our custom Gems without mixing up team alignments.
3.  **Compile Premium Aggregated HTML**:
    *   Synthesizes all descriptions and absolute path image embeds into a single, cohesive HTML document.
    *   Utilizes a stunning CSS design system (deep near-black `#0a0a0f` backdrop, Outfit clinical sans-serif headlines, glassmorphism shadows, and generous architectural padding matching a Bloomberg terminal crossed with a premium spirits bottle).
4.  **headless Chrome PDF Compilation**:
    *   Launches headless Google Chrome to compile the HTML into a highly polished, professional corporate PDF manifest:
        `/home/james/sovereign_inbox/reports/notebook_sync/Sovereign_OS_Press_Kit_Manifest.pdf`
5.  **rclone Synchronization**:
    *   Syncs the entire `dashboards/presskit/` and `reports/notebook_sync/` folders to Google Drive:
        `sovereign_os:SovereignOS/sovereign_inbox/dashboards/presskit/`
        `sovereign_os:SovereignOS/sovereign_inbox/reports/notebook_sync/`
    *   Triggers `/home/james/SovereignOS/scripts/sync_to_gdrive.sh` to classify the markdown logs into their respective NotebookLM sync buckets automatically.

---

## 🧪 Verification Plan

### Automated Execution
*   We will run:
    ```bash
    python3 /home/james/SovereignOS/scripts/sync_press_kit.py
    ```
*   Verify that all 10 markdown logs and the compiled PDF manifest are populated.
*   Verify that the `rclone sync` commands finish with exit code 0.

### Manual Audit
*   Audit Google Drive directories using `rclone ls` to ensure that the files and `NotebookLM_Sync` text files are fully synchronized.
