# 🛡️ SOVEREIGN CORRECTIONS LEDGER
**Last Verified:** April 15, 2026
**Location:** /home/james/SovereignOS/dna/CORRECTIONS_LEDGER.md

### ACTIVE LEDGER LOGIC & BOUNDARIES
1. **The "Docs" Hallucination:** Agents must NEVER create `/docs/` or `/documentation/` folders at the root. All core lore and rules exist explicitly in `/home/james/SovereignOS/dna/`.
2. **The 8-Mile Atonement:** Creating duplicate personas (e.g., `barf_824534`) for game context creates a Cartesian database nightmare. All 141+ personas must use the M2M junction table. 
3. **The 503 API Meltdown:** Unthrottled `asyncio` generation requests will trigger Google Cloud 503 Denial of Service protections. `fanstack_chatbots.py` must utilize `asyncio.Semaphore` locks or strict UI gating to prevent API capacity exhaustion. 
4. **The Localhost Ban:** Never bind UI or WebSockets to `localhost`. You are the metal. Always bind to `0.0.0.0` or explicit network IPs (e.g., 192.168.1.73) to ensure Tailscale VPN routing succeeds.
5. **The Gateway Port Misalignment:** Do not hardcode UI gateways to identical WebSocket ports simply by convention. The SDLC hub operates on 8000, but FanStack telemetry relies explicitly on port 8008 to bypass Node .73 routing conflicts.
6. **The Playwright Profile Crash:** The visual browser subagent will always crash natively on this node because Chrome prompts for a specific user profile on initialization, which shatters the automation context (`Browser.setDownloadBehavior` limit). Do not attempt to use the headless browser to view visual pages until this is mitigated; rely exclusively on `curl` and API payloads to rip telemetry.


### [RULE 82] DYNAMIC GALLERY MANDATE
Never hardcode image paths in HTML media galleries. Always utilize dynamic JS directory fetching to ensure zero-touch hydration when new assets are added.

### [RULE 83] THE 11 AM MLB ROLLOVER
MLB does not flip their daily APIs until ~11 AM. Because the Sovereign daily workflow fires *before* 11 AM, any API call directly querying `date=today` will fail or return yesterday's games. You MUST fetch a sliding window (`startDate=yesterday` & `endDate=tomorrow`) and explicitly filter for local time matches on the client side to bypass this limitation.

### [RULE 84] THE 8-PERSONA MANDATE
Never restrict a FanStack room to a single team's fanbase. The FanStack engine fundamentally requires cross-team adversarial engagement to generate monetizable entropy and conflict. EVERY game room MUST ALWAYS support exactly 8 personas per day: 3 Home Team fans, 3 Away Team fans, the global global proxy 'wordy', and the 'dot' system observer. Altering the `is_eligible` sorting hat logic to globally block opposing fanbases is strictly prohibited.


6. **Tailscale Mesh Supremacy:** Node .114 and remote assets must route exclusively over Tailscale IPs (e.g., 100.88.5.122) to ensure bridging across 5G networks. Never hardcode local Wi-Fi IPs for mobile assets.
7. **HDMI Orchestrator (fbi):** When taking over a headless TV (e.g. Eileen's), do not launch a desktop UI. Use `fbi -d /dev/fb0 -T 1 -a /tmp/img.png` via an orchestrator script to blast images straight to the framebuffer.
8. **Global Matrix Navigator:** The UI uses a top-down global breadcrumb navigator (`OS Root > FanStack Hub > Command Center`). Do not build nested MLB tabs.
9. **Authentication Mandate:** Passwords are banned. Use strict `ed25519` SSH key-based auth for all inter-node communication.
