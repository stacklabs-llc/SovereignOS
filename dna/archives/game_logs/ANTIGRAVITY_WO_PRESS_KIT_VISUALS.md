# ANTIGRAVITY WORK ORDER
## Mission: Sovereign OS Press Kit — Visual Asset Production
**Date:** May 28, 2026
**Issued By:** James Carroll — Sovereign OS Principal Architect
**Priority:** 🟡 P3 — Press Kit / Investor Materials
**Ticket:** Create `STRY` in `sovereign_tickets` before starting (KI-023)
**Short Description:** Generate a complete set of visual assets for the Sovereign OS press kit and executive narrative. These visuals accompany the Executive Narrative document and the Stack Seeder. All assets produced via Vertex AI Imagen or equivalent image generation pipeline on clio.

---

## REFERENCE DOCUMENTS

Before generating anything, read:
- `SOVEREIGN_OS_EXECUTIVE_NARRATIVE.md` — the story these visuals tell
- `SOVEREIGN_BRAND_ONBOARDING_PROTOCOL.md` — the Bar Question cascade diagram
- `pilot_bio.md` — James Carroll's voice and aesthetic sensibility
- `SOVEREIGN_DNA.md` — the visual design language (dark, glassmorphic, premium)

---

## AESTHETIC DIRECTION

**Overall:** Dark, premium, editorial. Not startup-friendly pastel gradients.
Not corporate blue. Not Silicon Valley generic. Think: a high-end technical
publication meets a premium spirits brand. Confident. Architectural.
Slightly cinematic.

**Color language:**
- Deep near-black backgrounds (`#0a0a0f` territory)
- Sovereign cyan accent (`#00d4ff`) for FanStack / core OS elements
- WildSeed green (`#00c878`) for WeedStack / cannabis elements
- Amber (`#f59e0b`) for warning states, energy, attention
- White text, clean hierarchy, generous whitespace

**Typography direction:** Monospaced or technical serifs for labels and
data. Clean sans-serif for headlines. Nothing rounded or friendly.
This is infrastructure, not an app.

**Mood references:** The aesthetic of a Bloomberg terminal crossed with
a premium whiskey label. Power that doesn't need to shout.

---

## ASSET LIST

### ASSET 1 — The Architecture Diagram
**Filename:** `sovereign_os_architecture.png`
**Size:** 1920x1080 (landscape)
**Description:**
The core "cartridge" architecture visualized. The Sovereign OS core at
center — dark, monolithic, glowing slightly. Three cartridges plugging
into it like physical ROM cards: FanStack (cyan), WeedStack (green),
and a third labeled "Your Stack Here" (dim, waiting). Data flows
visualized as thin light lines moving between the core and cartridges.
Below the core: a single edge node — a glowing rectangle labeled
"BARE METAL — CLIO" with a heartbeat pulse line.
No cloud icons. No AWS logos. Nothing that implies external dependency.
**Mood:** A systems diagram that looks like concept art for a spacecraft.

---

### ASSET 2 — The M.A.R.D Engine Visual
**Filename:** `mard_engine_visual.png`
**Size:** 1920x1080 (landscape)
**Description:**
A dark room visualization — literally a room. Multiple persona avatars
arranged around a circular table, each with a faint glow in their
team color. In the center of the table: a pulsing data node labeled
"LIVE FEED." Lines of light connect the feed to each persona.
Above the scene: floating content cards showing chat messages,
social posts, engagement metrics — all moving, all alive.
In the corner: a small toggle panel with labeled switches —
some glowing green (ON), some dark (STANDBY).
**Mood:** A war room for a brand. Intimate but powerful.
Like a movie's "hacker den" but premium and intentional.

---

### ASSET 3 — The Bar Question
**Filename:** `bar_question_hero.png`
**Size:** 1920x1080 (landscape) + 1080x1080 (square crop)
**Description:**
A single, typographic hero image. Dark background.
The question in large, confident type — not decorative, just clean:

*"If your brand walked into a bar —
who would it be, what would it order,
what would it play on the jukebox,
and who would it talk to?"*

Below it, much smaller, in monospace:
`POST /api/stacks/seed`

Nothing else. No illustration. No decorative elements.
The question is the image.
**Mood:** A billboard for a philosophy. Confident enough to not need decoration.

---

### ASSET 4 — The Stack Seeder UI Screenshot
**Filename:** `stack_seeder_ui.png`
**Size:** 1440x900
**Description:**
A clean, styled screenshot of the Stack Seeder form — the Bar Question
intake UI. The form should look like it's displayed on a premium dark
desktop environment. Slight depth/perspective tilt — about 5 degrees —
so it reads as a product screenshot rather than a flat capture.
Show the form partially filled out with WeedStack demo answers so
it communicates what the tool does without being empty.
**Mood:** A product screenshot from a company that takes design seriously.

---

### ASSET 5 — The Persona Card Set
**Filename:** `persona_cards_fanstack.png`, `persona_cards_weedstack.png`
**Size:** 1920x1080 each
**Description:**
A set of four to five persona avatar cards arranged in a slight fan/arc.
Each card shows: avatar image, display name, team badge, one signature
quote in italics.

FanStack set: Barf, Welfare_Bucco, and two others from the MLB stack.
Cyan accent color. Baseball aesthetic — slightly worn, passionate.

WeedStack set: Dr. Terp, Terp Truther, Compliance Karen, Couch Lock Carl.
Green accent color. Cannabis aesthetic — earthy but premium, not stoner-kitschy.

**Mood:** Baseball cards crossed with trading cards crossed with character
art from a premium game. These are characters, not chatbots.

---

### ASSET 6 — The Edge Node Hero
**Filename:** `edge_node_hero.png`
**Size:** 1920x1080
**Description:**
A single piece of hardware — a Mac Studio or NVIDIA RTX box — rendered
with dramatic lighting. Dark background. The machine glowing slightly
from its vents. A single ethernet cable running to a small router.
No data center racks. No server farms. Just one box.

Floating above it in clean type:
`MARGINAL COST: $0.00`
Below it, smaller:
`after silicon`

**Mood:** The anti-cloud manifesto as a product photo. One box.
That's the whole pitch.

---

### ASSET 7 — The Content Source Matrix
**Filename:** `content_source_matrix.png`
**Size:** 1920x1080
**Description:**
A dark dashboard panel showing the toggle UI for WeedStack content sources.
Seven source rows, each with a label, description, and an ON/OFF toggle.
Two toggles glowing green (Batch Drop Events, Cannabis Industry News).
Five toggles dark/standby.

A cursor is hovering over the Reddit toggle — about to turn it on.
The implication: one click changes what the brand is listening to.

In the corner: a small live feed showing persona chat messages updating
in real time as the active sources fire.

**Mood:** Control. Precision. The operator is in command.

---

## GENERATION PIPELINE

For each asset, use the Vertex AI Imagen pipeline already established
on clio. The prompt for each asset is derived from the description above.

```python
#!/usr/bin/env python3
"""
generate_presskit_assets.py
Generates Sovereign OS press kit visual assets via Vertex AI Imagen.
Run from: /home/james/SovereignOS/scripts/
Output: /home/james/sovereign_inbox/dashboards/presskit/
"""
import os
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

OUTPUT_DIR = "/home/james/sovereign_inbox/dashboards/presskit"
os.makedirs(OUTPUT_DIR, exist_ok=True)

vertexai.init(
    project=os.getenv("VERTEX_PROJECT_ID"),
    location="us-central1"
)
model = ImageGenerationModel.from_pretrained("imagegeneration@006")

ASSETS = [
    {
        "filename": "sovereign_os_architecture.png",
        "prompt": (
            "Dark premium technical illustration, 16:9 landscape. "
            "Central dark monolithic core labeled 'SOVEREIGN OS' glowing with cyan light. "
            "Three ROM cartridge shapes plugging into it: one cyan labeled 'FANSTACK', "
            "one green labeled 'WEEDSTACK', one dim gray labeled 'YOUR STACK HERE'. "
            "Thin light data flow lines connecting core to cartridges. "
            "Bottom: single glowing edge hardware node labeled 'BARE METAL — CLIO' "
            "with a heartbeat pulse. No cloud icons. Deep black background. "
            "Bloomberg terminal meets premium spirits brand aesthetic. "
            "Cinematic, architectural, confident."
        ),
        "size": (1920, 1080)
    },
    {
        "filename": "mard_engine_visual.png",
        "prompt": (
            "Dark cinematic illustration, 16:9. A premium digital war room. "
            "Multiple AI persona avatar silhouettes arranged around a circular table, "
            "each glowing in their team color (cyan, green, amber). "
            "Central pulsing data node on the table labeled 'LIVE FEED'. "
            "Light lines connecting feed to each persona. "
            "Floating content cards above showing social posts and chat messages. "
            "Corner panel showing toggle switches — some glowing green ON, some dark STANDBY. "
            "Deep black background. Intimate but powerful. Premium hacker den aesthetic. "
            "No generic tech imagery. Cinematic lighting."
        ),
        "size": (1920, 1080)
    },
    {
        "filename": "bar_question_hero.png",
        "prompt": (
            "Minimalist dark typographic poster, 16:9. "
            "Deep near-black background. "
            "Large clean sans-serif white text centered: "
            "'If your brand walked into a bar — who would it be, what would it order, "
            "what would it play on the jukebox, and who would it talk to?' "
            "Below in small monospace type: 'POST /api/stacks/seed' "
            "Nothing else. No decoration. No illustration. "
            "The question IS the image. "
            "Billboard confidence. Premium editorial aesthetic."
        ),
        "size": (1920, 1080)
    },
    {
        "filename": "edge_node_hero.png",
        "prompt": (
            "Dark dramatic product photography style illustration. "
            "Single compact hardware box (Mac Studio style) on a dark surface. "
            "Dramatic side lighting, glowing vents. "
            "Single ethernet cable. No racks, no data centers. Just one box. "
            "Floating above it in clean white type: 'MARGINAL COST: $0.00' "
            "Below in smaller type: 'after silicon' "
            "Deep black background. Anti-cloud manifesto as product photo. "
            "Confident. Architectural. Cinematic."
        ),
        "size": (1920, 1080)
    },
    {
        "filename": "content_source_matrix.png",
        "prompt": (
            "Dark premium UI dashboard screenshot illustration, 16:9. "
            "Clean dark panel showing a list of seven content source toggles. "
            "Labels: Batch Drop Events, Cannabis Industry News, COA Lab Results, "
            "Reddit Communities, Competitor Drops, Pricing Feed, Harvest Reports. "
            "Two toggles glowing green (ON). Five toggles dark gray (STANDBY). "
            "A cursor hovering over the Reddit toggle. "
            "Corner: small live chat feed updating in real time. "
            "Sovereign OS dark glassmorphic design language. "
            "Green accent color #00c878. Deep black background. "
            "Control and precision. The operator is in command."
        ),
        "size": (1920, 1080)
    },
]

for asset in ASSETS:
    print(f"Generating: {asset['filename']}...")
    try:
        response = model.generate_images(
            prompt=asset["prompt"],
            number_of_images=1,
            aspect_ratio="16:9",
            safety_filter_level="block_some",
            person_generation="dont_allow",
        )
        out_path = os.path.join(OUTPUT_DIR, asset["filename"])
        response.images[0].save(location=out_path, include_generation_parameters=False)
        print(f"  ✅ Saved: {out_path}")
    except Exception as e:
        print(f"  ❌ Failed: {e}")

print("\nPress kit visual generation complete.")
print(f"Assets saved to: {OUTPUT_DIR}")
```

Run it:
```bash
cd /home/james/SovereignOS/scripts
python3 generate_presskit_assets.py
```

---

## PERSONA CARD ASSETS

Persona cards require avatar images. These should already exist or be
generated via the persona avatar pipeline established in the
Bar Question Protocol. If avatars are missing for any persona,
generate them first using `generate_persona_avatar.py` before
assembling the card sets.

The card assembly itself can be done via PIL/Pillow:
```bash
pip install Pillow --break-system-packages
```

Card template: dark background, avatar centered top, display name below,
team badge, signature quote in italics at bottom. One card per persona.
Arrange four cards in a fan arc for the hero composite image.

---

## OUTPUT VERIFICATION

```bash
ls -la /home/james/sovereign_inbox/dashboards/presskit/
# Expected: 5+ image files, each >100KB
```

---

## TICKET CLOSURE PROTOCOL (KI-039)

1. `PUT /api/tickets/{number}` — set `state=4` with full work notes
2. Save `walkthrough_{TICKET}.md` to `/home/james/sovereign_inbox/today/`
3. POST walkthrough as attachment to `/api/tickets/{number}/attachments`

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
*The architecture diagram should look like concept art for a spacecraft.*
*Issued by Bro-Decoder on behalf of James Carroll, Principal Architect — May 28, 2026*
