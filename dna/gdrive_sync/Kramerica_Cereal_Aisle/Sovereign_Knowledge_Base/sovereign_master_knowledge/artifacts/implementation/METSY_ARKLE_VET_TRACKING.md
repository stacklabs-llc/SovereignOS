# 🐾 METSY ARKLE VET TRACKING: THE VETERINARY PORTAL (CTP)

The **Arkle Vet Clinical Telemetry Protocol (CTP)** is a specialized sub-stratum of the **Sovereign OS**, dedicated to the high-fidelity monitoring and health analysis of Node .171 (Metsy).

---

## 🏛️ I. THE VET PORTAL (ARKLE_VET.HTML)
Located in the **B2B Horizons** tab of the Sovereign Service Portal, the Vet Portal is a dedicated visual hub for biological diagnostics.

*   **Registry**: `ui_archive/Metsy_Vet_Report.html` (Primary mapping logic).
*   **Status**: LIVE (Confirmed Integrated into Service Portal v2.0).
*   **Associated Data Assets**:
    *   **Telemetry**: `dna/ci/metsy_timeline.json` (Processed GPX data). This serves as the primary dataset for training the **Gwen (Science Agent)** habitat models.
    *   **Ground Truth**: `dna/ci/mission_notes.json` (Manual clinical annotations).
*   **Core Systems**:
    *   **Map Scrubber**: High-density D3/Leaflet heatmap of 160,000+ data points for a 365-day period.
    *   **Primary Habitats**: Identifying "Thrones 1-6" (patrol nodes) and the PetKit Hub (primary base).
    *   **Veterinary Site Verification**: Hardcoded metadata identifying **Arkle Veterinary Care** as a verified clinical site.
    *   **Clinical Entry Ledger**: A specialized sidebar chronologically recording clinical annotations for vet review.
*   **Next Visit**: **April 28, 2026** (Metsy due for check-up).

---

## 🛰️ II. THE CTP STACK: BIOMETRIC SENSOR FUSION
The Vet Tracking workflow is powered by a multi-node sensor mesh:

1.  **PetKit Hub (Node .171a)**: Automated biometric tracking (weight, visitation frequency, and duration). Provides the core "Health Baseline."
2.  **Tractive GPS (Node .171b)**: Real-time outdoor patrol telemetry. Provides "Saturation Mapping" of the yard and neighborhood.
3.  **Gwen (Science Agent)**: Cross-references litter box cycles with weather patterns and GPS sorties to identify "Environmental Triggers" (e.g., rain causing increased indoor occupancy).

---

## 🔬 III. DIAGNOSTIC KEY & CLINICAL TRUTH
The Arkle Vet system uses a specific data classification system:

*   **High Density (Red)**: Frequent occupancy (Rest/Sleep).
*   **Frequent (Orange)**: Primary activity zone (Feeding/Patrol).
*   **Moderate (Yellow)**: Transitional node.
*   **Occasional (Green)**: Territorial transit.
*   **Identified Site (Dashed Blue)**: Pending clinical review (New discoveries).

---

## 🧩 IV. ARCHAEOLOGICAL RECOVERY: THE VET PORTAL FIND (MARCH 31, 2026)
During the March 31 session, the "Arkle work" was formally recovered from the UI archive. It was found to be a single, tab-integrated system within the **Sovereign Service Portal** rather than a standalone dashboard, resolving discovery friction.

**Protocol Instruction:** All new vet notes must be captured via the map-click listener in `Metsy_Vet_Report.html` and logged directly to the CMDB via the unified service portal.

---
` [ IMPLEMENTATION : CLINICAL | Ω=10.0 (ARKLE_CTP_HARDENING) ] `
