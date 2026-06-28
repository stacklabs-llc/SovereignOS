import { useState } from "react"
import type { Advocate, CannedTake } from "./deck-data"
import { teamText } from "./team-styles"
import { cn } from "./deck-data"
import { Play, Grid3x3, Pencil, Trash2, Check, X } from "lucide-react"

export function SoundboardMatrix({
  advocate,
  takes,
  onFire,
  onRename,
  onDelete,
}: {
  advocate: Advocate
  takes: CannedTake[]
  onFire: (take: CannedTake) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const teamKey = teamText[advocate.team] ? advocate.team : "GLOBAL";

  return (
    <section
      className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-zinc-950/80 p-4"
      aria-label="Soundboard Matrix"
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Soundboard Matrix</h2>
        </div>
        <span className={cn("font-mono text-[10px] uppercase tracking-widest text-gray-400", teamText[teamKey])}>
          {takes.length} canned takes
        </span>
      </header>

      {takes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-white/10 min-h-[160px]">
          <p className="font-mono text-xs text-muted-foreground/60">
            {"// no saved takes — generate one above"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4 max-h-[350px]">
          {takes.map((t) => {
            const editing = editingId === t.id
            return (
              <div
                key={t.id}
                className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-md border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-3 transition-all hover:border-white/25 hover:shadow-[0_0_20px_-6px_rgba(255,255,255,0.25)] active:translate-y-px active:shadow-none"
              >
                {/* fire / play overlay */}
                {!editing && (
                  <button
                    type="button"
                    onClick={() => onFire(t)}
                    aria-label={`Fire take: ${t.title}`}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                  >
                    <span className={cn("flex size-12 items-center justify-center rounded-full border-2 border-[#38bdf8]", teamText[teamKey])}>
                      <Play className="size-5 translate-x-0.5 fill-current text-[#38bdf8]" aria-hidden="true" />
                    </span>
                  </button>
                )}

                {editing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRename(t.id, draft.trim() || t.title)
                        setEditingId(null)
                      }
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    className="w-full rounded border border-white/20 bg-black px-1.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                ) : (
                  <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-white">{t.title}</h3>
                )}

                <p className="mt-1 line-clamp-3 font-mono text-[10px] leading-snug text-gray-400">
                  {t.text}
                </p>

                {/* controls */}
                <div className="z-20 mt-2 flex items-center justify-end gap-1">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        aria-label="Confirm rename"
                        onClick={() => {
                          onRename(t.id, draft.trim() || t.title)
                          setEditingId(null)
                        }}
                        className="rounded p-1 text-emerald-400 hover:bg-white/10"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-red-400 hover:bg-white/10"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Rename ${t.title}`}
                        onClick={() => {
                          setDraft(t.title)
                          setEditingId(t.id)
                        }}
                        className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${t.title}`}
                        onClick={() => onDelete(t.id)}
                        className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
