import { useState } from 'react';
import { Coins, History, ArrowRight, ShieldAlert, Hourglass, Activity, Wallet } from 'lucide-react';

export default function EquityTipEngine() {
  const [pizzaPrice, setPizzaPrice] = useState(25.00);
  const [tipPercent, setTipPercent] = useState(20);
  const [extremeSpiteMode, setExtremeSpiteMode] = useState(false);
  const [tipLedger, setTipLedger] = useState<{ date: string, subtotal: number, tip: number, mode: string }[]>([
    { date: "May 30, 2026", subtotal: 18.00, tip: 4.50, mode: "Standard" },
    { date: "May 29, 2026", subtotal: 35.00, tip: 12.25, mode: "Extreme Spite" }
  ]);

  // HEDLIF Delivery Dispatch State
  const [peteWallet, setPeteWallet] = useState(142.50);
  const [sacamanoWallet, setSacamanoWallet] = useState(95.00);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState("");
  const [simLogs, setSimLogs] = useState<string[]>([
    "System loaded. HEDLIF monitoring active."
  ]);

  const rawTip = pizzaPrice * (tipPercent / 100);
  const spiteMultiplier = extremeSpiteMode ? 1.5 : 1.0;
  const totalTip = rawTip * spiteMultiplier;

  // Split allocations
  const driverAllocation = totalTip * 0.70; // 70% straight to delivery personnel
  const flourAllocation = totalTip * 0.20; // 20% to premium local sourdough flour supplies
  const warChestAllocation = totalTip * 0.10; // 10% to defend lawsuits from Mocha Joe

  const handleApplyTip = () => {
    setTipLedger(prev => [
      {
        date: "Today, Just Now",
        subtotal: pizzaPrice,
        tip: totalTip,
        mode: extremeSpiteMode ? "Extreme Spite" : "Standard"
      },
      ...prev
    ]);
    alert(`Tip of $${totalTip.toFixed(2)} applied successfully! $${driverAllocation.toFixed(2)} is routed directly to the Smyrna delivery rider's wallet.`);
  };

  const handleSimulateHEDLIF = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep("QUEUE_CHECK");
    setSimLogs(prev => ["Checking delivery queue balance metrics...", ...prev]);

    setTimeout(() => {
      const variance = Math.abs(peteWallet - sacamanoWallet);
      setSimStep("EVALUATING");
      setSimLogs(prev => [
        `Tipping Imbalance: $${variance.toFixed(2)} detected. (HEDLIF Limit: $30.00)`,
        ...prev
      ]);

      setTimeout(() => {
        if (variance > 30) {
          setSimStep("THROTTLING");
          setSimLogs(prev => [
            "⚠️ HEDLIF Coils engaged! Injecting +180s ethical latency penalty to Slippery Pete...",
            ...prev
          ]);

          setTimeout(() => {
            setSimStep("DISPATCHED_BOB");
            const generatedTip = 25.00;
            setSacamanoWallet(w => w + generatedTip);
            setSimLogs(prev => [
              `🚀 Routed pizza order to Bob Sacamano! Added $${generatedTip.toFixed(2)} to Bob's wallet.`,
              `Success: Wallet variance balanced to $${Math.abs(peteWallet - (sacamanoWallet + 25.00)).toFixed(2)}!`,
              ...prev
            ]);
            setIsSimulating(false);
            setSimStep("");
          }, 2000);

        } else {
          setSimStep("ROUTING_STANDARD");
          setSimLogs(prev => [
            "Wallets are equitable! Standard greed-based routing applied...",
            ...prev
          ]);

          setTimeout(() => {
            setSimStep("DISPATCHED_PETE");
            const generatedTip = 18.50;
            setPeteWallet(w => w + generatedTip);
            setSimLogs(prev => [
              `🚀 Routed standard order to Slippery Pete! Added $${generatedTip.toFixed(2)} to Pete's wallet.`,
              ...prev
            ]);
            setIsSimulating(false);
            setSimStep("");
          }, 2000);
        }
      }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <Coins size={16} className="text-red-500" />
          <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase">SMYRNA EQUITABLE TIP CONSOLE</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Equity Tip Multiplier Engine</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-xl">
          Applies spite-based multipliers to tips, routing 70% straight to Smyrna delivery personnel and 10% into legal defense funds to fight off coffee competitors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tip inputs and adjustments */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Tip configuration console</h3>

          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-6">
            
            {/* Input price field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Order Price (USD)</label>
                <input 
                  type="number"
                  min="5"
                  max="500"
                  step="0.50"
                  value={pizzaPrice}
                  onChange={(e) => setPizzaPrice(Math.max(5, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-2xl text-xs font-mono text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              {/* Tipping preset buttons */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Select Tip Percentage</label>
                <div className="flex gap-2.5">
                  {[15, 20, 25, 35].map((pct) => (
                    <button 
                      key={pct}
                      onClick={() => setTipPercent(pct)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                        tipPercent === pct 
                          ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                          : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {pct}% {pct === 35 ? '🔥' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extreme spite toggle */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white block">Extreme Spite Multiplier</span>
                <span className="text-[10px] font-mono text-slate-500">Applies a 1.5x multiplier to the delivery tip to aggressively support local workers.</span>
              </div>
              
              <button 
                onClick={() => setExtremeSpiteMode(!extremeSpiteMode)}
                className={`px-4 py-2 rounded-xl font-mono text-[9px] font-black uppercase tracking-wider transition-all border ${
                  extremeSpiteMode 
                    ? 'bg-red-500 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {extremeSpiteMode ? 'ACTIVE (1.5x)' : 'ENABLE'}
              </button>
            </div>

            {/* Calculated tip breakdown */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">TOTAL MULTIPLIED TIP</span>
                  <span className="text-lg font-mono font-black text-red-400 mt-0.5">${totalTip.toFixed(2)} USD</span>
                </div>
                
                <button 
                  onClick={handleApplyTip}
                  className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-1.5"
                >
                  TRANSMIT TIP <ArrowRight size={12} />
                </button>
              </div>

              {/* Allocation list breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px]">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block">Driver (70%)</span>
                  <span className="text-emerald-400 font-bold font-mono text-xs">${driverAllocation.toFixed(2)}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block">Flour Fund (20%)</span>
                  <span className="text-slate-200 font-bold font-mono text-xs">${flourAllocation.toFixed(2)}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block">Legal War-Chest (10%)</span>
                  <span className="text-red-400 font-bold font-mono text-xs">${warChestAllocation.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* HEDLIF Engine & Tip History Ledger */}
        <div className="space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">HEDLIF & tip controls</h3>

          {/* HEDLIF Panel */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-6">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-red-500 animate-pulse" /> HEDLIF Dispatch Engine
            </h4>

            {/* Rider Balance stats */}
            <div className="grid grid-cols-2 gap-4 font-mono text-[10px]">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-slate-500 block font-bold">Slippery Pete (Greed)</span>
                <span className="text-red-400 font-black font-mono text-sm mt-0.5 block">${peteWallet.toFixed(2)}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-slate-500 block font-bold">Bob Sacamano (Ethical)</span>
                <span className="text-emerald-400 font-black font-mono text-sm mt-0.5 block">${sacamanoWallet.toFixed(2)}</span>
              </div>
            </div>

            {/* Imbalance Meter */}
            <div className="bg-black/25 p-4 rounded-2xl border border-white/5 space-y-3.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">Wallet Imbalance Variance:</span>
                <span className={`font-black font-mono text-sm ${Math.abs(peteWallet - sacamanoWallet) > 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  ${Math.abs(peteWallet - sacamanoWallet).toFixed(2)}
                </span>
              </div>

              {/* Status Badge */}
              {Math.abs(peteWallet - sacamanoWallet) > 30 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2.5 items-center">
                  <ShieldAlert size={16} className="text-red-500 shrink-0 animate-bounce" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-red-400 block tracking-wider">HEDLIF ACTIVE (+180s Penalty)</span>
                    <span className="text-[8px] font-mono text-slate-500">Pete's greed-based route is heavily throttled to force equitable rebalancing.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-center">
                  <Wallet size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">HEDLIF STANDBY</span>
                    <span className="text-[8px] font-mono text-slate-500">Tipping balance is equitable under the $30 threshold limits.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sim trigger */}
            <button
              onClick={handleSimulateHEDLIF}
              disabled={isSimulating}
              className={`w-full py-3 font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border ${
                isSimulating
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 cursor-not-allowed'
                  : 'bg-red-500 border-transparent hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`}
            >
              {isSimulating ? (
                <>
                  <Hourglass size={12} className="animate-spin text-red-500" />
                  SIMULATING ROUTING...
                </>
              ) : (
                <>
                  SIMULATE INCOMING ORDER <ArrowRight size={12} />
                </>
              )}
            </button>

            {/* Live simulation steps logs */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-3 font-mono text-[8px] text-slate-400 space-y-1.5 max-h-32 overflow-y-auto">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 border-b border-white/5 pb-1 uppercase">
                <span>HEDLIF Dynamic Logs</span>
                {simStep && (
                  <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 font-bold uppercase text-[7px] animate-pulse">
                    {simStep}
                  </span>
                )}
              </div>
              <div className="space-y-1 mt-1 select-none">
                {simLogs.map((log, i) => (
                  <div key={i} className="flex gap-1.5 leading-relaxed">
                    <span className="text-slate-600 font-bold shrink-0">›</span>
                    <span className={log.startsWith("🚀") || log.startsWith("Success") ? "text-emerald-400 font-bold" : log.startsWith("⚠️") ? "text-red-400 font-bold" : "text-slate-400"}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tip History Ledger */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <History size={16} className="text-red-500" /> Transaction Log
            </h4>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {tipLedger.map((log, idx) => (
                <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] font-mono flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold">Subtotal: ${log.subtotal.toFixed(2)}</p>
                    <p className="text-slate-500 mt-0.5">Mode: {log.mode} | {log.date}</p>
                  </div>
                  <div className="text-emerald-400 font-bold font-mono text-xs">
                    +${log.tip.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
