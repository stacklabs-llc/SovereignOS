export type CardTheme = "standard" | "sim-premium" | "retro-16-bit"

export interface PlayerMetric {
  label: string
  value: string
}

export interface StatcastLog {
  pitch: string
  ev: number // exit velocity (mph)
  dist: number // distance (ft)
  la: number // launch angle (deg)
}

export interface PlayerProfile {
  name: string
  team: string
  position: string
  number: string
  headshot: string
  metrics: PlayerMetric[]
  statcast: StatcastLog[]
}

/**
 * The 4th dimension: TIME. Each era is a throwback that re-skins the card's
 * uniform headshot, team identity, and color palette. Ordered chronologically
 * so they can drive a timeline scrubber.
 */
export interface UniformEra {
  id: string
  year: number
  label: string // short timeline label
  team: string // era-appropriate club name
  tagline: string // flavor text for the era's style
  headshot: string
  ink: string // primary uniform color (hex)
  trim: string // secondary / accent color (hex)
  accent: string // bright, readable highlight on the dark card (hex)
  cardBg: string // card front background (hex)
  fabric: "wool" | "flannel" | "double-knit" | "performance"
}

export const eras: UniformEra[] = [
  {
    id: "1908",
    year: 1908,
    label: "Deadball",
    team: "Harbor City Mariners",
    tagline: "Lace-up wool flannel",
    headshot: "/era-1908.png",
    ink: "#b8a079",
    trim: "#5a4a32",
    accent: "#e8d3a8",
    cardBg: "#241d12",
    fabric: "wool",
  },
  {
    id: "1927",
    year: 1927,
    label: "Golden Age",
    team: "Harbor City Sailors",
    tagline: "Classic navy pinstripes",
    headshot: "/player-headshot.png",
    ink: "#1d3a6b",
    trim: "#c9d4e8",
    accent: "#c9d4e8",
    cardBg: "#0e1c33",
    fabric: "flannel",
  },
  {
    id: "1975",
    year: 1975,
    label: "Big Red",
    team: "Harbor City Reds",
    tagline: "Pillbox cap pullover",
    headshot: "/era-1975.png",
    ink: "#c8102e",
    trim: "#f4f4f4",
    accent: "#ff5a6e",
    cardBg: "#2b0a0f",
    fabric: "double-knit",
  },
  {
    id: "1979",
    year: 1979,
    label: "Bumblebee",
    team: "Harbor City Buccos",
    tagline: "Black & gold throwback",
    headshot: "/era-1979.png",
    ink: "#fdb827",
    trim: "#161616",
    accent: "#fdb827",
    cardBg: "#1a1505",
    fabric: "double-knit",
  },
  {
    id: "2024",
    year: 2024,
    label: "Modern",
    team: "Harbor City Tridents",
    tagline: "Performance knit",
    headshot: "/era-2024.png",
    ink: "#2bf5ff",
    trim: "#0b1b2b",
    accent: "#2bf5ff",
    cardBg: "#0b1b2b",
    fabric: "performance",
  },
]

export const player: PlayerProfile = {
  name: "Marcus Vela",
  team: "Harbor City Tridents",
  position: "CF",
  number: "24",
  headshot: "/player-headshot.png",
  metrics: [
    { label: "AVG", value: ".318" },
    { label: "OBP", value: ".402" },
    { label: "SLG", value: ".571" },
    { label: "OPS", value: ".973" },
    { label: "HR", value: "31" },
    { label: "RBI", value: "88" },
  ],
  statcast: [
    { pitch: "4-Seam FB", ev: 108.4, dist: 421, la: 27 },
    { pitch: "Slider", ev: 101.2, dist: 388, la: 22 },
    { pitch: "Changeup", ev: 95.7, dist: 312, la: 18 },
    { pitch: "Curveball", ev: 104.9, dist: 405, la: 31 },
    { pitch: "Sinker", ev: 98.3, dist: 276, la: 9 },
    { pitch: "Cutter", ev: 110.1, dist: 437, la: 29 },
    { pitch: "4-Seam FB", ev: 92.6, dist: 198, la: 6 },
    { pitch: "Splitter", ev: 106.8, dist: 412, la: 24 },
    { pitch: "Slider", ev: 89.4, dist: 154, la: 41 },
    { pitch: "4-Seam FB", ev: 112.7, dist: 451, la: 28 },
    { pitch: "Changeup", ev: 97.1, dist: 301, la: 15 },
    { pitch: "Curveball", ev: 100.5, dist: 366, la: 33 },
    { pitch: "Sinker", ev: 103.3, dist: 379, la: 20 },
    { pitch: "Cutter", ev: 94.8, dist: 233, la: 12 },
    { pitch: "4-Seam FB", ev: 109.6, dist: 428, la: 26 },
    { pitch: "Slider", ev: 107.2, dist: 414, la: 23 },
    { pitch: "Splitter", ev: 91.0, dist: 187, la: 8 },
    { pitch: "Changeup", ev: 105.4, dist: 397, la: 25 },
  ],
}
