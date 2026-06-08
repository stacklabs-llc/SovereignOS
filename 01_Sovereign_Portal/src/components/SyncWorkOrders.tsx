import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SyncWorkOrders({ sidebarOpen }: { sidebarOpen: boolean }) {
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setToast(null);

    const token = localStorage.getItem('sovereign_session_token');

    try {
      const res = await fetch('/api/system/onboard/sync-work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Sync failed');
      }

      const data = await res.json();
      setToast({
        message: `Successfully synced and staged ${data.staged_count || 0} work orders.`,
        type: 'success'
      });
    } catch (e: any) {
      console.error(e);
      setToast({
        message: e.message || 'Failed to complete work order synchronization.',
        type: 'error'
      });
    } finally {
      setSyncing(false);
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }
  };

  return (
    <div className="relative w-full mt-4">
      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${
          syncing 
            ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400' 
            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-white/70 hover:text-white'
        }`}
        title="Sync Work Orders"
      >
        {/* Hover Highlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Reload/Sync Icon */}
        <RefreshCw 
          size={14} 
          className={`shrink-0 ${syncing ? 'animate-spin text-cyan-400' : 'text-white/50 group-hover:text-cyan-400 transition-colors duration-300'}`} 
        />
        
        {sidebarOpen && (
          <span className="relative z-10 transition-colors duration-300">
            {syncing ? 'Syncing...' : '[ Sync Work Orders ]'}
          </span>
        )}
      </button>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl max-w-sm"
            style={{
              background: toast.type === 'success' 
                ? 'rgba(11, 22, 28, 0.9)' 
                : 'rgba(28, 11, 11, 0.9)',
              borderColor: toast.type === 'success' 
                ? 'rgba(0, 212, 255, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)',
              boxShadow: toast.type === 'success'
                ? '0 10px 30px -10px rgba(0, 212, 255, 0.2)'
                : '0 10px 30px -10px rgba(239, 68, 68, 0.2)'
            }}
          >
            {/* Status indicator indicator dot */}
            <div 
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'success' ? 'bg-cyan-400 animate-pulse' : 'bg-red-500 animate-pulse'
              }`} 
            />
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                {toast.type === 'success' ? 'System Sync complete' : 'System Sync failed'}
              </span>
              <p className="text-xs text-white/90 font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            {/* Dismiss button */}
            <button 
              onClick={() => setToast(null)}
              className="ml-auto pl-2 text-white/30 hover:text-white/60 transition-colors text-[10px] font-mono"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
