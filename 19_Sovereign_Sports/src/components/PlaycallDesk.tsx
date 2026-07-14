import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sliders, 
  Upload, 
  Power, 
  Cpu, 
  Radio, 
  Play, 
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Volume2,
  Send
} from 'lucide-react';
import TelemetryMapper from './TelemetryMapper';

interface WebslingerEvent {
  id: number;
  event_name: string;
  payload_template: string;
  default_duration_ms: number;
  active_status: number;
}

export default function PlaycallDesk() {
  // Global Interactivity (Dormant Switch)
  const [isDeskInteractive, setIsDeskInteractive] = useState(false);
  const [activeGameRoomId, setActiveGameRoomId] = useState<string>('GLOBAL');
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<'events' | 'board' | 'overrides' | 'takes' | 'system' | 'producer' | 'builder'>('events');

  // Condition Builder state variables
  const [rules, setRules] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [telemetryKey, setTelemetryKey] = useState('pitch_speed');
  const [operator, setOperator] = useState('>');
  const [ruleValue, setRuleValue] = useState('');
  const [actionType, setActionType] = useState('spidey_wipe');

  // Fetch registered overlay rules
  const fetchOverlayRules = async () => {
    setLoadingRules(true);
    try {
      const res = await axios.get('/api/sys_overlay_registry');
      if (res.data && res.data.status === 'success') {
        setRules(res.data.rules);
      }
    } catch (e) {
      console.error('Failed to fetch overlay rules', e);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'builder') {
      fetchOverlayRules();
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
      const res = await axios.post('/api/sys_overlay_registry', {
        rule_name: ruleName,
        trigger_condition: triggerCondition,
        overlay_action: overlayAction,
        active: 1
      });

      if (res.data && res.data.status === 'success') {
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
      const res = await axios.delete(`/api/sys_overlay_registry/${sysId}`);
      if (res.data && res.data.status === 'success') {
        fetchOverlayRules();
      }
    } catch (e) {
      console.error('Failed to delete rule', e);
      alert('Failed to delete rule.');
    }
  };


  
  // Webslinger events fetched from database
  const [events, setEvents] = useState<WebslingerEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // MARD system states synced from backend/WebSocket
  const [systemState, setSystemState] = useState({
    mard_engine: true,
    chaos_gating: true,
    barf_cypher: false,
    boggs_level: 2
  });

  // Drag & drop svg injection states
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  
  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Load active games and webslinger templates on mount
  useEffect(() => {
    fetchActiveGames();
    fetchWebslingerEvents();
  }, []);

  const fetchActiveGames = async () => {
    try {
      const res = await axios.get('/api/sports/active_games');
      if (res.data && Array.isArray(res.data)) {
        setAvailableGames(res.data);
        if (res.data.length > 0) {
          setActiveGameRoomId(res.data[0].game_pk);
        }
      }
    } catch (e) {
      console.error('Failed to fetch active games', e);
    }
  };

  const fetchWebslingerEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get('/api/webslinger_events');
      if (res.data && res.data.status === 'success') {
        setEvents(res.data.events);
      }
    } catch (e) {
      console.error('Failed to fetch webslinger events', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (availableGames && availableGames.length > 0) {
      // Zero-click hydration: Auto-select and load the first active game room
      // if only a single game is deployed or if no room has been loaded yet or is set to GLOBAL.
      if (availableGames.length === 1 || !activeGameRoomId || activeGameRoomId === 'GLOBAL') {
        const defaultGameId = String(availableGames[0].game_pk);
        console.log(`[STATE SYNC] Single or default game auto-load triggered: ${defaultGameId}`);
        setActiveGameRoomId(defaultGameId);
      }
    }
  }, [availableGames, activeGameRoomId]);

  // Manage WebSocket connection pool based on Dormant Switch (isDeskInteractive)
  useEffect(() => {
    if (!isDeskInteractive) {
      // Forcefully tear down WebSocket connection loop
      if (socketRef.current) {
        console.log('[CreatorConsole] Deactivating console... Tearing down WS connection pool.');
        socketRef.current.close();
        socketRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    // Connect to WebSocket pool
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const socketUrl = `${wsProtocol}//${wsHost}/mesh-ws?gamePk=${activeGameRoomId}`;
    
    console.log(`[CreatorConsole] Establishing low-latency connection: ${socketUrl}`);
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      console.log('[CreatorConsole] Connected to TMI WebSocket broadcast loop.');
      socket.send(JSON.stringify({ 
        type: 'JOIN_ROOM', 
        target_game_pk: activeGameRoomId, 
        room: activeGameRoomId 
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATE_UPDATE' && msg.system) {
          setSystemState({
            mard_engine: msg.system.mard_engine ?? true,
            chaos_gating: msg.system.chaos_gating ?? true,
            barf_cypher: msg.system.barf_cypher ?? false,
            boggs_level: msg.system.boggs_level ?? 2
          });
        }
      } catch (e) {
        console.error('Failed to parse websocket message', e);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
      console.log('[CreatorConsole] WebSocket connection pool closed.');
    };

    socket.onerror = (err) => {
      console.error('[CreatorConsole] WebSocket error:', err);
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isDeskInteractive, activeGameRoomId]);

  // Dispatch Web-Slinger Trigger
  const handleTriggerEvent = async (eventName: string, template: string) => {
    if (!isDeskInteractive || !wsConnected || !socketRef.current) {
      alert('⚠️ Playcall Desk is offline. Toggle the Dormant Switch to "Interactive" to engage controls.');
      return;
    }

    try {
      const payload = JSON.parse(template);
      socketRef.current.send(JSON.stringify({
        event: 'webslinger_trigger',
        room_id: activeGameRoomId,
        event_name: eventName,
        data: payload
      }));
      console.log(`[WEBSLINGER] Dispatched event: ${eventName} successfully.`);
    } catch (error) {
      console.error(`[WEBSLINGER ERROR] Failed to dispatch action payload:`, error);
    }
  };
  
  const sendControlEvent = async (trigger: string) => {
    if (!isDeskInteractive || !wsConnected || !socketRef.current) {
      alert('⚠️ Playcall Desk is offline. Toggle the Dormant Switch to "Interactive" to engage controls.');
      return;
    }

    try {
      socketRef.current.send(JSON.stringify({
        event: 'webslinger_trigger',
        room_id: activeGameRoomId,
        event_name: trigger,
        data: { trigger }
      }));
      console.log(`[SOUNDBOARD] WebSocket trigger sent: ${trigger}`);

      if (trigger === 'SIREN_PHYSICAL_OVERRIDE') {
        try {
          console.log('[SOUNDBOARD] Triggering physical Govee siren REST call...');
          await axios.post('/api/media/physical_siren');
        } catch (err) {
          console.error('Failed to trigger physical Govee siren:', err);
        }
      }
    } catch (error) {
      console.error(`[SOUNDBOARD ERROR] Failed to send control event:`, error);
    }
  };

  // Toggle MARD Config keys
  const handleToggleConfig = (key: 'engine' | 'chaos' | 'barf_cypher', currentValue: boolean) => {
    if (!isDeskInteractive || !wsConnected || !socketRef.current) {
      alert('⚠️ Playcall Desk is offline. Toggle the Dormant Switch to "Interactive" to engage controls.');
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'mard_config',
      key: key,
      value: !currentValue
    }));

    // Optimistic local update
    setSystemState(prev => ({
      ...prev,
      [key === 'engine' ? 'mard_engine' : key === 'chaos' ? 'chaos_gating' : 'barf_cypher']: !currentValue
    }));
  };

  // Adjust Boggs Chaos Level Slider
  const handleBoggsLevelChange = (level: number) => {
    if (!isDeskInteractive || !wsConnected || !socketRef.current) {
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'boggs_level',
      level: level
    }));

    setSystemState(prev => ({
      ...prev,
      boggs_level: level
    }));
  };

  // Drag & drop handlers for SVG injection
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadSvgFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await uploadSvgFile(file);
    }
  };

  const uploadSvgFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.svg')) {
      setUploadStatus('error');
      setUploadMessage('Only SVG files are supported.');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('Ingesting and processing vector graphics...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_id', activeGameRoomId);

      const res = await axios.post(`/api/media/inject?room_id=${activeGameRoomId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        setUploadStatus('success');
        setUploadMessage(`Successfully injected ${file.name} to mesh-network.`);
        setTimeout(() => setUploadStatus('idle'), 3000);
      } else {
        setUploadStatus('error');
        setUploadMessage(res.data.message || 'Injection failed.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setUploadMessage(err.response?.data?.detail || 'Ingestion engine subprocess failed.');
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 100px)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Upper Status / Header Area */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'rgba(10, 15, 30, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        {/* Target Zone Badge */}
        <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
          [ZONE-2] UPPER CONTROL BAR
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0A84FF, #00FFCC)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(10, 132, 255, 0.3)'
          }}>
            <Sliders size={24} color="#000" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px' }}>Playcall Desk</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Active Producer Creator Console • Low-Latency Control Deck
            </p>
          </div>
        </div>

        {/* Room selector, connection indicators, and global dormant switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Target Game Room
            </label>
            <select 
              value={activeGameRoomId}
              onChange={(e) => setActiveGameRoomId(e.target.value)}
              style={{
                background: '#090e1a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 12px',
                outline: 'none',
                minWidth: '220px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="GLOBAL">GLOBAL FEED</option>
              {availableGames.map((game: any) => (
                <option key={game.game_pk} value={game.game_pk}>
                  {game.away_team} @ {game.home_team} ({game.game_pk})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Connection Status
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: wsConnected ? 'rgba(0, 255, 204, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: wsConnected ? '1px solid rgba(0, 255, 204, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.85rem',
              color: wsConnected ? '#00FFCC' : '#EF4444',
              fontWeight: 600
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: wsConnected ? '#00FFCC' : '#EF4444',
                boxShadow: wsConnected ? '0 0 10px #00FFCC' : '0 0 10px #EF4444'
              }} />
              {wsConnected ? 'CROSSTALK ACTIVE' : 'DESK OFFLINE'}
            </div>
          </div>

          {/* Always Visible Dormant Switch (The Cognitive Safeguard) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Dormant Switch
            </span>
            <div 
              title="When toggled ON, the console spawns low-latency WebSocket connection loops and enables visual triggers. Toggling OFF safely shuts down all loops."
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: isDeskInteractive ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 0, 0, 0.25)',
                border: isDeskInteractive ? '1px solid rgba(10, 132, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '0.85rem',
                color: isDeskInteractive ? '#0A84FF' : '#fff',
                fontWeight: 600,
                height: '38px',
                boxSizing: 'border-box'
              }}
            >
              <Power size={14} color={isDeskInteractive ? '#0A84FF' : 'rgba(255,255,255,0.4)'} />
              <span>{isDeskInteractive ? 'INTERACTIVE' : 'DORMANT'}</span>
              <div 
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '20px',
                  background: isDeskInteractive ? '#0A84FF' : '#1e293b',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }} 
                onClick={() => setIsDeskInteractive(!isDeskInteractive)}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: isDeskInteractive ? '18px' : '2px',
                  width: '16px',
                  height: '16px',
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.3s'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Premium Frosted Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        padding: '0.5rem',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        width: 'fit-content'
      }}>
        {(['events', 'board', 'overrides', 'takes', 'system', 'producer', 'builder'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(10, 132, 255, 0.2), rgba(0, 255, 204, 0.2))' : 'transparent',
                color: isActive ? '#00FFCC' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? 'inset 0 0 12px rgba(0, 255, 204, 0.15), 0 0 10px rgba(10, 132, 255, 0.1)' : 'none',
                borderBottom: isActive ? '2px solid #00FFCC' : '2px solid transparent',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{
        minHeight: '400px',
        width: '100%',
        marginBottom: '2rem'
      }}>
        {activeTab === 'events' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Command Deck Panel */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-3] WEBSLINGER EVENTS
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <Radio size={18} color="#0A84FF" /> Web-Slinger Command Deck
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Trigger real-time visual overlays and Govee hardware flashes mesh-wide directly to active clients.
              </p>

              {loadingEvents ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                  <RefreshCw size={16} className="animate-spin" /> Fetching templates...
                </div>
              ) : events.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                  No active webslinger event templates found in database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {events.map((evt) => {
                    let parsed = { type: 'overlay', animation: 'unknown', audio: '' };
                    try {
                      parsed = JSON.parse(evt.payload_template);
                    } catch(e){}

                    return (
                      <button
                        key={evt.id}
                        onClick={() => handleTriggerEvent(evt.event_name, evt.payload_template)}
                        disabled={!isDeskInteractive}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          background: isDeskInteractive ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          opacity: isDeskInteractive ? 1 : 0.5
                        }}
                        onMouseEnter={(e) => {
                          if (isDeskInteractive) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isDeskInteractive) {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0A84FF' }}>
                            {evt.event_name.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                            Type: {parsed.type} • {evt.default_duration_ms}ms
                          </span>
                        </div>
                        <div style={{
                          background: 'rgba(10, 132, 255, 0.1)',
                          border: '1px solid rgba(10, 132, 255, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#0A84FF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Play size={12} fill="#0A84FF" /> FIRE
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Telemetry Trigger Mapper */}
            <TelemetryMapper isDeskInteractive={isDeskInteractive} availableGames={availableGames} />
          </div>
        )}

        {activeTab === 'board' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Tactile Soundboard Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-5] TACTILE SOUNDBOARD
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <Volume2 size={18} color="#FF5910" style={{ flexShrink: 0 }} /> Tactile Soundboard
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Execute low-latency digital triggers to client web clients or trigger physical IoT alerts.
              </p>

              <SoundboardModule sendControlEvent={sendControlEvent} />
            </div>
          </div>
        )}

        {activeTab === 'overrides' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Active Room States Controller */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-6] SYSTEM OVERRIDES
              </div>
              <div>
                <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                  <Cpu size={18} color="#ef4444" /> Active Room State Override
                </h3>

                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.75rem' }}>
                  Override the active live game environment parameters, lock systems, and toggle client connection state pools.
                </p>

                {/* Config Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                  
                  {/* MARD Engine Override */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>TMI Core Engine</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Real-time telemetry telemetry polling</span>
                    </div>
                    <button
                      onClick={() => handleToggleConfig('engine', systemState.mard_engine)}
                      disabled={!isDeskInteractive}
                      style={{
                        background: systemState.mard_engine ? '#00FFCC' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: systemState.mard_engine ? '#00FFCC' : 'rgba(255,255,255,0.15)',
                        color: systemState.mard_engine ? '#000' : 'rgba(255,255,255,0.4)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        minWidth: '80px'
                      }}
                    >
                      {systemState.mard_engine ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>

                  {/* Chaos Gating Shield */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chaos Gating Shield</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Dampen chatbot comment storms</span>
                    </div>
                    <button
                      onClick={() => handleToggleConfig('chaos', systemState.chaos_gating)}
                      disabled={!isDeskInteractive}
                      style={{
                        background: systemState.chaos_gating ? '#0A84FF' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: systemState.chaos_gating ? '#0A84FF' : 'rgba(255,255,255,0.15)',
                        color: systemState.chaos_gating ? '#fff' : 'rgba(255,255,255,0.4)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        minWidth: '80px'
                      }}
                    >
                      {systemState.chaos_gating ? 'SHIELDED' : 'UNGUARD'}
                    </button>
                  </div>

                  {/* Barf Cypher Cell Placement */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ef4444' }}>Cipher Cell Isolation</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Confine bot @barf to isolation channel</span>
                    </div>
                    <button
                      onClick={() => handleToggleConfig('barf_cypher', systemState.barf_cypher)}
                      disabled={!isDeskInteractive}
                      style={{
                        background: systemState.barf_cypher ? '#ef4444' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: systemState.barf_cypher ? '#ef4444' : 'rgba(255,255,255,0.15)',
                        color: systemState.barf_cypher ? '#fff' : 'rgba(255,255,255,0.4)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        minWidth: '80px'
                      }}
                    >
                      {systemState.barf_cypher ? 'JAIL CELL' : 'ROAMING'}
                    </button>
                  </div>

                  {/* Boggs Chaos level slider */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Boggs Toxicity Index</span>
                      <span style={{ color: '#00FFCC', fontWeight: 700 }}>Level {systemState.boggs_level} / 5</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="5"
                      value={systemState.boggs_level}
                      onChange={(e) => handleBoggsLevelChange(parseInt(e.target.value))}
                      disabled={!isDeskInteractive}
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        outline: 'none',
                        cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                        accentColor: '#00FFCC'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'takes' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Custom Video Broadcast Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-7] VIDEO BROADCAST
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <Play size={18} color="#00FFCC" style={{ flexShrink: 0 }} /> Custom Video Broadcast
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Fire custom 90s felt puppet videos directly into the watch party chat lobby.
              </p>

              <VideoBroadcastModule 
                isDeskInteractive={isDeskInteractive} 
                wsConnected={wsConnected} 
                socket={socketRef.current} 
                activeGameRoomId={activeGameRoomId} 
              />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Media Injection Node */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-8] MEDIA INJECTION
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <Upload size={18} color="#00FFCC" /> Media Injection Node
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Drag and drop vector SVG graphics directly. The database cataloging pipeline registers, saves, and projects overlays into the chat room.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '220px',
                  border: dragging ? '2px dashed #00FFCC' : '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  background: dragging ? 'rgba(0, 255, 204, 0.04)' : 'rgba(0, 0, 0, 0.25)',
                  cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  padding: '1.5rem',
                  textAlign: 'center',
                  position: 'relative',
                  opacity: isDeskInteractive ? 1 : 0.5
                }}
                onClick={() => {
                  if (isDeskInteractive) {
                    document.getElementById('file-picker-input')?.click();
                  }
                }}
              >
                <input 
                  id="file-picker-input"
                  type="file"
                  accept=".svg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={!isDeskInteractive}
                />

                <Upload size={40} color={dragging ? '#00FFCC' : 'rgba(255,255,255,0.3)'} style={{ marginBottom: '1rem' }} />
                
                <span style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', color: dragging ? '#00FFCC' : '#fff' }}>
                  Drag & Drop SVG Graphic
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  or click to browse local files
                </span>
              </div>

              {/* Status Display Area */}
              {uploadStatus !== 'idle' && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 
                    uploadStatus === 'uploading' ? 'rgba(10, 132, 255, 0.1)' : 
                    uploadStatus === 'success' ? 'rgba(0, 255, 204, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: 
                    uploadStatus === 'uploading' ? '1px solid rgba(10, 132, 255, 0.2)' : 
                    uploadStatus === 'success' ? '1px solid rgba(0, 255, 204, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  color: 
                    uploadStatus === 'uploading' ? '#0A84FF' : 
                    uploadStatus === 'success' ? '#00FFCC' : '#EF4444'
                }}>
                  {uploadStatus === 'uploading' && <RefreshCw size={16} className="animate-spin" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {uploadStatus === 'success' && <FileCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {uploadStatus === 'error' && <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <span>{uploadMessage}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'producer' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Macro Overrides Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-9] MACRO ATMOSPHERE OVERRIDES
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#FFF' }}>
                ⚡ Macro Override Switches
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Engage global stadium atmosphere macro states.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => sendControlEvent('MACRO_NOMINAL')}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(0, 255, 204, 0.1)',
                    color: '#00FFCC',
                    fontWeight: 'bold',
                    border: '1px solid #00FFCC',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                >
                  🟢 Restore Nominal State (Reset Overlays)
                </button>
                <button
                  onClick={() => sendControlEvent('MACRO_MENDOZA')}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    fontWeight: 'bold',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                >
                  🔴 Trigger Mendoza Firing (Max Chaos)
                </button>
              </div>
            </div>

            {/* Manual Overlay Triggers Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-10] MANUAL OVERLAY TRIGGERS
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#FFF' }}>
                🖼️ Manual Overlay Triggers
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Inject overlay graphics directly into the live watchparty viewport.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { name: 'Spidey Wipe', event: 'OVERLAY_SPIDEY_WIPE' },
                  { name: 'Crimson Bleed', event: 'OVERLAY_CRIMSON_BLEED' },
                  { name: 'Fundies Grid', event: 'OVERLAY_FUNDIES_GRID' },
                  { name: 'Apple Mask', event: 'OVERLAY_APPLE_MASK' }
                ].map(item => (
                  <button
                    key={item.event}
                    onClick={() => sendControlEvent(item.event)}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#FFF',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Injectors Card */}
            <div style={{
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#FFF' }}>
                🏷️ Silo Brand Injectors
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Inject WeedStack decompression or StackLabs architectural overlays.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => sendControlEvent('BRAND_WEEDSTACK')}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #A855F7, #C084FC)',
                    color: '#FFF',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                  }}
                >
                  🍀 Inject WeedStack (Lavender Fog & 420 Clock)
                </button>
                <button
                  onClick={() => sendControlEvent('BRAND_STACKLABS')}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #0284C7, #00FFCC)',
                    color: '#FFF',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
                  }}
                >
                  🔬 Inject StackLabs (Architectural Analysis)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Condition Form Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-11] NO-CODE RULE BUILDER
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#FFF' }}>
                🛠️ No-Code Telemetry Condition Builder
              </h3>
              
              <form onSubmit={handleSaveRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Rule Name</label>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Strikeout Sparker"
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Telemetry Key</label>
                  <select
                    value={telemetryKey}
                    onChange={(e) => setTelemetryKey(e.target.value)}
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                  >
                    <option value="pitch_speed">Pitch Speed (mph)</option>
                    <option value="launch_speed">Launch Speed (mph)</option>
                    <option value="outs">Outs</option>
                    <option value="inning">Inning</option>
                    <option value="events">Event (Play Result)</option>
                    <option value="status_msg">Status Message (text)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Operator</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                  >
                    <option value=">">&gt; (Greater Than)</option>
                    <option value="<">&lt; (Less Than)</option>
                    <option value="==">== (Equals)</option>
                    <option value="CONTAINS">CONTAINS (Substring Match)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Threshold / Match Value</label>
                  <input
                    type="text"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder="e.g. 100 or strikeout"
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Overlay Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
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
                  style={{
                    padding: '10px 16px',
                    background: '#00FFCC',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'background 0.2s'
                  }}
                >
                  💾 Save & Persist Rule
                </button>
              </form>
            </div>

            {/* Rules Listing Card */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 15, 30, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Target Zone Badge */}
              <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
                [ZONE-12] PERSISTED RULES LIST
              </div>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#FFF' }}>
                📋 Persisted Telemetry Rules List
              </h3>
              
              {loadingRules ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  <RefreshCw size={16} className="animate-spin" /> Fetching persisted rules from sys_overlay_registry...
                </div>
              ) : rules.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  No telemetry rules registered. Build and save one above to persist it in the database.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        <th style={{ padding: '8px 12px' }}>Rule Name</th>
                        <th style={{ padding: '8px 12px' }}>Trigger Condition</th>
                        <th style={{ padding: '8px 12px' }}>Overlay Action</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => {
                        let cond = { key: '', operator: '', value: '' };
                        let act = { type: '', duration_ms: 3000 };
                        try {
                          cond = JSON.parse(rule.trigger_condition);
                          act = JSON.parse(rule.overlay_action);
                        } catch (e) {}

                        return (
                          <tr key={rule.sys_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '12px 12px', fontWeight: 'bold', color: '#FFF' }}>{rule.rule_name}</td>
                            <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#00FFCC' }}>
                              {cond.key} {cond.operator} {cond.value}
                            </td>
                            <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#A855F7' }}>
                              {act.type} ({act.duration_ms}ms)
                            </td>
                            <td style={{ padding: '12px 12px' }}>
                              <span style={{ background: 'rgba(0,255,204,0.1)', color: '#00FFCC', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>ACTIVE</span>
                            </td>
                            <td style={{ padding: '12px 12px' }}>
                              <button
                                onClick={() => handleDeleteRule(rule.sys_id)}
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const soundboardRegistry = [
  { id: 'siren_alert', label: '🚨 Trigger Siren', trigger: 'SIREN_PHYSICAL_OVERRIDE' },
  { id: 'ghost_fork', label: '👻 Ghost Fork FX', trigger: 'EMIT_CHAT_AUDIO_GHOST' },
  { id: 'spidy_blast', label: '🕸️ Spidey Swing Takeover', trigger: 'SPIDEY_THWIP_OVERLAY' },
  { id: 'outrage_shake', label: '🫨 Outrage Screen Shake', trigger: 'OUTRAGE_PROXY_ALERT' },
  { id: 'color_strobe', label: '✨ Govee Strobe Flash', trigger: 'GOVEE_BLUE_ORANGE_FLASH' },
  { id: 'airbender', label: '🌪️ Air Bender Overlay', trigger: 'AIRBENDER_OVERLAY' },
  { id: 'mets_blow_it', label: '🔥 Mets Blow It', trigger: 'METS_BLOW_IT_OVERLAY' },
  { id: 'mets_win', label: '🎉 Mets Win Cardiac', trigger: 'METS_WIN_OVERLAY' }
];

export function SoundboardModule({ sendControlEvent }: { sendControlEvent: (trigger: string) => void }) {
  return (
    <div 
      className="sports-desk-soundboard-grid" 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        padding: '1rem',
        background: '#090e1a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px'
      }}
    >
      {soundboardRegistry.map((btn) => (
        <button 
          key={btn.id}
          className="desk-control-btn"
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onClick={() => sendControlEvent(btn.trigger)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

interface VideoBroadcastProps {
  isDeskInteractive: boolean;
  wsConnected: boolean;
  socket: WebSocket | null;
  activeGameRoomId: string;
}

const availableVideos = [
  { id: 'battery_chucker', name: '🔋 Battery Chucker Classic', url: '/videos/battery_chucker.mp4', desc: 'Old version of BatteryChucker' },
  { id: 'puppet_collapses', name: '💥 Puppet Collapses', url: '/videos/puppet_collapses.mp4', desc: 'Wardy puppet collapsing' },
  { id: 'puppets_celebrating', name: '🎉 Puppets Celebrating', url: '/videos/puppets_celebrating.mp4', desc: 'Felt puppets celebrating' },
  { id: 'flowmercial', name: '📺 Sovereign Flowmercial', url: '/videos/flowmercial.mp4', desc: 'Official commercial stream' }
];

export function VideoBroadcastModule({ isDeskInteractive, wsConnected, socket, activeGameRoomId }: VideoBroadcastProps) {
  const [selectedVideo, setSelectedVideo] = useState(availableVideos[0].url);
  const [caption, setCaption] = useState('🚨 Battery Chucker in action!');

  const handleBroadcast = () => {
    if (!isDeskInteractive || !wsConnected || !socket) {
      alert('⚠️ Playcall Desk is offline. Toggle the Dormant Switch to "Interactive" to engage controls.');
      return;
    }

    try {
      socket.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        user: 'james (Pilot)',
        text: caption,
        mediaUrl: selectedVideo,
        target_game_pk: activeGameRoomId || 'GLOBAL'
      }));
      console.log(`[VIDEO BROADCAST] Fired video: ${selectedVideo} with caption: "${caption}"`);
    } catch (err) {
      console.error('[VIDEO BROADCAST ERROR] Failed to dispatch video message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Select Video Asset</label>
        <select 
          value={selectedVideo}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedVideo(val);
            const found = availableVideos.find(v => v.url === val);
            if (found) {
              if (found.id === 'battery_chucker') setCaption('🚨 Battery Chucker in action!');
              else if (found.id === 'puppet_collapses') setCaption('💥 Puppet down! Puppet down!');
              else if (found.id === 'puppets_celebrating') setCaption('🎉 Celebrating the home run in style!');
              else if (found.id === 'flowmercial') setCaption('📺 TMI Flowmercial Broadcast');
            }
          }}
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '0.85rem'
          }}
        >
          {availableVideos.map(v => (
            <option key={v.id} value={v.url} style={{ background: '#090e1a' }}>{v.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Broadcast Caption</label>
        <input 
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter a custom caption..."
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '0.85rem'
          }}
        />
      </div>

      <button
        onClick={handleBroadcast}
        disabled={!isDeskInteractive}
        style={{
          padding: '12px',
          background: isDeskInteractive ? '#00FFCC' : 'rgba(255, 255, 255, 0.05)',
          color: isDeskInteractive ? '#000' : 'rgba(255, 255, 255, 0.3)',
          fontWeight: 'bold',
          borderRadius: '6px',
          border: 'none',
          cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <Send size={16} /> Broadcast Video to Chat
      </button>
    </div>
  );
}
