## DESIGN SPECIFICATION & CODESPACE IMPLEMENTATION INSTRUCTIONS: SOVEREIGN OS AGENT ENGINE

### 1. TARGET ARCHITECTURE OVERVIEW
You are an expert systems architect and autonomous engineer. You are task-filled with building the core foundation of **Sovereign OS**, a cloud-decoupled, high-performance edge computing platform. This phase of development focuses on the **FanStack Live Telemetry Engine** and the **Sovereign Now Database Schema**, enforcing an explicit hard-wall separation from any third-party SaaS infrastructure or public cloud dependencies.

### 2. SYSTEM INGESTION & DATA ARCHITECTURE

#### A. The Multi-Stadium Telemetry Arbitrage Pipeline
- **Component Name:** `TelemetryIngressRouter`
- **Functional Requirements:**
  - Establish a high-throughput, non-blocking asynchronous stream handler capable of consuming raw, concurrent JSON streams (simulated StatCast game logs/events).
  - Implement a sliding context window to bundle events from different physical game IDs (`game_pk`) arriving inside the same temporal window (millisecond accuracy).
  - **The Cross-Stadium Bleed Modality:** The engine must inject out-of-market highlight indicators and global event tags into the unified payload before it is dispatched to the persona execution pool.
- **Data Boundaries:** - Do not call public web endpoints or configure live OAuth loops. 
  - Mock the source data with a high-velocity generator script simulating overlapping data points (e.g., Strikeouts in Miami occurring simultaneously with a Pitch Clock Violation in Philadelphia).

#### B. The Local Persistence Engine (`sovereign_now.db`)
- **Database Architecture:** Local SQLite instance implementing an internal, decoupled ServiceNow-style Configuration Management Database (CMDB) schema.
- **Tables & Schemas Required:**
  1. `sim_agents`: Tracks active persona profiles, core emotional anchors (`injury_paranoia`, `transit_fatalism`, `asset_depreciation`), and aggregate volatile tension states (scalar range 0.0 to 10.0).
  2. `cultural_relics`: Stores persistent shared symbols, historical trauma callbacks, and evolving room vocabulary generated during run-time execution (e.g., tracking the ideological status of the "Home Run Sculpture").
  3. `telemetry_cache`: Acts as an isolated staging ground for raw play data to shield processing loops from unstable external API schemas.
- **Decoupling Constraint:** All system states, compliance variables, and agent traits must route cleanly through this local DB schema. If an upstream data format changes, the modification must be handled inside an isolated schema-mapping adapter without breaking core agent code.

### 3. AGENT RHETORICAL ENGINE & PERSONA LOGIC

#### A. Non-Convergent Divergence Loops
- Build the core logic executing the persona scripts (`barf`, `7_train_terry`, `battery_chucker_jr`, `bendix_burnout`).
- **Algorithmic Rule:** Do not allow personas to homogenize or flatten their tone based on user inputs or mutual conversation history. 
- Implement a rigid prompt/state modification matrix where incoming telemetry acts as an accelerant to their predefined symbolic obsessions:
  - If `telemetry_cache.event_type` == 'foul_ball' AND speed < 80mph:
    - Trigger `barf` -> Increment `injury_paranoia` loop, call Wilpon-era memory table.
    - Trigger `7_train_terry` -> Append string referencing infrastructure decay or transit delay.
    - Trigger `bendix_burnout` -> Calculate cost-per-minute asset depreciation.

### 4. EDGE COMPLIANCE & DEPLOYMENT SPECS
- **Target Edge Hardware Environment:** Optimized for local execution on resource-constrained edge hardware arrays (e.g., Beelink nodes, NVIDIA Jetson Orin modules).
- **Network Topology:** Zero public inbound listening ports. All inter-node synchronization and mock streaming must run across a virtualized, local mesh network structure mirroring a Tailscale secure overlay.
- **Operational Constraints:** - Absolutely NO public cloud libraries (AWS SDK, Google Cloud SDK, Azure DevOps).
  - Write standard Python 3.11+ code utilizing core libraries (`asyncio`, `sqlite3`, `pathlib`) and lightweight asynchronous execution frameworks.

### 5. EXPECTED CODEBASE OUTPUT DELIVERABLES
Provide clean, functional, modular source files matching this specification:
1. `models.py`: Strict SQLite schema definitions utilizing an ORM or clean raw SQL wrapper matching the `sovereign_now.db` specification.
2. `pipeline.py`: Asynchronous event router managing the cross-stadium data bleed logic.
3. `engine.py`: State-machine coordinator tracking persona tension scores and enforcing rhetorical divergence rules based on database lookups.