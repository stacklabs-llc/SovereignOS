import React, { useState, useEffect } from 'react';
import { Cpu, Settings, Disc, ShieldAlert } from 'lucide-react';

interface CMDBItem {
  sys_id: string;
  name: string;
  deployment_zone?: string;
}

export default function RoomConfigurator() {
  const [gamePk, setGamePk] = useState('823644');
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0');
  const [roster, setRoster] = useState<CMDBItem[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(['barf', 'wardy']));
  const [boggsLevel, setBoggsLevel] = useState('3');
  const [cadence, setCadence] = useState('Balanced');
  const [ambientEntropy, setAmbientEntropy] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const today = new Date();
    const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${localDate}`)
      .then(r => r.json())
      .then(d => {
        if(d.dates && d.dates[0]) setSchedule(d.dates[0].games || []);
      }).catch(e => console.error("Schedule error", e));
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const HOST = window.location.protocol === "https:" ? window.location.host : `${window.location.hostname}:8096`;
        const res = await fetch(`http://${HOST}/api/all_personas`);
        const data = await res.json();
        if (data && data.personas) setRoster(data.personas);
      } catch (e) {
        console.error("Failed to load CMDB", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const togglePersona = async (personaName: string, isActive: boolean) => {
      const action = isActive ? 'remove' : 'add';
      const HOST = window.location.protocol === "https:" ? window.location.host : `${window.location.hostname}:8096`;
      setStatusMsg(`UPDATING ${personaName.toUpperCase()}...`);
      try {
          await fetch(`http://${HOST}/api/save_room_personas`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({persona: personaName, game_pk: gamePk, action: action})
          });
          setRoster(prev => prev.map(p => p.name === personaName ? {...p, deployment_zone: isActive ? 'BENCHED' : gamePk} : p));
      } catch (e) {
          console.error(e);
      }
      setStatusMsg('');
  };

  const executePreFlight = async () => {
    setStatusMsg('INJECTING PARAMETERS TO VAULT...');
    try {
      const HOST = window.location.protocol === "https:" ? window.location.host : `${window.location.hostname}:5055`;
      await fetch(`http://${HOST}/api/admin/override`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'UHF_ROOM_CONFIGURATOR', target_nodes: ['GLOBAL'],
          constraints_toggle: { action: "set_boggs", protocol_string: boggsLevel },
          global_context: ambientEntropy
        })
      });
      setStatusMsg('PRE-FLIGHT GREEN. IGNITE WHEN READY.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch(e) {
      setStatusMsg('ERROR IGNITING PROTOCOL SEQUENCE');
    }
  };

  return (
    <div className="h-full min-h-[85vh] mx-auto p-3 bg-void vm-body rounded-2xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 shrink-0 gap-5 relative z-10 bg-black/40">
        <div className="absolute -bottom-[1px] left-4 w-[100px] h-[2px] bg-[#f59e0b] "></div>
        <h1 className="font-['Outfit'] text-[20px] font-bold tracking-[0.1em] text-[#f59e0b] drop-shadow-lg uppercase flex items-center gap-3">
          <Settings className="w-5 h-5"/> Room Configurator
        </h1>
        <div className="text-[13px] text-[#94a3b8] flex-1 font-['Inter']">
          Sovereign Master Configuration Node
        </div>
        {statusMsg && (
            <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.05em] px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-[#38bdf8]/30 text-[#38bdf8] bg-[#38bdf8]/10 animate-pulse">
                <span>{statusMsg}</span>
            </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative z-10 p-5 gap-6 mx-auto w-full max-w-[900px] flex flex-col overflow-y-auto custom-scrollbar">
          
          <div className="vm-panel-glass p-6 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
             <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-4 border-b border-white/10 pb-2">Telemetry Anchor</div>
             <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="text-[12px] text-[#94a3b8] font-['Inter'] mb-2 block">Game PK</label>
                    <select 
                        value={gamePk} onChange={e => setGamePk(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white font-['Outfit'] text-[14px] px-4 py-3 rounded-xl outline-none focus:border-[#f59e0b] "
                    >
                        <option value="661619">661619 (Default/Offline)</option>
                        <option value="823644">823644 (Athletics @ Mets)</option>
                        {schedule.map(g => (
                            <option key={g.gamePk} value={g.gamePk}>{g.gamePk} - {g.teams.away.team.name} @ {g.teams.home.team.name}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-[12px] text-[#94a3b8] font-['Inter'] mb-2 flex justify-between">
                        <span>Sim Playback Speed</span>
                        <span className="text-[#f59e0b] font-bold">{playbackSpeed}x</span>
                    </label>
                    <input 
                        type="range" min="0.5" max="10" step="0.5" value={playbackSpeed} onChange={e => setPlaybackSpeed(e.target.value)}
                        className="w-full accent-[#f59e0b] h-1.5 rounded-full bg-black/50 appearance-none mt-3"
                    />
                 </div>
             </div>
          </div>

          <div className="vm-panel-glass p-6 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
             <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-4 border-b border-white/10 pb-2">Roster Matrix</div>
             <div className="grid grid-cols-4 gap-3 mt-4 h-[250px] overflow-y-auto custom-scrollbar">
                 {roster.sort((a,b)=>a.name.localeCompare(b.name)).map(p => {
                     const isActive = String(p.deployment_zone) === String(gamePk);
                     return (
                         <button key={p.sys_id} onClick={() => togglePersona(p.name, isActive)}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isActive ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]' : 'bg-black/20 border-white/10 text-[#64748b] hover:border-white/30'}`}>
                               <div className="font-['Outfit'] text-[12px] truncate max-w-[80%]">{p.name}</div>
                               <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? 'bg-[#10b981] ' : 'bg-white/10'}`}></div>
                         </button>
                     );
                 })}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
              <div className="vm-panel-glass p-6 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col">
                 <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-4 border-b border-white/10 pb-2 flex justify-between">
                     <span>Boggs Reactivity Baseline</span>
                     <span className="text-[#ef4444]">LEVEL {boggsLevel}</span>
                 </div>
                 <input 
                     type="range" min="1" max="5" value={boggsLevel} onChange={e => setBoggsLevel(e.target.value)}
                     className="w-full accent-[#ef4444] h-1.5 rounded-full bg-black/50 appearance-none mt-4"
                 />
              </div>

              <div className="vm-panel-glass p-6 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col">
                 <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-4 border-b border-white/10 pb-2">
                     Cadence Matrix
                 </div>
                 <div className="grid grid-cols-3 gap-2 mt-2">
                     {['Lurker', 'Balanced', 'Yapper'].map(pacing => (
                         <button key={pacing} onClick={() => setCadence(pacing)} className={`py-2 rounded-lg font-['Outfit'] text-[11px] font-bold uppercase tracking-wider transition-all border ${cadence === pacing ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#38bdf8] ' : 'bg-black/20 border-white/10 text-[#64748b] hover:border-white/30'}`}>
                             {pacing}
                         </button>
                     ))}
                 </div>
              </div>
          </div>

          <div className="vm-panel-glass p-6 flex-1 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col min-h-[200px]">
             <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-4 border-b border-white/10 pb-2 flex justify-between">
                 <span>Ambient Entropy</span>
                 <span className="text-white/30">fanstack_live_context.txt</span>
             </div>
             <textarea 
                  value={ambientEntropy} onChange={e => setAmbientEntropy(e.target.value)}
                  placeholder="INJECT CONTEXT PAYLOAD..."
                  className="flex-1 w-full bg-black/40 border border-white/10 text-white font-['Inter'] text-[13px] p-4 rounded-xl outline-none focus:border-[#f59e0b]  resize-none"
             />
          </div>
          
          <button onClick={executePreFlight} className="py-4 rounded-xl font-['Outfit'] text-[14px] font-bold uppercase tracking-[0.2em] bg-[#f59e0b]/10 border border-[#f59e0b]/50 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#0B0E14]  transition-all flex-shrink-0">
              Arm the Engine
          </button>
      </div>
      
      <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
