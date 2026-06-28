# 📑 ARCHITECTURAL PROPOSAL: SOVEREIGN OS PLUGIN PROVISIONING SYSTEM
**Author:** Sovereign OS Core Architect (Antigravity)  
**Date:** June 22, 2026  
**Status:** DRAFT (Ready for Gemini / Spark Handoff)  
**Context:** ServiceNow-Style Plugin / Power Tool Orchestration across Vite/React Stacks

---

## 1. Executive Summary & Vision

You are 100% on to something here. The vision of a **ServiceNow-style Plugin Provisioning System** is highly practical and matches how enterprise architectures handle modular code scaling.

Right now, Sovereign OS has evolved into a constellation of highly localized, beautiful React/Vite applications (e.g., `01_Sovereign_Portal`, `14_SamTracker`, `15_FanStack`, `18_BarbStack`, `20_AetherVet`, `23_EileenStack`). Each of these runs its own local server and UI codebase.

If we want to enable **one-click toggle provisioning** for "power tools" like the **Vocal Matrix**, **HoloDex**, **Advocate Center**, **Cinema Remote**, or **Detractor Mailbag** across any active stack, we need a formalized way to seed, link, and dynamically load these tools without copy-pasting code or breaking relative compiler paths.

This proposal outlines the database architecture, file resolution strategies, and frontend configurations required to build a native Sovereign Plugin system.

---

## 2. The Architectural Challenge

To build a ServiceNow-style manager where a user ticks a checkbox (e.g., `Enable HoloDex in SamTracker`) and the tool immediately boots inside that app, we have to solve three engineering challenges:

1. **Compilation Security**: Vite restricts compile access to files inside the project's root folder (`server.fs.allow` security policy).
2. **Relative Path Drift**: A component that imports assets or local utility hooks relatively (e.g. `import { useAuth } from '../hooks/useAuth'`) will fail to compile if dropped into a directory with a different folder hierarchy.
3. **Endpoint Mapping (Proxy Ingress)**: The backend API endpoints for these plugins must be routed dynamically so the client-side calls don't return 404s.

---

## 3. The 3 Proposed Implementation Models

Here are the three ways we can realize your ServiceNow plugin model, ranked by flexibility and ease of maintenance:

### Model A: The Micro-Frontend / Iframe Injector (ServiceNow Style)
* **How it works**: Instead of injecting raw `.tsx` files into the stack's compiler, each tool remains a standalone service (or sub-route of the portal) running on its own dedicated port. When a plugin is enabled for a stack, the stack renders it inside a containerized, styled `<iframe>` or loading node.
* **ServiceNow Analogy**: This is identical to how ServiceNow loads UI Pages and external portal widgets via structured frame views.
* **Pros**: 
  * Zero Vite compiling errors.
  * Zero dependency collisions (React versions, Tailwind libraries).
  * Fast load times.
* **Cons**: Direct parent-to-child state management must go through standard window post-messages or shared LocalStorage/WebSockets.

### Model B: The Unified Monorepo Workspace (`npm/pnpm workspaces`)
* **How it works**: We declare `/home/james/SovereignOS/` as a unified package workspace. We create a shared library folder (e.g., `packages/shared-ui/`) containing all power tools. The individual stacks list `"shared-ui": "workspace:*"` in their `package.json`.
* **Pros**: 
  * Clean, standard industry practice for modern React apps.
  * Allows you to import components natively: `import { HoloDex } from '@sovereign/shared-ui'`.
  * Single source of truth; edit a file once, and Vite automatically hot-reloads all apps using it.
* **Cons**: Requires restructuring the root folder package dependencies and configuring all build tools to use the workspace manager.

### Model C: SQLite-Driven Symlink Provisioning (Seed & Link)
* **How it works**: When a stack is initialized via the **Stack Seeder** or `restart_stack.sh` runs:
  1. The script queries the database to see which plugins are active for that stack.
  2. The script runs automated shell symlinks to link the shared `.tsx` files directly into the stack's `src/components/shared/` directory.
  3. The local `vite.config.ts` uses configured symlink resolution (`resolve.preserveSymlinks: true` and `server.fs.allow`) to compile it on the fly.
* **Pros**:
  * Highly automated; aligns perfectly with your script-based DevOps flow.
  * Works out of the box with minimal path refactoring.
* **Cons**: If a stack is missing a package (e.g. `lucide-react`) that the symlinked component imports, compilation will fail until npm install runs.

---

## 4. Proposed Database Schema

To support ServiceNow-style plug-and-play modules, we will define a schema in `/home/james/SovereignOS/dna/sovereign_now.db`:

```sql
-- 1. Plugin Catalog (The registry of available plugins)
CREATE TABLE IF NOT EXISTS sys_plugin (
    sys_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,          -- e.g., "vocal_matrix", "holodex", "advocate_center"
    label TEXT NOT NULL,                -- e.g., "Vocal Matrix Synthesis"
    description TEXT,
    icon TEXT,                          -- Lucide icon name or emoji
    standalone_port INTEGER,            -- Port it runs on if Model A (e.g., 8888, 3009)
    active BOOLEAN DEFAULT 1,
    dependencies TEXT                   -- JSON array of required npm packages or APIs
);

-- 2. Stack Registry (List of your active Vite applications)
CREATE TABLE IF NOT EXISTS sys_stack (
    sys_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,          -- e.g., "sam_tracker", "fanstack", "wildseed_garden"
    path TEXT NOT NULL,                 -- e.g., "/home/james/SovereignOS/14_SamTracker"
    port INTEGER NOT NULL,              -- e.g., 3024
    active BOOLEAN DEFAULT 1
);

-- 3. Plugin Provisioning (Many-to-Many Mappings / Toggles)
CREATE TABLE IF NOT EXISTS sys_stack_plugin_m2m (
    sys_id TEXT PRIMARY KEY,
    stack_id TEXT,
    plugin_id TEXT,
    enabled BOOLEAN DEFAULT 0,
    FOREIGN KEY(stack_id) REFERENCES sys_stack(sys_id) ON DELETE CASCADE,
    FOREIGN KEY(plugin_id) REFERENCES sys_plugin(sys_id) ON DELETE CASCADE,
    UNIQUE(stack_id, plugin_id)
);
```

---

## 5. Mocking up the Provisioning UI Flow
When you open your **Stack Seeder** or a new custom **Plugin Manager Console**, you would see a grid listing your active stacks:

```
┌────────────────────────────────────────────────────────┐
│  🔌 SOVEREIGN PLUGIN PROVISIONING MANAGER              │
├────────────────────────────────────────────────────────┤
│  Select Stack: [ 😺 SamTracker (Port 3024)        ] ▼  │
├────────────────────────────────────────────────────────┤
│  Available Plugins:                                    │
│  [X] 🎙️ Vocal Matrix (Synthesis Engine)                  │
│  [ ] 📹 HoloDex Video Engine                           │
│  [X] 📋 Advocate Ticket Operations                     │
│  [ ] 📬 Detractor Mailbag (Triage Console)             │
│                                                        │
│  [ Apply Changes & Reboot Stack ]                      │
└────────────────────────────────────────────────────────┘
```

When you click **Apply Changes**:
1. The database records are updated.
2. A webhook triggers `restart_stack.sh` (or a dedicated provisioning daemon).
3. The server rebuilds/symlinks code if using Model C, or restarts the dev servers to bind appropriate proxy ingress settings.

---

## 6. Discussion Points for Spark & Gemini Sessions

When passing this document to other sessions, here are the topics you should explore to lock in the final design:

1. **Aesthetic Read-The-Room Integration**: Should the plugins dynamically skin themselves to match the host stack's design (e.g., if a tool is loaded inside the bluegrass stack, should it styled with natural woodgrains, and inside cannabis stacks with premium living-soil greens)?
2. **Iframe vs Workspace Choice**: Do we value isolation (Iframes: unbreakable, quick) or raw component integration (Workspaces: highly customizable, but compilation dependencies are shared)?
3. **Mando Diagnostics Watchdog**: How can the watchdog daemon monitor when a plugin fails or crashes without taking down the main stack?

---
*Document prepared by Antigravity for user review and external session transfer.*
