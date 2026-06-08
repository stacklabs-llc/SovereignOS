# 🗄️ Sovereign OS — Vertex & UAT Discovery Dossier
**Generated On:** 2026-06-01T17:29:51Z
**Recipient:** James (Pilot)

This directory contains a complete extraction of the QA/UAT testing suite, GCP credentials, and historical conversation contexts for Vertex AI integration.

---

## 📂 Dossier Contents

### 1. ⚙️ Automated Quality Assurance & UAT Scripts (`/scripts/`)
These scripts are responsible for checking server responsiveness, crawling endpoints, validating database schemas, and running Headless/Headed verification suites:
*   `deploy_uat_rooms.py`
*   `uat_headed_runner.py`
*   `uat_town_simulation.py`
*   `vertex_uat_agent.py`
*   `sovereign_portal_uat.py`
*   `uat_crawler.py`
*   `voice_studio_uat.py`
*   `maintenance_portal_uat_crawler.py`
*   `playwright_uat.py`
*   `uat_prospectus.ts`
*   `generate_uat_report.py`

### 2. 🔑 GCP Service Account & API Keys (`/credentials/`)
*   `vertex_sa.json`: Complete service account credential mapping (Project ID, Private Key, Client Email) used to initialize Imagen 3.0 image generation and Gemini model completion calls natively inside the fanstack core.

### 3. 💬 Conversation Archives (`/conversations/`)
*   `vertex_uat_conversations_log.md`: Aggregated and timestamped timeline logs of model interactions, tool calls, and setup scripts concerning Vertex and UAT verification.
