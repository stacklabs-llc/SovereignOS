# Zero-Trust Execution Protocol

**Trigger Event:** Auto-triggered before the AI claims completion of any network-bound UI, API endpoint, or Web App feature.

## The Problem
If the AI assumes an endpoint is correct based purely on syntax and static code review, it risks providing dead local IP links (like 192.168.x.x or localhost) or pointing frontends to dead backend ports, wasting massive amounts of user time.

## The Protocol Rules
1. **The "Prove It" Rule (Mandatory Local Testing):**
   - The AI is forbidden from declaring "It is done" for any newly built or modified API route or port binding until it has executed a local terminal command (e.g., `curl -v http://127.0.0.1:<PORT>/api/target`) to verify a `200 OK` response.
   - If the endpoint returns a `500` or connection refused, the AI must silently stay in its thought loop and fix the code before responding to the user.

2. **The Tailscale Link Format Mandate:**
   - The AI must explicitly verify that any URL it provides to the user uses the Tailscale Funnel domain (`https://sov73.taila01894.ts.net`).
   - `http://localhost` and `192.168.x.x` are strictly banned from UI web links and user-facing completion messages. 
   - All React `fetch()` calls and WebSocket targets (`ws://`) must be dynamically routed or properly proxied to `0.0.0.0` bindings.

3. **UAT Live Checker Protocol:**
   - For major UI deployments, the AI should trigger `/home/james/SovereignOS/dna/dropzone/daily_23042026/uat_live_checker.py` via `run_command` to formally sign off on the mesh health before handing the UI back to the user.

## Implementation Standard
By adhering to this workflow, the Sovereign OS AI assumes 100% responsibility for Quality Assurance, ensuring that the User is only ever handed frictionless, verified, and network-stable code.
