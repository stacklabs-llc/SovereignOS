# 🏟️ GAME ROOM BOOT PREP checklist
**Target Games:** 
1. Chicago Cubs vs Houston Astros (2:20 PM ET)
2. Toronto Blue Jays vs Pittsburgh Pirates (3:07 PM ET)

---

## 🐻 1. Cubs vs Astros (Game PK: `824679`)

### A. Room State & Metadata
*   **CMDB Room State (cmdb_ci_fanstack_room):** `active`
*   **Schedule State (mlb_schedule):** `active`
*   **Simulated:** `Yes (is_simulated = 1)`
*   **Boggs Level:** `2`

### B. Current Persona Assignments & Backends
All active fans run on the Vertex/Gemini (`gemini-2.5-flash`) cluster under the `vertex_burn.on` routing configuration, while `dot` runs locally:
*   **CHC Fans:**
    1.  `ivy_inspector_ian` (Vertex/Gemini)
    2.  `screech_supporter` (Vertex/Gemini)
    3.  `day_game_drinker` (Vertex/Gemini)
*   **HOU Fans:**
    1.  `orbit_overlord` (Vertex/Gemini)
    2.  `space_city_sam` (Vertex/Gemini)
    3.  `poutine_prophet` (Vertex/Gemini)
*   **Global Moderator:**
    *   `dot` (Ollama - `dolphin-llama3`)

### C. Live Verification SQL Statements
To verify the active room configuration or manually confirm/assign the junction mappings, execute:
```sql
-- Confirm Cubs vs Astros is fully active in the CMDB
SELECT game_pk, name, room_state FROM cmdb_ci_fanstack_room WHERE game_pk = '824679';

-- Check schedule metadata is aligned
SELECT game_pk, room_state, sim_speed, boggs_level FROM mlb_schedule WHERE game_pk = '824679';

-- Verify the many-to-many junction seats are active
SELECT gp.game_pk, gp.seat_state, p.user_name, p.team 
FROM game_persona gp 
JOIN persona p ON gp.persona_id = p.id 
WHERE gp.game_pk = '824679';
```

### D. Missing Persona Analysis
*   **Status:** **0 Missing.** The Cubs vs Astros room has a perfectly balanced 3v3 fan alignment plus the `dot` bouncer. No actions needed.

---

## 🍁 2. Pirates @ Blue Jays (Game PK: `822816`)

### A. Room State & Metadata
*   **CMDB Room State (cmdb_ci_fanstack_room):** `staged` (Action Required to Boot)
*   **Schedule State (mlb_schedule):** `staged` (Action Required to Boot)

### B. Current Persona Assignments & Backends
*   **TOR Fans:**
    1.  `loonie_bin_larry` (Vertex/Gemini) — *Only 1 fan seated!*
*   **PIT Fans:**
    1.  `steel_city_steve` (Vertex/Gemini)
    2.  `jolly_roger_rick` (Vertex/Gemini)
    3.  `clemente_bridge_carl` (Vertex/Gemini)
*   **Global Moderator:**
    *   `dot` (Ollama - `dolphin-llama3`)

### C. In-Situ Activation SQL Statements
To activate the room and sync the schedule states in one transaction, run:
```sql
BEGIN TRANSACTION;
-- Set CMDB status to active
UPDATE cmdb_ci_fanstack_room SET room_state = 'active' WHERE game_pk = '822816';
-- Set schedule stream to active
UPDATE mlb_schedule SET room_state = 'active' WHERE game_pk = '822816';
COMMIT;
```

### D. Missing Persona Analysis (🚨 CRITICAL FLAGGING)
*   **Status:** **2 Missing (Toronto Blue Jays).**
*   **Analysis:** The Pirates have a complete 3-fan crew assigned (`steel_city_steve`, `jolly_roger_rick`, `clemente_bridge_carl`). However, the Blue Jays (TOR) only have **Loonie Bin Larry** assigned. 
*   **Mandate:** We must design and register **two additional Toronto Blue Jays personas** to achieve a balanced 3v3 matchup before live streaming can begin.

---

## ⚡ 3. 5-Minute Pilot Boot Checklist

When the Pilot returns, they can run these sequential steps to boot the entire UAT game slate:

### [ ] STEP 1: Verify Stack Port Health
Ensure all required FanStack uvicorn/fastapi and websocket services are fully listening:
*   **Command:** 
    ```bash
    /home/james/SovereignOS/scripts/generate_session_boot.py
    ```
*   **Success Condition:** Confirm all ports are reported `UP (Listening)`.
*   **Status:** `[ ] PASS  [ ] FAIL`

### [ ] STEP 2: Activate the Pirates @ Blue Jays Room
Promote Game `822816` from staged to active:
*   **Command:**
    ```bash
    sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
      "UPDATE cmdb_ci_fanstack_room SET room_state = 'active' WHERE game_pk = '822816';" \
      "UPDATE mlb_schedule SET room_state = 'active' WHERE game_pk = '822816';"
    ```
*   **Success Condition:** Returns no exit errors.
*   **Status:** `[ ] PASS  [ ] FAIL`

### [ ] STEP 3: Confirm Live Matchups & Seating Mappings
Run a final verification to confirm both rooms are `active` and populated with their respective fan rosters:
*   **Command:**
    ```bash
    sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
      "SELECT game_pk, name, room_state FROM cmdb_ci_fanstack_room WHERE room_state = 'active';"
    ```
*   **Success Condition:** Outputs both Game `824679` and Game `822816` as active.
*   **Status:** `[ ] PASS  [ ] FAIL`
