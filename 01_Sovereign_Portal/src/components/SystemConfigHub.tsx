import React, { useState, useEffect } from 'react';
import { Palette, Server, Database, Shield, Sliders, Monitor, BookOpen, Layers, Settings, Puzzle, Plus, RefreshCw } from 'lucide-react';
import { PORTAL_APPS } from '../config/PortalApps';

interface SystemConfigHubProps {
  initialTab?: 'config' | 'services';
  onNavigate: (room: string) => void;
}

interface ConfigCard {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  room: string;
  badge?: string;
}

const CONFIG_CARDS: ConfigCard[] = [
  {
    id: 'theme_manager',
    title: 'Theme Manager',
    subtitle: 'CSS Token Config',
    color: '#a855f7',
    icon: <Palette size={24} />,
    room: 'theme_manager',
  },
  {
    id: 'nexus_telemetry',
    title: 'Fleet Telemetry',
    subtitle: 'Mesh Node Status',
    color: '#22c55e',
    icon: <Server size={24} />,
    room: 'nexus_telemetry',
  },
  {
    id: 'cmdb',
    title: 'CMDB',
    subtitle: 'Hardware Registry',
    color: '#38bdf8',
    icon: <Database size={24} />,
    room: 'cmdb',
    badge: 'LIVE',
  },
  {
    id: 'sovereign_css',
    title: 'Sovereign CSS',
    subtitle: 'Live Style Editor',
    color: '#f472b6',
    icon: <Monitor size={24} />,
    room: 'sovereign_css',
  },
  {
    id: 'user_management',
    title: 'User Management',
    subtitle: 'Identity & Access',
    color: '#a855f7',
    icon: <Shield size={24} />,
    room: 'user_management',
    badge: 'ADMIN',
  },
  {
    id: 'portal_layout',
    title: 'Portal Layout',
    subtitle: 'Dashboard Ordering',
    color: '#f59e0b',
    icon: <Sliders size={24} />,
    room: 'portal_layout',
  },
  {
    id: 'sys_rules',
    title: 'System Rules',
    subtitle: 'SDLC Protocols',
    color: '#ef4444',
    icon: <BookOpen size={24} />,
    room: 'sys_rules',
  },
  {
    id: 'sys_docs',
    title: 'System Docs',
    subtitle: 'Platform Playbooks',
    color: '#38bdf8',
    icon: <BookOpen size={24} />,
    room: 'sys_docs',
  },
  {
    id: 'oracle_guardrails',
    title: 'Oracle Guardrails',
    subtitle: 'Data-Driven Directives',
    color: '#22d3ee',
    icon: <Shield size={24} />,
    room: 'oracle_guardrails',
  },
];

export default function SystemConfigHub({ initialTab = 'config', onNavigate }: SystemConfigHubProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'services'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [activeModules, setActiveModules] = useState<any[]>([]);
  const [provisioningStack, setProvisioningStack] = useState<any | null>(null);
  const [provisioningUtils, setProvisioningUtils] = useState<any[]>([]);

  // Provision New Stack States
  const [showProvisionStackModal, setShowProvisionStackModal] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [newStackId, setNewStackId] = useState('');
  const [newStackDescription, setNewStackDescription] = useState('');
  const [newStackColor, setNewStackColor] = useState('#38bdf8');
  const [newStackPort, setNewStackPort] = useState('');
  const [newStackIcon, setNewStackIcon] = useState('❖');
  const [submitting, setSubmitting] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);

  const [gamedaySyncEnabled, setGamedaySyncEnabled] = useState(true);
  const [togglingSync, setTogglingSync] = useState(false);

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

  const fetchGamedaySyncStatus = () => {
    const token = localStorage.getItem('sovereign_session_token');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/api/system/gameday_sync/status', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setGamedaySyncEnabled(data.enabled);
        }
      })
      .catch(err => console.error('Error fetching gameday sync status:', err));
  };

  const handleToggleGamedaySync = () => {
    setTogglingSync(true);
    const token = localStorage.getItem('sovereign_session_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const nextState = !gamedaySyncEnabled;
    fetch('/api/system/gameday_sync/toggle', {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled: nextState })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setGamedaySyncEnabled(data.enabled);
      }
    })
    .catch(err => console.error('Error toggling gameday sync:', err))
    .finally(() => setTogglingSync(false));
  };

  useEffect(() => {
    fetchActiveModules();
    fetchGamedaySyncStatus();
  }, []);


  const handleOpenProvisioning = (stackApp: any) => {
    setProvisioningStack(stackApp);
    const token = localStorage.getItem('sovereign_session_token');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`/api/auth/stack_utilities/${stackApp.id}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setProvisioningUtils(data.utilities);
        }
      })
      .catch(err => console.error('Error fetching stack utilities:', err));
  };

  const handleToggleUtility = (util: any) => {
    if (!provisioningStack) return;
    const newActive = util.active === 1 ? 0 : 1;
    const token = localStorage.getItem('sovereign_session_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Update local state immediately for snappy UX
    setProvisioningUtils(prev => prev.map(u => u.module_name === util.module_name ? { ...u, active: newActive } : u));

    fetch('/api/auth/provision_utility', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        stack_module_name: provisioningStack.id,
        utility_module_name: util.module_name,
        active: newActive
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        window.dispatchEvent(new Event('stack_utilities_changed'));
      } else {
        setProvisioningUtils(prev => prev.map(u => u.module_name === util.module_name ? { ...u, active: util.active } : u));
      }
    })
    .catch(err => {
      console.error('Error provisioning utility:', err);
      setProvisioningUtils(prev => prev.map(u => u.module_name === util.module_name ? { ...u, active: util.active } : u));
    });
  };

  const handleProvisionStack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setProvisioningError(null);

    const modulePayload = {
      module_name: newStackId,
      display_name: newStackName,
      description: newStackDescription,
      icon: newStackIcon,
      color: newStackColor,
      active: 1,
      category: 'stack',
      port: newStackPort ? parseInt(newStackPort, 10) : null
    };

    const applPayload = {
      name: newStackName,
      short_description: newStackDescription,
      operational_status: 1,
      process_name: newStackId,
      port: newStackPort || ''
    };

    try {
      const resModule = await fetch('/api/now/table/sys_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modulePayload)
      });
      const dataModule = await resModule.json();

      if (!resModule.ok || (dataModule && dataModule.error)) {
        throw new Error(dataModule?.error || 'Failed to register sys_module record');
      }

      const resAppl = await fetch('/api/now/table/cmdb_ci_appl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applPayload)
      });
      const dataAppl = await resAppl.json();

      if (!resAppl.ok || (dataAppl && dataAppl.error)) {
        throw new Error(dataAppl?.error || 'Failed to register cmdb_ci_appl record');
      }

      setShowProvisionStackModal(false);
      setNewStackName('');
      setNewStackId('');
      setNewStackDescription('');
      setNewStackColor('#38bdf8');
      setNewStackPort('');
      setNewStackIcon('❖');
      fetchActiveModules();
    } catch (err: any) {
      console.error('Error provisioning stack:', err);
      setProvisioningError(err.message || 'An unexpected error occurred during provisioning');
    } finally {
      setSubmitting(false);
    }
  };

  // Build the stacks and utilities lists
  const virtualApps = PORTAL_APPS.filter(app => app.id === 'app_directory' || app.id === 'power_tools_utilities')
    .map(app => ({ ...app, active: true }));

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
          defaultVisibleInMain: staticApp ? staticApp.defaultVisibleInMain : false,
          defaultVisibleInDirectory: staticApp ? staticApp.defaultVisibleInDirectory : true,
          active: true
        };
      });
  }

  // Deduplicate
  const seenIds = new Set();
  const uniqueApps: any[] = [];
  [...virtualApps, ...enrichedApps].forEach(app => {
    if (!seenIds.has(app.id)) {
      seenIds.add(app.id);
      uniqueApps.push(app);
    }
  });

  const stacks = uniqueApps.filter(app => app.category === 'stack');
  const utilities = uniqueApps.filter(app => app.category === 'utility');

  const renderCategoryGroup = (title: string, icon: string, color: string, apps: any[]) => {
    if (apps.length === 0) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-sm font-display font-bold uppercase tracking-widest text-white/75">{title}</h2>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-white/50 border border-white/10">{apps.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {apps.map(app => (
            <div 
               key={app.id} 
               onClick={() => app.onClick(onNavigate)}
               className="p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg relative overflow-hidden cursor-pointer hover:scale-[1.02] border"
               style={{
                 backgroundColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.05)' : `${app.color}1a`,
                 borderColor: app.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${app.color}4d`
               }}
            >
               {app.category === 'stack' && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleOpenProvisioning(app);
                   }}
                   className="absolute top-2 right-2 p-1.5 rounded-lg border border-white/10 bg-[#0b0e14]/80 text-white/60 hover:text-white hover:bg-white/10 transition-all z-10"
                   title="Manage Plugins"
                 >
                   <Puzzle size={14} />
                 </button>
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
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 p-2">

      {activeTab === 'services' && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold">
            Active Stacks & Services
          </h2>
          <button
            id="syscfg-btn-provision"
            onClick={() => setShowProvisionStackModal(true)}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all border border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} />
            Provision New Stack
          </button>
        </div>
      )}

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CONFIG_CARDS.map((card) => (
            <button
              key={card.id}
              id={`syscfg-card-${card.id}`}
              onClick={() => onNavigate(card.room)}
              className="relative p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg overflow-hidden text-center"
              style={{
                backgroundColor: `${card.color}10`,
                border: `1px solid ${card.color}30`,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${card.color}1f`)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${card.color}10`)}
            >
              <div
                className="absolute top-0 left-0 w-full h-0.5 opacity-60"
                style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }}
              />

              {card.badge && (
                <div
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest"
                  style={{
                    backgroundColor: `${card.color}20`,
                    border: `1px solid ${card.color}40`,
                    color: card.color,
                  }}
                >
                  {card.badge}
                </div>
              )}

              <div
                className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${card.color}20`, color: card.color }}
              >
                {card.icon}
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                  {card.title}
                </h3>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest mt-1"
                  style={{ color: card.color }}
                >
                  {card.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-10 mt-4">
          {renderCategoryGroup("Active Stacks & Services", "🚀", "#38bdf8", stacks)}
          {renderCategoryGroup("Utilities & Power Tools", "🛠️", "#a855f7", utilities)}
        </div>
      )}

      {/* Global Infrastructure Switches */}
      {activeTab === 'config' && (
        <div className="mt-10 space-y-4">
          <div className="border-b border-white/5 pb-2 text-left">
            <h2 className="text-sm font-display font-bold uppercase tracking-widest text-white/75">Global Infrastructure Switches</h2>
          </div>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] shrink-0">
                <RefreshCw size={22} className={gamedaySyncEnabled ? "animate-spin" : ""} style={{ animationDuration: '8s' }} />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-white uppercase tracking-wider text-base">Gameday Sync Daemon</h3>
                <p className="text-xs text-white/50 mt-1 max-w-xl">
                  Continuously compiles and stages live MLB game play-by-plays, simulated chats, and telemetry logs to Google Drive remotes. Disable to pause all automatic background uploads.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs shrink-0">
              <span className={gamedaySyncEnabled ? "text-[#22c55e] font-bold" : "text-white/40"}>
                {gamedaySyncEnabled ? "ACTIVE (SYNCING)" : "MUTED (PAUSED)"}
              </span>
              <button
                type="button"
                onClick={handleToggleGamedaySync}
                disabled={togglingSync}
                className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all border ${
                  gamedaySyncEnabled 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                    : "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/20"
                } cursor-pointer disabled:opacity-50`}
              >
                {togglingSync ? "Updating..." : gamedaySyncEnabled ? "Disable Sync" : "Enable Sync"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future modules placeholder */}
      <div className="mt-8 border border-dashed border-white/10 rounded-2xl p-6 text-center">
        <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          More system modules will appear here as they come online
        </p>
      </div>

      {/* Provisioning Plugins Modal Overlay */}
      {provisioningStack && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(90deg, ${provisioningStack.color}, transparent)` }}></div>
            
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-black/40" style={{ borderColor: `${provisioningStack.color}50` }}>
                  <Puzzle size={20} style={{ color: provisioningStack.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">{provisioningStack.title}</h2>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">Provision Power Tools & Plugins</p>
                </div>
              </div>
              <button onClick={() => setProvisioningStack(null)} className="text-white/40 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[350px] overflow-y-auto space-y-3 font-mono">
              {provisioningUtils.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/30 uppercase tracking-widest">Loading utilities...</div>
              ) : (
                provisioningUtils.map((util) => (
                  <div 
                    key={util.module_name} 
                    onClick={() => handleToggleUtility(util)}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${util.color || '#fff'}20`, color: util.color || '#fff' }}>
                        {util.icon || '🛠️'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">{util.display_name}</div>
                        <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{util.description || 'System Utility'}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={util.active === 1}
                        onChange={() => {}} // handled by parent div onClick
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setProvisioningStack(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold text-white transition-colors uppercase tracking-wider font-mono"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Stack Modal */}
      {showProvisionStackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0b0e14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#38bdf8] to-[#10b981]"></div>
            
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[#38bdf8]/50 flex items-center justify-center bg-black/40">
                  <Plus size={20} className="text-[#38bdf8]" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">Provision New Stack</h2>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">Register Custom Module in CMDB</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProvisionStackModal(false)} 
                className="text-white/40 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionStack} className="p-6 space-y-4 font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Stack Label / Name</label>
                <input 
                  type="text" 
                  value={newStackName}
                  onChange={(e) => {
                    setNewStackName(e.target.value);
                    setNewStackId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
                  }}
                  required
                  placeholder="e.g. WeedStack"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#38bdf8] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Internal Name (Slug / ID)</label>
                <input 
                  type="text" 
                  value={newStackId}
                  onChange={(e) => setNewStackId(e.target.value)}
                  required
                  placeholder="e.g. weedstack"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#38bdf8] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Description</label>
                <input 
                  type="text" 
                  value={newStackDescription}
                  onChange={(e) => setNewStackDescription(e.target.value)}
                  placeholder="e.g. Cannabis Seeding Matrix"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#38bdf8] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wider">Color Theme (Hex)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={newStackColor}
                      onChange={(e) => setNewStackColor(e.target.value)}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={newStackColor}
                      onChange={(e) => setNewStackColor(e.target.value)}
                      placeholder="#38bdf8"
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wider">Network Port</label>
                  <input 
                    type="number" 
                    value={newStackPort}
                    onChange={(e) => setNewStackPort(e.target.value)}
                    placeholder="e.g. 3020"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Emoji Icon</label>
                <input 
                  type="text" 
                  value={newStackIcon}
                  onChange={(e) => setNewStackIcon(e.target.value)}
                  placeholder="e.g. 🥦"
                  maxLength={2}
                  className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:border-[#38bdf8] transition-colors"
                />
              </div>

              {provisioningError && (
                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                  {provisioningError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setShowProvisionStackModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] rounded-lg text-xs font-bold transition-colors uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Provision Stack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
