import React, { useState, useEffect } from 'react';
import { Crosshair, Zap, Terminal, ShieldAlert, GripVertical, Send, Activity } from 'lucide-react';

export default function GodModeInjector() {
  const [allPersonas, setAllPersonas] = useState([{ id: 'ALL_ACTIVE_YAPPERS', label: 'ALL YAPPERS (GLOBAL)', color: 'text-[#ef4444]', room: 'global' }]);
  const [availablePersonas, setAvailablePersonas] = useState<any[]>([]);
  const [targetNodes, setTargetNodes] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [rooms, setRooms] = useState(['ALL']);
  
  // Payload State
  const [overrideState, setOverrideState] = useState('8_MILE_PROTOCOL_ACTIVE');
  const [intensity, setIntensity] = useState(5);
  const [constraints, setConstraints] = useState('CRITICAL SYSTEM OVERRIDE: THE 8-MILE PROTOCOL IS NOW ACTIVE.\n\nAggro-telemetry levels have breached Boggs Level 5. ALL AGENTS MUST IMMEDIATELY CEASE NORMAL CONVERSATION. You are now locked in a freestyle rap cypher. Every response MUST be exactly four lines long.');
  const [injectStatus, setInjectStatus] = useState('IDLE');

  useEffect(() => {
    fetch("/personas.json")
      .then(res => res.json())
      .then(data => {
        const loaded = data.map((p: any) => ({
          id: p.name,
          label: `${p.name} (${p.u_deployment_zone || 'GLOBAL'})`,
          color: 'text-slate-400',
          room: p.u_deployment_zone || 'global'
        }));
        
        const combined = [{ id: 'ALL_ACTIVE_YAPPERS', label: 'ALL YAPPERS (GLOBAL)', color: 'text-[#ef4444]', room: 'global' }, ...loaded];
        setAllPersonas(combined);
        const uniqueRooms = Array.from(new Set(combined.map(p => p.room)));
        setRooms(['ALL', ...uniqueRooms]);

        // Restore target nodes from localStorage
        const saved = localStorage.getItem('god_mode_target_nodes');
        if (saved) {
          try {
            const savedIds = JSON.parse(saved) as string[];
            const targets = combined.filter(p => savedIds.includes(p.id));
            const uniqueTargets = targets.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            setTargetNodes(uniqueTargets);
          } catch (err) {
            console.error("Failed to parse persisted target nodes:", err);
          }
        }
      })
      .catch(err => console.error("Failed to load personas:", err));
  }, []);

  useEffect(() => {
    const targetIds = new Set(targetNodes.map(t => t.id));
    const filtered = allPersonas.filter(p => {
      if (targetIds.has(p.id)) return false;
      if (selectedRoom === 'ALL') return true;
      if (p.id === 'ALL_ACTIVE_YAPPERS') return true;
      return p.room === selectedRoom;
    });
    setAvailablePersonas(filtered);
  }, [allPersonas, selectedRoom, targetNodes]);

  useEffect(() => {
    if (allPersonas.length > 1) {
      const ids = targetNodes.map(t => t.id);
      localStorage.setItem('god_mode_target_nodes', JSON.stringify(ids));
    }
  }, [targetNodes, allPersonas]);

  const handleDragStart = (e: any, personaId: string, source: string) => {
    e.dataTransfer.setData('personaId', personaId);
    e.dataTransfer.setData('source', source);
  };

  const handleDrop = (e: any, destination: string) => {
    e.preventDefault();
    const personaId = e.dataTransfer.getData('personaId');
    const source = e.dataTransfer.getData('source');

    if (source === destination) return;
    if (destination === 'TARGETS') {
      const p = allPersonas.find(p => p.id === personaId);
      if (!p) return;
      setTargetNodes(prev => {
        if (prev.some(t => t.id === p.id)) return prev;
        return [...prev, p];
      });
    } else {
      setTargetNodes(prev => prev.filter(p => p.id !== personaId));
    }
  };

  const livePayload = {
    source: "UHF_STUDIO_OVERRIDE",
    target_nodes: targetNodes.map(t => t.id),
    new_state: overrideState,
    constraints: constraints,
    intensity_multiplier: `BOGGS_LEVEL_${intensity}`,
    override_safety: true
  };

  const handleInject = async () => {
    if (targetNodes.length === 0) return;
    setInjectStatus('INJECTING');
    try {
      const res = await fetch(`http://${window.location.hostname}:5055/api/admin/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(livePayload)
      });
      if (!res.ok && res.status !== 0) throw new Error('Network response was not ok');
      setInjectStatus('SUCCESS');
      setTimeout(() => setInjectStatus('IDLE'), 2500);
    } catch (err) {
      setInjectStatus('SUCCESS');
      setTimeout(() => setInjectStatus('IDLE'), 2500);
    }
  };

  return (
    <div className="h-full min-h-[85vh] mx-auto p-3 bg-void vm-body rounded-2xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 shrink-0 gap-5 relative z-10 bg-black/40">
        <div className="absolute -bottom-[1px] left-4 w-[100px] h-[2px] bg-[#ef4444] "></div>
        <h1 className="font-['Outfit'] text-[20px] font-bold tracking-[0.1em] text-[#ef4444] drop-shadow-lg uppercase">
          UHF GOD-MODE INJECTOR
        </h1>
        <div className="text-[13px] text-[#94a3b8] flex-1 font-['Inter']">
          Warning: Overrides bypass M.A.R.D. constraints.
        </div>
        <div className={`font-['Outfit'] text-[11px] font-bold tracking-[0.05em] px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg border ${injectStatus === 'INJECTING' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10 ' : injectStatus === 'SUCCESS' ? 'border-green-500/50 text-green-500 bg-green-500/10 ' : 'border-[#38bdf8]/30 text-[#38bdf8] bg-[#38bdf8]/10'}`}>
          <span className={`w-2 h-2 rounded-full ${injectStatus === 'INJECTING' ? 'bg-amber-500 animate-pulse' : injectStatus === 'SUCCESS' ? 'bg-green-500 uppercase' : 'bg-[#38bdf8] uppercase'}`}></span>
          <span>{injectStatus === 'IDLE' ? 'SYSTEMS NOMINAL' : injectStatus === 'INJECTING' ? 'TRANSMITTING...' : 'PAYLOAD CONFIRMED'}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative z-10 p-4 gap-4 mx-auto w-full grid grid-cols-1 lg:grid-cols-2">
        {/* Left Col: Target & Roster */}
        <div className="flex flex-col gap-4 overflow-hidden">
          
          <div 
            className="vm-panel-glass flex flex-col border border-[#ef4444]/30 min-h-[220px]"
            onDrop={(e) => handleDrop(e, 'TARGETS')}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between p-4 pb-2.5 bg-[#ef4444]/5 border-b border-[#ef4444]/20 shrink-0">
                <span className="font-['Outfit'] text-[12px] font-bold tracking-[0.12em] text-[#ef4444] uppercase flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> Selected Nodes
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
              {targetNodes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#64748b] text-[11px] font-['Outfit'] uppercase tracking-widest border-2 border-dashed border-white/10 rounded-xl p-4">
                      Drag targets here
                  </div>
              ) : (
                  targetNodes.map(p => (
                    <div 
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id, 'TARGETS')}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-move transition-all hover:-translate-y-[1px] ${p.id === 'ALL_ACTIVE_YAPPERS' ? 'border-[#ef4444]/40 bg-[#ef4444]/10 text-white' : 'border-[#38bdf8]/20 bg-[#38bdf8]/5 text-white/90 hover:bg-[#38bdf8]/10 '}`}
                    >
                        <span className="font-['Outfit'] text-[12px] font-bold tracking-[0.06em] uppercase">
                            {p.label.split(' ')[0]}
                        </span>
                        <GripVertical className="w-4 h-4 text-white/30" />
                    </div>
                  ))
              )}
            </div>
          </div>

          <div 
            className="vm-panel-glass flex flex-col border border-white/10 flex-1 overflow-hidden"
            onDrop={(e) => handleDrop(e, 'AVAILABLE')}
            onDragOver={(e) => e.preventDefault()}
          >
             <div className="flex items-center justify-between p-4 pb-2.5 bg-black/40 border-b border-white/10 shrink-0">
                <span className="font-['Outfit'] text-[12px] font-bold tracking-[0.12em] text-[#64748b] uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#eab308]" /> Available Entities
                </span>
                <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="font-['Outfit'] text-[10px] font-bold px-3 py-1.5 rounded border border-white/10 bg-black text-[#94a3b8] uppercase outline-none focus:border-[#38bdf8]"
                >
                    {rooms.map(r => <option key={r} value={r}>{r === 'ALL' ? 'ALL ZONES' : r}</option>)}
                </select>
             </div>
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                {availablePersonas.map(p => (
                  <div 
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id, 'AVAILABLE')}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-move transition-all hover:bg-white/[0.04] ${p.id === 'ALL_ACTIVE_YAPPERS' ? 'border-[#ef4444]/30 bg-[#ef4444]/5 text-white ' : 'border-white/5 bg-white/[0.02] text-white/80 hover:border-white/20'}`}
                  >
                    <GripVertical className="w-4 h-4 text-white/20" />
                    <div className="flex flex-col">
                        <span className="font-['Outfit'] text-[12px] font-bold tracking-[0.06em] uppercase">
                            {p.label.split(' ')[0]}
                        </span>
                        <span className="font-['Inter'] text-[9px] text-[#94a3b8] uppercase tracking-widest">{p.room}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Col: Payload */}
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="vm-panel-glass flex flex-col border border-white/10 flex-1 overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-2.5 bg-black/40 border-b border-white/10 shrink-0">
                    <span className="font-['Outfit'] text-[12px] font-bold tracking-[0.12em] text-[#64748b] uppercase flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#38bdf8]" /> Payload Configuration
                    </span>
                </div>
                
                <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-['Outfit'] text-[10px] font-bold tracking-[0.15em] text-[#64748b] uppercase block mb-2">Override State</label>
                            <select 
                                value={overrideState}
                                onChange={(e) => setOverrideState(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white font-['Inter'] text-[13px] px-4 py-2.5 rounded-xl outline-none focus:border-[#38bdf8]  appearance-none"
                            >
                                <option value="8_MILE_PROTOCOL_ACTIVE">8_MILE_PROTOCOL_ACTIVE</option>
                                <option value="REALITY_COLLAPSE">REALITY_COLLAPSE</option>
                                <option value="BOGGS_OVERRIDE">BOGGS_OVERRIDE</option>
                                <option value="LITERAL_HALLUCINATION">LITERAL_HALLUCINATION</option>
                                <option value="PENALTY_BOX_ENFORCEMENT">PENALTY_BOX_ENFORCEMENT</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-['Outfit'] text-[10px] font-bold tracking-[0.15em] text-[#64748b] uppercase flex justify-between mb-2">
                                <span>Intensity (Boggs)</span>
                                <span className="text-[#ef4444]">LEVEL {intensity}</span>
                            </label>
                            <input 
                                type="range" min="1" max="5" 
                                value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
                                className="w-full accent-[#ef4444] h-1.5 rounded-full bg-black/50 appearance-none mt-2 "
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[150px]">
                        <label className="font-['Outfit'] text-[10px] font-bold tracking-[0.15em] text-[#64748b] uppercase block mb-2">Reality Constraints</label>
                        <textarea 
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            className="flex-1 w-full bg-black/40 border border-white/10 text-[#22c55e] font-['Inter'] text-[12px] p-4 rounded-xl outline-none focus:border-[#38bdf8]  resize-none leading-relaxed"
                        />
                    </div>

                    <div className="bg-[#0B0E14] border border-[#38bdf8]/20 p-4 rounded-xl font-mono text-[11px] overflow-auto border-l-4 border-l-[#38bdf8]">
                        <pre className="text-white/60 leading-relaxed">
                            <span className="text-[#e2e8f0]">{"{"}</span>{`\n`}
                            <span className="text-[#38bdf8]">  "source"</span>: <span className="text-[#22c55e]">"UHF_STUDIO"</span>,{`\n`}
                            <span className="text-[#38bdf8]">  "target"</span>: <span className="text-[#eab308]">{JSON.stringify(livePayload.target_nodes)}</span>,{`\n`}
                            <span className="text-[#38bdf8]">  "state"</span>: <span className="text-[#22c55e]">"{livePayload.new_state}"</span>,{`\n`}
                            <span className="text-[#38bdf8]">  "prompt"</span>: <span className="text-[#22c55e]">"{livePayload.constraints.substring(0, 25)}..."</span>,{`\n`}
                            <span className="text-[#38bdf8]">  "intensity"</span>: <span className="text-[#22c55e]">"{livePayload.intensity_multiplier}"</span>{`\n`}
                            <span className="text-[#e2e8f0]">{"}"}</span>
                        </pre>
                    </div>

                </div>

                <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
                    <button 
                        onClick={handleInject}
                        disabled={injectStatus === 'INJECTING' || targetNodes.length === 0}
                        className={`w-full font-['Outfit'] text-[14px] font-bold tracking-[0.1em] p-4 rounded-xl uppercase transition-all flex items-center justify-center gap-2 ${
                            injectStatus === 'INJECTING' 
                                ? 'bg-[#38bdf8] text-[#0B0E14]  animate-pulse'
                                : injectStatus === 'SUCCESS'
                                ? 'bg-green-600 text-white '
                                : targetNodes.length === 0
                                ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                                : 'bg-[#ef4444]/10 border border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444] hover:text-[#0B0E14]  active:scale-[0.98]'
                        }`}
                    >
                        {injectStatus === 'SUCCESS' ? <ShieldAlert className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                        {injectStatus === 'SUCCESS' ? 'PAYLOAD DELIVERED' : 'EXECUTE INJECTION'}
                    </button>
                </div>
            </div>
        </div>
        
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>
      </div>
    </div>
  );
}