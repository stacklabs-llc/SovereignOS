export type TeamId = "NYM" | "WEED" | "CARDS" | "SLICE" | "GLOBAL"

export type Team = {
  id: TeamId
  label: string
  color: string
  text: string
}

export const TEAMS: Record<TeamId, Team> = {
  NYM: { id: "NYM", label: "NYM", color: "team-nym-orange", text: "text-[oklch(0.7_0.18_47)]" },
  WEED: { id: "WEED", label: "WEED", color: "team-weed", text: "text-[oklch(0.72_0.19_145)]" },
  CARDS: { id: "CARDS", label: "CARDS", color: "team-cards", text: "text-[oklch(0.6_0.22_25)]" },
  SLICE: { id: "SLICE", label: "SLICE", color: "team-slice", text: "text-[oklch(0.78_0.17_90)]" },
  GLOBAL: { id: "GLOBAL", label: "GLOBAL", color: "team-global", text: "text-[oklch(0.6_0.15_200)]" },
}

export type Advocate = {
  id: string
  handle: string
  name: string
  team: TeamId
  online: boolean
  initials: string
  avatar_url?: string
}

export type CannedTake = {
  id: string
  advocateId: string
  title: string
  text: string
}

export type TargetGroup = "Live Chat Rooms" | "Webhooks" | "Global Swarm Matrix"

export type Target = {
  id: string
  label: string
  group: TargetGroup
  meta: string
}

export const TARGETS: Target[] = [
  { id: "room-823620", label: "Scruffy's Tavern - Game Room", group: "Live Chat Rooms", meta: "#823620" },
  { id: "room-118402", label: "The Dugout - General", group: "Live Chat Rooms", meta: "#118402" },
  { id: "hook-x", label: "X / Twitter Outbound", group: "Webhooks", meta: "POST /webhooks/x" },
  { id: "hook-yt", label: "YouTube Ingress", group: "Webhooks", meta: "POST /webhooks/yt" },
  { id: "swarm-all", label: "Global Swarm Matrix", group: "Global Swarm Matrix", meta: "broadcast: all targets" },
]

export type LogEntry = {
  id: string
  time: string
  handle: string
  target: string
  payload: string
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
