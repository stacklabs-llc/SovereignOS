import React, { useState, useEffect } from 'react';

export default function FactoryDashboard() {
    const [progress, setProgress] = useState(0);
    const [currentTitle, setCurrentTitle] = useState('Awaiting Telemetry...');
    const [currentAction, setCurrentAction] = useState('Connecting to SQLite CMDB...');
    const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [renderedVideos, setRenderedVideos] = useState<{title: string, src: string}[]>([]);
    const [status, setStatus] = useState('SYSTEM INITIALIZING...');

    const addLog = (msg: string, type: string = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        setLogs(prev => [...prev.slice(-19), { time, msg, type }]);
    };

    useEffect(() => {
        let mounted = true;
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            const videosToRender = 50;
            let currentVideo = 1;
            const videoTitles = [
                "Barf Meltdown: Sinker Location",
                "Dot Matrix: 10th Inning Collapse",
                "Wardy's Hubris: Billionaire Rant",
                "Uncle Stevie Stan: Copium Overdose",
                "Terry's Wild Pitch Theory",
                "Scruffy's Tavern Postgame Chaos"
            ];

            await sleep(2000);
            if (!mounted) return;

            setStatus("AUTONOMOUS FACTORY: ONLINE");
            addLog("Initialization complete. Connecting to Sovereign MLB Telemetry.", "success");
            await sleep(1500);
            if (!mounted) return;
            addLog("Pulling last 24h game data from CMDB...", "info");
            await sleep(2000);
            if (!mounted) return;
            
            while (currentVideo <= videosToRender) {
                const title = videoTitles[Math.floor(Math.random() * videoTitles.length)] + ` (Iteration ${currentVideo})`;
                setCurrentTitle(title);
                
                // 1. Script
                setActiveNode('script');
                setCurrentAction("LLM Generation: M.A.R.D. Discourse...");
                addLog(`[VID-${currentVideo}] Invoking Swarm Protocol for script generation.`, "info");
                await sleep(2000);
                if (!mounted) return;
                addLog(`[VID-${currentVideo}] Script verified. Word count: 184.`, "success");

                // 2. TTS
                setActiveNode('tts');
                setCurrentAction("Synthesizing Vocal Matrix (TTS)...");
                addLog(`[VID-${currentVideo}] Routing to Vocal Matrix. Generating Barf audio...`, "info");
                await sleep(2500);
                if (!mounted) return;
                addLog(`[VID-${currentVideo}] Audio generated successfully (14.2s).`, "success");

                // 3. Vision
                setActiveNode('vision');
                setCurrentAction("Generating Brooks Exception Puppet Assets...");
                addLog(`[VID-${currentVideo}] Requesting image gen for 'felt puppet sports fan screaming'.`, "warn");
                await sleep(3500);
                if (!mounted) return;
                addLog(`[VID-${currentVideo}] Visual asset secured.`, "success");

                // 4. FFmpeg
                setActiveNode('ffmpeg');
                setCurrentAction("FFmpeg: Compositing Final Payload...");
                addLog(`[VID-${currentVideo}] Stitching B-roll, Puppet overlay, and Audio.`, "info");
                
                for(let p = 0; p <= 100; p += 5) {
                    setCurrentAction(`FFmpeg: Encoding... ${p}%`);
                    if (p % 20 === 0) addLog(`[VID-${currentVideo}] Render frame ${p*30}...`, "info");
                    await sleep(200);
                    if (!mounted) return;
                }

                addLog(`[VID-${currentVideo}] Payload complete. Auto-syncing to Google Drive.`, "success");
                
                setRenderedVideos(prev => [...prev, {
                    title,
                    src: "/dna/dropzone/daily_23042026/FINAL_FLOWMERCIAL_Vientos.mp4"
                }]);

                await sleep(1000);
                if (!mounted) return;

                const totalProgress = Math.round((currentVideo / videosToRender) * 100);
                setProgress(totalProgress);
                
                currentVideo++;
            }

            setStatus("BATCH COMPLETE");
            setActiveNode(null);
            setCurrentTitle("Standby.");
            setCurrentAction("Awaiting next chronological trigger.");
        };

        runSimulation();
        return () => { mounted = false; };
    }, []);

    return (
        <div style={{
            background: '#050508', color: '#e2e8f0', fontFamily: 'Outfit, sans-serif',
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            backgroundImage: `radial-gradient(circle at 15% 50%, rgba(168, 85, 247, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(0, 242, 254, 0.08), transparent 25%)`
        }}>
            <div style={{
                padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(0, 242, 254, 0.2)', background: 'rgba(5, 5, 8, 0.8)', backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8',
                        boxShadow: '0 0 20px rgba(0, 242, 254, 0.5)'
                    }}></div>
                    <div>
                        <h1 style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                            Flowmercial Factory
                        </h1>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>M.A.R.D. Engine Audio-Visual Synthesis</div>
                    </div>
                </div>
                <div style={{
                    fontFamily: 'monospace', fontSize: '0.9rem', padding: '0.5rem 1rem', border: '1px solid #38bdf8',
                    color: status.includes('ONLINE') ? '#33ff00' : '#38bdf8', borderRadius: '4px',
                    background: status.includes('ONLINE') ? 'rgba(51, 255, 0, 0.1)' : 'rgba(0, 242, 254, 0.1)', letterSpacing: '2px',
                    borderColor: status.includes('ONLINE') ? '#33ff00' : '#38bdf8'
                }}>
                    {status}
                </div>
            </div>

            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', padding: '2rem 3rem', height: 'calc(100vh - 100px)'
            }}>
                <div style={{ background: 'rgba(15, 15, 20, 0.7)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Active Render Pipeline <span style={{ flex: 1, height: '1px', background: 'rgba(0, 242, 254, 0.2)' }}></span>
                    </div>
                    
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontFamily: 'monospace' }}>
                            <span style={{ color: '#64748b' }}>BATCH_ID: FLW-0424</span>
                            <span style={{ color: '#38bdf8' }}>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #38bdf8)', width: `${progress}%`, transition: 'width 0.5s ease', boxShadow: '0 0 10px rgba(0, 242, 254, 0.5)' }}></div>
                        </div>
                    </div>

                    <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>{currentTitle}</div>
                    <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '1rem', marginBottom: '3rem' }}>{currentAction}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { id: 'script', icon: '📝', name: 'M.A.R.D. SCRIPT' },
                            { id: 'tts', icon: '🎙️', name: 'VOCAL MATRIX' },
                            { id: 'vision', icon: '👁️', name: 'ASSET FORGE' },
                            { id: 'ffmpeg', icon: '🎞️', name: 'FFMPEG COMPOSER' }
                        ].map(node => (
                            <div key={node.id} style={{
                                border: `1px solid ${activeNode === node.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                                background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center',
                                boxShadow: activeNode === node.id ? 'inset 0 0 20px rgba(0, 242, 254, 0.1)' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: activeNode === node.id ? 1 : 0.5, color: activeNode === node.id ? '#38bdf8' : 'inherit' }}>{node.icon}</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b', letterSpacing: '1px' }}>{node.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'rgba(15, 15, 20, 0.7)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        System Audit Log <span style={{ flex: 1, height: '1px', background: 'rgba(0, 242, 254, 0.2)' }}></span>
                    </div>
                    <div style={{ background: '#000', borderRadius: '8px', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, flex: 1, overflowY: 'hidden', border: '1px solid rgba(51, 255, 0, 0.2)', position: 'relative' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '0.5rem', color: log.type === 'info' ? '#38bdf8' : log.type === 'success' ? '#33ff00' : '#e0bc68' }}>
                                <span style={{ color: '#64748b', marginRight: '10px' }}>[{log.time}]</span>
                                {log.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ gridColumn: '1 / -1', height: '350px', background: 'rgba(15, 15, 20, 0.7)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Rendered Flowmercials (Click to Watch) <span style={{ flex: 1, height: '1px', background: 'rgba(0, 242, 254, 0.2)' }}></span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {renderedVideos.map((vid, i) => (
                            <div key={i} style={{ minWidth: '250px', height: '180px', background: '#000', border: '1px solid #38bdf8', borderRadius: '8px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                <video src={vid.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls></video>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', padding: '5px', fontSize: '0.8rem', textAlign: 'center' }}>{vid.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
