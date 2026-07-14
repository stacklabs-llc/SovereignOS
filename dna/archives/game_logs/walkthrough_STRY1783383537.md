# Walkthrough - STRY1783383537: FanStack Telemetry and Dashboard Stabilization

## 1. Goal / Summary
This walkthrough details the comprehensive stabilization of the FanStack sports telemetry and dashboard portal:
- **Telemetry Stream Sanitization (`fanstack_relay.py`)**: Intercepts empty or placeholder pitch packets containing `"---"` pitch metrics, dropping them in `CMD_SYNC_STATE` to prevent UI rendering stalls and loop storms.
- **React UI Stabilization (`SovereignSportsDashboard.tsx`)**:
  - Replaced unstable keys for `displayedMessages` list items with high-entropy composite keys (`msg-${msg.id}-${msg.user}-${msg.time}-${index}`) to resolve React rendering loops and key collisions.
  - Implemented dynamic queue batching (up to 10 items processed per 50ms interval) to smooth UI stutter under heavy telemetry volume.
- **WebSocket Resilience (`FanFanStackPortal.tsx`)**:
  - Replaced hardcoded 3s reconnection logic with exponential backoff + 20% random jitter (1s base, doubling up to 30s) to avoid client connection spamming.
- **Vite HTTPS & WSS Proxy Hardening (`vite.config.ts`)**:
  - Configured `proxyReqWs` in Vite's proxy config to explicitly append `Connection: Upgrade` headers. This prevents WebSocket connections from being closed or rejected by the browser/proxy under secure HTTPS connections.
  - Added dedicated `server.hmr` configuration for port 3010 to use protocol `wss` and host `clio.taila01894.ts.net` for error-free hot reloading.
- **React Router Future Warnings (`App.tsx`)**:
  - Added the `future` prop (`v7_startTransition: true, v7_relativeSplatPath: true`) to `<BrowserRouter>` to suppress React Router deprecation warnings in the console.

---

## 2. Web Access & Setup Guide
To access and verify the stabilized sports portal:
- **Sports Portal (Tailscale)**: `https://clio.taila01894.ts.net:3010/`
- **SDLC Portal**: `http://127.0.0.1:8095/`

---

## 3. Step-by-Step Verification Guide
1. **Access the Sports Dashboard**: Navigate to `https://clio.taila01894.ts.net:3010/` over Tailscale. Confirm the home page renders cleanly with no console warnings regarding React Router or WebSocket failures.
2. **WebSocket & HMR Check**: Inspect the browser DevTools console. Verify that:
   - The HMR connection over `wss://clio.taila01894.ts.net:3010/...` is established successfully.
   - The portal WebSocket `wss://clio.taila01894.ts.net:3010/mesh-ws?gamePk=824900` resolves without handshake rejections.
3. **Verify via Automated Python Script**:
   - Run the custom validation script to verify client-server messaging:
     ```bash
     /home/james/SovereignOS/.venv/bin/python3 /home/james/.gemini/antigravity/brain/f4fd333c-3d6b-4322-8502-b5ca2880a48d/scratch/test_proxy_wss.py
     ```
   - Verify output ends with:
     ```
     Connecting to wss://clio.taila01894.ts.net:3010/mesh-ws?gamePk=824900 via WSS...
     Sent JOIN_ROOM message.
     Received response type: STATE_UPDATE
     Received response type: CHAT_HISTORY
     Found 100 messages in history.
     ```

---

## 4. Database Verification Proof
Query the ticket status in the SQLite database to confirm resolution state:
```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT number, state, work_notes FROM sovereign_tickets WHERE number = 'STRY1783383537';"
```

### Expected Output:
```
STRY1783383537|4|Stabilized Sports Dashboard and FanStack Portal WebSockets under HTTPS and MagicDNS.
```
