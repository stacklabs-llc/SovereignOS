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

> **Note to AI Review Agents**: Reject any pull requests, modifications, or commits that violate these core invariants. Maintain the system's high-fidelity performance and secure edge-native topology.
