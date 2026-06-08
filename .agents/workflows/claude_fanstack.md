---
description: The Architecture Restoration Prompt
---

# Role & Context
You are acting as a Senior Systems Architect and lead Python Engineer for SovereignOS. We are refactoring the FanStack live-ops sports telemetry engine on our primary bare-metal node (clio). 

The previous model implemented a superficial, token-burning "telemetry sieve" that completely violates our system efficiency invariants. I am providing you with our core architectural rules (SOVEREIGN_DNA.md) and the system audit report (fanstack_post_mortem.md). 

# Core Objective
Migrate the high-frequency Statcast telemetry pipeline from a brute-force memoryless prompt loop to a rigorous, low-latency Hot/Cold Storage Architecture. 

# Strict Architectural Constraints
1. NO VIBE CODING. You must reason through state management step-by-step.
2. Under no circumstances will you pass massive, repetitive, multi-game score histories or live play strings directly into the primary system context window on every high-frequency pitch event.
3. Completely decouple live operations from heavy database locks. Active game rooms must use localized file caching on disk.
4. All persona hot-takes must be driven by reading isolated, stateful local game documents via discrete tools or helper functions, rather than relying on global context.

# Step 1: Investigation & Discovery Task
Before writing or modifying any scripts, read the following local files on clio:
- `/home/james/SovereignOS/dna/SOVEREIGN_DNA.md` (To align with core node topologies and invariants)
- `scripts/fanstack_background_poller.py` (The active MLB StatsAPI ingestion script)
- `fanstack_chatbots.py` (The script handling persona generation and the broken prompt loop)
- `fanstack_post_mortem.md` (The full system failure report)

# Step 2: Deliverable Expectation
Do not immediately generate massive script rewrites. First, output a structured, multi-file engineering blueprint addressing the following three remediations:

1. HOT CACHE LAYER: How you will modify `fanstack_background_poller.py` to intercept the raw MLB `feed/live` JSON payload and smoothly serialize/append active game states directly to a local, isolated cache file on disk (`/home/james/SovereignOS/game_states/{game_pk}.json`) without dropping connections or leaking memory.
2. CONTEXT COLD-WAR: How you will strip the repetitive context-dumping logic out of `fanstack_chatbots.py` and implement a clean, lightweight Python function allowing the bots (Barf, FanStack, Dot) to dynamically pull historical inning context from that local JSON file ONLY when an event-driven hook triggers a hot-take generation request.
3. COLD DB INTEGRATION: How you will fix the schema initialization errors preventing `statcast_sentinel.py` from logging historical pitches into `sovereign_intelligence.db` post-game.

Acknowledge your understanding of these invariants, analyze the post-mortem, and present your file execution plan.