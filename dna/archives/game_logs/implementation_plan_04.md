# Implementation Plan: Cozy Spatial Matrix, HEDLIF Delivery Engine, and The Skew Panel Debates

This plan outlines the technical approach to fully link the Smyrna Heights spatial portal map with the active cognitive matrix, boost the humor of the local Dolphin LLM, build an interactive HEDLIF pizza delivery dashboard in Spite Slice, and enable cross-faction panel debates.

---

## User Review Required

> [!IMPORTANT]
> - **Spatial Sync Port**: We resolve the persona database sync on Port `8096` using Tailscale-safe dynamic protocol detection.
> - **Local Dolphin Temperature**: Boosting Ollama's temperature option to `1.15` and adding custom sarcasm framing will significantly increase response variance and comedic value.
> - **Inbox Protocol Compliance (KI-040)**: All logs, incident reports, and validation outputs will reside in `/home/james/sovereign_inbox/reports/`.

---

## Proposed Changes

### 1. Spatial Portal Relocation Sync
We will update `SmyrnaPlaycall.tsx` to actively sync advocate movements on the cardboard map directly to the SQLite `persona.u_deployment_zone` field via the backend REST API.

#### [MODIFY] [SmyrnaPlaycall.tsx](file:///home/james/SovereignOS/01_Sovereign_Portal/src/components/SmyrnaPlaycall.tsx)
- Load the full persona directory on mount from `/api/personas` on Port `8096` to map advocate names to their SQLite database `sys_id`.
- Wire up `handleAdvocateMove` to make a live `PUT` fetch request to `/api/personas/{sys_id}` with `deployment_zone: newLocation`.
- This ensures that dragging/relocating advocates on the SVG map immediately updates their operational zone in `sovereign_now.db`.

---

### 2. Spatial Cognitive Prompts (Lore Prependers)
We will modify the chatbot prompt generation loops to query the newly updated `u_deployment_zone` from the database and inject rich environmental narratives.

#### [MODIFY] [fanstack_chatbots.py](file:///home/james/SovereignOS/scripts/fanstack_chatbots.py) & [the_skew_chatbots.py](file:///home/james/SovereignOS/scripts/the_skew_chatbots.py)
- Include `p.u_deployment_zone` in the core SQL query in `load_fans()`.
- Add a helper `get_spatial_override(zone)` that returns the custom environmental cognitive overrides:
  - **Town Hall (`PLAT-06`)**: Sovereign OS Core HQ context (professional, executive systems control).
  - **Silas Thorne's Garden Cabin (`PLAT-07`)**: Organic, agrarian, bohemian soil farming.
  - **Warden Barb's Pizza Cottage (`PLAT-08`)**: Spite Slice pizza operations, brick-ovens, fierce local competition.
  - **Cary Sterling's Detective Office (`PLAT-09`)**: Retro noir investigations, file folders, CMDB auditing.
  - **Madame Mayhem's Loft (`PLAT-10`)**: Upper floor Gonzo convenience, neon lights, anarchic energy.
- Prepend the returned environmental block directly into the LLM system prompts during conversation generation.

---

### 3. Boosting Local Dolphin LLM Humor
We will customize the Ollama routing configuration to make local `dolphin-llama3` commentary significantly funnier, grittier, and more unhinged.

#### [MODIFY] [fanstack_chatbots.py](file:///home/james/SovereignOS/scripts/fanstack_chatbots.py) & [the_skew_chatbots.py](file:///home/james/SovereignOS/scripts/the_skew_chatbots.py)
- Boost the `temperature` parameter to `1.15` (up from `0.8`) inside the Ollama `"options"` payload when `model == "dolphin-llama3"`.
- Append a comedy/sarcasm directive to the `sys_override` instructions:
  > *"CRITICAL HUMOR DIRECTIVE: Be extremely witty, biting, sarcastic, and hilariously unhinged. Ground your commentary in absurd local details, dark humor, self-deprecation, and bitter sports grudges. Deliver a highly memorable performance."*

---

### 4. Spite Slice HEDLIF pizza delivery engine simulator
We will build a high-fidelity interactive dashboard panel in the Spite Slice UI to model and demonstrate the HEDLIF (Heuristic Equity-Driven Latency Injection Framework) in real-time.

#### [MODIFY] [EquityTipEngine.tsx](file:///home/james/SovereignOS/22_SpiteSlice/src/EquityTipEngine.tsx)
- Embed a new visual section: **HEDLIF Delivery Dispatch & Latency Monitor**.
- Track two Smyrna delivery riders:
  - **Slippery Pete** (Greedy routing, earned: `$145.00`)
  - **Bob Sacamano** (Ethical routing, earned: `$92.00`)
- Calculate real-time **Tip Wallet Variance** (e.g., `$53.00`).
- Display the status of the **Ethical Latency Throttle**:
  - **ACTIVE** if variance exceeds `$30.00` (injects a **+180s latency penalty** to Slippery Pete's queue).
  - **INACTIVE** if variance is balanced under `$30.00`.
- Add a **"Simulate Incoming Delivery Order"** button:
  - Computes the routing decision based on active HEDLIF latency.
  - Displays a visual loader showing the latency engine throttling Pete's greed-based route.
  - Successfully routes the order to Bob Sacamano, updating their balance to `$117.00` (variance `$28.00`, HEDLIF balance achieved!).

---

### 5. The Skew Product Panel Debate Trigger
We will build a dedicated trigger script to initiate a high-level panel debate between factions in The Skew.

#### [NEW] [trigger_skew_panel.py](file:///home/james/SovereignOS/scripts/trigger_skew_panel.py)
- A standalone command-line script that queries `sovereign_now.db` to select 4 active personas from different Smyrna factions (WeedStack, Spite Slice, Unhinged Convenience, Scruffy's).
- Connects to the Skew websocket relay on Port `8009` and broadcasts a coordinated `"update_context"` event.
- Injects a panel debate topic:
  > *"DEBATE MODERATOR OVERRIDE: Gather immediately at Scruffy's roundtable for a live panel debate. Discuss the rumors of WeedStack's firesale and allegations that their gummies are tested on local wildlife i.e. Catnip Wars. Stay 100% in character and rip into each other's factions!"*

---

## Verification Plan

### Automated Tests
- Run `trigger_skew_panel.py` and verify in the logs (`/home/james/sovereign_inbox/reports/skew_panel_audit.log`) that the websocket relay successfully receives the panel debate instructions and the 4 personas fire back in character.

### Manual Verification
- Open the Smyrna Heights Portal and drag/relocate Madame Mayhem or Silas Thorne, confirming via database query that `u_deployment_zone` updates instantly in `sovereign_now.db`.
- Open the Spite Slice UI (Port `3019` / Tailscale endpoint) and test the **HEDLIF Dispatch Simulator**, confirming that the ethical latency engine throttles Pete and routes the tip to Bob Sacamano.
