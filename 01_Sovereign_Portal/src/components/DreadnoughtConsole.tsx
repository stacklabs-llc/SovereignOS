import React, { useState, useEffect } from 'react';
import { Cpu, Server, Activity, Thermometer, Terminal, Power, RefreshCcw } from 'lucide-react';

export default function DreadnoughtConsole() {
  const [telemetry, setTelemetry] = useState<string>('Initializing SSH Handshake...');
  const [status, setStatus] = useState<'ACTIVE' | 'IDLE' | 'OFFLINE' | 'ERROR'>('OFFLINE');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
      try {
          const res = await fetch('/api/dreadnought/status');
          if (res.ok) {
              const data = await res.json();
              setStatus(data.status);
              setTelemetry(data.telemetry);
              setLastUpdated(new Date());
          }
      } catch (e) {
          setStatus('OFFLINE');
          setTelemetry('Network Error: Cannot reach Daemon.');
      }
  };

  useEffect(() => {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[85vh] w-full flex flex-col p-6 bg-[#0B0E14] text-[#c5c6c7] font-['Segoe_UI',sans-serif] overflow-y-auto">
      
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded bg-[#ff3366]/20 flex items-center justify-center border border-[#ff3366]/50 ">
          <Server className="w-6 h-6 text-[#ff3366]" />
        </div>
        <div>
          <h1 className="text-white uppercase font-black tracking-[0.15em] text-2xl drop-shadow-md">
            Dreadnought Monitor
          </h1>
          <p className="text-[12px] text-[#8E9CAA] uppercase tracking-widest font-mono">
            Node .183 // Heavy Inference Engine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Vitals */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-[#00ff00]" /> System Vitals
                </h3>
                
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-white/5">
                        <span className="text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"><Power className="w-3 h-3 text-[#ff3366]" /> Status</span>
                        <span className={`font-bold font-mono text-xs ${status === 'ACTIVE' ? 'text-[#f2a900]' : status === 'IDLE' ? 'text-[#00ff00]' : 'text-[#ff3366]'}`}>
                            {status}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-white/5">
                        <span className="text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"><Cpu className="w-3 h-3 text-[#38bdf8]" /> Processor</span>
                        <span className="font-mono text-xs text-white">Ryzen 7 5800H</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-white/5">
                        <span className="text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"><Server className="w-3 h-3 text-[#E0BC68]" /> Memory</span>
                        <span className="font-mono text-xs text-white">24GB DDR4</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex-1 flex flex-col">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                    Active Pipelines
                </h3>
                <div className="flex-1 flex flex-col justify-center items-center bg-black/50 border border-white/5 rounded p-4">
                    {status === 'ACTIVE' ? (
                        <div className="text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#f2a900]/20 flex items-center justify-center border border-[#f2a900]/50 animate-[pulse_1s_ease-in-out_infinite]">
                                <Activity className="w-8 h-8 text-[#f2a900]" />
                            </div>
                            <div>
                                <h4 className="text-[#f2a900] font-bold font-mono text-sm uppercase tracking-widest mb-1">Whisper Engine</h4>
                                <p className="text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest">Processing Audio Payload</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center flex flex-col items-center gap-4 opacity-50">
                            <div className="w-16 h-16 rounded-full bg-[#00ff00]/10 flex items-center justify-center border border-[#00ff00]/30">
                                <Activity className="w-8 h-8 text-[#00ff00]" />
                            </div>
                            <div>
                                <h4 className="text-[#00ff00] font-bold font-mono text-sm uppercase tracking-widest mb-1">Engines Idle</h4>
                                <p className="text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest">Awaiting Workload</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Col: SSH Telemetry */}
        <div className="lg:col-span-3 bg-[#111827] border border-white/10 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#0B0E14]">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-[#ff3366]" /> Live SSH Telemetry
                </h3>
                <span className="flex items-center gap-1 text-[9px] text-[#8E9CAA] font-mono tracking-widest uppercase">
                    Last Update: {lastUpdated.toLocaleTimeString()}
                </span>
            </div>
            <div className="flex-1 bg-black relative flex flex-col p-4">
                <pre className="text-[#00ff00] font-mono text-[11px] leading-[1.6] overflow-y-auto custom-scrollbar flex-1 whitespace-pre-wrap text-">
                    {telemetry}
                </pre>
                
                {status === 'ACTIVE' && (
                    <div className="mt-4 flex items-center gap-2 text-[#f2a900] font-mono text-[10px] uppercase tracking-widest border-t border-white/10 pt-4">
                        <RefreshCcw className="w-3 h-3 animate-spin" /> Heavy Compute Active. Please do not reboot.
                    </div>
                )}
            </div>
        </div>
        
      </div>
    </div>
  );
}
