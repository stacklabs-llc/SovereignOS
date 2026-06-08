import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MlbScoreBar from './MlbScoreBar';

interface FanLobbyProps {
  activeGamedayPk?: string | null;
  onSelectGame?: (pk: string) => void;
}

export default function FanLobby({ activeGamedayPk, onSelectGame }: FanLobbyProps) {
  const [activeSport, setActiveSport] = useState<'MLB' | 'NBA' | 'NFL' | 'PGA'>('MLB');

  const sports = [
    { id: 'MLB', label: 'Baseball', icon: '⚾', color: 'cyan' },
    { id: 'NBA', label: 'Basketball', icon: '🏀', color: 'orange' },
    { id: 'NFL', label: 'Football', icon: '🏈', color: 'red' },
    { id: 'PGA', label: 'Golf', icon: '⛳', color: 'green' }
  ];

  return (
    <div className="min-h-screen os-panel font-display text-white overflow-x-hidden flex flex-col relative">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.05)_0%,_transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(168,85,247,0.05)_0%,_transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

      {/* Header */}
      <header className="px-8 py-6 os-card-header sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            🏟️
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase text-white drop-shadow-md">Sovereign <span className="text-cyan-400">Fan Lobby</span></h1>
            <p className="text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase mt-1">The Ultimate Virtual Sports Matrix</p>
          </div>
        </div>
        
        {/* Sport Selector */}
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
          {sports.map(sport => (
            <button 
              key={sport.id}
              onClick={() => setActiveSport(sport.id as any)}
              className={`px-6 py-2.5 rounded-md font-bold tracking-wider uppercase text-xs transition-all duration-300 flex items-center gap-2 ${
                activeSport === sport.id 
                  ? `bg-white/10 text-white shadow-lg border border-white/10` 
                  : 'text-white/30 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-base">{sport.icon}</span> {sport.label}
            </button>
          ))}
        </div>
      </header>

      {/* Sport Specific Sub-Headers (e.g. Slate) */}
      {activeSport === 'MLB' && (
        <div className="w-full">
          <MlbScoreBar activeGamedayPk={activeGamedayPk} onSelectGame={onSelectGame} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-8 grid grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Live Streams & Featured */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="os-card overflow-hidden relative aspect-video flex flex-col group"
          >
             <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               <span className="text-red-400 font-bold text-[10px] tracking-widest uppercase font-mono">Live Broadcast</span>
             </div>
             
             <div className="flex-1 bg-gradient-to-b from-black/20 to-black/80 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-luminosity transition-transform duration-1000 group-hover:scale-105"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent"></div>
               
               <button className="relative z-20 w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center backdrop-blur-sm hover:bg-cyan-500/40 hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(56,189,248,0.3)] group-hover:shadow-[0_0_50px_rgba(56,189,248,0.5)]">
                 <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
               </button>
             </div>
             
             <div className="p-6 os-card-header relative z-20">
               <div className="flex justify-between items-end">
                 <div>
                   <h2 className="text-2xl font-bold tracking-wide text-white mb-2">{activeSport} Primetime Matchup</h2>
                   <p className="text-white/50 text-sm font-mono">Join the global chat and experience the game with FanStack Personas.</p>
                 </div>
                 <div className="flex gap-3">
                   <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                     <span className="text-white/50 text-[10px] uppercase tracking-widest font-mono">Viewers</span>
                     <span className="text-cyan-400 font-bold font-mono">14,208</span>
                   </div>
                 </div>
               </div>
             </div>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-6">
             {/* Highlight Card 1 */}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="os-card p-5 hover:border-cyan-500/30 transition-colors cursor-pointer group">
                <div className="aspect-video rounded-xl bg-white/5 overflow-hidden mb-4 relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-white tracking-wide mb-1">Highlight Reel: Plays of the Week</h3>
                <p className="text-white/40 text-xs font-mono">Curated by the Sovereign Oracle</p>
             </motion.div>
             
             {/* Highlight Card 2 */}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="os-card p-5 hover:border-purple-500/30 transition-colors cursor-pointer group">
                <div className="aspect-video rounded-xl bg-white/5 overflow-hidden mb-4 relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-white tracking-wide mb-1">Behind the Scenes: {activeSport}</h3>
                <p className="text-white/40 text-xs font-mono">Exclusive access and player interviews</p>
             </motion.div>
          </div>
        </div>
        
        {/* Right Column: Global Chat & Personas */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="os-card flex-1 flex flex-col overflow-hidden max-h-[800px]">
            <div className="p-4 os-card-header">
               <h3 className="font-bold text-white tracking-widest uppercase flex items-center gap-2">
                 <span className="text-cyan-400">💬</span> Global Fan Chat
               </h3>
               <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase mt-1">Room: {activeSport} General</p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 no-scrollbar">
              {/* Mock Chat Messages */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-xs font-bold shrink-0">JR</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-white/80">JamesThePilot</span>
                    <span className="text-[9px] font-mono text-white/30">Just now</span>
                  </div>
                  <div className="text-sm text-white/90 bg-white/5 px-3 py-2 rounded-r-xl rounded-bl-xl border border-white/5">This broadcast quality is absolutely insane. Sovereign OS doing work! 🔥</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.3)] border border-emerald-400/50">CK</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">Cosmo Kramer <span className="bg-emerald-400/20 text-emerald-400 px-1 rounded text-[8px] uppercase tracking-wider">AI</span></span>
                    <span className="text-[9px] font-mono text-white/30">1 min ago</span>
                  </div>
                  <div className="text-sm text-white/90 bg-emerald-900/20 px-3 py-2 rounded-r-xl rounded-bl-xl border border-emerald-500/20">Buddy, let me tell you, I haven't seen a setup like this since Bob Sacamano wired his apartment for illegal cable in '94! Giddy up!</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center text-xs font-bold shrink-0">FS</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-fuchsia-400">FanStacker99</span>
                    <span className="text-[9px] font-mono text-white/30">3 mins ago</span>
                  </div>
                  <div className="text-sm text-white/90 bg-white/5 px-3 py-2 rounded-r-xl rounded-bl-xl border border-white/5">Did anyone catch that last play? Incredible.</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 os-card-header">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Join the conversation..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
