import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, FastForward, Rewind, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleDot, MousePointer2, Gamepad2, Subtitles, RefreshCw, Power } from 'lucide-react';

export default function SovereignCinemaRemote() {
    const [mode, setMode] = useState<'dpad' | 'trackpad'>('dpad');
    const [activeTargetTV, setActiveTargetTV] = useState<'living_room' | 'bedroom'>('living_room');
    const [cinemaStatus, setCinemaStatus] = useState<'online' | 'offline' | 'restarting' | 'unknown'>('unknown');
    const [launching, setLaunching] = useState(false);

    // For throttling mouse moves
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const lastSendTime = useRef<number>(0);

    // Poll cinema status every 5 seconds
    useEffect(() => {
        const checkStatus = async () => {
            if (cinemaStatus === 'restarting') return; // don't interrupt restart polling
            try {
                const res = await fetch('/api/cinema/status');
                const data = await res.json();
                setCinemaStatus(data.status === 'online' ? 'online' : 'offline');
            } catch {
                setCinemaStatus('offline');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [cinemaStatus]);

    const restartCinema = async () => {
        setCinemaStatus('restarting');
        await sendCommand('restart_cinema');
        // Poll every 3s until it comes back up (max 60s)
        let attempts = 0;
        const poll = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch('/api/cinema/status');
                const data = await res.json();
                if (data.status === 'online') {
                    setCinemaStatus('online');
                    clearInterval(poll);
                }
            } catch { /* keep polling */ }
            if (attempts > 20) { setCinemaStatus('offline'); clearInterval(poll); }
        }, 3000);
    };

    const sendCommand = async (command: string, extra?: any) => {
        try {
            await fetch('/api/theater/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, target: activeTargetTV, ...extra })
            });
        } catch (e) {
            console.error("Failed to send command", e);
        }
    };

    const castToTV = async (ip: string, room: 'living_room' | 'bedroom') => {
        setActiveTargetTV(room);
        try {
            const targetUrl = `https://clio.taila01894.ts.net/cinema-portal/?room=${room}`;
            await fetch(`/api/cast_tv/${ip}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
        } catch (e) {
            console.error("Failed to cast to TV", e);
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
        <div className="min-h-[100dvh] bg-[#0b0d13] text-gray-200 p-4 md:p-6 flex flex-col items-center justify-start gap-6 font-sans overflow-y-auto pb-10">
            {/* Top Branding Section */}
            <div className="flex flex-col items-center shrink-0 w-full max-w-5xl">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 drop-shadow-[0_0_20px_rgba(0,180,216,0.3)]">
                    SOVEREIGN CINEMA
                </h1>
                <p className="text-[#00b4d8] text-[9px] tracking-[0.3em] mt-1.5 font-mono uppercase font-bold">
                    Universal Media Operations Deck
                </p>
            </div>

            {/* Main Operational Container */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 items-stretch justify-center">
                
                {/* Left Panel: Command Center (Configuration & Mode Selection) */}
                <div className="w-full md:w-80 shrink-0 flex flex-col gap-5 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                    
                    {/* Header & Status Indicator */}
                    <div className="flex flex-col gap-2.5 pb-4 border-b border-white/10">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">System Telemetry</div>
                        <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-2.5">
                            <span className="text-xs font-mono text-white/70">Cinema Ingress</span>
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    cinemaStatus === 'online' ? 'bg-[#00b4d8] shadow-[0_0_8px_rgba(0,180,216,0.8)]' :
                                    cinemaStatus === 'restarting' ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]' :
                                    cinemaStatus === 'offline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
                                    'bg-white/20'
                                }`} />
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-white">
                                    {cinemaStatus === 'restarting' ? 'Restarting' : cinemaStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TV Target Selector */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">Target Display</div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => castToTV('192.168.1.192', 'living_room')} 
                                className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border ${
                                    activeTargetTV === 'living_room' 
                                        ? 'border-[#00b4d8] bg-[#00b4d8]/15 text-[#00b4d8] shadow-[0_0_15px_rgba(0,180,216,0.2)] font-bold' 
                                        : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <span className="text-lg">📺</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold">65" Living Room</span>
                            </button>
                            <button 
                                onClick={() => castToTV('192.168.1.111', 'bedroom')} 
                                className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border ${
                                    activeTargetTV === 'bedroom' 
                                        ? 'border-[#00b4d8] bg-[#00b4d8]/15 text-[#00b4d8] shadow-[0_0_15px_rgba(0,180,216,0.2)] font-bold' 
                                        : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <span className="text-lg">📺</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold">55" Bedroom</span>
                            </button>
                        </div>
                    </div>

                    {/* Open Cinema Trigger */}
                    <div className="flex flex-col gap-1 mt-1">
                        <button
                            onClick={async () => {
                                setLaunching(true);
                                await sendCommand('launch_cinema');
                                setTimeout(() => setLaunching(false), 4000);
                            }}
                            disabled={launching}
                            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-bold tracking-widest text-xs uppercase transition-all duration-300 active:scale-[0.98] border ${
                                launching
                                    ? 'bg-[#00b4d8]/20 border-[#00b4d8]/40 text-[#00b4d8] cursor-not-allowed'
                                    : 'bg-[#00b4d8] border-[#00b4d8] text-[#0b0d13] shadow-[0_0_20px_rgba(0,180,216,0.3)] hover:shadow-[0_0_30px_rgba(0,180,216,0.5)] hover:scale-[1.02]'
                            }`}
                        >
                            {launching ? (
                                <><RefreshCw size={14} className="animate-spin" /> Launching…</>
                            ) : (
                                <><Power size={14} /> Open Cinema on TV</>
                            )}
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-white/10">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">Interaction Mode</div>
                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                            <button 
                                onClick={() => setMode('dpad')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold tracking-wider text-[10px] uppercase transition-all duration-300 ${
                                    mode === 'dpad' 
                                        ? 'bg-[#00b4d8] text-[#0b0d13] font-extrabold shadow-md' 
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <Gamepad2 size={13} /> D-PAD
                            </button>
                            <button 
                                onClick={() => setMode('trackpad')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold tracking-wider text-[10px] uppercase transition-all duration-300 ${
                                    mode === 'trackpad' 
                                        ? 'bg-[#00b4d8] text-[#0b0d13] font-extrabold shadow-md' 
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <MousePointer2 size={13} /> TRACKPAD
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Panel (D-pad & playback or Trackpad) */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col justify-start min-h-[360px] md:min-h-0">
                    
                    {mode === 'trackpad' ? (
                        /* TRACKPAD MODE */
                        <div className="flex flex-col gap-4 h-full flex-grow">
                            <div className="flex gap-3">
                                <button onClick={() => sendCommand('home')} className="bg-white/5 p-3 flex-1 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white border border-white/10">
                                    <span className="font-bold tracking-widest text-[10px] uppercase text-[#00b4d8]">HOME</span>
                                </button>
                                <button onClick={() => sendCommand('back')} className="bg-white/5 p-3 flex-1 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white border border-white/10">
                                    <span className="font-bold tracking-widest text-[10px] uppercase">ESC</span>
                                </button>
                            </div>
                            
                            <div 
                                className="bg-black/40 border border-white/10 rounded-2xl w-full flex-grow flex flex-col items-center justify-center min-h-[220px] relative touch-none select-none hover:border-white/20 transition-colors"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onClick={handleTrackpadClick}
                            >
                                <MousePointer2 size={36} className="text-[#00b4d8]/20 animate-pulse" />
                                <span className="text-white/30 font-bold tracking-widest mt-3 uppercase text-[9px] font-mono">Drag to move • Tap to click</span>
                            </div>
                        </div>
                    ) : (
                        /* DPAD & PLAYBACK MODE */
                        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center h-full flex-grow">
                            
                            {/* D-Pad controls */}
                            <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px] shrink-0">
                                <div className="flex gap-2 mb-1 w-full justify-between">
                                    <button onClick={() => sendCommand('home')} className="bg-white/5 py-2.5 px-2 flex-1 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white border border-white/10">
                                        <span className="font-bold tracking-widest text-[9px] uppercase text-[#00b4d8]">HOME</span>
                                    </button>
                                    <button onClick={() => sendCommand('back')} className="bg-white/5 py-2.5 px-2 flex-1 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white border border-white/10">
                                        <span className="font-bold tracking-widest text-[9px] uppercase">BACK</span>
                                    </button>
                                </div>
                                
                                <button onClick={() => sendCommand('up')} className="bg-white/5 rounded-t-2xl rounded-b flex items-center justify-center hover:bg-white/10 active:scale-[0.9] transition-all w-full max-w-[70px] h-10 border border-white/10">
                                    <ChevronUp size={22} />
                                </button>
                                <div className="flex items-center justify-center gap-1.5 w-full">
                                    <button onClick={() => sendCommand('left')} className="bg-white/5 rounded-l-2xl rounded-r flex items-center justify-center hover:bg-white/10 active:scale-[0.9] transition-all w-12 h-12 border border-white/10">
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button onClick={() => sendCommand('select')} className="bg-white/10 rounded-full flex items-center justify-center hover:bg-white/25 active:scale-[0.9] transition-all w-14 h-14 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-[#00b4d8]/40">
                                        <span className="font-extrabold tracking-widest text-[10px] uppercase text-[#00b4d8]">OK</span>
                                    </button>
                                    <button onClick={() => sendCommand('right')} className="bg-white/5 rounded-r-2xl rounded-l flex items-center justify-center hover:bg-white/10 active:scale-[0.9] transition-all w-12 h-12 border border-white/10">
                                        <ChevronRight size={22} />
                                    </button>
                                </div>
                                <button onClick={() => sendCommand('down')} className="bg-white/5 rounded-b-2xl rounded-t flex items-center justify-center hover:bg-white/10 active:scale-[0.9] transition-all w-full max-w-[70px] h-10 border border-white/10">
                                    <ChevronDown size={22} />
                                </button>
                            </div>

                            {/* Media & Playback controls */}
                            <div className="flex-grow w-full grid grid-cols-4 gap-2.5">
                                <button onClick={() => sendCommand('rewind')} className="bg-white/5 p-3 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-95 border border-white/5 transition-all">
                                    <Rewind size={18} />
                                </button>
                                <button onClick={() => sendCommand('play')} className="bg-white text-[#0b0d13] p-3 rounded-xl flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all col-span-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    <Play fill="currentColor" size={18} />
                                </button>
                                <button onClick={() => sendCommand('forward')} className="bg-white/5 p-3 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-95 border border-white/5 transition-all">
                                    <FastForward size={18} />
                                </button>
                                
                                <button onClick={() => sendCommand('mute')} className="bg-white/5 p-3 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-95 border border-white/5 transition-all">
                                    <VolumeX size={18} />
                                </button>
                                <button onClick={() => sendCommand('pause')} className="bg-white/5 p-3 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-95 border border-white/5 transition-all">
                                    <Pause fill="currentColor" size={18} />
                                </button>
                                <button onClick={() => sendCommand('back')} className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                    <Square fill="currentColor" size={18} />
                                </button>
                                <button onClick={() => sendCommand('volume_up')} className="bg-white/5 p-3 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-95 border border-white/5 transition-all">
                                    <Volume2 size={18} />
                                </button>
                                
                                <button onClick={() => sendCommand('toggle_subtitles')} className="bg-white/5 text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all col-span-2 border border-white/10 gap-1.5">
                                    <Subtitles size={12} className="text-[#00b4d8]" />
                                    <span className="font-bold tracking-widest text-[9px] uppercase">Subtitles</span>
                                </button>
                                <button onClick={() => sendCommand('refresh')} className="bg-[#00b4d8]/5 text-[#00b4d8] p-2.5 rounded-xl flex items-center justify-center hover:bg-[#00b4d8]/10 active:scale-95 transition-all col-span-2 border border-[#00b4d8]/20 gap-1.5">
                                    <span className="font-bold tracking-widest text-[9px] uppercase">Refresh Screen</span>
                                </button>
                                <button
                                    onClick={restartCinema}
                                    disabled={cinemaStatus === 'restarting'}
                                    className={`col-span-4 p-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all duration-300 active:scale-95 ${
                                        cinemaStatus === 'restarting'
                                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 cursor-not-allowed'
                                            : cinemaStatus === 'offline'
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <RefreshCw size={11} className={cinemaStatus === 'restarting' ? 'animate-spin' : ''} />
                                    <span className="font-bold tracking-widest text-[9px] uppercase">
                                        {cinemaStatus === 'restarting' ? 'Restarting Cinema…' : cinemaStatus === 'offline' ? '⚠ Restart Cinema' : 'Restart Cinema'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

