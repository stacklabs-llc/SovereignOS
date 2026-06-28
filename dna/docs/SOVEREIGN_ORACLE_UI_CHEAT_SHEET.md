# 🗺️ Sovereign Oracle UI/UX Cheat Sheet
**Location:** `/home/james/SovereignOS/dna/docs/SOVEREIGN_ORACLE_UI_CHEAT_SHEET.md`

This document defines the canonical terminology for all UI and UX elements in the Sovereign Oracle Match Center (`FanFanStackPortal.tsx` / Port 3010). Use these exact terms when prompting for layout changes, element relocations, or functionality tweaks.

---

## 🏗️ 1. Global Header & Control Bar
The top-most row containing global state selectors and telemetry configuration hooks.

| UI Label / Name | Code Reference / Class | Purpose / Behavior |
| :--- | :--- | :--- |
| **Active Environment Pill** | `Environment Banner` / `env-badge` | Displays the current stage (`DEV`/`UAT`/`PROD`) and system uptime. |
| **Game Switcher Dropdown** | `gameSwitcher` / `activeGamePk` | Live select list to load active matchups. Triggers websocket reconnection. |
| **Decorum Slider** | `Decorum Range Input` / `decorum-slider` | Adjusts advocate text behavior. Setting to `0` applies industrial-slate styling and silences all system sound effects. |

---

## 📺 2. Left Column: Central Broadcast Column
Class name: `central-broadcast-column` (Width: 65%)

This column houses the primary visual simulation viewports.

```
+--------------------------------------------------------------+
|               Broadcast Ingress Viewport                     |
|  (Includes Scoreboard, Inning Status, and scanline overlay)  |
+--------------------------------------------------------------+
|               Match Momentum Sparkline                       |
|  (SVG live trend indicator line)                             |
+--------------------------------------------------------------+
|               2D Tactical Field Canvas                       |
|  (Renders MLB Diamond / Footy Pitch / PGA Green dynamically) |
+--------------------------------------------------------------+
```

### Element Breakdown:
1. **Broadcast Ingress Viewport / Broadcast Stream Frame**
   * **Purpose:** Displays live scores, inning details, outs indicator, active pitch counts, and the raw Statcast node tracking ID.
   * **Visuals:** Implements a scanline overlay grid filter and a live heartbeat pulse dot.
2. **Match Momentum Sparkline**
   * **Purpose:** Draws the live momentum trajectory of the match.
   * **Visuals:** Animated SVG line with a translucent orange gradient drop fill (`#ff5a00` style accent).
3. **2D Tactical Field Canvas**
   * **Purpose:** HTML5 canvas rendering specific layouts depending on the active room's sport class:
     * **MLB Baseball Diamond:** Draws bases, pitcher/batter labels, pitch paths (via Pillow script), and weather vectors.
     * **Footy Pitch (Soccer):** Renders radial heatmaps, penalty boundaries, and soccer player rosters (`Messi`, `Pulisic`, etc.).
     * **PGA Golf Green / Fairway:** Renders sand traps, water hazards, golf cups, and shot flight paths.

---

## 💬 3. Right Column: Terrace Balcony Sidebar
Class name: `terrace-balcony-sidebar` (Width: 35%)

This column handles the social layer, commentary inputs, and administrative control panels.

```
+--------------------------------------------------------------+
|                      Telemetry Hub                           |
|  (Displays score metrics, balls-strikes, Boggs level)        |
+--------------------------------------------------------------+
|                    Lobby Chat Panel                          |
|  Lobby: @alistair_vance @chloe_wright ...    [md] [json] [csv]|
|  ----------------------------------------------------------  |
|  (Scrollable messages feed)                                  |
|                                                              |
|  [ Typewriter Input Box ]                                    |
+--------------------------------------------------------------+
|                    Expand Deck Controls                      |
|  (Advocate Soundboard / Outrage RaaS / Anomaly Tracker)      |
+--------------------------------------------------------------+
```

### Element Breakdown:
1. **Telemetry Hub**
   * **Purpose:** High-density scorecard card displaying scores, innings, outs, and the **`Boggs Multiplier Level`**.
2. **Lobby Chat Panel** (`lobby-chat-panel`)
   * **Lobby Participant List:** A horizontal strip displaying active advocate tags (e.g., `@alistair_vance`, `@chloe_wright`) and their dynamic routed avatars.
   * **Export Bar:** Small pill buttons (`md`, `json`, `csv`) allowing manual downloads of active chat threads.
   * **Messages Feed:** The central scrollable feed where advocate emotes and simulated commentator chatter appear in real time.
   * **Typewriter Input Box:** The input bar at the bottom allowing manual user comments or system prompt injects.
3. **Expand Deck Controls (Collapsible Drawer)**
   * **Advocate Soundboard:** Interactive buttons to manually play soundboard phrases or synthesize Web Audio signals.
   * **Outrage Proxy Tantrum RaaS Controls:** Range knobs to adjust toxicity, trigger outrage comments, or toggle the **M.A.R.D Core Engine**.
   * **Cypher Burn Cell Anomaly Tracker:** Visual terminal reporting simulated system entropy rates and node coordinates.

---

## 📊 4. Bottom Row: Statcast Telemetry Ticker
The horizontal strip spanning the bottom of the portal.

| UI Element Name | Code Reference / Class | Purpose / Behavior |
| :--- | :--- | :--- |
| **Statcast Telemetry Ticker** | `statcast-ticker-marquee` / `.ticker-wrap` | Rolling text marquee displaying live pitch velocities, swing metrics, player tracking data, and game logs. |
