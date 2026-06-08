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
- [ ] **Log Rotation Check**: Ensure `/08_FanCast/logs/` is writable and a new log file for today exists.

---

## ⚾ PHASE IV: FANSTACK PRODUCTION (FC-014)
*Goal: Engertain the Hive with the gameday master feed.*

- [ ] **Master Poller Tune**:
  - Open **Wardy Control Deck** (`fancast_control_deck.html`).
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
