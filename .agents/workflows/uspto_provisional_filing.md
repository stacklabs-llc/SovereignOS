# Sovereign OS: USPTO Provisional Patent Filing Workflow
**Codification:** The Omega Gate Manual Transmittal Protocol
**Purpose:** Standard operating procedure for manually pushing a provisional patent payload through the USPTO Patent Center, satisfying the Human-in-the-Loop Cryptographic Execution Gateway (HITL-CEG).

## Phase 1: Payload Preparation & Sanitization
1. **Audit the Markdown:** Open the generated patent disclosure (e.g., `MYCROFT_PATENT_DISCLOSURE_XXXXXX.md`). Ensure all internal Mycroft telemetry, AI conversational bloat, and operational notes (e.g., "Ready for filing", "Do not distribute") are completely scrubbed.
2. **Convert to PDF:** The USPTO requires PDF or DOCX format for specifications. Generate a clean `Specification.pdf`. (Use `fpdf2` or print-to-PDF). 

## Phase 2: Patent Center Initialization
1. Navigate to [patentcenter.uspto.gov](https://patentcenter.uspto.gov) and authenticate (The Omega Gate).
2. On the top navigation bar, click **"New submission"** -> **"Provisional"**.

## Phase 3: Application Data Entry (Web ADS)
The system will present Application Data Sheet (ADS) filing options. To avoid convoluted PDF form parsing errors, bypass the PDF upload.
1. Click **Select** under **"Web ADS"**.
2. **Inventors:** Click **"Add new inventor"**. Enter the full legal name and residence of the inventor(s). Click save/next.
3. **Application details:** Paste the exact Title of the Invention from the disclosure document.
4. Complete the remaining Web ADS sections (Correspondence, Applicant, Assignee) mapping them to the primary inventor. 

## Phase 4: Document Upload
*CRITICAL:* Do not upload the specification on the "Application data" tab.
1. Click the **"Upload documents"** tab at the top.
2. Upload your `Specification.pdf`.
3. Set the Document Description/Category explicitly to **"Specification"**.

## Phase 5: Cryptographic Signature & Fee Calculation
1. Proceed to the **"Calculate fees"** tab.
2. Select the appropriate Entity Status (**Micro Entity** or **Small Entity**) to apply the statutory fee reduction.
3. Proceed to checkout and apply your physical cryptographic signature (payment authorization).
4. Click **Submit**.

## Phase 6: Ledger Validation
1. Immediately download the **Electronic Acknowledgement Receipt** (PDF).
2. Save this receipt to the current daily `dropzone` folder. This document is the immutable ledger proof locking in the Sovereign priority date.
