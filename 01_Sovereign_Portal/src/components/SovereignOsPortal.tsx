import React, { useState, useEffect } from 'react';
import { Activity, Server, ShieldAlert, ClipboardList, Video } from 'lucide-react';
import { PORTAL_APPS, getDefaultAppOrder, getEnvDetails } from '../config/PortalApps';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableAppCard = ({ id, app, onNavigate }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
    backgroundColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.05)' : `${app.color}1a`,
    borderColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${app.color}4d`,
    borderWidth: '1px'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => app.onClick(onNavigate)}
      className="p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg relative overflow-hidden cursor-grab active:cursor-grabbing hover:scale-[1.02]"
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
        className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform pointer-events-none"
        style={{ backgroundColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${app.color}33` }}
      >
        {app.icon}
      </div>
      <div className="text-center pointer-events-none">
        <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">{app.title}</h3>
        <p className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: app.color === '#ffffff' ? 'rgba(255,255,255,0.4)' : app.color }}>
          {app.subtitle}
        </p>
      </div>
    </div>
  );
};

interface SovereignOsPortalProps {
  onNavigate: (domain: 'ROOT' | 'PORTAL' | 'MLB' | 'PGA' | 'HOLODEX' | 'SKEW' | 'ARGUS' | 'CMDB' | 'GLOBAL', room?: string) => void;
  globalBoggsOverride?: string;
  initialView?: 'main' | 'directory';
}

export default function SovereignOsPortal({ onNavigate, globalBoggsOverride = 'None' }: SovereignOsPortalProps) {
  const [telemetryState, setTelemetryState] = useState<any>({ temp: 45.2, cpu: 12.5, mem: 4.1 });
  const [drilldownNode, setDrilldownNode] = useState<any>(null);
  const [cardOrder, setCardOrder] = useState<string[]>(getDefaultAppOrder());
  const [activeModules, setActiveModules] = useState<any[]>([]);

  const fetchActiveModules = () => {
    fetch('/api/now/table/sys_module')
      .then(res => res.json())
      .then(data => {
        if (data && data.result) {
          setActiveModules(data.result);
        }
      })
      .catch(err => console.error('Error fetching modules:', err));
  };

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
              const missingApps = getDefaultAppOrder().filter(id => !order.includes(id));
              setCardOrder([...order, ...missingApps]);
              return;
            } catch(e) {}
          }
        }
        try {
          const saved = localStorage.getItem('sovereign_portal_order');
          if (saved) {
             const order = JSON.parse(saved);
             const missingApps = getDefaultAppOrder().filter(id => !order.includes(id));
             setCardOrder([...order, ...missingApps]);
             return;
          }
        } catch(e) {}
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
    fetchActiveModules();

    const handleLayoutChanged = () => {
      fetchCardOrder();
      fetchActiveModules();
    };

    window.addEventListener('layout_changed', handleLayoutChanged);
    return () => {
      window.removeEventListener('layout_changed', handleLayoutChanged);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = cardOrder.indexOf(active.id);
    const newIndex = cardOrder.indexOf(over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
      setCardOrder(newOrder);
      localStorage.setItem('sovereign_portal_order', JSON.stringify(newOrder));
      
      const token = localStorage.getItem('sovereign_session_token');
      if (token) {
        fetch('/api/user_preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'sovereign_portal_order',
            value: JSON.stringify(newOrder)
          })
        }).catch(err => console.error('Failed to sync portal layout preferences:', err));
      }
    }
  };

  const copySshCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      alert("SSH command copied to clipboard.");
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 p-2">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg border flex items-center justify-center border-[#38bdf8]/50 bg-[#38bdf8]/10 ">
            <ShieldAlert className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white drop-shadow-lg tracking-[0.1em] uppercase flex items-center gap-2">
              Sovereign OS
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[#38bdf8]">
              Root Access Granted
            </p>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="w-full flex flex-col gap-6 flex-1">
        
        {/* RIGHT COLUMN: Core Apps & SDLC (Now Full Width) */}
        <div className="w-full flex flex-col gap-6">
          
          {(() => {
            // Build the base list dynamically from activeModules in DB
            let enrichedApps: any[] = [];

            if (activeModules.length > 0) {
              enrichedApps = activeModules
                .filter(dbModule => dbModule.active === 1 || dbModule.active === '1' || dbModule.active === true)
                .map(dbModule => {
                  const staticApp = PORTAL_APPS.find(app => app.id === dbModule.module_name);
                  return {
                    id: dbModule.module_name,
                    title: dbModule.display_name,
                    subtitle: dbModule.description || staticApp?.subtitle || 'External Stack',
                    color: dbModule.color || staticApp?.color || '#38bdf8',
                    icon: staticApp?.icon || <span className="font-['Outfit'] font-bold text-2xl" style={{ color: dbModule.color || '#38bdf8' }}>❖</span>,
                    category: (dbModule.category || staticApp?.category || 'stack') as 'stack' | 'utility' | 'config',
                    onClick: staticApp ? staticApp.onClick : (onNavigate: any) => {
                      if (dbModule.port) {
                        window.open(`https://clio.taila01894.ts.net:${dbModule.port}/`, '_blank');
                      }
                    },
                    defaultVisibleInMain: dbModule.hasOwnProperty('u_visible_on_main')
                      ? (dbModule.u_visible_on_main === 1 || dbModule.u_visible_on_main === '1' || dbModule.u_visible_on_main === true)
                      : (staticApp ? staticApp.defaultVisibleInMain : false),
                    defaultVisibleInDirectory: staticApp ? staticApp.defaultVisibleInDirectory : true,
                    active: true
                  };
                });
            }

            // Virtual/core apps that are always present and not represented in database as separate operational modules
            const virtualApps = PORTAL_APPS.filter(app => app.id === 'app_directory' || app.id === 'power_tools_utilities')
              .map(app => ({
                ...app,
                active: true
              }));

            // Deduplicate to avoid adding database-defined core modules twice
            const seenIds = new Set();
            const uniqueApps: any[] = [];
            [...virtualApps, ...enrichedApps].forEach(app => {
              if (!seenIds.has(app.id)) {
                seenIds.add(app.id);
                uniqueApps.push(app);
              }
            });

            const DEFAULT_ORDER = [
              'argus',
              'itsm',
              'system_config',
              'app_directory',
              'power_tools_utilities',
              'stack_seeder',
              'stacklabs',
              'persona_center'
            ];

            // On the main dashboard, filter only those visible in main
            const visibleApps = uniqueApps.filter(app => app.defaultVisibleInMain);
            const sortedApps = [...visibleApps].sort((a, b) => {
              const indexA = cardOrder.indexOf(a.id);
              const indexB = cardOrder.indexOf(b.id);
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;

              const defIndexA = DEFAULT_ORDER.indexOf(a.id);
              const defIndexB = DEFAULT_ORDER.indexOf(b.id);
              if (defIndexA !== -1 && defIndexB !== -1) {
                return defIndexA - defIndexB;
              }
              if (defIndexA !== -1) return -1;
              if (defIndexB !== -1) return 1;

              return 0;
            });

            return (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedApps.map(app => app.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sortedApps.map(app => (
                      <SortableAppCard key={app.id} id={app.id} app={app} onNavigate={onNavigate} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            );
          })()}

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
                    <div className="p-2 border-b border-[#fff]/5 flex justify-between items-center"><span className="text-[#00FF88]">●</span> ustreamer-daemon</div>
                    <div className="p-2 border-b border-[#fff]/5 flex justify-between items-center"><span className="text-[#00FF88]">●</span> fanstack-relay</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
