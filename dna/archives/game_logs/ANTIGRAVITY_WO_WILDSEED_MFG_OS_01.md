# ANTIGRAVITY WORK ORDER
## Mission: WildSeed Manufacturing OS — Complete GardenStack Restack
**Date:** May 27, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟠 P2 — Investor Demo Asset (Pawel / WildSeed LLC)
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** Tear down the current GardenStack cultivation dashboard and rebuild `21_WildSeed_GardenStack` as a Type 6 Cannabis Manufacturing Operations console. WildSeed LLC is a manufacturer, not a grower. The entire data model, nav structure, and UI content must reflect manufacturing operations.

---

## WHAT THIS IS NOT

This is not a grow monitor. There are no zones, no plant counts, no nitrogen
feeds, no spatial telemetry maps, no HVAC loops. All of that is cultivation.
WildSeed receives biomass and turns it into finished products. That is
manufacturing. Build for that operator.

---

## WHAT GETS DEMOLISHED

Remove or hide the following from `21_WildSeed_GardenStack` entirely:

- The Operations tab with zone cards, nitrogen feed, spatial telemetry map,
  hardware status panel, and grow cycle rings
- The Strains / Seed Bank nav item and all associated components
- The Promoter Engine nav item and all associated components
  (the "Botanical Advocate Bot Farm" and "Automated Marketing Sweep Feed")
- The "Module Under Construction" placeholder card
- Any component referencing plant counts, zones, HVAC, lighting arrays,
  water pumps, or cultivation telemetry

Keep: the visual design system (dark glassmorphic panels, status rings,
color palette, GlobalSystemBar, PROD ENVIRONMENT banner, system status footer).

---

## NEW NAVIGATION STRUCTURE

Five nav items. That's it.

| Nav Item | Icon | Purpose |
|---|---|---|
| **Dashboard** | Grid | KPI overview — batches in flight, units pending release, compliance flags |
| **Production** | Flask | Active batch runs — input in, output out, batch lifecycle |
| **Compliance** | Shield | Metrc tags, COA status, DCC audit log, chain of custody |
| **Products** | Package | SKU catalog, finished goods inventory, units by status |
| **Lab Results** | Microscope | COA viewer per batch, pass/fail, cannabinoid panels |

Settings moves to a gear icon in the GlobalSystemBar header — not a nav item.

---

## DATABASE SCHEMA

Add these tables to `sovereign_now.db`. All prefixed `ws_` to namespace
cleanly away from FanStack and core tables.

```sql
-- Manufacturing batch runs
-- A batch = one production run: input material in, finished product out
CREATE TABLE IF NOT EXISTS ws_batch (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number    TEXT UNIQUE NOT NULL,     -- e.g. BT5002
    metrc_tag       TEXT,                     -- CA DCC Metrc UID
    status          TEXT DEFAULT 'IN_PROCESS',
    -- IN_PROCESS | TESTING | RELEASED | DESTROYED | RECALLED
    input_material  TEXT,                     -- biomass strain/source description
    input_weight_g  REAL,                     -- grams received
    output_units    INTEGER DEFAULT 0,        -- finished units produced
    output_sku      TEXT,                     -- FK -> ws_product.sku
    batch_date      TEXT,                     -- production date
    notes           TEXT,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product SKU catalog
CREATE TABLE IF NOT EXISTS ws_product (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sku             TEXT UNIQUE NOT NULL,     -- e.g. WS-GUM-25MG-10CT
    name            TEXT NOT NULL,           -- e.g. "25mg THC Gummies 10-count"
    category        TEXT NOT NULL,           -- gummy | tincture | concentrate | topical | capsule
    thc_mg_per_unit REAL,
    cbd_mg_per_unit REAL,
    units_per_pack  INTEGER DEFAULT 1,
    active          INTEGER DEFAULT 1,
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Finished goods inventory
CREATE TABLE IF NOT EXISTS ws_inventory (
    sys_id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sku                 TEXT NOT NULL,        -- FK -> ws_product.sku
    batch_number        TEXT NOT NULL,        -- FK -> ws_batch.batch_number
    units_on_hand       INTEGER DEFAULT 0,
    units_pending_lab   INTEGER DEFAULT 0,   -- awaiting COA release
    units_shipped       INTEGER DEFAULT 0,
    units_destroyed     INTEGER DEFAULT 0,
    last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COA (Certificate of Analysis) records
CREATE TABLE IF NOT EXISTS ws_coa (
    sys_id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number        TEXT NOT NULL,        -- FK -> ws_batch.batch_number
    lab_name            TEXT,
    sample_date         TEXT,
    result_date         TEXT,
    status              TEXT DEFAULT 'PENDING',  -- PENDING | PASS | FAIL
    thc_pct             REAL,
    cbd_pct             REAL,
    total_cannabinoids  REAL,
    pesticides          TEXT DEFAULT 'PASS',
    residual_solvents   TEXT DEFAULT 'PASS',
    heavy_metals        TEXT DEFAULT 'PASS',
    microbials          TEXT DEFAULT 'PASS',
    coa_file_url        TEXT,                 -- path to PDF
    notes               TEXT,
    sys_created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance event log
CREATE TABLE IF NOT EXISTS ws_compliance_log (
    sys_id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number    TEXT,
    event_type      TEXT NOT NULL,
    -- METRC_TAG_ASSIGNED | COA_UPLOADED | COA_PASSED | COA_FAILED |
    -- BATCH_RELEASED | BATCH_DESTROYED | AUDIT_NOTE | PACKAGING_CONFIRMED
    description     TEXT,
    operator        TEXT,                     -- who performed the action
    sys_created_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Run migrations:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db << 'SQL'
CREATE TABLE IF NOT EXISTS ws_batch (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number TEXT UNIQUE NOT NULL,
    metrc_tag TEXT,
    status TEXT DEFAULT 'IN_PROCESS',
    input_material TEXT,
    input_weight_g REAL,
    output_units INTEGER DEFAULT 0,
    output_sku TEXT,
    batch_date TEXT,
    notes TEXT,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_product (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    thc_mg_per_unit REAL,
    cbd_mg_per_unit REAL,
    units_per_pack INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_inventory (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sku TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    units_on_hand INTEGER DEFAULT 0,
    units_pending_lab INTEGER DEFAULT 0,
    units_shipped INTEGER DEFAULT 0,
    units_destroyed INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_coa (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number TEXT NOT NULL,
    lab_name TEXT,
    sample_date TEXT,
    result_date TEXT,
    status TEXT DEFAULT 'PENDING',
    thc_pct REAL,
    cbd_pct REAL,
    total_cannabinoids REAL,
    pesticides TEXT DEFAULT 'PASS',
    residual_solvents TEXT DEFAULT 'PASS',
    heavy_metals TEXT DEFAULT 'PASS',
    microbials TEXT DEFAULT 'PASS',
    coa_file_url TEXT,
    notes TEXT,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ws_compliance_log (
    sys_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_number TEXT,
    event_type TEXT NOT NULL,
    description TEXT,
    operator TEXT,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL
echo "✅ WildSeed Manufacturing schema migrated."
```

---

## SEED DATA

Seed realistic WildSeed demo data so the site looks operational on first load.

```python
#!/usr/bin/env python3
"""seed_wildseed_mfg.py — Seeds demo manufacturing data for WildSeed LLC"""
import sqlite3, uuid
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL;")
cur = conn.cursor()

# Products
PRODUCTS = [
    ("WS-GUM-25MG-10CT", "25mg THC Gummies (10-count)", "gummy", 25.0, 0.0, 10),
    ("WS-GUM-10MG-20CT", "10mg THC Gummies (20-count)", "gummy", 10.0, 0.0, 20),
    ("WS-GUM-11-10CT",   "1:1 THC/CBD Gummies (10-count)", "gummy", 10.0, 10.0, 10),
    ("WS-TINC-500MG",    "500mg THC Tincture (1oz)", "tincture", 500.0, 0.0, 1),
    ("WS-TINC-11-500MG", "1:1 Tincture 500mg (1oz)", "tincture", 250.0, 250.0, 1),
    ("WS-CONC-LR-1G",    "Live Resin Concentrate (1g)", "concentrate", 850.0, 0.0, 1),
]
for sku, name, cat, thc, cbd, upc in PRODUCTS:
    cur.execute("""
        INSERT OR IGNORE INTO ws_product
            (sys_id, sku, name, category, thc_mg_per_unit, cbd_mg_per_unit, units_per_pack)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, sku, name, cat, thc, cbd, upc))

# Batches
BATCHES = [
    ("BT4991", "1A406030003A1000000012345", "RELEASED",
     "WildSeed Hybrid Biomass — Spring 2025", 4820.0, 480, "WS-GUM-25MG-10CT",
     "2025-11-14", "Legacy batch. Gold standard."),
    ("BT5001", "1A406030003A1000000012346", "RELEASED",
     "WildSeed Indica Biomass — Fall 2025", 3900.0, 390, "WS-GUM-10MG-20CT",
     "2026-01-22", "Clean run. No flags."),
    ("BT5002", "1A406030003A1000000012347", "TESTING",
     "WildSeed Hybrid Biomass — Spring 2026", 5100.0, 510, "WS-GUM-25MG-10CT",
     "2026-05-10", "Spring 2026 harvest. Awaiting final COA."),
    ("BT5003", "1A406030003A1000000012348", "IN_PROCESS",
     "WildSeed Sativa Biomass — Spring 2026", 2800.0, 0, "WS-TINC-500MG",
     "2026-05-24", "Tincture run in progress."),
]
for bn, mtag, status, inp, wt, units, sku, bdate, notes in BATCHES:
    cur.execute("""
        INSERT OR IGNORE INTO ws_batch
            (sys_id, batch_number, metrc_tag, status, input_material,
             input_weight_g, output_units, output_sku, batch_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, bn, mtag, status, inp, wt, units, sku, bdate, notes))

# Inventory
INV = [
    ("WS-GUM-25MG-10CT", "BT4991", 0,   0,  480, 0),
    ("WS-GUM-10MG-20CT", "BT5001", 142, 0,  248, 0),
    ("WS-GUM-25MG-10CT", "BT5002", 0,   510, 0,  0),
    ("WS-TINC-500MG",    "BT5003", 0,   0,   0,  0),
]
for sku, bn, onhand, pending, shipped, destroyed in INV:
    cur.execute("""
        INSERT OR IGNORE INTO ws_inventory
            (sys_id, sku, batch_number, units_on_hand,
             units_pending_lab, units_shipped, units_destroyed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, sku, bn, onhand, pending, shipped, destroyed))

# COAs
COAS = [
    ("BT4991", "SC Labs", "2025-11-20", "2025-11-25", "PASS",
     28.4, 0.2, 29.1, "PASS","PASS","PASS","PASS", "Flagship batch COA. Clean."),
    ("BT5001", "Confident Cannabis", "2026-01-28", "2026-02-02", "PASS",
     24.1, 0.3, 25.0, "PASS","PASS","PASS","PASS", "Solid run."),
    ("BT5002", "SC Labs", "2026-05-14", "PENDING", "PENDING",
     None, None, None, "PENDING","PENDING","PENDING","PENDING",
     "Awaiting results from SC Labs."),
]
for bn, lab, sdate, rdate, status, thc, cbd, total, pest, solv, metals, micro, notes in COAS:
    cur.execute("""
        INSERT OR IGNORE INTO ws_coa
            (sys_id, batch_number, lab_name, sample_date, result_date,
             status, thc_pct, cbd_pct, total_cannabinoids,
             pesticides, residual_solvents, heavy_metals, microbials, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, bn, lab, sdate, rdate, status,
          thc, cbd, total, pest, solv, metals, micro, notes))

# Compliance log
LOGS = [
    ("BT4991","METRC_TAG_ASSIGNED","Metrc UID assigned at intake","michael"),
    ("BT4991","COA_UPLOADED","SC Labs COA uploaded","michael"),
    ("BT4991","COA_PASSED","All panels passed. Batch cleared for release.","michael"),
    ("BT4991","BATCH_RELEASED","480 units released to inventory","michael"),
    ("BT5002","METRC_TAG_ASSIGNED","Metrc UID assigned at intake","michael"),
    ("BT5002","COA_UPLOADED","Samples submitted to SC Labs 05/14","michael"),
    ("BT5003","METRC_TAG_ASSIGNED","Metrc UID assigned. Tincture run started.","michael"),
]
for bn, etype, desc, op in LOGS:
    cur.execute("""
        INSERT INTO ws_compliance_log
            (sys_id, batch_number, event_type, description, operator)
        VALUES (?, ?, ?, ?, ?)
    """, (uuid.uuid4().hex, bn, etype, desc, op))

conn.commit()
conn.close()
print("✅ WildSeed manufacturing demo data seeded.")
print("   BT4991: RELEASED (legacy gold standard)")
print("   BT5002: TESTING (spring 2026, awaiting COA)")
print("   BT5003: IN_PROCESS (tincture run active)")
```

---

## BACKEND: API ENDPOINTS

Add the following routes to `sovereign_core_api.py`.
All gated to `pilot` and `garden_client` roles.

```python
from rbac_middleware import require_role

# ── Dashboard KPIs ────────────────────────────────────────────────────────────
@app.get("/api/wildseed/dashboard")
async def ws_dashboard():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    batches_in_flight = conn.execute(
        "SELECT COUNT(*) as c FROM ws_batch WHERE status='IN_PROCESS'"
    ).fetchone()["c"]
    units_pending = conn.execute(
        "SELECT COALESCE(SUM(units_pending_lab),0) as c FROM ws_inventory"
    ).fetchone()["c"]
    compliance_flags = conn.execute(
        "SELECT COUNT(*) as c FROM ws_coa WHERE status='FAIL'"
    ).fetchone()["c"]
    recent_logs = conn.execute(
        "SELECT * FROM ws_compliance_log ORDER BY sys_created_on DESC LIMIT 5"
    ).fetchall()
    conn.close()
    return {
        "batches_in_flight": batches_in_flight,
        "units_pending_lab_release": units_pending,
        "compliance_flags": compliance_flags,
        "recent_activity": [dict(r) for r in recent_logs]
    }

# ── Batches ───────────────────────────────────────────────────────────────────
@app.get("/api/wildseed/batches")
async def ws_batches():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM ws_batch ORDER BY batch_date DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/wildseed/batches/{batch_number}")
async def ws_batch_detail(batch_number: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    batch = conn.execute(
        "SELECT * FROM ws_batch WHERE batch_number=?", (batch_number,)
    ).fetchone()
    coa = conn.execute(
        "SELECT * FROM ws_coa WHERE batch_number=? ORDER BY sys_created_on DESC LIMIT 1",
        (batch_number,)
    ).fetchone()
    log = conn.execute(
        "SELECT * FROM ws_compliance_log WHERE batch_number=? ORDER BY sys_created_on DESC",
        (batch_number,)
    ).fetchall()
    conn.close()
    return {
        "batch": dict(batch) if batch else None,
        "coa": dict(coa) if coa else None,
        "compliance_log": [dict(r) for r in log]
    }

# ── Products & Inventory ──────────────────────────────────────────────────────
@app.get("/api/wildseed/products")
async def ws_products():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT p.*, 
               COALESCE(SUM(i.units_on_hand),0) as total_on_hand,
               COALESCE(SUM(i.units_pending_lab),0) as total_pending
        FROM ws_product p
        LEFT JOIN ws_inventory i ON i.sku = p.sku
        WHERE p.active = 1
        GROUP BY p.sku
        ORDER BY p.category, p.name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── COAs ──────────────────────────────────────────────────────────────────────
@app.get("/api/wildseed/coas")
async def ws_coas():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM ws_coa ORDER BY sys_created_on DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Compliance log ────────────────────────────────────────────────────────────
@app.get("/api/wildseed/compliance")
async def ws_compliance():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM ws_compliance_log ORDER BY sys_created_on DESC LIMIT 100"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

---

## FRONTEND: PAGE SPECS

### Dashboard (`/`)
Fetches `/api/wildseed/dashboard`. Three KPI tiles at top:

| Tile | Value | Color |
|---|---|---|
| Batches In Flight | count of IN_PROCESS batches | amber |
| Units Pending Lab Release | sum of units_pending_lab | blue |
| Compliance Flags | count of FAIL COAs | red (0 = green) |

Below the tiles: a **Recent Activity feed** — the last 5 compliance log events
rendered as a clean timeline. Timestamp, event type badge, description, operator.

### Production (`/production`)
Fetches `/api/wildseed/batches`. Table with columns:

`Batch #` | `Status badge` | `Input Material` | `Input (g)` | `Output Units` | `SKU` | `Date` | `→ Detail`

Status badges: `IN_PROCESS` = amber, `TESTING` = blue, `RELEASED` = green,
`DESTROYED` = red, `RECALLED` = red pulse.

Clicking a row opens a **Batch Detail drawer** showing full batch info +
linked COA status + compliance log timeline for that batch.

### Compliance (`/compliance`)
Two panels side by side:

Left — **Metrc Chain of Custody** table: batch number, Metrc tag, status,
last compliance event, operator.

Right — **Compliance Event Log**: scrollable feed of all `ws_compliance_log`
entries with event type color coding.

`METRC_TAG_ASSIGNED` = cyan
`COA_PASSED` = green
`COA_FAILED` = red
`BATCH_RELEASED` = green
`BATCH_DESTROYED` = red
`AUDIT_NOTE` = amber

### Products (`/products`)
Fetches `/api/wildseed/products`. Card grid — one card per active SKU showing:
- Product name and category badge
- THC / CBD per unit
- Units on hand (green) vs units pending lab (amber)
- Units shipped (muted)

### Lab Results (`/lab`)
Fetches `/api/wildseed/coas`. Table:

`Batch #` | `Lab` | `Sample Date` | `Result Date` | `Status` | `THC%` | `CBD%` | `Panels`

Panels column: four mini badges — Pesticides / Solvents / Metals / Microbials.
Each badge is green (PASS), red (FAIL), or grey (PENDING).

For RELEASED batches with a `coa_file_url`, show a **View COA** button.

---

## VITE PROXY

In `21_WildSeed_GardenStack/vite.config.ts`, ensure `/api/wildseed` proxies
to `http://localhost:8090` (same Core API, new namespace):

```typescript
'/api/wildseed': {
  target: 'http://localhost:8090',
  changeOrigin: true,
}
```

---

## VERIFY

```bash
# Schema exists
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ws_%';"

# Demo data seeded
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT batch_number, status, output_units FROM ws_batch;"

# API responds
curl -s http://localhost:8090/api/wildseed/dashboard | python3 -m json.tool
curl -s http://localhost:8090/api/wildseed/batches | python3 -m json.tool

# Frontend compiles
cd /home/james/SovereignOS/21_WildSeed_GardenStack && npm run build
# Expected: exit code 0

# Open in browser — confirm 5 nav items, no cultivation content visible
# http://100.73.155.70:3016
```

---

## WHAT PAWEL SEES

Dashboard loads. Three tiles: 2 batches in flight, 510 units pending lab
release (BT5002 awaiting COA), 0 compliance flags.

Recent activity shows BT5003 Metrc tag assigned today.

He clicks Production — sees BT4991 RELEASED, BT5001 RELEASED, BT5002 TESTING,
BT5003 IN_PROCESS. Real batch numbers. Real status. His operation.

He clicks Lab Results — sees BT4991 and BT5001 fully green across all panels.
BT5002 pending. That's the compliance story in one screen.

No zones. No plants. No nitrogen. No botanical bot farms.
A manufacturer's dashboard for a manufacturer.

---

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*Built for a Type 6 operator. Not a farmer.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 27, 2026*
