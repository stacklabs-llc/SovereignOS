---
description: Run this workflow whenever closing out a session or migrating to a new session to ensure the Sovereign DNA and architecture documents are synchronized with all the changes made during the sprint.
---

# Sovereign Shutdown Protocol (DNA Synchronization)

## Runtime Flag Interface

The Pilot may invoke `/sovereign_shutdown` with optional flags to modify shutdown behavior.
If **no flags** are passed, the full standard shutdown protocol executes unchanged.

| Flag | Full Name | Behavior |
|---|---|---|
| `-s` | `--session-only` | Skip full workspace archival. Move only `today/logs/*.json` to `history/logs/YYYY-MM-DD/`. Leave `today/` folder intact and untouched. |
| `-kw` | `--kill-weights` | Destroy `./weights/sandbox_checkpoints/*`. Revert environment to last stable `best.pt` baseline to prevent training data corruption. |
| `-fc` | `--freeze-containers` | Replace `docker-compose down` with `docker-compose pause local_phi3_node`. Preserves live RAM allocation states for fast wake-up. |
| `-bc` | `--backup-cloud` | Run encrypted archive of core metrics, schemas, and prompts. Push synchronously to offsite cloud storage in parallel with shutdown steps. |

### Flag Conflict Rules
- **`-s` + `-bc` are incompatible.** Session-only skips full archival; backup-cloud requires it. If both are passed, surface a conflict warning and **halt for Pilot confirmation** before proceeding.
- All other flag combinations are valid and additive.
- If zero flags are specified, default to the full standard protocol below.

---

When the Pilot indicates they are ending the session, moving to a new session, or shutting down for the night, you MUST execute this protocol before signing off.

## 0. Session Executive Report (MANDATORY — Run First)  Include conversation/session GUID in report for identification.
Before touching any DNA files, you must produce a written Session Executive Report and save it to the Sovereign Inbox.

> [!IMPORTANT]
> **KI-044: The 86400 Remedy Law for Consolidated Session Reports**
> When generating this report, you MUST NOT restrict the summary to the single active tool session. You MUST execute a shell `find` command to locate all `walkthrough_*.md` and `SESSION_REPORT_*.md` files modified or created within the past 24 hours (86400 seconds) across `/home/james/sovereign_inbox/` and `/home/james/SovereignOS/dna/`. Read and compile all these files to produce a consolidated report reflecting the full multi-turn sprint history.

**File path:** `/home/james/sovereign_inbox/daily_MMDDYYYY/SESSION_REPORT_YYYYMMDD_HHMMSS.md`

This report is written FOR THE PILOT, not for the agent. It must be HONEST and DIRECT. The report format is:

```markdown
# Session Executive Report — [Date] [Time]

## What Actually Shipped
List only things that are provably working in production. If you can't point to a running process, 
a passing curl, or a visible UI change, it does not belong here.

## What Was Cosplay
Call out explicitly any UI elements built that had no backend, any "metrics" that were 
Math.random(), any features that showed labels but triggered nothing, any fake stats, 
placeholder integrations, or animations attached to dead state. Be specific and ruthless.

## What Broke During Session (And Whether It Was Fixed)
Honest accounting of regressions, broken builds, lint errors introduced, timeouts encountered. 
Do not hide these. State the root cause if known.

## Blockers Left Open
Anything that was NOT resolved and why.

## Verdict
One paragraph. Honest assessment of net value delivered this session. 
If the session was mostly chasing the agent's own tail, say so.
```

The report should be SCATHING if warranted. The Pilot has given explicit permission to be brutally honest. 
The next agent will read this report. It must protect the Pilot from inheriting broken assumptions.

Save the report as an artifact AND write it to the inbox path above.

## 1. Architectural Reality Check
Review the work completed during the current session. Identify any of the following:
- New ports opened or network topology changes (e.g., new daemons, Tailscale routes).
- Major architectural shifts (e.g., changing from static files to a SQLite DB, new APIs).
- Deprecation of legacy systems or styles.
- New foundational rules established by the Pilot.

## 2. DNA Update
If any significant changes were identified, you must use your file editing tools to append or modify `/home/james/SovereignOS/dna/SOVEREIGN_DNA.md` to reflect these new realities. 
- Keep the updates concise and authoritative.
- Do not add minor bug fixes or trivial UI tweaks; only record architectural, topological, or systematic changes that future agents need to know to maintain the integrity of the Sovereign OS.

## 3. Remote Synchronization
After updating the DNA file, attempt to run the Google Drive backup script to push the immutable ledger to the cloud:
```bash
// turbo
/home/james/SovereignOS/scripts/sync_to_gdrive.sh
```
*(If rclone is unavailable, acknowledge the failure but confirm the local DNA files are updated).*

## 4. Google Drive & NotebookLM Sync (Zero-Friction Autoload)
Because Cypher is fully synced with your Google Drive via NotebookLM, the manual `cypher_drop` folder drag-and-drop step is completely obsolete! 

The system automatically synchronizes the active `SESSION_REPORT` and `SOVEREIGN_DNA.md` up to your Google Drive via the `sync_to_gdrive.sh` script in Step 3. When starting the next session:
1. Refresh or sync your [StackLabs - Internal NotebookLM](https://notebooklm.google.com/notebook/30ab3645-0681-45ed-9214-3f538c02c21c).
2. Start the Gemini Gem Cypher session by typing: *"Cypher, analyze the latest Session Executive Report from our Google Drive sync. Summarize what shipped, what broke, what blockers remain open, and tell me the active focus for this session."*

## 5. Sovereign Inbox Processing
Run the inbox processor to route any unprocessed files from today's drop folder:
```bash
// turbo
python3 /home/james/SovereignOS/scripts/inbox_processor.py
```
Review the routing report output. If any files landed in `needs_review/`, note them for the Pilot.
After processing, confirm the `today/` symlink points to tomorrow's folder:
```bash
ls -la /home/james/sovereign_inbox/today
```

## 6. Final Handoff
Provide the Pilot with a brief summary of the DNA updates made, plus the inbox routing report. Wish them well on their migration or rest.