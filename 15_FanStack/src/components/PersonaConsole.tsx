import React, { useState, useEffect } from "react";
import { Search, Download, Undo2, Save, LayoutGrid } from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ══════════════════════════════════════════════════════════ */
interface AiPersona {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string | null;
  title: string;
  introduction: string;
  city: string;
  department: string;
  active: number;
  u_llm_engine?: string | null;
  u_system_prompt?: string | null;
  u_deployment_zone?: string | null;
  u_boggs_reactivity?: string | null;
  u_cadence?: string | null;
  u_context_grounding_ref?: string | null;
}

const API_BASE = "";

async function fetchPersonas(): Promise<AiPersona[]> {
  try {
    const res = await fetch(`${API_BASE}/api/now/table/cmdb_ci_ai_persona`);
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    return (data.result ?? []) as AiPersona[];
  } catch (err) {
    console.error("API error, returning mocks");
    return [
      { sys_id: "1", user_name: "jake_taylor", first_name: "Jake", last_name: "Taylor", title: "Tour Guide", introduction: "Deep lore goes here", city: "Sovereign", department: "Flagship", active: 1, u_boggs_reactivity: "R", u_system_prompt: "You are Jake." },
      { sys_id: "2", user_name: "barbara", first_name: "Barbara", last_name: "Gordon", title: "Intel", introduction: "Oracle data", city: "Gotham", department: "Cosmic Chrome", active: 1, u_boggs_reactivity: "PG", u_system_prompt: "You are Oracle." },
      { sys_id: "3", user_name: "claude", first_name: "Claude", last_name: "Anthropic", title: "Analyst", introduction: "Helpful assistant", city: "AI", department: "Heritage", active: 1, u_boggs_reactivity: "G", u_system_prompt: "You are Claude." },
    ];
  }
}

/* ══════════════════════════════════════════════════════════
   CARD COMPONENTS (FRONT & BACK)
   ══════════════════════════════════════════════════════════ */
function CardFront({ p, styleType, flipCard }: { p: AiPersona, styleType: string, flipCard: () => void }) {
  if (styleType === 'Heritage') {
    return (
      <div 
        onClick={flipCard}
        className="w-[240px] h-[340px] bg-[#E8E1D5] rounded shadow-lg p-3 cursor-pointer border-4 border-[#C1B296] relative hover:scale-105 transition-transform"
      >
        <div className="absolute top-2 right-2 text-[#8B7355] font-serif text-xs font-bold">#{(p.sys_id.substring(0,3)).toUpperCase()}</div>
        <div className="h-[200px] bg-[#5C4D3C] rounded border-2 border-[#8B7355] mt-4 mb-2 flex flex-col items-center justify-center text-[#E8E1D5]">
           <div className="text-6xl font-serif">{p.first_name?.[0] || 'A'}</div>
           <div className="text-xs uppercase mt-2 opacity-50">Portrait Placeholder</div>
        </div>
        <div className="bg-[#B22222] text-[#E8E1D5] uppercase font-serif text-center py-1 text-sm font-bold border border-[#5C4D3C]">
          {p.user_name}
        </div>
        <div className="text-[#5C4D3C] text-[10px] uppercase font-sans mt-2 flex justify-between px-1 font-bold">
           <span>{p.title.substring(0, 15)}</span>
           <span>BOGGS: {p.u_boggs_reactivity || 'N/A'}</span>
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] text-[#8B7355] italic">Heritage Series</div>
      </div>
    );
  }

  if (styleType === 'Cosmic Chrome') {
    return (
      <div 
        onClick={flipCard}
        className="w-[240px] h-[340px] rounded-xl  p-1 cursor-pointer relative hover:scale-105 transition-all overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF00FF, #00FFFF, #FF00FF)' }}
      >
        <div className="w-full h-full bg-[#0B0E14]/90 rounded-lg p-2 flex flex-col backdrop-blur-sm border border-white/20">
          <div className="absolute top-3 right-3 text-white font-mono text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur">#{p.sys_id.substring(0,3).toUpperCase()}</div>
          <div className="h-[220px] bg-gradient-to-b from-[#a855f7]/30 to-[#3b82f6]/30 rounded-lg border border-white/20 mt-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
             {/* Hologram effect */}
             <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.2),transparent)] animate-[scan_2s_linear_infinite]"></div>
             <div className="text-6xl font-bold font-mono tracking-tighter drop-">{p.first_name?.[0] || 'C'}</div>
          </div>
          <div className="flex-1 flex flex-col justify-end pb-1">
             <div className="text-white font-bold tracking-widest text-lg uppercase drop-">{p.user_name}</div>
             <div className="text-[#00FFFF] text-[10px] uppercase font-mono mt-1 flex justify-between">
               <span>{p.title.substring(0, 20)}</span>
               <span>{p.u_boggs_reactivity}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Flagship Default
  return (
    <div 
      onClick={flipCard}
      className="w-[240px] h-[340px] bg-white rounded-lg shadow-xl p-0 cursor-pointer border border-gray-200 relative hover:scale-105 transition-transform overflow-hidden"
    >
      <div className="h-[260px] bg-gray-100 flex items-center justify-center border-b-[8px] border-[#3B82F6]">
         <div className="text-6xl font-bold text-gray-300">{p.first_name?.[0] || 'F'}</div>
      </div>
      <div className="p-3 bg-white relative">
         <div className="absolute -top-6 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 transform skew-x-[-15deg] shadow-md">
           {p.city || 'SYS'}
         </div>
         <div className="font-bold text-xl uppercase tracking-tighter text-gray-800">{p.first_name} {p.last_name || p.user_name}</div>
         <div className="text-xs text-gray-500 uppercase tracking-widest">{p.title.substring(0, 25)}</div>
      </div>
    </div>
  );
}

function CardBack({ p, flipCard, onRefresh }: { p: AiPersona, flipCard: () => void, onRefresh: () => void }) {
  const [deepLore, setDeepLore] = useState(p.introduction || "");
  const [systemPrompt, setSystemPrompt] = useState(p.u_system_prompt || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('sovereign_session_token') || '';
      const res = await fetch(`/api/now/table/cmdb_ci_ai_persona/${p.sys_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          introduction: deepLore,
          u_system_prompt: systemPrompt
        })
      });
      if (res.ok) {
        onRefresh();
        flipCard();
      } else {
        alert("Failed to update persona details");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating persona");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-[240px] h-[340px] bg-[#111827] rounded-xl shadow-2xl p-4 cursor-pointer border border-white/20 relative flex flex-col text-white">
      <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
        <h3 className="font-bold uppercase tracking-widest text-xs text-[#38bdf8]">{p.user_name} Stats</h3>
        <button onClick={(e) => { e.stopPropagation(); flipCard(); }} className="text-white/50 hover:text-white"><Undo2 size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 text-[9px] font-mono text-white/80 space-y-3 custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div>
          <label className="block text-[#a855f7] mb-1 font-bold">Deep Lore</label>
          <textarea 
            value={deepLore}
            onChange={e => setDeepLore(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded p-1.5 min-h-[80px] focus:outline-none focus:border-[#38bdf8]" 
          />
        </div>
        <div>
          <label className="block text-[#a855f7] mb-1 font-bold">System Prompt</label>
          <textarea 
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded p-1.5 min-h-[80px] focus:outline-none focus:border-[#38bdf8]" 
          />
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-white/20 flex justify-end">
        <button 
          className="flex items-center gap-1 bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-1 rounded text-[9px] font-bold uppercase hover:bg-[#38bdf8] hover:text-white transition-colors" 
          onClick={e => { e.stopPropagation(); handleUpdate(); }}
          disabled={isUpdating}
        >
          <Save size={10} /> {isUpdating ? "Saving..." : "Update"}
        </button>
      </div>
    </div>
  );
}

function PersonaCard({ p, onRefresh }: { key?: any, p: AiPersona, onRefresh: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const styleType = p.department === 'Heritage' ? 'Heritage' : p.department === 'Cosmic Chrome' ? 'Cosmic Chrome' : 'Flagship';

  return (
    <div className="perspective-1000 w-[240px] h-[340px]">
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute w-full h-full backface-hidden">
          <CardFront p={p} styleType={styleType} flipCard={() => setIsFlipped(true)} />
        </div>
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <CardBack p={p} flipCard={() => setIsFlipped(false)} onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN CONSOLE COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function PersonaConsole() {
  const [personas, setPersonas] = useState<AiPersona[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPersonas().then(setPersonas);
  }, []);

  const filtered = personas.filter(p => p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full bg-[#0B0E14] text-white flex flex-col p-6 rounded-xl overflow-hidden relative">
      {/* Background Binder Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-widest uppercase drop-">Neuro Card Binder</h2>
          <p className="text-[#8E9CAA] font-mono text-xs uppercase tracking-widest mt-1">My Collection - {filtered.length} Personas</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input 
              type="text" 
              placeholder="Search Binder..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:border-[#38bdf8]  w-64"
            />
          </div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/20 p-2 rounded-lg transition-colors">
            <LayoutGrid size={20} className="text-[#38bdf8]" />
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/20 p-2 rounded-lg transition-colors">
            <Download size={20} className="text-white/60" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pr-4">
        {/* Binder Spine Shadow Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent pointer-events-none rounded-l-xl z-20"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 p-8 bg-[#151922] rounded-r-2xl border border-white/5 shadow-inner">
          {filtered.map(p => (
            <PersonaCard key={p.sys_id} p={p} onRefresh={() => fetchPersonas().then(setPersonas)} />
          ))}
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.5); }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      `}</style>
    </div>
  );
}
