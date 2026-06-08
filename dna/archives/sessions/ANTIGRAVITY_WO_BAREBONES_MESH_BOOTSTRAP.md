# ANTIGRAVITY WORK ORDER

## Mission: Bare-Bones SovereignOS Mesh Rebuild \+ ATF Bootstrap Harness \+ Canonical-Path Enforcement

**Date:** June 1, 2026 **Issued By:** James Carroll — Sovereign OS Principal Architect (The Omega Gate Ω) **Priority:** 🟡 P2 — Pilot-Initiated Foundational Cleanup (execute within 24h, no live-event collision) **Ticket:** Create `STRY` in `sovereign_tickets` (KI-023) — **but ONLY after the Phase 0 Q\&A gate clears. Ticket creation is a metal operation.** **Short Description:** As the Pilot, I need a provably-minimal, RAM-resident SovereignOS that boots the full mesh cleanly from a pristine tree — so that no agent, human or AI, can pattern-match its way into the old way by stumbling over relic directories. The rebuild establishes one canonical home per concern and a linter that keeps it that way.

---

## 🛑 CRITICAL EXECUTION GATE — KI-028 / NO BLIND HANDOFFS

**Antigravity MUST NOT touch metal until Phase 0 is complete and the Pilot has issued an explicit `GO`.**

"Touching metal" \= creating, copying, moving, or deleting any file; booting any process; writing to `sovereign_now.db` (including the KI-023 ticket); or modifying any daemon. **None of that happens until the Q\&A in Phase 0 is answered and a Decision Record is confirmed by the Pilot.**

If the Pilot leaves any Phase 0 question unanswered, Antigravity **stops and re-asks**. It does NOT proceed on an assumption. Assuming a path is exactly the failure mode this WO exists to delete.

---

## WHY THIS WO EXISTS (Grounded Findings)

A static pass over the 12 Part-1 daemons (read-only, already performed) established the real shape of this system. Antigravity should treat these as confirmed facts, not re-derive them from scratch:

1. **Zero internal import edges.** Not one daemon imports another. Crash-driven *import* discovery will surface almost nothing — there are no `ImportError` chains to follow. The coupling is entirely runtime.  
2. **The coupling buses are: subprocess, shared DB, and HTTP ports.** `sovereign_core_api.py` makes **38** subprocess calls; `stream_sniper_daemon.py` 19; `mando_watchdog.py` 6; `fanstack_admin_api.py` 5; `ollama_governor.py` 4; `the_skew_relay.py` 3\. Nearly every daemon reads/writes `sovereign_now.db`. Runtime port deps observed: **11434** (Ollama), **8008** (FanStack/M.A.R.D WS hub), **5056**, **8009**, **3008** (Cinema UI).  
3. **Relics are not passive — live daemons regenerate them.** `the_skew_relay.py` still speaks the dead "FanCast" brand at lines \~164 (`"New FanCast visualizer node connected!"`), \~211 and \~274 (export header `"Sovereign FanCast Export"`), and \~1271 (CSV filter `"FanCast_Export"`). A clean tree will re-litter on first relay connect because the name is in the code, not the directory.  
4. **The "canonical" path today is whatever was last typed into a string literal.** Five daemons hardcode `/home/james/SovereignOS/media_vault/...` (`dvr_controller_v2`, `sovereign_core_api`, `stream_sniper_daemon`, `the_skew_relay`, `generate_single_onboarding_pdf`), while the Pilot also maintains `dna/media` and `dna/media_OLD_BACKUP`. No human decided which wins. This WO forces that decision and enforces it.

**Consequence for method:** a bare-bones folder will almost always **boot clean and run half-dead** — processes start, then fail silently when they subprocess something absent or dial a dead port and just retry. Therefore **"boots without crashing" is NOT the success criterion.** The success criterion is a per-subsystem smoke test. This is non-negotiable (KI-029 Prove It Works).

---

## ☑️ PHASE 0 — MANDATORY Q\&A SESSION (NO METAL)

Antigravity presents the following questions to the Pilot **conversationally, in the IDE, and waits.** It answers none of them itself. After the Pilot responds, Antigravity writes a **Decision Record** block echoing every answer back, and asks: *"Confirm this Decision Record and issue GO?"* Only an explicit `GO` unlocks Phase 1\.

### Q-Group A — Canonical Homes (the whole point)

1. **Media:** `media_vault/`, `dna/media/`, or `dna/media_OLD_BACKUP/` — which single path is the one true media home? The other two become relics. (Daemons currently hardcode `media_vault`.)  
2. **Database:** KI-038 fixes the live DB at `/home/james/SovereignOS/dna/sovereign_now.db`. For the bare-bones boot, does the ATF use (a) a **read-only copy** of the live DB, (b) a **schema-only** fresh DB, or (c) a **fixture** DB with minimal seed rows? This determines whether runtime DB deps are even testable.  
3. **Logs:** `logs/` vs `logs_archive/` — which is the canonical live log dir, and is `logs_archive/` frozen history (read-only) or still being written? (Flag: a `FanCast`\-named log was updated 3h ago — Antigravity must identify the writer in Phase 1, do not assume.)  
4. **Exports:** there are multiple `notebook_lm_exports/` directories. Which path is canonical? (Count \+ locations are produced in Phase 1; the *decision* is the Pilot's.)

### Q-Group B — Scope & Definition of "Booted"

5. **Full-mesh success set:** confirm the exact processes that must all pass smoke tests for the mesh to count as "up." Default proposed set — Pilot strikes or adds:  
   - Backends: `sovereign_core_api` (FastAPI), `sdlc_portal_server` (8095), Stream Relay (8097), M.A.R.D WS (8000/8008), `the_skew_relay`, `fanstack_chatbots`, `fanstack_admin_api`, `fanstack_background_poller`, `statcast_sentinel`, `mando_watchdog`, `ollama_governor`, `scruffys_bar_server`, `dvr_controller_v2`, `stream_sniper_daemon`.  
   - Frontends: 3000 Portal, 3008 Cinema, 3009 SDLC, 3010 Sports, 3015 Bistro/AetherVet, 3016 Wildseed.  
6. **External deps in scope?** Ollama (11434) and Tailscale mesh — must the bare-bones boot bring these up, or may the ATF stub/skip them and validate mesh separately?

### Q-Group C — Launch & Runtime Reality

7. **Supervision:** how are these normally launched — systemd units, pm2, a start script, tmux? The harness must drive the *real* mechanism, not invent one.  
8. **venv:** `statcast_sentinel.py` pins `/home/james/SovereignOS/.venv/bin/python3`. Is there one canonical venv for all daemons, or per-service? Bare-bones must carry the right interpreter(s).

### Q-Group D — Guardrails & Authority

9. **Non-destructive confirmation:** confirm the live `SovereignOS/` tree is **never modified** by this WO — the bare-bones folder is built by **copy only**, originals untouched. (Campsite Protocol.)  
10. **FanCast scope guard:** in this WO, do we (a) freeze daemon code and only fix *paths/manifest*, or (b) also rename `FanCast`→`FanStack` inside `the_skew_relay.py`? (Recommend (a) for this pass to keep blast radius contained — KI-033.)  
11. **Relic authority:** the Phase 1 relic inventory is a *proposal*. Confirm the Pilot personally approves the relic list before any directory is excluded from the bare-bones tree. (No directory is declared dead by the agent alone.)

**Phase 0 exit condition:** Decision Record confirmed \+ explicit `GO`. No `GO`, no metal.

---

## PHASE 1 — STATIC AUDIT \+ INVENTORY (READ-ONLY)

After `GO`, create the STRY ticket (KI-023), then perform **read-only** analysis. Produce three artifacts under `/today/`, uniquely named with the ticket ID (KI-040):

1. **`dependency_graph_<TICKET>.md`** — AST import graph \+ every `subprocess.*` target \+ every `fetch(`/`requests`/`urllib`/`websockets` target host:port across **all** daemons AND frontend `src/` (KI-020: backend AND frontend, no exceptions). This is the add-back map for Phase 3\.  
2. **`relic_inventory_<TICKET>.md`** — full-tree inventory answering the Pilot's open questions: count and absolute paths of every `notebook_lm_exports`, every `*_OLD*`/`*_BACKUP*`/`*_quarantine*`/nested `*_vault*` dir, and **the identity of the process still writing the `FanCast`\-named log** (trace the open file handle / writer — do not guess; if it can't be proven, say so).  
3. **`canonical_path_manifest_<TICKET>.md`** — the single declared home for `db`, `logs`, `media`, `exports`, `assets`, `projects`, derived from the Phase 0 Decision Record. This is the source of truth Phase 5 enforces.

No files are created, moved, or deleted in this phase. Output is documentation only.

---

## PHASE 2 — CUT THE BARE-BONES TREE (COPY-ONLY)

Build `/home/james/SovereignOS_bare/` (or Pilot-named target) as a **copy** of only the files the manifest \+ dependency graph mark as load-bearing. Mirror the canonical directory structure exactly — one home per concern, zero relic dirs. Originals are never touched (Phase 0 Q9). DB handling per Phase 0 Q2. The pristine tree must be small enough to live on a thumb drive / RAM-resident — that portability is the acceptance proof of minimalism.

---

## PHASE 3 — BUILD THE ATF HARNESS

A single harness (`atf_bootstrap_<TICKET>.py` or `.sh`, Pilot's call on language) that runs the key-turn loop with the **correct** success criteria — not "didn't crash":

For each subsystem in the Phase 0 success set, the harness checks **four signals**:

- **Process up** — launched via the real supervisor (Phase 0 Q7), still alive after warmup.  
- **Ports answering** — every required port from the dependency graph accepts a connection (`curl`/socket probe), not just the process's own listen port.  
- **DB tables present** — the specific tables that subsystem reads exist in the bare-bones DB (probe `sqlite_master`), against the KI-038 canonical path.  
- **One real smoke request** — exercise the critical path: health endpoint, post-and-read a ticket, fire one persona reply, confirm relay actually accepted a node, etc. Pass \= sane output, not a 500 and not a silent retry.

On any failure, the harness logs the **first** missing signal (file, port, table, or failed request) and surfaces the exact next candidate to add from the dependency graph. No external links declared working without a `curl` (KI-004).

---

## PHASE 4 — ADD-BACK LOOP TO FULL-MESH GREEN

Run the harness, read the first failure, add the indicated candidate from the dependency graph (file, table-seed, or config), re-run. Repeat until **every** subsystem in the success set passes all four signals. Each iteration's add is logged with its justification (why this file was load-bearing) — this log becomes the minimality proof. Stop condition: full mesh green, nothing in the success set degraded or stubbed.

---

## PHASE 5 — ENFORCE & CODIFY (so it never re-accretes)

1. **Path linter** (`path_lint_<TICKET>.py`): greps all daemons \+ frontend `src/` for path literals; **fails** any reference pointing outside the canonical manifest. Wire it as the gate that catches the next relic at the source (directly enforces KI-010 \+ KI-020).  
2. **New KI:** draft `ki_055_canonical_path_law.md` for Pilot review — declares the manifest the single source of truth for filesystem layout, makes any out-of-manifest path literal a Protocol Breach, and points future agents at the linter. Do not self-merge; present for Pilot approval.

---

## ✅ DEFINITION OF DONE

- [ ] Phase 0 Decision Record confirmed by Pilot; explicit `GO` recorded.  
- [ ] STRY ticket created (KI-023) and referenced in all three Phase 1 artifacts.  
- [ ] Dependency graph, relic inventory (incl. proven FanCast-log writer), and canonical-path manifest delivered to `/today/`, uniquely named (KI-040).  
- [ ] Bare-bones tree built copy-only; live tree byte-identical to its pre-WO state (verify).  
- [ ] ATF harness passes all four signals for every subsystem in the agreed success set — no stubs, no degraded services.  
- [ ] Path linter operational; reports zero out-of-manifest path literals (or an approved exception list).  
- [ ] `ki_055` drafted and presented for approval.  
- [ ] Bare-bones tree fits the thumb-drive / RAM-resident target (report final size).

## 🔒 HARD CONSTRAINTS

- **Non-destructive:** copy only. The live `SovereignOS/` is read-only for the duration. (Campsite Protocol.)  
- **No assumptions on unanswered Q's** (KI-028). Stop and re-ask.  
- **DB path is `/home/james/SovereignOS/dna/sovereign_now.db`** — never the root, never scan for DB files (KI-038).  
- **No new hardcoded paths** introduced anywhere; manifest or nothing (KI-010).  
- **Tailscale MagicDNS** for any endpoint, never raw IPs (KI-001).  
- **Prove it works** with terminal logs and `curl` before any claim; no "absolutely right," no apologies (KI-004 / KI-029).

## 🎫 TICKET CLOSURE (KI-039)

On completion: `PUT /api/tickets/{number}` → `state=4` with work notes; save `walkthrough_<TICKET>.md` to `/today/`; `POST` it as a multipart attachment to `/api/tickets/{number}/attachments`.  
