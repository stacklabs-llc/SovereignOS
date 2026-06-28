# ⚔️ The Highlander Accords
**System-Wide Single Source of Truth (SSOT) Invariant Doctrine**

> "There can be only one..."

---

## 📌 I. Foundation Principle

In decentralized architectures with multi-agent orchestration, configuration drift, synchronization loops, and data regression represent systemic threats to system stability. The **Highlander Accords** establish a hard system-wide invariant: **For every shared resource, endpoint, directory, database, or integration channel, there must exist exactly one canonical Single Source of Truth (SSOT).** 

Duplicate pathways, split-brain configurations, or multiple paths representing the same transactional data domain are strictly outlawed. 

---

## ⚙️ II. Core Mappings

### 1. Ingress/Egress Work Orders
- **Deprecated Pathway:** `My Drive > work_orders` (rclone remote: `sovereign_os:work_orders`)
- **Canonical SSOT Pathway:** `My Drive > SovereignOS_Clio_Sync > work_orders` (rclone remote: `sovereign_os:SovereignOS_Clio_Sync/work_orders`)
- **Procedural Mandate:** All automated systems (Antigravity pulls, Spark uploads, receipt generators) must target the canonical path. The legacy path must remain unused and unreferenced.

### 2. Persona Registries & Avatars
- **Anti-Litter Mandate (KI-052 Compliance):** Storing advocate avatar mappings in static flat files (e.g., `avatarMap.json`) is strictly prohibited. 
- **Canonical SSOT Database:** `sovereign_now.db` (`persona` table and `cmdb_ci_persona` table) remains the singular ground truth for all system user profiles and avatar URLs.
- **Dynamic Assets Serving:** Expressive poses are to be parsed, sliced, and referenced directly from the database or served via the dynamic `/api/persona_image/` handler.

### 3. Synchronization Daemons
- All session states, RAG compilations, and PDF seeding reports destined for external agent ingestion must sync directly to the unified `SovereignOS_Clio_Sync/` folder root.

---

## 🚨 III. Violations and Linting

- Any script, build config, or pipeline daemon introduced into the codebase that attempts to read from or write to a deprecated path will fail compilation.
- The Path Linter will automatically flag any duplicate directory references during prep sequences.
