import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Cpu, FileText, RefreshCw, Sparkles, UserCheck, Zap, Compass, Tag, CheckCircle, ShieldAlert } from 'lucide-react';

interface BacklogAsset {
  sys_id: string;
  advocate: string;
  expression: string;
  file_path: string;
  sha256: string;
  sys_created_on: string;
}

interface OmegaCandidate {
  index: number;
  filename: string;
  url: string;
  metrics: {
    compliance: number;
    consistency: number;
    resolution: string;
    seed: number;
  };
}

interface OmegaBatch {
  sys_id: string;
  ticket_id: string;
  trigger_event: string;
  timestamp: string;
  priority: string;
  anchor_image_uri: string;
  continuity_weight: number;
  batch_count: number;
  generation_engine: string;
  model_backbone: string;
  base_prompt: string;
  style_override: string;
  text_overlay_draft: string;
  require_approval: boolean;
  destination_targets: string[];
  candidates: OmegaCandidate[];
  status: string;
  created_at: string;
}

export default function AssetBacklog() {
  const [activeTab, setActiveTab] = useState<'avatar' | 'omega'>('avatar');
  const [backlog, setBacklog] = useState<BacklogAsset[]>([]);
  const [omegaBacklog, setOmegaBacklog] = useState<OmegaBatch[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [omegaLoading, setOmegaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdvocates, setSelectedAdvocates] = useState<Record<string, string>>({});
  const [personas, setPersonas] = useState<string[]>(['jake_taylor', 'dot', 'barf', 'tomahawk', 'phanatic', 'redbird']);
  
  // Notification alert card & Broadcast success banner
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [seenBatchIds, setSeenBatchIds] = useState<Set<string>>(new Set());

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
      
      const initialMap: Record<string, string> = {};
      data.forEach((item: BacklogAsset) => {
        initialMap[item.sys_id] = 'jake_taylor';
      });
      setSelectedAdvocates(prev => ({ ...initialMap, ...prev }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOmegaBacklog = async (isFirst = false) => {
    if (isFirst) setOmegaLoading(true);
    try {
      const res = await fetch('/api/v1/omega-gate/backlog');
      if (res.ok) {
        const data: OmegaBatch[] = await res.json();
        setOmegaBacklog(data);
        
        // Detect new pre-render batches for real-time notifications
        if (!isFirst && data.length > 0) {
          const newBatches = data.filter(batch => !seenBatchIds.has(batch.sys_id));
          if (newBatches.length > 0) {
            // Pick the latest new batch and show notification
            const latest = newBatches[0];
            setActiveNotification(`TMI Event: Asset Batch Pre-Rendered [${latest.trigger_event}]`);
            // Automatically clear notification after 8 seconds
            setTimeout(() => {
              setActiveNotification(null);
            }, 8000);
          }
        }
        
        // Update seen IDs
        const ids = new Set(data.map(b => b.sys_id));
        setSeenBatchIds(prev => new Set([...prev, ...ids]));
      }
    } catch (e) {
      console.error('Failed to fetch Omega backlog:', e);
    } finally {
      if (isFirst) setOmegaLoading(false);
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

  // Run initial loading
  useEffect(() => {
    fetchBacklog();
    fetchOmegaBacklog(true);
    fetchLogs();
    
    // Polling intervals for real-time updates
    const intervalLogs = setInterval(fetchLogs, 5000);
    const intervalOmega = setInterval(() => fetchOmegaBacklog(false), 5000);
    
    return () => {
      clearInterval(intervalLogs);
      clearInterval(intervalOmega);
    };
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

  // Omega Gatekeeper Console handlers
  const handleOmegaApprove = async (sysId: string, candidateIndex: number) => {
    try {
      const res = await fetch('/api/v1/omega-gate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sys_id: sysId, candidate_index: candidateIndex })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to approve candidate');
      }
      const data = await res.json();
      
      // Remove from view
      setOmegaBacklog(prev => prev.filter(b => b.sys_id !== sysId));
      
      // Trigger glowing success banner
      setSuccessBanner(data.message || '[Asset Broadcasted Successfully to Targeted Distribution Channels]');
      setTimeout(() => {
        setSuccessBanner(null);
      }, 7000);
      
    } catch (e: any) {
      alert(`Approval Error: ${e.message}`);
    }
  };

  const handleOmegaDiscard = async (sysId: string) => {
    if (!confirm('Are you sure you want to discard this entire candidate pre-render batch?')) return;
    try {
      const res = await fetch('/api/v1/omega-gate/discard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sys_id: sysId })
      });
      if (!res.ok) throw new Error('Discard failed');
      setOmegaBacklog(prev => prev.filter(b => b.sys_id !== sysId));
    } catch (e: any) {
      alert(`Discard Error: ${e.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 text-white">
      
      {/* Real-time TMI Notification Alert Card */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full bg-cyan-950/80 border-2 border-cyan-500/50 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl animate-pulse">
                <Zap className="text-cyan-400" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide text-cyan-300">REALTIME TMI INGRESS EVENT</h4>
                <p className="text-xs text-white/80 mt-0.5 font-mono">{activeNotification}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="text-xs text-cyan-400 hover:text-cyan-200 uppercase font-bold tracking-widest font-mono"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Success Banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-emerald-950/80 border-2 border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md text-emerald-300 font-bold font-mono text-sm justify-center"
          >
            <CheckCircle size={20} className="text-emerald-400 animate-bounce" />
            <span>{successBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
        
        {/* Navigation & Refresh Actions */}
        <div className="flex flex-wrap gap-3 z-10">
          <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('avatar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-mono ${
                activeTab === 'avatar' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Avatar Backlog
            </button>
            <button
              onClick={() => setActiveTab('omega')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-mono flex items-center gap-1 ${
                activeTab === 'omega' 
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap size={12} /> Omega Gatekeeper ({omegaBacklog.length})
            </button>
          </div>
          
          {activeTab === 'avatar' ? (
            <>
              <button
                onClick={triggerVisionPipeline}
                disabled={loading}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
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
            </>
          ) : (
            <button
              onClick={() => fetchOmegaBacklog(true)}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} className={omegaLoading ? 'animate-spin' : ''} />
              Refresh Backlog
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* TAB 1: Avatar Ingest Backlog */}
          {activeTab === 'avatar' && (
            <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-2xl">
              <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold mb-4">
                Pending Avatar Candidates ({backlog.length})
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
                        <div className="w-full aspect-square rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={item.file_path}
                            alt={item.advocate}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
                            {item.sys_id.substring(0, 8)}
                          </div>
                        </div>

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
          )}

          {/* TAB 2: Omega Key Gatekeeper Console */}
          {activeTab === 'omega' && (
            <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-fuchsia-400 font-mono font-bold mb-1 flex items-center gap-1.5">
                  <Zap size={14} /> Omega Key Gatekeeper Backlog ({omegaBacklog.length})
                </h3>
                <p className="text-[11px] text-white/50 font-mono">Validate automated media assets before publishing to mesh networks.</p>
              </div>

              {omegaLoading && omegaBacklog.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-white/40 font-mono text-xs">
                  Connecting to Omega Key staging area...
                </div>
              ) : omegaBacklog.length === 0 ? (
                <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
                  <CheckCircle size={48} className="text-emerald-500/20 mb-4 animate-pulse" />
                  <p className="text-sm font-semibold text-white/70">Omega Backlog Clear.</p>
                  <p className="text-xs text-white/40 font-mono mt-1 max-w-sm">
                    All automatically triggered pre-render events have been validated and broadcasted.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {omegaBacklog.map((batch) => (
                    <div 
                      key={batch.sys_id}
                      className="border border-white/10 rounded-2xl bg-black/30 p-5 flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Decorative corner tag */}
                      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-fuchsia-500/10 to-transparent pointer-events-none" />
                      
                      {/* Batch Metadata Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="px-2 py-0.5 bg-fuchsia-950/80 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-[9px] font-bold uppercase rounded w-max">
                            {batch.trigger_event}
                          </span>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {batch.base_prompt}
                          </h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-white/60 font-mono">
                            <span className="flex items-center gap-1"><Tag size={12} className="text-cyan-400" /> Ticket ID: {batch.ticket_id}</span>
                            <span className="flex items-center gap-1"><Compass size={12} className="text-cyan-400" /> Style Override: {batch.style_override}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 font-mono text-[10px] text-white/40">
                          <span>Timestamp: {batch.timestamp}</span>
                          <span>Backbone: {batch.model_backbone} ({batch.generation_engine})</span>
                          <span className="text-[11px] text-cyan-300">Targets: {batch.destination_targets.join(', ')}</span>
                          <button
                            onClick={() => handleOmegaDiscard(batch.sys_id)}
                            className="mt-2 px-3 py-1 bg-red-950/20 border border-red-500/30 hover:bg-red-600 hover:text-white hover:border-red-500 text-red-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
                          >
                            <Trash2 size={10} /> Discard Batch
                          </button>
                        </div>
                      </div>

                      {/* 5 Candidate Grid with Metrics & Glowing Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {batch.candidates.map((candidate) => (
                          <div 
                            key={candidate.index}
                            className="bg-[#1e293b]/40 border border-white/10 rounded-xl p-3 flex flex-col gap-3 hover:border-fuchsia-500/30 transition-all group"
                          >
                            {/* Low-res Thumbnail */}
                            <div className="w-full aspect-square rounded-lg bg-black/60 border border-white/5 overflow-hidden relative">
                              <img 
                                src={candidate.url} 
                                alt={`Candidate Var ${candidate.index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-bold text-fuchsia-300 border border-fuchsia-500/30">
                                VAR {candidate.index + 1}
                              </div>
                            </div>

                            {/* Style Metrics */}
                            <div className="flex flex-col gap-1 text-[10px] font-mono text-white/70 bg-black/40 border border-white/5 rounded-lg p-2">
                              <div className="flex justify-between">
                                <span className="text-white/40">Compliance:</span>
                                <span className="text-emerald-400 font-bold">{candidate.metrics.compliance}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/40">Consistency:</span>
                                <span className="text-cyan-300">{candidate.metrics.consistency}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/40">Resolution:</span>
                                <span>{candidate.metrics.resolution}</span>
                              </div>
                              <div className="flex justify-between border-t border-white/5 pt-0.5 mt-0.5">
                                <span className="text-white/40">Seed:</span>
                                <span className="text-fuchsia-400">{candidate.metrics.seed}</span>
                              </div>
                            </div>

                            {/* Glowing Approve & Blast Button */}
                            <button
                              onClick={() => handleOmegaApprove(batch.sys_id, candidate.index)}
                              className="w-full py-1.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            >
                              <Check size={10} /> Approve & Blast
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
