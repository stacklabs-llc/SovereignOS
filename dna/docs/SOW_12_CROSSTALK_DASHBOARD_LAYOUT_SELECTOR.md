# SOW 12: CROSSTALK LOUNGE SELECTABLE DASHBOARD LAYOUTS
**VERTICAL:** Sovereign Sports Watch Party & FanStack Telemetry
**STATUS:** Proposed Design Spec (Pending Pilot Review and Ticket Creation)

## 1. EXECUTIVE SUMMARY
The Sovereign Sports Dashboard on Port 3010 provides real-time baseball game feeds, active advocate chat, and field vector telemetry. While the default hitter-pitcher focus matchup layout is highly optimized for close-in gameplay analysis, the user desires the ability to select from multiple dashboard layout configurations tailored to different watch-party use cases.

This specification outlines the technical design, layout variations, state management, and user interface controls required to support selectable layout "personalities" within the Crosstalk Lounge portal.

---

## 2. LAYOUT VARIANT DESCRIPTIONS

We define five selectable layout configurations, each tailored to a specific user focus:

### 2.1. Hitter-Pitcher Matchup Focus (`matchup`)
*   **Purpose**: The default high-fidelity hitter-pitcher cards and simulated live broadcast matchup.
*   **Structure**: 
    *   Left side (60% width): Broadcast/At-bat Matchup Card (60% height) + Field Vector (40% height).
    *   Right side (40% width): Chat Reactor.
*   **Visuals**: Standard telemetry HUD, Fundies grid overlay, active advocate cards.

### 2.2. Crosstalk Lounge Focus (`lounge`)
*   **Purpose**: Optimized for active discussion and live stream watch party, maximizing media and chat space.
*   **Structure**:
    *   Left side (50% width): Live Broadcast Player (100% height). Hides the bottom-left Field Vector and At-Bat matchup card.
    *   Right side (50% width): Expanded Chat Reactor (100% height) with larger message history bubble limits and visible images.
*   **Visuals**: Clean, cinematic watch room experience.

### 2.3. StatStack Analytics Focus (`analytics`)
*   **Purpose**: Tailored for data-heavy stats inspection, pitch history charts, and coordinate tracking.
*   **Structure**:
    *   Left side (40% width): Live Broadcast Player (40% height) + Coordinate Grid & Strikezone Heatmap (60% height).
    *   Center side (30% width): CitiField Field Vector (100% height) with persistent active runner coordinates.
    *   Right side (30% width): Minimized Chat & Telemetry Feed (100% height).
*   **Visuals**: High contrast neon telemetry grids, detailed advocate analytics overlay.

### 2.4. Gameday Sim Focus (`gameday`)
*   **Purpose**: Low-latency, visual play-by-play simulation without live video.
*   **Structure**:
    *   Left side (70% width): Full-screen expanded CitiField Field Vector showing runner animations and pitch coordinate points.
    *   Right side (30% width): Play-by-play text event log and minimized Chat Reactor.
*   **Visuals**: Focuses entirely on telemetry data ingestion and field graphics.

### 2.5. Pennant Race Grid (`multigame`)
*   **Purpose**: Monitoring multiple games simultaneously in a split-screen viewport.
*   **Structure**:
    *   2x2 grid (or 1x3 row depending on active game count) showing miniature game cards for up to 4 concurrent games.
    *   Each card renders real-time inning, score, pitcher/batter matchup summary, and active runner status.
    *   Selecting a card switches the primary workspace focus to that game room.
*   **Visuals**: High-density board layout representing the full league state.

---

## 3. STATE MANAGEMENT & UI INTEGRATION

### 3.1. Layout Select Control
We will introduce a layout selector dropdown or button group directly in the Crosstalk Lounge header row (to the left of the Theme Selector).
```tsx
const [activeLayout, setActiveLayout] = useState<'matchup' | 'lounge' | 'analytics' | 'gameday' | 'multigame'>('matchup');
```

### 3.2. Layout Implementation
We will wrap the main panels of `SovereignSportsDashboard.tsx` in a conditional rendering block or dynamic CSS grid that adjusts structure classes based on the `activeLayout` prop:
*   Use standard CSS class mappings: `.layout-matchup`, `.layout-lounge`, `.layout-analytics`, `.layout-gameday`, `.layout-multigame`.
*   Style the layout structures in `index.css` or inline styles utilizing flex and grid values.

### 3.3. Database Ingress Configuration
To preserve the user's preference across reloads, the selected layout personality can be stored in the session table in `sovereign_now.db`.

---

## 4. VERIFICATION AND TESTING
*   **UAT Validation**: Verify that switching layouts instantly updates the UI container widths and visibility settings.
*   **No-Scroll Audit**: Validate that all five layouts strictly adhere to the `100vh`/`100vw` height containment constraints, ensuring zero page-level scrollbars are rendered.
