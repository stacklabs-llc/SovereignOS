import React, { useState, useEffect } from 'react';
import { Cpu, ArrowUpRight } from 'lucide-react';
import { PORTAL_APPS } from '../config/PortalApps';

interface PowerTool {
  id: string;
  module_name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  active: number;
  category: string;
  port: number | null;
}

interface PowerToolsGridProps {
  onNavigate: (domain: string, room: string | null) => void;
}

export default function PowerToolsGrid({ onNavigate }: PowerToolsGridProps) {
  const [tools, setTools] = useState<PowerTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/now/table/sys_module')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch modules');
        return res.json();
      })
      .then((data) => {
        if (data && data.result) {
          // Filter to show active utilities
          const utilities = data.result.filter(
            (m: any) =>
              m.category === 'utility' &&
              (m.active === 1 || m.active === '1' || m.active === true)
          );
          setTools(utilities);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAccessTool = (tool: PowerTool) => {
    // Try to find in static PORTAL_APPS first
    const staticApp = PORTAL_APPS.find((app) => app.id === tool.module_name);
    if (staticApp) {
      staticApp.onClick(onNavigate);
      return;
    }

    // Custom navigation mapping based on module_name
    const name = tool.module_name;
    if (name === 'scruffys') {
      onNavigate('GLOBAL', 'scruffys');
      return;
    }
    if (name === 'hot_takes') {
      onNavigate('GLOBAL', 'hot_takes');
      return;
    }
    if (name === 'stream_sniper') {
      onNavigate('GLOBAL', 'stream_sniper');
      return;
    }
    if (name === 'rom_gallery') {
      onNavigate('GLOBAL', 'rom_gallery');
      return;
    }
    if (name === 'roll_call') {
      onNavigate('GLOBAL', 'roll_call');
      return;
    }
    if (name === 'model_arena') {
      onNavigate('GLOBAL', 'model_arena');
      return;
    }
    if (name === 'optical_ingest') {
      onNavigate('GLOBAL', 'optical_ingest');
      return;
    }

    // If the module has a port, redirect to that port on MagicDNS/Tailscale
    if (tool.port) {
      const hostname = window.location.hostname;
      if (hostname.includes('taila01894.ts.net')) {
        window.open(`https://clio.taila01894.ts.net:${tool.port}/`, '_blank');
      } else {
        window.open(`http://${hostname}:${tool.port}/`, '_blank');
      }
    } else {
      // Fallback
      onNavigate('GLOBAL', tool.module_name);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="font-mono text-xs text-[#a855f7] uppercase tracking-widest animate-pulse">
          Querying Active Power Tools...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/10 rounded-2xl text-center">
        <p className="font-mono text-xs text-red-400 uppercase tracking-widest">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="text-[#a855f7] w-5 h-5" /> Tenant Power Tools
          </h2>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
            Provisioned platform plugins & utilities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => {
          const color = tool.color || '#a855f7';
          return (
            <div
              key={tool.module_name}
              className="relative p-6 rounded-2xl flex flex-col justify-between gap-6 transition-all group shadow-lg overflow-hidden backdrop-blur-md"
              style={{
                backgroundColor: `${color}08`,
                border: `1px solid ${color}22`,
                boxShadow: `0 0 20px ${color}08`,
              }}
            >
              {/* Highlight bar */}
              <div
                className="absolute top-0 left-0 w-full h-0.5 opacity-60"
                style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-black/40 border"
                    style={{ borderColor: `${color}33`, color }}
                  >
                    {tool.icon || '🛠️'}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 font-mono text-[9px] font-bold tracking-widest">
                    {tool.port && (
                      <span
                        className="px-2 py-0.5 rounded-full border bg-black/40"
                        style={{ color, borderColor: `${color}33` }}
                      >
                        PORT {tool.port}
                      </span>
                    )}
                    <span className="text-[#00FF88] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider group-hover:text-white/90">
                    {tool.display_name}
                  </h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {tool.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAccessTool(tool)}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer bg-white/5 text-white hover:bg-white/10"
                style={{ borderColor: `${color}44`, color }}
              >
                Access Tool <ArrowUpRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
