# Implementation Plan — DFCT0000482

The goal of this change is to fix the HoloLink WebSocket connection failure when accessed via Tailscale's port 443 proxy. Under HTTP/2, Tailscale's HTTPS termination strips or does not properly translate the `Connection: Upgrade` header, causing the python `websockets` backend on port 8012 to reject the connection with a 426 status code. Bypassing the Tailscale reverse proxy and connecting directly to the Vite dev server port resolves this issue.

In addition, concurrent database writes are optimized by enabling Write-Ahead Logging (WAL) mode on `sovereign_now.db`, completely preventing the "database is locked" errors experienced by the Pilot and background daemons.

## User Review Required

> [!NOTE]
> This patch changes the WebSocket URL resolution in the frontend. When the application detects that it is being accessed via the Tailscale HTTPS port 443 proxy (no port or port 443 in the URL), it will dynamically route WebSocket traffic to the direct Vite dev server port (port 3000 for the Portal, port 3009 for FanStack).
> 
> This completely bypasses the Tailscale HTTP/2 WebSocket upgrade bug, making connection establishments instant and highly reliable.

## Proposed Changes

---

### [Component: 01_Sovereign_Portal]

#### [MODIFY] [api-host.ts](file:///home/james/SovereignOS/01_Sovereign_Portal/src/api-host.ts)
- Update `getWsUrl` to dynamically fallback to port `3000` when the URL port is empty/443 under HTTPS.

#### [MODIFY] [HololinkHub.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/HololinkHub.tsx)
- Update the inline `getWsUrl` function to dynamically fallback to port `3000` when the URL port is empty/443 under HTTPS.

#### [MODIFY] [MobileRemote.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/MobileRemote.tsx)
- Update the inline `wsHost` resolution to fallback to `${window.location.hostname}:3000` when accessed via port 443 under HTTPS.

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx)
- Replace raw manual `ws-relay` string concatenation inside the CypherCell trigger with a call to the robust imported `getWsUrl('/ws-relay')`.

---

### [Component: 15_FanStack]

#### [MODIFY] [api-host.ts](file:///home/james/SovereignOS/15_FanStack/src/api-host.ts)
- Update `getWsUrl` to dynamically fallback to port `3009` when the URL port is empty/443 under HTTPS.

#### [MODIFY] [HololinkHub.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/HololinkHub.tsx)
- Update the inline `getWsUrl` function to dynamically fallback to port `3009` when the URL port is empty/443 under HTTPS.

## Verification Plan

### Automated Verification
- Verify that standard HTTP/1.1 WebSocket connections continue to route correctly.
- Verify that standard API endpoints continue to target the default hosts without regression.

### Manual Verification
- The Pilot or other users logged into both `https://clio.taila01894.ts.net/` and `https://clio.taila01894.ts.net:3009/` will instantly establish a WebSocket connection and register with the mesh relay on port 8012.
- Online users will show up under HoloLink online list, enabling direct clicking and Telepresence/Aether Vet calling.
