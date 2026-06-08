import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Save, X, LayoutGrid, Eye, EyeOff, Plus, Check } from 'lucide-react';
import { PORTAL_APPS } from '../config/PortalApps';

interface PortalLayoutConfigProps {
  onClose: () => void;
}

interface AppDef {
  id: string;
  name: string;
  category: string;
  u_visible_on_main: boolean;
  dbId?: string;
}

export default function PortalLayoutConfig({ onClose }: PortalLayoutConfigProps) {
  const [apps, setApps] = useState<AppDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sovereign_session_token');
    
    // 1. Fetch saved order preference
    const fetchOrder = async () => {
      let savedOrder: string[] = [];
      if (token) {
        try {
          const res = await fetch('/api/user_preferences', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data && data.preferences) {
            const layoutPref = data.preferences.find((p: any) => p.name === 'sovereign_portal_order');
            if (layoutPref) savedOrder = JSON.parse(layoutPref.value);
          }
        } catch (e) {
          console.error('Failed to fetch user preferences:', e);
        }
      }
      if (savedOrder.length === 0) {
        try {
          const localOrder = localStorage.getItem('sovereign_portal_order');
          if (localOrder) savedOrder = JSON.parse(localOrder);
        } catch (e) {}
      }
      return savedOrder;
    };

    // 2. Fetch database modules
    const fetchDbModules = async () => {
      try {
        const res = await fetch('/api/now/table/sys_module');
        const data = await res.json();
        if (data && data.result) return data.result;
      } catch (e) {
        console.error('Failed to fetch modules:', e);
      }
      return [];
    };

    // 3. Assemble and merge lists
    Promise.all([fetchOrder(), fetchDbModules()]).then(([savedOrder, dbModules]) => {
      const dbApps = dbModules.map((m: any) => ({
        id: m.module_name,
        name: m.display_name,
        category: m.category || 'stack',
        u_visible_on_main: m.u_visible_on_main === 1 || m.u_visible_on_main === '1' || m.u_visible_on_main === true,
        dbId: m.id
      }));

      // Virtual core apps are always visible
      const virtualApps = PORTAL_APPS.filter(app => app.id === 'app_directory' || app.id === 'power_tools_utilities')
        .map(app => ({
          id: app.id,
          name: app.title,
          category: app.category || 'utility',
          u_visible_on_main: true,
          dbId: undefined
        }));

      const allAppsMap = new Map<string, AppDef>();
      [...virtualApps, ...dbApps].forEach(app => {
        allAppsMap.set(app.id, app);
      });

      // Add remaining static apps from PORTAL_APPS if not present in DB
      PORTAL_APPS.forEach(staticApp => {
        if (!allAppsMap.has(staticApp.id)) {
          allAppsMap.set(staticApp.id, {
            id: staticApp.id,
            name: staticApp.title,
            category: staticApp.category || 'stack',
            u_visible_on_main: staticApp.defaultVisibleInMain || false,
            dbId: undefined
          });
        }
      });

      const allAppsList = Array.from(allAppsMap.values());

      // Sort: visible apps at top ordered by savedOrder, followed by hidden ones sorted alphabetically
      const sorted = [...allAppsList].sort((a, b) => {
        if (a.u_visible_on_main && !b.u_visible_on_main) return -1;
        if (!a.u_visible_on_main && b.u_visible_on_main) return 1;

        if (a.u_visible_on_main && b.u_visible_on_main) {
          const indexA = savedOrder.indexOf(a.id);
          const indexB = savedOrder.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        }

        return a.name.localeCompare(b.name);
      });

      setApps(sorted);
      setLoading(false);
    });
  }, []);

  const toggleVisibility = (appId: string) => {
    // Virtual/core apps cannot be hidden
    if (appId === 'app_directory' || appId === 'power_tools_utilities') return;
    
    setApps(prevApps => {
      const updated = prevApps.map(app => {
        if (app.id === appId) {
          return { ...app, u_visible_on_main: !app.u_visible_on_main };
        }
        return app;
      });

      // Maintain order of visible apps, group visible at top, hidden at bottom
      const visible = updated.filter(a => a.u_visible_on_main);
      const hidden = updated.filter(a => !a.u_visible_on_main);
      return [...visible, ...hidden];
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    if (!apps[index - 1].u_visible_on_main) return;
    const newApps = [...apps];
    [newApps[index - 1], newApps[index]] = [newApps[index], newApps[index - 1]];
    setApps(newApps);
  };

  const moveDown = (index: number) => {
    if (index === apps.length - 1) return;
    if (!apps[index + 1].u_visible_on_main) return;
    const newApps = [...apps];
    [newApps[index + 1], newApps[index]] = [newApps[index], newApps[index + 1]];
    setApps(newApps);
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem('sovereign_session_token');

    // 1. Save order of visible apps
    const visibleApps = apps.filter(a => a.u_visible_on_main);
    const visibleOrder = visibleApps.map(a => a.id);

    if (token) {
      try {
        await fetch('/api/user_preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: 'sovereign_portal_order', value: JSON.stringify(visibleOrder) })
        });
      } catch (e) {
        console.error('Failed to save order preference:', e);
      }
    } else {
      localStorage.setItem('sovereign_portal_order', JSON.stringify(visibleOrder));
    }

    // 2. Save module visibilities back to database (sys_module)
    const dbUpdates = apps.map(async (app) => {
      // Skip virtual apps
      if (app.id === 'app_directory' || app.id === 'power_tools_utilities') return;

      const payload = {
        u_visible_on_main: app.u_visible_on_main ? 1 : 0
      };

      if (app.dbId) {
        // Update existing record
        await fetch(`/api/now/table/sys_module/${app.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new record
        const staticApp = PORTAL_APPS.find(sa => sa.id === app.id);
        await fetch('/api/now/table/sys_module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_name: app.id,
            display_name: app.name,
            description: staticApp?.subtitle || 'Static Application',
            color: staticApp?.color || '#38bdf8',
            active: 1,
            category: app.category || 'stack',
            u_visible_on_main: app.u_visible_on_main ? 1 : 0
          })
        });
      }
    });

    try {
      await Promise.all(dbUpdates);
    } catch (e) {
      console.error('Error updating modules on database:', e);
    }

    window.dispatchEvent(new Event('layout_changed'));
    onClose();
  };

  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 max-w-4xl mx-auto p-4 max-h-[85vh] overflow-hidden">
      <header className="flex items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white tracking-[0.1em] uppercase">
              Portal Layout Manager
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mt-0.5">
              Configure Dashboard Card Elevations & Visibility
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white/40 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </header>
 
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-white/50 font-mono text-sm uppercase tracking-wider animate-pulse">
            Processing system modules...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Active Cards Column */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display font-bold text-sm tracking-wider text-[#10b981] uppercase flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              Elevated Dashboard Cards (Visible)
            </h2>
            <div className="flex flex-col gap-3">
              {apps.filter(app => app.u_visible_on_main).map((app, index, list) => (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10 group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/30 w-5 text-center">{index + 1}</span>
                    <div>
                      <div className="font-display font-bold text-md text-white">{app.name}</div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {app.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Move Controls */}
                    <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
                      <button 
                        onClick={() => moveUp(apps.indexOf(app))}
                        disabled={index === 0}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-white/5 rounded-lg border border-white/10 transition-colors text-white"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveDown(apps.indexOf(app))}
                        disabled={index === list.length - 1}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-white/5 rounded-lg border border-white/10 transition-colors text-white"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    {/* Visibility Action Toggle */}
                    {app.id !== 'app_directory' && app.id !== 'power_tools_utilities' ? (
                      <button
                        onClick={() => toggleVisibility(app.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/20 transition-all font-mono text-[9px] uppercase tracking-wider"
                        title="Hide Card from Dashboard"
                      >
                        <EyeOff size={11} /> Hide
                      </button>
                    ) : (
                      <span className="font-mono text-[8px] text-white/20 uppercase px-2 py-1 border border-white/5 bg-white/5 rounded select-none">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {apps.filter(app => app.u_visible_on_main).length === 0 && (
                <div className="p-8 rounded-xl border border-dashed border-white/10 bg-white/5 text-center text-white/30 font-mono text-xs uppercase">
                  No active dashboard cards
                </div>
              )}
            </div>
          </div>

          {/* Inactive Cards Column */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display font-bold text-sm tracking-wider text-white/50 uppercase mb-2">
              Available Applications (Inactive/Hidden)
            </h2>
            <div className="flex flex-col gap-3">
              {apps.filter(app => !app.u_visible_on_main).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 group hover:border-white/10 hover:bg-black/30 transition-all">
                  <div>
                    <div className="font-display font-medium text-md text-white/70 group-hover:text-white transition-colors">{app.name}</div>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-white/40 bg-white/5 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {app.category}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleVisibility(app.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 hover:bg-[#f59e0b] hover:text-black text-[#f59e0b] border border-[#f59e0b]/30 hover:border-transparent transition-all font-display font-bold text-[10px] uppercase tracking-widest shadow-sm"
                  >
                    <Plus size={12} /> Elevate Card
                  </button>
                </div>
              ))}
              {apps.filter(app => !app.u_visible_on_main).length === 0 && (
                <div className="p-8 rounded-xl border border-dashed border-white/10 bg-white/5 text-center text-white/30 font-mono text-xs uppercase">
                  All applications are active on the dashboard
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold font-display uppercase tracking-widest text-xs transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold font-display uppercase tracking-widest text-xs flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50"
        >
          <Save size={14} /> Save Layout & Elevations
        </button>
      </div>
    </div>
  );
}
