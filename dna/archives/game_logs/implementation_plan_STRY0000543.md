# Implementation Plan - STRY0000543: Sovereign Sports Stream & Remote Integration (M.A.R.D Engine Integration)

Establish a premium "Live Game Center" in Sovereign Sports that combines the active HLS stream relay with a gorgeous, real-time live-updating play-by-play visualizer (scoring, count, runners on base, recent plays, and pitch telemetry). Bridge the standard Sovereign Remote command set and connect directly to the M.A.R.D engine's live telemetry flow on port 8008.

## User Review Required

> [!IMPORTANT]
> **Active Telemetry Flow (M.A.R.D Engine)**
> Instead of simulated files, we will leverage the active live telemetry flowing on port `8008` (M.A.R.D engine). We will add a proxy rule in the sports micro-app to mount `/ws` onto `ws://127.0.0.1:8008`. On load, `VideoPlayer.tsx` will establish a WebSocket connection, join room `824679` (Cubs vs Astros), and update the telemetry panel instantly on every pitch/play update.
>
> **Fast Initial Cache Loading**
> For instantaneous UI rendering before the first WebSocket pitch update, we will fetch the current state from the active FanStack `game_cache` file `/home/james/SovereignOS/game_states/824679.json` via our new proxy REST endpoint `/api/sports/game_state/824679`.
>
> **Remote WebSocket Event Bridge**
> We will add proxy definitions for the theater ws `/ws/theater` and hook the video player to standard remote commands (`pause`, `seek_fwd`, `seek_back`, `quit`) to allow standard TV remote usability.

## Proposed Changes

---

### Sports Stream Relay Backend

#### [MODIFY] [sovereign_stream_relay.py](file:///home/james/SovereignOS/scripts/sovereign_stream_relay.py)
- Expose a new REST endpoint `@app.get("/api/sports/game_state/{game_id}")` to read and serve real-time live game files from the active FanStack cache `/home/james/SovereignOS/game_states/{game_id}.json`.

---

### Sports Frontend Micro-app

#### [MODIFY] [vite.config.ts](file:///home/james/SovereignOS/19_Sovereign_Sports/vite.config.ts)
- Add proxy rules:
  1. `/ws` -> `ws://127.0.0.1:8008` (M.A.R.D engine live WebSocket telemetry).
  2. `/ws/theater` -> `ws://127.0.0.1:8090` (Unified remote command WebSocket).
  3. `/api/theater` and `/api/cinema` -> `http://127.0.0.1:8090` (Core theater REST control).

#### [MODIFY] [VideoPlayer.tsx](file:///home/james/SovereignOS/19_Sovereign_Sports/src/components/VideoPlayer.tsx)
- Fetch current active game state initially from `/api/sports/game_state/{gameId}` for instant loading.
- Establish a WebSocket connection to `wss://${window.location.host}/ws`. On connection, transmit `{"type": "JOIN_ROOM", "room": "{gameId}"}` to subscribe to the M.A.R.D engine's live telemetry broadcasts for game 824679.
- Hook onto WebSocket message type `STATE_UPDATE` to dynamically update the live HUD overlay in real-time.
- Connect to `/ws/theater` to handle standard remote command events (`pause`, `seek_fwd`, `seek_back`, `quit`) against the `<video>` player ref.
- Render the state-of-the-art glassmorphic "Live Game Center" visual HUD layout.

## Verification Plan

### Automated/Local Tests
- Validate Python syntax for `sovereign_stream_relay.py`.
- Verify the Vite dev server builds without TS errors.
- Connect browser subagent to the Tailscale URL of Sovereign Sports (`https://clio.taila01894.ts.net:3010`) and verify real-time visual telemetry updates.

### Manual Verification
- Deploy and verify remote control actions (Play/Pause, Seek, Quit) against the Chrome player tab.
