# THE FANSTACK HISTORY LESSON (ANTI-HALLUCINATION PROTOCOL)

**MANDATORY REFERENCE FOR AGENTS:**
If you are attempting to configure, deploy, or create content for FanStack personas, you MUST read this file. 
If you try to generate profiles for "Grimace" or "Eeyore", you have failed the protocol. Read this immediately.

## 1. The Core Infrastructure
FanStack is a Sovereign OS application that simulates live sports Watch Parties by utilizing dynamic, multi-agent LLM personas. These personas react to real-time telemetry (like Statcast MLB data) in character. 

**THE GOLDEN RULE:** Personas are **NOT** hardcoded. They are stored in the `sovereign_now.db` SQLite database under the `persona` table. You must **NEVER** guess or hallucinate a persona's name. You must query the database.

*Query Example:* `sqlite3 /home/james/SovereignOS/sovereign_now.db "SELECT user_name, display_name FROM persona WHERE team = 'NYM';"`

## 2. The Official Roster (The Truth)
As of the current database state, here are the actual, verified personas existing in the system. 

### The New York Mets (NYM)
*   **barf** (Barf Fan): "Just a dog trying to explain sports misery to billionaires."
*   **7_train_terry** (Terry 7 Train): "Riding the 7 train to Citi Field since day one. Seen it all, mostly the bad." Gritty, long-suffering.
*   **uncle_stevie_stan** (Stan - Chairman Steve's Disciple): Fanatical devotion to Steve Cohen. Hates Citizens Bank Park. Has PTSD from blown saves.

### The San Diego Padres (SD)
*   `Tacos_N_Tatis`
*   `Gaslamp_Goon`
*   `Friar_Frank`
*   `Slam_Diego_Surfer`
*   `Gwynn_Ghost`
*   `Petco_Paul`
*   `Cronenworth_Crusader`

### The Colorado Rockies (COL)
*   `Mile_High_Mike`
*   `Dinger_Diehard`
*   `Coors_Crusher`
*   `LoDo_Larry`
*   `Altitude_Sickness`
*   `Blake_Street_Bob`
*   `Rock_Pile_Randy`
*   `Mountain_Man`

### The Golf Room (The Masters Simulation)
*   `SlopeMatrix (G.J.)`
*   `The Traditionalist`
*   `The Gambler`
*   `The Breakfast Specialist`
*   `The Defector`
*   `Coach Shrubbs`
*   `Cap Peterson`

*(There are also generic global entities like Scruffy, Mean Gene, Dot, and Taylor Word, as well as personas for virtually every MLB team).*

## 3. The X (Twitter) Strategy (2026 Algorithmic Warfare)
*   **The Sock Puppet Network:** We create distinct X accounts for the core Mets personas (`@BarfFanStack`, `@7TrainTerry_NYM`, `@UncleStevieStan`).
*   **The Quote Tweet Engine:** The main Sovereign FanStack account Quote Tweets the personas to drive immediate algorithmic engagement.
*   **No Automation:** Because the X API is prohibitively expensive, the Agent generates the content locally, and the Pilot acts as the "Meat Router" to manually post it.
*   **Tagging & Hashtags:** All posts must aggressively tag target accounts (like `@Mets`) and use ecosystem hashtags (`#LGM`, `#MetsTwitter`) to force visibility. **CRITICAL:** Always tag `@WardyNYM` and `@TheWardyNYM` in posts.

**FINAL WARNING:** If you are asked to generate a persona tweet, DO NOT hallucinate. Look at this file, or query the `persona` table in `sovereign_now.db`.
