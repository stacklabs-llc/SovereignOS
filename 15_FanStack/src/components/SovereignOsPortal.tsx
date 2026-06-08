import React, { useState, useEffect } from 'react';
import { Activity, Server, ShieldAlert, CheckCircle2, ChevronRight, Bug, Users, MessageSquare, Terminal, Home, Video, ClipboardList, Database, Leaf, UtensilsCrossed, Lock } from 'lucide-react';
import { PORTAL_APPS, getDefaultAppOrder, getEnvDetails } from '../config/PortalApps';

interface SovereignOsPortalProps {
  onNavigate: (domain: 'ROOT' | 'PORTAL' | 'MLB' | 'PGA' | 'HOLODEX' | 'SKEW' | 'ARGUS' | 'CMDB' | 'GLOBAL', room?: string) => void;
  globalBoggsOverride?: string;
}

export default function SovereignOsPortal({ onNavigate, globalBoggsOverride = 'None' }: SovereignOsPortalProps) {
  const [currentView, setCurrentView] = useState<'main' | 'directory'>('main');
  const [osTheme, setOsTheme] = useState<string>(() => localStorage.getItem('sovereign_theme') || 'mac');
  const [telemetryState, setTelemetryState] = useState<any>({ temp: 45.2, cpu: 12.5, mem: 4.1 });
  const [activeNode, setActiveNode] = useState<'73' | '183'>('73');
  const [drilldownNode, setDrilldownNode] = useState<any>(null);
  const [cardOrder, setCardOrder] = useState<string[]>(getDefaultAppOrder());

  const fetchCardOrder = () => {
    const token = localStorage.getItem('sovereign_session_token');
    if (token) {
      fetch('/api/user_preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.preferences) {
          const layoutPref = data.preferences.find((p: any) => p.name === 'sovereign_portal_order');
          if (layoutPref) {
            try {
              const order = JSON.parse(layoutPref.value);
              // Ensure all current apps are represented, preserving order
              const missingApps = getDefaultAppOrder().filter(id => !order.includes(id));
              setCardOrder([...order, ...missingApps]);
              return;
            } catch(e) {}
          }
        }
        
        // Fallback to localStorage if no preference is found in the database
        try {
          const saved = localStorage.getItem('sovereign_portal_order');
          if (saved) {
             const order = JSON.parse(saved);
             const missingApps = getDefaultAppOrder().filter(id => !order.includes(id));
             setCardOrder([...order, ...missingApps]);
             return;
          }
        } catch(e) {}
        
        // If neither, fallback to default
        setCardOrder(getDefaultAppOrder());
      })
      .catch(() => {
        setCardOrder(getDefaultAppOrder());
      });
    } else {
      try {
        const saved = localStorage.getItem('sovereign_portal_order');
        if (saved) setCardOrder(JSON.parse(saved));
      } catch(e) {}
    }
  };

  useEffect(() => {
    fetchCardOrder();
  }, []);

  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);

  // Deterministic color generator based on sys_id (guid)
  const generateColorFromSysId = (sysId: string) => {
    if (!sysId) return '#38bdf8';
    let hash = 0;
    for (let i = 0; i < sysId.length; i++) {
        hash = sysId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // IP Range Configuration for Core Mesh Nodes
  const isCoreMeshNode = (ip: string) => {
    if (!ip) return false;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const lastOctet = parseInt(parts[3], 10);
    
    // Pi 2 Cluster (110-120)
    if (lastOctet >= 110 && lastOctet <= 120) return true;
    
    // Primary Nodes & Specialty Hardware (60-99, 160-190)
    if (lastOctet >= 60 && lastOctet <= 99) return true;
    if (lastOctet >= 160 && lastOctet <= 190) return true;
    
    return false;
  };

  useEffect(() => {
    fetch('/api/now/table/cmdb_ci_hardware')
      .then(res => res.json())
      .then(data => {
        if (data && data.result) {
            const mappedNodes = data.result
              .filter((hw: any) => isCoreMeshNode(hw.ip_address))
              .map((hw: any) => {
                const color = generateColorFromSysId(hw.sys_id);
                return {
                    id: hw.sys_id,
                    name: hw.name,
                    alias: hw.short_description || 'Node',
                    ip: hw.ip_address || 'Unknown IP',
                    role: hw.sys_class_name,
                    hw: hw.model_id || 'Unknown Hardware',
                    themeColor: color,
                    hackerColor: color,
                    isOnline: hw.operational_status === 1 || hw.operational_status === "1" || hw.active === "true" || hw.active === 1 || hw.active === true
                };
            });
            setAllNodes(mappedNodes);
        }
      })
      .catch(err => console.error("Failed to load hardware nodes", err))
      .finally(() => setLoadingNodes(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('sovereign_theme', osTheme);
  }, [osTheme]);

  useEffect(() => {
    // Listen for theme changes from GlobalSystemBar
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'mac');
    };
    const handleLayoutChange = () => {
      fetchCardOrder();
    };
    const handleOsRootClicked = () => {
      setCurrentView('main');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    window.addEventListener('layout_changed', handleLayoutChange);
    window.addEventListener('os_root_clicked', handleOsRootClicked);
    return () => {
      window.removeEventListener('theme_changed', handleThemeChange);
      window.removeEventListener('layout_changed', handleLayoutChange);
      window.removeEventListener('os_root_clicked', handleOsRootClicked);
    };
  }, []);

  useEffect(() => {
    // Mock telemetry polling for the active node
    const interval = setInterval(() => {
      setTelemetryState({
        temp: 40 + Math.random() * 10,
        cpu: Math.random() * 20,
        mem: 3.5 + Math.random() * 1.5
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const copySshCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    alert(`Copied to clipboard: ${cmd}`);
  };


  const renderTelemetryCard = (nodeId: string) => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const is73 = nodeId === '73';
    
    // Extract last octet from IP for deterministic modifiers
    const ipParts = node.ip.split('.');
    const ipSuffix = ipParts.length === 4 ? parseInt(ipParts[3], 10) : 0;
    const tempModifier = ipSuffix % 10;
    
    const temp = is73 ? telemetryState.temp : telemetryState.temp + tempModifier;
    const cpu = is73 ? telemetryState.cpu : telemetryState.cpu * (1 + (tempModifier/10));
    const mem = is73 ? telemetryState.mem : telemetryState.mem * (1 + (tempModifier/20));
    const color = node.isOnline ? node.themeColor : '#5a7a8a';

    return (
      <div 
        onClick={() => setDrilldownNode(node)}
        className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-lg cursor-pointer hover:bg-white/10 transition-colors group"
      >
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}></div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[11px] font-bold text-[#8E9CAA] tracking-[0.15em] flex items-center gap-2">
            <Activity size={14} style={{ color }} /> System Health
          </h2>
          <div className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border transition-colors" style={{ backgroundColor: `${color}20`, color: color, borderColor: `${color}30` }}>
            .{node.id}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center transition-transform group-hover:scale-110">
            <Server size={20} style={{ color }} />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{node.name}</div>
            <div className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${node.isOnline ? 'text-[#00FF88]' : 'text-[#ff4444]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${node.isOnline ? 'bg-[#00FF88] animate-pulse ' : 'bg-[#ff4444]'}`}></span> 
              {node.isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/40 border border-white/5 p-2 rounded-lg text-center group-hover:border-white/20 transition-colors">
            <div className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-1">TEMP</div>
            <div className="font-mono text-xs" style={{ color }}>{node.isOnline ? `${temp.toFixed(1)}°C` : 'N/A'}</div>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-lg text-center group-hover:border-white/20 transition-colors">
            <div className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-1">CPU</div>
            <div className="font-mono text-xs" style={{ color }}>{node.isOnline ? `${cpu.toFixed(1)}%` : 'N/A'}</div>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-lg text-center group-hover:border-white/20 transition-colors">
            <div className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-1">RAM</div>
            <div className="font-mono text-xs" style={{ color }}>{node.isOnline ? `${mem.toFixed(1)}G` : 'N/A'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 overflow-y-auto pb-24">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg border flex items-center justify-center border-[#38bdf8]/50 bg-[#38bdf8]/10 ">
            <ShieldAlert className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white drop-shadow-lg tracking-[0.1em] uppercase">
              Sovereign OS {currentView === 'directory' && <span className="text-white/50">/ APP DIRECTORY</span>}
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[#38bdf8]">
              Root Access Granted
            </p>
          </div>
        </div>
        {currentView === 'directory' && (
          <button 
            onClick={() => setCurrentView('main')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold tracking-widest uppercase text-white transition-colors flex items-center gap-2"
          >
            ← Back to Main
          </button>
        )}
      </header>

      {/* Grid Layout */}
      <div className="w-full flex flex-col gap-6 flex-1">
        
        {/* RIGHT COLUMN: Core Apps & SDLC (Now Full Width) */}
        <div className="w-full flex flex-col gap-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(() => {
              const env = getEnvDetails();

              let appDefs = PORTAL_APPS.map(app => ({ ...app }));

              if (env.name === 'DEV') {
                  appDefs = appDefs.filter(app => ['fanstack', 'gardenstack', 'samtracker', 'env_indicator', 'itsm', 'argus', 'system_config', 'app_directory', 'cinema_remote'].includes(app.id));
              }

              // Filter based on currentView
              if (currentView === 'main') {
                appDefs = appDefs.filter(app => app.defaultVisibleInMain);
              } else {
                appDefs = appDefs.filter(app => app.defaultVisibleInDirectory);
              }

              // Sort based on cardOrder
              const sortedApps = [...appDefs].sort((a, b) => {
                const indexA = cardOrder.indexOf(a.id);
                const indexB = cardOrder.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });

              return sortedApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => app.onClick(onNavigate, setCurrentView)}
                  className="p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.05)' : `${app.color}1a`, borderColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${app.color}4d`, borderWidth: '1px' }}
                >
                  {app.badge && (
                    <div 
                      className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest"
                      style={{ backgroundColor: `${app.color}33`, borderColor: `${app.color}4d`, borderWidth: '1px', color: app.color }}
                    >
                      {app.badge}
                    </div>
                  )}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${app.color}33` }}
                  >
                    {app.icon}
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">{app.title}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: app.color === '#ffffff' ? 'rgba(255,255,255,0.4)' : app.color }}>
                      {app.subtitle}
                    </p>
                  </div>
                </button>
              ));
            })()}
          </div>

        </div>
      </div>

      {/* Drilldown Modal Overlay */}
      {drilldownNode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-2xl  overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(90deg, ${drilldownNode.hackerColor}, transparent)` }}></div>
            
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border flex items-center justify-center bg-black/40" style={{ borderColor: `${drilldownNode.hackerColor}50` }}>
                  <Server size={28} style={{ color: drilldownNode.hackerColor }} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">{drilldownNode.name}</h2>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="font-mono text-white/50">{drilldownNode.ip}</span>
                    <span className="text-[#00FF88] font-mono text-[10px] flex items-center gap-1 border border-[#00FF88]/30 px-2 rounded-full bg-[#00FF88]/10"><span className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse "></span> ACTIVE</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDrilldownNode(null)} className="text-white/40 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Network Identity</div>
                  <div className="text-white font-mono bg-black/40 border border-white/5 p-3 rounded-lg flex justify-between items-center group cursor-pointer hover:border-white/20 transition-colors" onClick={() => copySshCommand(`ssh james@${drilldownNode.ip}`)}>
                    <span className="text-xs">ssh james@{drilldownNode.ip}</span>
                    <ClipboardList size={14} className="text-white/20 group-hover:text-white transition-colors" />
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Hardware & Optics</div>
                  <div className="text-white text-sm bg-black/40 border border-white/5 p-3 rounded-lg">
                    {drilldownNode.hw}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">System Role</div>
                  <div className="text-white text-sm bg-black/40 border border-white/5 p-3 rounded-lg border-l-4" style={{ borderLeftColor: drilldownNode.hackerColor }}>
                    {drilldownNode.role}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Live Telemetry</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
                    <Activity size={20} className="text-white/20 mb-2" />
                    <div className="font-mono text-xl" style={{ color: drilldownNode.hackerColor }}>{(telemetryState.temp + (parseInt(drilldownNode.id)%10)).toFixed(1)}°C</div>
                    <div className="text-[9px] text-white/40 mt-1">CORE TEMP</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
                    <Server size={20} className="text-white/20 mb-2" />
                    <div className="font-mono text-xl" style={{ color: drilldownNode.hackerColor }}>{(telemetryState.cpu * (1 + (parseInt(drilldownNode.id)%10)/10)).toFixed(1)}%</div>
                    <div className="text-[9px] text-white/40 mt-1">CPU LOAD</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Active Daemons</div>
                  <div className="bg-black/40 border border-white/5 rounded-lg overflow-hidden text-xs font-mono">
                    <div className="p-2 border-b border-white/5 flex justify-between items-center"><span className="text-[#00FF88]">●</span> ustreamer-daemon</div>
                    <div className="p-2 border-b border-white/5 flex justify-between items-center"><span className="text-[#00FF88]">●</span> fanstack-relay</div>
                    <div className="p-2 flex justify-between items-center text-white/40"><span>○</span> ai-vision-agent (sleeping)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end gap-3">
              <button 
                onClick={() => onNavigate('ARGUS')}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Video size={16} /> Open Optics
              </button>
              <button 
                onClick={() => setDrilldownNode(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: drilldownNode.hackerColor }}
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
