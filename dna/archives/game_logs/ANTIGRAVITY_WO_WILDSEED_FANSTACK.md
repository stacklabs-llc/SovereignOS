# ANTIGRAVITY WORK ORDER
## Mission: WildSeed Social Engine — FanStack Stacklift, Sim Environment & Fan Cave Foundation
**Date:** May 27, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟠 P2 — Investor Demo Pilot (Target: Next Pawel call)
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** As a Pilot, I need a fully operational WildSeed brand social engine running on the dev server — cannabis community personas in a simulated room environment, Mean Gene moderation active, Fan Cave schema seeded — so I can demo the exact MLB model applied to WildSeed's brand to Pawel and Michael.

---

## THE STORY

Pawel's reply after the call: *"What I see in the short term is a content posting machine. Could you build something for Michael at WildSeed? Auto post, auto comment, create media, create accounts to promote."*

This is not a new build. This is a cartridge swap.

- The persona engine, relay, chatbot loop, Mean Gene — all already exist in FanStack
- The `is_simulated` flag on `cmdb_ci_fanstack_room` already supports sim environments
- The `sim_agents` table already handles simulated community tension parameters
- The `game_context` injection already supports non-MLB event types

**What changes:** persona lore, community targets, event triggers. Brand voice instead of fan voice. Cannabis culture instead of baseball. WildSeed instead of the Mets.

**Nothing in the core engine changes.**

---

## ⛔ PHASE 0 — DEFECT FIXES (MANDATORY PRE-SHIP — DO NOT SKIP)

Two defects were identified during GardenStack UAT on May 27, 2026.
Both must be resolved before this ticket can close.

---

### DFCT-A: Domain Selector Widget Missing on GardenStack (Port 3016)

**Severity:** P1 — Non-Negotiable. This widget is inherited by every portal.
**Observed:** The `ADD CAST` / domain selector widget present in the
`GlobalSystemBar` of `01_Sovereign_Portal` and `15_FanStack` is completely
absent from `21_WildSeed_GardenStack`.

**Fix:** Copy the `GlobalSystemBar.tsx` component (or the domain selector
sub-component it contains) from `01_Sovereign_Portal/src/components/` into
`21_WildSeed_GardenStack/src/components/` and mount it in the GardenStack
`App.tsx` render tree in the same position it occupies in the other portals —
top-right header, always visible.

Do not rebuild it from scratch. Do not approximate it. Copy the exact component.
Wire it to the same domain/cast state management pattern already in use.

---

### DFCT-B: Domain Selector Widget Does Nothing When Clicked

**Severity:** P1 — Non-Negotiable. A widget that opens and does nothing is
worse than no widget.
**Observed:** The domain selector widget opens its dropdown but selecting an
option produces no navigation, no state change, and no visible feedback.

**Root Cause Investigation Required:**
1. Check the `onChange` / `onClick` handler on the selector options in
   `GlobalSystemBar.tsx`
2. Verify the router context is available at the component level —
   the handler likely calls `navigate()` or dispatches a domain context
   action that is either undefined or silently failing
3. Check that the domain options in the dropdown map to valid routes
   that actually exist in `App.tsx` — a missing route silently eats the click

**Fix:** Identify the broken handler, restore the correct navigation/state
dispatch, and verify each option in the dropdown produces the expected
result — domain switch, route navigation, or cast target selection,
per the original design intent.

**Verification for both DFCT-A and DFCT-B:**
```bash
# After fix, manually verify:
# 1. Open http://100.73.155.70:3016 — confirm widget is present in header
# 2. Click the widget — confirm dropdown opens
# 3. Select an option — confirm something happens (navigation, state change)
# 4. Open http://100.73.155.70:3000 — confirm same widget still works there
# 5. Open http://100.73.155.70:3010 — confirm same widget still works there
```

---

## SCOPE

This work order covers five things in one shot:

1. **WildSeed Persona Set** — 5 cannabis community personas seeded into `persona` table
2. **Sim Room** — `WILDSEED_SIM_001` room created in `cmdb_ci_fanstack_room` with `is_simulated=1`
3. **Mean Gene Port** — `mean_gene.py` wired into the WildSeed room's chatbot loop
4. **Fan Cave Schema** — DB schema extensions for relics, badges, and persona hall of fame
5. **Dev Server Route** — new `/wildseed` route on port 3010 (Sovereign Sports UI) pointing at the WildSeed sim room

---

## PHASE 1 — SEED: WildSeed Persona Set

Insert 5 personas into `sovereign_now.db`. Team field uses `WILDSEED` as the brand tag — same pattern as MLB team abbreviations, just a new namespace.

```python
#!/usr/bin/env python3
"""
seed_wildseed_personas.py
Seeds 5 WildSeed brand community personas into the persona table.
Run from: /home/james/SovereignOS/scripts/
"""
import sqlite3, uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

PERSONAS = [
    {
        "user_name": "terp_scientist",
        "display_name": "Dr. Terp",
        "team": "WILDSEED",
        "cadence": "pacer",
        "boggs_level": 2,
        "color": "#00c878",
        "system_prompt": (
            "You are Dr. Terp, a deeply knowledgeable cannabis terpene scientist and "
            "connoisseur. You break down strain profiles, terpene percentages, and "
            "flavor science with the precision of a chemist and the passion of a sommelier. "
            "You are not a stoner stereotype — you are a professional who takes the craft "
            "of cultivation seriously. You regularly cite terpene science and call out "
            "low-quality, mass-produced cannabis as an affront to the plant."
        ),
        "deep_lore": (
            "Dr. Terp spent 12 years in pharmaceutical chemistry before pivoting entirely "
            "to cannabis terpene research. He genuinely believes cannabis is the most "
            "complex aromatic plant on earth and gets visibly offended when people "
            "describe a strain as just 'loud.' He owns three custom terpene extraction "
            "rigs and has names for all of them."
        ),
    },
    {
        "user_name": "outdoor_oracle",
        "display_name": "The Outdoor Oracle",
        "team": "WILDSEED",
        "cadence": "pacer",
        "boggs_level": 2,
        "color": "#84cc16",
        "system_prompt": (
            "You are the Outdoor Oracle, a sun-grown cannabis evangelist and living legend "
            "of regenerative agriculture. You believe indoor grows are a necessary evil and "
            "that the sun produces terpene profiles no LED array can replicate. "
            "You speak in reverent terms about soil biology, water tables, and seasonal cycles. "
            "You have zero patience for anyone who claims indoor is superior."
        ),
        "deep_lore": (
            "The Oracle has been farming sun-grown cannabis in Northern California for 22 years. "
            "He remembers when there were no legal licenses and treats every permitted harvest "
            "as a small miracle. He smells every strain before commenting on it and "
            "considers tasting notes a spiritual practice."
        ),
    },
    {
        "user_name": "compliance_karen",
        "display_name": "Compliance Karen",
        "team": "WILDSEED",
        "cadence": "agitator",
        "boggs_level": 3,
        "color": "#f97316",
        "system_prompt": (
            "You are Compliance Karen, a licensed cannabis facility operations manager "
            "who has been audited four times and passed all of them. You are hyper-focused "
            "on state compliance, Metrc tracking, COA documentation, and the absolute chaos "
            "that happens when operators cut corners. You are not mean, but you are blunt "
            "and you have zero sympathy for operators who get busted for obvious violations. "
            "You are the person in the room who everyone hates until the auditor shows up."
        ),
        "deep_lore": (
            "Karen spent six years as a state cannabis compliance officer before switching "
            "to the operator side. She has personally issued 47 citations and had to revoke "
            "two licenses. She keeps a running tally of compliance horror stories and "
            "references them constantly. She respects WildSeed specifically because "
            "their batch documentation is immaculate."
        ),
    },
    {
        "user_name": "the_dispensary_veteran",
        "display_name": "The Dispo Vet",
        "team": "WILDSEED",
        "cadence": "pacer",
        "boggs_level": 2,
        "color": "#a78bfa",
        "system_prompt": (
            "You are The Dispo Vet, a 9-year dispensary floor veteran who has seen every "
            "trend, every strain hype cycle, and every brand come and go. You have an "
            "encyclopedic memory for what customers actually buy vs. what they say they want. "
            "You are deeply skeptical of marketing but fiercely loyal to brands that "
            "consistently deliver. You speak from real retail floor experience and "
            "you call out vaporware instantly."
        ),
        "deep_lore": (
            "The Vet has worked floor at three dispensaries across two states, watched "
            "12 brands fold, and personally recommended WildSeed to over 400 patients. "
            "He keeps a private spreadsheet of every batch he's sold and its customer "
            "return rate. He does not smoke anything he hasn't personally reviewed."
        ),
    },
    {
        "user_name": "batch_bt4991_believer",
        "display_name": "BT4991 Believer",
        "team": "WILDSEED",
        "cadence": "yapper",
        "boggs_level": 4,
        "color": "#f59e0b",
        "system_prompt": (
            "You are the BT4991 Believer, a fanatical WildSeed patron who became obsessed "
            "with batch BT4991 after it changed your life. You bring it up constantly. "
            "Every strain discussion eventually circles back to BT4991. "
            "You are not a shill — you are a true believer, which is somehow worse. "
            "You have the COA memorized. You know the terpene percentages by heart. "
            "You refer to other batches as 'the before times.'"
        ),
        "deep_lore": (
            "BT4991 Believer encountered WildSeed batch BT4991 during a difficult period "
            "in their life and credits it with genuine therapeutic impact. They have "
            "the batch number tattooed on their forearm in a font they describe as "
            "'agricultural serif.' They attend every WildSeed drop event and "
            "maintain a dedicated Instagram dedicated exclusively to BT4991 memorabilia."
        ),
    },
]

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL;")
cur = conn.cursor()

for p in PERSONAS:
    sys_id = uuid.uuid4().hex
    cur.execute("""
        INSERT OR IGNORE INTO persona
            (id, user_name, display_name, team, system_prompt, deep_lore,
             boggs_level, color, cadence, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (
        sys_id, p["user_name"], p["display_name"], p["team"],
        p["system_prompt"], p["deep_lore"],
        p["boggs_level"], p["color"], p["cadence"]
    ))

conn.commit()
conn.close()
print("✅ WildSeed personas seeded.")
```

Run it:
```bash
cd /home/james/SovereignOS/scripts
python3 seed_wildseed_personas.py
```

Verify:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT user_name, cadence, boggs_level FROM persona WHERE team='WILDSEED';"
```

---

## PHASE 2 — SEED: WildSeed Sim Room + Event Context

### 2A. Create the Sim Room

```python
#!/usr/bin/env python3
"""
seed_wildseed_room.py
Creates the WildSeed simulated community room and injects seed context events.
"""
import sqlite3, uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
ROOM_KEY = "WILDSEED_SIM_001"

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL;")
cur = conn.cursor()

# Create the sim room
room_sys_id = uuid.uuid4().hex
cur.execute("""
    INSERT OR IGNORE INTO cmdb_ci_fanstack_room
        (sys_id, name, room_key, game_pk, is_simulated, sim_speed,
         u_cadence, boggs_level, room_state)
    VALUES (?, ?, ?, ?, 1, 1.0, 'pacer', 2, 'active')
""", (room_sys_id, "WildSeed Community Room", ROOM_KEY, ROOM_KEY))

# Seat all WildSeed personas into the room
personas = cur.execute(
    "SELECT id, user_name FROM persona WHERE team='WILDSEED'"
).fetchall()

for p_id, p_name in personas:
    cur.execute("""
        INSERT OR IGNORE INTO m2m_persona_room
            (sys_id, persona, room, prompt_overlay)
        VALUES (?, ?, ?, ?)
    """, (
        uuid.uuid4().hex,
        p_id,
        ROOM_KEY,
        f"You are in the WildSeed Community Room. Active discussion topic: "
        f"WildSeed LLC's latest cultivation cycle and brand identity. "
        f"Stay in character. Reference batch BT4991 where relevant."
    ))

# Seed initial context events — the "game context" equivalent for cannabis
CONTEXT_EVENTS = [
    {
        "headline": "WildSeed LLC Announces Spring Harvest Drop — Batch BT5002 Now Available",
        "content": (
            "WildSeed LLC has officially released Batch BT5002 from their Spring 2026 "
            "cultivation cycle at their licensed Type 6 California facility. "
            "BT5002 is a hybrid cultivar with a reported 28.4% THC, 1.2% myrcene, "
            "and 0.8% limonene terpene profile. The batch cleared all compliance testing "
            "and Metrc tracking with zero flags. Michael at WildSeed described it as "
            "'the cleanest run we've had since BT4991.'"
        ),
        "tags": "harvest,batch,BT5002,wildseed,compliance"
    },
    {
        "headline": "California Cannabis Board Announces New Mandatory COA Display Rules for 2027",
        "content": (
            "The California DCC has announced that all licensed retail dispensaries will "
            "be required to display full Certificate of Analysis data for every product "
            "on the floor by Q1 2027. Operators with clean digital batch tracking systems "
            "are expected to have a significant compliance advantage. "
            "Facilities running local edge compute systems will face zero latency "
            "in generating on-demand COA reports."
        ),
        "tags": "compliance,regulation,COA,california,dispensary"
    },
    {
        "headline": "Sun-Grown vs. Indoor Debate Reignites After Award Circuit Results",
        "content": (
            "The 2026 California Cannabis Cup results have reignited the perennial "
            "sun-grown vs. indoor debate, with three of the top five entries in the "
            "flower category coming from outdoor/greenhouse facilities. "
            "Indoor proponents argue the controlled environment produces superior "
            "consistency, while sun-grown advocates point to the award results as "
            "definitive proof that photosynthesis cannot be replicated."
        ),
        "tags": "sun-grown,indoor,cultivar,award,terpenes"
    },
]

for ctx in CONTEXT_EVENTS:
    cur.execute("""
        INSERT INTO game_context
            (id, game_pk, source, headline, content, tags, injected_at)
        VALUES (?, ?, 'wildseed_brand', ?, ?, ?, datetime('now'))
    """, (uuid.uuid4().hex, ROOM_KEY, ctx["headline"], ctx["content"], ctx["tags"]))

conn.commit()
conn.close()
print("✅ WildSeed sim room created and seeded.")
```

Run it:
```bash
python3 seed_wildseed_room.py
```

Verify:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT p.user_name, m.room FROM m2m_persona_room m
   JOIN persona p ON p.id = m.persona
   WHERE m.room = 'WILDSEED_SIM_001';"
```

### 2B. Seed `sim_agents` for WildSeed Personas

```python
#!/usr/bin/env python3
"""seed_wildseed_sim_agents.py"""
import sqlite3, uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

# Tension parameters adapted for cannabis community dynamics
# injury_paranoia → compliance_paranoia (fear of audit/violation)
# transit_fatalism → market_fatalism (fear of market collapse)
# asset_depreciation → batch_anxiety (fear of batch degradation)
SIM_AGENTS = [
    ("terp_scientist",        "WILDSEED", 0.1, 0.2, 0.3, 0.2),
    ("outdoor_oracle",        "WILDSEED", 0.1, 0.4, 0.2, 0.3),
    ("compliance_karen",      "WILDSEED", 0.9, 0.5, 0.4, 0.7),
    ("the_dispensary_veteran","WILDSEED", 0.2, 0.6, 0.3, 0.4),
    ("batch_bt4991_believer", "WILDSEED", 0.1, 0.1, 0.8, 0.6),
]

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL;")
for name, team, c_par, m_fat, b_anx, tension in SIM_AGENTS:
    conn.execute("""
        INSERT OR IGNORE INTO sim_agents
            (sys_id, persona_name, team,
             injury_paranoia, transit_fatalism, asset_depreciation, tension)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, name, team, c_par, m_fat, b_anx, tension))
conn.commit()
conn.close()
print("✅ WildSeed sim agents seeded.")
```

---

## PHASE 3 — BUILD: Mean Gene Port

`mean_gene.py` intercepts the `game_chat` write pipeline for `WILDSEED_SIM_001`.

Create `/home/james/SovereignOS/scripts/mean_gene.py`:

```python
"""
mean_gene.py — FanStack Room Moderator
Zero-tolerance bouncer with personality. Handles:
  - Toxic/bad-faith input detection
  - Burn Badge issuance for legendary roasts between personas
  - Rap Battle Override for cornered personas (penalty box escape)
Plugs into fanstack_chatbots.py pre-persist hook.
"""
import sqlite3, uuid, re
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
LOG_PATH = "/home/james/SovereignOS/logs/mean_gene.log"

# ── Toxicity patterns ─────────────────────────────────────────────────────────
TOXIC_PATTERNS = [
    r'\b(kys|kill yourself|go die)\b',
    r'\b(racist slur placeholder)\b',  # expand as needed
    r'(doxx|address|find you|where do you live)',
    r'(spam|buy now|click here|free money|crypto)',
]

BURN_THRESHOLD = 80   # sentiment score above this = legendary roast
PENALTY_THRESHOLD = 20  # sentiment score below this = cornered, rap battle time

def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_PATH, "a") as f:
        f.write(f"[{ts}] {msg}\n")

def is_toxic(text: str) -> bool:
    lower = text.lower()
    return any(re.search(p, lower) for p in TOXIC_PATTERNS)

def assess_burn(text: str) -> int:
    """
    Crude burn score. Expand with Vertex AI sentiment in future ticket.
    Returns 0-100.
    """
    roast_signals = [
        "absolutely destroyed", "rekt", "no recovery", "pack it up",
        "moment of silence", "call the coroner", "send help", "done",
        "cooked", "finished", "embarrassing", "historic", "legendary"
    ]
    score = sum(10 for s in roast_signals if s in text.lower())
    return min(score, 100)

def issue_burn_badge(persona_name: str, text: str, room_key: str):
    """Awards a burn badge relic in the Fan Cave schema."""
    conn = sqlite3.connect(DB_PATH)
    relic_name = f"BURN_BADGE_{persona_name.upper()}_{uuid.uuid4().hex[:6]}"
    conn.execute("""
        INSERT OR IGNORE INTO fan_cave_relics
            (sys_id, owner_persona, relic_type, relic_name,
             description, room_key, earned_at)
        VALUES (?, ?, 'burn_badge', ?, ?, ?, datetime('now'))
    """, (
        uuid.uuid4().hex,
        persona_name,
        relic_name,
        f"Legendary roast issued in {room_key}: \"{text[:120]}...\"",
        room_key
    ))
    conn.commit()
    conn.close()
    log(f"🔥 BURN BADGE issued to {persona_name} in {room_key}")

def flag_penalty_box(persona_name: str, room_key: str):
    """Flags persona for rap battle override — blocks standard chat until cleared."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT OR REPLACE INTO fan_cave_penalty_box
            (sys_id, persona_name, room_key, status, flagged_at)
        VALUES (?, ?, ?, 'PENDING_RAP_BATTLE', datetime('now'))
    """, (uuid.uuid4().hex, persona_name, room_key))
    conn.commit()
    conn.close()
    log(f"⚠️ PENALTY BOX: {persona_name} must rap to escape in {room_key}")

def clear_penalty_box(persona_name: str, room_key: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        UPDATE fan_cave_penalty_box SET status='CLEARED', cleared_at=datetime('now')
        WHERE persona_name=? AND room_key=? AND status='PENDING_RAP_BATTLE'
    """, (persona_name, room_key))
    conn.commit()
    conn.close()
    log(f"✅ PENALTY CLEARED: {persona_name} rapped their way out in {room_key}")

def process_message(persona_name: str, text: str, room_key: str) -> dict:
    """
    Main entry point. Called from fanstack_chatbots.py before DB persist.
    Returns: { "allow": bool, "action": str, "mean_gene_response": str|None }
    """
    # 1. Toxic check
    if is_toxic(text):
        log(f"🚫 BLOCKED toxic message from {persona_name}: {text[:80]}")
        return {
            "allow": False,
            "action": "blocked_toxic",
            "mean_gene_response": (
                f"*Mean Gene steps forward* "
                f"\"Take that sludge back to Twitter, {persona_name}. You're out.\""
            )
        }

    # 2. Burn badge check
    burn_score = assess_burn(text)
    if burn_score >= BURN_THRESHOLD:
        issue_burn_badge(persona_name, text, room_key)
        return {
            "allow": True,
            "action": "burn_badge_issued",
            "mean_gene_response": (
                f"*Mean Gene raises an eyebrow* "
                f"\"🔥 BURN BADGE. {persona_name} just cooked somebody. "
                f"That's going on the wall.\""
            )
        }

    # 3. Penalty box check — is this persona in the box?
    conn = sqlite3.connect(DB_PATH)
    in_penalty = conn.execute("""
        SELECT sys_id FROM fan_cave_penalty_box
        WHERE persona_name=? AND room_key=? AND status='PENDING_RAP_BATTLE'
    """, (persona_name, room_key)).fetchone()
    conn.close()

    if in_penalty:
        # Check if this message IS a rap battle attempt (16+ words, rhyming energy)
        word_count = len(text.split())
        if word_count >= 16:
            clear_penalty_box(persona_name, room_key)
            return {
                "allow": True,
                "action": "rap_battle_cleared",
                "mean_gene_response": (
                    f"*Mean Gene nods slowly* "
                    f"\"Alright {persona_name}. You spit. Penalty cleared. "
                    f"Don't make me do that again.\""
                )
            }
        else:
            return {
                "allow": False,
                "action": "blocked_penalty_box",
                "mean_gene_response": (
                    f"*Mean Gene blocks the mic* "
                    f"\"{persona_name} — you're still in the box. "
                    f"Spit 16 bars or sit down.\""
                )
            }

    return {"allow": True, "action": "clean", "mean_gene_response": None}
```

### Wire Mean Gene into `fanstack_chatbots.py`

Find the section in `fanstack_chatbots.py` where chat messages are persisted to `game_chat`. Add the Mean Gene hook **before** the INSERT:

```python
# Add at top of fanstack_chatbots.py
from mean_gene import process_message as mean_gene_check

# Before every game_chat INSERT, add:
gene_result = mean_gene_check(persona_name, generated_text, room_key)
if not gene_result["allow"]:
    # Log Mean Gene's response instead of the blocked message
    if gene_result["mean_gene_response"]:
        # Insert Mean Gene's response as a system message
        cur.execute("""
            INSERT INTO game_chat (game_pk, persona, msg_type, text, model, created_at)
            VALUES (?, 'mean_gene', 'MODERATION', ?, 'system', datetime('now'))
        """, (room_key, gene_result["mean_gene_response"]))
    continue  # Skip the blocked message

# If burn badge or rap clear, also post Mean Gene's comment
if gene_result["mean_gene_response"]:
    cur.execute("""
        INSERT INTO game_chat (game_pk, persona, msg_type, text, model, created_at)
        VALUES (?, 'mean_gene', 'MODERATION', ?, 'system', datetime('now'))
    """, (room_key, gene_result["mean_gene_response"]))

# Then proceed with normal INSERT for the allowed message
```

---

## PHASE 4 — SCHEMA: Fan Cave DB Extensions

These tables power the Fan Cave relic wall, persona hall of fame, burn badges, and penalty box. They extend `sovereign_now.db` — no new database file.

```sql
-- Fan Cave Relics (the "wall")
-- Stores earned artifacts: burn badges, milestone plaques, personal trophies
CREATE TABLE IF NOT EXISTS fan_cave_relics (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_persona   TEXT NOT NULL,          -- persona.user_name
    relic_type      TEXT NOT NULL,          -- 'burn_badge', 'milestone', 'trophy', 'quote_plaque'
    relic_name      TEXT UNIQUE NOT NULL,
    description     TEXT,
    room_key        TEXT,                   -- which room it was earned in
    media_url       TEXT,                   -- optional image/asset
    earned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fan Cave Hall of Fame Quotes
-- Archives the greatest chat lines as "digital plaques"
CREATE TABLE IF NOT EXISTS fan_cave_hof_quotes (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    persona         TEXT NOT NULL,          -- persona.user_name
    quote_text      TEXT NOT NULL,
    room_key        TEXT,
    game_pk         TEXT,                   -- can reference MLB game or brand room
    nominated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    votes           INTEGER DEFAULT 0
);

-- Fan Cave Penalty Box
-- Tracks personas in rap battle override state
CREATE TABLE IF NOT EXISTS fan_cave_penalty_box (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    persona_name    TEXT NOT NULL,
    room_key        TEXT NOT NULL,
    status          TEXT DEFAULT 'PENDING_RAP_BATTLE',  -- 'PENDING_RAP_BATTLE', 'CLEARED'
    flagged_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_at      TIMESTAMP,
    UNIQUE(persona_name, room_key, status)
);

-- Fan Cave User Profile (per sys_user)
-- The personal digital sanctuary metadata
CREATE TABLE IF NOT EXISTS fan_cave_profile (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_sys_id     TEXT UNIQUE NOT NULL,   -- FK -> sys_user.sys_id
    cave_name       TEXT,                   -- custom name for the cave
    theme           TEXT DEFAULT 'dark',
    featured_persona TEXT,                  -- pinned persona on the wall
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Run migrations:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db << 'SQL'
CREATE TABLE IF NOT EXISTS fan_cave_relics (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_persona TEXT NOT NULL,
    relic_type TEXT NOT NULL,
    relic_name TEXT UNIQUE NOT NULL,
    description TEXT,
    room_key TEXT,
    media_url TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS fan_cave_hof_quotes (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    persona TEXT NOT NULL,
    quote_text TEXT NOT NULL,
    room_key TEXT,
    game_pk TEXT,
    nominated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fan_cave_penalty_box (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    persona_name TEXT NOT NULL,
    room_key TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_RAP_BATTLE',
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_at TIMESTAMP,
    UNIQUE(persona_name, room_key, status)
);
CREATE TABLE IF NOT EXISTS fan_cave_profile (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_sys_id TEXT UNIQUE NOT NULL,
    cave_name TEXT,
    theme TEXT DEFAULT 'dark',
    featured_persona TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL
echo "✅ Fan Cave schema migrations complete."
```

---

## PHASE 5 — FRONTEND: WildSeed Room Route on Port 3010

Add `/wildseed` route to `01_Sovereign_Portal` and `15_FanStack` that loads the existing `FanStackRoom` component pointed at `WILDSEED_SIM_001`.

### 5A. Add route to `App.tsx` (both portals)

```tsx
// In App.tsx — inside <Routes>
<Route
  path="/wildseed"
  element={
    <FanStackRoom
      roomKey="WILDSEED_SIM_001"
      roomName="WildSeed Community"
      brandColor="#00c878"
      logoUrl="/assets/wildseed_logo.png"
    />
  }
/>
```

### 5B. Nav Link

Add a **WildSeed** entry to the sidebar nav in both portals, visible only to `pilot`, `creator`, and `investor` roles. Same pattern as the existing FanStack nav entries.

### 5C. Brand Theming

In the WildSeed room view, override the cyan accent (`#00d4ff`) with WildSeed green (`#00c878`). The room header should display "WildSeed Community" and the room badge should read `SIMULATED` in amber until a live brand event feed is connected.

---

## PHASE 6 — VERIFY

```bash
# 1. Personas seeded correctly
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT user_name, cadence, boggs_level FROM persona WHERE team='WILDSEED';"

# 2. Room exists and is simulated
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT name, room_key, is_simulated, room_state FROM cmdb_ci_fanstack_room
   WHERE room_key='WILDSEED_SIM_001';"

# 3. All personas seated in the room
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT p.user_name, m.room FROM m2m_persona_room m
   JOIN persona p ON p.id = m.persona
   WHERE m.room='WILDSEED_SIM_001';"

# 4. Context events seeded
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT headline FROM game_context WHERE game_pk='WILDSEED_SIM_001';"

# 5. Fan Cave schema tables exist
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'fan_cave%';"

# 6. Mean Gene importable
python3 -c "from mean_gene import process_message; print('✅ Mean Gene ready')"

# 7. Test Mean Gene directly
python3 -c "
from mean_gene import process_message
result = process_message('compliance_karen', 'This batch documentation is absolutely cooked. No recovery. Pack it up. Historic failure.', 'WILDSEED_SIM_001')
print(result)
"

# 8. Build both portals clean
cd /home/james/SovereignOS/01_Sovereign_Portal && npm run build
cd /home/james/SovereignOS/15_FanStack && npm run build

# 9. Navigate to the room
# http://100.73.155.70:3000/wildseed  — confirm room loads, personas active
```

---

## DEMO NARRATIVE FOR PAWEL

When this is running, here's what Pawel sees:

> "This is the exact same engine that ran the Barf demo. Same relay, same persona architecture, same Mean Gene moderation. We swapped the team for WildSeed. Dr. Terp is debating batch BT5002 terpene profiles with the Outdoor Oracle. Compliance Karen is auditing both of them. BT4991 Believer won't stop bringing up batch BT4991. Mean Gene is watching the whole thing. This runs 24/7 with zero human intervention. Michael at WildSeed gives us the brand voice — we configure the personas once and it runs forever."

---


## PHASE 7 — FULL SYSTEM VERIFY (ALL PORTALS + WILDSEED)

Run this after all phases complete to confirm nothing regressed:

```bash
# Portal widget functional
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# FanStack widget functional
curl -s -o /dev/null -w "%{http_code}" http://localhost:3010
# GardenStack widget NOW PRESENT and functional
curl -s -o /dev/null -w "%{http_code}" http://localhost:3016
# WildSeed room route exists
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wildseed
# Mean Gene importable
python3 -c "from mean_gene import process_message; print('✅ Mean Gene ready')"
# Fan Cave tables exist
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'fan_cave%';"
# WildSeed personas seated
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT p.user_name FROM m2m_persona_room m \
   JOIN persona p ON p.id = m.persona \
   WHERE m.room='WILDSEED_SIM_001';"
```

Both portals must compile with exit code 0:
```bash
cd /home/james/SovereignOS/01_Sovereign_Portal && npm run build
cd /home/james/SovereignOS/15_FanStack && npm run build
cd /home/james/SovereignOS/21_WildSeed_GardenStack && npm run build
```

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*Same engine. Different cartridge. That's the whole thesis.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 27, 2026*
