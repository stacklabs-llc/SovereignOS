# 🧬 Sovereign OS: Media Asset Cataloging & Folder Standards Guide

## 📋 1. Document Overview
* **Document ID**: `GUIDE-2026-06-19-MEDIA-CATALOG`
* **Status**: `APPROVED`
* **Target Audience**: Pilot, Systems Engineers, and AI Agents

This guide establishes the directory structures, naming conventions, and database cataloging workflows for managing textual and visual media assets within Sovereign OS. Adhering to these standards ensures system organization, prevents folder clutter (Zero-Litter compliance), and allows our automated scripts to register assets in the CMDB correctly.

---

## 📂 2. Folder Standards & Workspace Locations

To prevent files from being saved haphazardly, all assets must be mapped to their dedicated directories:

| Asset Type | Primary Directory | Description |
| :--- | :--- | :--- |
| **Project Initiatives & Specifications** | `/home/james/SovereignOS/dna/docs/initiatives/<initiative_name>/` | Requirements, schemas, and design documents (e.g. `spec_high_velocity_media_ingress.md` in `leo_engine/`). |
| **Raw / Original Media Assets** | `/home/james/SovereignOS/media_vault/02_Projects/<project_name>/` | Raw assets, comic drafts, screenshots, and artwork (e.g., `/media_vault/02_Projects/Metsys_Adventures_Comic/`). |
| **Staging / Processed Media Assets** | `/home/james/SovereignOS/work_orders/spark/media/` | Optimized images processed and ready for deployment to the live user interfaces. |
| **Production Frontend Avatars** | `/home/james/SovereignOS/15_FanStack/public/avatars/<advocate>_smyrna/` | Deployed frontend avatar files serving user interfaces (also mapped to `01_Sovereign_Portal` and `02_Sovereign_Media`). |

---

## 🏷️ 3. Filename Naming Conventions

### A. Raw / Working Media Files
When creating or generating new image files (such as comic panels or advocate poses), name them sequentially and descriptively:
```
Format:   [advocate]_[project]_[panel_or_scenario_num]_[descriptive_slug].[ext]
Example:  metsy_adventure_015_boat_ride.png
Example:  metsy_adventure_016_fire_pit.jpg
```

### B. Staging / Processed Media Files
Staged assets ready for ingestion should have the `[PROCESSED]_` prefix. This tells the database ingestor that the file is ready to be cataloged:
```
Format:   [PROCESSED]_[descriptive_slug].[ext]
Example:  [PROCESSED]_boat_ride.png
Example:  [PROCESSED]_fire_pit.png
```

---

## 🚀 4. Automated Ingestion & Database Cataloging Pipeline

Sovereign OS uses a universal media ingestion command (`scripts/ingest_media_assets.py`) to parse, register, and distribute processed assets.

### Step 1: Create a `manifest.json`
Staged processed images inside `/home/james/SovereignOS/work_orders/spark/media/` must be accompanied by a `manifest.json` describing them:

```json
{
  "scenarios": [
    {
      "num": 15,
      "name": "Raising the Jolly Roger (The Boat Adventure)",
      "raw_file": "metsy_adventure_015_boat_ride.png",
      "processed_file": "[PROCESSED]_boat_ride.png",
      "expression_key": "metsy_boat_ride",
      "expression_reference": "STANCE: COMMAND/DIRECTIVE",
      "vibe": "Gritty neon-grime cartoon action."
    }
  ]
}
```

### Step 2: Execute the Ingestor Command
Open a terminal in the root of the `SovereignOS` repository and run the ingestion script, passing the target directory, ticket/work order number, advocate username, and category:

```bash
python3 scripts/ingest_media_assets.py \
  --dir /home/james/SovereignOS/work_orders/spark/media \
  --ticket WO-2026-031-METSY-ADVENTURES \
  --advocate metsy \
  --category "Metsy Adventures"
```

### Step 3: Automated Outcomes
When you run this script, it executes these five tasks automatically:
1. **Registers CMDB Tag**: Assigns a sequential asset tag (e.g., `FS-MED-00045`), registers details, and stores a Base64-encoded copy in `sys_media_asset`.
2. **Maps Advocate Expressions**: Maps the advocate handle and expression key in `cmdb_ci_media_asset` for live frontend rendering.
3. **Deploys Avatars**: Copies the processed files to active portal avatar directories (`01_Sovereign_Portal`, `02_Sovereign_Media`, `15_FanStack`) under `<advocate>_smyrna/`, stripping the `[PROCESSED]_` prefix.
4. **Writes Ingest Receipts**: Saves an individual `_receipt.json` next to each file in the staging directory for trace logs.
5. **Resolves the Ticket**: Automatically updates the ticket state to **RESOLVED** (`State = 4`) and closes the SDLC task in `sys_sdlc_task`.
