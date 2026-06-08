import React, { useState, useEffect } from 'react';

export default function AetherVet() {
    const [catHeartRate, setCatHeartRate] = useState(120);
    const [catTemp, setCatTemp] = useState(101.5);
    const [mobilityScore, setMobilityScore] = useState(98);
    const [alerts, setAlerts] = useState<{time: string, msg: string}[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newHr = 110 + Math.random() * 20;
            setCatHeartRate(newHr);
            
            if (Math.random() > 0.8) {
                const time = new Date().toLocaleTimeString();
                setAlerts(prev => [{ time, msg: "Minor joint stiffness detected in left hind leg during jump." }, ...prev].slice(0, 5));
                setMobilityScore(prev => Math.max(70, prev - 2));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ backgroundColor: '#0A0F16', color: '#E2E8F0', fontFamily: 'monospace', padding: '2rem', minHeight: '100vh', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.1), transparent 50%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(34, 197, 94, 0.3)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#22c55e', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Aether Vet Telemetry</h1>
                    <div style={{ color: '#64748B', marginTop: '0.5rem' }}>Subject: Metsy | Node: Dreadnaught Jr. | Status: Active Monitoring</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#22c55e', border: '1px solid #22c55e', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)' }}>NPU Edge Inference: Nominal</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                {/* Vitals Panel */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h2 style={{ color: '#94A3B8', fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>BIOMETRICS</h2>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ color: '#64748B', fontSize: '0.8rem' }}>HEART RATE (BPM)</div>
                        <div style={{ fontSize: '2.5rem', color: '#38BDF8' }}>{catHeartRate.toFixed(1)}</div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ color: '#64748B', fontSize: '0.8rem' }}>CORE TEMP (°F)</div>
                        <div style={{ fontSize: '2.5rem', color: '#F59E0B' }}>{catTemp.toFixed(1)}</div>
                    </div>

                    <div>
                        <div style={{ color: '#64748B', fontSize: '0.8rem' }}>MOBILITY INDEX (AI Hat Inference)</div>
                        <div style={{ fontSize: '2.5rem', color: mobilityScore > 90 ? '#22C55E' : '#EF4444' }}>{mobilityScore}%</div>
                    </div>
                </div>

                {/* Spatial Mapping */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1.5rem', borderRadius: '8px', gridColumn: 'span 2', position: 'relative' }}>
                    <h2 style={{ color: '#94A3B8', fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>KINEMATIC SPATIAL MAPPING (Beelink NPU)</h2>
                    <div style={{ width: '100%', height: '300px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', border: '1px dashed rgba(34, 197, 94, 0.3)', position: 'relative', overflow: 'hidden' }}>
                        {/* Fake Radar Sweep */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', background: '#22C55E', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 20px 10px rgba(34, 197, 94, 0.4)' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '200%', height: '2px', background: 'linear-gradient(90deg, rgba(34,197,94,0.8), transparent)', transformOrigin: '0 0', animation: 'sweep 4s linear infinite' }}></div>
                    </div>
                </div>

                {/* Alerts */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1.5rem', borderRadius: '8px', gridColumn: '1 / -1' }}>
                    <h2 style={{ color: '#94A3B8', fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>ANOMALY DETECTION LOG</h2>
                    {alerts.length === 0 ? (
                        <div style={{ color: '#64748B' }}>No anomalies detected by AI Hat.</div>
                    ) : (
                        alerts.map((a, i) => (
                            <div key={i} style={{ padding: '0.5rem', borderLeft: '3px solid #EF4444', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '0.5rem', color: '#F8FAFC' }}>
                                <span style={{ color: '#94A3B8', marginRight: '1rem' }}>[{a.time}]</span> {a.msg}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style>{`
                @keyframes sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
