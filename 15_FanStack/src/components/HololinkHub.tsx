/**
 * HololinkHub — Sovereign OS Universal Video Call Hub
 *
 * Always mounted on the Portal after auth. Handles:
 *   - Registration with the Sovereign Mesh Relay (user-addressed signaling)
 *   - Catch: incoming call ring overlay (FaceTime-style)
 *   - Pitch: floating dial button → presence list → outbound call
 *   - Queue calls: dial into an app waiting room (AetherVet, etc.)
 *
 * Usage: Mount once in App.tsx after <AuthProvider>.
 *   <HololinkHub user={auth} wsRelayUrl="/ws-relay" />
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Phone, PhoneOff, PhoneIncoming, PhoneMissed,
  Video, VideoOff, Mic, MicOff, X, Users, Stethoscope,
} from 'lucide-react';
import type { AuthUser } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PresenceUser {
  user_name: string;
  display_name: string;
  role: string;
  queues: string[];
  status: 'online';
}

type CallState = 'idle' | 'ringing_in' | 'ringing_out' | 'active';

interface HololinkHubProps {
  user: AuthUser;
  wsRelayUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HololinkHub({ user, wsRelayUrl = '/ws-relay' }: HololinkHubProps) {
  // Relay connection
  const wsRef = useRef<WebSocket | null>(null);
  const [registered, setRegistered] = useState(false);

  // Presence
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [activeQueues, setActiveQueues] = useState<string[]>([]);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteUser, setRemoteUser] = useState('');       // display name of other party
  const [remoteUserId, setRemoteUserId] = useState('');   // user_name for routing
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showDialer, setShowDialer] = useState(false);

  // WebRTC
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const myRoleRef = useRef<string>('');  // self-ring prevention

  // ── Build WS URL ────────────────────────────────────────────────────────────
  const getWsUrl = () => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}${wsRelayUrl}`;
  };

  // ── Cleanup helper ──────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    myRoleRef.current = '';
    setCallState('idle');
    setRemoteUser('');
    setRemoteUserId('');
    setMuted(false);
    setVideoOff(false);
  }, []);

  // ── Build RTCPeerConnection ─────────────────────────────────────────────────
  const buildPC = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };
    return pc;
  }, []);

  // ── Send a relay message ────────────────────────────────────────────────────
  const relay = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // ── Connect & register ──────────────────────────────────────────────────────
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
        ws?.send(JSON.stringify({
          type: 'REGISTER',
          userId: user.user_name,
          displayName: user.display_name,
          role: user.role,
        }));
      };

      ws.onmessage = async (evt) => {
        if (!active) return;
        let data: any;
        try { data = JSON.parse(evt.data); } catch { return; }

        switch (data.type) {
          // ── Registration confirmed ──────────────────────────────────────────
          case 'REGISTERED':
            setRegistered(true);
            ws?.send(JSON.stringify({ type: 'GET_PRESENCE' }));
            break;

          // ── Presence roster ────────────────────────────────────────────────
          case 'PRESENCE_UPDATE':
            setOnlineUsers((data.users ?? []).filter((u: PresenceUser) => u.user_name.toLowerCase() !== user.user_name.toLowerCase()));
            setActiveQueues(data.queues ?? []);
            break;

          // ── Incoming call offer ─────────────────────────────────────────────
          case 'WEBRTC_OFFER': {
            // Self-ring prevention
            if (data.from === user.user_name) break;
            // Only accept if addressed to me (or legacy broadcast)
            if (data.to && data.to !== user.user_name && data.to !== 'clio') break;

            const callerDisplay = data.fromDisplay || data.from || 'Unknown';
            setRemoteUser(callerDisplay);
            setRemoteUserId(data.from || '');
            pendingOfferRef.current = data.offer;
            setCallState('ringing_in');
            break;
          }

          // ── Remote answered our call ────────────────────────────────────────
          case 'WEBRTC_ANSWER':
            if (pcRef.current && data.answer) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              setCallState('active');
            }
            break;

          // ── ICE candidates ──────────────────────────────────────────────────
          case 'WEBRTC_ICE_CANDIDATE':
            if (pcRef.current && data.candidate) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            break;

          // ── Remote hung up ──────────────────────────────────────────────────
          case 'HOLOLINK_END':
            if (data.to === user.user_name || !data.to || data.to === 'clio') {
              endCall();
            }
            break;

          // ── Declined / busy ─────────────────────────────────────────────────
          case 'CALL_DECLINED':
          case 'CALL_BUSY':
            endCall();
            break;
        }
      };

      ws.onclose = () => {
        setRegistered(false);
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
      endCall();
    };
  }, [user.user_name]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── PITCH: Start an outbound call ──────────────────────────────────────────
  const makeCall = useCallback(async (toUserId: string, toDisplay: string, toQueue?: string) => {
    setShowDialer(false);
    setRemoteUser(toDisplay);
    setRemoteUserId(toUserId);
    setCallState('ringing_out');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = buildPC();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          relay({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: e.candidate,
            from: user.user_name,
            to: toQueue ? undefined : toUserId,
            toQueue: toQueue,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      relay({
        type: 'WEBRTC_OFFER',
        offer,
        from: user.user_name,
        fromDisplay: user.display_name,
        to: toQueue ? undefined : toUserId,
        toQueue: toQueue,
      });

    } catch (err) {
      console.error('Call failed:', err);
      endCall();
    }
  }, [user, buildPC, relay, endCall]);

  useEffect(() => {
    const handleDialUser = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && ce.detail.user_name) {
        makeCall(ce.detail.user_name, ce.detail.display_name, ce.detail.queue);
      }
    };
    window.addEventListener('hololink-call-user', handleDialUser);
    return () => window.removeEventListener('hololink-call-user', handleDialUser);
  }, [makeCall]);

  // ── CATCH: Answer an incoming call ─────────────────────────────────────────
  const answerCall = useCallback(async () => {
    if (!pendingOfferRef.current) return;
    setCallState('active');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = buildPC();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          relay({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: e.candidate,
            from: user.user_name,
            to: remoteUserId,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      relay({
        type: 'WEBRTC_ANSWER',
        answer,
        from: user.user_name,
        to: remoteUserId,
      });

      pendingOfferRef.current = null;

    } catch (err) {
      console.error('Answer failed:', err);
      endCall();
    }
  }, [buildPC, relay, endCall, remoteUserId, user.user_name]);

  const declineCall = useCallback(() => {
    relay({ type: 'CALL_DECLINED', from: user.user_name, to: remoteUserId });
    endCall();
  }, [relay, endCall, remoteUserId, user.user_name]);

  const hangUp = useCallback(() => {
    relay({ type: 'HOLOLINK_END', from: user.user_name, to: remoteUserId });
    endCall();
  }, [relay, endCall, remoteUserId, user.user_name]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setVideoOff(v => !v);
  };

  // ── Queue display name helper ───────────────────────────────────────────────
  const queueLabel = (q: string) => {
    const labels: Record<string, string> = {
      aether_vet: '🏥 Aether Vet Clinic',
      fanstack: '🎙️ FanStack Studio',
      gardenstack: '🌿 GardenStack',
    };
    return labels[q] ?? q;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  // ── Incoming ring overlay ───────────────────────────────────────────────────
  if (callState === 'ringing_in') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center">
        <div className="bg-[#0d1117] border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl min-w-[320px]">
          <div className="w-20 h-20 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/30 flex items-center justify-center animate-pulse">
            <PhoneIncoming className="w-8 h-8 text-[#00d4aa]" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-[#00d4aa] uppercase tracking-widest mb-1">Incoming HoloLink Call</p>
            <p className="text-2xl font-bold text-white">{remoteUser}</p>
          </div>
          <div className="flex gap-6">
            <button
              onClick={declineCall}
              className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
            >
              <PhoneMissed className="w-6 h-6" />
            </button>
            <button
              onClick={answerCall}
              className="w-16 h-16 rounded-full bg-[#00d4aa]/20 border border-[#00d4aa] flex items-center justify-center text-[#00d4aa] hover:bg-[#00d4aa] hover:text-black transition-all"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active call overlay ─────────────────────────────────────────────────────
  if (callState === 'active' || callState === 'ringing_out') {
    return (
      <div className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2">
        {/* Remote video */}
        <div className="w-72 h-48 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {callState === 'ringing_out' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2">
              <div className="w-10 h-10 rounded-full border-2 border-[#00d4aa] border-t-transparent animate-spin" />
              <p className="text-xs text-white/60 font-mono">Calling {remoteUser}…</p>
            </div>
          )}
          {/* Local PiP */}
          <div className="absolute bottom-2 right-2 w-16 h-20 rounded-lg overflow-hidden border border-white/20">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          {/* Name tag */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-full">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{remoteUser}</span>
          </div>
        </div>
        {/* Controls */}
        <div className="flex justify-center gap-2">
          <button onClick={toggleMute}
            className={`p-2.5 rounded-full border transition-all ${muted ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}>
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={toggleVideo}
            className={`p-2.5 rounded-full border transition-all ${videoOff ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}>
            {videoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
          <button onClick={hangUp}
            className="p-2.5 rounded-full bg-red-500 border border-red-600 text-white hover:bg-red-600 transition-all">
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Idle: floating phone button + dialer panel ──────────────────────────────
  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setShowDialer(d => !d)}
        className={`fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-full shadow-2xl border transition-all flex items-center justify-center group
          ${registered
            ? 'bg-[#00d4aa] border-[#00d4aa]/50 text-black hover:scale-110 shadow-[0_0_24px_rgba(0,212,170,0.4)]'
            : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'}`}
        title={registered ? 'HoloLink — Open dialer' : 'Connecting to Sovereign Mesh…'}
      >
        <Phone className="w-6 h-6" />
        {/* Online count badge */}
        {onlineUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00d4aa] text-black text-[9px] font-bold flex items-center justify-center border-2 border-[#0d1117]">
            {onlineUsers.length}
          </span>
        )}
      </button>

      {/* Dialer panel */}
      {showDialer && (
        <div className="fixed bottom-24 right-6 z-[9991] w-72 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">HoloLink</span>
            </div>
            <button onClick={() => setShowDialer(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-80 overflow-y-auto">

            {/* Waiting rooms / queues */}
            {activeQueues.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Waiting Rooms</p>
                {activeQueues.map(q => (
                  <button
                    key={q}
                    onClick={() => makeCall(q, queueLabel(q), q)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{queueLabel(q)}</p>
                      <p className="text-[10px] text-white/40">Call into waiting room</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Online users */}
            {onlineUsers.length > 0 ? (
              <div>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Online
                </p>
                {onlineUsers.map(u => (
                  <button
                    key={u.user_name}
                    onClick={() => makeCall(u.user_name, u.display_name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {u.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d1117]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.display_name}</p>
                      <p className="text-[10px] text-white/40 capitalize">{u.role}</p>
                    </div>
                    <Phone className="w-4 h-4 text-[#00d4aa] ml-auto opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-white/30">No other users online</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
