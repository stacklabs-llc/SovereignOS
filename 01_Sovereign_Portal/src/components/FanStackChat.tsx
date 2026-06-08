import React, { useState, useEffect, useRef } from 'react';
import { getWsUrl } from '../api-host';
import avatarMapData from '../avatarMap';
import { useAuth } from '../contexts/AuthContext';
import { Film, CheckCircle } from 'lucide-react';

interface FanStackChatProps {
    onMeltdown?: (state: boolean) => void;
    activeGamedayPk?: string | null;
}

const FanStackChat: React.FC<FanStackChatProps> = ({ onMeltdown, activeGamedayPk }) => {
  const auth = useAuth();
  const hasCreatorTools = auth?.role === 'pilot' || auth?.role === 'creator' || auth?.role === 'admin';
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);

  const selectedGamePkRef = useRef(activeGamedayPk);
  useEffect(() => {
    selectedGamePkRef.current = activeGamedayPk;
  }, [activeGamedayPk]);

  // Mention Autocomplete State
  const [mentionState, setMentionState] = useState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
  const [activePersonas, setActivePersonas] = useState<string[]>(['@dot', '@coach_shrubbs']);
  const [activeRoster, setActiveRoster] = useState<any[]>([]);
  const [roomGeminiTokens, setRoomGeminiTokens] = useState<number>(0);
  const [roomLocalTokens, setRoomLocalTokens] = useState<number>(0);
  const [roomSysTokens, setRoomSysTokens] = useState<number>(0);
  const [avatarMap] = useState<any>(avatarMapData || {});
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  const filteredPersonas = activePersonas.filter(p => typeof p === 'string' && p.toLowerCase().includes(mentionState.filter));

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 50);
  };

  const scrollToBottom = () => {
    if (!isScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isScrolledUp]);

  const handlePromote = (id: string, text: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "PROMOTE_COULDA_BEEN", message_id: id, text }));
      }
      setPromotedIds(prev => [...prev, id]);
  };

  useEffect(() => {
    let reconnectTimeout: any;
    const connectWs = () => {
      // Connect to ws-relay as FanStackChat did before
      const socket = new WebSocket(getWsUrl('/ws-relay'));

      socket.onopen = () => {
        console.log("Connected to M.A.R.D. Relay for FanStackChat");
        if (selectedGamePkRef.current) {
          socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: selectedGamePkRef.current }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "CHAT_HISTORY") {
            const history = data.messages
              .filter((m: any) => m.type !== "SYS_LOG")
              .map((m: any) => ({
                id: m.id || (Date.now() + '-' + Math.random()),
                user: m.user || m.persona_name || 'Unknown',
                text: typeof m.text === 'string' ? m.text.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : typeof m.message === 'string' ? m.message.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : JSON.stringify(m.text || m.message),
                color: m.color || m.hex || '#a855f7',
                isSystem: m.user === 'SYSTEM' || (m.user && m.user.includes('System')) || (m.user && m.user.includes('Bartender')),
                model_engine: m.model_engine || null,
                input_tokens: m.input_tokens || 0,
                output_tokens: m.output_tokens || 0
              }));
            setMessages([...history]);
          } else if (data.type === "SYS_LOG") {
            // Suppress internal persona processing logs
          } else if (data.type === "CHAT_MESSAGE" || (data.id && data.persona_name)) {
            setMessages(prev => {
              const incomingText = typeof (data.text || data.message) === 'string' ? (data.text || data.message).replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : JSON.stringify(data.text || data.message);
              const incomingUser = data.user || data.persona_name || 'Unknown';
              // Strict Vite HMR Deduplication
              if (prev.some(m => m.user === incomingUser && m.text === incomingText)) {
                return prev;
              }

              return [...prev, {
                id: data.id || (Date.now() + '-' + Math.random()),
                user: incomingUser,
                text: incomingText,
                color: data.color || data.hex || '#a855f7',
                isSystem: incomingUser === 'SYSTEM' || incomingUser.includes('System') || incomingUser.includes('Bartender'),
                model_engine: data.model_engine || null,
                input_tokens: data.input_tokens || 0,
                output_tokens: data.output_tokens || 0
              }];
            });
            setIsTyping(false); 
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
    
    // WAL-Optimized Polling Heartbeat (500ms)
    const pulseInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_TICK", timestamp: Date.now() }));
        }
    }, 500);

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pulseInterval);
      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeGamedayPk) {
      wsRef.current.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: activeGamedayPk }));
    }
  }, [activeGamedayPk]);

  useEffect(() => {
    if (!activeGamedayPk) return;

    const fetchPersonas = async () => {
      try {
        const res = await fetch(`/api/room_personas?gamePk=${activeGamedayPk}`);
        const data = await res.json();
        if (data.personas) {
          setActivePersonas(data.personas);
          setActiveRoster(data.roster || []);
          setRoomGeminiTokens(data.room_gemini_tokens || 0);
          setRoomLocalTokens(data.room_local_tokens || 0);
          setRoomSysTokens(data.room_sys_tokens || 0);
        }
      } catch (e) {
        console.error("Personas fetch error:", e);
      }
    };

    fetchPersonas();
    const personaInterval = setInterval(fetchPersonas, 10000); 

    return () => {
      clearInterval(personaInterval);
    };
  }, [activeGamedayPk]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      user: auth?.display_name || 'You (Fan)',
      text: inputValue,
      color: '#fff',
      isSystem: false
    };

    setInputValue('');
    setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
    setIsTyping(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "CHAT_MESSAGE",
        user: auth?.display_name || 'You (Fan)',
        text: newMsg.text,
        target_game_pk: activeGamedayPk || "GLOBAL"
      }));
    } else {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        user: 'System',
        text: 'Error contacting the bar: WebSocket is disconnected.',
        color: '#ff5252',
        isSystem: true
      }]);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionState({ active: true, filter: match[1].toLowerCase(), cursorIndex: match.index as number, selectedIndex: 0 });
    } else {
      setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
    }
  };

  const handleMentionSelect = (persona: string) => {
    const before = inputValue.slice(0, mentionState.cursorIndex);
    const after = inputValue.slice(mentionState.cursorIndex + mentionState.filter.length + 1);
    setInputValue(`${before}${persona} ${after}`);
    setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionState.active && filteredPersonas.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredPersonas.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredPersonas.length) % filteredPersonas.length }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(filteredPersonas[mentionState.selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
        return;
      }
    }

    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full w-full rounded-br-xl bg-gradient-to-b from-cyan-400 to-fuchsia-500 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        {/* Mets Copium Panic Button */}
        <div className="absolute top-4 right-6 z-50">
           <button 
             onClick={(e) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                   wsRef.current.send(JSON.stringify({ type: "COPIUM_PROTOCOL", severity: "MAX" }));
                }
                e.currentTarget.innerHTML = "🚨 THERAPY MODE ENGAGED";
                e.currentTarget.classList.add("animate-pulse", "bg-[#A84B4B]", "text-white");
             }}
             className="px-3 py-1.5 bg-[#A84B4B]/20 border border-[#A84B4B]/50 rounded-lg text-[#A84B4B] font-mono text-[9px] uppercase font-bold tracking-[0.2em] hover:bg-[#A84B4B] hover:text-white transition-all  cursor-pointer"
           >
             🆘 Mets Copium Support
           </button>
        </div>

        <div className="flex-1 bg-[#0a0c10]/95 backdrop-blur-2xl flex flex-col overflow-hidden h-full">
          {/* Header Row for active personas */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-black/40 pt-10">
            <span className="text-gray-400 text-[10px] font-mono">{activePersonas.length + 1} ACTIVE PERSONAS</span>
            <div className="relative flex -space-x-2 group/roster">
              {[...activePersonas.slice(0, 3), "You"].map((p, i) => {
                const rawName = p.replace('@', '').toLowerCase();
                const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                const hasFailed = failedAvatars.has(rawName);
                const rosterItem = activeRoster.find(r => r.user_name.toLowerCase() === rawName);
                const color = rosterItem?.color || '#38bdf8';
                const initial = (rosterItem?.user_name || rawName || '?').charAt(0).toUpperCase();

                return (imgSrc && !hasFailed) ? (
                  <img 
                    key={i} 
                    src={imgSrc} 
                    className="w-6 h-6 rounded-full border border-[#111827] object-cover" 
                    alt={p} 
                    onError={() => {
                      setFailedAvatars(prev => {
                        const next = new Set(prev);
                        next.add(rawName);
                        return next;
                      });
                    }}
                  />
                ) : (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full border border-[#111827] bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white uppercase"
                    style={{ backgroundColor: color, backgroundImage: `linear-gradient(135deg, ${color}cc, ${color}66)` }}
                  >
                    {initial}
                  </div>
                );
              })}
              {activePersonas.length > 3 && (
                <div className="w-6 h-6 rounded-full border border-[#111827] bg-white/10 flex items-center justify-center text-[8px] font-bold text-gray-300 cursor-pointer">
                  +{activePersonas.length - 2}
                </div>
              )}
              {/* Hover Roster Popover */}
              <div className="absolute top-full right-0 mt-2 z-50 hidden group-hover/roster:flex flex-col gap-1 bg-[#0a0c10]/95 backdrop-blur-xl border border-[#38bdf8]/30 rounded-lg p-2 shadow-2xl min-w-[200px]">
                <div className="flex justify-between items-center mb-1 px-1 border-b border-white/10 pb-1 gap-2">
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">In The Bar</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[8px] font-mono text-[#22c55e] uppercase tracking-widest">🦙 {roomLocalTokens.toLocaleString()}</p>
                    <p className="text-[8px] font-mono text-[#f59e0b] uppercase tracking-widest">⚡ {roomGeminiTokens.toLocaleString()}</p>
                  </div>
                </div>
                {activeRoster.length > 0 ? activeRoster.map((p: any, i: number) => {
                  const rawName = p.user_name.toLowerCase();
                  const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                  const hasFailed = failedAvatars.has(rawName);
                  return (
                    <div key={i} className="flex items-center justify-between px-1 py-1 rounded hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {(imgSrc && !hasFailed) ? (
                          <img 
                            src={imgSrc} 
                            className="w-4 h-4 rounded-full object-cover border border-white/20 flex-shrink-0" 
                            alt={rawName} 
                            onError={() => {
                              setFailedAvatars(prev => {
                                const next = new Set(prev);
                                next.add(rawName);
                                return next;
                              });
                            }}
                          />
                        ) : (
                          <div 
                            className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white uppercase"
                            style={{ backgroundColor: p.color || '#38bdf8' }}
                          >
                            {(p.user_name || rawName || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-gray-300 truncate">{rawName}</span>
                      </div>
                    </div>
                  );
                }) : [...activePersonas, 'you'].map((p, i) => {
                  const rawName = p.replace('@', '').toLowerCase();
                  const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                  const hasFailed = failedAvatars.has(rawName);
                  return (
                    <div key={i} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-white/5 transition-colors">
                      {(imgSrc && !hasFailed) ? (
                        <img 
                          src={imgSrc} 
                          className="w-4 h-4 rounded-full object-cover border border-white/20 flex-shrink-0" 
                          alt={rawName} 
                          onError={() => {
                            setFailedAvatars(prev => {
                              const next = new Set(prev);
                              next.add(rawName);
                              return next;
                            });
                          }}
                        />
                      ) : (
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white uppercase"
                          style={{ backgroundColor: '#38bdf8' }}
                        >
                          {(rawName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-gray-300 truncate">{rawName === 'you' ? '👤 you' : rawName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4"
          >
            {messages.length === 0 && (
                <div className="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.3em] font-bold uppercase text-[#38bdf8] animate-pulse">
                    [ INITIALIZING PERSONA MATRIX ]
                </div>
            )}
            {messages.map(m => {
              const isUser = m.user === (auth?.display_name || 'You (Fan)') || m.user === 'You (Fan)' || m.user === 'You';
              const rawName = m.user.replace('@', '').toLowerCase();
              const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];

              return (
                <div key={m.id} className={`w-full flex gap-2 ${isUser ? 'self-end flex-row-reverse' : 'self-start'} group ${promotedIds.includes(m.id) ? 'bg-[#facc15]/10 rounded-xl' : ''}`}>

                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-auto mb-1">
                    {(imgSrc && !failedAvatars.has(rawName)) ? (
                      <img 
                        src={imgSrc} 
                        className="w-6 h-6 rounded-full border border-transparent object-cover" 
                        style={{ borderColor: isUser ? '#38bdf8' : m.color }} 
                        alt={m.user} 
                        onError={() => {
                          setFailedAvatars(prev => {
                            const next = new Set(prev);
                            next.add(rawName);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] border border-transparent" 
                        style={{ borderColor: isUser ? '#38bdf8' : m.color, backgroundColor: isUser ? '#38bdf8' : m.color }}
                      >
                        {m.user.replace('@', '').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 w-full min-w-0">
                    <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold text-[10px] text-gray-300 font-display uppercase tracking-widest truncate max-w-[120px]">{m.user}</span>
                      {m.model_engine && !isUser && (() => {
                        const eng = m.model_engine.toLowerCase();
                        const isGemini = eng.includes('gemini');
                        const isPhi = eng.includes('phi');
                        const isDolphin = eng.includes('dolphin');
                        const color = isGemini ? '#f59e0b' : isPhi ? '#a855f7' : isDolphin ? '#0ea5e9' : '#22c55e';
                        const label = isGemini ? '⚡ GEMINI' : isPhi ? 'PHI-3' : isDolphin ? '🐬 DOLPHIN' : 'LLAMA';
                        return (
                          <span
                            className={`text-[6px] font-mono font-bold px-1 py-0.5 rounded flex items-center gap-1`}
                            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
                          >
                            <span>{label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div
                      className={`px-3 py-2 rounded-xl backdrop-blur-md border ${isUser ? 'rounded-br-sm bg-[#38bdf8]/5 border-[#38bdf8]/40 ' : 'rounded-bl-sm bg-white/[0.04] border-white/10'} relative`}
                      style={!isUser && m.color ? { borderLeftColor: m.color, borderLeftWidth: '2px' } : {}}
                    >
                      <div className="text-[12px] leading-relaxed text-gray-200 whitespace-pre-wrap font-medium break-words">
                        {m.text || m.message || ''}
                      </div>
                      
                      {/* Promote Button */}
                      {!isUser && !m.isSystem && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                                onClick={() => handlePromote(m.id, m.text)}
                                disabled={promotedIds.includes(m.id)}
                                className="p-0.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Promote to Coulda Been"
                             >
                                 {promotedIds.includes(m.id) ? <CheckCircle className="w-3 h-3 text-[#facc15]" /> : <Film className="w-3 h-3" />}
                             </button>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="w-full self-end flex gap-2 flex-row-reverse">
                <div className="flex-shrink-0 mt-auto mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8] flex items-center justify-center animate-pulse"></div>
                </div>
                <div className="flex flex-col gap-1 w-full items-end">
                  <div className="px-3 py-2 rounded-xl rounded-br-sm bg-[#38bdf8]/5 border border-[#38bdf8]/40 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 border-t border-white/5 bg-black/40 relative flex-shrink-0 backdrop-blur-xl">
            {mentionState.active && filteredPersonas.length > 0 && (
              <div className="absolute bottom-full left-3 mb-2 w-48 max-h-[30vh] overflow-y-auto custom-scrollbar bg-[#0A0D12]/95 backdrop-blur-xl border border-[#38bdf8]/40 rounded-xl p-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-1">
                {filteredPersonas.map((p, i) => (
                  <div
                    key={p}
                    onClick={() => handleMentionSelect(p)}
                    onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: i }))}
                    className={`px-2 py-1.5 cursor-pointer rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${i === mentionState.selectedIndex ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-gray-300 hover:bg-white/5'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border border-white/20 ${i === mentionState.selectedIndex ? 'border-[#38bdf8]' : ''}`}></div>
                    {p}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message... (@ to mention)"
                className="flex-1 bg-black/60 border border-white/10 text-white px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono shadow-inner min-w-0"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-widest uppercase px-4 py-2 text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(34,211,238,0.4)] whitespace-nowrap"
              >
                SEND
              </button>
            </form>
          </div>
        </div>
    </div>
  );
};

export default FanStackChat;
