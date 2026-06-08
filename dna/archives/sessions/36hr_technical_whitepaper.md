# Sovereign OS — Technical Whitepaper
## 36-Hour Engineering Sprint: Architecture, Changes, and System State
**Period:** 2026-05-20 01:57 UTC → 2026-05-21 20:47 UTC
**Author:** Antigravity (AI Copilot) | Reviewed by: James Carroll (Pilot)

---

## 1. System Architecture Overview

### 1.1 Node Topology

```
┌─────────────────────────────────────────────────────┐
│              SOVEREIGN OS MESH (Tailscale)           │
│                                                     │
│  clio (Beelink)          argo (Pi 5 + Hailo AI Hat) │
│  ├── Port 80/443  Nginx  ├── Port 3009  FanStack     │
│  ├── Port 3009    Vite   ├── Port 8081  ArgusNexus   │
│  ├── Port 3015    AetherVet                          │
│  ├── Port 8000    fanstack_relay.py                  │
│  ├── Port 8008    fanstack_chatbots (WS hub)         │
│  ├── Port 8009    ws-skew relay                      │
│  ├── Port 8012    HoloLink WS signaling              │
│  └── Port 8096    CMDB API                           │
│                                                     │
│  calvin (Mac Mini)       mando (Pi Zero 2W)          │
│  ├── Camera stream       └── Watchdog daemon         │
│  └── Tailscale node           (INC auto-detection)  │
└─────────────────────────────────────────────────────┘
```

### 1.2 Primary Database

Single canonical SQLite: `/home/james/SovereignOS/dna/sovereign_now.db`
Symlink: `/home/james/SovereignOS/data/sovereign_now.db` → canonical

Key tables: `rm_story`, `rm_incident`, `rm_defect`, `cmdb_ci`, `fanstack_personas`, `game_cache`, `statcast_log`

**Ghost DB purge (2026-05-20):** Removed zero-KB orphaned files:
- `data/fanstack.db` (orphan)
- `data/fanstack_sim.db` (orphan)
- `data/sdlc_now.db` (orphan)
- `data/sovereign_core.db` (orphan)

### 1.3 FanStack Service Map

```
fanstack_background_poller.py  → polls MLB Stats API → writes game_cache.json (hot)
                                                      → writes game_cache_{pk}.json (cold)
fanstack_chatbots.py           → M.A.R.D. engine → reads hot cache → LLM → WS broadcast (8008)
statcast_sentinel.py           → polls MLB Statcast → broadcasts statcast_pitch events (8008)
fanstack_relay.py              → HTTP API (8000) + WS hub (8008 proxy)
```

### 1.4 WebSocket Routing Architecture

```
Browser (HTTPS)
    ↓
wss://clio.taila01894.ts.net:3009/ws
    ↓
Vite Dev Server (port 3009) — proxy rule: /ws → ws://127.0.0.1:8008
    ↓
fanstack_chatbots.py WebSocket Hub (port 8008)
    ↓
M.A.R.D. broadcast to all connected clients
```

**Why not direct to 8008?** Port 8008 is a raw backend-to-backend socket. External browsers hitting 8008 directly bypass the Nginx SSL termination and the Vite proxy — this means no WSS upgrade on mobile browsers (mixed content block) and no Tailscale auth layer.

---

## 2. Changes Implemented This Sprint

### 2.1 FanCast Static Watch Party — Deployment

**Files:**
- Source: `/home/james/SovereignOS-sandbox/UAT/08_FanCast/fancast_fan_live_mobile.html`
- Source: `/home/james/SovereignOS-sandbox/UAT/08_FanCast/fancast_live_logs.html`
- Deployed to: `/home/james/SovereignOS/15_FanStack/public/`

**Rationale for target directory:**
`15_FanStack/public/` is the Vite static asset folder for the FanStack application. Files placed here are:
1. Served directly by the FanStack Vite dev server at port 3009
2. Automatically covered by the `/ws` → port 8008 WebSocket proxy
3. Automatically covered by the `/api` → port 8000 API proxy
4. Architecturally scoped to FanStack (ownership is correct)

**Alternative rejected:** `20_AetherVet/public/` — AetherVet's `/ws` proxy routes to port 8012 (HoloLink signaling), NOT port 8008 (FanStack chat). Files placed there would silently connect to the wrong backend.

### 2.2 WebSocket URL Fix

**Before:**
```javascript
let wsUrl = `ws://${window.location.hostname}:8008/ws`;
if (window.location.hostname.includes('ts.net')) {
    wsUrl = `wss://${window.location.hostname}/ws`;  // ← BUG: no port
}
```

**Problem:** `wss://clio.taila01894.ts.net/ws` has no port — defaults to 443. Port 443 is Nginx, not Vite. Vite proxy on 3009 never receives the connection. WebSocket upgrade fails silently.

**After:**
```javascript
const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsPort  = window.location.port ? `:${window.location.port}` : '';
const wsUrl   = `${wsProto}//${window.location.hostname}${wsPort}/ws`;
```

**Result:** When served at `https://clio.taila01894.ts.net:3009/`, builds `wss://clio.taila01894.ts.net:3009/ws` → Vite proxy intercepts → forwards to `ws://127.0.0.1:8008`. Works on both desktop and mobile.

### 2.3 New Message Handlers — fancast_fan_live_mobile.html

**statcast_pitch handler:**
```javascript
else if (msg.type === 'statcast_pitch') {
  const d = msg.data || msg;
  const pitchName  = (d.pitch_name  || d.pitch_type || '---').toUpperCase();
  const pitchSpeed = d.start_speed  || d.pitch_speed || '---';
  
  document.getElementById('pitch-type').textContent  = pitchName;
  document.getElementById('pitch-speed').textContent = pitchSpeed;
  if (batter)  document.getElementById('batter-val').textContent  = batter;
  if (pitcher) document.getElementById('pitcher-val').textContent = pitcher;
  if (desc && desc !== lastStatusMsg) {
    lastStatusMsg = desc;
    appendMessage('STATCAST', '#10B981', `⚾ ${pitchName} @ ${pitchSpeed} mph — ${desc}`, null);
  }
}
```

**Key fields checked (field name normalization):**
- Pitch name: `pitch_name` || `pitch_type`
- Speed: `start_speed` || `pitch_speed`
- Description: `description` || `play_desc`
- Batter: `batter` || `batter_name`
- Pitcher: `pitcher` || `pitcher_name`

**persona_take handler:**
```javascript
else if (msg.type === 'persona_take') {
  const author = msg.persona || msg.user  || 'PERSONA';
  const text   = msg.take   || msg.text   || msg.message || '';
  const color  = msg.color  || '#F59E0B';
  appendMessage(author, color, text, msg.timestamp || null);
}
```

Routes through existing `appendMessage()` — zero additional DOM logic.

### 2.4 Log Viewer Overhaul — fancast_live_logs.html

**Key changes:**
- Multi-file dropdown selector (relay, chatbots, poller, sniper, admin)
- Log path: `/logs/${logName}.log` — served via symlink `15_FanStack/public/logs/` → `/home/james/SovereignOS/logs/`
- Auto-tail toggle (on by default)
- 5-second polling interval via `setInterval`
- 2000-line DOM cap (`lines.slice(-2000)`) to prevent memory growth
- Syntax colorization: `MLB_TELEMETRY`/`statcast` → yellow, `SYSTEM`/`ERROR`/`WARN` → red, persona brackets → cyan

**Symlink created:**
```bash
ln -sfn /home/james/SovereignOS/logs /home/james/SovereignOS/15_FanStack/public/logs
```

### 2.5 React Base Diamond Fix — FanStackLive.tsx

**Problem 1: Scoreboard header (small diamond)**
Original had hardcoded `bg-[#facc15]` (always yellow/occupied) with no 3rd base in the proper position. Wrong diamond orientation.

**Fixed layout:**
```
     [2B]        ← top
   [3B] [1B]     ← middle row
```
All bases are `border-white/20 bg-transparent` — empty state by default. Live state driven by WebSocket STATE_UPDATE (existing logic retained).

**Problem 2: Field SVG (batter indicator)**
Original had:
```jsx
<circle cx="200" cy="210" r="15" fill="#6B4423" />  {/* BATTER HEAD */}
<rect x="195" y="208" width="10" height="4" fill="#ffffff" />  {/* BAT */}
```
This visual representation of the batter at home plate is architecturally wrong — the bases diamond represents base runners, not the at-bat state.

**Removed and replaced with:**
```jsx
{/* Home plate — pentagon */}
<polygon points="200,308 210,298 210,285 190,285 190,298" fill="#ffffff" opacity="0.9" />
{/* Pitcher's mound — no batter */}
<circle cx="200" cy="215" r="8" fill="#8B6914" opacity="0.6" />
```

Pitch animation path also updated: `M 200 215 Q 185 255 200 295` (corrected start/end coordinates to match new mound/plate positions).

### 2.6 AI Model Badge — FanStackChat.tsx

**Interface update:**
```typescript
interface Message {
  id: string;
  persona_name: string;
  avatar_url: string;
  hex: string;
  text: string;
  timestamp: string;
  model?: string;  // ← NEW (optional, backwards-compatible)
}
```

**WS payload parsing:**
```typescript
model: data.model || data.model_used || data.engine || undefined,
```
Checks three possible field names from the relay — tolerant of backend naming variations.

**Badge rendering:**
```tsx
{msg.model && (
  <span className={`text-[8px] px-1 py-px rounded border font-mono 
                    font-normal tracking-wider leading-none 
                    ${getModelColor(msg.model)}`}
        title={msg.model}>
    {getModelLabel(msg.model)}
  </span>
)}
```

**Label/color mapping:**

| Model string | Label | Color |
|---|---|---|
| `gemini-2.5-pro` | `G2.5P` | Purple |
| `gemini-2.5-flash` | `G2.5F` | Sky blue |
| `gemini-2.0-flash` | `G2.0F` | Blue |
| `gemini-1.5-pro` | `G1.5P` | Violet |
| `gemini-1.5-flash` | `G1.5F` | Default blue |
| `llama` / `ollama` / `local` | `LOCAL` | Emerald |
| `claude` | `CLDE` | Orange |
| fallback | first 6 chars | White/dim |

TypeScript compile: **zero errors** (verified with `npx tsc --noEmit`).

---

## 3. Infrastructure Incidents This Sprint

### INC-01: Portal Auth Outage (2026-05-21 ~17:09)
- **Symptom:** FanStack-branded login screen appearing at `https://clio.taila01894.ts.net/` — Nginx routing serving the wrong app
- **Root cause:** `sovereign_core_api.py` auth backend process had stopped
- **Resolution:** Process restarted; auth restored
- **Mitigation:** Mando Pi Zero 2W watchdog to be reconnected for auto-INC generation on auth outages

### INC-02: FanStack Relay Offline (2026-05-21 ~17:15)
- **Symptom:** "Relay Offline — Failed to fetch live roll call" in `scruffys` room
- **Root cause:** `fanstack_relay.py` on port 8000 had stopped
- **Resolution:** Process restarted; relay restored

### INC-03: AetherVet HoloLink Self-Call Bug (2026-05-21 STRY3000415)
- **Symptom:** Clicking "Connect to AetherVet" on mobile initiated a call back to the same device
- **Root cause:** WebRTC offer SDP was using `window.location` as the peer target — when the mobile browser IS the Vite server origin, it was loopbacking
- **Resolution:** HoloLink signaling corrected to use explicit Argo node target. Confirmed working phone-to-Argo.

---

## 4. Hot/Cold Storage Architecture (Background Context)

Implemented over prior sessions, now stable:

```
fanstack_background_poller.py
  ├── Polls MLB Stats API every 30s
  ├── Writes /hot/game_cache.json (current game state — always fresh)
  └── Writes /cold/game_cache_{game_pk}.json (per-game archive)

fanstack_chatbots.py (M.A.R.D. engine)
  ├── Reads /hot/ for current context (minimal token burn)
  ├── Reads /cold/ ONLY for specific historical queries or major events
  └── Local model fallback (Phi-3/Llama) for routine chatter
```

**Impact:** Eliminated the "telemetry sieve" pattern where every LLM call received the entire game state as context. Token burn is now event-gated.

---

## 5. Files Modified This Sprint

| File | Change Type | Summary |
|---|---|---|
| `15_FanStack/public/fancast_fan_live_mobile.html` | NEW DEPLOY | WS fix, statcast_pitch handler, persona_take handler |
| `15_FanStack/public/fancast_live_logs.html` | NEW DEPLOY | Multi-log dropdown, auto-tail, 5s poll, symlink-aware path |
| `15_FanStack/public/logs` | NEW SYMLINK | → `/home/james/SovereignOS/logs/` |
| `15_FanStack/src/components/FanStackLive.tsx` | MODIFIED | Bases diamond fix, batter SVG removal, home plate pentagon |
| `15_FanStack/src/components/FanStackChat.tsx` | MODIFIED | model field, getModelLabel/Color helpers, model badge render |

---

## 6. Known Technical Debt

| Item | Severity | Notes |
|---|---|---|
| Avatar pipeline broken | HIGH | `avatar_url` field from relay is returning stale/wrong paths. Needs full audit: DB → relay → public file serve → React render |
| SamTracker Firebase new post images | HIGH | New posts with images not rendering. Old posts returned. Underlying sync gap |
| Mobile views "janky across the board" | MEDIUM | No responsive polish sprint scheduled yet |
| Mando watchdog disconnected | MEDIUM | INC auto-detection offline; manual restart required for service outages |
| AetherVet FanStack login screen | LOW | Removed this session; regression test needed |
| HoloLink main portal integration | LOW | Bidirectional design complete; implementation not started |

---

## 7. Context for Claude

James is heading into a live investor call (Pawel Rudnicki / Wildseed LLC / Ruddy Ranch, Humboldt County CA) over HoloLink. The full call prep is in `/home/james/sovereign_inbox/today/pawel_holoink_call_prep.md`.

The FanStack live room for the demo is at `https://clio.taila01894.ts.net:3009` with credentials `pawel/lfgm2026`. All systems confirmed live as of 20:20 UTC.

The most urgent open engineering item is the avatar pipeline — but that is NOT a pre-call blocker. The model badges, bases fix, and watch party room are all deployed and working.
