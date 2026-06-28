import React, { useState, useEffect, useRef } from 'react';

interface SovereignTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SovereignTerminalModal({ isOpen, onClose }: SovereignTerminalModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Disconnected');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLogs([]);
    setStatus('Connecting...');
    
    const ws = new WebSocket('ws://clio.taila01894.ts.net:8096/api/ws/sync-terminal');
    
    ws.onopen = () => {
      setStatus('ACTIVE_SYNC_LOOP_ON_CLIO');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream === 'status' || data.stream === 'error') {
          setLogs((prev) => [...prev, `[SYSTEM] ${data.text}`]);
        } else {
          setLogs((prev) => [...prev, `${data.stream === 'stderr' ? '[ERR] ' : ''}${data.text}`]);
        }
      } catch (err) {
        setLogs((prev) => [...prev, event.data]);
      }
    };
    
    ws.onerror = () => {
      setStatus('ERROR');
      setLogs((prev) => [...prev, '[SYSTEM ERR] WebSocket connection encountered an error.']);
    };
    
    ws.onclose = () => {
      setStatus('STANDBY');
    };
    
    return () => {
      ws.close();
    };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="terminal-modal-overlay">
      <div className="terminal-container">
        <div className="terminal-header">
          <span className="terminal-title">🖥️ STACKLABS_CANVAS_TERMINAL_SYNC_V1.0</span>
          <span className={`status-indicator ${status.toLowerCase()}`}>{status}</span>
        </div>
        <div className="terminal-body">
          {logs.map((log, idx) => (
            <div key={idx} className="terminal-line">{log}</div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="terminal-footer">
          <button onClick={onClose} className="terminal-close-btn">Close Console</button>
        </div>
      </div>
    </div>
  );
}
