import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { getApiHost } from '../api-host';

export default function SavantQueryBlock() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ chips?: {label: string, value: string}[], results?: any[] } | null>(null);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
     setTimeout(() => setIsReady(true), 100);
  }, []);

  const executeQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`/api/savant_query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!res.ok) throw new Error(`Savant Error: ${res.statusText}`);
      
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Fatal Error querying Savant Oracle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans items-center relative overflow-y-auto rounded-tl-xl p-8" style={{ background: 'radial-gradient(circle at top right, rgba(30,27,75,0.7), #0B0E14)', backgroundColor: '#0B0E14' }}>
      
      <style>{`
        @keyframes scanline {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        @keyframes popIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .anim-scanline { animation: scanline 2.5s linear infinite; }
        .anim-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
      `}</style>
      
      <div className={`w-full max-w-4xl text-center transition-all duration-[600ms] ease-out px-4 flex flex-col items-center justify-center ${isReady && !data && !loading ? 'translate-y-[15vh] opacity-100' : (data || loading ? '-translate-y-4 opacity-0 pointer-events-none absolute' : 'translate-y-[20vh] opacity-0')}`}>
         <h1 className="font-display text-3xl md:text-[3.5rem] font-bold uppercase tracking-wide mb-4 text-white leading-tight">What do you want to analyze?</h1>
         <p className="text-[#94a3b8] text-lg md:text-xl font-light mb-12 font-sans px-4">Ask natural questions, forget about archaic query building...</p>
         
         <div className="relative w-full rounded-3xl bg-[rgba(17,24,39,0.7)] border border-white/10 p-2 md:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex items-center backdrop-blur-xl focus-within:border-[#FF5910]/50 focus-within:shadow-[0_0_40px_rgba(255,89,16,0.2),_0_15px_40px_rgba(0,0,0,0.5)] transition-all">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
              placeholder="e.g., How does Alonso perform against sliders down and away with 2 strikes?"
              className="w-full bg-transparent border-none text-white text-lg md:text-2xl px-6 py-4 outline-none placeholder-white/30 font-sans"
            />
            <button 
              onClick={executeQuery}
              className="bg-gradient-to-br from-[#38bdf8] to-[#FF5910] w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-2xl flex items-center justify-center shrink-0 ml-2 hover:scale-105  transition-all cursor-pointer border-none"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
         </div>

         <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-70">
            <button onClick={() => { setQuery("Show me Lindor hitting lefty against high fastballs"); executeQuery(); }} className="bg-black/30 border border-white/10 text-[#94a3b8] px-4 py-2 rounded-full text-sm font-medium hover:text-white hover:border-[#FF5910] hover:bg-[#FF5910]/10 transition-all cursor-pointer text-center">Lindor splits</button>
            <button onClick={() => { setQuery("What is Vientos expected batting average against lefties throwing sliders?"); executeQuery(); }} className="bg-black/30 border border-white/10 text-[#94a3b8] px-4 py-2 rounded-full text-sm font-medium hover:text-white hover:border-[#FF5910] hover:bg-[#FF5910]/10 transition-all cursor-pointer text-center">Vientos vs lefties</button>
         </div>
      </div>

      {loading && (
         <div className="flex justify-center mt-[20vh]">
            <div className="w-[60px] h-[60px] border-4 border-white/10 border-t-[#FF5910] rounded-full animate-spin"></div>
         </div>
      )}

      <div className={`w-full max-w-6xl px-2 md:px-4 transition-all duration-[600ms] delay-100 ${data ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute pointer-events-none'}`}>
         {error ? (
             <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-6 rounded-2xl font-bold font-sans mt-10">{error}</div>
         ) : data && (
            <div className="pb-20">
               <div className="bg-[rgba(17,24,39,0.7)] border border-white/10 rounded-2xl p-4 md:p-6 mb-8 backdrop-blur-xl relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#FF5910] to-transparent anim-scanline" />
                  <div className="font-display text-[#94a3b8] text-sm md:text-lg mb-6 flex flex-col md:flex-row gap-2 justify-between">
                     <span><strong className="text-white">Savant Neural Parsing</strong> — Query Parameters Extracted</span>
                     <span className="text-[#22c55e] text-xs md:text-sm flex items-center gap-2"><div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse "></div> Live Statcast API</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                     <div className="flex flex-wrap gap-2 md:gap-3">
                        {data.chips?.map((c, i) => (
                           <div key={i} className="bg-[#FF5910]/10 border border-[#FF5910]/30 px-4 md:px-5 py-2 md:py-2.5 rounded-full flex items-center gap-2 md:gap-3 anim-pop shadow-[0_5px_15px_rgba(255,89,16,0.1)]" style={{animationDelay: `${i * 0.1}s`}}>
                              <span className="text-[#FF5910] text-[10px] md:text-xs uppercase tracking-widest font-bold font-sans">{c.label}</span>
                              <span className="text-white font-semibold text-sm font-sans">{c.value}</span>
                           </div>
                        ))}
                     </div>
                     <button onClick={() => { setData(null); setQuery(''); }} className="shrink-0 bg-[#FF5910]/5 border border-[#FF5910]/30 text-[#FF5910] hover:bg-[#FF5910]/10 px-4 py-2 rounded-full font-display font-bold flex items-center gap-2 transition-all cursor-pointer ">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Run Another Neural Query
                     </button>
                  </div>
               </div>

               <div className="bg-[rgba(17,24,39,0.7)] border border-white/10 rounded-2xl overflow-x-auto backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] mb-8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                     <thead>
                        <tr>
                           {["Pitcher", "Batter", "Pitch Type", "Pitch Velo", "Exit Velo", "Launch Angle", "Expected BA", "Outcome"].map(h => (
                               <th key={h} className="bg-black/30 p-4 md:p-5 font-display font-bold text-[#94a3b8] text-xs md:text-sm uppercase tracking-widest border-b border-white/10">{h}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="text-[#e2e8f0] font-sans text-sm pb-1">
                        {data.results && data.results.length > 0 ? data.results.map((r, i) => (
                           <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-3 md:p-4 whitespace-nowrap">{r.pitcher}</td>
                              <td className="p-3 md:p-4 whitespace-nowrap font-medium text-white">{r.batter}</td>
                              <td className="p-3 md:p-4 whitespace-nowrap"><span className="bg-white/10 px-2 py-1 rounded text-xs">{r.pitch_type}</span></td>
                              <td className="p-3 md:p-4 whitespace-nowrap text-white/70">{r.release_speed}</td>
                              <td className="p-3 md:p-4 whitespace-nowrap"><span className={r.launch_speed !== '--' ? 'text-[#22c55e] font-semibold drop-' : 'text-white/50'}>{r.launch_speed}</span></td>
                              <td className="p-3 md:p-4 whitespace-nowrap text-white/70">{r.launch_angle}</td>
                              <td className="p-3 md:p-4 whitespace-nowrap"><span className={r.estimated_ba !== '--' ? 'text-[#38bdf8] font-bold drop-' : 'text-white/50'}>{r.estimated_ba}</span></td>
                              <td className="p-3 md:p-4 text-xs font-mono w-full max-w-[200px] truncate text-white/50" title={r.events}>{r.events}</td>
                           </tr>
                        )) : (
                           <tr><td colSpan={8} className="p-8 text-center text-white/40 font-sans">No predictive pitch data matched this sequence.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
               
               <div className="flex justify-center mt-6">
                  <button onClick={() => { setData(null); setQuery(''); }} className="bg-transparent border border-[#FF5910]/50 text-[#FF5910] hover:bg-[#FF5910]/10 px-6 py-3 rounded-full font-display font-bold flex items-center gap-2 transition-all cursor-pointer ">
                     <ChevronRight className="w-5 h-5 rotate-180" /> Run Another Neural Query
                  </button>
               </div>
            </div>
         )}
      </div>

    </div>
  );
}
