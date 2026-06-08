# SOW 02: GARDENSTACK / WILDSEED (BOTANICAL OVERWATCH)
**VERTICAL:** Precision Agriculture & Commercial Greenhouse Monitoring
**STATUS:** Blueprinting Phase
**HARDWARE NODES:** Node .170 (Grogu) / The Argus Optical Array

## 1. EXECUTIVE SUMMARY
Formally known as FloraCore, GardenStack is an edge-native precision agriculture engine. It shifts reliance away from heavy cloud computing, instead deploying the "SETI Filter" logic directly onto local hardware nodes to monitor plant health, detect irrigation anomalies, and spot visual signs of rapid decay or nutrient deficiency before data is ever sent to the cloud.

## 2. TECHNICAL ARCHITECTURE
* **Optical Ingestion:** Visual and thermal telemetry gathered via the Argus Optical Mesh (Raspberry Pi Zero 2 W cameras).
* **The SETI Filter:** Local edge-compute logic that acts as a gatekeeper. It only transmits images or alerts when an anomaly (pixel degradation, thermal spike, or soil moisture loss) crosses a predefined threshold.
* **Data Layer:** Telemetry is written directly to the Extranet mesh via RPC bypass logic.

## 3. UI / UX REQUIREMENTS (THE GLASS)
* **The FloraCore Command Center:** A multi-pane split screen displaying live optical feeds adjacent to thermal graphs.
* **Metrics Dashboard:** Real-time readings on node status, network latency, and botanical health indexing.
* **Cast Target:** Fully optimized to be deployed to the 65-inch Fire TV via the ADB Bridge (`vesper_tv_launch.py`).

## 4. IMMEDIATE DEVELOPMENT MILESTONES
1.  **Node Provisioning:** Flash and deploy the "Grogu" edge node with the SETI Python daemon.
2.  **Telemetry API:** Construct the `/api/wildseed_ingest` endpoint on Node .73 to receive threshold-breach packets.
3.  **HMR Component:** Build `WildseedOverwatch.tsx` to display real-time optical changes triggered by Extranet pushes.
