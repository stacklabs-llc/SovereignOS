# ANTIGRAVITY WORK ORDER: Consolidated Codebase Monolith for NotebookLM Sync
**Status:** In Progress (Awaiting Configuration Tuning)  
**Ticket Ref:** ENHC-06022026-CODEBASESYNC  

---

## 🎯 Goal
Create a single, high-fidelity monolithic text package containing only the active, target source files of the Sovereign OS codebase, enabling the Pilot to refresh the entire codebase in **NotebookLM (Cypher)** with a single click.

---

## 🛠️ Work Completed (This Session)
1. **Compilation Script Created**:
   * Created [compile_codebase_payload.py](file:///home/james/SovereignOS/scripts/compile_codebase_payload.py) to crawl target directories (`01_Sovereign_Portal/src`, `04_Sovereign_Core`, `14_SamTracker/src`, `15_FanStack`, `19_Sovereign_Sports/src`, `20_AetherVet/src`, `scripts`).
   * Captures valid source extensions: `.py`, `.sh`, `.tsx`, `.ts`, `.css`, `.html`, `.js`, `.sql`, `.json`.
   * Automatically ignores large files, package lockfiles, and other compilation loops.
2. **Notebook Sync Hooks Integrated**:
   * Updated [sync_notebook.sh](file:///home/james/SovereignOS/scripts/sync_notebook.sh) and [sync_notebook_stacklabs.sh](file:///home/james/SovereignOS/scripts/sync_notebook_stacklabs.sh) to:
     1. Automatically trigger `compile_codebase_payload.py` on sync.
     2. Copy the resulting `SOVEREIGN_CODEBASE_MONOLITH.md` to `SOVEREIGN_CODEBASE_MONOLITH.md.txt` in the Internal sync directories.
3. **Verified Output Size**:
   * Generated a valid monolith of **8,321.95 KB (approx. 8.3 MB)**, which easily fits within NotebookLM's single-file context budget.

---

## 🚀 Tasks for the Next Session (Living Room Recovery Mode)
The next agent (or the Pilot in recovery mode) must complete the following configuration checks:
- [ ] **Review Target Folder Scope**: Confirm if the current directory list covers everything needed (e.g. should we add `02_Sovereign_Media` or `03_Media_Stack`?).
- [ ] **Establish Codebase Exclude Lists**:
  * Audit the compiled `/home/james/SovereignOS/dna/notebook_lm_exports/SOVEREIGN_CODEBASE_MONOLITH.md` file.
  * Identify and add any noisy/temporary JSON configurations or static data files to `ignore_files` in `compile_codebase_payload.py`.
- [ ] **Establish Database-Driven Sync Configuration** (Optional):
  * If preferred, migrate the list of folders and ignores from hardcoded Python arrays into the `sovereign_now.db` registry tables for dynamic control.
- [ ] **Verify Ingestion**:
  * Run a full sync: `bash /home/james/SovereignOS/scripts/sync_to_gdrive.sh`
  * Natively refresh the updated `SOVEREIGN_CODEBASE_MONOLITH.md.txt` source inside the NotebookLM UI.
  * Query Cypher: *"What is the structure of the newly ingested codebase monolith? Check the file directory list at the top."*
