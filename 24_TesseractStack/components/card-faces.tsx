"use client"

import type { CardTheme, PlayerProfile, UniformEra } from "@/lib/player-data"
import { cn } from "@/lib/utils"

// Each face is sized at exactly 260 x 364 px. In the 3D scene the wrapping
// <Html transform> is scaled by 0.4, mapping these pixels onto the card mesh.
const FACE_W = 260
const FACE_H = 364

type FaceProps = {
  player: PlayerProfile
  theme: CardTheme
  era: UniformEra
}

// Add transparency to a hex color (#rrggbb + alpha byte).
function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${v}`
}

function themeShell(theme: CardTheme) {
  switch (theme) {
    case "sim-premium":
      return "bg-white/10 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
    case "retro-16-bit":
      return "bg-[#1a1c4b] border-4 border-[#5be1ff] text-[#f4f4f4] [image-rendering:pixelated]"
    default:
      return "bg-[#0b1b2b] border border-white/15 text-[#f4f6f8]"
  }
}

function isRetro(theme: CardTheme) {
  return theme === "retro-16-bit"
}

export function FrontFace({ player, theme, era }: FaceProps) {
  const retro = isRetro(theme)
  const premium = theme === "sim-premium"
  const isBarf = player.name.toLowerCase().includes("barf")
  const jerseyNumber = isBarf ? "00" : player.number
  const headshotSrc = isBarf
    ? (era.id === "1979" ? "/barf-1970.png" : "/barf.png")
    : ((era.id === "2024" && player.headshot) ? player.headshot : era.headshot)

  const isBarf1979 = isBarf && era.id === "1979"
  // Standard theme is fully driven by the era palette; premium/retro keep their
  // signature look but still adopt the era's accent + uniform headshot.
  const accent = retro ? "#5be1ff" : era.accent
  const surfaceStyle =
    theme === "standard"
      ? { width: FACE_W, height: FACE_H, backgroundColor: isBarf1979 ? "transparent" : era.cardBg, borderColor: isBarf1979 ? "transparent" : alpha(era.accent, 0.35) }
      : { width: FACE_W, height: FACE_H }

  return (
    <div
      style={surfaceStyle}
      className={cn(
        "relative flex flex-col overflow-hidden p-4 select-none",
        retro ? "rounded-none font-mono" : "rounded-2xl font-sans",
        isBarf1979
          ? "bg-transparent border-transparent text-[#f4f6f8]"
          : (theme === "standard" ? "border text-[#f4f6f8]" : themeShell(theme)),
      )}
    >
      {/* Team banner — team name changes with the era */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {era.team}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center text-xs font-extrabold",
            retro ? "" : "rounded-full",
          )}
          style={{ backgroundColor: accent, color: era.trim }}
        >
          {jerseyNumber}
        </span>
      </div>

      {/* Era ribbon — the 4th dimension indicator */}
      <div
        className={cn(
          "mt-2 flex items-center justify-between px-2 py-1 text-[9px] uppercase tracking-widest",
          retro ? "rounded-none" : "rounded-md",
        )}
        style={{ backgroundColor: alpha(accent, 0.14), color: accent }}
      >
        <span className="font-bold tabular-nums">{era.year}</span>
        <span className="opacity-90">{era.tagline}</span>
      </div>

      {/* Headshot — the throwback uniform */}
      <div className="mt-3 flex justify-center">
        <div
          className={cn("h-28 w-28 overflow-hidden border-2", retro ? "rounded-none" : "rounded-full")}
          style={{ borderColor: alpha(accent, 0.7) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={headshotSrc}
            alt={`${player.name} in ${era.year} ${era.team} uniform`}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              retro && "[image-rendering:pixelated] contrast-125 saturate-150",
              premium && "saturate-110",
            )}
          />
        </div>
      </div>

      {/* Name + position */}
      <div className="mt-3 text-center">
        <h2 className={cn("text-pretty text-xl font-extrabold leading-tight", retro && "uppercase tracking-tight")}>
          {player.name}
        </h2>
        <p className="text-[11px] uppercase tracking-widest" style={{ color: alpha(accent, 0.85) }}>
          {player.position}
        </p>
      </div>

      {/* 2x3 metric grid */}
      <div className="mt-auto grid grid-cols-3 gap-1.5">
        {player.metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "flex flex-col items-center justify-center py-1.5",
              retro ? "rounded-none" : "rounded-md",
            )}
            style={{ backgroundColor: alpha(accent, 0.08), border: `1px solid ${alpha(accent, 0.25)}` }}
          >
            <span className="text-[9px] uppercase" style={{ color: alpha(accent, 0.8) }}>
              {m.label}
            </span>
            <span className="text-sm font-bold tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BackFace({ player, theme, era }: FaceProps) {
  const retro = isRetro(theme)
  const isBarf = player.name.toLowerCase().includes("barf")
  const isBarf1979 = isBarf && era.id === "1979"
  const jerseyNumber = isBarf ? "00" : player.number
  const accent = retro ? "#5be1ff" : era.accent
  const surfaceStyle =
    theme === "standard"
      ? { width: FACE_W, height: FACE_H, backgroundColor: isBarf1979 ? "transparent" : era.cardBg, borderColor: isBarf1979 ? "transparent" : alpha(era.accent, 0.35) }
      : { width: FACE_W, height: FACE_H }
  return (
    <div
      style={surfaceStyle}
      className={cn(
        "relative flex flex-col overflow-hidden p-4 select-none",
        retro ? "rounded-none font-mono" : "rounded-2xl font-mono",
        isBarf1979
          ? "bg-transparent border-transparent text-[#f4f6f8]"
          : (theme === "standard" ? "border text-[#f4f6f8]" : themeShell(theme)),
      )}
    >
      <div className="flex items-center justify-between border-b border-white/15 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Statcast Log</span>
        <span className="text-[10px]" style={{ color: accent }}>
          {era.year} · {player.name} {isBarf ? `(#${jerseyNumber})` : ""}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="mt-2 grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr] gap-1 text-[9px] uppercase tracking-wide"
        style={{ color: alpha(accent, 0.75) }}
      >
        <span>Pitch</span>
        <span className="text-right">EV</span>
        <span className="text-right">Dist</span>
        <span className="text-right">LA</span>
      </div>

      {/* Scrolling log list */}
      <div className="mt-1 flex-1 overflow-hidden pr-1 text-xs leading-snug">
        <div className="animate-statcast">
        {player.statcast.map((log, i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr] gap-1 py-1 tabular-nums",
              i % 2 === 0 ? (retro ? "bg-[#0d0f33]" : "bg-white/[0.04]") : "",
            )}
          >
            <span className="truncate">{log.pitch}</span>
            <span className="text-right">{log.ev.toFixed(1)}</span>
            <span className="text-right">{log.dist}</span>
            <span className="text-right" style={log.la > 25 ? { color: accent } : undefined}>
              {log.la}&deg;
            </span>
          </div>
        ))}
        </div>
      </div>

      <p className="mt-2 border-t border-white/15 pt-2 text-center text-[9px] uppercase tracking-widest opacity-60">
        Tap to flip
      </p>
      {isBarf && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.08] font-mono font-extrabold text-[150px] leading-none text-white z-0">
          00
        </div>
      )}
    </div>
  )
}
