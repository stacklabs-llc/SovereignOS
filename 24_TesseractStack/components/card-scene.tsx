"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { BaseballCard3D } from "@/components/baseball-card-3d"
import { player, eras, type CardTheme } from "@/lib/player-data"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

const THEMES: { id: CardTheme; label: string }[] = [
  { id: "standard", label: "Broadcast" },
  { id: "sim-premium", label: "Sim-Premium" },
  { id: "retro-16-bit", label: "Retro 16-Bit" },
]

function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let socket: WebSocket
    let reconnectTimeout: NodeJS.Timeout

    function connect() {
      console.log(`[Tesseract-WS] Connecting to ${url}...`)
      try {
        socket = new WebSocket(url)
        socketRef.current = socket

        socket.onopen = () => {
          console.log("[Tesseract-WS] Connected to FanStack relay")
          setConnected(true)
        }

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === "STATE_UPDATE") {
              console.log("[Tesseract-WS] Received STATE_UPDATE", message)
              setData(message)
            }
          } catch (err) {
            console.error("[Tesseract-WS] Error parsing WebSocket message:", err)
          }
        }

        socket.onclose = () => {
          console.log("[Tesseract-WS] Disconnected. Reconnecting in 3s...")
          setConnected(false)
          reconnectTimeout = setTimeout(connect, 3000)
        }

        socket.onerror = (err) => {
          console.error("[Tesseract-WS] WebSocket error:", err)
          socket.close()
        }
      } catch (err) {
        console.error("[Tesseract-WS] WebSocket connection failed:", err)
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
      clearTimeout(reconnectTimeout)
    }
  }, [url])

  return { data, connected }
}

export function CardScene() {
  const [theme, setTheme] = useState<CardTheme>("standard")
  const [leverageActive, setLeverageActive] = useState(false)
  const [eraIndex, setEraIndex] = useState(4) // Default: Index 4 (Modern 2024)
  const [playerState, setPlayerState] = useState(player)

  const era = eras[eraIndex]

  // Connect to the FanStack relay WebSocket
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost"
  // Goal 1 specifies port 8000, and the proxy /ws maps to 8008. We will target the primary 8008 or fallback to 8000.
  const { data: wsData, connected } = useWebSocket(`ws://${host}:8008`)

  useEffect(() => {
    if (wsData?.type === "STATE_UPDATE") {
      const stateData = wsData.data || {}
      
      // Goal 2: Bind incoming leverage index telemetry
      const li = stateData.leverage_index ?? stateData.leverage ?? stateData.situational_leverage
      
      const onSecond = stateData.onSecond || false
      const onThird = stateData.onThird || false
      const outs = parseInt(stateData.outs || "0", 10)
      const runnersInScoringPosition = onSecond || onThird

      let active = false
      if (typeof li === "number") {
        active = li > 3.0
      } else if (typeof li === "string" && !isNaN(parseFloat(li))) {
        active = parseFloat(li) > 3.0
      } else {
        // Fallback: runners in scoring position with 2 outs, or late inning pressure
        const runDiff = Math.abs((stateData.home_score || 0) - (stateData.away_score || 0))
        const inning = parseInt(stateData.inning || "1", 10)
        
        const isScoringThreat = runnersInScoringPosition && outs === 2
        const isLateGamePressure = inning >= 9 && runDiff <= 1
        
        active = isScoringThreat || isLateGamePressure
      }
      
      setLeverageActive(active)

      // Stage 1: Real-Time Statcast Log Injection
      const pitchName = stateData.pitch_name
      const hitSpeed = parseFloat(stateData.hit_speed)
      const hitDist = parseFloat(stateData.hit_distance)
      const launchAngle = parseFloat(stateData.launch_angle)

      if (
        pitchName &&
        pitchName !== "---" &&
        !isNaN(hitSpeed) &&
        !isNaN(hitDist) &&
        !isNaN(launchAngle)
      ) {
        setPlayerState((prev) => {
          const logs = prev.statcast
          const lastLog = logs[logs.length - 1]
          
          // Only append if it's a new unique pitch entry
          if (
            !lastLog ||
            lastLog.pitch !== pitchName ||
            lastLog.ev !== hitSpeed ||
            lastLog.dist !== hitDist ||
            lastLog.la !== launchAngle
          ) {
            return {
              ...prev,
              statcast: [...logs, { pitch: pitchName, ev: hitSpeed, dist: hitDist, la: launchAngle }],
            }
          }
          return prev
        })
      }
    }
  }, [wsData])

  return (
    <div className="relative h-svh w-full bg-transparent flex flex-col justify-between">
      {/* Canvas */}
      <Canvas
        className="!absolute inset-0 z-0"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-4, -2, 2]} intensity={0.4} color="#2bf5ff" />
        <Suspense fallback={null}>
          <BaseballCard3D player={playerState} theme={theme} era={era} leverageActive={leverageActive} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Header */}
      <header className="pointer-events-none relative z-10 flex flex-col items-center gap-1 p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Live Sports Portal</span>
        <h1 className="text-balance text-2xl font-bold text-foreground">3D Player Card</h1>
        <p className="text-xs text-muted-foreground flex items-center gap-2 justify-center">
          Hover to tilt · Click the card to flip
          <span className={cn("inline-block w-2.5 h-2.5 rounded-full", connected ? "bg-emerald-400" : "bg-rose-400")} title={connected ? "WS Connected" : "WS Disconnected"} />
        </p>
      </header>

      {/* Controls Container */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 w-full max-w-md mx-auto">
        {/* Era Timeline Scrubber */}
        <div className="w-full flex flex-col gap-2 rounded-2xl border border-border/40 bg-card/65 p-4 backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-muted-foreground">4D Timeline</span>
            <span className="font-extrabold text-cyan-400 tabular-nums">{era.year} — {era.label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={eras.length - 1}
            value={eraIndex}
            onChange={(e) => setEraIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-semibold mt-1">
            {eras.map((e, idx) => (
              <span 
                key={e.id} 
                className={cn("cursor-pointer transition-colors", idx === eraIndex ? "text-cyan-300 font-bold" : "hover:text-foreground")}
                onClick={() => setEraIndex(idx)}
              >
                {e.year}
              </span>
            ))}
          </div>
        </div>

        {/* Theme and Leverage Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
          <div className="flex gap-1 rounded-full border border-border/40 bg-card/65 p-1 backdrop-blur-md shadow-md">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  theme === t.id
                    ? "bg-cyan-500 text-[#0b1b2b] shadow-md shadow-cyan-500/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLeverageActive((v) => !v)}
            aria-pressed={leverageActive}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all shadow-md",
              leverageActive
                ? "border-cyan-400 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(43,245,255,0.35)]"
                : "border-border/40 bg-card/65 text-muted-foreground hover:text-foreground",
            )}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {leverageActive ? "Leverage: HIGH" : "Threshold"}
          </button>
        </div>
      </div>
    </div>
  )
}
