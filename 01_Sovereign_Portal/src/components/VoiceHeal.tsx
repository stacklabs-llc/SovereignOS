import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, RefreshCw, Volume2, ShieldAlert, CheckCircle, Wifi, Terminal } from "lucide-react";


interface VoiceHealResponse {
  action: string;
  service?: string;
  port?: number | null;
  port_alive?: boolean;
  message: string;
  raw_input?: string;
}

export default function VoiceHeal() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [response, setResponse] = useState<VoiceHealResponse | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      addLog("System: Web Speech API is not supported in this browser. Please use Chrome/Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setStatus("listening");
      addLog("Speech: Microphone capture started. Speak now...");
    };

    rec.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      addLog(`Speech: Captured transcript: "${speechToText}"`);
      handleSubmit(speechToText);
    };

    rec.onerror = (event: any) => {
      console.error(event);
      setIsRecording(false);
      setStatus("error");
      addLog(`Speech error: ${event.error}`);
    };

    rec.onend = () => {
      setIsRecording(false);
      if (status === "listening") {
        setStatus("idle");
      }
    };

    recognitionRef.current = rec;
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const toggleRecording = () => {
    if (!speechSupported) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      setResponse(null);
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    setStatus("processing");
    addLog(`API: Dispatching intent triage command to Sovereign Core...`);

    try {
      const res = await fetch(`/api/voice/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VoiceHealResponse = await res.json();
      setResponse(data);
      
      if (data.action === "recovered" || data.action === "no_action_needed") {
        setStatus("success");
      } else {
        setStatus("error");
      }
      
      addLog(`API Response: Action=${data.action} | ${data.message}`);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      addLog(`API error: ${err.message}`);
    }
  };

  const triggerDiagnosticTest = () => {
    const testPhrase = "the fucking servers are down";
    setTranscript(testPhrase);
    addLog(`Test: Simulating natural language complaint "${testPhrase}"`);
    handleSubmit(testPhrase);
  };

  return (
    <div className="h-full w-full bg-[#1c1410] text-[#e8dcd0] p-4 md:p-6 font-sans flex flex-col justify-start gap-4 relative overflow-y-auto select-none pb-24">
      {/* Background Craft Paper Texture & Gradients */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#c89666_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#c89666]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#9c6a46]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Card */}
      <div className="max-w-2xl mx-auto w-full bg-[#2a1e16] border border-[#3e2e22] rounded-2xl p-6 shadow-2xl backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between border-b border-[#3e2e22] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c89666]/20 border border-[#c89666]/40 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[#c89666]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide uppercase text-white">Sovereign Voice Heal</h1>
              <p className="text-xs text-[#a28e7e] font-mono">STRY1779840586 • NL SELF-RECOVERY</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1410] border border-[#3e2e22]">
            <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">TS Mesh Active</span>
          </div>
        </div>

        {/* Diagnostic Notice */}
        <div className="bg-[#1c1410] border border-[#3e2e22] rounded-xl p-4 mb-6 text-xs text-[#a28e7e] leading-relaxed relative">
          <span className="absolute top-3 right-3 text-[10px] font-mono text-[#c89666] font-bold uppercase px-1.5 py-0.5 rounded border border-[#c89666]/30">Permanent Policy</span>
          <p className="font-bold text-[#c89666] mb-1">🎙️ System Recovery Voice Triage Protocol</p>
          Speak your system status or issues naturally. The integrated AI will parse your intent and automatically heal, restart, or restore the target micro-services instantly.
        </div>

        {/* Central Audio Control Dome */}
        <div className="flex flex-col items-center justify-center py-8 border-y border-[#3e2e22] my-6">
          <div className="relative mb-6">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.15 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-[#c89666] rounded-full"
                ></motion.div>
              )}
            </AnimatePresence>
            
            <button
              onClick={toggleRecording}
              disabled={!speechSupported}
              className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                isRecording
                  ? "bg-red-950/80 border-red-500 text-red-400 shadow-red-500/20"
                  : "bg-[#3e2e22] border-[#c89666]/50 text-[#c89666] hover:bg-[#4a3a2a] hover:border-[#c89666]"
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm font-bold tracking-widest uppercase block text-white mb-1">
              {status === "listening" ? "Listening to Vocal Stream..." : 
               status === "processing" ? "Triage in Progress..." : 
               status === "success" ? "Recovery Action Deployed" : 
               status === "error" ? "System Alert" : 
               "Tap to Activate Matrix"}
            </span>
            <span className="text-xs text-[#a28e7e] font-mono">
              {!speechSupported ? "Web Speech Disabled" : isRecording ? "Speak now — AI is listening" : "Click mic and say 'ticketing is down' or 'restart relay'"}
            </span>
          </div>
        </div>

        {/* Output Displays */}
        <div className="space-y-4">
          {/* Transcript Block */}
          {transcript && (
            <div className="bg-[#1c1410] border border-[#3e2e22] rounded-xl p-4">
              <span className="block text-[10px] font-mono text-[#c89666] uppercase tracking-wider mb-2">Live Transcript</span>
              <p className="text-white text-sm font-mono italic">"{transcript}"</p>
            </div>
          )}

          {/* Core Response Card */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl p-4 ${
                response.port_alive 
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300" 
                  : "bg-amber-950/20 border-amber-800/40 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {response.port_alive ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-amber-400" />}
                <span className="font-bold text-sm text-white uppercase tracking-wide">Triage Output: {response.service || "Unknown Service"}</span>
              </div>
              <p className="text-xs leading-relaxed text-[#e8dcd0] mb-3">{response.message}</p>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/40 p-2.5 rounded-lg border border-[#3e2e22]">
                <div>ACTION: <span className="text-white font-bold">{response.action}</span></div>
                <div>PORT: <span className="text-white font-bold">{response.port ?? "N/A"}</span></div>
                <div>STATE: <span className="text-white font-bold">{response.port_alive ? "HEALTHY / BOUND" : "OFFLINE / FAILED"}</span></div>
                <div>TRIAGE: <span className="text-white font-bold">DETERMINISTIC AI</span></div>
              </div>
            </motion.div>
          )}

          {/* Quick Action Matrix for Testing */}
          <div className="pt-2">
            <span className="block text-[10px] font-mono text-[#a28e7e] uppercase tracking-wider mb-2">Diagnostic Injectors</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={triggerDiagnosticTest}
                className="px-3 py-2 rounded-lg bg-[#3e2e22] hover:bg-[#4a3a2a] border border-[#c89666]/30 text-xs text-[#c89666] font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Inject NL Outage Phrase
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Terminal Logging Deck */}
      <div className="max-w-2xl mx-auto w-full mt-6 bg-[#16100b] border border-[#2d2016] rounded-xl p-4 shadow-xl relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#c89666] uppercase tracking-widest border-b border-[#2d2016] pb-2 mb-2">
          <Terminal className="w-3.5 h-3.5" /> Triage Command Console Log
        </div>
        <div className="h-28 overflow-y-auto font-mono text-[10px] text-[#a28e7e] space-y-1 select-text scrollbar-thin scrollbar-thumb-[#3e2e22]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-[#5a483a] italic">CONSOLE IDLE — AWAITING STREAM MATRIX INTENT...</div>
          ) : (
            logs.map((log, idx) => <div key={idx} className="whitespace-pre-wrap">{log}</div>)
          )}
        </div>
      </div>

      {/* Treehouse Footer */}
      <div className="text-center text-[10px] font-mono text-[#5a483a] py-6 relative z-10">
        Sovereign OS decoupled platform core engine. Direct all triage issues to Pilot.
      </div>
    </div>
  );
}
