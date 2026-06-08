# /sovereign_inbox_read — Daily Inbox File Reader

**Trigger:** `/sovereign_inbox_read [filename]`
**Alias:** `/inbox [filename]`

## Purpose
Reads a named file from today's daily folder in the `sovereign_inbox` Samba share and delivers a structured brief to the Pilot. This is the **file-drop pipeline** — used for session handoffs, architecture notes, and any document dropped from a Windows endpoint via the Samba mount.

This workflow is **NOT** for email. For sovereign.fanstack Gmail ingestion, use `/fanstack_mailbag`.

---

## Execution Protocol

### Step 1 — Resolve today's path
Today's date determines the folder. Format: `daily_MMDDYYYY`.
```
BASE = /home/james/sovereign_inbox
TODAY_FOLDER = daily_{MM}{DD}{YYYY}   # e.g. daily_05072026
TARGET = {BASE}/{TODAY_FOLDER}/{filename}
```

### Step 2 — Read the file
Use `view_file` on the resolved absolute path. If the file is not found:
- Check `{BASE}/needs_review/` for the filename
- List `{BASE}/{TODAY_FOLDER}/` to show what IS available
- Report back to the Pilot — never hallucinate file contents

### Step 3 — Deliver a structured brief
After reading, output a brief with the following sections (adapt to file type):

- **Status line** — one-sentence system state summary (if present)
- **✅ Wins** — completed items from last session
- **🔴 Open Issues** — prioritized, with root causes and proposed fixes
- **Service Status** — port/service table if present
- **Files Modified** — change log table if present

### Step 4 — Surface quick wins
If the handoff contains pre-written fix snippets (code blocks), explicitly flag them as "paste-ready" so the Pilot can execute immediately without re-reading the file.

---

## Notes
- `today` symlink in sovereign_inbox points to the current day folder — can be used as a shortcut
- Files dropped from Windows via Samba will appear here automatically once the share is mounted
- No write operations — this workflow is read-only
