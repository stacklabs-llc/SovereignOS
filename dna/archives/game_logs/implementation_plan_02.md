# Implementation Plan - WildSeed Social Engine & UAT Domain Selector Fixes (STRY1779936909)

This plan details the technical approach to reskinning the real-time social commentary engine (FanStack) for the **WildSeed Farms simulated community room**, integrating **Mean Gene async moderation**, deploying **Fan Cave DB extensions**, and resolving two critical **UAT defects** on the environment domain switcher across all three portals (`01_Sovereign_Portal`, `15_FanStack`, `21_Wildseed_GardenStack`).

---

## User Review Required

We are delivering a fully operational brand advocate yapper room and fixing the environment domain selection redirects.

> [!IMPORTANT]
> **Key Integration & Fixes Proposed:**
> - **DFCT-A (Widget Parity)**: Overwrite the lightweight placeholder in `21_Wildseed_GardenStack/src/GlobalSystemBar.tsx` with a fully compatible dark-glassmorphism GlobalSystemBar, mounted always-visible in `App.tsx` top-right.
> - **DFCT-B (Real Redirection)**: Implement active browser redirections in the `onChange` switcher handler of `GlobalSystemBar.tsx` across all three portals (`01_Sovereign_Portal`, `15_FanStack`, `21_Wildseed_GardenStack`) using clean, dynamic Tailscale HSTS and localhost port mappings:
>   - `sovereign-home` $\rightarrow$ Sovereign Home on Port `3000` (`https://clio.taila01894.ts.net/`)
>   - `aether-vet` $\rightarrow$ Aether Vet on Port `3015` (`https://clio.taila01894.ts.net:8443/`)
>   - `gardenstack` $\rightarrow$ GardenStack on Port `3016` (`https://clio.taila01894.ts.net:3016/`)
>   - `espn` $\rightarrow$ ESPN / FanStack on Port `3010` (`https://clio.taila01894.ts.net:3010/`)
> - **Phase 1-2 (Seeding & Sim Room)**: Seed 5 cannabis culture personas into `persona`, establish simulated room `WILDSEED_SIM_001` in `cmdb_ci_fanstack_room`, seat all 5 personas, and seed context events and agent tension profiles.
> - **Phase 3 (Mean Gene Async Moderation)**: Create `mean_gene.py` and hook it as a pre-persist moderation step inside `generate_commentary` in `fanstack_chatbots.py` to filter toxic input, award Burn Badges, and manage the Penalty Box rap battle escapes.
> - **Phase 4 (Fan Cave DB Extension)**: Run migrations to add `fan_cave_relics`, `fan_cave_hof_quotes`, `fan_cave_penalty_box`, and `fan_cave_profile` to `sovereign_now.db`.
> - **Phase 5 (Frontend Routing)**: Create `FanStackRoom.tsx` in both portals (copied and adapted from `ScruffysTavern.tsx` with green accents, custom brand metadata, and simulated headers) and route `/wildseed` to it.

---

## Open Questions

None. The work order details and local environment coordinates are fully mapped.

---

## Proposed Changes

### [Sovereign OS Portal](file:///home/james/SovereignOS/01_Sovereign_Portal)

#### [MODIFY] [GlobalSystemBar.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/GlobalSystemBar.tsx)
- Integrate dynamic domain redirection mappings in the Workspace OS selection dropdown.
- Save switched themes locally to `localStorage` before initiating browser redirect.

#### [NEW] [FanStackRoom.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/FanStackRoom.tsx)
- Standalone, highly stylized room component based on `ScruffysTavern.tsx`.
- Replace baseball diamond/MLB slate panel with a premium brand-promotion dashboard (seated advocate cards, active campaigns, COAs).
- Override standard accent colors with WildSeed green (`#00c878`) and render the "WildSeed Community" header.

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/App.tsx)
- Add `/wildseed` path detection to return `'wildseed'` room.
- Mount the new `<FanStackRoom />` pointed at `WILDSEED_SIM_001` inside the activeRoom render tree.
- Add "WildSeed" sidebar navigation link, restricted to Pilot/Creator roles.

---

### [FanStack / Sports](file:///home/james/SovereignOS/15_FanStack)

#### [MODIFY] [GlobalSystemBar.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/GlobalSystemBar.tsx)
- Add exact same UAT-B redirection mapping and local storage theme syncing.

#### [NEW] [FanStackRoom.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/FanStackRoom.tsx)
- Implement matching premium, green-accented `<FanStackRoom />` component.

#### [MODIFY] [App.tsx](file:///home/james/SovereignOS/15_FanStack/src/App.tsx)
- Add `/wildseed` pathname routing detection.
- Render the new `<FanStackRoom />` pointed at `WILDSEED_SIM_001`.
- Add "WildSeed" sidebar navigation link under exact same role restrictions.

---

### [Wildseed GardenStack](file:///home/james/SovereignOS/21_Wildseed_GardenStack)

#### [MODIFY] [GlobalSystemBar.tsx](file:///home/james/SovereignOS/21_Wildseed_GardenStack/src/GlobalSystemBar.tsx)
- Overwrite the lightweight placeholder with the premium dark-glassmorphism `GlobalSystemBar.tsx` layout.
- Adapt it to be self-contained so that it compiles without `AuthGate`/`FanProfileModal` references, falling back gracefully to the standard Pilot session profile.

---

### [Sovereign Core Scripts](file:///home/james/SovereignOS/scripts)

#### [NEW] [seed_wildseed_personas.py](file:///home/james/SovereignOS/scripts/seed_wildseed_personas.py)
- Python seeding script to create 5 unique cannabis community personas (Dr. Terp, Outdoor Oracle, Compliance Karen, Dispo Vet, BT4991 Believer).

#### [NEW] [seed_wildseed_room.py](file:///home/james/SovereignOS/scripts/seed_wildseed_room.py)
- Python seeding script to register room `WILDSEED_SIM_001`, seed initial game context events, and seat all 5 personas.

#### [NEW] [seed_wildseed_sim_agents.py](file:///home/james/SovereignOS/scripts/seed_wildseed_sim_agents.py)
- Seeding script for simulated agent tension profiles mapped to cannabis community variables.

#### [NEW] [mean_gene.py](file:///home/james/SovereignOS/scripts/mean_gene.py)
- The bouncer engine to process, block, and log simulated chatter, award burn badges, flag penalty box states, and clear rap battle escapes.

#### [MODIFY] [fanstack_chatbots.py](file:///home/james/SovereignOS/scripts/fanstack_chatbots.py)
- Wire `mean_gene.py` pre-persist async hooks before inserting generated chatter into `game_chat`.

---

## Verification Plan

### Automated & Database Verification
- Execute seeding scripts and confirm personas, room membership, and context events populate in `/home/james/SovereignOS/dna/sovereign_now.db`.
- Run migrations and confirm Fan Cave tables (`fan_cave_relics`, `fan_cave_hof_quotes`, `fan_cave_penalty_box`, `fan_cave_profile`) are registered.
- Run native tests on `mean_gene.py` logic and confirm it flags roasts and blocks toxic entries.

### Frontend Compilation & UI Verification
- Build all 3 portals locally using `npm run build` and ensure exit code is 0.
- Spin up services in persistent background processes on ports `3000`, `3010`, `3016`.
- Use a **browser subagent** to navigate securely over Tailscale HSTS domains:
  - Verify that the `GlobalSystemBar` renders on GardenStack (`https://clio.taila01894.ts.net:3016/`).
  - Verify that switching domains via the selector triggers a real browser redirect to the correct port/address.
  - Navigate to `https://clio.taila01894.ts.net/wildseed` (Port 3000) and `https://clio.taila01894.ts.net:3010/wildseed` (Port 3010) to confirm the green WildSeed Room loads, showing simulated yapper commentary.
