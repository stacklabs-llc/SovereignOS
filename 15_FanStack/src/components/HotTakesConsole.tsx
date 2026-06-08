import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, Radio, TrendingUp, AlertTriangle, Sparkles, ClipboardCopy, X, MessageSquare, BarChart2, Activity, LayoutDashboard, MoreHorizontal, Download, Flame, Mic2, Tv } from 'lucide-react';
import avatarMap from '../avatarMap';

export default function HotTakesConsole({ onClose }: { onClose?: () => void }) {
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [topic, setTopic] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<"local_llama3" | "gemini-2.5-flash">("local_llama3");
  const [isRanting, setIsRanting] = useState(false);
  const [isShortMode, setIsShortMode] = useState(true);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [lastUsedReplyMode, setLastUsedReplyMode] = useState(false);
  const [lastUsedTopic, setLastUsedTopic] = useState("");
  const [rantText, setRantText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [isSynthesizingFlow, setIsSynthesizingFlow] = useState(false);
  const [flowPrompt, setFlowPrompt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"broadcast" | "history">("broadcast");
  const [pastTakes, setPastTakes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/hot_takes');
      const data = await res.json();
      if (data.hot_takes) {
        setPastTakes(data.hot_takes);
      }
    } catch (e) {
      console.error("Failed to load hot takes history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetch('/api/all_personas')
      .then(r => r.json())
      .then(d => {
        if (d.personas) {
          const valid = d.personas.filter((p: any) => p.user_name);
          setAllPersonas(valid);
        }
      });
    fetchHistory();
  }, []);

  // ── Payload Preview Calculation ────────────────────────────────────────────
  const previewSystem = selectedPersona 
    ? (isReplyMode 
        ? `You are ${selectedPersona.user_name}. ${[selectedPersona.deep_lore, selectedPersona.system_prompt, selectedPersona.behavior_notes, selectedPersona.governance].filter(Boolean).join('\n\n')}\n\nCRITICAL: You are responding DIRECTLY to a specific post on X (Twitter). Do NOT write a general rant. Write a direct reply TO the post provided. Do NOT be polite. Do NOT hedge. Keep it under 200 characters if Sniper Mode is active (currently: ${isShortMode ? 'ACTIVE' : 'INACTIVE'}). Append standard hashtags and mentions as configured for this persona.`
        : `You are ${selectedPersona.user_name}. ${[selectedPersona.deep_lore, selectedPersona.system_prompt, selectedPersona.behavior_notes, selectedPersona.governance].filter(Boolean).join('\n\n')} CRITICAL: Generate a ${isShortMode ? 'quick, unhinged hot take. MUST BE EXTREMELY BRIEF. UNDER 200 CHARACTERS. 1 or 2 short sentences.' : 'massive, completely unhinged, opinionated rant. Write 3-5 full sentences of pure hot take energy.'}`)
    : '';
  const previewPrompt = topic 
    ? (isReplyMode 
        ? `You are responding DIRECTLY to this specific post on X (Twitter).\nDo not write a general rant. Write a direct reply TO this post.\n\nPOST CONTENT:\n${topic.trim()}\n\nStay fully in character.`
        : `Give me your hottest, most unhinged take on this topic: ${topic.trim()}. Don't hold back. This is your moment.`)
    : '';
  const totalChars = previewSystem.length + previewPrompt.length;
  const estimatedTokens = Math.ceil(totalChars / 4);

  // ── Typewriter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (targetText.length > rantText.length) {
       const timer = setTimeout(() => {
          setRantText(targetText.slice(0, rantText.length + 8));
       }, 15);
       return () => clearTimeout(timer);
    }
  }, [targetText, rantText]);

  // ── Direct REST call — no WebSocket, no relay, no room nonsense ────────────
  const unleashTake = async () => {
    if (!selectedPersona || !topic.trim() || isRanting) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLastUsedReplyMode(isReplyMode);
    setLastUsedTopic(topic.trim());
    setIsRanting(true);
    setRantText("");
    setTargetText("");
    setProcessLogs([`► Firing ${selectedPersona.user_name} on ${selectedEngine === 'local_llama3' ? 'Llama 3' : 'Gemini Flash'}...`]);

    try {
      const res = await fetch('/api/hot_take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedPersona.user_name,
          topic: topic.trim(),
          engine: selectedEngine,
          short_mode: isShortMode,
          reply_mode: isReplyMode,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const formatted = data.text.replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n");
      setTargetText(formatted);
      setProcessLogs(prev => [...prev,
        `► Engine: ${data.engine_used}`,
        `► SUCCESS: ${data.text.length} chars received.`
      ]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setProcessLogs(prev => [...prev, `► ERROR: ${err.message}`]);
    } finally {
      setIsRanting(false);
    }
  };

  const synthesizeFlow = async () => {
    if (!rantText || isSynthesizingFlow) return;
    setIsSynthesizingFlow(true);
    try {
        const res = await fetch('/api/skew/flowmercial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: topic || "Persona Hot Take",
                messages: [{ author: selectedPersona.user_name, text: rantText }]
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            setFlowPrompt(data.flow_prompt);
        }
    } catch (e) {
        console.error("Flow synthesis failed", e);
    } finally {
        setIsSynthesizingFlow(false);
    }
  };

  return (
    <div className="relative w-full h-[85vh] bg-[#0B0E14] overflow-hidden rounded-2xl flex flex-col font-sans shadow-2xl border border-white/5">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 shrink-0">
           <div className="flex items-center gap-4">
              <div className="font-display font-black text-2xl tracking-widest text-white flex items-center gap-2">
                 SOVEREIGN <span className="text-red-500">HOT TAKES</span>
              </div>
              <div className="text-slate-400 text-xs font-bold tracking-widest uppercase border-l border-white/20 pl-4 mr-6">Single Persona Rant Terminal</div>
              <div className="flex gap-2">
                 <button 
                    onClick={() => setActiveTab("broadcast")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${activeTab === "broadcast" ? "border-red-500 bg-red-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                 >
                    🔥 Broadcast
                 </button>
                 <button 
                    onClick={() => { setActiveTab("history"); fetchHistory(); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${activeTab === "history" ? "border-sky-500 bg-sky-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                 >
                    📚 History ({pastTakes.length || 0})
                 </button>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} className="text-white/50" />
           </button>
        </div>

        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
            {/* Left: Controls & Persona Selector */}
            <div className="w-80 flex flex-col gap-3 shrink-0 overflow-hidden pb-2 pr-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Mic2 size={14} className="text-red-500" /> Select Analyst
                        </h3>
                        <input
                            type="text"
                            placeholder="Search Analysts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500/50 transition-all font-sans"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[175px] pr-1 custom-scrollbar">
                        {allPersonas.filter(p => p.user_name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
                            const isSelected = selectedPersona?.sys_id === p.sys_id;
                            const nameStr = p.user_name || '';
                            const avatarKey = nameStr.toLowerCase().replace(/[\s_]/g, '');
                            //@ts-ignore
                            const avatarUrl = avatarMap[avatarKey] || `/api/persona_image/${nameStr.toLowerCase()}`;
                            
                            return (
                                <button 
                                    key={p.sys_id}
                                    onClick={() => setSelectedPersona(p)}
                                    className={`relative p-1 rounded-xl border transition-all ${isSelected ? 'border-red-500 bg-red-500/10 ' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                                >
                                    <img src={avatarUrl} className="w-full aspect-square rounded-lg object-cover" alt={nameStr} />
                                    <div className="text-[8px] font-bold uppercase tracking-widest mt-1 text-white/70 truncate px-1">{nameStr}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                       <TrendingUp size={14} className="text-blue-400" /> Topic Directive
                    </h3>

                    {/* Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button 
                            onClick={() => setIsReplyMode(false)}
                            className={`py-2 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${!isReplyMode ? "border-red-500 bg-red-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                        >
                            🔥 Hot Take
                        </button>
                        <button 
                            onClick={() => setIsReplyMode(true)}
                            className={`py-2 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${isReplyMode ? "border-sky-500 bg-sky-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                        >
                            𝕏 Reply Mode
                        </button>
                    </div>

                    <textarea 
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder={isReplyMode ? "Paste tweet URL or tweet text here..." : "Enter a topic for the rant (e.g. The DH rule, The 1986 Mets, etc.)"}
                        className="w-full h-20 bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500/50  transition-all resize-none font-sans"
                    />

                    {isReplyMode && (
                        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest -mt-2">
                            Persona will respond directly to this post
                        </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isShortMode ? 'bg-red-500 border-red-500' : 'bg-black/40 border-white/20 group-hover:border-white/50'}`}>
                            {isShortMode && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" className="hidden" checked={isShortMode} onChange={(e) => setIsShortMode(e.target.checked)} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 group-hover:text-white/80 transition-colors">Sniper Mode (&lt; 200 Chars)</span>
                    </label>
                    
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Model Engine</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setSelectedEngine("local_llama3")}
                                className={`py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${selectedEngine === "local_llama3" ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                            >
                                Llama 3
                            </button>
                            <button 
                                onClick={() => setSelectedEngine("gemini-2.5-flash")}
                                className={`py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${selectedEngine === "gemini-2.5-flash" ? "border-purple-500 bg-purple-500/20 text-white" : "border-white/10 text-white/40 hover:bg-white/5"}`}
                            >
                                Gemini Flash
                            </button>
                        </div>
                    </div>

                    <button 
                        disabled={!topic.trim() || isRanting}
                        onClick={unleashTake}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black tracking-[0.2em] uppercase rounded-xl  hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                    >
                        <Flame size={20} className={isRanting ? 'animate-bounce' : ''} />
                        {isReplyMode ? '𝕏 FIRE REPLY' : 'Unleash Hot Take'}
                    </button>
                </div>
            </div>

            {/* Right: The Stage */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {activeTab === 'broadcast' ? (
                    <>
                        {/* Persona Card Area */}
                        <div className="relative h-64 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md flex items-center px-10 gap-10">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.2),transparent_70%)] animate-pulse"></div>
                            </div>

                            <div className="w-40 h-40 rounded-2xl border-2 border-red-500/50 overflow-hidden  bg-black/40 relative z-10 shrink-0">
                                {selectedPersona && (
                                    <img 
                                        src={(() => { const k = selectedPersona.user_name.toLowerCase().replace(/[\s_]/g,''); //@ts-ignore
                                        return avatarMap[k] || `/api/persona_image/${selectedPersona.user_name.toLowerCase()}`; })()}
                                        className="w-full h-full object-cover" 
                                        alt={selectedPersona.user_name}
                                    />
                                )}
                            </div>

                            <div className="w-48 flex flex-col gap-2 relative z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    {selectedPersona && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">On Air</span>}
                                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedPersona?.user_name || "Select"}</h2>
                                </div>
                                <p className="text-red-400 font-mono text-xs uppercase tracking-widest font-bold">{selectedPersona?.title || "Sovereign Analyst"}</p>
                                {selectedPersona && (
                                    <div className="mt-4 flex gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Aggression</span>
                                            <span className="text-xl font-bold text-white">98%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Logic</span>
                                            <span className="text-xl font-bold text-white">4%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Volume</span>
                                            <span className="text-xl font-bold text-white">MAX</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedPersona && (
                                <div className="flex-1 relative z-10 flex flex-col h-[180px] py-1 overflow-hidden ml-4">
                                   <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-2 flex justify-between">
                                     <span>API Payload Preview</span>
                                     <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Est. Tokens: ~{estimatedTokens}</span>
                                   </div>
                                   <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white/60 space-y-3">
                                      <div>
                                        <span className="text-blue-400 font-bold block mb-1">System Instruction:</span>
                                        {previewSystem}
                                      </div>
                                      {previewPrompt && (
                                        <div>
                                          <span className="text-purple-400 font-bold block mb-1">User Prompt:</span>
                                          {previewPrompt}
                                        </div>
                                      )}
                                   </div>
                                </div>
                            )}

                            {/* Synthesize Flow Button */}
                            <div className="ml-auto relative z-10">
                                <button 
                                    disabled={!rantText || isSynthesizingFlow}
                                    onClick={synthesizeFlow}
                                    className={`group p-6 rounded-full border transition-all ${rantText ? 'bg-blue-600/20 border-blue-500  hover:bg-blue-600/40' : 'bg-white/5 border-white/10 opacity-30 cursor-not-allowed'}`}
                                    title="Synthesize into a vertical Flowmercial"
                                >
                                    <Sparkles size={32} className={`text-blue-400 group-hover:scale-110 transition-transform ${isSynthesizingFlow ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Rant Output */}
                        <div className="flex-1 bg-black/60 border border-white/10 rounded-3xl p-8 overflow-y-auto custom-scrollbar font-sans text-[22px] text-white/90 leading-[1.8] relative tracking-wide shadow-inner">
                            {!rantText && !isRanting && processLogs.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-white/10 uppercase font-black text-4xl tracking-widest pointer-events-none select-none">
                                    Awaiting Directive
                                </div>
                            )}
                            
                            {processLogs.length > 0 && (isRanting || targetText.length === 0) && (
                                <div className="bg-black/80 border border-blue-500/30 rounded-xl p-4 font-mono text-xs text-blue-400 mb-6 flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar ">
                                    <div className="flex items-center gap-2 text-blue-500 uppercase font-bold tracking-widest mb-2 border-b border-blue-500/20 pb-2">
                                       {isRanting ? <Activity size={14} className="animate-spin" /> : <Activity size={14} />} 
                                       System Diagnostic Status
                                    </div>
                                    {processLogs.map((log, i) => (
                                        <div key={i} className={log.includes("ERROR") ? "text-red-500 font-bold" : "text-blue-300"}>
                                            &gt; {log}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {lastUsedReplyMode && rantText && (
                                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                    <span className="bg-sky-500/10 p-1 rounded">𝕏</span>
                                    <span>Replying to: "{lastUsedTopic.length > 60 ? `${lastUsedTopic.slice(0, 60)}...` : lastUsedTopic}"</span>
                                </div>
                            )}

                            <div className="whitespace-pre-wrap text-[#f8fafc]">
                                {rantText}
                                {targetText.length > rantText.length && <span className="inline-block w-2 h-5 bg-white/50 animate-pulse ml-1 align-middle"></span>}
                            </div>
                        </div>
                    </>
                ) : (
                    /* History Feed Layout */
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                       <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
                          <div className="flex items-center gap-3">
                             <span className="text-sky-400 font-mono text-xs uppercase tracking-widest font-bold">Historical Archive</span>
                             <span className="text-white/30 text-xs font-mono">•</span>
                             <span className="text-white/60 text-xs font-mono">{pastTakes.length} Takes Persisted</span>
                          </div>
                          <button 
                             onClick={fetchHistory}
                             className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs font-mono transition-all"
                          >
                             🔄 Refresh
                          </button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-4 animate-fade-in">
                          {loadingHistory ? (
                             <div className="h-full flex items-center justify-center text-white/30 font-mono text-sm uppercase tracking-widest animate-pulse">
                                Loading Archive Subspace...
                             </div>
                          ) : pastTakes.length === 0 ? (
                             <div className="h-full flex items-center justify-center text-white/10 uppercase font-black text-2xl tracking-widest select-none">
                                Archive is Empty
                             </div>
                          ) : (
                             pastTakes.map((take: any) => {
                                const nameStr = take.persona || 'barf';
                                const avatarKey = nameStr.toLowerCase().replace(/[\s_]/g, '');
                                //@ts-ignore
                                const avatarUrl = avatarMap[avatarKey] || `/api/persona_image/${nameStr.toLowerCase()}`;
                                return (
                                   <div key={take.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-3 relative group">
                                      <div className="flex items-start justify-between">
                                         <div className="flex items-center gap-3">
                                            <img src={avatarUrl} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt={nameStr} />
                                            <div>
                                               <div className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                                  {nameStr}
                                                  <span className="text-[10px] text-white/40 lowercase font-mono">@{nameStr}</span>
                                               </div>
                                               <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">{take.created_at}</div>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono uppercase">
                                               {take.engine}
                                            </span>
                                            <button 
                                               onClick={() => navigator.clipboard.writeText(take.response || take.text)}
                                               className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                                               title="Copy Rant"
                                            >
                                               <ClipboardCopy size={12} />
                                            </button>
                                         </div>
                                      </div>
                                      <div className="text-xs font-mono text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-1.5">
                                         <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] mr-2">Topic:</span>
                                         {take.topic}
                                      </div>
                                      <div className="text-sm font-sans text-white/80 leading-relaxed font-light pl-1 whitespace-pre-wrap">
                                         {take.response || take.text}
                                      </div>
                                   </div>
                                );
                             })
                          )}
                       </div>
                    </div>
                )}
            </div>
        </div>

        {/* Flow Prompt Modal */}
        <AnimatePresence>
            {flowPrompt && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-10"
                >
                    <div className="bg-[#0B0E14] border border-blue-500/30 rounded-3xl p-8 w-[800px] max-h-full flex flex-col ">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-blue-400 font-display font-black text-2xl uppercase tracking-widest flex items-center gap-3">
                                <Sparkles size={24} /> FLOWMERCIAL SYNTHESIS
                            </h3>
                            <button onClick={() => setFlowPrompt(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 overflow-y-auto custom-scrollbar flex-1 mb-6">
                           <textarea 
                              className="w-full h-full bg-transparent border-none text-white font-mono text-sm outline-none resize-none leading-relaxed" 
                              value={flowPrompt} 
                              readOnly 
                           />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(flowPrompt);
                                    // Could add a toast here
                                }}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all flex items-center gap-2"
                            >
                                <ClipboardCopy size={16} /> Copy to Clipboard
                            </button>
                            <button 
                                onClick={() => setFlowPrompt(null)}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl  transition-all"
                            >
                                Armed for Production
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
