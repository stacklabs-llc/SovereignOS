# ⚾ FANSTACK BROADCAST OPERATIONS AND UAT
**Status:** Ω=15.3 (UX_HARDENED)
**Last Updated:** April 1, 2026

The FanStack broadcast system is a telemetry-driven live sports visualizer that leverages the Sovereign OS mesh and Tailscale Funnel to provide a zero-latency "Watch Party" experience for distributed family members (Barb, Eileen, Sean).

---

## 🏗️ I. TECHNICAL ARCHITECTURE

### 1. The Relay Nexus & Proxy Chain
- **Local WebSocket Relay (`fancast_relay.py`)**: Runs on **Port 8008**. Aggregates raw MLB Statcast telemetry, manages Govee UDP triggers, and handles persona injections.
- **FastAPI Gateway Server**: Runs on **Port 8000**. Serves static HTML assets and provides a `/ws` proxy to the local relay.
- **Tailscale Funnel**: Securely exposes the Port 8000 gateway to the public mesh URL (`https://sov73.taila01894.ts.net`). This allows family members to bridge the airgap via standard HTTPS without installing VPN software.

### 2. Bespoke UI Nodes (Presentation Layer)
- **Desktop Visualizer (`fancast_fan_live.html`)**: Full Savant-style telemetry and HOLODEX media vault integration. Default NYM-indigo/amber branding.
- **Mets Mobile (`fancast_mobile.html`)**: Handheld-optimized template.
- **Barb's Room (`fancast_barb.html`)**: Specialized Braves-themed UI (Navy/Red) with dedicated `@Tricorder` telemetry.
- **Wardy Control Deck (`fancast_control_deck.html`)**: Manual persona injection and generative AI video ingress.

---

## 📡 II. FUNNEL-AWARE WEBSOCKETS (WSS PATTERN)

To operate across both local (internal) and public (Funnel) environments, UIs must dynamically detect their protocol to initiate a secure connection (`wss://`).

### Javascript Implementation:
```javascript
function initWS() {
    const isSecure = window.location.protocol === 'https:';
    const wsUrl = isSecure 
        ? `wss://${window.location.host}/ws` 
        : `ws://${targetIp}:8008`;
    ws = new WebSocket(wsUrl);
}
```
The **FastAPI Gateway** (Port 8000) reverse-proxies the `/ws` endpoint to the internal relay (Port 8008), enabling secure telemetry over the Funnel.

---

## 🧪 III. UAT SPRINT & FINDINGS (MARCH 31, 2026)

Successfully executed a game-day UAT sprint (code-named GASTOWN-RUN) to stress-test the live-production broadcast mesh with family testers.

### 1. Critical Priority Fixes (GASTOWN Run)
- **DotMatrix & Barf Source Filtering (FC-GASTOWN-01)**: 
    - **Finding**: Both B.A.R.F. (Mets Fan) and DotMatrix (Stats Protocol Droid) personas were reacting to **SYS_AUDIT** logs emitted by the "Nancy Drew" audit crawler (e.g., finding orphaned JSON file fragments).
    - **Fix**: Implemented mandatory source filtering in `fanstack_chatbots.py` for both `STATE_UPDATE` and `CMD_PERSONA` blocks.
    - **Implementation**:
        ```python
        # fanstack_chatbots.py
        if fan["name"] in ["Dot", "Barf"]:
            if data.get("source") not in ['MLB_TELEMETRY', 'MLB_APP']:
                print(f"[{fan['name'].upper()}] Source filter ACTIVE.")
                continue
        ```
    - **Outcome**: The bots no longer react to manual "fluff detector" messages or Zork headers, preserving the purity of the gameday gchat feed.
    - **Action**: Weaponized the anomaly. Created a "Chaos Injector" toolkit to purposely inject strings like *"A RUBBER IMPLEMENT IS IN THE MAILBOX"* to test Dot-Matrix's philosophical stability during live games.
    - **Toolkit Inventory (FC-CHAOS-01)**:
        - **Zork Tier**: *"YOU ARE IN AN OPEN FIELD WEST OF A WHITE HOUSE"*, *"IT IS PITCH BLACK. YOU ARE LIKELY TO BE EATEN BY A GRUE"*.
        - **Rando Tier**: Haiku about hot dogs, "IS THIS THING ON", Base64 "LET'S GO METS", Null island (0,0), and the single duck emoji (🦆).
    - **Outcome**: Logged as a "Conceptual Singularity" in `fancast_{YYYYMMDD}.log`. DotMatrix attempted to calculate the batting average of the rubber implement.
    - **Zork Hunt Resolution (FC-GASTOWN-02)**:
        - **Source Identified**: `sovereign_audit_crawler.py`.
        - **Fix**: The anomaly was caused by the crawler's manual websocket injection of `CMD_PERSONA` strings. 
        - **Resolution**: Implemented the same `source` filter on the `CMD_PERSONA` handling block in `fanstack_chatbots.py` to prevent any non-MLB source from triggering persona strikes.
        - **Confirmation**: `[ZORK] Source: /home/james/SovereignOS/sovereign_audit_crawler.py. Status: GATED.`
    - **Hunt Sequence (Standard Diagnostic)**:
        ```bash
        # Step 1: Find the source in project scripts
        grep -r "ZORK\|open field\|white house\|zork" \
          /home/james/SovereignOS/scripts/ \
          /home/james/SovereignOS/08_FanCast/ \
          --include="*.py" --include="*.js" --include="*.html" -l

        # Step 2: Check relay for easter egg injectors
        grep -n "ZORK\|anomaly\|easter" /home/james/SovereignOS/scripts/fancast_relay.py

        # Step 3: Check game_sim for test payloads
        grep -n "ZORK\|zork\|1977\|mainframe" /home/james/SovereignOS/scripts/game_sim.py
        ```

---

## 📝 V. EMERGENCY PERSONA LOGGING (FC-008)
To ensure long-term "Sovereign Traceability" and permanent receipts of persona interactions (particularly for the Zork anomaly), centralized logging was implemented in `fanstack_chatbots.py`.

### 1. Log Repository
- **Directory**: `/home/james/SovereignOS/08_FanCast/logs/`
- **Naming Convention**: `fancast_YYYYMMDD.log` (Rotates daily for game-day segregation).

### 2. Log Entry Structure
Each persona emission is appended to the daily log with the following schema:
`[{ISO_TIMESTAMP}] {SOURCE} | {PERSONA}: {MESSAGE}`

**Implementation Note**: This ensures that even if the WebSocket relay crashes or the terminal buffer is cleared, all generative AI outputs and their trigger sources (e.g., `MLB_TELEMETRY` vs `MANUAL_INGRESS`) are preserved for forensic analysis.

---

## 🦾 VI. HARDWARE ACTUATION (DIRECT UDP UNICAST)
As of the April 1 Federation Hardening, the fragile Govee UDP broadcast has been replaced with direct **LAN UDP Unicast** for 100% latency reliability. This override was finalized after LAN HTTP attempts were rejected by the hardware.

### 1. Grid Configuration
- **Device IP**: `192.168.1.71`
- **Protocol**: Direct UDP Unicast to **Port 40033**.
- **Payload**: JSON-encoded `colorwc` commands.

### 2. Gameday Logic (Mets-Bias)
- **Mets Score**: `Orange (255, 85, 0)`.
    - `{"msg": {"cmd": "colorwc", "data": {"color": {"r": 255, "g": 85, "b": 0}, "colorTemInKelvin": 0}}}`
- **Home Run (The Strobe)**: Flash Orange/Blue (`0, 45, 114`) 3x then hold Orange.
- **Cardinals Score / Opponent Action**: Lights remain **OFF** or static. The mesh ignores non-Mets scoring events to maintain bias.

### 3. Rule 41 (The Spoiler Lag)
- **Action**: Local telemetry triggers MUST fire the lights immediately upon `MLB_TELEMETRY` receipt.
- **Outcome**: The orange flash provides a ~25-30 second "future sight" before the IPTV / Streaming broadcast catches up, alerting the room to a run before it appears on the 65" Matrix.

---

## 🔗 VII. GAMEDAY HUB & OPERATIONAL LINKS (FUNNEL)
The following links route through the `sov73` Tailscale Funnel and are secured over HTTPS for external access:

### 📱 Consumer Viewports
- **[Mobile Visualizer (General)](https://sov73.taila01894.ts.net/08_FanCast/fancast_mobile.html)**: Primary handheld telemetry node.
- **[Barb's Room (Braves)](https://sov73.taila01894.ts.net/08_FanCast/fancast_barb.html)**: Braves-Navy/Red theme for Node .73.
- **[HoloDex Main Live](https://sov73.taila01894.ts.net/08_FanCast/fancast_fan_live.html)**: Desktop dashboard for the 65" Matrix.

### 🎮 Control & Engineering
- **[Wardy Control Deck](https://sov73.taila01894.ts.net/08_FanCast/fancast_control_deck.html)**: Manual persona strikes and media ingress.
- **[Personal Triggers (Admin)](https://sov73.taila01894.ts.net/08_FanCast/fancast_personal.html)**: Govee hardware overrides and manual alerts.

---

## 🦾 VIII. ACTIVE UAT HARDENING (IMPLEMENTED)
The following requirements were finalized and deployed to the `08_FanCast` environment to solve the UI jank identified during the GASTOWN sprint:

| ID | Title | Implementation Details |
| :--- | :--- | :--- |
| **FC-010** | **Live Game Selector** | Wardy Control Deck now features `loadSchedule()` which fetches the live MLB.com calendar and dynamically populates the ingress dropdown. |
| **FC-011** | **Logo Loading Fix** | Deployed `getPlaceholderSVG(abbr)` fallback. If a team logo fails to fetch or during game-switches, the UI renders an inline SVG circle with the team's primary color (e.g., NYM Blue, ATL Red) and abbreviation. |
| **FC-012** | **Loading Modal Repair** | Deployed a stylized `#loading-modal`. **Critical Regression Fix**: Found that the modal was flashing on every `setInterval` poll (2.5s). The solution was to restrict the modal's `.classList.add('active')` only to the discrete `switchGame()` function, preventing telemetry-induced flicker. |
| **FC-013** | **Persona Deduplication** | **Rule 76 (The Nexus Filter)**: Implemented in `fancast_relay.py`. Any message identical to one emitted within a 30s window is suppressed via the `recent_messages` cache. |
| **FC-81 (Rule 78)** | **Model Hardening** | Mistral is restricted to **DEV_MODEL**. `tinyllama` is enforced as **GAME_TIME_MODEL** for tonight. |
| **FC-CHAOS-01** | **Chaos Toolkit** | A set of absurd injection strings (Zork, Hot Dog haikus) used to stress-test personas. |
| **FC-80** | **Rule 80: Keep-Alive** | Added `"keep_alive": "5m"` to all Ollama calls to reclaim RAM between gameday events. |
| **FC-014** | **Master Poller (Federator)** | Centralized the Statcast poller into `fancast_control_deck.html`. It now performs the 4.5s fetch and pushes `CMD_SYNC_STATE` to Port 8008. All consumer viewports (Fan Live, Barb, Mobile) have had their sync-push code disabled to prevent relay-state contention. |
| **FC-015** | **Schedule API Retry** | Implemented a 10s recursive retry in `loadSchedule()` via a `.catch()` block. If the MLB API is down, the UI renders "Retrying MLB Schedule..." and loops indefinitely. |
| **FC-016** | **Auto-Team Affinity** | Viewports now auto-select the primary team based on context: `fancast_fan_live.html` (**NYM ID: 121**), `fancast_barb.html` (**ATL ID: 144**). |
| **FC-GASTOWN-04** | **Mobile Viewport Fix** | Injected `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">` to all mobile templates (`fancast_mobile.html`, `fancast_barb.html`). Adjusted font thresholds to 16px minimum for touch-targets. |
| **FC-GASTOWN-05** | **Ingestion Status** | Replaced the raw "Awaiting browser..." error text with a pulsing **Yellow PENDING** status badge. Provides better UX feedback when Wardy is booting the Master Poller. |
| **FC-009** | **Live Log Viewer** | Added a small scrollable overlay container (`#fancast-audit-tail`) on the Wardy Dashboard showing the last 50 lines of the daily session log via a dedicated CMDB REST tailing endpoint. |

## 🌡️ IX. THERMAL GOVERNANCE (RULE 78 & 80)

During the **GASTOWN-RUN** sprint, Node .73 reached critical peaks (>84°C) due to Mistral load. The system now enforces the following hardware safety protocols:

### 1. Rule 78: The Gameday Production Brake
- **Constraint**: `mistral` is strictly prohibited from live gameday relay operations.
- **Enforcement**: `fanstack_chatbots.py` hardcodes `GAME_TIME_MODEL = "tinyllama"`.
- **Reasoning**: Mistral consumes ~330% CPU on Pi 5, leading to thermal throttling and relay lag. TinyLlama maintains 100% latency floor at <65°C.

### 2. Rule 80: VRAM Reclamation (Keep-Alive)
- **Constraint**: All LLM API calls MUST specify a 5-minute keep-alive.
- **Implementation**:
```json
json={"model": model, "prompt": prompt, "stream": False, "keep_alive": "5m"}
```
- **Outcome**: Models automatically evict from memory after 5 minutes of idle air, preventing cumulutive thermal creep during half-innings or between-pitch lulls.

---

## 🛠️ X. TECHNICAL IMPLEMENTATION DEEP-DIVE

### 1. Master Poller Architecture (FC-014)
To ensure the Producer (Wardy) defines the master state for the entire hive, the `setInterval` logic is now uniquely assigned to the Control Deck.

```javascript
// Located in fancast_control_deck.html
setInterval(async () => {
    try {
        if (!currentGamePk || currentGamePk === "2024-09-30-SIM") return;
        const res = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${currentGamePk}/feed/live`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const feed = await res.json();
        // ... parse linescore and match-up ...
        if(ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
                type: "CMD_SYNC_STATE", 
                data: { 
                    away_score: awayRuns,
                    home_score: homeRuns,
                    // ... other telemetry fields ...
                } 
            }));
        }
    } catch (err) {
        console.warn("[WARDY DESK POLLER ERROR]", err);
    }
}, 4500);
```

### 2. Recursive Schedule Resilience (FC-015)
Ensures cold boots do not hang the UI.

```javascript
async function loadSchedule() {
  try {
    const res = await fetch("https://statsapi.mlb.com/api/v1/schedule?sportId=1");
    // ... logic to populate selector and find affinity ...
  } catch(err) {
    console.warn("Schedule load failed:", err);
    document.getElementById('status-feed').textContent = "Retrying MLB Schedule...";
    setTimeout(loadSchedule, 10000); // 10s Recursive Retry
  }
}
```

---



### Technical Note: Logo Placeholder Colors
The implementation includes a hardcoded hex-map for the NL East and key rivalries (Dodgers, Red Sox, Cardinals) to ensure color-accurate fallbacks without external CSS dependencies.

---
` [ FANSTACK : OPERATIONAL_V4 | Ω=15.2 (HARDWARE_SECURED) ] `
