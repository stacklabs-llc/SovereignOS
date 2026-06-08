import React, { useState, useEffect } from 'react';
import { Flame, CheckSquare, Trash2, ShieldCheck, RefreshCw, MessageSquare, AlertTriangle, Sparkles, Folder } from 'lucide-react';

interface HateMail {
  id: string;
  source?: string;
  headline?: string;
  details?: string;
  raw_text?: string;
  persona?: string;
  date?: string;
  subject?: string;
  body?: string;
}


export default function HateMailInbox() {
  const [mails, setMails] = useState<HateMail[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'barf' | 'shoheisghost' | 'unclesteviestan'>('all');

  const loadHateMail = () => {
    fetch('/api/hate-mail')
      .then(res => res.json())
      .then(data => setMails(data))
      .catch(err => {
         console.warn("Failed to fetch hate mail from API", err);
         setMails([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHateMail();
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
      setFeedback(`Swept successfully! Staged: ${data.hate_mail_staged || 0} detractors.`);
      loadHateMail();
    } catch (err) {
      console.error(err);
      setFeedback("Failed to sweep mailbag. Make sure the API is running.");
    } finally {
      setFetching(false);
    }
  };

  const handleAction = async (id: string, action: 'keep' | 'trash') => {
    setMails(prev => prev.filter(e => e.id !== id));
    try {
      await fetch(`/api/hate-mail/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'keep' ? 'inject_global' : 'trash' })
      });
    } catch (err) {
      console.error("Failed to perform hate mail action:", err);
    }
  };

  // Helper to extract username from email headline/subject
  const parseUsername = (email: HateMail) => {
    const head = email.headline || "";
    const userMatch = head.match(/u\/([\w\-_]+)/);
    if (userMatch) return `u/${userMatch[1]}`;
    if (email.source && email.source.includes('<')) {
      const emailMatch = email.source.match(/<([^>]+)>/);
      return emailMatch ? emailMatch[1] : email.source;
    }
    return email.source || "detractor";
  };

  // Sarcastic retort & sentiment builder
  const getBanterProfile = (comment: string) => {
    const commentLower = comment.toLowerCase ? comment.toLowerCase() : "";
    
    if (commentLower.includes("go outside") || commentLower.includes("touch grass")) {
      return {
        sentiment: "Hostile / Grassy Outage",
        retort: "Remind them grass doesn't grow inside PNC Park's luxury suites anyway."
      };
    }
    if (commentLower.includes("wendy's")) {
      return {
        sentiment: "Meme-Rot / Unoriginal",
        retort: "Order a 4-for-4 and pay with Bob Nutting's luxury tax refund check."
      };
    }
    if (commentLower.includes("wat") || commentLower.includes("miss something") || commentLower.includes("what")) {
      return {
        sentiment: "Confused / Yinzer Slumber",
        retort: "Draw a diagram showing how luxury tax checks route directly into Nutting's trust fund."
      };
    }
    if (commentLower.includes("january") || commentLower.includes("calendar")) {
      return {
        sentiment: "Analytical / Calendar-Challenged",
        retort: "Explain that baseball welfare grifting is a year-round, multi-seasonal business."
      };
    }
    return {
      sentiment: "Sarcastic / Snarky",
      retort: "Tell them Stevie Cohen's luxury tax funded their electricity bill today."
    };
  };

  const filteredMails = mails.filter(e => {
    if (activeTab === 'all') return true;
    return (e.persona || '').toLowerCase() === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#cbd5e1] font-mono p-4 md:p-8 selection:bg-rose-500 selection:text-white w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-rose-950 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <Flame className="w-8 h-8 text-rose-500 animate-pulse" />
              Detractor <span className="text-rose-500 font-light">Mailbag</span>
            </h1>
            <p className="text-slate-500 mt-2 text-xs uppercase tracking-[0.2em]">High-Velocity Triage Desk for Reddit Banter</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
            <button
              onClick={handleFetchMailbag}
              disabled={fetching}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded uppercase tracking-[0.1em] text-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg active:scale-95 animate-fade-in"
            >
              <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Sweeping Mail...' : 'Fetch Detractor Mailbag'}
            </button>
            {feedback && (
              <span className="text-xs text-rose-400 uppercase tracking-wider animate-pulse">
                {feedback}
              </span>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-1 mb-6">
          {(['all', 'barf', 'shoheisghost', 'unclesteviestan'] as const).map((tab) => {
            const count = mails.filter(e => tab === 'all' || (e.persona || '').toLowerCase() === tab).length;
            const label = tab === 'all' ? 'All Inboxes' : tab === 'shoheisghost' ? "Shohei's Ghost" : tab === 'unclesteviestan' ? 'Stevie Stan' : 'Barf';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab
                    ? 'border-rose-500 text-white bg-rose-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                {label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-slate-800 bg-[#11141a]/60 rounded p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active Hotbeds</div>
            <div className="text-lg font-bold text-rose-400">r/buccos (Pirates)</div>
          </div>
          <div className="border border-slate-800 bg-[#11141a]/60 rounded p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Average Detractor Sentiment</div>
            <div className="text-lg font-bold text-rose-400">Snarky & Calendar-Challenged</div>
          </div>
          <div className="border border-slate-800 bg-[#11141a]/60 rounded p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Target Account Sweep</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Staging Clean
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-rose-500 animate-pulse uppercase tracking-[0.2em] text-sm">
            Scanning subspace frequencies...
          </div>
        ) : filteredMails.length === 0 ? (
          <div className="border border-rose-950/30 bg-[#13161c] p-12 text-center rounded text-slate-500 flex flex-col items-center justify-center">
             <ShieldCheck className="w-16 h-16 mb-4 opacity-50 text-emerald-400" />
             <div className="uppercase tracking-[0.2em] font-bold text-white">Inbox Peaceful</div>
             <div className="text-xs mt-2 text-slate-500">No detractors in this tab currently staged. Stir up some trouble on Reddit!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMails.map((email) => {
              const displaySubject = email.headline || email.subject || "Reddit Detractor Reply";
              const displaySender = parseUsername(email);
              const displayBody = email.details || email.body || "";
              const profile = getBanterProfile(displayBody);
              const personaLabel = email.persona ? email.persona.toUpperCase() : "BARF";

              return (
                <div key={email.id} className="border border-slate-800 bg-[#11141d] rounded p-6 group hover:border-rose-500/50 transition-colors shadow-lg relative overflow-hidden">
                   {/* Persona Badge */}
                   <div className="absolute top-0 right-0 bg-rose-950 border-l border-b border-rose-800 text-rose-400 font-bold text-[9px] px-3 py-1 uppercase tracking-widest rounded-bl">
                      {personaLabel}
                   </div>
                   
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <MessageSquare className="w-5 h-5 text-rose-500" />
                         <div>
                            <div className="text-white font-bold tracking-wide mr-16">{displaySubject}</div>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{displaySender}</div>
                         </div>
                      </div>
                   </div>
                   
                   {/* Detractor Comment */}
                   <div className="bg-black/50 border border-slate-900 rounded p-4 text-xs text-rose-100/90 mb-4 font-mono whitespace-pre-wrap">
                      <span className="text-rose-500 font-bold mr-1">&gt;</span> "{displayBody}"
                   </div>

                   {/* AI Classification & Suggested Counter-Retort */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-[11px] font-sans">
                     <div className="bg-rose-950/20 border border-rose-900/30 rounded p-3 flex flex-col gap-1">
                       <span className="text-[9px] uppercase tracking-wider text-rose-400 font-mono font-bold flex items-center gap-1">
                         <AlertTriangle className="w-3 h-3" /> Detractor Classification
                       </span>
                       <span className="text-slate-300">{profile.sentiment}</span>
                     </div>
                     <div className="bg-emerald-950/20 border border-emerald-900/30 rounded p-3 flex flex-col gap-1">
                       <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold flex items-center gap-1">
                         <Sparkles className="w-3 h-3" /> Live-Banter Counter-Retort Strategy
                       </span>
                       <span className="text-slate-300 italic">"{profile.retort}"</span>
                     </div>
                   </div>

                   {/* Actions */}
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
