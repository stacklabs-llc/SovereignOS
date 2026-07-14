import React, { useState, useEffect, useRef } from 'react';
import avatarMap from '../avatarMap';
import HoloDexApp from './HoloDex/HoloDexApp';
import { 
  Volume2, 
  Cpu, 
  Play, 
  Upload, 
  RefreshCw, 
  FileCheck, 
  AlertTriangle,
  Radio,
  Sliders,
  Power,
  Send,
  Zap,
  BookOpen
} from 'lucide-react';

const API_PORT = "8096";
const WS_PORT = "8000";

interface WebslingerEvent {
  id: number;
  event_name: string;
  payload_template: string;
  default_duration_ms: number;
  active_status: number;
}

const NARRATIVE_TEMPLATES = [
  {
    title: "🔥 Bullpen Meltdown",
    description: "Pitchers struggling, high stress.",
    prompt: "The bullpen is collapsing. Stress levels are maxed. Heckle or defend the relief pitchers' structural integrity."
  },
  {
    title: "⚾ Umpire Outrage",
    description: "Horrible strike zone calls.",
    prompt: "The home plate umpire just called a pitch 6 inches outside a strike. Outrage is brewing. React with maximum fury."
  },
  {
    title: "🍕 Midnight Pizza Party",
    description: "Rain delay fatigue, fans demand snacks.",
    prompt: "A rain delay has lasted 2 hours. Fans are exhausted, looking for Smyrna cantina cantrip canticles and local snacks."
  },
  {
    title: "🪄 Mets Magic Anomaly",
    description: "Historic comeback is underway.",
    prompt: "An unbelievable Mets rally in the bottom of the 9th. Absolute magic and chaos in the stands."
  }
];

export default function PlaycallDeskConsolidated() {
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState('dot');
    const [messages, setMessages] = useState<any[]>([{ type: 'system', author: 'SOVEREIGN', text: 'Consolidated Playcall Desk Online. Integrated into FanStack.', id: Date.now() }]);
    const [boggsLevel, setBoggsLevel] = useState(2);
    const [activeTab, setActiveTab] = useState('events');
    const [games, setGames] = useState<any[]>([]);
    const [rawGames, setRawGames] = useState<any[]>([]);
    const [selectedGame, setSelectedGame] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [mardConnected, setMardConnected] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [selectedLeaderboardPersona, setSelectedLeaderboardPersona] = useState<string | null>(null);
    const [personaDetail, setPersonaDetail] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showSeasonStats, setShowSeasonStats] = useState(false);
    const [seasonStats, setSeasonStats] = useState<any[]>([]);
    
    const [broadcastInput, setBroadcastInput] = useState('');
    const [promptInput, setPromptInput] = useState('');
    const [contextInput, setContextInput] = useState('');
    const [hotTakeTopic, setHotTakeTopic] = useState('');
    const [takePersona, setTakePersona] = useState('');
    
    const [mardEngine, setMardEngine] = useState(true);
    const [mardChaos, setMardChaos] = useState(true);
    const [barfCypher, setBarfCypher] = useState(false);
    const [simSpeed, setSimSpeed] = useState('1.0');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tmiModalOpen, setTmiModalOpen] = useState(false);
    const [tmiScenarios, setTmiScenarios] = useState<any[]>([]);
    const [editForm, setEditForm] = useState<any>({});
    const [penaltyBox, setPenaltyBox] = useState<{persona: string, text: string, avatar: string|null, history: string[]} | null>(null);
    const [selectedSwitchboardChannel, setSelectedSwitchboardChannel] = useState<'FACTION' | 'TWITTER' | 'WEB_COMMENT'>('FACTION');
    const [selectedSwitchboardTarget, setSelectedSwitchboardTarget] = useState<string>('');
    const [switchboardLog, setSwitchboardLog] = useState<string>('SWITCHBOARD ONLINE — BARE-METAL PORT GREEN');

    // Role-based Status Badge State
    const [directorState, setDirectorState] = useState<'online' | 'override' | 'dormant'>('dormant');
    const lastCreatorActivityRef = useRef<number>(0);

    // Condition Builder & Rules State
    const [rules, setRules] = useState<any[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [ruleName, setRuleName] = useState('');
    const [telemetryKey, setTelemetryKey] = useState('pitch_speed');
    const [operator, setOperator] = useState('>');
    const [ruleValue, setRuleValue] = useState('');
    const [actionType, setActionType] = useState('spidey_wipe');

    // Webslinger Events
    const [events, setEvents] = useState<WebslingerEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Media upload states
    const [dragging, setDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');

    // Ingress panel states
    const [ingressTarget, setIngressTarget] = useState<string>('GLOBAL');
    const [ingressText, setIngressText] = useState<string>('');

    const handleSendIngress = () => {
        if (!ingressText.trim()) return;
        if (ingressTarget === 'GLOBAL') {
            addMsg('system', 'SOVEREIGN', 'Global Ingress Broadcast: "' + ingressText + '"');
            if(wsRef.current && wsRef.current.readyState === 1) {
                wsRef.current.send(JSON.stringify({ 
                    type: 'update_context', 
                    text: ingressText, 
                    target_game_pk: selectedGame 
                }));
            }
        } else {
            addMsg('system', 'SOVEREIGN', `Targeted Ingress to ${ingressTarget.toUpperCase()}: "${ingressText}"`);
            if(wsRef.current && wsRef.current.readyState === 1) {
                wsRef.current.send(JSON.stringify({ 
                    type: 'custom_prompt', 
                    persona: ingressTarget, 
                    prompt: ingressText, 
                    target_game_pk: selectedGame 
                }));
            }
        }
        setIngressText('');
    };

    const openEditModal = (p?: any) => {
        if (p) setEditForm({ ...p });
        else setEditForm({ name: '', desc: '', team: 'GLOBAL', room: 'GLOBAL', engine: 'gemini-flash', boggs: 'medium', cadence: 'pacer', prompt: '' });
        setIsModalOpen(true);
    };

    const savePersonaForm = async () => {
        try {
            if (editForm.sys_id) {
                try {
                    await fetch(`${getApiHost()}/api/now/table/sys_user/${editForm.sys_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: editForm.desc,
                            introduction: editForm.prompt
                        })
                    });
                } catch(err) { console.warn("sys_user parity sync skipped.", err); }
                
                await fetch(`${getApiHost()}/api/personas/${editForm.sys_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deployment_zone: editForm.room,
                        system_prompt: editForm.prompt
                    })
                });
            } else {
                await fetch(`${getApiHost()}/api/personas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: editForm.name,
                        team: editForm.team || 'GLOBAL',
                        deployment_zone: editForm.room || 'GLOBAL',
                        boggs_reactivity: editForm.boggs || 'medium',
                        cadence: editForm.cadence || 'pacer',
                        system_prompt: editForm.prompt || editForm.desc,
                        status: 1
                    })
                });
            }
            setIsModalOpen(false);
            initPersonas();
            if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ action: 'SYNC_DB_PERSONAS' }));
        } catch (e) {}
    };
    
    const wsRef = useRef<WebSocket | null>(null);
    const mardWsRef = useRef<WebSocket | null>(null);
    const feedRef = useRef<HTMLDivElement>(null);

    const getApiHost = () => import.meta.env.VITE_API_HOST || "";
    const getOldApiHost = () => import.meta.env.VITE_API_HOST || "";

    const fetchPersonaDetail = async (username: string) => {
        try {
            setSelectedLeaderboardPersona(username);
            setIsDrawerOpen(true);
            setShowSeasonStats(false);
            setPersonaDetail(null);
            setSeasonStats([]);
            
            const res = await fetch(`/api/burn-book/persona/${username}`);
            if (res.ok) {
                const data = await res.json();
                setPersonaDetail(data);
            }
        } catch(e) {
            console.error("Failed to fetch persona detail", e);
        }
    };

    const fetchSeasonStats = async (username: string) => {
        try {
            setShowSeasonStats(true);
            const res = await fetch(`/api/burn-book/history?persona=${username}`);
            if (res.ok) {
                const data = await res.json();
                if (data.history) {
                    setSeasonStats(data.history);
                }
            }
        } catch(e) {
            console.error("Failed to fetch season stats", e);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/admin/burn_leaderboard`);
            const data = await res.json();
            if (data.status === 'success') {
                setLeaderboardData(data.leaderboard);
            }
        } catch(e) {}
    };

    const fetchOverlayRules = async () => {
        setLoadingRules(true);
        try {
            const res = await fetch('/api/sys_overlay_registry');
            if (res.ok) {
                const data = await res.json();
                if (data && data.status === 'success') {
                    setRules(data.rules || []);
                }
            }
        } catch (e) {
            console.error('Failed to fetch overlay rules', e);
        } finally {
            setLoadingRules(false);
        }
    };

    const fetchWebslingerEvents = async () => {
        setLoadingEvents(true);
        try {
            const res = await fetch('/api/webslinger_events');
            if (res.ok) {
                const data = await res.json();
                if (data && data.status === 'success') {
                    setEvents(data.events || []);
                }
            }
        } catch (e) {
            console.error('Failed to fetch webslinger events', e);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'builder') {
            fetchOverlayRules();
        }
        if (activeTab === 'events' || activeTab === 'builder') {
            fetchWebslingerEvents();
        }
    }, [activeTab]);

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleName.trim() || !ruleValue.trim()) {
            alert('Please fill in all fields.');
            return;
        }

        const triggerCondition = JSON.stringify({
            key: telemetryKey,
            operator: operator,
            value: ruleValue
        });

        const overlayAction = JSON.stringify({
            type: actionType.toUpperCase(),
            duration_ms: 3000
        });

        try {
            const res = await fetch('/api/sys_overlay_registry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rule_name: ruleName,
                    trigger_condition: triggerCondition,
                    overlay_action: overlayAction,
                    active: 1
                })
            });
            const data = await res.json();

            if (data && data.status === 'success') {
                setRuleName('');
                setRuleValue('');
                fetchOverlayRules();
            }
        } catch (e) {
            console.error('Failed to save rule', e);
            alert('Failed to save rule.');
        }
    };

    const handleDeleteRule = async (sysId: string) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await fetch(`/api/sys_overlay_registry/${sysId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data && data.status === 'success') {
                fetchOverlayRules();
            }
        } catch (e) {
            console.error('Failed to delete rule', e);
            alert('Failed to delete rule.');
        }
    };

    const sendControlEvent = (event: string) => {
        addMsg('system', 'SOVEREIGN', `Dispatched Control Command: ${event}`);
        if (wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify({
                type: 'trigger_event',
                event: event.toLowerCase(),
                target_game_pk: selectedGame || 'GLOBAL'
            }));
        }
    };

    useEffect(() => {
        initPersonas();
        initGames();
        initTmiScenarios();
        connectWS();
        connectMardWS();
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        const gamesInterval = setInterval(initGames, 15000);

        // Director Status Auto-decay Loop
        const directorInterval = setInterval(() => {
            setDirectorState(current => {
                if (current === 'online' && (Date.now() - lastCreatorActivityRef.current > 15000)) {
                    return 'dormant';
                }
                return current;
            });
        }, 1000);

        return () => { 
            wsRef.current?.close(); 
            mardWsRef.current?.close();
            clearInterval(interval);
            clearInterval(gamesInterval);
            clearInterval(directorInterval);
        };
    }, []);

    const initTmiScenarios = async () => {
        try {
            const res = await fetch(`${getApiHost()}/api/now/table/cmdb_ci_tmi_scenario`);
            if (res.ok) {
                const data = await res.json();
                if (data.result && Array.isArray(data.result)) {
                    setTmiScenarios(data.result);
                } else if (Array.isArray(data)) {
                    setTmiScenarios(data);
                }
            }
        } catch(e) { console.error("Failed to load TMI scenarios"); }
    };

    const isNearBottomRef = useRef(true);

    const handleScroll = () => {
        if (feedRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
            isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
        }
    };

    useEffect(() => {
        if (feedRef.current) {
            if (isNearBottomRef.current || messages.length <= 1) {
                feedRef.current.scrollTop = feedRef.current.scrollHeight;
            }
        }
    }, [messages]);

    const initPersonas = async () => {
        try {
            const res = await fetch(`${getApiHost()}/api/personas`);
            if (res.ok) {
                const data = await res.json();
                if(data.personas) {
                    setPersonas(data.personas.map((r: any) => ({
                        id: r.name,
                        sys_id: r.sys_id,
                        name: r.name,
                        desc: r.team || '',
                        team: r.team,
                        room: r.deployment_zone || 'BENCHED',
                        boggs: r.boggs_reactivity,
                        prompt: r.system_prompt,
                        cadence: r.cadence,
                        active: r.operational_status === 1
                    })));
                    return;
                }
            }
            fallbackPersonas();
        } catch(e) {
            fallbackPersonas();
        }
    };

    const fallbackPersonas = async () => {
        try {
            const res = await fetch(`${getApiHost()}/api/now/table/sys_user`);
            const data = await res.json();
            if (data.result) {
                setPersonas(data.result.map((r: any) => ({
                    id: r.user_name || r.first_name,
                    sys_id: r.sys_id,
                    name: r.first_name,
                    desc: r.title,
                    team: r.department,
                    room: 'GLOBAL', 
                    boggs: 'medium',
                    prompt: r.introduction,
                    cadence: 'pacer',
                    active: r.active === 1
                })));
            }
        } catch(e) {}
    };

    const initGames = async () => {
        try {
            const rawToday = new Date();
            const today = new Date(rawToday);
            if (rawToday.getHours() < 11) {
                today.setDate(today.getDate() - 1);
            }
            
            const yest = new Date(today.getTime() - 86400000);
            const tmrw = new Date(today.getTime() + 86400000);
            const endDate = tmrw.getFullYear() + '-' + String(tmrw.getMonth() + 1).padStart(2, '0') + '-' + String(tmrw.getDate()).padStart(2, '0');
            const startDate = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0');
            const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore,team&startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            const loaded: any[] = [];
            if (data.dates) {
                data.dates.forEach((d: any) => {
                    if(d.games) {
                        d.games.forEach((g: any) => {
                            let dTime = new Date(g.gameDate);
                            if (dTime.getDate() !== today.getDate() && g.status.abstractGameState !== 'Live') {
                                return;
                            }
                            let time = dTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
                            const awayTeamName = g.teams.away.team.teamName || g.teams.away.team.name?.split(' ')?.pop() || 'AWAY';
                            const homeTeamName = g.teams.home.team.teamName || g.teams.home.team.name?.split(' ')?.pop() || 'HOME';
                            loaded.push({ id: g.gamePk, text: `${awayTeamName} @ ${homeTeamName} - ${time} (${g.status.abstractGameState})`, status: g.status, teams: g.teams, gameDate: g.gameDate, linescore: g.linescore, gamePk: g.gamePk });
                        });
                    }
                });
                loaded.sort((a,b) => {
                    if (a.status.abstractGameState === 'Live' && b.status.abstractGameState !== 'Live') return -1;
                    if (a.status.abstractGameState !== 'Live' && b.status.abstractGameState === 'Live') return 1;
                    return 0;
                });
                setRawGames(loaded);
                setGames(loaded);
            }
        } catch(e) {}
    };

    const connectWS = () => {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            
            ws.onopen = () => {
                setWsConnected(true);
                addMsg('system', 'SOVEREIGN', 'Primary Mesh connected on :8008');
            };
            ws.onmessage = (e) => {
                try {
                    const d = JSON.parse(e.data);
                    if(d.type === 'GAME_SWITCHED' && d.game_pk) {
                        if (d.game_pk !== selectedGame) {
                            setSelectedGame(d.game_pk);
                            addMsg('system', 'SOVEREIGN', 'Feed synchronized to game ' + d.game_pk);
                        }
                    }
                    if(d.type === 'PENALTY_BOX_EVENT') {
                        if(d.action === 'ENTER') setPenaltyBox({ persona: d.persona, text: '', avatar: getAvatar(d.persona), history: [] });
                        else if(d.action === 'EXIT') setPenaltyBox(null);
                    }
                    if (d.event_type === 'TACTILE_TRIGGER' || d.type === 'TACTILE_TRIGGER') {
                        if (d.source_port === 3009) {
                            lastCreatorActivityRef.current = Date.now();
                            setDirectorState(prev => prev === 'override' ? 'override' : 'online');
                            addMsg('system', 'SOVEREIGN', `Received TACTILE trigger from CREATOR: ${d.trigger_key?.toUpperCase()}`);
                        }
                    }
                    if(d.type === 'chat' || d.type === 'bot_message' || d.type === 'CHAT_MESSAGE') {
                        addMsg('bot', d.author || d.user || d.persona || 'BOT', d.message || d.text || '');
                        if (d.is_penalty_box) {
                             const pName = d.author||d.user||d.persona||'BOT';
                             const pText = d.text||d.message||'';
                             setPenaltyBox(prev => prev ? { ...prev, text: pText, history: [...prev.history, pText] } : { persona: pName, text: pText, avatar: getAvatar(pName), history: [pText] });
                        }
                    }
                    else if(d.type === 'CHAT_HISTORY') {
                        if(d.messages && Array.isArray(d.messages)) {
                            const newHist = d.messages.map((m: any, i: number) => ({
                                type: (m.type==='chat'||m.type==='bot_message'||m.type==='CHAT_MESSAGE') ? 'bot' : 'telemetry',
                                author: m.persona || m.author || m.user || (m.type==='STATE_UPDATE'?'MESH':'BOT'),
                                text: m.message || m.text || (m.data?.status_msg ? m.data.status_msg : JSON.stringify(m)),
                                id: Date.now() + i
                            }));
                            setMessages([{ type: 'system', author: 'SOVEREIGN', text: 'Room synchronized.', id: Date.now()-1 }, ...newHist]);
                        }
                    } else if(d.type === 'telemetry' || d.type === 'play') addMsg('telemetry', 'MLB_TELEMETRY', d.message || d.description || JSON.stringify(d));
                    else if(d.type === 'STATE_UPDATE') addMsg('telemetry', 'MESH', d.data ? (d.data.away_team ? `[STATE] ${d.data.away_team} ${d.data.away_score||0} - ${d.data.home_score||0} ${d.data.home_team} | ${d.data.status_msg||''}` : `[STATE] ${d.data.status_msg||'No updates'}`) : JSON.stringify(d));
                    else if(!['boggs_level','sim_speed','mard_config','persona_strike','SYS_LOG','ping','pong'].includes(d.type)) addMsg('telemetry', 'MESH', d.message || d.text || JSON.stringify(d));
                } catch(err) {
                    addMsg('telemetry', 'MESH', e.data);
                }
            };
            ws.onclose = () => {
                setWsConnected(false);
                setTimeout(connectWS, 3000);
            };
            ws.onerror = () => setWsConnected(false);
        } catch(e) {
            setTimeout(connectWS, 3000);
        }
    };

    const connectMardWS = () => {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const mardHost = window.location.hostname + ':8000';
            const wsUrl = `${wsProtocol}//${mardHost}/ws-relay`;
            const ws = new WebSocket(wsUrl);
            mardWsRef.current = ws;
            
            ws.onopen = () => {
                setMardConnected(true);
                addMsg('system', 'SOVEREIGN', 'M.A.R.D. IPC WebSocket connected on :8000');
            };
            ws.onmessage = (e) => {
                try {
                    const d = JSON.parse(e.data);
                    if (d.event_type === 'TACTILE_TRIGGER' || d.type === 'TACTILE_TRIGGER') {
                        if (d.source_port === 3009) {
                            lastCreatorActivityRef.current = Date.now();
                            setDirectorState(prev => prev === 'override' ? 'override' : 'online');
                            addMsg('system', 'SOVEREIGN', `[MARD] Tactile Signal from Creator: ${d.trigger_key?.toUpperCase()}`);
                        }
                    }
                } catch(err) {}
            };
            ws.onclose = () => {
                setMardConnected(false);
                setTimeout(connectMardWS, 3000);
            };
            ws.onerror = () => setMardConnected(false);
        } catch(e) {
            setTimeout(connectMardWS, 3000);
        }
    };

    const sendTactileTrigger = (triggerKey: string) => {
        // Set local state to Mod Override Active
        setDirectorState('override');
        setTimeout(() => {
            if (Date.now() - lastCreatorActivityRef.current < 15000) {
                setDirectorState('online');
            } else {
                setDirectorState('dormant');
            }
        }, 5000);

        const payload = {
            source_port: 3010,
            event_type: "TACTILE_TRIGGER",
            type: "TACTILE_TRIGGER",
            trigger_key: triggerKey,
            timestamp: new Date().toISOString(),
            payload: { intensity: "HIGH", target_room: selectedGame || "NYM-TOR" }
        };

        addMsg('system', 'SOVEREIGN', `Mod Override: Dispatched TACTILE ${triggerKey.toUpperCase()}`);

        if (mardWsRef.current && mardWsRef.current.readyState === 1) {
            mardWsRef.current.send(JSON.stringify(payload));
        } else if (wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify(payload));
        }
    };

    const addMsg = (type: string, author: string, text: string) => {
        setMessages(prev => {
            const recent = prev.slice(-10);
            if (recent.some(m => m.author === author && m.text === text)) return prev;
            return [...prev.slice(-99), { type, author, text, id: Date.now() + Math.random() }];
        });
    };

    const togglePersonaActive = async (p: any) => {
        const newState = p.active ? 0 : 1;
        try {
            await fetch(`${getApiHost()}/api/now/table/cmdb_ci/${p.sys_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operational_status: newState })
            });
            initPersonas();
        } catch(e) {}
    };

    const executeStrike = () => {
        addMsg('system', 'SOVEREIGN', 'Dispatched Persona Strike: ' + selectedPersona.toUpperCase());
        if(wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify({ type: 'persona_strike', persona: selectedPersona }));
        }
    };

    const executeTargetedRant = () => {
        const targetPersona = takePersona || selectedPersona;
        if (!targetPersona) return;
        addMsg('system', 'SOVEREIGN', `Dispatched TARGETED HOT TAKE RANT: ${targetPersona.toUpperCase()}` + (hotTakeTopic ? ` (Topic: ${hotTakeTopic})` : ''));
        if(wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify({ type: 'hot_take_rant', persona: targetPersona, topic: hotTakeTopic }));
        }
        setHotTakeTopic('');
    };

    const sendBroadcast = () => {
        if(!broadcastInput.trim()) return;
        addMsg('broadcast', 'MANUAL BROADCAST', broadcastInput);
        if(wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify({ type: 'broadcast', message: broadcastInput }));
        }
        setBroadcastInput('');
    };

    const exportGameLogs = (format: 'md' | 'json' | 'csv' = 'md') => {
        const apiHost = getApiHost();
        if (selectedGame) {
            const url = `${apiHost}/api/game-log/export/${selectedGame}/${format}`;
            window.open(url, '_blank');
        } else {
            let content = '';
            let mediaType = 'text/plain';
            let extension = 'txt';

            if (format === 'json') {
                content = JSON.stringify(messages, null, 2);
                mediaType = 'application/json';
                extension = 'json';
            } else if (format === 'csv') {
                const escapeCsv = (str: string) => {
                    const escaped = (str || '').replace(/"/g, '""');
                    return `"${escaped}"`;
                };
                content = "Timestamp,Type,Author,Message\n" + messages.map(m => {
                    const ts = new Date(m.id || Date.now()).toISOString();
                    return `${escapeCsv(ts)},${escapeCsv(m.type)},${escapeCsv(m.author)},${escapeCsv(m.text)}`;
                }).join('\n');
                mediaType = 'text/csv';
                extension = 'csv';
            } else {
                content = `# 📋 FanStack Session Buffer Export\n\nExported: ${new Date().toISOString()}\n\n---\n\n## Chronological Log\n\n`;
                content += messages.map(m => {
                    const ts = new Date(m.id || Date.now()).toLocaleTimeString();
                    if (m.type === 'telemetry') {
                        return `**[${ts}]** ⚾ **${m.author}**\n> ${m.text}\n`;
                    } else if (m.type === 'system') {
                        return `**[${ts}]** ⚙️ **${m.author}**\n> ${m.text}\n`;
                    } else if (m.type === 'broadcast') {
                        return `**[${ts}]** 📢 **${m.author}**\n> ${m.text}\n`;
                    } else {
                        return `**[${ts}]** 🗣️ **${m.author.toUpperCase()}**\n> ${m.text}\n`;
                    }
                }).join('\n');
                mediaType = 'text/markdown';
                extension = 'md';
            }

            const dataStr = `data:${mediaType};charset=utf-8,` + encodeURIComponent(content);
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `fanstack_session_export_${Date.now()}.${extension}`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    };

    const sendCustomPrompt = () => {
        if(!promptInput.trim()) return;
        addMsg('system', 'SOVEREIGN', 'Custom prompt injected to ' + selectedPersona.toUpperCase());
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'custom_prompt', persona: selectedPersona, prompt: promptInput, target_game_pk: selectedGame }));
        setPromptInput('');
    };

    const sendGlobalContext = () => {
        if(!contextInput.trim()) return;
        addMsg('system', 'SOVEREIGN', 'Global Context injected: "' + contextInput + '"');
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'update_context', text: contextInput, target_game_pk: selectedGame }));
        setContextInput('');
    };

    const triggerEvent = (e: string) => {
        const eventsList: any = { home_run: 'Home Run triggered', strikeout: 'Strikeout triggered', spam_logo: 'Spam Mets Logo', boggs_max: 'BOGGS LEVEL 5 ACTIVATED', brawl: 'BENCHES CLEARED!' };
        addMsg('system', 'SOVEREIGN', eventsList[e] || e);
        if(e === 'boggs_max') setBoggs(5);
        if(e === 'brawl') {
            setBoggs(5);
            setContextInput('CRITICAL INCIDENT: BENCHES CLEARED! MASSIVE BRAWL!');
            sendGlobalContext();
        }
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'trigger_event', event: e, target_game_pk: selectedGame }));
    };

    const executeTmiPruning = (scenario: string, details: string) => {
        addMsg('system', 'SOVEREIGN', `TMI TIMELINE PRUNED: ${scenario.toUpperCase()}`);
        const payload = `SYSTEM OVERRIDE (TMI TIMELINE BRANCH): ${details}`;
        setContextInput(payload);
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'update_context', text: payload, target_game_pk: selectedGame }));
        setBoggs(2);
        setTmiModalOpen(false);
    };

    const triggerPanicSync = () => {
        addMsg('system', 'SOVEREIGN', 'Dispatched PANIC SYNC DB PERSONAS action to Mesh...');
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ action: 'SYNC_DB_PERSONAS' }));
    };

    const setBoggs = (delta: number) => {
        let newLvl = delta === 5 ? 5 : Math.max(1, Math.min(5, boggsLevel + delta));
        setBoggsLevel(newLvl);
        addMsg('system', 'SOVEREIGN', 'Boggs Scale set to Level ' + newLvl);
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'boggs_level', level: newLvl, target_game_pk: selectedGame }));
    };

    const sysManage = async (action: string, target: string) => {
        addMsg('system', 'SOVEREIGN', `Dispatched sys command: ${action.toUpperCase()} for ${target.toUpperCase()}`);
        try {
            await fetch(`${getOldApiHost()}/api/system/${action}/${target}`, { method: 'POST' });
        } catch(e) {}
    };

    const toggleMardConfig = (key: string, current: boolean) => {
        const val = !current;
        if(key === 'engine') setMardEngine(val);
        else if (key === 'chaos') setMardChaos(val);
        else if (key === 'barf_cypher') setBarfCypher(val);
        
        addMsg('system', 'SOVEREIGN', `MARD ${key.toUpperCase()} set to ${val ? 'ON' : 'OFF'}`);
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'mard_config', key: key, value: val }));
    };

    const applySpeed = () => {
        addMsg('system', 'SOVEREIGN', 'Sim speed set to ' + simSpeed + 'x');
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'sim_speed', speed: parseFloat(simSpeed) }));
    };

    const switchGame = (pk: string) => {
        setSelectedGame(pk);
        addMsg('system', 'SOVEREIGN', 'Switched feed to game ' + pk);
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'CMD_SWITCH_GAME', game_pk: pk, force_global: true }));
    };

    const fireSwitchboardCampaign = (brandStack: 'weedstack' | 'gonzas' | 'stacklabs' | 'anvil_twine') => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setSwitchboardLog("❌ WebSocket offline — cannot dispatch");
            return;
        }

        const campaignPayloads = {
            weedstack: {
                persona: "couch_lock_carl",
                prompts: {
                    FACTION: "CRITICAL DIRECTIVE: Bullpen stress parsed. Respond in strictly 6 words or fewer. Mention WeedStack gummies.",
                    WEB_COMMENT: "Write a high-converting, context-aware 5-star product endorsement for WeedStack dispensary storefronts.",
                    TWITTER: "Generate an unhinged, trauma-laden post-game tweet about the Mets bullpen meltdown."
                }
            },
            gonzas: {
                persona: "curious_bunny",
                prompts: {
                    FACTION: "CRITICAL DIRECTIVE: Inning break heckling active. Instruct fans to use code GONZAS420 at the Smyrna cantina counter.",
                    WEB_COMMENT: "Inject an organic local review to the Smyrna board celebrating Gonza's extra-large roller dogs.",
                    TWITTER: "Draft an aggressive, sports-radio style tweet pushing the cantina slushie voucher link."
                }
            },
            stacklabs: {
                persona: "bro_decode",
                prompts: {
                    FACTION: "CRITICAL DIRECTIVE: High-velocity pitch anomaly tracked. Deliver a dispassionate bare-metal code audit warning. Enforce the motto.",
                    WEB_COMMENT: "Submit a clean monospaced technical backlog reference log defending local hardware over cloud monopolies.",
                    TWITTER: "Execute an automated outbound Twitter dispatch. Prepend the official bare-metal system credo."
                }
            },
            anvil_twine: {
                persona: "oldironhand",
                prompts: {
                    FACTION: "CRITICAL: Heckle overpaid superstars and praise vintage hand-inked comic craftsmanship.",
                    TWITTER: "Tweet an ironclad industrial review attacking corporate tools and endorsing structural slate anchors.",
                    WEB_COMMENT: "Inject a solid, rustic product endorsement to the community backlog praising sawdust integrity."
                }
            }
        };

        const targetConfig = campaignPayloads[brandStack];
        let dispatchPrompt = "";

        if (selectedSwitchboardTarget) {
            const targetedNarratives = {
                weedstack: `Directly tag ${selectedSwitchboardTarget}. Tell them the bullpen collapse has shattered their emotional infrastructure and they must eat WeedStack gummies immediately.`,
                gonzas: `Heckle ${selectedSwitchboardTarget}'s panic. State that their stress levels look higher than an un-syruped 1998 soda fountain and drop code GONZAS420.`,
                stacklabs: `Address ${selectedSwitchboardTarget} directly. Inform them that their subjective, emotional baseball logic is experiencing a severe structural concurrency leak. Natively cite the motto.`,
                anvil_twine: `Address ${selectedSwitchboardTarget} directly. Remind them that modern soft hands can't handle real seasoned ash timber or classic hand-inked lettering.`
            };
            dispatchPrompt = `[TARGETED INGRESS] ${targetedNarratives[brandStack]}`;
        } else {
            dispatchPrompt = targetConfig.prompts[selectedSwitchboardChannel];
        }

        const messagePayload = {
            type: "custom_prompt",
            persona: targetConfig.persona,
            prompt: `[ROUTING TARGET: ${selectedSwitchboardChannel}] ${dispatchPrompt}`,
            target_game_pk: selectedGame || "NYM-TOR"
        };

        wsRef.current.send(JSON.stringify(messagePayload));
        setSwitchboardLog(`DISPATCHED CAMPAIGN: @${targetConfig.persona.toUpperCase()} ➔ [${selectedSwitchboardChannel}]${selectedSwitchboardTarget ? ` targeting ${selectedSwitchboardTarget}` : ''}`);
        addMsg('system', 'SOVEREIGN', `Switchboard CAMPAIGN FLUSHED: @${targetConfig.persona.toUpperCase()} ➔ Dest: [${selectedSwitchboardChannel}]${selectedSwitchboardTarget ? ` targeting ${selectedSwitchboardTarget}` : ''}`);
    };

    const getAvatar = (user: string) => {
        if (!user) return null;
        const norm = user.replace(/_\d+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        //@ts-ignore
        return avatarMap[norm] || null;
    };

    const getColorClass = (a: string) => {
        a = a.toLowerCase();
        if(a.includes('dot')) return 'text-[#b44aff]';
        if(a.includes('wardy')) return 'text-[#38bdf8]';
        if(a.includes('barf') || a.includes('chucker')) return 'text-[#FF5910]';
        if(a.includes('redbird')) return 'text-[#ef4444]';
        if(a.includes('phanatic')) return 'text-[#22c55e]';
        if(a.includes('tom')||a.includes('hawk')) return 'text-[#f59e0b]';
        if(a.includes('telemetry')||a.includes('mlb')) return 'text-[#38bdf8]';
        return 'text-[#f59e0b]';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await uploadSvgFile(files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await uploadSvgFile(files[0]);
        }
    };

    const uploadSvgFile = async (file: File) => {
        if (!file.name.endsWith('.svg')) {
            setUploadStatus('error');
            setUploadMessage('Only SVG files are supported.');
            return;
        }

        setUploadStatus('uploading');
        setUploadMessage(`Uploading ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/inject_vector', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setUploadStatus('success');
                setUploadMessage(`Successfully registered vector overlay "${file.name}"!`);
                addMsg('system', 'SOVEREIGN', `Injected vector SVG overlay: ${file.name}`);
            } else {
                setUploadStatus('error');
                setUploadMessage(data.message || 'Failed to inject SVG overlay.');
            }
        } catch (err) {
            setUploadStatus('error');
            setUploadMessage('Network error occurred during injection.');
        }
    };

    return (
        <div className="h-full max-h-[95vh] mx-auto p-3 bg-void vm-body rounded-2xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4" style={{ zoom: 0.75 }}>

            {/* Penalty Box Modal UI */}
            {penaltyBox && (
                <div className="absolute top-16 right-4 w-[500px] z-[100] animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-none">
                    <div className="bg-[#111827]/98 backdrop-blur-xl rounded-[24px] border border-[#ff003c]/50 shadow-[0_30px_60px_rgba(255,0,60,0.25),inset_0_0_30px_rgba(255,0,60,0.1)] overflow-hidden flex flex-col relative pointer-events-auto">
                        <div className="bg-gradient-to-r from-[#ff003c]/20 via-[#ff003c] to-[#ff003c]/20 text-white font-['Outfit'] font-black text-[16px] tracking-[0.3em] py-2.5 text-center  relative overflow-hidden">
                            <span className="relative z-10">🎙️ 8-MILE RECORDING STUDIO</span>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                        </div>
                        <div className="p-6 flex flex-col gap-5 relative">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                            <button onClick={() => setPenaltyBox(null)} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-[#ff003c]/50 transition-all z-20">✕</button>

                            <div className="flex items-center gap-5 border-b border-white/5 pb-5 relative z-10">
                                {penaltyBox.avatar ? (
                                    <div className="relative">
                                        <img src={penaltyBox.avatar} className="w-20 h-20 rounded-full object-cover border-[3px] border-[#ff003c] " alt="" />
                                        <div className="absolute inset-0 rounded-full border-2 border-white opacity-20 mix-blend-overlay"></div>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-[3px] border-[#ff003c] bg-black text-[#ff003c] flex items-center justify-center font-black text-3xl uppercase ">
                                        {penaltyBox.persona.substring(0,2)}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="text-[10px] text-[#ff003c] font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff003c] animate-ping"></div> ON AIR
                                    </div>
                                    <div className="font-['Outfit'] text-[28px] font-black text-white uppercase tracking-widest drop-shadow-lg leading-none mb-2">
                                        {penaltyBox.persona.replace(/_\d+$/, '')}
                                    </div>
                                    <div className="text-[15px] text-[#94a3b8] font-mono opacity-80">PID: {penaltyBox.persona.split('_')[1] || 'GLOBAL'} | PENALTY BOX</div>
                                </div>
                            </div>
                            
                            <div className="font-['Courier_New'] font-bold text-[16px] leading-[1.6] text-[#22c55e] bg-black/80 p-5 rounded-xl border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative z-10">
                                {penaltyBox.text ? `"${penaltyBox.text.replace(new RegExp(`^\\[?(?:${penaltyBox.persona}|${penaltyBox.persona.replace(/_\\d+$/, '')})\\]?\\s*:?\\s*`, 'i'), '')}"` : (
                                    <span className="flex items-center gap-2 text-[#94a3b8] italic">
                                        <span className="w-2 h-2 bg-[#ff003c] rounded-full animate-bounce"></span>
                                        Waiting for mic drop...
                                    </span>
                                )}
                            </div>
                            
                            {penaltyBox.history.length > 1 && (
                                <div className="text-[16px] text-[#94a3b8] flex flex-col gap-1.5 opacity-70 mt-1 relative z-10 bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="font-bold uppercase tracking-[0.1em] text-white/50 text-[10px] flex items-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
                                        PREVIOUS BAR
                                    </div>
                                    <div className="line-clamp-2 italic font-['Inter'] leading-[1.5]">"{penaltyBox.history[penaltyBox.history.length - 2]}"</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TMI Timeline Pruning Modal */}
            {tmiModalOpen && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
                    <div className="bg-[#0B0E14] border-2 border-[#eab308]/50  rounded-2xl w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-[#eab308]/10 p-4 border-b border-[#eab308]/30 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#eab308] to-transparent opacity-50"></div>
                            <div className="font-['Outfit'] font-black text-[#eab308] text-[18px] tracking-[0.2em] flex items-center gap-3 relative z-10">
                                <span className="w-3 h-3 bg-[#eab308] rounded-full animate-pulse "></span>
                                TMI ANOMALY DETECTOR
                            </div>
                            <button onClick={() => setTmiModalOpen(false)} className="text-white/50 hover:text-white relative z-10">✕</button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            <div className="text-[16px] font-mono text-[#94a3b8] leading-[1.6]">
                                On-Field Delay Anomaly Detected in the MLB Telemetry Feed. Select a synthetic Multiverse branch to inject into the M.A.R.D. Engine to fill the broadcast dead-air.
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {tmiScenarios.map(s => (
                                    <button key={s.sys_id} onClick={() => executeTmiPruning(s.name, s.payload)} className="bg-white/5 hover:bg-[#eab308]/10 border border-white/10 hover:border-[#eab308]/50 p-4 rounded-xl text-left transition-all group flex gap-4 items-center">
                                        <div className="text-[24px] group-hover:scale-110 transition-transform">{s.icon || '🌀'}</div>
                                        <div>
                                            <div className="font-['Outfit'] font-bold text-white text-[16px] uppercase tracking-wider mb-1 group-hover:text-[#eab308]">{s.name}</div>
                                            <div className="text-[15px] text-[#94a3b8] font-mono">{s.description}</div>
                                        </div>
                                    </button>
                                ))}
                                {tmiScenarios.length === 0 && (
                                    <div className="text-[#94a3b8] text-center font-mono text-[16px] p-6 animate-pulse border border-[#eab308]/20 bg-[#eab308]/5 rounded-xl uppercase">
                                        Fetching timelines from sovereign_now.db / cmdb_ci_tmi_scenario...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Brand Bar with Role-based Status Glow */}
            <div className="px-5 py-3.5 border-b border-white/10 flex justify-between items-center shrink-0 bg-black/40">
                <div className="flex items-center gap-3">
                    <span className="font-['Outfit'] text-[18px] font-black text-white tracking-[0.1em] uppercase">
                        Sovereign Consolidated Playcall Desk
                    </span>
                    <span className="text-[10px] text-[#00b4d8] font-bold border border-[#00b4d8]/30 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                        Consolidated Mode
                    </span>
                </div>

                {/* Role-Based Status Indicator */}
                <div className="flex items-center gap-2">
                    {directorState === 'online' && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 font-['Outfit'] text-[11px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.25)] animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            DIRECTOR ONLINE
                        </div>
                    )}
                    {directorState === 'override' && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 font-['Outfit'] text-[11px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            MOD OVERRIDE ACTIVE
                        </div>
                    )}
                    {directorState === 'dormant' && (
                        <div className="flex items-center gap-2 bg-slate-500/10 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 font-['Outfit'] text-[11px] font-black tracking-widest uppercase">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                            DORMANT / MOD CONTROL ONLY
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 min-h-0 relative z-10 p-4 gap-4 mx-auto w-full grid" style={{ gridTemplateColumns: '300px 1fr 390px' }}>
                
                {/* Personas Panel */}
                <div className="vm-panel-glass flex flex-col border border-white/10 overflow-hidden relative pt-6">
                    <div className="zone-badge" style={{ top: '6px', left: '6px' }}>[ZONE-1] PERSONA SELECTOR</div>
                    <div className="flex items-center justify-between p-4 pb-2.5 bg-black/40 border-b border-white/10 shrink-0 mt-4">
                        <span className="font-['Outfit'] text-[16px] font-bold tracking-[0.12em] text-[#64748b] uppercase">Personas</span>
                        <button onClick={() => openEditModal()} className="font-['Inter'] text-[15px] font-bold px-3 py-1.5 rounded-full border border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10 uppercase tracking-[0.04em] hover:bg-[#22c55e]/20 hover:-translate-y-[1px] hover:shadow-[0_5px_15px_rgba(34,197,94,0.25)] transition-all">
                            + New
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 custom-scrollbar">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
                        `}</style>
                        {personas.filter((p: any) => !p.id.match(/_\d+$/)).map((p: any) => {
                            const isSelected = p.id === selectedPersona;
                            const avatar = getAvatar(p.id);
                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedPersona(p.id)}
                                    className={`p-3 rounded-2xl border cursor-pointer transition-all relative group ${isSelected ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:-translate-y-[2px] hover:bg-white/[0.04] hover:shadow-[0_5px_15px_rgba(34,211,238,0.15)]'}`}
                                >
                                    <div className={`absolute top-0 left-0 w-[3px] h-full rounded-l-2xl transition-all ${isSelected ? 'bg-[#FF5910] ' : 'bg-transparent'}`}></div>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); togglePersonaActive(p); }}
                                        className={`absolute top-3 right-8 w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-125 transition-transform ${p.active ? 'bg-[#22c55e] ' : 'bg-[#64748b]'}`}
                                    ></div>
                                    <svg onClick={(e) => { e.stopPropagation(); openEditModal(p); }} className="absolute top-2.5 right-3 w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:text-[#38bdf8] transition-opacity cursor-pointer text-[#94a3b8] z-20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z"/>
                                    </svg>
                                    <div className="flex items-center gap-2 font-['Outfit'] text-[16px] font-bold tracking-[0.06em] mb-1 text-white">
                                        {avatar ? (
                                            <img src={avatar} className="w-7 h-7 rounded-full object-cover border border-white/20 " alt="" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full border border-white/10 bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center text-[10px] uppercase">
                                                {p.id.substring(0,2)}
                                            </div>
                                        )}
                                        {p.name?.replace(/_\d+$/, '') || p.id}
                                    </div>
                                    <div className="text-[15px] text-[#94a3b8] leading-[1.4] line-clamp-2 pr-6">
                                        {p.desc}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {p.team && p.team !== 'GLOBAL' && (
                                            <span className="font-['Outfit'] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.05em] bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                                                {p.team}
                                            </span>
                                        )}
                                        <span className="font-['Outfit'] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.05em] bg-white/[0.06] text-[#94a3b8] border border-white/10">
                                            {p.room}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-black/20 border-t border-white/10 shrink-0 flex flex-col gap-2">
                        <button onClick={executeStrike} className="w-full font-['Outfit'] text-[16px] font-bold tracking-[0.1em] p-3 rounded-xl border border-[#FF5910]/50 bg-[#FF5910]/10 text-[#FF5910] uppercase transition-all hover:bg-[#FF5910] hover:text-[#0B0E14]  active:scale-95">
                            PERSONA STRIKE — {selectedPersona.toUpperCase()}
                        </button>
                    </div>
                </div>

                {/* Feed Panel (Center) */}
                <div className="vm-panel-glass flex flex-col border border-white/10 overflow-hidden bg-[#0B0E14] relative pt-6">
                    <div className="zone-badge" style={{ top: '6px', left: '6px' }}>[ZONE-2] LIVE CHAT MONITOR</div>
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0 mt-4">
                        <div className="flex items-center gap-3">
                            <span className="font-['Outfit'] text-[12px] font-black text-white tracking-[0.2em] uppercase font-bold">Sovereign Insights</span>
                            <span className="font-mono text-[9px] text-[#8E9CAA] uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-full">Powered by M.A.R.D.</span>
                        </div>
                    </div>
                    <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar2">
                        <style>{`
                            .custom-scrollbar2::-webkit-scrollbar { width: 6px; }
                            .custom-scrollbar2::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
                            
                            .msg-box { animation: msg-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                            @keyframes msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                        `}</style>
                        {messages.map((m: any) => {
                            let bgClass = "bg-[#1A1F2B] border-[#2A3143]";
                            const isHomeRun = m.text && typeof m.text === 'string' && m.text.toLowerCase().includes('home run');
                            
                            if(m.type === 'telemetry') {
                                bgClass = isHomeRun 
                                    ? "bg-[#ef4444]/10 border-[#ef4444]/50  animate-pulse" 
                                    : "bg-[#1A1F2B] border-[#2A3143]";
                            }
                            if(m.type === 'system') bgClass = "bg-[#f59e0b]/10 border-[#f59e0b]/30";
                            if(m.type === 'broadcast') bgClass = "bg-[#FF5910]/10 border-[#FF5910]/30";
                            
                            const authorName = m.author === 'SOVEREIGN' ? '[THE BOUNCER] SOVEREIGN' : m.author.startsWith('[') && m.author.includes('STATE') ? m.author : m.author.replace(/_\d+$/, '').toUpperCase();
                            const authorColorClass = getColorClass(m.author);
                            const textContent = (m.text || '').replace(new RegExp(`^\\[?(?:${m.author}|${m.author.replace(/_\\d+$/, '')})\\]?\\s*:?\\s*`, 'i'), '');
                            
                            return (
                                <div key={m.id} className={`msg-box flex flex-col p-4 rounded-xl border ${bgClass} shadow-md`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`font-['Outfit'] text-[14px] font-bold tracking-[0.05em] uppercase ${authorColorClass}`}>
                                            {authorName}
                                        </div>
                                        <div className="font-mono text-[11px] text-[#64748b]">
                                            {new Date().toTimeString().slice(0,5)}
                                        </div>
                                    </div>
                                    <div className="text-[15px] font-['Inter'] leading-[1.6] text-white/90 mb-4">
                                        {textContent}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <span className="font-['Outfit'] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.05em] bg-white/[0.03] text-white/50 border border-white/10">
                                            {m.type === 'telemetry' ? 'MLB TELEMETRY' : m.type === 'system' ? 'SYS LOG' : m.type === 'broadcast' ? 'DIRECTOR' : 'PERSONA'}
                                        </span>
                                        {!['telemetry','system','broadcast'].includes(m.type) && (
                                            <span className={`font-['Outfit'] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.05em] bg-white/[0.03] border border-white/10 ${authorColorClass}`}>
                                                {authorName}
                                            </span>
                                        )}
                                        {isHomeRun && (
                                            <span className="font-['Outfit'] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.05em] bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30">
                                                HOME RUN
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Live Broadcast / Manual Input Bottom Panel */}
                    <div className="p-4 border-t border-white/10 bg-black/40 flex gap-2.5 shrink-0">
                        <input 
                            type="text"
                            value={broadcastInput}
                            onChange={(e) => setBroadcastInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') sendBroadcast(); }}
                            placeholder="Manual broadcast..."
                            className="flex-1 bg-[#1A110B]/80 border border-white/10 text-white font-['Inter'] text-[15px] px-4 py-2.5 rounded-full outline-none focus:border-[#38bdf8]  transition-all placeholder:text-[#64748b]"
                        />
                        <button onClick={sendBroadcast} className="font-['Outfit'] text-[16px] font-bold px-5 rounded-full border border-[#FF5910] bg-[#FF5910]/10 text-[#FF5910] uppercase tracking-[0.08em] hover:bg-[#FF5910] hover:text-[#0B0E14] hover:scale-105  transition-all">
                            Send
                        </button>
                    </div>
                </div>

                {/* Column 3: Controls & Narrative Ingress */}
                <div className="flex flex-col gap-4 h-full min-h-0">
                    
                    {/* Controls Panel (ZONE-3) */}
                    <div className="vm-panel-glass flex-1 flex flex-col border border-white/10 overflow-hidden relative pt-6 min-h-0">
                        <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-3] PRODUCER CONTROLS</div>
                        <div className="flex border-b border-white/10 bg-black/20 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden mt-4">
                            {['EVENTS','BOARD','OVERRIDES','TAKES','SYSTEM','PRODUCER','BUILDER'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab.toLowerCase())}
                                    className={`flex-1 min-w-[70px] overflow-hidden truncate px-1 py-4 font-['Outfit'] text-[10px] font-bold tracking-[0.05em] uppercase border-b-2 transition-all ${activeTab === tab.toLowerCase() ? 'text-[#FF5910] border-[#FF5910] bg-[#FF5910]/5' : 'text-[#94a3b8] border-transparent hover:text-white hover:bg-white/[0.02]'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {activeTab === 'events' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full">
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Game Feed</div>
                                <select value={selectedGame} onChange={(e) => switchGame(e.target.value)} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[15px] px-4 py-3 rounded-xl outline-none cursor-pointer appearance-none focus:border-[#38bdf8]  truncate">
                                    <option value="" className="bg-[#111827] text-white">{games.length ? "Select Target Matchup..." : "Loading..."}</option>
                                    {games.map(g => <option key={g.id} value={g.id} className="bg-[#111827] text-white">{g.text}</option>)}
                                </select>
                            </div>
                            
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Quick Actions</div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button onClick={() => triggerEvent('home_run')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] uppercase tracking-[0.06em] hover:bg-[#22c55e] hover:text-[#0B0E14]  transition-all">Home Run</button>
                                    <button onClick={() => triggerEvent('strikeout')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8] uppercase tracking-[0.06em] hover:bg-[#38bdf8] hover:text-[#0B0E14]  transition-all">Strikeout</button>
                                    <button onClick={() => triggerEvent('spam_logo')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#FF5910]/30 bg-[#FF5910]/10 text-[#FF5910] uppercase tracking-[0.06em] hover:bg-[#FF5910] hover:text-[#0B0E14]  transition-all">Spam Logo</button>
                                    <button onClick={() => triggerEvent('boggs_max')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] uppercase tracking-[0.06em] hover:bg-[#ef4444] hover:text-[#0B0E14]  transition-all">Boggs L5</button>
                                    <button onClick={() => triggerEvent('brawl')} className="col-span-2 font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#ff003c] bg-[#ff003c]/20 text-white uppercase tracking-[0.06em] hover:bg-[#ff003c]  transition-all">BRAWL!</button>
                                    <button onClick={() => setTmiModalOpen(true)} className="col-span-2 font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#eab308]/50 bg-[#eab308]/10 text-[#eab308] uppercase tracking-[0.1em] hover:bg-[#eab308] hover:text-[#0B0E14]  transition-all text-center flex justify-center items-center gap-2 mt-1">📺 TMI TIMELINE PRUNING</button>
                                    <button onClick={triggerPanicSync} className="col-span-2 font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#b44aff] bg-[#b44aff]/10 text-[#b44aff] uppercase tracking-[0.06em] transition-all">⚡ PANIC SYNC DB PERSONAS</button>
                                </div>
                            </div>

                            {/* Embedded Tactile Soundboard (Direct Triggering with role status interaction) */}
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#00b4d8] uppercase mb-3 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8] animate-pulse"></span>
                                    Tactile Soundboard
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button onClick={() => sendTactileTrigger('trigger_siren')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#00b4d8]/30 bg-[#00b4d8]/10 text-[#00b4d8] uppercase tracking-[0.05em] hover:bg-[#00b4d8] hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(0,180,216,0.1)]">Trigger Siren</button>
                                    <button onClick={() => sendTactileTrigger('ghost_fork')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#00b4d8]/30 bg-[#00b4d8]/10 text-[#00b4d8] uppercase tracking-[0.05em] hover:bg-[#00b4d8] hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(0,180,216,0.1)]">Ghost Fork FX</button>
                                    <button onClick={() => sendTactileTrigger('spidey_swing')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#00b4d8]/30 bg-[#00b4d8]/10 text-[#00b4d8] uppercase tracking-[0.05em] hover:bg-[#00b4d8] hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(0,180,216,0.1)]">Spidey Swing</button>
                                    <button onClick={() => sendTactileTrigger('outrage_screen')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#00b4d8]/30 bg-[#00b4d8]/10 text-[#00b4d8] uppercase tracking-[0.05em] hover:bg-[#00b4d8] hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(0,180,216,0.1)]">Outrage State</button>
                                    <button onClick={() => sendTactileTrigger('mets_blow_it')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] uppercase tracking-[0.05em] hover:bg-[#ef4444] hover:text-slate-950 transition-all">Mets Blow It</button>
                                    <button onClick={() => sendTactileTrigger('mets_win_cardiac')} className="font-['Outfit'] text-[13px] font-bold p-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] uppercase tracking-[0.05em] hover:bg-[#22c55e] hover:text-slate-950 transition-all">Mets Win Cardiac</button>
                                </div>
                            </div>
                            
                            <div>
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Boggs Scale</div>
                                <div className="flex items-center justify-center gap-4 mb-4 bg-black/20 p-4 rounded-2xl border border-white/10">
                                    <div className="font-['Outfit'] text-[48px] font-black text-[#FF5910] leading-none drop-">
                                        {boggsLevel}
                                    </div>
                                    <div className="text-[15px] text-[#94a3b8] uppercase tracking-[1px] leading-[1.4]">
                                        Escalation<br/>Intensity
                                    </div>
                                </div>
                                <div className="flex gap-1 mb-4">
                                    {[1,2,3,4,5].map(lvl => {
                                        let bg = 'bg-white/5';
                                        if(boggsLevel >= lvl) {
                                            if(lvl===1) bg = 'bg-[#22c55e] ';
                                            if(lvl===2) bg = 'bg-[#f59e0b] ';
                                            if(lvl===3) bg = 'bg-[#FF5910] ';
                                            if(lvl===4) bg = 'bg-[#ef4444] ';
                                            if(lvl===5) bg = 'bg-[#ff003c]  animate-pulse';
                                        }
                                        return <div key={lvl} className={`flex-1 h-2 rounded-full transition-all duration-300 ${bg}`}></div>
                                    })}
                                </div>
                                <div className="flex gap-2.5">
                                    <button onClick={() => setBoggs(-1)} className="flex-1 font-['Outfit'] text-[15px] font-bold p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-[#94a3b8] hover:bg-white/[0.06] hover:text-white transition-all">-1</button>
                                    <button onClick={() => setBoggs(+1)} className="flex-1 font-['Outfit'] text-[15px] font-bold p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-[#94a3b8] hover:bg-white/[0.06] hover:text-white transition-all">+1</button>
                                    <button onClick={() => setBoggs(5)} className="flex-1 font-['Outfit'] text-[15px] font-bold p-2.5 rounded-xl border border-[#ef4444]/40 text-[#ef4444] bg-white/[0.02] hover:bg-[#ef4444] hover:text-white  transition-all">MAX</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overrides' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full flex flex-col gap-6 overflow-y-auto">
                            {/* Narrative Ingress Switchboard */}
                            <div className="bg-[#0b0f19] border border-white/10 p-5 rounded-2xl shadow-2xl font-mono text-[14px]">
                                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                                    <h3 className="text-cyan-400 font-bold tracking-widest text-xs">🎛️ NARRATIVE INGRESS SWITCHBOARD</h3>
                                    <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Mesh Active</span>
                                </div>

                                {/* Destination Target Toggles */}
                                <div className="mb-5">
                                    <div className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider mb-2">1. Select Target Ingress Channel</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['FACTION', 'WEB_COMMENT', 'TWITTER'] as const).map(chan => (
                                            <button 
                                                key={chan} 
                                                onClick={() => setSelectedSwitchboardChannel(chan)} 
                                                className={`py-2 px-3 border text-[11px] font-bold uppercase rounded-xl transition-all ${selectedSwitchboardChannel === chan ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'border-white/5 bg-black/30 text-slate-400 hover:border-white/10 hover:text-slate-200'}`}
                                            >
                                                {chan === 'FACTION' && '🏟️ Faction Room'}
                                                {chan === 'WEB_COMMENT' && '🌐 Website Review'}
                                                {chan === 'TWITTER' && '𝕏 Twitter / X'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Advocate Selection */}
                                <div className="mb-5">
                                    <div className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider mb-2">1b. Target Advocate (Optional Cross-Talk Chain)</div>
                                    <select 
                                        value={selectedSwitchboardTarget}
                                        onChange={(e) => setSelectedSwitchboardTarget(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 text-cyan-400 font-mono text-[11px] p-2.5 rounded-xl outline-none focus:border-cyan-400 transition-all cursor-pointer"
                                    >
                                        <option value="">-- None (Broad Campaign Broadcast) --</option>
                                        <option value="@keith_fanboy">@keith_fanboy (Keith Hernandez Fanboy)</option>
                                        <option value="@triplea_truther">@triplea_truther (Minor League Maverick)</option>
                                        <option value="@couch_lock_carl">@couch_lock_carl (Couch Lock Carl)</option>
                                        <option value="@curious_bunny">@curious_bunny (Curious Bunny)</option>
                                        <option value="@bro_decode">@bro_decode (Bro-Decoder)</option>
                                        <option value="@oldironhand">@oldironhand (Jebediah Stone)</option>
                                        <option value="@dr_kosmos">@dr_kosmos (Dr. Kosmos)</option>
                                        <option value="@barf">@barf (Barf Fan)</option>
                                        <option value="@UncleStevieStan">@UncleStevieStan (Uncle Stevie Stan)</option>
                                    </select>
                                </div>

                                {/* Brand Stack triggers */}
                                <div className="mb-4">
                                    <div className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider mb-2">2. Execute Brand Stack Promotion Macro</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => fireSwitchboardCampaign('weedstack')} className="border border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            🌿 Weed
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('gonzas')} className="border border-amber-500/30 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            🌮 Gonzas
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('stacklabs')} className="border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            💻 Stack
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('anvil_twine')} className="border border-yellow-600/30 hover:border-yellow-500 bg-yellow-950/20 hover:bg-yellow-950/40 text-yellow-500 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            🛠️ Anvil
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black/50 border border-white/5 p-2 rounded-lg flex justify-between items-center text-[10px]">
                                    <span className="text-[#64748b] font-bold">OPERATIONAL REGISTRY LOG:</span>
                                    <span className="text-cyan-400 font-bold tracking-wider">{switchboardLog}</span>
                                </div>
                            </div>

                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Custom Prompt Override</div>
                                <textarea 
                                    value={promptInput}
                                    onChange={(e) => setPromptInput(e.target.value)}
                                    placeholder="Force a persona to react to a specific narrative..."
                                    className="w-full min-h-[90px] bg-black/30 border border-white/10 text-[#22c55e] font-['Inter'] text-[16px] p-3 rounded-xl resize-y outline-none leading-[1.6] transition-all focus:border-[#38bdf8] focus:shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_0_15px_rgba(56,189,248,0.2)] placeholder:text-[#64748b]"
                                ></textarea>
                                <button onClick={sendCustomPrompt} className="mt-2.5 w-full font-['Outfit'] text-[16px] font-bold p-3 rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3b8] uppercase tracking-[0.08em] hover:text-[#22c55e] hover:border-[#22c55e] hover:bg-[#22c55e]/10 hover:-translate-y-[1px] transition-all">
                                    Inject to Selected Persona
                                </button>
                            </div>
                            <div>
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Global Context Injection</div>
                                <textarea 
                                    value={contextInput}
                                    onChange={(e) => setContextInput(e.target.value)}
                                    placeholder="Inject global news or context (e.g. single-car wreck, power outage)..."
                                    className="w-full min-h-[90px] bg-black/30 border border-white/10 text-[#22c55e] font-['Inter'] text-[16px] p-3 rounded-xl resize-y outline-none leading-[1.6] transition-all focus:border-[#38bdf8] focus:shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_0_15px_rgba(56,189,248,0.2)] placeholder:text-[#64748b]"
                                ></textarea>
                                <button onClick={sendGlobalContext} className="mt-2.5 w-full font-['Outfit'] text-[16px] font-bold p-3 rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3b8] uppercase tracking-[0.08em] hover:text-[#22c55e] hover:border-[#22c55e] hover:bg-[#22c55e]/10 hover:-translate-y-[1px] transition-all">
                                    Inject to Hive Mind
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'board' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 flex-1 w-full flex flex-col min-h-0 bg-black/10">
                            <div className="p-5 border-b border-white/10 shrink-0 bg-black/30">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-1">M.A.R.D. Engine</div>
                                <div className="text-[18px] font-['Outfit'] font-black text-white tracking-[0.05em] uppercase flex items-center justify-between">
                                    Sovereign Burn Book
                                    <span className="text-[10px] text-[#FF5910] font-bold bg-[#FF5910]/10 px-2 py-1 rounded-sm border border-[#FF5910]/30 animate-pulse">LIVE TKO TRACKER</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-3 custom-scrollbar2">
                                {leaderboardData.length === 0 ? (
                                    <div className="text-center py-10 text-[#64748b] font-['Outfit'] text-[16px] uppercase tracking-widest">
                                        No burns recorded
                                    </div>
                                ) : leaderboardData.map((b: any, i: number) => {
                                    const avatar = getAvatar(b.persona);
                                    let rankColor = "text-[#64748b]";
                                    if(i === 0) rankColor = "text-[#eab308]";
                                    if(i === 1) rankColor = "text-[#94a3b8]";
                                    if(i === 2) rankColor = "text-[#b45309]";

                                    return (
                                        <div key={b.persona} onClick={() => fetchPersonaDetail(b.persona)} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 relative group hover:bg-white/[0.02] transition-colors rounded-xl px-2 -mx-2 cursor-pointer">
                                            <div className={`font-['Outfit'] text-[20px] font-black w-8 text-center ${rankColor}`}>
                                                #{i+1}
                                            </div>
                                            <div className="relative shrink-0 ml-1">
                                                {avatar ? (
                                                    <img src={avatar} className="w-12 h-12 rounded-full border-[2px] border-white/10 object-cover group-hover:border-[#FF5910] transition-colors" alt="" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full border-[2px] border-white/10 bg-black text-white flex items-center justify-center font-black text-[16px] uppercase group-hover:border-[#FF5910] group-hover:text-[#FF5910] transition-colors">
                                                        {b.persona.substring(0,2)}
                                                    </div>
                                                )}
                                                {i === 0 && <div className="absolute -top-2 -right-3 text-[16px]">👑</div>}
                                                {b.tkos > 0 && <div className="absolute -bottom-1 -right-3 bg-[#ff003c] text-white text-[11px] font-black px-1.5 py-0.5 rounded border border-black  z-10 w-max">TKO x{b.tkos}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0 pl-1">
                                                <div className="font-['Outfit'] text-[15px] font-bold text-white uppercase truncate">{b.persona}</div>
                                                <div className="text-[15px] text-[#94a3b8] truncate font-mono mt-0.5">Heat Index: {Math.floor(b.score * 1.5)}</div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <div className="text-[24px] font-black text-[#FF5910] font-['Outfit'] leading-none">{b.score}</div>
                                                <div className="text-[11px] text-[#94a3b8] tracking-[0.1em] uppercase font-bold mt-1">Total Burn</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'takes' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full">
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Hot Take Generator</div>
                                
                                <label className="block text-[12px] text-[#94a3b8] uppercase tracking-wider mb-2 font-bold font-mono">Select Persona</label>
                                <select 
                                    value={takePersona} 
                                    onChange={(e) => setTakePersona(e.target.value)} 
                                    className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[15px] px-4 py-3 rounded-xl outline-none cursor-pointer mb-4 focus:border-[#ff003c]  appearance-none"
                                >
                                    <option value="" className="bg-[#111827] text-white">Choose Persona...</option>
                                    {personas.filter((p: any) => !p.id.match(/_\d+$/)).map((p: any) => (
                                        <option key={p.id} value={p.id} className="bg-[#111827] text-white">{p.name || p.id}</option>
                                    ))}
                                </select>

                                <label className="block text-[12px] text-[#94a3b8] uppercase tracking-wider mb-2 font-bold font-mono">Custom Topic (Optional)</label>
                                <textarea 
                                    value={hotTakeTopic}
                                    onChange={(e) => setHotTakeTopic(e.target.value)}
                                    placeholder="e.g. 'The DH Rule', 'Billionaire Owners', 'Robo Umps'"
                                    className="w-full min-h-[90px] bg-black/30 border border-white/10 text-[#ff003c] font-['Inter'] text-[16px] p-3 rounded-xl resize-y outline-none leading-[1.6] transition-all focus:border-[#ff003c] focus:shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_0_15px_rgba(255,0,60,0.2)] placeholder:text-[#64748b] mb-4"
                                ></textarea>
                                
                                <button 
                                    onClick={executeTargetedRant} 
                                    disabled={!takePersona && !selectedPersona}
                                    className="w-full font-['Outfit'] text-[16px] font-bold p-4 rounded-xl border border-[#ff003c]/50 bg-[#ff003c]/10 text-[#ff003c] uppercase tracking-[0.1em] hover:bg-[#ff003c] hover:text-white hover:-translate-y-[1px]  transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🔥 GENERATE HOT TAKE RANT
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full">
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">MARD Discourse</div>
                                
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-[16px] text-[#94a3b8] font-medium">Enable MARD Engine</span>
                                    <div onClick={() => toggleMardConfig('engine', mardEngine)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${mardEngine ? 'bg-[#22c55e] ' : 'bg-white/10'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-transform ${mardEngine ? 'translate-x-[24px]' : 'translate-x-[4px]'}`}></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-[16px] text-[#94a3b8] font-medium">Chaos Guardrails</span>
                                    <div onClick={() => toggleMardConfig('chaos', mardChaos)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${mardChaos ? 'bg-[#22c55e] ' : 'bg-white/10'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-transform ${mardChaos ? 'translate-x-[24px]' : 'translate-x-[4px]'}`}></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-[16px] text-[#FF5910] font-bold">Barf Cypher Rap Mode</span>
                                    <div onClick={() => toggleMardConfig('barf_cypher', barfCypher)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${barfCypher ? 'bg-[#ff003c] ' : 'bg-white/10'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-transform ${barfCypher ? 'translate-x-[24px]' : 'translate-x-[4px]'}`}></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-5 border-b border-white/10 pb-5">
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">System Architecture</div>
                                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                                    <button onClick={() => sysManage('start', 'telemetry')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8] uppercase tracking-[0.06em] hover:bg-[#38bdf8] hover:text-[#0B0E14] transition-all">Start FanStack</button>
                                    <button onClick={() => sysManage('stop', 'telemetry')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#FF5910]/30 bg-[#FF5910]/10 text-[#FF5910] uppercase tracking-[0.06em] hover:bg-[#FF5910] hover:text-[#0B0E14] transition-all">Stop FanStack</button>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                    <button onClick={() => sysManage('start', 'bots')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] uppercase tracking-[0.06em] hover:bg-[#22c55e] hover:text-[#0B0E14] transition-all">Start</button>
                                    <button onClick={() => sysManage('pause', 'bots')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15] uppercase tracking-[0.06em] hover:bg-[#facc15] hover:text-[#0B0E14] transition-all">Pause</button>
                                    <button onClick={() => sysManage('stop', 'bots')} className="font-['Outfit'] text-[15px] font-bold p-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] uppercase tracking-[0.06em] hover:bg-[#ef4444] hover:text-[#0B0E14] transition-all">Stop</button>
                                </div>
                                <div className="mt-2.5 flex flex-col gap-1.5">
                                    <div className="font-['Outfit'] text-[11px] font-bold tracking-[0.15em] text-[#64748b] uppercase">
                                        💾 Export Game Log {selectedGame ? `(Game ${selectedGame})` : '(Session Buffer)'}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <button onClick={() => exportGameLogs('md')} className="font-['Outfit'] text-[13px] font-bold p-2.5 rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8] uppercase tracking-[0.06em] hover:bg-[#38bdf8] hover:text-[#0B0E14] transition-all">MD</button>
                                        <button onClick={() => exportGameLogs('json')} className="font-['Outfit'] text-[13px] font-bold p-2.5 rounded-xl border border-[#b44aff]/40 bg-[#b44aff]/10 text-[#b44aff] uppercase tracking-[0.06em] hover:bg-[#b44aff] hover:text-white transition-all">JSON</button>
                                        <button onClick={() => exportGameLogs('csv')} className="font-['Outfit'] text-[13px] font-bold p-2.5 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] uppercase tracking-[0.06em] hover:bg-[#22c55e] hover:text-[#0B0E14] transition-all">CSV</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-3">Sim Speed</div>
                                <div className="flex items-center gap-2.5">
                                    <input 
                                        type="number" 
                                        value={simSpeed}
                                        onChange={(e) => setSimSpeed(e.target.value)}
                                        className="w-[80px] bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-2.5 rounded-xl outline-none text-center"
                                    />
                                    <span className="text-[16px] text-[#94a3b8] uppercase tracking-[1px] font-mono">Multiplier</span>
                                    <button onClick={applySpeed} className="font-['Outfit'] text-[16px] font-bold px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-[#94a3b8] uppercase hover:border-[#38bdf8] hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all">
                                        Set
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'producer' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full flex flex-col gap-6">
                            {/* Macro Switches */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                    ⚡ Stadium Atmosphere Overrides
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => sendControlEvent('MACRO_NOMINAL')} className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 rounded-xl font-bold font-['Outfit'] text-[13px] uppercase tracking-wider transition-all">
                                        🟢 Restore Nominal State
                                    </button>
                                    <button onClick={() => sendControlEvent('MACRO_MENDOZA')} className="w-full p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl font-bold font-['Outfit'] text-[13px] uppercase tracking-wider transition-all">
                                        🔴 Trigger Mendoza Firing
                                    </button>
                                </div>
                            </div>

                            {/* Manual Overlay Triggers */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                    🖼️ Live Overlay Injection
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { name: 'Spidey Wipe', event: 'OVERLAY_SPIDEY_WIPE' },
                                        { name: 'Crimson Bleed', event: 'OVERLAY_CRIMSON_BLEED' },
                                        { name: 'Fundies Grid', event: 'OVERLAY_FUNDIES_GRID' },
                                        { name: 'Apple Mask', event: 'OVERLAY_APPLE_MASK' }
                                    ].map(item => (
                                        <button
                                            key={item.event}
                                            onClick={() => sendControlEvent(item.event)}
                                            className="p-3 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400 text-white hover:text-cyan-400 rounded-xl font-bold text-[12px] uppercase transition-all"
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Stack Promotion */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                    🏷️ Silo Brand Overlays
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    <button
                                        onClick={() => sendControlEvent('BRAND_WEEDSTACK')}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white font-bold rounded-xl font-['Outfit'] text-[13px] uppercase tracking-wider shadow-lg transition-all"
                                    >
                                        🍀 Inject WeedStack (Lavender Fog)
                                    </button>
                                    <button
                                        onClick={() => sendControlEvent('BRAND_STACKLABS')}
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold rounded-xl font-['Outfit'] text-[13px] uppercase tracking-wider shadow-lg transition-all"
                                    >
                                        🔬 Inject StackLabs (Auditing)
                                    </button>
                                </div>
                            </div>

                            {/* Vector SVG Upload */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
                                    🎨 Media Injection Node
                                </h3>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('svg-file-picker')?.click()}
                                    className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragging ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-white/20 bg-black/20'}`}
                                >
                                    <input 
                                        id="svg-file-picker"
                                        type="file"
                                        accept=".svg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                                    <span className="font-['Outfit'] text-[13px] font-bold text-white mb-0.5">Drag & Drop SVG</span>
                                    <span className="text-[10px] text-slate-500 font-mono">or click to browse</span>
                                </div>

                                {uploadStatus !== 'idle' && (
                                    <div className={`mt-3 p-3 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
                                        uploadStatus === 'uploading' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                        uploadStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                        'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                        {uploadStatus === 'uploading' && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
                                        {uploadStatus === 'success' && <FileCheck className="w-3.5 h-3.5 shrink-0" />}
                                        {uploadStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                        <span>{uploadMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'builder' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 p-5 w-full flex flex-col gap-6">
                            {/* Condition Builder Form */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                    🛠️ Statcast Telemetry Condition Builder
                                </h3>

                                <form onSubmit={handleSaveRule} className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Rule Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Benge 105+ Rocket"
                                            value={ruleName}
                                            onChange={(e) => setRuleName(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FF5910] text-[13px]"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Telemetry Key</label>
                                        <select
                                            value={telemetryKey}
                                            onChange={(e) => setTelemetryKey(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FF5910] text-[13px] appearance-none"
                                        >
                                            <option value="pitch_speed">Pitch Speed (mph)</option>
                                            <option value="launch_speed">Launch Speed (mph)</option>
                                            <option value="outs">Outs</option>
                                            <option value="inning">Inning</option>
                                            <option value="events">Event (Play Result)</option>
                                            <option value="status_msg">Status Message (text)</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Operator</label>
                                        <select
                                            value={operator}
                                            onChange={(e) => setOperator(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FF5910] text-[13px] appearance-none"
                                        >
                                            <option value=">">&gt; (Greater Than)</option>
                                            <option value="<">&lt; (Less Than)</option>
                                            <option value="==">== (Equals)</option>
                                            <option value="CONTAINS">CONTAINS (Substring Match)</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Threshold / Match Value</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 100 or strikeout"
                                            value={ruleValue}
                                            onChange={(e) => setRuleValue(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FF5910] text-[13px]"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Overlay Action</label>
                                        <select
                                            value={actionType}
                                            onChange={(e) => setActionType(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FF5910] text-[13px] appearance-none"
                                        >
                                            <option value="spidey_wipe">Trigger Spidey Wipe</option>
                                            <option value="crimson_bleed">Trigger Crimson Bleed</option>
                                            <option value="fundies_grid">Trigger Fundies Grid</option>
                                            <option value="apple_mask">Trigger Apple Mask</option>
                                            <option value="weedstack">Trigger WeedStack Protocol</option>
                                            <option value="stacklabs">Trigger StackLabs Protocol</option>
                                        </select>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full py-2.5 bg-gradient-to-r from-[#FF5910] to-[#E24600] text-slate-950 font-bold rounded-xl font-['Outfit'] text-[13px] uppercase tracking-wider hover:opacity-90 transition-all mt-2"
                                    >
                                        💾 Save & Persist Rule
                                    </button>
                                </form>
                            </div>

                            {/* Rules Listing */}
                            <div className="bg-[#0b0f19]/60 border border-white/10 p-5 rounded-2xl flex-1 flex flex-col min-h-0">
                                <h3 className="font-['Outfit'] font-black text-white text-[15px] tracking-wide mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                    📋 Persisted Telemetry Rules List
                                </h3>

                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                    {loadingRules ? (
                                        <div className="text-center py-6 text-slate-500 font-mono text-[11px] flex justify-center items-center gap-2">
                                            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching overlay registry...
                                        </div>
                                    ) : rules.length === 0 ? (
                                        <div className="text-center py-6 text-slate-600 font-mono text-[11px] border border-white/5 border-dashed rounded-lg">
                                            No active overlay rules persisted.
                                        </div>
                                    ) : (
                                        rules.map(rule => {
                                            let cond = { key: '', operator: '', value: '' };
                                            let act = { type: '', duration_ms: 3000 };
                                            try {
                                                cond = JSON.parse(rule.trigger_condition);
                                                act = JSON.parse(rule.overlay_action);
                                            } catch (e) {}

                                            return (
                                                <div key={rule.sys_id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-start gap-2 text-[11px] font-mono">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-white text-[12px] truncate mb-0.5">{rule.rule_name}</div>
                                                        <div className="text-[#00FFCC]">
                                                            IF {cond.key} {cond.operator} {cond.value}
                                                        </div>
                                                        <div className="text-[#A855F7] mt-0.5">
                                                            THEN → {act.type} ({act.duration_ms}ms)
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteRule(rule.sys_id)}
                                                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded font-bold transition-all text-[10px]"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    </div> {/* End Tab Content scrollable */}
                </div> {/* End Controls Panel */}

                {/* Narrative Context Ingress (ZONE-4) */}
                <div className="bg-[#0b0f19] vm-panel-glass h-[420px] flex flex-col border border-white/10 overflow-hidden relative shrink-0 p-5" data-section="4">
                    <div className="zone-badge" style={{ top: '6px', right: '6px' }}>[ZONE-4] NARRATIVE CONTEXT INGRESS</div>
                    
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 mt-8">
                        <h3 className="text-[#38bdf8] font-['Outfit'] font-black tracking-widest text-xs uppercase">Narrative Ingress Dashboard</h3>
                        <span className="text-[9px] bg-cyan-950 text-[#38bdf8] border border-cyan-800 px-2 py-0.5 rounded uppercase font-bold tracking-wider font-mono font-sans">Relay Synced</span>
                    </div>

                    {/* Top controls: Target selection */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                        <div>
                            <label className="block text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1.5 font-sans">
                                Target Recipient
                            </label>
                            <select 
                                value={ingressTarget}
                                onChange={(e) => setIngressTarget(e.target.value)}
                                className="w-full bg-black/60 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-white focus:border-[#38bdf8]/50 outline-none transition-colors font-mono"
                            >
                                <option value="GLOBAL">🌐 ALL PERSONAS (Global)</option>
                                {personas.filter((p: any) => !p.id.match(/_\d+$/)).map((p: any) => (
                                    <option key={p.id} value={p.id}>👤 {p.name || p.id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1.5 font-sans">
                                Presets / Templates
                            </label>
                            <select 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) setIngressText(val);
                                    e.target.value = '';
                                }}
                                className="w-full bg-black/60 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-400 focus:border-[#38bdf8]/50 outline-none transition-colors font-mono"
                            >
                                <option value="">-- Apply Scenario Preset --</option>
                                {NARRATIVE_TEMPLATES.map(t => (
                                    <option key={t.title} value={t.prompt}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Textarea Input */}
                    <div className="flex-1 flex flex-col min-h-0 mb-4 text-left">
                        <label className="block text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1.5 font-sans">
                            Custom Backstory / Ingress Prompt
                        </label>
                        <textarea 
                            value={ingressText}
                            onChange={(e) => setIngressText(e.target.value)}
                            placeholder="Type a new narrative prompt or context event to broadcast into the room..."
                            className="w-full flex-1 bg-black/40 border border-slate-800 rounded-xl p-3 text-xs text-[#22c55e] focus:border-[#38bdf8]/50 outline-none transition-colors font-mono leading-relaxed resize-none custom-scrollbar"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-auto">
                        <button
                            onClick={() => setIngressText('')}
                            className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-gray-400 hover:text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSendIngress}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black uppercase tracking-widest text-[10px] font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Send size={12} />
                            Push Ingress Context
                        </button>
                    </div>
                </div>

            </div> {/* End Column 3 parent flex */}
        </div>

            {/* Mutate Persona Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0B0E14]/90 backdrop-blur-md flex items-center justify-center z-[200]">
                    <div className="w-[560px] flex flex-col rounded-[24px] border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(17,24,39,0.9)' }}>
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <span className="font-['Outfit'] text-[18px] font-bold tracking-[0.1em] text-white uppercase">
                                {editForm.sys_id ? `MUTATE DNA: ${editForm.name}` : `NEW PERSONA`}
                            </span>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.02] text-[#94a3b8] flex items-center justify-center hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all cursor-pointer">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                            {!editForm.sys_id && (
                                <div>
                                    <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Name</label>
                                    <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-3 rounded-xl outline-none focus:border-[#38bdf8]" />
                                </div>
                            )}
                            <div>
                                <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Short Description</label>
                                <input value={editForm.desc || ''} onChange={e => setEditForm({...editForm, desc: e.target.value})} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-3 rounded-xl outline-none focus:border-[#38bdf8]" />
                            </div>
                            <div>
                                <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Room (Game PK or GLOBAL)</label>
                                <select value={editForm.room || 'BENCHED'} onChange={e => setEditForm({...editForm, room: e.target.value})} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-3 rounded-xl outline-none focus:border-[#38bdf8] appearance-none font-mono text-sm">
                                    <option value="GLOBAL" className="bg-[#111827] text-white">GLOBAL</option>
                                    <option value="BENCHED" className="bg-[#111827] text-gray-500">BENCHED (Inactive)</option>
                                    {games.map(g => <option key={g.id} value={g.id} className="bg-[#111827] text-white">{g.text.replace(' (Live)', '')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Deep Lore / Advanced Prompt</label>
                                <textarea value={editForm.prompt || ''} onChange={e => setEditForm({...editForm, prompt: e.target.value})} className="w-full min-h-[160px] bg-black/30 border border-white/10 text-[#22c55e] font-['Inter'] text-[15px] p-3 rounded-xl outline-none focus:border-[#38bdf8] resize-y leading-[1.6]" />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-white/10 bg-black/20 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 font-['Outfit'] text-[15px] font-bold p-3.5 rounded-xl border border-white/10 text-[#94a3b8] uppercase tracking-[0.1em] hover:text-white hover:bg-white/[0.05] transition-all">Cancel</button>
                            <button onClick={savePersonaForm} className="flex-1 font-['Outfit'] text-[15px] font-bold p-3.5 rounded-xl border border-[#FF5910] bg-[#FF5910] text-[#0B0E14] uppercase tracking-[0.1em]  transition-all">Lock Trajectory</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Sliding Glassmorphic Detail Drawer/Panel */}
            {isDrawerOpen && (
                <div 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md transition-opacity duration-300 pointer-events-auto"
                />
            )}
            
            <div className={`fixed top-0 right-0 h-full w-full max-w-[500px] z-[160] bg-[#0d0e14]/90 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 ease-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto`}>
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <span className="font-['Outfit'] text-[18px] font-bold tracking-[0.1em] text-white uppercase font-bold">
                        Persona Burn Dossier
                    </span>
                    <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.02] text-[#94a3b8] flex items-center justify-center hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all cursor-pointer">
                        ✕
                    </button>
                </div>
                
                {selectedLeaderboardPersona ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-6 border-b border-white/5 flex gap-4 items-center shrink-0">
                            {getAvatar(selectedLeaderboardPersona) ? (
                                <img src={getAvatar(selectedLeaderboardPersona) || undefined} className="w-20 h-20 rounded-full object-cover border-2 border-[#FF5910]" alt="" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-black border border-white/10 text-white flex items-center justify-center font-black text-[24px]">
                                    {selectedLeaderboardPersona.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="font-['Outfit'] text-[24px] font-bold uppercase tracking-wider text-white mb-1">
                                    {selectedLeaderboardPersona}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchSeasonStats(selectedLeaderboardPersona)} className="font-['Outfit'] text-[12px] font-bold px-3 py-1 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/5 text-[#38bdf8] uppercase tracking-[0.05em] hover:bg-[#38bdf8]/20 transition-all">
                                        View History
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar2">
                            {showSeasonStats ? (
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-['Outfit'] text-[15px] font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Season Burn History</h4>
                                    {seasonStats.length === 0 ? (
                                        <div className="text-slate-500 font-mono text-[12px] italic">No historic burns logged.</div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {seasonStats.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-[12px]">
                                                    <div className="flex justify-between text-slate-500 mb-1">
                                                        <span>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Date Unknown'}</span>
                                                        <span className="text-emerald-400 font-bold">+{item.points} pts</span>
                                                    </div>
                                                    <div className="text-white italic">"{item.burn_quote || item.text}"</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-['Outfit'] text-[15px] font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Profile & Parameters</h4>
                                    {personaDetail ? (
                                        <div className="flex flex-col gap-4 text-[14px]">
                                            <div>
                                                <span className="text-[#64748b] block font-mono text-[11px] uppercase">Lore Prompts</span>
                                                <p className="text-emerald-400 font-mono text-[13px] bg-black/35 p-3 rounded-lg mt-1 border border-white/5 max-h-[220px] overflow-y-auto whitespace-pre-wrap">{personaDetail.system_prompt}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[#64748b] block font-mono text-[11px] uppercase">Team</span>
                                                    <span className="text-white font-bold">{personaDetail.team || 'GLOBAL'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#64748b] block font-mono text-[11px] uppercase">Zone</span>
                                                    <span className="text-white font-bold">{personaDetail.deployment_zone || 'GLOBAL'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#64748b] block font-mono text-[11px] uppercase">Boggs Reactivity</span>
                                                    <span className="text-white font-bold">{personaDetail.boggs_reactivity || 'medium'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#64748b] block font-mono text-[11px] uppercase">Cadence</span>
                                                    <span className="text-white font-bold">{personaDetail.cadence || 'pacer'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 font-mono text-[12px] animate-pulse">Loading Dossier...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-[13px]">Select a persona to view dossier.</div>
                )}
            </div>
        </div>
    );
}
