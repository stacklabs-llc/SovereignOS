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
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-8 flex flex-col items-center justify-center gap-6 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(56,189,248,0.15)]"
        >
          🏟️
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-widest text-white uppercase mb-3">Select a Game</h2>
          <p className="text-white/50 font-mono text-sm uppercase tracking-widest leading-relaxed">
            Choose a matchup from the {activeSport} slate above<br/>to enter a live Fan Room
          </p>
        </motion.div>
      </main>
    </div>
  );
}
