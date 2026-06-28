import React, { useState, useEffect } from 'react';
import { 
  Camera, ShieldCheck, Activity, Database, Key, Server, Hash, ChevronRight, Video,
  FileText, Network, Sprout, DollarSign, Cpu, Clock, HardDrive, List, LayoutGrid, TestTube, Map, Thermometer
} from 'lucide-react';

export default function GardenStackDashboard({ onEnterPortal }: { onEnterPortal?: () => void }) {
  const [activeTab, setActiveTab] = useState<'operations' | 'compliance'>('operations');

  return (
    <div className="min-h-full w-full bg-[#0B0E14] text-white font-sans flex overflow-hidden selection:bg-emerald-500 selection:text-white pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 opacity-40"></div>
      </div>

      {/* Sidebar Navigation */}
      <div className="w-24 border-r border-white/5 bg-black/40 backdrop-blur-xl relative z-20 flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-emerald-400" />
        </div>
        
        <div className="flex flex-col gap-4 w-full px-4">
          <button 
            onClick={() => setActiveTab('operations')}
            className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${activeTab === 'operations' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[9px] font-mono tracking-widest uppercase mt-1">Ops</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('compliance')}
            className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${activeTab === 'compliance' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] font-mono tracking-widest uppercase mt-1">Vault</span>
          </button>
        </div>

        <div className="mt-auto w-full px-4">
          {onEnterPortal && (
             <button onClick={onEnterPortal} title="Return to Portal" className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-white/40 hover:text-white/80 hover:bg-white/5 border border-white/5 hover:border-white/20">
                <ChevronRight className="w-6 h-6" />
             </button>
          )}
        </div>
      </div>

      <main className="flex-1 p-8 overflow-y-auto relative z-10 w-full h-full">
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex items-end justify-between border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-widest uppercase mb-1">Eileen's Stack</h1>
              <p className="text-white/50 font-light tracking-widest text-sm uppercase">Agricultural Telemetry & Operations Command</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-emerald-400 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NETWORK: SECURE
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Database className="w-3 h-3" />
                VAULT: ENCRYPTED
              </div>
            </div>
          </header>

          {activeTab === 'operations' && <OperationsView />}
          {activeTab === 'compliance' && <ComplianceView />}
          
        </div>
      </main>
    </div>
  );
}

function OperationsView() {
  return (
    <div className="grid grid-cols-12 gap-6 pb-12">
      {/* Main Spatial Map & Camera Grid */}
      <div className="col-span-12 xl:col-span-9 flex flex-col gap-6">
        
        {/* Spatial Map */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-400" /> SPATIAL TELEMETRY VISUALIZATION
            </h3>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              SYSTEM STATUS: <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400">OPTIMAL</span>
            </div>
          </div>
          
          <div className="w-full h-80 bg-[#06080a] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
             {/* Facility Blueprint Background */}
             <div className="absolute inset-0 bg-[url('/facility_blueprint.png')] bg-cover bg-center opacity-30 mix-blend-screen"></div>
             
             {/* Plant Nodes */}
             <div className="absolute w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981] left-[30%] top-[40%] animate-pulse"></div>
             <div className="absolute w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981] left-[45%] top-[60%] animate-pulse delay-75"></div>
             <div className="absolute w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_20px_#a855f7] left-[60%] top-[30%] animate-pulse delay-150"></div>
             <div className="absolute w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_20px_#a855f7] left-[70%] top-[50%] animate-pulse delay-300"></div>
             <div className="absolute w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981] left-[20%] top-[50%] animate-pulse delay-200"></div>

             <div className="absolute bottom-4 left-6 text-emerald-400/70 font-mono text-xs flex flex-col">
                <span className="text-white/40 text-[10px] mb-1">ACTIVE ZONES</span>
                <span className="text-2xl text-emerald-400">124</span>
             </div>
             <div className="absolute bottom-4 right-6 text-cyan-400/70 font-mono text-xs flex flex-col items-end">
                <span className="text-white/40 text-[10px] mb-1">PLANT COUNT</span>
                <span className="text-2xl text-cyan-400">14,800</span>
             </div>
          </div>
        </div>

        {/* Edge Node Cameras */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Camera className="w-4 h-4 text-[#38bdf8]" /> EDGE NODE CAMERAS (BROWN LEAF PROTOCOL)
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#06080a] border border-[#38bdf8]/30 rounded-xl overflow-hidden relative group aspect-[16/7]">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-2 px-3 z-10">
                 <div className="text-[10px] font-mono text-[#38bdf8] flex items-center gap-2 font-bold tracking-widest">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse shadow-[0_0_10px_#38bdf8]"></span> 
                   NODE 04: CALVIN LIVE (BARCODE VIEW)
                 </div>
              </div>
              <img src="/cam-proxy/calvin/cam/0" alt="Calvin Node" className="w-full h-full object-cover opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden'); }} />
              <div className="fallback hidden absolute inset-0 flex items-center justify-center text-[#38bdf8]/30 font-mono text-xs bg-[#0b0e14]">SIGNAL PENDING...</div>
            </div>
            
            <div className="bg-[#06080a] border border-white/10 rounded-xl overflow-hidden relative aspect-[16/7]">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-2 px-3 z-10">
                 <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-2 font-bold tracking-widest">
                   NODE 07: VEGETATIVE FEED B4
                 </div>
              </div>
              <div className="w-full h-full bg-[url('/cam-proxy/node07.png')] bg-cover bg-center opacity-80 blend-luminosity"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel: Nutrients & Hardware */}
      <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">
        
        {/* Hardware Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex-1">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-8">
            <Server className="w-4 h-4 text-emerald-400" /> HARDWARE STATUS
          </h3>
          
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-white/10">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#0b0e14] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white/90 tracking-widest uppercase">Water Pumps</div>
                <div className="text-[10px] text-white/40 font-mono">(ACTIVE)</div>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#0b0e14] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white/90 tracking-widest uppercase">Lighting Arrays</div>
                <div className="text-[10px] text-white/40 font-mono">(OPTIMAL)</div>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#0b0e14] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white/90 tracking-widest uppercase">HVAC Protocol</div>
                <div className="text-[10px] text-white/40 font-mono">(BALANCED)</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#0b0e14] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white/90 tracking-widest uppercase">Nutrient Feed</div>
                <div className="text-[10px] text-white/40 font-mono">(STABLE)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrient Level */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-[320px] shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-6">
            <TestTube className="w-4 h-4 text-cyan-400" /> NITROGEN (N)
          </h3>
          <div className="flex-1 flex flex-col items-center justify-end gap-6 relative">
             <div className="w-16 h-40 bg-[#06080a] border border-cyan-500/30 rounded-full p-2 flex flex-col justify-end relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
                <div className="absolute bottom-2 top-2 left-2 right-2 flex flex-col gap-[2px]">
                   {[...Array(20)].map((_, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${i > 8 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-cyan-900/30'}`}></div>
                   ))}
                </div>
             </div>
             <div className="text-center w-full">
                <div className="text-3xl font-light text-white bg-black/40 w-full py-2 rounded-lg border border-white/5 shadow-xl">
                   82<span className="text-sm text-white/40 ml-1">ppm</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ComplianceView() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Audit Log */}
        <div className="col-span-12 lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col max-h-[600px]">
           <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> COMPLIANCE AUDIT LOG
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
             {[
               { id: '#HV-401', action: 'Harvest Protocol Logged', user: 'A. Chen', time: '2026-05-15 14:32:10', type: 'success' },
               { id: '#BT-881', action: 'Bulk Transfer ID Approved', user: 'System', time: '2026-05-15 12:15:00', type: 'info' },
               { id: '#GR-004', action: 'Genetic Record Updated', user: 'J. Pilot', time: '2026-05-15 09:00:21', type: 'warning' },
               { id: '#HV-400', action: 'Harvest Protocol Logged', user: 'A. Chen', time: '2026-05-14 08:45:10', type: 'success' },
               { id: '#QC-112', action: 'Quality Control Passed', user: 'M. Vibe', time: '2026-05-14 07:30:00', type: 'success' },
             ].map((log, i) => (
                <div key={i} className="bg-[#0b0e14] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                     <div className="text-[10px] text-white/40 font-mono">{log.time}</div>
                     <div className={`w-3 h-3 flex items-center justify-center rounded-full ${log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : log.type === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                     </div>
                   </div>
                   <div className="text-xs font-bold text-white/90 mb-2 leading-snug">{log.action}</div>
                   <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded font-mono text-white/60">{log.id}</span>
                      <span className="text-[9px] text-cyan-400 font-mono border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-500/10">User: {log.user}</span>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Genetics Vault */}
        <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Hash className="w-4 h-4 text-purple-400" /> GENETICS VAULT - STRAIN INVENTORY
          </h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                <tr>
                  <th className="font-normal px-4 pb-2">Strain Name</th>
                  <th className="font-normal px-4 pb-2">Genetic ID</th>
                  <th className="font-normal px-4 pb-2">Lot Number</th>
                  <th className="font-normal px-4 pb-2">Barcode</th>
                  <th className="font-normal px-4 pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Cultivar Alpha (Sativa)', id: 'CULT-A1-0023', lot: 'LOT#882103', status: 'Verified', color: 'emerald' },
                  { name: 'Cultivar Beta (Indica)', id: 'CULT-B2-0450', lot: 'LOT#882104', status: 'Archived', color: 'gray' },
                  { name: 'Cultivar Gamma (Hybrid)', id: 'CULT-G3-1120', lot: 'LOT#882105', status: 'Archived', color: 'gray' },
                  { name: 'Cultivar Delta (CBD-Dom)', id: 'CULT-D4-0901', lot: 'LOT#882106', status: 'Active', color: 'cyan' },
                  { name: 'Cultivar Epsilon (Sativa)', id: 'CULT-E5-4412', lot: 'LOT#882107', status: 'Active', color: 'cyan' },
                  { name: 'Cultivar Zeta (Indica)', id: 'CULT-Z6-3301', lot: 'LOT#882108', status: 'Pending', color: 'orange' },
                ].map((row, i) => (
                  <tr key={i} className="bg-[#0b0e14] group hover:bg-[#121820] transition-colors">
                    <td className="px-4 py-4 rounded-l-xl border-y border-l border-white/5 text-white/90 font-bold">{row.name}</td>
                    <td className="px-4 py-4 border-y border-white/5 font-mono text-white/60 text-xs">{row.id}</td>
                    <td className="px-4 py-4 border-y border-white/5 font-mono text-white/60 text-xs">{row.lot}</td>
                    <td className="px-4 py-4 border-y border-white/5">
                       <div className="h-6 w-16 bg-white/10 rounded flex items-center justify-between px-1 opacity-70">
                          <div className="w-[2px] h-4 bg-white/60"></div>
                          <div className="w-[1px] h-4 bg-white/40"></div>
                          <div className="w-[3px] h-4 bg-white/80"></div>
                          <div className="w-[1px] h-4 bg-white/60"></div>
                          <div className="w-[2px] h-4 bg-white/40"></div>
                       </div>
                    </td>
                    <td className="px-4 py-4 rounded-r-xl border-y border-r border-white/5 text-right">
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${
                        row.color === 'emerald' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        row.color === 'cyan' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
                        row.color === 'orange' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                        'text-white/40 border-white/10 bg-white/5'
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Cultivation Flowchart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
         <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 mb-8">
            <Network className="w-4 h-4 text-[#38bdf8]" /> BATCH CULTIVATION PATHWAY - BATCH ID: <span className="text-[#38bdf8]">#BT4991</span>
          </h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative px-4 pb-4">
             {/* Background Line connecting nodes */}
             <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -z-10 hidden md:block"></div>
             
             {[
               { label: 'Vegetative', days: '45 Days', status: 'OK', color: 'emerald' },
               { label: 'Flowering', days: '62 Days', status: 'OK', color: 'emerald' },
               { label: 'Harvest', days: '2026-05-15', status: 'QC Pass', color: 'cyan' },
               { label: 'Drying', days: '12 Days', status: 'Active', color: 'purple' },
               { label: 'Curing', days: '21 Days', status: 'Pending', color: 'gray' },
             ].map((node, i) => (
                <div key={i} className={`flex-1 w-full bg-[#0B0E14] border rounded-xl p-5 relative shadow-xl transition-all hover:-translate-y-1 ${
                   node.color === 'emerald' ? 'border-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]' :
                   node.color === 'cyan' ? 'border-cyan-500/50 shadow-[0_10px_30px_rgba(6,182,212,0.15)]' :
                   node.color === 'purple' ? 'border-purple-500/50 shadow-[0_10px_30px_rgba(168,85,247,0.15)]' :
                   'border-white/10 opacity-50'
                }`}>
                   <div className={`text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center justify-between ${
                       node.color === 'emerald' ? 'text-emerald-400' :
                       node.color === 'cyan' ? 'text-cyan-400' :
                       node.color === 'purple' ? 'text-purple-400' :
                       'text-white/40'
                   }`}>
                      {node.label}
                      <Activity className="w-3 h-3 opacity-50" />
                   </div>
                   <div className="space-y-1 text-sm font-mono text-white/60">
                      <div>{node.days}</div>
                      <div className={node.color === 'emerald' ? 'text-emerald-400' : node.color === 'purple' ? 'text-purple-400' : node.color === 'cyan' ? 'text-cyan-400' : ''}>{node.status}</div>
                   </div>
                   {i < 4 && (
                      <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 text-white/20 w-6 justify-center bg-[#0B0E14]">
                         <ChevronRight className="w-5 h-5" />
                      </div>
                   )}
                </div>
             ))}
          </div>
      </div>
    </div>
  );
}
