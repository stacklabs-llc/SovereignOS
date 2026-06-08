import { useState } from 'react';
import { Flame, ShieldAlert, TrendingDown } from 'lucide-react';

export default function AlgorithmicSubsidy() {
  const [mochaJoeCoffeePrice, setMochaJoeCoffeePrice] = useState(4.25);
  const [flourCost, setFlourCost] = useState(0.85); // per lb
  const [cheeseCost, setCheeseCost] = useState(2.10); // per lb
  const [spiteIntensity, setSpiteIntensity] = useState(90); // out of 100

  // Calculate subsidized slice price
  // Higher competitor price + higher spite = higher subsidy = lower price for customers!
  const baseSliceCost = 5.00;
  const subsidyAmount = ((mochaJoeCoffeePrice * 0.4) + (spiteIntensity * 0.03)) - (flourCost * 0.5 + cheeseCost * 0.3);
  const finalSubsidizedPrice = Math.max(0.00, baseSliceCost - Math.max(0, subsidyAmount));

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <Flame size={16} className="text-red-500" />
          <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase">ALGORITHMIC PIZZA SUBSIDY ENGINE</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Annoyance Subsidy Analytics</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-xl">
          Tracks commodity flour/cheese costs and Mocha Joe's retail coffee margins to mathematically subsidize pizza slices down to absolute zero cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Commodity costs sliders and adjustments */}
        <div className="space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Subsidy Parameter Inputs</h3>

          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-5">
            {/* Competitor Coffee Pricing */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-300">
                <span>Mocha Joe Coffee Price</span>
                <span className="text-red-500 font-bold">${mochaJoeCoffeePrice.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min="2.00"
                max="6.00"
                step="0.25"
                value={mochaJoeCoffeePrice}
                onChange={(e) => setMochaJoeCoffeePrice(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Flour cost */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-300">
                <span>Organic Flour Cost (lb)</span>
                <span className="text-[#fb923c] font-bold">${flourCost.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min="0.50"
                max="2.50"
                step="0.05"
                value={flourCost}
                onChange={(e) => setFlourCost(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#fb923c]"
              />
            </div>

            {/* Cheese cost */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-300">
                <span>Low-Moisture Mozzarella (lb)</span>
                <span className="text-cyan-400 font-bold">${cheeseCost.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min="1.00"
                max="4.00"
                step="0.10"
                value={cheeseCost}
                onChange={(e) => setCheeseCost(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Spite Intensity */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-300">
                <span>Spite Intensity Coils</span>
                <span className="text-red-500 font-black">{spiteIntensity}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                step="5"
                value={spiteIntensity}
                onChange={(e) => setSpiteIntensity(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500 animate-pulse"
              />
            </div>
          </div>
        </div>

        {/* Dynamic calculation board */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Subsidy Telemetry</h3>

          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-red-500/5 rounded-tl-full blur-xl pointer-events-none" />

            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-mono text-red-400 font-black uppercase tracking-wider">
                  REALTIME SPITE SUBSIDY
                </span>
                <h3 className="text-3xl font-black text-white mt-2 uppercase">Annoyance Price Target</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Prices dynamically contract to guarantee Mocha Joe loses all customers. At maximum spite intensity, organic sourdough becomes a free public utility.
                </p>
              </div>

              <div className="text-right bg-black/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">SUBSIDIZED CUSTOMER COST</span>
                <span className={`text-3xl font-black font-mono mt-1 block ${
                  finalSubsidizedPrice === 0 ? 'text-emerald-400 animate-bounce' : 'text-white'
                }`}>
                  {finalSubsidizedPrice === 0 ? 'FREE PIZZA' : `$${finalSubsidizedPrice.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Price comparative indicators */}
            <div className="space-y-4 bg-black/20 border border-white/5 rounded-2xl p-5 mt-6 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Standard Artisanal Sourdough Cost</span>
                <span className="font-bold text-slate-200">$5.00</span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span className="flex items-center gap-1.5"><TrendingDown size={14} /> Annoyance Subsidy Deductible</span>
                <span className="font-bold">-${subsidyAmount <= 0 ? '0.00' : subsidyAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center text-white font-bold">
                <span>Final Spite Slice Customer Price</span>
                <span className={finalSubsidizedPrice === 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ${finalSubsidizedPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* QA constraints notice */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex gap-3 text-slate-400 mt-6">
              <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <strong className="text-red-500 block uppercase mb-0.5">Mocha Joe Invalidation Roster</strong>
                Mocha Joe coffee is currently tested at 130°F (insufficiently hot, basically tepid water). Spite Slice temperature targets remain locked at 180°F to guarantee thermal dominance.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
