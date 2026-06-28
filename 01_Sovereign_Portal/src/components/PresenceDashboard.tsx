import React, { useEffect, useState, useRef } from 'react';
import { Phone, Users, Stethoscope, Wifi, Shield, Server, Activity, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PresenceUser {
  user_name: string;
  display_name: string;
  role: string;
  status: 'online' | 'offline';
}

const DEFAULT_USERS: PresenceUser[] = [
  { user_name: 'james', display_name: 'James (Pilot)', role: 'pilot', status: 'offline' },
  { user_name: 'pawel', display_name: 'Pawel (Pilot)', role: 'pilot', status: 'offline' },
  { user_name: 'eileen', display_name: 'Eileen (Patron)', role: 'patron', status: 'offline' },
  { user_name: 'barb', display_name: 'Barb Baker', role: 'patron', status: 'offline' },
  { user_name: 'sean', display_name: 'Sean', role: 'user', status: 'offline' },
  { user_name: 'allyson', display_name: 'Allyson', role: 'user', status: 'offline' },
  { user_name: 'william', display_name: 'William Rudnicki', role: 'investor', status: 'offline' },
];

const SYSTEM_QUEUES = [
  { id: 'aether_vet', name: '🏥 Aether Vet Clinic', desc: 'Veterinary Remote Waiting Stream' },
  { id: 'fanstack', name: '🎙️ FanStack Studio', desc: 'Sovereign Roster Broadcast Hub' },
  { id: 'gardenstack', name: "🌿 Eileen's Stack", desc: 'Horticulture Telepresence Feed' },
];

export default function PresenceDashboard() {
  const auth = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>(DEFAULT_USERS);
  const [activeQueues, setActiveQueues] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const wsRef = useRef<WebSocket | null>(null);

  // Get WebSocket URL helper
  const getWsUrl = () => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws-relay`;
  };

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (!active) return;
      ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setWsConnected(true);
        // Register current user if logged in
        if (auth?.user_name) {
          ws?.send(JSON.stringify({
            type: 'REGISTER',
            userId: auth.user_name,
            displayName: auth.display_name,
            role: auth.role,
          }));
        }
        // Fetch current presence list
        ws?.send(JSON.stringify({ type: 'GET_PRESENCE' }));
      };

      ws.onmessage = (evt) => {
        if (!active) return;
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'PRESENCE_UPDATE') {
            const onlineList = data.users ?? [];
            const onlineUserNames = new Set(onlineList.map((u: any) => u.user_name.toLowerCase()));
            
            // Map our default roster + any newly discovered online users
            const updatedUsers = DEFAULT_USERS.map(u => ({
              ...u,
              status: onlineUserNames.has(u.user_name.toLowerCase()) ? 'online' as const : 'offline' as const
            }));

            // Include any additional users that are online but not in default list
            onlineList.forEach((online: any) => {
              if (online.user_name.toLowerCase() === auth?.user_name?.toLowerCase()) return;
              if (!updatedUsers.find(u => u.user_name.toLowerCase() === online.user_name.toLowerCase())) {
                updatedUsers.push({
                  user_name: online.user_name,
                  display_name: online.display_name || online.user_name,
                  role: online.role || 'guest',
                  status: 'online'
                });
              }
            });

            setUsers(updatedUsers);
            setActiveQueues(data.queues ?? []);
          }
        } catch (err) {
          console.error('Error parsing presence update:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (active) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [auth]);

  const handleCallUser = (userName: string, displayName: string) => {
    // Dispatch custom event to trigger Hololink call in mounted HololinkHub
    const event = new CustomEvent('hololink-call-user', {
      detail: { user_name: userName, display_name: displayName }
    });
    window.dispatchEvent(event);
  };

  const handleCallQueue = (queueId: string, queueName: string) => {
    const event = new CustomEvent('hololink-call-user', {
      detail: { user_name: queueId, display_name: queueName, queue: queueId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-[75vh] bg-[#070A0F] text-slate-100 font-sans p-4 md:p-6 relative overflow-hidden rounded-2xl border border-white/5">
      {/* Background Neon Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b]/20 via-[#070A0F] to-[#070A0F] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/30 text-[#00d4aa]">
                <Activity size={20} />
              </span>
              <h1 className="text-2xl font-bold font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#38bdf8]">
                Telepresence Hub
              </h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Sovereign Mesh Network Status & Dialer
            </p>
          </div>

          {/* Telemetry Indicator */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono text-[10px] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-slate-400">MESH:</span>
              <span className={wsConnected ? 'text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                {wsConnected ? 'ONLINE' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="w-px h-3.5 bg-white/10" />
            <div className="flex items-center gap-1 text-slate-400">
              <Users size={12} className="text-[#38bdf8]" />
              <span>ACTIVE:</span>
              <span className="text-white font-bold">{users.filter(u => u.status === 'online').length}</span>
            </div>
          </div>
        </div>

        {/* System Waiting Rooms / Queues Section */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#00d4aa] font-mono flex items-center gap-2">
            <Server size={12} /> Mesh Waiting Rooms & Queues
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SYSTEM_QUEUES.map(q => {
              const isActive = activeQueues.includes(q.id);
              return (
                <div 
                  key={q.id} 
                  className={`bg-white/5 border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all duration-300 backdrop-blur-md relative overflow-hidden group
                    ${isActive 
                      ? 'border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                      : 'border-white/5 hover:border-white/15'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white font-display">{q.name}</h3>
                      {isActive && (
                        <span className="text-[8px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full px-1.5 py-0.5 animate-pulse">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{q.desc}</p>
                  </div>
                  <button
                    onClick={() => handleCallQueue(q.id, q.name)}
                    className={`w-full py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border
                      ${isActive
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400 hover:scale-[1.01]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'}`}
                  >
                    <Stethoscope size={12} /> Connect Stream
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Roster Directory */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#38bdf8] font-mono flex items-center gap-2">
              <Shield size={12} /> Live Roster Directory
            </h2>
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 backdrop-blur-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1 ${viewMode === 'grid' ? 'bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                title="Grid View"
              >
                <LayoutGrid size={12} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-0.5">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1 ${viewMode === 'list' ? 'bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                title="List View"
              >
                <List size={12} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-0.5">List</span>
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-slate-400">
                      <th className="py-2.5 px-4">Operator</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => {
                      const isOnline = u.status === 'online';
                      return (
                        <tr 
                          key={u.user_name}
                          className={`hover:bg-white/5 transition-all duration-150 ${isOnline ? 'text-white' : 'text-slate-400'}`}
                        >
                          <td className="py-2 px-4 flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full bg-slate-800 border flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white shadow-inner relative
                              ${isOnline ? 'border-[#00d4aa]' : 'border-slate-700'}`}
                            >
                              {u.display_name.charAt(0)}
                              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#070A0F] shadow-sm
                                ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                              />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">{u.display_name}</div>
                              <div className="text-[9px] font-mono text-slate-500">@{u.user_name}</div>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <span className="text-[8px] font-mono uppercase tracking-wider bg-white/5 border border-white/15 rounded px-1.5 py-0.5">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono text-[10px]">
                            {isOnline ? (
                              <span className="text-[#00d4aa] font-bold flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#00d4aa] animate-pulse" />
                                ONLINE
                              </span>
                            ) : (
                              <span className="text-slate-500">OFFLINE</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {isOnline ? (
                              <button
                                onClick={() => handleCallUser(u.user_name, u.display_name)}
                                className="bg-[#00d4aa]/10 hover:bg-[#00d4aa] border border-[#00d4aa]/30 text-[#00d4aa] hover:text-black px-2.5 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-all duration-200"
                              >
                                Call Operator
                              </button>
                            ) : (
                              <span className="text-[8px] font-mono text-slate-600 uppercase">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {users.map(u => {
                const isOnline = u.status === 'online';
                return (
                  <div 
                    key={u.user_name}
                    className={`bg-white/5 border rounded-xl p-3 flex flex-col items-center text-center gap-2.5 transition-all duration-300 backdrop-blur-md relative overflow-hidden group
                      ${isOnline 
                        ? 'border-[#00d4aa]/40 hover:border-[#00d4aa] shadow-[0_0_15px_rgba(0,212,170,0.08)] scale-[1.01]' 
                        : 'border-white/5 hover:border-white/10 opacity-75 hover:opacity-100'}`}
                  >
                    {/* Status Indicator Ring */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full bg-slate-800 border flex items-center justify-center text-base font-bold uppercase tracking-wider text-white shadow-inner transition-all duration-500
                        ${isOnline ? 'border-[#00d4aa] ring-2 ring-[#00d4aa]/20' : 'border-slate-700'}`}
                      >
                        {u.display_name.charAt(0)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#070A0F] shadow-md transition-all duration-500
                        ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} 
                      />
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-bold text-xs text-white font-display line-clamp-1">{u.display_name}</h3>
                      <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wide bg-white/5 border border-white/5 rounded-full px-2 py-0.5 inline-block">
                        {u.role}
                      </p>
                    </div>

                    {isOnline ? (
                      <button
                        onClick={() => handleCallUser(u.user_name, u.display_name)}
                        className="w-full bg-[#00d4aa]/15 hover:bg-[#00d4aa] border border-[#00d4aa]/40 text-[#00d4aa] hover:text-black py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 shadow-[0_2px_6px_rgba(0,212,170,0.05)]"
                      >
                        <Phone size={10} className="animate-bounce" /> Call
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-white/5 border border-white/5 text-slate-500 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        Offline
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
