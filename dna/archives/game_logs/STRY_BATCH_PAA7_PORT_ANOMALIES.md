# STRY BATCH — PAA-7 Port Anomalies (route through UAT Authority)
**Source:** PAA-7 Live Port Monitor sweep, June 1, 2026
**Created by:** James Carroll (Pilot) via PAA-7
**Routing rule:** Builder may advance each ticket to `Testing` only. The UAT Authority owns the move to `Resolved(4)` (KI-039). All three validate on **deterministic** evidence-battery tiers — **zero Vertex spend** (no Gemini vision needed; these are port-truth checks).
**Note:** Real `number`/`sys_id` assigned by the SDLC API on creation — placeholders below.

---

## STRY-PAA7-01 — Port 3009 identity crisis: SDLC Portal vs Hot Takes
- **cmdb_ci:** Sovereign SDLC Ticketing Portal (3009) + FanStack/SKEW frontend
- **Priority:** P2
- **State flow:** New → (builder) In Progress → Testing → (UAT Authority) Resolved(4)
- **Assigned to (fix):** builder · **(validation):** UAT Authority

### Finding
The canonical port manifest lists `3009 = Sovereign SDLC Ticketing Portal`, but Hot Takes (`domain=SKEW&room=hot_takes`) was observed served from `localhost:3009` (UAT screenshot, June 1). Two services appear to claim one port, or the manifest is stale.

### Root cause (to confirm — do not assume)
Either (a) a port collision where the SDLC portal and a FanStack/Skew view both bind 3009, or (b) manifest drift where 3009 was reassigned and the manifest never updated. The fix's first task is to determine which.

### Proposed fix
Resolve the canonical owner of 3009 against the WO-1 `canonical_path_manifest`. Move the non-owning service to its correct port, update every reference natively (no per-app port literals — route through the manifest, KI-010/KI-020).

### Acceptance criteria (deterministic — PAA-7 / port probe)
1. The manifest declares exactly one owner for 3009.
2. Only that service answers on 3009; its response carries the owner's identity markers (e.g., SDLC portal markers, not Hot Takes).
3. No second process binds 3009.
4. The relocated service answers on its newly-declared canonical port.

**UAT evidence tier:** Tier 3 (endpoint health) + manifest cross-check. PASS → Resolved(4); FAIL → reopen with the conflicting binding logged.

---

## STRY-PAA7-02 — GardenStack port drift: 3005 vs 3016
- **cmdb_ci:** Wildseed GardenStack (Vite/React)
- **Priority:** P2
- **State flow:** New → In Progress → Testing → Resolved(4)
- **Assigned to (fix):** builder · **(validation):** UAT Authority

### Finding
`uat_prospectus.ts` references GardenStack at `${baseUrl}:3005`, while `vertex_uat_agent.py` `PORT_MAPPING` and the canonical manifest say `3016`. Contradictory hardcoded port maps across scripts.

### Root cause
The canonical-source problem in test clothing: each UAT script carries its own port map instead of reading one manifest. Nothing decided 3005 vs 3016 — both got typed into different files.

### Proposed fix
Confirm 3016 as canonical (per manifest). Purge all `3005` GardenStack references. Route every port lookup through the manifest; delete per-script port maps. This is a direct customer of the WO-1 path/port linter (Phase 5).

### Acceptance criteria (deterministic — grep + port probe)
1. Codebase grep returns zero `GardenStack`-associated `3005` references (backend AND frontend `src/`).
2. GardenStack answers on 3016 only.
3. No script defines its own GardenStack port literal; all resolve via the manifest.
4. WO-1 path/port linter passes clean for GardenStack.

**UAT evidence tier:** Tier 3 (endpoint health) + deterministic grep. PASS → Resolved(4); FAIL → reopen with surviving `3005` references listed.

---

## STRY-PAA7-03 — Investigate unbadged listener on 8080 (badge it or evict it)
- **cmdb_ci:** UNKNOWN (to be identified)
- **Priority:** P3
- **State flow:** New → In Progress → Testing → Resolved(4)
- **Assigned to (fix):** builder · **(validation):** UAT Authority

### Finding
PAA-7's monitor design flags 8080 as a suspect: a non-canonical port with no manifest entry and no owning CI ("no badge, no ticket"). 8080 was the console's demonstration flag — this ticket confirms whether a real listener exists.

### Root cause (unknown — investigation ticket)
Undetermined. Possibly nothing (demo only), possibly a relic daemon, possibly a legitimate service missing from the manifest.

### Proposed fix
PAA-7 / `lsof -i :8080` sweep on clio. If a listener exists: identify the owning process; if legitimate → add to the canonical manifest with a CI; if relic/rogue → terminate and document. If nothing answers → close as no-finding.

### Acceptance criteria (deterministic — port probe + manifest)
1. Final state of 8080 is unambiguous: either nothing listens, OR a documented service with a manifest entry and owning CI.
2. No undocumented listener remains on 8080.
3. Outcome (no-finding / badged / evicted) recorded in work notes.

**UAT evidence tier:** Tier 3 (port probe) + manifest cross-check. PASS → Resolved(4); FAIL → reopen.

---

## Why these three are the right first customers
All three validate on hard, falsifiable port truth — the UAT Authority resolves them without spending a Gemini token, proving the cheap-tiers-gate-first design. And they're precisely PAA-7's beat: drift, identity collision, and squatters. Fixing them by hand closes today; standing up the PAA-7 port-authority daemon (reads the manifest, polls each port, auto-flags drift/squatters/dark ports) closes it for always.
