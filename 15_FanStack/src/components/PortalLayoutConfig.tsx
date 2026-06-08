import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Save, X, LayoutGrid } from 'lucide-react';

interface PortalLayoutConfigProps {
  onClose: () => void;
}

import { PORTAL_APPS, getDefaultAppOrder } from '../config/PortalApps';

interface AppDef {
  id: string;
  name: string;
}

const DEFAULT_APPS: AppDef[] = PORTAL_APPS.map(app => ({ id: app.id, name: app.title }));

export default function PortalLayoutConfig({ onClose }: PortalLayoutConfigProps) {
  const [apps, setApps] = useState<AppDef[]>([]);

  useEffect(() => {
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
              const mappedApps = order.map((id: string) => DEFAULT_APPS.find(a => a.id === id)).filter(Boolean);
              const missingApps = DEFAULT_APPS.filter(a => !order.includes(a.id));
              setApps([...mappedApps, ...missingApps]);
              return;
            } catch(e) {}
          }
        }
        setApps([...DEFAULT_APPS]);
      })
      .catch(() => setApps([...DEFAULT_APPS]));
    } else {
      setApps([...DEFAULT_APPS]);
    }
  }, []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newApps = [...apps];
    [newApps[index - 1], newApps[index]] = [newApps[index], newApps[index - 1]];
    setApps(newApps);
  };

  const moveDown = (index: number) => {
    if (index === apps.length - 1) return;
    const newApps = [...apps];
    [newApps[index + 1], newApps[index]] = [newApps[index], newApps[index + 1]];
    setApps(newApps);
  };

  const handleSave = () => {
    const order = apps.map(a => a.id);
    const token = localStorage.getItem('sovereign_session_token');
    if (token) {
      fetch('/api/user_preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'sovereign_portal_order', value: JSON.stringify(order) })
      }).then(() => {
        window.dispatchEvent(new Event('layout_changed'));
        onClose();
      });
    } else {
      localStorage.setItem('sovereign_portal_order', JSON.stringify(order));
      window.dispatchEvent(new Event('layout_changed'));
      onClose();
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 max-w-2xl mx-auto p-4 max-h-[85vh] overflow-hidden">
      <header className="flex items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white tracking-[0.1em] uppercase">
              Portal Layout
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mt-0.5">
              Dashboard Card Ordering
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

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {apps.map((app, index) => (
          <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10 group">
            <div className="flex items-center gap-4">
              <div className="font-mono text-[10px] text-white/20 w-6 text-center">{index + 1}</div>
              <div className="font-display font-bold text-lg text-white">{app.name}</div>
            </div>
            
            <div className="flex items-center gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                onClick={() => moveDown(index)}
                disabled={index === apps.length - 1}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end shrink-0">
        <button 
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold font-display uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg"
        >
          <Save size={18} /> Save Layout
        </button>
      </div>
    </div>
  );
}
