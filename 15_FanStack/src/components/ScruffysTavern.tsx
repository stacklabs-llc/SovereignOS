import React, { useState, useEffect, useRef } from 'react';
import BaseballDiamond from './BaseballDiamond';
import { getWsUrl } from '../api-host';
import avatarMapData from '../avatarMap';
import { useAuth } from '../contexts/AuthContext';
import { Twitter, Paperclip } from 'lucide-react';

const nymStlRoomOverrides = {
  room_id: "scruffys_tavern_nym_stl_20260609",
  host_node: "clio",
  manual_participants: [
    { id: "pilot_james", role: "moderator", base_vibe: "satin_mets_jacket" },
    { id: "barf", team_override: "NYM" },
    { id: "UncleStevieStan", team_override: "NYM" },
    { id: "Keith_Fanboy", team_override: "NYM" },
    { id: "Fredbird_Fiend", team_override: "STL" },
    { id: "Arch_Madness", team_override: "STL" },
    { id: "Salsa_Wizard", team_override: "STL" }
  ]
};

interface ScruffysTavernProps {
  activeGamedayPk?: string | null;
}

export default function ScruffysTavern({ activeGamedayPk }: ScruffysTavernProps) {
  const auth = useAuth();
  const hasCreatorTools = auth?.role === 'pilot' || auth?.role === 'creator';
  const [messages, setMessages] = useState<any[]>([]);
  const [leftTab, setLeftTab] = useState<'game' | 'spatial'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('tab') as any) === 'spatial' ? 'spatial' : 'game';
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [liveFeed, setLiveFeed] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success' && data.mediaUrl) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "CHAT_MESSAGE",
            user: auth?.display_name || 'You (Fan)',
            text: inputValue || "",
            mediaUrl: data.mediaUrl,
            target_game_pk: activeGamedayPk || "GLOBAL"
          }));
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(),
            user: auth?.display_name || 'You (Fan)',
            text: inputValue || "",
            mediaUrl: data.mediaUrl,
            color: '#fff',
            isSystem: false
          }]);
        }
        setInputValue('');
      } else {
        alert("Upload failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading file");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  // Room Builder State
  const [isRoomBuilderOpen, setIsRoomBuilderOpen] = useState(false);
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [builderFilter, setBuilderFilter] = useState('');
  const [stagedPersonas, setStagedPersonas] = useState<string[]>([]);
  const [builderViewMode, setBuilderViewMode] = useState<'list' | 'grid'>('list');
  const [builderStackTab, setBuilderStackTab] = useState<'ALL' | 'SEATED' | 'SPORTS' | 'SOCIETY'>('ALL');
  const [vertexBurnEnabled, setVertexBurnEnabled] = useState(false);
  const [boggsLevel, setBoggsLevel] = useState<number>(() => {
    const saved = localStorage.getItem('sovereign_boggs_override');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isShaking, setIsShaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerRoomShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 1500);
  };

  useEffect(() => {
    if (boggsLevel !== 4 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.parentElement?.offsetWidth || 500;
    let height = canvas.height = canvas.parentElement?.offsetHeight || 600;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const emojis = ['⚾', '🍺', '🧡', '🔵', '🗽', '🧢', '💥'];
    const particles = Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.5, // float up
      size: Math.random() * 20 + 20,
      char: emojis[Math.floor(Math.random() * emojis.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [boggsLevel]);

  useEffect(() => {
    fetch('/api/vertex_burn/status')
      .then(res => res.json())
      .then(data => {
        setVertexBurnEnabled(data.vertex_burn_enabled || false);
      })
      .catch(console.error);
  }, []);

  const toggleVertexBurn = async () => {
    try {
      const res = await fetch('/api/vertex_burn/toggle', { method: 'POST' });
      const data = await res.json();
      setVertexBurnEnabled(data.vertex_burn_enabled);
    } catch (e) {
      console.error(e);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoomBuilderOpen]);

  // Close the room builder if the game changes to avoid state pollution
  useEffect(() => {
    setIsRoomBuilderOpen(false);
  }, [activeGamedayPk]);

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
                mediaUrl: m.mediaUrl || m.media_url || m.image || null,
                color: m.color || '#a855f7',
                isSystem: m.user === 'SYSTEM' || m.user.includes('System') || m.user.includes('Bartender'),
                model_engine: m.model_engine || null,
                input_tokens: m.input_tokens || 0,
                output_tokens: m.output_tokens || 0
              }));
            setMessages([...history]);
          } else if (data.type === "SYS_LOG") {
            // Suppress internal persona processing logs from rendering in public chat bubbles
          } else if (data.type === "ROOM_SHAKE") {
            triggerRoomShake();
            setMessages(prev => [
              ...prev,
              {
                id: data.id || (Date.now() + '-' + Math.random()),
                user: 'BARTENDER SCRUFFY',
                text: data.text || '🚨 REMOTE SHAKE RECEIVED! THE BAR IS SHAKING!',
                mediaUrl: data.mediaUrl || data.gifUrl || data.media_url || data.image || null,
                color: '#FF5910',
                isSystem: true
              }
            ]);
          } else if (data.type === "SPAM_GIF" || data.type === "PRECOG_EVENT") {
            if (data.shake) {
              triggerRoomShake();
            }
            setMessages(prev => {
              const incomingText = data.text || `Precog Broadcast: ${data.event || 'Major Play Event'}`;
              const mediaUrl = data.mediaUrl || data.gifUrl || data.media_url || data.image || null;
              if (prev.some(m => m.user === data.user && m.text === incomingText && m.mediaUrl === mediaUrl)) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: data.id || (Date.now() + '-' + Math.random()),
                  user: data.user || 'PRECOG SEEDING',
                  text: incomingText,
                  mediaUrl: mediaUrl,
                  color: '#FF5910',
                  isSystem: true
                }
              ];
            });
            setIsTyping(false);
          } else if (data.type === "BOGGS_LEVEL_UPDATE" || data.type === "boggs_level") {
            const lvl = parseInt(data.level, 10);
            if (!isNaN(lvl)) {
              setBoggsLevel(lvl);
              localStorage.setItem('sovereign_boggs_override', String(lvl));
            }
          } else if (data.type === "CHAT_MESSAGE") {
            setMessages(prev => {
              const incomingText = typeof data.text === 'string' ? data.text.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim() : JSON.stringify(data.text || data.message);
              const mediaUrl = data.mediaUrl || data.media_url || data.image || null;
              // Strict Vite HMR Deduplication
              if (prev.some(m => m.user === data.user && m.text === incomingText && m.mediaUrl === mediaUrl)) {
                return prev;
              }

              if (data.shake) {
                triggerRoomShake();
              }

              return [...prev, {
                id: data.id || (Date.now() + '-' + Math.random()),
                user: data.user,
                text: incomingText,
                mediaUrl: mediaUrl,
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
        if (activeGamedayPk === "823620") {
          setActivePersonas(nymStlRoomOverrides.manual_participants.map(p => '@' + p.id));
          setActiveRoster(nymStlRoomOverrides.manual_participants.map(p => ({
            user_name: p.id,
            team: p.team_override || (p.id === 'pilot_james' ? 'NYM' : ''),
            color: p.id === 'pilot_james' ? '#FF6B00' : (p.team_override === 'NYM' ? '#FF5910' : '#B47AFF'),
            gemini_tokens: 0,
            local_tokens: 0
          })));
          setRoomGeminiTokens(data.room_gemini_tokens || 0);
          setRoomLocalTokens(data.room_local_tokens || 0);
          setRoomSysTokens(data.room_sys_tokens || 0);
        } else if (data.personas) {
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
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ -]*)$/);

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
        {activeGamedayPk || leftTab === 'spatial' ? (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden">
            {/* TABS CONTAINER */}
            <div className="flex gap-2 mb-4 shrink-0 border-b border-white/15 pb-4">
              <button
                onClick={() => setLeftTab('game')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all font-mono ${
                  leftTab === 'game' 
                    ? 'bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.25)]' 
                    : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                }`}
              >
                ⚾ GAME FEED
              </button>
              <button
                onClick={() => setLeftTab('spatial')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all font-mono ${
                  leftTab === 'spatial' 
                    ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.25)]' 
                    : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                }`}
              >
                📍 SPATIAL MAP
              </button>
            </div>

            {leftTab === 'game' ? (
              scoreboard && scoreboard.away && scoreboard.home ? (
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
              )
            ) : (
              /* SPATIAL REGISTRY MAP PANEL */
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar gap-4">
                <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-2xl p-4 flex flex-col gap-1.5 shrink-0">
                  <div className="text-fuchsia-400 font-bold text-xs tracking-widest uppercase flex items-center gap-2 font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                    </span>
                    Smyrna Heights Plat Grid
                  </div>
                  <p className="text-gray-400 text-[10px] font-mono leading-relaxed">
                    Active spatial neighborhood matrix. Direct coordinate-offset mapping inside sovereign_now.db.
                  </p>
                </div>

                {/* CSS Node Grid */}
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[160px] select-none shrink-0 overflow-hidden">
                  {/* Grid background lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                  
                  {/* Glowing Connection Matrix Paths */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Plat 1 to 5 */}
                    <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="rgba(217,70,239,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    {/* Plat 2 to 5 */}
                    <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="rgba(217,70,239,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    {/* Plat 3 to 5 */}
                    <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="rgba(217,70,239,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    {/* Plat 4 to 5 */}
                    <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="rgba(217,70,239,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                  </svg>

                  {/* Platforms */}
                  <div className="absolute top-[15%] left-[15%] flex flex-col items-center group/p1">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-[8px] font-bold text-cyan-400 font-mono shadow-[0_0_10px_rgba(6,182,212,0.3)]">01</div>
                    <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-widest">Gonzas</span>
                  </div>

                  <div className="absolute top-[15%] right-[15%] flex flex-col items-center group/p2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-[8px] font-bold text-amber-400 font-mono shadow-[0_0_10px_rgba(245,158,11,0.3)]">02</div>
                    <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-widest">Vickery</span>
                  </div>

                  {/* PLAT-05 Tavern Converged Hub */}
                  <div className="absolute top-[40%] left-[40%] flex flex-col items-center group/p5 scale-110">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-500/30 border-2 border-fuchsia-500 flex items-center justify-center text-xs font-black text-fuchsia-300 font-mono shadow-[0_0_20px_rgba(217,70,239,0.6)] animate-pulse">05</div>
                    <span className="text-[9px] text-fuchsia-400 font-bold font-mono mt-1.5 uppercase tracking-widest">Scruffy's</span>
                  </div>

                  <div className="absolute bottom-[15%] left-[15%] flex flex-col items-center group/p3">
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-[8px] font-bold text-teal-400 font-mono shadow-[0_0_10px_rgba(20,184,166,0.3)]">03</div>
                    <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-widest">Arcovet</span>
                  </div>

                  <div className="absolute bottom-[15%] right-[15%] flex flex-col items-center group/p4">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-[8px] font-bold text-green-400 font-mono shadow-[0_0_10px_rgba(34,197,94,0.3)]">04</div>
                    <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-widest">WildSeed</span>
                  </div>
                </div>

                {/* Plat details list */}
                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'PLAT-01', name: 'Gonzas Convenience Store', cart: 'Unhinged Convenience', desc: 'Supply chain hub; target for Wayne’s barter runs.', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' },
                    { id: 'PLAT-02', name: 'Vickery Hardware', cart: 'Anvil & Twine Hardware', desc: 'Tracks building/roof telemetry & hardware supply chains.', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
                    { id: 'PLAT-03', name: 'Arcovet Telemedicine', cart: 'AetherVet B2B', desc: 'Processes animal telemetry & backyard drone triage.', color: 'border-teal-500/30 text-teal-400 bg-teal-500/5' },
                    { id: 'PLAT-04', name: 'WeedStack Vape Portal', cart: 'WildSeed Client Node', desc: 'Maintains soil-to-solvent and METRC audit registries.', color: 'border-green-500/30 text-green-400 bg-green-500/5' },
                    { id: 'PLAT-05', name: 'Scruffy’s Tavern', cart: 'FanStack MLB Monolith', desc: 'Social Blender. All SmyrnaHeight advocates converge post-shift.', color: 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-500/10 shadow-[inset_0_0_10px_rgba(217,70,239,0.1)]' }
                  ].map(plat => (
                    <div key={plat.id} className={`border rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:scale-[1.01] ${plat.color}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs uppercase">{plat.name}</span>
                        <span className="text-[8px] font-mono font-black opacity-80 px-2 py-0.5 rounded border border-[currentColor]/30 uppercase tracking-widest">{plat.id}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-gray-500 uppercase font-bold">Stack: {plat.cart}</span>
                        <span className="text-[10px] font-mono text-gray-400 leading-normal">{plat.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden items-center justify-center">
            <h2 className="text-[#38bdf8] text-xs tracking-widest font-bold uppercase animate-pulse">Select a game from the slate</h2>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - CHAT */}
      <div 
        className={`flex-1 flex flex-col relative z-10 p-[2px] rounded-3xl overflow-hidden transition-all duration-300 ${
          isShaking ? 'shake-room' : ''
        } ${
          boggsLevel === 4 
            ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rainbow-border shadow-[0_0_35px_rgba(255,89,16,0.6)] crt-scanlines moving-grid' 
            : boggsLevel === 3
            ? 'bg-gradient-to-b from-purple-500 to-pink-500 border border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)] crt-scanlines moving-grid'
            : boggsLevel === 2
            ? 'bg-gradient-to-b from-cyan-500 to-purple-500 border border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] crt-scanlines'
            : boggsLevel === 1
            ? 'bg-gradient-to-b from-blue-500 to-cyan-500 border border-[#FF5910]/40 shadow-[0_0_15px_rgba(255,89,16,0.2)]'
            : 'bg-gradient-to-b from-cyan-400 to-fuchsia-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
        }`}
      >
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
              <>
                {/* BOGGS LEVEL SLIDER */}
                <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-3 py-1 rounded-lg font-mono text-[10px] font-bold tracking-widest">
                  <span className="text-[#FF5910] animate-pulse">🍺 BOGGS LEVEL: {boggsLevel}</span>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={boggsLevel}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setBoggsLevel(val);
                      localStorage.setItem('sovereign_boggs_override', String(val));
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                          type: "BOGGS_LEVEL_UPDATE",
                          level: val,
                          target_game_pk: activeGamedayPk || "GLOBAL"
                        }));
                      }
                    }}
                    className="w-20 accent-[#FF5910] cursor-pointer"
                  />
                  <span className="text-gray-400 min-w-[70px]">
                    {boggsLevel === 0 ? 'CHILL' : boggsLevel === 1 ? 'ENGAGED' : boggsLevel === 2 ? 'TENSE' : boggsLevel === 3 ? 'FEVER' : 'MAX BOGGS!'}
                  </span>
                </div>

                <button 
                  onClick={toggleVertexBurn}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-bold text-[10px] font-mono tracking-widest transition-all ${vertexBurnEnabled ? 'bg-[#ff5910]/20 border-[#ff5910] text-[#ff5910]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                  title="When ON, all personas are hard-locked to Gemini 2.5 Flash using Enterprise Promos."
                >
                  <span>🔥 VERTEX BURN</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${vertexBurnEnabled ? 'bg-[#ff5910]' : 'bg-gray-600'}`}></span>
                </button>
                <button
                  onClick={() => setIsRoomBuilderOpen(true)}
                  className="bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 rounded-lg px-3 py-1 text-[10px] font-bold tracking-widest text-[#38bdf8] transition-all flex items-center gap-2 uppercase font-mono"
                >
                  BUILD ROOM
                </button>
                {/* STRY1779341054 — Export Game Log */}
                <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                  {(['md', 'json', 'csv'] as const).map(fmt => {
                    const colors: Record<string, string> = { md: '#38bdf8', json: '#a855f7', csv: '#22c55e' };
                    const c = colors[fmt];
                    return (
                      <button
                        key={fmt}
                        onClick={() => {
                          if (activeGamedayPk) {
                            window.open(`/api/game-log/export/${activeGamedayPk}/${fmt}`, '_blank');
                          } else {
                            let content = '';
                            let mediaType = 'text/plain';
                            let extension = 'txt';

                            if (fmt === 'json') {
                              content = JSON.stringify(messages, null, 2);
                              mediaType = 'application/json';
                              extension = 'json';
                            } else if (fmt === 'csv') {
                              const escapeCsv = (str: string) => {
                                const escaped = (str || '').replace(/"/g, '""');
                                return `"${escaped}"`;
                              };
                              content = "Timestamp,Type,Author,Message\n" + messages.map(m => {
                                const ts = new Date(m.id || Date.now()).toISOString();
                                return `${escapeCsv(ts)},${escapeCsv(m.type)},${escapeCsv(m.author)},${escapeCsv(m.text)}`;
                              }).join('\n');
                              mediaType = 'text/csv';
                              extension = 'csv';
                            } else {
                              // markdown
                              content = `# 📋 FanStack Session Buffer Export\n\nExported: ${new Date().toISOString()}\n\n---\n\n## Chronological Log\n\n`;
                              content += messages.map(m => {
                                const ts = new Date(m.id || Date.now()).toLocaleTimeString();
                                if (m.type === 'telemetry') {
                                  return `**[${ts}]** ⚾ **${m.author}**\n> ${m.text}\n`;
                                } else if (m.type === 'system') {
                                  return `**[${ts}]** ⚙️ **${m.author}**\n> ${m.text}\n`;
                                } else if (m.type === 'broadcast') {
                                  return `**[${ts}]** 📢 **${m.author}**\n> ${m.text}\n`;
                                } else {
                                  return `**[${ts}]** 🗣️ **${m.author.toUpperCase()}**\n> ${m.text}\n`;
                                }
                              }).join('\n');
                              mediaType = 'text/markdown';
                              extension = 'md';
                            }

                            const dataStr = `data:${mediaType};charset=utf-8,` + encodeURIComponent(content);
                            const a = document.createElement('a');
                            a.href = dataStr;
                            a.download = `fanstack_session_${Date.now()}.${extension}`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }
                        }}
                        className="px-2 py-1 rounded-md border font-bold text-[9px] font-mono tracking-widest uppercase transition-all hover:opacity-100 opacity-70"
                        style={{ borderColor: `${c}40`, color: c, backgroundColor: `${c}10` }}
                        title={`Export game log as ${fmt.toUpperCase()}`}
                      >
                        ↓{fmt}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <span className="text-gray-400 text-sm font-mono">{activePersonas.length + 1} Active</span>
            <div className="relative flex -space-x-2 group/roster">
              {[...activePersonas.slice(0, 3), "You"].map((p, i) => {
                const rawName = p.replace('@', '').toLowerCase();
                const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')];
                return imgSrc ? (
                  <img key={i} src={imgSrc} className="w-8 h-8 rounded-full border-2 border-[#111827] object-cover" alt={p} />
                ) : (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111827] bg-gradient-to-br from-[#38bdf8]/40 to-[#4facfe]/40"></div>
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
                  return (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {imgSrc ? (
                          <img src={imgSrc} className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0" alt={rawName} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#38bdf8]/40 to-[#4facfe]/40 border border-white/20 flex-shrink-0" />
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
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      {imgSrc ? (
                        <img src={imgSrc} className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0" alt={rawName} />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#38bdf8]/40 to-[#4facfe]/40 border border-white/20 flex-shrink-0" />
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

        <div className="flex flex-1 overflow-hidden relative">
          {boggsLevel === 4 && (
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 pointer-events-none z-0 opacity-35 animate-pulse"
            />
          )}
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative z-10"
          >
            {messages.map(m => {
              const isUser = m.user === (auth?.display_name || 'You (Fan)') || m.user === 'You (Fan)' || m.user === 'You';
              const rawName = m.user.replace('@', '').toLowerCase();
              const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')] || `/api/persona_image/${encodeURIComponent(rawName)}`;

              return (
                <div key={m.id} className={`max-w-[75%] flex gap-4 ${isUser ? 'self-end flex-row-reverse' : 'self-start'} group`}>

                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-auto mb-1">
                    {imgSrc ? (
                      <img src={imgSrc} className="w-10 h-10 rounded-full border border-transparent object-cover" style={{ borderColor: isUser ? '#38bdf8' : m.color }} alt={m.user} />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-white/10 to-white/5 border border-transparent" style={{ borderColor: isUser ? '#38bdf8' : m.color }}>
                        {m.user.charAt(0).toUpperCase()}
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
                      {m.mediaUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(255,89,16,0.2)] bg-black/40">
                          <img 
                            src={m.mediaUrl} 
                            alt="Precog Event Media" 
                            className="w-full max-h-[300px] object-cover hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
                            onClick={() => window.open(m.mediaUrl, '_blank')}
                          />
                        </div>
                      )}
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
        <div className="p-6 border-t border-white/5 bg-black/40 relative z-20 flex-shrink-0 backdrop-blur-xl">
          {mentionState.active && filteredPersonas.length > 0 && (
            <div className="absolute bottom-full left-6 mb-4 w-64 max-h-[40vh] overflow-y-auto custom-scrollbar bg-[#0A0D12]/95 backdrop-blur-xl border border-[#38bdf8]/40 rounded-xl p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-1">
              {filteredPersonas.map((p, i) => {
                const rawName = p.replace('@', '').toLowerCase();
                const imgSrc = avatarMap[rawName] || avatarMap[rawName.replace(/_/g, '')] || `/api/persona_image/${rawName}`;
                return (
                  <div
                    key={p}
                    onClick={() => handleMentionSelect(p)}
                    onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: i }))}
                    className={`px-3 py-2 cursor-pointer rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${i === mentionState.selectedIndex ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-gray-300 hover:bg-white/5'}`}
                  >
                    <img
                      src={imgSrc}
                      className={`w-6 h-6 rounded-full object-cover border ${i === mentionState.selectedIndex ? 'border-[#38bdf8]' : 'border-white/20'}`}
                      onError={(e) => {
                        e.currentTarget.src = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';
                      }}
                      alt={p}
                    />
                    {p}
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="mt-4 flex gap-4 w-full items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*" 
              style={{ display: 'none' }} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-[#38bdf8]/10 text-gray-300 hover:text-[#38bdf8] p-4 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 flex-shrink-0"
              title="Attach media to chat"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Join the Global Conversation... (Use @ to mention)"
              className="flex-1 bg-black/60 border border-white/10 text-white px-6 py-4 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono shadow-inner min-w-0"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-widest uppercase px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.4)] flex-shrink-0"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>

      {/* ROOM BUILDER MODAL */}
      {isRoomBuilderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-6 animate-fade-in">
          <div className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-[#38bdf8]/30 rounded-3xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-white/10 shrink-0 gap-4 bg-black/40">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3 font-display">
                  👑 ROOM BUILDER MATRIX
                </h2>
                <p className="text-gray-400 mt-1 font-mono text-xs uppercase tracking-wider">
                  Assign active personas to Game {activeGamedayPk} Room
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
                  onClick={saveRoomPersonas} 
                  className="px-6 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black uppercase tracking-widest text-xs font-mono transition-all hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95"
                >
                  Save & Re-provision Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
