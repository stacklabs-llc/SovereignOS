import { BookOpen, Map, Zap, Network } from "lucide-react";

export default function KnowledgeHub() {
  return (
    <div className="h-full flex flex-col bg-[#1A110B] text-slate-200 font-mono p-6 border border-slate-800 rounded-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4 z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-widest text-[#E0BC68] drop-shadow-md">Sovereign Intelligence Gateway</h2>
          <p className="text-slate-500 font-sans text-xs uppercase tracking-widest mt-1">/now/knowledge-center/knowledge-hub</p>
        </div>
        <Network size={32} className="text-[#38bdf8] opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 flex-1">
        
        {/* Savant Query Refinery */}
        <div className="group border border-slate-800 bg-[#0B0E14]/80 p-6 rounded-xl hover:border-[#FF5910] transition-all flex flex-col items-start cursor-pointer shadow-lg " onClick={() => window.open(`http://${window.location.hostname}:8000/wardy_savant_query.html`, '_blank')}>
          <div className="bg-[#FF5910]/20 p-3 rounded-lg mb-4 text-[#FF5910] group-hover:bg-[#FF5910] group-hover:text-white transition-colors">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-display">Savant Query Refinery</h3>
          <p className="text-slate-400 text-sm mb-6 flex-1">Direct pipeline to the Savant AI query interface. Run advanced analysis against historical datasets and access localized Statcast lore.</p>
          <div className="text-[#FF5910] text-xs font-bold uppercase tracking-widest bg-[#FF5910]/10 px-3 py-1 rounded inline-flex items-center">
            Initialize App <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Project Amen Corner Dashboard Placeholder */}
        <div className="group border border-slate-800 bg-[#0B0E14]/80 p-6 rounded-xl hover:border-[#6FAF5F] transition-all flex flex-col items-start shadow-lg ">
          <div className="bg-[#6FAF5F]/20 p-3 rounded-lg mb-4 text-[#6FAF5F] group-hover:bg-[#6FAF5F] group-hover:text-white transition-colors">
            <Map size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-display">Project Amen Corner (Offline Sim)</h3>
          <p className="text-slate-400 text-sm mb-6 flex-1">Awaiting 2025 Masters telemetry packet from 'Sean'. Offline dashboard framework prepared for data ingestion and routing.</p>
          <button className="text-[#6FAF5F] border border-[#6FAF5F]/50 hover:bg-[#6FAF5F] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-transparent px-4 py-2 rounded">
            Awaken Module (LOCKED)
          </button>
        </div>
        
      </div>
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  );
}
