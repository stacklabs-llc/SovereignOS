# 📜 SOVEREIGN CORRECTIONS LEDGER
**Purpose:** Historical ledger of architectural sprints, incident reports, and system corrections.
**Sourced From:** Legacy SOVEREIGN_DNA.md Appendices.

---

### APPENDIX A: MAY 5, 2026 — EVENING SESSION HANDOFF SUMMARY

#### Infrastructure & Database
1. **`mlb_schedule` table** added to `sovereign_now.db`. Stores all 2,437 MLB 2026 regular season games (game_pk, game_date, home_team, away_team, venue, status). Seeded from MLB Stats API via `scripts/sync_mlb_schedule.py`.
2. **`sync_mlb_schedule.py`** — new script. Pulls full season or rolling window from `statsapi.mlb.com`. Supports `--today` (fast status refresh), `--days N` (rolling window), or no args (full season). **Must be added to `fanstack_daily_prep` BEFORE `populate_rooms.py` runs** to ensure Postponed games are excluded.
3. **`populate_rooms.py` refactored** — no longer calls MLB Stats API directly. Reads `mlb_schedule` filtered by today + non-Postponed status. Eliminates the Denver-class meltdown where persona rooms are spun up for rained-out games.
4. **`email` column** added to `sys_user` table.

#### API Changes (Port 8090 — Sovereign Core API)
5. **`/api/mlb/games`** — new endpoint. Returns today's games as `{ game_pk, label: "gamePk — AWAY @ HOME", ... }`. Supports `?date=`, `?days=N`, `?all=true`. Postponed/Suspended/Cancelled games excluded by default.
6. **`/api/auth/users`**, **`/api/auth/update_user`**, **`/api/auth/update_my_profile`** — `email` field now included in responses and update payloads.

#### UI Changes (01_Sovereign_Portal)
7. **User Management Console** — Rebuilt as ServiceNow two-panel layout. Left: compact scrollable user list (pilots + guests). Right: sticky profile editor always at viewport top (no scroll-back). Email field added. Tabs: Users | Create Guest.
8. **PersonaCenter — List View** — Deployment Zone column added. Double-click inline editing for Team (assigned_to), Zone (u_deployment_zone), and Status (active) — ServiceNow list view pattern. Zone is now a data-driven dropdown sourced from `/api/mlb/games` with a 📅 +7d toggle. Engine column marked deprecated (⚠, dimmed, read-only).
9. **PersonaCenter — Labels** — All `u_` prefixed field labels now display as human-readable names (`u_system_prompt` → System Prompt, `u_behavior_expectations` → Behavior Expectations, etc.). Any unknown `u_` field auto-strips the prefix. **DB column names are unchanged — this is UI display only.**
10. **Mass Update modal + Edit Persona drawer** — Fixed from `position: absolute` to `position: fixed`. Both are now always viewport-centered regardless of scroll position.
11. **ON AIR / CUT FEED buttons** removed from global header. Non-functional, consuming vertical space. Sim play/pause belongs in PlaycallDesk only.

#### Architecture Mandates Established This Session
- **`u_` naming convention deprecated for new columns.** Existing `u_` columns in `cmdb_ci_ai_persona` remain unchanged in the DB. All new columns use plain `snake_case`. This is a Sovereign OS standard — the ServiceNow `u_` prefix convention has no place here.
- **`SUBROUTINE_PERSONAS` guard in `populate_rooms.py`** is permanent. `mean_gene` and any future moderator subroutines must never be inserted into `sys_user`. They live exclusively in `cmdb_ci_ai_persona`.

#### Open Items Status (Updated May 6, 2026 — Post Desktop Sprint)
- **ADB Cast** ✅ RESOLVED — Both TVs authorized. `.68` (65") + `.111` (55") both show `device` status. ARP flush executed. ⚠️ Flush is session-only — `wlp3s0` WiFi on clio should be permanently disabled to prevent re-poisoning.
- **Room 824362 duplicates** — Moot. All rooms purged (DELETE FROM m2m_persona_room + cmdb_ci_fanstack_room) since games are over.
- **Rooms 823469, 823062, 825092** — Moot. All rooms purged.
- **APIARY_SOVEREIGN WiFi AP** ✅ RESOLVED — Actual profile name was `Apiary-Sovereign` (mixed case). `sudo nmcli con down + delete` executed successfully on argo.

---

### APPENDIX B: MAY 5–6, 2026 — OVERNIGHT SPRINT HANDOFF SUMMARY

#### Critical Pipeline Bug Fixes (fanstack_chatbots.py + deploy_game_room.py)

**BUG 1 — The Silent m2m Miss (RESOLVED):**
`load_fans()` in `fanstack_chatbots.py` line 109 was joining `m2m_persona_room` on `sys_user.user_name = m2m.persona`. The `m2m_persona_room.persona` column stores `sys_user.sys_id` (UUID), not `user_name`. This caused a silent miss — all room-specific persona assignments were invisible to the chatbot. It fell through to team/global eligibility only. **Fix:** Changed join to `s.sys_id = m2m.persona`.

**BUG 2 — The Nuclear sys_user Wipe (RESOLVED):**
`deploy_game_room.py` executed `UPDATE sys_user SET active = 0` on every room deployment, killing all personas system-wide before re-activating only its own hardcoded selection. This silently deactivated any persona not in the deploy script's list on every relay call. **Fix:** Removed the nuclear wipe. Script now only activates selected personas without touching others.

**BUG 3 — The Hardcoded Wardy+Dot Injection (RESOLVED):**
`deploy_game_room.py` hardcoded `wardy` and `dot` into `selected_personas` for every room regardless of m2m config. Additionally, m2m inserts used `user_name` strings as the persona key, conflicting with the sys_id-based join. **Fix:** Removed hardcodes. Script now resolves `sys_user.sys_id` before inserting into m2m, ensuring consistency with chatbot join logic.

#### Architecture Rule Established

**RULE 30 (The m2m_persona_room Keying Mandate):**
`m2m_persona_room.persona` stores `sys_user.sys_id` (UUID). Any script inserting into this table MUST resolve the `sys_id` from `sys_user` first — NEVER write a `user_name` string directly into the `persona` column. Any join against this table MUST use `sys_user.sys_id`, not `sys_user.user_name`. Violating this produces silent misses — the chatbot loads zero room-assigned personas with no error, making the bug extremely difficult to diagnose.

#### Persona Recovery Protocol Established

**Source of Truth for Persona Lore:** `/home/james/SovereignOS/staging/deep_dive_vault/Sovereign_Knowledge_Omnibus.md`
This file contains the complete character lore (system prompt, behavior expectations, governance boundaries) for all 115+ Sovereign personas. When `u_behavior_expectations` and `u_governance_boundaries` are blank in the DB (mass wipe event), this file is the recovery source. Do NOT use LLM-generated content to rebuild persona profiles — use only the Omnibus as the source.

#### ATH Team Status
- Team abbreviation is `ATH` (not `OAK`) in all Sovereign systems.
- MLB Stats API still returns `OAK` in some telemetry — this is expected. Do NOT change the API filtering logic.
- `PersonaCenter.tsx` MLB_TEAMS arrays updated from `OAK` → `ATH` at lines 122, 1169, 1230.
- **Tech Debt:** These arrays are still hardcoded. Correct fix is `GET /api/teams` endpoint querying `SELECT DISTINCT assigned_to FROM cmdb_ci WHERE sys_class_name='cmdb_ci_ai_persona'`. Tracked, not yet implemented.

#### Room 823469 (ATH @ PHI) — Provisioned
Personas active as of session close:
- ATH: `coliseum_ghost`, `drum_banger_510`, `moneyball_purist` (full profiles rebuilt from Omnibus)
- PHI: `phanatic`, `battery_chucker`, `2008_ghost` (intact)
- Global: `coach_shrubbs`, `dot`, `possum_protector`, `roof_status_ricky`

#### Open Items Status (Updated May 6, 2026 — Post Desktop Sprint)
- Rooms 824682 (CIN@CHC) and 824200 (LAD@HOU) — m2m entries purged (games over). Persona profiles still exist in CMDB but inactive.
- LAD zero intact persona profiles — still needs Omnibus rebuild before next LAD game room.
- `uncle_stevie` display name mismatch — `user_name` is `uncle_stevie_stan`, displays as "Uncle Stevie" — still open.
- Remaining 4 ATH personas — `u_behavior_expectations` / `u_governance_boundaries` still need Omnibus rebuild.

---

### APPENDIX C: MAY 6, 2026 — JAMES' BISTRO PORTAL SPRINT

#### New Sovereign Service: James' Bistro Portal
- **File:** `/home/james/SovereignOS/bistro_menu.html`
- **Served from:** `clio` Python HTTP server, **Port 8777** (must always be running)
- **Kitchen Cam:** `clio` argus_streamer.py, **Port 8083**
- **Architecture:** Single page on clio. Any family device on Tailscale loads the URL directly. No per-device server stacks needed.

**URL params:**
- `?mode=hobbes` → top cam = hobbes:8081, bottom = clio:8083, greeting = Eileen
- `?mode=grogu` → top cam = grogu:8081, bottom = clio:8083, greeting = Barb
- `?name=X` → overrides greeting name dynamically

#### Pi Zero 2W Display — Framebuffer Method (Pi OS Lite)
Both Pi Zero 2W units run Pi OS Lite (no desktop environment).

**Proven working pipeline:**
```bash
# 1. Screenshot from clio's live browser
DISPLAY=:0 XAUTHORITY=/home/james/.Xauthority import -window root /tmp/bistro_shot.png
# 2. Push to Pi
sshpass -p '!!Stella1977' scp /tmp/bistro_shot.png james@hobbes:/tmp/bistro_shot.png
# 3. Write to 16bpp framebuffer (NO BLINK)
sudo ffmpeg -y -i /tmp/bistro_shot.png -vf scale=1920:1080 -pix_fmt rgb565le -f rawvideo pipe:1 2>/dev/null | sudo dd of=/dev/fb0 bs=4096
```
- Pi framebuffer = **16bpp rgb565le**. This is the only format with correct colors.
- `fbi` in a loop causes blinking — use ffmpeg+dd for clean single writes.
- `/tmp/` clears on Pi reboot — always re-SCP the image first.

**For live browser on Pi:**
```bash
sudo startx /usr/bin/chromium --no-sandbox --kiosk 'http://100.73.155.70:8777/bistro_menu.html?mode=hobbes' -- :0 vt1
```
- `xinit` and `chromium` installed on hobbes and grogu.
- Pass chromium directly to startx — no `.xinitrc` required.
- Must use `--no-sandbox` when running as root.

#### Port Registry Additions
- **Port 8777:** James' Bistro HTML portal (clio, permanent)
- **Port 8083:** Clio kitchen MJPEG cam (permanent)
- **Port 8081:** Pi webcam stream (hobbes/grogu, on-demand)

#### New Rules
**RULE 31 (Bistro Simplicity):** Bistro portal lives on clio:8777. Any family member on Tailscale loads it in a browser. Use `?mode=` and `?name=` params for personalization. Do NOT deploy per-device servers.

**RULE 32 (Pi Framebuffer Standard):** For Pi OS Lite kiosk display: `ffmpeg -pix_fmt rgb565le | dd of=/dev/fb0`. Verify 16bpp via `/sys/class/graphics/fb0/bits_per_pixel` first. Never use `fbi` in a loop.

**RULE 33 (Human URL Mandate):** Never expose raw Tailscale IPs or ports to non-technical family members (Eileen, Barb). All consumer-facing access must use a human-readable domain. **Domain purchase for Sovereign OS / FanStack / Bistro is a high-priority next action.**

---

### APPENDIX D: MAY 6, 2026 — DESKTOP SPRINT HANDOFF SUMMARY

#### SDLC Infrastructure (MAJOR — New This Session)
1. **Git initialized** on `/home/james/SovereignOS`. Initial commit `b24389c` = T=0 baseline.
2. **4 git worktrees** created:
   - `/home/james/SovereignOS` → `main` (Prod — never commit directly)
   - `/home/james/SovereignOS-dev` → `dev` (Claude Dev/UAT work)
   - `/home/james/SovereignOS-uat` → `uat` (awaiting promotion from dev)
   - `/home/james/SovereignOS-sandbox` → `sandbox` (Gemini only)
3. **Dev branch has 4 commits** pending UAT promotion:
   - `b24389c` — T=0 baseline
   - `673c8e7` — refactor: archive graveyard
   - `a705409` — feat: sovereign inbox processor
   - `f206ee4` — feat: SDLC promotion scripts + DNA Rules 31 & 32
4. **`scripts/promote.sh`** — ServiceNow Update Set equivalent. Enforces dev→uat→main path. `PILOT=true` required for uat→main gate. Logs to `rm_story` SDLC table.
5. **`scripts/clone_db.sh`** — Instance clone equivalent. Downward-only. Cannot clone TO `sovereign_now.db`.
6. **`scripts/inbox_processor.py`** — End-of-day file router. Routes 1,237+ historical files from `sovereign_inbox/` to correct destinations.

#### Sovereign Inbox (NEW)
- **`/home/james/sovereign_inbox/`** — replaces `dna/dropzone/` permanently. Lives OUTSIDE git repo.
- `today/` → symlink to current day folder (e.g., `daily_05062026/`)
- `processed/` → routing reports
- `needs_review/` → unclassified files
- `dna/` shrank from 23G → 7.7G. 16G moved to sovereign_inbox.
- Run `python3 /home/james/SovereignOS/scripts/inbox_processor.py` at session end (part of shutdown workflow).

#### Root Cleanup
- 837 files moved to `SovereignOS-dev/_archive/` on dev branch. Nothing deleted (Rule 13).
- Archived: `DEV/`, `PROD/`, `UAT/`, `sandbox/` (superseded by git worktrees), `scruffys_bar_ui/`, `FanCast/`, `sam-tracker-v2/`, `Kids_Daily_Adventures/`, `docs_archive/`, loose root scripts.

#### API + Frontend
- **`GET /api/teams`** — new endpoint on port 8090. Returns 30 clean MLB team codes filtered from `cmdb_ci.assigned_to`. Live and verified.
- **`PersonaCenter.tsx`** — All 4 hardcoded `MLB_TEAMS` arrays (lines 122, 939, 1169, 1230) replaced with dynamic `mlbTeams` state from `/api/teams`.

#### Bistro Kiosk — Full Deployment
- **`bistro_menu.html`** supports `?mode=hobbes` (Eileen), `?mode=grogu` (Barb), `?name=X` (override greeting).
- **Cam ports:** `hobbes:8081` (argus_fix.py, cv2), `clio:8083` (clio_mjpeg.py, ffmpeg+flask).
- **Proven Pi delivery:** `ffmpeg -pix_fmt rgb565le | dd of=/dev/fb0` (Rule 32). Used for Eileen's TV.
- **`xinit` + `chromium-browser`** installed on hobbes + grogu via apt.
- **hobbes** — Eileen's TV confirmed displaying Bistro page ✅. Mission success.

#### Network Updates
- `argo` hostname: `sudo hostnamectl set-hostname argo` executed. Router DHCP still shows "hq" — physical hostname is correct, router entry is cosmetic.
- New local IPs confirmed: `grogu` = `192.168.1.154`, `calvin` = `192.168.1.152`.

#### Dual-Brain SDLC Architecture (New Mandate — Not Yet Implemented)
- **Claude (Antigravity)** = Dev + UAT. Operates on `dev` branch.
- **Gemini (Antigravity, separate window)** = Sandbox only. Operates on `sandbox` branch. Gets stripped DNA (`SOVEREIGN_DNA_SANDBOX.md`) — no prod credentials.
- Promotion gate: James reviews → `promote.sh`. NO Gemini output goes to `main` without Claude review + Pilot approval.
- **Sandbox DNA doc not yet created** — high priority next session.

#### Open Items for Next Session
- **`promote.sh dev uat`** → then `PILOT=true ./scripts/promote.sh uat main` — needed to land cleanup + SDLC scripts in Prod.
- **`wlp3s0` on clio** — WiFi NIC should be permanently disabled to prevent ARP cache poisoning of TV IPs.
- **grogu bistro kiosk** — `startx` installed, `argus_fix.py` + `.xinitrc` + autologin configured but auto-launch not confirmed. Test: SSH to grogu → `startx`. If fails, `sudo raspi-config nonint do_boot_behaviour B4`.
- **`clio_mjpeg.py` (port 8083)** — runs from `/tmp/` (cleared on reboot). Needs permanent location (`scripts/clio_mjpeg.py`) + systemd service.
- **Domain purchase** — Pilot approved. Buy domain for Sovereign OS / FanStack / Bistro. High priority.
- **Sandbox DNA doc** — Create `SOVEREIGN_DNA_SANDBOX.md` stripped of prod credentials for Gemini.
- **Gemini SDLC briefing doc** — Pilot intended to brief Gemini on its sandbox role. Not yet created.
- **LAD persona profiles** — Still zero intact profiles. Needs Omnibus rebuild before next LAD game room.
- **`uncle_stevie` mismatch** — `user_name` = `uncle_stevie_stan`, display = "Uncle Stevie" — still open.
- **4 ATH personas** — `u_behavior_expectations` + `u_governance_boundaries` need Omnibus rebuild.
