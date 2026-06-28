import { useState } from 'react';
import { ShieldCheck, Video, VideoOff, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

interface User {
  user_name: string;
  display_name: string;
  role: string;
  status: string;
}

interface HoloLinkPortalProps {
  intercomStatus: 'idle' | 'calling' | 'ringing_in' | 'connected';
  onlineUsers: User[];
  relayConnected: boolean;
  callingTarget: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  onMakeCall: (targetId: string, display: string) => void;
  onCallBarbTV: () => void;
  onHangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  intercomMuted: boolean;
  videoOff: boolean;
}

export default function HoloLinkPortal({
  intercomStatus,
  onlineUsers,
  relayConnected,
  callingTarget,
  localVideoRef,
  remoteVideoRef,
  onMakeCall,
  onCallBarbTV,
  onHangUp,
  toggleMute,
  toggleVideo,
  intercomMuted,
  videoOff
}: HoloLinkPortalProps) {
  const [showHstsTip, setShowHstsTip] = useState(false);

  // Standby list for display (if offline)
  const roster = [
    { id: 'james', name: 'James Greene (HQ)', icon: '🧔' },
    { id: 'barb_tv', name: 'Barb Greene\'s TV', icon: '🎨', customDial: true },
    { id: 'allyson', name: 'Allyson Greene (Standby)', icon: '👩' },
    { id: 'sean', name: 'Sean Greene (Standby)', icon: '👨' }
  ];

  return (
    <div className="cardboard-panel p-6 bg-white flex flex-col justify-between min-h-[480px]">
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <Video className="w-4.5 h-4.5 text-[#c25134]" /> HoloLink Telepresence
          </h2>
          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-sans font-bold border ${relayConnected ? 'bg-[#436850]/8 text-[#436850] border-[#436850]/20' : 'bg-[#9c3120]/8 text-[#9c3120] border-[#9c3120]/20'}`}>
            {relayConnected ? 'SIGNAL ONLINE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Dial / Idle State */}
        {intercomStatus === 'idle' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 font-sans">
              One-tap direct encrypted telepresence connection over secure Tailscale mesh.
            </p>

            {/* HSTS Tip button */}
            <button 
              onClick={() => setShowHstsTip(!showHstsTip)}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-250 text-gray-700 font-mono text-[9px] font-bold py-1.5 px-3 rounded-lg cursor-pointer uppercase tracking-widest transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#c25134]" />
              <span>Tailscale Chrome Security Warning Bypass</span>
            </button>

            {showHstsTip && (
              <div className="bg-[#9c3120]/5 border border-[#9c3120]/20 p-3.5 rounded-xl font-mono text-[10px] text-gray-750 leading-relaxed space-y-1.5 animate-fadeIn">
                <span className="font-bold uppercase text-[#9c3120] block">⚠️ HSTS Connection Bypass:</span>
                <p>If you see a secure connection warning page in Chrome, do not click away.</p>
                <p className="font-bold underline">Click anywhere on the blank area of the warning page and type: <code className="bg-white px-1 py-0.5 border border-gray-200 text-red-655 font-bold rounded">thisisunsafe</code> on your keyboard.</p>
                <p>Chrome will instantly reload and securely connect to the local Outpost portal.</p>
              </div>
            )}

            {/* Roster Buttons */}
            <div className="space-y-2.5 pt-2">
              {roster.map(member => {
                const isOnline = onlineUsers.some(u => u.user_name.toLowerCase() === member.id.toLowerCase());
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      if (member.customDial) {
                        onCallBarbTV();
                      } else {
                        onMakeCall(member.id, member.name);
                      }
                    }}
                    className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#c25134]/40 text-gray-800 rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{member.icon}</span>
                      <span>{member.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-sans text-[9px] font-bold">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#436850] animate-pulse' : 'bg-gray-300'}`}></span>
                      <span className="uppercase text-gray-400">{isOnline ? 'DIAL' : 'STANDBY'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calling Outbound State */}
        {intercomStatus === 'calling' && (
          <div className="bg-gray-50/50 border border-gray-150 p-6 rounded-2xl text-center space-y-4 flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-14 h-14 rounded-full bg-[#c25134]/10 border-2 border-[#c25134] flex items-center justify-center animate-ping text-xl">
              📞
            </div>
            <div>
              <h4 className="font-sans text-[10px] font-bold text-[#c25134] uppercase tracking-widest">Opening Mesh Tunnel...</h4>
              <p className="text-xs text-gray-700 font-serif font-extrabold mt-1.5">{callingTarget}</p>
            </div>
            <button
              onClick={onHangUp}
              className="py-2 px-5 bg-[#9c3120] hover:bg-[#862517] text-white font-bold rounded-xl cursor-pointer uppercase tracking-widest text-[9px] shadow-sm"
            >
              Cancel Call
            </button>
          </div>
        )}

        {/* Active Connected State */}
        {intercomStatus === 'connected' && (
          <div className="space-y-4">
            {/* TV Screen Container */}
            <div className="relative border border-gray-200 bg-black rounded-2xl overflow-hidden shadow-md aspect-video w-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2.5 right-2.5 w-24 h-18 bg-gray-900 rounded-lg overflow-hidden border border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
              <div className="absolute top-2.5 left-2.5 bg-[#c25134] text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                ENCRYPTED MESH FEED
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center font-sans">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Telepresence Active</h4>
              <p className="text-xs text-gray-800 font-bold mt-1">Connected with: {callingTarget}</p>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={toggleMute}
                className={`flex-grow py-2 rounded-xl border font-mono text-[9px] font-bold cursor-pointer uppercase shadow-sm transition-all flex items-center justify-center gap-1.5 ${intercomMuted ? 'bg-[#9c3120] text-white border-[#9c3120]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {intercomMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{intercomMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                onClick={toggleVideo}
                className={`flex-grow py-2 rounded-xl border font-mono text-[9px] font-bold cursor-pointer uppercase shadow-sm transition-all flex items-center justify-center gap-1.5 ${videoOff ? 'bg-[#9c3120] text-white border-[#9c3120]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {videoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{videoOff ? 'Cam On' : 'Cam Off'}</span>
              </button>
              <button
                onClick={onHangUp}
                className="flex-grow py-2 bg-[#9c3120] hover:bg-[#862517] text-white font-mono text-[9px] font-bold rounded-xl cursor-pointer uppercase shadow-sm flex items-center justify-center"
              >
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] leading-relaxed mt-4 font-sans text-gray-500 flex items-start gap-1.5 font-medium">
        <ShieldCheck className="w-4 h-4 text-[#436850] shrink-0 mt-0.5" />
        <span>HoloLink relay enforces local-first encryption. No external server logs.</span>
      </div>
    </div>
  );
}
