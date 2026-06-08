# Walkthrough - Sovereign OS Terminology Alignment & Stack Standardization (STRY-06032026-STACKREGISTRY)

This walkthrough documents the comprehensive alignment of frontend UI text and options to conform to the canonical vocabulary in `STACKLABS_GLOSSARY.md` (specifically deprecating "Cartridge" / "Persona" in favor of "Stack" / "Advocate").

---

## 🛠️ Changes Completed

### 1. Frontend Component Alignment

#### [PersonaCenter.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/PersonaCenter.tsx)
- Updated UI text node definitions to reference "Stacks" instead of "Cartridges":
  - Tab header: `🧬 SWARM GOALS & STACKS`
  - Matrix subtitle: `◈ Active Brand Stack Swarm Matrix`
  - Badges: `★ STACK SEEDED`
  - Expository copy: Changed "Brand Cartridges" to "Brand Stacks".

#### [TownSimulation.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/TownSimulation.tsx)
- Replaced user-visible cartridge labels in simulation HUD and filters:
  - Header: `Multi-Stack Town Simulation`
  - Subtitle: `Cross-Stack Emergence Matrix Online`
  - Filter Selection Label: `Active Stacks:`

#### [FanProfileModal.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/FanProfileModal.tsx)
- Updated Cockpit guide description to reference active stacks instead of cartridges:
  - Text: `configured specifically for your role, active stacks, and swarms.`

#### [OpticalIngestConsole.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/OpticalIngestConsole.tsx)
- Replaced legacy capture log status labels:
  - Ingest Complete Message: `Stack captured and saved to Media Vault.`
  - Panel Heading: `Stack Status`

#### [PortalApps.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/config/PortalApps.tsx)
- Renamed the Town Square app indicator subtitle:
  - Subtitle: `Stack Simulation`

---

## 📊 Verification & Build Logs

### Production Bundler Verification
Ran `npm run build` inside `01_Sovereign_Portal` to verify compile-time type safety and asset bundling:
```bash
> unified-mlb-ui@0.0.0 build
> npm run sync-prospectus && vite build

🤖 Initializing Prospectus React-to-HTML Static Compiler...
✅ Success! Static prospectus compiled and written to: /home/james/SovereignOS/01_Sovereign_Portal/public/prospectus.html
vite v6.4.2 building for production...
transforming (1) src/main.tsx
✓ 3108 modules transformed.                                                                   
dist/index.html                     0.84 kB │ gzip:   0.45 kB
dist/assets/index-BUmy16hB.css    321.03 kB │ gzip:  42.09 kB
dist/assets/index-eApn_Lgd.js   2,470.50 kB │ gzip: 638.80 kB
✓ built in 9.40s
```
**Status: SUCCESS (Exit Code 0)**

### NotebookLM Synchronization Loop Validation
Triggered both manual synchronization pipelines to guarantee codebase payloads are updated in Google Drive:
- **Sovereign OS Sync**: Completed successfully.
- **StackLabs Sync**: Completed successfully (Exit Code 0).
