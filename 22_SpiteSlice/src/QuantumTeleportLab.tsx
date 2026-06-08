import { useState, useEffect } from 'react';
import { Zap, Compass, Cpu } from 'lucide-react';

export default function QuantumTeleportLab() {
  const [teleporting, setTeleporting] = useState(false);
  const [teleportState, setTeleportState] = useState<'idle' | 'charging' | 'disintegrating' | 'tunneling' | 'assembling' | 'done'>('idle');
  const [latitude, setLatitude] = useState('36.1627'); // Nashville coordinates
  const [longitude, setLongitude] = useState('-86.7816');
  const [particleLogs, setParticleLogs] = useState<string[]>([]);
  const [chargeProgress, setChargeProgress] = useState(0);

  const logs = {
    charging: [
      "[SYSTEM] Loading Pizzabot core quantum fusion grid...",
      "[SYSTEM] Pre-heating sub-atomic space-time pizza stone to 900°F...",
      "[STATCAST] Locking coordinates onto Tailnet remote node..."
    ],
    disintegrating: [
      "[PARTICLE] Beginning sourdough molecule deconstruction...",
      "[PARTICLE] Converting mozzarella lipids into localized energy fields...",
      "[WARNING] Spicy pepperoni lipids are highly unstable! Regulating heat bounds..."
    ],
    tunneling: [
      "[QUANTUM] Opening Einstein-Rosen tomato-sauce corridor...",
      "[QUANTUM] Teleporting pie molecules through secure Tailscale sandbox tunnel...",
      "[QUANTUM] Molecular velocity peaking at 2.4 million slices/sec..."
    ],
    assembling: [
      "[PARTICLE] Re-assembling crispy sourdough atomic structure...",
      "[PARTICLE] Cold soda molecules locked into safe carbonated state...",
      "[SYSTEM] Finalizing re-assembly. Pie temperature audited at 180°F..."
    ]
  };

  const startTeleportation = () => {
    if (teleporting) return;
    setTeleporting(true);
    setTeleportState('charging');
    setChargeProgress(0);
    setParticleLogs(["[SYSTEM] Sequence initialized by Pilot."]);
  };

  useEffect(() => {
    if (!teleporting) return;

    let timer: any;
    
    if (teleportState === 'charging') {
      const chargeInterval = setInterval(() => {
        setChargeProgress(prev => {
          if (prev >= 100) {
            clearInterval(chargeInterval);
            setTeleportState('disintegrating');
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      
      setParticleLogs(prev => [...prev, ...logs.charging]);
      return () => clearInterval(chargeInterval);
    }

    if (teleportState === 'disintegrating') {
      timer = setTimeout(() => {
        setParticleLogs(prev => [...prev, ...logs.disintegrating]);
        setTeleportState('tunneling');
      }, 1000);
    } else if (teleportState === 'tunneling') {
      timer = setTimeout(() => {
        setParticleLogs(prev => [...prev, ...logs.tunneling]);
        setTeleportState('assembling');
      }, 1200);
    } else if (teleportState === 'assembling') {
      timer = setTimeout(() => {
        setParticleLogs(prev => [...prev, ...logs.assembling]);
        setTeleportState('done');
      }, 1000);
    } else if (teleportState === 'done') {
      timer = setTimeout(() => {
        setParticleLogs(prev => [...prev, "[SUCCESS] Quantum teleportation fully complete! Sourdough pie intact."]);
        setTeleporting(false);
      }, 800);
    }

    return () => clearTimeout(timer);
  }, [teleporting, teleportState]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-red-500" />
          <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase">PIZZA-BOT QUANTUM TRANSPORTER</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Molecular Teleportation Lab</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-xl">
          Uses secure space-time tunnels to teleport piping hot sourdough pizza slices straight to custom coordinates. No lazy drivers, zero heat loss.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Teleportation Chamber Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Quantum Transporter Chamber</h3>

          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
            {/* Visual grid backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none" />

            {/* Glowing Pizza Chamber */}
            <div className="relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center bg-black/40 shadow-inner">
              {/* Particle rings depending on state */}
              {teleportState !== 'idle' && teleportState !== 'done' && (
                <div className={`absolute inset-0 rounded-full border border-red-500/30 animate-spin border-dashed duration-1000 ${
                  teleportState === 'tunneling' ? 'scale-110 opacity-100 border-red-400 animate-pulse' : ''
                }`} />
              )}
              {teleportState === 'tunneling' && (
                <div className="absolute inset-[-10px] rounded-full border border-cyan-500/20 animate-ping duration-700" />
              )}

              {/* Pizza illustration */}
              <div className={`text-6xl select-none transition-all duration-500 ${
                teleportState === 'idle' ? 'scale-100 opacity-100 rotate-0' :
                teleportState === 'charging' ? 'scale-110 opacity-100 rotate-12 blur-[1px]' :
                teleportState === 'disintegrating' ? 'scale-75 opacity-50 blur-[5px] rotate-45' :
                teleportState === 'tunneling' ? 'scale-0 opacity-0 blur-[15px]' :
                teleportState === 'assembling' ? 'scale-75 opacity-60 blur-[3px] -rotate-12' :
                'scale-100 opacity-100 rotate-0 animate-bounce'
              }`}>
                🍕
              </div>

              {/* Holographic state overlay */}
              {teleportState === 'tunneling' && (
                <span className="text-cyan-400 font-mono text-[9px] font-black uppercase tracking-widest animate-pulse">
                  TUNNELING...
                </span>
              )}
            </div>

            {/* Charging indicator */}
            {teleportState === 'charging' && (
              <div className="w-64 bg-white/5 h-1.5 rounded-full mt-6 overflow-hidden border border-white/5">
                <div className="bg-red-500 h-full rounded-full transition-all duration-150" style={{ width: `${chargeProgress}%` }} />
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-white text-xs font-mono font-bold uppercase tracking-wider">
                {teleportState === 'idle' && 'CHAMBER STANDBY'}
                {teleportState === 'charging' && `CHARGING FUSION COILS... ${chargeProgress}%`}
                {teleportState === 'disintegrating' && 'DISINTEGRATING CHEESE MOLECULES'}
                {teleportState === 'tunneling' && 'MOLECULES TUNNELING SPACETIME'}
                {teleportState === 'assembling' && 'RE-ASSEMBLING AT coordinates'}
                {teleportState === 'done' && 'TELEPORTATION COMPLETED! 🍕'}
              </p>
            </div>
          </div>
        </div>

        {/* Configurations and logs */}
        <div className="space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Sequencer Console</h3>

          {/* Coordinate settings */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <Compass size={16} className="text-red-500" />
              Target Coordinates
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Latitude</label>
                <input 
                  type="text" 
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={teleporting}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Longitude</label>
                <input 
                  type="text" 
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={teleporting}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            <button 
              onClick={startTeleportation}
              disabled={teleporting}
              className={`w-full py-3 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest border transition-all ${
                teleporting 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white border-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              }`}
            >
              {teleporting ? 'TELEPORT IN PROGRESS' : 'QUANTUM TELEPORT PIE'}
            </button>
          </div>

          {/* Telemetry logs */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-red-500" />
              Teleporter Log
            </h4>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 h-44 overflow-y-auto space-y-2 font-mono text-[9px] text-slate-400 scrollbar-thin">
              {particleLogs.length === 0 ? (
                <span className="text-slate-600">&gt; Standby for sequencer logs...</span>
              ) : (
                particleLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start leading-relaxed animate-fade-in">
                    <span className="text-red-500 shrink-0">&gt;</span>
                    <p>{log}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
