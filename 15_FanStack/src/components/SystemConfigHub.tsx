import React from 'react';
import { Palette, Server, Database, Shield, Sliders, Monitor, BookOpen } from 'lucide-react';

interface SystemConfigHubProps {
  onNavigate: (room: string) => void;
}

interface ConfigCard {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  room: string;
  badge?: string;
}

const CONFIG_CARDS: ConfigCard[] = [
  {
    id: 'theme_manager',
    title: 'Theme Manager',
    subtitle: 'CSS Token Config',
    color: '#a855f7',
    icon: <Palette size={24} />,
    room: 'theme_manager',
  },
  {
    id: 'nexus_telemetry',
    title: 'Fleet Telemetry',
    subtitle: 'Mesh Node Status',
    color: '#22c55e',
    icon: <Server size={24} />,
    room: 'nexus_telemetry',
  },
  {
    id: 'cmdb',
    title: 'CMDB',
    subtitle: 'Hardware Registry',
    color: '#38bdf8',
    icon: <Database size={24} />,
    room: 'cmdb',
    badge: 'LIVE',
  },
  {
    id: 'sovereign_css',
    title: 'Sovereign CSS',
    subtitle: 'Live Style Editor',
    color: '#f472b6',
    icon: <Monitor size={24} />,
    room: 'sovereign_css',
  },
  {
    id: 'user_management',
    title: 'User Management',
    subtitle: 'Identity & Access',
    color: '#a855f7',
    icon: <Shield size={24} />,
    room: 'user_management',
    badge: 'ADMIN',
  },
  {
    id: 'portal_layout',
    title: 'Portal Layout',
    subtitle: 'Dashboard Ordering',
    color: '#f59e0b',
    icon: <Sliders size={24} />,
    room: 'portal_layout',
  },
  {
    id: 'sys_rules',
    title: 'System Rules',
    subtitle: 'SDLC Protocols',
    color: '#ef4444',
    icon: <BookOpen size={24} />,
    room: 'sys_rules',
  },
];

export default function SystemConfigHub({ onNavigate }: SystemConfigHubProps) {
  return (
    <div className="flex-1 flex flex-col w-full animate-in fade-in duration-500 p-2">

      {/* Header */}
      <header className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
          <Sliders className="w-5 h-5 text-white/60" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-white tracking-[0.1em] uppercase">
            System Config
          </h1>
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mt-0.5">
            Platform Administration
          </p>
        </div>
        <div className="ml-auto text-[9px] font-mono text-white/20 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">
          PILOT ACCESS
        </div>
      </header>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CONFIG_CARDS.map((card) => (
          <button
            key={card.id}
            id={`syscfg-card-${card.id}`}
            onClick={() => onNavigate(card.room)}
            className="relative p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg overflow-hidden text-center"
            style={{
              backgroundColor: `${card.color}10`,
              border: `1px solid ${card.color}30`,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${card.color}1f`)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${card.color}10`)}
          >
            {/* Top accent stripe */}
            <div
              className="absolute top-0 left-0 w-full h-0.5 opacity-60"
              style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }}
            />

            {/* Badge */}
            {card.badge && (
              <div
                className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest"
                style={{
                  backgroundColor: `${card.color}20`,
                  border: `1px solid ${card.color}40`,
                  color: card.color,
                }}
              >
                {card.badge}
              </div>
            )}

            {/* Icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              {card.icon}
            </div>

            {/* Labels */}
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                {card.title}
              </h3>
              <p
                className="font-mono text-[10px] uppercase tracking-widest mt-1"
                style={{ color: card.color }}
              >
                {card.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Future modules placeholder */}
      <div className="mt-8 border border-dashed border-white/10 rounded-2xl p-6 text-center">
        <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          More system modules will appear here as they come online
        </p>
      </div>
    </div>
  );
}
