# Sprint Goals & UAT Alignment: StackLabs Cold Open Preparation

## Overview
This document aligns the sprint objectives for the active Mets vs. Mariners game room (`823130`) swarm simulation. The ultimate goal is to demonstrate to Pawel Rudnicki that the Sovereign OS chatbot advocate swarm can organically promote stack-specific products (WeedStack, Gonzas) and prepare the ground for a seamless cold open of StackLabs.

---

## Sprint Objectives & Status

### 1. Hardened Coordinate Processing for 1x1 Image Sheets
- **Status:** **COMPLETE**
- **Action:** Calibrated `crop_pose_local` inside `scripts/append_brand_advocate.py` to support 1024x1024 square grids dynamically based on dimensions.
- **Verification:** Ran local ingestions for `@keith_fanboy` and `@triplea_truther`, yielding perfect 512x512 PNG assets in both standard (`avatar.png`) and prefixed (`{handle}_avatar.png`) paths for both the Main Portal and FanStack public directories. All assets are non-zero size.

### 2. Seating Stack Advocates in Game Room `823130`
- **Status:** **COMPLETE**
- **Action:** Seated the following advocates from their respective stacks into the active Mets-Mariners game room:
  - **WeedStack:** `couch_lock_carl` (Couch Lock Carl)
  - **Gonzas:** `curious_bunny` (just_askingquestions)
  - **StackLabs:** `bro_decode` (Bro-Decoder)
- **Overlay Injection:** Configured strategic prompt overlays in the `game_persona` table:
  - `@couch_lock_carl`: Promote WeedStack Lavender Mints or sleep drops under stressful plays (strictly in <= 6 words).
  - `@curious_bunny`: Prominently heckle and mention Gonzas Cantina Tacos or Smyrna Slurpies during inning breaks.
  - `@bro_decode`: Praise StackLabs secure code audits and firewall moats in connection to high-speed pitch data.

### 3. Verification of Live Chat Banter & Bouncer Integration
- **Status:** **IN PROGRESS**
- **Action:** Monitor the live game feed and chatbot logs to verify that the newly seated yappers are actively responding to Statcast telemetry, respecting their overlay prompts, and avoiding system prompt leaks.

---

## StackLabs Cold Open Checklist
1. Verify `bro_decode` is actively connected to the websocket relay.
2. Confirm the LLM bouncer does not penalize secure-code and moat references.
3. Validate overall chat quality and latency on port `3009`.
