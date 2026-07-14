# Tonight's Sprint Game Plan — July 7, 2026

This document compiles our open ticket backlog, tonight's complete MLB slate, and strategic recommendations for tonight's roleplay UAT session in the Crosstalk Lounge.

---

## 🏛️ 1. Active Open Tickets Backlog

The following tickets are currently open in the SDLC system:

| Ticket Number | Type | Short Description | Current State |
|---|---|---|---|
| **STRY-0628-PROMPT-PREVIEW** | STRY | 🛡️ SOVEREIGNOS: VERTEX PROMPT PAYLOAD INSPECTION CONSOLE & INTERCEPTOR | `0` (PLANNING) |
| **ENHC1789568** | ENHC | Prominent Baseball Scoreboard Widget | `0` (PLANNING) |
| **STRY-0702-REPURPOSE-SAMTRACKER** | STRY | Revisit and repurpose SamTracker as Catnip Wars Syndicate Frontend | `1` (OPEN) |
| **STRY1783380244** | STRY | Onboard New FanStack Advocate: FishTankFury | `1` (OPEN) |
| **STRY1783426227** | STRY | Onboard New FanStack Advocate: LibertyBellRage | `1` (OPEN) |

---

## ⚾ 2. Tonight's MLB Slate (July 7, 2026)

Here is the complete schedule of games staging in our MLB scheduler for tonight:

*   **Game 823607**: 🍎 **NYM vs KC** (Mets vs Royals) — **[PRIMARY GAME ROOM]**
*   **Game 822956**: ⚡ **TB vs NYY** (Rays vs Yankees)
*   **Game 823361**: 🪓 **PIT vs ATL** (Pirates vs Braves)
*   **Game 824495**: 🔔 **CIN vs PHI** (Reds vs Phillies)
*   **Game 823062** / **823035**: 🍺 **STL vs MIL** (Cardinals vs Brewers)
*   **Game 824820**: 🐻 **BAL vs CHC** (Orioles vs Cubs)
*   **Game 824254**: 🐘 **DET vs OAK** (Tigers vs Athletics)
*   **Game 823847**: 🔱 **MIA vs SEA** (Marlins vs Mariners)
*   **Game 822713**: 🚀 **WSH vs HOU** (Nationals vs Astros)
*   **Game 823687**: 🔴 **MIN vs CLE** (Twins vs Guardians)
*   **Game 824579**: 🧦 **CWS vs BOS** (White Sox vs Red Sox)
*   **Game 822881**: 😇 **TEX vs LAA** (Rangers vs Angels)
*   **Game 823280**: 🐍 **SD vs ARI** (Padres vs D-backs)
*   **Game 823203**: 🍁 **SF vs TOR** (Giants vs Blue Jays)
*   **Game 823929**: 🏔️ **LAD vs COL** (Dodgers vs Rockies)

### Recommended Games to Activate Tonight:
1.  **Game 822956 (TB vs NYY)**: Perfect for hate-watching. Mets fans love seeing the Yankees drop games, and the advocates will have spicy, opinionated takes on Yankee Stadium dynamics.
2.  **Game 824495 (CIN vs PHI)**: PHI is the Mets' direct NL East rival. Activating this room will provoke high-intensity banter against the Phillies from advocates, especially when trailing.

---

## 🎭 3. Crosstalk Lounge Interactive Roleplay Configuration

### Device Layout:
*   **Laptop (Creator Role)**: Logged in as `WardyNYM` hosting the primary **NYM vs KC** game room. Controls the broadcast deck, streams, and manual overlay takeovers.
*   **Raspberry Pi 5 Workstation (Fan Role)**: Logged in as `Metsfan_86` on the TV side-car app, viewing chat history and reacting live as part of the community.

### 💡 "My Two Cents" on Cool Lounge Interactions to Trigger:

1.  **The "Air Bender" Pitcher Interception**:
    *   Since we just stabilized the `AIRBENDER_OVERLAY` for Devon Williams, wait for a late-inning high-leverage matchup in the MIL-STL game, or force-pitch Devon Williams into the game via poller override.
    *   Watch the overlay trigger Devon Williams's neon graphic on the Pi 5 kiosk while `WardyNYM` provides live play-by-play text on the laptop.
2.  **Chirping the Fan (`Metsfan_86`)**:
    *   Have `Metsfan_86` type a highly optimistic take on the Mets' playoff run in chat (e.g., *"We are winning the division, no doubt! LGM!"*).
    *   Watch advocate `Barf` or `the_chop_shop` instantly fire back with a sarcastic reality check about Mets historical collapses (since we just moderated `the_chop_shop`'s Truist Park comments, they will pivot to general classic stadium/small ball rants).
3.  **Meltdown / Victory Synchronized Trigger**:
    *   When the Mets bullpen walks the bases loaded, trigger the `METS_BLOW_IT_OVERLAY` from the creator deck on the laptop.
    *   The Pi 5 kiosk will shatter with the *"PANIC IN QUEENS!"* graphic, synchronizing reactions across both the creator stream and the community chat.
