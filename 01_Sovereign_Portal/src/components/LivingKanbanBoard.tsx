import React, { useState, useEffect } from 'react';
import { KanbanSquare, Clock, ArrowRightCircle, CheckCircle2, ShieldAlert, Film, LayoutGrid, List, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditTicketModal from './EditTicketModal';
import SovereignTicketListView from './SovereignTicketListView';

export type TaskStatus = 'Planning' | 'Open' | 'Work In Progress' | 'Resolved' | 'Closed';

export interface AgentTask {
  id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string;
  affected_ci: string;
  priority: string;
  description: string;
  work_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function LivingKanbanBoard({ onNewTicket, onClose }: { onNewTicket?: () => void, onClose?: () => void }) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editingTicket, setEditingTicket] = useState<AgentTask | null>(null);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [assignees, setAssignees] = useState<string[]>([
    'UNASSIGNED', 'james', 'antigravity', 'Gwen', 'Cosmos',
    'ADVISORY_ENTITY', 'HOUSE_OF_GLASS', 'HOUSE_OF_LAW', 'HOUSE_OF_METAL', 'MANDO_WATCHDOG'
  ]);

  // Lifted Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Drag over state
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Inline menu dropdowns
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'status' | 'priority' | 'assignee' | null>(null);
  const [editingTitleTaskId, setEditingTitleTaskId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');

  // Quick Note inline entry states
  const [quickNoteTaskId, setQuickNoteTaskId] = useState<string | null>(null);
  const [quickNoteValue, setQuickNoteValue] = useState<string>('');

  const handleSaveQuickNote = (taskId: string) => {
    if (!quickNoteValue.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const formattedNote = task.work_notes 
      ? `${task.work_notes}\n[Agent Journal - ${timestamp} - james]\n${quickNoteValue}`
      : `[Agent Journal - ${timestamp} - james]\n${quickNoteValue}`;

    handleUpdateField(taskId, { work_notes: formattedNote });
    setQuickNoteTaskId(null);
    setQuickNoteValue('');
  };

  // Hover Popover details
  const [hoveredTask, setHoveredTask] = useState<AgentTask | null>(null);
  const [hoveredTaskPos, setHoveredTaskPos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = React.useRef<any>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tickets`);
      const data = await res.json();
      
      const mappedTasks = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status === 'CLOSED' ? 'Closed' : t.status === 'DONE' ? 'Resolved' : t.status === 'IN_PROGRESS' ? 'Work In Progress' : t.status === 'PLANNING' ? 'Planning' : 'Open',
        assigned_to: t.assigned_to || 'UNASSIGNED',
        affected_ci: t.affected_ci || '',
        priority: t.priority,
        description: t.description || '',
        work_notes: t.work_notes || '',
        created_at: t.created_at,
        updated_at: t.updated_at
      }));

      setTasks(mappedTasks);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load Kanban tasks", err);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch('/api/tickets/assignees');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = ['UNASSIGNED', ...data.filter(a => a !== 'UNASSIGNED')];
          setAssignees(list);
        }
      }
    } catch (err) {
      console.error("Failed to load assignees", err);
    }
  };

  useEffect(() => {
    fetchAssignees();
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pre-filter tasks based on lifted states
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.affected_ci.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...fields } : t));

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
      fetchTasks();
    } catch (e) {
      console.error("Failed to mutate ticket fields inline", e);
      fetchTasks();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, task: AgentTask) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = rect.right + 12 + window.scrollX;
    const posY = rect.top + window.scrollY;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTaskPos({
        x: posX,
        y: posY
      });
      setHoveredTask(task);
    }, 1500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredTask(null);
  };

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode; color: string }[] = [
    { title: "PLANNING", status: "Planning", icon: <Clock className="w-5 h-5" />, color: "border-[#f59e0b] text-[#f59e0b]" },
    { title: "OPEN", status: "Open", icon: <Clock className="w-5 h-5" />, color: "border-[#8E9CAA] text-[#8E9CAA]" },
    { title: "WORK IN PROGRESS", status: "Work In Progress", icon: <ArrowRightCircle className="w-5 h-5 animate-pulse" />, color: "border-[#38bdf8] text-[#38bdf8]" },
    { title: "RESOLVED", status: "Resolved", icon: <CheckCircle2 className="w-5 h-5" />, color: "border-[#34d399] text-[#34d399]" }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'border-red-500 text-red-400 bg-red-950/20';
      case 'P2': return 'border-orange-500 text-orange-400 bg-orange-950/20';
      case 'P3': return 'border-yellow-500 text-yellow-400 bg-yellow-950/20';
      default: return 'border-cyan-500 text-cyan-400 bg-cyan-950/20';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col items-center bg-[#00040a] text-white font-['Rajdhani',sans-serif] overflow-hidden relative">
      {/* Dropdown Backdrop to dismiss menus on outside click */}
      {activeMenuTaskId && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setActiveMenuTaskId(null); setActiveMenuType(null); }} />
      )}

      <div className="w-full max-w-[1600px] flex-grow flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b-2 border-white/10 gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-14 h-14 bg-[#38bdf8]/10 rounded border-2 border-[#38bdf8]/50 flex items-center justify-center shrink-0">
               <KanbanSquare className="w-6 h-6 md:w-8 md:h-8 text-[#38bdf8]" />
            </div>
            <div>
               <div className="text-xs md:text-sm font-bold text-white mb-1 uppercase tracking-[0.2em]">
                 Sovereign OS <span className="text-white/50">/ SDLC TICKETING</span>
               </div>
               <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#38bdf8] drop-shadow-md">
                 Ticket Overview <span className="text-white/30 hidden sm:inline-block">| Sovereign Mesh</span>
               </h1>
               <p className="text-xs md:text-sm font-mono text-[#8E9CAA] uppercase tracking-widest mt-1">
                 Autonomous Agent Task Telemetry
               </p>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto mt-4 md:mt-0">
              <div className="flex flex-wrap items-center gap-2 mb-3 bg-black/40 p-1 rounded-lg border border-white/10">
                 {onNewTicket && (
                   <button onClick={onNewTicket} className="flex-1 md:flex-none px-4 py-2 bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 rounded font-bold uppercase tracking-widest text-[10px] md:text-xs hover:bg-[#38bdf8] hover:text-black transition-colors whitespace-nowrap">New Ticket</button>
                 )}
                 {onClose && (
                   <button onClick={onClose} className="flex-1 md:flex-none px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded font-bold uppercase tracking-widest text-[10px] md:text-xs hover:bg-red-500 hover:text-white transition-colors md:mr-2 whitespace-nowrap">Close</button>
                 )}
                 <button onClick={() => setViewMode('KANBAN')} className={`flex-1 md:flex-none px-4 py-2 rounded flex justify-center items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${viewMode === 'KANBAN' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14} /> Kanban</button>
                 <button onClick={() => setViewMode('LIST')} className={`flex-1 md:flex-none px-4 py-2 rounded flex justify-center items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${viewMode === 'LIST' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50' : 'text-white/50 hover:text-white'}`}><List size={14} /> List View</button>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-[#8E9CAA] uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
                      Live Sync Active
                  </div>
                  <div className="text-sm md:text-xl font-bold tracking-widest">{lastUpdated || 'SYNCING...'}</div>
              </div>
          </div>
        </div>

        {/* Unified Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 bg-[#0a1118]/80 border border-white/10 p-4 rounded-xl gap-4 backdrop-blur-md shrink-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#38bdf8] w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search tickets, IDs, descriptions..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-[#38bdf8]/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#38bdf8] transition-colors font-mono text-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[#8E9CAA] uppercase tracking-widest self-end md:self-auto">
             <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
             Showing {filteredTasks.length} of {tasks.length} tickets
          </div>
        </div>

        {/* Board or List View */}
        {viewMode === 'KANBAN' ? (
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0 overflow-hidden pb-4">
            {columns.map(col => {
               const colTasks = filteredTasks.filter(t => t.status === col.status);
               const isDraggingOver = dragOverCol === col.status;
               return (
                 <div 
                   key={col.status} 
                   onDragOver={(e) => { e.preventDefault(); }}
                   onDragEnter={() => setDragOverCol(col.status)}
                   onDragLeave={() => setDragOverCol(null)}
                   onDrop={(e) => {
                     setDragOverCol(null);
                     const taskId = e.dataTransfer.getData('text/plain');
                     handleUpdateField(taskId, { status: col.status });
                   }}
                   className={`flex flex-col h-full backdrop-blur-md bg-slate-950/60 border-t-4 border border-slate-800/80 p-4 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${isDraggingOver ? 'border-[#38bdf8] scale-[1.02] shadow-[0_0_20px_rgba(56,189,248,0.2)]' : ''}`}
                   style={{ borderTopColor: col.status === 'Work In Progress' ? '#38bdf8' : col.status === 'Resolved' ? '#34d399' : col.status === 'Planning' ? '#f59e0b' : '#8E9CAA' }}
                 >
                    <div className={`px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/40`}>
                       <h2 className={`text-md font-bold tracking-widest uppercase flex items-center gap-2 ${col.color}`}>
                         {col.icon} {col.title}
                       </h2>
                       <span className="bg-white/10 text-white px-2 py-0.5 rounded font-mono text-xs font-bold">
                         {colTasks.length}
                       </span>
                    </div>
                    
                    <div className="flex-grow p-4 overflow-y-auto space-y-3 min-h-0">
                       <AnimatePresence>
                          {colTasks.map(task => {
                            const isMenuOpen = activeMenuTaskId === task.id;
                            const isTitleEditing = editingTitleTaskId === task.id;

                            return (
                              <motion.div 
                                 key={task.id}
                                 layout
                                 layoutId={`card-${task.id}`}
                                 initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                 animate={{ 
                                   opacity: 1, 
                                   y: 0, 
                                   scale: 1,
                                   boxShadow: task.status === 'Work In Progress' ? '0 0 15px rgba(56,189,248,0.25)' : 
                                              task.status === 'Resolved' ? '0 0 15px rgba(52,211,153,0.25)' : 
                                              task.status === 'Planning' ? '0 0 15px rgba(245,158,11,0.25)' : 'none'
                                 }}
                                 exit={{ opacity: 0, scale: 0.9 }}
                                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                 draggable={!isTitleEditing}
                                 onDragStart={(e: any) => {
                                   e.dataTransfer.setData('text/plain', task.id);
                                 }}
                                 onClick={() => {
                                   if (!isTitleEditing) setEditingTicket(task);
                                 }}
                                 className={`cursor-pointer hover:bg-slate-900/40 hover:border-slate-700/80 transition-colors p-4 rounded-xl border-l-4 bg-[#11202b]/40 border border-slate-800/80 shadow-md flex flex-col gap-2 relative group backdrop-blur-sm
                                    ${task.status === 'Work In Progress' ? 'border-l-[#38bdf8]' : 
                                      task.status === 'Resolved' ? 'border-l-[#34d399]' : task.status === 'Closed' ? 'border-l-slate-500 opacity-60' : task.status === 'Planning' ? 'border-l-[#f59e0b]' : 'border-l-[#8E9CAA]'}
                                 `}
                              >
                                 <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      {isTitleEditing ? (
                                        <input
                                          autoFocus
                                          type="text"
                                          className="w-full bg-transparent border-0 border-b border-[#38bdf8]/50 focus:border-[#38bdf8] focus:ring-0 px-0 py-0.5 text-white font-bold font-sans text-sm focus:outline-none break-words"
                                          value={editingTitleValue}
                                          onChange={(e) => setEditingTitleValue(e.target.value)}
                                          onBlur={() => handleUpdateField(task.id, { title: editingTitleValue }).then(() => setEditingTitleTaskId(null))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleUpdateField(task.id, { title: editingTitleValue }).then(() => setEditingTitleTaskId(null));
                                            }
                                            if (e.key === 'Escape') setEditingTitleTaskId(null);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <h3 
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTitleTaskId(task.id);
                                            setEditingTitleValue(task.title);
                                          }}
                                          onMouseEnter={(e) => handleMouseEnter(e, task)}
                                          onMouseLeave={handleMouseLeave}
                                          className="text-sm font-bold leading-tight break-words flex-1 flex items-start gap-2 text-white/90 hover:text-white"
                                        >
                                          {task.title.startsWith('[MEDIA REQUEST]') ? (
                                            <>
                                              <Film className="w-4 h-4 text-[#d4a3a3] shrink-0 mt-0.5" />
                                              <span className="text-[#d4a3a3] drop-shadow-[0_0_8px_rgba(212,163,163,0.5)]">{task.title.replace('[MEDIA REQUEST]', '').trim()}</span>
                                            </>
                                          ) : (
                                            task.title
                                          )}
                                        </h3>
                                      )}
                                    </div>
                                    <span 
                                      onMouseEnter={(e) => handleMouseEnter(e, task)}
                                      onMouseLeave={handleMouseLeave}
                                      className="font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest bg-black/50 px-1.5 py-0.5 rounded shrink-0 cursor-help"
                                    >
                                      {task.id}
                                    </span>
                                 </div>
                                 
                                 {/* Interactive Badges Wrapper */}
                                 <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <div className="flex flex-wrap items-center gap-1.5 z-20">
                                      {/* State Chip */}
                                      <div className="relative">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuTaskId(isMenuOpen && activeMenuType === 'status' ? null : task.id);
                                            setActiveMenuType('status');
                                          }}
                                          className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border border-white/10 hover:border-[#38bdf8] bg-black/40 text-[#38bdf8] flex items-center gap-1 cursor-pointer transition-colors"
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

                                      {/* Priority Chip */}
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuTaskId(isMenuOpen && activeMenuType === 'priority' ? null : task.id);
                                            setActiveMenuType('priority');
                                          }}
                                          className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border flex items-center gap-1 cursor-pointer transition-colors ${getPriorityColor(task.priority)} hover:border-white/40`}
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

                                      {/* Assignee Chip */}
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuTaskId(isMenuOpen && activeMenuType === 'assignee' ? null : task.id);
                                            setActiveMenuType('assignee');
                                          }}
                                          className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:border-amber-400/40 flex items-center gap-1 cursor-pointer transition-colors"
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
                                              className="absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden font-mono text-[10px]"
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

                                      {/* Quick Note Trigger */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setQuickNoteTaskId(quickNoteTaskId === task.id ? null : task.id);
                                          setQuickNoteValue('');
                                        }}
                                        className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border border-white/10 hover:border-amber-400 hover:text-amber-400 bg-black/40 text-white/60 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Add quick journal note"
                                      >
                                        📝 Note
                                      </button>
                                    </div>
                                 </div>

                                 {/* Quick Note Input */}
                                 <AnimatePresence>
                                   {quickNoteTaskId === task.id && (
                                     <motion.div 
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       exit={{ opacity: 0, height: 0 }}
                                       className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1.5 overflow-hidden" 
                                       onClick={e => e.stopPropagation()}
                                     >
                                       <textarea
                                         autoFocus
                                         className="w-full bg-black/60 border border-amber-500/50 rounded p-1.5 text-[10px] text-white font-mono focus:outline-none focus:border-amber-500 h-16 resize-none break-all break-words"
                                         placeholder="Add quick work note..."
                                         value={quickNoteValue}
                                         onChange={e => setQuickNoteValue(e.target.value)}
                                         onKeyDown={e => {
                                           if (e.key === 'Enter' && !e.shiftKey) {
                                             e.preventDefault();
                                             handleSaveQuickNote(task.id);
                                           }
                                           if (e.key === 'Escape') setQuickNoteTaskId(null);
                                         }}
                                       />
                                       <div className="flex justify-end gap-1">
                                         <button 
                                           onClick={() => handleSaveQuickNote(task.id)}
                                           className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] uppercase font-bold"
                                         >
                                           Save
                                         </button>
                                         <button 
                                           onClick={() => setQuickNoteTaskId(null)}
                                           className="px-2 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded text-[9px] uppercase font-bold"
                                         >
                                           Cancel
                                         </button>
                                       </div>
                                     </motion.div>
                                   )}
                                 </AnimatePresence>
                              </motion.div>
                            );
                          })}
                       </AnimatePresence>
                       
                       {colTasks.length === 0 && (
                          <div className="h-full min-h-[100px] flex items-center justify-center text-[#8E9CAA]/30 font-mono uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-lg bg-black/20">
                             No Active Tickets
                          </div>
                       )}
                    </div>
                 </div>
               );
            })}
          </div>
        ) : (
          <SovereignTicketListView 
            tasks={filteredTasks} 
            onEditTask={setEditingTicket}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            isFiltersOpen={isFiltersOpen}
            setIsFiltersOpen={setIsFiltersOpen}
            onRefresh={fetchTasks}
            assignees={assignees}
          />
        )}

        <EditTicketModal 
          isOpen={!!editingTicket} 
          onClose={() => setEditingTicket(null)} 
          ticket={editingTicket}
          onSave={() => fetchTasks()}
          assignees={assignees}
        />
      </div>

      {/* Floating Translucent Detail Popover */}
      <AnimatePresence>
        {hoveredTask && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] pointer-events-none w-80 bg-slate-950/90 backdrop-blur-md border border-[#38bdf8]/30 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),_0_0_15px_rgba(56,189,248,0.15)] text-xs font-mono"
            style={{ 
              top: `${Math.min(hoveredTaskPos.y, window.innerHeight - 250)}px`, 
              left: `${Math.min(hoveredTaskPos.x, window.innerWidth - 340)}px` 
            }}
          >
            <div className="text-[#38bdf8] font-bold border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
              <span>{hoveredTask.id}</span>
              <span className="text-[10px] text-white/50">{hoveredTask.priority}</span>
            </div>
            <div className="mb-3">
              <div className="text-white/40 uppercase text-[9px] mb-1 font-mono">Description</div>
              <p className="text-white/90 font-sans leading-relaxed break-all break-words line-clamp-4 select-text">{hoveredTask.description || "No description provided."}</p>
            </div>
            {hoveredTask.work_notes && (
              <div>
                <div className="text-[#f2a900]/60 uppercase text-[9px] mb-1 font-mono">Latest Journal Entry</div>
                <p className="text-white/70 font-mono leading-normal break-all break-words line-clamp-3 bg-black/35 p-1.5 rounded border border-white/5 select-text">
                  {hoveredTask.work_notes.split(/(?=\[Agent Journal)/).pop()?.trim() || "No journal entry."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
