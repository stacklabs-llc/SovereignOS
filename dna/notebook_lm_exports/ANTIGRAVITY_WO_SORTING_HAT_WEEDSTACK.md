# ANTIGRAVITY WORK ORDER
## Mission: Sorting Hat — Add WeedStack Domain + Future Stack Protocol
**Date:** May 27, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟡 P3 — Platform Infrastructure
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** Add WeedStack as a first-class domain in the Sorting Hat classification engine. Establish the protocol for onboarding future stack domains so every new cartridge gets its own isolated cognitive namespace in NotebookLM automatically.

---

## THE LAW

> Every brand cartridge gets its own cognitive namespace.
> WildSeed personas must never bleed into Barf.
> Barf must never bleed into compliance documentation.
> The Sorting Hat enforces this at the file level, automatically.

---

## PHASE 1 — ADD WEEDSTACK DOMAIN TO `sync_to_gdrive.sh`

File: `/home/james/SovereignOS/scripts/sync_to_gdrive.sh`

Find the `get_domains()` Python function inside the script.
Add the WeedStack domain block **before** the catch-all SovereignOS block:

```python
# 5. WeedStack / WildSeed Manufacturing & Brand
if any(k in filename for k in [
    "weedstack", "wildseed", "weed_stack", "wild_seed",
    "gardenstack", "garden_stack", "bt4991", "bt5002", "bt5003"
]) or any(k in content_lower for k in [
    "weedstack", "wildseed", "wild seed", "type 6",
    "cannabis manufacturing", "compliance karen", "dr. terp", "dr_terp",
    "terp truther", "couch lock carl", "dispensary gary", "420 linda",
    "old growth pete", "dab lab derek", "bt4991", "bt4991 believer",
    "weedstack_sim", "wildseed_sim", "michael at wildseed",
    "cannabis compliance", "metrc", "certificate of analysis",
    "ws_batch", "ws_product", "ws_coa", "ws_inventory"
]):
    domains.append("WeedStack")
```

Also update the GardenStack domain block to exclude WeedStack content
now that WeedStack has its own namespace — add a negative check:

```python
# 3. GardenStack (cultivation only — not WeedStack manufacturing)
if any(k in filename for k in ["garden", "greenhouse", "botany"]) or \
   any(k in content_lower for k in [
       "gardenstack", "greenhouse", "chlorophyll",
       "pixel degradation", "botany"
   ]):
    # Only classify as GardenStack if not already WeedStack
    if "WeedStack" not in domains:
        domains.append("GardenStack")
```

---

## PHASE 2 — CREATE WEEDSTACK NOTEBOOKLM SYNC BUCKET

The rclone sync pushes sorted buckets to:
`sovereign_os:SovereignOS/NotebookLM_Sync/`

Verify the WeedStack bucket directory exists on Google Drive:

```bash
rclone mkdir "sovereign_os:SovereignOS/NotebookLM_Sync/WeedStack"
rclone lsd "sovereign_os:SovereignOS/NotebookLM_Sync/"
# Expected: WeedStack/ appears alongside CatnipWars/, AetherVet/, etc.
```

---

## PHASE 3 — FUTURE STACK ONBOARDING PROTOCOL

When a new brand cartridge comes online, adding it to the Sorting Hat
requires exactly one step: add a domain block to `get_domains()`.

**Template for any new stack:**

```python
# N. [StackName] — [brief description]
if any(k in filename for k in [
    "[stack_keyword_1]", "[stack_keyword_2]"
]) or any(k in content_lower for k in [
    "[brand_keyword_1]", "[brand_keyword_2]",
    "[persona_name_1]", "[persona_name_2]",
    "[db_table_prefix]"
]):
    domains.append("[StackName]")
```

**Current domain registry — update this comment block at the top of
`get_domains()` every time a new stack is added:**

```python
# ═══════════════════════════════════════════════════════════
# SOVEREIGN OS SORTING HAT — DOMAIN REGISTRY
# Last updated: 2026-05-27
#
# 1. CatnipWars   — RPG sandbox, yardmap, emergent narrative
# 2. AetherVet    — Sam telemetry, feline health, vet portal
# 3. GardenStack  — Cultivation, greenhouse, grow ops (NOT manufacturing)
# 4. FanStack     — MLB personas, MARD relay, Barf, sports telemetry
# 5. WeedStack    — WildSeed brand, cannabis manufacturing, Type 6 ops
# 6. SovereignOS  — Core DNA, CMDB, SDLC, pilot bio, wall of shame
#
# TO ADD A NEW STACK:
# 1. Add a domain block above the SovereignOS catch-all
# 2. Add an rclone mkdir for the new bucket on Google Drive
# 3. Update this registry comment
# 4. Run sync_to_gdrive.sh and verify files land in the new bucket
# ═══════════════════════════════════════════════════════════
```

---

## PHASE 4 — SEED INITIAL WEEDSTACK FILES INTO SYNC STAGING

After updating the script, run the sync to classify and push all
existing WeedStack documents to the new bucket:

```bash
bash /home/james/SovereignOS/scripts/sync_to_gdrive.sh
```

Then verify WeedStack files landed correctly:

```bash
rclone ls "sovereign_os:SovereignOS/NotebookLM_Sync/WeedStack/"
```

Expected files in the WeedStack bucket after first sync:
- `ANTIGRAVITY_WO_WILDSEED_MFG_OS.md.txt`
- `ANTIGRAVITY_WO_WEEDSTACK_PERSONAS.md.txt`
- `ANTIGRAVITY_WO_PERSONA_CENTER_WILDSEED_SCOPE.md.txt`
- Any session reports referencing WildSeed or WeedStack
- Any walkthrough files for WeedStack tickets

---

## VERIFY

```bash
# 1. Dry run — confirm classification is correct before pushing
python3 << 'EOF'
import os, sys
sys.path.insert(0, '/home/james/SovereignOS/scripts')

# Paste get_domains() function here and test
test_cases = [
    ("ANTIGRAVITY_WO_WEEDSTACK_PERSONAS.md", "dr_terp compliance_karen bt4991"),
    ("pawel_handover.md", "wildseed type 6 cannabis manufacturing"),
    ("walkthrough_STRY1779936909.md", "ws_batch ws_coa metrc wildseed"),
    ("barf_onboarding.md", "mets fanstack scruffy barf"),
    ("catnip_wars_splash.md", "catnip wars yardmap rpg"),
]
for fname, content in test_cases:
    result = get_domains(fname, content)
    print(f"{fname[:45]:<45} → {result}")
EOF

# 2. Confirm WeedStack bucket exists on Drive
rclone lsd "sovereign_os:SovereignOS/NotebookLM_Sync/"

# 3. Confirm no cross-contamination — Barf should NOT be in WeedStack
rclone ls "sovereign_os:SovereignOS/NotebookLM_Sync/WeedStack/" | grep -i barf
# Expected: no output

# 4. Confirm WeedStack personas ARE in WeedStack
rclone ls "sovereign_os:SovereignOS/NotebookLM_Sync/WeedStack/" | grep -i persona
# Expected: WeedStack persona files present
```

---

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*Each brand gets its own cognitive namespace. Barf never bleeds into compliance docs.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 27, 2026*
