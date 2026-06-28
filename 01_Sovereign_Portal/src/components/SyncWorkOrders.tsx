import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SovereignTerminalModal } from './SovereignTerminal';

export default function SyncWorkOrders({ sidebarOpen }: { sidebarOpen: boolean }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  return (
    <div className="relative w-full mt-4">
      {/* Sync Button */}
      <button
        onClick={() => setIsTerminalOpen(true)}
        className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-300 group relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-white/70 hover:text-white"
        title="Sync Work Orders"
      >
        {/* Hover Highlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Reload/Sync Icon */}
        <RefreshCw 
          size={14} 
          className="text-white/50 group-hover:text-cyan-400 transition-colors duration-300" 
        />
        
        {sidebarOpen && (
          <span className="relative z-10 transition-colors duration-300">
            [ Sync Work Orders ]
          </span>
        )}
      </button>

      <SovereignTerminalModal 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
      />
    </div>
  );
}
