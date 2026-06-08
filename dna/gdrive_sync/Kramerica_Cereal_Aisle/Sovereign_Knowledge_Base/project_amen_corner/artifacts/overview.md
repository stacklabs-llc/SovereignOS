# Project Amen Corner: Operational State

This document preserves the context from the "Sovereign Acoustic Sentinel Deployment" initialization phase, carrying over all built architecture for the upcoming 2026 Masters.

## 1. The Offline Sandbox (`08_FanCast/masters_server_2025_sim.py`)
To prevent corrupting the live ESPN polling architecture (`masters_server.py`) before the real 2026 tee-off, we built a completely offline **Simulation 04102025** sandbox.
- **The State:** It hardcodes the leaderboard from Thursday, April 10, 2025 (Justin Rose at -7, Scheffler hovering, Rory McIlroy at E after a water-chip disaster).
- **The Ticks:** It updates the state purely offline every 15-30 seconds instead of grabbing live data.
- **Execution:** It is launched via `./run_masters_sim.sh`.

## 2. The Multiverse Injection (The Drifter & Coach Shrubbs)
We hardened the `sovereign_now.db` and the Python pipelines to execute a "Tin Cup"-style simulation loop.
- **The Drifter (R. McAvoy):** A ghost golfer injected directly into the `masters_server_2025_sim.py` leaderboard. He starts at `+4 Thru 9` and dynamically advances through the back 9 via a random probability engine. The CaddyStack bots react to him as if he were a real player.
- **Coach Shrubbs:** A new MARD engine persona injected into the database. He is deeply paranoid about a 1993 Heritage Azalea landscaping cover-up and constantly spams feedback about "trusting the pendulum."
- **Thick Bios:** To halt MLB-style LLM behavior loops, the Barbershop Quartet (SlopeMatrix, Traditionalist, etc.) received 300+ word deep-lore system prompts.

## 3. The 3-Node Display Array (ADB Casting)
The workspace spans three screens: a 65-inch Fire TV (Left), the core desktop monitor (Center), and the control LAPTOP (Right).
To accommodate this, we retrofitted the UI and proxy server:
- **`masters_relay.py` (The API Hub):** Added a FastAPI route `POST /api/cast_tv/{tv_ip}` which utilizes native OS `adb` commands (`adb -s {tv_ip}:5555 shell am start ...`) to force URLs onto the left and right Fire TVs.
- **The Butler Cabin (`masters_desk.html`):** The center command deck. Features integrated Cast buttons to fire the specialized UI rooms directly to the TVs.

## 4. The Lore UIs
We built three distinct HTML renderers:
1.  **The Butler Cabin (`masters_desk.html`)**: The primary control deck. Shows the overarching PGA Leaderboard.
2.  **Amen Corner (`amen_corner.html`)**: A minimalist, dark-green UI that brutally strips out the leaderboard to give an edge-to-edge view of the ChatGPT CaddyStack window. Built specifically to be blasted to the 65-inch TV.
3.  **The Crow's Nest (`crows_nest.html`)**: A frantic, red-pulsing dashboard that acts as the "Amateur Tracker." It specifically ignores the leaders and forcefully centers its data exclusively on **The Drifter** and his cut-line progress. 

## 5. UAT & Tooling
- We built `uat_cheatsheet_amen_corner.html` as the preflight ignition deck to ensure the Pilot can load all connections and verify the environment manually before tee-off.
