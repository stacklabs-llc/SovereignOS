import React, { useState, useEffect, useRef } from 'react';
import avatarMap from '../avatarMap';
import HoloDexApp from './HoloDex/HoloDexApp';

const API_PORT = "8096";
const WS_PORT = "8000";

export default function PlaycallDesk() {
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState('dot');
    const [messages, setMessages] = useState<any[]>([{ type: 'system', author: 'SOVEREIGN', text: 'Playcall Desk v2.5 Online. Integrated into FanStack.', id: Date.now() }]);
    const [boggsLevel, setBoggsLevel] = useState(2);
    const [activeTab, setActiveTab] = useState('events');
    const [games, setGames] = useState<any[]>([]);
    const [rawGames, setRawGames] = useState<any[]>([]);
    const [selectedGame, setSelectedGame] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
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

    const openEditModal = (p?: any) => {
        if (p) setEditForm({ ...p });
        else setEditForm({ name: '', desc: '', team: 'GLOBAL', room: 'GLOBAL', engine: 'gemini-flash', boggs: 'medium', cadence: 'pacer', prompt: '' });
        setIsModalOpen(true);
    };

    const savePersonaForm = async () => {
        try {
            if (editForm.sys_id) {
                // Let's attempt the Parity Update, but fail gracefully if sys_user doesn't exist.
                try {
                    await fetch(`${getApiHost()}/api/now/table/sys_user/${editForm.sys_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: editForm.desc,
                            department: editForm.engine,
                            introduction: editForm.prompt
                        })
                    });
                } catch(err) { console.warn("sys_user parity sync skipped.", err); }
                
                const res = await fetch(`${getApiHost()}/api/personas/${editForm.sys_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deployment_zone: editForm.room,
                        llm_engine: editForm.engine,
                        system_prompt: editForm.prompt
                    })
                });
            } else {
                // Create
                await fetch(`${getApiHost()}/api/personas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: editForm.name,
                        team: editForm.team || 'GLOBAL',
                        deployment_zone: editForm.room || 'GLOBAL',
                        llm_engine: editForm.engine || 'gemini-flash',
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

    useEffect(() => {
        initPersonas();
        initGames();
        initTmiScenarios();
        connectWS();
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        const gamesInterval = setInterval(initGames, 15000);
        return () => { 
            wsRef.current?.close(); 
            clearInterval(interval);
            clearInterval(gamesInterval);
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
            // Pulling from the Sovereign DB's persona endpoint directly
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
                        engine: r.llm_engine,
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
                    engine: 'gemini-flash',
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
            // Implement 11 AM MLB Rollover Constraint
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
                // Sort to put live games first
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
                addMsg('system', 'SOVEREIGN', 'Mesh connected on :8008');
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

    const addMsg = (type: string, author: string, text: string) => {
        setMessages(prev => {
            const recent = prev.slice(-10);
            if (recent.some(m => m.author === author && m.text === text)) return prev;
            return [...prev.slice(-99), { type, author, text, id: Date.now() + Math.random() }];
        });
    };

    const togglePersonaActive = async (p: any) => {
        // Toggle active status via CMDB API
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
            // Hit the persisted DB export API (game_chat + game_play merged)
            const url = `${apiHost}/api/game-log/export/${selectedGame}/${format}`;
            window.open(url, '_blank');
        } else {
            // Fallback: in-memory session dump in requested format
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
                // markdown
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
        const events: any = { home_run: 'Home Run triggered', strikeout: 'Strikeout triggered', spam_logo: 'Spam Mets Logo', boggs_max: 'BOGGS LEVEL 5 ACTIVATED', brawl: 'BENCHES CLEARED!' };
        addMsg('system', 'SOVEREIGN', events[e] || e);
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
        setBoggs(2); // Escalate slightly
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
            target_game_pk: selectedGame || "823130"
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
        return 'text-[#f59e0b]'; // system-color
    };

    return (
        <div className="h-full max-h-[95vh] mx-auto p-3 bg-void vm-body rounded-2xl border border-white/10 relative overflow-hidden flex flex-col z-10 w-full mb-4" style={{ zoom: 0.75 }}>

            {/* Penalty Box Modal UI */}
            {penaltyBox && (
                <div className="absolute top-16 right-4 w-[500px] z-[100] animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-none">
                    <div className="bg-[#111827]/98 backdrop-blur-xl rounded-[24px] border border-[#ff003c]/50 shadow-[0_30px_60px_rgba(255,0,60,0.25),inset_0_0_30px_rgba(255,0,60,0.1)] overflow-hidden flex flex-col relative pointer-events-auto">
                        <div className="bg-gradient-to-r from-[#ff003c]/20 via-[#ff003c] to-[#ff003c]/20 text-white font-['Outfit'] font-black text-[16px] tracking-[0.3em] py-2.5 text-center  relative overflow-hidden">
                            <span className="relative z-10 drop-">🎙️ 8-MILE RECORDING STUDIO</span>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                        </div>
                        <div className="p-6 flex flex-col gap-5 relative">
                            {/* Decorative background grid */}
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

            {/* Main Area */}
            <div className="flex-1 min-h-0 relative z-10 p-4 gap-4 mx-auto w-full grid" style={{ gridTemplateColumns: '300px 1fr 360px' }}>
                
                {/* Personas Panel */}
                <div className="vm-panel-glass flex flex-col border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between p-4 pb-2.5 bg-black/40 border-b border-white/10 shrink-0">
                        <span className="font-['Outfit'] text-[16px] font-bold tracking-[0.12em] text-[#64748b] uppercase">Personas</span>
                        <button onClick={() => openEditModal()} className="font-['Inter'] text-[15px] font-bold px-3 py-1.5 rounded-full border border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10 uppercase tracking-[0.04em] hover:bg-[#22c55e]/20 hover:-translate-y-[1px] hover:shadow-[0_5px_15px_rgba(34,197,94,0.2)] transition-all">
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
                <div className="vm-panel-glass flex flex-col border border-white/10 overflow-hidden bg-[#0B0E14]">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-['Outfit'] text-[12px] font-black text-white tracking-[0.2em] uppercase">Sovereign Insights</span>
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
                            const textContent = m.text.replace(new RegExp(`^\\[?(?:${m.author}|${m.author.replace(/_\\d+$/, '')})\\]?\\s*:?\\s*`, 'i'), '');
                            
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
                    <div className="flex gap-2 p-3 shrink-0 bg-black/40 border-t border-white/10">
                        <input 
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

                {/* Controls Panel (Right) */}
                <div className="vm-panel-glass flex flex-col border border-white/10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="flex border-b border-white/10 bg-black/20 shrink-0">
                        {['EVENTS','BOARD','OVERRIDES','TAKES','SYSTEM'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`flex-1 overflow-hidden truncate px-1 py-4 font-['Outfit'] text-[11px] font-bold tracking-[0.05em] uppercase border-b-2 transition-all ${activeTab === tab.toLowerCase() ? 'text-[#FF5910] border-[#FF5910] bg-[#FF5910]/5' : 'text-[#94a3b8] border-transparent hover:text-white hover:bg-white/[0.02]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'holodex' && (
                        <div className="flex-1 w-full h-full relative animate-in fade-in slide-in-from-bottom-2">
                            <HoloDexApp />
                        </div>
                    )}

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
                                    <h3 className="text-cyan-400 font-bold tracking-widest text-xs">🎛️ NARRATIVE INGRESS SWITCHBOARD v2.0 — STACK SEEDER</h3>
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

                                {/* Target Advocate Selection (Cross-Talk) */}
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
                                            🌿 WeedStack
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('gonzas')} className="border border-amber-500/30 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            🌮 Gonzas
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('stacklabs')} className="border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            💻 StackLabs
                                        </button>
                                        <button onClick={() => fireSwitchboardCampaign('anvil_twine')} className="border border-yellow-600/30 hover:border-yellow-500 bg-yellow-950/20 hover:bg-yellow-950/40 text-yellow-500 py-3 px-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all">
                                            🛠️ Anvil & Twine
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
                                    if(i === 0) rankColor = "text-[#eab308] drop-";
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
                                                {i === 0 && <div className="absolute -top-2 -right-3 text-[16px] drop-">👑</div>}
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
                                
                                <label className="block text-[12px] text-[#94a3b8] uppercase tracking-wider mb-2 font-bold">Select Persona</label>
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

                                <label className="block text-[12px] text-[#94a3b8] uppercase tracking-wider mb-2 font-bold">Custom Topic (Optional)</label>
                                <textarea 
                                    value={hotTakeTopic}
                                    onChange={(e) => setHotTakeTopic(e.target.value)}
                                    placeholder="e.g. 'The DH Rule', 'Billionaire Owners', 'Robo Umps'"
                                    className="w-full min-h-[90px] bg-black/30 border border-white/10 text-[#ff003c] font-['Inter'] text-[16px] p-3 rounded-xl resize-y outline-none leading-[1.6] transition-all focus:border-[#ff003c] focus:shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_0_15px_rgba(255,0,60,0.2)] placeholder:text-[#64748b] mb-4"
                                ></textarea>
                                
                                <button 
                                    onClick={executeTargetedRant} 
                                    disabled={!takePersona && !selectedPersona}
                                    className="w-full font-['Outfit'] text-[16px] font-bold p-4 rounded-xl border border-[#ff003c]/50 bg-[#ff003c]/10 text-[#ff003c] uppercase tracking-[0.1em] hover:bg-[#ff003c] hover:text-white hover:-translate-y-[1px]  transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
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
                                    <span className="text-[16px] text-[#94a3b8] uppercase tracking-[1px]">Multiplier</span>
                                    <button onClick={applySpeed} className="font-['Outfit'] text-[16px] font-bold px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-[#94a3b8] uppercase hover:border-[#38bdf8] hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all">
                                        Set
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal */}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Engine</label>
                                    <select value={editForm.engine || ''} onChange={e => setEditForm({...editForm, engine: e.target.value})} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-3 rounded-xl outline-none focus:border-[#38bdf8] appearance-none">
                                        <option value="gemini-2.5-flash" className="bg-[#111827] text-white">Gemini Flash</option>
                                        <option value="gemini-2.5-pro" className="bg-[#111827] text-white">Gemini Pro</option>
                                        <option value="mistral:latest" className="bg-[#111827] text-white">Mistral (Local)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-['Outfit'] text-[15px] font-bold tracking-[0.15em] text-[#64748b] uppercase mb-2 block">Room (Game PK or GLOBAL)</label>
                                    <select value={editForm.room || 'BENCHED'} onChange={e => setEditForm({...editForm, room: e.target.value})} className="w-full bg-black/30 border border-white/10 text-white font-['Inter'] text-[16px] p-3 rounded-xl outline-none focus:border-[#38bdf8] appearance-none">
                                        <option value="GLOBAL" className="bg-[#111827] text-white">GLOBAL</option>
                                        <option value="BENCHED" className="bg-[#111827] text-gray-500">BENCHED (Inactive)</option>
                                        {games.map(g => <option key={g.id} value={g.id} className="bg-[#111827] text-white">{g.text.replace(' (Live)', '')}</option>)}
                                    </select>
                                </div>
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
                    <span className="font-['Outfit'] text-[18px] font-bold tracking-[0.1em] text-white uppercase">
                        Persona Burn Dossier
                    </span>
                    <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.02] text-[#94a3b8] flex items-center justify-center hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all cursor-pointer">
                        ✕
                    </button>
                </div>
                
                {selectedLeaderboardPersona ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Header: avatar, name, rank, chips */}
                        <div className="p-6 border-b border-white/10 shrink-0 bg-black/20 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                {getAvatar(selectedLeaderboardPersona) ? (
                                    <img src={getAvatar(selectedLeaderboardPersona)!} className="w-16 h-16 rounded-full border-2 border-white/10 object-cover shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt="" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-black text-white flex items-center justify-center font-black text-2xl uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                        {selectedLeaderboardPersona.substring(0, 2)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-['Outfit'] text-2xl font-black text-white uppercase tracking-wider leading-none mb-1">
                                        {selectedLeaderboardPersona}
                                    </h2>
                                    <div className="text-[14px] text-[#94a3b8] font-mono">
                                        Today's Standings: <span className="text-[#FF5910] font-bold">Rank #{personaDetail?.today?.rank || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Stat Chips */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gradient-to-br from-[#FF5910]/20 to-[#FF5910]/5 border border-[#FF5910]/20 rounded-xl p-3 text-center">
                                    <div className="text-[11px] text-[#94a3b8] font-bold tracking-[0.05em] uppercase mb-1">Total Burn</div>
                                    <div className="text-xl font-black text-[#FF5910] font-['Outfit']">{personaDetail?.today?.total_burn || 0}</div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
                                    <div className="text-[11px] text-[#94a3b8] font-bold tracking-[0.05em] uppercase mb-1">🔥 Heat Index</div>
                                    <div className="text-xl font-black text-amber-400 font-['Outfit']">{Math.floor((personaDetail?.today?.heat_index || 0))}</div>
                                </div>
                                <div className="bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-600/20 rounded-xl p-3 text-center">
                                    <div className="text-[11px] text-[#94a3b8] font-bold tracking-[0.05em] uppercase mb-1">🥊 TKOs</div>
                                    <div className="text-xl font-black text-red-500 font-['Outfit']">{personaDetail?.today?.tko_count || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Feed section */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar2">
                            {showSeasonStats ? (
                                // Season Stats history
                                <>
                                    <h3 className="font-['Outfit'] text-[14px] font-bold tracking-[0.1em] text-[#64748b] uppercase mb-2">Historical Season Stats (Last 30 Days)</h3>
                                    {seasonStats.length === 0 ? (
                                        <div className="text-center py-10 text-[#64748b] font-mono text-[14px] uppercase tracking-wider">
                                            No archived season history found
                                        </div>
                                    ) : (
                                        seasonStats.map((historyItem: any, idx: number) => (
                                            <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <span className="font-mono text-sm text-white/90 font-bold">{new Date(historyItem.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="text-[11px] text-[#FF5910] font-black font-['Outfit'] bg-[#FF5910]/10 px-2 py-0.5 rounded border border-[#FF5910]/20">ARCHIVE</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                    <div>
                                                        <div className="text-[#64748b] font-bold mb-0.5">BURN</div>
                                                        <div className="text-sm font-black text-white font-['Outfit']">{historyItem.score}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[#64748b] font-bold mb-0.5">HEAT</div>
                                                        <div className="text-sm font-black text-white font-['Outfit']">{Math.floor(historyItem.heat_index || 0)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[#64748b] font-bold mb-0.5">TKO</div>
                                                        <div className="text-sm font-black text-white font-['Outfit']">{historyItem.tkos || 0}</div>
                                                    </div>
                                                </div>
                                                {historyItem.top_burn && (
                                                    <div className="mt-1 font-['Courier_New'] text-xs text-emerald-400 bg-black/60 p-2.5 rounded border border-white/5">
                                                        <div className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider mb-1 font-sans">Top Burn Moment:</div>
                                                        "{historyItem.top_burn}"
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </>
                            ) : (
                                // Today's Chronological Burns
                                <>
                                    <h3 className="font-['Outfit'] text-[14px] font-bold tracking-[0.1em] text-[#64748b] uppercase mb-2">Today's Chronological Burns</h3>
                                    {!personaDetail || !personaDetail.burns || personaDetail.burns.length === 0 ? (
                                        <div className="text-center py-10 text-[#64748b] font-mono text-[14px] uppercase tracking-wider">
                                            No burns recorded today
                                        </div>
                                    ) : (
                                        personaDetail.burns.map((burn: any) => {
                                            const targetAvatar = getAvatar(burn.target);
                                            // burn severity color logic
                                            let badgeBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                                            if (burn.score >= 8) badgeBg = "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]";
                                            else if (burn.score >= 5) badgeBg = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                                            
                                            return (
                                                <div key={burn.sys_id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-3 relative group">
                                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                        <span className="text-[11px] text-[#64748b] font-mono">
                                                            Game ID: {burn.game_pk || 'GLOBAL'}
                                                        </span>
                                                        <span className="text-[11px] text-[#64748b] font-mono">
                                                            {new Date(burn.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-[#64748b] font-bold uppercase tracking-wide">Target:</span>
                                                        <div className="flex items-center gap-1.5 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/5">
                                                            {targetAvatar ? (
                                                                <img src={targetAvatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-[8px] font-black uppercase">
                                                                    {burn.target ? burn.target.substring(0,2) : '??'}
                                                                </div>
                                                            )}
                                                            <span className="font-['Outfit'] text-[12px] font-bold text-white/90">
                                                                @{burn.target ? burn.target.replace(/_\d+$/, '') : 'GLOBAL'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="font-['Courier_New'] font-bold text-[14px] leading-[1.5] text-white/90 bg-black/80 p-3 rounded-lg border border-white/5 relative z-10 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                                                        "{burn.message}"
                                                    </div>
                                                    
                                                    <div className="flex gap-2 mt-1">
                                                        <span className={`font-['Outfit'] text-[10px] font-black px-2.5 py-0.5 rounded border ${badgeBg}`}>
                                                            SCORE: {burn.score}
                                                        </span>
                                                        <span className="font-['Outfit'] text-[10px] font-bold px-2.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                                            HEAT: {Math.floor(burn.heat_index)}
                                                        </span>
                                                        {burn.is_tko && (
                                                            <span className="font-['Outfit'] text-[10px] font-black px-2.5 py-0.5 rounded border border-red-500/50 bg-red-500/20 text-white animate-pulse">
                                                                🥊 TKO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            )}
                        </div>
                        
                        {/* Footer drawer actions */}
                        <div className="p-6 border-t border-white/10 bg-black/40 shrink-0 flex gap-3">
                            {showSeasonStats ? (
                                <button 
                                    onClick={() => setShowSeasonStats(false)} 
                                    className="flex-1 font-['Outfit'] text-[14px] font-bold p-3 rounded-xl border border-white/10 text-[#94a3b8] uppercase tracking-[0.1em] hover:text-white hover:bg-white/[0.05] transition-all"
                                >
                                    Back to Today's Ledger
                                </button>
                            ) : (
                                <button 
                                    onClick={() => fetchSeasonStats(selectedLeaderboardPersona)} 
                                    className="flex-1 font-['Outfit'] text-[14px] font-bold p-3 rounded-xl border border-[#FF5910] bg-[#FF5910]/10 text-[#FF5910] uppercase tracking-[0.1em] hover:bg-[#FF5910] hover:text-[#0b0e14] transition-all"
                                >
                                    View Season Stats History
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-[#64748b] font-mono text-[14px] uppercase">
                        Loading Burn Records...
                    </div>
                )}
            </div>
        </div>
    );
}
