import { useRef, useState } from "react"
import { type Advocate, cn } from "./deck-data"
import { teamGlow, teamText } from "./team-styles"
import { Sparkles, Loader2, Save } from "lucide-react"

export function HotTakeEngine({
  advocate,
  onSave,
}: {
  advocate: Advocate
  onSave: (text: string) => void
}) {
  const [prompt, setPrompt] = useState("")
  const [output, setOutput] = useState("")
  const [engine, setEngine] = useState("gemini-2.0-flash")
  const [streaming, setStreaming] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  async function generate() {
    if (streaming) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setOutput("")
    setStreaming(true)

    try {
      const res = await fetch("/api/hot_take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: advocate.id,
          topic: prompt.trim() || "current game status",
          engine: engine,
          short_mode: true,
          reply_mode: false,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()
      let fullText = data.text || ""
      
      // Clean up common prefix strings if any
      fullText = fullText
        .replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, "")
        .replace(/^["']|["']$/g, "")
        .trim()

      let i = 0
      const tick = () => {
        i += Math.max(1, Math.round(Math.random() * 4))
        setOutput(fullText.slice(0, i))
        if (i < fullText.length) {
          timers.current.push(setTimeout(tick, 15))
        } else {
          setOutput(fullText)
          setStreaming(false)
        }
      }
      timers.current.push(setTimeout(tick, 100))
    } catch (e: any) {
      setOutput(`Error generating take: ${e.message}`)
      setStreaming(false)
    }
  }

  const teamKey = teamText[advocate.team] ? advocate.team : "GLOBAL";

  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-white/10 bg-zinc-950/80 p-4",
        teamGlow[teamKey],
      )}
      aria-label="Generative Hot Take Engine"
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#38bdf8]" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Generative Hot Take Engine</h2>
        </div>
        <span className={cn("font-mono text-[10px] uppercase tracking-widest", teamText[teamKey])}>
          {advocate.handle}
        </span>
      </header>

      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder="Demand a Hot Take..."
          className="h-10 flex-1 rounded-md border border-white/10 bg-black/60 px-3 font-mono text-sm text-white placeholder:text-muted-foreground/60 focus:border-[#38bdf8]/40 focus:outline-none focus:ring-1 focus:ring-[#38bdf8]/20"
        />
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          className="h-10 rounded-md border border-white/10 bg-black/80 px-2 font-mono text-xs text-white focus:border-[#38bdf8]/40 focus:outline-none"
        >
          <option value="gemini-2.0-flash">⚡ Gemini Flash</option>
          <option value="local_llama3">🦙 Llama 3 (Local)</option>
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={streaming}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#38bdf8] px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {streaming ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          Generate
        </button>
      </div>

      <div className="mt-3 min-h-28 rounded-md border border-white/10 bg-black/45 p-3">
        {output ? (
          <p className="text-sm leading-relaxed text-gray-200">
            {output}
            {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[#38bdf8] align-middle" />}
          </p>
        ) : (
          <p className="font-mono text-xs text-muted-foreground/40">
            {"// awaiting prompt — output stream idle"}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!output || streaming}
        onClick={() => {
          onSave(output)
          setOutput("")
          setPrompt("")
        }}
        className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-400/10 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-400/25 hover:shadow-[0_0_18px_-4px_oklch(0.72_0.19_145/0.8)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save className="size-4" aria-hidden="true" />
        Save to Advocate Soundboard
      </button>
    </section>
  )
}
