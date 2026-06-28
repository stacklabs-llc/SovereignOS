import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, Zap, Check, Search, Grid, List, RefreshCw, Play, Square, 
  ShieldAlert, Award, Star, Compass, UserCheck, Flame, Cpu, Layout, HelpCircle
} from 'lucide-react';

interface Persona {
  sys_id: string;
  user_name: string;
  team: string;
  deep_lore?: string;
  system_prompt?: string;
  behavior_notes?: string;
  governance?: string;
  color?: string;
}

interface Room {
  game_pk: string;
  away_team: string;
  home_team: string;
  game_date: string;
  game_time?: string;
  status: string;
  room_state: string;
  personas: string[];
}

interface RoomBuilderProps {
  activeGamedayPk: string | null;
  onSelectGame?: (gamePk: string) => void;
}

export default function RoomBuilder({ activeGamedayPk, onSelectGame }: RoomBuilderProps) {
  // Roster states
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [stagedPersonas, setStagedPersonas] = useState<string[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  // Today's games/rooms list
  const [games, setGames] = useState<Room[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Active game room details
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [roomGemini, setRoomGemini] = useState(0);
  const [roomLocal, setRoomLocal] = useState(0);
  const [roomSys, setRoomSys] = useState(0);

  // Filters and UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stackTab, setStackTab] = useState<'ALL' | 'SEATED' | 'SOCIETY' | 'SPORTS'>('ALL');
  const [filterQuery, setFilterQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch today's games / slates
  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const res = await fetch('/api/roll_call');
      if (res.ok) {
        const data = await res.json();
        if (data.games) {
          setGames(data.games);
          // If no activeGamedayPk is selected yet, or if it is not in the list, pre-select the first game
          if (data.games.length > 0) {
            const currentSelected = data.games.find((g: Room) => g.game_pk === activeGamedayPk);
            if (currentSelected) {
              setActiveRoom(currentSelected);
            } else if (!activeGamedayPk && onSelectGame) {
              onSelectGame(data.games[0].game_pk);
              setActiveRoom(data.games[0]);
            } else if (activeGamedayPk) {
              // Retrieve metadata for custom gamePk
              const matched = data.games.find((g: Room) => g.game_pk === activeGamedayPk);
              if (matched) setActiveRoom(matched);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load today's slates", e);
    } finally {
      setLoadingGames(false);
    }
  };

  // Fetch all available personas
  const fetchAllPersonas = async () => {
    setLoadingPersonas(true);
    try {
      const res = await fetch('/api/all_personas');
      if (res.ok) {
        const data = await res.json();
        if (data.personas) {
          const sorted = data.personas.sort((a: Persona, b: Persona) => 
            (a.team || '').localeCompare(b.team || '') || a.user_name.localeCompare(b.user_name)
          );
          setAllPersonas(sorted);
        }
      }
    } catch (e) {
      console.error("Failed to fetch all personas", e);
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Fetch specific room allocations and token counts
  const fetchRoomDetails = async (gamePk: string) => {
    try {
      const res = await fetch(`/api/room_personas?gamePk=${gamePk}`);
      if (res.ok) {
        const data = await res.json();
        if (data.personas) {
          const stripped = data.personas
            .filter((p: any) => typeof p === 'string')
            .map((p: string) => p.replace('@', '').toLowerCase());
          setStagedPersonas(stripped);
        }
        setRoomGemini(data.room_gemini_tokens || 0);
        setRoomLocal(data.room_local_tokens || 0);
        setRoomSys(data.room_sys_tokens || 0);
      }
    } catch (e) {
      console.error("Failed to fetch room personas", e);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchGames();
    fetchAllPersonas();
  }, []);

  // Update room data when activeGamedayPk changes
  useEffect(() => {
    if (activeGamedayPk) {
      fetchRoomDetails(activeGamedayPk);
      const matched = games.find(g => g.game_pk === activeGamedayPk);
      if (matched) {
        setActiveRoom(matched);
      } else if (games.length > 0) {
        // Fetch roll call details to refresh schedule lists
        fetch('/api/roll_call')
          .then(r => r.json())
          .then(data => {
            if (data.games) {
              setGames(data.games);
              const m = data.games.find((g: Room) => g.game_pk === activeGamedayPk);
              if (m) setActiveRoom(m);
            }
          });
      }
    }
  }, [activeGamedayPk]);

  // Seating check toggler
  const togglePersona = (userName: string) => {
    const key = userName.toLowerCase();
    setStagedPersonas(prev => 
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    );
  };

  // Bulk save seats
  const handleSavePersonas = async () => {
    if (!activeGamedayPk) return;
    setSaving(true);
    setSaveStatus("SAVING SEATS...");
    try {
      const res = await fetch('/api/save_room_personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamePk: activeGamedayPk, personas: stagedPersonas })
      });
      if (res.ok) {
        setSaveStatus("SUCCESSFULLY PROVISIONED!");
        setTimeout(() => setSaveStatus(null), 2500);
        fetchRoomDetails(activeGamedayPk);
        fetchGames(); // Refresh seating details in list
      } else {
        setSaveStatus("ERROR SAVING");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("ERROR CONNECTING");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Room State controls
  const handleRoomActivation = async (activate: boolean) => {
    if (!activeGamedayPk) return;
    const endpoint = activate ? '/api/room/activate' : '/api/room/deactivate';
    setSaving(true);
    setSaveStatus(activate ? "ACTIVATING ROOM..." : "DEACTIVATING ROOM...");
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_pk: activeGamedayPk })
      });
      if (res.ok) {
        setSaveStatus(activate ? "ROOM IS LIVE!" : "ROOM DEPLOYMENT BENCHED");
        setTimeout(() => setSaveStatus(null), 2500);
        fetchGames();
      } else {
        setSaveStatus("OPERATION FAILED");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("ERROR CONNECTING");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Filter computation
  const sportsTeams = ['NYM', 'MIA', 'ATL', 'PIT', 'NYJ', 'DAL', 'GB', 'UFL'];
  let filtered = allPersonas.filter(p => {
    const matchSearch = p.user_name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                        (p.team || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
                        (p.system_prompt || '').toLowerCase().includes(filterQuery.toLowerCase());
    
    if (!matchSearch) return false;

    const isSeated = stagedPersonas.includes(p.user_name.toLowerCase());
    const isSports = sportsTeams.includes((p.team || '').toUpperCase());

    if (stackTab === 'SEATED') return isSeated;
    if (stackTab === 'SPORTS') return isSports;
    if (stackTab === 'SOCIETY') return !isSports;
    return true;
  });

  // Sort: Seated first, then team, then alphabetical
  filtered = [...filtered].sort((a, b) => {
    const aSel = stagedPersonas.includes(a.user_name.toLowerCase());
    const bSel = stagedPersonas.includes(b.user_name.toLowerCase());
    if (aSel && !bSel) return -1;
    if (!aSel && bSel) return 1;
    return (a.team || '').localeCompare(b.team || '') || a.user_name.localeCompare(b.user_name);
  });

  return (
    <div className="room-builder-viewport w-full h-full flex flex-row min-h-0 text-gray-200 bg-[#06080b] font-mono p-4 gap-4 relative overflow-hidden">
      
      {/* SIDEBAR: TODAY'S SLATES */}
      <div className="w-[22%] shrink-0 flex flex-col bg-[#0b0e14]/90 border border-white/10 rounded-xl p-3 backdrop-blur-md relative z-10 min-h-0">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
          <h3 className="text-xs font-black text-[#38bdf8] uppercase tracking-[0.15em] flex items-center gap-1.5">
            📅 Today's Slates
          </h3>
          <button 
            onClick={fetchGames} 
            disabled={loadingGames}
            className="text-gray-400 hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={loadingGames ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
          {loadingGames && games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RefreshCw size={20} className="animate-spin text-[#38bdf8]" />
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">Loading...</span>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-[10px] border border-dashed border-white/5 rounded-lg">
              NO GAMES TODAY
            </div>
          ) : (
            games.map(game => {
              const isActive = game.game_pk === activeGamedayPk;
              return (
                <div
                  key={game.game_pk}
                  onClick={() => onSelectGame && onSelectGame(game.game_pk)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8]/60 shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                      GPK {game.game_pk}
                    </span>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                      game.room_state === 'active' 
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 animate-pulse'
                        : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    }`}>
                      {game.room_state || 'staged'}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs tracking-wide uppercase flex items-center justify-between mb-0.5 font-display">
                    <span>{game.away_team} @ {game.home_team}</span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1 font-mono">
                    <span>{game.status}</span>
                    <span className="flex items-center gap-0.5 text-gray-500">
                      👤 {game.personas?.length || 0} seated
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN DASHBOARD */}
      <div className="w-[78%] shrink-0 flex flex-col bg-[#0b0e14]/90 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 min-h-0">
        
        {/* Compressed Active game header info */}
        <div className="flex flex-row items-center justify-between h-12 px-4 border-b border-slate-800 bg-slate-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-white tracking-widest uppercase font-mono">
              👑 ROOM BUILDER
            </h2>
            {activeRoom && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest ${
                activeRoom.room_state === 'active'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-amber-500 text-amber-400 bg-amber-500/10'
              }`}>
                {activeRoom.room_state === 'active' ? 'CROSSTALK ACTIVE' : 'STAGED'}
              </span>
            )}
            {activeRoom && (
              <span className="text-[#38bdf8] font-bold text-xs uppercase tracking-wider">
                {activeRoom.away_team} @ {activeRoom.home_team} (GPK {activeRoom.game_pk})
              </span>
            )}
          </div>

          {/* TELEMETRY STATS BANNER */}
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <div>
              <span className="text-gray-500 mr-1.5 uppercase">GEMINI:</span>
              <span className="font-bold text-[#38bdf8]">{roomGemini.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div>
              <span className="text-gray-500 mr-1.5 uppercase">LOCAL:</span>
              <span className="font-bold text-gray-400">{roomLocal.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div>
              <span className="text-gray-500 mr-1.5 uppercase">BOUNCER:</span>
              <span className="font-bold text-amber-400">{roomSys.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Controls & Search Realignment */}
        <div className="flex flex-row items-center justify-between gap-3 p-3 bg-slate-950 shrink-0 border-b border-slate-800">
          {/* Roster Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'All Roster' },
              { id: 'SEATED', label: '⚡ Seated' },
              { id: 'SOCIETY', label: '🏢 Seeded Stacks' },
              { id: 'SPORTS', label: '⚾ MLB Teams' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStackTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase border whitespace-nowrap shrink-0 transition-all font-mono ${
                  stackTab === tab.id
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]/60 text-[#38bdf8]'
                    : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggles & Search */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
              <input
                type="text"
                placeholder="Search personas..."
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder:text-gray-600 font-mono text-[10px] outline-none focus:border-[#38bdf8]/50 transition-colors"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-black/60 border border-white/10 p-0.5 rounded-lg gap-0.5 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-[#38bdf8]/15 text-[#38bdf8]' : 'text-gray-500 hover:text-white'
                }`}
              >
                <List size={12} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-[#38bdf8]/15 text-[#38bdf8]' : 'text-gray-500 hover:text-white'
                }`}
              >
                <Grid size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Personas Selection Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#040609] min-h-0 custom-scrollbar">
          {loadingPersonas && allPersonas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={24} className="animate-spin text-[#38bdf8] opacity-60" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Synchronizing Persona Matrix...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-xl">
              <Users size={24} className="text-gray-600 mb-2" />
              <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">No matching personas found</p>
            </div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="flex flex-col">
              {filtered.map(p => {
                const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                const imgSrc = `/api/persona_image/${p.user_name}`;
                
                return (
                  <div
                    key={p.sys_id || p.user_name}
                    onClick={() => togglePersona(p.user_name)}
                    className={`flex items-center justify-between p-2 border-b border-slate-800/80 rounded-none cursor-pointer transition-all bg-transparent hover:bg-white/[0.02] last:border-b-0`}
                    style={isSelected ? { borderLeftColor: p.color || '#38bdf8', borderLeftWidth: '3px' } : {}}
                  >
                    {/* Left: Checkbox, Avatar, Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                        isSelected ? 'bg-[#38bdf8] border-[#38bdf8] text-black font-black' : 'border-white/20 bg-black/40'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={4} />}
                      </div>

                      <img 
                        src={imgSrc} 
                        className="w-7 h-7 rounded-full object-cover border bg-black shrink-0"
                        style={{ borderColor: p.color || '#38bdf8' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                        }}
                      />

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs font-display tracking-wider uppercase truncate">
                            {p.user_name}
                          </span>
                          {isSelected && (
                            <span className="text-[7px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-gray-500 font-mono mt-0.5 truncate uppercase">
                          SYS PROMPT: {p.system_prompt || 'advocate'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Team Tag */}
                    <div className="flex-shrink-0">
                      <span 
                        className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded border uppercase tracking-widest"
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
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {filtered.map(p => {
                const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                const imgSrc = `/api/persona_image/${p.user_name}`;

                return (
                  <div
                    key={p.sys_id || p.user_name}
                    onClick={() => togglePersona(p.user_name)}
                    className={`flex flex-col p-2.5 rounded-lg cursor-pointer transition-all border gap-2 ${
                      isSelected 
                        ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 shadow-inner' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                    style={isSelected ? { borderLeftColor: p.color || '#38bdf8', borderLeftWidth: '3px' } : {}}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={imgSrc} 
                        className="w-9 h-9 rounded-full object-cover border bg-black shrink-0"
                        style={{ borderColor: p.color || '#38bdf8' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                        }}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-bold text-white text-[10px] truncate font-display tracking-widest uppercase">
                          {p.user_name}
                        </span>
                        <span 
                          className="text-[7px] font-mono font-black mt-0.5 px-1.5 py-0.5 rounded border self-start uppercase tracking-widest"
                          style={{ 
                            color: p.color || '#3b82f6', 
                            borderColor: `${p.color || '#3b82f6'}30`,
                            backgroundColor: `${p.color || '#3b82f6'}08`
                          }}
                        >
                          {p.team}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                        isSelected ? 'bg-[#38bdf8] border-[#38bdf8] text-black font-bold' : 'border-white/20 bg-black/40'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={4} />}
                      </div>
                    </div>
                    {p.behavior_notes && (
                      <div className="text-[8px] text-gray-500 font-mono border-t border-white/5 pt-1.5 leading-relaxed truncate">
                        Behavior: {p.behavior_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer / Action Bar */}
        <div className="p-3.5 border-t border-white/10 bg-[#07090d] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              Total Seated Personas: <span className="text-[#38bdf8] font-bold">{stagedPersonas.length}</span>
            </span>
            {saveStatus && (
              <span className="text-[#38bdf8] font-black text-[9px] mt-0.5 uppercase tracking-widest animate-pulse font-mono">
                ⚡ {saveStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Deploy controls */}
            {activeRoom && (
              <>
                {activeRoom.room_state === 'active' ? (
                  <button
                    onClick={() => handleRoomActivation(false)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-bold uppercase tracking-widest text-[10px] font-mono transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Square size={10} fill="currentColor" /> Bench Room
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoomActivation(true)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold uppercase tracking-widest text-[10px] font-mono transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play size={10} fill="currentColor" /> Deploy Room
                  </button>
                )}
              </>
            )}

            <button 
              onClick={handleSavePersonas} 
              disabled={saving || !activeGamedayPk}
              className="px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black uppercase tracking-widest text-[10px] font-mono transition-all hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95 disabled:opacity-50"
            >
              Save & Re-provision Room
            </button>
          </div>
        </div>

      </div>

      {/* Grid Pattern BG */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}
