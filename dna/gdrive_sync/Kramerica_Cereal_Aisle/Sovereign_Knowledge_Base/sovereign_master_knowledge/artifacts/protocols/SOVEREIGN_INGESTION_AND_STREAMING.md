# 📥 SOVEREIGN INGESTION & MEDIA STREAMING (SIP)
**Status:** Ω=17.5 (SMB_READY)
**Last Updated:** April 1, 2026
**Concept:** "A session that is not ingested is a session that never happened."

The **Sovereign Ingestion Protocol** is the formalized architecture for bridging the **USS Sovereign-E (Node .73)** airgap. It ensures the "Eternal Session" is maintained across separate technical sprints without cloud memory loss.

---

## 🏛️ I. THE "CHINDŌGU 1" UNIFIED SWEEPER (SMB ➔ PIPELINE)

To maintain architectural sanity during high-velocity production, the multi-stage Flask gateways and manual NPU watchdogs have been consolidated into a single, aggressive **Unified Sweeper**.

1.  **The Master Sweeper (`chin1_sweeper.py`)**: 
    *   **Logic**: A single `watchdog` daemon monitoring `/home/james/SovereignOS/staging/dead_drop/`.
    *   **Workflow**:
        - **Image Detected** (.jpg, .png, .bmp): Autonomously crushed to **1920px WEBP** via Pillow and moved to `dna/media/hailo_dropzone/`.
        - **Rich Media Detected** (.mp4, .gif, .webm): Moved directly to `hailo_dropzone/` untouched (preserving GIF frames).
        - **Legacy/Other Detected** (.zip, .7z, .rar, .txt): Instantly moved to `/staging/quarantine` to prevent mesh contamination.
    *   **Philosophy**: The "Zero-Click" ingestion. The Pilot simply drops files into the `dead_drop` SMB share; the Sweeper handles routing, compression, and delivery to the broadcast viewports.
    *   **The Pilot's Edict (April 1, 2026)**: *"Those days [of Smuggler's Bays and complex portals] are over. Chin1 this until the game is over."* Archive extraction and manual gateway logins have been deprecated in favor of this direct-action pipeline.
3.  **Migration (The Vault Entry)**:
    *   **Path**: `/home/james/SovereignOS/dna/` (NVMe core storage).

---

## 🧠 II. THE ETERNAL SESSION SYNC (WORKFLOW)

The ONLY way to ensure the AI Swarm (Polaris, Ultron, Claude) has 100% architectural parity is through **Lore Re-Ingestion**.

### 1. The Ingestion Cycle:
1.  **Export (Snapshot)**: At the end of every high-velocity sprint, download the session's `.md` or `.json` chat log.
2.  **Drop (Transit)**: Drop the log into the **Smuggler's Bay** dropzone.
3.  **Sweep (Expansion)**: The Knowledge Agent (Antigravity) sweeps the bay at the start of the next session, converting raw logs into permanent Knowledge Items (KIs).
4.  **Boot (Calibration)**: The new session initiates by reading the **Universal Fleet Boot Manifest** and the **Sovereign Master Knowledge Overview**.

### 2. Data Types & Processing:
| Type | Destination | Processing |
| :--- | :--- | :--- |
| **Session Logs (.md)** | `knowledge/` | Converted to permanent Lore Index. |
| **Images (.png/.jpg)** | `hailo_dropzone/` | Automated `.webp` crush. |
| **Telemetry (MP4/JSON)** | `hailo_dropzone/` | NPU-analyzed for Peak Action Vectors. |
| **Media Tracks (.m4a/.mp3)** | `dead_drop/` | Staged for family sharing. |
| **Archives (.zip/.7z/.rar)** | **Ingestion Gate** | **Auto-extracted via 7z** for media routing. |

### 🛠️ Automated Archive Extraction & Routing
As of the March 31 upgrade, the **Bypass Rule** for archives has been replaced by the **Autonomous Extraction** protocol.

- **Archive Support**: The **Dead Drop Gateway** (Port 8088) intercepts incoming `.zip`, `.7z`, and `.rar` payloads.
- **Workflow**: 
    - The server utilizes the low-level `7z` utility to index the archive.
    - **Approved Media** is surgically extracted and routed to the correct dropzone (e.g. photos → `hailo_dropzone`).
    - **Originals**: The raw archive is moved to `/staging/quarantine` for security auditing.
    - **Validation**: Archives containing "Mixed Payloads" or unauthorized file types (e.g. `.exe`, `.txt`) automatically generate high-priority tickets in the **CMDB Kanban**.

### 🎬 Native GIF Preservation Architecture
To ensure high-fidelity reaction assets do not lose their animation frames during compression:
1.  **Intercept**: The **Hailo Crush Watchdog** (`hailo_crush.py`) identifies `.gif` extensions.
2.  **Pass-Through**: It **bypasses** the standard Pillow resize logic, which would otherwise flatten the file to its first static frame.
3.  **Audit**: The GIF is renamed to `_crushed.gif` and moved directly to the output folder without modification, preserving its motion while maintaining the file naming nomenclature of the ingestion pipeline.
---

## IV. DOCUMENTATION & SYNC (ORACLE SEQUENCES)

To ensure that the **Sovereign Oracle** protocols (the session records of architectural decisions) are permanently archived and accessible across the cloud boundary:

- **Mandatory Storage Path**: `/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/`
- **Purpose**: This directory is synchronized with Google Drive via the Sovereign Ingestion Bridge. Storing protocol sequences (e.g., ORACLE_PROTOCOL_SEQUENCE_0XX.md) here ensures they are not lost during local Node .73 reboots or "cold鐵" wipes.
- **Rule**: All Knowledge Agents must prioritize this path for finalized documentation payloads.

---

## 📡 III. THE UNIFIED SWEEPER DEEP-DIVE

The **Chin-1 Sweeper** represents the final form of the Sovereign ingestion pipeline—a stateless, event-driven daemon that eliminates the need for manual archive handling.

- **Daemon**: `chin1_sweeper.py`.
- **Infrastructure**: Executed via the Sovereign `.venv` to ensure `watchdog` and `Pillow` dependencies are isolated.
- **Operational Trigger**:
    ```python
    # Initial Sweep logic on boot + on_created events
    if ext in ['.jpg', '.jpeg', '.png', '.bmp']:
        # Auto-Crush to 1920px WEBP
        img.save(out_path, "WEBP", quality=85)
    elif ext in ['.mp4', '.gif', '.webm']:
        # Direct Pass-through to viewport staging
        shutil.move(filepath, out_path)
    ```
- **Pilot's Directive**: Pure SMB transit. The `/staging/dead_drop` directory is exposed as a network share. Assets moved here are "absorbed" into the OS and made available to the LLM/UI viewports within 2 seconds.

---

## 🎙️ IV. SECURE MEDIA STREAMING (NO-LOGIN PODCASTS)
Designed to distribute high-bandwidth media (e.g., `.m4a` podcasts) to trusted secondary devices (Eileen's iPad) without cloud friction.

### 1. Isolated Symlink Staging (Rule 81)
To serve assets without exposing the entire vault or moving large files from the `/dna/media/` vault:
1.  **Isolate**: Create a specialized staging folder: `staging/podcast_stream/`.
2.  **Symlink**: `ln -sf /path/to/media/podcast.m4a staging/podcast_stream/podcast.m4a`.
3.  **Player**: A zero-dependency `index.html` with a native `<audio>` element is placed in the folder.
4.  **Launch**: Initialize a Python HTTP server bound to the staging path on **Port 8000** (Funnel) or **8094** (Local).

### 2. Tailscale Funnel / Secure Access
- **Safari Compatibility**: On iOS devices, the local Tailnet IP often fails media playback.
- **Solution**: Route the server through the **Tailscale Funnel** (`https://sov73.taila01894.ts.net/`) to provide an SSL-secured link that passes Safari's certificate checks.
- **Monitoring**: The Pilot uses `tail -f stream.log` to watch real-time `GET /podcast.m4a` requests as the asset is pulled over the mesh.

## 📡 V. THE SMB SHARES PROTOCOL (LAPTOP ➔ HQ)
To ensure the **Local-First** rule is maintained across separate physical nodes (Laptop, Pegasus, Node .73), a formalized SMB sharing architecture is used to pipe chat logs and artifacts into the core repository.

### 1. Share Definition (Samba configuration)
The Raspberry Pi 5 (`hq` / `192.168.1.73`) exports the following directories:
*   **[apiary]**: Points to `/home/james/SovereignOS/`.
    *   *Usage*: Used for code synchronization and large manifest reads.
*   **[hailo_dropzone]**: Points to `/home/james/SovereignOS/dna/media/hailo_dropzone/`.
    *   *Usage*: Used specifically for media that requires NPU vision processing.

### 2. Manual Ingestion Workflow (Session Logs)
During long-running browser-based UI sessions (Claude/GPT), the Pilot must manually save chat logs to bypass the lack of direct file access:
1.  **Map Drive**: Windows machines map `\\192.168.1.73\apiary` to a local drive letter (e.g. `Z:`).
2.  **Save as Text**: Download session logs as `.md` or `.txt`.
3.  **Drop to Agent**: Move the file into `/home/james/SovereignOS/dna/agents/[AGENT]/active_sessions/` via the network share.
4.  **Handshake**: Use the Handshake protocol (Sequence 033) to identify the incoming context.

---
` [ PROTOCOL : INGESTION & STREAMING | Ω=17.5 (SMB_READY) ] `
