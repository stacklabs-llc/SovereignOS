import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SovereignThemeManager() {
  const [selectedWorkspace, setSelectedWorkspace] = useState('sovereign-home');

  const THEME_PRESETS: Record<string, any> = {
    'sovereign-home': {
      primaryAccent: '#38bdf8',
      background: '#111827',
      textGlow: '#38bdf8',
      iconHighlight: '#F97316',
      borderColor: '#396600',
      notification: '#9975f5'
    },
    'espn': {
      primaryAccent: '#cc0000',
      background: '#f8f9fa',
      textGlow: '#cc0000',
      iconHighlight: '#000000',
      borderColor: '#e5e7eb',
      notification: '#cc0000'
    },
    'pixel': {
      primaryAccent: '#00fa1b',
      background: '#000000',
      textGlow: '#00fa1b',
      iconHighlight: '#ff00ff',
      borderColor: '#00fa1b',
      notification: '#ff00ff'
    },
    'linux': {
      primaryAccent: '#00ff00',
      background: '#020202',
      textGlow: '#00ff00',
      iconHighlight: '#00ff00',
      borderColor: '#00ff00',
      notification: '#00aa00'
    },
    'steamboat': {
      primaryAccent: '#111111',
      background: '#dfdcd4',
      textGlow: '#111111',
      iconHighlight: '#333333',
      borderColor: '#333333',
      notification: '#111111'
    },
    'sny-classic': {
      primaryAccent: '#ff5910',
      background: '#090e1a',
      textGlow: '#ff5910',
      iconHighlight: '#00b4d8',
      borderColor: '#ff5910',
      notification: '#00b4d8'
    }
  };

  const [tokens, setTokens] = useState({
    primaryAccent: '#38bdf8',
    background: '#111827',
    textGlow: '#38bdf8',
    iconHighlight: '#F97316',
    borderColor: '#396600',
    notification: '#9975f5'
  });

  const handleTokenChange = (key: string, value: string) => {
    setTokens(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In the future, this will save to the DB or localStorage
    // and apply via document.documentElement.style.setProperty
    console.log("Saving Tokens:", tokens);
    // Visual feedback could be added here
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05080f] p-8 relative overflow-hidden font-display">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,242,254,0.05)_0%,_transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-50"></div>

      <div className="w-full max-w-3xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-1 w-6 h-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-cyan-400 rounded-sm shadow-[0_0_5px_cyan]"></div>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-wide">
              Sovereign CSS Token Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <img src="/avatars/Sovereign_OS_Logo.jpg" className="w-6 h-6 rounded border border-cyan-500/50" />
            <span className="text-white/80 font-bold text-lg tracking-widest uppercase">Sovereign</span>
          </div>
        </div>

        {/* Main Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,242,254,0.05)]"
        >
          
          {/* Workspace Selection */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-cyan-400 drop-shadow-lg mb-4 tracking-wide">
              Workspace Selection
            </h2>
            <div className="relative">
              <select 
                value={selectedWorkspace}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedWorkspace(val);
                  if (THEME_PRESETS[val]) {
                    setTokens(THEME_PRESETS[val]);
                  }
                }}
                className="w-full appearance-none bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-white text-lg font-bold shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] focus:outline-none focus:border-cyan-400  transition-all cursor-pointer"
              >
                <option value="sovereign-home">Sovereign Home (Premium)</option>
                <option value="espn">ESPN Workspace</option>
                <option value="pixel">8-Bit Arcade</option>
                <option value="linux">Hacker Terminal</option>
                <option value="steamboat">Steamboat</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                 <img src="/avatars/Sovereign_OS_Logo.jpg" className="w-6 h-6 rounded" />
              </div>
              {/* Padding offset for custom select arrow/icon */}
              <style>{`select { padding-left: 3rem !important; }`}</style>
            </div>
          </div>

          {/* Theme Configuration */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 drop-shadow-lg mb-6 tracking-wide">
              Theme Configuration
            </h2>
            <div className="grid grid-cols-2 gap-6">
              
              <TokenInput 
                label="Primary Accent" 
                value={tokens.primaryAccent} 
                onChange={(val) => handleTokenChange('primaryAccent', val)} 
                glowColor="rgba(0,242,254,0.5)"
              />
              <TokenInput 
                label="Background" 
                value={tokens.background} 
                onChange={(val) => handleTokenChange('background', val)} 
              />
              <TokenInput 
                label="Text Glow" 
                value={tokens.textGlow} 
                onChange={(val) => handleTokenChange('textGlow', val)} 
                glowColor="rgba(56,189,248,0.5)"
              />
              <TokenInput 
                label="Icon Highlight" 
                value={tokens.iconHighlight} 
                onChange={(val) => handleTokenChange('iconHighlight', val)} 
                glowColor="rgba(249,115,22,0.5)"
              />
              <TokenInput 
                label="Border Color" 
                value={tokens.borderColor} 
                onChange={(val) => handleTokenChange('borderColor', val)} 
              />
              <TokenInput 
                label="Notification" 
                value={tokens.notification} 
                onChange={(val) => handleTokenChange('notification', val)} 
                glowColor="rgba(153,117,245,0.5)"
              />

            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-12 flex flex-col items-center">
            <h3 className="text-[#F97316] text-xl font-bold mb-3 drop-">
              Save Configuration
            </h3>
            <button 
              onClick={handleSave}
              className="group relative px-12 py-3 bg-black/60 rounded-xl border-2 border-[#F97316] text-white font-black text-xl tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4),inset_0_0_15px_rgba(249,115,22,0.2)] hover:bg-[#F97316]/10 hover:shadow-[0_0_30px_rgba(249,115,22,0.6),inset_0_0_20px_rgba(249,115,22,0.4)] transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                SUBMIT 
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </button>
          </div>

        </motion.div>

      </div>
    </div>
  );
}

// Subcomponent for the token input fields
function TokenInput({ label, value, onChange, glowColor }: { label: string, value: string, onChange: (v:string)=>void, glowColor?: string }) {
  return (
    <div className="flex flex-col bg-black/20 p-4 rounded-2xl border border-white/5 relative group">
      <div className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${glowColor ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`} style={{ boxShadow: `inset 0 0 20px ${glowColor || 'transparent'}` }}></div>
      <label className="text-white/90 text-lg font-semibold mb-3 relative z-10">{label}</label>
      <div className="flex items-center gap-3 relative z-10">
        <div 
          className="w-12 h-12 rounded-xl shrink-0 border border-white/20 transition-all duration-300"
          style={{ 
            backgroundColor: value,
            boxShadow: glowColor ? `0 0 15px ${glowColor}` : 'none'
          }}
        ></div>
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>
    </div>
  );
}
