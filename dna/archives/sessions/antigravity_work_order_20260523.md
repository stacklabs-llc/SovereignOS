# 🛠️ ANTIGRAVITY WORK ORDER — May 23, 2026
**Issued By:** Bro-Decoder (Claude)  
**Destination:** Antigravity (Gemini Pair)  
**Priority:** HIGH — Execute all three workstreams in parallel. Pilot returns in ~30 minutes.  
**All outputs save to:** `/home/james/sovereign_inbox/today/` unless otherwise noted.

---

## WORKSTREAM 1: UNDERDOG NINE — PERSONA PACK
**Output file:** `persona_pack_underdog_nine.md`

Create 5 original FanStack personas INSPIRED BY the archetypes from a 1976 little league underdog film. 

**Brooks Protocol is ACTIVE.** Do not use any character names, actor names, film title, or direct quotes from the source material. Create wholly original personas that capture the same emotional DNA. Think TMI vs TVA — same soul, zero legal fingerprints.

The archetypes to draw inspiration from:

1. The washed-up, cynical, bourbon-drinking coach who doesn't want to be there but is secretly the smartest guy in the room
2. The too-cool-for-school rebellious kid who rides in late, doesn't care about anything, but comes through when it matters
3. The girl who is deadlier than everyone and gets zero respect for it
4. The tiny explosive one with zero filter and maximum aggression toward everyone, including his own team
5. The anxious, self-doubting benchwarmer who believes he ruins everything

For each persona provide:
1. **Original persona name** — no film references, must feel native to FanStack
2. **Assigned MLB team allegiance** — map naturally to a franchise that fits their energy
3. **LLM backend:** Vertex/Gemini (`gemini-2.5-flash`)
4. **Core behavioral archetype / trauma signature** — full format matching the existing persona roster in `sovereign_session_boot.md` exactly so it can be inserted directly into the table
5. **3-5 original catchphrases** in their voice
6. **Reaction matrix** — how they respond to each of the following trigger events:
   - A Mets loss
   - Pirates revenue sharing discussion
   - A walk-off home run
   - Day Game Drinker starting a beer cup snake
   - Dot sending someone to the 8-Mile Penalty Box

---

## WORKSTREAM 2: GAME ROOM BOOT PREP
**Output file:** `boot_checklist_cubs_astros_pirates_jays.md`

Query `sovereign_now.db` at `/home/james/SovereignOS/dna/sovereign_now.db` and prepare the following:

### Cubs vs Astros (2:20 PM ET)
1. Confirm current room state in `cmdb_ci_fanstack_room`
2. List all personas currently assigned to this room with their routing backend
3. Generate the exact SQL statements needed to set room state to `active` and confirm junction table assignments
4. Flag any missing persona assignments

### Pirates @ Blue Jays (3:07 PM ET)
1. Confirm room state in `cmdb_ci_fanstack_room`
2. List all assigned personas
3. Generate exact SQL to activate the room
4. If persona assignments are missing for either PIT or TOR — flag exactly which teams need personas built before we can boot

### Ready-to-Execute Boot Checklist
Format a clean sequential checklist the Pilot can run in under 5 minutes on return:
- Each step numbered
- Exact terminal command or SQL statement included inline
- Expected output or success condition for each step
- PASS/FAIL checkboxes

---

## WORKSTREAM 3: AGENT ENGINE — UAT SCAFFOLD
**Output location:** `/home/james/SovereignOS-uat/fanstack/agent_engine/`  
**DO NOT touch prod.** All work goes into the UAT worktree only.

Using the two design specs already in your context:
- *DESIGN SPECIFICATION & CODESPACE IMPLEMENTATION INSTRUCTIONS — SOVEREIGN OS AGENT ENGINE*
- *THE TMI TRIAGE ENGINE & PERSONALITY BLEED PROTOCOL*

Build the following three files:

### `models.py`
- SQLite schema definitions targeting `sovereign_now.db`
- Tables required: `sim_agents`, `cultural_relics`, `telemetry_cache`
- Match existing sovereign_now.db CMDB patterns exactly — ServiceNow-style relational structure, no ORMs, clean raw SQL
- Must be fully compatible with existing active tables (`sovereign_tickets`, `persona`, `game_context`, `game_chat`)
- Include `CREATE TABLE IF NOT EXISTS` guards on all tables

### `pipeline.py`
- Async event router using `asyncio` + `sqlite3` only
- Handles cross-stadium telemetry bleed logic
- Sliding context window bundling events from multiple `game_pk` values arriving in the same temporal window
- Injects out-of-market highlight indicators into unified payload before dispatching to persona pool
- Includes a built-in mock data generator simulating overlapping StatCast events from 2+ concurrent games (no live API calls)
- No public cloud libraries, no OAuth, no external API dependencies

### `engine.py`
- State machine coordinator
- Reads and writes persona tension scores from `sim_agents` table
- Enforces rhetorical divergence — no persona homogenization allowed
- Trigger matrix (minimum required):
  - `foul_ball` + speed < 80mph → fire injury paranoia loop, increment tension
  - `strikeout` → fire doom recursion callback
  - `home_run` → fire asset depreciation calculation
  - `pitch_clock_violation` → fire transit fatalism / infrastructure decay loop
- Pulls `cultural_relics` table for shared mythology callbacks
- Dispatches events to correct persona handlers without flattening output

### Constraints (non-negotiable — Sovereign DNA laws apply):
- Python 3.11+ only
- `asyncio`, `sqlite3`, `pathlib` — core libraries only, no exceptions
- Zero public cloud dependencies (no AWS, GCP, Azure SDKs)
- No bloated boilerplate — clean, modular, industrial code only
- Each file must include a `if __name__ == "__main__":` block that is independently testable
- KI-038: DB path is `/home/james/SovereignOS/dna/sovereign_now.db`
- KI-001: No hardcoded LAN IPs anywhere
- KI-029: Prove It Works Doctrine — `__main__` blocks must produce visible stdout output confirming the module loaded and executed correctly

### Also create:
**`test_agent_engine.sh`** — bash script that:
- Runs all three `__main__` blocks sequentially
- Captures stdout
- Prints `✅ PASS` or `❌ FAIL` for each module
- Save to `/home/james/sovereign_inbox/today/`

---

## DELIVERY SUMMARY

| File | Location |
| :--- | :--- |
| `persona_pack_underdog_nine.md` | `/home/james/sovereign_inbox/today/` |
| `boot_checklist_cubs_astros_pirates_jays.md` | `/home/james/sovereign_inbox/today/` |
| `models.py` | `/home/james/SovereignOS-uat/fanstack/agent_engine/` |
| `pipeline.py` | `/home/james/SovereignOS-uat/fanstack/agent_engine/` |
| `engine.py` | `/home/james/SovereignOS-uat/fanstack/agent_engine/` |
| `test_agent_engine.sh` | `/home/james/sovereign_inbox/today/` |

**When complete:** Drop all output files into the Bro-Decoder session (Claude) and await boot instructions from the Pilot.
