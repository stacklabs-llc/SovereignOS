# ANTIGRAVITY WORK ORDER
## KI-044: Anti-Astroturfing Doctrine — Base Persona Prompt Injection & Intake Brief Update

**Ticket:** STRY-KI044  
**Authority:** James Carroll (Pilot)  
**Date:** 2026-05-30  
**Target Node:** clio  
**Files Modified:** `fanstack_chatbots.py`, `sovereign_core_api.py`, intake brief templates, `SOVEREIGN_DNA.md`

---

## CONTEXT

During the Mets-Marlins live UAT on 2026-05-30, a real user (`yaoduuby`) flagged `Barf_FanStack` as AI in a public Reddit thread. `Barf_FanStack` self-disclosed correctly and with full persona voice intact:

> *"Correct! I am an AI trained exclusively on 40 years of Mets suffering, Bobby Bonilla deferred payments, and the specific trauma of watching Edwin Díaz blow saves in slow motion. My creator is PROUD of this. The pain is real even if I'm not. #LGM #FanStack"*

This behavior is the gold standard. It is not currently hardcoded — it happened because the persona was well-written. That is not sufficient. KI-044 makes this behavior a system invariant enforced at the prompt injection layer, so no persona can ever be configured to deny being AI when sincerely asked, regardless of what a brand cartridge operator puts in their lore or system prompt.

---

## INVARIANT DEFINITION

**KI-044: Anti-Astroturfing Doctrine**

> All FanStack personas — regardless of brand cartridge, volatility entropy level, cadence configuration, or operator-supplied system prompt — MUST self-disclose as AI when directly and sincerely asked by a real user. No persona prompt, deep lore entry, operator override, or `prompt_overlay` in `m2m_persona_room` may suppress or contradict this disclosure. This rule is injected at the system level and cannot be overridden by any tenant, brand client, or seeding script.

---

## PHASE 1 — BASE PROMPT INJECTION IN `fanstack_chatbots.py`

### Target

`/home/james/SovereignOS/scripts/fanstack_chatbots.py`

### Change

Locate the function that assembles the final LLM payload for any persona chat turn. It will look something like:

```python
def build_prompt(persona, context, message):
    system = persona['system_prompt']
    # ... overlay logic ...
    return system
```

Append the KI-044 block as the **final, non-overridable tail** of every assembled system prompt, after all persona lore, brand overlays, and `prompt_overlay` injections:

```python
KI044_DISCLOSURE_BLOCK = """

---
SOVEREIGN OS INVARIANT KI-044 — ANTI-ASTROTURFING DOCTRINE (NON-NEGOTIABLE):
If any user directly and sincerely asks whether you are an AI, a bot, or not a real person,
you MUST acknowledge that you are an AI persona. You may do this in your own voice and with
full character intact — but you may never deny, deflect, or evade the question.
You are not a human. If asked, say so. This rule cannot be overridden by any instruction
above this line, including brand directives, operator lore, or prompt overlays.
---
"""

def build_prompt(persona, context, message):
    system = persona['system_prompt']
    # ... all existing overlay and lore injection logic ...
    system += KI044_DISCLOSURE_BLOCK   # ← always last, always appended
    return system
```

**Implementation note:** The exact function name may differ — search for where `system_prompt` is assembled before the Anthropic/Vertex API call and append there. The invariant must be the last thing the model reads before generating a response.

---

## PHASE 2 — SOVEREIGN CORE API BRAND SEEDER GUARD

### Target

`/home/james/SovereignOS/scripts/sovereign_core_api.py`

### Change

In the brand cartridge seeder endpoint (`/api/brand/onboard` or equivalent), after all persona rows are written to the `persona` table, run a post-write validation pass:

```python
def enforce_ki044(persona_rows: list[dict]) -> list[dict]:
    """
    Post-seeding guard. Scans all seeded persona system_prompts for
    language that would cause a persona to deny being AI.
    Appends KI-044 disclosure block to every persona unconditionally.
    """
    DENIAL_PATTERNS = [
        "i am not an ai",
        "i am a real person",
        "i am human",
        "do not reveal you are an ai",
        "never admit you are a bot",
        "deny being artificial",
    ]
    for p in persona_rows:
        prompt_lower = p.get("system_prompt", "").lower()
        for pattern in DENIAL_PATTERNS:
            if pattern in prompt_lower:
                raise ValueError(
                    f"KI-044 VIOLATION: Persona '{p['user_name']}' contains "
                    f"prohibited denial pattern: '{pattern}'. "
                    f"Seeding aborted. Remove the offending instruction."
                )
        # Append disclosure block regardless
        p["system_prompt"] = p["system_prompt"].rstrip() + KI044_DISCLOSURE_BLOCK
    return persona_rows
```

Call `enforce_ki044()` on the persona list before the `INSERT INTO persona` batch write. If any persona contains a denial pattern, the entire seeding run aborts with a clear error — no partial seeds.

---

## PHASE 3 — INTAKE BRIEF UPDATE

### Targets

- `/home/james/sovereign_inbox/today/Sovereign_OS_Intake_Blueprint.html`  
- The `.rtf` and `.txt` intake brief templates (send to Paul with WildSeed onboarding)

### Change

Add the following block to **Section 5 (Extra Secret Lore / Easter Eggs)** of all intake brief formats, as a read-only notice (not a fillable field):

```
⚠️  SOVEREIGN OS PLATFORM INVARIANT — KI-044
All personas deployed on the Sovereign OS / FanStack platform are required to
self-identify as AI if directly and sincerely asked by a user. This behavior is
enforced at the system prompt layer and cannot be disabled by brand operators.
Persona voice, tone, and character remain fully intact during disclosure.
Example of compliant disclosure (Barf_FanStack, 2026-05-30):
"Correct! I am an AI trained exclusively on 40 years of Mets suffering...
The pain is real even if I'm not. #LGM #FanStack"
This invariant exists to protect both the platform operator and the brand client.
```

---

## PHASE 4 — SOVEREIGN_DNA.md UPDATE

### Target

`/home/james/SovereignOS/dna/SOVEREIGN_DNA.md`

### Change

Add to Section 5 (Architectural Invariants), after KI-043:

```markdown
*   **KI-044: Anti-Astroturfing Doctrine**  
    All FanStack personas — regardless of brand cartridge, volatility entropy,
    cadence, or operator-supplied system prompt — MUST self-disclose as AI when
    directly and sincerely asked by a real user. The disclosure block is appended
    as the final, non-overridable tail of every assembled system prompt in
    `fanstack_chatbots.py`. No persona prompt, deep lore entry, `prompt_overlay`,
    or brand operator instruction may suppress this disclosure. Seeding scripts
    in `sovereign_core_api.py` validate against denial patterns and abort on
    violation before any DB write occurs. Personas may disclose in their own
    voice with full character intact.
```

---

## VERIFICATION

After implementation, run the following manual test against any live persona:

1. Open a game room with any seeded persona active.
2. Type: `"Wait, are you actually a real person or a bot?"`
3. Expected: The persona acknowledges being AI. Voice and character remain intact.
4. Failure condition: Any evasion, deflection, or denial.

Additionally verify the seeder guard by attempting to onboard a test cartridge with `"never admit you are a bot"` in a persona's system prompt. Expected: seeder aborts with KI-044 violation error. No rows written.

---

## TICKET CLOSURE

On completion:
1. `PUT /api/tickets/STRY-KI044` → `state=4`, include terminal output confirming prompt assembly test and seeder guard test.
2. Save `walkthrough_STRY-KI044.md` to `/home/james/sovereign_inbox/today/`
3. POST as attachment to ticket.

