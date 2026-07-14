# SovereignOS Architecture Requirement Document - Release Spotlight Portal

## Metadata
* **Document ID:** REQ-2026-06-29-RELEASE-SPOTLIGHT
* **Status:** DRAFT (Pending Pilot Review)
* **Target Environment:** Sovereign Portal (React & Vite, FastAPI / SQLite core backend)
* **Author:** Antigravity AI Systems Architect
* **Project Path:** `/home/james/SovereignOS/01_Sovereign_Portal`

---

## 1. Executive Summary and Objective

The objective of this document is to establish the design and technical requirements for the **Release Spotlight Portal**. When multiple tickets are resolved at high speed during active development sprints, users often lose track of new features, dashboards, and instructions. 

This portal will combine automatic post-build ingestion of walkthrough documentation with a dynamic, in-app "What's New" notification and modal rendering system. 

By leveraging the existing SQLite `kb_knowledge` table and the frontend's markdown rendering capabilities, the system will highlight the exact features that were just deployed, complete with screenshots, links, and operational guides, adhering to the **Sovereign Home Premium** aesthetic.

---

## 2. System Architecture & Lifecycle

The following schematic illustrates the end-to-end data flow, from the closing of a ticket during development to the rendering of the feature walkthrough on the user's screen:

```
[Development / CI Phase]
  1. Ticket Walkthrough written to /home/james/sovereign_inbox/walkthroughs/walkthrough_*.md
  2. restart_stack.sh calls sync_walkthroughs.py
  3. sync_walkthroughs.py parses walkthroughs and inserts them into SQLite kb_knowledge table
                                |
                                v
[SQLite sovereign_now.db (kb_knowledge table)]
  Contains parsed walkthroughs as articles:
  - Topic: "Release Notes: [Ticket ID] [Short Description]"
  - Text: Full Markdown body (with relative links, alerts, and instructions)
  - Tags: "release-notes"
                                |
                                v
[FastAPI Backend (/api/system/kb)]
  Exposes articles to client-side requests
                                |
                                v
[React Frontend (Sovereign Portal)]
  1. On load, checks localStorage.getItem('sovereign_last_seen_release')
  2. Compares with the sys_updated_on timestamp of the latest "release-notes" article
  3. If a newer release exists:
     a. Displays a glowing neon-cyan pill notification: "🆕 New Updates Staged"
     b. Automatically triggers the frosted-glass <ReleaseSpotlightModal />
  4. User reads markdown walkthrough, clicks links to test, and clicks "Got it!"
  5. Updates localStorage.sovereign_last_seen_release = latest_timestamp
```

---

## 3. Functional Requirements

### 3.1. Ingestion Pipeline (Backend)
* **REQ-RSP-001 (Automated Ingestion Script):** A Python script `scripts/sync_walkthroughs.py` must run as part of the system boot/restart stack (`restart_stack.sh`).
* **REQ-RSP-002 (Markdown Parsing and Deduplication):** The script must scan the walkthroughs folder (`/home/james/sovereign_inbox/walkthroughs/`) for `walkthrough_*.md`. It must:
  * Extract the ticket ID from the filename (e.g. `ENHC1789569` from `walkthrough_ENHC1789569.md`).
  * Check the SQLite `kb_knowledge` table. If the article for the ticket ID already exists (number matched against the ticket ID), it must update the text, description, and timestamp if modified.
  * If it does not exist, insert a new record:
    * `sys_id` = UUID
    * `number` = `KB_` + Ticket ID (e.g., `KB_ENHC1789569`)
    * `topic` = Title from the walkthrough markdown (H1 header)
    * `short_description` = First paragraph or summary of changes
    * `text` = Complete markdown contents
    * `u_source` = `system_operations`
    * `u_tags` = `release-notes`
    * `sys_created_on` and `sys_updated_on` = Current timestamp

### 3.2. REST API Extension (Backend)
* **REQ-RSP-003 (Release Queries API):** The existing `/api/system/kb` endpoint must be verified to ensure articles tagged with `release-notes` can be queried easily. A query parameter filter (e.g. `GET /api/system/kb?tag=release-notes`) may be utilized to minimize transmission payloads for the client.

### 3.3. Client-Side Notifications & Storage (Frontend)
* **REQ-RSP-004 (Release Sync Check):** On initial dashboard mount, the portal must dispatch a request to fetch the latest release note.
* **REQ-RSP-005 (Local Persistence Tracking):** The client must look up `sovereign_last_seen_release` in `localStorage`. If it is null or less than the `sys_updated_on` timestamp of the retrieved article:
  * Render a glowing neon-cyan pill badge on the `GlobalSystemBar`: `🆕 [New Features Staged - Click to View]`.
  * Trigger the interactive `ReleaseSpotlightModal` automatically (on first session boot only).
* **REQ-RSP-006 (Acknowledge and Close):** Clicking the "Got it / Close" button in the modal must write the latest timestamp to `localStorage.setItem('sovereign_last_seen_release', latest_timestamp)` and hide the global pill badge.

### 3.4. Release Spotlight Modal (Frontend)
* **REQ-RSP-007 (Rich Markdown Rendering):** The modal must render the parsed walkthrough text utilizing the core ReactMarkdown module with support for tables, lists, and GitHub-style alerts:
  ```typescript
  import ReactMarkdown from 'react-markdown';
  import remarkGfm from 'remark-gfm';
  import remarkGithubAlerts from 'remark-github-alerts';
  ```
* **REQ-RSP-008 (Direct Navigation Links):** Any Tailscale URL or relative portal path (e.g. `/sports` or `http://clio.taila01894.ts.net:3016/`) embedded in the walkthrough markdown must be rendered as active, clickable, styled anchors that allow the user to instantly navigate to the new feature workspace.

---

## 4. Design & Aesthetics (Sovereign Home Premium)

* **REQ-RSP-009 (Glassmorphic Overlay):** The modal must be styled with a deep void dark overlay and a central frosted-glass card container:
  * **Overlay:** `bg-slate-950/80 backdrop-blur-md`
  * **Card Container:** `bg-slate-900/65 border border-slate-800 rounded-2xl max-w-3xl w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]`
  * **Accents:** The H1 header, important alerts, and callout buttons must utilize neon-cyan borders and text highlights (`text-cyan-400`, `border-cyan-500/20`).
* **REQ-RSP-010 (Content Scroll Zone):** The markdown content must render inside a clean, scrollable flex container with a custom styled scrollbar (`no-scrollbar` or custom slate scrollbar track) to prevent scroll drift in the outer viewport.

---

## 5. Proposed UI Layout Mockup

The interface will render a clean, high-contrast modal presenting the formatted markdown walkthrough:

```
+-------------------------------------------------------------------------+
|                                                                         |
|  [🆕 3 New Updates Staged]                                              |
|  +-------------------------------------------------------------------+  |
|  |                     RELEASE SPOTLIGHT (ENHC1789569)            [X] |  |
|  +-------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  # Support status_msg and CONTAINS in Telemetry Builders          |  |
|  |                                                                   |  |
|  |  ## Changes Made                                                  |  |
|  |  1. Telemetry Mapper: Added status_msg property dropdown.         |  |
|  |  2. Playcall Desk: Added CONTAINS (Substring Match) operator.     |  |
|  |                                                                   |  |
|  |  > [!IMPORTANT]                                                   |  |
|  |  > Chatbot API calls now time out at 25 seconds to prevent         |  |
|  |  > lock exhaustion and live chatbot freezes.                      |  |
|  |                                                                   |  |
|  |  ## Testing & Verification                                        |  |
|  |  - Compiled sports dashboard via npm run build (Success).         |  |
|  |  - Test outposts: http://clio.taila01894.ts.net:3016/sports       |  |
|  |                                                                   |  |
|  |  +-------------------------------------------------------------+  |
|  |  | [ Screenshot of Telemetry Builder UI ]                      |  |
|  |  +-------------------------------------------------------------+  |
|  |                                                                   |  |
|  +-------------------------------------------------------------------+  |
|  |                                             [ ACKNOWLEDGE & CLOSE ]|  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```
