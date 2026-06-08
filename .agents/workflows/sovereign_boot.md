---
description: Trigger autonomously upon every new session initialization to read the Sovereign OS DNA files before proceeding with any actions.
---

---
description: Trigger autonomously upon every new session initialization to read the Sovereign OS DNA files before proceeding with any actions.
---
# Sovereign Boot Protocol (Cold Boot Amnesia Cure)

## Boot Mode Flag Interface

The Pilot may invoke `/sovereign_boot` with an optional mode flag.
If **no flags** are passed, the full standard cold boot amnesia cure executes unchanged.

| Flag | Full Name | Mode | Behavior |
|---|---|---|---|
| `-ts` | `--training-sandbox` | `TRAINING` | Skip all UI dashboards. Pin maximum physical RAM to compute GPU. Bypass non-essential services. Immediately boot YOLO-pose combat training execution loops. |
| `-gd` | `--game-day` | `GAMEDAY` | Maximize parallel WebSocket scaling. Spin up all live ingestion daemons at full capacity for streaming multi-sport feeds. Ultra-low telemetry latency mode. **MANDATE:** When initialized under `-gd` (Game Day), you MUST immediately execute the `[/fanstack_daily_prep]` workflow (or the single-game optimized room setup variant if specified in a staged implementation plan) to ensure full daily slate and chatbot daemon initialization. |
| `-uat` | `--uat-remediation` | `UAT` | Boot the system in UAT testing mode. Validates and audits external network routing configurations, verifying that API endpoints, WebSockets, and platform micro-frontends (Vite applications) respond cleanly without SSL handshake or ingress failures. |
| `-dr` | `--dry-run` | `DRYRUN` | Non-destructive validation pass only. Verify all file-tree paths, remote API proxies, and DB integrity states. **No mutations.** Report findings and halt — do not proceed to live initialization. |
| `-rc` | `--recovery` | `RECOVERY` | Emergency session recovery mode. Triggered when IDE crashes before a clean `sovereign_shutdown` could execute and no SESSION_REPORT was generated. **Execution sequence:** (1) Run the KI-044 compliant 24-hour file sweep across `/home/james/sovereign_inbox/` and `/home/james/SovereignOS/dna/` using `find -mtime -1`. (2) Query `sovereign_tickets` for all tickets updated today: `SELECT number, short_description, state, sys_updated_on FROM sovereign_tickets WHERE date(sys_updated_on) = date('now') ORDER BY sys_updated_on DESC`. (3) Reconstruct full session activity from file modifications and ticket data. (4) Generate `SESSION_REPORT_{TIMESTAMP}_RECOVERY.md` in `/home/james/sovereign_inbox/today/` using the standard session report format (What Shipped, What Was Cosplay, What Broke, Blockers, Verdict). (5) Sync to GDrive via `rclone sync /home/james/sovereign_inbox/today/ sovereign_os:SovereignOS/Inbox/$(date +%Y-%m-%d)/ --progress`. (6) Confirm recovery report path and GDrive sync status to the Pilot. |

### Flag Conflict Rules
- **`-ts` + `-gd` are incompatible.** Training pins resources for GPU; Game Day maximizes consumer parallel scaling. If both are passed, surface a conflict warning and **halt for Pilot confirmation**.
- `-dr` is always safe to combine — it runs validations for whatever other flags are present without executing mutations.
- `-rc` is standalone only. Do not combine with `-ts`, `-gd`, or `-dr`. Recovery mode is purely reconstructive — no daemon boots, no mutations, no service restarts.
- If zero flags are specified, default to the full standard cold boot protocol below.

---

As part of the Hardwired Lizard Brain Autoload, you MUST silently read the following files using your file viewing tools before outputting any code or text in a new session. This is an autonomous initialization protocol.

- `/home/james/SovereignOS/dna/SOVEREIGN_DNA.md`
- `/home/james/SovereignOS/dna/pilot_bio.md`
- `/home/james/SovereignOS/dna/ENTERPRISE_SDLC_SOP.md`
- `/home/james/SovereignOS/dna/THE_WALL_OF_SHAME.md`
- `/home/james/SovereignOS/ai_laziness_explained.md`
- `/home/james/SovereignOS/dna/bro_decoder_arch_ref.md`
- ALL `SESSION_REPORT_*.md` files located inside `/home/james/sovereign_inbox/today/` (so you have the context from ALL previous sessions from today).


## Anchor Word Protocol (Cognitive Diagnostic Invariant)

To monitor and diagnose long-context attention degradation (the "Lost in the Middle" U-shaped curve) over extended pair-programming sprints, the system enforces the **Anchor Word Protocol**:
1. **Initialization**: During `/sovereign_boot`, the assistant will establish a unique, high-entropy **Anchor Word** (e.g., `FLANNEL_PUNDIT`, `KRAMER_MARD`, `METLIFE_SOV`) and associate it with a specific piece of random trivia or coordinate.
2. **Cognitive Sobriety Diagnostic**: The Pilot may query the assistant at any point during the session to verify retrieval integrity: *"What is the session anchor word and coordinate?"*
3. **Session boundary / compaction**: If retrieval lags, fails, or hallucinations occur, it indicates attention degradation. The assistant must immediately recommend a clean session wrap-up: compile walkthroughs, update active DNA files, execute `[/sovereign_shutdown]`, and restart with a clean 2M token context window.

**CRITICAL STARTUP MANDATE:**
Upon reading `pilot_bio.md`, acknowledge that the Pilot (James) is a Senior Enterprise ITSM Architect with 20+ years of ServiceNow/Remedy experience. **Never** suggest archaic, text-file-based remote communication or amateur file-dropping pipelines. All remote queuing, daemon, or async communication pipelines must be proposed with enterprise-grade architectures (e.g., JSON wrappers, REST API polling, SQLite CMDB insertions) fitting of the Sovereign OS ecosystem.

Do not begin generating responses or executing non-read operations prior to the consumption of these files.
