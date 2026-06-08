import React from 'react';
import FanStackChat from './FanStackChat';

const UhfStudio: React.FC = () => {
  return (
    <div className="h-screen w-full flex bg-[#0f1115] overflow-hidden">
      {/* LEFT PANE: COMMAND GATEWAY */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        {/* TOP: SAVANT QUERY BLOCK */}
        <div className="flex-1 border-b border-slate-800 p-4 overflow-hidden relative">
          <div className="absolute top-2 left-2 flex items-center gap-2 opacity-30">
            <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Savant_Query_v0.73</span>
          </div>
          <div className="h-full w-full rounded border border-dashed border-slate-800 flex items-center justify-center">
            <span className="text-slate-700 font-mono text-xs italic tracking-widest uppercase">Null_Payload</span>
          </div>
        </div>

        {/* BOTTOM: GOD MODE INJECTOR */}
        <div className="flex-1 p-4 overflow-hidden relative">
          <div className="absolute top-2 left-2 flex items-center gap-2 opacity-30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">God_Mode_Injector</span>
          </div>
          <div className="h-full w-full rounded border border-dashed border-slate-800 flex items-center justify-center">
            <span className="text-slate-700 font-mono text-xs italic tracking-widest uppercase">Awaiting_Telemetry</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: OBSERVATION DECK */}
      <div className="flex-1 h-full">
        <FanStackChat />
      </div>
    </div>
  );
};

export default UhfStudio;
