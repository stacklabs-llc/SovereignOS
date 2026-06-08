import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Radio, ShieldAlert, Cpu, Activity, Hash, Server, Wifi, Upload } from 'lucide-react';

// Injected Theme Styles for Scrollbars and Fonts
const themeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

  .vesper-scroll::-webkit-scrollbar { width: 6px; }
  .vesper-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
  .vesper-scroll::-webkit-scrollbar-thumb { background: rgba(0, 242, 254, 0.3); border-radius: 10px; }
  .vesper-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 242, 254, 0.6); }

  .vancouver-scroll::-webkit-scrollbar { width: 6px; }
  .vancouver-scroll::-webkit-scrollbar-track { background: #0A0705; border-left: 1px solid #1e293b; }
  .vancouver-scroll::-webkit-scrollbar-thumb { background: #334155; border: 1px solid #1e293b; }
  .vancouver-scroll::-webkit-scrollbar-thumb:hover { background: #38bdf8; }
`;

const INITIAL_DATA = [
  { id: 1, hash: "0x8A2F", sender: "wardy", timestamp: "15:11:00", text: "Just finished my hot dog, ready for first pitch. Folks, it's pre-game! Babe Ruth pitched against the Mets.", type: "normal" },
  { id: 2, hash: "0x9B1C", sender: "the_chicken_man_az", timestamp: "15:11:04", text: "PRE-GAME STATUS CHANGE OH GOD THE 410 START IS ALREADY DESTROYING THE COSMIC ALIGNMENT I HAD TO EAT MY CHICKEN AT ONE THIRTY LIKE SOME KIND OF SACRIFICE TO THE BASEBALL GODS THIS IS WORSE THAN THE RICKY NOLASCO DOOR INCIDENT", type: "unhinged" },
  { id: 3, hash: "0x2C4E", sender: "burnes_notice", timestamp: "15:13:50", text: "Wind chill definitely impacting early spin rate projections tonight. Grip stability will be paramount.", type: "analytical" },
  { id: 4, hash: "0xSYS9", sender: "dot", timestamp: "15:18:52", text: "The wind has shifted; my probability models require a slight adjustment. Still waiting on the lineup card to run my final projections.", type: "system" },
  { id: 5, hash: "0x4F11", sender: "barf", timestamp: "15:52:30", text: "Warmup. Just hope this isn't another Armando Benitez situation. I can already feel the phantom limb pain from a thousand bullpen implosions hitting me. This is exactly how they set up the goat sacrifice, I'm telling you!", type: "doomer" },
  { id: 6, hash: "0x7A99", sender: "the_chicken_man_az", timestamp: "16:06:19", text: "GALLEN IS WARMING UP THE UNIVERSE IS OUT OF SYNC MY PRE-GAME CHICKEN WAS DIGESTED THREE HOURS EARLY AT 107 DEGREES DO THEY EVEN UNDERSTAND THE HARMONIC ALIGNMENT IF HE WALKS THE LEAD-OFF BATTER ITS ON THEM I CANNOT BREATHE", type: "unhinged" },
  { id: 7, hash: "0x1E22", sender: "uncle_stevie_stan", timestamp: "16:15:34", text: "Just a run. Stevie's got us. We'll buy two more back easy! Perfect baseball weather, just how we like it in Queens.", type: "normal" },
];

const VesperMessage = ({ msg }: { key?: any, msg: any }) => {
  const isUnhinged = msg.type === 'unhinged' || msg.type === 'doomer';
  
  return (
    <div className="mb-4 pb-4 border-b border-cyan-900/20 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`font-['Outfit'] font-bold text-sm tracking-wide ${isUnhinged ? 'text-[#ecc94b]' : 'text-[#38bdf8]'}`}>
            @{msg.sender}
          </span>
          {isUnhinged && <ShieldAlert size={12} className="text-[#ecc94b]" />}
        </div>
        <span className="font-['Outfit'] text-xs text-slate-500 tracking-wider">{msg.timestamp}</span>
      </div>
      <p className={`font-['Inter'] text-sm leading-relaxed ${isUnhinged ? 'text-slate-300' : 'text-slate-100'}`}>
        {msg.text}
      </p>
    </div>
  );
};

const VancouverMessage = ({ msg }: { key?: any, msg: any }) => {
  const isSystem = msg.type === 'system';
  const isAlert = msg.type === 'unhinged' || msg.type === 'doomer';
  
  const statusColor = isAlert ? 'text-amber-500' : isSystem ? 'text-emerald-500' : 'text-[#38bdf8]';
  const statusBorder = isAlert ? 'border-amber-500/50' : isSystem ? 'border-emerald-500/50' : 'border-[#38bdf8]/50';

  return (
    <div className={`grid grid-cols-[90px_110px_1fr] gap-4 py-2.5 px-3 border-b border-slate-800/70 hover:bg-slate-800/30 border-l-2 border-l-transparent hover:${statusBorder} transition-none cursor-crosshair`}>
      <div className="flex flex-col gap-1 shrink-0">
        <span className="font-['JetBrains_Mono'] text-[10px] tabular-nums text-slate-400">
          {msg.timestamp}
        </span>
        <span className="font-['JetBrains_Mono'] text-[9px] tabular-nums text-slate-600">
          {msg.hash}
        </span>
      </div>
      <div className="flex items-start">
        <span className={`font-['JetBrains_Mono'] font-bold text-[10px] uppercase tracking-wider truncate w-full ${statusColor}`}>
          {msg.sender || 'SYSTEM'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-['Inter'] text-[11px] tabular-nums text-slate-300 leading-relaxed break-words">
          {msg.text}
        </p>
      </div>
    </div>
  );
};

export default function SovereignLogViewer() {
  const [activeSoul, setActiveSoul] = useState('vancouver');
  const [telemetry, setTelemetry] = useState(INITIAL_DATA);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [telemetry, activeSoul]);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
    event.target.value = null; // Clear input
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const parsedData = lines.slice(1).map((line, index) => {
      // Handle quoted commas in CSV
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      
      const findKey = (keys: string[]) => keys.find(k => row[k] !== undefined) || '';
      
      let sender = row[findKey(['user', 'sender', 'author'])] || 'SYSTEM';
      let timestamp = row[findKey(['time', 'timestamp', 'date'])] || '00:00:00';
      let msgText = row[findKey(['message', 'text', 'content'])] || '';
      
      let finalType = 'normal';
      const textUpper = msgText.toUpperCase();
      if (textUpper.includes('[LIVE SECURE FEED]') || textUpper.includes('SYSTEM')) finalType = 'system';
      else if (textUpper.includes('CURSE') || textUpper.includes('UNIVERSE') || sender === 'the_chicken_man_az') finalType = 'unhinged';
      else if (textUpper.includes('COLLAPSE') || sender === 'barf') finalType = 'doomer';

      return {
        id: index + Date.now(),
        hash: '0x' + Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0'),
        sender: sender || 'SYSTEM',
        timestamp: timestamp,
        text: msgText,
        type: finalType
      };
    });

    setTelemetry(parsedData);
  };

  return (
    <div className="h-full w-full bg-[#050505] p-4 lg:p-8 flex flex-col items-center justify-center font-sans border-2 border-[#1e293b] rounded-lg">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      
      {/* Dev Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSoul('vesper')} 
          className={`px-6 py-2 font-['Outfit'] uppercase tracking-widest text-xs transition-all ${
            activeSoul === 'vesper' 
              ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/50 ' 
              : 'text-slate-500 border border-slate-800 hover:text-slate-300'
          }`}
        >
          Soul 1: Vesper Moda
        </button>
        <button 
          onClick={() => setActiveSoul('vancouver')} 
          className={`px-6 py-2 font-['JetBrains_Mono'] tracking-tight text-xs transition-all ${
            activeSoul === 'vancouver' 
              ? 'bg-[#1A110B] text-emerald-400 border border-emerald-500/50 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' 
              : 'text-slate-500 border border-slate-800 hover:text-slate-300'
          }`}
        >
          Soul 2: Vancouver Slate
        </button>
        
        <div className="ml-4 pl-4 border-l border-slate-800">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-4 py-2 font-['JetBrains_Mono'] text-[11px] text-slate-400 bg-slate-900 border border-slate-700 hover:text-white hover:border-[#38bdf8] transition-all"
          >
            <Upload size={14} />
            Ingest .CSV
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      <div className="w-full max-w-4xl flex justify-center transition-all duration-500">
        {activeSoul === 'vesper' ? (
          <div className="w-full max-w-3xl h-[650px] flex flex-col bg-[#0f1115]/60 backdrop-blur-[24px] border border-[#38bdf8]/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#38bdf8]/20 bg-gradient-to-r from-[#38bdf8]/5 to-transparent">
              <div className="flex items-center gap-3">
                <Radio size={18} className="text-[#38bdf8] animate-pulse" />
                <h2 className="font-['Outfit'] uppercase tracking-widest font-semibold text-[#38bdf8] text-sm">VIP Watch Party</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="font-['Outfit'] text-xs text-emerald-400 tracking-widest uppercase">Live Mesh</span>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto vesper-scroll p-6">
              {telemetry.map(msg => <VesperMessage key={msg.id} msg={msg} />)}
            </div>
            <div className="p-4 bg-[#050505]/40 border-t border-[#38bdf8]/10">
              <input type="text" placeholder="Discuss the game..." className="w-full bg-[#0f1115]/80 border border-[#38bdf8]/20 rounded-lg px-4 py-3 font-['Inter'] text-sm text-white placeholder-slate-600 focus:outline-none" disabled />
            </div>
          </div>
        ) : (
          <div className="w-full h-[650px] flex flex-col bg-[#0f1115] border border-slate-800 rounded-sm overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800 bg-[#1A110B]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/50 border border-slate-800 rounded-sm">
                  <Server size={12} className="text-[#38bdf8]" />
                  <span className="font-['JetBrains_Mono'] tracking-tight font-bold text-slate-200 text-[10px] uppercase">NODE .73 // UHF ADMIN</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-slate-500 uppercase tracking-widest">WSS_SYNCED</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Wifi size={12} className="text-slate-500" />
                  <span className="font-['JetBrains_Mono'] tabular-nums text-[10px] text-slate-400">12ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-slate-500" />
                  <span className="font-['JetBrains_Mono'] tabular-nums text-[10px] text-slate-400">42°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-slate-500" />
                  <span className="font-['JetBrains_Mono'] tabular-nums text-[10px] text-emerald-500">68% RAM</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[90px_110px_1fr] gap-4 px-3 py-2 border-b border-slate-800 bg-[#0A0705]">
              <div className="font-['JetBrains_Mono'] text-[9px] text-slate-600 uppercase tracking-widest flex items-center gap-1"><Hash size={10} /> INDEX</div>
              <div className="font-['JetBrains_Mono'] text-[9px] text-slate-600 uppercase tracking-widest">ORIGIN_VECTOR</div>
              <div className="font-['JetBrains_Mono'] text-[9px] text-slate-600 uppercase tracking-widest">DECRYPTED_PAYLOAD</div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto vancouver-scroll bg-[#0A0705]">
              {telemetry.map(msg => <VancouverMessage key={msg.id} msg={msg} />)}
            </div>
            <div className="p-3 border-t border-slate-800 bg-[#1A110B] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-[#38bdf8] text-[11px] select-none">root@node73:~#</span>
                <input type="text" placeholder="tail -f /var/log/fanstack.log" className="w-full bg-transparent border-none py-1 font-['JetBrains_Mono'] text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none" disabled />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                 <span className="font-['JetBrains_Mono'] text-[9px] text-slate-600 uppercase tracking-widest">Awaiting SysAdmin Override...</span>
                 <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-500 uppercase tracking-widest">Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
