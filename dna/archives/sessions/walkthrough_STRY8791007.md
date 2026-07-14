# Walkthrough: Playcall Desk Layout & Telemetry Mapper Enhancements (STRY8791007)

We have completed the layout adjustments and seeded the necessary rule data for the **Playcall Desk** and **Telemetry Mapper** widgets.

## Summary of Changes

### 1. Dormant Switch Layout Migration
- **Location Updated:** Moved the **Dormant Switch** container out of the overrides tab and placed it in the always-visible upper status header area in `PlaycallDesk.tsx`.
- **Aesthetic Alignment:** Formatted the switch container using HSL-based Sovereign Home Premium colors, matching height (38px) with the Target Game Room select and Connection Status fields.
- **Cleaned Overrides Tab:** Centered the active room state overrides controller to 800px max-width, maintaining structural balance now that the sidebar switch has been decoupled.

### 2. No-Code Telemetry Condition Builder Seeding
- **Table Populated:** Inserted 4 mock rules into `sys_overlay_registry` representing key Statcast triggers:
  1. *Triple Digit Heat Tracker* (pitch_speed > 100 → CRIMSON_BLEED)
  2. *Spidey Ninth Inning Closer* (inning == 9 → SPIDEY_WIPE)
  3. *Metsy Fundies Check* (status_msg CONTAINS fundies → FUNDIES_GRID)
  4. *Monster Launch Angle Alert* (launch_speed > 115 → APPLE_MASK)

### 3. TMI Telemetry Trigger Mapper Seeding & Team Dropdown Refactor
- **Table Seeded:** Populated `sys_tmi_telemetry_map` with realistic test rules mapping to target webslinger events (e.g. *Juan Soto Launch Rocket*, *Diaz Gas Pitch*, *Ghost Fork Strikeout*, *De La Cruz Speed Burst*).
- **Dynamic Team Constraint:** Modified `TelemetryMapper.tsx` to build the `Batting Team Constraint` dropdown list dynamically from the loaded `availableGames` payload.
- **Robust Fallbacks:** Added team option resolution logic with a standard list of teams if no games are active, ensuring the currently selected team constraint is always included in the dropdown to avoid invalid select states.

---

## Verification & Testing
1. **Compilation Check:** Ran Vite project production build `npm run build` in the sports stack successfully.
2. **Database Verification:** Confirmed seeded rows are populated in sqlite.
3. **Daemon Recycled:** Executed `restart_stack.sh` successfully to load all updated routes and services.

Tested-by: Antigravity
Link to Sports Dashboard: [https://clio.taila01894.ts.net:3010/](https://clio.taila01894.ts.net:3010/)
