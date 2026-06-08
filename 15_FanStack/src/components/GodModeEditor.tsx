import React, { useState } from 'react';
import { AlertTriangle, Send, Code } from 'lucide-react';

const DEFAULT_PAYLOAD = `{
  "source": "UHF_STUDIO_GOD_MODE",
  "target_nodes": ["ALL_ACTIVE_YAPPERS"],
  "new_state": "REALITY_COLLAPSE",
  "constraints": "⚠🚨 PETCO PARK HAS LOST ALL POWER. THE STADIUM IS PITCH BLACK. RESPOND IN RAW PANIC. 🚨⚠",
  "intensity_multiplier": "BOGGS_LEVEL_10",
  "override_safety": true
}`;

export default function GodModeEditor() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [status, setStatus] = useState<'IDLE' | 'EXECUTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRestore = async () => {
    setStatus('EXECUTING');
    setErrorMsg('');
    try {
      const res = await fetch('http://192.168.1.183:5055/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           source: "UHF_STUDIO_GOD_MODE",
           target_nodes: ["ALL_ACTIVE_YAPPERS"],
           new_state: "RESTORE_BASELINE"
        })
      });
      if (!res.ok && res.status !== 0) throw new Error(`Restore Denied: ${res.statusText}`);
      setStatus('SUCCESS');
      setTimeout(() => setStatus('IDLE'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'RESTORE FAILED');
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 4000);
    }
  };

  const handleExecute = async () => {
    setStatus('EXECUTING');
    setErrorMsg('');
    try {
      const parsed = JSON.parse(payload);
      
      const res = await fetch('http://192.168.1.183:5055/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      
      if (!res.ok && res.status !== 0) {
        throw new Error(`Admin Override Denied: ${res.statusText}`);
      }
      
      setStatus('SUCCESS');
      setTimeout(() => setStatus('IDLE'), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'JSON Parse Error or Connection Failed');
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 4000);
    }
  };

  return (
    <div className="flex flex-col h-full vm-panel-glass p-5 font-['Inter'] relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <Code className="w-5 h-5 text-[#38bdf8] drop-" />
        <h2 className="text-[#38bdf8] drop-shadow-lg vm-header">God-Mode Injector</h2>
        <span className="ml-auto text-xs text-[#38bdf8]/70 font-['Outfit'] font-bold tracking-widest uppercase">Port 5055</span>
      </div>
      
      {status === 'SUCCESS' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#38bdf8] text-[#0f1115] vm-header py-2 px-6 rounded-full  z-50 animate-pulse">
          REALITY COLLAPSE INJECTED
        </div>
      )}
      
      {status === 'ERROR' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white vm-header py-2 px-6 rounded-full border border-red-400  z-50">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 relative flex flex-col min-h-[200px] bg-black/40 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
        <textarea 
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="flex-1 w-full h-full bg-transparent p-4 text-[#38bdf8] font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#38bdf8]/50 rounded-lg resize-none overflow-auto"
          spellCheck="false"
        />
      </div>

      <div className="flex gap-4 mt-5">
        <button 
          onClick={handleExecute}
          disabled={status === 'EXECUTING'}
          className="flex-1 bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#0f1115] py-4 rounded-lg   vm-header transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {status === 'EXECUTING' ? 'EXECUTING...' : 'EXECUTE JSON PAYLOAD'}
        </button>

        <button 
          onClick={handleRestore}
          disabled={status === 'EXECUTING'}
          className="flex-1 bg-[#0f1115] border border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white py-4 rounded-lg   vm-header transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          RESTORE REALITY (BASELINE)
        </button>
      </div>
    </div>
  );
}
