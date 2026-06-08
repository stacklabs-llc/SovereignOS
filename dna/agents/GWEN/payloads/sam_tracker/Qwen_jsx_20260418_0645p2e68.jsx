// SamTrackerV2.jsx — Mesh-Native Root
export const SamTrackerV2 = ({ nodeId = ".172", frmgate = true }) => {
  const [theme, setTheme] = useState('feline');
  const [telemetry, setTelemetry] = useState(null);
  const wsRef = useRef(null);

  // Ω-Gate: Pause updates if feline distress detected
  const frmGuard = (data) => frmgate ? FRM.validate(nodeId, data) : true;

  useEffect(() => {
    // Connect to Sovereign Mesh, not legacy :8080
    wsRef.current = new WebSocket('ws://192.168.1.73:8008/mard/telemetry');
    
    wsRef.current.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'STATE_UPDATE' && frmGuard(data)) {
        setTelemetry(data);
        if (data.chindogu_level) {
          const themeKey = Object.keys(THEME_MAP).find(k => 
            k.includes(data.chindogu_level)
          ) || 'feline';
          applyTheme(themeKey);
          setTheme(themeKey);
        }
      }
    };

    return () => wsRef.current?.close();
  }, [nodeId, frmgate]);

  const sendCommand = (type, message) => {
    wsRef.current?.send(JSON.stringify({ 
      type, 
      message,
      nodeId,
      timestamp: Date.now(),
      Ω_gate: frmgate ? FRM.getThreshold(nodeId) : null
    }));
  };

  return (
    <div className={`sovereign-tracker theme-${theme}`} data-theme={theme}>
      <StatusCard 
        fed={telemetry?.last_fed_timestamp > Date.now()/1000 - 14400}
        status={telemetry?.status_text || "ROAMING"}
      />
      <ActionPanel 
        onFeed={() => sendCommand('CMD_FED', prompt("What did Sam eat?"))}
        onSighting={() => sendCommand('CMD_LOG', prompt("Sighting note?"))}
      />
      <ActivityFeed events={telemetry?.last_events || []} />
      <ThemeSelector current={theme} onChange={applyTheme} themes={Object.keys(THEME_MAP)} />
    </div>
  );
};