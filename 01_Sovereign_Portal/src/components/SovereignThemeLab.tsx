import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings2, Palette, Terminal, Database, RefreshCw, 
  Sliders, CheckCircle2, ChevronRight, Layout, Monitor, 
  User, ShieldAlert, Play, FolderOpen, BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Available Stack CIs for navigation
interface StackCI {
  key: string;
  name: string;
  domain: string;
  port: number;
  department: string;
  status: 'OPERATIONAL' | 'STANDBY';
}

const STACK_CIS: StackCI[] = [
  { key: 'aethervet', name: 'AetherVet', domain: 'ROOT', port: 8443, department: 'Medical Privacy', status: 'OPERATIONAL' },
  { key: 'gonzas_cantina', name: 'Gonzas Cantina', domain: 'ROOT', port: 3002, department: 'Cannabis Mfg', status: 'STANDBY' },
  { key: 'samtracker', name: 'SamTracker', domain: 'ROOT', port: 3004, department: 'Sports Silos', status: 'OPERATIONAL' },
  { key: 'anvil_twine', name: 'Anvil & Twine', domain: 'ROOT', port: 3006, department: 'System Admin', status: 'STANDBY' },
  { key: 'fanstack', name: 'FanStack', domain: 'ROOT', port: 3009, department: 'Sports Silos', status: 'OPERATIONAL' },
  { key: 'stacklabs', name: 'StackLabs LLC', domain: 'ROOT', port: 3000, department: 'System Admin', status: 'OPERATIONAL' },
  { key: 'spite_slice', name: 'Spite Slice', domain: 'ROOT', port: 3010, department: 'Cannabis Mfg', status: 'OPERATIONAL' },
  { key: 'catnip_wars', name: 'Catnip Wars', domain: 'ROOT', port: 7300, department: 'System Admin', status: 'OPERATIONAL' }
];

export default function SovereignThemeLab() {
  const auth = useAuth();
  const username = auth?.user_name || 'james';

  // Preference states
  const [osTheme, setOsTheme] = useState('slate-opaque');
  const [entropyLevel, setEntropyLevel] = useState(1);
  const [proceduralAvatars, setProceduralAvatars] = useState(false);
  const [kioskProjection, setKioskProjection] = useState(false);
  const [deskRelic, setDeskRelic] = useState('');
  
  // UI States
  const [activeTab, setActiveTab] = useState<'slate' | 'portfolio'>('slate');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Accordion portfolio states
  const [expandedFolder, setExpandedFolder] = useState<string | null>('Sports Silos');



  // Fetch current database preferences on mount
  useEffect(() => {
    const fetchMyPrefs = async () => {
      try {
        const token = localStorage.getItem('sovereign_session_token');
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.os_theme) setOsTheme(data.os_theme);
          if (data.entropy_level !== undefined) setEntropyLevel(data.entropy_level);
          setProceduralAvatars(!!data.procedural_avatars);
          setKioskProjection(!!data.kiosk_projection);
          if (data.desk_relic) setDeskRelic(data.desk_relic);
        }
      } catch (err) {
        console.error('Failed to load user preference details:', err);
      }
    };
    fetchMyPrefs();
  }, []);



  // Apply Theme Locally
  const applyThemeLocally = () => {
    let primary = 'hsl(215, 15%, 60%)';
    let glow = 'rgba(255, 255, 255, 0.1)';
    let dim = 'rgba(255, 255, 255, 0.05)';

    if (osTheme === 'slate-opaque') {
      primary = 'hsl(215, 20%, 65%)';
      glow = 'rgba(148, 163, 184, 0.15)';
      dim = 'rgba(148, 163, 184, 0.05)';
      document.documentElement.style.setProperty('--sov-border-radius', '4px');
    } else if (osTheme === 'sovereign-home') {
      primary = 'hsl(200, 100%, 50%)';
      glow = 'rgba(0, 255, 255, 0.3)';
      dim = 'rgba(0, 255, 255, 0.08)';
      document.documentElement.style.setProperty('--sov-border-radius', '12px');
    } else if (osTheme === 'espn') {
      primary = 'hsl(0, 100%, 50%)';
      glow = 'rgba(255, 0, 0, 0.4)';
      dim = 'rgba(255, 0, 0, 0.08)';
      document.documentElement.style.setProperty('--sov-border-radius', '0px');
    }

    document.documentElement.style.setProperty('--sov-primary', primary);
    document.documentElement.style.setProperty('--sov-glow', glow);
    document.documentElement.style.setProperty('--sov-dim', dim);
    
    // Dispatch local storage update trigger
    localStorage.setItem('sovereign_theme', osTheme);
    window.dispatchEvent(new Event('theme_changed'));
    
    showStatus('success', '✓ Theme tokens applied locally to viewport.');
  };

  // Commit Preferences to SQLite database
  const commitToDatabase = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const token = localStorage.getItem('sovereign_session_token') || '';
    
    try {
      const res = await fetch('/api/auth/update_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username,
          os_theme: osTheme,
          entropy_level: entropyLevel,
          procedural_avatars: proceduralAvatars,
          kiosk_projection: kioskProjection,
          desk_relic: deskRelic
        })
      });

      if (res.ok) {
        showStatus('success', '✓ Database Ledger Updated. Configuration Item synchronized.');
      } else {
        const errData = await res.json();
        showStatus('error', `✗ Commit failed: ${errData.detail || 'Access Denied'}`);
      }
    } catch (err) {
      showStatus('error', '✗ Database unreachable. Verify Tailscale network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Navigation custom event dispatcher
  const routeGateway = (stackKey: string) => {
    const target = STACK_CIS.find(ci => ci.key === stackKey);
    if (!target) return;
    
    // Fire the custom event
    window.dispatchEvent(new CustomEvent('NavigateRoom', {
      detail: { domain: target.domain, room: target.key }
    }));
  };



  return (
    <div className="h-[85vh] w-full flex flex-col p-6 bg-[#04060C] text-[#C5C6C7] font-sans overflow-hidden">
      
      {/* Title Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-white uppercase font-black tracking-widest text-xl">Sovereign StackLab</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">UI/UX Navigational Concepts & Telemetry Playground</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] bg-slate-950/80 border border-white/5 px-3 py-1.5 rounded">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>LEDGER STATUS: </span>
          <span className="text-emerald-400 font-bold">CONNECTED</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Control Panel */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 bg-[#090D16] border border-white/10 p-5 rounded-lg select-none">
          <h3 className="text-white font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-400" /> ITSM Preferences
          </h3>

          {/* Theme Dropdown */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Workspace Theme</label>
            <select 
              value={osTheme}
              onChange={(e) => setOsTheme(e.target.value)}
              className="bg-black/60 border border-slate-800 text-xs text-white p-2 rounded outline-none focus:border-slate-600 font-mono"
            >
              <option value="slate-opaque">Slate Opaque (Anti-Glassmorphic)</option>
              <option value="sovereign-home">Deep Void Glass (Frosted)</option>
              <option value="espn">Legacy ESPN (Retro Red)</option>
              <option value="storybook-sapphire">Storybook Sapphire (High-Contrast, Oversized)</option>
            </select>
          </div>

          {/* Entropy level */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Security Entropy Level</label>
              <span className="text-xs font-mono text-white font-bold">{entropyLevel}</span>
            </div>
            <input 
              type="range" 
              min="1" max="11" 
              value={entropyLevel}
              onChange={(e) => setEntropyLevel(parseInt(e.target.value))}
              className="w-full accent-slate-300 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Procedural avatars */}
          <div className="flex items-center gap-3 mt-3">
            <input 
              type="checkbox" 
              id="pref-avatars" 
              checked={proceduralAvatars}
              onChange={(e) => setProceduralAvatars(e.target.checked)}
              className="accent-slate-500 rounded"
            />
            <label htmlFor="pref-avatars" className="text-[11px] text-slate-300 uppercase tracking-wide cursor-pointer font-mono">
              Procedural Avatars
            </label>
          </div>

          {/* Kiosk projection */}
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="pref-kiosk" 
              checked={kioskProjection}
              onChange={(e) => setKioskProjection(e.target.checked)}
              className="accent-slate-500 rounded"
            />
            <label htmlFor="pref-kiosk" className="text-[11px] text-slate-300 uppercase tracking-wide cursor-pointer font-mono">
              Kiosk Projection
            </label>
          </div>

          {/* Desk relic */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Desk Relic (Cave Trophy)</label>
            <input 
              type="text" 
              placeholder="e.g. Industrial Copper Dial"
              value={deskRelic}
              onChange={(e) => setDeskRelic(e.target.value)}
              className="bg-black/60 border border-slate-800 text-xs text-white p-2 rounded outline-none focus:border-slate-600 font-mono"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button 
              onClick={applyThemeLocally}
              className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] uppercase tracking-widest font-black transition-colors rounded"
            >
              Apply Theme Locally
            </button>
            <button 
              onClick={commitToDatabase}
              disabled={isLoading}
              className="w-full py-2 bg-slate-300 text-black hover:bg-white text-[10px] uppercase tracking-widest font-black transition-colors rounded flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Writing to Ledger...
                </>
              ) : (
                'Commit to DB Ledger'
              )}
            </button>
          </div>

          {/* Notification status message */}
          {statusMessage && (
            <div className={`p-2.5 rounded text-[10px] font-mono mt-3 border ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Right Tabbed Playground */}
        <div className="flex-1 flex flex-col bg-[#090D16] border border-white/10 rounded-lg overflow-hidden">
          
          {/* Playground Headers */}
          <div className="flex bg-black/40 border-b border-white/5 text-xs tracking-wider uppercase font-mono select-none">
            <button 
              onClick={() => setActiveTab('slate')}
              className={`px-5 py-3 border-r border-white/5 flex items-center gap-2 transition-colors ${
                activeTab === 'slate' ? 'bg-[#090D16] text-white border-t-2 border-t-slate-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> 1. ServiceNow Slate Grid
            </button>
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`px-5 py-3 border-r border-white/5 flex items-center gap-2 transition-colors ${
                activeTab === 'portfolio' ? 'bg-[#090D16] text-white border-t-2 border-t-slate-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> 2. Collapsible Catalog
            </button>
          </div>

          {/* Playground Tab Contents */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            
            {/* Tab 1: ServiceNow Slate Grid */}
            {activeTab === 'slate' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider">CMDB Active Configuration Items</h4>
                    <p className="text-[10px] text-slate-500">ServiceNow-Inspired Slate workspace. Click a CI node row to route gateway telepresence.</p>
                  </div>
                </div>

                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <th className="py-2.5 px-4">Configuration Item (CI)</th>
                        <th className="py-2.5 px-4">Class</th>
                        <th className="py-2.5 px-4">Port</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Gateway</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {STACK_CIS.map((ci) => (
                        <tr 
                          key={ci.key}
                          onClick={() => routeGateway(ci.key)}
                          className="hover:bg-slate-800/40 border-b border-slate-800/20 cursor-pointer group transition-colors"
                        >
                          <td className="py-2.5 px-4 text-white font-bold group-hover:text-blue-400 transition-colors">
                            {ci.name}
                          </td>
                          <td className="py-2.5 px-4 text-[10px] uppercase text-slate-500">
                            {ci.department}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            {ci.port}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                              ci.status === 'OPERATIONAL' 
                                ? 'bg-emerald-950/55 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-950/55 border border-amber-500/20 text-amber-400'
                            }`}>
                              {ci.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button className="text-[9px] uppercase tracking-widest bg-slate-900 group-hover:bg-blue-600 border border-slate-800 group-hover:border-blue-500 text-slate-400 group-hover:text-white px-2 py-1 rounded transition-colors">
                              [Route]
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}



            {/* Tab 3: Collapsible Portfolios */}
            {activeTab === 'portfolio' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Business Service Portfolio</h4>
                  <p className="text-[10px] text-slate-500">Group active configurations by department. Double-click group or click stack item to route.</p>
                </div>

                {/* Accordions */}
                <div className="flex flex-col gap-3">
                  {[
                    { category: 'Sports Silos', description: 'Baseball and sports analytics pipelines' },
                    { category: 'Cannabis Mfg', description: 'Manufacturing, logistics, and recipe automation CIs' },
                    { category: 'Medical Privacy', description: 'Patient records, telemetry security CIs' },
                    { category: 'System Admin', description: 'Core operating systems, daemons, databases CIs' }
                  ].map((group) => {
                    const groupItems = STACK_CIS.filter(ci => ci.department === group.category);
                    const isExpanded = expandedFolder === group.category;

                    return (
                      <div 
                        key={group.category}
                        className="bg-black/20 border border-slate-800 rounded overflow-hidden"
                      >
                        <div 
                          onClick={() => setExpandedFolder(isExpanded ? null : group.category)}
                          className="flex justify-between items-center p-3.5 bg-slate-900/40 hover:bg-slate-900/70 cursor-pointer select-none transition-colors border-b border-slate-800/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-white' : ''}`} />
                            <div>
                              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">{group.category}</span>
                              <span className="text-[9px] text-slate-500 block">{group.description}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-white/5 px-2 py-0.5 rounded font-bold">
                            {groupItems.length} CIs
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="p-3 bg-black/10 divide-y divide-slate-900/60 font-mono text-xs">
                            {groupItems.length === 0 ? (
                              <div className="text-[10px] text-slate-500 py-1 px-4 italic">No active configuration items in this domain.</div>
                            ) : (
                              groupItems.map(item => (
                                <div 
                                  key={item.key}
                                  onClick={() => routeGateway(item.key)}
                                  className="flex justify-between items-center py-2.5 px-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-200 font-bold">{item.name}</span>
                                    <span className="text-[9px] text-slate-600">Port {item.port}</span>
                                  </div>
                                  <span className="text-[9px] uppercase tracking-widest text-[#38bdf8] bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                                    ROUTE CI
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
