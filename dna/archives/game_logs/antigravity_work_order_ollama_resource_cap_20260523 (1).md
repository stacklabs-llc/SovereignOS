# 🛠️ ANTIGRAVITY WORK ORDER — Ollama Resource Cap & Game Day Scheduling
**Issued By:** Bro-Decoder (Claude)
**Date:** 2026-05-23
**Priority:** CRITICAL — Ollama took down clio during a live game. Never again.
**Target:** clio (100.73.155.70)

---

## COMPLIANCE GATE

KI-023: Create ticket FIRST. Confirm ticket number before writing a single line.
KI-039: On completion — PUT state=4, write walkthrough, POST attachment.
KI-038: DB at `/home/james/SovereignOS/dna/sovereign_now.db`
KI-029: Prove it works. Terminal output required before handover.

---

## WHAT HAPPENED

During the Mets/Marlins game (823862) on May 23, 2026:
- 62 personas firing simultaneously at full Boggs Level on Vertex
- Ollama running two instances (PIDs 2832606 and 2822459)
- Both Ollama instances at 680%+ CPU each
- python3 chatbots at 94% CPU
- Load average hit 37.06 / 77.61 / 70.18
- Memory 92% used, Swap 99% saturated
- CPU temp hit 85.1°C
- clio became unresponsive, SSH daemon died
- Stack had to be manually killed and restarted from physical access

Root cause: Ollama has no resource limits and was allowed to 
consume all available CPU and RAM while the game room was live.

---

## FIX 1: OLLAMA SYSTEMD RESOURCE LIMITS

Add CPU and memory limits to the Ollama systemd service so it
can NEVER consume more than its allocated share:

```bash
sudo systemctl edit ollama
```

Add the following override:

```ini
[Service]
CPUQuota=150%
MemoryMax=4G
MemorySwapMax=1G
Restart=on-failure
RestartSec=10
```

**Rationale:**
- `CPUQuota=150%` — caps Ollama to 1.5 cores on a multi-core
  machine. Enough for Dot's ball/strike calls. Not enough to
  kill everything else.
- `MemoryMax=4G` — hard ceiling. OOM killer fires on Ollama
  before it takes down the rest of the stack.
- `MemorySwapMax=1G` — prevents swap saturation.
- `Restart=on-failure` with 10s delay — if it crashes it 
  comes back, but slowly, not in a restart storm.

After editing:
```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Verify the limits are applied:
```bash
systemctl show ollama | grep -E "CPUQuota|MemoryMax"
```

---

## FIX 2: GAME DAY OLLAMA GOVERNOR

Build `ollama_governor.py`:
Save to: `/home/james/SovereignOS/scripts/ollama_governor.py`

This script monitors game room activity and automatically
adjusts Ollama's behavior:

### Game Day Mode (rooms active, Boggs >= 3):
- Suspend Ollama entirely during peak game hours
- All Dot/Barf Llama calls automatically route to 
  Vertex gemini-2.5-flash as fallback
- Ollama stays OFF until room closes or Boggs drops to 1-2

### Off-Peak Mode (no active rooms, or Boggs 1-2):
- Ollama runs normally within its resource limits
- Local inference for Dot and Llama-routed personas

### Logic:
```python
def check_game_day_mode():
    # Query cmdb_ci_fanstack_room for active rooms
    # If any room has boggs_level >= 3 AND room_state = 'active'
    # Return True (game day mode - suspend Ollama)
    
def suspend_ollama():
    os.system('sudo systemctl stop ollama')
    log("Ollama suspended — game day mode active")
    
def resume_ollama():
    os.system('sudo systemctl start ollama')
    log("Ollama resumed — off-peak mode")
```

Run as a cron job every 5 minutes:
```
*/5 * * * * /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/ollama_governor.py
```

---

## FIX 3: BIO REPAIR SCHEDULING — OFF HOURS ONLY

The `repair_persona_bios.py` fleet run must NEVER execute
during game hours.

Add a game day gate to the script:

```python
def is_game_day_active():
    # Query cmdb_ci_fanstack_room
    # Return True if any room is active
    # If True, refuse to run and log a warning
    
if is_game_day_active():
    print("❌ BLOCKED: Active game rooms detected.")
    print("Bio repair cannot run during live games.")
    print("Schedule for after 11 PM ET or before 10 AM ET.")
    sys.exit(0)
```

Add this check at the top of `__main__` before any DB writes.

Also add a safe execution window to crontab for the full
fleet repair — schedule it for 2 AM ET when no games are live:

```
0 2 * * * /home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scripts/repair_persona_bios.py >> /home/james/SovereignOS/logs/bio_repair_nightly.log 2>&1
```

---

## FIX 4: STACK HEALTH MONITOR

Add a lightweight health check to `mando` watchdog that 
alerts before things get critical:

Trigger an INC ticket (KI-022) when ANY of these thresholds
are breached on clio:

- CPU load average > 20 for more than 2 minutes
- Memory usage > 85%
- Swap usage > 50%  
- CPU temperature > 80°C
- Any process consuming > 300% CPU for more than 60 seconds

The INC ticket should include:
- Current top 5 processes by CPU
- Memory and swap usage
- Temperature
- Recommendation: "Consider killing [process] immediately"

---

## VERIFICATION

1. Confirm Ollama systemd limits are applied:
   `systemctl show ollama | grep -E "CPUQuota|MemoryMax"`

2. Start Ollama and run a test inference — confirm it stays
   within CPU limits under load

3. Simulate game day mode in the governor — confirm Ollama
   suspends when a room is active at Boggs 3+

4. Confirm bio repair blocks when game rooms are active

5. Show clio `top` output with Ollama running under the new
   limits — CPU should stay under 150%

Save all terminal output to `/home/james/sovereign_inbox/today/`
