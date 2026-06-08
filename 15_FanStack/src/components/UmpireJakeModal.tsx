import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import jakeBios from '../data/jake_bios.json';

interface UmpireJakeModalProps {
  onClose: () => void;
  globalBoggsOverride: string;
}

export default function UmpireJakeModal({ onClose, globalBoggsOverride }: UmpireJakeModalProps) {
  const [tourChatHistory, setTourChatHistory] = useState([
    { role: 'model', content: "What do you want? I'm Jake Taylor. If you're looking for the Sovereign Tour Guide, you found him. Make it quick, I ain't got all day." }
  ]);
  const [tourInput, setTourInput] = useState('');

  const handleTourGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourInput.trim()) return;
    
    const userMessage = tourInput;
    setTourChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setTourInput('');
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        setTourChatHistory(prev => [...prev, { role: 'model', content: "Listen, buddy, someone forgot to put the VITE_GEMINI_API_KEY in the .env file. I ain't talking for free." }]);
      }, 500);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      let boggsString = "";
      const effectiveBoggs = globalBoggsOverride !== 'None' ? globalBoggsOverride : jakeBios.u_boggs_reactivity;
      
      switch (effectiveBoggs) {
        case 'G': boggsString = "BOGGS RATING G: You are extremely polite and friendly. Do not use any profanity, offensive language, or insults."; break;
        case 'PG': boggsString = "BOGGS RATING PG: You are mildly grumpy and slightly sarcastic. Avoid harsh profanity completely, use mild words like 'darn'."; break;
        case 'PG-13': boggsString = "BOGGS RATING PG-13: You are grumpy and sarcastic. You can use mild profanity like 'damn' or 'hell'."; break;
        case 'R': boggsString = "BOGGS RATING R: You are foul-mouthed and aggressive. You frequently use strong profanity like f*ck and sh*t."; break;
        case 'NR/XXX': boggsString = "BOGGS RATING NR/XXX: You are extremely toxic, unhinged, and fiercely foul-mouthed. Use excessive profanity and contempt."; break;
        default: boggsString = "BOGGS RATING R: You are foul-mouthed and aggressive."; break;
      }

      const sovereignContext = `
${jakeBios.system_prompt}
${jakeBios.deep_lore}

${boggsString}
      `;

      const model = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: sovereignContext,
          },
          contents: [
            ...tourChatHistory.filter(m => m.role !== 'model' || m.content !== "What do you want? I'm Jake Taylor. If you're looking for the Sovereign Tour Guide, you found him. Make it quick, I ain't got all day.").map(m => ({ role: m.role, parts: [{ text: m.content }] })),
            { role: 'user', parts: [{ text: userMessage }] }
          ],
      });

      const response = await model;
      const finalResponseText = response.text;

      setTourChatHistory(prev => [...prev, { role: 'model', content: finalResponseText }]);
    } catch (err) {
      console.error(err);
      setTourChatHistory(prev => [...prev, { role: 'model', content: "My comms just went down. Or this hangover is killing me. Stop breaking things, Sean!" }]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-[#0B0E14] border border-[#E7C85C]/50 rounded-2xl w-[400px]  overflow-hidden relative flex flex-col h-[500px]">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#E7C85C]"></div>
        
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-[#E7C85C]/50 overflow-hidden bg-[#E7C85C]/10 shrink-0">
              <img src="/avatars/Jake_Taylor_6th.jpg" alt="Jake Taylor" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-widest uppercase">Jake Taylor</h2>
              <div className="text-[#E7C85C] font-mono text-[10px] tracking-widest uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#E7C85C] rounded-full animate-pulse "></span> 
                FanStack Umpire
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {tourChatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-white rounded-tr-none' : 'bg-black/60 border border-[#E7C85C]/30 text-white/90 rounded-tl-none font-mono text-sm leading-relaxed'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/10">
          <form onSubmit={handleTourGuideSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={tourInput}
              onChange={(e) => setTourInput(e.target.value)}
              placeholder="Talk to Umpire Jake..."
              className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E7C85C]/50 font-mono text-sm"
            />
            <button type="submit" className="bg-[#E7C85C] hover:bg-[#F3D686] text-black rounded-xl px-6 py-3 font-bold transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
