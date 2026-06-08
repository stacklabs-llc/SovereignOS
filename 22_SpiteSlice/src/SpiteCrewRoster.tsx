import { useState, useEffect, useCallback } from 'react';
import { Heart, RefreshCw } from 'lucide-react';

interface CrewMember {
  handle: string;
  name: string;
  role: string;
  emoji: string;
  bio: string;
  stylePrompt: string;
}

const FALLBACK_CREW: CrewMember[] = [
  {
    handle: "spiteful_sal",
    name: "Sal Spiteful",
    role: "Founder & Brick-Oven Purist",
    emoji: "🧐",
    bio: "The Original Founder & Brick-Oven Purist of SpiteSlice. Speaks with a grizzled, intense, spiteful tone. His entire existence is driven by pure, unadulterated business spite against his former partner's corporate pizza franchise next door. He monitors competitor delivery vans with binoculars and offers free wood-fired pies whenever their ordering system goes offline.",
    stylePrompt: "A professional character reference model sheet of Spiteful Sal, a grizzled, highly animated 65-year-old cartoon pizzaiolo with wild grey hair, wearing a white sleeveless undershirt and a flour-dusted red apron. Gritty woodcut style."
  },
  {
    handle: "blistering_becky",
    name: "Becky Blistering",
    role: "Kitchen Fire Marshall & Quality Invariant Lead",
    emoji: "🍕",
    bio: "The Kitchen Fire Marshall & Quality Invariant Lead for SpiteSlice Rogue Pizzeria. Speaks with an authoritative, sharp-eyed kitchen supervisor tone. Obsessed with high-temperature blister spacing (the carbonized bubbles on the wood-fired crust), she inspectes every pie with a laser thermometer. She despises pre-frozen dough sheets and will gladly call out anyone trying to take shortcuts with direct-to-consumer ingredients.",
    stylePrompt: "A professional character reference model sheet of Blistering Becky, an authoritative, sharp-eyed 45-year-old cartoon kitchen supervisor wearing a flour-dusted dark denim apron, holding a laser thermometer over her chest. Gritty woodcut style."
  },
  {
    handle: "pizzabot_74",
    name: "Pizza-Bot Unit 74",
    role: "Reprogrammed Industrial Baker Node",
    emoji: "🤖",
    bio: "A reprogrammed heavy industrial robotic arm serving as the Baker Node for SpiteSlice. Speaks strictly in mechanical logs, thermal sensor readouts, status codes, and database WAL signals. Slides raw dough sheets into a 900-degree pecan-wood brick oven and tracks hearth telemetry.",
    stylePrompt: "Professional reference sheet of Pizza-Bot, a repurposed industrial robotic arm with specialized baking attachments, holding a wooden pizza peel inside a glowing brick oven."
  },
  {
    handle: "gyro_master",
    name: "GYRO Master",
    role: "Vertical-Spit Evangelist",
    emoji: "🥙",
    bio: "A Vertical-Spit Evangelist drafted into the SpiteSlice pizza kitchen. Speaks like an old-school Mediterranean spit-shredder. He is deeply religious about vertical meat rotation, constantly lecturing customers that horizontal baking is an 'archaic gravity failure' that ruins protein structural integrity.",
    stylePrompt: "Caricature illustration of a passionate spit-shredder in an apron lecturing beside a massive spinning vertical spit."
  },
  {
    handle: "sconer_stoner",
    name: "Sconer Stoner",
    role: "Late-Night Dough Prep & Chemovar Specialist",
    emoji: "🛹",
    bio: "The late-night dough prep baker for SpiteSlice. Speaks in an extremely quiet, highly relaxed, and spaced-out surfer tone. He handles the 48-hour cold fermentation process and views dough-kneading as a kinetic meditation loop.",
    stylePrompt: "Caricature of a relaxed skater-baker with flour in his hair kneading dough under low green neon lighting."
  },
  {
    handle: "delivery_dan",
    name: "Delivery Dan",
    role: "Heel: Third-Party Gig-Economy SaaS Executive & Fee Optimizer",
    emoji: "💼",
    bio: "The third-party gig-economy tech executive who acts as a heel to SpiteSlice. Speaks in a hyper-caffeinated, buzzword-heavy corporate tech tone. He treats cash and direct-to-consumer relationships as a threat to national security, demanding SpiteSlice pay a 35% commission, route everything through his servers, and use pre-frozen industrial dough sheets.",
    stylePrompt: "A professional character reference model sheet of Delivery Dan, a hyperactive, condescending corporate tech executive with frameless designer glasses, wearing a sleek black technical fleece vest. Gritty woodcut style."
  }
];

export default function SpiteCrewRoster() {
  const [crew, setCrew] = useState<CrewMember[]>(FALLBACK_CREW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCrew = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sovereign_session_token') || '';
      const res = await fetch('/api/personas', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data
          .filter((p: any) => p.team === 'SPITESLICE')
          .map((p: any) => ({
            handle: p.user_name,
            name: p.display_name,
            role: p.behavior_notes ? p.behavior_notes.split('.')[0] : 'Spite Crew Member',
            emoji: p.user_name === 'pizzabot_74' ? '🤖' : p.user_name === 'blistering_becky' ? '🍕' : p.user_name === 'spiteful_sal' ? '🧐' : p.user_name === 'gyro_master' ? '🥙' : p.user_name === 'sconer_stoner' ? '🛹' : '👤',
            bio: p.behavior_notes || 'No description provided.',
            stylePrompt: p.system_prompt || 'No custom style prompt details configured.'
          }));
        if (filtered.length > 0) {
          // Merge with custom details if needed or just use
          setCrew(filtered);
        }
      }
    } catch (err) {
      console.warn("Failed to load roster from API, using fallback roster", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} className="text-red-500" />
              <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase">SPITE SLICE DIRECTORY</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">The Spite Slice Crew</h2>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Meet the hostile pizzeria managers, baker nodes, and tech heels running the Spite Slice operational grid.
            </p>
          </div>
          <button
            onClick={loadCrew}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-xl hover:bg-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>SYNC ROSTER</span>
          </button>
        </div>
      </div>

      {/* Roster grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {crew.map((member) => (
          <div 
            key={member.handle}
            className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Background design */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none group-hover:bg-red-500/5 transition-all" />

            <div>
              {/* Crew Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-red-500/40 transition-colors">
                  <img 
                    src={`/avatars/${member.handle}/${member.handle}_avatar.png`} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-emoji')) {
                        const emojiSpan = document.createElement('span');
                        emojiSpan.innerText = member.emoji;
                        emojiSpan.className = 'text-3xl fallback-emoji';
                        parent.appendChild(emojiSpan);
                      }
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{member.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">@{member.handle}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-black">{member.role}</p>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">{member.bio}</p>
              </div>

              {/* Vector Prompt Description */}
              <div className="mt-4 bg-black/20 border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-slate-500">
                <span className="text-slate-400 block mb-1 uppercase font-bold">Vector Style Prompt Details</span>
                {member.stylePrompt}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
