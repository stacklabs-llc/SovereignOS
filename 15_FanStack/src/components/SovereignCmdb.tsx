import React, { useState, useEffect } from "react";
import { Database, Server, Bot, User, Leaf, Search, RefreshCw, AlertTriangle, Save, X, Plus } from "lucide-react";

/* ── Sovereign Design Tokens ── */
const VM = {
  bg:       "#00040a",
  surface:  "#0a1118",
  card:     "#0d1820",
  border:   "#1a2a38",
  orange:   "#FF5910",
  emerald:  "#00FF88",
  blue:     "#00d4ff",
  gold:     "#E0BC68",
  text:     "#c8d6e0",
  muted:    "#5a7a8a",
  danger:   "#ff4444",
  fontHead: "'Orbitron', sans-serif",
  fontMono: "'Share Tech Mono', monospace",
  fontBody: "'Rajdhani', sans-serif",
} as const;

const CMDB_TABLES = [
  { id: 'cmdb_ci', label: 'All Configuration Items', icon: Database, color: VM.gold },
  { id: 'cmdb_ci_hardware', label: 'IT Hardware', icon: Server, color: VM.blue },
  { id: 'cmdb_ci_garden', label: 'GardenStack', icon: Leaf, color: VM.emerald },
  { id: 'cmdb_ci_ai_persona', label: 'AI Personas', icon: Bot, color: '#a855f7' },
  { id: 'sys_user', label: 'System Users', icon: User, color: VM.orange },
];

export default function SovereignCmdb() {
  const [activeTable, setActiveTable] = useState(CMDB_TABLES[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    setRecords([]);
    setSelectedRecord(null);
    try {
      const res = await fetch(`/api/now/table/${activeTable.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [activeTable]);

  const handleSave = async () => {
    if (!selectedRecord || !editForm) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/now/table/${activeTable.id}/${selectedRecord.sys_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchTableData();
    } catch (err) {
      setError("Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const searchTarget = (r.name || r.user_name || r.short_description || r.ip_address || "").toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  });

  const getColumns = () => {
    if (records.length === 0) return ["sys_id", "name"];
    const allKeys = Object.keys(records[0]).filter(k => k !== "sys_id");
    // Prioritize name/user_name, then a few key fields
    const priority = ["name", "user_name", "sys_class_name", "short_description", "ip_address", "model_id", "plant_type", "department", "active"];
    return allKeys.sort((a, b) => {
        const iA = priority.indexOf(a);
        const iB = priority.indexOf(b);
        if (iA > -1 && iB > -1) return iA - iB;
        if (iA > -1) return -1;
        if (iB > -1) return 1;
        return a.localeCompare(b);
    }).slice(0, 6); // Max 6 columns for list view
  };

  const columns = getColumns();

  return (
    <div className="flex h-[85vh] bg-[#00040a] text-[#c8d6e0] font-sans border border-[#1a2a38] rounded-xl overflow-hidden relative">
      
      {/* Left Sidebar - Filter Navigator */}
      <div className="w-64 bg-[#0a1118] border-r border-[#1a2a38] flex flex-col">
        <div className="p-4 border-b border-[#1a2a38]">
          <h2 className="font-display font-bold text-[#E0BC68] tracking-wider text-lg uppercase flex items-center gap-2">
            <Database size={18} /> CMDB
          </h2>
          <p className="font-mono text-[10px] text-[#5a7a8a] tracking-widest uppercase mt-1">Filter Navigator</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {CMDB_TABLES.map(table => {
            const Icon = table.icon;
            const isActive = activeTable.id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setActiveTable(table)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-colors
                  ${isActive ? "bg-[#1a2a38] border-r-2" : "hover:bg-[#1a2a38]/50"}
                `}
                style={{
                  borderColor: isActive ? table.color : "transparent",
                  color: isActive ? table.color : VM.muted
                }}
              >
                <Icon size={14} />
                {table.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a2a38] bg-[#0a1118]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-[#5a7a8a] tracking-widest uppercase">
              Table <span className="text-[#00d4ff] font-bold">{activeTable.id}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#00040a] border border-[#1a2a38] rounded px-3 py-1.5">
              <Search size={14} className="text-[#5a7a8a]" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-mono text-white placeholder:text-[#5a7a8a] w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={fetchTableData} className="p-2 rounded border border-[#1a2a38] text-[#00d4ff] hover:bg-[#1a2a38] transition-colors" title="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] rounded font-mono text-xs uppercase tracking-widest hover:bg-[#00FF88]/20 transition-colors">
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded flex items-center gap-2 font-mono text-xs">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Generic List View */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#5a7a8a] font-mono text-xs gap-2">
               <RefreshCw size={24} className="animate-spin" /> Loading Class Data...
             </div>
          ) : records.length === 0 ? (
             <div className="flex items-center justify-center h-full text-[#5a7a8a] font-mono text-xs">
               No records found in {activeTable.id}.
             </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#1a2a38]">
                  {columns.map(col => (
                    <th key={col} className="text-left py-2 px-3 font-mono text-[10px] text-gray-300 uppercase tracking-widest sticky top-0 bg-[#00040a]">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr 
                    key={r.sys_id || idx}
                    onClick={() => { setSelectedRecord(r); setEditForm({...r}); }}
                    className="border-b border-[#1a2a38]/50 hover:bg-[#0a1118] cursor-pointer transition-colors group"
                  >
                    {columns.map(col => (
                      <td key={col} className="py-2.5 px-3 font-mono text-xs text-[#c8d6e0] truncate max-w-[200px]">
                        {col === "sys_class_name" ? (
                           <span className="text-[#00FF88] opacity-70 group-hover:opacity-100">{r[col]}</span>
                        ) : col === "active" || col === "operational_status" ? (
                           <span className={r[col] == 1 ? "text-[#00FF88]" : "text-[#ff4444]"}>{r[col] == 1 ? 'Yes' : 'No'}</span>
                        ) : (
                           r[col] ?? "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out Edit Drawer */}
      {selectedRecord && (
        <div className="absolute top-0 right-0 bottom-0 w-1/3 min-w-[400px] bg-[#0a1118] border-l border-[#1a2a38] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-4 border-b border-[#1a2a38]">
            <h3 className="font-display font-bold text-[#00d4ff] tracking-widest uppercase">
              Record Detail
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] rounded font-mono text-xs uppercase hover:bg-[#00d4ff]/20"
              >
                <Save size={14} /> {isSaving ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 border border-[#1a2a38] text-[#5a7a8a] rounded hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
             {Object.keys(editForm).map(key => {
               const val = editForm[key];
               const readOnly = ["sys_id", "sys_created_on", "sys_updated_on"].includes(key);
               
               return (
                 <div key={key}>
                   <label className="block font-mono text-[10px] text-[#5a7a8a] uppercase tracking-widest mb-1">
                     {key.replace(/_/g, ' ')} {readOnly && "(Read-Only)"}
                   </label>
                   {readOnly ? (
                     <div className="w-full bg-[#00040a] border border-[#1a2a38] rounded px-3 py-2 text-xs font-mono text-[#5a7a8a]">
                       {String(val || "")}
                     </div>
                   ) : (
                     <input 
                       type="text"
                       value={String(val || "")}
                       onChange={e => setEditForm({...editForm, [key]: e.target.value})}
                       className="w-full bg-[#00040a] border border-[#1a2a38] focus:border-[#00d4ff] rounded px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                     />
                   )}
                 </div>
               )
             })}
          </div>
        </div>
      )}

    </div>
  );
}
