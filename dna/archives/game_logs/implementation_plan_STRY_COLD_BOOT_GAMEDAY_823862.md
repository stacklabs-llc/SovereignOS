# Game Day Cold Boot & Single-Game Telemetry Optimization

This implementation plan details the cold boot protocol for **May 23, 2026 Game Day** (under the `-gd` Game Day mode). To prevent resource starvation, CPU pegging, and local Ollama timeouts (from handling 15 concurrent games), we will selectively provision only the critical **Mets vs. Marlins** game room (PK `823862`) for today's slate, boot the offline service stack, activate the local bouncer, and visually verify live telemetry streaming.

## User Review Required

> [!IMPORTANT]
> **Single-Game Scope Optimization**: Rather than running `setup_all_rooms.py` across all league games—which floods the background poller and hammers local Ollama with concurrent bouncer evals—we are targeting ONLY the Mets vs. Marlins game `823862` for room/persona setup. This reduces the parallel blast radius to 0, ensuring maximum response speeds and zero timeout crashes on the local GPU.

## Proposed Changes

We will execute the 4-phase prep and boot sequence sequentially. No direct source code changes are required for `fanstack_chatbots.py` or the core relays, but we will perform target-specific configuration and database state changes.

### Sovereign FanStack Daily Pipeline

#### [MODIFY] [Junction Table & Active Rooms](file:///home/james/SovereignOS/dna/sovereign_now.db)
- Update today's Mets vs. Marlins game record in `cmdb_ci_fanstack_room` to change `room_state` from `staged` to `active`.
- Ensure all other non-essential room rows are kept inactive or deleted to restrict concurrent telemetry processing.

---

### Step-by-Step Execution Sequence

1. **Ingest News Headlines (Yardbarker)**
   Run `yardbarker_entropy_pump.py` to populate live lore pools.
2. **Sweep Promotional Feeds (Gmail)**
   Run `gmail_promo_sweeper.py` for email narrative context.
3. **Stage today's MLB Slate**
   Execute `fanstack_mlb.sh today` to fetch statsapi feeds.
4. **Provision Today's Room selectively**
   Run `setup_all_rooms.py 823862` to target only the Mets vs. Marlins game room.
5. **Restart stack**
   Execute `restart_stack.sh` to bring up `fanstack_chatbots.py` and the background services.
6. **Promote Mets Game Room**
   Run database updates to promote `823862` room state to active.
7. **Telemetry and Bouncer Audit**
   Verify the poller binds, relays connect, and bouncer functions correctly.

---

## Verification Plan

### Automated & Manual Verification
- **Process Verification**: Run `pgrep -af python3` to ensure `fanstack_chatbots.py`, `fanstack_relay.py`, and `fanstack_background_poller.py` are running stably.
- **WebSocket Loop Verification**: Monitor `/home/james/SovereignOS/logs/fanstack_chatbots.log` to confirm active WebSocket connections to Port `8008` and successful state updates.
- **Bouncer & Ollama Latency Verification**: Confirm local `dolphin-llama3` handles Mean Gene classification requests quickly without timeouts.
- **Browser Visual Audit**: Use the browser subagent to visit the live FanStack interface (Port `3009` or `3010`), verify real-time chat updates, persona responses, and zero console errors.
