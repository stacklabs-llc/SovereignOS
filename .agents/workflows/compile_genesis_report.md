---
description: Sovereign OS Service Catalog item to compile and sync the Genesis Seeding PDF Report for active cartridges like WeedStack and StackLabs.
---

# Compile Genesis Seeding Report (Service Catalog Item)

This workflow defines the strict, end-to-end standard procedure for generating a premium, unified PDF dossier compiling the complete lore, system prompts, vector assets, and CMDB database seating states for newly seeded brand cartridges (e.g., **WeedStack** and **StackLabs**).

## 📥 Trigger Event
This workflow is initiated manually by the Pilot or programmatically by the ingestion cascade when a new brand cartridge completes seeder execution and requires formal visual delivery.

---

## 🛠️ Phase 1: Relational Data Extraction
Before compiling the report, the agent must extract the complete lore metrics directly from the local SQLite storage.

1.  **Establish Database Connection:** Connect to the canonical database `dna/sovereign_now.db` under the workspace root.
2.  **Query Target Cartridge Roster:**
    ```sql
    SELECT user_name, display_name, team, system_prompt, boggs_level, color, cadence, deep_lore, governance
    FROM persona
    WHERE team IN ('WEEDSTACK', 'STACKLABS')
    ORDER BY team, display_name ASC;
    ```
3.  **Validate Roster Parity:** Ensure the count matches the ingestion brief (e.g., 6 advocates for WeedStack, 4 advocates for StackLabs).

---

## 🎨 Phase 2: Vector Asset Inlining
To prevent sandboxing or local security policies from blocking image rendering during headless compilation, all vector avatars must be loaded and inlined directly.

1.  **Locate Avatars:** Look in the `01_Sovereign_Portal/public/avatars/[user_name].svg` directory under the workspace root.
2.  **Read Raw SVG Contents:** Read each file as a string.
3.  **Sanitize Markup:** Remove XML declaration headers (e.g., `<?xml ...>`) and inject the clean `<svg>...</svg>` element directly into the card HTML block:
    ```html
    <div class="avatar-svg-container">
        <!-- Raw SVG content injected here -->
    </div>
    ```

---

## 🎨 Phase 3: Premium HTML Layout & Styling
We enforce the strict **High-Contrast Light-Mode Design System** visual design system.

1.  **Background Color:** Pure White (`#ffffff`)
2.  **Card Background:** Soft Slate (`#f8fafc`)
3.  **Primary Accents:** Sovereign Sky Blue (`#0284c7`)
4.  **VOL Dial Alert Highlights:** High-Contrast Amber (`#d97706`)
5.  **Page Rules:** Apply `@page` print rules to set standard Letter size, margins (`20mm`), page-numbering headers, and `page-break-inside: avoid` on all persona cards to prevent text clipping at page boundaries.

---

## 🖨️ Phase 4: Headless Chrome Compilation
Compile the raw HTML directly to PDF using the local Google Chrome binary.

1.  **Save Staged HTML:** Write the compiled HTML string to the target inbox reports staging path (default: `[inbox]/reports/seeding_report_temp.html`).
2.  **Execute Headless Print Command:**
    ```bash
    /usr/local/bin/google-chrome \
      --headless \
      --disable-gpu \
      --no-sandbox \
      --virtual-time-budget=10000 \
      --print-to-pdf=[inbox]/reports/WeedStack_and_StackLabs_Seeding_Report.pdf \
      file://[inbox]/reports/seeding_report_temp.html
    ```
3.  **Cleanup:** Immediately remove the temporary HTML file to satisfy the **Zero-Litter Workspace Policy**.

---

## 📂 Phase 5: GDrive Sync & SDLC Closure
Lock the compiled memorandum into the secure storage vaults.

1.  **Sync to GDrive:** The GDrive integration daemon automatically mirrors the inbox reports folder to the `/00_StackLabs_Internal/` GDrive repository space.
2.  **Upload to SDLC Ticket:** Attach the PDF directly to the corresponding active STRY tickets via the attachments API on Port 8095.

