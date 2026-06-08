# 🎬 Session Handoff — [FEATURE / EPISODE NAME]
### Sovereign FanStack · [DATE] · Handed off by: [OUTGOING AGENT]

> **Context:** This session is ending due to context window size / fatigue / sortie departure.  
> The next agent should read this document FIRST before taking any action.

---

## 📍 What We Were Doing

<!-- 1-2 sentences on the mission this session -->
> e.g. *Standing up The Skew for Episode 1 of the post-game Mets degenerate panel.*

---

## ✅ What's Done & Ready

| Item | Status | Notes |
|---|---|---|
| [Component / Feature] | 🟢 Done | |
| [DB record / persona] | 🟢 Seeded | |
| [Bug fix] | 🟢 Fixed | |
| [Rule / Governance] | 🟢 Chiseled | `.windsurfrules` updated |
| [Ticket] | 🟢 Created | Ticket # and priority |

---

## 🔴 Still Open / Needs Attention

| Item | Priority | Notes |
|---|---|---|
| [Incomplete feature] | HIGH | What's missing |
| [Known bug] | MEDIUM | Repro steps |
| [Pending decision] | LOW | What the Pilot needs to decide |

---

## 🎙️ For The New Agent — What To Tell It

> *Copy-paste this into the new session as your first message:*

```
[PASTE EXACT AGENT BRIEFING HERE]

Example:
"Start The Skew for Episode 1. URL is https://sov73.taila01894.ts.net/?domain=SKEW&room=the_skew. 
Read the guide at /home/james/SovereignOS/dna/docs/ui_guides/the_skew_guide.md. 
Panel is pre-loaded: Dot, Barf, Terry, Scruffy, Uncle Stevie Stan, Wordy. 
Game 2 (COL vs NYM, gamePk 823637) is live. 
Topic: METS GAME 2 DOUBLE HEADER — ARE WE COOKED? 
Hit Build Panel & Kick Off. BatteryChucker is the surprise guest — hold him."
```

---

## 🗂️ Active Tickets (Check These First)

| Ticket | Description | Priority | State |
|---|---|---|---|
| [#STO-XXX] | [Short description] | [1-Critical] | [Open/WIP] |

---

## 🔑 Key Files Touched This Session

| File | What changed |
|---|---|
| `path/to/file.tsx` | [What was changed and why] |
| `path/to/file.py` | [What was changed and why] |
| `.windsurfrules` | [Which rules were added] |
| `dna/sovereign_now.db` | [Which records were updated] |

---

## 🌐 Critical URLs

| What | URL |
|---|---|
| Primary UI | `https://sov73.taila01894.ts.net/` |
| The Skew | `?domain=SKEW&room=the_skew` |
| Persona Center | `?domain=GLOBAL&room=employee_center` |
| Service Operations | `?domain=GLOBAL&room=sow` |
| Sovereign OS Portal | root URL |

---

## 📋 Rules Added This Session

| Rule # | Name | One-liner |
|---|---|---|
| Rule [XX] | [Name] | [What it mandates] |

---

## ⚡ Quickstart for New Agent

```bash
# Verify relay is running
ssh james@192.168.1.73 "ps aux | grep fanstack_relay"

# Verify chatbots are running  
ssh james@192.168.1.73 "ps aux | grep fanstack_chatbots"

# Check DB is alive
sqlite3 /home/james/SovereignOS/dna/sovereign_now.db "SELECT count(*) FROM sys_user WHERE active=1;"
```

---

*Handoff template · Rule 88 compliant · File at: `dna/docs/ui_guides/` or session artifacts*
*"A feature without a guide is vaporware. A session without a handoff is a memory leak." — Rule 88*
