import { useState, useEffect, useRef, useCallback } from "react";

// ─── SOVEREIGN MULTIVERSE: LEVEL 1 — THE STARTER SHACK ───────────────────────
// System Context: This dashboard is the "MBA Trap" — a hyper-premium Augusta
// analytics command center designed to make Sean feel like he's in Butler Cabin.
//
// HIDDEN ARCHITECTURE: The video feed module contains a `flowmercialOverride`
// state hook. When Level 2 (The 19th Hole Snack Bar) triggers a Flowmercial,
// the `onFlowmercialInbound` callback will hard-swap the video source and
// overlay the chaotic AI persona content. Sean will have NO dismiss button.
// The Flowmercial duration is controlled by the Snack Bar's autonomy engine.
//
// Persona hooks (dormant in Level 1, activated by Level 2):
//   - Dirtbag Dan: triggers GROUNDS_ALERT overlay on the wind vector panel
//   - Acoustic Phil: hijacks the Acoustic Impact Status with fake readings
//   - The Colonel: forces a "COLONEL'S CORNER" takeover of the broadcast schedule
//
// All override entry points are marked with 🔴 FLOWMERCIAL INJECTION POINT

const AUGUSTA_PALETTE = {
  deepGreen: "#0a3d1f",
  pineGreen: "#0d4f2b",
  fairwayGreen: "#1a6b3c",
  gold: "#c5a44e",
  brightGold: "#d4af37",
  cream: "#f5f0e8",
  ivory: "#faf8f4",
  cardBg: "rgba(10, 61, 31, 0.65)",
  glassBg: "rgba(255, 255, 255, 0.06)",
  glassBorder: "rgba(197, 164, 78, 0.25)",
  textPrimary: "#f5f0e8",
  textSecondary: "rgba(245, 240, 232, 0.7)",
  textMuted: "rgba(245, 240, 232, 0.45)",
  danger: "#e74c3c",
  birdie: "#2ecc71",
  bogey: "#e67e22",
  eagle: "#3498db",
};

// ─── MOCK DATA ENGINE ─────────────────────────────────────────────────────────
const generateLeaderboard = () => {
  const players = [
    { name: "S. Scheffler", country: "USA", thru: "F", r1: 66, r2: 68, r3: 65, r4: null, movement: "up" },
    { name: "R. McIlroy", country: "NIR", thru: "F", r1: 67, r2: 69, r3: 67, r4: null, movement: "same" },
    { name: "X. Schauffele", country: "USA", thru: "F", r1: 69, r2: 66, r3: 68, r4: null, movement: "up" },
    { name: "J. Rahm", country: "ESP", thru: "15", r1: 68, r2: 70, r3: 66, r4: null, movement: "up" },
    { name: "C. Morikawa", country: "USA", thru: "F", r1: 70, r2: 67, r3: 68, r4: null, movement: "down" },
    { name: "B. DeChambeau", country: "USA", thru: "14", r1: 71, r2: 68, r3: 67, r4: null, movement: "up" },
    { name: "L. Åberg", country: "SWE", thru: "F", r1: 68, r2: 71, r3: 68, r4: null, movement: "down" },
    { name: "T. Fleetwood", country: "ENG", thru: "F", r1: 69, r2: 69, r3: 70, r4: null, movement: "same" },
    { name: "V. Hovland", country: "NOR", thru: "16", r1: 70, r2: 70, r3: 69, r4: null, movement: "down" },
    { name: "M. Fitzpatrick", country: "ENG", thru: "F", r1: 71, r2: 69, r3: 70, r4: null, movement: "up" },
    { name: "S. Im", country: "KOR", thru: "F", r1: 72, r2: 68, r3: 71, r4: null, movement: "same" },
    { name: "T. Hatton", country: "ENG", thru: "13", r1: 69, r2: 72, r3: 70, r4: null, movement: "down" },
    { name: "S. Burns", country: "USA", thru: "F", r1: 73, r2: 69, r3: 70, r4: null, movement: "up" },
    { name: "P. Cantlay", country: "USA", thru: "F", r1: 70, r2: 71, r3: 71, r4: null, movement: "same" },
    { name: "J. Thomas", country: "USA", thru: "F", r1: 74, r2: 68, r3: 71, r4: null, movement: "up" },
  ];
  return players.map((p, i) => {
    const total = p.r1 + p.r2 + p.r3 - 216;
    return { ...p, pos: i + 1, total, totalStr: total === 0 ? "E" : total > 0 ? `+${total}` : `${total}` };
  });
};

const BROADCAST_SCHEDULE = [
  { time: "8:00 AM", event: "Featured Groups — Amen Corner", status: "live", channel: "MASTERS.COM" },
  { time: "10:00 AM", event: "Holes 15 & 16 — Moving Day Coverage", status: "live", channel: "ESPN+" },
  { time: "12:00 PM", event: "Third Round Broadcast — Main Feed", status: "upcoming", channel: "CBS" },
  { time: "2:00 PM", event: "Featured Groups — Back Nine", status: "upcoming", channel: "MASTERS.COM" },
  { time: "5:00 PM", event: "Third Round Highlights & Analysis", status: "upcoming", channel: "CBS" },
  { time: "7:00 PM", event: "Butler Cabin — Green Jacket Ceremony (Sun)", status: "locked", channel: "CBS" },
];

const WIND_DATA = [
  { hole: 1, dir: "NNW", speed: 8, gust: 14 },
  { hole: 7, dir: "WNW", speed: 11, gust: 18 },
  { hole: 11, dir: "SSW", speed: 6, gust: 9 },
  { hole: 12, dir: "SW", speed: 14, gust: 22 },
  { hole: 13, dir: "WSW", speed: 9, gust: 15 },
  { hole: 15, dir: "S", speed: 7, gust: 12 },
  { hole: 16, dir: "SSE", speed: 12, gust: 19 },
];

const PROXIMITY_DATA = [
  { player: "Scheffler", avg: "14'2\"", shots: 42, inside10: "38%", trend: "improving" },
  { player: "McIlroy", avg: "18'7\"", shots: 41, inside10: "29%", trend: "declining" },
  { player: "Schauffele", avg: "15'11\"", shots: 43, inside10: "35%", trend: "stable" },
  { player: "Rahm", avg: "16'4\"", shots: 38, inside10: "32%", trend: "improving" },
  { player: "DeChambeau", avg: "19'1\"", shots: 36, inside10: "27%", trend: "improving" },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function GoldDivider({ className = "" }) {
  return (
    <div className={`w-full h-px ${className}`} style={{
      background: `linear-gradient(90deg, transparent, ${AUGUSTA_PALETTE.gold}, transparent)`
    }} />
  );
}

function SectionHeader({ title, subtitle, badge, live }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          color: AUGUSTA_PALETTE.cream,
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>{title}</h2>
        {badge && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.55rem",
            color: AUGUSTA_PALETTE.gold,
            border: `1px solid ${AUGUSTA_PALETTE.glassBorder}`,
            padding: "2px 8px",
            borderRadius: "3px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>{badge}</span>
        )}
        {live && (
          <span className="flex items-center gap-1.5" style={{ fontSize: "0.6rem", color: AUGUSTA_PALETTE.danger }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: AUGUSTA_PALETTE.danger }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: AUGUSTA_PALETTE.danger }} />
            </span>
            LIVE
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.55rem",
          color: AUGUSTA_PALETTE.textMuted,
          letterSpacing: "0.05em",
        }}>{subtitle}</span>
      )}
    </div>
  );
}

function GlassCard({ children, className = "", style = {}, id }) {
  return (
    <div id={id} className={`rounded-lg overflow-hidden ${className}`} style={{
      background: AUGUSTA_PALETTE.cardBg,
      backdropFilter: "blur(20px) saturate(1.4)",
      WebkitBackdropFilter: "blur(20px) saturate(1.4)",
      border: `1px solid ${AUGUSTA_PALETTE.glassBorder}`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      ...style,
    }}>{children}</div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function Leaderboard() {
  const [players] = useState(generateLeaderboard);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const movementIcon = (m) => m === "up" ? "▲" : m === "down" ? "▼" : "—";
  const movementColor = (m) => m === "up" ? AUGUSTA_PALETTE.birdie : m === "down" ? AUGUSTA_PALETTE.bogey : AUGUSTA_PALETTE.textMuted;

  return (
    <GlassCard className="h-full flex flex-col" id="leaderboard-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Masters Leaderboard" subtitle="RD 3 — SATURDAY" badge="Trackman Pro" live />
      </div>
      <GoldDivider />
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin", scrollbarColor: `${AUGUSTA_PALETTE.gold}33 transparent` }}>
        <table className="w-full" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem" }}>
          <thead>
            <tr style={{ color: AUGUSTA_PALETTE.textMuted, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <th className="text-left px-4 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>POS</th>
              <th className="text-left px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>PLAYER</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>THRU</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>R1</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>R2</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>R3</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>TOTAL</th>
              <th className="text-center px-2 py-2 sticky top-0" style={{ background: "rgba(10,61,31,0.95)" }}>MV</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.name}
                onClick={() => setSelectedPlayer(selectedPlayer === i ? null : i)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  color: AUGUSTA_PALETTE.textPrimary,
                  background: selectedPlayer === i ? "rgba(197,164,78,0.12)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  borderLeft: selectedPlayer === i ? `2px solid ${AUGUSTA_PALETTE.gold}` : "2px solid transparent",
                }}
                onMouseEnter={e => { if (selectedPlayer !== i) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (selectedPlayer !== i) e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"; }}
              >
                <td className="px-4 py-2" style={{ color: i < 3 ? AUGUSTA_PALETTE.brightGold : AUGUSTA_PALETTE.textSecondary, fontWeight: i < 3 ? 700 : 400 }}>
                  {i === 0 && "🏆 "}{p.pos}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "0.55rem", color: AUGUSTA_PALETTE.textMuted }}>{p.country}</span>
                    <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: "0.75rem" }}>{p.name}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2" style={{
                  color: p.thru === "F" ? AUGUSTA_PALETTE.textMuted : AUGUSTA_PALETTE.birdie,
                  fontSize: "0.65rem"
                }}>{p.thru}</td>
                <td className="text-center px-2 py-2" style={{ color: AUGUSTA_PALETTE.textSecondary }}>{p.r1}</td>
                <td className="text-center px-2 py-2" style={{ color: AUGUSTA_PALETTE.textSecondary }}>{p.r2}</td>
                <td className="text-center px-2 py-2" style={{ color: AUGUSTA_PALETTE.textSecondary }}>{p.r3}</td>
                <td className="text-center px-2 py-2 font-bold" style={{
                  color: p.total < 0 ? AUGUSTA_PALETTE.birdie : p.total > 0 ? AUGUSTA_PALETTE.bogey : AUGUSTA_PALETTE.cream,
                  fontSize: "0.8rem",
                }}>{p.totalStr}</td>
                <td className="text-center px-2 py-2" style={{ color: movementColor(p.movement), fontSize: "0.6rem" }}>
                  {movementIcon(p.movement)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GoldDivider />
      <div className="px-4 py-2 flex justify-between items-center" style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>PROJECTED CUT: +4 (48 players)</span>
        <span style={{ opacity: tick % 2 === 0 ? 1 : 0.4, transition: "opacity 0.5s" }}>● FEED ACTIVE</span>
        <span>LAST SYNC: {new Date().toLocaleTimeString()}</span>
      </div>
    </GlassCard>
  );
}

// ─── VIDEO FEED ───────────────────────────────────────────────────────────────
// 🔴 FLOWMERCIAL INJECTION POINT: The `flowmercialOverride` state, when set to
// a truthy object by Level 2, replaces the entire video panel content with the
// Snack Bar's chaotic AI-generated commercial. Sean cannot dismiss this.
function VideoFeed() {
  const [flowmercialOverride, setFlowmercialOverride] = useState(null); // 🔴 INJECTION HOOK
  const [currentFeed, setCurrentFeed] = useState("amen-corner");
  const [isBuffering, setIsBuffering] = useState(false);

  // 🔴 SNACK BAR LISTENER (dormant — activated when Level 2 mounts)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === "FLOWMERCIAL_OVERRIDE") {
        setFlowmercialOverride(e.detail.payload);
      }
      if (e.detail?.type === "FLOWMERCIAL_CLEAR") {
        setFlowmercialOverride(null);
      }
    };
    window.addEventListener("snackbar-event", handler);
    return () => window.removeEventListener("snackbar-event", handler);
  }, []);

  const feeds = [
    { id: "amen-corner", label: "AMEN CORNER", holes: "11-12-13" },
    { id: "featured-groups", label: "FEATURED GROUPS", holes: "LIVE" },
    { id: "holes-15-16", label: "HOLES 15 & 16", holes: "15-16" },
    { id: "main-broadcast", label: "MAIN BROADCAST", holes: "CBS" },
  ];

  const switchFeed = (id) => {
    if (flowmercialOverride) return; // 🔴 Feed switching disabled during Flowmercial
    setIsBuffering(true);
    setCurrentFeed(id);
    setTimeout(() => setIsBuffering(false), 800);
  };

  return (
    <GlassCard className="h-full flex flex-col" id="video-feed-panel">
      <div className="p-4 pb-2">
        <SectionHeader
          title={flowmercialOverride ? "⚠ OVERRIDE ACTIVE" : "Live Coverage"}
          subtitle={flowmercialOverride ? "SNACK BAR TAKEOVER" : "MASTERS.COM STREAMING"}
          live
        />
      </div>
      <GoldDivider />

      {/* VIDEO VIEWPORT — 🔴 Flowmercial replaces this entire div */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: "220px" }}>
        {flowmercialOverride ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{
            background: "repeating-linear-gradient(45deg, #ff00ff22, #ff00ff22 10px, #00ffff22 10px, #00ffff22 20px)",
            animation: "flowmercialPulse 0.5s infinite alternate",
          }}>
            <div className="text-center p-6">
              <div style={{ fontSize: "2rem", fontFamily: "'Playfair Display', serif" }}>🎬 FLOWMERCIAL</div>
              <div style={{ color: "#ff00ff", fontSize: "0.8rem" }}>{flowmercialOverride?.persona || "UNKNOWN PERSONA"}</div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{
            background: `radial-gradient(ellipse at center, ${AUGUSTA_PALETTE.pineGreen}88, ${AUGUSTA_PALETTE.deepGreen})`,
          }}>
            {isBuffering ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${AUGUSTA_PALETTE.gold} transparent ${AUGUSTA_PALETTE.gold} ${AUGUSTA_PALETTE.gold}` }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: AUGUSTA_PALETTE.textMuted }}>ACQUIRING FEED...</span>
              </div>
            ) : (
              <>
                {/* Simulated video frame */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0" style={{
                    background: `
                      linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%),
                      radial-gradient(circle at 50% 40%, ${AUGUSTA_PALETTE.fairwayGreen}66, transparent 70%)
                    `,
                  }} />
                  <div className="relative text-center">
                    <div style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      color: AUGUSTA_PALETTE.cream,
                      textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                      letterSpacing: "0.05em",
                    }}>
                      ⛳ THE MASTERS
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      color: AUGUSTA_PALETTE.gold,
                      letterSpacing: "0.2em",
                      marginTop: "4px",
                    }}>
                      {feeds.find(f => f.id === currentFeed)?.label}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.5rem",
                      color: AUGUSTA_PALETTE.textMuted,
                      marginTop: "8px",
                    }}>
                      CONNECT LIVE FEED TO ACTIVATE
                    </div>
                  </div>
                  {/* Scan line effect */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
                  }} />
                </div>

                {/* Channel watermark */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded" style={{
                  background: "rgba(0,0,0,0.5)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: AUGUSTA_PALETTE.textMuted,
                  letterSpacing: "0.1em",
                }}>
                  {feeds.find(f => f.id === currentFeed)?.holes}
                </div>

                {/* Bitrate indicator */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2" style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: AUGUSTA_PALETTE.birdie }}>● 1080p60</span>
                  <span style={{ color: AUGUSTA_PALETTE.textMuted }}>4.2 Mbps</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <GoldDivider />
      {/* Feed selector tabs */}
      <div className="flex">
        {feeds.map(f => (
          <button
            key={f.id}
            onClick={() => switchFeed(f.id)}
            className="flex-1 py-2 px-1 transition-all duration-200 text-center"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.5rem",
              letterSpacing: "0.08em",
              color: currentFeed === f.id ? AUGUSTA_PALETTE.gold : AUGUSTA_PALETTE.textMuted,
              background: currentFeed === f.id ? "rgba(197,164,78,0.1)" : "transparent",
              borderBottom: currentFeed === f.id ? `2px solid ${AUGUSTA_PALETTE.gold}` : "2px solid transparent",
              cursor: flowmercialOverride ? "not-allowed" : "pointer",
              opacity: flowmercialOverride ? 0.3 : 1,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── WIND VECTOR PANEL ────────────────────────────────────────────────────────
// 🔴 FLOWMERCIAL INJECTION POINT: Dirtbag Dan can override wind readings with
// absurd values and display a GROUNDS_ALERT banner across this panel.
function WindVectors() {
  const [hoveredHole, setHoveredHole] = useState(null);

  const dirToDeg = (dir) => {
    const map = { N:0, NNE:22, NE:45, ENE:67, E:90, ESE:112, SE:135, SSE:157, S:180, SSW:202, SW:225, WSW:247, W:270, WNW:292, NW:315, NNW:337 };
    return map[dir] || 0;
  };

  return (
    <GlassCard className="h-full" id="wind-vector-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Wind Vectors" subtitle="ANEMOMETER ARRAY" badge="Holes" />
      </div>
      <GoldDivider />
      <div className="p-4 grid grid-cols-2 gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {WIND_DATA.map(w => (
          <div
            key={w.hole}
            className="p-2.5 rounded transition-all duration-200 cursor-default"
            style={{
              background: hoveredHole === w.hole ? "rgba(197,164,78,0.12)" : AUGUSTA_PALETTE.glassBg,
              border: `1px solid ${hoveredHole === w.hole ? AUGUSTA_PALETTE.glassBorder : "transparent"}`,
            }}
            onMouseEnter={() => setHoveredHole(w.hole)}
            onMouseLeave={() => setHoveredHole(null)}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "0.6rem", color: AUGUSTA_PALETTE.textMuted }}>HOLE {w.hole}</span>
              <span style={{
                fontSize: "0.75rem",
                transform: `rotate(${dirToDeg(w.dir)}deg)`,
                display: "inline-block",
                color: w.speed > 10 ? AUGUSTA_PALETTE.bogey : AUGUSTA_PALETTE.cream,
                transition: "transform 0.3s",
              }}>↑</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: "1rem", fontWeight: 700, color: AUGUSTA_PALETTE.cream }}>{w.speed}</span>
              <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted }}>mph</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span style={{ fontSize: "0.55rem", color: AUGUSTA_PALETTE.gold }}>{w.dir}</span>
              <span style={{ fontSize: "0.5rem", color: w.gust > 15 ? AUGUSTA_PALETTE.danger : AUGUSTA_PALETTE.textMuted }}>
                G{w.gust}
              </span>
            </div>
          </div>
        ))}
        {/* Summary cell */}
        <div className="p-2.5 rounded col-span-2" style={{ background: "rgba(197,164,78,0.06)", border: `1px solid ${AUGUSTA_PALETTE.glassBorder}` }}>
          <div className="flex justify-between items-center">
            <div>
              <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>AVG SUSTAINED</span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: AUGUSTA_PALETTE.cream }}>9.6 <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted }}>mph</span></div>
            </div>
            <div className="text-right">
              <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>PEAK GUST</span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: AUGUSTA_PALETTE.bogey }}>22 <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted }}>mph (#12)</span></div>
            </div>
            <div className="text-right">
              <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>TREND</span>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: AUGUSTA_PALETTE.birdie }}>↓ DECREASING</div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── PROXIMITY ANALYTICS ──────────────────────────────────────────────────────
function ProximityAnalytics() {
  return (
    <GlassCard id="proximity-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Avg Proximity to Pin" subtitle="APPROACH SHOTS" badge="Strokes Gained" />
      </div>
      <GoldDivider />
      <div className="p-4 space-y-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {PROXIMITY_DATA.map((p, i) => (
          <div key={p.player} className="flex items-center gap-3">
            <span style={{ fontSize: "0.55rem", color: AUGUSTA_PALETTE.textMuted, width: "16px", textAlign: "right" }}>{i + 1}</span>
            <span style={{ fontSize: "0.7rem", color: AUGUSTA_PALETTE.cream, width: "85px", fontWeight: 600 }}>{p.player}</span>
            <div className="flex-1 h-4 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(15, 100 - parseInt(p.avg) * 3)}%`,
                  background: `linear-gradient(90deg, ${AUGUSTA_PALETTE.fairwayGreen}, ${AUGUSTA_PALETTE.gold})`,
                  boxShadow: `0 0 8px ${AUGUSTA_PALETTE.gold}44`,
                }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: AUGUSTA_PALETTE.gold, width: "45px", textAlign: "right", fontWeight: 600 }}>{p.avg}</span>
            <span style={{
              fontSize: "0.5rem",
              width: "20px",
              textAlign: "center",
              color: p.trend === "improving" ? AUGUSTA_PALETTE.birdie : p.trend === "declining" ? AUGUSTA_PALETTE.danger : AUGUSTA_PALETTE.textMuted,
            }}>
              {p.trend === "improving" ? "▲" : p.trend === "declining" ? "▼" : "—"}
            </span>
          </div>
        ))}
      </div>
      <GoldDivider />
      <div className="px-4 py-2 flex gap-6" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted }}>
        <span>SAMPLE: RD 1-3 APPROACH SHOTS (150+ YDS)</span>
        <span>SOURCE: TRACKMAN™</span>
      </div>
    </GlassCard>
  );
}

// ─── DRIVE DISTANCE ───────────────────────────────────────────────────────────
function DriveDistances() {
  const drives = [
    { player: "DeChambeau", avg: 318, max: 347, fairway: "52%" },
    { player: "Scheffler", avg: 304, max: 329, fairway: "71%" },
    { player: "Rahm", avg: 301, max: 334, fairway: "64%" },
    { player: "Åberg", avg: 312, max: 341, fairway: "58%" },
    { player: "McIlroy", avg: 307, max: 338, fairway: "67%" },
  ];

  return (
    <GlassCard id="drive-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Drive Distances" subtitle="AVG / MAX / FW%" badge="Launch Monitor" />
      </div>
      <GoldDivider />
      <div className="p-4 space-y-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {drives.map((d, i) => (
          <div key={d.player} className="flex items-center gap-3">
            <span style={{ fontSize: "0.7rem", color: AUGUSTA_PALETTE.cream, width: "90px", fontWeight: 600 }}>{d.player}</span>
            <div className="flex-1 relative h-6 rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="absolute inset-y-0 left-0 rounded flex items-center" style={{
                width: `${((d.avg - 280) / 70) * 100}%`,
                background: `linear-gradient(90deg, ${AUGUSTA_PALETTE.deepGreen}, ${AUGUSTA_PALETTE.fairwayGreen})`,
                border: `1px solid ${AUGUSTA_PALETTE.glassBorder}`,
              }}>
                <span className="pl-2" style={{ fontSize: "0.65rem", color: AUGUSTA_PALETTE.cream, fontWeight: 700 }}>{d.avg}</span>
              </div>
              <div className="absolute inset-y-0 flex items-center" style={{ left: `${((d.max - 280) / 70) * 100}%` }}>
                <div className="w-px h-full" style={{ background: AUGUSTA_PALETTE.gold }} />
                <span className="ml-1" style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.gold }}>{d.max}</span>
              </div>
            </div>
            <span style={{
              fontSize: "0.6rem",
              color: parseInt(d.fairway) > 65 ? AUGUSTA_PALETTE.birdie : parseInt(d.fairway) < 55 ? AUGUSTA_PALETTE.danger : AUGUSTA_PALETTE.textSecondary,
              width: "35px",
              textAlign: "right",
            }}>{d.fairway}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── ACOUSTIC IMPACT STATUS ───────────────────────────────────────────────────
// 🔴 FLOWMERCIAL INJECTION POINT: Acoustic Phil can inject fake decibel readings
// and "patron alert" statuses here.
function AcousticStatus() {
  const [levels, setLevels] = useState(() => Array.from({ length: 20 }, () => Math.random() * 0.6 + 0.1));

  useEffect(() => {
    const iv = setInterval(() => {
      setLevels(prev => prev.map(l => Math.max(0.05, Math.min(1, l + (Math.random() - 0.5) * 0.15))));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const avgDb = 42 + Math.floor(Math.random() * 8);

  return (
    <GlassCard id="acoustic-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Acoustic Impact" subtitle="PATRON NOISE FLOOR" badge="dBA" />
      </div>
      <GoldDivider />
      <div className="p-4">
        <div className="flex items-end gap-0.5 h-12 mb-3">
          {levels.map((l, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-150"
              style={{
                height: `${l * 100}%`,
                background: l > 0.7
                  ? `linear-gradient(to top, ${AUGUSTA_PALETTE.danger}, ${AUGUSTA_PALETTE.bogey})`
                  : l > 0.4
                  ? `linear-gradient(to top, ${AUGUSTA_PALETTE.gold}, ${AUGUSTA_PALETTE.brightGold})`
                  : `linear-gradient(to top, ${AUGUSTA_PALETTE.fairwayGreen}, ${AUGUSTA_PALETTE.birdie})`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div>
            <div style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>AMBIENT</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: AUGUSTA_PALETTE.cream }}>{avgDb} <span style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted }}>dBA</span></div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>STATUS</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: AUGUSTA_PALETTE.birdie }}>QUIET PLEASE</div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: "0.5rem", color: AUGUSTA_PALETTE.textMuted, letterSpacing: "0.1em" }}>PEAK EVENT</div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: AUGUSTA_PALETTE.gold }}>EAGLE #13 — 78 dBA</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── BROADCAST SCHEDULE ───────────────────────────────────────────────────────
// 🔴 FLOWMERCIAL INJECTION POINT: The Colonel can force a "COLONEL'S CORNER"
// row into this schedule with a fake broadcast takeover.
function BroadcastSchedule() {
  return (
    <GlassCard id="broadcast-panel">
      <div className="p-4 pb-2">
        <SectionHeader title="Broadcast Schedule" subtitle="SAT APR 12" badge="Synced" />
      </div>
      <GoldDivider />
      <div className="p-4 space-y-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {BROADCAST_SCHEDULE.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-2.5 py-2 rounded"
            style={{
              background: b.status === "live" ? "rgba(46,204,113,0.08)" : "transparent",
              border: b.status === "live" ? `1px solid rgba(46,204,113,0.2)` : "1px solid transparent",
            }}
          >
            <span style={{
              fontSize: "0.55rem",
              color: AUGUSTA_PALETTE.textMuted,
              width: "55px",
              fontVariantNumeric: "tabular-nums",
            }}>{b.time}</span>
            {b.status === "live" && (
              <span className="flex items-center gap-1" style={{ width: "35px" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: AUGUSTA_PALETTE.birdie }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: AUGUSTA_PALETTE.birdie }} />
                </span>
                <span style={{ fontSize: "0.45rem", color: AUGUSTA_PALETTE.birdie }}>LIVE</span>
              </span>
            )}
            {b.status === "upcoming" && <span style={{ width: "35px", fontSize: "0.45rem", color: AUGUSTA_PALETTE.textMuted }}>NEXT</span>}
            {b.status === "locked" && <span style={{ width: "35px", fontSize: "0.45rem", color: AUGUSTA_PALETTE.gold }}>🔒</span>}
            <span className="flex-1" style={{ fontSize: "0.6rem", color: AUGUSTA_PALETTE.cream }}>{b.event}</span>
            <span style={{
              fontSize: "0.5rem",
              color: AUGUSTA_PALETTE.gold,
              padding: "1px 6px",
              border: `1px solid ${AUGUSTA_PALETTE.glassBorder}`,
              borderRadius: "2px",
            }}>{b.channel}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── SYSTEM STATUS BAR ────────────────────────────────────────────────────────
function SystemStatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-2" style={{
      background: "rgba(10, 61, 31, 0.9)",
      backdropFilter: "blur(10px)",
      borderBottom: `1px solid ${AUGUSTA_PALETTE.glassBorder}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.5rem",
      color: AUGUSTA_PALETTE.textMuted,
      letterSpacing: "0.1em",
    }}>
      <div className="flex items-center gap-4">
        <span style={{ color: AUGUSTA_PALETTE.gold, fontWeight: 600 }}>■ SOVEREIGN MULTIVERSE</span>
        <span>LEVEL 1: THE STARTER SHACK</span>
        <span style={{ color: AUGUSTA_PALETTE.birdie }}>● SYSTEMS NOMINAL</span>
      </div>
      <div className="flex items-center gap-4">
        <span>TRACKMAN™ SYNC: OK</span>
        <span>ANEMOMETER: OK</span>
        <span>ACOUSTICS: OK</span>
        <span style={{ color: AUGUSTA_PALETTE.cream }}>{time.toLocaleTimeString("en-US", { hour12: true })}</span>
      </div>
    </div>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export default function StarterShack() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse at 20% 0%, rgba(26,107,60,0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(13,79,43,0.2) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(197,164,78,0.03) 0%, transparent 40%),
        linear-gradient(180deg, #020d06 0%, ${AUGUSTA_PALETTE.deepGreen}cc 30%, #020d06 100%)
      `,
      transition: "opacity 0.8s ease-in",
      opacity: loaded ? 1 : 0,
    }}>
      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        zIndex: 0,
      }} />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* HEADER */}
        <header className="text-center py-6 px-4 relative">
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "0.65rem",
            letterSpacing: "0.35em",
            color: AUGUSTA_PALETTE.gold,
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            THE SOVEREIGN MULTIVERSE — INVITATION ONLY
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 900,
            color: AUGUSTA_PALETTE.cream,
            letterSpacing: "0.04em",
            lineHeight: 1.1,
          }}>
            The Masters
          </h1>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: AUGUSTA_PALETTE.textMuted,
            letterSpacing: "0.2em",
            marginTop: "4px",
          }}>
            AUGUSTA NATIONAL GOLF CLUB — ROUND 3 COMMAND CENTER
          </div>
          <GoldDivider className="mt-4 max-w-2xl mx-auto" />
        </header>

        <SystemStatusBar />

        {/* MAIN GRID */}
        <div className="p-4 max-w-[1600px] mx-auto">
          <div className="grid gap-4" style={{
            gridTemplateColumns: "1fr 1.4fr",
            gridTemplateRows: "auto auto auto",
          }}>
            {/* ROW 1: Leaderboard (tall) | Video + Wind */}
            <div style={{ gridRow: "1 / 3" }}>
              <Leaderboard />
            </div>

            <div className="flex flex-col gap-4">
              <VideoFeed />
              <div className="grid grid-cols-2 gap-4">
                <WindVectors />
                <AcousticStatus />
              </div>
            </div>

            {/* ROW 2: Proximity + Drives | Broadcast */}
            <div className="flex flex-col gap-4">
              <ProximityAnalytics />
              <DriveDistances />
            </div>

            <BroadcastSchedule />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center py-4 mt-4">
          <GoldDivider className="max-w-xl mx-auto mb-4" />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.45rem",
            color: AUGUSTA_PALETTE.textMuted,
            letterSpacing: "0.15em",
          }}>
            SOVEREIGN MULTIVERSE™ — PROPRIETARY ANALYTICS PLATFORM — ALL RIGHTS RESERVED
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.4rem",
            color: "rgba(245,240,232,0.2)",
            letterSpacing: "0.1em",
            marginTop: "4px",
          }}>
            {/* 🔴 SNACK BAR BEACON — Level 2 scans for this DOM node to confirm Level 1 is mounted */}
            <span id="shack-beacon" data-level="1" data-snackbar-ready="true">
              A TRADITION UNLIKE ANY OTHER
            </span>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes flowmercialPulse {
          from { filter: hue-rotate(0deg) brightness(1); }
          to { filter: hue-rotate(30deg) brightness(1.3); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${AUGUSTA_PALETTE.gold}44; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${AUGUSTA_PALETTE.gold}88; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
