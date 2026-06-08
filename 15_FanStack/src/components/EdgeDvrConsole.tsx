import React, { useState, useEffect } from 'react';
import { AlertTriangle, Disc, Square, Camera } from 'lucide-react';

export default function EdgeDvrConsole() {
  const [osTheme, setOsTheme] = useState(() => localStorage.getItem('sovereign_theme') || 'mac');
  
  useEffect(() => {
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'mac');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  const isHomeTheme = osTheme === 'sovereign-home';

  // Camera inventory — last scanned 2026-04-26
  const nodes = [
      { id: 'clio',   label: '🎬 Clio (.183) — Primary Media Server (HDMI)',    ip: '192.168.1.183' },
      { id: 'local',  label: '🎥 Argo Node — IC800 1080P HD',       ip: '0' },
      { id: 'hobbes', label: '📡 Hobbes (.114) — icspring cam',     ip: '100.88.5.122' },
      { id: 'calvin', label: '📷 Calvin (.115) — NexiGo N60 FHD',  ip: '192.168.1.115' },
      { id: 'grogu',  label: '🛏️ Grogu (.117) — Bedroom TV Node',   ip: '192.168.1.117' },
  ];
  const [activeNode, setActiveNode] = useState(nodes[0]); // Default to Clio
  const [status, setStatus] = useState<{state: string, color: string, message: string}>({
      state: 'IDLE',
      color: isHomeTheme ? '#38bdf8' : '#45a29e',
      message: 'Monitoring Feed'
  });

  const handleNodeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const node = nodes.find(n => n.id === e.target.value);
      if (node) {
          setActiveNode(node);
          setStatus({ state: 'CONNECTING', color: '#f2a900', message: `Switching feed to ${node.label}...` });
          try {
              await fetch('/dvr-proxy/set_node', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ip: node.ip })
              });
              setStatus({ state: 'IDLE', color: isHomeTheme ? '#38bdf8' : '#45a29e', message: 'Monitoring Feed' });
          } catch (error) {
              console.error(error);
              setStatus({ state: 'ERROR', color: '#ff0033', message: 'Failed to switch node' });
          }
      }
  };

  const startRecording = async () => {
      setStatus({ state: 'RECORDING', color: '#ff0033', message: 'CMDB Sync Active' });
      try {
          await fetch('/dvr-proxy/start');
      } catch (e) {
          console.error(e);
          setStatus({ state: 'ERROR', color: '#ff0033', message: 'Failed to start recording' });
      }
  };

  const stopRecording = async () => {
      setStatus({ state: 'FINALIZING', color: '#f2a900', message: 'Finalizing Asset...' });
      try {
          const res = await fetch('/dvr-proxy/stop');
          const data = await res.json();
          setStatus({ state: 'SAVED', color: isHomeTheme ? '#38bdf8' : '#66fcf1', message: `Asset saved to: ${data.file}` });
      } catch (e) {
          console.error(e);
          setStatus({ state: 'ERROR', color: '#ff0033', message: 'Failed to stop recording' });
      }
  };

  const feedUrl = `/dvr-proxy/video_feed?t=${activeNode.ip}`;

  // Theme variables
  const bgClass = isHomeTheme ? "bg-[#f8fafc] text-[#334155]" : "bg-[#0b0c10] text-[#c5c6c7]";
  const titleClass = isHomeTheme ? "text-[#38bdf8] drop-shadow-sm font-bold" : "text-[#66fcf1] drop-shadow-lg font-black uppercase tracking-[0.15em]";
  const subTitleClass = isHomeTheme ? "text-[#64748b] text-sm mb-6" : "text-[#45a29e] italic mb-6 text-[14px]";
  const headerBoxClass = isHomeTheme ? "bg-white border-gray-200 shadow-sm" : "bg-[#1f2833] border-white/10";
  const selectClass = isHomeTheme ? "bg-[#f1f5f9] text-[#334155] border-gray-300 focus:border-[#38bdf8]" : "bg-black text-[#66fcf1] border-[#66fcf1]/30 hover:border-[#66fcf1]";
  const feedBorderClass = isHomeTheme ? "border-gray-300 shadow-md bg-black" : "border-[#1f2833]  bg-black";
  const statusBoxClass = isHomeTheme ? "bg-white border-gray-200 shadow-sm" : "bg-[#1f2833] border-white/5";

  return (
    <div className={`h-[85vh] w-full flex flex-col items-center p-8 font-['Segoe_UI',sans-serif] overflow-y-auto ${bgClass}`}>
      <h1 className={`text-3xl mb-2 text-center ${titleClass}`}>
          Omega Gate: Live Edge DVR
      </h1>
      <div className={subTitleClass}>
          ITSM Architecture Protocol // M.A.R.D. Engine Pre-Cog Feed
      </div>
      
      <div className={`w-full max-w-[900px] mb-4 flex items-center justify-between p-4 rounded-lg border ${headerBoxClass}`}>
          <div className="flex items-center gap-3">
              <Camera className={`w-5 h-5 ${isHomeTheme ? 'text-[#38bdf8]' : 'text-[#66fcf1]'}`} />
              <span className={`font-mono uppercase tracking-wider text-sm ${isHomeTheme ? 'text-[#334155]' : 'text-white'}`}>Active Feed Source:</span>
          </div>
          <select 
              className={`font-mono text-sm py-2 px-4 rounded outline-none cursor-pointer transition-colors border ${selectClass}`}
              value={activeNode.id}
              onChange={handleNodeChange}
          >
              {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
              ))}
          </select>
      </div>
      
      <div className={`border-[3px] rounded-lg w-full max-w-[900px] overflow-hidden relative aspect-video flex items-center justify-center group mb-8 ${feedBorderClass}`}>
          <img 
              className="w-full h-full object-contain" 
              src={feedUrl} 
              alt="Live Camera Feed Loading... (If broken, camera is locked or daemon down)"
              onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
          />
          <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
              <div className="font-mono text-center">
                  <p className="text-xl text-red-500 font-bold mb-2">FEED DISCONNECTED</p>
                  <p className="text-sm text-gray-400">Local DVR Daemon (Port 5051) is unreachable.</p>
              </div>
          </div>
      </div>

      <div className="flex gap-6 mb-8 w-full max-w-[900px] justify-center">
          <button 
              onClick={startRecording}
              className="flex-1 max-w-[300px] flex items-center justify-center gap-2 py-4 px-8 bg-[#ff0033] hover:bg-[#cc0000] text-white font-bold text-xl uppercase rounded-md  hover:scale-105 transition-all border-none"
          >
              <Disc className="w-6 h-6 fill-white" /> Start Capture
          </button>
          
          <button 
              onClick={stopRecording}
              className={`flex-1 max-w-[300px] flex items-center justify-center gap-2 py-4 px-8 font-bold text-xl uppercase rounded-md hover:scale-105 transition-all border-none ${isHomeTheme ? 'bg-[#38bdf8] hover:bg-[#0ea5e9] text-white ' : 'bg-[#45a29e] hover:bg-[#66fcf1] text-[#0b0c10] '}`}
          >
              <Square className={`w-6 h-6 ${isHomeTheme ? 'fill-white' : 'fill-current'}`} /> Stop Capture
          </button>
      </div>
      
      <div className={`text-xl font-bold text-center p-4 rounded w-full max-w-[900px] border flex flex-col items-center gap-2 ${statusBoxClass}`}>
          <span style={{ color: status.color }} className="tracking-wide">
              State: {status.state}
          </span>
          <span className={`text-sm font-mono font-normal ${isHomeTheme ? 'text-[#64748b]' : 'text-gray-300'}`}>
              {status.message}
          </span>
      </div>
    </div>
  );
}
