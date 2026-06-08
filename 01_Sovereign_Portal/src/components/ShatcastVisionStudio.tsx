import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'motion/react';
import { getWsUrl } from '../api-host';

export default function ShatcastVisionStudio() {
    const [telemetry, setTelemetry] = useState<string[]>([]);
    const [chartData, setChartData] = useState<{time: string, ds: number}[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize websocket
        wsRef.current = new WebSocket(getWsUrl('/ws-shatcast'));
        
        wsRef.current.onopen = () => {
             setTelemetry(prev => [...prev, "[SYSTEM: AI Hat VLM Vision Analysis Initialized. Monitoring Hailo Dropzone.]"]);
        };

        wsRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "VLM_INFERENCE") {
                    setTelemetry(prev => [...prev, data.telemetry].slice(-50));
                    
                    const now = new Date();
                    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                    setChartData(prev => [...prev, { time: timeStr, ds: data.sundown_coefficient }].slice(-25));
                }
            } catch (err) {}
        };

        return () => wsRef.current?.close();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [telemetry]);

    return (
        <div className="flex flex-col h-[85vh] bg-[#1A110B] p-4 text-slate-200 border border-slate-800 rounded-xl overflow-hidden font-mono selection:bg-[#38bdf8] selection:text-[#1A110B] shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[#38bdf8] font-bold tracking-widest uppercase text-xl">
                        AI Hat Vision Matrix
                    </span>
                    <span className="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/50 px-2 py-0.5 text-xs rounded animate-pulse">
                        LIVE VLM INGESTION
                    </span>
                </div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Target: Scranton_Shatcast_10082025
                </div>
            </div>

            {/* Split Screen Matrix */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 mb-4">
                {/* Left Pane (Target) */}
                <div className="flex-1 border border-slate-800 bg-[#000000] relative flex flex-col min-h-0 bg-black">
                    <div className="absolute top-2 left-2 z-10 bg-black/80 text-[#38bdf8] border border-[#38bdf8]/30 px-2 py-1 text-[10px] tracking-widest uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-ping"></span>
                        OPTICAL LOCK-ON
                    </div>
                    <div className="flex-1 w-full relative h-[100%]">
                        <video 
                            id="target-video"
                            className="w-full h-full object-contain grayscale-[0.2]"
                            src="/shatcast_vision_target.mp4"
                            controls
                            autoPlay
                            muted
                            loop
                        />
                    </div>
                </div>

                {/* Right Pane (Telemetry) */}
                <div className="w-full lg:w-[450px] flex flex-col border border-slate-800 bg-[#1A110B] min-h-0 relative">
                    <div className="bg-slate-800/20 border-b border-slate-800 px-3 py-2 text-[10px] text-[#38bdf8] flex items-center justify-between tracking-widest uppercase font-bold shrink-0">
                        <span>Terminal Telemetry</span>
                        <span className="text-slate-600">[VLM_INFERENCE_LOG]</span>
                    </div>
                    <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2">
                        {telemetry.map((log, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={idx} 
                                className={`p-1.5 border-l-2 ${log.includes("SYSTEM") ? "border-slate-500 text-slate-400" : "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5 pb-1" }`}
                            >
                                {log}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Multimodal Oscillator */}
            <div className="h-[220px] border border-slate-800 bg-[#140D08] shrink-0 p-3 flex flex-col pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Multimodal ΔS Oscillator
                    </h4>
                    <span className="flex items-center gap-2 text-[10px] text-[#38bdf8]">
                        <span className="border border-[#38bdf8]/30 px-1 py-0.5 bg-[#38bdf8]/10 text-xs">CRITICAL THRESHOLD: 5.0</span>
                    </span>
                </div>
                <div className="flex-1 w-full min-h-0 pl-[-20px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['auto', 'auto']} stroke="#334155" tick={{ fill: "#64748b", fontSize: 10 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: "#1A110B", border: "1px solid #1e293b", color: "#38bdf8", fontSize: "10px", fontFamily: "monospace" }} 
                                itemStyle={{ color: "#38bdf8" }}
                            />
                            <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="3 3">
                            </ReferenceLine>
                            <Line 
                                type="monotone" 
                                dataKey="ds" 
                                stroke="#38bdf8" 
                                strokeWidth={2}
                                dot={{ fill: '#1A110B', stroke: '#38bdf8', strokeWidth: 2, r: 3 }}
                                activeDot={{ r: 5, fill: "#38bdf8", stroke: "#1A110B", strokeWidth: 2 }}
                                animationDuration={300}
                                isAnimationActive={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}

