# 🛠️ ANTIGRAVITY WORK ORDER — Dynamic Context Budget Scoring Engine
**Issued By:** Bro-Decoder (Claude)  
**Date:** 2026-05-23  
**Priority:** HIGH — Critical cost optimization before full fleet scale.

---

## COMPLIANCE GATE

KI-023: Create ticket FIRST. Confirm ticket number before writing a single line.  
KI-039: On completion — PUT state=4, write walkthrough, POST attachment.  
KI-038: DB at `/home/james/SovereignOS/dna/sovereign_now.db`  
KI-029: Prove it works. Terminal output required before handover.

---

## CONTEXT

Persona bios are now 3,000-6,000+ characters after the repair run. 
Sending full bios on every API call will burn through Vertex credits 
at an unsustainable rate. We need a dynamic context budget that 
intelligently selects WHAT to send based on what's actually happening 
in the room at that moment.

The architecture is ServiceNow-style: a room record with related lists.
Each related list tab feeds a different bucket of context that gets 
sampled and injected into the persona prompt dynamically.

---

## PART 1: NEW DATABASE TABLE

### `room_lore_injections`

Create this table in sovereign_now.db:

```sql
CREATE TABLE IF NOT EXISTS room_lore_injections (
    sys_id          TEXT PRIMARY KEY,
    game_pk         TEXT NOT NULL,          -- Which room this belongs to
    injection_type  TEXT NOT NULL,          -- 'satirical', 'custom', 'breaking'
    headline        TEXT NOT NULL,          -- Short label (e.g. "Crow Fighting Ring")
    content         TEXT NOT NULL,          -- Full injection text
    weight          REAL DEFAULT 1.0,       -- Higher = more likely to be selected
    active          INTEGER DEFAULT 1,      -- 1=active, 0=disabled
    used_count      INTEGER DEFAULT 0,      -- How many times it's been sampled
    created_at      TEXT DEFAULT (datetime('now')),
    expires_at      TEXT                    -- Optional expiry
);
```

This is Tab 3 in the room's related list. The Pilot manually drops 
satirical and custom context injections here via the UI or API.

---

## PART 2: CONTEXT BUDGET SCORING FUNCTION

### Build `context_budget.py`
Save to: `/home/james/SovereignOS/scripts/context_budget.py`

### The Equation:

```
CONTEXT_BUDGET = BASE + (EVENT_WEIGHT × BOGGS) + SITUATION_BONUS + LORE_SAMPLE
```

### Scoring Variables:

**EVENT_WEIGHT** (what just happened):
```python
EVENT_WEIGHTS = {
    'routine_pitch':     0,
    'walk':              1,
    'strikeout':         1,
    'hit':               2,
    'double':            2,
    'triple':            3,
    'home_run':          4,
    'error':             3,
    'blown_save':        4,
    'pitch_clock_viol':  2,
    'delay_of_game':     2,
    'foul_ball':         0,
}
```

**SITUATION_BONUS** (game state):
```python
def situation_bonus(inning, score_diff, runners_on, is_rivalry):
    bonus = 0
    if inning >= 7:           bonus += 1   # Late innings matter more
    if inning >= 9:           bonus += 1   # Extra weight for 9th+
    if score_diff <= 1:       bonus += 2   # Close game = more tension
    if score_diff >= 5:       bonus -= 1   # Blowout = less tension
    if runners_on:            bonus += 1   # Baserunners = stakes
    if is_rivalry:            bonus += 1   # Rivalry game = elevated
    return max(0, bonus)
```

**BOGGS multiplier** — already exists as integer 1-5 in 
`cmdb_ci_fanstack_room.boggs_level`

### Context Selection Logic:

Based on the final budget score, select context tiers:

```python
BUDGET_TIERS = {
    'minimal':   (0, 3),    # BASE only — name, team, cadence, 1-line lore
    'standard':  (4, 7),    # BASE + relevant behavior_notes section
    'elevated':  (8, 11),   # BASE + behavior_notes + governance snippet
    'maximum':   (12, 99),  # BASE + behavior_notes + governance + deep_lore hook
}
```

### Lore Sampling (The Randomizer):

For each persona call, sample ONE item from each context bucket 
with weighted random selection:

```python
def sample_lore_context(game_pk, persona_team, budget_score):
    samples = {}
    
    # Tab 2: Environmental context (daily prep — newsletter, injuries, promos)
    # Weight by recency. Decay weight after used_count > 3 to prevent repetition
    env_item = weighted_random_sample(
        table='game_context',
        game_pk=game_pk,
        decay_after=3
    )
    if env_item:
        samples['environmental'] = env_item
    
    # Tab 3: Satirical/custom injections (Crow Fighting Ring etc)
    # Only sample if budget_score >= 6
    if budget_score >= 6:
        satirical_item = weighted_random_sample(
            table='room_lore_injections', 
            game_pk=game_pk,
            decay_after=5  # Can repeat more — they're evergreen
        )
        if satirical_item:
            samples['satirical'] = satirical_item
    
    # Tab 4: Cultural relics
    # Only sample if budget_score >= 8
    if budget_score >= 8:
        relic = weighted_random_sample(
            table='cultural_relics',
            decay_after=10
        )
        if relic:
            samples['relic'] = relic
    
    return samples
```

### Final Prompt Assembly:

```python
def build_context_payload(persona, game_state, lore_samples, tier):
    payload = []
    
    # Always-on BASE (never skip)
    payload.append(f"You are {persona.display_name}, a {persona.team} fan. {persona.deep_lore[:200]}")
    
    if tier in ['standard', 'elevated', 'maximum']:
        # Pull the RELEVANT section of behavior_notes based on event type
        relevant_section = extract_relevant_behavior(
            persona.behavior_notes, 
            game_state.event_type
        )
        if relevant_section:
            payload.append(relevant_section)
    
    if tier in ['elevated', 'maximum']:
        payload.append(persona.governance[:300])
    
    if tier == 'maximum':
        payload.append(persona.deep_lore[:500])
    
    # Inject lore samples
    for key, sample in lore_samples.items():
        payload.append(f"[ROOM CONTEXT] {sample['headline']}: {sample['content'][:200]}")
    
    # Boggs level instruction always appended last
    payload.append(BOGGS_PROMPTS[game_state.boggs_level])
    
    return '\n\n'.join(payload)
```

---

## PART 3: INTEGRATE INTO fanstack_chatbots.py

Replace the current static system_prompt injection with a call to 
`build_context_payload()` from `context_budget.py`.

The chatbot loop already has access to:
- Current game state (inning, score, event_type)
- Boggs level from `cmdb_ci_fanstack_room`
- Persona record

Wire them together through the scoring function.

---

## PART 4: API ENDPOINT FOR MANUAL INJECTIONS

Add a POST endpoint to the SDLC/Core API:

```
POST /api/rooms/{game_pk}/injections
{
    "injection_type": "satirical",
    "headline": "Pete Crow-Armstrong Crow Fighting Ring",
    "content": "Breaking: Cubs CF Pete Crow-Armstrong busted running an illegal crow fighting operation on the South Side of Chicago. Federal avian racketeering charges pending.",
    "weight": 2.0
}
```

This is how the Pilot drops custom context into a live room from 
the Play Call Desk without touching the DB directly.

---

## VERIFICATION

1. Run the scoring function with mock game state inputs
2. Print the full context payload for `barf` at each tier
3. Show character counts at each tier vs full bio
4. Confirm the randomizer doesn't repeat the same lore item 
   more than `decay_after` times
5. Show estimated token reduction vs sending full bio every call

Save all output to `/home/james/sovereign_inbox/today/`
