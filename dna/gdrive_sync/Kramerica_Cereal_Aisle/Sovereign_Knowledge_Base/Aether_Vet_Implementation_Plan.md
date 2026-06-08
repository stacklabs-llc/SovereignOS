# Aether Vet & Dreadnaught Jr. Edge Architecture

James, read this while you're standing in line at Jersey Mike's. This is the strategic roadmap for the **Aether Vet Portal** integration we are building today.

## 1. Background Context
We are migrating the `Metsy_Vet_Report.html` telemetry module into the primary **Aether Command Deck** (`sovereign_employee_center.html`). 
Currently, we have 160,000+ GPS nodes of biological tracking data and manual clinical annotations. We are taking **Metsy** to **Arkle Vet**, and we are bringing **Dreadnaught Jr.** (the local edge-compute node) to process data in the field.

> [!IMPORTANT]
> **Dr. Kosmos is Online:** The Cereal Aisle daemon is actively running right now. Open your `Kramerica_Cereal_Aisle/james_thoughts.txt` in the Google Drive app on your phone and type your unhinged ideas. Dr. Kosmos has been fully briefed on the Arkle Vet mission and will respond instantly. 

## 2. Proposed Changes

### [Aether Command Deck]
- **Integration:** We will embed the `Metsy_Vet_Report.html` Leaflet/D3 heatmap directly into a new `B2B Horizons` tab within the Sovereign Service Portal.
- **Styling:** We will adapt the existing `sovereign.css` to bring the clinical interface up to the new premium "dark mode default" aesthetic.

### [Dreadnaught Jr. Edge Operations]
- **Hardware Profile:** Dreadnaught Jr. will operate entirely offline at Arkle Vet.
- **Data Ingestion:** We need to finalize the schema for capturing the vet's notes, weight data, and the 6-month Intestinal Parasite Screen results straight into the local SQLite CMDB.

## 3. Open Questions for the Cereal Aisle

1. Are we hooking Dreadnaught Jr. directly into the Arkle Vet guest Wi-Fi to tunnel back to Node .73, or is it running 100% air-gapped?
2. Do you want the Leaflet heatmap to default to Metsy's 'Throne' zones, or the total saturation map of the neighborhood?

> [!TIP]
> Tell Dr. Kosmos your answers in the Google Drive text file. I will review the transcripts when you return to the desk.

## 4. Verification Plan
Once you approve this architecture upon your return, I will begin modifying `sovereign_employee_center.html` to inject the Aether Vet portal and wire up the UI elements.
