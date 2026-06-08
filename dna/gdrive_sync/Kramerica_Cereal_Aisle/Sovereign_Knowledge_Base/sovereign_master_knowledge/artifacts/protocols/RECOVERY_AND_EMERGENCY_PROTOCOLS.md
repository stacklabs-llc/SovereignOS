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
1.  **Hard Kill**: `ps aux | grep "fancast_relay.py" | awk '{print $2}' | xargs kill -9` (Forcefully release Port 8008).
2.  **Unified Restart**: Execute `/home/james/SovereignOS/scripts/restart_stack.sh`. This script is standardized to restart the CMDB, Relay, Chatbots, and Argus Fix with the correct log redirections.

### 4. Search-Safety: Targeted Termination (Lessons of GASTOWN-RUN)
To prevent accidental mesh dropouts, never use broad `grep` or `pkill` patterns when hunting anomalies. 
- **The Dropout Case**: During the Zork hunt, an overly aggressive `ps aux | grep zork ... xargs kill -9` inadvertently took down the `fancast_relay.py` because the command itself was caught in the buffer. 
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
To ensure long-term "Sovereign Traceability," all persona emissions must be appended to a dated physical receipt on the local drive: `/08_FanCast/logs/fancast_YYYYMMDD_HHMM.log`.
- **Reason**: Forensic analysis of "Zork" anomalies and bot hallucinations require permanent storage outside of volatile terminal buffers. 

### 4. Rule 80: The Keep-Alive Protocol (VRAM Reclamation)
All inference calls to **Ollama** must include the `"keep_alive": "5m"` JSON body.
- **Reason**: Ensures Node .73 reclaims its 8GB RAM between high-intensity moments (e.g., between innings) to prevent thermal drift.

### 5. Rule 79: The Bob Ross Protocol (Emergency Emergence)
If an anomaly leads to a superior architectural concept, agents are mandated to prioritize the emergent logic over the initial blueprint. (e.g., the power-supply-induced discovery of the Sovereign Knot).

---
` [ RECOVERY : VALIDATED | Ω=14.0 (THERMAL_SECURED) ] `
