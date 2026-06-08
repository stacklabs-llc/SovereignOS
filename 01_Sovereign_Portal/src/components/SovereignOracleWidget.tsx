import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, X, Send, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SovereignOracleWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "Hello! I am the Sovereign Oracle. How can I help you understand Sovereign OS, FanStack, or the Sovereign Knot today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      let dynamicGuardrails = "";
      try {
        const res = await fetch('/api/admin/guardrails');
        const data = await res.json();
        if (data.guardrails && data.guardrails.length > 0) {
          dynamicGuardrails = "\\nSECURITY GUARDRAILS:\\n" + data.guardrails.map((r: any) => "- " + r.rule_text).join("\\n");
        }
      } catch (e) {
        console.error("Failed to fetch guardrails", e);
      }
      
      const systemInstruction = `You are the Sovereign Oracle, a helpful, intelligent assistant for Sovereign OS. 
      Your role is to explain Sovereign OS, FanStack, GardenStack, Aether Vet, and the "Sovereign Knot" to investors and new users.
      - Sovereign OS is an advanced bare-metal AI orchestration layer with zero API taxes.
      - FanStack is an autonomous sports media matrix that generates highly-opinionated content.
      - GardenStack is an AI agricultural system.
      - Aether Vet is a premier veterinary dashboard.
      - The "Sovereign Knot" relates to entanglement of AI with Quantum computing to create a self-correcting loop, where AI governs noise and Quantum provides ground truth. Mention this is related to Quantum Error Correction if asked.
      Always be professional, visionary, and extremely helpful.
      ${dynamicGuardrails}`;

      // Build history for the API
      const contents = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction }
      });

      const reply = response.text || "I'm sorry, I encountered an anomaly in the Sovereign Knot.";
      setMessages(prev => [...prev, { role: 'model', text: reply }]);

      // Log the interaction
      try {
        await fetch('/api/admin/oracle_log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_msg: userMessage, oracle_response: reply })
        });
      } catch (logErr) {
        console.error("Failed to log oracle interaction", logErr);
      }

    } catch (err) {
      console.error("Oracle Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Connection to the Sovereign Mesh was interrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[95dvw] sm:w-[380px] h-[500px] max-h-[75dvh] bg-[#0f1115] border border-[#38bdf8]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl z-50"
          >
            {/* Header */}
            <div className="bg-[#151921] border-b border-[#38bdf8]/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#38bdf8]/10 flex items-center justify-center border border-[#38bdf8]/30 relative">
                  <Cpu size={16} className="text-[#38bdf8]" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00FF88] rounded-full border-2 border-[#151921]"></span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                    Sovereign Oracle <Sparkles size={12} className="text-[#38bdf8]" />
                  </h3>
                  <p className="text-[#38bdf8] text-[10px] font-mono uppercase tracking-widest">System Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0f1115] to-[#0a0c10]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#38bdf8] text-[#0a0c10] font-medium rounded-tr-sm' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#38bdf8] rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-[#38bdf8] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-[#38bdf8] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#151921] border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
              >
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the Oracle..."
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-1.5 bg-[#38bdf8] text-black rounded-full hover:bg-[#7dd3fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#151921] border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-full shadow-[0_0_20px_rgba(56,189,248,0.2)] flex items-center justify-center text-[#38bdf8] hover:text-white transition-all hover:scale-105 group relative"
      >
        <MessageSquare size={24} className={isOpen ? 'hidden' : 'block'} />
        <X size={24} className={isOpen ? 'block' : 'hidden'} />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF88] rounded-full border-2 border-black animate-pulse"></span>
        )}
      </button>
    </div>
  );
}
