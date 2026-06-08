# SOVEREIGN UHF STUDIO: MASTER CONSOLIDATION PLAN

**TARGET:** `01_Sovereign_Portal` (React/Vite Frontend, Node .73)
**OBJECTIVE:** Transform the sprawling Sovereign FanStack tools into a unified "UHF Pirate Radio" broadcasting studio. This entails natively pulling the standalone administrative and analytical tools into a single, cohesive command deck.

---

### I. Architectural Vision
The "UHF Studio" will be instantiated as `Level 4: The Studio`. 
Instead of forcing the user into different browser tabs/ports, the React application will act as the master control board, interfacing directly with the existing headless Python microservices via `fetch` and `WebSocket`.

**The Three Pillars of the Studio:**
1. **The God-Mode Injector (Port 5055):** Native JSON editor UI built into React that POSTs to `fanstack_admin_api.py`.
2. **Savant Neural Query (Port 8006):** Native search bar and data grid that interfaces with the local Savant telemetry parsers, completely replacing `wardy_savant_query.html`.
3. **The Live Mesh Feed (Port 8008):** Real-time observation of the `FanStackChat` and simulation state.

---

### II. Layout Strategy: "The Producer's Desk"
The Studio UI will use a high-density, multi-panel layout designed for rapid context switching and God-Mode interventions. Think *hardware mixing board*.

**Grid Structure:**
- **Left Column (The Console):**
  - *Top Half:* **Savant Neural Query.** A sleek input bar for natural language querying alongside a dense, fast-loading data table showing the pitch/batter stats returned from Port 8006.
  - *Bottom Half:* **God-Mode Command Port.** A raw, monospaced code editor component (like Monaco or a highly styled textarea) to instantly drop `REALITY_COLLAPSE` JSON payloads, with an execution button that hits Port 5055.
- **Right Column (The Live Feed):**
  - **Main Viewing Pane:** A mirrored instance of `FanStackChat.tsx` or a raw tailing log of the FanStack. It allows the producer to inject a JSON override on the left and instantly watch the bots react on the right.

### III. System Integration Instructions

**1. Connecting the Savant Oracle:**
*   Replicate the Javascript fetching logic from `wardy_savant_query.html`. 
*   Create a `<SavantQueryBlock />` React component. 
*   Perform POST requests via `fetch('http://192.168.1.73:8006/api/savant_query')`. 
*   Render the returned data directly into a Shadcn/Tailwind HTML table.

**2. Connecting the Reality Injector:**
*   Create a `<GodModeEditor />` React component.
*   Preload the state with the standard template payload (source, target_nodes, new_state, constraints).
*   Add syntax highlighting for JSON.
*   Perform a POST request to `http://192.168.1.73:5055/api/admin/override`.
*   Ensure the success/denial messages flash in a prominent status LED/banner in the UI.

**3. Routing Updates:**
*   Update `App.tsx` state to include `studio` within `activeRoom`.
*   Add "Level 4: UHF Studio" to the main header navigation menu.
*   Ensure the visual aesthetic matches the dark slate + neon accents of the existing UI (maintaining the `1A110B` backgrounds and `38bdf8` highlights).

---

### IV. Constraints & Guardrails
- **No Backend Regressions:** Do *not* change the Python logic inside `fanstack_admin_api.py` or the port 8006 service. We are only building a new front-end layer on top of them.
- **Offline Capable:** Ensure no dependencies are pulled from external CDNs dynamically that would break if Node .73 is offline (use installed node_modules).
- **Zero Hallucinations:** The UI must reflect actual API responses. If a Savant query fails or an Admin payload is rejected, the UI must gracefully log the hard error.
