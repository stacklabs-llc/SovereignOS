# Implementation Plan — Dual-Engine Inference Routing & Vertex SA Key Lock

Permanent credential lock of the premium Google Vertex API service account JSON key and absolute dual-engine routing split between static data (local) and persona discourse (Vertex AI).

## User Review Required

> [!IMPORTANT]
> The Dual-Engine split permanently anchors the **Dot** persona to `local_llama3` for routine/mechanical data feeds, and locks all other dynamic personas (e.g. **Barb**, **spitfire_spud**, etc.) exclusively to the Google Vertex `gemini-2.5-flash` model. 
> 
> There is a **strict fallback ban** for all dynamic personas; if a network lag or timeout occurs, the system will return a standard retry block rather than consuming local CPU resources on Clio.

---

## Proposed Changes

### Configuration Lock & Credentials

#### [MODIFY] [.env](file:///home/james/SovereignOS/.env)
- Append `GOOGLE_APPLICATION_CREDENTIALS="/home/james/SovereignOS/config/vertex_sa.json"` to the master system environment file to lock Vertex credentials.

#### [MODIFY] [15_FanStack/.env](file:///home/james/SovereignOS/15_FanStack/.env)
- Append `GOOGLE_APPLICATION_CREDENTIALS="/home/james/SovereignOS/config/vertex_sa.json"` to the FanStack local environment config.

---

### Inference Orchestration Routing

#### [MODIFY] [fanstack_chatbots.py](file:///home/james/SovereignOS/scripts/fanstack_chatbots.py)

- **Dynamic Credential Resolution:** Update the Vertex AI sync initialization in `fanstack_chatbots.py` to read `GOOGLE_APPLICATION_CREDENTIALS` dynamically from the `.env` file first, falling back to the canonical path `/home/james/SovereignOS/config/vertex_sa.json` only if not defined.
- **Dual-Engine Inference Routing:** Lock model assignments across all chatbot loop message triggers:
  - If `fan_name == "dot"`: Route strictly to `"local_llama3"` (STATIC DATA).
  - For all other personas: Route strictly to `"gemini-2.5-flash"` (PERSONA DISCOURSE).
- **Absolute Fallback Ban:** Update the `except Exception` handling inside the `gemini` routing block in `generate_response()` to return a standard wait/retry block (`"⏳ [Connection Lag] Persona Matrix is retrying connection..."`), preventing any automatic cascade or fallback to Ollama/local Llama.

---

## Verification Plan

### Automated Tests
- Run a standalone test script using `.venv/bin/python3` to verify the dynamic Vertex AI API connection with the credential JSON key.
- Verify that `GOOGLE_APPLICATION_CREDENTIALS` is correctly exported in the running environment.
- Restart the chatbot background processes and inspect `/home/james/SovereignOS/data/logs/` and stdout to ensure the routing behaves exactly as expected (Dot routing to Ollama/Llama-3, other personas routing cleanly to Vertex Gemini).

### Manual Verification
- Send a manual message in a live room to confirm that a non-Dot persona generates a response from Vertex AI without falling back.
