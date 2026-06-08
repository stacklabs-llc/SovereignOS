import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, PhoneIncoming, PhoneMissed, Mic, MicOff, ActivitySquare } from 'lucide-react';

interface MobileHololinkProps {
  appName?: string;
  appColorClass?: string;
  appBorderClass?: string;
  appBgClass?: string;
  appIcon?: React.ReactNode;
}

export default function MobileHololink() {
  const [showRinger, setShowRinger] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [muted, setMuted] = useState(false);
  const [isCallingOut, setIsCallingOut] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const myRoleRef = useRef<string>(''); // tracks our own generated role to prevent self-ring

  // Parse URL parameters for branding
  const params = new URLSearchParams(window.location.search);
  const branding = params.get('app');
  
  let appName = "Sovereign OS";
  let appColorClass = "text-cyan-400";
  let appBorderClass = "border-cyan-500";
  let appBgClass = "bg-cyan-500";
  let appIcon = <Video className={`w-8 h-8 ${appColorClass}`} />;
  let appIconSmall = <Video className="w-5 h-5" />;

  if (branding === 'aether_vet') {
    appName = "Aether Vet";
    appColorClass = "text-[#38bdf8]";
    appBorderClass = "border-[#38bdf8]";
    appBgClass = "bg-[#38bdf8]";
    appIcon = <ActivitySquare className={`w-8 h-8 ${appColorClass}`} />;
    appIconSmall = <ActivitySquare className="w-5 h-5" />;
  } else if (branding === 'fanstack') {
    appName = "FanStack";
    appColorClass = "text-purple-400";
    appBorderClass = "border-purple-500";
    appBgClass = "bg-purple-500";
  } else if (branding === 'gardenstack') {
    appName = "GardenStack";
    appColorClass = "text-emerald-400";
    appBorderClass = "border-emerald-500";
    appBgClass = "bg-emerald-500";
  } else if (branding) {
    appName = branding.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  useEffect(() => {
    const wsUrl = window.location.protocol === 'https:' ? `wss://${window.location.host}/ws-relay` : `ws://${window.location.host}/ws-relay`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Listen for offers directed to this device
        if (msg.type === 'WEBRTC_OFFER') {
          // Ignore offers we sent ourselves (relay broadcasts to all, including sender)
          if (myRoleRef.current && msg.from === myRoleRef.current) return;
          // If branding is aether_vet, this device is acting as aether_vet_hq
          // Or if it's acting as a generic mobile remote
          const targetRole = branding === 'aether_vet' ? 'aether_vet_hq' : 'clio';
          if (msg.target === targetRole || msg.target === 'mobile_hololink') {
            setCaller(msg.from.toUpperCase());
            setShowRinger(true);
            window.sessionStorage.setItem('pending_offer', JSON.stringify(msg.offer));
            window.sessionStorage.setItem('caller_id', msg.from);
            window.sessionStorage.setItem('target_role', msg.target);
          }
        }

        if (msg.type === 'WEBRTC_ICE_CANDIDATE') {
          const targetRole = branding === 'aether_vet' ? 'aether_vet_hq' : 'clio';
          const myRole = window.sessionStorage.getItem('target_role') || 'mobile_hololink';
          if (msg.target === targetRole || msg.target === 'mobile_hololink' || msg.target === myRole) {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
          }
        }
        
        if (msg.type === 'WEBRTC_ANSWER') {
          const myRole = window.sessionStorage.getItem('target_role');
          if (msg.target === myRole || msg.target === 'mobile_hololink') {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
              setIsCallingOut(false);
            }
          }
        }

        if (msg.type === 'HOLOLINK_END') {
          endCall();
        }

      } catch (e) {
        // ignore
      }
    };

    return () => {
      ws.close();
      endCall();
    };
  }, [branding]);

  const makeCall = async () => {
    setIsCallingOut(true);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const myRole = 'mobile_' + Math.random().toString(36).substring(7);
      myRoleRef.current = myRole; // store so onmessage can filter out self-reflected broadcasts
      const targetRole = branding === 'aether_vet' ? 'aether_vet_hq' : (branding === 'fanstack' ? 'fanstack_hq' : 'clio');
      
      window.sessionStorage.setItem('target_role', myRole);
      window.sessionStorage.setItem('caller_id', targetRole);
      setCaller(targetRole.toUpperCase());

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: myRole,
            target: targetRole
          }));
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'WEBRTC_OFFER',
          offer: offer,
          from: myRole,
          target: targetRole
        }));
      }

    } catch (err) {
      console.error("Failed to start outbound call", err);
      endCall();
    }
  };

  const acceptCall = async () => {
    setShowRinger(false);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const myRole = window.sessionStorage.getItem('target_role') || (branding === 'aether_vet' ? 'aether_vet_hq' : 'mobile_hololink');

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          const targetCaller = window.sessionStorage.getItem('caller_id') || 'grogu';
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: myRole,
            target: targetCaller
          }));
        }
      };

      const offerData = window.sessionStorage.getItem('pending_offer');
      if (offerData) {
        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerData)));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current) {
          const targetCaller = window.sessionStorage.getItem('caller_id') || 'grogu';
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ANSWER',
            answer: answer,
            from: myRole,
            target: targetCaller
          }));
        }
        window.sessionStorage.removeItem('pending_offer');
      }

    } catch (err) {
      console.error("Failed to start call", err);
      endCall();
    }
  };

  const endCall = () => {
    setShowRinger(false);
    setInCall(false);
    setIsCallingOut(false);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMuted(!muted);
    }
  };

  // If no incoming call and not in call, show a standby screen for mobile
  if (!showRinger && !inCall) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col items-center justify-center font-sans text-white p-6">
        <div className={`w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center mb-8 bg-white/5`}>
          {appIcon}
        </div>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2 text-center">{appName}</h1>
        <p className="text-sm font-bold text-white/50 tracking-widest uppercase mb-12">HoloLink Standby</p>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Network Connected</span>
        </div>
        
        <button 
          onClick={makeCall}
          className={`px-8 py-4 rounded-full ${appBgClass} text-black font-bold uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-transform active:scale-95 flex items-center gap-3`}
        >
          <Video className="w-5 h-5" />
          Connect to {appName}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col font-sans">
      {/* Ringer Screen */}
      {showRinger && (
        <div className="flex-1 flex flex-col items-center justify-between py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#38bdf8]/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center z-10 text-center">
            <div className="mb-6">
              {appIcon}
            </div>
            <div className={`text-xs font-bold uppercase tracking-widest ${appColorClass} mb-3`}>
              {appName} HoloLink
            </div>
            <h1 className="text-3xl font-light text-white tracking-widest mb-3">INCOMING CALL</h1>
            <p className="text-2xl font-bold text-white uppercase">{caller}</p>
          </div>

          <div className="flex flex-col items-center w-full z-10">
            <div className={`w-32 h-32 rounded-full border border-white/20 flex items-center justify-center animate-pulse mb-16 bg-black/50 shadow-[0_0_40px_rgba(56,189,248,0.2)]`}>
              <PhoneIncoming className={`w-12 h-12 ${appColorClass}`} />
            </div>

            <div className="flex w-full justify-around px-8 max-w-sm">
              <button 
                onClick={() => {
                  endCall();
                  if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'HOLOLINK_END' }));
                }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <PhoneMissed className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Decline</span>
              </button>
              
              <button 
                onClick={acceptCall}
                className="flex flex-col items-center gap-3"
              >
                <div className={`w-16 h-16 rounded-full ${appBgClass} flex items-center justify-center text-black shadow-[0_0_20px_rgba(56,189,248,0.4)]`}>
                  <PhoneIncoming className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In Call Screen */}
      {inCall && (
        <div className="flex-1 flex flex-col relative bg-zinc-950">
          {/* Header */}
          <div className="absolute top-0 left-0 w-full z-20 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pt-12">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white`}>
                {appIconSmall}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{appName}</span>
                <span className="text-sm font-bold text-white uppercase">{caller}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">LIVE</span>
            </div>
          </div>

          {/* Video Feeds */}
          <div className="flex-1 relative bg-black">
            {/* Remote */}
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center text-white/20 font-mono text-xs tracking-widest uppercase pointer-events-none -z-10">
              Awaiting Stream...
            </div>
            
            {/* Local PiP */}
            <div className={`absolute bottom-32 right-6 w-28 h-40 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-20`}>
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>
          </div>

          {/* Controls Footer */}
          <div className="absolute bottom-0 left-0 w-full z-20 pb-10 pt-16 px-10 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-between items-center">
            <button 
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-colors ${muted ? 'bg-amber-500/20 border-amber-500 text-amber-500' : ''}`}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button 
              onClick={() => { endCall(); if (wsRef.current) wsRef.current.send(JSON.stringify({type: 'HOLOLINK_END'})); }}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-95"
            >
              <VideoOff className="w-8 h-8" />
            </button>
            
            <div className="w-14 h-14" /> {/* Spacer to center the hangup button */}
          </div>
        </div>
      )}
    </div>
  );
}
