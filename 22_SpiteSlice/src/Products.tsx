import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface Product {
  sys_id: string;
  sku: string;
  name: string;
  category: string;
  thc_mg_per_unit: number;
  cbd_mg_per_unit: number;
  units_per_pack: number;
  active: number;
  total_on_hand: number;
  total_pending: number;
  total_shipped: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wildseed/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'gummy':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'tincture':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'concentrate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Loading Product Catalog...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 text-white">
      <header className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black tracking-widest uppercase">SKU Catalog</h2>
        <p className="text-slate-400 font-light tracking-widest text-xs uppercase mt-1">Finished Goods Stock & SKU Specification Registry</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div 
            key={product.sys_id} 
            className="clinical-card bg-black/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all rounded-2xl p-6 flex flex-col justify-between h-72 relative overflow-hidden group hover:translate-y-[-2px] shadow-lg"
          >
            {/* Background design */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:bg-emerald-500/10 transition-all duration-500"></div>
            
            <div>
              {/* Category and SKU */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[8px] font-bold font-mono px-2.5 py-0.5 rounded border uppercase ${getCategoryColor(product.category)}`}>
                  {product.category}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{product.sku}</span>
              </div>

              {/* Product Title */}
              <h3 className="text-sm font-black text-white leading-snug tracking-wider mb-2 uppercase group-hover:text-emerald-400 transition-colors">
                {product.name}
              </h3>

              {/* Cannabinoid Breakdown */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-2.5 mb-4">
                <div className="flex-1">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block">THC</span>
                  <span className="text-xs font-mono font-bold text-white block">
                    {product.thc_mg_per_unit > 0 ? `${product.thc_mg_per_unit} mg` : '—'}
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-white/10"></div>
                <div className="flex-1">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block">CBD</span>
                  <span className="text-xs font-mono font-bold text-white block">
                    {product.cbd_mg_per_unit > 0 ? `${product.cbd_mg_per_unit} mg` : '—'}
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-white/10"></div>
                <div className="flex-1">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block">Pack Size</span>
                  <span className="text-xs font-mono font-bold text-slate-300 block">{product.units_per_pack} Units</span>
                </div>
              </div>
            </div>

            {/* Inventory Statuses */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex flex-col justify-center shadow-[inset_0_0_8px_rgba(16,185,129,0.05)]">
                <span className="text-[7px] font-mono text-emerald-500/70 uppercase tracking-widest block mb-0.5">On Hand</span>
                <span className="text-sm font-black text-emerald-400 font-mono block">
                  {product.total_on_hand.toLocaleString()}
                </span>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2 flex flex-col justify-center shadow-[inset_0_0_8px_rgba(245,158,11,0.05)]">
                <span className="text-[7px] font-mono text-amber-500/70 uppercase tracking-widest block mb-0.5">Pending</span>
                <span className="text-sm font-black text-amber-400 font-mono block">
                  {product.total_pending.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col justify-center">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">Shipped</span>
                <span className="text-sm font-black text-slate-300 font-mono block">
                  {product.total_shipped.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
