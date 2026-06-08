import React, { useState } from 'react';

export default function HolodeckGenerator() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAsset, setGeneratedAsset] = useState<{type: 'image'|'stat', src: string, name: string} | null>(null);

    const handleSynthesize = () => {
        if (!prompt) return;
        setIsGenerating(true);
        setGeneratedAsset(null);
        
        // Mock generation delay
        setTimeout(() => {
            const isStat = prompt.toLowerCase().includes('stat') || prompt.toLowerCase().includes('data');
            setGeneratedAsset({
                type: isStat ? 'stat' : 'image',
                src: isStat ? 'https://s3.amazonaws.com/savant-sandbox/stat_card_mock.jpg' : 'https://s3.amazonaws.com/savant-sandbox/reaction_mock.jpg',
                name: isStat ? `SAVANT_${Math.random().toString(36).substring(2, 8).toUpperCase()}` : `REACT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            });
            setIsGenerating(false);
        }, 2500);
    };

    const handleDeploy = () => {
        if (!generatedAsset) return;
        
        // M.A.R.D. / FanStack Deployment Mock
        const ws = new WebSocket(`ws://${window.location.hostname}:8008`);
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: "CMD_MSG", 
                text: `[ASSET DEPLOYED] >>> ${generatedAsset.name}`
            }));
            ws.close();
            alert(`Deployed ${generatedAsset.name} to the Sovereign FanMesh!`);
        };
        ws.onerror = () => {
            // Fallback alert if WS is offline
            alert(`Deployed ${generatedAsset.name} to the Sovereign FanMesh! (Offline fallback)`);
        };
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0E14] text-gray-200 overflow-hidden min-h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar2 flex flex-col gap-4">
                <style>{`
                    .custom-scrollbar2::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar2::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
                `}</style>
                
                <div className="border-b border-white/10 pb-3">
                    <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#38bdf8] uppercase mb-1">HoloDeck Synthesizer</div>
                    <div className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest">Generate Tactical Visuals</div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-mono text-[9px] text-[#8E9CAA] tracking-[0.15em] uppercase">Savant / Scenario Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Lindor 108mph exit velo stat card' OR 'Angry Mets fan reaction'"
                        className="w-full bg-black/60 border border-[#38bdf8]/30 focus:border-[#38bdf8] rounded-lg px-3 py-2 text-white font-mono text-[11px] outline-none transition-all resize-none h-20 "
                    />
                    <button 
                        onClick={handleSynthesize} 
                        disabled={isGenerating || !prompt}
                        className={`mt-2 font-['Outfit'] text-[11px] font-bold tracking-[0.1em] p-2.5 rounded-lg border uppercase transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 text-white animate-pulse cursor-not-allowed' : 'bg-[#38bdf8]/10 border-[#38bdf8]/30 hover:bg-[#38bdf8] hover:text-[#0B0E14] text-[#38bdf8]  disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Synthesizing...
                            </>
                        ) : "Generate Asset"}
                    </button>
                </div>

                <div className="mt-2 flex-1 flex flex-col">
                    <div className="font-mono text-[9px] text-[#8E9CAA] tracking-[0.15em] uppercase mb-2">Simulation Chamber</div>
                    
                    <div className="flex-1 min-h-[140px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden group">
                        {isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                                <div className="w-16 h-16 border-4 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin "></div>
                                <div className="mt-4 font-mono text-[10px] text-[#38bdf8] uppercase tracking-[0.2em] animate-pulse">Running Simulation...</div>
                            </div>
                        )}
                        
                        {!isGenerating && !generatedAsset && (
                            <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em] text-center px-4">
                                Chamber Empty<br/>Awaiting Scenario Prompt
                            </div>
                        )}

                        {!isGenerating && generatedAsset && (
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex-1 bg-[#1A1A1A] flex items-center justify-center border-b border-white/10 relative">
                                     <div className="absolute top-2 left-2 font-mono text-[8px] bg-black/60 px-2 py-1 rounded text-[#38bdf8] uppercase tracking-widest border border-[#38bdf8]/30 backdrop-blur-md">
                                        {generatedAsset.name}
                                     </div>
                                     <div className="font-['Outfit'] text-2xl font-black text-white/10 rotate-[-15deg] select-none tracking-widest uppercase">
                                        {generatedAsset.type === 'stat' ? 'SAVANT DATA' : 'REACTION CAM'}
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Deploy Panel */}
            <div className="p-4 bg-black/30 border-t border-white/10 shrink-0">
                <button 
                    onClick={handleDeploy} 
                    disabled={!generatedAsset || isGenerating}
                    className="w-full font-['Outfit'] text-[12px] font-bold tracking-[0.1em] p-3 rounded-xl border border-[#FF5910]/50 bg-[#FF5910]/10 text-[#FF5910] uppercase transition-all hover:bg-[#FF5910] hover:text-[#0B0E14]  disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Broadcast to Mesh
                </button>
            </div>
        </div>
    );
}
