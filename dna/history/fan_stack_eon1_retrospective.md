# Retrospective: Sovereign EON 1 — FanStack Baseball Immersion System

## Introduction
The FanStack system was designed during EON 1 to provide live game telemetry, chat-room interactions, and automated sensory updates (lighting, timeline anomalies) for baseball games. It established the core pub-sub routing pattern and game state caching framework used in Sovereign OS.

## Architecture Diagram

```mermaid
graph TD
    MLB[MLB StatsAPI] -->|Poll Schedule & Feed| Poller[Background Poller: fanstack_background_poller.py]
    Poller -->|WS CMD_SYNC_STATE / ws://localhost:8008| Mesh[Sovereign Mesh / Relay]
    Poller -->|Atomic Writes| Disk[(Disk Cache: /game_states/{game_pk}.json)]
    Poller -->|Append Logs| LogFile[(/sovereign_inbox/today/statcast_telemetry.log)]
    
    Simulator[Gametime Simulator: fanstack_server.py] <-->|FastAPI WebSockets /ws/gametime| SimUI[Sim UI Client]
    Simulator <-->|Savant SQL| IntelDB[(SQLite: sovereign_intelligence.db)]
```

## Key Technical Components

### 1. FastAPI Gametime Simulator (`fanstack_server.py`)
- **Websocket Playback Control:** Running on port `8006`, it listens to `/ws/gametime` commands (`PLAY`, `PAUSE`, `STEP_FWD`, `STEP_BACK`, `FFWD`, `REWIND`, `SPEED`) to simulate historical pitch sequences.
- **Savant Query Engine:** Custom API endpoint (`/api/savant_query`) that parses natural language terms (e.g. "Alonso slider lefty") and queries local `statcast_pitches` table in `sovereign_intelligence.db` to extract speed, launch angles, and play outcomes.
- **DVR Playback Loops:** An async loop advances the current pitch index using base delays adjusted by speed multipliers.

### 2. Adaptive Background Poller (`fanstack_background_poller.py`)
- **Sovereign Mesh Connection:** Connects directly to the main WebSocket mesh (`ws://localhost:8008`) to broadcast live game updates.
- **Adaptive Polling Rates:** 
  - Live active games: every 5.0 seconds.
  - T-minus 15 minutes / warmups: every 15.0 seconds.
  - Future scheduled games: every 60.0 seconds.
  - Finalized games: every 10 minutes (600.0 seconds) to conserve bandwidth.
- **Atomic State Caching:** Computes state hashes and performs thread-safe POSIX file replaces (`os.replace`) to write JSON feeds to `/home/james/SovereignOS/game_states/{game_pk}.json` only when game data updates.

### 3. Sensory and Immersion Event Triggers
- **Extra Innings Trigger:** Detects when a game enters the 10th inning or later, upgrading the room's Boggs Level to `4` (maximum sensory output) and sending high-urgency screen-shake alerts to active chat clients.
- **TMI (Timeline Interception) Scenario Triggers:** If a game is delayed (e.g., due to weather), the poller automatically queries the local database table `cmdb_ci_tmi_scenario` for a random scenario and fires a `TMI_ANOMALY` animation script to connected clients.
- **High-Entropy Event Filters:** Auto-triggers animated felt-puppet comic highlights whenever high-entropy events (home runs, ejections, brawls, blowouts) are parsed from the feed description.
