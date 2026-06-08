import re

with open('01_Sovereign_Portal/src/components/ScruffysTavern.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import { TavernTokens, SportType } from '../theme/TavernTokens';\n"
content = content.replace("import avatarMapData from '../avatarMap.json';", "import avatarMapData from '../avatarMap.json';\n" + import_stmt)

# Add activeSport state
state_stmt = """  const [activeSport, setActiveSport] = useState<SportType>('MLB');
  const activeTheme = TavernTokens[activeSport];
  const themeStyles = {
    '--tavern-primary': activeTheme.primary,
    '--tavern-secondary': activeTheme.secondary,
    '--tavern-bg': activeTheme.background,
    '--tavern-surface': activeTheme.surface,
    '--tavern-border': activeTheme.border,
    '--tavern-primary-10': activeTheme.primary + '1a',
    '--tavern-primary-20': activeTheme.primary + '33',
    '--tavern-primary-30': activeTheme.primary + '4d',
    '--tavern-primary-40': activeTheme.primary + '66',
    '--tavern-primary-50': activeTheme.primary + '80',
  } as React.CSSProperties;
"""
content = content.replace("const [messages, setMessages] = useState<any[]>([]);", state_stmt + "  const [messages, setMessages] = useState<any[]>([]);")

# Wrap the main return div with style={themeStyles}
# Find: <div className="flex-1 w-full flex flex-col xl:flex-row gap-6 overflow-hidden vm-panel-glass p-4 rounded-xl">
# Replace with: <div className="flex-1 w-full flex flex-col xl:flex-row gap-6 overflow-hidden vm-panel-glass p-4 rounded-xl" style={themeStyles}>
content = content.replace('<div className="flex-1 w-full flex flex-col xl:flex-row gap-6 overflow-hidden vm-panel-glass p-4 rounded-xl">', '<div className="flex-1 w-full flex flex-col xl:flex-row gap-6 overflow-hidden vm-panel-glass p-4 rounded-xl" style={themeStyles}>')

# Replace hex colors with CSS variables. 
# bg-[#38bdf8]/10 -> bg-[var(--tavern-primary-10)]
content = content.replace('bg-[#38bdf8]/10', 'bg-[var(--tavern-primary-10)]')
content = content.replace('bg-[#38bdf8]/5', 'bg-[var(--tavern-primary-10)]')
content = content.replace('bg-[#38bdf8]/20', 'bg-[var(--tavern-primary-20)]')
content = content.replace('bg-[#38bdf8]', 'bg-[var(--tavern-primary)]')

content = content.replace('border-[#38bdf8]/10', 'border-[var(--tavern-primary-10)]')
content = content.replace('border-[#38bdf8]/20', 'border-[var(--tavern-primary-20)]')
content = content.replace('border-[#38bdf8]/30', 'border-[var(--tavern-primary-30)]')
content = content.replace('border-[#38bdf8]/40', 'border-[var(--tavern-primary-40)]')
content = content.replace('border-[#38bdf8]/50', 'border-[var(--tavern-primary-50)]')
content = content.replace('border-[#38bdf8]', 'border-[var(--tavern-primary)]')

content = content.replace('text-[#38bdf8]', 'text-[var(--tavern-primary)]')
content = content.replace('shadow-[0_0_15px_#38bdf8]', 'shadow-[0_0_15px_var(--tavern-primary)]')
content = content.replace('focus-within:border-[#38bdf8]/50', 'focus-within:border-[var(--tavern-primary-50)]')
content = content.replace('focus-within:bg-[#38bdf8]/5', 'focus-within:bg-[var(--tavern-primary-10)]')

content = content.replace("color: '#38bdf8'", "color: activeTheme.primary")

# Replace hovering color hover:text-[#38bdf8] -> hover:text-[var(--tavern-primary)]
content = content.replace('hover:text-[#38bdf8]', 'hover:text-[var(--tavern-primary)]')
content = content.replace('hover:bg-[#0ea5e9]', 'hover:bg-[var(--tavern-secondary)]')

# Add the Sport Selector at the top of the right panel (chat header area)
# Find: <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden relative">
header_injection = """<div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden relative">
          <div className="flex justify-end gap-2 mb-4">
            {(['MLB', 'NFL', 'PGA'] as SportType[]).map(sport => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest font-bold transition-all ${
                  activeSport === sport 
                    ? 'bg-[var(--tavern-primary)] text-black '
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>"""
content = content.replace('<div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-full overflow-hidden relative">', header_injection)

# Now, implement the Intervene pilot comm-link from the patch.
# Find the existing input area:
#         {/* INPUT AREA */}
#         <div className="p-6 border-t border-white/5 bg-black/40 relative flex-shrink-0 backdrop-blur-xl">
# ...
#         </div>

new_input_area = """        {/* INPUT AREA */}
        <div className="p-6 border-t border-[var(--tavern-primary-20)] bg-black/60 relative flex-shrink-0 backdrop-blur-xl">
          {mentionState.active && filteredPersonas.length > 0 && (
            <div className="absolute bottom-full left-6 mb-4 w-64 max-h-[40vh] overflow-y-auto custom-scrollbar bg-[#0A0D12]/95 backdrop-blur-xl border border-[var(--tavern-primary-40)] rounded-xl p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-1">
              {filteredPersonas.map((p, i) => (
                <div
                  key={p}
                  onClick={() => handleMentionSelect(p)}
                  onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: i }))}
                  className={`px-3 py-2 cursor-pointer rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${i === mentionState.selectedIndex ? 'bg-[var(--tavern-primary-20)] text-[var(--tavern-primary)]' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <div className={`w-6 h-6 rounded-full border border-white/20 ${i === mentionState.selectedIndex ? 'border-[var(--tavern-primary)]' : ''}`}></div>
                  {p}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Troll the club... (Use @ to mention)"
              className="flex-1 bg-black/80 border border-[var(--tavern-primary-30)] text-[var(--tavern-primary)] px-4 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--tavern-primary)] shadow-inner rounded"
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="bg-[var(--tavern-primary-40)] border-2 border-[var(--tavern-primary)] text-[var(--tavern-primary)] font-mono font-bold tracking-widest px-6 hover:bg-[var(--tavern-primary)] hover:text-black transition-colors rounded shadow-[0_4px_10px_rgba(0,0,0,0.5)] uppercase text-xs"
            >
              Intervene
            </button>
          </div>
        </div>"""

import re
content = re.sub(r'\{\/\* INPUT AREA \*\/\}.*?</div>\n      </div>', new_input_area + '\n      </div>', content, flags=re.DOTALL)

with open('01_Sovereign_Portal/src/components/ScruffysTavern.tsx', 'w') as f:
    f.write(content)

