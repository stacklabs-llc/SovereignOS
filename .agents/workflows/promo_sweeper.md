# FanStack Promo Sweeper Protocol

**Description:** Automatically connect to the dedicated Sovereign.FanStack burner Gmail account, run the "Regex Chainsaw" to extract marketing cheese (dates, prices, buzzwords), and inject them directly into the Cosmic Sieve staging area (`promo_staging.json`).
**Trigger:** Manual invocation via `/promo_sweeper` or by simply asking the agent: "Check the fanstack email" or "Sweep the promo inbox."

## Workflow Mechanics

**Goal:** Automate the extraction of real-world baseball trivia, ticket sales, and sportsbook promos to feed directly into the FanStack chatbots via the Vesper Promo UI pipeline.

### Step 1: Execute the Sweeper
The agent runs the dedicated Python sweeper script. It accesses the inbox, parses unseen emails, extracts the juicy marketing details, marks them as read, and appends them to the JSON staging file.

// turbo
```bash
python /home/james/SovereignOS/scripts/gmail_promo_sweeper.py
```

### Step 2: Verification
The agent will confirm the output of the script to inform you accurately how many new promotional emails were successfully caught in the Sieve.

### Step 3: Triage Phase
Once the sweep is complete, the agent will remind you to open the **Promo Inbox UI** (`promo_triage_desk.html`) to review, Keep, or Trash the new promos before they are injected into the active game context.
