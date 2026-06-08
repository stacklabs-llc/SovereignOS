# Architectural Analysis & Resolution Report: Roster Grounding Alignment

## 1. Problem Statement: The Pete Alonso Mets Hallucination

During live game telemetry processing inside Scruffy's Tavern, the `dr_kosmos` chatbot persona (a designated Mets fan) responded to baseball events by asserting that Pete Alonso was still actively playing for and crushing hits for the New York Mets (`NYM`).

This assertion was factually incorrect: Pete Alonso had been traded to the Baltimore Orioles (`BAL`), as canonically represented in our `mlb_rosters` database. 

### The Root Cause
1. **Roster Gaps**: The chatbot engine's prompt builder (`build_dynamic_system_instruction` in `scripts/fanstack_chatbots.py`) was only fetching the active roster for the persona's designated team (`NYM`). 
2. **Context Vacuum**: Because Alonso was traded to Baltimore, he was absent from the Mets' active 40-man roster query results. 
3. **Pre-trained LLM Memory Fallback**: Lacking explicit real-time constraints regarding league-wide roster changes, the pre-trained LLM defaulted to its legacy historical knowledge base, hallucinating that Pete Alonso was still a member of the Mets.

---

## 2. High-Level Reasoning & Architectural Decisions

Our objective was to establish a solution that ensures absolute real-time factuality while maintaining clean, maintainable, and decoupled code.

### Phase 1: The Initial Approach (Rejected)
* **Design**: Prepend a static, hardcoded instruction warning specifically targeting Pete Alonso into the seeder templates and the prompt builder.
* **Why it was rejected**: Hardcoding player trades or specific athlete names directly into python codebases constitutes an architectural anti-pattern. A standard baseball season contains dozens of trades, injury listings, and roster shifts. Hardcoding these would lock the developer into a high-overhead maintenance loop, requiring code changes and service restarts on every roster event.

### Phase 2: Decoupled Database-Driven Architecture (Approved & Implemented)
* **Design**: Transition the grounding logic to a fully generic, database-driven design querying the `cmdb_ci_ghost_roster` configuration table.
* **High-Level Reasoning**: By using the database as the single source of truth for player departures, we completely decouple our application logic from real-world sports events. The python engine remains generic and reusable, reading "ghost rosters" (former players who left their home teams) directly from SQLite. This ensures that any subsequent trade or roster movement can be handled cleanly by updates to the database tables without modifying a single line of codebase logic.

---

## 3. The Implementation Details

### Database Schema Layer
We leverage the database schema in `/home/james/SovereignOS/dna/sovereign_now.db`:
* **`mlb_rosters`**: The master table of all active players, teams, positions, and jersey numbers.
* **`cmdb_ci_ghost_roster`**: The configuration table tracking departures that trigger fan bases.
  * `player_name`: The canonical name of the departed player.
  * `trauma_team`: The historical team they left (e.g., `NYM` for Pete Alonso).
  * `current_team`: Their new active team assignment (e.g., `BAL` for Pete Alonso).

### Chatbot Prompt Pipeline Integration
Inside `scripts/fanstack_chatbots.py`, the `build_dynamic_system_instruction` function was rewritten to perform the following steps dynamically:

```python
# 1. Fetch own team active roster
c.execute("""
    SELECT player_name, jersey_number, position 
    FROM mlb_rosters 
    WHERE team_abbr = ? AND status = 'Active'
    ORDER BY player_name ASC
""", (str(team_abbr).upper(),))
rows = c.fetchall()

# 2. Fetch all active players to check for mentions in the event/play text
c.execute("""
    SELECT player_name, team_abbr, position, jersey_number 
    FROM mlb_rosters 
    WHERE status = 'Active'
""")
all_players = c.fetchall()

# 3. Dynamic Former Player (Departures) Grounding
# Query the ghost roster for any players who previously played for our team but now play elsewhere
c.execute("""
    SELECT player_name, current_team 
    FROM cmdb_ci_ghost_roster 
    WHERE trauma_team = ?
""", (str(team_abbr).upper(),))
departures = c.fetchall()
```

### System Instruction Injection
The engine dynamically compiles these query results and prepends a rigid system instruction block to the LLM context:
* **Mentioned Players**: Any league-wide active player mentioned in the telemetry is explicitly grounded (e.g., *"Victor Robles (#10) is ACTIVE and plays for SEA. DO NOT refer to them as a member of your own team."*)
* **Departed Players**: Any player found in the `cmdb_ci_ghost_roster` for the persona's team is automatically injected as a critical negative constraint:
  ```markdown
  Departed/Former Players (No longer on your team):
  - Pete Alonso (#25) (1B) now plays for BAL. DO NOT refer to them as active members of your team under any circumstances.
  - Edwin Diaz now plays for LAD. DO NOT refer to them as active members of your team under any circumstances.
  ```

---

## 4. Verification & Scalability Results

This new architecture successfully handles the current roster anomaly and easily scales to support future roster shifts:
1. **Scale**: If Edwin Diaz, Brandon Nimmo, or Shohei Ohtani are brought up in ambient taverns, the bots dynamically adjust their prompts using the database.
2. **Maintenance**: Roster updates require zero python code edits or seed prompt alterations. Roster modifications are fully encapsulated inside database transactions.
3. **Execution**: The LLM prompt stays extremely lean, ensuring rapid response times while maintaining perfect, context-aware grounding.
