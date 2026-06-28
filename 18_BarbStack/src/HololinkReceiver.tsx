import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, VideoOff } from 'lucide-react';

export default function HololinkReceiver() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Listening for Hololink Pings...');
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Determine the relay address
    const wsUrl = 'wss://clio.taila01894.ts.net/ws-relay';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('Sovereign Relay Connected. Awaiting Hololink Ping.');
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // 1. We receive the "Wake Up" ping from iPad
        if (msg.type === 'HOLOLINK_REQUEST' && msg.target === 'barb_tv') {
          setStatus('Hololink Request Received. Activating Camera and Calling HQ...');
          await startCall(msg.from);
        }
        
        // 2. We receive an Answer from Clio HQ
        else if (msg.type === 'WEBRTC_ANSWER' && msg.target === 'barb_tv') {
          setStatus('Connecting to HQ...');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        }
        
        // 3. We receive ICE Candidates from Clio HQ
        else if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.target === 'barb_tv') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        }
        
        // 4. End call
        else if (msg.type === 'HOLOLINK_END') {
          endCall();
        }
      } catch {
        // ignore non-json
      }
    };

    return () => {
      ws.close();
      endCall();
    };
  }, []);

  async function startCall(callerId: string = 'clio') {
    try {
      let stream: MediaStream | null = null;
      try {
        // First try grabbing both camera and mic (works for Grogu with Suzie Q mic)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        // If it failed, it's likely because Hobbes doesn't have a mic attached. Try Video Only!
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStatus('Camera initialized without microphone.');
        } catch {
          setStatus('Hardware Node Camera/Mic not found. Proceeding in Receive-Only Mode.');
        }
      }

      setIsInCall(true); 
      if (stream) {
        setLocalStream(stream);
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Standard STUN for NAT traversal if Tailscale direct fails
      });
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } else {
        // Explicitly set transceivers to receive media if we have no local tracks to send
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStatus('Connected to HQ.');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: 'barb_tv',
            target: callerId
          }));
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send the offer to Clio
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'WEBRTC_OFFER',
          offer: offer,
          from: 'barb_tv',
          target: callerId
        }));
      }

    } catch (err) {
      setStatus('Critical WebRTC Failure: ' + err);
    }
  }

  useEffect(() => {
    if (isInCall && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isInCall, localStream]);

  function endCall() {
    setIsInCall(false);
    setStatus('Listening for Hololink Pings...');
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
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {!isInCall ? (
        <div className="flex flex-col items-center">
          <ShieldAlert className="w-16 h-16 text-green-500 mb-6 opacity-80" />
          <h1 className="text-3xl font-mono tracking-widest text-white/50 mb-4 uppercase">Barb's Remote Node</h1>
          <p className="text-xl font-mono text-green-400 animate-pulse">{status}</p>
        </div>
      ) : (
        <div className="w-full h-screen relative bg-zinc-900">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 right-8 w-64 h-48 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
          
          <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
             <span className="font-mono text-sm tracking-widest uppercase">Hololink Active</span>
          </div>

          <button 
            onClick={() => {
              endCall();
              if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'HOLOLINK_END' }));
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <VideoOff size={20} /> End Hololink
          </button>
        </div>
      )}
    </div>
  );
}
