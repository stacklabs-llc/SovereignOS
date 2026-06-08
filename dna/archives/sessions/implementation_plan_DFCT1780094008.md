# Goal: Resolve Room Builder Persona State Sync & Reset Race Condition

Fix the highly disruptive bug where checked personas inside Scruffy's Tavern "Room Builder" modal reset/disappear periodically while editing. This race condition is caused by a background poller updating the active personas array mid-edit, which re-fires the modal initializer's `useEffect` dependency loop.

## User Review Required

> [!IMPORTANT]
> The solution is fully non-disruptive and self-contained:
> 1. **React State Sync Fix**: We will alter the `useEffect` in [ScruffysTavern.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/ScruffysTavern.tsx#L91-L107) so that the initialization of `stagedPersonas` runs **ONLY** upon transition of `isRoomBuilderOpen` from `false` to `true`. Background polling of `activePersonas` (every 10 seconds) will continue uninterrupted but will no longer clobber the user's active checkmarks.
> 2. **Transaction Concurrency (Defensive Programming)**: To guard against concurrency spikes on SQLite writes (busy locks under WAL), we will ensure database connections in `/api/save_room_personas` have an explicit connection timeout.

## Open Questions

No open questions are pending. The technical cause is verified and isolated to the React component dependency loop.

## Proposed Changes

---

### FanStack Client Portal

#### [MODIFY] [ScruffysTavern.tsx](file:///home/james/SovereignOS/15_FanStack/src/components/ScruffysTavern.tsx)
* **Lines 91-107**: Break the dependency loop by removing `activePersonas` from the modal initializer `useEffect` dependency array. The effect will only depend on `[isRoomBuilderOpen]`.
* **Lines 102-105**: When `isRoomBuilderOpen` transitions to `true`, grab the current snapshot of `activePersonas`, strip the `@` prefix, lowercase the names, and set `stagedPersonas`.
* This ensures that while the modal is open, any background updates to `activePersonas` from the 10-second `fetchPersonas` poller do NOT reset the user's selected checkboxes.

---

### Sovereign Core / M.A.R.D Relays

#### [MODIFY] [fanstack_relay.py](file:///home/james/SovereignOS/scripts/fanstack_relay.py)
* **Line 697**: Add `timeout=30.0` to the SQLite connection: `con = _sq.connect(DB_PATH, timeout=30.0)`. This allows transaction queueing during concurrent chatbot or telemetry writes.

#### [MODIFY] [the_skew_relay.py](file:///home/james/SovereignOS/scripts/the_skew_relay.py)
* **Line 645**: Add `timeout=30.0` to the SQLite connection: `con = _sq.connect(DB_PATH, timeout=30.0)`.

---

## Verification Plan

### Automated/Headed Verification
* Use the **Antigravity Browser Subagent** to navigate to Scruffy's Tavern portal (`https://clio.taila01894.ts.net:3009/`).
* Bypass the self-signed HSTS block by typing `thisisunsafe` on screen.
* Open the **Build Room** modal.
* Select/deselect multiple personas. Wait at least 15 seconds inside the modal to verify the 10-second background poll resolves *without* resetting checkmarks.
* Click **Save & Re-provision Room** and verify the active personas update instantly and persist on page reload.
