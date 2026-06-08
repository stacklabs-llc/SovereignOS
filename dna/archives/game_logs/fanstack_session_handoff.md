# FanStack Session Handoff — 2026-05-07

> **Status:** System is live. ATH@PHI completed (Final). NYM@COL ran its first real simulation. Services are up.

---

## ✅ What Got Done This Session

### 1. Live MLB Telemetry — Working
- `fanstack_background_poller.py` correctly polls the MLB Stats API and broadcasts real `STATCAST` banners into chat via `CHAT_MESSAGE` with `is_telemetry: true`
- The relay's duplicate `mlb_poller` was **killed** (reverted to a no-op sleep stub). Background poller is the sole ingestion source — this stopped double-STATCAST messages
- Background poller date was fixed from hardcoded April 29 → **dynamic today's date**

### 2. Chatbot Cleanup — Working
- Added `_strip_meta_notes()` to **both** Gemini and Phi-3 response return paths
- Strip function now catches all observed leak patterns:
  - `### DEEP LORE ###`, `#### AI CONTRIBUTION ALERT ####`
  - `[END OF PROFILE]`, `[END OF...]`, `[PROFILE END]`
  - `(As per the instructions...)`, `(Following the guidelines...)`
  - Hashtag spam chains (`#SotoFanHere #BaseballLife`)
  - `character limit`, `word limit`, `Note to AI`
  - Trailing `---` separator bleed

### 3. NYM@COL Room — Live
- **Game PK:** `824361`
- **Room state:** `active`
- **Personas deployed (all Boggs 3):**

| Persona | Team |
|---|---|
| barf, 7_train_terry, uncle_stevie_stan, deferred_shohei_700 | NYM |
| Coors_Crusher, Mile_High_Mike, Dinger_Diehard, Rock_Pile_Randy, altitude_andy | COL |
| dot | global |

- Room required a **manual kickstart** (CMD_SYNC_STATE injection via WS) at 01:16 UTC because the background poller found "Pre-Game" status but the chatbot didn't wake up automatically
- All 9 personas fired within ~2 min of kickstart

### 4. Stream Sniper Proxy — Wired (Partially)
- `stream_sniper_daemon.py` runs on port **5056**
- The relay (port 8000) had **no `/api/snipe/*` route** → UI calls were 404ing silently
- Added a `requests`-based proxy in `fanstack_relay.py` that forwards all `/api/snipe/*` → `localhost:5056`
- The `isTailing` state was set to `true` before the fetch, so the "SNIPING" badge always showed even on failure — masked the bug for a long time
- **Outstanding:** Chat still didn't load on the test video — see open issues below

---

## 🔴 Open Issues for Next Session

### Priority 1 — DOT's "Scheduled" Echo
**Symptom:** dot fires `⚾ Scheduled` every 15-30 seconds, flooding the chat with raw API status strings.  
**Root cause:** The ambient trigger fires on `status_msg = "Scheduled"` when the background poller sends heartbeat STATE_UPDATEs for games in pre-game state. The `is_pregame` condition includes "Scheduled."  
**Fix:** In `fanstack_chatbots.py`, in the STATE_UPDATE handler or ambient loop, add:
```python
# Skip ambient if status_msg is a raw API status label (not a play description)
RAW_STATUS_LABELS = {"Scheduled", "Pre-Game", "Warmup", "Delayed", "Postponed", "In Progress"}
if status_msg.strip() in RAW_STATUS_LABELS:
    continue  # Don't fire ambient for non-play statuses
```

### Priority 2 — Chatbot Auto-Wake for New Rooms
**Symptom:** NYM@COL room was activated at ~00:29 UTC but bots didn't fire until manual kickstart at 01:16 — nearly 50 minutes late.  
**Root cause:** The chatbot (fanstack_chatbots.py) connects to WS port 8008 and waits for STATE_UPDATE. The background poller sends CMD_SYNC_STATE to port 8008, relay processes it. But on first connect, the chatbot only gets an empty STATE_UPDATE. Subsequent CMD_SYNC_STATEs for game 824361 may have had the same hash (Pre-Game is static), so no re-broadcast was triggered.  
**Fix:** The background poller's `state_hash` logic should force a broadcast when a room transitions from `staged` → `active`, or the chatbot should be smarter about polling `/api/all_personas` on startup to pre-load room assignments.

### Priority 3 — Stream Sniper Chat Not Loading
**Symptom:** Pasted `https://www.youtube.com/watch?v=dTSXGPHRFc8` (Mets postgame highlights). "SNIPING" badge showed, video loaded, but chat panel stayed empty.  
**Root cause (likely):** The video is a **highlights clip VOD**, not a live stream. `tail_wardy_chat.py` uses `yt-dlp` or `chat-downloader` to fetch YouTube live chat, which only exists for:
  1. Currently live broadcasts
  2. Live stream replays with chat replay enabled
A highlights upload has no live chat feed.  
**To investigate:** Check `tail_wardy_chat.py` — does it gracefully fail on VODs? Does it send any YOUTUBE_CHAT messages to the relay WS? Check if the relay's `live_chat_sniper` room is receiving the messages but the UI filtering them out.  
**Also check:** The relay WS message routing — when `tail_wardy_chat.py` sends `YOUTUBE_CHAT` to port 8008, is it also sending `target_game_pk: "live_chat_sniper"`? The LiveChatSniper UI JOINs room `live_chat_sniper` and only shows messages from that room.

### Priority 4 — model_engine in UI
**Status:** `model_engine` field is already tagged on every `CHAT_MESSAGE` payload:
```python
"model_engine": "Ollama (Phi-3)" if model == "local_phi3" else "Gemini 1.5 Flash"
```
**Missing:** `ScruffysTavern.tsx` doesn't render it yet. Add a small badge under each message bubble, e.g.:
```tsx
{msg.model_engine && (
  <span className="text-[9px] text-white/20 font-mono ml-1">{msg.model_engine}</span>
)}
```

### Priority 5 — battery_chucker / Context Accuracy
**Symptom:** battery_chucker said "Bryce Harper crushed one!" when Harper actually grounded out.  
**Root cause:** The play description is in the state but the LLM prompt doesn't include enough play context. The bot fires on `status_msg` but doesn't parse the play result (out vs hit).  
**Fix:** Include `play_event_type` (strikeout / flyout / homerun / single etc.) in the prompt context explicitly, not just the raw description string.

### Priority 6 — Response Latency (Phi-3)
**Observed:** Rock_Pile_Randy: 102s, Mile_High_Mike: 89s, altitude_andy: 116s. All on local Phi-3.  
**Cause:** Ollama is running all these personas sequentially through a `Semaphore(2)` cap.  
**Options:**
- Reduce persona count per room when Phi-3 is the fallback
- Implement persona priority tiers: top 3 respond to live plays, rest respond to ambient
- Consider increasing Ollama parallelism if VRAM allows

---

## Service Status at Handoff

| Service | Port | Status |
|---|---|---|
| `fanstack_relay.py` (FastAPI + WS) | 8000, 8008 | ✅ Running |
| `fanstack_chatbots.py` | connects to 8008 | ✅ Running |
| `fanstack_background_poller.py` | internal | ✅ Running |
| `stream_sniper_daemon.py` | 5056 | ✅ Running |
| `sovereign_core_api.py` | 5007 | ✅ Running |

**Logs:**
- Chatbots: `/tmp/chatbots.log`
- Relay: `/tmp/fanstack_relay.log`
- Poller: `/tmp/poller.log`
- NYM@COL chat export: `/home/james/SovereignOS/08_FanStack/logs/daily_06052026/auto_export_824361.md`

**DB:** `/home/james/SovereignOS/dna/sovereign_now.db`

---

## Files Modified This Session

| File | Change |
|---|---|
| `scripts/fanstack_relay.py` | Killed duplicate `mlb_poller`; added `/api/snipe/*` proxy to daemon:5056 |
| `scripts/fanstack_background_poller.py` | Fixed hardcoded date; added STATCAST chat banners |
| `scripts/fanstack_chatbots.py` | Added `_strip_meta_notes()` to both Gemini+Phi-3 paths; expanded leak patterns |
| `01_Sovereign_Portal/src/components/LiveChatSniper.tsx` | (reviewed, no changes needed — issue was backend proxy) |
| `dna/sovereign_now.db` | NYM@COL room 824361 activated; personas assigned; COL+NYM Boggs bumped to 3 |
