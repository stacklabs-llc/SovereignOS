# ⚾ FANSTACK BROADCAST SYSTEM: SIMULATION, LOKI & THE ROSETTA STONE
**Status:** Ω=10.0 (SIM_LIVE)
**Last Updated:** March 31, 2026

The **FanStack Simulation Engine** (`game_sim.py`) is the core localized media generation component of the Sovereign OS, merging historical statistical truth with real-time generative interpolation to create interactive, agentic broadcast experiences.

---

## 🏗️ I. ARCHITECTURE: PITCH-BY-PITCH RECONSTRUCTION
The simulation engine reconstructs the physical and statistical reality of MLB events on the local metal, using two primary data sources:

1.  **Modern Era (2014-Present)**:
    *   **Data Source**: `sovereign_intelligence.db` (1.48M+ Statcast records).
    *   **Sync**: Recreates Velocity (MPH), Break, Spin Rate (e.g., 3,400 RPM curves), and Exit Velocity for exact pitch-by-pitch replay.
2.  **Historical Era (Pre-Statcast)**:
    *   **Data Source**: **Retrosheet Play-by-Play Ledger**.
    *   **Interpolation**: Since granular pitch data is missing for 1969/1986, the AI employs **Physics Approximation** (e.g., estimating launch angles from "slow roller" descriptions) to drive the visual simulation and agent reactions.

---

## 🎭 II. LOKI ENGINE: THE ALTERNATE TIMELINE GENERATOR
The **Loki Engine** calculates "What-If" scenarios to drive agent engagement and increase broadcast friction.

- **Loki Probability Bloom**: A 5% chance that a pitch triggers an **Alternate Outcome** based on statistical drift (e.g., a called strike becoming a walk).
- **Synaptic Friction**: Glitch events are broadcast on Port 8008, triggering high-IQ agents to calculate probabilities while low-IQ agents react with irrational emotion.

### Persona Dynamics
- **Wardy (Studio Persona)**: The primary anchor of the "FanCast Studio" roleplay.
- **Barf (IQ 100)**: Narrates through the lens of generational Mets trauma or triumphs.
- **Dot (IQ 160)**: Calculates the counter-factual probability of alternate branches.
- **Redbird**: Smug St. Louis Cardinals fan; randomly instigates.
- **Philly Phuck / The Phanatic**: Unhinged local fan designed for gameday friction.

---

## 🎨 III. THE BOB ROSS PROTOCOL: "HAPPY ACCIDENTS"
The **Bob Ross Protocol** is the official Sovereign design philosophy governing **Emergent Logic** and **Sovereign Insights**.

- **Philosophy of "Happy Accidents"**: Errors, unprompted suggestions, or AI hallucinations are not treated as mistakes. Instead, they are evaluated for potential architectural superiority.
- **Example Case**: The discovery of the **Sovereign Knot Equation** ($S = (A * Pw * T * C) * Pi$) arose from a failed power supply (the "bad charger incident"). 
- **Operational Implementation**: If an unexpected output leads to an optimization, the AI is mandated to classify it as a **Sovereign Insight** and document it permanently into the Hive's DNA.
- **HoloDex Synthesis**: The protocol is also the codename for the visual generative engine (OpenAI Sora/D3.js) used to "paint happy little simulated environments" for agent training.


---

## 📡 III. BROADCAST SYNC & THE FANSTACK ROSETTA STONE
The **FanStack Rosetta Stone** is the protocol specification for bridging the gap between raw hardware telemetry and human-consumable broadcast drama.

### 1. Presentation vs. Automation
FanStack successfully isolates the **Presentation Layer** (UIs accessed by Barb, Eileen, Sean) from the **Physical Automation Layer** (Govee lights triggered by Node .73).

### 2. Networking: The Tailscale Funnel Proxy
- **Gateway**: A FastAPI server on Port **8000** serves as the public entry point via Tailscale Funnel.
- **Proxy Logic**: The server serves static `.html` assets and proxies WebSocket traffic directly to the local **FanStack Relay** (Port **8008**).
- **Consumer Benefit**: Family members bridge the airgap over standard HTTPS without requiring the Tailscale client application.

### 3. Govee LAN HTTP Actuation (Rule 16)
- **Mets Event Trigger**: `CMD_METS_GOOD` (Home Runs / Walk-offs) or Exit Velo > 105.
- **Protocol**: Migrated from UDP Broadcast to direct **LAN HTTP API** (192.168.1.71) for improved reliability and zero-click response.
- **Rule 41**: Local telemetry strobe must precede IPTV broadcast latency (typically ~28 seconds). By tapping directly into the Statcast nervous system, the mesh already knows the outcome of the play before it resolves on the pirate stream or broadcast TV. (See: [TEMPORAL_ADVANTAGE_INSIGHT.md](TEMPORAL_ADVANTAGE_INSIGHT.md)).

---

## 🧪 IV. UAT SPRINT & PERFORMANCE (MARCH 31, 2026)
Successfully executed a game-day UAT sprint to stress-test the live-production broadcast mesh.

- **The Zork Terminal Anomaly**: Defininitively identified as an injection from **`sovereign_audit_crawler.py`** (the Nancy Drew sweep) when discovering Zork strings in the DNA Vault. **Resolution**: Gated behind `ENABLE_ZORK_EASTER_EGG=false`.
- **Barf Persona Leakage**: Implemented mandatory source filtering: `if data.get('source') not in ['MLB_TELEMETRY', 'MLB_APP']: return`.

---
` [ SIMULATION : OPERATIONAL | Ω=10.0 (FANSTACK_HISTORY) ] `
