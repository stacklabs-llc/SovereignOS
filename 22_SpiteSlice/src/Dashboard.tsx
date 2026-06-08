import { useState } from 'react';
import { Flame, ShoppingCart, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  spiteLevel: number; // 0 to 10 scale of annoyance it causes competitors
}

export default function Dashboard() {
  const [irritation, setIrritation] = useState(85); // Mocha Joe's irritation scale
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [menuItems] = useState<MenuItem[]>([
    { id: '1', name: "Sourdough Plain Slice", description: "Perfect crisp sourdough crust, premium low-moisture mozzarella, grimy tomato sauce made with spite.", basePrice: 4.50, spiteLevel: 8 },
    { id: '2', name: "The Mocha Joe Special (Gyro Slice)", description: "Succulent spit-roasted gyro meat, Tzatziki drizzle, red onions. Specifically designed to put Mocha Joe out of business.", basePrice: 6.00, spiteLevel: 10 },
    { id: '3', name: "Smyrna Grass-Fed Pepperoni Slice", description: "Loaded with cup-and-char organic pepperoni. Sourced locally, baked hot.", basePrice: 5.50, spiteLevel: 7 },
    { id: '4', name: "Spite Garlic Knots (4x)", description: "Drenched in fresh garlic, grass-fed butter, and absolute contempt.", basePrice: 3.50, spiteLevel: 6 },
    { id: '5', name: "Artisanal Vanilla Bean Cream Soda", description: "Ice-cold cane sugar soda, real vanilla seeds. Guaranteed colder than Mocha Joe's lukewarm coffee.", basePrice: 3.00, spiteLevel: 9 }
  ]);

  const spiteDiscount = (irritation / 100) * 1.50; // Max $1.50 discount per item based on irritation

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const getCartSubtotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menuItems.find(m => m.id === id);
      return sum + (item ? item.basePrice * qty : 0);
    }, 0);
  };

  const getCartDiscount = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menuItems.find(m => m.id === id);
      return sum + (item ? spiteDiscount * qty : 0);
    }, 0);
  };

  const getCartTotal = () => {
    return Math.max(0, getCartSubtotal() - getCartDiscount());
  };

  return (
    <div className="relative min-h-screen pb-12">
      {/* Header Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase">SPITE PIZZA HUB</span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
            Seymour Spite Pizza Console
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Algorithmically priced artisanal sourdough slices designed to run competitor coffee shops out of business. Colder soda, crisper crusts, zero compromise.
          </p>
        </div>

        {/* Annoyance Slider */}
        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl w-full md:w-64 shrink-0 font-mono text-[10px]">
          <div className="flex justify-between items-center mb-1 text-slate-300">
            <span className="flex items-center gap-1"><Flame size={12} className="text-red-500" /> Competitor Irritation</span>
            <span className="text-red-500 font-bold">{irritation}%</span>
          </div>
          <input 
            type="range"
            min="0"
            max="100"
            value={irritation}
            onChange={(e) => setIrritation(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <p className="text-[8px] text-slate-500 mt-1 uppercase text-right">Increases Spite Subsidy Discount</p>
        </div>
      </div>

      {/* Main layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Menu List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Active Spite Slices & Sodus</h3>
            <span className="text-[10px] font-mono text-slate-500">SORT: HIGH SPITE FIRST</span>
          </div>

          <div className="space-y-4">
            {menuItems.map((item) => {
              const discountedPrice = Math.max(0.50, item.basePrice - spiteDiscount);
              
              return (
                <div 
                  key={item.id}
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group hover:border-red-500/20"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{item.name}</span>
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider">
                          Spite: {item.spiteLevel}/10
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-lg">{item.description}</p>
                      
                      <div className="flex gap-4 items-center pt-2">
                        <span className="text-xs text-slate-500 line-through font-mono">${item.basePrice.toFixed(2)}</span>
                        <span className="text-md font-mono font-bold text-emerald-400">${discountedPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => addToCart(item.id)}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500 text-white font-mono text-[10px] font-black uppercase tracking-widest border border-red-500/40 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0 self-start sm:self-center"
                    >
                      ADD TO ORDER
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart & Annoyance alert log */}
        <div className="space-y-6">
          <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">Checkout & Subsidy</h3>

          {/* Cart Console */}
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <ShoppingCart size={16} className="text-red-500" />
              Active Pizza Order
            </h4>

            {Object.keys(cart).length === 0 ? (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs font-mono">
                Order basket is currently empty. Add spite slices to initiate checkout.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = menuItems.find(m => m.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex justify-between items-center text-xs font-mono bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <div>
                          <p className="text-white font-bold">{item.name}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">Qty: {qty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-300 font-bold">${(item.basePrice * qty).toFixed(2)}</span>
                          <button 
                            onClick={() => removeFromCart(id)}
                            className="w-5 h-5 rounded-full bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-300">${getCartSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Annoyance Subsidy ({irritation}%)</span>
                    <span>-${getCartDiscount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm border-t border-white/5 pt-2">
                    <span>TOTAL SPITE BALANCE</span>
                    <span className="text-red-400">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    alert(`Sending order of $${getCartTotal().toFixed(2)} to Pizza-Bot Quantum Teleporter!`);
                    setCart({});
                  }}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  TRANSMIT TO PIZZABOT
                </button>
              </div>
            )}
          </div>

          {/* Annoyance Warning */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 flex gap-3 text-slate-400">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              <strong className="text-red-500 block uppercase mb-1">Mocha Joe Warning Alert</strong>
              Mocha Joe has filed an emergency injunction claiming Spite Slice uses "unfairly cold sodas" and "aggressive sourdough density". Continue baking with maximum hostility.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
