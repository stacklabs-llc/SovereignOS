import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export interface PresenceUser {
  user_name: string;
  display_name: string;
  role: string;
  queues: string[];
  status: 'online';
}

export type CallState = 'idle' | 'ringing_in' | 'ringing_out' | 'active';

export interface HoloLinkContextType {
  registered: boolean;
  onlineUsers: PresenceUser[];
  activeQueues: string[];
  callState: CallState;
  remoteUser: string;
  remoteUserId: string;
  muted: boolean;
  videoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  showDialer: boolean;
  setShowDialer: React.Dispatch<React.SetStateAction<boolean>>;
  makeCall: (toUserId: string, toDisplay: string, toQueue?: string) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const HoloLinkContext = createContext<HoloLinkContextType | null>(null);

export function useHoloLink() {
  const context = useContext(HoloLinkContext);
  if (!context) {
    throw new Error('useHoloLink must be used within a HoloLinkProvider');
  }
  return context;
}

interface HoloLinkProviderProps {
  children: React.ReactNode;
  user: any | null;
  wsRelayUrl?: string;
}

export function HoloLinkProvider({ children, user, wsRelayUrl = '/ws-relay' }: HoloLinkProviderProps) {
  // Relay connection refs
  const wsRef = useRef<WebSocket | null>(null);
  const [registered, setRegistered] = useState(false);

  // Presence state
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [activeQueues, setActiveQueues] = useState<string[]>([]);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteUser, setRemoteUser] = useState('');
  const [remoteUserId, setRemoteUserId] = useState('');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showDialer, setShowDialer] = useState(false);

  // WebRTC refs & states
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Build WS URL
  const getWsUrl = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}${wsRelayUrl}`;
  }, [wsRelayUrl]);

  // Clean up call helper
  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setRemoteUser('');
    setRemoteUserId('');
    setMuted(false);
    setVideoOff(false);
  }, [localStream]);

  // Send a relay message
  const relay = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Build RTCPeerConnection
  const buildPC = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };
    return pc;
  }, []);

  // Outbound call
  const makeCall = useCallback(async (toUserId: string, toDisplay: string, toQueue?: string) => {
    if (!user) return;
    setShowDialer(false);
    setRemoteUser(toDisplay);
    setRemoteUserId(toUserId);
    setCallState('ringing_out');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

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

  // Answer call
  const answerCall = useCallback(async () => {
    if (!user || !pendingOfferRef.current) return;
    setCallState('active');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

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
  }, [user, buildPC, relay, endCall, remoteUserId]);

  const declineCall = useCallback(() => {
    if (!user) return;
    relay({ type: 'CALL_DECLINED', from: user.user_name, to: remoteUserId });
    endCall();
  }, [user, relay, endCall, remoteUserId]);

  const hangUp = useCallback(() => {
    if (!user) return;
    relay({ type: 'HOLOLINK_END', from: user.user_name, to: remoteUserId });
    endCall();
  }, [user, relay, endCall, remoteUserId]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMuted(m => !m);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoOff(v => !v);
    }
  }, [localStream]);

  // Handle dial event from outside triggers
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

  // Connect & register on Mesh Relay
  useEffect(() => {
    if (!user) {
      setRegistered(false);
      setOnlineUsers([]);
      setActiveQueues([]);
      return;
    }

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
          displayName: user.display_name || user.user_name,
          role: user.role || 'Member',
        }));
      };

      ws.onmessage = async (evt) => {
        if (!active) return;
        let data: any;
        try { data = JSON.parse(evt.data); } catch { return; }

        switch (data.type) {
          case 'REGISTERED':
            setRegistered(true);
            ws?.send(JSON.stringify({ type: 'GET_PRESENCE' }));
            break;

          case 'PRESENCE_UPDATE': {
            const users = (data.users ?? []).filter(
              (u: PresenceUser) => u.user_name.toLowerCase() !== user.user_name.toLowerCase()
            );
            // Sort presence case-insensitively using lowercase and localeCompare
            users.sort((a: PresenceUser, b: PresenceUser) => {
              const nameA = (a.display_name || a.user_name || '').toLowerCase().trim();
              const nameB = (b.display_name || b.user_name || '').toLowerCase().trim();
              return nameA.localeCompare(nameB);
            });
            setOnlineUsers(users);
            setActiveQueues(data.queues ?? []);
            break;
          }

          case 'WEBRTC_OFFER': {
            if (data.from === user.user_name) break;
            if (data.to && data.to !== user.user_name && data.to !== 'clio') break;

            const callerDisplay = data.fromDisplay || data.from || 'Unknown';
            setRemoteUser(callerDisplay);
            setRemoteUserId(data.from || '');
            pendingOfferRef.current = data.offer;
            setCallState('ringing_in');
            break;
          }

          case 'WEBRTC_ANSWER':
            if (pcRef.current && data.answer) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              setCallState('active');
            }
            break;

          case 'WEBRTC_ICE_CANDIDATE':
            if (pcRef.current && data.candidate) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            break;

          case 'HOLOLINK_END':
            if (data.to === user.user_name || !data.to || data.to === 'clio') {
              endCall();
            }
            break;

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
  }, [user, getWsUrl, endCall]);

  const value = {
    registered,
    onlineUsers,
    activeQueues,
    callState,
    remoteUser,
    remoteUserId,
    muted,
    videoOff,
    localStream,
    remoteStream,
    showDialer,
    setShowDialer,
    makeCall,
    answerCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo,
  };

  return (
    <HoloLinkContext.Provider value={value}>
      {children}
    </HoloLinkContext.Provider>
  );
}
