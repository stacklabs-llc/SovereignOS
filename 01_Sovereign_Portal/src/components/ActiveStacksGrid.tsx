import React, { useState, useEffect } from 'react';
import { Server, ArrowUpRight } from 'lucide-react';

interface ActiveStack {
  name: string;
  port: number;
  status: string;
  short_description: string;
  icon: string;
}

export default function ActiveStacksGrid() {
  const [stacks, setStacks] = useState<ActiveStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/stacks')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch active stacks');
        return res.json();
      })
      .then((data) => {
        setStacks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getStackColor = (name: string): string => {
    const normalized = name.toLowerCase();
    if (normalized.includes('fanstack')) return '#38bdf8'; // Sovereign Cyan
    if (normalized.includes('samtracker')) return '#fbbf24'; // Gold
    if (normalized.includes('catnip')) return '#00c878'; // WildSeed Green
    if (normalized.includes('aethervet') || normalized.includes('aether')) return '#a78bfa';
    if (normalized.includes('spite')) return '#f43f5e'; // Retro Magenta
    if (normalized.includes('anvil')) return '#d97706'; // Rusted Bronze
    if (normalized.includes('gonzas')) return '#f43f5e'; // Orange/Magenta
    return '#38bdf8';
  };

  const handleAccessStack = (port: number) => {
    const hostname = window.location.hostname;
    if (hostname.includes('taila01894.ts.net')) {
      window.open(`https://clio.taila01894.ts.net:${port}/`, '_blank');
    } else {
      window.open(`http://${hostname}:${port}/`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="font-mono text-xs text-[#38bdf8] uppercase tracking-widest animate-pulse">
          Querying Active CMDB Registry...
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
            <Server className="text-[#38bdf8] w-5 h-5" /> Active Mission Stacks
          </h2>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
            Dynamically queried from CMDB Registry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stacks.map((stack) => {
          const color = getStackColor(stack.name);
          return (
            <div
              key={stack.name}
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
                    style={{ borderColor: `${color}33` }}
                  >
                    {stack.icon || '🚀'}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 font-mono text-[9px] font-bold tracking-widest">
                    <span
                      className="px-2 py-0.5 rounded-full border bg-black/40"
                      style={{ color, borderColor: `${color}33` }}
                    >
                      PORT {stack.port}
                    </span>
                    <span className="text-[#00FF88] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse"></span>
                      {stack.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider group-hover:text-white/90">
                    {stack.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {stack.short_description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAccessStack(stack.port)}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer bg-white/5 text-white hover:bg-white/10"
                style={{ borderColor: `${color}44`, color }}
              >
                Access Stack <ArrowUpRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
