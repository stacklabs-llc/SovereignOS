# Sovereign Multiverse vs. ServiceNow: Schema Mapping

To build the "nice profile editor page", we need to align the **Sovereign OS FanStack** data structures perfectly with the **ServiceNow (SNOW)** ecosystem. By structuring our JSON data using ServiceNow's standard fields (`sys_id`, `sys_user_group`, `sys_class_name`), we can seamlessly map relationships and build the UI editor to feel exactly like an Employee Profile or CMDB form. 

Here is the proposed architectural regrouping for the data layer:

## 1. Personas ➡️ `sys_user` / `cmdb_ci_ai_persona`
Instead of flat, disconnected JSON objects, every bot/persona is treated as an Employee/Configuration Item.

| FanStack Concept | ServiceNow Field | Description |
| :--- | :--- | :--- |
| **UUID** | `sys_id` | Unique 32-character hex string linking the persona everywhere globally. |
| **Call Sign** | `name` / `user_name` | The primary identifier (e.g., "Wardy", "Barf", "Dot"). |
| **Short Bio** | `title` | A 1-sentence descriptor (e.g., "Die-hard Mets Fan Specialist"). |
| **Team Alignment** | `sys_user_group` | The reference ID mapping them to their faction (e.g., "New York Mets Fanbase"). |
| **Room Assignment** | `location` / `u_deployment_zone` | Current WebSocket room parameter (e.g., "global", "az-nym"). |
| **LLM Engine** | `u_llm_engine` | The physical compute resource backing them (e.g., `gemini-pro`, `claude-3-haiku`). |
| **Boggs Level** | `u_escalation_tier` | Max allowed toxicity threshold (1-5). |
| **Long Lore Profile** | `description` or Knowledge Article (`kb_knowledge`) | This relies on our long `.md` files. We can map the paths natively so the profile editor fetches `/personas/{name}.md` into a rich markdown editor. |

## 2. Teams & Factions ➡️ `sys_user_group`
Personas do not just have an isolated string for "team". They belong to formal groups that provide context and shared system prompts.

| FanStack Concept | ServiceNow Field | Description |
| :--- | :--- | :--- |
| **Team Name** | `name` | "San Diego Padres Faction" |
| **Team Lore** | `description` | The shared context prompt injected to all members of this group. |
| **Faction Leader** | `manager` | Refers to the `sys_id` of the primary Persona (e.g., Wardy for the Mets). |

## 3. The React "Employee Center" Profile Editor
When we click "Edit" on a persona in the matrix, we will no longer just pop open a generic form. We will mount a React component mapped directly to this schema:
* **The Header (Top Card):** Avatar, Call Sign, and Title.
* **About (`description`):** The long-form `.md` markdown profile injected directly from the filesystem.
* **Groups & Affiliations (`sys_user_group`):** Which teams and multiversal factions they belong to.
* **Preferences (System Variables):** Engine overrides, Cadence, and Boggs Limits.

---

### **Next Steps to Resume**
1. **Script the Migration:** If you approve, I can write a script to automatically convert our current `personas.json` and the `dna/agents/personas/*.md` directory into this relational `sys_id` structure.
2. **Build the Editor Shell:** We'll build the React component to look **exactly** like the white ServiceNow portal screenshot you shared, but themed in our dark FanStack aesthetic if you choose, or kept entirely clinical and white like a true "Admin Backend."

Let me know if this schema completely nails the approach!
