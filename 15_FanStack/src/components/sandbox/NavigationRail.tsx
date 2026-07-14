import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Tv, 
  Zap, 
  Target, 
  Inbox, 
  Download, 
  Sparkles, 
  Film, 
  PlayCircle, 
  Scissors, 
  Crosshair, 
  AlertTriangle, 
  Video, 
  Shield, 
  Users, 
  Settings, 
  Database, 
  UserCheck, 
  FolderOpen, 
  Coins,
  Wrench,
  Radio
} from 'lucide-react';

interface NavigationRailProps {
  activeRoom?: string;
  onSelectRoom?: (room: string) => void;
}

export default function NavigationRail({ activeRoom = 'starter', onSelectRoom }: NavigationRailProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sovereign_nav_expanded');
    return saved !== 'false';
  });
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Fetch active anomalies from the API for the TMI Triage live badge
  useEffect(() => {
    const fetchAnomalyCount = async () => {
      try {
        const res = await fetch('/api/tmi_anomalies');
        if (res.ok) {
          const data = await res.json();
          setAnomalyCount(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch anomaly count for navigation rail:', err);
      }
    };

    fetchAnomalyCount();
    // Poll every 5 seconds to keep the badge real-time
    const interval = setInterval(fetchAnomalyCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuGroups = [
    {
      title: 'Media Pipeline & Synthesis',
      items: [
        {
          id: 'holodex',
          label: 'Sovereign HoloDex',
          icon: Sparkles,
          description: 'CINEMATIC VIDEO SYNTHESIS ENGINE',
          badge: null,
          color: 'text-yellow-400 hover:text-yellow-300'
        },
        {
          id: 'storyboard_deck',
          label: 'Storyboard Deck',
          icon: Film,
          description: 'Plan and Sequence Video',
          badge: null,
          color: 'text-violet-400 hover:text-violet-300'
        },
        {
          id: 'rom_gallery',
          label: 'Sovereign Watch Party',
          icon: PlayCircle,
          description: 'Historic Moments & Video Sync',
          badge: null,
          color: 'text-cyan-400 hover:text-cyan-300'
        },
        {
          id: 'highlight_heist',
          label: 'Highlight Heist',
          icon: Scissors,
          description: 'Steal The Best Clips',
          badge: null,
          color: 'text-pink-400 hover:text-pink-300'
        },
        {
          id: 'stream_sniper',
          label: 'Stream Sniper',
          icon: Crosshair,
          description: 'LIVE TARGET ACQUISITION',
          badge: null,
          color: 'text-teal-400 hover:text-teal-300'
        },
        {
          id: 'tmi_news_desk',
          label: 'TMI News Desk',
          icon: AlertTriangle,
          description: 'Broadcast Director Triage Dashboard',
          badge: anomalyCount > 0 ? anomalyCount : null,
          badgeColor: 'bg-red-500 text-white animate-pulse shadow-[0_0_8px_#ef4444]',
          color: 'text-red-500 hover:text-red-400'
        },
        {
          id: 'mam_tmi_console',
          label: 'MAM & TMI Console',
          icon: Database,
          description: 'UNIFIED MEDIA ASSET WAREHOUSE & RULE ENGINE',
          badge: null,
          color: 'text-cyan-400 hover:text-cyan-300'
        }
      ]
    },
    {
      title: 'Intelligence & Core Infrastructure',
      items: [
        {
          id: 'edge_dvr',
          label: 'Pile DVR',
          icon: Video,
          description: 'Webcam Feed Capture',
          badge: null,
          color: 'text-rose-400 hover:text-rose-300'
        },
        {
          id: 'advocate_center',
          label: 'Persona Command Center',
          icon: Shield,
          description: 'Manage Personas & Teams',
          badge: null,
          color: 'text-blue-400 hover:text-blue-300'
        },
        {
          id: 'advocate_lookbook',
          label: 'Advocate Center & Lookbook',
          icon: Users,
          description: 'Media Library & Lookbook Printing',
          badge: null,
          color: 'text-cyan-500 hover:text-cyan-400'
        },
        {
          id: 'cockpit',
          label: 'Clio Cockpit Dashboard',
          icon: Settings,
          description: 'System Telemetry & Controls',
          badge: null,
          color: 'text-red-400 hover:text-red-300'
        },
        {
          id: 'savant_query',
          label: 'Savant Oracle Analytics',
          icon: Database,
          description: 'SQL MLB QUERY ENGINE',
          badge: null,
          color: 'text-emerald-400 hover:text-emerald-300'
        },
        {
          id: 'roll_call',
          label: 'Daily Roll Call',
          icon: UserCheck,
          description: 'STATIC JSON INGESTION',
          badge: null,
          color: 'text-purple-400 hover:text-purple-300'
        },
        {
          id: 'room_builder',
          label: 'Room Builder',
          icon: Wrench,
          description: 'PROVISION ACTIVE PERSONAS IN LIVE MLB ROOMS',
          badge: null,
          color: 'text-cyan-400 hover:text-cyan-300'
        },
        {
          id: 'artifact_gallery',
          label: 'Media Vault Matrix',
          icon: FolderOpen,
          description: 'Artifact Gallery',
          badge: null,
          color: 'text-violet-400 hover:text-violet-300'
        },
        {
          id: 'token_ledger',
          label: 'Token Ledger',
          icon: Coins,
          description: 'Token Ledger',
          badge: null,
          color: 'text-indigo-400 hover:text-indigo-300'
        }
      ]
    },
    {
      title: 'Live Operations & Interaction',
      items: [
        {
          id: 'starter',
          label: 'Command Center',
          icon: LayoutDashboard,
          description: 'Main game telemetry and live scores',
          badge: null,
          color: 'text-cyan-400 hover:text-cyan-300'
        },
        {
          id: 'playcall_desk',
          label: 'PlayCall Desk',
          icon: Radio,
          description: 'Narrative context injection & broadcast operations control',
          badge: null,
          color: 'text-orange-400 hover:text-orange-300'
        },
        {
          id: 'the_skew',
          label: 'The Skew (Live)',
          icon: Tv,
          description: 'DAYTIME SPORTS TALK & DEBATE',
          badge: null,
          color: 'text-purple-400 hover:text-purple-300'
        },
        {
          id: 'hot_takes',
          label: 'Hot Takes',
          icon: Zap,
          description: 'High-Intensity Persona Rants',
          badge: null,
          color: 'text-red-400 hover:text-red-300'
        },
        {
          id: 'live_chat_sniper',
          label: 'Live Chat Sniper',
          icon: Target,
          description: 'Live Chat Sniper Direct Link',
          badge: null,
          color: 'text-orange-400 hover:text-orange-300'
        },
        {
          id: 'promo_inbox',
          label: 'The Cosmic Sieve',
          icon: Inbox,
          description: 'Promo Inbox',
          badge: null,
          color: 'text-amber-400 hover:text-amber-300'
        },
        {
          id: 'game_log_export',
          label: 'Game Log Export',
          icon: Download,
          description: 'MD / JSON - During & Post Game',
          badge: null,
          color: 'text-emerald-400 hover:text-emerald-300'
        },
        {
          id: 'card_simulator',
          label: 'Card Simulator',
          icon: Shield,
          description: 'Holographic Card Ingress & Clio Decision Spool',
          badge: null,
          color: 'text-emerald-400 hover:text-emerald-300'
        }
      ]
    }
  ];


  const handleItemClick = (roomId: string) => {
    if (onSelectRoom) {
      onSelectRoom(roomId);
    }
  };

  return (
    <aside 
      className="flex flex-col h-full bg-[#0b0f19] border-r border-[#1d2438] text-gray-200 relative select-none shrink-0"
      style={{ 
        width: isExpanded ? '240px' : '60px', 
        transition: 'width 150ms ease-in-out' 
      }}
    >
      {/* Dynamic Mets Watermark Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-screen bg-no-repeat bg-center transition-all duration-300"
        style={{
          backgroundImage: "url('https://www.mlbstatic.com/team-logos/121.svg')",
          backgroundSize: isExpanded ? '180px' : '45px',
          backgroundPosition: 'center 40%'
        }}
      />

      {/* Header section (Locked to MLB) */}
      <div className="p-4 border-b border-[#1d2438] flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <img 
            src="https://www.mlbstatic.com/team-logos/121.svg" 
            alt="Mets" 
            className="w-7 h-7 shrink-0 filter drop-shadow-[0_0_4px_rgba(0,180,216,0.3)]"
          />
          {isExpanded && (
            <div className="flex flex-col transition-opacity duration-150">
              <span className="font-display font-black text-xs tracking-wider text-[#00b4d8] uppercase">
                FanStack MLB
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                ACTIVE DOMAIN
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4 relative z-10 custom-scrollbar">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {isExpanded ? (
              <h4 className="px-3 text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-2">
                {group.title}
              </h4>
            ) : (
              <div className="h-[1px] bg-[#1d2438] my-3 mx-2" />
            )}
            
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoom === item.id;
              
              return (
                <div key={item.id} className="relative group/item">
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer relative ${
                      isActive 
                        ? 'bg-[#1e293b]/60 border border-[#00b4d8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_8px_rgba(0,180,216,0.15)] text-white' 
                        : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${item.color} ${isActive ? 'scale-110' : ''}`} />
                    
                    {isExpanded && (
                      <span className="font-sans font-medium text-left truncate flex-1">
                        {item.label}
                      </span>
                    )}

                    {/* Badge */}
                    {item.badge !== null && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono min-w-4 text-center shrink-0 ${
                        item.badgeColor || 'bg-slate-700 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active Accent Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#00b4d8] rounded-r-md" />
                    )}
                  </button>

                  {/* Hover Tooltip for Collapsed State */}
                  {!isExpanded && (
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 bg-[#0f172a] border border-[#1d2438] text-white p-3 rounded-lg shadow-xl w-60">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-white">{item.label}</span>
                        {item.badge !== null && (
                          <span className={`px-1 rounded text-[9px] font-bold font-mono ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">{item.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Toggle (Profile Avatar + Chevron Toggle) */}
      <div className="p-3 border-t border-[#1d2438] flex items-center justify-between shrink-0 relative z-10 bg-[#070b13]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full border border-[#00b4d8]/40 bg-gradient-to-br from-[#0b0f19] to-[#1e293b] flex items-center justify-center text-xs font-mono font-bold text-[#00b4d8] shadow-[0_0_6px_rgba(0,180,216,0.2)] shrink-0">
            SOV
          </div>
          {isExpanded && (
            <div className="flex flex-col transition-opacity duration-150">
              <span className="font-bold text-xs text-white">Sovereign OS</span>
              <span className="text-[9px] font-mono text-gray-500">v1.2.0-STABLE</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setIsExpanded(prev => {
              const next = !prev;
              localStorage.setItem('sovereign_nav_expanded', String(next));
              return next;
            });
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#1d2438] text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors shadow-inner shrink-0"
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
