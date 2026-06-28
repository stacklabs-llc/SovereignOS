import React, { useState, useEffect } from "react";
import { 
  Terminal, ShieldAlert, Check, AlertTriangle, Cpu, Play, 
  Settings, Layers, Sliders, ToggleLeft, ToggleRight, Sparkles, Send 
} from "lucide-react";

interface StagedPrompt {
  id: string;
  prompt: string;
  system_instruction: string | null;
  model: string | null;
  persona: string | null;
  game_pk: string | null;
  status: string;
}

export default function PromptPreviewConsole() {
  const [interceptMode, setInterceptMode] = useState(false);
  const [stagedPrompts, setStagedPrompts] = useState<StagedPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
  // Edit Override states
  const [systemInstructionText, setSystemInstructionText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simulation form states
  const [simPersona, setSimPersona] = useState("@barf");
  const [simModel, setSimModel] = useState("gemini-2.5-flash");
  const [simGamePk, setSimGamePk] = useState("823610");
  const [simSystemInstruction, setSimSystemInstruction] = useState(
    "You are @barf, a passionate New York Mets fan who is perpetually miserable. Respond to the active baseball game telemetry in an unhinged rant. Keep decorum OFF."
  );
  const [simPrompt, setSimPrompt] = useState(
    "Telemetry updates: PHI @ NYM, Citi Field. Bottom of the 9th, 2 outs, bases loaded. Pete Alonso strikes out swinging. Describe your misery."
  );

  // Fetch interceptor status & list
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/prompt/intercept");
      if (res.ok) {
        const data = await res.json();
        setInterceptMode(data.intercept_mode);
        const stagedList: StagedPrompt[] = data.staged || [];
        setStagedPrompts(stagedList);
        
        // Select first pending staged prompt if none selected
        const pending = stagedList.filter(p => p.status === "staged");
        if (pending.length > 0) {
          if (!selectedPromptId || !stagedList.some(p => p.id === selectedPromptId && p.status === "staged")) {
            const firstPending = pending[0];
            setSelectedPromptId(firstPending.id);
            setSystemInstructionText(firstPending.system_instruction || "");
            setPromptText(firstPending.prompt || "");
          }
        } else if (stagedList.length > 0 && !selectedPromptId) {
          setSelectedPromptId(stagedList[0].id);
          setSystemInstructionText(stagedList[0].system_instruction || "");
          setPromptText(stagedList[0].prompt || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch prompt intercept status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, [selectedPromptId]);

  // Sync edit boxes when selection changes
  const handleSelectPrompt = (p: StagedPrompt) => {
    setSelectedPromptId(p.id);
    setSystemInstructionText(p.system_instruction || "");
    setPromptText(p.prompt || "");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Toggle intercept mode
  const handleToggleIntercept = async () => {
    try {
      const res = await fetch("/api/prompt/intercept/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercept_mode: !interceptMode })
      });
      if (res.ok) {
        const data = await res.json();
        setInterceptMode(data.intercept_mode);
        setSuccessMsg(`Prompt Interception ${data.intercept_mode ? "ENABLED" : "DISABLED"}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Toggle intercept failed:", err);
    }
  };

  // Release prompt
  const handleRelease = async (id: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/prompt/release/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        setSuccessMsg("Prompt released to Vertex AI without modifications.");
        setSelectedPromptId(null);
        await fetchStatus();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to release prompt");
      }
    } catch (err) {
      setErrorMsg("Network error when releasing prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Override prompt
  const handleOverride = async (id: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/prompt/override/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          system_instruction: systemInstructionText
        })
      });
      if (res.ok) {
        setSuccessMsg("Prompt overridden and released to Vertex AI successfully.");
        setSelectedPromptId(null);
        await fetchStatus();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to override prompt");
      }
    } catch (err) {
      setErrorMsg("Network error when overriding prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage simulation
  const handleSimulateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/prompt/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: simPrompt,
          system_instruction: simSystemInstruction,
          model: simModel,
          persona: simPersona,
          game_pk: simGamePk
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action === "pass") {
          setSuccessMsg("Ingest Mode Active: Simulation passed directly to generator (Intercept mode is OFF).");
        } else {
          setSuccessMsg("Mock prompt staged successfully! It will appear in the queue below.");
        }
        await fetchStatus();
      } else {
        setErrorMsg("Failed to stage simulation prompt.");
      }
    } catch (err) {
      setErrorMsg("Network error on staging mock prompt.");
    }
  };

  const selectedPrompt = stagedPrompts.find(p => p.id === selectedPromptId);

  return (
    <div className="w-full flex flex-col gap-6 text-stone-200">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-[#0f111a] border border-[#00b4d8]/20 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Terminal className="w-48 h-48 text-[#00b4d8]" />
        </div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-[#00b4d8]/10 border border-[#00b4d8]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,180,216,0.2)]">
            <ShieldAlert className="w-6 h-6 text-[#00b4d8] animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">Vertex Prompt Inspection Console</h1>
            <p className="text-xs text-stone-400 font-mono mt-0.5">STRY-0628-PROMPT-PREVIEW • Decoupled LLM Payload Staging</p>
          </div>
        </div>

        {/* Global Toggle Button */}
        <div className="mt-4 md:mt-0 flex items-center gap-3 z-10 bg-black/40 border border-stone-800 p-2.5 rounded-xl">
          <span className="text-xs font-mono font-bold tracking-wider text-stone-400">
            INTERCEPT GATEWAY:
          </span>
          <button 
            onClick={handleToggleIntercept}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${
              interceptMode 
                ? "bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/50 shadow-[0_0_15px_rgba(0,180,216,0.2)]" 
                : "bg-stone-800 text-stone-400 border border-stone-700"
            }`}
          >
            {interceptMode ? <ToggleRight className="w-5 h-5 text-[#00b4d8]" /> : <ToggleLeft className="w-5 h-5" />}
            {interceptMode ? "ACTIVE (STAGING ON)" : "BYPASS (STAGING OFF)"}
          </button>
        </div>
      </div>

      {/* Message Banners */}
      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar (35% width) - Roster of Staged Prompts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#0f111a] border border-stone-800/80 rounded-2xl p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <span className="text-xs font-bold tracking-widest text-[#00b4d8] uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> STAGED TELEMETRY QUEUE
              </span>
              <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 rounded-full text-[10px] font-mono text-stone-400">
                {stagedPrompts.filter(p => p.status === "staged").length} Pending
              </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {stagedPrompts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-800 rounded-xl">
                  <span className="text-3xl mb-2">💤</span>
                  <p className="text-xs font-bold text-stone-500">No staged payloads found.</p>
                  <p className="text-[10px] text-stone-600 mt-1 max-w-xs">
                    Enable the Intercept Gateway and perform a simulation run below to test the queue pipeline.
                  </p>
                </div>
              ) : (
                stagedPrompts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPrompt(p)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group ${
                      selectedPromptId === p.id 
                        ? "bg-[#00b4d8]/10 border-[#00b4d8] shadow-[0_0_15px_rgba(0,180,216,0.1)]" 
                        : "bg-stone-900/60 border-stone-800/80 hover:border-stone-700"
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {p.status === "staged" && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00b4d8] rounded-bl-lg shadow-[0_0_10px_#00b4d8]" />
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-[#00b4d8] transition-colors">
                        {p.persona || "Anonymous"}
                      </span>
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                        p.status === "staged"
                          ? "text-[#00b4d8] border-[#00b4d8]/30 bg-[#00b4d8]/5"
                          : p.status === "released"
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                          : "text-orange-400 border-orange-500/20 bg-orange-500/5"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-400 font-mono line-clamp-2">
                      {p.prompt}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-stone-500 font-mono mt-1 border-t border-stone-800/50 pt-1.5">
                      <span>Model: {p.model || "default"}</span>
                      <span>Game ID: {p.game_pk || "N/A"}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Workspace (65% width) - Raw Payload Editor */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {selectedPrompt ? (
            <div className="bg-[#0f111a] border border-stone-800 rounded-2xl p-6 flex flex-col h-[520px] justify-between">
              
              {/* Top Details & Weight Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-800">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#00b4d8]">Active Persona</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{selectedPrompt.persona || "@barf"}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                      [ PREMIUM ]
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono mt-0.5">Game Telemetry FQDN: PHI @ NYM</span>
                </div>

                {/* Token Weight Gauges */}
                <div className="flex flex-col justify-center gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-stone-400">
                      <span>Personality Weight:</span>
                      <span className="text-[#00b4d8] font-bold">85%</span>
                    </div>
                    <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
                      <div className="bg-gradient-to-r from-[#00b4d8] to-[#00b4d8] h-full rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-stone-400">
                      <span>Venue Inflation (Citi Field):</span>
                      <span className="text-stone-300 font-bold">15%</span>
                    </div>
                    <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
                      <div className="bg-gradient-to-r from-stone-600 to-stone-400 h-full rounded-full" style={{ width: "15%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Prompt Body Text Areas */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-hidden">
                
                {/* System Instruction (Behavioral Guide) */}
                <div className="flex flex-col h-full">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#00b4d8]" /> System Instructions (Ruleset)
                  </label>
                  <textarea
                    value={systemInstructionText}
                    onChange={(e) => setSystemInstructionText(e.target.value)}
                    disabled={selectedPrompt.status !== "staged"}
                    className="flex-1 w-full bg-black/60 border border-stone-800 rounded-xl p-3.5 font-mono text-xs text-stone-300 focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] resize-none leading-relaxed"
                  />
                </div>

                {/* Main Telemetry & User Prompt */}
                <div className="flex flex-col h-full">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#00b4d8]" /> User Prompt (Live Telemetry)
                  </label>
                  <div className="flex-1 flex flex-col gap-2 relative">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      disabled={selectedPrompt.status !== "staged"}
                      className="flex-1 w-full bg-black/60 border border-stone-800 rounded-xl p-3.5 font-mono text-xs text-stone-300 focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] resize-none leading-relaxed"
                    />
                    
                    {/* Simulated Constraint Highlights HUD overlay */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/80 border border-stone-800/80 px-2 py-1 rounded text-[9px] font-mono text-stone-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00b4d8] animate-pulse" />
                      Highlighting Injected Constraints
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Console Buttons */}
              <div className="pt-4 border-t border-stone-800 flex justify-between items-center gap-4">
                <div className="text-[10px] font-mono text-stone-500 uppercase">
                  STATUS: <span className="text-white font-bold">{selectedPrompt.status}</span>
                </div>
                
                {selectedPrompt.status === "staged" ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRelease(selectedPrompt.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#00b4d8]/10 hover:bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/40 hover:border-[#00b4d8] rounded-xl text-xs font-bold uppercase transition-all shadow-md active:translate-y-0.5"
                    >
                      <Play className="w-4 h-4" /> RELEASE TO VERTEX
                    </button>
                    
                    <button
                      onClick={() => handleOverride(selectedPrompt.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md active:translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4" /> HARD OVERRIDE PROMPT
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-stone-500 italic">
                    Prompt was already processed as {selectedPrompt.status} and cannot be modified.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#0f111a] border border-stone-800 rounded-2xl p-8 flex flex-col h-[520px] items-center justify-center text-center">
              <span className="text-5xl mb-4">🖥️</span>
              <h3 className="text-lg font-black text-white tracking-wide">Ready for Payload Inspection</h3>
              <p className="text-stone-400 text-xs mt-1.5 max-w-md leading-relaxed">
                Select a staged prompt from the queue on the left to inspect its system instructions, raw telemetry structure, and inject custom overrides.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Simulated Ingestion Tool Panel */}
      <div className="bg-[#0f111a] border border-stone-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-[#00b4d8] uppercase tracking-widest border-b border-stone-800 pb-3 mb-4">
          <Send className="w-4 h-4" /> Simulate Vertex Ingestion (UAT Playground)
        </div>

        <form onSubmit={handleSimulateStage} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                Target Persona Handle
              </label>
              <input
                type="text"
                value={simPersona}
                onChange={(e) => setSimPersona(e.target.value)}
                className="w-full bg-black/60 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#00b4d8]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                Active Vertex Model
              </label>
              <input
                type="text"
                value={simModel}
                onChange={(e) => setSimModel(e.target.value)}
                className="w-full bg-black/60 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#00b4d8]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                MLB Gameday PK
              </label>
              <input
                type="text"
                value={simGamePk}
                onChange={(e) => setSimGamePk(e.target.value)}
                className="w-full bg-black/60 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#00b4d8]"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                System Instructions
              </label>
              <textarea
                rows={2}
                value={simSystemInstruction}
                onChange={(e) => setSimSystemInstruction(e.target.value)}
                className="flex-1 w-full bg-black/60 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#00b4d8] resize-none"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                Raw Prompt (Telemetry & Context)
              </label>
              <textarea
                rows={3}
                value={simPrompt}
                onChange={(e) => setSimPrompt(e.target.value)}
                className="flex-1 w-full bg-black/60 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300 focus:outline-none focus:border-[#00b4d8] resize-none"
              />
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-3 bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-black font-extrabold text-xs rounded-xl transition-all shadow-md active:translate-y-0.5"
              >
                <Send className="w-3.5 h-3.5" /> INGEST SIMULATED PROMPT
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
