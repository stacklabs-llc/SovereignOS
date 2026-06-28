import { useEffect, useMemo, useRef, useState } from "react"
import {
  type Advocate,
  type CannedTake,
  type LogEntry,
  cn,
} from "./deck-data"
import { Roster } from "./Roster"
import { HotTakeEngine } from "./HotTakeEngine"
import { SoundboardMatrix } from "./SoundboardMatrix"
import { ControlDeck } from "./ControlDeck"
import { getWsUrl } from "../../api-host"
import { Activity } from "lucide-react"

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

let uid = 100
const nextId = () => `g${uid++}`

export default function AdvocateCommandDeck() {
  const [advocates, setAdvocates] = useState<Advocate[]>([])
  const [selected, setSelected] = useState<Advocate | null>(null)
  const [takes, setTakes] = useState<CannedTake[]>([])
  const [targets, setTargets] = useState<string[]>(["room-823620"])
  const [log, setLog] = useState<LogEntry[]>([])
  const [advocateColors, setAdvocateColors] = useState<Record<string, string>>({})
  
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch all personas on mount
  useEffect(() => {
    fetch("/api/all_personas")
      .then((r) => r.json())
      .then((data) => {
        if (data.personas) {
          const mapped: Advocate[] = data.personas.map((p: any) => ({
            id: p.user_name,
            handle: `@${p.user_name}`,
            name: p.user_name,
            team: (p.team || "GLOBAL").toUpperCase(),
            online: true,
            initials: p.user_name.slice(0, 2).toUpperCase(),
            avatar_url: `/api/persona_image/${p.user_name}`
          }))
          setAdvocates(mapped)
          
          const colors: Record<string, string> = {}
          data.personas.forEach((p: any) => {
            colors[p.user_name] = p.color || "#ff5733"
          })
          setAdvocateColors(colors)

          if (mapped.length > 0) {
            setSelected(mapped[0])
          }
        }
      })
      .catch(console.error)
  }, [])

  // Fetch canned takes for active advocate
  useEffect(() => {
    if (!selected) return
    fetch(`/api/soundboard?advocateId=${selected.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTakes(data)
        } else {
          setTakes([])
        }
      })
      .catch((err) => {
        console.error("Failed to load soundboard takes", err)
        setTakes([])
      })
  }, [selected])

  // Setup WebSocket relay
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>
    
    function connect() {
      const socket = new WebSocket(getWsUrl("/ws-relay"))
      
      socket.onopen = () => {
        console.log("Command Deck WebSocket connected")
        socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: "GLOBAL" }))
      }

      socket.onclose = () => {
        console.log("Command Deck WebSocket disconnected, reconnecting...")
        reconnectTimeout = setTimeout(connect, 4000)
      }

      socket.onerror = (e) => {
        console.error("Command Deck WebSocket error", e)
      }

      wsRef.current = socket
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  const advocateTakes = useMemo(() => {
    if (!selected) return []
    return takes.filter((t) => t.advocateId === selected.id)
  }, [takes, selected])

  async function saveTake(text: string) {
    if (!selected) return
    try {
      const res = await fetch("/api/soundboard/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advocateId: selected.id,
          text: text,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.take) {
          setTakes((prev) => [data.take, ...prev])
        }
      }
    } catch (e) {
      console.error("Failed to save take", e)
    }
  }

  async function renameTake(id: string, title: string) {
    try {
      const res = await fetch(`/api/soundboard/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setTakes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, title } : t))
        )
      }
    } catch (e) {
      console.error("Failed to rename take", e)
    }
  }

  async function deleteTake(id: string) {
    try {
      const res = await fetch(`/api/soundboard/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setTakes((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (e) {
      console.error("Failed to delete take", e)
    }
  }

  function fireTake(take: CannedTake) {
    if (!selected) return
    
    // Broadcast websocket message for active targets
    targets.forEach((targetId) => {
      if (targetId.startsWith("room-")) {
        const gamePk = targetId.replace("room-", "")
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "CHAT_MESSAGE",
              user: selected.name,
              color: advocateColors[selected.id] || "#ff5733",
              text: take.text,
              target_game_pk: gamePk,
            })
          )
        }
      } else if (targetId === "swarm-all") {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "CHAT_MESSAGE",
              user: selected.name,
              color: advocateColors[selected.id] || "#ff5733",
              text: take.text,
              target_game_pk: "GLOBAL",
            })
          )
        }
      } else if (targetId.startsWith("hook-")) {
        // Mock webhook post
        const hookUrl = targetId === "hook-x" ? "POST /webhooks/x" : "POST /webhooks/yt"
        console.log(`Mocking webhook transmission: ${hookUrl}`, take.text)
      }
    })

    const stamp = now()
    const entries: LogEntry[] = targets.map((tid) => {
      const match = tid === "room-823620" ? "Scruffy's Tavern #823620" :
                    tid === "room-118402" ? "The Dugout #118402" :
                    tid === "hook-x" ? "X Outbound" :
                    tid === "hook-yt" ? "YouTube Ingress" : "Global Swarm"
      return {
        id: nextId(),
        time: stamp,
        handle: selected.handle,
        target: match,
        payload: take.text.length > 50 ? take.text.slice(0, 47) + "..." : take.text,
      }
    })
    setLog((prev) => [...entries, ...prev].slice(0, 40))
  }

  function toggleTarget(id: string) {
    setTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black text-white">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-zinc-900">
            <Activity className="size-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">Advocate Command Deck</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              soundboard execution layer
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          system nominal
        </div>
      </header>

      <div className="flex min-h-0 flex-1 bg-zinc-950">
        {advocates.length > 0 && selected ? (
          <Roster advocates={advocates} selectedId={selected.id} onSelect={setSelected} />
        ) : (
          <div className="w-64 border-r border-white/10 flex items-center justify-center bg-black/40">
            <p className="font-mono text-xs text-muted-foreground/60 animate-pulse">Loading roster...</p>
          </div>
        )}

        {selected ? (
          <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4">
            <HotTakeEngine advocate={selected} onSave={saveTake} />
            <SoundboardMatrix
              advocate={selected}
              takes={advocateTakes}
              onFire={fireTake}
              onRename={renameTake}
              onDelete={deleteTake}
            />
          </main>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground/60 animate-pulse">Awaiting active advocate selection...</p>
          </div>
        )}

        <ControlDeck selectedTargets={targets} onToggleTarget={toggleTarget} log={log} />
      </div>
    </div>
  )
}
