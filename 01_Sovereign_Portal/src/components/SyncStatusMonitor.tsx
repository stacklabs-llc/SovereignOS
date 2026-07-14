import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Terminal, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

export default function SyncStatusMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/sync/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status || 'idle');
        setLastSuccess(data.last_success);
        setLogs(data.logs || []);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleForceSync = async () => {
    setIsTriggering(true);
    setStatus('syncing');
    try {
      const res = await fetch('/api/system/sync/trigger', { method: 'POST' });
      if (res.ok) {
        setTimeout(() => {
          setIsTriggering(false);
          fetchStatus();
        }, 1500);
      } else {
        setIsTriggering(false);
        setStatus('error');
      }
    } catch (err) {
      setIsTriggering(false);
      setStatus('error');
    }
  };

  // Format timestamp for display
  const formatTime = (tsStr: string | null) => {
    if (!tsStr) return 'N/A';
    try {
      const date = new Date(tsStr + 'Z');
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return tsStr;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse';
      case 'error':
        return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-ping';
      case 'success':
      default:
        return 'bg-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.6)]';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      case 'success':
      default:
        return 'Live Sync Active';
    }
  };

  return (
    <div className="relative font-mono" ref={popoverRef}>
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg cursor-pointer"
      >
        <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-white/85">{getStatusText()}</span>
        {lastSuccess && status === 'success' && (
          <span className="text-slate-500 text-[9px] lowercase font-normal">
            ({formatTime(lastSuccess)})
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-80 backdrop-blur-md bg-slate-950/95 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-[#00b4d8]" /> Ingestion Daemon Monitor
            </span>
            <span className="text-[9px] text-slate-600">v1.1</span>
          </div>

          {/* Sync Stats Info */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-2 flex flex-col">
              <span className="text-slate-500 text-[8px] uppercase">State</span>
              <span className={`font-bold uppercase ${status === 'error' ? 'text-red-400' : status === 'syncing' ? 'text-amber-400' : 'text-[#00b4d8]'}`}>
                {status}
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-2 flex flex-col">
              <span className="text-slate-500 text-[8px] uppercase">Last Success</span>
              <span className="text-white font-bold">
                {formatTime(lastSuccess)}
              </span>
            </div>
          </div>

          {/* scrolling feed of logs */}
          <div className="bg-black/80 border border-slate-800/80 rounded-lg p-2 h-36 overflow-y-auto flex flex-col gap-1 text-[9px]">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">No sync event logs available.</span>
            ) : (
              logs.map((log, idx) => {
                let colorClass = 'text-slate-300';
                if (log.includes('[error]') || log.includes('[ERROR]')) colorClass = 'text-red-400';
                else if (log.includes('[syncing]') || log.includes('[SYNCING]')) colorClass = 'text-amber-400';
                else if (log.includes('[success]') || log.includes('[SUCCESS]')) colorClass = 'text-emerald-400';
                return (
                  <div key={idx} className={`leading-normal ${colorClass} break-words`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>

          {/* Force Sync button */}
          <button
            onClick={handleForceSync}
            disabled={status === 'syncing' || isTriggering}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
              status === 'syncing' || isTriggering
                ? 'bg-slate-900 border-slate-850 text-slate-500'
                : 'bg-[#00b4d8] border-[#00b4d8] text-slate-950 hover:bg-[#00b4d8]/90 shadow-[0_0_10px_rgba(0,180,216,0.3)] hover:shadow-[0_0_15px_rgba(0,180,216,0.5)]'
            }`}
          >
            <RefreshCw size={12} className={status === 'syncing' || isTriggering ? 'animate-spin' : ''} />
            {status === 'syncing' || isTriggering ? 'Syncing...' : 'Force Sync Now'}
          </button>
        </div>
      )}
    </div>
  );
}
