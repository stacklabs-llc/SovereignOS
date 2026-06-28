import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Loader2, Save, Calendar, Check, Play, Edit3, 
  BookOpen, Eye, User, Image, HelpCircle, Heart, ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StagedScenario {
  id: string;
  ticket_id: string;
  name: string;
  slug: string;
  expression_reference: string;
  vibe: string;
  prompt: string;
  status: 'Staged' | 'Generating' | 'Completed';
  created_at: string;
}

interface ArchivedAdventure {
  sys_id: string;
  name: string;
  file_name: string;
  file_path: string;
  md5_hash: string;
  created_at: string;
  slug: string;
  url: string;
}

export default function MetsyAdventuresWorkspace() {
  const [staged, setStaged] = useState<StagedScenario[]>([]);
  const [archive, setArchive] = useState<ArchivedAdventure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ArchivedAdventure | null>(null);
  
  // Form edit states
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editExpression, setEditExpression] = useState('');
  const [editVibe, setEditVibe] = useState('');
  
  // Fun status text for the generation process
  const [pipelineStep, setPipelineStep] = useState('Initializing...');

  const METSY_EMOTIONS: Record<string, string> = {
    "excited": "Metsy looking incredibly excited with wide sparkling green eyes, ears perked forward, and a joyful grin",
    "confused": "Metsy looking confused with her head tilted, one ear twitching askew, and a puzzled, questioning expression",
    "intrigued": "Metsy looking highly intrigued, leaning forward with intensely focused dilated green eyes, examining the scene with deep curiosity",
    "upset": "Metsy looking sassily upset, with her ears flattened backward in airplane mode, narrowed eyes, and a grumpy pout",
    "happy": "Metsy looking happy and contented with a relaxed posture, soft squinting green eyes, and a peaceful, smiling face",
    "sad": "Metsy looking sad with drooped ears, big teary-eyed green eyes, and a downcast, pathetic expression",
    "playful": "Metsy looking highly playful with her butt wiggling in the air, pupils dilated huge, and a mischievous ready-to-pounce grin",
    "inquisitive": "Metsy looking inquisitive with one paw raised, nose twitching, investigating her surroundings with alert curiosity",
    "full-on zoomies": "Metsy in a state of full-on zoomies, represented as a hyperactive blur of motion, crazed wide eyes, and an energetic, wild posture",
    "defcon greebles": "Metsy in a state of high alert reacting to invisible greebles, with a wide-eyed spooked stare at nothing, a puffed-up tail, and a tense posture (Defcon Greeble Alert)"
  };

  const handleExpressionChange = (newExpr: string) => {
    setEditExpression(newExpr);
    const newDesc = METSY_EMOTIONS[newExpr];
    if (!newDesc) return;

    let updatedPrompt = editPrompt;
    let replaced = false;

    // Try to find and replace any existing emotion description in the prompt
    for (const desc of Object.values(METSY_EMOTIONS)) {
      if (updatedPrompt.includes(desc)) {
        updatedPrompt = updatedPrompt.replace(desc, newDesc);
        replaced = true;
        break;
      }
    }

    // Fallback: If no known emotion description was found, inject it after the tracker collar description
    if (!replaced) {
      const anchor = "glowing multicolored LED tracker collar,";
      if (updatedPrompt.includes(anchor)) {
        updatedPrompt = updatedPrompt.replace(anchor, `${anchor} ${newDesc},`);
      } else {
        // As a last resort, prepend it to the action description
        const cleanLinesMarker = ", clean lines.";
        if (updatedPrompt.endsWith(cleanLinesMarker)) {
          const base = updatedPrompt.slice(0, -cleanLinesMarker.length);
          updatedPrompt = `${base}, ${newDesc}${cleanLinesMarker}`;
        }
      }
    }

    setEditPrompt(updatedPrompt);
  };

  const expressionPresets = [
    { label: "Riding Roombot 🤖", text: "riding on a roombot with cool sunglasses" },
    { label: "Bartering Gnomes 💎", text: "curious and bartering with gnomes, offering stolen socks and gloves" },
    { label: "Beach Day 🏖️", text: "relaxing on a beach chair in retro beach attire with colorful beach balls" },
    { label: "Spy Glass 🔍", text: "spying through thick bushes using giant binoculars" },
    { label: "Cardboard Wings ✈️", text: "wearing taped-on cardboard airplane wings, jumping off a wooden crate" }
  ];

  const cameoPresets = [
    { label: "Buster Squirrel 🐿️", text: "Buster the Squirrel watching from a tree branch" },
    { label: "General Pigeon 🐦", text: "General Pigeon standing at attention wearing a tiny paper hat" },
    { label: "Clawdia Tabby 🐈", text: "Clawdia the Tabby looking extremely skeptical" },
    { label: "Gnome Army 🪖", text: "a miniature army of angry garden gnomes" }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [stagedRes, archiveRes] = await Promise.all([
        fetch('/api/metsy/scenarios/staged'),
        fetch('/api/metsy/scenarios/archive')
      ]);
      if (stagedRes.ok) {
        const stagedData = await stagedRes.json();
        setStaged(stagedData);
      }
      if (archiveRes.ok) {
        const archiveData = await archiveRes.json();
        setArchive(archiveData);
      }
    } catch (err) {
      console.error("Error loading Metsy Workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (sc: StagedScenario) => {
    setEditingId(sc.id);
    setEditName(sc.name);
    setEditPrompt(sc.prompt);
    setEditExpression(sc.expression_reference);
    setEditVibe(sc.vibe);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/metsy/scenarios/staged/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          prompt: editPrompt,
          expression_reference: editExpression,
          vibe: editVibe
        })
      });
      if (res.ok) {
        setEditingId(null);
        // Refresh staged list locally
        setStaged(prev => prev.map(sc => sc.id === id ? {
          ...sc,
          name: editName,
          prompt: editPrompt,
          expression_reference: editExpression,
          vibe: editVibe
        } : sc));
      }
    } catch (err) {
      console.error("Failed to save scenario edits:", err);
    }
  };

  const handleInjectPreset = (text: string, type: 'prompt' | 'expression') => {
    if (type === 'prompt') {
      // Append nicely to prompt before the closing style description if possible, or just append
      const targetStyleMarker = ", clean lines.";
      if (editPrompt.endsWith(targetStyleMarker)) {
        const base = editPrompt.slice(0, -targetStyleMarker.length);
        setEditPrompt(`${base}, ${text}${targetStyleMarker}`);
      } else {
        setEditPrompt(`${editPrompt} ${text}`);
      }
    } else {
      setEditExpression(text);
    }
  };

  const handleGenerate = async (id: string) => {
    setGeneratingId(id);
    setPipelineStep('Warming up synthesis engine...');
    
    // Simulate pipeline steps for visual feedback
    const steps = [
      'Querying staged concept context...',
      'Retrieving metsy_anchor_2d.jpeg style anchor...',
      'Mapping tabby fur contour weights...',
      'Executing Vertex AI Imagen 3 edit-image pipeline...',
      'Applying Calvin & Hobbes watercolor washes...',
      'Registering asset with CMDB and LEDger...',
      'Writing execution receipt...',
      'Distributing image to outposts...'
    ];
    
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setPipelineStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 2500);

    try {
      const res = await fetch(`/api/metsy/scenarios/generate/${id}`, {
        method: 'POST'
      });
      clearInterval(interval);
      if (res.ok) {
        setPipelineStep('Success! Catalog updated.');
        setTimeout(() => {
          setGeneratingId(null);
          loadData(); // Reload both grids
        }, 1000);
      } else {
        alert("Generation failed. See terminal output for detailed logs.");
        setGeneratingId(null);
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Failed to trigger generation:", err);
      setGeneratingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#d7a15c]/20 p-6 font-sans select-none overflow-y-auto">
      {/* Wooden Sign Header */}
      <div className="relative max-w-7xl mx-auto mb-8 bg-[#c89650] border-4 border-[#8B4513] rounded-xl p-6 shadow-xl overflow-hidden">
        {/* Wood planks grain simulation */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(0deg,#000,#000_10px,transparent_10px,transparent_20px)]" />
        <div className="relative flex flex-col md:flex-row items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center border-4 border-[#8B4513] shadow-md rotate-[-4deg]">
              <span className="text-3xl">🐾</span>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-[#3e2723] tracking-wider uppercase drop-shadow" style={{ fontFamily: '"Patrick Hand", cursive, sans-serif' }}>
                Metsy's Daily Adventures
              </h1>
              <p className="text-[#5d4037] font-semibold mt-1" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
                Cozy 90s Cardboard Treehouse Staging Suite & Polaroid Scrapbook
              </p>
            </div>
          </div>
          <button 
            onClick={loadData}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-[#8B4513] hover:bg-[#5d4037] text-white font-bold rounded-lg border-2 border-[#fffbeb] transition-all shadow-md active:translate-y-0.5"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Shake the Treehouse (Refresh)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE STAGING BOARD (INDEX CARDS) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-[#bda17a] border-4 border-[#8b7355] rounded-xl p-4 mb-4 shadow-lg flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#2e2518] flex items-center gap-2" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              <span>📦</span> Staged Scenarios Review Board
            </h2>
            <span className="px-3 py-1 bg-[#fffbeb] text-[#5d4037] border-2 border-[#8b7355] rounded-full text-xs font-black">
              {staged.length} Awaiting Pilot Approval
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-[#dfcca7]/40 rounded-xl border-4 border-dashed border-[#bda17a]">
              <Loader2 className="w-12 h-12 text-[#8B4513] animate-spin mb-4" />
              <p className="text-[#5d4037] font-bold">Rummaging through the cardboard boxes...</p>
            </div>
          ) : staged.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-[#dfcca7]/30 rounded-xl border-4 border-dashed border-[#bda17a] p-8 text-center">
              <span className="text-6xl mb-4">💤</span>
              <h3 className="text-xl font-bold text-[#5d4037] mb-2">All scenarios processed and cleared!</h3>
              <p className="text-[#795548] max-w-md">No scenarios are currently staged. The daily cron task will automatically generate new drafts tomorrow morning, or you can trigger a seed run.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {staged.map((sc) => (
                <div 
                  key={sc.id} 
                  className="relative bg-[#fffbeb] border-4 border-[#bda17a] rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden"
                  style={{ transform: `rotate(${(parseInt(sc.id.slice(0,2), 16) % 3) - 1.5}deg)` }}
                >
                  {/* Duct Tape Strip Top-Header */}
                  <div className="w-full h-8 bg-slate-400/80 relative border-b-2 border-slate-500/30 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05),rgba(255,255,255,0.05)_10px,transparent_10px,transparent_20px)] pointer-events-none" />
                    <span className="text-xs font-black text-slate-800 tracking-wider uppercase">
                      📎 DUCT TAPE LOCK: {sc.ticket_id}
                    </span>
                  </div>

                  <div className="p-5">
                    {editingId === sc.id ? (
                      /* EDITING STATED CARD VIEW */
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-[#5d4037] uppercase mb-1">Scenario Name</label>
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#fefcff]/80 border-2 border-[#bda17a] rounded p-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#8B4513]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-[#5d4037] uppercase mb-1">🐾 Metsy's Expression</label>
                            <select 
                              value={editExpression} 
                              onChange={(e) => handleExpressionChange(e.target.value)}
                              className="w-full bg-[#fefcff]/80 border-2 border-[#bda17a] rounded p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#8B4513]"
                            >
                              <option value="">-- Choose Expression --</option>
                              <option value="excited"> excited (Wide sparkling green eyes)</option>
                              <option value="confused"> confused (Head tilted, one ear askew)</option>
                              <option value="intrigued"> intrigued (Focused, pupils dilated)</option>
                              <option value="upset"> upset (Airplane ears, grumpy pout)</option>
                              <option value="happy"> happy (Relaxed posture, soft squint)</option>
                              <option value="sad"> sad (Drooped ears, big teary eyes)</option>
                              <option value="playful"> playful (Butt in air, mischievous grin)</option>
                              <option value="inquisitive"> inquisitive (Paw raised, twitching nose)</option>
                              <option value="full-on zoomies"> full-on zoomies (Blur of action, wild posture)</option>
                              <option value="defcon greebles"> defcon greebles (Wide-eyed greeble alert)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-black text-[#5d4037] uppercase mb-1">Art Vibe Style</label>
                            <input 
                              type="text" 
                              value={editVibe} 
                              onChange={(e) => setEditVibe(e.target.value)}
                              className="w-full bg-[#fefcff]/80 border-2 border-[#bda17a] rounded p-2 text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-[#5d4037] uppercase mb-1">Vertex Imagen 3 Prompt</label>
                          <textarea 
                            rows={5}
                            value={editPrompt} 
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full bg-[#fefcff]/80 border-2 border-[#bda17a] rounded p-2 text-xs font-medium text-slate-700 leading-relaxed focus:outline-none focus:border-[#8B4513]"
                          />
                        </div>

                        {/* Presets Injectors */}
                        <div className="bg-[#f2e5d5] p-3 rounded-lg border border-[#bda17a]">
                          <span className="text-xs font-black text-[#5d4037] block mb-2">🐾 Crayon Preset Injectors (Appends to prompt)</span>
                          
                          <div className="mb-3">
                            <span className="text-[10px] font-bold text-[#8b7355] block mb-1">Metsy Expressions:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {expressionPresets.map((preset, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleInjectPreset(preset.text, 'prompt')}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-[11px] font-medium text-amber-900 transition-colors"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-[#8b7355] block mb-1">Cameo Characters:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {cameoPresets.map((preset, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleInjectPreset(preset.text, 'prompt')}
                                  className="px-2 py-1 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded text-[11px] font-medium text-sky-950 transition-colors"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button 
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 border-2 border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-100 text-xs transition-colors"
                          >
                            Toss Draft (Cancel)
                          </button>
                          <button 
                            onClick={() => handleSaveEdit(sc.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded border-2 border-emerald-700 hover:bg-emerald-700 text-xs transition-colors shadow"
                          >
                            <Save size={14} />
                            Pin to Card (Save)
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* STATIC READ-ONLY CARD VIEW */
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-black text-[#3e2723]" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
                              {sc.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                {sc.expression_reference}
                              </span>
                              <span className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                {sc.vibe}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleStartEdit(sc)}
                              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded transition-all shadow-sm active:translate-y-0.5"
                              title="Edit Prompt / Expression"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#fdfbf7] border border-[#e8dccb] p-3 rounded text-xs leading-relaxed text-slate-700 italic">
                          "{sc.prompt}"
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Staged on: {new Date(sc.created_at).toLocaleDateString()}
                          </span>

                          <button 
                            onClick={() => handleGenerate(sc.id)}
                            disabled={generatingId !== null}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-extrabold text-xs rounded border-2 border-amber-900 shadow-md transition-all active:translate-y-0.5 disabled:opacity-50"
                          >
                            <Play size={14} />
                            Approve & Ingest (Run Imagen)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Generation Loading Screen Overlays */}
                  {generatingId === sc.id && (
                    <div className="absolute inset-0 bg-[#3e2723]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
                      <div className="relative w-24 h-24 mb-6">
                        {/* Custom cozy box spinner */}
                        <div className="absolute inset-0 rounded-xl border-4 border-dashed border-amber-500 animate-spin" />
                        <span className="absolute inset-0 flex items-center justify-center text-4xl">🎨</span>
                      </div>
                      <h4 className="text-xl font-black text-amber-400 mb-2" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
                        Synthesizing Metsy's Next Adventure...
                      </h4>
                      <p className="text-amber-100/80 text-xs font-mono max-w-md animate-pulse">
                        {pipelineStep}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: THE POLAROID SCRAPBOOK (COMPLETED ADVENTURES) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#8b7355] border-4 border-[#5d4037] rounded-xl p-4 mb-6 shadow-lg flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#fffbeb] flex items-center gap-2" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              <span>📷</span> Polaroid Adventure Scrapbook
            </h2>
            <span className="px-3 py-1 bg-[#fffbeb] text-[#5d4037] border-2 border-[#5d4037] rounded-full text-xs font-black">
              {archive.length} Snaps In Ledger
            </span>
          </div>

          {archive.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-[#dfcca7]/20 rounded-xl border-4 border-dashed border-[#8b7355] p-8 text-center">
              <span className="text-5xl mb-4">📭</span>
              <h3 className="text-lg font-bold text-[#5d4037] mb-1">Your photo scrapbook is empty!</h3>
              <p className="text-xs text-[#795548] max-w-xs">Approve and ingest staged scenarios on the left board to build Metsy's polaroid wall.</p>
            </div>
          ) : (
            /* Polaroid Photo Wall */
            <div className="grid grid-cols-2 gap-6 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
              {archive.map((photo, idx) => {
                // Generate a consistent pseudo-random tilt angle for polaroid aesthetic
                const tilt = ((idx * 7) % 11) - 5;
                return (
                  <motion.div
                    key={photo.sys_id}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                    onClick={() => setSelectedPhoto(photo)}
                    className="cursor-pointer bg-white p-3 shadow-md hover:shadow-xl transition-all border border-slate-200 rounded flex flex-col items-center"
                    style={{ rotate: `${tilt}deg` }}
                  >
                    {/* Polaroid Picture Frame */}
                    <div className="w-full aspect-square bg-[#f3f4f6] relative overflow-hidden border border-slate-300/40 rounded-sm mb-3">
                      <img 
                        src={photo.url} 
                        alt={photo.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback avatar image if path hasn't loaded yet
                          (e.target as HTMLImageElement).src = "/images/holodex_paper_bag.png";
                        }}
                      />
                    </div>
                    
                    {/* Handwritten Polaroid bottom margin */}
                    <div className="w-full text-center px-1">
                      <p className="text-xs font-black text-slate-800 truncate" style={{ fontFamily: '"Patrick Hand", cursive, sans-serif' }}>
                        {photo.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {photo.slug}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* PHOTO DETAIL OVERLAY MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
              className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-xl w-full flex flex-col items-center relative border-8 border-[#fffbeb]"
            >
              {/* Duct tape top corners */}
              <div className="absolute top-[-15px] left-10 w-24 h-8 bg-slate-400/80 border border-slate-500/20 rotate-[-12deg] pointer-events-none" />
              <div className="absolute top-[-15px] right-10 w-24 h-8 bg-slate-400/80 border border-slate-500/20 rotate-[12deg] pointer-events-none" />

              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-2xl font-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                ×
              </button>

              <div className="w-full aspect-square bg-[#f3f4f6] rounded border border-slate-300 overflow-hidden shadow-inner mb-6">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: '"Patrick Hand", cursive, sans-serif' }}>
                  {selectedPhoto.name}
                </h3>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                    slug: {selectedPhoto.slug}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                    md5: {selectedPhoto.md5_hash.slice(0, 12)}...
                  </span>
                </div>

                <p className="text-slate-500 text-xs mt-4 border-t border-dashed border-slate-200 pt-4">
                  Asset Tag: <span className="font-mono font-bold text-slate-800">FS-MED</span> • Created on: {new Date(selectedPhoto.created_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
