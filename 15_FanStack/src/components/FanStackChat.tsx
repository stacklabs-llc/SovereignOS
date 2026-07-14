import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getWsUrl, getApiBase } from '../api-host';
import { Film, CheckCircle, Phone, PhoneOff, Loader2 } from 'lucide-react';
import CrosstalkLounge from './CrosstalkLounge';

interface Message {
  id: string;
  persona_name: string;
  avatar_url: string;
  hex: string;
  text: string;
  timestamp: string;
  model?: string;
  user?: string;
}

// ── Model badge helpers ───────────────────────────────────────────────────────
function getModelLabel(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('2.5') && m.includes('pro'))   return 'G2.5P';
  if (m.includes('2.5') && m.includes('flash')) return 'G2.5F';
  if (m.includes('2.0') && m.includes('flash')) return 'G2.0F';
  if (m.includes('1.5') && m.includes('pro'))   return 'G1.5P';
  if (m.includes('1.5') && m.includes('flash')) return 'G1.5F';
  if (m.includes('gemini'))                     return 'GEM';
  if (m.includes('llama'))                      return 'LLAMA';
  if (m.includes('ollama') || m.includes('local')) return 'LOCAL';
  if (m.includes('claude'))                     return 'CLDE';
  return model.slice(0, 6).toUpperCase();
}

function getModelColor(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('2.5') && m.includes('pro'))   return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  if (m.includes('2.5'))                         return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  if (m.includes('2.0'))                         return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (m.includes('1.5') && m.includes('pro'))   return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  if (m.includes('gemini'))                     return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (m.includes('llama') || m.includes('ollama') || m.includes('local')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (m.includes('claude'))                     return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  return 'bg-white/10 text-white/50 border-white/20';
}

interface FanStackChatProps {
    onMeltdown?: (state: boolean) => void;
    activeGamedayPk?: string;
    roomId?: string;
}

// ── Persona Call Widget ──────────────────────────────────────────────────────
type CallState = 'idle' | 'connecting' | 'active' | 'busy' | 'error';

const ROOM_PERSONA: Record<string, string> = {
  scruffys:        'Barf',
  the_press_box:   'Wardy',
  bullpen_sessions:'Scruffy',
  default:         'Barf',
};

function PersonaCallWidget({ roomId = 'scruffys' }: { roomId: string }) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string>('');
  const pcRef      = useRef<RTCPeerConnection | null>(null);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const personaName = ROOM_PERSONA[roomId] ?? ROOM_PERSONA['default'];
  const apiBase = getApiBase();

  const startCall = useCallback(async () => {
    setCallState('connecting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Send mic to server
      stream.getAudioTracks().forEach(t => pc.addTrack(t, stream));

      // Receive persona audio
      pc.ontrack = (e) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.autoplay = true;
        }
        audioRef.current.srcObject = e.streams[0];
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // ICE gathering
      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve();
        };
        setTimeout(resolve, 3000); // max 3s gathering
      });

      const res = await fetch(`${apiBase}/api/persona-call/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
          room_id: roomId,
          fan_id: 'fan_' + Math.random().toString(36).slice(2, 8),
        })
      });

      if (res.status === 409) {
        const d = await res.json();
        setCallState('busy');
        setErrorMsg(d.message ?? `${personaName} is on another call 🍺`);
        pc.close(); return;
      }
      if (!res.ok) { throw new Error(`Server error ${res.status}`); }

      const answer = await res.json();
      setSessionId(answer.session_id);
      await pc.setRemoteDescription({ sdp: answer.sdp, type: answer.type });
      setCallState('active');

    } catch (e: any) {
      console.error('[PersonaCall]', e);
      setCallState('error');
      setErrorMsg(e.message ?? 'Connection failed');
      pcRef.current?.close();
    }
  }, [roomId, apiBase, personaName]);

  const endCall = useCallback(async () => {
    if (sessionId) {
      fetch(`${apiBase}/api/persona-call/hangup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      }).catch(() => {});
    }
    pcRef.current?.close();
    pcRef.current = null;
    if (audioRef.current) { audioRef.current.srcObject = null; }
    setSessionId(null);
    setCallState('idle');
  }, [sessionId, apiBase]);

  // Auto-reset busy state after 5s
  useEffect(() => {
    if (callState === 'busy' || callState === 'error') {
      const t = setTimeout(() => setCallState('idle'), 5000);
      return () => clearTimeout(t);
    }
  }, [callState]);

  if (callState === 'active') {
    return (
      <button
        onClick={endCall}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-mono text-[9px] uppercase font-bold tracking-[0.15em] hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all animate-pulse cursor-pointer"
      >
        <PhoneOff className="w-3 h-3" /> Live with {personaName}
      </button>
    );
  }
  if (callState === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 font-mono text-[9px] uppercase font-bold tracking-[0.15em]">
        <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
      </div>
    );
  }
  if (callState === 'busy' || callState === 'error') {
    return (
      <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-mono text-[9px] uppercase font-bold tracking-[0.1em] max-w-[160px] truncate" title={errorMsg}>
        {callState === 'busy' ? `🍺 ${personaName} is busy` : '⚠ Call failed'}
      </div>
    );
  }
  return (
    <button
      onClick={startCall}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/40 rounded-lg text-[#22c55e] font-mono text-[9px] uppercase font-bold tracking-[0.15em] hover:bg-[#22c55e]/25 hover:border-[#22c55e]/70 transition-all cursor-pointer"
    >
      <Phone className="w-3 h-3" /> Call {personaName}
    </button>
  );
}


const FanStackChat: React.FC<FanStackChatProps> = ({ onMeltdown, activeGamedayPk, roomId = 'scruffys' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeGamedayPkRef = useRef(activeGamedayPk);

  // Sync ref to always have latest activeGamedayPk
  useEffect(() => {
    activeGamedayPkRef.current = activeGamedayPk;
  }, [activeGamedayPk]);

  const handlePromote = (id: string, text: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: "PROMOTE_COULDA_BEEN", message_id: id, text }));
      }
      setPromotedIds(prev => [...prev, id]);
  };

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
    }

    console.log('[WebSocket] Connecting to relay...');
    const socket = new WebSocket(getWsUrl('/ws'));
    ws.current = socket;

    socket.onopen = () => {
        console.log('[WebSocket] Connection established.');
        if (activeGamedayPkRef.current) {
            socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: activeGamedayPkRef.current }));
        }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "CHAT_HISTORY") {
         const mapped = (data.messages || []).map((msg: any) => ({
           ...msg,
           model: msg.model || msg.model_used || msg.engine || undefined,
         }));
         setMessages(mapped);
      } else if (data.id && data.persona_name) {
         setMessages((prev) => [...prev, {
           ...data,
           model: data.model || data.model_used || data.engine || undefined,
         } as Message]);
      }
    };

    socket.onclose = (event) => {
        console.log('[WebSocket] Connection closed. Attempting reconnect in 2s...', event.reason);
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
            connect();
        }, 2000);
    };

    socket.onerror = (err) => {
        console.error('[WebSocket] Error encountered, closing socket:', err);
        socket.close();
    };
  }, []);

  useEffect(() => {
    connect();

    // WAL-Optimized Polling Heartbeat (500ms)
    // Ensures the Python M.A.R.D backend loop ticks constantly to intercept em_alert without UI stutter
    const pulseInterval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "SYNC_TICK", timestamp: Date.now() }));
        }
    }, 500);

    return () => {
        clearInterval(pulseInterval);
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        if (ws.current) {
            ws.current.onclose = null; // Prevent reconnect on deliberate unmount
            ws.current.close();
        }
    };
  }, [connect]);

  // Handle room changes dynamically without reconnecting the socket
  useEffect(() => {
    setMessages([]);
    if (ws.current?.readyState === WebSocket.OPEN && activeGamedayPk) {
      ws.current.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: activeGamedayPk }));
    }
  }, [activeGamedayPk]);

  // Auto-scroll logic
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] overflow-hidden rounded-br-xl relative">
      {/* Header bar: Persona Call + Copium buttons */}
      <div className="absolute top-3 right-4 z-50 flex items-center gap-2">
        <PersonaCallWidget roomId={roomId} />
        <button
          onClick={(e) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: "COPIUM_PROTOCOL", severity: "MAX" }));
            }
            e.currentTarget.innerHTML = "🚨 THERAPY MODE ENGAGED";
            e.currentTarget.classList.add("animate-pulse", "bg-[#A84B4B]", "text-white");
          }}
          className="px-3 py-1.5 bg-[#A84B4B]/20 border border-[#A84B4B]/50 rounded-lg text-[#A84B4B] font-mono text-[9px] uppercase font-bold tracking-[0.2em] hover:bg-[#A84B4B] hover:text-white transition-all cursor-pointer"
        >
          🆘 Mets Copium Support
        </button>
      </div>

      <div className="flex-1 overflow-hidden pt-14">
        <CrosstalkLounge 
          messages={messages} 
          onPromote={handlePromote} 
          promotedIds={promotedIds} 
        />
      </div>
    </div>
  );
};

export default FanStackChat;
