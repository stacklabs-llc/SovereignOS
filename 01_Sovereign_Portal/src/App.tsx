import React, { useState, useEffect, useRef } from "react";
import FanStackChat from "./components/FanStackChat";
import FanStackLive from "./components/FanStackLive";
import LiveAudioInterface from "./components/LiveAudioInterface";
import StarterShack from "./components/StarterShack";
import PegasusDreadnought from "./components/PegasusDreadnought";
import MobileRemote from "./components/MobileRemote";
import SovereignCinemaRemote from "./components/SovereignCinemaRemote";
import PersonaConsole from "./components/PersonaConsole";
import GodModeInjector from "./components/GodModeInjector";
import UhfStudio from "./components/UhfStudio";
import MobileHololink from "./components/MobileHololink";
import TvProjectionDashboard from "./components/TvProjectionDashboard";
import RoomConfigurator from "./components/RoomConfigurator";
import CaptureDeck from "./components/CaptureDeck";
import WatchPartyConsole from "./components/WatchPartyConsole";
import SovereignLogViewer from "./components/SovereignLogViewer";
import PlaycallDesk from "./components/PlaycallDesk";
import MlbScoreBar from "./components/MlbScoreBar";
import TheSkewStudio from "./components/TheSkewStudio";
import LiveChatSniper from "./components/LiveChatSniper";
import ShatcastVisionStudio from "./components/ShatcastVisionStudio";
import FactoryDashboard from "./components/FactoryDashboard";
import HoloDex from "./components/HoloDex";
import SovereignCmdb from "./components/SovereignCmdb";
import SovereignStudio from "./components/SovereignStudio";
import { HardwareTelemetryDashboard } from "./components/HardwareTelemetryDashboard";
import PromoInbox from "./components/PromoInbox";
import PixelDropZone from "./components/PixelDropZone";
import GlobalDropZone from "./components/GlobalDropZone";
import { getApiHost, getWsUrl } from "./api-host";
import KnowledgeHub from "./components/KnowledgeHub";
import ServiceOperationsWorkspace from "./components/ServiceOperationsWorkspace";
import { CypherCellModal } from "./components/CypherCellModal";
import { VocalMatrixPayload } from "./components/VocalMatrixPayload";
import HololinkHub from "./components/HololinkHub";
import PayloadCourier from "./components/PayloadCourier";
import SovereignHelpAgent from "./components/SovereignHelpAgent";
import UmpireJakeModal from "./components/UmpireJakeModal";
import avatarMap from "./avatarMap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { DownloadCloud, KeySquare, Lock, ShieldAlert, ChevronDown, ChevronRight } from "lucide-react";
import FanStackPortal from "./components/FanStackPortal";
import ArtifactGallery from "./components/ArtifactGallery";
import FanStackSandbox from "./components/FanStackSandbox";
import SavantQueryBlock from "./components/SavantQueryBlock";
import EdgeDvrConsole from "./components/EdgeDvrConsole";
import StreamSniperConsole from "./components/StreamSniperConsole";
import HighlightHeistConsole from "./components/HighlightHeistConsole";
import SovereignThemeLab from "./components/SovereignThemeLab";
import CliOperatorShell from "./components/CliOperatorShell";
import PgaAmenCornerLookBook from "./components/PgaAmenCornerLookBook";
import ArgusNexusConsole from "./components/ArgusNexusConsole";
import TMINewsDesk from "./components/TMINewsDesk";
import StoryboardGallery from "./components/StoryboardGallery";
import RollCallDashboard from "./components/RollCallDashboard";
import SovereignThemeManager from "./components/SovereignThemeManager";
import PersonaCenter from "./components/PersonaCenter";
import StackSeeder from "./components/StackSeeder";
import HateMailInbox from "./components/HateMailInbox";
import SmyrnaPlaycall from "./components/SmyrnaPlaycall";
import TownSimulation from "./components/TownSimulation";
import CatnipWarsGame from "./components/CatnipWarsGame";
import DeFiArbitrageSimulator from "./components/DeFiArbitrageSimulator";


import SovereignOsPortal from "./components/SovereignOsPortal";
import FanLobby from "./components/FanLobby";
import LivingKanbanBoard from "./components/LivingKanbanBoard";
import GlobalSystemBar from "./components/GlobalSystemBar";
import GlobalSearchWidget from "./components/GlobalSearchWidget";
import DreadnoughtConsole from "./components/DreadnoughtConsole";
import NewTicketModal from "./components/NewTicketModal";
import HotTakesConsole from "./components/HotTakesConsole";
import AdvocateCommandDeck from "./components/advocate-command-deck";
import ModelArena from "./components/ModelArena";
import OpticalIngestConsole from "./components/OpticalIngestConsole";
import { useAuth } from "./contexts/AuthContext";
import UserManagementConsole from "./components/UserManagementConsole";
import SystemConfigHub from "./components/SystemConfigHub";
import ActiveStacksGrid from "./components/ActiveStacksGrid";
import PowerToolsGrid from "./components/PowerToolsGrid";
import OnboardingWizard from "./components/OnboardingWizard";
import AppLayout from "./components/AppLayout";
import AssetBacklog from "./components/AssetBacklog";
import PortalLayoutConfig from "./components/PortalLayoutConfig";
import InteractiveCockpit from "./components/InteractiveCockpit";
import SysRulesPanel from "./components/SysRulesPanel";
import SysDocsPanel from "./components/SysDocsPanel";
import VoiceHeal from "./components/VoiceHeal";
import OracleGuardrailsConfig from "./components/OracleGuardrailsConfig";
import GardenStackDashboard from './components/GardenStackDashboard';
import InvestorProspectus from "./components/InvestorProspectus";
import MetsyAdventuresWorkspace from "./components/MetsyAdventuresWorkspace";
import PromptPreviewConsole from "./components/PromptPreviewConsole";
import { SovereignConfig } from "./config/SovereignConfig";

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
      sessionStorage.setItem("sov_auth", "unlocked");
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attempt = code.trim().toUpperCase();
    if (attempt === "SOV2026" || attempt === "METS2026" || attempt === "FLOW") {
      sessionStorage.setItem("sov_auth", "unlocked");
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

const getRoomTitle = (room: string) => {
  const titles: Record<string, string> = {
    starter: 'Command Center',
    app_directory: 'Stacks & Control',
    system_config: 'System Config',
    theme_manager: 'Theme Manager',
    portal_layout: 'Portal Layout',
    sys_rules: 'System Rules',
    sys_docs: 'System Docs',
    user_management: 'User Management',
    user_mgmt: 'User Management',
    sovereign_css: 'Sovereign CSS',
    oracle_guardrails: 'Oracle Guardrails',
    nexus_telemetry: 'Fleet Telemetry',
    cmdb: 'CMDB',
    stack_seeder: 'Stack Seeder',
    kanban: 'ITSM Kanban',
    argus_nexus: 'Argus Nexus',
    holodex: 'HoloDex',
    vocal_matrix: 'Vocal Matrix',
    savant_query: 'Savant Oracle',
    storyboard_deck: 'Storyboard Deck',
    highlight_heist: 'Universal Ingestor',
    presence: 'Telepresence Hub',
    voice: 'Voice Heal',
    town_simulation: 'Town Square',
    catnip_wars: 'Catnip Wars',
    prospectus: 'Investor Prospectus',
    hate_mail_inbox: 'Detractor Mailbag',
    data: 'Sovereign Studio'
  };
  return titles[room] || room;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"amen" | "stats" | "audit">("audit");
  const [isMeltingDown, setIsMeltingDown] = useState(false);
  const [leaderboard, setLeaderboard] = useState<string[]>([]);
  const [barPersonas, setBarPersonas] = useState<{ name: string }[]>([]);
  const [statusMsg, setStatusMsg] = useState("AWAITING STATCAST TELEMETRY...");
  const [eventName, setEventName] = useState("MLB FanStack");
  const [samSighting, setSamSighting] = useState(false);
  const [isVocalMatrixOpen, setIsVocalMatrixOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [vmActiveTab, setVmActiveTab] = useState<'agent' | 'commlink' | 'settings'>('agent');
  const [agentName, setAgentName] = useState(() => localStorage.getItem('sovereign_agent_name') || 'Sovereign Oracle');
  const [isUmpireJakeOpen, setIsUmpireJakeOpen] = useState(false);
  const [agentAvatar, setAgentAvatar] = useState(() => localStorage.getItem('sovereign_agent_avatar') || '/avatars/Sovereign_OS_Logo.jpg');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeStack, _setActiveStack] = useState<string | null>(() => localStorage.getItem('sovereign_active_stack'));
  const [stackUtilities, setStackUtilities] = useState<any[]>([]);

  const setActiveStack = (stack: string | null) => {
    if (stack) {
      localStorage.setItem('sovereign_active_stack', stack);
    } else {
      localStorage.removeItem('sovereign_active_stack');
    }
    _setActiveStack(stack);
  };

  useEffect(() => {
    const fetchUtilities = () => {
      if (!activeStack) {
        setStackUtilities([]);
        return;
      }
      fetch(`/api/public/stack_utilities/${activeStack}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setStackUtilities(data.utilities.filter((u: any) => u.active === 1));
          }
        })
        .catch(err => console.error('Error fetching stack utilities:', err));
    };

    fetchUtilities();

    window.addEventListener('stack_utilities_changed', fetchUtilities);
    return () => {
      window.removeEventListener('stack_utilities_changed', fetchUtilities);
    };
  }, [activeStack]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const [activeRoom, setActiveRoom] = useState<"starter" | "claude" | "auditor" | "void" | "data" | "pegasus" | "persona_console" | "uhf_studio" | "god_mode" | "rom_gallery" | "configurator" | "log_viewer" | "playcall_desk" | "tmi_news_desk" | "the_skew" | "shatcast_vision" | "persona_center" | "knowledge_hub" | "sow" | "courier" | "promo_inbox" | "nexus_telemetry" | "artifact_gallery" | "fanstack_sandbox" | "savant_query" | "vocal_matrix" | "storyboard_deck" | "holodex" | "holodex_matrix" | "tesseract_stage" | "edge_dvr" | "stream_sniper" | "highlight_heist" | "live_chat_sniper" | "sovereign_css" | "factory_dashboard" | "aether_vet" | "kanban" | "roll_call" | "dreadnought" | "theme_manager" | "argus_nexus" | "hot_takes" | "model_arena" | "optical_ingest" | "user_mgmt" | "portal_layout" | "pixel_dropzone" | "system_config" | "user_management" | "bistro" | "amen_corner" | "sys_rules" | "sys_docs" | "fan_lobby" | "wildseed" | "prospectus" | "stack_seeder" | "hate_mail_inbox" | "catnip_wars" | "town_simulation" | "cockpit" | "voice" | "post_genesis" | "app_directory" | "presence" | "oracle_guardrails" | "cmdb" | "asset_backlog" | "active_stacks" | "metsy_adventures" | "prompt_preview" | "power_tools" | "arbitrage_sim" | "shell">(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    if (pathname === '/shell' || pathname.startsWith('/shell/')) return "shell";
    let room = params.get('room');
    if (room === 'local_transcribe') room = 'stream_sniper';
    const validRooms = ["starter", "claude", "auditor", "void", "data", "pegasus", "persona_console", "uhf_studio", "god_mode", "rom_gallery", "configurator", "log_viewer", "playcall_desk", "tmi_news_desk", "the_skew", "shatcast_vision", "persona_center", "knowledge_hub", "sow", "courier", "promo_inbox", "nexus_telemetry", "artifact_gallery", "fanstack_sandbox", "savant_query", "vocal_matrix", "storyboard_deck", "holodex", "holodex_matrix", "tesseract_stage", "edge_dvr", "stream_sniper", "highlight_heist", "live_chat_sniper", "sovereign_css", "factory_dashboard", "aether_vet", "kanban", "roll_call", "dreadnought" , "theme_manager", "argus_nexus", "hot_takes", "model_arena", "optical_ingest", "portal_layout", "fan_lobby", "wildseed", "prospectus", "stack_seeder", "hate_mail_inbox", "catnip_wars", "town_simulation", "cockpit", "voice", "post_genesis", "app_directory", "presence", "oracle_guardrails", "cmdb", "sys_rules", "sys_docs", "system_config", "user_management", "user_mgmt", "bistro", "amen_corner", "asset_backlog", "active_stacks", "metsy_adventures", "prompt_preview", "power_tools", "arbitrage_sim", "shell"];
    if (room && validRooms.includes(room)) return room as any;
    
    // Fallback to last known room
    const lastRoom = localStorage.getItem('sovereign_last_known_room');
    if (lastRoom && lastRoom !== 'starter' && validRooms.includes(lastRoom)) return lastRoom as any;
    
    return "cockpit";
  });
  const [activeGamedayPk, setActiveGamedayPk] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameID') || params.get('gamePk') || null;
  });
  const [globalRoomBoggsOverride, setGlobalRoomBoggsOverride] = useState<string>(() => {
    return localStorage.getItem('sovereign_boggs_override') || 'None';
  });
  const [liveBoxScore, setLiveBoxScore] = useState<any>(null);
  const [dailyBriefing, setDailyBriefing] = useState<any>(null);
  const [envBadge, setEnvBadge] = useState<'PROD' | 'DEV' | 'UAT' | 'UNKNOWN'>('UNKNOWN');

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
  const [isMobileHololink, setIsMobileHololink] = useState(false);
  const [isTvProjection, setIsTvProjection] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [mlbSchedule, setMlbSchedule] = useState<{ date: string, game: string, opponent: string, gamePk?: number }[]>([]);
  const [fanstackTheme, setFanstackTheme] = useState<"synthwave" | "steamboat" | "pixel">("synthwave");
  const [osTheme, setOsTheme] = useState<string>(() => localStorage.getItem('sovereign_theme') || 'sovereign-home');
  const [accessLocale, setAccessLocale] = useState<"CIVILIAN" | "COMMAND">(() => (localStorage.getItem('sovereign_locale') as any) || "COMMAND");
  const auth = useAuth();
  const [layoutConfig, setLayoutConfig] = useState<any>(null);
  const [dashboardWidgetsActive, setDashboardWidgetsActive] = useState(true);
  const [isWidgetOverlayActive, setIsWidgetOverlayActive] = useState(true);

  useEffect(() => {
    const DEFAULT_LAYOUT = {
      theme: "sovereign-home",
      columns: {
        left: ["classy_martini"],
        center: [],
        right: ["messaging_app"]
      }
    };

    if (auth?.u_layout_configuration) {
      try {
        setLayoutConfig(JSON.parse(auth.u_layout_configuration));
      } catch (e) {
        console.error("Failed to parse u_layout_configuration:", e);
        setLayoutConfig(DEFAULT_LAYOUT);
      }
    } else if (auth) {
      setLayoutConfig(DEFAULT_LAYOUT);
    } else {
      setLayoutConfig(null);
    }
  }, [auth?.u_layout_configuration, auth]);

  const handleResetOnboarding = async () => {
    try {
      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: {} })
      });
      if (res.ok) {
        setLayoutConfig(null);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isFan = auth?.role === 'guest' || auth?.role === 'user';
  const hasCreatorTools = auth?.role === 'pilot' || auth?.role === 'creator';

  useEffect(() => {
    if (auth?.os_theme) {
      setOsTheme(auth.os_theme);
      localStorage.setItem('sovereign_theme', auth.os_theme);
    }
  }, [auth?.os_theme]);

  const [activeDomain, _setActiveDomain] = useState<"ROOT" | "PORTAL" | "MLB" | "NBA" | "NFL" | "PGA" | "SKEW" | "HOLODEX" | "GLOBAL" | "ARGUS" | "CMDB">(() => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain');
    const validDomains = ["ROOT", "PORTAL", "MLB", "NBA", "NFL", "PGA", "SKEW", "HOLODEX", "GLOBAL", "ARGUS", "CMDB"];
    if (domain && validDomains.includes(domain)) return domain as any;
    
    let room = params.get('room');
    if (room === 'local_transcribe') room = 'stream_sniper';
    if (room && room !== 'starter') {
      if (room === 'amen_corner') return 'PGA';
      if (['edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'optical_ingest', 'user_management', 'user_mgmt', 'system_config', 'portal_layout', 'sys_rules', 'sys_docs', 'stack_seeder', 'hate_mail_inbox', 'catnip_wars', 'town_simulation', 'voice', 'persona_center', 'nexus_telemetry', 'prospectus', 'wildseed', 'oracle_guardrails', 'asset_backlog', 'metsy_adventures', 'prompt_preview', 'vocal_matrix'].includes(room)) return 'GLOBAL';
      if (room === 'kanban' || room === 'cockpit' || room === 'pixel_dropzone' || room === 'app_directory') return 'ROOT';
      if (room === 'the_skew' || room === 'hot_takes') return 'SKEW';
      if (room === 'holodex' || room === 'holodex_matrix') return 'HOLODEX';
      if (room === 'argus_nexus') return 'ARGUS';
      if (room === 'cmdb') return 'CMDB';
      if (room === 'savant_query' || room === 'tmi_news_desk') return 'MLB';
      return 'MLB';
    }
    
    // Fallback to last known domain
    const lastDomain = localStorage.getItem('sovereign_last_known_domain');
    if (lastDomain && validDomains.includes(lastDomain)) return lastDomain as any;
    
    return "ROOT";
  });
  const setActiveDomain = (domain: "ROOT" | "PORTAL" | "MLB" | "NBA" | "NFL" | "PGA" | "SKEW" | "HOLODEX" | "GLOBAL" | "ARGUS" | "CMDB") => {
    _setActiveDomain(domain);
  };
  
  useEffect(() => {
    if (isFan) {
      // FanStack has been bifurcated to its own portal on port 3009.
      // Redirect any standard fan logins from the root portal over to the dedicated node.
      window.location.href = SovereignConfig.fanstack;
    }
  }, [isFan]);

  useEffect(() => {
    if (activeRoom === 'kanban' || (activeRoom as string) === 'sdlc' || activeRoom === 'sow') {
      setDashboardWidgetsActive(false);
      setIsWidgetOverlayActive(false);
    } else {
      setDashboardWidgetsActive(true);
      setIsWidgetOverlayActive(true);
    }
  }, [activeRoom]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'mac');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setActiveGamedayPk(ce.detail);
    };
    window.addEventListener('SetGamedayPk', handler);
    return () => window.removeEventListener('SetGamedayPk', handler);
  }, []);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const ce = e as CustomEvent;
      const { domain, room } = ce.detail;
      if (domain) setActiveDomain(domain);
      if (room) setActiveRoom(room);
    };
    window.addEventListener('NavigateRoom', handleNavigate);
    return () => window.removeEventListener('NavigateRoom', handleNavigate);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(true);

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
      const pathname = window.location.pathname;

      if (pathname === '/shell' || pathname.startsWith('/shell/')) {
        setActiveDomain('GLOBAL');
        setActiveRoom('shell');
        return;
      }
      const viewParam = params.get('view');
      if (viewParam === 'remote') {
        setIsMobileRemote(true);
        return;
      }
      if (viewParam === 'cinema_remote') {
        setIsCinemaRemote(true);
        return;
      }
      if (viewParam === 'mobile_hololink') {
        setIsMobileHololink(true);
        return;
      }
      if (viewParam === 'tv_projection') {
        setIsTvProjection(true);
        return;
      }

      const domainParam = params.get('domain');
      let roomParam = params.get('room');
      if (roomParam === 'local_transcribe') {
        roomParam = 'stream_sniper';
      }

      // If there's a specific room in the URL, let the room determine the routing, 
      // EXCEPT if the room is 'starter', where the domain parameter decides.
      if (roomParam && roomParam !== 'starter') {
        const validRooms = ['starter', 'claude', 'auditor', 'void', 'data', 'pegasus', 'persona_console', 'uhf_studio', 'god_mode', 'rom_gallery', 'configurator', 'log_viewer', 'playcall_desk', 'tmi_news_desk', 'the_skew', 'shatcast_vision', 'persona_center', 'knowledge_hub', 'sow', 'courier', 'promo_inbox', 'nexus_telemetry', 'amen_corner', 'artifact_gallery', 'fanstack_sandbox', 'savant_query', 'vocal_matrix', 'storyboard_deck', 'holodex', 'holodex_matrix', 'tesseract_stage', 'edge_dvr', 'stream_sniper', 'highlight_heist', 'live_chat_sniper', 'sovereign_css', 'factory_dashboard', 'aether_vet', 'roll_call', 'kanban', 'dreadnought', 'theme_manager', 'argus_nexus', 'model_arena', 'optical_ingest', 'user_management', 'user_mgmt', 'system_config', 'portal_layout', 'sys_rules', 'sys_docs', 'pixel_dropzone', 'fan_lobby', 'wildseed', 'prospectus', 'stack_seeder', 'hate_mail_inbox', 'catnip_wars', 'town_simulation', 'cockpit', 'voice', 'post_genesis', 'app_directory', 'presence', 'oracle_guardrails', 'cmdb', 'bistro', 'asset_backlog', 'metsy_adventures', 'prompt_preview', 'shell'];
        if (validRooms.includes(roomParam)) {
          setActiveRoom(roomParam as any);
          if (roomParam === 'amen_corner') {
            setActiveDomain('PGA');
          } else if (['edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 'dreadnought', 'theme_manager', 'model_arena', 'optical_ingest', 'user_management', 'user_mgmt', 'system_config', 'portal_layout', 'sys_rules', 'sys_docs', 'stack_seeder', 'hate_mail_inbox', 'catnip_wars', 'town_simulation', 'voice', 'persona_center', 'nexus_telemetry', 'prospectus', 'wildseed', 'oracle_guardrails', 'asset_backlog', 'data', 'metsy_adventures', 'tesseract_stage', 'prompt_preview', 'shell'].includes(roomParam)) {
            setActiveDomain('GLOBAL');
          } else if (roomParam === 'kanban' || roomParam === 'cockpit' || roomParam === 'pixel_dropzone' || roomParam === 'app_directory') {
            setActiveDomain('ROOT');
          } else if (roomParam === 'the_skew' || roomParam === 'hot_takes') {
            setActiveDomain('SKEW');
          } else if (roomParam === 'holodex' || roomParam === 'holodex_matrix') {
            setActiveDomain('HOLODEX');
          } else if (roomParam === 'argus_nexus') {
            setActiveDomain('ARGUS');
          } else if (roomParam === 'cmdb') {
            setActiveDomain('CMDB');
          } else if (roomParam === 'savant_query' || roomParam === 'tmi_news_desk') {
            setActiveDomain('MLB');
          } else {
            setActiveDomain('MLB');
          }
          return;
        }
      }

      // Fallback workspace retrieval
      const lastRoom = localStorage.getItem('sovereign_last_known_room');
      const lastDomain = localStorage.getItem('sovereign_last_known_domain');

      // If no specific room (or room is 'starter'), fallback to domain parameters
      if (domainParam === 'ROOT') {
        setActiveDomain('ROOT');
        if (roomParam === 'starter') {
          setActiveRoom('starter');
        } else {
          setActiveRoom(lastDomain === 'ROOT' && lastRoom && lastRoom !== 'starter' ? lastRoom as any : 'cockpit');
        }
        return;
      }
      if (domainParam === 'PORTAL') {
        setActiveDomain('PORTAL');
        setActiveRoom(roomParam === 'starter' ? 'starter' : 'starter');
        return;
      }
      if (domainParam === 'CMDB') {
        setActiveDomain('CMDB');
        if (roomParam === 'starter') {
          setActiveRoom('starter');
        } else {
          setActiveRoom(lastDomain === 'CMDB' && lastRoom && lastRoom !== 'starter' ? lastRoom as any : 'cmdb');
        }
        return;
      }
      if (domainParam === 'ARGUS') {
        setActiveDomain('ARGUS');
        if (roomParam === 'starter') {
          setActiveRoom('starter');
        } else {
          setActiveRoom(lastDomain === 'ARGUS' && lastRoom && lastRoom !== 'starter' ? lastRoom as any : 'argus_nexus');
        }
        return;
      }
      if (domainParam === 'MLB') {
        setActiveDomain('MLB');
        if (roomParam === 'starter') {
          setActiveRoom('starter');
        } else {
          setActiveRoom(lastDomain === 'MLB' && lastRoom && lastRoom !== 'starter' ? lastRoom as any : 'starter');
        }
        return;
      }
      if (domainParam === 'GLOBAL') {
        setActiveDomain('GLOBAL');
        if (roomParam === 'starter') {
          setActiveRoom('starter');
        } else {
          setActiveRoom(lastDomain === 'GLOBAL' && lastRoom && lastRoom !== 'starter' ? lastRoom as any : 'power_tools');
        }
        return;
      }

      // Default fallback
      if (lastRoom && lastRoom !== 'starter' && lastDomain) {
        setActiveDomain(lastDomain as any);
        setActiveRoom(lastRoom as any);
      } else {
        setActiveDomain('ROOT');
        setActiveRoom(roomParam === 'starter' ? 'starter' : 'cockpit');
      }
    };
    
    // Run on initial mount
    handleNavigation();
    
    // Run on browser back/forward buttons
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  useEffect(() => {
    if (isMobileRemote || isCinemaRemote || isMobileHololink || isTvProjection) return;
    const url = new URL(window.location.href);
    let title = "Sovereign OS";

    if (activeRoom === 'shell') {
      url.pathname = '/shell';
      url.searchParams.delete('room');
      url.searchParams.delete('domain');
      url.searchParams.delete('filter');
      title = "Sovereign OS | CLI Operator Shell";
    } else {
      if (url.pathname === '/shell') {
        url.pathname = '/';
      }
      if (activeDomain === 'ROOT' && (!activeRoom || activeRoom === 'cockpit')) {
        url.searchParams.delete('room');
        url.searchParams.delete('domain');
        url.searchParams.delete('filter');
        title = "Sovereign OS | Command Center";
      } else if (activeDomain === 'PORTAL') {
        url.searchParams.delete('room');
        url.searchParams.set('domain', 'PORTAL');
        title = "Sovereign OS | FanStack";
      } else if (activeDomain === 'CMDB') {
        url.searchParams.delete('room');
        url.searchParams.set('domain', 'CMDB');
        title = "Sovereign OS | CMDB Workspace";
      } else {
        url.searchParams.set('domain', activeDomain);
        url.searchParams.set('room', activeRoom);
        
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
          'model_arena': 'Model Arena',
          'stack_seeder': 'Stack Seeder',
          'catnip_wars': 'Catnip Wars Control Desk',
          'town_simulation': 'Town Square',
          'voice': 'Voice Heal',
          'shell': 'CLI Operator Shell'
        };
        
        const roomTitle = titles[activeRoom] || activeRoom.replace('_', ' ').toUpperCase();
        title = `Sovereign OS | ${roomTitle}`;
      }
    }

    document.title = title;

    if (url.searchParams.get('view') === 'remote') url.searchParams.delete('view');
    if (url.searchParams.get('view') === 'cinema_remote') url.searchParams.delete('view');
    if (url.searchParams.get('view') === 'mobile_hololink') url.searchParams.delete('view');
    window.history.replaceState({}, '', url);

    if (activeRoom && activeRoom !== 'starter') {
      localStorage.setItem('sovereign_last_known_room', activeRoom);
    }
    if (activeDomain) {
      localStorage.setItem('sovereign_last_known_domain', activeDomain);
    }
  }, [activeRoom, activeDomain, isMobileRemote, isCinemaRemote, isMobileHololink]);

  useEffect(() => {
    fetch("/personas.json")
      .then(res => res.json())
      .then(data => {
        const shuffled = data.sort(() => 0.5 - Math.random());
        setBarPersonas(shuffled.slice(0, 6));
      })
      .catch(err => console.error("Failed to load personas", err));

    fetch("/mlb_schedule_2026.json")
      .then(res => res.json())
      .then(data => {
        setMlbSchedule(data);
      })
      .catch(err => console.error("Failed to load MLB schedule", err));
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
        if (data.type === "TMI_ANOMALY") {
          const current = JSON.parse(localStorage.getItem('tmi_anomalies') || '[]');
          if (!current.find((a: any) => a.id === data.id)) {
            localStorage.setItem('tmi_anomalies', JSON.stringify([data, ...current]));
            window.dispatchEvent(new Event('tmi_anomalies_updated'));
          }
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
      // Ctrl+/ to toggle global search widget
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
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

  if (isMobileHololink) {
    return <MobileHololink />;
  }

  if (isTvProjection) {
    return <TvProjectionDashboard />;
  }

  // OnboardingWizard prerequisite check removed as requested.

  const isAdminOrRootRoom = ['starter', 'app_directory', 'system_config', 'theme_manager', 'portal_layout', 'sys_rules', 'sys_docs', 'user_management', 'user_mgmt', 'sovereign_css', 'oracle_guardrails', 'nexus_telemetry', 'cmdb', 'stack_seeder'].includes(activeRoom as string);

  return (
    <div className={`min-h-screen p-2 md:p-3 flex flex-col gap-2 transition-all duration-1000 bg-[#0B0E14] text-gray-200 selection:bg-[#3B82F6]/30 relative overflow-y-visible theme-${osTheme}`}>
      
      {envBadge === 'DEV' && (
        <div className="w-full bg-[#38bdf8] text-black font-bold text-center py-1 text-xs uppercase tracking-[0.3em] font-mono z-[9999] shadow-[0_0_15px_#38bdf8]">
          DEV ENVIRONMENT — SANDBOX
        </div>
      )}
      {envBadge === 'UAT' && (
        <div className="w-full bg-fuchsia-500 text-black font-bold text-center py-1 text-xs uppercase tracking-[0.3em] font-mono z-[9999] shadow-[0_0_15px_fuchsia]">
          UAT ENVIRONMENT — STAGING
        </div>
      )}

      {/* GLOBAL MATRIX NAVIGATOR */}
      {(activeRoom as string) !== 'the_skew' && (activeRoom as string) !== 'starter' && (
      <div className="w-full px-4 md:px-8 mx-auto flex flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-none items-center justify-between mt-2 mb-2 gap-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {hasCreatorTools && (activeRoom as string) !== 'post_genesis' && (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* OS Root */}
              <button 
                onClick={() => { 
                  setActiveDomain('ROOT'); 
                  setActiveRoom('cockpit'); 
                  window.history.pushState({}, '', '/'); 
                  window.dispatchEvent(new Event('os_root_clicked')); 
                }} 
                className={`flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-white/60 hover:text-[#38bdf8] transition-colors ${
                  activeDomain === 'ROOT' && (activeRoom as string) === 'starter' ? 'text-[#38bdf8] font-bold' : ''
                }`}
              >
                🏠 OS Root
              </button>

              {/* Admin / System Hub (if in system area) */}
              {isAdminOrRootRoom && (activeRoom as string) !== 'starter' && (
                <>
                  <ChevronRight size={12} className="text-white/20" />
                  <button 
                    onClick={() => { 
                      setActiveDomain('GLOBAL'); 
                      setActiveRoom('system_config'); 
                      window.history.pushState({}, '', '?domain=GLOBAL&room=system_config'); 
                    }}
                    className="font-mono text-xs uppercase tracking-wider text-white/60 hover:text-[#38bdf8] transition-colors"
                  >
                    ⚙️ Administrative Hub
                  </button>
                </>
              )}



              {/* Current View Breadcrumb */}
              {(activeRoom as string) !== 'starter' && (activeRoom as string) !== 'system_config' && (
                <>
                  <ChevronRight size={12} className="text-white/20" />
                  <span className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                    {getRoomTitle(activeRoom as string)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto md:ml-0">

          <div className="shrink-0 flex items-center">
            <GlobalSystemBar osTheme={osTheme} setOsTheme={setOsTheme} accessLocale={accessLocale} setAccessLocale={setAccessLocale} isVocalMatrixOpen={isVocalMatrixOpen} setIsVocalMatrixOpen={setIsVocalMatrixOpen} activeDomain={activeDomain} activeRoom={activeRoom} globalRoomBoggsOverride={globalRoomBoggsOverride} setGlobalRoomBoggsOverride={setGlobalRoomBoggsOverride} onNavigateRoom={(room) => { _setActiveDomain('GLOBAL'); setActiveRoom(room as any); }} onToggleSearch={() => setIsGlobalSearchOpen(prev => !prev)} />
          </div>
        </div>
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
      {layoutConfig ? (
        <AppLayout
          configuration={layoutConfig}
          onNavigate={(domain, room) => {
            if (domain) setActiveDomain(domain as any);
            if (room) setActiveRoom(room as any);
          }}
          activeRoom={activeRoom}
          onResetOnboarding={handleResetOnboarding}
          activeGamedayPk={activeGamedayPk}
        >
          {(activeRoom as string) !== 'starter' && (
            <div className="flex-1 flex flex-col w-full relative min-h-0">
              {activeRoom === 'claude' && <StarterShack />}
              {activeRoom === 'active_stacks' && <ActiveStacksGrid />}
              {activeRoom === 'arbitrage_sim' && <DeFiArbitrageSimulator />}
              {activeRoom === 'power_tools' && <PowerToolsGrid onNavigate={(domain, room) => {
                if (domain) setActiveDomain(domain as any);
                if (room) setActiveRoom(room as any);
              }} />}
              {activeRoom === 'artifact_gallery' && <ArtifactGallery />}
              {activeRoom === 'fanstack_sandbox' && <FanStackSandbox />}
              {activeRoom === 'model_arena' && <ModelArena />}
              {activeRoom === 'persona_center' && <PersonaCenter />}
              {activeRoom === 'knowledge_hub' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[75vh] w-full rounded-xl overflow-hidden"
                >
                  <KnowledgeHub />
                </motion.div>
              )}
              {activeRoom === 'user_management' || activeRoom === 'user_mgmt' ? (
                <UserManagementConsole />
              ) : activeRoom === 'system_config' || activeRoom === 'app_directory' ? (
                <SystemConfigHub 
                  initialTab={activeRoom === 'app_directory' ? 'services' : 'config'}
                  onNavigate={(room) => {
                    if (room === 'cmdb') { setActiveDomain('CMDB'); return; }
                    setActiveDomain('GLOBAL');
                    setActiveRoom(room as any);
                  }} 
                />
              ) : activeRoom === 'portal_layout' ? (
                <PortalLayoutConfig onClose={() => setActiveRoom('system_config')} />
              ) : activeRoom === 'wildseed' ? (
                <GardenStackDashboard onEnterPortal={() => {
                  setActiveRoom('cockpit');
                  setActiveDomain('ROOT');
                  window.history.pushState({}, '', '/');
                }} />
              ) : activeRoom === 'prospectus' ? (
                <InvestorProspectus 
                  onEnterPortal={() => {
                    setActiveRoom('wildseed');
                    window.history.pushState({}, '', '?room=wildseed');
                  }}
                  onEnterAetherVet={() => {
                    window.location.href = `${window.location.protocol}//${window.location.hostname}:8443/`;
                  }}
                  onEnterFanStack={() => {
                    window.open(SovereignConfig.fanstack, '_blank');
                  }}
                  onEnterSamTracker={() => {
                    window.open(SovereignConfig.samtracker + '?role=pilot', '_blank');
                  }}
                />
              ) : activeRoom === 'sow' ? (
                <ServiceOperationsWorkspace />
              ) : activeRoom === 'courier' ? (
                <PayloadCourier />
              ) : activeRoom === 'savant_query' ? (
                <SavantQueryBlock />
              ) : activeRoom === 'roll_call' ? (
                <RollCallDashboard />
              ) : activeRoom === 'theme_manager' ? (
                <SovereignThemeLab />
              ) : activeRoom === 'sovereign_css' ? (
                <SovereignThemeManager />
              ) : activeRoom === 'sys_rules' ? (
                <SysRulesPanel />
              ) : activeRoom === 'sys_docs' ? (
                <SysDocsPanel />
              ) : activeRoom === 'oracle_guardrails' ? (
                <OracleGuardrailsConfig />
              ) : activeRoom === 'nexus_telemetry' ? (
                <ArgusNexusConsole osTheme={osTheme} onBack={() => { setActiveRoom('starter'); }} />
              ) : activeRoom === 'vocal_matrix' ? (
                <div className="h-[calc(100vh-200px)] w-full rounded-xl overflow-hidden border border-slate-800">
                  <iframe src={`/tts-proxy/tts_commlink.html?theme=${osTheme}`} className="w-full h-full border-0" title="Vocal Matrix" />
                </div>
              ) : activeRoom === 'asset_backlog' ? (
                <AssetBacklog />
              ) : activeRoom === 'stack_seeder' ? (
                <StackSeeder />
              ) : activeRoom === 'metsy_adventures' ? (
                <MetsyAdventuresWorkspace />
              ) : activeRoom === 'prompt_preview' ? (
                <PromptPreviewConsole />
              ) : activeRoom === 'shell' ? (
                <CliOperatorShell />
              ) : activeRoom === 'optical_ingest' ? (
                <OpticalIngestConsole />
              ) : (activeRoom === 'holodex' || activeRoom === 'holodex_matrix') ? (
                <div className="min-h-[85vh] w-full rounded-xl border border-[#38bdf8]/30 flex flex-col">
                  <HoloDex />
                </div>
              ) : activeRoom === 'tesseract_stage' ? (
                <div className="min-h-[85vh] w-full rounded-xl border border-[#38bdf8]/30 flex flex-col overflow-hidden bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.15)] relative">
                  <iframe
                    src="/tesseract-stack/"
                    className="w-full flex-grow border-0 min-h-[750px]"
                    title="4D Tesseract Baseball Card"
                    allow="autoplay; fullscreen"
                  />
                </div>
              ) : activeRoom === 'persona_console' ? (
                <PersonaConsole />
              ) : activeRoom === 'edge_dvr' ? (
                <motion.div
                  key="edge_dvr"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full rounded-xl overflow-hidden border border-[#ff0033]/30"
                >
                  <EdgeDvrConsole />
                </motion.div>
              ) : activeRoom === 'stream_sniper' ? (
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
              ) : activeRoom === 'highlight_heist' ? (
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
              ) : (activeRoom === 'kanban' || (activeRoom as string) === 'sdlc') && !dashboardWidgetsActive ? (
                <div className="h-[calc(100vh-64px)] w-full rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
                  <LivingKanbanBoard onNewTicket={() => setIsTicketModalOpen(true)} />
                  <NewTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
                </div>
              ) : activeRoom === 'pixel_dropzone' ? (
                <div className="cardboard-panel-dark p-6 min-h-[550px] cardboard-texture-dark crt-scanlines border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                  <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2">
                    <div>
                      <h2 className="text-xl font-mono text-cyan-400 flex items-center gap-2">
                        <span className="text-cyan-500 animate-pulse">☁️</span> PIXEL DROP ZONE INGRESS
                      </h2>
                      <p className="text-xs text-slate-400 font-mono">Secure Core Storage Staging Pipeline</p>
                    </div>
                    <div className="text-xs font-mono bg-cyan-950/40 text-cyan-400 px-3 py-1 rounded border border-cyan-800/30">
                      STAGING: /home/james/sovereign_inbox/
                    </div>
                  </div>
                  <GlobalDropZone />
                </div>
              ) : activeRoom === 'data' ? (
                <SovereignStudio />
              ) : activeRoom === 'amen_corner' ? (
                <PgaAmenCornerLookBook />
              ) : activeRoom === 'cmdb' || activeDomain === 'CMDB' ? (
                <SovereignCmdb />
              ) : activeRoom === 'cockpit' ? (
                <div className="h-full w-full min-h-[80vh] flex flex-col items-center justify-start p-4 bg-[#09090e] overflow-y-auto no-scrollbar rounded-xl">
                  <InteractiveCockpit onNavigate={(room) => {
                    if (room === 'wildseed') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('wildseed');
                    } else if (room === 'aether_vet') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('aether_vet');
                    } else if (room === 'log_viewer') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('log_viewer');
                    } else if (room === 'system_config') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('system_config');
                    } else if (room === 'starter') {
                      _setActiveDomain('ROOT');
                      setActiveRoom('starter');
                    } else if (room === 'live_chat_sniper') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('live_chat_sniper');
                    } else if (room === 'uhf_studio') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('uhf_studio');
                    } else if (room === 'nexus_telemetry') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('nexus_telemetry');
                    } else if (room === 'user_management') {
                      _setActiveDomain('GLOBAL');
                      setActiveRoom('user_management');
                    }
                  }} />
                </div>
              ) : (
                <div className="p-4 text-xs font-mono text-white/50">
                  Interactive Dashboard widgets are active for this workspace. Use the Left Sidebar to navigate or configuration controls to customize.
                </div>
              )}
            </div>
          )}
        </AppLayout>
      ) : activeRoom === 'fan_lobby' ? (
        <FanLobby 
          activeGamedayPk={activeGamedayPk}
          onSelectGame={(pk) => {
            setActiveGamedayPk(pk);
            setActiveRoom('playcall_desk');
            setActiveDomain('MLB');
            window.history.pushState({}, '', '?domain=MLB&room=playcall_desk');
          }}
        />
      ) : activeDomain === 'CMDB' ? (
        <SovereignCmdb />
      ) : activeRoom === 'pixel_dropzone' ? (
        <div className="cardboard-panel-dark p-6 min-h-[550px] cardboard-texture-dark crt-scanlines border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(0,212,255,0.1)] animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2">
            <div>
              <h2 className="text-xl font-mono text-cyan-400 flex items-center gap-2">
                <span className="text-cyan-500 animate-pulse">☁️</span> PIXEL DROP ZONE INGRESS
              </h2>
              <p className="text-xs text-slate-400 font-mono">Secure Core Storage Staging Pipeline</p>
            </div>
            <div className="text-xs font-mono bg-cyan-950/40 text-cyan-400 px-3 py-1 rounded border border-cyan-800/30">
              STAGING: /home/james/sovereign_inbox/
            </div>
          </div>
          <GlobalDropZone />
        </div>
      ) : activeDomain === 'ROOT' && (activeRoom === 'starter') ? (
        <SovereignOsPortal 
          initialView="main"
          onNavigate={(domain, room) => {
            if (domain === 'CMDB') {
              setActiveDomain('CMDB');
              return;
            }
            setActiveDomain(domain);
            if (room) {
              const globalRooms = [
                'edge_dvr', 'stream_sniper', 'highlight_heist', 'sovereign_css', 'sow', 
                'dreadnought', 'theme_manager', 'model_arena', 'user_management', 'user_mgmt',
                'system_config', 'portal_layout', 'sys_rules', 'sys_docs', 'stack_seeder', 'hate_mail_inbox', 
                'catnip_wars', 'town_simulation', 'voice', 'persona_center', 'nexus_telemetry'
              ];
              if (globalRooms.includes(room)) {
                setActiveDomain('GLOBAL');
              } else if (room === 'kanban') {
                setActiveDomain('ROOT');
              }
              setActiveRoom(room as any);
            }
          }} 
        />
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
          else if (domain === 'PERSONA_CENTER' as any) { setActiveDomain('GLOBAL'); setActiveRoom('persona_center'); }
          else if (domain === 'SAVANT') { setActiveDomain('MLB'); setActiveRoom('savant_query'); }
          else if (domain === 'VOCAL') { setActiveDomain('GLOBAL'); setActiveRoom('vocal_matrix'); }
          else if (domain === 'SOVEREIGN_CSS') { setActiveDomain('GLOBAL'); setActiveRoom('sovereign_css'); }
          else if (domain === 'KANBAN') { setActiveDomain('GLOBAL'); setActiveRoom('kanban'); }
          else if (domain === 'ROLL_CALL') { setActiveDomain('GLOBAL'); setActiveRoom('roll_call'); }
          else if (domain === 'DREADNOUGHT' as any) { setActiveDomain('GLOBAL'); setActiveRoom('dreadnought'); }
          else if (domain === 'HOT_TAKES' as any) { setActiveDomain('SKEW'); setActiveRoom('hot_takes'); }
          else if (domain === 'MODEL_ARENA' as any) { setActiveDomain('GLOBAL'); setActiveRoom('model_arena'); }
          else if (domain === 'PROMO_INBOX' as any) { setActiveDomain('GLOBAL'); setActiveRoom('promo_inbox'); }
          else if (domain === 'TMI_NEWS_DESK' as any) { setActiveDomain('MLB'); setActiveRoom('tmi_news_desk'); }
          else {
            alert(`The ${domain} matrix is currently locked offline. Reverting to MLB Command Center.`);
            setActiveDomain('MLB');
            setActiveRoom('starter');
          }
        }} />
      ) : activeDomain === 'ARGUS' ? (
        <ArgusNexusConsole osTheme={osTheme} onBack={() => { setActiveDomain('PORTAL'); window.history.pushState({}, '', '?domain=PORTAL'); }} />
      ) : (
        <>

      {activeRoom !== 'rom_gallery' && activeRoom !== 'the_skew' && activeRoom !== 'kanban' && activeRoom !== 'sow' && activeRoom !== 'system_config' && activeRoom !== 'user_management' && activeRoom !== 'user_mgmt' && activeRoom !== 'bistro' && (activeRoom as string) !== 'stack_seeder' && activeRoom !== 'hate_mail_inbox' && activeRoom !== 'catnip_wars' && activeRoom !== 'town_simulation' && activeRoom !== 'voice' && activeRoom !== 'data' && (
        <header className="flex flex-col items-center justify-center mb-1">
          <h1 className={`text-center m-0 drop-shadow-lg ${activeRoom === 'savant_query' ? 'text-3xl md:text-4xl font-display font-bold uppercase tracking-wider text-white' :
              activeRoom === 'starter' || activeRoom === 'playcall_desk' ? 'text-3xl md:text-4xl vm-header vm-accent-glow font-bold pb-1 tracking-wide' :
                activeRoom === 'amen_corner' ? 'text-3xl md:text-4xl font-serif font-bold text-[#E0BC68] tracking-widest uppercase' :
                'text-3xl md:text-4xl font-display font-bold text-slate-100 tracking-[0.25em] uppercase'
            }`}>
            {activeRoom === 'starter' ? "The Command Center" : activeRoom === 'pegasus' ? "Pegasus Matrix" : activeRoom === 'uhf_studio' ? "UHF Studio" : activeRoom === 'holodex' ? "Sovereign HoloDex" : activeRoom === 'shatcast_vision' ? "Shatcast Vision Matrix" : activeRoom === 'log_viewer' ? "CSV Ingestion Engine" : activeRoom === 'playcall_desk' ? "Playcall Desk" : activeRoom === 'persona_console' ? "FanStack Service Portal" : activeRoom === 'auditor' ? "Umpire's Review" : activeRoom === 'persona_center' ? "Advocate Center" : activeRoom === "knowledge_hub" ? "Knowledge Hub" : activeRoom === "courier" ? "Agent Courier" : activeRoom === "promo_inbox" ? "The Cosmic Sieve" : activeRoom === "nexus_telemetry" ? "Nexus Telemetry" : activeRoom === "artifact_gallery" ? "Media Vault Matrix" : activeRoom === "vocal_matrix" ? "Vocal Matrix" : activeRoom === "storyboard_deck" ? "Storyboard Deck" : activeRoom === "fanstack_sandbox" ? "FanStack Sandbox" : activeRoom === "savant_query" ? "Savant Oracle" : activeRoom === "amen_corner" ? "Amen Corner (PGA)" : activeRoom === "factory_dashboard" ? "Flowmercial Factory" : activeRoom === "aether_vet" ? "Aether Vet Telemetry" : activeRoom === "model_arena" ? "Model Battle Arena" : activeRoom === "optical_ingest" ? "Optical Ingest Console" : (activeRoom as string) === "user_mgmt" ? "User Management" : ""}
          </h1>
        </header>
      )}

      <main className="flex-1 w-full px-4 md:px-8 mx-auto relative overflow-y-visible flex flex-col min-h-0">
        {activeDomain === 'MLB' && activeRoom === 'starter' && <MlbScoreBar activeGamedayPk={activeGamedayPk} onSelectGame={setActiveGamedayPk} />}
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

          {activeRoom === 'persona_center' && (
            <motion.div
              key="persona_center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full overflow-y-auto relative z-[900] pb-24"
            >
              <PersonaCenter />
            </motion.div>
          )}

          {activeRoom === 'hate_mail_inbox' && (
            <motion.div
              key="hate_mail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full overflow-y-auto relative z-[900] pb-24"
            >
              <HateMailInbox />
            </motion.div>
          )}

          {activeRoom === 'catnip_wars' && (
            <motion.div
              key="catnip_wars"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full overflow-y-auto relative z-[900] pb-24"
            >
              <CatnipWarsGame />
            </motion.div>
          )}

          {activeRoom === 'town_simulation' && (
            <motion.div
              key="town_simulation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden shadow-2xl relative flex-1 min-h-0"
            >
              <TownSimulation />
            </motion.div>
          )}

          {activeRoom === 'starter' && (
            <motion.div
              key="starter"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className={`grid ${activeGamedayPk ? 'grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[80vh] p-4 bg-[#0a0c10]' : 'grid-cols-1 gap-0 w-full bg-white relative rounded-xl overflow-hidden shadow-2xl h-full min-h-0'}`}
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
                    <div className="lg:col-span-8 flex flex-col group cursor-pointer min-h-0 h-full" onClick={() => dailyBriefing?.hero?.link && window.open(dailyBriefing.hero.link, '_blank')}>
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
                    <div className="lg:col-span-4 flex flex-col min-h-0 h-full">
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

          {activeRoom === 'persona_console' && (
            <motion.div
              key="persona"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="h-full w-full border border-[#E0BC68]/30 rounded overflow-hidden"
            >
              <PersonaConsole />
            </motion.div>
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
              <AdvocateCommandDeck />
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

          {activeRoom === 'sys_docs' && (
            <motion.div
              key="sys_docs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[85vh] w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <SysDocsPanel />
            </motion.div>
          )}

          {activeRoom === 'stack_seeder' && (
            <motion.div
              key="stack_seeder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <StackSeeder />
            </motion.div>
          )}

          {activeRoom === 'oracle_guardrails' && (
            <motion.div
              key="oracle_guardrails"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <OracleGuardrailsConfig />
            </motion.div>
          )}

          {activeRoom === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-xl overflow-hidden shadow-2xl relative"
            >
              <VoiceHeal />
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
              className="h-[calc(100vh-160px)] w-full rounded-xl overflow-hidden"
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
              className="w-full h-[80vh] flex flex-col"
            >
              <PgaAmenCornerLookBook />
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
              className="h-[calc(100vh-64px)] w-full rounded-xl overflow-hidden shadow-2xl border border-white/5 relative"
            >
              <LivingKanbanBoard onNewTicket={() => setIsTicketModalOpen(true)} />
              <NewTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
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

          {activeRoom === 'wildseed' && (
            <motion.div
              key="wildseed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full overflow-y-auto relative z-[900] pb-24"
            >
              <GardenStackDashboard onEnterPortal={() => {
                setActiveRoom('cockpit');
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
              className="w-full h-full overflow-y-auto relative z-[900] pb-24"
            >
              <InvestorProspectus 
                onEnterPortal={() => {
                  setActiveRoom('wildseed');
                  window.history.pushState({}, '', '?room=wildseed');
                }}
                onEnterAetherVet={() => {
                  window.location.href = `${window.location.protocol}//${window.location.hostname}:8443/`;
                }}
                onEnterFanStack={() => {
                  window.open(SovereignConfig.fanstack, '_blank');
                }}
                onEnterSamTracker={() => {
                  window.open(SovereignConfig.samtracker + '?role=pilot', '_blank');
                }}
              />
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

          {activeRoom === 'cockpit' && (
            <motion.div
              key="cockpit"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh] flex flex-col items-center justify-start p-4 bg-[#09090e] overflow-y-auto no-scrollbar"
            >
              <InteractiveCockpit onNavigate={(room) => {
                if (room === 'wildseed') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('wildseed');
                } else if (room === 'aether_vet') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('aether_vet');
                } else if (room === 'log_viewer') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('log_viewer');
                } else if (room === 'system_config') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('system_config');
                } else if (room === 'starter') {
                  _setActiveDomain('ROOT');
                  setActiveRoom('starter');
                } else if (room === 'live_chat_sniper') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('live_chat_sniper');
                } else if (room === 'uhf_studio') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('uhf_studio');
                } else if (room === 'nexus_telemetry') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('nexus_telemetry');
                } else if (room === 'user_management') {
                  _setActiveDomain('GLOBAL');
                  setActiveRoom('user_management');
                }
              }} />
            </motion.div>
          )}

          {/* Phase 2: Unified Administrative Hub (System Config & Control) */}
          {(activeRoom === 'system_config' || activeRoom === 'app_directory') && (
            <motion.div
              key="admin_hub"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full min-h-[80vh]"
            >
              <SystemConfigHub 
                initialTab={activeRoom === 'app_directory' ? 'services' : 'config'}
                onNavigate={(room) => {
                  if (room === 'cmdb') { setActiveDomain('CMDB'); return; }
                  setActiveDomain('GLOBAL');
                  setActiveRoom(room as any);
                }} 
              />
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

      {/* HOLOLINK RECEIVER */}
      <HololinkHub user={auth} wsRelayUrl="/ws-relay" />

      {/* GLOBAL SEARCH WIDGET OVERLAY */}
      <GlobalSearchWidget 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setIsGlobalSearchOpen(false)} 
      />
    </div>
  );
}
