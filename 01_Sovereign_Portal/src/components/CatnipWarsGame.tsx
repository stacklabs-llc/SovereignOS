import React, { useState } from 'react';
import { Play, Shield, ShieldAlert, Award, Sparkles, MessageSquare } from 'lucide-react';

export default function CatnipWarsGame() {
  const [logs, setLogs] = useState<string[]>([
    '🌳 [Treehouse Syndicate] Buster has claimed the highest branch.',
    '📦 Cardboard defenses reinforced with double-layered duct tape.'
  ]);
  const [kibble, setKibble] = useState(10);
  const [score, setScore] = useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 8)]);
  };

  const handleTrebuchet = () => {
    if (kibble <= 0) {
      addLog('⚠️ Out of kibble ammo!');
      return;
    }
    setKibble(k => k - 1);
    const hit = Math.random() > 0.4;
    if (hit) {
      setScore(s => s + 15);
      addLog('🎯 Direct hit! Cardboard tower damaged.');
    } else {
      addLog('💨 Launch missed. Kibble landed in the grass.');
    }
  };

  const handleReinforce = () => {
    setKibble(k => k + 5);
    addLog('📦 Foraged 5 extra kibble buds from the kitchen cupboard.');
  };

  const handleSummon = () => {
    setScore(s => s + 50);
    addLog('🐱 Hobbes has entered the cardboard perimeter. Meow!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#2b1f1d] border-4 border-double border-[#8b5a2b] rounded-2xl shadow-2xl relative overflow-hidden font-mono text-[#e8dcd0]">
      {/* Crayon lines / Cardboard texture background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#8b5a2b_2px,transparent_2px)] [background-size:24px_24px]" />
      
      {/* Header with duct tape styling */}
      <header className="relative bg-[#5c4033] border-2 border-[#8b5a2b] rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between shadow-lg">
        <div className="absolute -top-3 left-6 px-3 py-1 bg-[#b5a642] text-black font-bold text-[10px] uppercase tracking-widest border border-black shadow">
          DUCT TAPE BINDING
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#b5a642]/20 border border-[#b5a642] flex items-center justify-center">
            <span className="text-2xl">🐈</span>
          </div>
          <div>
            <h1 className="font-sans text-2xl font-black tracking-widest text-[#f5c242] uppercase">
              Catnip Wars
            </h1>
            <p className="text-xs uppercase text-[#b5a642] font-bold">
              Cardboard Syndicate Sandbox v1.0
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-bold">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#b5a642] uppercase">Kibble Ammo</span>
            <span className="text-xl text-white">{kibble}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#b5a642] uppercase">Score</span>
            <span className="text-xl text-[#f5c242]">{score}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="md:col-span-2 flex flex-col gap-4 bg-[#3c2a21] border border-[#8b5a2b] rounded-xl p-4 shadow-inner">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#b5a642] border-b border-[#8b5a2b] pb-2 mb-2 flex items-center gap-2">
            <Shield size={14} /> Treehouse Tactical Control
          </h2>
          
          <div className="flex flex-wrap gap-3 my-2">
            <button
              onClick={handleTrebuchet}
              className="flex-1 min-w-[150px] bg-[#8b5a2b] hover:bg-[#b5a642] hover:text-black border-2 border-black px-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors shadow-md active:translate-y-0.5"
            >
              🚀 Launch Trebuchet
            </button>
            <button
              onClick={handleReinforce}
              className="flex-1 min-w-[150px] bg-[#5c4033] hover:bg-[#b5a642] hover:text-black border-2 border-black px-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors shadow-md active:translate-y-0.5"
            >
              📦 Forage Kibble
            </button>
            <button
              onClick={handleSummon}
              className="flex-1 min-w-[150px] bg-[#b5a642] hover:bg-[#f5c242] text-black border-2 border-black px-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors shadow-md active:translate-y-0.5"
            >
              🐾 Summon Hobbes
            </button>
          </div>

          <div className="mt-4 border border-dashed border-[#8b5a2b] rounded-lg p-4 bg-[#2b1f1d]/50 relative">
            <div className="absolute top-2 right-2 text-[9px] text-[#b5a642] uppercase tracking-wider animate-pulse">
              Active Environment
            </div>
            <h3 className="text-xs font-bold text-[#b5a642] uppercase mb-2">Cardboard Treehouse Physics Engine</h3>
            <p className="text-xs leading-relaxed text-[#e8dcd0]/80">
              Wind Velocity: 3 mph (Backyard Eastward breeze) <br />
              Gravity Constant: 9.8 m/s² (Offset by tree branch height) <br />
              Fortification Integrity: 98% (Double taped)
            </p>
          </div>
        </div>

        {/* Right Logs */}
        <div className="flex flex-col bg-[#1f1512] border border-[#8b5a2b] rounded-xl p-4 max-h-[350px] overflow-hidden">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#b5a642] border-b border-[#8b5a2b] pb-2 mb-2 flex items-center gap-2">
            <MessageSquare size={14} /> Syndicate Wire
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-[#e8dcd0]/75 pr-1 no-scrollbar">
            {logs.map((log, idx) => (
              <div key={idx} className="border-b border-[#8b5a2b]/20 pb-1.5 last:border-b-0">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
