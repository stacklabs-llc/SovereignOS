# 🛠️ SOVEREIGN SYSTEM OPERATIONS: CMDB, SEARCH, AND FLEET
**Status:** Ω=10.0 (TOTALITY_STABILIZED)
**Last Updated:** March 31, 2026

This artifact is the unified technical registry for the **Sovereign OS**, consolidating infrastructure management, search indexing, media ingestion, and fleet topology into a high-fidelity source of truth.

---

## 🏛️ I. CORE INFRASTRUCTURE (CMDB & PORTAL)

### 1. The CMDB Bridge (`cmdb_server.py`)
- **Service**: Port **8082** (REST API) / Port **8008** (WebSocket).
- **Database**: `scripts/sovereign_core.db` (SQLite).
- **REST Endpoints**: `/api/status`, `/api/tickets` (Kanban), `/api/nodes` (Fleet), `/api/cortex/log` (AI Memory), and `/api/pipeline` (Ingestion telemetry).
- **Stability Protocol**: Uses Write-Ahead Logging (WAL) and 10s write / 60s read timeouts for concurrency.

### 2. AETHER Command Deck (`sovereign_employee_center.html`)
- **Architecture**: Single-File Vanilla JS SPA (v2.0) with zero build dependencies.
- **Aesthetic**: Vesper Moda (Glassmorphism / Neon Cyan / Void Black).
- **Tabs**: Home, Admin Control, Kanban, Data Pipeline (log streams), Fleet, and CMDB.

### 3. The Admin Portal (System Properties)
- **Status**: SPEC_FINALIZED (April 1, 2026).
- **Objective**: Pilot-facing dashboard for one-click service management (Start/Stop/Restart) of all Hive daemons (Relay, Chatbots, CMDB).
- **Thermal Sentinel**: Real-time `vcgencmd` monitoring.
    - **Normal (<70°C)**: Green.
    - **Warning (70-75°C)**: Amber. Trigger Rule 80 (RAM reclamation).
    - **Critical (>75°C)**: Red. Trigger Rule 78 (Mistral eviction) and peak cooling.

---

## 📡 II. THE FLEET TOPOLOGY (ARGUS OPTICAL ARRAY)
As of March 31, 2026, the fleet is fully mapped and documented in the CMDB.

| CI ID | Node Name | Hardware Type | Status | Primary Directives |
| :--- | :--- | :--- | :--- | :--- |
| **CI-073** | **Flagship** | Pi 5 (8GB) | **ONLINE** | Core 4 Orchestration, CMDB Master. |
| **CI-168** | **Pegasus** | i7-4790K / GTX 980 | **COMMISSIONED**| LLM Dreadnought Engine (Ubuntu 24.04). |
| **CI-114** | **Mando** | Pi Zero 2W | **ONLINE** | NexiGo N60 argus camera (:8081). |
| **CI-170** | **Grogu** | Pi Zero 2W | **ONLINE** | Dual icSpring cams, GreenStack nursery host. |
| **CI-172** | **Grogu V4** | Static IP | **RESERVED** | IPv4 static representation for node connectivity. |
| **CI-171** | **Metsy** | Biological | **TRACKED** | Tractive GPS / Petkit behavioral ingestion. |

---

## 🔍 III. SOVEREIGN SEARCH INDEXER (SSI)
The SSI eliminates "Nancy Drew" discovery latency via autonomous, local-first vector search.

- **Engine**: Ollama `nomic-embed-text` (embeddings) + Mistral-7B (reasoning).
- **Implementation**:
  - `sovereign_indexer.py`: Append-only indexing with targeted `--target` support.
  - `sovereign_search.py`: Implements Normalized Cosine Similarity for semantic retrieval.
- **Capacity**: 281+ chunks indexed as of March 31, 2026. Project root fully searchable.
- **Outcome**: Discovery latency reduced from minutes to milliseconds.

---

## 🔮 IV. ORACLE SYNC & INGESTION HARDENING
The ingestion pipeline ensures all session-critical artifacts are hardened and synced.

### 1. Ingestion Protocol
- **Oracle Sync**: A systemd daemon (`oracle-sync.service`) monitoring payloads for automatic `rclone` mirroring to off-node volumes.
- **Payload Mandate**: All `ORACLE_PROTOCOL_SEQUENCE_*.md.txt` files MUST be stored in `/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/` to ensure 100% GDrive synchronization.
- **Dead Drop (Port 8088)**: Zero-cloud bridge for asset ingestion with autonomous `7z` extraction and automated CMDB ticketing for unrecognized payloads.
- **The .CR Rule (.txt Spoofing)**: Mandatory renaming of `.md` to `.md.txt` for 100% context retention in NotebookLM syncs.

### 2. Hailo Video Cortex
- **Hardware**: Hailo-10H NPU on Node .73.
- **Pipeline**: Real-time CV ingestion (FanStack) with **Hailo Crush** 15W vision compression protocol.

### 3. FanStack Chatbot Source Filtering
- **Source Guard**: `fanstack_chatbots.py` maintains a strict whitelist for the main fan personas.
- **Personnel**: **DotMatrix** (Stats Droid) and **Barf** (Mets Fan) are gated to only respond to `MLB_TELEMETRY` and `MLB_APP` message sources.
- **Objective**: Prevents personas from reacting to low-level system audit strings or internal daemon heartbeats.

---

## 🛰️ V. TRUSTED DEVICE MESH (TAILSCALE)
Authorized hardware perimeter with zero-cloud media delivery via Tailscale Funnel (HTTPS).

| Device | Tailscale IP | Use Case |
| :--- | :--- | :--- |
| **sov73** | 100.123.68.9 | Flagship Control Node. |
| **artemis** | 100.70.84.19 | Primary Pilot Workstation. |
| **ipad-gen-7** | 100.78.155.125 | Eileen's Dashboard (Funnel Access). |
| **sean-invite** | scarrol2@gmail.com | Pending Dashboard Access. |

---

## 🔭 VI. BIOLOGICAL CI TRACKING & SCIENCE
- **Cross-Correlation**: Correlating Tractive GPS data with Petkit litter box telemetry to identify patterns in Metsy's cycle.
- **Predictive Arrival**: Using indoor state changes to predict adversarial subject (Sam) arrival.
- **Clinical Integration (CTP)**: Arkle Vet Care exam tracking (Next: April 28).

---
## 🕵️ VII. DIAGNOSTIC AUDITING (NANCY DREW)
The system employs an autonomous "fluff detector" to maintain the airgap by identifying and flagging legacy or orphaned assets.

- **Service**: `sovereign_audit_crawler.py` (Nancy Drew).
- **Functionality**:
    - Scans the `/apiary/` root for orphaned `.json` file fragments.
    - Identifies "Zork" ghost-strings and legacy HTML nodes.
    - **Anomaly Gating**: The `ZORK TERMINAL DETECTED` string injection is gated behind `ENABLE_ZORK_EASTER_EGG=false` in the `.env` configuration to maintain UAT focus.
    - Injects **SYS_AUDIT** messages into the FanStack relay to alert the pilot of system entropy.
- **Outcome**: Ensures that only high-fidelity, active project assets remain in the primary context window, preventing "LLM Sludge" during large-scale code deployments.

---
- **Outcome**: Ensures that only high-fidelity, active project assets remain in the primary context window, preventing "LLM Sludge" during large-scale code deployments.

---
` [ OPERATIONS : CONSOLIDATED | Ω=16.5 (ADMIN_READY) ] `
