import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Image as ImageIcon, ExternalLink, Calendar } from 'lucide-react';

interface HarvestedArtifact {
  dest_path: string;
  session_id: string;
  original_name: string;
  harvested_at: string;
  image_url: string;
}

export default function ArtifactGallery() {
  const [artifacts, setArtifacts] = useState<HarvestedArtifact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/media_vault/03_Assets/Harvested_Artifacts/harvest_manifest.json')
      .then(res => res.json())
      .then(data => {
        const parsed: HarvestedArtifact[] = Object.values(data).map((entry: any) => {
           // We infer the public URL relative path
           const fileName = (entry.dest_path as string).split('/').pop();
           return {
              ...entry,
              image_url: `/media_vault/03_Assets/Harvested_Artifacts/${fileName}`
           };
        });
        
        // Sort globally by harvested/timestamp (oldest first or newest first? Let's do newest first but allow natural session grouping)
        parsed.sort((a, b) => new Date(b.harvested_at).getTime() - new Date(a.harvested_at).getTime());
        setArtifacts(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load harvest manifest:", err);
        setLoading(false);
      });
  }, []);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(a => 
      a.original_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.session_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [artifacts, searchTerm]);

  // Group by session
  const groupedArtifacts = useMemo(() => {
     const groups: Record<string, HarvestedArtifact[]> = {};
     filteredArtifacts.forEach(art => {
         if (!groups[art.session_id]) groups[art.session_id] = [];
         groups[art.session_id].push(art);
     });
     return groups;
  }, [filteredArtifacts]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[50vh] text-[#38bdf8] font-mono tracking-widest text-sm uppercase animate-pulse">
            Fetching Sovereign Ledger...
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4">
      {/* TOOLBAR */}
      <div className="sticky top-0 z-50 rounded-2xl border border-white/10 bg-[#0B0E14]/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#38bdf8]/10 rounded-full flex items-center justify-center border border-[#38bdf8]/30">
                 <ImageIcon className="w-5 h-5 text-[#38bdf8]" />
             </div>
             <div>
                <h2 className="font-serif text-2xl text-white m-0 leading-none">Media Vault Matrix</h2>
                <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-white/50 mt-1">
                    {artifacts.length} Assets Recovered from Deep Storage
                </div>
             </div>
         </div>
         <div className="relative w-full md:w-auto min-w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9CAA]" />
             <input 
                type="text" 
                placeholder="Search by filename or session UUID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#38bdf8]/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none transition-all placeholder:text-white/20 font-mono"
             />
         </div>
      </div>

      {/* GALLERY GROUPS */}
      <div className="flex flex-col gap-12 mt-4 pb-20">
         {(Object.entries(groupedArtifacts) as [string, HarvestedArtifact[]][]).map(([sessionId, items]) => (
            <div key={sessionId} className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-white/5 border-l-2 border-[#38bdf8] p-3 rounded-r-lg">
                   <div className="font-mono text-sm tracking-widest uppercase text-[#38bdf8]">
                      Session Hash: <span className="text-white">{sessionId}</span>
                   </div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-[#8E9CAA] bg-black/40 px-2 py-1 rounded">
                      {items.length} Artifact{items.length > 1 ? 's' : ''}
                   </div>
                </div>

                {/* The 3-Across Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {items.map(art => (
                       <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={art.dest_path}
                          className="group relative bg-[#111621] rounded-xl border border-white/5 overflow-hidden shadow-lg  hover:border-[#38bdf8]/30 transition-all duration-300 flex flex-col"
                       >
                           {/* Image Container */}
                           <a href={art.image_url} target="_blank" rel="noreferrer" className="block relative aspect-video overflow-hidden bg-black/50 cursor-zoom-in">
                               <img 
                                  src={art.image_url} 
                                  alt={art.original_name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                               />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                   <div className="bg-black/60 backdrop-blur border border-white/20 text-white font-sans text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full flex gap-2 items-center shadow-2xl">
                                      View Original <ExternalLink className="w-3 h-3" />
                                   </div>
                               </div>
                           </a>
                           
                           {/* Metadata Bar */}
                           <div className="p-4 flex flex-col gap-1 border-t border-white/5 bg-gradient-to-b from-transparent to-black/20">
                               <div className="font-mono text-xs text-white/80 truncate" title={art.original_name}>
                                  {art.original_name}
                               </div>
                               <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8E9CAA]">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(art.harvested_at).toLocaleString()}
                               </div>
                           </div>
                       </motion.div>
                   ))}
                </div>
            </div>
         ))}
         
         {Object.keys(groupedArtifacts).length === 0 && (
             <div className="text-center py-20 text-white/30 font-mono tracking-widest text-sm uppercase">
                 No artifacts match the current quadrant scan.
             </div>
         )}
      </div>
    </div>
  );
}
