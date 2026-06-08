import React, { useState, useEffect } from 'react';
import { 
  Camera, ShieldCheck, Activity, Database, Key, Server, Hash, ChevronRight, Video,
  FileText, Network, Sprout, DollarSign, Cpu, Clock, HardDrive
} from 'lucide-react';

interface WildseedPitchProps {
  onEnterPortal?: () => void;
  onBackToPortal?: () => void;
}

export default function WildseedPitch({ onEnterPortal, onBackToPortal }: WildseedPitchProps = {}) {
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/system/mesh_telemetry');
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data.cluster);
        }
      } catch (err) {
        console.error('Failed to fetch telemetry:', err);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    if (onEnterPortal) onEnterPortal();
    else if (onBackToPortal) onBackToPortal();
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans flex overflow-hidden selection:bg-[#38bdf8] selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#38bdf8]/10 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 opacity-40"></div>
      </div>

      <main className="flex-1 p-10 overflow-y-auto relative z-10 w-full max-w-7xl mx-auto">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-widest uppercase mb-2">WeedStack Farms Telemetry</h1>
              <p className="text-white/50 font-light">Real-Time Environmental & Cultivation Analysis</p>
            </div>
            <div className="flex items-center gap-3">
              {(onEnterPortal || onBackToPortal) && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono tracking-widest transition-all uppercase text-white"
                >
                  ← Back to Portal
                </button>
              )}
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SENSORS ONLINE
              </div>
            </div>
          </header>

          {/* Environmental Sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="text-sm text-white/50 uppercase tracking-widest mb-1 flex justify-between">Temperature <Activity className="w-4 h-4 text-emerald-400" /></div>
              <div className="text-4xl font-light text-white mb-4">24.1°C</div>
              <svg className="w-full h-16 stroke-emerald-400 fill-transparent opacity-80" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,10" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,10 L100,30 L0,30 Z" className="fill-emerald-400/10 stroke-none" />
              </svg>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-[#38bdf8]/50 transition-colors">
              <div className="text-sm text-white/50 uppercase tracking-widest mb-1 flex justify-between">Humidity <Sprout className="w-4 h-4 text-[#38bdf8]" /></div>
              <div className="text-4xl font-light text-white mb-4">58%</div>
              <svg className="w-full h-16 stroke-[#38bdf8] fill-transparent opacity-80" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,15 Q10,10 20,20 T40,15 T60,25 T80,15 T100,20" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0,15 Q10,10 20,20 T40,15 T60,25 T80,15 T100,20 L100,30 L0,30 Z" className="fill-[#38bdf8]/10 stroke-none" />
              </svg>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/50 transition-colors">
              <div className="text-sm text-white/50 uppercase tracking-widest mb-1 flex justify-between">pH Level <Hash className="w-4 h-4 text-purple-400" /></div>
              <div className="text-4xl font-light text-white mb-4">6.1</div>
              <svg className="w-full h-16 stroke-purple-400 fill-transparent opacity-80" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,20 Q10,25 20,20 T40,25 T60,15 T80,20 T100,15" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0,20 Q10,25 20,20 T40,25 T60,15 T80,20 T100,15 L100,30 L0,30 Z" className="fill-purple-400/10 stroke-none" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seed Bank Inventory */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold mb-4 text-white/70 uppercase tracking-widest flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#38bdf8]" /> Genetics Vault
              </h3>
              <div className="overflow-hidden rounded-xl border border-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-white/40 font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-normal">Strain</th>
                      <th className="p-4 font-normal">Type</th>
                      <th className="p-4 font-normal text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white/80">OG Kush</td>
                      <td className="p-4 text-white/50 font-mono text-xs">Indica Dominant</td>
                      <td className="p-4 text-right">
                        <span className="bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-1 rounded text-[10px] font-bold tracking-widest border border-[#38bdf8]/20">ACTIVE</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white/80">Sour Diesel</td>
                      <td className="p-4 text-white/50 font-mono text-xs">Sativa</td>
                      <td className="p-4 text-right">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold tracking-widest border border-emerald-500/20">STORED</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white/80">Blue Dream</td>
                      <td className="p-4 text-white/50 font-mono text-xs">Hybrid</td>
                      <td className="p-4 text-right">
                        <span className="bg-orange-500/10 text-orange-400 px-2 py-1 rounded text-[10px] font-bold tracking-widest border border-orange-500/20">LOW</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white/80">Granddaddy Purple</td>
                      <td className="p-4 text-white/50 font-mono text-xs">Indica</td>
                      <td className="p-4 text-right">
                        <span className="bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-1 rounded text-[10px] font-bold tracking-widest border border-[#38bdf8]/20">ACTIVE</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grow Cycle Tracking */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold mb-4 text-white/70 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Grow Cycle Tracking
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/5 relative overflow-hidden">
                  <div className="text-xs text-white/40 mb-1 font-mono uppercase">ID: GSP-01</div>
                  <div className="text-sm font-medium text-white/90 mb-1">OG Kush (Room A)</div>
                  <div className="text-[10px] text-emerald-400 tracking-wider mb-4 font-mono">VEGETATIVE - DAY 38</div>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="44" cy="44" r="44" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-emerald-500 stroke-current transform translate-x-1 translate-y-1" strokeDasharray="276" strokeDashoffset="82" />
                      </svg>
                      <span className="text-lg font-light text-white">70%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-5 border border-white/5 relative overflow-hidden">
                  <div className="text-xs text-white/40 mb-1 font-mono uppercase">ID: GSP-02</div>
                  <div className="text-sm font-medium text-white/90 mb-1">Blue Dream (Room B)</div>
                  <div className="text-[10px] text-purple-400 tracking-wider mb-4 font-mono">FLOWERING - WEEK 6</div>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="44" cy="44" r="44" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-purple-500 stroke-current transform translate-x-1 translate-y-1" strokeDasharray="276" strokeDashoffset="220" />
                      </svg>
                      <span className="text-lg font-light text-white">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
