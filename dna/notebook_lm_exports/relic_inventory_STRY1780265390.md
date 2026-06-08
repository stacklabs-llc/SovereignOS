# SovereignOS Pristine Workspace Relic Inventory
**Sprint Ticket:** STRY1780265390  
**Phase:** Phase 1 Static Audit & Inventory  
**Date:** June 1, 2026

---

## 💾 Hard disk space claimants (`du -sh` Receipts)

The active workspace footprint is **293 GB**. The massive bulk is immutable video media, which is out of scope for RAM-disk boots. Sibling and RAM-resident trees will target **<10 MB** of source code assets.

Below are the exact verified `du` directory size receipts:

| Claimed Path | Directory Size | Primary Contents & Description |
| :--- | :--- | :--- |
| `/home/james/SovereignOS/media_vault` | **238 GB** | Dynamic media vault holding all heavy assets. |
| ├── `/For All Mankind` | *81 GB* | Video assets. |
| ├── `/FROM` | *80 GB* | Video assets. |
| ├── `/The Boys` | *35 GB* | Video assets. |
| ├── `/The Handmaid's Tale` | *25 GB* | Video assets. |
| ├── `/01_Assets` | *9.0 GB* | Asset files. |
| ├── `/01_Ingest` | *5.5 GB* | Stream ingest buffer files. |
| └── `/03_Assets` | *3.5 GB* | Static UI and avatar asset folder. |
| `/home/james/SovereignOS/.git` | **14 GB** | Git database history and refs. |
| `/home/james/SovereignOS/_archive` | **9.1 GB** | Legacies, old environments, and quarantine. |
| └── `/legacy_environments` | *8.1 GB* | Old VM environments and sandbox structures. |
| `/home/james/SovereignOS/dna` | **8.3 GB** | Core database, state files, and old backups. |
| └── `/media_OLD_BACKUP` | *6.5 GB* | Obsolete media backup folder (**RELIC**). |
| `/home/james/SovereignOS/.venv` | **6.3 GB** | Single unified python virtual environment. |
| `/home/james/SovereignOS/01_Sovereign_Portal` | **4.8 GB** | Decoupled node frontend (Vite / `node_modules`). |
| `/home/james/SovereignOS/15_FanStack` | **4.1 GB** | Decoupled node frontend (Vite / `node_modules`). |
| `/home/james/SovereignOS/20_AetherVet` | **4.0 GB** | Decoupled node frontend (Vite / `node_modules`). |
| `/home/james/SovereignOS/data` | **2.0 GB** | Chat logs, auto-exports, and database nodes. |

---

## 📓 Proven Writer of `fanstack_chat_uat.log`

Static AST analysis of the Python scripts identifies two active script writers to this log:
1.  **`the_skew_relay.py`** (line 195)
2.  **`fanstack_relay.py`** (line 219)

### Folder Redirection Resolution
Both scripts dynamically resolve the log file path utilizing:
`log_dir = Path(os.getenv("SOVEREIGN_HOME", "/home/james/SovereignOS")) / "logs"`
Therefore, no "FanCast" folder is created or written to under the active codebase on clio. The log is safely written to the central logs home at:
`/home/james/SovereignOS/logs/fanstack_chat_uat.log`

---

## 📁 `notebook_lm_exports` Canonical Target
A system-wide search located **exactly one directory** representing this concern in the active workspace:
*   `/home/james/SovereignOS/dna/notebook_lm_exports`

*Note:* Per Pilot directive Q4, a multi-source hardcoding discrepancy exists in `sync_notebook_stacklabs.sh`. This is flagged for a follow-up ticket and is **frozen** (untouched) during this sprint.

---

## 🛑 Designated Legacies & Quarantine Exclusions

The following files and folders represent historical drift or obsolete forks. They are **100% excluded** from the sibling bare-bones tree (`/home/james/SovereignOS_bare/`) and marked for eventual purge:

### Deprecated Code Files
*   **`fanstack_relay.py`** (superseded by `the_skew_relay.py` as the canonical multi-persona relay).
*   **`scruffys_bar_server.py`** (superseded by `ScruffysTavern.tsx` frontend and relay-absorbed endpoints).

### Deprecated Directories (Relics)
*   `/home/james/SovereignOS/dna/media/`
*   `/home/james/SovereignOS/dna/media_OLD_BACKUP/`
*   `/home/james/SovereignOS/_archive/` (9.1 GB of legacy files)
*   `/home/james/SovereignOS/dna/vault/`
