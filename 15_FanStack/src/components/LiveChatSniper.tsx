import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ClipboardCopy, X, MessageSquare, Activity, LayoutDashboard, MoreHorizontal, Check } from 'lucide-react';
import avatarMap from '../avatarMap';
import LivingKanbanBoard from './LivingKanbanBoard';

interface LiveChatSniperProps {
  onClose?: () => void;
  globalBoggsOverride?: string;
}

export default function LiveChatSniper({ onClose, globalBoggsOverride }: LiveChatSniperProps) {
  const [panelists, setPanelists] = useState<{ id: string, name: string, alias: string }[]>([
    { id: 'dot',               name: 'dot',               alias: 'Dot'           },
    { id: 'wardy',             name: 'wardy',             alias: 'Wardy'         },
    { id: '7_train_terry',     name: '7_train_terry',     alias: 'Terry'         },
    { id: 'uncle_stevie_stan', name: 'uncle_stevie_stan', alias: 'Uncle Stevie'  },
    { id: 'barf',              name: 'barf',              alias: 'Barf'          },
  ]);
  const [messages, setMessages] = useState<{ id: string, author: string, text: string, timestamp: number }[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [hotTopic, setHotTopic] = useState("Awaiting Stream Target...");
  
  const [userChatInput, setUserChatInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [replyTarget, setReplyTarget] = useState<{author: string, text: string} | null>(null);
  const [snifferKeywords, setSnifferKeywords] = useState<string[]>(['Mendoza', 'fire', 'Benge']);
  const [keywordInput, setKeywordInput] = useState('');
  const [sniffedMessages, setSniffedMessages] = useState<{id: string, author: string, text: string, timestamp: number}[]>([]);
  const keywordsRef = useRef<string[]>(snifferKeywords);
  
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [isTailing, setIsTailing] = useState(false);
  const [isGemini, setIsGemini] = useState(true);
  const [lastShot, setLastShot] = useState<{persona: string, text: string} | null>(null);
  const [shotCopied, setShotCopied] = useState(false);
  const [shotModal, setShotModal] = useState<{persona: string, text: string, loading: boolean} | null>(null);
  const [personaData, setPersonaData] = useState<Record<string, {system_prompt: string, deep_lore: string}>>({});

  const PERSONA_VOICES: Record<string, string> = {
    dot: "You are Dot, a sharp Mets stat analyst. Concise, data-driven, sometimes sarcastic. Keep it under 200 characters.",
    wardy: "You are Wardy, the WardyNYM host — passionate, opinionated Mets fan who keeps it real. Under 200 characters.",
    '7_train_terry': "You are 7 Train Terry, a hardcore Queens Mets lifer who rides the 7 train to Citi Field every game. Raw, loud, loyal. Under 200 characters.",
    uncle_stevie_stan: "You are Uncle Stevie Stan, an old-school Mets die-hard who remembers '86 and has been suffering ever since. Emotionally scarred but still here. Under 200 characters.",
    barf: "You are BatteryBarf, a Mets fan so disgusted by this team that you are perpetually on the edge of vomiting, yet cannot stop watching. Under 200 characters.",
  };

  // Load full persona system prompts from DB on mount
  useEffect(() => {
    fetch('/api/all_personas').then(r => r.json()).then(d => {
      const map: Record<string, {system_prompt: string, deep_lore: string, behavior_notes: string}> = {};
      (d.personas || []).forEach((p: any) => {
        map[p.user_name.toLowerCase()] = { system_prompt: p.system_prompt || '', deep_lore: p.deep_lore || '', behavior_notes: p.behavior_notes || '' };
      });
      setPersonaData(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
     keywordsRef.current = snifferKeywords;
  }, [snifferKeywords]);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom || messages.length <= 50) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 50);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!youtubeVideoId) {
      setMessages([]);
      setSniffedMessages([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const isHTTPS = window.location.protocol === "https:";
    const wsProtocol = isHTTPS ? "wss://" : "ws://";
    const wsHost = isHTTPS ? window.location.host : `${window.location.hostname}:8000`;
    const wsUrl = `${wsProtocol}${wsHost}/ws`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: 'live_chat_sniper' }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_HISTORY' && Array.isArray(data.messages)) {
            const historyMsgs = data.messages
              .filter((m: any) => (m.target_game_pk === 'live_chat_sniper' || m.type === 'YOUTUBE_CHAT') && (m.type === 'CHAT_MSG' || m.type === 'CHAT_MESSAGE' || m.type === 'YOUTUBE_CHAT') && m.type !== 'SYS_LOG' && m.user !== 'SYSTEM' && m.author !== 'SYSTEM')
              .map((m: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                author: m.user || m.author || 'Unknown',
                text: m.text,
                timestamp: Date.now() // Fake timestamp since relay sends string timestamp
            }));
            setMessages(historyMsgs.slice(-200)); // Load last 200
        } else if (data.type === 'CHAT_MSG' || data.type === 'CHAT_MESSAGE' || data.type === 'YOUTUBE_CHAT') {
           if (data.type === 'SYS_LOG' || data.user === 'SYSTEM' || data.author === 'SYSTEM') return;
           
           // Decouple/isolate entirely: ignore if not part of live_chat_sniper and not YOUTUBE_CHAT
           if (data.target_game_pk !== 'live_chat_sniper' && data.type !== 'YOUTUBE_CHAT') return;

           const msgId = Math.random().toString(36).substr(2, 9);
           const messageAuthor = data.user || data.author || 'Unknown';
           const newMsg = { id: msgId, author: messageAuthor, text: data.text, timestamp: Date.now() };
           setMessages(prev => [...prev.slice(-200), newMsg]);
           
           // If this is a panelist response — surface it as a SHOT READY and auto-copy
           const isPersonaMsg = panelists.some(p =>
               messageAuthor.toLowerCase().includes(p.id) ||
               messageAuthor.toLowerCase().includes(p.name.toLowerCase())
           );
           if (isPersonaMsg && data.text) {
               setLastShot({ persona: messageAuthor, text: data.text });
               setShotCopied(false);
               navigator.clipboard.writeText(data.text).catch(() => {});
           }
           
           if (data.type === 'YOUTUBE_CHAT') {
               const lowerText = data.text.toLowerCase();
               const isMatch = keywordsRef.current.some(kw => lowerText.includes(kw.toLowerCase()));
               if (isMatch) {
                   setSniffedMessages(prev => [newMsg, ...prev].slice(0, 15));
               }
           }
           
           // Web Speech API Integration
           if ('speechSynthesis' in window) {
               const utterance = new SpeechSynthesisUtterance(data.text);
               const authorLower = messageAuthor.toLowerCase();
               if (authorLower.includes('stormy')) {
                 utterance.pitch = 0.8; utterance.rate = 1.1; // Crisp, low legal cadence
               } else if (authorLower.includes('joy')) {
                 utterance.pitch = 1.4; utterance.rate = 1.35; // High pitch, frantic
               } else if (authorLower.includes('whoopsie')) {
                 utterance.pitch = 0.9; utterance.rate = 0.95; // Exhausted
               } else if (authorLower.includes('alyssa')) {
                 utterance.pitch = 1.5; utterance.rate = 1.15; // Anxious, young
               } else if (authorLower.includes('ana')) {
                 utterance.pitch = 0.95; utterance.rate = 1.05; // Sassy
               }
               // Add tiny variance to make it feel more conversational
               utterance.pitch += (Math.random() * 0.1 - 0.05);
               // window.speechSynthesis.speak(utterance); // Disabled per user request (creepy robotic voice)
           }
           
           const nameLower = messageAuthor.toLowerCase();
           setPanelists(currPanelists => {
               const panelistMatch = currPanelists.find(p => nameLower.includes(p.id) || nameLower.includes(p.name.toLowerCase()));
               if (panelistMatch) {
                   setActiveSpeaker(panelistMatch.id);
                   setTimeout(() => {
                       setActiveSpeaker(curr => curr === panelistMatch.id ? null : curr);
                   }, 4000);
               }
               // No fallback random assignment — red only fires for actual persona messages
               return currPanelists;
           });
        } else if (data.type === 'STATE_UPDATE' && data.data) {
           if (data.data.hot_topic !== undefined) setHotTopic(data.data.hot_topic);
           if (data.data.panelists !== undefined) setPanelists(data.data.panelists);
        }
      } catch (err) {}
    };

    return () => {
      socket.close();
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };
  }, [youtubeVideoId]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl transition-all duration-1000 flex flex-col font-sans ${isMeltingDown ? 'bg-[#1a0505] ' : 'bg-[#0B0E14] shadow-2xl'}`}>

       {/* SHOT MODAL — full-screen overlay with persona response for copy/paste */}
       <AnimatePresence>
       {shotModal && (
           <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
               onClick={(e) => { if (e.target === e.currentTarget) setShotModal(null); }}
           >
               <motion.div
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   exit={{ scale: 0.9, y: 20 }}
                   className="bg-[#0d1117] border-2 border-green-500 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-green-900/30"
               >
                   <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                           <span className="text-green-400 font-black uppercase tracking-widest text-sm">Shot Ready</span>
                           <span className="text-white/40 text-xs font-bold uppercase tracking-widest">— {shotModal.persona}</span>
                       </div>
                       <button onClick={() => setShotModal(null)} className="text-white/30 hover:text-white transition-colors"><X size={18}/></button>
                   </div>
                   {shotModal.loading ? (
                       <div className="flex items-center justify-center gap-3 py-10 text-white/50">
                           <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-sm font-bold uppercase tracking-widest">Generating...</span>
                       </div>
                   ) : (
                       <>
                           <textarea
                               readOnly
                               value={shotModal.text}
                               className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-base leading-relaxed resize-none outline-none select-all font-sans"
                               rows={5}
                               onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                               onFocus={(e) => e.target.select()}
                               autoFocus
                           />
                           <div className="flex items-center gap-3 mt-4">
                               <button
                                   onClick={() => { navigator.clipboard.writeText(shotModal.text); setShotModal(null); }}
                                   className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                               >
                                   <ClipboardCopy size={16}/> COPY &amp; CLOSE
                               </button>
                               <button
                                   onClick={() => setShotModal(null)}
                                   className="px-4 py-3 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-colors"
                               >Close</button>
                           </div>
                       </>
                   )}
               </motion.div>
           </motion.div>
       )}
       </AnimatePresence>
       
       {/* Top Nav Header */}
       <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20 shrink-0">
           <div className="flex items-center gap-4">
              <div className="font-display font-black text-2xl tracking-widest text-red-500 flex items-center gap-2">
                 LIVE CHAT SNIPER 
              </div>
              <div className="text-slate-400 text-xs font-bold tracking-widest uppercase border-l border-white/20 pl-4">Sniper Desk Active</div>
           </div>
       </div>

       {/* Producer Controls Overlay (Hidden by default, hover to show or keep small in corner) */}
       <div className="absolute top-20 right-6 z-50 flex flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
           <button onClick={() => window.history.back()} className="px-3 py-1 bg-black/50 border border-white/20 text-white/50 hover:bg-red-600 hover:text-white text-[10px] rounded"><X size={12} /></button>
           <button onClick={() => setIsMeltingDown(!isMeltingDown)} className="px-3 py-1 bg-black/50 border border-white/20 text-white/50 hover:bg-red-600 hover:text-white text-[10px] rounded">Meltdown</button>
       </div>

       <div className="flex-1 flex gap-6 p-4 overflow-hidden relative z-10 min-h-0">
           
           {/* LEFT MAIN AREA (flex-1) */}
           <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
               {/* Title Bar */}
               <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 shrink-0">
                  <div className="text-white font-bold tracking-widest uppercase text-sm">LIVE BROADCAST</div>
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black text-lg ">
                         {hotTopic.toLowerCase().includes('nfl') ? '🏈' : hotTopic.toLowerCase().includes('nba') ? '🏀' : '⚾'}
                      </div>
                      <div className="text-white font-bold tracking-widest uppercase text-sm mr-2">{hotTopic}</div>
                      
                      <div className="flex gap-2 items-center border-l border-white/20 pl-4 ml-2">
                          <input 
                              type="text" 
                              placeholder="Paste YouTube URL..." 
                              className="bg-black border border-[#FF5910]/50 rounded px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono text-white outline-none focus:border-[#FF5910] w-56  placeholder:text-white/30"
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                          />
                          <button 
                              onClick={async () => {
                                  if (!youtubeUrl) return;
                                  const match = youtubeUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
                                  const vid = match ? match[1] : youtubeUrl;
                                  setYoutubeVideoId(vid);
                                  setIsTailing(true);
                                  try {
                                      const res = await fetch('/api/snipe/tail', {
                                          method: 'POST',
                                          headers: {'Content-Type': 'application/json'},
                                          body: JSON.stringify({video_id: vid})
                                      });
                                       const data = await res.json();
                                       if (data.title) setHotTopic(data.title);
                                  } catch(e) { console.error("Failed to start tail", e); setIsTailing(false); }
                              }}
                              className="bg-[#FF5910] hover:bg-[#ff7b42] text-white text-[10px] font-bold px-4 py-1.5 rounded  transition-colors tracking-widest"
                          >
                              {isTailing ? "SNIPING..." : "SNIPE STREAM"}
                          </button>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <button 
                          onClick={() => setIsGemini(!isGemini)}
                          className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border transition-all ${isGemini ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 ' : 'bg-green-600/20 text-green-400 border-green-500/50 '}`}
                      >
                          {isGemini ? <Sparkles size={12} /> : <Activity size={12} />}
                          {isGemini ? 'CLOUD (GEMINI)' : 'EDGE (PHI-3)'}
                      </button>
                      <div className="bg-[#FF5910] text-black px-4 py-1.5 rounded font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ">
                          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div> LIVE
                      </div>
                  </div>
               </div>

               {/* Video Embed */}
               <div className="w-full flex-1 min-h-[320px] bg-black border border-[#FF5910]/30 rounded-xl overflow-hidden relative group shadow-2xl">
                   <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest z-30 shadow-[0_0_10px_red] flex items-center gap-1 pointer-events-none">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> YOUTUBE FEED
                   </div>
                   
                   {youtubeVideoId ? (
                       <iframe 
                           width="100%" 
                           height="100%" 
                           src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0`}
                           title="Live Sniper Feed" 
                           frameBorder="0" 
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                           allowFullScreen
                           className="absolute inset-0"
                       ></iframe>
                   ) : (
                       <div className="absolute inset-0 bg-[#0B0E14] flex flex-col items-center justify-center border border-white/5">
                           <LayoutDashboard size={48} className="text-white/10 mb-4" />
                           <div className="text-white/30 font-bold tracking-widest text-xs uppercase">Awaiting Stream URL</div>
                       </div>
                   )}
               </div>

                {/* SHOT READY Banner — surfaces latest persona response for easy copy/paste into YouTube chat */}
                <AnimatePresence>
                {lastShot && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="shrink-0 mx-1 rounded-xl border-2 border-green-500 bg-green-950/80 backdrop-blur-sm p-3 flex items-start gap-3"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Shot Ready</span>
                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">— {lastShot.persona}</span>
                                {shotCopied && <span className="text-green-300 text-[10px] font-bold flex items-center gap-1"><Check size={10}/> Copied!</span>}
                            </div>
                            <div className="text-white text-sm leading-snug font-medium select-all">{lastShot.text}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(lastShot.text);
                                    setShotCopied(true);
                                }}
                                className="bg-green-500 hover:bg-green-400 text-black font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <ClipboardCopy size={12}/> COPY
                            </button>
                            <button onClick={() => setLastShot(null)} className="text-white/30 hover:text-white transition-colors p-1">
                                <X size={14}/>
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

               {/* Panelists — compact single-line strip */}
               <div className="flex justify-center items-center gap-3 shrink-0 py-2">
                   {panelists.map((panelist) => {
                       const isSpeaking = activeSpeaker === panelist.id;
                       const avatarKeyRaw = panelist.name.toLowerCase();
                       const avatarUrl = `/api/persona_image/${avatarKeyRaw}`;
                       
                       return (
                           <motion.div 
                              key={panelist.id}
                              animate={{ y: isSpeaking ? -3 : 0, scale: isSpeaking ? 1.05 : 1 }}
                              className={`relative w-24 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                                 isSpeaking 
                                 ? 'border-[#FF5910] bg-gradient-to-b from-black/80 to-[#FF5910]/20 z-20' 
                                 : 'border-[#3B82F6]/40 bg-gradient-to-b from-black/80 to-[#3B82F6]/10 z-10'
                              }`}
                           >
                               {isSpeaking && (
                                   <div className="absolute -top-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest z-30 shadow-[0_0_10px_red]">On Air</div>
                               )}
                               
                               {/* Decorative background wave */}
                               <div className="absolute inset-0 opacity-20 pointer-events-none">
                                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                      <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="none" stroke={isSpeaking ? '#FF5910' : '#3B82F6'} strokeWidth="1" className={isSpeaking ? 'animate-pulse' : ''}/>
                                  </svg>
                               </div>

                               <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden z-10 bg-slate-800">
                                    <img src={avatarUrl} alt={panelist.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${panelist.name}&backgroundColor=0f172a&textColor=ffffff`; }} />
                                </div>
                                <div className={`text-[9px] font-bold uppercase tracking-widest truncate w-full text-center ${isSpeaking ? 'text-[#FF5910]' : 'text-white/70'}`}>{panelist.alias}</div>
                           </motion.div>
                       );
                   })}
               </div>

               {/* Keyword Sniffer Panel */}
               <div className="shrink-0 bg-black/40 border border-red-900/30 rounded-xl p-3 flex flex-col gap-2 max-h-[150px]">
                   <div className="flex justify-between items-center">
                       <div className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Keyword Sniffer
                       </div>
                       <div className="flex items-center gap-2">
                           <input 
                               type="text" 
                               value={keywordInput}
                               onChange={e => setKeywordInput(e.target.value)}
                               onKeyDown={e => {
                                   if (e.key === 'Enter' && keywordInput.trim()) {
                                       setSnifferKeywords(prev => [...prev, keywordInput.trim()]);
                                       setKeywordInput('');
                                   }
                               }}
                               placeholder="Add keyword..." 
                               className="bg-black border border-red-900/50 rounded px-2 py-1 text-[10px] uppercase text-white outline-none w-24 focus:border-red-500"
                           />
                           <div className="flex gap-1 flex-wrap">
                               {snifferKeywords.map(kw => (
                                   <div key={kw} className="bg-red-900/30 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                       {kw} <X size={8} className="cursor-pointer hover:text-white" onClick={() => setSnifferKeywords(prev => prev.filter(k => k !== kw))}/>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                       {sniffedMessages.length === 0 ? (
                           <div className="text-white/20 text-[10px] uppercase tracking-widest text-center py-2">Awaiting Targets...</div>
                       ) : (
                           sniffedMessages.map(msg => (
                               <div key={msg.id} className="text-white/70 text-[10px] flex gap-2 border-b border-white/5 pb-1">
                                   <span className="text-red-400 font-bold shrink-0">[{msg.author}]</span> <span className="truncate" title={msg.text}>{msg.text}</span>
                               </div>
                           ))
                       )}
                   </div>
               </div>
           </div>

           {/* RIGHT CHAT SIDEBAR (w-[400px]) */}
           <div className="w-[400px] shrink-0 flex flex-col min-h-0">
               {/* Chat Section */}
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
                   <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-black/20">
                       <div className="text-white font-bold text-base uppercase tracking-widest">LIVE STREAMING CHAT</div>
                       <div className="flex gap-2 items-center">
                           <div className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> SNIPING</div>
                           <Activity size={14} className="text-white/50 ml-1" />
                       </div>
                   </div>
                   <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                       {messages.map((msg) => {
                           const isPanelist = panelists.some(p => p.id === msg.author || p.name === msg.author);
                           const isRegistered = isPanelist || personaData[msg.author.toLowerCase()] !== undefined;
                           const avatarUrl = isRegistered 
                               ? `/api/persona_image/${msg.author.toLowerCase()}` 
                               : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.author)}&backgroundColor=0f172a&textColor=ffffff`;
                           
                           return (
                               <motion.div 
                                  key={msg.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex gap-3"
                               >
                                   <div className="w-10 h-10 rounded-full shrink-0 border border-white/20 overflow-hidden bg-slate-800">
                                        <img src={avatarUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${msg.author}&backgroundColor=0f172a&textColor=ffffff`; }} />
                                   </div>
                                   <div className={`flex-1 p-3 rounded-xl rounded-tl-none border backdrop-blur-md ${isPanelist ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 ' : 'bg-white/5 border-white/10'}`}>
                                       <div className="flex justify-between items-center mb-1">
                                           <div className={`text-xs font-bold uppercase tracking-widest ${isPanelist ? 'text-[#3B82F6]' : 'text-white/70'}`}>{msg.author}</div>
                                           <div className="flex items-center gap-2">
                                               {isPanelist ? (
                                                   <button 
                                                      onClick={() => navigator.clipboard.writeText(msg.text)} 
                                                      className="text-blue-400/50 hover:text-blue-400 transition-colors"
                                                      title="Copy response to clipboard"
                                                   >
                                                       <ClipboardCopy size={12} />
                                                   </button>
                                               ) : (
                                                   <button 
                                                      onClick={() => setReplyTarget({ author: msg.author, text: msg.text })} 
                                                      className="text-white/30 hover:text-white transition-colors"
                                                      title="Select message to reply to"
                                                   >
                                                       <MessageSquare size={12} />
                                                   </button>
                                               )}
                                               <div className="text-xs text-white/40 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                           </div>
                                       </div>
                                       <div className="text-sm leading-relaxed font-sans text-white">{msg.text}</div>
                                   </div>
                               </motion.div>
                           );
                       })}
                       <div ref={chatEndRef} />
                   </div>
                   
                   <div className="p-4 border-t border-white/10 shrink-0 bg-black/20 relative">
                       {replyTarget && (
                           <div className="bg-blue-900/40 border border-blue-500/50 rounded-lg p-3 mb-3 flex flex-col gap-2 text-xs ">
                               <div className="flex justify-between items-start">
                                   <div className="flex-1 text-white/80 line-clamp-2">
                                       <span className="font-bold text-blue-400">Targeting {replyTarget.author}:</span> "{replyTarget.text}"
                                   </div>
                                   <button onClick={() => setReplyTarget(null)} className="text-white/50 hover:text-white ml-2 p-1"><X size={12} /></button>
                               </div>
                               <div className="text-[9px] text-blue-300 font-bold uppercase tracking-widest mt-1">Select Persona to Respond:</div>
                               <div className="flex flex-wrap gap-2 mt-1">
                                   {panelists.map(p => {
                                       const avatarKeyRaw = p.name.toLowerCase();
                                       let avatarUrl = `/api/persona_image/${avatarKeyRaw}`;
                                       return (
                                           <button 
                                               key={p.id}
                                               onClick={async () => {
                                                    const producerNote = userChatInput.trim() ? ` Additional context: ${userChatInput}` : '';
                                                    // Use full DB system prompt if loaded, else fallback voice
                                                    const dbPersona = personaData[p.name];
                                                    const voice = dbPersona?.system_prompt
                                                         ? `${dbPersona.system_prompt}\n\nDeep Lore: ${dbPersona.deep_lore || ''}\n\nCurrent Season Context (2026): ${(dbPersona as any).behavior_notes || ''}\n\nYou are responding in a LIVE YouTube chat. Keep your response under 200 characters. Be specific — use 2026 Mets facts, real player names. NEVER use generic phrases like "Mets gonna Met". Output ONLY the chat message, no quotes, no labels.`
                                                        : (PERSONA_VOICES[p.id] || `You are ${p.alias}, a passionate Mets fan. Under 200 characters.`);
                                                    const prompt = `${replyTarget.author} said in YouTube chat: "${replyTarget.text}"${producerNote}\n\nReact to this comment in character. Output ONLY your chat response, nothing else.`;

                                                    setShotModal({ persona: p.alias, text: '', loading: true });
                                                    setReplyTarget(null);
                                                    setUserChatInput('');
                                                    try {
                                                        const res = await fetch('/api/hot_take_sniper', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                voice: voice,
                                                                prompt: prompt
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        let text = data?.text?.trim() || 'No response generated.';
                                                        if (text !== 'No response generated.') {
                                                            // Strip any @ the model already prepended, then add exactly one
                                                            text = text.replace(/^@+/, '');
                                                            const cleanAuthor = replyTarget.author.replace(/^@+/, '');
                                                            text = `@${cleanAuthor} ${text}`;
                                                        }
                                                        setShotModal({ persona: p.alias, text, loading: false });
                                                        // WS broadcast removed: persona responses are copy/paste only, not auto-posted to chat
                                                    } catch (err) {
                                                        setShotModal({ persona: p.alias, text: 'Error calling backend sniper proxy.', loading: false });
                                                    }
                                                }}
                                               className="flex items-center gap-2 bg-black/40 hover:bg-blue-600/50 border border-white/10 hover:border-blue-400 rounded-full pr-3 pl-1 py-1 transition-all"
                                               title={`Command ${p.alias} to reply. Add optional instructions in the chat box first.`}
                                           >
                                               <img src={avatarUrl} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}&backgroundColor=0f172a&textColor=ffffff`; }} />
                                               <span className="text-[9px] font-bold uppercase tracking-widest">{p.alias}</span>
                                           </button>
                                       )
                                   })}
                               </div>
                           </div>
                       )}
                       {showMentions && (
                           <div className="absolute bottom-full left-4 mb-2 bg-black/95 border border-blue-500/50 rounded-xl overflow-hidden  z-50 min-w-[200px]">
                               {panelists.filter(p => p.name.toLowerCase().includes(mentionFilter) || p.alias.toLowerCase().includes(mentionFilter)).map((p) => (
                                   <div 
                                       key={p.id}
                                       className="px-4 py-2 hover:bg-blue-600/30 cursor-pointer flex items-center gap-2 border-b border-white/10 last:border-0"
                                       onClick={() => {
                                           const words = userChatInput.split(' ');
                                           words.pop();
                                           setUserChatInput(words.join(' ') + (words.length > 0 ? ' ' : '') + '@' + p.name + ' ');
                                           setShowMentions(false);
                                       }}
                                   >
                                       <div className="text-white text-xs font-bold uppercase tracking-widest">{p.name}</div>
                                       <div className="text-blue-400 text-[10px]">({p.alias})</div>
                                   </div>
                               ))}
                           </div>
                       )}
                       <form onSubmit={(e) => {
                           e.preventDefault();
                           if (!userChatInput.trim() || !wsRef.current) return;
                           
                           let finalMessage = userChatInput;
                           if (replyTarget) {
                               finalMessage = `[Replying to @${replyTarget.author}: "${replyTarget.text}"] ${userChatInput}`;
                           }
                           
                           wsRef.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', user: 'Guest User', text: finalMessage, target_game_pk: 'live_chat_sniper' }));
                           setUserChatInput('');
                           setShowMentions(false);
                           setReplyTarget(null);
                       }} className="flex items-center gap-3 bg-black/50 border border-white/20 rounded-full px-4 py-2">
                           <span className="text-white/50 font-bold">+</span>
                           <input 
                              type="text" 
                              value={userChatInput}
                              onChange={e => {
                                  const val = e.target.value;
                                  setUserChatInput(val);
                                  const lastWord = val.split(' ').pop() || '';
                                  if (lastWord.startsWith('@')) {
                                      setShowMentions(true);
                                      setMentionFilter(lastWord.slice(1).toLowerCase());
                                  } else {
                                      setShowMentions(false);
                                  }
                              }}
                              placeholder="Type a message or use @ to mention a persona..." 
                              className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder-white/30"
                           />
                           <button type="submit" disabled={!userChatInput.trim()} className="text-[#3B82F6] disabled:opacity-50 hover:text-blue-400">
                               <MessageSquare size={16} />
                           </button>
                       </form>
                   </div>
               </div>
           </div>
       </div>


    </div>
  );
}
