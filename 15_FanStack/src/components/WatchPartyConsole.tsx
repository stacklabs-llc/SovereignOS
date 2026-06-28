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
  const [builderViewMode, setBuilderViewMode] = useState<'list' | 'grid'>('list');
  const [builderStackTab, setBuilderStackTab] = useState<'ALL' | 'SEATED' | 'SPORTS' | 'SOCIETY'>('ALL');
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
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set('domain', 'GLOBAL');
                    params.set('room', 'room_builder');
                    if (isRomLoaded && activeRom.gamePk) {
                      params.set('_game_room', activeRom.gamePk);
                    }
                    window.history.pushState({}, '', '?' + params.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-6 animate-fade-in">
          <div className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-[#38bdf8]/30 rounded-3xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-white/10 shrink-0 gap-4 bg-black/40">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3 font-display">
                  👑 WATCH PARTY MATRIX
                </h2>
                <p className="text-gray-400 mt-1 font-mono text-xs uppercase tracking-wider">
                  Assign active watch party guests to {activeRom.title}
                </p>
              </div>
              
              {/* Layout Toggle (Grid vs List) */}
              <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl gap-1 shrink-0">
                <button
                  onClick={() => setBuilderViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono transition-all ${
                    builderViewMode === 'list'
                      ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/40 text-[#38bdf8]'
                      : 'text-gray-500 hover:text-white border border-transparent'
                  }`}
                >
                  ☰ List View
                </button>
                <button
                  onClick={() => setBuilderViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono transition-all ${
                    builderViewMode === 'grid'
                      ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/40 text-[#38bdf8]'
                      : 'text-gray-500 hover:text-white border border-transparent'
                  }`}
                >
                  ☷ Grid View
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] shrink-0 flex flex-col gap-3">
              {/* Roster Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'ALL', label: 'All Roster' },
                  { id: 'SEATED', label: '⚡ Seated in Room' },
                  { id: 'SOCIETY', label: '🏢 Seeded stacks' },
                  { id: 'SPORTS', label: '⚾ MLB / ATHLETICS' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setBuilderStackTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap shrink-0 transition-all font-mono ${
                      builderStackTab === tab.id
                        ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 text-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                        : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text search */}
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search personas by name, team, or prompt rules..."
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-600 font-mono text-sm"
                  value={builderFilter}
                  onChange={e => setBuilderFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Scrollable List Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#050608] min-h-0">
              {(() => {
                const sportsTeams = ['NYM', 'MIA', 'ATL', 'PIT', 'NYJ', 'DAL', 'GB', 'UFL'];
                
                // 1. First filter
                let filtered = allPersonas.filter(p => {
                  const matchSearch = p.user_name.toLowerCase().includes(builderFilter.toLowerCase()) || 
                                      (p.team || '').toLowerCase().includes(builderFilter.toLowerCase()) ||
                                      (p.system_prompt || '').toLowerCase().includes(builderFilter.toLowerCase());
                  
                  if (!matchSearch) return false;

                  const isSeated = stagedPersonas.includes(p.user_name.toLowerCase());
                  const isSports = sportsTeams.includes((p.team || '').toUpperCase());

                  if (builderStackTab === 'SEATED') return isSeated;
                  if (builderStackTab === 'SPORTS') return isSports;
                  if (builderStackTab === 'SOCIETY') return !isSports;
                  return true;
                });

                // 2. Prioritize Seated / Selected ones to the VERY TOP of the list!
                filtered = [...filtered].sort((a, b) => {
                  const aSel = stagedPersonas.includes(a.user_name.toLowerCase());
                  const bSel = stagedPersonas.includes(b.user_name.toLowerCase());
                  if (aSel && !bSel) return -1;
                  if (!aSel && bSel) return 1;
                  return (a.team || '').localeCompare(b.team || '') || a.user_name.localeCompare(b.user_name);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl">
                      <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No matching personas found</p>
                    </div>
                  );
                }

                // Render as List or Grid
                if (builderViewMode === 'list') {
                  return (
                    <div className="flex flex-col gap-2">
                      {filtered.map(p => {
                        const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                        const imgSrc = avatarMap[p.user_name.toLowerCase()] || `/api/persona_image/${p.user_name}`;
                        
                        return (
                          <div
                            key={p.sys_id || p.user_name}
                            onClick={() => togglePersona(p.user_name)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                              isSelected 
                                ? 'bg-[#38bdf8]/10 border-[#38bdf8]/40 shadow-inner' 
                                : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                            }`}
                            style={isSelected ? { borderLeftColor: p.color || '#38bdf8', borderLeftWidth: '3px' } : {}}
                          >
                            {/* Left Side: Checkbox, Avatar, Name */}
                            <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
                              <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#38bdf8] text-black font-black' : 'border border-white/20'
                              }`}>
                                {isSelected && '✓'}
                              </div>

                              <img 
                                src={imgSrc} 
                                className="w-9 h-9 rounded-full object-cover border"
                                style={{ borderColor: p.color || '#38bdf8' }}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                                }}
                              />

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-sm font-display tracking-wider uppercase truncate">
                                    {p.user_name}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[8px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                      Active in Room
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono mt-0.5 truncate uppercase">
                                  Rule Set: {p.system_prompt || 'advocate'}
                                </span>
                              </div>
                            </div>

                            {/* Right Side: Team Badge */}
                            <div className="flex-shrink-0">
                              <span 
                                className="text-[9px] font-mono font-black px-2.5 py-1 rounded border uppercase tracking-widest"
                                style={{ 
                                  color: p.color || '#3b82f6', 
                                  borderColor: `${p.color || '#3b82f6'}30`,
                                  backgroundColor: `${p.color || '#3b82f6'}08`
                                }}
                              >
                                {p.team}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map(p => {
                        const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                        const imgSrc = avatarMap[p.user_name.toLowerCase()] || `/api/persona_image/${p.user_name}`;

                        return (
                          <div
                            key={p.sys_id || p.user_name}
                            onClick={() => togglePersona(p.user_name)}
                            className={`flex flex-col p-4 rounded-2xl cursor-pointer transition-all border gap-3 ${
                              isSelected 
                                ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 shadow-inner' 
                                : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                            }`}
                            style={isSelected ? { borderLeftColor: p.color || '#38bdf8', borderLeftWidth: '3px' } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={imgSrc} 
                                className="w-10 h-10 rounded-full object-cover border"
                                style={{ borderColor: p.color || '#38bdf8' }}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                                }}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-bold text-white text-xs truncate font-display tracking-widest uppercase">{p.user_name}</span>
                                <span 
                                  className="text-[8px] font-mono font-black mt-1 px-1.5 py-0.5 rounded border self-start uppercase tracking-widest"
                                  style={{ 
                                    color: p.color || '#3b82f6', 
                                    borderColor: `${p.color || '#3b82f6'}30`,
                                    backgroundColor: `${p.color || '#3b82f6'}08`
                                  }}
                                >
                                  {p.team}
                                </span>
                              </div>
                              <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#38bdf8] text-black font-bold' : 'border border-white/20'
                              }`}>
                                {isSelected && '✓'}
                              </div>
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono border-t border-white/5 pt-2 leading-relaxed">
                              Constraints: {p.system_prompt || 'advocate'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              })()}
            </div>
            
            {/* Action Bar */}
            <div className="p-6 border-t border-white/10 bg-[#0a0c10] flex justify-between items-center shrink-0">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                Total Seated: <span className="text-[#38bdf8] font-bold">{stagedPersonas.length}</span>
              </span>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsRoomBuilderOpen(false)} 
                  className="px-6 py-2.5 rounded-xl text-white/70 font-bold uppercase tracking-widest text-xs hover:bg-white/5 border border-transparent font-mono transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsRoomBuilderOpen(false)} 
                  className="px-6 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black uppercase tracking-widest text-xs font-mono transition-all hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
