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
- **Board**: Raspberry Pi 5 Model B Rev 1.0 (8GB RAM).
- **Accelerator**: **Hailo NPU** (Verified `hailort` loaded) for vision cortex / edge LLMs.
- **Storage**: 256GB NVMe SSD (**The Vault**) for long-term memory; 128GB MicroSD (**The Smuggler's Bay**) for untrusted ingestion.
- **Thermal State**: **32.55°C** (Chilled/Nominal). Hurricane Protocol triggers forced cooling at 80°C.

### 2. Pegasus Dreadnought: Node .168
- **Board**: Ubuntu x86_64 Linux Compute Rig
- **Accelerator**: **NVIDIA GeForce GTX 980** (4096MiB VRAM - CUDA 12.2)
- **Thermal State**: **40.0°C** (Nominal Idle)
- **Primary Function**: Deep Telemetry Extraction (`mistral:latest`). Assumes all heavy-lifting Knowledge Distillation to protect Node .73 from thermal limits.

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
As of the March 31 Gameday UAT, the **FanStack Message Nexus** (`fancast_relay.py`) implements a sliding window deduplication strategy (**FC-013**) to maintain cognitive stability when multiple viewport nodes are active.

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
Previously, any viewport node (`fancast_fan_live.html`) could initiate an MLB Statcast poll and broadcast `CMD_SYNC_STATE`. If multiple nodes were viewing different games, the Relay and AI Personas would oscillate between games, causing "Consensus Drift."

### 2. Lead-Elected Ingress (Wardy Desk)
- **Central Authority**: The `setInterval()` poller was migrated from consumer nodes to the **Wardy Control Deck** (`fancast_control_deck.html`).
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

## 🧠 X. THE SWARM ENGINE (LLM WORKLOAD ROUTING)
As of the April 9 Deep Scan, The MARD Engine strictly enforces routing boundaries based on thermal risk:

### 1. Node .73 Core Limits (Hailo or Bust)
Node .73 handles UI, Websockets, and MARD persona execution. Local LLMs (`phi3` and `tinyllama`) can only be invoked if routed safely through the Hailo NPU. Bare-metal CPU generation is **PROHIBITED** to preserve the 33°C thermal baseline.

### 2. Node .168 Pegasus Offloading
All heavy-lifting JSON/DOM extractions are pointed directly to `192.168.1.168:11434` (`mistral:latest`), heavily leveraging the GTX 980 to chew through telemetry instantly.

### 3. Authorized Cloud Escapes (Pro Tier)
When logical intensity exceeds local VRAM capacity, the system legally scales load to authorized premium cloud providers. Cloud keys are strictly guarded in `.env` files:
- **Claude Pro (Anthropic)**: Authorized for Level 1 Deep Reasoning / Code / Logic pipelines.
- **GPT Pro (OpenAI)**: Authorized for fallback Swarm analytics or high-tier persona synthesis.

---
` [ SYSTEM_CORE : OPERATIONAL | Ω=17.0 (SWARM_ROUTING_AUTHORIZED) ] `
