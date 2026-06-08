# Sovereign OS Service Catalog: Persona Forge Integration Guide
**Product Module:** `fanstack_onboarding`  
**Tool Name:** `persona_forge.py` (Production-ready script)  
**Deployment Date:** May 24, 2026 (Shipping after over 30 days of backlog priority!)  

---

## 🎨 The Serendipitous Origin Story
For over a month, the Sovereign FanStack ecosystem lacked an automated pipeline for generating multi-pose persona image maps and profile avatars. The process remained a bottleneck—requiring manual prompt construction, visual grid cropping, and directory staging.

On **May 24, 2026**, this month-long backlog item was solved **serendipitously** because of the Sandbox RPG Map project. The dynamic sprite parsing engine built for Sam, Metsy, and Stumpy was elevated into the production repository to form the new unified **`persona_forge.py`** pipeline!

---

## 🚀 Dynamic CLI Usage
The script is housed under `/home/james/SovereignOS/scripts/persona_forge.py` and is marked executable.

### Core Command
```bash
python3 scripts/persona_forge.py <onboarding_blueprint.md> [--style custom]
```

### Flow of Execution
1. **Dynamic File Ingestion:** Reads the onboarding blueprint markdown sheet generated daily by the MLB news ingestion scraper.
2. **Name Derivation:** Automatically extracts the persona's slug/handle from the filename (e.g. `RiggedLeagueRant_onboarding.md` $\rightarrow$ `riggedleaguerant`).
3. **Regex Extraction:** Pulls the character lore from `# Character Lore` or `## 📖 Deep Lore` to form the core generative prompt.
4. **Action Parsing:** Automatically parses custom poses from `# Poses` (falling back to standard headshot/pointing/shrug profiles if no poses are specified).
5. **Asset Folder Creation:** Instantiates `/15_FanStack/public/avatars/{persona_slug}/` dynamically.
6. **Vertex AI Generation:** Hits the GCP Vertex AI link (Imagen 3.0) and generates the corresponding image assets.

---

## 🛡️ Style Gating: Wicked Smaht vs. A-List Tiers

To keep normal chats highly consistent while allowing celebrity characters to stand out as unique masterpieces, the forge enforces two dynamic tiers:

### 1. Standard Tier (Pacers / Lurkers)
By default, the script appends your **Wicked Smaht** golden style recipe:
> *"Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout."*
This guarantees that all secondary baseball fans share a pristine, unified visual aesthetic that integrates seamlessly with your chatroom visualizer.

### 2. A-List Tier (High-Profile Celebrity Override)
If the onboarding blueprint contains a `# Style Profile` section specifying `Tier: A-List` (or you run the CLI with the `--style custom` flag), the script overrides the standard layout and applies your custom artistic prompt (e.g. 16-bit retro, Synthwave Chic, or vintage hand-drawn caricature). 
*This is perfect for A-Listers like Barf, Dot, and BatteryChucker.*

---

## 📥 Onboarding Integration (The Service Catalog Handoff)

We have officially integrated this script into Phase 1 of `/home/james/SovereignOS/.agents/workflows/persona_onboarding.md`:

```markdown
## 🛠️ Phase 1: Asset Provisioning (The Character Map)
Before any accounts are created, the persona's visual identity must be locked.

### Automated Persona Forge Pipeline
1. **Create Character Sheet:** Stage the blueprint sheet under `/home/james/SovereignOS/dna/[handle]_sheet.md`.
2. **Execute Onboarding Forge:** Run the production script:
   ```bash
   python3 scripts/persona_forge.py dna/[handle]_sheet.md
   ```
3. **Ingest Assets:** The script dynamically writes all expressive poses directly into FanStack's public asset path under `/15_FanStack/public/avatars/[handle]/`!
```

*"The failures are the content. The pipeline is the machine."*
