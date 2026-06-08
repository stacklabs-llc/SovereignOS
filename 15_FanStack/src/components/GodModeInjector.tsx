import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  Zap, 
  Terminal, 
  ShieldAlert, 
  GripVertical, 
  Send, 
  Activity, 
  Search, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Sliders, 
  User, 
  Users, 
  Radio, 
  Layers 
} from 'lucide-react';
import avatarMap from '../avatarMap';

export default function GodModeInjector() {
  const [activeTab, setActiveTab] = useState<'puppeteer' | 'overrides'>('puppeteer');
  const [personas, setPersonas] = useState<any[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStack, setSelectedStack] = useState('ALL');
  
  // Speech Composition State
  const [speechText, setSpeechText] = useState('');
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [targetGamePk, setTargetGamePk] = useState('GLOBAL');
  const [enableTts, setEnableTts] = useState(true);
  const [speechStatus, setSpeechStatus] = useState<'IDLE' | 'TRANSMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [speechError, setSpeechError] = useState('');

  // Overrides Tab State (original functionality preserved)
  const [allPersonas, setAllPersonas] = useState([{ id: 'ALL_ACTIVE_YAPPERS', label: 'ALL YAPPERS (GLOBAL)', color: 'text-[#ef4444]', room: 'global' }]);
  const [availablePersonas, setAvailablePersonas] = useState<any[]>([]);
  const [targetNodes, setTargetNodes] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [rooms, setRooms] = useState(['ALL']);
  const [overrideState, setOverrideState] = useState('8_MILE_PROTOCOL_ACTIVE');
  const [intensity, setIntensity] = useState(5);
  const [constraints, setConstraints] = useState('CRITICAL SYSTEM OVERRIDE: THE 8-MILE PROTOCOL IS NOW ACTIVE.\n\nAggro-telemetry levels have breached Boggs Level 5. ALL AGENTS MUST IMMEDIATELY CEASE NORMAL CONVERSATION. You are now locked in a freestyle rap cypher. Every response MUST be exactly four lines long.');
  const [injectStatus, setInjectStatus] = useState('IDLE');

  // Load active games and personas
  useEffect(() => {
    // Load all active games for target room selection
    fetch("/api/roll_call")
      .then(res => res.json())
      .then(data => {
        if (data.games) {
          setActiveGames(data.games);
          // Set first active game as default if available
          if (data.games.length > 0) {
            setTargetGamePk(data.games[0].game_pk);
          }
        }
      })
      .catch(err => console.error("Failed to load active games:", err));

    // Load all dynamic yappers from the database
    fetch("/api/all_personas")
      .then(res => res.json())
      .then(data => {
        if (data.personas) {
          setPersonas(data.personas);
          setFilteredPersonas(data.personas);
          // Set first persona as default selected
          if (data.personas.length > 0) {
            setSelectedPersona(data.personas[0]);
          }

          // Format for original drag-and-drop overrides
          const loaded = data.personas.map((p: any) => ({
            id: p.user_name,
            label: `${p.user_name} (${p.team || 'GLOBAL'})`,
            color: 'text-slate-400',
            room: p.team || 'global'
          }));
          const combined = [{ id: 'ALL_ACTIVE_YAPPERS', label: 'ALL YAPPERS (GLOBAL)', color: 'text-[#ef4444]', room: 'global' }, ...loaded];
          setAllPersonas(combined);
          const uniqueRooms = Array.from(new Set(combined.map(p => p.room)));
          setRooms(['ALL', ...uniqueRooms]);
        }
      })
      .catch(err => console.error("Error loading personas:", err));
  }, []);

  // Filter roster dynamically
  useEffect(() => {
    let result = personas;

    // Filter by Stack category
    if (selectedStack !== 'ALL') {
      if (selectedStack === 'SPORTS') {
        const sportsTeams = ['NYM', 'MIA', 'ATL', 'PIT', 'NYJ', 'DAL', 'GB', 'UFL'];
        result = result.filter(p => sportsTeams.includes(p.team?.toUpperCase() || ''));
      } else if (selectedStack === 'OTHERS') {
        const primaryStacks = ['WEEDSTACK', 'AETHERVET', 'ANVILANDTWINE', 'SMYRNAPAWSPROVISIONS'];
        const sportsTeams = ['NYM', 'MIA', 'ATL', 'PIT', 'NYJ', 'DAL', 'GB', 'UFL'];
        result = result.filter(p => 
          !primaryStacks.includes(p.team?.toUpperCase() || '') && 
          !sportsTeams.includes(p.team?.toUpperCase() || '')
        );
      } else {
        result = result.filter(p => (p.team || '').toUpperCase() === selectedStack);
      }
    }

    // Filter by text search
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.user_name.toLowerCase().includes(q) || 
        (p.system_prompt || '').toLowerCase().includes(q) || 
        (p.team || '').toLowerCase().includes(q)
      );
    }

    setFilteredPersonas(result);
  }, [searchTerm, selectedStack, personas]);

  // Original Drag & Drop logic
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
      const p = availablePersonas.find(p => p.id === personaId);
      if (!p) return;
      setAvailablePersonas(prev => prev.filter(p => p.id !== personaId));
      setTargetNodes(prev => [...prev, p]);
    } else {
      const p = targetNodes.find(p => p.id === personaId);
      if (!p) return;
      setTargetNodes(prev => prev.filter(p => p.id !== personaId));
      setAvailablePersonas(prev => [...prev, p]);
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

  // Master Puppeteer: Direct speech injection
  const handleTransmitSpeech = async () => {
    if (!selectedPersona) {
      setSpeechError("No persona selected.");
      return;
    }
    if (!speechText.trim()) {
      setSpeechError("Please compose a speech message.");
      return;
    }

    setSpeechStatus('TRANSMITTING');
    setSpeechError('');

    try {
      const res = await fetch(`/api/chat/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: selectedPersona.user_name,
          text: speechText,
          target_game_pk: targetGamePk,
          channel: enableTts ? 'vocal_matrix' : 'system_broadcast',
          color: selectedPersona.color || '#3b82f6'
        })
      });

      if (!res.ok) throw new Error("Failed to inject chat message");
      
      setSpeechStatus('SUCCESS');
      setSpeechText(''); // Clear speech on success
      setTimeout(() => setSpeechStatus('IDLE'), 2000);
    } catch (err: any) {
      console.error(err);
      setSpeechStatus('ERROR');
      setSpeechError(err.message || "Failed to transmit message.");
      setTimeout(() => setSpeechStatus('IDLE'), 4000);
    }
  };

  const STACKS = [
    { id: 'ALL', name: 'All Stacks' },
    { id: 'WEEDSTACK', name: 'WeedStack' },
    { id: 'AETHERVET', name: 'AetherVet' },
    { id: 'ANVILANDTWINE', name: 'Anvil & Twine' },
    { id: 'SMYRNAPAWSPROVISIONS', name: 'Smyrna Paws' },
    { id: 'SPORTS', name: 'Athletics / MLB' },
    { id: 'OTHERS', name: 'Other Stacks' }
  ];

  return (
    <div className="h-full min-h-[85vh] mx-auto p-4 bg-void vm-body rounded-3xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
      {/* Dynamic Grid Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 gap-4 relative z-10 bg-black/40 backdrop-blur-md rounded-t-3xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-lg animate-pulse">👑</div>
          <div className="flex flex-col">
            <h1 className="font-['Outfit'] text-[22px] font-black tracking-widest text-[#ef4444] drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] uppercase">
              Catnip Wars God Mode
            </h1>
            <p className="text-[11px] text-[#94a3b8] tracking-wider uppercase font-mono mt-0.5">High-Privilege Room Puppeteer Registry</p>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex bg-black/60 border border-white/10 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('puppeteer')}
            className={`px-5 py-2.5 rounded-xl font-['Outfit'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'puppeteer'
                ? 'bg-gradient-to-r from-red-600/30 to-[#ef4444]/30 border border-[#ef4444]/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Radio className="w-4 h-4 text-[#ef4444]" /> LIVE SPEECH INJECTOR
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-5 py-2.5 rounded-xl font-['Outfit'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'overrides'
                ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/30 border border-amber-500/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" /> REALITY OVERRIDES
          </button>
        </div>
      </div>

      {activeTab === 'puppeteer' ? (
        /* ==================== TAB 1: MASTER SPEECH INJECTOR ==================== */
        <div className="flex-1 min-h-0 relative z-10 p-6 flex flex-col lg:flex-row gap-6 w-full overflow-hidden">
          
          {/* Left Pane: searchable categorizable roster grid */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden border border-white/5 rounded-3xl bg-black/30 p-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 shadow-inner">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter yappers by name or prompt constraints..."
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-600 font-mono text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Stack Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {STACKS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStack(tab.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap shrink-0 transition-all font-mono ${
                      selectedStack === tab.id
                        ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Roster Grid list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              {filteredPersonas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No active personas match filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredPersonas.map(p => {
                    const isSelected = selectedPersona?.sys_id === p.sys_id;
                    const imgSrc = avatarMap[p.user_name.toLowerCase()] || `/api/persona_image/${p.user_name}`;

                    return (
                      <div
                        key={p.sys_id}
                        onClick={() => setSelectedPersona(p)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center gap-4 relative group ${
                          isSelected
                            ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                        style={isSelected ? { borderLeftColor: p.color || '#3b82f6', borderLeftWidth: '3px' } : {}}
                      >
                        {/* Avatar Frame */}
                        <div className="relative">
                          <img
                            src={imgSrc}
                            className="w-10 h-10 rounded-full object-cover border-2 border-transparent"
                            style={{ borderColor: p.color || '#3b82f6' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0B0E14] bg-green-500"></div>
                        </div>

                        {/* Text Metadata */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="font-bold text-white text-xs truncate uppercase tracking-wider font-display">
                            {p.user_name}
                          </span>
                          <span 
                            className="text-[9px] font-mono font-black mt-0.5 px-2 py-0.5 rounded border self-start uppercase tracking-widest"
                            style={{ 
                              color: p.color || '#3b82f6', 
                              borderColor: `${p.color || '#3b82f6'}30`,
                              backgroundColor: `${p.color || '#3b82f6'}08`
                            }}
                          >
                            {p.team || 'GLOBAL'}
                          </span>
                        </div>
                        
                        {/* Subtle selection status */}
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Composition and preview desk */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4 overflow-hidden border border-white/5 rounded-3xl bg-black/30 p-4">
            
            {/* Active Puppet Preview Card */}
            <div className="bg-[#111827]/70 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
              
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Active Puppet Profile
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>

              {selectedPersona ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarMap[selectedPersona.user_name.toLowerCase()] || `/api/persona_image/${selectedPersona.user_name}`}
                      className="w-12 h-12 rounded-full object-cover border-2"
                      style={{ borderColor: selectedPersona.color || '#3b82f6' }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-black text-white text-base tracking-wider uppercase truncate">
                        {selectedPersona.user_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5 truncate uppercase">
                        Role: {selectedPersona.system_prompt || 'Standard Advocate'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Lore excerpt */}
                  <div className="bg-black/50 border border-white/5 p-3 rounded-xl max-h-[100px] overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed text-gray-400">
                    <p className="font-bold text-gray-300 uppercase tracking-wider text-[8px] mb-1">Deep Lore Matrix:</p>
                    {selectedPersona.deep_lore || "No telemetry records stored in sovereign_now.db."}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 font-mono text-xs uppercase tracking-widest">Select a yapper first</p>
              )}
            </div>

            {/* Target Room Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Target Broadcast Room</label>
              <select
                value={targetGamePk}
                onChange={e => setTargetGamePk(e.target.value)}
                className="w-full bg-black/60 border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-2xl outline-none focus:border-[#3b82f6] shadow-inner"
              >
                <option value="GLOBAL">🌎 GLOBAL CHAT ROOM</option>
                {activeGames.map(g => (
                  <option key={g.game_pk} value={g.game_pk}>
                    ⚾ Game {g.game_pk} ({g.away} @ {g.home}) - {g.room_state.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* TTS Vocal Matrix Switch */}
            <div className="flex items-center justify-between bg-[#111827]/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white tracking-wide font-display flex items-center gap-1.5">
                  {enableTts ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                  VOCAL MATRIX TTS LINK
                </span>
                <span className="text-[9px] font-mono text-gray-400">Route through dual-channel synthesis voice</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableTts}
                  onChange={e => setEnableTts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* Speech Composition Area */}
            <div className="flex-1 flex flex-col min-h-[160px] gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Speech Payload</label>
                <span className="text-[9px] font-mono text-gray-500">{speechText.length} chars</span>
              </div>
              <textarea
                value={speechText}
                onChange={e => setSpeechText(e.target.value)}
                placeholder={`Composing live broadcast takes as ${selectedPersona?.user_name || 'yapper'}...`}
                className="flex-1 w-full bg-black/60 border border-white/10 text-white font-mono text-xs p-4 rounded-2xl outline-none focus:border-[#3b82f6] resize-none leading-relaxed shadow-inner"
              />
            </div>

            {/* Real-Time Speech Bubble Preview */}
            {selectedPersona && speechText.trim() !== '' && (
              <div className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl flex flex-col gap-2 shrink-0 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: selectedPersona.color || '#3b82f6' }}></div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-black">Live Bubble Preview</span>
                  <span className="text-[8px] font-mono text-slate-400" style={{ color: selectedPersona.color || '#3b82f6' }}>{selectedPersona.user_name}</span>
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-gray-300 break-words pl-2">
                  "{speechText}"
                </p>
              </div>
            )}

            {speechError && (
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-xl font-mono text-[9px] text-red-400">
                ❌ {speechError}
              </div>
            )}

            {/* Action buttons */}
            <button
              onClick={handleTransmitSpeech}
              disabled={speechStatus === 'TRANSMITTING' || !speechText.trim() || !selectedPersona}
              className={`w-full font-['Outfit'] text-xs font-black tracking-widest p-4 rounded-2xl uppercase transition-all flex items-center justify-center gap-2.5 ${
                speechStatus === 'TRANSMITTING'
                  ? 'bg-cyan-500 text-black animate-pulse'
                  : speechStatus === 'SUCCESS'
                  ? 'bg-green-600 text-white'
                  : !speechText.trim() || !selectedPersona
                  ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5 font-mono'
                  : 'bg-gradient-to-r from-red-600 to-[#ef4444] text-white hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {speechStatus === 'SUCCESS' ? <ShieldAlert className="w-4 h-4" /> : <Send className="w-4 h-4 animate-bounce" />}
              {speechStatus === 'TRANSMITTING' 
                ? 'TRANSMITTING SPEECH CHANNELS...' 
                : speechStatus === 'SUCCESS'
                ? 'SPEECH INJECTED SUCCESSFULLY'
                : `BROADCAST AS ${selectedPersona?.user_name?.toUpperCase() || 'PUPPET'}`}
            </button>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: OVERRIDES (Original drag and drop) ==================== */
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
                      <Crosshair className="w-4 h-4" /> Selected Target Nodes
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
        </div>
      )}
      
      <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}