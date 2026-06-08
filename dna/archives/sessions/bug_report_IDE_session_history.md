# Antigravity IDE Bug Report: Session History Truncation / Dropped Sessions

**Date:** 2026-05-17
**Reporter:** James Carroll (Pilot / Senior Enterprise ITSM Architect)
**Component:** Antigravity IDE / Conversation History UI Sidebar
**Severity:** High (Blocks continuity of work and forces manual recovery)

## Description
The Antigravity IDE conversation history menu is intermittently dropping or failing to display recent sessions. When navigating to the "Select a conversation" menu or the sidebar, recently active sessions (sometimes the very last session completed) do not appear in the "Recent" list. 

This forces the user to start a completely fresh session (Cold Boot) without the ability to jump back into the previous context, explicitly state what went wrong, or maintain the continuity of the workflow.

## Steps to Reproduce
1. Start a new session in the Antigravity IDE and perform work (e.g., "Stabilizing SamTracker Edge Pipeline").
2. Close or navigate away from the session.
3. Open the "Select a conversation" history menu to resume.
4. Note that the expected recent session is missing from the dropdown list entirely.

## Expected Behavior
The IDE must consistently preserve and display all conversations in chronological order of last modification. The user should never lose UI access to a session that was just active.

## Workaround/Impact
To work around this issue, the Pilot is forced to:
1. Start a completely new session.
2. Manually trigger a `/sovereign_boot` cold boot initialization to re-establish context.
3. Have the agent manually hunt for the `SESSION_REPORT_*.md` buried in the hidden `.gemini/antigravity/brain/...` directories since the previous agent lost connection before moving it to the `sovereign_inbox`.

This bug introduces massive friction and wastes significant time by destroying session continuity.

---
*Note: This report has been formally documented as an artifact for tracking and escalation to the Deepmind development team.*
