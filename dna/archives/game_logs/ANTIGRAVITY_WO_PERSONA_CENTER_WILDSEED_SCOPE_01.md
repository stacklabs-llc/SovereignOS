# ANTIGRAVITY WORK ORDER
## Mission: PersonaCenter — WildSeed Team Scoping & Portal Integration
**Date:** May 27, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟡 P3 — WildSeed Pilot Feature
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** The PersonaCenter already exists and works. Scope it so `garden_client` and `creator` roles only see personas belonging to their team (`WEEDSTACK`). Add it to the WildSeed GardenStack portal nav. Pilot sees everything as always.

---

## THE RULE

A `garden_client` or `creator` authenticated user must only see, edit, and
manage personas where `persona.team = 'WEEDSTACK'`.

They must never see Barf, Pete, welfare_bucco, or any FanStack/MLB persona.
The filter is enforced at the API level — not just the UI.

Pilot role sees all personas across all teams. No change to Pilot behavior.

---

## PHASE 1 — BACKEND: Scope the Persona API

In `sovereign_core_api.py`, find the existing persona list endpoint.
Add team-based filtering based on the authenticated user's role:

```python
from rbac_middleware import get_current_user

@app.get("/api/personas")
async def list_personas(user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Pilot sees everything
    if user.get("role") == "pilot":
        rows = conn.execute(
            "SELECT * FROM persona ORDER BY team, user_name"
        ).fetchall()
    else:
        # All other roles scoped to their team
        # Derive team from role mapping
        role_team_map = {
            "garden_client": "WEEDSTACK",
            "creator": "WEEDSTACK",
            # extend as new brand stacks come online
        }
        team = role_team_map.get(user.get("role"))
        if not team:
            conn.close()
            raise HTTPException(status_code=403, detail="No persona access for this role")
        rows = conn.execute(
            "SELECT * FROM persona WHERE team = ? ORDER BY user_name",
            (team,)
        ).fetchall()

    conn.close()
    return [dict(r) for r in rows]
```

Also scope the persona UPDATE endpoint — a `garden_client` can only update
personas where `team = 'WEEDSTACK'`. Add the same team check before any
`UPDATE` or `DELETE` on the persona table:

```python
@app.patch("/api/personas/{persona_id}")
async def update_persona(persona_id: str, body: dict, user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    existing = conn.execute(
        "SELECT team FROM persona WHERE id = ?", (persona_id,)
    ).fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Persona not found")

    # Non-pilots can only edit their own team's personas
    if user.get("role") != "pilot":
        role_team_map = {"garden_client": "WEEDSTACK", "creator": "WEEDSTACK"}
        allowed_team = role_team_map.get(user.get("role"))
        if existing["team"] != allowed_team:
            conn.close()
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to edit this persona"
            )

    # Restrict which fields non-pilots can update
    # They can touch: display_name, avatar_url, boggs_level (capped at 3)
    # They cannot touch: system_prompt, cadence, deep_lore, governance, team
    PILOT_ONLY_FIELDS = {"system_prompt", "cadence", "deep_lore", "governance", "team"}

    if user.get("role") != "pilot":
        for field in PILOT_ONLY_FIELDS:
            body.pop(field, None)

        # Cap boggs_level at 3 for non-pilots — no Boggs 4/5 without Pilot approval
        if "boggs_level" in body:
            body["boggs_level"] = min(int(body["boggs_level"]), 3)

    if not body:
        conn.close()
        return {"status": "no_changes"}

    set_clause = ", ".join(f"{k} = ?" for k in body.keys())
    values = list(body.values()) + [persona_id]
    conn.execute(f"UPDATE persona SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "updated", "persona_id": persona_id}
```

---

## PHASE 2 — FRONTEND: Add PersonaCenter to WildSeed Portal Nav

In `21_WildSeed_GardenStack/src/App.tsx` and the sidebar nav component:

Add a **"Personas"** nav item between Products and Lab Results (or after Lab
Results — wherever it fits the flow best).

```tsx
// Nav item
{ label: "Personas", icon: <UsersIcon />, route: "/personas" }

// Route
<Route path="/personas" element={<PersonaCenter />} />
```

Import `PersonaCenter` from the existing component. It already handles
everything — it will just receive scoped data from the API now.

The PersonaCenter should render in WildSeed green (`#00c878`) accent where
it normally renders in cyan. Pass the brand color as a prop if the component
supports it, otherwise leave default — this is cosmetic and non-blocking.

---

## PHASE 3 — RBAC TABLE UPDATE

Ensure `garden_client` role has `read` access to the PersonaCenter surface.
This is an API-level gate, not a port-level gate, so no new entry in
`sys_role_permission` is needed. The `/api/personas` endpoint handles it
via the `get_current_user` dependency.

Confirm `garden_client` is in the RBAC matrix with access to port `3016`.
Already set from the RBAC work order — verify only:

```bash
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db \
  "SELECT role, service_name, port, access_level
   FROM sys_role_permission
   WHERE role = 'garden_client';"
```

---

## VERIFY

```bash
# 1. Pilot gets all personas
curl -s -H "Authorization: Bearer <pilot_token>" \
  http://localhost:8090/api/personas | python3 -m json.tool | grep '"team"'
# Expected: mix of WEEDSTACK, MLB teams, etc.

# 2. garden_client gets only WEEDSTACK personas
curl -s -H "Authorization: Bearer <william_token>" \
  http://localhost:8090/api/personas | python3 -m json.tool | grep '"team"'
# Expected: only "WEEDSTACK" entries

# 3. garden_client cannot edit a FanStack persona
curl -s -X PATCH \
  -H "Authorization: Bearer <william_token>" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "hacked"}' \
  http://localhost:8090/api/personas/<barf_persona_id>
# Expected: 403 Forbidden

# 4. garden_client cannot set boggs_level above 3
curl -s -X PATCH \
  -H "Authorization: Bearer <william_token>" \
  -H "Content-Type: application/json" \
  -d '{"boggs_level": 5}' \
  http://localhost:8090/api/personas/<weedstack_persona_id>
# Expected: 200 OK but boggs_level set to 3, not 5

# 5. PersonaCenter visible in WildSeed portal nav
# Open http://100.73.155.70:3016 — confirm "Personas" appears in sidebar
# Confirm only WeedStack personas render

# 6. Build clean
cd /home/james/SovereignOS/21_WildSeed_GardenStack && npm run build
```

---

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*Michael can manage his personas. He cannot touch Barf. That is non-negotiable.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 27, 2026*
