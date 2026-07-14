import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWsUrl } from '../api-host';

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

export default function FanStackSandbox() {
  const [theme, setTheme] = useState<'default' | 'chaos'>('default');
  const [gameState, setGameState] = useState<Partial<MARDPayload>>({});
  const [messages, setMessages] = useState<MARDPayload[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to the M.A.R.D. Engine WebSocket
  useEffect(() => {
    // Only connect if the user initiates a game, or default to open channel 
    // to listen to whatever the background python daemon is broadcasting.
    console.log("FanStack Sandbox initializing WebSocket to M.A.R.D Engine...");
    
    wsRef.current = new WebSocket(getWsUrl('/ws'));
    
    wsRef.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.msg_type === "STATE_UPDATE" || payload.msg_type === "historian_telemetry") {
          setGameState(prev => ({ ...prev, ...payload }));
          
          // Despair Cascade Logic
          if (payload.is_walk_off) {
            setTheme('chaos');
          } else if (payload.event_type !== 'walk_off') {
             // Normal reset
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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle manual game injection trigger
  const triggerSimulation = (gamePk: string) => {
     // Resets
     setTheme('default');
     setMessages([]);
     // Optional: send a switch_game command back through the socket if MARD supports it, or hit REST
     fetch(`/api/switch_game?gamePk=${gamePk}`)
       .catch(err => console.error("Could not trigger remote sim:", err));
  };

  return (
    <div className={`relative w-full h-[80vh] flex flex-col font-sans rounded-xl overflow-hidden border ${theme === 'chaos' ? 'border-[#ef4444] ' : 'border-[#38bdf8]/30 shadow-lg'}`}>
      
      {/* CONSTANT STYLES FOR DESPAIR CASCADE */}
      <style>{`
        .sandbox-chaos {
           background: radial-gradient(circle at center, #300, #000) !important;
           filter: saturate(1.5) contrast(1.2);
           animation: bodyShake 0.1s infinite;
        }
        @keyframes strobeRed {
           0% { background-color: rgba(255, 0, 0, 0.1); }
           50% { background-color: rgba(255, 0, 0, 0.4); }
           100% { background-color: rgba(255, 0, 0, 0.1); }
        }
        @keyframes bodyShake {
           0% { transform: translate(1px, 1px) rotate(0deg); }
           25% { transform: translate(-2px, -2px) rotate(-1deg); }
           50% { transform: translate(2px, 2px) rotate(1deg); }
           75% { transform: translate(-1px, 1px) rotate(0deg); }
           100% { transform: translate(1px, -1px) rotate(-1deg); }
        }
        .chaos-flash { animation: strobeRed 0.2s infinite; }
        .timeline-glass {
           background: rgba(11, 14, 20, 0.85);
           backdrop-filter: blur(16px);
        }
      `}</style>

      <div className={`absolute inset-0 transition-all duration-300 flex flex-col ${theme === 'chaos' ? 'sandbox-chaos' : 'bg-[#0B0E14]'}`}>
        
        {/* TOP SCOREBOARD */}
        <div className={`p-4 flex flex-col shrink-0 ${theme === 'chaos' ? 'chaos-flash' : 'bg-black/40 border-b border-[#38bdf8]/30'}`}>
           <div className="flex justify-between items-center mb-4">
              <select 
                 onChange={(e) => triggerSimulation(e.target.value)} 
                 className="bg-black/60 border border-[#38bdf8] text-[#38bdf8] px-3 py-1 rounded-lg text-xs font-mono outline-none cursor-pointer hover:bg-[#38bdf8]/10"
              >
                 <option value="">-- AWAITING TIMELINE TARGET --</option>
                 <option value="824691">Simulate: Mets vs Cubs (Walk-off)</option>
              </select>
              <div className="bg-[#ef4444] text-white font-display text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ">
                 🧪 FANSTACK TIMELINE
              </div>
           </div>

           <div className="text-center font-mono text-[#8E9CAA] text-sm mb-4 tracking-widest uppercase">
              INNING: <span className="text-white font-bold">{gameState.inning || '-'}</span> | 
              OUTS: <span className="text-white font-bold mx-1">{gameState.outs ?? 0}</span> | 
              COUNT: <span className="text-white font-bold mx-1">{gameState.balls ?? 0}-{gameState.strikes ?? 0}</span>
           </div>

           <div className="flex justify-center items-center gap-8 px-4">
              <div className="flex flex-col items-center">
                 <div className="text-[#8E9CAA] font-display text-xs tracking-widest mb-1">{gameState.away_team || 'AWAY'}</div>
                 <div className="text-4xl font-bold font-mono text-white drop-shadow-md">{gameState.away_score ?? 0}</div>
              </div>
              <div className="text-[#38bdf8]/50 font-display text-xl">VS</div>
              <div className="flex flex-col items-center">
                 <div className="text-[#FF5910] font-display text-xs tracking-widest mb-1">{gameState.home_team || 'HOME'}</div>
                 <div className="text-4xl font-bold font-mono text-white drop-">{gameState.home_score ?? 0}</div>
              </div>
           </div>
        </div>

        {/* TELEMETRY MATCHUP BAR */}
        <div className="bg-black/60 border-b border-white/5 p-3 flex flex-col shrink-0 gap-2">
           <div className="text-center text-[#8E9CAA] text-xs font-mono truncate px-4">
             {gameState.matchup_text || 'AWAITING PITCHER VS AWAITING BATTER'}
           </div>
           
           <div className="flex justify-center items-center gap-6 mt-1 text-xs font-mono">
              <div><span className="text-[#8E9CAA]">PITCH:</span> <span className="text-[#38bdf8]">{gameState.pitch_type || '---'}</span></div>
              <div><span className="text-[#8E9CAA]">VELO:</span> <span className="text-white">{gameState.pitch_speed || '---'}</span></div>
              
              {/* Vesper Diamond */}
              <svg width="30" height="24" viewBox="0 0 40 30" className={theme === 'chaos' ? 'drop-' : 'drop-'}>
                 <rect x="15" y="0"  width="10" height="10" transform="rotate(45 20 5)"   fill={gameState.runner_2b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
                 <rect x="5"  y="10" width="10" height="10" transform="rotate(45 10 15)"  fill={gameState.runner_3b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
                 <rect x="25" y="10" width="10" height="10" transform="rotate(45 30 15)"  fill={gameState.runner_1b ? (theme==='chaos'? '#ef4444' : '#fff') : 'transparent'} stroke={theme==='chaos' ? '#ef4444' : '#8E9CAA'} strokeWidth="1.5"/>
              </svg>
           </div>
        </div>

        {/* MESH CHAT STREAM */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative no-scrollbar">
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

      </div>
    </div>
  );
}
