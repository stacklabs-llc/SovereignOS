# CMDB SCHEMA AUDIT (V1.0)
**AUTHORITY:** Master System Auditor (Node .73)
**OBJECTIVE:** Reconnaissance of ServiceNow CMDB Parity Layer
**DATE:** April 16, 2026

## 1. ACTIVE MASTER DATABASES (ABSOLUTE PATHS)
- `/home/james/SovereignOS/sovereign_now.db`
- `/home/james/SovereignOS/sovereign_sdlc.db`

## 2. SQLITE SCHEMA DEFINITIONS (sovereign_now.db)

### `sys_user`
```sql
CREATE TABLE sys_user (
    sys_id TEXT PRIMARY KEY,
    user_name TEXT,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    introduction TEXT,
    city TEXT,
    department TEXT,
    active INTEGER DEFAULT 1,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `sys_user_group`
```sql
CREATE TABLE sys_user_group (
    sys_id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    active INTEGER DEFAULT 1
);
```

### `cmdb_ci`
```sql
CREATE TABLE cmdb_ci (
    sys_id TEXT PRIMARY KEY,
    name TEXT,
    sys_class_name TEXT,
    short_description TEXT,
    operational_status INTEGER,
    assigned_to TEXT,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `cmdb_ci_hardware`
```sql
CREATE TABLE cmdb_ci_hardware (
    sys_id TEXT PRIMARY KEY,
    ip_address TEXT,
    mac_address TEXT,
    model_id TEXT,
    FOREIGN KEY (sys_id) REFERENCES cmdb_ci (sys_id)
);
```

### `cmdb_ci_ai_persona`
```sql
CREATE TABLE cmdb_ci_ai_persona (
    sys_id TEXT PRIMARY KEY,
    u_llm_engine TEXT,
    u_system_prompt TEXT,
    u_deployment_zone TEXT,
    u_boggs_reactivity TEXT, 
    u_cadence TEXT DEFAULT 'pacer',
    FOREIGN KEY (sys_id) REFERENCES cmdb_ci (sys_id)
);
```

### `m2m_persona_room`
```sql
CREATE TABLE m2m_persona_room (
    sys_id TEXT PRIMARY KEY,
    persona TEXT,
    room TEXT,
    prompt_overlay TEXT
);
```

*Note: The `sovereign_sdlc.db` was audited for `rm_story`, `rm_enhancement`, and `rm_defect`, but currently only aggregates records under a singular `tickets` table schema.*

## 3. HARDWARE INGESTION VERIFICATION (`cmdb_ci_hardware`)
**QUERY Executed:** `SELECT * FROM cmdb_ci_hardware LIMIT 5;`
| sys_id | ip_address | mac_address | model_id |
| :--- | :--- | :--- | :--- |
| f179b8e43889478eabb9112cde98f62e | 192.168.1.168 | | NVIDIA GTX 980 |

*(Analysis confirms successful ingestion of physical hardware CIs).*

## 4. SERVICE PORTAL LOCATOR (HTML PATHS)
The following ServiceNow parity portals were successfully located within the filesystem:
- `/home/james/SovereignOS/staging/deep_dive_vault/ui_archive/sovereign_employee_center.html`
- `/home/james/SovereignOS/staging/deep_dive_vault/ui_archive/service_portal.html`
- `/home/james/SovereignOS/scripts/sdlc_portal.html`
- `/home/james/SovereignOS/PROD/scripts/sdlc_portal.html`
