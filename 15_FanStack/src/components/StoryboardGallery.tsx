import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, ExternalLink, Film } from 'lucide-react';

interface StoryboardArtifact {
  name: string;
  url: string;
  timestamp: number;
}

export default function StoryboardGallery() {
  const [artifacts, setArtifacts] = useState<StoryboardArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("Mets_Twins_Collapse_Storyboard");

  useEffect(() => {
    fetch('/api/storyboards/projects')
      .then(res => res.json())
      .then(data => {
        const projs = data.projects || [];
        setProjects(projs);
        if (projs.length > 0 && !projs.includes(selectedProject)) {
          setSelectedProject(projs[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/storyboards?project=${encodeURIComponent(selectedProject)}`)
      .then(res => res.json())
      .then(data => {
        setArtifacts(data.artifacts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load storyboards:", err);
        setLoading(false);
      });
  }, [selectedProject]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[50vh] text-[#a855f7] font-mono tracking-widest text-sm uppercase animate-pulse">
            Accessing Storyboard Vault...
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4">
      {/* TOOLBAR */}
      <div className="sticky top-0 z-50 rounded-2xl border border-white/10 bg-[#0B0E14]/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#a855f7]/10 rounded-full flex items-center justify-center border border-[#a855f7]/30">
                 <Layers className="w-5 h-5 text-[#a855f7]" />
             </div>
             <div>
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-2xl text-white m-0 leading-none">Storyboard Deck</h2>
                  <select 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="bg-[#111621] border border-white/20 text-[#a855f7] font-mono text-xs rounded-md px-3 py-1 outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {projects.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-white/50 mt-1">
                    {artifacts.length} Assets Ready For Flow
                </div>
             </div>
         </div>
      </div>

      {/* GALLERY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 pb-20 overflow-y-auto h-[calc(100vh-150px)] pr-2 no-scrollbar">
         {artifacts.map(art => (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={art.name}
                className="group relative bg-[#111621] rounded-xl border border-white/5 overflow-hidden shadow-lg  hover:border-[#a855f7]/30 transition-all duration-300 flex flex-col"
             >
                 {/* Asset Container */}
                 <a href={art.url} target="_blank" rel="noreferrer" className="block relative aspect-video overflow-hidden bg-black/50 cursor-zoom-in flex items-center justify-center">
                     {art.name.endsWith('.mp4') ? (
                         <video 
                             src={art.url} 
                             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                             controls
                             preload="metadata"
                         />
                     ) : art.name.endsWith('.md') || art.name.endsWith('.txt') || art.name.endsWith('.json') ? (
                         <div className="text-white/50 font-mono text-sm p-4 text-center break-words">
                             📄 {art.name}
                         </div>
                     ) : (
                         <img 
                            src={art.url} 
                            alt={art.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                         />
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4 pointer-events-none">
                         <div className="bg-black/60 backdrop-blur border border-white/20 text-white font-sans text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full flex gap-2 items-center shadow-2xl">
                            Open <ExternalLink className="w-3 h-3" />
                         </div>
                     </div>
                 </a>
                 
                 {/* Metadata Bar */}
                 <div className="p-4 flex flex-col gap-1 border-t border-white/5 bg-gradient-to-b from-transparent to-black/20">
                     <div className="font-mono text-xs text-white/80 truncate" title={art.name}>
                        {art.name}
                     </div>
                     <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8E9CAA]">
                        <Film className="w-3 h-3" />
                        Added: {new Date(art.timestamp * 1000).toLocaleString()}
                     </div>
                 </div>
             </motion.div>
         ))}
         
         {artifacts.length === 0 && (
             <div className="col-span-full text-center py-20 text-white/30 font-mono tracking-widest text-sm uppercase">
                 Drop artifacts into /media/STORYBOARDS to see them here.
             </div>
         )}
      </div>
    </div>
  );
}
