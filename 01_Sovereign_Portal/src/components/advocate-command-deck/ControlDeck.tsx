import { TARGETS, type LogEntry, type Target, type TargetGroup, cn } from "./deck-data"
import { Crosshair, Terminal, CheckSquare, Square, Zap } from "lucide-react"

const GROUPS: TargetGroup[] = ["Live Chat Rooms", "Webhooks", "Global Swarm Matrix"]

export function ControlDeck({
  selectedTargets,
  onToggleTarget,
  log,
}: {
  selectedTargets: string[]
  onToggleTarget: (id: string) => void
  log: LogEntry[]
}) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 bg-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <Crosshair className="size-4 text-muted-foreground animate-pulse text-[#38bdf8]" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">Control Deck</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            ingress &amp; targeting
          </p>
        </div>
      </div>

      {/* Target selector */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Payload destination
        </p>
        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => (
            <fieldset key={group}>
              <legend className="mb-1.5 text-xs font-semibold text-white/80">{group}</legend>
              <div className="flex flex-col gap-1.5">
                {TARGETS.filter((t) => t.group === group).map((t) => (
                  <TargetRow
                    key={t.id}
                    target={t}
                    checked={selectedTargets.includes(t.id)}
                    onToggle={() => onToggleTarget(t.id)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {/* Telemetry log */}
      <div className="border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-[#38bdf8]" aria-hidden="true" />
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Transmission Log
            </h3>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            live
          </span>
        </div>
        <div className="h-44 overflow-y-auto bg-black/60 px-4 py-2 font-mono text-[10px] leading-relaxed">
          {log.length === 0 ? (
            <p className="text-muted-foreground/50">{"// no transmissions yet"}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {log.map((e) => (
                <li key={e.id} className="text-gray-400">
                  <span className="text-muted-foreground/50">[{e.time}]</span>{" "}
                  <span className="text-white font-bold">{e.handle}</span>{" "}
                  <span className="text-gray-400">→ {e.target}:</span>{" "}
                  <span className="text-[#38bdf8]">&quot;{e.payload}&quot;</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}

function TargetRow({
  target,
  checked,
  onToggle,
}: {
  target: Target
  checked: boolean
  onToggle: () => void
}) {
  const swarm = target.group === "Global Swarm Matrix"
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-all w-full",
        checked
          ? swarm
            ? "border-amber-400/50 bg-amber-400/10 shadow-[0_0_14px_-4px_oklch(0.78_0.17_90/0.8)]"
            : "border-white/25 bg-white/[0.05]"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
      )}
    >
      {checked ? (
        <CheckSquare className={cn("size-4 shrink-0", swarm ? "text-amber-400" : "text-white")} aria-hidden="true" />
      ) : (
        <Square className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-white">
          {swarm && <Zap className="size-3 text-amber-400 animate-pulse" aria-hidden="true" />}
          <span className="truncate">{target.label}</span>
        </span>
        <span className="block truncate font-mono text-[10px] text-gray-500">{target.meta}</span>
      </span>
    </button>
  )
}
