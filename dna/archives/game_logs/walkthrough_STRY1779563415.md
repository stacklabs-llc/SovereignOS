# Walkthrough: STRY1779563415 — Persona Bio Repair & Silent Room Diagnostics

## 1. Silent PIT/TOR Room Diagnostics & Fix

- **Root Cause Identified:** The database update commands were blocked due to a transaction lock on `/home/james/SovereignOS/dna/sovereign_now.db`. The lock was held by dangling background processes `sam_tracker_server.py` and `the_skew_chatbots.py` with active file descriptors.
- **Surgical Actions Taken:**
  1. Killed the locking background PIDs (`1942855` and `3601005`).
  2. Executed synchronous database updates setting `room_state = 'active'` for game keys `822816` and `822814` in both `cmdb_ci_fanstack_room` and `mlb_schedule` tables.
  3. Ran `/home/james/SovereignOS/scripts/restart_stack.sh` to gracefully restart all FanStack daemons, clearing high-CPU poller yappers.
- **Verification:** Chatbot logs confirm that yappers for PIT@TOR are fully online, polling live play events (e.g., Yohendrick Piñango's double), and generating real-time commentary.

## 2. Vertex AI Persona Bio Repair Engine

- **Script Implemented:** `/home/james/SovereignOS/scripts/repair_persona_bios.py`
- **Engine Features:**
  - **Connection Check & Candidate Selection:** Automatically sweeps `persona` table for missing or truncated bios (system_prompt < 500 chars), missing deep lore, missing governance, and team mismatches.
  - **Context-Safe Prompt Formatting:** Automatically truncates seed parameters to prevent context bloat and Gemini generation limits.
  - **Robust Multi-Keyword Section Parser:** Scans and separates generated text into respective `system_prompt`, `behavior_notes`, `governance`, and `deep_lore` fields.
  - **CLI Arguments Supported:**
    - `--audit-only` (default): Sweep diagnostic count, connection check, cost estimate, and prints sample prompts.
    - `--dry-run`: View proposed changes without database mutation.
    - `--persona <name>`: Repair a single persona (including forced manual rebuilds).
    - `--team <team>`: Batch repair all personas of a specific team.

## 3. Biography Audit and Verification

- **Target Persona:** `hollywood_hex` (TOR fan)
- **Problem Resolved:** The original migrated deep lore of `hollywood_hex` contained Dodgers references (Pantone 294, Mary Hart) despite her team code being `TOR` (Toronto Blue Jays).
- **Execution:** Ran `python3 repair_persona_bios.py --persona hollywood_hex`.
- **Results:**
  - Generated complete, comprehensive bio of **4,344** characters (Barf-level detail).
  - Perfectly parsed behavior notes (**1,982** characters) and governance (**1,288** characters).
  - Successfully resolved team misassignment, grounding her astrology-based panic completely in Toronto Blue Jays' context (Rogers Centre, CN Tower, Pantone 286 C).
  - Verified active live chat interception by `fanstack_chatbots.py` logging prompts with the new bio payload.
