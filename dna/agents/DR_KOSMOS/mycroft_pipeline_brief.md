# MYCROFT BRIEF: "COULDA BEENS" DELIVERY PIPELINE

**To:** Mycroft (Project Management / Archival)
**Topic:** Pipeline Mechanics & Latency (Metal to Community)
**Architecture Type:** Temporal Media Generation
**Estimated Latency:** ~2 to 5 Minutes (from data ingestion to published video)

---

## 1. THE MECHANISM (How It Works)

The "Coulda Beens" pipeline combines your three massive datasets (Savant physics, Scorecards context, M.A.R.D. DVR streaming) with the AI reasoning mesh. It operates as a four-phase assembly line:

### Phase 1: Bare-Metal Ingestion (DVR Engine)
*   **Trigger:** Manual selection via Wardy Desk, or automated cron-job scheduling.
*   **Action:** The DVR Engine (`fancast_historical_injector.py`) pulls the granular Savant physics for a specific game and injects them pitch-by-pitch into the local Port 8008 WebSocket.

### Phase 2: The Variant Reaction (The Writers' Room)
*   **Trigger:** Automated.
*   **Action:** The chatbot daemons (Barf, Dot, Wardy) read the incoming DVR telemetry. Because their temperature is > 0.0, they dynamically generate variant reactions to the historical data. 

### Phase 3: The "Burn Score" Evaluation
*   **Mechanism (Manual Option):** You are watching the sandbox FanCast UI. A bot says something totally unhinged. You click a "Promote to Coulda Been" button on the UI, which ships that specific chat block to the renderer.
*   **Mechanism (Fully Automated):** A background script ("The Bouncer") constantly monitors the WebSocket chat stream. It runs sentiment analysis. If a message block crosses a strictly defined "Chaos/Burn Threshold" (e.g., maximum despair during a walk-off), The Bouncer *automatically* captures the transcript.

### Phase 4: The Brooks Render & Deployment
*   **Trigger:** Initiated by Phase 3. 
*   **Action:** The transcript is stripped of MLB IP and passed through The Brooks Exception framework. 
    *   **Audio:** ElevenLabs clones the specific persona's voice (e.g., Barf's panicked sobbing).
    *   **Visual:** Google Veo/Runway generates the 15-second visual of a felt puppet acting out the dialogue in a bar setting.
*   **Deployment:** The resulting `.mp4` is pushed directly to the `PROD` web server or published via social APIs.

---

## 2. LATENCY ANALYSIS (How Fast Is It?)

If you authorize the **Fully Automated Pipeline** (bypassing the Omega Gate for rendering), the timeline looks like this:

*   `T+00s`: DVR engine pushes walk-off telemetry to the mesh.
*   `T+12s`: Bots generate their panicked reactions.
*   `T+15s`: The Bouncer flags the reaction as a high-value "Coulda Been" and ships the payload.
*   `T+45s`: ElevenLabs returns the audio file.
*   `T+90s`: Veo/Video Engine completes the 15-second render.
*   `T+120s`: Script combines audio/video and pushes the `.mp4` to the live Fancast feed for the community to see.

**Conclusion:** 
You can practically deliver a "Coulda Been" video to the FanStack community within **2 to 3 minutes** of the event occurring on the M.A.R.D. simulation. 

It is a completely self-contained, frictionless, near real-time satirical content factory.
