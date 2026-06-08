import React, { useState, useEffect, useRef } from 'react';
import BaseballDiamond from './BaseballDiamond';
import { getWsUrl } from '../api-host';
import avatarMapData from '../avatarMap';
import { useAuth } from '../contexts/AuthContext';
import { Twitter } from 'lucide-react';
import Soundboard from './Soundboard';

interface ScruffysTavernProps {
  activeGamedayPk?: string | null;
}

export default function ScruffysTavern({ activeGamedayPk }: ScruffysTavernProps) {
  const auth = useAuth();
  const hasCreatorTools = auth?.role === 'pilot' || auth?.role === 'creator' || auth?.role === 'admin';
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [liveFeed, setLiveFeed] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [tweetingMessageId, setTweetingMessageId] = useState<string | null>(null);
  const [tweetSuccessId, setTweetSuccessId] = useState<string | null>(null);

  const handleLiveTweet = async (messageId: string, persona: string, text: string) => {
    try {
      setTweetingMessageId(messageId);
      const formData = new FormData();
      formData.append('script', text);
      formData.append('persona', persona.replace('@', '').toLowerCase());
      const res = await fetch('/api/hot_take/dub', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setTweetSuccessId(messageId);
        setTimeout(() => setTweetSuccessId(null), 3000);
      }
    } catch (e) {
      console.error("Live tweet failed", e);
    } finally {
      setTweetingMessageId(null);
    }
  };

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
  const [avatarMap, setAvatarMap] = useState<any>(avatarMapData || {});
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  // Room Builder State
  const [isRoomBuilderOpen, setIsRoomBuilderOpen] = useState(false);
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [builderFilter, setBuilderFilter] = useState('');
  const [stagedPersonas, setStagedPersonas] = useState<string[]>([]);

  useEffect(() => {
    if (isRoomBuilderOpen) {
      fetch('/api/all_personas')
        .then(r => r.json())
        .then(data => {
          if (data.personas) {
            setAllPersonas(data.personas.sort((a: any, b: any) => (a.team || '').localeCompare(b.team || '') || a.user_name.localeCompare(b.user_name)));
          }
        })
        .catch(console.error);

      const stripped = activePersonas
        .filter(p => typeof p === 'string')
        .map(p => p.replace('@', '').toLowerCase());
      setStagedPersonas(stripped);
    }
  }, [isRoomBuilderOpen, activePersonas]);

  const togglePersona = (userName: string) => {
    const p = userName.toLowerCase();
    // Note: all personas are freely toggleable now — room assignment is DB-driven via game_persona
    setStagedPersonas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const saveRoomPersonas = async () => {
    if (!activeGamedayPk) return;
    try {
      await fetch('/api/save_room_personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamePk: activeGamedayPk, personas: stagedPersonas })
      });
      setIsRoomBuilderOpen(false);

      const res = await fetch(`/api/room_personas?gamePk=${activeGamedayPk}`);
      const data = await res.json();
      if (data.personas) setActivePersonas(data.personas);
    } catch (e) {
      console.error(e);
    }
  };

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

  useEffect(() => {
    let reconnectTimeout: any;
    const connectWs = () => {
      const socket = new WebSocket(getWsUrl('/ws'));

      socket.onopen = () => {
        console.log("Connected to M.A.R.D. Relay for Scruffy's");
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
                user: m.user,
                text: typeof m.text === 'string' ? m.text.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : JSON.stringify(m.text || m.message),
                color: m.color || '#a855f7',
                isSystem: m.user === 'SYSTEM' || m.user.includes('System') || m.user.includes('Bartender'),
                model_engine: m.model_engine || null,
                input_tokens: m.input_tokens || 0,
                output_tokens: m.output_tokens || 0
              }));
            setMessages([...history]);
          } else if (data.type === "SYS_LOG") {
            // Suppress internal persona processing logs from rendering in public chat bubbles
          } else if (data.type === "CHAT_MESSAGE") {
            setMessages(prev => {
              const incomingText = typeof data.text === 'string' ? data.text.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : JSON.stringify(data.text || data.message);
              // Strict Vite HMR Deduplication
              if (prev.some(m => m.user === data.user && m.text === incomingText)) {
                return prev;
              }

              return [...prev, {
                id: data.id || (Date.now() + '-' + Math.random()),
                user: data.user,
                text: incomingText,
                color: data.color || '#a855f7',
                isSystem: data.user === 'SYSTEM' || data.user.includes('System') || data.user.includes('Bartender'),
                model_engine: data.model_engine || null,
                input_tokens: data.input_tokens || 0,
                output_tokens: data.output_tokens || 0
              }];
            });
            setIsTyping(false); // Clear typing indicator when a message arrives
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
        wsRef.current.onclose = null; // Prevent reconnect on unmount
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

    const fetchScoreboard = async () => {
      try {
        const res = await fetch(`/api/scoreboard?gamePk=${activeGamedayPk}`);
        const data = await res.json();
        if (!data.error && data.status !== "No game today") {
          setScoreboard(data);
        }
      } catch (e) {
        console.error("Scoreboard fetch error:", e);
      }
    };

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

    const fetchLiveFeed = async () => {
      try {
        const res = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${activeGamedayPk}/feed/live`);
        const data = await res.json();
        setLiveFeed(data);
      } catch (e) {
        console.error("Live Feed fetch error:", e);
      }
    };

    fetchScoreboard();
    fetchPersonas();
    fetchLiveFeed();

    const interval = setInterval(fetchScoreboard, 30000); // update every 30s
    const feedInterval = setInterval(fetchLiveFeed, 4500); // update every 4.5s
    const personaInterval = setInterval(fetchPersonas, 10000); // update tokens every 10s

    return () => {
      clearInterval(interval);
      clearInterval(feedInterval);
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
    <div className="flex-1 w-full flex flex-col md:flex-row gap-6 overflow-hidden vm-panel-glass p-4 rounded-xl">
      {/* LEFT COLUMN: SCOREBOARD */}
      <div className="w-full md:w-[35vw] md:min-w-[350px] md:max-w-[450px] flex flex-col h-auto md:h-full overflow-hidden shrink-0">
        {activeGamedayPk ? (
          <div className="flex flex-col gap-4 h-full overflow-hidden w-full">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col flex-1 overflow-hidden">
              {scoreboard && scoreboard.away && scoreboard.home ? (
                <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col items-center justify-center py-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-5xl font-bold text-white">{scoreboard.away.runs}</span>
                        <span className="text-lg font-bold text-gray-400 tracking-wider uppercase">{scoreboard.away.name}</span>
                      </div>
                      <div className="text-gray-500 font-mono text-lg px-4">VS</div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-5xl font-bold text-white">{scoreboard.home.runs}</span>
                        <span className="text-lg font-bold text-gray-400 tracking-wider uppercase">{scoreboard.home.name}</span>
                      </div>
                    </div>
                    <div className="mt-4 px-5 py-2 bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-full">
                      <span className="text-[#38bdf8] text-xs font-bold tracking-widest uppercase">{scoreboard.inningState} {scoreboard.inning} • {scoreboard.outs} OUT</span>
                    </div>
                  </div>

                  {/* NEW TELEMETRY DASHBOARD */}
                  {(() => {
                    let batterName = "Awaiting Batter";
                    let pitcherName = "Awaiting Pitcher";
                    
                    if (liveFeed?.liveData?.plays?.currentPlay) {
                      const play = liveFeed.liveData.plays.currentPlay;
                      batterName = play.matchup?.batter?.fullName || batterName;
                      pitcherName = play.matchup?.pitcher?.fullName || pitcherName;
                    }

                    let pitchSpeed = "00.0";
                    let pitchType = "WAITING";
                    let pitchCount = "-";
                    let liveOffense = { first: false, second: false, third: false };
                    let liveBalls = scoreboard?.balls || 0;
                    let liveStrikes = scoreboard?.strikes || 0;
                    let liveOuts = scoreboard?.outs || 0;

                    if (liveFeed) {
                      const linescore = liveFeed?.liveData?.linescore || {};
                      const pId = linescore?.defense?.pitcher?.id;
                      const defTeam = linescore?.isTopInning ? 'home' : 'away';
                      pitchCount = pId ? (liveFeed?.liveData?.boxscore?.teams[defTeam]?.players[`ID${pId}`]?.stats?.pitching?.numberOfPitches || "-") : "-";

                      const plays = liveFeed?.liveData?.plays?.allPlays || [];
                      if (plays.length > 0) {
                        const events = plays[plays.length - 1]?.playEvents || [];
                        if (events.length > 0 && events[events.length - 1].pitchData) {
                          pitchSpeed = events[events.length - 1].pitchData.startSpeed || pitchSpeed;
                          pitchType = (events[events.length - 1].details?.type?.description || pitchType).toUpperCase();
                        }
                      }

                      liveOffense = {
                        first: !!linescore?.offense?.first,
                        second: !!linescore?.offense?.second,
                        third: !!linescore?.offense?.third
                      };
                      liveBalls = linescore?.balls || liveBalls;
                      liveStrikes = linescore?.strikes || liveStrikes;
                      liveOuts = linescore?.outs || liveOuts;
                    }

                    return (
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-inner flex flex-col gap-4 mt-6">
                        {/* Matchup Banner */}
                        <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                          <div className="text-[#38bdf8] font-bold text-sm flex items-center gap-2">
                            <span className="text-gray-400 font-mono text-xs">P:</span> {pitcherName}
                            <span className="text-gray-600 font-mono text-xs mx-2">vs</span>
                            <span className="text-gray-400 font-mono text-xs">B:</span> {batterName}
                          </div>
                        </div>

                        {/* Telemetry & Diamond Split */}
                        <div className="flex items-center justify-between">

                          {/* Left Stats */}
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-mono text-[10px] font-bold tracking-widest mb-0.5">PITCH</span>
                              <span className="text-base font-bold text-white">{pitchType}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-mono text-[10px] font-bold tracking-widest mb-0.5">VELO</span>
                              <span className="text-base font-bold text-[#a855f7]">{pitchSpeed} MPH</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-mono text-[10px] font-bold tracking-widest mb-0.5">PCOUNT</span>
                              <span className="text-sm font-bold text-gray-300">{pitchCount}</span>
                            </div>
                          </div>

                          {/* Right Diamond & Count */}
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="scale-75 origin-right">
                              <BaseballDiamond offense={liveOffense} />
                            </div>

                            {/* Compact Count Indicator */}
                            <div className="flex justify-center items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-gray-500 font-bold mr-1">B</span>
                                {[1, 2, 3].map(i => <div key={`b${i}`} className={`w-2 h-2 rounded-full ${i <= liveBalls ? 'bg-[#38bdf8] ' : 'bg-white/10'}`}></div>)}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-gray-500 font-bold mr-1">S</span>
                                {[1, 2].map(i => <div key={`s${i}`} className={`w-2 h-2 rounded-full ${i <= liveStrikes ? 'bg-[#a855f7] ' : 'bg-white/10'}`}></div>)}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-gray-500 font-bold mr-1">O</span>
                                {[1, 2].map(i => <div key={`o${i}`} className={`w-2 h-2 rounded-full ${i <= liveOuts ? 'bg-red-500 ' : 'bg-white/10'}`}></div>)}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center flex-col gap-4">
                  <div className="w-8 h-8 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin"></div>
                  <h2 className="text-[#38bdf8] text-xs tracking-widest font-bold uppercase animate-pulse">Establishing Live Feed...</h2>
                </div>
              )}
            </div>

            {/* Soundboard Panel */}
            <div className="shrink-0">
              <Soundboard activeGamedayPk={activeGamedayPk} />
            </div>
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden items-center justify-center">
            <h2 className="text-[#38bdf8] text-xs tracking-widest font-bold uppercase animate-pulse">Select a game from the slate</h2>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - CHAT */}
      <div className="flex-1 flex flex-col relative z-10 p-[2px] rounded-3xl bg-gradient-to-b from-cyan-400 to-fuchsia-500 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        <div className="flex-1 bg-[#0a0c10]/95 backdrop-blur-2xl flex flex-col overflow-hidden rounded-3xl h-full">
          <div className="flex justify-between items-center px-8 py-5 border-b border-white/10 bg-black/40">
            <h2 className="text-white font-display font-bold tracking-widest uppercase text-xl m-0 flex items-center gap-4">
            {scoreboard && scoreboard.away && scoreboard.home ? (
              <>
                <span className="text-white">{scoreboard.away.teamName || scoreboard.away.name}</span>
                <span className="text-gray-500 font-mono text-sm">vs</span>
                <span className="text-white">{scoreboard.home.teamName || scoreboard.home.name}</span>
              </>
            ) : 'BLEACHER BUMS LIVE CHAT'}
          </h2>
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            {activeGamedayPk && hasCreatorTools && (
              <button
                onClick={() => setIsRoomBuilderOpen(true)}
                className="bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 rounded-lg px-3 py-1 text-[10px] font-bold tracking-widest text-[#38bdf8] transition-all flex items-center gap-2 uppercase font-mono"
              >
                BUILD ROOM
              </button>
            )}
            <span className="text-gray-400 text-sm font-mono">{activePersonas.length + 1} Active</span>
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
                    className="w-8 h-8 rounded-full border-2 border-[#111827] object-cover" 
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
                    className="w-8 h-8 rounded-full border-2 border-[#111827] flex items-center justify-center text-xs font-bold text-white uppercase"
                    style={{ backgroundColor: color, backgroundImage: `linear-gradient(135deg, ${color}cc, ${color}66)` }}
                  >
                    {initial}
                  </div>
                );
              })}
              {activePersonas.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-[#111827] bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-300 cursor-pointer">
                  +{activePersonas.length - 2}
                </div>
              )}
              {/* Hover Roster Popover */}
              <div className="absolute top-full right-0 mt-2 z-50 hidden group-hover/roster:flex flex-col gap-1 bg-[#0a0c10]/95 backdrop-blur-xl border border-[#38bdf8]/30 rounded-2xl p-3 shadow-2xl min-w-[260px]">
                <div className="flex justify-between items-center mb-1 px-1 border-b border-white/10 pb-1 gap-2">
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">In The Bar</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-mono text-[#22c55e] uppercase tracking-widest">🦙 {roomLocalTokens.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-widest">⚡ {roomGeminiTokens.toLocaleString()}</p>
                  </div>
                </div>
                {activeRoster.length > 0 ? activeRoster.map((p: any, i: number) => {
                  const rawName = p.user_name.toLowerCase();
                  const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                  const hasFailed = failedAvatars.has(rawName);
                  return (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {(imgSrc && !hasFailed) ? (
                          <img 
                            src={imgSrc} 
                            className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0" 
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
                            className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                            style={{ backgroundColor: p.color || '#38bdf8' }}
                          >
                            {(p.user_name || rawName || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-mono text-gray-300 truncate">{rawName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] font-mono text-[#22c55e]/80 w-8 text-right">🦙{p.local_tokens?.toLocaleString() || 0}</span>
                        <span className="text-[9px] font-mono text-[#f59e0b]/80 w-8 text-right">⚡{p.gemini_tokens?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  );
                }) : [...activePersonas, 'you'].map((p, i) => {
                  const rawName = p.replace('@', '').toLowerCase();
                  const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                  const hasFailed = failedAvatars.has(rawName);
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      {(imgSrc && !hasFailed) ? (
                        <img 
                          src={imgSrc} 
                          className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0" 
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
                          className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: '#38bdf8' }}
                        >
                          {(rawName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-mono text-gray-300 truncate">{rawName === 'you' ? '👤 you' : rawName}</span>
                    </div>
                  );
                })}
                {/* Mean Gene SYS row — always visible so the bill is never hidden */}
                {roomSysTokens > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg border-t border-white/10 mt-1 pt-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[8px] flex-shrink-0">⚖️</div>
                      <span className="text-xs font-mono text-red-400/80 truncate">mean_gene (bouncer)</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-mono text-red-400/80 w-16 text-right">⚡{roomSysTokens.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6"
          >
            {messages.map(m => {
              const isUser = m.user === (auth?.display_name || 'You (Fan)') || m.user === 'You (Fan)' || m.user === 'You';
              const rawName = m.user.replace('@', '').toLowerCase();
              const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];

              return (
                <div key={m.id} className={`max-w-[75%] flex gap-4 ${isUser ? 'self-end flex-row-reverse' : 'self-start'} group`}>

                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-auto mb-1">
                    {(imgSrc && !failedAvatars.has(rawName)) ? (
                      <img 
                        src={imgSrc} 
                        className="w-10 h-10 rounded-full border border-transparent object-cover" 
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
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border border-transparent" 
                        style={{ borderColor: isUser ? '#38bdf8' : m.color, backgroundColor: isUser ? '#38bdf8' : m.color }}
                      >
                        {m.user.replace('@', '').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <div className={`flex items-center gap-2 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold text-sm text-gray-300 font-display uppercase tracking-widest">{m.user}</span>
                      {m.model_engine && !isUser && (() => {
                        const eng = m.model_engine.toLowerCase();
                        const isGemini = eng.includes('gemini');
                        const isPhi = eng.includes('phi');
                        const isDolphin = eng.includes('dolphin');
                        const color = isGemini ? '#f59e0b' : isPhi ? '#a855f7' : isDolphin ? '#0ea5e9' : '#22c55e';
                        const label = isGemini ? '⚡ GEMINI' : isPhi ? 'PHI-3' : isDolphin ? '🐬 DOLPHIN' : 'LLAMA';
                        return (
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${m.input_tokens > 4000 ? 'animate-pulse' : ''}`}
                            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
                          >
                            <span>{label}</span>
                            {(m.input_tokens > 0 || m.output_tokens > 0) && (
                              <span className="opacity-90 border-l border-[currentColor] pl-1 ml-0.5 opacity-60">
                                ⚡{m.input_tokens} In / {m.output_tokens} Out
                              </span>
                            )}
                          </span>
                        );
                      })()}
                      <span className="text-[10px] text-gray-500 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {hasCreatorTools && !isUser && (
                        <button
                          onClick={() => handleLiveTweet(m.id, m.user, m.text || m.message || '')}
                          disabled={tweetingMessageId === m.id}
                          className={`p-1.5 rounded-full hover:bg-sky-500/10 text-sky-400/70 hover:text-sky-400 transition-all duration-300 focus:outline-none flex items-center justify-center relative ${tweetingMessageId === m.id ? 'animate-pulse' : ''}`}
                          title={`Instantly live-tweet this take from ${m.user}`}
                        >
                          {tweetSuccessId === m.id ? (
                            <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">TWEETED!</span>
                          ) : (
                            <Twitter size={14} className="hover:scale-110 active:scale-95 transition-transform" />
                          )}
                        </button>
                      )}
                    </div>
                    <div
                      className={`px-5 py-4 rounded-2xl backdrop-blur-md border ${isUser ? 'rounded-br-sm bg-[#38bdf8]/5 border-[#38bdf8]/40 ' : 'rounded-bl-sm bg-white/[0.04] border-white/10'}`}
                      style={!isUser && m.color ? { borderLeftColor: m.color, borderLeftWidth: '2px' } : {}}
                    >
                      <div className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap font-medium">
                        {m.text || m.message || ''}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="max-w-[75%] self-end flex gap-4 flex-row-reverse">
                <div className="flex-shrink-0 mt-auto mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8] flex items-center justify-center animate-pulse"></div>
                </div>
                <div className="flex flex-col gap-1 w-full items-end">
                  <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-[#38bdf8]/5 border border-[#38bdf8]/40  flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-6 border-t border-white/5 bg-black/40 relative flex-shrink-0 backdrop-blur-xl">
          {mentionState.active && filteredPersonas.length > 0 && (
            <div className="absolute bottom-full left-6 mb-4 w-64 max-h-[40vh] overflow-y-auto custom-scrollbar bg-[#0A0D12]/95 backdrop-blur-xl border border-[#38bdf8]/40 rounded-xl p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-1">
              {filteredPersonas.map((p, i) => (
                <div
                  key={p}
                  onClick={() => handleMentionSelect(p)}
                  onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: i }))}
                  className={`px-3 py-2 cursor-pointer rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${i === mentionState.selectedIndex ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <div className={`w-6 h-6 rounded-full border border-white/20 ${i === mentionState.selectedIndex ? 'border-[#38bdf8]' : ''}`}></div>
                  {p}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="mt-4 flex gap-4 w-full">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Join the Global Conversation... (Use @ to mention)"
              className="flex-1 bg-black/60 border border-white/10 text-white px-6 py-4 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono shadow-inner"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-widest uppercase px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
      </div>

      {/* ROOM BUILDER MODAL */}
      {isRoomBuilderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#0a0c10] border border-[#38bdf8]/30  rounded-3xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center gap-3 font-display">
                  Room Builder
                </h2>
                <p className="text-gray-400 mt-1 font-mono text-xs">Assign personas manually to Game {activeGamedayPk}</p>
              </div>
              <button onClick={() => setIsRoomBuilderOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search personas by name or team (e.g. 'MIA' or 'phanatic')..."
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-600 font-mono text-sm"
                  value={builderFilter}
                  onChange={e => setBuilderFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#050608]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPersonas
                  .filter(p => p.user_name.toLowerCase().includes(builderFilter.toLowerCase()) || (p.team || '').toLowerCase().includes(builderFilter.toLowerCase()))
                  .map(p => {
                    const isSelected = stagedPersonas.includes(p.user_name.toLowerCase());
                    const imgSrc = avatarMap[p.user_name.toLowerCase()] || avatarMap[p.user_name.toLowerCase().replace(/_/g, '')];

                    return (
                      <div
                        key={p.sys_id || p.user_name}
                        onClick={() => togglePersona(p.user_name)}
                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 ' : 'bg-white/[0.03] border-white/5 hover:border-white/20'}`}
                      >
                        {(imgSrc && !failedAvatars.has(p.user_name.toLowerCase())) ? (
                          <img 
                            src={imgSrc} 
                            className="w-10 h-10 rounded-full object-cover border border-white/20" 
                            alt={p.user_name} 
                            onError={() => {
                              setFailedAvatars(prev => {
                                const next = new Set(prev);
                                next.add(p.user_name.toLowerCase());
                                return next;
                              });
                            }}
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white text-xs font-bold uppercase"
                            style={{ backgroundColor: p.color || '#38bdf8' }}
                          >
                            {p.user_name.substring(0, 2)}
                          </div>
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
            
            <div className="p-6 border-t border-white/10 bg-[#0a0c10] flex justify-end gap-4">
               <button onClick={() => setIsRoomBuilderOpen(false)} className="px-6 py-2 rounded-lg text-white/70 font-bold uppercase tracking-widest text-xs hover:bg-white/10 font-mono">Cancel</button>
               <button onClick={saveRoomPersonas} className="px-6 py-2 rounded-lg bg-[#38bdf8] text-black font-bold uppercase tracking-widest text-xs hover:bg-[#0ea5e9]  font-mono">Save & Re-provision Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
