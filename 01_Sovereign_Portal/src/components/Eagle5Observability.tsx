import React, { useEffect, useState } from 'react';

interface Telemetry {
  tempC: number;
  ramUsageTotalMB: number;
  ramUsageUsedMB: number;
  swapUsedMB: number;
  load1m: number;
  load5m: number;
  load15m: number;
  powerRailNominal: boolean;
}

export const Eagle5Observability: React.FC = () => {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:8090/api/system/telemetry`);
        if (!response.ok) throw new Error('Telemetry fetch failed');
        const data = await response.json();
        setTelemetry(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-screen bg-[#0f1115] text-cyan-400 font-mono">
        <p className="animate-pulse">[ INITIATING HARDWARE HANDSHAKE... ]</p>
      </div>
    );
  }

  // Thermal Matrix
  const tempColor = telemetry.tempC > 80 ? 'text-red-500' : telemetry.tempC > 70 ? 'text-amber-500' : 'text-green-500';
  const tempStatusColor = telemetry.tempC > 80 ? 'bg-red-500' : telemetry.tempC > 70 ? 'bg-amber-500' : 'bg-green-500';
  const tempLabel = telemetry.tempC > 80 ? 'CRITICAL THERMAL' : telemetry.tempC > 70 ? 'ELEVATED THERMAL' : 'NOMINAL';

  // Swap Thresholds
  const swapWarning = telemetry.swapUsedMB > 0;
  
  // Power Rail Purity 
  const powerColor = telemetry.powerRailNominal ? 'text-cyan-400 border-cyan-500/50' : 'text-red-500 border-red-500/50';
  const powerGlow = telemetry.powerRailNominal ? '' : '';

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-mono text-slate-300">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Ribbon */}
        <header className="border-b border-slate-800 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest">
              EAGLE 5 <span className="text-cyan-400">NODE .73</span>
            </h1>
            <p className="text-slate-500 mt-1 text-xs">BETTERSTACK CLONE // VESPER SYNTHWAVE // NATIVE POLLING</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wider text-slate-400">STATE</span>
            <div className={`h-3 w-3 rounded-full ${error ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`}></div>
          </div>
        </header>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* SoC Temp Card */}
          <div className="border border-slate-800 bg-[#161920] p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className={`absolute top-0 right-0 w-1.5 h-full ${tempStatusColor}`}></div>
            <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">SoC Core Temp</h3>
            <div className={`text-4xl font-bold tracking-tight ${tempColor}`}>
              {telemetry.tempC.toFixed(1)}°C
            </div>
            <p className="text-xs text-slate-500 mt-4 font-semibold uppercase tracking-widest">
              {tempLabel}
            </p>
          </div>

          {/* RAM & Swap */}
          <div className="border border-slate-800 bg-[#161920] p-6 relative hover:border-slate-600 transition-colors">
             <div className={`absolute top-0 right-0 w-1.5 h-full ${swapWarning ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
             <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">System Memory</h3>
             <div className="text-2xl font-bold text-white mb-1">
               {telemetry.ramUsageUsedMB} <span className="text-slate-500 text-lg">/ {telemetry.ramUsageTotalMB} MB</span>
             </div>
             <div className="flex justify-between items-center mt-4">
               <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Swap Saturation</span>
               <span className={`text-sm font-bold ${swapWarning ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                 {telemetry.swapUsedMB} MB
               </span>
             </div>
          </div>

          {/* CPU Load */}
          <div className="border border-slate-800 bg-[#161920] p-6 relative hover:border-slate-600 transition-colors">
             <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500"></div>
             <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Compute Load</h3>
             <div className="grid grid-cols-3 gap-2 text-center mt-4 border-t border-slate-800 pt-3">
               <div>
                 <div className="text-[10px] text-slate-500 mb-1">1M</div>
                 <div className="text-lg text-cyan-400 font-semibold">{telemetry.load1m.toFixed(2)}</div>
               </div>
               <div className="border-l border-slate-800">
                 <div className="text-[10px] text-slate-500 mb-1">5M</div>
                 <div className="text-lg text-cyan-400 font-semibold">{telemetry.load5m.toFixed(2)}</div>
               </div>
               <div className="border-l border-slate-800">
                 <div className="text-[10px] text-slate-500 mb-1">15M</div>
                 <div className="text-lg text-cyan-400 font-semibold">{telemetry.load15m.toFixed(2)}</div>
               </div>
             </div>
          </div>

          {/* Power Rail */}
          <div className="border border-slate-800 bg-[#161920] p-6 relative hover:border-slate-600 transition-colors">
            <div className={`absolute top-0 right-0 w-1.5 h-full ${telemetry.powerRailNominal ? 'bg-cyan-500' : 'bg-red-500'}`}></div>
            <h3 className="text-xs text-slate-400 mb-4 uppercase tracking-wider font-semibold">5.1V Rail Purity</h3>
            <div className="flex items-center h-full pb-4">
              <div className={`text-sm font-bold uppercase tracking-widest px-4 py-2 border ${powerColor} bg-[#0f1115] rounded shadow-sm ${powerGlow} transition-all`}>
                {telemetry.powerRailNominal ? 'NOMINAL' : 'UNDERVOLTAGE_ALERT'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
