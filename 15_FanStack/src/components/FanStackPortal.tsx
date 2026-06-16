import React, { useState } from 'react';
import { SovereignConfig } from '../config/SovereignConfig';
import LogArchiveModal from './LogArchiveModal';
interface FanStackPortalProps {
  onSelectDomain: (domain: 'MLB' | 'NBA' | 'NFL' | 'PGA' | 'SKEW' | 'HOLODEX' | 'ARGUS' | 'EDGE_DVR' | 'STREAM_SNIPER' | 'TELEMETRY' | 'VAULT' | 'STORYBOARD' | 'CMDB' | 'SAVANT' | 'VOCAL' | 'SOVEREIGN_CSS' | 'SCRUFFYS' | 'KANBAN' | 'ROLL_CALL' | 'DREADNOUGHT' | 'HOT_TAKES' | 'ROM_GALLERY' | 'OPTICAL_INGEST' | 'PROMO_INBOX' | 'TOKEN_LEDGER' | 'TMI_NEWS_DESK') => void;
}

export default function FanStackPortal({ onSelectDomain }: FanStackPortalProps) {
  const [isLogArchiveOpen, setIsLogArchiveOpen] = useState(false);
  const [osTheme, setOsTheme] = useState<string>(() => localStorage.getItem('sovereign_theme') || 'mac');

  React.useEffect(() => {
    localStorage.setItem('sovereign_theme', osTheme);
  }, [osTheme]);

  React.useEffect(() => {
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'mac');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  const isHomeTheme = osTheme === 'sovereign-home';

  return (
    <div className={`min-h-screen bg-[#0B0E14] text-gray-200 font-['Inter',sans-serif] selection:bg-[#38bdf8]/30 theme-${osTheme} overflow-x-hidden`}>
      {isLogArchiveOpen && <LogArchiveModal onClose={() => setIsLogArchiveOpen(false)} />}
      
      {/* Minimal Context Header & Theme Selector */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 relative z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded border flex items-center justify-center ${isHomeTheme ? 'border-[#38bdf8]/50 bg-[#38bdf8]/10' : 'border-[#38bdf8]/50 bg-[#38bdf8]/10 '}`}>
            <svg className={`w-3.5 h-3.5 ${isHomeTheme ? 'text-[#38bdf8]' : 'text-[#38bdf8]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className={`font-['Outfit'] text-[13px] font-bold text-white drop-shadow-lg ${!isHomeTheme && 'tracking-[0.15em] uppercase'}`}>
            {isHomeTheme ? "FanStack" : "FanStack Portal"}
          </span>
        </div>
      </header>
      {isLogArchiveOpen && <LogArchiveModal onClose={() => setIsLogArchiveOpen(false)} />}

      {/* Domain Quick Links */}
      <div className="os-panel border-b border-white/5 py-6 lg:py-10 relative">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6 relative z-10">
          
          <div onClick={() => onSelectDomain('MLB')} className="os-card flex items-center gap-4 group cursor-pointer p-5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#38bdf8]/10 blur-xl rounded-full -mr-10 -mt-10 group-hover:bg-[#38bdf8]/20 transition-all"></div>
            <div className="w-14 h-14 rounded-full border border-[#38bdf8]/50 bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8] shrink-0 ">
              <span className="font-['Outfit'] font-bold text-2xl">M</span>
            </div>
            <div className="relative z-10">
              <h3 className="font-['Outfit'] text-lg text-white/55 group-hover:text-white group-hover:font-bold border-b-2 border-transparent group-hover:border-white/50 pb-1 transition-all tracking-widest uppercase mb-1">MLB</h3>
              <p className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest leading-tight mt-1">Command Center Active</p>
            </div>
          </div>

          <div className="os-card flex items-center gap-4 group cursor-not-allowed opacity-50 p-5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#f97316]/10 blur-xl rounded-full -mr-10 -mt-10 group-hover:bg-[#f97316]/20 transition-all"></div>
            <div className="w-14 h-14 rounded-full border border-white/20 bg-black flex items-center justify-center text-white/50 shrink-0">
              <span className="font-['Outfit'] font-bold text-2xl opacity-50">N</span>
            </div>
            <div className="relative z-10 opacity-75">
              <h3 className="font-['Outfit'] text-lg text-white/55 group-hover:text-white group-hover:font-bold border-b-2 border-transparent group-hover:border-white/50 pb-1 transition-all tracking-widest uppercase mb-1 flex items-center gap-2">NBA <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">LOCKED</span></h3>
              <p className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest leading-tight mt-1">Hardwood Injection<br/>(Offline)</p>
            </div>
          </div>

          <div className="os-card flex items-center gap-4 group cursor-not-allowed opacity-50 p-5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#22c55e]/10 blur-xl rounded-full -mr-10 -mt-10 group-hover:bg-[#22c55e]/20 transition-all"></div>
            <div className="w-14 h-14 rounded-full border border-white/20 bg-black flex items-center justify-center text-white/50 shrink-0">
              <span className="font-['Outfit'] font-bold text-2xl opacity-50">F</span>
            </div>
            <div className="relative z-10 opacity-75">
              <h3 className="font-['Outfit'] text-lg text-white/55 group-hover:text-white group-hover:font-bold border-b-2 border-transparent group-hover:border-white/50 pb-1 transition-all tracking-widest uppercase mb-1 flex items-center gap-2">NFL <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">LOCKED</span></h3>
              <p className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest leading-tight mt-1">Scoring Drives<br/>(Offline)</p>
            </div>
          </div>

          <div onClick={() => onSelectDomain('PGA')} className="os-card flex items-center gap-4 group cursor-pointer p-5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#E0BC68]/10 blur-xl rounded-full -mr-10 -mt-10 group-hover:bg-[#E0BC68]/20 transition-all"></div>
            <div className="w-14 h-14 rounded-full border border-[#E0BC68]/50 bg-[#E0BC68]/10 flex items-center justify-center text-[#E0BC68] shrink-0 ">
              <span className="font-['Outfit'] font-bold text-2xl">P</span>
            </div>
            <div className="relative z-10">
              <h3 className="font-['Outfit'] text-lg text-white/55 group-hover:text-white group-hover:font-bold border-b-2 border-transparent group-hover:border-white/50 pb-1 transition-all tracking-widest uppercase mb-1 flex items-center gap-2">PGA <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">ACTIVE</span></h3>
              <p className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest leading-tight mt-1">Amen Corner Engine<br/>Live Simulation</p>
            </div>
          </div>

        </div>
      </div>

      {/* Widgets Layout - 3 Column Grid */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-20 mt-8 lg:mt-[3vw] grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
        
        {/* Column 1 - Live Operations & Interaction */}
        <div className="flex flex-col h-fit">
          <div className="mb-6">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Live Operations & Interaction</span>
          </div>
          <div className="flex flex-col space-y-2">
            <button onClick={() => onSelectDomain('SCRUFFYS')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#38bdf8] group-hover:text-white transition-colors tracking-wide">Scruffy's Tavern</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed">LIVE CHAT & PERSONA INTERACTIONS</div>
            </button>
            <button onClick={() => onSelectDomain('SKEW')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#a855f7] group-hover:text-white transition-colors tracking-wide">The Skew (Live)</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed">DAYTIME SPORTS TALK & DEBATE</div>
            </button>
            <button onClick={() => onSelectDomain('HOT_TAKES' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg border border-red-500/20 bg-red-500/5 ">
               <div className="font-['Outfit'] font-bold text-[13px] text-red-500 group-hover:text-white transition-colors tracking-wide">Hot Takes</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">High-Intensity Persona Rants</div>
            </button>
            <a href={`${SovereignConfig.fanstack}?domain=GLOBAL&room=live_chat_sniper`} className="w-full block text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-red-500 group-hover:text-white transition-colors tracking-wide flex items-center gap-2">🎯 Live Chat Sniper</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Live Chat Sniper Direct Link</div>
            </a>
            <button onClick={() => onSelectDomain('PROMO_INBOX' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#f59e0b] group-hover:text-white transition-colors tracking-wide">The Cosmic Sieve</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Promo Inbox</div>
            </button>
            <button onClick={() => onSelectDomain('GAME_LOG_EXPORT' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#22c55e] group-hover:text-white transition-colors tracking-wide flex items-center gap-2">📋 Game Log Export</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">MD / JSON · During &amp; Post Game</div>
            </button>
          </div>
        </div>
        
        {/* Column 2 - Media Pipeline & Synthesis */}
        <div className="flex flex-col h-fit">
          <div className="mb-6">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Media Pipeline & Synthesis</span>
          </div>
          <div className="flex flex-col space-y-2">
            <button onClick={() => onSelectDomain('HOLODEX')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#38bdf8] group-hover:text-white transition-colors tracking-wide">✨ Sovereign HoloDex</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed">CINEMATIC VIDEO SYNTHESIS ENGINE</div>
            </button>
            <button onClick={() => onSelectDomain('STORYBOARD')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#a855f7] group-hover:text-white transition-colors tracking-wide">Storyboard Deck</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Plan and Sequence Video</div>
            </button>
            <button onClick={() => onSelectDomain('ROM_GALLERY')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#ff00ff] group-hover:text-white transition-colors tracking-wide">Sovereign Watch Party</div>
               <div className="font-mono text-[#E0BC68] text-[9px] tracking-widest mt-1.5 uppercase">Historic Moments & Video Sync</div>
            </button>
            <button onClick={() => onSelectDomain('HIGHLIGHT_HEIST' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#a855f7] group-hover:text-white transition-colors tracking-wide">Highlight Heist</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Steal The Best Clips</div>
            </button>
            <button onClick={() => onSelectDomain('STREAM_SNIPER')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#38bdf8] group-hover:text-white transition-colors tracking-wide">Stream Sniper</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">LIVE TARGET ACQUISITION</div>
            </button>
            <button onClick={() => onSelectDomain('TMI_NEWS_DESK')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#ef4444] group-hover:text-white transition-colors tracking-wide flex items-center gap-2">((•)) TMI News Desk</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Broadcast Director Triage Dashboard</div>
            </button>
          </div>
        </div>

        {/* Column 3 - Intelligence & Core Infrastructure */}
        <div className="flex flex-col h-fit">
          <div className="mb-6">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Intelligence & Core Infrastructure</span>
          </div>
          <div className="flex flex-col space-y-2">
            <button onClick={() => onSelectDomain('OPTICAL_INGEST')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-red-500 group-hover:text-white transition-colors tracking-wide">Pile DVR</div>
               <div className="font-mono text-red-400 text-[9px] tracking-widest mt-1.5 uppercase">Webcam Feed Capture</div>
            </button>
            <button onClick={() => onSelectDomain('PERSONA_CENTER' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#38bdf8] group-hover:text-white transition-colors tracking-wide flex items-center gap-2"> Persona Command Center</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Manage Personas & Teams</div>
            </button>
            <button onClick={() => onSelectDomain('SAVANT')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-white tracking-wide">Savant Oracle Analytics</div>
               <div className="font-mono text-[#38bdf8] text-[9px] tracking-widest mt-1.5">SQL MLB QUERY ENGINE</div>
            </button>
            <button onClick={() => onSelectDomain('ROLL_CALL')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#38bdf8] tracking-wide">Daily Roll Call</div>
               <div className="font-mono text-[#00FF88] text-[9px] tracking-widest mt-1.5 uppercase">STATIC JSON INGESTION</div>
            </button>
            <button onClick={() => onSelectDomain('VAULT')} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#a855f7] group-hover:text-white transition-colors tracking-wide">Media Vault Matrix</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">Artifact Gallery</div>
            </button>
            <button onClick={() => onSelectDomain('TOKEN_LEDGER' as any)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg border border-[#7c3aed]/20 bg-[#7c3aed]/5">
               <div className="font-['Outfit'] font-bold text-[13px] text-[#7c3aed] group-hover:text-white transition-colors tracking-wide flex items-center gap-2">🧮 Token Ledger</div>
               <div className="font-mono text-[#8E9CAA] text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase">API Burn Analytics &amp; ROI</div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
