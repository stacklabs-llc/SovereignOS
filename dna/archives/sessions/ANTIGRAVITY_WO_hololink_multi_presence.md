# ANTIGRAVITY WORK ORDER
## Mission: HoloLink Multi-Presence Fix — Show All Online Users Simultaneously
**Date:** May 26, 2026
**Issued By:** James (Sovereign OS Principal Architect)
**Ticket:** Create DFCT in sovereign_tickets before starting (KI-023)
**Target:** HoloLink Signaling Relay (Port 8012) + HololinkHub.tsx

---

## THE PROBLEM

HoloLink presence is currently replacing instead of appending. When a second
user logs in, the first user disappears from the online list. Only one user
is ever visible at a time.

**Observed behavior:**
- Antigravity (Agent) logs in → shows online ✓
- Eileen (Patron) logs in → Antigravity disappears, only Eileen shows ✓✗

**Expected behavior:**
- Antigravity (Agent) logs in → shows online ✓
- Eileen (Patron) logs in → BOTH show online simultaneously ✓✓

---

## ROOT CAUSE (LIKELY)

One of two places is overwriting instead of merging:

**Option A — Backend:** The signaling server is broadcasting a full presence
list replacement event (`PRESENCE_UPDATE`) that contains only the newest
connected user, instead of the full accumulated list of all connected sessions.

**Option B — Frontend:** `HololinkHub.tsx` is setting state with the incoming
presence payload directly (`setUsers(payload)`) instead of merging it
(`setUsers(prev => mergePresence(prev, payload))`).

Check both. Fix whichever is wrong. It may be both.

---

## STEP 1 — File the Defect Ticket

```python
POST /api/tickets
{
  "type": "DFCT",
  "short_description": "HoloLink presence replaces instead of appending — only one user visible at a time",
  "state": 1
}
```

---

## STEP 2 — Inspect the Signaling Server

```bash
grep -n "presence\|PRESENCE\|connected\|broadcast\|emit" \
  /home/james/SovereignOS/scripts/sovereign_mesh_relay.py
```

The server must maintain a **session registry** — a dictionary of all
currently connected WebSocket clients and their user metadata:

```python
# CORRECT pattern — accumulate all sessions
connected_sessions = {}  # key: session_id, value: user metadata

async def on_connect(websocket, user_data):
    connected_sessions[websocket.id] = user_data
    # Broadcast the FULL list to all clients
    await broadcast({
        "type": "PRESENCE_UPDATE",
        "users": list(connected_sessions.values())
    })

async def on_disconnect(websocket):
    del connected_sessions[websocket.id]
    # Broadcast the updated FULL list
    await broadcast({
        "type": "PRESENCE_UPDATE",
        "users": list(connected_sessions.values())
    })
```

If the server is only broadcasting the single new user instead of the full
accumulated list — fix it to broadcast the complete `connected_sessions`
dictionary on every connect and disconnect event.

---

## STEP 3 — Inspect the Frontend

```bash
grep -n "PRESENCE_UPDATE\|setUsers\|setOnline\|presence" \
  /home/james/SovereignOS/01_Sovereign_Portal/src/components/HololinkHub.tsx
```

The frontend handler must MERGE incoming presence data, not replace it:

```tsx
// WRONG — replaces the entire list
case 'PRESENCE_UPDATE':
  setOnlineUsers(data.users);
  break;

// CORRECT — if backend sends full list, set directly
// (this is fine IF the backend sends the complete accumulated list)
case 'PRESENCE_UPDATE':
  setOnlineUsers(data.users); // OK only if data.users is the FULL list
  break;

// CORRECT — if backend sends only the new user, merge
case 'USER_CONNECTED':
  setOnlineUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
  break;

case 'USER_DISCONNECTED':
  setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
  break;
```

Pick one pattern and be consistent across backend and frontend.
The cleanest approach: **backend maintains full list, broadcasts full list,
frontend sets directly.**

---

## STEP 4 — Apply the same fix to ALL micro-frontends

HololinkHub.tsx exists in multiple portals. Apply the fix everywhere:

```bash
find /home/james/SovereignOS -name "HololinkHub.tsx" -type f
```

Fix every instance found.

---

## STEP 5 — Verify

1. Log in as James (Pilot) on desktop
2. Log in as Antigravity (Agent) on phone
3. Log in as Eileen (Patron) on Pi or second device
4. Confirm ALL THREE appear simultaneously in HoloLink panel
5. Log out Eileen — confirm she disappears, James and Antigravity remain
6. Screenshot the final three-user presence state as proof

---

## PASS CRITERIA

- [ ] Multiple users visible simultaneously in HoloLink panel
- [ ] New logins append to the list, not replace it
- [ ] Logouts remove only that user, leave others intact
- [ ] Fix applied to all HololinkHub.tsx instances across all portals
- [ ] Defect ticket closed per KI-039

---

*Antigravity Work Order — Stack Labs LLC / Sovereign OS*
*Campsite Protocol: Leave every system better than you found it.*
