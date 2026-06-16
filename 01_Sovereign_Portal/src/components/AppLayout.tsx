import React, { useState, useEffect } from 'react';
import { 
  Sliders, Settings, LogOut, User, LayoutGrid, Wine, Key, 
  BookOpen, MessageSquare, Flower2, Activity, Play, Pause, 
  HelpCircle, Terminal, RefreshCw, ChevronLeft, ChevronRight, Menu,
  Music, Cpu, Users, Server, ClipboardList
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CometMessenger from './CometMessenger';
import Soundboard from './Soundboard';
import SyncWorkOrders from './SyncWorkOrders';
import GlobalDropZone from './GlobalDropZone';

interface AppLayoutProps {
  configuration: any;
  onNavigate: (domain: string, room: string | null) => void;
  activeRoom: string;
  onResetOnboarding: () => void;
  children: React.ReactNode;
  activeGamedayPk?: string | null;
}

export default function AppLayout({ 
  configuration, 
  onNavigate, 
  activeRoom,
  onResetOnboarding,
  children,
  activeGamedayPk
}: AppLayoutProps) {
  const auth = useAuth() as any;
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const handleNavigate = (domain: string, room: string | null) => {
    onNavigate(domain, room);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [martiniTemp, setMartiniTemp] = useState(-8.0);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Sovereign CLI Operator Shell v0.1.0',
    'Type "help" for a list of commands.'
  ]);
  
  // Custom chat messages for Comet Messenger
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Lenora', text: 'Grandma! Pip the Squirrel found another clockwork key!' },
    { sender: 'Celeste', text: 'Swarm operations stable. Awaiting authorization.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Auto-decrement martini temperature to simulate chilling
  useEffect(() => {
    const interval = setInterval(() => {
      setMartiniTemp(prev => {
        if (prev <= -8.0) return -8.0;
        return parseFloat((prev - 0.1).toFixed(1));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    let reply = `Command not found: ${cmd}`;
    if (cmd === 'help') {
      reply = 'Available commands: help, status, reload, clear';
    } else if (cmd === 'status') {
      reply = 'All stacks operational. Latency 4ms. Active core: CLIO.';
    } else if (cmd === 'reload') {
      reply = 'Reloading layout matrices... Done.';
    } else if (cmd === 'clear') {
      setTerminalLines([]);
      setTerminalInput('');
      return;
    }
    setTerminalLines(prev => [...prev, `> ${terminalInput}`, reply]);
    setTerminalInput('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'You', text: chatInput }]);
    setChatInput('');
  };


  const columns = configuration?.columns || { left: [], center: [], right: [] };

  return (
    <div className="flex-1 flex min-h-0 relative font-sans sovereign-shell-container">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#0B0E14]/95 border-b border-white/5 z-50 h-14 shrink-0 w-full">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white bg-transparent border-0 cursor-pointer"
        >
          <Menu size={24} />
        </button>
        <span className="font-mono text-xs uppercase tracking-widest text-[#38bdf8] font-bold">Sovereign Portal</span>
        <div className="w-[44px]"></div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dynamic Left Sidebar */}
      <div 
        className={`sovereign-sidebar ${
          sidebarOpen ? 'w-64 menu-open' : 'w-16'
        } shrink-0 bg-[#0B0E14]/90 border-r border-white/5 flex flex-col transition-all duration-300 backdrop-blur-xl relative z-40`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-4 bg-[#0F172A] border border-white/10 rounded-full p-1 text-white/60 hover:text-white cursor-pointer"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* User Card / Logo */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#a855f7] flex items-center justify-center text-slate-950 font-bold">
            {auth?.display_name?.charAt(0) || 'S'}
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide truncate max-w-[140px]">{auth?.display_name || auth?.user_name}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-mono">{auth?.role}</span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
          <button 
            onClick={() => handleNavigate('ROOT', 'starter')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              activeRoom === 'starter' 
                ? 'bg-white/10 text-[#38bdf8]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid size={16} />
            {sidebarOpen && 'Command Center'}
          </button>

          <button 
            onClick={() => handleNavigate('GLOBAL', 'active_stacks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              activeRoom === 'active_stacks' 
                ? 'bg-white/10 text-[#38bdf8]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server size={16} />
            {sidebarOpen && 'Active Stacks'}
          </button>

          <button 
            onClick={() => handleNavigate('GLOBAL', 'power_tools')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              activeRoom === 'power_tools' 
                ? 'bg-white/10 text-[#38bdf8]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={16} />
            {sidebarOpen && 'Power Tools'}
          </button>

          {(auth?.role === 'pilot' || auth?.role === 'creator' || auth?.role === 'admin') && (
            <button 
              onClick={() => handleNavigate('ROOT', 'kanban')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                activeRoom === 'kanban'
                  ? 'bg-white/10 text-[#38bdf8]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardList size={16} />
              {sidebarOpen && 'Kanban Board'}
            </button>
          )}

          {(auth?.role === 'pilot' || auth?.role === 'creator' || auth?.role === 'admin') && (
            <button 
              onClick={() => handleNavigate('GLOBAL', 'system_config')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                activeRoom === 'system_config' || activeRoom === 'app_directory'
                  ? 'bg-white/10 text-[#38bdf8]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={16} />
              {sidebarOpen && 'System Config'}
            </button>
          )}

          <div className="mt-8 px-3">
            {sidebarOpen && (
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold font-mono">Workspace Actions</span>
            )}
            {sidebarOpen && (
              <button 
                onClick={onResetOnboarding}
                className="w-full text-left mt-2 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#a855f7] hover:text-white transition-all font-mono"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                Reset Onboarding
              </button>
            )}
            <SyncWorkOrders sidebarOpen={sidebarOpen} />
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-white/5">
          <button 
            onClick={() => {
              localStorage.removeItem('sovereign_session_token');
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E14] text-white">
        {/* Render nested components if we navigated away from the homepage */}
        {activeRoom !== 'starter' ? (
          <div className="flex-1 overflow-y-visible p-4 md:p-6">
            {children}
          </div>
        ) : (
          /* Dynamic Dashboard Grid */
          <div className="flex-1 overflow-y-visible p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 align-start max-w-7xl mx-auto w-full">
            {/* LEFT/CENTER WORKSPACE: Expanded Comet Messenger */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <CometMessenger />
            </div>

            {/* RIGHT WORKSPACE: Sidebar Utilities */}
            <div className="flex flex-col gap-6">
              {columns.left?.includes('classy_martini') && auth?.role !== 'pilot' && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-[#38bdf8]/5 opacity-20 pointer-events-none" />
                  <h3 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold mb-3 flex items-center gap-2">
                    <Wine size={14} /> The Classy Martini
                  </h3>
                  <div className="border border-[#38bdf8]/30 bg-black/40 rounded-xl p-4 font-mono text-[10px] text-[#38bdf8]/90 relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{martiniTemp}°C</span>
                    </div>
                    <div className="text-center text-xs font-bold uppercase tracking-wider text-white mb-2">
                      Formula Blueprint: 6:1
                    </div>
                    <div className="space-y-1.5">
                      <p>• BASE: 2.5 oz English Gin</p>
                      <p>• LORE: 0.5 oz Dry Vermouth</p>
                      <p>• STATE: Chilled to -8°C</p>
                      <p>• GARNISH: 3 Spanish Olives</p>
                    </div>
                    <div className="mt-4 flex justify-center gap-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-[8px] font-bold">
                          o
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {columns.left?.includes('auth_key') && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-[#a855f7]/5 opacity-20 pointer-events-none" />
                  <h3 className="text-xs uppercase tracking-widest text-[#a855f7] font-mono font-bold mb-4 flex items-center gap-2">
                    <Key size={14} /> Authentication Key
                  </h3>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-slate-900 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner shrink-0">
                      {/* Placeholder style elegant B&W portrait */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-slate-950" />
                      <span className="font-serif text-3xl text-white/30 font-bold z-10">EC</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between h-20">
                      <div>
                        <h4 className="text-xs font-bold text-white">Eileen Carroll</h4>
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-mono mt-0.5">Special Agent / Investigator</p>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-[#E0BC68] uppercase font-bold">
                        <span className="w-4 h-4 rounded-full border border-[#E0BC68] flex items-center justify-center text-[8px]">★</span>
                        Inkwell & Irony P.D. Agency
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>SEAL: ENCRYPTED // GOLDEN</span>
                    <span>KEY: PHYSICAL OUTPOST</span>
                  </div>
                </div>
              )}

              {columns.right?.includes('mills_brothers') && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <h3 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold mb-4 flex items-center gap-2">
                    <Music size={14} /> The Mills Brothers
                  </h3>
                  <div className="flex items-center gap-4 border border-[#38bdf8]/20 bg-black/40 rounded-xl p-3">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full bg-[#38bdf8] flex items-center justify-center text-slate-950 font-bold hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white font-mono uppercase tracking-wide truncate max-w-[150px]">
                        Cab Driver
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-white/40 font-mono mt-0.5">
                        {isPlaying ? 'Playing Jukebox' : 'Paused'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {columns.right?.includes('cli_operator_shell') && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-bold mb-3 flex items-center gap-2">
                    <Terminal size={14} /> CLI Operator Shell
                  </h3>
                  <div className="bg-black/60 border border-white/10 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-green-400 flex flex-col gap-1">
                    {terminalLines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    <form onSubmit={handleTerminalSubmit} className="mt-auto flex items-center">
                      <span className="mr-1">&gt;</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-green-400 placeholder-green-800"
                        placeholder="type command..."
                      />
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Global collapsible pixel drop zone staging drawer */}
        <GlobalDropZone />
      </div>
    </div>
  );
}
