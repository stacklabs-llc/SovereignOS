# Sovereign OS Database Schema Documentation

This document serves as the canonical reference for the database schemas of Sovereign OS. Any proposed table creations, column alterations, or schema expansions **MUST** be documented here first for review and sign-off before being implemented.

---

## 📂 Active Databases

Sovereign OS maintains a single unified SQLite database:
1. **`sovereign_now.db`** (Canonical Path: `/home/james/SovereignOS/dna/sovereign_now.db`)
   - **Purpose:** The central system database holding application runtime configs, CMDB assets, user identities, simulation loop states, and the Software Development Life Cycle (SDLC) ledger (sprints, stories, incidents, and audit logs).

---

## 🏛️ sovereign_now.db Schema

### 1. `persona`
- **Purpose:** Primary application runtime table for simulation chatbot agents.
- **Fields:**
  - `id` (TEXT PRIMARY KEY): Unique identifier.
  - `user_name` (TEXT UNIQUE NOT NULL): Handle used in script lookups.
  - `display_name` (TEXT): Visual name.
  - `team` (TEXT): MLB abbreviation bias or `GLOBAL`.
  - `system_prompt` (TEXT): Full system instructions passed to the LLM.
  - `boggs_level` (INTEGER DEFAULT 2): Reactivity metrics.
  - `avatar_url` (TEXT): Web path to the avatar image.
  - `color` (TEXT): UI primary hex color.
  - `cadence` (TEXT DEFAULT 'pacer'): Posting frequency configuration.
  - `deep_lore` (TEXT): Backstory markdown.
  - `behavior_notes` (TEXT): Bio or guidelines.
  - `governance` (TEXT): Policy boundaries.
  - `created_at` (TEXT): Creation timestamp.
  - `avatar_blob` (TEXT): Base64-encoded PNG image for offline clients.
  - `updated_at` (TEXT): Last update timestamp.
  - `email_alias` (TEXT): Authentication email address.
  - `llm_engine` (TEXT DEFAULT 'gemini-2.0-flash'): LLM model selection.
  - `u_visual_style` (TEXT DEFAULT 'style_felt'): Front-end theme selector.
  - `prepper_barter_only` (INTEGER DEFAULT 0)
  - `barter_inventory` (TEXT)
  - `character_map_url` (TEXT)
  - `avatar_prompt` (TEXT)
  - `character_map_prompt` (TEXT)
  - `u_deployment_zone` (TEXT)
  - `is_heel` (INTEGER DEFAULT 0)
  - `rivalry_target_handle` (TEXT)
  - `canned_takes` (TEXT)

### 2. `sys_user`
- **Purpose:** Identity and credentials mapping for frontend logins and chat author signatures.
- **Fields:**
  - `sys_id` (TEXT PRIMARY KEY): Unique identifier.
  - `user_name` (TEXT): Unique username.
  - `first_name` (TEXT)
  - `last_name` (TEXT)
  - `title` (TEXT): Role title (e.g. 'Advocate').
  - `introduction` (TEXT): Mini bio.
  - `city` (TEXT)
  - `department` (TEXT): Team mapping (e.g. 'NYM').
  - `active` (INTEGER DEFAULT 1): Active user flag.
  - `sys_created_on` (TIMESTAMP)
  - `sys_updated_on` (TIMESTAMP)
  - `password_hash` (TEXT)
  - `role` (TEXT DEFAULT 'guest')
  - `display_name` (TEXT)
  - `email` (TEXT)
  - `avatar_url` (TEXT)
  - `favorite_team` (TEXT)
  - `tailscale_ip` (TEXT)
  - `u_nap_mist_balance` (INTEGER DEFAULT 0)
  - `u_layout_configuration` (TEXT)
  - `os_theme` (TEXT)

### 3. `cmdb_ci`
- **Purpose:** Parent table representing Configuration Items (CI) in the ServiceNow-style database setup.
- **Fields:**
  - `sys_id` (TEXT PRIMARY KEY): Linkable identifier.
  - `name` (TEXT): CI name.
  - `sys_class_name` (TEXT): Class name (e.g., `cmdb_ci_ai_persona`, `cmdb_ci_hardware`, `cmdb_ci_appl`).
  - `short_description` (TEXT)
  - `operational_status` (INTEGER)
  - `assigned_to` (TEXT)
  - `sys_created_on` (TIMESTAMP)
  - `sys_updated_on` (TIMESTAMP)

### 4. `cmdb_ci_ai_persona`
- **Purpose:** Technical metadata extension for AI Persona Configuration Items.
- **Fields:**
  - `sys_id` (TEXT PRIMARY KEY): Matches `cmdb_ci.sys_id`.
  - `u_system_prompt` (TEXT)
  - `u_deployment_zone` (TEXT)
  - `u_boggs_reactivity` (TEXT)
  - `u_cadence` (TEXT DEFAULT 'pacer')
  - `u_context_grounding_ref` (TEXT)
  - `u_avatar_prompt` (TEXT)
  - `u_behavior_expectations` (TEXT)
  - `u_governance_boundaries` (TEXT)
  - `u_deep_lore` (TEXT)
  - `u_visual_style` (TEXT DEFAULT 'style_felt')
  - `u_character_map_url` (TEXT)
  - `u_character_map_prompt` (TEXT)

### 5. `cmdb_ci_persona`
- **Purpose:** Metadata mappings specifically for X/Twitter automation modules.
- **Fields:**
  - `sys_id` (TEXT PRIMARY KEY): Matches `cmdb_ci.sys_id`.
  - `handle` (TEXT): X/Twitter handle.
  - `display_name` (TEXT): Display name.
  - `role` (TEXT): Role text.
  - `system_instruction` (TEXT)
  - `team` (TEXT)
  - `active` (INTEGER)
  - `id` (TEXT)

### 6. `game_persona`
- **Purpose:** Seating mapping and token accounting for active simulation instances.
- **Fields:**
  - `id` (TEXT PRIMARY KEY)
  - `game_pk` (TEXT NOT NULL): Room ID link.
  - `persona_id` (TEXT NOT NULL): `persona.id` link.
  - `joined_at` (TEXT)
  - `overlay` (TEXT): Dynamic prompt overrides for this game.
  - `seat_state` (TEXT DEFAULT 'active'): State (`active` | `benched` | `guest` | `left`).
  - `total_tokens` (INTEGER)
  - `gemini_tokens` (INTEGER)
  - `local_tokens` (INTEGER)
  - `input_tokens` (INTEGER)
  - `output_tokens` (INTEGER)

### 7. `m2m_persona_room`
- **Purpose:** Custom prompt overrides for specific room/persona matches.
- **Fields:**
  - `sys_id` (TEXT PRIMARY KEY)
  - `persona` (TEXT): Persona username.
  - `room` (TEXT): Room key.
  - `prompt_overlay` (TEXT)

---

## 🛠️ sovereign_sdlc.db Schema

### 1. `tickets`
- **Purpose:** Track incident, story, defect, and enhancement ticket lifecycle.
- **Fields:**
  - `id` (TEXT PRIMARY KEY): Ticket ID (e.g. `TKT-0001` or `STRY0002210`).
  - `title` (TEXT NOT NULL)
  - `description` (TEXT)
  - `ticket_type` (TEXT DEFAULT 'INC')
  - `status` (TEXT DEFAULT 'OPEN')
  - `priority` (TEXT DEFAULT 'P3')
  - `risk_level` (TEXT)
  - `cab_approval` (TEXT DEFAULT 'PENDING')
  - `sprint_id` (TEXT)
  - `story_points` (INTEGER)
  - `acceptance_criteria` (TEXT)
  - `assigned_ci` (TEXT)
  - `sprint_eon` (TEXT)
  - `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` (DATETIME)
  - `resolved_at` (DATETIME)

### 2. `ci_registry`
- **Purpose:** Track IOT nodes and active server check-ins.
- **Fields:**
  - `ci_id` (TEXT PRIMARY KEY)
  - `display_name` (TEXT)
  - `ci_type` (TEXT)
  - `node_address` (TEXT)
  - `status` (TEXT DEFAULT 'ACTIVE')
  - `parent_ci` (TEXT)
  - `zone` (TEXT DEFAULT 'SOVEREIGN')
  - `degradation_mode` (TEXT DEFAULT 'NONE')
  - `metadata_json` (TEXT)
  - `last_heartbeat` (DATETIME)

### 3. `ci_relationships`
- **Purpose:** Map dependency trees between IOT nodes and software elements.
- **Fields:**
  - `rel_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `parent_ci` (TEXT)
  - `child_ci` (TEXT)
  - `rel_type` (TEXT)

### 4. `ticket_log`
- **Purpose:** Audit changes made to lifecycle tickets.
- **Fields:**
  - `log_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `ticket_id` (TEXT)
  - `action` (TEXT)
  - `old_value` (TEXT)
  - `new_value` (TEXT)
  - `actor` (TEXT)
  - `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 5. `sprints`
- **Purpose:** Plan and scope sprint milestones.
- **Fields:**
  - `sprint_id` (TEXT PRIMARY KEY)
  - `title` (TEXT)
  - `start_date` (DATE)
  - `end_date` (DATE)
  - `goal` (TEXT)
  - `status` (TEXT)

---

## 📜 Future Schema Governance Protocol

Whenever a new feature requires database tables or structural changes:
1. **Schema Design Draft:** The proposing agent/developer must draft the exact SQLite table definitions, relationships, and design parameters.
2. **Document Updates:** Update this file (`dna/docs/DATABASE_SCHEMA.md`) with the new definitions and explain the operational rationale.
3. **Pilot Approval:** Stop and request explicit review and approval from the Pilot before running any database migration script.
4. **Migration Code:** Write idempotent migrations inside `scripts/migrations/` to perform structural adjustments.
