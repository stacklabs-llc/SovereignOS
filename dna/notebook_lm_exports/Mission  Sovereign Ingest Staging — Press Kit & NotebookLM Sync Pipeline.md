# ANTIGRAVITY WORK ORDER

Mission: Sovereign Ingest Staging — Press Kit & NotebookLM Sync Pipeline
Date: May 28, 2026 
Issued By: James Carroll — Sovereign OS Principal Architect
Priority: 🟡 P3 — Platform Infrastructure & Investor Materials
Ticket: STRY1779840587
Short Description: Build an automated synchronization pipeline for the Sovereign OS Press Kit media assets, compiling vision frames into structured text logs and an aggregated PDF manifest for flawless Google NotebookLM ingestion via rclone.

════════════════════════════════════════════════════════════════════════════════
### 🛑 SYSTEM CONSTRAINTS & COMPLIANCE INVARIANTS
* **KI-038 (SQLite Canonical Invariant):** All process metrics must read strictly from `/home/james/SovereignOS/dna/sovereign_now.db`.
* **KI-041 (No Hidden Media References):** All generated images from the press kit work order MUST be extracted directly to public-facing ingestion directories. No hidden system dot-folders.
* **KI-050 (Inbox Zero-Litter Mandate):** Temporary scratch files or UUID-named assets are strictly forbidden from hitting the root of `/home/james/sovereign_inbox/`. Everything must route to structured staging paths.
* **Brooks Exception Visual Mandate:** All persona artifacts compiled into the text logs must explicitly enforce the 1990s physical felt puppet aesthetic. No stock corporate graphics or glossy 3D renders.

════════════════════════════════════════════════════════════════════════════════
### PHASE 1 — ESTABLISH COMPLIANT INBOX STRUCTURE
Execute these directory formations on Clio to ensure complete compliance with the Zero-Litter Mandate (KI-050):

```bash
mkdir -p /home/james/sovereign_inbox/dashboards/presskit/
mkdir -p /home/james/sovereign_inbox/reports/notebook_sync/