import React, { useState, useEffect } from 'react';
import { Settings2, Layers, Palette, MonitorPlay, Component } from 'lucide-react';

const IMAGES = [
    '/sovereign_gallery/EXHIBIT_GORMAN_001.png',
    '/sovereign_gallery/EXHIBIT_GORMAN_002.png',
    '/sovereign_gallery/EXHIBIT_GORMAN_003.png',
    '/sovereign_gallery/EXHIBIT_GORMAN_004.png',
    '/sovereign_gallery/EXHIBIT_GORMAN_005.png',
    '/sovereign_gallery/EXHIBIT_GORMAN_006.png',
];

export default function SovereignThemeLab() {
  const [hue, setHue] = useState(200); // Default cyan-ish
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isPulsing, setIsPulsing] = useState(false);

  const applyPreset = (h: number, s: number, l: number, pulse: boolean) => {
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setIsPulsing(pulse);
  };

  useEffect(() => {
    // Inject the dynamic variables into the root when this component mounts
    const primaryColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const primaryGlow = `hsl(${hue}, ${saturation}%, ${lightness}%, ${isPulsing ? '0.6' : '0.3'})`;
    const primaryDim = `hsl(${hue}, ${saturation}%, ${lightness}%, 0.1)`;
    
    document.documentElement.style.setProperty('--sov-primary', primaryColor);
    document.documentElement.style.setProperty('--sov-glow', primaryGlow);
    document.documentElement.style.setProperty('--sov-dim', primaryDim);

    // Apply global pulse animation class if needed
    if (isPulsing) {
        document.body.classList.add('animate-pulse');
    } else {
        document.body.classList.remove('animate-pulse');
    }

    return () => {
        // Cleanup if necessary
        document.documentElement.style.removeProperty('--sov-primary');
        document.documentElement.style.removeProperty('--sov-glow');
        document.documentElement.style.removeProperty('--sov-dim');
        document.body.classList.remove('animate-pulse');
    }
  }, [hue, saturation, lightness, isPulsing]);

  return (
    <div className="h-[85vh] w-full flex flex-col p-6 bg-[#0B0E14] text-[#c5c6c7] font-['Segoe_UI',sans-serif] overflow-y-auto">
      
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div 
            className="w-10 h-10 rounded flex items-center justify-center border transition-all duration-200"
            style={{ 
                backgroundColor: 'var(--sov-dim, rgba(255,255,255,0.1))',
                borderColor: 'var(--sov-primary, #fff)',
                boxShadow: '0 0 15px var(--sov-glow, transparent)'
            }}
        >
          <Palette className="w-6 h-6" style={{ color: 'var(--sov-primary, #fff)' }} />
        </div>
        <div>
          <h1 className="text-white uppercase font-black tracking-[0.15em] text-2xl drop-shadow-md">
            Sovereign CSS Lab
          </h1>
          <p className="text-[12px] text-[#8E9CAA] uppercase tracking-widest font-mono">
            Dynamic Token Injection & UI Handoff
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col gap-6">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                    <Settings2 className="w-4 h-4 text-[#8E9CAA]" /> CSS Tokens
                </h3>
                
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-[#8E9CAA] uppercase tracking-widest font-bold">Base Hue</label>
                            <span className="text-xs font-mono text-white">{hue}°</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="360" 
                            value={hue}
                            onChange={(e) => setHue(parseInt(e.target.value))}
                            className="w-full accent-white h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-[#8E9CAA] uppercase tracking-widest font-bold">Saturation</label>
                            <span className="text-xs font-mono text-white">{saturation}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={saturation}
                            onChange={(e) => setSaturation(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--sov-primary)' }}
                        />
                    </div>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 mt-4">
                     <div 
                        className={`w-16 h-16 rounded-full transition-all duration-700 ${isPulsing ? 'animate-bounce' : ''}`}
                        style={{ 
                            backgroundColor: 'var(--sov-primary)',
                            boxShadow: '0 0 30px var(--sov-glow)'
                        }}
                     ></div>
                     <span className="font-mono text-[10px] uppercase tracking-widest text-[#8E9CAA] mt-2">--sov-primary</span>
                     <span className="font-mono text-[12px] font-bold text-white">hsl({hue}, {saturation}%, {lightness}%)</span>
                </div>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                    Simulate Ambient Telemetry
                </h3>
                <button onClick={() => applyPreset(200, 100, 50, false)} className="w-full text-left px-4 py-2 border border-[#38bdf8]/30 rounded hover:bg-[#38bdf8]/10 text-xs font-mono text-[#38bdf8] uppercase tracking-widest transition-all">
                    [Reset] Nominal Operations
                </button>
                <button onClick={() => applyPreset(15, 100, 50, true)} className="w-full text-left px-4 py-2 border border-[#ff4500]/30 rounded hover:bg-[#ff4500]/10 text-xs font-mono text-[#ff4500] uppercase tracking-widest transition-all">
                    [MLB] Grand Slam Temporal Hype
                </button>
                <button onClick={() => applyPreset(280, 100, 60, false)} className="w-full text-left px-4 py-2 border border-[#b026ff]/30 rounded hover:bg-[#b026ff]/10 text-xs font-mono text-[#b026ff] uppercase tracking-widest transition-all">
                    [Cat Tracker] Sam Sighting Alert
                </button>
                <button onClick={() => applyPreset(0, 100, 50, true)} className="w-full text-left px-4 py-2 border border-[#ff0033]/30 rounded hover:bg-[#ff0033]/10 text-xs font-mono text-[#ff0033] uppercase tracking-widest transition-all">
                    [Dog Proximity] Metsy Warning
                </button>
            </div>
        </div>

        {/* Right Col: Components & Gallery */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto">
            
            {/* Component Previews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                    className="bg-[#111827] rounded-xl p-5 shadow-lg border transition-all duration-200 group cursor-pointer relative overflow-hidden"
                    style={{ borderColor: 'var(--sov-dim)' }}
                >
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundColor: 'var(--sov-dim)' }}
                    ></div>
                    <Component className="w-6 h-6 mb-3 transition-colors duration-200" style={{ color: 'var(--sov-primary)' }} />
                    <h4 className="text-white font-bold text-sm tracking-wide mb-1">Standard Card</h4>
                    <p className="text-[10px] text-[#8E9CAA] uppercase font-mono tracking-widest">Hover to trigger token state</p>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 shadow-lg border border-white/10 flex flex-col justify-center items-center gap-3">
                    <button 
                        className="px-6 py-2 rounded uppercase font-bold text-xs tracking-widest transition-all duration-200 border"
                        style={{ 
                            backgroundColor: 'var(--sov-dim)',
                            color: 'var(--sov-primary)',
                            borderColor: 'var(--sov-primary)',
                            boxShadow: '0 0 10px var(--sov-glow)'
                        }}
                    >
                        Primary Action
                    </button>
                    <p className="text-[10px] text-[#8E9CAA] uppercase font-mono tracking-widest">Button Tokens</p>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 shadow-lg border border-white/10 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-sm tracking-wide mb-1">System Status</h4>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sov-primary)' }}></div>
                             <span className="text-[10px] uppercase font-mono tracking-widest" style={{ color: 'var(--sov-primary)' }}>Active Telemetry</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Gallery */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
                 <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                    <MonitorPlay className="w-4 h-4 text-[#8E9CAA]" /> Sovereign OS Gallery (/dna/dropzone/daily_19042026/sovereign_css)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {IMAGES.map((src, i) => (
                        <div 
                            key={i} 
                            className="aspect-video bg-black rounded-lg overflow-hidden border-2 transition-all duration-300 relative group"
                            style={{ borderColor: 'var(--sov-dim)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = `var(--sov-primary)`;
                                e.currentTarget.style.boxShadow = `0 0 20px var(--sov-glow)`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = `var(--sov-dim)`;
                                e.currentTarget.style.boxShadow = `none`;
                            }}
                        >
                            <img 
                                src={src} 
                                alt={`Gallery Item ${i}`} 
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black to-transparent">
                                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--sov-primary)' }}>ASSET_{i+1}.PNG</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
