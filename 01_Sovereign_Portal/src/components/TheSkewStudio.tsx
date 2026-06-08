import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, Radio, TrendingUp, AlertTriangle, Sparkles, ClipboardCopy, X, MessageSquare, BarChart2, Activity, LayoutDashboard, MoreHorizontal, Download } from 'lucide-react';
import avatarMap from '../avatarMap';
import LivingKanbanBoard from './LivingKanbanBoard';

interface TheSkewStudioProps {
  onClose?: () => void;
  globalBoggsOverride?: string;
}

export default function TheSkewStudio({ onClose, globalBoggsOverride }: TheSkewStudioProps) {
  const [panelists, setPanelists] = useState<{ id: string, name: string, alias: string }[]>([
    { id: 'dot', name: 'dot', alias: 'Dot' },
    { id: 'barf', name: 'barf', alias: 'Barf' },
    { id: '7_train_terry', name: '7_train_terry', alias: 'Terry' },
    { id: 'uncle_stevie_stan', name: 'uncle_stevie_stan', alias: 'Stan' },
    { id: 'wardy', name: 'wardy', alias: 'Wardy' },
    { id: 'battery_chucker', name: 'battery_chucker', alias: 'Battery Chucker' }
  ]);
  const [messages, setMessages] = useState<{ id: string, author: string, text: string, timestamp: number, model_engine?: string | null }[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [hotTopic, setHotTopic] = useState("The 2026 METS COLLAPSE and a new meaning for the term Mendoza line.");
  const [engineOverride, setEngineOverride] = useState<'default' | 'local_phi3' | 'gemini-1.5-flash'>('default');
  
  const [isBuildingRoom, setIsBuildingRoom] = useState(() => {
    const saved = localStorage.getItem('skew_isBuildingRoom');
    return saved !== null ? saved === 'true' : true;
  });
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['dot', 'barf', '7_train_terry', 'uncle_stevie_stan', 'wardy', 'battery_chucker']);
  const [userChatInput, setUserChatInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [flowPrompt, setFlowPrompt] = useState<string | null>(null);
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{author: string, text: string} | null>(null);
  const [snifferKeywords, setSnifferKeywords] = useState<string[]>(['Mendoza', 'fire', 'Benge']);
  const [keywordInput, setKeywordInput] = useState('');
  const [sniffedMessages, setSniffedMessages] = useState<{id: string, author: string, text: string, timestamp: number}[]>([]);
  const keywordsRef = useRef<string[]>(snifferKeywords);
  const [showBarfPip, setShowBarfPip] = useState(false);

  useEffect(() => {
     keywordsRef.current = snifferKeywords;
  }, [snifferKeywords]);

  // Kramerica Sovereign Clicker™ manual override
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B' || e.key === 'p' || e.key === 'P' || e.key === 'PageUp' || e.key === 'PageDown') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        setShowBarfPip(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom || messages.length <= 50) {
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 50);
      }
    }
  }, [messages]);

  useEffect(() => {
     fetch('/api/skew-cmdb/now/table/cmdb_ci_ai_persona')
        .then(r => r.json())
        .then(d => {
            if(d.result) {
                const active = d.result.filter((p: any) => p.active === 1);
                setAllPersonas(active);
                // Pre-select all available baseball personas
                const defaultNames = ['dot', 'barf', '7_train_terry', 'uncle_stevie_stan', 'wardy', 'battery_chucker'];
                const defaults = active.filter((p: any) => defaultNames.includes(p.user_name.toLowerCase()));
                if(defaults.length > 0) {
                    setSelectedIds(defaults.map((p: any) => p.sys_id));
                }
            }
        });
  }, []);

  useEffect(() => {
    const isHTTPS = window.location.protocol === 'https:';
    const wsProtocol = isHTTPS ? 'wss://' : 'ws://';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}${wsHost}/ws-skew`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: 'the_skew' }));
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_HISTORY' && Array.isArray(data.messages)) {
            const historyMsgs = data.messages.map((m: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                author: m.user || m.author || 'Unknown',
                text: m.text,
                timestamp: Date.now(), // Fake timestamp since relay sends string timestamp
                model_engine: m.model_engine || null
            }));
            setMessages(historyMsgs.slice(-200)); // Load last 200
        } else if (data.type === 'CHAT_MSG' || data.type === 'CHAT_MESSAGE' || data.type === 'YOUTUBE_CHAT') {
           const msgId = Math.random().toString(36).substr(2, 9);
           const messageAuthor = data.user || data.author || 'Unknown';
           const newMsg = { id: msgId, author: messageAuthor, text: data.text, timestamp: Date.now(), model_engine: data.model_engine || null };
           setMessages(prev => [...prev.slice(-200), newMsg]);
           
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
               } else {
                   // Fallback: assign randomly to visualize non-panelist messages
                   const hash = messageAuthor.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
                   const p = currPanelists[hash % (currPanelists.length || 1)];
                   if (p) {
                       setActiveSpeaker(p.id);
                       setTimeout(() => {
                           setActiveSpeaker(curr => curr === p.id ? null : curr);
                       }, 4000);
                   }
               }
               return currPanelists;
           });
        } else if (data.type === 'STATE_UPDATE' && data.data) {
           if (data.data.hot_topic !== undefined) setHotTopic(data.data.hot_topic);
           if (data.data.panelists !== undefined) setPanelists(data.data.panelists);
           if (data.data.selectedIds !== undefined) setSelectedIds(data.data.selectedIds);
           if (data.data.isBuildingRoom !== undefined) setIsBuildingRoom(data.data.isBuildingRoom);
        }
      } catch (err) {}
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  if (isBuildingRoom) {
     return (
        <div className="relative w-full h-[85vh] bg-[#0a1128] overflow-hidden rounded-2xl p-6 text-white font-sans flex flex-col shadow-2xl border border-blue-500/20">
           <div className="flex items-center justify-between mb-4 border-b border-blue-500/20 pb-3 shrink-0">
               <div className="flex items-center gap-4">
                   <button 
                       onClick={() => {
                           if (onClose) onClose();
                           else window.history.back();
                       }}
                       className="p-2 bg-blue-900/30 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors border border-blue-500/30"
                       title="Return to Sovereign OS Home"
                   >
                       <X size={20} />
                   </button>
                   <h1 className="text-2xl font-bold tracking-widest text-blue-400 font-display uppercase flex items-center gap-3">
                       <Radio className="text-orange-500" size={24} />
                       The Skew - Panel Selector
                   </h1>
               </div>
               <div className="flex gap-4">
                   <div className="bg-blue-900/40 border border-blue-500/50 px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider text-blue-300">
                       Available Personas: {allPersonas.length}
                   </div>
               </div>
           </div>
           
           <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Left: Persona Grid */}
              <div className="w-2/3 bg-black/40 border border-blue-500/30 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                     {allPersonas.map(p => {
                         const isSelected = selectedIds.includes(p.sys_id);
                         return (
                            <div 
                              key={p.sys_id} 
                              onClick={() => {
                                 if (isSelected) {
                                     setSelectedIds(selectedIds.filter(id => id !== p.sys_id));
                                 } else {
                                     if (selectedIds.length < 8) setSelectedIds([...selectedIds, p.sys_id]); // Rule 87: Panel of 8 cap
                                 }
                              }}
                              className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'bg-blue-600/30 border-2 border-blue-400 shadow-[0_0_15px_blue]' : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50'}`}
                            >
                               {(() => {
                                   const nameStr = p.user_name || p.name || '';
                                   const avatarKey = nameStr.toLowerCase().replace(/[\s_]/g, '');
                                   //@ts-ignore
                                   const avatarUrl = avatarMap[avatarKey] || `https://api.dicebear.com/7.x/initials/svg?seed=${nameStr}&backgroundColor=0f172a&textColor=ffffff`;
                                   return (
                                       <div className="w-12 h-12 rounded-full bg-slate-800 mb-2 overflow-hidden border border-white/20">
                                          <img src={avatarUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `/api/persona_image/${nameStr.toLowerCase()}`; }} />
                                       </div>
                                   );
                               })()}
                               <div className="font-bold text-xs uppercase tracking-wider leading-tight">{p.user_name}</div>
                               <div className="text-[9px] text-slate-400 truncate w-full px-1 mt-1">{p.title || p.department || 'Fan'}</div>
                            </div>
                         );
                     })}
                 </div>
              </div>
              
              {/* Right: Selected Panel & Setup */}
              <div className="w-1/3 bg-black/40 border border-blue-500/30 rounded-xl p-4 flex flex-col relative h-full">
                 <h2 className="text-base font-bold text-slate-300 mb-3 uppercase tracking-wider border-b border-blue-500/30 pb-2 shrink-0">Assigned Seats ({selectedIds.length}/8)</h2>
                 <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 8 }).map((_, idx) => {
                        const assignedId = selectedIds[idx];
                        const persona = assignedId ? allPersonas.find(p => p.sys_id === assignedId) || panelists.find(p => p.id === assignedId) : null;
                        return (
                           <div 
                               key={idx} 
                               onClick={() => {
                                   if (assignedId) setSelectedIds(selectedIds.filter(id => id !== assignedId));
                               }}
                               className={`h-16 shrink-0 rounded-xl border transition-all cursor-pointer group ${persona ? 'border-blue-500/50 bg-blue-900/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] hover:border-red-500/50 hover:bg-red-900/20' : 'border-white/10 bg-white/5 border-dashed'} flex items-center px-4 py-2`}
                               title={persona ? "Click to clear seat" : ""}
                           >
                              {persona ? (() => {
                                  const nameStr = persona.user_name || persona.name || '';
                                  const avatarKey = nameStr.toLowerCase().replace(/[\s_]/g, '');
                                  //@ts-ignore
                                  const avatarUrl = avatarMap[avatarKey] || `https://api.dicebear.com/7.x/initials/svg?seed=${nameStr}&backgroundColor=0f172a&textColor=ffffff`;
                                  return (
                                  <>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 mr-3 overflow-hidden border border-blue-400 shadow-[0_0_10px_blue] group-hover:border-red-400 transition-colors">
                                       <img src={avatarUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `/api/persona_image/${nameStr.toLowerCase()}`; }} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                       <div className="font-bold text-xs uppercase tracking-wider truncate group-hover:text-red-300 transition-colors">{persona.user_name || persona.name}</div>
                                       <div className="text-[9px] text-blue-400 mt-0.5 uppercase font-mono bg-blue-900/50 inline-block px-1.5 py-0.5 rounded group-hover:bg-red-900/50 group-hover:text-red-400 transition-colors">SEAT {idx + 1}</div>
                                    </div>
                                  </>
                                  );
                              })() : (
                                  <div className="text-slate-500 text-xs uppercase tracking-widest w-full text-center">Empty Seat</div>
                              )}
                           </div>
                        )
                    })}
                 </div>
                 
                 <div className="mt-4 shrink-0 flex gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">Initial Topic Directive</label>
                        <input 
                           value={hotTopic}
                           onChange={e => setHotTopic(e.target.value)}
                           className="w-full bg-black/50 border border-blue-500/50 rounded p-2.5 text-sm text-white outline-none focus:border-blue-400 focus:shadow-[0_0_10px_blue] font-mono"
                           placeholder="e.g. METS DOUBLE HEADER"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">LLM Engine</label>
                        <select 
                           value={engineOverride}
                           onChange={e => setEngineOverride(e.target.value as any)}
                           className="w-full bg-black/50 border border-blue-500/50 rounded p-2.5 text-sm text-white outline-none focus:border-blue-400 focus:shadow-[0_0_10px_blue] font-mono cursor-pointer"
                        >
                           <option value="default">Default</option>
                           <option value="local_phi3">Local Phi-3</option>
                           <option value="gemini-1.5-flash">Gemini Flash</option>
                        </select>
                    </div>
                 </div>
                 
                 <button 
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                        const newPanelists = selectedIds.map(id => {
                            const p = allPersonas.find(x => x.sys_id === id) || panelists.find(x => x.id === id);
                            return { id: p?.user_name?.toLowerCase() || p?.id || id, name: p?.user_name || p?.name || id, alias: p?.user_name || p?.alias || id };
                        });
                        setPanelists(newPanelists);
                        setIsBuildingRoom(false);
                        
                        // Inject context to wake them up
                        if (!wsRef.current) return;
                        wsRef.current.send(JSON.stringify({ 
                          type: 'INIT_ROOM', 
                          target_game_pk: 'the_skew', 
                          hot_topic: hotTopic, 
                          panelist_sys_ids: selectedIds,
                          global_boggs_override: globalBoggsOverride || 'None',
                          engine_override: engineOverride
                        }));
                        setIsBuildingRoom(false);
                        localStorage.setItem('skew_isBuildingRoom', 'false');
                            
                            const targetNodes = newPanelists.map(p => p.name.toLowerCase());
                            // Send custom chat message simulating the Producer asking a question
                            wsRef.current.send(JSON.stringify({
                                type: 'update_context',
                                text: `Welcome to The Skew! Today's topic: ${hotTopic}. Give us your opening thoughts immediately!`,
                                target_game_pk: 'the_skew',
                                target_nodes: targetNodes,
                                engine_override: engineOverride
                            }));
                            
                            // Explicitly trigger the panelists to drop takes right away
                            targetNodes.slice(0, 3).forEach((node, i) => {
                                setTimeout(() => {
                                    wsRef.current?.send(JSON.stringify({
                                        type: 'CHAT_MESSAGE',
                                        user: 'SYSTEM',
                                        text: `[PRODUCER COMMAND] @${node}, kick off the show with your thoughts on ${hotTopic}!`,
                                        target_game_pk: 'the_skew',
                                        engine_override: engineOverride
                                    }));
                                }, i * 2500);
                            });
                    }}
                    className="mt-4 shrink-0 w-full py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_blue] hover:from-blue-600 hover:to-blue-400 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                 >
                    <TrendingUp size={16} />
                    Build Panel & Kick Off
                 </button>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className={`relative w-full h-[85vh] overflow-hidden rounded-2xl transition-all duration-1000 flex flex-col font-sans ${isMeltingDown ? 'bg-[#1a0505] ' : 'bg-[#0B0E14] shadow-2xl'}`}>
       
       {/* Top Nav Header */}
       <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20 shrink-0">
           <div className="flex items-center gap-4">
              <div className="font-display font-black text-2xl tracking-widest text-white flex items-center gap-2">
                 THE SKEW 
                 <span className="text-blue-500 italic text-3xl font-bold -ml-1">S</span>
              </div>
              <div className="text-slate-400 text-xs font-bold tracking-widest uppercase border-l border-white/20 pl-4">AI Sports Panel</div>
           </div>
           <div className="flex items-center gap-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white"><LayoutDashboard size={16}/> Dashboard</div>
               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white"><BarChart2 size={16}/> Stats</div>
               <div className="flex flex-col items-center gap-1 cursor-pointer text-blue-400"><MessageSquare size={16}/> Debates</div>
               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-white"><MoreHorizontal size={16}/> More</div>
           </div>
       </div>

       {/* Producer Controls Overlay (Hidden by default, hover to show or keep small in corner) */}
       <div className="absolute top-20 right-6 z-50 flex flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
           <button onClick={() => window.history.back()} className="px-3 py-1 bg-black/50 border border-white/20 text-white/50 hover:bg-red-600 hover:text-white text-[10px] rounded"><X size={12} /></button>
           <button onClick={() => { setIsBuildingRoom(true); localStorage.setItem('skew_isBuildingRoom', 'true'); }} className="px-3 py-1 bg-black/50 border border-white/20 text-white/50 hover:bg-blue-600 hover:text-white text-[10px] rounded">Edit</button>
           <button onClick={() => setIsMeltingDown(!isMeltingDown)} className="px-3 py-1 bg-black/50 border border-white/20 text-white/50 hover:bg-red-600 hover:text-white text-[10px] rounded">Meltdown</button>
       </div>

       {/* Barf Phone PiP Overlay */}
       <AnimatePresence>
         {showBarfPip && (
           <motion.div
             initial={{ opacity: 0, y: 100, scale: 0.8, rotate: 10 }}
             animate={{ opacity: 1, y: 0, scale: 1, rotate: -4 }}
             exit={{ opacity: 0, y: 100, scale: 0.8, rotate: 10 }}
             transition={{ type: "spring", stiffness: 300, damping: 20 }}
             className="absolute bottom-8 right-12 w-[300px] h-[550px] z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.9)] rounded-[40px] border-[8px] border-[#222] bg-[#000] overflow-hidden flex flex-col pointer-events-none"
           >
             <div className="h-6 bg-[#000] w-full flex justify-center items-start pt-1 shrink-0">
                <div className="w-20 h-5 bg-[#111] rounded-b-2xl"></div>
             </div>
             
             <div className="flex-1 bg-white overflow-hidden flex flex-col font-sans">
                 <div className="bg-[#002D72] text-white p-3 shadow-md flex items-center justify-center border-b-[4px] border-[#D50032]">
                    <div className="font-bold tracking-widest text-lg font-serif">Dictionary</div>
                 </div>
                 <div className="p-5 bg-gray-50 flex-1 relative">
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200 relative overflow-hidden">
                       <div className="text-gray-400 text-xs mb-1 font-bold uppercase tracking-wider">Search Query</div>
                       <div className="font-mono text-[22px] text-black font-bold tracking-wider pb-1">
                           <span className="text-red-600">P-O-L-K</span><br/>
                           <span className="text-red-600">R-A-T-T-U-N-I-N-U-S</span>
                       </div>
                       <div className="text-[#D50032] text-xs mt-2 font-bold flex items-center gap-1">
                           <AlertTriangle size={12}/> Did you mean: <span className="underline italic text-blue-600">pulchritudinous</span>?
                       </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                       <div className="flex flex-col gap-1 mb-3">
                          <h2 className="text-[28px] leading-none font-serif text-black font-black">pulchritudinous</h2>
                          <span className="text-gray-500 font-mono text-sm">[ puhl-kri-tood-n-uhs ]</span>
                       </div>
                       <div className="text-[#002D72] font-bold italic text-sm mb-3">adjective</div>
                       <ol className="list-decimal pl-5 text-[15px] text-gray-800 space-y-3 font-serif">
                          <li><span className="font-bold">physically beautiful; comely.</span></li>
                          <li><span className="font-bold bg-yellow-200 px-1 text-black">magnificent, stunning, or unbelievable (e.g., a catch by Carson Benge).</span></li>
                       </ol>
                    </div>

                    {/* Fuzzy orange thumb overlay */}
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-500/60 blur-2xl rounded-full mix-blend-multiply opacity-80 pointer-events-none"></div>
                 </div>
             </div>
             
             <div className="h-6 bg-[#000] w-full shrink-0 flex justify-center items-center pb-1">
                 <div className="w-24 h-1 bg-white/30 rounded-full"></div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden relative z-10">
           {/* Title Bar */}
           <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 shrink-0">
              <div className="text-white font-bold tracking-widest uppercase text-sm">LIVE BROADCAST</div>
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black text-lg ">
                     {hotTopic.toLowerCase().includes('nfl') ? '��' : hotTopic.toLowerCase().includes('nba') ? '🏀' : '⚾'}
                  </div>
                  <div className="text-white font-bold tracking-widest uppercase text-sm">{hotTopic}</div>
              </div>
              <div className="bg-[#FF5910] text-black px-4 py-1.5 rounded font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div> LIVE
              </div>
           </div>

           {/* Main Stage - Cards */}
           <div className="relative flex justify-center items-end gap-3 py-1 min-h-[140px] shrink-0">
               {panelists.map((panelist, idx) => {
                   const isSpeaking = activeSpeaker === panelist.id;
                   const avatarKeyRaw = panelist.name.toLowerCase();
                   const avatarKeyStripped = avatarKeyRaw.replace(/[\s_]/g, '');
                   //@ts-ignore
                   const avatarUrl = avatarMap[avatarKeyRaw] || avatarMap[avatarKeyStripped] || `/api/persona_image/${avatarKeyRaw}`;
                   const confidence = Math.floor(Math.random() * 20) + 70; // Fake stat for mockup
                   const act = Math.floor(Math.random() * 20) + 75; // Fake stat
                   
                   return (
                       <motion.div 
                          key={panelist.id}
                          animate={{ y: isSpeaking ? -5 : 0, scale: isSpeaking ? 1.05 : 1 }}
                          className={`relative w-28 h-32 rounded-xl border-2 flex flex-col items-center p-2 transition-all duration-300 overflow-hidden ${
                             isSpeaking 
                             ? 'border-[#FF5910]  bg-gradient-to-b from-black/80 to-[#FF5910]/20 z-20' 
                             : 'border-[#3B82F6]/40 shadow-lg bg-gradient-to-b from-black/80 to-[#3B82F6]/10 z-10'
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

                           <div className="w-full text-center mb-2 z-10">
                               <div className="text-white font-bold text-[10px] uppercase tracking-widest truncate">{panelist.name}</div>
                               <div className={`text-[8px] flex items-center justify-center gap-1 ${isSpeaking ? 'text-[#FF5910]' : 'text-[#3B82F6]'}`}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-[#FF5910]' : 'bg-[#3B82F6]'}`}></div> {panelist.alias}
                               </div>
                           </div>
                           
                           <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden mb-auto z-10 bg-slate-800 shadow-inner">
                               <img src={avatarUrl} alt={panelist.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${panelist.name}&backgroundColor=0f172a&textColor=ffffff`; }} />
                           </div>
                           
                           <div className="w-full flex justify-between items-end mt-2 z-10 border-t border-white/10 pt-2">
                               <div className="flex flex-col">
                                   <span className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Confidence</span>
                                   <div className="w-12 h-1 bg-white/20 rounded mt-1 overflow-hidden">
                                       <div className={`h-full ${isSpeaking ? 'bg-[#FF5910]' : 'bg-[#3B82F6]'}`} style={{ width: `${confidence}%` }}></div>
                                   </div>
                               </div>
                               <div className="flex flex-col items-end">
                                   <span className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Act</span>
                                   <span className={`text-xs font-bold ${isSpeaking ? 'text-[#FF5910]' : 'text-[#3B82F6]'}`}>{act}</span>
                               </div>
                           </div>
                       </motion.div>
                   );
               })}
               
               {/* Desk Graphic */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-12 border-t-[3px] border-[#3B82F6] bg-gradient-to-b from-[#3B82F6]/20 to-transparent rounded-t-[100%] flex justify-center items-start pt-2 -z-10 pointer-events-none">
                   <div className="w-12 h-8 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-2xl ">
                      {hotTopic.toLowerCase().includes('nfl') ? '🏈' : hotTopic.toLowerCase().includes('nba') ? '🏀' : '⚾'}
                   </div>
               </div>
           </div>

           {/* Bottom Split Section */}
           <div className="flex gap-6 flex-1 min-h-0">
               {/* Chat Section */}
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
                   <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-black/20">
                       <div className="text-white font-bold text-sm uppercase tracking-widest">LIVE STREAMING CHAT</div>
                       <div className="flex gap-2 items-center">
                           <button
                               onClick={async () => {
                                   setIsGeneratingFlow(true);
                                   try {
                                       const res = await fetch('/api/skew/flowmercial', {
                                           method: 'POST',
                                           headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify({
                                               topic: hotTopic,
                                               messages: messages.slice(-50) // Send the last 50 messages
                                           })
                                       });
                                       const data = await res.json();
                                       if (data.status === 'success') {
                                           setFlowPrompt(data.flow_prompt);
                                       } else {
                                           console.error("Flowmercial generation failed:", data.message);
                                       }
                                   } catch (e) {
                                       console.error("Error generating flowmercial", e);
                                   } finally {
                                       setIsGeneratingFlow(false);
                                   }
                               }}
                               disabled={isGeneratingFlow || messages.length === 0}
                               className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border transition-all ${isGeneratingFlow ? 'bg-blue-900/50 border-blue-500/50 text-blue-400 opacity-70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white '}`}
                           >
                               {isGeneratingFlow ? (
                                  <><div className="w-2 h-2 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div> Synthesizing Llama 3...</>
                               ) : (
                                  <><Sparkles size={12}/> Synthesize Flow Short</>
                               )}
                           </button>
                           <button
                                onClick={() => {
                                    const mdContent = messages.map(m => `${m.author}\n\n${new Date(m.timestamp).toLocaleTimeString()}\n${m.text}`).join('\n\n');
                                    const blob = new Blob([mdContent], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `the_skew_export_${Date.now()}.md`;
                                    a.click();
                                }}
                                disabled={messages.length === 0}
                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border transition-all bg-green-600 hover:bg-green-500 border-green-400 text-white  disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Download size={12}/> Export to MD
                            </button>
                           <div className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-2"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div> LIVE</div>
                           <Activity size={14} className="text-white/50 ml-1" />
                       </div>
                   </div>
                       <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                           {messages.map((msg) => {
                               const isPanelist = panelists.some(p => p.id === msg.author || p.name === msg.author);
                               const avatarKeyRaw = msg.author.toLowerCase();
                               const avatarKeyStripped = avatarKeyRaw.replace(/[\s_]/g, '');
                               //@ts-ignore
                               let avatarUrl = avatarMap[avatarKeyRaw] || avatarMap[avatarKeyStripped];
                               if (!avatarUrl) {
                                   avatarUrl = isPanelist ? `/api/persona_image/${avatarKeyRaw}` : `https://api.dicebear.com/7.x/initials/svg?seed=${msg.author}&backgroundColor=0f172a&textColor=ffffff`;
                               }
                               
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
                                               <div className="flex items-center gap-2">
                                                   <div className={`text-[10px] font-bold uppercase tracking-widest ${isPanelist ? 'text-[#3B82F6]' : 'text-white/70'}`}>{msg.author}</div>
                                                   {msg.model_engine && (() => {
                                                       const eng = msg.model_engine.toLowerCase();
                                                       const isGemini = eng.includes('gemini');
                                                       const isPhi = eng.includes('phi');
                                                       const color = isGemini ? '#f59e0b' : isPhi ? '#a855f7' : '#22c55e';
                                                       const label = isGemini ? '⚡ GEMINI' : isPhi ? 'PHI-3' : 'LLAMA';
                                                       return (
                                                           <span
                                                               className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                                                               style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
                                                           >{label}</span>
                                                       );
                                                   })()}
                                               </div>
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
                                                   <div className="text-[9px] text-white/30 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                               </div>
                                           </div>
                                           <div className="text-sm text-white/90 leading-relaxed font-sans">{msg.text}</div>
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
                                       const avatarKeyStripped = avatarKeyRaw.replace(/[\s_]/g, '');
                                       //@ts-ignore
                                       let avatarUrl = avatarMap[avatarKeyRaw] || avatarMap[avatarKeyStripped] || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}&backgroundColor=0f172a&textColor=ffffff`;
                                       return (
                                           <button 
                                               key={p.id}
                                               onClick={() => {
                                                   if (!wsRef.current) return;
                                                   const producerNote = userChatInput.trim() ? ` Producer Note: ${userChatInput}` : '';
                                                   wsRef.current.send(JSON.stringify({
                                                       type: 'update_context',
                                                       text: `React to this chat message from ${replyTarget.author}: "${replyTarget.text}".${producerNote}`,
                                                       target_game_pk: 'the_skew',
                                                       target_nodes: [p.name.toLowerCase()]
                                                   }));
                                                   
                                                   // Also echo it in the UI as a Producer message so the user sees their action
                                                   wsRef.current.send(JSON.stringify({
                                                       type: 'CHAT_MESSAGE',
                                                       user: 'SYSTEM',
                                                       text: `[PRODUCER COMMAND] @${p.alias}, respond to ${replyTarget.author}'s comment: "${replyTarget.text}"${producerNote ? ' -> ' + userChatInput : ''}`,
                                                       target_game_pk: 'the_skew',
                                                       engine_override: engineOverride
                                                   }));
                                                   
                                                   setReplyTarget(null);
                                                   setUserChatInput('');
                                               }}
                                               className="flex items-center gap-2 bg-black/40 hover:bg-blue-600/50 border border-white/10 hover:border-blue-400 rounded-full pr-3 pl-1 py-1 transition-all"
                                               title={`Command ${p.alias} to reply. Add optional instructions in the chat box first.`}
                                           >
                                               <img src={avatarUrl} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.currentTarget.src = `/api/persona_image/${p.name.toLowerCase()}`; }} />
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
                           
                           wsRef.current.send(JSON.stringify({ 
                               type: 'CHAT_MESSAGE', 
                               user: 'Guest User', 
                               text: finalMessage, 
                               target_game_pk: 'the_skew',
                               engine_override: engineOverride
                           }));
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
                               <TrendingUp size={16} />
                           </button>
                       </form>
                   </div>
               </div>

               {/* Assigned Seats Section */}
               <div className="w-72 flex flex-col gap-4 shrink-0">
                  <div className="bg-black/40 border border-blue-500/30 rounded-xl p-4 flex flex-col relative h-full">
                    <div className="flex justify-between items-center mb-3 border-b border-blue-500/30 pb-2 shrink-0">
                       <h2 className="text-base font-bold text-slate-300 uppercase tracking-wider">Assigned Seats ({selectedIds.length}/8)</h2>
                       <button 
                           onClick={() => { setIsBuildingRoom(true); localStorage.setItem('skew_isBuildingRoom', 'true'); }} 
                           className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-colors border border-blue-500/30"
                       >
                           Edit Panel
                       </button>
                    </div>
                   <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from({ length: 8 }).map((_, idx) => {
                          const assignedId = selectedIds[idx];
                          const persona = assignedId ? allPersonas.find(p => p.sys_id === assignedId) || panelists.find(p => p.id === assignedId) : null;
                          return (
                             <div 
                                 key={idx} 
                                 className={`h-16 shrink-0 rounded-xl border transition-all ${persona ? 'border-blue-500/50 bg-blue-900/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/10 bg-white/5 border-dashed'} flex items-center px-4 py-2`}
                             >
                                {persona ? (() => {
                                    const nameStr = persona.user_name || persona.name || '';
                                    const avatarKey = nameStr.toLowerCase().replace(/[\s_]/g, '');
                                    //@ts-ignore
                                    const avatarUrl = avatarMap[avatarKey] || `https://api.dicebear.com/7.x/initials/svg?seed=${nameStr}&backgroundColor=0f172a&textColor=ffffff`;
                                    return (
                                    <>
                                      <div className="w-10 h-10 rounded-full bg-slate-800 mr-3 overflow-hidden border border-blue-400 shadow-[0_0_10px_blue]">
                                         <img src={avatarUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `/api/persona_image/${nameStr.toLowerCase()}`; }} />
                                      </div>
                                      <div className="flex-1 overflow-hidden">
                                         <div className="font-bold text-xs uppercase tracking-wider truncate text-white">{persona.user_name || persona.name}</div>
                                         <div className="text-[9px] text-blue-400 mt-0.5 uppercase font-mono bg-blue-900/50 inline-block px-1.5 py-0.5 rounded">SEAT {idx + 1}</div>
                                      </div>
                                    </>
                                    );
                                })() : (
                                    <div className="text-slate-500 text-xs uppercase tracking-widest w-full text-center">Empty Seat</div>
                                )}
                             </div>
                          )
                      })}
                   </div>
                   
                   <div className="mt-4 shrink-0">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">Current Topic Directive</label>
                      <input 
                         value={hotTopic}
                         onChange={e => setHotTopic(e.target.value)}
                         className="w-full bg-black/50 border border-blue-500/50 rounded p-2.5 text-sm text-white outline-none focus:border-blue-400 focus:shadow-[0_0_10px_blue] font-mono"
                         placeholder="e.g. METS DOUBLE HEADER"
                      />
                   </div>
                   
                   <button 
                      onClick={() => {
                          if (!wsRef.current) return;
                          
                          const targetNodes = panelists.map(p => p.name.toLowerCase());
                          wsRef.current.send(JSON.stringify({
                              type: 'update_context',
                              text: `Pivot the conversation! New topic: ${hotTopic}. What are your thoughts?`,
                              target_game_pk: 'the_skew',
                              target_nodes: targetNodes
                          }));
                      }}
                      className="mt-4 shrink-0 w-full py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_blue] hover:from-blue-600 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
                   >
                      <TrendingUp size={16} />
                      Pivot Topic
                   </button>
                 </div>
               </div>
           </div>
       </div>

       {/* Flow Prompt Modal */}
       <AnimatePresence>
           {flowPrompt && (
               <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
               >
                   <div className="bg-[#0B0E14] border border-blue-500/30 rounded-2xl p-6 w-[600px]">
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="text-blue-400 font-display font-bold uppercase tracking-widest flex items-center gap-2">
                               <Sparkles size={20} /> Director's Prompt
                           </h3>
                           <button onClick={() => setFlowPrompt(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
                       </div>
                       <textarea className="w-full h-48 bg-black border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:border-blue-500 outline-none" value={flowPrompt} readOnly />
                   </div>
               </motion.div>
           )}
       </AnimatePresence>
    </div>
  );
}
