# Walkthrough: StackLabs Persona Renaming Pass (Clio Architect ➔ Sysop Barker)

## Goal
The goal of this ticket was to update the StackLabs Lead Architect preset persona from **Clio Architect** to **Sysop Barker** (The Bare-Metal Blue-Heeler Archivist). This ensures the structural canine aesthetic remains consistent, resolving the conflict where Clio and Barf Prime were both dogs but Clio's name did not fit the asset map.

## Changes Made

### 1. Configuration Presets
- **[sovereign_core_api.py](file:///home/james/SovereignOS/scripts/sovereign_core_api.py)**
  - Modified the asynchronous parallel persona seeder prompts (lines 2779-2845) to substitute `Clio Architect` with `Sysop Barker` and `clio_architect` with `sysop_barker`.
  - Updated Allied Faction alignment references inside other persona configurations to point to `Sysop Barker`.

### 2. Avatar Mappings & Assets
- **[avatarMap.json](file:///home/james/SovereignOS/01_Sovereign_Portal/src/avatarMap.json)**
  - Added mappings for `"sysop_barker"` and `"sysopbarker"` pointing to `/avatars/sysop_barker.png`.
- **Felt Puppet Badges**
  - Duplicated the existing grey felt canine illustration assets from `clio_architect.png` and `clio_architect.svg` to `sysop_barker.png` and `sysop_barker.svg` inside `/01_Sovereign_Portal/public/avatars/`.

### 3. Database State Clean Migration
- Performed a clean transactional SQLite migration on `sovereign_now.db`:
  - Updated tables: `persona`, `sys_user`, `cmdb_ci`, `cmdb_ci_ai_persona`, `m2m_persona_room`, and `ws_faction_member`.
  - Replaced system prompts and lore texts cleanly inside the SQLite DB with the new name.
  - Resolved all remaining hardcoded `clio_architect` constraints to zero.

### 4. Genesis Report & NotebookLM Sync
- **[generate_onboarding_pdf.py](file:///home/james/SovereignOS/scripts/generate_onboarding_pdf.py)**
  - Updated avatar verification path table references.
  - Recompiled the ultimate seeding report: **[WeedStack_and_StackLabs_Seeding_Report.pdf](file:///home/james/sovereign_inbox/reports/WeedStack_and_StackLabs_Seeding_Report.pdf)** (size: ~6.08 MB, embedding the high-fidelity Imagen concept portrait for Sysop Barker).
- **NotebookLM Sync Pipeline
  - Rebuilt the massive multi-agent telemetry export package containing all updated logs and sqlite matrices.
  - Synchronized all `.txt` resources to GDrive via `sync_notebook.sh`.

---

## Verification Results

### Live Seeder PDF Compilation
```bash
python3 /home/james/SovereignOS/scripts/generate_onboarding_pdf.py
Connecting to SQLite database...
Loaded 21 WeedStack personas and 4 StackLabs personas.
Generated intermediate HTML...
Compiling Genesis Seeding PDF via Headless Google Chrome...
✅ Success! PDF successfully compiled and written to: /home/james/sovereign_inbox/reports/WeedStack_and_StackLabs_Seeding_Report.pdf
File size: 6083525 bytes
```

### Monolithic Portal Build Check
```bash
npm run build
...
dist/index.html                     0.84 kB │ gzip:   0.45 kB
dist/assets/index-D7uXJScV.css    279.44 kB │ gzip:  37.54 kB
dist/assets/index-57jKpifj.js   2,179.02 kB │ gzip: 569.69 kB
✓ built in 7.42s
```

All verification tasks succeeded cleanly!
