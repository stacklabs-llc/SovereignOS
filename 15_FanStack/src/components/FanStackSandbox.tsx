import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationRail from './sandbox/NavigationRail';
import { getWsUrl } from '../api-host';
import { 
  Play, 
  Volume2, 
  Database, 
  Send, 
  Terminal, 
  FileText, 
  RefreshCw, 
  UserCheck, 
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface MARDPayload {
  msg_type: string;
  inning: string;
  outs: number;
  balls: number;
  strikes: number;
  pitch_speed: string;
  pitch_type: string;
  away_score: number;
  home_score: number;
  away_team: string;
  home_team: string;
  matchup_text: string;
  runner_1b: boolean;
  runner_2b: boolean;
  runner_3b: boolean;
  is_sac_fly?: boolean;
  is_walk_off?: boolean;
  message?: string;
  sender?: string;
  timestamp?: string;
}

interface Anomaly {
  id: string;
  game_pk: string;
  event: string;
  time: string;
  persona: string;
  format: string;
  script: string;
  prompt: string;
  status: string;
}

export default function FanStackSandbox() {
  const [theme, setTheme] = useState<'default' | 'chaos'>('default');
  const [gameState, setGameState] = useState<Partial<MARDPayload>>({});
  const [messages, setMessages] = useState<MARDPayload[]>([]);
  const [activeSandboxRoom, setActiveSandboxRoom] = useState('starter');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // MARD websocket feed simulation
  useEffect(() => {
    console.log("FanStack Sandbox initializing WebSocket to M.A.R.D Engine...");
    
    wsRef.current = new WebSocket(getWsUrl('/ws'));
    
    wsRef.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.msg_type === "STATE_UPDATE" || payload.msg_type === "historian_telemetry") {
          setGameState(prev => ({ ...prev, ...payload }));
          
          if (payload.is_walk_off) {
            setTheme('chaos');
          } else if (payload.event_type !== 'walk_off') {
             setTheme('default');
          }
        }
        else if (payload.msg_type === "chat_message" || payload.msg_type === "system_alert") {
          setMessages(prev => [...prev, payload].slice(-50)); // Keep last 50
        }
      } catch (err) {
        console.error("MARD Payload parse err:", err);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Fetch anomalies when the user switches to the TMI Triage view
  const fetchAnomalies = async () => {
    setIsLoadingAnomalies(true);
    try {
      const res = await fetch('/api/tmi_anomalies');
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data);
      }
    } catch (err) {
      console.error("Failed to load anomalies in sandbox:", err);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  useEffect(() => {
    if (activeSandboxRoom === 'tmi_news_desk') {
      fetchAnomalies();
    }
  }, [activeSandboxRoom]);

  // Auto-scroll chat stream
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const triggerSimulation = (gamePk: string) => {
     setTheme('default');
     setMessages([]);
     fetch(`/api/switch_game?gamePk=${gamePk}`)
       .catch(err => console.error("Could not trigger remote sim:", err));
  };

  return (
    <div className={`relative w-full h-[85vh] flex font-sans rounded-xl overflow-hidden border ${
      theme === 'chaos' ? 'border-[#ef4444] ' : 'border-[#38bdf8]/30 shadow-2xl'
    }`}>
      
      {/* CONSTANT STYLES FOR DESPAIR CASCADE */}
      <style>{`
        .sandbox-chaos {
           background: radial-gradient(circle at center, #300, #000) !important;
           filter: saturate(1.5) contrast(1.2);
           animation: bodyShake 0.1s infinite;
        }
        @keyframes strobeRed {
           0% { background-color: rgba(255, 0, 0, 0.05); }
           50% { background-color: rgba(255, 0, 0, 0.2); }
           100% { background-color: rgba(255, 0, 0, 0.05); }
        }
        @keyframes bodyShake {
           0% { transform: translate(1px, 1px) rotate(0deg); }
           25% { transform: translate(-1px, -1px) rotate(-0.5deg); }
           50% { transform: translate(1.5px, 1.5px) rotate(0.5deg); }
           75% { transform: translate(-0.5px, 0.5px) rotate(0deg); }
           100% { transform: translate(0.5px, -0.5px) rotate(-0.5deg); }
        }
        .chaos-flash { animation: strobeRed 0.4s infinite; }
        .glass-panel {
           background: rgba(15, 23, 42, 0.5);
           backdrop-filter: blur(12px);
           border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* 1. Left Vertical Navigation Rail Component */}
      <NavigationRail 
        activeRoom={activeSandboxRoom} 
        onSelectRoom={setActiveSandboxRoom} 
      />

      {/* 2. Main Content Viewport Container */}
      <div className={`flex-1 transition-all duration-300 flex flex-col min-w-0 ${
        theme === 'chaos' ? 'sandbox-chaos' : 'bg-[#060913]'
      }`}>
        
        {/* Dynamic Sandbox Header */}
        <div className="h-12 border-b border-[#1d2438] bg-black/40 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00b4d8] animate-pulse shadow-[0_0_8px_#00b4d8]" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#8e9caa]">
              Sandbox: {activeSandboxRoom.replace('_', ' ')}
            </h2>
          </div>
          <div className="bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7] text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-[0_0_8px_rgba(168,85,247,0.1)]">
            ISOLATED COMPONENT DOCK
          </div>
        </div>

        {/* 3. Sub-View Router */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            
            {/* View A: Command Center (Main Game Telemetry Stream) */}
            {activeSandboxRoom === 'starter' && (
              <motion.div 
                key="starter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full flex flex-col min-h-0"
              >
                {/* TOP SCOREBOARD */}
                <div className={`p-4 flex flex-col shrink-0 ${theme === 'chaos' ? 'chaos-flash' : 'bg-black/20 border-b border-[#1d2438]'}`}>
                   <div className="flex justify-between items-center mb-3">
                      <select 
                         onChange={(e) => triggerSimulation(e.target.value)} 
                         className="bg-black/60 border border-[#38bdf8] text-[#38bdf8] px-3 py-1.5 rounded-lg text-xs font-mono outline-none cursor-pointer hover:bg-[#38bdf8]/10"
                      >
                         <option value="">-- SELECT TIMELINE TARGET --</option>
                         <option value="824691">Simulate: Mets vs Cubs (Walk-off)</option>
                      </select>
                      <div className="bg-red-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-widest animate-pulse">
                         LIVE STREAM FEED
                      </div>
                   </div>

                   <div className="text-center font-mono text-[#8E9CAA] text-xs mb-3 tracking-widest uppercase">
                      INNING: <span className="text-white font-bold">{gameState.inning || '-'}</span> | 
                      OUTS: <span className="text-white font-bold mx-1">{gameState.outs ?? 0}</span> | 
                      COUNT: <span className="text-white font-bold mx-1">{gameState.balls ?? 0}-{gameState.strikes ?? 0}</span>
                   </div>

                   <div className="flex justify-center items-center gap-8 px-4">
                      <div className="flex flex-col items-center">
                         <div className="text-[#8E9CAA] font-display text-[10px] tracking-wider mb-1 uppercase">{gameState.away_team || 'AWAY'}</div>
                         <div className="text-3xl font-bold font-mono text-white drop-shadow-md">{gameState.away_score ?? 0}</div>
                      </div>
                      <div className="text-[#38bdf8]/50 font-display text-base font-bold">VS</div>
                      <div className="flex flex-col items-center">
                         <div className="text-[#FF5910] font-display text-[10px] tracking-wider mb-1 uppercase">{gameState.home_team || 'HOME'}</div>
                         <div className="text-3xl font-bold font-mono text-white drop-">{gameState.home_score ?? 0}</div>
                      </div>
                   </div>
                </div>

                {/* TELEMETRY MATCHUP BAR */}
                <div className="bg-black/40 border-b border-[#1d2438] p-3 flex flex-col shrink-0 gap-2">
                   <div className="text-center text-[#8E9CAA] text-xs font-mono truncate px-4">
                     {gameState.matchup_text || 'AWAITING PITCHER VS AWAITING BATTER'}
                   </div>
                   
                   <div className="flex justify-center items-center gap-6 mt-1 text-xs font-mono">
                      <div><span className="text-[#8E9CAA]">PITCH:</span> <span className="text-[#38bdf8]">{gameState.pitch_type || '---'}</span></div>
                      <div><span className="text-[#8E9CAA]">VELO:</span> <span className="text-white">{gameState.pitch_speed || '---'}</span></div>
                      
                      {/* Vesper Diamond */}
                      <svg width="30" height="24" viewBox="0 0 40 30">
                         <rect x="15" y="0"  width="10" height="10" transform="rotate(45 20 5)"   fill={gameState.runner_2b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
                         <rect x="5"  y="10" width="10" height="10" transform="rotate(45 10 15)"  fill={gameState.runner_3b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
                         <rect x="25" y="10" width="10" height="10" transform="rotate(45 30 15)"  fill={gameState.runner_1b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
                      </svg>
                   </div>
                </div>

                {/* MESH CHAT STREAM */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative no-scrollbar min-h-0">
                   <AnimatePresence>
                     {messages.map((msg, idx) => (
                        <motion.div 
                           key={idx}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={`p-3 rounded-lg border text-sm max-w-[90%] ${
                              msg.sender?.toLowerCase() === 'system' ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] self-center text-center font-mono text-xs w-full max-w-full' :
                              msg.sender?.toLowerCase() === 'dot' ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30 self-start' : 
                              'bg-white/5 border-white/10 self-start'
                           }`}
                        >
                           {msg.sender && msg.sender.toLowerCase() !== 'system' && (
                             <div className={`font-bold text-xs mb-1 uppercase tracking-widest ${msg.sender?.toLowerCase() === 'dot' ? 'text-[#38bdf8]' : 'text-white'}`}>
                                {msg.sender} <span className="text-[#8E9CAA] text-[9px] font-normal ml-2">{msg.timestamp?.split(' ')[1] || ''}</span>
                             </div>
                           )}
                           <div className="text-gray-200 leading-relaxed font-sans">{msg.message}</div>
                        </motion.div>
                     ))}
                   </AnimatePresence>
                   <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}

            {/* View B: Playcall Desk (Advocate Matrix & Soundboard Controls) */}
            {activeSandboxRoom === 'playcall_desk' && (
              <motion.div 
                key="playcall_desk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full overflow-y-auto space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Playcall Voice Operations</h3>
                    <p className="text-xs text-gray-400">Deploy live advocate vocal tracks and trigger stadium soundboards</p>
                  </div>
                  <button className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors">
                    <Volume2 className="w-4 h-4" /> TEST CHANNELS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Soundboard Button 1 */}
                  <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div>
                      <span className="font-mono text-[10px] text-orange-500 uppercase tracking-widest font-bold">Soundbite</span>
                      <h4 className="font-bold text-sm text-white mt-1">Keith: Go Sit Down</h4>
                      <p className="text-[10px] text-gray-400">Trigger challenge failures</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-black transition-all">
                      <Play className="w-4 h-4 text-orange-500 group-hover:text-black" />
                    </div>
                  </div>

                  {/* Soundboard Button 2 */}
                  <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div>
                      <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Soundbite</span>
                      <h4 className="font-bold text-sm text-white mt-1">Scoff: Strike Three</h4>
                      <p className="text-[10px] text-gray-400">Classic umpire blowout call</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                      <Play className="w-4 h-4 text-cyan-400 group-hover:text-black" />
                    </div>
                  </div>

                  {/* Soundboard Button 3 */}
                  <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div>
                      <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Soundbite</span>
                      <h4 className="font-bold text-sm text-white mt-1">Mets Fan: Let's Go</h4>
                      <p className="text-[10px] text-gray-400">Stadium crowd rally chant</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-black transition-all">
                      <Play className="w-4 h-4 text-emerald-400 group-hover:text-black" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl">
                  <h4 className="font-mono text-xs text-[#00b4d8] uppercase tracking-wider mb-3">ACTIVE VOICE ADVOCATE BLUEPRINTS</h4>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white">MetsFan_86</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">COCKPIT ONBOARDED</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white">CubsConspiracy</span>
                      <span className="px-2 py-0.5 rounded bg-[#00b4d8]/10 text-[#00b4d8] text-[10px]">PENDING CHALLENGE SEEDING</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white">BlueJaysLoyal</span>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px]">VOICE DESYNC DETECTED</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View C: TMI Triage (Active Anomaly Observability & Ingest Database Feed) */}
            {activeSandboxRoom === 'tmi_news_desk' && (
              <motion.div 
                key="tmi_news_desk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full flex flex-col min-h-0"
              >
                <div className="flex justify-between items-center shrink-0 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">TMI Anomaly Triage</h3>
                    <p className="text-xs text-gray-400">Observe real-time telemetry anomalies parsed directly from the central database</p>
                  </div>
                  <button 
                    onClick={fetchAnomalies}
                    disabled={isLoadingAnomalies}
                    className="bg-[#00b4d8] hover:bg-[#00b4d8]/80 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAnomalies ? 'animate-spin' : ''}`} /> REFRESH FEED
                  </button>
                </div>

                <div className="flex-grow min-h-0 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {anomalies.length === 0 ? (
                    <div className="h-64 border border-[#1d2438] rounded-xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
                      <Terminal className="w-10 h-10 text-gray-600 mb-3" />
                      <h4 className="text-sm font-bold text-gray-400 font-mono">NO ACTIVE TMI ANOMALIES IN THE PIPELINE</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">The telemetry ingestion queue is clean. Check the background watchdog server logs for details.</p>
                    </div>
                  ) : (
                    anomalies.map((item) => (
                      <div key={item.id} className="glass-panel p-4 rounded-xl hover:border-[#00b4d8]/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                            <span className="font-mono text-xs font-bold text-white">{item.event}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{item.time}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-gray-400 border-t border-white/5 pt-2 mt-2">
                          <div><span className="text-gray-600">GAME ID:</span> <span className="text-white">{item.game_pk}</span></div>
                          <div><span className="text-gray-600">PERSONA:</span> <span className="text-white">{item.persona}</span></div>
                          <div><span className="text-gray-600">FORMAT:</span> <span className="text-white">{item.format}</span></div>
                          <div><span className="text-gray-600">STATUS:</span> <span className="text-red-400 font-bold">{item.status}</span></div>
                        </div>
                        {item.prompt && (
                          <div className="mt-2 bg-black/60 p-2 rounded border border-white/5 font-mono text-[10px] text-[#00b4d8] overflow-x-auto whitespace-pre-wrap">
                            {item.prompt}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* View D: Savant Query (SQL Statistical Database Builder) */}
            {activeSandboxRoom === 'savant_query' && (
              <motion.div 
                key="savant_query"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full overflow-y-auto space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Savant Query Engine</h3>
                  <p className="text-xs text-gray-400">Perform statistical telemetry sweeps and build active pitcher matchups</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-mono text-xs text-[#00b4d8] uppercase">SQL Query Terminal</span>
                    <span className="text-[10px] font-mono text-gray-500">Database: sovereign_now.db (WAL Active)</span>
                  </div>
                  <div className="bg-black/80 rounded-lg p-3 border border-white/10 font-mono text-xs text-emerald-400 h-28 relative">
                    <div>SELECT p.name, p.team, s.exit_velocity, s.launch_angle</div>
                    <div>FROM mlb_rosters r</div>
                    <div>JOIN stats_savant s ON r.player_id = s.player_id</div>
                    <div>WHERE r.team_abbr = 'NYM' AND s.season = 2026;</div>
                    <span className="absolute bottom-2 right-2 animate-pulse text-gray-500 cursor-default font-bold">█</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <Send className="w-3.5 h-3.5" /> EXECUTE SWEEP
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-xl">
                    <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">MAPPED MLB SCHEDULES</h4>
                    <div className="space-y-2 font-mono text-[11px] text-gray-400">
                      <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white">Game 824691</span><span>NYM @ CHC (Ingested)</span></div>
                      <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white">Game 824702</span><span>NYM @ TOR (Active)</span></div>
                      <div className="flex justify-between py-1"><span className="text-white">Game 824715</span><span>PHI @ NYM (Pending)</span></div>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl">
                    <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">QUERY RESULTS CACHE</h4>
                    <div className="flex items-center justify-center h-20 text-xs text-gray-500 italic">
                      No query results loaded. Execute a query sweep to populate.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View E: Storyboards & HoloDex */}
            {activeSandboxRoom === 'storyboard_deck' && (
              <motion.div 
                key="storyboard_deck"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full overflow-y-auto space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Storyboard Timeline</h3>
                  <p className="text-xs text-gray-400">Map narrative highlight clips, video transitions, and AI director guidelines</p>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {/* Slide 1 */}
                  <div className="glass-panel p-4 rounded-xl shrink-0 w-64 space-y-2 hover:border-[#a855f7]/30 transition-all">
                    <span className="font-mono text-[10px] text-purple-400 uppercase font-bold">Scene 01</span>
                    <h4 className="font-bold text-xs text-white">Opening: Panel Pitch</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Absurd debate about challenge cards on the basepaths</p>
                    <div className="h-24 rounded bg-purple-950/20 border border-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>

                  {/* Slide 2 */}
                  <div className="glass-panel p-4 rounded-xl shrink-0 w-64 space-y-2 hover:border-[#a855f7]/30 transition-all">
                    <span className="font-mono text-[10px] text-purple-400 uppercase font-bold">Scene 02</span>
                    <h4 className="font-bold text-xs text-white">Transition: Zoom Out</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Transition to simulated stadium overlay in 4k realism</p>
                    <div className="h-24 rounded bg-purple-950/20 border border-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>

                  {/* Slide 3 */}
                  <div className="glass-panel p-4 rounded-xl shrink-0 w-64 space-y-2 hover:border-[#a855f7]/30 transition-all">
                    <span className="font-mono text-[10px] text-purple-400 uppercase font-bold">Scene 03</span>
                    <h4 className="font-bold text-xs text-white">Ending: Out of Bounds</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Keith tells player to sit down while chat reacts</p>
                    <div className="h-24 rounded bg-purple-950/20 border border-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl">
                  <h4 className="font-mono text-xs text-[#00b4d8] uppercase tracking-wider mb-2">FLOWMERCIAL SYNC RULES</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    Flowmercial triggers listen directly to the central websocket relay. When a `FLOWMERCIAL_TRIGGER` event is received, the frontend automatically routes to the active game room and overrides secondary panel widgets.
                  </p>
                </div>
              </motion.div>
            )}

            {/* View F: Persona Control (Bypass Gateway) */}
            {activeSandboxRoom === 'persona_console' && (
              <motion.div 
                key="persona_console"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full overflow-y-auto space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Persona Onboarding Blueprint</h3>
                  <p className="text-xs text-gray-400">Generate, seed, and manage AI characters and compliance constraints</p>
                </div>

                <div className="glass-panel p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-mono text-xs text-[#00b4d8] uppercase">Active Blueprint Registry</span>
                    <span className="text-[10px] font-mono text-gray-500">Source: SQLite sovereign_now.db</span>
                  </div>
                  <div className="space-y-3 font-mono text-xs text-gray-300">
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-white font-bold">CubsConspiracy</span>
                      <span className="text-[10px] text-[#00b4d8] bg-[#00b4d8]/10 px-2 py-0.5 rounded">Seeded (UAT Active)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-white font-bold">MetsFan_86</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active (Relay Port 8000)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-white font-bold">Scofflaw</span>
                      <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Inactive (Offline)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-950/15 border border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
                  <Layers className="w-5 h-5 text-[#00b4d8] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-white">Decoupled Architecture Rule</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      Persona blueprints must be formally seeded through database-level transactions in accordance with security protocols. Ad-hoc flat file configurations suffer from name collisions and must be avoided.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View G: Daily Roll Call */}
            {activeSandboxRoom === 'roll_call' && (
              <motion.div 
                key="roll_call"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 h-full overflow-y-auto space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Daily Roll Call</h3>
                  <p className="text-xs text-gray-400">Verify active operators, credentials, and Tailscale endpoint compliance</p>
                </div>

                <div className="glass-panel p-4 rounded-xl">
                  <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">ACTIVE COMPLIANCE CHECKS</h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between items-center p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">Tailscale Node: Clio</span>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-bold">VERIFIED</span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">WAL Database Integrity</span>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-bold">NOMINAL</span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-red-500/10 border border-red-500/20 animate-pulse">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-white font-bold">Waiver Trade Cache Integrity</span>
                      </div>
                      <span className="text-red-400 text-[10px] font-bold">OUT OF BOUNDS BLOCKED</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
