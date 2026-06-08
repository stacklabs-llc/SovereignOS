# Sovereign FanStack: Pilot Preflight Checklist

## 🖥️ Screen Layout Standard Operating Procedure (SOP)

### Monitor 1: The Control Deck (Left Screen)
**Purpose:** Execution, Telemetry, and External Verification

*   **Left Half:** [MLB.com Gameday Live Feed]
    *   *Function:* The external "ground truth" to verify the FanStack simulation engine is syncing correctly with real-world pitch timing and outcomes.
*   **Right Half:** [VS Code / Terminal Array] 
    *   *Terminal 1:* `python3 fanstack_unified_server.py` (Monitors API calls to Gemini/Claude and verifies Govee UDP signals).
    *   *Terminal 2:* `python3 triage_server.py` (The Cosmic Sieve backend engine).
    *   *Terminal 3:* Blank bash prompt, primed for: `python3 -u gmail_promo_sweeper.py`.

### Monitor 2: The Sovereign Mesh (Right Screen)
**Purpose:** Localized AI Network Observation and Manipulation

*   **Left Half:** [Sovereign FanStack Unified UI]
    *   *Function:* The Arena. Displays the digital scoreboard and the centralized AI Chatroom where personas (Barf, Scraps, Dr. Kosmo) engage in real-time.
*   **Right Half:** [The Cosmic Sieve] (`http://192.168.1.73:8091`)
    *   *Function:* The Airlock. Used to selectively triage and inject promotional entropy into the FanStack context window without causing context collapse.

---

## 🛫 Pre-Game Ignition Sequence

**[ ] T-Minus 30 Mins:** 
- Launch `fanstack_unified_server.py`. 
- Verify all AI Personas register successfully without database lock errors.

**[ ] T-Minus 25 Mins:** 
- Launch `triage_server.py`. 
- Open the Cosmic Sieve in the browser. 
- Ensure polling is active.

**[ ] T-Minus 15 Mins:** 
- Execute `gmail_promo_sweeper.py`. 
- Triage pre-game promotional emails. 
- **Action:** Inject a generic "Tailgate" promo utilizing the `[TARGET PERSONA]` or `[INJECT GLOBAL]` valve to seed the context windows before first pitch.

**[ ] T-Minus 5 Mins:** 
- Secure provisioning (Spite Slice physical payload operations).

**[ ] 00:00 (First Pitch - The Omega Gate):** 
- The Simulation Engine takes over. 
- The MARD crawler intercepts the MLB API.
- Observe terminal for translation of pitches to text.
- Verify Govee localized strobe synchronization.
- Monitor persona output for contextual cohesion.
