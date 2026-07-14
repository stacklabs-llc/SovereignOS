import React, { useState, useEffect, useRef } from 'react';
import { Sliders, HelpCircle, Activity, ShieldAlert, Cpu, ArrowUpRight, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';

interface RiftLog {
  id: string;
  timestamp: string;
  pair: string;
  src: string;
  dst: string;
  delta: number;
  gas: number;
  profit: number;
  status: 'pending' | 'signed' | 'executed' | 'rejected';
}

export default function DeFiArbitrageSimulator() {
  const [viewMode, setViewMode] = useState<'pilot' | 'barb'>('pilot');
  const [logs, setLogs] = useState<RiftLog[]>([]);
  const [activeTab, setActiveTab] = useState<'rifts' | 'nodes'>('rifts');

  // Sliders for Financial return calculator
  const [principal, setPrincipal] = useState<number>(100000);
  const [spread, setSpread] = useState<number>(0.55);
  const [leverage, setLeverage] = useState<number>(5);
  const [gasFee, setGasFee] = useState<number>(25);
  const [riftsPerDay, setRiftsPerDay] = useState<number>(15);

  // Auto-generation loop for simulated live pricing rifts
  useEffect(() => {
    // Seed initial logs
    const initial: RiftLog[] = [
      {
        id: '9b2a1a8c',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        pair: 'WETH/USDC',
        src: 'Uniswap V3',
        dst: 'SushiSwap',
        delta: 0.0072,
        gas: 22.40,
        profit: 337.60,
        status: 'executed'
      },
      {
        id: '4f2d7e9b',
        timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
        pair: 'WBTC/WETH',
        src: 'Balancer',
        dst: 'Aerodrome',
        delta: 0.0048,
        gas: 31.10,
        profit: 208.90,
        status: 'executed'
      }
    ];
    setLogs(initial);

    const interval = setInterval(() => {
      const tokenPairs = ["WETH/USDC", "WBTC/WETH", "USDC/USDT", "LINK/WETH"];
      const pair = tokenPairs[Math.floor(Math.random() * tokenPairs.length)];
      const exchanges = ["Uniswap V3", "SushiSwap", "Aerodrome", "Balancer"];
      const src = exchanges[Math.floor(Math.random() * exchanges.length)];
      const dst = exchanges.filter(e => e !== src)[Math.floor(Math.random() * (exchanges.length - 1))];
      
      const currentDelta = roundTo(Math.random() * (spread * 1.5 - 0.001) + 0.001, 4);
      const currentGas = roundTo(Math.random() * 20 + (gasFee - 10), 2);
      
      // Calculate gross profit based on sliders
      const grossProfit = principal * currentDelta * leverage;
      const netProfit = grossProfit - currentGas;
      
      const newLog: RiftLog = {
        id: Math.random().toString(16).substring(2, 10),
        timestamp: new Date().toLocaleTimeString(),
        pair,
        src,
        dst,
        delta: currentDelta,
        gas: currentGas,
        profit: roundTo(netProfit, 2),
        status: Math.random() > 0.45 ? 'pending' : 'executed'
      };

      setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [principal, spread, leverage, gasFee]);

  const roundTo = (num: number, decimals: number) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Financial Outputs
  const grossProfitPerRift = principal * (spread / 100) * leverage;
  const netProfitPerRift = grossProfitPerRift - gasFee;
  const dailyProjectedEarnings = netProfitPerRift * riftsPerDay;
  const monthlyProjectedEarnings = dailyProjectedEarnings * 30;
  const yearlyProjectedEarnings = dailyProjectedEarnings * 365;

  return (
    <div className="flex-1 flex flex-col w-full text-slate-100 bg-[#0b0d13] min-h-screen p-6 font-sans">
      
      {/* Header and Mode Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#00b4d8]"></span>
            <h1 className="text-2xl font-extrabold uppercase tracking-wider text-slate-100">
              L2 Pricing Rift & Arbitrage Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Active networks: Base (Clio) • Optimism (Hobbes) • Arbitrum (Stumpy)
          </p>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50">
          <button 
            onClick={() => setViewMode('pilot')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'pilot' ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Pilot Dashboard
          </button>
          <button 
            onClick={() => setViewMode('barb')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'barb' ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Barb's Sandbox
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        
        {/* Left/Middle Column (Dynamic based on View Mode) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {viewMode === 'pilot' ? (
            /* PILOT COMMAND CENTER */
            <>
              {/* Active Node Mesh */}
              <div className="bg-[#0f172a]/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00b4d8]/40 to-transparent"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#00b4d8] mb-4 flex items-center gap-2">
                  <Cpu size={16} /> Regional Mesh Nodes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                    <span className="text-slate-500 uppercase">Base (Local Node)</span>
                    <span className="text-slate-200 font-bold">clio.tailscale</span>
                    <span className="text-emerald-500 flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active (0.02ms latency)
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                    <span className="text-slate-500 uppercase">Optimism (Mom's ISP)</span>
                    <span className="text-slate-200 font-bold">hobbes.tailscale</span>
                    <span className="text-emerald-500 flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active (14.2ms latency)
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                    <span className="text-slate-500 uppercase">Arbitrum (Barb's ISP)</span>
                    <span className="text-slate-200 font-bold">stumpy.tailscale</span>
                    <span className="text-emerald-500 flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Active (19.8ms latency)
                    </span>
                  </div>
                </div>
              </div>

              {/* pricing rifts table */}
              <div className="bg-[#0f172a]/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col flex-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#00b4d8] mb-4 flex items-center gap-2">
                  <Activity size={16} /> Real-Time Pricing Rifts (Ingress Feed)
                </h2>
                
                <div className="overflow-x-auto flex-1 max-h-[420px]">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-slate-500">
                        <th className="pb-3 uppercase">Rift ID</th>
                        <th className="pb-3 uppercase">Pair</th>
                        <th className="pb-3 uppercase">Spread</th>
                        <th className="pb-3 uppercase">Exchanges</th>
                        <th className="pb-3 uppercase">Gas (Est.)</th>
                        <th className="pb-3 uppercase">Net (Est.)</th>
                        <th className="pb-3 uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={log.id + index} className="border-b border-slate-800/20 hover:bg-white/5 transition-all">
                          <td className="py-3 text-slate-400 font-bold">#{log.id}</td>
                          <td className="py-3 text-slate-200">{log.pair}</td>
                          <td className="py-3 text-emerald-400 font-bold">{(log.delta * 100).toFixed(2)}%</td>
                          <td className="py-3 text-slate-400">{log.src} ➔ {log.dst}</td>
                          <td className="py-3 text-red-400/80">${log.gas}</td>
                          <td className="py-3 text-cyan-400 font-extrabold">${log.profit.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            {log.status === 'executed' ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Executed</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded animate-pulse">JIT Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* BARB'S SANDBOX KITCHEN */
            <>
              {/* Barb Educational Cards */}
              <div className="bg-[#0f172a]/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00b4d8]/40 to-transparent"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#00b4d8] mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Barb's Educational Kitchen Sandbox
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/40">
                    <h3 className="font-bold text-white uppercase mb-2">What is a DeFi Arbitrage?</h3>
                    <p className="text-slate-400 text-xs">
                      DeFi Arbitrage takes advantage of price discrepancies for the same asset pair across different decentralized exchanges (DEXs) like Uniswap, SushiSwap, or Aerodrome. By routing the trades instantly, we buy low on one DEX and sell high on another.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/40">
                    <h3 className="font-bold text-white uppercase mb-2">Flash Loan Leverage</h3>
                    <p className="text-slate-400 text-xs">
                      A Flash Loan allows us to borrow millions of dollars in capital without any collateral, under the condition that the funds are borrowed and repaid within the exact same transaction block. This leverage multiplies our arbitrage spread profit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Distribution Gauge */}
              <div className="bg-[#0f172a]/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#00b4d8] mb-4">
                  Kitchen Profit Allocation Matrix
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/30">
                    <div className="text-2xl font-extrabold text-cyan-400">${roundTo(dailyProjectedEarnings * 0.70, 2).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Re-investment (70%)</div>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/30">
                    <div className="text-2xl font-extrabold text-purple-400">${roundTo(dailyProjectedEarnings * 0.20, 2).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Sovereign Gas Vault (20%)</div>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/30">
                    <div className="text-2xl font-extrabold text-[#00b4d8]">${roundTo(dailyProjectedEarnings * 0.10, 2).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Metsy Treats (10%)</div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Right Column: Financial Returns Simulator (Persistent) */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0f172a]/30 backdrop-blur-md rounded-3xl p-6 border border-white/8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00b4d8] to-transparent"></div>
            
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00b4d8] mb-6 flex items-center gap-2">
              <Sliders size={16} /> Returns Configurator
            </h2>

            {/* Principal Slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase">Base Principal</span>
                <span className="text-white font-bold">${principal.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="1000000" 
                step="10000"
                value={principal} 
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-[#00b4d8] bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Spread Slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase">Price Spread (Δ)</span>
                <span className="text-white font-bold">{spread.toFixed(2)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="3.0" 
                step="0.05"
                value={spread} 
                onChange={(e) => setSpread(Number(e.target.value))}
                className="w-full accent-[#00b4d8] bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Leverage Slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase">Leverage (Flash Loan)</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="1"
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-[#00b4d8] bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Gas Fee Slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase">Gas Fee per Rift</span>
                <span className="text-white font-bold">${gasFee}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="150" 
                step="5"
                value={gasFee} 
                onChange={(e) => setGasFee(Number(e.target.value))}
                className="w-full accent-[#00b4d8] bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Rift Frequency Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase">Daily Rifts Target</span>
                <span className="text-white font-bold">{riftsPerDay} / day</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                value={riftsPerDay} 
                onChange={(e) => setRiftsPerDay(Number(e.target.value))}
                className="w-full accent-[#00b4d8] bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Dynamic Forecast Calculations */}
            <div className="border-t border-slate-800/80 pt-6 mt-6 space-y-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Gross Profit / Rift:</span>
                <span className="text-slate-300 font-bold">${roundTo(grossProfitPerRift, 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Net Profit / Rift:</span>
                <span className={`font-bold ${netProfitPerRift >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${roundTo(netProfitPerRift, 2).toLocaleString()}
                </span>
              </div>
              
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 space-y-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Daily Ingress Projection:</span>
                  <span className="text-cyan-400 text-sm font-extrabold">${roundTo(dailyProjectedEarnings, 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Ingress Projection:</span>
                  <span className="text-[#00b4d8] text-sm font-extrabold">${roundTo(monthlyProjectedEarnings, 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Annual Ingress Projection:</span>
                  <span className="text-emerald-400 text-sm font-extrabold">${roundTo(yearlyProjectedEarnings, 2).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
