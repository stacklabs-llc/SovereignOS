import React, { useState, useRef } from 'react';
import { ShieldAlert, Send, X, Terminal, Bug, Zap, BookOpen, Paperclip, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
  const [ticketType, setTicketType] = useState<'Incident' | 'Enhancement' | 'Defect' | 'Story'>('Story');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [assignee, setAssignee] = useState('');
  const [affectedCi, setAffectedCi] = useState('');
  const [allCis, setAllCis] = useState<any[]>([]);
  const [agentCis, setAgentCis] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchCis = async () => {
      try {
        const ciRes = await fetch('/api/cmdb_ci');
        const ciData = await ciRes.json();
        setAllCis(ciData);

        const agentRes = await fetch('/api/cmdb_ci?sys_class_name=cmdb_ci_agent_house');
        const agentData = await agentRes.json();
        // Fallback to hardcoded list to prevent persona leakage and duplicates
        setAgentCis([
          { sys_id: '1', name: 'ADVISORY_ENTITY' },
          { sys_id: '2', name: 'HOUSE_OF_GLASS' },
          { sys_id: '3', name: 'HOUSE_OF_LAW' },
          { sys_id: '4', name: 'HOUSE_OF_METAL' },
          { sys_id: '5', name: 'MANDO_WATCHDOG' }
        ]);
      } catch (err) {
        console.error("Failed to load CIs", err);
      }
    };
    fetchCis();
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setTicketType('Story');
      setTitle('');
      setDescription('');
      setWorkNotes('');
      setAssignee('');
      setAffectedCi('');
      setFiles([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title) return alert("Short Description is required.");
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          work_notes: workNotes,
          ticket_type: ticketType,
          priority: 'P3',
          status: 'OPEN',
          assigned_to: assignee,
          affected_ci: affectedCi
        })
      });
      const data = await res.json();
      
      if (data.id && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await fetch(`/api/tickets/${data.id}/attachments`, {
            method: 'POST',
            body: formData
          });
        }
      }
      
      alert(`Ticket Successfully Dispatched!\nTicket ID: ${data.id}\nType: ${ticketType}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const pastedFiles = Array.from(e.clipboardData.files);
      setFiles(prev => [...prev, ...pastedFiles]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden"
        onPaste={handlePaste}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden relative font-['Rajdhani',sans-serif] flex flex-col h-full sm:h-auto max-h-[95vh]"
        >
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#8E9CAA]"></div>
          
          <div className="p-6 border-b border-white/10 flex items-start justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg border border-[#38bdf8]/50 bg-[#38bdf8]/10 flex items-center justify-center ">
                <Terminal className="w-6 h-6 text-[#38bdf8]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">New Sovereign Ticket</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></span>
                  <span className="font-mono text-[10px] text-[#8E9CAA] uppercase tracking-widest">Agent Orchestration Ready</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-2 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
            
            {/* Ticket Type Selector */}
            <div>
              <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-3">Ticket Classification</label>
              <div className="grid grid-cols-4 gap-3">
                <button 
                  onClick={() => setTicketType('Incident')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm tracking-wider uppercase transition-all
                    ${ticketType === 'Incident' ? 'bg-[#ff4444]/20 border-[#ff4444] text-[#ff4444] ' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  <ShieldAlert size={16} /> Incident
                </button>
                <button 
                  onClick={() => setTicketType('Enhancement')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm tracking-wider uppercase transition-all
                    ${ticketType === 'Enhancement' ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] ' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  <Zap size={16} /> Enhancement
                </button>
                <button 
                  onClick={() => setTicketType('Defect')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm tracking-wider uppercase transition-all
                    ${ticketType === 'Defect' ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b] ' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  <Bug size={16} /> Defect
                </button>
                <button 
                  onClick={() => setTicketType('Story')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm tracking-wider uppercase transition-all
                    ${ticketType === 'Story' ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#a855f7] ' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  <BookOpen size={16} /> Story
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Short Description</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue or request..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Detailed Payload</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed context for the autonomous agent..."
                rows={5}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-[#f2a900] uppercase tracking-widest mb-2 flex items-center gap-1"><User size={12}/> Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-black/60 border border-[#f2a900]/30 rounded-lg p-3 text-white font-bold text-sm focus:border-[#f2a900] outline-none">
                  <option value="">-- Unassigned --</option>
                  {agentCis.map(ci => <option key={ci.sys_id} value={ci.name}>{ci.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-mono text-[10px] text-[#34d399] uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldAlert size={12}/> Affected Configuration Item (CI)</label>
                <select value={affectedCi} onChange={(e) => setAffectedCi(e.target.value)} className="w-full bg-black/60 border border-[#34d399]/30 rounded-lg p-3 text-white font-bold text-sm focus:border-[#34d399] outline-none">
                  <option value="">-- None --</option>
                  {allCis.map(ci => <option key={ci.sys_id} value={ci.name}>{ci.name} ({ci.sys_class_name})</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2">Work Notes / Journal</label>
              <textarea 
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="Add any journal entries, investigation notes, or work logs here..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
              />
            </div>

            {/* File Attachment */}
            <div>
              <input 
                type="file" 
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
              />
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full sm:w-auto self-start"
                >
                  <Paperclip size={16} /> {files.length > 0 ? 'Change Attachments' : 'Attach Files'}
                </button>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-[#38bdf8] truncate max-w-[200px] border border-white/10">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end gap-3">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg text-sm font-bold text-black bg-[#38bdf8] hover:bg-[#0ea5e9] disabled:opacity-50 transition-colors uppercase tracking-wider flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
              {isSubmitting ? 'Dispatching...' : 'Dispatch to Sovereign AI'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
