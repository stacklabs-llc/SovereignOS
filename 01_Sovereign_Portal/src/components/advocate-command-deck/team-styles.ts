// Static class maps so Tailwind can detect them and team glows stay tactical.
export const teamGlow: Record<string, string> = {
  NYM: "shadow-[0_0_18px_-2px_oklch(0.7_0.18_47/0.7)] border-[oklch(0.7_0.18_47/0.6)]",
  WEED: "shadow-[0_0_18px_-2px_oklch(0.72_0.19_145/0.7)] border-[oklch(0.72_0.19_145/0.6)]",
  CARDS: "shadow-[0_0_18px_-2px_oklch(0.6_0.22_25/0.7)] border-[oklch(0.6_0.22_25/0.6)]",
  SLICE: "shadow-[0_0_18px_-2px_oklch(0.78_0.17_90/0.7)] border-[oklch(0.78_0.17_90/0.6)]",
  GLOBAL: "shadow-[0_0_18px_-2px_oklch(0.6_0.15_200/0.7)] border-[oklch(0.6_0.15_200/0.6)]",
}

export const teamBadge: Record<string, string> = {
  NYM: "bg-[oklch(0.7_0.18_47/0.15)] text-[oklch(0.78_0.16_55)] border-[oklch(0.7_0.18_47/0.4)]",
  WEED: "bg-[oklch(0.72_0.19_145/0.15)] text-[oklch(0.8_0.18_148)] border-[oklch(0.72_0.19_145/0.4)]",
  CARDS: "bg-[oklch(0.6_0.22_25/0.15)] text-[oklch(0.72_0.2_28)] border-[oklch(0.6_0.22_25/0.4)]",
  SLICE: "bg-[oklch(0.78_0.17_90/0.15)] text-[oklch(0.85_0.16_92)] border-[oklch(0.78_0.17_90/0.4)]",
  GLOBAL: "bg-[oklch(0.6_0.15_200/0.15)] text-[oklch(0.75_0.15_202)] border-[oklch(0.6_0.15_200/0.4)]",
}

export const teamDot: Record<string, string> = {
  NYM: "bg-[oklch(0.7_0.18_47)]",
  WEED: "bg-[oklch(0.72_0.19_145)]",
  CARDS: "bg-[oklch(0.6_0.22_25)]",
  SLICE: "bg-[oklch(0.78_0.17_90)]",
  GLOBAL: "bg-[oklch(0.6_0.15_200)]",
}

export const teamText: Record<string, string> = {
  NYM: "text-[oklch(0.78_0.16_55)]",
  WEED: "text-[oklch(0.8_0.18_148)]",
  CARDS: "text-[oklch(0.72_0.2_28)]",
  SLICE: "text-[oklch(0.85_0.16_92)]",
  GLOBAL: "text-[oklch(0.75_0.15_202)]",
}
