import React, { useState, useEffect, useRef } from "react";
import FanStackChat from "./components/FanStackChat";
import FanStackLive from "./components/FanStackLive";
import LiveAudioInterface from "./components/LiveAudioInterface";
import StarterShack from "./components/StarterShack";
import PegasusDreadnought from "./components/PegasusDreadnought";
import MobileRemote from "./components/MobileRemote";
import SovereignCinemaRemote from "./components/SovereignCinemaRemote";
import GodModeInjector from "./components/GodModeInjector";
import UhfStudio from "./components/UhfStudio";
import RoomConfigurator from "./components/RoomConfigurator";
import CaptureDeck from "./components/CaptureDeck";
import WatchPartyConsole from "./components/WatchPartyConsole";
import SovereignLogViewer from "./components/SovereignLogViewer";
import PlaycallDesk from "./components/PlaycallDeskConsolidated";
import MlbScoreBar from "./components/MlbScoreBar";
import GamedayScoreboard from "./components/GamedayScoreboard";
import TheSkewStudio from "./components/TheSkewStudio";
import LiveChatSniper from "./components/LiveChatSniper";
import ShatcastVisionStudio from "./components/ShatcastVisionStudio";
import FactoryDashboard from "./components/FactoryDashboard";
import AetherVet from "./components/AetherVet";
import HoloDex from "./components/HoloDex";
import SovereignCmdb from "./components/SovereignCmdb";
import { HardwareTelemetryDashboard } from "./components/HardwareTelemetryDashboard";
import PromoInbox from "./components/PromoInbox";
import PixelDropZone from "./components/PixelDropZone";
import { getApiHost, getWsUrl } from "./api-host";
import { SovereignConfig } from "./config/SovereignConfig";
import KnowledgeHub from "./components/KnowledgeHub";
import ServiceOperationsWorkspace from "./components/ServiceOperationsWorkspace";
import { CypherCellModal } from "./components/CypherCellModal";
import { VocalMatrixPayload } from "./components/VocalMatrixPayload";
import PayloadCourier from "./components/PayloadCourier";
import SovereignHelpAgent from "./components/SovereignHelpAgent";
import UmpireJakeModal from "./components/UmpireJakeModal";
import avatarMap from "./avatarMap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { DownloadCloud, KeySquare, Lock, ShieldAlert } from "lucide-react";
import FanStackPortal from "./components/FanStackPortal";
import ArtifactGallery from "./components/ArtifactGallery";
import FanStackSandbox from "./components/FanStackSandbox";
import SavantQueryBlock from "./components/SavantQueryBlock";
import EdgeDvrConsole from "./components/EdgeDvrConsole";
import StreamSniperConsole from "./components/StreamSniperConsole";
import HighlightHeistConsole from "./components/HighlightHeistConsole";
import SovereignThemeLab from "./components/SovereignThemeLab";
import ArgusNexusConsole from "./components/ArgusNexusConsole";
import InteractiveCockpit from "./components/InteractiveCockpit";
import TMINewsDesk from "./components/TMINewsDesk";
import StoryboardGallery from "./components/StoryboardGallery";
import RollCallDashboard from "./components/RollCallDashboard";
import SovereignThemeManager from "./components/SovereignThemeManager";
import AdvocateCenter from "./components/AdvocateCenter";
import SovereignOsPortal from "./components/SovereignOsPortal";
import FanLobby from "./components/FanLobby";
import NavigationRail from "./components/sandbox/NavigationRail";
import LivingKanbanBoard from "./components/LivingKanbanBoard";
import GlobalSystemBar from "./components/GlobalSystemBar";
import DreadnoughtConsole from "./components/DreadnoughtConsole";
import NewTicketModal from "./components/NewTicketModal";
import HotTakesConsole from "./components/HotTakesConsole";
import ModelArena from "./components/ModelArena";
import RoomBuilder from "./components/RoomBuilder";
import FanStackRoom from "./components/FanStackRoom";
import OpticalIngestConsole from "./components/OpticalIngestConsole";
import { useAuth } from "./contexts/AuthContext";
import UserManagementConsole from "./components/UserManagementConsole";
import SystemConfigHub from "./components/SystemConfigHub";
import PortalLayoutConfig from "./components/PortalLayoutConfig";
import SysRulesPanel from "./components/SysRulesPanel";
import WildseedPitch from "./components/WildseedPitch";
import InvestorProspectus from "./components/InvestorProspectus";
import StackLabsHub from "./components/StackLabsHub";
import TokenLedger from "./components/TokenLedger";
import GameLogExport from "./components/GameLogExport";
import MamTmiConsole from "./components/MamTmiConsole";
import SovereignCardSimulator from "./components/SovereignCardSimulator";

const AMEN_CORNER_IMAGES = [
  "FanStack_PGA_Amen_202604221005.jpeg",
  "UI_design_chat_202604221005.jpeg",
  "UI_design_chat_202604221005_2.jpeg",
  "UI_design_chat_202604221005_3.jpeg",
  "UI_design_chat_202604221005_4.jpeg",
  "Shot-Tracer_App_golf_202604221005.jpeg",
  "Shot-Tracer_App_golf_202604221005_2.jpeg",
  "Shot-Tracer_App_golf_202604221005_3.jpeg",
  "Shot-Tracer_App_golf_202604221005_4.jpeg",
  "Wind_Probability_Dashboard_202604221005.jpeg",
  "Wind_Probability_Dashboard_202604221005_2.jpeg",
  "Wind_Probability_Dashboard_202604221005_3.jpeg",
  "Wind_Probability_Dashboard_202604221005_4.jpeg"
];

function ExtranetGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vip")?.toLowerCase() === "creator") {
      // Auto-unlock for VIP Target
      localStorage.setItem("sov_auth", "unlocked");
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attempt = code.trim().toUpperCase();
    if (attempt === "SOV2026" || attempt === "METS2026" || attempt === "FLOW" || attempt === "WARDYNYM") {
      localStorage.setItem("sov_auth", "unlocked");
      onUnlock();
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#38bdf8]/10 via-[#0B0E14] to-[#0B0E14] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 flex items-center justify-center mb-4 ">
            <ShieldAlert className="w-8 h-8 text-[#38bdf8]" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.2em] text-[#38bdf8] uppercase">Sovereign Extranet</h1>
          <p className="font-mono text-xs text-white/50 tracking-widest mt-2 uppercase">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="mb-6 relative">
            <label className="block font-sans text-[10px] uppercase tracking-widest text-[#8E9CAA] mb-2 font-bold">Access Code</label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full bg-black/60 border ${error ? 'border-red-500 ' : 'border-[#38bdf8]/30 focus:border-[#38bdf8] '} rounded-lg px-4 py-3 text-white font-mono text-center tracking-[0.3em] outline-none transition-all placeholder:text-white/20`}
              placeholder="••••••"
              autoFocus
            />
            {error && <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 font-mono text-[10px] uppercase tracking-widest">Invalid Clearance Matrix</p>}
          </div>
          <button type="submit" className="w-full bg-[#38bdf8]/20 hover:bg-[#38bdf8]/40 border border-[#38bdf8]/50 text-[#38bdf8] font-bold tracking-widest uppercase text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Decrypt Stream
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"amen" | "stats" | "audit">("audit");
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [leaderboard, setLeaderboard] = useState<string[]>([]);
  const [barPersonas, setBarPersonas] = useState<{ name: string }[]>([]);
  const [statusMsg, setStatusMsg] = useState("AWAITING STATCAST TELEMETRY...");
  const [eventName, setEventName] = useState("MLB FanStack");
  const [samSighting, setSamSighting] = useState(false);
  const [isVocalMatrixOpen, setIsVocalMatrixOpen] = useState(false);
  const [vmActiveTab, setVmActiveTab] = useState<'agent' | 'commlink' | 'settings'>('agent');
  const [agentName, setAgentName] = useState(() => localStorage.getItem('sovereign_agent_name') || 'Sovereign Oracle');
  const [isUmpireJakeOpen, setIsUmpireJakeOpen] = useState(false);
  const [agentAvatar, setAgentAvatar] = useState(() => localStorage.getItem('sovereign_agent_avatar') || '/avatars/Sovereign_OS_Logo.jpg');
  // STRY1779338878 — deep-link ticket number
  const [deepLinkTicket, setDeepLinkTicket] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<"starter" | "claude" | "auditor" | "void" | "data" | "pegasus" | "persona_console" | "uhf_studio" | "god_mode" | "rom_gallery" | "configurator" | "log_viewer" | "playcall_desk" | "tmi_news_desk" | "the_skew" | "shatcast_vision" | "advocate_center" | "advocate_lookbook" | "knowledge_hub" | "sow" | "courier" | "promo_inbox" | "nexus_telemetry" | "artifact_gallery" | "fanstack_sandbox" | "savant_query" | "vocal_matrix" | "storyboard_deck" | "holodex" | "edge_dvr" | "stream_sniper" | "highlight_heist" | "live_chat_sniper" | "sovereign_css" | "factory_dashboard" | "aether_vet" | "kanban" | "roll_call" | "dreadnought" | "theme_manager" | "argus_nexus" | "hot_takes" | "model_arena" | "optical_ingest" | "user_mgmt" | "portal_layout" | "pixel_dropzone" | "system_config" | "user_management" | "amen_corner" | "sys_rules" | "fan_lobby" | "weedstack" | "prospectus" | "stacklabs" | "token_ledger" | "game_log_export" | "room_builder" | "cockpit" | "mam_tmi_console" | "card_simulator">(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if (room === 'persona_console' || room === 'advocate_lookbook') {
      room = 'advocate_center';
    }
    const validRooms = ["starter", "claude", "auditor", "void", "data", "pegasus", "persona_console", "uhf_studio", "god_mode", "rom_gallery", "configurator", "log_viewer", "playcall_desk", "tmi_news_desk", "the_skew", "shatcast_vision", "advocate_center", "advocate_lookbook", "knowledge_hub", "sow", "courier", "promo_inbox", "nexus_telemetry", "artifact_gallery", "fanstack_sandbox", "savant_query", "vocal_matrix", "storyboard_deck", "holodex", "edge_dvr", "stream_sniper", "highlight_heist", "live_chat_sniper", "sovereign_css", "factory_dashboard", "aether_vet", "kanban", "roll_call", "dreadnought", "theme_manager", "argus_nexus", "hot_takes", "model_arena", "optical_ingest", "portal_layout", "fan_lobby", "weedstack", "prospectus", "stacklabs", "room_builder", "cockpit", "token_ledger", "game_log_export", "mam_tmi_console", "card_simulator"];
    if (room && validRooms.includes(room)) return room as any;
    return "starter";
  });
  const [activeGamedayPk, setActiveGamedayPk] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameID') || params.get('gamePk') || params.get('_game_room') || params.get('game_room') || null;
  });
  const [globalRoomBoggsOverride, setGlobalRoomBoggsOverride] = useState<string>(() => {
    return localStorage.getItem('sovereign_boggs_override') || 'None';
  });
  const [liveBoxScore, setLiveBoxScore] = useState<any>(null);
  const [dailyBriefing, setDailyBriefing] = useState<any>(null);
  const [envBadge, setEnvBadge] = useState<'PROD' | 'DEV' | 'UAT' | 'UNKNOWN'>('UNKNOWN');
  const [fundiesGrid, setFundiesGrid] = useState(false);
  const [pinEngineActive, setPinEngineActive] = useState(false);
  const [pins, setPins] = useState<any[]>([]);
  const [activePlacement, setActivePlacement] = useState<{ x_pct: number, y_pct: number } | null>(null);
  const [pinComment, setPinComment] = useState('');

  const fetchPins = async () => {
    try {
      const res = await fetch(`/api/pins?game_pk=${activeRoom}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPins(data.pins);
      }
    } catch (err) {
      console.error('[PinEngine] Failed to fetch pins:', err);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.pin-interactive-element')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setActivePlacement({ x_pct: x, y_pct: y });
    setPinComment('');
  };

  const handleSavePin = async () => {
    if (!activePlacement || !pinComment.trim()) return;
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_pk: activeRoom,
          x_pct: activePlacement.x_pct,
          y_pct: activePlacement.y_pct,
          author: 'james',
          comment: pinComment.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActivePlacement(null);
        setPinComment('');
        fetchPins();
      }
    } catch (err) {
      console.error('[PinEngine] Failed to save pin:', err);
    }
  };

  const handleDeletePin = async (pinId: number) => {
    try {
      const res = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchPins();
      }
    } catch (err) {
      console.error('[PinEngine] Failed to delete pin:', err);
    }
  };

  useEffect(() => {
    if (fundiesGrid) {
      document.body.classList.add('fundies-grid-active');
    } else {
      document.body.classList.remove('fundies-grid-active');
    }
    return () => {
      document.body.classList.remove('fundies-grid-active');
    };
  }, [fundiesGrid]);

  useEffect(() => {
    if (activeRoom) {
      fetchPins();
    }
  }, [activeRoom]);

  useEffect(() => {
    const env = import.meta.env.VITE_SOVEREIGN_ENV;
    if (env === 'PROD') setEnvBadge('PROD');
    else if (env === 'DEV') setEnvBadge('DEV');
    else if (env === 'UAT') setEnvBadge('UAT');
    else setEnvBadge('UNKNOWN');
  }, []);

  useEffect(() => {
    fetch('/api/mlb-rss')
      .then(res => res.text())
      .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
      .then(data => {
        const items = Array.from(data.querySelectorAll("item"));
        if(items.length > 0) {
          const topStory = items[0];
          let imageUrl = "/avatars/Sovereign_OS_Logo.jpg";
          const imgNode = topStory.querySelector("image");
          if(imgNode && imgNode.getAttribute("href")) {
            imageUrl = imgNode.getAttribute("href") as string;
          }

          const briefing = {
            hero: {
              image: imageUrl,
              headline: topStory.querySelector("title")?.textContent?.replace('<![CDATA[', '')?.replace(']]>', '') || "",
              subheadline: topStory.querySelector("description")?.textContent?.replace('<![CDATA[', '')?.replace(']]>', '') || "",
              link: topStory.querySelector("link")?.textContent || "#"
            },
            news: items.slice(1, 10).map((item, idx) => {
              const icons = ['N', 'P', 'A', 'D', 'O', 'C'];
              const bgColors = ['#002D72', '#ef4444', '#f97316', '#002D72', '#ef4444', '#f97316'];
              return {
                icon: icons[idx % icons.length],
                iconBg: bgColors[idx % bgColors.length],
                text: item.querySelector("title")?.textContent?.replace('<![CDATA[', '')?.replace(']]>', '') || "",
                link: item.querySelector("link")?.textContent || "#"
              };
            })
          };
          setDailyBriefing(briefing);
        }
      })
      .catch(err => {
        console.error("Failed to load daily briefing via RSS", err);
        fetch('/data/mlb_daily_briefing.json')
          .then(res => res.json())
          .then(data => setDailyBriefing(data));
      });
  }, []);

  useEffect(() => {
    if (!activeGamedayPk) return;
    const fetchBoxscore = async () => {
      try {
        const res = await fetch(`/api/mlb/boxscore/${activeGamedayPk}`);
        if (res.ok) {
          const data = await res.json();
          setLiveBoxScore(data);
        }
      } catch (err) {
        console.error("Failed to fetch live boxscore", err);
      }
    };
    fetchBoxscore();
    const interval = setInterval(fetchBoxscore, 10000);
    return () => clearInterval(interval);
  }, [activeGamedayPk]);

  const [usePegasusFeed, setUsePegasusFeed] = useState(false);
  const [isMobileRemote, setIsMobileRemote] = useState(false);
  const [isCinemaRemote, setIsCinemaRemote] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [fanstackTheme, setFanstackTheme] = useState<"synthwave" | "steamboat" | "pixel">("synthwave");
  const [osTheme, setOsTheme] = useState<string>(() => localStorage.getItem('sovereign_theme') || 'sovereign-home');
  const [accessLocale, setAccessLocale] = useState<"CIVILIAN" | "COMMAND">(() => (localStorage.getItem('sovereign_locale') as any) || "COMMAND");
  const auth = useAuth();
  const isPatron = auth?.role === 'patron';
  const isFan = auth?.role === 'guest' || auth?.role === 'user';
  const hasCreatorTools = auth?.role === 'pilot' || auth?.role === 'creator';

  const [activeDomain, _setActiveDomain] = useState<"ROOT" | "PORTAL" | "MLB" | "NBA" | "NFL" | "PGA" | "SKEW" | "HOLODEX" | "GLOBAL" | "ARGUS" | "CMDB">(() => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain');
    const validDomains = ["ROOT", "PORTAL", "MLB", "NBA", "NFL", "PGA", "SKEW", "HOLODEX", "GLOBAL", "ARGUS", "CMDB"];
    if (domain && validDomains.includes(domain)) return domain as any;
    
    const room = params.get('room');
    if (room === 'amen_corner') return 'PGA';
    if (room === 'kanban') return 'ROOT';
    if (['edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'card_simulator'].includes(room || '')) return 'GLOBAL';
    if (room === 'the_skew' || room === 'hot_takes') return 'SKEW';
    if (room === 'holodex') return 'HOLODEX';
    if (room === 'argus_nexus') return 'ARGUS';
    if (room === 'savant_query' || room === 'tmi_news_desk') return 'MLB';
    
    return "PORTAL";
  });
  const setActiveDomain = (domain: "ROOT" | "PORTAL" | "MLB" | "NBA" | "NFL" | "PGA" | "SKEW" | "HOLODEX" | "GLOBAL" | "ARGUS" | "CMDB") => {
    _setActiveDomain(domain);
  };
  
  const envName = import.meta.env.VITE_APP_ENV || 'prod';
  const envConfig = {
    dev: { label: 'DEV ENVIRONMENT — SANDBOX', styles: 'bg-[#38bdf8] text-black shadow-[0_0_15px_#38bdf8]', borderColor: 'border-[#38bdf8]' },
    uat: { label: 'UAT ENVIRONMENT', styles: 'bg-[#f59e0b] text-black shadow-[0_0_15px_#f59e0b]', borderColor: 'border-[#f59e0b]' },
    sandbox: { label: 'SANDBOX ENVIRONMENT', styles: 'bg-[#a855f7] text-white shadow-[0_0_15px_#a855f7]', borderColor: 'border-[#a855f7]' },
    prod: { label: 'PROD ENVIRONMENT — LIVE FIRE', styles: 'bg-red-600 text-white shadow-[0_0_15px_red]', borderColor: 'border-red-600' }
  };
  const currentEnv = envConfig[envName as keyof typeof envConfig] || envConfig.prod;
  
  useEffect(() => {
    if (isFan) {
      // Force fans out of the creator portal and into the Command Center
      if (activeDomain !== 'MLB' && activeDomain !== 'PGA') {
        setActiveDomain('MLB');
        window.history.replaceState({}, '', '?domain=MLB&room=starter');
      }
      if (activeRoom !== 'starter' && activeRoom !== 'amen_corner') {
        setActiveRoom('starter');
      }
    }
  }, [isFan, activeRoom, activeDomain]);

  // Patron mount guard: block access to ROOT / CMDB / ARGUS
  useEffect(() => {
    if (isPatron) {
      if (activeDomain === 'ROOT' || activeDomain === 'CMDB' || activeDomain === 'ARGUS') {
        setActiveDomain('PORTAL');
        window.history.replaceState({}, '', '?domain=PORTAL');
      }
      // Blocked rooms — redirect patron back to PORTAL
      const blockedRooms = ['user_management','user_mgmt','system_config','portal_layout','sys_rules',
        'oracle_guardrails','kanban','sow','dreadnought','token_ledger','promo_inbox','courier',
        'model_arena','pixel_dropzone','nexus_telemetry','argus_nexus'];
      if (blockedRooms.includes(activeRoom)) {
        setActiveDomain('PORTAL');
        window.history.replaceState({}, '', '?domain=PORTAL');
      }
    }
  }, [isPatron, activeDomain, activeRoom]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'mac');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  useEffect(() => {
    if (auth?.os_theme) {
      setOsTheme(auth.os_theme);
      localStorage.setItem('sovereign_theme', auth.os_theme);
      window.dispatchEvent(new Event('theme_changed'));
    }
  }, [auth?.os_theme]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setActiveGamedayPk(ce.detail);
    };
    window.addEventListener('SetGamedayPk', handler);
    return () => window.removeEventListener('SetGamedayPk', handler);
  }, []);

  // Creator Ingress Tracker
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const apiHost = window.location.protocol === "https:" ? window.location.origin : SovereignConfig.telemetryApi;

    if (params.get("vip")?.toLowerCase() === "creator") {
      // Fire the tracking beacon
      fetch(`${apiHost}/api/ingress`, { method: "POST" })
        .catch(e => console.error("Ingress Beacon failed to send", e));
    }
  }, []);

  // Boggs Level Max Override
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("boggs") === "MAX") {
      console.warn("🚨 BOGGS LEVEL: MAX OVERRIDE ENGAGED 🚨");
      // Backend will recognize this via websockets or we optionally inform it later
    }
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      const params = new URLSearchParams(window.location.search);
      const gamedayParam = params.get('gameID') || params.get('gamePk') || params.get('_game_room') || params.get('game_room');
      if (gamedayParam) {
        setActiveGamedayPk(gamedayParam);
      }
      const viewParam = params.get('view');
      if (viewParam === 'remote') {
        setIsMobileRemote(true);
        return;
      }
      if (viewParam === 'cinema_remote' && !isPatron) {
        setIsCinemaRemote(true);
        return;
      }
      // Hololink disabled

      const domainParam = params.get('domain');
      if (domainParam === 'ROOT') {
        setActiveDomain('ROOT');
        return;
      }
      if (domainParam === 'PORTAL') {
        setActiveDomain('PORTAL');
        return;
      }
      if (domainParam === 'CMDB') {
        setActiveDomain('CMDB');
        return;
      }
      if (domainParam === 'ARGUS') {
        setActiveDomain('ARGUS');
        let roomParam = params.get('room');
        if (roomParam === 'persona_console' || roomParam === 'advocate_lookbook') {
          roomParam = 'advocate_center';
        }
        const validRooms = ['starter', 'claude', 'auditor', 'pegasus', 'uhf_studio', 'persona_console', 'god_mode', 'rom_gallery', 'configurator', 'log_viewer', 'playcall_desk', 'tmi_news_desk', 'the_skew', 'hot_takes', 'shatcast_vision', 'advocate_center', 'advocate_lookbook', 'knowledge_hub', 'sow', 'courier', 'promo_inbox', 'nexus_telemetry', 'amen_corner', 'artifact_gallery', 'fanstack_sandbox', 'savant_query', 'vocal_matrix', 'storyboard_deck', 'holodex', 'edge_dvr', 'stream_sniper', 'highlight_heist', 'live_chat_sniper', 'sovereign_css', 'factory_dashboard', 'aether_vet', 'roll_call', 'kanban', 'dreadnought', 'theme_manager', 'argus_nexus', 'model_arena', 'optical_ingest', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'pixel_dropzone', 'fan_lobby', 'weedstack', 'prospectus', 'stacklabs', 'room_builder', 'cockpit', 'token_ledger', 'game_log_export', 'card_simulator'];
        if (roomParam && validRooms.includes(roomParam)) {
          setActiveRoom(roomParam as any);
          if (roomParam === 'savant_query' || roomParam === 'tmi_news_desk') {
            setActiveDomain('MLB');
          } else if (['cockpit', 'edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'token_ledger', 'game_log_export', 'advocate_center', 'advocate_lookbook', 'live_chat_sniper', 'promo_inbox', 'artifact_gallery', 'fanstack_sandbox', 'holodex', 'vocal_matrix', 'nexus_telemetry', 'room_builder', 'card_simulator'].includes(roomParam)) {
            setActiveDomain('GLOBAL');
          } else if (roomParam === 'kanban') {
            setActiveDomain('ROOT');
          } else if (roomParam === 'the_skew' || roomParam === 'hot_takes') {
            setActiveDomain('SKEW');
          } else if (roomParam === 'holodex') {
            setActiveDomain('HOLODEX');
          } else if (roomParam === 'argus_nexus') {
            setActiveDomain('ARGUS');
          } else {
            setActiveDomain('ARGUS');
          }
        }
        return;
      }

      // STRY1779338878 — ?ticket=STRY1779338715 deep-link
      const ticketParam = params.get('ticket');
      if (ticketParam) {
        setDeepLinkTicket(ticketParam);
        setActiveDomain('GLOBAL');
        setActiveRoom('kanban');
        return;
      }

      let roomParam = params.get('room');
      if (roomParam === 'persona_console' || roomParam === 'advocate_lookbook') {
        roomParam = 'advocate_center';
      }
      const validRooms = ['starter', 'claude', 'auditor', 'pegasus', 'uhf_studio', 'persona_console', 'god_mode', 'rom_gallery', 'configurator', 'log_viewer', 'playcall_desk', 'tmi_news_desk', 'the_skew', 'hot_takes', 'shatcast_vision', 'advocate_center', 'advocate_lookbook', 'knowledge_hub', 'sow', 'courier', 'promo_inbox', 'nexus_telemetry', 'amen_corner', 'artifact_gallery', 'fanstack_sandbox', 'savant_query', 'vocal_matrix', 'storyboard_deck', 'holodex', 'edge_dvr', 'stream_sniper', 'highlight_heist', 'live_chat_sniper', 'sovereign_css', 'factory_dashboard', 'aether_vet', 'roll_call', 'kanban', 'dreadnought', 'theme_manager', 'argus_nexus', 'model_arena', 'optical_ingest', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'pixel_dropzone', 'fan_lobby', 'weedstack', 'prospectus', 'stacklabs', 'room_builder', 'cockpit', 'token_ledger', 'game_log_export', 'card_simulator'];
      if (roomParam && validRooms.includes(roomParam)) {
        setActiveRoom(roomParam as any);
        if (roomParam === 'amen_corner') {
          setActiveDomain('PGA');
        } else if (['cockpit', 'edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'token_ledger', 'game_log_export', 'advocate_center', 'advocate_lookbook', 'live_chat_sniper', 'promo_inbox', 'artifact_gallery', 'fanstack_sandbox', 'holodex', 'vocal_matrix', 'nexus_telemetry', 'room_builder', 'card_simulator'].includes(roomParam)) {
          setActiveDomain('GLOBAL');
        } else if (roomParam === 'kanban') {
          setActiveDomain('ROOT');
        } else if (roomParam === 'the_skew' || roomParam === 'hot_takes') {
          setActiveDomain('SKEW');
        } else if (roomParam === 'holodex') {
          setActiveDomain('HOLODEX');
        } else if (roomParam === 'argus_nexus') {
          setActiveDomain('ARGUS');
        } else {
          setActiveDomain('MLB');
        }
      }
    };
    
    // Run on initial mount
    handleNavigation();
    
    // Run on browser back/forward buttons
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  useEffect(() => {
    if (isMobileRemote) return;
    const url = new URL(window.location.href);
    let title = "Sovereign OS";

    if (activeDomain === 'ROOT' && (!activeRoom || activeRoom === 'starter')) {
      url.searchParams.delete('room');
      url.searchParams.delete('domain');
      url.searchParams.delete('_game_room');
      title = "Sovereign OS | Root Control";
    } else if (activeDomain === 'PORTAL') {
      url.searchParams.delete('room');
      url.searchParams.delete('_game_room');
      url.searchParams.set('domain', 'PORTAL');
      title = "Sovereign OS | FanStack";
    } else if (activeDomain === 'CMDB') {
      url.searchParams.delete('room');
      url.searchParams.delete('_game_room');
      url.searchParams.set('domain', 'CMDB');
      title = "Sovereign OS | CMDB Workspace";
    } else {
      url.searchParams.set('domain', activeDomain);
      url.searchParams.set('room', activeRoom);
      
      if ((activeDomain === 'MLB' && activeRoom === 'starter') && activeGamedayPk) {
        url.searchParams.set('_game_room', activeGamedayPk);
      } else {
        url.searchParams.delete('_game_room');
      }

      const titles: Record<string, string> = {
        'starter': 'Command Center',
        'playcall_desk': 'Playcall Desk',
        'tmi_news_desk': 'TMI Triage',
        'savant_query': 'Savant Oracle',
        'stream_sniper': 'Stream Sniper',
        'highlight_heist': 'Highlight Heist',
        'live_chat_sniper': 'Live Chat Sniper',
        'storyboard_deck': 'Storyboards',
        'the_skew': 'The Skew',
        'holodex': 'HoloDex',
        'argus_nexus': 'Argus Nexus',
        'model_arena': 'Model Arena'
      };
      
      const roomTitle = titles[activeRoom] || activeRoom.replace('_', ' ').toUpperCase();
      title = `Sovereign OS | ${roomTitle}`;
    }

    document.title = title;

    if (url.searchParams.get('view') === 'remote') url.searchParams.delete('view');
    if (url.searchParams.get('view') === 'cinema_remote') url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
  }, [activeRoom, activeDomain, isMobileRemote, isCinemaRemote, activeGamedayPk]);

  useEffect(() => {
    fetch("/personas.json")
      .then(res => res.json())
      .then(data => {
        const shuffled = data.sort(() => 0.5 - Math.random());
        setBarPersonas(shuffled.slice(0, 6));
      })
      .catch(err => console.error("Failed to load personas", err));

  }, []);

  useEffect(() => {
    wsRef.current = new WebSocket(getWsUrl('/ws-relay'));

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "FLOWMERCIAL_TRIGGER") {
          setUsePegasusFeed(true); // Force the Pegasus flowmercial feed to take over
          setActiveRoom('starter'); // Force them into the view
        }
        if (data.type === "TV_UNMUTE") {
          const videos = document.querySelectorAll('video');
          videos.forEach(v => {
            v.muted = false;
            // Some strict browsers require play() after unmuting
            v.play().catch(e => console.warn("Autoplay Audio Guard:", e));
          });
        }
      } catch (err) { }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(getWsUrl('/ws-relay'));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "GAME_SWITCHED" && data.game_pk) {
          setActiveGamedayPk(data.game_pk);
        } else if (data.type === "TMI_ANOMALY") {
          fetch('/api/tmi_anomalies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(() => {
            window.dispatchEvent(new Event('tmi_anomalies_updated'));
          }).catch(err => console.error("Failed to sync TMI anomaly to DB:", err));
        } else if (data.type === "STATE_UPDATE" && data.data) {
          setLeaderboard(data.data.leaderboard || []);
          setStatusMsg(data.data.status_msg || "NOMINAL");
          if (data.data.event_name) setEventName(data.data.event_name);
        } else if (data.type === "GOPHER_SIGHTING") {
          console.warn("🚨 BIOLOGICAL BREACH DETECTED 🚨");
          setSamSighting(true);
          setTimeout(() => setSamSighting(false), 8000);
        }
      } catch (err) { }
    };
    return () => ws.close();
  }, []);

  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [feedbackPin, setFeedbackPin] = useState<{ x: number, y: number } | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F to toggle feedback mode
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        setIsFeedbackMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isMobileRemote) {
    return <MobileRemote />;
  }
  
  if (isCinemaRemote) {
    return <SovereignCinemaRemote />;
  }

  // Hololink view check removed

  return (
    <div className={`h-screen w-screen flex flex-col transition-all duration-1000 bg-[#0B0E14] text-gray-200 selection:bg-[#3B82F6]/30 relative overflow-hidden theme-${osTheme} border-t-[6px] ${currentEnv.borderColor}`}>

      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {activeDomain !== 'ARGUS' && (
          <NavigationRail
            activeRoom={activeRoom}
            onSelectRoom={(room) => {
              if (room === 'starter') {
                setActiveDomain('MLB');
                setActiveRoom('starter');
                window.history.pushState({}, '', '?domain=MLB&room=starter');
              } else if (room === 'playcall_desk') {
                setActiveDomain('MLB');
                setActiveRoom('playcall_desk');
                window.history.pushState({}, '', '?domain=MLB&room=playcall_desk');
              } else if (room === 'tmi_news_desk') {
                setActiveDomain('MLB');
                setActiveRoom('tmi_news_desk');
                window.history.pushState({}, '', '?domain=MLB&room=tmi_news_desk');
              } else if (room === 'savant_query') {
                setActiveDomain('MLB');
                setActiveRoom('savant_query');
                window.history.pushState({}, '', '?domain=MLB&room=savant_query');
              } else if (room === 'rom_gallery') {
                setActiveDomain('MLB');
                setActiveRoom('rom_gallery');
                window.history.pushState({}, '', '?domain=MLB&room=rom_gallery');
              } else if (room === 'the_skew') {
                setActiveDomain('SKEW');
                setActiveRoom('the_skew');
                window.history.pushState({}, '', '?domain=SKEW&room=the_skew');
              } else if (room === 'hot_takes') {
                setActiveDomain('SKEW');
                setActiveRoom('hot_takes');
                window.history.pushState({}, '', '?domain=SKEW&room=hot_takes');
              } else if (room === 'storyboard_deck') {
                setActiveDomain('GLOBAL');
                setActiveRoom('storyboard_deck');
                window.history.pushState({}, '', '?domain=GLOBAL&room=storyboard_deck');
              } else if (room === 'persona_console') {
                setActiveDomain('GLOBAL');
                setActiveRoom('persona_console');
                window.history.pushState({}, '', '?domain=GLOBAL&room=persona_console');
              } else if (room === 'roll_call') {
                setActiveDomain('GLOBAL');
                setActiveRoom('roll_call');
                window.history.pushState({}, '', '?domain=GLOBAL&room=roll_call');
              } else if (room === 'advocate_center') {
                setActiveDomain('GLOBAL');
                setActiveRoom('advocate_center');
                window.history.pushState({}, '', '?domain=GLOBAL&room=advocate_center');
              } else if (room === 'edge_dvr') {
                setActiveDomain('GLOBAL');
                setActiveRoom('edge_dvr');
                window.history.pushState({}, '', '?domain=GLOBAL&room=edge_dvr');
              } else if (['cockpit', 'stream_sniper', 'highlight_heist', 'live_chat_sniper', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'user_management', 'system_config', 'portal_layout', 'sys_rules', 'token_ledger', 'game_log_export', 'promo_inbox', 'artifact_gallery', 'fanstack_sandbox', 'holodex', 'vocal_matrix', 'nexus_telemetry', 'room_builder', 'card_simulator'].includes(room)) {
                setActiveDomain('GLOBAL');
                setActiveRoom(room as any);
                window.history.pushState({}, '', `?domain=GLOBAL&room=${room}`);
              } else {
                setActiveRoom(room as any);
                window.history.pushState({}, '', `?domain=${activeDomain}&room=${room}`);
              }
            }}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-4 md:p-6 relative">
          
          {/* Permanent Top System Header Bar */}
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3 shrink-0 select-none">
            {/* Breadcrumbs / Path */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveDomain('PORTAL');
                  window.history.pushState({}, '', '?domain=PORTAL');
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-[#00b4d8] hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded border border-[#00b4d8]/30 flex items-center gap-1.5 cursor-pointer animate-fade-in"
              >
                🏠 Portal Home
              </button>
              <span className="text-white/20">/</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                {activeDomain}
              </span>
              {activeRoom && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#00b4d8] font-bold">
                    {activeRoom.replace('_', ' ').toUpperCase()}
                  </span>
                </>
              )}
            </div>

            {/* Global Feature Toggles (Grid & Pins) */}
            <div className="flex items-center gap-3">
              <button
                id="fundies-grid-toggle-btn"
                onClick={() => setFundiesGrid(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                  fundiesGrid
                    ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                📐 GRID: {fundiesGrid ? 'ON' : 'OFF'}
              </button>

              <button
                id="pin-engine-toggle-btn"
                onClick={() => setPinEngineActive(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                  pinEngineActive
                    ? 'bg-[#fd5a1e]/15 border-[#fd5a1e] text-[#fd5a1e] shadow-[0_0_10px_rgba(253,90,30,0.25)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                📌 PINS: {pinEngineActive ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* System Info & Profile */}
            <div className="flex items-center gap-4">
              <GlobalSystemBar 
                osTheme={osTheme} 
                setOsTheme={setOsTheme} 
                accessLocale={accessLocale} 
                setAccessLocale={setAccessLocale} 
                isVocalMatrixOpen={isVocalMatrixOpen} 
                setIsVocalMatrixOpen={setIsVocalMatrixOpen} 
                activeDomain={activeDomain} 
                activeRoom={activeRoom} 
                globalRoomBoggsOverride={globalRoomBoggsOverride} 
                setGlobalRoomBoggsOverride={setGlobalRoomBoggsOverride} 
                onNavigateRoom={(room) => { _setActiveDomain('GLOBAL'); setActiveRoom(room as any); }} 
              />
            </div>
          </div>

          {/* Pin Engine Overlay Layer */}
          {pinEngineActive && (
            <div 
              className="pin-engine-overlay-container"
              onClick={handleOverlayClick}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 9998,
                cursor: 'crosshair',
                overflow: 'hidden'
              }}
            >
              {/* Existing Pins */}
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className="absolute pin-interactive-element cursor-pointer group"
                  style={{
                    left: `${pin.x_pct}%`,
                    top: `${pin.y_pct}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                  }}
                >
                  {/* Glowing Pin Dot */}
                  <div className="w-4 h-4 rounded-full bg-[#FD5A1E] border border-white flex items-center justify-center shadow-[0_0_10px_rgba(253,90,30,0.8)] animate-pulse" />
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#0B0E14] border border-[#FD5A1E] text-white p-2.5 rounded-lg shadow-xl w-60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[10px] text-gray-400 font-mono">@{pin.author}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePin(pin.id);
                        }}
                        className="text-[9px] font-bold text-red-500 hover:text-red-400 font-mono tracking-widest cursor-pointer uppercase"
                      >
                        [Delete]
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-200 leading-relaxed font-sans">{pin.comment}</p>
                  </div>
                </div>
              ))}

              {/* Active Placement Dialog Input */}
              {activePlacement && (
                <div
                  className="absolute pin-interactive-element bg-[#0B0E14] border border-[#FD5A1E] p-3 rounded-lg shadow-2xl z-[10000] w-64"
                  style={{
                    left: `${activePlacement.x_pct}%`,
                    top: `${activePlacement.y_pct}%`,
                    transform: activePlacement.x_pct > 75 ? 'translate(-105%, -50%)' : 'translate(10px, -50%)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-[#FD5A1E] font-bold text-[10px] uppercase tracking-widest mb-1.5 font-mono">Create Spot Pin</h4>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter annotation..."
                    className="w-full bg-black/60 border border-white/20 rounded px-2.5 py-1.5 text-white text-xs font-sans outline-none focus:border-[#FD5A1E] mb-2"
                    value={pinComment}
                    onChange={(e) => setPinComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePin();
                      if (e.key === 'Escape') setActivePlacement(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePin}
                      className="flex-1 bg-[#FD5A1E]/20 hover:bg-[#FD5A1E]/30 border border-[#FD5A1E] text-[#FD5A1E] font-bold tracking-wider text-[9px] uppercase py-1.5 rounded cursor-pointer transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setActivePlacement(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-bold tracking-wider text-[9px] uppercase py-1.5 rounded cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

      {/* SOVEREIGN FEEDBACK MODE OVERLAY */}
      {isFeedbackMode && (
        <div
          className="fixed inset-0 z-[10000] cursor-crosshair bg-[#38bdf8]/10 pointer-events-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('.feedback-popup')) return;
            setFeedbackPin({ x: e.clientX, y: e.clientY });
            setFeedbackNote("");
          }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#38bdf8] text-black font-bold px-6 py-2 rounded  animate-pulse z-[10001] font-mono text-sm border-2 border-white">
            SOVEREIGN WHITEBOARD ACTIVE (Click anywhere to drop a pin)
          </div>

          {feedbackPin && (
            <div
              className="feedback-popup absolute bg-[#0B0E14] border-2 border-[#38bdf8] p-4 rounded-xl  z-[10001] w-72"
              style={{ top: feedbackPin.y, left: feedbackPin.x }}
            >
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#38bdf8] rounded-full animate-ping"></div>
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#38bdf8] rounded-full border-2 border-white"></div>
              <h4 className="text-[#38bdf8] font-bold text-[10px] uppercase tracking-widest mb-2 font-mono">Drop Whiteboard Note</h4>
              <textarea
                autoFocus
                className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm font-sans mb-3 h-24 outline-none focus:border-[#38bdf8]"
                placeholder="What should we change here?"
                value={feedbackNote}
                onChange={e => setFeedbackNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-[#38bdf8] text-black font-bold py-2 rounded text-[10px] uppercase tracking-wider hover:bg-[#7dd3fc] transition-colors"
                  onClick={() => {
                    fetch('/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        x: feedbackPin.x,
                        y: feedbackPin.y,
                        note: feedbackNote,
                        url: window.location.href,
                        room: activeRoom
                      })
                    }).then(() => {
                      setFeedbackPin(null);
                      setIsFeedbackMode(false);
                      alert("Pin dropped! Antigravity has been notified.");
                    }).catch(err => {
                      console.error(err);
                      alert("Failed to drop pin. Check console.");
                    });
                  }}
                >
                  SAVE PIN
                </button>
                <button
                  className="flex-1 bg-white/10 text-white font-bold py-2 rounded text-[10px] uppercase tracking-wider hover:bg-white/20 transition-colors"
                  onClick={() => setFeedbackPin(null)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CypherCellModal />

      {/* DYNAMIC CONTENT ROUTER */}
      {activeRoom === 'fan_lobby' ? (
        <FanLobby 
          activeGamedayPk={activeGamedayPk}
          onSelectGame={(pk) => {
            setActiveGamedayPk(pk);
            setActiveRoom('starter');
            setActiveDomain('MLB');
            window.history.pushState({}, '', `?domain=MLB&room=starter&_game_room=${pk}`);
          }}
        />
      ) : activeDomain === 'CMDB' && !isPatron ? (
        <SovereignCmdb />
      ) : activeDomain === 'ROOT' && activeRoom === 'pixel_dropzone' && !isPatron ? (
        <PixelDropZone />
      ) : activeDomain === 'ROOT' && activeRoom === 'starter' && !isPatron ? (
        <SovereignOsPortal onNavigate={(domain, room) => {
          if (domain === 'CMDB') {
            setActiveDomain('CMDB');
            return;
          }
          setActiveDomain(domain);
          if (room) {
            if (room === 'sow' || room === 'advocate_center' || room === 'advocate_lookbook' || room === 'nexus_telemetry' || room === 'theme_manager' || room === 'model_arena' || room === 'user_management' || room === 'system_config' || room === 'portal_layout' || room === 'sys_rules' || room === 'stacklabs') {
              setActiveDomain('GLOBAL');
            } else if (room === 'kanban') {
              setActiveDomain('ROOT');
            }
            setActiveRoom(room as any);
          }
        }} />
      ) : activeDomain === 'PORTAL' ? (
        <FanStackPortal onSelectDomain={(domain) => {
          if (domain === 'MLB') { setActiveDomain('MLB'); setActiveRoom('starter'); }
          else if (domain === 'PGA') { setActiveDomain('PGA'); setActiveRoom('amen_corner'); }
          else if (domain === 'SKEW') { setActiveDomain('SKEW'); setActiveRoom('the_skew'); }
          else if (domain === 'ARGUS') { setActiveDomain('ARGUS'); }
          else if (domain === 'HOLODEX') { setActiveDomain('HOLODEX'); setActiveRoom('holodex'); }
          else if (domain === 'EDGE_DVR') { setActiveDomain('GLOBAL'); setActiveRoom('edge_dvr'); }
          else if (domain === 'STREAM_SNIPER') { setActiveDomain('GLOBAL'); setActiveRoom('stream_sniper'); }
          else if (domain === 'ROM_GALLERY') { setActiveDomain('MLB'); setActiveRoom('rom_gallery'); }
          else if (domain === 'OPTICAL_INGEST') { setActiveDomain('GLOBAL'); setActiveRoom('optical_ingest'); }
          else if (domain === 'TELEMETRY') { setActiveDomain('GLOBAL'); setActiveRoom('nexus_telemetry'); }
          else if (domain === 'VAULT') { setActiveDomain('GLOBAL'); setActiveRoom('artifact_gallery'); }
          else if (domain === 'STORYBOARD') { setActiveDomain('GLOBAL'); setActiveRoom('storyboard_deck'); }
          else if (domain === 'CMDB') { setActiveDomain('CMDB'); }
          else if (domain === 'PERSONA_CENTER' as any) { setActiveDomain('GLOBAL'); setActiveRoom('advocate_center'); }
          else if (domain === 'ADVOCATE_CENTER' as any) { setActiveDomain('GLOBAL'); setActiveRoom('advocate_lookbook'); }
          else if (domain === 'SAVANT') { setActiveDomain('MLB'); setActiveRoom('savant_query'); }
          else if (domain === 'VOCAL') { setActiveDomain('GLOBAL'); setActiveRoom('vocal_matrix'); }
          else if (domain === 'SOVEREIGN_CSS') { setActiveDomain('GLOBAL'); setActiveRoom('sovereign_css'); }
          else if (domain === 'KANBAN') { setActiveDomain('GLOBAL'); setActiveRoom('kanban'); }
          else if (domain === 'ROLL_CALL') { setActiveDomain('GLOBAL'); setActiveRoom('roll_call'); }
          else if (domain === 'DREADNOUGHT' as any) { setActiveDomain('GLOBAL'); setActiveRoom('dreadnought'); }
          else if (domain === 'HOT_TAKES' as any) { setActiveDomain('SKEW'); setActiveRoom('hot_takes'); }
          else if (domain === 'MODEL_ARENA' as any) { setActiveDomain('GLOBAL'); setActiveRoom('model_arena'); }
          else if (domain === 'PROMO_INBOX' as any) { setActiveDomain('GLOBAL'); setActiveRoom('promo_inbox'); }
          else if (domain === 'TOKEN_LEDGER' as any) { setActiveDomain('GLOBAL'); setActiveRoom('token_ledger'); }
          else if (domain === 'GAME_LOG_EXPORT' as any) { setActiveDomain('GLOBAL'); setActiveRoom('game_log_export'); }
          else if (domain === 'TMI_NEWS_DESK' as any) { setActiveDomain('MLB'); setActiveRoom('tmi_news_desk'); }
          else if (domain === 'COCKPIT' as any) { setActiveDomain('GLOBAL'); setActiveRoom('cockpit' as any); }
          else {
            alert(`The ${domain} matrix is currently locked offline. Reverting to MLB Command Center.`);
            setActiveDomain('MLB');
            setActiveRoom('starter');
          }
        }} />
      ) : activeDomain === 'ARGUS' && !isPatron ? (
        <ArgusNexusConsole osTheme={osTheme} onBack={() => { setActiveDomain('PORTAL'); window.history.pushState({}, '', '?domain=PORTAL'); }} />
      ) : (
        <>

       {(activeRoom as string) !== 'rom_gallery' && (activeRoom as string) !== 'the_skew' && (activeRoom as string) !== 'kanban' && (activeRoom as string) !== 'sow' && (activeRoom as string) !== 'system_config' && (activeRoom as string) !== 'user_management' && (activeRoom as string) !== 'fan_lobby' && (activeRoom as string) !== 'mam_tmi_console' && !(activeRoom === 'starter' && activeGamedayPk) && (
        <header className="flex flex-col items-center justify-center mb-1">
          <h1 className={`text-center m-0 drop-shadow-lg ${
              activeRoom === 'savant_query' ? 'text-3xl md:text-4xl font-display font-bold uppercase tracking-wider text-white' :
              activeRoom === 'starter' || activeRoom === 'playcall_desk' ? 'text-3xl md:text-4xl vm-header vm-accent-glow font-bold pb-1 tracking-wide' :
                activeRoom === 'amen_corner' ? 'text-3xl md:text-4xl font-serif font-bold text-[#E0BC68] tracking-widest uppercase' :
                  'text-3xl md:text-4xl font-mono font-bold text-status-cyan tracking-wide'
            }`}>
            {(activeRoom as string) === 'starter' ? "The Command Center" : (activeRoom as string) === 'pegasus' ? "Pegasus Matrix" : (activeRoom as string) === 'uhf_studio' ? "UHF Studio" : (activeRoom as string) === 'holodex' ? "Sovereign HoloDex" : (activeRoom as string) === 'shatcast_vision' ? "Shatcast Vision Matrix" : (activeRoom as string) === 'log_viewer' ? "CSV Ingestion Engine" : (activeRoom as string) === 'playcall_desk' ? "Playcall Desk" : (activeRoom as string) === 'persona_console' ? "FanStack Service Portal" : (activeRoom as string) === 'auditor' ? "Umpire's Review" : (activeRoom as string) === 'advocate_center' ? "Advocate Center" : (activeRoom as string) === 'advocate_lookbook' ? "Advocate Lookbook" : (activeRoom as string) === "knowledge_hub" ? "Knowledge Hub" : (activeRoom as string) === "courier" ? "Agent Courier" : (activeRoom as string) === "promo_inbox" ? "The Cosmic Sieve" : (activeRoom as string) === "nexus_telemetry" ? "Nexus Telemetry" : (activeRoom as string) === "artifact_gallery" ? "Media Vault Matrix" : (activeRoom as string) === "vocal_matrix" ? "Vocal Matrix" : (activeRoom as string) === "storyboard_deck" ? "Storyboard Deck" : (activeRoom as string) === "fanstack_sandbox" ? "FanStack Sandbox" : (activeRoom as string) === "savant_query" ? "Savant Oracle" : (activeRoom as string) === "amen_corner" ? "Amen Corner (PGA)" : (activeRoom as string) === "factory_dashboard" ? "Flowmercial Factory" : (activeRoom as string) === "aether_vet" ? "Aether Vet Telemetry" : (activeRoom as string) === "model_arena" ? "Model Battle Arena" : (activeRoom as string) === "optical_ingest" ? "Optical Ingest Console" : (activeRoom as string) === "user_mgmt" ? "User Management" : (activeRoom as string) === "cockpit" ? "System Cockpit" : ""}
          </h1>
        </header>
       )}

      <main className="flex-1 w-full px-8 mx-auto relative overflow-hidden flex flex-col min-h-0">
        {activeDomain === 'MLB' && (activeRoom === 'starter' || (activeRoom as string) === 'fan_lobby') && <MlbScoreBar activeGamedayPk={activeGamedayPk} onSelectGame={setActiveGamedayPk} />}
        {activeRoom === 'starter' && activeGamedayPk && <GamedayScoreboard liveBoxScore={liveBoxScore} onClose={() => setActiveGamedayPk(null)} />}
        <AnimatePresence>
          {samSighting && (
            <motion.div
              initial={{ scale: 0, rotate: -45, y: -500 }}
              animate={{ scale: 1, rotate: Math.random() * 20 - 10, y: 0 }}
              exit={{ scale: 2, opacity: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none"
            >
              <div className="absolute inset-0 bg-red-900/50 mix-blend-color-burn animate-pulse"></div>
              <div className="relative border-8 border-red-600 bg-black p-4 rotate-3 shadow-[0_0_100px_red]">
                <div className="absolute -top-12 left-0 right-0 text-center font-display text-4xl text-red-500 bg-black/80 px-4 py-2 border-2 border-red-500 animate-pulse whitespace-nowrap">
                  🚨 BIOLOGICAL BREACH (NODE .172) 🚨
                </div>
                <div className="text-center font-mono text-xl text-[#FF5910] bg-black/80 px-4 py-1 border border-[#FF5910]">
                  GOPHER SIGHTING IN THE FANSTACK
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col w-full relative min-h-0">
          {activeRoom === 'cockpit' && (
            <InteractiveCockpit onNavigate={(route) => setActiveRoom(route as any)} />
          )}

          {activeRoom === 'mam_tmi_console' && (
            <MamTmiConsole />
          )}

          {activeRoom === 'claude' && (
            <StarterShack />
          )}

          {activeRoom === 'artifact_gallery' && (
            <ArtifactGallery />
          )}

          {activeRoom === 'fanstack_sandbox' && (
            <FanStackSandbox />
          )}

          {activeRoom === 'model_arena' && (
            <ModelArena />
          )}

          {activeRoom === 'advocate_center' && (
            <AdvocateCenter />
          )}

          {/* ScruffysTavern render removed */}

          {activeRoom === 'room_builder' && (
            <RoomBuilder activeGamedayPk={activeGamedayPk} onSelectGame={setActiveGamedayPk} />
          )}

          {activeRoom === 'weedstack' && (
            <FanStackRoom />
          )}

          {activeRoom === 'starter' && (
            <motion.div
              key="starter"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className={`grid ${activeGamedayPk ? 'grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[80vh] p-4 bg-[#0a0c10]' : 'grid-cols-1 gap-0 w-full bg-[#0a0c10] relative border border-white/5 rounded-xl overflow-hidden shadow-2xl h-full min-h-0'}`}
            >
              {activeGamedayPk ? ( (() => {
                const gameStatus = liveBoxScore?.gameData?.status?.statusCode;
                const isPreGame = (gameStatus === 'S' || gameStatus === 'P' || gameStatus === 'PW' || gameStatus === 'DI' || !liveBoxScore) && new Date().getHours() >= 11;
                return (
                <>
              {/* LEFT PANE: PLAYER PROFILE & BOX SCORE */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {isPreGame ? (
                  <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-slate-600 rounded-sm p-6 shadow-lg flex-1 flex flex-col items-center justify-center text-center">
                     <div className="w-16 h-16 rounded-full border border-slate-500/30 flex items-center justify-center mb-4 bg-slate-800/50">
                        <span className="text-slate-400 font-mono text-xl">P-G</span>
                     </div>
                     <h3 className="text-white font-display font-bold uppercase tracking-widest text-lg">Pre-Game</h3>
                     <p className="text-slate-400 font-mono text-[10px] uppercase mt-2">Awaiting First Pitch Telemetry</p>
                  </div>
                ) : (
                  <>
                {/* Profile Widget */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-cyan-500 rounded-sm p-3 shadow-lg relative overflow-hidden">
                  <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-1A] PLAYER PROFILE</div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 blur-xl"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase font-bold">Player Profile</h3>
                    <div className="flex gap-1"><div className="w-1 h-1 bg-cyan-400"></div><div className="w-1 h-1 bg-cyan-400/50"></div></div>
                  </div>
                  <h2 className="text-white font-display text-2xl font-bold uppercase tracking-widest mb-3">
                    {liveBoxScore?.liveData?.plays?.currentPlay?.matchup?.batter?.fullName || 'BATTER'}
                  </h2>
                  <div className="grid grid-cols-4 gap-1 mb-4">
                    <div className="flex flex-col items-center bg-white/5 py-1 border border-white/5"><span className="text-white/40 text-[9px] font-mono">AVG</span><span className="text-cyan-300 font-bold font-mono">.291</span></div>
                    <div className="flex flex-col items-center bg-white/5 py-1 border border-white/5"><span className="text-white/40 text-[9px] font-mono">OBP</span><span className="text-cyan-300 font-bold font-mono">.402</span></div>
                    <div className="flex flex-col items-center bg-white/5 py-1 border border-white/5"><span className="text-white/40 text-[9px] font-mono">OPS</span><span className="text-cyan-300 font-bold font-mono">.994</span></div>
                    <div className="flex flex-col items-center bg-white/5 py-1 border border-white/5"><span className="text-white/40 text-[9px] font-mono">HR</span><span className="text-cyan-300 font-bold font-mono">41</span></div>
                  </div>
                  
                  <div className="space-y-3 font-mono">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]"><span className="text-white/60 uppercase tracking-wider">Exit Velo</span><span className="text-white font-bold">112.4 MPH</span></div>
                      <div className="h-[2px] w-full bg-slate-800 rounded-none overflow-hidden"><div className="h-full bg-[#FF5910] w-[98%] "></div></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]"><span className="text-white/60 uppercase tracking-wider">Launch Angle</span><span className="text-white font-bold">26.3°</span></div>
                      <div className="h-[2px] w-full bg-slate-800 rounded-none overflow-hidden"><div className="h-full bg-[#FF5910] w-[92%] "></div></div>
                    </div>
                    <div className="flex justify-between text-[10px] py-1 border-b border-white/5"><span className="text-white/60 uppercase tracking-wider">Spin Rate</span><span className="text-white">2410 RPM</span></div>
                    <div className="flex justify-between text-[10px] py-1 border-b border-white/5"><span className="text-white/60 uppercase tracking-wider">Est BA</span><span className="text-white">.540</span></div>
                    <div className="flex justify-between text-[10px] py-1"><span className="text-white/60 uppercase tracking-wider">Barrel%</span><span className="text-white font-bold text-[#FF5910]">21.5%</span></div>
                  </div>
                </div>

                {/* Game Trends */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-slate-600 rounded-sm p-3 shadow-lg flex-1 relative overflow-hidden">
                  <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-1B] GAME TRENDS</div>
                  <h3 className="text-slate-400 font-mono text-[10px] tracking-widest uppercase font-bold mb-3">Game Trends</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white/40 text-[9px] uppercase font-mono">Win Probability</div>
                      <div className="text-white font-display font-bold text-2xl tracking-wider">{liveBoxScore?.gameData?.teams?.away?.abbreviation || 'AWY'} 64%</div>
                    </div>
                    <div className="w-10 h-10 border border-slate-700 border-t-cyan-500 border-r-cyan-500 flex items-center justify-center rotate-45 relative">
                       <div className="absolute inset-0 bg-cyan-500/10 mix-blend-screen"></div>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>

              {/* CENTER PANE: VIDEO / GAMEDAY */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl flex-1 overflow-hidden flex flex-col relative group">
                  <div className="zone-badge" style={{ top: '38px', left: '12px' }}>[ZONE-2] GAMEDAY FEED</div>
                  
                  {/* Top Bar */}
                  <div className="h-8 bg-[#05080f] flex items-center justify-between px-3 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-slate-700"></div>
                      <div className="w-2 h-2 rounded-sm bg-slate-700"></div>
                      <div className="w-2 h-2 rounded-sm bg-cyan-500/50"></div>
                    </div>
                    <div className="flex items-center gap-3 text-white font-display font-bold text-sm tracking-widest">
                      <img src={`https://www.mlbstatic.com/team-logos/${liveBoxScore?.gameData?.teams?.away?.id || 147}.svg`} className="h-4 w-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                      {liveBoxScore?.gameData?.teams?.away?.abbreviation || 'AWY'} <span className="text-cyan-400">{liveBoxScore?.liveData?.linescore?.teams?.away?.runs ?? 0}</span>
                      <span className="text-white/20">/</span> 
                      {liveBoxScore?.gameData?.teams?.home?.abbreviation || 'HME'} <span className="text-cyan-400">{liveBoxScore?.liveData?.linescore?.teams?.home?.runs ?? 0}</span>
                      <img src={`https://www.mlbstatic.com/team-logos/${liveBoxScore?.gameData?.teams?.home?.id || 119}.svg`} className="h-4 w-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <div className="text-cyan-400 text-[9px] uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan]"></span> LIVE FEED
                    </div>
                  </div>

                  {/* Main Feed Area */}
                  <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    {activeGamedayPk ? (
                      <div className="w-full h-full relative" style={{ clipPath: 'inset(0px 0px 145px 0px)' }}>
                         <iframe src={`https://www.mlb.com/gameday/${activeGamedayPk}`} className="absolute top-0 left-0 w-full border-0" style={{ height: 'calc(100% + 145px)' }}></iframe>
                      </div>
                    ) : (
                      <div className="w-full h-full relative bg-[#05080f] flex flex-col items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,242,254,0.1)_0%,_transparent_70%)]"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col items-center animate-pulse">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#38bdf8]/50 animate-[spin_10s_linear_infinite] flex items-center justify-center mb-6">
                            <div className="w-16 h-16 rounded-full border border-[#38bdf8] flex items-center justify-center bg-[#38bdf8]/5">
                              <div className="w-2 h-2 bg-[#38bdf8] rounded-full "></div>
                            </div>
                          </div>
                          
                          <h2 className="font-display font-bold text-2xl text-white tracking-[0.2em] uppercase mb-2 drop-">
                            Awaiting Gameday Feed
                          </h2>
                          <div className="flex items-center gap-3 text-[#38bdf8] font-mono text-xs uppercase tracking-widest">
                            <span className="w-1 h-4 bg-[#38bdf8] animate-[pulse_1s_ease-in-out_infinite]"></span>
                            Scanning Telemetry Subspace
                            <span className="w-1 h-4 bg-[#38bdf8] animate-[pulse_1s_ease-in-out_infinite_0.5s]"></span>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end p-4">
                           {/* High-Tech Overlay Elements */}
                           <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
                           <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
                           <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
                           <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>
                           
                           <div className="w-full">
                              <div className="text-white/50 font-mono text-[8px] tracking-widest mb-1">OPTICS ONLINE // FEED STABLE</div>
                              <div className="w-full h-[1px] bg-white/20 relative"><div className="absolute left-0 top-0 h-full w-1/3 bg-cyan-500 shadow-[0_0_10px_cyan]"></div></div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticker Bottom */}
                  <div className="h-8 bg-[#111] border-t border-cyan-500/30 text-cyan-400 font-mono text-[9px] tracking-[0.2em] uppercase flex items-center px-3 overflow-hidden whitespace-nowrap">
                    <span className="bg-cyan-500 text-black px-1.5 py-0.5 mr-3 font-bold">SYS</span>
                    {/* @ts-ignore */}
                    <marquee scrollamount="5" className="flex-1 pt-1">
                      &gt;&gt;&gt; {liveBoxScore?.gameData?.teams?.away?.abbreviation || 'AWY'} @ {liveBoxScore?.gameData?.teams?.home?.abbreviation || 'HME'}: {liveBoxScore?.liveData?.plays?.currentPlay?.matchup?.pitcher?.fullName || 'PITCHER'} PITCHING TO {liveBoxScore?.liveData?.plays?.currentPlay?.matchup?.batter?.fullName || 'BATTER'} ({liveBoxScore?.liveData?.plays?.currentPlay?.count?.balls || 0}-{liveBoxScore?.liveData?.plays?.currentPlay?.count?.strikes || 0}) &gt;&gt;&gt; LAST PLAY: {liveBoxScore?.liveData?.plays?.currentPlay?.result?.description || 'Awaiting Play...'} &gt;&gt;&gt; CURRENT WIN PROB: {liveBoxScore?.gameData?.teams?.away?.abbreviation || 'AWY'} 64% &gt;&gt;&gt;
                    {/* @ts-ignore */}
                    </marquee>
                  </div>
                </div>
              </div>

              {/* RIGHT PANE: PITCH ANALYTICS */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {isPreGame ? (
                  <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-slate-600 rounded-sm p-6 shadow-lg flex-1 flex flex-col items-center justify-center text-center">
                     <div className="w-16 h-16 rounded-full border border-slate-500/30 flex items-center justify-center mb-4 bg-slate-800/50">
                        <span className="text-slate-400 font-mono text-xl">RADAR</span>
                     </div>
                     <h3 className="text-white font-display font-bold uppercase tracking-widest text-lg">Radar Offline</h3>
                     <p className="text-slate-400 font-mono text-[10px] uppercase mt-2">Standing by for Pitch Tracking</p>
                  </div>
                ) : (
                  <>
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-cyan-500 rounded-sm p-3 shadow-lg h-[55%] relative overflow-hidden">
                  <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-3A] PITCH ANALYTICS</div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase font-bold">Pitch Analytics</h3>
                    <div className="w-2 h-2 bg-green-500/20 border border-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h2 className="text-white font-display text-2xl font-bold uppercase tracking-widest mb-4">
                    {liveBoxScore?.liveData?.plays?.currentPlay?.matchup?.pitcher?.fullName || 'PITCHER'}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 font-mono">
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Pitch 88</span>
                      <span className="text-cyan-300 font-bold text-base">98.7 <span className="text-[9px] text-white/30">MPH</span></span>
                    </div>
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Pitch Velo</span>
                      <span className="text-cyan-300 font-bold text-base">98.7 <span className="text-[9px] text-white/30">MPH</span></span>
                    </div>
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Break Horiz</span>
                      <span className="text-white font-bold text-base">7.2"</span>
                    </div>
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Break Vert</span>
                      <span className="text-white font-bold text-base">14.1"</span>
                    </div>
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Spin Rate</span>
                      <span className="text-[#FF5910] font-bold text-base">2545 <span className="text-[9px] text-white/30">RPM</span></span>
                    </div>
                    <div className="bg-white/5 p-1.5 border border-white/5">
                      <span className="text-white/40 text-[8px] block uppercase tracking-widest">Active Spin</span>
                      <span className="text-white font-bold text-base">96%</span>
                    </div>
                  </div>
                </div>

                {/* Strike Zone Visualizer */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 border-t-2 border-t-slate-600 rounded-sm p-3 shadow-lg h-[45%] flex flex-col relative overflow-hidden">
                   <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-3B] STRIKE ZONE RADAR</div>
                   <h3 className="text-slate-400 font-mono text-[10px] tracking-widest uppercase font-bold mb-2">Strike Zone Radar</h3>
                   <div className="flex-1 rounded flex items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black">
                      
                      {/* Radar Sweep Animation */}
                      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(6,182,212,0.4)_360deg)] animate-[spin_4s_linear_infinite] rounded-full opacity-30"></div>
                      
                      {/* Sharp Strike Zone Grid */}
                      <div className="w-24 h-32 border-2 border-cyan-500/50 grid grid-cols-3 grid-rows-3 relative z-10 ">
                         <div className="border border-cyan-500/20"></div><div className="border border-cyan-500/20"></div><div className="border border-cyan-500/20"></div>
                         <div className="border border-cyan-500/20"></div><div className="border border-cyan-500/20 flex items-center justify-center"><div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div></div><div className="border border-cyan-500/20"></div>
                         <div className="border border-cyan-500/20"></div><div className="border border-cyan-500/20"></div><div className="border border-cyan-500/20"></div>
                         
                         {/* Heatmap Pitches */}
                         <div className="w-2.5 h-2.5 rounded-full bg-[#FF5910] absolute top-4 right-4 "></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 absolute bottom-2 left-6 shadow-[0_0_8px_cyan]"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-3 right-2 shadow-[0_0_8px_red]"></div>
                         <div className="w-2 h-2 rounded-full bg-yellow-400 absolute top-12 left-8 shadow-[0_0_8px_yellow]"></div>
                      </div>
                      
                      <div className="absolute bottom-1 right-1 flex gap-2 z-20">
                        <div className="flex items-center gap-1 text-[7px] text-white/50 font-mono"><div className="w-1.5 h-1.5 bg-red-500"></div> FB</div>
                        <div className="flex items-center gap-1 text-[7px] text-white/50 font-mono"><div className="w-1.5 h-1.5 bg-cyan-400"></div> CH</div>
                        <div className="flex items-center gap-1 text-[7px] text-white/50 font-mono"><div className="w-1.5 h-1.5 bg-[#FF5910]"></div> SL</div>
                      </div>
                   </div>
                </div>
                </>
                )}
              </div>
              </>
              );
              })()
              ) : (
                /* DAILY BRIEFING BASE STATE */
                <div className="w-full h-full flex flex-col bg-black/40 backdrop-blur-md rounded-xl border border-white/5 shadow-2xl overflow-hidden relative">


                  {/* Main Content Area */}
                  <div className="flex-1 w-full px-8 mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                    
                     {/* Hero Section */}
                    <div className="lg:col-span-8 flex flex-col group cursor-pointer min-h-0 h-full relative" onClick={() => dailyBriefing?.hero?.link && window.open(dailyBriefing.hero.link, '_blank')}>
                      <div className="zone-badge" style={{ top: '12px', left: '12px' }}>[ZONE-1] HERO BRIEFING</div>
                      <div className="w-full rounded-2xl overflow-hidden mb-4 border border-white/10 relative flex-1 bg-black min-h-0">
                         <img src={dailyBriefing?.hero?.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-display font-black text-white mb-2 tracking-wide group-hover:text-cyan-400 transition-colors drop-shadow-md line-clamp-2 shrink-0">
                        {dailyBriefing?.hero?.headline}
                      </h1>
                      <p className="text-base text-white/60 font-mono leading-relaxed line-clamp-2 shrink-0">
                        {dailyBriefing?.hero?.subheadline}
                      </p>
                    </div>

                    {/* Latest News Sidebar */}
                    <div className="lg:col-span-4 flex flex-col min-h-0 h-full relative">
                      <div className="zone-badge" style={{ top: '12px', right: '12px' }}>[ZONE-2] STREAMING HEADLINES</div>
                      <h2 className="text-xl md:text-2xl font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest font-display border-b border-white/10 pb-3 shrink-0">
                        Latest News
                      </h2>
                      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0">
                        {dailyBriefing?.news?.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-4 group cursor-pointer items-start p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-white border border-white/20`} style={{ backgroundColor: item.iconBg || '#002D72' }}>
                              {item.icon}
                            </div>
                            <div className="flex-1 text-sm font-bold text-white/80 group-hover:text-cyan-400 transition-colors leading-relaxed" onClick={() => item.link && window.open(item.link, '_blank')}>
                              {item.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeRoom === 'auditor' && (
            <motion.div
              key="auditor"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[75vh]"
            >
              <div className="lg:col-span-8 h-[75vh]">
                <div className="w-full h-full border border-[#38bdf8]/30  bg-black/90">
                  <LiveAudioInterface />
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="vds-container border-status-cyan/50 bg-status-cyan/10 p-6 flex-1">
                  <h3 className="font-display text-2xl text-[#38bdf8] uppercase tracking-widest border-b border-[#38bdf8]/20 pb-4 mb-4">Umpire's Review Matrix</h3>
                  <ul className="space-y-4 font-mono text-sm text-[#e0f2fe]">
                    <li className="flex gap-2"><span className="text-[#FF5910]">→</span> Investigating foreign substance on Pitcher's hand.</li>
                    <li className="flex gap-2"><span className="text-[#FF5910]">→</span> Monitoring communications between Dugout and Bullpen.</li>
                    <li className="flex gap-2"><span className="text-[#FF5910]">→</span> Equipment Audit: Batter's corked bat designated 'Lethal'.</li>
                    <li className="flex items-center justify-center p-8 mt-12 bg-[#FF5910]/10 border border-[#FF5910]/30 animate-pulse text-[#FF5910] font-bold text-lg tracking-widest text-center">AWAITING MLB REPLAY OVERRIDE</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeRoom === 'pegasus' && (
            <PegasusDreadnought />
          )}

          {activeRoom === 'god_mode' && (
            <motion.div
              key="god_mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full border border-red-500/30 rounded-xl overflow-hidden"
            >
              <GodModeInjector />
            </motion.div>
          )}

          {activeRoom === 'uhf_studio' && (
            <motion.div
              key="uhf_studio"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full rounded-xl overflow-hidden"
            >
              <UhfStudio />
            </motion.div>
          )}

          {activeRoom === 'the_skew' && (
            <motion.div
              key="the_skew"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden  border border-[#a855f7]/30"
            >
              <TheSkewStudio globalBoggsOverride={globalRoomBoggsOverride} />
            </motion.div>
          )}

          {activeRoom === 'hot_takes' && (
            <motion.div
              key="hot_takes"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden  border border-red-500/30"
            >
              <HotTakesConsole onClose={() => setActiveRoom('starter')} />
            </motion.div>
          )}

          {activeRoom === 'holodex' && (
            <motion.div
              key="holodex"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden  border border-[#38bdf8]/30"
            >
              <HoloDex />
            </motion.div>
          )}

          {activeRoom === 'factory_dashboard' && (
            <motion.div
              key="factory_dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden "
            >
              <FactoryDashboard />
            </motion.div>
          )}

          {activeRoom === 'sys_rules' && (
            <motion.div
              key="sys_rules"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <SysRulesPanel />
            </motion.div>
          )}

          {activeRoom === 'shatcast_vision' && (
            <motion.div
              key="shatcast_vision"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full rounded-xl overflow-hidden"
            >
              <ShatcastVisionStudio />
            </motion.div>
          )}

          {activeRoom === 'rom_gallery' && (
            <motion.div
              key="rom_gallery"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-160px)] w-full rounded-xl overflow-hidden"
            >
              <WatchPartyConsole />
            </motion.div>
          )}

          {activeRoom === 'optical_ingest' && (
            <motion.div
              key="optical_ingest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-160px)] w-full rounded-xl overflow-hidden"
            >
              <OpticalIngestConsole />
            </motion.div>
          )}

          {activeRoom === 'nexus_telemetry' && (
            <motion.div
              key="nexus_telemetry"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden "
            >
              <HardwareTelemetryDashboard />
            </motion.div>
          )}

          {activeRoom === 'edge_dvr' && (
            <motion.div
              key="edge_dvr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden  border border-[#ff0033]/30"
            >
              <EdgeDvrConsole />
            </motion.div>
          )}

          {activeRoom === 'card_simulator' && (
            <motion.div
              key="card_simulator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-y-auto h-[calc(100vh-150px)]"
            >
              <SovereignCardSimulator />
            </motion.div>
          )}

          {activeRoom === 'stream_sniper' && (
            <motion.div
              key="stream_sniper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <StreamSniperConsole />
            </motion.div>
          )}

          {activeRoom === 'highlight_heist' && (
            <motion.div
              key="highlight_heist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <HighlightHeistConsole />
            </motion.div>
          )}

          {activeRoom === 'live_chat_sniper' && (
            <motion.div
              key="live_chat_sniper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 min-h-0 flex flex-col"
            >
              <LiveChatSniper globalBoggsOverride={globalRoomBoggsOverride} />
            </motion.div>
          )}

          {activeRoom === 'sovereign_css' && (
            <motion.div
              key="sovereign_css"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden border"
              style={{
                borderColor: 'var(--sov-primary, #00ff00)',
                boxShadow: '0 0 50px var(--sov-glow, rgba(0,255,0,0.2))'
              }}
            >
              <SovereignThemeLab />
            </motion.div>
          )}

          {activeRoom === 'amen_corner' && (
            <motion.div
              key="amen_corner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center justify-center p-8 bg-[#020617] rounded-xl border border-[#E0BC68]/30  relative overflow-hidden"
            >
              <div className="absolute top-10 left-[-60px] w-[300px] bg-red-600 text-white font-black text-center py-2 -rotate-45 z-50 uppercase tracking-[0.3em]  border-y border-white/50 text-[11px]">
                Alpha Stage • Work In Progress
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory w-full gap-8 pb-8 no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                {AMEN_CORNER_IMAGES.map((img, i) => (
                  <div key={i} className="snap-center shrink-0 w-full md:w-[80%] flex justify-center">
                    <img src={`/amen_corner_images/${img}`} alt="Amen Corner Flow" className="max-h-[70vh] rounded-xl shadow-2xl object-contain drop-shadow-lg border border-[#E0BC68]/20" />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 text-[#E0BC68]/50 text-sm font-mono tracking-widest uppercase animate-pulse">
                « SWIPE / SCROLL FOR MORE »
              </div>
            </motion.div>
          )}

          {activeRoom === 'configurator' && (
            <motion.div
              key="configurator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full rounded-xl overflow-hidden border border-slate-800"
            >
              <RoomConfigurator />
            </motion.div>
          )}

          {activeRoom === 'log_viewer' && (
            <motion.div
              key="log_viewer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full rounded-xl overflow-hidden border border-slate-800"
            >
              <SovereignLogViewer />
            </motion.div>
          )}

          {activeRoom === 'vocal_matrix' && (
            <motion.div
              key="vocal_matrix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-200px)] w-full rounded-xl overflow-hidden border border-slate-800"
            >
              <iframe src={`/tts-proxy/tts_commlink.html?theme=${osTheme}`} className="w-full h-full border-0" title="Vocal Matrix" />
            </motion.div>
          )}

          {activeRoom === 'storyboard_deck' && (
            <motion.div
              key="storyboard_deck"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <StoryboardGallery />
            </motion.div>
          )}

          {activeRoom === 'theme_manager' && (
            <motion.div
              key="theme_manager"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <SovereignThemeManager />
            </motion.div>
          )}

          {activeRoom === 'playcall_desk' && (
            <motion.div
              key="playcall_desk"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden border border-[#FF5910]/30  bg-[#0B0E14] relative"
            >
              <PlaycallDesk />
            </motion.div>
          )}

          {activeRoom === 'tmi_news_desk' && (
            <motion.div
              key="tmi_news_desk"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full"
            >
              <TMINewsDesk activeGamedayPk={activeGamedayPk} />
            </motion.div>
          )}



          {activeRoom === 'knowledge_hub' && (
            <motion.div
              key="knowledge_hub"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[75vh] w-full rounded-xl overflow-hidden"
            >
              <KnowledgeHub />
            </motion.div>
          )}

          {activeRoom === 'promo_inbox' && (
            <motion.div
              key="promo_inbox"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full w-full rounded-xl overflow-hidden"
            >
              <PromoInbox />
            </motion.div>
          )}



          {activeRoom === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden shadow-2xl border border-white/5 relative"
            >
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-4">
                <button 
                  onClick={() => setIsTicketModalOpen(true)}
                  className="px-4 py-2 bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-[#38bdf8] hover:text-black transition-colors"
                >
                  New Ticket
                </button>
                <button 
                  onClick={() => { setActiveDomain('ROOT'); setActiveRoom('starter'); window.history.pushState({}, '', '/'); }} 
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                >
                  Close Kanban
                </button>
              </div>
              <LivingKanbanBoard />
              <NewTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
            </motion.div>
          )}

          {/* STRY1779338715 — Token Ledger */}
          {activeRoom === 'token_ledger' && (
            <motion.div
              key="token_ledger"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full rounded-xl overflow-hidden border border-[#7c3aed]/20 shadow-2xl"
            >
              <TokenLedger />
            </motion.div>
          )}

          {/* STRY1779341054 — Game Log Export */}
          {activeRoom === 'game_log_export' && (
            <motion.div
              key="game_log_export"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full rounded-xl overflow-hidden border border-[#22c55e]/20 shadow-2xl"
            >
              <GameLogExport />
            </motion.div>
          )}

          {activeRoom === 'dreadnought' && (
            <motion.div
              key="dreadnought"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full"
            >
              <DreadnoughtConsole />
            </motion.div>
          )}

          {activeRoom === 'weedstack' && (
            <motion.div
              key="weedstack"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-screen relative z-[900]"
            >
              <WildseedPitch onEnterPortal={() => {
                setActiveRoom('starter');
                setActiveDomain('ROOT');
                window.history.pushState({}, '', '/');
              }} />
            </motion.div>
          )}

          {activeRoom === 'prospectus' && (
            <motion.div
              key="prospectus"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-screen relative z-[900]"
            >
              <InvestorProspectus onEnterPortal={() => {
                setActiveRoom('weedstack');
                window.history.pushState({}, '', '?room=weedstack');
              }} />
            </motion.div>
          )}

          {activeRoom === 'stacklabs' && (
            <motion.div
              key="stacklabs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-screen relative z-[900] bg-slate-950"
            >
              <StackLabsHub onBackToPortal={() => {
                setActiveRoom('starter');
                window.history.pushState({}, '', '/');
              }} />
            </motion.div>
          )}

          {activeRoom === 'user_mgmt' && hasCreatorTools && (
            <motion.div
              key="user_mgmt"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh]"
            >
              <UserManagementConsole />
            </motion.div>
          )}

          {/* Phase 2: user_management — canonical portal card route */}
          {activeRoom === 'user_management' && hasCreatorTools && (
            <motion.div
              key="user_management"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh]"
            >
              <UserManagementConsole />
            </motion.div>
          )}

          {/* Phase 2: System Config Hub */}
          {activeRoom === 'system_config' && (
            <motion.div
              key="system_config"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh]"
            >
              <SystemConfigHub onNavigate={(room) => {
                if (room === 'cmdb') { setActiveDomain('CMDB'); return; }
                setActiveDomain('GLOBAL');
                setActiveRoom(room as any);
              }} />
            </motion.div>
          )}

          {activeRoom === 'portal_layout' && (
            <motion.div
              key="portal_layout"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh]"
            >
              <PortalLayoutConfig onClose={() => setActiveRoom('system_config')} />
            </motion.div>
          )}

          {activeRoom === 'sow' && (
            <motion.div
              key="sow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[80vh] w-[100vw] absolute inset-x-0 bottom-0 bg-[#0A0C10] z-50 overflow-hidden"
            >
              <ServiceOperationsWorkspace />
            </motion.div>
          )}

          {activeRoom === 'courier' && (
            <motion.div
              key="courier"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-[95vw] max-w-[1400px] mx-auto bg-transparent z-50"
            >
              <PayloadCourier />
            </motion.div>
          )}

          {activeRoom === 'savant_query' && (
            <motion.div
              key="savant_query"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden border border-[#22c55e]/30 shadow-lg relative"
            >
              <SavantQueryBlock />
            </motion.div>
          )}

          {activeRoom === 'roll_call' && (
            <motion.div
              key="roll_call"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <RollCallDashboard />
            </motion.div>
          )}
        </div>


      </main>
        </>
      )}
        </div>
      </div>
      {/* SOVEREIGN ORACLE (VOCAL MATRIX) MODAL */}
      <AnimatePresence>
        {isVocalMatrixOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-[100] w-[450px] bg-[#0A0C10]/95 backdrop-blur-xl border-2 border-[#38bdf8]/50 rounded-2xl  overflow-hidden flex flex-col"
          >
            <div className="flex flex-col border-b border-[#38bdf8]/20">
              <div className="flex items-center justify-between px-4 py-2 bg-[#38bdf8]/10">
                <span className="font-mono text-[10px] text-[#38bdf8] tracking-widest font-bold uppercase">Antigravity Vocal Matrix</span>
                <button onClick={() => setIsVocalMatrixOpen(false)} className="text-[#38bdf8] hover:text-white font-mono text-xs">✕</button>
              </div>
              <div className="flex items-center text-[10px] font-mono tracking-widest uppercase">
                <button 
                  onClick={() => setVmActiveTab('agent')} 
                  className={`flex-1 py-2 text-center transition-colors ${vmActiveTab === 'agent' ? 'bg-[#38bdf8]/20 text-white border-b-2 border-[#38bdf8]' : 'text-[#38bdf8]/50 hover:bg-white/5 hover:text-[#38bdf8]'}`}
                >
                  Guide
                </button>
                <button 
                  onClick={() => setVmActiveTab('commlink')} 
                  className={`flex-1 py-2 text-center transition-colors ${vmActiveTab === 'commlink' ? 'bg-[#38bdf8]/20 text-white border-b-2 border-[#38bdf8]' : 'text-[#38bdf8]/50 hover:bg-white/5 hover:text-[#38bdf8]'}`}
                >
                  Comm-Link
                </button>
                <button 
                  onClick={() => setVmActiveTab('settings')} 
                  className={`flex-1 py-2 text-center transition-colors ${vmActiveTab === 'settings' ? 'bg-[#38bdf8]/20 text-white border-b-2 border-[#38bdf8]' : 'text-[#38bdf8]/50 hover:bg-white/5 hover:text-[#38bdf8]'}`}
                >
                  Config
                </button>
              </div>
            </div>

            <div className="w-full h-[450px] overflow-hidden bg-black/20">
              {vmActiveTab === 'agent' && (
                <SovereignHelpAgent agentName={agentName} agentAvatar={agentAvatar} />
              )}
              {vmActiveTab === 'commlink' && (
                <iframe src={`/tts-proxy/tts_commlink.html?theme=${osTheme}`} className="w-full h-full border-0" title="Vocal Matrix" />
              )}
              {vmActiveTab === 'settings' && (
                <div className="p-6 h-full overflow-y-auto">
                  <h3 className="text-[#38bdf8] font-display uppercase tracking-widest mb-4">Agent Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-2">Display Name</label>
                      <input 
                        type="text" 
                        value={agentName}
                        onChange={(e) => {
                          setAgentName(e.target.value);
                          localStorage.setItem('sovereign_agent_name', e.target.value);
                        }}
                        className="w-full bg-black/50 border border-[#38bdf8]/30 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-2">Avatar URL Path</label>
                      <input 
                        type="text" 
                        value={agentAvatar}
                        onChange={(e) => {
                          setAgentAvatar(e.target.value);
                          localStorage.setItem('sovereign_agent_avatar', e.target.value);
                        }}
                        className="w-full bg-black/50 border border-[#38bdf8]/30 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
                      />
                      <p className="text-[9px] text-white/30 font-mono mt-1">Hint: e.g. /avatars/Sovereign_OS_Logo.jpg</p>
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-4">
                      <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-2">Pre-Installed Avatars</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['/avatars/Sovereign_OS_Logo.jpg', '/avatars/Jake_Taylor_6th.jpg'].map(path => (
                          <button 
                            key={path}
                            onClick={() => {
                              setAgentAvatar(path);
                              localStorage.setItem('sovereign_agent_avatar', path);
                            }}
                            className={`border ${agentAvatar === path ? 'border-[#38bdf8] ' : 'border-white/10'} rounded overflow-hidden aspect-square hover:border-[#38bdf8]/50 transition-colors`}
                          >
                            <img src={path} alt="Avatar option" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UMPIRE JAKE MODAL */}
      {isUmpireJakeOpen && (
        <UmpireJakeModal 
          onClose={() => setIsUmpireJakeOpen(false)} 
          globalBoggsOverride={globalRoomBoggsOverride}
        />
      )}

      {/* Hololink Receiver elements removed */}
    </div>
  );
}
