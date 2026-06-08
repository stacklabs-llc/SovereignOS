import React from 'react';
import { Bug, Video, Server, Leaf, UtensilsCrossed, LayoutGrid } from 'lucide-react';

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
    onClick: (onNavigate) => onNavigate('PORTAL'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true
  },
  {
    id: 'gardenstack',
    title: 'GardenStack',
    subtitle: 'Horticulture AI',
    color: '#10b981',
    icon: <Leaf size={28} className="text-[#10b981]" />,
    onClick: () => window.open('https://clio.taila01894.ts.net:8445/', '_blank'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true
  },
  {
    id: 'argus',
    title: 'ARGUS Nexus',
    subtitle: 'Surveillance Grid',
    color: '#66fcf1',
    icon: <Video size={24} className="text-[#66fcf1]" />,
    onClick: (onNavigate) => onNavigate('ARGUS', 'argus_nexus'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'itsm',
    title: 'ITSM Operations',
    subtitle: 'SDLC & Incidents',
    color: '#ff0033',
    icon: <Bug size={24} className="text-[#ff0033]" />,
    onClick: (onNavigate) => onNavigate('ROOT', 'kanban'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'samtracker',
    title: 'SamTracker',
    subtitle: 'Six Dinner Sam',
    color: '#fbbf24',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#fbbf24]">S</span>,
    onClick: () => window.open('https://clio.taila01894.ts.net:8444/', '_blank'),
    defaultVisibleInMain: false,
    defaultVisibleInDirectory: true
  },

  {
    id: 'system_config',
    title: 'System Config',
    subtitle: 'Theme · Telemetry · More',
    color: '#ffffff',
    icon: <span className="font-['Outfit'] font-bold text-2xl text-white/60">⚙</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'system_config'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'env_indicator',
    title: env.name,
    subtitle: 'Active Environment',
    color: env.color,
    icon: <Server size={28} style={{ color: env.color }} />,
    onClick: () => {},
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'cinema_remote',
    title: 'Cinema Remote',
    subtitle: 'Theater Control',
    color: '#6366f1',
    icon: <Video size={28} className="text-[#6366f1]" />,
    onClick: () => { window.location.href = '/?view=cinema_remote'; },
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'app_directory',
    title: 'App Directory',
    subtitle: 'External Launchpad',
    color: '#e879f9',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#e879f9]">❖</span>,
    onClick: (onNavigate, setCurrentView) => setCurrentView('directory'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: false
  },
  {
    id: 'highlight_heist',
    title: 'Highlight Heist',
    subtitle: 'Universal Media Ingestion',
    color: '#a855f7',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-[#a855f7]">H</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'highlight_heist'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: true
  },
  {
    id: 'stacklabs',
    title: 'StackLabs Hub',
    subtitle: 'Mets Fancave & Systems',
    color: '#f97316',
    icon: <span className="font-['Outfit'] font-bold text-3xl text-orange-500">S</span>,
    onClick: (onNavigate) => onNavigate('GLOBAL', 'stacklabs'),
    defaultVisibleInMain: true,
    defaultVisibleInDirectory: true
  }
];

export const getDefaultAppOrder = () => PORTAL_APPS.map(app => app.id);
