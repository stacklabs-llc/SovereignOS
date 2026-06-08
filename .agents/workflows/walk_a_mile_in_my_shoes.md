# Walk a Mile in My Shoes: Cross-Device UAT Verification Protocol

**Trigger Event:** Auto-triggered upon any change to a user-facing frontend component, portal dashboard, or remote kiosk view.

## The Problem
A UI that renders correctly on the Pilot's high-resolution desktop environment can easily break, overlap, or fail on mobile devices (Sean, Allyson), remote kiosk screens (Eileen), or remote desktop environments (Pawel). Assuming local visual correctness is a major vector for layout regressions.

## The Protocol Rules

1. **Remote Node Offloading (Zero-Local-Popup Mandate):**
   - The AI is strictly forbidden from spawning browser windows locally on the daily-driver laptop (`clio`).
   - UAT snapshot testing must be offloaded to remote Tailscale mesh nodes:
     * `metsy-prime`: Simulates Eileen's remote kiosk/TV interface.
     * `argo`: Simulates Pawel's or Sean's client views.
     * `clio` (Headless/Virtual only): Virtual frame capture for baseline validations.

2. **Persona-Based Token Injection:**
   - Visual regression testing must replicate the exact session permissions of the target user.
   - The AI must sign a temporary JWT session token for the target stakeholder (`sys_user`) using the core API secret.
   - The token must be injected as a query parameter (e.g. `?token=JWT_TOKEN`) to auto-authenticate the remote headless browser.

3. **UAT Snapshot Execution:**
   - Execute the CLI wrapper `python3 /home/james/SovereignOS/scripts/mile_in_my_shoes.py` with the target node and UI route:
     `python3 scripts/mile_in_my_shoes.py --node <node> --target <target> --user <stakeholder>`
   - The command will execute headless Chromium on the remote node, take a high-resolution screenshot, and securely retrieve it back to `/home/james/sovereign_inbox/uat_snapshots/`.

4. **Zero-Litter Clean-up Mandate:**
   - All captured UAT snapshots must be saved with unique, ticket-linked names (e.g., `uat_metsy-prime_savant-oracle_STRY-12345.png`).
   - Once verified, the screenshot should be attached to the SDLC ticket and any temporary files on the remote node or local inbox must be cleaned up post-haste.

## Implementation Standard
By executing the "Walk a Mile in My Shoes" protocol, the AI guarantees that no layout code is checked in without verifying that it renders cleanly across all device types and stakeholder profiles in the mesh network.
