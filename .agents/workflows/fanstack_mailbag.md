# /fanstack_mailbag — FanStack Gmail Context Sweeper

**Trigger:** `/fanstack_mailbag`

## Purpose
Reads and ingests unread emails from the **sovereign.fanstack Gmail account** — daily game promos, MLB news, team newsletters, bet alerts, and other baseball intelligence — then stages them as live context items for today's FanStack simulation personas.

This workflow is **NOT** for local file handoffs. For files dropped via the Samba inbox, use `/sovereign_inbox_read`.

---

## What This Is

| Attribute | Value |
|---|---|
| **Email Account** | sovereign.fanstack Gmail (configured in `.env` as `GMAIL_USER`) |
| **Script** | `scripts/gmail_promo_sweeper.py` |
| **Output — Staging File** | `scripts/promo_staging.json` — JSON array of all unread promos |
| **Output — Live Context** | `scripts/fanstack_live_context.txt` — injected into chatbot prompts |
| **Marks emails as:** | Read (IMAP `\Seen` flag) — will not re-process on next run |

The sweeper is also called as **Step 2** of `/fanstack_daily_prep` automatically. Use `/fanstack_mailbag` when you want to run the email sweep **in isolation** — mid-session updates, fresh promo drops, etc.

---

## Execution Protocol

### Step 1 — Run the sweeper
```bash
python3 /home/james/SovereignOS/scripts/gmail_promo_sweeper.py
```

### Step 2 — Verify the staging area
```bash
python3 -c "
import json
with open('/home/james/SovereignOS/scripts/promo_staging.json') as f:
    data = json.load(f)
print(f'{len(data)} items in staging.')
for item in data[-5:]:
    print(f'  [{item[\"headline\"]}] — {item[\"source\"]}')
"
```

### Step 3 — Deliver a context brief to the Pilot
After the sweep, report:
- **Total emails processed** this run
- **Top headlines** — subject lines and sender
- **Extracted highlights** — the `details` field (the regex-extracted promo content)
- **Context injection status** — confirm `fanstack_live_context.txt` has been updated
- **Persona fuel suggestions** — which personas should react to which promo (e.g., a Mets ticket deal → `7_train_terry` goes nuclear)

### Step 4 — Flag actionable intel
If any email contains:
- Postponement/weather alerts → escalate immediately, may affect `setup_all_rooms.py`
- Ticket promos, stadium specials → flag as ambient persona fuel
- MLB news (trades, injuries, suspensions) → flag as deep lore injection candidates

---

## Credentials
- `.env` file must have `GMAIL_USER` and `GMAIL_APP_PASSWORD` set
- Uses IMAP SSL to `imap.gmail.com` — no OAuth flow required with App Password
- If login fails: Google Account → Security → App Passwords → generate new token for "Mail / Linux"

---

## Relationship to /fanstack_daily_prep
`/fanstack_mailbag` is a **single-step extraction** of Phase 2 from the full daily prep sequence.
Run it standalone when:
- A fresh batch of promos dropped mid-session
- The daily prep already ran but new emails arrived
- You want to review context before persona deployment without running the full stack restart
