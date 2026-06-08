import React, { useState, useEffect } from 'react';

export default function OpticalIngestConsole() {
    const [selectedCamera, setSelectedCamera] = useState('');
    const [activeCamName, setActiveCamName] = useState('Awaiting Optics...');
    const [streamUrl, setStreamUrl] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [logs, setLogs] = useState(['> System initialized.', '> Awaiting optical feed...']);
    const [sysTime, setSysTime] = useState('00:00:00:00');

    useEffect(() => {
        const interval = setInterval(() => {
            const d = new Date();
            setSysTime(d.toISOString().split('T')[1].replace('Z', ''));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let timerInterval: NodeJS.Timeout;
        if (isRecording) {
            timerInterval = setInterval(() => {
                setElapsedSeconds(prev => {
                    const next = prev + 1;
                    if (next >= 15) {
                        finishRecording();
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(timerInterval);
    }, [isRecording]);

    const log = (msg: string) => {
        setLogs(prev => [...prev, `> ${msg}`]);
    };

    const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ip = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedCamera(ip);
        setActiveCamName(name);
        setStreamUrl(`/cam-proxy/${ip}/cam/0?t=${Date.now()}`);
        log(`Optical feed established: ${name}`);
    };

    const startRecording = async () => {
        if (!selectedCamera) {
            log("No active optical stream selected.");
            return;
        }

        log(`Initiating remote ingest on ${activeCamName}...`);
        setIsRecording(true);
        setElapsedSeconds(0);

        try {
            await fetch(`http://${window.location.hostname}:8090/api/argus/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: selectedCamera, port: 8081, name: activeCamName.split(' ')[0] })
            });
        } catch (err: any) {
            log(`API Error: ${err.message}`);
        }
    };

    const stopRecording = () => {
        finishRecording();
        log("Ingest manually halted early.");
    };

    const finishRecording = () => {
        setIsRecording(false);
        setElapsedSeconds(0);
        log("Stack captured and saved to Media Vault.");
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="w-full h-full relative overflow-hidden rounded-xl bg-[#0A0E17]">
            <div className="absolute inset-0 flex flex-col p-6 items-center overflow-y-auto" style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.05), transparent 25%)' }}>
                {/* Header */}
                <header className="w-full max-w-5xl flex justify-between items-end mb-8 border-b border-[#38bdf8]/20 pb-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-purple-500">OPTICAL INGEST</span>
                            <span className="text-xs bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-1 rounded border border-[#38bdf8]/30 uppercase tracking-widest font-mono">Standby</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 font-mono uppercase tracking-widest">Sovereign Direct-to-Disk DVR Pipeline</p>
                    </div>
                    <div className="text-right font-mono text-xs text-[#38bdf8]/70">
                        <div>{sysTime}</div>
                        <div>SYS_MEM: NOMINAL</div>
                    </div>
                </header>

                {/* Main Workspace */}
                <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    
                    {/* Video Feed Section */}
                    <section className="lg:col-span-2 relative bg-[rgba(16,22,35,0.6)] backdrop-blur-md border border-[#38bdf8]/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl overflow-hidden aspect-video flex flex-col">
                        <div className="absolute inset-0 bg-black z-0"></div>
                        
                        {/* Video Element */}
                        <img src={streamUrl || undefined} className="w-full h-full object-cover relative z-0" alt="Awaiting Optical Feed..." />
                        
                        {/* CRT Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%)', backgroundSize: '100% 4px' }}></div>
                        
                        {/* HUD Elements */}
                        <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-[#38bdf8]/50 z-20 pointer-events-none"></div>
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-[#38bdf8]/50 z-20 pointer-events-none"></div>
                        <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-[#38bdf8]/50 z-20 pointer-events-none"></div>
                        <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-[#38bdf8]/50 z-20 pointer-events-none"></div>
                        
                        {isRecording && (
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ef4444] animate-pulse"></div>
                                <span className="font-mono font-bold text-[#ef4444] text-sm tracking-widest drop-shadow-md">REC <span>{formatTimer(elapsedSeconds)}</span></span>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-4 z-20 font-mono text-xs text-[#38bdf8]/70 tracking-widest uppercase">
                            CAM_FEED // <span>{activeCamName}</span>
                        </div>
                    </section>

                    {/* Control Panel */}
                    <aside className="bg-[rgba(16,22,35,0.6)] backdrop-blur-md border border-[#38bdf8]/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl p-5 flex flex-col gap-6">
                        
                        {/* Device Selection */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Optical Source</h3>
                            <div className="relative">
                                <select value={selectedCamera} onChange={handleCameraChange} className="w-full bg-black/50 border border-[#38bdf8]/20 text-white text-sm rounded-lg focus:ring-[#38bdf8] focus:border-[#38bdf8] block p-2.5 font-mono appearance-none outline-none">
                                    <option value="" disabled>Select Network Node...</option>
                                    <option value="argo">Argo (Tailscale)</option>
                                    <option value="clio">Clio (Tailscale)</option>
                                    <option value="hobbes">Hobbes (Tailscale)</option>
                                    <option value="calvin">Calvin (Tailscale)</option>
                                    <option value="mando">Mando (Tailscale)</option>
                                    <option value="grogu">Grogu (Tailscale)</option>
                                </select>
                            </div>
                        </div>

                        {/* Controls */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ingest Controls</h3>
                            
                            {!isRecording ? (
                                <button onClick={startRecording} className="w-full mb-3 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/50 text-[#38bdf8] font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group cursor-pointer">
                                    <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                                    INITIALIZE CAPTURE
                                </button>
                            ) : (
                                <button onClick={stopRecording} className="w-full mb-3 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 border border-[#ef4444]/50 text-[#ef4444] font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
                                    HALT CAPTURE
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-[#38bdf8]/20">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stack Status</h3>
                            <div className="font-mono text-[10px] text-gray-500 bg-black/30 p-2 rounded h-24 overflow-y-auto break-words flex flex-col">
                                {logs.map((l, i) => (
                                    <div key={i}>{l}</div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
}
