import { LayoutDashboard, Users, Zap, Coins, Flame } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Spite Menu Hub', icon: LayoutDashboard },
    { id: 'teleport', label: 'Quantum Teleport Lab', icon: Zap },
    { id: 'subsidy', label: 'Algorithmic Subsidy', icon: Flame },
    { id: 'tip', label: 'Equity Tip Engine', icon: Coins },
    { id: 'crew', label: 'Spite Crew Roster', icon: Users },
  ];

  return (
    <div className="w-64 h-screen bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col pt-6 pb-6 shadow-sm z-10 shrink-0">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Flame size={22} className="text-red-500 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-widest uppercase">Spite Slice</h1>
          <p className="text-[10px] font-mono tracking-widest text-red-500 uppercase">Spite Pizza OS</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-mono tracking-wider uppercase transition-all ${
                isActive 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-bold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-red-400' : 'text-slate-500'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
          <p className="text-[9px] font-mono tracking-widest text-slate-400 mb-1.5 uppercase">SPITE METER</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-ping"></div>
            <span className="text-xs font-mono text-slate-300">MAXIMUM SPITE LEVEL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
