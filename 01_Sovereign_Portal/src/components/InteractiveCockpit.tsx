import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, ShieldAlert, Crosshair, Cpu, Key, Database, UserCheck, Play, 
  Flame, Activity, Terminal, Settings, Radio, Tv, RefreshCw, Sliders 
} from 'lucide-react';

interface Relic {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  glowColor: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  lore: string;
}

interface InteractiveCockpitProps {
  onNavigate: (route: string) => void;
}

export default function InteractiveCockpit({ onNavigate }: InteractiveCockpitProps) {
  const [activeRelic, setActiveRelic] = useState<string | null>(null);
  
  // Real-time animated state for core metrics
  const [metrics, setMetrics] = useState({
    coreTemp: 44.5,
    fanSpeed: 2840,
    cpuLoad: 12.8,
    swapUsage: 14.2,
    voltage: 1.22
  });

  // Toggles for platform daemons
  const [daemons, setDaemons] = useState({
    fastApiGateway: true,
    voiceSynth: true,
    tailscaleServe: true,
    mardChat: false
  });

  // Real-time scrolling node log messages
  const [logs, setLogs] = useState<string[]>([
    "SYS >> Initializing Sovereign OS command desk matrix...",
    "SYS >> Loading CMDB hardware asset registry...",
    "SYS >> Establishing Tailscale secure proxy handshakes...",
    "DAEMON >> ustreamer-daemon active on port 8000.",
    "DAEMON >> fanstack-relay listening for TMI events.",
    "SYS >> Platform status: FULLY OPERATIONAL."
  ]);

  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Poll metrics and generate terminal logs
  useEffect(() => {
    const metricInterval = setInterval(() => {
      setMetrics(prev => ({
        coreTemp: parseFloat((40 + Math.random() * 10).toFixed(1)),
        fanSpeed: Math.round(2500 + Math.random() * 600),
        cpuLoad: parseFloat((5 + Math.random() * 20).toFixed(1)),
        swapUsage: parseFloat((12 + Math.random() * 4).toFixed(1)),
        voltage: parseFloat((1.18 + Math.random() * 0.08).toFixed(2))
      }));
    }, 2000);

    const logFeed = [
      "SYS >> Pinging argo.taila01894.ts.net ... [OK] 12ms",
      "SYS >> Pinging calvin.taila01894.ts.net ... [OK] 18ms",
      "DAEMON >> Voice synthesizer cache synced successfully.",
      "SEC >> HSTS certificate validation passed for clio.",
      "MARD >> Processing chat advocate telemetry streams...",
      "SYS >> RAM garbage collection completed cleanly.",
      "SYS >> Relic matrix integrity check: 100% SECURE."
    ];

    const logInterval = setInterval(() => {
      const randomLog = logFeed[Math.floor(Math.random() * logFeed.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-15), `[${timestamp}] ${randomLog}`]);
    }, 3500);

    return () => {
      clearInterval(metricInterval);
      clearInterval(logInterval);
    };
  }, []);

  // Auto-scroll logs terminal directly inside the container without shifting parent layouts
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const relics: Relic[] = [
    {
      id: 'kiosk',
      name: '16-Bit Cozy Kiosk',
      lore: 'Wildseed Ledger & Sandbox Engine',
      description: 'Access the metsy-prime Wildseed ledger and StackLabs execution engine.',
      route: 'wildseed',
      icon: <Cpu className="w-5 h-5" />,
      glowColor: '#10b981',
      status: 'ONLINE'
    },
    {
      id: 'tears',
      name: 'Queens Tears Potion',
      lore: 'AetherVet Medical Telemetry',
      description: 'Open the AetherVet feline/canine telemetry and telepresence workspace.',
      route: 'aether_vet',
      icon: <Crosshair className="w-5 h-5" />,
      glowColor: '#0ea5e9',
      status: 'ONLINE'
    },
    {
      id: 'key',
      name: 'Golden Telepresence Key',
      lore: 'CSV Log Ingestion & Secure Access',
      description: 'Retrieve security credentials, ingest CSV logs, and review auth keys.',
      route: 'log_viewer',
      icon: <Key className="w-5 h-5" />,
      glowColor: '#fbbf24',
      status: 'ONLINE'
    },
    {
      id: 'dial',
      name: 'Tactile Industrial Dial',
      lore: 'RTR Ambient Theme Matrix',
      description: 'Open the Ambient Preference & RTR System Configuration dashboard.',
      route: 'system_config',
      icon: <Database className="w-5 h-5" />,
      glowColor: '#f97316',
      status: 'ONLINE'
    },
    {
      id: 'screen_main',
      name: 'Central Display Console',
      lore: 'Statcast MLB Watch Center',
      description: 'Open the Command Center baseball watch parties and RSS telemetry feeds.',
      route: 'starter',
      icon: <Play className="w-5 h-5" />,
      glowColor: '#00ffff',
      status: 'ONLINE'
    },
    {
      id: 'screen_right',
      name: 'M.A.R.D Discourse Screen',
      lore: 'Advocate Chat Sniper Console',
      description: 'Access active advocate chat snipers and natural language engagement engines.',
      route: 'live_chat_sniper',
      icon: <Info className="w-5 h-5" />,
      glowColor: '#ef4444',
      status: 'STANDBY'
    },
    {
      id: 'queens_pride',
      name: 'Queens Pride Sign',
      lore: 'UHF Studio Media Vault',
      description: 'Ignite the UHF Broadcast Studio and highlights media vault.',
      route: 'uhf_studio',
      icon: <ShieldAlert className="w-5 h-5" />,
      glowColor: '#a855f7',
      status: 'ONLINE'
    },
    {
      id: 'server_rack',
      name: 'Heavy Metal Server Rack',
      lore: 'Nexus Mesh Hardware Telemetry',
      description: 'Inspect CMDB assets, hardware status telemetry, and edge nodes.',
      route: 'nexus_telemetry',
      icon: <Cpu className="w-5 h-5" />,
      glowColor: '#00d4ff',
      status: 'ONLINE'
    },
    {
      id: 'pilot',
      name: 'Pilot James',
      lore: 'Operator Access Control',
      description: 'Manage users, assign roles, edit relic registries, and review access control.',
      route: 'user_management',
      icon: <UserCheck className="w-5 h-5" />,
      glowColor: '#f43f5e',
      status: 'ONLINE'
    }
  ];

  const handleDaemonToggle = (name: keyof typeof daemons, label: string) => {
    setDaemons(prev => {
      const nextVal = !prev[name];
      const timestamp = new Date().toLocaleTimeString();
      setLogs(l => [...l, `[${timestamp}] CONTROL >> User toggled ${label} to ${nextVal ? 'ACTIVE' : 'INACTIVE'}`]);
      return { ...prev, [name]: nextVal };
    });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto bg-[#07090e]/95 border border-white/10 rounded-2xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-md relative overflow-hidden font-mono select-none selection:bg-[#38bdf8] selection:text-[#0a0c10]">
      {/* Visual glowing matrices */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#38bdf8]/5 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Cockpit Header Ribbon */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-white/10 pb-4 mb-6 relative z-10 gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="text-[#38bdf8] animate-pulse">◈</span> Command <span className="text-[#38bdf8] font-light">Cockpit Console</span>
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" /> Glassmorphic Tactile System Dashboard v3.5
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/60 border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">COGNITIVE LOCK: ENGAGED</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT PANEL (8 Columns): Live Telemetry & Relic Deck */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Live Telemetry Gauges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Core Temp Gauge */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#38bdf8]/40 transition-colors relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#38bdf8] to-transparent"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">CORE TEMP</span>
                <Flame className="w-3.5 h-3.5 text-[#38bdf8]" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">{metrics.coreTemp}</span>
                <span className="text-[10px] text-slate-500 ml-1">°C</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#38bdf8] h-full transition-all duration-500" style={{ width: `${(metrics.coreTemp / 90) * 100}%` }}></div>
              </div>
            </div>

            {/* Fan Speed Gauge */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#fbbf24]/40 transition-colors relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#fbbf24] to-transparent"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">FAN RPM</span>
                <RefreshCw className="w-3.5 h-3.5 text-[#fbbf24] animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">{metrics.fanSpeed}</span>
                <span className="text-[9px] text-slate-500 ml-1">RPM</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#fbbf24] h-full transition-all duration-500" style={{ width: `${(metrics.fanSpeed / 4000) * 100}%` }}></div>
              </div>
            </div>

            {/* CPU Load Gauge */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#10b981]/40 transition-colors relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10b981] to-transparent"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">CPU LOAD</span>
                <Activity className="w-3.5 h-3.5 text-[#10b981]" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">{metrics.cpuLoad}</span>
                <span className="text-[10px] text-slate-500 ml-1">%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${metrics.cpuLoad}%` }}></div>
              </div>
            </div>

            {/* Swap Usage Gauge */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#f43f5e]/40 transition-colors relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#f43f5e] to-transparent"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">SWAP SIZE</span>
                <Database className="w-3.5 h-3.5 text-[#f43f5e]" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">{metrics.swapUsage}</span>
                <span className="text-[10px] text-slate-500 ml-1">%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#f43f5e] h-full transition-all duration-500" style={{ width: `${metrics.swapUsage}%` }}></div>
              </div>
            </div>

          </div>

          {/* Relics Matrix Grid */}
          <div className="space-y-4">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#38bdf8]" /> Interactive Relics & Target Domains
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relics.map((spot) => {
                const isHovered = activeRelic === spot.id;
                return (
                  <div
                    key={spot.id}
                    onMouseEnter={() => setActiveRelic(spot.id)}
                    onMouseLeave={() => setActiveRelic(null)}
                    className="bg-white/[0.02] border border-white/10 rounded-xl p-5 hover:bg-white/[0.05] transition-all relative overflow-hidden group flex flex-col justify-between h-48 shadow-lg hover:shadow-2xl"
                    style={{
                      borderColor: isHovered ? spot.glowColor : 'rgba(255,255,255,0.1)',
                      boxShadow: isHovered ? `0 8px 30px ${spot.glowColor}15, inset 0 0 12px ${spot.glowColor}05` : 'none'
                    }}
                  >
                    {/* Glowing highlight indicator */}
                    <div 
                      className="absolute top-0 left-0 w-full h-1 transition-all duration-300"
                      style={{ backgroundColor: isHovered ? spot.glowColor : 'transparent' }}
                    ></div>

                    <div>
                      <div className="flex justify-between items-start">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center border transition-all"
                          style={{ 
                            backgroundColor: isHovered ? `${spot.glowColor}15` : 'rgba(255,255,255,0.02)',
                            borderColor: isHovered ? `${spot.glowColor}40` : 'rgba(255,255,255,0.1)',
                            color: isHovered ? spot.glowColor : '#8e9caa'
                          }}
                        >
                          {spot.icon}
                        </div>
                        <span 
                          className="text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all"
                          style={{
                            backgroundColor: `${spot.glowColor}10`,
                            color: spot.glowColor,
                            borderColor: `${spot.glowColor}30`
                          }}
                        >
                          {spot.status}
                        </span>
                      </div>

                      <h4 className="text-white text-xs font-bold uppercase tracking-wider mt-3 flex items-center gap-1.5">
                        {spot.name}
                      </h4>
                      <p className="text-[#8e9caa] text-[9px] uppercase tracking-widest mt-0.5 font-bold">
                        {spot.lore}
                      </p>
                      <p className="text-slate-500 text-[10px] leading-relaxed mt-2 line-clamp-2">
                        {spot.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate(spot.route)}
                      className="w-full mt-4 py-2 border rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 bg-transparent text-white border-white/10 group-hover:text-white"
                      style={{
                        backgroundColor: isHovered ? `${spot.glowColor}15` : 'transparent',
                        borderColor: isHovered ? spot.glowColor : 'rgba(255,255,255,0.1)',
                        boxShadow: isHovered ? `0 0 10px ${spot.glowColor}20` : 'none'
                      }}
                    >
                      🚀 Ignite Relic
                    </button>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* RIGHT PANEL (4 Columns): Platform Daemon Toggles & Real-Time Scrolling Log */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          
          {/* Platform Daemon Toggles */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
              <Radio className="w-4 h-4 text-[#38bdf8]" /> Platform Daemon Relays
            </h3>
            
            <div className="space-y-3.5">
              
              {/* FastAPI Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white font-bold uppercase tracking-wider">FastAPI Gateway</div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Port 8090 Proxy Relay</div>
                </div>
                <button
                  onClick={() => handleDaemonToggle('fastApiGateway', 'FastAPI Gateway')}
                  className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 border cursor-pointer ${
                    daemons.fastApiGateway 
                      ? 'bg-emerald-500/20 border-emerald-500' 
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full transition-all ${
                      daemons.fastApiGateway ? 'bg-emerald-400 translate-x-6' : 'bg-red-400 translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Voice Synthesis Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white font-bold uppercase tracking-wider">Voice Synthesis</div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Antigravity Vocal Matrix</div>
                </div>
                <button
                  onClick={() => handleDaemonToggle('voiceSynth', 'Voice Synthesis')}
                  className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 border cursor-pointer ${
                    daemons.voiceSynth 
                      ? 'bg-emerald-500/20 border-emerald-500' 
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full transition-all ${
                      daemons.voiceSynth ? 'bg-emerald-400 translate-x-6' : 'bg-red-400 translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Tailscale serve toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white font-bold uppercase tracking-wider">Tailscale Funnel</div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">MagicDNS External Proxy</div>
                </div>
                <button
                  onClick={() => handleDaemonToggle('tailscaleServe', 'Tailscale Funnel')}
                  className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 border cursor-pointer ${
                    daemons.tailscaleServe 
                      ? 'bg-emerald-500/20 border-emerald-500' 
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full transition-all ${
                      daemons.tailscaleServe ? 'bg-emerald-400 translate-x-6' : 'bg-red-400 translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* MARD Chat Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white font-bold uppercase tracking-wider">M.A.R.D Chatbot</div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Advocate Response Engine</div>
                </div>
                <button
                  onClick={() => handleDaemonToggle('mardChat', 'M.A.R.D Chatbot')}
                  className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 border cursor-pointer ${
                    daemons.mardChat 
                      ? 'bg-emerald-500/20 border-emerald-500' 
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full transition-all ${
                      daemons.mardChat ? 'bg-emerald-400 translate-x-6' : 'bg-red-400 translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

            </div>

          </div>

          {/* Scrolling Terminal Node Log */}
          <div className="bg-[#04060a] border border-white/10 rounded-xl p-5 flex flex-col flex-1 min-h-[300px] relative overflow-hidden">
            <h3 className="text-xs text-[#38bdf8] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border-b border-[#38bdf8]/10 pb-2 mb-3">
              <Terminal className="w-4 h-4 animate-pulse" /> Live Telemetry Feed
            </h3>

            <div 
              ref={terminalContainerRef}
              className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-2 pr-1 select-text hide-scrollbar"
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {logs.map((log, idx) => {
                let colorClass = 'text-slate-400';
                if (log.includes('SYS >>')) colorClass = 'text-sky-400 font-bold';
                else if (log.includes('DAEMON >>')) colorClass = 'text-purple-400';
                else if (log.includes('CONTROL >>')) colorClass = 'text-amber-400';
                else if (log.includes('SEC >>')) colorClass = 'text-emerald-400';
                
                return (
                  <div key={idx} className={`${colorClass} tracking-wide leading-relaxed break-all`}>
                    {log}
                  </div>
                );
              })}
            </div>

            {/* Glowing bottom grid panel overlay */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#04060a] to-transparent pointer-events-none"></div>
          </div>

        </div>

      </div>

      {/* Haptic Footer Information Panel */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-white/10 pt-6 text-[10px] uppercase tracking-wider text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
          <span>Tactile Relay Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>RTR Protocol Synchronized</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Tailscale mesh authenticated</span>
        </div>
      </footer>
    </div>
  );
}
