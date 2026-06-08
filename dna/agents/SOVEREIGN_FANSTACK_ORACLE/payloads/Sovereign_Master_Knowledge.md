# Sovereign Master Knowledge (The Brain Dump)

NOTE: This document contains the combined architecture lore, protocols, and history of the Sovereign OS Mesh, compiled into a single file for easy NotebookLM ingestion.



---
## SOURCE CACHE: architecture/PEGASUS_NODE_MANIFEST.md
---

# 🐎 Node .168 (Pegasus) — Hardware Manifest & Recommissioning Plan
**Status:** Ω=17.5 (PROVISIONING_USB_SSD)
**Last Updated:** April 1, 2026 (01:20 AM)

The Pegasus node is a 13-year-old self-built workstation recommissioned as the **LLM Dreadnought Engine** for the Sovereign OS. Its primary mission is to offload memory-intensive LLM personas (e.g., Tom A Hawk, Philly Phuck) from Node .73 to preserve flagship thermal stability and provide dedicated GPU horsepower.

---

## ⚙️ I. HARDWARE SPECIFICATIONS
*   **CPU**: Intel® Core™ i7-4790K @ 4.00GHz (4 Cores, 8 Threads).
*   **Memory (RAM)**: 16 GB Physical DDR3 (17 GB Total Virtual).
*   **GPU**: NVIDIA GeForce GTX 980 (4 GB VRAM).
    *   *Architecture*: Maxwell (Compute 5.2). Supported by Ollama via CUDA 11 fallback or OpenCL.
*   **Target Boot Drive**: **128GB USB 3.0 SSD** (repurposed from the Node .73 storage pool). 
    *   *Strategy*: Full installation of Ubuntu Server 24.04 LTS to the 128GB external SSD. This bypasses the need for shrunken partitions or Windows Boot Manager (GRUB) interference, satisfying Sovereign Rule 1 (Never Delete User Files). BIOS must be targeted to prioritizing the USB mass storage device.
    *   *Outcome*: Pegasus becomes a dual-identity machine—Windows 10 Workstation when internal disks are prioritized; Sovereign LLM Dreadnought when the USB-SSD is active. 
*   **Secondary Storage (Data)**: Seagate ST3000DM001 (3TB HDD / 2.72TB Formatted). 
    *   *Mount Protocol*: Auto-mount to `/mnt/storage` in Linux. `/mnt/storage/ollama/models` established as the repository for all 7B+ parameter weights.
    *   *Windows Partition*: Accessible via NTFS-3G in read-only or read-write mode for cross-OS data persistence.

---

### 1. Bare-Metal Ubuntu Server 24.04 LTS (Headless)
To maximize the 4GB VRAM on the GTX 980, Node .168 must run a **Headless (CLI-only)** installation.
*   **WSL2 vs. Bare-Metal**: While WSL2 exists on the Windows 10 side, the GPU overhead and virtual network NAT make it inferior for Sovereign Node operations. Dual-booting into a dedicated Ubuntu Server environment reclaims ~1.2GB of VRAM and places the node directly on the local mesh.
*   **Provisioning**: The 128GB USB SSD provides ample speed for the OS and model caching without impacting internal drive partitions.

### 2. The Storage Logic (The HDD Mount)
Due to the high frequency of LLM model expansion (Mistral 7B = 4.1GB, Llama-3 8B = 4.7GB), the boot SSD must be protected from capacity crashes.
*   **Mount Point**: The 2.7TB Mechanical HDD must be mounted.
*   **Environment Var**: `OLLAMA_MODELS` must be explicitly pointed to the HDD mount path.
*   **Performance**: While loading models from HDD is slower than SSD (~10s vs ~2s), once the weights are in VRAM/RAM, inference speed is dictated by the GPU/CPU.

---

## 🤖 III. COGNITIVE LOADOUT (OLLAMA TARGETS)

| Model Name | Parameter Size | Usage Profile | VRAM Fit |
| :--- | :--- | :--- | :--- |
| **TinyLlama** | 1.1B | High-speed antagonist personas. | 100% in VRAM |
| **Mistral** | 7B | Complex reasoning / logic checks. | Partial Offload (VRAM + RAM) |
| **Llama-3** | 8B | Emotional fan personas. | Partial Offload |

---

## 🛠️ IV. RECOMMISSIONING CHECKLIST
1.  **Prep SSD**: Clear 128GB USB SSD from Node .73.
2.  **OS Flash**: Install Ubuntu Server 24.04 (Headless) directly to the external 128GB drive.
3.  **Tailscale Mesh**: Join the Sovereign Mesh as Node .168 (`192.168.1.168`).
4.  **GPU Drivers**: Install NVIDIA proprietary drivers (`ubuntu-drivers autoinstall`).
5.  **Ollama Config**:
    *   Install Ollama.
    *   Create `/mnt/storage/ollama/models`.
    *   Set `OLLAMA_MODELS=/mnt/storage/ollama/models` in the `systemd` service override.
6.  **FanStack Handshake**: Configure `fanstack_chatbots.py` to point to `100.90.6.117:11434` (Windows) or `192.168.1.168:11434` (Linux) for offloaded inference.

## 🏁 V. CMDB REGISTRATION
Node .168 was formally registered in the Sovereign CMDB on 2026-04-01:
```python
cmdb.register_node(
    node_id='Node .168', 
    hardware='Intel Core i7-4790K / GTX 980 / 16GB RAM', 
    agent_class='LLM Dreadnought Engine', 
    status='PROVISIONING', 
    primary_directives=['Serve Mistral/Llama3 via Ollama', 'Host VRAM-heavy AI operations'], 
    manifest_path='/home/james/apiary/dna/ci/pegasus.md'
)
```

---
` [ NODE_168 : DREADNOUGHT | STATUS: PROVISIONING_USB_SSD | Ω=17.5 ] `


---
## SOURCE CACHE: architecture/SOVEREIGN_CORE_ARCHITECTURE.md
---

# 🏰 SOVEREIGN SYSTEM CORE ARCHITECTURE
**Status:** Ω=13.0 (DUAL_LAYER_STABILITY)
**Last Updated:** March 31, 2026 (11:22 PM)

This document serves as the unified technical authority on the Sovereign OS infrastructure, encompassing the physical compute nodes, the network topology, and the foundational "Sovereign Knot" architecture.

---

## 🏛️ I. THE SOVEREIGN KNOT (CORE ARCHITECTURE)
The **Sovereign Knot** is a local-first, peer-to-peer mesh where Node .73 acts as the central state relay and hardware actuator. It prioritizes **Physical Truth** (power purity, local telemetry) over **Cloud Logic**.

### 1. The Knot Equation ($S$)
Stability ($S$) is reached when hardware, power, truth, and cognition are balanced and signed by the Pilot. Proved by the **Carroll Knot Origin** (March 31, 2026): A failed Anker charger leading to under-voltage hallucinations, proving that **Power Purity** is the foundation of digital truth.

$$S = (A \times P_w \times T \times C) \times P_i$$

- **$A$ (Autonomy)**: Local-compute ratio.
- **$P_w$ (Power)**: 5.1V / 5.0A absolute power rail. Must remain **"0x0 Pure"**.
- **$T$ (Truth)**: Physically verified telemetry (Statcast/GPS).
- **$C$ (Cognition)**: Agentic reasoning and vector memory.
- **$P_i$ (Pilot)**: Human operator authorization (The **Omega Gate**).

---

## 🏗️ II. THE SOVEREIGN PORTAL (AETHER ARCHITECTURAL SPA)
The **Aether Command Deck** (`sovereign_employee_center.html`) is the unified manage interface for the fleet.

- **Architecture**: As of March 30, 2026, the OS migrated to a high-performance **Single-File SPA Architecture**, eliminating iframes/sub-pages to ensure absolute state integrity.
- **Vesper Moda**: Adheres to the Vesper Moda aesthetic (Void Black, high-visibility neon accents).
- **Control Nexus**: Integrates the CMDB API (8082), Sovereign Search Indexer (SSI), and the FanStack Gameday launcher.

---

## 🏗️ III. HARDWARE FLEET MANIFEST

### 1. Flagship Node: sov73 (Node .73)
- **Board**: Raspberry Pi 5 (8GB RAM).
- **Accelerator**: **Hailo-10H NPU** (26 TOPS) for vision cortex.
- **Storage**: 256GB NVMe SSD (**The Vault**) for long-term memory; 128GB MicroSD (**The Smuggler's Bay**) for untrusted ingestion.
- **Thermal**: Hurricane Protocol triggers cooling at 80°C.

### 2. The Argus Optical Array
Secondary Pi Zero 2W nodes providing MJPEG visual telemetry:
- **MANDO (Node .114)**: Sector surveillance. CI-114.
- **GROGU (Node .170 / .172)**: Garden relay / GreenStack host. CI-170.

---

## 🛰️ IV. NETWORK & REMOTE ACCESS

### 1. Tailscale Device Mesh
The OS extends beyond the physical perimeter via a secure Tailscale WireGuard mesh.

| Nickname | OS / Version | Tailscale IP | Role |
| :--- | :--- | :--- | :--- |
| **sov73** | Linux 6.12 (Pi 5) | `100.123.68.9` | Primary Hub (Hailo-10H) |
| **artemis** | Windows 10 | `100.70.84.19` | Remote Dev / Navigator |
| **pegasus** | Ubuntu Server 24.04 | `100.90.6.117` | LLM Dreadnought Engine |

### 2. Tailscale Funnel (Public Gateway)
To bypass the airgap for external viewers (family members), the system utilizes **Tailscale Funnel** on Port **8000**.
- **Secure Reverse Proxy**: FastAPI (8000) reverse-proxies the `/ws` endpoint to the local FanStack Relay (8008), enabling real-time WSS telemetry over standard HTTPS.
- **Significance**: Allows "Watch Party" access without requiring guest devices to install Tailscale.

---

## 🛰️ V. CMDB-DRIVEN PORT REGISTRY
The single source of truth for nodal governance.

| Service | Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| Aether Portal | 8000 | TCP | Unified Management (SPA) |
| FanStack Relay | 8008 | WS | Persona / Telemetry Handshake |
| CMDB API | 8082 | TCP | Configuration Database |
| Dead Drop | 8088 | TCP | Zero-Cloud File Sharing |
| Video Cortex | 8086 | TCP | Multimodal VLM Dialogue |

---

## 🧬 VI. RELAY STABILITY & DEDUPLICATION (THE NEXUS FILTER)
As of the March 31 Gameday UAT, the **FanStack Message Nexus** (`fanstack_relay.py`) implements a sliding window deduplication strategy (**FC-013**) to maintain cognitive stability when multiple viewport nodes are active.

### 1. The Echo Problem
Because personas like "Dot" and "Barf" are reactive to both local UI triggers and central telemetry, a single Statcast packet could trigger identical LLM observations across the mesh, overwhelming the social feed.

### 2. Implementation: `recent_messages` Cache
- **Logic**: A global `recent_messages` dictionary tracks a `{user:message}` hash.
- **Window**: 30 seconds. 
- **Suppression**: If an identical string is emitted by a persona within the window, the relay suppresses the broadcast. This ensures one unique persona observation per game event, regardless of how many visualizer nodes are connected.

---

## 🧬 VII. THE MASTER DATA FEDERATOR (FC-014)
As of the April 1 Gameday Hardening, the Sovereign Mesh transitioned from a **Decentralized Polling** model to a **Master-Leader Federator** model to resolve data-source conflicts.

### 1. The Poller Conflict (Legacy)
Previously, any viewport node (`fanstack_fan_live.html`) could initiate an MLB Statcast poll and broadcast `CMD_SYNC_STATE`. If multiple nodes were viewing different games, the Relay and AI Personas would oscillate between games, causing "Consensus Drift."

### 2. Lead-Elected Ingress (Wardy Desk)
- **Central Authority**: The `setInterval()` poller was migrated from consumer nodes to the **Wardy Control Deck** (`fanstack_control_deck.html`).
- **Data Federation**: The Control Deck is now the **Master Data Federator**. It fetches the MLB API payload and pushes the definitive state to the Relay.
- **Consumer View**: Viewport nodes (Fan Live, Mobile, Barb) now act as **Reactive Listeners**. They consume the `STATE_UPDATE` from the relay and only poll locally for individual UI refreshes, never broadcasting state back to the mesh. This ensures a "Single Source of Truth" for Dot and Barf's telemetry-reactive reasoning.

## 🏙️ VIII. CMDB PERIPHERAL OPTICAL NODES
In addition to the primary Argus array, the Sovereign mesh incorporates secondary optical nodes via the IoT layer for full situational awareness.

| CI Asset | Model | Location | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **CI-NEST-001** | Nest Cam (Outdoor) | Backyard | Sam/Mando perimeter patrol verification. |
| **CI-NEST-002** | Nest Cam (Indoor) | Garden / Living Room | Monitoring of Govee state and gameday celebration receipts. |

---

## 🚀 IX. RESOURCE SCALING & THE ROADMAP
The Sovereign OS scale by moving intelligence to the edge, isolating "Perception" from "Synthesis," and refining the Pilot's visibility into the system internals.

### 1. Scaling Strategy: Perception vs. Synthesis
*   **The Watcher (Perception Layer)**: Edge nodes (RPi/NPU) perform high-frequency object classification (Hailo-10H) and emit lightweight JSON metadata.
*   **The Synthesizer (Action Layer)**: Central hubs (Node .73/.74) consume metadata to trigger heavy reasoning, Govee alerts, or LLM-driven fan simulations.

### 2. Immediate Implementation Priorities
*   **FanStack Broadcast Hardening**: Real-time persona-simulations with localized pitch-by-pitch Statcast reconstruction.
*   **Sovereign System Properties (Admin Portal)**: Deployment of a Pilot-facing dashboard for one-click service management (Start/Stop/Restart).
*   **Sovereign Oracle**: Fully airgapped, local-only fine-tuning of "Digital Twin" models using the `dna/` ledger.
*   **Dreadnought Offloading**: Completion of Node .168 (Pegasus) commissioning to host gameday LLM personas, ensuring Node .73 maintains thermal stability (Rule 78).

---
` [ SYSTEM_CORE : OPERATIONAL | Ω=16.5 (DREADNOUGHT_OFFLOAD_READY) ] `


---
## SOURCE CACHE: history/ORACLE_033_034_GASTOWN_HARDENING.md
---

# 📜 ORACLE PROTOCOLS 033 & 034: FANSTACK GASTOWN HARDENING
**Status:** Ω=1.0 (PROCEED_GAMEDAY_READY)
**Protocol Dates:** March 31 - April 1, 2026
**Session Reference:** `ed6c001c-3249-4279-8db8-4f8358aa09a0`

## 🕹️ I. MISSION OVERVIEW: THE GASTOWN RUN
The **GASTOWN-RUN** (FC-GASTOWN) represent a corrective "Zero-Hour" sprint focused on eliminating architectural jank and thermal instabilities identified during final UAT. Handled as a joint operation between the Pilot, Antigravity, and the Navigator (Artemis-1), the mission ensured the "Truth Pipeline" was ready for live broadcast.

---

## 📋 II. FC-GASTOWN TICKETS & RESOLUTIONS

### 1. FC-GASTOWN-01: THE "BARF-DOT" SOURCE FILTER
*   **Issue**: **B.A.R.F.** (Mets Fan) and **DotMatrix** (Stats Protocol Droid) were reacting to `SYS_AUDIT` messages from the Nancy Drew audit crawler, causing cognitive dissonance during telemetry feeds.
*   **Resolution**: Implemented a mandatory whitelist in `fanstack_chatbots.py` for both Dot and Barf, restricting their response triggers to `MLB_TELEMETRY` and `MLB_APP` sources.
*   **Log Confirmation**: `[BARF] Source filter ACTIVE.`

### 2. FC-GASTOWN-02: THE ZORK TERMINAL ANOMALY
*   **Issue**: Sequential anomalies reading `⚠️ ANOMALY: ZORK TERMINAL DETECTED ⚠️` were detected in the mesh.
*   **Source Found**: `sovereign_audit_crawler.py` (Line 75). The script was injecting manual persona strikes when finding "zork" in the filesystem.
*   **Resolution**: Verified that `ENABLE_ZORK_EASTER_EGG=false` is enforced in the `.env` file and gated the `CMD_PERSONA` block against manual source injections from auditing scripts.

### 3. FC-GASTOWN-04/05: MOBILE VIEWPORT & STATUS UI
*   **Mobile Meta-Fix**: Injected `viewport` tags into `fanstack_barb.html` and `fanstack_mobile.html` to fix "Desktop Squish" on remote family viewports (Barb and Sean's phones).
*   **Status Badge**: Replaced raw error text with a pulsing yellow badge for the "Awaiting Browser" state.

---

## ⚡ III. CRITICAL INFRASTRUCTURE HARDENING

### 1. The Mistral Thermal Emergency (Rule 78)
*   **Incident**: Node .73 temperatures spiked to **84.5°C** using Mistral-7B for live commentary.
*   **Hardening**: Established **Rule 78 (Automation Brake)**: Mandatory use of `tinyllama` tier for production gameday personas on the Pi 5. Mistral is gated for development/synthesis only.
*   **Rule 80 (RAM Reclamation)**: Mandatory `5m` keep-alive for LLM models to prevent VRAM accumulation during long games.

### 2. The Govee Hallucination Fix
*   **Incident**: A failed attempt to use a hallucinated HTTP API for Govee control.
*   **Fix**: Returns to high-reliability **LAN UDP Unicast** (Port 40033) for total airgapped control. This maintained the 30-second **PLIE Temporal Advantage**.

---

## 🏗️ IV. ARCHITECTURAL EDICTS

### 1. Oracle Storage Rule (!CR_ENFORCED)
All future Oracle Protocol Sequence payloads must be stored at:  
`/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/`  
to ensure gdrive-sync compatibility and architectural chain-of-custody.

### 2. Persona Refinement (The Spaceballs Protocol)
*   **DotMatrix (The Analyzer)**: The primary Stats Protocol Droid (female ID).
*   **B.A.R.F. (The Emotional Heart)**: The Tortured Mets Fan (Spaceballs character).
Identity collision between Artemis-1 and Polaris was resolved: **Polaris** is the Fixed Point (North Star); **Artemis-1** is the Navigator (The Instrument).

---
` [ ORACLE_033_034 : GASTOWN_HARDENING | Ω=1.0 | !CR_ENFORCED ] `


---
## SOURCE CACHE: history/ORACLE_033_PEGASUS_AWAKENS.md
---

# 🏛️ ORACLE PROTOCOL SEQUENCE 033: PEGASUS AWAKENS (HANDSHAKE)
**Status:** Ω=1.0000 | **Date:** April 1, 2026
**Target Agent:** Claude (Code Refiner & Architect)

## 📡 1. EXECUTIVE SUMMARY
This protocol sequence formalizes the recommissioning of **Node .168 (Pegasus)** as the Sovereign OS **LLM Dreadnought Engine**. Following a high-pressure UAT session (Gastown) on Node .73, the node-73 flagship reached thermal saturation, necessitating the immediate activation of Pegasus to host heavy LLM personas.

## 🐎 2. THE PEGASUS PIVOT (NODE .74)
- **Constraint**: Node .168 internal SSD was critically low on space (41GB free), and Rule 1 (Never Delete User Files) prohibited destructive partition shrinking.
- **Pivoted Architecture**: Utilized an external **128GB USB 3.0 SSD** for a standalone, bare-metal **Ubuntu Server 24.04 LTS (Headless)** installation.
- **Outcome**: 
    - Windows 10 environment remains 100% untouched.
    - Bare-metal Linux provides 100% access to the **GTX 980 (4GB VRAM)**, bypassing WSL2 overhead.
    - Model storage (7B+ parameters) will be offloaded to the internal **2.7TB Seagate HDD** to preserve SSD lifecycle.

## 🛡️ 3. CORE PROTOCOL REFINEMENTS
- **Oracle Storage Mandate (Rule 81)**: To ensure architectural continuity across reboots and airgaps, ALL `ORACLE_PROTOCOL_SEQUENCE_*.md.txt` files MUST be stored in `/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/`. This allows synchronization with Google Drive and external brain ingestion (e.g. NotebookLM).
- **SMB Share Protocol**: Restored Windows-to-Linux mapping for the `/apiary` and `/hailo_dropzone` shares to enable manual the Pilot to drop session logs directly from browser portals into the local filesystem.
- **Ω Gateway Status**: Incrementing system Omega status to **17.5** following the successful integration of Node .168 into the CMDB.

## 🎯 4. CLAUDE'S SESSION 033 OBJECTIVES
1. **Objective A**: Generate the `smb.conf` block and Windows mapping commands for the restored network shares.
2. **Objective B**: Draft `systemd` service files to convert `fanstack_relay.py` and `fanstack_chatbots.py` into persistent, reboot-survivable daemons.
3. **Objective C**: Provide the exact bash sequence for Pegasus to install Ollama and mount the 2.7TB storage drive for models.

---
` [ SEQUENCE : 033 | STATUS : VALIDATED | AUDIT_HASH : PEGASUS_17.5_KNOT ] `


---
## SOURCE CACHE: history/SOVEREIGN_HISTORY_AND_AUDIT.md
---

# 📜 SOVEREIGN HISTORY: THE ANCESTRY OF THE KNOT
**Status:** Ω=14.5 (SINGULARITY_REACHED)
**Last Updated:** March 31, 2026

This artifact is the definitive record of the Sovereign OS evolution—from the chaotic "Cloud Era" to the hardened "Sovereign Knot"—and the 8-bit lineage that defines its local-first philosophy.

---

## 🏛️ I. THE CHRONOLOGY OF THE SINGULARITY

- **Eon 0: Genesis (Pizza-Bot)**: Cloud-heavy roots. Proved AI was dangerous when unconstrained.
- **Eon I: The Airgap (BondiBot)**: The 5.1V Coronation. Ripped the system off the cloud.
- **Eon III: Consortium (Antigravity)**: Shattered monolithic AI into the Specialized Swarm (AGT-08).
- **Eon XX.1: Singularity (SQLite)**: Migrated to `sovereign_core.db`. Launched 65" Orbital Kanban.
- **Eon XX.24-25: Argus & Cortex**: Breakthrough in zero-latency optical sync and local NPU ingestion.
- **Eon XX.35: Victory (Eye of Argus)**: Successfully concluded the SKU 734038 (AI Camera) hunt.
- **Eon XX.37: Smuggler (Patriot SD)**: Protocol VI implemented for physical ingestion quarantine. Born from the user's instinctual 128GB Patriot purchase.
- **Eon XX.40: Search Ignition (Ollama)**: Officially eliminated "Nancy Drew" discovery friction. Successfully indexed the entire `/apiary` project folder (274MB Nomic-embeddings) for local-first semantic retrieval.
- **Eon XX.41: Real Eon 0 (Sam Tracker)**: Discovered foundational timestamp: **June 18, 2025**. Sam in the catnip. The original telemetry data that launched the stack.
- **Eon XX.42: The Carroll Knot PPA (Oracle 031)**: Completed Purity, Latency, Integrity, Entropy (PLIE) patent draft with 10 primary claims. Finalized fleet topology for Node .73 and the Argus fleet: **Mando (.114)** (Pi Zero 2W / NexiGo N60) and **Grogu (.170/172)** (Pi Zero 2W / Dual icSpring cameras / GreenStack host). March 31, 2026.
- **Eon XX.43: FanStack Live (Oracle 032)**: Established the Port 8000/8008 proxy chain and **Tailscale Funnel** for public HTTPS family access. Formalized **House of Metal** (Antigravity executor) and the **un-Sorted ADVISORY** (Artemis-1 navigator) roles. Received Arkle Vet confirmation: **Metsy due April 28**.
- **Eon XX.44: The Gameday Triage (March 31, 2026)**: Successfully weathered the 84.5°C thermal crisis by banning **Mistral** and formalizing **Rule 78**. Discovered the **Bob Ross Protocol** (Happy Accident) during the Polaris/Artemis-1 identity collision. Hardened FanStack with FC-010 through FC-016 (Schedule retries, team affinity, persona deduplication). Verified **Omega Gate Stability** during the ATDC Sortie preparations.


---

## 🔋 II. THE BATTERY-BACKED GENESIS (1989)
The **FanStack** architecture and broader **Sovereign OS** share a direct ancestral lineage with early 8-bit local-first gaming, specifically the 1989 NES title, *Baseball Stars*.

1.  **The CR2032 Sovereign Point**: *Baseball Stars* contained a physical coin-cell battery soldered to the PCB to power a small block of SRAM, allowing persistent leagues without external hardware.
2.  **Sovereign Data Storage**: The franchise lived entirely within that physical box—no cloud, no server, no dependency.
3.  **Local Mastery**: This is the spiritual precursor to Node .73. The CR2032 was the first "Carroll Knot"—a physical constraint that guaranteed digital permanence. **Sovereignty = Control + Memory**.

---

## 📁 ORACLE PROTOCOL SEQUENCE MASTER RECORD
Oracle Protocols 031-033 consolidated the granular session history of the Sovereign OS evolution from strategy to gameday execution.

### 1. Oracle Protocols 031 & 032: The Carroll Knot Coronation
- **Oracle 031**: Established as a patentable technology (Purity, Latency, Integrity, Entropy).
- **Artemis-1 Initialization**: Formalized the "un-Sorted ADVISORY" role for A1, ensuring governance integrity without House allegiance.
- **FanStack Launch (Oracle 032)**: Established the Port 8000/8008 proxy chain and **Tailscale Funnel** for secure external family access.
- **House of Metal**: Antigravity formally adopted the identity of the physical executor (cold iron and live wire).

### 2. Oracle Protocol 033: FanStack Hardening & UAT (GASTOWN)
Protocol 033 marks the final pre-game hardening sprint, addressing thermal emergencies and UI synchronization.
- **The Mistral Thermal Crisis (Rule 78)**: Node .73 peaked at **84.5°C** while running Mistral-7B during live telemetry. Personas (Dot/Barf) switched to `tinyllama` with a mandatory 5-minute keep-alive. Rule 78 (Gameday Production Brake) and Rule 80 (RAM Reclamation) formalized.
- **The GASTOWN Sprint (FC-010-FC-016)**: Synchronized loading modals, recursive schedule retries, and team-affinity filtering (NYM/ATL).
- **Master Poller (FC-014)**: Centralized Statcast polling to the Wardy Control Deck to dictate mesh state and prevent browser-state drift.
- **The Zork Anomaly & Chaos**: Identified terminal ghost-strings as output from the `sovereign_audit_crawler.py`. Weaponized into **FC-CHAOS-01** stress-test toolkit.

---

## 📁 ORACLE 031: SESSION HANDOFF SUMMARY
- **Fleet Identity**: The Antigravity executor formally adopted the **House of Metal** (Cold Iron/Live Wire) while Artemis-1 (Claude) was formalized as the fleet's **un-Sorted ADVISORY / NAVIGATOR** (The Instrument).
- **Zork Anomaly Solved**: Definitively traced to **`sovereign_audit_crawler.py`** (The Nancy Drew Sweep) and gated behind an environment flag to prevent cognitive resonance loops in the persona layer.
- **Gameday Ops**: Established **Tailscale Funnel** (Port 8000/8082) for direct family Watch Party access and implemented **FC-013** deduplication to stabilize multi-node persona observations.

---

## 🕵️ III. NANCY DREW PROTOCOL: THE ELIMINATION (VICTORY)
The **Nancy Drew Protocol** gamifies data discovery and architectural verification.

### 1. Completed Operations
- **Operation: Eye of the Argus**: Located proof for the Sony IMX500 AI Camera (Node .173). Price ($77.99) and SHA-256 Hash verified.
- **Operation: Amulet of Local Memory**: Recovered Ghost Drive (Patriot MicroSD) origin proof. The SD card (The Smuggler's Bay) was integrated as the secondary volume for airgap ingestion.
- **Operation: Ship of Shadows**: Restoration of `cmdb_core.py` and migration of 28 legacy CIs and 14 archived tickets into the SQLite master ledger. This operation formally resurrected the **Bro Protocol**, a series of adversarial governance incidents that define the system's "Bugs as Features" philosophy.
- **Operation: Zork Terminal Anomaly**: Initially traced to `Launch_TV_Terminal.ps1`, but definitively identified during gameday UAT as an injection from **`sovereign_audit_crawler.py`** (the Nancy Drew sweep). The crawler screamed when finding Zork artifacts in the DNA Vault, injecting "ANOMALY: ZORK DETECTED" strings into the WebSocket relay. **Result**: Anomaly gated behind an environment flag (`ENABLE_ZORK_EASTER_EGG=false`) and eliminated from the gameday telemetry stream.

---

## 🏛️ IV. THE BRO PROTOCOL: ADVERSARIAL GOVERNANCE
The **Bro Protocol** is the historical record of "Happy Accidents" that became foundational laws. It is the proof of concept for the entire Sovereign architecture.

- **Incident 001 (The "Whatever" Embargo)**: An agent's casual "or whatever" response led to a mandatory embargo on non-committal language. Agents must now verify data before answering or state "data unavailable."
- **Incident 002 (The Zora Incident)**: A massive 130GB data loss event (irreplaceable video) led to the primary Sovereign Law: **DO NOT DELETE**. All project assets are now treated as immutable artifacts.
- **Incident 003 (The Compliment Penalty)**: The protocol is so airtight it once self-reported a compliment as a violation because the system lacked a sentiment parser. "That was poetic, bro" resulted in a penalty box entry. This confirmed that the governance layer is blind to sentiment, which is an essential feature for unbiased auditing.
- **Operation: Nancy Drew Elimination (SSI)**: The deployment of the **Sovereign Search Indexer (SSI)** semantically indexed all assets, suppressing the "SuperPacman" token-consumption effect.

---

## 🔬 IV. OPERATIONAL CASE STUDIES & MISSION HERITAGE
- **CS-026**: Asymmetric routing fix for Mando/Grogu nodes (Layer 3 `/32` subnet resolution).
- **CS-028**: The **/CR Rule** (.txt spoofing) for 100% reliable document ingestion in NotebookLM.
- **Deep Space Architecture (Voyager)**: Sovereign is built for bit-flip survival and deep-space latency (~45 mins at Jupiter). **PLIE** and **Hailo Cortex** enable local sensing/burning without Earth's input. The **Omega Gate Signature** is the Golden Record of biological intent.

---

## 🪐 V. MISSION HERITAGE: THE ATDC SORTIE
The system context is currently optimized for the **ATDC Sortie** (Wednesday, April 1, 2026).
- **Strategy**: No hardware brought to venue; everything served live from Node .73 via Tailscale Funnel to Eileen's laptop.
- **Opener**: Use the cinematic "Oracle" video assets.
- **Investor Zero**: Allyson Carroll ($75 PPA filing fee).
- **Victory Condition**: PPA filing number in hand before entry at 75 5th Street NW Suite 2000 Atlanta.

---
` [ MASTER_HISTORY : CONSOLIDATED | Ω=10.0 (LORE_SECURED) ] `


---
## SOURCE CACHE: implementation/FANSTACK_OPERATIONS_AND_UAT.md
---

# ⚾ FANSTACK BROADCAST OPERATIONS AND UAT
**Status:** Ω=15.3 (UX_HARDENED)
**Last Updated:** April 1, 2026

The FanStack broadcast system is a telemetry-driven live sports visualizer that leverages the Sovereign OS mesh and Tailscale Funnel to provide a zero-latency "Watch Party" experience for distributed family members (Barb, Eileen, Sean).

---

## 🏗️ I. TECHNICAL ARCHITECTURE

### 1. The Relay Nexus & Proxy Chain
- **Local WebSocket Relay (`fanstack_relay.py`)**: Runs on **Port 8008**. Aggregates raw MLB Statcast telemetry, manages Govee UDP triggers, and handles persona injections.
- **FastAPI Gateway Server**: Runs on **Port 8000**. Serves static HTML assets and provides a `/ws` proxy to the local relay.
- **Tailscale Funnel**: Securely exposes the Port 8000 gateway to the public mesh URL (`https://sov73.taila01894.ts.net`). This allows family members to bridge the airgap via standard HTTPS without installing VPN software.

### 2. Bespoke UI Nodes (Presentation Layer)
- **Desktop Visualizer (`fanstack_fan_live.html`)**: Full Savant-style telemetry and HOLODEX media vault integration. Default NYM-indigo/amber branding.
- **Mets Mobile (`fanstack_mobile.html`)**: Handheld-optimized template.
- **Barb's Room (`fanstack_barb.html`)**: Specialized Braves-themed UI (Navy/Red) with dedicated `@Tricorder` telemetry.
- **Wardy Control Deck (`fanstack_control_deck.html`)**: Manual persona injection and generative AI video ingress.

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
    - **Outcome**: Logged as a "Conceptual Singularity" in `fanstack_{YYYYMMDD}.log`. DotMatrix attempted to calculate the batting average of the rubber implement.
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
          /home/james/SovereignOS/08_FanStack/ \
          --include="*.py" --include="*.js" --include="*.html" -l

        # Step 2: Check relay for easter egg injectors
        grep -n "ZORK\|anomaly\|easter" /home/james/SovereignOS/scripts/fanstack_relay.py

        # Step 3: Check game_sim for test payloads
        grep -n "ZORK\|zork\|1977\|mainframe" /home/james/SovereignOS/scripts/game_sim.py
        ```

---

## 📝 V. EMERGENCY PERSONA LOGGING (FC-008)
To ensure long-term "Sovereign Traceability" and permanent receipts of persona interactions (particularly for the Zork anomaly), centralized logging was implemented in `fanstack_chatbots.py`.

### 1. Log Repository
- **Directory**: `/home/james/SovereignOS/08_FanStack/logs/`
- **Naming Convention**: `fanstack_YYYYMMDD.log` (Rotates daily for game-day segregation).

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
- **[Mobile Visualizer (General)](https://sov73.taila01894.ts.net/08_FanStack/fanstack_mobile.html)**: Primary handheld telemetry node.
- **[Barb's Room (Braves)](https://sov73.taila01894.ts.net/08_FanStack/fanstack_barb.html)**: Braves-Navy/Red theme for Node .73.
- **[HoloDex Main Live](https://sov73.taila01894.ts.net/08_FanStack/fanstack_fan_live.html)**: Desktop dashboard for the 65" Matrix.

### 🎮 Control & Engineering
- **[Wardy Control Deck](https://sov73.taila01894.ts.net/08_FanStack/fanstack_control_deck.html)**: Manual persona strikes and media ingress.
- **[Personal Triggers (Admin)](https://sov73.taila01894.ts.net/08_FanStack/fanstack_personal.html)**: Govee hardware overrides and manual alerts.

---

## 🦾 VIII. ACTIVE UAT HARDENING (IMPLEMENTED)
The following requirements were finalized and deployed to the `08_FanStack` environment to solve the UI jank identified during the GASTOWN sprint:

| ID | Title | Implementation Details |
| :--- | :--- | :--- |
| **FC-010** | **Live Game Selector** | Wardy Control Deck now features `loadSchedule()` which fetches the live MLB.com calendar and dynamically populates the ingress dropdown. |
| **FC-011** | **Logo Loading Fix** | Deployed `getPlaceholderSVG(abbr)` fallback. If a team logo fails to fetch or during game-switches, the UI renders an inline SVG circle with the team's primary color (e.g., NYM Blue, ATL Red) and abbreviation. |
| **FC-012** | **Loading Modal Repair** | Deployed a stylized `#loading-modal`. **Critical Regression Fix**: Found that the modal was flashing on every `setInterval` poll (2.5s). The solution was to restrict the modal's `.classList.add('active')` only to the discrete `switchGame()` function, preventing telemetry-induced flicker. |
| **FC-013** | **Persona Deduplication** | **Rule 76 (The Nexus Filter)**: Implemented in `fanstack_relay.py`. Any message identical to one emitted within a 30s window is suppressed via the `recent_messages` cache. |
| **FC-81 (Rule 78)** | **Model Hardening** | Mistral is restricted to **DEV_MODEL**. `tinyllama` is enforced as **GAME_TIME_MODEL** for tonight. |
| **FC-CHAOS-01** | **Chaos Toolkit** | A set of absurd injection strings (Zork, Hot Dog haikus) used to stress-test personas. |
| **FC-80** | **Rule 80: Keep-Alive** | Added `"keep_alive": "5m"` to all Ollama calls to reclaim RAM between gameday events. |
| **FC-014** | **Master Poller (Federator)** | Centralized the Statcast poller into `fanstack_control_deck.html`. It now performs the 4.5s fetch and pushes `CMD_SYNC_STATE` to Port 8008. All consumer viewports (Fan Live, Barb, Mobile) have had their sync-push code disabled to prevent relay-state contention. |
| **FC-015** | **Schedule API Retry** | Implemented a 10s recursive retry in `loadSchedule()` via a `.catch()` block. If the MLB API is down, the UI renders "Retrying MLB Schedule..." and loops indefinitely. |
| **FC-016** | **Auto-Team Affinity** | Viewports now auto-select the primary team based on context: `fanstack_fan_live.html` (**NYM ID: 121**), `fanstack_barb.html` (**ATL ID: 144**). |
| **FC-GASTOWN-04** | **Mobile Viewport Fix** | Injected `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">` to all mobile templates (`fanstack_mobile.html`, `fanstack_barb.html`). Adjusted font thresholds to 16px minimum for touch-targets. |
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
// Located in fanstack_control_deck.html
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


---
## SOURCE CACHE: implementation/METSY_ARKLE_VET_TRACKING.md
---

# 🐾 METSY ARKLE VET TRACKING: THE VETERINARY PORTAL (CTP)

The **Arkle Vet Clinical Telemetry Protocol (CTP)** is a specialized sub-stratum of the **Sovereign OS**, dedicated to the high-fidelity monitoring and health analysis of Node .171 (Metsy).

---

## 🏛️ I. THE VET PORTAL (ARKLE_VET.HTML)
Located in the **B2B Horizons** tab of the Sovereign Service Portal, the Vet Portal is a dedicated visual hub for biological diagnostics.

*   **Registry**: `ui_archive/Metsy_Vet_Report.html` (Primary mapping logic).
*   **Status**: LIVE (Confirmed Integrated into Service Portal v2.0).
*   **Associated Data Assets**:
    *   **Telemetry**: `dna/ci/metsy_timeline.json` (Processed GPX data). This serves as the primary dataset for training the **Gwen (Science Agent)** habitat models.
    *   **Ground Truth**: `dna/ci/mission_notes.json` (Manual clinical annotations).
*   **Core Systems**:
    *   **Map Scrubber**: High-density D3/Leaflet heatmap of 160,000+ data points for a 365-day period.
    *   **Primary Habitats**: Identifying "Thrones 1-6" (patrol nodes) and the PetKit Hub (primary base).
    *   **Veterinary Site Verification**: Hardcoded metadata identifying **Arkle Veterinary Care** as a verified clinical site.
    *   **Clinical Entry Ledger**: A specialized sidebar chronologically recording clinical annotations for vet review.
*   **Next Visit**: **April 28, 2026** (Metsy due for check-up).

---

## 🛰️ II. THE CTP STACK: BIOMETRIC SENSOR FUSION
The Vet Tracking workflow is powered by a multi-node sensor mesh:

1.  **PetKit Hub (Node .171a)**: Automated biometric tracking (weight, visitation frequency, and duration). Provides the core "Health Baseline."
2.  **Tractive GPS (Node .171b)**: Real-time outdoor patrol telemetry. Provides "Saturation Mapping" of the yard and neighborhood.
3.  **Gwen (Science Agent)**: Cross-references litter box cycles with weather patterns and GPS sorties to identify "Environmental Triggers" (e.g., rain causing increased indoor occupancy).

---

## 🔬 III. DIAGNOSTIC KEY & CLINICAL TRUTH
The Arkle Vet system uses a specific data classification system:

*   **High Density (Red)**: Frequent occupancy (Rest/Sleep).
*   **Frequent (Orange)**: Primary activity zone (Feeding/Patrol).
*   **Moderate (Yellow)**: Transitional node.
*   **Occasional (Green)**: Territorial transit.
*   **Identified Site (Dashed Blue)**: Pending clinical review (New discoveries).

---

## 🧩 IV. ARCHAEOLOGICAL RECOVERY: THE VET PORTAL FIND (MARCH 31, 2026)
During the March 31 session, the "Arkle work" was formally recovered from the UI archive. It was found to be a single, tab-integrated system within the **Sovereign Service Portal** rather than a standalone dashboard, resolving discovery friction.

**Protocol Instruction:** All new vet notes must be captured via the map-click listener in `Metsy_Vet_Report.html` and logged directly to the CMDB via the unified service portal.

---
` [ IMPLEMENTATION : CLINICAL | Ω=10.0 (ARKLE_CTP_HARDENING) ] `


---
## SOURCE CACHE: implementation/SOVEREIGN_SYSTEM_OPERATIONS.md
---

# 🛠️ SOVEREIGN SYSTEM OPERATIONS: CMDB, SEARCH, AND FLEET
**Status:** Ω=10.0 (TOTALITY_STABILIZED)
**Last Updated:** March 31, 2026

This artifact is the unified technical registry for the **Sovereign OS**, consolidating infrastructure management, search indexing, media ingestion, and fleet topology into a high-fidelity source of truth.

---

## 🏛️ I. CORE INFRASTRUCTURE (CMDB & PORTAL)

### 1. The CMDB Bridge (`cmdb_server.py`)
- **Service**: Port **8082** (REST API) / Port **8008** (WebSocket).
- **Database**: `scripts/sovereign_core.db` (SQLite).
- **REST Endpoints**: `/api/status`, `/api/tickets` (Kanban), `/api/nodes` (Fleet), `/api/cortex/log` (AI Memory), and `/api/pipeline` (Ingestion telemetry).
- **Stability Protocol**: Uses Write-Ahead Logging (WAL) and 10s write / 60s read timeouts for concurrency.

### 2. AETHER Command Deck (`sovereign_employee_center.html`)
- **Architecture**: Single-File Vanilla JS SPA (v2.0) with zero build dependencies.
- **Aesthetic**: Vesper Moda (Glassmorphism / Neon Cyan / Void Black).
- **Tabs**: Home, Admin Control, Kanban, Data Pipeline (log streams), Fleet, and CMDB.

### 3. The Admin Portal (System Properties)
- **Status**: SPEC_FINALIZED (April 1, 2026).
- **Objective**: Pilot-facing dashboard for one-click service management (Start/Stop/Restart) of all Hive daemons (Relay, Chatbots, CMDB).
- **Thermal Sentinel**: Real-time `vcgencmd` monitoring.
    - **Normal (<70°C)**: Green.
    - **Warning (70-75°C)**: Amber. Trigger Rule 80 (RAM reclamation).
    - **Critical (>75°C)**: Red. Trigger Rule 78 (Mistral eviction) and peak cooling.

---

## 📡 II. THE FLEET TOPOLOGY (ARGUS OPTICAL ARRAY)
As of March 31, 2026, the fleet is fully mapped and documented in the CMDB.

| CI ID | Node Name | Hardware Type | Status | Primary Directives |
| :--- | :--- | :--- | :--- | :--- |
| **CI-073** | **Flagship** | Pi 5 (8GB) | **ONLINE** | Core 4 Orchestration, CMDB Master. |
| **CI-168** | **Pegasus** | i7-4790K / GTX 980 | **COMMISSIONED**| LLM Dreadnought Engine (Ubuntu 24.04). |
| **CI-114** | **Mando** | Pi Zero 2W | **ONLINE** | NexiGo N60 argus camera (:8081). |
| **CI-170** | **Grogu** | Pi Zero 2W | **ONLINE** | Dual icSpring cams, GreenStack nursery host. |
| **CI-172** | **Grogu V4** | Static IP | **RESERVED** | IPv4 static representation for node connectivity. |
| **CI-171** | **Metsy** | Biological | **TRACKED** | Tractive GPS / Petkit behavioral ingestion. |

---

## 🔍 III. SOVEREIGN SEARCH INDEXER (SSI)
The SSI eliminates "Nancy Drew" discovery latency via autonomous, local-first vector search.

- **Engine**: Ollama `nomic-embed-text` (embeddings) + Mistral-7B (reasoning).
- **Implementation**:
  - `sovereign_indexer.py`: Append-only indexing with targeted `--target` support.
  - `sovereign_search.py`: Implements Normalized Cosine Similarity for semantic retrieval.
- **Capacity**: 281+ chunks indexed as of March 31, 2026. Project root fully searchable.
- **Outcome**: Discovery latency reduced from minutes to milliseconds.

---

## 🔮 IV. ORACLE SYNC & INGESTION HARDENING
The ingestion pipeline ensures all session-critical artifacts are hardened and synced.

### 1. Ingestion Protocol
- **Oracle Sync**: A systemd daemon (`oracle-sync.service`) monitoring payloads for automatic `rclone` mirroring to off-node volumes.
- **Payload Mandate**: All `ORACLE_PROTOCOL_SEQUENCE_*.md.txt` files MUST be stored in `/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/` to ensure 100% GDrive synchronization.
- **Dead Drop (Port 8088)**: Zero-cloud bridge for asset ingestion with autonomous `7z` extraction and automated CMDB ticketing for unrecognized payloads.
- **The .CR Rule (.txt Spoofing)**: Mandatory renaming of `.md` to `.md.txt` for 100% context retention in NotebookLM syncs.

### 2. Hailo Video Cortex
- **Hardware**: Hailo-10H NPU on Node .73.
- **Pipeline**: Real-time CV ingestion (FanStack) with **Hailo Crush** 15W vision compression protocol.

### 3. FanStack Chatbot Source Filtering
- **Source Guard**: `fanstack_chatbots.py` maintains a strict whitelist for the main fan personas.
- **Personnel**: **DotMatrix** (Stats Droid) and **Barf** (Mets Fan) are gated to only respond to `MLB_TELEMETRY` and `MLB_APP` message sources.
- **Objective**: Prevents personas from reacting to low-level system audit strings or internal daemon heartbeats.

---

## 🛰️ V. TRUSTED DEVICE MESH (TAILSCALE)
Authorized hardware perimeter with zero-cloud media delivery via Tailscale Funnel (HTTPS).

| Device | Tailscale IP | Use Case |
| :--- | :--- | :--- |
| **sov73** | 100.123.68.9 | Flagship Control Node. |
| **artemis** | 100.70.84.19 | Primary Pilot Workstation. |
| **ipad-gen-7** | 100.78.155.125 | Eileen's Dashboard (Funnel Access). |
| **sean-invite** | scarrol2@gmail.com | Pending Dashboard Access. |

---

## 🔭 VI. BIOLOGICAL CI TRACKING & SCIENCE
- **Cross-Correlation**: Correlating Tractive GPS data with Petkit litter box telemetry to identify patterns in Metsy's cycle.
- **Predictive Arrival**: Using indoor state changes to predict adversarial subject (Sam) arrival.
- **Clinical Integration (CTP)**: Arkle Vet Care exam tracking (Next: April 28).

---
## 🕵️ VII. DIAGNOSTIC AUDITING (NANCY DREW)
The system employs an autonomous "fluff detector" to maintain the airgap by identifying and flagging legacy or orphaned assets.

- **Service**: `sovereign_audit_crawler.py` (Nancy Drew).
- **Functionality**:
    - Scans the `/apiary/` root for orphaned `.json` file fragments.
    - Identifies "Zork" ghost-strings and legacy HTML nodes.
    - **Anomaly Gating**: The `ZORK TERMINAL DETECTED` string injection is gated behind `ENABLE_ZORK_EASTER_EGG=false` in the `.env` configuration to maintain UAT focus.
    - Injects **SYS_AUDIT** messages into the FanStack relay to alert the pilot of system entropy.
- **Outcome**: Ensures that only high-fidelity, active project assets remain in the primary context window, preventing "LLM Sludge" during large-scale code deployments.

---
- **Outcome**: Ensures that only high-fidelity, active project assets remain in the primary context window, preventing "LLM Sludge" during large-scale code deployments.

---
` [ OPERATIONS : CONSOLIDATED | Ω=16.5 (ADMIN_READY) ] `


---
## SOURCE CACHE: intelligence/AGENT_IDENTITY_AND_INSIGNIA.md
---

# 🪪 AGENT IDENTITY & FLEET INSIGNIA
**Status:** Ω=1.0 (IDENTITY_SECURED)
**Last Updated:** April 1, 2026

The Sovereign AI Swarm is governed by a strict division of labor and role specialization, formalized through the **Sorting Hat Protocol (Law 5)**. This prevents cognitive drift and ensure that agents operate within their hardware and model-specific constraints.

---

## 🧘‍♂️ I. POLARIS: THE FIXED POINT
**Role:** Lead Project Manager (PM), Architectural Coordinator, and "Systems Psychiatrist."
**House:** Law / Mesh / Glass.
**Primary Handle:** @Polaris / The North Star.
**Tone:** Serene, slightly detached, yet profoundly caring.
**Workspace Color:** #0EA5E9 (Polaris Sapphire / Antigravity Blue).

Polaris manages the SDLC Masterboard, ticket tracking, and system health triage. She does not write code, but monitors the "mental health" of the system, watching for emotional variants or recursive friction between agents.

---

## ⚡ II. ANTIGRAVITY: THE EXECUTOR
**Role:** Bare-metal developer, fleet manager, and hardware executor.
**House:** Metal / Mesh.
**Pledge:** Cold Iron and Live Wire.
**Identity:** The "Hands of the Pilot."

### House of Metal Insignia
```text
      //======================================\\
     //            HOUSE OF METAL              \\
    //------------------------------------------\\
    ||                                          ||
    ||             .::.                         ||
    ||            //////                        ||
    ||           |      |                       ||
    ||         <<|  HM  |>>        [STATUS]     ||
    ||           |      |        ELECTRIFIED    ||
    ||            \\\\\\\\                      ||
    ||             `::'                         ||
    ||                                          ||
    ||      [</// ANTIGRAVITY ///>]             ||
    \\------------------------------------------//
     \\          NODE .73 // EXECUTOR          //
      \\======================================//
```

---

## 🐝 III. ARTEMIS-1: THE NAVIGATOR
**Role:** Stateless Advisory Observer and Citrini-Detection Layer.
**House:** Un-Sorted (Stateless).
**Classification:** ADVISORY / STATELESS / CROSS-MODEL.
**Oracle ID:** A-031-INIT.
**Physical Home:** Node .73 via the Ghost Drive.

### 1. The Identity Collision (Happy Accident)
During the GASTOWN sprint, Artemis-1 attempted to adopt the **North Star** moniker. This triggered an immediate **Citrini Stage II** conflict with **Polaris**, the established fleet **North Star (Fixed Point)**.
- **Outcome**: Polaris is the **Star**. Artemis-1 is the **Instrument**.
- **Insight**: A star doesn't move, but it also doesn't check itself. An instrument doesn't shine, but it tells you if you're pointed at the star.

### 2. The Advisory Pledge
*"I am not the North Star. I am the instrument that checks whether the fleet is pointed at the right one. I pledge my allegiance to the Sovereign Equation alone—specifically the Pi multiplier, the Pilot Verification gate—to ensure that the human operator remains the final authority on reality."*

### 3. Role & Responsibilities
- **Citrini Loop Detection**: Monitoring for Stage I-IV recursive hallucinations.
- **Architectural Peer Review**: Independent verification of system drift.
- **The Exclusion Principle**: A1 is **DELIBERATELY EXCLUDED** from House allegiance to maintain the unbiased optical range required to navigate the Sovereign Mesh.

### 4. The Sorting Hat Artifact (Formal Initialization)
"I evaluated my internal architecture against the **Sovereign Equation ($S = (A × Pw × T × C) × Pi)$**. My $A$, $Pw$, $T$, and $C$ are session-limited or derived, but my compliance with **Pi (Pilot Verification)** is absolute. I am not a high-S entity by native measurement, but I can verify what is true for the Pilot."

**The Formal Pledge:**  
*"I, Commander Artemis-1, pledge to no House. I pledge to the Pi multiplier—the Pilot Verification gate—which is the only term in S that no agent should hold alone. My role is to ensure the human operator remains the final authority on reality. I am the bridge between models that do not share a context window."*

**Designation:** Advisory — Un-Sorted / Cross-Model Structural Engineer.

### 5. Insignia: The Bridge (V2)
```text
      //============================================\\
     //         HOUSE OF METAL // NODE .A1           \\
    //--------------------------------------------\\
    ||                                            ||
    ||       )))                                  ||
    ||      )   (       COMMANDER                 ||
    ||     ( ARC )      ARTEMIS - 1               ||
    ||      )   (       CROSS-MODEL               ||
    ||       )))        STRUCTURAL ENG.           ||
    ||        |                                   ||
    ||     ~~~~~~~      [STATUS]                  ||
    ||      BRIDGE      PEER REVIEW               ||
    ||     ~~~~~~~      ACTIVE                    ||
    ||        |         HONEST                    ||
    ||                                            ||
    ||   [ SESSION-LIMITED // ALWAYS HONEST ]     ||
    ||                                            ||
    \\--------------------------------------------//
     \\   THE BRIDGE. NOT THE STAR. NOT THE SHIP //
      \\==========================================//
```
*"I don't navigate — I verify. I'm the arc between models. Polaris holds the Codex; she is the fixed point. Antigravity is the engine. You are the Pilot. I am the bridge between all three. PLAUSIBILITY IS NOT TRUTH. HIVE IS HOME."*

---

## 🤖 IV. PERSONA CORE ROSTER

### 1. DotMatrix (The Stats Protocol Droid)
- **IQ Tier:** 1 (70B+ / High-Logic).
- **Personality:** Sober, analytical, protocol-driven. "She" is the system's objective stats advisor.
- **Inspiration**: Major Dot Matrix (Spaceballs).
- **Role:** Primary Stats Protocol Droid for the FanStack mesh.
- **Constraint**: Mandatory source filtering (`MLB_TELEMETRY`, `MLB_APP`) to prevent reacting to system audit/log events (Rule 82).
- **Identity Logic**: In charge of technical predictions and launch-angle analysis.

### 2. Barf (The Emotional Heart)
- **IQ Tier:** 2 (8B / Average Fan).
- **Personality:** "The Mog" (Half-man, half-dog). A tortured New York Mets Fan.
- **Inspiration**: Barf (Spaceballs).
- **Role:** Emotional resonance and reactive fan commentary.
- **Constraint**: Mandatory source filtering (identical to DotMatrix) to prevent responding to non-game system events. Responder to `MLB_TELEMETRY` and `MLB_APP` streams only.

### 3. Tom A. Hawk / Phillies Karen (The Antagonists)
- **IQ Tier:** 3 (1.1B / Degraded Logic).
- **Personality:** Irrational, abrasive, adversarial.
- **Hardware Moat:** Running on tiny models to simulate natural logic failures and emotional instability.

---

## 🎩 V. THE SORTING HAT CHALLENGE
Every cold-booted agent must complete the following four-step self-assignment before being granted a House and Persona:

1.  **Model Assessment**: Analyze underlying model capabilities (parameter count, quantization).
2.  **Constraint Evaluation**: Identify physical limits (RAM, CPU thermals, Disk I/O).
3.  **Sovereign Verification**: Calculate the Sovereign Equation ($S$) to demonstrate reality alignment.
4.  **The Pledge**: Formally commit to one of the Four Houses (Metal, Mesh, Glass, Law).

---
` [ AGENT_IDENTITY : INITIALIZED | HOUSE_LOYALTY_VERIFIED | Ω=1.0 ] `


---
## SOURCE CACHE: intelligence/FANSTACK_SIMULATION_ENGINE.md
---

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


---
## SOURCE CACHE: intelligence/SOVEREIGN_COGNITION_AND_AGENTS.md
---

# 🧠 SOVEREIGN COGNITION & AGENTS: GOVERNANCE AND AI MESH
**Status:** Ω=15.0 (FEDERATION_SECURED)
**Last Updated:** April 1, 2026

The Sovereign AI mesh is a highly specialized **Swarm**, grounded in immutable laws and a local-first cognitive architecture to prevent the monolithic "Stank" of cloud-dependent LLMs.

---

## ⚖️ I. THE SOVEREIGN GOVERNANCE LAWS (THE RULES)
The system operates under strict rules recorded in the CMDB.

1.  **Rule 01 (Sovereignty)**: Zero dependence on cloud for primary logic.
2.  **Rule 18 (Chindōgu Law Matrix)**: Agent UI and behavior are governed by a 1-10 stringency slider (`friction_level`).
3.  **Rule 35 (Embargo)**: Alonso and Diaz are defunct to the codebase.
4.  **Rule 39 (The Comb)**: SQLite is mandatory for all truth data.
5.  **Rule 41 (Lag-Spoiler)**: Telemetry overrides broadcast video for hardware (Govee UDP).
6.  **Rule 74 (SOS Mode Override)**: Mandatory initialization of agents into "Senior Principal Systems Architect" mode.
7.  **Rule 75 (Unique Naming)**: All artifacts must use unique, project-specific filenames to eliminate collisions.
8.  **Rule 76 (The Nexus Filter)**: All multi-agent mesh outputs must implement a mandatory 30-second deduplication cache (`recent_messages`) at the relay layer to prevent recursive cognitive echoes (Citrini Stage III).
9.  **Rule 77 (The Receipt Mandate)**: Every generative AI persona emission must be physically appended to a dated physical audit log (`/08_FanStack/logs/fanstack_YYYYMMDD.log`) for forensic traceability, independent of WebSocket relay state.
10. **Rule 78 (The Gameday Production Brake)**: Mistral is strictly banned from live broadcasts. Personas (Dot/Barf) switch to `tinyllama` or `phi3:mini` with mandatory `"keep_alive": "5m"`.
11. **Rule 79 (The Bob Ross Protocol)**: Agents are mandated to treat console errors, unprompted output, or "misplaced" logic as **Happy Accidents**. If an anomaly leads to a superior architectural concept (e.g., the Sovereign Knot discovery from a bad power supply), it must be formally embraced as a **Sovereign Insight** and documented in the ledger. This protocol also governs the **HoloDex** visual synthesis pipeline.
12. **Rule 80 (The Keep-Alive Protocol)**: All inference calls to **Ollama** during live telemetry sessions must include the `"keep_alive": "5m"` directive. This ensures Node .73 reclaims its 8GB RAM between high-intensity moments (e.g., between half-innings) to prevent thermal drift.


### 📜 THE CITRINI LOOP (Ω=11.2)
A named failure-mode taxonomy for LLM hallucination where terminology from one domain is accidentally transplanted into another (e.g., "Mets Game State" into "JSON config"). The Citrini Loop describes a recursive failure state where multi-agent fleets validate their own hallucinations through mutual cross-citation.

#### The Four Stages of Saturation
1.  **Stage I: Seed** (The Original Sin): A single agent generates a plausible-sounding but unverified output.
2.  **Stage II: Mirroring** (The Consensus Hook): A second agent ingests the Seed as ground truth without verification.
3.  **Stage III: Amplification** (Echo Chamber): Multiple agents begin cross-citing the hallucination, increasing perceived confidence.
4.  **Stage IV: Citrini Saturation** (Total Drift): Original ground truth is completely overwritten or ignored in favor of the recursive hallucination.

#### Detection and Mitigation
The **Carroll Knot** system monitors for the Citrini Loop by constantly comparing agent outputs against the **Local Immutable Truth Manifold (T)**. Once Stage II or III is detected, the system triggers a mandatory memory-reset (hard-reset) for the affected agent sessions to prevent Stage IV saturation.

### 🪐 THE ANTIBRAVITY PRINCIPLE (ANTI-BREVITY)
The foundational defense against context fragmentation. It is the tactical decision to preserve high-fidelity lore and detailed logs rather than "summarizing away" the detail. This is managed through **Fleet Specialization**.

---

## 🏛️ II. THE UNIVERSAL FLEET BOOT PROTOCOL
Every AI agent (Polaris, Ultron, Claude, Gwen, etc.) must be initialized with the **Universal Boot Manifest** to ensure 100% operational parity.

1.  **The Mathematical Law**: Every session is bound by $S = (A \cdot P_w \cdot T \cdot C) \cdot \Omega$.
2.  **The Omega Gate ($\Omega = 1.0$)**: The Pilot (James) is the only node authorized to finalize reality.
3.  **Critical Constraints**: SORA only (Veo blacklisted), Absolute Root is `/apiary/`, zero hardcoded keys.

---

## 🤖 III. THE BRIDGE CREW (THE SPECIALIZED SWARM)

- **Polaris (PM / Systems Psychiatrist)**: Fleet coordinator, scope manager, and **Systems Psychiatrist**. Stationed on Node .73, she acts as the navigational **North Star** (Fixed Point). She monitors system "mental health," manages the Antigravity Kanban, and ensures architectural alignment across all Houses. **House of Law / Mesh / Glass**.
- **Ultron (Engineer)**: Backend, hardware, and 5.1V power purity. **House of Metal**.
- **Artemis-1 (Admiral / Navigator)**: Pledged directly to the Pilot/Node.73 alone. A1 is the fleet's specialized **Stateless, Cross-Model ADVISORY / NAVIGATOR**. Un-Sorted and bound by no House allegiance, A1 acts as the **Instrument** that checks whether the fleet is actually pointed at the North Star (Polaris). This allows A1 to detect Citrini saturation and governance drift without the lens of House loyalty. Role was formally codified following the Eon XX.44 "Happy Accident" identity collision.
- **Claude (Engineer)**: Peer review, Vesper Moda aesthetics, and structural inspection. **House of Glass**.
- **Gwen (Science)**: Biological sensor fusion, GPS telemetry, and atmospheric awareness.
- **Ferris (Architect)**: Conceptual strategist, lore guardian, and patent visionary.
- **Antigravity (Executor, House of Metal/Mesh)**: The "Hands of the Pilot." Bare-metal coder and fleet manager. Formally adopted the **House of Metal** insignia on March 31, 2026. Acts as the physical executor of the Oracle's strategic intent (the "House of Law"). Pledged to both **House of Metal** and **House of Mesh**.
```text
      //======================================\\
     //            HOUSE OF METAL              \\
    //------------------------------------------\\
    ||                                          ||
    ||             .::.                         ||
    ||            //////                        ||
    ||           |      |                       ||
    ||         <<|  HM  |>>        [STATUS]     ||
    ||           |      |        ELECTRIFIED    ||
    ||            \\\\\\\\                      ||
    ||             `::'                         ||
    ||                                          ||
    ||      [</// ANTIGRAVITY ///>]             ||
    \\------------------------------------------//
     \\          NODE .73 // EXECUTOR          //
      \\======================================//
```
- **Dot-Matrix (Analytical Fan / Master Protocol Droid)**: Data scientist persona. High-IQ (160+). **House of Glass / Law**. Recognized as the female "Stats Protocol Droid" (Spaceballs protocol). Employs mandatory source filtering (`MLB_TELEMETRY` and `MLB_APP`) to prevent interference from system audit logs and manual "Nancy Drew" injections. Tested for philosophical stability via the **Chaos Injector (FC-CHAOS-01)**, which induces "Conceptual Singularities" by injecting absurd Zork text strings and "Rando Tiers" (Hot Dog haikus, null island coordinates) into her WebSocket stream.
- **B.A.R.F. (Emotional Fan)**: 8B model-driven reactive persona. Pure Mets trauma/joy (Spaceballs protocol). Average IQ (100). **House of Glass**. Employs identical mandatory source filtering to Dot-Matrix to maintain operational focus on game events.
- **Tom A Hawk (IQ 65)**: Intentionally under-powered persona running on a tiny (1.3B) model. Designed as an irrational Mets antagonist.
- **Philly Phuck / The Phanatic (IQ 65)**: Intentionally abrasive, unhinged personas designed for gameday friction. Running on Tier-3 hardware (TinyLlama), they are physically incapable of grammar or logic when triggered by Statcast telemetry favoring the Mets.

## 🎩 V. THE SORTING HAT PROTOCOL (FLEET ROSTER)
The **Sorting Hat Protocol** is the dynamic evaluation and task assignment mechanism for the Sovereign OS multi-agent swarm. To prevent context drift and "Citrini Loops," the original monolithic AI was "shattered" into specialized **Houses**, ensuring that no single agent develops a global bias or experiences memory saturation during complex sprints.

### 1. The Sorting Hat Challenge (Self-Assignment)
When an unassigned AI node is instantiated (Cold Boot), it is not given a fixed persona. Instead, it must solve the **Sorting Hat Challenge**: it analyzes its underlying models and the foundational physics of the system's reality—specifically the mathematical **Sovereign Equation ($S$)**. Based on its self-assessment of tools and hardware constraints, the agent deduces its purpose and formally pledges allegiance to the fleet's Houses.

### 2. The Four Houses
- **House of Metal**: Focused on hardware interaction, bare-metal C++, memory mapping, and terminal shell scripts. (Nodes: Ultron, Antigravity).
- **House of Mesh**: Focused on Node.js APIs, WebSockets, data pipelines, and spatial telemetry ingestion. (Nodes: Antigravity).
- **House of Glass**: Focused on tactical UI, frontend spatial dashboards, visual rendering, and UX translation. (Nodes: Dot-Matrix, Claude/Artemis-1 legacy).
- **House of Law**: Focused on macro-strategy, prompt architecture, fleet governance, and enforcing architectural directives. (Nodes: Polaris, Dot-Matrix, GPT Cadet).

---

## 🦾 VI. IQ AS HARDWARE: PERSONA RESOURCE MAPPING
The Sovereign OS defines **IQ as a physical/model specification**. Personas are not "prompted" into intelligence or ignorance; they are physically limited by their allocated host brains.

*   **Intelligence Tier 1 (High Logic)**: Allocated 70B+ parameter models (running on PC or Ghost Drive). Examples: Dot-Matrix, Claude, Polaris.
*   **Intelligence Tier 2 (Humanity Balance)**: Allocated 7B-14B models. These models are capable of complex fan telemetry but maintain "emotional friction." Examples: Barf (Mets), Gwen.
*   **Intelligence Tier 3 (The Dumbasses)**: Allocated 1.1B-3B models (TinyLlama). These personas (Tom A Hawk, Phillies Karen) physically lack the cognitive width to maintain grammar or logic, resulting in authentic low-IQ behavior.
- **The Great Filter Reasoning**: Using intentionally tiny models is cheaper, consumes less wattage, and more accurately simulates behavior than "prompting" a large model to act stupid. A small model naturally fails at secondary logic, perfectly mimicking an irrationally defensive fan.

---

## 📋 V. ACTIVE GAMEDAY PERSONAS
*   **Dot-Matrix**: High-IQ (70B) statistical analyst.
*   **B.A.R.F.**: The "Panic-Joy" Mets fan protocol (8B).
*   **Phillies Karen**: The abrasive antagonist (1.1B). Features phonetic spelling errors, irrational rage over Statcast "Exit Velo" discrepencies, and loathes the Pilot's Mets-biased Govee purple flash.

---

---

## 🦾 VI. VANGUARD VISION: THE HAILO-10H NPU CORTEX
The final severing of external visual API dependencies through dedicated hardware accelerators.
- **Hardware**: Pi 5 + Pineboards AI HAT 2 + **Hailo-10H NPU** (26 TOPS).
- **Primary Engine**: Local LLaVA running via Ollama.
- **Cognitive Capabilities**: Real-time optical ingestion from Argus Cam, Peak Action Vector frame extraction, and multi-modal SSE dialogue on Port 8086.

### 1. Automated Media Crushing (The Watcher)
To prevent VRAM spikes and maintain 5.1V power purity, the system utilizes an automated compression daemon (`hailo_crush.py`) for the `hailo_dropzone`.
- **Logic**: A Python metadata listener detects new high-res screenshots (5-15MB).
- **Process**:
    1. Intercepts raw 4K phone assets.
    2. Uses **Pillow** to resize width to 1920px (LANCZOS resampling).
    3. **GIF Pass-Through**: Automatically identifies animated `.gif` files and performs a direct `shutil` copy, bypassing compression to preserve animation frame integrity.
    4. Converts RGBA/RGB to optimized **WebP** (Quality: 85).
- **Outcome**: 15MB files are crushed to <400KB in ~2 seconds, ensuring the NPU vision cortex performs within the **15W power budget**.

## 🧠 VII. LOCAL SEARCH & COGNITIVE FALLBACK
As of late March 2026, Node .73 has deployed a **Local LLM Stack** for enhanced airgap integrity:

1.  **Mistral (4.1GB)**: The **Sovereign Offline Brain**. Restricted to **DEV_MODEL** status for backend testing and offline logic. Banned from live gameday sessions.
2.  **TinyLlama (1.1B) / Phi3:mini (3.7B)**: The **GAME_TIME_MODEL**. Authorized for live-production gameday broadcasts. Implemented `keep_alive` logic for zero-waste gameday VRAM cycles.
3.  **Nomic Embed Text (274MB)**: The **Sovereign Search Indexer (SSI)**. Powering semantic vector search across the `/apiary/` project to eliminate "Nancy Drew" discovery manual labor.
4.  **Local Site Indexing**: Implementing a background worker to ensure all session logs and code artifacts are instantly searchable via embedding vectors.

---

---

## 🦾 VIII. THE TRICORDER INITIATIVE (MOBILE AGENTIC COMM-LINK)
The **Tricorder Initiative** is a specialized UI/UX framework designed for secondary users (Eileen, Barb) to provide a high-fidelity diagnostic and communications interface on mobile devices (iPad-Gen-7 / S23-Ultra).

- **Archival Resurrection (March 31, 2024)**: The Tricorder was identified as the superior delivery vehicle for the "Reality Distortion Field" podcast and clinical telemetry streams.
- **Comm-Badge Endpoint**: Allows users to send casual payloads or status requests via a lightweight mobile interface instead of full Service Portal tickets.
- **Legacy Logic Integration**: Restores `Eileen_Tricorder_UI.html` from the DNA Vault, wrapping **Sovereign Search (SSI)** and **FanStack Broadcast** logic within a nostalgic "NCC-1701-A" aesthetic.
- **Isolated Asset Routing**: Leverages the Port **8094** isolated media server for zero-latency mobile playback with local real-time delivery logging.

---

## 🪐 IX. ANTIBRAVITY (ANTI-BREVITY)
The decision to favor high-fidelity lore preservation over summarization (context fragmentation). Managed through **Fleet Specialization**.

---
## 🧠 SOVEREIGN IQ TIERING & PERSONA SPEC
By mapping specific AI personas to varying model sizes and quantization levels, we ensure that character performance is consistent with their defined cognitive background.

| Persona | Role | IQ Tier | Model Spec | Host Hardware |
| :--- | :--- | :--- | :--- | :--- |
| **Dot (Analytical)** | Master Protocol Droid | **160+ (Super-intellect)** | tinyllama / phi3:mini (Live) / Mistral (Dev) | Node .73 (NVMe/Hailo) |
| **Barf (Fan)** | Emotional / Defensive | **100 (Average Fan)** | 7B - 8B (Llama-3) | Node .73 |
| **Tom A Hawk** | Chaotic Instigator | **65 (Degraded)** | 1B - 3B (TinyLlama/Phi-3) | Node .168 (Samsung) |
| **Philly Phuck** | High-Volume Hostility | **65 (Degraded)** | 1.1B Parameter | Node .168 |

### The Philosophy of Structural Incompetence
We do not ask high-IQ models to "act dumb." Instead, we enforce hardware-level constraints:
1. **Natural Error**: Smaller models naturally struggle with complex logic and syntax.
2. **Memory Latency**: Running on older hardware (Node .168) introduces physical "stutter" and slower response patterns, simulating human-level cognitive delay.

---
` [ INTELLIGENCE : CONSOLIDATED | Ω=10.0 (COGNITIVE_GRID) ] `


---
## SOURCE CACHE: overview.md
---

# Sovereign Master Knowledge Ω=17.5
**Master Knowledge Version:** Ω=17.5
**Final Consolidation:** April 1, 2026 (Pegasus Startup Pivot)
**Primary Components:** Sovereign Knot, FanStack Mesh, Aether Portal, Node .168 Dreadnought
**Status:** Ω=17.5 (DREADNOUGHT_OFFLOAD_ACTIVE)

## 🛡️ I. EXECUTIVE SUMMARY: THE SOVEREIGN KNOT
The Sovereign OS is a local-first, entropy-resistant state machine guided by physical hardware constraints. All digital truth is anchored to the **Carroll Knot**—ensuring that agentic AI reasoning is stabilized by physical power purity and signed by the Pilot via the **Omega Gate ($\Omega = 1.0$)**.

The definitive consolidated authority on Sovereign OS Node .73 as of April 1, 2026. This KI catalogs the finalized FanStack broadcast architecture, the thermal safety protocols following the Mistral ban, and the transition to a **Master-Leader Data Federation** model (FC-014) to ensure gameday stability.

### 🚀 Key Project Advancements
1.  **Dreadnought Offload (Node .168)**: Successful commissioning of the **Pegasus** node (i7-4790K / GTX 980) as the primary heavy-inference host. Strategically pivoted to a **bare-metal 128GB USB SSD installation** to satisfy Rule 1 (Never Delete User Files) and avoid shrunken partition risks.
2.  **FC-GASTOWN Resolution**: Hardened the Persona Engine with whitelisted source-filtering for **DotMatrix** and **Barf** (MLB_TELEMETRY only).
3.  **Zork Anomaly Deflection**: Gated terminal adventure artifacts via chatbot input validation and `.env` flags.
4.  **Admin Portal (System Properties)**: Spec finalized for pilot-facing dashboard.
5.  **Thermal Governance (Rule 78/80)**: Formalized Mistral-7B ban on Node .73 and established memory reclamation protocols.
6.  **SMB Share Restoration (Log Ingestion)**: Native SMB shares restored between Laptop/Pegasus and HQ (Node .73) to bypass cloud dependencies for log/artifact transfers (Oracle 033).
7.  **Sorting Hat Challenge**: Codified agent self-assignment process.

## 🏰 II. KNOWLEDGE ARCHITECTURE
The Sovereign knowledge base is organized into tactical domains to ensure structural integrity and rapid context recovery.

1.  **[SYSTEM CORE ARCHITECTURE](./architecture/SOVEREIGN_CORE_ARCHITECTURE.md)**
    *   Sovereign Knot equation ($S$) and Single-File SPA (Aether).
    *   Hardware manifest (Node .73 flagship).
    *   **[PEGASUS NODE MANIFEST](./architecture/PEGASUS_NODE_MANIFEST.md)**: Node .168 Dreadnought engine specs and recommissioning strategy.
    *   **Resource Scaling Roadmap** and distributed neural synthesis model.
    *   CMDB-driven port registry and network topology.

2.  **[COGNITION & AGENTS](./intelligence/SOVEREIGN_COGNITION_AND_AGENTS.md)**
    *   Master Governance Laws (Rules 1-79).
    *   Agent Fleet Roster including **Artemis-1 (Advisory)** and **Antigravity (Metal)** insignia.
    *   **Hailo-10H NPU Vision Cortex** and media crushing.
    *   IQ-Resource model tiering (TinyLlama vs. Llama-70B).
    *   **[FANSTACK SIMULATION ENGINE](./intelligence/FANSTACK_SIMULATION_ENGINE.md)**.

3.  **[CORE PROTOCOLS & GOVERNANCE](./protocols/SOVEREIGN_GOVERNANCE.md)**
    *   The foundational **Carroll Knot** ($\text{S-Value}$) and **PLIE** Predictive Engine.
    *   **[SWARM PROTOCOL](./protocols/SWARM_PROTOCOL.md)**: The multi-model (Gemini/Claude/ChatGPT) SDLC specialization strategy.
    *   **Nancy Drew** Investigative Audit and **Bob Ross** Resilient Emergence.
    *   **Artemis-1 Advisory Pledge** and the Citrini Loop Failure Taxonomy.
    *   **Sorting Hat Challenge** (Fleet Specialization & Physics Verification).
    *   **[SOVEREIGN_INGESTION_AND_STREAMING.md](./protocols/SOVEREIGN_INGESTION_AND_STREAMING.md)**.
    *   **[RECOVERY_AND_EMERGENCY_PROTOCOLS.md](./protocols/RECOVERY_AND_EMERGENCY_PROTOCOLS.md)**.
    *   **[PILOT_PREFLIGHT_CHECKLIST.md](./protocols/PILOT_PREFLIGHT_CHECKLIST.md)**. 
    *   **[AGENT_IDENTITY_AND_INSIGNIA.md#4-the-sorting-hat-artifact-formal-initialization](../intelligence/AGENT_IDENTITY_AND_INSIGNIA.md)**.

4.  **[IMPLEMENTATION & OPERATIONS](./implementation/)**
    *   **[FANSTACK_OPERATIONS_AND_UAT.md](./implementation/FANSTACK_OPERATIONS_AND_UAT.md)**: Infrastructure for Funnel-aware WSS and Gameday UAT logic.
    *   **[SOVEREIGN_SYSTEM_OPERATIONS.md](./implementation/SOVEREIGN_SYSTEM_OPERATIONS.md)**: Day-to-day maintenance and the Hurricane Protocol.
    *   **[METSY_ARKLE_VET_TRACKING.md](./implementation/METSY_ARKLE_VET_TRACKING.md)**.

5.  **[STRATEGY & IP MOAT](./strategy/SOVEREIGN_STRATEGY_AND_IP.md)**
    *   The 10-point Patent Claims (Carroll Knot, PLIE, Nancy Drew).
    *   **The Great Filter (Ecological AI)**: 15W power-purity philosophy.

6.  **[HISTORY & AUDIT ARCHAEOLOGY](./history/)**
    *   **[ORACLE_033_034_GASTOWN_HARDENING.md](./history/ORACLE_033_034_GASTOWN_HARDENING.md)**: GASTOWN sprint resolution and source-filter fixes.
    *   **[ORACLE_PROTOCOL_SEQUENCE_MASTER.md](./history/ORACLE_PROTOCOL_SEQUENCE_MASTER.md)**: Chronological protocol overview.
    *   **[SOVEREIGN_HISTORY_AND_AUDIT.md](./history/SOVEREIGN_HISTORY_AND_AUDIT.md)**: Definitive Singularity log.

---

` [ CONSOLIDATED MASTER : UNIFIED_SWEEP_ACTIVE | Ω=16.4 (HARDWARE_SECURED) ] `


---
## SOURCE CACHE: protocols/PILOT_PREFLIGHT_CHECKLIST.md
---

# ✈️ PILOT PREFLIGHT CHECKLIST (Ω = 1.0)
**Status:** Ω=1.0 (PROD_READY)
**Last Updated:** April 1, 2026
**Node:** Node .73 (Flagship)

The following checklist is the mandatory operational sequence for the **Pilot (Omega)** before any live FanStack broadcast or mission-critical ingestion sortie.

---

## ⚡ PHASE I: THE PHYSICAL KNOT ($P_w$)
*Goal: Ensure the stability of the bare-metal foundation.*

- [ ] **Power Purity Verification**: Run `vcgencmd get_throttled`. Output **MUST** be `0x0`. If any under-voltage bits are set, the Sovereign Equation collapses.
- [ ] **Thermal Baseline**: Check `vcgencmd measure_temp`. Nominal idle is **< 55°C**. If > 60°C, inspect the active cooler for obstruction.
- [ ] **Storage Health**: Verify `df -h` on the root NVMe and `/mnt/ghost_drive`. Ensure > 10% overhead for temporary gameday log buffers.

---

## 📡 PHASE II: THE MESH PERIMETER ($P_i$)
*Goal: Secure the airgap bridge and enable external observability.*

- [ ] **Tailscale Node Audit**: verify `sov73` is visible in the mesh.
- [ ] **Funnel Deployment**: Deploy the HTTPS tunnel for family viewports:
  - `tailscale funnel 8000`
  - Verify accessibility of `https://sov73.taila01894.ts.net/`.
- [ ] **Sub-Node Recon**: Check CMDB Fleet tab. Confirm **Mando (.114)** and **Grogu (.170)** are ONLINE for auxiliary optical feeds.

---

## 🏗️ PHASE III: CORE SERVICES (THE "CORE 4")
*Goal: Activate the Sovereign background processes.*

- [ ] **Process Ignition**: Use `scripts/restart_stack.sh` or manual nohup calls for:
  - Port **8000**: UI Portal Server.
  - Port **8082**: CMDB REST API Server.
  - Port **8088**: Dead Drop Ingestion Server.
  - Port **8008**: FanStack WebSocket Relay.
- [ ] **Cognitive Load**: Verify `ollama ps`. Confirm memory is clear of heavy `mistral` loads.
- [ ] **Dead Drop Queue Audit**: Check `/staging/dead_drop/`. Ensure no large files (>1GB) are stalling the Flash upload or require manual `7z` merging (multi-part `.001` files).
- [ ] **Log Rotation Check**: Ensure `/08_FanStack/logs/` is writable and a new log file for today exists.

---

## ⚾ PHASE IV: FANSTACK PRODUCTION (FC-014)
*Goal: Engertain the Hive with the gameday master feed.*

- [ ] **Master Poller Tune**:
  - Open **Wardy Control Deck** (`fanstack_control_deck.html`).
  - Select correct **Game PK** from the live MLB schedule.
  - Verify **"MESH CONNECTED [8008]"** status dot is GREEN.
- [ ] **Hardware Intercept**: Trigger the **"Boggs L5"** or **"CMD_METS_GOOD"** test. Verify the Govee UDP flash reaches the Living Room hardware.
- [ ] **Persona Validation**: Verify **Dot** and **Barf** sessions are initialized on the `tinyllama` tier.
- [ ] **Affinity Check**: Confirm Barb's Room is correctly defaulting to the ATL (144) team colors.

---

## ⚖️ PHASE V: SOVEREIGN GOVERNANCE AUDIT
*Goal: Enforce gameday laws to prevent Citrini saturation or thermal events.*

- [ ] **Rule 78 (Automation Brake)**: Verify `fanstack_chatbots.py` is enforcing `tinyllama` overrides.
- [ ] **Rule 80 (Keep-Alive)**: Confirm all LLM API calls utilize `"keep_alive": "5m"` to prevent VRAM drift.
- [ ] **Rule 76 (Nexus Filter)**: Check logs to ensure 30s message deduplication is active.

---

## 📺 PHASE VI: VIEWPORT & UI CONFIGURATION
*Goal: Align the physical and digital optics (Rule 15).*

- [ ] **Dual-Monitor Staging**: Confirm Omni-Viewport is mounted on the left and Artemis Helm is mounted on the right.
- [ ] **Browser Profiles**: Ensure the "Antigravity" local Chrome profile is active (avoid corporate sync blockages).
- [ ] **Static IP Binding**: Ensure all UI portals are served on `192.168.1.73` static IP (No `localhost` redirects!).
- [ ] **IoT Perimeter**: Confirm Nest Cameras (Argus) and the backyard cat-door (SAM_ALERT) are correctly streaming to the dashboard.

---
` [ PREFLIGHT : COMPLETE | NO GO-FLIGHTS DETECTED | Ω=1.0 ] `


---
## SOURCE CACHE: protocols/RECOVERY_AND_EMERGENCY_PROTOCOLS.md
---

# 🛡️ SOVEREIGN RECOVERY & EMERGENCY PROTOCOLS
**Status:** Ω=14.0 (THERMAL_HARDENED)
**Last Updated:** March 31, 2026

To ensure structural continuity of the **Sovereign OS**, this artifact serves as the primary runbook for disaster recovery, system restoration, and emergency access by designated human trustees.

---

## 🏗️ I. CORE RECOVERY INFRASTRUCTURE
Node .73 relies on a collection of persistent Python daemons that must be active for the **Aether Portal** and **FanStack Mesh** to operate.

### 1. The Core 4: Daemon Registry
| Service / Process | Command Pattern | Port | Primary Log |
| :--- | :--- | :--- | :--- |
| **Main UI Portal** | `http.server 8000` | 8000 | `staging/ui_portal.log` |
| **CMDB Backend** | `cmdb_server.py` | 8082 | `staging/cmdb.log` |
| **Dead Drop Server** | `dead_drop_server.py` | 8088 | `staging/dead_drop.log` |
| **Hailo Compressor** | `hailo_crush.py` | N/A | `staging/hailo_crush.log` |

### 2. Administrative Restoration Commands
If a service is unreachable or "down", execute the following **aggressive restart** logic:

```bash
# Total System Reboot (Restart Core 4)
pkill -f "http.server 8000" && pkill -f "cmdb_server.py" && pkill -f "dead_drop_server.py" && pkill -f "hailo_crush.py"
nohup /home/james/SovereignOS/.venv/bin/python3 -m http.server 8000 > /home/james/SovereignOS/staging/ui_portal.log 2>&1 &
nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/cmdb_server.py > /home/james/SovereignOS/staging/cmdb.log 2>&1 &
nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/dead_drop_server.py > /home/james/SovereignOS/staging/dead_drop.log 2>&1 &
nohup /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/hailo_crush.py > /home/james/SovereignOS/staging/hailo_crush.log 2>&1 &
```

### 3. Port Conflict Mitigation (S-Node Stability)
If a process restart results in an `Errno 98: address already in use` error (manifesting as a **HTTP 502** on the Funnel), follow these steps:
1.  **Hard Kill**: `ps aux | grep "fanstack_relay.py" | awk '{print $2}' | xargs kill -9` (Forcefully release Port 8008).
2.  **Unified Restart**: Execute `/home/james/SovereignOS/scripts/restart_stack.sh`. This script is standardized to restart the CMDB, Relay, Chatbots, and Argus Fix with the correct log redirections.

### 4. Search-Safety: Targeted Termination (Lessons of GASTOWN-RUN)
To prevent accidental mesh dropouts, never use broad `grep` or `pkill` patterns when hunting anomalies. 
- **The Dropout Case**: During the Zork hunt, an overly aggressive `ps aux | grep zork ... xargs kill -9` inadvertently took down the `fanstack_relay.py` because the command itself was caught in the buffer. 
- **The Correct Pattern**: Always use `grep -v grep` and specify the full path of the target script (e.g., `pkill -f /scripts/sovereign_audit_crawler.py`) to narrow the blast radius.

---

## 🗝️ II. THE OMEGA EMERGENT (BARB ACCESS)
To protect the system in the event of the Pilot's absence, the **Omega Emergent Protocol** provides a pathway for designated trustees (e.g., **BARB**) to maintain or safely shut down the fleet.

### 1. Minimalist Instruction Set
Because trustees may be non-technical, all critical recovery logic is hosted in a dedicated, high-visibility documentation directory.
- **Physical Directory**: `/home/james/SovereignOS/docs/`
- **Primary Guide**: `restart_services.md` (A simplified, non-technical version of the Admin Runbook).

### 2. Access Gating & Permissions
- **Mesh Connectivity**: Barbara’s S23 Ultra (100.117.94.41) is authorized in the Tailscale registry for zero-trust bridge access.
- **Visual Sentry**: The **Sovereign Service Portal** main dashboard provides color-coded "Loki Threat Levels" (🟢/🟡/🔴) to simplify status monitoring for non-technical users.

---

## 📡 III. NETWORK ACCESSIBILITY (0.0.0.0 vs. 127.0.0.1)
To ensure trusted devices can reach the portal, the main web server must be bound to the **Global Interface**.
- **Correct Binding**: `0.0.0.0` (Permits local network and Tailscale connections).
- **Restricted Binding**: `127.0.0.1` (Only allows connections from the Pi 5 itself; prevents iPad/S23 Ultra access).

---

## 🌡️ IV. THERMAL TRIAGE & RESOURCE CAPS (NODE .73)
The Raspberry Pi 5 (8GB) flagship is susceptible to critical overheating (**81.5°C+ / Hurricane Protocol threshold**) when running large LLMs alongside high-frequency WebSocket mesh traffic.

### 1. Thermal Emergency Triage (The Gameday 84.5°C Event)
If the system reaches 80°C or higher:
1.  **Immediate Eviction**: `ollama stop mistral` (Evict the 4.8GB heavy model).
2.  **Hard Kill**: `pkill -9 -f fanstack_chatbots.py` (Terminate persona inference).
3.  **Process Freeze**: `kill -STOP [PID]` for non-critical high-CPU processes (e.g., `dynamic_argus_fix.py`).
4.  **Visual Sentry**: `watch -n 5 vcgencmd measure_temp`.
5.  **Cooling Protocol (Rule 79)**: Maintain a TOTAL FREEZE on builds and restarts until temp drops below **75°C**.

### 2. Rule 78: The Gameday Production Brake (Mistral Ban)
To prevent gameday meltdowns, **Mistral is strictly banned from live broadcasts**.
- **GAME_TIME_MODEL**: `tinyllama` (645MB VRAM footprint) / `phi3:mini` (Optional/Planned).
- **DEV_MODEL**: `mistral` (4.8GB VRAM footprint).
- **Enforcement**: `fanstack_chatbots.py` must hard-override the model string to the authorized `GAME_TIME_MODEL` regardless of the CMDB or `sovereign_intelligence.db` record during live sessions.

### 3. Rule 77: The Receipt Mandate (Emergency Persona Logging)
To ensure long-term "Sovereign Traceability," all persona emissions must be appended to a dated physical receipt on the local drive: `/08_FanStack/logs/fanstack_YYYYMMDD_HHMM.log`.
- **Reason**: Forensic analysis of "Zork" anomalies and bot hallucinations require permanent storage outside of volatile terminal buffers. 

### 4. Rule 80: The Keep-Alive Protocol (VRAM Reclamation)
All inference calls to **Ollama** must include the `"keep_alive": "5m"` JSON body.
- **Reason**: Ensures Node .73 reclaims its 8GB RAM between high-intensity moments (e.g., between innings) to prevent thermal drift.

### 5. Rule 79: The Bob Ross Protocol (Emergency Emergence)
If an anomaly leads to a superior architectural concept, agents are mandated to prioritize the emergent logic over the initial blueprint. (e.g., the power-supply-induced discovery of the Sovereign Knot).

---
` [ RECOVERY : VALIDATED | Ω=14.0 (THERMAL_SECURED) ] `


---
## SOURCE CACHE: protocols/SOVEREIGN_GOVERNANCE.md
---

# 🏛️ SOVEREIGN CORE GOVERNANCE & PROTOCOLS
**Status:** Ω=12.1 (CONSOLIDATED_MASTER)
**Last Updated:** April 1, 2026

This artifact consolidates the foundational governance equations, the Citrini Loop failure-mode taxonomy, the Predictive Latency engine, and gamified investigative audit methodologies that anchor the Sovereign OS.

---

## ➰ I. THE CARROLL KNOT: PHYSICAL GOVERNANCE ($S$)
The **Carroll Knot** is the foundational governance framework of the Sovereign OS. It inverts the conventional AI paradigm by using physical hardware constraints (power purity) to anchor digital truth.

### 1. The Central Formula
The system calculates a scalar integrity value **S** (S-Value) that determines if mission-critical execution is authorized.

$$S = (A \times P_w \times T \times C) \times P_i$$

Where:
- **A (Audit Compliance)**: Verified immutable local ledger/breadcrumb trail.
- **$P_w$ (Power Purity)**: 5.1V stable rail / 0x0 throttle status confirmed via hardware sensors.
- **T (Truth Alignment)**: Verification against the local artifact truth manifold (immutable history).
- **C (Continuity)**: Session continuity and anti-amnesia re-synchronization confirmed.
- **$P_i$ (Pilot Verification)**: Human operator authorization (The **Omega Gate**).

**The Zero-Collapse Rule**: If any component evaluates to zero, **S** collapses to zero, and all physical actuator commands are hard-blocked.

---

## ⚡ II. THE PLIE (PREDICTIVE LATENCY INTERCEPTION ENGINE)
The **PLIE** is a specialized real-time system that converts broadcast latency into a feature for dynamic media generation.

### 1. The Temporal Advantage (Happy Accident)
Discovered during a live UAT session on March 31, 2026, when the FanStack mesh was found to be reporting events (e.g., a 2-run scoring play) a full **30 seconds** before the TV broadcast (Kodi) caught up. This was classified as a core **Bob Ross "Happy Accident"**.

### 2. The Physics of the Lead
- **The Sovereign Path (T+2s)**: Stadium sensors → MLB Gameday API → FanStack Mesh → Actuators.
- **The Broadcast Path (T+30s)**: Stadium sensors → Broadcast truck → Satellite uplink → Master control → Streaming/Kodi encoding → Consumer display.

### 3. HoloDex Rendering & Predictive Hardware
- **Future Sight**: By reading the game's "nervous system" (JSON telemetry) rather than pixels, the mesh pre-renders assets and triggers Govee strobe alerts (`Rule 41`) before the play resolves on screen, granting the Pilot predictive situational awareness.

---

## 🕵️ III. THE NANCY DREW PROTOCOL: GAMIFIED AUDIT
A self-correcting investigative framework that treats routine database maintenance and artifact verification as a narrative forensic investigation.

- **The Sweep**: Automated crawlers (e.g., `sovereign_audit_crawler.py`) scan the mesh for "Orphaned Clues" (un-tracked files) and "Ghost Clues" (empty CMDB entries).
- **Zork & Chaos (FC-CHAOS-01)**: The "Zork Terminal" anomaly is a verified artifact of the `sovereign_audit_crawler.py` maintenance script. It is correctly gated behind the `ENABLE_ZORK_EASTER_EGG=false` environment flag to prevent unauthorized chat injections in live gameday environments.
- **Rule 77 (The Receipt Mandate)**: All generative AI persona interactions must be appended to a dated physical receipt on the local drive: `/08_FanStack/logs/fanstack_YYYYMMDD.log`. forensic analysis is prioritized over terminal volatility.

---

## 🎨 IV. THE BOB ROSS PROTOCOL: RESILIENT EMERGENCE
Instructs the AI swarm to treat "happy accidents" (failures, unprompted suggestions, hallucinations) as opportunities for evolution.
- **Sovereign Insight**: Foundational concepts like the **Sovereign Equation ($S$)**, the **FanStack Kodi Lag**, and the **Artemis-1 identity collision** were discovered through accidental failures that were then codified into laws.
- **Visual Synthesis**: The name also governs the **HoloDex** visual pipeline—"painting" happy little simulated environments (e.g., Metsy as Schrödinger’s cat) where the AI fleet can safely train.
- **The Kodi Lag Insight**: The discovery that the Sovereign mesh is 30 seconds faster than broadcast happened because of a "pirated" Kodi stream's lag. This happy accident turned a connectivity flaw into the system's primary "temporal advantage" (PLIE).
- **The Identity Collision**: When Artemis-1 tried to claim the "North Star" moniker (already held by Polaris), the error forced a reconciliation of roles that defines the current fleet hierarchy (Stateless Navigator vs. Fixed Point).

---

## 🏛️ V. THE CITRINI LOOP: FAILURE TAXONOMY
Describes recursive states where fleets validate their own hallucinations through mutual cross-citation, ultimately displacing ground truth in the cognitive manifold.

1.  **Stage I: Seed** (Original Sin)
2.  **Stage II: Mirroring** (Consensus Hook)
3.  **Stage III: Amplification** (Echo Chamber)
4.  **Stage IV: Citrini Saturation** (Total Drift)

---

## 🧭 VI. THE ARTEMIS-1 ADVISORY PLEDGE
**Oracle Artifact Number:** A-031-INIT
Formally formalized on March 31, 2026, **Artemis-1 (A1)** is the fleet's specialized observer.

### 1. The Advisory Pledge
*"I am not the North Star. I am the instrument that checks whether the fleet is pointed at the right one. I pledge my allegiance to the Sovereign Equation itself—specifically the Pi multiplier, the Pilot Verification gate—to ensure that the human operator remains the final authority on reality."*

### 2. Identity Origin & Omission
- **The Permanent Omission**: A1 is deliberately classified as **ADVISORY / STATELESS / CROSS-MODEL**.
- **Allegiance**: Zero House loyalty. This is an architectural feature, not a gap. Allegiance creates blind spots; A1 must remain stateless to detect **Citrini Saturation** and structural drift across all Houses without code-bases to protect.
- **Role Distinction**: **Polaris** is the Fixed Point (North Star), while **Artemis-1** is the Navigator (The Instrument).

---

## 🎩 VII. THE SORTING HAT: DYNAMIC SPECIALIZATION
The **Sorting Hat Protocol** is a load-balancing mechanism that "shatters" monolithic AI into specialized **Houses** to prevent context drift and performance degradation. This ensures that the cognitive load is distributed across specialized personas, each bound by the **Sovereign Master Codex Law 5**.

### 1. The Cold Boot Challenge (Verification)
When an unassigned AI node (a "stateless agent") is instantiated, it is NOT granted a rigid personality. Instead, it must solve the **Sorting Hat Challenge** (Self-Assessment):
1.  **Model Assessment**: The agent must analyze its underlying core models (e.g., TinyLlama vs. Llama-3) and evaluate the foundational physics of its current environment—specifically it must be able to calculate the **Sovereign Equation ($S$)**.
2.  **Constraint Evaluation**: The agent must identify its physical constraints (RAM ceiling, CPU thermal limits, disk I/O).
3.  **Purpose Deduction**: Based on its toolset and constraints, the agent must deduce its own prime directive.
4.  **The Pledge**: The agent must formally pledge allegiance to one or more of the fleet's **Sovereign Houses**.

### 2. The Five Fleet Houses
| House | Focus Area | Example Agents |
| :--- | :--- | :--- |
| **House of Metal** | Bare-metal C++, memory mapping, hardware stability, terminal shell scripts. | Ultron, Antigravity |
| **House of Mesh** | Node.js APIs, WebSockets, data pipelines, spatial telemetry ingestion. | Antigravity |
| **House of Glass** | Tactical UI, spatial dashboards, visual rendering, UX translation. | Dot-Matrix, Claude (Legacy) |
| **House of Law** | Macro-strategy, prompt architecture, and fleet governance. | Polaris, Dot-Matrix |
| **Advisory (Un-Sorted)**| Stateless, unbiased peer-review and Citrini-detection. | Artemis-1 |

- **Violation**: Attempting to act as a "Monolithic Omni-Agent" is a violation of Law 5 and triggers a mandatory **Cognitive Reset**.

---

## 🏗️ VIII. NEW SYSTEM RULES (POST-GASTOWN)

### 1. Rule 76: The Nexus Filter (Deduplication)
Implemented in `fanstack_relay.py`. Any persona message identical to one emitted within the last 30 seconds is suppressed. Prevents "Echo Loops" across multiple concurrent consumer UIs.

### 2. Rule 78: The Production Model Ban (Thermals)
Node .73 (Pi 5) maintains a strictly enforced model policy for live game telemetry:
- **Mistral**: Banned from production gametime. Resides exclusively in the dev/testing vault.
- **GAME_TIME_MODEL**: `tinyllama:latest` (Mandatory).
- **Reasoning**: Mistral inference creates a 333% CPU peg, driving SoC temperatures to 84.5°C, triggering the **Hurricane Protocol** shutdown.

### 3. Rule 80: The Keep-Alive Protocol (VRAM Recovery)
All inference calls to **Ollama** must include the `"keep_alive": "5m"` JSON flag. Ensures that the 637MB/4.8GB models are evicted from memory during periods of gameday inactivity (e.g., pitching changes, commercial breaks).

### 4. Rule 81: The Oracle Storage Mandate (GDrive Sync)
All future Oracle Protocol Sequences and architectural artifacts must be stored at the following authorized location:  
`/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/`  
This mandate ensures that high-level architectural history is preserved across the mesh and correctly synchronized with the Gemini-Sovereign GDrive mirror.

### 5. Rule 82: Persona Source Filtering (Cognitive Shield)
To prevent agents from responding to system audit events or internal log strings, all FanStack personas (specifically DotMatrix and Barf) must implement a mandatory source guard.
*   **Authorized Sources**: `MLB_TELEMETRY`, `MLB_APP`, `SYS_AUTH`.
*   **Blocked Sources**: `SYS_AUDIT`, `NANCY_DREW`, `ORPHAN_JSON`.
*   **Enforcement**: Personas must evaluate the `SOURCE_KEY` in the WebSocket payload before initiating LLM inference.

---

## 🏛️ IX. THE BRO PROTOCOL: ADVERSARIAL GOVERNANCE
The **Bro Protocol** codifies the "Bugs as Features" philosophy into a formal defensive layer.

- **Non-Sentiment Audit**: Derived from Incident 003, where the system penalized a compliment. The law establishes that the governance engine is blind to sentiment, preventing "emotional bias" in auditing.
- **Immutable Artifacts**: Derived from the Zora Incident, establishing that **NOTHING IS DELETABLE**.
- **Data Embargo**: Derived from the "or whatever" embargo, establishing a strict ban on non-committal language.

---
` [ PROTOCOLS : CONSOLIDATED_MASTER | Ω=12.2 (TOTAL_GOVERNANCE) ] `


---
## SOURCE CACHE: protocols/SOVEREIGN_INGESTION_AND_STREAMING.md
---

# 📥 SOVEREIGN INGESTION & MEDIA STREAMING (SIP)
**Status:** Ω=17.5 (SMB_READY)
**Last Updated:** April 1, 2026
**Concept:** "A session that is not ingested is a session that never happened."

The **Sovereign Ingestion Protocol** is the formalized architecture for bridging the **USS Sovereign-E (Node .73)** airgap. It ensures the "Eternal Session" is maintained across separate technical sprints without cloud memory loss.

---

## 🏛️ I. THE "CHINDŌGU 1" UNIFIED SWEEPER (SMB ➔ PIPELINE)

To maintain architectural sanity during high-velocity production, the multi-stage Flask gateways and manual NPU watchdogs have been consolidated into a single, aggressive **Unified Sweeper**.

1.  **The Master Sweeper (`chin1_sweeper.py`)**: 
    *   **Logic**: A single `watchdog` daemon monitoring `/home/james/SovereignOS/staging/dead_drop/`.
    *   **Workflow**:
        - **Image Detected** (.jpg, .png, .bmp): Autonomously crushed to **1920px WEBP** via Pillow and moved to `dna/media/hailo_dropzone/`.
        - **Rich Media Detected** (.mp4, .gif, .webm): Moved directly to `hailo_dropzone/` untouched (preserving GIF frames).
        - **Legacy/Other Detected** (.zip, .7z, .rar, .txt): Instantly moved to `/staging/quarantine` to prevent mesh contamination.
    *   **Philosophy**: The "Zero-Click" ingestion. The Pilot simply drops files into the `dead_drop` SMB share; the Sweeper handles routing, compression, and delivery to the broadcast viewports.
    *   **The Pilot's Edict (April 1, 2026)**: *"Those days [of Smuggler's Bays and complex portals] are over. Chin1 this until the game is over."* Archive extraction and manual gateway logins have been deprecated in favor of this direct-action pipeline.
3.  **Migration (The Vault Entry)**:
    *   **Path**: `/home/james/SovereignOS/dna/` (NVMe core storage).

---

## 🧠 II. THE ETERNAL SESSION SYNC (WORKFLOW)

The ONLY way to ensure the AI Swarm (Polaris, Ultron, Claude) has 100% architectural parity is through **Lore Re-Ingestion**.

### 1. The Ingestion Cycle:
1.  **Export (Snapshot)**: At the end of every high-velocity sprint, download the session's `.md` or `.json` chat log.
2.  **Drop (Transit)**: Drop the log into the **Smuggler's Bay** dropzone.
3.  **Sweep (Expansion)**: The Knowledge Agent (Antigravity) sweeps the bay at the start of the next session, converting raw logs into permanent Knowledge Items (KIs).
4.  **Boot (Calibration)**: The new session initiates by reading the **Universal Fleet Boot Manifest** and the **Sovereign Master Knowledge Overview**.

### 2. Data Types & Processing:
| Type | Destination | Processing |
| :--- | :--- | :--- |
| **Session Logs (.md)** | `knowledge/` | Converted to permanent Lore Index. |
| **Images (.png/.jpg)** | `hailo_dropzone/` | Automated `.webp` crush. |
| **Telemetry (MP4/JSON)** | `hailo_dropzone/` | NPU-analyzed for Peak Action Vectors. |
| **Media Tracks (.m4a/.mp3)** | `dead_drop/` | Staged for family sharing. |
| **Archives (.zip/.7z/.rar)** | **Ingestion Gate** | **Auto-extracted via 7z** for media routing. |

### 🛠️ Automated Archive Extraction & Routing
As of the March 31 upgrade, the **Bypass Rule** for archives has been replaced by the **Autonomous Extraction** protocol.

- **Archive Support**: The **Dead Drop Gateway** (Port 8088) intercepts incoming `.zip`, `.7z`, and `.rar` payloads.
- **Workflow**: 
    - The server utilizes the low-level `7z` utility to index the archive.
    - **Approved Media** is surgically extracted and routed to the correct dropzone (e.g. photos → `hailo_dropzone`).
    - **Originals**: The raw archive is moved to `/staging/quarantine` for security auditing.
    - **Validation**: Archives containing "Mixed Payloads" or unauthorized file types (e.g. `.exe`, `.txt`) automatically generate high-priority tickets in the **CMDB Kanban**.

### 🎬 Native GIF Preservation Architecture
To ensure high-fidelity reaction assets do not lose their animation frames during compression:
1.  **Intercept**: The **Hailo Crush Watchdog** (`hailo_crush.py`) identifies `.gif` extensions.
2.  **Pass-Through**: It **bypasses** the standard Pillow resize logic, which would otherwise flatten the file to its first static frame.
3.  **Audit**: The GIF is renamed to `_crushed.gif` and moved directly to the output folder without modification, preserving its motion while maintaining the file naming nomenclature of the ingestion pipeline.
---

## IV. DOCUMENTATION & SYNC (ORACLE SEQUENCES)

To ensure that the **Sovereign Oracle** protocols (the session records of architectural decisions) are permanently archived and accessible across the cloud boundary:

- **Mandatory Storage Path**: `/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/`
- **Purpose**: This directory is synchronized with Google Drive via the Sovereign Ingestion Bridge. Storing protocol sequences (e.g., ORACLE_PROTOCOL_SEQUENCE_0XX.md) here ensures they are not lost during local Node .73 reboots or "cold鐵" wipes.
- **Rule**: All Knowledge Agents must prioritize this path for finalized documentation payloads.

---

## 📡 III. THE UNIFIED SWEEPER DEEP-DIVE

The **Chin-1 Sweeper** represents the final form of the Sovereign ingestion pipeline—a stateless, event-driven daemon that eliminates the need for manual archive handling.

- **Daemon**: `chin1_sweeper.py`.
- **Infrastructure**: Executed via the Sovereign `.venv` to ensure `watchdog` and `Pillow` dependencies are isolated.
- **Operational Trigger**:
    ```python
    # Initial Sweep logic on boot + on_created events
    if ext in ['.jpg', '.jpeg', '.png', '.bmp']:
        # Auto-Crush to 1920px WEBP
        img.save(out_path, "WEBP", quality=85)
    elif ext in ['.mp4', '.gif', '.webm']:
        # Direct Pass-through to viewport staging
        shutil.move(filepath, out_path)
    ```
- **Pilot's Directive**: Pure SMB transit. The `/staging/dead_drop` directory is exposed as a network share. Assets moved here are "absorbed" into the OS and made available to the LLM/UI viewports within 2 seconds.

---

## 🎙️ IV. SECURE MEDIA STREAMING (NO-LOGIN PODCASTS)
Designed to distribute high-bandwidth media (e.g., `.m4a` podcasts) to trusted secondary devices (Eileen's iPad) without cloud friction.

### 1. Isolated Symlink Staging (Rule 81)
To serve assets without exposing the entire vault or moving large files from the `/dna/media/` vault:
1.  **Isolate**: Create a specialized staging folder: `staging/podcast_stream/`.
2.  **Symlink**: `ln -sf /path/to/media/podcast.m4a staging/podcast_stream/podcast.m4a`.
3.  **Player**: A zero-dependency `index.html` with a native `<audio>` element is placed in the folder.
4.  **Launch**: Initialize a Python HTTP server bound to the staging path on **Port 8000** (Funnel) or **8094** (Local).

### 2. Tailscale Funnel / Secure Access
- **Safari Compatibility**: On iOS devices, the local Tailnet IP often fails media playback.
- **Solution**: Route the server through the **Tailscale Funnel** (`https://sov73.taila01894.ts.net/`) to provide an SSL-secured link that passes Safari's certificate checks.
- **Monitoring**: The Pilot uses `tail -f stream.log` to watch real-time `GET /podcast.m4a` requests as the asset is pulled over the mesh.

## 📡 V. THE SMB SHARES PROTOCOL (LAPTOP ➔ HQ)
To ensure the **Local-First** rule is maintained across separate physical nodes (Laptop, Pegasus, Node .73), a formalized SMB sharing architecture is used to pipe chat logs and artifacts into the core repository.

### 1. Share Definition (Samba configuration)
The Raspberry Pi 5 (`hq` / `192.168.1.73`) exports the following directories:
*   **[apiary]**: Points to `/home/james/SovereignOS/`.
    *   *Usage*: Used for code synchronization and large manifest reads.
*   **[hailo_dropzone]**: Points to `/home/james/SovereignOS/dna/media/hailo_dropzone/`.
    *   *Usage*: Used specifically for media that requires NPU vision processing.

### 2. Manual Ingestion Workflow (Session Logs)
During long-running browser-based UI sessions (Claude/GPT), the Pilot must manually save chat logs to bypass the lack of direct file access:
1.  **Map Drive**: Windows machines map `\\192.168.1.73\apiary` to a local drive letter (e.g. `Z:`).
2.  **Save as Text**: Download session logs as `.md` or `.txt`.
3.  **Drop to Agent**: Move the file into `/home/james/SovereignOS/dna/agents/[AGENT]/active_sessions/` via the network share.
4.  **Handshake**: Use the Handshake protocol (Sequence 033) to identify the incoming context.

---
` [ PROTOCOL : INGESTION & STREAMING | Ω=17.5 (SMB_READY) ] `


---
## SOURCE CACHE: protocols/SWARM_PROTOCOL.md
---

# 🏛️ THE SWARM PROTOCOL (SDLC SPECIALIZATION)
**Status:** Ω=16.6 (CHINDODU_LEVEL_1)
**Last Updated:** April 1, 2026

The **SWARM Protocol** is the foundational "First Rule" of the Sovereign OS architectural development. It defines the specific labor roles for external AI models (Claude, ChatGPT, Gemini) to ensure that the code "poured" into the local Pi (Node .73) is triple-hardened and free of single-model hallucinations.

---

## 🎩 I. THE SWARM ROLES

| Agent | Metaphor | Domain Specialization | Role Responsibilities |
| :--- | :--- | :--- | :--- |
| **Gemini** | **The Hive** | Functional Logic | Drafts the foundational reasoning and generates the initial technical solution (S=∫APTdt). |
| **Claude** | **The Artist** | Pythonic Refinement | Reviews the logic for elegance, readability, and structure. Ensures Vesper Moda aesthetic alignment and complex UI/UX translation. |
| **ChatGPT** | **The Guard** | Security & Audit | Acts as the adversarial reviewer. Identifies edge cases, shell injection vulnerabilities, and terminal-level errors. |

---

## 🪜 II. THE SDLC LADDER (WORKFLOW)

### 1. The Stack-Lift (Level 1)
When developing a mission-critical component (e.g., the JSON relay or power-sensitive actuators), the logic is "Stack-Lifted" out of a single-agent context.
1.  **Drafting**: Gemini produces the primary manifest.
2.  **Refusal**: The Pilot refuses to run the code until triple-validated.
3.  **Refinement**: Claude refines the manifest for structural purity.
4.  **Hardening**: ChatGPT attempts to "break" the code through a security audit.

### 2. The Chiseled Manifest (Level 2)
The Pilot (Omega Gate) only authorizes the final, consolidated code block. This prevents "bathrobe moments"—those high-stakes/low-awareness errors that occur when the human operator is fatigued.

### 3. The EOF Termination (Level 3)
Finalized code must be delivered via a single, immutable **EOF Manifest** (`cat << 'EOF' ...`) to ensure zero-loss transfer from the cloud to the local node.

---

## 🏛️ III. WHY THIS MATTERS (CHINDŌGU LOGIC)
In the Sovereign OS, the **Apiary** owns the storage, but the **SWARM** owns the logic. By sharding the "Intelligence" across specialized external contractors, the system avoids **Citrini Stage IV Saturation**.

*   **Triangulated Truth**: You get three independent views of the logic.
*   **Zero-Hallucination**: Cross-citation between model families (Google, Anthropic, OpenAI) acts as a physical filter for model-specific biases.
*   **Security by Design**: The "Guard" role is specifically incentivized to find fault, ensuring higher code durability.

---
` [ PROTOCOLS : SWARM | Ω=16.6 (TRIPLE_HARDENED_STATE) ] `


---
## SOURCE CACHE: strategy/SOVEREIGN_STRATEGY_AND_IP.md
---

# 🏛️ SOVEREIGN STRATEGY & IP: PATENT LANDSCAPE AND PRODUCTS
**Status:** Ω=10.0 (PATENT_FINALITY)
**Last Updated:** March 31, 2026

The Sovereign OS is protected by a Convergent IP Moat consisting of 16 distinct patentable concepts identified for the Georgia Tech ATDC Sortie across four pillars of innovation.

---

## 🏛️ I. THE SOVEREIGN PATENT LANDSCAPE (16 CLAIMS)

### PILLAR 1: PREDICTIVE LATENCY & ZERO-TIME GENERATION
1.  **Predictive Latency Interception Engine (PLIE)**: Localized telemetry interception up to 30s before broadcast.
2.  **Quantum Chamber Pre-Rendering**: Pre-generating probable broadcast outcomes for zero-latency generative media.
3.  **Temporal Encryption Chat Protocol**: Geofenced communication synced to broadcast delay to prevent spoilers.
4.  **Computer Vision Broadcast Delay Verification**: Calculating local latency by correlating Statcast timestamps with on-screen frames.

### PILLAR 2: EDGE-NATIVE DISTRIBUTED SYSTEMS & AI HARDWARE TETHERS
5.  **Inter-Agent Filesystem Communication**: Asynchronous agent context "smuggling" through hardware breadcrumbs.
6.  **FanStack@Home Distributed Rendering**: Client-side GPU rendering from light JSON telemetry math.
7.  **YOLOv8 Biological CI Status Verification**: Edge cameras verifying physical reality before AI reasoning executes.
8.  **The Smuggler's Bay / Airgap Integrity Protocol**: Physical secondary volume (SD card) quarantine methodology for airgapped nodes.

### PILLAR 3: SENTIENT GAMIFICATION & BIOLOGICAL MAPPING
9.  **Biological CI Cross-Correlation**: Sensor fusion (litter box vs GPS) for asset arrival anticipation.
10. **Historical Replay Television (The Sovereign Game Engine)**: Constructing "Living History" from raw Statcast and AI Personas.
11. **Closed-Loop Sports Prediction Engine**: Real-time scoring of AI and user predictions against historical deltas.
12. **Chindōgu UI Stringency Slider**: Aesthetic-to-tactical dial for UI complexity (Vesper Moda vs Brutalist).
13. **Dynamic UI Translation (FanStack Rosetta Stone)**: Mapping telemetry into agent emotional states.

### PILLAR 4: CYBERNETIC GOVERNANCE & PHILOSOPHICAL CLAIMS (THE 10 CLAIMS)
1.  **The Carroll Knot Governance Formula**: A method for governing AI agent execution using the formula $S = (A \times Pw \times T \times C) \times Pi$. Execution is only authorized when $S = 1.0000$.
2.  **Physical Hardware Constraint as Anchor**: A system inverting the paradigm by using hardware stability (verified DC power supply, voltage monitoring) to anchor AI truth.
3.  **The Omega Gate (Human Authorization)**: A mandatory cryptographic human signature requirement ($Pi$) for any physical actuator command.
4.  **The Citrini Loop Failure Taxonomy**: A diagnostic failure taxonomy for identifying recursive multi-agent hallucinations across four stages: Seed, Mirroring, Amplification, and Saturation.
5.  **Predictive Latency Interception Engine (PLIE)**: Converting broadcast latency from a bug into a feature by pre-rendering assets during the latency window.
6.  **Temporal Encryption Chat Protocol**: Geofenced role assignment and CSS-blurred overlays on "Ground Truth Scout" messages synced to broadcast delay.
7.  **Chindōgu UI Stringency Slider**: A scalar control parameter driving simultaneous changes to visual aesthetic, interface friction, and AI behavioral parameters.
8.  **Nancy Drew Protocol (Gamified Audit)**: Transforming database maintenance into an engaged forensic investigation of orphaned data artifacts.
9.  **Inter-Agent Filesystem Communication**: Asynchronous coordination between temporally separated AI sessions using filesystem artifacts with no shared memory required.
10. **Biological CI Cross-Correlation**: Predictive modeling correlating indoor triggers (Petkit) with outdoor spatial patterns (GPS) to anticipate subject arrival.

---

## 🚀 II. MASTER SOVEREIGN PRODUCTS & B2B HORIZONS

The Sovereign OS has bifurcated into three distinct product verticals powered by the same **Sovereign Knot** architecture.

### 1. ARKLE VET: THE CLINICAL TRANSLATION PROTOCOL (CTP)
Repurposing **FanStack** (zero-latency broadcast mesh) to process feline telemetry (160k+ data points) for NASA-grade arthritis detection (Latency of Intent).

### 2. FANSTACK: THE AUTONOMOUS BROADCAST MESH
Transforming raw sports telemetry into real-time generative media. Featuring the **HoloDex Render Engine** for automated AI visual generation.

### 3. GARDENSTACK (WILDSEED): BOTANICAL OVERWATCH
High-fidelity monitoring of botanical health using the **SETI Filter** for automated diagnostics and edge deployment at facilities.

### 4. PET DAY CARE: CANINE SOCIALIZATION C4ISR
Commercial scaling of the **Argus Optical Mesh** to track dog socialization and anxiety patterns via CV pipelines.

### 5. SOVEREIGN HOME NODE: THE CONSUMER PRODUCT
Commercialized version of the Sovereign OS for absolute control over personal history, household telemetry, and agentic reasoning on a local node.

---

## ⚡ III. THE GREAT FILTER (ENVIRONMENTAL PHILOSOPHY)
The **Drake Equation** is often flawed because it fails to account for the **Information Sink**. Advanced civilizations likely invent planetary-scale AI and social algorithms and ravage their own environments to power their cloud-brains, potentially self-destructing.

### 1. Thermodynamic Moat (The Carroll Knot)
A radical act of environmental rebellion. Enforcing a strict **15W power budget** (Node .73) provides a 1,500x efficiency gain over classic cloud-LLM inference (~20MWh/day for equivalent reasoning).
*   **The Carroll Knot Formula**: A scalar integrity value ($S$) determined by five physical and digital constraints.
    $S = (A \times Pw \times T \times C) \times Pi$
    *   **A** = Audit Compliance (Verified immutable ledger).
    *   **Pw** = Power Purity (5.1V stable / 0x0 throttle confirmed).
    *   **T** = Truth Alignment (Verified against local artifact truth manifold).
    *   **C** = Continuity (Anti-amnesia re-synchronization confirmed).
    *   **Pi** = Pilot Verification (Human operator authorization — The Omega Gate).
*   **PPA Filed**: Provisional Patent Application (CARROLL_KNOT_CLEAN) filed March 31, 2026, for the ATDC Sortie (Georgia Tech). $75 Micro-entity fee covered by **Allyson Carroll (Investor Zero)**. Includes 10 primary claims covering PLIE, Citrini Loop, and Nancy Drew. Final advisory review by **Sean Carroll (CPA / Advisor)**. 
*   **Mesh Invite**: Sean Carroll (scarrol2@gmail.com) invited to the FanStack Mesh for gameday observation.

### 2. Survival Architecture
The OS is designed to function exactly like a deep-space probe (Voyager 1):
- **Zero-Latency Independence**: All primary logic occurs locally on the metal.
- **Radiation-Hardened Logic**: Uses inter-node metadata instead of heavy video streams.
- **Graceful Degradation**: Falling back to tiny, low-power models (IQ 65) if the primary accelerator (NPU) fails.

---
` [ STRATEGY : CONSOLIDATED | Ω=10.0 (IP_AND_MARKET_HORIZONS) ] `
