"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { TesseractCardCanvas } from "@/components/TesseractCardCanvas"
import { player, eras, type CardTheme } from "@/lib/player-data"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

const THEMES: { id: CardTheme; label: string }[] = [
  { id: "standard", label: "Broadcast" },
  { id: "sim-premium", label: "Sim-Premium" },
  { id: "retro-16-bit", label: "Retro 16-Bit" },
]

function useWebSocket(url: string, gamePk?: string) {
  const [data, setData] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!url) return

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
          if (gamePk) {
            console.log(`[Tesseract-WS] Joining room for gamePk: ${gamePk}`)
            socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: gamePk, room: gamePk }))
          }
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
  }, [url, gamePk])

  return { data, connected }
}

export function CardScene() {
  const [theme, setTheme] = useState<CardTheme>("standard")
  const [leverageActive, setLeverageActive] = useState(false)
  const [eraIndex, setEraIndex] = useState(4) // Default: Index 4 (Modern 2024)
  const [playerState, setPlayerState] = useState(player)
  const [playerType, setPlayerType] = useState<"batter" | "pitcher">("batter")
  const [playerNameParam, setPlayerNameParam] = useState<string>("")
  const [gamePk, setGamePk] = useState<string>("")
  const [wsUrl, setWsUrl] = useState<string>("")

  // Read initial query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const pType = params.get("playerType") === "pitcher" ? "pitcher" : "batter"
      const gPk = params.get("gamePk") || ""
      const nameParam = params.get("playerName") || params.get("name") || ""
      console.log("[Tesseract-UAT] search:", window.location.search, "nameParam:", nameParam)
      setPlayerType(pType)
      setGamePk(gPk)
      setPlayerNameParam(nameParam)

      // Connect to the FanStack relay WebSocket
      const protocol = window.location.protocol.startsWith("https") ? "wss:" : "ws:"
      let url = ""
      if (window.location.port === "3026") {
        // Standalone Next.js dev server - connect directly to local FanStack relay on 8008
        url = `ws://127.0.0.1:8008`
      } else {
        // Running inside Vite proxy (either 3016 or 3010)
        // We can just use the current page's hostname and port to connect to the /ws proxy path!
        url = `${protocol}//${window.location.host}/ws`
      }
      setWsUrl(url)
    }
  }, [])

  const era = eras[eraIndex]

  // Connect to the FanStack relay WebSocket
  const { data: wsData, connected } = useWebSocket(wsUrl, gamePk)

  // Venue-Awareness Filter
  let displayEra = { ...era }
  const venue = wsData?.data?.venue_name || ""
  if (venue) {
    if (venue.toLowerCase().includes("citi field")) {
      displayEra.ink = "#FF5910"
      displayEra.trim = "#002D62"
      displayEra.accent = "#FF5910"
      displayEra.cardBg = "#002D62"
      if (displayEra.id === "2024") {
        displayEra.team = "New York Mets"
        displayEra.tagline = "Citi Field Ingress"
      }
    } else if (venue.toLowerCase().includes("oracle park")) {
      displayEra.ink = "#FD5A1E"
      displayEra.trim = "#27251F"
      displayEra.accent = "#FD5A1E"
      displayEra.cardBg = "#27251F"
      if (displayEra.id === "2024") {
        displayEra.team = "San Francisco Giants"
        displayEra.tagline = "Oracle Park Ingress"
      }
    }
  }

  // Handle dynamic player default before socket updates
  useEffect(() => {
    const isBatter = playerType === "batter"
    const defaultName = isBatter ? "Marcus Vela" : "Senga Kodai"
    const name = playerNameParam || defaultName
    const position = name.toLowerCase().includes("barf") ? "DH" : (isBatter ? "CF" : "P")
    const number = name.toLowerCase().includes("barf") ? "00" : (isBatter ? "24" : "99")
    const headshot = name.toLowerCase().includes("barf") ? "/barf-1970.png" : (isBatter ? "/player-headshot.png" : "/era-1979.png")
    const metrics = name.toLowerCase().includes("barf") ? [
      { label: "AVG", value: ".324" },
      { label: "OBP", value: ".412" },
      { label: "SLG", value: ".608" },
      { label: "OPS", value: "1.020" },
      { label: "HR", value: "42" },
      { label: "RBI", value: "115" },
    ] : (isBatter ? player.metrics : [
      { label: "ERA", value: "3.18" },
      { label: "WHIP", value: "1.15" },
      { label: "W", value: "12" },
      { label: "L", value: "5" },
      { label: "SO", value: "180" },
      { label: "IP", value: "150.1" },
    ])
    let currentLogs = isBatter ? player.statcast : []
    if (typeof window !== "undefined" && gamePk) {
      const storageKey = `tesseract_statcast_${gamePk}_default_${playerType}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          currentLogs = JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }
    setPlayerState({
      name,
      team: isBatter ? "Harbor City Tridents" : "Harbor City Mariners",
      position,
      number,
      headshot,
      metrics,
      statcast: currentLogs
    })
  }, [playerType, gamePk, playerNameParam])

  // Update game state dynamically on STATE_UPDATE
  useEffect(() => {
    if (wsData?.type === "STATE_UPDATE") {
      const stateData = wsData.data || {}
      
      // Bind incoming leverage index telemetry
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
        const runDiff = Math.abs((stateData.home_score || 0) - (stateData.away_score || 0))
        const inning = parseInt(stateData.inning || "1", 10)
        const isScoringThreat = runnersInScoringPosition && outs === 2
        const isLateGamePressure = inning >= 9 && runDiff <= 1
        active = isScoringThreat || isLateGamePressure
      }
      
      setLeverageActive(active)

      // Map dynamic player details based on playerType
      const isBatter = playerType === "batter"
      const name = playerNameParam || (isBatter ? (stateData.batter || "Marcus Vela") : (stateData.pitcher || "Senga Kodai"))
      const isBarf = name.toLowerCase().includes("barf")
      const position = isBarf ? "DH" : (isBatter ? (stateData.position || "CF") : "P")
      const number = isBarf ? "00" : (isBatter ? (stateData.jersey_number || "24") : "99")
      const pId = isBarf ? undefined : (isBatter ? stateData.batter_id : stateData.pitcher_id)
      const headshot = pId 
        ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${pId}/headshot/67/current`
        : (isBarf ? "/barf-1970.png" : (isBatter ? "/player-headshot.png" : "/era-1979.png"))

      const metrics = isBarf ? [
        { label: "AVG", value: ".324" },
        { label: "OBP", value: ".412" },
        { label: "SLG", value: ".608" },
        { label: "OPS", value: "1.020" },
        { label: "HR", value: "42" },
        { label: "RBI", value: "115" },
      ] : (isBatter ? [
        { label: "AVG", value: stateData.batter_avg || ".318" },
        { label: "OBP", value: stateData.batter_obp || ".402" },
        { label: "SLG", value: stateData.batter_slg || ".571" },
        { label: "OPS", value: stateData.batter_ops || ".973" },
        { label: "HR", value: stateData.batter_hr || "31" },
        { label: "RBI", value: stateData.batter_rbi || "88" },
      ] : [
        { label: "ERA", value: stateData.pitcher_era || "3.18" },
        { label: "WHIP", value: stateData.pitcher_whip || "1.15" },
        { label: "W", value: stateData.pitcher_wins || "12" },
        { label: "L", value: stateData.pitcher_losses || "5" },
        { label: "SO", value: stateData.pitcher_so || "180" },
        { label: "IP", value: stateData.pitcher_ip || "150.1" },
      ])

      // Persistent Statcast ledger: load from local storage
      let currentLogs = isBatter ? player.statcast : []
      if (typeof window !== "undefined" && gamePk) {
        const storageKey = `tesseract_statcast_${gamePk}_${pId || name}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            currentLogs = JSON.parse(saved)
          } catch (e) {
            console.error(e)
          }
        }
      }

      // Real-Time Statcast Log Injection
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
        const lastLog = currentLogs[currentLogs.length - 1]
        if (
          !lastLog ||
          lastLog.pitch !== pitchName ||
          lastLog.ev !== hitSpeed ||
          lastLog.dist !== hitDist ||
          lastLog.la !== launchAngle
        ) {
          currentLogs = [...currentLogs, { pitch: pitchName, ev: hitSpeed, dist: hitDist, la: launchAngle }]
          if (typeof window !== "undefined" && gamePk) {
            const storageKey = `tesseract_statcast_${gamePk}_${pId || name}`
            localStorage.setItem(storageKey, JSON.stringify(currentLogs))
          }
        }
      }

      setPlayerState({
        name,
        team: isBatter ? (stateData.batting_team || "Harbor City Tridents") : (stateData.home_team || "Harbor City Tridents"),
        position,
        number,
        headshot,
        metrics,
        statcast: currentLogs
      })
    }
  }, [wsData, playerType, gamePk])

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
          <TesseractCardCanvas player={playerState} theme={theme} era={displayEra} leverageActive={leverageActive} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Header */}
      <header className="pointer-events-none relative z-10 flex flex-col items-center gap-1 p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
          {venue ? `${venue} Portal` : "Live Sports Portal"}
        </span>
        <h1 className="text-balance text-2xl font-bold text-foreground">{playerState.name}</h1>
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
            <span className="font-extrabold text-cyan-400 tabular-nums">{displayEra.year} — {displayEra.label}</span>
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPlayerType((pt) => pt === "batter" ? "pitcher" : "batter")}
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card/65 px-4 py-2 text-xs font-bold text-cyan-300 hover:text-foreground transition-all shadow-md"
            >
              🔄 {playerType === "batter" ? "Pitcher" : "Batter"}
            </button>

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
    </div>
  )
}
