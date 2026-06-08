import React, { useState } from 'react';
import { X, FileText, Download, Copy, Play, Cpu, CheckCircle } from 'lucide-react';

interface LogArchiveModalProps {
  onClose: () => void;
}

const MOCK_ARCHIVE = [
  {
    id: 'sim_0419',
    date: 'April 19, 2026',
    title: '1986 Game 6 Ingestion',
    status: 'Ready for NotebookLM',
    dialogue: `# FanStack Discourse Export
**Event:** 1986 World Series Game 6 (NYM@BOS)
**Timestamp:** 2026-04-19 06:14 AM

**[06:15:22] JAKE TAYLOR (Umpire):** You call that a strike? I've seen better eyes on a potato.
**[06:16:01] DOT MATRIX (Savant):** Probability of a wild pitch in this scenario exceeds 84.3%. Historical modeling suggests Carter will swing.
**[06:16:45] THE BOUNCER (Security):** Keep the chatter down in the front row or I'm tossing you out.
**[06:17:15] FERRIS PITCHMAN (Sales):** The Bouncer is right! And you know what else is right? A brand new set of Kramerica Roll-Out Tie Dispensers, now 20% off for the 9th inning stretch!`,
    flowPrompts: `1. A photorealistic, high-fidelity UI icon for a futuristic sports broadcasting software dashboard. The central icon should depict a 1986 retro baseball ticket glowing with neon amber light. The icon must be framed inside a sleek, subtly rounded square (macOS squircle style). The background of the squircle should be a premium, dark translucent glass texture (#1A1A1C). Style it like a modern macOS Pro app icon (e.g., Logic Pro or Final Cut Pro) but with a darker, more cinematic 'Vesper Synthwave' aesthetic.

2. A photorealistic, high-fidelity UI icon for a futuristic sports broadcasting software dashboard. The central icon should depict an abstract audio waveform in vivid cyan, pulsing inside an umpire's mask. Frame inside a sleek, subtly rounded square. Premium dark glass texture.

3. An ultra-detailed 8k render of 'The Bouncer's sunglasses reflecting a glowing neon baseball stadium, cinematic lighting, dark background, suitable for a NotebookLM studio cover image.`
  },
  {
    id: 'sim_0418',
    date: 'April 18, 2026',
    title: 'BAL @ CLE (Live Sim)',
    status: 'Archived',
    dialogue: `# FanStack Discourse Export
**Event:** BAL@CLE 
**Timestamp:** 2026-04-18 10:22 PM

**[22:22:15] DOT MATRIX:** Analyzing Guardians exit velocity... 104 MPH. The physics engine is registering a 92% chance of extra bases.
**[22:23:40] SCRUFFY (Janitor):** Mhmm. That exit velo sure made a mess in the bullpen. I'll get the saw-dust.
**[22:25:10] THE DRIFTER (Ghost):** The wind whispers the ghosts of '95. The curse still hangs in the air over left field.`,
    flowPrompts: `1. A photorealistic UI asset of a glowing radar gun registering 104 MPH, styled as an Apple Pro software icon. Sleek dark squircle.
2. A cinematic render of a janitor's mop bucket overflowing with glowing neon blue data streams.`
  }
];

export default function LogArchiveModal({ onClose }: LogArchiveModalProps) {
  const [selectedLogId, setSelectedLogId] = useState(MOCK_ARCHIVE[0].id);
  const [activeTab, setActiveTab] = useState<'DISCOURSE' | 'FLOW_PROMPTS'>('DISCOURSE');
  const [copied, setCopied] = useState(false);

  const activeLog = MOCK_ARCHIVE.find(l => l.id === selectedLogId) || MOCK_ARCHIVE[0];

  const handleCopy = () => {
    const textToCopy = activeTab === 'DISCOURSE' ? activeLog.dialogue : activeLog.flowPrompts;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl">
      <div className="w-full max-w-7xl h-full flex flex-col bg-[#111111] rounded-2xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
        
        {/* MODAL HEADER */}
        <header className="h-14 flex items-center justify-between px-6 bg-[#18181b] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-['Outfit'] font-bold tracking-wide">Data Export Pipeline</h2>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">NotebookLM Ingestion Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* MODAL BODY */}
        <main className="flex-1 flex overflow-hidden">
            
            {/* LEFT SIDEBAR: Log Index */}
            <aside className="w-72 bg-[#18181b] border-r border-white/5 flex flex-col overflow-y-auto">
               <div className="p-4 border-b border-white/5">
                   <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Session Archives</h3>
                   <div className="relative">
                       <input 
                         type="text" 
                         placeholder="Search logs..." 
                         className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-[11px] text-white outline-none focus:border-blue-500/50"
                       />
                   </div>
               </div>
               <div className="flex-1 p-2 space-y-1">
                   {MOCK_ARCHIVE.map(log => (
                       <button 
                         key={log.id}
                         onClick={() => setSelectedLogId(log.id)}
                         className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex flex-col gap-1 ${selectedLogId === log.id ? 'bg-blue-500/10 border border-blue-500/20 shadow-inner' : 'hover:bg-white/5 border border-transparent'}`}
                       >
                           <div className="flex justify-between items-center w-full">
                               <span className={`text-[12px] font-bold tracking-wide ${selectedLogId === log.id ? 'text-blue-400' : 'text-gray-300'}`}>
                                   {log.date}
                               </span>
                               {selectedLogId === log.id && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                           </div>
                           <span className="text-[10px] text-gray-500 font-mono truncate">{log.title}</span>
                       </button>
                   ))}
               </div>
            </aside>

            {/* RIGHT MAIN: Viewer */}
            <section className="flex-1 flex flex-col bg-[#111111]">
                {/* TOOLBAR */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#141414]">
                    <div className="flex gap-1">
                        <button 
                          onClick={() => setActiveTab('DISCOURSE')}
                          className={`px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${activeTab === 'DISCOURSE' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Raw Discourse
                        </button>
                        <button 
                          onClick={() => setActiveTab('FLOW_PROMPTS')}
                          className={`px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${activeTab === 'FLOW_PROMPTS' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Cpu className="w-3.5 h-3.5" /> Flow Prompts
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                          onClick={handleCopy}
                          className="px-3 py-1.5 bg-[#2a2a2b] hover:bg-[#3f3f41] border border-white/10 rounded-md text-[11px] text-white font-semibold transition-all flex items-center gap-2"
                        >
                            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                            {copied ? 'COPIED' : 'COPY TO CLIPBOARD'}
                        </button>
                        <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-[11px] text-white font-bold tracking-wide transition-all  flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" /> EXPORT TO NOTEBOOKLM
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-4xl mx-auto h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 h-full shadow-inner shadow-black/50">
                            <pre className="font-mono text-[12px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {activeTab === 'DISCOURSE' ? activeLog.dialogue : activeLog.flowPrompts}
                            </pre>
                        </div>
                    </div>
                </div>

            </section>
        </main>
      </div>
    </div>
  );
}
