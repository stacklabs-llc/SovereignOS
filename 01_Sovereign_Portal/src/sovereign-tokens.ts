// sovereign-tokens.ts — SINGLE SOURCE OF TRUTH
export const VM = {
  // Backgrounds
  deepVoid:   "#0f1115",
  surface:    "rgba(15, 17, 21, 0.85)",
  card:       "rgba(15, 17, 21, 0.7)",

  // Borders
  border:     "#1e293b",
  borderHi:   "rgba(255, 255, 255, 0.2)",

  // Accents — Sovereign Palette
  orange:     "#FF5910",
  emerald:    "#00FF88", // Corrected pure green
  blue:       "#00d4ff",
  cyan:       "#38bdf8",
  gold:       "#E0BC68",
  danger:     "#ef4444",

  // Typography — Sovereign Font Stack
  fontHead:   "'Orbitron', sans-serif",
  fontMono:   "'Share Tech Mono', monospace",
  fontBody:   "'Rajdhani', sans-serif",

  // Text
  text:       "#c8d6e0",
  muted:      "#5a7a8a",
} as const;

export type VMKey = keyof typeof VM;
