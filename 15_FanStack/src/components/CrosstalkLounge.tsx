import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Users, Radio } from 'lucide-react';

export interface ChatMessage {
  id: string;
  persona_name: string;
  avatar_url: string;
  hex: string;
  text: string;
  timestamp: string;
  model?: string;
  is_telemetry?: boolean;
  user?: string;
}

interface CrosstalkLoungeProps {
  messages: ChatMessage[];
  onPromote?: (id: string, text: string) => void;
  promotedIds?: string[];
}

export default function CrosstalkLounge({ messages, onPromote, promotedIds = [] }: CrosstalkLoungeProps) {
  const boothEndRef = useRef<HTMLDivElement>(null);
  const crowdEndRef = useRef<HTMLDivElement>(null);

  // Canonical booth personas loaded from database
  const [boothPersonas, setBoothPersonas] = useState<Set<string>>(new Set());

  // Message queue-based rendering state
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
  const queueRef = useRef<ChatMessage[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  // Fetch canonical booth personas from DB via API
  useEffect(() => {
    fetch('/api/all_personas')
      .then(res => res.json())
      .then(data => {
        const boothNames = new Set<string>();
        const targetUserNames = ['gary_bot', 'ron_bot', 'keith_fanboy'];
        (data.personas || []).forEach((p: any) => {
          if (targetUserNames.includes(p.user_name.toLowerCase())) {
            boothNames.add(p.display_name.toLowerCase());
            boothNames.add(p.user_name.toLowerCase());
          }
        });
        setBoothPersonas(boothNames);
      })
      .catch(err => console.error("Failed to load booth personas", err));
  }, []);

  const isBoothPersona = (msg: ChatMessage) => {
    const name = (msg.persona_name || '').toLowerCase();
    const user = (msg.user || '').toLowerCase();
    if (boothPersonas.size > 0) {
      return boothPersonas.has(name) || boothPersonas.has(user);
    }
    // Fallback if not loaded yet
    return name.includes('gary') || name.includes('keith') || name.includes('ron') ||
           user.includes('gary') || user.includes('keith') || user.includes('ron');
  };

  const queuedIdsRef = useRef<Set<string>>(new Set());

  // Handle new incoming messages via batching queue
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayedMessages([]);
      queueRef.current = [];
      queuedIdsRef.current.clear();
      isProcessingQueueRef.current = false;
      return;
    }

    // If it's the first load (queuedIds is empty), load everything immediately
    if (queuedIdsRef.current.size === 0) {
      messages.forEach(m => queuedIdsRef.current.add(m.id));
      setDisplayedMessages(messages);
      return;
    }

    // Otherwise, handle new messages via batching queue
    const newMessages = messages.filter(m => !queuedIdsRef.current.has(m.id));

    if (newMessages.length > 0) {
      // Mark as queued immediately to prevent duplicate queuing
      newMessages.forEach(m => queuedIdsRef.current.add(m.id));
      
      queueRef.current = [...queueRef.current, ...newMessages];

      if (!isProcessingQueueRef.current) {
        isProcessingQueueRef.current = true;

        const processQueue = () => {
          if (queueRef.current.length === 0) {
            isProcessingQueueRef.current = false;
            return;
          }

          const queueLength = queueRef.current.length;
          let batchSize = 1;
          if (queueLength > 10) {
            batchSize = Math.min(5, queueLength);
          } else if (queueLength > 4) {
            batchSize = 2;
          }

          const batch = queueRef.current.slice(0, batchSize);
          queueRef.current = queueRef.current.slice(batchSize);

          setDisplayedMessages(prev => {
            const nextMessages = [...prev, ...batch];
            if (nextMessages.length > 100) {
              return nextMessages.slice(nextMessages.length - 100);
            }
            return nextMessages;
          });

          setTimeout(processQueue, 100);
        };

        processQueue();
      }
    }
  }, [messages]);

  const boothMessages = displayedMessages.filter(isBoothPersona);
  const crowdMessages = displayedMessages.filter(msg => !isBoothPersona(msg));

  // Auto-scroll each section when new messages arrive
  useEffect(() => {
    boothEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [boothMessages.length]);

  useEffect(() => {
    crowdEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [crowdMessages.length]);

  return (
    <div className="flex flex-col h-full w-full bg-[#090e1a] text-slate-100 overflow-hidden select-none">
      
      {/* 35% Top Panel: 3-Man Booth */}
      <div className="h-[35%] flex flex-col border-b-2 border-[#ff5910] min-h-0 bg-[#0c1324]/50">
        <div className="h-8 shrink-0 bg-[#0d1527] border-b border-[#ff5910]/40 flex items-center px-3 justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5910] flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> 3-MAN BOOTH AUDIO
          </span>
          <span className="text-[8px] bg-[#ff5910]/15 text-[#ff5910] px-1.5 py-0.5 rounded border border-[#ff5910]/30 font-mono uppercase font-bold tracking-widest">
            PINNED
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {boothMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[9px] text-[#ff5910]/60 font-mono tracking-widest uppercase">
              Awaiting Booth Commentary...
            </div>
          ) : (
            boothMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2.5 bg-[#090e1a] border border-[#ff5910]/30 p-2">
                <img 
                  src={msg.avatar_url} 
                  alt="" 
                  className="w-7 h-7 rounded-none object-cover border border-[#ff5910]" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-black uppercase tracking-wide" style={{ color: msg.hex }}>
                      {msg.persona_name}
                    </span>
                    <span className="bg-[#ff5910] text-[#090e1a] text-[7px] font-extrabold px-1 rounded-sm uppercase tracking-wide leading-none">
                      BOOTH
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-200 font-sans font-medium">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={boothEndRef} />
        </div>
      </div>

      {/* 65% Bottom Panel: Crowd Chat */}
      <div className="h-[65%] flex flex-col min-h-0 bg-[#090e1a]">
        <div className="h-8 shrink-0 bg-[#0d1527] border-b border-[#00b4d8]/40 flex items-center px-3 justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00b4d8] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> COMMUNITY LOUNGE
          </span>
          <span className="text-[8px] text-white/40 font-mono">
            {crowdMessages.length} GUESTS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {crowdMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[9px] text-[#00b4d8]/60 font-mono tracking-widest uppercase">
              Initializing Chatroom...
            </div>
          ) : (
            crowdMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2 p-1.5 transition-colors border border-transparent hover:border-[#00b4d8]/20 ${
                  promotedIds.includes(msg.id) ? 'bg-[#facc15]/10 border-[#facc15]/30' : ''
                }`}
              >
                <img 
                  src={msg.avatar_url} 
                  alt="" 
                  className="w-5.5 h-5.5 rounded-none object-cover border border-white/10" 
                />
                <div className="flex-1 min-w-0 text-[12px] leading-snug font-sans">
                  <div className="flex items-center gap-1 mr-2 font-bold inline">
                    <span className="font-extrabold" style={{ color: msg.hex }}>
                      {msg.persona_name}
                    </span>
                    {msg.persona_name === 'Wardy' || msg.persona_name === 'Jolly Olive' ? (
                      <span className="bg-red-600 text-white text-[7px] px-1 rounded-sm uppercase tracking-wide leading-none font-black">
                        HOST
                      </span>
                    ) : (
                      <span className="bg-[#00b4d8]/20 text-[#00b4d8] text-[7px] px-1 rounded-sm uppercase tracking-wide leading-none font-bold">
                        VIP
                      </span>
                    )}
                  </div>
                  <span className="text-slate-200/90 whitespace-pre-wrap break-words">
                    {msg.text}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={crowdEndRef} />
        </div>
      </div>

    </div>
  );
}
