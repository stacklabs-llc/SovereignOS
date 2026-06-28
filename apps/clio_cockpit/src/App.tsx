import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Activity, 
  Terminal, 
  RotateCw, 
  XCircle, 
  Play, 
  Pause, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  BookOpen,
  Search,
  Plus,
  Save,
  Trash2,
  Edit2,
  Eye
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  script: string;
  status: 'Running' | 'Stopped' | 'Warning' | 'Crashed';
  pid: number | null;
  cpu: number;
  ram: number;
}

interface KBArticle {
  sys_id: string;
  number: string;
  topic: string;
  short_description: string;
  text?: string;
  workflow_state: string;
  sys_created_on: string;
  sys_updated_on: string;
  u_source?: string;
  u_tags?: string;
}

interface TelemetryData {
  cpu: {
    total: number;
    cores: number[];
  };
  ram: {
    total: number;
    used: number;
    free: number;
    percent: number;
    oom_warning: boolean;
  };
  temp: {
    celsius: number;
    millidegrees: number;
    warning: boolean;
  };
  disk_io: {
    read_bytes: number;
    write_bytes: number;
    read_time: number;
    write_time: number;
    write_latency_ms: number;
  };
  services: ServiceStatus[];
  uptime: string;
  fanstack_suite_status?: 'Running' | 'Stopped';
}

export default function App() {
  const [metrics, setMetrics] = useState<TelemetryData | null>(null);
  const [activeLogFile, setActiveLogFile] = useState('fanstack_relay.log');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [metricsConnected, setMetricsConnected] = useState(false);
  const [logsConnected, setLogsConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const metricsWsRef = useRef<WebSocket | null>(null);
  const logsWsRef = useRef<WebSocket | null>(null);

  // ── Knowledge Base (KB) State & Handlers ───────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kb'>('dashboard');
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editorTopic, setEditorTopic] = useState('');
  const [editorDescription, setEditorDescription] = useState('');
  const [editorText, setEditorText] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [editorSource, setEditorSource] = useState('');
  const [editorPreview, setEditorPreview] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);

  const fetchKBArticles = async () => {
    setKbLoading(true);
    try {
      const response = await fetch('/api/system/kb');
      if (response.ok) {
        const data = await response.json();
        setKbArticles(data.kb_articles || []);
      }
    } catch (err) {
      console.error('Failed to fetch KB articles', err);
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kb') {
      fetchKBArticles();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedArticleId) {
      setSelectedArticle(null);
      return;
    }
    const fetchArticleDetail = async () => {
      try {
        const response = await fetch(`/api/system/kb/${selectedArticleId}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedArticle(data);
        }
      } catch (err) {
        console.error('Failed to fetch KB article details', err);
      }
    };
    fetchArticleDetail();
  }, [selectedArticleId]);

  const handleSaveKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTopic.trim()) return;

    const payload = {
      topic: editorTopic,
      short_description: editorDescription,
      text: editorText,
      workflow_state: 'published',
      u_source: editorSource || 'Clio Cockpit',
      u_tags: editorTags,
    };

    try {
      const url = isCreating ? '/api/system/kb' : `/api/system/kb/${selectedArticleId}`;
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setActionMessage({ 
          text: isCreating ? `KB article created: ${data.number}` : `KB article updated successfully`, 
          type: 'success' 
        });
        setTimeout(() => setActionMessage(null), 5000);
        
        setIsEditing(false);
        setIsCreating(false);
        await fetchKBArticles();
        if (isCreating) {
          setSelectedArticleId(data.sys_id);
        } else {
          // Force a slight state change to re-trigger details fetch
          const savedId = selectedArticleId;
          setSelectedArticleId(null);
          setTimeout(() => setSelectedArticleId(savedId), 10);
        }
      } else {
        setActionMessage({ text: 'Failed to save KB article', type: 'error' });
      }
    } catch (err) {
      setActionMessage({ text: 'Error communicating with API', type: 'error' });
    }
  };

  const handleDeleteKB = async (sysId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this Knowledge Base article? This will also remove the synchronized markdown file.')) {
      return;
    }

    try {
      const response = await fetch(`/api/system/kb/${sysId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActionMessage({ text: 'KB article deleted successfully', type: 'success' });
        setTimeout(() => setActionMessage(null), 5000);
        setSelectedArticleId(null);
        setSelectedArticle(null);
        setIsEditing(false);
        await fetchKBArticles();
      } else {
        setActionMessage({ text: 'Failed to delete KB article', type: 'error' });
      }
    } catch (err) {
      setActionMessage({ text: 'Error communicating with API', type: 'error' });
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedArticleId(null);
    setSelectedArticle(null);
    setEditorTopic('');
    setEditorDescription('');
    setEditorText('');
    setEditorTags('');
    setEditorSource('Clio Cockpit');
    setEditorPreview(false);
  };

  const handleStartEdit = () => {
    if (!selectedArticle) return;
    setIsCreating(false);
    setIsEditing(true);
    setEditorTopic(selectedArticle.topic);
    setEditorDescription(selectedArticle.short_description);
    setEditorText(selectedArticle.text || '');
    setEditorTags(selectedArticle.u_tags || '');
    setEditorSource(selectedArticle.u_source || 'Clio Cockpit');
    setEditorPreview(false);
  };

  // Determine dynamic hosts based on window location (enables zero-config Tailscale resolution)
  const isHttps = window.location.protocol === 'https:';
  const apiBaseUrl = ''; // Use relative paths to leverage Vite proxy
  const wsBaseUrl = `${isHttps ? 'wss:' : 'ws:'}//${window.location.host}`;

  // Circular gauge config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // 1. Establish WebSocket Metrics Stream
  useEffect(() => {
    function connectMetrics() {
      const wsUrl = `${wsBaseUrl}/ws/system/metrics`;
      console.log(`Connecting to metrics WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      metricsWsRef.current = ws;

      ws.onopen = () => {
        setMetricsConnected(true);
        console.log('Metrics WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'METRICS_UPDATE') {
            setMetrics(payload.data);
          }
        } catch (err) {
          console.error('Error parsing metrics payload', err);
        }
      };

      ws.onclose = () => {
        setMetricsConnected(false);
        console.log('Metrics WebSocket disconnected. Retrying in 3 seconds...');
        setTimeout(connectMetrics, 3000);
      };

      ws.onerror = (err) => {
        console.error('Metrics WebSocket error', err);
        ws.close();
      };
    }

    connectMetrics();

    return () => {
      if (metricsWsRef.current) {
        metricsWsRef.current.close();
      }
    };
  }, [wsBaseUrl]);

  // 2. Establish WebSocket Log Stream
  useEffect(() => {
    function connectLogs() {
      const wsUrl = `${wsBaseUrl}/ws/system/logs`;
      console.log(`Connecting to logs WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      logsWsRef.current = ws;

      ws.onopen = () => {
        setLogsConnected(true);
        console.log('Logs WebSocket connected');
        // Instantly subscribe to active file trailing stream
        ws.send(JSON.stringify({ action: 'stream', file: activeLogFile }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (isLogPaused) return; // Ignore updates if console scroll is frozen

          if (payload.type === 'LOG_HISTORY') {
            setLogLines(payload.lines);
          } else if (payload.type === 'LOG_LINE') {
            setLogLines((prev) => [...prev.slice(-300), payload.line]); // Keep last 300 lines for efficiency
          } else if (payload.type === 'LOG_ERROR') {
            setLogLines((prev) => [...prev, `[SYSTEM ERROR] ${payload.message}`]);
          }
        } catch (err) {
          console.error('Error parsing logs payload', err);
        }
      };

      ws.onclose = () => {
        setLogsConnected(false);
        console.log('Logs WebSocket disconnected. Retrying in 3 seconds...');
        setTimeout(connectLogs, 3000);
      };

      ws.onerror = (err) => {
        console.error('Logs WebSocket error', err);
        ws.close();
      };
    }

    connectLogs();

    return () => {
      if (logsWsRef.current) {
        logsWsRef.current.close();
      }
    };
  }, [wsBaseUrl, activeLogFile, isLogPaused]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (!isLogPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines, isLogPaused]);

  // Handle Log Source selection change
  const handleLogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const file = e.target.value;
    setActiveLogFile(file);
    setLogLines([]); // Clear existing console lines
    if (logsWsRef.current && logsWsRef.current.readyState === WebSocket.OPEN) {
      logsWsRef.current.send(JSON.stringify({ action: 'stream', file }));
    }
  };

  // Toggle console freeze
  const toggleLogPause = () => {
    const nextState = !isLogPaused;
    setIsLogPaused(nextState);
    if (logsWsRef.current && logsWsRef.current.readyState === WebSocket.OPEN) {
      logsWsRef.current.send(JSON.stringify({ action: nextState ? 'pause' : 'resume' }));
    }
  };

  // Trigger service actuators ([RESTART] / [TERMINATE])
  const handleServiceControl = async (service: string, action: 'restart' | 'terminate' | 'start') => {
    const loadingKey = `${service}-${action}`;
    setActionLoading(loadingKey);
    setActionMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/system/service/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, action }),
      });

      const data = await response.json();
      if (response.ok) {
        setActionMessage({ text: data.message || `Action successful`, type: 'success' });
        // Auto fade message
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setActionMessage({ text: data.detail || `Action failed`, type: 'error' });
      }
    } catch (err) {
      setActionMessage({ text: `Failed to communicate with Core API.`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // Formatter helper for Disk I/O bytes (MB/GB)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Color code log lines for realistic terminal aesthetics
  const getLogLineStyle = (line: string) => {
    const upper = line.toUpperCase();
    if (upper.includes('ERROR') || upper.includes('CRITICAL') || upper.includes('EXCEPTION')) {
      return 'terminal-line error';
    }
    if (upper.includes('WARNING') || upper.includes('WARN')) {
      return 'terminal-line warning';
    }
    if (upper.includes('SUCCESS') || upper.includes('OK') || upper.includes('COMPLETE')) {
      return 'terminal-line info';
    }
    if (upper.includes('[VESPER]') || upper.includes('[VESPER KERNEL]')) {
      return 'terminal-line sys';
    }
    return 'terminal-line';
  };

  // Compute offset for SVG gauges
  const getStrokeOffset = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    return circumference - (clamped / 100) * circumference;
  };

  // Render CPU, RAM, and Temperature indicators
  const cpuPercent = metrics?.cpu.total ?? 0;
  const ramPercent = metrics?.ram.percent ?? 0;
  const tempCelsius = metrics?.temp.celsius ?? 0;
  
  const isThermalWarning = metrics?.temp.warning || tempCelsius >= 60.0;
  const isOomWarning = metrics?.ram.oom_warning || ramPercent > 85.0;

  return (
    <div className="cockpit-container">
      {/* HEADER BAR */}
      <header className="cockpit-header">
        <div className="brand-group">
          <div className="brand-logo">
            <Activity size={26} />
          </div>
          <h1 className="brand-title">Clio Cockpit</h1>
        </div>

        {/* Tab Selector */}
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={14} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => setActiveTab('kb')}
          >
            <BookOpen size={14} />
            <span>Knowledge Base</span>
          </button>
        </div>
        
        <div className="header-meta">
          <div className="meta-item">
            <Clock size={14} className="cyan" style={{ marginRight: '2px' }} />
            <span>Uptime:</span>
            <span className="meta-val">{metrics?.uptime || 'loading...'}</span>
          </div>
          <div className="meta-item">
            <span>Core API:</span>
            <span className={`meta-val ${metrics ? 'cyan' : 'orange'}`}>
              {metrics ? 'ONLINE (8090)' : 'OFFLINE'}
            </span>
          </div>
          <div className="meta-item">
            <span>WS Relay:</span>
            <span className={`meta-val ${metricsConnected ? 'cyan' : 'orange'}`}>
              {metricsConnected ? 'CONNECTED (8008)' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </header>

      {/* CONDITIONAL DESKTOP GRID LAYOUT */}
      {activeTab === 'dashboard' ? (
        <main className="cockpit-grid">
          
          {/* COLUMN 1: HARDWARE TELEMETRY */}
          <section className="cockpit-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <Cpu size={16} className="cyan" /> Hardware Telemetry
              </h2>
            </div>
            
            <div className="panel-body">
              {/* Warning banners */}
              {isThermalWarning && (
                <div className="warning-alert-box">
                  <ShieldAlert size={16} />
                  <span>THERMAL WARNING: Pi 5 CPU crosses 60°C!</span>
                </div>
              )}
              
              {isOomWarning && (
                <div className="warning-alert-box">
                  <AlertTriangle size={16} />
                  <span>OOM WARNING: RAM allocation exceeds 85%!</span>
                </div>
              )}

              <div className="telemetry-row">
                {/* CPU Gauge */}
                <div className="gauge-card">
                  <div className="gauge-circle">
                    <svg className="gauge-svg">
                      <circle className="gauge-track" cx="60" cy="60" r={radius} />
                      <circle 
                        className={`gauge-value-arc ${cpuPercent > 80 ? 'orange' : 'cyan'}`} 
                        cx="60" 
                        cy="60" 
                        r={radius} 
                        strokeDasharray={circumference}
                        strokeDashoffset={getStrokeOffset(cpuPercent)}
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-num">{cpuPercent}%</span>
                      <span className="gauge-lbl" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Cpu size={10} /> CPU
                      </span>
                    </div>
                  </div>
                  <div className="gauge-info">
                    {metrics?.cpu.cores.length || 8} Cores Active
                  </div>
                </div>

                {/* RAM Gauge */}
                <div className="gauge-card">
                  <div className="gauge-circle">
                    <svg className="gauge-svg">
                      <circle className="gauge-track" cx="60" cy="60" r={radius} />
                      <circle 
                        className={`gauge-value-arc ${isOomWarning ? 'orange' : 'cyan'}`} 
                        cx="60" 
                        cy="60" 
                        r={radius} 
                        strokeDasharray={circumference}
                        strokeDashoffset={getStrokeOffset(ramPercent)}
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-num">{ramPercent.toFixed(0)}%</span>
                      <span className="gauge-lbl" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <HardDrive size={10} /> RAM
                      </span>
                    </div>
                  </div>
                  <div className="gauge-info">
                    {metrics ? `${(metrics.ram.used / 1024).toFixed(1)} GB / ${(metrics.ram.total / 1024).toFixed(0)} GB` : 'loading...'}
                  </div>
                </div>

                {/* Temp Gauge */}
                <div className="gauge-card">
                  <div className="gauge-circle">
                    <svg className="gauge-svg">
                      <circle className="gauge-track" cx="60" cy="60" r={radius} />
                      <circle 
                        className={`gauge-value-arc ${isThermalWarning ? 'orange' : 'cyan'}`} 
                        cx="60" 
                        cy="60" 
                        r={radius} 
                        strokeDasharray={circumference}
                        strokeDashoffset={getStrokeOffset((tempCelsius / 80) * 100)} // scale to max 80C
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-num">{tempCelsius.toFixed(1)}°C</span>
                      <span className="gauge-lbl" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Thermometer size={10} /> TEMP
                      </span>
                    </div>
                  </div>
                  <div className="gauge-info">
                    Broadcom BCM2712 Core
                  </div>
                </div>
              </div>

              {/* Disk I/O Widget */}
              {metrics && (
                <div className="gauge-card" style={{ marginTop: 'auto', textAlign: 'left', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <HardDrive size={14} className="cyan" />
                    <span>Disk I/O contention monitor</span>
                  </div>
                  <div style={{ width: '100%', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">Read activity:</span>
                      <span>{formatBytes(metrics.disk_io.read_bytes)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">Write activity:</span>
                      <span>{formatBytes(metrics.disk_io.write_bytes)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">Write latency:</span>
                      <span className={metrics.disk_io.write_latency_ms > 50 ? 'orange' : 'cyan'}>
                        {metrics.disk_io.write_latency_ms} ms
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 2: ACTIVE SERVICE PROCESS MATRIX */}
          <section className="cockpit-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <Activity size={16} className="cyan" /> Active Service Process Matrix
              </h2>
            </div>
            
            <div className="panel-body">
              {/* Actuator operational message banner */}
              {actionMessage && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  border: '1px solid',
                  borderColor: actionMessage.type === 'success' ? '#22c55e' : '#ef4444',
                  backgroundColor: actionMessage.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  color: actionMessage.type === 'success' ? '#22c55e' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* FanStack Suite Control Box */}
              {metrics && (
                <div className="fanstack-suite-box" style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  backgroundColor: 'rgba(6, 182, 212, 0.03)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>⚾</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>FanStack Telemetry Suite</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Field of Dreams Controller</span>
                      </div>
                    </div>
                    <span className={`badge ${metrics.fanstack_suite_status === 'Running' ? 'running' : 'stopped'}`} style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      backgroundColor: metrics.fanstack_suite_status === 'Running' ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                      color: metrics.fanstack_suite_status === 'Running' ? '#22c55e' : '#94a3b8',
                      border: '1px solid',
                      borderColor: metrics.fanstack_suite_status === 'Running' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)'
                    }}>
                      {metrics.fanstack_suite_status === 'Running' ? '● ACTIVE POLLING' : '○ HIBERNATING'}
                    </span>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                    Surgically stops or ignites all temporary sports polling, chatbots, and stream relays to conserve Pi 5 resources while preserving core databases.
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    {metrics.fanstack_suite_status === 'Running' ? (
                      <button 
                        className="actuator-btn terminate"
                        style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', fontWeight: 600, gap: '4px' }}
                        disabled={actionLoading !== null}
                        onClick={() => handleServiceControl('fanstack_suite', 'terminate')}
                      >
                        <XCircle size={14} />
                        {actionLoading === 'fanstack_suite-terminate' ? 'Hibernating...' : 'Hibernate Telemetry'}
                      </button>
                    ) : (
                      <button 
                        className="actuator-btn start"
                        style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', fontWeight: 600, gap: '4px' }}
                        disabled={actionLoading !== null}
                        onClick={() => handleServiceControl('fanstack_suite', 'start')}
                      >
                        <Play size={14} />
                        {actionLoading === 'fanstack_suite-start' ? 'Igniting...' : 'Ignite Telemetry'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="process-matrix">
                {metrics?.services.map((service) => {
                  const isRunning = service.status === 'Running' || service.status === 'Warning';
                  const isCrashed = service.status === 'Crashed';
                  const isWarning = service.status === 'Warning';
                  
                  return (
                    <div key={service.script} className="process-card">
                      <div className="process-card-header">
                        <div>
                          <div className="process-meta-title">{service.name}</div>
                          <div className="process-script-name">{service.script}</div>
                        </div>
                        
                        <span className={`badge ${service.status.toLowerCase()}`}>
                          {isWarning && <AlertTriangle size={10} style={{ marginRight: '3px' }} />}
                          {isCrashed && <XCircle size={10} style={{ marginRight: '3px' }} />}
                          {service.status}
                        </span>
                      </div>

                      <div className="process-card-stats">
                        <div>
                          <div className="stat-item-label">PID</div>
                          <div className="stat-item-val">{service.pid || '—'}</div>
                        </div>
                        <div>
                          <div className="stat-item-label">CPU</div>
                          <div className="stat-item-val">{isRunning ? `${service.cpu}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="stat-item-label">Memory</div>
                          <div className="stat-item-val">{isRunning ? `${service.ram} MB` : '—'}</div>
                        </div>
                      </div>

                      <div className="process-card-actions">
                        {isRunning ? (
                          <>
                            <button 
                              className="actuator-btn restart"
                              disabled={actionLoading !== null}
                              onClick={() => handleServiceControl(service.script, 'restart')}
                            >
                              <RotateCw size={12} />
                              {actionLoading === `${service.script}-restart` ? 'Reloading...' : 'Restart'}
                            </button>
                            
                            <button 
                              className="actuator-btn terminate"
                              disabled={actionLoading !== null}
                              onClick={() => handleServiceControl(service.script, 'terminate')}
                            >
                              <XCircle size={12} />
                              {actionLoading === `${service.script}-terminate` ? 'Stopping...' : 'Terminate'}
                            </button>
                          </>
                        ) : (
                          <button 
                            className="actuator-btn start"
                            disabled={actionLoading !== null}
                            onClick={() => handleServiceControl(service.script, 'start')}
                          >
                            <Play size={12} />
                            {actionLoading === `${service.script}-start` ? 'Booting...' : 'Boot service'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!metrics && (
                  <div style={{ color: 'rgba(148, 163, 184, 0.4)', textAlign: 'center', marginTop: '4rem' }}>
                    Awaiting Telemetry Sync...
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* COLUMN 3: REAL-TIME MONOSPACE TERMINAL */}
          <section className="cockpit-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <Terminal size={16} className="cyan" /> Trailing System Logs
                <span style={{ 
                  width: '7px', 
                  height: '7px', 
                  borderRadius: '50%', 
                  backgroundColor: logsConnected ? 'var(--cyan-bright)' : 'var(--orange-bright)',
                  boxShadow: logsConnected ? '0 0 6px var(--cyan-bright)' : '0 0 6px var(--orange-bright)',
                  display: 'inline-block',
                  marginLeft: '8px',
                  verticalAlign: 'middle'
                }} title={logsConnected ? "Logs WebSocket Connected" : "Logs WebSocket Disconnected"} />
              </h2>
            </div>
            
            <div className="panel-body" style={{ padding: '1rem' }}>
              <div className="log-console-container">
                
                {/* Console selector and actions */}
                <div className="console-controls">
                  <select 
                    className="log-selector"
                    value={activeLogFile}
                    onChange={handleLogChange}
                  >
                    <option value="fanstack_relay.log">WebSocket Relay (fanstack_relay.log)</option>
                    <option value="fanstack_poller.log">Telemetry Poller (fanstack_poller.log)</option>
                    <option value="sovereign_core_8090.log">Core API (sovereign_core_8090.log)</option>
                    <option value="tmi_daemon.log">TMI Engine (tmi_daemon.log)</option>
                    <option value="vesper_scheduler.log">Vesper Scheduler (vesper_scheduler.log)</option>
                  </select>

                  <div className="console-action-bar">
                    <button 
                      className="console-btn"
                      onClick={toggleLogPause}
                      title={isLogPaused ? 'Resume trailing stream' : 'Pause console scroll'}
                    >
                      {isLogPaused ? <Play size={12} /> : <Pause size={12} />}
                      <span>{isLogPaused ? 'Resume' : 'Freeze'}</span>
                    </button>
                  </div>
                </div>

                {/* Monospace console */}
                <div className="console-terminal">
                  {logLines.length > 0 ? (
                    logLines.map((line, idx) => (
                      <div key={idx} className={getLogLineStyle(line)}>
                        {line.trim()}
                      </div>
                    ))
                  ) : (
                    <div className="terminal-empty">
                      <FileText size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <div>Awaiting logs on websocket stream...</div>
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          </section>

        </main>
      ) : (
        <main className="kb-workspace-grid">
          {/* Left Sidebar */}
          <div className="kb-sidebar">
            <div className="kb-search-box">
              <div className="kb-search-input-wrapper">
                <Search size={16} className="kb-search-icon" />
                <input
                  type="text"
                  className="kb-search-input"
                  placeholder="Search runbooks & KBs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="kb-new-btn" onClick={handleStartCreate}>
                <Plus size={16} />
                <span>New Article</span>
              </button>
            </div>

            {kbLoading ? (
              <div className="kb-sidebar-loading">
                <RotateCw size={20} style={{ animation: 'pulse-glow 1.5s infinite ease-in-out', marginBottom: '0.5rem' }} />
                <span>Loading Knowledge Base...</span>
              </div>
            ) : (
              <div className="kb-list">
                {kbArticles
                  .filter(art => 
                    art.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    art.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    art.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (art.u_tags && art.u_tags.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map(art => (
                    <button
                      key={art.sys_id}
                      className={`kb-list-item ${selectedArticleId === art.sys_id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedArticleId(art.sys_id);
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                    >
                      <div className="kb-item-header">
                        <span className="kb-item-number">{art.number}</span>
                        <span className="kb-item-date">{new Date(art.sys_updated_on).toLocaleDateString()}</span>
                      </div>
                      <div className="kb-item-topic">{art.topic}</div>
                      <div className="kb-item-desc">{art.short_description}</div>
                    </button>
                  ))
                }
                {kbArticles.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem', fontSize: '0.8rem' }}>
                    No knowledge articles found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Workspace / Detail Panel */}
          <div className="kb-detail-panel">
            {isEditing ? (
              <form onSubmit={handleSaveKB} className="kb-editor-form">
                <div className="kb-editor-header">
                  <span className="kb-editor-title">{isCreating ? 'Create System Runbook' : `Edit Article ${selectedArticle?.number}`}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="console-btn" onClick={() => { setIsEditing(false); setIsCreating(false); }}>
                      Cancel
                    </button>
                    <button type="submit" className="console-btn" style={{ borderColor: 'var(--cyan-bright)', color: 'var(--cyan-bright)' }}>
                      <Save size={14} style={{ marginRight: '4px' }} />
                      Save
                    </button>
                  </div>
                </div>

                <div className="kb-editor-body">
                  <div className="kb-editor-mode-toggle">
                    <button
                      type="button"
                      className={`kb-toggle-btn ${!editorPreview ? 'active' : ''}`}
                      onClick={() => setEditorPreview(false)}
                    >
                      Write (Markdown)
                    </button>
                    <button
                      type="button"
                      className={`kb-toggle-btn ${editorPreview ? 'active' : ''}`}
                      onClick={() => setEditorPreview(true)}
                    >
                      <Eye size={12} style={{ marginRight: '3px', display: 'inline' }} />
                      Preview
                    </button>
                  </div>

                  {editorPreview ? (
                    <div className="kb-article-body" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', border: '1px solid var(--border-slate)' }}>
                      {renderMarkdown(editorText || '*No content yet. Start typing!*')}
                    </div>
                  ) : (
                    <>
                      <div className="kb-form-group">
                        <label className="kb-label">Topic / Title</label>
                        <input
                          type="text"
                          className="kb-input"
                          placeholder="e.g., Sovereign OS FanStack Hibernation Protocol"
                          value={editorTopic}
                          onChange={(e) => setEditorTopic(e.target.value)}
                          required
                        />
                      </div>

                      <div className="kb-form-group">
                        <label className="kb-label">Short Description</label>
                        <input
                          type="text"
                          className="kb-input"
                          placeholder="Brief summary of the runbook..."
                          value={editorDescription}
                          onChange={(e) => setEditorDescription(e.target.value)}
                        />
                      </div>

                      <div className="kb-form-row">
                        <div className="kb-form-group">
                          <label className="kb-label">Tags (comma-separated)</label>
                          <input
                            type="text"
                            className="kb-input"
                            placeholder="e.g., FanStack, Core, Telemetry"
                            value={editorTags}
                            onChange={(e) => setEditorTags(e.target.value)}
                          />
                        </div>
                        <div className="kb-form-group">
                          <label className="kb-label">Source System</label>
                          <input
                            type="text"
                            className="kb-input"
                            placeholder="e.g., CMDB, Sovereign OS"
                            value={editorSource}
                            onChange={(e) => setEditorSource(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="kb-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="kb-label">Article Text (Markdown Supported)</label>
                        <textarea
                          className="kb-textarea"
                          placeholder="# Heading 1&#10;&#10;Write technical runbook instructions here using standard Markdown.&#10;&#10;> [!NOTE]&#10;> You can use GitHub-style alert boxes here!&#10;> Use NOTE, IMPORTANT, TIP, WARNING, or CAUTION."
                          value={editorText}
                          onChange={(e) => setEditorText(e.target.value)}
                          style={{ flex: 1, minHeight: '300px' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </form>
            ) : selectedArticle ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="kb-article-header">
                  <div className="kb-title-area">
                    <div className="kb-meta-row">
                      <span className="kb-item-number">{selectedArticle.number}</span>
                      <span className="kb-badge-state">{selectedArticle.workflow_state}</span>
                      <span>Updated: {new Date(selectedArticle.sys_updated_on).toLocaleString()}</span>
                    </div>
                    <div className="kb-article-topic">{selectedArticle.topic}</div>
                    {selectedArticle.u_tags && (
                      <div className="kb-tags-list">
                        {selectedArticle.u_tags.split(',').map((tag, idx) => (
                          <span key={idx} className="kb-tag-pill">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="kb-actions-area">
                    <button className="console-btn" onClick={handleStartEdit}>
                      <Edit2 size={12} style={{ marginRight: '4px' }} />
                      Edit
                    </button>
                    <button className="console-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteKB(selectedArticle.sys_id)}>
                      <Trash2 size={12} style={{ marginRight: '4px' }} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="kb-article-body">
                  {renderMarkdown(selectedArticle.text || '')}
                </div>
              </div>
            ) : (
              <div className="kb-placeholder-container">
                <BookOpen size={48} style={{ opacity: 0.3 }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>Sovereign OS Knowledge Base</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Select an article from the sidebar to view detailed runbooks, or click "New Article" to author a new system document.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

// ── LIGHTWEIGHT MARKDOWN & GITHUB-STYLE ALERT RENDERER ───────────────────────

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="kb-code-block">
            <code className={`language-${codeLang}`}>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="kb-h1">{renderInlineStyles(line.slice(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="kb-h2">{renderInlineStyles(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="kb-h3">{renderInlineStyles(line.slice(4))}</h3>);
      continue;
    }

    // Handle lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(<li key={`li-${i}`} className="kb-li">{renderInlineStyles(line.trim().slice(2))}</li>);
      continue;
    }

    // Handle alerts (GitHub style: > [!NOTE], > [!IMPORTANT], etc.)
    if (line.trim().startsWith('> [!')) {
      const type = line.match(/>\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]/i)?.[1]?.toUpperCase() || 'NOTE';
      const alertLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('>')) {
        let alertLine = lines[j].trim();
        alertLine = alertLine.slice(1).trim();
        alertLines.push(alertLine);
        j++;
      }
      i = j - 1; // Advance outer loop
      
      const alertClass = `kb-alert-${type.toLowerCase()}`;
      elements.push(
        <div key={`alert-${i}`} className={`kb-alert-box ${alertClass}`}>
          <div className="kb-alert-title">{type}</div>
          <div className="kb-alert-content">
            {alertLines.map((al, idx) => <p key={`al-${idx}`}>{renderInlineStyles(al)}</p>)}
          </div>
        </div>
      );
      continue;
    }

    // Handle blockquotes
    if (line.trim().startsWith('>')) {
      elements.push(<blockquote key={`quote-${i}`} className="kb-blockquote">{renderInlineStyles(line.trim().slice(1).trim())}</blockquote>);
      continue;
    }

    // Handle blank lines
    if (line.trim() === '') {
      elements.push(<div key={`space-${i}`} className="kb-space" />);
      continue;
    }

    // Default paragraph
    elements.push(<p key={`p-${i}`} className="kb-p">{renderInlineStyles(line)}</p>);
  }

  return <div className="kb-rendered-markdown">{elements}</div>;
}

function renderInlineStyles(text: string): React.ReactNode[] {
  let parts: { type: 'text' | 'bold' | 'italic' | 'code' | 'link'; content: string; url?: string }[] = [
    { type: 'text', content: text }
  ];
  
  // 1. Process Bold (**bold**)
  parts = parts.flatMap(p => {
    if (p.type !== 'text') return [p];
    const split = p.content.split(/\*\*([^*]+)\*\*/g);
    return split.map((str, idx) => ({
      type: idx % 2 === 1 ? 'bold' as const : 'text' as const,
      content: str
    }));
  });

  // 2. Process Inline Code (`code`)
  parts = parts.flatMap(p => {
    if (p.type !== 'text') return [p];
    const split = p.content.split(/`([^`]+)`/g);
    return split.map((str, idx) => ({
      type: idx % 2 === 1 ? 'code' as const : 'text' as const,
      content: str
    }));
  });

  // 3. Process Links ([text](url))
  parts = parts.flatMap(p => {
    if (p.type !== 'text') return [p];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...p.content.matchAll(regex)];
    if (matches.length === 0) return [p];

    const result: typeof parts = [];
    let lastIndex = 0;
    for (const match of matches) {
      const index = match.index!;
      if (index > lastIndex) {
        result.push({ type: 'text', content: p.content.substring(lastIndex, index) });
      }
      result.push({
        type: 'link',
        content: match[1],
        url: match[2]
      });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < p.content.length) {
      result.push({ type: 'text', content: p.content.substring(lastIndex) });
    }
    return result;
  });

  return parts.map((p, idx) => {
    switch (p.type) {
      case 'bold': return <strong key={idx}>{p.content}</strong>;
      case 'code': return <code key={idx} className="kb-inline-code">{p.content}</code>;
      case 'link': return <a key={idx} href={p.url} className="kb-link" target="_blank" rel="noopener noreferrer">{p.content}</a>;
      default: return p.content;
    }
  });
}
