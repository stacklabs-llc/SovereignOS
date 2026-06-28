import { useState } from 'react';
import { ShoppingBag, Plus, Check } from 'lucide-react';

interface GroceryItem {
  id: number;
  item_name: string;
  quantity: string;
  status: string;
  compiled_at: string;
}

interface ProcurementTrackerProps {
  groceries: GroceryItem[];
  cometConnected: boolean;
  onAddItem: (name: string, qty: string) => void;
  onToggleItem: (id: number, currentStatus: string) => void;
}

export default function ProcurementTracker({
  groceries,
  cometConnected,
  onAddItem,
  onToggleItem
}: ProcurementTrackerProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddItem(name.trim(), qty.trim() || '1');
    setName('');
    setQty('');
  };

  const pendingItems = groceries.filter(item => item.status === 'PENDING');
  const completedItems = groceries.filter(item => item.status === 'COMPLETED');

  return (
    <div className="cardboard-panel p-6 bg-white min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-[#c25134]" /> Household Procurement Desk
          </h2>
          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-sans font-bold border ${cometConnected ? 'bg-[#436850]/8 text-[#436850] border-[#436850]/20' : 'bg-[#9c3120]/8 text-[#9c3120] border-[#9c3120]/20'}`}>
            {cometConnected ? 'SYNC OK' : 'OFFLINE'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex gap-2.5 mb-4.5">
          <input
            type="text"
            placeholder="Item (e.g. Lavender Oil)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!cometConnected}
            className="flex-grow cozy-input text-xs"
            required
          />
          <input
            type="text"
            placeholder="Qty"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={!cometConnected}
            className="w-16 cozy-input text-xs text-center"
          />
          <button
            type="submit"
            disabled={!cometConnected}
            className="cozy-button p-2 text-xs flex items-center justify-center cursor-pointer"
            title="Add to List"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* List Section */}
        <div className="space-y-4">
          {/* Pending Items */}
          <div>
            <h3 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Pending Run Checklist ({pendingItems.length})
            </h3>
            {pendingItems.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No active grocery or medicine runs needed.</p>
            ) : (
              <div className="space-y-2">
                {pendingItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id, item.status)}
                    className="p-3 bg-[#faf8f5] hover:bg-gray-50 border border-gray-100 hover:border-[#c25134]/35 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-4.5 h-4.5 rounded border border-gray-300 group-hover:border-[#c25134] flex items-center justify-center bg-white">
                        <Check className="w-3.5 h-3.5 text-transparent group-hover:text-[#c25134]/50" />
                      </div>
                      <span className="text-xs font-serif font-bold text-gray-800">{item.item_name}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-gray-50 border border-gray-200 text-gray-650 px-2 py-0.5 rounded">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="border-t border-gray-100 pt-3.5">
              <h3 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-2">
                Completed Logistics
              </h3>
              <div className="space-y-1.5 opacity-60">
                {completedItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id, item.status)}
                    className="p-2 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-between cursor-pointer line-through text-gray-400 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                        <Check className="w-3 h-3 text-[#436850]" />
                      </div>
                      <span className="text-xs font-serif">{item.item_name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] leading-relaxed mt-4 font-sans text-gray-500 flex items-start gap-1.5 font-medium">
        <span>Runs are synchronized dynamically across local outpost terminals.</span>
      </div>
    </div>
  );
}
