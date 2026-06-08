# 🧪 UAT Ingress Audit Ledger — Fleet-Wide Ingress Assessment
Generated dynamically by the Antigravity automated dynamic network mesh probe sweep.

## 1. Executive Summary
A fleet-wide dynamic ingress audit was conducted over the secure private Tailscale MagicDNS network (`clio.taila01894.ts.net`). A tripartite truth-map taxonomy has been compiled to classify the 12 platform shortcuts registered in the App Directory. Under KI-030, any independent micro-frontend nested within the parent portal dashboard wrapper is classified as MISROUTED to ensure decoupling compliance.

## 2. Ingress Taxonomy Mapping
| Service Name | Configured Target URL | Port / Route Status | Tripartite Classification | Detail & Operational Rationale |
| --- | --- | --- | --- | --- |
| FanStack | `https://clio.taila01894.ts.net:3009/` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, remaining properly bounded inside its standalone micro-frontend environment. |
| GardenStack | `http://clio.taila01894.ts.net:3016/` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, remaining properly bounded inside its standalone micro-frontend environment. |
| SamTracker | `https://clio.taila01894.ts.net/sam/` | HTTP 200 | **MISROUTED** | URL points to /sam/ which returns HTTP 200 OK, but serves the unaligned main portal parent container HTML instead of proxying to the standalone SamTracker Vite app on port 3004. |
| James's Bistro | `https://clio.taila01894.ts.net:8446/` | HTTP N/A | **DEAD LINK** | Connection attempt refused because no active listener daemon is running on this port. |
| Sovereign Cinema | `https://clio.taila01894.ts.net/cinema-portal/` | HTTP 200 | **MISROUTED** | Stand-alone Vite server on port 3008 is healthy, but the portal shortcut click handler is hard-coded to navigate to 'sovereign_cinema' internally, which is an invalid/unmapped room name, resulting in a blank screen. |
| AetherVet | `https://clio.taila01894.ts.net:8443/` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, remaining properly bounded inside its standalone micro-frontend environment. |
| Investor Prospectus | `https://clio.taila01894.ts.net/?room=prospectus` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, functioning as a legitimate internal portal view layout component. |
| Sovereign Sports | `https://clio.taila01894.ts.net:3010/` | HTTP N/A | **DEAD LINK** | Connection attempt refused because no active listener daemon is running on this port. |
| Catnip Wars | `https://clio.taila01894.ts.net:7300/` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, remaining properly bounded inside its standalone micro-frontend environment. |
| Universal Media Ingestor | `https://clio.taila01894.ts.net/?room=highlight_heist` | HTTP 200 | **MISROUTED** | Universal Media Ingestor card bypasses independent port boundaries and aggressively mounts the internal 'Highlight Heist' room view directly on the active layout screen, violating KI-030 (Decoupled Architecture Mandate). |
| Telepresence Hub | `https://clio.taila01894.ts.net/?room=presence` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, functioning as a legitimate internal portal view layout component. |
| Voice Heal | `https://clio.taila01894.ts.net/?room=voice` | HTTP 200 | **NOMINAL** | Resolves cleanly with HTTP 200 OK, functioning as a legitimate internal portal view layout component. |

## 3. Structural Alignment Observations
### A. Universal Media Ingestor (Universal Media Ingestor)
- **Status**: **MISROUTED**
- **Violation**: Bypasses independent port boundaries and aggressively mounts the internal Highlight Heist room view directly on the active layout screen, violating KI-030 (Decoupled Architecture Mandate).

### B. SamTracker
- **Status**: **MISROUTED**
- **Violation**: Shortcut routes to `https://clio.taila01894.ts.net/sam/` which returns HTTP 200 OK but serves the parent portal HTML because the portal Vite configuration is missing a reverse proxy definition mapping `/sam/` to port `3004`.

### C. Sovereign Cinema
- **Status**: **MISROUTED**
- **Violation**: The standalone Vite application runs fine on port `3008`, but the portal's click handler executes internally to an unaligned invalid room name `'sovereign_cinema'` rather than launching the external decoupled URL.

### D. Offline Services (James's Bistro, Sovereign Sports)
- **Status**: **DEAD LINK**
- **Violation**: Stalled daemon processes or missing Tailscale routes on ports `8446` and `3010`, resulting in immediate connection errors.

## 4. Verification Compliance Sign-Off
- **Audit Protocol**: Natively executed over private tailnet (`clio.taila01894.ts.net`).
- **Compliance Signature**: Antigravity Ingress sweep agent (f8b7e86e)
