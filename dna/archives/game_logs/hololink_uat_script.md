# HoloLink UAT Test Script
**Platform:** Sovereign OS — HoloLink WebRTC Telepresence
**Version:** Shared Component (decoupled from AetherVet)
**Date:** 2026-05-21
**Tester:** James Carroll (Pilot)
**Pre-demo target:** Pawel Rudnicki / Wildseed LLC investor call

---

> [!CAUTION]
> **HARD BLOCKER DISCOVERED BEFORE TESTING**
> 
> Tailscale Funnel is currently only exposing `clio.taila01894.ts.net` → `localhost:3000`.
> Port 3009 (FanStack/HoloLink) and port 3015 (AetherVet) are **NOT publicly reachable**.
> An external user (Pawel) cannot reach HoloLink signaling at all right now.
> 
> **Funnel current config:**
> ```
> https://clio.taila01894.ts.net  (Funnel ON)
> |-- /    proxy https+insecure://localhost:3000
> |-- /sam proxy http://127.0.0.1:3004/sam/
> ```
> 
> **Port 8012 (HoloLink WS signaling) is also NOT listed in open ports.**
> Run `HLK-P01` first. All other public tests depend on it.

---

## Architecture Reference

```
HoloLink Signaling Flow:
Browser → wss://clio.taila01894.ts.net/ws-relay
        → Vite proxy (:3009) rewrites /ws-relay → ws://127.0.0.1:8012
        → HoloLink WS signaling daemon (:8012)
        → SDP offer/answer + ICE candidates relayed to peer
        → WebRTC P2P media stream established (audio/video)

ICE/STUN: stun.l.google.com:19302 (public Google STUN)
TURN: NOT CONFIGURED (potential NAT traversal risk on non-Tailscale networks)

Public URL (current): https://clio.taila01894.ts.net  (port 3000 only)
Required for Pawel:   https://clio.taila01894.ts.net:3009  OR funnel route added
```

---

## Device Registry

| Label | Device | OS | Browser | Network |
|---|---|---|---|---|
| **Device A** | Laptop | Linux | Chrome desktop | Tailscale + home WiFi |
| **Device B** | Pi 5 / Argo | Linux | Chrome desktop | Tailscale + home WiFi |
| **Device C** | Pixel 10a | Android | Chrome mobile | Tailscale mobile app |
| **Device EXT** | Simulated Pawel | Any | Chrome | Public internet (NOT on Tailscale) |

---

## SECTION P — PUBLIC REACHABILITY (PRIORITY — HARD BLOCKERS)

> [!IMPORTANT]
> Run these FIRST. If any P-series test fails, the Pawel call cannot proceed as planned.

---

### HLK-P01 — Expose HoloLink Signaling via Tailscale Funnel

| Field | Value |
|---|---|
| **Test ID** | HLK-P01 |
| **Priority** | 🔴 CRITICAL BLOCKER |
| **Devices** | Device A (laptop) — terminal |
| **Type** | Infrastructure setup (not a call test) |

**Pre-conditions:**
- `tailscale funnel status` shows current config
- Port 8012 must be listening (check: `ss -tlnp | grep 8012`)

**Steps:**
1. Verify HoloLink signaling daemon is running on port 8012:
   ```bash
   ss -tlnp | grep 8012
   ```
2. If NOT running, start it:
   ```bash
   cd /home/james/SovereignOS && .venv/bin/python3 scripts/hololink_signaling.py &
   ```
3. Add Funnel route for HoloLink via the FanStack Vite server (port 3009):
   ```bash
   sudo tailscale funnel --set-path=/holo https+insecure://localhost:3009
   ```
   OR funnel port 3009 directly:
   ```bash
   sudo tailscale funnel 3009
   ```
4. Verify new funnel status:
   ```bash
   tailscale funnel status
   ```
5. Test from a non-Tailscale device: `curl -I https://clio.taila01894.ts.net:3009/` or `https://clio.taila01894.ts.net/holo`

**Expected Result:** Funnel confirms port 3009 or `/holo` route publicly accessible. curl returns HTTP 200.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-P02 — External User Can Load HoloLink UI (No Tailscale)

| Field | Value |
|---|---|
| **Test ID** | HLK-P02 |
| **Priority** | 🔴 CRITICAL BLOCKER |
| **Devices** | Device EXT (phone/laptop NOT on Tailscale) |
| **Depends on** | HLK-P01 PASS |

**Pre-conditions:**
- Tailscale app is OFF or device is not enrolled
- HLK-P01 complete

**Steps:**
1. On Device EXT, open Chrome and navigate to the public HoloLink URL (determined in HLK-P01)
2. Confirm page loads without SSL error
3. Confirm camera/microphone permission prompt appears
4. Confirm no "Connection refused" or "ERR_CONNECTION_REFUSED"
5. Do NOT initiate a call yet — just verify the UI loads

**Expected Result:** HoloLink UI renders in browser, camera/mic permissions prompt appears, no 502/timeout.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-P03 — WSS Handshake from Public Network

| Field | Value |
|---|---|
| **Test ID** | HLK-P03 |
| **Priority** | 🔴 CRITICAL BLOCKER |
| **Devices** | Device EXT |
| **Depends on** | HLK-P02 PASS |

**Pre-conditions:**
- Device EXT has no Tailscale

**Steps:**
1. Open Chrome DevTools (F12) → Network → filter `WS`
2. Navigate to HoloLink public URL
3. Confirm a WebSocket connection appears in the WS tab
4. Confirm status shows `101 Switching Protocols` (not 400/403/timeout)
5. Check the WS URL shows `wss://clio.taila01894.ts.net...` not a Tailscale IP

**Expected Result:** `101 Switching Protocols` on WSS connection. WS frames visible in DevTools.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-P04 — Full Call: External User → Internal User (Pawel Simulation)

| Field | Value |
|---|---|
| **Test ID** | HLK-P04 |
| **Priority** | 🔴 CRITICAL BLOCKER |
| **Devices** | Device EXT (caller = Pawel) → Device A (receiver = James) |
| **Depends on** | HLK-P03 PASS |

**Pre-conditions:**
- Device EXT: public internet, no Tailscale
- Device A: on Tailscale, at `clio.taila01894.ts.net:3009`
- Both have camera + mic access

**Steps:**
1. Device A: Open HoloLink, select "Receive" or wait for incoming call
2. Device EXT: Open public HoloLink URL, click "Connect" or "Call"
3. Device A: Accept incoming call
4. Verify: both sides see each other's video
5. Verify: both sides hear each other's audio
6. Speak a test phrase — confirm latency is acceptable (< 500ms perceptible delay)
7. End call from Device EXT side
8. Confirm Device A shows "Call ended" state cleanly

**Expected Result:** Two-way audio/video call between public and internal device. No ICE failure. Latency acceptable.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-P05 — Mobile External User (Pawel on Phone Simulation)

| Field | Value |
|---|---|
| **Test ID** | HLK-P05 |
| **Priority** | 🔴 CRITICAL BLOCKER |
| **Devices** | Phone (Tailscale OFF) → Device A |
| **Depends on** | HLK-P04 PASS |

**Pre-conditions:**
- Turn OFF Tailscale on Pixel 10a OR use a second phone/hotspot not on the mesh
- Use mobile Chrome

**Steps:**
1. Same as HLK-P04 but initiator is on mobile Chrome
2. Verify camera/mic permissions prompt on mobile Chrome
3. Verify video renders correctly in mobile viewport (portrait and landscape)
4. Verify audio is audible through phone speaker
5. Verify call holds for 2+ minutes without drop

**Expected Result:** Full two-way call from mobile browser on public internet. Video/audio stable.
**Pass/Fail:** ___
**Notes:** ___

---

## SECTION L — LOCAL TAILNET SCENARIOS

---

### HLK-L01 — Laptop → Pi 5 (Initiator → Receiver)

| Field | Value |
|---|---|
| **Test ID** | HLK-L01 |
| **Devices** | Device A (initiator) → Device B (receiver) |
| **Network** | Both on Tailscale mesh |

**Pre-conditions:**
- Both devices on Tailscale and reachable
- HoloLink UI accessible on both at `https://clio.taila01894.ts.net:3009`
- Both devices have camera + mic

**Steps:**
1. Device B: Open HoloLink, set role to "Receiver" or navigate to receive URL
2. Device A: Open HoloLink, initiate call to Device B
3. Device B: Accept incoming call
4. Verify: Device A sees Device B's camera feed
5. Verify: Device B sees Device A's camera feed
6. Verify: Bidirectional audio works
7. Hold call for 60 seconds — verify no drops
8. End call from Device A

**Expected Result:** Clean bidirectional audio/video call. No ICE failures on Tailscale direct path.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-L02 — Pi 5 → Laptop (Reverse Direction)

| Field | Value |
|---|---|
| **Test ID** | HLK-L02 |
| **Devices** | Device B (initiator) → Device A (receiver) |

**Pre-conditions:** Same as HLK-L01.

**Steps:**
1. Reverse roles from HLK-L01 — Device B initiates
2. Device A receives and accepts
3. Verify same quality metrics as HLK-L01
4. Confirm no ICE asymmetry (some WebRTC bugs only affect one direction)

**Expected Result:** Call works equally in both directions. Same quality as HLK-L01.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-L03 — Phone → Pi 5 (Mobile Initiator)

| Field | Value |
|---|---|
| **Test ID** | HLK-L03 |
| **Devices** | Device C (Pixel 10a, Tailscale ON) → Device B |

**Steps:**
1. Device C: Open `https://clio.taila01894.ts.net:3009` in mobile Chrome (Tailscale active)
2. Initiate call to Device B
3. Device B: Accept
4. Verify video renders on both portrait and landscape orientation on phone
5. Verify phone speaker/mic work without switching to earpiece mode
6. Test pinch-to-zoom on video panel (should not break layout)

**Expected Result:** Mobile-initiated call works. UI is usable on phone screen.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-L04 — Phone → Laptop (Mobile to Desktop)

| Field | Value |
|---|---|
| **Test ID** | HLK-L04 |
| **Devices** | Device C → Device A |

**Steps:**
1. Same as HLK-L03 but Device A is the receiver
2. Verify call connects between phone and laptop
3. Test switching phone from WiFi to cellular mid-call (ICE restart test)

**Expected Result:** Call connects. ICE restart handles network switch gracefully (may briefly drop, should reconnect).
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-L05 — Three-Way Simultaneous (All Devices)

| Field | Value |
|---|---|
| **Test ID** | HLK-L05 |
| **Devices** | Device A + Device B + Device C simultaneously |

> [!NOTE]
> HoloLink currently uses a peer-to-peer mesh for 2-way calls. True 3-way requires either SFU architecture or a room-based signaling mode. This test validates current behavior — it may show that only 2 peers can be in a call simultaneously.

**Steps:**
1. Establish call between Device A and Device B (HLK-L01)
2. While call is active, attempt to join from Device C
3. Document behavior: does it create a separate call, join the existing one, or error?
4. Note current capability ceiling

**Expected Result:** Behavior documented. Either 3-way works OR it gracefully indicates 2-peer limit.
**Pass/Fail:** ___
**Notes (document observed behavior):** ___

---

## SECTION R — REGRESSION SCENARIOS

---

### HLK-R01 — Self-Call Loopback Bug NOT Reproducible (STRY3000415)

| Field | Value |
|---|---|
| **Test ID** | HLK-R01 |
| **Devices** | Device C (Pixel 10a) |
| **Bug ref** | STRY3000415 |

**Background:** Previously, clicking "Connect to AetherVet" on the phone initiated a call back to itself (loopback). This was fixed in the current session.

**Steps:**
1. Device C: Open AetherVet at `https://clio.taila01894.ts.net:3015/`
2. Click "Connect" or the HoloLink call button
3. Observe: does it attempt to call itself, or does it correctly target the configured remote node?
4. Open Chrome DevTools → Console — confirm no `RTCPeerConnection` connecting to `window.location` origin
5. Confirm incoming call appears on Device B (Argo) — NOT on Device C itself

**Expected Result:** Call initiates toward Argo/Device B. NO self-call. STRY3000415 is NOT reproducible. ✅
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-R02 — Call Drop and Reconnect

| Field | Value |
|---|---|
| **Test ID** | HLK-R02 |
| **Devices** | Device A → Device B |

**Steps:**
1. Establish call (HLK-L01)
2. On Device A: temporarily disable WiFi for 10 seconds, then re-enable
3. Observe: does the call attempt ICE restart? Does it reconnect within 15 seconds?
4. If it drops: can a new call be initiated immediately after reconnect?

**Expected Result:** ICE restart attempted automatically. Call reconnects OR gracefully shows "reconnecting" state. No browser crash.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-R03 — Browser Tab Close Mid-Call

| Field | Value |
|---|---|
| **Test ID** | HLK-R03 |
| **Devices** | Device A (closes tab) → Device B (receiver) |

**Steps:**
1. Establish active call between Device A and Device B
2. On Device A: close the browser tab (do NOT click End Call)
3. Observe Device B: does it show "Call ended" or hang in active-call state?
4. Verify Device B can initiate a new call immediately after
5. Verify no ghost WebRTC connections remain (DevTools → Network → WS)

**Expected Result:** Device B shows call-ended state within 10 seconds (WS close detected). No ghost connections.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-R04 — Slow/Mobile Connection Simulation

| Field | Value |
|---|---|
| **Test ID** | HLK-R04 |
| **Devices** | Device C (phone) → Device A |

**Steps:**
1. On Device C: Chrome DevTools → Network tab → set throttle to "Slow 3G"
2. Initiate call to Device A
3. Observe: does video degrade gracefully (lower resolution) or freeze/fail?
4. Observe: does audio hold while video degrades?
5. Remove throttle — verify quality recovers

**Expected Result:** Audio holds under degraded conditions. Video degrades gracefully (not hard freeze). Quality recovers when bandwidth improves.
**Pass/Fail:** ___
**Notes:** ___

---

## SECTION C — PRE-CALL CHECKLIST (Pawel Call Readiness)

Run these immediately before the Pawel HoloLink call.

---

### HLK-C01 — Camera Permission Auto-Prompt

| Field | Value |
|---|---|
| **Test ID** | HLK-C01 |
| **Devices** | Device A (James's laptop — call initiator for demo) |

**Steps:**
1. Open HoloLink in a fresh Chrome profile (no saved permissions)
2. Click "Connect" — observe: does camera permission prompt appear automatically?
3. Grant permission — verify camera feed appears in local preview
4. Reject permission — verify graceful error message (not crash)

**Expected Result:** Permission prompt appears on first use. Camera preview shows James's face. Error message is user-friendly if denied.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-C02 — Microphone Permission Auto-Prompt

| Field | Value |
|---|---|
| **Test ID** | HLK-C02 |
| **Devices** | Device A |

**Steps:**
1. Same fresh profile as HLK-C01
2. Grant camera → verify mic permission also prompts (or combined prompt)
3. Speak — verify audio level indicator shows activity
4. Mute/unmute button — verify it works

**Expected Result:** Mic permissions prompt. Audio level visible when speaking. Mute toggle functional.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-C03 — Audio/Video Quality Assessment

| Field | Value |
|---|---|
| **Test ID** | HLK-C03 |
| **Devices** | Device A → Device B |

**Steps:**
1. Establish call (HLK-L01)
2. Assess video quality: is James's face clearly identifiable? Adequate lighting?
3. Assess audio: speak at normal conversation volume — clear on other side?
4. Estimate latency: clap once — how long before other side hears it? (acceptable: < 300ms)
5. Note any echo, feedback, or distortion

**Expected Result:** Video: ≥ 480p, face identifiable. Audio: clear, no echo. Latency: < 300ms.
**Pass/Fail:** ___
**Notes (actual quality observed):** ___

---

### HLK-C04 — URL Cleanliness for Sharing with Pawel

| Field | Value |
|---|---|
| **Test ID** | HLK-C04 |
| **Devices** | Device A |

**Context:** Pawel will receive a URL via text/email to join the HoloLink call. The URL must:
- Not contain authentication tokens
- Not show a scary port number in the address bar (`:3009` is acceptable but not ideal)
- Load without requiring Tailscale installation

**Steps:**
1. Confirm the shareable HoloLink URL (determined in HLK-P01)
2. Send the URL to Device EXT via SMS (simulate what Pawel receives)
3. Device EXT: open URL — does it load without any additional steps?
4. Assess: is the URL "investor friendly" or does it look like a dev endpoint?

**Expected Result:** URL loads cleanly. No tokens. No scary ports if possible. Page clearly branded as Sovereign OS.
**Pass/Fail:** ___
**Notes:** ___

---

### HLK-C05 — Full End-to-End Pawel Simulation (Dress Rehearsal)

| Field | Value |
|---|---|
| **Test ID** | HLK-C05 |
| **Priority** | 🔴 RUN LAST — Final GO/NO-GO |
| **Devices** | Device EXT (Pawel simulation) → Device A (James) |
| **Depends on** | HLK-P01 through HLK-P05 all PASS |

**Steps:**
1. James on Device A: open HoloLink, prepare to receive call
2. Simulate Pawel: send HoloLink URL via text to Device EXT
3. Device EXT: open link in Chrome (no Tailscale), grant camera/mic permissions
4. Pawel side: click "Connect" or join link
5. James side: accept call
6. Run 5-minute mock demo conversation:
   - James walks Pawel through the FanStack live room
   - James screenshares or points camera at second monitor showing the platform
   - Verify audio stays clear for full 5 minutes
7. End call gracefully from both sides
8. Rate overall experience 1-10

**Expected Result:** Smooth 5-minute call. Both parties clearly visible/audible. No drops. Experience ≥ 8/10.
**Pass/Fail:** ___
**Rating (1-10):** ___
**Notes:** ___

---

## Summary Scorecard

| Section | Tests | Must Pass Before Call |
|---|---|---|
| **P — Public Reachability** | HLK-P01 through P05 | ALL — hard blockers |
| **L — Local Tailnet** | HLK-L01 through L05 | L01, L02, L03 minimum |
| **R — Regression** | HLK-R01 through R04 | R01 (loopback bug) required |
| **C — Pre-Call Checklist** | HLK-C01 through C05 | ALL |

---

## Known Issues Going In (Pre-Test State)

| ID | Issue | Severity | Status |
|---|---|---|---|
| STRY3000415 | Self-call loopback bug on mobile | HIGH | Fixed this session — verify with HLK-R01 |
| ⚠️ New | Port 3009 NOT in Tailscale Funnel | **CRITICAL** | Must fix with HLK-P01 before any public test |
| ⚠️ New | Port 8012 not confirmed listening | HIGH | Verify daemon is running before all tests |
| ⚠️ New | No TURN server configured | MEDIUM | May cause ICE failure on strict NAT (Pawel's network) |

> [!WARNING]
> **TURN Server Risk:** The HoloLink ICE config uses only `stun:stun.l.google.com:19302`. STUN works when at least one peer has a public IP or open NAT. If Pawel is behind a symmetric NAT (corporate firewall, carrier-grade NAT), the call will fail with ICE connection error. 
> 
> A free TURN server (Metered.ca or Twilio) should be added to `iceServers` as a fallback before the investor call. This is a 10-minute fix.
