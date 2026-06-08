import { useState, useRef } from "react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface SovereignHelpAgentProps {
  agentName: string;
  agentAvatar: string;
}

export default function SovereignHelpAgent({ agentName, agentAvatar }: SovereignHelpAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | any>(null);
  const isConnectedRef = useRef(false);

  const startSession = async () => {
    try {
      const audioContext = new window.AudioContext({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule('/pcm-processor.js');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setError("VITE_GEMINI_API_KEY is missing from .env");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const session = await ai.live.connect({
        model: "gemini-2.0-flash-live-001",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            isConnectedRef.current = true;
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
          },
          onclose: () => {
            setIsConnected(false);
            isConnectedRef.current = false;
            stopMic();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection failed. Check API Keys and console.");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }, // Friendly, neutral voice
          },
          systemInstruction: `You are ${agentName}, a helpful and polite Sovereign OS Guide. 
          Your goal is to help users (like James's mom Eileen, his brother, or friends) understand what the Sovereign OS is and how to use the interface.
          Sovereign OS is an advanced edge-computing smart home and sports analytics interface built by James.
          Be welcoming, extremely patient, and clear. Avoid overly technical jargon unless explicitly asked.
          Do NOT use foul language. Be a cheerful assistant.`,
        },
      });
      
      sessionRef.current = session;
    } catch (err) {
      console.error(err);
      setError("Failed to initialize Gemini Live API or AudioWorklet.");
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = audioContextRef.current;
      if (!audioContext) throw new Error("AudioContext not found");
      
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
      processorRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        if (!isConnectedRef.current) return;
        // Guard: don't attempt send if session WebSocket is not open
        const wsState = sessionRef.current?._ws?.readyState ?? sessionRef.current?.readyState;
        if (wsState !== undefined && wsState !== WebSocket.OPEN) {
          isConnectedRef.current = false;
          return;
        }
        const pcmData = e.data; // Int16Array
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        try {
          sessionRef.current?.sendRealtimeInput([
            { mimeType: 'audio/pcm;rate=16000', data: base64Data }
          ]);
        } catch (err) {
          // WebSocket closed mid-flight — silence and flag so we stop sending
          isConnectedRef.current = false;
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or Worklet failed.");
    }
  };

  const stopMic = () => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsRecording(false);
  };

  const playAudio = (base64: string) => {
    if (!audioContextRef.current) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;
    const buffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
    buffer.getChannelData(0).set(float32);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const toggleConnection = () => {
    if (isConnected) sessionRef.current?.close();
    else startSession();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden group bg-black/40">
      <div className="z-10 flex flex-col items-center justify-center gap-6 w-full max-w-sm px-4">
        
        {/* Animated Avatar */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-2">
          <motion.div 
            className={`absolute inset-0 rounded-full border-4 ${isConnected ? 'border-[#38bdf8] opacity-80' : 'border-white/20 opacity-40'}`}
            animate={isConnected ? { scale: [1, 1.15, 1], rotate: 180 } : { scale: [1, 1.05, 1] }}
            transition={{ duration: isConnected ? 2 : 5, repeat: Infinity }}
          />
          <motion.div 
            className={`absolute inset-2 rounded-full border-4 border-dashed ${isConnected ? 'border-[#38bdf8] opacity-100' : 'border-white/10 opacity-50'}`}
            animate={isConnected ? { rotate: -360 } : { rotate: 360 }}
            transition={{ duration: isConnected ? 10 : 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className={`relative w-40 h-40 rounded-full overflow-hidden  z-10 transition-all duration-300 border-4 ${isConnected ? 'border-[#38bdf8] bg-[#38bdf8] ' : 'border-white/20'}`}
            animate={isConnected ? { y: [-2, 2, -2] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <motion.img 
              src={agentAvatar} 
              alt={agentName} 
              className="w-full h-full object-cover"
              animate={isConnected ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
              onError={(e) => { e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%230a0c10'/%3E%3Ccircle cx='75' cy='60' r='30' fill='%2338bdf8' opacity='0.3'/%3E%3Ccircle cx='75' cy='55' r='22' fill='%2338bdf8' opacity='0.5'/%3E%3Ctext x='75' y='62' text-anchor='middle' fill='white' font-size='22' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E` }}
            />
          </motion.div>
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl uppercase tracking-[0.2em] mb-1 text-white">{agentName}</h2>
          <p className="font-mono text-xs uppercase opacity-80 text-[#38bdf8]">{isConnected ? 'Listening...' : 'Awaiting Connection'}</p>
        </div>

        <Button 
          onClick={toggleConnection}
          className={`w-full py-6 font-display tracking-widest uppercase transition-all duration-300 ${
            isConnected 
              ? "bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50" 
              : "bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-white border border-[#38bdf8]/50"
          }`}
        >
          {isConnected ? (
            <><MicOff className="mr-2" size={20} /> End Connection</>
          ) : (
            <><Mic className="mr-2" size={20} /> Tap to Talk</>
          )}
        </Button>

        {error && <p className="text-red-400 text-[10px] font-mono uppercase bg-black/50 p-2 rounded w-full text-center border border-red-400/30">{error}</p>}
        
        {/* Audio Wave Visualizer */}
        <div className="flex items-center gap-3 w-full opacity-60 mt-4">
          <Volume2 size={16} className={isConnected ? "text-[#38bdf8]" : "text-gray-600"} />
          <div className="flex-1 h-3 bg-black/50 border border-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              className={`absolute inset-y-0 left-0 ${isConnected ? 'bg-[#38bdf8]' : 'bg-transparent'}`}
              animate={isRecording ? { width: ["10%", "85%", "35%", "95%"] } : { width: "0%" }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
