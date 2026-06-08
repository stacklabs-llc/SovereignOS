# Implementation Plan: STRY-06042026-FRONTDOOR

Swap the default landing page (Port 3000) with a minimalist, high-end StackLabs entry console, redirecting to the main portal on Port 3016.

## User Review Required

> [!IMPORTANT]
> This will swap the ports of the main Sovereign OS Portal (moving from 3000 to 3016) and the StackLabs Monolith (moving from 3016 to 3000). The cockpit script `clio_admin.sh` and server starter script `restart_servers.sh` will be updated to reflect this swap.

## Proposed Changes

### Database Layer

#### [MODIFY] [sovereign_now.db](file:///home/james/SovereignOS/dna/sovereign_now.db)
- Register `STRY-06042026-FRONTDOOR` in `rm_story` table.
- Relocate default launcher hub out to Port 3016:
  ```sql
  UPDATE sys_module SET port = 3016, description = 'Sovereign Systems & Configuration' WHERE module_name = 'app_directory';
  ```
- Elevate StackLabs to Port 3000:
  ```sql
  UPDATE sys_module SET port = 3000, active = 1, description = 'Edge-Native Bare-Metal Software Foundry' WHERE module_name = 'stacklabs';
  ```
- Insert or update the `app_directory` module entry if not present.
- Update `sys_role_permission` for `Sovereign OS Portal / FanStack Hub` to port 3016.

### Scripts & Daemon Configuration

#### [MODIFY] [sync_modules_db.py](file:///home/james/SovereignOS/scripts/sync_modules_db.py)
- Update `stacklabs` in the apps list to port `3000` and `active = 1`.
- Add `app_directory` in the apps list with port `3016` and category `config`.

#### [MODIFY] [restart_servers.sh](file:///home/james/SovereignOS/scripts/restart_servers.sh)
- Reconfigure port arrays to include `3016`.
- Swap server directories: run `16_StackLabsLLC` on port `3000`, run `01_Sovereign_Portal` on port `3016`.

#### [MODIFY] [clio_admin.sh](file:///home/james/SovereignOS/scripts/clio_admin.sh)
- Update `Sovereign OS Portal` to Port 3016.
- Add `StackLabs Monolith` to the `SERVICES` array on Port 3000.
- Update `Wildseed GardenStack` to Port 3017 to avoid any port conflicts.

### Backend Endpoints

#### [MODIFY] [sovereign_core_api.py](file:///home/james/SovereignOS/scripts/sovereign_core_api.py)
- Implement `@fastapi_app.get("/api/public/identify")` endpoint to resolve client IP topography headers and return personalized greeting tags:
  - `100.73.155.70` (Pilot Desktop) -> `james`
  - `100.104.239.107` (Metsy-Prime Mobile) -> `dbarb`
  - `100.88.5.122` (Hobbes Laptop) -> `sean`

### Frontend Components

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/16_StackLabsLLC/src/App.tsx)
- Rebuild the page into a gorgeous, dark, minimalist gateway layout featuring an impossible 3D hexagon logo watermark (using clean inline SVG).
- Add support for querying `/api/public/identify` to display personalized greetings.
- Implement the `[ ACCESS SOVEREIGN OS ]` button that redirects to `https://clio.taila01894.ts.net:3016/` over the private Tailnet link.
- Display a glowing Tailscale status bar at the bottom: "Secure Tailscale Mesh Mesh Operational".
- No external SaaS stylesheet dependencies or third-party fonts (utilizing monospace standard).

#### [MODIFY] [PortalApps.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/config/PortalApps.tsx)
- Update `stacklabs` onClick callback to target port `3000` (`https://clio.taila01894.ts.net:3000/`).

## Verification Plan

### Automated Tests
- Run `curl -k -I https://clio.taila01894.ts.net:3000/` and verify redirection.
- Query `/api/public/identify` with custom client IP headers to verify recognition logic.

### Manual Verification
- Deploy using `restart_servers.sh` and verify both portals launch on their swapped ports.
