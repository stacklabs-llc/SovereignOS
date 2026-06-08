import React, { useState, useEffect, useRef } from 'react';
import { getWsUrl } from '../api-host';
import { useAuth } from '../contexts/AuthContext';
import { Flame, ShieldAlert, Wifi, Send, AlertTriangle } from 'lucide-react';

const avatarFallbacks: { [key: string]: string } = {
  dr_terp: '🔬',
  outdoor_oracle: '☀️',
  compliance_karen: '📋',
  dispo_vet: '🛍️',
  bt4991_believer: '🛸',
  pilot: '⬡',
  system: '🤖'
};

const colorMap: { [key: string]: string } = {
  dr_terp: '#00d4ff',
  outdoor_oracle: '#38bdf8',
  compliance_karen: '#f59e0b',
  dispo_vet: '#ec4899',
  bt4991_believer: '#e0f2fe',
  pilot: '#10b981',
  system: '#6b7280'
};

export default function FanStackRoom() {
  const auth = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeEvents, setActiveEvents] = useState<any[]>([
    { id: '1', headline: 'WeedStack Farms Autumn Harvest', content: 'Harvest of organic sun-grown WeedStack landrace genetics has officially commenced.', tag: 'OUTDOOR' },
    { id: '2', headline: 'METRC System Latency Alerts', content: 'Cultivators reporting latency issues in seed-to-sale tag generation.', tag: 'METRC' },
    { id: '3', headline: 'BT4991 Cannabinoid Rumors', content: 'Discussion swelling around the potential discovery of a hidden chemotype.', tag: 'BT4991' }
  ]);
  const [penaltyBoxUsers, setPenaltyBoxUsers] = useState<string[]>([]);
  const [burnCounts, setBurnCounts] = useState<{ [key: string]: number }>({});
  
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
            // Check for System warnings regarding bans, escapes, burns
            const textLower = String(data.text).toLowerCase();
            const userLower = String(data.user).toLowerCase();
            
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
                color: data.color || colorMap[userLower] || '#10b981',
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

    // Fetch initial penalty status
    fetch('/api/tickets/STRY1779936909').catch(() => {}); // Heartbeat / pre-load

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

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

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0B0E14] text-white overflow-hidden">
      {/* LEFT COLUMN: ADVOCATE TELEMETRY & EVENTS */}
      <div className="w-80 border-r border-[#10b981]/20 bg-[#0f172a]/40 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="border border-[#10b981]/30 rounded-xl p-4 bg-[#10b981]/5 shadow-inner">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#10b981] mb-2 flex items-center gap-2">
            🌿 Advocate Status
          </h2>
          <div className="flex flex-col gap-2.5">
            {Object.keys(avatarFallbacks).slice(0, 5).map((userKey) => {
              const b = penaltyBoxUsers.includes(userKey);
              const burns = burnCounts[userKey] || 0;
              const display = userKey.replace('_', ' ').toUpperCase();
              return (
                <div key={userKey} className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{avatarFallbacks[userKey]}</span>
                    <span className="font-bold font-mono tracking-wide" style={{ color: colorMap[userKey] }}>
                      {display}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {burns > 0 && (
                      <span className="flex items-center text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                        <Flame className="w-3 h-3 fill-amber-400 mr-0.5" /> {burns}
                      </span>
                    )}
                    {b ? (
                      <span className="flex items-center text-[9px] text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded border border-red-500/20">
                        <ShieldAlert className="w-3 h-3 mr-0.5" /> BANNED
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#10b981] font-bold bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CONTEXT EVENTS */}
        <div className="flex-1 flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-2">
            📡 Live Room Feed
          </h2>
          <div className="flex flex-col gap-2">
            {activeEvents.map((evt) => (
              <div key={evt.id} className="border border-white/10 rounded-lg p-3 bg-white/5 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {evt.tag}
                  </span>
                  <span className="text-[8px] text-white/40">INJECTED</span>
                </div>
                <h3 className="text-xs font-bold tracking-wide text-white/90 mb-1">{evt.headline}</h3>
                <p className="text-[10px] text-white/60 leading-relaxed font-sans">{evt.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: LIVE SIMULATED CHAT */}
      <div className="flex-1 flex flex-col bg-[#0F131A] relative">
        <div className="h-12 border-b border-[#10b981]/20 px-6 flex items-center justify-between bg-[#0B0E14]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <h1 className="text-sm font-bold font-mono tracking-wider">
              WEEDSTACK SIMULATED ENVIRONMENT [WEEDSTACK_SIM_001]
            </h1>
          </div>
          <div className="flex items-center gap-2 border border-[#10b981]/30 px-3 py-1 rounded bg-[#10b981]/5 text-[10px] text-[#10b981] font-mono font-bold tracking-widest uppercase">
            <Wifi className="w-3 h-3 animate-pulse" /> M.A.R.D. RELAY ONLINE
          </div>
        </div>

        {/* MESSAGES FLOW */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 font-mono">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 gap-2">
              <span className="text-3xl animate-bounce">📡</span>
              <p className="text-xs font-bold uppercase tracking-widest font-mono">Synchronizing telemetry data...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const userLower = msg.user.toLowerCase();
              const isSys = msg.isSystem;
              
              if (isSys) {
                return (
                  <div key={msg.id} className="flex justify-center my-1.5">
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2 rounded-lg text-xs leading-relaxed max-w-lg font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{avatarFallbacks[userLower] || '👤'}</span>
                    <span className="text-xs font-bold tracking-wide" style={{ color: msg.color }}>
                      {msg.user.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">
                      {msg.user === 'Pilot' ? 'CREATOR' : 'ADVOCATE'}
                    </span>
                  </div>
                  <div className="pl-6 max-w-2xl">
                    <div className="bg-[#0B0E14]/70 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-white/90 leading-relaxed font-sans shadow-md hover:border-[#10b981]/20 transition-all">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INPUT BOX */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[#10b981]/20 bg-[#0B0E14] flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Broadcast message to WeedStack advocates or trigger penalty box escape..."
            className="flex-1 bg-[#0F131A] text-white text-xs border border-[#10b981]/30 rounded-xl px-4 py-3 outline-none focus:border-[#10b981] font-mono tracking-wide placeholder-white/30 transition-all"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-[#0B0E14] font-bold rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-[#10b981]/20"
          >
            <Send className="w-4.5 h-4.5" /> Broadcast
          </button>
        </form>
      </div>
    </div>
  );
}
