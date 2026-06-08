import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Cpu, Activity, Database, Server, Flame, HardDrive, Network } from "lucide-react";

export default function PegasusDreadnought() {
  const [streamData, setStreamData] = useState<string>("");
  const [isInjecting, setIsInjecting] = useState(false);
  const [statusText, setStatusText] = useState("AWAITING UPLINK");
  
  // Hardware Telemetry Mocks
  const [cpuTemp, setCpuTemp] = useState(72);
  const [botVelocity, setBotVelocity] = useState(4.2);

  // Artificial fluctuating metrics
  useEffect(() => {
      const interval = setInterval(() => {
          setCpuTemp(prev => prev > 84 ? 70 : prev + Math.random() * 2);
          setBotVelocity(prev => Math.max(1, prev + (Math.random() - 0.4)));
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  const getTempColor = (t: number) => t > 80 ? 'text-red-500' : t > 75 ? 'text-amber-500' : 'text-[#22c55e]';

  const initiateTelemetry = async () => {
    setIsInjecting(true);
    setStreamData("");
    setStatusText("ESTABLISHING PEGASUS .168 BRIDGE...");
    
    setTimeout(async () => {
        setStatusText("LOCAL LLM ACQUIRED [MISTRAL:LATEST]. PARSING TELEMETRY...");
        setCpuTemp(prev => prev + 5); // Spiking temp on extraction
        try {
            const apiHost = window.location.protocol === "https:" ? "" : `http://${window.location.hostname}:8007`;
            const response = await fetch(`${apiHost}/api/pegasus_stream`, { method: "POST" });
            if (!response.body) throw new Error("No readable stream");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setStatusText("NEURAL EXTRACTION IN PROGRESS...");
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunkString = decoder.decode(value);
                const lines = chunkString.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        setStreamData(prev => prev + line.replace('data: ', ''));
                    }
                }
            }
            setStatusText("EXTRACTION COMPLETE. LINK SEVERED.");
        } catch (e) {
            setStatusText(`ERROR: ${(e as Error).message}`);
        } finally {
            setIsInjecting(false);
        }
    }, 1500);
  };

  return (
    <motion.div 
        key="pegasus"
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.98 }}
        className="h-full min-h-[85vh] mx-auto p-3 bg-void vm-body rounded-2xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 shrink-0 gap-5 relative z-10 bg-black/40">
        <div className="absolute -bottom-[1px] left-4 w-[100px] h-[2px] bg-[#ef4444] "></div>
        <h1 className="font-['Outfit'] text-[20px] font-bold tracking-[0.1em] text-[#ef4444] drop-shadow-lg uppercase flex items-center gap-3">
          <Database className="w-5 h-5"/> Pegasus Dreadnought
        </h1>
        <div className="text-[13px] text-[#94a3b8] flex-1 font-['Inter']">
          Strategic Asset & Telemetry Command Center
        </div>
        <div className="flex items-center gap-2 font-['Outfit'] text-[11px] font-bold tracking-[0.05em] px-3 py-1 bg-black/50 border border-white/10 rounded text-white/50">
            <span className={`w-2 h-2 rounded-full ${isInjecting ? 'bg-red-500 animate-pulse shadow-[0_0_8px_red]' : 'bg-[#38bdf8]'}`}></span>
            {statusText}
        </div>
      </div>

      <div className="flex-1 w-full mx-auto relative z-10 p-4 gap-4 grid grid-cols-12 overflow-y-auto custom-scrollbar">
          
          {/* Main LLM Telemetry Window */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="vm-panel-glass p-1 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex-1 flex flex-col min-h-[400px]">
                 <div className="bg-black/60 px-4 py-3 border-b border-white/10 flex justify-between items-center shrink-0">
                     <span className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase">Pegasus .168 Data Stream</span>
                     <span className="text-[10px] text-[#38bdf8] font-['Outfit'] tracking-widest bg-[#38bdf8]/10 px-2 py-0.5 rounded border border-[#38bdf8]/30 inline-flex items-center gap-2">
                        <Activity className="w-3 h-3" /> LIVE MESH
                     </span>
                 </div>
                 
                 <div className="flex-1 bg-[#050B14]/80 p-5 font-mono text-[13px] tracking-wide text-[#38bdf8]/90 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                     {streamData || <span className="opacity-30 blink">__AWAITING_INJECTION_PROTOCOL...</span>}
                 </div>
                 
                 <div className="bg-black/80 px-4 py-3 border-t border-white/10 flex justify-between items-center shrink-0">
                     <div className="font-['Outfit'] text-[10px] text-[#94a3b8] tracking-widest flex gap-4">
                         <span>MODEL: MISTRAL:LATEST</span>
                         <span>CTX: 8K_SUBCHUNKS</span>
                     </div>
                     <button
                       onClick={initiateTelemetry}
                       disabled={isInjecting}
                       className={`px-6 py-2 rounded border font-['Outfit'] text-[11px] font-bold uppercase tracking-[0.15em] transition-all  ${
                           isInjecting ? 'bg-[#38bdf8]/5 border-[#38bdf8]/20 text-[#38bdf8]/40 cursor-not-allowed' :
                           'bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#0B0E14] '
                       }`}
                     >
                       {isInjecting ? "Extracting..." : "Compile Telemetry"}
                     </button>
                 </div>
              </div>
          </div>

          {/* Hardware & Mesh Metrics Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              
              {/* Raspberry Pi 5 Thermal Monitor */}
              <div className="vm-panel-glass p-0 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                 <div className="bg-black/60 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                     <span className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5" /> Node .74 Hardware Matrix
                     </span>
                 </div>
                 <div className="p-5 flex flex-col gap-5">
                     <div className="flex justify-between items-end border-b border-white/5 pb-3">
                         <div className="text-[11px] text-[#94a3b8] font-bold tracking-widest uppercase">SoC Core Temp</div>
                         <div className={`font-['Outfit'] text-3xl font-bold flex items-center gap-2 drop-shadow-md ${getTempColor(cpuTemp)}`}>
                             {cpuTemp.toFixed(1)}°C {cpuTemp > 80 && <Flame className="w-5 h-5 animate-pulse" />}
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">RAM Usage</div>
                             <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                 <div className={`h-full ${cpuTemp > 80 ? 'bg-red-500 w-[92%]' : 'bg-[#f59e0b] w-[64%]'}`}></div>
                             </div>
                             <div className="text-[10px] text-white/50 text-right mt-1 font-mono">{cpuTemp > 80 ? '7.3' : '5.1'} / 8.0 GB</div>
                         </div>
                         <div>
                             <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Swap File</div>
                             <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                 <div className={`h-full ${cpuTemp > 80 ? 'bg-red-500 w-[78%]' : 'bg-[#38bdf8] w-[12%]'}`}></div>
                             </div>
                             <div className="text-[10px] text-white/50 text-right mt-1 font-mono">{cpuTemp > 80 ? '3.1' : '0.4'} / 4.0 GB</div>
                         </div>
                     </div>
                     <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded p-3 flex justify-between items-center">
                         <div className="text-[10px] text-[#ef4444] font-bold uppercase tracking-wider flex items-center gap-2">
                             <HardDrive className="w-3 h-3" /> 5.1V Rail Status
                         </div>
                         <div className="text-[11px] text-[#ef4444] font-mono">NOMINAL</div>
                     </div>
                 </div>
              </div>

              {/* Bot Spiraling / MARD Engine Monitor */}
              <div className="vm-panel-glass p-0 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex-1 overflow-hidden">
                 <div className="bg-black/60 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                     <span className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase flex items-center gap-2">
                        <Network className="w-3.5 h-3.5" /> Chatbot Mesh Load
                     </span>
                 </div>
                 <div className="p-5 flex flex-col gap-4">
                     <div className="bg-black/30 rounded border border-white/5 p-3 flex justify-between items-center">
                         <span className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">Chat Velocity</span>
                         <span className={`font-mono text-[14px] ${botVelocity > 5 ? 'text-red-500' : 'text-[#f59e0b]'}`}>{botVelocity.toFixed(2)} msg/sec</span>
                     </div>
                     <div className="bg-black/30 rounded border border-white/5 p-3 flex justify-between items-center">
                         <span className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">Context Bloat</span>
                         <span className={`font-mono text-[14px] ${isInjecting ? 'text-red-500' : 'text-[#38bdf8]'}`}>
                            {isInjecting ? 'CRITICAL WARN' : 'STABLE'}
                         </span>
                     </div>
                     <div className="bg-black/30 rounded border border-white/5 p-3 flex justify-between items-center">
                         <span className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">Active Daemons</span>
                         <span className="font-mono text-[14px] text-white">57 / 157</span>
                     </div>

                     {cpuTemp > 80 && (
                         <div className="mt-2 text-[10px] tracking-widest leading-loose text-red-500 uppercase font-bold text-center border border-red-500/30 bg-red-500/10 p-2 rounded animate-pulse">
                             ⚠️ WARNING: BOT SPIRALING DETECTED. Pi 5 THERMAL THROTTLING IMMINENT.
                         </div>
                     )}
                 </div>
              </div>

          </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.4); }
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
      `}</style>
    </motion.div>
  );
}
