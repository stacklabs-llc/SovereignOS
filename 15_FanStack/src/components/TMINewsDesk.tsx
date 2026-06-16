import React, { useState } from 'react';
import { AlertCircle, Clock, CheckCircle, Copy, Archive, Radio, Film } from 'lucide-react';

const initialAnomalies = [
  {
    id: 'anom-1',
    event: 'Delay of Game (Rain / Unspecified)',
    time: 'LIVE (7:40 PM)',
    persona: 'BatteryBarf',
    format: 'Format B (2D Cartoon)',
    script: 'A rogue squirrel? A swam of bees? It is a curse! The baseball gods are punishing us! The Wilpons are behind this, I know it!',
    prompt: '2D animation, flat comic-book coloring, cartoon style. An anthropomorphic dog wearing a thick medical neck brace and a distressed blue and orange t-shirt sits at a wooden bar. He points frantically at the television screen behind him, which shows a giant feral squirrel sitting on a baseball mound. The dog looks horrified and unhinged.'
  },
  {
    id: 'anom-2',
    event: 'Edwin Diaz 6-8 Wks Injury',
    time: '4:15 PM',
    persona: 'Terry the Boomer',
    format: 'Format E (Hyper-Realistic Human)',
    script: 'Just end the season now. The Wilpons are still ruining this team from the grave. They took him from us!',
    prompt: 'Cinematic documentary wide shot inside a noisy, crowded sports bar. A distressed, hyper-realistic man wearing a generic unbranded orange and blue baseball jersey slams his hands on the table and yells aggressively towards the camera. The camera tracks out slowly, keeping him in sharp focus while the bright TV in the blurry background flashes action.'
  }
];
interface TMINewsDeskProps {
  activeGamedayPk?: string | null;
}

const AVAILABLE_EVENTS = [
  'Home Run', 'Strikeout', 'Double Play', 'Injury Delay', 
  'Manager Challenge', 'Ejection', 'Stolen Base', 'Balk', 
  'Pitching Substitution', 'Review',
  'Full-Count Strikeout', 'Bases-Loaded Inning-Ending Jam', 'Late-Inning Comeback Rally'
];

export default function TMINewsDesk({ activeGamedayPk }: TMINewsDeskProps) {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [backlog, setBacklog] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [configuredEvents, setConfiguredEvents] = useState<string[]>(['Home Run', 'Injury Delay', 'Manager Challenge', 'Ejection']);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const processedEvents = React.useRef<Set<string>>(new Set());

  const fetchAnomalies = async () => {
     try {
         const res = await fetch('/api/tmi_anomalies');
         const data = await res.json();
         setAnomalies(data);
     } catch (e) {
         console.error("Failed to fetch TMI anomalies:", e);
     }
  };

  const saveConfig = async (events: string[]) => {
     try {
         await fetch('/api/tmi_event_config', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(events)
         });
     } catch (e) {
         console.error("Failed to save event config:", e);
     }
  };

  React.useEffect(() => {
     const fetchConfig = async () => {
        try {
            const res = await fetch('/api/tmi_event_config');
            const data = await res.json();
            if (Array.isArray(data)) {
                setConfiguredEvents(data);
            }
        } catch (e) {
            console.error("Failed to fetch event config:", e);
        }
     };
     fetchConfig();
     fetchAnomalies();
     const interval = setInterval(fetchAnomalies, 5000); // Poll DB for new anomalies from other nodes
     window.addEventListener('tmi_anomalies_updated', fetchAnomalies);
     return () => {
         clearInterval(interval);
         window.removeEventListener('tmi_anomalies_updated', fetchAnomalies);
     };
  }, []);

  // All-Games scanner — fetches today's schedule, then fans out across ALL active/live games.
  // NOT gated on activeGamedayPk. TMI is a broadcast director tool that watches the whole league.
  React.useEffect(() => {
    const scanAllGames = async () => {
      try {
        // Step 1: Get today's full schedule
        const today = new Date();
        // MLB schedule uses ET-based date — subtract 6h from UTC to approximate
        const etOffset = 6 * 60 * 60 * 1000;
        const etDate = new Date(today.getTime() - etOffset);
        const dateStr = etDate.toISOString().split('T')[0];
        const schedRes = await fetch(
          `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${dateStr}&endDate=${dateStr}`
        );
        const schedData = await schedRes.json();
        const games: Array<{ gamePk: number; abstractState: string }> = [];
        for (const d of schedData?.dates || []) {
          for (const g of d?.games || []) {
            const abstractState = g?.status?.abstractGameState || '';
            if (!['Postponed', 'Cancelled'].includes(abstractState)) {
              games.push({ gamePk: g.gamePk, abstractState });
            }
          }
        }

        if (games.length === 0) return;

        // Step 2: Fan out — fetch allPlays for every game in parallel
        await Promise.allSettled(
          games.map(async ({ gamePk }) => {
            try {
              const feedRes = await fetch(
                `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
              );
              const feed = await feedRes.json();
              const plays = feed?.liveData?.plays?.allPlays || [];
              const awayAbbr = feed?.gameData?.teams?.away?.abbreviation || 'AWY';
              const homeAbbr = feed?.gameData?.teams?.home?.abbreviation || 'HME';
              const matchupLabel = `${awayAbbr}@${homeAbbr}`;

              for (const play of plays) {
                const eventType = play.result?.event;
                const atBatIndex = play.about?.atBatIndex;
                if (!eventType) continue;

                const eventId = `${gamePk}-${atBatIndex}-${eventType}`;
                if (!configuredEvents.includes(eventType)) continue;
                if (processedEvents.current.has(eventId)) continue;

                processedEvents.current.add(eventId);

                const inningHalf = play.about?.halfInning === 'top' ? 'Top' : 'Bot';
                const inningNum = play.about?.inning || '?';

                const newAnom = {
                  id: `anom-${gamePk}-${eventId}`,
                  game_pk: String(gamePk),
                  event: `[${matchupLabel}] ${eventType}`,
                  time: `LIVE (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) — ${inningHalf} ${inningNum}`,
                  persona: 'TBD Persona',
                  format: 'Format A (Standard)',
                  script: play.result?.description || `A ${eventType} has occurred in ${matchupLabel}!`,
                  prompt: `Cinematic wide shot. A dynamic moment in a sports bar as fans react to a ${eventType} by ${play.matchup?.batter?.fullName || 'the batter'}.`
                };

                try {
                  await fetch('/api/tmi_anomalies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAnom)
                  });
                  fetchAnomalies();
                } catch (e) {
                  console.error(`Failed to post TMI anomaly for game ${gamePk}:`, e);
                }
              }
            } catch (e) {
              // Individual game fetch failure — don't abort the whole scan
            }
          })
        );
      } catch (e) {
        console.error('[TMI] Schedule scan failed:', e);
      }
    };

    scanAllGames();
    const interval = setInterval(scanAllGames, 15000); // Scan all games every 15s
    return () => clearInterval(interval);
  }, [configuredEvents]); // No longer depends on activeGamedayPk

  const handleGreenlight = async (anom: any) => {
    try {
      // 1. Copy payload to clipboard
      navigator.clipboard.writeText(`SCRIPT:\n${anom.script}\n\nVEO PROMPT:\n${anom.prompt}`);
      setCopiedId(anom.id);

      // 2. Instruct backend to scaffold the Storyboard and auto-pull assets
      const res = await fetch('/api/storyboards/create_from_tmi', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(anom)
      });
      const data = await res.json();
      
      // 3. Clean up the anomaly queue
      setTimeout(() => {
          setCopiedId(null);
          handleRemoveAnomaly(anom.id);
          alert(`Orchestrated Storyboard: ${data.project || 'Unknown Project'}\nAssets have been transferred to the Media Vault.`);
      }, 1500);
    } catch (e) {
      console.error(e);
      alert("Failed to orchestrate Flowmercial. See console.");
    }
  };

  const handleReviewLater = (id: string) => {
    setBacklog([...backlog, id]);
    handleRemoveAnomaly(id);
  };

  const handleRemoveAnomaly = async (id: string) => {
      try {
          await fetch(`/api/tmi_anomalies/${id}`, { method: 'DELETE' });
          fetchAnomalies();
      } catch (e) {
          console.error("Failed to delete anomaly", e);
      }
  };

  const handleClearAll = async () => {
      try {
          await fetch(`/api/tmi_anomalies/clear`, { method: 'DELETE' });
          setBacklog([]);
          fetchAnomalies();
      } catch (e) {
          console.error("Failed to clear anomalies", e);
      }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
           <h2 className="text-3xl font-serif text-white flex items-center gap-3">
              <Radio className="text-[#ef4444] animate-pulse" /> TMI News Desk
           </h2>
           <p className="text-[#8E9CAA] font-mono text-xs uppercase tracking-widest mt-1">Broadcast Director Triage Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg text-center">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Anomaly Queue</div>
              <div className="text-xl font-bold text-[#38bdf8]">{anomalies.length}</div>
           </div>
           <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg text-center">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Backlog Vault</div>
              <div className="text-xl font-bold text-white/80">{backlog.length}</div>
           </div>
           <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
             <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
             >Grid</button>
             <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
             >List</button>
           </div>
           <button 
              onClick={() => setIsConfigOpen(true)}
              className="bg-[#38bdf8]/20 hover:bg-[#38bdf8]/40 border border-[#38bdf8]/50 text-[#38bdf8] px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold transition-all "
           >
              Configure Triggers
           </button>
           <button 
              onClick={handleClearAll}
              className="bg-[#ef4444]/20 hover:bg-[#ef4444]/40 border border-[#ef4444]/50 text-[#ef4444] px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold transition-all "
           >
              Clear Desk
           </button>
        </div>
      </div>

      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
           <div className="bg-[#111827] border border-[#38bdf8]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-4">Configure Event Triggers</h3>
              <p className="text-sm text-gray-400">Select which MLB Statcast events should automatically generate a TMI Anomaly payload.</p>
              
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2">
                 {AVAILABLE_EVENTS.map(evt => {
                    const isChecked = configuredEvents.includes(evt);
                    return (
                       <label key={evt} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 accent-[#38bdf8]"
                             checked={isChecked}
                             onChange={(e) => {
                                 let updated: string[];
                                 if (e.target.checked) {
                                    updated = [...configuredEvents, evt];
                                 } else {
                                    updated = configuredEvents.filter(e => e !== evt);
                                 }
                                 setConfiguredEvents(updated);
                                 saveConfig(updated);
                              }}
                          />
                          <span className="text-white font-medium">{evt}</span>
                       </label>
                    );
                 })}
              </div>

              <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-white/10">
                 <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="bg-[#38bdf8] text-[#111827] px-6 py-2 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#0ea5e9] transition-all"
                 >
                    Done
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
          {anomalies.map((anom) => (
             viewMode === 'grid' ? (
               <div key={anom.id} className="bg-[#111827] border border-[#38bdf8]/30 rounded-xl overflow-hidden shadow-2xl relative flex flex-col shrink-0">
                  <div className="bg-[#38bdf8]/10 p-3 border-b border-[#38bdf8]/30 flex justify-between items-center">
                     <span className="font-bold text-[#38bdf8] uppercase tracking-wider text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {anom.event}
                     </span>
                     <span className="font-mono text-xs text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {anom.time}
                     </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[#8E9CAA] text-xs uppercase tracking-widest font-bold">Recommended Persona</span>
                        <span className="bg-white/10 px-2 py-1 rounded text-white text-xs">{anom.persona}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-[#8E9CAA] text-xs uppercase tracking-widest font-bold">Studio Aesthetic</span>
                        <span className="bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold">{anom.format}</span>
                     </div>

                     <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[#8E9CAA] text-[10px] uppercase tracking-widest font-bold">ElevenLabs Script Payload</span>
                        <div className="bg-black/50 p-2 rounded border border-white/5 text-white/80 text-xs italic font-serif">
                           "{anom.script}"
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="text-[#8E9CAA] text-[10px] uppercase tracking-widest font-bold">Veo Sanitized Prompt</span>
                        <div className="bg-black/50 p-2 rounded border border-white/5 text-white/80 text-xs font-mono line-clamp-3">
                           {anom.prompt}
                        </div>
                     </div>
                  </div>

                  <div className="p-3 bg-black/40 border-t border-white/10 flex gap-2">
                     <button 
                        onClick={() => handleGreenlight(anom)}
                        className="flex-1 bg-[#a855f7]/20 hover:bg-[#a855f7]/40 border border-[#a855f7]/50 text-[#a855f7] py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-all "
                     >
                        {copiedId === anom.id ? <><CheckCircle className="w-4 h-4" /> SCENE STAGED</> : <><Film className="w-4 h-4" /> Orchestrate Flowmercial</>}
                     </button>
                     <button 
                        onClick={() => handleReviewLater(anom.id)}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white py-2 rounded-lg text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-all"
                     >
                        <Archive className="w-4 h-4" /> Review Later
                     </button>
                  </div>
               </div>
             ) : (
               <div key={anom.id} className="bg-[#111827] border border-white/10 hover:border-[#38bdf8]/30 rounded-lg p-3 flex items-center gap-4 transition-all">
                 <div className="flex-shrink-0 w-12 h-12 bg-[#38bdf8]/10 rounded flex items-center justify-center text-[#38bdf8]">
                   <AlertCircle className="w-6 h-6" />
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col">
                   <div className="flex items-baseline justify-between mb-1">
                     <h4 className="text-sm font-bold text-white uppercase tracking-wider truncate">{anom.event}</h4>
                     <span className="text-[10px] font-mono text-white/40 whitespace-nowrap ml-2">{anom.time}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs text-[#8E9CAA]">
                     <span className="bg-white/5 px-2 py-0.5 rounded truncate max-w-[120px]">{anom.persona}</span>
                     <span className="text-[#ef4444] border border-[#ef4444]/20 bg-[#ef4444]/10 px-2 py-0.5 rounded text-[9px] uppercase font-bold whitespace-nowrap">{anom.format}</span>
                     <span className="truncate flex-1 italic text-white/50 ml-2">"{anom.script}"</span>
                   </div>
                 </div>
                 <div className="flex-shrink-0 flex gap-2 ml-4">
                    <button 
                        onClick={() => handleGreenlight(anom)}
                        className="bg-[#a855f7]/20 hover:bg-[#a855f7]/40 border border-[#a855f7]/50 text-[#a855f7] px-3 py-1.5 rounded text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-1 transition-all "
                     >
                        {copiedId === anom.id ? <CheckCircle className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                    </button>
                    <button 
                        onClick={() => handleReviewLater(anom.id)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded flex items-center justify-center transition-all"
                     >
                        <Archive className="w-3 h-3" />
                    </button>
                 </div>
               </div>
             )
          ))}
          {anomalies.length === 0 && (
             <div className="col-span-full py-12 flex flex-col items-center justify-center text-white/30 border border-white/10 border-dashed rounded-xl">
                 <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                 <p className="font-mono uppercase tracking-widest">No Active Anomalies in the Feed</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
