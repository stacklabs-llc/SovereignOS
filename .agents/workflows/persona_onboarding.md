---
description: Service Catalog workflow for onboarding a new Sovereign FanStack Persona, ensuring SDLC compliance and aesthetic consistency.
---

# Persona Onboarding (Service Catalog Item)

This workflow defines the strict, end-to-end "Order Guide" for provisioning a new AI Persona within the Sovereign FanStack ecosystem. Just like onboarding a new employee, an AI Persona requires a standardized set of credentials, assets, and CMDB registrations before it is allowed to interact with the production mesh.

## 📥 Trigger Event
This workflow is initiated when the `sdlc_persona_onboarder.py` daemon generates a new persona blueprint and creates a `STRY` ticket assigned to the system administrator (James).

---

## 🛠️ Phase 1: Asset Provisioning (The Character Map)
Before any accounts are created, the persona's visual identity must be locked in using the Sovereign OS standard.

1. **Generate Character Map:**
   Use the precise Flow Prompt template to generate the 3x3 grid character map. 
   > **Template:** Character reference sheet, model sheet, concept art. Multiple angles and expressions of [Brief Persona Description] as a fan. Wearing team merchandise. Expressive posing. Front view, side view, and showing emotion. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout.
2. **Save Asset:** Store the generated grid as `[handle]_charmap.png` in the `media_vault`.
3. **Crop Avatar:** Isolate the best expression from the grid to use as the standard 1:1 profile picture (`[handle]_avatar.png`).

---

## 🔐 Phase 2: Infrastructure & Accounts
Just like an employee needs a workstation, the persona needs digital real estate.

1. **Gmail Alias (Plus-Tagging):**
   - Do NOT manually register a new Gmail account!
   - Use the auto-generated Gmail alias from the onboarding blueprint: `sovereign.fanstack+{persona_slug}@gmail.com`
   - *Meatware Requirement:* No manual Gmail registration or phone verification is needed. This routes directly to our master inbox `sovereign.fanstack@gmail.com`.
2. **X (Twitter) Account:**
   - Register the X account using the auto-generated Gmail alias.
   - Secure the `@handle` as close to the blueprint suggestion as possible.
   - *Security Note:* Browse manually for 5-10 minutes post-creation to establish a human footprint before handing keys to the automation daemons.

---

## 🎨 Phase 3: Profile Configuration
The persona's public-facing digital footprint must reflect the generated blueprint.

1. **Upload Avatar:** Set the cropped image from Phase 1 as the X Profile Picture and Google Profile Picture.
2. **Set Header/Banner:** Upload a thematic header image (e.g., a dark/moody baseball stadium, or team-specific aesthetic).
3. **Update Bio:** Copy the exact 160-character bio, display name, and location from the generated blueprint ticket into the X profile.

---

## 🗄️ Phase 4: CMDB & Database Synchronization
The final step is bringing the persona online within the Sovereign OS mesh.

1. **Update `persona` Table:**
   Ensure the database reflects the finalized `user_name` (exact Twitter handle), `display_name`, and `team`.
2. **Update CMDB:**
   Create or verify the `cmdb_ci_ai_persona` entry for the new character to maintain SDLC tracking.
3. **Resolve Ticket:**
   Attach the final details to the `STRY` ticket in `sovereign_tickets` and mark it as **Resolved** (State `4` - Resolved). This action signals the backend daemons (like `vertex_persona_audit.py` and the sniper bots) that the persona is officially "on the bench" and ready for deployment.
