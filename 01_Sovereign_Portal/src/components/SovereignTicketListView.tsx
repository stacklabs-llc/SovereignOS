import React, { useState } from 'react';
import { Search, Filter, Eye, Edit2, ShieldAlert, ChevronDown, ChevronUp, MessageSquare, Send, Download, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentTask, TaskStatus } from './LivingKanbanBoard';

interface SovereignTicketListViewProps {
  tasks: AgentTask[];
  onEditTask: (task: AgentTask) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  onRefresh?: () => void;
  assignees: string[];
}

export default function SovereignTicketListView({ 
  tasks, 
  onEditTask,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  isFiltersOpen,
  setIsFiltersOpen,
  onRefresh,
  assignees
}: SovereignTicketListViewProps) {
  const [sortField, setSortField] = useState<keyof AgentTask>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Expanded row task ID
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Active inline dropdown menu task ID & type
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'status' | 'priority' | 'assignee' | null>(null);

  // Detail Drawer task ID
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [drawerNewNote, setDrawerNewNote] = useState('');

  // Hover Popover States (Tooltips for Work Notes / Details)
  const [hoveredNoteTaskId, setHoveredNoteTaskId] = useState<string | null>(null);
  const [hoveredNotePos, setHoveredNotePos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Inline Note Entry state
  const [inlineNoteTaskId, setInlineNoteTaskId] = useState<string | null>(null);
  const [inlineNoteValue, setInlineNoteValue] = useState('');

  // Bulk action state
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkPriorityOpen, setBulkPriorityOpen] = useState(false);

  const handleSort = (field: keyof AgentTask) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: keyof AgentTask) => {
    if (sortField !== field) return <span className="opacity-20 ml-1 select-none text-[10px]">⇅</span>;
    return sortDirection === 'asc' ? <span className="text-[#38bdf8] ml-1 select-none">▲</span> : <span className="text-[#38bdf8] ml-1 select-none">▼</span>;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    // Specialized Priority Sorting (P1 Critical is highest, then P2, P3, P4)
    if (sortField === 'priority') {
      const priorityWeight = (p: string) => {
        if (p === 'P1') return 1;
        if (p === 'P2') return 2;
        if (p === 'P3') return 3;
        if (p === 'P4') return 4;
        return 99;
      };
      return sortDirection === 'asc' 
        ? priorityWeight(String(valA)) - priorityWeight(String(valB))
        : priorityWeight(String(valB)) - priorityWeight(String(valA));
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    
    return sortDirection === 'asc'
      ? (valA < valB ? -1 : valA > valB ? 1 : 0)
      : (valA > valB ? -1 : valA < valB ? 1 : 0);
  });

  const uniqueStatuses = ['All', 'Planning', 'Open', 'Work In Progress', 'Resolved', 'Closed'];
  const uniquePriorities = ['All', ...Array.from(new Set(tasks.map(t => t.priority)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Work In Progress': return 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10';
      case 'Resolved': return 'border-[#34d399] text-[#34d399] bg-[#34d399]/10';
      case 'Planning': return 'border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10';
      case 'Closed': return 'border-slate-500 text-slate-400 bg-slate-600/20';
      default: return 'border-[#8E9CAA] text-[#8E9CAA] bg-[#8E9CAA]/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'border-[#ff4444] text-[#ff4444] bg-[#ff4444]/10';
      case 'P2': return 'border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10';
      case 'P3': return 'border-yellow-500 text-yellow-400 bg-yellow-950/20';
      default: return 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
        const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
        const d = new Date(utcDateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateStr;
    }
  };

  // Helper to calculate elapsed hours since updated_at or created_at
  const getTaskAgeHours = (updatedAt?: string, createdAt?: string) => {
    const refDate = updatedAt || createdAt;
    if (!refDate) return 0;
    try {
      const utcStr = refDate.endsWith('Z') ? refDate : refDate.replace(' ', 'T') + 'Z';
      const elapsedMs = Date.now() - new Date(utcStr).getTime();
      return elapsedMs / (1000 * 60 * 60);
    } catch {
      return 0;
    }
  };

  // Check if a P1/P2 task is stale (untouched past 2 hours SLA threshold)
  const isTaskSLAStale = (task: AgentTask) => {
    const priority = task.priority;
    if (priority !== 'P1' && priority !== 'P2') return false;
    if (task.status === 'Resolved' || task.status === 'Closed') return false;
    const hours = getTaskAgeHours(task.updated_at, task.created_at);
    return hours > 2.0; // Stale past 2 hours
  };

  // Count parsed work notes
  const getWorkNotesCount = (notes?: string) => {
    if (!notes) return 0;
    const matches = notes.match(/\[Agent Journal/g);
    return matches ? matches.length : 0;
  };

  // Parse work notes into array of objects
  const parseWorkNotes = (notes?: string) => {
    if (!notes) return [];
    return notes
      .split(/(?=\[Agent Journal)/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
  };

  const handleUpdateField = async (taskId: string, fields: Partial<AgentTask>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const mapStatusToApi = (st: string) => {
      if (st === 'Closed') return 'CLOSED';
      if (st === 'Resolved') return 'DONE';
      if (st === 'Work In Progress') return 'IN_PROGRESS';
      if (st === 'Planning') return 'PLANNING';
      return 'OPEN';
    };

    const statusVal = fields.status !== undefined ? mapStatusToApi(fields.status) : mapStatusToApi(task.status);
    const assignedVal = fields.assigned_to !== undefined 
      ? (fields.assigned_to === 'UNASSIGNED' ? '' : fields.assigned_to) 
      : (task.assigned_to === 'UNASSIGNED' ? '' : task.assigned_to);

    try {
      const res = await fetch(`/api/tickets/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fields.title !== undefined ? fields.title : task.title,
          description: fields.description !== undefined ? fields.description : task.description,
          work_notes: fields.work_notes !== undefined ? fields.work_notes : task.work_notes,
          status: statusVal,
          priority: fields.priority !== undefined ? fields.priority : task.priority,
          assigned_to: assignedVal,
          affected_ci: fields.affected_ci !== undefined ? fields.affected_ci : task.affected_ci
        })
      });
      if (!res.ok) throw new Error("API call failed");
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Failed to mutate ticket fields inline", e);
    }
  };

  const handleAddInlineNote = async (taskId: string) => {
    if (!inlineNoteValue.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const formattedNote = task.work_notes 
      ? `${task.work_notes}\n[Agent Journal - ${timestamp} - james]\n${inlineNoteValue.trim()}`
      : `[Agent Journal - ${timestamp} - james]\n${inlineNoteValue.trim()}`;

    await handleUpdateField(taskId, { work_notes: formattedNote });
    setInlineNoteTaskId(null);
    setInlineNoteValue('');
  };

  const handleAddDrawerNote = async (taskId: string) => {
    if (!drawerNewNote.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const formattedNote = task.work_notes 
      ? `${task.work_notes}\n[Agent Journal - ${timestamp} - james]\n${drawerNewNote.trim()}`
      : `[Agent Journal - ${timestamp} - james]\n${drawerNewNote.trim()}`;

    await handleUpdateField(taskId, { work_notes: formattedNote });
    setDrawerNewNote('');
  };

  // Bulk Actions
  const handleBulkClose = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to close ${selectedIds.length} selected tickets?`)) return;
    
    setIsBulkUpdating(true);
    try {
      const response = await fetch('/api/tickets/batch_update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: selectedIds,
          action: 'CLOSE',
        }),
      });
      if (!response.ok) throw new Error('Failed to bulk close tickets');
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error bulk closing tickets.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkAssign = async (assignee: string) => {
    setIsBulkUpdating(true);
    try {
      for (const id of selectedIds) {
        await handleUpdateField(id, { assigned_to: assignee });
      }
      setSelectedIds([]);
      setBulkAssignOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkPriority = async (priority: string) => {
    setIsBulkUpdating(true);
    try {
      for (const id of selectedIds) {
        await handleUpdateField(id, { priority });
      }
      setSelectedIds([]);
      setBulkPriorityOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportJSON = () => {
    const selectedTasks = tasks.filter(t => selectedIds.includes(t.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedTasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sovereign_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Simulated Telemetry logs for Drawer / Expanded View
  const getTelemetryLogs = (affectedCi?: string) => {
    const target = affectedCi || 'SYSTEM_CORE';
    return [
      `[INGRESS] [${new Date().toLocaleTimeString()}] Scanning active host registry...`,
      `[SECURITY] Tunnel active over Tailscale DNS (Encrypted Channel)`,
      `[CMDB_REGISTRY] Target Node: ${target} status -> VALIDATED`,
      `[LOG_MONITOR] Watchdog heartbeat: OK (confidence 1.0)`,
      `[NPU_ENGINE] Classification coprocessor status: ONLINE`,
      `[METRIC] CPU: 12.4% | Memory: 42.1% | Swap: 38.6% (Stable)`
    ].join('\n');
  };

  const activeDrawerTask = tasks.find(t => t.id === drawerTaskId);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 text-white font-['Rajdhani',sans-serif] overflow-hidden min-h-0 relative">
      {/* Dropdown Backdrop to dismiss menus on outside click */}
      {(activeMenuTaskId || bulkAssignOpen || bulkPriorityOpen) && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { 
          setActiveMenuTaskId(null); 
          setActiveMenuType(null); 
          setBulkAssignOpen(false);
          setBulkPriorityOpen(false);
        }} />
      )}

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden w-full shrink-0 bg-[#0a1118]/80 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-md cursor-pointer animate-fade-in" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
        <div className="flex items-center gap-2 text-[#38bdf8] font-bold uppercase tracking-widest">
          <Filter size={18} /> Filters {statusFilter !== 'All' || priorityFilter !== 'All' ? '(Active)' : ''}
        </div>
        <div className="text-xs font-mono text-white/50 uppercase tracking-widest">
          {isFiltersOpen ? 'Hide' : 'Show'}
        </div>
      </div>

      {/* Sidebar Filter */}
      <div className={`w-full lg:w-56 shrink-0 bg-[#0a1118]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-4 backdrop-blur-md transition-all ${isFiltersOpen ? 'block' : 'hidden lg:flex'}`}>
        <div className="hidden lg:flex items-center gap-2 text-[#38bdf8] font-bold uppercase tracking-widest border-b border-white/10 pb-3">
          <Filter size={18} /> Filters
        </div>
        
        <div>
          <label className="block text-xs font-mono text-[#8E9CAA] uppercase tracking-widest mb-2">State</label>
          <div className="flex flex-col gap-2">
            {uniqueStatuses.map(s => (
              <label key={s} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${statusFilter === s ? 'border-[#38bdf8] bg-[#38bdf8]/20' : 'border-white/20'}`}>
                   {statusFilter === s && <div className="w-2 h-2 rounded-sm bg-[#38bdf8]"></div>}
                </div>
                <input type="radio" name="status" className="hidden" checked={statusFilter === s} onChange={() => setStatusFilter(s)} />
                <span className="text-sm tracking-wider uppercase">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-[#8E9CAA] uppercase tracking-widest mb-2">Priority</label>
          <div className="flex flex-col gap-2">
            {uniquePriorities.map(p => (
              <label key={p} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${priorityFilter === p ? 'border-[#38bdf8] bg-[#38bdf8]/20' : 'border-white/20'}`}>
                   {priorityFilter === p && <div className="w-2 h-2 rounded-sm bg-[#38bdf8]"></div>}
                </div>
                <input type="radio" name="priority" className="hidden" checked={priorityFilter === p} onChange={() => setPriorityFilter(p)} />
                <span className="text-sm tracking-wider uppercase">{p}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10 text-xs font-mono text-white/30 text-center uppercase tracking-widest">
          Sovereign Data Grid v2.5
        </div>
      </div>

      {/* Main List */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#0a1118]/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden h-full">
        {/* Simple Toolbar inside grid header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 min-h-[65px] shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-mono text-[#8E9CAA] uppercase tracking-widest flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
               Active Worklist
            </div>
            <div className="text-xs font-mono text-[#8E9CAA] uppercase tracking-widest flex items-center gap-2">
               Showing {sortedTasks.length} tickets {selectedIds.length > 0 && `(${selectedIds.length} Selected)`}
            </div>
          </div>
        </div>

        {/* Scrollable grid container */}
        <div className="flex-grow overflow-x-auto flex flex-col min-h-0">
          <div className="min-w-[950px] flex-grow flex flex-col min-h-0 overflow-hidden">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-[40px_100px_1fr_90px_90px_60px_140px_90px_90px] gap-3 px-4 py-3 border-b border-white/10 bg-black/60 text-xs font-mono text-[#8E9CAA] uppercase tracking-widest font-bold select-none shrink-0">
              <div className="flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={sortedTasks.length > 0 && selectedIds.length === sortedTasks.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(sortedTasks.map(t => t.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded border-white/20 bg-black text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('id')}>
                Ticket ID {renderSortIndicator('id')}
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('title')}>
                Short Description {renderSortIndicator('title')}
              </div>
              <div className="flex items-center">
                Work Notes
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('status')}>
                State {renderSortIndicator('status')}
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('priority')}>
                Priority {renderSortIndicator('priority')}
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('affected_ci')}>
                Assigned CI {renderSortIndicator('affected_ci')}
              </div>
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('created_at')}>
                Created {renderSortIndicator('created_at')}
              </div>
              <div className="text-right">Actions</div>
            </div>

            {/* Table Body Scroll container */}
            <div className="table-body-scroll flex-grow flex-1 overflow-y-auto min-h-0">
              {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4 mt-8">
                  <ShieldAlert className="w-12 h-12 opacity-50" />
                  <div className="font-mono uppercase tracking-widest">No tickets match current filters</div>
                </div>
              ) : (
                <div className="divide-y divide-white/5 pb-4">
                  {sortedTasks.map(task => {
                    const isMenuOpen = activeMenuTaskId === task.id;
                    const notesCount = getWorkNotesCount(task.work_notes);
                    const isStale = isTaskSLAStale(task);
                    const isRowExpanded = expandedTaskId === task.id;

                    return (
                      <React.Fragment key={task.id}>
                        {/* Desktop View */}
                        <div 
                          onDoubleClick={() => setExpandedTaskId(isRowExpanded ? null : task.id)}
                          className={`hidden lg:grid grid-cols-[40px_100px_1fr_90px_90px_60px_140px_90px_90px] gap-3 px-4 py-3 items-center even:bg-[#ffffff03] hover:bg-[#38bdf8]/10 transition-colors group relative ${
                            isStale ? 'shadow-[inset_0_0_10px_rgba(220,38,38,0.2)] border border-red-500/20' : ''
                          }`}
                          style={{
                            boxShadow: isStale ? 'inset 0 0 10px rgba(220, 38, 38, 0.2)' : 'none'
                          }}
                        >
                          <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(task.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, task.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== task.id));
                                }
                              }}
                              className="rounded border-white/20 bg-black text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                            />
                            <button 
                              onClick={() => setExpandedTaskId(isRowExpanded ? null : task.id)}
                              className="text-white/40 hover:text-white transition-colors"
                            >
                              {isRowExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          
                          {/* Eye / ID trigger Detail Drawer */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDrawerTaskId(task.id); }} 
                            className="font-mono text-[#38bdf8] font-bold text-sm hover:underline text-left cursor-pointer flex items-center gap-1.5"
                          >
                            {isStale && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" title="SLA Breached"></span>}
                            {task.id}
                          </button>
                          
                          {/* Title */}
                          <div className="font-bold text-base truncate pr-2 break-all break-words select-text">
                            {task.title}
                          </div>
                          
                          {/* Work Notes Column */}
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const posX = rect.left;
                                const posY = rect.bottom + 8;
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = setTimeout(() => {
                                  setHoveredNotePos({ x: posX, y: posY });
                                  setHoveredNoteTaskId(task.id);
                                }, 1500);
                              }}
                              onMouseLeave={() => {
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                setHoveredNoteTaskId(null);
                              }}
                              onClick={() => {
                                setInlineNoteTaskId(inlineNoteTaskId === task.id ? null : task.id);
                                setInlineNoteValue('');
                              }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                                notesCount > 0 
                                  ? 'border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20' 
                                  : 'border-white/10 text-white/40 hover:text-white/80'
                              }`}
                            >
                              <MessageSquare size={10} /> {notesCount}
                            </button>

                            {/* Inline Note Addition overlay */}
                            <AnimatePresence>
                              {inlineNoteTaskId === task.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute top-8 left-0 z-50 w-64 p-3 bg-slate-950/95 border border-[#38bdf8]/30 rounded-xl shadow-2xl backdrop-blur-md"
                                >
                                  <textarea
                                    autoFocus
                                    className="w-full bg-black border border-white/10 rounded p-1.5 text-xs text-white font-mono h-20 resize-none focus:outline-none focus:border-[#38bdf8] mb-2"
                                    placeholder="Append new work note..."
                                    value={inlineNoteValue}
                                    onChange={e => setInlineNoteValue(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={() => setInlineNoteTaskId(null)}
                                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleAddInlineNote(task.id)}
                                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#38bdf8] text-black rounded hover:bg-[#0ea5e9] transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Interactive Inline Status Dropdown */}
                          <div className="relative z-30" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTaskId(isMenuOpen && activeMenuType === 'status' ? null : task.id);
                                setActiveMenuType('status');
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border hover:border-white/50 cursor-pointer transition-colors ${getStatusColor(task.status)}`}
                            >
                              {task.status} ▾
                            </button>
                            <AnimatePresence>
                              {isMenuOpen && activeMenuType === 'status' && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden font-mono text-[10px]"
                                >
                                  {['Planning', 'Open', 'Work In Progress', 'Resolved', 'Closed'].map(st => (
                                    <button
                                      key={st}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateField(task.id, { status: st as TaskStatus });
                                        setActiveMenuTaskId(null);
                                        setActiveMenuType(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-[#38bdf8]/20 hover:text-white text-white/80 transition-colors"
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Interactive Inline Priority Dropdown */}
                          <div className="relative z-30" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTaskId(isMenuOpen && activeMenuType === 'priority' ? null : task.id);
                                setActiveMenuType('priority');
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border hover:border-white/50 cursor-pointer transition-colors ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority} ▾
                            </button>
                            <AnimatePresence>
                              {isMenuOpen && activeMenuType === 'priority' && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 mt-1 w-24 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden font-mono text-[10px]"
                                >
                                  {['P1', 'P2', 'P3', 'P4'].map(p => (
                                    <button
                                      key={p}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateField(task.id, { priority: p });
                                        setActiveMenuTaskId(null);
                                        setActiveMenuType(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-white text-white/80 transition-colors"
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Interactive Inline Assignee Dropdown */}
                          <div className="flex flex-col gap-1 min-w-0 relative z-30" onClick={e => e.stopPropagation()}>
                            <div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuTaskId(isMenuOpen && activeMenuType === 'assignee' ? null : task.id);
                                  setActiveMenuType('assignee');
                                }}
                                className="font-mono text-[10px] text-[#E0BC68] uppercase tracking-widest truncate hover:underline hover:text-white flex items-center gap-1"
                              >
                                👤 {task.assigned_to === 'UNASSIGNED' ? 'Unassigned' : task.assigned_to.replace(/_HOUSE|HOUSE_OF_/g, '').substring(0, 8)} ▾
                              </button>
                              <AnimatePresence>
                                {isMenuOpen && activeMenuType === 'assignee' && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-y-auto max-h-56 font-mono text-[10px]"
                                  >
                                    {assignees.map(assignee => (
                                      <button
                                        key={assignee}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateField(task.id, { assigned_to: assignee });
                                          setActiveMenuTaskId(null);
                                          setActiveMenuType(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 hover:text-white text-white/80 transition-colors"
                                      >
                                        {assignee}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {task.affected_ci && (
                              <div className="font-mono text-[9px] text-[#34d399] uppercase tracking-widest truncate bg-[#34d399]/10 px-1 py-0.5 rounded inline-block w-fit">⚡ {task.affected_ci.substring(0, 12)}</div>
                            )}
                          </div>
                          
                          <div className="font-mono text-[10px] text-[#8E9CAA] uppercase">{formatDate(task.created_at)}</div>
                          
                          <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setDrawerTaskId(task.id)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#38bdf8]" title="Quick View">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => onEditTask(task)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#34d399]" title="Full Edit">
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Accordion Expanded Row Container */}
                        <AnimatePresence>
                          {isRowExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="col-span-full bg-slate-950/60 border-t border-b border-[#38bdf8]/15 px-12 py-4 text-xs font-mono text-slate-300 overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <span className="text-[#38bdf8] uppercase font-bold tracking-wider block mb-1">Payload Details (Description)</span>
                                  <p className="bg-black/50 p-3 rounded border border-white/5 whitespace-pre-wrap font-sans text-sm text-white/80 leading-relaxed overflow-y-auto max-h-48 break-words select-text">
                                    {task.description || 'No description payload provided.'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[#34d399] uppercase font-bold tracking-wider block mb-1">System Telemetry & NPU Logs</span>
                                  <pre className="bg-black p-3 rounded border border-green-500/20 text-green-400 max-h-48 overflow-y-auto select-all text-[10px]">
                                    {getTelemetryLogs(task.affected_ci)}
                                  </pre>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Mobile View */}
                        <div className="flex flex-col lg:hidden gap-3 px-4 py-4 hover:bg-white/5 transition-colors group relative">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(task.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds(prev => [...prev, task.id]);
                                  } else {
                                    setSelectedIds(prev => prev.filter(id => id !== task.id));
                                  }
                                }}
                                className="rounded border-white/20 bg-black text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 shrink-0"
                              />
                              <div className="flex flex-col gap-1">
                                <button onClick={() => setDrawerTaskId(task.id)} className="font-mono text-[#38bdf8] font-bold text-sm hover:underline text-left cursor-pointer flex items-center gap-1.5">
                                  {isStale && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block"></span>}
                                  {task.id}
                                </button>
                                <div className="font-bold text-base leading-tight text-white/90 select-text">{task.title}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => setDrawerTaskId(task.id)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#38bdf8]" title="View Details">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => onEditTask(task)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#34d399]" title="Edit Ticket">
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assigned_to !== 'UNASSIGNED' && task.assigned_to && (
                              <span className="font-mono text-[10px] text-[#E0BC68] uppercase tracking-widest px-1 py-0.5 border border-[#E0BC68]/20 bg-[#E0BC68]/10 rounded flex items-center gap-1">
                                👤 {task.assigned_to}
                              </span>
                            )}
                            {task.affected_ci && (
                              <span className="font-mono text-[10px] text-[#34d399] uppercase tracking-widest bg-[#34d399]/10 border border-[#34d399]/20 px-1 py-0.5 rounded flex items-center gap-1">
                                ⚡ {task.affected_ci}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-[#38bdf8] border border-[#38bdf8]/20 px-1 py-0.5 rounded">
                              💬 {notesCount} Notes
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                             <span className="font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest">
                               Created: {formatDate(task.created_at)}
                             </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SLA Hover Tooltip */}
      <AnimatePresence>
        {hoveredNoteTaskId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[99999] pointer-events-none w-72 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl text-[11px] font-mono backdrop-blur-md"
            style={{ top: `${hoveredNotePos.y}px`, left: `${hoveredNotePos.x}px` }}
          >
            {(() => {
              const t = tasks.find(x => x.id === hoveredNoteTaskId);
              const lastNote = parseWorkNotes(t?.work_notes).pop();
              return (
                <div>
                  <div className="text-[#38bdf8] font-bold border-b border-white/10 pb-1 mb-2">LATEST WORK NOTE SUMMARY</div>
                  {lastNote ? (
                    <div className="text-white/80 whitespace-pre-wrap leading-normal select-text truncate line-clamp-3">
                      {lastNote}
                    </div>
                  ) : (
                    <div className="text-white/40 italic">No notes logged yet. Click to add.</div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Detail Drawer */}
      <AnimatePresence>
        {activeDrawerTask && (
          <>
            {/* Drawer Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerTaskId(null)}
              className="fixed inset-0 bg-black z-[999] cursor-pointer"
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-[1000] w-full max-w-lg bg-slate-950/95 border-l border-slate-800/80 shadow-2xl backdrop-blur-md flex flex-col font-['Rajdhani',sans-serif] text-white"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-[#38bdf8]">{activeDrawerTask.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(activeDrawerTask.priority)}`}>
                      {activeDrawerTask.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold uppercase truncate max-w-xs">{activeDrawerTask.title}</h2>
                </div>
                <button onClick={() => setDrawerTaskId(null)} className="text-white/40 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-white/40 block uppercase text-[9px] tracking-wider">State</span>
                    <span className="text-white font-bold">{activeDrawerTask.status}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block uppercase text-[9px] tracking-wider">Assignee</span>
                    <span className="text-[#E0BC68] font-bold">👤 {activeDrawerTask.assigned_to}</span>
                  </div>
                  {activeDrawerTask.affected_ci && (
                    <div className="col-span-2 border-t border-white/5 pt-2">
                      <span className="text-white/40 block uppercase text-[9px] tracking-wider">Affected CI</span>
                      <span className="text-[#34d399] font-bold">⚡ {activeDrawerTask.affected_ci}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <span className="text-white/40 block uppercase text-[10px] tracking-wider mb-1 font-mono">Detailed Payload Description</span>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-sans text-sm text-white/90 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                    {activeDrawerTask.description || 'No description payload provided.'}
                  </div>
                </div>

                {/* Telemetry Terminal */}
                <div>
                  <span className="text-[#34d399] block uppercase text-[10px] tracking-wider mb-1 font-mono">Telemetry stream logs</span>
                  <pre className="bg-black p-3 rounded-xl border border-green-500/20 text-green-400 text-[10px] font-mono overflow-y-auto max-h-36 leading-normal select-all">
                    {getTelemetryLogs(activeDrawerTask.affected_ci)}
                  </pre>
                </div>

                {/* Work Notes Feed */}
                <div className="border-t border-white/10 pt-4">
                  <span className="text-white/40 block uppercase text-[10px] tracking-wider mb-2 font-mono">Work Notes & Logs ({getWorkNotesCount(activeDrawerTask.work_notes)})</span>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {parseWorkNotes(activeDrawerTask.work_notes).map((note, idx) => (
                      <div key={idx} className="bg-black/50 border border-white/5 p-3 rounded-lg font-mono text-[11px] text-white/80 leading-normal select-text">
                        {note}
                      </div>
                    ))}
                    {getWorkNotesCount(activeDrawerTask.work_notes) === 0 && (
                      <div className="text-white/30 italic text-xs">No work notes yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Input */}
              <div className="p-6 border-t border-white/10 bg-black/40 flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Append quick work note..."
                    value={drawerNewNote}
                    onChange={e => setDrawerNewNote(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddDrawerNote(activeDrawerTask.id);
                    }}
                    className="flex-grow bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-[#38bdf8] font-mono placeholder-white/20 focus:outline-none focus:border-[#38bdf8]"
                  />
                  <button
                    onClick={() => handleAddDrawerNote(activeDrawerTask.id)}
                    className="px-4 py-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold uppercase rounded-lg text-xs tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Send size={12} /> Add
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Live Sync Queue</span>
                  <button
                    onClick={() => {
                      setDrawerTaskId(null);
                      onEditTask(activeDrawerTask);
                    }}
                    className="text-xs text-[#38bdf8] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    Launch Full Editor →
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Translucent Multi-Select Command Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: '100px', x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: '100px', x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] shadow-2xl rounded-2xl backdrop-blur-md bg-slate-950/90 border border-[#38bdf8]/30 px-6 py-4 flex flex-wrap items-center gap-4 text-xs font-mono text-white max-w-full sm:max-w-2xl"
          >
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
              <span className="text-white/40">SELECTED:</span>
              <span className="text-[#38bdf8] font-black text-sm">{selectedIds.length}</span>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors text-white/60 hover:text-white"
              >
                CLEAR
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Batch Assign */}
              <div className="relative">
                <button
                  onClick={() => {
                    setBulkAssignOpen(!bulkAssignOpen);
                    setBulkPriorityOpen(false);
                  }}
                  disabled={isBulkUpdating}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded uppercase font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  Assign 👤 ▾
                </button>
                <AnimatePresence>
                  {bulkAssignOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute bottom-10 left-0 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-y-auto max-h-48"
                    >
                      {assignees.map(ass => (
                        <button
                          key={ass}
                          onClick={() => handleBulkAssign(ass)}
                          className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 hover:text-white text-white/80 transition-colors"
                        >
                          {ass}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Batch Priority */}
              <div className="relative">
                <button
                  onClick={() => {
                    setBulkPriorityOpen(!bulkPriorityOpen);
                    setBulkAssignOpen(false);
                  }}
                  disabled={isBulkUpdating}
                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded uppercase font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  Priority ▾
                </button>
                <AnimatePresence>
                  {bulkPriorityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute bottom-10 left-0 w-24 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden font-mono"
                    >
                      {['P1', 'P2', 'P3', 'P4'].map(p => (
                        <button
                          key={p}
                          onClick={() => handleBulkPriority(p)}
                          className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-white text-white/80 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export JSON */}
              <button
                onClick={handleExportJSON}
                disabled={isBulkUpdating}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded uppercase font-bold flex items-center gap-1 disabled:opacity-50"
                title="Export selected tasks to JSON file"
              >
                <Download size={12} /> Export
              </button>

              {/* Bulk Close */}
              <button
                onClick={handleBulkClose}
                disabled={isBulkUpdating}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded uppercase font-bold disabled:opacity-50"
              >
                {isBulkUpdating ? 'CLOSING...' : 'CLOSE'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
