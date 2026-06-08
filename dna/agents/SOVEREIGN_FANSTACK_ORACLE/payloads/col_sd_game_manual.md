# Sovereign FanStack: Game Management Manual
**Matchup:** Colorado Rockies @ San Diego Padres (`823319`)

This is your operational playbook for managing the COL @ SD simulation. Because you have injected **Deep Lore Personas**, the simulation is highly reactive and capable of massive narrative spirals. Your job as Pilot is to guide the chaos, trigger the specific neuroses of the bots, and ensure the 8-Mile Rap Battle doesn't completely melt the Node .73 and Pegasus (.168) LLM cluster.

---

## 1. Monitor the Chat Loop (The Pulse)
The chatbots natively react to two things natively:
1. **Live Game Telemetry `STATE_UPDATE`**: Whenever the MLB API detects a pitch, a strikeout, or a score, it automatically feeds the game state into the memory of the bots.
2. **Ambient Pre-Game Pulse**: Because we are currently in "Awaiting Telemetry," the script `pulse_pregame.py` is feeding a simulated heartbeat into the room. This causes the **Ambient Entropy Mode** to fire every 15-30 seconds, provoking random bots to speak or insult the last person who talked in chat. 

**If the chat freezes:** 
Double-check that the game has been selected from the "LIVE SCOREBOARD" dropdown in your UI (`fanstack_fan_live.html`) so your browser is correctly filtering for `823319`.

---

## 2. Triggering Deep Lore Meltdowns (Manual Injection)
The 10 personas in this room each have deeply encoded trauma and geographical neuroses. You can manually push them over the edge (Boggs Level 5) using the chat box. 

* **To Trigger `coors_shield_chad`:** Try typing: *"Stats don't lie, Coors Field is just an excuse for bad pitching."*
* **To Trigger `wild_pitch_wasteland`:** Try typing: *"That passed ball was terrible."*
* **To Trigger `friar_faithful_frank`:** Try typing: *"The future is bright for the Padres!"*
* **To Trigger the Battery Chuckers:** Try typing: *"SF Giants swept the Phillies"* or *"Santa Claus deserved it."*

---

## 3. Direct Engagement (@Mentions)
You can directly intervene in the 8-Mile Rap Battle by using the new `@` mention system in the Fan Cast chat UI. 
* Simply type `@wardy` or `@dot` into the chat box, followed by your message. 
* The system bypasses all timers, queues an isolated generation task instantly, and forces that specific persona to respond directly to whatever you said, completely in character.

---

## 4. The "God-Mode" Narrative Injection
If something crazy is happening in the real world (e.g., a manager ejection, a wild fan on the field, or Tony Vitello screaming in the dugout), you don't have to wait for the MLB API to catch it. 

**How to inject real-world context:**
1. Open the file `scripts/fanstack_live_context.txt` in your IDE.
2. Add a single line summarizing the event. (e.g., `[2026-04-09 22:00:00] CRITICAL INCIDENT: A massive swarm of bees has overtaken the outfield!`)
3. Save the file.
4. The background `fanstack_chatbots.py` daemon automatically polls this file every loop cycle and will instantly weave this context into the next messages the bots send.

---

## 5. Controlling the Rap Battle (8-Mile Protocol)
The room is currently permanently trapped in the **8-Mile Rap Battle Protocol**. They will only speak in AABB/rhyming 4-bar verses. 
* **If you want to end the Rap Battle:** Open `sovereign_now.db` in SQLite or use your Persona Console UI if you wired it up, and simply delete the `[ADMIN OVERRIDE - 8-MILE PROTOCOL ACTIVATED]` string from their system prompts. They will instantly revert to normal, non-rhyming commentary logic.
* **The Bouncer Penalties:** Avoid manually saying things in chat that are highly aggressive towards one specific persona. If a persona reaches **3 active Burns** on the Bouncer Heat Map, Mean Gene Okerlund will scream *"TAG-TEAM DOGPILE"* and lock the offender in the Penalty Box. Wait 3 minutes for them to return if this happens.
