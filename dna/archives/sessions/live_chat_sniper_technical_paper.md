# Live Chat Sniper — Technical Flow Paper
**Generated:** 2026-05-21  
**Author:** Antigravity (Sovereign OS AI Copilot)  
**Component:** `LiveChatSniper.tsx`  
**Purpose:** Document the full pipeline from comment selection → persona response → clipboard

---

## Overview

The Live Chat Sniper is a **fully client-side AI response generator**. It does not go through the FanStack relay or any Sovereign OS backend to generate responses. All inference calls are made directly from the browser to Google's Gemini REST API using a Vite environment key.

---

## Step-by-Step Flow

### Step 1 — YouTube Chat Ingest (WebSocket)

```
[YouTube Live Chat Tailing Daemon]
        ↓  (backend WebSocket broadcast)
[ws://localhost:8000/ws or wss://host/ws-relay]
        ↓  (CHAT_MSG type filter: target_game_pk === 'live_chat_sniper')
[LiveChatSniper.tsx message state]
        ↓  (renders as chat bubbles in right panel)
```

- Messages from YouTube viewers arrive via the WS relay as `YOUTUBE_CHAT` type events
- Only messages tagged `target_game_pk === 'live_chat_sniper'` are rendered
- Each message gets a `MessageSquare` button (non-persona messages only)

---

### Step 2 — Comment Selection (Target Lock)

User clicks the `MessageSquare` icon on any viewer message.

```tsx
onClick={() => setReplyTarget({ author: msg.author, text: msg.text })}
```

**What gets stored in `replyTarget`:**
| Field | Value | Notes |
|-------|-------|-------|
| `author` | `@thor9816` | Raw string from YouTube — MAY include leading `@` |
| `text` | `"Vientos is either good or very bad"` | Full message text |

A targeting panel appears above the input box showing all panelists.

---

### Step 3 — Persona Data Load (on mount, not on selection)

When the component mounts, it fetches all persona data from the backend:

```
GET /api/all_personas
        ↓
sovereign_now.db → persona table
SELECT id, user_name, team, deep_lore, system_prompt, behavior_notes, governance
        ↓
Stored in component state as:
personaData[user_name] = { system_prompt, deep_lore, behavior_notes }
```

> **Key fact:** This fetch happens ONCE on mount. If you update a persona record in the DB mid-session, the running component won't pick it up until you reload the page.

**As of 2026-05-21**, `behavior_notes` is now included in this map (was previously missing, causing Barf's 2026 knowledge update to be ignored).

---

### Step 4 — Persona Selection & Payload Build

User clicks one of the panelist avatar buttons.

#### System Prompt (Voice) Construction:

```
IF personaData[persona.name].system_prompt exists:

  voice = system_prompt
        + "\n\nDeep Lore: " + deep_lore
        + "\n\nCurrent Season Context (2026): " + behavior_notes   ← ADDED 5/21
        + "\n\nYou are responding in a LIVE YouTube chat..."
        + "Be specific — use 2026 Mets facts, real player names."
        + "NEVER use generic phrases like 'Mets gonna Met'."        ← ADDED 5/21
        + "Output ONLY the chat message, no quotes, no labels."

ELSE (fallback):

  voice = PERSONA_VOICES[persona.id]  ← hardcoded 1-sentence stub in component
```

#### User Prompt Construction:

```
prompt = `@thor9816 said in YouTube chat: "Vientos is either good or very bad"
[Additional context from input box if provided]

React to this comment in character. Output ONLY your chat response, nothing else.`
```

#### Final API Payload:

```json
{
  "systemInstruction": {
    "parts": [{ "text": "[full voice string above]" }]
  },
  "contents": [{
    "role": "user",
    "parts": [{ "text": "[prompt string above]" }]
  }],
  "generationConfig": { "temperature": 0.9 }
}
```

---

### Step 5 — API Call

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
     ?key=VITE_GEMINI_API_KEY
```

> **⚠️ IMPORTANT: This is NOT Vertex AI.**  
> This is the **Google AI Studio REST API** (`generativelanguage.googleapis.com`), authenticated via `VITE_GEMINI_API_KEY` (an API Studio key, not a Vertex service account).  
> The model is `gemini-3-flash-preview` — not `gemini-2.5-flash`, not the 3.5 Flash model discussed during Google I/O.

**Implication:** The Vertex API key you have in the backend (used by the FanStack relay / chatbot daemon) is **completely separate** from this call. These are two different auth paths hitting two different endpoints.

---

### Step 6 — Response Processing

```
response.candidates[0].content.parts[0].text  →  raw text from Gemini
        ↓
Strip any leading @ characters from model output
Strip any leading @ characters from replyTarget.author   ← fixes double-@@ bug
Prepend exactly one @: "@thor9816 [response text]"
        ↓
setShotModal({ persona: "Barf", text: finalText, loading: false })
```

Response is displayed in the **Shot Ready modal** for manual copy/paste.

> **WS broadcast removed as of 2026-05-21:** Previously, the response was also broadcast to the chat room via WebSocket, causing it to appear in the Live Streaming Chat panel. This was pointless since you still had to manually copy it to YouTube. Removed.

---

## Known Issues & Gaps (as of 2026-05-21)

| Issue | Severity | Status |
|-------|----------|--------|
| `behavior_notes` was not included in persona payload | HIGH | ✅ Fixed |
| WS broadcast echoed response into UI chat | MEDIUM | ✅ Fixed |
| Double `@@` in replies to YT usernames | HIGH | ✅ Fixed |
| Model is `gemini-3-flash-preview`, not 3.5 Flash | MEDIUM | Open |
| Persona data loaded once on mount — stale after DB updates | MEDIUM | Open — needs "Reload Personas" button or session refresh |
| `behavior_notes` > 3000 chars may inflate token cost | LOW | Monitor |
| No feedback if `VITE_GEMINI_API_KEY` is missing/invalid | MEDIUM | Shows "Error calling Gemini. Check API key." in modal |
| Repetitive responses ("Mets gonna Met") | HIGH | Partially fixed via anti-generic instruction — improvement expected |

---

## How to Actually Use Barf's 2026 Knowledge

After today's DB update, Barf's `behavior_notes` now contains:
- Soto's $765M contract tension
- 2026 injury report (Senga, Megill, Garrett, Núñez, Minter, Polanco, Soto's calf)
- The betrayals (Alonso to Baltimore, Nimmo to Texas, Díaz Dodger + cockfighting scandal + elbow)
- 2026 catchphrases
- Updated enemies list

**This data is now injected into every Barf API call** via the `behavior_notes` field in the system prompt.

**To verify it's working:** Select a comment referencing Soto, Alonso, Nimmo, or Díaz and fire Barf. He should respond with 2026-specific facts rather than generic Mets pessimism.

---

## What Would Fix "Vertex" Routing

If you want sniper responses to use the **Vertex AI endpoint** (same as the backend relay):

1. Route the call through the backend instead of making it client-side
2. Add a new endpoint: `POST /api/snipe/generate` that accepts `{persona, author, text, context}`
3. Backend uses the Vertex credentials already configured in `fanstack_relay.py`
4. Returns the generated text to the frontend
5. Frontend shows it in the Shot Ready modal

This would also fix the "persona data stale after DB update" problem since the backend always reads fresh from the DB per call.
