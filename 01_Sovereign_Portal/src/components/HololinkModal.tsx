import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, PhoneIncoming, X } from 'lucide-react';

export default function HololinkModal() {
  const [showRinger, setShowRinger] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [caller, setCaller] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Dragging state for PiP
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: 100 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Connect to Sovereign Mesh Relay
    const wsUrl = 'wss://clio.taila01894.ts.net/ws-relay';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // 1. Incoming Call
        if (msg.type === 'HOLOLINK_REQUEST' && msg.target === 'clio') {
            // wait, in the Dashboard we set target='grogu'. 
            // So iPad -> Grogu. Grogu is the one calling Clio!
            // Wait, does Grogu send HOLOLINK_REQUEST to clio?
            // Yes, Grogu sends WEBRTC_OFFER to clio.
        }
        
        if (msg.type === 'WEBRTC_OFFER' && msg.target === 'clio') {
          setCaller(msg.from.toUpperCase());
          setShowRinger(true);
          // Store offer to process when accepted
          window.sessionStorage.setItem('pending_offer', JSON.stringify(msg.offer));
          window.sessionStorage.setItem('caller_id', msg.from);
        }

        // 3. ICE Candidates from Grogu
        if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.target === 'clio') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
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
  }, []);

  const acceptCall = async () => {
    setShowRinger(false);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          const targetCaller = window.sessionStorage.getItem('caller_id') || 'grogu';
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: 'clio',
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
            from: 'clio',
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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  if (!showRinger && !inCall) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Ringer Modal */}
      {showRinger && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
          <div className="bg-black border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)] rounded-3xl p-8 flex flex-col items-center max-w-sm w-full mx-4">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mb-6 animate-pulse">
              <PhoneIncoming className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-mono text-white mb-2">INCOMING HOLOLINK</h2>
            <p className="text-cyan-400 font-mono text-xl mb-8 tracking-widest">{caller}</p>
            <div className="flex gap-4 w-full">
              <button onClick={endCall} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold uppercase tracking-widest transition-colors border border-white/10">
                Decline
              </button>
              <button onClick={acceptCall} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PiP Call Window */}
      {inCall && (
        <div 
          className="absolute pointer-events-auto bg-black rounded-2xl overflow-hidden border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.3)] flex flex-col cursor-move"
          style={{ width: 320, height: 480, transform: `translate(${position.x}px, ${position.y}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Header */}
          <div className="bg-zinc-900/80 backdrop-blur px-4 py-2 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-white uppercase tracking-widest">Hololink Active</span>
            </div>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { endCall(); if (wsRef.current) wsRef.current.send(JSON.stringify({type: 'HOLOLINK_END'})); }} className="text-white/50 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Remote Video (Eileen) */}
          <div className="flex-1 relative bg-zinc-950">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Local Video PiP (James) */}
            <div className="absolute bottom-4 right-4 w-24 h-32 bg-black rounded-lg overflow-hidden border border-white/20 shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-zinc-900/80 backdrop-blur p-3 flex justify-center">
             <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { endCall(); if (wsRef.current) wsRef.current.send(JSON.stringify({type: 'HOLOLINK_END'})); }} className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
               <VideoOff size={20} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
