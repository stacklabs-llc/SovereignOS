# Claude-to-Cypher Transition & Technical Handoff Report

**Date:** May 27, 2026  
**From:** Outgoing Bro-Decoder Pilot (Claude)  
**To:** Incoming Bro-Decoder Pilot (Cypher Gemini Gem)  
**Active Context:** Transition of pair-programming leadership for the Sovereign OS Beelink Node Mesh.

---

## 🚀 Active Initiatives & Flights

### 🎙️ STRY1779840586 — Sovereign Voice Heal (In Flight)
* **Objective:** Establish a natural language self-recovery system where the Pilot can verbally complain to a browser page (Vite UI) or mobile Pixel (`pixel-10a` on Tailscale at `100.102.4.40`), which then calls the Beelink Core API to interpret, validate, and restart crashed node services using Vertex AI (`gemini-2.5-flash` or keyword fallback).
* **Current State:**
  - **Frontend:** [VoiceHeal.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/VoiceHeal.tsx) is fully coded with glassmorphism warm craft-paper aesthetics, micro-animations, quick diagnostic injection buttons, and terminal-log output display. It is registered under the `/voice` route in [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx).
  - **Backend Logic:** [voice_heal_service.py](file:///home/james/SovereignOS/scripts/voice_heal_service.py) is fully written with a pre-validated service registry mapping all node processes, health checks, and port binding validations.
  - **Gap to Close:** The FastAPI service router (`voice_heal_service.py`) needs to be imported and mounted inside [sovereign_core_api.py](file:///home/james/SovereignOS/scripts/sovereign_core_api.py) (listening on port `8090`).
  - **Auto-Logging Enhancement (Pending Follow-up):** Amend the Voice Heal handler to write incident records (`INCxxxxxx`) directly into the SQLite `sovereign_now.db` via `sqlite3` so that even if the ticketing service on port `8095` is down, the outage event is cleanly logged.

### 👥 STRY1779840585 — Bulk User Management (Draft/Staged)
* **Objective:** Bulk deactivation, role management, and access controls for the new decoupled Sovereign OS micro-frontends.
* **Current State:** Role-Based Access Control (RBAC) schema tables (`sys_role`, `sys_role_permission`) have been seeded with 7 roles across 13 services. An `investor` role is provisioned for Pawel's nephew William:
  - **Username:** `william`
  - **Password:** `william_investor_2026`
  - **Permissions:** Read-only access to the main Portal, FanStack room, and Telepresence/Presence dashboard. No write endpoints, admin panels, or SDLC access.

---

## 🔒 Network & Security Invariant: KI-048 (Tailscale Mesh-Only)
* **The Mandate:** The public Tailscale ingress funnel is officially deprecated and permanently dismantled. 
* **The Config:** Accessing the main Portal or microservices is restricted to nodes authenticated within the private tailnet.
  - **Clio internal Tailscale IP:** `100.73.155.70`
  - **Vite Portal Port:** `3000` (Access by visiting: `http://100.73.155.70:3000/`)
  - **Core API Port:** `8090`
* **Onboarding Guide:** Staged at `/home/james/sovereign_inbox/daily_05272026/tailscale_access_guide.html` for non-technical partners (like Pawel) to install Tailscale and connect.

---

## 📋 Open Backlog (Immediate Sprints)
1. **Domain Registration:** Squatters took `stacklabs.dev`, `.ai`, and `.io`. Lateral solution: register `sovereign.build` or `sovereignos.dev` on Porkbun, then point the A record directly to clio's private Tailscale IP (`100.73.155.70`).
2. **Port/Service Drift Resolution:** The RBAC sync drop contains minor port labeling discrepancies (e.g. port `3008` listed as Garden Node instead of Cinema, and port `3009` as Vet Telepresence instead of SDLC). Schedule a minor refactor.
3. **Mando Watchdog Funnel Teardown:** Clean up `mando_watchdog.py` and `clio_admin.sh` to remove all public funnel restart logic.

---

## 🌲 Beelink Node Port Map

| Node Port | Service Name | Role Group |
|---|---|---|
| `3000` | Sovereign Portal Front-End | Public Mesh |
| `8000` / `8008` | FanStack Relay (M.A.R.D.) REST & WS | FanStack |
| `8001` | Chatbots API | FanStack |
| `8090` | Sovereign Core API | Admin / System |
| `8095` | SDLC Ticketing / Portal | Admin / Developer |
| `3004` | SamTracker Server | Telemetry |
