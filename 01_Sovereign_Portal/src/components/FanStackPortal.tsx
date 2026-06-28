import React, { useState } from 'react';
import LogArchiveModal from './LogArchiveModal';
interface FanStackPortalProps {
  onSelectDomain: (domain: 'MLB' | 'NBA' | 'NFL' | 'PGA' | 'SKEW' | 'HOLODEX' | 'ARGUS' | 'EDGE_DVR' | 'STREAM_SNIPER' | 'TELEMETRY' | 'VAULT' | 'STORYBOARD' | 'CMDB' | 'SAVANT' | 'VOCAL' | 'SOVEREIGN_CSS' | 'KANBAN' | 'ROLL_CALL' | 'DREADNOUGHT' | 'HOT_TAKES' | 'ROM_GALLERY' | 'OPTICAL_INGEST' | 'PROMO_INBOX' | 'MODEL_ARENA' | 'TMI_NEWS_DESK') => void;
}

export default function FanStackPortal({ onSelectDomain }: FanStackPortalProps) {
  const [isLogArchiveOpen, setIsLogArchiveOpen] = useState(false);
  const [osTheme, setOsTheme] = useState<string>(() => localStorage.getItem('sovereign_theme') || 'mac');
  const [activeUtils, setActiveUtils] = useState<string[]>([
    'the_skew', 'hot_takes', 'stream_sniper',
    'holodex', 'rom_gallery', 'artifact_gallery',
    'persona_center', 'promo_inbox', 'savant_query',
    'optical_ingest', 'roll_call', 'model_arena', 'tmi_news_desk'
  ]);

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

  React.useEffect(() => {
    const loadUtilities = () => {
      fetch('/api/public/stack_utilities/fanstack')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.utilities) {
            const activeList = data.utilities
              .filter((u: any) => u.active === 1)
              .map((u: any) => u.module_name);
            setActiveUtils(activeList);
          }
        })
        .catch(err => console.error("Error loading stack utilities:", err));
    };

    loadUtilities();
    window.addEventListener('stack_utilities_changed', loadUtilities);
    return () => window.removeEventListener('stack_utilities_changed', loadUtilities);
  }, []);

  const isHomeTheme = osTheme === 'sovereign-home';

  const col1 = [
    { id: 'the_skew', domain: 'SKEW', title: "The Skew (Live)", subtitle: "DAYTIME SPORTS TALK & DEBATE", color: "#a855f7" },
    { id: 'hot_takes', domain: 'HOT_TAKES', title: "Hot Takes", subtitle: "High-Intensity Advocate Rants", color: "#ef4444", borderClass: "border-red-500/20 bg-red-500/5", textClass: "text-red-500" },
    { id: 'stream_sniper', domain: 'stream_sniper', title: "Stream Sniper", subtitle: "LIVE TARGET ACQUISITION", color: "#f43f5e" }
  ];

  const col2 = [
    { id: 'holodex', domain: 'HOLODEX', title: "✨ Sovereign HoloDex", subtitle: "CINEMATIC VIDEO SYNTHESIS ENGINE", color: "#38bdf8" },
    { id: 'rom_gallery', domain: 'ROM_GALLERY', title: "Sovereign Watch Party", subtitle: "Historic Moments & Video Sync", color: "#ff00ff", subColor: "#E0BC68" },
    { id: 'artifact_gallery', domain: 'VAULT', title: "Media Vault Matrix", subtitle: "ASSET REVIEW GALLERY", color: "#ffffff", subColor: "#E0BC68" },
    { id: 'tmi_news_desk', domain: 'TMI_NEWS_DESK', title: "((•)) TMI News Desk", subtitle: "Broadcast Director Triage Dashboard", color: "#ef4444", borderClass: "border border-red-500/20 bg-red-500/5", subColor: "#8E9CAA" }
  ];

  const col3 = [
    { id: 'persona_center', domain: 'PERSONA_CENTER', title: "Advocate Command Center", subtitle: "Manage Advocates & Teams", color: "#38bdf8" },
    { id: 'promo_inbox', domain: 'PROMO_INBOX', title: "📬 The Cosmic Sieve", subtitle: "Check Inbound Promo Emails", color: "#f07178", subColor: "#f07178" },
    { id: 'savant_query', domain: 'SAVANT', title: "Savant Oracle Analytics", subtitle: "SQL MLB QUERY ENGINE", color: "#ffffff", subColor: "#38bdf8" },
    { id: 'optical_ingest', domain: 'OPTICAL_INGEST', title: "Optical Ingest Console", subtitle: "Webcam Feed Capture", color: "#ef4444", subColor: "#ef4444" },
    { id: 'roll_call', domain: 'ROLL_CALL', title: "Daily Roll Call", subtitle: "STATIC JSON INGESTION", color: "#38bdf8", subColor: "#00FF88" },
    { id: 'model_arena', domain: 'MODEL_ARENA', title: "⚔️ Model Battle Arena", subtitle: "Compare Local LLM Performance", color: "#4ade80", subColor: "#4ade80" }
  ];

  const renderCard = (card: any) => {
    if (!activeUtils.includes(card.id)) return null;

    const borderClass = card.borderClass || '';
    const subColor = card.subColor || '#8E9CAA';

    return (
      <button 
        key={card.id}
        onClick={() => onSelectDomain(card.domain as any)} 
        className={`w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group rounded-lg ${borderClass}`}
      >
        <div 
          className="font-['Outfit'] font-bold text-[13px] group-hover:text-white transition-colors tracking-wide"
          style={{ color: card.color }}
        >
          {card.title}
        </div>
        <div 
          className="font-mono text-[9px] tracking-widest mt-1.5 leading-relaxed uppercase"
          style={{ color: subColor }}
        >
          {card.subtitle}
        </div>
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-[#0B0E14] text-gray-200 font-['Inter',sans-serif] selection:bg-[#38bdf8]/30 theme-${osTheme}`}>
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
      <div className="os-panel border-b border-white/5 py-10 relative">
        <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          
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

      {/* Widgets Layout - 3 Column Grid with Viewport Scaling & Independent Scroll */}
      <div className="max-w-[1500px] mx-auto px-6 pb-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 md:h-[calc(100vh-240px)] md:overflow-hidden">
        
        {/* Column 1 - Live Operations & Interaction */}
        <div className="flex flex-col h-fit md:h-full md:overflow-y-auto pr-2 scrollbar-thin">
          <div className="mb-6 sticky top-0 bg-[#0B0E14] py-1 z-10">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Live Operations & Interaction</span>
          </div>
          <div className="flex flex-col space-y-2 pb-6">
            {col1.map(renderCard)}
          </div>
        </div>
        
        {/* Column 2 - Media Pipeline & Synthesis */}
        <div className="flex flex-col h-fit md:h-full md:overflow-y-auto pr-2 scrollbar-thin">
          <div className="mb-6 sticky top-0 bg-[#0B0E14] py-1 z-10">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Media Pipeline & Synthesis</span>
          </div>
          <div className="flex flex-col space-y-2 pb-6">
            {col2.map(renderCard)}
          </div>
        </div>

        {/* Column 3 - Intelligence & Core Infrastructure */}
        <div className="flex flex-col h-fit md:h-full md:overflow-y-auto pr-2 scrollbar-thin">
          <div className="mb-6 sticky top-0 bg-[#0B0E14] py-1 z-10">
             <span className="font-['Outfit'] text-xs text-[#8A8A93] tracking-[0.15em] uppercase">Intelligence & Core Infrastructure</span>
          </div>
          <div className="flex flex-col space-y-2 pb-6">
            {col3.map(renderCard)}
          </div>
        </div>

      </div>
    </div>
  );
}
