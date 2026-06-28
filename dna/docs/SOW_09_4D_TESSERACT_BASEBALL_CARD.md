# SovereignOS Architecture Requirement Document - 4D Tesseract Baseball Card & Temporal Rendering Engine

## Metadata
* **Document ID:** REQ-2026-06-27-TESSERACT-CARD
* **Status:** DRAFT (Pending Pilot Review)
* **Target Environment:** Sovereign Sports Dashboard (Next.js & React Three Fiber stack)
* **Author:** Antigravity AI Systems Architect
* **Project Path:** `/home/james/SovereignOS/24_TesseractStack`

---

## 1. Executive Summary and Objective

The objective of this document is to formalize the technical, layout, and visual requirements for the **4D Tesseract Baseball Card** component. This component acts as a high-fidelity, interactive 3D portal that allows fans to view a player's real-time Statcast telemetry while scrubbing through historical throwbacks ("the 4th dimension: TIME").

By utilizing React Three Fiber (R3F) for hardware-accelerated 3D rendering and Next.js `<Html>` projections for crisp, readable typography, the card transitions dynamically across five historical eras (1908, 1927, 1975, 1979, and 2024). It adopts the corresponding uniforms, team names, and color palettes on the fly. 

This spec guarantees that all rendering calculations, interaction dynamics, and UI styling meet the strict guidelines of the **Sovereign Home Premium** aesthetic.

---

## 2. System Architecture & Rendering Pipeline

The following schematic details how user interactions (hovering/tilting and range scrubbing) propagate through the React state controllers, recalculate the R3F vertex scales/materials, and update the dual-face HTML texture projection:

```
                  +----------------------------------------------+
                  |  USER INPUT: Era Scrubber (Slider / Range)   |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |  CardScene Container State: eraIndex [0..4]  |
                  +----------------------------------------------+
                                         |
                                         | (UniformEra lookup)
                                         v
+---------------------------------------------------------------------------------+
|                         BaseballCard3D (R3F Canvas)                             |
|                                                                                 |
|  +--------------------------------+       +----------------------------------+  |
|  |     Mouse Pointer Event        |       |        Leverage State            |  |
|  |  (x/y coords -> rotation Y/X)  |       |  (WebSocket trigger -> neon)     |  |
|  +--------------------------------+       +----------------------------------+  |
|                  |                                         |                    |
|                  | (lerp tick interpolation)               | (sine pulse)       |
|                  v                                         v                    |
|  +--------------------------------+       +----------------------------------+  |
|  |   g.rotation.y = targetY       |       |  material.opacity = pulseIntensity|  |
|  |   g.rotation.x = targetX       |       |  glow.scale.set(s, s, 1)         |  |
|  +--------------------------------+       +----------------------------------+  |
|                  |                                                              |
|                  +-----------------------+-----------------------+              |
|                                          |                                      |
|                                          v                                      |
|                        +-----------------------------------+                    |
|                        |      90-Degree Rotation Check     |                    |
|                        +-----------------------------------+                    |
|                               /                     \                           |
|                      (Y-axis < 90deg)           (Y-axis > 90deg)                |
|                            /                             \                      |
|                           v                               v                     |
|           +-------------------------------+ text  +-------------------------------+
|           |       <FrontFace />           |=====> |         <BackFace />          |
|           |  (Uniform image, Era ribbon,  | HTML  |  (Statcast scrolling pitch log|
|           |   2x3 statistical grid)       | scale |   animated on canvas mesh)    |
|           +-------------------------------+       +-------------------------------+
+---------------------------------------------------------------------------------+
```

---

## 3. Functional Requirements

### 3.1. Interactive 3D Render Loop (R3F Tier)
* **REQ-TSR-001 (Pointer Tracking):** The 3D canvas must capture normalized cursor coordinates (`x` and `y` in the range `[-1.0, 1.0]`) and translate them into holographic card tilts. The interpolation must use linear equation smoothing (`lerp`) with a step factor of `0.1` per frame to prevent jerky movements.
* **REQ-TSR-002 (Double-Sided Face Swapping):** The card body must flip 180 degrees on the Y-axis when clicked. To prevent rendering collision, the viewport projection must switch active faces at exactly the 90-degree threshold:
  ```typescript
  const norm = ((g.rotation.y % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
  const showBack = norm > Math.PI / 2 && norm < (3 * Math.PI) / 2;
  ```
* **REQ-TSR-003 (Neon Leverage Halo):** When the `leverageActive` state is triggered, a backing plane mesh must render a glowing pulse using a sine wave modifier:
  ```typescript
  opacity = 0.35 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
  ```

### 3.2. 4D Timeline State Mapping
* **REQ-TSR-004 (Scrubber Range Input):** The controls panel must render a custom range input mapping to indices `0` through `4` representing the historical timelines.
* **REQ-TSR-005 (Dynamic Asset Swapping):** Changing the scrubber index must dynamically update the card's visual attributes with zero hydration lag. The uniform headshot (`era.headshot`), team name (`era.team`), jersey tagline (`era.tagline`), and base layout accent colors (`era.accent`, `era.cardBg`) must swap instantly.

---

## 4. Non-Functional & Structural Constraints

* **NC-TSR-001 (Aesthetic Invariant - Sovereign Home Premium):** The UI layout overlay must adhere to the high-fidelity dark styling mandates:
  * **Backgrounds:** Deep Void slate background `#0b0d13`.
  * **Panels:** Frosted-glass container cards (`bg-card/65`) utilizing Tailwind backdrop blur (`backdrop-blur-md`) and thin semi-transparent borders.
  * **Highlights:** Glowing neon-cyan accents (`#2bf5ff`) for active ranges, cursor nodes, and high-leverage indicators.
* **NC-TSR-002 (Asset Resolution Safeguard):** Historical throwback PNG routes (`/era-1908.png`, `/era-1975.png`, etc.) must resolve correctly in public routes. Omissions must fallback gracefully to default roster avatars without throwing image decoding exceptions.
* **NC-TSR-003 (Type Cleanliness):** All components must compile under strict TypeScript config rules. Component parameters must be fully typed without utilizing the `any` bypass type.

---

## 5. UI Layout Mockups (HoloDex Temporal View)

The following mockups demonstrate the visual fidelity of the 4D Tesseract Card interface across different theme presets:

### Theme A: Broadcast & Sim-Premium (Glassmorphic)
The standard and premium themes utilize deep void background gradients, frosted-glass control decks, and glowing neon-cyan indicators:

![Sim-Premium 4D Card Mockup](file:///home/james/SovereignOS/dna/docs/images/baseball_card_mockup.png)

### Theme B: Retro 16-Bit (Pixelated Console)
The retro theme renders a nostalgic 90s console interface, incorporating pixel-art player avatars, chiseled panels, and glowing arcade button maps:

![Retro 16-Bit 4D Card Mockup](file:///home/james/SovereignOS/dna/docs/images/retro_card_mockup.png)
