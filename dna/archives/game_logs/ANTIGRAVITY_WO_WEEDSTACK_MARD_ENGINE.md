# ANTIGRAVITY WORK ORDER
## Mission: WeedStack M.A.R.D Engine — Content Source Matrix, Faction System & POC Room
**Date:** May 27, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟠 P2 — Proof of Concept (Independent of WildSeed partnership)
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** Build the WeedStack M.A.R.D engine as a standalone proof of concept. This is not a WildSeed feature — this is a demonstration that the Sovereign OS cartridge architecture can take any brand online using the same infrastructure that runs FanStack. The differentiator is the Content Source Matrix: a configurable, toggleable set of real-world data feeds that drive persona reactions. Wire it, point it at WeedStack, and let it run.

---

## THE THESIS

FanStack personas react to Statcast data.
Catnip Wars personas react to camera feeds and GPS events.
WeedStack personas react to the cannabis world.

The mechanism is identical. The data source is the cartridge.

**The Content Source Matrix is the product.**
Not the personas. Not the room. The ability to toggle what the room
is listening to — and watch the content change in real time.

---

## PERSONA DESIGN PHILOSOPHY

> Reference: `shohei_ghost` — the gold standard.
> Governance rules that ARE the character.
> Delusion as a feature, not a bug.
> Internal consistency over pure absurdity.
> Sometimes the bit is crazy. Sometimes it's surgical.
> The best personas are both, depending on what the room feeds them.

The WeedStack cast (Dr. Terp, Terp Truther, Couch Lock Carl, Dispensary Gary,
420 Linda, Old Growth Pete, Dab Lab Derek, Compliance Karen, BT4991 Believer)
were designed with this in mind. Each has governance rules that ARE their
character. The Terp Truther's conspiracy is load-bearing. Carl's silence
is load-bearing. Treat them the way Shohei Ghost's denial protocol is treated —
never break character, never wink at the camera.

---

## PHASE 1 — DATABASE: Content Source Matrix Schema

```sql
-- The configurable data feed registry
-- Each row is a toggleable real-world data source
CREATE TABLE IF NOT EXISTS ws_content_source (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_key      TEXT UNIQUE NOT NULL,
    -- 'batch_drop' | 'cannabis_news' | 'coa_result' | 'reddit' |
    -- 'competitor_drop' | 'pricing_feed' | 'harvest_report' | 'custom'
    display_name    TEXT NOT NULL,
    description     TEXT,
    room_key        TEXT NOT NULL,       -- which room this source feeds
    enabled         INTEGER DEFAULT 0,   -- THE TOGGLE. 0=off, 1=on
    feed_url        TEXT,                -- RSS/API endpoint if applicable
    poll_interval_s INTEGER DEFAULT 300, -- how often to check (seconds)
    last_polled     TIMESTAMP,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The event queue — real-world events waiting to be injected
CREATE TABLE IF NOT EXISTS ws_content_event (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_key      TEXT NOT NULL,       -- FK -> ws_content_source.source_key
    room_key        TEXT NOT NULL,
    headline        TEXT NOT NULL,
    content         TEXT NOT NULL,
    tags            TEXT,
    injected        INTEGER DEFAULT 0,   -- 0=queued, 1=injected into room
    injected_at     TIMESTAMP,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faction registry — persistent alliances and rivalries between personas
CREATE TABLE IF NOT EXISTS ws_faction (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    faction_name    TEXT NOT NULL,
    faction_type    TEXT NOT NULL,       -- 'alliance' | 'rivalry' | 'neutral'
    room_key        TEXT NOT NULL,
    description     TEXT,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Persona faction membership
CREATE TABLE IF NOT EXISTS ws_faction_member (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    faction_id      TEXT NOT NULL,       -- FK -> ws_faction.sys_id
    persona_name    TEXT NOT NULL,       -- FK -> persona.user_name
    role            TEXT DEFAULT 'member', -- 'leader' | 'member' | 'reluctant'
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faction_id, persona_name)
);
```

Run migrations:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db << 'SQL'
CREATE TABLE IF NOT EXISTS ws_content_source (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_key TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    room_key TEXT NOT NULL,
    enabled INTEGER DEFAULT 0,
    feed_url TEXT,
    poll_interval_s INTEGER DEFAULT 300,
    last_polled TIMESTAMP,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_content_event (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_key TEXT NOT NULL,
    room_key TEXT NOT NULL,
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    injected INTEGER DEFAULT 0,
    injected_at TIMESTAMP,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_faction (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    faction_name TEXT NOT NULL,
    faction_type TEXT NOT NULL,
    room_key TEXT NOT NULL,
    description TEXT,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_faction_member (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    faction_id TEXT NOT NULL,
    persona_name TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faction_id, persona_name)
);
SQL
echo "✅ WeedStack M.A.R.D schema migrated."
```

---

## PHASE 2 — SEED: Content Sources, Factions & Initial Events

```python
#!/usr/bin/env python3
"""
seed_weedstack_mard.py
Seeds content sources, factions, and initial events for WEEDSTACK_SIM_001.
"""
import sqlite3, uuid

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
ROOM_KEY = "WEEDSTACK_SIM_001"

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL;")
cur = conn.cursor()

# ── Content Sources ───────────────────────────────────────────────────────────
# THE TOGGLES. Default: batch_drop and cannabis_news ON. Everything else OFF.
SOURCES = [
    ("batch_drop",      "Batch Drop Events",
     "New WildSeed/cannabis batch releases and harvest announcements",
     1, None, 0),
    ("cannabis_news",   "Cannabis Industry News",
     "Regulatory changes, award results, market news, DCC updates",
     1, "https://cannabisindustryjournal.com/feed/", 3600),
    ("coa_result",      "COA Lab Results",
     "Certificate of Analysis pass/fail events from connected labs",
     1, None, 0),
    ("reddit",          "Reddit Cannabis Communities",
     "r/weed, r/trees, r/cannabis — organic community post triggers",
     0, None, 1800),
    ("competitor_drop", "Competitor Brand Drops",
     "New product releases from competing California manufacturers",
     0, None, 7200),
    ("pricing_feed",    "Dispensary Pricing Feed",
     "Real-time price changes at partner dispensaries",
     0, None, 3600),
    ("harvest_report",  "Harvest & Weather Reports",
     "California agricultural reports — sun-grown seasonal events",
     0, None, 86400),
]

for key, name, desc, enabled, url, interval in SOURCES:
    cur.execute("""
        INSERT OR IGNORE INTO ws_content_source
            (sys_id, source_key, display_name, description,
             room_key, enabled, feed_url, poll_interval_s)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, key, name, desc, ROOM_KEY, enabled, url, interval))

# ── Factions ──────────────────────────────────────────────────────────────────
# The barter society. Alliances and rivalries that shape how personas
# react to each other's content — not just to external events.
FACTIONS = [
    ("The Science Bloc",    "alliance",
     "Data-driven, evidence-based. United by a belief in measurable truth. "
     "Will trade: COA data, terpene analysis, lab methodology."),

    ("The Compliance Axis", "alliance",
     "Karen and Pete's uneasy alliance. Different reasons, same outcome: "
     "the rules exist for a reason and shortcuts get licenses revoked. "
     "Will trade: regulatory intel, audit prep, chain of custody docs."),

    ("The True Believers",  "alliance",
     "Gary, Linda, and BT4991 Believer. Pure enthusiasm, zero cynicism. "
     "United by love of the product regardless of science or compliance. "
     "Will trade: hype, testimonials, drop event coordination."),

    ("The Shadow Bloc",     "rivalry",
     "Terp Truther vs Dr. Terp. Permanent, irreconcilable war. "
     "Every event is viewed through opposite lenses. "
     "Will NOT trade. Will argue. Indefinitely."),

    ("The Old Guard",       "rivalry",
     "Pete vs Derek. Sun-grown vs concentrates. "
     "Philosophical disagreement about what cannabis fundamentally is. "
     "Respectful but immovable. Will trade: history and technique, "
     "but never concede the core argument."),
]

faction_ids = {}
for name, ftype, desc in FACTIONS:
    fid = uuid.uuid4().hex
    faction_ids[name] = fid
    cur.execute("""
        INSERT OR IGNORE INTO ws_faction
            (sys_id, faction_name, faction_type, room_key, description)
        VALUES (?, ?, ?, ?, ?)
    """, (fid, name, ftype, ROOM_KEY, desc))

# ── Faction Membership ────────────────────────────────────────────────────────
MEMBERS = [
    ("The Science Bloc",    "dr_terp",              "leader"),
    ("The Science Bloc",    "terp_truther",         "reluctant"),  # he knows the science, he just doesn't trust it
    ("The Compliance Axis", "compliance_karen",     "leader"),
    ("The Compliance Axis", "old_growth_pete",      "member"),
    ("The True Believers",  "bt4991_believer",      "leader"),
    ("The True Believers",  "dispensary_gary",      "member"),
    ("The True Believers",  "420_linda",            "member"),
    ("The Shadow Bloc",     "terp_truther",         "leader"),
    ("The Shadow Bloc",     "dr_terp",              "member"),
    ("The Old Guard",       "old_growth_pete",      "leader"),
    ("The Old Guard",       "dab_lab_derek",        "member"),
    # Carl belongs to no faction. Carl is Carl.
    # Derek is in The Old Guard but also loosely aligned with Science Bloc.
    ("The Science Bloc",    "dab_lab_derek",        "member"),
]

for fname, pname, role in MEMBERS:
    cur.execute("""
        INSERT OR IGNORE INTO ws_faction_member
            (sys_id, faction_id, persona_name, role)
        VALUES (?, ?, ?, ?)
    """, (uuid.uuid4().hex, faction_ids[fname], pname, role))

# ── Seed Initial Content Events ───────────────────────────────────────────────
# These fire immediately when the room starts — so the room isn't cold on load
SEED_EVENTS = [
    ("batch_drop",
     "BT5002 Spring 2026 Harvest Drop — Now Available at Select Dispensaries",
     "WildSeed LLC has officially released Batch BT5002 from their Spring 2026 "
     "cultivation cycle. Reported profile: 28.4% THC, 1.2% myrcene, 0.8% limonene. "
     "Michael at WildSeed: 'cleanest run since BT4991.' Limited units. "
     "COA cleared all panels. Metrc chain of custody: zero flags.",
     "batch,BT5002,wildseed,drop,spring2026"),

    ("cannabis_news",
     "California DCC Announces Mandatory Lab Testing Expansion for Type 6 Manufacturers",
     "The California Department of Cannabis Control has announced that all Type 6 "
     "licensed manufacturers will be required to submit to expanded heavy metals "
     "and residual solvent panels starting Q3 2026. Facilities with existing "
     "digital COA tracking infrastructure are expected to face minimal disruption. "
     "Operators still using manual Metrc entry are being advised to upgrade immediately.",
     "compliance,DCC,regulation,Type6,COA,california"),

    ("cannabis_news",
     "2026 Emerald Cup Results: Sun-Grown Dominates Flower Category Again",
     "For the third consecutive year, sun-grown outdoor and greenhouse entries "
     "took four of the top five spots in the Emerald Cup flower category. "
     "Indoor cultivators dispute the judging methodology, arguing that "
     "consistency and cannabinoid precision favor controlled environments. "
     "The debate has reignited across industry forums.",
     "emeraldcup,award,sungrown,indoor,terpenes,debate"),
]

for source_key, headline, content, tags in SEED_EVENTS:
    cur.execute("""
        INSERT OR IGNORE INTO ws_content_event
            (sys_id, source_key, room_key, headline, content, tags, injected)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (uuid.uuid4().hex, source_key, ROOM_KEY, headline, content, tags))

conn.commit()
conn.close()
print("✅ WeedStack M.A.R.D engine seeded.")
print("   Content sources: 7 (2 enabled, 5 standing by)")
print("   Factions: 5")
print("   Seed events: 3 queued")
print("   Carl: unaffiliated. As intended.")
```

Run it:
```bash
cd /home/james/SovereignOS/scripts
python3 seed_weedstack_mard.py
```

---

## PHASE 3 — BACKEND: Content Source Engine

Create `/home/james/SovereignOS/scripts/weedstack_content_poller.py`

This is the WeedStack equivalent of the FanStack Statcast poller.
It runs as a daemon, checks enabled sources on their poll intervals,
and queues events into `ws_content_event`.

```python
#!/usr/bin/env python3
"""
weedstack_content_poller.py
Polls enabled content sources for WEEDSTACK_SIM_001 and queues events.
Runs as a background daemon alongside fanstack_relay.py.
"""
import sqlite3, uuid, time, feedparser, logging
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
LOG_PATH = "/home/james/SovereignOS/logs/weedstack_poller.log"
ROOM_KEY = "WEEDSTACK_SIM_001"

logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s"
)

def get_enabled_sources() -> list:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT * FROM ws_content_source
        WHERE room_key = ? AND enabled = 1
    """, (ROOM_KEY,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def already_queued(headline: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT sys_id FROM ws_content_event WHERE headline = ?", (headline,)
    ).fetchone()
    conn.close()
    return row is not None

def queue_event(source_key: str, headline: str, content: str, tags: str = ""):
    if already_queued(headline):
        return
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO ws_content_event
            (sys_id, source_key, room_key, headline, content, tags)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, source_key, ROOM_KEY, headline, content, tags))
    conn.commit()
    conn.close()
    logging.info(f"Queued event [{source_key}]: {headline[:80]}")

def poll_rss_source(source: dict):
    if not source.get("feed_url"):
        return
    try:
        feed = feedparser.parse(source["feed_url"])
        for entry in feed.entries[:5]:  # top 5 only
            headline = entry.get("title", "")
            content = entry.get("summary", entry.get("description", ""))
            tags = source["source_key"]
            queue_event(source["source_key"], headline, content, tags)
    except Exception as e:
        logging.error(f"RSS poll failed for {source['source_key']}: {e}")

def update_last_polled(source_key: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE ws_content_source SET last_polled = datetime('now') WHERE source_key = ?",
        (source_key,)
    )
    conn.commit()
    conn.close()

def should_poll(source: dict) -> bool:
    if not source.get("last_polled"):
        return True
    last = datetime.fromisoformat(source["last_polled"])
    elapsed = (datetime.utcnow() - last).total_seconds()
    return elapsed >= source.get("poll_interval_s", 300)

def run():
    logging.info("WeedStack Content Poller started.")
    while True:
        sources = get_enabled_sources()
        for source in sources:
            if should_poll(source):
                logging.info(f"Polling: {source['source_key']}")
                if source.get("feed_url"):
                    poll_rss_source(source)
                update_last_polled(source["source_key"])
        time.sleep(60)  # check every minute

if __name__ == "__main__":
    run()
```

Start it:
```bash
cd /home/james/SovereignOS
nohup .venv/bin/python3 scripts/weedstack_content_poller.py \
  >> logs/weedstack_poller.log 2>&1 &
echo "✅ WeedStack poller running"
```

---

## PHASE 4 — BACKEND: Event Injector into fanstack_chatbots.py

Modify `fanstack_chatbots.py` to check `ws_content_event` for uninjected
events when the room is `WEEDSTACK_SIM_001`, and inject them as
`game_context` entries before the next persona generation cycle.

Add this function to `fanstack_chatbots.py`:

```python
def inject_weedstack_events(room_key: str):
    """
    Pulls uninjected ws_content_events and writes them into game_context
    so the persona generation loop picks them up as live triggers.
    Same pattern as Statcast injection for FanStack.
    """
    if room_key != "WEEDSTACK_SIM_001":
        return

    conn = sqlite3.connect(DB_PATH)
    events = conn.execute("""
        SELECT * FROM ws_content_event
        WHERE room_key = ? AND injected = 0
        ORDER BY sys_created_on ASC
        LIMIT 3
    """, (room_key,)).fetchall()

    for event in events:
        # Write to game_context — same table FanStack uses
        conn.execute("""
            INSERT INTO game_context
                (id, game_pk, source, headline, content, tags, injected_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            str(uuid.uuid4()),
            room_key,
            event["source_key"],
            event["headline"],
            event["content"],
            event["tags"]
        ))
        # Mark as injected
        conn.execute(
            "UPDATE ws_content_event SET injected=1, injected_at=datetime('now') WHERE sys_id=?",
            (event["sys_id"],)
        )

    conn.commit()
    conn.close()
```

Call `inject_weedstack_events(room_key)` at the top of the persona
generation loop in `fanstack_chatbots.py`, just before personas
are prompted — same position as the Statcast data pull.

---

## PHASE 5 — BACKEND: Content Source Matrix API

Add to `sovereign_core_api.py`:

```python
# Get all content sources for a room (Pilot sees all, others see their team's)
@app.get("/api/weedstack/sources")
async def ws_sources(user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM ws_content_source WHERE room_key='WEEDSTACK_SIM_001' ORDER BY enabled DESC, source_key"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# Toggle a source on or off — Pilot only
@app.post("/api/weedstack/sources/{source_key}/toggle",
          dependencies=[Depends(require_role("pilot", "creator"))])
async def toggle_source(source_key: str, body: dict):
    enabled = 1 if body.get("enabled") else 0
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE ws_content_source SET enabled=? WHERE source_key=?",
        (enabled, source_key)
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "source_key": source_key, "enabled": bool(enabled)}

# Manual event injection — Pilot fires a custom event into the room
@app.post("/api/weedstack/inject",
          dependencies=[Depends(require_role("pilot"))])
async def manual_inject(body: dict):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO ws_content_event
            (sys_id, source_key, room_key, headline, content, tags)
        VALUES (?, 'custom', 'WEEDSTACK_SIM_001', ?, ?, ?)
    """, (uuid.uuid4().hex, body["headline"], body["content"], body.get("tags", "")))
    conn.commit()
    conn.close()
    return {"status": "queued", "headline": body["headline"]}

# Get factions
@app.get("/api/weedstack/factions")
async def ws_factions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    factions = conn.execute(
        "SELECT * FROM ws_faction WHERE room_key='WEEDSTACK_SIM_001'"
    ).fetchall()
    members = conn.execute("""
        SELECT m.faction_id, m.persona_name, m.role, p.display_name, p.color
        FROM ws_faction_member m
        JOIN persona p ON p.user_name = m.persona_name
    """).fetchall()
    conn.close()
    return {
        "factions": [dict(f) for f in factions],
        "members": [dict(m) for m in members]
    }
```

---

## PHASE 6 — FRONTEND: Content Source Matrix UI

Add a **"Sources"** tab to the WeedStack room view. This is the toggle panel.

```tsx
// ContentSourceMatrix.tsx
// Fetches /api/weedstack/sources
// Renders one toggle card per source:
//   - Display name
//   - Description
//   - ON/OFF pill toggle → POST /api/weedstack/sources/{key}/toggle
//   - Last polled timestamp
//   - "Fire Now" button → POST /api/weedstack/inject (Pilot only, custom event)
//
// Color coding:
//   enabled=1  → green border, "LIVE" badge
//   enabled=0  → dark border, "STANDBY" badge
//
// Faction panel below the sources:
//   Fetches /api/weedstack/factions
//   Renders faction cards with member avatars and alliance/rivalry type badge
```

The Sources tab lives in the WeedStack room alongside the chat feed.
Pilot can toggle sources live while the room is running and watch the
persona content shift in real time.

**That is the demo.** Toggle cannabis news ON. Watch Dr. Terp and the
Terp Truther immediately start arguing about the Emerald Cup results.
Toggle it OFF. The room goes back to organic persona banter.
Toggle batch_drop ON. BT5002 drop fires. BT4991 Believer loses their mind.

---

## PHASE 7 — ADD TO MANDO WATCHDOG

Add `weedstack_content_poller.py` to the Mando watchdog daemon list
so it auto-restarts if it crashes:

```python
# In mando_watchdog.py — service registry
{
    "name": "WeedStack Content Poller",
    "script": "scripts/weedstack_content_poller.py",
    "check_port": None,  # no port — process check only
    "log": "logs/weedstack_poller.log"
},
```

---

## VERIFY

```bash
# 1. Schema exists
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ws_content%' OR name LIKE 'ws_faction%';"

# 2. Sources seeded — 2 enabled
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT source_key, enabled FROM ws_content_source WHERE room_key='WEEDSTACK_SIM_001';"

# 3. Factions seeded
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT f.faction_name, f.faction_type, m.persona_name, m.role
   FROM ws_faction f JOIN ws_faction_member m ON m.faction_id = f.sys_id
   ORDER BY f.faction_name, m.role;"

# 4. Seed events queued
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT source_key, headline, injected FROM ws_content_event WHERE room_key='WEEDSTACK_SIM_001';"

# 5. Poller running
ps aux | grep weedstack_content_poller
# Expected: process visible

# 6. Toggle API works
curl -s -X POST \
  -H "Authorization: Bearer <pilot_token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' \
  http://localhost:8090/api/weedstack/sources/reddit/toggle | python3 -m json.tool
# Expected: {"status": "ok", "source_key": "reddit", "enabled": true}

# 7. Manual injection works
curl -s -X POST \
  -H "Authorization: Bearer <pilot_token>" \
  -H "Content-Type: application/json" \
  -d '{"headline": "BT5002 selling out at dispensaries statewide", "content": "Reports from multiple California dispensaries indicate WildSeed batch BT5002 is moving faster than any batch since BT4991.", "tags": "batch,BT5002,sellout"}' \
  http://localhost:8090/api/weedstack/inject
# Expected: {"status": "queued", "headline": "BT5002 selling out..."}

# 8. Open WeedStack room — confirm personas reacting to seeded events
# http://100.73.155.70:3000/weedstack
# Confirm Sources tab visible, 2 sources LIVE, 5 STANDBY
# Toggle reddit ON — confirm source goes LIVE
# Toggle reddit OFF — confirm source goes STANDBY
```

---

## THE DEMO NARRATIVE

> "Watch this. Right now the room is running on two live sources —
> batch drop events and cannabis industry news.
> Dr. Terp and the Terp Truther are already arguing about the Emerald Cup.
> Compliance Karen just flagged the new DCC testing expansion.
> BT4991 Believer is losing their mind about BT5002.
>
> Now I'm going to turn on the Reddit feed."
>
> *[toggle]*
>
> "Now the room is also listening to r/trees and r/cannabis.
> When real users post something, our personas react to it.
>
> Now I turn it off. The room goes back to brand-controlled content.
>
> That toggle — that's the product.
> You decide what your brand is listening to.
> You decide what it's reacting to.
> You decide when to amplify and when to go quiet.
>
> Same engine that runs the baseball room.
> Different cartridge."

---

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*If you wire it, they will post.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 27, 2026*
