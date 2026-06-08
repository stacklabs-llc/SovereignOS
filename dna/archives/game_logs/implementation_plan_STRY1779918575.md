# Implementation Plan — UAT Fleet Ingress Browser Audit (Ticket: STRY1779918575)

This implementation plan outlines the technical strategy for executing a complete, remote-user-aligned E2E browser verification audit of all 12 platform shortcuts in the Sovereign OS App Directory. 

In strict compliance with the **Eileen Remote Kiosk Rule (KI-043)** and the **Browser-Level TLS Verification Mandate (KI-044)**, this audit completely rejects backend loopback port testing in favor of active, headless browser navigation over the secure Tailscale MagicDNS network.

---

## User Review Required

> [!IMPORTANT]
> **Strict External DNS Navigation Only**
> All tests will be executed headlessly using Chrome over the MagicDNS tailnet address (`clio.taila01894.ts.net`), simulating a remote connection from Eileen's house. 
> 
> Plaintext HTTP endpoints accessed over HTTPS will trigger active browser SSL protocol failures (`ERR_SSL_PROTOCOL_ERROR`), which will be captured as true visual verification failures.

---

## Open Questions
* *None. The testing parameters, taxonomy definitions, and directory destinations are fully defined under KI-040, KI-043, KI-044, and KI-050.*

---

## Proposed Changes

We will create and run a headless Playwright automation script at `/home/james/SovereignOS/scratch/run_browser_audit.py` to systematically navigate to all 12 cards, check their rendering state, and capture an E2E screenshot for each.

### 1. Verification Target Mapping (12 Cards in `PortalApps.tsx`)

| Card ID | Service Name | Exact Target URL to Navigate | Expected Remote Browser Behavior |
| :--- | :--- | :--- | :--- |
| `fanstack` | FanStack | `https://clio.taila01894.ts.net:3009/` | Should negotiate secure TLS handshake and render FanStack Portal. |
| `sovereign_sports` | Sovereign Sports | `https://clio.taila01894.ts.net:3010/` | Will trigger connection refused (no daemon listening on port 3010). |
| `gardenstack` | GardenStack | `https://clio.taila01894.ts.net:3016/` | Will trigger `ERR_SSL_PROTOCOL_ERROR` because plaintext Vite server cannot resolve HTTPS on port 3016. |
| `samtracker` | SamTracker | `https://clio.taila01894.ts.net/sam/` | Will load, but renders Portal parent container instead of SamTracker (misrouted). |
| `bistro` | James's Bistro | `https://clio.taila01894.ts.net:8446/` | Will trigger connection refused (no daemon listening on port 8446). |
| `sovereign_cinema` | Sovereign Cinema | `https://clio.taila01894.ts.net/cinema-portal/` | *Audit check*: stand-alone is on port 3008, but Portal shortcut navigates internally to invalid room string `'sovereign_cinema'`, returning a blank screen. |
| `aethervet` | AetherVet | `https://clio.taila01894.ts.net:3015/` | Will trigger `ERR_SSL_PROTOCOL_ERROR` because plaintext port 3015 is queried over HTTPS (must use `:8443` or proxy). |
| `prospectus` | Investor Prospectus | `https://clio.taila01894.ts.net/?room=prospectus` | Renders internal slide deck presentation directly in the active Portal view. |
| `catnipwars` | Catnip Wars | `https://clio.taila01894.ts.net:7300/` | Should negotiate secure TLS handshake and render Syndicate Sandbox. |
| `highlight_heist` | Universal Media Ingestor | `https://clio.taila01894.ts.net/?room=highlight_heist` | Aggressively mounts internal 'Highlight Heist' room grid, violating decoupled bounds (KI-030). |
| `presence` | Telepresence Hub | `https://clio.taila01894.ts.net/?room=presence` | Renders internal live caller grid component directly in the Portal view. |
| `voice` | Voice Heal | `https://clio.taila01894.ts.net/?room=voice` | Renders internal natural-language recovery module inside Portal view. |

---

### 2. Browser Audit Automation Script (`/home/james/SovereignOS/scratch/run_browser_audit.py`)

To achieve authentic E2E network ingress testing, the audit script will **remotely orchestrate Chromium on the Raspberry Pi 3 (metsy-prime at 100.104.239.107 / 192.168.1.155)** over SSH, completely isolating the test client from Clio:

1. **Systematic SSH Navigation**: The script will loop through all 12 cards, remotely invoking `chromium` headlessly on `metsy-prime`:
   ```bash
   ssh james@100.104.239.107 "chromium --headless --disable-gpu --ignore-certificate-errors --screenshot=/tmp/<card_id>.png <exact_target_url>"
   ```
2. **True Ingress Validation**: Because the Pi 3 is a separate physical device on the Wi-Fi network, it must hit Clio's Tailscale interface across the local mesh network.
3. **Secure Copy Extraction**: For each card, the script will copy the captured screen from the Pi back to the Clio host:
   ```bash
   scp james@100.104.239.107:/tmp/<card_id>.png /home/james/sovereign_inbox/dashboards/audit_<card_id>_STRY1779918575.png
   ```
4. **Failure Analysis**: Detect connection time-outs, HSTS secure version errors, or blank pages, and map the tripartite state.
5. **Output Compilation**: Output a consolidated tripartite ledger at `/home/james/sovereign_inbox/reports/UAT_fleet_ingress_audit_AUTOMATED.md`.
6. **Zero-Litter Sync**: Auto-run `/home/james/SovereignOS/scripts/organize_inbox.py` to restore 100% amnesia-recovery cleanliness.

---

## Verification Plan

### Automated Verification
Run the remote browser audit script:
```bash
/home/james/SovereignOS/.venv/bin/python3 /home/james/SovereignOS/scratch/run_browser_audit.py
```

### Manual Verification
Review `/home/james/sovereign_inbox/dashboards/` containing the 12 screenshots taken directly on the Raspberry Pi 3, confirming exactly what is rendered over the network.

