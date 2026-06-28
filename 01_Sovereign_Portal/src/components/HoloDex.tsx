import React, { useState } from 'react';

export default function HoloDex() {
  const [basePrompt, setBasePrompt] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("1990s Felt Puppet");
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedPrompt, setDecodedPrompt] = useState("");

  const vibes = [
    "1990s Felt Puppet", "Cinematic Broadcast", "Action Cam", 
    "Gritty Noir", "Hyper-Realistic", "Retro 8-Bit", "Surreal Anime"
  ];

  const history = [
    { id: 5, type: "image", url: "/images/holodex_paper_bag.png", prompt: "Mets Tavern: Paper Bag of Shame (1990s Felt Puppet)" },
    { id: 1, type: "video", url: "/amen_corner_images/Shot-Tracer_App_golf_202604221005.jpeg", prompt: "Tiger Woods hitting a stinger" },
    { id: 2, type: "image", url: "/amen_corner_images/UI_design_chat_202604221005.jpeg", prompt: "UI Concept for HoloDex" },
    { id: 3, type: "image", url: "/amen_corner_images/Wind_Probability_Dashboard_202604221005.jpeg", prompt: "Wind probability dashboard" },
    { id: 4, type: "video", url: "/amen_corner_images/FanStack_PGA_Amen_202604221005.jpeg", prompt: "Amen Corner overview" },
  ];

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    setGeneratedImage(null);
    setBroadcastSuccess(false);
    setDecodedPrompt("");
    try {
      const response = await fetch('/api/holodex/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt, vibe: selectedVibe })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setGeneratedImage(data.mediaUrl);
        setDecodedPrompt(data.decoded_prompt);
      } else {
        setDecodedPrompt(`SYNTHESIS FAILED: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setDecodedPrompt("CONNECTION TO ENGINE LOST.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleBroadcast = () => {
    if (!generatedImage) return;
    setIsBroadcasting(true);
    
    // Connect to WebSocket Relay to send the precog image to room 823131
    const wsUrl = `ws://${window.location.hostname}:8008`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      // Join Room 823131
      ws.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: "823131" }));
      
      // Dispatch CHAT_MESSAGE
      const payload = {
        type: "CHAT_MESSAGE",
        user: "Precog Creator",
        color: "#f97316",
        text: `⚡ NEW HOLODEX PRECÒG BROADCAST: "${basePrompt}"`,
        mediaUrl: generatedImage,
        shake: true,
        target_game_pk: "823131"
      };
      
      ws.send(JSON.stringify(payload));
      
      setTimeout(() => {
        ws.close();
        setIsBroadcasting(false);
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }, 1000);
    };

    ws.onerror = (err) => {
      console.error("HoloDex WebSocket Broadcast Error:", err);
      setIsBroadcasting(false);
    };
  };

  return (
    <div className="w-full min-h-[85vh] bg-[#0B0E14] text-white p-6 font-['Inter',sans-serif] flex flex-col gap-6 relative overflow-x-hidden no-scrollbar">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#38bdf8]/5 via-[#0B0E14] to-[#0B0E14] pointer-events-none z-0"></div>
      
      {/* HEADER SECTION with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-4 relative z-10 gap-4">
        <div className="flex flex-col">
          <h2 className="font-['Outfit'] font-bold text-xl text-white tracking-widest uppercase flex items-center gap-2">
            <span className="text-[#38bdf8] animate-pulse">❖</span>
            Reality Synthesis Engine
          </h2>
          <p className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-[0.2em]">
            Omniversal Reality Synthesis & Ingress
          </p>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative z-10">
          {/* LEFT COLUMN: MERGER */}
          <div className="w-full md:w-1/4 flex flex-col gap-4">
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#38bdf8]/30 rounded-2xl p-4 flex-1 flex flex-col">
               <h3 className="font-['Outfit'] font-bold text-[11px] text-[#38bdf8] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Merge Reference A
               </h3>
               <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5 transition-all cursor-pointer group">
                  <span className="text-white/30 text-3xl group-hover:text-[#38bdf8] transition-colors">+</span>
               </div>
            </div>
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#38bdf8]/30 rounded-2xl p-4 flex-1 flex flex-col">
               <h3 className="font-['Outfit'] font-bold text-[11px] text-[#38bdf8] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Merge Reference B
               </h3>
               <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5 transition-all cursor-pointer group">
                  <span className="text-white/30 text-3xl group-hover:text-[#38bdf8] transition-colors">+</span>
               </div>
            </div>
          </div>

          {/* CENTER COLUMN: THE ENGINE */}
          <div className="w-full md:w-2/4 flex flex-col">
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#38bdf8]/30 rounded-3xl p-6 flex-1 flex flex-col relative overflow-hidden">
                {/* Ambient Top Glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-50"></div>
                
                <textarea 
                   value={basePrompt}
                   onChange={(e) => setBasePrompt(e.target.value)}
                   placeholder="Describe the desired timeline anomaly..."
                   className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-5 text-white font-mono text-sm tracking-wide resize-none focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all shadow-inner mb-6 placeholder:text-white/20"
                />

                <div className="mb-6">
                    <h4 className="font-sans text-[10px] text-[#8E9CAA] uppercase tracking-[0.2em] mb-3 font-bold">Aesthetic Vibe</h4>
                    <div className="flex flex-wrap gap-2">
                       {vibes.map(vibe => (
                           <button 
                             key={vibe}
                             onClick={() => setSelectedVibe(vibe)}
                             className={`px-4 py-2 rounded-lg font-['Outfit'] text-[11px] font-bold tracking-widest uppercase transition-all ${
                                 selectedVibe === vibe 
                                   ? 'bg-[#38bdf8] text-black border border-transparent shadow-[0_0_15px_rgba(56,189,248,0.4)]' 
                                   : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                             }`}
                           >
                               {vibe}
                           </button>
                       ))}
                    </div>
                </div>

                {decodedPrompt && (
                   <div className="mb-6 p-4 bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-xl text-[#38bdf8] font-mono text-xs overflow-y-auto max-h-32 shadow-inner">
                      <span className="font-bold uppercase tracking-widest text-[9px] block mb-2 opacity-70">Decoded Output:</span>
                      {decodedPrompt}
                   </div>
                )}

                {generatedImage && (
                   <div className="mb-6 p-4 bg-black/60 border border-[#f97316]/50 rounded-2xl flex flex-col items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#f97316] to-transparent animate-pulse"></div>
                      <span className="font-['Outfit'] font-bold uppercase tracking-[0.2em] text-[10px] text-[#f97316] self-start flex items-center gap-2">
                         <span className="w-2 h-2 bg-[#f97316] rounded-full animate-ping"></span>
                         ⚡ SYNTHESIZED ANOMALY
                      </span>
                      <img 
                        src={generatedImage} 
                        alt="Synthesized reality" 
                        className="w-full max-h-64 object-contain rounded-xl border border-white/10 hover:border-[#f97316]/50 transition-all shadow-lg group-hover:scale-[1.01]"
                      />
                      <button
                        onClick={handleBroadcast}
                        disabled={isBroadcasting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#fb923c] hover:to-[#f97316] text-white font-['Outfit'] font-bold text-sm tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#f97316]/20 disabled:opacity-50"
                      >
                        {isBroadcasting ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : broadcastSuccess ? (
                          "🚀 BROADCASTED SUCCESSFULLY!"
                        ) : (
                          "⚡ SPAM TO METS TAVERN CHAT (ROOM 823131)"
                        )}
                      </button>
                   </div>
                )}

                <button 
                   onClick={handleSynthesize}
                   disabled={!basePrompt.trim() || isSynthesizing}
                   className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] text-white font-['Outfit'] font-bold text-lg tracking-[0.2em] uppercase hover:from-[#38bdf8] hover:to-[#0ea5e9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-[#38bdf8]/15"
                >
                   {isSynthesizing ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> SYNTHESIZING REALITY...</>
                   ) : (
                      <>ENGAGE SYNTHESIS ENGINE</>
                   )}
                </button>
            </div>
          </div>

          {/* RIGHT COLUMN: THE VAULT */}
          <div className="w-full md:w-1/4 flex flex-col">
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex-1 flex flex-col">
               <h3 className="font-['Outfit'] font-bold text-[11px] text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Historical Vault</span>
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[9px]">5 ITEMS</span>
               </h3>
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                   {history.map(item => (
                       <div key={item.id} className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-[#38bdf8]/50 transition-all cursor-pointer">
                           <img src={item.url} alt={item.prompt} className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <p className="font-mono text-[9px] text-[#38bdf8] truncate">{item.prompt}</p>
                               <span className="font-sans text-[8px] text-white/50 uppercase tracking-widest mt-1">{item.type}</span>
                           </div>
                       </div>
                   ))}
               </div>
            </div>
          </div>
         </div>
    </div>
  );
}
