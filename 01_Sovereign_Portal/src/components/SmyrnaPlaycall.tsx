import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Shield, Zap, Award, Sparkles, MapPin, RotateCcw, 
  FileText, Send, Flame, Plus, Compass, Coffee, ShieldAlert, Cpu, 
  Users, Sliders, ChevronRight, CheckCircle2, AlertCircle, RefreshCw,
  Droplet, ShoppingBag, Terminal, Check
} from 'lucide-react';
import avatarMap from '../avatarMap';

interface SmyrnaAdvocate {
  name: string;
  role: string;
  location: string;
  avatarKey: string;
  cadence: string;
  status: string;
  bio: string;
}

const INITIAL_ADVOCATES: SmyrnaAdvocate[] = [
  {
    name: "Señora Caos",
    role: "Convenience Triage Lead",
    location: "Gonzas Convenience",
    avatarKey: "señora_caos",
    cadence: "Agitator",
    status: "Consuming Sour Patch Kids",
    bio: "Reigning queen of midnight convenience runs. Operates out of the frozen slushie machine alcove."
  },
  {
    name: "Std. Deviant",
    role: "Convenience Outlier",
    location: "Gonzas Convenience",
    avatarKey: "std__deviant",
    cadence: "Reactant",
    status: "Analyzing transaction anomalies",
    bio: "Obsessed with mathematical anomalies in purchase history."
  },
  {
    name: "Silas True Grit",
    role: "Vintage Hardware Mastermind",
    location: "Anvil and Twine Hardware",
    avatarKey: "silas_true_grit",
    cadence: "Pacer",
    status: "Restoring an 1890s hand plane",
    bio: "Proprietor of Anvil & Twine. Refuses to sell power tools. Cardboard treehouse architect."
  },
  {
    name: "Iron Gaze",
    role: "Security Chief & Watcher",
    location: "Anvil and Twine Hardware",
    avatarKey: "iron_gaze",
    cadence: "Lurker",
    status: "Staring out the front window",
    bio: "Stands silently in the ironmongery aisle. Legend says he hasn't blinked since 2007."
  },
  {
    name: "Metsy",
    role: "Sovereign Feline Boss",
    location: "AetherVet Diagnostics",
    avatarKey: "metsy_smyrna",
    cadence: "Yapper",
    status: "Patrolling the Pine Straw clearing",
    bio: "A 14lb biometric security unit operating out of the Smyrna field centroid. Highly trained in lawn surveillance."
  },
  {
    name: "Barnaby the Cat",
    role: "Local Hardware Informant",
    location: "Anvil and Twine Hardware",
    avatarKey: "barnaby",
    cadence: "Lurker",
    status: "Sleeping on a sack of seed",
    bio: "The true mastermind behind Anvil & Twine. Coordinates the cross-over alliance with the Deck Cartel."
  },
  {
    name: "Buster",
    role: "Patrol Officer",
    location: "Town Hall",
    avatarKey: "buster",
    cadence: "Enforcer",
    status: "Inspecting yard boundaries",
    bio: "Field enforcement unit tracking local zoning and yard concurrency limits."
  },
  {
    name: "Sam",
    role: "Greenhouse Budtender",
    location: "WeedStack Vape",
    avatarKey: "sam",
    cadence: "Lobbyist",
    status: "Trimming legal living soil cultivars",
    bio: "WeedStack master horticulturist operating out of the premium organic greenhouse."
  },
  {
    name: "Water-Barrel Wayne",
    role: "Water Barter Legend",
    location: "Scruffy's Tavern",
    avatarKey: "wayne",
    cadence: "Barter Trader",
    status: "Measuring active water reserve reserves",
    bio: "Keeper of the 500-gallon rain barrel who brokers heavy B2B trades for sovereign credits."
  }
];

interface PropertyPlat {
  id: string;
  name: string;
  stack: string;
  tether: string;
  tension: number;
  coordinates: string;
}

const PROPERTY_PLATS: PropertyPlat[] = [
  {
    id: "PLAT-01",
    name: "Gonzas Convenience",
    stack: "GONZAS",
    tether: "Supply chain hub; Wayne's barter drop-off.",
    tension: 45,
    coordinates: "X: 125, Y: 285"
  },
  {
    id: "PLAT-02",
    name: "Anvil and Twine Hardware",
    stack: "Anvil & Twine Hardware",
    tether: "Industrial maintenance and spool tracking.",
    tension: 15,
    coordinates: "X: 175, Y: 462"
  },
  {
    id: "PLAT-03",
    name: "AetherVet Diagnostics",
    stack: "AetherVet B2B",
    tether: "Biometric pet triage (Arkle Vet mockup).",
    tension: 30,
    coordinates: "X: 745, Y: 322"
  },
  {
    id: "PLAT-04",
    name: "WeedStack Vape",
    stack: "WeedStack",
    tether: "Workforce employment and dispensary anchor.",
    tension: 60,
    coordinates: "X: 1150, Y: 200"
  },
  {
    id: "PLAT-05",
    name: "Scruffy's Tavern",
    stack: "FanStack MLB Monolith",
    tether: "Social Blender; post-shift faction collision.",
    tension: 85,
    coordinates: "X: 1040, Y: 640"
  },
  {
    id: "PLAT-06",
    name: "Town Hall",
    stack: "Sovereign OS Core HQ",
    tether: "Central coordination and command hub.",
    tension: 10,
    coordinates: "X: 480, Y: 330"
  },
  {
    id: "PLAT-07",
    name: "Silas Thorne's Garden Cabin",
    stack: "WildSeed GardenStack",
    tether: "Cozy wood cabin and cardboard treehouse syndicate.",
    tension: 20,
    coordinates: "X: 1100, Y: 180"
  },
  {
    id: "PLAT-08",
    name: "Wild Paws & Rusty Canvas Art Rescue",
    stack: "WILDPAWSRUSTYCANVASARTRESCUE",
    tether: "Sanctuary and wood-grain canvas art studio funding animal rescues.",
    tension: 25,
    coordinates: "X: 1040, Y: 560"
  },
  {
    id: "PLAT-09",
    name: "Cary Sterling's Detective Office",
    stack: "Cary Grant Investigations",
    tether: "Noir private detective operations and CMDB auditing.",
    tension: 35,
    coordinates: "X: 300, Y: 430"
  },
  {
    id: "PLAT-10",
    name: "Señora Caos's Loft",
    stack: "GONZAS",
    tether: "Cozy upper floor loft above Gonzo's storefront.",
    tension: 50,
    coordinates: "X: 155, Y: 220"
  }
];

interface LogEntry {
  id: string;
  time: string;
  source: string;
  text: string;
  color: string;
}

interface CardTemplate {
  name: string;
  character: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  attack: number;
  defense: number;
  agility: number;
  ability: string;
  lore: string;
  style: string;
}

const ADVOCATE_EXPRESSIONS: Record<string, string[]> = {
  decision_derby: [
    'front_neutral', 'front_talking', 'front_surprised',
    'left_neutral', 'left_talking', 'left_surprised',
    'right_neutral', 'right_talking', 'right_surprised'
  ],
  barb: [
    'avatar', 'barb_avatar', 'barb_pointing', 'barb_shrug', 'pointing', 'shrug'
  ],
  barb_founder: [
    'barb_founder_avatar', 'barb_founder_pointing', 'barb_founder_shrug'
  ],
  doc_wheeler: [
    'doc_wheeler_avatar', 'doc_wheeler_pointing', 'doc_wheeler_shrug'
  ],
  jack_carpenter: [
    'jack_carpenter_avatar', 'jack_carpenter_pointing', 'jack_carpenter_shrug'
  ],
  jukebox_jesse: [
    'jukebox_jesse_avatar', 'jukebox_jesse_pointing', 'jukebox_jesse_shrug'
  ],
  señora_caos: [
    'señora_caos_avatar', 'señora_caos_pointing', 'señora_caos_shrug'
  ],
  buster_brawler: [
    'buster_brawler_avatar', 'buster_brawler_pointing', 'buster_brawler_shrug'
  ]
};

export default function SmyrnaPlaycall() {
  const [theme, setTheme] = useState<'neon' | 'cardboard'>('neon');
  const [activeTab, setActiveTab] = useState<'control' | 'forge' | 'lore'>('control');
  const [selectedZone, setSelectedZone] = useState<string>('Catnip Wars Open World');
  const [focusedPlat, setFocusedPlat] = useState<string>("PLAT-01");
  const [advocates, setAdvocates] = useState<SmyrnaAdvocate[]>(INITIAL_ADVOCATES);
  const [waterLevel, setWaterLevel] = useState<number>(375);
  const [chaosFactor, setChaosFactor] = useState<number>(3.5);
  const [simRunning, setSimRunning] = useState<boolean>(true);
  const [promptText, setPromptText] = useState<string>('');
  
  // Card Forge State
  const [cardName, setCardName] = useState<string>('NipStack Recruit');
  const [cardChar, setCardChar] = useState<string>('Señora Caos');
  const [cardRarity, setCardRarity] = useState<'Common' | 'Rare' | 'Epic' | 'Legendary'>('Epic');
  const [cardAtk, setCardAtk] = useState<number>(6);
  const [cardDef, setCardDef] = useState<number>(4);
  const [cardAgi, setCardAgi] = useState<number>(7);
  const [cardAbility, setCardAbility] = useState<string>('Sour Splash: Deals 3 splash damage to all convenience competitors.');
  const [cardLore, setCardLore] = useState<string>('Forged in the fires of late-night convenience cravings.');
  const [cardStyle, setCardStyle] = useState<string>('style_felt');
  const [forgedCards, setForgedCards] = useState<CardTemplate[]>(() => {
    const saved = localStorage.getItem('smyrna_forged_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [personaDbMap, setPersonaDbMap] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadPersonaIds = async () => {
      try {
        const host = window.location.protocol === "https:" 
          ? `${window.location.protocol}//${window.location.host}` 
          : `http://${window.location.hostname}:8096`;
        const res = await fetch(`${host}/api/now/table/cmdb_ci_ai_persona`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.result)) {
            const mapping: {[key: string]: string} = {};
            data.result.forEach((p: any) => {
              if (p.user_name) {
                mapping[p.user_name.toLowerCase()] = p.sys_id;
              }
            });
            setPersonaDbMap(mapping);

            // Define mapped db usernames for INITIAL_ADVOCATES
            const advocateToDbUser: {[key: string]: string} = {
              "Señora Caos": "señora_caos",
              "Std. Deviant": "standard_deviant_0",
              "Silas True Grit": "silas_truegrit",
              "Iron Gaze": "iron_gaze",
              "Water-Barrel Wayne": "water_barrel_wayne"
            };

            // Merge / override advocates with DB results
            setAdvocates(prevAdvocates => prevAdvocates.map(adv => {
              const dbUser = advocateToDbUser[adv.name];
              if (dbUser) {
                const dbPersona = data.result.find((p: any) => p.user_name.toLowerCase() === dbUser.toLowerCase());
                if (dbPersona) {
                  return {
                    ...adv,
                    name: dbPersona.first_name ? dbPersona.first_name : adv.name,
                    bio: dbPersona.introduction ? dbPersona.introduction : (dbPersona.u_deep_lore ? dbPersona.u_deep_lore : adv.bio),
                    location: dbPersona.u_deployment_zone ? dbPersona.u_deployment_zone : adv.location,
                    role: dbPersona.title ? dbPersona.title : adv.role,
                    cadence: dbPersona.u_cadence ? dbPersona.u_cadence : adv.cadence
                  };
                }
              }
              return adv;
            }));
          }
        }
      } catch (e) {
        console.error("SmyrnaPlaycall: failed to load persona db map", e);
      }
    };
    loadPersonaIds();
  }, []);


  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '19:00:00', source: 'SYSTEM', text: '🌌 Event: "Smyrna Heights Crossover Watch Party" initialized at Treehouse Syndicate HQ (2816 Parkwood Rd SE).', color: '#38bdf8' },
    { id: '2', time: '19:02:15', source: 'SYSTEM', text: '🏡 Pilot (Stack Labs LLC) welcomes co-conspirator Barf and baseball fanatic Uncle Stevie Stan into the cardboard treehouse.', color: '#38bdf8' },
    { id: '3', time: '19:05:30', source: 'SAM', text: '🍇 Barf: "I brought some stale sour patch kids and pretzels from Gonzo\'s Convenience. Let\'s get this Braves vs. Reds game going on the cardboard projector!"', color: '#cbd5e1' },
    { id: '4', time: '19:08:45', source: 'BUSTER', text: '🔥 Uncle Stevie Stan: "WHAT DO YOU MEAN BLACKED OUT?! A Tailscale remote kiosk block?! In Smyrna Heights?! This is a complete violation of baseball concurrency!"', color: '#facc15' },
    { id: '5', time: '19:10:12', source: 'SAM', text: '🍇 Barf: "Classic Wilpon\'s curse creeping into Georgia! I\'m highly authorized to throw this cardboard pretzel at the screen!"', color: '#cbd5e1' },
    { id: '6', time: '19:12:00', source: 'SYSTEM', text: '🚨 RAGE STATUS CRITICAL: Uncle Stevie Stan\'s biometric validator bowl heart rate spiked to 198 BPM. Metsy Smyrna barking sequence engaged.', color: '#f43f5e' }
  ]);
  const [blastAdvocate, setBlastAdvocate] = useState<string>('decision_derby');
  const [blastExpression, setBlastExpression] = useState<string>('front_neutral');

  const feedRef = useRef<HTMLDivElement>(null);
  const mapObjectRef = useRef<HTMLObjectElement>(null);

  // Auto Scroll logs
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs]);

  // Bind interactive SVG click listeners directly to focusedPlat state
  useEffect(() => {
    const obj = mapObjectRef.current;
    if (!obj) return;

    const handleLoad = () => {
      try {
        const svgDoc = obj.contentDocument;
        if (!svgDoc) return;

        const idMapping: { [key: string]: string } = {
          "Town Hall": "PLAT-06",
          "Silas Thorne's Garden Cabin": "PLAT-07",
          "Wild Paws & Rusty Canvas Art Rescue": "PLAT-08",
          "Cary Sterling's Detective Office": "PLAT-09",
          "Señora Caos's Loft": "PLAT-10",
          "Gonzo's Convenience": "PLAT-01",
          "Anvil & Twine Hardware": "PLAT-02",
          "AetherVet Diagnostics": "PLAT-03",
          "Catnip Wars Open World": "PLAT-04"
        };

        Object.entries(idMapping).forEach(([svgId, platId]) => {
          const elem = svgDoc.getElementById(svgId);
          if (elem) {
            elem.style.cursor = 'pointer';
            elem.style.transition = 'opacity 0.2s';
            
            // Hover effect
            elem.addEventListener('mouseenter', () => {
              elem.style.opacity = '0.7';
            });
            elem.addEventListener('mouseleave', () => {
              elem.style.opacity = '1';
            });

            // Click focus anchor
            elem.addEventListener('click', () => {
              setFocusedPlat(platId);
              const plat = PROPERTY_PLATS.find(p => p.id === platId);
              if (plat) {
                setSelectedZone(plat.name === 'Gonzas Convenience' ? "Gonzo's Convenience" : plat.name);
              }
            });
          }
        });
      } catch (e) {
        console.error("Failed to bind SVG click listeners", e);
      }
    };

    obj.addEventListener('load', handleLoad);
    if (obj.contentDocument) {
      handleLoad();
    }
    return () => {
      obj.removeEventListener('load', handleLoad);
    };
  }, [theme]);

  // Simulation loop for random immersive events
  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      const sources = ['SILAS', 'CAOS', 'METSY', 'BUSTER', 'SAM', 'SYSTEM'];
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      const timeStr = new Date().toTimeString().split(' ')[0];
      let text = '';
      let color = '#cbd5e1';

      switch(source) {
        case 'SYSTEM':
          const sysMsgs = [
            'Sky-Rat Logistics delivery corridor cleared over McCauley Road.',
            'AetherVet telemetry sweep: Metsy biometrics nominal. Heart rate: 92 BPM.',
            "Convenience transaction matrix synced at Gonzo's Convenience.",
            'Greebles stash located under the cardboard ramp in Backyard Quadrant C.'
          ];
          text = sysMsgs[Math.floor(Math.random() * sysMsgs.length)];
          color = '#38bdf8';
          break;
        case 'SILAS':
          const silasMsgs = [
            'Restored a brass drawer pull. "They don\'t build \'em like they used to."',
            'Checking lumber seating for the treehouse expansion.',
            'Locked down the vintage scale. Barnaby was using it as a pillow.'
          ];
          text = silasMsgs[Math.floor(Math.random() * silasMsgs.length)];
          color = '#fb923c';
          break;
        case 'CAOS':
          const caosMsgs = [
            'Slushie machine is at critical capacity. Mixing blue raspberry and cherry.',
            'Gave a customer a highly suspicious look for requesting paper bags.',
            'Barricading the convenience aisle. "Only premium lore allowed here."'
          ];
          text = caosMsgs[Math.floor(Math.random() * caosMsgs.length)];
          color = '#f43f5e';
          break;
        case 'METSY':
          const metsyMsgs = [
            'Alert: Sensed a strange vibration in the mulch substrate.',
            'Barking sequence initiated: Target: Officer Buster Red-Alert.',
            'Patrolling the deck staircase. All turf secure.'
          ];
          text = metsyMsgs[Math.floor(Math.random() * metsyMsgs.length)];
          color = '#a3e635';
          break;
        case 'BUSTER':
          const busterMsgs = [
            'Patrol sweep on McCauley Road. No gophers detected.',
            'Yard security status: Amber alert. Sky rats behaving erratically.',
            'Inspecting the fence line gaps. Stmp is currently snoring.'
          ];
          text = busterMsgs[Math.floor(Math.random() * busterMsgs.length)];
          color = '#facc15';
          break;
        case 'SAM':
          const samMsgs = [
            '🚨 SIGHTING: Gopher spotted doing high-speed zoomies near the compost pit!',
            'Tunnel matrix expanded under Backyard Deck.',
            'Alert: Biological specimen dropped in mulch clearing cluster!'
          ];
          text = samMsgs[Math.floor(Math.random() * samMsgs.length)];
          color = '#fb7185';
          break;
      }

      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        time: timeStr,
        source,
        text,
        color
      }].slice(-50)); // Cap at 50 logs

    }, 8000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [simRunning]);

  const handleDeployPrompt = () => {
    if (!promptText.trim()) return;
    const timeStr = new Date().toTimeString().split(' ')[0];
    
    // Log prompt injection
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      time: timeStr,
      source: 'SYSTEM',
      text: `Narrative Prompt Injected: "${promptText}"`,
      color: '#e879f9'
    }]);

    // Simulate emerging card response
    setTimeout(() => {
      const responseTime = new Date().toTimeString().split(' ')[0];
      const reactions = [
        `METSY: Prompt integrated. Initiating pine straw clearance sequence. Specimen candidate identified!`,
        `SILAS: Narrative parsed. "A fine addition to our cardboard treehouse archives."`,
        `SEÑORA CAOS: Gonzo's Convenience locked down. "No generic items allowed under this new narrative decree."`,
        `SAM: Expanding tunnel system to match the emerging sighting!`
      ];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        time: responseTime,
        source: 'SYSTEM',
        text: `⚡ LORE OUTCOME: ${randomReaction}`,
        color: '#67e8f9'
      }]);
    }, 1500);

    setPromptText('');
  };

  const handleForgeCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: CardTemplate = {
      name: cardName,
      character: cardChar,
      rarity: cardRarity,
      attack: cardAtk,
      defense: cardDef,
      agility: cardAgi,
      ability: cardAbility,
      lore: cardLore,
      style: cardStyle
    };

    const updated = [newCard, ...forgedCards];
    setForgedCards(updated);
    localStorage.setItem('smyrna_forged_cards', JSON.stringify(updated));

    // Log Card Forge
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      time: timeStr,
      source: 'SYSTEM',
      text: `🏆 NipStack Card Forged: "${cardName}" [${cardRarity}] appended to Cardboard Matrix.`,
      color: '#34d399'
    }]);

    // Reset form fields
    setCardName('New Card');
    setCardAbility('');
    setCardLore('');
  };

  const handleClearForgedCards = () => {
    if (confirm("Reset the Cardboard Gwent Card Forge?")) {
      setForgedCards([]);
      localStorage.removeItem('smyrna_forged_cards');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return 'from-amber-500 to-yellow-600 text-amber-100 border-amber-400';
      case 'Epic': return 'from-fuchsia-600 to-purple-700 text-fuchsia-100 border-fuchsia-500';
      case 'Rare': return 'from-blue-600 to-cyan-700 text-blue-100 border-blue-500';
      default: return 'from-slate-700 to-slate-800 text-slate-100 border-slate-600';
    }
  };

  const handleAdvocateMove = (advocateName: string, newLocation: string) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    
    setAdvocates(prev => prev.map(adv => {
      if (adv.name === advocateName) {
        const plat = PROPERTY_PLATS.find(p => p.name === newLocation);
        const platStr = plat ? ` [${plat.id}]` : '';
        
        const customStatuses: {[key: string]: string} = {
          "Señora Caos": `Deploying Convenience Triage at ${newLocation}`,
          "Std. Deviant": `Analyzing anomalies at ${newLocation}`,
          "Silas True Grit": `Building custom structures at ${newLocation}`,
          "Iron Gaze": `Securing coordinate perimeter at ${newLocation}`,
          "Metsy": `Patrolling turf borders at ${newLocation}`,
          "Barnaby the Cat": `Snoozing lazily at ${newLocation}`,
          "Buster": `Writing yard concurrency tickets at ${newLocation}`,
          "Sam": `Seeding premium crop matrix at ${newLocation}`,
          "Water-Barrel Wayne": `Brokering heavy B2B barters at ${newLocation}`
        };
        
        const newStatus = customStatuses[advocateName] || `Active at ${newLocation}`;
        
        setLogs(logs => [...logs, {
          id: Date.now().toString(),
          time: timeStr,
          source: 'SYSTEM',
          text: `📍 COORDINATE SHIFT: ${advocateName} was successfully reassigned to ${newLocation}${platStr}. Status updated: "${newStatus}"`,
          color: '#22c55e'
        }]);

        // Dynamic DB Sync relocation
        const advocateToDbUser: {[key: string]: string} = {
          "Señora Caos": "señora_caos",
          "Señora Caos's Loft": "señora_caos",
          "Std. Deviant": "standard_deviant_0",
          "The Standard Deviant": "standard_deviant_0",
          "Silas True Grit": "silas_truegrit",
          "Silas 'True Grit' Thorne": "silas_truegrit",
          "Iron Gaze": "iron_gaze",
          "The Iron Gaze": "iron_gaze",
          "Water-Barrel Wayne": "water_barrel_wayne",
          "Metsy": "metsy_smyrna",
          "Barnaby the Cat": "barnaby",
          "Buster": "buster",
          "Sam": "sam"
        };
        const dbUser = advocateToDbUser[advocateName] || advocateName.toLowerCase().replace(/[\s-]/g, '_');
        const sysId = personaDbMap[dbUser];
        if (sysId) {
          const host = window.location.protocol === "https:" 
            ? `${window.location.protocol}//${window.location.host}` 
            : `http://${window.location.hostname}:8096`;
          fetch(`${host}/api/personas/${sysId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deployment_zone: newLocation })
          }).catch(err => console.error("Failed to sync u_deployment_zone", err));
        }
        
        return { ...adv, location: newLocation, status: newStatus };
      }
      return adv;
    }));
  };

  const handleBarter = (type: 'surge' | 'lavender') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    if (type === 'surge') {
      const nextVal = Math.min(500, waterLevel + 25);
      setWaterLevel(nextVal);
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        time: timeStr,
        source: 'SYSTEM',
        text: `🧾 BARTER RECEIPT: Wayne exchanged 3x Vintage 1999 Surge Cans for Anvil & Twine Spool. Raw water reserve increased by 25 GAL. Current: ${nextVal} GAL.`,
        color: '#38bdf8'
      }]);
    } else {
      if (waterLevel < 50) {
        alert("Insufficient water reserves for Lavender Mist extraction!");
        return;
      }
      const nextVal = Math.max(0, waterLevel - 50);
      setWaterLevel(nextVal);
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        time: timeStr,
        source: 'SYSTEM',
        text: `🧾 BARTER RECEIPT: Wayne processed WeedStack Lavender Mist into 10x Soap-Scented Hot Dogs. Water reserve filtration cost: 50 GAL. Current: ${nextVal} GAL.`,
        color: '#fb923c'
      }]);
    }
  };

  // Filter dynamic list of advocates at active focused plat
  const focusedPlatRecord = PROPERTY_PLATS.find(p => p.id === focusedPlat);
  const deployedAdvocates = advocates.filter(adv => {
    if (!focusedPlatRecord) return false;
    return adv.location.toLowerCase().includes(focusedPlatRecord.name.toLowerCase().replace(' diagnostics', '').replace(' hardware', ''));
  });

  const renderLogText = (text: string) => {
    const match = text.match(/\[ASSET_BLAST:\s*([a-zA-Z0-9\-_]+)\/([a-zA-Z0-9\-_]+)\]/);
    if (match) {
      const advocate = match[1];
      const expression = match[2];
      return (
        <span className="inline-flex flex-col items-start gap-1 p-1 bg-black/45 rounded border border-white/10 mt-1">
          <img 
            src={`/avatars/${advocate}/${expression}.png`} 
            alt={advocate} 
            className="w-16 h-16 rounded border border-stone-500 object-cover bg-stone-900" 
          />
          <span className="text-[8px] font-mono text-slate-500">{advocate} ({expression})</span>
        </span>
      );
    }
    return text;
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden transition-all duration-300 ${
      theme === 'neon' ? 'bg-[#050811] text-slate-100' : 'bg-[#0B0E14] text-gray-200 p-6'
    }`} style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>
      
      {/* Dynamic scan styles */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes pulse-cyan {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── TOP HEADER PANEL ── */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 transition-all shrink-0 ${
        theme === 'neon' 
          ? 'border-b border-white/5 bg-[#090e1a]/85 backdrop-blur-md'
          : 'border-4 border-dashed border-[#b18a66] bg-[#1a120b] p-6 rounded-2xl mb-6 shadow-2xl relative'
      }`}>
        {theme === 'cardboard' && (
          <div className="absolute top-0 right-0 bg-[#d8b48f] text-[#3d2b1a] font-mono text-[9px] px-3 py-1 uppercase tracking-widest rounded-bl font-bold shadow-sm">
            Node: CLIO (.183) · Staged Matrix
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            theme === 'neon'
              ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8]'
              : 'bg-gradient-to-br from-[#854d0e] to-[#713f12] border-2 border-[#b18a66] text-[#fbbf24]'
          }`}>
            <Compass className={`w-6 h-6 animate-spin`} style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-[0.2em] font-mono ${
              theme === 'neon' ? 'text-slate-400' : 'text-[#d8b48f]'
            }`}>
              {theme === 'neon' ? 'Sovereign OS Cockpit' : 'Cardboard Sandbox'}
            </div>
            <h1 className={`text-lg font-black uppercase tracking-wider ${
              theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24] font-mono'
            }`}>
              Catnip Wars Control Desk
            </h1>
          </div>
        </div>

        {/* Dynamic theme and view selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab selections */}
          <div className={`flex rounded-xl p-1 shrink-0 ${
            theme === 'neon' ? 'bg-black/40 border border-white/10' : 'bg-black/60 border border-[#333]'
          }`}>
            {([['control', 'Control Desk'], ['forge', 'Card Forge'], ['lore', 'Zone Lore']] as const).map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeTab === id 
                    ? theme === 'neon'
                      ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20 shadow-lg'
                      : 'bg-[#fbbf24] text-black border border-[#fbbf24]'
                    : theme === 'neon'
                      ? 'text-slate-400 hover:text-white border border-transparent'
                      : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Theme Selector Toggle */}
          <div className={`flex rounded-xl p-1 shrink-0 ${
            theme === 'neon' ? 'bg-black/40 border border-white/10' : 'bg-black/60 border border-[#333]'
          }`}>
            <button
              onClick={() => setTheme('neon')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                theme === 'neon'
                  ? 'bg-[#38bdf8] text-[#050811] font-extrabold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sovereign Neon
            </button>
            <button
              onClick={() => setTheme('cardboard')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                theme === 'cardboard'
                  ? 'bg-[#fbbf24] text-black font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cozy Cardboard
            </button>
          </div>
        </div>
      </header>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'control' && (
        <div className={`flex-1 flex flex-col lg:flex-row min-h-0 relative ${theme === 'neon' ? 'p-6 gap-6' : 'gap-6'}`}>
          
          {/* PANEL A (LEFT): Smyrna Heights Spatial Plats Ledger (3 cols in neon, otherwise responsive) */}
          <div className={`shrink-0 flex flex-col h-full ${
            theme === 'neon' ? 'w-80' : 'lg:w-72'
          }`}>
            <div className={`flex-1 overflow-y-auto flex flex-col gap-3.5 p-3 rounded-2xl ${
              theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
            }`}>
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/5">
                <Sliders className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                  theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                }`}>
                  Spatial Plat Matrix
                </span>
              </div>

              {PROPERTY_PLATS.map(plat => {
                const isFocused = focusedPlat === plat.id;
                const platAdvocates = advocates.filter(a => a.location.toLowerCase().includes(plat.name.toLowerCase().replace(' diagnostics', '').replace(' hardware', '')));

                return (
                  <button
                    key={plat.id}
                    onClick={() => {
                      setFocusedPlat(plat.id);
                      setSelectedZone(plat.name === 'Gonzas Convenience' ? "Gonzo's Convenience" : plat.name);
                    }}
                    className={`flex flex-col gap-2.5 p-3.5 rounded-xl text-left border transition-all duration-200 ${
                      isFocused
                        ? theme === 'neon'
                          ? 'bg-[#38bdf8]/10 border-[#38bdf8]/35 shadow-lg'
                          : 'bg-[#fbbf24]/10 border-[#fbbf24] shadow-md'
                        : theme === 'neon'
                          ? 'bg-[#0b101f]/40 border-white/5 hover:bg-[#0f172a] hover:border-white/10'
                          : 'bg-[#16120e] border-[#b18a66]/30 hover:bg-[#1a1510] hover:border-[#b18a66]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                        isFocused
                          ? theme === 'neon'
                            ? 'text-[#38bdf8] border-[#38bdf8]/30 bg-[#38bdf8]/10'
                            : 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10'
                          : 'text-slate-400 border-white/10 bg-white/5'
                      }`}>
                        {plat.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plat.coordinates}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-white tracking-wide">
                        {plat.name}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-widest truncate">
                        {plat.stack}
                      </p>
                    </div>

                    {/* Tension rating indicator */}
                    <div className="w-full flex flex-col gap-1 mt-1">
                      <div className="flex justify-between items-center text-[8px] font-mono text-slate-500">
                        <span>TENSION LEVEL</span>
                        <span className={plat.tension > 75 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                          {plat.tension}%
                        </span>
                      </div>
                      <div className={`w-full h-1 rounded-full overflow-hidden bg-black/40 ${
                        theme === 'neon' ? 'border border-white/5' : 'border border-[#b18a66]/20'
                      }`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            plat.tension > 75 
                              ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                              : theme === 'neon'
                                ? 'bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9]'
                                : 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]'
                          }`}
                          style={{ width: `${plat.tension}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetry active advocates count */}
                    <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest border-t border-white/5 pt-2.5 flex justify-between w-full">
                      <span>ACTIVE ADVOCATES:</span>
                      <span className={platAdvocates.length > 0 ? 'text-[#22c55e] font-bold' : ''}>
                        {platAdvocates.length} staged
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL B (CENTER): Interactive World Map (5 cols) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`flex-1 flex flex-col min-h-0 relative p-4 rounded-2xl ${
              theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
            }`}>
              <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                  theme === 'neon'
                    ? 'text-[#38bdf8] bg-black/40 border-[#38bdf8]/20 shadow'
                    : 'text-[#a3e635] bg-emerald-950/40 border-emerald-900/30'
                }`}>
                  Live Satellite Feed (.183)
                </span>
              </div>

              {/* Dynamic Coordinate telemetry map grid selector */}
              <div className="absolute top-3 right-4 flex gap-2 z-10">
                {['Catnip Wars Open World', "Gonzo's Convenience", 'Anvil & Twine Hardware'].map(zone => (
                  <button
                    key={zone}
                    onClick={() => {
                      setSelectedZone(zone);
                      const mappedId = zone.includes('Gonzo') ? 'PLAT-01' : zone.includes('Anvil') ? 'PLAT-02' : 'PLAT-03';
                      setFocusedPlat(mappedId);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all border ${
                      selectedZone === zone 
                        ? theme === 'neon'
                          ? 'bg-[#38bdf8] text-[#050811] border-[#38bdf8] shadow'
                          : 'bg-[#fbbf24] text-black border-[#fbbf24]'
                        : theme === 'neon'
                          ? 'bg-black/60 text-slate-400 border-white/10 hover:text-white'
                          : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {zone === 'Catnip Wars Open World' ? 'Backyard' : zone.replace(' Hardware', '').replace(' Mart', '')}
                  </button>
                ))}
              </div>

              {/* Map Canvas viewport with Neon Grid overlay */}
              <div className={`flex-1 flex items-center justify-center p-2 relative overflow-hidden rounded-xl mt-8 transition-all ${
                theme === 'neon'
                  ? 'bg-[#0d0d1a] border border-[#38bdf8]/15 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]'
                  : 'bg-[#0d0d1a] border-2 border-white/5 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]'
              }`}>
                
                {/* Cyber Grid scanning overlay */}
                {theme === 'neon' && (
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:24px_24px] rounded-xl overflow-hidden z-0">
                    <div className="w-full h-[1.5px] bg-[#38bdf8]/15 shadow-[0_0_8px_rgba(56,189,248,0.4)] animate-[scan_8s_linear_infinite] absolute left-0" />
                  </div>
                )}

                <object 
                  ref={mapObjectRef}
                  data="/smyrna_heights_world_map.svg" 
                  type="image/svg+xml" 
                  className="w-full h-full max-h-[50vh] object-contain cursor-pointer transition-transform duration-500 hover:scale-[1.01] z-10"
                >
                  <div className="text-center py-20">
                    <ShieldAlert className="w-16 h-16 mx-auto text-amber-500 mb-4 animate-bounce" />
                    <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">Map Render Blocked</p>
                  </div>
                </object>
              </div>

              {/* Spatial Plat Telemetry HUD */}
              <div className={`mt-4 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                theme === 'neon'
                  ? 'border-white/5 bg-[#0b101f]/60'
                  : 'border-[#b18a66]/30 bg-[#16120e]'
              }`}>
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 animate-bounce ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Focused Spatial Region</div>
                    <div className="text-xs font-black text-white font-mono mt-0.5 uppercase tracking-wide">
                      {focusedPlatRecord ? `${focusedPlatRecord.name} (${focusedPlatRecord.id})` : selectedZone}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Staged Advocates: <span className="text-[#22c55e] font-bold">{deployedAdvocates.length} deployed</span>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL C (RIGHT): Advocate Command Matrix & Wayne's Barter Desk */}
          <div className="lg:w-96 shrink-0 flex flex-col gap-6 h-full overflow-y-auto">
            
            {/* Advocate command matrix list */}
            <div className={`flex flex-col p-4 rounded-2xl shrink-0 ${
              theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
            }`}>
              <div className="flex items-center gap-2 pb-2.5 border-b border-white/5 mb-3">
                <Users className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                  theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                }`}>
                  Advocate Command Matrix
                </span>
              </div>

              <div className="flex flex-col gap-3.5 max-h-[38vh] overflow-y-auto pr-1">
                {advocates.map(adv => (
                  <div key={adv.name} className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    theme === 'neon' 
                      ? 'bg-[#0b101f]/50 border-white/5' 
                      : 'bg-[#16120e] border-[#b18a66]/20'
                  }`}>
                    {/* Avatar Badge */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[10px] font-bold ${
                        theme === 'neon'
                          ? 'bg-[#38bdf8]/15 border-[#38bdf8]/35 text-[#38bdf8]'
                          : 'bg-[#a855f7]/15 border-[#a855f7]/35 text-[#a855f7]'
                      }`}>
                        {adv.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-white truncate max-w-[120px]">{adv.name}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest truncate">{adv.role.substring(0, 18)}</span>
                      </div>
                      
                      {/* Location selector dropdown */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">DEPLOY:</span>
                        <select
                          value={adv.location}
                          onChange={(e) => handleAdvocateMove(adv.name, e.target.value)}
                          className={`text-[9px] font-mono py-0.5 px-1.5 rounded outline-none border cursor-pointer ${
                            theme === 'neon'
                              ? 'bg-[#03060c] border-white/10 text-white focus:border-[#38bdf8]/60'
                              : 'bg-black/60 border-[#b18a66]/30 text-gray-200 focus:border-[#fbbf24]'
                          }`}
                        >
                          {PROPERTY_PLATS.map(plat => (
                            <option key={plat.id} value={plat.name}>{plat.name}</option>
                          ))}
                          <option value="Facebook">Facebook</option>
                          <option value="Twitter">Twitter</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Water-Barrel Wayne's Barter Desk */}
            <div className={`flex flex-col p-4 rounded-2xl shrink-0 ${
              theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
            }`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3.5">
                <div className="flex items-center gap-2">
                  <Coffee className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                  }`}>
                    Wayne's Barter Desk
                  </span>
                </div>
                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                  theme === 'neon' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-[#fbbf24] border border-[#fbbf24]/20'
                }`}>
                  500 GAL MAX
                </span>
              </div>

              {/* Water barrel volume metrics */}
              <div className={`p-3 rounded-xl mb-4 ${
                theme === 'neon' ? 'bg-[#03060c] border border-white/5' : 'bg-black/60 border border-[#b18a66]/20'
              }`}>
                <div className="flex justify-between items-center mb-1.5 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                  <span>Barrel Volume Reserve</span>
                  <span className={`font-black ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`}>
                    {waterLevel} GAL / 500 GAL
                  </span>
                </div>
                {/* Horizontal Volume Bar */}
                <div className="w-full h-2 rounded bg-black/40 overflow-hidden border border-white/5 relative">
                  <div 
                    className={`h-full rounded transition-all duration-500 ${
                      theme === 'neon'
                        ? 'bg-gradient-to-r from-cyan-400 to-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                        : 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]'
                    }`}
                    style={{ width: `${(waterLevel / 500) * 100}%` }}
                  />
                </div>
              </div>

              {/* Transaction trade links */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleBarter('surge')}
                  className={`w-full py-2.5 px-3 rounded-xl border font-mono text-[10px] uppercase font-bold flex items-center justify-between transition-all ${
                    theme === 'neon'
                      ? 'bg-transparent border-[#38bdf8]/30 hover:border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8]/5'
                      : 'bg-transparent border-[#fbbf24]/30 hover:border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" /> Surge to Spools
                  </span>
                  <span>+25 GAL</span>
                </button>

                <button
                  onClick={() => handleBarter('lavender')}
                  className={`w-full py-2.5 px-3 rounded-xl border font-mono text-[10px] uppercase font-bold flex items-center justify-between transition-all ${
                    theme === 'neon'
                      ? 'bg-transparent border-[#38bdf8]/30 hover:border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8]/5'
                      : 'bg-transparent border-[#fbbf24]/30 hover:border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5" /> Mist to Soap-Dogs
                  </span>
                  <span>-50 GAL</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── CARD FORGE TAB ── */}
      {activeTab === 'forge' && (
        <div className={`flex-1 flex flex-col lg:flex-row min-h-0 relative p-6 gap-6 ${theme === 'neon' ? 'bg-[#050811]' : ''}`}>
          {/* Card Preview Container */}
          <div className="flex flex-col items-center justify-center lg:w-96 shrink-0">
            <div className={`w-72 h-[420px] rounded-2xl p-4 border-4 flex flex-col justify-between relative overflow-hidden transition-all ${
              theme === 'neon'
                ? 'bg-[#080d19] border-[#38bdf8]/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:border-[#38bdf8]'
                : 'bg-[#1a120b] border-[#b18a66] shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:border-[#fbbf24]'
            }`}>
              {/* Textured overlay */}
              <div className="absolute inset-0 bg-[#d8b48f] opacity-[0.03] pointer-events-none" />
              <div className={`absolute top-0 right-0 text-[8px] font-mono px-2 py-0.5 border-l border-b uppercase tracking-widest font-bold ${
                theme === 'neon' ? 'bg-cyan-500/20 text-[#38bdf8] border-[#38bdf8]/20' : 'bg-[#b18a66]/20 text-[#d8b48f] border-[#b18a66]/30'
              }`}>
                NipStack TCG
              </div>

              {/* Header info */}
              <div className={`flex justify-between items-start border-b pb-1.5 ${
                theme === 'neon' ? 'border-white/5' : 'border-[#b18a66]/20'
              }`}>
                <div>
                  <h3 className={`text-sm font-bold font-mono leading-tight tracking-wider truncate max-w-[150px] ${
                    theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                  }`}>{cardName}</h3>
                  <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">{cardChar.substring(0, 15)}</span>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                  theme === 'neon' ? 'bg-cyan-500/10 text-[#38bdf8] border border-cyan-500/20' : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30'
                }`}>
                  {cardRarity}
                </span>
              </div>

              {/* Illustration container */}
              <div className="h-44 bg-black/60 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center my-2">
                <img 
                  src={avatarMap[cardChar.toLowerCase().replace(/[\s]/g, '_')] || `https://api.dicebear.com/7.x/initials/svg?seed=${cardChar}&backgroundColor=0f172a&textColor=ffffff`}
                  alt={cardChar}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${cardChar}&backgroundColor=0f172a&textColor=ffffff`; }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent opacity-80 ${
                  theme === 'neon' ? 'from-[#080d19]' : 'from-[#1a120b]'
                }`} />
              </div>

              {/* Attributes Bar */}
              <div className={`grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono my-1 border-y py-1 bg-black/40 rounded-lg ${
                theme === 'neon' ? 'border-white/5' : 'border-[#b18a66]/20'
              }`}>
                <div>
                  <div className="text-gray-500 uppercase tracking-wider text-[7px]">Atk</div>
                  <div className="font-bold text-red-400 text-xs">{cardAtk}</div>
                </div>
                <div className={`border-x ${theme === 'neon' ? 'border-white/5' : 'border-[#b18a66]/10'}`}>
                  <div className="text-gray-500 uppercase tracking-wider text-[7px]">Def</div>
                  <div className="font-bold text-blue-400 text-xs">{cardDef}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase tracking-wider text-[7px]">Agi</div>
                  <div className="font-bold text-emerald-400 text-xs">{cardAgi}</div>
                </div>
              </div>

              {/* Ability Box */}
              <div className="bg-black/50 border border-white/5 rounded-xl p-2.5 text-[9px] font-mono text-gray-300 min-h-[50px] leading-relaxed select-none">
                <span className={`font-bold uppercase text-[8px] tracking-wider block mb-0.5 ${
                  theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                }`}>Ability</span>
                {cardAbility || 'Empty trigger ability...'}
              </div>

              {/* Flavor text */}
              <div className="text-[8px] font-mono italic text-slate-500 text-center leading-tight truncate max-w-full">
                "{cardLore || 'No flavor text added yet.'}"
              </div>
            </div>
          </div>

          {/* Card Builder Form */}
          <div className="flex-1 overflow-y-auto">
            <div className={`p-6 rounded-2xl max-w-3xl ${
              theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                  <span className="font-mono text-xs uppercase font-bold text-gray-300">NipStack Card Builder</span>
                </div>
                <button
                  onClick={handleClearForgedCards}
                  className={`text-[9px] font-mono uppercase tracking-wider border px-2.5 py-1 rounded transition-all ${
                    theme === 'neon' 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                      : 'bg-red-950/20 border border-red-900/30 text-red-400'
                  }`}
                >
                  Reset Forge
                </button>
              </div>

              <form onSubmit={handleForgeCard} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Card Name</label>
                    <input 
                      type="text" 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)} 
                      required
                      placeholder="e.g. Backyard Zoomer" 
                      className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                        theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Rarity</label>
                    <select 
                      value={cardRarity} 
                      onChange={(e: any) => setCardRarity(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                        theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                      }`}
                    >
                      <option value="Common">Common</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Attack (1-10)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={cardAtk} 
                      onChange={(e) => setCardAtk(parseInt(e.target.value) || 1)} 
                      className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                        theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Defense (1-10)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={cardDef} 
                      onChange={(e) => setCardDef(parseInt(e.target.value) || 1)} 
                      className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                        theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Agility (1-10)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={cardAgi} 
                      onChange={(e) => setCardAgi(parseInt(e.target.value) || 1)} 
                      className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                        theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Character Association</label>
                  <select 
                    value={cardChar} 
                    onChange={(e) => setCardChar(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                      theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                    }`}
                  >
                    {advocates.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ability Trigger Text</label>
                  <textarea 
                    value={cardAbility} 
                    onChange={(e) => setCardAbility(e.target.value)} 
                    rows={2}
                    placeholder="e.g. Sour Splash: Deals 3 splash damage to all convenience competitors..."
                    className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                      theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Flavor Lore Text</label>
                  <input 
                    type="text" 
                    value={cardLore} 
                    onChange={(e) => setCardLore(e.target.value)} 
                    placeholder="e.g. A relic found buried in the mulch coordinates." 
                    className={`w-full rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all ${
                      theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-sans text-sm ${
                    theme === 'neon'
                      ? 'bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#050811] shadow-[#38bdf8]/10'
                      : 'bg-[#34d399] hover:bg-[#28b380] text-black'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Forge and Commit Card
                </button>
              </form>

              {/* List of Forged Cards */}
              {forgedCards.length > 0 && (
                <div className="mt-8 border-t border-white/5 pt-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Cardboard Forge Gallery ({forgedCards.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {forgedCards.map((c, i) => (
                      <div key={i} className={`border rounded-xl p-3 flex flex-col justify-between min-h-[140px] text-[10px] ${
                        theme === 'neon' ? 'bg-[#0b101f]/60 border-white/5' : 'bg-black/60 border border-[#b18a66]/20'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className={`font-bold truncate max-w-[130px] ${
                              theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'
                            }`}>{c.name}</span>
                            <span className="text-[8px] bg-white/5 border border-white/10 px-1 py-0.2 rounded uppercase">{c.rarity.substring(0, 3)}</span>
                          </div>
                          <div className="text-slate-500 uppercase tracking-wider text-[8px] mt-0.5">{c.character}</div>
                          <div className="text-slate-400 mt-2 line-clamp-2 leading-relaxed">"{c.ability}"</div>
                        </div>
                        <div className="flex gap-2 text-[8px] mt-2 border-t border-white/5 pt-1.5 font-bold text-slate-500 uppercase tracking-widest justify-between">
                          <span>ATK: {c.attack}</span>
                          <span>DEF: {c.defense}</span>
                          <span>AGI: {c.agility}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ZONE LORE TAB ── */}
      {activeTab === 'lore' && (
        <div className={`flex-1 overflow-y-auto p-6 ${theme === 'neon' ? 'bg-[#050811]' : ''}`}>
          <div className={`max-w-4xl mx-auto p-5 rounded-2xl ${
            theme === 'neon' ? 'bg-[#080d19] border border-white/5 shadow-2xl' : 'bg-[#1c120c] border-2 border-[#b18a66] shadow-xl'
          }`}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Compass className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
              <span className="font-mono text-xs uppercase font-bold text-slate-300">Focused Spatial Region Lore</span>
            </div>

            <div className="space-y-4">
              {advocates.map((p, i) => (
                <div key={i} className={`border rounded-xl p-4 space-y-3 transition-all ${
                  theme === 'neon' 
                    ? 'border-white/5 bg-[#0b101f]/60 hover:border-[#38bdf8]/30 shadow' 
                    : 'border-[#b18a66]/20 bg-black/40 hover:border-[#fbbf24]/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${
                      theme === 'neon'
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8]/35 text-[#38bdf8]'
                        : 'bg-[#a855f7]/15 border-[#a855f7]/35 text-[#a855f7]'
                    }`}>
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white leading-tight">{p.name}</h4>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">{p.role}</span>
                    </div>
                    <span className={`ml-auto text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      theme === 'neon' ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20' : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30'
                    }`}>
                      {p.cadence}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {p.bio}
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-[10px] font-mono p-2.5 rounded-lg border ${
                    theme === 'neon' ? 'bg-[#03060c]/60 border-white/5' : 'bg-white/5 border-white/5'
                  }`}>
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest text-[8px] block">Live Status</span>
                      <span className="text-[#a3e635] mt-0.5 block">{p.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest text-[8px] block">Location Link</span>
                      <span className="text-slate-300 mt-0.5 block truncate">{p.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER: Survelliance Matrix Log Feed & Narrative Prompt Injector ── */}
      {activeTab === 'control' && (
        <footer className={`px-6 py-4 transition-all shrink-0 ${
          theme === 'neon'
            ? 'border-t border-white/5 bg-[#090e1a]/85 backdrop-blur-md'
            : 'border-4 border-dashed border-[#b18a66] bg-[#1a120b] p-5 rounded-2xl mt-6 shadow-2xl relative'
        }`}>
          <div className="flex flex-col gap-4 max-w-7xl mx-auto">
            
            {/* Monospaced Log Feed */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className={`w-4 h-4 ${theme === 'neon' ? 'text-[#38bdf8]' : 'text-[#fbbf24]'}`} />
                <span className="font-mono text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  Continuous Biometric Log Feed
                </span>
              </div>
              <div 
                ref={feedRef} 
                className={`overflow-y-auto font-mono text-[10px] space-y-2 p-3.5 rounded-xl shadow-inner h-24 ${
                  theme === 'neon' ? 'bg-[#03060c] border border-white/5' : 'bg-black/60 border border-[#b18a66]/20'
                }`}
              >
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.01] py-0.5 rounded transition-colors">
                    <span className="text-slate-600 select-none">[{log.time}]</span>
                    <span className="font-bold select-none" style={{ color: log.color }}>
                      {log.source}:
                    </span>
                    <span className="text-slate-300 leading-relaxed">{renderLogText(log.text)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* HoloLink Asset Blast Panel */}
            <div className={`flex flex-col sm:flex-row gap-3.5 items-center p-3 rounded-xl border ${
              theme === 'neon' ? 'bg-black/40 border-white/5' : 'bg-black/60 border-[#b18a66]/20'
            }`}>
              <span className="text-[10px] font-bold text-slate-300 uppercase font-mono">📡 HoloLink Blast:</span>
              <div className="flex gap-2">
                <select 
                  value={blastAdvocate}
                  onChange={(e) => {
                    const nextAdv = e.target.value;
                    setBlastAdvocate(nextAdv);
                    const expressions = ADVOCATE_EXPRESSIONS[nextAdv] || [];
                    if (expressions.length > 0) {
                      setBlastExpression(expressions[0]);
                    }
                  }}
                  className={`text-[10px] font-mono rounded px-2 py-1 text-white outline-none ${
                    theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                  }`}
                >
                  {Object.keys(ADVOCATE_EXPRESSIONS).map(adv => (
                    <option key={adv} value={adv}>@{adv}</option>
                  ))}
                </select>
                <select
                  value={blastExpression}
                  onChange={(e) => setBlastExpression(e.target.value)}
                  className={`text-[10px] font-mono rounded px-2 py-1 text-white outline-none ${
                    theme === 'neon' ? 'bg-[#03060c] border border-white/10' : 'bg-black/60 border border-[#b18a66]/30'
                  }`}
                >
                  {(ADVOCATE_EXPRESSIONS[blastAdvocate] || []).map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => {
                  const blastMsg = `[ASSET_BLAST: ${blastAdvocate}/${blastExpression}]`;
                  const timeStr = new Date().toTimeString().split(' ')[0];
                  
                  // Post to room chatter backend
                  const body = {
                    room_id: 'smyrna_heights',
                    sender: '@system',
                    message: blastMsg
                  };
                  fetch('/api/public/room_chatter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  })
                    .catch(err => console.error("Error blasting asset:", err));

                  // Append to local logs
                  setLogs(prev => [...prev, {
                    id: Date.now().toString(),
                    time: timeStr,
                    source: 'SYSTEM',
                    text: blastMsg,
                    color: '#e879f9'
                  }].slice(-50));
                }}
                className={`w-full sm:w-auto px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'neon'
                    ? 'bg-purple-500 hover:bg-purple-600 text-white font-extrabold shadow-purple-500/15'
                    : 'bg-purple-600 hover:bg-purple-700 text-white font-extrabold'
                }`}
              >
                Blast
              </button>
            </div>

            {/* Narrative Prompt Injector & Deploy Actions */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-center">
              <div className="flex-1 w-full relative">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeployPrompt()}
                  placeholder="Infect emerging sighting narrative... (e.g. Metsy has successfully discovered a new lawn stash near Timberland SE)"
                  className={`w-full rounded-xl pl-4 pr-12 py-2.5 text-xs text-white outline-none transition-all ${
                    theme === 'neon' 
                      ? 'bg-[#03060c] border border-white/10 focus:border-[#38bdf8]/60 placeholder-slate-600' 
                      : 'bg-black/60 border border-[#b18a66]/30 focus:border-[#fbbf24] placeholder-gray-600 font-mono'
                  }`}
                />
                <button
                  onClick={handleDeployPrompt}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Cyan Solid Action Handle */}
              <button
                onClick={handleDeployPrompt}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'neon'
                    ? 'bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#050811] font-extrabold shadow-[#38bdf8]/15'
                    : 'bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-extrabold'
                }`}
              >
                <span>Deploy Narrative</span>
              </button>
            </div>

          </div>
        </footer>
      )}

    </div>
  );
}
