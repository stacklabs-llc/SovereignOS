# FanStack Media Studio Console: UI/UX Engineering Specifications

**Article ID:** KB9012404  
**Last Synchronized:** 2026-07-08 05:07:07  

# **FanStack Media Studio Console: UI/UX Engineering Specifications**

This document outlines the architectural design and high-fidelity interface layouts for the FanStack Media Studio Console. The system is engineered for high-performance live production environments, operating on local port 3018\.

# **1\. The Grand Dashboard Grid (Port 3018\)**

The console utilizes a 12-column responsive grid system optimized for 1440p displays. The layout prioritizes persistent navigation and global status monitoring.t  
\+---------------------------------------------------------------------------------------+

| PORT 3018 | \[FS\] FANSTACK MEDIA STUDIO CONSOLE | SYSTEM: ONLINE | 19:42:01 UTC |
| :---- | :---- | :---- | :---- |
| GLOBAL NAV | \[MAM CATALOG\] | \[TMI RULE BUILDER\] | \[PRODUCER DESK\] |
| \+---------------------------------------------------------------------------------------+ |  |  |  |
| \[ SIDEBAR \] |  |  |  |
| Filters | MAIN VIEWPORT (TABS 1-3 CONTENT AREA) |  |  |
| Status |  |  |  |
| Alerts |  |  |  |
|  |  |  |  |
| \[ PREVIEW \] |  |  |  |
| 16:9 Feed |  |  |  |
| Monitor |  |  |  |
|  |  |  |  |
| \+------------+--------------------------------------------------------------------------+ |  |  |  |
| FOOTER: \[SESSION ID: 8821\] \[RENDER ENGINE: ACTIVE\] \[API: 200 OK\]      \[MEMORY: 42%\] |  |  |  |
| \+---------------------------------------------------------------------------------------+ |  |  |  |

\#\#\# Layout Metrics & Tokens

\*   \*\*Background:\*\* \`bg-slate-950\` (\#020617)

\*   \*\*Sidebar Width:\*\* 280px (\`w-72\`)

\*   \*\*Header Height:\*\* 64px (\`h-16\`)

\*   \*\*Grid Gutter:\*\* 16px (\`gap-4\`)

\*   \*\*Border Styling:\*\* \`border-slate-800\` (1px solid)

\#\# 2\. Tab 1 Mockup: Media Asset Catalog (MAM Warehouse)

The MAM (Media Asset Management) Warehouse provides a high-density view of available visual assets, specifically tracking alpha-channel availability for overlays.

\#\#\# UI Representation

\*   \*\*Search Header:\*\* Persistent search bar with auto-suggest.

\*   \*\*Filter Bar:\*\* Selectors for "Asset Type" (Video, Stinger, Lower-Third, Background) and "Alpha Status."

\*   \*\*Catalog Table:\*\* High-density row mapping.

| Filename | Type | Tags | Alpha | Resolution | Action |

| :--- | :--- | :--- | :--- | :--- | :--- |

| \`st\_homerun\_gold.mov\` | Stinger | \#Highlight \#HR | \*\*\[YES\]\*\* | 3840x2160 | \[LOAD\] |

| \`gfx\_score\_bug.png\` | Overlay | \#LiveScore | \*\*\[YES\]\*\* | 1920x1080 | \[LOAD\] |

| \`bg\_stadium\_loop.mp4\` | Background | \#Atmosphere | \[NO\] | 1920x1080 | \[LOAD\] |

| \`tx\_player\_stat.json\` | Data Viz | \#Statcast | \[YES\] | Vector | \[LOAD\] |

\#\#\# Alpha-Channel Indicator Logic

\*   \*\*Alpha \[YES\]:\*\* \`text-indigo-400\` with a subtle circular dot.

\*   \*\*Alpha \[NO\]:\*\* \`text-slate-500\` dimmed.

\#\# 3\. Tab 2 Mockup: TMI Condition-Rule Builder

The Rule Builder is an interactive form interface for constructing the Trigger-Mapping-Interface (TMI) logic using nested boolean operators and Statcast metrics.

\#\#\# Visual Boolean Blocks

\`\`\`text

\[ ADD RULE BLOCK \+ \]

\+--------------------------------------------------------------------------+

|  IF: \[ STATCAST METRIC v \] \[ OPERATOR v \] \[ VALUE \]                      |

|      (e.g., Exit Velocity)  (e.g., \> )     (e.g., 105 mph)               |

\+--------------------------------------------------------------------------+

|  \[ AND / OR \]  \<-- Toggle Switch (Indigo Theme)                          |

\+--------------------------------------------------------------------------+

|  IF: \[ TAG QUERY v \] \[ MATCHES ANY v \] \[ \#HomeTeam, \#PowerHitter \]       |

\+--------------------------------------------------------------------------+

|  THEN ACTION: \[ TRIGGER OVERLAY v \] \[ ASSET: st\_homerun\_gold.mov \]       |

\+--------------------------------------------------------------------------+

## **Design Specs**

* **Logic Blocks:** `bg-slate-900`, `rounded-md`, `border-l-4 border-indigo-500`.  
* **Dropdowns:** `bg-slate-800`, `text-slate-200`, `ring-1 ring-slate-700`.  
* **Required Tag Blocks:** Multi-select pill components with `x` clear icons.

# **4\. Tab 3 Mockup: Manual Producer Desk**

The Producer Desk is the high-stakes execution layer, mapping hardware-style button controls to the web interface for rapid "Blast" operations.

## **Button Mappings & Hotkeys**

| Button Label | Action | Hotkey | Tailwind Style |
| :---- | :---- | :---- | :---- |
| **BLAST OVERLAY** | Execute Primary Render | `Shift + Enter` | `bg-indigo-600` |
| **CLEAR ALL** | Flush Buffer / Hide GFX | `Esc` | `bg-slate-700` |
| **STINGER 1** | Play Transition A | `Num 1` | `bg-slate-800` |
| **STINGER 2** | Play Transition B | `Num 2` | `bg-slate-800` |
| **QUEUE NEXT** | Move to Next Asset | `Tab` | `bg-slate-800` |

## **Action Panel Layout**

The "Blast Overlay" panel is highlighted with a `ring-2 ring-indigo-500` pulse animation when the system is ready for trigger.

# **5\. Click-to-Annotate Coordinate Modal (Pin Engine)**

When identifying coordinate logs for spatial data, the Pin Engine Modal appears over the main viewport.

## **Modal Interface Elements**

* **The Crosshair:** A dynamic `+` icon that tracks the mouse cursor within the 16:9 canvas.  
* **Coordinate Log:** A real-time display of (X, Y) pixel data.  
* **Mapping Rules Area:** A text field for defining how these coordinates interact with the TMI.

t  
\+-----------------------------------------------------------------+  
|  ANNOTATE COORDINATES : PIN ENGINE                              |  
\+-----------------------------------------------------------------+  
|                                                                 |  
|   \[            |            \]  \<-- Crosshair tracking           |  
|   \[     \-------+-------     \]      (X: 1042, Y: 560\)            |  
|   \[            |            \]                                   |  
|                                                                 |  
\+-----------------------------------------------------------------+  
| COORDINATE LOG: \[ X: 1042 \] \[ Y: 560 \]                          |  
\+-----------------------------------------------------------------+  
| MAPPING RULES TEXT AREA:                                        |  
| \> Bind to Statcast: Ball\_Landing\_Point                          |  
| \> Offset: \+5px Y-axis for shadow render                         |  
\+-----------------------------------------------------------------+  
| \[ CANCEL \]                                     \[ SAVE PIN \]     |  
\+-----------------------------------------------------------------+

\#\#\# Engineering Specifications

\*   \*\*Modal Overlay:\*\* \`backdrop-blur-sm\` with \`bg-slate-950/80\`.

\*   \*\*Crosshair Color:\*\* \`text-white\` with 1px black stroke for visibility on any background.

\*   \*\*Coordinate Precision:\*\* Fixed-point integers (px).  
