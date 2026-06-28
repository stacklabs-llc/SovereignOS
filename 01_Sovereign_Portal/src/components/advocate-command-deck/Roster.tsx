import { type Advocate, cn } from "./deck-data"
import { teamBadge, teamGlow, teamDot } from "./team-styles"
import { Radio } from "lucide-react"

export function Roster({
  advocates,
  selectedId,
  onSelect,
}: {
  advocates: Advocate[]
  selectedId: string
  onSelect: (a: Advocate) => void
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <Radio className="size-4 text-muted-foreground animate-pulse text-[#38bdf8]" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">Roster</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {advocates.length} advocates
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="AI Advocates">
        <ul className="flex flex-col gap-1">
          {advocates.map((a) => {
            const active = a.id === selectedId
            const teamKey = teamBadge[a.team] ? a.team : "GLOBAL";
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onSelect(a)}
                  aria-pressed={active}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left transition-all",
                    active
                      ? cn("bg-white/[0.04]", teamGlow[teamKey])
                      : "hover:border-white/10 hover:bg-white/[0.02]",
                  )}
                >
                  <div className="relative">
                    {a.avatar_url ? (
                      <img
                        src={a.avatar_url}
                        alt={a.name}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border object-cover",
                          teamBadge[teamKey],
                        )}
                        onError={(e) => {
                          // fallback to initials if image fails to load
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border font-mono text-xs font-semibold",
                        teamBadge[teamKey],
                      )}
                    >
                      {a.initials}
                    </span>
                    {a.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center">
                        <span className="absolute inline-flex size-3 animate-ping rounded-full bg-emerald-400/60" />
                        <span className="relative inline-flex size-2.5 rounded-full border-2 border-black bg-emerald-400" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-white group-hover:text-[#38bdf8] transition-colors">{a.handle}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", teamDot[teamKey])} />
                      <span
                        className={cn(
                          "rounded border px-1 py-px font-mono text-[9px] font-bold uppercase tracking-wider",
                          teamBadge[teamKey],
                        )}
                      >
                        {a.team}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
