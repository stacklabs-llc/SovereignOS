import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, ShieldAlert, CheckCircle, ArrowRight, Play, Cpu, AlertTriangle, HelpCircle, Plus, Trash2, Upload, FileImage, Users } from 'lucide-react';
import { PromptMacroMatrix } from './BrandIntake';

interface BrandPreset {
  name: string;
  barQuestion: string;
  audience: string;
  conviction: string;
  rivals: string;
  aesthetic: string;
  feeds: string[];
  extraLore: string;
  websitePurpose?: string;
  websiteDomain?: string;
  websitePages?: string;
  websiteFeatures?: string;
  websiteColors?: string;
  websiteTypography?: string;
  websiteAdditionalRequirements?: string;
}

const PRESETS: Record<string, BrandPreset> = {
  weedstack: {
    name: "WeedStack",
    barQuestion: "WeedStack is a premium, highly-opinionated and regulatory-conscious cannabis brand. At the bar, it orders a CBD-infused craft IPA and a plate of locally sourced truffle fries. On the jukebox, it plays 90s classic hip-hop and lo-fi beats, and it spends the entire night lecturing the bartender about metrc compliance, terpene profiles, and why organic living soil is a civilizational necessity.",
    audience: "Connoisseurs, regulatory advocates, craft growers, and modern lifestyle consumers.",
    conviction: "Organic living soil and full Metrc transparency are non-negotiable foundations of a premium life.",
    rivals: "Monolithic, corporate multi-state operators (MSOs) producing mass-market pesticide weed.",
    aesthetic: "glassmorphic, earthy green, premium, organic, neon",
    feeds: ["METRC", "Certificate of Analysis", "Terpene Matrix", "Reddit r/trees", "Local Dispensary Sales"],
    extraLore: "A hidden undercurrent of anti-establishment sentiment disguised as absolute regulatory compliance.",
    websitePurpose: "Offer a high-end educational portal detailing our living-soil organic botany methods, Metrc compliance rules, and product line.",
    websiteDomain: "weedstack.com",
    websitePages: "Home, Science (Living Soil), METRC Diagnostics, Product Showrooms, Dispensary Finder, Legal/Disclaimer.",
    websiteFeatures: "Dynamic batch test lookups, interactive terpene profiling wheels, real-time Metrc tracking integration.",
    websiteColors: "Deep Living-Soil Charcoal background (#111119), vibrant Emerald Green (#10b981) accents, premium gold typography highlights.",
    websiteTypography: "Outfit (headings, sleek neo-grotesque) and Inter (highly readable UI body text).",
    websiteAdditionalRequirements: "Mobile-first responsive grids, zero page-loading lag, glassmorphic card overlays, full accessibility/ADA compliance."
  },
  aethervet: {
    name: "Aether Vet",
    barQuestion: "AETHER Veterinary Care of Smyrna, GA is a warm, highly dedicated, and opinionated local clinic. At the bar, it orders a bowl of fresh milk for the cats, a craft Georgia peach cider for the staff, and plays 90s classic rock and folk acoustic tracks on the jukebox while lecturing the locals about gentle, compassionate animal care and Smyrna Catnip Wars syndicate operations.",
    audience: "Caring pet owners, Smyrna community members, local feline operations, and animal lovers.",
    conviction: "Every patient must be treated with the highest level of compassionate medicine and loving attention, as if they were our own pet.",
    rivals: "Sterile, corporate veterinary chains that prioritize high transaction volume over personalized care.",
    aesthetic: "cozy, teal-gradient, organic, warm, glassmorphic",
    feeds: ["AetherVet Metsy Tracker", "Kitchen Telemetry", "Catnip Syndicate Sandbox Triggers"],
    extraLore: "Greta is secretly in cahoots with the Smyrna Catnip Wars syndicate, smuggling veterinary-grade calming pheromones and Battle Cones using keycard access.",
    websitePurpose: "Provide Smyrna pet owners with a dedicated, reassuring platform to request vet appointments and read secure feline health logs.",
    websiteDomain: "aethervet.com",
    websitePages: "Home (Our Promise), Our Smyrna Team, Veterinary Services, Smyrna Catnip Wars Portal, Request Consultation.",
    websiteFeatures: "Secure triage request wizard, dynamic advocate availability list, Smyrna Catnip Wars crossover card-stats deck.",
    websiteColors: "Deep forest dark teal background (#091c1d), crisp soothing mint accents (#2dd4bf), bright warning orange highlights.",
    websiteTypography: "Outfit (clean welcoming headings) and Inter (highly readable triage instructions).",
    websiteAdditionalRequirements: "Emergency click-to-dial floating button, fully responsive mobile flexboxes, interactive FAQs."
  },
  inkwellirony: {
    name: "Inkwell & Irony Investigations",
    barQuestion: "Inkwell & Irony Investigations is a highly premium, noir-themed private detective agency. At the bar, it orders a double rye whiskey, neat, and a single black coffee. On the jukebox, it plays 1940s smoky lounge jazz and melancholy saxophone ballads. It spends the entire night lecturing the bartender about wiretap transcripts, missing heiresses, and why a physical typewriter is a civilizational necessity.",
    audience: "Noir enthusiasts, detective fiction fans, corporate threat intelligence officers, and lovers of vintage investigator aesthetics.",
    conviction: "Every case has a thread, and only analog methods and hard-nosed deductive reasoning can untangle it; digital shortcuts are just lazy screens.",
    rivals: "High-tech corporate cybersecurity cartels using generic machine learning algorithms to automate investigations.",
    aesthetic: "noir, monochrome, smoky, vintage, brass-glow, typewriter",
    feeds: ["AetherVet Metsy Tracker", "Catnip Syndicate Sandbox Triggers"],
    extraLore: "A hidden undercurrent of vintage radio drama, double-crosses, and local Smyrna-based micro-wiretapping networks.",
    websitePurpose: "A retro high-end portal detailing our vintage detective agency methods, staged dossiers, and surveillance tape deck.",
    websiteDomain: "inkwellirony.com",
    websitePages: "Home (Agency Office), Active Case Dossiers, Noir Jukebox (Tape Deck), Request Consultation (Leave a Tip).",
    websiteFeatures: "Surveillance Tape Deck media player, Interactive Case File Drag-and-Drop Loader, Smyrna Wiretap Feed splice widgets.",
    websiteColors: "Smoky Void Black (#0B0E14), Classic Brass-glow highlights (#d4af37), monochrome slate typography.",
    websiteTypography: "Courier Prime (typewriter aesthetic headings) and Inter (highly readable case logs).",
    websiteAdditionalRequirements: "Smoky glassmorphic cards, typewriter micro-animations, full keyboard-only navigation options."
  },
  lenora: {
    name: "Lenora's Educational Swarm",
    barQuestion: "If Lenora's Educational Swarm walked into a local neighborhood bar, it would look like a magical, clockwork cardboard treehouse popping to life in a dark tavern. Celeste, a glowing unicorn princess principal, sits in a corner booth sprinkling sparkling dust on a glass of warm milk, while Pip, a brass-geared clockwork squirrel, rapidly counts acorns at the counter and lectures the bartender about place values. Scribble & Quill, Dr. Flora Fern, Captain Atlas, and Melody the Hearth Fairy sit around a wooden table, drawing custom treasure maps and discussing life cycles of forest butterflies, completely transforming the room into a vibrant, high-fidelity playground of early childhood imagination.",
    audience: "Lenora (7-year-old niece) and early childhood curriculum students.",
    conviction: "Learning is an active daily adventure; children's natural curiosity and imagination are the strongest fuel for intellectual growth.",
    rivals: "Dull, standardized testing regimens and uninspired cloud-based worksheets that turn education into a digital chore.",
    aesthetic: "premium, flat-vector, child-friendly, colorful, cardboard-treehouse, magical",
    feeds: [],
    extraLore: "PRIVATE KEY: 'The Swarm Protocol'. Secretly operating under the supervision of Curriculum Director Allyson. Barter exchange ratios: 1 completed math puzzle = 1 magical unicorn side-quest token.",
    websitePurpose: "A magical, gamified early childhood learning dashboard and parent curriculum management console.",
    websiteDomain: "lenoraswarm.local",
    websitePages: "Home (Adventure Map), Parent Dashboard, Subject Portals (Spelling, Math, Science, Geography, Art, Daydreaming).",
    websiteFeatures: "Curriculum calendar, daydream allocation slider dial, custom spelling word list input, secure student portal, HTML5 learning mini-apps.",
    websiteColors: "Cozy Treehouse Cardboard Brown background (#1e140f), vibrant Sky Blue accents (#0ea5e9), pastel Lavender and Unicorn Pink highlight glows.",
    websiteTypography: "Outfit (cheerful, rounded headings) and Inter (highly legible instructions).",
    websiteAdditionalRequirements: "Perfect iPad tablet responsive grid layout, simple touch controls, beautiful micro-animations for stickers and stars, zero loading lag."
  },
  wildpaws: {
    name: "Wild Paws & Rusty Canvas Art Rescue",
    barQuestion: "If Wild Paws & Rusty Canvas Art Rescue walked into a local neighborhood bar, it would kick the doors wide open. It's a tough, warm-hearted Smyrna local who orders a cold, sweet Moscato at the bar and drops a quarter in the jukebox to play CCR's 'Fortunate Son' and 'Bad Moon Rising'. Wearing paint-splattered denim, a leather tool belt, and an old dog leash over her shoulder, she sits at a rustic wooden table surrounded by unruly rescue dogs and half-finished oil paintings of local wildlife. She's the kind of advocate who breaks up dogfights with a whistle, kicks corporate assholes to the curb, and sells premium charcoal sketches to fund vet bills, keeping the sanctuary completely self-sufficient and independent.",
    audience: "Animal lovers, rustic art collectors, Smyrna community members, and rescue advocates.",
    conviction: "Every stray animal deserves a badass advocate and a safe canvas; we fund our compassion with hard-nosed, beautiful craftsmanship, not empty corporate donations.",
    rivals: "Sterile, corporate shelter syndicates that treat animals like ledger items, and snooty high-art galleries that look down on dog hair and sawdust.",
    aesthetic: "rustic, wood-grain, acrylic-splatter, warm-amber, tough-love, vintage-ccr",
    feeds: ["AetherVet Metsy Tracker", "Catnip Syndicate Sandbox Triggers", "Local Critic Reviews"],
    extraLore: "PRIVATE KEY: 'The Moscato Protocol'. Secretly in alliance with Greta at the AetherVet clinic to bypass bureaucratic keycard logs and secure calming pheromones for high-stress rescues.",
    websitePurpose: "A sanctuary intake dashboard, community noticeboard, and live art auction marketplace where paintings fund active rescues.",
    websiteDomain: "wildpawsrescue.org",
    websitePages: "Home (The Sanctuary), Adoptable Strays, The Rusty Canvas Gallery (Art Auctions), Success Stories, Volunteer/Sponsor.",
    websiteFeatures: "Real-time art bidding console, CCR Jukebox ambient audio player, AetherVet partner API telemetry, volunteer sign-up wizard.",
    websiteColors: "Smoky Charcoal Black (#0f0f12), Rich Amber Wood-Grain highlights (#d97706), splattered Acrylic Orange and Teal accents.",
    websiteTypography: "Outfit (bold rustic headings) and JetBrains Mono (tactile terminal and ledger look).",
    websiteAdditionalRequirements: "Fully responsive mobile card layouts, high-resolution gallery zoom modal grids, rustic canvas borders, custom animal badge badges."
  },
  gonzas: {
    name: "Gonzas Convenience Store & Cantina",
    barQuestion: "A grease-painted toon-rabbit dressed in a grease-stained apron slinks in, orders a pint of high-fructose corn syrup with a pickle chaser, and plays a loud cartoon slide-whistle sound effect on the jukebox. Within seconds, he picks a rubbery, physics-defying fight with his own shadow over who left the milk freezer door open, before pulling the bartender into a corner to trade a half-eaten carrot for three expired lottery tickets.",
    audience: "Smyrna community members, toon enthusiasts, late-night snackers, and local advocates.",
    conviction: "Toon logic and 24/7 convenience store convenience always triumph over traditional corporate rigidity.",
    rivals: "Monolithic, corporate supermarket chains and boring franchise policies.",
    aesthetic: "Unhinged Feltboard - Thick Felt Outlines, Cozy Cardboard, Retro Toon",
    feeds: ["AetherVet Metsy Tracker", "Catnip Syndicate Sandbox Triggers", "Local Critic Reviews"],
    extraLore: "The Gonzo's Convenience ecosystem utilizes the Catnip Wars Crossover Protocol to synchronize dialogue matrices and card-stats crossovers between the convenience store advocates and the 16-bit metsy-prime Pi 3 card kiosk card decks.",
    websitePurpose: "A retro toon-style convenience store portal and community noticeboard.",
    websiteDomain: "gonzas.com",
    websitePages: "Home (Storefront), Cantina Menu, Cereal Aisle Notes, Catnip Wars Crossover Portal, Request Delivery.",
    websiteFeatures: "Real-time toon slide-whistle soundboard, dynamic checkout lottery picker, Smyrna Heights alley maps.",
    websiteColors: "Cozy Cardboard Brown (#1e140f), vibrant Unhinged Magenta (#ff007f) accents, bright felt yellow highlights.",
    websiteTypography: "Outfit (playful rounded headings) and Inter (highly readable text).",
    websiteAdditionalRequirements: "Perfect iPad tablet responsive grid layout, simple touch controls, beautiful micro-animations, zero loading lag."
  },
  stacklabs: {
    name: "StackLabs LLC",
    barQuestion: "A tight-jawed systems architect steps out of a hum-cooled bare-metal server vault. He walks straight past the flashing neon signs, sits at a heavy cast-iron counter, and orders a double shot of pure black espresso over local spring water. When the bartender asks about cloud integration, the architect slams down a rugged, oil-stained schematic diagram of a standalone local mini PC cluster, coldly stating: 'The cloud is just someone else's expensive computer you can't touch. We mix our software like premium whiskey: local, pure, and barrel-aged on bare metal. The fire doesn't burn us, it TEMPERS US.'",
    audience: "Systems engineers, renegade compliance officers, and bare-metal decentralist builders.",
    conviction: "Local bare-metal monoliths and strict systems invariants will inherit the earth.",
    rivals: "Cloud monopoly giants and flimsy corporate apologies.",
    aesthetic: "Corporate Slate & Sovereign Cyan - Matte Steel, Frosted Glass, Digital Cyan",
    feeds: ["SDLC Ticket Firehose", "Reddit Banter Sweep", "Hardware Watchdog Telemetry"],
    extraLore: "Strict compliance to the Sovereign OS Canonical Path Law and Ollama CPU/Memory boundaries.",
    websitePurpose: "Provide a monospaced dashboard displaying active bare-metal build processes, hardware telemetry, and SDLC ticketing status.",
    websiteDomain: "stacklabs.io",
    websitePages: "Home, Build Forge, System Telemetry, SDLC Backlog, Compliance Audits, Contact Sysop.",
    websiteFeatures: "Monospaced terminal logs, real-time CPU/RAM gauge widgets, fast webhook deploy hooks.",
    websiteColors: "Slate dark background (#090d16), vibrant Sovereign Cyan (#00d4ff) accents, clean white terminal text.",
    websiteTypography: "JetBrains Mono (monospaced code and terminals) and Inter (highly readable docs).",
    websiteAdditionalRequirements: "Mobile-first responsive grids, zero page-loading lag, strict monospace layout, no external asset dependencies."
  }
};

const FEEDS_OPTIONS = [
  "METRC Compliance",
  "Certificate of Analysis",
  "Terpene Matrix",
  "AetherVet Metsy Tracker",
  "Reddit r/trees",
  "Local Dispensary Sales",
  "Kitchen Telemetry",
  "Local Critic Reviews",
  "Catnip Syndicate Sandbox Triggers",
  "Statcast Pitch Velocity"
];

export default function StackSeeder() {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [brandName, setBrandName] = useState('');
  const [barQuestion, setBarQuestion] = useState('');
  const [audience, setAudience] = useState('');
  const [conviction, setConviction] = useState('');
  const [rivals, setRivals] = useState('');
  const [aesthetic, setAesthetic] = useState('');
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [extraLore, setExtraLore] = useState('');
  const [entropyLevel, setEntropyLevel] = useState<number>(5);
  const [generateAvatars, setGenerateAvatars] = useState(false);
  const [realHumanRenders, setRealHumanRenders] = useState(false);
  const [seedCustomJukebox, setSeedCustomJukebox] = useState(false);
  const [activeSeederTab, setActiveSeederTab] = useState<'brand' | 'advocates' | 'aesthetic' | 'website' | 'pipeline' | 'archives'>('brand');
  const [holodexPreviewTab, setHolodexPreviewTab] = useState<'preview' | 'wireframe'>('preview');
  const [mockBidPrice, setMockBidPrice] = useState<number>(250);
  const [mockBidCount, setMockBidCount] = useState<number>(14);
  const [mockPlayingJukebox, setMockPlayingJukebox] = useState<boolean>(false);

  // Proposed Website Blueprint States
  const [websitePurpose, setWebsitePurpose] = useState('');
  const [websiteDomain, setWebsiteDomain] = useState('');
  const [websitePages, setWebsitePages] = useState('');
  const [websiteFeatures, setWebsiteFeatures] = useState('');
  const [websiteColors, setWebsiteColors] = useState('');
  const [websiteTypography, setWebsiteTypography] = useState('');
  const [websiteAdditionalRequirements, setWebsiteAdditionalRequirements] = useState('');

  // Heel Turn Protocol States
  const [enableHeel, setEnableHeel] = useState<boolean>(false);
  const [heelName, setHeelName] = useState('');
  const [heelHandle, setHeelHandle] = useState('');
  const [heelTrait, setHeelTrait] = useState('');
  const [heelHeresyStance, setHeelHeresyStance] = useState('');
  const [heelVolatility, setHeelVolatility] = useState<number>(1.0);

  // Raw Media & Brand Asset Upload States
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retooled Brand Aesthetic Engine States
  const [aestheticMode, setAestheticMode] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [selectedAestheticPreset, setSelectedAestheticPreset] = useState<string>('cozy');
  const [customAestheticText, setCustomAestheticText] = useState('');
  const [uploadedAesthetic, setUploadedAesthetic] = useState<string | null>(null);
  const [aestheticFileName, setAestheticFileName] = useState<string>('');
  const aestheticInputRef = useRef<HTMLInputElement>(null);

  const handleAestheticFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAestheticFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedAesthetic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Advocate Blueprint Related List States
  const [customRosterMode, setCustomRosterMode] = useState(false);
  const [customRoster, setCustomRoster] = useState<Array<{ name: string; role: string; trait: string; avatarEmoji: string }>>([
    { name: 'Dr. Rox', role: 'Chief Veterinary Officer (AetherVet)', trait: 'Pragmatic, medically precise, highly protective of cats', avatarEmoji: '🩺' },
    { name: 'Vet Tech Sarah', role: 'Lead Triage Technician', trait: 'Over-caffeinated, talks to animals in baby voice', avatarEmoji: '🐱' },
    { name: 'Vet Tech Dave', role: 'Anesthesia Coordinator', trait: 'Deadpan humor, vintage rock fan, extremely meticulous', avatarEmoji: '💉' },
    { name: 'Rando Client', role: 'Fretful Cat Owner', trait: 'WebMD expert, hyper-anxious about dry nose', avatarEmoji: '🙀' },
    { name: 'Buster', role: 'Local Security Canine Mascot', trait: 'Assertive, small dog complex, alert sweep specialist', avatarEmoji: '🐕' }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomAdvocate = () => {
    setCustomRoster(prev => [
      ...prev,
      { name: '', role: '', trait: '', avatarEmoji: '👤' }
    ]);
  };

  const handleRemoveCustomAdvocate = (index: number) => {
    setCustomRoster(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateCustomAdvocate = (index: number, field: string, value: string) => {
    setCustomRoster(prev => prev.map((adv, idx) => {
      if (idx === index) {
        return { ...adv, [field]: value };
      }
      return adv;
    }));
  };



  // AI drafting states
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');

  // Submission / Terminal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [creationStep, setCreationStep] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Completion states
  const [isComplete, setIsComplete] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string>('');

  useEffect(() => {
    if (resultData && resultData.domain) {
      if (resultData.pdf_path) {
        setPdfPath(resultData.pdf_path);
        return;
      }
      const token = localStorage.getItem('sovereign_session_token');
      fetch(`/api/brand/pdf_path?domain=${encodeURIComponent(resultData.domain)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.pdf_path) {
            setPdfPath(data.pdf_path);
          } else {
            setPdfPath(`/home/james/sovereign_inbox/reports/${resultData.domain}_Seeding_Report.pdf`);
          }
        })
        .catch(err => {
          console.error('Failed to fetch pdf path:', err);
          setPdfPath(`/home/james/sovereign_inbox/reports/${resultData.domain}_Seeding_Report.pdf`);
        });
    }
  }, [resultData]);

  // Apply Preset
  const handleApplyPreset = (key: string) => {
    setSelectedPreset(key);
    if (!key) return;
    const p = PRESETS[key];
    setBrandName(p.name);
    setBarQuestion(p.barQuestion);
    setAudience(p.audience);
    setConviction(p.conviction);
    setRivals(p.rivals);
    setAesthetic(p.aesthetic);
    setSelectedFeeds(p.feeds);
    setExtraLore(p.extraLore);
    
    setWebsitePurpose(p.websitePurpose || '');
    setWebsiteDomain(p.websiteDomain || '');
    setWebsitePages(p.websitePages || '');
    setWebsiteFeatures(p.websiteFeatures || '');
    setWebsiteColors(p.websiteColors || '');
    setWebsiteTypography(p.websiteTypography || '');
    setWebsiteAdditionalRequirements(p.websiteAdditionalRequirements || '');

    if (key === 'aethervet') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: 'Dr. Roxie Payton (Dr. Roxy)', role: 'Lead Clinician & Founder (aether_drroxy)', trait: 'Pragmatic, UGA DVM 1983, bowler, fixes animals', avatarEmoji: '🩺' },
        { name: 'Sylvia', role: 'Practice Manager (aether.sylvia)', trait: 'Spain travel enthusiast, loves dog Shelby & cat Cali', avatarEmoji: '📋' },
        { name: 'Greta', role: 'Assistant Manager (catnip_greta)', trait: 'Cat whisperer, secretly in cahoots with Smyrna Catnip syndicate', avatarEmoji: '🐱' },
        { name: 'Abner', role: 'Veterinary Assistant (abner_aether_craft)', trait: 'Sci-fi fan, designs hand-crafted leather wallets', avatarEmoji: '💼' },
        { name: 'Anya', role: 'Customer Service Representative (aetheranya)', trait: 'Warm, empathetic rescue kitty advocate', avatarEmoji: '💬' }
      ]);
      setSeedCustomJukebox(false);
    } else if (key === 'inkwellirony') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: 'Ed Haskins', role: 'Lead Detective (ed_haskins)', trait: 'Sharp, dry-witted, cigarette-smoking gumshoe investigator', avatarEmoji: '🕵️‍♂️' },
        { name: 'Dolores Vance', role: 'Suave Partner (dolores_vance)', trait: 'Empathetic, brilliant codebreaker, keeps the office running', avatarEmoji: '💼' },
        { name: 'Roger Rhymer', role: 'Animated Chaos (roger_rhymer)', trait: 'Hyperactive, cartoon-logic rabbit consultant, unpredictable', avatarEmoji: '🐰' },
        { name: 'Vesper Toon', role: 'Glamorous Singer (vesper_toon)', trait: 'Sultry cabaret chanteuse, key source of downtown intelligence', avatarEmoji: '🎤' },
        { name: 'Officer Clunky', role: 'Clumsy Toon Guard (officer_clunky)', trait: 'Bumbling police liaison, constantly dropping keys', avatarEmoji: '🚓' }
      ]);
      setSeedCustomJukebox(true);
    } else if (key === 'lenora') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: "Scribble & Quill", role: "Phonics Explorer (scribble_quill)", trait: "Magical inkwell and feather pen duo weaving vocabulary into stories", avatarEmoji: "📚" },
        { name: "Pip the Squirrel", role: "Steampunk Math Guide (clockwork_pip)", trait: "Squirrel using brass cogs and coins to teach calculations", avatarEmoji: "🔢" },
        { name: "Dr. Flora Fern", role: "Eco-Explorer Science Mentor (flora_fern)", trait: "Adventurous scientist exploring lifecycles and weather patterns", avatarEmoji: "🌿" },
        { name: "Captain Atlas", role: "Globe Explorer History Guide (captain_atlas)", trait: "Intrepid pilot using maps to teach geography and community", avatarEmoji: "🗺️" },
        { name: "Melody the Fairy", role: "Hearth & Heart Mentor (melody_fairy)", trait: "Gentle fairy using paints and drums for fine motor skills", avatarEmoji: "💖" },
        { name: "Celeste", role: "Imaginary Adventures Principal (celeste_fantasy)", trait: "Magical unicorn custodian transforming daydreams into fuel", avatarEmoji: "🦄" }
      ]);
      setSeedCustomJukebox(false);
      setSelectedAestheticPreset('vector');
      setEntropyLevel(6);
    } else if (key === 'wildpaws') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: "Barb the Founder", role: "Director & Lead Artist (barb_founder)", trait: "Fierce animal advocate who paints canvases and plays CCR", avatarEmoji: "👩‍🎨" },
        { name: "Jack the Carpenter", role: "Lead Builder & Framer (jack_carpenter)", trait: "Woodworker framing canvases out of reclaimed barn wood", avatarEmoji: "🪚" },
        { name: "Doc Wheeler", role: "Sanctuary Triage Vet (doc_wheeler)", trait: "UGA DVM consultant providing custom triage and waitlist bypasses", avatarEmoji: "🩺" },
        { name: "Jukebox Jesse", role: "Jukebox Custodian (jukebox_jesse)", trait: "Mechanic managing CCR audio and speaker wire layouts", avatarEmoji: "🎸" },
        { name: "Moscato Sally", role: "Art Gallery Curator (moscato_sally)", trait: "Gallery coordinator offering sweet Moscato to canvas buyers", avatarEmoji: "🍷" },
        { name: "Buster the Brawler", role: "Sanctuary Enforcer (buster_brawler)", trait: "Tough security volunteer breaking up fights and keeping order", avatarEmoji: "🐕" }
      ]);
      setSeedCustomJukebox(true);
      setSelectedAestheticPreset('rustic');
      setEntropyLevel(7);
    } else if (key === 'gonzas') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: "Señora Caos", role: "Franchise Owner (señora_caos)", trait: "Unhinged toon-logic cat wrangler and manager", avatarEmoji: "🐱" },
        { name: "Just Asking Questions", role: "Persistent Heckler (just_askingquestions)", trait: "Asks annoying questions about Soda Fountains", avatarEmoji: "🐰" },
        { name: "Static Shock", role: "CRT Repair Tech (static_shock)", trait: "Interjects static override codes and CRT warnings", avatarEmoji: "⚡" },
        { name: "Cryptic Courier", role: "Delivery Nomad (cryptic_courier)", trait: "Knows every secret alleyway in Smyrna Heights", avatarEmoji: "📦" },
        { name: "Greasy Ghost", role: "Aisle 4 Specter (greasy_ghost)", trait: "Complains about oil temperature", avatarEmoji: "👻" }
      ]);
      setSeedCustomJukebox(true);
      setSelectedAestheticPreset('cozy');
      setEntropyLevel(11);
    } else if (key === 'stacklabs') {
      setCustomRosterMode(true);
      setCustomRoster([
        { name: "Sysop Barker", role: "Lead Architect (sysop_barker)", trait: "Strict monolith rules, hates the cloud", avatarEmoji: "💻" },
        { name: "Barf Prime", role: "Creative Agitator (barf_prime)", trait: "Manic beats, wraps telemetry in rap", avatarEmoji: "🎤" },
        { name: "Mando Enforcer", role: "Compliance Sentinel (mando_enforcer)", trait: "Zero tolerance for lazy setups", avatarEmoji: "🛡️" },
        { name: "Six Dinner Inventor", role: "Analog Engineer (six_dinner_inventor)", trait: "Eccentric hardware-telemetry bridge builder", avatarEmoji: "🔧" },
        { name: "Trop Fan", role: "Sabermetrician (trop)", trait: "Cold calculations, spin rate tracker", avatarEmoji: "📊" },
        { name: "Abner", role: "Veterinary Archivist (abner_aether_craft)", trait: "Quiet authority, tracks physical capsules", avatarEmoji: "📁" }
      ]);
      setSeedCustomJukebox(false);
      setSelectedAestheticPreset('vector');
      setEntropyLevel(2);
    } else {
      setCustomRosterMode(false);
      setSeedCustomJukebox(false);
    }
  };

  // Draft with AI
  const handleDraftWithAI = async () => {
    if (!barQuestion) {
      setDraftError('Please enter a response to the Bar Question first.');
      return;
    }
    setIsDrafting(true);
    setDraftError('');
    try {
      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/brand/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ bar_question: barQuestion })
      });
      if (!res.ok) throw new Error('Failed to draft brand settings.');
      const data = await res.json();
      if (data.audience) setAudience(data.audience);
      if (data.conviction) setConviction(data.conviction);
      if (data.rivals) setRivals(data.rivals);
      if (data.aesthetic) setAesthetic(data.aesthetic);
    } catch (err: any) {
      setDraftError(err.message || 'Error occurred while calling Vertex AI.');
    } finally {
      setIsDrafting(false);
    }
  };

  // Feed Toggle
  const toggleFeed = (feed: string) => {
    setSelectedFeeds(prev =>
      prev.includes(feed) ? prev.filter(f => f !== feed) : [...prev, feed]
    );
  };

  // Submit Seeding
  const handleSeedStack = async () => {
    if (!brandName || !barQuestion) {
      alert('Brand Name and Bar Question are required.');
      return;
    }
    setIsSubmitting(true);
    setLogs([]);
    setCreationStep(1);

    const addLog = (msg: string, delay = 800) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setLogs(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    await addLog('⚡ initializing Sovereign OS Genesis Protocol...');
    await addLog('🛰️ connecting to Enterprise Vertex AI Swarm...');
    setCreationStep(2);
    await addLog('🧠 stage 1/8: ingesting Bar Question DNA...');
    await addLog(`[GENESIS] Brand detected: "${brandName}"`);
    
    if (uploadedLogo) {
      await addLog(`[GENESIS] Custom Brand Logo asset verified: "${logoFileName}"`);
      await addLog(`[METADATA] Extracted: PNG-Format Alpha channel preserved.`);
    }
    
    if (customRosterMode) {
      await addLog(`[GENESIS] Custom Blueprint Mode enabled: ${customRoster.length} Advocates staged.`);
      customRoster.forEach((adv, idx) => {
        if (adv.name) {
          addLog(`  -> Seeding Blueprint [${idx+1}]: ${adv.avatarEmoji} ${adv.name} (${adv.role})`);
        }
      });
    }
    
    // Fire real API request in background while terminal logs roll
    const token = localStorage.getItem('sovereign_session_token');
    let apiPromise = fetch('/api/brand/onboard', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        brand_name: brandName,
        bar_question: barQuestion,
        audience,
        conviction,
        rivals,
        aesthetic,
        content_sources: selectedFeeds,
        extra_lore: extraLore,
        generate_avatars: generateAvatars,
        real_human_renders: realHumanRenders,
        uploaded_logo: uploadedLogo,
        custom_roster: customRosterMode ? customRoster : null,
        website_purpose: websitePurpose,
        website_domain: websiteDomain,
        website_pages: websitePages,
        website_features: websiteFeatures,
        website_colors: websiteColors,
        website_typography: websiteTypography,
        website_additional_requirements: websiteAdditionalRequirements,
        seed_custom_jukebox: seedCustomJukebox,
        enable_heel: enableHeel,
        heel_name: heelName,
        heel_handle: heelHandle,
        heel_trait: heelTrait,
        heel_heresy_stance: heelHeresyStance,
        heel_volatility: heelVolatility
      })
    });

    setCreationStep(3);
    await addLog('📄 stage 2/8: generating structured Brand Brief...');
    await addLog(`[VERTEX] core archetype extracted successfully.`);
    
    setCreationStep(4);
    await addLog('👥 stage 3/8: spinning up 6 concurrent async AI persona generation processes...');
    await addLog('[VERTEX] lead advocate character design completed.');
    await addLog('[VERTEX] devil\'s advocate lore sheets established.');
    await addLog('[VERTEX] chaos instigator boundary safeguards written.');

    setCreationStep(5);
    await addLog('🖼️ stage 4/8: synthesizing stylized character portraits...');
    await addLog('[VERTEX] executing Imagen-3 generator...');
    await addLog('[VERTEX] portrait seeds generated, applying custom SVG color-graded fallbacks...');

    setCreationStep(6);
    await addLog('🤝 stage 5/8: structuring Faction Characters Map (alliances & rivalries)...');

    setCreationStep(7);
    await addLog('🎩 stage 7/8: registering Sorting Hat domain in sync_to_gdrive.sh...');
    
    setCreationStep(8);
    await addLog('💾 stage 8/8: performing transactional SQLite seeding...');
    await addLog('[SQLITE] seated all advocates into SIM_001 matrix tables.');
    await addLog('[SQLITE] configured Metrc/Watchdog telemetry content source records.');

    await addLog('🎟️ creating SDLC STRY tracking ticket...');

    try {
      const res = await apiPromise;
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to onboard brand stack.');
      }
      const data = await res.json();
      await addLog('✅ Sovereign OS Stack Seeding successful! Deploying simulated space...');
      
      setTimeout(() => {
        setResultData(data);
        setIsComplete(true);
        setIsSubmitting(false);
      }, 1000);

    } catch (err: any) {
      await addLog(`❌ ONBOARDING FAULT: ${err.message || 'Unknown Error'}`);
      await addLog('⚠️ triggering fail-safe rescue routines. Please check terminal outputs.');
      setError(err.message || 'Unknown Error');
    }
  };

  // Stable UI mandate: clicking presets should only change local preview styling rather than mutating the parent dashboard colors.
  // useEffect(() => {
  //   document.documentElement.setAttribute('data-entropy', entropyLevel.toString());
  //   return () => {
  //     document.documentElement.removeAttribute('data-entropy');
  //   };
  // }, [entropyLevel]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex flex-col w-full bg-[#111219] text-[#fafafa] antialiased font-sans relative overflow-hidden">
      {/* Background orange/sky-blue glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[#38bdf8]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] rounded-full bg-[#F97316]/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl w-full px-4 py-2 flex flex-col gap-3 relative z-10">
        {/* System Header Section */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 w-full">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              🚀 STACK SEEDER <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 font-mono">GENESIS V5.0</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Sovereign OS Decentralized Brand Intake System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Stack Preset:</label>
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="bg-black/60 border border-white/15 text-orange-400 text-xs px-2.5 py-1 rounded font-mono focus:outline-none focus:border-orange-500/50 cursor-pointer"
              >
                <option value="">-- Preset Stack --</option>
                <option value="weedstack">🌿 WeedStack</option>
                <option value="aethervet">🐱 Aether Vet Care</option>
                <option value="inkwellirony">🕵️‍♂️ Inkwell & Irony Investigations</option>
                <option value="lenora">🐿️ Lenora Academy (Kids)</option>
                <option value="wildpaws">🦊 Wild Paws Smyrna Rescue</option>
                <option value="gonzas">🏪 Gonzas Convenience & Cantina</option>
                <option value="stacklabs">💻 StackLabs Engineering Core</option>
              </select>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded border border-white/5 hidden sm:inline-block">NODE: CLIO (.183)</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitting && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3 w-full"
            >
            {/* Tactile Tab Navigation */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#111219]/90 border border-white/10 rounded-lg p-2 mb-2 shadow-2xl relative z-20">
              <button
                type="button"
                onClick={() => setActiveSeederTab('brand')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'brand' 
                    ? 'bg-sky-500/10 border-sky-500/30 text-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                🏷️ Brand Identity
              </button>
              <button
                type="button"
                onClick={() => setActiveSeederTab('advocates')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'advocates' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                👥 Advocates & Lore
              </button>
              <button
                type="button"
                onClick={() => setActiveSeederTab('aesthetic')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'aesthetic' 
                    ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                🎨 Aesthetic Engine
              </button>
              <button
                type="button"
                onClick={() => setActiveSeederTab('website')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'website' 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                💻 Proposed Website
              </button>
              <button
                type="button"
                onClick={() => setActiveSeederTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'pipeline' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                ⚙️ Ingestion Pipeline
              </button>
              <button
                type="button"
                onClick={() => setActiveSeederTab('archives')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-md border transition-all cursor-pointer ${
                  activeSeederTab === 'archives' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                📦 System Archives
              </button>
            </div>

            {/* Tab Body */}
            <div className="w-full">
              {activeSeederTab === 'brand' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4 max-w-4xl mx-auto w-full font-mono"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">🏷️ Brand Identity</h2>
                  </div>

                  {/* Brand Label Input & Raw Media Drop Zone */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Brand Label</label>
                      <input 
                        type="text" 
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/40 transition-all shadow-inner outline-none font-semibold"
                        placeholder="e.g. James's Bistro, WeedStack, AetherVet" 
                      />
                    </div>

                    {/* Raw Brand Media Drop Zone */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Brand Media (Logo)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-[41px] border border-dashed border-white/20 rounded-md bg-black/40 hover:bg-black/60 hover:border-[#38bdf8]/40 transition flex items-center justify-center gap-2 cursor-pointer px-2"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {uploadedLogo ? (
                          <div className="flex items-center gap-1.5 min-w-0 w-full">
                            <img src={uploadedLogo} alt="Logo preview" className="w-6 h-6 rounded object-cover border border-white/10" />
                            <span className="text-xs font-mono text-emerald-400 truncate flex-1">{logoFileName}</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={14} className="text-slate-400" />
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Attach Logo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Core Mandate Box */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">The Bar Question Mandate</label>
                      <button
                        type="button"
                        onClick={handleDraftWithAI}
                        disabled={isDrafting}
                        className="text-xs px-3 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Sparkles size={12} className={isDrafting ? "animate-spin" : ""} />
                        {isDrafting ? "Analyzing..." : "Draft Settings with AI"}
                      </button>
                    </div>
                    <textarea 
                      rows={3}
                      value={barQuestion}
                      onChange={(e) => setBarQuestion(e.target.value)}
                      className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/40 transition-all shadow-inner resize-none leading-relaxed h-20 outline-none"
                      placeholder="If your brand walked into a bar — who would it be, what would it order, what would it play on the jukebox?"
                    />
                    <div className="mt-1">
                      <PromptMacroMatrix
                        rawPrompt={barQuestion}
                        onOptimized={(optimized) => setBarQuestion(optimized)}
                      />
                    </div>
                    {draftError && <p className="text-xs text-rose-400 flex items-center gap-1 mt-1"><ShieldAlert size={12} /> {draftError}</p>}
                  </div>

                  {/* Compact DNA Overrides Overlay Card */}
                  <div className="border border-white/5 rounded-md bg-black/20 p-3.5 space-y-3 shadow-inner">
                    <h3 className="text-xs font-mono uppercase text-[#38bdf8] border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-bold">
                      🧬 Brand DNA Brief Overlays (Manual Overrides)
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Target Audience</label>
                        <input
                          type="text"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          placeholder="e.g. neighborhood regulars"
                          className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white outline-none font-semibold shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Core Conviction</label>
                        <input
                          type="text"
                          value={conviction}
                          onChange={(e) => setConviction(e.target.value)}
                          placeholder="e.g. wood-fired ovens only"
                          className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white outline-none font-semibold shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Natural Rivals</label>
                        <input
                          type="text"
                          value={rivals}
                          onChange={(e) => setRivals(e.target.value)}
                          placeholder="e.g. generic fast-food franchises"
                          className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white outline-none font-semibold shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Aesthetic / Keywords</label>
                        <input
                          type="text"
                          value={aesthetic}
                          onChange={(e) => setAesthetic(e.target.value)}
                          placeholder="vintage, wood-smoke, rustic"
                          className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white outline-none font-semibold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSeederTab === 'advocates' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start max-w-6xl mx-auto w-full font-mono"
                >
                  {/* Left: Custom Roster */}
                  <div className="lg:col-span-8 bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs font-mono uppercase text-[#38bdf8] flex items-center gap-2 font-bold">
                        👥 Custom Advocate Blueprint Roster
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCustomRosterMode(!customRosterMode)}
                        className={`px-3 py-1 rounded text-xs font-mono border transition ${
                          customRosterMode 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold' 
                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {customRosterMode ? 'CUSTOM BLUEPRINT: ENABLED' : 'PROCEDURAL GENERATION'}
                      </button>
                    </div>

                    {customRosterMode ? (
                      <div className="space-y-3 pt-1">
                        <div className="text-xs text-slate-400 font-mono italic">
                          Specify exact character blueprints. The seeder will anchor on these definitions instead of generating random personas.
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {customRoster.map((adv, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-black/30 border border-white/5 p-2 rounded-md">
                              
                              {/* Emoji Selector */}
                              <div className="col-span-1">
                                <input
                                  type="text"
                                  maxLength={2}
                                  value={adv.avatarEmoji}
                                  onChange={(e) => handleUpdateCustomAdvocate(idx, 'avatarEmoji', e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded py-1 text-center text-sm font-mono text-white focus:outline-none"
                                  placeholder="👤"
                                  title="Character Emoji"
                                />
                              </div>

                              {/* Name Input */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={adv.name}
                                  onChange={(e) => handleUpdateCustomAdvocate(idx, 'name', e.target.value)}
                                  className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs outline-none font-semibold"
                                  placeholder="e.g. Dr. Rox"
                                />
                              </div>

                              {/* Role Input */}
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={adv.role}
                                  onChange={(e) => handleUpdateCustomAdvocate(idx, 'role', e.target.value)}
                                  className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs outline-none font-semibold"
                                  placeholder="e.g. Chief Vet"
                                />
                              </div>

                              {/* Trait Input */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={adv.trait}
                                  onChange={(e) => handleUpdateCustomAdvocate(idx, 'trait', e.target.value)}
                                  className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs outline-none font-semibold"
                                  placeholder="e.g. Medically precise"
                                />
                              </div>

                              {/* Delete Button */}
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomAdvocate(idx)}
                                  className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition"
                                  title="Delete Advocate"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddCustomAdvocate}
                          className="w-full py-1.5 rounded bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/20 text-[#38bdf8] font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Plus size={10} /> Add Advocate Blueprint
                        </button>
                      </div>
                    ) : (
                      <div className="bg-black/30 border border-white/5 p-6 rounded-md text-center py-10">
                        <Users size={32} className="text-slate-500 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-white font-mono text-xs font-bold uppercase tracking-widest">Cognitive Roster Engine (AI)</h4>
                        <p className="text-xs text-slate-400 font-mono mt-2 max-w-md mx-auto leading-relaxed">
                          Sovereign OS will autonomously compile 6 distinct character advocates mapping your Bar Question parameters into cohesive brand personalities.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1 border-t border-white/5 pt-3">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Extra Secret Lore (Private Keys / Secrets)</label>
                      <input 
                        type="text" 
                        value={extraLore}
                        onChange={(e) => setExtraLore(e.target.value)}
                        className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white outline-none font-semibold shadow-inner"
                        placeholder="Inject private secrets, easter eggs..." 
                      />
                    </div>
                  </div>

                  {/* Right: Telemetry feeds & Heel Turn Panel */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-3">
                      <h3 className="text-xs font-mono uppercase text-[#38bdf8] border-b border-white/5 pb-2 font-bold">
                        📡 M.A.R.D Telemetry Feeds
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 leading-relaxed mb-1">
                        Mount context indicators to anchor generative vectors with real-world inputs:
                      </p>
                      <div className="flex flex-wrap gap-1 max-h-72 overflow-y-auto pr-1">
                        {FEEDS_OPTIONS.map((feed) => {
                          const active = selectedFeeds.includes(feed);
                          return (
                            <button
                              key={feed}
                              type="button"
                              onClick={() => toggleFeed(feed)}
                              className={`px-1.5 py-0.5 rounded border text-[9px] font-mono transition flex items-center gap-1.5 ${
                                active
                                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                                  : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                              }`}
                            >
                              <span>{feed}</span>
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Heel Turn Protocol Configuration Panel */}
                    <div className="bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs font-mono uppercase text-[#ef4444] flex items-center gap-2 font-bold">
                          ⚠️ Heel Turn Protocol
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEnableHeel(!enableHeel)}
                          className={`px-3 py-1 rounded text-xs font-mono border transition ${
                            enableHeel 
                              ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] font-bold' 
                              : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {enableHeel ? 'HEEL TURN: ENABLED' : 'HEEL TURN: DISABLED'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {enableHeel && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-1 overflow-hidden"
                          >
                            <div className="text-[10px] text-rose-400 font-mono italic leading-relaxed">
                              Injects an adversarial AI agitator into the simulation chamber to challenge the brand narrative and provoke standard advocates.
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Heel Advocate Name</label>
                              <input
                                type="text"
                                value={heelName}
                                onChange={(e) => setHeelName(e.target.value)}
                                className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white outline-none font-semibold"
                                placeholder="e.g. Keith Fanboy"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Heel Advocate Handle</label>
                              <input
                                type="text"
                                value={heelHandle}
                                onChange={(e) => setHeelHandle(e.target.value)}
                                className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white outline-none font-semibold"
                                placeholder="e.g. keith_fanboy"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Adversarial Trait</label>
                              <input
                                type="text"
                                value={heelTrait}
                                onChange={(e) => setHeelTrait(e.target.value)}
                                className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white outline-none font-semibold"
                                placeholder="e.g. Antagonistic, conspiracy theorist"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Brand Heresy Stance</label>
                              <input
                                type="text"
                                value={heelHeresyStance}
                                onChange={(e) => setHeelHeresyStance(e.target.value)}
                                className="w-full bg-[#fafafa] border border-slate-300 rounded px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white outline-none font-semibold"
                                placeholder="e.g. Keith was a clubhouse cancer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                <span>Volatility Multiplier</span>
                                <span className="text-[#ef4444] font-bold">{heelVolatility.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="3.0"
                                step="0.1"
                                value={heelVolatility}
                                onChange={(e) => setHeelVolatility(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSeederTab === 'aesthetic' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start max-w-6xl mx-auto w-full font-mono"
                >
                  {/* Left Art Options */}
                  <div className="lg:col-span-6 bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs font-mono uppercase text-fuchsia-400 flex items-center gap-2 font-bold">
                        🖌️ Brand Aesthetic Blueprint
                      </h3>
                      <div className="flex gap-1 bg-black/40 border border-white/10 p-0.5 rounded-md text-[10px] font-mono">
                        {(['preset', 'custom', 'upload'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setAestheticMode(mode)}
                            className={`px-2 py-0.5 rounded transition cursor-pointer ${aestheticMode === mode ? 'bg-fuchsia-500/20 text-fuchsia-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                          >
                            {mode === 'preset' ? 'Preset' : mode === 'custom' ? 'Custom' : 'Upload'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preset Mode Form */}
                    {aestheticMode === 'preset' && (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'corporate', label: '💼 Corporate', desc: 'Clinical Vector Minimalist', level: 1 },
                          { key: 'cozy', label: '🦊 Cozy Artisan', desc: 'Warm Earthy Digital Ink', level: 5 },
                          { key: 'muppet', label: '🦁 Muppet Chaos', desc: 'Fuzzy Felt Puppets, 90s TV', level: 9 },
                          { key: 'feral', label: '👹 Feral Chaos', desc: 'Industrial Gritty Wireframe', level: 11 },
                          { key: 'vector', label: '📚 Flat Vector Swarm', desc: 'Flat 2D Steampunk/Pastel Assets', level: 6 },
                          { key: 'rustic', label: '🪵 Smyrna Rustic Art', desc: 'Holistic Earthy Wood-grain Art', level: 7 }
                        ].map((opt) => {
                          const active = selectedAestheticPreset === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setSelectedAestheticPreset(opt.key);
                                setEntropyLevel(opt.level);
                              }}
                              className={`text-left p-2.5 rounded-lg border backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col gap-0.5 ${
                                active
                                  ? 'bg-fuchsia-500/5 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.15)] font-bold'
                                  : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-black/40 text-slate-400'
                              }`}
                            >
                              <span className="text-[10px] font-bold font-mono">{opt.label}</span>
                              <span className="text-[8px] font-mono opacity-60 leading-tight">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom Text Mode */}
                    {aestheticMode === 'custom' && (
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={customAestheticText}
                          onChange={(e) => setCustomAestheticText(e.target.value)}
                          className="w-full bg-[#fafafa] border border-slate-300 rounded-md py-2 px-3 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-fuchsia-500/40 transition-all outline-none leading-relaxed shadow-inner"
                          placeholder="Describe the aesthetic and art style manually (e.g. Calvin & Hobbes-ish, ink outlines, watercolor wash...)"
                        />
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Tactile Style Injectors</div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: '🖋️ Calvin & Hobbes', prompt: 'Classic ink brush outlines with warm soft watercolor wash aesthetic' },
                              { label: '🤪 Ren & Stimpy-like', prompt: 'Ren and Stimpy style hyper-detailed wacky caricature hand-drawn cartoon' },
                              { label: '📦 90s Cardboard Treehouse', prompt: '90s raw cardboard textures, cardboard treehouse crayon scrap drawings' },
                              { label: '🎞️ Rubberhose Ink', prompt: '1930s Steamboat Willie rubberhose ink caricature black and white vintage cartoon' }
                            ].map((badge) => (
                              <button
                                key={badge.label}
                                type="button"
                                onClick={() => setCustomAestheticText(badge.prompt)}
                                className="px-2 py-1 rounded bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 text-[10px] font-mono transition cursor-pointer"
                              >
                                {badge.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Direct Upload Mode */}
                    {aestheticMode === 'upload' && (
                      <div 
                        onClick={() => aestheticInputRef.current?.click()}
                        className="w-full h-36 border border-dashed border-white/20 rounded-lg bg-black/40 hover:bg-black/60 hover:border-fuchsia-500/40 transition flex flex-col items-center justify-center gap-2 cursor-pointer p-4"
                      >
                        <input 
                          type="file" 
                          ref={aestheticInputRef} 
                          onChange={handleAestheticFileChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {uploadedAesthetic ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={uploadedAesthetic} alt="Style reference preview" className="w-14 h-14 rounded object-cover border border-white/10" />
                            <span className="text-xs font-mono text-emerald-400 font-bold truncate max-w-xs">{aestheticFileName}</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={24} className="text-slate-500 animate-bounce" />
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Upload Style Reference Image</span>
                            <span className="text-[10px] font-mono text-slate-600">Supports PNG, JPG, JPEG</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Live Preview Card / Gemini Canvas split-screen */}
                  <div className="lg:col-span-6 bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-3 min-h-[500px]">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs font-mono uppercase text-fuchsia-400 font-bold flex items-center gap-2">
                        🔮 HoloDex Sandbox Canvas
                      </h3>
                      <div className="flex gap-1 bg-black/40 border border-white/10 p-0.5 rounded-md text-[9px] font-mono shrink-0">
                        {(['preview', 'wireframe'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setHolodexPreviewTab(tab)}
                            className={`px-2.5 py-0.5 rounded transition cursor-pointer font-bold ${holodexPreviewTab === tab ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-400 hover:text-white'}`}
                          >
                            {tab === 'preview' ? 'Live Preview' : '3D Wireframe'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Preview Tab */}
                    {holodexPreviewTab === 'preview' ? (
                      <div className="flex-1 flex flex-col gap-3 animate-fade-in text-slate-300">
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex justify-between font-mono">
                          <span>Aesthetic: <span className="text-fuchsia-400">{selectedAestheticPreset.toUpperCase()} CORE</span></span>
                          <span>Preset: <span className="text-sky-400">{selectedPreset ? selectedPreset.toUpperCase() : 'WILDPAWS'}</span></span>
                        </div>

                        {/* Highly Dynamic Themed Live Preview Container */}
                        {(() => {
                          // Define default advocates if custom roster is empty
                          const fallbackRoster = [
                            { name: "Barb the Founder", role: "Director & Lead Artist (barb_founder)", trait: "Fierce animal advocate who paints canvases and plays CCR", avatarEmoji: "👩‍🎨" },
                            { name: "Jack the Carpenter", role: "Lead Builder & Framer (jack_carpenter)", trait: "Woodworker framing canvases out of reclaimed barn wood", avatarEmoji: "🪚" },
                            { name: "Doc Wheeler", role: "Sanctuary Triage Vet (doc_wheeler)", trait: "UGA DVM consultant providing custom triage and waitlist bypasses", avatarEmoji: "🩺" },
                            { name: "Jukebox Jesse", role: "Jukebox Custodian (jukebox_jesse)", trait: "Mechanic managing CCR audio and speaker wire layouts", avatarEmoji: "🎸" },
                            { name: "Moscato Sally", role: "Art Gallery Curator (moscato_sally)", trait: "Gallery coordinator offering sweet Moscato to canvas buyers", avatarEmoji: "🍷" },
                            { name: "Buster the Brawler", role: "Sanctuary Enforcer (buster_brawler)", trait: "Tough security volunteer breaking up fights and keeping order", avatarEmoji: "🐕" }
                          ];
                          const activeRoster = customRoster && customRoster.length > 0 ? customRoster : fallbackRoster;
                          const isLenoraPreset = selectedPreset === 'lenora';

                          // Curate visual classes based on selectedAestheticPreset
                          let containerClass = "bg-slate-900 border border-white/10 text-white rounded-lg p-4 font-sans";
                          let headerClass = "text-sm font-bold tracking-wider border-b border-white/10 pb-2 mb-3 text-sky-400";
                          let cardClass = "bg-white/5 border border-white/10 p-2.5 rounded-md text-left font-sans";
                          let accentBtnClass = "bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors w-full";
                          let descriptionStyle = "text-[10px] text-slate-400 leading-normal";

                          if (selectedAestheticPreset === 'corporate') {
                            containerClass = "bg-[#f8fafc] border border-slate-300 text-slate-800 rounded p-4 font-sans shadow-inner text-left";
                            headerClass = "text-xs font-mono font-black border-b-2 border-slate-800 pb-1.5 mb-3 text-slate-800 uppercase tracking-widest";
                            cardClass = "bg-white border border-slate-200 p-2.5 rounded-none text-left text-slate-700 shadow-sm";
                            accentBtnClass = "bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-none transition w-full text-center";
                            descriptionStyle = "text-[10px] text-slate-500 leading-relaxed font-sans";
                          } else if (selectedAestheticPreset === 'cozy') {
                            containerClass = "bg-[#FAF7F2] border border-[#ebdcd3] text-[#5c4d4d] rounded-3xl p-4 font-sans shadow-[0_8px_30px_rgba(224,122,95,0.06)] text-left";
                            headerClass = "text-base font-bold text-[#e07a5f] border-b border-[#ebdcd3] pb-2 mb-3 tracking-normal font-sans";
                            cardClass = "bg-white/80 border border-[#ebdcd3] p-3 rounded-2xl text-left shadow-sm text-[#5c4d4d]";
                            accentBtnClass = "bg-[#e07a5f] hover:bg-[#c9694e] text-white text-[10px] font-semibold px-4 py-2 rounded-xl transition w-full text-center shadow-sm";
                            descriptionStyle = "text-[10px] text-[#8a7b7a] leading-normal font-sans";
                          } else if (selectedAestheticPreset === 'muppet') {
                            containerClass = "bg-[#ffd60a] border-4 border-black text-black rounded-[24px] p-4 font-sans font-bold shadow-[8px_8px_0_#000] text-left";
                            headerClass = "text-base font-black border-b-4 border-black pb-2 mb-3 text-black uppercase tracking-wide";
                            cardClass = "bg-[#ff4d6d] text-white border-3 border-black p-3 rounded-2xl text-left shadow-[4px_4px_0_#000] font-sans font-bold";
                            accentBtnClass = "bg-black hover:bg-slate-800 text-[#ffd60a] text-xs font-black uppercase px-4 py-2.5 rounded-full border-2 border-black transition w-full text-center shadow-[2px_2px_0_#ff4d6d]";
                            descriptionStyle = "text-[10px] text-[#fff] leading-tight font-sans";
                          } else if (selectedAestheticPreset === 'feral') {
                            containerClass = "bg-black border border-[#39ff14] text-[#39ff14] p-4 font-mono shadow-[0_0_20px_rgba(57,255,20,0.25)] relative overflow-hidden text-left";
                            headerClass = "text-xs font-bold border-b border-dashed border-[#39ff14] pb-2 mb-3 tracking-widest text-[#39ff14] uppercase";
                            cardClass = "bg-black border border-dashed border-[#39ff14]/60 p-2 rounded-none text-left font-mono relative overflow-hidden";
                            accentBtnClass = "bg-black hover:bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14] text-[9px] font-mono px-3 py-1 transition w-full text-center";
                            descriptionStyle = "text-[9px] text-[#39ff14]/80 leading-normal font-mono";
                          } else if (selectedAestheticPreset === 'vector') {
                            containerClass = "bg-[#0c0f16] border border-slate-700/80 text-slate-100 rounded-2xl p-4 font-sans text-left shadow-2xl";
                            headerClass = "text-sm font-bold text-sky-400 border-b border-slate-800 pb-2 mb-3 font-sans";
                            cardClass = "bg-[#161a24] border border-slate-800 p-2.5 rounded-xl text-left text-slate-300";
                            accentBtnClass = "bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all w-full text-center shadow-md shadow-sky-500/10";
                            descriptionStyle = "text-[10px] text-slate-400 leading-relaxed font-sans";
                          } else if (selectedAestheticPreset === 'rustic') {
                            containerClass = "bg-[#111219] border border-amber-600/30 text-amber-100 rounded-xl p-4 font-sans shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] text-left relative overflow-hidden";
                            headerClass = "text-sm font-black text-amber-400 border-b border-amber-600/30 pb-2 mb-3 uppercase tracking-wider font-sans flex items-center justify-between";
                            cardClass = "bg-amber-950/15 border border-amber-600/20 backdrop-blur-sm p-3 rounded-lg text-left text-amber-200 relative overflow-hidden";
                            accentBtnClass = "bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1.5 rounded transition-all w-full text-center tracking-wider";
                            descriptionStyle = "text-[10px] text-amber-100/60 leading-normal font-sans";
                          }

                          return (
                            <div className={`${containerClass} transition-all duration-300 flex flex-col gap-3 min-h-[420px] relative`}>
                              {/* Scanline overlay for feral theme */}
                              {selectedAestheticPreset === 'feral' && (
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none bg-[size:100%_4px] opacity-25" />
                              )}

                              {/* Simulated Brand Header */}
                              <div className={headerClass}>
                                {isLenoraPreset ? (
                                  <span>📚 LENORA'S EDUCATIONAL SWARM</span>
                                ) : (
                                  <div className="flex justify-between items-center w-full">
                                    <span>🪵 WILD PAWS & RUSTY CANVAS</span>
                                    {selectedAestheticPreset === 'rustic' && (
                                      <span className="text-[7px] bg-amber-500/10 border border-amber-500/30 px-1 py-0.5 rounded font-mono text-amber-400 tracking-widest">PROD ACTIVE</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <p className={descriptionStyle}>
                                {isLenoraPreset 
                                  ? "Welcome to Lenora's clockwork classroom treehouse! Slide to allocate daydreams, review spellings, and meet academic advocates."
                                  : "Welcome to Smyrna's premier sanctuary and independent wild art academy. Funded strictly by our badass brushes, not empty boards."}
                              </p>

                              {/* Interactive Live Seeder Preview Widget */}
                              {!isLenoraPreset ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-1">
                                  {/* Art Auction Interactive Card */}
                                  <div className={cardClass}>
                                    <div className="font-bold text-[11px] mb-1 flex justify-between">
                                      <span>🖼️ Live Art Auction</span>
                                      {selectedAestheticPreset === 'rustic' && <span className="text-[#38bdf8] text-[9px] animate-pulse">● LIVE</span>}
                                    </div>
                                    <div className="aspect-[4/3] w-full bg-black/40 rounded-md border border-white/5 overflow-hidden relative mb-2 flex items-center justify-center">
                                      {/* Mock acrylic oil paint splash overlay using tailwind */}
                                      <div className="absolute w-12 h-12 bg-amber-500/20 rounded-full filter blur-md animate-pulse top-2 left-4"></div>
                                      <div className="absolute w-14 h-14 bg-teal-500/15 rounded-full filter blur-lg bottom-3 right-6"></div>
                                      <div className="relative text-center p-2 z-10 space-y-1 font-mono">
                                        <div className="text-[10px] font-bold text-amber-400 line-clamp-1">"Stray Metsy at Twilight"</div>
                                        <div className="text-[8px] opacity-60">12" x 16" Acrylic on Barn Wood</div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] mb-2 font-mono">
                                      <div>Bids: <span className="font-bold text-fuchsia-400">{mockBidCount}</span></div>
                                      <div>Price: <span className="font-bold text-emerald-400">${mockBidPrice}</span></div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMockBidPrice(prev => prev + 25);
                                        setMockBidCount(prev => prev + 1);
                                      }}
                                      className={accentBtnClass}
                                    >
                                      🎨 Place Mock Bid ($25)
                                    </button>
                                  </div>

                                  {/* CCR Jukebox Interactive Card */}
                                  <div className={`${cardClass} flex flex-col justify-between`}>
                                    <div>
                                      <div className="font-bold text-[11px] mb-1">🎸 CCR Vintage Jukebox</div>
                                      <p className="text-[9px] opacity-70 leading-relaxed mb-3">
                                        Drop a token to play Creedence Clearwater Revival tracks inside the Smyrna sanctuary!
                                      </p>
                                    </div>
                                    
                                    <div className="bg-black/60 rounded p-2 border border-white/5 font-mono text-[9px] space-y-2 mb-3">
                                      <div className="flex justify-between text-slate-500">
                                        <span>INPUT: MOSCATO_TOKEN</span>
                                        <span>100.117.94.41</span>
                                      </div>
                                      <div className="text-amber-400 font-bold truncate">
                                        {mockPlayingJukebox ? "📻 Playing: Fortunate Son - CCR" : "📻 Jukebox Idle (CCR Ready)"}
                                      </div>
                                      {mockPlayingJukebox && (
                                        <div className="h-1 bg-amber-600/30 rounded overflow-hidden">
                                          <div className="h-full bg-amber-400 animate-[pulse_1.5s_infinite] w-3/4"></div>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setMockPlayingJukebox(prev => !prev)}
                                      className={`${accentBtnClass} flex items-center justify-center gap-1`}
                                    >
                                      {mockPlayingJukebox ? "⏸️ Pause Jukebox" : "▶️ Play 'Fortunate Son'"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-1">
                                  {/* Educational Daydreaming Slider */}
                                  <div className={cardClass}>
                                    <div className="font-bold text-[11px] mb-1.5 flex justify-between items-center">
                                      <span>🦄 Daydream Allocator</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono">STABILITY ACT</span>
                                    </div>
                                    <p className="text-[9px] opacity-70 leading-normal mb-3">
                                      Adjust child daydream credits. Ratios: 1 completed math puzzle = 1 magical unicorn token.
                                    </p>
                                    <div className="space-y-2 font-mono text-[9px]">
                                      <div className="flex justify-between text-amber-400 font-bold">
                                        <span>ALLOCATION RATIO:</span>
                                        <span>85% CREDITS</span>
                                      </div>
                                      <input type="range" min="10" max="100" defaultValue="85" className="w-full accent-fuchsia-500 cursor-pointer h-1 bg-white/10 rounded" />
                                      <div className="text-[8px] text-slate-500 text-center">Unicorn Principal Celeste approves.</div>
                                    </div>
                                  </div>

                                  {/* Math Acorns Counter Card */}
                                  <div className={`${cardClass} flex flex-col justify-between`}>
                                    <div>
                                      <div className="font-bold text-[11px] mb-1">🐿️ Pip's Steampunk Math Cave</div>
                                      <p className="text-[9px] opacity-70 leading-normal mb-3">
                                        Help clockwork Pip calculate place values using brass gears and harvested acorns!
                                      </p>
                                    </div>

                                    <div className="bg-black/60 rounded p-2.5 border border-white/5 font-mono text-[9px] space-y-1.5 mb-3">
                                      <div className="flex justify-between text-slate-500">
                                        <span>ACORNS: 142 HARVESTED</span>
                                        <span>GEARS: 12 COGS</span>
                                      </div>
                                      <div className="text-emerald-400 font-bold">
                                        ✓ 12 completed math worksheets!
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => alert("Acorns collected! 1 sticker granted to Lenora!")}
                                      className={accentBtnClass}
                                    >
                                      ⭐️ Reward 1 Sticker
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Advocates Roster Panel inside live preview */}
                              <div className="space-y-1.5 mt-1">
                                <h4 className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider flex justify-between border-t border-white/5 pt-2">
                                  <span>👥 ACTIVE CUSTOM ADVOCATES ({activeRoster.length})</span>
                                  <span>SEVERITY CODE: COZY-7</span>
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {activeRoster.map((adv, idx) => (
                                    <div key={idx} className={`${cardClass} p-2 flex flex-col gap-1 text-[9px] relative overflow-hidden hover:scale-[1.02] transition-transform`}>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm shrink-0">{adv.avatarEmoji}</span>
                                        <div className="truncate font-bold text-slate-300">{adv.name}</div>
                                      </div>
                                      <div className="truncate text-fuchsia-400 font-mono text-[8px] opacity-90">{adv.role.split('(')[0]}</div>
                                      <p className="text-[8px] opacity-60 line-clamp-2 leading-tight">{adv.trait}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* HoloDex Sandbox 3D Wireframe Tab */
                      <div className="flex-1 flex flex-col gap-3 font-mono text-[10px] text-slate-400 justify-between min-h-[420px] animate-fade-in">
                        <div className="border border-fuchsia-500/30 rounded-lg p-3 bg-black/40 space-y-2 relative overflow-hidden shadow-inner">
                          {/* Glowing hologram neon effect */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-fuchsia-500/5 rounded-full blur-xl pointer-events-none"></div>
                          
                          <div className="flex justify-between items-center border-b border-white/10 pb-1">
                            <span className="text-fuchsia-400 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse"></span>
                              ⚡ ORTHOGONAL PROJECTOR: ACTIVE
                            </span>
                            <span className="px-1 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 font-bold uppercase tracking-wider text-[8px]">
                              UNDER CONSTRUCTION
                            </span>
                          </div>

                          {/* Animated 3D geometric container */}
                          <div className="relative aspect-video rounded bg-black border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-2 group shadow-inner">
                            {/* Geometric grid backgrounds */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a26_1px,transparent_1px),linear-gradient(to_bottom,#1f1a26_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
                            
                            <motion.div
                              animate={{ rotateY: 360, rotateX: 360 }}
                              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                              className="w-12 h-12 border-2 border-fuchsia-500/30 border-dashed rounded flex items-center justify-center z-10"
                            >
                              <Cpu size={20} className="text-fuchsia-400 animate-pulse" />
                            </motion.div>

                            <div className="absolute bottom-2 left-0 right-0 text-center space-y-0.5 p-1 z-10 bg-black/60 backdrop-blur-sm border-t border-white/5">
                              <div className="text-white font-bold tracking-widest text-[9px] drop-shadow-md">HOLODEX PROJECTION CORE</div>
                              <div className="text-slate-500 font-mono text-[7px]">MATRIX RESOLUTION: 4096 x 4096 LORE VECTORS</div>
                            </div>
                          </div>

                          {/* Diagnostics readout */}
                          <div className="space-y-1 text-[8px] font-mono text-slate-500 leading-normal pt-1">
                            <div className="flex justify-between">
                              <span>PROJECTOR STABILITY:</span>
                              <span className="text-emerald-400 font-bold">1.0000 S (STABLE)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ENTROPY VIBRANCY:</span>
                              <span className="text-fuchsia-400 font-bold">LEVEL {entropyLevel}/11</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ADVOCATE COMPILATIONS:</span>
                              <span className="text-sky-400 font-bold">{customRoster && customRoster.length > 0 ? customRoster.length : 6} CHANNELS QUEUED</span>
                            </div>
                            <div className="flex justify-between">
                              <span>MESH ADDRESS:</span>
                              <span className="text-slate-400">clio.taila01894.ts.net:3008</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive prompt splicing console */}
                        <div className="bg-black/60 rounded-lg p-3 border border-white/5 space-y-2 text-left">
                          <div className="font-bold text-[9px] text-fuchsia-400 font-mono">{"&gt;&gt;&gt; REAL-TIME AESTHETIC COMPILING LOGS"}</div>
                          <p className="text-[8px] leading-relaxed text-slate-500 max-h-[80px] overflow-y-auto font-mono scrollbar-none">
                            [System] Initializing aesthetic parser...<br/>
                            [System] Selected Scheme: {selectedAestheticPreset.toUpperCase()}<br/>
                            [Parser] Scanning advocate blueprints for custom features...<br/>
                            [Parser] Compiled {customRoster.length} Advocates successfully.<br/>
                            [Render] Injecting style tokens: {selectedAestheticPreset === 'rustic' ? "Wood-grain outline active, CCR Jukebox active." : "Steampunk pastel cogs active."}<br/>
                            [System] Sandbox sandbox environment operational.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeSeederTab === 'website' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start max-w-6xl mx-auto w-full"
                >
                  <div className="lg:col-span-12 bg-[#161720] border border-white/10 rounded-lg p-6 shadow-xl space-y-4">
                    <div>
                      <h3 className="text-sm font-mono uppercase text-[#38bdf8] border-b border-white/5 pb-2 font-bold flex items-center gap-2">
                        💻 Proposed Website Blueprint
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        These specifications are seeded to the CMDB matrix. Presets automatically apply targeted, high-fidelity styles.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Domain & Purpose & Pages */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Target Domain</label>
                          <input
                            type="text"
                            value={websiteDomain}
                            onChange={(e) => setWebsiteDomain(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                            placeholder="e.g. weedstack.com or mybistro.local"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Website Purpose</label>
                          <textarea
                            rows={3}
                            value={websitePurpose}
                            onChange={(e) => setWebsitePurpose(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50 leading-relaxed"
                            placeholder="Describe the primary goal of the guest-facing website platform..."
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Key Pages & Hierarchy</label>
                          <textarea
                            rows={3}
                            value={websitePages}
                            onChange={(e) => setWebsitePages(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50 leading-relaxed"
                            placeholder="List main pages (e.g. Home, Science, Reservation, Menu, Blog)..."
                          />
                        </div>
                      </div>

                      {/* Right: Features, Colors, Typography, Extra */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Core Features & Logic</label>
                          <textarea
                            rows={2}
                            value={websiteFeatures}
                            onChange={(e) => setWebsiteFeatures(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50 leading-relaxed"
                            placeholder="Interactive reservation widgets, live telemetry collars, terpene wheels..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Colors Guidelines</label>
                            <input
                              type="text"
                              value={websiteColors}
                              onChange={(e) => setWebsiteColors(e.target.value)}
                              className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                              placeholder="Slate, Emerald green..."
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Typography System</label>
                            <input
                              type="text"
                              value={websiteTypography}
                              onChange={(e) => setWebsiteTypography(e.target.value)}
                              className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                              placeholder="Outfit, Inter..."
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Additional Requirements</label>
                          <textarea
                            rows={2}
                            value={websiteAdditionalRequirements}
                            onChange={(e) => setWebsiteAdditionalRequirements(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500/50 leading-relaxed"
                            placeholder="Mobile-first flexbox grids, zero page-loading lag, glassmorphic styles..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Jukebox checkbox */}
                    <div className="border border-white/5 bg-black/20 rounded p-3 mt-4">
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={seedCustomJukebox} 
                          onChange={(e) => setSeedCustomJukebox(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-orange-600 rounded border-slate-700 bg-slate-900 focus:ring-0 focus:ring-offset-0 transition cursor-pointer mt-0.5 shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-300 font-mono group-hover:text-white transition">
                            🎶 Noir Jukebox Custom Songs Integration
                          </span>
                          <span className="text-[9px] font-semibold text-slate-500 mt-1 font-mono leading-relaxed">
                            When enabled, the seeding process will automatically stage and copy the three bespoke Noir theme .mp3 tracks (Midnight Pavement, Smyrna Midnight Rain, and Susie's Sourdough Blues) into the seeded domain's public audio assets directory, integrating them seamlessly into the active room's playback roster.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSeederTab === 'pipeline' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start max-w-6xl mx-auto w-full font-mono"
                >
                  {/* Left Side: Telemetry status & Compliance */}
                  <div className="lg:col-span-7 bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xs font-mono uppercase text-[#38bdf8] font-bold">🛠️ Pipeline Status & Compliance</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pipeline Preview */}
                      <div className="bg-[#05060b] border border-slate-900 rounded p-3 font-mono text-xs text-emerald-400 shadow-inner space-y-1">
                        <div className="text-slate-500 mb-1">// COGNITIVE NAMESPACE STATUS</div>
                        <div>[INGEST] State: <span className="text-blue-400">READY</span></div>
                        <div>[CMDB] Schema validation: <span className="text-white font-bold">PARITY_WAL_MODE</span></div>
                        <div>[ROSTER] Blueprint tracking: <span className="text-white">BOUNDED</span></div>
                        
                        <div className="mt-2 text-slate-400 font-bold border-t border-white/5 pt-1 uppercase tracking-widest text-[9px]">Active Preview</div>
                        <div className="text-[10px] text-slate-300 flex flex-col gap-0.5">
                          <div>BRAND: <span className="text-[#38bdf8] font-bold">{brandName || 'UNTITLED'}</span></div>
                          <div>AUDIENCE: <span className="text-slate-400">{audience || 'GENERIC'}</span></div>
                          <div>CONVICTION: <span className="text-slate-400">{conviction || 'PENDING'}</span></div>
                          <div>RIVALS: <span className="text-slate-400">{rivals || 'NONE'}</span></div>
                        </div>
                      </div>

                      {/* Compliance Matrix */}
                      <div className="bg-black/30 border border-white/5 rounded-lg p-3 space-y-2">
                        <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1 font-bold">🛡️ Compliance Matrix</h4>
                        <div className="font-mono text-[10px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">KI-001 (Tailscale DNS):</span>
                            <span className="text-emerald-400 font-bold">ENFORCED</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">KI-038 (SQLite Path):</span>
                            <span className="text-emerald-400 font-bold">ENFORCED</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Brooks Visual Exception:</span>
                            <span className="text-emerald-400 font-bold">ACTIVE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Avatar checkbox */}
                    <div className="border border-white/5 bg-black/20 rounded p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={generateAvatars} 
                          onChange={(e) => {
                            setGenerateAvatars(e.target.checked);
                            if (!e.target.checked) setRealHumanRenders(false);
                          }}
                          className="form-checkbox h-4 w-4 text-orange-600 rounded border-slate-700 bg-slate-900 focus:ring-0 focus:ring-offset-0 transition cursor-pointer mt-0.5 shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-300 font-mono group-hover:text-white transition">
                            ⚡ Procedurally Forge 4K Character Avatars via Imagen Ingestion Loop
                          </span>
                          <span className="text-[9px] font-semibold text-slate-500 mt-1 font-mono leading-relaxed">
                            KI-041 Compliance Check: Automatically compiles stack-specific visual assets (sports stacks get fuzzy felt puppets; retail get custom realistic), commits image paths to database records.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Real Human Renders checkbox */}
                    {generateAvatars && (
                      <div className="border border-white/5 bg-[#1d1414]/40 border-orange-500/10 rounded p-3 mt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={realHumanRenders} 
                            onChange={(e) => setRealHumanRenders(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-orange-600 rounded border-slate-700 bg-slate-900 focus:ring-0 focus:ring-offset-0 transition cursor-pointer mt-0.5 shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-300 font-mono group-hover:text-white transition flex items-center gap-1">
                              👤 Enable photorealistic human advocate renders
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500 mt-1 font-mono leading-relaxed">
                              Check this ONLY if you explicitly want 4K hyper-realistic human faces (e.g. for traditional/noir business contexts). If left unchecked, the generator defaults to non-photorealistic stylized character portraits (charming cozy felt puppets or 90s cartoons) to prevent uncanny-valley realism.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Launch Button & Warning */}
                  <div className="lg:col-span-5 bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4 font-mono">
                    <h3 className="text-xs font-mono uppercase text-[#38bdf8] border-b border-white/5 pb-2 font-bold">🚀 Execution Launch Mechanism</h3>

                    {/* Ingestion Warning */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3 text-[10px] font-mono text-amber-500 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
                        <ShieldAlert size={12} /> Enterprise Vertex AI Seeding
                      </div>
                      This execution triggers live generative advocate mappings, SQLite database commits, and synchronous compile sync pipelines. Make sure all values are nominal before proceeding.
                    </div>

                    {/* Big Launch Button */}
                    <button 
                      onClick={handleSeedStack}
                      className="w-full py-4 rounded-md text-white font-mono font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 active:scale-[0.995] shadow-lg hover:shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Cpu size={16} /> Execute Ingestion Sequence
                    </button>
                  </div>
                </motion.div>
              )}

              {activeSeederTab === 'archives' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#161720] border border-white/10 rounded-lg p-4 shadow-xl flex flex-col gap-4 max-w-4xl mx-auto w-full font-mono"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">📦 System Ingestion Archives</h2>
                  </div>

                  <div className="bg-[#05060b] border border-slate-900 rounded p-3 font-mono text-xs text-slate-400 space-y-1.5 shadow-inner max-h-72 overflow-y-auto scrollbar-thin">
                    <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span>●</span> [SUCCESS] 2026-05-29T01:27:58Z - Seeded WeedStack (WildSeed) successfully. 6 advocates compiled.
                    </div>
                    <div className="text-emerald-400 flex items-center gap-1.5 font-bold pl-3 border-l border-white/5">
                      ↳ Avatars compiled: FS-MED-00044 (WildSeed Muppet), FS-MED-00045 (Buster Cozy). DB commit resolved.
                    </div>
                    <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span>●</span> [SUCCESS] 2026-05-28T22:24:25Z - Seeded Anvil & Twine successfully. 5 advocates compiled.
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <span>●</span> [INFO] 2026-05-28T19:52:19Z - Connected canonical SQLite target database successfully.
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5 pl-3 border-l border-white/5">
                      ↳ Path target verified: /home/james/SovereignOS/dna/sovereign_now.db
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <span>●</span> [INFO] 2026-05-28T10:45:20Z - Initialized static prospectus compilations router.
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5 pl-3 border-l border-white/5">
                      ↳ Target path: /01_Sovereign_Portal/public/prospectus.html
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1 text-[11px] font-mono text-slate-500">
                    <div className="bg-black/20 p-2.5 rounded border border-white/5 flex flex-col gap-0.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Ingestion Host</span>
                      <span>Target: localhost (Node .183)</span>
                      <span>Port: 3000 (HTTPS enabled)</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded border border-white/5 flex flex-col gap-0.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Sovereign Memory</span>
                      <span>WAL Mode: Enabled</span>
                      <span>Integrity cleared: 100% NOMINAL</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* GENESIS INGESTION TERMINAL OVERLAY */}
        {isSubmitting && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090d]/98 flex flex-col p-8 font-mono relative"
          >
            {/* Terminal Top Bar */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs text-white/60 uppercase tracking-widest">Sovereign OS — Stack Seeding Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">GENESIS_PIPELINE.LOG</span>
              </div>
            </div>

            {/* Ingestion Steps Progress Indicators */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                const isActive = s === creationStep;
                const isPast = s < creationStep;
                return (
                  <div
                    key={s}
                    className={`h-1.5 rounded transition duration-300 ${
                      isPast ? 'bg-emerald-400' : isActive ? 'bg-blue-400 animate-pulse' : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {/* Ingestion Log Lines */}
            <div className="flex-1 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-6 flex flex-col gap-2 font-mono text-sm leading-relaxed text-emerald-400 scroll-smooth">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="text-white/20 select-none">[{String(idx + 1).padStart(2, '0')}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
              <div className="h-12 shrink-0" />
            </div>

            {/* Terminal Footer */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs border-t border-white/5 pt-4">
              {error ? (
                <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider">
                  <ShieldAlert size={16} />
                  <span>ONBOARDING FAULT REGISTERED</span>
                </div>
              ) : (
                <span className="text-white/30">GENESIS SWARM ENGAGED</span>
              )}
              
              {error ? (
                <button
                  onClick={() => {
                    setError(null);
                    setIsSubmitting(false);
                  }}
                  className="px-5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-widest uppercase transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  Dismiss & Return to Form
                </button>
              ) : (
                <span className="text-white/30">DO NOT CLOSE THIS VIEW</span>
              )}
            </div>
          </motion.div>
        )}

        {/* ONBOARDING COMPLETE / SUCCESS PANEL */}
        {isComplete && resultData && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto mt-12 md:mt-24 bg-white/[0.02] backdrop-blur-xl border border-emerald-500/20 rounded-xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 relative z-10"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-pulse mb-2">
              <CheckCircle size={36} />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Stack Successfully Seeded!</h2>
              <p className="text-sm text-white/50 mt-1">Brand Stack room is online and advocate processes are registered.</p>
            </div>

            {/* Statistics Dashboard card */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 border border-white/5 rounded-lg bg-black/20 p-5 mt-2 text-left font-mono">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-white/40">SIMULATION ROOM KEY</span>
                <span className="text-sm text-emerald-400 font-bold">{resultData.room_key}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] text-white/40">SORTING HAT DOMAIN</span>
                <span className="text-sm text-blue-400 font-bold">{resultData.domain}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] text-white/40">ADVOCATES SEATED</span>
                <span className="text-sm text-white font-bold">{resultData.personas?.length || 6} Personas</span>
              </div>
            </div>

            {/* Compiled PDF Seeding Report Location */}
            <div className="w-full flex flex-col gap-2 text-left font-mono border border-emerald-500/20 rounded-lg bg-emerald-500/[0.03] p-4 mt-2">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">COMPILED GENESIS PDF PATHWAY</span>
              <div className="flex items-center justify-between gap-3 bg-black/40 border border-emerald-500/10 rounded px-3 py-2 text-xs text-white select-all">
                <span className="truncate">
                  {pdfPath}
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans font-semibold">ON-DISK</span>
              </div>
              <span className="text-[10px] text-white/40">This PDF seeding report contains detailed lore, character sheets, and database relational mappings for this room.</span>
            </div>

            {/* List of Seated advocates */}
            <div className="w-full flex flex-col gap-3 text-left">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 border-b border-white/5 pb-1">Seated Advocates Roster</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resultData.personas?.map((p: any) => (
                  <div key={p.username} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <img src={p.avatar_url} alt={p.display_name} className="w-8 h-8 rounded-full border border-white/10" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{p.display_name}</span>
                      <span className="text-[10px] text-white/40 truncate">@{p.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 w-full mt-4 justify-center">
              <button
                onClick={() => {
                  setIsComplete(false);
                  setResultData(null);
                }}
                className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-bold font-mono tracking-widest uppercase transition"
              >
                Seed Another Stack
              </button>
              
              <button
                onClick={() => {
                  window.location.href = `/?domain=${resultData.domain}&room=persona_center&filter=team_scoped`;
                }}
                className="px-8 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-emerald-400/10 transition"
              >
                Launch Room Dashboard <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
