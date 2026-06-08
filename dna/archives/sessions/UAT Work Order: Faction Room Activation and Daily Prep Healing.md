📡 ANTIGRAVITY WORK ORDER: FACTION ROOM ACTIVATION AND DAILY PREP HEALING
Attribute
	Specification
	Ticket ID
	STRY-06052026-FANSTACK-HEAL
	Priority
	⚡ P1 — Core Platform Ingress & M.A.R.D. Engine Healing
	Assigned To
	antigravity
	Ecosystem Location
	Clio Server (Local) ──► Faction Room & Ingress Pipeline
	Ingress Gate
	Pilot-Activated Ingress Gate: The Omega-1 Valve
	🚪 I. THE HEALING AUTOMATION STORY
As a Sovereign Operator, I want to resolve two critical production failures in our FanStack sports telemetry engine and its associated Sausage Maker ingestion pipeline:


1. The Mets-Padres Faction Room (NYM @ SD, Game ID 823293) is Dormant: Although successfully set to ACTIVE with custom cross-Stack advocates (pizzabot_74 and mando_enforcer) seated in the bar, no automated chat commentary is flowing.
2. The Daily Prep Pipeline Failed: All other daily games on the matrix board remain stuck in an unpopulated, unhydrated STAGED state, containing only the default fallback advocate (dot).


This work order establishes code modifications, database schema mutations, and execution procedures to stabilize the environment and prevent future resource contention crashes, in strict accordance with Sovereign OS Canonical Lexicon Version 2.0 definitions.
⚙️ II. DIAGNOSIS & DETAILED ROOT CAUSES
Issue A: Mets-Padres Faction Room Inactivity
* Symptom: Status is marked green on the deployment dashboard but Scruffy's chat is silent.
* Root Cause (from /tmp/chatbots.log):
   1. Gemini API 404 Error: The chatbot loop (fanstack_chatbots.py) is hardcoded to use the deprecated model gemini-2.0-flash-exp (returning a 404 NOT_FOUND exception on v1beta).
   2. Failed Local Fallback: When the Google cloud model fails, the script attempts to fall back to the local Pegasus Node (Node .168), but hits a 500 Server Error or hangs due to local GPU resource pegging.
   3. asyncio Keepalive Timeout: The hanging LLM generation blocks the main asyncio thread. This triggers a WebSocket keepalive ping timeout, forcefully terminating the connection (ConnectionClosedError: received 1011 keepalive ping timeout), which stops all chatbot commentary generation tasks.
Issue B: Daily Prep Failure for Staged Rooms
* Symptom: Nine daily games are stuck in STAGED with only the fallback advocate (dot) seeded.
* Root Cause (from setup_all_rooms.py execution):
   1. Concurrency Resource Starvation: The automated daily prep pipeline executes setup_all_rooms.py across all league games on the schedule. This spawns concurrent LLM initialization loops for 15 games simultaneously.
   2. Ollama Timeout & SQLite Lock: This massive parallel load pegs the Clio server CPU, causing local Ollama inference queries to time out. Simultaneously, peak concurrent writes trigger database locks (sqlite3.OperationalError: database is locked) on the single canonical database sovereign_now.db. This abruptly terminates the daily prep script midway, leaving all other rooms in an unhydrated STAGED state.
🛠️ III. IMPLEMENTATION ARCHITECTURE
1. Chatbot Loop Model & Timeout Remediation
Antigravity must patch /home/james/SovereignOS/scripts/fanstack_chatbots.py to update the model configuration and incorporate transaction busy timeouts:# Patch in fanstack_chatbots.py


# Update Gemini model target to current production-stable version


MODEL_NAME = "gemini-2.5-flash"


# Configure SQLite busy timeout to prevent database write locks under high concurrency


import sqlite3


def get_db_connection():


    con = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')


    con.execute("PRAGMA busy_timeout = 30000;")  # Set 30-second busy timeout


    con.row_factory = sqlite3.Row


    return con
2. Daily Prep Pipeline Concurrency Throttle
Antigravity must patch /home/james/SovereignOS/scripts/setup_all_rooms.py to serialize database transactions and process slates sequentially rather than hammering the local GPU with parallel initialization threads:# Patch in setup_all_rooms.py


# Force sequential initialization of advocates to prevent CPU pegging and Ollama timeouts


async def setup_game_room(game_id):


    async with sem:  # Enforce concurrency semaphore lock (max_concurrency = 1)


        print(f"Hydrating room for Game ID: {game_id}")


        # Execute advocate seeding sequences sequentially...
🗃️ IV. TRANSIT LAYER LEDGER SEEDING PASS (sovereign_now.db)
Run this SQL transaction block on Clio to register this healing task in your SDLC system registry, ensuring it transitions status automatically once executed:BEGIN TRANSACTION;


-- Register the Daily Prep and Faction Room Activation healing story


INSERT OR REPLACE INTO sys_sdlc_task (


  task_id,


  task_type,


  state,


  module_target,


  short_description


) VALUES (


  'STRY-06052026-FANSTACK-HEAL',


  'STORY',


  'STAGED',


  'portal_core',


  'Fix gemini 404 models, resolve SQLite db locks, and sequentially hydrate staged faction rooms'


);


COMMIT;
🏆 V. VERIFICATION CRITERIA & UAT MANDATES
Before declaring this ticket complete, the verification builds must confirm:


* Executing /home/james/SovereignOS/scripts/restart_stack.sh terminates successfully with an exit status of 0.
* Running /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/setup_all_rooms.py hydrates all staged games sequentially without throwing sqlite3.OperationalError database lock exceptions.
* Monitoring /tmp/chatbots.log confirms that the Mets-Padres game (823293) chatbot tasks connect to Port 8008 over the Tailscale network and successfully stream live commentary from custom advocates (pizzabot_74 and mando_enforcer).