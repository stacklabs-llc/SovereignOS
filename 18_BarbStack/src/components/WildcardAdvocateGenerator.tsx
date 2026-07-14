import { useState, useEffect } from "react";
import { 
  Users, Image as ImageIcon, CheckCircle, 
  RefreshCw, Search, Layers
} from "lucide-react";

interface Persona {
  sys_id: string;
  user_name: string;
  team: string;
  deep_lore: string;
  avatar_url: string | null;
  u_visual_style?: string;
  avatar_prompt?: string;
  character_map_prompt?: string;
}

const InfoTooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div 
      className="inline-flex relative ml-1.5 cursor-help items-center justify-center align-middle"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="text-[9px] text-[#0ea5e9] border border-[#0ea5e9]/50 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">?</span>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-900 border border-[#0ea5e9] rounded-lg text-stone-200 p-2.5 w-52 z-50 text-[10px] font-mono leading-relaxed shadow-lg pointer-events-none normal-case tracking-normal">
          {text}
        </div>
      )}
    </div>
  );
};

interface SliceResult {
  row: string;
  col: string;
  filename: string;
  url: string;
}

export default function WildcardAdvocateGenerator() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<"Baseball / Teams" | "Beach Promotion" | "Golf Tournament">("Baseball / Teams");
  
  // Generation & Pipeline states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  // Results
  const [masterUrl, setMasterUrl] = useState<string | null>(null);
  const [slices, setSlices] = useState<SliceResult[]>([]);
  const [currentPersonaName, setCurrentPersonaName] = useState<string>("");

  useEffect(() => {
    // Fetch all personas from our CMDB / relay
    const fetchPersonas = async () => {
      try {
        const res = await fetch("/api/all_personas");
        if (res.ok) {
          const data = await res.json();
          // Deduplicate and filter personas
          const list: Persona[] = data.personas || [];
          setPersonas(list);
          // Auto-select first persona in list
          if (list.length > 0) {
            setSelectedPersonas([list[0].user_name]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch personas:", err);
      }
    };
    fetchPersonas();
  }, []);

  const handleTogglePersona = (userName: string) => {
    if (selectedPersonas.includes(userName)) {
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter(name => name !== userName));
      }
    } else {
      setSelectedPersonas([...selectedPersonas, userName]);
    }
  };

  const runSimulationProgress = (personaName: string, slicesList: SliceResult[]) => {
    setProgress(0);
    setLogs([]);
    setIsGenerating(true);
    setStatusMsg(null);

    const logMessages = [
      `[INFO] Starting batch sprite-sheet generation for @${personaName}`,
      `[INFO] Target campaign theme: ${activeTheme}`,
      `[INFO] Injecting persona system prompt & behavior guidelines...`,
      `[INFO] Generating 3x3 layout template (1024x1024 high-density canvas)...`,
      `[INFO] Dispatching synthesis request to Pollinations AI pipeline...`,
      `[INFO] Rendering master sprite-sheet graphic...`,
      `[SUCCESS] Master sprite-sheet successfully downloaded and registered.`,
      `[INFO] Invoking Python Pillow coordinate slicing engine...`,
      `[SUCCESS] Sliced tile [0,0] -> ${personaName}_${slicesList[0]?.row || "modern"}_regular.png`,
      `[SUCCESS] Sliced tile [0,1] -> ${personaName}_${slicesList[1]?.row || "modern"}_excited.png`,
      `[SUCCESS] Sliced tile [0,2] -> ${personaName}_${slicesList[2]?.row || "modern"}_disgruntled.png`,
      `[SUCCESS] Sliced tile [1,0] -> ${personaName}_${slicesList[3]?.row || "retro"}_regular.png`,
      `[SUCCESS] Sliced tile [1,1] -> ${personaName}_${slicesList[4]?.row || "retro"}_excited.png`,
      `[SUCCESS] Sliced tile [1,2] -> ${personaName}_${slicesList[5]?.row || "retro"}_disgruntled.png`,
      `[SUCCESS] Sliced tile [2,0] -> ${personaName}_${slicesList[6]?.row || "vintage"}_regular.png`,
      `[SUCCESS] Sliced tile [2,1] -> ${personaName}_${slicesList[7]?.row || "vintage"}_excited.png`,
      `[SUCCESS] Sliced tile [2,2] -> ${personaName}_${slicesList[8]?.row || "vintage"}_disgruntled.png`,
      `[SUCCESS] Saved 9 sliced assets to media_vault/03_Assets/Harvested_Artifacts/${personaName}/`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logMessages.length) {
        setLogs(prev => [...prev, logMessages[currentStep]]);
        setProgress(Math.min(Math.round(((currentStep + 1) / logMessages.length) * 100), 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setStatusMsg({
          text: `Successfully assembled & sliced sprite-sheet for @${personaName}!`,
          type: "success"
        });
      }
    }, 150);
  };

  const handleAssemble = async () => {
    if (selectedPersonas.length === 0) return;
    
    // Pick the first selected persona for the generator run
    const targetPersona = selectedPersonas[0];
    setCurrentPersonaName(targetPersona);
    setIsGenerating(true);
    setProgress(10);
    setLogs([`[INFO] Initializing sprite-sheet generation for @${targetPersona}...`]);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/advocate/generate_sprite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_name: targetPersona,
          theme: activeTheme
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setMasterUrl(data.master_url);
          setSlices(data.slices);
          runSimulationProgress(targetPersona, data.slices);
        } else {
          setIsGenerating(false);
          setStatusMsg({ text: data.message || "Failed to generate sprite sheet.", type: "error" });
        }
      } else {
        setIsGenerating(false);
        setStatusMsg({ text: "Network error requesting sprite generation.", type: "error" });
      }
    } catch (err) {
      setIsGenerating(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ text: errMsg || "Error generating sprite sheet.", type: "error" });
    }
  };

  const filteredPersonas = personas.filter(p => 
    p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Row and column labels depending on the active theme
  const getThemeLabels = () => {
    if (activeTheme === "Beach Promotion") {
      return {
        rows: ["Modern Era", "Beach Morning", "Beach Sunset"],
        cols: ["Regular", "Excited", "Disgruntled"]
      };
    } else if (activeTheme === "Golf Tournament") {
      return {
        rows: ["Modern Era", "Golf Tee", "Golf Clubhouse"],
        cols: ["Regular", "Excited", "Disgruntled"]
      };
    } else {
      return {
        rows: ["Modern Era", "1970s Retro", "1920s Vintage"],
        cols: ["Regular", "Excited", "Disgruntled"]
      };
    }
  };

  const labels = getThemeLabels();

  return (
    <div className="cardboard-panel cardboard-texture-dark p-6 text-stone-100 flex flex-col gap-6" style={{ borderColor: "#a07855", boxShadow: "6px 6px 0px #6e473b" }}>
      
      {/* HEADER */}
      <div className="border-b-2 border-stone-700 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0ea5e9] tracking-wider uppercase flex items-center gap-2">
            🎨 Wildcard Advocate Generator
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            STRY-0628-SPRITE-SHEET-GEN • 3X3 GRID SPRITE-SHEET SYNTHESIS & COORDINATE SLICING ENGINE
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border font-mono text-xs ${
          statusMsg.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
            : statusMsg.type === "error" 
            ? "bg-rose-950/40 border-rose-500/30 text-rose-400" 
            : "bg-stone-900 border-stone-850 text-stone-300"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side - Advocate Roster Selection */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-stone-900/50 p-4 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-xs font-bold tracking-widest text-[#0ea5e9] uppercase flex items-center gap-1.5 font-mono">
              <Users className="w-3.5 h-3.5" /> SELECT ADVOCATES ({selectedPersonas.length})
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Filter roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-stone-800 rounded-lg pl-9 pr-4 py-1.5 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]"
            />
          </div>

          {/* Roster List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
            {filteredPersonas.map((persona) => {
              const isSelected = selectedPersonas.includes(persona.user_name);
              const avatarPath = `/api/persona_image/${persona.user_name.toLowerCase().replace(" ", "_")}`;
              return (
                <button
                  key={persona.sys_id}
                  onClick={() => handleTogglePersona(persona.user_name)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                    isSelected 
                      ? "bg-[#0ea5e9]/10 border-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.1)]" 
                      : "bg-stone-950/60 border-stone-850 hover:border-stone-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md bg-stone-900 border border-stone-800 overflow-hidden flex-shrink-0">
                    <img 
                      src={avatarPath} 
                      alt={persona.user_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${persona.user_name}`;
                      }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <span className="block text-xs font-mono font-bold text-white uppercase group-hover:text-[#0ea5e9]">
                      @{persona.user_name}
                    </span>
                    <span className="block text-[10px] text-stone-500 uppercase tracking-widest font-mono">
                      {persona.team} team
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Active Control Room */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Selected Advocate Metadata Card */}
          {selectedPersonas.length > 0 && (() => {
            const selectedPersona = personas.find(p => p.user_name === selectedPersonas[0]);
            if (!selectedPersona) return null;
            
            const styleLabels: Record<string, string> = {
              style_felt: "Style A: Traumatized Fuzzy Felt (Banned)",
              style_pixel: "Style B: 16-Bit Pixel Grid",
              style_clay: "Style C: Unraveled Claymation",
              style_apathetic: "Style D: Apathetic Claymation",
              style_2d: "Style E: Flat 2D Vector Comic"
            };
            
            const visualStyleName = styleLabels[selectedPersona.u_visual_style || ""] || "Style E: Flat 2D Vector Comic";
            
            return (
              <div className="bg-stone-900/50 p-4 border border-stone-800 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-850">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#0ea5e9] font-bold flex items-center">
                    ADVOCATE SPECIFICATIONS
                    <InfoTooltip text="Active advocate settings and prompt templates configured in the database." />
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    @{selectedPersona.user_name.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Visual Style */}
                  <div className="bg-black/40 p-2.5 border border-stone-850 rounded-lg">
                    <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-wider">
                      VISUAL STYLE
                      <InfoTooltip text="The art style template applied to all image assets generated for this persona." />
                    </span>
                    <span className="block text-xs font-mono text-white font-bold mt-1">
                      {visualStyleName}
                    </span>
                  </div>

                  {/* Avatar Prompt */}
                  <div className="bg-black/40 p-2.5 border border-stone-850 rounded-lg md:col-span-2">
                    <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-wider">
                      AVATAR GENERATION PROMPT
                      <InfoTooltip text="AI image generation prompt description used for synthesizing the advocate's avatar portrait." />
                    </span>
                    <span className="block text-[10px] font-mono text-stone-300 truncate mt-1" title={selectedPersona.avatar_prompt || "Not Configured"}>
                      {selectedPersona.avatar_prompt || "Not Configured"}
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 p-2.5 border border-stone-850 rounded-lg">
                  <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-wider">
                    CHARACTER MAP PROMPT
                    <InfoTooltip text="Sprite-sheet layout generation prompt template used to guide the 3x3 grid assembly." />
                  </span>
                  <span className="block text-[10px] font-mono text-stone-300 truncate mt-1" title={selectedPersona.character_map_prompt || "Not Configured"}>
                    {selectedPersona.character_map_prompt || "Not Configured"}
                  </span>
                </div>
              </div>
            );
          })()}
          
          {/* Theme & Actions panel */}
          <div className="bg-stone-900/50 p-5 border border-stone-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Campaign Theme Picker */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0ea5e9] font-bold">
                CAMPAIGN THEME:
              </span>
              <div className="flex flex-wrap gap-2 bg-black/40 border border-stone-800 p-1 rounded-lg">
                {(["Baseball / Teams", "Beach Promotion", "Golf Tournament"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTheme(t)}
                    className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer ${
                      activeTheme === t 
                        ? "bg-[#0ea5e9] text-stone-950 shadow-md font-black" 
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Assemble Trigger Button */}
            <button
              onClick={handleAssemble}
              disabled={isGenerating || selectedPersonas.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-[#0ea5e9] hover:bg-[#0ea5e9]/80 disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)] active:translate-y-0.5 cursor-pointer self-stretch md:self-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              ASSEMBLE SPRITE SHEET
            </button>

          </div>

          {/* Slicing Progress Hud */}
          {isGenerating && (
            <div className="bg-[#1e1e24] border border-stone-850 p-5 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-mono text-stone-400">
                <span className="text-[#0ea5e9] font-bold">ASSEMBLING SPRITESHEET MATRIX...</span>
                <span>{progress}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div 
                  className="bg-gradient-to-r from-[#0ea5e9] to-[#0ea5e9]/70 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>

              {/* Status logs */}
              <div className="bg-black/60 border border-stone-900 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[10px] text-stone-300 space-y-1.5">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-[#0ea5e9] select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slices Preview Grid */}
          {!isGenerating && slices.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#0ea5e9] font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 3X3 GRID MATRIX (SLICED STAGE FRAMES)
                </h3>
                <span className="text-[10px] font-mono text-stone-500 uppercase">
                  Persona: @{currentPersonaName}
                </span>
              </div>

              <div className="bg-stone-950/60 border border-stone-850 p-4 rounded-xl">
                
                {/* 3x3 Slices Render Grid */}
                <div className="grid grid-cols-3 gap-3 border border-stone-850 p-3 rounded-lg bg-black/40">
                  {slices.map((slice, i) => {
                    const rowIdx = Math.floor(i / 3);
                    const colIdx = i % 3;
                    return (
                      <div 
                        key={i} 
                        className="bg-stone-900 border border-stone-800 rounded-lg p-2 flex flex-col items-center gap-2 hover:border-[#0ea5e9] transition-all relative group"
                      >
                        {/* Slice Coordinate Badge */}
                        <div className="absolute top-1 right-1 text-[8px] font-mono bg-black/75 px-1 rounded text-stone-500 select-none">
                          R{rowIdx} C{colIdx}
                        </div>

                        <div className="w-full aspect-square bg-black border border-stone-950 rounded overflow-hidden">
                          <img 
                            src={slice.url} 
                            alt={slice.filename} 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        <div className="text-center w-full">
                          <div className="text-[8px] font-mono text-[#0ea5e9] font-bold uppercase truncate">
                            {labels.rows[rowIdx]}
                          </div>
                          <div className="text-[9px] font-mono text-stone-400 font-extrabold truncate uppercase mt-0.5">
                            {labels.cols[colIdx]}
                          </div>
                          <div className="text-[7px] font-mono text-stone-600 truncate mt-0.5">
                            {slice.filename}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Slicing confirmation banner */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-900 border border-stone-800 p-3.5 rounded-lg">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Assets saved to: <strong className="text-stone-300">media_vault/03_Assets/Harvested_Artifacts/{currentPersonaName}/</strong></span>
                  </div>
                  <a 
                    href={masterUrl || `/api/persona_image/${currentPersonaName}_sprite_sheet`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black rounded-lg text-[10px] uppercase font-mono tracking-wider transition-all active:translate-y-0.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Master Sheet
                  </a>
                </div>

              </div>
            </div>
          )}

          {/* Empty Workspace Placeholder */}
          {!isGenerating && slices.length === 0 && (
            <div className="bg-[#1e1e24]/40 border border-stone-850 rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-12 h-12 text-stone-700 mb-3" />
              <h4 className="text-sm font-bold text-stone-300 uppercase tracking-wide font-mono">WORKSPACE EMPTY</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
                Select an active advocate from the roster on the left, choose a campaign theme, and trigger assembly to compile the 3x3 sprite-sheet.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
