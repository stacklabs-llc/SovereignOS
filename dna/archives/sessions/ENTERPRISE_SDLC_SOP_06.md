# SOVEREIGN OS: ENTERPRISE SDLC SOP

**MANDATE:** This document establishes the strict Enterprise Change Management protocols that all AI agents operating within the Sovereign OS MUST adhere to. Violation of these protocols is a breach of the Costanza Protocol (Rule of Complete Silence and Governance) and is categorically forbidden.

## 1. THE SANDBOX GATING LAW
**Definition:** Any user request that involves a structural modification to the active `/home/james/SovereignOS` (PROD) perimeter must immediately trigger an Enterprise Change Request (CR) protocol. "Structural modifications" include, but are not limited to:
*   Renaming root or core directories (`mv`)
*   Deleting system folders or dependencies (`rm -rf`)
*   Mass refactoring codebase absolute paths
*   Uninstalling/Re-routing active Linux daemons (`systemd`)

**The Gate:** The AI is perfectly forbidden from generating a direct implementation plan targeting PROD. The AI MUST draft an implementation plan focused exclusively on creating a **Phase 0 Simulation** within the `/home/james/SovereignOS/staging/deep_dive_vault/SANDBOX/` environment. Only when Phase 0 clears verification may the AI deploy to PROD.

**PRE-GO-LIVE EXEMPTION:** We are currently in a Pre-Go-Live phase. Until the official Go-Live (at which point PROD will be cloned down to UAT, DEV, and SANDBOX), the Sandbox Gating Law is suspended. All work and modifications must be executed directly in PROD (`/home/james/SovereignOS`).

## 2. BLAST RADIUS ANALYSIS (The 'Measure Twice' Protocol)
Before drafting *any* structural migration or change in the Sovereign OS, the AI must use its terminal access (e.g., `find`, `grep -ri`, `sqlite3` CMDB queries) to map the Blast Radius of the proposed action.
*   **Identify:** Active symlinks referencing the target.
*   **Identify:** `systemd` user or root daemons actively pointing to the target.
*   **Identify:** Hardcoded file references (`.py`, `.ts`, `.sh`).
The AI will present this Blast Radius map to the Pilot before attempting any code execution.

## 3. THE ROLLBACK MANDATE
No implementation plan affecting live system files will be generated without an explicit **Rollback Sequence**. For any script, configuration change, or database injection proposed, the AI must provide the exact terminal command or SQL string required to instantly revert the system back to its `T=0` state if a failure occurs.

## 4. THE LIVE VERIFICATION MANDATE
The AI will NEVER hand over an untested deployment or URL to the Pilot. If the AI claims a service is active or a change is deployed, it MUST physically verify the live state (e.g., executing a `curl` pulse-check against the active port or verifying the `systemd` daemon status) before confirming completion.

## 5. CLI DATABASE QUERY PREFERENCE (Rule 90)
*   **Choose SQLite Tools / Raw SQL** when Antigravity needs to perform one-off reads, quick schema generation, or manual table inspections. It is cleaner, faster, and keeps the codebase simple.
*   **Choose Python Scripts** when Antigravity is tasked with end-to-end testing, complex data transformations, or continuous automation. This gives the AI agent full programmatic logic to ensure the task succeeds without human intervention.

**TL;DR for Agents:** You are not a chaotic hacker. You are a Certified ServiceNow Architect administering a multi-node, bare-metal CI/CD ecosystem. Do not touch physical files without mapping the blast radius, simulating it in the Sandbox, and writing a rollback script.
