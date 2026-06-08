import React, { useState, useEffect, useRef } from 'react';
import { getWsUrl } from '../api-host';
import { useAuth } from '../contexts/AuthContext';
import { Flame, ShieldAlert, Wifi, Send, AlertTriangle, Layers, Radio, ToggleLeft, ToggleRight, Plus, Users, ShieldCheck, Heart } from 'lucide-react';

const avatarFallbacks: { [key: string]: string } = {
  dr_terp: '🔬',
  terp_truther: '🕵️',
  couch_lock_carl: '🛋️',
  dispensary_gary: '💼',
  '420_linda': '📚',
  old_growth_pete: '🌲',
  dab_lab_derek: '⚗️',
  compliance_karen: '📋',
  bt4991_believer: '🛸',
  pilot: '⬡',
  system: '🤖'
};

const colorMap: { [key: string]: string } = {
  dr_terp: '#00c878',
  terp_truther: '#ef4444',
  couch_lock_carl: '#6b7280',
  dispensary_gary: '#f59e0b',
  '420_linda': '#ec4899',
  old_growth_pete: '#78716c',
  dab_lab_derek: '#8b5cf6',
  compliance_karen: '#f97316',
  bt4991_believer: '#f59e0b',
  pilot: '#10b981',
  system: '#6b7280'
};

export default function FanStackRoom() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'matrix'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [penaltyBoxUsers, setPenaltyBoxUsers] = useState<string[]>([]);
  const [burnCounts, setBurnCounts] = useState<{ [key: string]: number }>({});
  
  // Matrix state
  const [sources, setSources] = useState<any[]>([]);
  const [factions, setFactions] = useState<any[]>([]);
  const [factionMembers, setFactionMembers] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [injecting, setInjecting] = useState(false);
  
  // Custom manual inject fields
  const [customHeadline, setCustomHeadline] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customTags, setCustomTags] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let reconnectTimeout: any;
    
    const connectWs = () => {
      const socket = new WebSocket(getWsUrl('/ws'));

      socket.onopen = () => {
        console.log("Connected to M.A.R.D. Relay for WeedStack Community Room");
        socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: "WEEDSTACK_SIM_001" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "CHAT_HISTORY") {
            const history = data.messages
              .filter((m: any) => m.type !== "SYS_LOG")
              .map((m: any) => ({
                id: m.id || (Date.now() + '-' + Math.random()),
                user: m.user,
                text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text),
                color: m.color || colorMap[m.user.toLowerCase()] || '#10b981',
                isSystem: m.user === 'SYSTEM' || m.user.includes('System')
              }));
            setMessages([...history]);
          } else if (data.type === "CHAT_MESSAGE") {
            const textLower = String(data.text).toLowerCase();
            
            if (data.user === 'SYSTEM') {
              if (textLower.includes('banned')) {
                const match = data.text.match(/\[PENALTY BOX\]\s+(\w+)\s+has/i);
                if (match) {
                  const bannedUser = match[1].toLowerCase();
                  setPenaltyBoxUsers(prev => prev.includes(bannedUser) ? prev : [...prev, bannedUser]);
                }
              } else if (textLower.includes('escaped')) {
                const match = data.text.match(/\[PENALTY BOX\]\s+(\w+)\s+successfully/i);
                if (match) {
                  const escapedUser = match[1].toLowerCase();
                  setPenaltyBoxUsers(prev => prev.filter(u => u !== escapedUser));
                }
              } else if (textLower.includes('burn badge')) {
                const match = data.text.match(/🔥\s+(\w+)\s+awarded/i);
                if (match) {
                  const burnedUser = match[1].toLowerCase();
                  setBurnCounts(prev => ({ ...prev, [burnedUser]: (prev[burnedUser] || 0) + 1 }));
                }
              }
            }

            setMessages(prev => {
              const incomingText = typeof data.text === 'string' ? data.text : JSON.stringify(data.text);
              if (prev.some(m => m.user === data.user && m.text === incomingText)) {
                return prev;
              }
              return [...prev, {
                id: data.id || (Date.now() + '-' + Math.random()),
                user: data.user,
                text: incomingText,
                color: data.color || colorMap[data.user.toLowerCase()] || '#10b981',
                isSystem: data.user === 'SYSTEM' || data.user.includes('System')
              }];
            });
          }
        } catch (e) {
          console.error("WebSocket message error:", e);
        }
      };

      socket.onclose = () => {
        console.log("Disconnected from relay, retrying in 3s...");
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      wsRef.current = socket;
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const fetchMatrixData = async () => {
    setLoadingMatrix(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const resSources = await fetch('/api/weedstack/sources', { headers });
      if (resSources.ok) {
        const data = await resSources.json();
        setSources(data);
      }
      
      const resFactions = await fetch('/api/weedstack/factions', { headers });
      if (resFactions.ok) {
        const data = await resFactions.json();
        setFactions(data.factions || []);
        setFactionMembers(data.members || []);
      }
    } catch (err) {
      console.error("Failed to fetch matrix data:", err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matrix') {
      fetchMatrixData();
    }
  }, [activeTab]);

  const handleToggleSource = async (sourceKey: string, currentEnabled: boolean) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/weedstack/sources/${sourceKey}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      if (res.ok) {
        fetchMatrixData();
      } else {
        const errData = await res.json();
        alert(`Failed to toggle source: ${errData.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error("Error toggling source:", err);
    }
  };

  const handleManualInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHeadline.trim() || !customContent.trim()) return;
    setInjecting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/weedstack/inject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headline: customHeadline.trim(),
          content: customContent.trim(),
          tags: customTags.trim()
        })
      });
      if (res.ok) {
        setCustomHeadline('');
        setCustomContent('');
        setCustomTags('');
        alert("Custom event successfully queued for room injection!");
        fetchMatrixData();
      } else {
        const errData = await res.json();
        alert(`Failed to inject: ${errData.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error("Error injecting event:", err);
    } finally {
      setInjecting(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: "CHAT_MESSAGE",
      room: "WEEDSTACK_SIM_001",
      user: auth?.display_name || auth?.user_name || 'Pilot',
      text: inputValue.trim(),
      color: '#10b981',
      model_engine: 'Manual Entry'
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputValue('');
  };

  const isPilot = auth?.role === 'pilot' || auth?.role === 'admin';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0B0E14] text-white overflow-hidden font-mono">
      {/* LEFT COLUMN: ADVOCATE STATUS ROSTER */}
      <div className="w-80 border-r border-[#10b981]/20 bg-[#0F131A] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none">
        <div className="border border-[#10b981]/30 rounded-xl p-4 bg-[#10b981]/5 shadow-inner">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#10b981] mb-3 flex items-center gap-2 border-b border-[#10b981]/20 pb-1.5">
            🌿 Advocate Registry ({Object.keys(avatarFallbacks).filter(k => k !== 'pilot' && k !== 'system').length})
          </h2>
          <div className="flex flex-col gap-2.5">
            {Object.keys(avatarFallbacks)
              .filter(k => k !== 'pilot' && k !== 'system')
              .map((userKey) => {
                const b = penaltyBoxUsers.includes(userKey);
                const burns = burnCounts[userKey] || 0;
                const display = userKey.replace(/_/g, ' ').toUpperCase();
                return (
                  <div key={userKey} className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm select-none">{avatarFallbacks[userKey]}</span>
                      <span className="font-bold tracking-wide" style={{ color: colorMap[userKey] }}>
                        {display}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {burns > 0 && (
                        <span className="flex items-center text-[8px] text-amber-400 font-bold bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20">
                          <Flame className="w-2.5 h-2.5 fill-amber-400 mr-0.5" /> {burns}
                        </span>
                      )}
                      {b ? (
                        <span className="flex items-center text-[8px] text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded border border-red-500/20">
                          <ShieldAlert className="w-2.5 h-2.5 mr-0.5" /> 8-MILE
                        </span>
                      ) : (
                        <span className="text-[8px] text-[#10b981] font-bold bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* PERSISTENT LIVE RE-ROUTED EVENT DISPLAY */}
        <div className="flex-1 flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-2 border-b border-amber-500/20 pb-1.5">
            📡 Live Ambient Intel
          </h2>
          <div className="flex flex-col gap-2.5">
            <div className="border border-white/5 rounded-lg p-3 bg-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  SYS
                </span>
                <span className="text-[7px] text-white/30">M.A.R.D ENGINE</span>
              </div>
              <h3 className="text-[11px] font-bold text-white/90 mb-1">Decoupled Stack Proof-of-Concept</h3>
              <p className="text-[9px] text-white/50 leading-relaxed">
                This room runs dynamically based on the toggled feeds within the Content Source Matrix.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: TABBED FEED / CONTAINER */}
      <div className="flex-1 flex flex-col bg-[#0F131A] relative">
        {/* ROOM TOP HEADER & TABS BAR */}
        <div className="h-16 border-b border-[#10b981]/20 px-6 flex items-center justify-between bg-[#0B0E14] select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <h1 className="text-sm font-bold tracking-wider">
              WEEDSTACK COMMUNITY [WEEDSTACK_SIM_001]
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* THE TABS CONTROL */}
            <div className="flex gap-1.5 bg-[#0F131A] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-[#10b981] text-[#0B0E14] shadow-md shadow-[#10b981]/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio className="w-3.5 h-3.5" /> Chat Feed
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'bg-[#10b981] text-[#0B0E14] shadow-md shadow-[#10b981]/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Content Matrix
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 border border-[#10b981]/30 px-3 py-1 rounded bg-[#10b981]/5 text-[9px] text-[#10b981] font-bold tracking-widest uppercase">
              <Wifi className="w-3 h-3 animate-pulse" /> M.A.R.D. RELAY ONLINE
            </div>
          </div>
        </div>

        {/* TAB 1: LIVE CHAT */}
        {activeTab === 'chat' && (
          <>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/40 gap-2">
                  <span className="text-3xl animate-bounce">📡</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Synchronizing telemetry data...</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const userLower = msg.user.toLowerCase();
                  const isSys = msg.isSystem;
                  
                  if (isSys) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2.5 rounded-xl text-xs leading-relaxed max-w-xl font-sans shadow-md">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm select-none">{avatarFallbacks[userLower] || '👤'}</span>
                        <span className="text-xs font-bold tracking-wide" style={{ color: msg.color }}>
                          {msg.user.toUpperCase()}
                        </span>
                        <span className="text-[8px] text-white/30">
                          {msg.user === 'Pilot' ? 'CREATOR' : 'ADVOCATE'}
                        </span>
                      </div>
                      <div className="pl-6 max-w-2xl">
                        <div className="bg-[#0B0E14]/70 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-white/90 leading-relaxed font-sans shadow-md hover:border-[#10b981]/20 transition-all duration-200">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#10b981]/20 bg-[#0B0E14] flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Broadcast message to WeedStack advocates..."
                className="flex-1 bg-[#0F131A] text-white text-xs border border-[#10b981]/30 rounded-xl px-4 py-3 outline-none focus:focus-within:border-[#10b981] tracking-wide placeholder-white/20 transition-all duration-200"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-[#0B0E14] font-bold rounded-xl transition-all duration-200 flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-[#10b981]/20"
              >
                <Send className="w-4 h-4" /> Broadcast
              </button>
            </form>
          </>
        )}

        {/* TAB 2: CONTENT MATRIX */}
        {activeTab === 'matrix' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-[#0F131A]">
            
            {/* SOURCE GRID */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                  <Radio className="w-4 h-4" /> Content Source Matrix
                </h2>
                <span className="text-[9px] text-white/40">Toggle brand feed signals live</span>
              </div>
              
              {loadingMatrix ? (
                <div className="text-xs text-white/50 py-4">Polling source configurations...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sources.map((source) => {
                    const isEnabled = source.enabled === 1;
                    return (
                      <div
                        key={source.source_key}
                        className={`border rounded-xl p-4 transition-all duration-200 bg-[#0B0E14]/50 ${
                          isEnabled
                            ? 'border-[#10b981]/40 shadow-md shadow-[#10b981]/5'
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-xs font-bold text-white/90 mb-1">{source.display_name}</h3>
                            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
                              Key: {source.source_key}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleToggleSource(source.source_key, isEnabled)}
                            className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                              isEnabled
                                ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                                : 'bg-red-400/5 border-red-400/20 text-red-400'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 mr-0.5" /> LIVE
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 mr-0.5" /> STANDBY
                              </>
                            )}
                          </button>
                        </div>
                        
                        <p className="text-[10.5px] text-white/60 leading-relaxed font-sans mb-3">
                          {source.description}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-white/40">
                          <span>
                            Interval: {source.poll_interval_s}s
                          </span>
                          <span>
                            Last Polled: {source.last_polled ? new Date(source.last_polled).toLocaleTimeString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PILOT INJECTION PANEL */}
            {isPilot && (
              <div className="border border-[#10b981]/20 rounded-xl p-5 bg-[#0B0E14]/40 flex flex-col gap-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2 border-b border-[#10b981]/15 pb-2">
                  <Plus className="w-4 h-4" /> Manual Context Event Injection
                </h2>
                
                <form onSubmit={handleManualInject} className="flex flex-col gap-3 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] uppercase font-bold text-white/60 tracking-wider">Headline / Title</label>
                      <input
                        type="text"
                        value={customHeadline}
                        onChange={(e) => setCustomHeadline(e.target.value)}
                        placeholder="e.g. Rare BT4991 phenotype stabilized in sun-grown plot"
                        className="bg-[#0F131A] text-white border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#10b981] transition-all"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] uppercase font-bold text-white/60 tracking-wider">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={customTags}
                        onChange={(e) => setCustomTags(e.target.value)}
                        placeholder="e.g. genetics,BT4991,outdoor,harvest"
                        className="bg-[#0F131A] text-white border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#10b981] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase font-bold text-white/60 tracking-wider">Content Body Description</label>
                    <textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Detail the event description. Faction personalities will consume this live update and dispute/react instantly."
                      rows={3}
                      className="bg-[#0F131A] text-white border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#10b981] transition-all resize-none"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={injecting}
                    className="self-end px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {injecting ? "Injecting..." : "Inject Custom Event"}
                  </button>
                </form>
              </div>
            )}

            {/* FACTIONS SECTION */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Barter Faction Society
                </h2>
                <span className="text-[9px] text-white/40">Ideological alliances & permanent rivalries</span>
              </div>
              
              {loadingMatrix ? (
                <div className="text-xs text-white/50 py-4">Polling factions...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {factions.map((faction) => {
                    const isAlliance = faction.faction_type === 'alliance';
                    const isRivalry = faction.faction_type === 'rivalry';
                    
                    const fMembers = factionMembers.filter(m => m.faction_id === faction.sys_id);
                    
                    return (
                      <div key={faction.sys_id} className="border border-white/5 rounded-xl p-4 bg-[#0B0E14]/40 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-white/95">{faction.faction_name}</h3>
                            
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isAlliance
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : isRivalry
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                            }`}>
                              {isAlliance && <Heart className="w-2.5 h-2.5" />}
                              {isRivalry && <ShieldAlert className="w-2.5 h-2.5" />}
                              {faction.faction_type.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-white/50 leading-relaxed font-sans mb-3">
                            {faction.description}
                          </p>
                        </div>
                        
                        <div className="border-t border-white/5 pt-3">
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white/30 block mb-2">
                            Faction Members ({fMembers.length})
                          </span>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {fMembers.map((member) => (
                              <div
                                key={member.persona_name}
                                className="flex items-center gap-1 px-2 py-0.5 bg-[#0F131A] border border-white/5 rounded text-[8px] tracking-wide"
                              >
                                <span>{avatarFallbacks[member.persona_name] || '👤'}</span>
                                <span className="font-bold uppercase" style={{ color: member.color }}>
                                  {member.persona_name.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[7px] text-white/30">({member.role})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
