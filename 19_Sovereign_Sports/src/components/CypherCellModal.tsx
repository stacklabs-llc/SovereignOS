import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const getAvatarUrl = (name: string) => {
  return `/api/persona_image/${encodeURIComponent(name)}`;
};

interface CypherCellModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: string;
  lyrics: string;
}

export const CypherCellModal: React.FC<CypherCellModalProps> = ({ isOpen, onClose, persona, lyrics }) => {
  const [displayedLyrics, setDisplayedLyrics] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Typewriter effect for lyrics
  useEffect(() => {
    if (!isOpen || !lyrics) {
      setDisplayedLyrics('');
      return;
    }
    let i = 0;
    setDisplayedLyrics('');
    const typingInterval = setInterval(() => {
      setDisplayedLyrics(lyrics.substring(0, i));
      i++;
      if (i > lyrics.length) clearInterval(typingInterval);
    }, 30);

    return () => clearInterval(typingInterval);
  }, [isOpen, lyrics]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute bottom-4 left-4 z-40 w-[380px] flex flex-col bg-[#0f1115] border border-red-500/50 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.85)] pointer-events-auto"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.01) 1px, transparent 1px)',
        backgroundSize: '15px 15px',
        maxHeight: isCollapsed ? '40px' : '300px',
        height: isCollapsed ? '40px' : 'auto',
        transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header */}
      <div 
        className="h-10 bg-zinc-900 border-b border-red-500/20 w-full flex items-center justify-between px-3 shrink-0" 
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #111 0, #111 2px, #1a1a1a 2px, #1a1a1a 4px)', cursor: 'pointer' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_red] cypher-pulse-red" />
          <span className="text-red-500 font-bold uppercase tracking-wider text-[10px] font-['Outfit'] select-none">
            ON AIR: 8-MILE RECORDING STUDIO
          </span>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-zinc-500 hover:text-white p-0.5"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white p-0.5"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Split Content (Only rendered/visible when not collapsed) */}
      {!isCollapsed && (
        <>
          <div className="flex-1 flex w-full min-h-[160px] overflow-hidden">
            {/* Left Side: Avatar */}
            <div className="w-[32%] border-r border-[#38bdf8]/10 p-3 flex flex-col items-center justify-center relative bg-[#090b0d]">
              <div className="absolute inset-0 bg-[#38bdf8]/2 blur-2xl pointer-events-none" />
              <div className="relative w-16 h-16 rounded-full border-2 border-[#38bdf8] shadow-[0_0_15px_rgba(0,242,254,0.3),inset_0_0_10px_rgba(255,0,255,0.2)] overflow-hidden bg-black p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden border border-fuchsia-500/30 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600/20 to-[#38bdf8]/20 z-10 mix-blend-overlay" />
                  <img 
                    src={getAvatarUrl(persona)} 
                    alt={persona} 
                    className="w-full h-full object-cover relative z-0 grayscale contrast-125" 
                  />
                </div>
              </div>
              <div className="mt-2.5 text-center z-10 w-full px-1">
                <h3 className="text-[#38bdf8] font-['Outfit'] font-black uppercase text-xs truncate" title={persona}>{persona}</h3>
                <p className="text-fuchsia-500 text-[8px] tracking-widest uppercase mt-0.5">SHADOWBANNED</p>
              </div>
            </div>

            {/* Right Side: Lyrics Terminal */}
            <div className="w-[68%] p-3.5 bg-black/30 relative flex flex-col overflow-y-auto">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 blur-2xl rounded-full pointer-events-none" />
              <h4 className="text-green-500/40 text-[9px] font-mono uppercase tracking-widest mb-1.5 select-none">
                {"// LIVE FEED TRANSCRIPT"}
              </h4>
              <div className="font-mono text-green-400 text-xs leading-normal drop-shadow-md break-words whitespace-pre-wrap flex-1">
                {displayedLyrics}
                <span className="inline-block w-1.5 h-3 bg-green-400 ml-0.5 translate-y-0.5 cypher-pulse-red" />
              </div>
            </div>
          </div>

          {/* Bottom: EQ */}
          <div className="h-10 border-t border-[#38bdf8]/10 flex items-end justify-center gap-1 p-2 bg-black/50 relative overflow-hidden shrink-0">
             {/* 12-band EQ */}
             {[...Array(12)].map((_, i) => (
               <div
                 key={i}
                 style={{ height: '30%' }}
                 className="w-4 bg-gradient-to-t from-[#0f1115] via-fuchsia-600 to-[#38bdf8] rounded-t-sm cypher-eq-bar"
               />
             ))}
             <div className="absolute inset-0 bg-white/3 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%)', backgroundSize: '100% 4px' }} />
          </div>
        </>
      )}
    </div>
  );
};
