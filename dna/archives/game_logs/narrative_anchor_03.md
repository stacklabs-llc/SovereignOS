# 🧬 SOVEREIGN OS NARRATIVE GROUND-TRUTH (PRODUCTION STATE: MAY 26, 2026)
**CRITICAL FACTUAL MANDATE FOR ALL AI WRITERS, NARRATORS, AND DIRECTORS:**
This document serves as the absolute, current source of truth for the Sovereign OS. If any historical developer log, conversation archive, or consolidated session report contradicts this ledger, this ledger MUST override it.

---

## 💻 1. Core Hosting & Hardware Architecture
*   **The Production Server (clio):** The entire Sovereign OS backend—including the FastAPI Core, M.A.R.D. engine, WebSocket gateways, and the SDLC Ticketing database APIs—runs exclusively on **clio**, a powerful multi-core workstation.
*   **The Raspberry Pi Kiosks (metsy-prime, argo):** Raspberry Pis are strictly used as **kiosk nodes** to render the local frontends and interactive display boards (e.g., `metsy-prime` is a Pi 3 serving the 16-bit RPG board on port 7300 to the 55-inch living room TV). It is physically impossible to host the entire LLM narrative swarm on a Pi.
*   **The Thermodynamic Moat:** We achieve our 15-watt power signature by utilizing private Tailscale edge nodes (Orin/EPYC arrays) and a highly optimized Python orchestration engine, not by running the whole OS on a single $40 circuit board.

---

## ⚾ 2. Sports Ingestion & Telemetry
*   **Primary Data Feeder:** Live sports play-by-play, box scores, and game telemetry are driven exclusively by high-speed digital integrations with the **MLB StatsAPI / Statcast** (`fanstack_background_poller.py` and `cron_game_monitor.py`).
*   **Webcam Ingestion (Edge DVR):** Pointing a physical webcam at the flat-screen TV to scan the score bug frame-by-frame is a brilliant, legally defensible **experimental fallback**, NOT the active production data source.

---

## 👥 3. Active Personas & Population
*   The production chat rooms currently register **130 active, memory-endowed personas** mapped to the 30 MLB franchises (3 personas per team, plus system commentators). 
*   Any references to "141 characters" or other counts in historical logs refer to deprecated files, utility daemons, or testing models before the consolidated cleanup.

---

## 🪴 4. GardenStack & Feline Telemetry
*   **Decoupled Frontends:** GardenStack and AetherVet are separate, decoupled portals.
*   **Felony Mode:** Sam's "Felony Mode" is a specific night-vision perimeter overlay that takes over the yard telemetry screen on port 7300 to track catnip heists, not a dual-mode wholesome Jekyll-and-Hyde app.
*   **One Orange Brain Cell:** Yes, Sam the Stray is officially registered in our CMDB with *one orange brain cell*. This is a permanent, non-negotiable system config.
