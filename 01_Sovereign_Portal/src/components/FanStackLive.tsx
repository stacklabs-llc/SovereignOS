import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Activity, Users, Radio, Triangle } from 'lucide-react';
import FanStackChat from './FanStackChat';

export default function FanStackLive() {
  const [activeTab, setActiveTab] = useState<'chat'|'stats'>('chat');

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 w-full max-w-[1400px] mx-auto text-white overflow-hidden p-2 lg:p-4">
      
      {/* LEFT PANE - Primary Fan Experience (Video & Matchup) */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
        
        {/* Matchup Header */}
        <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-6">
               {/* AWAY TEAM */}
               <div className="flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full bg-[#DF4601] border-2 border-white flex items-center justify-center font-bold text-xl drop-shadow-md">
                       BAL
                   </div>
                   <span className="text-[10px] uppercase tracking-widest font-bold mt-1 text-[#8E9CAA]">Orioles</span>
               </div>

               {/* SCORE */}
               <div className="flex items-baseline gap-4 mb-3">
                   <span className="text-4xl font-serif text-white">0</span>
                   <span className="text-xs text-white/40 uppercase tracking-widest font-mono">Vs</span>
                   <span className="text-4xl font-serif text-white">0</span>
               </div>

               {/* HOME TEAM */}
               <div className="flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full bg-[#004687] border-2 border-[#BD9B60] flex items-center justify-center font-bold text-xl drop-shadow-md">
                       KC
                   </div>
                   <span className="text-[10px] uppercase tracking-widest font-bold mt-1 text-[#8E9CAA]">Royals</span>
               </div>
            </div>

            {/* Live Game Status */}
            <div className="flex flex-col sm:items-end justify-center bg-black/30 p-3 rounded-xl border border-white/5 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#facc15] "></span>
                    <span className="font-mono text-sm uppercase tracking-widest text-[#facc15] font-bold">Pregame</span>
                </div>
                <div className="flex gap-4">
                   <div className="flex flex-col">
                       <span className="text-[9px] uppercase tracking-widest text-[#8E9CAA]">Count</span>
                       <span className="font-mono text-white text-sm">2 - 1</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[9px] uppercase tracking-widest text-[#8E9CAA]">Outs</span>
                       <div className="flex gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                       </div>
                   </div>
                   {/* Bases */}
                   <div className="flex flex-col items-center justify-center ml-2">
                       <div className="w-4 h-4 rotate-45 border-2 border-white/20 bg-white/20 mb-1"></div>
                       <div className="flex gap-2">
                          <div className="w-4 h-4 rotate-45 border-2 border-[#facc15] bg-[#facc15] "></div>
                          <div className="w-4 h-4 rotate-45 border-2 border-[#facc15] bg-[#facc15] "></div>
                       </div>
                   </div>
                </div>
            </div>
        </div>

        {/* Live Broadcast Feed */}
        <div className="w-full aspect-video bg-[#05070a] border border-white/10 rounded-2xl relative shadow-2xl overflow-hidden flex flex-col group min-h-[250px]">
             {/* Feed Overlay */}
             <div className="absolute top-4 left-4 flex gap-2 z-10">
                 <div className="bg-black/60 backdrop-blur-md border border-[#38bdf8]/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    <Video className="w-4 h-4 text-[#38bdf8]" />
                    Sovereign FanCam
                 </div>
                 <div className="bg-[#ef4444]/20 border border-[#ef4444]/50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#ef4444] shadow-lg animate-pulse">
                    <Radio className="w-4 h-4" />
                    Live
                 </div>
             </div>

             {/* Dynamic Video placeholder / Graphic */}
             <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 z-0"></div>
                 <Activity className="w-16 h-16 text-[#38bdf8]/20 mb-4 animate-pulse relative z-10" />
                 <h2 className="font-serif text-3xl text-white/30 tracking-wider relative z-10">AWAITING SNY FEED</h2>
                 <p className="font-mono text-[10px] uppercase tracking-widest text-[#38bdf8]/50 mt-2 relative z-10">Waiting for pitch sync...</p>
             </div>
        </div>

        {/* 3D Field Dimensions */}
        <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex-1 min-h-[250px] relative overflow-hidden flex flex-col sm:flex-row">
            <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                {/* Progressive Field Approximate SVG */}
                <svg viewBox="0 0 400 400" className="w-full h-full max-h-[300px] drop-shadow-xl z-10">
                    <style>
                        {`
                        @keyframes pitchDash { to { stroke-dashoffset: -30; } }
                        .pitch-path { stroke-dasharray: 4; animation: pitchDash 1s linear infinite; }
                        `}
                    </style>
                    {/* Outfield Grass */}
                    <path d="M 0 0 L 400 0 L 400 400 L 0 400 Z" fill="#143A20" opacity="0.2" />
                    
                    {/* Progressive Field Outline (Deep Left, Sharp Corners) */}
                    <path d="M 200 320 L 320 200 C 320 100 240 60 200 70 C 130 50 80 100 80 200 Z" fill="#6B4423" opacity="0.8" />
                    <polygon points="200,300 270,230 200,160 130,230" fill="#2E6C46" />
                    
                    {/* Bases */}
                    <polygon points="200,300 210,290 200,280 190,290" fill="#ffffff" /> 
                    <polygon points="280,220 290,210 280,200 270,210" fill="#ffffff" /> 
                    <polygon points="200,140 210,130 200,120 190,130" fill="#ffffff" /> 
                    <polygon points="120,220 130,210 120,200 110,210" fill="#ffffff" />
                    <circle cx="200" cy="210" r="15" fill="#6B4423" />
                    <rect x="195" y="208" width="10" height="4" fill="#ffffff" />

                    {/* Pitcher to home path */}
                    <path d="M 200 210 Q 185 250 200 290" stroke="#facc15" strokeWidth="2" fill="none" className="pitch-path" />
                    
                    {/* The Ball */}
                    <circle cx="200" cy="290" r="4" fill="#fff" className="animate-ping" opacity="0.7"/>
                    <circle cx="200" cy="290" r="2.5" fill="#fff" />
                    
                    {/* Labels */}
                    <text x="130" y="80" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace" transform="rotate(-35 130,80)">MINI MONSTER (19FT)</text>
                    <text x="50" y="200" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="monospace">325</text>
                    <text x="200" y="50" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="monospace" textAnchor="middle">400</text>
                    <text x="330" y="200" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="monospace">325</text>
                </svg>
            </div>
            <div className="sm:w-[250px] flex flex-col gap-3 z-10 pt-4 sm:pt-0 sm:pl-4 sm:border-l border-white/10">
                <h4 className="font-sans text-[10px] uppercase tracking-widest text-[#8E9CAA] font-bold border-b border-white/10 pb-2">Live Radar Data</h4>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-white/50">Velocity</span>
                    <span className="font-mono text-[#38bdf8] font-bold text-sm">98.4 MPH</span>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-white/50">Spin Rate</span>
                    <span className="font-mono text-[#22c55e] font-bold text-sm">2450 RPM</span>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center mt-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white"><span className="text-[#38bdf8]">W</span> Kauffman Stadium</span>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT PANE - Social & AI Chat */}
      <div className="lg:w-[450px] bg-[#0A0D12] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Tabs for mobile */}
          <div className="flex bg-[#111827] border-b border-white/10 sticky top-0 z-20 shrink-0">
             <button 
                onClick={() => setActiveTab('chat')} 
                className={`flex-1 py-3 font-sans text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'chat' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] bg-white/5' : 'text-[#8E9CAA] hover:text-white/80'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <Users className="w-4 h-4" /> FanStack Matrix
                </div>
             </button>
             <button 
                onClick={() => setActiveTab('stats')} 
                className={`flex-1 py-3 font-sans text-xs uppercase tracking-widest font-bold transition-all lg:hidden ${activeTab === 'stats' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] bg-white/5' : 'text-[#8E9CAA] hover:text-white/80'}`}
             >
                <div className="flex items-center justify-center gap-2">
                   <Activity className="w-4 h-4" /> Live Stats
                </div>
             </button>
          </div>

          <div className="flex-1 relative overflow-hidden">
             {/* Chat View */}
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none lg:opacity-100 lg:z-10'}`}>
                {/* Notice header */}
                <div className="absolute top-0 w-full z-20 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none flex justify-start">
                   <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-3 py-1.5 rounded text-[9px] text-[#38bdf8] font-bold uppercase tracking-widest inline-flex items-center gap-2 shadow-lg backdrop-blur-md">
                       <Triangle className="w-3 h-3 fill-current rotate-90" /> Connected to Sovereign Node .183
                   </div>
                </div>
                
                {/* The core Chat window is embedded here */}
                <FanStackChat />
             </div>
             
             {/* Stats View (Mobile only fallback if they click Stats tab instead of chat) */}
             <div className={`absolute inset-0 bg-[#0A0D12] p-4 flex flex-col gap-4 overflow-y-auto transition-opacity duration-300 lg:hidden ${activeTab === 'stats' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 <h3 className="font-serif text-2xl text-white">Box Score Placeholder</h3>
                 <p className="text-[#8E9CAA] font-mono text-sm">Please switch back to the Chat Matrix to experience the Sovereign personas.</p>
             </div>
          </div>
      </div>

    </div>
  );
}
