# Sovereign OS Rule: Link Formatting and URL Resolution

To prevent severe UX friction in the Antigravity interface, the following rules MUST be obeyed for all file and web references:

## 1. Local File Paths Must Be Clickable
Whenever providing the path to a generated file, image, or code artifact, never output raw text strings like `/home/james/...`.
Always format the path as a standard markdown link using the `file:///` protocol so the Antigravity extension renders it as a clickable element.
- **BAD**: `/home/james/SovereignOS/image.png`
- **BAD**: `[image.png](/home/james/SovereignOS/image.png)`
- **GOOD**: `[image.png](file:///home/james/SovereignOS/image.png)`

## 2. Web URLs Must Use Tailscale Funnel
The Sovereign backend runs on Node .73, but the User accesses the frontend remotely from a laptop. Therefore, `localhost` is inaccessible to the User.
Never provide links to `http://localhost:<port>` or `http://127.0.0.1:<port>`.
All web frontend links must resolve through the Tailscale Funnel: `https://sov73.taila01894.ts.net/`.
- **BAD**: `http://localhost:8009/PROD/08_FanCast/fancast_fan_live.html`
- **GOOD**: `https://sov73.taila01894.ts.net/PROD/08_FanCast/fancast_fan_live.html`
