/**
 * HololinkHub — Sovereign OS Universal Video Call Hub
 *
 * Consumes global WebRTC state from HoloLinkContext.
 * Handles rendering of:
 *   - incoming call overlay
 *   - active call overlay with local/remote video
 *   - floating phone button & dialer panel
 */

import React, { useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, PhoneIncoming, PhoneMissed,
  Video, VideoOff, Mic, MicOff, X, Users, Stethoscope,
} from 'lucide-react';
import { useHoloLink } from '../contexts/HoloLinkContext';

interface HololinkHubProps {
  user?: any;
  wsRelayUrl?: string;
}

export default function HololinkHub({ user, wsRelayUrl }: HololinkHubProps = {}) {
  const {
    registered,
    onlineUsers,
    activeQueues,
    callState,
    remoteUser,
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
  } = useHoloLink();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sync streams to video elements
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Queue display name helper
  const queueLabel = (q: string) => {
    const labels: Record<string, string> = {
      aether_vet: '🏥 Aether Vet Clinic',
      fanstack: '🎙️ FanStack Studio',
      gardenstack: '🌿 GardenStack',
    };
    return labels[q] ?? q;
  };

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
