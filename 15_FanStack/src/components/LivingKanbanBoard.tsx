import React, { useState, useEffect } from 'react';
import { KanbanSquare, Clock, ArrowRightCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditTicketModal from './EditTicketModal';
import SovereignTicketListView from './SovereignTicketListView';
import { LayoutGrid, List } from 'lucide-react';

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

export default function LivingKanbanBoard() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editingTicket, setEditingTicket] = useState<AgentTask | null>(null);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');

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

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode; color: string }[] = [
    { title: "PLANNING", status: "Planning", icon: <Clock className="w-5 h-5" />, color: "border-[#f59e0b] text-[#f59e0b]" },
    { title: "OPEN", status: "Open", icon: <Clock className="w-5 h-5" />, color: "border-[#8E9CAA] text-[#8E9CAA]" },
    { title: "WORK IN PROGRESS", status: "Work In Progress", icon: <ArrowRightCircle className="w-5 h-5 animate-pulse" />, color: "border-[#38bdf8] text-[#38bdf8]" },
    { title: "RESOLVED", status: "Resolved", icon: <CheckCircle2 className="w-5 h-5" />, color: "border-[#34d399] text-[#34d399]" },
    { title: "CLOSED", status: "Closed", icon: <CheckCircle2 className="w-5 h-5 opacity-50" />, color: "border-slate-500 text-slate-500" }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#00040a] text-white font-['Rajdhani',sans-serif] overflow-hidden relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 pb-4 border-b-2 border-white/10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-14 h-14 bg-[#38bdf8]/10 rounded border-2 border-[#38bdf8]/50 flex items-center justify-center shrink-0">
             <KanbanSquare className="w-6 h-6 md:w-8 md:h-8 text-[#38bdf8]" />
          </div>
          <div>
             <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#38bdf8] drop-shadow-md">
               Ticket Overview <span className="text-white/30 hidden sm:inline-block">| Sovereign Mesh</span>
             </h1>
             <p className="text-xs md:text-sm font-mono text-[#8E9CAA] uppercase tracking-widest mt-1">
               Autonomous Agent Task Telemetry
             </p>
          </div>
        </div>
        <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end">
            <div className="flex items-center gap-2 mb-3 bg-black/40 p-1 rounded-lg border border-white/10">
               <button onClick={() => setViewMode('KANBAN')} className={`px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'KANBAN' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14} /> Kanban</button>
               <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'LIST' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50' : 'text-white/50 hover:text-white'}`}><List size={14} /> List View</button>
            </div>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-[#8E9CAA] uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
                Live Sync Active
            </div>
            <div className="text-xl font-bold tracking-widest mt-1">{lastUpdated || 'SYNCING...'}</div>
        </div>
      </div>

      {/* Board or List View */}
      {viewMode === 'KANBAN' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-8 h-full overflow-y-auto lg:overflow-hidden pb-4">
          {columns.map(col => {
             const colTasks = tasks.filter(t => t.status === col.status);
             return (
               <div key={col.status} className="flex flex-col h-full bg-[#0a1118]/80 border-t-4 border-white/5 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm" style={{ borderTopColor: col.status === 'Work In Progress' ? '#38bdf8' : col.status === 'Resolved' ? '#34d399' : col.status === 'Planning' ? '#f59e0b' : '#8E9CAA' }}>
                  <div className={`px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-white/5 bg-black/40`}>
                     <h2 className={`text-lg md:text-2xl font-bold tracking-widest uppercase flex items-center gap-2 md:gap-3 ${col.color}`}>
                       {col.icon} {col.title}
                     </h2>
                     <span className="bg-white/10 text-white px-2 md:px-3 py-1 rounded font-mono text-xs md:text-sm font-bold">
                       {colTasks.length}
                     </span>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                     <AnimatePresence>
                        {colTasks.map(task => (
                          <motion.div 
                             key={task.id}
                             initial={{ opacity: 0, y: 20, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.9 }}
                             transition={{ duration: 0.3 }}
                             onClick={() => setEditingTicket(task)}
                             className={`cursor-pointer hover:bg-[#1a2e3d] transition-colors p-5 rounded-lg border-l-4 bg-[#11202b] shadow-lg flex flex-col gap-3
                                ${task.status === 'Work In Progress' ? 'border-[#38bdf8] ' : 
                                  task.status === 'Resolved' ? 'border-[#34d399]' : task.status === 'Closed' ? 'border-slate-500 opacity-50' : task.status === 'Planning' ? 'border-[#f59e0b]' : 'border-[#8E9CAA] opacity-70'}
                             `}
                          >
                             <div className="flex justify-between items-start gap-2">
                                <h3 className="text-base md:text-xl font-bold leading-tight break-words flex-1">{task.title}</h3>
                                <span className="font-mono text-[10px] md:text-xs text-[#8E9CAA] uppercase tracking-widest bg-black/50 px-2 py-1 rounded shrink-0">{task.id}</span>
                             </div>
                             
                             <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                  {task.assigned_to !== 'UNASSIGNED' && (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-[#f2a900]/20 border border-[#f2a900]/50 flex items-center justify-center">
                                         <ShieldAlert className="w-3 h-3 text-[#f2a900]" />
                                      </div>
                                      <span className="font-mono text-xs text-[#E0BC68] font-bold tracking-widest uppercase truncate max-w-[100px]">
                                         {task.assigned_to}
                                      </span>
                                    </div>
                                  )}
                                  {task.affected_ci && (
                                    <span className="font-mono text-[10px] text-[#34d399] font-bold tracking-widest uppercase bg-[#34d399]/10 px-2 py-1 rounded truncate max-w-[100px]">
                                       {task.affected_ci}
                                    </span>
                                  )}
                                </div>
                             </div>
                          </motion.div>
                        ))}
                     </AnimatePresence>
                     
                     {colTasks.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[#8E9CAA]/50 font-mono uppercase tracking-widest text-sm border-2 border-dashed border-white/5 rounded-lg">
                           No Active Tickets
                        </div>
                     )}
                  </div>
               </div>
             );
          })}
        </div>
      ) : (
        <SovereignTicketListView tasks={tasks} onEditTask={setEditingTicket} onRefresh={fetchTasks} />
      )}

      <EditTicketModal 
        isOpen={!!editingTicket} 
        onClose={() => setEditingTicket(null)} 
        ticket={editingTicket}
        onSave={() => fetchTasks()}
      />
      
    </div>
  );
}
