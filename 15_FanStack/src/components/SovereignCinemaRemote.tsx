import { useState, useRef } from 'react';
import { Play, Pause, FastForward, Rewind, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleDot, MousePointer2, Gamepad2 } from 'lucide-react';

export default function SovereignCinemaRemote() {
    const [mode, setMode] = useState<'dpad' | 'trackpad'>('dpad');
    
    // For throttling mouse moves
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const lastSendTime = useRef<number>(0);

    const sendCommand = async (command: string, extra?: any) => {
        try {
            await fetch('/api/theater/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, ...extra })
            });
        } catch (e) {
            console.error("Failed to send command", e);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        lastPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!lastPos.current) return;
        
        const now = Date.now();
        if (now - lastSendTime.current < 50) return; // throttle to ~20Hz
        
        const touch = e.touches[0];
        const dx = touch.clientX - lastPos.current.x;
        const dy = touch.clientY - lastPos.current.y;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            sendCommand('mousemove', { x: Math.round(dx * 1.5), y: Math.round(dy * 1.5) });
            lastPos.current = { x: touch.clientX, y: touch.clientY };
            lastSendTime.current = now;
        }
    };

    const handleTouchEnd = () => {
        lastPos.current = null;
    };

    const handleTrackpadClick = () => {
        sendCommand('mouseclick');
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white p-4 flex flex-col items-center justify-start gap-4 font-sans overflow-hidden">
            <div className="flex flex-col items-center mt-2">
                <h1 className="text-2xl font-bold tracking-widest text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                    SOVEREIGN REMOTE
                </h1>
                <p className="text-[#38bdf8] text-[10px] tracking-[0.2em] mt-1 font-mono uppercase">
                    Universal TV Control
                </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-white/10 rounded-xl p-1 w-full max-w-sm shrink-0">
                <button 
                    onClick={() => setMode('dpad')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg font-bold tracking-widest text-xs uppercase transition-colors ${mode === 'dpad' ? 'bg-[#E50914] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <Gamepad2 size={16} /> D-PAD
                </button>
                <button 
                    onClick={() => setMode('trackpad')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-bold tracking-widest text-xs uppercase transition-colors ${mode === 'trackpad' ? 'bg-[#38bdf8] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <MousePointer2 size={16} /> TRACKPAD
                </button>
            </div>

            {mode === 'trackpad' ? (
                <div className="flex flex-col w-full max-w-sm gap-4 flex-1 mb-8">
                    <div className="flex gap-4">
                        <button onClick={() => sendCommand('home')} className="bg-white/10 p-4 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                            <span className="font-bold tracking-widest text-xs uppercase text-[#38bdf8]">HOME</span>
                        </button>
                        <button onClick={() => sendCommand('back')} className="bg-white/10 p-4 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                            <span className="font-bold tracking-widest text-xs uppercase">ESC</span>
                        </button>
                    </div>
                    
                    <div 
                        className="bg-white/5 border border-white/20 rounded-3xl w-full flex-1 flex flex-col items-center justify-center relative touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={handleTrackpadClick}
                    >
                        <MousePointer2 size={48} className="text-white/10" />
                        <span className="text-white/20 font-bold tracking-widest mt-4 uppercase text-xs">Drag to move, Tap to click</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* D-PAD */}
                    <div className="flex flex-col items-center gap-1 w-full max-w-sm">
                        <div className="flex gap-2 mb-2 w-full justify-between">
                            <button onClick={() => sendCommand('home')} className="bg-white/10 p-3 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                                <span className="font-bold tracking-widest text-[10px] uppercase text-[#E50914]">HOME</span>
                            </button>
                            <button onClick={() => sendCommand('back')} className="bg-white/10 p-3 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                                <span className="font-bold tracking-widest text-[10px] uppercase">BACK</span>
                            </button>
                        </div>
                        
                        <button onClick={() => sendCommand('up')} className="bg-white/10 p-2 rounded-t-3xl rounded-b flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-full max-w-[100px] h-12">
                            <ChevronUp size={28} />
                        </button>
                        <div className="flex items-center justify-center gap-1 w-full">
                            <button onClick={() => sendCommand('left')} className="bg-white/10 p-2 rounded-l-3xl rounded-r flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-16 h-16">
                                <ChevronLeft size={28} />
                            </button>
                            <button onClick={() => sendCommand('select')} className="bg-white/20 p-2 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all w-20 h-20 shadow-[0_0_15px_rgba(255,255,255,0.1)] border-2 border-white/10">
                                <span className="font-bold tracking-widest text-xs uppercase">OK</span>
                            </button>
                            <button onClick={() => sendCommand('right')} className="bg-white/10 p-2 rounded-r-3xl rounded-l flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-16 h-16">
                                <ChevronRight size={28} />
                            </button>
                        </div>
                        <button onClick={() => sendCommand('down')} className="bg-white/10 p-2 rounded-b-3xl rounded-t flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-full max-w-[100px] h-12">
                            <ChevronDown size={28} />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 w-full max-w-sm pb-2 shrink-0">
                        <button onClick={() => sendCommand('rewind')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <Rewind size={24} />
                        </button>
                        <button onClick={() => sendCommand('play')} className="bg-white text-black p-4 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all col-span-2">
                            <Play fill="currentColor" size={24} />
                        </button>
                        <button onClick={() => sendCommand('forward')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <FastForward size={24} />
                        </button>
                        
                        <button onClick={() => sendCommand('mute')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <VolumeX size={24} />
                        </button>
                        <button onClick={() => sendCommand('pause')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all col-span-2">
                            <Pause fill="currentColor" size={24} />
                        </button>
                        <button onClick={() => sendCommand('volume_up')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <Volume2 size={24} />
                        </button>
                        
                        <button onClick={() => sendCommand('refresh')} className="bg-[#38bdf8]/10 text-[#38bdf8] p-3 rounded-xl flex items-center justify-center hover:bg-[#38bdf8]/20 active:scale-95 transition-all col-span-4 border border-[#38bdf8]/20 mt-1">
                            <span className="font-bold tracking-widest text-[10px] uppercase">Refresh Screen</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
