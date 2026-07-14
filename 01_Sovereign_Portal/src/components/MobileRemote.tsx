import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function MobileRemote() {
    const [statusText, setStatusText] = useState("AWAITING PILOT TARGET");
    const [selectedRoom, setSelectedRoom] = useState<"starter" | "claude" | "snackbar" | "auditor" | "pegasus">("starter");

    const castToTV = (targetIp: string, targetName: string) => {
        setStatusText(`CASTING TO ${targetName}...`);
        const targetUrl = window.location.origin + window.location.pathname + "?room=" + selectedRoom;
        
        fetch(`/api/cast_tv/${targetIp}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
        }).then(() => {
            setStatusText(`SUCCESS: OVERRIDING ${targetName}`);
            setTimeout(() => setStatusText("AWAITING PILOT TARGET"), 3000);
        }).catch(() => {
            setStatusText("ERROR: MESH FAILURE");
            setTimeout(() => setStatusText("AWAITING PILOT TARGET"), 3000);
        });
    };

    const rooms = [
        { id: "starter", name: "Level 1: ChatGPT", color: "#E0BC68", bg: "bg-[#C79B3A]/20", border: "border-[#C79B3A]" },
        { id: "claude", name: "Level 1: Claude", color: "#d4af37", bg: "bg-[#1a6b3c]/30", border: "border-[#d4af37]" },
        { id: "snackbar", name: "Gritty's Dive Bar", color: "#ff00ff", bg: "bg-[#ff00ff]/20", border: "border-[#ff00ff]/50" },
        { id: "auditor", name: "Umpire's Review", color: "#ff3344", bg: "bg-[#ff3344]/20", border: "border-[#ff3344]/50" },
        { id: "pegasus", name: "Pegasus Matrix", color: "#00ffcc", bg: "bg-[#00ffcc]/20", border: "border-[#00ffcc]/50" }
    ];

    return (
        <div className="fixed inset-0 min-h-[100dvh] w-full bg-black text-white flex flex-col font-mono z-[100] overflow-y-auto overflow-x-hidden p-6 gap-6">
            <header className="w-full text-center py-4 border-b border-white/10 flex flex-col items-center">
                <div className="w-12 h-1 bg-[#00ffcc] mb-4 rounded-full "></div>
                <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#00ffcc] drop-">Sovereign Cast</h1>
                <p className="text-[10px] text-white/50 tracking-[0.3em] mt-2">DREADNOUGHT REMOTE COMMAND</p>
            </header>

            <div className="flex-1 flex flex-col gap-8">
                {/* Status Indicator */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4 text-center shadow-inner">
                    <span className={`text-xs uppercase font-bold tracking-widest ${statusText.includes("ERROR") ? 'text-red-500 animate-pulse' : statusText.includes("SUCCESS") ? 'text-[#00ffcc]' : 'text-[#facc15]'}`}>
                        {statusText}
                    </span>
                </div>

                {/* Mobile Asset Ingestion (Pixel Drop Zone) */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 px-2">📷 Direct Mobile Uploads</h2>
                    <a
                        href="/?domain=ROOT&room=pixel_dropzone"
                        className="bg-gradient-to-r from-[#00d4ff]/20 to-[#e879f9]/20 border border-[#00d4ff]/40 py-5 rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-center text-[#00d4ff] hover:from-[#00d4ff]/30 hover:to-[#e879f9]/30 hover:border-[#00d4ff] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                    >
                        💧 Open Pixel Drop Zone
                    </a>
                </div>

                {/* Matrix Payload Selector */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 px-2">1. Select Matrix Payload</h2>
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room.id as any)}
                            className={`p-5 rounded-2xl flex items-center justify-between transition-all duration-300 ${
                                selectedRoom === room.id 
                                ? `${room.bg} ${room.border} border-2  scale-[1.02]` 
                                : 'bg-[#111] border border-white/5 hover:bg-[#222]'
                            }`}
                        >
                            <span className="font-sans font-bold uppercase tracking-widest text-sm" style={{ color: selectedRoom === room.id ? room.color : '#888' }}>
                                {room.name}
                            </span>
                            {selectedRoom === room.id && (
                                <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: room.color }}></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Hardware Deployment Targets */}
                <div className="flex flex-col gap-3 mb-8">
                    <h2 className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 px-2">2. Execute Deployment Target</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => castToTV('192.168.1.192', '65-INCH TV')}
                            className="bg-[#4285F4]/20 border border-[#4285F4]/50 py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[#4285F4] hover:bg-[#4285F4] hover:text-white transition-colors active:scale-95 "
                        >
                            Deploy to 65" TV
                        </button>
                        <button 
                            onClick={() => castToTV('192.168.1.111', '55-INCH TV')}
                            className="bg-[#34A853]/20 border border-[#34A853]/50 py-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[#34A853] hover:bg-[#34A853] hover:text-white transition-colors active:scale-95 "
                        >
                            Deploy to 55" TV
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => {
                           const isHTTPS = window.location.protocol === "https:";
                           const wsProtocol = isHTTPS ? "wss://" : "ws://";
                           const wsHost = isHTTPS ? window.location.host : `${window.location.hostname}:8001`;
                           const triggerWs = new WebSocket(isHTTPS ? `${wsProtocol}${wsHost}/ws-relay` : `${wsProtocol}${wsHost}/ws`);
                           triggerWs.onopen = () => {
                               triggerWs.send(JSON.stringify({ type: "TV_UNMUTE", timestamp: Date.now() }));
                               triggerWs.close();
                               setStatusText("AUDIO UNMUTED ON ACTIVE TVs");
                               setTimeout(() => setStatusText("AWAITING PILOT TARGET"), 3000);
                           };
                        }}
                        className="mt-4 bg-[#facc15]/10 border border-[#facc15]/50 py-3 rounded-xl font-bold uppercase tracking-[0.2em] text-[#facc15] hover:bg-[#facc15] hover:text-black transition-colors active:scale-95  flex items-center justify-center gap-2"
                    >
                        🔊 FORCE UNMUTE TV AUDIO
                    </button>
                </div>
            </div>
            
            <footer className="text-center font-mono text-[8px] tracking-[0.4em] text-white/20 pb-4">
                NODE .73 // AETHER CASTING ENGINE
            </footer>
        </div>
    );
}
