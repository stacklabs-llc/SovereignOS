import React from 'react';
import { Bug, Video, Server, Leaf, UtensilsCrossed, LayoutGrid, FileText, Stethoscope, Shield, Mic, Users, Database, Cpu, MessageSquare } from 'lucide-react';

export interface PortalAppDef {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  badge?: string;
  onClick: (onNavigate: any, setCurrentView?: any) => void;
  defaultVisibleInMain: boolean;
  defaultVisibleInDirectory: boolean;
  category: 'stack' | 'utility' | 'config';
}

export const getEnvDetails = () => {
  const port = window.location.port;
  const host = window.location.hostname || '';
  if (port === '3001' || host.includes('dev')) return { name: 'DEV', color: '#38bdf8' };
  if (port === '3002' || host.includes('uat')) return { name: 'UAT', color: '#fbbf24' };
  return { name: 'PROD', color: '#ff0033' };
};

const env = getEnvDetails();

export const PORTAL_APPS: PortalAppDef[] = [
  {
    id: 'fanstack',
    title: 'FanStack',
    subtitle: 'Sovereign Portal',
    color: '#38bdf8',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#38bdf8]">F</span>,
    onClick: () => {
      const token = localStorage.getItem('sovereign_session_token');
      window.open('https://clio.taila01894.ts.net:3009/' + (token ? '?token=' + encodeURIComponent(token) : ''), '_blank');
    },
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'stack'
  },
  {
    id: 'argus',
    title: 'ARGUS Nexus',
    subtitle: 'Surveillance Grid',
    color: '#66fcf1',
    icon: <Video size={24} className="text-[#66fcf1]" />,
    onClick: (onNavigate) => onNavigate('ARGUS', 'argus_nexus'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'utility'
  },
  {
    id: 'itsm',
    title: 'ITSM Operations',
    subtitle: 'SDLC & Incidents',
    color: '#ff0033',
    icon: <Bug size={24} className="text-[#ff0033]" />,
    onClick: (onNavigate) => onNavigate('ROOT', 'kanban'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'utility'
  },
  {
    id: 'persona_center',
    title: 'Advocate Center',
    subtitle: 'Deployment & Visuals',
    color: '#059669',
    icon: <Users size={24} className="text-[#059669]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'persona_center'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'samtracker',
    title: 'SamTracker',
    subtitle: 'Six Dinner Sam',
    color: '#fbbf24',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#fbbf24]">S</span>,
    onClick: () => window.open('https://clio.taila01894.ts.net:3004/', '_blank'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'stack'
  },
  {
    id: 'system_config',
    title: 'System Config',
    subtitle: 'Theme · Telemetry · More',
    color: '#ffffff',
    icon: <span className="font-['Outfit'] font-bold text-2xl text-white/60">⚙</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'system_config'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'config'
  },
  {
    id: 'env_indicator',
    title: env.name,
    subtitle: 'Active Environment',
    color: env.color,
    icon: <Server size={28} style={{ color: env.color }} />,
    onClick: () => { },
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: false,
    category: 'config'
  },
  {
    id: 'cinema_remote',
    title: 'Cinema Remote',
    subtitle: 'Theater Control',
    color: '#6366f1',
    icon: <Video size={28} className="text-[#6366f1]" />,
    onClick: () => { window.location.href = '/?view=cinema_remote'; },
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'detractor_mailbag',
    title: 'Detractor Mailbag',
    subtitle: 'Reddit Hate Triage',
    color: '#f43f5e',
    icon: <span className="font-['Outfit'] font-bold text-2xl text-[#f43f5e]">🔥</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'hate_mail_inbox'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'app_directory',
    title: 'Stack Directory',
    subtitle: 'Sovereign Stacks',
    color: '#e879f9',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#e879f9]">❖</span>,
    onClick: (onNavigate, setCurrentView) => {
      onNavigate('ROOT', 'app_directory');
      if (setCurrentView) setCurrentView('directory');
    },
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'config'
  },
  {
    id: 'power_tools_utilities',
    title: 'Power Tools',
    subtitle: 'System Utilities',
    color: '#a855f7',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#a855f7]">🛠️</span>,
    onClick: (onNavigate, setCurrentView) => {
      const url = new URL(window.location.href);
      url.searchParams.set('filter', 'utility');
      window.history.replaceState({}, '', url);
      onNavigate('ROOT', 'app_directory');
      if (setCurrentView) setCurrentView('directory');
      window.dispatchEvent(new CustomEvent('set_directory_filter', { detail: 'utility' }));
    },
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'config'
  },
  {
    id: 'aethervet',
    title: 'AetherVet',
    subtitle: 'Veterinary Portal',
    color: '#a78bfa',
    icon: <Stethoscope size={28} className="text-[#a78bfa]" />,
    onClick: () => window.open('https://clio.taila01894.ts.net:8443/', '_blank'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'stack'
  },
  {
    id: 'catnipwars',
    title: 'Catnip Wars',
    subtitle: 'Syndicate Sandbox',
    color: '#10b981',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#10b981]">C</span>,
    onClick: () => window.open('https://clio.taila01894.ts.net:7300/', '_blank'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'stack'
  },
  {
    id: 'highlight_heist',
    title: 'Universal Media Ingestor',
    subtitle: 'Systemwide Video Downloader',
    color: '#a855f7',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#a855f7]">M</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'highlight_heist'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'prospectus',
    title: 'Investor Prospectus',
    subtitle: 'Confidential Deck',
    color: '#38bdf8',
    icon: <FileText size={28} className="text-[#38bdf8]" />,
    onClick: (onNavigate) => onNavigate('ROOT', 'prospectus'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'presence',
    title: 'Telepresence Hub',
    subtitle: 'Live Caller Grid',
    color: '#00d4aa',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#00d4aa]">P</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'presence'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'voice',
    title: 'Voice Heal',
    subtitle: 'System Self-Recovery',
    color: '#d97706',
    icon: <Mic size={28} className="text-[#d97706]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'voice'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'stack_seeder',
    title: 'Stack Seeder',
    subtitle: 'Brand Onboarding',
    color: '#10b981',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#10b981]">🌱</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'stack_seeder'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'utility'
  },
  // Ensure this clean structure is active for your dynamic launcher card block:
  {
    id: 'stacklabs',
    title: 'StackLabs LLC',
    subtitle: 'Monospace Telemetry Console',
    color: '#00d4ff',
    icon: <Server size={28} />,
    onClick: () => {
      const hostname = window.location.hostname;
      if (hostname.includes('taila01894.ts.net')) {
        window.open('https://clio.taila01894.ts.net:3000/', '_blank');
      } else {
        window.open(`http://${hostname}:3000/`, '_blank');
      }
    },
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false,
    category: 'stack'
  },
  {
    id: 'town_simulation',
    title: 'Town Square',
    subtitle: 'Stack Simulation',
    color: '#fbbf24',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#fbbf24]">🏡</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'town_simulation'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'holodex',
    title: 'Sovereign HoloDex',
    subtitle: 'Video Synthesis Engine',
    color: '#a855f7',
    icon: <Video size={28} className="text-[#a855f7]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'holodex'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'storyboard_deck',
    title: 'Storyboard Deck',
    subtitle: 'Video Sequence Planner',
    color: '#38bdf8',
    icon: <FileText size={28} className="text-[#38bdf8]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'storyboard_deck'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'savant_query',
    title: 'Savant Oracle',
    subtitle: 'SQL Data Analytics',
    color: '#66fcf1',
    icon: <Database size={28} className="text-[#66fcf1]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'savant_query'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'vocal_matrix',
    title: 'Vocal Matrix',
    subtitle: 'Voice Synthesis Engine',
    color: '#f59e0b',
    icon: <Mic size={28} className="text-[#f59e0b]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'vocal_matrix'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'asset_backlog',
    title: 'Ingest Backlog',
    subtitle: 'NPU Classification Review',
    color: '#10b981',
    icon: <Cpu size={28} className="text-[#10b981]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'asset_backlog'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'studio',
    title: 'Sovereign Studio',
    subtitle: 'Database Console',
    color: '#A78BFA',
    icon: <Database size={28} className="text-[#A78BFA]" />,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'data'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: true,
    category: 'utility'
  },
  {
    id: 'comet_messenger',
    title: 'Comet Messenger',
    subtitle: 'Secure Messaging Hub',
    color: '#38bdf8',
    icon: <MessageSquare size={28} className="text-[#38bdf8]" />,
    onClick: (onNavigate) => onNavigate('ROOT', 'starter'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: true,
    category: 'utility'
  }
];

export const getDefaultAppOrder = () => PORTAL_APPS.map(app => app.id);
