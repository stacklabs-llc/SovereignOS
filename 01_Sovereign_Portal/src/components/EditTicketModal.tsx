import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Send, X, Edit, User, AlignLeft, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ticket {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  affected_ci: string;
  priority: string;
  description: string;
  work_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CmdbCi {
  sys_id: string;
  name: string;
  sys_class_name: string;
}

interface Attachment {
  sys_id: string;
  file_name: string;
  file_path: string;
}

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onSave: () => void;
}

export default function EditTicketModal({ isOpen, onClose, ticket, onSave }: EditTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [newWorkNote, setNewWorkNote] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('P3');
  const [assignee, setAssignee] = useState('');
  const [affectedCi, setAffectedCi] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [agentCis, setAgentCis] = useState<CmdbCi[]>([]);
  const [allCis, setAllCis] = useState<CmdbCi[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setDescription(ticket.description || '');
      setWorkNotes(ticket.work_notes || '');
      setNewWorkNote('');
      setStatus(ticket.status === 'Closed' ? 'CLOSED' : ticket.status === 'Work In Progress' ? 'IN_PROGRESS' : ticket.status === 'Resolved' ? 'DONE' : ticket.status === 'Planning' ? 'PLANNING' : 'OPEN');
      setPriority(ticket.priority || 'P3');
      setAssignee(ticket.assigned_to === 'UNASSIGNED' ? '' : ticket.assigned_to || '');
      setAffectedCi(ticket.affected_ci || '');
      fetchAttachments(ticket.id);
    }
  }, [ticket]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/cmdb_ci?sys_class_name=cmdb_ci_agent_house')
        .then(res => res.json())
        .then(data => {
          // Fallback to hardcoded list to prevent persona leakage and duplicates
          setAgentCis([
            { sys_id: '1', name: 'ADVISORY_ENTITY', sys_class_name: 'cmdb_ci_agent_house' },
            { sys_id: '2', name: 'HOUSE_OF_GLASS', sys_class_name: 'cmdb_ci_agent_house' },
            { sys_id: '3', name: 'HOUSE_OF_LAW', sys_class_name: 'cmdb_ci_agent_house' },
            { sys_id: '4', name: 'HOUSE_OF_METAL', sys_class_name: 'cmdb_ci_agent_house' },
            { sys_id: '5', name: 'MANDO_WATCHDOG', sys_class_name: 'cmdb_ci_agent_house' }
          ]);
        })
        .catch(err => console.error("Failed to load Agent CIs", err));

      fetch('/api/cmdb_ci')
        .then(res => res.json())
        .then(data => setAllCis(data))
        .catch(err => console.error("Failed to load All CIs", err));
    }
  }, [isOpen]);

  const fetchAttachments = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`);
      const data = await res.json();
      setAttachments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !ticket) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setAttachments([...attachments, data]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload attachment");
    }
  };

  const handleDeleteAttachment = async (sysId: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/attachments/${sysId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAttachments(prev => prev.filter(att => att.sys_id !== sysId));
      } else {
        alert("Failed to delete attachment");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete attachment");
    }
  };

  if (!isOpen || !ticket) return null;

  const handleSave = async () => {
    setIsSaving(true);
    let finalWorkNotes = workNotes;
    if (newWorkNote.trim()) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
      finalWorkNotes = finalWorkNotes + (finalWorkNotes ? '\n\n' : '') + `[Agent Journal - ${timestamp}]\n${newWorkNote.trim()}`;
    }

    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          work_notes: finalWorkNotes,
          status,
          priority,
          assigned_to: assignee,
          affected_ci: affectedCi
        }),
      });
      onSave();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save ticket');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return dateStr;
    }
  };

  const getTicketType = () => {
    const id = ticket.id || '';
    if (id.startsWith('STRY')) return 'STORY';
    if (id.startsWith('INC')) return 'INCIDENT';
    if (id.startsWith('DFCT')) return 'DEFECT';
    if (id.startsWith('ENHC')) return 'ENHANCEMENT';
    return 'TICKET';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden relative font-['Rajdhani',sans-serif] flex flex-col max-h-[85vh]"
        >
          {/* Header Gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#8E9CAA]"></div>
          
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/10 flex items-start justify-between bg-black/40 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg border border-[#38bdf8]/50 bg-[#38bdf8]/10 flex items-center justify-center">
                <Edit className="w-6 h-6 text-[#38bdf8]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{ticket.id}</h2>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${priority === 'P1' ? 'border-red-500 text-red-500 bg-red-500/10' : priority === 'P2' ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-[#8E9CAA] text-[#8E9CAA] bg-white/5'}`}>{priority}</span>
                </div>
                <div className="text-sm font-mono text-[#8E9CAA]">rm_story / Sovereign OS</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="text-white/60 hover:text-[#38bdf8] p-2 transition-colors rounded hover:bg-[#38bdf8]/10 flex items-center gap-2 font-bold tracking-widest text-xs">
                <Paperclip size={20} /> ATTACH FILE
              </button>
              
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/10">
                <a 
                  href={`/api/tickets/${ticket.id}/export/md`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/60 hover:text-[#38bdf8] p-1.5 transition-colors rounded hover:bg-white/5 font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1"
                  title="Export Markdown"
                >
                  📝 MD
                </a>
                <a 
                  href={`/api/tickets/${ticket.id}/export/pdf`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/60 hover:text-[#f59e0b] p-1.5 transition-colors rounded hover:bg-white/5 font-mono text-[10px] font-bold tracking-widest uppercase border-l border-white/10 flex items-center gap-1"
                  title="Export PDF"
                >
                  📕 PDF
                </a>
                <a 
                  href={`/api/tickets/${ticket.id}/export/json`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/60 hover:text-[#3b82f6] p-1.5 transition-colors rounded hover:bg-white/5 font-mono text-[10px] font-bold tracking-widest uppercase border-l border-white/10 flex items-center gap-1"
                  title="Export JSON"
                >
                  💻 JSON
                </a>
              </div>
              
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              
              <button onClick={onClose} className="text-white/40 hover:text-white p-2 transition-colors rounded hover:bg-white/5">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* Top Grid */}
            <div className="bg-[#0a1118]/80 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
               <div>
                 <label className="block font-mono text-[10px] text-[#38bdf8] uppercase tracking-widest mb-2">Ticket ID</label>
                 <input type="text" value={ticket.id} disabled className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-white/50 font-mono text-sm" />
                 <div className="mt-2 font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest">
                   Created: {formatDate(ticket.created_at)}<br/>
                   Updated: {formatDate(ticket.updated_at)}
                 </div>
               </div>
               <div>
                 <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">State</label>
                 <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-[#34d399] font-bold text-sm focus:border-[#38bdf8] outline-none">
                   <option value="PLANNING">PLANNING</option>
                   <option value="OPEN">OPEN</option>
                   <option value="IN_PROGRESS">IN PROGRESS</option>
                   <option value="DONE">RESOLVED</option>
                   <option value="CLOSED">CLOSED</option>
                 </select>
               </div>
               <div>
                 <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Priority</label>
                 <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-[#ff4444] font-bold text-sm focus:border-[#38bdf8] outline-none">
                   <option value="P1">P1 - CRITICAL</option>
                   <option value="P2">P2 - HIGH</option>
                   <option value="P3">P3 - MODERATE</option>
                   <option value="P4">P4 - LOW</option>
                 </select>
               </div>
               <div className="md:col-span-3">
                 <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Short Description</label>
                 <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-white font-bold text-lg focus:border-[#38bdf8] outline-none" />
               </div>
               <div className="md:col-span-3">
                 <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Detailed Payload (Description)</label>
                 <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-[100px] bg-black/60 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:border-[#38bdf8] outline-none resize-y" />
               </div>
               <div className="md:col-span-1">
                 <label className="block font-mono text-[10px] text-[#f2a900] uppercase tracking-widest mb-2 flex items-center gap-1"><User size={12}/> Assignee</label>
                 <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-black/60 border border-[#f2a900]/30 rounded-lg p-3 text-white font-bold text-sm focus:border-[#f2a900] outline-none">
                   <option value="">-- Unassigned --</option>
                   {agentCis.map(ci => <option key={ci.sys_id} value={ci.name}>{ci.name}</option>)}
                 </select>
               </div>
               <div className="md:col-span-2">
                 <label className="block font-mono text-[10px] text-[#34d399] uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldAlert size={12}/> Affected Configuration Item (CI)</label>
                 <select value={affectedCi} onChange={(e) => setAffectedCi(e.target.value)} className="w-full bg-black/60 border border-[#34d399]/30 rounded-lg p-3 text-white font-bold text-sm focus:border-[#34d399] outline-none">
                   <option value="">-- None --</option>
                   {allCis.map(ci => <option key={ci.sys_id} value={ci.name}>{ci.name} ({ci.sys_class_name})</option>)}
                 </select>
               </div>
            </div>

            {/* Work Notes */}
            <div className="bg-[#0a1118]/80 border border-[#38bdf8]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(56,189,248,0.1)] flex flex-col">
               <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
                 <User size={18} className="text-[#38bdf8]" /> Work Notes / Journal
               </h3>
               
               <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 relative">
                 <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10 z-0"></div>
                 {workNotes ? workNotes.split(/(?=\[Agent Journal)/).filter(n => n.trim()).map((note, i) => (
                   <div key={i} className="flex gap-4 relative z-10">
                     <div className="w-8 h-8 rounded-full bg-[#11202b] border-2 border-[#38bdf8] flex items-center justify-center shrink-0 mt-1">
                        <User size={14} className="text-[#38bdf8]" />
                     </div>
                     <div className="bg-black/60 border border-white/10 rounded-lg p-4 flex-1 shadow-md">
                        <div className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">{note.trim()}</div>
                     </div>
                   </div>
                 )) : (
                   <div className="text-white/30 text-sm font-mono italic pl-12 relative z-10">No journal entries yet.</div>
                 )}
               </div>

               <div className="mt-auto border-t border-white/10 pt-4">
                 <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Add New Work Note</label>
                 <textarea 
                   value={newWorkNote}
                   onChange={e => setNewWorkNote(e.target.value)}
                   placeholder="Type your update here... It will be appended to the journal upon save."
                   className="w-full bg-black/80 border border-[#38bdf8]/50 rounded-lg p-3 text-[#38bdf8] font-mono text-sm focus:border-[#38bdf8] outline-none min-h-[80px]"
                 />
               </div>
            </div>
            
            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="bg-[#0a1118]/80 border border-white/10 rounded-xl p-5 shadow-lg">
                <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-3">Attachments ({attachments.length})</label>
                <div className="flex flex-wrap gap-3">
                  {attachments.map(att => {
                    const isImage = att.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <a key={att.sys_id} href={att.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded hover:border-[#38bdf8] transition-colors max-w-[250px] relative group">
                        {isImage ? (
                          <div className="w-10 h-10 rounded overflow-hidden bg-black shrink-0 border border-white/10">
                            <img src={att.file_path} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                        )}
                        <div className="truncate text-xs font-mono text-white/80">{att.file_name}</div>
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDeleteAttachment(att.sys_id); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 bg-black/40 border-t border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest">
               <AlertTriangle size={12} className="text-[#f59e0b]" /> Live Database Mutation
            </div>
            <div className="flex gap-3">
               <button onClick={onClose} className="px-6 py-2.5 border border-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                 Cancel
               </button>
               <button disabled={isSaving} onClick={handleSave} className="px-8 py-2.5 rounded-lg text-sm font-bold text-black bg-[#38bdf8] hover:bg-[#0ea5e9] disabled:opacity-50 transition-colors uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                 <Send size={16} /> {isSaving ? 'UPDATING DB...' : `UPDATE ${getTicketType()}`}
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
