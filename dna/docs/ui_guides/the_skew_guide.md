# 📺 THE SKEW — Pilot's User Guide
### Sovereign FanStack · Rule 88 Compliant · Rev 1.0 · 2026-04-26

> **TL;DR:** Pick your degenerates, give them a topic, watch them argue about the Mets. Blow it up if needed.

---

## 🚀 Launch URL

```
https://sov73.taila01894.ts.net/?domain=SKEW&room=the_skew
```

Or: **Sovereign OS Portal** → any domain nav → `THE SKEW`

---

## 📐 Two Phases — You Can't Skip Phase 1

```
[ Phase 1: Panel Selector ]  →  [ Phase 2: Live Broadcast ]
```

---

## PHASE 1 · Panel Selector

What you see on load. Pick your cast.

### Left — Persona Grid

All **active** personas from `sovereign_now.db`. Click to select (blue glow), click again to deselect.

> [!IMPORTANT]
> **Hard cap: 8 seats** (Rule 87 — Panel of 8). Grid stops accepting clicks at 8 selected.

### Right — Assigned Seats (X/8)

Your lineup in order of selection. **Click a filled seat to remove that persona.**

**Default pre-loaded panel:**

| Seat | Persona | Vibe |
|---|---|---|
| 1 | **Dot** | Stats oracle, probability-driven |
| 2 | **Barf** | Unhinged trauma vessel, pure Mets suffering |
| 3 | **7_Train_Terry** | Pessimistic chronicler of disaster |
| 4 | **Scruffy** | Grizzled barkeep, says "Tom Glavine" and goes silent |
| 5 | **Uncle Stevie Stan** | Steve Cohen evangelical, money theology |
| 6 | **Wordy** | Cannot say fewer than 200 words. Always right eventually. |
| 7–8 | *(empty)* | BatteryChucker lives here as Surprise Guest |

### Initial Topic Directive

The text field before kick-off. This is the **opening brief** injected to all personas.

```
Examples:
"METS POST-GAME: ANOTHER ONE BITES THE DUST | 2026 DUMPSTER FIRE SEASON"
"GAME 2 IS LIVE — CAN THEY TURN IT AROUND?"
"BOTTOM OF THE 9TH: WHO DO YOU BLAME TODAY?"
```

### 🔵 BUILD PANEL & KICK OFF

Pressing this:
1. Locks your selected personas as the active panel
2. Broadcasts the topic directive to all of them via WebSocket (`update_context` to `the_skew` room)
3. Loads Phase 2 immediately

> [!TIP]
> Personas start responding within seconds if `fanstack_chatbots.py` is running and connected to `the_skew` room. You don't need to do anything else.

---

## PHASE 2 · Live Broadcast

Your panel sits at a virtual desk. Big avatars. Speaking indicators. The whole bit.

---

## 🎛️ The 5 Control Buttons (Top Right)

### `Edit Panel`
Returns to Phase 1. Current panel and topic are preserved. Use to **hot-swap a panelist mid-show.**

---

### `Fire Shatcast Sim`
Local test — injects pre-written lines for all panelists in sequence (4 sec apart). **Does not need the relay running.** Use this to:
- Verify avatars are loading
- Test the speaking glow indicators
- Demo the UI without live AI

---

### `⚾ Mets Meltdown Mode`
Splits the screen with an overlay:
- **Left:** Living Kanban Board (your SDLC tickets)
- **Right:** Sovereign Shark Tank pitch deck

Live broadcast blurs behind it. Useful for screen-share demos. Hit again to dismiss.

---

### `🚨 Springer Override (Level 5)`
**Full chaos mode.** When active:
- Background turns deep red with pulse
- All speech bubbles go **UPPERCASE** + `🪑💥`
- Chyron switches to `[TOPIC] — LEGAL ACTION PENDING`
- Alert icon spins

Toggle off to return to normal. Named after Jerry Springer. You'll know when.

---

### `✨ Flow Prompt`
Generates a **Google Flow/Veo video prompt** from the current topic + last 5 messages. Opens a copyable overlay. Paste into Google Flow to create a Flowmercial of the panel's reaction.

---

## 🗣️ The Panelist Desk

When a persona is speaking:
- Avatar **scales up 15%** and lifts off the desk
- **Blue glow** pulses around portrait (red in Springer Mode)
- **Speech bubble** appears with their message
- Nameplate highlights

Last **3 messages** stack as floating bubbles above the desk, auto-expiring.

---

## ✍️ Your Chat Input (Bottom Right)

You can talk to the panel in real time.

| Syntax | Effect |
|---|---|
| `@barf what about the bullpen?` | Targets Barf specifically |
| `@dot run the xFIP` | Dot responds with analysis |
| `@scruffy what are you pouring?` | Scruffy responds in character |
| *(no @mention)* | Broadcast — any panelist may respond |

Press **Send** or **Enter**. Goes into the relay as `target_game_pk: the_skew`.

---

## 📺 Chyron (Bottom News Ticker)

Scrolls the current hot topic on a 15-second loop.
- **Normal:** `📻` icon + topic text
- **Springer Mode:** `⚠️` icons + `LEGAL ACTION PENDING`

---

## 🎁 BatteryChucker — Surprise Guest Protocol

He is **intentionally not in the default 6**. To drop him in mid-show:

1. Click `Edit Panel` (top right)
2. Find `battery_chucker` in the grid and select him
3. Hit `Build Panel & Kick Off`

The panel reloads with him at Seat 7 and re-injects the topic. His mid-show entrance is designed to be chaotic.

---

## 🧠 How Personas Actually Work

| Layer | Role |
|---|---|
| `sovereign_now.db` · `sys_user` | Source of truth — name, system prompt (`introduction`), active flag |
| `fanstack_chatbots.py` | Reads CMDB, loads `introduction` as LLM system prompt, fires responses |
| WebSocket relay | Broadcasts `CHAT_MSG` with `author` + `text` to connected clients |
| The Skew UI | Renders last message sender as active speaker |
| `/api/persona_image/{name}` | Live avatar endpoint — Persona Center uploads appear **instantly** |

> [!NOTE]
> Avatars updated in **Persona Center** show in The Skew immediately. No reload. No cache bust needed. The Skew reads from the live API, not a static file.

---

## ⚠️ Known Quirks & Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Persona grid is empty | Relay/CMDB API offline | Start `fanstack_relay.py` on Node .73 |
| Personas not responding | Chatbots not joined to `the_skew` room | Check `fanstack_chatbots.py` is running |
| Wrong avatar speaking | `author` field mismatch vs `user_name` | Verify chatbot sends exact `user_name` as author |
| BatteryChucker avatar broken | File missing from `dna/media/avatars/` | Upload via Persona Center |
| Wordy hasn't stopped talking | Working as intended | This is the persona |
| Jake Taylor widget visible | LiveAudioInterface still mounted | He is muzzled — ignore the widget |

---

## 📋 Quick Reference Card

```
LAUNCH URL  →  sov73.taila01894.ts.net/?domain=SKEW&room=the_skew
MAX PANEL   →  8 seats (Rule 87)
DEFAULT     →  Dot, Barf, Terry, Scruffy, Uncle Stevie, Wordy
SURPRISE    →  BatteryChucker (Seat 7 — add mid-show via Edit Panel)
TOPIC       →  Edit "Initial Topic Directive" before kick-off
TEST SIM    →  "Fire Shatcast Sim" — no relay required
CHAOS       →  Springer Override (Level 5)
FLOW VID    →  "✨ Flow Prompt" → copy → paste into Google Flow
CHAT        →  Bottom-right box · @name to target · no @ for all
OPEN TICKET →  #STO-016 Full Persona Audit (1-Critical, open)
```

---

## 🗂️ Related Rooms

| Room | URL param | Purpose |
|---|---|---|
| **Persona Center** | `room=employee_center` | Edit persona data, upload avatars |
| **Scruffy's Tavern** | `/scruffys/` | Lightweight raw chat — use when React is eating RAM |
| **FanStack MLB** | `domain=MLB&room=snackbar` | Game chat + live box score |
| **Service Operations** | `room=sow` | Ticket tracker (#STO-016 lives here) |
| **Sovereign OS Portal** | root | Master launchpad |

---

*First guide filed under Rule 88 — The Component User Guide Mandate*
*Next up: Persona Center · ARGUS Nexus · Command Center · Edge DVR Console*
