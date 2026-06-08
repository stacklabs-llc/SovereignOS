# 🎨 FANSTACK CHARACTER ART PROTOCOL
**Status:** MANDATED  
**Last Updated:** April 16, 2026  
**Rule:** Every persona deployed to `m2m_persona_room` MUST have a character art file in `/dna/media/avatars/` BEFORE going live. No exceptions.

---

## 🖼️ I. THE FLOW PROMPT FORMAT (CANONICAL — DO NOT DEVIATE)

All FanStack persona character maps are generated using **Google Flow** with the following mandatory prompt structure. This format was established through real output iteration and produces the exact Twitch-emote-quality character reference sheets used in the system.

### Template:
```
Character reference sheet, model sheet, concept art. Multiple angles and expressions of [CHARACTER DESCRIPTION]. [VISUAL PROP DETAILS]. Front view, side view, and [EXPRESSION/POSE VIEWS]. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout.
```

### Breakdown of each component:
| Component | Purpose | Example |
|---|---|---|
| `Character reference sheet, model sheet, concept art.` | **ALWAYS first.** Instructs Flow to produce a multi-view layout. | Fixed opener — never change. |
| `Multiple angles and expressions of [CHARACTER]` | Core character description. Be visual and specific. | "a miserable, freezing Cleveland baseball fan" |
| `[VISUAL PROP DETAILS]` | Physical appearance, clothing, props in hand. | "Buried inside a massive puffy navy blue winter parka with only frost-covered eyebrows visible. Clutching a snow shovel in one hand and a freezing icicle in the other." |
| `Front view, side view, and [VIEWS]` | Instruct the grid layout angles. | "Front view, side view, and looking utterly defeated by the cold." |
| `Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background.` | **ALWAYS include verbatim.** This is the style lock. | Fixed style block — never change. |
| `Arranged in a grid layout.` | **ALWAYS last.** Forces the reference sheet composite output. | Fixed closer — never change. |

---

## 🧪 II. CANONICAL EXAMPLE — LAKE EFFECT LARRY (CLEVELAND)

**Persona ID:** `lake_effect_larry`  
**Game Context:** BAL@CLE / CLE home games  
**Deployed File:** `/dna/media/avatars/lake_effect_larry.png`

```
Flow Prompt:
Character reference sheet, model sheet, concept art. Multiple angles and
expressions of a miserable, freezing Cleveland baseball fan. Buried entirely
inside a massive, puffy navy blue winter parka with only frost-covered eyebrows
and chattering teeth visible. Clutching a snow shovel in one hand and a freezing
icicle in the other. Front view, side view, and looking utterly defeated by the
cold. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines,
solid black background. Arranged in a grid layout.
```

**Output:** Full-body front/side/back views + 3 expression heads (Chattering, Utterly Defeated, Max Cold) + 3 pose variations (Defeated, Shivering, Prop Details).

---

## 🗂️ III. DEPLOYMENT PIPELINE

```
1. Generate in Flow → download PNG
2. Rename to {persona_id}.png (exact match to m2m_persona_room.persona field)
3. Drop into: /home/james/SovereignOS/dna/media/avatars/
4. Served automatically at: http://{hostname}:8010/dna/media/avatars/{persona_id}.png
5. fancast_fan_live.html loads it at line ~566 with onerror fallback to ui-avatars.com
```

**Critical:** Filename MUST match the `persona` field in `m2m_persona_room` exactly (lowercase, underscores). No timestamps in the filename.

---

## 📦 IV. CURRENT CHARACTER ART INVENTORY

### ✅ Has Character Map (in `/dna/media/avatars/`)
| Persona | Game Context |
|---|---|
| `barf` | NYM games |
| `dirty_water_danny` | BAL/NYM crossover |
| `dot` | All games (analytics) |
| `rally_monkey_mafia` | LAA games |
| `shohei_ghost` | LAA/LAD games |
| `trout_pout` | LAA games |
| `uncle_stevie_stan` | NYM games |
| `wardy` | All games (studio host) |
| `wicked_smaht_stats_guy` | NYM/BOS games |

### 🚫 Missing Character Map (Active Personas — Need Art NOW)
| Persona | Game | Notes |
|---|---|---|
| `old_bay_obsessive` | 824855 (AZ@BAL) | Baltimore Old Bay superfan |
| `snake_pit_stu` | 824855 (AZ@BAL) | AZ Diamondbacks Snake Pit section fan |
| `burnes_notice` | 824855 (AZ@BAL) | Corbin Burnes Orioles superfan |
| `birdland_boomer` | 824855 (AZ@BAL) | Classic old-school Orioles Birdland fan |
| `the_chicken_man_az` | 824855 (AZ@BAL) | AZ fan — provide description before generating |

### 🗃️ Masters-Only (in `/dna/media/masters/character_maps/` — Augusta/Amen Corner project)
`shooter_mcgavin`, `the_gambler`, `the_defector`, `slopematrix_gj`, `the_traditionalist`

---

## ⚠️ V. RULE: ART-BEFORE-DEPLOY

**Effective April 16, 2026:**  
Before any agent runs `deploy_uat_rooms.py` or inserts a persona into `m2m_persona_room`, they MUST verify that a corresponding `.png` exists in `/dna/media/avatars/`. If the art doesn't exist, either generate it via Flow (preferred) or document it in this file under "Missing Character Map" and get acknowledgment from the Pilot before going live.

Fallback (ui-avatars.com colored bubble) is acceptable for testing ONLY — never for a production gameday session that Wardy or family members will see.

---

`[ CHARACTER_ART : PROTOCOL_V1 | Flow → /dna/media/avatars/ | ART_BEFORE_DEPLOY ]`
