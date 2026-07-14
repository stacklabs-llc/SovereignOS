# 🤖 SOVEREIGN OS: REPOSITORY-LEVEL AI GOVERNANCE & ARCHITECTURAL INVARIANTS

This document defines the strict, binding structural invariants and style rules for all automated AI coding, refactoring, and review agents operating within the **SovereignOS** codebase. All automated code generation, linting, and database updates must strictly adhere to these mandates.

---

## 🏛️ I. ARCHITECTURAL INVARIANTS

### 1. Database Modifications & Schema Integrity
- **Mandate**: Direct, ad-hoc, or manual modifications to the production SQLite schemas (`sovereign_now.db`) are **STRICTLY FORBIDDEN**.
- **Enforcement**: Any change to database schemas, tables, or column structures must be formally declared in an explicit SQL ledger/migration script located in `/home/james/SovereignOS/dna/` or `/home/james/SovereignOS/dna/migrations/`.
- **Reasoning**: Ensures perfect traceability, prevents database corruption or file lock contentions, and preserves the integrity of the live SDLC ticketing system.

### 2. Telemetry and State Management
- **Mandate**: All real-time telemetry synchronization, watch room updates, and ballpark telemetry streams must utilize the centralized **TMI (Telemetry Media Ingress) Engine** structure.
- **Enforcement**: Ad-hoc WebSockets or raw network listeners outside the defined portal WebSocket context are prohibited. All components must bind to established state hooks and propagate updates through standard contexts.

### 3. Architecture Design Spec Documents
- **Mandate**: All new features, stacks, or primary UI components must have a formal, versioned Architecture Requirement / Design Document (SOW/REQ spec) stored under `/home/james/SovereignOS/dna/docs/` (following the `SOW_XX` or `REQ` layout format) before code implementation.
- **Enforcement**: Any pull requests or code additions that introduce fresh system logic, standalone daemons, or R3F visual components without a matching architectural spec document must be automatically rejected by AI review agents.
- **Reasoning**: Ensures all design trade-offs, functional requirements, and visual mockup assets are documented, preventing technical debt and layout drift.

### 4. Visual Playbook Registration Mandate
- **Mandate**: Every new UI workspace room, sub-tab, or visual feature section must be programmatically integrated and cataloged within the `vault_matrix/VISUAL_PLAYBOOK.md` index and crawler.
- **Enforcement**: Any commit introducing layout screens, tabs, or new console routes without a matching entry in the crawler's visual components catalog must be rejected.
- **Reasoning**: Secures the visual ingestion baseline used by edge hardware (e.g. Raspberry Pi AI Hat) to perform automated drift detection and visual UAT validation.

---

## 🎨 II. STYLING & DESIGN MANDATES ("Sovereign Home Premium")

### 1. Visual Aesthetics
- **Core Theme**: Sane defaults must always utilize the high-fidelity **Sovereign Home Premium** aesthetic.
- **Color Palette**: Deep Void black/slate backgrounds (`bg-slate-950` or `#0b0d13`), frosted-glass panel overlays with glassmorphism, and neon-cyan glowing accents (`#00b4d8` / cyan-500).
- **Default Hierarchy**: Pure, clean negative space, high contrast, and custom modern typography (Inter, Outfit, or JetBrains Mono).

### 2. Layout & Styling Rules
- **Modern Elements**: Every interactive UI widget or panel must incorporate hover transitions, smooth micro-animations, and subtle glowing borders.
- **No Unstyled HTML**: Standard raw, browser-default unstyled HTML elements are completely unacceptable and will cause automated build rejections.
- **Responsive Layouts**: All layouts must enforce clean flexbox or grid alignments, handle overflow scroll zones cleanly, and support responsive breakpoints.

---

## 🔒 III. SECURITY & EDGE HARDENING

### 1. Coordinate Sanitization
- Multimodal visual agents performing cursor movements or action injections must sanitize all raw pixel coordinates, enforcing safety clipping between `[0.0, 1.0]` boundaries to prevent cursor hijacking or out-of-bounds screen execution.

### 2. Private Routing Invariant
- All edge-to-workstation communications (such as between the Raspberry Pi 5 node and the Clio laptop) must be routed strictly through encrypted, authenticated **Tailscale tunnels** using MagicDNS hostnames. Public exposure of raw telemetry streams is strictly forbidden.

---

## 💻 IV. DEVELOPER EXPERIENCE & INTERACTION INVARIANTS

### 1. Markdown Visualizations & Diagram Rendering
- **Mandate**: Raw Mermaid code blocks or multi-line diagram text must never be output directly into standard chat responses.
- **Enforcement**: All architecture diagrams, state charts, sequence diagrams, and flowcharts must be written as a standalone markdown file (`.md` extension) under the active session's brain/artifact directory or the user's staging directory.
- **Reasoning**: Ensures the client IDE on Artemis can render visual elements correctly inside a document viewer rather than treating them as code snippets in a scrolling terminal/chat window.

### 2. Mandatory Automated Mockup Generation
- **Mandate**: Whenever proposing or implementing new UI components, workspaces, layouts, or visual feature alterations, the agent must *always* generate a high-fidelity image mockup representing the UI layout *prior* to requesting user approval or writing implementation code. If there are multiple sections, tabs, or sub-views associated with the proposal (e.g., Dashboard, Loot Vault, Settings, Help), the agent must generate high-fidelity image mockups representing all of those individual views and sections. All mockups must be formally cataloged and saved to the active brain session artifacts directory.
- **Enforcement**: Any design proposal or change request submitted without accompanying visual mockup artifacts for all relevant sub-views must be automatically rejected.
- **Reasoning**: Ensures other developer agents and the user can visually check alignment, style compliance, and structure layout across all sections without needing to run local builds first.

### 3. Lookbook Image Ingress Mandate
- **Mandate**: Every newly onboarded advocate, fan persona, or character profile must have their generated lookbook images (such as avatars, pointing, and shrug poses) formally registered within the system media asset catalogs (`cmdb_ci_media_asset` and `sys_media_asset` database tables).
- **Enforcement**: Generated PDFs (dossiers, lookbooks) must showcase these visual assets instead of rendering text placeholders or empty sections. Any workflow or script onboarding a persona without registering their complete coordinate images is non-compliant and must be rejected.
- **Reasoning**: Ensures all advocate profiles maintain high-fidelity visual context when displayed in the portal, dossiers, or printed reports.

---

> **Note to AI Review Agents**: Reject any pull requests, modifications, or commits that violate these core invariants. Maintain the system's high-fidelity performance and secure edge-native topology.



