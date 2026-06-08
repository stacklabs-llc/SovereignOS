import React, { useState, useEffect } from 'react';
import { DownloadCloud, Play, AlertTriangle } from 'lucide-react';
import FanStackChat from './FanStackChat';
import avatarMapData from '../avatarMap';

export default function WatchPartyConsole() {
  const ROM_PACKAGES = [
    { id: '1986_WS_G6', title: '1986 World Series Game 6', sub: 'NYM vs BOS (The Buckner Play)', gamePk: '111111', video: '/media_vault/02_Projects/FanStack_ROM_Viewer/FanStack_ROM_Viewer_N64_202605010336.mp4' },
    { id: '2017_NLDS_G5', title: '2017 NLDS Game 5', sub: 'CHC vs WSH (The Regulatory Capture)', gamePk: '222222', video: '/mets_fan.mp4' },
    { id: '2010_IMPERFECT', title: '2010 Imperfect Game', sub: 'CLE vs DET (The Umpirical Bias)', gamePk: '333333', video: '/madam_moments.mp4' },
    { id: '2022_NYM_PHI_COMEBACK', title: '2022 Mets 7-Run 9th Inning', sub: 'NYM vs PHI (The Miracle in Philly)', gamePk: '661619', video: '/media_vault/01_Ingest/Snipe_1777952107.mp4' },
  ];

  const [selectedRomId, setSelectedRomId] = useState('2022_NYM_PHI_COMEBACK');
  const activeRom = ROM_PACKAGES.find(r => r.id === selectedRomId) || ROM_PACKAGES[3];

  const [speed, setSpeed] = useState('1.0');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [isRomLoaded, setIsRomLoaded] = useState(false);

  const [isRoomBuilderOpen, setIsRoomBuilderOpen] = useState(false);
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [builderFilter, setBuilderFilter] = useState('');
  const [stagedPersonas, setStagedPersonas] = useState<string[]>([]);
  const [avatarMap] = useState<any>(avatarMapData || {});

  useEffect(() => {
    fetch('/api/all_personas')
      .then(r => r.json())
      .then(data => {
        if (data.personas) {
          setAllPersonas(data.personas.sort((a: any, b: any) => (a.team ?? '').localeCompare(b.team ?? '') || (a.user_name ?? '').localeCompare(b.user_name ?? '')));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const defaultPersonas = ['7_train_terry', 'uncle_stevie_stan', 'wardy', 'barf'];
    const oppTeamMatch = activeRom.sub.match(/vs (\w{3})/);
    let oppPersonas: string[] = [];
    if (oppTeamMatch && oppTeamMatch[1]) {
       oppPersonas = allPersonas.filter(p => p.team === oppTeamMatch[1]).map(p => p.user_name.toLowerCase());
    }
    const combined = Array.from(new Set([...defaultPersonas, ...oppPersonas]));
    setStagedPersonas(combined);
  }, [activeRom.id, allPersonas]);

  const togglePersona = (userName: string) => {
    const p = userName.toLowerCase();
    setStagedPersonas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setStatus("AWAITING ROM PAYLOAD...");
      const res = await fetch(`/api/admin/download_rom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_pk: parseInt(activeRom.gamePk, 10) })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`SUCCESS: ${data.message}`);
        setIsRomLoaded(true);
      } else {
        setStatus(`ERROR: ${data.message}`);
      }
    } catch (e) {
      setStatus(`ERROR: SECURE CHANNEL FAILURE (${e})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncGame = async () => {
    try {
      setStatus("PROVISIONING WATCH PARTY GUESTS...");
      await fetch('/api/save_room_personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamePk: activeRom.gamePk, personas: stagedPersonas })
      });

      setStatus("SYNCING DATA TO VIDEO PLAYBACK...");
      const res = await fetch(`/api/admin/ignite_sim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_pk: parseInt(activeRom.gamePk, 10), speed: parseFloat(speed) })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`SUCCESS: ${data.message}`);
      } else {
        setStatus(`ERROR: ${data.message}`);
      }
    } catch (e) {
      setStatus(`ERROR: MESH FAILURE (${e})`);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl bg-[#0a0a0a]">
      <div className={`absolute inset-0 flex flex-col font-sans transition-all p-3 gap-3 ${isMeltingDown ? 'border border-amber-500/50' : ''}`}>
      
      {/* HEADER */}
      <header className="h-12 flex items-center shrink-0 border-b border-white/10 px-4 bg-[#111111] rounded-t-xl">
        <div className="flex items-center gap-3">
            <div className="flex bg-blue-600 p-1.5 rounded shadow-sm">
                <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
                <h1 className="font-['Outfit'] text-white text-lg font-bold tracking-wide">Watch Party ROM Loader</h1>
            </div>
        </div>
        <div className="ml-auto flex gap-3 items-center">
            {status && (
              <span className={`text-xs font-medium tracking-wide px-3 py-1 rounded ${status.includes('ERROR') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-300'}`}>
                {status.includes('ERROR') ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : null}
                {status}
              </span>
            )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden gap-3 min-h-0">
        
        {/* VOD PLAYER */}
        <section className="flex-[3] bg-black rounded-xl border border-white/5 flex flex-col shadow-lg overflow-hidden relative">
           <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
               <video 
                   key={isRomLoaded ? activeRom.id : 'idle_n64_loop'} 
                   src={isRomLoaded ? activeRom.video : '/media_vault/02_Projects/FanStack_ROM_Viewer/FanStack_ROM_Viewer_N64_202605010336.mp4'} 
                   controls={isRomLoaded} 
                   autoPlay={!isRomLoaded} 
                   loop={!isRomLoaded} 
                   muted={!isRomLoaded} 
                   className="w-full h-full object-contain" 
               />
               
               {/* Overlay Title */}
               <div className="absolute top-4 left-4 z-20 pointer-events-none">
                   <h2 className="text-white font-['Outfit'] text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold px-3 py-1 bg-black/40 rounded backdrop-blur-sm">
                       {isRomLoaded ? activeRom.title : "AWAITING ROM INSERTION"}
                   </h2>
               </div>
           </div>
        </section>

        {/* TWITCH CHAT */}
        <aside className="w-[340px] shrink-0 flex flex-col bg-[#1e1e1e] rounded-xl border border-white/5 shadow-lg overflow-hidden">
            <div className="h-10 bg-[#18181b] border-b border-white/5 flex items-center px-4 shrink-0 justify-between">
                <span className="text-xs font-bold text-gray-300 tracking-wider">LIVE CHAT</span>
                <button 
                  onClick={() => setIsRoomBuilderOpen(true)}
                  className="bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 rounded px-2 py-0.5 text-[9px] font-bold tracking-widest text-[#38bdf8] uppercase font-mono"
                >BUILD ROOM</button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#0B0E14] relative">
                {isRomLoaded ? (
                    <FanStackChat onMeltdown={setIsMeltingDown} activeGamedayPk={activeRom.gamePk} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 font-bold tracking-[0.2em] font-mono">
                        [ INITIALIZING PERSONA MATRIX ]
                    </div>
                )}
            </div>
        </aside>
      </main>

      {/* BOTTOM CONTROLS */}
      <footer className="h-16 shrink-0 bg-[#1e1e1e] rounded-xl border border-white/5 shadow-lg flex items-center px-6 justify-between">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Select ROM Payload</label>
                <div className="flex border border-white/10 rounded overflow-hidden">
                    <select 
                        value={selectedRomId} 
                        onChange={(e) => setSelectedRomId(e.target.value)} 
                        className="bg-[#111] border-none focus:outline-none text-[#38bdf8] px-3 py-1.5 font-['Outfit'] font-bold text-sm w-[350px] cursor-pointer"
                    >
                        {ROM_PACKAGES.map(rom => (
                            <option key={rom.id} value={rom.id}>{rom.title} - {rom.sub}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="px-4 gap-2 bg-blue-600/20 hover:bg-blue-600 text-[#38bdf8] hover:text-white transition-all flex items-center justify-center border-l border-white/10 font-bold tracking-wide text-xs"
                    >
                        <DownloadCloud className="w-4 h-4" /> FETCH
                    </button>
                </div>
            </div>
         </div>

         <div className="flex gap-4">
             <div className="flex flex-col justify-center">
                 <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Playback</label>
                 <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="bg-transparent text-white text-xs outline-none cursor-pointer">
                     <option value="1.0">1.0x (Live Sync)</option>
                     <option value="2.0">2.0x (Fast)</option>
                     <option value="5.0">5.0x (Warp)</option>
                 </select>
             </div>
             
             <button 
                 onClick={handleSyncGame}
                 className="px-8 py-2 bg-purple-600 hover:bg-purple-500 text-white font-['Outfit'] font-bold tracking-wide text-sm rounded shadow-[0_4px_14px_rgba(147,51,234,0.4)] transition-all active:scale-95 flex items-center gap-2 h-full"
             >
                 <Play className="w-4 h-4 fill-white" /> SYNC GAME
             </button>
         </div>
      </footer>
      </div>

      {/* ROOM BUILDER MODAL */}
      {isRoomBuilderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#0a0c10] border border-[#38bdf8]/30 rounded-3xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center gap-3 font-display">
                  Watch Party Builder
                </h2>
                <p className="text-gray-400 mt-1 font-mono text-xs">Assign personas manually to {activeRom.title}</p>
              </div>
              <button onClick={() => setIsRoomBuilderOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-white/5 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search personas by name or team (e.g. 'PHI' or 'phanatic')..."
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-600 font-mono text-sm"
                  value={builderFilter}
                  onChange={e => setBuilderFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#050608] min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPersonas
                  .filter(p => p.user_name.toLowerCase().includes(builderFilter.toLowerCase()) || p.team.toLowerCase().includes(builderFilter.toLowerCase()))
                  .map(p => {
                    const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                    const imgSrc = avatarMap[p.user_name.toLowerCase()] || avatarMap[p.user_name.toLowerCase().replace(/_/g, '')];

                    return (
                      <div
                        key={p.sys_id}
                        onClick={() => togglePersona(p.user_name)}
                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 ' : 'bg-white/[0.03] border-white/5 hover:border-white/20'}`}
                      >
                        {imgSrc ? (
                          <img src={imgSrc} className="w-10 h-10 rounded-full object-cover border border-white/20" alt={p.user_name} />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-gray-500 text-xs font-bold uppercase">{p.user_name.substring(0, 2)}</div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-white text-sm truncate font-display tracking-widest uppercase">{p.user_name}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5">{p.team}</span>
                        </div>
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-[#38bdf8] text-black' : 'border border-white/20'}`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-[#0a0c10] flex justify-end gap-4 shrink-0">
               <button onClick={() => setIsRoomBuilderOpen(false)} className="px-6 py-2 rounded-lg text-white/70 font-bold uppercase tracking-widest text-xs hover:bg-white/10 font-mono">Cancel</button>
               <button onClick={() => setIsRoomBuilderOpen(false)} className="px-6 py-2 rounded-lg bg-[#38bdf8] text-black font-bold uppercase tracking-widest text-xs hover:bg-[#0ea5e9] font-mono">Save Configuration</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
