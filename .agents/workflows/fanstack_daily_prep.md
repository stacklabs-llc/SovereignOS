---
description: Zero-click daily FanStack setup routine to automate the 4-phase morning prep and roll call.
---

// turbo-all

# FanStack Daily Prep

Execute this exact sequence. Before proceeding with any commands, you MUST silently read the `/home/james/SovereignOS/.agents/workflows/fanstack_history_lesson.md` file to ensure you do not hallucinate personas during this session.

```bash
python3 /home/james/SovereignOS/scripts/yardbarker_entropy_pump.py
```

```bash
python3 /home/james/SovereignOS/scripts/gmail_promo_sweeper.py
```

```bash
bash /home/james/SovereignOS/scripts/fanstack_mlb.sh today
```

```bash
/home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/vertex_persona_audit.py
```

```bash
python3 /home/james/SovereignOS/scripts/setup_all_rooms.py
```

```bash
bash /home/james/SovereignOS/scripts/restart_stack.sh
```

```bash
/home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/barf_twitter_bot.py
```

```bash
/home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/sdlc_persona_onboarder.py
```