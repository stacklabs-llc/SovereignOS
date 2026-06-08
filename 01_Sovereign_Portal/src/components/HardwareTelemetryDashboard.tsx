import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick, Database, Globe, ShieldCheck, Network } from 'lucide-react';

export const HardwareTelemetryDashboard: React.FC = () => {
  // Real data state
  const [meshData, setMeshData] = useState<any>(null);
  const [thermalHistory, setThermalHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/system/mesh_telemetry`);
        if (res.ok) {
          const data = await res.json();
          setMeshData(data);
          
          if (data.nodes) {
            setThermalHistory(prev => {
              const next = { ...prev };
              data.nodes.forEach((node: any) => {
                if (!next[node.ip]) next[node.ip] = Array(20).fill(0);
                next[node.ip] = [...next[node.ip].slice(1), node.temp || 0];
              });
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Telemetry fetch failed", err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalRamGB = ((meshData?.cluster?.total_ram_mb || 0) / 1024).toFixed(1);
  const usedRamGB = ((meshData?.cluster?.used_ram_mb || 0) / 1024).toFixed(1);
  const ramPercent = meshData?.cluster?.total_ram_mb ? Math.round((meshData.cluster.used_ram_mb / meshData.cluster.total_ram_mb) * 100) : 0;
  
  const nodes = meshData?.nodes || [];

  return (
    <div className="h-full bg-[#0a0c10] text-[#cbd5e1] font-mono p-6 selection:bg-[#38bdf8] selection:text-[#0f1115] overflow-y-auto">
      <div className="max-w-[1920px] mx-auto space-y-6">
        
        {/* Header Ribbon */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#38bdf8]" />
              Nexus <span className="text-[#38bdf8] font-light">Mesh Telemetry</span>
            </h1>
            <p className="text-slate-500 mt-2 text-xs uppercase tracking-[0.2em]">Distributed Hardware & Telemetry Grid</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 px-4 py-2 bg-white/5 border border-white/10 rounded">
            <span className="text-xs font-semibold tracking-wider text-slate-400">MESH STATUS</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400  animate-pulse"></div>
              <span className="text-emerald-400 text-sm font-bold">SECURE</span>
            </div>
          </div>
        </header>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            icon={<MemoryStick />} 
            title="Total Cluster RAM" 
            value={`${usedRamGB} TB`} 
            trend={`${ramPercent}% used`} 
            subvalue={`/ ${totalRamGB} TB`} 
            status="nominal" 
            progress={ramPercent} 
          />
          <MetricCard 
            icon={<Cpu />} 
            title="Avg Cluster Load" 
            value={`${meshData?.cluster?.avg_load || 0}%`} 
            trend="NOMINAL" 
            status="nominal" 
          />
          <MetricCard 
            icon={<Network />} 
            title="Mesh Nodes Online" 
            value={`${meshData?.cluster?.active_nodes || 0}`} 
            trend={`${meshData?.cluster?.total_nodes ? Math.round(((meshData?.cluster?.active_nodes || 0) / meshData?.cluster?.total_nodes) * 100) : 0}% Status: ONLINE`} 
            subvalue={`/ ${meshData?.cluster?.total_nodes || 0}`} 
            status="nominal" 
            highlight 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
          {/* Node Grid (Left Side) */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
            <h3 className="text-xs text-slate-400 uppercase tracking-[0.15em] font-semibold flex items-center gap-2 mb-4 shrink-0">
              <Database className="w-4 h-4 text-[#38bdf8]" /> Mesh Node Status
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 hide-scrollbar">
               <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
               {nodes.map((node: any, idx: number) => (
                 <div key={idx} className="bg-black/40 border border-white/10 rounded-lg p-4 relative overflow-hidden group hover:border-[#38bdf8]/50 transition-colors shrink-0">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                         <div className="text-xs text-white font-bold tracking-wider">{node.hostname}</div>
                         <div className="text-[10px] text-slate-500 mt-0.5">IP: {node.ip}</div>
                       </div>
                       <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${node.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                         {node.status}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase">CPU Load</div>
                         <div className="text-sm text-white font-bold">{node.cpu_load}%</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase">Temperature</div>
                         <div className={`text-sm font-bold ${node.temp > 60 ? 'text-amber-400' : 'text-[#38bdf8]'}`}>{node.temp}°C</div>
                       </div>
                    </div>

                    {/* Sparkline */}
                    <div className="h-6 w-full flex items-end gap-[1px]">
                      {(thermalHistory[node.ip] || Array(20).fill(0)).map((h, i) => (
                        <div key={i} className="flex-1 bg-white/10 rounded-t-sm relative overflow-hidden" style={{ height: '100%' }}>
                          <div 
                            className={`absolute bottom-0 w-full transition-all duration-300 ${h > 60 ? 'bg-amber-400' : 'bg-[#38bdf8]'}`}
                            style={{ height: `${Math.min(100, Math.max(10, h))}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
               {nodes.length === 0 && <div className="col-span-2 text-center text-slate-500 py-12 text-sm">Scanning tailscale mesh...</div>}
            </div>
          </div>

          {/* Topology Map (Right Side) */}
          <div className="lg:col-span-5 border border-white/10 bg-white/5 rounded-xl p-6 relative flex flex-col shrink-0">
            <h3 className="text-xs text-slate-400 uppercase tracking-[0.15em] font-semibold flex items-center gap-2 mb-6">
              <Globe className="w-4 h-4 text-[#38bdf8]" /> Mesh Topology Map
            </h3>
            
            <div className="flex-1 border border-white/5 rounded-lg bg-[#050608] relative overflow-hidden flex items-center justify-center">
              {/* Grid Background */}
              <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '1rem 1rem' }}></div>
              
              {nodes.length > 0 && (
                <div className="relative w-full h-full z-10 flex items-center justify-center">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20">
                     <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center ">
                        <span className="text-cyan-400 font-bold text-xs">HQ</span>
                     </div>
                  </div>

                  {nodes.filter((n: any) => n.ip !== "127.0.0.1").map((node: any, idx: number, arr: any[]) => {
                    const angle = (idx / arr.length) * 2 * Math.PI;
                    const radius = 120 + Math.random() * 40;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    const isOnline = node.status === 'ONLINE';

                    return (
                      <div key={idx} className="absolute top-1/2 left-1/2" style={{ transform: `translate(${x}px, ${y}px)` }}>
                         {/* Connection Line SVG */}
                         <svg className="absolute top-0 left-0 overflow-visible pointer-events-none -z-10" style={{ transform: 'translate(-50%, -50%)' }}>
                            <line 
                              x1={0} y1={0} 
                              x2={-x} y2={-y} 
                              stroke={isOnline ? "#0ea5e9" : "#334155"} 
                              strokeWidth="1" 
                              strokeOpacity={isOnline ? "0.5" : "0.3"}
                              strokeDasharray={isOnline ? "4 2" : "none"}
                            />
                         </svg>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-cyan-400 ' : 'bg-slate-600'} transition-all group-hover:scale-150 cursor-pointer`}></div>
                            <span className="text-[8px] text-white/50 mt-1 absolute top-full whitespace-nowrap">{node.hostname}</span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Component sub-module
const MetricCard = ({ icon, title, value, subvalue, trend = '', status, highlight, progress }: any) => {
  const isOk = status === 'nominal';
  const colorClass = isOk ? 'text-[#38bdf8]' : 'text-amber-400';
  const bgglow = isOk ? (highlight ? ' bg-[#38bdf8]/5' : 'bg-white/5') : ' bg-amber-400/5';

  return (
    <div className={`border border-white/10 p-5 rounded-xl relative overflow-hidden ${bgglow}`}>
      <div className={`absolute left-0 top-0 w-1 h-full ${isOk ? 'bg-[#38bdf8]' : 'bg-amber-400'}`}></div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{title}</h3>
        <div className={`p-1.5 rounded bg-black/40 border border-white/10 ${colorClass}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
        {value} {subvalue && <span className="text-sm text-slate-500 font-normal">{subvalue}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
        <span className={trend?.includes('ONLINE') || trend === 'NOMINAL' || (progress !== undefined && progress < 80) ? 'text-emerald-400' : 'text-amber-400'}>
          {trend}
        </span>
        <span className={colorClass}>
          {status}
        </span>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
           <div className={`h-full ${progress > 80 ? 'bg-amber-400' : 'bg-[#38bdf8]'}`} style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};
