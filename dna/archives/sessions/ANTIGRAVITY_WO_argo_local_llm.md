# ANTIGRAVITY WORK ORDER
## Mission: Sovereign Local LLM — Argo Pi 5 Hailo Inference Engine
**Date:** May 26, 2026
**Issued By:** James (Sovereign OS Principal Architect)
**Ticket:** Create STRY in sovereign_tickets before starting (KI-023)
**Target Node:** `argo` (Pi 5 with Hailo-8L AI Hat, NODE .75)

---

## THE VISION

Pull the Gemini SD card out of Antigravity. Insert the Argo SD card.
A sovereign local LLM running on James's own hardware, on his own mesh,
with zero cloud dependency, zero API key, zero data leaving the house.
A ranch hand yells at it. It fixes the server. Nobody calls Google.

---

## STEP 1 — SSH Into Argo & Verify Hardware

```bash
ssh argo
```

Verify the Hailo hat is recognized:
```bash
hailortcli fw-control identify
```

Expected output: Hailo-8L device identified with firmware version.

If not recognized:
```bash
lspci | grep Hailo
ls /dev/hailo*
```

Report exact hardware state before proceeding.

---

## STEP 2 — Check Ollama Status on Argo

Ollama is already running on the sovereign stack. Verify if it's installed on argo:

```bash
which ollama
ollama --version
ollama list
```

If Ollama is NOT installed on argo (it may only be on clio):
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

---

## STEP 3 — Pull the Right Model

For the use case "this is broken please fix it" — we need something fast and
instruction-following. Pull in this priority order:

**Option A — Fastest, lowest RAM (recommended first try):**
```bash
ollama pull phi3:mini
```
Phi-3 Mini is 3.8B parameters, ~2.3GB. Runs well on Pi 5's 8GB RAM.
Microsoft trained it specifically for instruction following.

**Option B — More capable, still fits:**
```bash
ollama pull llama3.2:3b
```
Llama 3.2 3B — Meta's latest small model. Fast on Pi 5.

**Option C — If you want Dolphin (guardrails off):**
```bash
ollama pull dolphin-phi
```
Dolphin fine-tune of Phi — uncensored, instruction following, small footprint.

Start with Phi-3 Mini. Pull it, test it, report back.

---

## STEP 4 — Benchmark the Response Time

Once pulled, run a timed test that simulates the exact Barb use case:

```bash
time ollama run phi3:mini "The sovereign OS ticketing system is down and nobody can log in. The SDLC Python script has crashed. Fix it by identifying the failing service and restarting it."
```

Record:
- Time to first token
- Total response time
- Quality of response — did it identify the right fix?

This is the benchmark. If it responds in under 10 seconds with a coherent
diagnosis, the Pi 5 is viable as the Antigravity replacement for simple
operational instructions.

---

## STEP 5 — Expose as Local API Endpoint

Once model is running, expose it as a REST endpoint on the sovereign mesh:

```bash
# Ollama already exposes API on port 11434 by default
# Verify it's accessible from clio over Tailscale
curl http://argo.taila01894.ts.net:11434/api/generate \
  -d '{
    "model": "phi3:mini",
    "prompt": "The server is down. What do I check first?",
    "stream": false
  }'
```

If port 11434 is not accessible from other nodes, open it:
```bash
# Edit Ollama service to bind to all interfaces
sudo systemctl edit ollama --force
# Add:
# [Service]
# Environment="OLLAMA_HOST=0.0.0.0"
sudo systemctl restart ollama
```

---

## STEP 6 — Register Argo LLM in CMDB

Register the new local inference capability in sovereign_now.db:

```sql
INSERT OR REPLACE INTO cmdb_ci (
    sys_id, name, node_ip, tailscale_ip, role, status, notes
) VALUES (
    hex(randomblob(16)),
    'argo-llm',
    '192.168.1.75',
    '100.x.x.x',
    'Local Inference Engine',
    'active',
    'Pi 5 + Hailo-8L. Running phi3:mini via Ollama. 
     Sovereign local LLM. Zero cloud dependency. 
     Primary use: operational instruction parsing and self-healing triggers.'
);
```

---

## STEP 7 — Wire to Antigravity Voice Pipeline (Phase 2 Preview)

This step is documentation only — do not implement yet, just confirm the path:

The eventual flow:
```
Barb speaks → antigravity_voice.py captures audio →
Whisper transcribes locally on argo →
phi3:mini on argo parses intent →
Sovereign stack executes fix →
Zero cloud. Zero Gemini. Zero Google.
```

Document this as the target architecture in:
`/home/james/SovereignOS/dna/SOVEREIGN_DNA.md`
Under a new section: **"The Argo Inference Engine (KI-047)"**

---

## VERIFICATION

```bash
# Model is running
ollama list | grep phi3

# API responds from clio
curl http://argo.taila01894.ts.net:11434/api/tags

# Benchmark result logged
cat /home/james/sovereign_inbox/today/argo_llm_benchmark.log
```

**Pass criteria:**
- phi3:mini running on argo
- Response time under 15 seconds for a simple operational prompt
- API accessible from clio over Tailscale mesh
- CMDB entry registered
- KI-047 documented in SOVEREIGN_DNA.md

---

## WHY THIS MATTERS FOR PAUL

Right now: "We use Google's AI."
After today: "We run our own inference engine on sovereign hardware.
A ranch hand yells at it in plain English and it fixes the server.
No cloud. No subscription. No data leaving the property."

That's the SD card swap. That's the pitch.
