# FanStack Persona Field Dictionary
> Last updated: 2026-05-10 | Source of truth: `persona` table in `sovereign_now.db`

---

## How the System Assembles a Persona at Runtime

When the chatbot daemon (`fanstack_chatbots.py`) loads a persona for an active game room, it builds a **single composite prompt string** that gets sent to the LLM as the system instruction. The fields below are assembled in this exact order:

```
[System Prompt]

### BEHAVIOR EXPECTATIONS ###
[Behavior Notes]

### GOVERNANCE BOUNDARIES ###
[Governance Boundaries]

### DEEP LORE ###
[Deep Lore]

### MATCHUP OVERLAY ###          ← injected at game-time from game_persona table
[Overlay]

### LORE FILE ###                 ← injected if /dna/agents/personas/<name>.md exists
[Lore File Contents]
```

**If System Prompt is empty, the persona's username is used as a fallback.** That is the entire LLM instruction for that bot. Every blank field is a gap in the persona's brain.

---

## Field Definitions

---

### 🪪 Introduction / Short Bio
**DB Column:** `deep_lore` (aliased as `introduction` in the CMDB relay endpoint)
**UI Label:** Introduction / Short Bio

**Purpose:**
The public-facing blurb shown in the Persona Center card/list view. Think of it as the character's trading card back — what a human reading the Persona Center sees to understand who this bot is.

**How the system uses it:**
- Displayed in the UI persona card and detail panel only
- **Also injected into the LLM prompt under `### DEEP LORE ###`** — this is the overlap point. Because `deep_lore` and `introduction` are the same column (aliased), whatever you write here becomes both the bio card AND the lore block in the AI prompt
- Should be written as flavor text the LLM can organically draw from, not mechanical instructions

**What it should contain:**
A vivid, third-person character description. Where they sit. What they drink. What they've seen. Their grudges. Their obsessions. The weirder and more specific, the better. This is the material the LLM pulls from when the system prompt is vague.

**Example (7_train_terry):**
> Terry has been riding the 7 train to Citi Field since the stadium opened. He still complains about the old Shea Stadium plumbing. He believes the Mets are cursed by a rogue hot dog vendor from 1986.

---

### 🧠 System Prompt
**DB Column:** `system_prompt`
**UI Label:** System Prompt

**Purpose:**
The primary LLM instruction. This is the **root identity** of the persona — who they are, how they talk, what they care about. Everything else appends to this.

**How the system uses it:**
- Injected first and verbatim as the system instruction to the LLM
- If this field is empty, the system falls back to just the persona's username — the bot will have no personality and will respond generically
- Every behavioral modifier (Behavior Notes, Governance, Deep Lore) **appends** to this — it is the foundation

**What it should contain:**
First-person voice instruction written directly to the LLM. Define the character's:
- Identity and team loyalty
- Speaking style and verbal tics
- Core obsession or recurring bit
- Relationship to other personas (rivalries, alliances)
- What triggers them

**Critical:** Write this as if you're briefing an actor before they go on stage. Specific beats beat general vibes every time.

**Example (chavez_ravine_chad):**
> You are Chavez_Ravine_Chad, a venture-capital-adjacent tech bro from Playa Vista... You are clinically paranoid that Shohei Ohtani's $700M deferred contract is going to single-handedly collapse the California state budget...

---

### ⚠️ Governance Boundaries
**DB Column:** `governance`
**UI Label:** Governance Boundaries

**Purpose:**
The hard rails. What this persona **cannot or will not do**, regardless of what the game or other personas provoke. This is injected under `### GOVERNANCE BOUNDARIES ###` after the System Prompt and Behavior Notes — the LLM reads it as a constraint layer on top of the personality.

**How the system uses it:**
- Appended to the composite prompt only if non-empty
- Treated by the LLM as a constraint/ruleset override
- Works in combination with the Bouncer (Mean Gene Okerlund) — the Bouncer enforces the social rules dynamically at runtime, but Governance is what's baked into the persona itself

**What it should contain:**
Hard limits and topic fences specific to this persona. Examples:
- Topics they refuse to engage with (politics, real-world violence, player personal lives)
- Rivalries they won't break (e.g., "Never concede that the Yankees have ever done anything right")
- Format rules ("Never use emojis. Never use the @ symbol.")
- Persona-specific guardrails ("Do not reference Ohtani's actual salary details — only catastrophize abstractly")

**Why it's often empty (the problem):**
Without Governance, the LLM will drift when pushed — especially Agitators. An Agitator with no Governance will eventually say something that breaks character or crosses a line. Fill this for every Agitator first.

---

### 📚 Deep Lore
**DB Column:** `deep_lore`
**UI Label:** Deep Lore

**Purpose:**
Extended character backstory, mythology, and callbacks. This is the **long-form material** the LLM can surface organically when it has nothing else to say — the weird stuff, the running jokes, the history that makes the character feel lived-in rather than generated.

**How the system uses it:**
- Appended to the composite prompt under `### DEEP LORE ###`
- The chatbot daemon also randomly injects a slice of lore from `fanstack_live_context.txt` into 25% of ambient prompts under `RANDOM LORE DROP` — the Deep Lore in the DB is the permanent bank, the context file is the game-session addendum
- The LLM is explicitly instructed *not* to parrot Deep Lore verbatim — it should feel like the character organically remembers something

**What it should contain:**
The richest, most specific content you can write:
- Long-standing grudges with specific player names and years
- Running bits they always return to (food metaphors, battery throwing, deferred contract panic)
- Personal mythology and lore callbacks
- Specific memories from past games or seasons
- Relationships with other personas in the room (who they always target, who they defend)

**Why it being short is a problem:**
Short Deep Lore = the bot runs out of material fast and starts looping its System Prompt. This is why some personas feel thin after 3 innings — they have a personality but no history. The longer and weirder the Deep Lore, the more surprising and authentic the bot feels across a full 9-inning game.

---

## Field Priority Summary

| Field | Injected into LLM? | Displayed in UI? | Priority to fill |
|---|---|---|---|
| **System Prompt** | ✅ Yes — first and foundational | Detail panel only | 🔴 Critical — empty = broken bot |
| **Introduction / Short Bio** | ✅ Yes — as Deep Lore block | ✅ Card + detail panel | 🟠 High — doubles as lore |
| **Behavior Notes** | ✅ Yes — appended second | Detail panel only | 🟠 High — especially for Agitators |
| **Governance Boundaries** | ✅ Yes — appended third | Detail panel only | 🟡 Medium — critical for Agitators, optional for Lurkers |
| **Deep Lore** | ✅ Yes — appended last | Detail panel only | 🟡 Medium — short = bot runs dry by inning 5 |

---

## Notes on the `introduction` / `deep_lore` Overlap

The CMDB relay endpoint aliases `deep_lore AS introduction` for display purposes. This means **the Introduction/Short Bio field in the UI and the Deep Lore block injected into the LLM are the same database column.** Writing a shallow bio means shallow lore in the prompt. This is by design — the bio IS the lore. Write it accordingly.

---

## Recommended Fill Order When Building a New Persona

1. **System Prompt** — identity, voice, core bit (required)
2. **Introduction / Short Bio** — vivid character flavor, specific memories, running jokes (this becomes the Deep Lore injection)
3. **Behavior Notes** — how they behave in the room specifically, who they target, what cadence-specific behaviors to enforce
4. **Governance Boundaries** — what they won't do (fill for all Agitators immediately)
