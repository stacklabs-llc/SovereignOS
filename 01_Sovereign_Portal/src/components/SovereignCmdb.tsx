import React, { useState, useEffect } from "react";
import { 
  Database, Server, Bot, User, Leaf, Search, RefreshCw, 
  AlertTriangle, Save, X, Plus, Cpu, Activity, HardDrive, 
  Wifi, Volume2, Network, CheckCircle2, ArrowRight, Lightbulb, Thermometer
} from "lucide-react";
import { SortableTable } from "./SortableTable";

/* ── Sovereign Design Tokens ── */
const VM = {
  bg:       "#020617",
  surface:  "#0b1329",
  card:     "#111a36",
  border:   "#1e293b",
  orange:   "#f97316",
  emerald:  "#10b981",
  blue:     "#06b6d4",
  gold:     "#e2e8f0",
  text:     "#cbd5e1",
  muted:    "#64748b",
  danger:   "#ef4444",
  purple:   "#a855f7",
  fontHead: "'Orbitron', sans-serif",
  fontMono: "'Share Tech Mono', monospace",
  fontBody: "'Rajdhani', sans-serif",
} as const;

const CMDB_TABLES = [
  { id: 'cmdb_ci', label: 'All Configuration Items', icon: Database, color: VM.blue },
  { id: 'cmdb_ci_hardware', label: 'IT Hardware', icon: Server, color: VM.blue },
  { id: 'cmdb_ci_garden', label: "Eileen's Stack", icon: Leaf, color: VM.emerald },
  { id: 'cmdb_ci_ai_persona', label: 'AI Personas', icon: Bot, color: VM.purple },
  { id: 'cmdb_ci_appl', label: 'Active Mission Stacks', icon: Server, color: VM.orange },
  { id: 'sys_user', label: 'System Users', icon: User, color: VM.orange },
];

export default function SovereignCmdb() {
  const [activeTable, setActiveTable] = useState(CMDB_TABLES[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [allCIs, setAllCIs] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Stats Counters
  const totalCIs = allCIs.length;
  const activePersonas = allCIs.filter(c => c.sys_class_name === "cmdb_ci_ai_persona").length;
  const hardwareNodes = allCIs.filter(c => c.sys_class_name === "cmdb_ci_hardware").length;
  const degradedNodes = allCIs.filter(c => c.operational_status == 2).length;

  const fetchGlobalData = async () => {
    try {
      // Get all CIs to build topology
      const resCIs = await fetch("/api/now/table/cmdb_ci");
      const dataCIs = await resCIs.json();
      setAllCIs(dataCIs.result || []);

      // Get all CI relationships
      const resRels = await fetch("/api/now/table/cmdb_rel_ci");
      const dataRels = await resRels.json();
      setRelationships(dataRels.result || []);
    } catch (err) {
      console.error("Failed to load global CMDB map metadata", err);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
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
    fetchGlobalData();
    fetchTableData();
  }, [activeTable]);

  const speakAlert = async (text: string) => {
    try {
      await fetch("/api/telemetry/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
    } catch (e) {
      console.error("Voice trigger fail", e);
    }
  };

  const handleSelectRecord = (record: any) => {
    setSelectedRecord(record);
    setEditForm({ ...record });
    const name = record.name || record.user_name || "Unknown item";
    const className = record.sys_class_name === "cmdb_ci_hardware" ? "IT Hardware" :
                      record.sys_class_name === "cmdb_ci_ai_persona" ? "AI Persona" : "Configuration Item";
    speakAlert(`Focusing configuration item: ${name}. Class: ${className}.`);
  };

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
      speakAlert(`Configuration updated successfully for ${editForm.name || editForm.user_name}.`);
      await fetchTableData();
      await fetchGlobalData();
      setSelectedRecord(editForm);
    } catch (err) {
      setError("Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };



  // Dynamic layout coordinates for Topology visualization
  const getLayoutCoordinates = (nodeId: string, className: string, idx: number, total: number, nodeName?: string) => {
    // Hardcode positions for key hardware nodes to make them align beautifully
    const presetPositions: Record<string, { x: number; y: number }> = {
      argo: { x: 120, y: 150 },
      clio: { x: 80, y: 240 },
      "metsy-prime": { x: 80, y: 60 },
      "argo-usb-hub": { x: 220, y: 150 },
      "argo_usb_hub": { x: 220, y: 150 },
      "argo-1tb-drive": { x: 300, y: 150 },
      "argo_1tb_drive": { x: 300, y: 150 },
      c120: { x: 300, y: 60 },
      "nest-cam-indoor": { x: 220, y: 60 },
      "nest-cam": { x: 220, y: 60 },
      "govee-smart-light": { x: 380, y: 60 },
      "govee_light_1": { x: 380, y: 60 },
      "govee-hygrometer": { x: 460, y: 60 },
      "govee_hygrometer_1": { x: 460, y: 60 },
    };

    const lookupKey = (nodeName || "").toLowerCase().trim();
    if (presetPositions[nodeId]) {
      return presetPositions[nodeId];
    }
    if (presetPositions[lookupKey]) {
      return presetPositions[lookupKey];
    }

    // Dynamic fallback placement based on classes
    if (className === "cmdb_ci_ai_persona") {
      const angle = (idx / (total || 1)) * Math.PI - Math.PI / 2;
      return { x: 480 + Math.cos(angle) * 60, y: 160 + Math.sin(angle) * 70 };
    }
    if (className === "cmdb_ci_fanstack_room") {
      const step = 400 / (total || 1);
      return { x: 100 + idx * step, y: 280 };
    }
    if (className === "cmdb_ci_appl") {
      const angle = (idx / (total || 1)) * 2 * Math.PI;
      return { x: 320 + Math.cos(angle) * 120, y: 165 + Math.sin(angle) * 65 };
    }
    
    // Default ring layout fallback
    const angle = (idx / (total || 1)) * 2 * Math.PI;
    return { x: 300 + Math.cos(angle) * 110, y: 160 + Math.sin(angle) * 80 };
  };

  // Compile active nodes for the topology map
  const getTopologyData = () => {
    // Collect all unique IDs connected by relationships
    const connectedIds = new Set<string>();
    relationships.forEach(rel => {
      if (rel.parent) connectedIds.add(rel.parent);
      if (rel.child) connectedIds.add(rel.child);
    });

    const activeClassCIs = allCIs.filter(c => {
      // Always include if it is the currently selected record
      if (selectedRecord && c.sys_id === selectedRecord.sys_id) {
        return true;
      }
      
      // Include key hardware presets
      const nameKey = (c.name || c.user_name || "").toLowerCase().trim();
      const isPreset = [
        "argo", "clio", "metsy-prime", "argo-usb-hub", "argo-1tb-drive",
        "c120", "nest-cam-indoor", "govee-smart-light", "govee-hygrometer"
      ].includes(nameKey);
      if (isPreset && c.sys_class_name === "cmdb_ci_hardware") {
        return true;
      }

      // Include if it's connected (has at least one relationship)
      const allowedClasses = [
        "cmdb_ci_hardware", 
        "cmdb_ci_ai_persona", 
        "cmdb_ci_fanstack_room",
        "cmdb_ci_appl"
      ];
      if (allowedClasses.includes(c.sys_class_name) && connectedIds.has(c.sys_id)) {
        return true;
      }

      return false;
    });

    const classCounts: Record<string, number> = {};
    const nodes = activeClassCIs.map((ci) => {
      const cls = ci.sys_class_name;
      classCounts[cls] = (classCounts[cls] || 0) + 1;
      return ci;
    });

    const currentClassIndices: Record<string, number> = {};
    const formattedNodes = nodes.map((node) => {
      const cls = node.sys_class_name;
      const idx = currentClassIndices[cls] || 0;
      currentClassIndices[cls] = idx + 1;
      
      const { x, y } = getLayoutCoordinates(node.sys_id, cls, idx, classCounts[cls], node.name || node.user_name);
      return { ...node, x, y };
    });

    // Generate links based on relationships table
    const links = relationships.map(rel => {
      const parentNode = formattedNodes.find(n => n.sys_id === rel.parent);
      const childNode = formattedNodes.find(n => n.sys_id === rel.child);
      if (parentNode && childNode) {
        return {
          sys_id: rel.sys_id,
          source: parentNode,
          target: childNode,
          type: rel.type
        };
      }
      return null;
    }).filter(Boolean);

    return { nodes: formattedNodes, links };
  };

  const { nodes: topoNodes, links: topoLinks } = getTopologyData();

  // Find relationships for selected record
  const getSelectedRelationships = () => {
    if (!selectedRecord) return { upstream: [], downstream: [] };
    const upstream = relationships
      .filter(r => r.child === selectedRecord.sys_id)
      .map(r => {
        const parentNode = allCIs.find(n => n.sys_id === r.parent);
        return { rel: r, node: parentNode };
      }).filter(item => item.node);

    const downstream = relationships
      .filter(r => r.parent === selectedRecord.sys_id)
      .map(r => {
        const childNode = allCIs.find(n => n.sys_id === r.child);
        return { rel: r, node: childNode };
      }).filter(item => item.node);

    return { upstream, downstream };
  };

  const { upstream: relUpstream, downstream: relDownstream } = getSelectedRelationships();

  // Class icon mapper
  // Dynamic columns based on active class table
  const getColumnsForActiveTable = () => {
    const base = [
      {
        key: "operational_status",
        label: "Status",
        sortable: true,
        render: (r: any) => (
          <span className="flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full shadow-sm animate-pulse
              ${r.operational_status == 1 ? "bg-[#10b981] shadow-[#10b981]" : 
                r.operational_status == 2 ? "bg-[#f97316] shadow-[#f97316]" : 
                "bg-[#ef4444] shadow-[#ef4444]"}
            `} />
          </span>
        )
      },
      {
        key: "name",
        label: "Configuration Name",
        sortable: true,
        render: (r: any) => (
          <span className="font-semibold uppercase tracking-wider text-white">
            {r.name || r.user_name || "—"}
          </span>
        )
      }
    ];

    if (activeTable.id === 'cmdb_ci_appl') {
      return [
        ...base,
        {
          key: "port",
          label: "Port",
          sortable: true,
          render: (r: any) => (
            <span className="font-mono text-[#06b6d4]">
              {r.port || "—"}
            </span>
          )
        },
        {
          key: "short_description",
          label: "Short Description",
          sortable: true,
          render: (r: any) => (
            <span className="text-[#cbd5e1] truncate max-w-[280px] block">
              {r.short_description || "—"}
            </span>
          )
        },
        {
          key: "active",
          label: "Active Stack",
          sortable: true,
          render: (r: any) => (
            <span className={`font-mono text-xs uppercase ${r.active ? "text-[#10b981]" : "text-[#cbd5e1]/30"}`}>
              {r.active ? "YES" : "NO"}
            </span>
          )
        }
      ];
    }

    return [
      ...base,
      {
        key: "sys_class_name",
        label: "Class Name",
        sortable: true,
        render: (r: any) => {
          const isNodeIoT = ["C120", "Nest-Cam-indoor", "govee-smart-light", "govee-hygrometer"].includes(r.name);
          return (
            <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-widest
              ${r.sys_class_name === "cmdb_ci_hardware" 
                ? isNodeIoT 
                  ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
                  : "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]" 
                : r.sys_class_name === "cmdb_ci_ai_persona" 
                  ? "bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7]"
                  : "bg-[#e2e8f0]/10 border-[#e2e8f0]/30 text-white"}
            `}>
              {r.sys_class_name === "cmdb_ci_hardware" ? isNodeIoT ? "IoT Node" : "Compute" : r.sys_class_name?.replace("cmdb_ci_", "") || "Generic"}
            </span>
          );
        }
      },
      {
        key: "short_description",
        label: "Short Description",
        sortable: true,
        render: (r: any) => (
          <span className="text-[#cbd5e1] truncate max-w-[280px] block">
            {r.short_description || r.introduction || r.ip_address || "—"}
          </span>
        )
      },
      {
        key: "assigned_to",
        label: "Assigned",
        sortable: true,
        render: (r: any) => (
          <span className="text-[#64748b]">
            {r.assigned_to || r.department || "GLOBAL"}
          </span>
        )
      }
    ];
  };

  const cmdbColumns = getColumnsForActiveTable();

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-[#cbd5e1] font-sans overflow-hidden border border-[#1e293b] rounded-2xl relative shadow-2xl">
      
      {/* 1. Navigation Panel (Sidebar) */}
      <div className="w-full lg:w-64 bg-[#0b1329] border-b lg:border-b-0 lg:border-r border-[#1e293b] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#06b6d4]/10 rounded-lg border border-[#06b6d4]/30 text-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
              <Network size={20} />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
                Sovereign CMDB
              </h2>
              <p className="font-mono text-[9px] text-[#64748b] tracking-wider uppercase mt-0.5">
                StackLabs Seeding
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex-1 py-3 overflow-y-auto px-2 space-y-1">
          {CMDB_TABLES.map(table => {
            const Icon = table.icon;
            const isActive = activeTable.id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setActiveTable(table)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all duration-200
                  ${isActive 
                    ? "bg-[#111a36] border border-[#1e293b] text-white shadow-[0_0_10px_rgba(6,182,212,0.05)]" 
                    : "text-[#64748b] hover:bg-[#111a36]/40 hover:text-white"
                  }
                `}
                style={{
                  color: isActive ? table.color : undefined
                }}
              >
                <Icon size={14} style={{ color: isActive ? table.color : undefined }} />
                {table.label}
              </button>
            )
          })}
        </div>

        {/* Donut Chart Visualizer (CI distribution) */}
        <div className="p-4 border-t border-[#1e293b] hidden lg:block bg-[#0b1329]/50">
          <div className="font-mono text-[9px] text-[#64748b] tracking-widest uppercase mb-3 flex items-center gap-1.5">
            <Activity size={10} className="text-[#06b6d4]" /> Asset Distribution
          </div>
          
          <div className="flex items-center gap-4">
            <svg width="60" height="60" viewBox="0 0 36 36" className="shrink-0 drop-shadow-[0_0_5px_rgba(6,182,212,0.1)]">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#111a36" strokeWidth="4" />
              {/* Compute (Blue) 35% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke={VM.blue} strokeWidth="4.2" strokeDasharray="35 65" strokeDashoffset="25" />
              {/* Personas (Purple) 45% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke={VM.purple} strokeWidth="4.2" strokeDasharray="45 55" strokeDashoffset="90" />
              {/* Other (Emerald) 20% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke={VM.emerald} strokeWidth="4.2" strokeDasharray="20 80" strokeDashoffset="135" />
            </svg>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-[9px] text-[#cbd5e1]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" /> Compute: {hardwareNodes} CIs
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] text-[#cbd5e1]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" /> Bots: {activePersonas} CIs
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] text-[#cbd5e1]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Gardens: {totalCIs - hardwareNodes - activePersonas} CIs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Workstation Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Key Metrics Glow Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 shrink-0">
          <div className="bg-[#111a36]/40 backdrop-blur-md border border-[#1e293b] rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-[#06b6d4]/50 transition-colors">
            <div className="font-mono text-[10px] text-[#64748b] tracking-wider uppercase">Total CMDB Assets</div>
            <div className="font-mono text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              {totalCIs} <span className="text-[10px] text-[#10b981] font-semibold">+2.1%</span>
            </div>
            <div className="absolute right-3 bottom-3 text-[#06b6d4]/10 group-hover:text-[#06b6d4]/20 transition-colors"><Database size={32} /></div>
          </div>

          <div className="bg-[#111a36]/40 backdrop-blur-md border border-[#1e293b] rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-[#a855f7]/50 transition-colors">
            <div className="font-mono text-[10px] text-[#64748b] tracking-wider uppercase">AI Advocates</div>
            <div className="font-mono text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              {activePersonas} <span className="text-[10px] text-[#a855f7] font-semibold">Active</span>
            </div>
            <div className="absolute right-3 bottom-3 text-[#a855f7]/10 group-hover:text-[#a855f7]/20 transition-colors"><Bot size={32} /></div>
          </div>

          <div className="bg-[#111a36]/40 backdrop-blur-md border border-[#1e293b] rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-[#f97316]/50 transition-colors">
            <div className="font-mono text-[10px] text-[#64748b] tracking-wider uppercase">Hardware CIs</div>
            <div className="font-mono text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              {hardwareNodes} <span className="text-[10px] text-[#cbd5e1] font-semibold">Mesh</span>
            </div>
            <div className="absolute right-3 bottom-3 text-[#f97316]/10 group-hover:text-[#f97316]/20 transition-colors"><Server size={32} /></div>
          </div>

          <div className="bg-[#111a36]/40 backdrop-blur-md border border-[#1e293b] rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-red-500/50 transition-colors">
            <div className="font-mono text-[10px] text-[#64748b] tracking-wider uppercase">System Degraded</div>
            <div className="font-mono text-2xl font-bold mt-1 flex items-baseline gap-1.5" style={{ color: degradedNodes > 0 ? VM.orange : VM.emerald }}>
              {degradedNodes} <span className="text-[10px] font-semibold" style={{ color: degradedNodes > 0 ? VM.orange : VM.emerald }}>{degradedNodes > 0 ? "Warning" : "Optimal"}</span>
            </div>
            <div className="absolute right-3 bottom-3 text-red-500/10 group-hover:text-red-500/20 transition-colors"><Wifi size={32} /></div>
          </div>
        </div>

        {/* 3. SVG Topology Visualizer Map */}
        <div className="mx-5 bg-[#111a36]/20 border border-[#1e293b] rounded-xl p-4 shrink-0 overflow-hidden relative backdrop-blur-sm shadow-inner">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 mb-3">
            <div className="font-mono text-[10px] text-white tracking-widest uppercase flex items-center gap-2">
              <Network size={12} className="text-[#06b6d4]" /> Dynamic System Topology Map
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-[9px] text-[#cbd5e1]"><span className="w-2 h-2 rounded-full bg-[#06b6d4] shadow-[0_0_5px_#06b6d4]" /> Compute</span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-[#cbd5e1]"><span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_5px_#10b981]" /> IoT Node</span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-[#cbd5e1]"><span className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_5px_#a855f7]" /> AI Bot</span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-[#cbd5e1]"><span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_5px_#f97316]" /> Application</span>
            </div>
          </div>

          <div className="relative w-full h-[280px]">
            <svg className="w-full h-full" style={{ backgroundColor: "#020617/20" }}>
              {/* Define Grid Patterns */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" opacity="0.4" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render Glow Lines for Relationships */}
              {topoLinks.map((link: any) => {
                const isHighlighted = hoveredNode === link.source.sys_id || hoveredNode === link.target.sys_id ||
                                      (selectedRecord && (selectedRecord.sys_id === link.source.sys_id || selectedRecord.sys_id === link.target.sys_id));
                return (
                  <g key={link.sys_id}>
                    {/* Glowing shadow line */}
                    {isHighlighted && (
                      <line 
                        x1={link.source.x} y1={link.source.y} 
                        x2={link.target.x} y2={link.target.y}
                        stroke="#06b6d4" strokeWidth="3" opacity="0.4"
                        className="animate-pulse"
                      />
                    )}
                    <line 
                      x1={link.source.x} y1={link.source.y} 
                      x2={link.target.x} y2={link.target.y}
                      stroke={isHighlighted ? "#06b6d4" : "#1e293b"} 
                      strokeWidth={isHighlighted ? 1.5 : 1} 
                      opacity={isHighlighted ? 0.9 : 0.4}
                      strokeDasharray={link.type.includes("Depends") ? "4,4" : undefined}
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}

              {/* Render Glowing Nodes */}
              {topoNodes.map((node: any) => {
                const isSelected = selectedRecord && selectedRecord.sys_id === node.sys_id;
                const isHovered = hoveredNode === node.sys_id;
                const nodeColor = node.sys_class_name === "cmdb_ci_hardware" ? VM.blue :
                                  node.sys_class_name === "cmdb_ci_ai_persona" ? VM.purple :
                                  node.sys_class_name === "cmdb_ci_fanstack_room" ? VM.emerald :
                                  node.sys_class_name === "cmdb_ci_appl" ? VM.orange : VM.gold;
                
                // Smart node detection
                const isIoT = ["C120", "Nest-Cam-indoor", "govee-smart-light", "govee-hygrometer"].includes(node.name);
                const finalColor = isIoT ? VM.emerald : nodeColor;

                return (
                  <g 
                    key={node.sys_id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node.sys_id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleSelectRecord(node)}
                  >
                    {/* Glowing outer shadow ring */}
                    {(isSelected || isHovered) && (
                      <circle cx="0" cy="0" r="16" fill="none" stroke={finalColor} strokeWidth="3" opacity="0.3" className="animate-ping" />
                    )}
                    <circle cx="0" cy="0" r="12" fill="#0b1329" stroke={finalColor} strokeWidth={isSelected ? 3.5 : 1.8} className="transition-all duration-200" />
                    
                    {node.u_avatar_url ? (
                      <>
                        <defs>
                          <clipPath id={`clip-${node.sys_id}`}>
                            <circle cx="0" cy="0" r="10.5" />
                          </clipPath>
                        </defs>
                        <image 
                          href={node.u_avatar_url} 
                          x="-11" 
                          y="-11" 
                          width="22" 
                          height="22" 
                          clipPath={`url(#clip-${node.sys_id})`} 
                        />
                      </>
                    ) : (
                      <circle cx="0" cy="0" r="4" fill={finalColor} />
                    )}

                    {/* Small Status Glow dot inside node */}
                    <circle cx="8" cy="-8" r="3" fill={node.operational_status == 1 ? VM.emerald : node.operational_status == 2 ? VM.orange : VM.danger} />

                    {/* Node Text Label */}
                    <text 
                      x="16" y="4" 
                      fill={isSelected || isHovered ? "white" : "#cbd5e1"} 
                      className="font-mono text-[9px] select-none uppercase tracking-wider font-bold"
                    >
                      {node.name || node.user_name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 4. Table view list */}
        <div className="flex-1 p-5 min-h-[300px]">
          <div className="bg-[#111a36]/20 border border-[#1e293b] rounded-xl overflow-hidden flex flex-col h-full">
             {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-[#1e293b] bg-[#0b1329]/30 gap-3">
              <div className="font-mono text-xs text-[#64748b] uppercase tracking-widest shrink-0">
                Catalog Filter: <span className="text-[#06b6d4] font-bold">{activeTable.id}</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={fetchTableData} className="p-2 rounded-lg border border-[#1e293b] text-[#06b6d4] hover:bg-[#111a36] hover:text-white transition-all" title="Refresh Database">
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={() => {
                    const newId = `ci_${Math.random().toString(36).substr(2, 9)}`;
                    const newCI = { sys_id: newId, name: "new-hardware", sys_class_name: activeTable.id === "cmdb_ci" ? "cmdb_ci_hardware" : activeTable.id, short_description: "New Configuration Item", operational_status: 1 };
                    setSelectedRecord(newCI);
                    setEditForm(newCI);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-[#10b981]/20 transition-all"
                >
                  <Plus size={13} /> Add CI
                </button>
              </div>
            </div>

            {error && (
              <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg flex items-center gap-2 font-mono text-xs">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* List data render */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-[#64748b] font-mono text-xs gap-3 py-10">
                  <RefreshCw size={24} className="animate-spin text-[#06b6d4]" /> Synchronizing CMDB Relational Tables...
                </div>
              ) : records.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#64748b] font-mono text-xs py-10">
                  No records found inside {activeTable.id}.
                </div>
              ) : (
                <SortableTable
                  data={records}
                  columns={cmdbColumns}
                  searchPlaceholder="Search database..."
                  searchKeys={["name", "user_name", "short_description", "ip_address", "sys_class_name", "assigned_to", "department"]}
                  onRowClick={handleSelectRecord}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Right slide-out Details & Metrics sidebar panel */}
      {selectedRecord && editForm && (
        <div className="w-full lg:w-96 bg-[#0b1329] border-t lg:border-t-0 lg:border-l border-[#1e293b] flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20 overflow-y-auto animate-in slide-in-from-right duration-200">
          
          {/* Detail Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-[#06b6d4]" />
              <h3 className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                CI Details & Metrics
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-[#06b6d4]/20 transition-colors"
              >
                <Save size={12} /> {isSaving ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={() => { setSelectedRecord(null); setEditForm(null); }}
                className="p-1.5 border border-[#1e293b] text-[#64748b] rounded-lg hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5 flex-1">
            
            {/* Pop-Culture/Comic Icon Assignment Render */}
            {selectedRecord.u_avatar_url && (
              <div className="flex flex-col items-center justify-center p-4 bg-[#111a36]/50 border border-[#1e293b] rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 to-transparent z-10" />
                <img 
                  src={selectedRecord.u_avatar_url} 
                  alt={selectedRecord.name || selectedRecord.user_name} 
                  className="w-32 h-32 rounded-xl object-cover border-2 border-[#06b6d4] shadow-[0_0_20px_rgba(6,182,212,0.3)] z-0 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="mt-3 text-center z-10 relative">
                  <span className="font-mono text-[10px] text-[#06b6d4] uppercase tracking-widest font-bold animate-pulse">
                    Seeded CI Avatar
                  </span>
                  <h4 className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                    {selectedRecord.name || selectedRecord.user_name}
                  </h4>
                </div>
              </div>
            )}

            {/* Dynamic System Telemetry Simulator Gauges */}
            <div className="bg-[#111a36]/50 border border-[#1e293b] rounded-xl p-4 flex flex-col gap-4">
              <div className="font-mono text-[9px] text-[#64748b] tracking-widest uppercase flex items-center gap-1.5">
                <Activity size={10} className="text-[#06b6d4]" /> Real-time Node Telemetry
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Simulated Health Score Radial Gauge */}
                <div className="flex flex-col items-center justify-center p-2 bg-[#020617]/50 rounded-lg border border-[#1e293b]/50">
                  <svg width="60" height="60" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#111a36" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray="89, 100" strokeLinecap="round" />
                  </svg>
                  <div className="font-mono text-xs font-bold text-white mt-1.5">89% Score</div>
                  <div className="font-mono text-[8px] text-[#64748b] uppercase tracking-wider">Health Rating</div>
                </div>

                {/* Simulated Temperature Gauge */}
                <div className="flex flex-col items-center justify-center p-2 bg-[#020617]/50 rounded-lg border border-[#1e293b]/50">
                  <Thermometer size={24} className="text-[#f97316]" />
                  <div className="font-mono text-xs font-bold text-white mt-1.5">
                    {selectedRecord.sys_class_name === "cmdb_ci_hardware" ? "42°C" : "37°C"}
                  </div>
                  <div className="font-mono text-[8px] text-[#64748b] uppercase tracking-wider">Node Temp</div>
                </div>
              </div>

              {/* Progress metrics bars */}
              <div className="space-y-3 mt-1">
                <div>
                  <div className="flex justify-between font-mono text-[9px] text-[#cbd5e1] mb-1">
                    <span>CPU LOAD</span>
                    <span>{selectedRecord.sys_class_name === "cmdb_ci_hardware" ? "45%" : "12%"}</span>
                  </div>
                  <div className="w-full bg-[#020617] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                    <div 
                      className="bg-[#06b6d4] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#06b6d4]" 
                      style={{ width: selectedRecord.sys_class_name === "cmdb_ci_hardware" ? "45%" : "12%" }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[9px] text-[#cbd5e1] mb-1">
                    <span>RAM MEMORY UTILIZATION</span>
                    <span>{selectedRecord.sys_class_name === "cmdb_ci_hardware" ? "72%" : "38%"}</span>
                  </div>
                  <div className="w-full bg-[#020617] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                    <div 
                      className="bg-[#a855f7] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#a855f7]" 
                      style={{ width: selectedRecord.sys_class_name === "cmdb_ci_hardware" ? "72%" : "38%" }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Upstream/Downstream Dependency Links */}
            <div className="bg-[#111a36]/50 border border-[#1e293b] rounded-xl p-4 flex flex-col gap-3">
              <div className="font-mono text-[9px] text-[#64748b] tracking-widest uppercase flex items-center gap-1.5">
                <Network size={10} className="text-[#06b6d4]" /> Connected Relationships
              </div>

              {relUpstream.length === 0 && relDownstream.length === 0 ? (
                <div className="font-mono text-[10px] text-[#64748b] text-center py-2">
                  No defined upstream or downstream dependencies.
                </div>
              ) : (
                <div className="space-y-3">
                  {relUpstream.map((item: any) => (
                    <div 
                      key={item.rel.sys_id} 
                      onClick={() => handleSelectRecord(item.node)}
                      className="flex items-center gap-2 p-2 bg-[#020617]/50 hover:bg-[#111a36] rounded-lg border border-[#1e293b]/50 cursor-pointer transition-colors"
                    >
                      <ArrowRight size={10} className="text-[#f97316] shrink-0" />
                      <div className="font-mono text-[9px]">
                        <span className="text-[#64748b]">UPSTREAM:</span> <span className="text-white font-bold uppercase">{item.node.name || item.node.user_name}</span>
                        <div className="text-[8px] text-[#64748b] mt-0.5">{item.rel.type}</div>
                      </div>
                    </div>
                  ))}

                  {relDownstream.map((item: any) => (
                    <div 
                      key={item.rel.sys_id} 
                      onClick={() => handleSelectRecord(item.node)}
                      className="flex items-center gap-2 p-2 bg-[#020617]/50 hover:bg-[#111a36] rounded-lg border border-[#1e293b]/50 cursor-pointer transition-colors"
                    >
                      <ArrowRight size={10} className="text-[#10b981] shrink-0" />
                      <div className="font-mono text-[9px]">
                        <span className="text-[#64748b]">DOWNSTREAM:</span> <span className="text-white font-bold uppercase">{item.node.name || item.node.user_name}</span>
                        <div className="text-[8px] text-[#64748b] mt-0.5">{item.rel.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editable Fields Form */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  Asset ID (System Generated)
                </label>
                <div className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-[#64748b]">
                  {editForm.sys_id}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  CI Class Type
                </label>
                <div className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-[#64748b] uppercase">
                  {editForm.sys_class_name || activeTable.id}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  Configuration Name
                </label>
                <input 
                  type="text"
                  value={editForm.name || editForm.user_name || ""}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  Short Description / Specs
                </label>
                <textarea 
                  rows={3}
                  value={editForm.short_description || editForm.introduction || ""}
                  onChange={e => setEditForm({ ...editForm, short_description: e.target.value })}
                  className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  Operational Status
                </label>
                <select
                  value={editForm.operational_status || 1}
                  onChange={e => setEditForm({ ...editForm, operational_status: parseInt(e.target.value) })}
                  className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                >
                  <option value={1}>1 - Optimal / Active</option>
                  <option value={2}>2 - Degraded / Warning</option>
                  <option value={3}>3 - Non-Operational / Down</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                  Assigned Custodian
                </label>
                <input 
                  type="text"
                  value={editForm.assigned_to || editForm.department || "james"}
                  onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                />
              </div>

              {editForm.sys_class_name === "cmdb_ci_hardware" && (
                <div>
                  <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                    Avatar URL Path
                  </label>
                  <input 
                    type="text"
                    value={editForm.u_avatar_url || ""}
                    onChange={e => setEditForm({ ...editForm, u_avatar_url: e.target.value })}
                    className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>
              )}

              {editForm.sys_class_name === "cmdb_ci_appl" && (
                <>
                  <div>
                    <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                      Port Number
                    </label>
                    <input 
                      type="text"
                      value={editForm.port || ""}
                      onChange={e => setEditForm({ ...editForm, port: e.target.value })}
                      className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                      Active Stack state
                    </label>
                    <select
                      value={editForm.active || 0}
                      onChange={e => setEditForm({ ...editForm, active: parseInt(e.target.value) })}
                      className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                    >
                      <option value={1}>1 - Active Stack</option>
                      <option value={0}>0 - Staged/Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1.5">
                      Dashboard Icon text (Single Char)
                    </label>
                    <input 
                      type="text"
                      maxLength={1}
                      value={editForm.icon || ""}
                      onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                      className="w-full bg-[#020617] border border-[#1e293b] focus:border-[#06b6d4] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
