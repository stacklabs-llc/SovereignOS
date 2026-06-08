# Implementation Plan: PersonaCenter — Universal Core Infrastructure (STRY1779942800)

We will refactor `PersonaCenter` into a robust, first-class, team-scoped **Universal Core Infrastructure Component** of Sovereign OS. The team-based scoping rules will be fully enforced at the FastAPI backend level based on the authenticated user's role-to-team mapping (`ROLE_TEAM_MAP`). The frontends of `01_Sovereign_Portal`, `15_FanStack`, and `21_WildSeed_GardenStack` will all fetch from `/api/personas` and `/api/personas/teams`, inheriting clean scoping automatically without any portal-specific logic.

---

## Proposed Changes

### Phase 1 — Backend: Universal API Team-Scoping in core API

#### [MODIFY] [sovereign_core_api.py](file:///home/james/SovereignOS/scripts/sovereign_core_api.py)
*   **Implement `ROLE_TEAM_MAP`**:
    *   Single source of truth dictionary mapping role names (e.g. `garden_client`, `creator`) to stack teams (e.g. `WEEDSTACK`).
*   **Update `GET /api/personas`**:
    *   Secured via `get_current_user` dependency.
    *   Allows `pilot` and `admin` roles to retrieve all personas across all teams.
    *   Filters and returns only team-matching personas for non-pilot roles based on `ROLE_TEAM_MAP`.
*   **Update `PATCH /api/personas/{persona_id}`**:
    *   Resolves the persona by `id` or `user_name` string slug.
    *   Non-pilots can only patch personas belonging to their allowed team.
    *   Pilot-only fields (`system_prompt`, `cadence`, `deep_lore`, `governance`, `team`, `user_name`) are stripped from non-pilot payloads.
    *   Caps `boggs_level` at `3` for non-pilots.
    *   Only allows whitelisted fields (`display_name`, `avatar_url`, `boggs_level`).
*   **Add `GET /api/personas/teams`**:
    *   Returns list of unique teams available in the database for Pilots to filter on.
    *   For non-pilots, returns just their permitted team.

---

### Phase 2 — Frontend: Single Universal PersonaCenter Component

#### [NEW] [PersonaCenter.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/PersonaCenter.tsx)
*   Refactor the existing component to use the new scoped API endpoints: `/api/personas`, `/api/personas/teams`, and `PATCH /api/personas/{id}`.
*   Supports full-featured **Pilot mode** showing all teams with a filter dropdown, full edit fields, and custom system promting.
*   Supports restricted **Non-pilot mode** showing a simplified profile grid, clamped Boggs tone options (`Chill` -> 1, `Standard` -> 2, `Engaged` -> 3), a read-only team/cadence badge list, and a dynamic feed of the persona's last 5 posts from `GET /api/hot_takes?persona={user_name}&limit=5`.
*   Aesthetic: Premium dark glassmorphic design utilizing beautiful CSS gradients, Micro-animations, and Inter/Outfit typography.

#### [NEW] [PersonaCenter.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/PersonaCenter.tsx)
*   A clean symlink or hardcopied build-time replication of the universal component to `15_FanStack`.

#### [NEW] [PersonaCenter.tsx](file:///home/james/SovereignOS/21_Wildseed_GardenStack/src/components/PersonaCenter.tsx)
*   A clean symlink or hardcopied build-time replication of the universal component to `21_Wildseed_GardenStack` (replacing the temporary scoped version).

---

### Phase 3 — Portal Mounts & Routing

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx)
*   Add sidebar routing and menu item linking to `/personas` using standard layout.

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/15_FanStack/src/App.tsx)
*   Ensure sidebar and route `/personas` are perfectly mapped.

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/21_Wildseed_GardenStack/src/App.tsx)
*   Map `/personas` nav item and viewport mounting.

---

## Verification Plan

### Backend Integration Tests
*   `GET /api/personas` as `pilot` (gets all records).
*   `GET /api/personas` as `garden_client` (gets only `WEEDSTACK`).
*   `GET /api/personas/teams` as `pilot` (lists all unique teams).
*   `GET /api/personas/teams` as `garden_client` (returns only `["WEEDSTACK"]`).
*   `PATCH /api/personas/{id}` with pilot-only values as non-pilot (silently ignored).
*   `PATCH /api/personas/{id}` with `boggs_level: 5` as non-pilot (clamped to `3`).

### Frontend Compilation
*   Build all 3 micro-frontends natively to verify flawless compilation:
    1.  `01_Sovereign_Portal`
    2.  `15_FanStack`
    3.  `21_WildSeed_GardenStack`
