# SovereignOS Canonical Path & Port Manifest
**Sprint Ticket:** STRY1780265390  
**Phase:** Phase 1 Static Audit & Inventory  
**Date:** June 1, 2026

---

## 🗄️ Unified Canonical Directory Layout

This manifest defines the absolute, unyielding canonical home for each system concern. Any out-of-bounds hardcoded paths are Protocol Breaches, enforced natively by the Phase 5 Path Linter.

| System Concern | Canonical Absolute Home | Sibling Bare-Bones Path | Role & Operational Status |
| :--- | :--- | :--- | :--- |
| **System Database** | `/home/james/SovereignOS/dna/sovereign_now.db` | `/home/james/SovereignOS_bare/dna/sovereign_now.db` | Single SQLite data ledger. Enforces WAL journal mode. |
| **Log Output** | `/home/james/SovereignOS/logs/` | `/home/james/SovereignOS_bare/logs/` | Pristine centralized logs dir for all active daemons. |
| **Media Vault** | `/home/james/SovereignOS/media_vault/` | *Unchanged (Shared Mount)* | Central media directory served as static URL files by `sovereign_core_api`. |
| **NotebookLM Exports** | `/home/james/SovereignOS/dna/notebook_lm_exports/` | `/home/james/SovereignOS_bare/dna/notebook_lm_exports/` | Outbound feeds syncing daily game slate markdown reports. |
| **Shared Assets** | `/home/james/SovereignOS/media_vault/03_Assets/` | *Unchanged (Shared Mount)* | Central repository for static images, logos, and UI icons. |
| **Python venv** | `/home/james/SovereignOS/.venv/` | `/home/james/SovereignOS_bare/.venv/` | Central virtual environment containing frozen dependencies. |

---

## 🌐 Network Port Success Set (Reconciled)

The following port allocations constitute the official running mesh. During Phase 3, the ATF harness checks every service in this success set across four signals:

### Decoupled Python Backends
*   `8000`/`8008` — **The Skew Relay** (FastAPI WebSocket Persona Hub & Hot Takes REST)
*   `8090` — **Sovereign Core API** (Central Data & Media Vault server)
*   `8095` — **SDLC Portal Server** (Ticketing Server - serves own static frontend)
*   `8083` — **SamTracker Backend** (Legacy sports data sync)
*   `5056` — **Stream Sniper Daemon** (Video stream intercept proxy)

### Decoupled Node Frontends (Vite)
*   `3000` — **Sovereign OS Portal** (Primary user panel dashboard)
*   `3004` — **SamTracker Frontend** (Sports telepresence panel)
*   `3008` — **Sovereign Media** (Cinema player telemetry deck)
*   `3009` — **FanStack App** (The Hot Takes single-persona terminal board)
*   `3015` — **Aether Vet** (Decoupled Veterinary telemedicine dashboard)

---

## 🔍 Discrepancy Resolutions

### Port 3009 Discrepancy
*   **Observation**: The historical manifest listed `3009` as the SDLC Portal frontend, but port `3009` was observed serving Vite.
*   **Resolution**: Fully verified. Port `3009` is the active frontend of **`15_FanStack`** (the Hot Takes single-persona console). The **SDLC Portal** frontend is served statically by the Python process directly on port **`8095`** via the `/` endpoint. 

### Watchdog Success Set Reconcile
*   **Decision**: `SamTracker` (port `3004` frontend and `8083` backend) and the `WeedStack Content Poller` are fully preserved in the active success set to maintain complete system telemetry.
