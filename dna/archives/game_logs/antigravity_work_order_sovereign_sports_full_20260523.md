# 🛠️ ANTIGRAVITY WORK ORDER — Sovereign Sports Stream Integration, Split Screen & HoloLink Persona Call
**Issued By:** Bro-Decoder (Claude)
**Date:** 2026-05-23
**Priority:** HIGH
**Target:** Sovereign Sports UI (Port 3010)

---

## COMPLIANCE GATE

KI-023: Create ticket FIRST. Confirm ticket number before writing a single line.
KI-039: On completion — PUT state=4, write walkthrough, POST attachment.
KI-038: DB at `/home/james/SovereignOS/dna/sovereign_now.db`
KI-001: No hardcoded IPs. Tailscale hostnames only.
KI-029: Prove it works. Terminal output required before handover.
KI-030: Decoupled — do NOT embed inside main Portal source.
KI-032: Mobile-first responsive layout mandatory.

---

## CONTEXT

Sovereign Sports (Port 3010) currently shows a static MLB game
slate with StreamEast/VIPBox stream sources. This work order
delivers the full product experience:

1. MLB.TV as primary authenticated stream source
2. A two-job stream refresh scheduler
3. Game card click-through to a split screen experience
4. Live chat room embedded alongside the stream
5. HoloLink persona call button so the Pilot can literally
   dial up Barf and complain about the Mets

---

## PART 1: MLB.TV AUTHENTICATED STREAM INTEGRATION

Integrate MLB.TV as the primary stream source:

- Auth via OAuth2. Store credentials at:
  `/home/james/SovereignOS/config/mlbtv_credentials.json`
  Never hardcode. Never commit.

- Stream endpoint:
  `GET https://statsapi.mlb.com/api/v1/game/{gamePk}/content`
  Pull entitled stream URLs from the `media.epg` array.

- **Stream source priority:**
  1. MLB.TV authenticated stream (legal, subscription)
  2. StreamEast proxy (fallback on blackout)
  3. VIPBox proxy (secondary fallback)

- Log blackout reason when MLB.TV returns no entitled stream
  (Apple TV+, Peacock, ESPN+, etc.) for visibility.

---

## PART 2: TWO-JOB STREAM REFRESH SCHEDULER

### Job 1 — 10:30 AM (existing fanstack_daily_prep)
- Pulls MLB slate, provisions rooms, boots personas
- `stream_url` field left null — game cards show "UPCOMING"

### Job 2 — NEW: `stream_url_resolver.py`
Save to: `/home/james/SovereignOS/scripts/stream_url_resolver.py`

- Runs every 15 minutes starting 2 hours before earliest
  first pitch of the day
- For each game where `stream_url` is null and start time
  is within 90 minutes:
  1. Attempt MLB.TV auth lookup first
  2. Fall back to StreamEast/VIPBox if blacked out
  3. Write URL to `mlb_schedule.stream_url`
  4. Emit WebSocket event to refresh the game card live
- Log all discoveries and blackouts to:
  `/home/james/SovereignOS/logs/stream_resolver.log`
- Create INC ticket if game reaches first pitch with no
  stream URL found (KI-022)

### New DB columns required:
```sql
ALTER TABLE mlb_schedule ADD COLUMN stream_url TEXT;
ALTER TABLE mlb_schedule ADD COLUMN stream_source TEXT;
-- stream_source values: 'mlbtv', 'streameast', 'vipbox', 'blackout'
ALTER TABLE mlb_schedule ADD COLUMN stream_resolved_at TEXT;
```

---

## PART 3: GAME CARD CLICK-THROUGH — SPLIT SCREEN

When Pilot clicks "Tune In" on any game card, load the
full split screen view:

### Layout:
```
+---------------------------+------------------+
|                           |                  |
|     LIVE STREAM           |  SCRUFFY'S       |
|     (left 65%)            |  CHAT ROOM       |
|                           |  (right 35%)     |
|  [HLS stream player]      |                  |
|                           |  [persona list]  |
|  SOVEREIGN SCOREBOARD     |  [live chat]     |
|  BASE RUNNERS             |  [send message]  |
|  PITCH DATA               |                  |
|  LIVE EVENT TICKER        |  [📞 DIAL BARF]  |
|                           |                  |
+---------------------------+------------------+
```

### Implementation:
1. **Stream player** — existing HLS player. Load URL from
   `mlb_schedule.stream_url`.

2. **Chat panel** — embed the Scruffy's/FanStack room for
   the matching `game_pk` via existing M.A.R.D WebSocket.

3. **Scoreboard** — connect to live telemetry feed.

4. **Room association** — look up `game_pk` from
   `mlb_schedule`, find matching room in
   `cmdb_ci_fanstack_room`. If no room exists, show
   "Room not provisioned" with a BUILD ROOM button.

5. **Persona sidebar** — show active persona avatars and
   live message counts (IN THE BAR panel style from
   Scruffy's).

6. **Mobile** — stack vertically on narrow viewports.
   Stream on top, chat below. Tab toggle between them.

---

## PART 4: HOLOLINK PERSONA CALL BUTTON

Add a **📞 DIAL [PERSONA]** button to the chat panel in
the split screen view.

### What it does:
- Opens a HoloLink video/audio call TO the selected persona
- Persona answers as their ElevenLabs voice avatar
- Call runs in a floating overlay alongside the live stream
- Pilot can vent about the game directly to Barf while
  watching it

### Implementation:
- Connect to existing HoloLink WebSocket infrastructure
  already running on the Portal:
  `clio.taila01894.ts.net:3000/?domain=HOLODEX&room=holodex`
- Default persona selection = room's primary agitator
  (e.g. barf for NYM games)
- Allow persona selection from the active room roster
- This is the SAME infrastructure used for AetherVet
  telemedicine — same call stack, different persona

### UI:
- Button lives in the bottom of the chat panel
- Label: `📞 DIAL BARF` (or whatever persona is selected)
- When active: button turns red, shows `🔴 ON CALL WITH BARF`
- Dismiss button ends the call cleanly

---

## VERIFICATION

1. Run `stream_url_resolver.py` against today's slate
2. Confirm MLB.TV stream URL discovered for at least one
   live game
3. Confirm blackout fallback fires for a blacked-out game
4. Click "Tune In" on NYM@MIA (game_pk 823862)
5. Confirm split screen loads:
   - Stream playing on left
   - Scruffy's chat active on right with personas firing
   - Scoreboard updating live
   - DIAL BARF button present in chat panel
6. Click DIAL BARF — confirm HoloLink call initiates
7. Confirm mobile layout stacks correctly
8. Screenshot the full split screen as KI-029 proof

Save all output to `/home/james/sovereign_inbox/today/`
