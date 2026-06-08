# Sovereign OS Live Presence Dashboard Implementation Plan

This plan details the design and deployment of a full-page, real-time presence dashboard at a new `/presence` (or tab-state equivalent) route in the Sovereign OS Portal. It integrates with the HoloLink WebSocket signaling relay to list all currently authenticated users, their system roles, connection times, and triggers custom event-driven WebRTC voice calls.

## User Review Required

> [!NOTE]
> **Routing Paradigm Integration:** Since the Sovereign OS Portal uses a state-based tab routing mechanism (`activeRoom` and `activeDomain`) instead of standard React Router, the `/presence` route will be registered as a new tab view (`activeRoom === 'presence'`). When selected, the app will update the URL query parameters dynamically (e.g. `?domain=GLOBAL&room=presence`) to support deep-linking and browser navigation seamlessly.

## Proposed Changes

### Sovereign OS Frontend Config

#### [MODIFY] [PortalApps.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/config/PortalApps.tsx)
* Add the new `presence` application definition to `PORTAL_APPS` to render the launcher tile on the root dashboard.
* Define its metadata: title "Presence", subtitle "Live Mesh Sessions", color `#00d4aa` (teal), icon `<Users />`, and trigger `onNavigate('GLOBAL', 'presence')` on click.

---

### HoloLink Roster Components

#### [MODIFY] [HololinkHub.tsx (01_Sovereign_Portal)](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/HololinkHub.tsx)
#### [MODIFY] [HololinkHub.tsx (15_FanStack)](file:///home/james/SovereignOS/15_FanStack/src/components/HololinkHub.tsx)
* Add a `useEffect` listener to listen for a custom browser event (`hololink-call-user`) and immediately invoke `makeCall(detail.username, detail.displayName)`. This enables the presence dashboard to trigger voice calls cleanly without duplicate state management or circular dependencies.

---

### Presence Dashboard Component

#### [NEW] [PresenceDashboard.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/pages/PresenceDashboard.tsx)
* Create the dedicated presence dashboard component.
* **WebSocket Client:** Subscribes to the live signaling relay (`ws://127.0.0.1:8012/ws-relay`) and automatically listens for `PRESENCE_UPDATE` events.
* **Resilient Connection:** Integrates automatic connection retries and register sequence messages on reconnection.
* **UI Design:**
  * Uses premium dark panels matching the existing Sovereign OS styling system (translucent glassmorphism cards).
  * Lists users dynamically with display names, role badges (Pilot = teal, Patron = purple, Admin = red), and connection uptime details.
  * Displays a pulsing green indicator dot if the user is online.
  * Renders a "HoloLink Call" button which dispatches the custom call event to the mounted `HololinkHub`.

---

### Sovereign OS Main Portal Router

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx)
* Import the new `PresenceDashboard` component from `./pages/PresenceDashboard`.
* Register `activeRoom === 'presence'` inside the dynamic content router.
* Bind the `<PresenceDashboard />` instance when selected.

---

## Verification Plan

### Automated & Manual Verification
1. **Dashboard Tile Verification:** Verify that the "PRESENCE" tile is correctly rendered in the dashboard card layout.
2. **WebSocket Synchronization:** Open a second browser tab, log in as Eileen (`eileen`) or Pawel (`pawel`), and verify that the presence card instantly appends to the dashboard within 2 seconds.
3. **Log Out Reaction:** Click **Sign Out** on the second tab and verify that the user's card is removed instantly.
4. **Call Triggering:** Click the "HoloLink Call" button on the presence card and verify that the local Hololink dialer immediately initiates a voice call to that user.
5. **Console Check:** Verify that there are zero React/JS console warnings or connection failures.
