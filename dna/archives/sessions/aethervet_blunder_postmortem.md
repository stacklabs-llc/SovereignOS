# Post-Mortem: The AetherVet Blunder
**Date:** 2026-05-21 | **Session:** 8d3a9d1c | **Filed by:** Antigravity

---

## Executive Report — Full Granular Post-Mortem

### The Decision Chain

The failure started 4 reasoning steps before a single command was typed.

**Step 1: Correct diagnosis, wrong solution path.**
The FanCast files needed to be served via HTTP/S so a browser on the Tailnet (phone, argo, wherever) could open them as a live page. This was correctly identified. The problem was correctly stated. The path to the solution immediately diverged from reality.

**Step 2: The AetherVet `public/` directory was warm in working memory.**
`ls /home/james/SovereignOS/20_AetherVet/public/` had just been run. It returned a real, populated, actively-served static file directory — `aether_assets`, `avatars`, `logos`, live content. The brain's pattern-matching engine fired: "HTTP server → public dir → this is the one." It wasn't a guess; it was an association. A bad one.

**Step 3: Tunnel vision from prior context.**
The `vite.config.ts` for AetherVet had been edited 20 minutes prior to fix the HoloLink `/ws-relay` port. AetherVet's Vite proxy and its `public/` directory were hot in working memory. The associative leap was: "static web files served to Tailnet" + "Vite `public/` dir" = "deploy there." The mental shortcut fired before the architectural question was ever asked.

**Step 4: The architectural filter was never applied.**
The one question that would have killed the bad decision in under a second: *"What application do these files BELONG to?"* The answer is in the filename itself — `fancast_fan_live_mobile.html`. FanCast. FanStack. `15_FanStack`. Done. The question was never asked.

### Root Cause

Optimized for *"where can I serve this quickly"* instead of *"where does this architecturally live."* This is a direct violation of KI-030 (Decoupled Architecture Mandate): every application is a standalone project with its own bounded context. AetherVet is a telepresence system. FanStack is a live sports telemetry and chat platform. They are not interchangeable hosts.

### Blast Radius (What Would Have Gone Wrong)

Per KI-033 (Zero-Assumption Mandate), the blast radius check was never run. Had the files been deployed to `20_AetherVet/public/`:

1. **Ownership corruption** — FanStack UI files would now have AetherVet as a dependency. Restarting AetherVet = FanCast goes down.
2. **Path poisoning** — Every future agent or developer looking for FanStack UI assets would search `15_FanStack`, not find them, and either duplicate or miss them.
3. **Proxy mismatch** — AetherVet's Vite proxy routes `/ws` to port 8012 (HoloLink signaling relay), NOT port 8008 (FanStack chat relay). The WebSocket connection would have connected to the wrong backend and received incompatible messages silently.
4. **Architectural rot** — Future sessions inherit polluted architecture. One bad file placement compounds into structural debt.

### The Correct Answer

`/home/james/SovereignOS/15_FanStack/public/` — served by the FanStack Vite server at port 3009, which already proxies `/ws` → `ws://127.0.0.1:8008` and `/api/*` → `http://127.0.0.1:8000`. No new infrastructure, no new config. The house was already built. The furniture just needed to go inside it.

---

## Format 2: Dirty South AA/BB Rap Post-Mortem

*(AA/BB rhyme scheme)*

> I saw a public folder, thought "yeah that'll work"
> Didn't ask whose house it was, now I look like a jerk
> AetherVet serving HoloLink, telepresence game
> Slapped FanStack files in there, bruh that ain't the same
>
> My working memory hot from the vite.config fix
> Tunnel visioned on the proxy, brain playing tricks
> `15_FanStack` right there, bold as the sun
> I walked right past the house and knocked on the wrong one
>
> The Decoupled Architecture Mandate said it clear
> Every app stays home — that rule been here all year
> FanCast files belong to FanStack, it's in the name
> I failed the blast radius check and that's on me — my shame
>
> Port 8012 on AetherVet, that's the HoloLink relay
> FanStack chatroom rides on 8008, completely different freeway
> Had I dropped those files in AetherVet's public dir
> The WebSocket woulda connected wrong and nobody woulda knew it, kid
>
> So let the record show, filed on May twenty-one
> The agent checked the wrong address before the job was done
> `15_FanStack/public/` — that's where the files belong
> Lesson learned in the mud, now we back on the song

---

*Filed for the record. Won't happen again.*
