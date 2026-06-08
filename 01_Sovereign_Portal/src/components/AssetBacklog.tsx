import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Cpu, FileText, RefreshCw, Sparkles, UserCheck } from 'lucide-react';

interface BacklogAsset {
  sys_id: string;
  advocate: string;
  expression: string;
  file_path: string;
  sha256: string;
  sys_created_on: string;
}

export default function AssetBacklog() {
  const [backlog, setBacklog] = useState<BacklogAsset[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdvocates, setSelectedAdvocates] = useState<Record<string, string>>({});
  const [personas, setPersonas] = useState<string[]>(['jake_taylor', 'dot', 'barf', 'tomahawk', 'phanatic', 'redbird']);

  const token = localStorage.getItem('sovereign_session_token');

  const fetchBacklog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hailo/backlog', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch backlog');
      const data = await res.json();
      setBacklog(data);
      
      // Prefill mapping with default target
      const initialMap: Record<string, string> = {};
      data.forEach((item: BacklogAsset) => {
        initialMap[item.sys_id] = 'jake_taylor'; // default to jake_taylor as per UAT drops
      });
      setSelectedAdvocates(prev => ({ ...initialMap, ...prev }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/hailo/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  useEffect(() => {
    fetchBacklog();
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (sysId: string) => {
    const advocateName = selectedAdvocates[sysId] || 'jake_taylor';
    try {
      const res = await fetch('/api/hailo/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sys_id: sysId, advocate: advocateName })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Approval failed');
      }
      setBacklog(prev => prev.filter(item => item.sys_id !== sysId));
      fetchLogs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDiscard = async (sysId: string) => {
    if (!confirm('Are you sure you want to discard this candidate asset?')) return;
    try {
      const res = await fetch('/api/hailo/discard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sys_id: sysId })
      });
      if (!res.ok) throw new Error('Discard failed');
      setBacklog(prev => prev.filter(item => item.sys_id !== sysId));
      fetchLogs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const triggerVisionPipeline = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hailo/run_classifier', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to run pipeline');
      await new Promise(r => setTimeout(r, 2000));
      fetchBacklog();
      fetchLogs();
    } catch (e: any) {
      alert(`Error running vision pipeline: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full p-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/60 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-fuchsia-500/5 pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Cpu size={24} className="text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-white flex items-center gap-2">
              Hailo-10H Vision backroom <Sparkles size={16} className="text-cyan-400" />
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1">PCIe Lane 1 Ingest // Staged Avatar Slicing Pipeline</p>
          </div>
        </div>
        <div className="flex gap-3 z-10">
          <button
            onClick={triggerVisionPipeline}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Re-run Ingestion
          </button>
          <button
            onClick={fetchBacklog}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            Refresh Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Backlog Gallery Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-2xl">
            <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold mb-4">
              Pending Candidates ({backlog.length})
            </h3>
            
            {loading && backlog.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-white/40 font-mono text-xs">
                Scanning hardware candidates...
              </div>
            ) : backlog.length === 0 ? (
              <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
                <Cpu size={48} className="text-white/20 mb-4" />
                <p className="text-sm font-semibold text-white/70">No pending candidates found in backlog.</p>
                <p className="text-xs text-white/40 font-mono mt-1 max-w-sm">
                  Run the ingestion pipeline or place a new avatar sheet drop at /home/james/sovereign_inbox/pilot_drops/jake_taylor_3x3_avatar_sheet.jpg
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence>
                  {backlog.map((item) => (
                    <motion.div
                      key={item.sys_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300"
                    >
                      {/* Image Viewer */}
                      <div className="w-full aspect-square rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
                        <img
                          src={item.file_path}
                          alt={item.advocate}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // fallback just in case path needs full prefix
                            (e.target as any).src = item.file_path;
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
                          {item.sys_id.substring(0, 8)}
                        </div>
                      </div>

                      {/* Info & Form */}
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Candidate ID</span>
                          <span className="text-xs text-white font-mono font-semibold truncate">{item.advocate}</span>
                        </div>
                        {item.expression.includes(':') && (
                          <div className="flex flex-col mt-1">
                            <span className="text-[10px] text-cyan-400/80 uppercase tracking-widest font-mono">AI tags</span>
                            <span className="text-[11px] text-white/70 font-mono truncate" title={item.expression.split(':')[1].trim()}>
                              {item.expression.split(':')[1].trim()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-1 mt-2">
                          <label className="text-[9px] text-white/40 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                            <UserCheck size={10} /> Target Persona
                          </label>
                          <select
                            value={selectedAdvocates[item.sys_id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedAdvocates(prev => ({ ...prev, [item.sys_id]: val }));
                            }}
                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                          >
                            {personas.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="custom">-- Custom Name --</option>
                          </select>
                          {selectedAdvocates[item.sys_id] === 'custom' && (
                            <input
                              type="text"
                              placeholder="Type custom username..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedAdvocates(prev => ({ ...prev, [item.sys_id]: val }));
                              }}
                              className="mt-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                            />
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleApprove(item.sys_id)}
                          className="flex-1 py-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleDiscard(item.sys_id)}
                          className="px-3 py-2 bg-red-950/20 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 hover:border-red-500 font-bold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Live log feed column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-[#111827]/60 border border-white/10 p-5 rounded-3xl backdrop-blur-xl shadow-2xl h-[500px] flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-fuchsia-400 font-mono font-bold mb-3 flex items-center gap-2">
              <FileText size={14} /> Ingestion Logs
            </h3>
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-white/70 overflow-y-auto space-y-2.5 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-white/20 italic">No log activity recorded.</div>
              ) : (
                logs.map((log, index) => {
                  let colorClass = 'text-white/60';
                  if (log.includes('[ERROR]')) colorClass = 'text-red-400';
                  else if (log.includes('[HAILO-10H]')) colorClass = 'text-cyan-300';
                  else if (log.includes('Successfully')) colorClass = 'text-emerald-400';
                  
                  return (
                    <div key={index} className={`border-b border-white/5 pb-1 ${colorClass}`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
