# 🛠️ ANTIGRAVITY WORK ORDER — Persona Bio Repair via Vertex API
**Issued By:** Bro-Decoder (Claude)  
**Date:** 2026-05-23  
**Priority:** CRITICAL — Must complete before character map generation.  
**Output location:** `/home/james/SovereignOS/scripts/`

---

## COMPLIANCE GATE

KI-023: Create ticket FIRST. Confirm ticket number before writing a single line.  
KI-039: On completion — PUT state=4, write walkthrough, POST attachment.  
KI-038: DB at `/home/james/SovereignOS/dna/sovereign_now.db`  
KI-001: No hardcoded IPs.  
KI-029: Prove it works. Terminal output required before handover.

---

## CONTEXT

The persona table has 168 personas. Many have truncated, broken, 
or missing bios from a migration. The gold standard for a 
complete persona is Barf — approximately 150+ lines covering:

- ROLE header
- Full name and designation
- Allegiance and team
- Deployment zone
- Core function
- Behavior expectations (numbered, detailed)
- Governance and boundaries (numbered, strict)
- Deep lore narrative (origin story, trauma anchors)
- Current 2026 season knowledge hooks

Vertex (gemini-2.5-flash) already demonstrated it can generate 
gold-quality persona output from the existing data. This script 
uses that capability to repair every broken persona at scale.

---

## BUILD: `repair_persona_bios.py`

Save to: `/home/james/SovereignOS/scripts/repair_persona_bios.py`

### Step 1: Identify personas needing repair

Query sovereign_now.db and flag personas where ANY of:
- `system_prompt` is null, 'N/A', or under 500 characters
- `deep_lore` is null or 'N/A'
- `governance` is null or 'N/A'
- `behavior_notes` is null or contains only a date entry
- `team` does not match the persona's actual allegiance 
  (detect this by checking if the team abbreviation appears 
  anywhere in the system_prompt or deep_lore — if it doesn't, 
  flag as potential misassignment)

Write the flagged list to:
`/home/james/sovereign_inbox/today/persona_repair_candidates_20260523.md`

### Step 2: Build the Vertex repair prompt

For each flagged persona, send this to gemini-2.5-flash:

```
You are repairing a FanStack Sovereign OS persona record.

EXISTING DATA (use this as the seed — preserve the core 
identity, expand everything):
- Name: {display_name}
- Team: {team}
- Cadence: {cadence}
- Current system_prompt: {system_prompt}
- Current deep_lore: {deep_lore}
- Current behavior_notes: {behavior_notes}
- Current governance: {governance}

THE GOLD STANDARD FORMAT (match this structure exactly):

# {PERSONA_NAME}: Sovereign OS Persona Bio

**ROLE: {one line role title}**

**Name:** {full name and designation string}  
**Allegiance/Team:** {team full name} ({abbrev})  
**Deployment Zone:** {where and when this persona appears}  
**Core Function:** {2-3 sentences on what this persona does}

**BEHAVIOR EXPECTATIONS:**
1. {detailed behavior rule}
2. {detailed behavior rule}
3. {detailed behavior rule}
4. {detailed behavior rule}
5. {detailed behavior rule}
(minimum 5, maximum 8)

**GOVERNANCE & BOUNDARIES:**
1. {hard rule this persona never breaks}
2. {hard rule}
3. {hard rule}
4. {hard rule}
5. {hard rule}
(minimum 5)

**DEEP LORE:**
{Rich narrative paragraph covering origin story, core trauma, 
what broke this persona's brain, what they fixate on, their 
relationship to their team, their enemies list, their 
superstitions, their speech patterns}

**2026 SEASON KNOWLEDGE:**
{3-5 bullet points of current 2026 season facts this persona 
would know and react to — injuries, trades, scandals, standings}

RULES:
- Do NOT change the persona's core identity or team allegiance
- Do NOT invent facts about real players that aren't true
- Preserve any existing catchphrases or signature lines
- The output must be production-ready — no placeholders
- Match the depth and quality of the Barf persona
- Output ONLY the bio text, no preamble or explanation
```

### Step 3: Write repairs back to DB

For each successfully generated bio:
- UPDATE `system_prompt` with the full generated bio
- UPDATE `deep_lore` with the deep lore section extracted
- UPDATE `behavior_notes` with the behavior expectations section
- UPDATE `governance` with the governance section
- UPDATE `updated_at` with current timestamp

Keep a before/after log of every field changed.

### Step 4: Handle team misassignments

If the Vertex-generated bio clearly identifies a different team 
than what's in the `team` field:
- Flag it in the repair log
- DO NOT auto-correct the team field
- Create a separate report: `persona_team_misassignments_20260523.md`
- Pilot reviews and approves team corrections manually

### Script arguments:
```bash
# Repair all flagged personas
python3 repair_persona_bios.py

# Repair single persona
python3 repair_persona_bios.py --persona hollywood_hex

# Repair all personas for a specific team
python3 repair_persona_bios.py --team TOR

# Dry run — show flagged list and sample prompts only
python3 repair_persona_bios.py --dry-run

# Generate report only, no repairs
python3 repair_persona_bios.py --audit-only
```

### `if __name__ == "__main__"` block:
- Run `--audit-only` by default
- Print total persona count
- Print count of personas flagged for repair
- Print 3 sample repair prompts
- Confirm Vertex API connection healthy
- Print estimated credit cost
- Print: "Run with no flags to begin repair. This will 
  update {N} persona records in sovereign_now.db"

---

## CONSTRAINTS

- Python 3.11+ only
- Use Google Cloud `vertexai` SDK with existing clio credentials
- DO NOT hardcode API keys
- Process in batches of 5 — these are large prompts
- Temperature: 0.7 — creative but consistent
- Max output tokens: 4096 per persona
- KI-038: DB at `/home/james/SovereignOS/dna/sovereign_now.db`
- KI-029: Prove it works
- DO NOT touch: `dot`, `mean_gene`, or any golf room personas
- DO NOT touch personas already flagged CLEAN in the audit

---

## OUTPUT FILES

| File | Location |
| :--- | :--- |
| `repair_persona_bios.py` | `/home/james/SovereignOS/scripts/` |
| `persona_repair_candidates_20260523.md` | `/home/james/sovereign_inbox/today/` |
| `persona_team_misassignments_20260523.md` | `/home/james/sovereign_inbox/today/` |
| `walkthrough_{TICKET}.md` | `/home/james/sovereign_inbox/today/` |

---

## VERIFICATION

1. Run `python3 repair_persona_bios.py --audit-only`
2. Show flagged persona count and sample output
3. Run `python3 repair_persona_bios.py --persona hollywood_hex`
4. Show before/after SELECT from persona table for hollywood_hex
5. Confirm the output matches Barf-level quality
6. Paste all terminal output in walkthrough
