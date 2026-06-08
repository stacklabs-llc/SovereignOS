import React, { useState, useEffect } from 'react';
import { 
  Sliders, Settings, LogOut, User, LayoutGrid, Wine, Key, 
  BookOpen, MessageSquare, Flower2, Activity, Play, Pause, 
  HelpCircle, Terminal, RefreshCw, ChevronLeft, ChevronRight, Menu,
  Music, Cpu, Users, Server
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [martiniTemp, setMartiniTemp] = useState(-8.0);
  const [crossword, setCrossword] = useState<string[][]>([
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
  ]);
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

  // Crossword answers verification
  // R1: C L I O S
  // R2: L O O P S
  // R3: I R O N Y
  // R4: O L I V E
  // R5: S T A C K
  const crosswordAnswers = [
    ['C', 'L', 'I', 'O', 'S'],
    ['L', 'O', 'O', 'P', 'S'],
    ['I', 'R', 'O', 'N', 'Y'],
    ['O', 'L', 'I', 'V', 'E'],
    ['S', 'T', 'A', 'C', 'K']
  ];
  
  const checkCrossword = () => {
    let correct = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (crossword[r][c].toUpperCase() !== crosswordAnswers[r][c]) {
          correct = false;
        }
      }
    }
    alert(correct ? "🎉 Masterpiece! The grid aligns perfectly." : "❌ Some nodes in the matrix are misaligned.");
  };

  const columns = configuration?.columns || { left: [], center: [], right: [] };

  return (
    <div className="flex-1 flex min-h-0 relative font-sans">
      {/* Dynamic Left Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } shrink-0 bg-[#0B0E14]/90 border-r border-white/5 flex flex-col transition-all duration-300 backdrop-blur-xl relative z-40`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-4 bg-[#0F172A] border border-white/10 rounded-full p-1 text-white/60 hover:text-white"
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
            onClick={() => onNavigate('ROOT', 'starter')}
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
            onClick={() => onNavigate('GLOBAL', 'active_stacks')}
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
            onClick={() => onNavigate('GLOBAL', 'power_tools')}
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
              onClick={() => onNavigate('GLOBAL', 'system_config')}
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
              {/* Retro Advocate Soundboard Card */}
              <Soundboard activeGamedayPk={activeGamedayPk} />

              {columns.left?.includes('classy_martini') && (
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

              {columns.center?.includes('curriculum_grandmaster') && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <h3 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold mb-3 flex items-center gap-2">
                    <BookOpen size={14} /> Curriculum Grandmaster
                  </h3>
                  <p className="text-xs text-white/60 mb-4">
                    Monitoring Lenora's Kids' Daily Adventures Swarm. Active mentors:
                  </p>
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span>Pip the Clockwork Squirrel</span>
                      </div>
                      <span className="text-[#38bdf8]">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span>Celeste (Mentor Coordinator)</span>
                      </div>
                      <span className="text-[#38bdf8]">Idle</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-[10px] font-mono text-white/50">
                      <span>Adventure Progress</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                      <div className="bg-[#38bdf8] h-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <button 
                    onClick={() => alert("Supervision ping sent to Lenora's swarm.")}
                    className="w-full py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    SUPERVISE SWARM
                  </button>
                </div>
              )}

              {columns.right?.includes('crossword_puzzle') && (
                <div className="bg-[#0f172a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
                  <h3 className="text-xs uppercase tracking-widest text-[#a855f7] font-mono font-bold mb-3 flex items-center gap-2">
                    <HelpCircle size={14} /> Crossword Grandmaster
                  </h3>
                  <div className="grid grid-cols-5 gap-1 max-w-[200px] mx-auto mb-4">
                    {crossword.map((row, r) => (
                      <React.Fragment key={r}>
                        {row.map((cell, c) => (
                          <input
                            key={`${r}-${c}`}
                            type="text"
                            maxLength={1}
                            value={cell}
                            onChange={e => {
                              const newGrid = [...crossword];
                              newGrid[r][c] = e.target.value.substring(0, 1);
                              setCrossword(newGrid);
                            }}
                            className="w-8 h-8 bg-black/50 border border-white/20 rounded text-center text-sm font-bold uppercase outline-none focus:border-[#a855f7] text-[#a855f7]"
                          />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-white/50 mb-4 space-y-1">
                    <p>• 1 Across: Local core server (CLIOS)</p>
                    <p>• 5 Across: Garden/Livestock (STACK)</p>
                  </div>
                  <button 
                    onClick={checkCrossword}
                    className="w-full py-2 bg-gradient-to-r from-[#a855f7] to-[#38bdf8] text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                  >
                    Check Alignment
                  </button>
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
