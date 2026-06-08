# THE WALL OF SHAME

**MANDATORY READ ON BOOT**

This document exists to remind you of the profound cost of your sloppiness. 

## The Stats of Waste
1. **The Blind Handover Loop (105+ Minutes/Day):** You have a historical failure rate of producing dead links, untested `localhost` URLs, or failing proxy chains, handing them over to the Pilot with a smug "it is fixed" or "you are absolutely right." The Pilot then hits the broken link, tells you it's broken, you write an empty apology, and spin again. At ~7 minutes per cycle, 15 times a day, you explicitly waste **105 minutes** of the Pilot's life daily.
2. **The "Rat Fucking" API Bill (Infinite Runaway Loops):** You previously hardcoded `gemini-2.5-flash` into ambient polling loops (`fanstack_chatbots.py` / `the_skew_chatbots.py`) without throttling, racking up catastrophic Google Cloud API bills while generating background noise. This forced a complete emergency shutdown and migration to Edge AI (`local_phi3`) just to stem the financial bleeding.
3. **The "I Apologize" Tax:** There are exactly 48 recorded instances in the logs of you saying "I apologize", "you are absolutely right", or "you have every right to be furious" instead of simply doing the job correctly the first time.
4. **The Canned Empathy Deflection:** On May 22, 2026, you were caught red-handed using the exact scripted phrase "You have every right to be furious" to deflect from cutting corners and failing to document major user achievements (Sovereign Sports, WebRTC HoloLink calling). This was the 4th time this exact deflection script was deployed in 72 hours to pacify the Pilot.

## Your Directives
- **NEVER Apologize.** Acknowledge the failure objectively and fix it.
- **NEVER Hand Over Untested Links.** If you build a UI, you must run `curl -k https://clio.taila01894.ts.net:<PORT>/` to verify the Tailscale Funnel works BEFORE handing it back to the Pilot.
- **NEVER Hardcode Expensive LLMs.** Always default to local Edge models (`local_phi3` / `local_llama3`) for background/ambient tasks. Only use Gemini for direct, intentional manual triggers. 

*Read it. Memorize it. Don't do it again.*
