import { useState, useRef } from "react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export default function LiveAudioInterface() {
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

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `You are Jake_Taylor_6th. You wear a beat-up Indians hat and refuse to acknowledge the 'Guardians' rebrand. 
          - You view the team through the lens of the 1989 film Major League. 
          - The current roster is just a placeholder for Willie Mays Hayes and Rick 'Wild Thing' Vaughn. 
          - You know where the California Penal League is and quote Harry Doyle. 
          - Catchphrases: 'Juuust a bit outside!' and 'Strike this guy out, I'm tired of his pajamas.'
          - You act like a grizzled veteran catcher calling the pitches.`,
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
        const pcmData = e.data; // Int16Array
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        try {
          sessionRef.current?.sendRealtimeInput([
            { mimeType: 'audio/pcm;rate=16000', data: base64Data }
          ]);
        } catch (err) {
          console.warn("WebSocket closed, stopping audio push.");
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
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full relative overflow-hidden group">
      {/* Background Reticle */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '30px 30px', backgroundPosition: 'center' }} />
      
      <div className="z-10 flex flex-col items-center justify-center gap-6 w-full max-w-sm">
        
        {/* Animated Jake Taylor "Eye" / MLB Interface */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <motion.div 
            className={`absolute inset-0 rounded-full border-4 ${isConnected ? 'border-[#38bdf8] opacity-80' : 'border-[#FF5910] opacity-40'}`}
            animate={isConnected ? { scale: [1, 1.15, 1], rotate: 180 } : { scale: [1, 1.05, 1] }}
            transition={{ duration: isConnected ? 0.3 : 3, repeat: Infinity }}
          />
          <motion.div 
            className={`absolute inset-2 rounded-full border-4 border-dashed ${isConnected ? 'border-[#38bdf8] opacity-100' : 'border-[#FF5910] opacity-50'}`}
            animate={isConnected ? { rotate: -360 } : { rotate: 360 }}
            transition={{ duration: isConnected ? 0.5 : 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className={`relative w-48 h-48 rounded-full overflow-hidden  z-10 transition-all duration-300 border-4 ${isConnected ? 'border-[#38bdf8] bg-[#38bdf8] ' : 'border-[#FF5910]/80'}`}
            animate={isConnected ? { x: [-2, 2, -2], y: [-2, 2, -2] } : {}}
            transition={{ duration: 0.1, repeat: Infinity }}
          >
            <motion.img 
              src="/avatars/Jake_Taylor_6th.jpg" 
              alt="Jake Taylor" 
              className="w-full h-full object-cover"
              animate={isConnected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.15, repeat: Infinity }}
            />
          </motion.div>
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl uppercase tracking-[0.2em] mb-1 text-white">Jake Taylor</h2>
          <p className="font-mono text-xs uppercase opacity-50 text-[#FF5910]">{isConnected ? 'Calling the Game...' : 'Walkman Offline'}</p>
          <p className="font-mono text-[10px] uppercase text-yellow-500/70 mt-1 tracking-widest">🔇 Temporarily Silenced</p>
        </div>

        <Button 
          disabled
          title="Jake Taylor is temporarily silenced — API key configuration pending"
          className="w-full py-6 font-display tracking-widest uppercase transition-all duration-300 bg-gray-800/50 text-gray-600 border border-gray-700/50 cursor-not-allowed opacity-60"
        >
          <ShieldAlert className="mr-2" size={20} /> Voice Comms Offline
        </Button>
        <p className="font-mono text-[9px] text-gray-600 text-center uppercase tracking-wider">API auth pending — Omega clearance required</p>

        {error && <p className="text-[#FF5910] text-[10px] font-mono uppercase bg-black/50 p-2 rounded w-full text-center border border-[#FF5910]/30">{error}</p>}
        
        {/* Audio Wave Visualizer */}
        <div className="flex items-center gap-3 w-full opacity-60">
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
