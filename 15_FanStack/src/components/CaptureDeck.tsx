import React, { useState, useEffect } from 'react';
import { DownloadCloud, Play, AlertTriangle } from 'lucide-react';
import FanStackChat from './FanStackChat';

export default function CaptureDeck() {
  const ROM_PACKAGES = [
    { id: '1986_WS_G6', title: '1986 World Series Game 6', sub: 'NYM vs BOS (The Buckner Play)', gamePk: '111111', video: '/media_vault/02_Projects/FanStack_ROM_Viewer/FanStack_ROM_Viewer_N64_202605010336.mp4' },
    { id: '2017_NLDS_G5', title: '2017 NLDS Game 5', sub: 'CHC vs WSH (The Regulatory Capture)', gamePk: '222222', video: '/mets_fan.mp4' },
    { id: '2010_IMPERFECT', title: '2010 Imperfect Game', sub: 'CLE vs DET (The Umpirical Bias)', gamePk: '333333', video: '/madam_moments.mp4' },
    { id: '2022_NYM_PHI_COMEBACK', title: '2022 Mets 7-Run 9th Inning', sub: 'NYM vs PHI (The Miracle in Philly)', gamePk: '661619', video: '/media_vault/01_Ingest/Snipe_1777952107.mp4' },
  ];

  const [selectedRomId, setSelectedRomId] = useState('1986_WS_G6');
  const activeRom = ROM_PACKAGES.find(r => r.id === selectedRomId) || ROM_PACKAGES[0];

  const [speed, setSpeed] = useState('1.0');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [boggsLevel, setBoggsLevel] = useState('5');
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [roster, setRoster] = useState<{sys_id: string, name: string}[]>([]);

  useEffect(() => {
    // Fetch directly from port 8000 API
    const fetchAgents = async () => {
      try {
        const res = await fetch(`/api/now/table/cmdb_ci`);
        const data = await res.json();
        if (data && data.result) {
          setRoster(data.result);
        }
      } catch (e) {
        console.error("Failed to load CMDB personas", e);
      }
    };
    fetchAgents();
  }, []);

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
      } else {
        setStatus(`ERROR: ${data.message}`);
      }
    } catch (e) {
      setStatus(`ERROR: SECURE CHANNEL FAILURE (${e})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIgnite = async () => {
    try {
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
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      <div 
        className={`absolute inset-0 flex flex-col font-sans transition-all duration-[2000ms] bg-[#111111] p-3 gap-3 rounded-xl border border-white/5 shadow-2xl ${isMeltingDown ? 'border-amber-500/50 ' : ''}`}
        style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }}
      >
      
      {/* APP HEADER: CREATOR STUDIO */}
      <header className="h-10 flex items-center shrink-0 border-b border-white/10 px-2">
        <div className="flex items-center gap-3">
            <div className="flex bg-gradient-to-tr from-purple-600 to-blue-500 p-1.5 rounded-lg shadow-sm">
                <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <div>
                <h1 className="font-['Outfit'] text-white text-[13px] font-bold tracking-wide">TMI ROM Gallery</h1>
            </div>
        </div>

        <div className="ml-auto flex gap-3 items-center">
            {status && (
              <span className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded ${status.includes('ERROR') ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'}`}>
                {status.includes('ERROR') ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : null}
                {status}
              </span>
            )}
           <div className="px-3 py-1 rounded bg-[#1e1e1e] border border-white/5 flex items-center gap-2 shadow-inner">
             <div className={`w-1.5 h-1.5 rounded-full ${isMeltingDown ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`} />
             <span className="text-[10px] tracking-wide text-gray-400 font-medium">M.A.R.D. Core Online</span>
           </div>
        </div>
      </header>

      {/* MAIN STUDIO DESK */}
      <main className="flex-1 flex overflow-hidden gap-3 min-h-0">
        
        {/* LEFT MULTIVIEW: Cinematic Viewport */}
        <section className="flex-1 bg-[#1e1e1e] rounded-xl border border-white/5 flex flex-col shadow-lg overflow-hidden relative">
           <div className="h-8 bg-[#18181b] border-b border-white/5 flex items-center px-4 shrink-0">
               <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Program Feed</span>
           </div>
           
           <div className="flex-1 relative w-full h-full flex items-center justify-center bg-black overflow-hidden group p-4">
               {/* Professional Studio Guidelines Overlay */}
               <div className="absolute inset-0 border-[0.5px] border-white/10 opacity-30 pointer-events-none m-8 rounded-lg border-dashed"></div>
               <div className="absolute top-1/2 w-full h-[1px] bg-white/5 pointer-events-none"></div>
               <div className="absolute left-1/2 h-full w-[1px] bg-white/5 pointer-events-none"></div>

               <video key={activeRom.id} src={activeRom.video} autoPlay loop muted playsInline className="w-full h-full object-cover filter opacity-90" />
               
               {/* Studio On-Screen Display (OSD) */}
               <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                   <div>
                       <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1.5 mb-2 w-max">
                           <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                       </span>
                       <h2 className="text-white font-['Outfit'] text-2xl drop-shadow-md font-bold">{activeRom.title}</h2>
                   </div>
                   <div className="bg-black/60 px-3 py-1.5 rounded backdrop-blur-md border border-white/10 text-white font-mono text-[11px]">
                       00:00:00:00
                   </div>
               </div>
           </div>
        </section>

        {/* RIGHT PANELS: Discourse & Sources */}
        <aside className="w-[360px] shrink-0 flex flex-col gap-3">
            {/* Panel 1: Chat Stream */}
            <div className="flex-[2] bg-[#1e1e1e] rounded-xl border border-white/5 flex flex-col shadow-lg overflow-hidden">
                <div className="h-8 bg-[#18181b] border-b border-white/5 flex items-center px-4 shrink-0">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Discourse Mixer</span>
                </div>
                <div className="flex-1 overflow-hidden bg-[#111111]">
                    <FanStackChat onMeltdown={setIsMeltingDown} />
                </div>
            </div>

            {/* Panel 2: Studio Audio/Data Mixer (OBS Style) */}
            <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-white/5 flex flex-col shadow-lg overflow-hidden">
                <div className="h-8 bg-[#18181b] border-b border-white/5 flex items-center px-4 shrink-0 justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Data Mixer</span>
                    <span className="text-[9px] text-gray-500">Live</span>
                </div>
                <div className="flex-1 p-4 flex gap-4">
                    {/* Audio track simulator */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
                        <div className="flex-1 w-2 bg-black rounded-full overflow-hidden relative border border-white/5">
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all duration-75" style={{ height: '70%' }}></div>
                        </div>
                        <span className="text-[9px] font-medium text-gray-500">M.A.R.D.</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                         <div className="flex justify-between items-center bg-[#111111] p-2 rounded border border-white/5">
                            <span className="text-[10px] text-gray-400">Boggs Level</span>
                            <input type="range" min="1" max="5" value={boggsLevel} onChange={e => setBoggsLevel(e.target.value)} className="w-16 accent-blue-500" />
                            <span className="text-[10px] text-white font-mono">{boggsLevel}</span>
                         </div>
                         <div className="flex justify-between items-center bg-[#111111] p-2 rounded border border-white/5">
                            <span className="text-[10px] text-gray-400">Playback</span>
                            <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="bg-transparent border-b border-white/10 focus:border-[#38bdf8] focus:outline-none text-white text-[10px] pb-0.5 cursor-pointer">
                                <option value="1.0">1.0x (Live)</option>
                                <option value="2.0">2.0x (Fast)</option>
                                <option value="5.0">5.0x (Warp)</option>
                            </select>
                         </div>
                    </div>
                </div>
            </div>
        </aside>

      </main>

      {/* BOTTOM CONTROL DECK */}
      <footer className="h-16 shrink-0 bg-[#1e1e1e] rounded-xl border border-white/5 shadow-lg flex items-center px-4 justify-between">
         
         <div className="flex items-center gap-3">
            <div className="flex flex-col">
                <label className="text-[9px] text-gray-500 font-semibold uppercase mb-0.5">ROM Payload ID</label>
                <div className="flex border border-white/10 rounded overflow-hidden">
                    <select 
                        value={selectedRomId} 
                        onChange={(e) => setSelectedRomId(e.target.value)} 
                        className="bg-transparent border-b border-white/10 focus:border-[#38bdf8] focus:outline-none text-[#00f3ff] px-3 py-1 font-['Outfit'] font-bold text-[15px] w-[400px] cursor-pointer"
                    >
                        {ROM_PACKAGES.map(rom => (
                            <option key={rom.id} value={rom.id} className="bg-[#111111]">{rom.title} - {rom.sub}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="px-5 gap-2 bg-blue-600/20 hover:bg-blue-600 text-[#38bdf8] hover:text-white transition-all flex items-center justify-center border-l border-white/10 font-bold tracking-wide text-[12px]"
                    >
                        <DownloadCloud className="w-4 h-4" /> FETCH PAYLOAD
                    </button>
                </div>
            </div>
         </div>

         <div className="flex gap-3">
             <button 
                 className="px-6 py-2 bg-[#2a2a2b] hover:bg-[#3f3f41] text-gray-200 font-semibold text-[11px] rounded-lg border border-white/5 transition-colors shadow-sm"
             >
                 Studio Mode
             </button>
             <button 
                 onClick={handleIgnite}
                 className="px-8 py-2 bg-purple-600 hover:bg-purple-500 text-white font-['Outfit'] font-bold tracking-wide text-[12px] rounded-lg shadow-[0_4px_14px_rgba(147,51,234,0.4)] transition-all active:scale-95 flex items-center gap-2"
             >
                 <Play className="w-3.5 h-3.5 fill-white" /> SYNC GAME
             </button>
         </div>

      </footer>
      </div>
    </div>
  );
}
