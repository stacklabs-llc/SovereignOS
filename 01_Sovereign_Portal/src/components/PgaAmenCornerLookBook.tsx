import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Wind, Activity, Users, Award, Target, HelpCircle,
  Play, Pause, ChevronRight, CheckCircle2, Flame, RefreshCw, 
  Settings, Clock, MessageSquare, AlertTriangle, ArrowRight, BookOpen
} from 'lucide-react';

// Design Theme (Augusta Forest Green & Premium Gold)
const COLORS = {
  bg: '#04100b',
  surface: '#071d15',
  card: '#0c261c',
  border: 'rgba(212, 175, 55, 0.2)',
  gold: '#D4AF37',
  goldHover: '#f3e5ab',
  grass: '#20BF6B',
  water: '#1d3557',
  sand: '#e9c46a',
  textMuted: '#8ba89f',
};

// 17 Swarm Profiles based on the uploaded high-fidelity puppet designs
const COMMENTATORS = [
  { 
    id: 'barnaby', 
    name: 'Barnaby J. Smyth', 
    title: 'Veteran Traditionalist', 
    color: '#D4AF37', 
    avatarBg: '#1f3b2e',
    hat: 'GOLF COMM.', 
    quote: 'Indeed, Eleanor. Though the conditions on 11 will be challenging today. The wind is shifting.',
    avatarEmoji: '👴'
  },
  { 
    id: 'eleanor', 
    name: 'Eleanor Vance', 
    title: 'Enthusiastic Purist', 
    color: '#38bdf8', 
    avatarBg: '#1e293b',
    hat: 'VISOR', 
    quote: 'Absolutely thrilled with McIlroy\'s opening round. His driving accuracy was superb!',
    avatarEmoji: '👵'
  },
  { 
    id: 'alastair', 
    name: 'Alastair Finch', 
    title: 'Analytical Tactician', 
    color: '#34d399', 
    avatarBg: '#0f172a',
    hat: 'CAP', 
    quote: 'We\'re watching his performance closely. The approach shot on 9 was masterful!',
    avatarEmoji: '🧔'
  },
  { 
    id: 'felix', 
    name: 'Felix', 
    title: 'Energetic Critic', 
    color: '#f87171', 
    avatarBg: '#2d0f14',
    hat: 'RED CAP', 
    quote: 'Exciting start! Go Rory! ⛳',
    avatarEmoji: '🧑'
  }
];

export default function PgaAmenCornerLookBook() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClub, setSelectedClub] = useState('8-iron');
  const [windSpeed, setWindSpeed] = useState(14);
  const [windDirection, setWindDirection] = useState('NW');
  const [liveScorecard, setLiveScorecard] = useState({
    player: 'Alexander G.',
    round: '-3',
    hole: 18,
    par: 4,
  });

  // Simulated 50-Second Ingress Telemetry Loop
  const [ingressTimer, setIngressTimer] = useState(50);
  const [ingressActive, setIngressTimerActive] = useState(false);
  const [ingressEvent, setIngressEvent] = useState<any>(null);
  const [ingressLogs, setIngressLogs] = useState<string[]>([]);

  // Swarm dialogue logs
  const [chatLogs, setChatLogs] = useState([
    { author: 'Eleanor Vance', time: '14:32', text: "Absolutely thrilled with McIlroy's opening round. His driving accuracy was superb!" },
    { author: 'Barnaby J. Smyth', time: '14:34', text: "Indeed, Eleanor. Though the conditions on 11 will be challenging today. The wind is shifting." },
    { author: 'Alastair Finch', time: '14:35', text: "We're watching his performance closely. The approach shot on 9 was masterful!" }
  ]);
  const [customMsg, setCustomMsg] = useState('');

  // Auto-decrement the 50s timeline
  useEffect(() => {
    let interval: any;
    if (ingressActive && ingressTimer > 0) {
      interval = setInterval(() => {
        setIngressTimer(prev => prev - 1);
      }, 1000);
    } else if (ingressTimer === 0) {
      setIngressTimerActive(false);
      setIngressLogs(prev => [...prev, "T+50s: Broadcast Event Matches Ingress — Triggering Fullscreen Overlays"]);
    }
    return () => clearInterval(interval);
  }, [ingressActive, ingressTimer]);

  // Sync log markers corresponding to the 50s timeline
  useEffect(() => {
    if (!ingressActive) return;
    const timePassed = 50 - ingressTimer;
    if (timePassed === 1) {
      setIngressLogs(["T+0s: TMI Raw Data Arrived. Committing to Clio core SQLite table..."]);
    } else if (timePassed === 5) {
      setIngressLogs(prev => [...prev, "T+5s: Triggering remote passwordless SSH execution call to Argo..."]);
    } else if (timePassed === 10) {
      setIngressLogs(prev => [...prev, "T+10s: Sinking subtle 30% background UI vibration pulse (Spidey Sense)"]);
    } else if (timePassed === 35) {
      setIngressLogs(prev => [...prev, "T+35s: Releasing predictive swarm dialogue block into feed..."]);
      const nextComment = {
        author: 'Barnaby J. Smyth',
        time: new Date().toLocaleTimeString().substring(0, 5),
        text: `⚠️ Telemetry spikes confirm wind velocity at ${windSpeed} MPH. Watch the green elevation slope deflection!`
      };
      setChatLogs(prev => [nextComment, ...prev]);
    }
  }, [ingressTimer, ingressActive]);

  const triggerMockHoleEvent = (playerName: string, hole: number, club: string) => {
    setIngressEvent({ player: playerName, hole, club });
    setIngressTimer(50);
    setIngressTimerActive(true);
    setIngressLogs(["Initializing Ingress Loop..."]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    const newMsg = {
      author: 'Pilot James',
      time: new Date().toLocaleTimeString().substring(0, 5),
      text: customMsg
    };
    setChatLogs(prev => [newMsg, ...prev]);
    setCustomMsg('');
  };

  // Calculating putt probabilities mathematically based on wind speed adjusters
  const calculatePuttProb = (distance: number) => {
    const baselineProb = distance === 10 ? 82 : distance === 14 ? 72 : distance === 18 ? 58 : 41;
    const impact = (windSpeed - 14) * 1.5;
    const finalProb = Math.min(Math.max(Math.round(baselineProb - impact), 5), 99);
    return finalProb;
  };

  const clubMetrics: Record<string, { dist: number; carry: number; speed: number; apex: string; spin: string; launch: string }> = {
    '7-iron': { dist: 158, carry: 154, speed: 118, apex: '104 ft', spin: '6850 RPM', launch: '18.2°' },
    '8-iron': { dist: 174, carry: 168, speed: 142, apex: '101 ft', spin: '7100 RPM', launch: '19.4°' },
    '9-iron': { dist: 145, carry: 139, speed: 112, apex: '98 ft', spin: '7850 RPM', launch: '21.1°' }
  };

  return (
    <div className="w-full h-full bg-[#040e0a] text-[#c8d6e0] font-sans flex flex-col relative select-none rounded-2xl border border-[#dfc68c30] overflow-hidden">
      
      {/* Google Web Fonts for Classic Serifs & Monospace */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Share+Tech+Mono&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet" />

      {/* STYLING SYSTEM INJECTIONS */}
      <style>
        {`
          .font-prestige { font-family: 'Playfair Display', serif; }
          .font-mono-tech { font-family: 'Share Tech Mono', monospace; }
          .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
          
          /* Custom Scrollbar to prevent visual clutter */
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: #04100b; }
          ::-webkit-scrollbar-thumb { background: #dfc68c40; border-radius: 4px; }
          
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.45; }
          }
          .ambient-pulse {
            animation: glow-pulse 4s ease-in-out infinite;
          }
        `}
      </style>

      {/* HEADER BAR */}
      <header className="border-b border-[#dfc68c30] bg-[#051611] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="border border-[#D4AF37] p-2 bg-[#0c261c] rounded-lg shadow-md shadow-[#D4AF37]/10">
            <Compass className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase font-prestige text-[#D4AF37]">
              FanStack PGA <span className="text-xs font-mono-tech text-[#8ba89f] block md:inline md:ml-2">[PROJECT_AMEN_CORNER]</span>
            </h1>
            <p className="text-xs text-[#8ba89f] font-rajdhani">Augusta National Live Analytics & Swarm Sandbox</p>
          </div>
        </div>

        {/* Global Stats Overlay */}
        <div className="flex items-center gap-6 text-sm font-mono-tech">
          <div className="flex items-center gap-2 bg-[#0c261c] border border-[#dfc68c25] rounded-full px-4 py-1">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <span className="text-zinc-200">HOLE 12 'GOLDEN BELL'</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-[#0c261c] border border-[#dfc68c25] rounded-full px-4 py-1 text-xs">
            <Activity className="w-3.5 h-3.5 text-[#20BF6B]" />
            <span className="text-[#8ba89f]">STIMPMETER: 12.0 STIMP</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT SPLIT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* LEFT SIDEBAR - ROADMAP & BUILD PLANNER */}
        <aside className="w-full lg:w-80 border-r border-[#dfc68c30] bg-[#05130f]/90 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          
          {/* LOOK BOOK NAVIGATION */}
          <div>
            <h2 className="text-xs font-bold uppercase text-[#8ba89f] tracking-widest mb-3 font-mono-tech px-1">LOOK BOOK NAVIGATION</h2>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'overview', name: 'Overview & Build Roadmap', icon: BookOpen },
                { id: 'tracer', name: 'Interactive Shot Tracer', icon: Target },
                { id: 'wind', name: 'Wind & Putt Probability', icon: Wind },
                { id: 'swarm', name: 'Commentator Swarm', icon: Users }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all duration-150 ${
                      activeTab === tab.id 
                        ? 'bg-[#0c261c] border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/5' 
                        : 'bg-[#05130f]/60 border-[#dfc68c15] text-[#8ba89f] hover:border-[#dfc68c40] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#D4AF37]' : 'text-[#8ba89f]'}`} />
                    <span className="font-bold text-sm font-rajdhani">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[#dfc68c20]" />

          {/* ACTIVE 50s TELEMETRY INGRESS MONITOR */}
          <div className="bg-[#071913] border border-[#dfc68c25] rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono-tech text-[#D4AF37] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 50s INGRESS DELAY
              </span>
              <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded ${
                ingressActive ? 'bg-[#D4AF37]/20 text-[#D4AF37] animate-pulse' : 'bg-[#dfc68c10] text-[#8ba89f]'
              }`}>
                {ingressActive ? 'RUNNING' : 'STANDBY'}
              </span>
            </div>

            <p className="text-[11px] text-[#8ba89f] leading-normal font-rajdhani">
              Watch how our data preloads assets and primes conversational dialogue 50 seconds before TV display.
            </p>

            {ingressActive && (
              <div className="bg-black/40 border border-[#dfc68c15] p-3 rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span>Target Time:</span>
                  <span className="text-[#D4AF37] font-bold">{ingressTimer}s Left</span>
                </div>
                <div className="w-full bg-[#04100b] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#D4AF37] h-full transition-all duration-1000"
                    style={{ width: `${(ingressTimer / 50) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => triggerMockHoleEvent('Rory McIlroy', 12, '8-Iron')}
              disabled={ingressActive}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#04100b] font-bold text-xs py-2 rounded-lg transition-all duration-150 font-mono-tech disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simulate Ingress Event
            </button>
          </div>
        </aside>

        {/* CENTER COMPARTMENT - WORKSPACE CANVAS AND TAB VIEWER */}
        <main className="flex-1 bg-[#040e0a] p-4 flex flex-col gap-4 overflow-y-auto relative min-w-0">
          
          {/* Ambient vector glow in background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full">
              <circle cx="50%" cy="30%" r="200" fill="url(#radial-glow)" className="ambient-pulse" />
              <defs>
                <radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* TAB 1: OVERVIEW AND TODAY'S WORKSPACE ROADMAP */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4 relative z-10">
              <div className="bg-[#0c261c] border border-[#dfc68c25] rounded-xl p-5 shadow-lg">
                <h3 className="text-xl font-bold font-prestige text-[#D4AF37] mb-2">PGA Design Assets Look Book</h3>
                <p className="text-sm text-[#8ba89f] leading-relaxed font-rajdhani">
                  We've successfully uploaded the core screens generated during the initial design phase—including Shot-Tracer Heritage views, Wind and Putt Probability tablet Dashboards, and the active Puppet Swarm interface. Today, we're cataloging these patterns so we can map out our engineering targets.
                </p>
                
                <div className="mt-4 flex items-center gap-2 text-xs font-mono-tech text-[#20BF6B]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SovereignOS PRD v2 Committed to Clio Workspace: REQ-2026-06-19-AMEN-CORNER-V2</span>
                </div>
              </div>

              {/* Today's Build Target List */}
              <div className="bg-[#05130f] border border-[#dfc68c20] rounded-xl p-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4 font-mono-tech">TODAY'S BUILD PLAN & ROADMAP</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: '1. Port 3012 Base Seeding', state: 'STAGED', desc: 'Copy core components (HoloLink, HoloDex, Comet Messenger) into the apps/amen_corner workspace directories.' },
                    { title: '2. Low-Latency TMI Pipe', state: 'DRAFT', desc: 'Wire up Python API to capture shot tracking coordinates and forward to Clio within the 5ms ingestion bounds.' },
                    { title: '3. Vector Green Contour Heatmap', state: 'BACKLOG', desc: 'Build the inline interactive SVG elevation slope matrices for Augusta greens without utilizing heavy canvas contexts.' }
                  ].map((step, idx) => (
                    <div key={idx} className="bg-[#0c261c]/45 border border-[#dfc68c15] p-4 rounded-lg flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-white font-rajdhani">{step.title}</span>
                          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37]">{step.state}</span>
                        </div>
                        <p className="text-xs text-[#8ba89f] leading-normal font-rajdhani">{step.desc}</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-[#dfc68c10] flex items-center justify-between text-[10px] font-mono-tech text-[#8ba89f]">
                        <span>CODENAME: AMEN</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latency Log Stream Output */}
              {ingressActive && (
                <div className="bg-black/50 border border-red-500/20 rounded-xl p-4 font-mono-tech text-xs">
                  <div className="text-red-400 font-bold mb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 animate-pulse" /> LIVE TELEMETRY DEPLOYMENT INGESTION LOGS
                  </div>
                  <div className="flex flex-col gap-1.5 text-zinc-300">
                    {ingressLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-zinc-600">[{idx + 1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE SHOT TRACER SANDBOX */}
          {activeTab === 'tracer' && (
            <div className="flex flex-col gap-4 relative z-10">
              
              {/* Dynamic Telemetry Layout (Split green view / controls) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* SVG Parabolic Shot Tracer Graphic (8 Columns) */}
                <div className="md:col-span-8 bg-[#071712] border border-[#dfc68c25] rounded-xl p-4 flex flex-col shadow-inner min-h-[380px]">
                  <div className="flex items-center justify-between mb-4 border-b border-[#dfc68c15] pb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono-tech">TRAJECTORY TRACER VIEW</span>
                    </div>
                    <span className="text-[10px] font-mono-tech text-[#8ba89f] bg-black/35 px-2 py-0.5 rounded">HERITAGE NETWORK</span>
                  </div>

                  {/* SVG Green Path Map Drawing representing Augusta Hole 18 / Cypress Hollow */}
                  <div className="flex-1 relative flex items-center justify-center bg-black/40 rounded-lg p-2 overflow-hidden border border-[#dfc68c10]">
                    <svg viewBox="0 0 500 350" className="w-full h-full max-h-[320px]">
                      {/* Topographical contours */}
                      <path d="M 0 300 Q 150 240 300 310 T 500 280 L 500 350 L 0 350 Z" fill="#0f3025" opacity="0.4" />
                      <path d="M 0 320 Q 200 280 500 330 L 500 350 L 0 350 Z" fill="#0b241d" />

                      {/* Water Hazard on the Left (Cypress green) */}
                      <path d="M 20 240 Q 90 230 140 260 T 110 320 Z" fill={COLORS.water} opacity="0.6" stroke="#457b9d" strokeWidth="1" />

                      {/* Green Landing Circle (Pin Area) */}
                      <ellipse cx="380" cy="180" rx="35" ry="15" fill="rgba(32, 191, 107, 0.25)" stroke={COLORS.grass} strokeWidth="2.5" />
                      <circle cx="380" cy="180" r="3" fill="#ffffff" />

                      {/* Flagstick */}
                      <g transform="translate(380, 130)">
                        <line x1="0" y1="0" x2="0" y2="50" stroke="#fff" strokeWidth="2" />
                        <path d="M 0 0 L -18 8 L 0 16 Z" fill="#ff3838" />
                        <text x="-9" y="10" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">18</text>
                      </g>

                      {/* Vector Parabolic Path (Animated tracer based on club metrics) */}
                      {selectedClub === '7-iron' && (
                        <path d="M 100 320 Q 240 10 370 176" fill="none" stroke="#D4AF37" strokeWidth="3" strokeDasharray="3,1" className="animate-pulse" />
                      )}
                      {selectedClub === '8-iron' && (
                        <path d="M 100 320 Q 250 -30 380 180" fill="none" stroke="#20BF6B" strokeWidth="3.5" className="animate-pulse" />
                      )}
                      {selectedClub === '9-iron' && (
                        <path d="M 100 320 Q 220 50 365 185" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5,2" />
                      )}

                      {/* Impact Dot */}
                      <circle 
                        cx={selectedClub === '7-iron' ? 370 : selectedClub === '8-iron' ? 380 : 365} 
                        cy={selectedClub === '7-iron' ? 176 : selectedClub === '8-iron' ? 180 : 185} 
                        r="6" 
                        fill="#fff" 
                        stroke="#ff3838" 
                        strokeWidth="2" 
                      />

                      {/* Landing Point Tag */}
                      <text x="110" y="335" fill="#8ba89f" fontSize="10" fontFamily="monospace">Tee</text>
                      <text x="400" y="210" fill="#20BF6B" fontSize="10" fontFamily="monospace" fontWeight="bold">Green</text>
                    </svg>

                    {/* Vector Elevation Profile Overlay */}
                    <div className="absolute bottom-4 left-4 bg-black/75 border border-[#dfc68c20] p-2 rounded text-[10px] font-mono-tech flex flex-col gap-0.5 backdrop-blur-md">
                      <span className="text-[#D4AF37]">ELEVATION & SLOPE PROFILE</span>
                      <span className="text-zinc-400">Apex Altitude: {clubMetrics[selectedClub].apex}</span>
                      <span className="text-zinc-400">Descent Angle: {clubMetrics[selectedClub].launch}</span>
                    </div>
                  </div>
                </div>

                {/* Club Detail Panel (4 Columns) */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="bg-[#0c261c] border border-[#dfc68c25] p-4 rounded-xl shadow-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3 font-mono-tech">Club Calibration Controller</h4>
                    
                    <div className="flex flex-col gap-2">
                      {['7-iron', '8-iron', '9-iron'].map(club => (
                        <button
                          key={club}
                          onClick={() => setSelectedClub(club)}
                          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase font-mono-tech text-left flex justify-between items-center transition-all ${
                            selectedClub === club 
                              ? 'bg-[#D4AF37] text-black border border-[#D4AF37]' 
                              : 'bg-black/35 text-[#8ba89f] border border-[#dfc68c15] hover:border-[#dfc68c45]'
                          }`}
                        >
                          <span>{club}</span>
                          <span className="opacity-75">{clubMetrics[club].dist} yds</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#05130f] border border-[#dfc68c20] p-4 rounded-xl flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono-tech text-[#8ba89f] uppercase">Selected Club Telemetry</div>
                      <h4 className="text-lg font-bold font-prestige text-white mt-1 capitalize">{selectedClub} approach</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-4">
                      <div className="bg-black/35 p-2 rounded border border-[#dfc68c10]">
                        <span className="text-[9px] font-mono-tech text-[#8ba89f] uppercase block">TOTAL DIST</span>
                        <span className="text-sm font-bold font-mono-tech text-[#D4AF37]">{clubMetrics[selectedClub].dist} Yds</span>
                      </div>
                      <div className="bg-black/35 p-2 rounded border border-[#dfc68c10]">
                        <span className="text-[9px] font-mono-tech text-[#8ba89f] uppercase block">CARRY YARDS</span>
                        <span className="text-sm font-bold font-mono-tech text-white">{clubMetrics[selectedClub].carry} Yds</span>
                      </div>
                      <div className="bg-black/35 p-2 rounded border border-[#dfc68c10]">
                        <span className="text-[9px] font-mono-tech text-[#8ba89f] uppercase block">BALL SPEED</span>
                        <span className="text-sm font-bold font-mono-tech text-[#20BF6B]">{clubMetrics[selectedClub].speed} Mph</span>
                      </div>
                      <div className="bg-black/35 p-2 rounded border border-[#dfc68c10]">
                        <span className="text-[9px] font-mono-tech text-[#8ba89f] uppercase block">SPIN MATRIX</span>
                        <span className="text-sm font-bold font-mono-tech text-[#38bdf8]">{clubMetrics[selectedClub].spin}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8ba89f] leading-normal font-rajdhani">
                      * Trajectory simulated natively via responsive vector geometry mapping.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: WIND AND PUTT PROBABILITY INTERACTION */}
          {activeTab === 'wind' && (
            <div className="flex flex-col gap-4 relative z-10">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Wind dials (8 Columns) */}
                <div className="md:col-span-8 bg-[#071712] border border-[#dfc68c25] rounded-xl p-4 flex flex-col justify-between shadow-inner">
                  <div className="flex items-center justify-between mb-4 border-b border-[#dfc68c15] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono-tech">WIND PROBABILITY DASHBOARD</span>
                    <span className="text-[10px] font-mono-tech text-[#8ba89f]">THE COUNTRY CLUB | HOLE 9</span>
                  </div>

                  {/* SVG gauges side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
                    
                    {/* Gauge 1: Current Wind speed */}
                    <div className="flex flex-col items-center justify-center bg-black/35 p-4 rounded-xl border border-[#dfc68c10]">
                      <span className="text-xs font-mono-tech text-[#8ba89f] mb-3 uppercase">Wind Speed Dial</span>
                      
                      <svg width="150" height="150" viewBox="0 0 100 100">
                        {/* Circular track */}
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#123a2e" strokeWidth="6" />
                        <path d="M 15 75 A 42 42 0 1 1 85 75" fill="none" stroke="#D4AF37" strokeWidth="6" strokeDasharray="1 3" />
                        
                        {/* Interactive gauge needle */}
                        <g transform={`rotate(${(windSpeed / 30) * 180 - 90}, 50, 50)`}>
                          <line x1="50" y1="50" x2="50" y2="15" stroke="#ff3838" strokeWidth="2.5" />
                          <circle cx="50" cy="50" r="4" fill="#fff" />
                        </g>

                        <text x="50" y="65" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {windSpeed} MPH
                        </text>
                        <text x="50" y="78" fill="#8ba89f" fontSize="7" textAnchor="middle" fontFamily="monospace">
                          GUSTS: {Math.round(windSpeed * 1.3)} MPH
                        </text>
                      </svg>
                    </div>

                    {/* Gauge 2: Wind Direction */}
                    <div className="flex flex-col items-center justify-center bg-black/35 p-4 rounded-xl border border-[#dfc68c10]">
                      <span className="text-xs font-mono-tech text-[#8ba89f] mb-3 uppercase">Compass Drift Gauge</span>
                      
                      <svg width="150" height="150" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#123a2e" strokeWidth="2" />
                        <text x="50" y="20" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">N</text>
                        <text x="80" y="53" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>
                        <text x="50" y="88" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">S</text>
                        <text x="20" y="53" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">W</text>

                        {/* Needle rotated to NW/NE */}
                        <g transform={`rotate(${windDirection === 'NW' ? -45 : 45}, 50, 50)`}>
                          <polygon points="50,15 45,50 55,50" fill="#D4AF37" />
                          <polygon points="50,85 45,50 55,50" fill="#334155" />
                        </g>
                      </svg>
                    </div>

                  </div>

                  {/* Wind Direction controller selector */}
                  <div className="flex items-center gap-2 mt-4 bg-black/30 p-3 rounded-lg border border-[#dfc68c15]">
                    <span className="text-xs font-mono-tech text-[#8ba89f]">Direction Selector:</span>
                    {['NW', 'NE', 'NNW', 'NNE'].map(dir => (
                      <button
                        key={dir}
                        onClick={() => setWindDirection(dir)}
                        className={`px-3 py-1 rounded text-xs font-mono-tech font-bold transition-all ${
                          windDirection === dir ? 'bg-[#D4AF37] text-[#04100b]' : 'bg-[#0c261c] text-[#8ba89f]'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Putt Probability controller input (4 Columns) */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="bg-[#0c261c] border border-[#dfc68c25] p-4 rounded-xl shadow-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3 font-mono-tech">Wind Speed Slider</h4>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] bg-black/45 h-2 rounded"
                    />
                    <div className="flex justify-between text-[10px] font-mono-tech text-[#8ba89f] mt-2">
                      <span>Calm (0 MPH)</span>
                      <span>Gale (30 MPH)</span>
                    </div>
                  </div>

                  {/* Live Recalculating Putt Probability Output */}
                  <div className="bg-[#05130f] border border-[#dfc68c20] p-4 rounded-xl flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono-tech text-[#8ba89f] uppercase block">Recalculating Outcomes</span>
                      <h4 className="text-sm font-bold font-mono-tech text-white mt-1">Live Putt Success Probability</h4>
                    </div>

                    <div className="flex flex-col gap-2.5 my-4">
                      {[10, 14, 18, 25].map(dist => {
                        const prob = calculatePuttProb(dist);
                        return (
                          <div key={dist} className="flex items-center justify-between bg-black/35 p-2 rounded border border-[#dfc68c10]">
                            <span className="text-xs font-mono-tech text-zinc-300">{dist} Ft Putt</span>
                            <div className="flex items-center gap-3">
                              <div className="w-16 bg-[#04100b] h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#20BF6B] h-full"
                                  style={{ width: `${prob}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold font-mono text-[#20BF6B] min-w-[32px] text-right">{prob}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono leading-relaxed border-t border-zinc-900 pt-2">
                      💡 <strong>Algorithm:</strong> Target slopes are mapped dynamically using real-time wind shear resistance. Higher wind parameters drop putting accuracy indexes globally.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SWARM CHAT AND PUPPET DIALOGUE PANEL */}
          {activeTab === 'swarm' && (
            <div className="flex flex-col gap-4 overflow-hidden h-[500px]">
              
              <div className="bg-[#090c12]/80 border border-zinc-800/90 rounded-xl overflow-hidden flex flex-col flex-1 shadow-lg">
                <div className="border-b border-zinc-800/95 bg-[#0d111a]/85 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF5910]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Active Commentator Swarm (Sovereign Asylum)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">MEMBERS: 4 ACTIVE</span>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0">
                  
                  {/* Left: Puppet Roster Sidebar */}
                  <div className="w-32 border-r border-[#dfc68c15] p-2 bg-black/25 flex flex-col gap-2 overflow-y-auto shrink-0">
                    {COMMENTATORS.map(comm => (
                      <div 
                        key={comm.id}
                        className="p-2 rounded bg-[#0c261c]/45 border border-[#dfc68c15] flex flex-col items-center text-center gap-1.5"
                      >
                        <div className="text-2xl">{comm.avatarEmoji}</div>
                        <div className="text-[9px] font-bold text-white truncate w-full">{comm.name}</div>
                        <span className="text-[7px] font-mono-tech bg-[#D4AF37]/15 text-[#D4AF37] px-1 rounded uppercase">
                          {comm.hat}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right: Dialogue Feeds */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden min-w-0">
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                      {chatLogs.map((chat, idx) => {
                        const persona = COMMENTATORS.find(c => c.name === chat.author) || { color: '#8ba89f', avatarEmoji: '👤' };
                        return (
                          <div key={idx} className="bg-[#0c261c]/30 border border-[#dfc68c10] p-3 rounded-lg text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span style={{ color: persona.color }} className="font-bold flex items-center gap-1">
                                {persona.avatarEmoji} {chat.author}
                              </span>
                              <span className="text-[9px] text-[#8ba89f]">{chat.time}</span>
                            </div>
                            <p className="text-zinc-300 mt-1">{chat.text}</p>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 border-t border-[#dfc68c15] bg-black/35 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={customMsg}
                        onChange={e => setCustomMsg(e.target.value)}
                        placeholder="Inject custom commentary..."
                        className="flex-1 bg-zinc-900/60 border border-[#dfc68c15] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold text-xs px-4 rounded-lg transition-colors font-mono-tech"
                      >
                        Send
                      </button>
                    </form>
                  </div>

                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
