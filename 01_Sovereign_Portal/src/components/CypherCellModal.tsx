import React, { useState, useEffect } from 'react';
import { getWsUrl } from '../api-host';
import { motion, AnimatePresence } from 'framer-motion';

// Reusing the same avatar mapping logic
const avatarMap: Record<string, string> = {
  // We can just rely on the fallback or pass the same mapping
  // Since we don't want to redefine everything perfectly, we will fetch it from standard logic or use generic synthwave avatar if not found
  "barf": "/avatars/barf.png",
  "coliseum_ghost": "/avatars/coliseumghost.png",
  "possum_protector": "/avatars/possumprotector.png",
  "sacramento_skeptic": "/avatars/sacramentoskeptic.png",
  "vegas_void_voter": "/avatars/vegasvoidvoter.png",
};

const getAvatar = (name: string) => {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return avatarMap[norm] || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=0f1115`;
};

export const CypherCellModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [persona, setPersona] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [displayedLyrics, setDisplayedLyrics] = useState('');

  // WebSocket Listener Hook
  useEffect(() => {
    const ws = new WebSocket(getWsUrl('/ws'));

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE' && data.is_penalty_box && data.channel === 'vocal_matrix') {
          setPersona(data.user || 'Unknown Artist');
          setLyrics(data.text || '');
          setDisplayedLyrics('');
          setIsOpen(true);
          
          // Auto close after 15 seconds
          setTimeout(() => {
            setIsOpen(false);
          }, 15000);
        }
      } catch (err) {
        console.error("Cypher WS parse error", err);
      }
    };

    return () => ws.close();
  }, []);

  // Typewriter effect for lyrics
  useEffect(() => {
    if (!isOpen || !lyrics) return;
    let i = 0;
    setDisplayedLyrics('');
    const typingInterval = setInterval(() => {
      setDisplayedLyrics(lyrics.substring(0, i));
      i++;
      if (i > lyrics.length) clearInterval(typingInterval);
    }, 40);

    return () => clearInterval(typingInterval);
  }, [isOpen, lyrics]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl pointer-events-auto" onClick={() => setIsOpen(false)} />
          
          <div 
            className="pointer-events-auto relative z-10 w-[800px] h-[500px] flex flex-col bg-[#0f1115] border border-red-500/50  rounded-lg overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            {/* Header */}
            <div className="h-12 bg-zinc-900 border-b border-red-500/30 w-full flex items-center justify-between px-6" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #111 0, #111 2px, #1a1a1a 2px, #1a1a1a 4px)' }}>
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ opacity: [1, 0.4, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_red]"
                />
                <span className="text-red-500 font-bold uppercase tracking-widest text-sm font-['Outfit']">ON AIR: 8-MILE RECORDING STUDIO</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white uppercase font-bold text-xs tracking-wider">Close x</button>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex w-full">
              {/* Left Side: Avatar */}
              <div className="w-[30%] border-r border-[#38bdf8]/20 p-6 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-[#38bdf8]/5 blur-3xl" />
                <div className="relative w-40 h-40 rounded-full border-4 border-[#38bdf8] shadow-[0_0_30px_rgba(0,242,254,0.4),inset_0_0_20px_rgba(255,0,255,0.4)] overflow-hidden bg-black p-1">
                  <div className="w-full h-full rounded-full overflow-hidden border border-fuchsia-500/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600/30 to-[#38bdf8]/30 z-10 mix-blend-overlay" />
                    <img src={getAvatar(persona)} alt={persona} className="w-full h-full object-cover relative z-0 grayscale contrast-125" />
                  </div>
                </div>
                <div className="mt-6 text-center z-10">
                  <h3 className="text-[#38bdf8] font-['Outfit'] font-black uppercase text-xl shadow-black drop-shadow-md">{persona}</h3>
                  <p className="text-fuchsia-400 text-xs tracking-widest uppercase mt-1">SHADOWBANNED</p>
                </div>
              </div>

              {/* Right Side: Lyrics Terminal */}
              <div className="w-[70%] p-8 bg-black/40 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full" />
                <h4 className="text-green-500/50 text-xs font-mono uppercase tracking-widest mb-4">{"// LIVE FEED RAW TRANSCRIPT"}</h4>
                <div className="font-mono text-green-400 text-lg leading-loose drop-shadow-lg h-full break-words whitespace-pre-wrap">
                  {displayedLyrics}
                  <motion.span 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-3 h-5 bg-green-400 ml-1 translate-y-1"
                  />
                </div>
              </div>
            </div>

            {/* Bottom: EQ */}
            <div className="h-16 border-t border-[#38bdf8]/20 flex items-end justify-center gap-2 p-4 bg-black/60 relative overflow-hidden">
               {/* 8-band EQ */}
               {[...Array(8)].map((_, i) => (
                 <motion.div
                   key={i}
                   className="w-12 bg-gradient-to-t from-[#0f1115] via-fuchsia-600 to-[#38bdf8] rounded-t-sm "
                   animate={{ height: [`${Math.random() * 20 + 10}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 20 + 20}%`] }}
                   transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.3, ease: 'easeInOut' }}
                 />
               ))}
               <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%)', backgroundSize: '100% 4px' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
