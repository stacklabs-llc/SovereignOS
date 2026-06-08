# SOVEREIGN OS (CHIN-1) USER & ADMIN GUIDE
**AUTHORITY:** Master System Auditor (Node .73)
**VERSION:** 1.0 (Argon Case Prime Time Edition)
**DATE:** April 16, 2026

## 1. CHIN-1 USER OPERATIONS (DAILY FLIGHT)

As an authorized user on the Sovereign network, your primary engagement is through the React Unified Matrix (The Glass).

### 1.1 Accessing the Command Center
* **Local Access:** Open your browser to `http://localhost:1934`.
* **The Interface:** The system defaults to the Command Center (Starter). All environments utilize the Vesper Synthwave aesthetic (Deep Void / Neon Cyan).
* **Navigating UHF Studio & FanStack:** Routing is handled dynamically. The UHF Studio contains the Savant Query Block and the FanStack Chat observation deck.

### 1.2 Extranet Actuation (The Doggy Door)
* **Remote Access:** The Sovereign OS is exposed securely via the Tailscale Funnel at `https://sov73.taila01894.ts.net/`.
* **Payload Injection:** Cloud and mobile agents can directly write to your UI by triggering GET requests to `/api/write_savant?payload=` encoded in base64. 
* **The Magic:** Vite's Hot Module Replacement (HMR) will instantly render any injected payload visually without requiring a manual refresh.

---

## 2. CHIN-1 ADMIN OPERATIONS (SYSTEM MAINTENANCE)

This section covers Tier-1 (Chin-1) sysadmin tasks for maintaining the health and stability of the Node .73 architecture.

### 2.1 Daemon Management
The background pipelines keep the Sovereign core alive.
* **Extranet Gateway (apiary_rest_server.py):** Binds to Port 8090. Responsible for catching incoming payload mutations. 
  * *Check Status:* `ps -ef | grep apiary_rest_server.py`
  * *Restart:* `python3 /home/james/SovereignOS/apiary_rest_server.py &`
* **M.A.R.D. Engine WebSocket:** Binds to Port 8008. Handles the real-time Costanza JSON stream serving the AI personas.

### 2.2 Reclaiming the Root (Chin-3 Sweep)
If the `/home/james/SovereignOS` root directory begins accumulating bloat, loose test scripts, or media files:
* **The Command:** Run the automated sweeper to safely vault all unapproved files.
* `bash /home/james/SovereignOS/scripts/chin3_root_sweep.sh`
* *Note:* This strictly enforces Rule 1 (Never Delete). It only moves items to `/staging/deep_dive_vault/`.

### 2.3 The Master Memory (ServiceNow Parity)
The Sovereign OS mimics an enterprise CMDB.
* **Component:** `dna/sovereign_now.db` (SQLite)
* **Accessing:** You can manually alter AI identities by directly accessing the `sys_user` and `sys_user_group` tables inside this database. 

---

## 3. CHIN-1 TROUBLESHOOTING & EMERGENCY PROTOCOLS

> [!WARNING] 
> Never attempt a blind `rm -rf` command when diagnosing root issues. Rule 1 heavily applies.

### Issue: The React Matrix / UI is Down or Frozen
* **Diagnosis:** Vite dev server crashed or choked on a massive HMR payload.
* **Fix:** SSH into Node .73. Navigate to `01_Sovereign_Portal/`. Run `npm run dev`.

### Issue: Cloud Extranet Injections Are Failing
* **Diagnosis:** The Tailscale mesh has dropped, or the Python REST server crashed.
* **Fix 1 (Mesh):** Verify Tailscale routing by running `tailscale status`.
* **Fix 2 (Gateway):** Ensure `apiary_rest_server.py` is running and listening on `8090`. Check proxy length limits if the JSON payload is massive (you may need to switch to chunked deployment).

### Issue: Hallucinating or "Stank" Cloud AI Agents
* **Diagnosis:** The LLM is suffering from Context Collapse (NESO) and guessing the architecture.
* **Fix:** Immediately supply the compromised agent with `dna/docs/SOVEREIGN_UNIVERSAL_ATLAS_V4.md`. This "Thomas Guide" will force the agent to instantly ground itself to the physical reality of the ecosystem.
