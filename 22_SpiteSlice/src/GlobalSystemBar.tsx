import React, { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

const TOKEN_KEY_EXPORT = 'sovereign_session_token';

interface GlobalSystemBarProps {
  osTheme?: string;
  setOsTheme?: (theme: string) => void;
  accessLocale?: "CIVILIAN" | "COMMAND";
  setAccessLocale?: (locale: "CIVILIAN" | "COMMAND") => void;
  isVocalMatrixOpen?: boolean;
  setIsVocalMatrixOpen?: (open: boolean) => void;
  activeDomain?: string;
  activeRoom?: string;
  globalRoomBoggsOverride?: string;
  setGlobalRoomBoggsOverride?: (rating: string) => void;
  onNavigateRoom?: (room: string) => void;
}

export default function GlobalSystemBar({
  osTheme: propOsTheme,
  setOsTheme: propSetOsTheme,
  isVocalMatrixOpen,
  setIsVocalMatrixOpen,
  onNavigateRoom,
}: GlobalSystemBarProps) {
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('sovereign_theme') || 'gardenstack');
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const osTheme = propOsTheme !== undefined ? propOsTheme : localTheme;
  const setOsTheme = propSetOsTheme !== undefined ? propSetOsTheme : setLocalTheme;

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY_EXPORT);
    document.cookie = `${TOKEN_KEY_EXPORT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    window.location.reload();
  };

  const isDev = window.location.port !== '3017' && window.location.port !== '';

  const activeDisplayName = 'Pilot';

  const containerStyle: React.CSSProperties = {
    fontFamily: 'monospace',
  };

  return (
    <div style={containerStyle} className="fixed top-3 right-3 sm:top-4 sm:right-6 z-[1000] flex items-center gap-2 sm:gap-3 pointer-events-auto">
      {/* Dev/Prod environment status chip */}
      <div className="flex items-center gap-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
        <span className={`w-2 h-2 rounded-full ${isDev ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="text-[10px] font-bold text-white/70 tracking-widest font-mono">
          <span className="hidden sm:inline">{isDev ? 'DEV ENVIRONMENT' : 'PROD ENVIRONMENT'}</span>
          <span className="inline sm:hidden">{isDev ? 'DEV' : 'PROD'}</span>
        </span>
      </div>

      {/* Sovereign Oracle Toggle (Mocks toggle if provided) */}
      {setIsVocalMatrixOpen && (
        <button
          onClick={() => setIsVocalMatrixOpen(!isVocalMatrixOpen)}
          className={`px-3 py-1.5 border rounded transition-colors font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${isVocalMatrixOpen
            ? 'bg-[#38bdf8] text-white border-[#38bdf8]'
            : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/50 hover:bg-[#38bdf8] hover:text-white'
            }`}
        >
          🎙️ Sovereign Oracle
        </button>
      )}



      {/* Account Chip */}
      <div className={`pl-2 sm:pl-4 border-l border-white/20 ml-1 sm:ml-2 relative ${isAccountOpen ? 'z-[1001]' : 'z-50'}`}>
        <button
          id="account-chip-btn"
          onClick={() => setIsAccountOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0E14]/80 hover:bg-white/10 rounded-lg transition-colors text-white/90 border border-white/10 shadow-lg backdrop-blur-sm"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10b981]/40 to-[#a855f7]/40 border border-white/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold tracking-wide">{activeDisplayName}</span>
            <span className="text-[8px] uppercase tracking-widest font-mono text-[#10b981]">
              ⬡ PILOT
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </button>

        {isAccountOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20">
              <p className="text-white text-xs font-bold">{activeDisplayName}</p>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mt-0.5">pilot</p>
            </div>

            {/* Workspace OS Switcher in Dropdown */}
            <div className="px-4 py-2 border-b border-white/5">
              <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Workspace OS</label>
              <select
                value={osTheme}
                onChange={(e) => {
                  const val = e.target.value;
                  setOsTheme(val);
                  localStorage.setItem('sovereign_theme', val);
                  document.documentElement.setAttribute('data-theme', val);
                  window.dispatchEvent(new Event('theme_changed'));
                  window.dispatchEvent(new CustomEvent('sovereign_theme_change', { detail: { theme: val } }));
                }}
                className="w-full bg-[#111827] text-white/90 border border-white/20 rounded px-2 py-1.5 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-red-500 appearance-none cursor-pointer transition-all"
              >
                <optgroup label="Modern Systems">
                  <option value="sovereign-home">Sovereign Home (Premium)</option>
                  <option value="aether-vet">Aether Vet (Clinical)</option>
                  <option value="gardenstack">GardenStack (Botanical)</option>
                  <option value="cardturpey">Card Turpey (Sports)</option>
                  <option value="inkwellirony">Inkwell & Irony (Noir)</option>
                  <option value="spiteslice">Spite Slice (Pizza)</option>
                  <option value="espn">ESPN Workspace</option>
                  <option value="sovereign-rounded">Sovereign Rounded</option>
                  <option value="mac">Mac OS</option>
                  <option value="windows">Windows</option>
                  <option value="linux">Linux</option>
                </optgroup>
              </select>
            </div>

            {onNavigateRoom && (
              <button
                onClick={() => { setIsAccountOpen(false); onNavigateRoom('user_mgmt'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[#10b981]/80 hover:text-[#10b981] hover:bg-[#10b981]/5 transition-colors text-xs font-bold uppercase tracking-widest border-b border-white/5"
              >
                Manage Users
              </button>
            )}

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
