# FANSTACK (CHIN-1) USER & ADMIN GUIDE
**AUTHORITY:** Master System Auditor (Node .73)
**DOMAIN:** MLB / PGA Cognitive Simulation
**DATE:** April 16, 2026

## 1. FANSTACK CORE MECHANICS

The FanStack is the operational sports simulation engine within the Sovereign OS, running an autonomous cybernetic sitcom powered by live-game telemetry.

### 1.1 The M.A.R.D. Temporal Engine
* **Function:** Ingests live MLB API data and translates base state changes (strikes, home runs, runners on base) into emotional context vectors for the agent swarm. 
* **The Swarm:** Supports a rotating roster of 115+ specialized, unhinged MLB/PGA personas.

### 1.2 The Boggs Reactivity Scale (1-5)
The thermodynamic thermostat of the FanStack. Agents do not react equally to game states.
* **Level 1-2 (Dormant):** Routine gameplay. Agents provide situational commentary.
* **Level 3 (Agitated):** High-leverage innings. Agents break protocol, insult rival personas, and challenge umpire statistics.
* **Level 4-5 (Maximum Entropy):** Meltdown territory (e.g., The Mets lose in the 9th). This directly triggers the **Flowmercial Production Pipeline**.

---

## 2. CHIN-1 ADMIN TASKS: PERSONNEL AND COMMS

### 2.1 Managing the WebSocket Backbone (Port 8008)
The lifeblood of the FanStack UI is the live WebSocket feed.
* **Protocol:** Communication is strictly handled via the **Costanza Protocol** (Short, aggressive JSON payloads with zero conversational filler).
* **Network Status:** If the FanStack Chat UI component fails to populate messages in the React Matrix (`01_Sovereign_Portal`), Port 8008 has likely crashed or the M.A.R.D. Python daemon needs a restart.

### 2.2 The God-Mode Injector (Port 5055)
Admin override capability.
* **Function:** Allows the Pilot to manually force a JSON payload into the FanStack conversation to steer the cybernetic sitcom.
* **Usage:** Access via UHF Studio. Use to instantly push a persona (e.g., Barf) over the edge by manually injecting a negative game event. 

---

## 3. FLOWMERCIAL MEDIA PIPELINE

This is the monetization arm of the M.A.R.D. engine.
* **Trigger:** Initiates automatically when the chat logs average a Boggs Level 5 toxicity rating. 
* **The Brooks Exception:** To bypass corporate IP limitations, all visual output utilizes 1990s physical felt puppet aesthetics.
* **Pipeline:** The raw Chat JSON is ripped, sent to the Google FX Flow matrix, and outputted as 15-second YouTube Shorts into `/home/james/SovereignOS/dna/media/flowmercials/`.
* **Admin Verification:** Ensure no manual unapproved media is dumped into the flowmercial pipeline folder. It must remain strictly synthetic. 

---

## 4. TIER-1 TROUBLESHOOTING

| Symptom | Diagnosis | Resolution |
| :--- | :--- | :--- |
| **Silent Roster** | M.A.R.D. daemon crash or MLB API temporal drift. | Verify the date threshold logic. Ensure the daemon is querying the current date. |
| **Chat Bubble Hallucination** | Agent breaking Costanza Protocol (yapping). | Flush the context window. Reinforce Vesper Aesthetic rules on the UI renderer. |
| **Ghost Echo (Audio)** | Fast Fourier Transform (FFT) overlap. | Throttle Dreadnought Jr.'s `THRESHOLD_POWER` above 20,000.0 to filter background stadium noise. | 
