import React, { useState } from 'react';
import { Search, Filter, Eye, Edit2, MessageSquare, Clock, ShieldAlert } from 'lucide-react';

import { AgentTask } from './LivingKanbanBoard';

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
  onRefresh
}: SovereignTicketListViewProps) {
  const [sortField, setSortField] = useState<keyof AgentTask>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkClosing, setIsBulkClosing] = useState(false);

  const handleSort = (field: keyof AgentTask) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: keyof AgentTask) => {
    if (sortField !== field) return <span className="opacity-20 ml-1 select-none">⇅</span>;
    return sortDirection === 'asc' ? <span className="text-[#38bdf8] ml-1 select-none">▲</span> : <span className="text-[#38bdf8] ml-1 select-none">▼</span>;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    // Specialized Priority Sorting (P1 Critical is highest, then P2, P3, P4, P5)
    if (sortField === 'priority') {
      const priorityWeight = (p: string) => {
        if (p.startsWith('P')) {
          const num = parseInt(p.substring(1));
          return isNaN(num) ? 99 : num;
        }
        if (p === 'Planning') return 5;
        if (p === 'Low') return 4;
        if (p === 'Moderate') return 3;
        if (p === 'High') return 2;
        if (p === 'Critical') return 1;
        return 99;
      };
      return sortDirection === 'asc' 
        ? priorityWeight(String(valA)) - priorityWeight(String(valB))
        : priorityWeight(String(valB)) - priorityWeight(String(valA));
    }

    // Default string/date comparison
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

  const handleBatchClose = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to close ${selectedIds.length} selected tickets?`)) return;
    
    setIsBulkClosing(true);
    try {
      const response = await fetch('/api/tickets/batch_update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_ids: selectedIds,
          action: 'CLOSE',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk close tickets');
      }
      
      setSelectedIds([]);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Error closing tickets. Please try again.');
    } finally {
      setIsBulkClosing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 text-white font-['Rajdhani',sans-serif]">
      
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden w-full shrink-0 bg-[#0a1118]/80 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-md cursor-pointer" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
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
          Sovereign Data Grid v2.1
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a1118]/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 min-h-[65px]">
          {selectedIds.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-[#8E9CAA] uppercase tracking-widest">
                  Selected: <span className="text-[#38bdf8] font-bold">{selectedIds.length}</span>
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-xs font-mono uppercase tracking-wider text-white transition-colors cursor-pointer"
                >
                  Deselect
                </button>
              </div>
              <button
                onClick={handleBatchClose}
                disabled={isBulkClosing}
                className="px-4 py-1.5 bg-[#ff4444] hover:bg-[#ff2222] border border-[#ff4444]/50 rounded text-xs font-mono uppercase tracking-wider text-white transition-all shadow-[0_0_10px_rgba(255,68,68,0.2)] hover:shadow-[0_0_15px_rgba(255,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isBulkClosing ? 'Closing...' : 'Close Selected'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs font-mono text-[#8E9CAA] uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
                 Active Worklist
              </div>
              <div className="text-xs font-mono text-[#8E9CAA] uppercase tracking-widest flex items-center gap-2">
                 Showing {tasks.length} tickets
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-[40px_110px_1fr_110px_70px_190px_110px_110px_80px] gap-3 px-4 py-2 border-b border-white/10 bg-black/60 text-xs font-mono text-[#8E9CAA] uppercase tracking-widest font-bold select-none">
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
              <div className="cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('updated_at')}>
                Updated {renderSortIndicator('updated_at')}
              </div>
              <div className="text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
              {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4 mt-8">
                  <ShieldAlert className="w-12 h-12 opacity-50" />
                  <div className="font-mono uppercase tracking-widest">No tickets match current filters</div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {sortedTasks.map(task => (
                    <React.Fragment key={task.id}>
                      {/* Desktop View */}
                      <div className="hidden lg:grid grid-cols-[40px_110px_1fr_110px_70px_190px_110px_110px_80px] gap-3 px-4 py-3 items-center even:bg-[#ffffff03] hover:bg-[#38bdf8]/10 transition-colors group">
                        <div className="flex items-center justify-center">
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
                            className="rounded border-white/20 bg-black text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                        </div>
                        <button onClick={() => onEditTask(task)} className="font-mono text-[#38bdf8] font-bold text-sm hover:underline text-left cursor-pointer">{task.id}</button>
                        <div className="font-bold text-base truncate pr-2">{task.title}</div>
                        <div>
                          <span className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 min-w-0">
                          {task.assigned_to !== 'UNASSIGNED' && task.assigned_to && (
                            <div className="font-mono text-[10px] text-[#E0BC68] uppercase tracking-widest truncate">👤 {task.assigned_to}</div>
                          )}
                          {task.affected_ci && (
                            <div className="font-mono text-[10px] text-[#34d399] uppercase tracking-widest truncate bg-[#34d399]/10 px-1 py-0.5 rounded inline-block w-fit">⚡ {task.affected_ci}</div>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-[#8E9CAA] uppercase">{formatDate(task.created_at)}</div>
                        <div className="font-mono text-[10px] text-[#8E9CAA] uppercase">{formatDate(task.updated_at)}</div>
                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditTask(task)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#38bdf8]" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => onEditTask(task)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#34d399]" title="Edit Ticket">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile View */}
                      <div className="flex flex-col lg:hidden gap-3 px-4 py-4 hover:bg-white/5 transition-colors group">
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
                              <button onClick={() => onEditTask(task)} className="font-mono text-[#38bdf8] font-bold text-sm hover:underline text-left cursor-pointer">{task.id}</button>
                              <div className="font-bold text-base leading-tight text-white/90">{task.title}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => onEditTask(task)} className="p-2 hover:bg-white/10 rounded transition-colors text-white hover:text-[#38bdf8]" title="View Details">
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
                        </div>
                        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                           <span className="font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest">
                             Created: {formatDate(task.created_at)}
                           </span>
                           <span className="font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest">
                             Updated: {formatDate(task.updated_at)}
                           </span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
