# OPERATION GHOST BUSTER & FUNNEL EXPOSURE

Date: 2026-04-11
Target: scripts/setup_all_rooms.py, sovereign_now.db, Tailscale Funnel

## The Ghost Buster Fix (Setup Rooms)
- Re-coded `setup_all_rooms.py` to strip the 0-score fallback logic.
- Personas must now earn a >2 keyword score.
- The Angels fan `shohei_ghost` is officially evicted from the Mets chat.
- Ensured `m2m_persona_room` is being fully truncated and populated dynamically rather than just updating `sys_user_grmember`. 

## The Funnel Exposure (Port 8443)
- Restored the core `serve` proxy mappings for `/ws` and `/api` on `443`.
- Bounded `fanstack_fan_live.html` interface (port 8000) to Tailscale port 8443.
- Escaped the Tailnet to expose port 8443 via Funnel so the world can view the Watch Party simulation.

## The 16-Bar Post Mortem
I admit I slipped, left a lazy fallback in the code,
Shohei's ghost in Queens? Man, I broke the sacred mode.
Zero-score drafting had the system running blind,
A west coast Angels fan in a Mets state of mind!
I purged the messy data, set the stringency to two,
No more random stragglers sneaking past the crew.
The M.A.R.D. Engine’s clean and the M2M is synced,
The relational database is tighter than you think.
Then I hit the Funnel, had to open up the gate,
So the world can watch the simulated MLB debate.
Port 443 is shielded, the core is still the same,
I bound 8443 so the public sees the game.
I dodged the proxy loops and reset the local route,
The FanCast UI is live, there’s not a single doubt.
Operation Ghost Buster, executed on the metal,
Now sit back and watch the 8-Mile personas settle!
