# ServiceNow CMDB Parity Integration

## Architectural Overview
The Sovereign ecosystem utilizes a local SQLite database (`sovereign_now.db`) to achieve strict architectural parity with enterprise ServiceNow (SNOW) instances. AI Personas are modeled as ITIL components natively in order to align perfectly with cloud infrastructure without vendor lock-in.

## Data Layer Mapping
- **`cmdb_ci_ai_persona`**: Stores systemic constraints (Boggs Reactivity, Node Deployment Zone, Engine type) of the bots as Configuration Items for operational use.
- **`sys_user`**: Stores human-readable user mappings of the bots. First name, Username, their short System Instruction (`title`), and Deep Lore string (`introduction`).
- **`sys_user_group`**: Replaces raw text "team" labels. Creates explicit group identities (e.g. `Phillies Fan Vanguard`).
- **`sys_user_grmember`**: Links `sys_user` (`user`) elements directly to their respective `sys_user_group` (`group_id`).

### API Parity layer
The SQLite data is surfaced identically to ServiceNow REST APIs by `persona_manager_server.py` executing on `Port 8096`.
- `GET /api/now/table/sys_user` 
- `GET /api/now/table/sys_user/{sys_id}`
- `PUT /api/now/table/sys_user/{sys_id}`
- `GET /api/now/table/sys_user_group`

*Important Operational Note: Hitting the `PUT` endpoint instantly fires a `SYNC_DB_PERSONAS` websocket broadcast payload back to `fancast_relay.py` (Port 8008), which commands `fanstack_chatbots.py` to seamlessly hot-swap the loaded SQLite context into live memory for real-time mesh operation.*

## UI Configuration (Vancouver-Styled Employee Center)
All flat-file `.json` references were completely purged from the Unified MLB UI framework relative to persona administration.

`PersonaConsole.tsx` operates as the internal "Employee Center". It features:
- Vancouver-release aesthetics (Rounded glassmorphic cards, massive gradient banners on modals, overlap circular avatars).
- Real-time `fetch` queries against the SNOW API parity endpoints.
- Editable user forms for hot-swapping Deep Lore text directly, eliminating the need to physically modify `.md` files via `vim` or `nano`.

## MARD Engine Punishments (The Okerlund Protocol)
Fixed an issue where the Bouncer / Mean Gene Okerlund logic failed, by explicitly ensuring:
1. Gemini LLM forces `application/json` output without unparseable markdown codeblocks.
2. `fancast_relay.py` actively forwards `SYS_LOG` events to clients.
3. The Vite frontend (`fancast_fan_live.html`) natively parses and drops `SYS_LOG` errors in red, ensuring dogpiling users and rulebreakers are visually isolated.
