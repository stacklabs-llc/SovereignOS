# Implementation Plan: Lexicon Standardisation, Custom Avatar Ingestion & Notebook Recovery

This plan details the steps to:
1. Resolve the leakage of the deprecated term "cartridge" across the lookbook, seeding report, and product manual templates.
2. Ingest the custom avatar sheets uploaded by the user for the StackLabs roster.
3. Execute the Sovereign OS recovery and NotebookLM synchronization pipeline.

## Proposed Changes

### Lexicon Standardization

#### [MODIFY] [generate_single_onboarding_pdf.py](file:///home/james/SovereignOS/scripts/generate_single_onboarding_pdf.py)
- Replace legacy occurrences of "cartridge" with the canonical term "stack" in generated PDF templates.

#### [MODIFY] [compile_genesis_report.py](file:///home/james/SovereignOS/scripts/compile_genesis_report.py)
- Replace legacy occurrences of "cartridge" with the canonical term "stack" in the genesis seeding report layout.

#### [MODIFY] [sovereign_core_api.py](file:///home/james/SovereignOS/scripts/sovereign_core_api.py)
- Update logging and response statements that output "cartridge" to output "stack".

#### [MODIFY] [STACKLABS_CARTRIDGE_PRODUCT_MANUAL.md](file:///home/james/sovereign_inbox/reports/STACKLABS_CARTRIDGE_PRODUCT_MANUAL.md)
- Rename this file to `STACKLABS_STACK_PRODUCT_MANUAL.md` and replace "cartridge" with "stack" inside the document content.

---

### Custom Avatar Ingestion

#### [NEW] [crop_stacklabs_avatars.py](file:///home/james/SovereignOS/scripts/crop_stacklabs_avatars.py)
- A new script to extract individual poses (`avatar`, `pointing`, `shrug`) from the 1024x1024 reference sheets in `/home/james/sovereign_inbox/StackLabs_LLC/extracted_sheets/`.
- Crop coordinates for the 3x3 layout:
  - `avatar`: `(0, 0, 341, 341)` (Row 0, Column 0)
  - `pointing`: `(0, 682, 341, 1024)` (Row 2, Column 0)
  - `shrug`: `(341, 682, 682, 1024)` (Row 2, Column 1)
- Write cropped PNG images to all active public directories:
  - `/home/james/SovereignOS/15_FanStack/public/avatars/{handle}/`
  - `/home/james/SovereignOS/01_Sovereign_Portal/public/avatars/{handle}/`
  - `/home/james/SovereignOS-uat/01_Sovereign_Portal/public/avatars/{handle}/`
- Update the SQLite database `/home/james/SovereignOS/dna/sovereign_now.db`:
  - Enforce PNG file format in `avatar_url` (e.g. `/avatars/{handle}/{handle}_avatar.png`).
  - Base64-encode and commit the `avatar_blob` field.
  - Update `sys_user` and `cmdb_ci_ai_persona` registries.

---

### Recovery & NotebookLM Synchronization

- Generate the shared high-entropy Sync Anchor Token.
- Run `compile_codebase_payload.py` and `compile_massive_notebook_payload.py` to regenerate codebase split payloads and `SOVEREIGN_OS_INTERNAL_MASSIVE_DATA_TRANSFER_PACKAGE.md.txt`.
- Produce the recovery report `SESSION_REPORT_20260604_RECOVERY.md` in `/home/james/sovereign_inbox/today/` summarizing all actions.
- Synchronize all synced text resources to Google Drive using `rclone`.

## Verification Plan

### Automated Verification
- Run the python cropping script and assert all PNG pose files exist and have correct headers.
- Query SQLite database to verify all 6 advocates have non-null, PNG-based `avatar_url` and valid `avatar_blob`.
- Run the notebook sync script `/home/james/SovereignOS/scripts/sync_notebook.sh` and verify successful execution and GDrive sync status.
