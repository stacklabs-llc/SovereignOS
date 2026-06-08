import React, { useState, useEffect } from 'react';
import avatarMap from '../avatarMap';

interface ModelResult {
  model: string;
  text: string;
  time: number;
}

export default function ModelArena() {
  const [personas, setPersonas] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('Barf');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [phiResult, setPhiResult] = useState<ModelResult | null>(null);
  const [llamaResult, setLlamaResult] = useState<ModelResult | null>(null);
  const [geminiResult, setGeminiResult] = useState<ModelResult | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');

  useEffect(() => {
    // Load personas from avatarMap
    const names = Object.keys(avatarMap);
    setPersonas(names.sort());
    if (names.includes('Barf')) setSelectedPersona('Barf');
    else if (names.length > 0) setSelectedPersona(names[0]);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0 && !selectedVoiceUri) {
        setSelectedVoiceUri(available[0].voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoiceUri]);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.voiceURI === selectedVoiceUri);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const handleFight = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setPhiResult(null);
    setLlamaResult(null);
    setGeminiResult(null);

    try {
      const response = await fetch(`http://${window.location.hostname}:8090/api/models/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          persona: selectedPersona
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.results) {
          data.results.forEach((res: ModelResult) => {
            if (res.model === 'phi3:mini') setPhiResult(res);
            if (res.model === 'dolphin-llama3') setLlamaResult(res);
            if (res.model === 'gemini-2.5-flash') setGeminiResult(res);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch model comparison", err);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultCard = ({ title, result, border, text, glow }: { title: string, result: ModelResult | null, border: string, text: string, glow: string }) => (
    <div className={`flex-1 bg-black/40 backdrop-blur-md border ${border} rounded-xl p-4 flex flex-col relative overflow-hidden shadow-lg`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${glow} blur-2xl pointer-events-none`}></div>
      
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2 relative z-10">
        <h3 className={`font-display text-lg font-bold tracking-widest uppercase ${text}`}>{title}</h3>
        <div className="flex items-center gap-2">
          {result && !isLoading && (
            <button 
              onClick={() => speakText(result.text)}
              className="text-xs bg-white/10 hover:bg-white/20 p-1.5 rounded transition-colors text-white cursor-pointer"
              title="Play Audio"
            >
              🔊
            </button>
          )}
          <div className="font-mono text-xs text-white/50 bg-white/5 px-2 py-1 rounded border border-white/10">
            {isLoading ? (
              <span className="animate-pulse">RUNNING...</span>
            ) : result ? (
              <span className="text-white">{result.time.toFixed(2)}s</span>
            ) : (
              <span>0.00s</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto text-sm font-sans text-gray-300 leading-relaxed whitespace-pre-wrap relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
             <div className={`w-8 h-8 rounded-full border-t-2 border-r-2 ${border.replace('/30', '')} animate-spin`}></div>
          </div>
        ) : result ? (
          result.text
        ) : (
          <div className="text-white/20 italic text-center mt-10">Awaiting prompt...</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4">
      {/* Header & Controls */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shrink-0">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-full md:w-1/4 flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold font-mono text-white/50 tracking-[0.2em] uppercase mb-2">Persona Select</label>
              <select
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
                className="w-full bg-black/50 border border-[#38bdf8]/30 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
              >
                {personas.map(p => <option key={p} value={p} className="bg-black">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold font-mono text-white/50 tracking-[0.2em] uppercase mb-2">Voice Protocol</label>
              <select
                value={selectedVoiceUri}
                onChange={(e) => setSelectedVoiceUri(e.target.value)}
                className="w-full bg-black/50 border border-[#38bdf8]/30 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] truncate"
              >
                {voices.map(v => <option key={v.voiceURI} value={v.voiceURI} className="bg-black">{v.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="w-full md:w-3/4 flex flex-col md:flex-row gap-4 items-center">
             <div className="w-full flex-1">
               <label className="block text-[10px] font-bold font-mono text-white/50 tracking-[0.2em] uppercase mb-2">Prompt Input</label>
               <input
                 type="text"
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Ask the persona a question..."
                 onKeyDown={(e) => { if (e.key === 'Enter') handleFight(); }}
                 className="w-full bg-black/50 border border-[#38bdf8]/30 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
               />
             </div>
             
             <button
               onClick={handleFight}
               disabled={isLoading || !prompt.trim()}
               className={`mt-6 shrink-0 px-8 py-3 rounded-lg font-bold tracking-[0.2em] uppercase text-xs transition-all cursor-pointer ${
                 isLoading || !prompt.trim() 
                  ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                  : 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 hover:bg-[#38bdf8]/40 '
               }`}
             >
               {isLoading ? 'Generating...' : 'Initiate'}
             </button>
          </div>
        </div>
      </div>

      {/* Battle Arena Columns */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        <ResultCard 
          title="Phi-3 Mini" 
          result={phiResult} 
          border="border-green-500/30" 
          text="text-green-400" 
          glow="bg-green-500/10" 
        />
        <ResultCard 
          title="Dolphin-Llama3" 
          result={llamaResult} 
          border="border-purple-500/30" 
          text="text-purple-400" 
          glow="bg-purple-500/10" 
        />
        <ResultCard 
          title="Gemini 2.5 Flash" 
          result={geminiResult} 
          border="border-cyan-500/30" 
          text="text-cyan-400" 
          glow="bg-cyan-500/10" 
        />
      </div>
    </div>
  );
}