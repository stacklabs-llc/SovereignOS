import React, { useState, useEffect } from 'react';
import { Mail, CheckSquare, Trash2, ShieldCheck, MailOpen, RefreshCw } from 'lucide-react';

interface PromoEmail {
  id: string;
  sender?: string;
  source?: string;
  subject?: string;
  headline?: string;
  body?: string;
  details?: string;
  raw_text?: string;
  date?: string;
}

export default function PromoInbox() {
  const [emails, setEmails] = useState<PromoEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadEmails = () => {
    fetch('/api/promos')
      .then(res => res.json())
      .then(data => setEmails(data))
      .catch(err => {
         console.warn("API promos failed, loading fallback empty inbox", err);
         setEmails([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleFetchMailbag = async () => {
    setFetching(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/skew-cmdb/mailbag/sweep', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setFeedback(`Successfully swept ${data.promos_staged || 0} promos!`);
      loadEmails();
    } catch (err) {
      console.error(err);
      setFeedback("Failed to sweep mailbag. Make sure the API is running.");
    } finally {
      setFetching(false);
    }
  };

  const handleAction = async (id: string, action: 'keep' | 'trash') => {
    setEmails(prev => prev.filter(e => e.id !== id));
    try {
      await fetch(`/api/promos/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'keep' ? 'inject_global' : 'trash' })
      });
    } catch (err) {
      console.error("Failed to perform promo action:", err);
    }
  };


  return (
    <div className="min-h-screen bg-[#0f1115] text-[#cbd5e1] font-mono p-4 md:p-8 selection:bg-[#38bdf8] selection:text-[#0f1115] w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#38bdf8]" />
              The Cosmic <span className="text-[#38bdf8] font-light">Sieve</span>
            </h1>
            <p className="text-slate-500 mt-2 text-xs uppercase tracking-[0.2em]">sovereign.fanstack@gmail.com // Triage Desk</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
            <button
              onClick={handleFetchMailbag}
              disabled={fetching}
              className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f1115] font-bold py-2 px-4 rounded uppercase tracking-[0.1em] text-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg active:scale-95 animate-fade-in"
            >
              {fetching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {fetching ? 'Sweeping...' : 'Fetch Inbound Mailbag'}
            </button>
            {feedback && (
              <span className="text-xs text-[#38bdf8] uppercase tracking-wider animate-pulse">
                {feedback}
              </span>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20 text-[#38bdf8] animate-pulse uppercase tracking-[0.2em] text-sm">
            Syncing inbound packets...
          </div>
        ) : emails.length === 0 ? (
          <div className="border border-slate-800 bg-[#161920] p-12 text-center rounded text-slate-500 flex flex-col items-center justify-center">
             <ShieldCheck className="w-16 h-16 mb-4 opacity-50 text-emerald-400" />
             <div className="uppercase tracking-[0.2em] font-bold">Mailbox Secure</div>
             <div className="text-xs mt-2">Zero unhandled promotions.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => {
              const displaySubject = email.subject || email.headline || "Untitled Message";
              const displaySender = email.sender || email.source || "Unknown Sender";
              const displayBody = email.body || email.details || email.raw_text || "";
              const displayDate = email.date || "Just now";

              return (
                <div key={email.id} className="border border-slate-800 bg-[#161920] rounded p-6 group hover:border-[#38bdf8]/50 transition-colors shadow-lg">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <MailOpen className="w-5 h-5 text-[#38bdf8]" />
                         <div>
                            <div className="text-white font-bold tracking-wide">{displaySubject}</div>
                            <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{displaySender} <span className="mx-2 text-slate-700">|</span> {displayDate}</div>
                         </div>
                      </div>
                   </div>
                   <div className="bg-black/40 border border-white/5 rounded p-4 text-sm text-slate-300 mb-6 h-32 overflow-y-auto font-sans whitespace-pre-wrap">
                      {displayBody}
                   </div>
                   <div className="flex gap-4">
                      <button 
                         onClick={() => handleAction(email.id, 'keep')}
                         className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-[0.1em] text-xs py-3 rounded flex items-center justify-center gap-2 transition-all font-bold cursor-pointer"
                      >
                         <CheckSquare className="w-4 h-4" /> Keep / Inject Context
                      </button>
                      <button 
                         onClick={() => handleAction(email.id, 'trash')}
                         className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-[0.1em] text-xs py-3 rounded flex items-center justify-center gap-2 transition-all font-bold cursor-pointer"
                      >
                         <Trash2 className="w-4 h-4" /> Trash (Burn)
                      </button>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
