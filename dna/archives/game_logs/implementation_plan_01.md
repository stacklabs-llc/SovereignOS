# Implementation Plan - WeedStack Rebranding & Seeding Integration (STRY1779936909)

This plan details the technical approach to rebranding the WildSeed simulated community room and telemetry routes to **WeedStack**, setting its room key to `WEEDSTACK_SIM_001`, and configuring its path routing to `/weedstack`. These updates will be applied across the frontend portals (`01_Sovereign_Portal`, `15_FanStack`) and the backend python scripts before executing database seeds.

---

## User Review Required

We are modifying the routing key, WebSocket subscription target, and database seeding profiles to deploy the new **WeedStack** community platform.

> [!IMPORTANT]
> **Key Integration Changes Proposed:**
> - **Route Rebranding**: Rename route identifier `wildseed` to `weedstack` across all `App.tsx` and routing elements.
> - **Room Key Update**: Change room key from `WILDSEED_SIM_001` to `WEEDSTACK_SIM_001` in all websocket payloads, connection logs, and database entries.
> - **Script Update**: Modify `scripts/seed_wildseed_room.py` (renaming it to `scripts/seed_weedstack_room.py`) to register the `WEEDSTACK_SIM_001` room in the CMDB and populate it with WeedStack-specific event context.
> - **Moderator Hook Integration**: Ensure `scripts/mean_gene.py` CLI self-test matches the updated room key.

---

## Open Questions

None. The work order details, HSTS routes, and database seeding structures are fully specified.

---

## Proposed Changes

### [Sovereign OS Portal](file:///home/james/SovereignOS/01_Sovereign_Portal)

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx)
- Replace `'wildseed'` with `'weedstack'` in the `activeRoom` state union type.
- Update `validRooms` routing lists to include `'weedstack'` instead of `'wildseed'`.
- Change navigation menu item button click behavior and label from "Wildseed Community" to "WeedStack Community".
- Update conditional rendering sections for the room view to match the `'weedstack'` key.

#### [MODIFY] [FanStackRoom.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/FanStackRoom.tsx)
- Update socket subscription registration to send `target_game_pk: "WEEDSTACK_SIM_001"`.
- Update send message action payload to target `room: "WEEDSTACK_SIM_001"`.
- Rename UI headers to `WEEDSTACK SIMULATED ENVIRONMENT [WEEDSTACK_SIM_001]`.
- Update initial local context events and logging to reference "WeedStack" instead of "Wildseed".

---

### [FanStack / Sports](file:///home/james/SovereignOS/15_FanStack)

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/15_FanStack/src/App.tsx)
- Change union types and valid rooms arrays from `'wildseed'` to `'weedstack'`.
- Rebrand the navigation item tab and pathname routing to `'weedstack'`.

#### [MODIFY] [FanStackRoom.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/FanStackRoom.tsx)
- Rebrand room keys, headers, and local initial event descriptions to align with the WeedStack room key `WEEDSTACK_SIM_001`.

#### [MODIFY] [WildseedPitch.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/WildseedPitch.tsx)
- Rebrand titles and text descriptions from "Wildseed Farms" to "WeedStack Farms" to preserve brand parity.

---

### [Sovereign Core Scripts](file:///home/james/SovereignOS/scripts)

#### [NEW] [seed_weedstack_room.py](file:///home/james/SovereignOS/scripts/seed_weedstack_room.py)
- Re-create/rename database seed script to target `WEEDSTACK_SIM_001`, seeding dynamic yapper personas, tension profiles, and context events under the new "WeedStack" banner.

#### [DELETE] [seed_wildseed_room.py](file:///home/james/SovereignOS/scripts/seed_wildseed_room.py)
- Delete the stale/unused wildseed seed script to keep the workspace clean.

#### [MODIFY] [mean_gene.py](file:///home/james/SovereignOS/scripts/mean_gene.py)
- Update CLI self-test room coordinates to use `WEEDSTACK_SIM_001`.

---

## Verification Plan

### Automated & Database Seeding
- Run `python3 scripts/seed_weedstack_room.py` and verify database entries exist under `WEEDSTACK_SIM_001` room key in the `cmdb_ci_fanstack_room` and related tables of `sovereign_now.db`.
- Run `python3 scripts/mean_gene.py` local self-test and verify it processes toxicity checks using the updated room identifier.

### Frontend Compilation & UI Verification
- Build both portals (`npm run build`) to ensure all typescript types and components compile perfectly.
- Start or reload Vite dev servers on port `3000` (Sovereign Portal) and port `3010` (FanStack Portal).
- Use a **browser subagent** to navigate to `https://clio.taila01894.ts.net/` and `https://clio.taila01894.ts.net:3010/`:
  - Navigate to `/weedstack` path and verify WeedStack Room loads with real-time M.A.R.D. Relay commentary.
  - Verify that the yappers chat actively under the `WEEDSTACK_SIM_001` simulation room key.
