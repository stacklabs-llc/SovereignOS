import re

with open('src/components/AetherVetDashboard.tsx', 'r') as f:
    content = f.read()

replacements = {
    'os-panel': 'bg-slate-50',
    'os-card-header': 'bg-white border-b border-slate-200 shadow-sm',
    'os-card-primary': 'clinical-panel border-red-200 bg-red-50',
    'os-card': 'clinical-panel',
    'text-[#38bdf8]': 'text-[#0369A1]',
    'border-[#38bdf8]/30': 'border-[#BAE6FD]',
    'border-[#38bdf8]/50': 'border-[#7DD3FC]',
    'bg-[#38bdf8]/10': 'bg-[#F0F9FF]',
    'bg-[#38bdf8]/20': 'bg-[#E0F2FE]',
    'hover:text-[#38bdf8]': 'hover:text-[#0284C7]',
    'border-[#38bdf8]': 'border-[#0369A1]',
    'bg-[#38bdf8]': 'bg-[#BAE6FD]',
    'text-white/40': 'text-slate-400',
    'text-white/50': 'text-slate-500',
    'text-white/60': 'text-slate-500',
    'text-white/70': 'text-slate-600',
    'text-white/80': 'text-slate-700',
    'text-white/90': 'text-slate-800',
    'text-white': 'text-slate-800',
    'hover:text-[#38bdf8]/80': 'hover:text-[#0369A1]',
    'hover:bg-white/10': 'hover:bg-slate-100',
    'hover:bg-white/20': 'hover:bg-slate-200',
    'bg-white/5': 'bg-slate-50',
    'bg-white/10': 'bg-slate-100',
    'bg-black/40': 'bg-slate-50 border border-slate-200',
    'bg-black/60': 'bg-slate-100 border border-slate-200',
    'bg-black/20': 'bg-slate-50 border border-slate-200',
    'border-white/10': 'border-slate-200',
    'border-white/5': 'border-slate-100',
    'border-white/20': 'border-slate-200',
    'bg-cyan-900': 'bg-slate-100',
    'shadow-[0_0_30px_rgba(56,189,248,0.1)]': 'shadow-lg',
    'shadow-[0_0_15px_rgba(239,68,68,0.2)]': 'shadow-md',
    'shadow-[0_0_15px_rgba(168,85,247,0.2)]': 'shadow-md',
    'shadow-[0_0_20px_rgba(56,189,248,0.2)]': 'shadow-xl',
    'text-emerald-400': 'text-[#10B981]',
    'bg-emerald-400/10': 'bg-[#D1FAE5]',
    'bg-black': 'bg-slate-900',
    'opacity-20 blur-sm mix-blend-luminosity': 'opacity-40 blur-sm mix-blend-multiply',
    'border-[#ef4444]/50': 'border-red-200',
    'text-red-400': 'text-red-600',
    'text-purple-400': 'text-purple-600',
    'bg-purple-500/20': 'bg-purple-100',
    'border-purple-500/50': 'border-purple-200'
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Update recharts tooltips to light mode
content = content.replace("backgroundColor: 'var(--color-panel, #111827)'", "backgroundColor: '#FFFFFF'")
content = content.replace("borderColor: 'var(--color-glow-blue, #38bdf830)'", "borderColor: '#E2E8F0'")
content = content.replace("borderColor: 'var(--color-glow-blue, #10b98130)'", "borderColor: '#E2E8F0'")

with open('src/components/AetherVetDashboard.tsx', 'w') as f:
    f.write(content)

